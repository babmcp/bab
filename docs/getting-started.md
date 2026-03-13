---
title: Getting Started
layout: default
nav_order: 2
---

# Getting Started

## Install

### Homebrew (macOS / Linux)

```bash
brew install babmcp/tap/bab
```

### Install script (macOS / Linux)

```bash
curl -fsSL https://raw.githubusercontent.com/babmcp/bab/main/install.sh | bash
```

### Binary download

Grab the latest from the [releases page](https://github.com/babmcp/bab/releases), then `chmod +x` and move to a directory on your PATH.

### From source

Requires [Bun](https://bun.sh) 1.3.9 or newer.

```bash
git clone https://github.com/babmcp/bab.git && cd bab
bun install
bun run build:binary   # compiled binary at dist/bab
```

### Self-update

```bash
bab selfupdate
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
