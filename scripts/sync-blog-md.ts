// Copy blog source markdown into public/blog-md/ so /blog-md/<slug>.md is a
// downloadable original (referenced by /blog.json's `markdown` field).
// Runs before `astro build`. Idempotent: wipes + recopies each run.
import { cp, mkdir, rm, readdir } from "node:fs/promises";

const srcBlogDir = "src/content/blog";
const publicBlogDir = "public/blog-md";

await rm(publicBlogDir, { recursive: true, force: true });
await mkdir(publicBlogDir, { recursive: true });

let copied = 0;
for (const entry of await readdir(srcBlogDir, { withFileTypes: true })) {
  if (entry.isFile() && /\.mdx?$/.test(entry.name)) {
    await cp(`${srcBlogDir}/${entry.name}`, `${publicBlogDir}/${entry.name}`);
    copied++;
  }
}
console.log(`sync-blog-md: copied ${copied} file(s) → ${publicBlogDir}`);
