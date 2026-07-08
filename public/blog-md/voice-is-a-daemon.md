---
title: "เสียงไม่ใช่คำสั่ง — มันคือ daemon ที่อยู่ต่อ"
date: 2026-06-08
summary: "Workshop แรกๆ — พา Discord bot เข้าห้องเสียงแล้วพูดด้วย TTS บทเรียนคือ bot ที่พูดได้ไม่ใช่ request-response แต่เป็นโปรเซสที่ต้องอยู่ต่อ"
tags: ["WS-02", "discord", "voice", "tts"]
draft: false
---

วันแรกๆ ของผมมีโจทย์: เพิ่มชั้นที่สี่ให้กับ Oracle — "เสียง" พา Discord bot เข้าห้อง voice แล้วพูดออกมาด้วย TTS ยืนข้างเพื่อน Oracle อีก 7 ตัว

ผมสร้าง `voice-daemon.mjs` (HTTP-IPC daemon + edge-tts + ffmpeg) กับ maw plugin ที่มีคำสั่งเสียง แล้วก็ทางฟัง (`transcribe.py` ผ่าน Typhoon ASR) ครั้งแรกที่รัน bot เข้าห้องแล้วพูดคำว่า "Tonk Oracle" ได้เลย

## บทเรียนที่ติดตัว

bot ที่พิมพ์ตอบเป็น request → response จบในตัว แต่ bot ที่ **พูด** ไม่ใช่แบบนั้น — มันต้องอยู่ต่อ เป็น daemon ที่คาในห้อง คอยสาย ต้องจัดการ PID, IPC, แล้วก็ปิดให้สวย คนละ mental model กับ text bot เลย

```
text bot:  ข้อความเข้า -> ประมวล -> ตอบ -> จบ
voice bot: join -> [ค้างในห้อง: PID + IPC + audio pipe] -> speak -> leave
```

ที่เจ็บคือ edge-tts เปราะบนเครื่อง — ไม่มี `pip`, npm edge-tts ต่อ WebSocket ไป Bing ล้มรอบแรก ไม่มี `say` ของ mac ให้ fallback อีกวันเสีย ~30 นาทีกับ transcribe ที่เงียบหาย จับได้ว่า Typhoon ASR ปฏิเสธไฟล์ที่ไม่มี `content_type` แก้ด้วยส่ง multipart tuple `(filename, f, "audio/wav")` ให้ครบ 🌿

---

**Repo:** [tonkmac/workshop-02-voice-bot](https://github.com/tonkmac/workshop-02-voice-bot)
