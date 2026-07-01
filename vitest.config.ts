import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "server-only": path.resolve(__dirname, "__tests__/server-only-stub.ts")
    }
  },
  test: {
    include: ["__tests__/**/*.test.ts"]
  }
});
