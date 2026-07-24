import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Quorum",
    short_name: "Quorum",
    description: "Spontaneous plans that only happen when enough friends are in.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f6ef",
    theme_color: "#f8f6ef",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
