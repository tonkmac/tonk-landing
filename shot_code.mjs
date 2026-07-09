import { chromium } from "playwright-core";
import { readdirSync } from "fs";
const g = readdirSync(process.env.HOME + "/.cache/ms-playwright").find(d=>d.startsWith("chromium-"));
const EXEC = `${process.env.HOME}/.cache/ms-playwright/${g}/chrome-linux/chrome`;
const BASE = "https://tonkmac.github.io/tonk-landing";
const browser = await chromium.launch({ executablePath: EXEC });
const ctx = await browser.newContext({ viewport:{width:1000,height:850}, deviceScaleFactor:1.5 });
const page = await ctx.newPage();
await page.goto(BASE+"/", { waitUntil:"load" });
for (const t of ["paper","white","dark"]) {
  await page.evaluate((th)=>localStorage.setItem("tonk-theme",th), t);
  await page.goto(BASE+"/about/", { waitUntil:"networkidle" });
  await page.waitForTimeout(500);
  // scroll to first code block (PdfReader)
  await page.evaluate(()=>{ const c=document.querySelector(".code"); if(c) c.scrollIntoView({block:"start"}); });
  await page.waitForTimeout(400);
  await page.screenshot({ path:`screenshots/code-${t}.png` });
}
await browser.close();
console.log("done");
