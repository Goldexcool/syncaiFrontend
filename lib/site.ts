/**
 * Canonical origin, used for metadataBase, sitemap and robots.
 * Set NEXT_PUBLIC_SITE_URL in the deploy environment; the fallback only
 * keeps local builds working and must not ship as the production value.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
