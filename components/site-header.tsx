import Link from "next/link";
import { portfolioContent } from "@/lib/portfolio-content";

export function SiteHeader() {
  const { navItems, site } = portfolioContent;

  return (
    <header className="site-header">
      <Link className="brand-lockup" href="/">
        <span className="brand-mark">{site.brandMark}</span>
        <span>
          <strong className="brand-title">{site.title}</strong>
          <span className="brand-subtitle">{site.subtitle}</span>
        </span>
      </Link>

      <nav className="header-nav" aria-label="Primary">
        {navItems.map((item) => (
          <Link className="header-link" href={item.href} key={item.label}>
            {item.label}
          </Link>
        ))}
        <div className="header-badge">{site.headerBadge}</div>
      </nav>
    </header>
  );
}
