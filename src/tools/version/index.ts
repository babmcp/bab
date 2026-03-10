import { platform } from "node:os";
import { z } from "zod/v4";

import type { RegisteredTool } from "../../server";
import { VERSION } from "../../version";

export function createVersionTool(): RegisteredTool {
  return {
    description: "Return the current Bab and runtime version information.",
    execute: async () => ({
      ok: true,
      value: {
        content: JSON.stringify({
          name: "bab",
          runtime: "bun",
          bun_version: Bun.version,
          os: platform(),
          version: VERSION,
        }),
        content_type: "json",
        metadata: {},
        status: "success",
      },
    }),
    inputSchema: z.object({}),
    name: "version",
  };
}
