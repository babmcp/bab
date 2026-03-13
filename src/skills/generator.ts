import {
  type CommandPluginRecord,
  discoverBundledPluginRecords,
  discoverInstalledPluginRecords,
} from "../commands/shared";
import type { BabConfig } from "../config";
import type { PluginRole } from "../types";
import { VERSION } from "../version";

import type { SkillContent } from "./index";

function sanitizeManifestText(value: string): string {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\r?\n/g, " ");
}

function mdCell(value: string): string {
  return sanitizeManifestText(value).replace(/\|/g, "\\|");
}

interface ToolCatalogEntry {
  name: string;
  description: string;
  whenToUse: string;
}

const TOOL_CATALOG: ToolCatalogEntry[] = [
  {
    name: "chat",
    description:
      "General chat and collaborative thinking partner for brainstorming and development discussion.",
    whenToUse:
      "Brainstorming ideas, getting second opinions, exploring concepts, asking questions.",
  },
  {
    name: "thinkdeep",
    description:
      "Multi-stage investigation and reasoning for complex problem analysis.",
    whenToUse:
      "Architecture decisions, complex bugs, performance challenges, security analysis requiring deep reasoning.",
  },
  {
    name: "codereview",
    description: "Systematic step-by-step code review with expert validation.",
    whenToUse:
      "Comprehensive code review covering quality, security, performance, and architecture.",
  },
  {
    name: "planner",
    description:
      "Interactive sequential planning with revision and branching capabilities.",
    whenToUse:
      "Complex project planning, system design, migration strategies, architectural decisions.",
  },
  {
    name: "consensus",
    description: "Multi-model consensus through structured debate.",
    whenToUse:
      "Complex decisions, architectural choices, feature proposals, technology evaluations needing multiple perspectives.",
  },
  {
    name: "debug",
    description: "Systematic debugging and root cause analysis.",
    whenToUse:
      "Complex bugs, mysterious errors, performance issues, race conditions, memory leaks.",
  },
  {
    name: "analyze",
    description: "Comprehensive code analysis with systematic investigation.",
    whenToUse:
      "Architecture, performance, maintainability, and pattern analysis.",
  },
  {
    name: "refactor",
    description:
      "Code refactoring opportunity analysis with systematic investigation.",
    whenToUse:
      "Code smell detection, decomposition planning, modernization, maintainability improvements.",
  },
  {
    name: "testgen",
    description: "Comprehensive test suite generation with edge case coverage.",
    whenToUse:
      "Generating tests for specific functions, classes, or modules with framework-specific output.",
  },
  {
    name: "secaudit",
    description:
      "Comprehensive security audit with systematic vulnerability assessment.",
    whenToUse:
      "OWASP Top 10 analysis, compliance evaluation, threat modeling, security architecture review.",
  },
  {
    name: "docgen",
    description: "Code documentation generation with complexity analysis.",
    whenToUse:
      "Documentation generation, code analysis, complexity assessment, API documentation.",
  },
  {
    name: "tracer",
    description:
      "Systematic code tracing for execution flow or dependency mapping.",
    whenToUse:
      "Method execution analysis, call chain tracing, dependency mapping, architectural understanding.",
  },
  {
    name: "precommit",
    description:
      "Git change validation and repository state analysis before committing.",
    whenToUse:
      "Multi-repository validation, security review, change impact assessment, completeness verification.",
  },
  {
    name: "challenge",
    description: "Prevents reflexive agreement by forcing critical thinking.",
    whenToUse:
      "When a statement is challenged or questioned, sanity-checking contentious claims.",
  },
  {
    name: "delegate",
    description:
      "Run a prompt through a configured delegate CLI plugin (Claude Code, Codex, OpenCode, Copilot).",
    whenToUse:
      "Delegating coding tasks, running prompts through external CLI agents, parallel work.",
  },
  {
    name: "list_models",
    description: "List models available from configured AI providers.",
    whenToUse: "Checking available models before selecting one for a task.",
  },
  {
    name: "version",
    description: "Return the current Bab and runtime version information.",
    whenToUse: "Checking bab version or runtime details.",
  },
];

export const STATIC_TOOL_NAMES: string[] = TOOL_CATALOG.map((t) => t.name);

function getRoleDescription(role: PluginRole): {
  name: string;
  description: string;
} {
  if (typeof role === "string") {
    return { name: role, description: "" };
  }

  return {
    name: role.name,
    description: role.description ?? "",
  };
}

function generateSkillMd(pluginRecords: CommandPluginRecord[]): string {
  const timestamp = new Date().toISOString();

  const toolRows = TOOL_CATALOG.map(
    (t) =>
      `| \`${t.name}\` | ${mdCell(t.description)} | ${mdCell(t.whenToUse)} |`,
  ).join("\n");

  const pluginRows =
    pluginRecords.length > 0
      ? pluginRecords
          .map((p) => {
            const roles = p.manifest.roles
              .map((r) => mdCell(getRoleDescription(r).name))
              .join(", ");
            return `| \`${p.manifest.id}\` | ${mdCell(p.manifest.name)} | \`${p.manifest.command}\` | ${roles} |`;
          })
          .join("\n")
      : "| — | No plugins installed | — | — |";

  return `---
name: bab
description: Bab MCP server tools for AI-assisted development. Use for code analysis, debugging, code review, planning, multi-model consensus, security audits, test generation, documentation, and delegating tasks to CLI agents (Claude Code, Codex, OpenCode, Copilot). Activate when working on complex coding tasks that benefit from structured workflows or second opinions.
user-invocable: false
metadata:
  author: bab
  version: "${VERSION}"
  generated-at: "${timestamp}"
---

<!-- Auto-generated by bab v${VERSION} — do not edit manually -->
<!-- Regenerate with: bab onboard -->

# Bab MCP Tools

| Tool | Description | When to use |
|------|-------------|-------------|
${toolRows}

For detailed tool reference, see [references/tools.md](references/tools.md).

# Delegate Plugins

| Plugin ID | Name | CLI Command | Roles |
|-----------|------|-------------|-------|
${pluginRows}

For plugin details and usage examples, see [references/delegate-plugins.md](references/delegate-plugins.md).
`;
}

function generateToolsReference(): string {
  const sections = TOOL_CATALOG.map(
    (t) => `## \`${t.name}\`

${t.description}

**When to use:** ${t.whenToUse}

**Example:**
\`\`\`
${t.name}(${getExampleArgs(t.name)})
\`\`\`
`,
  ).join("\n");

  return `# Bab MCP Tools Reference

${sections}`;
}

function getExampleArgs(toolName: string): string {
  switch (toolName) {
    case "chat":
      return 'prompt: "What are the tradeoffs of using Redis vs Memcached for session storage?"';
    case "thinkdeep":
      return 'findings: "The auth module has circular dependencies", step: "Analyze dependency graph", step_number: 1, total_steps: 3, next_step_required: true';
    case "codereview":
      return 'findings: "Reviewing authentication middleware", step: "Check input validation", step_number: 1, total_steps: 4, next_step_required: true';
    case "planner":
      return 'findings: "Need to migrate from REST to GraphQL", step: "Identify affected endpoints", step_number: 1, total_steps: 5, next_step_required: true';
    case "consensus":
      return 'findings: "Should we use microservices or monolith?", models: [{model: "claude-sonnet-4-5-20250514"}, {model: "gpt-4o"}], step: "Gather perspectives", step_number: 1, total_steps: 3, next_step_required: true';
    case "debug":
      return 'findings: "API returns 500 on POST /users", step: "Check error logs", step_number: 1, total_steps: 4, next_step_required: true';
    case "analyze":
      return 'findings: "Analyzing src/auth/ module architecture", step: "Map dependencies", step_number: 1, total_steps: 3, next_step_required: true';
    case "refactor":
      return 'findings: "Large function with multiple responsibilities", step: "Identify extraction points", step_number: 1, total_steps: 3, next_step_required: true';
    case "testgen":
      return 'findings: "Generate tests for UserService.createUser()", step: "Analyze code paths", step_number: 1, total_steps: 3, next_step_required: true';
    case "secaudit":
      return 'findings: "Auditing authentication endpoints", step: "Check for injection vulnerabilities", step_number: 1, total_steps: 4, next_step_required: true';
    case "docgen":
      return 'findings: "Documenting the API module", step: "Analyze exports", step_number: 1, total_steps: 3, next_step_required: true, use_assistant_model: false, comments_on_complex_logic: true, document_complexity: true, document_flow: true, num_files_documented: 0, total_files_to_document: 5, update_existing: true';
    case "tracer":
      return 'findings: "Tracing request handling flow", target_description: "HTTP request lifecycle in src/server.ts", trace_mode: "precision", step: "Entry point analysis", step_number: 1, total_steps: 3, next_step_required: true, use_assistant_model: false';
    case "precommit":
      return 'findings: "Validating staged changes", step: "Check for secrets", step_number: 1, total_steps: 3, next_step_required: true';
    case "challenge":
      return 'prompt: "Are you sure that approach handles concurrent access correctly?"';
    case "delegate":
      return 'cli_name: "claude", prompt: "Implement the UserService.delete() method with soft-delete support", role: "coding"';
    case "list_models":
      return "";
    case "version":
      return "";
    default:
      return "...";
  }
}

function generateDelegatePluginsReference(
  pluginRecords: CommandPluginRecord[],
): string {
  if (pluginRecords.length === 0) {
    return `# Delegate Plugins Reference

No delegate plugins are currently installed.

Install plugins with:
\`\`\`bash
bab add <source>
\`\`\`

See \`docs/plugin-authoring.md\` for details.
`;
  }

  const sections = pluginRecords
    .map((p) => {
      const roles = p.manifest.roles.map((r) => {
        const { name, description } = getRoleDescription(r);
        return `- **\`${sanitizeManifestText(name)}\`**: ${sanitizeManifestText(description) || "No description"}`;
      });

      const caps = p.manifest.capabilities;
      const capsList = [
        `Images: ${caps?.supports_images ? "yes" : "no"}`,
        `Streaming: ${caps?.supports_streaming ? "yes" : "no"}`,
        `Working directory: ${caps?.supports_working_directory ? "yes" : "no"}`,
        `Output format: ${sanitizeManifestText(caps?.output_format ?? "unknown")}`,
      ];

      return `## \`${sanitizeManifestText(p.manifest.id)}\` — ${sanitizeManifestText(p.manifest.name)}

**CLI command:** \`${sanitizeManifestText(p.manifest.command)}\`
**Source:** ${p.sourceType}${p.installMetadata ? ` (${sanitizeManifestText(p.installMetadata.source_original)})` : ""}

### Roles

${roles.join("\n")}

### Capabilities

${capsList.map((c) => `- ${c}`).join("\n")}

### Example usage

\`\`\`
delegate(cli_name: "${p.manifest.id}", prompt: "Your task description here", role: "default")
\`\`\`
`;
    })
    .join("\n");

  return `# Delegate Plugins Reference

${sections}

## Installing plugins

\`\`\`bash
bab add <source>       # Install from git repo
bab list               # List all plugins
bab remove <plugin-id> # Remove an installed plugin
\`\`\`

See \`docs/plugin-authoring.md\` for authoring your own plugins.
`;
}

export interface SkillGenerationResult {
  content: SkillContent;
  toolNames: string[];
  pluginIds: string[];
}

export async function generateSkillContent(
  config: BabConfig,
): Promise<SkillGenerationResult> {
  const [bundled, installed] = await Promise.all([
    discoverBundledPluginRecords(),
    discoverInstalledPluginRecords(config.paths),
  ]);

  const allPlugins = [...bundled, ...installed].sort((a, b) =>
    a.manifest.id.localeCompare(b.manifest.id),
  );

  return {
    content: {
      skillMd: generateSkillMd(allPlugins),
      toolsReference: generateToolsReference(),
      delegatePluginsReference: generateDelegatePluginsReference(allPlugins),
    },
    toolNames: STATIC_TOOL_NAMES,
    pluginIds: allPlugins.map((p) => p.manifest.id),
  };
}
