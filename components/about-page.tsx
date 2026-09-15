import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { personalSiteContent } from "@/lib/personal-site-content";

/**
 * 自我介绍。版式照夏琪在 Canva 里定的那版：圆形头像 + ABOUT ME 大标题 +
 * 四段正文 + 底部两个入口。
 *
 * 原来这里还挂着简历亮点和技能清单，她的设计里没有，去掉 —— 她要的是简洁。
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
