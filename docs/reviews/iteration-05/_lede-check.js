const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../../src");
const css = fs
  .readFileSync(path.join(root, "css/styles.css"), "utf8")
  .replace(/url\((['"]?)\.\.\//g, "url($1/");
let html = fs.readFileSync(path.join(root, "index.html"), "utf8");
html = html.replace("</head>", `<style>${css}</style></head>`);

const server = http.createServer((req, res) => {
  if ((req.url || "/").split("?")[0] === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
    return;
  }
  res.writeHead(404);
  res.end();
});

server.listen(8096, async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto("http://127.0.0.1:8096/");
  const m = await page.evaluate(() => {
    const el = document.querySelector(".hero-lede");
    const cs = getComputedStyle(el);
    const root = getComputedStyle(document.documentElement);
    return {
      fontSize: cs.fontSize,
      color: cs.color,
      var: root.getPropertyValue("--r-lede-font").trim(),
      ink: root.getPropertyValue("--ink").trim(),
      family: cs.fontFamily,
    };
  });
  console.log(JSON.stringify(m, null, 2));
  await browser.close();
  server.close();
});
