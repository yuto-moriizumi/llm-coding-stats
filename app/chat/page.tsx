import type { Metadata } from "next";
import LeaderboardPage from "../components/LeaderboardPage";
import { CHAT_MODELS } from "../data/chat-models";

export const metadata: Metadata = {
  title: "LLM Chat Performance Stats",
  description: "Text Arena performance comparison - Arena Score vs price",
};

export default function ChatPage() {
  return (
    <LeaderboardPage
      models={CHAT_MODELS}
      activeView="chat"
      title="LLM Chat Performance Stats"
      description="Text and chat performance vs cost comparison across major LLM providers"
      sourceLabel="Text Arena Overall"
      sourceUrl="https://arena.ai/leaderboard/text"
      snapshotDate="2026-09-02"
    />
  );
}
