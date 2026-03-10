export class CommandError extends Error {
  readonly exitCode: number;
  readonly helpText?: string;

  constructor(
    message: string,
    options: { exitCode?: number; helpText?: string } = {},
  ) {
    super(message);
    this.name = "CommandError";
    this.exitCode = options.exitCode ?? 1;
    this.helpText = options.helpText;
  }
}
