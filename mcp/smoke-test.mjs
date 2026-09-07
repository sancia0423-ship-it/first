#!/usr/bin/env node
/**
 * End-to-end check of the MCP server against a running API.
 *
 *   npm run dev                 # in one shell
 *   npm run mcp:smoke           # in another
 *
 * Override the target with SANCIA_API_BASE_URL. Exits non-zero on failure.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const BASE_URL = process.env.SANCIA_API_BASE_URL ?? "http://127.0.0.1:3000";

const EXPECTED_TOOLS = [
  "check_service_status",
  "translate_youtube_video",
  "get_interview_briefing",
  "start_mock_interview",
  "evaluate_interview_answer"
];

class SmokeFailure extends Error {}

/** Fails loudly and stops: later steps depend on earlier ones succeeding. */
function check(label, condition, detail) {
  console.log(`${condition ? "ok  " : "FAIL"} ${label}`);
  if (!condition) {
    throw new SmokeFailure(detail ? `${label} — ${detail}` : label);
  }
}

function firstText(result) {
  return result?.content?.find((part) => part.type === "text")?.text ?? "";
}

const transport = new StdioClientTransport({
  command: "node",
  args: ["mcp/server.mjs"],
  env: { ...process.env, SANCIA_API_BASE_URL: BASE_URL }
});

const client = new Client({ name: "sancia-smoke", version: "1.0.0" });
await client.connect(transport);

try {
  const { tools } = await client.listTools();
  const names = tools.map((tool) => tool.name);
  check(`exposes ${EXPECTED_TOOLS.length} tools`, EXPECTED_TOOLS.every((n) => names.includes(n)));

  const status = await client.callTool({ name: "check_service_status", arguments: {} });
  check("service reachable", !status.isError, firstText(status));

  const session = await client.callTool({
    name: "start_mock_interview",
    arguments: {
      targetRole: "ai-agent",
      seniority: "intern",
      companyStage: "bigtech",
      focusArea: "用户增长"
    }
  });
  check("mock interview starts", !session.isError, firstText(session));

  const parsed = JSON.parse(session.content[1].text);
  check("session carries questions", Array.isArray(parsed.questions) && parsed.questions.length > 0);

  const evaluation = await client.callTool({
    name: "evaluate_interview_answer",
    arguments: {
      targetRole: "ai-agent",
      seniority: "intern",
      companyStage: "bigtech",
      focusArea: "用户增长",
      question: parsed.questions[0],
      answer:
        "我会先定义目标用户和核心任务，然后设计 MVP，用 A/B 实验验证转化指标，" +
        "同时补上人工兜底和风险审核，最后按灰度节奏推进上线。"
    }
  });
  check("answer evaluation returns a score", !evaluation.isError, firstText(evaluation));

  const rejected = await client.callTool({
    name: "translate_youtube_video",
    arguments: { url: "https://evil.test/x" }
  });
  check("bad url is rejected as a tool error", rejected.isError === true);
} catch (error) {
  process.exitCode = 1;
  console.error(`\n${error instanceof Error ? error.message : error}`);
  if (!(error instanceof SmokeFailure)) {
    console.error(error);
  }
} finally {
  await client.close();
}

console.log(process.exitCode ? "\nsmoke test FAILED" : "\nsmoke test passed");
