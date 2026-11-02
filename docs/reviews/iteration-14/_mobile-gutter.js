const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../../src");
const out = __dirname;
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

(async () => {
  await new Promise((r) => server.listen(8126, r));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto("http://127.0.0.1:8126/", { waitUntil: "networkidle" });

  const measure = async (sel, label) => {
    await page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: "center" }), sel);
    await page.waitForTimeout(150);
    return page.evaluate((label) => {
      const idx = document.querySelector(".look-indices").getBoundingClientRect();
      const h2 = document.querySelector(`${label} h2, ${label} #problem-title, ${label} #solution-title`);
      const target = h2 || document.querySelector(label);
      const b = target.getBoundingClientRect();
      const inner = document.querySelector(`${label} .look-inner`);
      const ib = inner?.getBoundingClientRect();
      return {
        label,
        idxR: +idx.right.toFixed(1),
        textL: +b.left.toFixed(1),
        clearance: +(b.left - idx.right).toFixed(1),
        overlapX: Math.max(0, Math.min(idx.right, b.right) - Math.max(idx.left, b.left)),
        innerL: ib ? +ib.left.toFixed(1) : null,
        indicesOp: getComputedStyle(document.querySelector(".look-indices")).opacity,
        isPast: document.querySelector(".look-indices").classList.contains("is-past"),
        indexTops: [...document.querySelectorAll(".look-index")].map((a) => +a.getBoundingClientRect().top.toFixed(1)),
      };
    }, label);
  };

  const results = {
    problem: await measure("#problem", "#problem"),
    solution: await measure("#solution", "#solution"),
    urgency: await measure("#urgency", "#urgency"),
    partners: await measure("#partners", "#partners"),
  };

  await page.evaluate(() => document.querySelector("#urgency").scrollIntoView({ block: "center" }));
  await page.screenshot({ path: path.join(out, "capture-m390-urgency.png"), fullPage: false });

  console.log(JSON.stringify(results, null, 2));
  await browser.close();
  server.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
