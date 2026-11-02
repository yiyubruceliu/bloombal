const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../../src");
const out = __dirname;
const PORT = 9354;

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

const probes = [
  { note: "baseline" },
  {
    note: "partner-h625-filter",
    css: `.partner-strip{gap:2rem !important;}
.partner-strip img{height:6.25rem !important;filter:grayscale(1) contrast(1.08) brightness(0.92) !important;opacity:0.88 !important;}`,
  },
  {
    note: "partner-h575-darker",
    css: `.partner-strip{gap:1.85rem !important;}
.partner-strip img{height:5.75rem !important;filter:grayscale(1) contrast(1.12) brightness(0.88) !important;opacity:0.82 !important;}`,
  },
  {
    note: "partner-darken-blend",
    css: `.partner-strip{gap:2rem !important;}
.partner-strip img{height:6.25rem !important;mix-blend-mode:darken !important;filter:grayscale(1) contrast(1.1) brightness(0.9) !important;opacity:0.85 !important;}`,
  },
  {
    note: "partner-h55-quiet",
    css: `.partner-strip{gap:1.75rem !important;}
.partner-strip img{height:5.5rem !important;filter:grayscale(1) contrast(1.15) brightness(0.86) !important;opacity:0.8 !important;mix-blend-mode:multiply !important;}`,
  },
  {
    note: "proof-pad-quiet",
    css: `.look--proof .look-inner{padding:18rem 0 14rem !important;}
.partner-strip{gap:2rem !important;}
.partner-strip img{height:6.25rem !important;filter:grayscale(1) contrast(1.08) brightness(0.92) !important;opacity:0.88 !important;}`,
  },
  {
    note: "partner-h625-plus-gap",
    css: `.partner-strip{gap:2.15rem !important;justify-content:center;}
.partner-strip img{height:6.25rem !important;max-width:210px !important;filter:grayscale(1) contrast(1.1) brightness(0.9) !important;opacity:0.84 !important;}
@media (max-width:767px){.partner-strip img{height:3.15rem !important;max-width:120px !important;}}`,
  },
];

async function measure(page) {
  return page.evaluate(() => {
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
    const play = [...document.querySelectorAll("a,button")].find((el) =>
      /view process/i.test(el.textContent || "")
    );
    const playR = play?.getBoundingClientRect();
    let oralOverlap = 0;
    if (playR && vr) {
      const oral = {
        left: vr.left + vr.width * 0.25,
        right: vr.left + vr.width * 0.75,
        top: vr.top + vr.height * 0.2,
        bottom: vr.top + vr.height * 0.8,
      };
      const ox = Math.max(0, Math.min(playR.right, oral.right) - Math.max(playR.left, oral.left));
      const oy = Math.max(0, Math.min(playR.bottom, oral.bottom) - Math.max(playR.top, oral.top));
      oralOverlap = ox * oy;
    }
    const title = q("#solution-title").getBoundingClientRect();
    const lms = q(".mechanism-lms").getBoundingClientRect();
    const band = q(".demo-band");
    const chrome = vr.top - fr.top;
    const imgs = [...document.querySelectorAll(".partner-strip img")].map((img) => {
      const cs = getComputedStyle(img);
      const r = img.getBoundingClientRect();
      return {
        alt: img.alt,
        w: +r.width.toFixed(1),
        h: +r.height.toFixed(1),
        filter: cs.filter,
        mix: cs.mixBlendMode,
        op: cs.opacity,
        heightCss: cs.height,
      };
    });
    const strip = q(".partner-strip");
    const proof = q(".look--proof");
    const footer = q(".look--footer");
    const h2 = q(".look--footer h2");
    const cta = q(".look--footer .cta-trial");
    const email = q(".footer-email");
    const social = q(".social-links");
    const copy = q(".copyright");
    const gap = (a, b) => +(b.getBoundingClientRect().top - a.getBoundingClientRect().bottom).toFixed(1);
    const lede = q(".look--hero .lede");
    const heroCta = q(".look--hero .cta-trial");
    const proc = [...document.querySelectorAll("a")].find((el) =>
      /view the process/i.test(el.textContent || "")
    );
    const desk = q(".hero-desk");
    const gapHero = (a, b) =>
      a && b ? +(b.getBoundingClientRect().top - a.getBoundingClientRect().bottom).toFixed(1) : null;
    return {
      chromeAbove: +chrome.toFixed(1),
      videoShare: +((vis(video) / Math.max(1, vis(frame))) * 100).toFixed(1),
      playFill: playR && chrome > 0 ? +((playR.height / chrome) * 100).toFixed(1) : null,
      oralOverlap: +oralOverlap.toFixed(1),
      playClearVideo: playR
        ? !(
            playR.bottom > vr.top &&
            playR.top < vr.bottom &&
            playR.right > vr.left &&
            playR.left < vr.right
          )
        : null,
      optical: +(title.top + title.height / 2 - innerHeight / 2).toFixed(1),
      claimShare: +(((Math.min(lms.bottom, fr.top) - title.top) / innerHeight) * 100).toFixed(1),
      lmsToDemo: +(fr.top - lms.bottom).toFixed(1),
      demoVis: +vis(frame).toFixed(1),
      isIn: /\bis-in\b/.test(band.className),
      interestPVis: +vis(q(".look--copy p")).toFixed(1),
      partnersPeek: +vis(q("#partners")).toFixed(1) &&
        (() => {
          q("#urgency")?.scrollIntoView({ block: "center" });
          return null;
        })(),
      stripGap: strip ? getComputedStyle(strip).gap : null,
      imgs,
      proofGrain: getComputedStyle(proof, "::before").opacity,
      proofPad: getComputedStyle(q(".look--proof .look-inner")).padding,
      hasFooterBefore: getComputedStyle(footer, "::before").content !== "none",
      footerBeforeOp: getComputedStyle(footer, "::before").opacity,
      h2Cta: gap(h2, cta),
      ctaEmail: gap(cta, email),
      emailSocial: gap(email, social),
      socialCopy: gap(social, copy),
      ledeCta: gapHero(lede, heroCta),
      ctaProc: gapHero(heroCta, proc),
      procDesk: gapHero(proc, desk),
      deskVis: +vis(desk).toFixed(1),
      urgPeek: +vis(q("#urgency")).toFixed(1),
      contactPeek: +vis(q("#contact") || footer).toFixed(1),
    };
  });
}

async function landProcess(page) {
  await page.evaluate(() => {
    const el = document.querySelector("#solution-title") || document.querySelector(".look--solution h2");
    el.scrollIntoView({ block: "center" });
  });
  await page.waitForTimeout(700);
  await page.evaluate(() => {
    const band = document.querySelector(".demo-band");
    if (band && !band.classList.contains("is-in")) band.classList.add("is-in");
  });
  await page.waitForTimeout(120);
}

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const probe of probes) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
    if (probe.css) {
      await page.addStyleTag({ content: probe.css });
    }
    await page.evaluate(() => {
      document.querySelector("#partners")?.scrollIntoView({ block: "center" });
    });
    await page.waitForTimeout(350);
    await page.screenshot({
      path: path.join(out, `capture-d1280-partners-${probe.note}.png`),
    });
    const atPartners = await page.evaluate(() => {
      const q = (s) => document.querySelector(s);
      const vis = (el) => {
        if (!el) return 0;
        const b = el.getBoundingClientRect();
        return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
      };
      const imgs = [...document.querySelectorAll(".partner-strip img")].map((img) => {
        const cs = getComputedStyle(img);
        const r = img.getBoundingClientRect();
        return {
          alt: img.alt,
          w: +r.width.toFixed(1),
          h: +r.height.toFixed(1),
          filter: cs.filter,
          mix: cs.mixBlendMode,
          op: cs.opacity,
          heightCss: cs.height,
        };
      });
      return {
        urgPeek: +vis(q("#urgency")).toFixed(1),
        contactPeek: +vis(q(".look--footer")).toFixed(1),
        proofGrain: getComputedStyle(q(".look--proof"), "::before").opacity,
        proofPad: getComputedStyle(q(".look--proof .look-inner")).padding,
        stripGap: getComputedStyle(q(".partner-strip")).gap,
        imgs,
        h2Fs: getComputedStyle(q(".look--proof h2")).fontSize,
        h2Mb: getComputedStyle(q(".look--proof h2")).marginBottom,
      };
    });

    await landProcess(page);
    const dual = await measure(page);

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(200);
    const hero = await page.evaluate(() => {
      const q = (s) => document.querySelector(s);
      const lede = q(".look--hero .lede") || q(".hero-lede") || [...document.querySelectorAll("p")].find((p) => /humans win/i.test(p.textContent || ""));
      const cta = q(".look--hero .cta-trial");
      const proc = [...document.querySelectorAll("a")].find((el) =>
        /view the process/i.test(el.textContent || "")
      );
      const desk = q(".hero-desk");
      const vis = (el) => {
        if (!el) return 0;
        const b = el.getBoundingClientRect();
        return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
      };
      const gap = (a, b) =>
        a && b ? +(b.getBoundingClientRect().top - a.getBoundingClientRect().bottom).toFixed(1) : null;
      return {
        ledeCta: gap(lede, cta),
        ctaProc: gap(cta, proc),
        procDesk: gap(proc, desk),
        deskVis: +vis(desk).toFixed(1),
      };
    });

    await page.evaluate(() => {
      const f = document.querySelector(".look--footer");
      window.scrollTo(0, f.getBoundingClientRect().top + window.scrollY - 80);
    });
    await page.waitForTimeout(200);
    const action = await page.evaluate(() => {
      const q = (s) => document.querySelector(s);
      const h2 = q(".look--footer h2");
      const cta = q(".look--footer .cta-trial");
      const email = q(".footer-email");
      const social = q(".social-links");
      const copy = q(".copyright");
      const footer = q(".look--footer");
      const gap = (a, b) => +(b.getBoundingClientRect().top - a.getBoundingClientRect().bottom).toFixed(1);
      return {
        h2Cta: gap(h2, cta),
        ctaEmail: gap(cta, email),
        emailSocial: gap(email, social),
        socialCopy: gap(social, copy),
        hasFooterBefore: getComputedStyle(footer, "::before").content !== "none",
        footerBeforeOp: getComputedStyle(footer, "::before").opacity,
      };
    });

    const dualGateOk =
      dual.lmsToDemo >= 40 &&
      dual.lmsToDemo <= 48 &&
      dual.demoVis >= 115 &&
      dual.isIn &&
      dual.interestPVis <= 12 &&
      dual.videoShare >= 74 &&
      dual.chromeAbove <= 32 &&
      dual.playFill <= 70 &&
      dual.oralOverlap === 0 &&
      dual.playClearVideo;
    const dualSeamOk = hero.ledeCta >= 18 && hero.ctaProc >= 18 && hero.procDesk >= 24;
    const actionOk =
      action.h2Cta >= 28 &&
      action.ctaEmail >= 48 &&
      action.emailSocial >= 16 &&
      action.socialCopy >= 28 &&
      action.hasFooterBefore &&
      Number(action.footerBeforeOp) >= 0.18 &&
      Number(action.footerBeforeOp) <= 0.22;
    const peeksOk = atPartners.urgPeek === 0 && atPartners.contactPeek === 0;

    results.push({
      note: probe.note,
      dualGateOk,
      dualSeamOk,
      actionOk,
      peeksOk,
      deskVisOk: hero.deskVis >= 165,
      atPartners,
      dual: {
        lmsToDemo: dual.lmsToDemo,
        demoVis: dual.demoVis,
        isIn: dual.isIn,
        interestPVis: dual.interestPVis,
        videoShare: dual.videoShare,
        chromeAbove: dual.chromeAbove,
        playFill: dual.playFill,
        optical: dual.optical,
        claimShare: dual.claimShare,
        oral: dual.oralOverlap,
        clear: dual.playClearVideo,
      },
      hero,
      action,
    });
    await page.close();
  }

  fs.writeFileSync(path.join(out, "partner-probes.json"), JSON.stringify(results, null, 2));
  console.log(
    JSON.stringify(
      results.map((r) => ({
        note: r.note,
        dualGateOk: r.dualGateOk,
        dualSeamOk: r.dualSeamOk,
        actionOk: r.actionOk,
        peeksOk: r.peeksOk,
        deskVisOk: r.deskVisOk,
        h: r.atPartners.imgs?.[0]?.h,
        op: r.atPartners.imgs?.[0]?.op,
        mix: r.atPartners.imgs?.[0]?.mix,
        gap: r.atPartners.stripGap,
        proofPad: r.atPartners.proofPad,
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
