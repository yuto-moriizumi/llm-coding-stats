import LeaderboardPage from "./components/LeaderboardPage";
import { LLM_MODELS } from "./data/llm-models";

export default async function Home() {
  return (
    <LeaderboardPage
      models={LLM_MODELS}
      activeView="code"
      title="LLM Code Performance Stats"
      description="Coding performance vs cost comparison across major LLM providers"
      sourceLabel="Code Arena"
      sourceUrl="https://arena.ai/leaderboard/code"
      snapshotDate="2026-09-02"
    />
  );
}
