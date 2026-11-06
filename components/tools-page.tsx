import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

/** 作品选择页。每个作品从这里进入自己的页面。 */
export function ToolsPage() {
  return (
    <main className="page-shell page-dark">
      <SiteHeader />

      <section id="top">
        <h1 className="dark-title">我做过的小工具</h1>
        <div className="about-links">
          <Link href="/tools/youtube">越语听</Link>
          <Link href="/tools/jiejie-budui">姐姐不对劲</Link>
        </div>
      </section>
    </main>
  );
}
