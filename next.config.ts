import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",

  // File tracing sweeps in the whole project tree; none of this is read at
  // runtime, so keep it out of the deployed image.
  outputFileTracingExcludes: {
    "*": [
      "./docs/**",
      "./__tests__/**",
      "./mcp/**",
      "./.github/**",
      "./tsconfig.tsbuildinfo"
    ]
  }
};

export default nextConfig;
