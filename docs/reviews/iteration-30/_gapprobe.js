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
  ".woff2": "font/woff2",
  ".woff": "font/woff",
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

function measure(el) {
  if (!el) return null;
  const cs = getComputedStyle(el);
  const fsPx = parseFloat(cs.fontSize);
  const w = el.getBoundingClientRect().width;
  const c = document.createElement("canvas");
  const ctx = c.getContext("2d");
  ctx.font = cs.font;
  const m = ctx.measureText(
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
  );
  const avg = m.width / 52;
  return {
    text: (el.textContent || "").trim().slice(0, 72),
    fs: fsPx,
    fw: cs.fontWeight,
    ff: cs.fontFamily.split(",")[0].replace(/"/g, ""),
    color: cs.color,
    maxW: cs.maxWidth,
    w: +w.toFixed(1),
    measureCss: +(w / fsPx).toFixed(1),
    measureGlyph: +(w / avg).toFixed(1),
    lh: cs.lineHeight,
  };
}

(async () => {
  await new Promise((r) => server.listen(8899, r));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto("http://127.0.0.1:8899/", { waitUntil: "networkidle" });
  await page.waitForTimeout(300);

  const deep = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const measureLocal = (el) => {
      if (!el) return null;
      const cs = getComputedStyle(el);
      const fsPx = parseFloat(cs.fontSize);
      const w = el.getBoundingClientRect().width;
      const c = document.createElement("canvas");
      const ctx = c.getContext("2d");
      ctx.font = cs.font;
      const m = ctx.measureText(
        "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
      );
      const avg = m.width / 52;
      return {
        text: (el.textContent || "").trim().slice(0, 72),
        fs: fsPx,
        fw: cs.fontWeight,
        ff: cs.fontFamily.split(",")[0].replace(/"/g, ""),
        color: cs.color,
        maxW: cs.maxWidth,
        w: +w.toFixed(1),
        measureCss: +(w / fsPx).toFixed(1),
        measureGlyph: +(w / avg).toFixed(1),
        lh: cs.lineHeight,
      };
    };
    const val = q(".headline-validation");
    const text = q(".headline-validation-text") || val;
    const lede = q(".hero-lede");
    const vb = text.getBoundingClientRect();
    const lb = lede.getBoundingClientRect();
    const cs = getComputedStyle(text);
    const after = getComputedStyle(text, "::after");
    const under = getComputedStyle(text, "::before");
    return {
      interest: measureLocal(q(".look--copy p")),
      mech: measureLocal(q(".mechanism")),
      lms: measureLocal(q(".mechanism-lms")),
      urgBody: measureLocal(q("#urgency p")),
      urgH2: measureLocal(q("#urgency h2")),
      partnerH2: measureLocal(q("#partners h2")),
      footerH2: measureLocal(q(".look--footer h2")),
      copyP: measureLocal(q(".look--copy p")),
      ice: {
        textDeco: cs.textDecoration,
        borderBottom: cs.borderBottom,
        afterContent: after.content,
        afterH: after.height,
        afterBg: after.backgroundColor,
        afterBottom: after.bottom,
        afterTop: after.top,
        afterPos: after.position,
        beforeContent: under.content,
        valBox: { t: +vb.top.toFixed(1), b: +vb.bottom.toFixed(1), h: +vb.height.toFixed(1) },
        ledeBox: { t: +lb.top.toFixed(1), b: +lb.bottom.toFixed(1) },
        gapValLede: +(lb.top - vb.bottom).toFixed(1),
      },
      afterDemoPad: {
        pt: getComputedStyle(q(".look-inner--after-demo")).paddingTop,
        pb: getComputedStyle(q(".look-inner--after-demo")).paddingBottom,
      },
    };
  });

  await page.evaluate(() => {
    const demo = document.querySelector(".demo-frame");
    const mid = [...document.querySelectorAll(".cta-trial")][1];
    const demoB = demo.getBoundingClientRect().bottom + window.scrollY;
    window.scrollTo(0, demoB - 316);
  });
  await page.waitForTimeout(250);
  const mid = await page.evaluate(() => {
    const demo = document.querySelector(".demo-frame").getBoundingClientRect();
    const midEl = [...document.querySelectorAll(".cta-trial")][1].getBoundingClientRect();
    const urg = document.querySelector("#urgency").getBoundingClientRect();
    const after = document.querySelector(".look-inner--after-demo").getBoundingClientRect();
    return {
      demoB: +demo.bottom.toFixed(1),
      midT: +midEl.top.toFixed(1),
      gap: +(midEl.top - demo.bottom).toFixed(1),
      afterT: +after.top.toFixed(1),
      afterPadTopDoc: getComputedStyle(document.querySelector(".look-inner--after-demo"))
        .paddingTop,
      urgVis: Math.max(
        0,
        Math.min(720, urg.bottom) - Math.max(0, urg.top)
      ),
    };
  });

  // Desire support stack gaps @1120 land
  const page1120 = await browser.newPage({ viewport: { width: 1120, height: 720 } });
  await page1120.goto("http://127.0.0.1:8899/", { waitUntil: "networkidle" });
  await page1120.evaluate(() => {
    location.hash = "#solution";
  });
  await page1120.waitForTimeout(400);
  const desire = await page1120.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const box = (el) => {
      const b = el.getBoundingClientRect();
      return { t: +b.top.toFixed(1), b: +b.bottom.toFixed(1), h: +b.height.toFixed(1) };
    };
    const title = box(q("#solution h2"));
    const mech = box(q(".mechanism"));
    const lms = box(q(".mechanism-lms"));
    const demo = box(q(".demo-frame"));
    const claimH = lms.b - title.t;
    return {
      title,
      mech,
      lms,
      demo,
      titleToMech: +(mech.t - title.b).toFixed(1),
      mechToLms: +(lms.t - mech.b).toFixed(1),
      lmsToDemo: +(demo.t - lms.b).toFixed(1),
      claimH: +claimH.toFixed(1),
      claimShare: +((claimH / 720) * 100).toFixed(1),
      mechMeasure: (() => {
        const el = q(".mechanism");
        const cs = getComputedStyle(el);
        const fsPx = parseFloat(cs.fontSize);
        const w = el.getBoundingClientRect().width;
        const c = document.createElement("canvas");
        const ctx = c.getContext("2d");
        ctx.font = cs.font;
        const avg =
          ctx.measureText(
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
          ).width / 52;
        return {
          fs: fsPx,
          maxW: cs.maxWidth,
          w: +w.toFixed(1),
          glyph: +(w / avg).toFixed(1),
          cssCh: +(w / fsPx).toFixed(1),
        };
      })(),
      lmsMeasure: (() => {
        const el = q(".mechanism-lms");
        const cs = getComputedStyle(el);
        const fsPx = parseFloat(cs.fontSize);
        const w = el.getBoundingClientRect().width;
        const c = document.createElement("canvas");
        const ctx = c.getContext("2d");
        ctx.font = cs.font;
        const avg =
          ctx.measureText(
            "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
          ).width / 52;
        return {
          fs: fsPx,
          maxW: cs.maxWidth,
          w: +w.toFixed(1),
          glyph: +(w / avg).toFixed(1),
          cssCh: +(w / fsPx).toFixed(1),
        };
      })(),
    };
  });

  const out = { deep, mid, desire };
  fs.writeFileSync(path.join(__dirname, "gapprobe.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  server.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
