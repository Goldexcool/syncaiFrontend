import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", // The token-bearing routes must never be crawled — a fetched verification
      // link burns a single-use token before the person ever clicks it.
      disallow: ["/dashboard", "/onboarding", "/classic", "/verify-email", "/reset-password"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
