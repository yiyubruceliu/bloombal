const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../../src");
const out = __dirname;
const PORT = 9139;

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

async function landSnap(page) {
  return page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const vis = (el) => {
      if (!el) return 0;
      const b = el.getBoundingClientRect();
      return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    };
    const title = q("#solution-title").getBoundingClientRect();
    const lms = q(".mechanism-lms").getBoundingClientRect();
    const demo = q(".demo-frame").getBoundingClientRect();
    const mech = q(".mechanism").getBoundingClientRect();
    const band = q(".demo-band");
    const copy = q(".look--copy");
    const p = q(".look--copy p");
    const video = q(".demo-frame video") || q(".demo-video");
    const frame = q(".demo-frame");
    const videoR = video.getBoundingClientRect();
    const play = [...document.querySelectorAll("a,button")].find((el) =>
      /view process/i.test(el.textContent || "")
    );
    const playR = play?.getBoundingClientRect();
    let oralOverlap = 0;
    if (playR && videoR) {
      const oral = {
        left: videoR.left + videoR.width * 0.25,
        right: videoR.left + videoR.width * 0.75,
        top: videoR.top + videoR.height * 0.2,
        bottom: videoR.top + videoR.height * 0.8,
      };
      const ox = Math.max(0, Math.min(playR.right, oral.right) - Math.max(playR.left, oral.left));
      const oy = Math.max(0, Math.min(playR.bottom, oral.bottom) - Math.max(playR.top, oral.top));
      oralOverlap = ox * oy;
    }
    const parseRgb = (c) => {
      const m = (c || "").match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      return m ? [+m[1], +m[2], +m[3]] : [0, 0, 0];
    };
    const copyRgb = parseRgb(getComputedStyle(copy).backgroundColor);
    const solRgb = parseRgb(getComputedStyle(q(".look--solution")).backgroundColor);
    return {
      interestPVis: +vis(p).toFixed(1),
      interestH2Vis: +vis(q(".look--copy h2")).toFixed(1),
      interestFieldVis: +vis(copy).toFixed(1),
      deadBelowP: +(copy.getBoundingClientRect().bottom - p.getBoundingClientRect().bottom).toFixed(
        1
      ),
      optical: +(title.top + title.height / 2 - innerHeight / 2).toFixed(1),
      claimShare: +(((Math.min(lms.bottom, demo.top) - title.top) / innerHeight) * 100).toFixed(1),
      demoVis: +vis(frame).toFixed(1),
      videoVis: +vis(video).toFixed(1),
      videoShare: +((vis(video) / Math.max(1, vis(frame))) * 100).toFixed(1),
      lmsToDemo: +(demo.top - lms.bottom).toFixed(1),
      titleToMech: +(mech.top - title.bottom).toFixed(1),
      mechToLms: +(lms.top - mech.bottom).toFixed(1),
      isIn: /\bis-in\b/.test(band.className),
      copyField: getComputedStyle(copy).backgroundColor,
      solutionField: getComputedStyle(q(".look--solution")).backgroundColor,
      fieldDeltaRgb: Math.max(
        Math.abs(copyRgb[0] - solRgb[0]),
        Math.abs(copyRgb[1] - solRgb[1]),
        Math.abs(copyRgb[2] - solRgb[2])
      ),
      copyGrain: getComputedStyle(copy, "::before").opacity,
      solutionGrain: getComputedStyle(q(".look--solution"), "::before").opacity,
      chromeAbove: +(videoR.top - demo.top).toFixed(1),
      chromeBelow: +(demo.bottom - videoR.bottom).toFixed(1),
      mattePct: +(((demo.height - videoR.height) / demo.height) * 100).toFixed(1),
      frameH: +demo.height.toFixed(1),
      videoH: +videoR.height.toFixed(1),
      play: playR
        ? {
            top: +playR.top.toFixed(1),
            bottom: +playR.bottom.toFixed(1),
            left: +playR.left.toFixed(1),
            h: +playR.height.toFixed(1),
            oralOverlap: +oralOverlap.toFixed(1),
            playInMatte: playR.bottom <= videoR.top + 1,
            playClearVideo: !(
              playR.bottom > videoR.top &&
              playR.top < videoR.bottom &&
              playR.right > videoR.left &&
              playR.left < videoR.right
            ),
            overlapsVideoBox: !(
              playR.bottom < videoR.top ||
              playR.top > videoR.bottom ||
              playR.right < videoR.left ||
              playR.left > videoR.right
            ),
          }
        : null,
    };
  });
}

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });

  await page.click(".process-link");
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(out, "capture-d1280-process-land-gap.png") });
  const baseline = await landSnap(page);

  // Matte trim alone (known unsafe) + matte+play relocate combos
  const matteCombos = [];
  const combos = [
    { pt: "2.75rem", playTop: null, playLeft: null },
    { pt: "2.25rem", playTop: null, playLeft: null },
    { pt: "2.1rem", playTop: null, playLeft: null },
    { pt: "2rem", playTop: null, playLeft: null },
    { pt: "2.25rem", playTop: "0.2rem", playLeft: null },
    { pt: "2.25rem", playTop: "0.15rem", playLeft: null },
    { pt: "2.1rem", playTop: "0.12rem", playLeft: null },
    { pt: "2.1rem", playTop: "0.1rem", playLeft: "0.45rem" },
    { pt: "2rem", playTop: "0.1rem", playLeft: "0.45rem" },
    { pt: "1.85rem", playTop: "0.08rem", playLeft: "0.4rem" },
    // move play into video corner (honesty risk but measure)
    { pt: "1.5rem", playTop: "2.1rem", playLeft: "0.55rem", note: "into-video" },
    { pt: "1.25rem", playTop: "1.85rem", playLeft: "0.55rem", note: "into-video" },
    // shrink play via font/pad virtual — measure height only via top bump
    { pt: "2.25rem", playTop: "0.05rem", playLeft: "0.55rem", playScale: true },
  ];

  for (const c of combos) {
    await page.evaluate((c) => {
      const frame = document.querySelector(".demo-frame");
      const play = [...document.querySelectorAll("a,button")].find((el) =>
        /view process/i.test(el.textContent || "")
      );
      frame.style.padding = `${c.pt} 0.75rem 0.75rem`;
      if (play) {
        if (c.playTop) play.style.top = c.playTop;
        else play.style.removeProperty("top");
        if (c.playLeft) play.style.left = c.playLeft;
        else play.style.removeProperty("left");
        if (c.playScale) {
          play.style.fontSize = "0.72rem";
          play.style.padding = "0.2rem 0.45rem";
        } else {
          play.style.removeProperty("font-size");
          play.style.removeProperty("padding");
        }
      }
    }, c);
    await page.click(".process-link");
    await page.waitForTimeout(400);
    const m = await landSnap(page);
    matteCombos.push({
      ...c,
      chromeAbove: m.chromeAbove,
      mattePct: m.mattePct,
      demoVis: m.demoVis,
      videoVis: m.videoVis,
      videoShare: m.videoShare,
      play: m.play,
      optical: m.optical,
      lmsToDemo: m.lmsToDemo,
      claimShare: m.claimShare,
      interestPVis: m.interestPVis,
      isIn: m.isIn,
      dualGateOk:
        m.lmsToDemo >= 40 &&
        m.lmsToDemo <= 48 &&
        m.demoVis >= 115 &&
        Math.abs(m.optical) <= 120 &&
        m.claimShare >= 40 &&
        m.isIn,
      clearOk: m.play && m.play.playClearVideo && m.play.oralOverlap === 0,
      preferShare70: m.videoShare >= 70,
      preferChromeBelow45: m.chromeAbove < 45,
    });
  }

  // reset
  await page.evaluate(() => {
    const frame = document.querySelector(".demo-frame");
    const play = [...document.querySelectorAll("a,button")].find((el) =>
      /view process/i.test(el.textContent || "")
    );
    frame.style.removeProperty("padding");
    if (play) {
      play.style.removeProperty("top");
      play.style.removeProperty("left");
      play.style.removeProperty("font-size");
      play.style.removeProperty("padding");
    }
  });

  await page.click(".process-link");
  await page.waitForTimeout(450);
  await page.screenshot({ path: path.join(out, "capture-d1280-demo-chrome.png") });

  // Interest field → bone bridge at process land (visual strip residual)
  const fieldBridge = [];
  for (const bg of [
    "rgb(248, 246, 241)",
    "rgb(246, 244, 239)",
    "rgb(247, 245, 240)",
    "rgb(245, 243, 238)",
  ]) {
    await page.evaluate((bg) => {
      document.querySelector(".look--copy").style.setProperty("background-color", bg, "important");
    }, bg);
    await page.click(".process-link");
    await page.waitForTimeout(400);
    const m = await landSnap(page);
    fieldBridge.push({
      bg,
      interestFieldVis: m.interestFieldVis,
      interestPVis: m.interestPVis,
      fieldDeltaRgb: m.fieldDeltaRgb,
      optical: m.optical,
      demoVis: m.demoVis,
      lmsToDemo: m.lmsToDemo,
      claimShare: m.claimShare,
      isIn: m.isIn,
    });
  }
  await page.evaluate(() => {
    document.querySelector(".look--copy").style.removeProperty("background-color");
  });

  // Interest padB soft-overhang: can we shrink deadBelowP without reopening body?
  // (dead field strip = interestFieldVis with interestPVis~0)
  const deadPadSweep = [];
  for (const pb of [12, 11.5, 11, 10.5, 10]) {
    await page.evaluate((pb) => {
      document.querySelector(".look--copy .look-inner").style.paddingBottom = `${pb}rem`;
    }, pb);
    await page.click(".process-link");
    await page.waitForTimeout(400);
    const m = await landSnap(page);
    deadPadSweep.push({
      pb,
      interestPVis: m.interestPVis,
      interestFieldVis: m.interestFieldVis,
      deadBelowP: m.deadBelowP,
      optical: m.optical,
      demoVis: m.demoVis,
      lmsToDemo: m.lmsToDemo,
      claimShare: m.claimShare,
      isIn: m.isIn,
    });
  }
  await page.evaluate(() => {
    document.querySelector(".look--copy .look-inner").style.removeProperty("padding-bottom");
  });

  // Mid story peek further trim? after-demo already 15.5 — does more help?
  const midUp = [];
  for (const pb of [15.5, 16, 17, 18, 19, 20]) {
    await page.evaluate((pb) => {
      document.querySelector(".look-inner--after-demo").style.paddingBottom = `${pb}rem`;
    }, pb);
    await page.evaluate(() =>
      document.querySelector(".look-inner--after-demo").scrollIntoView({ block: "center" })
    );
    await page.waitForTimeout(250);
    midUp.push(
      await page.evaluate((pb) => {
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
          pb,
          gapDemoToCta: +(cta.top - demo.bottom).toFixed(1),
          urgH2Vis: +vis(q("#urgency h2")).toFixed(1),
          storyVis: +vis(story).toFixed(1),
          afterPadB: getComputedStyle(q(".look-inner--after-demo")).paddingBottom,
        };
      }, pb)
    );
  }
  await page.evaluate(() => {
    document.querySelector(".look-inner--after-demo").style.removeProperty("padding-bottom");
  });

  // ≤1279 after-demo twin (13.5rem) — raise toward 15?
  const mid1120Sweep = [];
  const p1120 = await browser.newPage({ viewport: { width: 1120, height: 720 } });
  await p1120.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  for (const pb of [13.5, 14.5, 15, 15.5, 16]) {
    await p1120.evaluate((pb) => {
      document.querySelector(".look-inner--after-demo").style.paddingBottom = `${pb}rem`;
    }, pb);
    await p1120.evaluate(() =>
      document.querySelector(".look-inner--after-demo").scrollIntoView({ block: "center" })
    );
    await p1120.waitForTimeout(250);
    mid1120Sweep.push(
      await p1120.evaluate((pb) => {
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
          pb,
          gapDemoToCta: +(cta.top - demo.bottom).toFixed(1),
          urgH2Vis: +vis(q("#urgency h2")).toFixed(1),
          storyVis: +vis(story).toFixed(1),
          afterPadB: getComputedStyle(q(".look-inner--after-demo")).paddingBottom,
        };
      }, pb)
    );
  }
  await p1120.close();

  // Capture field strip visually
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  await page.click(".process-link");
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(out, "capture-d1280-field-bone.png") });

  const safeMatte = matteCombos.filter(
    (m) => m.dualGateOk && m.clearOk && (m.preferShare70 || m.preferChromeBelow45)
  );
  const almostSafe = matteCombos.filter((m) => m.dualGateOk && m.clearOk);

  const result = {
    baseline,
    matteCombos,
    safeMatte,
    almostSafe,
    fieldBridge,
    deadPadSweep,
    midUp,
    mid1120Sweep,
    recommendation: {
      matteSafeCount: safeMatte.length,
      matteAlmostSafeCount: almostSafe.length,
      bestMatte: safeMatte[0] || almostSafe.find((m) => m.preferChromeBelow45) || null,
      fieldBridgeBone: fieldBridge.find((f) => f.bg === "rgb(246, 244, 239)"),
      mid1120NeedsRaise: mid1120Sweep[0]?.urgH2Vis > 0,
      mid1120Live: mid1120Sweep[0],
      midStoryAt155: midUp[0],
      deadPadKeep12: deadPadSweep.find((d) => d.pb === 12),
    },
  };

  fs.writeFileSync(path.join(out, "deepen39.json"), JSON.stringify(result, null, 2));
  console.log(
    JSON.stringify(
      {
        baseline: {
          interestPVis: baseline.interestPVis,
          interestFieldVis: baseline.interestFieldVis,
          fieldDeltaRgb: baseline.fieldDeltaRgb,
          videoShare: baseline.videoShare,
          chromeAbove: baseline.chromeAbove,
          mattePct: baseline.mattePct,
          play: baseline.play,
          dual:
            baseline.lmsToDemo +
            "/" +
            baseline.demoVis +
            "/" +
            baseline.optical +
            "/" +
            baseline.claimShare,
        },
        safeMatte,
        almostSafe: almostSafe.slice(0, 6),
        mid1120Sweep,
        midUp: midUp.slice(0, 3),
        fieldBridge,
        deadPadSweep,
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
