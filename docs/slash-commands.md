---
title: Slash Commands
layout: default
nav_order: 4
---

# Slash Commands

Bab registers MCP prompts that appear as slash commands in Claude Code and other MCP clients. Type `/bab:` to see them in the autocomplete menu.

## Available Commands

| Command | Tool | Description |
|---------|------|-------------|
| `/bab:chat` | `chat` | Chat and brainstorm ideas with an AI model |
| `/bab:challenge` | `challenge` | Challenge a claim or assumption with critical thinking |
| `/bab:think` | `thinkdeep` | Deep multi-stage reasoning for complex problems |
| `/bab:review` | `codereview` | Systematic code review with expert validation |
| `/bab:debug` | `debug` | Systematic debugging and root cause analysis |
| `/bab:analyze` | `analyze` | Comprehensive code and architecture analysis |
| `/bab:refactor` | `refactor` | Code refactoring opportunity analysis |
| `/bab:testgen` | `testgen` | Generate comprehensive test suites with edge cases |
| `/bab:secaudit` | `secaudit` | Security audit with vulnerability assessment |
| `/bab:docgen` | `docgen` | Generate code documentation with complexity analysis |
| `/bab:tracer` | `tracer` | Trace execution flow or map dependencies |
| `/bab:precommit` | `precommit` | Validate changes before committing |
| `/bab:planner` | `planner` | Interactive sequential planning with revision |
| `/bab:consensus` | `consensus` | Multi-model consensus through structured debate |
| `/bab:delegate` | `delegate` | Delegate a task to a CLI agent (Codex, Copilot, OpenCode) |

## Usage

Slash commands accept free-text arguments after the command name:

```
/bab:chat what are the tradeoffs of Redis vs Memcached?
/bab:review check the authentication middleware for security issues
/bab:delegate codex implement the UserService.delete() method
/bab:secaudit audit the payment processing module
/bab:consensus should we use GraphQL or REST for the new API?
```

If no arguments are provided, the agent will ask for input.

## How It Works

Slash commands use the standard MCP **prompts** protocol (`prompts/list` + `prompts/get`). When you invoke a slash command, the MCP client receives a prompt message that instructs the agent to call the corresponding bab tool with your input.

- **Simple commands** (`chat`, `challenge`) pass your input directly as the prompt
- **Workflow commands** (`review`, `debug`, `analyze`, etc.) set up a multi-step investigation loop
- **Consensus** routes your question through multiple AI models for structured debate
- **Delegate** parses agent name from your input and dispatches to the CLI agent

## Compatibility

Slash commands work with any MCP client that supports the prompts protocol:

- Claude Code (`/bab:chat`)
- Claude Desktop
- Other MCP-compatible editors and tools
