const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../../src");
const PORT = 9233;

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
  ".woff2": "font/woff2",
  ".woff": "font/woff",
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
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  await page.click(".process-link");
  await page.waitForTimeout(450);

  const anatomy = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const box = (el) => {
      const b = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        t: +b.top.toFixed(1),
        b: +b.bottom.toFixed(1),
        h: +b.height.toFixed(1),
        mt: cs.marginTop,
        mb: cs.marginBottom,
        pt: cs.paddingTop,
        pb: cs.paddingBottom,
      };
    };
    const lms = q(".mechanism-lms");
    const firstInner = q(".look--solution > .look-inner:first-of-type");
    const demoBand = q(".demo-band");
    const demoFrame = q(".demo-frame");
    const after = q(".look-inner--after-demo");
    return {
      lms: box(lms),
      firstInner: box(firstInner),
      demoBand: box(demoBand),
      demoFrame: box(demoFrame),
      after: after ? box(after) : null,
      lmsToDemo: +(demoFrame.getBoundingClientRect().top - lms.getBoundingClientRect().bottom).toFixed(1),
      lmsToBand: +(demoBand.getBoundingClientRect().top - lms.getBoundingClientRect().bottom).toFixed(1),
      innerBottomToDemo: +(
        demoFrame.getBoundingClientRect().top - firstInner.getBoundingClientRect().bottom
      ).toFixed(1),
      children: [...q(".look--solution").children].map((el) => el.className),
    };
  });

  // Hero hold + interest bleed lever ideas
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  const hero = await page.evaluate(() => {
    const desk = document.querySelector(".hero-desk").getBoundingClientRect();
    const proc = document.querySelector(".process-link").getBoundingClientRect();
    const lede = document.querySelector(".hero-lede").getBoundingClientRect();
    const cta = document.querySelector(".look--hero .cta-trial").getBoundingClientRect();
    return {
      deskVis: +(Math.min(desk.bottom, innerHeight) - Math.max(desk.top, 0)).toFixed(1),
      procDesk: +(desk.top - proc.bottom).toFixed(1),
      ledeCta: +(cta.top - lede.bottom).toFixed(1),
      ctaProc: +(proc.top - cta.bottom).toFixed(1),
    };
  });

  // Footer H2 vs solution size ladder
  await page.evaluate(() => {
    const f = document.querySelector(".look--footer");
    window.scrollTo(0, f.getBoundingClientRect().top + window.scrollY - 263);
  });
  const ladder = await page.evaluate(() => {
    const fs = (s) => parseFloat(getComputedStyle(document.querySelector(s)).fontSize);
    return {
      problem: fs(".look--copy h2"),
      solution: fs("#solution-title"),
      footer: fs(".look--footer h2"),
      urgency: fs("#urgency h2"),
      partners: fs(".look--proof h2"),
    };
  });

  fs.writeFileSync(
    path.join(__dirname, "anatomy33.json"),
    JSON.stringify({ anatomy, hero, ladder }, null, 2)
  );
  console.log(JSON.stringify({ anatomy, hero, ladder }, null, 2));
  await browser.close();
  server.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
