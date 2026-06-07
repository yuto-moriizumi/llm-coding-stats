import ParetoChart from "./components/ParetoChart";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a]">
      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-100">
          LLM Performance Stats
        </h1>
        <p className="text-sm text-gray-500">
          Performance vs cost comparison across major LLM providers
        </p>
      </header>

      {/* Main chart */}
      <main className="flex w-full flex-1 flex-col px-4 py-6">
        <ParetoChart />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-3">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs text-gray-600">
            Arena scores are illustrative estimates based on public benchmarks.
            Prices are per 1M tokens as of 2026.
          </p>
        </div>
      </footer>
    </div>
  );
}
