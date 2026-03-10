---
title: Chat
layout: default
parent: Tool Reference
nav_order: 1
---

# Chat - General-Purpose Collaborative Thinking Partner

**Your go-to tool for quick questions, brainstorming, and open-ended discussions with AI models.**

## Example Prompts

```
"Ask the AI what the best approach is for implementing retry logic in this service"
```

```
"Chat with a model about the tradeoffs between SQL and NoSQL for our use case"
```

```
"Continue our previous conversation about the migration strategy"
```

```
"Look at these files and explain how the authentication flow works"
```

```
"Analyze this screenshot and describe what the UI layout is doing"
```

## How It Works

Chat is a **single-pass tool** (uses `createSimpleTool`) that sends your prompt directly to an AI model through bab's provider registry. Unlike workflow tools, it does not orchestrate multi-step investigations or expert validation -- it gives you a direct line to the model for collaborative thinking.

1. **Validates** the working directory exists on disk.
2. **Loads** any specified files into context (with size limits enforced).
3. **Resolves** the model through bab's provider registry (Google, OpenAI, Anthropic, OpenRouter, or custom providers).
4. **Sends** your prompt with the `CHAT_SYSTEM_PROMPT` and returns the model's response.
5. **Tracks** conversation history if you use `continuation_id`, allowing multi-turn exchanges.

## Key Features

- **Multi-provider support** -- routes through bab's provider registry to Google, OpenAI, Anthropic, OpenRouter, or custom endpoints.
- **Conversation continuation** -- maintain context across calls with `continuation_id` (max 8 turns of history, 16 total messages before a new continuation is required).
- **File embedding** -- attach files for the model to reference, with size limits (50k tokens per file, max 40% of the context window).
- **Image support** -- pass image file paths or base64 blobs for visual analysis tasks.
- **Working directory validation** -- the provided path must be an absolute path to an existing directory.
- **Temperature control** -- tune response creativity from deterministic (0) to highly creative (1).
- **Thinking mode** -- adjust the model's reasoning depth from `minimal` to `max`.

## Tool Parameters

- **`prompt`** (string, required) -- Your question or discussion topic.
- **`working_directory_absolute_path`** (string, required) -- Absolute path to an existing directory. Used as working context for the conversation.
- **`continuation_id`** (string, optional) -- ID from a previous chat response to continue that conversation thread.
- **`absolute_file_paths`** (string[], optional) -- List of absolute file paths to embed as context for the model.
- **`images`** (string[], optional) -- Image file paths or base64-encoded blobs for visual analysis.
- **`model`** (string, optional) -- Specific model ID to use (e.g., `gemini-2.5-pro`, `gpt-4o`). Defaults to the provider's configured model.
- **`temperature`** (number, optional) -- Sampling temperature from 0 to 1. Lower values are more focused, higher values more creative.
- **`thinking_mode`** (enum, optional) -- Controls reasoning depth. One of: `minimal`, `low`, `medium`, `high`, `max`.

## Usage Examples

### Quick question

```json
{
  "prompt": "What are the pros and cons of using WebSockets vs SSE for real-time updates?",
  "working_directory_absolute_path": "/home/user/project"
}
```

### File-aware discussion

```json
{
  "prompt": "Explain what this middleware does and suggest improvements",
  "working_directory_absolute_path": "/home/user/project",
  "absolute_file_paths": [
    "/home/user/project/src/middleware/auth.ts",
    "/home/user/project/src/middleware/rateLimit.ts"
  ]
}
```

### Continuing a conversation

```json
{
  "prompt": "Now how would we handle the edge case where the token is expired?",
  "working_directory_absolute_path": "/home/user/project",
  "continuation_id": "abc123-previous-chat-id"
}
```

### Visual analysis

```json
{
  "prompt": "What layout issues do you see in this screenshot?",
  "working_directory_absolute_path": "/home/user/project",
  "images": ["/home/user/project/screenshots/dashboard.png"]
}
```

### Using a specific model with tuned parameters

```json
{
  "prompt": "Generate 5 creative names for a CLI tool that manages dev environments",
  "working_directory_absolute_path": "/home/user/project",
  "model": "gemini-2.5-pro",
  "temperature": 0.9,
  "thinking_mode": "low"
}
```

## Best Practices

- **Start simple** -- most questions don't need file attachments or special parameters. Just send a prompt.
- **Use file embedding sparingly** -- only attach files the model actually needs. Each file consumes context window budget.
- **Leverage continuation** -- for multi-turn discussions, always pass the `continuation_id` from the previous response rather than re-explaining context.
- **Watch the turn limit** -- conversations max out at 16 total messages (8 turns). Start a fresh continuation for long discussions.
- **Match the model to the task** -- use faster/cheaper models for simple questions, stronger models for nuanced analysis.
- **Set temperature intentionally** -- use low temperature (0-0.3) for factual questions, higher (0.7-1.0) for creative brainstorming.

## When to Use vs Other Tools

| Scenario | Use | Why |
|----------|-----|-----|
| Quick question or brainstorm | **chat** | Single-pass, fast, direct model access |
| Deep multi-step investigation | **thinkdeep** | Structured workflow with expert validation |
| Code structure analysis | **analyze** | Purpose-built for codebase understanding |
| Debugging a specific error | **debug** | Specialized error diagnosis workflow |
| Reviewing code changes | **codereview** | Focused on diff review and quality |
| Need multiple models to agree | **consensus** | Cross-model validation |

Chat is your everyday conversational tool. Reach for it when you need a quick, direct exchange with an AI model -- no orchestration, no multi-step workflows, just a straightforward conversation.
