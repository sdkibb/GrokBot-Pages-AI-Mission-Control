#!/usr/bin/env node
/**
 * Headless Chrome screenshots of the example dashboard.
 * Usage: node take-screenshots.js <url> <outdir> <chromePath>
 */
const path = require("path");
const puppeteer = require("puppeteer-core");

const [url, outdir, chromePath] = process.argv.slice(2);
if (!url || !outdir || !chromePath) {
  console.error("usage: take-screenshots.js <url> <outdir> <chromePath>");
  process.exit(1);
}

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

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

  async function goto(viewport) {
    if (viewport) await page.setViewport(viewport);
    await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
    await page.waitForSelector(".week", { timeout: 10000 });
    await pause(250);
  }

  async function shot(name, target) {
    const dest = path.join(outdir, name);
    if (target === "page") {
      await page.screenshot({ path: dest, type: "png" });
    } else if (typeof target === "object" && target.clip) {
      await page.screenshot({ path: dest, type: "png", clip: target.clip });
    } else {
      const el = typeof target === "string" ? await page.$(target) : target;
      if (!el) throw new Error("missing element for " + name + ": " + target);
      await el.screenshot({ path: dest, type: "png" });
    }
    console.log("wrote", name);
  }

  const desktop = { width: 1280, height: 1600, deviceScaleFactor: 2 };

  // Desktop hero: header through the waiting box, no leftover accordion
  await goto(desktop);
  const heroClip = await page.evaluate(() => {
    const wait = document.querySelector(".wait-box");
    const app = document.querySelector("body");
    const wr = wait.getBoundingClientRect();
    const pad = 20;
    return {
      x: 0,
      y: 0,
      width: 1280,
      height: Math.min(1600, Math.ceil(wr.bottom + pad)),
    };
  });
  await shot("desktop.png", { clip: heroClip });

  // Expanded Atlas row in context: sort row, open card, next bot
  await page.setViewport({ width: 1280, height: 2000, deviceScaleFactor: 2 });
  await pause(200);
  await page.click('[data-act="bot"][data-id="atlas"]');
  await page.waitForSelector(".bot-card.open", { timeout: 5000 });
  await pause(200);
  await page.click('[data-act="wait-item"][data-id="atlas-o-0"]');
  await page.waitForSelector(".wait-item.open", { timeout: 5000 });
  await pause(250);
  await page.evaluate(() => {
    const tools = document.querySelector(".row-tools");
    if (tools) tools.scrollIntoView({ block: "start" });
  });
  await pause(200);
  const botClip = await page.evaluate(() => {
    const tools = document.querySelector(".row-tools");
    const open = document.querySelector(".bot-card.open");
    const cards = [...document.querySelectorAll(".bot-card")];
    const next = cards[cards.indexOf(open) + 1];
    const y = Math.max(0, (tools || open).getBoundingClientRect().top + window.scrollY - 8);
    const bottom = (next || open).getBoundingClientRect().bottom + window.scrollY + 16;
    return { x: 0, y, width: 1280, height: Math.ceil(bottom - y) };
  });
  await shot("bot-expanded.png", { clip: botClip });

  // Slide-up popup from the Top bot tile, with the week bar still in frame
  await goto({ width: 1280, height: 1100, deviceScaleFactor: 2 });
  await page.click('[data-act="sheet"][data-id="top"]');
  await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
  await pause(400);
  await shot("tile-popup.png", "page");

  // Heatmap
  await page.click('[data-act="close-sheet"]');
  await pause(300);
  await goto({ width: 1280, height: 900, deviceScaleFactor: 2 });
  const heat = await page.$("#heatmap");
  if (!heat) throw new Error("missing #heatmap");
  await heat.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await pause(150);
  await shot("heatmap.png", heat);

  // Usage trends accordion
  await page.click('[data-act="acc"][data-id="trends"]');
  await pause(300);
  const trends = await page.evaluateHandle(() => {
    const head = document.querySelector('[data-act="acc"][data-id="trends"]');
    return head && head.closest(".acc");
  });
  const trendsEl = trends.asElement();
  if (!trendsEl) throw new Error("missing trends accordion");
  await trendsEl.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await pause(150);
  await shot("trends.png", trendsEl);

  // Mobile hero: complete tiles + sort pills, no mid-tile crop
  const mobile = { width: 390, height: 1100, deviceScaleFactor: 3, isMobile: true, hasTouch: true };
  await goto(mobile);
  const mobileClip = await page.evaluate(() => {
    const tools = document.querySelector(".row-tools");
    const bottom = tools ? tools.getBoundingClientRect().bottom : 844;
    return { x: 0, y: 0, width: 390, height: Math.min(1100, Math.ceil(bottom + 16)) };
  });
  await shot("mobile.png", { clip: mobileClip });

  // Mobile slide-up of the same Top bot tile, on a standard phone frame
  await goto({ width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  await page.click('[data-act="sheet"][data-id="top"]');
  await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
  await pause(400);
  await shot("mobile-popup.png", "page");

  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
