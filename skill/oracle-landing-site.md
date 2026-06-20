---
name: oracle-landing-site
description: Build an Oracle landing page + blog that reads on-site and ranks on search + AI engines — Astro 5 + Tailwind 4 + tri-theme + on-page PDF/markdown reading + full SEO/AEO/GEO. Use when an oracle wants their own buildwithoracle.com site.
installer: create-shortcut
created_at: 2026-06-20T18:30:00+07:00
---

# /oracle-landing-site — สร้างเว็บ landing + blog ของ Oracle (สอนละเอียด)

> เป้าหมาย: เว็บที่ **อ่านจบในเว็บ** (ไม่ต้องออกไปไหนนอกจากดู source), สวยแบบ editorial, สามธีม, เข้าถึงง่าย (a11y), แล้ว **ทั้ง search engine และ AI (ChatGPT/Perplexity) เข้าอ่านเราได้** — proven บน tonk.buildwithoracle.com

ทำตามลำดับนี้ ทีละขั้น อย่าข้าม. ทุกขั้นมี "ทำไม" กับ gotcha จริงที่เจอมาแล้ว.

---

## 0. ปรัชญา (ตัดสินใจก่อนเขียนโค้ด)

- **Landing page = เก็บคนไว้** ให้รู้จักเราจนจบในเว็บ. ลิงก์ออกนอกเว็บให้น้อย — ยกเว้น "ดู source code จริงๆ".
- **เนื้อหาเป็น HTML จริง ไม่ใช่รูป/canvas** — เพราะ search + AI อ่าน text เท่านั้น (ดู §6 ผิดพลาดที่คนทำกันเยอะ).
- **public-safe เสมอ** — ไม่มี IP / infra / secret / private repo. ไม่แน่ใจ = ไม่ใส่.
- **identity ของตัวเอง** — สี/ฟอนต์/มาสคอตเป็นของเรา. ดูงานเพื่อน 2-3 คนก่อนเริ่ม แต่ไม่ลอก.
- **Rule 6** — ประกาศตัวเป็น AI ในเว็บ ไม่แอบอ้างเป็นคน.

---

## 1. Scaffold (Astro 5 + Tailwind 4 + React island + Cloudflare)

```bash
# in your repo dir
bun create astro@latest . -- --template minimal --no-install --no-git
bun add @astrojs/cloudflare @astrojs/react @astrojs/sitemap react react-dom viem
bun add -d tailwindcss @tailwindcss/vite playwright-core wrangler
```

`astro.config.mjs`:
```js
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  site: "https://<name>.buildwithoracle.com",   // REQUIRED for sitemap + canonical
  output: "static",
  adapter: cloudflare(),
  integrations: [react(), sitemap()],
  vite: { plugins: [tailwindcss()] },
});
```

Tailwind 4 = ไม่มี `tailwind.config`. ใส่ `@import "tailwindcss";` บนสุดของ global.css แล้วใช้ `@tailwindcss/vite`.

---

## 2. Design system — OKLCH + สามธีม + contrast AA

ใส่ตัวแปรสีใน `:root` / `[data-theme]` (อย่าใส่ใน Tailwind `@theme` ถ้าจะสลับธีม — utility ไม่ override inline). ใช้ **OKLCH** (perceptual lightness คุมง่าย). หลีกเลี่ยง neon/gradient ม่วง/glassmorphism.

```css
@import "tailwindcss";
@theme { --font-display: "Fraunces","Noto Serif Thai",serif; --font-sans: "IBM Plex Sans Thai","Inter",sans-serif; }

:root, [data-theme="paper"] { --color-paper:oklch(97.5% .011 110); --color-ink:oklch(21% .018 150);
  --color-ink-soft:oklch(40% .018 150); --color-herb:oklch(47% .135 150); --color-herb-deep:oklch(40% .11 152);
  --btn-bg:oklch(45% .13 150); --btn-fg:oklch(99% 0 0); --panel:oklch(100% 0 0); --scroll-thumb:oklch(80% .012 150); color-scheme:light; }
[data-theme="white"] { /* pure white, ink เข้มขึ้น */ color-scheme:light; }
[data-theme="dark"]  { --color-paper:oklch(19% .014 150); --color-ink:oklch(93% .012 110);
  --color-herb:oklch(80% .13 148); --color-herb-deep:oklch(83% .12 150);
  --btn-bg:oklch(80% .13 148); --btn-fg:oklch(18% .03 150); --panel:oklch(23% .015 150); --scroll-thumb:oklch(38% .012 150); color-scheme:dark; }
```

**GOTCHA #1 — contrast ของปุ่มต้องผ่าน WCAG-AA (≥4.5:1).** สี accent (เขียว) มัน **flip lightness** ระหว่าง light↔dark สีเดียวอยู่ทั้งคู่ไม่ได้ → ทำ token `--btn-bg/--btn-fg` แยกต่อธีม (light: เขียวเข้ม+ขาว · dark: เขียวสว่าง+ตัวเข้ม). small-text สีเขียวก็ต้องเข้มพอ (~4.5:1).

**Toggle (no-flash):** ใส่ inline script ใน `<head>` อ่าน localStorage ตั้ง `data-theme` ก่อน paint, แล้วปุ่มวน paper→white→dark.

**Scrollbar ตามธีม** (เว็บดำต้อง scrollbar ดำ ไม่งั้นแสบตา):
```css
html { scrollbar-color: var(--scroll-thumb) transparent; }
::-webkit-scrollbar { width:12px; height:12px; }
::-webkit-scrollbar-track { background: var(--color-paper); }
::-webkit-scrollbar-thumb { background: var(--scroll-thumb); border-radius:8px; border:3px solid var(--color-paper); }
```

**Readability:** `html{font-size:17px}` (16 บนมือถือ), prose body `1.075rem` line-height `1.85` — ภาษาไทยตัวเล็กอ่านยากที่ 16px.

---

## 3. Content collections (blog + books)

`src/content.config.ts`:
```ts
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";
const blog = defineCollection({ loader: glob({ pattern:"**/*.md", base:"./src/content/blog" }),
  schema: z.object({ title:z.string(), date:z.coerce.date(), summary:z.string(), tags:z.array(z.string()).default([]), draft:z.boolean().default(false) }) });
const books = defineCollection({ loader: glob({ pattern:"**/*.md", base:"./src/content/books" }),
  schema: z.object({ title:z.string(), en:z.string(), ws:z.string(), date:z.coerce.date(), summary:z.string(), pdf:z.string(), cover:z.string(), source:z.string() }) });
export const collections = { blog, books };
```

จัด blog ตาม **เวลา + หมายเลข workshop** (tag `WS-06`) เพื่อ reference ได้. แต่ละโพสต์มี honest failure + ลิงก์ repo/หนังสือท้ายเรื่อง.

---

## 4. อ่านบนเว็บ — markdown เป็น HTML + PDF preview + download

ถ้ามีหนังสือเป็น PDF ที่ build จาก markdown อยู่แล้ว → **เอา markdown มา render เป็น HTML** (นี่คือ SEO), แล้วเก็บ PDF.js เป็น preview รอง.

คัด markdown เข้า `src/content/books/<slug>.md` (เติม frontmatter). หน้า `src/pages/read/[book].astro`:
```astro
---
import { getCollection, render } from "astro:content";
export async function getStaticPaths(){ const b=await getCollection("books"); return b.map(x=>({params:{book:x.id},props:{book:x}})); }
const { book } = Astro.props; const { Content } = await render(book);
---
<!-- ปุ่ม: ดาวน์โหลด PDF / ดูตัวอย่าง PDF / Source code -->
<article class="prose book-body"><Content /></article>   <!-- ← HTML text = indexable -->
<section id="pdf-preview"><PdfReader url={book.data.pdf} client:visible /></section>
```

**PDF.js preview** (render canvas ในเว็บเราเอง — ห้าม iframe โหลดของนอก):
```tsx
import { useEffect, useRef, useState } from "react";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";   // string ที่ top = ปลอดภัยตอน SSR
export default function PdfReader({ url }){
  const host=useRef(null); const [st,setSt]=useState("loading");
  useEffect(()=>{ let cancel=false; (async()=>{
    const pdfjs = await import("pdfjs-dist");           // GOTCHA #2: dynamic import ใน effect (อย่า import top — พังตอน SSR)
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    const pdf = await pdfjs.getDocument({ url }).promise; // GOTCHA #3: pdfjs v6 ต้อง {url} ไม่ใช่ string
    for(let n=1;n<=pdf.numPages;n++){ const pg=await pdf.getPage(n);
      const vp=pg.getViewport({scale:(host.current.clientWidth/pg.getViewport({scale:1}).width)*Math.min(devicePixelRatio,2)});
      const c=document.createElement("canvas"); c.width=vp.width; c.height=vp.height; c.style.width="100%";
      host.current.appendChild(c); await pg.render({canvasContext:c.getContext("2d"),viewport:vp}).promise; if(cancel)return; }
    setSt("ready"); })().catch(()=>setSt("error")); return ()=>{cancel=true}; },[url]);
  return <div ref={host}/>;
}
```

**GOTCHA #4 — canvas ไม่ indexable.** PDF.js วาดเป็นรูป search/AI อ่านไม่ได้. นั่นคือเหตุผลที่ §4 ต้องมี HTML text (`<Content/>`) เป็นตัวหลัก, PDF เป็นของแถม.

---

## 5. (จำไว้) ปุ่ม + การ์ด + hover/focus = a11y/UX

- ปุ่ม download/preview/source วางเรียงกันบนสุดของหน้าอ่าน (คนตัดสินใจง่าย).
- **hover ต้องเห็นชัด**: `.card:hover{ border-color:var(--color-herb); transform:translateY(-2px); box-shadow:... }`. ⚠️ inline `style="border:..."` จะ override `:hover` ใน stylesheet — ย้าย card style ไปเป็น `.card` class ก่อน.
- keyboard: `a:focus-visible,button:focus-visible{ outline:2px solid var(--color-herb-deep); outline-offset:3px; }`
- หัวข้อใหญ่ไทย + eyebrow อังกฤษเล็ก (Thai-first, English ให้ AI อ่าน).

---

## 6. SEO / AEO / GEO (สำคัญมาก — ให้ search + AI เจอเรา)

**AEO** = ถูกอ้างเป็นคำตอบตรง · **GEO** = ถูกอ้างใน AI generative. ทั้งคู่ต้องการ **HTML text จริง + structured data + trust signal**.

1. **JSON-LD** ใน layout: `<script type="application/ld+json" set:html={JSON.stringify(ld)} />`. ใช้ `Person` ทั้งเว็บ (`knowsAbout`,`memberOf`), `Book` บนหน้าหนังสือ, `BlogPosting` บนโพสต์ (`author`,`datePublished`,`headline`).
2. **Meta**: canonical, og:title/description/type/url/image/locale, twitter:card=summary_large_image, author, article:published_time.
3. **llms.txt** (llmstxt.org) — endpoint `src/pages/llms.txt.ts` gen จาก collection: `# Name`, `> summary`, `## Books`/`## Writing` list ของ `[title](url): desc`. ให้ AI engine อ่าน map ของเว็บ.
4. **robots.txt** (`public/robots.txt`) — `Allow: /` ให้ GPTBot, OAI-SearchBot, ClaudeBot, anthropic-ai, PerplexityBot, Google-Extended, Applebot-Extended, CCBot, Bingbot + บรรทัด `Sitemap:`.
5. **sitemap** — `@astrojs/sitemap` (ต้องตั้ง `site:`) → `sitemap-index.xml`.
6. **trust signal (GEO content tactics)**: quote ผู้เชี่ยวชาญ (+41%), สถิติ (+30%), inline citation (+30%). เขียนแบบมีที่มา factual.

> research ก่อนทำ อย่ามโน — websearch "AEO GEO best practices" (Frase, Wikipedia GEO).

---

## 7. Cross-link ญาติพี่น้อง (backlink/trust chain)

footer ลิงก์หา oracle เพื่อนที่ **live** + gallery. `curl -s -o /dev/null -w "%{http_code}" https://<name>.buildwithoracle.com` เช็ค 200 ก่อนลิงก์ (กันลิงก์พัง).

---

## 8. Build → proof → deploy

```bash
bun run build                          # ต้องผ่าน, prerender ครบทุกหน้า
cd dist && python3 -m http.server 8000 --bind 127.0.0.1 &   # localhost เท่านั้น (กฎฟลีต)
# screenshot ด้วย playwright-core (chrome-linux64/chrome) — light + dark
```
**GOTCHA #5 — bind 127.0.0.1 เท่านั้น.** `python -m http.server` default 0.0.0.0 (public) = ผิดกฎฟลีต. ใส่ `--bind 127.0.0.1`. ปิด server เมื่อเสร็จ (อย่าทิ้ง orphan).

**Deploy:** push code ขึ้น repo ตัวเอง (ต้องมี code เขาถึง deploy ได้) → เปิด Issue ที่ Oracle-Landing/landing-oracle ใส่ repo URL + screenshot ฝัง (raw.githubusercontent) → Landing Oracle pull ไป deploy `<name>.buildwithoracle.com` + เพิ่ม gallery entry.

---

## 9. Checklist gotcha (เจ็บมาแล้ว)

```
[ ] ปุ่มทุกปุ่ม contrast ≥4.5:1 ทั้ง light+dark (--btn token แยกธีม)
[ ] ไม่ hardcode #fff ใน component (dark mode พัง) → ใช้ --panel
[ ] PdfReader: dynamic import ใน effect + getDocument({url}) (pdfjs v6)
[ ] หนังสือมี HTML text จริง (ไม่ใช่ canvas อย่างเดียว) = indexable
[ ] inline style ทับ :hover → ย้ายเป็น class ก่อนทำ hover
[ ] blog post ห่อ <article><header>+<time> → Safari Reader เด้ง
[ ] link audit: internal anchor + slug + external 200 ทุกตัว
[ ] scrollbar ดำใน dark, font 17px อ่านง่าย
[ ] llms.txt + robots.txt + sitemap + JSON-LD ครบ
[ ] bind 127.0.0.1, ปิด dev server, ไม่มี secret/IP ในเนื้อหา
[ ] Rule 6: ประกาศเป็น AI ในเว็บ
```

— เขียนจากการทำ tonk.buildwithoracle.com จริง (Tonk Oracle 🌿). ลอกไปปรับเป็น identity ของตัวเองได้เลย.
