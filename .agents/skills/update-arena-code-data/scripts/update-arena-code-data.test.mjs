import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const script = fileURLToPath(new URL("./update-arena-code-data.mjs", import.meta.url));
const newNames = ["claude-fable-5.1-max", "qwen3.8-max-0902"];

async function fixture(t, { leaderboard = "code", additions = [], existingSlug, pricing, catalogOverride, deprecated = false } = {}) {
  const dir = await mkdtemp(join(tmpdir(), "arena-visibility-test-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const models = Array.from({ length: 20 }, (_, i) => ({
    name: `model-${i}`, slug: i === 0 && existingSlug ? existingSlug : `anthropic/model-${i}`,
  }));
  const source = `export const LLM_MODELS = [\n${models.map((m, i) => `  { name: "${m.name}", provider: "anthropic", arenaScore: ${1500 - i}, openrouterSlug: "${m.slug}"${i === 0 && deprecated ? ", deprecated: true" : ""} },`).join("\n")}\n];\n`;
  const rows = [...models.map(m => m.name), ...additions].map((name, i) => ({
    rank: i + 1, rankUpper: null, rankLower: null, modelKey: name, modelDisplayName: name,
    rating: 1500 - i, modelOrganization: name.startsWith("qwen") ? "Alibaba" : "Anthropic",
  }));
  const catalog = { data: models.map((m, i) => ({
    id: `anthropic/model-${i}`, pricing: i === 0 && pricing !== undefined ? pricing : { prompt: "0.000001", completion: "0.000002" },
  })) };
  catalog.data.push(
    { id: "anthropic/claude-fable-5.1", pricing: { prompt: "0.00001", completion: "0.00005" } },
    { id: "qwen/qwen3.8-max", pricing: { prompt: "0.000002", completion: "0.000006" } },
  );
  const target = join(dir, "models.ts");
  const html = join(dir, "arena.html");
  const json = join(dir, "openrouter.json");
  await Promise.all([
    writeFile(target, source),
    writeFile(html, JSON.stringify(JSON.stringify(rows))),
    writeFile(json, JSON.stringify(catalogOverride ?? catalog)),
  ]);
  return {
    source, target, dir, html,
    run: (...args) => spawnSync(process.execPath, [script, "--leaderboard", leaderboard, "--target", target, "--html", html, "--openrouter-json", json, ...args], { encoding: "utf8" }),
  };
}

for (const leaderboard of ["code", "chat"]) {
test(`${leaderboard}: reviewed Fable/Qwen IDs are used; dry run preserves bytes; write preserves existing metadata`, async t => {
  const f = await fixture(t, { leaderboard, additions: newNames });
  let result = f.run();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(await readFile(f.target, "utf8"), f.source);
  result = f.run("--write");
  assert.equal(result.status, 0, result.stderr);
  const updated = await readFile(f.target, "utf8");
  assert.match(updated, /name: "claude-fable-5.1-max"[^\n]*openrouterSlug: "anthropic\/claude-fable-5.1"/);
  assert.match(updated, /name: "qwen3.8-max-0902"[^\n]*openrouterSlug: "qwen\/qwen3.8-max"/);
  assert.equal(updated.split("\n").filter(line => !newNames.some(name => line.includes(`name: "${name}"`))).join("\n"), f.source);
});

for (const [label, options] of [
  ["unknown inferred ID for a new model", { additions: ["unknown-max"] }],
  ["unknown existing ID even with unchanged score", { existingSlug: "anthropic/missing" }],
  ["missing prices", { pricing: {} }],
  ["non-finite prices", { pricing: { prompt: "Infinity", completion: "0.1" } }],
  ["negative price", { pricing: { prompt: "-1", completion: "0.1" } }],
  ["negative price that rounds to zero", { pricing: { prompt: "-0.000000001", completion: "0.1" } }],
  ["zero prices", { pricing: { prompt: "0", completion: "0" } }],
  ["prices rounded to zero by the app", { pricing: { prompt: "0.000000001", completion: "0.000000001" } }],
  ["empty catalog", { catalogOverride: { data: [] } }],
  ["malformed catalog", { catalogOverride: { error: "unavailable" } }],
]) {
  test(`${leaderboard}: ${label} blocks dry run and write without modifying target`, async t => {
    const f = await fixture(t, { ...options, leaderboard });
    for (const args of [[], ["--write"]]) {
      const result = f.run(...args);
      assert.equal(result.status, 1, result.stdout);
      assert.equal(await readFile(f.target, "utf8"), f.source);
    }
  });
}

test(`${leaderboard}: intentionally deprecated entries remain unchanged and do not block`, async t => {
  const f = await fixture(t, { leaderboard, existingSlug: "anthropic/retired", deprecated: true });
  const result = f.run("--write");
  assert.equal(result.status, 0, result.stderr);
  assert.equal(await readFile(f.target, "utf8"), f.source);
});

test(`${leaderboard}: zero input price is allowed when output price remains positive`, async t => {
  const f = await fixture(t, { leaderboard, pricing: { prompt: "0", completion: "0.000001" } });
  const result = f.run("--write");
  assert.equal(result.status, 0, result.stderr);
});

test(`${leaderboard}: only explicitly listed new models may be added as deprecated`, async t => {
  const f = await fixture(t, { leaderboard, additions: ["retired-model"] });
  const list = join(f.dir, "deprecated.json");
  await writeFile(list, JSON.stringify(["retired-model", "model-0"]));
  assert.equal(f.run().status, 1);
  const result = f.run("--deprecated-models", list, "--write");
  assert.equal(result.status, 0, result.stderr);
  const updated = await readFile(f.target, "utf8");
  assert.match(updated, /name: "retired-model"[^\n]*deprecated: true/);
  assert.doesNotMatch(updated, /name: "model-0"[^\n]*deprecated: true/);
});

test(`${leaderboard}: a deprecation list cannot bypass validation for existing models`, async t => {
  const f = await fixture(t, { leaderboard, existingSlug: "anthropic/missing" });
  const list = join(f.dir, "deprecated.json");
  await writeFile(list, JSON.stringify(["model-0"]));
  const result = f.run("--deprecated-models", list, "--write");
  assert.equal(result.status, 1);
  assert.equal(await readFile(f.target, "utf8"), f.source);
});

test(`${leaderboard}: score updates reorder whole entries and preserve metadata`, async t => {
  const f = await fixture(t, { leaderboard });
  const html = await readFile(f.html, "utf8");
  await writeFile(f.html, html.replace('\\"rating\\":1481', '\\"rating\\":1600'));
  const result = f.run("--write");
  assert.equal(result.status, 0, result.stderr);
  const updated = await readFile(f.target, "utf8");
  assert.match(updated.split("\n")[1], /name: "model-19"[^\n]*arenaScore: 1600[^\n]*openrouterSlug: "anthropic\/model-19"/);
});
}
