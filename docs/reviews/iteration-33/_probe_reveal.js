const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../../src");
const PORT = 9333;

const css = fs
  .readFileSync(path.join(root, "css/styles.css"), "utf8")
  .replace(/url\((['"]?)\.\.\//g, "url($1/");
const js = fs.readFileSync(path.join(root, "js/script.js"), "utf8");
let html = fs.readFileSync(path.join(root, "index.html"), "utf8");
html = html.replace("</head>", `<style>${css}</style></head>`);
html = html.replace("</body>", `<script>${js}</script></body>`);

const mime = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".mp4": "video/mp4",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
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
    res.end("no");
    return;
  }
  res.writeHead(200, {
    "Content-Type": mime[path.extname(fp).toLowerCase()] || "application/octet-stream",
  });
  fs.createReadStream(fp).pipe(res);
});

async function snap(page, label) {
  return page.evaluate((label) => {
    const q = (s) => document.querySelector(s);
    const band = q(".demo-band");
    const lms = q(".mechanism-lms");
    const demo = q(".demo-frame");
    const vis = (el) => {
      const b = el.getBoundingClientRect();
      return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    };
    const cs = getComputedStyle(band);
    return {
      label,
      className: band.className,
      transform: cs.transform,
      transition: cs.transition,
      opacity: cs.opacity,
      lmsToDemo: +(demo.getBoundingClientRect().top - lms.getBoundingClientRect().bottom).toFixed(1),
      demoVis: +vis(demo).toFixed(1),
      videoVis: +vis(q(".demo-video")).toFixed(1),
    };
  }, label);
}

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });

  const series = [];
  await page.click(".process-link");
  series.push(await snap(page, "t+0"));
  await page.waitForTimeout(450);
  series.push(await snap(page, "t+450"));
  await page.waitForTimeout(600);
  series.push(await snap(page, "t+1050"));
  await page.waitForTimeout(800);
  series.push(await snap(page, "t+1850"));

  // Force settle by adding is-in
  await page.evaluate(() => document.querySelector(".demo-band")?.classList.add("is-in"));
  await page.waitForTimeout(600);
  series.push(await snap(page, "forced-is-in+600"));

  // Also: settled geometry with transform none + no will-reveal
  await page.evaluate(() => {
    const b = document.querySelector(".demo-band");
    b.classList.remove("will-reveal");
    b.classList.add("is-in");
    b.style.transform = "none";
  });
  await page.waitForTimeout(100);
  series.push(await snap(page, "transform-none"));

  // What triggers is-in in script?
  const scriptHint = await page.evaluate(() => {
    const src = document.querySelector("script")?.textContent || "";
    const hits = [];
    for (const re of [/will-reveal/g, /is-in/g, /demo-band/g, /IntersectionObserver/g, /scroll/g]) {
      const m = src.match(re);
      hits.push({ re: String(re), count: m ? m.length : 0 });
    }
    return { hits, snippet: src.includes("will-reveal") ? src.split("will-reveal").slice(0, 3).map((p, i) => (i ? "will-reveal" : "") + p.slice(0, 120)) : null };
  });

  fs.writeFileSync(path.join(__dirname, "reveal33.json"), JSON.stringify({ series, scriptHint }, null, 2));
  console.log(JSON.stringify({ series, scriptHint }, null, 2));
  await browser.close();
  server.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
