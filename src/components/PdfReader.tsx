import { useEffect, useRef, useState } from "react";
// worker URL is a build-time string constant — safe at module top (no pdfjs code runs in SSR)
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// Render a same-origin PDF on-page with PDF.js (canvas) — no iframe, no external load.
// pdfjs library is dynamically imported INSIDE the effect so it never runs during SSR/prerender.
export default function PdfReader({ url }: { url: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [pages, setPages] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const container = host.current;
    if (container) container.innerHTML = "";

    (async () => {
      try {
        if (!container) return;
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

        const pdf = await pdfjsLib.getDocument({ url }).promise;
        if (cancelled) return;
        setPages(pdf.numPages);

        const width = Math.min(container.clientWidth || 760, 820);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        for (let n = 1; n <= pdf.numPages; n++) {
          const page = await pdf.getPage(n);
          if (cancelled) return;
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: (width / base.width) * dpr });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.cssText =
            "width:100%;height:auto;display:block;margin:0 auto 14px;border-radius:4px;box-shadow:0 1px 10px rgba(0,0,0,.12)";
          container.appendChild(canvas);
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;
          await page.render({ canvasContext: ctx, viewport }).promise;
          if (cancelled) return;
        }
        setStatus("ready");
      } catch (e) {
        console.error("[PdfReader]", e);
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <div>
      {status === "loading" && (
        <p style={{ color: "var(--color-ink-soft)", textAlign: "center", padding: "2rem 0" }}>กำลังโหลดหนังสือ…</p>
      )}
      {status === "error" && (
        <p style={{ color: "var(--color-bad)", textAlign: "center" }}>
          เปิดในหน้าไม่ได้ — <a href={url} style={{ color: "var(--color-herb-deep)", textDecoration: "underline" }}>ดาวน์โหลด PDF</a>
        </p>
      )}
      <div ref={host} style={{ maxWidth: 820, margin: "0 auto" }} />
      {status === "ready" && (
        <p style={{ color: "var(--color-faint)", fontSize: ".85rem", textAlign: "center", marginTop: 6 }}>{pages} หน้า · จบแล้ว 🌿</p>
      )}
    </div>
  );
}
