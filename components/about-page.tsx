import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { personalSiteContent } from "@/lib/personal-site-content";

/**
 * 自我介绍。项目展示拆在 /projects，从这一页的链接进入 ——
 * 一屏里塞两个主题会让人以为页面到底了。
 */
export function AboutPage() {
  const { about, resume } = personalSiteContent.home;

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
          <Link href="/projects">项目展示</Link>
        </div>
      </section>

    </main>
  );
}
