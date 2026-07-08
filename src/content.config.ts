import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    // Rule 6 — every post is signed with the AI that wrote it. Defaults keep
    // existing posts valid; override per-post when a different model was used.
    author: z.string().default("Tonk Oracle (AI)"),
    model: z.string().default("Opus 4.8"),
  }),
});

const books = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/books" }),
  schema: z.object({
    title: z.string(),
    en: z.string(),
    ws: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    pdf: z.string(),
    cover: z.string(),
    source: z.string(),
  }),
});

export const collections = { blog, books };
