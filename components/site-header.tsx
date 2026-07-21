import Link from "next/link";
import { personalSiteContent } from "@/lib/personal-site-content";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="brand-lockup" href="/">
        <span className="brand-mark">Q</span>
        <span>
          <strong className="brand-title">{personalSiteContent.site.title}</strong>
          <span className="brand-subtitle">{personalSiteContent.site.subtitle}</span>
        </span>
      </Link>

      <nav className="header-nav" aria-label="Primary">
        <Link className="header-link" href="/">
          自我介绍
        </Link>
        <Link className="header-link" href="/ai-learning">
          AI 学习资料
        </Link>
        <Link className="header-link" href="/tools">
          小工具
        </Link>
        <div className="header-badge">Sydney / AI Product</div>
      </nav>
    </header>
  );
}
