const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../../src");
const PORT = 9350;
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

async function landChrome(page) {
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
    const cs = getComputedStyle(band);
    const chrome = vr.top - fr.top;
    return {
      chromeAbove: +chrome.toFixed(1),
      videoShare: +((vis(video) / Math.max(1, vis(frame))) * 100).toFixed(1),
      demoVis: +vis(frame).toFixed(1),
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
      isIn: /\bis-in\b/.test(band.className),
      interestPVis: +vis(q(".look--copy p")).toFixed(1),
      bandOpacity: cs.opacity,
      bandTransform: cs.transform,
      bandTransition: cs.transition,
      willReveal: band.classList.contains("will-reveal"),
    };
  });
}

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch({ headless: true });
  const d = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  const combos = [
    { note: "shipped" },
    {
      note: "demo-reveal-092",
      css: `.demo-band.will-reveal{opacity:0.92;transform:translateY(8px);}
.demo-band.will-reveal.is-in{opacity:1;transform:none;transition:transform 560ms cubic-bezier(0.22,1,0.36,1),opacity 480ms cubic-bezier(0.22,1,0.36,1);}`,
    },
    {
      note: "demo-reveal-094",
      css: `.demo-band.will-reveal{opacity:0.94;transform:translateY(8px);}
.demo-band.will-reveal.is-in{opacity:1;transform:none;transition:transform 560ms cubic-bezier(0.22,1,0.36,1),opacity 480ms cubic-bezier(0.22,1,0.36,1);}`,
    },
    {
      note: "demo-reveal-090-y10",
      css: `.demo-band.will-reveal{opacity:0.9;transform:translateY(10px);}
.demo-band.will-reveal.is-in{opacity:1;transform:none;transition:transform 560ms cubic-bezier(0.22,1,0.36,1),opacity 500ms cubic-bezier(0.22,1,0.36,1);}`,
    },
    {
      note: "proof-settle-094",
      css: `.look--proof.will-settle .look-inner{opacity:0.94;transform:translateY(12px);}
.look--proof.will-settle.is-settled .look-inner{opacity:1;transform:none;transition:transform 640ms cubic-bezier(0.22,1,0.36,1),opacity 520ms cubic-bezier(0.22,1,0.36,1);}`,
    },
    {
      note: "demo-092+proof-094",
      css: `.demo-band.will-reveal{opacity:0.92;transform:translateY(8px);}
.demo-band.will-reveal.is-in{opacity:1;transform:none;transition:transform 560ms cubic-bezier(0.22,1,0.36,1),opacity 480ms cubic-bezier(0.22,1,0.36,1);}
.look--proof.will-settle .look-inner{opacity:0.94;transform:translateY(12px);}
.look--proof.will-settle.is-settled .look-inner{opacity:1;transform:none;transition:transform 640ms cubic-bezier(0.22,1,0.36,1),opacity 520ms cubic-bezier(0.22,1,0.36,1);}`,
    },
  ];

  const out = [];
  for (const c of combos) {
    await d.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
    if (c.css) {
      await d.addStyleTag({ content: c.css });
    }

    // Hero dual-seam after presence settle
    await d.waitForTimeout(700);
    const hero = await d.evaluate(() => {
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
      const proc = q(".process-link");
      return {
        heroOpacity: cs.opacity,
        heroTransform: cs.transform,
        heroTransition: cs.transition,
        ledeCta: gap(q(".hero-lede"), q(".look--hero .cta-trial")),
        ctaProc: gap(q(".look--hero .cta-trial"), proc),
        procDesk: gap(proc, desk),
        deskVis: visH(desk),
        procFw: getComputedStyle(proc).fontWeight,
        procColor: getComputedStyle(proc).color,
        wordFs: getComputedStyle(q(".wordmark")).fontSize,
        markW: +q(".brand-mark").getBoundingClientRect().width.toFixed(1),
      };
    });

    // Restart demo reveal to catch pre opacity
    await d.evaluate(() => {
      const b = document.querySelector(".demo-band");
      b.classList.remove("is-in", "will-reveal");
      void b.offsetWidth;
      b.classList.add("will-reveal");
    });
    await d.waitForTimeout(40);
    const demoPre = await d.evaluate(() => {
      const b = document.querySelector(".demo-band");
      const cs = getComputedStyle(b);
      return {
        opacity: cs.opacity,
        transform: cs.transform,
        transition: cs.transition,
        willReveal: b.classList.contains("will-reveal"),
        isIn: b.classList.contains("is-in"),
      };
    });
    await d.evaluate(() => {
      const b = document.querySelector(".demo-band");
      requestAnimationFrame(() => b.classList.add("is-in"));
    });
    await d.waitForTimeout(650);
    const demoPost = await d.evaluate(() => {
      const b = document.querySelector(".demo-band");
      const cs = getComputedStyle(b);
      return {
        opacity: cs.opacity,
        transform: cs.transform,
        transition: cs.transition,
        isIn: b.classList.contains("is-in"),
      };
    });

    // Process land dual-gate
    await d.click(".process-link");
    await d.waitForTimeout(500);
    const land = await landChrome(d);

    // Proof settle pre/post if combo touches it
    let proofPre = null;
    let proofPost = null;
    if (/proof/i.test(c.note) || c.note === "shipped") {
      await d.evaluate(() => {
        const p = document.querySelector(".look--proof");
        p.classList.remove("is-settled", "will-settle");
        void p.offsetWidth;
        p.classList.add("will-settle");
        window.scrollTo(0, p.getBoundingClientRect().top + window.scrollY - 40);
      });
      await d.waitForTimeout(40);
      proofPre = await d.evaluate(() => {
        const inner = document.querySelector(".look--proof .look-inner");
        const cs = getComputedStyle(inner);
        return {
          opacity: cs.opacity,
          transform: cs.transform,
          transition: cs.transition,
        };
      });
      await d.evaluate(() => {
        const p = document.querySelector(".look--proof");
        requestAnimationFrame(() => p.classList.add("is-settled"));
      });
      await d.waitForTimeout(700);
      proofPost = await d.evaluate(() => {
        const inner = document.querySelector(".look--proof .look-inner");
        const cs = getComputedStyle(inner);
        return {
          opacity: cs.opacity,
          transform: cs.transform,
          transition: cs.transition,
          isSettled: document.querySelector(".look--proof").classList.contains("is-settled"),
        };
      });
    }

    const dualGateOk =
      land.lmsToDemo >= 40 &&
      land.lmsToDemo <= 48 &&
      land.demoVis >= 115 &&
      Math.abs(land.optical) <= 120 &&
      land.claimShare >= 40 &&
      land.isIn &&
      land.interestPVis <= 12 &&
      land.playClearVideo &&
      land.oralOverlap === 0 &&
      land.videoShare >= 74 &&
      land.chromeAbove <= 32 &&
      land.playFill != null &&
      land.playFill <= 70;

    const dualSeamOk = hero.ledeCta >= 18 && hero.ctaProc >= 18 && hero.procDesk >= 24;
    const deskVisOk = hero.deskVis >= 165;
    const demoOpacityChannel =
      Number(demoPre.opacity) < 1 &&
      Number(demoPost.opacity) === 1 &&
      /opacity/i.test(String(demoPost.transition || "")) &&
      /matrix\(1,\s*0,\s*0,\s*1,\s*0,\s*0\)|none/i.test(String(demoPost.transform || "none"));

    out.push({
      note: c.note,
      hero,
      demoPre,
      demoPost,
      land,
      proofPre,
      proofPost,
      dualSeamOk,
      deskVisOk,
      dualGateOk,
      demoOpacityChannel,
      presenceHold:
        Number(hero.heroOpacity) === 1 && /opacity/i.test(String(hero.heroTransition || "")),
      processHold: Number(hero.procFw) >= 500,
    });
  }

  fs.writeFileSync(path.join(__dirname, "demo-reveal-probes.json"), JSON.stringify(out, null, 2));
  console.log(
    JSON.stringify(
      out.map((r) => ({
        note: r.note,
        dualSeamOk: r.dualSeamOk,
        deskVisOk: r.deskVisOk,
        dualGateOk: r.dualGateOk,
        demoOpacityChannel: r.demoOpacityChannel,
        presenceHold: r.presenceHold,
        processHold: r.processHold,
        demoPreOp: r.demoPre.opacity,
        demoPostOp: r.demoPost.opacity,
        demoPostTx: r.demoPost.transition,
        proofPreOp: r.proofPre && r.proofPre.opacity,
        proofPostOp: r.proofPost && r.proofPost.opacity,
        proofPostTx: r.proofPost && r.proofPost.transition,
        lmsToDemo: r.land.lmsToDemo,
        demoVis: r.land.demoVis,
        optical: r.land.optical,
        claimShare: r.land.claimShare,
        interestPVis: r.land.interestPVis,
        videoShare: r.land.videoShare,
        chromeAbove: r.land.chromeAbove,
        playFill: r.land.playFill,
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
