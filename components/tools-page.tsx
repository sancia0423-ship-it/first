import Image from "next/image";
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
    <main className="page-shell page-dark">
      <SiteHeader />

      <section id="top">
        <Image
          alt=""
          className="art art-tools"
          height={361}
          sizes="(max-width: 760px) 40vw, 300px"
          src="/images/art/tools.png"
          width={420}
        />

        <h1 className="dark-title">{hero.title}</h1>
        <p className="feature-name">
          {feature.name}
          <span className="feature-tagline">｜{feature.tagline}</span>
        </p>

        <div className="dev-log">
          <h2 className="dev-log-title">{feature.logTitle}</h2>
          {feature.log.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className="about-links">
          <Link href={feature.href}>{feature.action}</Link>
        </div>
      </section>
    </main>
  );
}
