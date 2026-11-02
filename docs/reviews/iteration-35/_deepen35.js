const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../../src");
const out = __dirname;
const PORT = 9135;

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

const snap = async (page, label) =>
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
    const desk = q(".hero-desk")?.getBoundingClientRect();
    const proc = q(".process-link")?.getBoundingClientRect();
    const band = q(".demo-band");
    return {
      label,
      scrollY: +window.scrollY.toFixed(1),
      interestPVis: +vis(q(".look--copy p")).toFixed(1),
      interestH2Vis: +vis(q(".look--copy h2")).toFixed(1),
      copyBottom: +q(".look--copy").getBoundingClientRect().bottom.toFixed(1),
      solTop: +q("#solution").getBoundingClientRect().top.toFixed(1),
      optical: +(title.top + title.height / 2 - innerHeight / 2).toFixed(1),
      claimShare: +(((Math.min(lms.bottom, demo.top) - title.top) / innerHeight) * 100).toFixed(1),
      demoVis: +vis(q(".demo-frame")).toFixed(1),
      videoVis: +vis(q(".demo-frame video") || q(".demo-video")).toFixed(1),
      lmsToDemo: +(demo.top - lms.bottom).toFixed(1),
      titleToMech: +(mech.top - title.bottom).toFixed(1),
      mechToLms: +(lms.top - mech.bottom).toFixed(1),
      isIn: /\bis-in\b/.test(band.className),
      transform: getComputedStyle(band).transform,
      deskVis: desk ? +vis(q(".hero-desk")).toFixed(1) : null,
      procDesk: desk && proc ? +(desk.top - proc.bottom).toFixed(1) : null,
      solutionScrollMargin: getComputedStyle(q("#solution")).scrollMarginTop,
      problemScrollMargin: getComputedStyle(q("#problem")).scrollMarginTop,
      copyPadB: getComputedStyle(q(".look--copy .look-inner")).paddingBottom,
      copySectionPadB: getComputedStyle(q(".look--copy")).paddingBottom,
      solutionPadT: getComputedStyle(q(".look--solution")).paddingTop,
      firstInnerPadT: getComputedStyle(
        q(".look--solution > .look-inner:first-of-type")
      ).paddingTop,
    };
  }, label);

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  const hero = await snap(page, "hero");
  await page.screenshot({ path: path.join(out, "capture-d1280-hero-desk.png") });

  // Interest bleed: process land + positive dy sweep (scroll deeper)
  await page.click(".process-link");
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(out, "capture-d1280-process-land-gap.png") });
  const baseline = await snap(page, "land+0");

  const landSweep = [];
  for (const dy of [0, 20, 40, 60, 80, 100, 120, 140, 160]) {
    await page.click(".process-link");
    await page.waitForTimeout(450);
    if (dy) await page.evaluate((dy) => window.scrollBy(0, dy), dy);
    await page.waitForTimeout(80);
    landSweep.push(await snap(page, `land+${dy}`));
  }

  // Virtual scroll-margin sweep (deeper land = smaller scroll-margin)
  await page.click(".process-link");
  await page.waitForTimeout(450);
  const smSweep = [];
  for (const smRem of [12.6, 12.0, 11.5, 11.0, 10.5, 10.0, 9.5]) {
    await page.evaluate((smRem) => {
      document.querySelector("#solution").style.setProperty("scroll-margin-top", `${smRem}rem`);
    }, smRem);
    await page.click(".process-link");
    await page.waitForTimeout(500);
    const m = await snap(page, `sm-${smRem}`);
    smSweep.push({ smRem, ...m });
  }

  // Reset scroll-margin
  await page.evaluate(() => {
    document.querySelector("#solution").style.removeProperty("scroll-margin-top");
  });

  // Virtual: Interest copy pad-bottom / section pad trim
  await page.click(".process-link");
  await page.waitForTimeout(450);
  const copyPadSweep = [];
  const copyInner = await page.evaluate(() => {
    const el = document.querySelector(".look--copy .look-inner");
    return {
      padB: getComputedStyle(el).paddingBottom,
      padT: getComputedStyle(el).paddingTop,
      mb: getComputedStyle(el).marginBottom,
      sectionPb: getComputedStyle(document.querySelector(".look--copy")).paddingBottom,
      sectionMb: getComputedStyle(document.querySelector(".look--copy")).marginBottom,
      minH: getComputedStyle(document.querySelector(".look--copy")).minHeight,
      h: +document.querySelector(".look--copy").getBoundingClientRect().height.toFixed(1),
      pBottom: +document.querySelector(".look--copy p").getBoundingClientRect().bottom.toFixed(1),
      h2Bottom: +document
        .querySelector(".look--copy h2")
        .getBoundingClientRect()
        .bottom.toFixed(1),
    };
  });
  for (const cut of [0, 8, 16, 24, 32, 40, 48]) {
    await page.evaluate((cut) => {
      const el = document.querySelector(".look--copy .look-inner");
      const base = parseFloat(getComputedStyle(el).paddingBottom) || 0;
      // use absolute override from natural — first get natural then subtract
      el.style.setProperty("padding-bottom", `${Math.max(0, base - cut)}px`, "important");
    }, cut);
    // Actually need fresh land each time with override applied before click
    await page.evaluate((cut) => {
      const el = document.querySelector(".look--copy .look-inner");
      el.style.removeProperty("padding-bottom");
      const base = parseFloat(getComputedStyle(el).paddingBottom) || 0;
      el.style.setProperty("padding-bottom", `${Math.max(0, base - cut)}px`, "important");
    }, cut);
    await page.click(".process-link");
    await page.waitForTimeout(450);
    copyPadSweep.push({ cutPx: cut, ...(await snap(page, `copyPad-${cut}`)) });
  }
  await page.evaluate(() => {
    document.querySelector(".look--copy .look-inner").style.removeProperty("padding-bottom");
  });

  // Prefer-120: can we raise demoVis without breaking dual-gate?
  // Options: slightly smaller lms mb (stay ≥40), or deeper land (sm), or shrink demo-band width/height (don't)
  await page.click(".process-link");
  await page.waitForTimeout(450);
  const dualSweep = [];
  for (const [mbRem, smRem] of [
    [1.65, 12.6],
    [1.55, 12.6],
    [1.5, 12.6],
    [1.65, 12.0],
    [1.65, 11.5],
    [1.55, 12.0],
    [1.5, 11.5],
    [1.65, 12.3],
    [1.6, 12.3],
  ]) {
    await page.evaluate(
      ({ mbRem, smRem }) => {
        document
          .querySelector(".mechanism-lms")
          .style.setProperty("margin-bottom", `${mbRem}rem`, "important");
        document
          .querySelector("#solution")
          .style.setProperty("scroll-margin-top", `${smRem}rem`);
      },
      { mbRem, smRem }
    );
    await page.click(".process-link");
    await page.waitForTimeout(500);
    const m = await snap(page, `mb${mbRem}_sm${smRem}`);
    dualSweep.push({ mbRem, smRem, ...m });
  }

  // 1120 check post dual-gate
  const p2 = await browser.newPage({ viewport: { width: 1120, height: 720 } });
  await p2.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  await p2.click(".process-link");
  await p2.waitForTimeout(500);
  await p2.screenshot({ path: path.join(out, "capture-w1120-process-land-gap.png") });
  const mid1120 = await snap(p2, "w1120-land");

  // Story→proof / after-demo anatomy (consequence isolation debt?)
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    document.querySelector(".look-inner--after-demo").scrollIntoView({ block: "center" });
  });
  await page.waitForTimeout(300);
  const afterDemo = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const vis = (el) => {
      if (!el) return 0;
      const b = el.getBoundingClientRect();
      return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    };
    const after = q(".look-inner--after-demo");
    const story = q(".look--story");
    const demo = q(".demo-frame");
    const cta = q(".look-inner--after-demo .cta-trial");
    return {
      afterPadT: getComputedStyle(after).paddingTop,
      afterPadB: getComputedStyle(after).paddingBottom,
      afterH: +after.getBoundingClientRect().height.toFixed(1),
      gapDemoToCta: +(cta.getBoundingClientRect().top - demo.getBoundingClientRect().bottom).toFixed(
        1
      ),
      gapCtaToStory: +(
        story.getBoundingClientRect().top - cta.getBoundingClientRect().bottom
      ).toFixed(1),
      urgVis: +vis(q("#urgency h2")).toFixed(1),
      storyTopVis: +vis(story).toFixed(1),
      solutionBottomPad: getComputedStyle(q(".look--solution")).paddingBottom,
      storyMinH: getComputedStyle(story).minHeight,
      storyPadT: getComputedStyle(story).paddingTop,
    };
  });

  // Proof settle + grain capture
  await page.evaluate(() => {
    const el = document.querySelector(".look--proof");
    const y = el.getBoundingClientRect().top + window.scrollY - innerHeight * 0.4;
    window.scrollTo(0, Math.max(0, y));
  });
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(out, "capture-d1280-proof-grain.png") });
  const proof = await page.evaluate(() => {
    const el = document.querySelector(".look--proof");
    return {
      className: el.className,
      grainOp: getComputedStyle(el, "::before").opacity,
      field: getComputedStyle(el).backgroundColor,
    };
  });

  // Interest copy field height vs content — is bleed from excess section padding?
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  await page.click(".process-link");
  await page.waitForTimeout(500);
  const bleedAnatomy = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const copy = q(".look--copy");
    const inner = q(".look--copy .look-inner");
    const h2 = q(".look--copy h2");
    const p = q(".look--copy p");
    const sol = q("#solution");
    const title = q("#solution-title");
    const copyR = copy.getBoundingClientRect();
    const pR = p.getBoundingClientRect();
    const h2R = h2.getBoundingClientRect();
    const solR = sol.getBoundingClientRect();
    const titleR = title.getBoundingClientRect();
    return {
      copyH: +copyR.height.toFixed(1),
      copyBottom: +copyR.bottom.toFixed(1),
      pBottom: +pR.bottom.toFixed(1),
      h2Bottom: +h2R.bottom.toFixed(1),
      contentBottom: +Math.max(pR.bottom, h2R.bottom).toFixed(1),
      deadSpaceBelowP: +(copyR.bottom - pR.bottom).toFixed(1),
      solTop: +solR.top.toFixed(1),
      titleTop: +titleR.top.toFixed(1),
      gapCopyToSol: +(solR.top - copyR.bottom).toFixed(1),
      gapPToSol: +(solR.top - pR.bottom).toFixed(1),
      interestPVis: +(
        Math.max(0, Math.min(pR.bottom, innerHeight) - Math.max(pR.top, 0))
      ).toFixed(1),
      interestH2Vis: +(
        Math.max(0, Math.min(h2R.bottom, innerHeight) - Math.max(h2R.top, 0))
      ).toFixed(1),
      innerPadB: getComputedStyle(inner).paddingBottom,
      innerPadT: getComputedStyle(inner).paddingTop,
      copyMinH: getComputedStyle(copy).minHeight,
      copyPadB: getComputedStyle(copy).paddingBottom,
      copyPadT: getComputedStyle(copy).paddingTop,
      solScrollMargin: getComputedStyle(sol).scrollMarginTop,
      optical: +(titleR.top + titleR.height / 2 - innerHeight / 2).toFixed(1),
    };
  });

  const result = {
    hero,
    baseline,
    copyInner,
    bleedAnatomy,
    landSweep,
    smSweep,
    copyPadSweep,
    dualSweep,
    mid1120,
    afterDemo,
    proof,
    unpaidCandidates: {
      interestBleed: baseline.interestPVis,
      prefer120Short: +(120 - baseline.demoVis).toFixed(1),
      opticalHeadroom: +(120 - Math.abs(baseline.optical)).toFixed(1),
      dualGateOk:
        baseline.lmsToDemo >= 40 &&
        baseline.lmsToDemo <= 48 &&
        baseline.demoVis >= 115 &&
        baseline.isIn,
    },
  };

  fs.writeFileSync(path.join(out, "deepen35.json"), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  server.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
