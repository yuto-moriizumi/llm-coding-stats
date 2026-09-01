import Link from "next/link";
import ChartSection from "./ChartSection";
import type { LLMModel, LLMModelDefinition } from "../data/llm-definitions";
import { fetchEndpointMap, fetchPricingMap, fetchThroughputMap } from "../lib/openrouter";

interface LeaderboardPageProps {
  models: readonly LLMModelDefinition[];
  activeView: "code" | "chat";
  title: string;
  description: string;
  sourceLabel: string;
  sourceUrl: string;
  snapshotDate: string;
}

async function getEnrichedModels(
  definitions: readonly LLMModelDefinition[],
): Promise<LLMModel[]> {
  const [throughputMap, pricingMap] = await Promise.all([
    fetchThroughputMap(definitions),
    fetchPricingMap(definitions),
  ]);

  return definitions.map((model) => ({
    ...model,
    inputPrice: pricingMap.get(model.name)?.inputPrice ?? 0,
    outputPrice: pricingMap.get(model.name)?.outputPrice ?? 0,
    ...(throughputMap.has(model.name)
      ? { throughput: throughputMap.get(model.name) }
      : {}),
  }));
}

export default async function LeaderboardPage({
  models: definitions,
  activeView,
  title,
  description,
  sourceLabel,
  sourceUrl,
  snapshotDate,
}: LeaderboardPageProps) {
  const [models, endpointMap] = await Promise.all([
    getEnrichedModels(definitions),
    fetchEndpointMap(definitions),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a]">
      <header className="border-b border-white/5 px-6 py-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-gray-100">{title}</h1>
            <p className="text-sm text-gray-500">
              {description}
              <span className="ml-1 text-gray-600">
                (throughput &amp; prices from OpenRouter, 10min cache)
              </span>
            </p>
          </div>
          <nav aria-label="Leaderboard view" className="flex rounded-lg border border-white/10 bg-[#0e0e0e] p-1 text-sm">
            <Link
              href="/"
              aria-current={activeView === "code" ? "page" : undefined}
              className={`rounded-md px-3 py-1.5 transition-colors ${activeView === "code" ? "bg-blue-500/20 text-blue-300" : "text-gray-500 hover:text-gray-200"}`}
            >
              Code
            </Link>
            <Link
              href="/chat"
              aria-current={activeView === "chat" ? "page" : undefined}
              className={`rounded-md px-3 py-1.5 transition-colors ${activeView === "chat" ? "bg-blue-500/20 text-blue-300" : "text-gray-500 hover:text-gray-200"}`}
            >
              Chat
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex w-full flex-1 flex-col px-4 py-2">
        <ChartSection models={models} endpointMap={endpointMap} />
      </main>

      <footer className="border-t border-white/5 px-6 py-3">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs text-gray-600">
            Arena scores: {" "}
            <a className="underline hover:text-gray-400" href={sourceUrl} target="_blank" rel="noreferrer">
              {sourceLabel}
            </a>{" "}
            snapshot from {snapshotDate}. Prices and throughput are from OpenRouter and refreshed every 10 minutes.
          </p>
        </div>
      </footer>
    </div>
  );
}
