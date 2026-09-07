#!/usr/bin/env node
/**
 * MCP server exposing this site's tools to Claude Desktop, Claude Code, Cursor
 * and any other MCP client.
 *
 * It is a thin client over the public HTTP API — all the real work stays in
 * `/api/v1/*`, so the web UI, the REST API and this server can never disagree
 * about behaviour.
 *
 * Configuration (environment):
 *   SANCIA_API_BASE_URL  API root, e.g. https://your-domain.com (default: localhost:3000)
 *   SANCIA_API_KEY       Sent as `Authorization: Bearer` when the API requires a key
 *   SANCIA_API_TIMEOUT_MS Per-request timeout (default 120000; subtitle jobs are slow)
 *
 * Run:  node mcp/server.mjs
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE_URL = (process.env.SANCIA_API_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const API_KEY = process.env.SANCIA_API_KEY ?? "";
const TIMEOUT_MS = Number(process.env.SANCIA_API_TIMEOUT_MS) || 120_000;

/** MCP servers speak JSON-RPC on stdout, so diagnostics must go to stderr. */
function logError(message, error) {
  console.error(`[sancia-mcp] ${message}`, error instanceof Error ? error.message : error);
}

async function callApi(path, { method = "GET", body } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {})
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal
    });

    const text = await response.text();
    let payload;
    try {
      payload = text ? JSON.parse(text) : {};
    } catch {
      throw new Error(`API returned non-JSON (HTTP ${response.status})`);
    }

    if (!response.ok) {
      const detail = payload.message || payload.error || `HTTP ${response.status}`;
      throw new Error(`${detail} (${method} ${path})`);
    }

    return payload;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timed out after ${TIMEOUT_MS}ms (${method} ${path})`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

/** Every tool returns the same envelope: readable text plus the raw payload. */
function toolResult(summary, payload) {
  return {
    content: [
      { type: "text", text: summary },
      { type: "text", text: JSON.stringify(payload, null, 2) }
    ]
  };
}

function toolError(error) {
  const message = error instanceof Error ? error.message : String(error);
  logError("tool failed", error);
  return {
    isError: true,
    content: [{ type: "text", text: `调用失败：${message}` }]
  };
}

const server = new McpServer(
  { name: "sancia-tools", version: "1.0.0" },
  {
    instructions:
      "萨奇个人站点的工具集：YouTube 字幕中文翻译、公开面经检索简报、AI 产品模拟面试。" +
      "调用前可以先用 check_service_status 确认服务可用以及是否启用了增强模式。"
  }
);

server.registerTool(
  "check_service_status",
  {
    title: "检查服务状态",
    description:
      "确认 API 是否可达、是否需要 API key、以及是否配置了 OpenAI（决定走增强模式还是回退模式）。",
    inputSchema: {},
    annotations: { readOnlyHint: true, openWorldHint: true }
  },
  async () => {
    try {
      const status = await callApi("/api/v1/health");
      return toolResult(
        `服务可用。增强模式：${status.aiEnhanced ? "已开启" : "未开启（走规则/本地翻译回退）"}；` +
          `鉴权：${status.authRequired ? "需要 API key" : "当前开放访问"}。`,
        status
      );
    } catch (error) {
      return toolError(error);
    }
  }
);

server.registerTool(
  "translate_youtube_video",
  {
    title: "翻译 YouTube 视频字幕",
    description:
      "读取一个公开 YouTube 视频的字幕并翻译成简体中文，返回逐条时间轴字幕和可直接保存的 SRT。" +
      "支持 watch / shorts / embed / youtu.be 链接。视频较长时耗时可能超过一分钟。",
    inputSchema: {
      url: z.string().describe("YouTube 视频链接"),
      sourceLanguage: z
        .string()
        .max(16)
        .optional()
        .describe("可选，指定源字幕语言代码，例如 en、ja。留空则自动选择")
    },
    annotations: { readOnlyHint: true, openWorldHint: true }
  },
  async ({ url, sourceLanguage }) => {
    try {
      const result = await callApi("/api/v1/youtube/translate", {
        method: "POST",
        body: { url, sourceLanguage: sourceLanguage ?? "" }
      });

      const summary = [
        `《${result.title}》字幕翻译完成。`,
        `共 ${result.segments.length} 条，源语言 ${result.sourceLanguage}，` +
          `模式 ${result.translationMode === "openai" ? "增强翻译" : "标准翻译"}。`,
        result.summary ? `\n速览：${result.summary}` : "",
        result.warnings.length > 0 ? `\n提示：${result.warnings.join(" / ")}` : ""
      ]
        .filter(Boolean)
        .join(" ");

      return toolResult(summary, result);
    } catch (error) {
      return toolError(error);
    }
  }
);

server.registerTool(
  "get_interview_briefing",
  {
    title: "生成面经简报",
    description:
      "根据公司、岗位和方向，从牛客与掘金的公开内容里召回面经，聚合成结构化的准备简报：" +
      "面试轮次、高频题型、准备重点和可追溯来源。",
    inputSchema: {
      company: z.string().min(1).describe("目标公司，例如 字节跳动"),
      role: z.string().min(1).describe("目标岗位，例如 产品经理实习"),
      direction: z.string().optional().describe("可选方向，例如 增长 / 商业分析")
    },
    annotations: { readOnlyHint: true, openWorldHint: true }
  },
  async ({ company, role, direction }) => {
    try {
      const params = new URLSearchParams({ company, role });
      if (direction) {
        params.set("direction", direction);
      }

      const result = await callApi(`/api/v1/interview/briefing?${params}`);
      const summary =
        `已生成 ${company} / ${role} 的面经简报。样本 ${result.sampleSize} 篇，` +
        `置信度 ${result.confidenceLabel}，数据模式 ${result.mode}。` +
        (result.warnings.length > 0 ? ` 提示：${result.warnings.join(" / ")}` : "");

      return toolResult(summary, result);
    } catch (error) {
      return toolError(error);
    }
  }
);

const setupShape = {
  targetRole: z
    .enum(["ai-product-general", "ai-growth", "ai-agent", "ai-platform"])
    .describe("目标岗位方向"),
  seniority: z.enum(["intern", "junior", "mid"]).describe("职级：实习/校招、1-3 年、3-5 年"),
  companyStage: z.enum(["startup", "growth", "bigtech"]).describe("公司阶段"),
  focusArea: z.string().min(1).max(40).describe("本场面试的重点方向，例如 用户增长"),
  candidateBackground: z.string().max(400).optional().describe("可选，候选人背景简述")
};

function normalizeSetup(setup) {
  return { ...setup, candidateBackground: setup.candidateBackground ?? "" };
}

server.registerTool(
  "start_mock_interview",
  {
    title: "开始 AI 产品模拟面试",
    description:
      "生成一场 AI 产品经理模拟面试：面试官开场白、4 道题目和 5 个评分维度。" +
      "把返回的 question 对象原样传给 evaluate_interview_answer 即可逐题点评。",
    inputSchema: setupShape,
    annotations: { readOnlyHint: true, openWorldHint: true }
  },
  async (setup) => {
    try {
      const result = await callApi("/api/v1/interview/mock", {
        method: "POST",
        body: { action: "start", setup: normalizeSetup(setup) }
      });

      const questions = result.questions
        .map((question, index) => `${index + 1}. ${question.prompt}`)
        .join("\n");

      return toolResult(
        `面试官 ${result.interviewerName} 已就位（${result.mode === "openai" ? "AI 出题" : "题库出题"}）。\n` +
          `${result.intro}\n\n题目：\n${questions}`,
        result
      );
    } catch (error) {
      return toolError(error);
    }
  }
);

server.registerTool(
  "evaluate_interview_answer",
  {
    title: "点评模拟面试回答",
    description:
      "对某一道题的回答给出 1-5 分的维度评分、优点、漏洞、追问问题和更强的回答结构。" +
      "question 必须是 start_mock_interview 返回的题目对象。回答至少 20 个字符。",
    inputSchema: {
      ...setupShape,
      question: z
        .object({
          id: z.string(),
          prompt: z.string(),
          intent: z.string(),
          dimensionTags: z.array(z.string()).min(2).max(4),
          excellentSignals: z.array(z.string()).min(3).max(5),
          timebox: z.string()
        })
        .describe("start_mock_interview 返回的题目对象，原样传入"),
      answer: z.string().min(20).max(4000).describe("候选人的回答")
    },
    annotations: { readOnlyHint: true, openWorldHint: true }
  },
  async ({ question, answer, ...setup }) => {
    try {
      const result = await callApi("/api/v1/interview/mock", {
        method: "POST",
        body: { action: "evaluate", setup: normalizeSetup(setup), question, answer }
      });

      const dimensions = result.dimensionScores
        .map((item) => `${item.label} ${item.score}/5`)
        .join("，");

      return toolResult(
        `总分 ${result.overallScore}。${result.verdict}\n维度：${dimensions}\n` +
          `下一个追问：${result.followUpQuestion}`,
        result
      );
    } catch (error) {
      return toolError(error);
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[sancia-mcp] ready, talking to ${BASE_URL}`);
}

main().catch((error) => {
  logError("failed to start", error);
  process.exit(1);
});
