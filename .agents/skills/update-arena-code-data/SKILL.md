---
name: update-arena-code-data
description: Fetch current Arena Code/WebDev and Text/Chat leaderboard data from arena.ai and update both llm-coding-stats registries by default. Use when asked to refresh, sync, compare, or validate Arena scores; limit to one registry only when the user specifies Code or Chat.
---

# Update Arena Code and Chat Data

Fetch and update leaderboard scores with the bundled deterministic script. Do not copy scores manually from rendered page text.

Code and Chat use the same update behavior: update existing scores, add newly ranked models after identity/price validation, and autonomously repair incorrect mappings. Only the Arena source and destination registry differ.

An invocation without a leaderboard selection (including `$update-arena-code-data` alone) targets **both Code and Chat**. Limit the workflow to one leaderboard only when the user explicitly selects it by name, source URL, or registry path. Run the workflow separately for each selected leaderboard, always passing `--leaderboard code` or `--leaderboard chat`. The helper's legacy no-flag Code default is not the skill's default scope. Never copy Code scores into Chat or report overall completion when only one of the two selected leaderboards has been checked.

## Resolve visibility failures autonomously

The app joins `openrouterSlug` with OpenRouter `/api/v1/models`, defaults missing prices to zero, and hides models when both prices are zero. Typecheck and lint cannot catch this. A syntactically plausible slug is not a verified mapping.

Every dry run and write validates **all nondeprecated entries in the resulting registry**, including unchanged and unmatched existing entries, against the OpenRouter catalog. IDs must exist and prompt/completion prices must be finite, nonnegative, and leave at least one positive price after the app's per-million conversion and cent rounding. A validation failure prevents that script invocation from writing; it is a repair queue for the agent, **not a reason to end the task or immediately ask the user**. Keep the validation gate enabled while resolving the findings.

When a refresh is requested, resolving confirmed bad OpenRouter mappings in the selected registry is part of completing it. Do not request separate approval for each evidence-backed slug repair. For a read-only comparison or validation request, research and propose the repairs without writing them.

For each reported visibility failure:

1. Fetch the current OpenRouter `/api/v1/models` catalog and identify candidates by organization, model family, display name, and version. Check existing reviewed overrides first. Normalize punctuation or strip dates/reasoning suffixes for **candidate discovery only**, not as proof of identity.
2. Inspect the candidate's OpenRouter model page and metadata, the Arena model's linked source, and official provider model/API documentation as needed. Verify that it is the same underlying model/version. A reasoning-effort or harness label may legitimately map to a base API ID; dated releases require evidence that the undated ID serves that release. Do not substitute a different generation, smaller model, batch variant, or latest alias merely because it has a price. Explicit user-selected mappings, including the initial Fable and Qwen overrides, are already identity decisions; still revalidate availability and price.
3. When identity is established, repair existing entries' `openrouterSlug` directly and record exceptional mappings in `references/openrouter-slugs.json` (Arena display name → exact OpenRouter ID) for future additions. Overrides do not silently rewrite existing entries. Preserve Arena names, provider, deprecation flags, and other metadata. Include the supporting source URLs and reasoning in the completion report; catalog existence alone proves availability, not identity.
4. Re-run the dry run after the repair batch. Continue researching and repairing the remaining findings, including pre-existing ones; do not finish with only a blocker count when there are still untried relevant sources. On transient API errors, retry up to two times with short backoff, then try the official model page/endpoint for diagnosis. A saved catalog can support diagnosis but cannot replace live validation before completion.
5. When validation passes, apply the score update, rerun live validation, and run the repository checks. If a new failure appears, return to the repair loop. The deterministic script checks and writes; the agent performs evidence-based identity research and repairs.

Escalate only after the catalog, candidate model pages, and relevant official sources have been checked and no verified priced mapping can be established, sources conflict, or the API remains unavailable after bounded retries. Report the exact unresolved models, candidates and evidence examined, repairs already made, and the remaining decision. Do not spin on unchanged evidence or claim a successful refresh. Never fabricate prices, delete models, mark them deprecated, disable validation, or alter application pricing/UI behavior just to pass the gate. Such changes require a separate user decision.

## Workflow

1. Locate the repository root and select both leaderboards unless the user explicitly limits the request:
   - `code` reads `/leaderboard/code` and targets `app/data/llm-models.ts`.
   - `chat` reads `/leaderboard/text` Overall scores and targets `app/data/chat-models.ts`.
2. Confirm the target registry contains entries with `name` and `arenaScore`, then run a dry run first:

   ```bash
   node <skill-dir>/scripts/update-arena-code-data.mjs --repo <repo-root> --leaderboard code
   node <skill-dir>/scripts/update-arena-code-data.mjs --repo <repo-root> --leaderboard chat
   ```

3. Review score changes and every proposed new model. Treat these conditions as blockers before writing:
   - zero parsed leaderboard rows;
   - fewer than 20 matched repository models;
   - an incorrect organization-to-provider mapping or OpenRouter slug inference;
   - unexpected aliases or multiple source names mapping to one target;
   - a large score movement that appears inconsistent with the current leaderboard.
   - any chart visibility finding, even on a previously registered model: enter the autonomous repair loop above, then retry rather than ending the task.
4. In both `code` and `chat` modes, add every Arena model absent from the selected registry only after its provider, OpenRouter identity, and priced visibility are verified. For unmatched models, enter the same identity-research and repair workflow in either mode; do not skip Chat additions or relax validation for them.
5. If Arena renamed an existing model, update `references/model-aliases.json`, then rerun the dry run. Map Arena's current `modelDisplayName` to the repository's existing `name`. Remove aliases once the registry uses Arena's current name. Do not use aliases to merge genuinely different model variants.
6. Apply the update only after the dry run is credible:

   ```bash
   node <skill-dir>/scripts/update-arena-code-data.mjs --repo <repo-root> --leaderboard code --write
   node <skill-dir>/scripts/update-arena-code-data.mjs --repo <repo-root> --leaderboard chat --write
   ```

7. Inspect the diff. Confirm existing entries changed only in `arenaScore` (plus evidence-backed slug corrections), new entries contain verified metadata, and model order remains descending by score. Rerun the dry run against live OpenRouter data after writing; resolve new availability findings through the same repair loop. When a running app is available, also check the new and repaired models in the default Code/Chat view. The price gate does not guarantee future API availability, deployment freshness, or visibility under user-selected filters.
8. Run repository checks, preferring documented commands. For this repository run:

   ```bash
   npm run typecheck
   npm run lint
   ```

9. For each selected leaderboard, report the date/vote cutoff when available, parsed row count, matched count, changed count, added models and verified mappings, unmatched repository models, chart visibility counts/blockers, and verification results. If either leaderboard remains unresolved, report partial completion and its exact outstanding findings. Distinguish catalog validation from actual browser verification.

## Safety rules

- For offline tests, supply both `--html <path>` and `--openrouter-json <path>` (a saved `/api/v1/models` response). `--html` alone still queries live OpenRouter. Offline results are not evidence of current production availability; use live validation before shipping.
- Keep dry run as the default. Use `--write` only when the user requested data changes.
- Round Arena's floating rating to the nearest displayed integer.
- Keep duplicate display names at their highest rating, matching the repository's prior extractor behavior.
- Add every newly ranked Arena model in either mode after validation. Preserve existing metadata and deprecated flags identically in Code and Chat.
- Infer provider only from Arena's organization field. Namespace rules produce candidate slugs only; review identity and pass the catalog/price gate before writing.
- Never infer `deprecated: true` for a new model.
- Stop without writing if the target registry cannot be parsed or if the fetched page lacks credible leaderboard data.

## Resources

- `scripts/update-arena-code-data.mjs`: select Code or Chat, fetch, parse, compare, and update scores atomically with Node.js 18 or newer.
- `references/model-aliases.json`: explicit Arena-name-to-repository-name compatibility mappings.
- `references/openrouter-slugs.json`: reviewed Arena-name-to-OpenRouter-ID exceptions for new entries; separate from model-name aliases.
- `scripts/update-arena-code-data.test.mjs`: offline CLI regression tests; run with `node --test <skill-dir>/scripts/update-arena-code-data.test.mjs` after changing the updater.
