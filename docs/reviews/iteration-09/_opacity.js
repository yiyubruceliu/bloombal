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
    res.end("no");
    return;
  }
  res.writeHead(200, {
    "Content-Type": mime[path.extname(fp).toLowerCase()] || "application/octet-stream",
  });
  fs.createReadStream(fp).pipe(res);
});

server.listen(8112, async () => {
  const browser = await chromium.launch({ headless: true });
  for (const [label, w, h, wait] of [
    ["fast390", 390, 844, 200],
    ["mid390", 390, 844, 700],
    ["late390", 390, 844, 1200],
    ["mid1120", 1120, 720, 700],
    ["mid1280", 1280, 720, 700],
  ]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.goto("http://127.0.0.1:8112/", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(wait);
    const info = await page.evaluate(() => {
      const frame = document.querySelector(".hero-frame");
      const cs = getComputedStyle(frame);
      return {
        classes: frame.className,
        opacity: cs.opacity,
        transform: cs.transform,
        brandOp: getComputedStyle(document.querySelector(".brand")).opacity,
        mainText: document.querySelector(".headline-main")?.textContent?.slice(0, 20),
      };
    });
    await page.screenshot({
      path: path.join(__dirname, "opacity-" + label + ".png"),
      fullPage: false,
    });
    console.log(label, JSON.stringify(info));
    await page.close();
  }
  await browser.close();
  server.close();
});
