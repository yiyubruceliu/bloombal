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
  if (!fp.startsWith(root) || !fs.existsSync(fp)) {
    res.writeHead(404);
    res.end("no");
    return;
  }
  fs.createReadStream(fp).pipe(res);
});

(async () => {
  await new Promise((r) => server.listen(8901, r));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto("http://127.0.0.1:8901/", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    const f = document.querySelector(".look--footer");
    window.scrollTo(0, f.getBoundingClientRect().top + window.scrollY - 263);
  });
  await page.waitForTimeout(300);
  const info = await page.evaluate(() => {
    const h2 = document.querySelector(".look--footer h2");
    const footer = document.querySelector(".look--footer");
    const cs = getComputedStyle(h2);
    const fcs = getComputedStyle(footer);
    const b = h2.getBoundingClientRect();
    const fb = footer.getBoundingClientRect();
    // contrast-ish luminance
    const parse = (c) => {
      const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      return m ? [+m[1], +m[2], +m[3]] : [0, 0, 0];
    };
    const lum = ([r, g, b]) => {
      const s = [r, g, b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * s[0] + 0.7152 * s[1] + 0.0722 * s[2];
    };
    const fg = parse(cs.color);
    const bg = parse(fcs.backgroundColor);
    const L1 = lum(fg);
    const L2 = lum(bg);
    const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    return {
      text: h2.textContent.trim(),
      color: cs.color,
      bg: fcs.backgroundColor,
      footerColor: fcs.color,
      opacity: cs.opacity,
      visibility: cs.visibility,
      t: +b.top.toFixed(1),
      h: +b.height.toFixed(1),
      footerT: +fb.top.toFixed(1),
      fs: cs.fontSize,
      fw: cs.fontWeight,
      contrast: +ratio.toFixed(2),
      matched: [...document.styleSheets].flatMap((ss) => {
        try {
          return [...ss.cssRules]
            .filter((r) => r.selectorText && r.selectorText.includes("footer") && r.selectorText.includes("h2"))
            .map((r) => ({ sel: r.selectorText, color: r.style.color, fs: r.style.fontSize }));
        } catch (e) {
          return [];
        }
      }),
    };
  });
  await page.screenshot({
    path: path.join(__dirname, "capture-d1280-footer-h2-check.png"),
  });
  fs.writeFileSync(path.join(__dirname, "footcolor.json"), JSON.stringify(info, null, 2));
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
  server.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
