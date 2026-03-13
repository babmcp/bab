# Plan: Consensus Multi-Model Routing & Parallel Execution

## Problem

Bab's consensus tool can only use SDK models (5 in static registry) via `providerRegistry.generateText()`. The 173 plugin models (OpenCode, Copilot) go through the delegate pipeline and are invisible to consensus. There's no per-model temperature, no thinking mode control, and execution is sequential.

## Architecture Gap

Two execution paths exist, consensus only uses one:

```
SDK path:     consensus → providerRegistry.generateText() → AI SDK → API
Delegate path: delegate tool → loadPlugins → adapter.run() → ProcessRunner → CLI
```

Consensus needs to bridge both.

## Design: Model Gateway

> Reviewed by GPT-5.1 Codex and software-design-reviewer (Ousterhout principles).
> Key feedback: queryModel() must NOT live inside consensus — it's general-purpose
> infrastructure (Principle 8: separate general from special). Extract to a gateway
> module so all tools (chat, analyze, debug, etc.) can reuse it.

New module `src/providers/model-gateway.ts` owns the routing decision:

```
ModelGateway.query(modelId, prompt, systemPrompt, options)
  ├─ providerRegistry.getModelInfo(modelId) found? → generateText()
  └─ parse as "pluginId/modelName" → delegate pipeline
```

Returns unified `{ text, provider, model, usage }`.

This keeps consensus focused on orchestration (debate, synthesis, conversation)
and the gateway focused on model resolution and execution — different layers,
different abstractions (Principle 9).

## Changes

### 1. Extract shared plugin cache (`src/delegate/plugin-cache.ts`) — NEW

Extract `getLoadedPlugins()` from `delegate/index.ts` into shared module.
Use promise memoization to handle concurrent callers:

```typescript
let inflight: Promise<LoadedPlugin[]> | undefined;
let cached: { loaded: LoadedPlugin[]; at: number } | undefined;

export async function getLoadedPlugins(config: BabConfig): Promise<LoadedPlugin[]> {
  if (cached && Date.now() - cached.at < TTL) return cached.loaded;
  if (inflight) return inflight;
  inflight = discoverAndLoad(config).then(loaded => {
    cached = { loaded, at: Date.now() };
    inflight = undefined;
    return loaded;
  });
  return inflight;
}
```

### 2. Model gateway (`src/providers/model-gateway.ts`) — NEW

Routing function:
- Try `providerRegistry.getModelInfo(modelId)` → use `generateText()`
- If not found, split on first `/` → `pluginId` + `modelName`
- Load plugin via shared cache, build delegate run input with model as role arg
- Parse delegate output events → extract text
- Return unified `GenerateTextResult`

Error messages must be explicit about what was tried:
```
Model "foo/bar" not found. Checked SDK registry and plugin "foo".
Available plugins: opencode, copilot
```

For delegate models: pass `thinking_mode` as role arg (adapter decides), silently
ignore for models that don't support it. Usage may be estimated or omitted.

### 3. Thinking mode in provider registry (`src/providers/registry.ts`)

Add `thinkingMode` to `GenerateTextOptions`. All provider-specific mapping
happens INSIDE `generateText()` — never exposed to callers (Principle 10: pull
complexity downward).

```typescript
// Inside generateText — hidden from callers
private buildProviderOptions(provider, { thinkingMode }) {
  if (!thinkingMode) return {};
  switch (provider) {
    case "anthropic": return { thinking: { type: "enabled", budgetTokens: BUDGET_MAP[thinkingMode] } };
    case "openai": return { reasoning_effort: EFFORT_MAP[thinkingMode] };
    case "google": return {}; // implicit
    default: return {}; // silently ignore
  }
}
```

Budget mapping (internal to registry):

| Level | Anthropic tokens | OpenAI effort |
|-------|-----------------|---------------|
| minimal | 1,024 | low |
| low | 5,000 | low |
| medium | 20,000 | medium |
| high | 50,000 | high |
| max | 80,000 | high |

### 4. Schema changes (`src/tools/consensus/index.ts`)

```typescript
ConsensusModelSchema = z.object({
  model: z.string().min(1),
  stance: z.enum(["for", "against", "neutral"]).optional(),
  stance_prompt: z.string().min(1).optional(),
  temperature: z.number().min(0).max(1).optional(),        // NEW per-model
  thinking_mode: z.enum(["minimal", "low", "medium", "high", "max"]).optional(), // NEW
});

ConsensusInputSchema: add `parallel: z.boolean().optional()` // NEW, default false
```

### 5. Parallel execution (`src/tools/consensus/index.ts`)

`parallel` defaults to `false` (backward compat, preserves step-by-step flow).

When `parallel: true`, use `Promise.allSettled` (not `Promise.all`) so a slow/failing
model doesn't block the entire batch. Include per-model status in response:

```typescript
const settled = await Promise.allSettled(
  modelsToConsult.map((cfg) => gateway.query(cfg.model, prompt, systemPrompt, {
    temperature: cfg.temperature ?? request.temperature,
    thinkingMode: cfg.thinking_mode,
  }))
);

// Map settled results: fulfilled → response, rejected → error entry
```

Per-model temperature: `cfg.temperature ?? request.temperature`

Results are stored in input order regardless of completion order to keep
deterministic payloads and aligned stance prompts.

### 6. Consensus tool uses gateway (`src/tools/consensus/index.ts`)

Replace direct `providerRegistry.generateText()` calls with `gateway.query()`.
Consensus no longer knows about SDK vs delegate distinction.

### 7. Update delegate tool (`src/tools/delegate/index.ts`)

Use shared `getLoadedPlugins()` from `delegate/plugin-cache.ts` instead of
inline closure cache.

### 8. Update tool description

Update MCP tool description to mention:
- Model-specific routing (SDK + plugin models via `pluginId/modelName`)
- Per-model temperature and thinking mode
- Parallel execution option

### 9. Tests

- Gateway: SDK model routing
- Gateway: plugin model routing (`pluginId/modelName` → delegate)
- Gateway: unknown model → descriptive error with available plugins
- Gateway: thinking mode mapping per provider (Anthropic, OpenAI, ignored for others)
- Consensus: parallel execution (mock 3 models, verify concurrent via Promise.allSettled)
- Consensus: per-model temperature override
- Consensus: partial failure in parallel mode (one model fails, others succeed)
- Consensus: results ordered by input position, not completion order

## File Changes

| File | Change |
|------|--------|
| `src/delegate/plugin-cache.ts` | NEW — shared getLoadedPlugins with promise memoization |
| `src/providers/model-gateway.ts` | NEW — queryModel routing (SDK + delegate) |
| `src/providers/registry.ts` | Add thinkingMode to GenerateTextOptions + internal mapping |
| `src/tools/consensus/index.ts` | Schema + use gateway + parallel + per-model options |
| `src/tools/delegate/index.ts` | Use shared plugin-cache |
| `tests/model-gateway.test.ts` | NEW — gateway routing + thinking mode tests |
| `tests/consensus.test.ts` | Parallel, per-model options, partial failure tests |

## Decisions (resolved from review)

1. **queryModel placement**: `src/providers/model-gateway.ts` (not inside consensus)
2. **Plugin model ID format**: explicit `pluginId/modelName` (consistent with list_models output)
3. **parallel default**: `false` (opt-in, backward compat)
4. **Parallel strategy**: `Promise.allSettled` (partial failure safe)
5. **Thinking mode mapping**: hidden inside registry, not exposed to callers
6. **Plugin cache**: promise memoization to prevent concurrent duplicate discovery
7. **Usage for delegate models**: best-effort estimate or omit (flagged in metadata)

## Risks

- Plugin models are slower (process spawning) — parallel helps but timeouts must be generous
- Not all models support thinking mode — silently ignored, no error
- Delegate pipeline doesn't return structured usage — estimate or omit, flagged in metadata
- Concurrent plugin cache refresh — mitigated by promise memoization
