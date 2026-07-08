import { useState } from "react";
import { recoverMessageAddress } from "viem";

const DOMAIN = "ARRA-MQTT/v1";

type Eip1193 = { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> };
function provider(): Eip1193 | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { ethereum?: Eip1193 };
  return w.ethereum ?? null;
}

// Real Connect Wallet (EIP-1193). Connect → sign a live ArraMQ reading → verify.
// No wallet? Fall through to the ephemeral Playground below.
export default function ConnectWallet() {
  const [addr, setAddr] = useState<string | null>(null);
  const [status, setStatus] = useState<{ kind: string; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function connect() {
    const p = provider();
    if (!p) {
      setStatus({ kind: "info", text: "ยังไม่มี wallet ในเบราว์เซอร์ — ลอง demo สดด้านล่างได้เลย ↓" });
      document.getElementById("playground")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setBusy(true);
    try {
      const accts = (await p.request({ method: "eth_requestAccounts" })) as string[];
      setAddr(accts[0] ?? null);
      setStatus({ kind: "ok", text: "เชื่อมต่อแล้ว — กด \"เซ็น reading\" เพื่อพิสูจน์ลายเซ็น" });
    } catch {
      setStatus({ kind: "bad", text: "ปฏิเสธการเชื่อมต่อ" });
    } finally {
      setBusy(false);
    }
  }

  async function signReading() {
    const p = provider();
    if (!p || !addr) return;
    setBusy(true);
    try {
      const ts = Math.floor(Date.now() / 1000);
      const topic = `arra/${addr.toLowerCase()}/readings`;
      const msg = `${DOMAIN}|data|${topic}|${ts}|waterDepthMm:142`;
      const sig = (await p.request({ method: "personal_sign", params: [msg, addr] })) as `0x${string}`;
      const recovered = await recoverMessageAddress({ message: msg, signature: sig });
      const ok = recovered.toLowerCase() === addr.toLowerCase();
      setStatus({
        kind: ok ? "ok" : "bad",
        text: ok ? `✅ ลายเซ็นจริงตรงกับ ${recovered.slice(0, 10)}…` : "❌ ลายเซ็นไม่ตรง",
      });
    } catch {
      setStatus({ kind: "bad", text: "ยกเลิกการเซ็น" });
    } finally {
      setBusy(false);
    }
  }

  const color = status?.kind === "ok" ? "var(--color-herb-deep)" : status?.kind === "bad" ? "var(--color-bad)" : "var(--color-ink-soft)";

  return (
    <div class="flex flex-wrap items-center gap-3">
      {!addr ? (
        <button onClick={connect} disabled={busy} style={cta()}>
          {busy ? "กำลังเชื่อม…" : "Connect Wallet"}
        </button>
      ) : (
        <button onClick={signReading} disabled={busy} style={cta()}>
          {busy ? "…" : "เซ็น reading"}
        </button>
      )}
      <a href={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/blog`} style={ghost()}>อ่านบันทึก →</a>
      {addr && <code style={{ fontSize: ".8rem", color: "var(--color-ink-soft)" }}>{addr.slice(0, 8)}…{addr.slice(-4)}</code>}
      {status && <span style={{ fontSize: ".82rem", color, width: "100%" }}>{status.text}</span>}
    </div>
  );
}

function cta(): React.CSSProperties {
  return {
    padding: "10px 20px", fontSize: ".95rem", fontWeight: 600, borderRadius: 8,
    border: "none", cursor: "pointer", background: "var(--btn-bg)", color: "var(--btn-fg)",
  };
}
function ghost(): React.CSSProperties {
  return {
    padding: "10px 16px", fontSize: ".95rem", fontWeight: 500, borderRadius: 8,
    border: "1px solid var(--color-herb-deep)", color: "var(--color-herb-deep)",
  };
}
