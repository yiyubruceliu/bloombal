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

const mime = {
  ".png": "image/png",
  ".mp4": "video/mp4",
  ".ttf": "font/ttf",
};
const server = http.createServer((req, res) => {
  let u = decodeURIComponent((req.url || "/").split("?")[0]);
  if (u === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
    return;
  }
  const fp = path.normalize(path.join(root, u.replace(/^\//, "")));
  if (!fp.startsWith(root) || !fs.existsSync(fp)) {
    res.writeHead(404);
    res.end("no");
    return;
  }
  res.writeHead(200, {
    "Content-Type": mime[path.extname(fp)] || "application/octet-stream",
  });
  fs.createReadStream(fp).pipe(res);
});

server.listen(8108, async () => {
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage({ viewport: { width: 1024, height: 720 } });
  await p.goto("http://127.0.0.1:8108/", { waitUntil: "networkidle" });
  await p.waitForTimeout(600);
  await p.screenshot({ path: path.join(out, "capture-mid-1024.png") });
  await p.locator("#contact").scrollIntoViewIfNeeded();
  await p.waitForTimeout(200);
  const foot = await p.evaluate(() => {
    const cta = document.querySelector("#contact .cta-trial");
    const r = cta.getBoundingClientRect();
    const cs = getComputedStyle(cta);
    const footBg = getComputedStyle(document.querySelector("#contact")).backgroundColor;
    return {
      ctaBg: cs.backgroundColor,
      footerBg: footBg,
      ctaColor: cs.color,
      sameFill: cs.backgroundColor === footBg,
      border: cs.border,
      pad: cs.padding,
      w: r.width,
      h: r.height,
    };
  });
  await p.screenshot({ path: path.join(out, "capture-mid-footer.png") });
  console.log(JSON.stringify(foot, null, 2));
  console.log("partners", fs.readdirSync(path.join(root, "img/partners")));
  await b.close();
  server.close();
});
