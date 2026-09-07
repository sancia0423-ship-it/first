import "server-only";

import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export interface CacheBackend {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
}

/** Nothing in this cache is worth keeping longer than the longest read TTL. */
const MAX_ENTRY_AGE_MS = 1000 * 60 * 60 * 24 * 2;
const PRUNE_INTERVAL_MS = 1000 * 60 * 60;
const MAX_MEMORY_ENTRIES = 500;

/** Default file-system cache — works for local dev, not for serverless. */
class FileCache implements CacheBackend {
  private dir: string;
  private lastPruneAt = 0;

  constructor(dir: string) {
    this.dir = dir;
  }

  private filePath(key: string) {
    const digest = createHash("sha256").update(key).digest("hex");
    return path.join(this.dir, `${digest}.json`);
  }

  /** Entries were only ever written, never removed — the directory grew forever. */
  private async pruneExpired() {
    const now = Date.now();
    if (now - this.lastPruneAt < PRUNE_INTERVAL_MS) {
      return;
    }

    this.lastPruneAt = now;

    try {
      const files = await readdir(this.dir);
      await Promise.all(
        files.map(async (file) => {
          const target = path.join(this.dir, file);
          const stats = await stat(target).catch(() => null);

          if (stats && now - stats.mtimeMs > MAX_ENTRY_AGE_MS) {
            await unlink(target).catch(() => undefined);
          }
        })
      );
    } catch {
      // A missing or unreadable cache directory is not worth failing a request.
    }
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
    void this.pruneExpired();
  }
}

/** In-memory cache — survives within a single process, useful for serverless warm starts. */
class MemoryCache implements CacheBackend {
  private store = new Map<string, string>();

  async get(key: string) {
    return this.store.get(key) ?? null;
  }

  async set(key: string, value: string) {
    // Map preserves insertion order, so the first key is the oldest write.
    if (!this.store.has(key) && this.store.size >= MAX_MEMORY_ENTRIES) {
      const oldest = this.store.keys().next().value;
      if (oldest !== undefined) {
        this.store.delete(oldest);
      }
    }

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
  await backend.set(key, JSON.stringify({ savedAt: new Date().toISOString(), value }));
}
