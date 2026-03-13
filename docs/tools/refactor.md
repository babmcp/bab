---
title: Refactor
layout: default
parent: Tool Reference
nav_order: 9
---

# Refactor Tool - Intelligent Code Refactoring

**Comprehensive refactoring analysis with top-down decomposition strategy through workflow-driven investigation**

The `refactor` tool provides intelligent code refactoring recommendations with a focus on top-down decomposition and systematic code improvement. This workflow tool enforces systematic investigation of code smells, decomposition opportunities, and modernization possibilities across multiple steps, ensuring thorough analysis before providing expert refactoring recommendations with precise implementation guidance.

## Example Prompts

```
"Decompose my_crazy_big_class.m into smaller, maintainable modules using bab's refactor tool"
```

```
"Refactor the sync handler into clean extensions using bab refactor with decompose mode"
```

**Example of a powerful prompt** combining Claude's analysis with expert validation:
```
"First, think about how the authentication module works, find related classes and find
 any code smells, then using bab's refactor ask the assistant model to confirm your findings
 but ask it to find additional code smells and any other quick-wins and then fix these issues"
```

This results in Claude first performing its own expert analysis, encouraging it to think critically and identify links within the project code. The assistant model then reviews the same code with a hint -- preventing it from duplicating Claude's findings and encouraging it to explore other areas that Claude did not discover.

## How It Works

The refactor tool implements a **structured workflow** for systematic refactoring analysis:

**Investigation Phase (Claude-Led):**
1. **Step 1**: Claude describes the refactoring plan and begins analyzing code structure
2. **Step 2+**: Claude examines code smells, decomposition opportunities, and modernization possibilities
3. **Throughout**: Claude tracks findings, relevant files, refactoring opportunities, and confidence levels
4. **Completion**: Once investigation is thorough, Claude signals completion

**Expert Analysis Phase:**
After Claude completes the investigation (unless confidence is **complete**):
- Complete refactoring opportunity summary
- Prioritized recommendations by impact
- Precise implementation guidance with line numbers
- Final expert assessment for refactoring strategy

This workflow ensures methodical investigation before expert recommendations, resulting in more targeted and valuable refactoring plans.

## Key Features

- **Intelligent prioritization** - Refuses to work on low priority issues if code requires decomposition first; identifies poorly managed classes and files needing structural improvements before detail work
- **Top-down decomposition strategy** - Analyzes file, class, and function levels systematically
- **Four refactor types**: `codesmells` (detect anti-patterns), `decompose` (break down large components), `modernize` (update language features), `organization` (improve structure)
- **Precise line-number references** - Provides exact line numbers for Claude to implement changes
- **Style guide integration** - Uses existing project files as pattern references via `style_guide_examples`
- **Focus areas** - Target specific concerns like performance, readability, maintainability, or security
- **Hypothesis tracking** - Maintain a running theory about needed changes across steps
- **Conservative approach** - Careful dependency analysis to prevent breaking changes
- **Multi-file analysis** - Understands cross-file relationships and dependencies
- **Priority sequencing** - Recommends implementation order for refactoring changes
- **Image support** - Analyze code architecture diagrams and legacy system charts
- **Different confidence scale** - Uses exploring/incomplete/partial/complete (unlike other tools)

## Refactor Types (Progressive Priority System)

**1. `decompose` (CRITICAL PRIORITY)** - Context-aware decomposition with adaptive thresholds:

**AUTOMATIC decomposition** (CRITICAL severity - blocks all other refactoring):
- Files >15,000 LOC, Classes >3,000 LOC, Functions >500 LOC

**EVALUATE decomposition** (contextual severity - intelligent assessment):
- Files >5,000 LOC, Classes >1,000 LOC, Functions >150 LOC
- Only recommends if genuinely improves maintainability
- Respects legacy stability, domain complexity, performance constraints

**2. `codesmells`** - Applied only after decomposition is complete:
- Detect long methods, complex conditionals, duplicate code, magic numbers, poor naming

**3. `modernize`** - Applied only after decomposition is complete:
- Update to modern language features (async/await, modern syntax, etc.)

**4. `organization`** - Applied only after decomposition is complete:
- Improve logical grouping, separation of concerns, module structure

**Progressive Analysis:** The tool performs a top-down check (worse to bad to better) and refuses to work on lower-priority issues if critical decomposition is needed first.

## Tool Parameters

**Workflow Investigation Parameters (used during step-by-step process):**
- `step` (string, required): Current investigation step description
- `step_number` (number, required): Current step number in refactoring sequence
- `total_steps` (number, required): Estimated total investigation steps (adjustable)
- `next_step_required` (boolean, required): Whether another investigation step is needed
- `findings` (string, required): Code smells and refactoring opportunities discovered in this step
- `confidence` (enum, optional): Confidence level in analysis completeness -- `exploring`|`incomplete`|`partial`|`complete`
- `continuation_id` (string, optional): Thread continuation ID for multi-turn conversations
- `files_checked` (string[], optional): All files examined during investigation
- `relevant_files` (string[], optional): Files directly needing refactoring
- `relevant_context` (string[], optional): Methods/functions/classes requiring refactoring
- `issues_found` (object[], optional): Refactoring opportunities -- each with `description`, `severity`, and `type` (`codesmells`|`decompose`|`modernize`|`organization`)
- `images` (string[], optional): Architecture diagrams or visual references

**Initial Configuration (used in step 1):**
- `refactor_type` (enum, optional): `codesmells`|`decompose`|`modernize`|`organization` (default: `codesmells`)
- `focus_areas` (string[], optional): Specific areas to focus on (e.g., `"performance"`, `"readability"`, `"maintainability"`, `"security"`)
- `hypothesis` (string, optional): Current theory about needed changes and refactoring priorities
- `style_guide_examples` (string[], optional): Absolute paths to existing code files to use as style/pattern reference
- `model` (string, optional): Model to use for expert analysis phase
- `temperature` (number, optional): Temperature for analysis (0-1)
- `thinking_mode` (enum, optional): Thinking depth for analysis
- `use_assistant_model` (boolean, optional, default: true): Whether to use expert analysis phase; set to false for Claude-only workflow

## Usage Examples

**Decomposition Analysis:**
```
"Analyze UserController.java for decomposition opportunities - it's becoming unwieldy"
```

**Code Smell Detection:**
```
"Identify code smells in the authentication module using bab refactor"
```

**Modernization:**
```
"Modernize legacy_parser.py to use modern Python features following examples/modern_patterns.py as style guide"
```

**Organization Improvement:**
```
"Refactor src/utils/ for better organization, focus on maintainability and readability"
```

**Targeted Refactoring with Hypothesis:**
```
"Refactor the data layer -- I think the repository pattern is leaking into the service layer, focus on separation of concerns"
```

## Best Practices

- **Start with decomposition**: Address structural issues before cosmetic improvements
- **Provide clear context**: Explain the codebase purpose and constraints
- **Use appropriate refactor types**: Match the type to your primary concern
- **Include style examples**: Reference existing well-structured code in your project via `style_guide_examples`
- **Set focus areas**: Use `focus_areas` to target specific quality dimensions
- **Track hypotheses**: Use the `hypothesis` parameter to maintain a theory about needed changes
- **Focus on high-impact areas**: Target the most problematic or frequently modified code
- **Plan implementation order**: Follow the tool's sequencing recommendations
- **Consider test coverage**: Ensure adequate tests before major structural changes

## When to Use Refactor vs Other Tools

- **Use `refactor`** for: Structural improvements, decomposition, modernization, code organization
- **Use `codereview`** for: Finding bugs and quality issues with immediate fixes
- **Use `analyze`** for: Understanding code without making change recommendations
- **Use `precommit`** for: Validating changes before commit
