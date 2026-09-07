import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { isAuthEnabled } from "@/lib/api/auth";
import { buildOpenApiDocument } from "@/lib/api/openapi";

export const metadata: Metadata = {
  title: "API 与 MCP",
  description: "公开 REST API 与 MCP server 接入说明：字幕翻译、面经简报、AI 产品模拟面试。"
};

export const dynamic = "force-dynamic";

type Operation = {
  summary?: string;
  description?: string;
  tags?: string[];
};

function listOperations() {
  const document = buildOpenApiDocument();

  return Object.entries(document.paths).flatMap(([path, operations]) =>
    Object.entries(operations as Record<string, Operation>).map(([method, operation]) => ({
      key: `${method} ${path}`,
      method: method.toUpperCase(),
      path,
      summary: operation.summary ?? "",
      description: operation.description ?? ""
    }))
  );
}

const curlExample = `curl -s "$BASE/api/v1/interview/briefing?company=字节跳动&role=产品经理实习&direction=增长" \\
  -H "Authorization: Bearer $API_KEY"

curl -s -X POST "$BASE/api/v1/youtube/translate" \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url":"https://www.youtube.com/watch?v=VIDEO_ID"}'`;

const mcpConfig = `{
  "mcpServers": {
    "sancia-tools": {
      "command": "node",
      "args": ["/absolute/path/to/first/mcp/server.mjs"],
      "env": {
        "SANCIA_API_BASE_URL": "https://your-domain.com",
        "SANCIA_API_KEY": "your-api-key"
      }
    }
  }
}`;

export default function ApiDocsPage() {
  const operations = listOperations();
  const authOn = isAuthEnabled();

  return (
    <main className="page-shell">
      <SiteHeader />

      <section id="top">
        <span className="eyebrow">API / MCP</span>
        <h1 className="hero-title">对外接口与插件</h1>
        <p className="hero-copy section">
          站点上的三个工具都有对应的公开 HTTP 接口，也打包成了一个 MCP server，可以直接挂进 Claude
          Desktop、Claude Code 或 Cursor。网页、REST API 和 MCP 共用同一套服务端逻辑，行为不会出现分叉。
        </p>

        <div className="button-row section">
          <a className="ghost-button" href="/api/openapi.json" rel="noreferrer" target="_blank">
            OpenAPI 3.1 规范
          </a>
          <a className="ghost-button" href="/api/v1/health" rel="noreferrer" target="_blank">
            健康检查
          </a>
        </div>
      </section>

      <section id="auth">
        <div className="section-header">
          <span className="section-kicker">鉴权</span>
          <h2 className="panel-title">API key</h2>
        </div>

        <div className="callout callout-strong">
          <strong>当前状态</strong>
          <p>
            {authOn
              ? "已启用。请求需要带上 Authorization: Bearer <key>，或 x-api-key 请求头。"
              : "未启用。服务端没有配置 API_KEYS，接口当前开放访问；部署到公网后建议配置。"}
          </p>
        </div>

        <ul className="stack-list section">
          <li>
            <h3>配置方式</h3>
            <p className="muted">
              在部署环境里设置 <code>API_KEYS</code>，多个 key 用逗号分隔。留空则接口开放访问。
            </p>
          </li>
          <li>
            <h3>限流</h3>
            <p className="muted">
              每个客户端 IP 默认 60 秒内 10 次请求，超出返回 429。可以用 RATE_LIMIT_MAX_HITS 和
              RATE_LIMIT_WINDOW_MS 调整。
            </p>
          </li>
          <li>
            <h3>降级行为</h3>
            <p className="muted">
              服务端未配置 OPENAI_API_KEY 时接口依然可用，只是会退回规则抽取和本地翻译。用
              /api/v1/health 的 aiEnhanced 字段可以提前判断。
            </p>
          </li>
        </ul>
      </section>

      <section id="endpoints">
        <div className="section-header">
          <span className="section-kicker">端点</span>
          <h2 className="panel-title">REST API</h2>
          <p className="section-copy muted">
            以下列表由 OpenAPI 文档生成，而 OpenAPI 的请求/响应结构又直接来自服务端的校验 schema。
          </p>
        </div>

        <ul className="stack-list">
          {operations.map((operation) => (
            <li key={operation.key}>
              <span className="story-badge">{operation.method}</span>
              <h3>
                <code>{operation.path}</code>
              </h3>
              <p className="muted">{operation.summary}</p>
              {operation.description ? (
                <p className="muted">{operation.description}</p>
              ) : null}
            </li>
          ))}
        </ul>

        <div className="section">
          <span className="section-kicker">调用示例</span>
          <pre className="code-block">{curlExample}</pre>
        </div>
      </section>

      <section id="mcp">
        <div className="section-header">
          <span className="section-kicker">插件格式</span>
          <h2 className="panel-title">MCP server</h2>
          <p className="section-copy muted">
            仓库里的 mcp/server.mjs 是一个标准 MCP server，通过 stdio 通信，对外暴露 5 个工具。它本身只是
            HTTP API 的薄封装，所以不需要单独部署。
          </p>
        </div>

        <ul className="stack-list">
          <li>
            <h3>
              <code>check_service_status</code>
            </h3>
            <p className="muted">确认服务可达、是否需要 key、是否处于增强模式。</p>
          </li>
          <li>
            <h3>
              <code>translate_youtube_video</code>
            </h3>
            <p className="muted">翻译公开视频字幕，返回时间轴字幕与 SRT。</p>
          </li>
          <li>
            <h3>
              <code>get_interview_briefing</code>
            </h3>
            <p className="muted">按公司、岗位、方向生成结构化面经简报。</p>
          </li>
          <li>
            <h3>
              <code>start_mock_interview</code>
            </h3>
            <p className="muted">生成一场 AI 产品模拟面试，含开场白、题目和评分维度。</p>
          </li>
          <li>
            <h3>
              <code>evaluate_interview_answer</code>
            </h3>
            <p className="muted">对单题回答给出维度评分、漏洞和追问。</p>
          </li>
        </ul>

        <div className="section">
          <span className="section-kicker">Claude Desktop 配置</span>
          <pre className="code-block">{mcpConfig}</pre>
          <p className="muted section">
            把这段加进 claude_desktop_config.json 后重启客户端即可。SANCIA_API_BASE_URL 指向你部署好的站点；
            本地调试可以填 http://localhost:3000。
          </p>
        </div>
      </section>
    </main>
  );
}
