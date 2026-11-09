# qa-i18n seeded-defect eval

**`fixture/` is mutated test data, not copy.** It holds small copies of real units (two content posts, 34 dictionary
keys) with defects planted in the FR/ES values. It is never loaded into WordPress, never imported by `src`, and never a
source for copy. Canonical copy lives in Notion → `docs/content/` → `scripts/phase-5c/content/`.

- `defects.json`: 14 planted defects (6 deterministic, 8 LLM), 4 clean control units and the D-8 threshold.
- `eval.ts`: runs the qa-i18n pipeline on the fixture and scores it. A defect is found when a finding has the same
  `unitId` and `lang` and a check from the defect's `accept` list.
- Without `--llm` it scores only the deterministic half. That half also runs in `npm test` (`eval.test.ts`).

```bash
env -u MAGNETO_QA_ANTHROPIC_API_KEY npm run qa:i18n:eval            # deterministic half, no key
env -u MAGNETO_QA_ANTHROPIC_API_KEY npm run qa:i18n:eval -- --plan  # LLM batches + cost estimate, no request
npm run qa:i18n:eval -- --llm --repeat 2 --model <id>              # Mauricio only (needs the key)
```

Threshold (D-8, worse of the runs): deterministic recall 6/6, LLM recall ≥ 7/8, 0 `error` findings on the controls,
≤ 3 unplanted findings of `warning` or above. Outputs `eval.json` and `eval.md` go outside the repo
(default `~/Documents/projects/magneto/qa/i18n/eval-<timestamp>/`).
