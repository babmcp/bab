# Plan: Dynamic Model Registry Fallback

## Problem

`ProviderRegistry` has a hardcoded `STATIC_MODEL_REGISTRY` (5 models). Any model ID not in the list fails with "Unknown model" even when the provider is configured and the API would accept it. Users must know the exact 5 static IDs.

## Fix

Static list becomes enrichment (better metadata for known models), not a gate. Unknown model IDs get provider inferred from naming patterns, then a synthetic `ModelInfo` with conservative defaults. If inference fails, ask the user which provider to use.

## Steps

### 1. Add `inferProvider()` helper in `registry.ts`

Pattern-based inference:
- `claude-*` -> anthropic
- `gpt-*`, `o1-*`, `o3-*`, `o4-*` -> openai
- `gemini-*` -> google

Returns `ProviderId | undefined`.

### 2. Update `getModelInfo()` to build synthetic ModelInfo on miss

After static lookup fails:
- Call `inferProvider(modelId)`
- If provider inferred and configured -> return synthetic ModelInfo:
  - `id`: raw modelId
  - `provider`: inferred
  - `display_name`: modelId
  - `capabilities`: conservative defaults (128k context, score 50, no thinking/vision/images)
- If provider inferred but NOT configured -> return undefined (same as today)
- If no provider inferred -> return undefined

### 3. Update `generateText()` — use modelInfo.id directly

Already does this. No change needed — synthetic ModelInfo has `id` = raw model ID, which is what the API expects.

### 4. Handle ambiguous/unknown model IDs in tools

When `selectModel()` gets a requested model that `getModelInfo()` can't resolve:
- Currently logs warning and falls through to auto-select best available
- This is acceptable — no change needed here
- The gateway's error message already lists available models

### 5. `listModels()` — no change

Keep returning only static+configured models. Can't enumerate all possible models. `generateText()` accepts any model ID for a configured provider.

### 6. Tests

- `getModelInfo("gemini-2.5-flash")` -> inferred google, synthetic ModelInfo (if configured)
- `getModelInfo("gpt-4o")` -> inferred openai (if configured)
- `getModelInfo("claude-opus-4-20250514")` -> inferred anthropic (if configured)
- `getModelInfo("unknown-xyz")` -> undefined
- Static entries take priority over inference
- Unconfigured provider -> undefined even if pattern matches
- `generateText("gemini-2.5-flash", ...)` -> works if GOOGLE_API_KEY set

## Files

| File | Change |
|------|--------|
| `src/providers/registry.ts` | Add `inferProvider()`, update `getModelInfo()` |
| `tests/core-framework.test.ts` | Add inference tests |
