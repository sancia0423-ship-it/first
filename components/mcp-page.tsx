import Link from "next/link";
import { PromptCopyBlock } from "@/components/prompt-copy-block";
import { SiteHeader } from "@/components/site-header";

/**
 * 接入方式说明页。
 *
 * 这一页讲的不是某个工具，而是这些工具是怎么摆的：一套服务端逻辑，三个外壳。
 * MCP server 早就写好了，但只写在 README 里 —— 那等于没做。
 */

/** 域名上线后这里会自动跟着变，不用回来手改。 */
const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://first-production-24ac.up.railway.app";

const surfaces = [
  {
    name: "网页",
    audience: "给人用",
    body: "打开就能试，不用注册、不用装东西。自带 key 的话，请求直接从浏览器发给模型厂商，不经过我的服务器。"
  },
  {
    name: "REST API",
    audience: "给程序用",
    body: "OpenAPI 3.1 规范由服务端的 zod 校验直接生成，不是另写一份文档 —— 所以它不会跟代码脱节。"
  },
  {
    name: "MCP Server",
    audience: "给 AI 用",
    body: "接进 Claude Desktop、Claude Code、Cursor 之后，由模型自己判断什么时候该调用哪个工具，不需要人点。"
  }
];

const tools = [
  {
    name: "check_service_status",
    body: "确认服务可达、是否需要 key、有没有开启增强模式。"
  },
  {
    name: "translate_youtube_video",
    body: "读取公开视频的字幕并翻成中文，返回逐条时间轴字幕和可直接保存的 SRT。"
  },
  {
    name: "get_interview_briefing",
    body: "按公司、岗位、方向聚合公开面经，输出结构化的准备简报，来源可追溯。"
  },
  {
    name: "start_mock_interview",
    body: "按岗位方向生成四道 AI 产品面试题，带考察意图和时间预算。"
  },
  {
    name: "evaluate_interview_answer",
    body: "对一次回答打分，指出强弱项，并给出下一句大概率会被追问的问题。"
  }
];

const claudeConfig = `{
  "mcpServers": {
    "sancia-tools": {
      "command": "node",
      "args": ["/你克隆仓库的绝对路径/first/mcp/server.mjs"],
      "env": {
        "SANCIA_API_BASE_URL": "${baseUrl}"
      }
    }
  }
}`;

export function McpPage() {
  return (
    <main className="page-shell">
      <SiteHeader />

      <section id="top">
        <span className="eyebrow">接入方式</span>
        <h1 className="page-title">一套能力，三种接入</h1>
        <p className="hero-copy section">
          这个站上的工具，背后是同一套服务端逻辑。网页、REST API 和 MCP server
          都只是它的外壳 —— 这样不管你从哪个入口进来，行为都一样，不会出现网页上能跑、
          换成接口就对不上的分叉。
        </p>
      </section>

      <section id="surfaces">
        <div className="section-header">
          <h2 className="section-title">三个外壳</h2>
          <p className="section-lede">同一份逻辑，按调用者是谁换一层皮。</p>
        </div>

        <ul className="stack-list">
          {surfaces.map((item) => (
            <li key={item.name}>
              <span className="story-badge">{item.audience}</span>
              <h3 className="entry-title">{item.name}</h3>
              <p className="muted">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="tools">
        <div className="section-header">
          <h2 className="section-title">MCP 暴露的五个工具</h2>
          <p className="section-lede">
            接上之后，这些名字会出现在你的 AI 客户端里，由模型自己决定何时调用。
          </p>
        </div>

        <ul className="stack-list">
          {tools.map((tool) => (
            <li key={tool.name}>
              <h3 className="entry-title">
                <code>{tool.name}</code>
              </h3>
              <p className="muted">{tool.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section id="install">
        <div className="section-header">
          <h2 className="section-title">接进 Claude Desktop</h2>
          <p className="section-lede">
            把下面这段加进 Claude Desktop 的配置文件，重启客户端即可。
          </p>
        </div>

        <PromptCopyBlock kicker="配置片段" label="复制配置" text={claudeConfig} />

        <p className="muted section">
          它是 HTTP API 的薄封装，不用单独部署 —— 真正干活的还是上面那套接口。
        </p>

        <p className="muted section">
          需要说清楚的一点：现在这版是 stdio 模式，你得先把仓库 clone 到本地，
          配置里填的是本机路径。远程版本（填一个网址就能连、不用碰代码）我还没做，
          这是它目前最实际的限制。
        </p>
      </section>

      <section>
        <div className="button-row">
          <Link className="ghost-button" href="/tools">
            返回小工具
          </Link>
          <a className="ghost-button" href="/api/openapi.json">
            查看 OpenAPI 规范
          </a>
        </div>
      </section>
    </main>
  );
}
