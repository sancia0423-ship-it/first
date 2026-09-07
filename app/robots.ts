import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // These call upstream sources on every request; there is nothing to index.
        disallow: ["/api/", "/search"]
      }
    ],
    ...(siteUrl ? { sitemap: `${siteUrl.replace(/\/$/, "")}/sitemap.xml` } : {})
  };
}
