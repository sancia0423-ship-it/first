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

        <figure className="landing-figure">
          <Image
            alt="夏琪的生活照片拼贴：悉尼大学、活动发言、生日、海港大桥"
            height={1389}
            priority
            sizes="(max-width: 700px) 100vw, 620px"
            src="/images/me/collage.jpg"
            width={1400}
          />
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
