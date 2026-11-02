const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../../src");
const out = __dirname;
const PORT = 9235;

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

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });

  const landSnap = async (label) =>
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
      const p = q(".look--copy p").getBoundingClientRect();
      const copy = q(".look--copy").getBoundingClientRect();
      return {
        label,
        interestPVis: +vis(q(".look--copy p")).toFixed(1),
        interestH2Vis: +vis(q(".look--copy h2")).toFixed(1),
        interestFieldVis: +vis(q(".look--copy")).toFixed(1),
        pBottom: +p.bottom.toFixed(1),
        copyBottom: +copy.bottom.toFixed(1),
        deadBelowP: +(copy.bottom - p.bottom).toFixed(1),
        optical: +(title.top + title.height / 2 - innerHeight / 2).toFixed(1),
        claimShare: +(((Math.min(lms.bottom, demo.top) - title.top) / innerHeight) * 100).toFixed(1),
        demoVis: +vis(q(".demo-frame")).toFixed(1),
        lmsToDemo: +(demo.top - lms.bottom).toFixed(1),
        isIn: /\bis-in\b/.test(q(".demo-band").className),
        copyPadB: getComputedStyle(q(".look--copy .look-inner")).paddingBottom,
        copyPadT: getComputedStyle(q(".look--copy .look-inner")).paddingTop,
        sm: getComputedStyle(q("#solution")).scrollMarginTop,
      };
    }, label);

  const interestHashSnap = async () =>
    page.evaluate(() => {
      const h2 = document.querySelector(".look--copy h2").getBoundingClientRect();
      const body = document.querySelector(".look--copy p").getBoundingClientRect();
      return {
        optical: +(h2.top + h2.height / 2 - innerHeight / 2).toFixed(1),
        bodyVis: +(Math.max(0, Math.min(body.bottom, innerHeight) - Math.max(body.top, 0))).toFixed(
          1
        ),
        padB: getComputedStyle(document.querySelector(".look--copy .look-inner")).paddingBottom,
        padT: getComputedStyle(document.querySelector(".look--copy .look-inner")).paddingTop,
      };
    });

  // Baseline
  await page.click(".process-link");
  await page.waitForTimeout(500);
  const baseline = await landSnap("base");

  // Increase Interest padB — push body up relative to Desire land
  const padBUp = [];
  for (const pb of [52, 72, 92, 112, 132, 152, 172, 192]) {
    await page.evaluate((pb) => {
      document
        .querySelector(".look--copy .look-inner")
        .style.setProperty("padding-bottom", `${pb}px`, "important");
    }, pb);
    await page.click(".process-link");
    await page.waitForTimeout(450);
    const land = await landSnap(`padB-${pb}`);
    await page.goto(`http://127.0.0.1:${PORT}/#problem`, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    // re-apply after navigation
    await page.evaluate((pb) => {
      document
        .querySelector(".look--copy .look-inner")
        .style.setProperty("padding-bottom", `${pb}px`, "important");
    }, pb);
    await page.goto(`http://127.0.0.1:${PORT}/#problem`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(200);
    await page.evaluate((pb) => {
      document
        .querySelector(".look--copy .look-inner")
        .style.setProperty("padding-bottom", `${pb}px`, "important");
      location.hash = "#problem";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    }, pb);
    await page.waitForTimeout(250);
    const hash = await interestHashSnap();
    padBUp.push({ pb, land, hash });
    await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(200);
  }

  // Combined: modest padB up + modest sm cut within optical
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  const combo = [];
  for (const [pb, sm] of [
    [52, 12.6],
    [80, 12.6],
    [100, 12.6],
    [120, 12.6],
    [140, 12.6],
    [100, 12.0],
    [120, 12.0],
    [140, 11.5],
    [160, 12.6],
    [180, 12.6],
  ]) {
    await page.evaluate(
      ({ pb, sm }) => {
        document
          .querySelector(".look--copy .look-inner")
          .style.setProperty("padding-bottom", `${pb}px`, "important");
        document.querySelector("#solution").style.setProperty("scroll-margin-top", `${sm}rem`);
      },
      { pb, sm }
    );
    await page.click(".process-link");
    await page.waitForTimeout(500);
    combo.push({ pb, sm, ...(await landSnap(`pb${pb}_sm${sm}`)) });
  }

  // CSS source: what is look--copy look-inner padding authored as?
  const authoredCopy = {
    match: /\.look--copy\s+\.look-inner\s*\{[^}]+\}/s.exec(css)?.[0],
    padBRem: /\.look--copy\s+\.look-inner\s*\{[^}]*padding-bottom:\s*([^;]+)/s.exec(css)?.[1],
    padBlock: /\.look--copy\s+\.look-inner\s*\{[^}]*padding:\s*([^;]+)/s.exec(css)?.[1],
  };

  // Mid story peek anatomy — is Consequence isolation incomplete?
  await page.evaluate(() => {
    document.querySelector(".look--copy .look-inner").style.removeProperty("padding-bottom");
    document.querySelector("#solution").style.removeProperty("scroll-margin-top");
  });
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  await page.evaluate(() =>
    document.querySelector(".look-inner--after-demo").scrollIntoView({ block: "center" })
  );
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(out, "capture-d1280-mid-story-peek.png") });
  const midPeek = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const vis = (el) => {
      if (!el) return 0;
      const b = el.getBoundingClientRect();
      return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    };
    const after = q(".look-inner--after-demo").getBoundingClientRect();
    const story = q(".look--story").getBoundingClientRect();
    const cta = q(".look-inner--after-demo .cta-trial").getBoundingClientRect();
    const demo = q(".demo-frame").getBoundingClientRect();
    const urgH2 = q("#urgency h2").getBoundingClientRect();
    const urgP = q("#urgency p")?.getBoundingClientRect();
    // How much story field is below CTA vs how much content
    return {
      afterBottom: +after.bottom.toFixed(1),
      ctaBottom: +cta.bottom.toFixed(1),
      storyTop: +story.top.toFixed(1),
      storyVis: +vis(q(".look--story")).toFixed(1),
      urgH2Vis: +vis(q("#urgency h2")).toFixed(1),
      urgPVis: urgP ? +vis(q("#urgency p")).toFixed(1) : 0,
      urgH2Top: +urgH2.top.toFixed(1),
      gapCtaToStory: +(story.top - cta.bottom).toFixed(1),
      gapDemoToCta: +(cta.top - demo.bottom).toFixed(1),
      afterPadB: getComputedStyle(q(".look-inner--after-demo")).paddingBottom,
      storyField: getComputedStyle(q(".look--story")).backgroundColor,
      // empty story peek = storyVis but urg content 0
      emptyStoryPeek: +(vis(q(".look--story")) - vis(q("#urgency h2")) - (urgP ? vis(q("#urgency p")) : 0)).toFixed(1),
    };
  });

  // Demo chrome: frame vs video mass
  await page.click(".process-link");
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(out, "capture-d1280-demo-chrome.png") });
  const demoChrome = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const vis = (el) => {
      if (!el) return 0;
      const b = el.getBoundingClientRect();
      return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    };
    const frame = q(".demo-frame").getBoundingClientRect();
    const video = (q(".demo-frame video") || q(".demo-video")).getBoundingClientRect();
    const band = q(".demo-band").getBoundingClientRect();
    return {
      frameH: +frame.height.toFixed(1),
      videoH: +video.height.toFixed(1),
      chromeBelowVideoInFrame: +(frame.bottom - video.bottom).toFixed(1),
      chromeAboveVideoInFrame: +(video.top - frame.top).toFixed(1),
      frameVis: +vis(q(".demo-frame")).toFixed(1),
      videoVis: +vis(q(".demo-frame video") || q(".demo-video")).toFixed(1),
      bandW: +band.width.toFixed(1),
      frameW: +frame.width.toFixed(1),
      videoTopInVp: +video.top.toFixed(1),
      frameTopInVp: +frame.top.toFixed(1),
      matteVsVideo: +((frame.height - video.height) / frame.height * 100).toFixed(1),
    };
  });

  // Read Interest look-inner CSS precisely
  const copyCss = await page.evaluate(() => {
    const el = document.querySelector(".look--copy .look-inner");
    const cs = getComputedStyle(el);
    return {
      paddingTop: cs.paddingTop,
      paddingBottom: cs.paddingBottom,
      paddingLeft: cs.paddingLeft,
      paddingRight: cs.paddingRight,
      maxWidth: cs.maxWidth,
      width: cs.width,
    };
  });

  const result = {
    baseline,
    authoredCopy,
    copyCss,
    padBUp: padBUp.map(({ pb, land, hash }) => ({
      pb,
      interestPVis: land.interestPVis,
      interestFieldVis: land.interestFieldVis,
      optical: land.optical,
      demoVis: land.demoVis,
      lmsToDemo: land.lmsToDemo,
      deadBelowP: land.deadBelowP,
      hashOptical: hash.optical,
      hashBodyVis: hash.bodyVis,
    })),
    combo,
    midPeek,
    demoChrome,
  };

  fs.writeFileSync(path.join(out, "bleed35.json"), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  server.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
