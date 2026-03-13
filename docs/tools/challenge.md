---
title: Challenge
layout: default
parent: Tool Reference
nav_order: 15
---

# Challenge - Force Critical Thinking on Any Claim

**Prevents reflexive agreement by making Claude argue AGAINST a statement**

The `challenge` tool wraps a statement with instructions that force critical analysis instead of the dreaded "You're absolutely right!" response. No AI model is called — this is pure prompt-based redirection that makes Claude stop, think critically, and argue the opposing side before reaching a conclusion.

## Example Prompts

```
"challenge but do we even need all this extra caching because it'll just slow the app down?"
```

```
"challenge I don't think this approach solves my original complaint"
```

```
"challenge we should rewrite this module in Rust for performance"
```

```
"challenge microservices would be better than a monolith for this project"
```

## How It Works

1. You provide a statement or claim as the `prompt`
2. The tool wraps it with instructions that force critical evaluation
3. Claude is directed to argue AGAINST the statement rather than agree
4. The response includes honest analysis of whether the claim holds up

There is no model call, no continuation, no file analysis. This is the simplest tool in the toolkit — one parameter, one purpose.

## Key Features

- **No AI model call** — pure prompt-based critical thinking redirection
- **Single parameter** — just the statement to scrutinize
- **Automatic triggering** — Claude can detect when you critically question or disagree and invoke this tool automatically
- **Forces opposing argument** — Claude must argue AGAINST the statement before concluding
- **Shortest tool in the toolkit** — no workflow, no continuation, no files, no model selection

## Tool Parameters

- `prompt` (string, required) - The statement, claim, or approach to scrutinize

## Usage Examples

**Challenging a Technical Decision:**
```
"challenge we should use Redis for session storage instead of the database"
```
Forces evaluation of whether Redis actually adds value over database-backed sessions in your context.

**Questioning Architecture:**
```
"challenge splitting this into separate services will make the system more maintainable"
```
Critically examines whether the added complexity of service boundaries is justified.

**Sanity-Checking Assumptions:**
```
"challenge this function is the performance bottleneck"
```
Pushes back on the assumption and considers alternative explanations.

**Automatic Invocation:**

When you say something like "I disagree, we should just delete the entire caching layer" — Claude can detect the critical tone and automatically invoke `challenge` to avoid reflexive agreement.

## Best Practices

- **Use when you sense reflexive agreement** — if Claude just said "You're absolutely right!" without analysis, follow up with challenge
- **State the claim clearly** — the more specific the statement, the more targeted the critical analysis
- **Use for contentious decisions** — architectural choices, technology selections, refactoring approaches
- **Combine with evidence** — after getting the critical analysis, follow up with concrete code or data to settle the question
- **Don't overuse** — reserve for moments where you genuinely want pushback, not routine questions

## When to Use vs Other Tools

- **Use `challenge`** for: Forcing critical evaluation of a specific claim or decision
- **Use `consensus`** for: Getting multiple model perspectives on a complex question through structured debate
- **Use `thinkdeep`** for: Deep investigation and reasoning about a topic, not just pushback
- **Use `chat`** for: Open-ended discussion where you want collaborative thinking, not adversarial analysis
