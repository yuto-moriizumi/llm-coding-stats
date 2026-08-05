---
name: update-arena-code-data
description: Fetch the current Arena Code/WebDev leaderboard from arena.ai, update existing Arena scores, and add newly ranked models to an llm-coding-stats-style TypeScript model registry. Use when asked to refresh, sync, compare, or validate Code Arena leaderboard data or app/data/llm-models.ts from https://arena.ai/leaderboard/code.
---

# Update Arena Code Data

Fetch and update leaderboard scores with the bundled deterministic script. Do not copy scores manually from rendered page text.

## Workflow

1. Locate the repository root and confirm `app/data/llm-models.ts` contains `LLM_MODELS` entries with `name` and `arenaScore`.
2. Run a dry run first:

   ```bash
   node <skill-dir>/scripts/update-arena-code-data.mjs --repo <repo-root>
   ```

3. Review score changes and every proposed new model. Treat these conditions as blockers before writing:
   - zero parsed leaderboard rows;
   - fewer than 20 matched repository models;
   - an incorrect organization-to-provider mapping or OpenRouter slug inference;
   - unexpected aliases or multiple source names mapping to one target;
   - a large score movement that appears inconsistent with the current leaderboard.
4. For every Arena model absent from the registry, add it during `--write`. Derive `provider` from Arena's `modelOrganization`, derive the OpenRouter slug from the provider namespace, and place the entry in descending `arenaScore` order. Unknown organizations use `provider: "other"` and `openrouterSlug: "other/<Arena name>"` so no ranked model is silently omitted.
5. If Arena renamed an existing model, update `references/model-aliases.json`, then rerun the dry run. Map Arena's current `modelDisplayName` to the repository's existing `name`. Remove aliases once the registry uses Arena's current name. Do not use aliases to merge genuinely different model variants.
6. Apply the update only after the dry run is credible:

   ```bash
   node <skill-dir>/scripts/update-arena-code-data.mjs --repo <repo-root> --write
   ```

7. Inspect the diff. Confirm existing entries changed only in `arenaScore`, new entries contain the intended metadata, and model order remains descending by score.
8. Run repository checks, preferring documented commands. For this repository run:

   ```bash
   npm run typecheck
   npm run lint
   ```

9. Report the leaderboard date/vote cutoff when available, parsed row count, matched count, changed count, added models and inferred metadata, unmatched repository models, and verification results.

## Safety rules

- Use `--html <path>` to test saved HTML or work offline.
- Keep dry run as the default. Use `--write` only when the user requested data changes.
- Round Arena's floating rating to the nearest displayed integer.
- Keep duplicate display names at their highest rating, matching the repository's prior extractor behavior.
- Add every newly ranked Arena model. Never silently omit unmatched Arena names.
- Infer provider only from Arena's organization field. Use the script's provider namespace rules for OpenRouter slugs and review every proposed slug in the dry run.
- Never infer `deprecated: true` for a new model.
- Stop without writing if the target registry cannot be parsed or if the fetched page lacks credible leaderboard data.

## Resources

- `scripts/update-arena-code-data.mjs`: fetch, parse, compare, and update scores atomically with Node.js 18 or newer.
- `references/model-aliases.json`: explicit Arena-name-to-repository-name compatibility mappings.
