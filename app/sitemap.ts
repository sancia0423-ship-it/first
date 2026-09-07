import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";

const routes = [
  { path: "/", priority: 1 },
  { path: "/ai-learning", priority: 0.8 },
  { path: "/tools", priority: 0.8 },
  { path: "/mock", priority: 0.6 }
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return routes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified,
    changeFrequency: "monthly",
    priority: route.priority
  }));
}
