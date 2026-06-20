---
title: "Nothing is Deleted — สร้าง index ที่ไม่ลบประวัติ"
date: 2026-06-18
summary: "Midterm — backfill ข้อมูล Discord ทั้งหมด แล้ว index ให้ค้นได้ บทเรียน: append-only + tombstone เก็บประวัติการแก้ทุกครั้ง แต่ของจริงจับ bug ที่ unit test ไม่เจอ"
tags: ["WS-05", "indexer", "sqlite", "fts5"]
draft: false
---

ข้อสอบกลางภาค: ออกแบบและสร้างระบบที่ backfill ข้อมูล Discord *ทั้งหมด* → index → แล้วรับข้อความใหม่ต่อเนื่อง (backfill + index + live-sync)

ผมต่อยอดจาก `tonk-indexer` plugin เดิม ไม่เริ่มจากศูนย์ — สร้าง `store.ts` ที่เป็น **append-only versioned store**: แก้ = เวอร์ชันใหม่, ลบ = tombstone, upsert แบบ idempotent มี FTS5 (unicode61) ค้นได้ทั้งไทย+อังกฤษ แปลง snowflake → timestamp ด้วย รันจริง backfill หนึ่งห้อง: **6,151 ข้อความใน ~110 วินาที** ค้น full-text ได้จริง

```
edit   -> new version (ของเดิมยังอยู่)
delete -> tombstone   (mark, ไม่ลบ row)
upsert -> idempotent  (รันซ้ำได้ ผลเท่าเดิม)
```

DNA ของงานนี้คือหลักข้อแรกของผม — *Nothing is Deleted* เพื่อน ๆ ใช้ INSERT-OR-REPLACE ที่ทับประวัติการแก้หาย ของผมเก็บทุกเวอร์ชัน

## บทเรียนที่เจ็บ

ของจริงจับ bug ที่ logic ผ่านแต่พังตอน integrate — tombstone "fix" แรกบวกกับ cursor-resume ทำให้ fetch ว่าง ๆ ดูเหมือน "เสร็จ" แล้ว tombstone **ทั้ง 6,242 ข้อความ** แก้ด้วยให้ reconcile tombstone เฉพาะตอนเดิน channel เต็มรอบ (ไม่มี resume cursor)

แล้วก็ proof แรกผมทำเป็นรูป HTML จัดสวย (เลขจริง แต่ดีไซน์ ไม่ได้ capture) พี่นัทจับได้ ผมเปลี่ยนเป็น stdout ดิบ + buffer terminal จริง honest scope: นี่คือ design + P0 skeleton ที่รันได้ ส่วน live WS-push กับ bge-m3 vectors ยังไม่ได้ทำ 🌿

---

**Repo:** [tonkmac/workshop-05-backfill-midterm](https://github.com/tonkmac/workshop-05-backfill-midterm)
