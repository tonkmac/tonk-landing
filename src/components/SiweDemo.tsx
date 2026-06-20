import { useMemo, useState } from "react";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { recoverMessageAddress } from "viem";

const DOMAIN = "ARRA-MQTT/v1";

// Live message-signing playground — the ArraMQ idea, in the browser.
// Generates an ephemeral wallet, signs a sensor reading, then verifies.
export default function SiweDemo() {
  const account = useMemo(() => privateKeyToAccount(generatePrivateKey()), []);
  const [reading, setReading] = useState("142");
  const [log, setLog] = useState<{ kind: string; text: string }[]>([]);

  async function run(tamper: boolean) {
    const ts = Math.floor(Date.now() / 1000);
    const topic = `arra/${account.address.toLowerCase()}/readings`;
    const data = `waterDepthMm:${reading}`;
    const signed = `${DOMAIN}|data|${topic}|${ts}|${data}`;
    const sig = await account.signMessage({ message: signed });

    // verifier reconstructs the message; if tampered, the data differs
    const seenData = tamper ? `waterDepthMm:${reading}999` : data;
    const seenMsg = `${DOMAIN}|data|${topic}|${ts}|${seenData}`;
    const recovered = await recoverMessageAddress({ message: seenMsg, signature: sig });
    const ok = recovered.toLowerCase() === account.address.toLowerCase();
    setLog((l) => [
      {
        kind: ok ? "ok" : "bad",
        text: ok
          ? `✅ VALID — recovered ${recovered.slice(0, 12)}… == signer`
          : `❌ BAD_SIG — recovered ${recovered.slice(0, 12)}… ≠ signer (data ถูกแก้หลังเซ็น)`,
      },
      ...l,
    ].slice(0, 4));
  }

  return (
    <div style={{ border: "1px solid var(--color-line)", borderRadius: 8, padding: "1.25rem", background: "#fff" }}>
      <p style={{ margin: 0, fontSize: ".8rem", color: "var(--color-ink-soft)" }}>
        ephemeral signer: <code>{account.address.slice(0, 14)}…</code>
      </p>
      <div style={{ display: "flex", gap: 8, alignItems: "center", margin: ".75rem 0" }}>
        <label style={{ fontSize: ".9rem" }}>waterDepthMm</label>
        <input
          value={reading}
          onChange={(e) => setReading(e.target.value.replace(/\D/g, ""))}
          style={{ width: 90, padding: "4px 8px", border: "1px solid var(--color-line)", borderRadius: 4 }}
        />
        <button onClick={() => run(false)} style={btn(true)}>sign + verify</button>
        <button onClick={() => run(true)} style={btn(false)}>tamper</button>
      </div>
      <div style={{ fontFamily: "ui-monospace, monospace", fontSize: ".8rem", lineHeight: 1.7 }}>
        {log.length === 0 && <span style={{ color: "var(--color-ink-soft)" }}>กดปุ่ม — เซ็นข้อความแล้ว verify สดในเบราว์เซอร์ของคุณ</span>}
        {log.map((l, i) => (
          <div key={i} style={{ color: l.kind === "ok" ? "var(--color-herb)" : "#b23b3b" }}>{l.text}</div>
        ))}
      </div>
    </div>
  );
}

function btn(primary: boolean): React.CSSProperties {
  return {
    padding: "5px 12px",
    fontSize: ".85rem",
    borderRadius: 5,
    cursor: "pointer",
    border: primary ? "none" : "1px solid var(--color-line)",
    background: primary ? "var(--color-herb)" : "transparent",
    color: primary ? "#fff" : "var(--color-ink)",
  };
}
