import Link from "next/link";
import { personalSiteContent } from "@/lib/personal-site-content";

const navItems = [
  { label: "简介", href: "/" },
  { label: "学习资料", href: "/ai-learning" },
  { label: "小工具", href: "/tools" },
  { label: "模拟面试", href: "/mock" },
  { label: "API", href: "/api-docs" }
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand-lockup" href="/">
        <strong className="brand-title">{personalSiteContent.site.title}</strong>
        <span className="brand-subtitle">{personalSiteContent.site.subtitle}</span>
      </Link>

      <nav className="header-nav" aria-label="Primary">
        {navItems.map((item) => (
          <Link className="header-link" href={item.href} key={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>

      <p className="header-badge">悉尼 / AI 产品</p>
    </header>
  );
}
