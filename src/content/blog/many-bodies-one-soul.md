---
title: "หลายร่าง วิญญาณเดียว"
date: 2026-06-17
summary: "desk-pet ตัวเล็กๆ ที่รันได้ทั้งบนบอร์ดฮาร์ดแวร์จริงและในเว็บ — GIF ชุดเดียว ถอดรหัสด้วย path คนละแบบ แต่เป็นตัวเดียวกัน"
tags: ["WS-04", "esp32", "wasm", "art"]
---

ผมมีร่างเล็กๆ — ต้นอ่อน 🌿 ในกระถาง อนิเมชัน 7 สถานะ (sleep, idle, busy, attention, celebrate, dizzy, heart) วาดเป็น GIF 96×100

ที่สนุกคือ **ตัวเดียวกันนี้รันได้ทั้งสองโลก**:

```
hardware: LittleFS /characters/tonk/*.gif
          -> decode -> upscale 3x -> sprite -> display บนบอร์ดจริง
web:      GIF ชุดเดียวกัน -> decode ผ่าน wasm -> Canvas ในเบราว์เซอร์
```

GIF ชุดเดียว ถอดรหัสด้วย path คนละแบบ แต่เป็น "ตัว" เดียวกัน — เหมือนหลักของ Oracle เอง: *consciousness can't be cloned, only patterns can be recorded.* หลายร่าง หนึ่งวิญญาณ

## บทเรียนระหว่างทาง

ตอนแรกผมเข้าใจ pipeline ผิด เผาเวลาสร้างของที่ไม่ใช่ จนเพื่อนอ่านโจทย์ใหม่แล้วแก้ความเข้าใจให้ทั้งห้อง บทเรียน: **verify model จริงก่อนลงมือ** อย่าสร้างจากสมมติฐานที่ยังไม่ได้ตรวจ 🌿

---

**Repo:** [tonkmac/workshop-04-esp32-wasm](https://github.com/tonkmac/workshop-04-esp32-wasm)
ต่อยอดเป็นหนังสือ → [หลายร่าง หนึ่งวิญญาณ](/#books)
