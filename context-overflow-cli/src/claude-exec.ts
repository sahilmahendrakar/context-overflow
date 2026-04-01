import { spawn, spawnSync } from "node:child_process";

export type ClaudeCliResult = {
  status: number;
  stdout: string;
  stderr: string;
  combined: string;
  enoent: boolean;
};

export function runClaudeCli(args: string[]): ClaudeCliResult {
  const r = spawnSync("claude", args, {
    encoding: "utf-8",
    maxBuffer: 10 * 1024 * 1024,
  });

  if (r.error) {
    const enoent = (r.error as NodeJS.ErrnoException).code === "ENOENT";
    return {
      status: 1,
      stdout: "",
      stderr: r.error.message,
      combined: r.error.message,
      enoent,
    };
  }

  const stdout = r.stdout ?? "";
  const stderr = r.stderr ?? "";
  return {
    status: r.status ?? 1,
    stdout,
    stderr,
    combined: `${stdout}${stderr}`,
    enoent: false,
  };
}

export function runClaudeCliAsync(args: string[]): Promise<ClaudeCliResult> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (r: ClaudeCliResult) => {
      if (settled) return;
      settled = true;
      resolve(r);
    };

    const child = spawn("claude", args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.setEncoding("utf8");
    child.stderr?.setEncoding("utf8");
    child.stdout?.on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr?.on("data", (chunk: string) => {
      stderr += chunk;
    });

    child.on("error", (err) => {
      const enoent = (err as NodeJS.ErrnoException).code === "ENOENT";
      finish({
        status: 1,
        stdout: "",
        stderr: err.message,
        combined: err.message,
        enoent,
      });
    });

    child.on("close", (code) => {
      finish({
        status: code ?? 1,
        stdout,
        stderr,
        combined: `${stdout}${stderr}`,
        enoent: false,
      });
    });
  });
}
