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
      {/* Upper chart: Pareto frontier (Arena Score vs Price) */}
      <div className="flex flex-1 flex-col rounded-lg border border-white/5 bg-[#0e0e0e]">
        <ParetoChart
          models={models}
          onSelectModel={handleSelectModel}
        />
      </div>

      {/* Lower chart: Provider-level throughput vs effective price */}
      {selectedModel && (
        <div className="flex flex-1 flex-col rounded-lg border border-white/5 bg-[#0e0e0e]">
          <ThroughputPriceChart
            endpoints={selectedEndpoints}
            modelName={selectedModel.name}
          />
        </div>
      )}
    </div>
  );
}
