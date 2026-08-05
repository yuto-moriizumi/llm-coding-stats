#!/usr/bin/env node

import { readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const DEFAULT_URL = "https://arena.ai/leaderboard/code";
const MIN_CREDIBLE_ROWS = 20;
const SKILL_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LEADERBOARD_ROW = /\\"rank\\":(?<rank>\d+),\\"rankUpper\\":(?:\d+|null),\\"rankLower\\":(?:\d+|null),\\"modelKey\\":\\"(?<key>.*?)\\",\\"modelDisplayName\\":\\"(?<name>.*?)\\",\\"rating\\":(?<rating>\d+(?:\.\d+)?)/g;
const MODEL_ENTRY = /(?<prefix>\{\s*name:\s*"(?<name>(?:\\.|[^"\\])*)"[^\n{}]*?arenaScore:\s*)(?<score>\d+)(?<suffix>[^\n{}]*\})/g;
const VOTE_CUTOFF = /\\"voteCutoffISOString\\":\\"([^"\\]+)\\"/;
const TOTAL_VOTES = /\\"totalVotes\\":(\d+)/;

function usage() {
  return `Usage: node update-arena-code-data.mjs [options]

Options:
  --repo <path>       Repository root (default: current directory)
  --url <url>         Arena leaderboard URL
  --html <path>       Read saved HTML instead of fetching
  --target <path>     Registry file (default: app/data/llm-models.ts)
  --aliases <path>    JSON alias map
  --write             Apply changes; otherwise perform a dry run
  --help              Show this help`;
}

function parseArgs(argv) {
  const options = { repo: process.cwd(), url: DEFAULT_URL, html: undefined, target: undefined, aliases: resolve(SKILL_DIR, "references/model-aliases.json"), write: false };
  const valueOptions = new Map([["--repo", "repo"], ["--url", "url"], ["--html", "html"], ["--target", "target"], ["--aliases", "aliases"]]);
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
    const candidate = { name, rating: Number(match.groups.rating), rank: Number(match.groups.rank) };
    const current = models.get(name);
    if (!current || candidate.rating > current.rating) models.set(name, candidate);
  }
  if (models.size < MIN_CREDIBLE_ROWS) throw new Error(`Parsed only ${models.size} leaderboard rows; expected at least ${MIN_CREDIBLE_ROWS}. Arena's page structure may have changed.`);
  return models;
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

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const target = resolve(options.target ?? resolve(options.repo, "app/data/llm-models.ts"));
  const page = options.html ? await readFile(resolve(options.html), "utf8") : await fetchHtml(options.url);
  const arenaModels = parseLeaderboard(page);
  const aliases = await loadAliases(resolve(options.aliases));
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
  const { updated, changes } = updateSource(registrySource, resolvedScores);
  const { cutoff, votes } = metadata(page);
  const unmatchedArena = [...arenaModels.keys()].filter((name) => !matchedArenaNames.has(name)).sort();
  const unmatchedRegistry = [...registry.keys()].filter((name) => !resolvedScores.has(name)).sort();
  console.log(`Source: ${options.html ?? options.url}`);
  console.log(`Vote cutoff: ${cutoff ?? "unknown"}`);
  console.log(`Total votes: ${votes ?? "unknown"}`);
  console.log(`Parsed Arena models: ${arenaModels.size}`);
  console.log(`Matched repository models: ${resolvedScores.size} / ${registry.size}`);
  console.log(`Changed scores: ${changes.length}`);
  for (const { name, oldScore, newScore } of changes) console.log(`  ${name}: ${oldScore} -> ${newScore}`);
  console.log(`Unmatched Arena models (${unmatchedArena.length}): ${unmatchedArena.join(", ") || "none"}`);
  console.log(`Unmatched repository models (${unmatchedRegistry.length}): ${unmatchedRegistry.join(", ") || "none"}`);
  if (options.write) { await atomicWrite(target, updated); console.log(`Updated: ${target}`); }
  else console.log("Dry run only; pass --write to update the registry.");
}

main().catch((error) => { console.error(`error: ${error.message}`); process.exitCode = 1; });
