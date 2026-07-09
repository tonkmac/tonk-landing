import { chromium } from "playwright-core";
import { readdirSync } from "fs";
const g = readdirSync(process.env.HOME + "/.cache/ms-playwright").find(d=>d.startsWith("chromium-"));
const EXEC = `${process.env.HOME}/.cache/ms-playwright/${g}/chrome-linux/chrome`;
const browser = await chromium.launch({ executablePath: EXEC });
// narrow viewport → code block overflow → horizontal scrollbar visible
const ctx = await browser.newContext({ viewport:{width:480,height:700}, deviceScaleFactor:2 });
const page = await ctx.newPage();
await page.goto("https://tonkmac.github.io/tonk-landing/", { waitUntil:"load" });
await page.evaluate(()=>localStorage.setItem("tonk-theme","dark"));
await page.goto("https://tonkmac.github.io/tonk-landing/about/", { waitUntil:"networkidle" });
await page.waitForTimeout(600);
await page.evaluate(()=>{ const c=document.querySelector(".code"); if(c) c.scrollIntoView({block:"center"}); });
await page.waitForTimeout(400);
await page.screenshot({ path:"screenshots/scroll-dark.png" });
await browser.close();
console.log("done");
