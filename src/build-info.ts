import { execSync } from "node:child_process";

// Captured at BUILD time (runs during prerender, not in the worker).
// When Landing Oracle pulls + builds, these reflect the commit/branch/time they deployed.
function git(cmd: string): string {
  try {
    return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

const now = new Date();

export const commit: string = process.env.PUBLIC_COMMIT || git("git rev-parse --short HEAD") || "unknown";
export const branch: string = process.env.PUBLIC_BRANCH || git("git rev-parse --abbrev-ref HEAD") || "main";
export const tag: string = git("git describe --tags --exact-match") || "";
// readable Bangkok timestamp, e.g. 2026-06-20 19:14 (GMT+7)
export const buildDate: string =
  now.toLocaleString("sv-SE", { timeZone: "Asia/Bangkok", hour12: false }).slice(0, 16) + " (GMT+7)";
export const buildISO: string = now.toISOString();
