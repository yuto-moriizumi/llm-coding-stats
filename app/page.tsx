import ParetoChart from "./components/ParetoChart";
import { LLM_MODELS, type LLMModel } from "./data/llm-data";
import { fetchThroughputMap } from "./lib/openrouter";

async function getEnrichedModels(): Promise<LLMModel[]> {
  const throughputMap = await fetchThroughputMap();

  if (throughputMap.size === 0) {
    // API取得失敗時はハードコード値をそのまま使用
    return LLM_MODELS;
  }

  return LLM_MODELS.map((model) => {
    const throughput = throughputMap.get(model.name);
    return throughput != null ? { ...model, throughput } : model;
  });
}

export default async function Home() {
  const models = await getEnrichedModels();

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-100">
          LLM Performance Stats
        </h1>
        <p className="text-sm text-gray-500">
          Performance vs cost comparison across major LLM providers
          <span className="ml-1 text-gray-600">
            (throughput: OpenRouter p50, 10min cache)
          </span>
        </p>
      </header>

      {/* Main chart */}
      <main className="flex w-full flex-1 flex-col px-4 py-6">
        <ParetoChart models={models} />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-3">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs text-gray-600">
            Arena scores are illustrative estimates based on public benchmarks.
            Prices are per 1M tokens as of 2026. Throughput from OpenRouter
            (p50, refreshed every 10 minutes).
          </p>
        </div>
      </footer>
    </div>
  );
}
