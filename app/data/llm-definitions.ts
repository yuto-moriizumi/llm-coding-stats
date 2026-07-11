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
