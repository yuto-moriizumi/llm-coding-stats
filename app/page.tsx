import ChartSection from "./components/ChartSection";
import { LLM_MODELS, type LLMModel } from "./data/llm-data";
import { fetchThroughputMap, fetchPricingMap, fetchEndpointMap } from "./lib/openrouter";

async function getEnrichedModels(): Promise<LLMModel[]> {
  const [throughputMap, pricingMap] = await Promise.all([
    fetchThroughputMap(),
    fetchPricingMap(),
  ]);

  return LLM_MODELS.map((model) => {
    const enriched: LLMModel = { ...model };

    // Throughput
    const throughput = throughputMap.get(model.name);
    if (throughput != null) {
      enriched.throughput = throughput;
    }

    // Pricing (API 側に値があれば上書き。存在しない場合はハードコード値を維持)
    const pricing = pricingMap.get(model.name);
    if (pricing != null) {
      enriched.inputPrice = pricing.inputPrice;
      enriched.outputPrice = pricing.outputPrice;
    }

    return enriched;
  });
}

export default async function Home() {
  const [models, endpointMap] = await Promise.all([
    getEnrichedModels(),
    fetchEndpointMap(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-2">
        <h1 className="text-lg font-semibold text-gray-100">
          LLM Performance Stats
        </h1>
        <p className="text-sm text-gray-500">
          Performance vs cost comparison across major LLM providers
          <span className="ml-1 text-gray-600">
            (throughput &amp; prices from OpenRouter, 10min cache)
          </span>
        </p>
      </header>

      {/* Main chart section */}
      <main className="flex w-full flex-1 flex-col px-4 py-2">
        <ChartSection models={models} endpointMap={endpointMap} />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-3">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs text-gray-600">
            Arena scores are illustrative estimates based on public benchmarks.
            Prices are per 1M tokens as of 2026. Throughput &amp; prices from
            OpenRouter (refreshed every 10 minutes).
          </p>
        </div>
      </footer>
    </div>
  );
}
