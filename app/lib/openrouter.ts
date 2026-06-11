// OpenRouter frontend API — throughput (tokens/s) and pricing data fetching

interface RoutingHeuristics {
  p50_throughput_2_hours?: number;
  p50_throughput?: number;
  p50_latency?: number;
  p75_throughput_30_minutes?: number;
  p90_throughput_30_minutes?: number;
  request_count?: number;
  effective_prompt_price?: number;
  effective_completion_price?: number;
}

interface CatalogEndpointModel {
  slug: string;
  permaslug?: string;
}

interface CatalogEndpoint {
  routing_heuristics?: RoutingHeuristics;
  model?: CatalogEndpointModel;
}

interface CatalogModel {
  slug: string;
  short_name: string;
  permaslug?: string;
  endpoint?: CatalogEndpoint;
}

interface CatalogResponse {
  data: CatalogModel[];
}

/** モデルごとの pricing データ */
export interface ModelPricing {
  inputPrice: number;
  outputPrice: number;
}

/** プロバイダ（エンドポイント）ごとのデータ */
export interface EndpointData {
  providerName: string;
  providerSlug: string;
  variant: string;
  throughput: number;
  inputPrice: number;   // effective prompt price per 1M tokens
  outputPrice: number;  // effective completion price per 1M tokens
}

/**
 * ローカルモデル名 → OpenRouter slug のマッピングテーブル
 *
 * ローカルのモデル名 (例: claude-opus-4-6) と OpenRouter の slug
 * (例: anthropic/claude-opus-4.6) は形式が異なるため、明示的なマッピングが必要。
 */
const MODEL_NAME_TO_OPENROUTER_SLUG: Record<string, string> = {
  // ─ Anthropic ──────────────────────────────────────────────
  "claude-opus-4-7-thinking": "anthropic/claude-opus-4.7",
  "claude-opus-4-7": "anthropic/claude-opus-4.7",
  "claude-opus-4-8-thinking": "anthropic/claude-opus-4.8",
  "claude-opus-4-8": "anthropic/claude-opus-4.8",
  "claude-opus-4-6-thinking": "anthropic/claude-opus-4.6",
  "claude-opus-4-6": "anthropic/claude-opus-4.6",
  "claude-sonnet-4-6": "anthropic/claude-sonnet-4",
  "claude-opus-4-5-thinking": "anthropic/claude-opus-4.5",
  "claude-opus-4-5": "anthropic/claude-opus-4.5",
  "claude-sonnet-4-5-thinking": "anthropic/claude-sonnet-4.5",
  "claude-opus-4-1": "anthropic/claude-opus-4.1",
  "claude-sonnet-4-5": "anthropic/claude-sonnet-4.5",
  "claude-haiku-4-5": "anthropic/claude-4.5-haiku-20251001",
  "claude-fable-5": "anthropic/claude-fable-5",

  // ─ OpenAI ─────────────────────────────────────────────────
  "gpt-5.5-xhigh": "openai/gpt-5.5",
  "gpt-5.5-high": "openai/gpt-5.5",
  "gpt-5.4-high": "openai/gpt-5.4",
  "gpt-5.5": "openai/gpt-5.5",
  "gpt-5.4-medium": "openai/gpt-5.4",
  "gpt-5.3-codex-h": "openai/gpt-5.3-codex",
  "gpt-5.2": "openai/gpt-5.2",
  "gpt-5.4-mini-high": "openai/gpt-5.4-mini",
  "gpt-5-medium": "openai/gpt-5",
  "gpt-5.1-medium": "openai/gpt-5.1",
  "gpt-5.4": "openai/gpt-5.4",
  "gpt-5.3-codex-m": "openai/gpt-5.3-codex",
  "gpt-5.1": "openai/gpt-5.1",
  "gpt-5.2-codex": "openai/gpt-5.2-codex",
  "gpt-5.1-codex": "openai/gpt-5.1-codex",
  "gpt-5.1-codex-mini": "openai/gpt-5.1-codex-mini",

  // ── Google ─────────────────────────────────────────────────
  "gemini-3.5-flash": "google/gemini-3.5-flash",
  "gemini-3.1-pro": "google/gemini-3.1-pro-preview",
  "gemini-3-pro": "google/gemini-3-pro",
  "gemini-3-flash": "google/gemini-3-flash-preview",
  "gemini-3-flash-thinking": "google/gemini-3-flash-preview",
  "gemma-4-31b": "google/gemma-4-31b-it",
  "gemma-4-26b-a4b": "google/gemma-4-26b-a4b-it",
  "gemini-3.1-flash-lite": "google/gemini-3.1-flash-lite",
  "gemini-2.5-pro": "google/gemini-2.5-pro",

  // ── Zhipu AI ──────────────────────────────────────────────
  "glm-5.1": "z-ai/glm-5.1",
  "glm-4.7": "z-ai/glm-4.7",
  "glm-4.6": "z-ai/glm-4.6",

  // ── Moonshot AI ────────────────────────────────────────────
  "kimi-k2.6": "moonshotai/kimi-k2.6",
  "kimi-k2.5-thinking": "moonshotai/kimi-k2.5",
  "kimi-k2.5-instant": "moonshotai/kimi-k2.5",
  "kimi-k2-thinking-turbo": "moonshotai/kimi-k2",

  // ── Meta ───────────────────────────────────────────────────
  "muse-spark": "meta/muse-spark",

  // ── MiniMax ────────────────────────────────────────────────
  "minimax-m3": "minimax/minimax-m3",
  "minimax-m2.7": "minimax/minimax-m2.7",
  "minimax-m2.1-preview": "minimax/minimax-m2.1",
  "minimax-m2.5": "minimax/minimax-m2.5",
  "minimax-m2": "minimax/minimax-m2",

  // ── Alibaba (Qwen) ─────────────────────────────────────────
  "qwen3.7-max": "qwen/qwen3.7-max",
  "qwen3.6-max-preview": "qwen/qwen3.6-max-preview",
  "qwen3.6-plus": "qwen/qwen3.6-plus",
  "qwen3.5-397b-a17b": "qwen/qwen3.5-397b-a17b",
  "qwen3.5-122b-a10b": "qwen/qwen3.5-122b-a10b",
  "qwen3.5-27b": "qwen/qwen3.5-27b",
  "qwen3.5-35b-a3b": "qwen/qwen3.5-35b-a3b",
  "qwen3.5-flash": "qwen/qwen3.5-flash",

  // ── Xiaomi (MiMo) ────────────────────────────────────────
  "mimo-v2.5-pro": "xiaomi/mimo-v2.5-pro",
  "mimo-v2.5": "xiaomi/mimo-v2.5",
  "mimo-v2-pro": "xiaomi/mimo-v2-pro",
  "mimo-v2-flash": "xiaomi/mimo-v2-flash",
  "mimo-v2-flash-thinking": "xiaomi/mimo-v2-flash",

  // ─ DeepSeek ───────────────────────────────────────────────
  "deepseek-v4-pro-thinking": "deepseek/deepseek-v4-pro",
  "deepseek-v3.2-thinking": "deepseek/deepseek-v3.2",
  "deepseek-v3.2": "deepseek/deepseek-v3.2",
  "deepseek-v3.2-exp": "deepseek/deepseek-v3.2",

  // ── xAI (Grok) ─────────────────────────────────────────────
  "grok-4.20-beta": "x-ai/grok-4.20",
  "grok-4.3": "x-ai/grok-4.3",
  "grok-4-1-fast": "x-ai/grok-4.1-fast",
  "grok-4.1-thinking": "x-ai/grok-4.1",
  "grok-4-fast": "x-ai/grok-4-fast",
  "grok-code-fast-1": "x-ai/grok-code-fast-1",

  // ── Mistral ────────────────────────────────────────────────
  "mistral-medium-3.5": "mistralai/mistral-medium-3-5",
  "mistral-large-3": "mistralai/mistral-large-2512",
  "devstral-2": "mistralai/devstral-2",
  "devstral-medium": "mistralai/devstral-medium",

  // ── Tencent ────────────────────────────────────────────────
  "hunyuan-hy3-preview": "tencent/hunyuan-hy3-preview",

  // ── Kwai ───────────────────────────────────────────────────
  "KAT-Coder-Pro-V1": "kwai/kat-coder-pro-v1",

  // ── IBM ────────────────────────────────────────────────────
  "granite-4.1-8b": "ibm-granite/granite-4.1-8b",

  // ── Arcee AI ──────────────────────────────────────────────
  "trinity-large-thinking": "arcee-ai/trinity-large-thinking",

  // ── Inception Labs ─────────────────────────────────────────
  "mercury-2": "inception/mercury-2",
};

// ISR キャッシュ: APIレスポンスが5MB超でNext.jsデータキャッシュの上限(2MB)を超えるため、
// モジュールレベルで throughput Map のみをキャッシュする。
let cachedMap: Map<string, number> | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 600_000; // 10分

/**
 * OpenRouter の全モデル一覧から throughput データを取得し、
 * ローカルモデル名 → throughput (tok/s) の Map を返す。
 *
 * APIレスポンスが5MB超でNext.jsのISRキャッシュ上限を超えるため、
 * モジュールレベルのキャッシュ (10分TTL) でISRを実現する。
 */
export async function fetchThroughputMap(): Promise<Map<string, number>> {
  const now = Date.now();
  if (cachedMap && now - cachedAt < CACHE_TTL_MS) {
    return cachedMap;
  }

  const throughputBySlug = new Map<string, number>();
  const missingEntries: { slug: string; permaslug?: string }[] = [];

  try {
    const res = await fetch("https://openrouter.ai/api/frontend/v1/catalog/models");

    if (!res.ok) {
      console.error(
        `[openrouter] Failed to fetch models: ${res.status} ${res.statusText}`,
      );
      return throughputBySlug;
    }

    const json: CatalogResponse = await res.json();

    // フォールバック対象をマッピングに含まれるモデルのみに限定
    const targetSlugs = new Set<string>(Object.values(MODEL_NAME_TO_OPENROUTER_SLUG));

    for (const model of json.data) {
      const slug = model.slug;
      const ep = model.endpoint;
      const rh = ep?.routing_heuristics;

      // endpoint.routing_heuristics から最大 throughput を取得
      let bestThroughput: number | undefined;
      if (rh) {
        const t = rh.p50_throughput_2_hours ?? rh.p50_throughput;
        if (t != null) {
          bestThroughput = t;
        }
      }

      if (bestThroughput != null) {
        throughputBySlug.set(slug, bestThroughput);
      } else if (targetSlugs.has(slug)) {
        // permaslug を取得（モデルレベルまたは endpoint.model レベル）
        const permaslug = model.permaslug ?? ep?.model?.permaslug;
        missingEntries.push({ slug, permaslug });
      }
    }
  } catch (err) {
    console.error("[openrouter] Error fetching throughput data:", err);
  }

  // stats/endpoint API でフォールバック（permaslug を使う）
  // 直列だと遅いため、同時3件まで並列で fetch
  while (missingEntries.length > 0) {
    const batch = missingEntries.splice(0, 3);
    const results = await Promise.allSettled(
      batch.map(async (entry) => {
        if (!entry.permaslug) return undefined;
        const res = await fetch(
          `https://openrouter.ai/api/frontend/v1/stats/endpoint?permaslug=${encodeURIComponent(entry.permaslug)}&variant=standard`,
          { signal: AbortSignal.timeout(5000), next: { revalidate: 600 } },
        );
        if (!res.ok) return undefined;
        const json = await res.json();
        // 新APIでは data はエンドポイントの配列で、各エンドポイントが routing_heuristics を持つ
        const endpoints = json.data ?? [];
        let bestThroughput: number | undefined;
        for (const ep of endpoints) {
          // routing_heuristics をチェック
          const rh = ep.routing_heuristics;
          if (rh) {
            const t = rh.p50_throughput_2_hours ?? rh.p50_throughput;
            if (t != null && (bestThroughput === undefined || t > bestThroughput)) {
              bestThroughput = t;
            }
          }
          // routing_heuristics がない場合は stats もチェック
          const stats = ep.stats ?? ep.statsByTier?.default;
          if (stats) {
            const t = stats.p50_throughput;
            if (t != null && (bestThroughput === undefined || t > bestThroughput)) {
              bestThroughput = t;
            }
          }
        }
        return { slug: entry.slug, throughput: bestThroughput };
      }),
    );
    for (const r of results) {
      if (r.status === "fulfilled" && r.value?.throughput != null) {
        throughputBySlug.set(r.value.slug, r.value.throughput);
      }
    }
  }

  // ローカルモデル名 → throughput の Map に変換
  const result = new Map<string, number>();
  for (const [localName, slug] of Object.entries(MODEL_NAME_TO_OPENROUTER_SLUG)) {
    const throughput = throughputBySlug.get(slug);
    if (throughput != null) {
      result.set(localName, Math.round(throughput));
    }
  }

  cachedMap = result;
  cachedAt = now;

  return result;
}

// ─── Endpoint キャッシュ ──────────────────────────────────────
let cachedEndpointMap: Map<string, EndpointData[]> | null = null;
let cachedEndpointAt = 0;
const ENDPOINT_CACHE_TTL_MS = 600_000; // 10分

interface EndpointRawInfo {
  providerName: string;
  providerSlug: string;
  variant: string;
  inputPrice: number;
  outputPrice: number;
  /** providerName + "::" + providerSlug で stats API とマッチングする */
  key: string;
}

interface EndpointsInfo {
  localName: string;
  slug: string;
  permaslug: string;
  infoList: EndpointRawInfo[];
}

interface EndpointStats {
  throughput: number;
  inputPrice?: number;
  outputPrice?: number;
}

/**
 * stats/endpoint API から各エンドポイントのスループットと実効価格を取得し、
 * providerName + "::" + providerSlug のキー → stats の Map を返す。
 *
 * 実効価格（effective_prompt_price / effective_completion_price）は
 * プロンプトキャッシュ適用後の実際の価格であり、リスト価格より正確。
 */
async function fetchEndpointStatsMap(
  permaslug: string,
): Promise<Map<string, EndpointStats>> {
  try {
    const res = await fetch(
      `https://openrouter.ai/api/frontend/v1/stats/endpoint?permaslug=${encodeURIComponent(permaslug)}&variant=standard`,
      { signal: AbortSignal.timeout(8000), next: { revalidate: 600 } },
    );
    if (!res.ok) {
      if (res.status !== 404) {
        console.warn(
          `[openrouter] Stats endpoint fetch failed for ${permaslug}: ${res.status}`,
        );
      }
      return new Map();
    }
    const json = await res.json();
    const result = new Map<string, EndpointStats>();
    for (const item of json.data ?? []) {
      // stats API はルートレベルに provider_name / provider_slug を持つ
      const providerName =
        (item.provider_name as string) ??
        (item.provider_info?.name as string) ??
        "";
      const providerSlug =
        (item.provider_slug as string) ??
        (item.provider_info?.slug as string) ??
        "";
      if (!providerName || !providerSlug) continue;

      const rh = (item.routing_heuristics ?? {}) as RoutingHeuristics;
      const stats = item.stats;

      let throughput: number | null = null;
      if (rh) {
        throughput = rh.p50_throughput_2_hours ?? rh.p50_throughput ?? null;
      }
      if (throughput == null && stats) {
        throughput = stats.p50_throughput ?? null;
      }

      const effectivePromptPrice = rh?.effective_prompt_price;
      const effectiveCompletionPrice = rh?.effective_completion_price;

      const key = `${providerName}::${providerSlug}`;

      if (
        throughput != null ||
        effectivePromptPrice != null ||
        effectiveCompletionPrice != null
      ) {
        result.set(key, {
          throughput: throughput != null ? Math.round(throughput) : 0,
          inputPrice:
            effectivePromptPrice != null
              ? Math.round(effectivePromptPrice * 1_000_000 * 100) / 100
              : undefined,
          outputPrice:
            effectiveCompletionPrice != null
              ? Math.round(effectiveCompletionPrice * 1_000_000 * 100) / 100
              : undefined,
        });
      }
    }
    return result;
  } catch (err) {
    console.error(
      `[openrouter] Error fetching endpoint stats for ${permaslug}:`,
      err,
    );
    return new Map();
  }
}

/**
 * OpenRouter から各モデルの全プロバイダ（エンドポイント）情報を取得する。
 * スループットはモデルレベルの catalaog/stats ではなく、
 * stats/endpoint API のエンドポイント個別値を使用する。
 */
export async function fetchEndpointMap(): Promise<Map<string, EndpointData[]>> {
  const now = Date.now();
  if (cachedEndpointMap && now - cachedEndpointAt < ENDPOINT_CACHE_TTL_MS) {
    return cachedEndpointMap;
  }

  const result = new Map<string, EndpointData[]>();
  const entries = Object.entries(MODEL_NAME_TO_OPENROUTER_SLUG);
  const BATCH_SIZE = 5;

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);

    // 1) endpoints API で基本情報（プロバイダ・価格）を取得
    const endpointsResults = await Promise.allSettled(
      batch.map(async ([localName, slug]) => {
        const res = await fetch(
          `https://openrouter.ai/api/v1/models/${slug}/endpoints`,
          { signal: AbortSignal.timeout(8000), next: { revalidate: 600 } },
        );
        if (!res.ok) return null;
        const json = await res.json();
        const eps = json?.data?.endpoints ?? [];
        if (eps.length === 0) return null;

        // permaslug を最初のエンドポイントの name から抽出
        // "Provider | anthropic/claude-4.6-opus-20260205" → "anthropic/claude-4.6-opus-20260205"
        const firstName = (eps[0].name as string) ?? "";
        const parts = firstName.split(" | ");
        const permaslug = parts.length > 1 ? parts[1] : "";

        const infoList: EndpointRawInfo[] = [];
        for (const ep of eps) {
          const promptStr = ep.pricing?.prompt;
          const completionStr = ep.pricing?.completion;
          if (!promptStr || !completionStr) continue;

          const promptPrice = Number.parseFloat(promptStr);
          const completionPrice = Number.parseFloat(completionStr);
          if (
            Number.isNaN(promptPrice) ||
            Number.isNaN(completionPrice)
          ) {
            continue;
          }

          const providerName = ep.provider_name ?? "unknown";
          const tag = ep.tag ?? "unknown";
          const variant = tag ? (tag.split("/").pop() ?? "standard") : "standard";

          infoList.push({
            providerName,
            providerSlug: tag,
            variant,
            inputPrice: Math.round(promptPrice * 1_000_000 * 100) / 100,
            outputPrice: Math.round(completionPrice * 1_000_000 * 100) / 100,
            key: `${providerName}::${tag}`,
          });
        }

        return { localName, slug, permaslug, infoList } as EndpointsInfo;
      }),
    );

    // 2) 各モデルの permaslug に対して stats API を叩いて個別スループット＆実効価格を取得
    const statsMaps = new Map<string, Map<string, EndpointStats>>();
    const fulfilledResults = endpointsResults
      .map((r, idx) => ({ result: r, idx }))
      .filter(
        (
          item,
        ): item is {
          result: PromiseFulfilledResult<EndpointsInfo>;
          idx: number;
        } =>
          item.result.status === "fulfilled" &&
          item.result.value != null &&
          item.result.value.permaslug.length > 0,
      );

    const statsPromises = fulfilledResults.map(async (item) => {
      const statsMap = await fetchEndpointStatsMap(
        item.result.value.permaslug,
      );
      return { localName: item.result.value.localName, statsMap };
    });

    const statsResults = await Promise.allSettled(statsPromises);
    for (const sr of statsResults) {
      if (sr.status === "fulfilled") {
        statsMaps.set(sr.value.localName, sr.value.statsMap);
      }
    }

    // 3) 基本情報とスループット・実効価格をマージして EndpointData を構築
    for (const er of endpointsResults) {
      if (er.status !== "fulfilled" || er.value == null) continue;
      const info = er.value as EndpointsInfo;
      if (info.infoList.length === 0) continue;

      const statsMapForModel = statsMaps.get(info.localName) ?? new Map<string, EndpointStats>();
      const endpoints: EndpointData[] = info.infoList.map((entry) => {
        const stats = statsMapForModel.get(entry.key);
        return {
          providerName: entry.providerName,
          providerSlug: entry.providerSlug,
          variant: entry.variant,
          throughput: stats?.throughput ?? 0,
          inputPrice: stats?.inputPrice ?? entry.inputPrice,
          outputPrice: stats?.outputPrice ?? entry.outputPrice,
        };
      });
      result.set(info.localName, endpoints);
    }
  }

  cachedEndpointMap = result;
  cachedEndpointAt = now;

  return result;
}

// ── Pricing キャッシュ ───────────────────────────────────────────
let cachedPricingMap: Map<string, ModelPricing> | null = null;
let cachedPricingAt = 0;
const PRICING_CACHE_TTL_MS = 600_000; // 10分

// v1/models API のレスポンス型
interface V1Model {
  id?: string;
  slug?: string;
  pricing?: {
    prompt?: string;
    completion?: string;
  };
}

interface V1ModelsResponse {
  data: V1Model[];
}

/**
 * OpenRouter の全モデル一覧から pricing データを取得し、
 * ローカルモデル名 → { inputPrice, outputPrice } の Map を返す。
 *
 * pricing の値は「1トークンあたりのUSD」なので、1Mトークン単位に変換する。
 */
export async function fetchPricingMap(): Promise<Map<string, ModelPricing>> {
  const now = Date.now();
  if (cachedPricingMap && now - cachedPricingAt < PRICING_CACHE_TTL_MS) {
    return cachedPricingMap;
  }

  const pricingBySlug = new Map<string, ModelPricing>();

  try {
    const res = await fetch("https://openrouter.ai/api/v1/models");

    if (!res.ok) {
      console.error(
        `[openrouter] Failed to fetch pricing: ${res.status} ${res.statusText}`,
      );
      return pricingBySlug;
    }

    const json: V1ModelsResponse = await res.json();

    for (const model of json.data) {
      const slug = model.id ?? model.slug;
      if (!slug) continue;
      const p = model.pricing;
      if (!p) continue;

      const promptStr = p.prompt;
      const completionStr = p.completion;
      if (!promptStr || !completionStr) continue;

      const promptPrice = Number.parseFloat(promptStr);
      const completionPrice = Number.parseFloat(completionStr);
      if (
        !Number.isNaN(promptPrice) &&
        !Number.isNaN(completionPrice)
      ) {
        pricingBySlug.set(slug, {
          inputPrice: Math.round(promptPrice * 1_000_000 * 100) / 100,
          outputPrice: Math.round(completionPrice * 1_000_000 * 100) / 100,
        });
      }
    }
  } catch (err) {
    console.error("[openrouter] Error fetching pricing data:", err);
  }

  // ローカルモデル名 → pricing の Map に変換
  const result = new Map<string, ModelPricing>();
  for (const [localName, slug] of Object.entries(MODEL_NAME_TO_OPENROUTER_SLUG)) {
    const pricing = pricingBySlug.get(slug);
    if (pricing != null) {
      result.set(localName, pricing);
    }
  }

  cachedPricingMap = result;
  cachedPricingAt = now;

  return result;
}
