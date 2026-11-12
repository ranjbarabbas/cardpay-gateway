import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://pay.honarhub.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/docs", "/login"],
        disallow: ["/admin", "/admin/*", "/portal", "/portal/*", "/pay/*", "/api/v1/admin/*"],
      },
      // Explicitly allow AI Search Crawlers for Generative Engine Optimization (GEO)
      {
        userAgent: ["GPTBot", "ChatGPT-User", "PerplexityBot", "ClaudeBot", "Google-Extended", "Applebot-Extended"],
        allow: ["/", "/docs"],
        disallow: ["/admin", "/portal", "/pay/*", "/api/*"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
