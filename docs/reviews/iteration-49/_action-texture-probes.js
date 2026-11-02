const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../../src");
const out = __dirname;
const PORT = 9352;

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

const grainSvg =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='120' height='120' filter='url(%23n)' opacity='0.055'/%3E%3C/svg%3E\")";

const probes = [
  { note: "baseline" },
  {
    note: "footer-grain-018",
    css: `.look--footer{position:relative;}
.look--footer::before{content:"";position:absolute;inset:0;pointer-events:none;z-index:0;opacity:0.18;background-image:radial-gradient(ellipse 70% 50% at 18% 12%, rgba(246,244,239,0.045), transparent 58%),${grainSvg};background-size:auto,120px 120px;}
.look--footer .look-inner{position:relative;z-index:1;}`,
  },
  {
    note: "footer-grain-022",
    css: `.look--footer{position:relative;}
.look--footer::before{content:"";position:absolute;inset:0;pointer-events:none;z-index:0;opacity:0.22;background-image:radial-gradient(ellipse 70% 50% at 18% 12%, rgba(246,244,239,0.05), transparent 58%),${grainSvg};background-size:auto,120px 120px;}
.look--footer .look-inner{position:relative;z-index:1;}`,
  },
  {
    note: "footer-grain-025-match",
    css: `.look--footer{position:relative;}
.look--footer::before{content:"";position:absolute;inset:0;pointer-events:none;z-index:0;opacity:0.25;background-image:radial-gradient(ellipse 70% 50% at 18% 12%, rgba(246,244,239,0.04), transparent 58%),${grainSvg};background-size:auto,120px 120px;}
.look--footer .look-inner{position:relative;z-index:1;}`,
  },
  {
    note: "footer-grain-014-quiet",
    css: `.look--footer{position:relative;}
.look--footer::before{content:"";position:absolute;inset:0;pointer-events:none;z-index:0;opacity:0.14;background-image:radial-gradient(ellipse 65% 45% at 22% 8%, rgba(246,244,239,0.035), transparent 55%),${grainSvg};background-size:auto,120px 120px;}
.look--footer .look-inner{position:relative;z-index:1;}`,
  },
  {
    note: "partner-strip-quieter",
    css: `.partner-strip img{height:6.25rem !important;filter:grayscale(1) contrast(1.08) brightness(0.92) !important;opacity:0.88 !important;}`,
  },
  {
    note: "partner-mix-darken",
    css: `.partner-strip img{mix-blend-mode:darken !important;filter:grayscale(1) contrast(1.12) !important;opacity:0.9 !important;}`,
  },
];

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const c of probes) {
    const d = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await d.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
    await d.evaluate((c) => {
      let s = document.getElementById("gap49");
      if (!s) {
        s = document.createElement("style");
        s.id = "gap49";
        document.head.appendChild(s);
      }
      s.textContent = c.css || "";
    }, c);
    await d.waitForTimeout(350);

    // Attention dual-seam hold
    const attention = await d.evaluate(() => {
      const q = (s) => document.querySelector(s);
      const gap = (a, b) =>
        +(b.getBoundingClientRect().top - a.getBoundingClientRect().bottom).toFixed(1);
      const visH = (el) => {
        const b = el.getBoundingClientRect();
        return +Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0)).toFixed(1);
      };
      return {
        ledeCta: gap(q(".hero-lede"), q(".look--hero .cta-trial")),
        ctaProc: gap(q(".look--hero .cta-trial"), q(".process-link")),
        procDesk: gap(q(".process-link"), q(".hero-desk")),
        deskVis: visH(q(".hero-desk")),
        procFw: getComputedStyle(q(".process-link")).fontWeight,
        wordFs: getComputedStyle(q(".wordmark")).fontSize,
        markW: +q(".brand-mark").getBoundingClientRect().width.toFixed(1),
      };
    });

    // Dual-gate via process land
    await d.click(".process-link");
    await d.waitForTimeout(500);
    const desire = await d.evaluate(() => {
      const q = (s) => document.querySelector(s);
      const vis = (el) => {
        if (!el) return 0;
        const b = el.getBoundingClientRect();
        return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
      };
      const frame = q(".demo-frame");
      const video = q(".demo-frame video") || q(".demo-video");
      const fr = frame.getBoundingClientRect();
      const vr = video.getBoundingClientRect();
      const title = q("#solution-title").getBoundingClientRect();
      const lms = q(".mechanism-lms").getBoundingClientRect();
      const band = q(".demo-band");
      return {
        lmsToDemo: +(fr.top - lms.bottom).toFixed(1),
        demoVis: +vis(frame).toFixed(1),
        isIn: /\bis-in\b/.test(band.className),
        optical: +(title.top + title.height / 2 - innerHeight / 2).toFixed(1),
        claimShare: +(((Math.min(lms.bottom, fr.top) - title.top) / innerHeight) * 100).toFixed(1),
        interestPVis: +vis(q(".look--copy p")).toFixed(1),
        videoShare: +((vis(video) / Math.max(1, vis(frame))) * 100).toFixed(1),
        chromeAbove: +(vr.top - fr.top).toFixed(1),
        bandOp: getComputedStyle(band).opacity,
        bandTransform: getComputedStyle(band).transform,
      };
    });

    // Footer Action texture + contrast
    await d.evaluate(() => {
      const f = document.querySelector(".look--footer");
      window.scrollTo(0, f.getBoundingClientRect().top + window.scrollY - 80);
    });
    await d.waitForTimeout(250);
    if (c.note === "baseline" || c.note.startsWith("footer-grain")) {
      await d.screenshot({
        path: path.join(out, `capture-d1280-footer-${c.note}.png`),
      });
    }
    if (c.note === "baseline" || c.note.startsWith("partner-")) {
      await d.evaluate(() => {
        const el = document.querySelector("#partners");
        window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - (innerHeight - el.getBoundingClientRect().height) / 2);
      });
      await d.waitForTimeout(200);
      await d.screenshot({
        path: path.join(out, `capture-d1280-partners-${c.note}.png`),
      });
      await d.evaluate(() => {
        const f = document.querySelector(".look--footer");
        window.scrollTo(0, f.getBoundingClientRect().top + window.scrollY - 80);
      });
      await d.waitForTimeout(200);
    }

    const action = await d.evaluate(() => {
      const q = (s) => document.querySelector(s);
      const footer = q(".look--footer");
      const h2 = q(".look--footer h2");
      const cta = q(".look--footer .cta-trial");
      const email = q(".footer-email");
      const copy = q(".copyright");
      const before = getComputedStyle(footer, "::before");
      const h2c = getComputedStyle(h2).color;
      const bg = getComputedStyle(footer).backgroundColor;
      const parse = (c) => {
        const m = (c || "").match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
        return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] != null ? +m[4] : 1 } : null;
      };
      const rel = (fg, bg) => {
        const L = (c) => {
          const n = [c.r, c.g, c.b].map((v) => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
          });
          return 0.2126 * n[0] + 0.7152 * n[1] + 0.0722 * n[2];
        };
        const a = L(fg);
        const b = L(bg);
        return +(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05))).toFixed(2);
      };
      const gap = (a, b) => +(b.getBoundingClientRect().top - a.getBoundingClientRect().bottom).toFixed(1);
      const imgs = [...document.querySelectorAll(".partner-strip img")].map((img) => {
        const cs = getComputedStyle(img);
        return {
          alt: img.alt,
          filter: cs.filter,
          mix: cs.mixBlendMode,
          op: cs.opacity,
          h: +img.getBoundingClientRect().height.toFixed(1),
        };
      });
      return {
        hasFooterBefore: before.content !== "none",
        footerBeforeOp: before.opacity,
        footerBeforeBg: before.backgroundImage.slice(0, 120),
        footerBg: bg,
        contrast: rel(parse(h2c), parse(bg)),
        h2Cta: gap(h2, cta),
        ctaEmail: gap(cta, email),
        emailSocial: gap(email, q(".social-links")),
        socialCopy: gap(q(".social-links"), copy),
        emailA: parse(getComputedStyle(email).color)?.a,
        copyA: parse(getComputedStyle(copy).color)?.a,
        imgs,
      };
    });

    const dualSeamOk =
      attention.ledeCta >= 18 && attention.ctaProc >= 18 && attention.procDesk >= 24;
    const dualGateOk =
      desire.lmsToDemo >= 40 &&
      desire.lmsToDemo <= 48 &&
      desire.demoVis >= 115 &&
      desire.isIn &&
      desire.claimShare >= 40 &&
      Math.abs(desire.optical) <= 120 &&
      desire.interestPVis <= 12 &&
      desire.videoShare >= 74 &&
      desire.chromeAbove <= 32;
    const actionLadderOk =
      action.h2Cta >= 28 &&
      action.ctaEmail >= 48 &&
      action.emailSocial >= 16 &&
      action.socialCopy >= 28 &&
      action.contrast >= 13;

    results.push({
      note: c.note,
      attention,
      desire,
      action,
      dualSeamOk,
      dualGateOk,
      actionLadderOk,
      holdPresenceProcess:
        Number(attention.procFw) >= 500 &&
        parseFloat(attention.wordFs) >= 26 &&
        attention.markW >= 56 &&
        Number(desire.bandOp) === 1,
    });
    await d.close();
  }

  fs.writeFileSync(path.join(out, "action-texture-probes.json"), JSON.stringify(results, null, 2));
  console.log(
    JSON.stringify(
      results.map((r) => ({
        note: r.note,
        dualSeamOk: r.dualSeamOk,
        dualGateOk: r.dualGateOk,
        actionLadderOk: r.actionLadderOk,
        holdPresenceProcess: r.holdPresenceProcess,
        hasFooterBefore: r.action.hasFooterBefore,
        footerBeforeOp: r.action.footerBeforeOp,
        contrast: r.action.contrast,
        img0: r.action.imgs?.[0],
      })),
      null,
      2
    )
  );

  await browser.close();
  server.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
