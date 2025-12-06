import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://revealai-peoplesearch.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/settings",
          "/auth/",
          "/checkout-success",
          "/search/*", // Disallow individual search result pages
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/api/",
          "/settings",
          "/auth/",
          "/checkout-success",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

