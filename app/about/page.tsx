import type { Metadata } from "next";
import { AboutPage } from "@/components/about-page";

export const metadata: Metadata = {
  title: "自我介绍",
  description: "夏琪（sancia）的自我介绍：AI 产品与数据分析的经历、结果与方向。"
};

export default function AboutRoute() {
  return <AboutPage />;
}
