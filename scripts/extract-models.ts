#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type ExtractedModel = {
  modelName: string;
  score: string;
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

    results.push({
      modelName: anchorMatch[1],
      score: scoreMatch[1],
    });
  }

  return results;
}

function main() {
  const inputPath = resolve(process.cwd(), process.argv[2] ?? "data.html");
  const html = readFileSync(inputPath, "utf8");
  const models = extractModels(html);

  for (const { modelName, score } of models) {
    console.log(`${modelName}\t${score}`);
  }

  console.log(`\nTotal models extracted: ${models.length}`);
}

main();
