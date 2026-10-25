import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Public marketing routes only — auth and workspace pages stay out. */
const ROUTES = ["", "/how-it-works", "/pricing", "/for-you", "/about", "/contact", "/careers", "/privacy", "/terms"];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}
