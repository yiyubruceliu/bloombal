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
    res.end("no");
    return;
  }
  fs.createReadStream(fp).pipe(res);
});

server.listen(8096, async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto("http://127.0.0.1:8096/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1600);
  const metrics = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        t: Math.round(r.top),
        b: Math.round(r.bottom),
        h: Math.round(r.height),
        w: Math.round(r.width),
        op: cs.opacity,
        pos: cs.position,
        fs: cs.fontSize,
        display: cs.display,
      };
    };
    return {
      frame: box(q(".hero-frame")),
      brand: box(q(".brand")),
      main: box(q(".headline-main")),
      val: box(q(".headline-validation")),
      lede: box(q(".hero-lede")),
      cta: box(q(".look--hero .cta-trial")),
      process: box(q(".process-link")),
      desk: box(q(".hero-desk")),
      present: q(".hero-frame")?.className,
      scrollY: window.scrollY,
      h2sol: getComputedStyle(q("#solution-title")).fontSize,
      h2quiet: getComputedStyle(q(".look--quiet h2")).fontSize,
    };
  });
  fs.writeFileSync(
    path.join(__dirname, "metrics-mobile.json"),
    JSON.stringify(metrics, null, 2)
  );
  console.log(JSON.stringify(metrics, null, 2));
  await page.screenshot({
    path: path.join(__dirname, "capture-mobile-hero.png"),
    fullPage: false,
  });
  await browser.close();
  server.close();
});
