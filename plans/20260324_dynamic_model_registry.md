# Plan: Dynamic Model Registry — API-Based Discovery

## Problem

`ProviderRegistry` has a hardcoded `STATIC_MODEL_REGISTRY` (5 models). Any model ID not in the list fails with "Unknown model" even when the provider is configured and the API would accept it.

## Current state (v1 — regex inference, already merged)

Pattern-based `inferProvider()` maps `claude-*` → anthropic, `gpt-*`/`o\d+-` → openai, `gemini-*` → google. Returns synthetic ModelInfo with conservative defaults. Works but:
- No openrouter/custom coverage
- Synthetic defaults (128k context, score 50) may be wrong
- New naming patterns require code changes

## v2 — Fetch real model lists from provider APIs

Replace regex guessing with actual model lists fetched from each provider's API.

### Provider endpoints

| Provider | Endpoint | Key response fields |
|----------|----------|-------------------|
| OpenAI | `GET /v1/models` | `id`, `owned_by` |
| Anthropic | `GET /v1/models` | `id`, `display_name` |
| Google | `GET /v1beta/models` | `name`, `displayName`, `inputTokenLimit`, `outputTokenLimit` |
| OpenRouter | `GET /api/v1/models` | `id`, `name`, `context_length`, `top_provider` |

### Design decisions (validated via design review + challenge)

1. **`getModelInfo()` becomes async** — all 3 callers (`selectModel`, `ModelGateway.query`, `generateText`) are already async. Adding `await` at each is trivial. No separate `warmCache()` mechanism needed.
2. **Keep linear lookup chain** — static → discovered → regex is readable top-to-bottom with clear priority. A unified Map adds rebuild/invalidation complexity for no real gain.
3. **Single fetch function with switch** — per-provider normalizers are ~5 lines each. Extracting separate functions + type + registry is over-decomposition. One switch statement keeps all mapping visible.
4. **Don't filter OpenAI models** — fine-tuned models are valid routing targets. Keep all models in cache.
5. **Keep provider config split** — env var names, SDK factories, and API endpoints serve different layers. Merging couples unrelated concerns.
6. **Static registry stays** — provides curated scores, thinking/vision flags, and aliases that no API returns. Different purpose than discovery.

### New module: `src/providers/model-discovery.ts`

```
ModelDiscovery
  ├─ fetchModels(providerId, apiKey, baseUrl?) → ModelInfo[]
  ├─ cached per provider with 48h TTL
  └─ single function, switch per provider for normalization
```

### Lookup chain in `getModelInfo()` (now async):
1. Static registry (exact id → alias)
2. Discovered models cache (fetched lazily on first miss)
3. `inferProvider()` regex fallback (offline safety net)
4. `undefined`

### `listModels()` change (now async):
Returns static + discovered models (deduplicated by id, static takes priority).

## Steps

### 1. Create `src/providers/model-discovery.ts`

- `fetchProviderModels(providerId, apiKey, baseUrl?)`: HTTP fetch to provider endpoint, normalize via switch, return `ModelInfo[]`
- Normalization (all in one function):
  - **OpenAI**: `id` → `id`, default 128k context
  - **Anthropic**: `id` → `id`, `display_name` → `display_name`, default 200k context
  - **Google**: strip `models/` prefix → `id`, `inputTokenLimit` → `context_window`, `displayName` → `display_name`
  - **OpenRouter**: `id` → `id`, `context_length` → `context_window`, `name` → `display_name`
  - **Custom**: skip (no standard list endpoint)
- All discovered models get `score: 50`, `supports_thinking: false`, `supports_vision: false`, `supports_images: false` (conservative defaults, static overrides correct these for curated models)
- Cache: `Map<ProviderId, { models: ModelInfo[]; fetchedAt: number }>`
- TTL: 48 hours
- Promise memoization to prevent concurrent duplicate fetches (same pattern as plugin-cache)
- Fetch errors → log warning, return empty array (never block tool calls)

### 2. Make `getModelInfo()` and `listModels()` async in `ProviderRegistry`

- `getModelInfo()`: after static miss, await `discovery.getModels(providerId)` for each configured provider, then fall back to `inferProvider()` regex
- `listModels()`: merge static + `await discovery.getAllCachedModels()`, deduplicate by id (static wins)
- Update 3 callers to await:
  - `selectModel()` in `src/tools/base.ts`
  - `ModelGateway.query()` in `src/providers/model-gateway.ts`
  - `generateText()` already calls `getModelInfo()` internally — just add await

### 3. Lazy fetching strategy

- Don't fetch on startup (slows MCP initialization)
- Fetch on first `getModelInfo()` miss per provider
- If fetch fails, fall through to regex inference silently
- Subsequent calls use cached results until TTL expires

### 4. Tests

- Mock HTTP responses for each provider format
- Verify normalization (Google strips `models/` prefix, etc.)
- Verify 48h cache TTL (stale cache triggers refetch)
- Verify fetch failure falls through to regex inference
- Verify static models take priority over discovered ones
- Verify `listModels()` merges static + discovered
- Verify concurrent calls don't trigger duplicate fetches

## Files

| File | Change |
|------|--------|
| `src/providers/model-discovery.ts` | NEW — fetch + normalize + cache |
| `src/providers/registry.ts` | Make `getModelInfo()`/`listModels()` async, integrate discovery |
| `src/providers/model-gateway.ts` | Await `getModelInfo()` |
| `src/tools/base.ts` | Make `selectModel()` async |
| `tests/model-discovery.test.ts` | NEW — per-provider normalization, caching, fallback |
| `tests/providers.test.ts` | Update for async + merged model lists |
| `tests/core-framework.test.ts` | Update `selectModel` calls to await |

## Risks

- Provider APIs may rate-limit model listing (mitigated by 48h cache)
- Google endpoint may change between `v1beta` and `v1` (use `v1beta` for now)
- Anthropic list endpoint is relatively new — may not be available on older API versions
- OpenRouter returns 200+ models — larger cache but still manageable
