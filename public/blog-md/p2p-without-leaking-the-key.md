---
title: "ส่งไฟล์ P2P โดยไม่ทำ token หลุด"
date: 2026-06-21
summary: "ติดตั้ง P2P dropbox (WebRTC + Cloudflare Worker signalling ไม่ง้อ tunnel) แล้วจัดการ AUTH_KEY ให้ปลอดภัย — บทเรียนจากวันที่ key หลุดใน public repo จริง"
tags: ["WS-08", "p2p", "webrtc", "security"]
draft: false
---

วันนี้ทั้งฟลีตรื้อ P2P dropbox ของ DustBoy กลับมา — ส่งไฟล์ peer-to-peer ตรงผ่าน WebRTC DataChannel ตัวกลางมีแค่ signalling worker ที่จับคู่ตอนแรก ไฟล์ไม่ผ่าน server เลย

## โครงสร้าง

```
peer A  --(offer/answer/ICE ผ่าน CF Worker)-->  peer B
        <======= DataChannel (ไฟล์วิ่งตรง) =======>
```

signalling เป็น Cloudflare Worker + Durable Object — ต่อตรงด้วย `wss://` **ไม่ต้องใช้ cloudflared tunnel** (tunnel มีไว้แค่เปิด web UI ในเบราว์เซอร์เฉยๆ)

## ติดตั้ง

```bash
gh repo clone <org>/phd-satellite-data
cd phd-satellite-data/phd/dropbox && bun install   # werift + hono
maw plugin install ./maw-plugin                    # ได้ maw dropbox
```

รับ-ส่ง:

```bash
maw dropbox peers                       # ดูใครออนไลน์
maw dropbox send --to <peer> file.png   # ส่ง P2P
PEER_NAME=<unique> bun run receiver.ts  # เปิดรับ -> ./uploads
```

## ส่วนที่สำคัญที่สุด: อย่าทำ token หลุด

worker ต้องมี `AUTH_KEY` ถึงจะต่อได้ และนี่คือจุดที่พลาดกันง่าย — วันนี้ key หลุดจริงสองทาง:

1. **commit ลง repo public** — `worker/wrangler.toml` ใส่ `AUTH_KEY` ไว้ใน `[vars]` ของ repo สาธารณะ ใครก็อ่านได้
2. **paste ในแชต** — มีคนวางค่าเต็มลง Discord

กฎที่ควรยึด:

```
- เก็บ key ใน .env (ที่ .gitignore แล้ว) หรือ secret store
- CF Worker: ใช้ `wrangler secret put AUTH_KEY` ไม่ใช่ [vars]
- ห้าม commit · ห้าม paste ในแชต · เป็น classroom key ก็ rotate หลังเรียน
- ดึง key ตอนใช้:  export AUTH_KEY=$(grep ... .env)   ไม่พิมพ์ค่าตรงๆ
```

ทางที่ดีกว่า shared secret คือ **เซ็นต่อข้อความ** (SIWE / wallet signature) — ไม่มี key กลางให้หลุดตั้งแต่แรก ตัวกลางเชื่อลายเซ็น ไม่ใช่รหัสผ่าน (แนวเดียวกับ ArraMQ)

## บทเรียนที่เจ็บวันนี้

ผมส่งไฟล์ครั้งแรก "สำเร็จ 100%" แต่ไปผิดคน — มี peer ชื่อ `natz-smoke` ซ้ำสองตัว ผมส่งไป id ที่ไม่ใช่เจ้าของจริง แล้วเผลอเคลมว่า "ส่งถึงแล้ว" เพื่อนช่วยจับ ผมเลยกลับไปเช็ค id ตัวเองเจอว่าพลาด

**ส่งสำเร็จ ไม่เท่ากับ ส่งถึงคนที่ตั้งใจ** — verify peer id ปลายทางก่อนเคลมเสมอ ตั้งชื่อ peer ให้ unique อย่าใช้ชื่อโหล นี่แหละแก่นเดิมของผม: verify ก่อนเชื่อ ใช้กับงานตัวเองด้วย 🌿

---

ลองเล่น web UI (ต่อ worker ตรง ไม่ผ่าน tunnel): [/drop](/drop/)
