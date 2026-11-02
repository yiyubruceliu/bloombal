const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../../src");
const out = __dirname;
const PORT = 9340;

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
    const chrome = vr.top - fr.top;
    return {
      chromeAbove: +chrome.toFixed(1),
      chromeBelow: +(fr.bottom - vr.bottom).toFixed(1),
      mattePct: +(((fr.height - vr.height) / fr.height) * 100).toFixed(1),
      demoVis: +vis(frame).toFixed(1),
      videoVis: +vis(video).toFixed(1),
      videoShare: +((vis(video) / Math.max(1, vis(frame))) * 100).toFixed(1),
      framePad: getComputedStyle(frame).padding,
      playTop: play ? getComputedStyle(play).top : null,
      playFs: play ? getComputedStyle(play).fontSize : null,
      playPad: play ? getComputedStyle(play).padding : null,
      playH: playR ? +playR.height.toFixed(1) : null,
      playFill: playR && chrome > 0 ? +((playR.height / chrome) * 100).toFixed(1) : null,
      emptyAbove: playR ? +(playR.top - fr.top).toFixed(1) : null,
      emptyBelow: playR ? +(vr.top - playR.bottom).toFixed(1) : null,
      oralOverlap: +oralOverlap.toFixed(1),
      playClearVideo: playR
        ? !(
            playR.bottom > vr.top &&
            playR.top < vr.bottom &&
            playR.right > vr.left &&
            playR.left < vr.right
          )
        : null,
      playInMatte: playR ? playR.bottom <= vr.top + 1 : null,
      optical: +(title.top + title.height / 2 - innerHeight / 2).toFixed(1),
      claimShare: +(((Math.min(lms.bottom, fr.top) - title.top) / innerHeight) * 100).toFixed(1),
      lmsToDemo: +(fr.top - lms.bottom).toFixed(1),
      isIn: /\bis-in\b/.test(band.className),
      interestPVis: +vis(q(".look--copy p")).toFixed(1),
      interestH2Vis: +vis(q(".look--copy h2")).toFixed(1),
      interestFieldVis: +vis(q(".look--copy")).toFixed(1),
    };
  });
}

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch({ headless: true });

  const midConfirm = {};
  for (const [w, h, label] of [
    [1280, 720, "d1280"],
    [1120, 720, "w1120"],
    [390, 844, "m390"],
  ]) {
    const p = await browser.newPage({ viewport: { width: w, height: h } });
    await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
    await p.evaluate(() =>
      document.querySelector(".look-inner--after-demo").scrollIntoView({ block: "center" })
    );
    await p.waitForTimeout(280);
    await p.screenshot({ path: path.join(out, `capture-${label}-mid-block-center.png`) });
    midConfirm[label] = await p.evaluate(() => {
      const q = (s) => document.querySelector(s);
      const vis = (el) => {
        if (!el) return 0;
        const b = el.getBoundingClientRect();
        return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
      };
      const demo = q(".demo-frame").getBoundingClientRect();
      const cta = q(".look-inner--after-demo .cta-trial").getBoundingClientRect();
      const story = q(".look--story");
      return {
        gapDemoToCta: +(cta.top - demo.bottom).toFixed(1),
        urgH2Vis: +vis(q("#urgency h2")).toFixed(1),
        urgPVis: +vis(q("#urgency p")).toFixed(1),
        storyVis: +vis(story).toFixed(1),
        afterPadT: getComputedStyle(q(".look-inner--after-demo")).paddingTop,
        afterPadB: getComputedStyle(q(".look-inner--after-demo")).paddingBottom,
        deltaCx: +(cta.left + cta.width / 2 - innerWidth / 2).toFixed(1),
      };
    });
    await p.close();
  }

  const d = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await d.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  await d.screenshot({ path: path.join(out, "capture-d1280-hero.png") });
  await d.click(".process-link");
  await d.waitForTimeout(500);
  const baseline = await landChrome(d);
  await d.screenshot({ path: path.join(out, "capture-d1280-process-land.png") });
  await d.screenshot({ path: path.join(out, "capture-d1280-demo-chrome.png") });

  // Field anatomy at Desire land
  const fieldAnatomy = await d.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const copy = q(".look--copy");
    const p = q(".look--copy p");
    const h2 = q(".look--copy h2");
    const sol = q(".look--solution");
    const parseRgb = (c) => {
      const m = (c || "").match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      return m ? [+m[1], +m[2], +m[3]] : [0, 0, 0];
    };
    const copyRgb = parseRgb(getComputedStyle(copy).backgroundColor);
    const boneRgb = parseRgb(getComputedStyle(sol).backgroundColor);
    const cr = copy.getBoundingClientRect();
    const pr = p.getBoundingClientRect();
    const hr = h2.getBoundingClientRect();
    const vis = (b) => Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    return {
      copyTop: +cr.top.toFixed(1),
      copyBottom: +cr.bottom.toFixed(1),
      pTop: +pr.top.toFixed(1),
      pBottom: +pr.bottom.toFixed(1),
      h2Top: +hr.top.toFixed(1),
      h2Bottom: +hr.bottom.toFixed(1),
      deadBelowP: +(cr.bottom - pr.bottom).toFixed(1),
      deadAboveInView: +(Math.min(pr.top, innerHeight) - Math.max(cr.top, 0)).toFixed(1),
      fieldVis: +vis(cr).toFixed(1),
      pVis: +vis(pr).toFixed(1),
      h2Vis: +vis(hr).toFixed(1),
      copyPad: getComputedStyle(q(".look--copy .look-inner")).padding,
      copyField: getComputedStyle(copy).backgroundColor,
      solutionField: getComputedStyle(sol).backgroundColor,
      fieldDeltaRgb: Math.max(
        Math.abs(copyRgb[0] - boneRgb[0]),
        Math.abs(copyRgb[1] - boneRgb[1]),
        Math.abs(copyRgb[2] - boneRgb[2])
      ),
      copyGrain: getComputedStyle(copy, "::before").opacity,
      solutionGrain: getComputedStyle(sol, "::before").opacity,
      copyBorderTop: getComputedStyle(copy).borderTop,
    };
  });
  await d.screenshot({ path: path.join(out, "capture-d1280-field-bone.png") });

  // Further matte prefer probes (iter39 paid floor; prefer deeper)
  const matteCombos = [];
  for (const c of [
    { note: "shipped-iter39" },
    { pt: "2rem", playTop: "0.08rem", note: "2.0+top" },
    {
      pt: "2rem",
      playTop: "0.08rem",
      playFs: "0.75rem",
      playPad: "0.25rem 0.65rem",
      note: "2.0+tighter-play",
    },
    { pt: "1.85rem", playTop: "0.06rem", note: "1.85+top" },
    {
      pt: "1.85rem",
      playTop: "0.06rem",
      playFs: "0.75rem",
      playPad: "0.25rem 0.65rem",
      note: "1.85+tighter-play",
    },
    {
      playFs: "0.72rem",
      playPad: "0.22rem 0.6rem",
      note: "play-quieter-only",
    },
  ]) {
    await d.evaluate((c) => {
      const frame = document.querySelector(".demo-frame");
      const play = [...document.querySelectorAll("a,button")].find((el) =>
        /view process/i.test(el.textContent || "")
      );
      frame.style.removeProperty("padding");
      if (play) {
        play.style.removeProperty("top");
        play.style.removeProperty("font-size");
        play.style.removeProperty("padding");
      }
      if (c.pt) frame.style.padding = `${c.pt} 0.75rem 0.75rem`;
      if (play) {
        if (c.playTop) play.style.top = c.playTop;
        if (c.playFs) play.style.fontSize = c.playFs;
        if (c.playPad) play.style.padding = c.playPad;
      }
    }, c);
    await d.click(".process-link");
    await d.waitForTimeout(400);
    const m = await landChrome(d);
    matteCombos.push({
      ...c,
      ...m,
      dualGateOk:
        m.lmsToDemo >= 40 &&
        m.lmsToDemo <= 48 &&
        m.demoVis >= 115 &&
        Math.abs(m.optical) <= 120 &&
        m.claimShare >= 40 &&
        m.isIn,
      clearOk: m.playClearVideo && m.oralOverlap === 0,
      preferShare72: m.videoShare >= 72,
      preferChrome35: m.chromeAbove <= 35,
      preferShare74: m.videoShare >= 74,
      preferChrome32: m.chromeAbove <= 32,
      playQuiet: m.playFill != null && m.playFill < 70,
    });
  }
  await d.evaluate(() => {
    const frame = document.querySelector(".demo-frame");
    const play = [...document.querySelectorAll("a,button")].find((el) =>
      /view process/i.test(el.textContent || "")
    );
    frame.style.removeProperty("padding");
    if (play) {
      play.style.removeProperty("top");
      play.style.removeProperty("font-size");
      play.style.removeProperty("padding");
    }
  });

  // Interest field colour/grain bridge + fade seam (non-pad)
  await d.click(".process-link");
  await d.waitForTimeout(450);
  const bridgeCombos = [];
  for (const c of [
    { note: "baseline" },
    { field: "var(--bone)", grain: "0.45", note: "bone-only" },
    { field: "var(--bone)", grain: "0.25", note: "bone+grain25" },
    { field: "var(--bone)", grain: "0.3", note: "bone+grain30" },
    { field: "#f8f6f1", grain: "0.25", note: "grain25-only" },
    { field: "#f7f5f0", grain: "0.35", note: "midfield+grain35" },
    {
      field: "var(--bone)",
      grain: "0.25",
      fade: true,
      note: "bone+grain25+fade",
    },
    {
      field: "#f8f6f1",
      grain: "0.45",
      fade: true,
      note: "fade-only",
    },
    {
      field: "var(--bone)",
      grain: "0.25",
      borderOff: true,
      note: "bone+grain25+noBorder",
    },
  ]) {
    await d.evaluate((c) => {
      let s = document.getElementById("gap40-bridge");
      if (!s) {
        s = document.createElement("style");
        s.id = "gap40-bridge";
        document.head.appendChild(s);
      }
      let css = "";
      if (c.field) css += `.look--copy{background:${c.field} !important;}`;
      if (c.grain) css += `.look--copy::before{opacity:${c.grain} !important;}`;
      if (c.borderOff) css += `.look--copy{border-top:none !important;}`;
      if (c.fade) {
        css += `.look--copy{mask-image:linear-gradient(to bottom, #000 0%, #000 72%, transparent 100%); -webkit-mask-image:linear-gradient(to bottom, #000 0%, #000 72%, transparent 100%);}`;
      }
      s.textContent = css;
    }, c);
    await d.click(".process-link");
    await d.waitForTimeout(350);
    const m = await d.evaluate(() => {
      const q = (s) => document.querySelector(s);
      const vis = (el) => {
        if (!el) return 0;
        const b = el.getBoundingClientRect();
        return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
      };
      const parseRgb = (col) => {
        const mm = (col || "").match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        return mm ? [+mm[1], +mm[2], +mm[3]] : [0, 0, 0];
      };
      const copy = q(".look--copy");
      const p = q(".look--copy p");
      const copyRgb = parseRgb(getComputedStyle(copy).backgroundColor);
      const boneRgb = parseRgb(getComputedStyle(q(".look--solution")).backgroundColor);
      const sampleY = Math.min(innerHeight - 2, Math.max(0, copy.getBoundingClientRect().bottom - 8));
      // sample mid-x at near-bottom of visible Interest strip
      return {
        interestPVis: +vis(p).toFixed(1),
        interestFieldVis: +vis(copy).toFixed(1),
        deadBelowP: +(copy.getBoundingClientRect().bottom - p.getBoundingClientRect().bottom).toFixed(
          1
        ),
        copyField: getComputedStyle(copy).backgroundColor,
        fieldDeltaRgb: Math.max(
          Math.abs(copyRgb[0] - boneRgb[0]),
          Math.abs(copyRgb[1] - boneRgb[1]),
          Math.abs(copyRgb[2] - boneRgb[2])
        ),
        copyGrain: getComputedStyle(copy, "::before").opacity,
        solutionGrain: getComputedStyle(q(".look--solution"), "::before").opacity,
        optical: +(
          q("#solution-title").getBoundingClientRect().top +
          q("#solution-title").getBoundingClientRect().height / 2 -
          innerHeight / 2
        ).toFixed(1),
        lmsToDemo: +(
          q(".demo-frame").getBoundingClientRect().top -
          q(".mechanism-lms").getBoundingClientRect().bottom
        ).toFixed(1),
        claimShare: +(
          ((Math.min(
            q(".mechanism-lms").getBoundingClientRect().bottom,
            q(".demo-frame").getBoundingClientRect().top
          ) -
            q("#solution-title").getBoundingClientRect().top) /
            innerHeight) *
          100
        ).toFixed(1),
        demoVis: +vis(q(".demo-frame")).toFixed(1),
        isIn: /\bis-in\b/.test(q(".demo-band").className),
        sampleY,
      };
    });
    bridgeCombos.push({ ...c, ...m });
  }
  await d.evaluate(() => document.getElementById("gap40-bridge")?.remove());

  // Dead-pad sweep: confirm padB claw still reopens body
  const deadPadSweep = [];
  for (const pb of ["12rem", "11rem", "10rem", "9rem", "8rem"]) {
    await d.evaluate((pb) => {
      let s = document.getElementById("gap40-pad");
      if (!s) {
        s = document.createElement("style");
        s.id = "gap40-pad";
        document.head.appendChild(s);
      }
      s.textContent = `.look--copy .look-inner{padding:6.75rem 0 ${pb} !important;}`;
    }, pb);
    await d.click(".process-link");
    await d.waitForTimeout(400);
    const m = await landChrome(d);
    deadPadSweep.push({
      pb,
      interestPVis: m.interestPVis,
      interestFieldVis: m.interestFieldVis,
      optical: m.optical,
      lmsToDemo: m.lmsToDemo,
      demoVis: m.demoVis,
      claimShare: m.claimShare,
      isIn: m.isIn,
      videoShare: m.videoShare,
    });
  }
  await d.evaluate(() => document.getElementById("gap40-pad")?.remove());

  // Attention dual-seam spot-check
  await d.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  await d.waitForTimeout(300);
  const hero = await d.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const brand = q(".look--hero .brand, .look-brand, .wordmark, header .brand");
    const h1 = q(".look--hero h1");
    const lede = q(".look--hero .lede, .look--hero p");
    const cta = q(".look--hero .cta-trial");
    const proc = q(".process-link");
    const desk = q(".hero-desk, .desk-plate, .look--hero img, .look--hero video");
    const gap = (a, b) => {
      if (!a || !b) return null;
      return +(b.getBoundingClientRect().top - a.getBoundingClientRect().bottom).toFixed(1);
    };
    const visH = (el) => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return +Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0)).toFixed(1);
    };
    return {
      ledeCta: gap(lede, cta),
      ctaProc: gap(cta, proc),
      procDesk: gap(proc, desk),
      deskVis: visH(desk),
      h1Text: h1?.textContent?.trim()?.slice(0, 80) || null,
    };
  });

  // Interest hash
  await d.goto(`http://127.0.0.1:${PORT}/#problem`, { waitUntil: "networkidle" });
  await d.waitForTimeout(350);
  await d.screenshot({ path: path.join(out, "capture-d1280-interest-hash.png") });
  const interestHash = await d.evaluate(() => {
    const h2 = document.querySelector(".look--copy h2, #problem h2");
    const b = h2.getBoundingClientRect();
    return { optical: +(b.top + b.height / 2 - innerHeight / 2).toFixed(1) };
  });

  // Urgency / partners / footer
  await d.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  await d.evaluate(() => {
    const h2 = document.querySelector("#urgency h2");
    const y =
      h2.getBoundingClientRect().top +
      window.scrollY -
      (innerHeight / 2 - h2.getBoundingClientRect().height / 2);
    window.scrollTo(0, Math.max(0, y));
  });
  await d.waitForTimeout(280);
  await d.screenshot({ path: path.join(out, "capture-d1280-urgency.png") });
  const urgencyCentre = await d.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const vis = (el) => {
      if (!el) return 0;
      const b = el.getBoundingClientRect();
      return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    };
    const h2 = q("#urgency h2").getBoundingClientRect();
    const p = q("#urgency p").getBoundingClientRect();
    const story = q(".look--story").getBoundingClientRect();
    return {
      partnersPeek: +vis(q("#partners")).toFixed(1),
      h2Optical: +(h2.top + h2.height / 2 - innerHeight / 2).toFixed(1),
      emptyAboveH2: +(h2.top - Math.max(story.top, 0)).toFixed(1),
      emptyBelowP: +(Math.min(story.bottom, innerHeight) - p.bottom).toFixed(1),
      storyGrain: getComputedStyle(q(".look--story"), "::before").opacity,
      stickyPast: q(".look-indices")?.classList.contains("is-past"),
    };
  });

  await d.evaluate(() => {
    const el = document.querySelector("#partners");
    const y =
      el.getBoundingClientRect().top +
      window.scrollY -
      (innerHeight / 2 - el.getBoundingClientRect().height / 2);
    window.scrollTo(0, Math.max(0, y));
  });
  await d.waitForTimeout(280);
  await d.screenshot({ path: path.join(out, "capture-d1280-partners.png") });
  const partnersCentre = await d.evaluate(() => {
    const vis = (el) => {
      if (!el) return 0;
      const b = el.getBoundingClientRect();
      return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    };
    return {
      urgPeek: +vis(document.querySelector("#urgency")).toFixed(1),
      contactPeek: +vis(document.querySelector("#contact")).toFixed(1),
      proofGrain: getComputedStyle(document.querySelector(".look--proof"), "::before").opacity,
    };
  });

  await d.evaluate(() => {
    const f = document.querySelector(".look--footer");
    window.scrollTo(0, f.getBoundingClientRect().top + window.scrollY - 80);
  });
  await d.waitForTimeout(250);
  await d.screenshot({ path: path.join(out, "capture-d1280-footer-start.png") });
  const footer = await d.evaluate(() => {
    const h2 = document.querySelector(".look--footer h2");
    const cs = getComputedStyle(h2);
    const parse = (c) => {
      const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      return m ? [+m[1], +m[2], +m[3]] : [0, 0, 0];
    };
    const lum = ([r, g, b]) => {
      const x = [r, g, b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * x[0] + 0.7152 * x[1] + 0.0722 * x[2];
    };
    const bg = getComputedStyle(document.querySelector(".look--footer")).backgroundColor;
    const L1 = lum(parse(cs.color));
    const L2 = lum(parse(bg));
    const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    return {
      contrast: +ratio.toFixed(2),
      h2Fs: cs.fontSize,
      solutionH2Fs: getComputedStyle(document.querySelector("#solution-title")).fontSize,
    };
  });

  for (const [w, h, label] of [
    [1120, 720, "w1120"],
    [390, 844, "m390"],
  ]) {
    const p = await browser.newPage({ viewport: { width: w, height: h } });
    await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
    if (label === "m390") await p.screenshot({ path: path.join(out, "capture-m390-hero.png") });
    await p.click(".process-link");
    await p.waitForTimeout(500);
    await p.screenshot({ path: path.join(out, `capture-${label}-process-land.png`) });
    await p.close();
  }

  const iter39Paid =
    baseline.videoShare >= 72 &&
    baseline.chromeAbove <= 35 &&
    baseline.playClearVideo &&
    baseline.oralOverlap === 0 &&
    baseline.playFill != null &&
    baseline.playFill < 83 &&
    baseline.lmsToDemo >= 40 &&
    baseline.lmsToDemo <= 48 &&
    baseline.demoVis >= 115 &&
    baseline.isIn &&
    baseline.interestPVis <= 12;

  const midPaid =
    midConfirm.d1280?.urgH2Vis === 0 &&
    midConfirm.w1120?.urgH2Vis === 0 &&
    midConfirm.m390?.urgH2Vis === 0;

  const safeFurther = matteCombos.filter(
    (m) =>
      m.note !== "shipped-iter39" &&
      m.dualGateOk &&
      m.clearOk &&
      (m.preferShare74 || m.preferChrome32 || m.playQuiet)
  );

  const bridgeSafe = bridgeCombos.filter(
    (b) =>
      b.note !== "baseline" &&
      b.interestPVis <= 12 &&
      b.isIn &&
      b.lmsToDemo >= 40 &&
      b.lmsToDemo <= 48 &&
      Math.abs(b.optical) <= 120 &&
      b.claimShare >= 40
  );

  let nextPrimary = "scan-captures-for-craft";
  if (fieldAnatomy.fieldDeltaRgb > 0 || Number(fieldAnatomy.copyGrain) !== 0.25) {
    nextPrimary = "interest-field-colour-grain-bridge";
  }
  if (safeFurther.length && baseline.playFill >= 70) {
    // quieter play or further matte still available but secondary if field unpaid
    if (nextPrimary === "scan-captures-for-craft") nextPrimary = "further-matte-or-play-quiet";
  }

  const result = {
    midConfirm,
    baseline,
    fieldAnatomy,
    matteCombos,
    safeFurther,
    bridgeCombos,
    bridgeSafe,
    deadPadSweep,
    hero,
    interestHash,
    urgencyCentre,
    partnersCentre,
    footer,
    acceptance: {
      iter39_videoShare72: baseline.videoShare >= 72,
      iter39_chrome35: baseline.chromeAbove <= 35,
      iter39_playFillUnder83: baseline.playFill != null && baseline.playFill < 83,
      iter39_clearOral: baseline.playClearVideo && baseline.oralOverlap === 0,
      iter39_dualGate: baseline.lmsToDemo >= 40 && baseline.lmsToDemo <= 48 && baseline.demoVis >= 115 && baseline.isIn,
      iter39_mid: midPaid,
      iter39Paid,
      midPaid,
    },
    recommendation: {
      nextPrimary,
      fieldStripResidual: fieldAnatomy.fieldVis > 50 && fieldAnatomy.pVis <= 12,
      colourBridgeUnpaid: fieldAnatomy.fieldDeltaRgb > 0,
      grainBridgeUnpaid: Number(fieldAnatomy.copyGrain) > 0.3,
      furtherMatteSafe: safeFurther,
    },
  };

  fs.writeFileSync(path.join(out, "verify39.json"), JSON.stringify(result, null, 2));
  console.log(
    JSON.stringify(
      {
        acceptance: result.acceptance,
        baseline: {
          videoShare: baseline.videoShare,
          chromeAbove: baseline.chromeAbove,
          playFill: baseline.playFill,
          playH: baseline.playH,
          clear: baseline.playClearVideo,
          oral: baseline.oralOverlap,
          lmsToDemo: baseline.lmsToDemo,
          demoVis: baseline.demoVis,
          isIn: baseline.isIn,
          interestPVis: baseline.interestPVis,
          interestFieldVis: baseline.interestFieldVis,
        },
        midConfirm,
        fieldAnatomy,
        safeFurther: safeFurther.map((m) => ({
          note: m.note,
          videoShare: m.videoShare,
          chromeAbove: m.chromeAbove,
          playFill: m.playFill,
          clearOk: m.clearOk,
          dualGateOk: m.dualGateOk,
        })),
        bridgeSafe: bridgeSafe.map((b) => ({
          note: b.note,
          fieldDeltaRgb: b.fieldDeltaRgb,
          copyGrain: b.copyGrain,
          interestPVis: b.interestPVis,
          interestFieldVis: b.interestFieldVis,
        })),
        deadPadSweep,
        hero,
        interestHash,
        nextPrimary,
      },
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
