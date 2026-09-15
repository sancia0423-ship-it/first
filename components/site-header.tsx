import Link from "next/link";
import { personalSiteContent } from "@/lib/personal-site-content";

const navItems = [
  { label: "主页", href: "/" },
  { label: "自我介绍", href: "/about" },
  { label: "作品", href: "/tools" },
  { label: "AI 学习", href: "/ai-learning" }
];

export function SiteHeader() {
  const { handle, subtitle, tagline, title } = personalSiteContent.site;

  return (
    <header className="site-header">
      <Link className="brand-lockup" href="/">
        <span className="brand-name-row">
          <strong className="brand-title">{title}</strong>
          <span className="brand-handle">{handle}</span>
        </span>
        <span className="brand-subtitle">{subtitle}</span>
        <span className="brand-tagline">{tagline}</span>
      </Link>

      <nav className="header-nav" aria-label="Primary">
        {navItems.map((item) => (
          <Link className="header-link" href={item.href} key={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
