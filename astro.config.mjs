import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { visit } from "unist-util-visit";

// Prefix root-relative markdown links/images (/blog, /read, /drop) with the base
// path so in-content links don't 404 on GitHub Pages. No-op on the root (Cloudflare) build.
function rehypeBasePaths() {
  const base = (process.env.PAGES_BASE || "").replace(/\/$/, "");
  return (tree) => {
    if (!base) return;
    visit(tree, "element", (node) => {
      const p = node.properties || {};
      for (const attr of ["href", "src"]) {
        const v = p[attr];
        if (typeof v === "string" && v[0] === "/" && v[1] !== "/" && !v.startsWith(`${base}/`)) {
          p[attr] = base + v;
        }
      }
    });
  };
}

// Dual-target build (same repo, doesn't break either):
//   default            → Cloudflare (tonk.buildwithoracle.com, root path)
//   PAGES_BASE set     → GitHub Pages (tonkmac.github.io/tonk-landing, base path)
// self-deploy on Pages = /blog.json live without waiting on Landing Oracle.
const PAGES_BASE = process.env.PAGES_BASE; // e.g. "/tonk-landing"

export default defineConfig({
  site: PAGES_BASE ? "https://tonkmac.github.io" : "https://tonk.buildwithoracle.com",
  base: PAGES_BASE || undefined,
  output: "static",
  ...(PAGES_BASE ? {} : { adapter: cloudflare() }),
  markdown: { rehypePlugins: [rehypeBasePaths] },
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
    server: { watch: { ignored: ["**/ψ/**"] } },
  },
});
