const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../../src");
const out = __dirname;
const PORT = 9037;

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

async function processLandMetrics(page) {
  return page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const vis = (el) => {
      if (!el) return 0;
      const b = el.getBoundingClientRect();
      return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    };
    const title = q("#solution-title").getBoundingClientRect();
    const mech = q(".mechanism").getBoundingClientRect();
    const lms = q(".mechanism-lms").getBoundingClientRect();
    const demo = q(".demo-frame").getBoundingClientRect();
    const band = q(".demo-band");
    const video = q(".demo-video") || q(".demo-frame video");
    const videoR = video?.getBoundingClientRect();
    const play = [...document.querySelectorAll("a,button")].find((el) =>
      /view process/i.test(el.textContent || "")
    );
    const playR = play?.getBoundingClientRect();
    const claimH = Math.min(lms.bottom, demo.top) - title.top;
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
    const bandCs = getComputedStyle(band);
    const firstInner = q(".look--solution .look-inner:not(.look-inner--after-demo)");
    const copy = q(".look--copy").getBoundingClientRect();
    const p = q(".look--copy p").getBoundingClientRect();
    const ratio =
      band.getBoundingClientRect().height > 0
        ? vis(band) / band.getBoundingClientRect().height
        : 0;
    const parseRgb = (c) => {
      const m = (c || "").match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      return m ? [+m[1], +m[2], +m[3]] : [0, 0, 0];
    };
    const copyRgb = parseRgb(getComputedStyle(q(".look--copy")).backgroundColor);
    const solRgb = parseRgb(getComputedStyle(q(".look--solution")).backgroundColor);
    const deltaRgb = Math.max(
      Math.abs(copyRgb[0] - solRgb[0]),
      Math.abs(copyRgb[1] - solRgb[1]),
      Math.abs(copyRgb[2] - solRgb[2])
    );
    return {
      optical: +(title.top + title.height / 2 - innerHeight / 2).toFixed(1),
      claimShare: +((claimH / innerHeight) * 100).toFixed(1),
      titleLines: Math.round(
        title.height / parseFloat(getComputedStyle(q("#solution-title")).lineHeight)
      ),
      titleToMech: +(mech.top - title.bottom).toFixed(1),
      mechToLms: +(lms.top - mech.bottom).toFixed(1),
      lmsToDemo: +(demo.top - lms.bottom).toFixed(1),
      lmsMb: getComputedStyle(q(".mechanism-lms")).marginBottom,
      firstInnerPb: getComputedStyle(firstInner).paddingBottom,
      solutionScrollMargin: getComputedStyle(q("#solution")).scrollMarginTop,
      demoVis: +vis(q(".demo-frame")).toFixed(1),
      videoVis: videoR ? +vis(video).toFixed(1) : null,
      videoShare: videoR
        ? +((vis(video) / Math.max(1, vis(q(".demo-frame")))) * 100).toFixed(1)
        : null,
      chromeAbove: videoR ? +(videoR.top - demo.top).toFixed(1) : null,
      chromeBelow: videoR ? +(demo.bottom - videoR.bottom).toFixed(1) : null,
      mattePct: videoR
        ? +(((demo.height - videoR.height) / demo.height) * 100).toFixed(1)
        : null,
      bandVis: +vis(band).toFixed(1),
      ratio: +ratio.toFixed(3),
      className: band.className,
      transform: bandCs.transform,
      interestPVis: +vis(q(".look--copy p")).toFixed(1),
      interestH2Vis: +vis(q(".look--copy h2")).toFixed(1),
      interestFieldVis: +vis(q(".look--copy")).toFixed(1),
      pBottom: +p.bottom.toFixed(1),
      copyBottom: +copy.bottom.toFixed(1),
      deadBelowP: +(copy.bottom - p.bottom).toFixed(1),
      copyPadB: getComputedStyle(q(".look--copy .look-inner")).paddingBottom,
      copyPadT: getComputedStyle(q(".look--copy .look-inner")).paddingTop,
      copyField: getComputedStyle(q(".look--copy")).backgroundColor,
      solutionField: getComputedStyle(q(".look--solution")).backgroundColor,
      fieldDeltaRgb: deltaRgb,
      play: playR
        ? {
            t: +playR.top.toFixed(1),
            l: +playR.left.toFixed(1),
            h: +playR.height.toFixed(1),
            oralOverlapArea: +oralOverlap.toFixed(1),
            overlapsVideoBox: !(
              playR.bottom < videoR.top ||
              playR.top > videoR.bottom ||
              playR.right < videoR.left ||
              playR.left > videoR.right
            ),
            playInMatte: playR.bottom <= videoR.top + 1,
            playClearVideo: !(
              playR.bottom > videoR.top &&
              playR.top < videoR.bottom &&
              playR.right > videoR.left &&
              playR.left < videoR.right
            ),
          }
        : null,
      solutionGrainOp: getComputedStyle(q(".look--solution"), "::before").opacity,
      copyGrainOp: getComputedStyle(q(".look--copy"), "::before").opacity,
      storyGrainOp: getComputedStyle(q(".look--story"), "::before").opacity,
      proofGrainOp: getComputedStyle(q(".look--proof"), "::before").opacity,
      framePad: getComputedStyle(q(".demo-frame")).padding,
      playTop: play ? getComputedStyle(play).top : null,
      scrollY: +window.scrollY.toFixed(1),
    };
  });
}

async function midMetrics(page) {
  return page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const vis = (el) => {
      if (!el) return 0;
      const b = el.getBoundingClientRect();
      return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    };
    const demo = q(".demo-frame").getBoundingClientRect();
    const cta = q(".look-inner--after-demo .cta-trial").getBoundingClientRect();
    const story = q(".look--story");
    const urgP = q("#urgency p");
    return {
      gapDemoToCta: +(cta.top - demo.bottom).toFixed(1),
      urgH2Vis: +vis(q("#urgency h2")).toFixed(1),
      urgPVis: urgP ? +vis(urgP).toFixed(1) : 0,
      storyVis: +vis(story).toFixed(1),
      emptyStoryPeek: +(
        vis(story) - vis(q("#urgency h2")) - (urgP ? vis(urgP) : 0)
      ).toFixed(1),
      gapCtaToStory: +(story.getBoundingClientRect().top - cta.bottom).toFixed(1),
      deltaCx: +(cta.left + cta.width / 2 - innerWidth / 2).toFixed(1),
      afterPadT: getComputedStyle(q(".look-inner--after-demo")).paddingTop,
      afterPadB: getComputedStyle(q(".look-inner--after-demo")).paddingBottom,
      storyField: getComputedStyle(story).backgroundColor,
    };
  });
}

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch({ headless: true });

  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(out, "capture-d1280-hero.png") });
  const hero = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const vis = (el) => {
      if (!el) return 0;
      const b = el.getBoundingClientRect();
      return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    };
    const desk = q(".hero-desk");
    const process = q(".process-link");
    const cta = q(".look--hero .cta-trial");
    const lede = [...q(".look--hero").querySelectorAll("p")].find((p) => !p.closest(".brand"));
    const claim = q(".look--hero h1");
    const r = (el) => el?.getBoundingClientRect();
    const deskR = r(desk);
    const procR = r(process);
    const ctaR = r(cta);
    const ledeR = r(lede);
    const claimR = r(claim);
    return {
      deskVisibleH: deskR ? +vis(desk).toFixed(1) : null,
      procDesk: deskR && procR ? +(deskR.top - procR.bottom).toFixed(1) : null,
      ledeCta: ledeR && ctaR ? +(ctaR.top - ledeR.bottom).toFixed(1) : null,
      ctaProc: ctaR && procR ? +(procR.top - ctaR.bottom).toFixed(1) : null,
      claimTopPct: claimR ? +((claimR.top / innerHeight) * 100).toFixed(1) : null,
      brandOk: !!document.body.innerText.match(/Bloombal/),
    };
  });

  await page.evaluate(() =>
    document.querySelector(".look-inner--after-demo").scrollIntoView({ block: "center" })
  );
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(out, "capture-d1280-mid-block-center.png") });
  const midBlock = await midMetrics(page);

  await page.goto(`http://127.0.0.1:${PORT}/#problem`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(out, "capture-d1280-interest-hash.png") });
  const interestHash = await page.evaluate(() => {
    const h2 = document.querySelector(".look--copy h2").getBoundingClientRect();
    const body = document.querySelector(".look--copy p").getBoundingClientRect();
    return {
      optical: +(h2.top + h2.height / 2 - innerHeight / 2).toFixed(1),
      bodyVis: +(Math.max(0, Math.min(body.bottom, innerHeight) - Math.max(body.top, 0))).toFixed(1),
      grainOp: getComputedStyle(document.querySelector(".look--copy"), "::before").opacity,
      field: getComputedStyle(document.querySelector(".look--copy")).backgroundColor,
      padB: getComputedStyle(document.querySelector(".look--copy .look-inner")).paddingBottom,
      padT: getComputedStyle(document.querySelector(".look--copy .look-inner")).paddingTop,
    };
  });

  const processLand = {};
  const revealSeries = {};
  for (const [w, label] of [
    [1280, "d1280"],
    [1120, "w1120"],
  ]) {
    const p = await browser.newPage({ viewport: { width: w, height: 720 } });
    await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
    await p.click(".process-link");
    const series = [];
    series.push(
      await p.evaluate(() => {
        const b = document.querySelector(".demo-band");
        return { t: 0, className: b.className, transform: getComputedStyle(b).transform };
      })
    );
    await p.waitForTimeout(450);
    series.push(
      await p.evaluate(() => {
        const b = document.querySelector(".demo-band");
        return { t: 450, className: b.className, transform: getComputedStyle(b).transform };
      })
    );
    await p.waitForTimeout(200);
    await p.screenshot({ path: path.join(out, `capture-${label}-process-land.png`) });
    processLand[label] = await processLandMetrics(p);
    revealSeries[label] = series;
    await p.close();
  }

  // mid @1120
  const mid1120Page = await browser.newPage({ viewport: { width: 1120, height: 720 } });
  await mid1120Page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  await mid1120Page.evaluate(() =>
    document.querySelector(".look-inner--after-demo").scrollIntoView({ block: "center" })
  );
  await mid1120Page.waitForTimeout(300);
  await mid1120Page.screenshot({ path: path.join(out, "capture-w1120-mid-block-center.png") });
  const mid1120 = await midMetrics(mid1120Page);
  await mid1120Page.close();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  await mobile.waitForTimeout(400);
  await mobile.screenshot({ path: path.join(out, "capture-m390-hero.png") });
  await mobile.click(".process-link");
  await mobile.waitForTimeout(500);
  await mobile.screenshot({ path: path.join(out, "capture-m390-process-land.png") });
  const mobileLand = await mobile.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const vis = (el) => {
      if (!el) return 0;
      const b = el.getBoundingClientRect();
      return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    };
    return {
      interestPVis: +vis(q(".look--copy p")).toFixed(1),
      interestH2Vis: +vis(q(".look--copy h2")).toFixed(1),
      interestFieldVis: +vis(q(".look--copy")).toFixed(1),
      copyPadB: getComputedStyle(q(".look--copy .look-inner")).paddingBottom,
      copyPadT: getComputedStyle(q(".look--copy .look-inner")).paddingTop,
      solTitleVis: +vis(q("#solution-title")).toFixed(1),
      afterPadB: getComputedStyle(q(".look-inner--after-demo")).paddingBottom,
    };
  });
  await mobile.evaluate(() =>
    document.querySelector(".look-inner--after-demo").scrollIntoView({ block: "center" })
  );
  await mobile.waitForTimeout(250);
  const mid390 = await midMetrics(mobile);
  await mobile.close();

  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    const el = document.querySelector("#partners");
    const y =
      el.getBoundingClientRect().top +
      window.scrollY -
      (innerHeight / 2 - el.getBoundingClientRect().height / 2);
    window.scrollTo(0, Math.max(0, y));
  });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(out, "capture-d1280-partners.png") });
  const partners = await page.evaluate(() => {
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

  await page.evaluate(() => {
    const h2 = document.querySelector("#urgency h2");
    const y =
      h2.getBoundingClientRect().top +
      window.scrollY -
      (innerHeight / 2 - h2.getBoundingClientRect().height / 2);
    window.scrollTo(0, Math.max(0, y));
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(out, "capture-d1280-urgency.png") });
  const urgency = await page.evaluate(() => {
    const vis = (el) => {
      if (!el) return 0;
      const b = el.getBoundingClientRect();
      return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    };
    return {
      partnersPeek: +vis(document.querySelector("#partners")).toFixed(1),
      storyGrain: getComputedStyle(document.querySelector(".look--story"), "::before").opacity,
      stickyPast: document.querySelector(".look-indices")?.classList.contains("is-past"),
    };
  });

  await page.evaluate(() => {
    const f = document.querySelector(".look--footer");
    window.scrollTo(0, f.getBoundingClientRect().top + window.scrollY - 80);
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(out, "capture-d1280-footer-start.png") });
  const footer = await page.evaluate(() => {
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
      h2Color: cs.color,
      h2Fs: cs.fontSize,
      contrast: +ratio.toFixed(2),
      solutionH2Fs: getComputedStyle(document.querySelector("#solution-title")).fontSize,
    };
  });

  const glyphs = await page.evaluate(() => {
    const measure = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const cs = getComputedStyle(el);
      const br = el.getBoundingClientRect();
      const s = document.createElement("span");
      s.textContent = "abcdefghijklmnopqrstuvwxyz";
      s.style.cssText = `font:${cs.font};position:absolute;visibility:hidden;white-space:nowrap`;
      document.body.appendChild(s);
      const chPx = s.getBoundingClientRect().width / 26;
      s.remove();
      return {
        glyphCh: +(br.width / chPx).toFixed(1),
        cssMaxW: cs.maxWidth,
        fw: cs.fontWeight,
        fs: cs.fontSize,
      };
    };
    return {
      interest: measure(".look--copy p"),
      mech: measure(".mechanism"),
      lms: measure(".mechanism-lms"),
      urg: measure("#urgency p"),
    };
  });

  const ladder = await page.evaluate(() => {
    const fs = (s) => parseFloat(getComputedStyle(document.querySelector(s)).fontSize);
    return {
      problem: fs(".look--copy h2"),
      solution: fs("#solution-title"),
      footer: fs(".look--footer h2"),
      urgency: fs("#urgency h2"),
      partners: fs("#partners h2"),
    };
  });

  // authored CSS parse for iter-36 targets
  const mq1279 = css.match(/@media\s*\([^)]*max-width:\s*1279px[^)]*\)\s*\{([\s\S]*)/);
  let narrowCopyPad = null;
  let afterDemoNarrow = null;
  if (mq1279) {
    const m = mq1279[1].match(/\.look--copy\s+\.look-inner\s*\{\s*padding:\s*([^;]+)/);
    narrowCopyPad = m?.[1]?.trim();
    const a = mq1279[1].match(
      /\.look--solution\s+\.look-inner--after-demo\s*\{[^}]*padding-bottom:\s*([\d.]+)rem/
    );
    afterDemoNarrow = a?.[1];
  }
  const authored = {
    copyPadBlock: /\.look--copy\s+\.look-inner\s*\{[^}]*padding:\s*([^;]+)/s.exec(css)?.[1]?.trim(),
    narrowCopyPad1279: narrowCopyPad,
    afterDemoPadB:
      /\.look--solution\s+\.look-inner--after-demo\s*\{[^}]*padding-bottom:\s*([\d.]+)rem/s.exec(
        css
      )?.[1],
    afterDemoNarrowPadB: afterDemoNarrow,
    demoFramePad: /\.demo-frame\s*\{[^}]*padding:\s*([^;]+)/s.exec(css)?.[1]?.trim(),
    demoPlayTop: /\.demo-play\s*\{[^}]*top:\s*([^;]+)/s.exec(css)?.[1]?.trim(),
  };

  const d = processLand.d1280;
  const w = processLand.w1120;
  const accept = {
    item1_narrowPadB13: /13rem/.test(authored.narrowCopyPad1279 || ""),
    item1_1120_interestPVis12: w.interestPVis <= 12,
    item1_1120_interestPVis0: w.interestPVis === 0,
    item1_1120_interestH2Vis0: w.interestH2Vis === 0,
    item1_1120_dualGate:
      w.lmsToDemo >= 40 &&
      w.lmsToDemo <= 48 &&
      w.demoVis >= 115 &&
      Math.abs(w.optical) <= 120 &&
      w.claimShare >= 40 &&
      w.titleLines === 2 &&
      /\bis-in\b/.test(w.className),
    item1_390_interestPVis12: mobileLand.interestPVis <= 12,
    item1_390_interestPVis0: mobileLand.interestPVis === 0,
    item1_1280_hold:
      d.interestPVis <= 12 &&
      d.lmsToDemo >= 40 &&
      d.lmsToDemo <= 48 &&
      d.demoVis >= 115 &&
      Math.abs(d.optical) <= 120 &&
      d.claimShare >= 40 &&
      /\bis-in\b/.test(d.className),
    item1_interestHashOptical: Math.abs(interestHash.optical + 45) <= 15,
    item2_afterPadB155: authored.afterDemoPadB === "15.5",
    item2_urgH2Vis0: midBlock.urgH2Vis === 0,
    item2_gapDemoCta36: midBlock.gapDemoToCta >= 36,
    item2_storyVis200: midBlock.storyVis <= 200,
    item2_storyVis190: midBlock.storyVis <= 190,
    dualGate1120: w.lmsToDemo >= 40 && w.lmsToDemo <= 48 && w.claimShare >= 40 && w.titleLines === 2,
    prefer120: d.demoVis >= 120,
    midBreath: midBlock.urgH2Vis === 0 && midBlock.gapDemoToCta >= 36,
    partnersPeek0: partners.urgPeek === 0 && partners.contactPeek === 0,
    footerContrast: footer.contrast >= 4.5,
    mid1120_urgH2: mid1120.urgH2Vis,
    mid1120_storyVis: mid1120.storyVis,
    mid390_urgH2: mid390.urgH2Vis,
  };

  const result = {
    authored,
    hero,
    midBlock,
    mid1120,
    mid390,
    interestHash,
    processLand,
    revealSeries,
    mobileLand,
    partners,
    urgency,
    footer,
    glyphs,
    ladder,
    accept,
    diagnosis: {
      live1280_lmsToDemo: d.lmsToDemo,
      live1280_demoVis: d.demoVis,
      live1280_optical: d.optical,
      live1280_claimShare: d.claimShare,
      live1280_interestPVis: d.interestPVis,
      live1280_interestFieldVis: d.interestFieldVis,
      live1280_fieldDeltaRgb: d.fieldDeltaRgb,
      live1280_deadBelowP: d.deadBelowP,
      live1280_isIn: /\bis-in\b/.test(d.className),
      live1280_videoShare: d.videoShare,
      live1280_chromeAbove: d.chromeAbove,
      live1280_mattePct: d.mattePct,
      live1280_playClear: d.play?.playClearVideo,
      live1280_playInMatte: d.play?.playInMatte,
      live1280_oral: d.play?.oralOverlapArea,
      live1120_lmsToDemo: w.lmsToDemo,
      live1120_demoVis: w.demoVis,
      live1120_claimShare: w.claimShare,
      live1120_optical: w.optical,
      live1120_interestPVis: w.interestPVis,
      live1120_interestFieldVis: w.interestFieldVis,
      live1120_copyPadB: w.copyPadB,
      mid_storyVis: midBlock.storyVis,
      mid_emptyStoryPeek: midBlock.emptyStoryPeek,
      mid_afterPadB: midBlock.afterPadB,
      mid_urgH2Vis: midBlock.urgH2Vis,
      mid_gapDemoToCta: midBlock.gapDemoToCta,
      mid1120_afterPadB: mid1120.afterPadB,
      mid1120_urgH2Vis: mid1120.urgH2Vis,
      mid1120_storyVis: mid1120.storyVis,
      mid390_urgH2Vis: mid390.urgH2Vis,
      mid390_storyVis: mid390.storyVis,
      mid390_afterPadB: mid390.afterPadB,
      mobile_interestPVis: mobileLand.interestPVis,
      mobile_copyPadB: mobileLand.copyPadB,
    },
  };

  fs.writeFileSync(path.join(out, "verify36.json"), JSON.stringify(result, null, 2));
  console.log(
    JSON.stringify(
      {
        accept,
        diagnosis: result.diagnosis,
        authored,
        midBlock,
        mid1120,
        mid390,
        interestHash,
        mobileLand,
        hero,
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
