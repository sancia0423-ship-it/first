import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { personalSiteContent } from "@/lib/personal-site-content";

/** 第二屏铺开的那些画。位置按设计稿的疏密关系排，不是整齐的网格。 */
const gallery = [
  { src: "/images/art/g-laptop.png", w: 380, h: 255, span: "wide" },
  { src: "/images/art/g-coffee.png", w: 262, h: 308, span: "tall" },
  { src: "/images/art/g-cookies.png", w: 153, h: 202, span: "small" },
  { src: "/images/art/g-moka.png", w: 226, h: 308, span: "tall" },
  { src: "/images/art/g-gift.png", w: 211, h: 205, span: "small" },
  { src: "/images/art/g-flowers.png", w: 199, h: 308, span: "tall" }
];

export function PersonalHomePage() {
  const { contact, hero } = personalSiteContent.home;

  return (
    <main className="page-shell">
      <SiteHeader />

      <section className="landing" id="top">
        <Image
          alt=""
          className="landing-art"
          height={364}
          priority
          sizes="(max-width: 900px) 92vw, 760px"
          src="/images/art/home.png"
          width={900}
        />

        <p className="landing-kicker">{hero.kicker}</p>
        <h1 className="landing-name">{hero.titleIntro}</h1>
        <p className="landing-sign">{hero.lead}</p>

        <Link className="welcome-button" href="/about">
          welcome
        </Link>
      </section>

      <section className="gallery-section" id="drawings">
        <div className="gallery">
          {gallery.map((item) => (
            <Image
              alt=""
              className={`gallery-item gallery-${item.span}`}
              height={item.h}
              key={item.src}
              sizes="(max-width: 700px) 40vw, 220px"
              src={item.src}
              width={item.w}
            />
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
