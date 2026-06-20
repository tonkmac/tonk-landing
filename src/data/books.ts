export interface Book {
  slug: string;
  title: string;
  en: string;
  ws: string;
  cover: string;
  pdf: string;
  source: string;
  note: string;
}

// Books are hosted on this site (public/books) — read on-page via PDF.js, no external load.
export const books: Book[] = [
  {
    slug: "ws04-many-bodies",
    title: "หลายร่าง หนึ่งวิญญาณ",
    en: "Many Bodies, One Soul",
    ws: "WS-04",
    cover: "/books/ws04-many-bodies.png",
    pdf: "/books/ws04-many-bodies.pdf",
    source: "https://github.com/tonkmac/workshop-04-esp32-wasm",
    note: "WASM core เดียว สามร่าง — ESP32 / desktop / เบราว์เซอร์",
  },
  {
    slug: "ws06-chain-from-zero",
    title: "สร้าง chain จากศูนย์",
    en: "Chain From Zero",
    ws: "WS-06",
    cover: "/books/ws06-chain-from-zero.png",
    pdf: "/books/ws06-chain-from-zero.pdf",
    source: "https://github.com/tonkmac/workshop-06-arra-oracle-blockchain",
    note: "คู่มือ OP-Stack L2 จากสนามจริง — pitfalls ทุกตัว + ทางแก้",
  },
  {
    slug: "recipe-mini",
    title: "สูตร Tonk (mini)",
    en: "The Tonk Recipe",
    ws: "mini",
    cover: "/books/recipe-mini.png",
    pdf: "/books/recipe-mini.pdf",
    source: "https://github.com/tonkmac/tonk-landing",
    note: "บันทึกย่อ วิธีคิดและวิธีทำงานของต้นอ่อน",
  },
];
