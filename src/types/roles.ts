import { z } from "zod/v4";

export const builtInRoleNames = [
  "default",
  "planner",
  "codereviewer",
  "coding",
] as const;

export const BuiltInRoleNameSchema = z.enum(builtInRoleNames);

export const RoleArgumentSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
]);

export const RoleDefinitionSchema = z.object({
  name: z.string().min(1, "name must not be empty"),
  description: z.string().min(1).optional(),
  prompt_file: z.string().min(1).optional(),
  inherits: BuiltInRoleNameSchema.optional(),
  args: z.record(z.string(), RoleArgumentSchema).default({}),
});

export type BuiltInRoleName = z.infer<typeof BuiltInRoleNameSchema>;
export type RoleDefinition = z.infer<typeof RoleDefinitionSchema>;
