#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

type ExtractedModel = {
  modelName: string;
  score: number;
  inputPrice: number;
  outputPrice: number;
};

type StoredModel = {
  name: string;
  provider: string;
  arenaScore: number;
  openrouterSlug: string;
  deprecated: boolean;
};

const MODEL_DATA_PATH = resolve(process.cwd(), "app/data/llm-models.ts");

const NEW_MODEL_METADATA: Record<string, Omit<StoredModel, "name" | "arenaScore">> = {
  "gemini-3.6-flash": {
    provider: "google",
    openrouterSlug: "google/gemini-3.6-flash",
    deprecated: false,
  },
  hy3: {
    provider: "tencent",
    openrouterSlug: "tencent/hy3",
    deprecated: false,
  },
  "gemini-3.5-flash": {
    provider: "google",
    openrouterSlug: "google/gemini-3.5-flash",
    deprecated: false,
  },
  "kimi-k3": {
    provider: "moonshot",
    openrouterSlug: "moonshotai/kimi-k3",
    deprecated: false,
  },
  "gpt-5.6-sol-xhigh (codex-harness)": {
    provider: "openai",
    openrouterSlug: "openai/gpt-5.6-sol",
    deprecated: false,
  },
  inkling: {
    provider: "other",
    openrouterSlug: "other/inkling",
    deprecated: false,
  },
};

function extractModels(html: string): ExtractedModel[] {
  const rows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) ?? [];
  const results: ExtractedModel[] = [];

  for (const row of rows) {
    const modelName =
      row.match(/<a[^>]*title="([^"]+)"[^>]*>/)?.[1] ??
      row.match(/<span[^>]*title="([^"]+)"[^>]*>/)?.[1];
    if (!modelName) {
      continue;
    }

    const cells = row.match(/<td[^>]*>[\s\S]*?<\/td>/g) ?? [];
    if (cells.length < 4) {
      continue;
    }

    const scoreMatch = cells[3].match(/<(?:span|div)[^>]*>([\d,]+)/);
    if (!scoreMatch) {
      continue;
    }

    const priceText = stripTags(cells[5] ?? "").replace(/\s+/g, " ").trim();
    const priceMatch = priceText.match(/\$([\d.]+)\s*\/\s*\$([\d.]+)/);
    const inputPrice = priceMatch ? Number.parseFloat(priceMatch[1]) : 0;
    const outputPrice = priceMatch ? Number.parseFloat(priceMatch[2]) : 0;

    results.push({
      modelName,
      score: Number.parseInt(scoreMatch[1].replaceAll(",", ""), 10),
      inputPrice,
      outputPrice,
    });
  }

  const uniqueModels = new Map<string, ExtractedModel>();
  for (const model of results) {
    const existing = uniqueModels.get(model.modelName);
    if (!existing || model.score > existing.score) {
      uniqueModels.set(model.modelName, model);
    }
  }

  return [...uniqueModels.values()];
}

function readStoredModels(): Map<string, StoredModel> {
  const source = readFileSync(MODEL_DATA_PATH, "utf8");
  const models = new Map<string, StoredModel>();
  const entryPattern = /\{\s*name: ("(?:\\.|[^"\\])*")[^\n]*\}/g;

  for (const match of source.matchAll(entryPattern)) {
    const entry = match[0];
    const name = JSON.parse(match[1]) as string;
    const provider = entry.match(/provider: "([^"]+)"/)?.[1];
    const arenaScore = entry.match(/arenaScore: (\d+)/)?.[1];
    const openrouterSlug = entry.match(/openrouterSlug: "([^"]+)"/)?.[1];
    if (!provider || !arenaScore || !openrouterSlug) {
      continue;
    }
    models.set(name, {
      name,
      provider,
      arenaScore: Number(arenaScore),
      openrouterSlug,
      deprecated: /deprecated: true/.test(entry),
    });
  }

  return models;
}

function writeModelData(extractedModels: ExtractedModel[]): void {
  const storedModels = readStoredModels();
  const entries = extractedModels.map(({ modelName, score }) => {
    const existingName =
      modelName === "gpt-5.6-sol-xhigh (codex-harness)"
        ? "gpt-5.6-sol-xhigh"
        : modelName;
    const existing = storedModels.get(existingName);
    const metadata = existing ?? NEW_MODEL_METADATA[modelName];
    if (!metadata) {
      throw new Error(`Missing metadata for newly discovered model: ${modelName}`);
    }

    const deprecated = metadata.deprecated ? ", deprecated: true" : "";
    return `  { name: ${JSON.stringify(modelName)}, provider: "${metadata.provider}", arenaScore: ${score}${deprecated}, openrouterSlug: "${metadata.openrouterSlug}" },`;
  });

  const source = readFileSync(MODEL_DATA_PATH, "utf8");
  const updated = source.replace(
    /export const LLM_MODELS: LLMModelDefinition\[\] = \[[\s\S]*?\n\];/,
    `export const LLM_MODELS: LLMModelDefinition[] = [\n${entries.join("\n")}\n];`,
  );
  writeFileSync(MODEL_DATA_PATH, updated);
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

function main() {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const inputPath = resolve(process.cwd(), args.find((arg) => arg !== "--write") ?? "data.html");
  const html = readFileSync(inputPath, "utf8");
  const models = extractModels(html);

  if (write) {
    writeModelData(models);
    console.log(`Updated ${MODEL_DATA_PATH} with ${models.length} models.`);
  }

  for (const { modelName, score, inputPrice, outputPrice } of models) {
    console.log(`${modelName}\t${score}\t${inputPrice}\t${outputPrice}`);
  }

  console.log(`\nTotal models extracted: ${models.length}`);
}

main();
