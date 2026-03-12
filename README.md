# Bab

[![Bab Showcase](https://github.com/babmcp/bab/raw/main/assets/videos/showcase-poster.png)](https://github.com/babmcp/bab/raw/main/assets/videos/showcase.webm)

Bab is a TypeScript MCP server built on Bun. It was inspired by the [PAL MCP Server](https://github.com/BeehiveInnovations/pal-mcp-server) and focuses on delegate CLI plugins, a thin Vercel AI SDK provider layer, and reusable MCP tooling.

## Why "Bab"?

`Bab` comes from the Arabic word `باب`, which means `door` or `gateway`.

That name fits the project because Bab acts as a gateway between MCP clients and the systems behind them:

- CLI delegate tools
- AI providers
- local project context
- future plugin integrations

## Status

Current version: `0.1.0`

Milestones 1 through 8 are complete. The server starts over stdio, ships the delegate/plugin system, exposes the full core and specialized toolset, and includes a plugin-author SDK plus packaging for CLI distribution.

## Features

- MCP server over stdio using `@modelcontextprotocol/sdk`
- Delegate plugin system with manifest discovery and optional `adapter.ts`
- Built-in delegate roles: `default`, `planner`, `codereviewer`, `coding`
- Provider registry backed by the Vercel AI SDK
- Full core and specialized workflow tool suite
- In-memory conversation storage with continuation support and a 20-turn limit
- CLI entrypoint with `serve`, `add`, `remove`, `list`, and `test-plugin` commands
- Plugin SDK export surface via `@babmcp/bab/sdk`
- Structured stderr logging
- Bun-based test and build workflow

## Requirements

- Bun `1.3.9` or newer
- macOS or another Bun-supported environment
- API keys only for the providers you want to enable

## Quick Start

Install dependencies:

```bash
bun install
```

Run the server:

```bash
npx bab serve
```

For local development:

```bash
bun install
bun run src/cli.ts serve
```

Build the distributable bundle:

```bash
bun run build
```

Run the test suite:

```bash
bun test
```

## Configuration

Bab creates and uses `~/.config/bab/` on first run:

- `~/.config/bab/env`
  dotenv-style environment file
- `~/.config/bab/plugins/`
  delegate plugins, one directory per plugin
- `~/.config/bab/plugins/<plugin-id>/env`
  optional per-plugin env overrides merged over the global env file
- `~/.config/bab/prompts/`
  prompt overrides or additional prompt assets

Supported provider environment variables:

- `GOOGLE_API_KEY`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `OPENROUTER_API_KEY`
- `CUSTOM_API_KEY`
- `CUSTOM_API_URL`

## Delegate Plugins

Each plugin lives under `~/.config/bab/plugins/<plugin-id>/` and is discovered by `manifest.yaml`.

Bab keeps `opencode` bundled as the built-in reference plugin. Install the external first-party plugins with:

```bash
bab add git@github.com:babmcp/plugins.git
```

Minimal manifest shape:

```yaml
id: echo
name: Echo Plugin
version: 1.0.0
command: echo
roles:
  - default
delegate_api_version: 1
```

Optional `adapter.ts` files can implement runtime behavior for CLI parsing, validation, and cancellation. Plugins without adapters can still be discovered, but the `delegate` tool requires an adapter to execute them.

## Built-in Tools

- `delegate`
  Runs a prompt through a configured CLI plugin
- `chat`, `thinkdeep`, `codereview`, `planner`, `consensus`
  Core workflow tools
- `debug`, `analyze`, `tracer`, `refactor`, `testgen`, `docgen`, `secaudit`, `precommit`, `challenge`
  Specialized workflow tools
- `listmodels`
  Lists models available from configured providers
- `version`
  Returns Bab and runtime version details

## Docs

Full documentation is available at **[babmcp.github.io/bab](https://babmcp.github.io/bab/)** or in [`docs/`](./docs/README.md):

- [Getting Started](https://babmcp.github.io/bab/getting-started/)
- [Provider Setup](https://babmcp.github.io/bab/provider-setup/)
- [Plugin Authoring](https://babmcp.github.io/bab/plugin-authoring/)
- [Adapter Tutorial](https://babmcp.github.io/bab/adapter-tutorial/)
- [Tool Reference](https://babmcp.github.io/bab/tool-reference/)

## Project Layout

```text
src/
  config.ts
  server.ts
  delegate/
  memory/
  prompts/
  providers/
  tools/
  types/
  utils/
tests/
tasks/
plans/
```

## Development

Useful commands:

```bash
bun test
bun run build
bun run build:binary
bunx tsc -p tsconfig.json --noEmit
bun run src/cli.ts serve
bun run src/cli.ts add git@github.com:babmcp/plugins.git --yes
bun run src/cli.ts list
bun run src/cli.ts test-plugin ../bab-plugins/claude
```

The repo currently uses:

- Bun for runtime and package management
- TypeScript with ES modules
- Zod v4 for validation
- Biome for linting and formatting
