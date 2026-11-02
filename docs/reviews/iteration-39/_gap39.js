const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../../src");
const out = __dirname;
const PORT = 9239;

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
    return {
      chromeAbove: +(vr.top - fr.top).toFixed(1),
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
  await d.click(".process-link");
  await d.waitForTimeout(500);
  const baseline = await landChrome(d);
  await d.screenshot({ path: path.join(out, "capture-d1280-demo-chrome.png") });
  await d.screenshot({ path: path.join(out, "capture-d1280-process-land.png") });

  // Confirm paid matte; probe further safe cut with optional play shrink
  const matteCombos = [];
  const combos = [
    { pt: "2.25rem", playTop: "0.2rem", note: "iter38-shipped" },
    { pt: "2.1rem", playTop: "0.12rem" },
    { pt: "2.1rem", playTop: "0.1rem" },
    { pt: "2rem", playTop: "0.1rem" },
    { pt: "2rem", playTop: "0.08rem" },
    { pt: "1.85rem", playTop: "0.08rem" },
    { pt: "2.1rem", playTop: "0.12rem", playFs: "0.78rem", playPad: "0.28rem 0.7rem", note: "play-shrink" },
    { pt: "2rem", playTop: "0.08rem", playFs: "0.78rem", playPad: "0.28rem 0.7rem", note: "play-shrink" },
    { pt: "1.85rem", playTop: "0.06rem", playFs: "0.75rem", playPad: "0.25rem 0.65rem", note: "play-shrink" },
  ];
  for (const c of combos) {
    await d.evaluate((c) => {
      const frame = document.querySelector(".demo-frame");
      const play = [...document.querySelectorAll("a,button")].find((el) =>
        /view process/i.test(el.textContent || "")
      );
      frame.style.padding = `${c.pt} 0.75rem 0.75rem`;
      if (play) {
        if (c.playTop) play.style.top = c.playTop;
        else play.style.removeProperty("top");
        if (c.playFs) play.style.fontSize = c.playFs;
        else play.style.removeProperty("font-size");
        if (c.playPad) play.style.padding = c.playPad;
        else play.style.removeProperty("padding");
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
    });
  }

  // reset play/frame
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

  // Interest field strip residual — grain/field bridge (no pad war)
  await d.click(".process-link");
  await d.waitForTimeout(500);
  const fieldStrip = await d.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const vis = (el) => {
      if (!el) return 0;
      const b = el.getBoundingClientRect();
      return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    };
    const copy = q(".look--copy");
    const p = q(".look--copy p");
    const parseRgb = (c) => {
      const m = (c || "").match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      return m ? [+m[1], +m[2], +m[3]] : [0, 0, 0];
    };
    const copyRgb = parseRgb(getComputedStyle(copy).backgroundColor);
    const boneRgb = parseRgb(getComputedStyle(q(".look--solution")).backgroundColor);
    return {
      interestPVis: +vis(p).toFixed(1),
      interestH2Vis: +vis(q(".look--copy h2")).toFixed(1),
      interestFieldVis: +vis(copy).toFixed(1),
      deadBelowP: +(copy.getBoundingClientRect().bottom - p.getBoundingClientRect().bottom).toFixed(
        1
      ),
      copyField: getComputedStyle(copy).backgroundColor,
      solutionField: getComputedStyle(q(".look--solution")).backgroundColor,
      fieldDeltaRgb: Math.max(
        Math.abs(copyRgb[0] - boneRgb[0]),
        Math.abs(copyRgb[1] - boneRgb[1]),
        Math.abs(copyRgb[2] - boneRgb[2])
      ),
      copyGrain: getComputedStyle(copy, "::before").opacity,
      solutionGrain: getComputedStyle(q(".look--solution"), "::before").opacity,
    };
  });
  await d.screenshot({ path: path.join(out, "capture-d1280-field-bone.png") });

  // Grain bridge sweep: match Interest grain toward solution without pad/colour war
  const grainSweep = [];
  for (const op of ["0.45", "0.35", "0.3", "0.25", "0.2"]) {
    await d.evaluate((op) => {
      const copy = document.querySelector(".look--copy");
      // override ::before via injected style tag
      let s = document.getElementById("gap39-grain");
      if (!s) {
        s = document.createElement("style");
        s.id = "gap39-grain";
        document.head.appendChild(s);
      }
      s.textContent = `.look--copy::before{opacity:${op} !important;}`;
    }, op);
    await d.click(".process-link");
    await d.waitForTimeout(350);
    const m = await d.evaluate(() => {
      const q = (s) => document.querySelector(s);
      const vis = (el) => {
        if (!el) return 0;
        const b = el.getBoundingClientRect();
        return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
      };
      return {
        interestPVis: +vis(q(".look--copy p")).toFixed(1),
        interestFieldVis: +vis(q(".look--copy")).toFixed(1),
        copyGrain: getComputedStyle(q(".look--copy"), "::before").opacity,
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
        isIn: /\bis-in\b/.test(q(".demo-band").className),
      };
    });
    grainSweep.push({ op, ...m });
  }
  await d.evaluate(() => document.getElementById("gap39-grain")?.remove());

  // Bone-match + grain bridge together (visual seam only)
  const bridgeCombos = [];
  for (const c of [
    { field: "#f8f6f1", grain: "0.45", note: "baseline" },
    { field: "var(--bone)", grain: "0.45", note: "bone-only" },
    { field: "var(--bone)", grain: "0.25", note: "bone+grain25" },
    { field: "var(--bone)", grain: "0.3", note: "bone+grain30" },
    { field: "#f8f6f1", grain: "0.25", note: "grain25-only" },
    { field: "#f8f6f1", grain: "0.3", note: "grain30-only" },
  ]) {
    await d.evaluate((c) => {
      let s = document.getElementById("gap39-bridge");
      if (!s) {
        s = document.createElement("style");
        s.id = "gap39-bridge";
        document.head.appendChild(s);
      }
      s.textContent = `.look--copy{background:${c.field} !important;}.look--copy::before{opacity:${c.grain} !important;}`;
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
      const copyRgb = parseRgb(getComputedStyle(q(".look--copy")).backgroundColor);
      const boneRgb = parseRgb(getComputedStyle(q(".look--solution")).backgroundColor);
      return {
        interestPVis: +vis(q(".look--copy p")).toFixed(1),
        interestFieldVis: +vis(q(".look--copy")).toFixed(1),
        copyField: getComputedStyle(q(".look--copy")).backgroundColor,
        fieldDeltaRgb: Math.max(
          Math.abs(copyRgb[0] - boneRgb[0]),
          Math.abs(copyRgb[1] - boneRgb[1]),
          Math.abs(copyRgb[2] - boneRgb[2])
        ),
        copyGrain: getComputedStyle(q(".look--copy"), "::before").opacity,
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
        isIn: /\bis-in\b/.test(q(".demo-band").className),
        interestHashWouldNeed: null,
      };
    });
    // also check Interest hash optical still roughly -45
    await d.goto(`http://127.0.0.1:${PORT}/#problem`, { waitUntil: "networkidle" });
    await d.waitForTimeout(300);
    const hashOptical = await d.evaluate(() => {
      const h2 = document.querySelector(".look--copy h2").getBoundingClientRect();
      return +(h2.top + h2.height / 2 - innerHeight / 2).toFixed(1);
    });
    bridgeCombos.push({ ...c, ...m, interestHashOptical: hashOptical });
    await d.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
    await d.waitForTimeout(200);
  }
  await d.evaluate(() => document.getElementById("gap39-bridge")?.remove());

  // Play chrome mass in matte — how much of chromeAbove is play vs empty plaque
  await d.click(".process-link");
  await d.waitForTimeout(500);
  const playMatteMass = await d.evaluate(() => {
    const frame = document.querySelector(".demo-frame");
    const video = document.querySelector(".demo-frame video") || document.querySelector(".demo-video");
    const play = [...document.querySelectorAll("a,button")].find((el) =>
      /view process/i.test(el.textContent || "")
    );
    const fr = frame.getBoundingClientRect();
    const vr = video.getBoundingClientRect();
    const pr = play.getBoundingClientRect();
    const chromeH = vr.top - fr.top;
    return {
      chromeAbove: +chromeH.toFixed(1),
      playH: +pr.height.toFixed(1),
      playFillOfChrome: +((pr.height / chromeH) * 100).toFixed(1),
      emptyMatteAbovePlay: +(pr.top - fr.top).toFixed(1),
      emptyMatteBelowPlay: +(vr.top - pr.bottom).toFixed(1),
      playFs: getComputedStyle(play).fontSize,
      playPad: getComputedStyle(play).padding,
      playTop: getComputedStyle(play).top,
      playLetterSpacing: getComputedStyle(play).letterSpacing,
    };
  });

  // Urgency centre residual
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

  // Interest hash capture
  await d.goto(`http://127.0.0.1:${PORT}/#problem`, { waitUntil: "networkidle" });
  await d.waitForTimeout(350);
  await d.screenshot({ path: path.join(out, "capture-d1280-interest-hash.png") });
  await d.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  await d.waitForTimeout(300);
  await d.screenshot({ path: path.join(out, "capture-d1280-hero.png") });

  // 1120 / 390 process land
  for (const [w, h, label] of [
    [1120, 720, "w1120"],
    [390, 844, "m390"],
  ]) {
    const p = await browser.newPage({ viewport: { width: w, height: h } });
    await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
    await p.click(".process-link");
    await p.waitForTimeout(500);
    await p.screenshot({ path: path.join(out, `capture-${label}-process-land.png`) });
    if (label === "m390") await p.screenshot({ path: path.join(out, "capture-m390-hero.png") });
    await p.close();
  }

  const safeFurther = matteCombos.filter(
    (m) => m.dualGateOk && m.clearOk && (m.preferShare72 || m.preferChrome35) && m.note !== "iter38-shipped"
  );

  const result = {
    midConfirm,
    baseline,
    matteCombos,
    safeFurther,
    fieldStrip,
    grainSweep,
    bridgeCombos,
    playMatteMass,
    urgencyCentre,
    partnersCentre,
    footer,
    recommendation: {
      iter38Paid:
        baseline.videoShare >= 70 &&
        baseline.chromeAbove <= 37 &&
        baseline.playClearVideo &&
        baseline.oralOverlap === 0,
      midPaid:
        midConfirm.d1280?.urgH2Vis === 0 &&
        midConfirm.w1120?.urgH2Vis === 0 &&
        midConfirm.m390?.urgH2Vis === 0,
      playFillsChrome: playMatteMass.playFillOfChrome >= 80,
      bestFurtherMatte: safeFurther[0] || null,
      fieldStripResidual: fieldStrip.interestFieldVis > 50 && fieldStrip.interestPVis <= 12,
      grainBridgeSafe: grainSweep.filter((g) => g.interestPVis <= 12 && g.isIn),
      nextPrimary: null,
    },
  };

  // Decide next primary
  if (result.recommendation.playFillsChrome && safeFurther.length) {
    result.recommendation.nextPrimary = "demo-play-shrink+matte-cut";
  } else if (safeFurther.length) {
    result.recommendation.nextPrimary = "demo-matte-further-cut";
  } else if (result.recommendation.fieldStripResidual) {
    result.recommendation.nextPrimary = "interest-grain-bridge";
  } else {
    result.recommendation.nextPrimary = "scan-captures-for-craft";
  }

  fs.writeFileSync(path.join(out, "gap39.json"), JSON.stringify(result, null, 2));
  console.log(
    JSON.stringify(
      {
        midConfirm,
        baseline: {
          videoShare: baseline.videoShare,
          chromeAbove: baseline.chromeAbove,
          mattePct: baseline.mattePct,
          playClear: baseline.playClearVideo,
          oral: baseline.oralOverlap,
          playH: baseline.playH,
        },
        playMatteMass,
        safeFurther,
        fieldStrip,
        grainSweep,
        bridgeCombos: bridgeCombos.map((b) => ({
          note: b.note,
          fieldDeltaRgb: b.fieldDeltaRgb,
          copyGrain: b.copyGrain,
          interestPVis: b.interestPVis,
          interestFieldVis: b.interestFieldVis,
          interestHashOptical: b.interestHashOptical,
          isIn: b.isIn,
          lmsToDemo: b.lmsToDemo,
        })),
        urgencyCentre,
        partnersCentre,
        footer,
        recommendation: result.recommendation,
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
