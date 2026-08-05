---
name: update-arena-code-data
description: Fetch the current Arena Code/WebDev leaderboard from arena.ai and safely update Arena scores in an llm-coding-stats-style TypeScript model registry while preserving provider, OpenRouter slug, deprecation, and other metadata. Use when asked to refresh, sync, compare, or validate Code Arena leaderboard data or app/data/llm-models.ts scores from https://arena.ai/leaderboard/code.
---

# Update Arena Code Data

Fetch and update leaderboard scores with the bundled deterministic script. Do not copy scores manually from rendered page text.

## Workflow

1. Locate the repository root and confirm `app/data/llm-models.ts` contains `LLM_MODELS` entries with `name` and `arenaScore`.
2. Run a dry run first:

   ```bash
   node <skill-dir>/scripts/update-arena-code-data.mjs --repo <repo-root>
   ```

3. Review the summary. Treat these conditions as blockers before writing:
   - zero parsed leaderboard rows;
   - fewer than 20 matched repository models;
   - unexpected aliases or multiple source names mapping to one target;
   - a large score movement that appears inconsistent with the current leaderboard.
4. If Arena renamed an existing model, update `references/model-aliases.json`, then rerun the dry run. Map Arena's current `modelDisplayName` to the repository's existing `name`. Do not use aliases to merge genuinely different model variants.
5. Apply the update only after the dry run is credible:

   ```bash
   node <skill-dir>/scripts/update-arena-code-data.mjs --repo <repo-root> --write
   ```

6. Inspect the diff. Confirm only intended `arenaScore` values changed; preserve model order and every other field.
7. Run repository checks, preferring documented commands. For this repository run:

   ```bash
   npm run typecheck
   npm run lint
   ```

8. Report the leaderboard date/vote cutoff when available, parsed row count, matched count, changed count, unmatched Arena models, unmatched repository models, and verification results.

## Safety rules

- Use `--html <path>` to test saved HTML or work offline.
- Keep dry run as the default. Use `--write` only when the user requested data changes.
- Round Arena's floating rating to the nearest displayed integer.
- Keep duplicate display names at their highest rating, matching the repository's prior extractor behavior.
- Never invent provider names, OpenRouter slugs, deprecation status, or model aliases.
- Do not add or delete models automatically. Surface unmatched names for explicit metadata work.
- Stop without writing if the target registry cannot be parsed or if the fetched page lacks credible leaderboard data.

## Resources

- `scripts/update-arena-code-data.mjs`: fetch, parse, compare, and update scores atomically with Node.js 18 or newer.
- `references/model-aliases.json`: explicit Arena-name-to-repository-name compatibility mappings.
