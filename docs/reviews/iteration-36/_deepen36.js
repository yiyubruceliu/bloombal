const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../../src");
const out = __dirname;
const PORT = 9136;

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

const landSnap = async (page, label) =>
  page.evaluate((label) => {
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
    return {
      label,
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
      lmsToDemo: +(demo.top - lms.bottom).toFixed(1),
      titleToMech: +(mech.top - title.bottom).toFixed(1),
      mechToLms: +(lms.top - mech.bottom).toFixed(1),
      isIn: /\bis-in\b/.test(band.className),
      copyField: getComputedStyle(copy).backgroundColor,
      solutionField: getComputedStyle(q(".look--solution")).backgroundColor,
      copyGrain: getComputedStyle(copy, "::before").opacity,
      solutionGrain: getComputedStyle(q(".look--solution"), "::before").opacity,
      chromeAboveVideo: +(video.getBoundingClientRect().top - frame.getBoundingClientRect().top).toFixed(
        1
      ),
      chromeBelowVideo: +(
        frame.getBoundingClientRect().bottom - video.getBoundingClientRect().bottom
      ).toFixed(1),
      mattePct: +(
        ((frame.getBoundingClientRect().height - video.getBoundingClientRect().height) /
          frame.getBoundingClientRect().height) *
        100
      ).toFixed(1),
      frameH: +frame.getBoundingClientRect().height.toFixed(1),
      videoH: +video.getBoundingClientRect().height.toFixed(1),
    };
  }, label);

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });

  await page.click(".process-link");
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(out, "capture-d1280-process-land-gap.png") });
  const baseline = await landSnap(page, "land");

  // Interest field colour bridge sweep: match copy field toward bone
  const fieldBridge = [];
  const boneCandidates = [
    "rgb(248, 246, 241)", // current #f8f6f1
    "rgb(246, 244, 239)", // --bone #F6F4EF
    "rgb(247, 245, 240)",
    "rgb(245, 243, 238)",
  ];
  for (const bg of boneCandidates) {
    await page.evaluate((bg) => {
      document.querySelector(".look--copy").style.setProperty("background-color", bg, "important");
    }, bg);
    await page.click(".process-link");
    await page.waitForTimeout(450);
    const m = await landSnap(page, `field-${bg}`);
    fieldBridge.push({ bg, interestFieldVis: m.interestFieldVis, interestPVis: m.interestPVis, optical: m.optical, demoVis: m.demoVis, lmsToDemo: m.lmsToDemo });
  }
  await page.evaluate(() => {
    document.querySelector(".look--copy").style.removeProperty("background-color");
  });

  // Clip / overflow hide residual field above solution without pad change
  await page.click(".process-link");
  await page.waitForTimeout(450);
  const clipProbe = [];
  for (const mode of ["none", "clip-solution-top", "raise-sol-padT", "lower-copy-field"]) {
    await page.evaluate((mode) => {
      const copy = document.querySelector(".look--copy");
      const sol = document.querySelector(".look--solution");
      const first = document.querySelector(
        ".look--solution > .look-inner:not(.look-inner--after-demo)"
      );
      copy.style.removeProperty("margin-bottom");
      copy.style.removeProperty("background-color");
      sol.style.removeProperty("padding-top");
      first.style.removeProperty("padding-top");
      if (mode === "clip-solution-top") {
        // no-op measure of natural seam
      } else if (mode === "raise-sol-padT") {
        const base = parseFloat(getComputedStyle(first).paddingTop) || 0;
        first.style.setProperty("padding-top", `${base + 24}px`, "important");
      } else if (mode === "lower-copy-field") {
        copy.style.setProperty("background-color", "rgb(246, 244, 239)", "important");
      }
    }, mode);
    await page.click(".process-link");
    await page.waitForTimeout(450);
    clipProbe.push(await landSnap(page, mode));
  }
  await page.evaluate(() => {
    document.querySelector(".look--copy").style.removeProperty("background-color");
    document
      .querySelector(".look--solution > .look-inner:not(.look-inner--after-demo)")
      .style.removeProperty("padding-top");
  });

  // Mid after-demo padB sweep — residual story peek
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  const midSweep = [];
  for (const pb of [11, 10, 9.5, 9, 8.5, 8, 7.5]) {
    await page.evaluate((pb) => {
      document
        .querySelector(".look-inner--after-demo")
        .style.setProperty("padding-bottom", `${pb}rem`, "important");
    }, pb);
    await page.evaluate(() =>
      document.querySelector(".look-inner--after-demo").scrollIntoView({ block: "center" })
    );
    await page.waitForTimeout(250);
    const m = await page.evaluate((pb) => {
      const q = (s) => document.querySelector(s);
      const vis = (el) => {
        if (!el) return 0;
        const b = el.getBoundingClientRect();
        return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
      };
      const demo = q(".demo-frame").getBoundingClientRect();
      const cta = q(".look-inner--after-demo .cta-trial").getBoundingClientRect();
      const story = q(".look--story");
      const urgH2 = q("#urgency h2");
      const urgP = q("#urgency p");
      return {
        pb,
        gapDemoToCta: +(cta.top - demo.bottom).toFixed(1),
        urgH2Vis: +vis(urgH2).toFixed(1),
        storyVis: +vis(story).toFixed(1),
        emptyStoryPeek: +(vis(story) - vis(urgH2) - (urgP ? vis(urgP) : 0)).toFixed(1),
        afterPadB: getComputedStyle(q(".look-inner--after-demo")).paddingBottom,
      };
    }, pb);
    midSweep.push(m);
  }
  await page.evaluate(() => {
    document.querySelector(".look-inner--after-demo").style.removeProperty("padding-bottom");
  });
  await page.evaluate(() =>
    document.querySelector(".look-inner--after-demo").scrollIntoView({ block: "center" })
  );
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(out, "capture-d1280-mid-story-peek.png") });
  const midLive = midSweep.find((m) => m.pb === 11) || midSweep[0];

  // Demo chrome anatomy at process land
  await page.click(".process-link");
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(out, "capture-d1280-demo-chrome.png") });
  const demoChrome = await landSnap(page, "demoChrome");

  // Virtual: reduce matte above video / frame padding
  const matteSweep = [];
  for (const pad of [null, "0", "8px", "12px", "16px", "24px"]) {
    await page.evaluate((pad) => {
      const frame = document.querySelector(".demo-frame");
      const video = document.querySelector(".demo-frame video") || document.querySelector(".demo-video");
      frame.style.removeProperty("padding");
      frame.style.removeProperty("padding-top");
      if (pad !== null) frame.style.setProperty("padding-top", pad, "important");
      // also try reducing space via video margin
      video.style.removeProperty("margin-top");
    }, pad);
    await page.click(".process-link");
    await page.waitForTimeout(450);
    matteSweep.push(await landSnap(page, `matte-${pad}`));
  }
  await page.evaluate(() => {
    document.querySelector(".demo-frame").style.removeProperty("padding-top");
  });

  // Inspect authored demo-frame padding / View process / proof
  const demoAuthored = {
    frameRule: /\.demo-frame\s*\{[^}]+\}/s.exec(css)?.[0]?.slice(0, 400),
    playRule: /\.demo-play\s*\{[^}]+\}/s.exec(css)?.[0]?.slice(0, 300),
    bandRule: /\.demo-band\s*\{[^}]+\}/s.exec(css)?.[0]?.slice(0, 300),
  };

  // Read computed demo chrome + View process position relative to video
  await page.click(".process-link");
  await page.waitForTimeout(500);
  const demoDetail = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const frame = q(".demo-frame");
    const video = q(".demo-frame video") || q(".demo-video");
    const play = [...document.querySelectorAll("a,button")].find((el) =>
      /view process/i.test(el.textContent || "")
    );
    const fcs = getComputedStyle(frame);
    const vcs = getComputedStyle(video);
    const fr = frame.getBoundingClientRect();
    const vr = video.getBoundingClientRect();
    const pr = play?.getBoundingClientRect();
    return {
      framePad: {
        t: fcs.paddingTop,
        r: fcs.paddingRight,
        b: fcs.paddingBottom,
        l: fcs.paddingLeft,
      },
      frameBg: fcs.backgroundColor,
      videoMt: vcs.marginTop,
      videoObjectFit: vcs.objectFit,
      chromeAbove: +(vr.top - fr.top).toFixed(1),
      chromeBelow: +(fr.bottom - vr.bottom).toFixed(1),
      chromeLeft: +(vr.left - fr.left).toFixed(1),
      chromeRight: +(fr.right - vr.right).toFixed(1),
      mattePct: +(((fr.height - vr.height) / fr.height) * 100).toFixed(1),
      playTopInFrame: pr ? +(pr.top - fr.top).toFixed(1) : null,
      playInMatteZone: pr ? pr.bottom <= vr.top + 2 : null,
      videoVisShareOfDemo: +((Math.max(0, Math.min(vr.bottom, innerHeight) - Math.max(vr.top, 0)) /
        Math.max(0, Math.min(fr.bottom, innerHeight) - Math.max(fr.top, 0))) *
        100).toFixed(1),
    };
  });

  // Desire→Consequence: story padT / min-height residual
  await page.evaluate(() =>
    document.querySelector(".look-inner--after-demo").scrollIntoView({ block: "center" })
  );
  await page.waitForTimeout(250);
  const storyAnatomy = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const story = q(".look--story");
    const after = q(".look-inner--after-demo");
    const cs = getComputedStyle(story);
    return {
      storyMinH: cs.minHeight,
      storyPadT: cs.paddingTop,
      storyPadB: cs.paddingBottom,
      storyBg: cs.backgroundColor,
      afterPadB: getComputedStyle(after).paddingBottom,
      solutionPadB: getComputedStyle(q(".look--solution")).paddingBottom,
      hairline:
        getComputedStyle(story).borderTopWidth +
        " " +
        getComputedStyle(story).borderTopColor,
    };
  });

  // Interest hash after padB 12rem — still ok?
  await page.goto(`http://127.0.0.1:${PORT}/#problem`, { waitUntil: "networkidle" });
  await page.waitForTimeout(350);
  const interestHash = await page.evaluate(() => {
    const h2 = document.querySelector(".look--copy h2").getBoundingClientRect();
    return {
      optical: +(h2.top + h2.height / 2 - innerHeight / 2).toFixed(1),
      padB: getComputedStyle(document.querySelector(".look--copy .look-inner")).paddingBottom,
    };
  });

  // Partners centre peeks
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    const el = document.querySelector("#partners");
    const y =
      el.getBoundingClientRect().top +
      window.scrollY -
      (innerHeight / 2 - el.getBoundingClientRect().height / 2);
    window.scrollTo(0, Math.max(0, y));
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(out, "capture-d1280-proof-grain.png") });
  const proof = await page.evaluate(() => ({
    settled: document.querySelector(".look--proof")?.classList.contains("is-settled"),
    grain: getComputedStyle(document.querySelector(".look--proof"), "::before").opacity,
    urgPeek: (() => {
      const b = document.querySelector("#urgency").getBoundingClientRect();
      return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    })(),
  }));

  // Field residual anatomy at process land — how much is dead pad vs coloured field
  await page.click(".process-link");
  await page.waitForTimeout(500);
  const fieldAnatomy = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const copy = q(".look--copy").getBoundingClientRect();
    const p = q(".look--copy p").getBoundingClientRect();
    const sol = q("#solution").getBoundingClientRect();
    const title = q("#solution-title").getBoundingClientRect();
    const vis = (top, bottom) => Math.max(0, Math.min(bottom, innerHeight) - Math.max(top, 0));
    return {
      copyTop: +copy.top.toFixed(1),
      copyBottom: +copy.bottom.toFixed(1),
      pBottom: +p.bottom.toFixed(1),
      solTop: +sol.top.toFixed(1),
      titleTop: +title.top.toFixed(1),
      fieldStripInVp: +vis(Math.max(p.bottom, 0), Math.min(copy.bottom, sol.top)).toFixed(1),
      fieldAboveSolInVp: +vis(0, Math.min(copy.bottom, innerHeight)).toFixed(1),
      gapPToSol: +(sol.top - p.bottom).toFixed(1),
      copyField: getComputedStyle(q(".look--copy")).backgroundColor,
      bone: getComputedStyle(q(".look--solution")).backgroundColor,
      deltaR: 248 - 246,
      deltaG: 246 - 244,
      deltaB: 241 - 239,
    };
  });

  const result = {
    baseline,
    interestHash,
    fieldBridge,
    clipProbe,
    midSweep,
    midLive,
    demoChrome,
    demoDetail,
    demoAuthored,
    matteSweep: matteSweep.map((m) => ({
      label: m.label,
      chromeAboveVideo: m.chromeAboveVideo,
      chromeBelowVideo: m.chromeBelowVideo,
      mattePct: m.mattePct,
      demoVis: m.demoVis,
      videoVis: m.videoVis,
      optical: m.optical,
      lmsToDemo: m.lmsToDemo,
    })),
    storyAnatomy,
    proof,
    fieldAnatomy,
    unpaidCandidates: {
      interestFieldVis: baseline.interestFieldVis,
      interestPVis: baseline.interestPVis,
      midStoryVis: midLive?.storyVis,
      midEmptyPeek: midLive?.emptyStoryPeek,
      demoMattePct: demoDetail.mattePct,
      chromeAbove: demoDetail.chromeAbove,
      videoVisShare: demoDetail.videoVisShareOfDemo,
    },
  };

  fs.writeFileSync(path.join(out, "deepen36.json"), JSON.stringify(result, null, 2));
  console.log(
    JSON.stringify(
      {
        unpaidCandidates: result.unpaidCandidates,
        baseline: {
          interestPVis: baseline.interestPVis,
          interestFieldVis: baseline.interestFieldVis,
          optical: baseline.optical,
          demoVis: baseline.demoVis,
          lmsToDemo: baseline.lmsToDemo,
          claimShare: baseline.claimShare,
        },
        midSweep,
        demoDetail,
        fieldAnatomy,
        interestHash,
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
