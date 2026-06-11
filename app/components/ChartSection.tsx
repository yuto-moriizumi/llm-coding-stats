"use client";

import { useState, useCallback } from "react";
import ParetoChart from "./ParetoChart";
import ThroughputPriceChart from "./ThroughputPriceChart";
import { type LLMModel } from "../data/llm-data";
import { type EndpointData } from "../lib/openrouter";

interface ChartSectionProps {
  models: LLMModel[];
  endpointMap: Map<string, EndpointData[]>;
}

export default function ChartSection({ models, endpointMap }: ChartSectionProps) {
  const [selectedModel, setSelectedModel] = useState<LLMModel | null>(null);
  const [priceRatio, setPriceRatio] = useState<number>(3);

  const handleSelectModel = useCallback((model: LLMModel) => {
    setSelectedModel((prev) =>
      prev?.name === model.name ? null : model,
    );
  }, []);

  const selectedEndpoints = selectedModel
    ? (endpointMap.get(selectedModel.name) ?? null)
    : null;

  return (
    <div className="flex w-full flex-1 flex-col gap-4">
      {/* Price ratio slider - applies to both charts */}
      <div className="flex items-center gap-3 rounded-lg border border-white/5 bg-[#0e0e0e] px-4 py-3">
        <span className="text-sm font-medium text-gray-400">
          Blended Price Ratio (Input:Output):
        </span>
        <input
          type="range"
          min={3}
          max={10}
          step={1}
          value={priceRatio}
          onChange={(e) => setPriceRatio(Number(e.target.value))}
          className="throughput-slider h-1.5 w-48 cursor-pointer accent-blue-500 sm:w-64 lg:w-80"
          title={`Price ratio: ${priceRatio}:1`}
        />
        <span className="min-w-[3rem] text-sm font-semibold text-blue-400">{priceRatio}:1</span>
      </div>

      {/* Upper chart: Pareto frontier (Arena Score vs Price) */}
      <div className="flex flex-1 flex-col rounded-lg border border-white/5 bg-[#0e0e0e]">
        <ParetoChart
          models={models}
          selectedModel={selectedModel}
          onSelectModel={handleSelectModel}
          priceRatio={priceRatio}
        />
      </div>

      {/* Lower chart: Provider-level throughput vs effective price */}
      {selectedModel && (
        <div className="flex flex-1 flex-col rounded-lg border border-white/5 bg-[#0e0e0e]">
          <ThroughputPriceChart
            endpoints={selectedEndpoints}
            modelName={selectedModel.name}
            priceRatio={priceRatio}
          />
        </div>
      )}
    </div>
  );
}
