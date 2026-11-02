const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../../src");
const out = __dirname;
const PORT = 9237;

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

async function midAt(page, pb) {
  await page.evaluate((pb) => {
    document.querySelector(".look-inner--after-demo").style.paddingBottom = `${pb}rem`;
  }, pb);
  await page.evaluate(() =>
    document.querySelector(".look-inner--after-demo").scrollIntoView({ block: "center" })
  );
  await page.waitForTimeout(220);
  return page.evaluate((pb) => {
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
      pb,
      gapDemoToCta: +(cta.top - demo.bottom).toFixed(1),
      urgH2Vis: +vis(q("#urgency h2")).toFixed(1),
      urgPVis: urgP ? +vis(urgP).toFixed(1) : 0,
      storyVis: +vis(story).toFixed(1),
      afterPadT: getComputedStyle(q(".look-inner--after-demo")).paddingTop,
      afterPadB: getComputedStyle(q(".look-inner--after-demo")).paddingBottom,
    };
  }, pb);
}

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch({ headless: true });

  const mid390 = [];
  const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await m.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  for (const pb of [13.5, 15.5, 17, 18, 19, 20, 21, 22, 24, 26]) {
    mid390.push(await midAt(m, pb));
  }
  await m.screenshot({ path: path.join(out, "capture-m390-mid-block-center.png") });
  await m.close();

  // also check padT raise for gapDemoToCta at 1120 (stuck at 16)
  const mid1120PadT = [];
  const p = await browser.newPage({ viewport: { width: 1120, height: 720 } });
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  for (const [pt, pb] of [
    [1, 15.5],
    [1.5, 15.5],
    [2, 15.5],
    [2.5, 15.5],
    [1, 16],
    [2, 16],
  ]) {
    await p.evaluate(({ pt, pb }) => {
      const el = document.querySelector(".look-inner--after-demo");
      el.style.paddingTop = `${pt}rem`;
      el.style.paddingBottom = `${pb}rem`;
    }, { pt, pb });
    await p.evaluate(() =>
      document.querySelector(".look-inner--after-demo").scrollIntoView({ block: "center" })
    );
    await p.waitForTimeout(220);
    mid1120PadT.push(
      await p.evaluate(({ pt, pb }) => {
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
          pt,
          pb,
          gapDemoToCta: +(cta.top - demo.bottom).toFixed(1),
          urgH2Vis: +vis(q("#urgency h2")).toFixed(1),
          storyVis: +vis(story).toFixed(1),
        };
      }, { pt, pb })
    );
  }
  await p.close();

  // confirm unsafe matte alone still fails clear
  const unsafeAlone = [];
  const d = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await d.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  for (const pt of ["2.25rem", "2.1rem", "2rem"]) {
    await d.evaluate((pt) => {
      document.querySelector(".demo-frame").style.padding = `${pt} 0.75rem 0.75rem`;
      const play = [...document.querySelectorAll("a,button")].find((el) =>
        /view process/i.test(el.textContent || "")
      );
      if (play) {
        play.style.removeProperty("top");
        play.style.removeProperty("left");
      }
    }, pt);
    await d.click(".process-link");
    await d.waitForTimeout(400);
    unsafeAlone.push(
      await d.evaluate((pt) => {
        const q = (s) => document.querySelector(s);
        const frame = q(".demo-frame");
        const video = q(".demo-frame video") || q(".demo-video");
        const fr = frame.getBoundingClientRect();
        const vr = video.getBoundingClientRect();
        const play = [...document.querySelectorAll("a,button")].find((el) =>
          /view process/i.test(el.textContent || "")
        );
        const playR = play.getBoundingClientRect();
        return {
          pt,
          chromeAbove: +(vr.top - fr.top).toFixed(1),
          playClearVideo: !(
            playR.bottom > vr.top &&
            playR.top < vr.bottom &&
            playR.right > vr.left &&
            playR.left < vr.right
          ),
          playBottomVsVideoTop: +(playR.bottom - vr.top).toFixed(1),
        };
      }, pt)
    );
  }
  await d.close();

  const result = {
    mid390,
    mid390Clear: mid390.filter((x) => x.urgH2Vis === 0),
    mid1120PadT,
    unsafeAlone,
  };
  fs.writeFileSync(path.join(out, "gap37.json"), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  server.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
