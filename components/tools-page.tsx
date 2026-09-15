import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { personalSiteContent } from "@/lib/personal-site-content";

/**
 * 作品页。版式照夏琪在 Canva 里定的那版：浅蓝标题区 + 墨绿的开发者日志整块。
 * 正文逐字用她写的原文。
 */
export function ToolsPage() {
  const { feature, hero } = personalSiteContent.tools;

  return (
    <main className="page-shell">
      <SiteHeader />

      <section id="top">
        <h1 className="page-title">{hero.title}</h1>
        <p className="feature-name">
          {feature.name}
          <span className="feature-tagline">｜{feature.tagline}</span>
        </p>
      </section>

      <section id="log">
        <div className="dark-panel">
          <h2 className="dark-panel-title">{feature.logTitle}</h2>
          {feature.log.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className="about-links">
          <Link href={feature.href}>{feature.action}</Link>
          <Link href="/tools/mcp">看怎么接入 MCP</Link>
          <Link href="/tools/mock">AI 产品模拟面试</Link>
        </div>
      </section>
    </main>
  );
}
