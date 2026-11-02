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

const vis = (el) => {
  if (!el) return null;
  const b = el.getBoundingClientRect();
  return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
};

(async () => {
  await new Promise((r) => server.listen(8311, r));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto("http://127.0.0.1:8311/", { waitUntil: "networkidle" });

  const type = await page.evaluate(() => {
    const fs = (s) => getComputedStyle(document.querySelector(s)).fontSize;
    return {
      problem: fs(".look--copy h2"),
      solution: fs(".look--solution h2"),
      urgency: fs("#urgency h2"),
      partners: fs("#partners h2"),
      footer: fs(".look--footer h2"),
    };
  });

  await page.setViewportSize({ width: 1120, height: 720 });
  await page.reload({ waitUntil: "networkidle" });
  await page.click(".process-link");
  await page.waitForTimeout(400);
  const land = await page.evaluate(() => {
    const t = document.querySelector("#solution-title").getBoundingClientRect();
    const demo = document.querySelector(".demo-band").getBoundingClientRect();
    const lms = document.querySelector(".mechanism-lms").getBoundingClientRect();
    const claimBottom = Math.min(lms.bottom, demo.top);
    const claimH = claimBottom - t.top;
    return {
      optical: +(t.top + t.height / 2 - innerHeight / 2).toFixed(1),
      lines: Math.round(
        document.querySelector("#solution-title").getBoundingClientRect().height /
          parseFloat(getComputedStyle(document.querySelector("#solution-title")).lineHeight)
      ),
      claimShareOfVh: +((claimH / innerHeight) * 100).toFixed(1),
      titleToDemoShare: +(((demo.top - t.top) / innerHeight) * 100).toFixed(1),
      demoVis: Math.max(0, Math.min(demo.bottom, innerHeight) - Math.max(demo.top, 0)),
      claimTopShare: +((Math.min(claimBottom, innerHeight) / innerHeight) * 100).toFixed(1),
      scrollMargin: getComputedStyle(document.querySelector("#solution")).scrollMarginTop,
    };
  });

  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("http://127.0.0.1:8311/", { waitUntil: "networkidle" });
  await page.evaluate(() =>
    document.querySelector("#urgency").scrollIntoView({ block: "center" })
  );
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(out, "capture-d1280-urgency-verify.png") });
  const urgClear = await page.evaluate(() => {
    const part = document.querySelector("#partners").getBoundingClientRect();
    const partH2 = document.querySelector("#partners h2").getBoundingClientRect();
    return {
      partnersVis: Math.max(0, Math.min(part.bottom, innerHeight) - Math.max(part.top, 0)),
      partnersT: +part.top.toFixed(1),
      need: +Math.max(0, innerHeight - part.top).toFixed(1),
      h2Vis: Math.max(0, Math.min(partH2.bottom, innerHeight) - Math.max(partH2.top, 0)),
      urgOptical: +(
        document.querySelector("#urgency h2").getBoundingClientRect().top +
        document.querySelector("#urgency h2").getBoundingClientRect().height / 2 -
        innerHeight / 2
      ).toFixed(1),
      storyPadB: parseFloat(
        getComputedStyle(document.querySelector(".look--story .look-inner")).paddingBottom
      ),
      proofPadT: parseFloat(
        getComputedStyle(document.querySelector(".look--proof .look-inner")).paddingTop
      ),
    };
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:8311/", { waitUntil: "networkidle" });
  await page.evaluate(() =>
    document.querySelector("#urgency").scrollIntoView({ block: "center" })
  );
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(out, "capture-m390-urgency-verify.png") });
  const mob = await page.evaluate(() => {
    const v = (el) => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    };
    return {
      partnersVis: v(document.querySelector("#partners")),
      partnersH2: v(document.querySelector("#partners h2")),
      midCta: v(document.querySelector(".look--solution .look-inner--after-demo .cta-trial")),
      contactH2: v(document.querySelector("#contact h2")),
      storyPadB: parseFloat(
        getComputedStyle(document.querySelector(".look--story .look-inner")).paddingBottom
      ),
      proofPadT: parseFloat(
        getComputedStyle(document.querySelector(".look--proof .look-inner")).paddingTop
      ),
      needPartners: +Math.max(
        0,
        innerHeight - document.querySelector("#partners").getBoundingClientRect().top
      ).toFixed(1),
    };
  });

  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("http://127.0.0.1:8311/", { waitUntil: "networkidle" });
  await page.evaluate(() =>
    document.querySelector("#problem").scrollIntoView({ block: "start" })
  );
  await page.waitForTimeout(200);
  const interest = await page.evaluate(() => {
    const t = document.querySelector("#problem h2").getBoundingClientRect();
    return {
      optical: +(t.top + t.height / 2 - innerHeight / 2).toFixed(1),
      copyBg: getComputedStyle(document.querySelector(".look--copy")).backgroundColor,
      solBg: getComputedStyle(document.querySelector(".look--solution")).backgroundColor,
    };
  });

  await page.click(".process-link");
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(out, "capture-d1280-after-process-verify.png") });
  const d1280land = await page.evaluate(() => {
    const t = document.querySelector("#solution-title").getBoundingClientRect();
    const demo = document.querySelector(".demo-band").getBoundingClientRect();
    const lms = document.querySelector(".mechanism-lms").getBoundingClientRect();
    return {
      optical: +(t.top + t.height / 2 - innerHeight / 2).toFixed(1),
      titleT: +t.top.toFixed(1),
      demoVis: Math.max(0, Math.min(demo.bottom, innerHeight) - Math.max(demo.top, 0)),
      claimShare: +(((Math.min(lms.bottom, demo.top) - t.top) / innerHeight) * 100).toFixed(1),
    };
  });

  await page.evaluate(() =>
    document.querySelector(".demo-band").scrollIntoView({ block: "center" })
  );
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(out, "capture-d1280-demo-verify.png") });
  const play = await page.evaluate(() => {
    const playEl = document.querySelector(".demo-play").getBoundingClientRect();
    const video = document.querySelector(".demo-video").getBoundingClientRect();
    const frame = document.querySelector(".demo-frame").getBoundingClientRect();
    return {
      fromFrameTop: +(playEl.top - frame.top).toFixed(1),
      fromFrameLeft: +(playEl.left - frame.left).toFixed(1),
      fromVideoTop: +(playEl.top - video.top).toFixed(1),
      fromVideoLeft: +(playEl.left - video.left).toFixed(1),
      overlapsVideo:
        playEl.right > video.left &&
        playEl.left < video.right &&
        playEl.bottom > video.top &&
        playEl.top < video.bottom,
      padNeededTop: Math.max(0, +(video.top - playEl.bottom + 0.1).toFixed(1)),
      padNeededLeft: Math.max(0, +(video.left - playEl.right + 0.1).toFixed(1)),
      playH: +playEl.height.toFixed(1),
      framePad: getComputedStyle(document.querySelector(".demo-frame")).padding,
    };
  });

  // mid-width claim share goal residual + partners strip isolation keep
  await page.setViewportSize({ width: 1120, height: 720 });
  await page.goto("http://127.0.0.1:8311/", { waitUntil: "networkidle" });
  await page.click(".process-link");
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(out, "capture-w1120-after-process-verify.png") });

  const result = { type, land, urgClear, mob, interest, d1280land, play };
  fs.writeFileSync(path.join(out, "verify.json"), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  server.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
