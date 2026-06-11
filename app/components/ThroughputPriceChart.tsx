"use client";

import { useMemo, useState } from "react";
import {
  ComposedChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
} from "recharts";
import type { EndpointData } from "../lib/openrouter";

// ── Props ────────────────────────────────────────────────────
interface ThroughputPriceChartProps {
  endpoints: EndpointData[] | null;
  modelName: string | null;
  priceRatio?: number;
}

// ── Format helpers ───────────────────────────────────────────
function formatPrice(price: number): string {
  if (price >= 1) return `$${price.toFixed(price >= 10 ? 0 : 1)}`;
  return `$${price.toFixed(2)}`;
}

function blendedPrice(ep: EndpointData, inputRatio: number = 3): number {
  return (ep.inputPrice * inputRatio + ep.outputPrice * 1) / (inputRatio + 1);
}

// ── Pareto frontier computation ──────────────────────────────
// 価格が低く、スループットが高いものが最適（右上）
function computeParetoFrontier(endpoints: EndpointData[], inputRatio: number = 3): EndpointData[] {
  const sorted = [...endpoints].sort((a, b) => blendedPrice(a, inputRatio) - blendedPrice(b, inputRatio));
  const frontier: EndpointData[] = [];
  let bestThroughput = -Infinity;

  for (const ep of sorted) {
    if (ep.throughput > bestThroughput) {
      bestThroughput = ep.throughput;
      frontier.push(ep);
    }
  }

  return frontier;
}

interface ChartPoint extends EndpointData {
  x: number;
  y: number;
}

// ── Custom Tooltip ───────────────────────────────────────────
interface CustomTooltipProps {
  active?: boolean;
  hoveredPoint?: ChartPoint | null;
  priceRatio?: number;
}

function CustomTooltip({ active, hoveredPoint, priceRatio = 3 }: CustomTooltipProps) {
  if (!active || !hoveredPoint) return null;

  const bp = blendedPrice(hoveredPoint, priceRatio);

  return (
    <div className="rounded-lg border border-white/10 bg-gray-900/95 px-3 py-2 text-xs shadow-xl backdrop-blur-sm">
      <div className="mb-2 font-medium text-gray-100">
        {hoveredPoint.providerName}
        {hoveredPoint.variant !== "standard" && (
          <span className="ml-1.5 rounded bg-gray-700/50 px-1.5 py-0.5 text-[10px] text-gray-400">
            {hoveredPoint.variant}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-0.5 text-gray-400">
        <span>
          <span className="text-gray-300">Throughput:</span> {hoveredPoint.throughput} tok/s
        </span>
        <span>
          <span className="text-gray-300">Blended price:</span> ${bp.toFixed(2)}/1M
        </span>
        <span>
          <span className="text-gray-300">Input:</span> ${hoveredPoint.inputPrice.toFixed(2)}/1M
        </span>
        <span>
          <span className="text-gray-300">Output:</span> ${hoveredPoint.outputPrice.toFixed(2)}/1M
        </span>
      </div>
    </div>
  );
}

// ── Custom Scatter Dot ───────────────────────────────────────
interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: ChartPoint;
  hoveredPoint: ChartPoint | null;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: (e: React.MouseEvent) => void;
}

function CustomDot({ cx, cy, payload, hoveredPoint, onMouseEnter, onMouseLeave }: CustomDotProps) {
  if (cx == null || cy == null || !payload) return null;
  const isHovered = hoveredPoint?.providerName === payload.providerName && hoveredPoint?.variant === payload.variant;

  return (
    <g style={{ pointerEvents: "none" }}>
      <circle
        cx={cx}
        cy={cy}
        r={isHovered ? 11 : 8}
        fill="#ffffff"
        opacity={isHovered ? 0.5 : 0.35}
        style={{ pointerEvents: "none" }}
      />
      <circle
        cx={cx}
        cy={cy}
        r={isHovered ? 9 : 6}
        fill="#10b981"
        stroke="#ffffff"
        strokeWidth={isHovered ? 2 : 1.5}
        opacity={1}
        style={{ cursor: "pointer", transition: "all 150ms", pointerEvents: "all" }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      />
    </g>
  );
}

// ── Chart ────────────────────────────────────────────────────
function generateLinearTicks(min: number, max: number, count = 5): number[] {
  const range = max - min;
  if (range === 0) return [min];
  // Round to a nice step size
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

export default function ThroughputPriceChart({ endpoints, modelName, priceRatio = 3 }: ThroughputPriceChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);

  // Compute chart data and pareto frontier
  const { scatterData, frontierData, priceDomain, throughputDomain } = useMemo(() => {
    if (!endpoints || endpoints.length === 0) {
      return {
        scatterData: [] as ChartPoint[],
        frontierData: [] as ChartPoint[],
        priceDomain: [0, 10] as [number, number],
        throughputDomain: [0, 100] as [number, number],
      };
    }

    const data = endpoints
      .filter((ep) => ep.throughput != null && (ep.inputPrice > 0 || ep.outputPrice > 0))
      .map((ep) => ({
        ...ep,
        x: blendedPrice(ep, priceRatio),
        y: ep.throughput,
      }));

    const frontier = computeParetoFrontier(
      endpoints.filter((ep) => ep.inputPrice > 0 || ep.outputPrice > 0),
      priceRatio,
    )
      .map((ep) => ({
        ...ep,
        x: blendedPrice(ep, priceRatio),
        y: ep.throughput,
      }));

    const minPrice = Math.min(...data.map((d) => d.x));
    const maxPrice = Math.max(...data.map((d) => d.x));
    const minThroughput = Math.min(...data.map((d) => d.y));
    const maxThroughput = Math.max(...data.map((d) => d.y));

    // Linear scale: tight domain with minimal padding
    const pPad = (maxPrice - minPrice) * 0.005; // ~0.5% padding
    const tPad = (maxThroughput - minThroughput) * 0.005;

    return {
      scatterData: data,
      frontierData: frontier,
      priceDomain: [Math.max(0, minPrice - pPad), maxPrice + pPad] as [number, number],
      throughputDomain: [Math.max(0, minThroughput - tPad), maxThroughput + tPad] as [number, number],
    };
  }, [endpoints, priceRatio]);

  // Auto-compute price ticks
  const priceTicks = useMemo(() => {
    return generateLinearTicks(priceDomain[0], priceDomain[1]);
  }, [priceDomain]);

  const throughputTicks = useMemo(() => {
    return generateLinearTicks(throughputDomain[0], throughputDomain[1]);
  }, [throughputDomain]);

  if (!modelName) {
    return (
      <div className="flex min-h-[300px] flex-1 flex-col items-center justify-center rounded-lg border border-white/5 bg-gray-900/30 p-6 text-sm text-gray-500">
        <p className="mb-1 text-gray-400">Select a model on the chart above</p>
        <p>to see provider-level throughput and pricing breakdown</p>
      </div>
    );
  }

  if (!endpoints || endpoints.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-1 flex-col items-center justify-center rounded-lg border border-white/5 bg-gray-900/30 p-6 text-sm text-gray-500">
        <p className="mb-1 text-gray-400">No provider data available for</p>
        <p className="font-medium text-gray-300">{modelName}</p>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col p-2">
      {/* Model name header */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-200">
          {modelName}
          <span className="ml-2 text-xs font-normal text-gray-500">
            — Provider-level throughput vs. effective price
          </span>
        </h3>
        <span className="text-xs text-gray-600">
          {endpoints.length} provider{endpoints.length > 1 ? "s" : ""} available
        </span>
      </div>

      {/* Chart */}
      <div className="relative min-h-[350px] flex-1">
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart margin={{ top: 8, right: 30, bottom: 40, left: 60 }}>
            <CartesianGrid
              strokeDasharray="4,4"
              stroke="rgba(255,255,255,0.12)"
            />

            <XAxis
              type="number"
              dataKey="x"
              domain={priceDomain}
              ticks={priceTicks}
              tickFormatter={formatPrice}
              tick={{ fill: "#eeeef0", fontSize: 13 }}
              stroke="rgba(255,255,255,0.2)"
              label={{
                value: `Effective blended price per 1M tokens (${priceRatio}:1 Ratio)`,
                position: "insideBottom",
                offset: -10,
                fill: "#9ca3af",
                fontSize: 13,
              }}
            />

            <YAxis
              type="number"
              dataKey="y"
              domain={throughputDomain}
              ticks={throughputTicks}
              tick={{ fill: "#eeeef0", fontSize: 13 }}
              stroke="rgba(255,255,255,0.2)"
              label={{
                value: "Throughput (tok/s)",
                angle: -90,
                position: "insideLeft",
                offset: 10,
                fill: "#eeeef0",
                fontSize: 14,
              }}
            />

            <ZAxis range={[1, 1]} />

            <Tooltip
              content={<CustomTooltip hoveredPoint={hoveredPoint} priceRatio={priceRatio} />}
              active={hoveredPoint !== null}
              cursor={{
                strokeDasharray: "3,3",
                stroke: "rgba(255,255,255,0.3)",
              }}
            />

            {/* Pareto frontier line */}
            {frontierData.length >= 2 && (
              <Scatter
                name="Pareto Frontier"
                data={frontierData}
                zIndex={1}
                line={{ stroke: '#40b841', strokeWidth: 2.5, opacity: 0.8 }}
                shape={() => null}
                isAnimationActive={false}
              />
            )}

            {/* Scatter plot for provider endpoints */}
            <Scatter
              name="Providers"
              data={scatterData}
              zIndex={100}
              shape={(props: { cx?: number; cy?: number; payload?: ChartPoint }) => (
                <CustomDot
                  {...props}
                  hoveredPoint={hoveredPoint}
                  onMouseEnter={() => props.payload && setHoveredPoint(props.payload)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              )}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
