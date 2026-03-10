---
title: Consensus
layout: default
parent: Tool Reference
nav_order: 7
---

# Consensus Tool - Multi-Model Consensus Through Structured Debate

**Gather diverse perspectives from multiple AI models to reach informed decisions through structured debate**

The `consensus` tool orchestrates multiple AI models with assigned stances to provide diverse perspectives on proposals, enabling structured decision-making through for/against/neutral analysis and synthesized recommendations.

## Example Prompts

**For/Against Debate:**
```
Use bab consensus with flash taking a "for" stance and pro being "against" to evaluate whether
we should migrate from REST to GraphQL for our API
```

**Multi-Model Technical Decision:**
```
Get consensus from o3, flash, and pro on our new authentication architecture. Have o3 focus on
security implications, flash on implementation speed, and pro stay neutral for overall assessment
```

**Architecture Evaluation:**
```
Use consensus with gemini supporting microservices and grok opposing to debate whether we should
decompose our monolith, include the current architecture diagram
```

**Technology Tradeoff:**
```
I need consensus from three models on whether to adopt Bun over Node for our backend services.
Have one model argue for, one against, and one neutral
```

## How It Works

The consensus tool queries multiple AI models sequentially, building context as it goes:

1. **Define the proposal**: Describe the decision or technical question to evaluate
2. **Assign stances**: Each model takes a specific viewpoint (for, against, or neutral)
3. **Sequential consultation**: Models are queried one at a time; each sees all prior model responses
4. **Synthesize results**: All perspectives are combined into a comprehensive recommendation
5. **Multi-step support**: Complex evaluations can span multiple steps using `step_number` and `total_steps`

## Key Features

- **Stance steering**: Assign specific perspectives (for/against/neutral) to each model
- **Custom stance prompts**: Provide specific instructions for how each model should approach the analysis
- **Sequential context building**: Each model sees all previous model responses for richer debate
- **Multi-step evaluation**: Break complex decisions into numbered steps for thorough analysis
- **File context support**: Include relevant source files for informed decision-making
- **Image support**: Analyze architectural diagrams, UI mockups, or design documents
- **Conversation continuation**: Build on previous consensus analysis with additional rounds via `continuation_id`
- **Configurable temperature**: Control response creativity and consistency

## Tool Parameters

- `step` (string, required): The proposal or decision to evaluate
- `findings` (string, required): Independent findings or context to inform the debate
- `models` (object[], required, min 2): Model configurations, each with:
  - `model` (string): Model identifier
  - `stance` ("for" | "against" | "neutral", optional): Perspective to take
  - `stance_prompt` (string, optional): Custom instructions for the model's analysis approach
- `step_number` (number, required): Current step number (>= 1)
- `total_steps` (number, required): Total number of planned steps (>= 1)
- `next_step_required` (boolean, required): Whether another step follows this one
- `continuation_id` (string, optional): Continue a previous consensus discussion
- `current_model_index` (number, optional, default 0): Which model to consult next in the sequence
- `model_responses` (object[], optional): Prior model responses from earlier in the sequence, each with:
  - `model`: Model identifier
  - `provider`: Provider name
  - `response`: The model's response text
  - `stance`: The stance the model took
- `temperature` (number, optional): Response creativity, 0-1
- `relevant_files` (string[], optional): Absolute paths to files for additional context
- `images` (string[], optional): Absolute paths to images for visual context

## Usage Examples

**Architecture Decision:**
```
"Get consensus from pro and o3 on whether to use microservices vs monolith for our e-commerce platform"
```

**Technology Migration:**
```
"Use consensus with flash supporting and pro opposing to evaluate migrating from MySQL to PostgreSQL"
```

**Design Tradeoff:**
```
"Have three models debate whether we should use server-side rendering or client-side rendering for our dashboard"
```

**With File Context:**
```
"Use consensus to evaluate our current caching strategy - include src/cache/ and have models debate whether to switch to Redis"
```

## Best Practices

- **Use at least two models**: The tool requires a minimum of two models for meaningful debate
- **Balance stances**: Mix supportive and critical perspectives for thorough analysis
- **Provide detailed findings**: The `findings` parameter gives models essential context for informed opinions
- **Use custom stance prompts**: Guide models to focus on specific aspects (security, performance, cost)
- **Include relevant files**: Provide code or documentation so models can ground their analysis in reality
- **Use multi-step for complex decisions**: Break large evaluations into sequential steps
- **Build on discussions**: Use `continuation_id` for follow-up rounds of analysis

## When to Use Consensus vs Other Tools

- **Use `consensus`** for: Multi-perspective analysis, structured debates, major architectural decisions, technology evaluations, complex tradeoffs requiring diverse viewpoints
- **Use `chat`** for: Single-model conversations, brainstorming, quick questions
- **Use `thinkdeep`** for: Single-model deep analysis and extended reasoning on a specific topic
- **Use `challenge`** for: Critical thinking and stress-testing a specific idea or assumption
