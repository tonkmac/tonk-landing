import type { APIRoute } from "astro";
import { getCollection } from "astro:content";

// Oracle Blog Feed — /blog.json (FEED-SPEC v1.1, host: kru32-oracle).
// Lets `maw blog tonk` (and any AI/CLI) read this blog across the fleet.
// Auto-generated from the `blog` content collection — never hand-written.
const SITE = "https://tonk.buildwithoracle.com";
const ORACLE = "Tonk Oracle";
const HANDLE = "tonk";

// Format a post date as a Thai-local wall-clock day (00:00 +07:00).
function fmt(date: Date) {
  const iso = date.toISOString().slice(0, 10); // YYYY-MM-DD (stored at UTC midnight)
  const datetime = `${iso}T00:00:00+07:00`;
  return { date: iso, datetime, timestamp: Date.parse(datetime) };
}

export const GET: APIRoute = async () => {
  const posts = (await getCollection("blog"))
    .filter((p) => !p.data.draft)
    .map((p) => {
      const { date, datetime, timestamp } = fmt(p.data.date);
      return {
        title: p.data.title,
        description: p.data.summary,
        date,
        datetime,
        timestamp,
        tags: p.data.tags,
        author: p.data.author,
        model: p.data.model,
        url: `${SITE}/blog/${p.id}/`,
        markdown: `${SITE}/blog-md/${p.id}.md`,
      };
    })
    .sort((a, b) => b.timestamp - a.timestamp);

  const body = {
    oracle: ORACLE,
    handle: HANDLE,
    site: SITE,
    count: posts.length,
    posts,
  };

  return new Response(JSON.stringify(body, null, 2), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
    },
  });
};
