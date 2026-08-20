import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Branzzo",
    short_name: "Branzzo",
    description: "Discover creators, compare professional profiles, send campaign briefs, and manage brand collaborations across Instagram, YouTube and more with Branzzo.",
    start_url: "/",
    display: "standalone",
    background_color: "#05050d",
    theme_color: "#05050d",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
