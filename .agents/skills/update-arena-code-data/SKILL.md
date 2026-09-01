---
name: update-arena-code-data
description: Fetch current Arena Code/WebDev or Text/Chat leaderboard data from arena.ai and update the corresponding llm-coding-stats TypeScript model registry. Use when asked to refresh, sync, compare, or validate Code scores in app/data/llm-models.ts or Chat scores in app/data/chat-models.ts.
---

# Update Arena Code and Chat Data

Fetch and update leaderboard scores with the bundled deterministic script. Do not copy scores manually from rendered page text.

## Workflow

1. Locate the repository root and select the requested leaderboard:
   - `code` reads `/leaderboard/code` and targets `app/data/llm-models.ts`.
   - `chat` reads `/leaderboard/text` Overall scores and targets `app/data/chat-models.ts`.
2. Confirm the target registry contains entries with `name` and `arenaScore`, then run a dry run first:

   ```bash
   node <skill-dir>/scripts/update-arena-code-data.mjs --repo <repo-root>
   node <skill-dir>/scripts/update-arena-code-data.mjs --repo <repo-root> --leaderboard chat
   ```

3. Review score changes and every proposed new model. Treat these conditions as blockers before writing:
   - zero parsed leaderboard rows;
   - fewer than 20 matched repository models;
   - an incorrect organization-to-provider mapping or OpenRouter slug inference;
   - unexpected aliases or multiple source names mapping to one target;
   - a large score movement that appears inconsistent with the current leaderboard.
4. In `code` mode, add Arena models absent from the registry during `--write`, using the existing reviewed metadata inference behavior. In `chat` mode, update existing entries only: unmatched Text Arena models must not be added because Chat intentionally contains only models with reviewed OpenRouter mappings.
5. If Arena renamed an existing model, update `references/model-aliases.json`, then rerun the dry run. Map Arena's current `modelDisplayName` to the repository's existing `name`. Remove aliases once the registry uses Arena's current name. Do not use aliases to merge genuinely different model variants.
6. Apply the update only after the dry run is credible:

   ```bash
   node <skill-dir>/scripts/update-arena-code-data.mjs --repo <repo-root> --write
   node <skill-dir>/scripts/update-arena-code-data.mjs --repo <repo-root> --leaderboard chat --write
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
- Add every newly ranked Arena model in `code` mode. In `chat` mode, report unmatched names without adding them.
- Infer provider only from Arena's organization field. Use the script's provider namespace rules for OpenRouter slugs and review every proposed slug in the dry run.
- Never infer `deprecated: true` for a new model.
- Stop without writing if the target registry cannot be parsed or if the fetched page lacks credible leaderboard data.

## Resources

- `scripts/update-arena-code-data.mjs`: select Code or Chat, fetch, parse, compare, and update scores atomically with Node.js 18 or newer.
- `references/model-aliases.json`: explicit Arena-name-to-repository-name compatibility mappings.
