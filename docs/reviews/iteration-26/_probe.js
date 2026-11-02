const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../../src");
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
  await new Promise((r) => server.listen(8463, r));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto("http://127.0.0.1:8463/", { waitUntil: "networkidle" });

  await page.evaluate(() =>
    document.querySelector(".look-inner--after-demo .cta-trial").scrollIntoView({ block: "center" })
  );
  await page.waitForTimeout(200);
  const mid = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const cta = q(".look-inner--after-demo .cta-trial").getBoundingClientRect();
    const urg = q("#urgency h2").getBoundingClientRect();
    const partners = q("#partners").getBoundingClientRect();
    const vis = (b) => Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    return {
      cta: { t: +cta.top.toFixed(1), b: +cta.bottom.toFixed(1), h: +cta.height.toFixed(1) },
      urgH2: {
        t: +urg.top.toFixed(1),
        b: +urg.bottom.toFixed(1),
        h: +urg.height.toFixed(1),
        vis: vis(urg),
      },
      partnersVis: vis(partners),
      gapCtaUrg: +(urg.top - cta.bottom).toFixed(1),
      needExtraToClear: Math.max(0, +(innerHeight - urg.top).toFixed(1)),
      afterPadB: parseFloat(getComputedStyle(q(".look-inner--after-demo")).paddingBottom),
      storyPadT: parseFloat(getComputedStyle(q(".look--story .look-inner")).paddingTop),
      storyPadB: parseFloat(getComputedStyle(q(".look--story .look-inner")).paddingBottom),
      proofPadT: parseFloat(getComputedStyle(q(".look--proof .look-inner")).paddingTop),
      proofPadB: parseFloat(getComputedStyle(q(".look--proof .look-inner")).paddingBottom),
    };
  });

  await page.evaluate(() =>
    document.querySelector(".partner-strip").scrollIntoView({ block: "center" })
  );
  await page.waitForTimeout(200);
  const part = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const vis = (el) => {
      const b = el.getBoundingClientRect();
      return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    };
    const strip = q(".partner-strip").getBoundingClientRect();
    const urgH2 = q("#urgency h2").getBoundingClientRect();
    const contactH2 = q("#contact h2").getBoundingClientRect();
    return {
      stripCy: +(strip.top + strip.height / 2).toFixed(1),
      urgH2: vis(q("#urgency h2")),
      urgH2Bottom: +urgH2.bottom.toFixed(1),
      contactH2: vis(q("#contact h2")),
      contactH2Top: +contactH2.top.toFixed(1),
      contactCta: vis(q("#contact .cta-trial")),
      needTopExtra: Math.max(0, +urgH2.bottom.toFixed(1)),
      needBottomExtra: Math.max(0, +(innerHeight - contactH2.top).toFixed(1)),
      storyH: +q(".look--story").getBoundingClientRect().height.toFixed(1),
      proofH: +q(".look--proof").getBoundingClientRect().height.toFixed(1),
    };
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:8463/", { waitUntil: "networkidle" });
  await page.evaluate(() =>
    document.querySelector("#urgency").scrollIntoView({ block: "center" })
  );
  await page.waitForTimeout(200);
  const mob = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const vis = (el) => {
      if (!el) return 0;
      const b = el.getBoundingClientRect();
      return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    };
    return {
      demo: vis(q(".demo-band")),
      midCta: vis(q(".look-inner--after-demo .cta-trial")),
      urgH2: vis(q("#urgency h2")),
      urgBody: vis(q("#urgency p")),
      partners: vis(q("#partners")),
      contactH2: vis(q("#contact h2")),
      contactCta: vis(q("#contact .cta-trial")),
      h2Clearance: (() => {
        const idx = q(".look-indices").getBoundingClientRect();
        const h2 = q("#urgency h2").getBoundingClientRect();
        return +(h2.left - idx.right).toFixed(1);
      })(),
      storyPadT: parseFloat(getComputedStyle(q(".look--story .look-inner")).paddingTop),
      afterPadB: parseFloat(getComputedStyle(q(".look-inner--after-demo")).paddingBottom),
      proofPad: getComputedStyle(q(".look--proof .look-inner")).padding,
    };
  });

  await page.setViewportSize({ width: 1120, height: 720 });
  await page.goto("http://127.0.0.1:8463/", { waitUntil: "networkidle" });
  await page.click(".process-link");
  await page.waitForTimeout(900);
  const w1120 = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const title = q("#solution-title").getBoundingClientRect();
    const vis = (b) => Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    return {
      title: {
        t: +title.top.toFixed(1),
        vis: vis(title),
        h: +title.height.toFixed(1),
        lines: Math.round(
          title.height / parseFloat(getComputedStyle(q("#solution-title")).lineHeight)
        ),
      },
      mechVis: vis(q(".mechanism").getBoundingClientRect()),
      lmsVis: vis(q(".mechanism-lms").getBoundingClientRect()),
      demoVis: vis(q(".demo-band").getBoundingClientRect()),
      scrollMargin: getComputedStyle(q("#solution")).scrollMarginTop,
      solutionPadT: parseFloat(
        getComputedStyle(q(".look--solution > .look-inner:first-of-type")).paddingTop
      ),
    };
  });

  // Contrast sample: play vs bone-deep frame
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("http://127.0.0.1:8463/", { waitUntil: "networkidle" });
  await page.evaluate(() =>
    document.querySelector(".demo-band").scrollIntoView({ block: "center" })
  );
  const playContrast = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const play = getComputedStyle(q(".demo-play"));
    const frame = getComputedStyle(q(".demo-frame"));
    return {
      playBg: play.backgroundColor,
      playColor: play.color,
      playBorder: play.borderTop,
      frameBg: frame.backgroundColor,
      frameBorder: frame.borderTop,
      sameAsBoneField: play.backgroundColor === getComputedStyle(document.body).backgroundColor,
    };
  });

  console.log(JSON.stringify({ mid, part, mob, w1120, playContrast }, null, 2));
  fs.writeFileSync(
    path.join(__dirname, "probe.json"),
    JSON.stringify({ mid, part, mob, w1120, playContrast }, null, 2)
  );
  await browser.close();
  server.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
