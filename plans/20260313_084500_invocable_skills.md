# Plan: User-Invocable Slash Commands (`/bab:chat`, `/bab:review`, etc.)

## Goal

Register MCP prompts so users can type `/bab:chat how should I structure auth?` in Claude Code (or any MCP client) and have it expand into instructions that call the corresponding bab MCP tool.

## Approach: MCP Prompts (not filesystem skills)

PAL uses the **MCP prompts protocol** (`prompts/list` + `prompts/get`) — a standard MCP feature. Claude Code automatically surfaces these as `/servername:promptname` slash commands. This is better than generating skill files on disk:

- No filesystem writes, no staleness, no cleanup
- Works with any MCP client (not just Claude Code)
- Prompts are always in sync with the server's tool set
- Standard MCP protocol, not a Claude Code extension

## Current State

- `server.ts` declares `capabilities: { tools: {} }` — no prompts capability
- MCP SDK supports `ListPromptsRequestSchema` and `GetPromptRequestSchema`
- `TOOL_CATALOG` in `generator.ts` has tool metadata (reusable for prompts)
- Skills system (`skills/`) stays as-is for background knowledge

## Design

### Prompt Registration

In `server.ts`, add prompts capability and two request handlers:

```typescript
capabilities: {
  tools: {},
  prompts: {},
}
```

Register handlers for `ListPromptsRequestSchema` and `GetPromptRequestSchema`.

### Prompt Mapping

| Prompt Name | MCP Tool | Type |
|---|---|---|
| `chat` | `chat` | simple |
| `challenge` | `challenge` | simple |
| `think` | `thinkdeep` | workflow |
| `review` | `codereview` | workflow |
| `debug` | `debug` | workflow |
| `analyze` | `analyze` | workflow |
| `refactor` | `refactor` | workflow |
| `testgen` | `testgen` | workflow |
| `secaudit` | `secaudit` | workflow |
| `docgen` | `docgen` | workflow |
| `tracer` | `tracer` | workflow |
| `precommit` | `precommit` | workflow |
| `planner` | `planner` | workflow |
| `consensus` | `consensus` | multi-model |
| `delegate` | `delegate` | delegation |

Skip: `version`, `list_models` (not useful as slash commands).

Claude Code shows these as `/bab:chat`, `/bab:review`, etc. (server name + prompt name).

### Prompt Templates

Each prompt returns a `GetPromptResult` with a user message containing instructions for the agent. Templates vary by tool type:

**Simple** (chat, challenge): Direct prompt pass-through.
**Workflow** (review, debug, etc.): Set up multi-step loop with step tracking.
**Multi-model** (consensus): Include model selection guidance.
**Delegation** (delegate): Parse agent name from input.

### Prompt Arguments

Each prompt accepts an `args` argument (the user's free-text input after the slash command). For the `prompts/list` response, each prompt declares:

```typescript
{
  name: "chat",
  description: "Chat and brainstorm with an AI model",
  arguments: [
    { name: "args", description: "Your question or topic", required: false }
  ]
}
```

### Architecture

New file: `src/prompts/slash-commands.ts`
- `PROMPT_REGISTRY`: array of prompt definitions (name, toolName, description, type)
- `listPrompts()`: returns MCP Prompt objects for `prompts/list`
- `getPrompt(name, args)`: returns GetPromptResult with tool-calling instructions

Wired up in `server.ts` alongside existing tool handlers.

## Steps

1. Add `ListPromptsRequestSchema` and `GetPromptRequestSchema` imports to `server.ts`
2. Create `src/prompts/slash-commands.ts` with prompt registry and template logic
3. Add `prompts: {}` to server capabilities
4. Register `list_prompts` and `get_prompt` handlers in `BabServer`
5. Add tests: list prompts returns correct set, get prompt returns valid messages for each type
6. Run full test suite
7. Rebuild binary and test `/bab:chat` in Claude Code
