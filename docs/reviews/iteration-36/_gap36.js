const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../../src");
const out = __dirname;
const PORT = 9236;

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

  // Raise after-demo padB to restore mid isolation
  const midUp = [];
  for (const pb of [11, 12, 13, 13.75, 14.5, 15, 16, 17, 18]) {
    await page.evaluate((pb) => {
      document
        .querySelector(".look-inner--after-demo")
        .style.setProperty("padding-bottom", `${pb}rem`, "important");
    }, pb);
    await page.evaluate(() =>
      document.querySelector(".look-inner--after-demo").scrollIntoView({ block: "center" })
    );
    await page.waitForTimeout(200);
    midUp.push(
      await page.evaluate((pb) => {
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
          afterH: +q(".look-inner--after-demo").getBoundingClientRect().height.toFixed(1),
        };
      }, pb)
    );
  }
  await page.evaluate(() => {
    document.querySelector(".look-inner--after-demo").style.removeProperty("padding-bottom");
  });

  // @1120 Interest padB up to clear body
  const p1120 = await browser.newPage({ viewport: { width: 1120, height: 720 } });
  await p1120.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  const pad1120 = [];
  for (const pb of [12, 13, 14, 15, 16, 17, 18]) {
    await p1120.evaluate((pb) => {
      document
        .querySelector(".look--copy .look-inner")
        .style.setProperty("padding-bottom", `${pb}rem`, "important");
    }, pb);
    await p1120.click(".process-link");
    await p1120.waitForTimeout(450);
    pad1120.push(
      await p1120.evaluate((pb) => {
        const q = (s) => document.querySelector(s);
        const vis = (el) => {
          if (!el) return 0;
          const b = el.getBoundingClientRect();
          return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
        };
        const title = q("#solution-title").getBoundingClientRect();
        const lms = q(".mechanism-lms").getBoundingClientRect();
        const demo = q(".demo-frame").getBoundingClientRect();
        return {
          pb,
          interestPVis: +vis(q(".look--copy p")).toFixed(1),
          interestH2Vis: +vis(q(".look--copy h2")).toFixed(1),
          interestFieldVis: +vis(q(".look--copy")).toFixed(1),
          optical: +(title.top + title.height / 2 - innerHeight / 2).toFixed(1),
          claimShare: +(((Math.min(lms.bottom, demo.top) - title.top) / innerHeight) * 100).toFixed(
            1
          ),
          demoVis: +vis(q(".demo-frame")).toFixed(1),
          lmsToDemo: +(demo.top - lms.bottom).toFixed(1),
          titleLines: Math.round(
            title.height / parseFloat(getComputedStyle(q("#solution-title")).lineHeight)
          ),
          isIn: /\bis-in\b/.test(q(".demo-band").className),
        };
      }, pb)
    );
  }
  await p1120.evaluate(() => {
    document.querySelector(".look--copy .look-inner").style.removeProperty("padding-bottom");
  });
  await p1120.click(".process-link");
  await p1120.waitForTimeout(450);
  await p1120.screenshot({ path: path.join(out, "capture-w1120-process-land.png") });
  await p1120.close();

  // Demo matte trim sweep — reduce frame padding-top while holding dual-gate
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  const matteTrim = [];
  for (const pt of ["2.75rem", "2rem", "1.5rem", "1.25rem", "1rem", "0.75rem"]) {
    await page.evaluate((pt) => {
      const frame = document.querySelector(".demo-frame");
      frame.style.setProperty("padding", `${pt} 0.75rem 0.75rem`, "important");
    }, pt);
    await page.click(".process-link");
    await page.waitForTimeout(450);
    matteTrim.push(
      await page.evaluate((pt) => {
        const q = (s) => document.querySelector(s);
        const vis = (el) => {
          if (!el) return 0;
          const b = el.getBoundingClientRect();
          return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
        };
        const frame = q(".demo-frame");
        const video = q(".demo-frame video") || q(".demo-video");
        const play = [...document.querySelectorAll("a,button")].find((el) =>
          /view process/i.test(el.textContent || "")
        );
        const fr = frame.getBoundingClientRect();
        const vr = video.getBoundingClientRect();
        const pr = play?.getBoundingClientRect();
        const title = q("#solution-title").getBoundingClientRect();
        const lms = q(".mechanism-lms").getBoundingClientRect();
        const demo = fr;
        return {
          pt,
          chromeAbove: +(vr.top - fr.top).toFixed(1),
          mattePct: +(((fr.height - vr.height) / fr.height) * 100).toFixed(1),
          demoVis: +vis(frame).toFixed(1),
          videoVis: +vis(video).toFixed(1),
          videoShare: +((vis(video) / Math.max(1, vis(frame))) * 100).toFixed(1),
          playInMatte: pr ? pr.bottom <= vr.top + 4 : null,
          playClearVideo: pr
            ? pr.bottom < vr.top ||
              pr.top > vr.bottom ||
              pr.right < vr.left ||
              pr.left > vr.right
            : null,
          oralOverlap: (() => {
            if (!pr) return 0;
            const oral = {
              left: vr.left + vr.width * 0.25,
              right: vr.left + vr.width * 0.75,
              top: vr.top + vr.height * 0.2,
              bottom: vr.top + vr.height * 0.8,
            };
            const ox = Math.max(0, Math.min(pr.right, oral.right) - Math.max(pr.left, oral.left));
            const oy = Math.max(0, Math.min(pr.bottom, oral.bottom) - Math.max(pr.top, oral.top));
            return +(ox * oy).toFixed(1);
          })(),
          optical: +(title.top + title.height / 2 - innerHeight / 2).toFixed(1),
          lmsToDemo: +(demo.top - lms.bottom).toFixed(1),
          claimShare: +(((Math.min(lms.bottom, demo.top) - title.top) / innerHeight) * 100).toFixed(
            1
          ),
          isIn: /\bis-in\b/.test(q(".demo-band").className),
        };
      }, pt)
    );
  }
  await page.evaluate(() => {
    document.querySelector(".demo-frame").style.removeProperty("padding");
  });
  await page.click(".process-link");
  await page.waitForTimeout(450);
  await page.screenshot({ path: path.join(out, "capture-d1280-demo-chrome.png") });

  // Mobile narrow process land + padB
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
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
      solTitleVis: +vis(q("#solution-title")).toFixed(1),
      copyPadB: getComputedStyle(q(".look--copy .look-inner")).paddingBottom,
      titleText: (q("#solution-title")?.textContent || "").slice(0, 40),
    };
  });
  await mobile.close();

  // Interest field → bone: does optical/hash change?
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    document
      .querySelector(".look--copy")
      .style.setProperty("background-color", "var(--bone)", "important");
  });
  await page.click(".process-link");
  await page.waitForTimeout(450);
  await page.screenshot({ path: path.join(out, "capture-d1280-field-bone.png") });
  const boneBridgeLand = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const vis = (el) => {
      if (!el) return 0;
      const b = el.getBoundingClientRect();
      return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    };
    return {
      interestFieldVis: +vis(q(".look--copy")).toFixed(1),
      interestPVis: +vis(q(".look--copy p")).toFixed(1),
      copyField: getComputedStyle(q(".look--copy")).backgroundColor,
      solutionField: getComputedStyle(q(".look--solution")).backgroundColor,
    };
  });
  await page.goto(`http://127.0.0.1:${PORT}/#problem`, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    document
      .querySelector(".look--copy")
      .style.setProperty("background-color", "var(--bone)", "important");
  });
  const boneBridgeHash = await page.evaluate(() => {
    const h2 = document.querySelector(".look--copy h2").getBoundingClientRect();
    return {
      optical: +(h2.top + h2.height / 2 - innerHeight / 2).toFixed(1),
      field: getComputedStyle(document.querySelector(".look--copy")).backgroundColor,
      grain: getComputedStyle(document.querySelector(".look--copy"), "::before").opacity,
    };
  });

  const result = {
    midUp,
    pad1120,
    matteTrim,
    mobileLand,
    boneBridgeLand,
    boneBridgeHash,
    recommendation: {
      midRestorePb: midUp.find((m) => m.urgH2Vis === 0 && m.storyVis <= 200)?.pb || null,
      midZeroUrg: midUp.filter((m) => m.urgH2Vis === 0).map((m) => ({ pb: m.pb, storyVis: m.storyVis })),
      midBestStory: [...midUp].sort((a, b) => a.storyVis - b.storyVis)[0],
      pad1120Clear24: pad1120.find((m) => m.interestPVis <= 24),
      pad1120Clear12: pad1120.find((m) => m.interestPVis <= 12),
      matteSafe: matteTrim.filter(
        (m) =>
          m.lmsToDemo >= 40 &&
          m.lmsToDemo <= 48 &&
          m.demoVis >= 115 &&
          Math.abs(m.optical) <= 120 &&
          m.claimShare >= 40 &&
          m.oralOverlap === 0 &&
          m.playClearVideo
      ),
    },
  };

  fs.writeFileSync(path.join(out, "gap36.json"), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  server.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
