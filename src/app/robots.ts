import type { MetadataRoute } from "next";

/**
 * Only the landing page is meant for search engines. Everything else is a
 * private, token-gated invite (plans, groups, join links, calendar exports),
 * so crawlers are kept out of them.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/e/", "/g/", "/new", "/api/"],
    },
    sitemap: "https://quorumeet.vercel.app/sitemap.xml",
    host: "https://quorumeet.vercel.app",
  };
}
