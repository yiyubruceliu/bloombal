const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../../src");
const out = __dirname;
const PORT = 9238;

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
    const demo = fr;
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
      playLeft: play ? getComputedStyle(play).left : null,
      playFs: play ? getComputedStyle(play).fontSize : null,
      playPad: play ? getComputedStyle(play).padding : null,
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
      claimShare: +(((Math.min(lms.bottom, demo.top) - title.top) / innerHeight) * 100).toFixed(1),
      lmsToDemo: +(demo.top - lms.bottom).toFixed(1),
      isIn: /\bis-in\b/.test(band.className),
      interestPVis: +vis(q(".look--copy p")).toFixed(1),
      interestFieldVis: +vis(q(".look--copy")).toFixed(1),
    };
  });
}

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch({ headless: true });

  // Confirm mid isolation paid live (post iter-37)
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
      };
    });
    await p.close();
  }

  // Matte+play relocate — confirm still safe post pad restore; find best shippable
  const d = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await d.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  await d.click(".process-link");
  await d.waitForTimeout(500);
  const baseline = await landChrome(d);
  await d.screenshot({ path: path.join(out, "capture-d1280-demo-chrome.png") });

  const combos = [
    { pt: "2.75rem", playTop: "0.35rem", note: "baseline" },
    { pt: "2.25rem", playTop: "0.2rem" },
    { pt: "2.25rem", playTop: "0.15rem" },
    { pt: "2.1rem", playTop: "0.12rem" },
    { pt: "2.1rem", playTop: "0.1rem" },
    { pt: "2rem", playTop: "0.1rem" },
    { pt: "2rem", playTop: "0.08rem" },
    { pt: "1.85rem", playTop: "0.08rem" },
    { pt: "2.25rem", playTop: null, note: "pad-alone-unsafe" },
    { pt: "2.1rem", playTop: null, note: "pad-alone-unsafe" },
  ];
  const matteCombos = [];
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
      preferShare70: m.videoShare >= 70,
      preferChromeBelow45: m.chromeAbove < 45,
    });
  }

  // Also test pad-bottom trim on frame (below video) — alternate matte cut
  const padBottomCombos = [];
  for (const pb of ["0.75rem", "0.5rem", "0.35rem", "0.25rem", "0.15rem"]) {
    await d.evaluate((pb) => {
      const frame = document.querySelector(".demo-frame");
      const play = [...document.querySelectorAll("a,button")].find((el) =>
        /view process/i.test(el.textContent || "")
      );
      frame.style.padding = `2.75rem 0.75rem ${pb}`;
      if (play) {
        play.style.removeProperty("top");
        play.style.removeProperty("left");
      }
    }, pb);
    await d.click(".process-link");
    await d.waitForTimeout(400);
    const m = await landChrome(d);
    padBottomCombos.push({
      pb,
      chromeAbove: m.chromeAbove,
      chromeBelow: m.chromeBelow,
      mattePct: m.mattePct,
      videoShare: m.videoShare,
      demoVis: m.demoVis,
      clearOk: m.playClearVideo && m.oralOverlap === 0,
      dualGateOk:
        m.lmsToDemo >= 40 &&
        m.lmsToDemo <= 48 &&
        m.demoVis >= 115 &&
        Math.abs(m.optical) <= 120 &&
        m.claimShare >= 40 &&
        m.isIn,
    });
  }

  // reset frame
  await d.evaluate(() => {
    const frame = document.querySelector(".demo-frame");
    const play = [...document.querySelectorAll("a,button")].find((el) =>
      /view process/i.test(el.textContent || "")
    );
    frame.style.removeProperty("padding");
    if (play) {
      play.style.removeProperty("top");
      play.style.removeProperty("left");
    }
  });

  // Interest field strip residual at process land — still present?
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

  // Consequence centre — empty story mass vs H2 after mid paid?
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
      h2Vis: +vis(q("#urgency h2")).toFixed(1),
      pVis: +vis(q("#urgency p")).toFixed(1),
      storyVis: +vis(q(".look--story")).toFixed(1),
      emptyAboveH2: +(h2.top - Math.max(story.top, 0)).toFixed(1),
      emptyBelowP: +(Math.min(story.bottom, innerHeight) - p.bottom).toFixed(1),
      storyGrain: getComputedStyle(q(".look--story"), "::before").opacity,
      stickyPast: q(".look-indices")?.classList.contains("is-past"),
      urgMeasureCh: (() => {
        const el = q("#urgency p");
        const cs = getComputedStyle(el);
        const s = document.createElement("span");
        s.textContent = "abcdefghijklmnopqrstuvwxyz";
        s.style.cssText = `font:${cs.font};position:absolute;visibility:hidden;white-space:nowrap`;
        document.body.appendChild(s);
        const ch = s.getBoundingClientRect().width / 26;
        s.remove();
        return +(el.getBoundingClientRect().width / ch).toFixed(1);
      })(),
    };
  });

  // Proof centre peeks
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
      settled: document.querySelector(".look--proof")?.classList.contains("is-settled"),
    };
  });

  // Footer Action temperature
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
    const contact = document.querySelector(".look--footer a[href^='mailto']");
    const copy = document.querySelector(".look--footer .footer-copy, .look--footer small, .look--footer p");
    return {
      h2Color: cs.color,
      h2Fs: cs.fontSize,
      contrast: +ratio.toFixed(2),
      solutionH2Fs: getComputedStyle(document.querySelector("#solution-title")).fontSize,
      contactOp: contact ? getComputedStyle(contact).opacity : null,
      copyOp: copy ? getComputedStyle(copy).opacity : null,
    };
  });
  await d.close();

  const safeMatte = matteCombos.filter(
    (m) => m.dualGateOk && m.clearOk && (m.preferShare70 || m.preferChromeBelow45)
  );
  const padBottomSafe = padBottomCombos.filter(
    (m) => m.dualGateOk && m.clearOk && (m.videoShare >= 70 || m.chromeBelow < 12)
  );

  const result = {
    midConfirm,
    baseline,
    matteCombos,
    safeMatte,
    padBottomCombos,
    padBottomSafe,
    fieldStrip,
    urgencyCentre,
    partnersCentre,
    footer,
    recommendation: {
      midPaid:
        midConfirm.d1280?.urgH2Vis === 0 &&
        midConfirm.w1120?.urgH2Vis === 0 &&
        midConfirm.m390?.urgH2Vis === 0,
      mid1120: midConfirm.w1120,
      mid390: midConfirm.m390,
      bestMatte: safeMatte.find((m) => m.preferShare70) || safeMatte[0] || null,
      padBottomBest: padBottomSafe[0] || null,
      fieldStripResidual: fieldStrip.interestFieldVis > 50 && fieldStrip.interestPVis <= 12,
      nextPrimary: "demo-matte-relocate",
    },
  };

  fs.writeFileSync(path.join(out, "gap38.json"), JSON.stringify(result, null, 2));
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
        },
        safeMatte,
        padBottomSafe,
        fieldStrip,
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
