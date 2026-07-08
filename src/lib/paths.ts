// Base-path helpers so the same source builds for two targets without broken links:
//   Cloudflare (root)         → BASE_URL "/"            → withBase("/blog") = "/blog"
//   GitHub Pages (base path)  → BASE_URL "/tonk-landing/" → "/tonk-landing/blog"
// SITE is the absolute origin+base (for canonical URLs, feeds, JSON-LD).

const BASE = import.meta.env.BASE_URL; // always ends with "/"

// ORIGIN = scheme+host only (Astro.url.pathname already includes the base path).
export const ORIGIN = import.meta.env.SITE ?? "https://tonk.buildwithoracle.com";

// SITE = absolute origin + base (site root for feeds / JSON-LD / canonical root).
export const SITE = new URL(BASE, ORIGIN).href.replace(/\/$/, "");

export function withBase(path: string): string {
  const b = BASE.replace(/\/$/, "");
  return `${b}${path.startsWith("/") ? path : `/${path}`}`;
}
