"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  ComposedChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
  ReferenceArea,
} from "recharts";
import {
  PROVIDER_COLORS,
  PROVIDER_LABELS,
  blendedPrice,
  type LLMModel,
  type Provider,
} from "../data/llm-data";

// ── Props ────────────────────────────────────────────────────
interface ParetoChartProps {
  models: LLMModel[];
}

// ── Axis config ──────────────────────────────────────────────
const PRICE_MIN = 0.05;
const SCORE_MIN = 1050;
const SCORE_MAX = 1600;
const PRICE_TICKS = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50];
const SCORE_TICKS = [1100, 1200, 1300, 1400, 1500, 1600];

// ── Chart margins (for label positioning) ────────────────────
const CHART_MARGIN = { top: 8, right: 30, bottom: 40, left: 60 };

// ── Pareto frontier computation ──────────────────────────────
function computeParetoFrontier(models: LLMModel[]): LLMModel[] {
  const sorted = [...models].sort((a, b) => blendedPrice(a) - blendedPrice(b));
  const frontier: LLMModel[] = [];
  let bestScore = -Infinity;

  for (const model of sorted) {
    if (model.arenaScore > bestScore) {
      bestScore = model.arenaScore;
      frontier.push(model);
    }
  }

  return frontier;
}

// ── Format helpers ───────────────────────────────────────────
function formatPrice(price: number): string {
  if (price >= 1) return `$${price.toFixed(price >= 10 ? 0 : 1)}`;
  return `$${price.toFixed(2)}`;
}

// ── Custom Tooltip ───────────────────────────────────────────
interface CustomTooltipProps {
  active?: boolean;
  hoveredModel?: LLMModel | null;
}

function CustomTooltip({ active, hoveredModel }: CustomTooltipProps) {
  if (!active || !hoveredModel) return null;

  return (
    <div className="rounded-lg border border-white/10 bg-gray-900/95 px-3 py-2 text-xs shadow-xl backdrop-blur-sm">
      <div className="mb-2 font-medium text-gray-100">
        {hoveredModel.name} — ${blendedPrice(hoveredModel).toFixed(2)}/1M
      </div>
      <div className="flex flex-col gap-0.5 text-gray-400">
        <span>
          <span className="text-gray-300">Arena:</span> {hoveredModel.arenaScore}
        </span>
        <span>
          <span className="text-gray-300">Blended price:</span> ${blendedPrice(hoveredModel).toFixed(2)}/1M
        </span>
        <span>
          <span className="text-gray-300">Input:</span> ${hoveredModel.inputPrice}/1M
        </span>
        <span>
          <span className="text-gray-300">Output:</span> ${hoveredModel.outputPrice}/1M
        </span>
        {hoveredModel.throughput != null && (
          <span>
            <span className="text-gray-300">Throughput:</span> {hoveredModel.throughput} tok/s
          </span>
        )}
        <span className="mt-0.5 flex items-center gap-1">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: PROVIDER_COLORS[hoveredModel.provider] }}
          />
          {PROVIDER_LABELS[hoveredModel.provider]}
        </span>
      </div>
    </div>
  );
}

// ── Custom Scatter Dot ───────────────────────────────────────
interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: LLMModel;
  hoveredModel: LLMModel | null;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
}

function CustomDot({ cx, cy, payload, hoveredModel, onMouseEnter, onMouseLeave }: CustomDotProps) {
  if (cx == null || cy == null || !payload) return null;
  const isHovered = hoveredModel?.name === payload.name;

  return (
    <circle
      cx={cx}
      cy={cy}
      r={isHovered ? 6 : 4}
      fill={PROVIDER_COLORS[payload.provider]}
      opacity={isHovered ? 1 : 0.7}
      style={{ cursor: "pointer", transition: "all 150ms" }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    />
  );
}

export default function ParetoChart({ models }: ParetoChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartWrapperRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [hoveredModel, setHoveredModel] = useState<LLMModel | null>(null);
  const [selectedProviders, setSelectedProviders] = useState<Set<Provider>>(
    new Set(),
  );
  const [minThroughput, setMinThroughput] = useState<number>(0);

  // ── Zoom state ──
  const [zoomDomain, setZoomDomain] = useState<{
    x1: number;
    x2: number;
    y1: number;
    y2: number;
  } | null>(null);
  const [refAreaLeft, setRefAreaLeft] = useState<number | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<number | null>(null);
  const [refAreaTop, setRefAreaTop] = useState<number | null>(null);
  const [refAreaBottom, setRefAreaBottom] = useState<number | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);

  // Mutable refs for panning so mousemove/mouseup always read current values
  const isPanningRef = useRef(false);
  const panStartPixelRef = useRef<{ px: number; py: number } | null>(null);
  const panStartDomainRef = useRef<{
    x1: number;
    x2: number;
    y1: number;
    y2: number;
  } | null>(null);

  // Track container size with ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({
          width: entry.contentRect.width,
          height: Math.max(entry.contentRect.height, 400),
        });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Filter models by selected providers and minimum throughput (exclude $0 price models for log scale)
  const filteredModels = useMemo(() => {
    const priced = models.filter(
      (m) => m.inputPrice > 0 || m.outputPrice > 0,
    );
    let result = selectedProviders.size === 0 ? priced : priced.filter((m) => selectedProviders.has(m.provider));
    if (minThroughput > 0) {
      result = result.filter((m) => m.throughput == null || m.throughput >= minThroughput);
    }
    return result;
  }, [models, selectedProviders, minThroughput]);

  // Compute pareto frontier
  const paretoFrontier = useMemo(
    () => computeParetoFrontier(filteredModels),
    [filteredModels],
  );

  // Auto-compute price axis max from filtered data (with 10% margin,
  // snapped to the next available tick value)
  const priceMax = useMemo(() => {
    if (filteredModels.length === 0)
      return PRICE_TICKS[PRICE_TICKS.length - 1];
    const maxPrice = Math.max(...filteredModels.map(blendedPrice));
    const target = maxPrice * 1.1;
    return (
      PRICE_TICKS.find((t) => t >= target) ??
      PRICE_TICKS[PRICE_TICKS.length - 1]
    );
  }, [filteredModels]);

  // Effective domain (zoom or full)
  const xDomain = useMemo<[number, number]>(() => {
    if (zoomDomain) return [zoomDomain.x1, zoomDomain.x2];
    return [PRICE_MIN, priceMax];
  }, [zoomDomain, priceMax]);

  const yDomain = useMemo<[number, number]>(() => {
    if (zoomDomain) return [zoomDomain.y1, zoomDomain.y2];
    return [SCORE_MIN, SCORE_MAX];
  }, [zoomDomain]);

  // Prepare scatter data (filtered to visible zoom domain)
  const scatterData = useMemo(
    () =>
      filteredModels
        .map((model) => ({
          x: blendedPrice(model),
          y: model.arenaScore,
          ...model,
        }))
        .filter(
          (p) =>
            p.x >= xDomain[0] &&
            p.x <= xDomain[1] &&
            p.y >= yDomain[0] &&
            p.y <= yDomain[1]
        ),
    [filteredModels, xDomain, yDomain]
  );

  // Prepare pareto line data (filtered to visible zoom domain)
  const paretoData = useMemo(
    () =>
      paretoFrontier
        .map((model) => ({
          x: blendedPrice(model),
          y: model.arenaScore,
          ...model,
        }))
        .filter(
          (p) =>
            p.x >= xDomain[0] &&
            p.x <= xDomain[1] &&
            p.y >= yDomain[0] &&
            p.y <= yDomain[1]
        ),
    [paretoFrontier, xDomain, yDomain]
  );

  // ── Mouse interaction for zoom ──
  const getDataCoordinate = useCallback((e: MouseEvent): { x: number; y: number } | null => {
    if (!chartWrapperRef.current) return null;
    const svg = chartWrapperRef.current.querySelector("svg");
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const left = CHART_MARGIN.left;
    const right = CHART_MARGIN.right;
    const top = CHART_MARGIN.top;
    const bottom = CHART_MARGIN.bottom;

    const plotWidth = rect.width - left - right;
    const plotHeight = rect.height - top - bottom;

    if (px < left || px > rect.width - right || py < top || py > rect.height - bottom) {
      return null;
    }

    const relX = (px - left) / plotWidth;
    const relY = (py - top) / plotHeight;

    const logMin = Math.log10(xDomain[0]);
    const logMax = Math.log10(xDomain[1]);
    const x = Math.pow(10, logMin + relX * (logMax - logMin));
    const y = yDomain[1] - relY * (yDomain[1] - yDomain[0]);
    return { x, y };
  }, [xDomain, yDomain]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (zoomDomain) {
      const svg = chartWrapperRef.current?.querySelector("svg");
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      isPanningRef.current = true;
      panStartPixelRef.current = { px: e.clientX - rect.left, py: e.clientY - rect.top };
      panStartDomainRef.current = zoomDomain;
      return;
    }
    const coords = getDataCoordinate(e.nativeEvent);
    if (!coords) return;
    setIsSelecting(true);
    setRefAreaLeft(coords.x);
    setRefAreaRight(coords.x);
    setRefAreaTop(coords.y);
    setRefAreaBottom(coords.y);
  }, [zoomDomain, getDataCoordinate]);

  // Convert pixel offset to data offset and apply to domain
  const applyPan = useCallback(
    (currentPixelX: number, currentPixelY: number) => {
      if (!chartWrapperRef.current || !panStartDomainRef.current || !panStartPixelRef.current) return;
      const svg = chartWrapperRef.current.querySelector("svg");
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const plotWidth = rect.width - CHART_MARGIN.left - CHART_MARGIN.right;
      const plotHeight = rect.height - CHART_MARGIN.top - CHART_MARGIN.bottom;

      const { px: startPx, py: startPy } = panStartPixelRef.current;
      const { x1: sX1, x2: sX2, y1: sY1, y2: sY2 } = panStartDomainRef.current;

      const dxPixel = currentPixelX - startPx;
      const dyPixel = currentPixelY - startPy;

      // X axis is log scale; convert from pixel shift to data shift
      const logMin = Math.log10(sX1);
      const logMax = Math.log10(sX2);
      const dataPerPixelX = (logMax - logMin) / plotWidth;
      const newLogMin = logMin - dxPixel * dataPerPixelX;
      const newLogMax = logMax - dxPixel * dataPerPixelX;
      const newX1 = Math.pow(10, newLogMin);
      const newX2 = Math.pow(10, newLogMax);

      // Y axis is linear
      const dataPerPixelY = (sY2 - sY1) / plotHeight;
      const newY1 = sY1 + dyPixel * dataPerPixelY;
      const newY2 = sY2 + dyPixel * dataPerPixelY;

      // Clamp to global bounds
      const clampedX1 = Math.max(newX1, PRICE_MIN * 0.5);
      const clampedX2 = Math.min(newX2, priceMax * 2);
      const clampedY1 = Math.max(newY1, SCORE_MIN - 100);
      const clampedY2 = Math.min(newY2, SCORE_MAX + 100);

      setZoomDomain({ x1: clampedX1, x2: clampedX2, y1: clampedY1, y2: clampedY2 });
    },
    [priceMax],
  );

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isPanningRef.current && panStartPixelRef.current) {
      const svg = chartWrapperRef.current?.querySelector("svg");
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      applyPan(e.clientX - rect.left, e.clientY - rect.top);
      return;
    }
    if (!isSelecting || refAreaLeft == null || refAreaTop == null) return;
    const coords = getDataCoordinate(e);
    if (!coords) return;
    setRefAreaRight(coords.x);
    setRefAreaTop(coords.y);
    setRefAreaBottom(coords.y);
  }, [isSelecting, refAreaLeft, refAreaTop, applyPan, getDataCoordinate]);

  const handleMouseUp = useCallback(() => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      panStartPixelRef.current = null;
      panStartDomainRef.current = null;
      return;
    }
    if (!isSelecting || refAreaLeft == null || refAreaRight == null || refAreaTop == null || refAreaBottom == null) {
      setIsSelecting(false);
      setRefAreaLeft(null);
      setRefAreaRight(null);
      setRefAreaTop(null);
      setRefAreaBottom(null);
      return;
    }

    const left = Math.min(refAreaLeft, refAreaRight);
    const right = Math.max(refAreaLeft, refAreaRight);
    const bottom = Math.min(refAreaTop, refAreaBottom);
    const top = Math.max(refAreaTop, refAreaBottom);

    // Require a minimum selection size to avoid accidental zoom
    if (right / left < 1.05 || top - bottom < 5) {
      setIsSelecting(false);
      setRefAreaLeft(null);
      setRefAreaRight(null);
      setRefAreaTop(null);
      setRefAreaBottom(null);
      return;
    }

    setZoomDomain({ x1: left, x2: right, y1: bottom, y2: top });
    setIsSelecting(false);
    setRefAreaLeft(null);
    setRefAreaRight(null);
    setRefAreaTop(null);
    setRefAreaBottom(null);
  }, [isSelecting, refAreaLeft, refAreaRight, refAreaTop, refAreaBottom]);

  // Attach global mouse event listeners for selection / panning
  useEffect(() => {
    const onMove = (e: MouseEvent) => handleMouseMove(e);
    const onUp = () => handleMouseUp();
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // ── Wheel zoom ──
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    if (!chartWrapperRef.current) return;
    const svg = chartWrapperRef.current.querySelector("svg");
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const left = CHART_MARGIN.left;
    const right = CHART_MARGIN.right;
    const top = CHART_MARGIN.top;
    const bottom = CHART_MARGIN.bottom;

    const plotWidth = rect.width - left - right;
    const plotHeight = rect.height - top - bottom;

    if (px < left || px > rect.width - right || py < top || py > rect.height - bottom) {
      return;
    }

    const relX = (px - left) / plotWidth;
    const relY = (py - top) / plotHeight;

    // Convert to data coordinates using current zoom domain (or full domain)
    const effectiveX1 = zoomDomain?.x1 ?? xDomain[0];
    const effectiveX2 = zoomDomain?.x2 ?? xDomain[1];
    const effectiveY1 = zoomDomain?.y1 ?? yDomain[0];
    const effectiveY2 = zoomDomain?.y2 ?? yDomain[1];

    const xLogMin = Math.log10(effectiveX1);
    const xLogMax = Math.log10(effectiveX2);
    const focusX = Math.pow(10, xLogMin + relX * (xLogMax - xLogMin));
    const focusY = effectiveY2 - relY * (effectiveY2 - effectiveY1);

    const zoomFactor = e.deltaY < 0 ? 0.8 : 1.25;
    const currentX1 = zoomDomain?.x1 ?? PRICE_MIN;
    const currentX2 = zoomDomain?.x2 ?? priceMax;
    const currentY1 = zoomDomain?.y1 ?? SCORE_MIN;
    const currentY2 = zoomDomain?.y2 ?? SCORE_MAX;

    // Zoom X centered on focus
    const xRatio = (focusX - currentX1) / (currentX2 - currentX1);
    const newXRange = (currentX2 - currentX1) * zoomFactor;
    const newX1 = focusX - xRatio * newXRange;
    const newX2 = focusX + (1 - xRatio) * newXRange;

    // Zoom Y centered on focus
    const yRatio = (currentY2 - focusY) / (currentY2 - currentY1);
    const newYRange = (currentY2 - currentY1) * zoomFactor;
    const newY1 = focusY - (1 - yRatio) * newYRange;
    const newY2 = focusY + yRatio * newYRange;

    // Clamp to bounds
    const clampedX1 = Math.max(newX1, PRICE_MIN * 0.5);
    const clampedX2 = Math.min(newX2, priceMax * 2);
    const clampedY1 = Math.max(newY1, SCORE_MIN - 50);
    const clampedY2 = Math.min(newY2, SCORE_MAX + 50);

    if (clampedX1 < clampedX2 && clampedY1 < clampedY2) {
      setZoomDomain({ x1: clampedX1, x2: clampedX2, y1: clampedY1, y2: clampedY2 });
    }
  }, [xDomain, yDomain, zoomDomain, priceMax]);

  // ── Zoom buttons ──
  const handleZoomIn = useCallback(() => {
    const currentX1 = zoomDomain?.x1 ?? PRICE_MIN;
    const currentX2 = zoomDomain?.x2 ?? priceMax;
    const currentY1 = zoomDomain?.y1 ?? SCORE_MIN;
    const currentY2 = zoomDomain?.y2 ?? SCORE_MAX;
    const zoomFactor = 0.95;
    const centerX = (currentX1 + currentX2) / 2;
    const centerY = (currentY1 + currentY2) / 2;
    const newXRange = (currentX2 - currentX1) * zoomFactor;
    const newYRange = (currentY2 - currentY1) * zoomFactor;
    setZoomDomain({
      x1: centerX - newXRange / 2,
      x2: centerX + newXRange / 2,
      y1: centerY - newYRange / 2,
      y2: centerY + newYRange / 2,
    });
  }, [zoomDomain, priceMax]);

  const handleZoomOut = useCallback(() => {
    const currentX1 = zoomDomain?.x1 ?? PRICE_MIN;
    const currentX2 = zoomDomain?.x2 ?? priceMax;
    const currentY1 = zoomDomain?.y1 ?? SCORE_MIN;
    const currentY2 = zoomDomain?.y2 ?? SCORE_MAX;

    const newX1 = currentX1 - (currentX2 - currentX1) * 0.5;
    const newX2 = currentX2 + (currentX2 - currentX1) * 0.5;
    const newY1 = currentY1 - (currentY2 - currentY1) * 0.5;
    const newY2 = currentY2 + (currentY2 - currentY1) * 0.5;

    if (newX1 <= PRICE_MIN && newX2 >= priceMax && newY1 <= SCORE_MIN && newY2 >= SCORE_MAX) {
      setZoomDomain(null);
      return;
    }

    setZoomDomain({
      x1: Math.max(newX1, PRICE_MIN * 0.5),
      x2: Math.min(newX2, priceMax * 2),
      y1: Math.max(newY1, SCORE_MIN - 100),
      y2: Math.min(newY2, SCORE_MAX + 100),
    });
  }, [zoomDomain, priceMax]);

  const handleResetZoom = useCallback(() => {
    setZoomDomain(null);
  }, []);

  // Register native wheel listener on container (chartWrapper may not exist on first render)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  // Get all providers
  const providers = useMemo(() => {
    const set = new Set<Provider>();
    models.forEach((m) => set.add(m.provider));
    return Array.from(set).sort();
  }, [models]);

  // Compute throughput range from all models
  const throughputRange = useMemo(() => {
    const values = models.map((m) => m.throughput).filter(
      (t): t is number => t != null && t > 0,
    );
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [models]);

  // Preset throughput thresholds
  const THROUGHPUT_PRESETS = [0, 30, 40, 50, 100, 150];

  const toggleProvider = (provider: Provider) => {
    setSelectedProviders((prev) => {
      const next = new Set(prev);
      if (next.has(provider)) {
        next.delete(provider);
      } else {
        next.add(provider);
      }
      return next;
    });
  };

  // Custom shape renderer for scatter
  const renderDot = useCallback(
    (props: { cx?: number; cy?: number; payload?: LLMModel }) => (
      <CustomDot
        {...props}
        hoveredModel={hoveredModel}
        onMouseEnter={() => props.payload && setHoveredModel(props.payload)}
        onMouseLeave={() => setHoveredModel(null)}
      />
    ),
    [hoveredModel],
  );

  // Chart height based on container and viewport
  const [viewportHeight, setViewportHeight] = useState(0);
  useEffect(() => {
    const updateHeight = () => setViewportHeight(window.innerHeight);
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  const maxHeight = Math.max(viewportHeight - 280, 300);
  const chartHeight = Math.min(
    Math.max(containerSize.height, 400),
    maxHeight,
  );

  return (
      <div className="flex min-w-0 flex-1 flex-col p-2 sm:p-2">

      {/* Provider filter chips */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {providers.map((provider) => {
          const active =
            selectedProviders.size === 0 || selectedProviders.has(provider);
          return (
            <button
              key={provider}
              onClick={() => toggleProvider(provider)}
              className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-sm transition-colors"
              style={{
                borderColor: active
                  ? PROVIDER_COLORS[provider]
                  : "rgba(255,255,255,0.1)",
                backgroundColor: active
                  ? `${PROVIDER_COLORS[provider]}22`
                  : "transparent",
                color: active
                  ? PROVIDER_COLORS[provider]
                  : "rgba(255,255,255,0.3)",
              }}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: PROVIDER_COLORS[provider] }}
              />
              {PROVIDER_LABELS[provider]}
            </button>
          );
        })}
        {selectedProviders.size > 0 && (
          <button
            onClick={() => setSelectedProviders(new Set())}
            className="rounded-md border border-white/10 px-2 py-1 text-sm text-gray-400 transition-colors hover:text-gray-200"
          >
            Clear
          </button>
        )}
      </div>

      {/* Throughput filter */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-gray-400">
          Min Throughput:
        </span>
        <div className="flex flex-wrap gap-1">
          {THROUGHPUT_PRESETS.map((value) => {
            const active = minThroughput === value;
            return (
              <button
                key={value}
                onClick={() => setMinThroughput(value)}
                className={`rounded-md border px-2 py-0.5 text-sm transition-colors ${
                  active
                    ? "border-blue-500/60 bg-blue-500/20 text-blue-400"
                    : "border-white/10 text-gray-500 hover:text-gray-300"
                }`}
              >
                {value === 0 ? "All" : `${value}+`}
              </button>
            );
          })}
        </div>
        <input
          type="range"
          min={throughputRange.min}
          max={throughputRange.max}
          step={1}
          value={minThroughput || throughputRange.min}
          onChange={(e) => setMinThroughput(Number(e.target.value))}
          className="throughput-slider h-1.5 w-48 cursor-pointer accent-blue-500 sm:w-64 lg:w-80"
          title={`Min throughput: ${minThroughput} tok/s`}
        />
        {minThroughput > 0 && (
          <span className="text-sm text-gray-500">
            ≥{minThroughput} tok/s
          </span>
        )}
      </div>

      {/* Zoom controls */}
      <div className="mb-2 flex items-center gap-2">
        <button
          onClick={handleZoomIn}
          className="rounded-md border border-white/10 bg-gray-800/50 px-2 py-1 text-xs text-gray-300 transition-colors hover:bg-gray-700/50"
          title="Zoom in"
        >
          +
        </button>
        <button
          onClick={handleZoomOut}
          className="rounded-md border border-white/10 bg-gray-800/50 px-2 py-1 text-xs text-gray-300 transition-colors hover:bg-gray-700/50"
          title="Zoom out"
        >
          −
        </button>
        {zoomDomain != null && (
          <button
            onClick={handleResetZoom}
            className="rounded-md border border-white/10 bg-blue-600/20 px-2 py-1 text-xs text-blue-300 transition-colors hover:bg-blue-600/30"
            title="Reset zoom"
          >
            Reset
          </button>
        )}
        <span className="ml-1 text-[11px] text-gray-500">
          {zoomDomain ? "Drag to pan • Scroll to zoom • Click without zoom → select area" : "Drag to select area • Scroll wheel • Zoom-out to unselect"}
        </span>
      </div>

      {/* Chart */}
      <div
        ref={containerRef}
        className={`relative min-h-[400px] flex-1 overflow-hidden ${isSelecting ? "cursor-crosshair" : zoomDomain ? "cursor-grab" : "cursor-default"}`}
      >
        {containerSize.width > 0 && (
          <div ref={chartWrapperRef} onMouseDown={handleMouseDown}>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <ComposedChart margin={CHART_MARGIN}>
                <CartesianGrid
                  strokeDasharray="4,4"
                  stroke="rgba(255,255,255,0.12)"
                />

                <XAxis
                  type="number"
                  dataKey="x"
                  scale="log"
                  domain={[xDomain[0], xDomain[1]]}
                  ticks={PRICE_TICKS.filter((t) => t >= xDomain[0] && t <= xDomain[1])}
                  tickFormatter={formatPrice}
                  tick={{ fill: "#eeeef0", fontSize: 13 }}
                  stroke="rgba(255,255,255,0.2)"
                  label={{
                    value: "Blended price per 1M tokens (3:1 Ratio)",
                    position: "insideBottom",
                    offset: -10,
                    fill: "#9ca3af",
                    fontSize: 13,
                  }}
                />

                <YAxis
                  type="number"
                  dataKey="y"
                  domain={[yDomain[0], yDomain[1]]}
                  ticks={SCORE_TICKS.filter((t) => t >= yDomain[0] && t <= yDomain[1])}
                  tick={{ fill: "#eeeef0", fontSize: 13 }}
                  stroke="rgba(255,255,255,0.2)"
                  label={{
                    value: "Arena Score",
                    angle: -90,
                    position: "insideLeft",
                    offset: 10,
                    fill: "#eeeef0",
                    fontSize: 14,
                  }}
                />

                <ZAxis range={[1, 1]} />

                <Tooltip
                  content={<CustomTooltip hoveredModel={hoveredModel} />}
                  active={hoveredModel !== null}
                  cursor={{
                    strokeDasharray: "3,3",
                    stroke: "rgba(255,255,255,0.3)",
                  }}
                />

                {/* Selection area overlay */}
                {isSelecting && refAreaLeft != null && refAreaRight != null && refAreaTop != null && refAreaBottom != null && (
                  <ReferenceArea
                    x1={Math.min(refAreaLeft, refAreaRight)}
                    x2={Math.max(refAreaLeft, refAreaRight)}
                    y1={Math.min(refAreaTop, refAreaBottom)}
                    y2={Math.max(refAreaTop, refAreaBottom)}
                    stroke="rgba(59,130,246,0.6)"
                    fill="rgba(59,130,246,0.08)"
                    strokeWidth={1}
                    strokeDasharray="3,3"
                  />
                )}

                {/* Scatter plot for all models */}
                <Scatter
                  name="Models"
                  data={scatterData}
                  shape={renderDot}
                />

                {/* Pareto frontier line */}
                {paretoData.length >= 2 && (
                  <Scatter
                    name="Pareto Frontier"
                    data={paretoData}
                    line={{ stroke: '#40b841', strokeWidth: 2.5 }}
                    shape={(props: { cx?: number; cy?: number; payload?: LLMModel }) => {
                      const { cx, cy, payload } = props;
                      if (cx == null || cy == null || !payload?.provider) return null;
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={hoveredModel?.name === payload.name ? 7 : 5}
                          fill={PROVIDER_COLORS[payload.provider]}
                          opacity={hoveredModel?.name === payload.name ? 1 : 0.9}
                          stroke={hoveredModel?.name === payload.name ? '#ffffff' : 'none'}
                          strokeWidth={hoveredModel?.name === payload.name ? 1.5 : 0}
                          style={{ cursor: 'pointer', transition: 'all 150ms' }}
                          onMouseEnter={() => {
                            setHoveredModel(payload);
                          }}
                          onMouseLeave={() => setHoveredModel(null)}
                        />
                      );
                    }}
                    isAnimationActive={false}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
