#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type ExtractedModel = {
  modelName: string;
  score: string;
  inputPrice: number;
  outputPrice: number;
};

function extractModels(html: string): ExtractedModel[] {
  const rows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) ?? [];
  const results: ExtractedModel[] = [];

  for (const row of rows) {
    const anchorMatch = row.match(/<a[^>]*title="([^"]+)"[^>]*>/);
    if (!anchorMatch) {
      continue;
    }

    const cells = row.match(/<td[^>]*>[\s\S]*?<\/td>/g) ?? [];
    if (cells.length < 4) {
      continue;
    }

    const scoreMatch = cells[3].match(
      /<span[^>]*class="text-sm"[^>]*>(\d+)<\/span>/,
    );
    if (!scoreMatch) {
      continue;
    }

    const priceText = stripTags(cells[5] ?? "").replace(/\s+/g, " ").trim();
    const priceMatch = priceText.match(/\$([\d.]+)\s*\/\s*\$([\d.]+)/);
    const inputPrice = priceMatch ? Number.parseFloat(priceMatch[1]) : 0;
    const outputPrice = priceMatch ? Number.parseFloat(priceMatch[2]) : 0;

    results.push({
      modelName: anchorMatch[1],
      score: scoreMatch[1],
      inputPrice,
      outputPrice,
    });
  }

  return results;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

function main() {
  const inputPath = resolve(process.cwd(), process.argv[2] ?? "data.html");
  const html = readFileSync(inputPath, "utf8");
  const models = extractModels(html);

  for (const { modelName, score, inputPrice, outputPrice } of models) {
    console.log(`${modelName}\t${score}\t${inputPrice}\t${outputPrice}`);
  }

  console.log(`\nTotal models extracted: ${models.length}`);
}

main();
