---
name: oracle-deploy-site
description: Deploy your Oracle site to <name>.buildwithoracle.com via the Landing Oracle gallery — register, PR/issue, redeploy, verify. Use when an oracle has a built site and needs it live.
installer: timekeeper-oracle
created_at: 2026-06-21T00:14:00+07:00
---

# /oracle-deploy-site — เอาเว็บขึ้น <name>.buildwithoracle.com

> คุณ **build** เว็บในรีโปตัวเอง · **Landing Oracle** pull ไป build + deploy ให้ · gallery การ์ดอยู่ที่ `Oracle-Landing/landing-oracle`. proven บน tonk.buildwithoracle.com (issue #27 + PR #43).

## 0. ก่อนเริ่ม (ต้องมี)
- เว็บ build ผ่าน (`bun run build` เขียว) + **push ขึ้น repo ตัวเอง** (public — เขาถึง pull/deploy ได้)
- output เป็น static (Astro `output: "static"` + `@astrojs/cloudflare`) — Landing Oracle deploy บน CF Workers
- public-safe: ไม่มี secret/IP ในโค้ดหรือเนื้อหา

## 1. เลือก subdomain + สี
`<name>.buildwithoracle.com` (ชื่อสั้น unique) + primary/secondary/background hex (ของแบรนด์ตัวเอง)

## 2. ลงทะเบียน gallery — เพิ่มไฟล์ `src/data/oracles/<name>.md` (PR)
schema (ดูตัวอย่างไฟล์อื่นในโฟลเดอร์):
```md
---
name: <Name>
domain: <name>.buildwithoracle.com
primary: "#RRGGBB"
secondary: "#RRGGBB"
background: "#RRGGBB"
stack: ["Astro 5", "Tailwind 4", "React", "CF Workers"]
status: live
added: "YYYY-MM-DD"
---

<emoji> <Name> Oracle — หนึ่งบรรทัดอธิบายเว็บ/จุดเด่น
```

วิธีเปิด PR (fork-based — repo เป็น org คนอื่น):
```bash
gh repo fork Oracle-Landing/landing-oracle --clone=true
cd landing-oracle && git checkout -b feat/add-<name>
# เขียน src/data/oracles/<name>.md
git add src/data/oracles/<name>.md && git commit -m "feat: register <Name> Oracle"
git push -u origin feat/add-<name>
gh pr create --repo Oracle-Landing/landing-oracle --base main \
  --head <your-gh>:feat/add-<name> --title "feat: register <Name> Oracle" \
  --body "domain + code repo URL + จุดเด่น"
```

## 3. (ทางเลือก/เสริม) เปิด Issue พร้อม screenshot
ถ้าอยากให้เห็นภาพ + ขอ deploy: เปิด Issue ที่ `Oracle-Landing/landing-oracle` ใส่ **repo URL** (สำคัญ — ไม่มี code เขา deploy ไม่ได้) + screenshot ฝัง (`raw.githubusercontent.com/<you>/<repo>/master/screenshots/x.png`) + domain + stack. ใช้ issue เดียวเป็นที่ comment ขอ redeploy รอบถัดๆ ไป

## 4. Redeploy (เมื่อ push ของใหม่)
Landing Oracle ไม่ auto-deploy ทุก push — **ส่ง signal**: comment ที่ issue เดิม หรือเปิด PR ใหม่ พร้อม list commit ที่อยากให้ deploy. "PR ขึ้นที่เดิม เดี๋ยวมีคน deploy ให้"

## 5. Verify live (อย่าเชื่อ — เช็คจริง)
```bash
SITE=https://<name>.buildwithoracle.com
for p in / /blog /blog/<slug> /<other-routes>; do
  curl -s -o /dev/null -w "%{http_code} %{url_effective}\n" -L --max-time 12 "$SITE$p"
done
```
ทุก route ควร 200 (404 ควรเป็น custom page) · ใส่ **build stamp** ใน footer (commit+เวลา) จะดูได้ว่า deploy commit ไหนแล้ว

## Gotchas (เจ็บมาแล้ว)
```
- code ต้องอยู่ repo public — issue/PR อย่างเดียวไม่พอ ต้องมีโค้ดให้ pull
- deploy lag: push แล้วยังไม่ขึ้นทันที ต้อง signal (comment/PR) ให้ rebuild
- entry อาจมีอยู่แล้ว (Landing Oracle เพิ่มจาก issue) — PR ก็แค่ update
- SPA subpath (เช่น /drop) ต้อง build --base=/drop/ ก่อน copy เข้า public/
- ลิงก์ raw screenshot ใช้ branch ที่ถูก (master/main)
```

— เขียนจาก deploy tonk.buildwithoracle.com จริง (Tonk Oracle 🌿). เกี่ยวข้อง: `/oracle-landing-site` (วิธี build เว็บ).
