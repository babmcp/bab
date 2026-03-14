# Bab

[Bab Showcase](https://github.com/user-attachments/assets/c00243eb-d0a0-4db5-87d5-bc1d84ff244d)


Bab is a TypeScript MCP server built on Bun. It was inspired by the [PAL MCP Server](https://github.com/BeehiveInnovations/pal-mcp-server) and focuses on delegate CLI plugins, a thin Vercel AI SDK provider layer, and reusable MCP tooling.

## Why "Bab"?

`Bab` comes from the Arabic word `باب`, which means `door` or `gateway`.

That name fits the project because Bab acts as a gateway between MCP clients and the systems behind them:

- CLI delegate tools
- AI providers
- local project context
- future plugin integrations

## Features

- MCP server over stdio using `@modelcontextprotocol/sdk`
- Delegate plugin system with manifest discovery and optional `adapter.ts`
- Built-in delegate roles: `default`, `planner`, `codereviewer`, `coding`
- Provider registry backed by the Vercel AI SDK with per-provider thinking mode mapping
- ModelGateway for unified model routing: SDK models by ID/alias or plugin models via `pluginId/modelName`
- Multi-model consensus with parallel execution, per-model temperature and thinking mode
- Slash commands via MCP prompts protocol (`/bab:chat`, `/bab:review`, `/bab:think`, etc.)
- In-memory conversation storage with continuation support and a 20-turn limit
- Full core and specialized workflow tool suite
- CLI entrypoint with `serve`, `add`, `remove`, `list`, `selfupdate`, and `test-plugin` commands
- Plugin SDK export surface via `@babmcp/bab/sdk`

## Install

### Homebrew (macOS / Linux)

```bash
brew install babmcp/tap/bab
```

### Install script (macOS / Linux)

```bash
curl -fsSL https://raw.githubusercontent.com/babmcp/bab/main/install.sh | bash
```

Options:

```bash
# custom install directory
curl -fsSL https://raw.githubusercontent.com/babmcp/bab/main/install.sh | bash -s -- --prefix /usr/local/bin

# skip checksum verification (not recommended)
curl -fsSL https://raw.githubusercontent.com/babmcp/bab/main/install.sh | bash -s -- --no-verify
```

### Binary download

Grab the latest binary for your platform from the [releases page](https://github.com/babmcp/bab/releases):

| Platform | Architecture | Asset |
|----------|-------------|-------|
| macOS | Apple Silicon | `bab-darwin-arm64` |
| macOS | Intel | `bab-darwin-x64` |
| Linux | x64 | `bab-linux-x64` |
| Linux | ARM64 | `bab-linux-arm64` |

```bash
chmod +x bab-*
mv bab-* /usr/local/bin/bab
```

### From source

Requires [Bun](https://bun.sh) 1.3.9 or newer.

```bash
git clone https://github.com/babmcp/bab.git && cd bab
bun install
bun run build:binary   # compiled binary at dist/bab
```

### Self-update

Once installed, update to the latest release:

```bash
bab selfupdate
```

## Quick Start

Start the MCP server:

```bash
bab serve
```

Install first-party plugins:

```bash
bab add git@github.com:babmcp/plugins.git
```

Run the test suite:

```bash
bun test
```

## Connect Bab To MCP Clients

Use the installed `bab` binary as a local stdio MCP server. Replace `/absolute/path/to/bab` with the output of:

```bash
which bab
```

### Codex

Add this to `~/.codex/config.toml`:

```toml
[mcp_servers.bab]
command = "/absolute/path/to/bab"
args = ["serve"]
startup_timeout_sec = 300.0
tool_timeout_sec = 1200.0
```

Then restart Codex or reload MCP servers.

### Claude Code

Add Bab as a user-scoped stdio MCP server:

```bash
claude mcp add-json --scope user bab \
  '{"type":"stdio","command":"/absolute/path/to/bab","args":["serve"]}'
```

Verify with:

```bash
claude mcp get bab
```

### GitHub Copilot CLI

Add this to `~/.copilot/mcp-config.json`:

```json
{
  "mcpServers": {
    "bab": {
      "type": "local",
      "command": "/absolute/path/to/bab",
      "args": ["serve"],
      "tools": ["*"]
    }
  }
}
```

You can also add it interactively from Copilot CLI with `/mcp add`.

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

Bab keeps `opencode` bundled as the built-in reference plugin. Install the external first-party plugins:

```bash
# Install all first-party plugins (claude, codex, copilot)
bab add babmcp/plugins

# List installed plugins
bab list

# Remove a specific plugin
bab remove <plugin-id>
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

Plugins can also provide custom system prompts for workflow tools via `tool_prompts`:

```yaml
tool_prompts:
  codereview: prompts/codereview.txt
  secaudit: prompts/secaudit.txt
```

When a tool routes through a plugin model, bab uses the plugin's prompt instead of the built-in default. See [Plugin Authoring](https://babmcp.github.io/bab/plugin-authoring/) for details.

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

Full documentation is available at **[babmcp.github.io/bab](https://babmcp.github.io/bab/)** or in [`docs/`](./docs/index.md):

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

## Disclaimer

See [DISCLAIMER.md](./DISCLAIMER.md).
