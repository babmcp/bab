---
title: ThinkDeep
layout: default
parent: Tool Reference
nav_order: 2
---

# ThinkDeep - Multi-Step Deep Investigation with Expert Validation

**A structured workflow tool for complex problems that require iterative investigation, hypothesis tracking, and expert-level validation.**

## Example Prompts

```
"Think deeply about why our WebSocket connections drop after exactly 60 seconds in production"
```

```
"Investigate the performance regression in the search endpoint across these files"
```

```
"Analyze the security implications of our current session handling approach step by step"
```

```
"I have a theory that the memory leak is caused by unclosed event listeners -- validate this across the codebase"
```

## How It Works

ThinkDeep is a **workflow tool** (uses `WorkflowRunner`) that orchestrates a multi-step investigation process with two distinct phases:

1. **Investigation Phase** -- Claude performs structured, step-by-step analysis. Each step builds on previous findings, tracks confidence levels, and can revise hypotheses based on new evidence.
2. **Expert Analysis Phase** -- Once investigation steps are complete (`next_step_required: false`), the accumulated findings are sent to an AI model for independent expert validation and synthesis.

The workflow follows this cycle:

```
Step 1 (explore) -> Step 2 (narrow down) -> ... -> Step N (conclude)
                                                        |
                                                        v
                                              Expert Validation
                                                        |
                                                        v
                                               Final Analysis
```

Each step produces structured output including findings, confidence levels, and relevant files -- creating a traceable investigation trail.

## Key Features

- **Multi-step investigation** -- break complex problems into sequential steps that build on each other.
- **Expert validation** -- after investigation completes, an AI model independently reviews and validates findings (controlled by `use_assistant_model`).
- **Hypothesis tracking** -- state your theory and watch confidence evolve as evidence accumulates.
- **Confidence evolution** -- track how certain you are across steps: from `exploring` through `low`, `medium`, `high`, `very_high`, `almost_certain`, to `certain`.
- **Backtracking support** -- revise earlier conclusions when new evidence contradicts them.
- **Conversation threading** -- use `continuation_id` to resume investigations across sessions.
- **Issue cataloging** -- structured tracking of discovered issues with severity levels.
- **Focus areas** -- direct investigation toward specific aspects of the problem.

## Tool Parameters

- **`step`** (string, required) -- Description of the current investigation step being performed.
- **`step_number`** (number, required) -- Current step number (integer >= 1).
- **`total_steps`** (number, required) -- Expected total number of steps (integer >= 1). Can be revised as investigation progresses.
- **`next_step_required`** (boolean, required) -- Whether more investigation steps are needed. Set to `false` to trigger expert validation.
- **`findings`** (string, required) -- Discoveries and observations from the current step.
- **`confidence`** (enum, optional) -- Current confidence level. One of: `exploring`, `low`, `medium`, `high`, `very_high`, `almost_certain`, `certain`.
- **`continuation_id`** (string, optional) -- ID from a previous thinkdeep response to continue an investigation.
- **`model`** (string, optional) -- Specific model ID for the expert validation phase.
- **`temperature`** (number, optional) -- Sampling temperature from 0 to 1 for the expert model.
- **`thinking_mode`** (enum, optional) -- Reasoning depth for the expert model. One of: `minimal`, `low`, `medium`, `high`, `max`.
- **`files_checked`** (string[], optional) -- List of files examined during this step.
- **`relevant_files`** (string[], optional) -- Files identified as relevant to the investigation.
- **`relevant_context`** (string[], optional) -- Specific methods, functions, or code constructs relevant to the investigation.
- **`issues_found`** (object[], optional) -- Structured issues discovered. Each object has `description` (string) and `severity` (string).
- **`images`** (string[], optional) -- Image file paths or base64 blobs for visual evidence.
- **`problem_context`** (string, optional) -- Detailed description of the problem being investigated.
- **`focus_areas`** (string[], optional) -- Specific aspects to concentrate the investigation on.
- **`hypothesis`** (string, optional) -- Current working theory being tested.
- **`use_assistant_model`** (boolean, optional, default: true) -- Whether to run expert validation after investigation completes.

## Usage Examples

### Starting an investigation

```json
{
  "step": "Examining the WebSocket connection lifecycle and timeout configuration",
  "step_number": 1,
  "total_steps": 3,
  "next_step_required": true,
  "findings": "The WebSocket server uses default timeout settings. No explicit keepalive is configured.",
  "confidence": "exploring",
  "problem_context": "WebSocket connections consistently drop after 60 seconds in production but work fine locally",
  "hypothesis": "A reverse proxy or load balancer is enforcing a 60-second idle timeout",
  "focus_areas": ["infrastructure config", "proxy settings", "keepalive mechanisms"],
  "files_checked": ["src/server/websocket.ts"]
}
```

### Mid-investigation with growing confidence

```json
{
  "step": "Checking nginx and load balancer configuration for timeout settings",
  "step_number": 2,
  "total_steps": 3,
  "next_step_required": true,
  "findings": "Found nginx proxy_read_timeout set to 60s in the production config. Local dev bypasses nginx entirely.",
  "confidence": "high",
  "hypothesis": "nginx proxy_read_timeout of 60s is killing idle WebSocket connections",
  "relevant_files": ["infra/nginx/production.conf"],
  "issues_found": [
    {
      "description": "nginx proxy_read_timeout is 60s with no WebSocket-specific override",
      "severity": "high"
    }
  ],
  "continuation_id": "prev-thinkdeep-id"
}
```

### Final step triggering expert validation

```json
{
  "step": "Confirming fix approach: add proxy_read_timeout override and WebSocket keepalive",
  "step_number": 3,
  "total_steps": 3,
  "next_step_required": false,
  "findings": "Root cause confirmed: nginx 60s proxy_read_timeout. Fix requires both nginx config change and application-level WebSocket ping/pong keepalive at 30s intervals.",
  "confidence": "almost_certain",
  "relevant_files": ["infra/nginx/production.conf", "src/server/websocket.ts"],
  "relevant_context": ["WebSocketServer.handleUpgrade", "nginx proxy_read_timeout directive"],
  "continuation_id": "prev-thinkdeep-id"
}
```

### Disabling expert validation

```json
{
  "step": "Final assessment of the caching layer architecture",
  "step_number": 2,
  "total_steps": 2,
  "next_step_required": false,
  "findings": "The caching layer is well-structured with clear invalidation paths.",
  "confidence": "high",
  "use_assistant_model": false
}
```

## Best Practices

- **Start with a clear hypothesis** -- even a rough theory gives the investigation direction. You can revise it as evidence comes in.
- **Be honest about confidence** -- start at `exploring` and let it grow naturally. Jumping to `certain` too early masks uncertainty.
- **Use `problem_context` on the first step** -- give full background upfront so every subsequent step has context.
- **Track files systematically** -- use `files_checked` for everything you looked at and `relevant_files` for what actually mattered. This helps the expert validator.
- **Structure issues properly** -- use `issues_found` with severity levels rather than burying problems in free-text findings.
- **Don't pad steps** -- if you can answer in 2 steps, set `total_steps: 2`. The tool supports revising the total, but don't create busywork steps.
- **Let the expert validate** -- keep `use_assistant_model: true` (the default) for important investigations. The independent review catches blind spots.
- **Use continuation for long investigations** -- if you need to pause and resume, pass the `continuation_id` to maintain investigation context.

## When to Use vs Other Tools

| Scenario | Use | Why |
|----------|-----|-----|
| Quick question or brainstorm | **chat** | No need for structured investigation |
| Deep multi-step analysis | **thinkdeep** | Structured workflow with expert validation |
| Understanding code structure | **analyze** | Purpose-built for codebase analysis |
| Debugging a specific error | **debug** | Specialized error tracing workflow |
| Architectural decision | **thinkdeep** | Complex tradeoff analysis benefits from structured steps |
| Security investigation | **secaudit** | Dedicated security-focused analysis |
| Simple code explanation | **chat** | Single-pass is faster for straightforward questions |

ThinkDeep is your tool for problems that resist simple answers. Use it when you need to build a case step by step, test hypotheses against evidence, and get independent expert validation of your conclusions.
