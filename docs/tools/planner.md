---
title: Planner
layout: default
parent: Tool Reference
nav_order: 6
---

# Planner Tool - Interactive Step-by-Step Planning

**Break down complex projects into manageable, structured plans through incremental investigation**

The `planner` tool helps you break down complex ideas, problems, or projects into multiple manageable steps. Perfect for system design, migration strategies, architectural planning, and feature development with branching and revision capabilities. This workflow tool supports step revision, branching to explore alternative approaches, and optional expert validation.

## How It Works

The planner tool enables step-by-step thinking with incremental plan building:

1. **Start with step 1**: Describe the task or problem to plan
2. **Continue building**: Add subsequent steps, building the plan piece by piece
3. **Revise when needed**: Update earlier decisions as new insights emerge
4. **Branch alternatives**: Explore different approaches (approach-A, approach-B) when multiple options exist
5. **Expand dynamically**: Add more steps than originally estimated as complexity becomes clear
6. **Continue across sessions**: Resume planning later with full context

Expert validation is **off by default** -- the planner is self-contained. Enable it when you want an external model to review the plan.

## Example Prompts

```
Use bab's planner to show me how to add real-time notifications to our mobile app
```

```
Using the planner tool, plan the architecture for a new real-time chat system with 100k concurrent users
```

```
Create a plan using bab for migrating our React app from JavaScript to TypeScript
```

#### Pro Tip: Branching and Consensus

You can ask the planner to explore multiple approaches, then use the `consensus` tool to decide which one to pursue:

```
Create two separate sub-tasks: in one, use planner to plan approach-A (microservices) for our
new backend. In the other, use planner to plan approach-B (monolith). Once done, start a consensus
to give me the final verdict on which one to implement first.
```

## Key Features

- **Step-by-step breakdown**: Build plans incrementally with full context awareness
- **Branching support**: Explore alternative approaches (approach-A, approach-B) from any step
- **Step revision**: Revise earlier decisions when new insights emerge without starting over
- **Dynamic step count**: Expand beyond the initial estimate as complexity becomes clear
- **Multi-session continuation**: Resume planning across sessions with context
- **Expert validation**: Optionally enable external model review of the plan
- **Visual presentation**: ASCII charts, diagrams, and structured formatting

## Tool Parameters

**Workflow Parameters (required each step):**
- `step` (string, required): Current investigation step description
- `step_number` (number, required): Current step number (>= 1)
- `total_steps` (number, required): Estimated total investigation steps (>= 1)
- `next_step_required` (boolean, required): Whether another investigation step is needed
- `findings` (string, optional, default: ""): Planning findings and discoveries in this step

**Confidence and Continuation:**
- `confidence` (enum, optional): exploring | low | medium | high | very_high | almost_certain | certain
- `continuation_id` (string, optional): Continue a previous planning session

**Model Configuration:**
- `model` (string, optional): Model to use for expert validation
- `temperature` (number, optional): Temperature for consistency (0-1)
- `thinking_mode` (enum, optional): minimal | low | medium | high | max
- `use_assistant_model` (boolean, optional, default: false): Expert validation OFF by default

**File Tracking:**
- `files_checked` (string[], optional): All files examined during investigation
- `relevant_files` (string[], optional): Files directly relevant to the plan
- `relevant_context` (string[], optional): Methods/functions/classes central to findings

**Issue Tracking:**
- `issues_found` (object[], optional): Issues identified with `description` and `severity`
- `images` (string[], optional): Visual references for planning context

**Revision Parameters:**
- `is_step_revision` (boolean, optional): Whether this step revises a prior step
- `revises_step_number` (number, optional): Which step number is being revised

**Branching Parameters:**
- `is_branch_point` (boolean, optional): Whether this step starts a new branch
- `branch_id` (string, optional): Branch name (e.g., "approach-A", "approach-B")
- `branch_from_step` (number, optional): Which step number to branch from

**Dynamic Adjustment:**
- `more_steps_needed` (boolean, optional): Signal that more steps are needed than originally planned

## Usage Examples

**System Design:**
```
"Plan the architecture for a new event-driven microservices system"
```

**Migration Strategy:**
```
"Create a plan for migrating our database from MySQL to PostgreSQL with zero downtime"
```

**Feature Development:**
```
"Plan how to add end-to-end encryption to our messaging app"
```

**Architecture Decision:**
```
"Plan two approaches for our caching layer: approach-A with Redis, approach-B with Memcached"
```

**With Expert Validation:**
```
"Use planner with expert validation enabled to review my deployment strategy"
```

## Best Practices

- **Start broad, then narrow**: Begin with high-level strategy, then add implementation details
- **Include constraints**: Consider technical, organizational, and resource limitations
- **Plan for validation**: Include testing and verification steps
- **Think about dependencies**: Identify what needs to happen before each step
- **Use branching**: When multiple approaches are viable, explore them explicitly
- **Revise freely**: Update earlier steps as new information emerges rather than forcing consistency
- **Enable continuation**: Use continuation_id for multi-session planning
- **Keep expert validation off** for self-contained planning; enable it for important architectural decisions

## Continue With a New Tool

Like all other tools in bab, you can continue with a new tool using the output from a previous plan:

```
Continue with bab's consensus tool and find out what two models think of the plan
```

You can mix and match and take one output and feed it into another, continuing from where you left off using a different tool or model combination.

## When to Use Planner vs Other Tools

- **Use `planner`** for: Project planning, system design, migration strategies, architecture decisions
- **Use `thinkdeep`** for: Deep investigation and reasoning about a specific problem
- **Use `analyze`** for: Understanding existing code structure and patterns
- **Use `chat`** for: Quick discussion or brainstorming without structured steps
