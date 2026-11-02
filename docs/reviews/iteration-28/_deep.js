const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../../src");
const out = __dirname;
const css = fs
  .readFileSync(path.join(root, "css/styles.css"), "utf8")
  .replace(/url\((['"]?)\.\.\//g, "url($1/");
const js = fs.readFileSync(path.join(root, "js/script.js"), "utf8");
let html = fs.readFileSync(path.join(root, "index.html"), "utf8");
html = html.replace("</head>", `<style>${css}</style></head>`);
html = html.replace("</body>", `<script>${js}</script></body>`);

const server = http.createServer((req, res) => {
  let u = decodeURIComponent((req.url || "/").split("?")[0]);
  if (u === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
    return;
  }
  const fp = path.normalize(path.join(root, u.replace(/^\//, "")));
  if (!fp.startsWith(root) || !fs.existsSync(fp)) {
    res.writeHead(404);
    res.end("no");
    return;
  }
  fs.createReadStream(fp).pipe(res);
});

(async () => {
  await new Promise((r) => server.listen(8665, r));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto("http://127.0.0.1:8665/", { waitUntil: "networkidle" });

  const deep = {};

  await page.evaluate(() =>
    document.querySelector(".look-inner--after-demo").scrollIntoView({ block: "center" })
  );
  await page.waitForTimeout(200);
  deep.afterDemoBlock = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const vis = (el) => {
      const b = el.getBoundingClientRect();
      return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    };
    const cta = q(".look-inner--after-demo .cta-trial").getBoundingClientRect();
    const urg = q("#urgency h2").getBoundingClientRect();
    const after = q(".look-inner--after-demo").getBoundingClientRect();
    return {
      afterCy: +(after.top + after.height / 2).toFixed(1),
      ctaCy: +(cta.top + cta.height / 2).toFixed(1),
      urgVis: vis(q("#urgency h2")),
      urgT: +urg.top.toFixed(1),
      demoVis: vis(q(".demo-band")),
      needExtra: Math.max(0, +(innerHeight - urg.top).toFixed(1)),
      afterH: +after.height.toFixed(1),
    };
  });

  await page.evaluate(() =>
    document.querySelector("#partners").scrollIntoView({ block: "center" })
  );
  await page.waitForTimeout(200);
  deep.partnersSection = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const vis = (el) => {
      const b = el.getBoundingClientRect();
      return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    };
    const sec = q("#partners").getBoundingClientRect();
    const strip = q(".partner-strip").getBoundingClientRect();
    return {
      secCy: +(sec.top + sec.height / 2).toFixed(1),
      stripCy: +(strip.top + strip.height / 2).toFixed(1),
      urgH2: vis(q("#urgency h2")),
      urgBody: vis(q("#urgency p")),
      contactH2: vis(q("#contact h2")),
      contactCta: vis(q("#contact .cta-trial")),
      stripVis: vis(q(".partner-strip")),
      needBottom: Math.max(
        0,
        +(innerHeight - q("#contact h2").getBoundingClientRect().top).toFixed(1)
      ),
    };
  });

  deep.textureStory = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const cs = (sel) => {
      const s = getComputedStyle(q(sel));
      return { bg: s.backgroundColor, borderTop: s.borderTop };
    };
    return {
      solution: cs(".look--solution"),
      story: cs(".look--story"),
      proof: cs(".look--proof"),
      copy: cs(".look--copy"),
      solutionEqStory:
        getComputedStyle(q(".look--solution")).backgroundColor ===
        getComputedStyle(q(".look--story")).backgroundColor,
      proofNeqSolution:
        getComputedStyle(q(".look--proof")).backgroundColor !==
        getComputedStyle(q(".look--solution")).backgroundColor,
    };
  });

  deep.type = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const size = (sel) => getComputedStyle(q(sel)).fontSize;
    const sol = q("#solution-title");
    const sb = sol.getBoundingClientRect();
    return {
      problem: size("#problem-title"),
      solution: size("#solution-title"),
      urgency: size("#urgency h2"),
      footer: size("#contact h2"),
      solutionMaxW: getComputedStyle(sol).maxWidth,
      solutionW: +sb.width.toFixed(1),
      solutionLines: Math.round(
        sb.height / parseFloat(getComputedStyle(sol).lineHeight)
      ),
      partnersHasH2: !!q("#partners h2"),
      partnersLabel: q("#partners")?.getAttribute("aria-label"),
      mechanismMeasure: +(
        q(".mechanism").getBoundingClientRect().width /
        parseFloat(getComputedStyle(q(".mechanism")).fontSize)
      ).toFixed(1),
    };
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:8665/", { waitUntil: "networkidle" });
  await page.evaluate(() =>
    document.querySelector("#urgency").scrollIntoView({ block: "center" })
  );
  await page.waitForTimeout(200);
  deep.mobUrg = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const vis = (el) => {
      const b = el.getBoundingClientRect();
      return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    };
    const cta = q(".look-inner--after-demo .cta-trial").getBoundingClientRect();
    return {
      demo: vis(q(".demo-band")),
      midCta: vis(q(".look-inner--after-demo .cta-trial")),
      ctaBottom: +cta.bottom.toFixed(1),
      needExtraAbove: Math.max(0, +cta.bottom.toFixed(1)),
      urgH2: vis(q("#urgency h2")),
      partners: vis(q("#partners")),
      contactH2: vis(q("#contact h2")),
      afterPadB: parseFloat(getComputedStyle(q(".look-inner--after-demo")).paddingBottom),
      storyPadT: parseFloat(getComputedStyle(q(".look--story .look-inner")).paddingTop),
      proofPad: getComputedStyle(q(".look--proof .look-inner")).padding,
    };
  });

  await page.setViewportSize({ width: 1120, height: 720 });
  await page.goto("http://127.0.0.1:8665/", { waitUntil: "networkidle" });
  await page.click(".process-link");
  await page.waitForTimeout(900);
  deep.w1120 = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const title = q("#solution-title");
    const tb = title.getBoundingClientRect();
    const lh = parseFloat(getComputedStyle(title).lineHeight);
    const fs = parseFloat(getComputedStyle(title).fontSize);
    return {
      t: +tb.top.toFixed(1),
      h: +tb.height.toFixed(1),
      vis: Math.max(0, Math.min(tb.bottom, innerHeight) - Math.max(tb.top, 0)),
      optical: +(tb.top + tb.height / 2 - innerHeight / 2).toFixed(1),
      lines: Math.round(tb.height / lh),
      fontSize: fs,
      lineHeight: lh,
      maxWidth: getComputedStyle(title).maxWidth,
      width: +tb.width.toFixed(1),
      scrollMargin: getComputedStyle(q("#solution")).scrollMarginTop,
      padT: parseFloat(
        getComputedStyle(q(".look--solution > .look-inner:first-of-type")).paddingTop
      ),
      needRaisePx: +(360 - (tb.top + tb.height / 2)).toFixed(1),
      demoT: +q(".demo-band").getBoundingClientRect().top.toFixed(1),
      claimBottom: +q(".mechanism-lms").getBoundingClientRect().bottom.toFixed(1),
      mechVis: Math.max(
        0,
        Math.min(q(".mechanism").getBoundingClientRect().bottom, innerHeight) -
          Math.max(q(".mechanism").getBoundingClientRect().top, 0)
      ),
      demoVis: Math.max(
        0,
        Math.min(q(".demo-band").getBoundingClientRect().bottom, innerHeight) -
          Math.max(q(".demo-band").getBoundingClientRect().top, 0)
      ),
    };
  });

  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("http://127.0.0.1:8665/", { waitUntil: "networkidle" });
  await page.click(".process-link");
  await page.waitForTimeout(900);
  deep.d1280process = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const title = q("#solution-title");
    const tb = title.getBoundingClientRect();
    const lh = parseFloat(getComputedStyle(title).lineHeight);
    return {
      t: +tb.top.toFixed(1),
      h: +tb.height.toFixed(1),
      lines: Math.round(tb.height / lh),
      optical: +(tb.top + tb.height / 2 - innerHeight / 2).toFixed(1),
      demoVis: Math.max(
        0,
        Math.min(q(".demo-band").getBoundingClientRect().bottom, innerHeight) -
          Math.max(q(".demo-band").getBoundingClientRect().top, 0)
      ),
      claimBottom: +q(".mechanism-lms").getBoundingClientRect().bottom.toFixed(1),
    };
  });

  // Capture after-demo block for evidence (urgency peek)
  await page.evaluate(() =>
    document.querySelector(".look-inner--after-demo").scrollIntoView({ block: "center" })
  );
  await page.waitForTimeout(200);
  await page.screenshot({
    path: path.join(out, "capture-d1280-after-demo-block.png"),
    fullPage: false,
  });

  fs.writeFileSync(path.join(out, "deep.json"), JSON.stringify(deep, null, 2));
  console.log(JSON.stringify(deep, null, 2));
  await browser.close();
  server.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
