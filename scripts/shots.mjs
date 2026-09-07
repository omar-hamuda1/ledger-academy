// Dev screenshot helper — captures key pages at desktop + mobile widths so a
// UI change can be eyeballed without a browser open.
//
//   node scripts/shots.mjs [baseURL] [outDir]
//
// Defaults: http://localhost:3000  ->  .shots/
// Start the app first (`npm run build && npm start`, or `npm run dev`).
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const baseURL = process.argv[2] || "http://localhost:3000";
const outDir = process.argv[3] || ".shots";

const pages = [
  { path: "/", name: "home" },
  { path: "/courses", name: "catalog" },
  // course-detail: pass a real slug as a 3rd arg via env if needed
  { path: process.env.SHOT_COURSE || "/courses/mbadئ-idarة-alaعmal", name: "course" },
];
const sizes = [
  { w: 1440, h: 900, label: "desktop" },
  { w: 390, h: 844, label: "mobile" },
];

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();

for (const { path, name } of pages) {
  for (const { w, h, label } of sizes) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    try {
      const res = await page.goto(baseURL + path, { waitUntil: "networkidle", timeout: 30_000 });
      await page.waitForTimeout(600); // let fonts / entrance anims settle
      const file = `${outDir}/${name}-${label}.png`;
      await page.screenshot({ path: file, fullPage: true });
      console.log(`${res?.status()}  ${path}  ->  ${file}`);
    } catch (err) {
      console.error(`FAIL  ${path} @ ${label}: ${err.message}`);
    } finally {
      await page.close();
    }
  }
}

await browser.close();
