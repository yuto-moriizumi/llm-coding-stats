#!/usr/bin/env node

import { readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const LEADERBOARDS = {
  code: {
    url: "https://arena.ai/leaderboard/code",
    target: "app/data/llm-models.ts",
  },
  chat: {
    url: "https://arena.ai/leaderboard/text",
    target: "app/data/chat-models.ts",
  },
};
const MIN_CREDIBLE_ROWS = 20;
const SKILL_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LEADERBOARD_ROW = /\\"rank\\":(?<rank>\d+),\\"rankUpper\\":(?:\d+|null),\\"rankLower\\":(?:\d+|null),\\"modelKey\\":\\"(?<key>.*?)\\",\\"modelDisplayName\\":\\"(?<name>.*?)\\",\\"rating\\":(?<rating>\d+(?:\.\d+)?)[^}]*?\\"modelOrganization\\":\\"(?<organization>.*?)\\"/g;
const MODEL_ENTRY = /(?<prefix>\{\s*name:\s*"(?<name>(?:\\.|[^"\\])*)"[^\n{}]*?arenaScore:\s*)(?<score>\d+)(?<suffix>[^\n{}]*\})/g;
const VOTE_CUTOFF = /\\"voteCutoffISOString\\":\\"([^"\\]+)\\"/;
const TOTAL_VOTES = /\\"totalVotes\\":(\d+)/;

function usage() {
  return `Usage: node update-arena-code-data.mjs [options]

Options:
  --repo <path>       Repository root (default: current directory)
  --leaderboard <key> Leaderboard to update: code or chat (default: code)
  --url <url>         Override the selected Arena leaderboard URL
  --html <path>       Read saved HTML instead of fetching
  --target <path>     Registry file (default: app/data/llm-models.ts)
  --aliases <path>    JSON alias map
  --openrouter-json <path>  Saved OpenRouter /api/v1/models response (offline)
  --slug-overrides <path>  Reviewed Arena-name-to-OpenRouter-ID JSON map
  --write             Apply changes; otherwise perform a dry run
  --help              Show this help`;
}

function parseArgs(argv) {
  const options = { repo: process.cwd(), leaderboard: "code", url: undefined, html: undefined, target: undefined, aliases: resolve(SKILL_DIR, "references/model-aliases.json"), slugOverrides: resolve(SKILL_DIR, "references/openrouter-slugs.json"), write: false };
  const valueOptions = new Map([["--repo", "repo"], ["--leaderboard", "leaderboard"], ["--url", "url"], ["--html", "html"], ["--target", "target"], ["--aliases", "aliases"], ["--openrouter-json", "openrouterJson"], ["--slug-overrides", "slugOverrides"]]);
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--help") { console.log(usage()); process.exit(0); }
    if (argument === "--write") { options.write = true; continue; }
    const key = valueOptions.get(argument);
    if (!key) throw new Error(`Unknown argument: ${argument}\n${usage()}`);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for ${argument}`);
    options[key] = value;
    index += 1;
  }
  if (!(options.leaderboard in LEADERBOARDS)) throw new Error(`Invalid leaderboard: ${options.leaderboard}. Expected code or chat.`);
  return options;
}

function decodeJsonString(value) { return JSON.parse(`"${value}"`); }

async function fetchHtml(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const response = await fetch(url, { headers: { accept: "text/html,application/xhtml+xml", "user-agent": "Mozilla/5.0 (compatible; Codex Arena data updater)" }, redirect: "follow", signal: controller.signal });
    if (!response.ok) throw new Error(`Arena returned HTTP ${response.status}`);
    return await response.text();
  } finally { clearTimeout(timeout); }
}

function parseLeaderboard(source) {
  const models = new Map();
  for (const match of source.matchAll(LEADERBOARD_ROW)) {
    const name = decodeJsonString(match.groups.name);
    const candidate = { name, organization: decodeJsonString(match.groups.organization), rating: Number(match.groups.rating), rank: Number(match.groups.rank) };
    const current = models.get(name);
    if (!current || candidate.rating > current.rating) models.set(name, candidate);
  }
  if (models.size < MIN_CREDIBLE_ROWS) throw new Error(`Parsed only ${models.size} leaderboard rows; expected at least ${MIN_CREDIBLE_ROWS}. Arena's page structure may have changed.`);
  return models;
}

const ORGANIZATION_METADATA = new Map([
  ["Alibaba", { provider: "alibaba", slugPrefix: "qwen" }],
  ["Anthropic", { provider: "anthropic", slugPrefix: "anthropic" }],
  ["Arcee AI", { provider: "arcee", slugPrefix: "arcee-ai" }],
  ["ByteDance", { provider: "bytedance", slugPrefix: "bytedance" }],
  ["Cohere", { provider: "cohere", slugPrefix: "cohere" }],
  ["DeepSeek", { provider: "deepseek", slugPrefix: "deepseek" }],
  ["Google", { provider: "google", slugPrefix: "google" }],
  ["IBM", { provider: "ibm", slugPrefix: "ibm-granite" }],
  ["Inception", { provider: "inception", slugPrefix: "inception" }],
  ["Kuaishou", { provider: "kwai", slugPrefix: "kwai" }],
  ["Meta", { provider: "meta", slugPrefix: "meta-llama" }],
  ["MiniMax", { provider: "minimax", slugPrefix: "minimax" }],
  ["Mistral", { provider: "mistral", slugPrefix: "mistralai" }],
  ["Moonshot AI", { provider: "moonshot", slugPrefix: "moonshotai" }],
  ["OpenAI", { provider: "openai", slugPrefix: "openai" }],
  ["Poolside", { provider: "poolside", slugPrefix: "poolside" }],
  ["Tencent", { provider: "tencent", slugPrefix: "tencent" }],
  ["xAI", { provider: "xai", slugPrefix: "x-ai" }],
  ["Xiaomi", { provider: "xiaomi", slugPrefix: "xiaomi" }],
  ["Zhipu AI", { provider: "zhipu", slugPrefix: "z-ai" }],
]);

function inferredMetadata(model, slugOverrides) {
  const known = ORGANIZATION_METADATA.get(model.organization);
  const provider = known?.provider ?? "other";
  const slugPrefix = known?.slugPrefix ?? "other";
  let slugName = model.name;
  if (provider === "google" && /^gemini-/.test(slugName)) slugName = slugName.replace(/-(?:high|medium|low)$/, "");
  return { provider, openrouterSlug: slugOverrides[model.name] ?? `${slugPrefix}/${slugName}` };
}

async function loadAliases(path) {
  const data = JSON.parse(await readFile(path, "utf8"));
  if (!data || Array.isArray(data) || typeof data !== "object" || Object.entries(data).some(([key, value]) => typeof key !== "string" || typeof value !== "string")) throw new Error(`Aliases must be a JSON string-to-string object: ${path}`);
  return data;
}

function parseRegistry(source) {
  const registry = new Map();
  for (const match of source.matchAll(MODEL_ENTRY)) registry.set(decodeJsonString(match.groups.name), Number(match.groups.score));
  if (registry.size === 0) throw new Error("No model entries with name and arenaScore were found in the target registry");
  return registry;
}

function updateSource(source, scores) {
  const changes = [];
  const updated = source.replace(MODEL_ENTRY, (...arguments_) => {
    const groups = arguments_.at(-1);
    const name = decodeJsonString(groups.name);
    const oldScore = Number(groups.score);
    const newScore = scores.get(name) ?? oldScore;
    if (newScore !== oldScore) changes.push({ name, oldScore, newScore });
    return `${groups.prefix}${newScore}${groups.suffix}`;
  });
  return { updated, changes };
}

function addModels(source, additions, slugOverrides) {
  let updated = source;
  const added = [];
  for (const model of [...additions].sort((left, right) => right.arenaScore - left.arenaScore)) {
    const { provider, openrouterSlug } = inferredMetadata(model, slugOverrides);
    const line = `  { name: ${JSON.stringify(model.name)}, provider: ${JSON.stringify(provider)}, arenaScore: ${model.arenaScore}, openrouterSlug: ${JSON.stringify(openrouterSlug)} },\n`;
    const entries = [...updated.matchAll(MODEL_ENTRY)];
    const insertion = entries.find((entry) => Number(entry.groups.score) < model.arenaScore);
    const index = insertion ? updated.lastIndexOf("\n", insertion.index) + 1 : updated.lastIndexOf("];\n");
    if (index < 0) throw new Error("Could not locate the LLM_MODELS array terminator");
    updated = `${updated.slice(0, index)}${line}${updated.slice(index)}`;
    added.push({ ...model, provider, openrouterSlug });
  }
  return { updated, added };
}

function metadata(source) {
  const cutoff = source.match(VOTE_CUTOFF)?.[1];
  const votes = source.match(TOTAL_VOTES)?.[1];
  return { cutoff: cutoff ? decodeJsonString(cutoff) : undefined, votes: votes ? Number(votes) : undefined };
}

async function atomicWrite(path, content) {
  const temporary = resolve(dirname(path), `.${randomUUID()}.tmp`);
  try { await writeFile(temporary, content, "utf8"); await rename(temporary, path); }
  catch (error) { await unlink(temporary).catch(() => {}); throw error; }
}

async function loadOpenRouterCatalog(path) {
  let data;
  if (path) {
    data = JSON.parse(await readFile(resolve(path), "utf8"));
  } else {
    const response = await fetch("https://openrouter.ai/api/v1/models", { signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`OpenRouter returned HTTP ${response.status}; cannot verify chart visibility`);
    data = await response.json();
  }
  if (!Array.isArray(data?.data) || data.data.length === 0) throw new Error("Invalid or empty OpenRouter catalog; cannot verify chart visibility");
  const catalog = new Map();
  for (const model of data.data) {
    const slug = model?.id ?? model?.slug;
    if (typeof slug !== "string" || !slug || catalog.has(slug)) throw new Error("Invalid or duplicate OpenRouter model ID");
    catalog.set(slug, model);
  }
  return catalog;
}

function checkVisibility(source, catalog) {
  const blockers = [];
  let visible = 0;
  let deprecated = 0;
  for (const match of source.matchAll(MODEL_ENTRY)) {
    const name = decodeJsonString(match.groups.name);
    // Deprecated entries are intentionally hidden by the default chart filter.
    if (/\bdeprecated:\s*true\b/.test(match[0])) { deprecated += 1; continue; }
    const slugMatch = match[0].match(/\bopenrouterSlug:\s*"((?:\\.|[^"\\])*)"/);
    const slug = slugMatch ? decodeJsonString(slugMatch[1]) : undefined;
    const model = catalog.get(slug);
    let reason;
    if (!model) {
      reason = "ID missing from OpenRouter catalog";
    } else {
      const values = [model.pricing?.prompt, model.pricing?.completion];
      const prices = values.map((value) => typeof value === "string" && value.trim() ? Number(value) : NaN);
      // Match fetchPricingMap's per-million conversion and cent rounding,
      // then ParetoChart's positive-price filter. Reject invalid prices too.
      const rounded = prices.map((price) => Math.round(price * 1_000_000 * 100) / 100);
      if (prices.some((price) => !Number.isFinite(price) || price < 0) || rounded.some((price) => !Number.isFinite(price))) reason = "invalid or missing prompt/completion pricing";
      else if (!rounded.some((price) => price > 0)) reason = "both displayed prices round to zero; chart would hide this model";
    }
    if (reason) blockers.push(`${name} [${slug ?? "no slug"}]: ${reason}`);
    else visible += 1;
  }
  console.log(`Chart visibility: ${visible} priced, ${deprecated} intentionally deprecated, ${blockers.length} blocked`);
  for (const blocker of blockers) console.log(`  BLOCKED: ${blocker}`);
  if (blockers.length) throw new Error("Chart visibility validation failed; this invocation wrote no registry. Agent: follow SKILL.md's autonomous repair loop: research exact identities in OpenRouter/provider sources, repair verified slug mappings, and rerun until resolved. Escalate only after exhausting relevant evidence; do not hide unresolved models or invent prices.");
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const leaderboard = LEADERBOARDS[options.leaderboard];
  const sourceUrl = options.url ?? leaderboard.url;
  const target = resolve(options.target ?? resolve(options.repo, leaderboard.target));
  const page = options.html ? await readFile(resolve(options.html), "utf8") : await fetchHtml(sourceUrl);
  const arenaModels = parseLeaderboard(page);
  const aliases = await loadAliases(resolve(options.aliases));
  const slugOverrides = await loadAliases(resolve(options.slugOverrides));
  const registrySource = await readFile(target, "utf8");
  const registry = parseRegistry(registrySource);
  const resolvedScores = new Map();
  const matchedArenaNames = new Set();
  for (const [arenaName, model] of arenaModels) {
    const targetName = aliases[arenaName] ?? arenaName;
    if (registry.has(targetName)) {
      if (resolvedScores.has(targetName)) throw new Error(`Multiple Arena models map to repository model ${JSON.stringify(targetName)}`);
      resolvedScores.set(targetName, Math.round(model.rating));
      matchedArenaNames.add(arenaName);
    }
  }
  if (resolvedScores.size < MIN_CREDIBLE_ROWS) throw new Error(`Matched only ${resolvedScores.size} repository models; refusing to update`);
  const scoreUpdate = updateSource(registrySource, resolvedScores);
  const unmatchedArenaModels = [...arenaModels.values()].filter((model) => !matchedArenaNames.has(model.name));
  // Both leaderboards add missing models under the same metadata/price gate.
  const additions = unmatchedArenaModels.map((model) => ({ ...model, arenaScore: Math.round(model.rating) }));
  const { updated, added } = addModels(scoreUpdate.updated, additions, slugOverrides);
  const changes = scoreUpdate.changes;
  const { cutoff, votes } = metadata(page);
  const unmatchedArena = [...arenaModels.keys()].filter((name) => !matchedArenaNames.has(name)).sort();
  const unmatchedRegistry = [...registry.keys()].filter((name) => !resolvedScores.has(name)).sort();
  console.log(`Leaderboard: ${options.leaderboard}`);
  console.log(`Source: ${options.html ?? sourceUrl}`);
  console.log(`Vote cutoff: ${cutoff ?? "unknown"}`);
  console.log(`Total votes: ${votes ?? "unknown"}`);
  console.log(`Parsed Arena models: ${arenaModels.size}`);
  console.log(`Matched repository models: ${resolvedScores.size} / ${registry.size}`);
  console.log(`Changed scores: ${changes.length}`);
  for (const { name, oldScore, newScore } of changes) console.log(`  ${name}: ${oldScore} -> ${newScore}`);
  console.log(`New models: ${added.length}`);
  for (const { name, provider, arenaScore, openrouterSlug } of added) console.log(`  ${name}: provider=${provider}, arenaScore=${arenaScore}, openrouterSlug=${openrouterSlug}`);
  console.log(`Arena models to add (${unmatchedArena.length}): ${unmatchedArena.join(", ") || "none"}`);
  console.log(`Unmatched repository models (${unmatchedRegistry.length}): ${unmatchedRegistry.join(", ") || "none"}`);
  console.log(`OpenRouter source: ${options.openrouterJson ?? "https://openrouter.ai/api/v1/models (live)"}`);
  const catalog = await loadOpenRouterCatalog(options.openrouterJson);
  checkVisibility(updated, catalog);
  if (options.write) { await atomicWrite(target, updated); console.log(`Updated: ${target}`); }
  else console.log("Dry run only; pass --write to update the registry.");
}

main().catch((error) => { console.error(`error: ${error.message}`); process.exitCode = 1; });
