import { realpath } from "node:fs/promises";

export async function assertPathContainment(
  filePath: string,
  containerDirectory: string,
  label = "file",
): Promise<string> {
  const realContainer = await realpath(containerDirectory);
  const realFile = await realpath(filePath);

  if (realFile !== realContainer && !realFile.startsWith(`${realContainer}/`)) {
    throw new Error(
      `Refusing to load ${label} outside plugin directory: ${filePath}`,
    );
  }

  return realFile;
}
