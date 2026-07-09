import { chromium } from "playwright-core";
import { readdirSync } from "fs";
const g = readdirSync(process.env.HOME + "/.cache/ms-playwright").find(d=>d.startsWith("chromium-"));
const EXEC = `${process.env.HOME}/.cache/ms-playwright/${g}/chrome-linux/chrome`;
const browser = await chromium.launch({ executablePath: EXEC });
const ctx = await browser.newContext({ viewport:{width:1200,height:820}, deviceScaleFactor:2 });
const page = await ctx.newPage();
await page.goto("https://tonkmac.github.io/tonk-landing/", { waitUntil:"networkidle" });
await page.waitForTimeout(800);
await page.screenshot({ path:"screenshots/live-home.png" });   // hero (viewport)
await browser.close();
console.log("captured");
