import "server-only";

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export interface CacheBackend {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

/** Default file-system cache — works for local dev, not for serverless. */
class FileCache implements CacheBackend {
  private dir: string;

  constructor(dir: string) {
    this.dir = dir;
  }

  private filePath(key: string) {
    const digest = createHash("sha256").update(key).digest("hex");
    return path.join(this.dir, `${digest}.json`);
  }

  async get(key: string) {
    try {
      return await readFile(this.filePath(key), "utf8");
    } catch {
      return null;
    }
  }

  async set(key: string, value: string) {
    await mkdir(this.dir, { recursive: true });
    await writeFile(this.filePath(key), value, "utf8");
  }
}

/** In-memory cache — survives within a single process, useful for serverless warm starts. */
class MemoryCache implements CacheBackend {
  private store = new Map<string, string>();

  async get(key: string) {
    return this.store.get(key) ?? null;
  }

  async set(key: string, value: string) {
    this.store.set(key, value);
  }
}

function createBackend(): CacheBackend {
  if (process.env.CACHE_BACKEND === "memory") {
    return new MemoryCache();
  }
  return new FileCache(path.join(process.cwd(), ".cache", "pipeline"));
}

const backend = createBackend();

export async function readCache<T>(key: string, maxAgeMs: number): Promise<T | null> {
  const raw = await backend.get(key);
  if (!raw) return null;

  try {
    const payload = JSON.parse(raw) as { savedAt: string; value: T };
    if (Date.now() - new Date(payload.savedAt).getTime() > maxAgeMs) {
      return null;
    }
    return payload.value;
  } catch {
    return null;
  }
}

export async function writeCache<T>(key: string, value: T): Promise<void> {
  await backend.set(
    key,
    JSON.stringify({ savedAt: new Date().toISOString(), value }, null, 2)
  );
}
