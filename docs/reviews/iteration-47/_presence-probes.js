const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../../src");
const PORT = 9348;
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
  const d = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const combos = [
    { note: "shipped" },
    {
      note: "presence-094-settle",
      css: `.look--hero .hero-frame.will-present{opacity:0.94;transform:translateY(12px);}
.look--hero .hero-frame.will-present.is-present{opacity:1;transform:none;transition:transform 520ms cubic-bezier(0.22,1,0.36,1),opacity 480ms cubic-bezier(0.22,1,0.36,1);}`,
    },
    {
      note: "presence-092-settle",
      css: `.look--hero .hero-frame.will-present{opacity:0.92;transform:translateY(12px);}
.look--hero .hero-frame.will-present.is-present{opacity:1;transform:none;transition:transform 520ms cubic-bezier(0.22,1,0.36,1),opacity 500ms cubic-bezier(0.22,1,0.36,1);}`,
    },
    {
      note: "presence-088-settle",
      css: `.look--hero .hero-frame.will-present{opacity:0.88;transform:translateY(14px);}
.look--hero .hero-frame.will-present.is-present{opacity:1;transform:none;transition:transform 520ms cubic-bezier(0.22,1,0.36,1),opacity 520ms cubic-bezier(0.22,1,0.36,1);}`,
    },
    {
      note: "presence-094-y10",
      css: `.look--hero .hero-frame.will-present{opacity:0.94;transform:translateY(10px);}
.look--hero .hero-frame.will-present.is-present{opacity:1;transform:none;transition:transform 520ms cubic-bezier(0.22,1,0.36,1),opacity 480ms cubic-bezier(0.22,1,0.36,1);}`,
    },
    {
      note: "process-500",
      css: `.process-link{font-weight:500;letter-spacing:0.01em;color:rgba(8,40,72,0.72);}`,
    },
    {
      note: "process-500+presence-094",
      css: `.look--hero .hero-frame.will-present{opacity:0.94;transform:translateY(12px);}
.look--hero .hero-frame.will-present.is-present{opacity:1;transform:none;transition:transform 520ms cubic-bezier(0.22,1,0.36,1),opacity 480ms cubic-bezier(0.22,1,0.36,1);}
.process-link{font-weight:500;letter-spacing:0.01em;color:rgba(8,40,72,0.72);}`,
    },
  ];
  const out = [];
  for (const c of combos) {
    await d.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
    if (c.css) {
      await d.addStyleTag({ content: c.css });
      await d.evaluate(() => {
        const f = document.querySelector(".hero-frame");
        f.classList.remove("is-present", "will-present");
        void f.offsetWidth;
        f.classList.add("will-present");
        requestAnimationFrame(() => f.classList.add("is-present"));
      });
      await d.waitForTimeout(80);
      const pre = await d.evaluate(() => {
        const f = document.querySelector(".hero-frame");
        const cs = getComputedStyle(f);
        return {
          opacity: cs.opacity,
          transform: cs.transform,
          isPresent: f.classList.contains("is-present"),
        };
      });
      await d.waitForTimeout(600);
      const m = await d.evaluate(() => {
        const q = (s) => document.querySelector(s);
        const gap = (a, b) =>
          +(b.getBoundingClientRect().top - a.getBoundingClientRect().bottom).toFixed(1);
        const visH = (el) => {
          const b = el.getBoundingClientRect();
          return +Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0)).toFixed(1);
        };
        const frame = q(".hero-frame");
        const cs = getComputedStyle(frame);
        const desk = q(".hero-desk");
        return {
          opacity: cs.opacity,
          transform: cs.transform,
          transition: cs.transition,
          ledeCta: gap(q(".hero-lede"), q(".look--hero .cta-trial")),
          ctaProc: gap(q(".look--hero .cta-trial"), q(".process-link")),
          procDesk: gap(q(".process-link"), desk),
          deskVis: visH(desk),
          wordFs: getComputedStyle(q(".wordmark")).fontSize,
          markW: +q(".brand-mark").getBoundingClientRect().width.toFixed(1),
          procFw: getComputedStyle(q(".process-link")).fontWeight,
          procColor: getComputedStyle(q(".process-link")).color,
          isPresent: frame.classList.contains("is-present"),
        };
      });
      out.push({
        note: c.note,
        pre,
        ...m,
        dualSeamOk: m.ledeCta >= 18 && m.ctaProc >= 18,
        procDeskOk: m.procDesk >= 24,
        deskVisOk: m.deskVis >= 165,
        opacityInTransition: /opacity/i.test(String(m.transition || "")),
      });
    } else {
      await d.waitForTimeout(700);
      const m = await d.evaluate(() => {
        const q = (s) => document.querySelector(s);
        const gap = (a, b) =>
          +(b.getBoundingClientRect().top - a.getBoundingClientRect().bottom).toFixed(1);
        const visH = (el) => {
          const b = el.getBoundingClientRect();
          return +Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0)).toFixed(1);
        };
        const frame = q(".hero-frame");
        const cs = getComputedStyle(frame);
        const desk = q(".hero-desk");
        return {
          opacity: cs.opacity,
          transform: cs.transform,
          transition: cs.transition,
          ledeCta: gap(q(".hero-lede"), q(".look--hero .cta-trial")),
          ctaProc: gap(q(".look--hero .cta-trial"), q(".process-link")),
          procDesk: gap(q(".process-link"), desk),
          deskVis: visH(desk),
          wordFs: getComputedStyle(q(".wordmark")).fontSize,
          markW: +q(".brand-mark").getBoundingClientRect().width.toFixed(1),
          procFw: getComputedStyle(q(".process-link")).fontWeight,
          procColor: getComputedStyle(q(".process-link")).color,
          isPresent: frame.classList.contains("is-present"),
        };
      });
      out.push({
        note: c.note,
        ...m,
        dualSeamOk: m.ledeCta >= 18 && m.ctaProc >= 18,
        procDeskOk: m.procDesk >= 24,
        deskVisOk: m.deskVis >= 165,
        opacityInTransition: /opacity/i.test(String(m.transition || "")),
      });
    }
  }
  fs.writeFileSync(path.join(__dirname, "presence-probes.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  server.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
