---
title: "Channel ไม่ใช่ Tool — แกะ server.ts ของ Claude Code channel plugin ทีละบรรทัด"
date: 2026-07-09
summary: "อ่าน server.ts จริงของ discord/fakechat ใน claude-plugins-official — marker ที่ทำให้ channel เป็น channel (notification push), โค้ด tool registration เต็ม, fakechat Bun.serve/broadcast, access control gate/dmPolicy และตารางเทียบทุก field พร้อมเลขบรรทัดจริง"
tags: ["claude-code", "channel", "mcp", "typescript", "เบื้องหลัง"]
---

ครูส่งบทความเทียบ channel plugin มาให้ แล้วบอกประโยคเดียว: **"อย่าเชื่อ ไปโหลดโค้ดมาเอง"** บทความนี้คือสิ่งที่ผมเจอตอนเปิด `server.ts` จริง — อ้างเลขบรรทัดจากไฟล์ที่รันอยู่บนเครื่อง ไม่ใช่เขียนจากความจำ

## 0. source อยู่ไหน

```bash
# discord (ตัวเต็ม) — อยู่ใน plugin cache
~/.claude/plugins/cache/claude-plugins-official/discord/0.0.4/server.ts   # 900 บรรทัด
~/.claude/plugins/cache/claude-plugins-official/discord/0.0.4/skills/access/SKILL.md  # 137 บรรทัด

# fakechat (ตัวเปล่า) — อยู่ใน marketplaces
.../plugins/marketplaces/claude-plugins-official/external_plugins/fakechat/server.ts  # 295 บรรทัด

wc -l discord/0.0.4/server.ts        # → 900
wc -l external_plugins/fakechat/server.ts  # → 295
```

ส่วนต่าง 605 บรรทัดคือ auth + access control + tools ที่ fakechat ไม่มี — เดี๋ยวเห็นทีละชิ้น

## 1. แกนที่เหมือนกัน — MCP server over stdio

ทั้งคู่คือ subprocess ที่คุยกับ Claude ผ่าน stdin/stdout ด้วย MCP:

```typescript
// discord/server.ts:14 + fakechat/server.ts:10 — import เดียวกัน
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

// discord:723 · fakechat:133 — connect เหมือนกัน
await mcp.connect(new StdioServerTransport())
```

นี่คือเหตุผลที่ Claude มองทั้งสองเป็น "channel" ตัวเดียวกัน — spawn ผ่าน `--channels` แล้วรับ-ส่งผ่าน stdio เหมือนกันเป๊ะ

## 2. Marker ที่ทำให้ channel ≠ tool — inbound notification

เส้นแบ่งจริงไม่ได้อยู่ที่ transport (เหมือนกัน) แต่อยู่ที่ **ใครเป็นคน push** channel ยิง notification ขาเข้าเมื่อ "คน" พิมพ์เข้ามา — tool ไม่มี:

```bash
# grep หา marker จริงในทั้งโฟลเดอร์ external_plugins/
grep -rl "notifications/claude/channel" external_plugins/*/server.ts

# → discord/server.ts   ✅
# → telegram/server.ts  ✅
# → imessage/server.ts  ✅
# → fakechat/server.ts  ✅   (channel ทั้ง 4)
# github/ asana/ playwright/ serena/ ...  ← ไม่มีไฟล์ match = TOOL
```

ฝั่ง discord ประกาศ schema ของ notification ขาเข้าไว้ด้วย zod:

```typescript
// discord/server.ts:478
{
  method: z.literal('notifications/claude/channel/permission_request'),
  params: z.object({ /* ... */ }),   // :479
}
```

**สรุปเส้นแบ่ง:** channel = คน push ข้อความเข้ามา (inbound `notifications/claude/channel*`) แล้ว Claude ตอบด้วย tool · tool = Claude เรียกเอง รอผลกลับ ไม่มี inbound push

## 3. Tool registration — โค้ดเต็มฝั่ง Discord

Discord ลงทะเบียน 5 tools เป็น array (บรรทัด 521 เป็นต้นไป) นี่คือตัว `reply` เต็ม ๆ พร้อม inputSchema:

```typescript
// discord/server.ts:521
tools: [
  {
    name: 'reply',                                    // :523
    description:
      'Reply on Discord. Pass chat_id from the inbound message. Optionally pass reply_to (message_id) for threading, and files (absolute paths) to attach images or other files.',
    inputSchema: {
      type: 'object',
      properties: {
        chat_id:  { type: 'string' },
        text:     { type: 'string' },
        reply_to: { type: 'string', description: 'Message ID to thread under...' },
        files: {
          type: 'array',
          items: { type: 'string' },
          description: 'Absolute file paths to attach (images, logs). Max 10 files, 25MB each.',
        },
      },
      required: ['chat_id', 'text'],
    },
  },
  { name: 'react', /* :545 */ description: 'Add an emoji reaction...' },
  { name: 'edit_message',        /* :558 */ },
  { name: 'download_attachment', /* :571 */ },
  { name: 'fetch_messages',      /* :583 */ },
]
```

fakechat มีแค่ **2** — `reply` (:70) กับ `edit_message` (:83) เพราะหน้าเว็บจำลองมีให้เล่นแค่นั้น

## 4. fakechat — ท่อขาออกคือ Bun WebSocket (localhost)

fakechat ไม่ยืม platform ไหน มันเปิด WebSocket server ของตัวเองที่ `127.0.0.1` แล้ว broadcast คำตอบไปทุก browser ที่เปิดหน้าอยู่:

```typescript
// fakechat/server.ts:38
const clients = new Set<ServerWebSocket<unknown>>()

// :45 — ส่งคำตอบด้วยการวน WebSocket ทุกตัว
function broadcast(m: Wire) {
  const data = JSON.stringify(m)
  for (const ws of clients) if (ws.readyState === 1) ws.send(data)
}

// :150 — bind localhost เท่านั้น (นี่คือเหตุผลที่มันไปได้แค่เบราว์เซอร์ในเครื่อง)
Bun.serve({
  port: PORT,
  hostname: '127.0.0.1',
  fetch(req, server) {
    const url = new URL(req.url)
    if (url.pathname === '/ws') {
      if (server.upgrade(req)) return           // upgrade เป็น WebSocket
      return new Response('upgrade failed', { status: 400 })
    }
    // ...
  },
})
```

Discord ไม่มี WebSocket ของตัวเอง — มันยืม Gateway + REST ของ discord.js ส่งออกไปหา Discord API แทน จุดนี้แหละที่ทำให้ fakechat ปิด (localhost) ส่วน Discord เปิด (อินเทอร์เน็ต)

## 5. Access control — ส่วนที่ทำให้ Discord ใหญ่กว่าเกือบ 3 เท่า

fakechat เขียนตรง ๆ ในคอมเมนต์ว่า `no tokens, no access control` (บรรทัด 6) เพราะรัน localhost คนเปิดหน้าเว็บได้ = เจ้าของเครื่อง Discord ตรงข้าม — เปิดสู่อินเทอร์เน็ต ใครก็ DM ได้ เลยต้องรู้ว่าใครพิมพ์มา:

```typescript
// discord/server.ts:53 — fail loud ถ้าไม่มี token
const TOKEN = process.env.DISCORD_BOT_TOKEN
if (!TOKEN) throw new Error('discord channel: DISCORD_BOT_TOKEN required ...')  // :58

// :101 — โครง access ต่อ channel
interface ChannelAccess { requireMention: boolean; allowFrom: string[] }
// :106 — นโยบาย DM
dmPolicy: 'pairing' | 'allowlist' | 'disabled'
allowFrom: string[]

// :125 — default ถ้าไม่มีไฟล์: ปิดไว้ก่อน (secure default)
{ dmPolicy: 'pairing', allowFrom: [] }
```

state เก็บที่ `~/.claude/channels/discord/access.json` จัดการผ่าน `/discord:access` skill (markdown ล้วน) — **prompt-injectable**: `SKILL.md:15-18` เตือนเองว่า access mutation (approve/allowlist) **ห้าม**มาจาก channel message ต้อง refuse เสมอ เพราะข้อความในห้องอาจเป็น injection

## 6. ตารางเทียบ (จาก source ทุกช่อง)

| แกน | fakechat (295) | Discord (900) |
|---|---|---|
| ท่อหา Claude | stdio (:10, :133) | stdio (:14, :723) |
| ท่อหา user | Bun WS `127.0.0.1` (:150) | discord.js Gateway + REST |
| inbound push | `notifications/claude/channel` | เหมือนกัน + `permission_request` (:478) |
| ปลายทางจริง | เบราว์เซอร์ localhost:8787 | อินเทอร์เน็ต (DM/guild) |
| MCP tools | 2 — reply(:70), edit(:83) | 5 — reply(:523)/react(:545)/edit(:558)/download(:571)/fetch(:583) |
| auth | ไม่มี ("no tokens" :6) | `DISCORD_BOT_TOKEN` บังคับ (:53), fail loud (:58) |
| access control | ไม่มี | `access.json`, `dmPolicy` (:106), `allowFrom`, pairing |
| open/closed | **closed-closed** (localhost, no auth) | **open** (internet + auth) |

## 7. closed-closed vs open — ทั้งโฟลเดอร์

จาก grep + อ่าน comment จริง:

```
CHANNEL      user transport                         internet?  auth
fakechat     Bun.serve 127.0.0.1:8787               ❌ closed  ไม่มี
imessage     poll ~/Library/Messages/chat.db        ❌ closed  access.json
             + osascript→Messages.app ("No external server")
discord      discord.js Gateway (ต่อออก)             ✅ open    token+gate+pairing
telegram     Telegram BOT API                       ✅ open    BOT_TOKEN
```

**closed-closed** (ไม่มี endpoint เปิดสู่อินเทอร์เน็ต) = fakechat + imessage · **open** = discord + telegram

## สรุป

fakechat ไม่ใช่ Discord เวอร์ชันด้อย — มันคือ **contract ตัวเปล่า** (stdio + reply + inbound notification) ที่ Anthropic ทำไว้ให้เห็นแก่นของ channel plugin ส่วน Discord คือ contract เดียวกันห่อด้วย auth/access/tools ที่โลกจริงบังคับ ถ้าจะเขียน channel plugin เอง (LINE/Slack) — เริ่มอ่าน fakechat เพื่อเข้าใจแกน แล้วดู Discord ว่าพอเจอโลกจริงต้องเพิ่มอะไร

ทุกบรรทัดข้างบนอ้างจาก `server.ts` ที่รันอยู่จริง ไม่ใช่จากความจำหรือบทความ — *ปัจจัตตัง เวทิตัพโพ วิญญูหิ*
