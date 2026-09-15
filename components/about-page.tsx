import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { publicFileExists } from "@/lib/media";
import { personalSiteContent } from "@/lib/personal-site-content";

/**
 * 自我介绍 + 项目展示。
 *
 * 照夏琪的设计稿，这两块是同一页的上下两屏：上半浅蓝讲人，下半墨绿通栏讲项目。
 * 之前拆成了 /about 和 /projects 两个路由，跟她的设计对不上，现在合回来。
 */
export function AboutPage() {
  const { about, projects, resume } = personalSiteContent.home;

  return (
    <main className="page-shell">
      <SiteHeader />

      <section id="top">
        <div className="about-head">
          <Image
            alt="夏琪"
            className="about-avatar"
            height={560}
            priority
            sizes="112px"
            src="/images/me/avatar.jpg"
            width={560}
          />
          <h1 className="about-title">{about.kicker}</h1>
        </div>

        <Image
          alt=""
          className="art art-about"
          height={493}
          sizes="260px"
          src="/images/art/about.png"
          width={460}
        />

        <div className="about-body">
          {about.storyParagraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        <div className="about-links">
          <a href={resume.viewHref} rel="noreferrer" target="_blank">
            RESUME 简历下载
          </a>
          <Link href="#projects">项目展示</Link>
        </div>
      </section>

      {/* 通栏深色段。width:100vw + 负边距让它挣脱居中的内容列，铺满整个视口宽度。 */}
      <section className="bleed-dark" id="projects">
        <div className="bleed-inner">
          <h2 className="projects-title">{projects.title}</h2>

          <div className="project-cards">
            {projects.cards.map((card) => (
              <article className="project-card" key={card.lines[0]}>
                {publicFileExists(card.image) ? (
                  <div className="project-card-media">
                    <Image
                      alt={card.imageAlt}
                      height={card.imageHeight}
                      sizes="(max-width: 900px) 45vw, 240px"
                      src={card.image}
                      width={card.imageWidth}
                    />
                  </div>
                ) : null}

                <div className="project-card-body">
                  {card.title ? <h3>{card.title}</h3> : null}
                  {card.lines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
