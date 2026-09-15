import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { personalSiteContent } from "@/lib/personal-site-content";

/**
 * 首页 = 落地页。一句话、一张图、几个入口，别的都不放。
 *
 * 之前这里堆了自我介绍、项目、简历、学习资料、工具、联系六大段，等于把整站
 * 压成一页。现在正文各自有页面，首页只负责让人知道往哪走。
 */

function isExternal(href: string) {
  return href.startsWith("http") || href.startsWith("mailto:");
}

export function PersonalHomePage() {
  const { entries, hero } = personalSiteContent.home;

  return (
    <main className="page-shell">
      <SiteHeader />

      <section id="top">
        <h1 className="page-title">{hero.titleIntro}</h1>
        <p className="hero-copy section">{hero.lead}</p>

        <figure className="site-figure landing-figure">
          <Image
            alt="白墙上悬挂的一只灰色喇叭"
            height={826}
            priority
            sizes="(max-width: 640px) 100vw, 300px"
            src="/images/site/speaker.jpg"
            width={1240}
          />
          <figcaption>摄影：Will Handley，经作者授权使用。</figcaption>
        </figure>

        <nav aria-label="站内入口" className="entry-links">
          {entries.map((item) =>
            isExternal(item.href) ? (
              <a
                href={item.href}
                key={item.label}
                rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                target={item.href.startsWith("http") ? "_blank" : undefined}
              >
                {item.label}
              </a>
            ) : (
              <Link href={item.href} key={item.label}>
                {item.label}
              </Link>
            )
          )}
        </nav>
      </section>
    </main>
  );
}
