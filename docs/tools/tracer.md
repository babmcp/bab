---
title: Tracer
layout: default
parent: Tool Reference
nav_order: 14
---

# Tracer - Multi-Step Code Flow and Dependency Tracing

**Workflow tool for systematic call-flow mapping and dependency analysis with optional expert validation**

The `tracer` tool performs structured, multi-step static code analysis. It traces execution flows and maps structural dependencies across a codebase, building findings incrementally across steps. Unlike single-shot analysis, tracer maintains state between steps through continuation, letting you follow complex call chains and dependency graphs methodically.

## Example Prompts

```
"Use bab tracer to trace how the authenticate() method flows through the middleware stack"
```

```
"Trace the dependency tree of the PaymentProcessor module — I need to understand what breaks if we refactor it"
```

```
"Use bab tracer in precision mode to follow the request lifecycle from route handler to database call"
```

```
"Map all dependencies of the PluginLoader class so we can plan the extraction"
```

## How It Works

1. You provide a `target_description` explaining WHAT to trace and WHY
2. The tool selects or you specify a `trace_mode` (precision or dependencies)
3. Analysis proceeds in numbered steps (`step_number` / `total_steps`)
4. Each step records `findings` (call flows, dependencies discovered)
5. `next_step_required` controls whether the workflow continues
6. Optionally, an expert model validates findings via `use_assistant_model`

The tool tracks which files have been checked and which are relevant, building a complete picture across multiple steps rather than trying to analyze everything at once.

## Key Features

- **Two analysis modes**: `precision` for execution flow tracing, `dependencies` for structural relationship mapping
- **Smart mode selection**: `ask` mode (default) lets the tool decide which mode fits your query
- **Multi-step workflow**: Builds findings incrementally with step tracking
- **Confidence tracking**: Reports confidence level from `exploring` through `certain`
- **File tracking**: Maintains lists of checked and relevant files across steps
- **Optional expert validation**: Route findings through an assistant model for a second opinion
- **Image support**: Analyze architecture diagrams, sequence diagrams, and visual references
- **Continuation support**: Resume interrupted traces via `continuation_id`

## Tool Parameters

- `target_description` (string, required) - What to trace and WHY — the more context, the better the analysis
- `step` (string, required) - Description of the current analysis step
- `step_number` (number, required) - Current step number in the workflow
- `total_steps` (number, required) - Expected total steps (can be revised as analysis unfolds)
- `next_step_required` (boolean, required) - Whether another step follows this one
- `findings` (string, required) - Call flows, dependencies, and observations found in this step
- `trace_mode` (enum, optional) - `ask` | `precision` | `dependencies` (default: `ask`)
- `confidence` (enum, optional) - `exploring` | `low` | `medium` | `high` | `very_high` | `almost_certain` | `certain`
- `files_checked` (string[], optional) - Files examined so far
- `relevant_files` (string[], optional) - Files that contain relevant code
- `relevant_context` (string[], optional) - Additional context snippets
- `continuation_id` (string, optional) - Resume a previous trace session
- `model` (string, optional) - Override the default model
- `temperature` (number, optional) - Control response randomness
- `thinking_mode` (string, optional) - Enable extended thinking
- `images` (string[], optional) - Absolute paths to architecture diagrams or visual references
- `use_assistant_model` (boolean, optional, default: false) - Route findings through an expert model for validation

## Usage Examples

**Precision Mode — Method Execution Tracing:**
```
"Use bab tracer in precision mode to trace how UserAuthManager.authenticate is called, what it calls, and where exceptions are caught"
```
Traces the method's call chain, branching logic, side effects, and return value handling.

**Dependencies Mode — Structural Mapping:**
```
"Use bab tracer in dependencies mode to map what PaymentProcessor depends on and what depends on it"
```
Maps bidirectional dependencies, inheritance, composition, and coupling strength.

**Ask Mode — Let the Tool Decide:**
```
"Use bab tracer to analyze the relationship between OrderService and InventoryManager"
```
The tool examines the query and picks the appropriate mode automatically.

**With Expert Validation:**
```
"Use bab tracer with expert validation to trace the database connection pooling lifecycle"
```
Performs the trace, then routes findings through an assistant model for a second opinion.

## Best Practices

- **Explain WHY in `target_description`**: "Trace X because we plan to refactor Y" gives better results than just "Trace X"
- **Start with `ask` mode** when unsure — the tool picks the right approach
- **Use `precision` for methods/functions** — execution flow, call chains, side effects
- **Use `dependencies` for classes/modules** — structural relationships, coupling, impact analysis
- **Keep steps focused**: Each step should examine one aspect rather than trying to cover everything
- **Track confidence honestly**: Start at `exploring` and increase as evidence accumulates
- **Enable expert validation** for critical architectural decisions where a second opinion matters

## When to Use vs Other Tools

- **Use `tracer`** for: Systematic call-flow tracing, dependency mapping, understanding how code connects across files
- **Use `analyze`** for: General-purpose code analysis without multi-step workflow
- **Use `debug`** for: Investigating specific runtime errors, stack traces, and failures
- **Use `docgen`** for: Generating documentation from code rather than tracing its behavior
- **Use `thinkdeep`** for: Deep reasoning about design decisions rather than code structure
