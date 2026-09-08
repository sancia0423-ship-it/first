import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { personalSiteContent } from "@/lib/personal-site-content";

/** 工具索引。每个工具有自己的页面，这里只负责说清楚它是什么、能做什么。 */
const tools = [
  {
    label: "工具 01",
    title: "YouTube 中文翻译",
    href: "/tools/youtube",
    body: "读取公开视频字幕并翻成中文，支持搜索、点句跳转、时间戳笔记和 SRT 下载。",
    extras: ["章节速览", "内容提问", "自测问答", "中文朗读"]
  },
  {
    label: "工具 02",
    title: "AI 产品模拟面试",
    href: "/mock",
    body: "选定岗位方向后生成四道面试题，逐题给出评分、追问和更强的回答结构。",
    extras: ["五维评分", "逐题追问", "整场总结"]
  }
];

export function ToolsPage() {
  const { hero } = personalSiteContent.tools;

  return (
    <main className="page-shell">
      <SiteHeader />

      <section id="top">
        <span className="eyebrow">{hero.kicker}</span>
        <h1 className="page-title">{hero.title}</h1>
        <p className="hero-copy section">{hero.lead}</p>
      </section>

      <section id="tools">
        <ul className="stack-list">
          {tools.map((tool) => (
            <li key={tool.href}>
              <span className="story-badge">{tool.label}</span>
              <h2 className="entry-title">{tool.title}</h2>
              <p className="muted">{tool.body}</p>
              <p className="metric-chip-row">
                {tool.extras.map((extra) => (
                  <span className="metric-chip" key={extra}>
                    {extra}
                  </span>
                ))}
              </p>
              <Link className="ghost-button" href={tool.href}>
                打开
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
