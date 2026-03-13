---
title: Analyze
layout: default
parent: Tool Reference
nav_order: 4
---

# Analyze Tool - Smart File Analysis

**General-purpose code understanding and exploration through workflow-driven investigation**

The `analyze` tool provides comprehensive code analysis and understanding capabilities, helping you explore codebases, understand architecture, and identify patterns across files and directories. This workflow tool guides Claude through systematic investigation of code structure, patterns, and architectural decisions across multiple steps, gathering comprehensive insights before providing expert analysis.

## Example Prompts

**Basic Usage:**
```
Use gemini to analyze main.py to understand how it works
```
```
Get gemini to do an architecture analysis of the src/ directory
```

You can also run analysis without an external model (**recommended for quick checks**).
```
Analyze the auth module without using external model, focus on the session handling flow
```

## How It Works

The analyze tool implements a **structured workflow** for thorough code understanding:

**Investigation Phase (Claude-Led):**
1. **Step 1**: Claude describes the analysis plan and begins examining code structure
2. **Step 2+**: Claude investigates architecture, patterns, dependencies, and design decisions
3. **Throughout**: Claude tracks findings, relevant files, insights, and confidence levels
4. **Completion**: Once analysis is comprehensive, Claude signals completion

**Expert Analysis Phase:**
After Claude completes the investigation (unless confidence is **certain**):
- Complete analysis summary with all findings
- Architectural insights and pattern identification
- Strategic improvement recommendations
- Final expert assessment based on investigation

This workflow ensures methodical analysis before expert insights, resulting in deeper understanding and more valuable recommendations.

## Key Features

- **Analyzes single files or entire directories** with intelligent file filtering
- **Supports 5 specialized analysis types**: architecture, performance, security, quality, general
- **3 output formats**: summary, detailed, actionable
- **Multi-step systematic investigation** with evidence collection and confidence tracking
- **Expert validation phase** with AI model analysis of gathered findings
- **Cross-file relationship mapping**: Understand dependencies and interactions
- **Architecture visualization**: Describe system structure and component relationships
- **Image support**: Analyze architecture diagrams, UML charts, flowcharts
- **Large codebase support**: Handle massive codebases with high-context models
- **Conversation threading**: Continue analysis across multiple sessions

## Tool Parameters

**Workflow Investigation Parameters (used during step-by-step process):**
- `step`: Current investigation step description (required)
- `step_number`: Current step number in analysis sequence, >= 1 (required)
- `total_steps`: Estimated total investigation steps, >= 1 (required, adjustable)
- `next_step_required`: Whether another investigation step is needed (required)
- `findings`: Discoveries and insights collected in this step (required)
- `files_checked`: All files examined during investigation
- `relevant_files`: Files directly relevant to the analysis
- `relevant_context`: Methods/functions/classes central to analysis findings
- `issues_found`: Issues or concerns identified (array of `{description, severity}` where severity is critical/high/medium/low)
- `confidence`: Confidence level in analysis completeness (exploring/low/medium/high/very_high/almost_certain/certain)
- `continuation_id`: Continue previous analysis sessions
- `images`: Visual references for analysis context

**Analysis Configuration:**
- `model`: AI model to use for expert analysis phase (default: server default)
- `analysis_type`: architecture|performance|security|quality|general (default: general)
- `output_format`: summary|detailed|actionable (default: detailed)
- `temperature`: Temperature for analysis, 0-1
- `thinking_mode`: minimal|low|medium|high|max (controls reasoning depth)
- `use_assistant_model`: Whether to use expert analysis phase (default: true, set to false to use Claude only)

## Analysis Types

**General Analysis (default):**
- Overall code structure and organization
- Key components and their responsibilities
- Data flow and control flow
- Design patterns and architectural decisions

**Architecture Analysis:**
- System-level design and component relationships
- Module dependencies and coupling
- Separation of concerns and layering
- Scalability and maintainability considerations

**Performance Analysis:**
- Potential bottlenecks and optimization opportunities
- Algorithmic complexity assessment
- Memory usage patterns
- I/O and database interaction efficiency

**Security Analysis:**
- Security patterns and potential vulnerabilities
- Input validation and sanitization
- Authentication and authorization mechanisms
- Data protection and privacy considerations

**Quality Analysis:**
- Code quality metrics and maintainability
- Testing coverage and patterns
- Documentation completeness
- Best practices adherence

## Usage Examples

**Single File Analysis:**
```
Analyze user_controller.py to understand the authentication flow with gemini
```

**Directory Architecture Analysis:**
```
Use pro to analyze the src/ directory architecture and identify the main components
```

**Performance-Focused Analysis:**
```
Analyze backend/api/ for performance bottlenecks, focus on database queries
```

**Security Assessment:**
```
Use gemini to analyze the authentication module for security patterns and potential issues
```

**Visual + Code Analysis:**
```
Analyze this system architecture diagram along with the src/core/ implementation to understand the data flow
```

**Large Codebase Analysis:**
```
Analyze the entire project structure with gemini to understand how all components work together
```

## Output Formats

**Summary Format:**
- High-level overview with key findings
- Main components and their purposes
- Critical insights and recommendations

**Detailed Format (default):**
- Comprehensive analysis with specific examples
- Code snippets and file references
- Detailed explanations of patterns and structures

**Actionable Format:**
- Specific recommendations and next steps
- Prioritized list of improvements
- Implementation guidance and examples

## Best Practices

- **Be specific about goals**: Clearly state what you want to understand or discover
- **Use appropriate analysis types**: Choose the type that matches your needs
- **Include related files**: Analyze modules together for better context understanding
- **Leverage large context models**: Use high-context models for comprehensive codebase analysis
- **Combine with visual context**: Include architecture diagrams or documentation
- **Use continuation**: Build on previous analysis for deeper understanding

## When to Use Analyze vs Other Tools

- **Use `analyze`** for: Understanding code structure, exploring unfamiliar codebases, architecture assessment
- **Use `chat`** for: Open-ended discussions about code without structured analysis
- **Use `codereview`** for: Finding bugs and security issues with actionable fixes
- **Use `thinkdeep`** for: Deeper reasoning about complex design decisions or trade-offs
- **Use `debug`** for: Diagnosing specific runtime errors or performance problems
