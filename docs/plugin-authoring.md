---
title: Plugin Authoring
layout: default
nav_order: 5
---

# Plugin Authoring

Bab delegate plugins live under `~/.config/bab/plugins/<plugin-id>/`.

## Directory Layout

```text
my-plugin/
  manifest.yaml
  adapter.ts
  prompts/
    default.txt        # role prompt
    planner.txt        # role prompt
    codereview.txt     # tool prompt (optional)
    secaudit.txt       # tool prompt (optional)
```

## Manifest

`manifest.yaml` defines your plugin's identity, CLI command, roles, and capabilities.

```yaml
id: my-plugin
name: My Plugin
version: 1.0.0
command: my-cli
roles:
  - name: default
    description: Default delegate role.
    inherits: default
    prompt_file: prompts/default.txt
    args:
      model: some-model
  - name: planner
    description: Planning-focused role.
    inherits: planner
    prompt_file: prompts/planner.txt
capabilities:
  supports_cancellation: true
  supports_images: false
  supports_streaming: false
  supports_working_directory: true
  output_format: jsonl
tool_prompts:
  codereview: prompts/codereview.txt
  debug: prompts/debug.txt
delegate_api_version: 1
```

### Manifest Fields

| Field | Required | Description |
|---|---|---|
| `id` | yes | Lowercase alphanumeric with hyphens/underscores. Must be unique. |
| `name` | yes | Human-readable display name. |
| `version` | yes | Semver string (e.g. `1.0.0`). |
| `command` | yes | CLI binary name (must be on `PATH`). |
| `roles` | yes | At least one role. Can be a built-in name (`default`, `planner`, `codereviewer`, `coding`) or a full role object. |
| `capabilities` | no | Defaults: cancellation off, images off, streaming off, working directory on, output `text`. |
| `tool_prompts` | no | Map of tool name to prompt file path. See [Tool Prompts](#tool-prompts). |
| `delegate_api_version` | no | Defaults to `1`. |

### Role Definition

| Field | Required | Description |
|---|---|---|
| `name` | yes | Role identifier used when calling `delegate`. |
| `description` | no | Human-readable description. |
| `inherits` | no | Inherit prompts from a built-in role (`default`, `planner`, `codereviewer`, `coding`). |
| `prompt_file` | no | Path to a text file with the role's system prompt (relative to plugin dir). |
| `args` | no | Key-value pairs passed to the adapter (e.g. `model`, `temperature`). |

## Adapter

`adapter.ts` is the runtime bridge between bab and your CLI. It must export a default object implementing the `DelegatePluginAdapter` interface.

See [Adapter Tutorial](./adapter-tutorial.md) for the full interface and a real-world example.

## SDK

Plugin authors can import types and utilities from the published SDK:

```ts
import type { DelegatePluginAdapter, DelegateRunInput } from "@babmcp/bab/sdk";
import { DelegateEventSchema, PluginManifestSchema } from "@babmcp/bab/sdk";
```

Key SDK exports:

- **Types**: `DelegatePluginAdapter`, `DelegateRunInput`, `ResolvedRole`, `LoadedPlugin`, `DelegateEvent`, `OutputEvent`, `DoneEvent`, `ErrorEvent`, `PluginManifest`, `PluginRole`, `RoleDefinition`
- **Schemas**: `DelegateEventSchema`, `PluginManifestSchema`, `PluginRoleSchema`, `RoleDefinitionSchema`, `PluginCapabilitySchema`
- **Test helpers**: `assertDelegateEvents`, `createDoneEvent`, `createMockProcessRunner`

## Environment Variables

Plugins receive a merged environment built from three sources, in priority order:

1. **Plugin `env` file** (`~/.config/bab/plugins/<id>/env`) — plugin-specific variables, highest priority
2. **Global `env` file** (`~/.config/bab/env`) — shared variables across all plugins
3. **Process environment** — inherited from the bab process

Certain variables are always sourced from the real process environment regardless of config, to prevent path/security override: `PATH`, `HOME`, `USER`, `SHELL`, `TERM`, `TMPDIR`, `LANG`, and `LC_*` variables.

Variables with the `BAB_INTERNAL_` prefix are stripped and never forwarded to adapters.

Useful variables:

| Variable | Description |
|---|---|
| `BAB_CLI_TIMEOUT_MS` | Override the default CLI timeout (default: 3 hours). Applies to all adapters. |

## Prompt Files

Role prompts live in the `prompts/` directory. They are plain text files whose content becomes the role's system prompt, prepended to the user's prompt when `combinePrompt()` is called.

## Tool Prompts

Plugins can provide custom system prompts for bab's workflow tools (`codereview`, `debug`, `thinkdeep`, `secaudit`, etc.). When a tool routes through a plugin model (e.g. `copilot/gpt-4`), bab checks the plugin's `tool_prompts` for a matching entry and uses that prompt instead of the built-in default.

Add a `tool_prompts` section to your `manifest.yaml`:

```yaml
tool_prompts:
  codereview: prompts/codereview.txt
  debug: prompts/debug.txt
  secaudit: prompts/secaudit.txt
```

Each key is a tool name, and the value is a path to a plain text file relative to the plugin directory. The file's contents **replace** the built-in system prompt entirely for that tool.

Available tool names: `chat`, `challenge`, `thinkdeep`, `codereview`, `debug`, `analyze`, `refactor`, `testgen`, `secaudit`, `docgen`, `tracer`, `precommit`, `planner`, `consensus`.

Prompt files are read and cached when the plugin loads. Paths must stay within the plugin directory (same containment check as role `prompt_file`). If a tool name is not listed, bab uses its built-in prompt.

## Conformance Check

Validate a plugin without starting the MCP server:

```bash
bab test-plugin ./my-plugin
```

## Installation

### Install all first-party plugins

```bash
bab add babmcp/plugins
```

This installs all plugins from the [babmcp/plugins](https://github.com/babmcp/plugins) repository (`claude`, `codex`, `copilot`).

### Install from any git repository

```bash
# GitHub shorthand
bab add yourorg/your-plugins

# SSH URL
bab add git@github.com:yourorg/your-plugins.git

# HTTPS URL
bab add https://github.com/yourorg/your-plugins.git

# Pin to a specific branch, tag, or commit
bab add babmcp/plugins#v1.2.0
```

### Install a single plugin

If a repository contains multiple plugins and you only want one, clone the repo and point `bab add` at the specific subdirectory's git URL:

```bash
# Install only the copilot plugin
bab add git@github.com:babmcp/plugins.git  # installs all — then remove what you don't need:
bab remove codex
bab remove claude
```

### Skip confirmation

```bash
bab add babmcp/plugins --yes
```

### List installed plugins

```bash
bab list
```

### Remove a plugin

```bash
bab remove <plugin-id>
```

## Multi-Plugin Repositories

Bab supports repositories with multiple plugin directories at the top level. Each subdirectory with a `manifest.yaml` is discovered and installed:

```text
bab-plugins/
  claude/
    manifest.yaml
    adapter.ts
    prompts/
  codex/
    manifest.yaml
    adapter.ts
    prompts/
  copilot/
    manifest.yaml
    adapter.ts
    prompts/
```
