const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../../src");
const css = fs
  .readFileSync(path.join(root, "css/styles.css"), "utf8")
  .replace(/url\((['"]?)\.\.\//g, "url($1/");
const js = fs.readFileSync(path.join(root, "js/script.js"), "utf8");
let html = fs.readFileSync(path.join(root, "index.html"), "utf8");
html = html.replace("</head>", `<style>${css}</style></head>`);
html = html.replace("</body>", `<script>${js}</script></body>`);

const mime = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp4": "video/mp4",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const server = http.createServer((req, res) => {
  let u = decodeURIComponent((req.url || "/").split("?")[0]);
  if (u === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
    return;
  }
  const fp = path.normalize(path.join(root, u.replace(/^\//, "")));
  if (!fp.startsWith(root) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
    res.writeHead(404);
    res.end("no " + u);
    return;
  }
  res.writeHead(200, {
    "Content-Type": mime[path.extname(fp)] || "application/octet-stream",
  });
  fs.createReadStream(fp).pipe(res);
});

server.listen(8097, async () => {
  const out = path.join(__dirname);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto("http://127.0.0.1:8097/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1100);
  await page.screenshot({ path: path.join(out, "capture-hero.png"), fullPage: false });

  await page.locator("#solution").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1100);
  await page.screenshot({
    path: path.join(out, "capture-solution.png"),
    fullPage: false,
  });

  await page.locator("#demo").scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(out, "capture-demo.png"), fullPage: false });

  await page.locator("#urgency").scrollIntoViewIfNeeded();
  await page.waitForTimeout(350);
  await page.screenshot({
    path: path.join(out, "capture-urgency.png"),
    fullPage: false,
  });

  await page.locator("#partners").scrollIntoViewIfNeeded();
  await page.waitForTimeout(350);
  await page.screenshot({
    path: path.join(out, "capture-partners.png"),
    fullPage: false,
  });

  await page.locator("#context").scrollIntoViewIfNeeded();
  await page.waitForTimeout(350);
  await page.screenshot({
    path: path.join(out, "capture-context.png"),
    fullPage: false,
  });

  await page.locator("#contact").scrollIntoViewIfNeeded();
  await page.waitForTimeout(350);
  await page.screenshot({
    path: path.join(out, "capture-footer.png"),
    fullPage: false,
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:8097/", { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  await page.screenshot({
    path: path.join(out, "capture-mobile-hero.png"),
    fullPage: false,
  });
  await page.locator("#solution-title").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({
    path: path.join(out, "capture-mobile-solution-title.png"),
    fullPage: false,
  });
  await page.locator("#partners").scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({
    path: path.join(out, "capture-mobile-partners.png"),
    fullPage: false,
  });

  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("http://127.0.0.1:8097/", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const metrics = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
        height: Math.round(r.height),
        width: Math.round(r.width),
        left: Math.round(r.left),
      };
    };
    const cta = q(".look--hero .cta-trial");
    const desk = q(".hero-desk");
    const process = q(".process-link");
    const v = q(".headline-validation").getBoundingClientRect();
    const frame = q(".hero-frame").getBoundingClientRect();
    return {
      cta: box(cta),
      process: box(process),
      desk: box(desk),
      validation: box(q(".headline-validation")),
      mark: box(q(".brand-mark")),
      ice: getComputedStyle(q(".headline-validation")).color,
      ctaBg: getComputedStyle(cta).backgroundColor,
      ctaFs: getComputedStyle(cta).fontSize,
      h2problem: getComputedStyle(q("#problem-title")).fontSize,
      h2solution: getComputedStyle(q("#solution-title")).fontSize,
      h2urgency: getComputedStyle(q("#urgency h2")).fontSize,
      h2partners: getComputedStyle(q("#partners h2")).fontSize,
      h2quiet: getComputedStyle(q(".look--quiet h2")).fontSize,
      partnerFilter: getComputedStyle(q(".partner-strip img")).filter,
      partnerLiBorder: getComputedStyle(q(".partner-strip li")).borderTop,
      videoAutoplay: q(".demo-video")?.autoplay,
      videoLoop: q(".demo-video")?.loop,
      ctaAboveDesk: cta && desk ? cta.getBoundingClientRect().bottom <= desk.getBoundingClientRect().top + 2 : null,
      processAboveDesk:
        process && desk
          ? process.getBoundingClientRect().bottom <= desk.getBoundingClientRect().top + 2
          : null,
      validationRight: Math.round(v.right),
      frameW: Math.round(frame.width),
      lookInnerPadTop: getComputedStyle(q("#problem .look-inner")).paddingTop,
      solutionTitlePad: {
        top: getComputedStyle(q("#solution > .look-inner")).paddingTop,
        bottom: getComputedStyle(q("#solution > .look-inner")).paddingBottom,
      },
      indexRuleBottom: box(q(".index-rule")),
    };
  });
  fs.writeFileSync(path.join(out, "metrics.json"), JSON.stringify(metrics, null, 2));
  console.log(JSON.stringify(metrics, null, 2));
  await browser.close();
  server.close();
  console.log("src-render-ok");
});
