import "server-only";

import { spawn } from "node:child_process";
import path from "node:path";
import { PYTHON_SCRIPT_TIMEOUT_MS } from "@/lib/config";
import { PublicError } from "@/lib/api/guards";

const PYTHON_BIN = process.env.PYTHON_BIN || "python3";

type PythonFailure = {
  error?: string;
  detail?: string;
};

/**
 * Runs a helper script with a JSON payload on stdin and returns parsed stdout.
 *
 * The timeout matters: without it a hung yt-dlp call keeps a request handler
 * (and a python process) alive indefinitely.
 */
export async function runPythonScript<T>(scriptName: string, payload: unknown): Promise<T> {
  const scriptPath = path.join(process.cwd(), "scripts", scriptName);

  const stdout = await new Promise<string>((resolve, reject) => {
    const child = spawn(PYTHON_BIN, [scriptPath], { stdio: ["pipe", "pipe", "pipe"] });

    let stdoutText = "";
    let stderrText = "";
    let settled = false;

    const timer = setTimeout(() => {
      settled = true;
      child.kill("SIGKILL");
      reject(new PublicError("处理超时了，请换一个更短的视频再试。"));
    }, PYTHON_SCRIPT_TIMEOUT_MS);

    const finish = (run: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      run();
    };

    child.stdout.on("data", (chunk) => {
      stdoutText += String(chunk);
    });

    child.stderr.on("data", (chunk) => {
      stderrText += String(chunk);
    });

    child.on("error", (error) => {
      finish(() => {
        console.error(`[python:${scriptName}] spawn failed`, error);
        reject(new PublicError("字幕服务当前不可用，请稍后再试。"));
      });
    });

    child.on("close", (code) => {
      finish(() => {
        if (code === 0) {
          resolve(stdoutText);
          return;
        }

        let failure: PythonFailure = {};
        try {
          failure = JSON.parse(stderrText) as PythonFailure;
        } catch {
          // stderr was not our structured payload — keep it server-side only.
        }

        console.error(`[python:${scriptName}] exited ${code}`, failure.detail ?? stderrText);
        reject(new PublicError(failure.error || "字幕读取失败，请换一个视频再试。"));
      });
    });

    child.stdin.on("error", () => {
      // The child may exit before we finish writing; `close` reports the reason.
    });
    child.stdin.end(JSON.stringify(payload));
  });

  try {
    return JSON.parse(stdout) as T;
  } catch {
    console.error(`[python:${scriptName}] produced non-JSON stdout`);
    throw new PublicError("字幕服务返回结构异常，请稍后再试。");
  }
}
