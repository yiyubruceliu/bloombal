const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../../src");
const PORT = 9234;

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

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  const snap = async (label) =>
    page.evaluate((label) => {
      const q = (s) => document.querySelector(s);
      const vis = (el) => {
        const b = el.getBoundingClientRect();
        return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
      };
      const title = q("#solution-title").getBoundingClientRect();
      const lms = q(".mechanism-lms").getBoundingClientRect();
      const demo = q(".demo-frame").getBoundingClientRect();
      const desk = q(".hero-desk").getBoundingClientRect();
      const proc = q(".process-link").getBoundingClientRect();
      return {
        label,
        scrollY: +window.scrollY.toFixed(1),
        interestPVis: +vis(q(".look--copy p")).toFixed(1),
        interestH2Vis: +vis(q(".look--copy h2")).toFixed(1),
        optical: +(title.top + title.height / 2 - innerHeight / 2).toFixed(1),
        claimShare: +(((Math.min(lms.bottom, demo.top) - title.top) / innerHeight) * 100).toFixed(1),
        demoVis: +vis(q(".demo-frame")).toFixed(1),
        lmsToDemo: +(demo.top - lms.bottom).toFixed(1),
        deskVis: +vis(q(".hero-desk")).toFixed(1),
        procDesk: +(desk.top - proc.bottom).toFixed(1),
      };
    }, label);

  // Hero dual-seam with correct .hero-desk
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  const hero = await snap("hero");
  await page.screenshot({
    path: path.join(__dirname, "capture-d1280-hero-desk.png"),
  });

  // Process land + scroll-down sweep (positive dy clears Interest upward)
  await page.click(".process-link");
  await page.waitForTimeout(500);
  const sweep = [];
  for (const dy of [0, 40, 80, 120, 140, 160, 180]) {
    await page.click(".process-link");
    await page.waitForTimeout(450);
    if (dy) await page.evaluate((dy) => window.scrollBy(0, dy), dy);
    await page.waitForTimeout(80);
    sweep.push(await snap(`land+${dy}`));
  }

  // Virtual: restore LMS mb to hit floor 40 while watching demoVis
  await page.click(".process-link");
  await page.waitForTimeout(450);
  const mbSweep = [];
  for (const mbRem of [1.4, 1.5, 1.55, 1.6, 1.65, 1.7]) {
    await page.evaluate((mbRem) => {
      const el = document.querySelector(".mechanism-lms");
      el.style.setProperty("margin-bottom", `${mbRem}rem`, "important");
    }, mbRem);
    await page.waitForTimeout(50);
    const m = await snap(`mb-${mbRem}`);
    mbSweep.push({ mbRem, ...m, lmsMb: await page.evaluate(() => getComputedStyle(document.querySelector(".mechanism-lms")).marginBottom) });
  }

  // Virtual: first-inner pb bump instead
  await page.evaluate(() => {
    document.querySelector(".mechanism-lms").style.removeProperty("margin-bottom");
  });
  const pbSweep = [];
  for (const pbRem of [0.85, 1.0, 1.1, 1.15, 1.25]) {
    await page.evaluate((pbRem) => {
      const el = document.querySelector(".look--solution > .look-inner:first-of-type");
      el.style.setProperty("padding-bottom", `${pbRem}rem`, "important");
    }, pbRem);
    await page.waitForTimeout(50);
    const m = await snap(`pb-${pbRem}`);
    pbSweep.push({
      pbRem,
      ...m,
      pb: await page.evaluate(
        () => getComputedStyle(document.querySelector(".look--solution > .look-inner:first-of-type")).paddingBottom
      ),
    });
  }

  // 1120 mb soft trim probe
  const p2 = await browser.newPage({ viewport: { width: 1120, height: 720 } });
  await p2.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  await p2.click(".process-link");
  await p2.waitForTimeout(500);
  const midMb = [];
  for (const mbRem of [2.3, 2.25, 2.2, 2.15, 2.1]) {
    await p2.evaluate((mbRem) => {
      const el = document.querySelector(".mechanism-lms");
      el.style.setProperty("margin-bottom", `${mbRem}rem`, "important");
    }, mbRem);
    await p2.waitForTimeout(40);
    midMb.push(
      await p2.evaluate((mbRem) => {
        const q = (s) => document.querySelector(s);
        const vis = (el) => {
          const b = el.getBoundingClientRect();
          return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
        };
        const lms = q(".mechanism-lms").getBoundingClientRect();
        const demo = q(".demo-frame").getBoundingClientRect();
        return {
          mbRem,
          lmsToDemo: +(demo.top - lms.bottom).toFixed(1),
          demoVis: +vis(q(".demo-frame")).toFixed(1),
          lmsMb: getComputedStyle(q(".mechanism-lms")).marginBottom,
        };
      }, mbRem)
    );
  }
  await p2.close();

  const result = { hero, sweep, mbSweep, pbSweep, midMb };
  fs.writeFileSync(path.join(__dirname, "bleed34.json"), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  server.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
