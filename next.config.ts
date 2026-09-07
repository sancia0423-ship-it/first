import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: "standalone",

  // 图片不做服务端优化：省掉 sharp 这个原生依赖，容器更简单也更稳。
  // 站点上的图片数量很少，收益不值得多一个会在构建期出问题的依赖。
  images: { unoptimized: true },

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
