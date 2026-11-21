#!/usr/bin/env node
/**
 * Headless Chrome screenshots of the example dashboard.
 * Usage: node take-screenshots.js <url> <outdir> <chromePath>
 */
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const [url, outdir, chromePath] = process.argv.slice(2);
if (!url || !outdir || !chromePath) {
  console.error("usage: take-screenshots.js <url> <outdir> <chromePath>");
  process.exit(1);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu", "--hide-scrollbars"],
    defaultViewport: null,
  });
  const page = await browser.newPage();
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
  await page.setBypassCSP(true);

  async function goto() {
    await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
    await page.waitForSelector(".week", { timeout: 10000 });
    await new Promise((r) => setTimeout(r, 200));
  }

  // Desktop hero: top of the page, week bar + tiles + first bots
  await page.setViewport({ width: 1280, height: 1600, deviceScaleFactor: 2 });
  await goto();
  await page.screenshot({ path: path.join(outdir, "desktop.png"), type: "png" });
  console.log("wrote desktop.png");

  // Mobile
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await goto();
  await page.screenshot({ path: path.join(outdir, "mobile.png"), type: "png" });
  console.log("wrote mobile.png");

  // Tile popup (Chat with you) on a phone-sized frame
  await page.click('[data-act="sheet"][data-id="chat"]');
  await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
  await new Promise((r) => setTimeout(r, 350));
  await page.screenshot({ path: path.join(outdir, "tile-popup.png"), type: "png" });
  console.log("wrote tile-popup.png");

  // Close sheet, then heatmap on desktop
  await page.click('[data-act="close-sheet"]');
  await new Promise((r) => setTimeout(r, 300));
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });
  await goto();
  const heat = await page.$("#heatmap");
  if (!heat) throw new Error("missing #heatmap");
  await heat.screenshot({ path: path.join(outdir, "heatmap.png"), type: "png" });
  console.log("wrote heatmap.png");

  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
