import type { BabConfig } from "../config";
import { generateSkillContent, STATIC_TOOL_NAMES } from "../skills/generator";
import { regenerateSkills } from "../skills/index";
import { CommandError } from "./errors";
import { type WritableLike, writeLine } from "./shared";

interface OnboardCommandContext {
  config: BabConfig;
  stderr: WritableLike;
  stdout: WritableLike;
}

function normalizeCommandArgs(args: string[]): {
  agent?: string;
} {
  let agent: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const argument = args[i];

    if (argument === "--agent") {
      const nextArg = args[i + 1];

      if (!nextArg || nextArg.startsWith("--")) {
        throw new CommandError(
          "--agent requires a value (e.g. --agent claude)",
        );
      }

      agent = nextArg;
      i++;
      continue;
    }

    if (argument?.startsWith("--")) {
      throw new CommandError(`Unknown option for onboard: ${argument}`);
    }
  }

  return { agent };
}

export async function runOnboardCommand(
  args: string[],
  context: OnboardCommandContext,
): Promise<number> {
  const { agent } = normalizeCommandArgs(args);

  const result = await regenerateSkills(
    () => generateSkillContent(context.config),
    {
      force: true,
      agent,
      stderr: context.stderr,
    },
  );

  if (result.agentsUpdated.length === 0 && result.skipped.length === 0) {
    writeLine(context.stdout, "No supported agents detected.");
    return 0;
  }

  if (result.agentsUpdated.length > 0) {
    writeLine(
      context.stdout,
      `Skills generated for: ${result.agentsUpdated.join(", ")}`,
    );
  }

  if (result.skipped.length > 0) {
    writeLine(context.stdout, `Skipped: ${result.skipped.join(", ")}`);
  }

  writeLine(context.stdout, `Tools: ${STATIC_TOOL_NAMES.length}`);

  return 0;
}
