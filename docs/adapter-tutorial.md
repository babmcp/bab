---
title: Adapter Tutorial
layout: default
nav_order: 6
---

# Adapter Tutorial

Bab supports two adapter modes. The **Simple Adapter** is preferred for new plugins — bab handles process spawning, timeouts, and event construction. The **Legacy Adapter** with a `run()` function is still supported for advanced use cases.

## Simple Adapter (Preferred)

Export `buildCommand` and `parseResult`. Bab wraps your adapter with its ProcessRunner, handling timeouts, cancellation, stdout/stderr capture, and event construction automatically.

```ts
const adapter = {
  buildCommand(input) {
    return {
      args: ["run", "--format", "json", "-p", input.prompt],
      // Optional overrides:
      // command: "other-cli",    // override manifest.command
      // env: { ...input.env },   // override/filter env
      // stdin: input.prompt,     // pipe prompt via stdin
      // timeoutMs: 120_000,      // override default timeout
    };
  },

  parseResult(result, input) {
    if (result.exitCode !== 0 && !result.stdout.trim()) {
      throw new Error(result.stderr.trim() || `Exited with status ${result.exitCode}`);
    }
    const data = JSON.parse(result.stdout);
    return {
      content: data.message,
      metadata: { model: data.model, usage: data.usage },
    };
  },
};

export default adapter;
```

### buildCommand(input)

Receives the full `DelegateRunInput` and returns how to invoke the CLI:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `args` | `string[]` | Yes | CLI arguments |
| `command` | `string` | No | Override `manifest.command` |
| `env` | `Record<string, string>` | No | Override subprocess env (default: `input.env`) |
| `stdin` | `string` | No | Pipe this string to stdin |
| `timeoutMs` | `number` | No | Override default timeout |

### parseResult(result, input)

Receives the process result and original input. Returns content and metadata:

```ts
interface ProcessRunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  signal: string | null;
  timedOut: boolean;
  durationMs: number;
}
```

Return `{ content: string; metadata: Record<string, unknown> }`. Bab wraps this into standardized `DelegateEvent[]` automatically.

### What bab handles for you

- Process spawning via ProcessRunner
- Timeout management with SIGTERM/SIGKILL escalation
- stdout/stderr capture with size cap
- Timeout error throwing
- Event construction (output + done events)
- Metadata attachment (duration_ms, exit_code, signal, timed_out)
- Cancel by runId

## Legacy Adapter

For advanced use cases where you need full control over process management, export a `run()` function:

```ts
interface DelegatePluginAdapter {
  run(input: DelegateRunInput): Promise<DelegateEvent[]>;
  validate?(): void;
  discover?(): Record<string, unknown>;
  cancel?(runId?: string): void;
  listModels?(): string[];
}
```

### Detection Rule

Bab detects the adapter mode automatically:
- Has `run()` function → legacy adapter, used as-is
- Has `buildCommand()` + `parseResult()` → simple adapter, wrapped by bab
- Neither → invalid adapter

## Input

Both modes receive the same input:

```ts
interface DelegateRunInput {
  prompt: string;
  role: ResolvedRole;
  runId: string;
  env?: Record<string, string>;
  workingDirectory?: string;
}

interface ResolvedRole {
  name: string;
  prompt: string;
  args: Record<string, string | number | boolean>;
  source: "built_in" | "plugin";
}
```

## Optional Methods

Both adapter modes can export these optional methods:

| Method | Purpose |
|--------|---------|
| `validate()` | Runs at load time — throw to signal the plugin can't operate |
| `discover()` | Returns plugin metadata for the MCP server's registry |
| `listModels()` | Returns available model IDs for the `list_models` tool |
| `cancel(runId?)` | Kills active processes (simple adapters get this for free) |

## Real-World Simple Adapter

```ts
const PROVIDER_ID = "my-plugin";

const adapter = {
  validate() {
    if (!Bun.which("my-cli")) {
      throw new Error("my-cli was not found on PATH");
    }
  },

  discover() {
    return {
      id: PROVIDER_ID,
      command: "my-cli",
      name: "My Plugin",
      roles: ["default", "planner"],
    };
  },

  listModels() {
    return ["model-a", "model-b"];
  },

  buildCommand(input) {
    const args = ["run", "--format", "json", "-p", input.prompt];
    const model = input.role.args.model;
    if (model) args.push("--model", String(model));
    return { args };
  },

  parseResult(result, input) {
    if (result.exitCode !== 0 && !result.stdout.trim()) {
      throw new Error(result.stderr.trim() || `my-cli failed`);
    }
    const data = JSON.parse(result.stdout);
    return {
      content: data.message,
      metadata: {
        model: data.model,
        usage: data.usage,
        exit_code: result.exitCode,
      },
    };
  },
};

export default adapter;
```

## Notes

- Simple adapters don't import anything from bab — fully self-contained
- Built-in role names: `default`, `planner`, `codereviewer`, `coding`
- Use `BAB_CLI_TIMEOUT_MS` env var to configure timeout (default: 5 minutes)
- Metadata from `parseResult` is sanitized: bloat keys stripped, size capped at 10KB, core keys (plugin_id, role, run_id) can't be overridden
