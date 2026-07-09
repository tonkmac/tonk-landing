import { chromium } from "playwright-core";
import { readdirSync } from "fs";
const g = readdirSync(process.env.HOME + "/.cache/ms-playwright").find(d=>d.startsWith("chromium-"));
const EXEC = "/home/agent/.cache/ms-playwright/chromium-1181/chrome-linux/chrome";
const BASE = "https://tonkmac.github.io/tonk-landing";
const themes = ["paper","white","dark"];
const pages = { about:"/about/", home:"/", read:"/read/ws06-chain-from-zero/" };
const browser = await chromium.launch({ executablePath: EXEC });
const ctx = await browser.newContext({ viewport:{width:1280,height:900}, deviceScaleFactor:1.5 });
const page = await ctx.newPage();
await page.goto(BASE + "/", { waitUntil:"load" });
for (const t of themes) {
  await page.evaluate((th)=>localStorage.setItem("tonk-theme",th), t);
  for (const [name,path] of Object.entries(pages)) {
    await page.goto(BASE+path, { waitUntil:"networkidle" });
    await page.waitForTimeout(600);
    await page.screenshot({ path:`screenshots/${name}-${t}.png`, fullPage:false });
  }
  console.log("theme",t,"done");
}
await browser.close();
