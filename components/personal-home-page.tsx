import Image from "next/image";
import Link from "next/link";
import { PointerDepth } from "@/components/pointer-depth";
import { SiteHeader } from "@/components/site-header";
import { personalSiteContent } from "@/lib/personal-site-content";

/** 第二屏铺开的那些画。位置按设计稿的疏密关系排，不是整齐的网格。 */
/** depth 决定这张画跟手移动的幅度：值越大越靠前，视差越明显。 */
const gallery = [
  { src: "/images/art/g-laptop.png", w: 380, h: 255, span: "wide", depth: 1.0 },
  { src: "/images/art/g-coffee.png", w: 262, h: 308, span: "tall", depth: 0.45 },
  { src: "/images/art/g-cookies.png", w: 153, h: 202, span: "small", depth: 1.4 },
  { src: "/images/art/g-moka.png", w: 226, h: 308, span: "tall", depth: 0.7 },
  { src: "/images/art/g-gift.png", w: 211, h: 205, span: "small", depth: 1.6 },
  { src: "/images/art/g-flowers.png", w: 199, h: 308, span: "tall", depth: 0.3 }
];

export function PersonalHomePage() {
  const { contact, hero } = personalSiteContent.home;

  return (
    <main className="page-shell">
      <SiteHeader />
      <PointerDepth />

      <section className="landing" id="top">
        {/*
          首屏整块用夏琪设计稿里渲染好的图：Canva 把字体转成了轮廓，
          SVG 里没留下字体名，那几款中文手写体也不在任何网页字体服务里 ——
          想和她的设计完全一致，只有按原样取图这一条路。

          代价是标题不再是可选中的文字，所以下面补一个视觉隐藏的 h1，
          搜索引擎和读屏软件读到的仍然是真文字。
        */}
        <h1 className="visually-hidden">
          {hero.kicker}，{hero.titleIntro}。{hero.lead}
        </h1>

        <div className="landing-stage">
          <Image
            alt=""
            className="landing-art"
            height={1053}
            priority
            sizes="(max-width: 900px) 94vw, 1000px"
            src="/images/art/hero.png"
            width={2000}
          />
        </div>

        <Link className="welcome-button" href="/about">
          welcome
        </Link>
      </section>

      <section className="gallery-section" id="drawings">
        <div className="gallery">
          {gallery.map((item) => (
            <span
              className={`gallery-slot gallery-${item.span}`}
              key={item.src}
              style={{ "--depth": item.depth } as React.CSSProperties}
            >
              <Image
                alt=""
                className="gallery-item"
                height={item.h}
                sizes="(max-width: 700px) 40vw, 220px"
                src={item.src}
                width={item.w}
              />
            </span>
          ))}
        </div>
      </section>

      <section id="contact">
        <h2 className="contact-title">{contact.kicker}</h2>
        <p className="contact-subtitle">{contact.title}</p>

        <div className="contact-block">
          <p className="contact-label">Social media</p>
          <a
            className="contact-value"
            href={contact.links[0].href}
            rel="noreferrer"
            target="_blank"
          >
            LinkedIn
          </a>
        </div>

        <div className="contact-block">
          <p className="contact-label">Email us</p>
          <a className="contact-value" href={`mailto:${contact.email}`}>
            {contact.email}
          </a>
        </div>
      </section>

    </main>
  );
}
