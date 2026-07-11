export interface LLMModel {
  name: string;
  provider: Provider;
  /** OpenRouter model identifier (provider/model). */
  openrouterSlug: string;
  arenaScore: number;
  /** Input price per 1M tokens (USD) */
  inputPrice: number;
  /** Output price per 1M tokens (USD) */
  outputPrice: number;
  /** Throughput (tokens per second) - optional, not always available */
  throughput?: number;
  /** Whether the model has been deprecated by the provider */
  deprecated?: boolean;
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
  | "zhipu"
  | "moonshot"
  | "tencent"
  | "kwai"
  | "arcee"
  | "inception"
  | "poolside"
  | "bytedance"
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
  zhipu: "#1a73e8",
  moonshot: "#6366f1",
  tencent: "#e60012",
  kwai: "#ff6600",
  arcee: "#c026d3",
  inception: "#059669",
  poolside: "#6b7280",
  bytedance: "#1E40AF",
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
  zhipu: "Zhipu AI",
  moonshot: "Moonshot AI",
  tencent: "Tencent",
  kwai: "Kwai",
  arcee: "Arcee AI",
  inception: "Inception Labs",
  poolside: "Poolside",
  bytedance: "ByteDance",
  other: "Other",
};

/**
 * Blended price = (inputPrice * inputRatio + outputPrice * 1) / (inputRatio + 1)
 * inputRatio defaults to 3 (3:1 input:output ratio per 1M tokens).
 */
export function blendedPrice(model: LLMModel, inputRatio: number = 3): number {
  return (model.inputPrice * inputRatio + model.outputPrice * 1) / (inputRatio + 1);
}

export const LLM_MODELS: LLMModel[] = [
  // ── Anthropic ──────────────────────────────────────────────
  { name: "claude-fable-5", provider: "anthropic", arenaScore: 1649, inputPrice: 10, outputPrice: 50, openrouterSlug: "anthropic/claude-fable-5" },
  { name: "claude-opus-4-7-thinking", provider: "anthropic", arenaScore: 1557, inputPrice: 5, outputPrice: 25, openrouterSlug: "anthropic/claude-opus-4.7" },
  { name: "claude-opus-4-8-thinking", provider: "anthropic", arenaScore: 1560, inputPrice: 5, outputPrice: 25, openrouterSlug: "anthropic/claude-opus-4.8" },
  { name: "claude-opus-4-7", provider: "anthropic", arenaScore: 1557, inputPrice: 5, outputPrice: 25, openrouterSlug: "anthropic/claude-opus-4.7" },
  { name: "claude-opus-4-6-thinking", provider: "anthropic", arenaScore: 1543, inputPrice: 5, outputPrice: 25, openrouterSlug: "anthropic/claude-opus-4.6" },
  { name: "claude-opus-4-8", provider: "anthropic", arenaScore: 1534, inputPrice: 5, outputPrice: 25, openrouterSlug: "anthropic/claude-opus-4.8" },
  { name: "claude-opus-4-6", provider: "anthropic", arenaScore: 1536, inputPrice: 5, outputPrice: 25, openrouterSlug: "anthropic/claude-opus-4.6" },
  { name: "claude-sonnet-4-6", provider: "anthropic", arenaScore: 1521, inputPrice: 3, outputPrice: 15, openrouterSlug: "anthropic/claude-sonnet-4" },
  { name: "claude-sonnet-5-high", provider: "anthropic", arenaScore: 1543, inputPrice: 2, outputPrice: 10, openrouterSlug: "anthropic/claude-sonnet-5" },
  { name: "claude-opus-4-5-20251101-thinking-32k", provider: "anthropic", arenaScore: 1490, inputPrice: 5, outputPrice: 25, openrouterSlug: "anthropic/claude-opus-4.5" },
  { name: "claude-opus-4-5-20251101", provider: "anthropic", arenaScore: 1466, inputPrice: 5, outputPrice: 25, openrouterSlug: "anthropic/claude-opus-4.5" },
  { name: "claude-sonnet-4-5-20250929-thinking-32k", provider: "anthropic", arenaScore: 1388, inputPrice: 3, outputPrice: 15, openrouterSlug: "anthropic/claude-sonnet-4.5" },
  { name: "claude-opus-4-1-20250805", provider: "anthropic", arenaScore: 1386, inputPrice: 15, outputPrice: 75, openrouterSlug: "anthropic/claude-opus-4.1" },
  { name: "claude-sonnet-4-5-20250929", provider: "anthropic", arenaScore: 1386, inputPrice: 3, outputPrice: 15, openrouterSlug: "anthropic/claude-sonnet-4.5" },
  { name: "claude-haiku-4-5-20251001", provider: "anthropic", arenaScore: 1327, inputPrice: 1, outputPrice: 5, openrouterSlug: "anthropic/claude-4.5-haiku-20251001" },

  // ── OpenAI ─────────────────────────────────────────────────
  { name: "gpt-5.6-sol-xhigh (codex-harness)", provider: "openai", arenaScore: 1636, inputPrice: 5, outputPrice: 30, openrouterSlug: "openai/gpt-5.6-sol" },
  { name: "gpt-5.5-xhigh (codex-harness)", provider: "openai", arenaScore: 1502, inputPrice: 0, outputPrice: 0, openrouterSlug: "openai/gpt-5.5" },
  { name: "gpt-5.5-high (codex-harness)", provider: "openai", arenaScore: 1481, inputPrice: 0, outputPrice: 0, openrouterSlug: "openai/gpt-5.5" },
  { name: "gpt-5.4-high (codex-harness)", provider: "openai", arenaScore: 1457, inputPrice: 2.5, outputPrice: 15, openrouterSlug: "openai/gpt-5.4" },
  { name: "gpt-5.5 (codex-harness)", provider: "openai", arenaScore: 1450, inputPrice: 0, outputPrice: 0, openrouterSlug: "openai/gpt-5.5" },
  { name: "gpt-5.4-medium (codex-harness)", provider: "openai", arenaScore: 1437, inputPrice: 2.5, outputPrice: 15, openrouterSlug: "openai/gpt-5.4" },
  { name: "gpt-5.3-codex (codex-harness)", provider: "openai", arenaScore: 1406, inputPrice: 1.75, outputPrice: 14, openrouterSlug: "openai/gpt-5.3-codex" },
  { name: "gpt-5.2", provider: "openai", arenaScore: 1405, inputPrice: 1.75, outputPrice: 14, openrouterSlug: "openai/gpt-5.2" },
  { name: "gpt-5.4-mini-high", provider: "openai", arenaScore: 1397, inputPrice: 0.75, outputPrice: 4.5, openrouterSlug: "openai/gpt-5.4-mini" },
  { name: "gpt-5-medium", provider: "openai", arenaScore: 1394, inputPrice: 1.25, outputPrice: 10, openrouterSlug: "openai/gpt-5" },
  { name: "gpt-5.1-medium", provider: "openai", arenaScore: 1391, inputPrice: 1.25, outputPrice: 10, deprecated: true, openrouterSlug: "openai/gpt-5.1" },
  { name: "gpt-5.4", provider: "openai", arenaScore: 1392, inputPrice: 2.5, outputPrice: 15, openrouterSlug: "openai/gpt-5.4" },
  { name: "gpt-5.1", provider: "openai", arenaScore: 1340, inputPrice: 1.25, outputPrice: 10, deprecated: true, openrouterSlug: "openai/gpt-5.1" },
  { name: "gpt-5.2-codex", provider: "openai", arenaScore: 1334, inputPrice: 1.75, outputPrice: 14, openrouterSlug: "openai/gpt-5.2-codex" },
  { name: "gpt-5.1-codex", provider: "openai", arenaScore: 1330, inputPrice: 1.25, outputPrice: 10, deprecated: true, openrouterSlug: "openai/gpt-5.1-codex" },
  { name: "gpt-5.1-codex-mini", provider: "openai", arenaScore: 1240, inputPrice: 0.25, outputPrice: 2, openrouterSlug: "openai/gpt-5.1-codex-mini" },

  // ── Google ─────────────────────────────────────────────────
  { name: "gemini-3.5-flash-medium", provider: "google", arenaScore: 1500, inputPrice: 1.5, outputPrice: 9, openrouterSlug: "google/gemini-3.5-flash" },
  { name: "gemini-3.1-pro-preview", provider: "google", arenaScore: 1445, inputPrice: 2, outputPrice: 12, openrouterSlug: "google/gemini-3.1-pro-preview" },
  { name: "gemini-3-pro", provider: "google", arenaScore: 1439, inputPrice: 2, outputPrice: 12, deprecated: true, openrouterSlug: "google/gemini-3-pro" },
  { name: "gemini-3-flash", provider: "google", arenaScore: 1437, inputPrice: 0.5, outputPrice: 3, openrouterSlug: "google/gemini-3-flash-preview" },
  { name: "gemini-3-flash (thinking-minimal)", provider: "google", arenaScore: 1387, inputPrice: 0.5, outputPrice: 3, openrouterSlug: "google/gemini-3-flash-preview" },
  { name: "gemma-4-31b", provider: "google", arenaScore: 1370, inputPrice: 0.14, outputPrice: 0.4, openrouterSlug: "google/gemma-4-31b-it" },
  { name: "gemma-4-26b-a4b", provider: "google", arenaScore: 1361, inputPrice: 0, outputPrice: 0, openrouterSlug: "google/gemma-4-26b-a4b-it" },
  { name: "gemini-3.1-flash-lite-preview", provider: "google", arenaScore: 1253, inputPrice: 0.25, outputPrice: 1.5, openrouterSlug: "google/gemini-3.1-flash-lite" },
  { name: "gemini-2.5-pro", provider: "google", arenaScore: 1204, inputPrice: 1.25, outputPrice: 10, openrouterSlug: "google/gemini-2.5-pro" },

  // ── Meta ────────────────────────────────────────────────────
  { name: "muse-spark-1.1", provider: "meta", arenaScore: 1540, inputPrice: 1.25, outputPrice: 4.25, openrouterSlug: "meta/muse-spark-1.1" },

  // ── Zhipu AI (GLM) ────────────────────────────────────────
  { name: "glm-5.2 (max)", provider: "zhipu", arenaScore: 1580, inputPrice: 1.4, outputPrice: 4.4, openrouterSlug: "z-ai/glm-5.2" },
  { name: "glm-5.1", provider: "zhipu", arenaScore: 1527, inputPrice: 1.4, outputPrice: 4.4, openrouterSlug: "z-ai/glm-5.1" },
  { name: "glm-5v-turbo", provider: "zhipu", arenaScore: 1402, inputPrice: 1.2, outputPrice: 4, openrouterSlug: "z-ai/glm-5v-turbo" },
  { name: "glm-5", provider: "zhipu", arenaScore: 1430, inputPrice: 1, outputPrice: 3.2, openrouterSlug: "z-ai/glm-5" },
  { name: "glm-4.7", provider: "zhipu", arenaScore: 1440, inputPrice: 0.4, outputPrice: 1.75, openrouterSlug: "z-ai/glm-4.7" },
  { name: "glm-4.6", provider: "zhipu", arenaScore: 1355, inputPrice: 0.43, outputPrice: 1.74, openrouterSlug: "z-ai/glm-4.6" },

  // ── Moonshot AI (Kimi) ─────────────────────────────────────
  { name: "kimi-k2.6", provider: "moonshot", arenaScore: 1513, inputPrice: 0.95, outputPrice: 4, openrouterSlug: "moonshotai/kimi-k2.6" },
  { name: "kimi-k2.7-code", provider: "moonshot", arenaScore: 1469, inputPrice: 0.72, outputPrice: 3.49, openrouterSlug: "moonshotai/kimi-k2.7" },
  { name: "kimi-k2.5-thinking", provider: "moonshot", arenaScore: 1433, inputPrice: 0.6, outputPrice: 3, openrouterSlug: "moonshotai/kimi-k2.5" },
  { name: "kimi-k2.5-instant", provider: "moonshot", arenaScore: 1408, inputPrice: 0.38, outputPrice: 2.02, openrouterSlug: "moonshotai/kimi-k2.5" },
  { name: "kimi-k2-thinking-turbo", provider: "moonshot", arenaScore: 1330, inputPrice: 1.15, outputPrice: 8, openrouterSlug: "moonshotai/kimi-k2" },

  // ── MiniMax ────────────────────────────────────────────────
  { name: "minimax-m3", provider: "minimax", arenaScore: 1496, inputPrice: 0.6, outputPrice: 2.4, openrouterSlug: "minimax/minimax-m3" },
  { name: "minimax-m2.7", provider: "minimax", arenaScore: 1395, inputPrice: 0.24, outputPrice: 0.96, openrouterSlug: "minimax/minimax-m2.7" },
  { name: "minimax-m2.1-preview", provider: "minimax", arenaScore: 1392, inputPrice: 0.3, outputPrice: 1.2, openrouterSlug: "minimax/minimax-m2.1" },
  { name: "minimax-m2.5", provider: "minimax", arenaScore: 1382, inputPrice: 0.15, outputPrice: 0.9, openrouterSlug: "minimax/minimax-m2.5" },
  { name: "minimax-m2", provider: "minimax", arenaScore: 1305, inputPrice: 0.26, outputPrice: 1.02, openrouterSlug: "minimax/minimax-m2" },

  // ── Alibaba (Qwen) ─────────────────────────────────────────
  { name: "qwen3.7-max-20260517", provider: "alibaba", arenaScore: 1521, inputPrice: 1.25, outputPrice: 3.75, openrouterSlug: "qwen/qwen3.7-max" },
  { name: "qwen3.6-max-preview", provider: "alibaba", arenaScore: 1480, inputPrice: 1.04, outputPrice: 6.24, openrouterSlug: "qwen/qwen3.6-max-preview" },
  { name: "qwen3.6-plus", provider: "alibaba", arenaScore: 1458, inputPrice: 0.33, outputPrice: 1.95, openrouterSlug: "qwen/qwen3.6-plus" },
  { name: "qwen3.5-397b-a17b", provider: "alibaba", arenaScore: 1396, inputPrice: 0.39, outputPrice: 2.45, openrouterSlug: "qwen/qwen3.5-397b-a17b" },
  { name: "qwen3.5-122b-a10b", provider: "alibaba", arenaScore: 1364, inputPrice: 0.26, outputPrice: 2.08, openrouterSlug: "qwen/qwen3.5-122b-a10b" },
  { name: "qwen3.5-27b", provider: "alibaba", arenaScore: 1357, inputPrice: 0.2, outputPrice: 1.56, openrouterSlug: "qwen/qwen3.5-27b" },
  { name: "qwen3.5-35b-a3b", provider: "alibaba", arenaScore: 1250, inputPrice: 0.14, outputPrice: 1, openrouterSlug: "qwen/qwen3.5-35b-a3b" },
  { name: "qwen3.5-flash", provider: "alibaba", arenaScore: 1237, inputPrice: 0, outputPrice: 0, openrouterSlug: "qwen/qwen3.5-flash" },
  { name: "qwen3-coder-480b-a35b-instruct", provider: "alibaba", arenaScore: 1281, inputPrice: 0.4, outputPrice: 1.6, openrouterSlug: "qwen/qwen3-coder-480b-a35b-instruct" },

  // ── Xiaomi (MiMo) ─────────────────────────────────────────
  { name: "mimo-v2.5-pro", provider: "xiaomi", arenaScore: 1473, inputPrice: 0.43, outputPrice: 0.87, openrouterSlug: "xiaomi/mimo-v2.5-pro" },
  { name: "mimo-v2.5", provider: "xiaomi", arenaScore: 1429, inputPrice: 0.1, outputPrice: 0.28, openrouterSlug: "xiaomi/mimo-v2.5" },
  { name: "mimo-v2-pro", provider: "xiaomi", arenaScore: 1431, inputPrice: 1, outputPrice: 3, openrouterSlug: "xiaomi/mimo-v2-pro" },
  { name: "mimo-v2-flash (non-thinking)", provider: "xiaomi", arenaScore: 1337, inputPrice: 0.1, outputPrice: 0.3, openrouterSlug: "xiaomi/mimo-v2-flash" },
  { name: "mimo-v2-flash (thinking)", provider: "xiaomi", arenaScore: 1301, inputPrice: 0.1, outputPrice: 0.3, openrouterSlug: "xiaomi/mimo-v2-flash" },

  // ── DeepSeek ───────────────────────────────────────────────
  { name: "deepseek-v4-pro", provider: "deepseek", arenaScore: 1446, inputPrice: 0.43, outputPrice: 0.87, openrouterSlug: "deepseek/deepseek-v4-pro" },
  { name: "deepseek-v4-pro-thinking", provider: "deepseek", arenaScore: 1457, inputPrice: 0.43, outputPrice: 0.87, openrouterSlug: "deepseek/deepseek-v4-pro" },
  { name: "deepseek-v3.2-thinking", provider: "deepseek", arenaScore: 1368, inputPrice: 0.21, outputPrice: 0.32, openrouterSlug: "deepseek/deepseek-v3.2" },
  { name: "deepseek-v3.2", provider: "deepseek", arenaScore: 1332, inputPrice: 0.21, outputPrice: 0.32, openrouterSlug: "deepseek/deepseek-v3.2" },
  { name: "deepseek-v3.2-exp", provider: "deepseek", arenaScore: 1288, inputPrice: 0.27, outputPrice: 0.41, openrouterSlug: "deepseek/deepseek-v3.2" },

  // ── xAI (Grok) ────────────────────────────────────────────
  { name: "grok-4.5", provider: "xai", arenaScore: 1566, inputPrice: 2, outputPrice: 6, openrouterSlug: "x-ai/grok-4.5" },
  { name: "grok-4.20-beta-0309-reasoning", provider: "xai", arenaScore: 1382, inputPrice: 2, outputPrice: 6, openrouterSlug: "x-ai/grok-4.20" },
  { name: "grok-4.3", provider: "xai", arenaScore: 1362, inputPrice: 1.25, outputPrice: 2.5, openrouterSlug: "x-ai/grok-4.3" },
  { name: "grok-4-1-fast-reasoning", provider: "xai", arenaScore: 1234, inputPrice: 0.2, outputPrice: 0.5, deprecated: true, openrouterSlug: "x-ai/grok-4.1-fast" },
  { name: "grok-4.1-thinking", provider: "xai", arenaScore: 1209, inputPrice: 0, outputPrice: 0, deprecated: true, openrouterSlug: "x-ai/grok-4.1" },
  { name: "grok-4-fast-reasoning", provider: "xai", arenaScore: 1150, inputPrice: 0.2, outputPrice: 0.5, deprecated: true, openrouterSlug: "x-ai/grok-4-fast" },
  { name: "grok-code-fast-1", provider: "xai", arenaScore: 1140, inputPrice: 0.2, outputPrice: 1.5, deprecated: true, openrouterSlug: "x-ai/grok-code-fast-1" },

  // ── Mistral ────────────────────────────────────────────────
  { name: "mistral-medium-3.5", provider: "mistral", arenaScore: 1267, inputPrice: 1.5, outputPrice: 7.5, openrouterSlug: "mistralai/mistral-medium-3-5" },
  { name: "mistral-large-3", provider: "mistral", arenaScore: 1224, inputPrice: 0.5, outputPrice: 1.5, openrouterSlug: "mistralai/mistral-large-2512" },
  { name: "devstral-2", provider: "mistral", arenaScore: 1200, inputPrice: 0, outputPrice: 0, openrouterSlug: "mistralai/devstral-2" },
  { name: "devstral-medium-2507", provider: "mistral", arenaScore: 1092, inputPrice: 0.4, outputPrice: 2, openrouterSlug: "mistralai/devstral-medium-2507" },

  // ── Tencent ────────────────────────────────────────────────
  { name: "hunyuan-hy3-preview", provider: "tencent", arenaScore: 1361, inputPrice: 0, outputPrice: 0, openrouterSlug: "tencent/hunyuan-hy3-preview" },

  // ── Kwai ───────────────────────────────────────────────────
  { name: "KAT-Coder-Pro-V1", provider: "kwai", arenaScore: 1259, inputPrice: 0.21, outputPrice: 0.83, deprecated: true, openrouterSlug: "kwai/kat-coder-pro-v1" },

  // ── IBM ────────────────────────────────────────────────────
  { name: "granite-4.1-8b", provider: "ibm", arenaScore: 1200, inputPrice: 0.05, outputPrice: 0.1, openrouterSlug: "ibm-granite/granite-4.1-8b" },

  // ── Arcee AI ───────────────────────────────────────────────
  { name: "trinity-large-thinking", provider: "arcee", arenaScore: 1243, inputPrice: 0.25, outputPrice: 0.8, openrouterSlug: "arcee-ai/trinity-large-thinking" },

  // ── Inception Labs ─────────────────────────────────────────
  { name: "mercury-2", provider: "inception", arenaScore: 1164, inputPrice: 0.25, outputPrice: 0.75, openrouterSlug: "inception/mercury-2" },

  // ── Poolside ───────────────────────────────────────────────
  { name: "laguna-m.1", provider: "poolside", arenaScore: 1354, inputPrice: 0.2, outputPrice: 0.4, openrouterSlug: "poolside/laguna-m.1" },
  { name: "laguna-xs.2", provider: "poolside", arenaScore: 1303, inputPrice: 0.1, outputPrice: 0.2, openrouterSlug: "poolside/laguna-xs.2" },

  // ── ByteDance (Seed) ──────────────────────────────────────
  { name: "seed-2.1-pro-preview", provider: "bytedance", arenaScore: 1539, inputPrice: 0, outputPrice: 0, openrouterSlug: "bytedance/seed-2.1-pro-preview" },
];
