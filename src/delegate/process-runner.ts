import { type ChildProcessWithoutNullStreams, spawn } from "node:child_process";

const MAX_CAPTURE_BYTES = 1_000_000;

export interface ProcessRunOptions {
  args?: string[];
  command: string;
  cwd?: string;
  env?: Record<string, string>;
  input?: string;
  killGraceMs?: number;
  timeoutMs?: number;
}

export interface ProcessRunResult {
  durationMs: number;
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  stderr: string;
  stdout: string;
  timedOut: boolean;
}

export class ProcessRunner {
  private activeProcesses = new Map<string, ChildProcessWithoutNullStreams>();

  async run(
    runId: string,
    options: ProcessRunOptions,
  ): Promise<ProcessRunResult> {
    const {
      args = [],
      command,
      cwd,
      env,
      input,
      killGraceMs = 250,
      timeoutMs = 3 * 60 * 60 * 1_000,
    } = options;

    if (this.activeProcesses.has(runId)) {
      throw new Error(`Process already active for run ${runId}`);
    }

    const startedAt = Date.now();
    let timedOut = false;
    let timeoutHandle: Timer | undefined;

    return new Promise<ProcessRunResult>((resolve, reject) => {
      const child = spawn(command, args, {
        cwd,
        env: env ?? { ...process.env },
        stdio: "pipe",
      });

      this.activeProcesses.set(runId, child);

      let stdout = "";
      let stderr = "";

      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");

      child.stdout.on("data", (chunk: string) => {
        stdout += chunk;
        if (stdout.length > MAX_CAPTURE_BYTES) {
          stdout = stdout.slice(-MAX_CAPTURE_BYTES);
        }
      });
      child.stderr.on("data", (chunk: string) => {
        stderr += chunk;
        if (stderr.length > MAX_CAPTURE_BYTES) {
          stderr = stderr.slice(-MAX_CAPTURE_BYTES);
        }
      });

      child.on("error", (error) => {
        this.clearState(runId, timeoutHandle);
        reject(error);
      });

      child.on("close", (exitCode, signal) => {
        this.clearState(runId, timeoutHandle);
        resolve({
          durationMs: Date.now() - startedAt,
          exitCode,
          signal,
          stderr,
          stdout,
          timedOut,
        });
      });

      if (typeof input === "string") {
        child.stdin.write(input);
      }

      child.stdin.end();

      timeoutHandle = setTimeout(() => {
        timedOut = true;

        if (!child.killed) {
          child.kill("SIGTERM");
        }

        setTimeout(() => {
          if (!child.killed) {
            child.kill("SIGKILL");
          }
        }, killGraceMs).unref();
      }, timeoutMs);

      timeoutHandle.unref();
    });
  }

  async cancel(
    runId?: string,
    signal: NodeJS.Signals = "SIGTERM",
  ): Promise<void> {
    if (runId) {
      const child = this.activeProcesses.get(runId);

      if (!child) {
        return;
      }

      if (child.exitCode !== null) {
        this.activeProcesses.delete(runId);
        return;
      }

      await new Promise<void>((resolve) => {
        child.once("close", () => resolve());
        child.kill(signal);
      });
      return;
    }

    await Promise.all(
      [...this.activeProcesses.keys()].map((id) => this.cancel(id, signal)),
    );
  }

  private clearState(runId: string, timeoutHandle?: Timer): void {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }

    this.activeProcesses.delete(runId);
  }
}
