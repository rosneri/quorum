import type { MetadataRoute } from "next";

/**
 * Plans and groups live behind private invite tokens, so the public sitemap is
 * just the landing page.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://quorumeet.vercel.app",
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
