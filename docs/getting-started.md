---
title: Getting Started
layout: default
nav_order: 2
---

# Getting Started

## Install

From npm:

```bash
npx bab serve
```

For local development:

```bash
bun install
bun run build
node dist/cli.js serve
```

## Configuration

Bab creates and uses `~/.config/bab/`:

- `~/.config/bab/env`
- `~/.config/bab/plugins/`
- `~/.config/bab/prompts/`

Supported provider environment variables:

- `GOOGLE_API_KEY`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `OPENROUTER_API_KEY`
- `CUSTOM_API_KEY`
- `CUSTOM_API_URL`

## Common Commands

Start the MCP server:

```bash
bab serve
```

Install the first-party external plugins:

```bash
bab add git@github.com:babmcp/plugins.git
```

> **Security note:** Plugin adapters run as trusted code with full access to your filesystem and network. Bab will always prompt for confirmation before installing. Only install plugins from sources you trust.

List bundled and installed plugins:

```bash
bab list
```

Validate a plugin directory:

```bash
bab test-plugin ~/.config/bab/plugins/my-plugin
```

Build the distributable bundle:

```bash
bun run build
```

Optional single-binary build:

```bash
bun run build:binary
```
