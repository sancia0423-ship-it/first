import type { Metadata } from "next";
import { McpPage } from "@/components/mcp-page";

export const metadata: Metadata = {
  title: "接入方式 · MCP 与 API",
  description:
    "同一套服务端逻辑的三种接入方式：网页、REST API 和 MCP server，含 Claude Desktop 配置。"
};

export default function McpRoute() {
  return <McpPage />;
}
