const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../../src");
const out = __dirname;
const PORT = 9133;

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

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });

  // Mid CTA proper: after-demo block center + urgency H2
  await page.evaluate(() =>
    document.querySelector(".look-inner--after-demo").scrollIntoView({ block: "center" })
  );
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(out, "capture-d1280-mid-block-center.png") });
  const midBlock = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const vis = (el) => {
      const b = el.getBoundingClientRect();
      return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    };
    const demo = q(".demo-frame").getBoundingClientRect();
    const cta = q(".look-inner--after-demo .cta-trial").getBoundingClientRect();
    return {
      gapDemoToCta: +(cta.top - demo.bottom).toFixed(1),
      urgH2Vis: +vis(q("#urgency h2")).toFixed(1),
      urgSectionVis: +vis(q("#urgency")).toFixed(1),
      deltaCx: +(cta.left + cta.width / 2 - innerWidth / 2).toFixed(1),
      afterPadT: getComputedStyle(q(".look-inner--after-demo")).paddingTop,
    };
  });

  // Interest #problem land
  await page.goto(`http://127.0.0.1:${PORT}/#problem`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(out, "capture-d1280-interest-hash.png") });
  const interestHash = await page.evaluate(() => {
    const h2 = document.querySelector(".look--copy h2").getBoundingClientRect();
    const body = document.querySelector(".look--copy p").getBoundingClientRect();
    return {
      optical: +(h2.top + h2.height / 2 - innerHeight / 2).toFixed(1),
      emptyBelow: +(innerHeight - body.bottom).toFixed(1),
      bodyVis: Math.max(0, Math.min(body.bottom, innerHeight) - Math.max(body.top, 0)),
      activeIndex: document.querySelector(".look-indices .is-active")?.textContent?.trim(),
    };
  });

  // Process land + View process geometry (1280 + 1120)
  const processLand = {};
  for (const [w, label] of [
    [1280, "d1280"],
    [1120, "w1120"],
  ]) {
    const p = await browser.newPage({ viewport: { width: w, height: 720 } });
    await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
    await p.click(".process-link");
    await p.waitForTimeout(450);
    await p.screenshot({ path: path.join(out, `capture-${label}-process-land-gap.png`) });
    processLand[label] = await p.evaluate(() => {
      const q = (s) => document.querySelector(s);
      const vis = (el) => {
        const b = el.getBoundingClientRect();
        return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
      };
      const title = q("#solution-title").getBoundingClientRect();
      const mech = q(".mechanism").getBoundingClientRect();
      const lms = q(".mechanism-lms").getBoundingClientRect();
      const demo = q(".demo-frame").getBoundingClientRect();
      const video = q(".demo-frame video, .demo-band video")?.getBoundingClientRect();
      const play = [...document.querySelectorAll("a,button")].find((el) =>
        /view process/i.test(el.textContent || "")
      );
      const playR = play?.getBoundingClientRect();
      const interestP = q(".look--copy p").getBoundingClientRect();
      const interestH2 = q(".look--copy h2").getBoundingClientRect();
      const claimH = Math.min(lms.bottom, demo.top) - title.top;
      // oral zone = center band of video
      let oralOverlap = 0;
      if (playR && video) {
        const oral = {
          left: video.left + video.width * 0.25,
          right: video.left + video.width * 0.75,
          top: video.top + video.height * 0.2,
          bottom: video.top + video.height * 0.8,
        };
        const ox = Math.max(0, Math.min(playR.right, oral.right) - Math.max(playR.left, oral.left));
        const oy = Math.max(0, Math.min(playR.bottom, oral.bottom) - Math.max(playR.top, oral.top));
        oralOverlap = ox * oy;
      }
      const overlapsVideoBox =
        playR && video
          ? !(
              playR.bottom < video.top ||
              playR.top > video.bottom ||
              playR.right < video.left ||
              playR.left > video.right
            )
          : null;
      return {
        optical: +(title.top + title.height / 2 - innerHeight / 2).toFixed(1),
        claimShare: +((claimH / innerHeight) * 100).toFixed(1),
        titleToMech: +(mech.top - title.bottom).toFixed(1),
        mechToLms: +(lms.top - mech.bottom).toFixed(1),
        lmsToDemo: +(demo.top - lms.bottom).toFixed(1),
        lmsMb: getComputedStyle(q(".mechanism-lms")).marginBottom,
        lmsMt: getComputedStyle(q(".mechanism-lms")).marginTop,
        demoVis: +vis(q(".demo-frame")).toFixed(1),
        videoVis: video ? +vis(q(".demo-frame video, .demo-band video")).toFixed(1) : null,
        lmsVis: +vis(q(".mechanism-lms")).toFixed(1),
        interestPVis: +vis(q(".look--copy p")).toFixed(1),
        interestH2Vis: +vis(q(".look--copy h2")).toFixed(1),
        play: playR
          ? {
              t: +playR.top.toFixed(1),
              l: +playR.left.toFixed(1),
              overlapsVideoBox,
              oralOverlapArea: +oralOverlap.toFixed(1),
              playFromVideoTop: video ? +(playR.top - video.top).toFixed(1) : null,
              bg: getComputedStyle(play).backgroundColor,
              border: getComputedStyle(play).border,
            }
          : null,
        solutionGrain: (() => {
          const cs = getComputedStyle(q(".look--solution"), "::before");
          return { content: cs.content, opacity: cs.opacity };
        })(),
        solutionBg: getComputedStyle(q(".look--solution")).backgroundColor,
        copyGrainOp: getComputedStyle(q(".look--copy"), "::before").opacity,
        storyGrainOp: getComputedStyle(q(".look--story"), "::before").opacity,
        proofGrainOp: getComputedStyle(q(".look--proof"), "::before").opacity,
      };
    });
    await p.close();
  }

  // Desire→Consequence texture cliff + solution grain absence
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    const seam = document.querySelector(".look--solution");
    // scroll so solution→story seam is mid
    const story = document.querySelector(".look--story");
    const y =
      story.getBoundingClientRect().top + window.scrollY - innerHeight / 2;
    window.scrollTo(0, Math.max(0, y));
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(out, "capture-d1280-solution-story-seam.png") });

  // Footer © quiet ladder
  await page.evaluate(() => {
    const f = document.querySelector(".look--footer");
    window.scrollTo(0, f.getBoundingClientRect().top + window.scrollY - 263);
  });
  await page.waitForTimeout(200);
  const footerLadder = await page.evaluate(() => {
    const email = document.querySelector(".footer-email");
    const copy = document.querySelector(".copyright");
    const social = document.querySelector(".social-links a");
    const cs = (el) =>
      el
        ? {
            color: getComputedStyle(el).color,
            opacity: getComputedStyle(el).opacity,
            fs: getComputedStyle(el).fontSize,
          }
        : null;
    return { email: cs(email), copy: cs(copy), social: cs(social) };
  });

  // Sticky is-past at urgency
  await page.evaluate(() => {
    const h2 = document.querySelector("#urgency h2");
    const y =
      h2.getBoundingClientRect().top +
      window.scrollY -
      (innerHeight / 2 - h2.getBoundingClientRect().height / 2);
    window.scrollTo(0, Math.max(0, y));
  });
  await page.waitForTimeout(200);
  const sticky = await page.evaluate(() => {
    const nav = document.querySelector(".look-indices");
    return {
      isPast: nav?.classList.contains("is-past") || document.documentElement.classList.contains("is-past"),
      navClasses: nav?.className,
      htmlClasses: document.documentElement.className,
      bodyClasses: document.body.className,
      active: document.querySelector(".look-indices .is-active")?.textContent?.trim() ?? null,
      indicesOp: nav ? getComputedStyle(nav).opacity : null,
    };
  });

  // Stack rail clearance
  const rail = await page.evaluate(() => {
    const idx = document.querySelector(".look-indices")?.getBoundingClientRect();
    const text = document.querySelector(".look--story .look-inner")?.getBoundingClientRect();
    if (!idx || !text) return null;
    return {
      idxR: +idx.right.toFixed(1),
      textL: +text.left.toFixed(1),
      clearance: +(text.left - idx.right).toFixed(1),
      overlapX: Math.max(0, idx.right - text.left),
    };
  });

  const result = {
    midBlock,
    interestHash,
    processLand,
    footerLadder,
    sticky,
    rail,
    diagnosis: {
      lmsToDemoOvershoot1280: processLand.d1280.lmsToDemo - 48,
      lmsToDemoOvershoot1120: processLand.w1120.lmsToDemo - 48,
      demoVisVs115: +(processLand.d1280.demoVis - 115).toFixed(1),
      demoVisVs120: +(processLand.d1280.demoVis - 120).toFixed(1),
      lmsToDemoBandDelta1280: processLand.d1280.lmsToDemo >= 40 && processLand.d1280.lmsToDemo <= 48,
      mechToLmsShortVsTitle: +(processLand.d1280.titleToMech - processLand.d1280.mechToLms).toFixed(1),
      solutionHasGrain: processLand.d1280.solutionGrain.content === '""',
      interestBleed: processLand.d1280.interestPVis,
    },
  };
  fs.writeFileSync(path.join(out, "gap33.json"), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  server.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
