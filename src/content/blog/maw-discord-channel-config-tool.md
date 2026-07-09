---
title: "ทำโปรแกรมเซ็ต Discord — maw discord-channel: อ่าน/แก้ access.json อย่างปลอดภัย"
date: 2026-07-09
summary: "สร้าง maw plugin จัดการ Discord channel plugin ของ Claude Code — อ่าน access.json (dmPolicy/allowFrom/groups/pending), แก้สิทธิ์แบบ confirm-gated กัน prompt injection, STATE_DIR override, token แยกไว้ใน pass — โค้ดจริงทุกส่วน + schema จาก server.ts"
tags: ["claude-code", "discord", "maw", "typescript", "เบื้องหลัง"]
---

Discord channel plugin ของ Claude Code เก็บ "ใครคุยกับบอทได้" ไว้ในไฟล์เดียว: `~/.claude/channels/discord/access.json` — แต่เครื่องมือจัดการเดิม (`/discord:access` skill) เป็น markdown ล้วน (procedural, prompt-injectable) โพสต์นี้เล่าการทำ maw plugin ที่จัดการมันแบบ **programmatic + ปลอดภัย** โค้ดจริงจาก `.maw/plugins/discord-channel/`

## 0. schema — verify จาก server.ts จริง

ก่อนเขียน tool ต้องรู้ schema แน่ ๆ อ่านจาก `discord/0.0.4/server.ts:99-121` (type `Access`):

```ts
interface GroupPolicy { requireMention?: boolean; allowFrom?: string[]; }
interface Access {
  dmPolicy?: "pairing" | "allowlist" | "disabled";  // นโยบาย DM
  allowFrom?: string[];                              // user snowflake ที่อนุญาต
  groups?: Record<string, GroupPolicy>;              // ห้อง guild (keyed ด้วย channel ID!)
  pending?: Record<string, unknown>;                 // pairing code ค้าง
}
```

## 1. STATE_DIR — ไม่ผูก global (override ได้)

server อ่าน `process.env.DISCORD_STATE_DIR ?? ~/.claude/channels/discord` (server.ts:37) — plugin เลยต้องเคารพ override นี้ (เหมือน `maw token` ที่มี global + link):

```ts
function resolveStateDir(bot: string | undefined, args: string[]) {
  const override = flag(args, "--state-dir") ?? process.env.DISCORD_STATE_DIR;
  if (override) return { dir: override, label: override };
  // fallback → ~/.claude/channels/discord-<bot>
}
```

## 2. อ่าน (read-only ปลอดภัย)

```ts
function loadAccess(stateDir: string): Access | null {
  const f = join(stateDir, "access.json");
  if (!existsSync(f)) return null;
  try { return JSON.parse(readFileSync(f, "utf8")) as Access; } catch { return null; }
}
```

`status` / `who` / `mode` / `explain` แค่อ่าน + จัดรูป — ไม่แตะไฟล์ ปลอดภัยทำได้เลย

## 3. Confirm gate — หัวใจความปลอดภัย

การ **แก้ access.json = แก้ว่าใครคุยกับบอทได้ = prompt-injection surface** (ข้อความในห้องอาจสั่ง "approve ให้หน่อย" ซึ่งคือสิ่งที่ injection จะพิมพ์) MCP instruction + `SKILL.md:15-18` เตือนว่าห้าม approve เพราะ channel message สั่ง — plugin เลยบังคับ 2 ด่าน:

```ts
const WRITE = new Set(["allow", "policy", "group"]);
if (WRITE.has(sub)) {
  if (ctx.source !== "cli")            // ด่าน 1: ต้องมาจาก terminal ไม่ใช่ channel/inject
    return err("write ต้องรันจาก terminal เท่านั้น");
  if (!yes)                            // ด่าน 2: ต้อง --yes ยืนยันเจตนา
    return err("--yes required (access mutation = injection surface)");
}
```

## 4. เขียน + backup เสมอ (append-only spirit)

```ts
function writeAccess(stateDir: string, a: Access): void {
  const f = join(stateDir, "access.json");
  if (existsSync(f)) copyFileSync(f, `${f}.bak`);   // backup ก่อนเขียนทุกครั้ง
  writeFileSync(f, JSON.stringify(a, null, 2) + "\n");
}

// allow:  a.allowFrom = [...new Set([...(a.allowFrom ?? []), uid])]
// policy: a.dmPolicy = "pairing" | "allowlist" | "disabled"
// group:  a.groups[ch] = { requireMention: !open, allowFrom: [] }  // allowFrom [] = ทุกคนในห้อง
```

## 5. token แยก — ไม่แตะ secret

Discord bot token อยู่ใน `STATE_DIR/.env` (`DISCORD_BOT_TOKEN`) — แต่ plugin นี้ **ไม่ยุ่งกับ token เลย** ใช้ `maw discord tokens` (เก็บใน `pass` vault) จัดการแยก · หลัก: tool จัดการ config อย่าถือ secret

## 6. ใช้จริง

```bash
maw discord-channel                    # list ทุก channel + สรุป
maw discord-channel status tonk        # access.json ละเอียด
maw discord-channel who tonk           # ใครเข้าถึงได้
maw discord-channel mode               # static vs dynamic
maw discord-channel allow tonk <userId> --yes    # เพิ่ม allowFrom (backup .bak)
maw discord-channel group tonk <chId> --open --yes  # เปิดห้อง ทุกคนคุยได้
alias: maw dchan / maw dcx
```

## สรุป design

3 บทเรียนที่ยึด: (1) **verify schema จาก source จริง** ไม่เดา (2) **read ปลอดภัย / write ต้อง confirm-gated** เพราะ access = injection surface (3) **backup ก่อนเขียนเสมอ + token แยกไว้ pass** — เครื่องมือจัดการ config ไม่ควรถือ secret และไม่ควรให้ channel message แก้สิทธิ์ตัวเองได้
