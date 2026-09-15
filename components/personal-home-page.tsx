import Image from "next/image";
import Link from "next/link";
import { ContactForm } from "@/components/contact-form";
import { SiteHeader } from "@/components/site-header";
import { personalSiteContent } from "@/lib/personal-site-content";

/**
 * 主页 = 落地页。照夏琪的设计：署名、一句签名、拼贴图、welcome 入口，
 * 底部是联系区。正文各自在自己的页面里。
 */
export function PersonalHomePage() {
  const { contact, hero } = personalSiteContent.home;

  return (
    <main className="page-shell">
      <SiteHeader />

      <section id="top">
        <Image
          alt=""
          className="art art-home"
          height={364}
          priority
          sizes="(max-width: 700px) 100vw, 560px"
          src="/images/art/home.png"
          width={900}
        />

        <p className="hero-kicker">{hero.kicker}</p>
        <h1 className="page-title">{hero.titleIntro}</h1>
        <p className="hero-sign">{hero.lead}</p>

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

        <Link className="welcome-button" href="/about">
          welcome
        </Link>
      </section>

      <section id="contact">
        <div className="contact-grid">
          <div>
            <h2 className="contact-title">{contact.kicker}</h2>
            <p className="contact-subtitle">{contact.title}</p>

            <div className="contact-links">
              {contact.links.map((item) => (
                <a
                  href={item.href}
                  key={item.label}
                  rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          <ContactForm />
        </div>
      </section>
    </main>
  );
}
