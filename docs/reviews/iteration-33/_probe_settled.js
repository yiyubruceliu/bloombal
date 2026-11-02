const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../../src");
const PORT = 9433;

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
  const out = {};

  for (const [w, label] of [
    [1280, "d1280"],
    [1120, "w1120"],
  ]) {
    const page = await browser.newPage({ viewport: { width: w, height: 720 } });
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
    await page.click(".process-link");
    await page.waitForTimeout(400);
    // force settle like visitor who scrolls a bit more would eventually get — OR stuck forever
    const before = await page.evaluate(() => {
      const demo = document.querySelector(".demo-band");
      const frame = document.querySelector(".demo-frame");
      const vis = frame.getBoundingClientRect();
      const visible = Math.max(0, Math.min(vis.bottom, innerHeight) - Math.max(vis.top, 0));
      return {
        className: demo.className,
        ratio: +(visible / vis.height).toFixed(3),
        threshold: 0.22,
        wouldFire: visible / vis.height >= 0.22,
        demoVis: +visible.toFixed(1),
      };
    });
    await page.evaluate(() => document.querySelector(".demo-band").classList.add("is-in"));
    await page.waitForTimeout(600);
    const after = await page.evaluate(() => {
      const q = (s) => document.querySelector(s);
      const vis = (el) => {
        const b = el.getBoundingClientRect();
        return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
      };
      const title = q("#solution-title").getBoundingClientRect();
      const mech = q(".mechanism").getBoundingClientRect();
      const lms = q(".mechanism-lms").getBoundingClientRect();
      const demo = q(".demo-frame").getBoundingClientRect();
      const claimH = Math.min(lms.bottom, demo.top) - title.top;
      return {
        className: q(".demo-band").className,
        transform: getComputedStyle(q(".demo-band")).transform,
        lmsToDemo: +(demo.top - lms.bottom).toFixed(1),
        mechToLms: +(lms.top - mech.bottom).toFixed(1),
        titleToMech: +(mech.top - title.bottom).toFixed(1),
        demoVis: +vis(q(".demo-frame")).toFixed(1),
        videoVis: +vis(q(".demo-video")).toFixed(1),
        claimShare: +((claimH / innerHeight) * 100).toFixed(1),
        optical: +(title.top + title.height / 2 - innerHeight / 2).toFixed(1),
        interestPVis: +vis(q(".look--copy p")).toFixed(1),
        solutionGrain: {
          content: getComputedStyle(q(".look--solution"), "::before").content,
          opacity: getComputedStyle(q(".look--solution"), "::before").opacity,
        },
      };
    });
    out[label] = { before, after };
    await page.screenshot({
      path: path.join(__dirname, `capture-${label}-process-land-settled.png`),
    });
    await page.close();
  }

  fs.writeFileSync(path.join(__dirname, "settled33.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  server.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
