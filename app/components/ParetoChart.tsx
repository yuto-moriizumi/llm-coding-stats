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
  selectedModel?: LLMModel | null;
  onSelectModel?: (model: LLMModel) => void;
}

// ── Chart margins (for label positioning) ────────────────────
const CHART_MARGIN = { top: 8, right: 30, bottom: 40, left: 60 };

// ── Tick generation helper ───────────────────────────────────
function generateLinearTicks(min: number, max: number, count = 5): number[] {
  const range = max - min;
  if (range === 0) return [min];
  const step = Math.pow(10, Math.floor(Math.log10(range / count)));
  const candidates = [step, step * 2, step * 2.5, step * 5, step * 10];
  const niceStep = candidates.find((c) => c >= range / count) ?? step;
  const start = Math.floor(min / niceStep) * niceStep;
  const ticks: number[] = [];
  for (let v = start; v <= max + niceStep; v += niceStep) {
    if (v >= min && v <= max) ticks.push(v);
  }
  // Ensure min and max are covered
  if (ticks[0] > min) ticks.unshift(min);
  if (ticks[ticks.length - 1] < max) ticks.push(max);
  return ticks;
}

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
        {hoveredModel.deprecated && (
          <span className="ml-2 rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] text-red-400">
            Deprecated
          </span>
        )}
      </div>
      <div className="flex flex-col gap-0.5 text-gray-400">
        <span>
          <span className="text-gray-300">Arena:</span>{" "}
          {hoveredModel.arenaScore}
        </span>
        <span>
          <span className="text-gray-300">Blended price:</span> $
          {blendedPrice(hoveredModel).toFixed(2)}/1M
        </span>
        <span>
          <span className="text-gray-300">Input:</span> $
          {hoveredModel.inputPrice}/1M
        </span>
        <span>
          <span className="text-gray-300">Output:</span> $
          {hoveredModel.outputPrice}/1M
        </span>
        {hoveredModel.throughput != null && (
          <span>
            <span className="text-gray-300">Throughput:</span>{" "}
            {hoveredModel.throughput} tok/s
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
  selectedModel: LLMModel | null;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
  onSelect?: (model: LLMModel) => void;
}

function CustomDot({
  cx,
  cy,
  payload,
  hoveredModel,
  selectedModel,
  onMouseEnter,
  onMouseLeave,
  onSelect,
}: CustomDotProps) {
  if (cx == null || cy == null || !payload) return null;
  const isHovered = hoveredModel?.name === payload.name;
  const isSelected = selectedModel?.name === payload.name;

  return (
    <g
      style={{
        pointerEvents: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {/* White halo behind dot so line doesn't show through */}
      <circle
        cx={cx}
        cy={cy}
        r={isHovered || isSelected ? 11 : 8}
        fill="#ffffff"
        opacity={isHovered || isSelected ? 0.5 : 0.35}
        style={{ pointerEvents: "none" }}
      />
      {isSelected && (
        <>
          {/* Large colored glow behind selected point */}
          <circle
            cx={cx}
            cy={cy}
            r={16}
            fill={PROVIDER_COLORS[payload.provider]}
            opacity={0.25}
            style={{ pointerEvents: "none" }}
          />
          {/* White outline ring */}
          <circle
            cx={cx}
            cy={cy}
            r={13}
            fill="none"
            stroke="#ffffff"
            strokeWidth={2.5}
            opacity={0.95}
            style={{ pointerEvents: "none" }}
          />
        </>
      )}
      <circle
        cx={cx}
        cy={cy}
        r={isHovered || isSelected ? 9 : 6}
        fill={PROVIDER_COLORS[payload.provider]}
        stroke="#ffffff"
        strokeWidth={isHovered || isSelected ? 2 : 1.5}
        opacity={1}
        style={{
          cursor: "pointer",
          transition: "all 150ms",
          pointerEvents: "all",
          filter: isSelected ? "drop-shadow(0 0 4px rgba(255,255,255,0.8))" : undefined,
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.(payload);
        }}
      />
    </g>
  );
}

export default function ParetoChart({
  models,
  selectedModel: selectedModelProp,
  onSelectModel,
}: ParetoChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartWrapperRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [hoveredModel, setHoveredModel] = useState<LLMModel | null>(null);
  const [selectedProviders, setSelectedProviders] = useState<Set<Provider>>(
    new Set(),
  );
  const [minThroughput, setMinThroughput] = useState<number>(0);
  const [showDeprecated, setShowDeprecated] = useState<boolean>(false);

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

  // Remove tabindex from Recharts SVG to prevent focus ring on click
  useEffect(() => {
    const svg = chartWrapperRef.current?.querySelector('svg');
    if (!svg) return;
    svg.setAttribute('tabindex', '-1');
    
    const handleMouseDown = (e: Event) => {
      if (document.activeElement === svg) {
        e.preventDefault();
        svg.blur();
      }
    };
    svg.addEventListener('mousedown', handleMouseDown);
    return () => svg.removeEventListener('mousedown', handleMouseDown);
  }, []);
  // Filter models by selected providers and minimum throughput (exclude $0 price models for log scale)
  const filteredModels = useMemo(() => {
    const priced = models.filter((m) => m.inputPrice > 0 || m.outputPrice > 0);
    let result =
      selectedProviders.size === 0
        ? priced
        : priced.filter((m) => selectedProviders.has(m.provider));
    if (minThroughput > 0) {
      result = result.filter(
        (m) => m.throughput == null || m.throughput >= minThroughput,
      );
    }
    if (!showDeprecated) {
      result = result.filter((m) => !m.deprecated);
    }
    return result;
  }, [models, selectedProviders, minThroughput, showDeprecated]);

  // Compute pareto frontier
  const paretoFrontier = useMemo(
    () => computeParetoFrontier(filteredModels),
    [filteredModels],
  );

  // Auto-compute price axis range from filtered data (with 5% padding)
  const { priceMin, priceMax } = useMemo(() => {
    if (filteredModels.length === 0) return { priceMin: 0.01, priceMax: 10 };
    const prices = filteredModels.map(blendedPrice);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return { priceMin: min * 0.95, priceMax: max * 1.05 };
  }, [filteredModels]);

  // Auto-compute score range from filtered data
  const { scoreMin, scoreMax, scoreTicks } = useMemo(() => {
    if (filteredModels.length === 0) {
      return { scoreMin: 0, scoreMax: 100, scoreTicks: [0, 50, 100] };
    }
    const scores = filteredModels.map((m) => m.arenaScore);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const pad = (max - min) * 0.05;
    return {
      scoreMin: min - pad,
      scoreMax: max + pad,
      scoreTicks: generateLinearTicks(min - pad, max + pad),
    };
  }, [filteredModels]);

  // Effective domain (zoom or full)
  const xDomain = useMemo<[number, number]>(() => {
    if (zoomDomain) return [zoomDomain.x1, zoomDomain.x2];
    return [priceMin, priceMax];
  }, [zoomDomain, priceMin, priceMax]);

  const yDomain = useMemo<[number, number]>(() => {
    if (zoomDomain) return [zoomDomain.y1, zoomDomain.y2];
    return [scoreMin, scoreMax];
  }, [zoomDomain, scoreMin, scoreMax]);

  // Scatter data: fixed array of all priced models. Hidden ones get NaN coordinates (Recharts skips NaN points).
  const scatterInput = useMemo(() => {
    const priced = models.filter((m) => m.inputPrice > 0 || m.outputPrice > 0);
    const visibleNames = new Set(filteredModels.map((m) => m.name));
    return priced.map((model) => {
      if (!visibleNames.has(model.name)) {
        // NaN causes scale.map(NaN) => null => cx/cy=null => dot skipped by Recharts
        return { ...model, x: NaN, y: NaN };
      }
      return { ...model, x: blendedPrice(model), y: model.arenaScore };
    });
  }, [models, filteredModels]);

  // ── Mouse interaction for zoom ──
  const getDataCoordinate = useCallback(
    (e: MouseEvent): { x: number; y: number } | null => {
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

      if (
        px < left ||
        px > rect.width - right ||
        py < top ||
        py > rect.height - bottom
      ) {
        return null;
      }

      const relX = (px - left) / plotWidth;
      const relY = (py - top) / plotHeight;

      const logMin = Math.log10(xDomain[0]);
      const logMax = Math.log10(xDomain[1]);
      const x = Math.pow(10, logMin + relX * (logMax - logMin));
      const y = yDomain[1] - relY * (yDomain[1] - yDomain[0]);
      return { x, y };
    },
    [xDomain, yDomain],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (zoomDomain) {
        const svg = chartWrapperRef.current?.querySelector("svg");
        if (!svg) return;
        e.preventDefault();
        const rect = svg.getBoundingClientRect();
        isPanningRef.current = true;
        panStartPixelRef.current = {
          px: e.clientX - rect.left,
          py: e.clientY - rect.top,
        };
        panStartDomainRef.current = zoomDomain;
        return;
      }
      const coords = getDataCoordinate(e.nativeEvent);
      if (!coords) return;
      e.preventDefault();
      setIsSelecting(true);
      setRefAreaLeft(coords.x);
      setRefAreaRight(coords.x);
      setRefAreaTop(coords.y);
      setRefAreaBottom(coords.y);
    },
    [zoomDomain, getDataCoordinate],
  );

  // Convert pixel offset to data offset and apply to domain
  const applyPan = useCallback(
    (currentPixelX: number, currentPixelY: number) => {
      if (
        !chartWrapperRef.current ||
        !panStartDomainRef.current ||
        !panStartPixelRef.current
      )
        return;
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
      const clampedX1 = Math.max(newX1, priceMin * 0.5);
      const clampedX2 = Math.min(newX2, priceMax * 2);
      const clampedY1 = Math.max(newY1, scoreMin - 100);
      const clampedY2 = Math.min(newY2, scoreMax + 100);

      setZoomDomain({
        x1: clampedX1,
        x2: clampedX2,
        y1: clampedY1,
        y2: clampedY2,
      });
    },
    [priceMin, priceMax, scoreMin, scoreMax],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
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
    },
    [isSelecting, refAreaLeft, refAreaTop, applyPan, getDataCoordinate],
  );

  const handleMouseUp = useCallback(() => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      panStartPixelRef.current = null;
      panStartDomainRef.current = null;
      return;
    }
    if (
      !isSelecting ||
      refAreaLeft == null ||
      refAreaRight == null ||
      refAreaTop == null ||
      refAreaBottom == null
    ) {
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

  // ── Zoom buttons ──
  const handleZoomIn = useCallback(() => {
    const currentX1 = zoomDomain?.x1 ?? priceMin;
    const currentX2 = zoomDomain?.x2 ?? priceMax;
    const currentY1 = zoomDomain?.y1 ?? scoreMin;
    const currentY2 = zoomDomain?.y2 ?? scoreMax;
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
  }, [zoomDomain, priceMin, priceMax, scoreMin, scoreMax]);

  const handleZoomOut = useCallback(() => {
    const currentX1 = zoomDomain?.x1 ?? priceMin;
    const currentX2 = zoomDomain?.x2 ?? priceMax;
    const currentY1 = zoomDomain?.y1 ?? scoreMin;
    const currentY2 = zoomDomain?.y2 ?? scoreMax;

    const newX1 = currentX1 - (currentX2 - currentX1) * 0.5;
    const newX2 = currentX2 + (currentX2 - currentX1) * 0.5;
    const newY1 = currentY1 - (currentY2 - currentY1) * 0.5;
    const newY2 = currentY2 + (currentY2 - currentY1) * 0.5;

    if (
      newX1 <= priceMin &&
      newX2 >= priceMax &&
      newY1 <= scoreMin &&
      newY2 >= scoreMax
    ) {
      setZoomDomain(null);
      return;
    }

    setZoomDomain({
      x1: Math.max(newX1, priceMin * 0.5),
      x2: Math.min(newX2, priceMax * 2),
      y1: Math.max(newY1, scoreMin - 100),
      y2: Math.min(newY2, scoreMax + 100),
    });
  }, [zoomDomain, priceMin, priceMax, scoreMin, scoreMax]);

  const handleResetZoom = useCallback(() => {
    setZoomDomain(null);
  }, []);

  // Get all providers
  const providers = useMemo(() => {
    const set = new Set<Provider>();
    models.forEach((m) => set.add(m.provider));
    return Array.from(set).sort();
  }, [models]);

  // Compute throughput range from all models
  const throughputRange = useMemo(() => {
    const values = models
      .map((m) => m.throughput)
      .filter((t): t is number => t != null && t > 0);
    return { min: Math.min(...values), max: Math.max(...values) };
  }, [models]);

  // Preset throughput thresholds
  const THROUGHPUT_PRESETS = [0, 30, 40, 50, 100];

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
        selectedModel={selectedModelProp ?? null}
        onMouseEnter={() => props.payload && setHoveredModel(props.payload)}
        onMouseLeave={() => setHoveredModel(null)}
        onSelect={onSelectModel}
      />
    ),
    [hoveredModel, selectedModelProp, onSelectModel],
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
  const chartHeight = Math.min(Math.max(containerSize.height, 400), maxHeight);

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
          max={Math.min(throughputRange.max, 100)}
          step={1}
          value={minThroughput || throughputRange.min}
          onChange={(e) => setMinThroughput(Number(e.target.value))}
          className="throughput-slider h-1.5 w-48 cursor-pointer accent-blue-500 sm:w-64 lg:w-80"
          title={`Min throughput: ${minThroughput} tok/s`}
        />
        {minThroughput > 0 && (
          <span className="text-sm text-gray-500">≥{minThroughput} tok/s</span>
        )}
      </div>

      {/* Deprecated model toggle */}
      <div className="mb-3 flex items-center gap-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-400 transition-colors hover:text-gray-300">
          <input
            type="checkbox"
            checked={showDeprecated}
            onChange={(e) => setShowDeprecated(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-white/20 bg-gray-800 text-blue-500 accent-blue-500"
          />
          Show deprecated models
        </label>
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
          {zoomDomain
            ? "Drag to pan • Click without zoom → select area"
            : "Drag to select area • Zoom-out to unselect"}
        </span>
      </div>

      {/* Chart */}
      <div
        ref={containerRef}
        className={`relative min-h-[400px] flex-1 select-none overflow-hidden ${isSelecting ? "cursor-crosshair" : zoomDomain ? "cursor-grab" : "cursor-default"}`}
      >
        {containerSize.width > 0 && (
          <div
            ref={chartWrapperRef}
            className="select-none [&_svg]:outline-none [&_svg]:focus:outline-none"
            style={{ outline: "none" }}
            onMouseDown={handleMouseDown}
          >
            <ResponsiveContainer width="100%" height={chartHeight}>
              <ComposedChart margin={CHART_MARGIN} style={{ outline: "none" }} accessibilityLayer={false}>
                <CartesianGrid
                  strokeDasharray="4,4"
                  stroke="rgba(255,255,255,0.12)"
                />

                <XAxis
                  type="number"
                  dataKey="x"
                  scale="log"
                  domain={[xDomain[0], xDomain[1]]}
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
                  allowDataOverflow
                />

                <YAxis
                  type="number"
                  dataKey="y"
                  domain={[yDomain[0], yDomain[1]]}
                  ticks={scoreTicks.filter(
                    (t) => t >= yDomain[0] && t <= yDomain[1],
                  )}
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
                  allowDataOverflow
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
                {isSelecting &&
                  refAreaLeft != null &&
                  refAreaRight != null &&
                  refAreaTop != null &&
                  refAreaBottom != null && (
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

                {/* Pareto frontier line */}
                {paretoFrontier.length >= 2 && (
                  <Scatter
                    name="Pareto Frontier"
                    data={paretoFrontier.map((model) => ({
                      x: blendedPrice(model),
                      y: model.arenaScore,
                      ...model,
                    }))}
                    zIndex={1}
                    line={{ stroke: "#40b841", strokeWidth: 2.5, opacity: 0.8 }}
                    shape={() => null}
                    isAnimationActive={false}
                  />
                )}

                {/* Scatter plot for all models — fixed array so Recharts animates by index correctly */}
                <Scatter
                  name="Models"
                  data={scatterInput}
                  zIndex={100}
                  shape={renderDot}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
