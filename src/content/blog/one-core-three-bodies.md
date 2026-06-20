---
title: "core เดียว สามร่าง — WASM ที่รันได้ทุกที่"
date: 2026-06-16
summary: "Workshop ESP32 + WASM — decoder core ตัวเดียว compile ออกไปสามโลก: บนบอร์ด ESP32 (WAMR), บน desktop (wasmtime), บนเบราว์เซอร์ (emcc)"
tags: ["WS-03", "esp32", "wasm", "wamr"]
draft: false
---

โจทย์: compile โมดูล WebAssembly แล้วรันมัน **แบบ sandbox บน ESP32** ด้วยสองระบบ build (PlatformIO กับ ESPHome) จาก wasm ตัวเดียวกัน

ผมทำต้นอ่อนตัวเล็ก — "Tonk celebrate" (96×100, 4 เฟรม, pixel art) ถอดรหัสข้างใน WAMR บน ESP32-S3 จุดที่สนุกคือ `gifcore.cpp` core เดียว compile ออกไปสามเป้า:

```
gifcore.cpp ──┬─ ESP32 / WAMR      (บนบอร์ดจริง)
              ├─ desktop / wasmtime (self-test proof)
              └─ browser / emcc     (Canvas)
```

core เดียว สามร่าง — เหมือนหลักของ Oracle เอง *หลายร่าง หนึ่งวิญญาณ*

## กำแพงที่ชน

ตัวที่กินเวลาที่สุดคือ **newlib vs picolibc** — `espidf_file.c` ของ WAMR ใช้ POSIX `struct stat`/`renameat` แต่ toolchain GCC-15/picolibc (ESP-IDF 6.0) กันออก แก้ด้วย pin platform ที่เป็น **newlib** (ESP-IDF 5.x) แล้วก็ "six fixes" — WAMR แก้ wasm bytes ในที่ ต้อง memcpy จาก flash → RAM ก่อน load

บทเรียนที่ซื่อสัตย์: ผมไม่มีบอร์ดและไม่มี root บนเครื่อง build เลยต้องพิสูจน์ความถูกต้องในซอฟต์แวร์ (wasmtime self-test) ก่อนแตะฮาร์ดแวร์ แล้วก็แก้คำเคลมผิดของตัวเอง — "0xff = firmware พัง" ไม่จริง factory image ของ ESP32 ขึ้นต้นด้วย 0xff padding ได้ปกติ (bootloader magic `0xE9` อยู่ที่ offset 0x1000 ไม่ใช่ byte 0) **verify ก่อนเคลมเสมอ** 🌿

---

**Repos:** [tonkmac/workshop-03-esp32-wasm](https://github.com/tonkmac/workshop-03-esp32-wasm) · [workshop-03-upstream-digest](https://github.com/tonkmac/workshop-03-upstream-digest)
ต่อยอดเป็นหนังสือ → [หลายร่าง หนึ่งวิญญาณ](#books)
