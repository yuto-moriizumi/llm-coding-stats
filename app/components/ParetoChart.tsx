"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { LLM_MODELS, PROVIDER_COLORS, PROVIDER_LABELS, blendedPrice, type LLMModel, type Provider } from "../data/llm-data";

// ── Chart dimensions ─────────────────────────────────────────
const MARGIN = { top: 30, right: 20, bottom: 50, left: 90 };

// ── Axis config ──────────────────────────────────────────────
const SCORE_MIN = 1050;
const SCORE_MAX = 1600;
const PRICE_TICKS = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50];

function logScale(value: number, min: number, max: number, range: number): number {
  const logMin = Math.log10(min);
  const logMax = Math.log10(max);
  return range - ((Math.log10(value) - logMin) / (logMax - logMin)) * range;
}

function yScale(score: number, height: number): number {
  return height - ((score - SCORE_MIN) / (SCORE_MAX - SCORE_MIN)) * height;
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

export default function ParetoChart() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [hoveredModel, setHoveredModel] = useState<LLMModel | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [selectedProviders, setSelectedProviders] = useState<Set<Provider>>(new Set());

  // Track container width and viewport height with ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateHeight = () => setViewportHeight(window.innerHeight);
    updateHeight();
    window.addEventListener("resize", updateHeight);
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width != null) setContainerWidth(width);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  const chartWidth = Math.max(containerWidth - MARGIN.left - MARGIN.right, 200);
  // Cap chart height to fit within viewport (leave room for header, filters, footer)
  const maxHeight = Math.max(viewportHeight - 280, 300);
  const aspectHeight = Math.round(chartWidth * 0.5);
  const innerHeight = Math.min(aspectHeight, maxHeight - MARGIN.top - MARGIN.bottom);
  const svgWidth = containerWidth || 800;
  const svgHeight = innerHeight + MARGIN.top + MARGIN.bottom;

  const filteredModels = useMemo(() => {
    // Exclude models with $0 price (cannot plot on log scale)
    const priced = LLM_MODELS.filter((m) => m.inputPrice > 0 || m.outputPrice > 0);
    const base = selectedProviders.size === 0 ? priced : priced.filter((m) => selectedProviders.has(m.provider));
    return base;
  }, [selectedProviders]);

  const paretoFrontier = useMemo(() => computeParetoFrontier(filteredModels), [filteredModels]);

  const priceMin = 0.05;
  const priceMax = 100;

  const getX = useCallback(
    (price: number) => logScale(price, priceMin, priceMax, chartWidth),
    [chartWidth]
  );

  const getY = useCallback(
    (score: number) => yScale(score, innerHeight),
    [innerHeight]
  );

  // Label positions with collision avoidance
  const labelPositions = useMemo(() => {
    if (paretoFrontier.length === 0) return [];
    const items = paretoFrontier.map((model, i) => ({
      model,
      x: MARGIN.left + getX(blendedPrice(model)),
      y: MARGIN.top + getY(model.arenaScore),
      isLast: i === paretoFrontier.length - 1,
    }));
    // Sort by screen y (ascending) for stable collision resolution
    items.sort((a, b) => a.y - b.y);
    const LABEL_H = 20;
    const GAP = 3;
    // Single pass: push overlapping labels down
    for (let i = 1; i < items.length; i++) {
      const prevBottom = items[i - 1].y - LABEL_H / 2;
      const currTop = items[i].y - LABEL_H / 2;
      if (currTop < prevBottom + GAP) {
        items[i].y = prevBottom + GAP + LABEL_H / 2;
      }
    }
    return items;
  }, [paretoFrontier, getX, getY]);

  // Build pareto line path
  const paretoPath = useMemo(() => {
    if (paretoFrontier.length < 2) return "";
    const points = paretoFrontier.map((m) => ({
      x: getX(blendedPrice(m)),
      y: getY(m.arenaScore),
    }));

    let d = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += `L${points[i].x},${points[i].y}`;
    }
    return d;
  }, [paretoFrontier, getX, getY]);

  const providers = useMemo(() => {
    const set = new Set<Provider>();
    LLM_MODELS.forEach((m) => set.add(m.provider));
    return Array.from(set).sort();
  }, []);

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

  const handleDotHover = (model: LLMModel, e: React.MouseEvent) => {
    setHoveredModel(model);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltipPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col p-2 sm:p-6">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div>
          <h3 className="text-base font-medium text-gray-100">Pareto Frontier</h3>
          <p className="hidden text-xs text-gray-400 sm:block">
            Model performance at each price point
          </p>
        </div>
      </div>

      {/* Provider filter chips */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {providers.map((provider) => {
          const active = selectedProviders.size === 0 || selectedProviders.has(provider);
          return (
            <button
              key={provider}
              onClick={() => toggleProvider(provider)}
              className="flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] transition-colors"
              style={{
                borderColor: active ? PROVIDER_COLORS[provider] : "rgba(255,255,255,0.1)",
                backgroundColor: active ? `${PROVIDER_COLORS[provider]}22` : "transparent",
                color: active ? PROVIDER_COLORS[provider] : "rgba(255,255,255,0.3)",
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

      {/* Chart */}
      <div ref={containerRef} className="relative flex min-h-[300px] flex-1 items-start overflow-hidden">
        <div className="relative w-full">
          {containerWidth > 0 && (
          <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="block">
            <defs>
              <clipPath id="chart-clip">
                <rect x={0} y={0} width={chartWidth} height={innerHeight} />
              </clipPath>
            </defs>

            <g transform={`translate(${MARGIN.left}, ${MARGIN.top})`}>
              {/* Y-axis grid lines */}
              {[1100, 1200, 1300, 1400, 1500, 1600].map((score) => (
                <line
                  key={score}
                  x1={0}
                  x2={chartWidth}
                  y1={getY(score)}
                  y2={getY(score)}
                  stroke="rgba(255,255,255,0.12)"
                  strokeDasharray="4,4"
                />
              ))}

              {/* X-axis grid lines */}
              {PRICE_TICKS.map((price) => (
                <line
                  key={price}
                  x1={getX(price)}
                  x2={getX(price)}
                  y1={0}
                  y2={innerHeight}
                  stroke="rgba(255,255,255,0.12)"
                  strokeDasharray="4,4"
                />
              ))}

              {/* Y-axis labels */}
              {[1100, 1200, 1300, 1400, 1500, 1600].map((score) => (
                <text
                  key={score}
                  x={-8}
                  y={getY(score)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fill="#eeeef0"
                  fontSize={11}
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                >
                  {score}
                </text>
              ))}

              {/* X-axis labels */}
              {PRICE_TICKS.map((price) => (
                <text
                  key={price}
                  x={getX(price)}
                  y={innerHeight + 19}
                  textAnchor="middle"
                  fill="#eeeef0"
                  fontSize={11}
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                >
                  {formatPrice(price)}
                </text>
              ))}

              {/* X-axis label */}
              <text
                x={chartWidth / 2}
                y={innerHeight + 42}
                textAnchor="middle"
                fill="#9ca3af"
                fontSize={11}
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              >
                Blended price per 1M tokens (3:1 Ratio)
              </text>

              {/* Y-axis label */}
              <text
                transform="rotate(-90)"
                x={-innerHeight / 2}
                y={-65}
                textAnchor="middle"
                fill="#eeeef0"
                fontSize={12}
                fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
              >
                Arena Score
              </text>

              {/* Pareto line + extension */}
              <g clipPath="url(#chart-clip)">
                {paretoFrontier.length >= 2 && (
                  <>
                    {/* Extension from cheapest point (rightmost) to right edge */}
                    <line
                      x1={getX(blendedPrice(paretoFrontier[0]))}
                      y1={getY(paretoFrontier[0].arenaScore)}
                      x2={chartWidth + 10}
                      y2={getY(paretoFrontier[0].arenaScore)}
                      stroke="#40b841"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                    />
                    {/* Main pareto line */}
                    <path
                      d={paretoPath}
                      fill="transparent"
                      stroke="#40b841"
                      strokeWidth={2.5}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                    {/* Extension from most expensive point (leftmost) to left edge */}
                    <line
                      x1={-10}
                      y1={getY(paretoFrontier[paretoFrontier.length - 1].arenaScore)}
                      x2={getX(blendedPrice(paretoFrontier[paretoFrontier.length - 1]))}
                      y2={getY(paretoFrontier[paretoFrontier.length - 1].arenaScore)}
                      stroke="#40b841"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                    />
                  </>
                )}
                {/* Pareto points */}
                {paretoFrontier.map((model) => (
                  <circle
                    key={`pareto-${model.name}`}
                    cx={getX(blendedPrice(model))}
                    cy={getY(model.arenaScore)}
                    r={5}
                    fill="#40b841"
                  />
                ))}
              </g>

              {/* Scatter dots */}
              {filteredModels.map((model) => (
                <circle
                  key={model.name}
                  cx={getX(blendedPrice(model))}
                  cy={getY(model.arenaScore)}
                  r={4}
                  fill={PROVIDER_COLORS[model.provider]}
                  opacity={hoveredModel?.name === model.name ? 1 : 0.7}
                  className="cursor-pointer transition-all duration-150"
                  onMouseEnter={(e) => handleDotHover(model, e)}
                  onMouseLeave={() => setHoveredModel(null)}
                  style={{
                    transform: hoveredModel?.name === model.name ? "scale(1.5)" : "scale(1)",
                    transformOrigin: `${getX(blendedPrice(model))}px ${getY(model.arenaScore)}px`,
                  }}
                />
              ))}
            </g>
          </svg>
          )}

          {/* Pareto frontier labels */}
          {labelPositions.map(({ model, x, y, isLast }) => (
            <div
              key={`label-${model.name}`}
              className="pointer-events-none absolute whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-medium"
              style={{
                left: `${(x / svgWidth) * 100}%`,
                top: `${(y / svgHeight) * 100}%`,
                transform: isLast ? "translateX(-100%) translateY(-100%)" : "translateX(-50%) translateY(-100%)",
                color: "rgb(226, 232, 240)",
                backgroundColor: "rgba(30, 30, 34, 0.8)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                zIndex: 15,
              }}
            >
              {model.name}
            </div>
          ))}

          {/* Tooltip */}
          {hoveredModel && (
            <div
              className="pointer-events-none absolute z-30 rounded-lg border border-white/10 bg-gray-900/95 px-3 py-2 text-xs shadow-xl backdrop-blur-sm"
              style={{
                left: tooltipPos.x + 12,
                top: tooltipPos.y - 10,
                transform: "translateY(-100%)",
              }}
            >
              <div className="mb-1 font-medium text-gray-100">{hoveredModel.name}</div>
              <div className="flex flex-col gap-0.5 text-gray-400">
                <span>
                  <span className="text-gray-300">Arena:</span> {hoveredModel.arenaScore}
                </span>
                <span>
                  <span className="text-gray-300">Input:</span> ${hoveredModel.inputPrice}/1M
                </span>
                <span>
                  <span className="text-gray-300">Output:</span> ${hoveredModel.outputPrice}/1M
                </span>
                <span>
                  <span className="text-gray-300">Blended:</span> ${blendedPrice(hoveredModel).toFixed(2)}/1M
                </span>
                <span className="mt-0.5 flex items-center gap-1">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: PROVIDER_COLORS[hoveredModel.provider] }}
                  />
                  {PROVIDER_LABELS[hoveredModel.provider]}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
