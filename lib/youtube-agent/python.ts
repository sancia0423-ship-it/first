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

        // yt-dlp 会把自己的日志也写到 stderr，所以只提取我们自己那一行，
        // 否则整段解析失败，真实原因就丢了，只剩一句无用的兜底文案。
        let failure: PythonFailure = {};
        const marker = "__TRANSCRIPT_ERROR__";
        const line = stderrText
          .split("\n")
          .reverse()
          .find((candidate) => candidate.includes(marker));

        if (line) {
          try {
            failure = JSON.parse(line.slice(line.indexOf(marker) + marker.length)) as PythonFailure;
          } catch {
            // 结构还是坏的，下面按兜底处理。
          }
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
