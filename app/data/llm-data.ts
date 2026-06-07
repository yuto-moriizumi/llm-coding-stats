export interface LLMModel {
  name: string;
  provider: Provider;
  arenaScore: number;
  /** Input price per 1M tokens (USD) */
  inputPrice: number;
  /** Output price per 1M tokens (USD) */
  outputPrice: number;
}

export type Provider =
  | "anthropic"
  | "openai"
  | "google"
  | "meta"
  | "alibaba"
  | "mistral"
  | "deepseek"
  | "minimax"
  | "xiaomi"
  | "ibm"
  | "xai"
  | "cohere"
  | "other";

export const PROVIDER_COLORS: Record<Provider, string> = {
  anthropic: "#d97706",
  openai: "#10a37f",
  google: "#4285f4",
  meta: "#0668E1",
  alibaba: "#16a34a",
  mistral: "#f59e0b",
  deepseek: "#0d9488",
  minimax: "#7c3aed",
  xiaomi: "#0891b2",
  ibm: "#0f62fe",
  xai: "#1d9bf0",
  cohere: "#39594d",
  other: "#6b7280",
};

export const PROVIDER_LABELS: Record<Provider, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
  meta: "Meta",
  alibaba: "Alibaba",
  mistral: "Mistral",
  deepseek: "DeepSeek",
  minimax: "MiniMax",
  xiaomi: "Xiaomi",
  ibm: "IBM",
  xai: "xAI",
  cohere: "Cohere",
  other: "Other",
};

/**
 * Blended price = (inputPrice * 3 + outputPrice * 1) / 4
 * Assumes 3:1 input:output ratio per 1M tokens.
 */
export function blendedPrice(model: LLMModel): number {
  return (model.inputPrice * 3 + model.outputPrice * 1) / 4;
}

export const LLM_MODELS: LLMModel[] = [
  // ── Anthropic ──────────────────────────────────────────────
  { name: "claude-opus-4-7-thinking", provider: "anthropic", arenaScore: 1567, inputPrice: 15, outputPrice: 75 },
  { name: "claude-opus-4-7", provider: "anthropic", arenaScore: 1558, inputPrice: 15, outputPrice: 75 },
  { name: "claude-opus-4", provider: "anthropic", arenaScore: 1540, inputPrice: 15, outputPrice: 75 },
  { name: "claude-sonnet-4", provider: "anthropic", arenaScore: 1510, inputPrice: 3, outputPrice: 15 },
  { name: "claude-sonnet-3.7", provider: "anthropic", arenaScore: 1490, inputPrice: 3, outputPrice: 15 },
  { name: "claude-3.5-sonnet", provider: "anthropic", arenaScore: 1442, inputPrice: 3, outputPrice: 15 },
  { name: "claude-3.5-haiku", provider: "anthropic", arenaScore: 1350, inputPrice: 0.8, outputPrice: 4 },
  { name: "claude-3-opus", provider: "anthropic", arenaScore: 1410, inputPrice: 15, outputPrice: 75 },

  // ── OpenAI ─────────────────────────────────────────────────
  { name: "o3-pro", provider: "openai", arenaScore: 1555, inputPrice: 20, outputPrice: 80 },
  { name: "o3", provider: "openai", arenaScore: 1535, inputPrice: 10, outputPrice: 40 },
  { name: "o3-thinking", provider: "openai", arenaScore: 1545, inputPrice: 10, outputPrice: 40 },
  { name: "gpt-4.5-preview", provider: "openai", arenaScore: 1498, inputPrice: 75, outputPrice: 150 },
  { name: "o4-mini", provider: "openai", arenaScore: 1480, inputPrice: 1.1, outputPrice: 4.4 },
  { name: "gpt-4o", provider: "openai", arenaScore: 1438, inputPrice: 2.5, outputPrice: 10 },
  { name: "gpt-4o-mini", provider: "openai", arenaScore: 1350, inputPrice: 0.15, outputPrice: 0.6 },
  { name: "o1", provider: "openai", arenaScore: 1510, inputPrice: 15, outputPrice: 60 },
  { name: "o1-mini", provider: "openai", arenaScore: 1415, inputPrice: 1.1, outputPrice: 4.4 },
  { name: "gpt-4-turbo", provider: "openai", arenaScore: 1400, inputPrice: 10, outputPrice: 30 },

  // ── Google ─────────────────────────────────────────────────
  { name: "gemini-2.5-pro", provider: "google", arenaScore: 1548, inputPrice: 1.25, outputPrice: 10 },
  { name: "gemini-2.5-flash", provider: "google", arenaScore: 1470, inputPrice: 0.15, outputPrice: 0.6 },
  { name: "gemini-2.0-flash", provider: "google", arenaScore: 1408, inputPrice: 0.1, outputPrice: 0.4 },
  { name: "gemini-2.0-flash-lite", provider: "google", arenaScore: 1340, inputPrice: 0.075, outputPrice: 0.3 },
  { name: "gemini-1.5-pro", provider: "google", arenaScore: 1390, inputPrice: 1.25, outputPrice: 5 },
  { name: "gemini-1.5-flash", provider: "google", arenaScore: 1330, inputPrice: 0.075, outputPrice: 0.3 },

  // ── Meta (Llama) ───────────────────────────────────────────
  { name: "llama-4-maverick", provider: "meta", arenaScore: 1475, inputPrice: 0.2, outputPrice: 0.6 },
  { name: "llama-4-scout", provider: "meta", arenaScore: 1430, inputPrice: 0.1, outputPrice: 0.3 },
  { name: "llama-3.3-70b", provider: "meta", arenaScore: 1385, inputPrice: 0.2, outputPrice: 0.6 },
  { name: "llama-3.1-405b", provider: "meta", arenaScore: 1420, inputPrice: 3, outputPrice: 3 },
  { name: "llama-3.1-70b", provider: "meta", arenaScore: 1350, inputPrice: 0.35, outputPrice: 0.4 },
  { name: "llama-3.1-8b", provider: "meta", arenaScore: 1240, inputPrice: 0.05, outputPrice: 0.08 },

  // ── Alibaba (Qwen) ─────────────────────────────────────────
  { name: "qwen3.7-max", provider: "alibaba", arenaScore: 1537, inputPrice: 2, outputPrice: 8 },
  { name: "qwen3-max", provider: "alibaba", arenaScore: 1505, inputPrice: 1.2, outputPrice: 6 },
  { name: "qwen3-235b-a22b", provider: "alibaba", arenaScore: 1445, inputPrice: 0.35, outputPrice: 1.4 },
  { name: "qwen3-32b", provider: "alibaba", arenaScore: 1398, inputPrice: 0.12, outputPrice: 0.48 },
  { name: "qwen3-30b-a3b", provider: "alibaba", arenaScore: 1370, inputPrice: 0.08, outputPrice: 0.32 },
  { name: "qwen2.5-72b", provider: "alibaba", arenaScore: 1360, inputPrice: 0.35, outputPrice: 0.4 },
  { name: "qwen2.5-coder-32b", provider: "alibaba", arenaScore: 1330, inputPrice: 0.12, outputPrice: 0.48 },

  // ── Mistral ────────────────────────────────────────────────
  { name: "mistral-large-2", provider: "mistral", arenaScore: 1432, inputPrice: 2, outputPrice: 6 },
  { name: "mistral-medium", provider: "mistral", arenaScore: 1375, inputPrice: 2.7, outputPrice: 8.1 },
  { name: "mixtral-8x22b", provider: "mistral", arenaScore: 1355, inputPrice: 0.9, outputPrice: 0.9 },
  { name: "mistral-small", provider: "mistral", arenaScore: 1310, inputPrice: 0.2, outputPrice: 0.6 },
  { name: "mixtral-8x7b", provider: "mistral", arenaScore: 1275, inputPrice: 0.24, outputPrice: 0.24 },

  // ── DeepSeek ───────────────────────────────────────────────
  { name: "deepseek-r1", provider: "deepseek", arenaScore: 1495, inputPrice: 0.55, outputPrice: 2.19 },
  { name: "deepseek-v3", provider: "deepseek", arenaScore: 1458, inputPrice: 0.27, outputPrice: 1.1 },
  { name: "deepseek-v2.5", provider: "deepseek", arenaScore: 1380, inputPrice: 0.14, outputPrice: 0.28 },

  // ── MiniMax ────────────────────────────────────────────────
  { name: "minimax-m3", provider: "minimax", arenaScore: 1528, inputPrice: 1.5, outputPrice: 6 },
  { name: "minimax-01", provider: "minimax", arenaScore: 1420, inputPrice: 0.4, outputPrice: 1.6 },

  // ── Xiaomi (MiMo) ─────────────────────────────────────────
  { name: "mimo-v2.5-pro", provider: "xiaomi", arenaScore: 1466, inputPrice: 0.55, outputPrice: 2.2 },
  { name: "mimo-v2.5", provider: "xiaomi", arenaScore: 1437, inputPrice: 0.18, outputPrice: 0.7 },
  { name: "mimo-v2", provider: "xiaomi", arenaScore: 1380, inputPrice: 0.1, outputPrice: 0.4 },

  // ── IBM ────────────────────────────────────────────────────
  { name: "granite-4.1-8b", provider: "ibm", arenaScore: 1201, inputPrice: 0.05, outputPrice: 0.2 },
  { name: "granite-3.3-8b", provider: "ibm", arenaScore: 1180, inputPrice: 0.05, outputPrice: 0.2 },

  // ── xAI ────────────────────────────────────────────────────
  { name: "grok-3", provider: "xai", arenaScore: 1500, inputPrice: 3, outputPrice: 15 },
  { name: "grok-3-mini", provider: "xai", arenaScore: 1430, inputPrice: 0.3, outputPrice: 1.5 },

  // ── Cohere ─────────────────────────────────────────────────
  { name: "command-a", provider: "cohere", arenaScore: 1415, inputPrice: 2.5, outputPrice: 10 },
  { name: "command-r-plus", provider: "cohere", arenaScore: 1340, inputPrice: 2.5, outputPrice: 10 },
  { name: "command-r", provider: "cohere", arenaScore: 1290, inputPrice: 0.15, outputPrice: 0.6 },
];
