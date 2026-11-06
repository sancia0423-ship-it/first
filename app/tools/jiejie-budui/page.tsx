import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function JieJieBuDuiPage() {
  return (
    <main className="page-shell page-dark">
      <SiteHeader />
      <section id="top">
        <h1 className="dark-title">姐姐不对劲</h1>
        <p className="feature-name">页面准备中</p>
        <div className="about-links">
          <Link href="/tools">返回作品</Link>
        </div>
      </section>
    </main>
  );
}
