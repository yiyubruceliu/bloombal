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

const mime = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp4": "video/mp4",
  ".ttf": "font/ttf",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
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
  await new Promise((r) => server.listen(8167, r));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto("http://127.0.0.1:8167/", { waitUntil: "networkidle" });

  await page.evaluate(() =>
    document.querySelector("#urgency").scrollIntoView({ block: "center" })
  );
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(out, "capture-d1280-urgency-extra.png") });
  const urg = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const vis = (el) => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    };
    const h2 = q("#urgency h2").getBoundingClientRect();
    const part = q("#partners");
    const partH2 = q("#partners h2");
    return {
      urgOptical: +(h2.top + h2.height / 2 - innerHeight / 2).toFixed(1),
      urgH2Vis: vis(q("#urgency h2")),
      urgBodyVis: vis(q("#urgency p")),
      partnersVis: vis(part),
      partnersH2Vis: vis(partH2),
      partnersT: +part.getBoundingClientRect().top.toFixed(1),
      storyPadB: parseFloat(getComputedStyle(q(".look--story .look-inner")).paddingBottom),
      proofPadT: parseFloat(getComputedStyle(q(".look--proof .look-inner")).paddingTop),
      needExtraPartners: Math.max(0, +(innerHeight - part.getBoundingClientRect().top).toFixed(1)),
      needExtraPartnersH2: partH2
        ? Math.max(0, +(innerHeight - partH2.getBoundingClientRect().top).toFixed(1))
        : null,
    };
  });

  await page.setViewportSize({ width: 1120, height: 720 });
  await page.goto("http://127.0.0.1:8167/", { waitUntil: "networkidle" });
  await page.click(".process-link");
  await page.waitForTimeout(450);
  await page.screenshot({ path: path.join(out, "capture-w1120-after-process-extra.png") });
  const land = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const title = q("#solution-title").getBoundingClientRect();
    const lms = q(".mechanism-lms");
    const mech = q(".mechanism");
    const demo = q(".demo-band").getBoundingClientRect();
    const claimBottom = lms
      ? lms.getBoundingClientRect().bottom
      : mech
        ? mech.getBoundingClientRect().bottom
        : title.bottom;
    const aboveDemo = Math.max(0, Math.min(claimBottom, demo.top) - Math.max(title.top, 0));
    const vh = innerHeight;
    const cs = getComputedStyle(q("#solution-title"));
    const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.2;
    const lines = Math.round(title.height / lh);
    const stackTop = Math.max(title.top, 0);
    const stackBottom = Math.min(claimBottom, vh);
    const stackInVp = Math.max(0, stackBottom - stackTop);
    return {
      optical: +(title.top + title.height / 2 - vh / 2).toFixed(1),
      lines,
      titleT: +title.top.toFixed(1),
      titleH: +title.height.toFixed(1),
      claimAboveDemoPx: +aboveDemo.toFixed(1),
      claimShareOfVh: +((aboveDemo / vh) * 100).toFixed(1),
      claimStackInVpShare: +((stackInVp / vh) * 100).toFixed(1),
      demoVis: Math.max(0, Math.min(demo.bottom, vh) - Math.max(demo.top, 0)),
      demoT: +demo.top.toFixed(1),
      scrollMargin: getComputedStyle(q("#solution")).scrollMarginTop,
      firstInnerPadT: parseFloat(
        getComputedStyle(q(".look--solution > .look-inner:first-of-type")).paddingTop
      ),
      needRaisePx: Math.max(0, +(vh / 2 - (title.top + title.height / 2)).toFixed(1)),
    };
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:8167/", { waitUntil: "networkidle" });
  await page.evaluate(() =>
    document.querySelector("#urgency").scrollIntoView({ block: "center" })
  );
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(out, "capture-m390-urgency-extra.png") });
  const mob = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const vis = (el) => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    };
    return {
      midCta: vis(q(".look-inner--after-demo .cta-trial")),
      partners: vis(q("#partners")),
      partnersH2: vis(q("#partners h2")),
      contactH2: vis(q("#contact h2")),
      urgH2: vis(q("#urgency h2")),
      needPartnersClear: Math.max(
        0,
        +(innerHeight - q("#partners").getBoundingClientRect().top).toFixed(1)
      ),
    };
  });

  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("http://127.0.0.1:8167/", { waitUntil: "networkidle" });
  await page.evaluate(() =>
    document.querySelector("#solution").scrollIntoView({ block: "start" })
  );
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(out, "capture-d1280-interest-desire-seam.png") });
  const seam = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const copy = q(".look--copy");
    const sol = q(".look--solution");
    const cb = copy.getBoundingClientRect();
    const sb = sol.getBoundingClientRect();
    return {
      copyBg: getComputedStyle(copy).backgroundColor,
      solBg: getComputedStyle(sol).backgroundColor,
      sharedBone: getComputedStyle(copy).backgroundColor === getComputedStyle(sol).backgroundColor,
      copyBorderTop: getComputedStyle(copy).borderTop,
      solBorderTop: getComputedStyle(sol).borderTop,
      copyBottomInVp: +cb.bottom.toFixed(1),
      solTopInVp: +sb.top.toFixed(1),
      seamGap: +(sb.top - cb.bottom).toFixed(1),
    };
  });

  await page.evaluate(() =>
    document.querySelector(".demo-band").scrollIntoView({ block: "center" })
  );
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(out, "capture-d1280-demo-extra.png") });
  const play = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const p = q(".demo-play").getBoundingClientRect();
    const f = q(".demo-frame").getBoundingClientRect();
    const v = q(".demo-video").getBoundingClientRect();
    const overlaps = !(p.bottom <= v.top || p.top >= v.bottom || p.right <= v.left || p.left >= v.right);
    return {
      play: { t: +p.top.toFixed(1), l: +p.left.toFixed(1), b: +p.bottom.toFixed(1), r: +p.right.toFixed(1) },
      fromFrameTop: +(p.top - f.top).toFixed(1),
      fromVideoTop: +(p.top - v.top).toFixed(1),
      fromLeft: +(p.left - f.left).toFixed(1),
      overlapsVideo: overlaps,
      playBg: getComputedStyle(q(".demo-play")).backgroundColor,
    };
  });

  // Desktop process land optical
  await page.goto("http://127.0.0.1:8167/", { waitUntil: "networkidle" });
  await page.click(".process-link");
  await page.waitForTimeout(450);
  await page.screenshot({ path: path.join(out, "capture-d1280-after-process-extra.png") });
  const d1280 = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const title = q("#solution-title").getBoundingClientRect();
    const demo = q(".demo-band").getBoundingClientRect();
    const vh = innerHeight;
    return {
      optical: +(title.top + title.height / 2 - vh / 2).toFixed(1),
      titleT: +title.top.toFixed(1),
      lines: Math.round(
        title.height /
          (parseFloat(getComputedStyle(q("#solution-title")).lineHeight) ||
            parseFloat(getComputedStyle(q("#solution-title")).fontSize) * 1.2)
      ),
      demoVis: Math.max(0, Math.min(demo.bottom, vh) - Math.max(demo.top, 0)),
      scrollMargin: getComputedStyle(q("#solution")).scrollMarginTop,
    };
  });

  const result = { urg, land, mob, seam, play, d1280 };
  console.log(JSON.stringify(result, null, 2));
  fs.writeFileSync(path.join(out, "extra.json"), JSON.stringify(result, null, 2));
  await browser.close();
  server.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
