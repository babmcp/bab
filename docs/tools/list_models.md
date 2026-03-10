---
title: List Models
layout: default
parent: Tool Reference
nav_order: 16
---

# List Models - Display Available AI Models

**Queries providers and plugins to show every model you can use**

The `list_models` tool shows all AI models available to bab, organized by source. It queries both the provider registry (configured AI providers) and plugin adapters (delegate plugins) in parallel, returning a unified view of what models are accessible.

## Example Prompts

```
"Use bab to list available models"
```

```
"What models does bab have access to?"
```

```
"Show me all configured providers and their models"
```

## How It Works

1. The tool queries two sources in parallel:
   - **Provider registry** — models from configured AI providers (Gemini, OpenAI, etc.)
   - **Plugin adapters** — models from delegate plugins that implement the optional `listModels()` method
2. Results are merged and returned with metadata (counts, sources)
3. No authentication is performed — the tool reads existing configuration

## Key Features

- **Parallel querying** — provider registry and plugin adapters are queried simultaneously
- **Two model sources** — providers (API-key-gated) and plugins (adapter-based)
- **Configuration-aware** — provider models only appear if the provider has a configured API key
- **Plugin discovery** — surfaces models from adapters that implement the optional `listModels()` method
- **Metadata summary** — returns total count, provider count, and plugin count
- **No authentication required** — reads from existing config, no API calls made

## Tool Parameters

This tool takes no parameters. Call it with an empty input.

## Usage Examples

**Quick Model Check:**
```
"Use bab list_models to see what's available before picking a model for consensus"
```

**Verify Provider Setup:**
```
"List bab models to confirm my Gemini API key is working"
```

**Discover Plugin Models:**
```
"What models do my bab plugins expose?"
```

## Output Information

**Providers:**
- Models from configured AI providers (Gemini, OpenAI, OpenRouter, custom endpoints)
- Only shown when the provider's API key is set

**Plugins:**
- Models from delegate plugins that implement `listModels()`
- Not all plugins expose models — only those with the optional method

**Metadata:**
- `count` — total number of models across all sources
- `provider_count` — number of provider-sourced models
- `plugin_count` — number of plugin-sourced models

## Best Practices

- **Check before selecting models** — run `list_models` before using `model` overrides in other tools
- **Verify after configuration changes** — confirm new API keys or plugins are picked up
- **Use for troubleshooting** — if a model isn't working, check whether it appears in the list
- **Understand the sources** — provider models require API keys; plugin models require adapters with `listModels()`

## When to Use vs Other Tools

- **Use `list_models`** for: Seeing what models are available and which providers are configured
- **Use `version`** for: Server health check, runtime information, and version details
- **Use `chat`** for: Actually using a model for conversation or analysis
- **Use `consensus`** for: Comparing outputs across multiple models
