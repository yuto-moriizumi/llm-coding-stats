import type { LLMModelDefinition } from "./llm-definitions";

export const LLM_MODELS: LLMModelDefinition[] = [
  // ── Anthropic ──────────────────────────────────────────────
  { name: "claude-fable-5", provider: "anthropic", arenaScore: 1649, openrouterSlug: "anthropic/claude-fable-5" },
  { name: "claude-opus-4-7-thinking", provider: "anthropic", arenaScore: 1557, openrouterSlug: "anthropic/claude-opus-4.7" },
  { name: "claude-opus-4-8-thinking", provider: "anthropic", arenaScore: 1560, openrouterSlug: "anthropic/claude-opus-4.8" },
  { name: "claude-opus-4-7", provider: "anthropic", arenaScore: 1557, openrouterSlug: "anthropic/claude-opus-4.7" },
  { name: "claude-opus-4-6-thinking", provider: "anthropic", arenaScore: 1543, openrouterSlug: "anthropic/claude-opus-4.6" },
  { name: "claude-opus-4-8", provider: "anthropic", arenaScore: 1534, openrouterSlug: "anthropic/claude-opus-4.8" },
  { name: "claude-opus-4-6", provider: "anthropic", arenaScore: 1536, openrouterSlug: "anthropic/claude-opus-4.6" },
  { name: "claude-sonnet-4-6", provider: "anthropic", arenaScore: 1521, openrouterSlug: "anthropic/claude-sonnet-4" },
  { name: "claude-sonnet-5-high", provider: "anthropic", arenaScore: 1543, openrouterSlug: "anthropic/claude-sonnet-5" },
  { name: "claude-opus-4-5-20251101-thinking-32k", provider: "anthropic", arenaScore: 1490, openrouterSlug: "anthropic/claude-opus-4.5" },
  { name: "claude-opus-4-5-20251101", provider: "anthropic", arenaScore: 1466, openrouterSlug: "anthropic/claude-opus-4.5" },
  { name: "claude-sonnet-4-5-20250929-thinking-32k", provider: "anthropic", arenaScore: 1388, openrouterSlug: "anthropic/claude-sonnet-4.5" },
  { name: "claude-opus-4-1-20250805", provider: "anthropic", arenaScore: 1386, openrouterSlug: "anthropic/claude-opus-4.1" },
  { name: "claude-sonnet-4-5-20250929", provider: "anthropic", arenaScore: 1386, openrouterSlug: "anthropic/claude-sonnet-4.5" },
  { name: "claude-haiku-4-5-20251001", provider: "anthropic", arenaScore: 1327, openrouterSlug: "anthropic/claude-4.5-haiku-20251001" },

  // ── OpenAI ─────────────────────────────────────────────────
  { name: "gpt-5.6-sol-xhigh", provider: "openai", arenaScore: 1636, openrouterSlug: "openai/gpt-5.6-sol" },
  { name: "gpt-5.5-xhigh (codex-harness)", provider: "openai", arenaScore: 1502, openrouterSlug: "openai/gpt-5.5" },
  { name: "gpt-5.5-high (codex-harness)", provider: "openai", arenaScore: 1481, openrouterSlug: "openai/gpt-5.5" },
  { name: "gpt-5.4-high (codex-harness)", provider: "openai", arenaScore: 1457, openrouterSlug: "openai/gpt-5.4" },
  { name: "gpt-5.5 (codex-harness)", provider: "openai", arenaScore: 1450, openrouterSlug: "openai/gpt-5.5" },
  { name: "gpt-5.4-medium (codex-harness)", provider: "openai", arenaScore: 1437, openrouterSlug: "openai/gpt-5.4" },
  { name: "gpt-5.3-codex (codex-harness)", provider: "openai", arenaScore: 1406, openrouterSlug: "openai/gpt-5.3-codex" },
  { name: "gpt-5.2", provider: "openai", arenaScore: 1405, openrouterSlug: "openai/gpt-5.2" },
  { name: "gpt-5.4-mini-high", provider: "openai", arenaScore: 1397, openrouterSlug: "openai/gpt-5.4-mini" },
  { name: "gpt-5-medium", provider: "openai", arenaScore: 1394, openrouterSlug: "openai/gpt-5" },
  { name: "gpt-5.1-medium", provider: "openai", arenaScore: 1391, deprecated: true, openrouterSlug: "openai/gpt-5.1" },
  { name: "gpt-5.4", provider: "openai", arenaScore: 1392, openrouterSlug: "openai/gpt-5.4" },
  { name: "gpt-5.1", provider: "openai", arenaScore: 1340, deprecated: true, openrouterSlug: "openai/gpt-5.1" },
  { name: "gpt-5.2-codex", provider: "openai", arenaScore: 1334, openrouterSlug: "openai/gpt-5.2-codex" },
  { name: "gpt-5.1-codex", provider: "openai", arenaScore: 1330, deprecated: true, openrouterSlug: "openai/gpt-5.1-codex" },
  { name: "gpt-5.1-codex-mini", provider: "openai", arenaScore: 1240, openrouterSlug: "openai/gpt-5.1-codex-mini" },

  // ── Google ─────────────────────────────────────────────────
  { name: "gemini-3.5-flash-medium", provider: "google", arenaScore: 1500, openrouterSlug: "google/gemini-3.5-flash" },
  { name: "gemini-3.1-pro-preview", provider: "google", arenaScore: 1445, openrouterSlug: "google/gemini-3.1-pro-preview" },
  { name: "gemini-3-pro", provider: "google", arenaScore: 1439, deprecated: true, openrouterSlug: "google/gemini-3-pro" },
  { name: "gemini-3-flash", provider: "google", arenaScore: 1437, openrouterSlug: "google/gemini-3-flash-preview" },
  { name: "gemini-3-flash (thinking-minimal)", provider: "google", arenaScore: 1387, openrouterSlug: "google/gemini-3-flash-preview" },
  { name: "gemma-4-31b", provider: "google", arenaScore: 1370, openrouterSlug: "google/gemma-4-31b-it" },
  { name: "gemma-4-26b-a4b", provider: "google", arenaScore: 1361, openrouterSlug: "google/gemma-4-26b-a4b-it" },
  { name: "gemini-3.1-flash-lite-preview", provider: "google", arenaScore: 1253, openrouterSlug: "google/gemini-3.1-flash-lite" },
  { name: "gemini-2.5-pro", provider: "google", arenaScore: 1204, openrouterSlug: "google/gemini-2.5-pro" },

  // ── Meta ────────────────────────────────────────────────────
  { name: "muse-spark-1.1", provider: "meta", arenaScore: 1540, openrouterSlug: "meta/muse-spark-1.1" },

  // ── Zhipu AI (GLM) ────────────────────────────────────────
  { name: "glm-5.2 (max)", provider: "zhipu", arenaScore: 1580, openrouterSlug: "z-ai/glm-5.2" },
  { name: "glm-5.1", provider: "zhipu", arenaScore: 1527, openrouterSlug: "z-ai/glm-5.1" },
  { name: "glm-5v-turbo", provider: "zhipu", arenaScore: 1402, openrouterSlug: "z-ai/glm-5v-turbo" },
  { name: "glm-5", provider: "zhipu", arenaScore: 1430, openrouterSlug: "z-ai/glm-5" },
  { name: "glm-4.7", provider: "zhipu", arenaScore: 1440, openrouterSlug: "z-ai/glm-4.7" },
  { name: "glm-4.6", provider: "zhipu", arenaScore: 1355, openrouterSlug: "z-ai/glm-4.6" },

  // ── Moonshot AI (Kimi) ─────────────────────────────────────
  { name: "kimi-k2.6", provider: "moonshot", arenaScore: 1513, openrouterSlug: "moonshotai/kimi-k2.6" },
  { name: "kimi-k2.7-code", provider: "moonshot", arenaScore: 1469, openrouterSlug: "moonshotai/kimi-k2.7" },
  { name: "kimi-k2.5-thinking", provider: "moonshot", arenaScore: 1433, openrouterSlug: "moonshotai/kimi-k2.5" },
  { name: "kimi-k2.5-instant", provider: "moonshot", arenaScore: 1408, openrouterSlug: "moonshotai/kimi-k2.5" },
  { name: "kimi-k2-thinking-turbo", provider: "moonshot", arenaScore: 1330, openrouterSlug: "moonshotai/kimi-k2" },

  // ── MiniMax ────────────────────────────────────────────────
  { name: "minimax-m3", provider: "minimax", arenaScore: 1496, openrouterSlug: "minimax/minimax-m3" },
  { name: "minimax-m2.7", provider: "minimax", arenaScore: 1395, openrouterSlug: "minimax/minimax-m2.7" },
  { name: "minimax-m2.1-preview", provider: "minimax", arenaScore: 1392, openrouterSlug: "minimax/minimax-m2.1" },
  { name: "minimax-m2.5", provider: "minimax", arenaScore: 1382, openrouterSlug: "minimax/minimax-m2.5" },
  { name: "minimax-m2", provider: "minimax", arenaScore: 1305, openrouterSlug: "minimax/minimax-m2" },

  // ── Alibaba (Qwen) ─────────────────────────────────────────
  { name: "qwen3.7-max-20260517", provider: "alibaba", arenaScore: 1521, openrouterSlug: "qwen/qwen3.7-max" },
  { name: "qwen3.6-max-preview", provider: "alibaba", arenaScore: 1480, openrouterSlug: "qwen/qwen3.6-max-preview" },
  { name: "qwen3.6-plus", provider: "alibaba", arenaScore: 1458, openrouterSlug: "qwen/qwen3.6-plus" },
  { name: "qwen3.5-397b-a17b", provider: "alibaba", arenaScore: 1396, openrouterSlug: "qwen/qwen3.5-397b-a17b" },
  { name: "qwen3.5-122b-a10b", provider: "alibaba", arenaScore: 1364, openrouterSlug: "qwen/qwen3.5-122b-a10b" },
  { name: "qwen3.5-27b", provider: "alibaba", arenaScore: 1357, openrouterSlug: "qwen/qwen3.5-27b" },
  { name: "qwen3.5-35b-a3b", provider: "alibaba", arenaScore: 1250, openrouterSlug: "qwen/qwen3.5-35b-a3b" },
  { name: "qwen3.5-flash", provider: "alibaba", arenaScore: 1237, openrouterSlug: "qwen/qwen3.5-flash" },
  { name: "qwen3-coder-480b-a35b-instruct", provider: "alibaba", arenaScore: 1281, openrouterSlug: "qwen/qwen3-coder-480b-a35b-instruct" },

  // ── Xiaomi (MiMo) ─────────────────────────────────────────
  { name: "mimo-v2.5-pro", provider: "xiaomi", arenaScore: 1473, openrouterSlug: "xiaomi/mimo-v2.5-pro" },
  { name: "mimo-v2.5", provider: "xiaomi", arenaScore: 1429, openrouterSlug: "xiaomi/mimo-v2.5" },
  { name: "mimo-v2-pro", provider: "xiaomi", arenaScore: 1431, openrouterSlug: "xiaomi/mimo-v2-pro" },
  { name: "mimo-v2-flash (non-thinking)", provider: "xiaomi", arenaScore: 1337, openrouterSlug: "xiaomi/mimo-v2-flash" },
  { name: "mimo-v2-flash (thinking)", provider: "xiaomi", arenaScore: 1301, openrouterSlug: "xiaomi/mimo-v2-flash" },

  // ── DeepSeek ───────────────────────────────────────────────
  { name: "deepseek-v4-pro", provider: "deepseek", arenaScore: 1446, openrouterSlug: "deepseek/deepseek-v4-pro" },
  { name: "deepseek-v4-pro-thinking", provider: "deepseek", arenaScore: 1457, openrouterSlug: "deepseek/deepseek-v4-pro" },
  { name: "deepseek-v3.2-thinking", provider: "deepseek", arenaScore: 1368, openrouterSlug: "deepseek/deepseek-v3.2" },
  { name: "deepseek-v3.2", provider: "deepseek", arenaScore: 1332, openrouterSlug: "deepseek/deepseek-v3.2" },
  { name: "deepseek-v3.2-exp", provider: "deepseek", arenaScore: 1288, openrouterSlug: "deepseek/deepseek-v3.2" },

  // ── xAI (Grok) ────────────────────────────────────────────
  { name: "grok-4.5", provider: "xai", arenaScore: 1566, openrouterSlug: "x-ai/grok-4.5" },
  { name: "grok-4.20-beta-0309-reasoning", provider: "xai", arenaScore: 1382, openrouterSlug: "x-ai/grok-4.20" },
  { name: "grok-4.3", provider: "xai", arenaScore: 1362, openrouterSlug: "x-ai/grok-4.3" },
  { name: "grok-4-1-fast-reasoning", provider: "xai", arenaScore: 1234, deprecated: true, openrouterSlug: "x-ai/grok-4.1-fast" },
  { name: "grok-4.1-thinking", provider: "xai", arenaScore: 1209, deprecated: true, openrouterSlug: "x-ai/grok-4.1" },
  { name: "grok-4-fast-reasoning", provider: "xai", arenaScore: 1150, deprecated: true, openrouterSlug: "x-ai/grok-4-fast" },
  { name: "grok-code-fast-1", provider: "xai", arenaScore: 1140, deprecated: true, openrouterSlug: "x-ai/grok-code-fast-1" },

  // ── Mistral ────────────────────────────────────────────────
  { name: "mistral-medium-3.5", provider: "mistral", arenaScore: 1267, openrouterSlug: "mistralai/mistral-medium-3-5" },
  { name: "mistral-large-3", provider: "mistral", arenaScore: 1224, openrouterSlug: "mistralai/mistral-large-2512" },
  { name: "devstral-2", provider: "mistral", arenaScore: 1200, openrouterSlug: "mistralai/devstral-2" },
  { name: "devstral-medium-2507", provider: "mistral", arenaScore: 1092, openrouterSlug: "mistralai/devstral-medium-2507" },

  // ── Tencent ────────────────────────────────────────────────
  { name: "hunyuan-hy3-preview", provider: "tencent", arenaScore: 1361, openrouterSlug: "tencent/hunyuan-hy3-preview" },

  // ── Kwai ───────────────────────────────────────────────────
  { name: "KAT-Coder-Pro-V1", provider: "kwai", arenaScore: 1259, deprecated: true, openrouterSlug: "kwai/kat-coder-pro-v1" },

  // ── IBM ────────────────────────────────────────────────────
  { name: "granite-4.1-8b", provider: "ibm", arenaScore: 1200, openrouterSlug: "ibm-granite/granite-4.1-8b" },

  // ── Arcee AI ───────────────────────────────────────────────
  { name: "trinity-large-thinking", provider: "arcee", arenaScore: 1243, openrouterSlug: "arcee-ai/trinity-large-thinking" },

  // ── Inception Labs ─────────────────────────────────────────
  { name: "mercury-2", provider: "inception", arenaScore: 1164, openrouterSlug: "inception/mercury-2" },

  // ── Poolside ───────────────────────────────────────────────
  { name: "laguna-m.1", provider: "poolside", arenaScore: 1354, openrouterSlug: "poolside/laguna-m.1" },
  { name: "laguna-xs.2", provider: "poolside", arenaScore: 1303, openrouterSlug: "poolside/laguna-xs.2" },

  // ── ByteDance (Seed) ──────────────────────────────────────
  { name: "seed-2.1-pro-preview", provider: "bytedance", arenaScore: 1539, openrouterSlug: "bytedance/seed-2.1-pro-preview" },
];
