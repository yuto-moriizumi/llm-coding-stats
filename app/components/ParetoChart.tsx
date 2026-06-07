"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import {
  ComposedChart,
  Scatter,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
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
const CHART_MARGIN = { top: 20, right: 30, bottom: 40, left: 60 };

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
  payload?: Array<{ payload: LLMModel }>;
  allModels?: LLMModel[];
}

function CustomTooltip({ active, payload, allModels }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const hoveredModel = payload[0].payload;
  const hoveredPrice = blendedPrice(hoveredModel);

  // Find all models with the same blended price (within a small epsilon for float comparison)
  const samePriceModels = allModels?.filter(
    (m) => Math.abs(blendedPrice(m) - hoveredPrice) < 0.01
  ) || [hoveredModel];

  // Remove duplicates by name just in case
  const uniqueModels = Array.from(
    new Map(samePriceModels.map((m) => [m.name, m])).values()
  );

  return (
    <div className="rounded-lg border border-white/10 bg-gray-900/95 px-3 py-2 text-xs shadow-xl backdrop-blur-sm">
      <div className="mb-2 font-medium text-gray-100">
        {uniqueModels.length > 1
          ? `${uniqueModels.length} Models at Blended: `
          : ""}
        ${hoveredPrice.toFixed(2)}/1M
      </div>
      <div className="flex flex-col gap-2">
        {uniqueModels.map((model, index) => (
          <div
            key={`${model.name}-${index}`}
            className={
              uniqueModels.length > 1
                ? "border-t border-white/10 pt-2 first:border-0 first:pt-0"
                : ""
            }
          >
            <div className="mb-1 font-medium text-gray-100">{model.name}</div>
            <div className="flex flex-col gap-0.5 text-gray-400">
              <span>
                <span className="text-gray-300">Arena:</span> {model.arenaScore}
              </span>
              <span>
                <span className="text-gray-300">Input:</span> $
                {model.inputPrice}/1M
              </span>
              <span>
                <span className="text-gray-300">Output:</span> $
                {model.outputPrice}/1M
              </span>
              {model.throughput != null && (
                <span>
                  <span className="text-gray-300">Throughput:</span>{" "}
                  {model.throughput} tok/s
                </span>
              )}
              <span className="mt-0.5 flex items-center gap-1">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: PROVIDER_COLORS[model.provider] }}
                />
                {PROVIDER_LABELS[model.provider]}
              </span>
            </div>
          </div>
        ))}
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

// ── Pareto extension lines are now handled by extending paretoData ──

export default function ParetoChart({ models }: ParetoChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [hoveredModel, setHoveredModel] = useState<LLMModel | null>(null);
  const [selectedProviders, setSelectedProviders] = useState<Set<Provider>>(
    new Set(),
  );
  const [minThroughput, setMinThroughput] = useState<number>(0);

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

  // Prepare scatter data
  const scatterData = useMemo(
    () =>
      filteredModels.map((model) => ({
        x: blendedPrice(model),
        y: model.arenaScore,
        ...model,
      })),
    [filteredModels],
  );

  // Prepare pareto line data (without extensions for simplicity)
  const paretoData = useMemo(
    () =>
      paretoFrontier.map((model) => ({
        x: blendedPrice(model),
        y: model.arenaScore,
        ...model,
      })),
    [paretoFrontier],
  );

  // Auto-compute price axis max from filtered data (with 30% margin,
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
  const THROUGHPUT_PRESETS = [0, 30, 50, 100, 150];

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
    <div className="flex min-w-0 flex-1 flex-col p-2 sm:p-6">

      {/* Provider filter chips */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {providers.map((provider) => {
          const active =
            selectedProviders.size === 0 || selectedProviders.has(provider);
          return (
            <button
              key={provider}
              onClick={() => toggleProvider(provider)}
              className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] transition-colors"
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
            className="rounded-md border border-white/10 px-2 py-1 text-[11px] text-gray-400 transition-colors hover:text-gray-200"
          >
            Clear
          </button>
        )}
      </div>

      {/* Throughput filter */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <span className="text-[11px] font-medium text-gray-400">
          Min Throughput:
        </span>
        <div className="flex flex-wrap gap-1">
          {THROUGHPUT_PRESETS.map((value) => {
            const active = minThroughput === value;
            return (
              <button
                key={value}
                onClick={() => setMinThroughput(value)}
                className={`rounded-md border px-2 py-0.5 text-[11px] transition-colors ${
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
          <span className="text-[11px] text-gray-500">
            ≥{minThroughput} tok/s
          </span>
        )}
      </div>

      {/* Chart */}
      <div
        ref={containerRef}
        className="relative min-h-[400px] flex-1 overflow-hidden"
      >
        {containerSize.width > 0 && (
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
                domain={[PRICE_MIN, priceMax]}
                ticks={PRICE_TICKS.filter((t) => t <= priceMax)}
                tickFormatter={formatPrice}
                tick={{ fill: "#eeeef0", fontSize: 11 }}
                stroke="rgba(255,255,255,0.2)"
                label={{
                  value: "Blended price per 1M tokens (3:1 Ratio)",
                  position: "insideBottom",
                  offset: -10,
                  fill: "#9ca3af",
                  fontSize: 11,
                }}
              />

              <YAxis
                type="number"
                dataKey="y"
                domain={[SCORE_MIN, SCORE_MAX]}
                ticks={SCORE_TICKS}
                tick={{ fill: "#eeeef0", fontSize: 11 }}
                stroke="rgba(255,255,255,0.2)"
                label={{
                  value: "Arena Score",
                  angle: -90,
                  position: "insideLeft",
                  offset: 10,
                  fill: "#eeeef0",
                  fontSize: 12,
                }}
              />

              <ZAxis range={[1, 1]} />

              <Tooltip
                content={<CustomTooltip allModels={filteredModels} />}
                cursor={{
                  strokeDasharray: "3,3",
                  stroke: "rgba(255,255,255,0.3)",
                }}
              />

              {/* Scatter plot for all models */}
              <Scatter
                name="Models"
                data={scatterData}
                shape={renderDot}
              />

              {/* Pareto frontier line (includes extensions to chart edges) */}
              {paretoData.length >= 2 && (
                <Line
                  type="linear"
                  dataKey="y"
                  data={paretoData}
                  stroke="#40b841"
                  strokeWidth={2.5}
                  dot={(props) => {
                    const { cx, cy, payload } = props;
                    if (cx == null || cy == null || !payload?.provider) return null;
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={5}
                        fill={PROVIDER_COLORS[payload.provider as Provider]}
                        strokeWidth={0}
                      />
                    );
                  }}
                  isAnimationActive={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
