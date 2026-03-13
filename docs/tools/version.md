---
title: Version
layout: default
parent: Tool Reference
nav_order: 17
---

# Version - Server Information and Health Check

**Returns bab version, runtime, and platform details**

The `version` tool provides basic information about the running bab MCP server. It is the quickest way to verify the server is responding and to check what version is deployed.

## Example Prompts

```
"Get bab version"
```

```
"Is the bab MCP server running?"
```

```
"What version of bab am I using?"
```

## How It Works

1. The tool reads version information from `package.json`
2. It collects runtime and platform details from the Bun process
3. Returns a simple object with all fields — no external calls, no configuration needed

## Key Features

- **No parameters required** — call with empty input
- **No configuration needed** — works immediately, no API keys or setup
- **Quick health check** — if it responds, the MCP server is alive
- **Runtime details** — confirms the Bun runtime version and OS platform

## Tool Parameters

This tool takes no parameters. Call it with an empty input.

## Output Information

The tool returns:

- `name` — always `"bab"`
- `version` — semantic version from package.json (e.g., `"0.1.1"`)
- `runtime` — always `"bun"`
- `bun_version` — the running Bun version
- `os` — platform identifier (e.g., `"darwin"`, `"linux"`)

## Usage Examples

**Quick Health Check:**
```
"Use bab version to confirm the server is running"
```

**Version Verification:**
```
"Check bab version before reporting a bug"
```

**Environment Details:**
```
"Get bab version to include in the support request"
```

## Best Practices

- **Include in bug reports** — always provide version output when reporting issues
- **Check after updates** — verify the expected version is running after an upgrade
- **Use as a smoke test** — if `version` responds, the MCP server transport is working

## When to Use vs Other Tools

- **Use `version`** for: Quick server health check, version verification, runtime details
- **Use `list_models`** for: Available models, provider configuration, and plugin discovery
- **Use other tools** for: Actual development, analysis, and debugging work
