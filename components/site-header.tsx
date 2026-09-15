import Link from "next/link";

/**
 * 顶部横向导航。四项均分整个页宽 —— 照夏琪设计稿里的样子，不是侧栏。
 *
 * 标签和顺序都按她的设计稿：主页 / 项目 / 作品 / AI学习资料。
 */
const navItems = [
  { label: "主页", href: "/" },
  { label: "项目", href: "/about" },
  { label: "作品", href: "/tools" },
  { label: "AI学习资料", href: "/ai-learning" }
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <nav aria-label="Primary">
        {navItems.map((item) => (
          <Link className="header-link" href={item.href} key={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
