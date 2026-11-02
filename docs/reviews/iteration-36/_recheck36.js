const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../../src");
const out = __dirname;
const PORT = 9336;

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
  if (!fp.startsWith(root) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
    res.writeHead(404);
    res.end("no");
    return;
  }
  res.writeHead(200);
  fs.createReadStream(fp).pipe(res);
});

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch({ headless: true });
  const result = {};

  for (const w of [1280, 1120, 390]) {
    const h = w === 390 ? 844 : 720;
    const p = await browser.newPage({ viewport: { width: w, height: h } });
    await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
    await p.click(".process-link");
    await p.waitForTimeout(600);
    result["w" + w] = await p.evaluate(() => {
      const q = (s) => document.querySelector(s);
      const vis = (el) => {
        if (!el) return 0;
        const b = el.getBoundingClientRect();
        return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
      };
      const title = q("#solution-title").getBoundingClientRect();
      const lms = q(".mechanism-lms").getBoundingClientRect();
      const demo = q(".demo-frame").getBoundingClientRect();
      const pEl = q(".look--copy p");
      const pR = pEl.getBoundingClientRect();
      return {
        interestPVis: +vis(pEl).toFixed(1),
        interestH2Vis: +vis(q(".look--copy h2")).toFixed(1),
        interestFieldVis: +vis(q(".look--copy")).toFixed(1),
        pH: +pR.height.toFixed(1),
        pBottom: +pR.bottom.toFixed(1),
        copyPadB: getComputedStyle(q(".look--copy .look-inner")).paddingBottom,
        optical: +(title.top + title.height / 2 - innerHeight / 2).toFixed(1),
        claimShare: +(((Math.min(lms.bottom, demo.top) - title.top) / innerHeight) * 100).toFixed(1),
        demoVis: +vis(q(".demo-frame")).toFixed(1),
        lmsToDemo: +(demo.top - lms.bottom).toFixed(1),
        titleLines: Math.round(
          title.height / parseFloat(getComputedStyle(q("#solution-title")).lineHeight)
        ),
        isIn: /\bis-in\b/.test(q(".demo-band").className),
      };
    });

    if (w === 1120) {
      const sweep = [];
      for (const pb of [12, 12.5, 13, 13.5, 14, 14.5, 15, 16]) {
        await p.evaluate((pb) => {
          document
            .querySelector(".look--copy .look-inner")
            .style.setProperty("padding-bottom", `${pb}rem`, "important");
        }, pb);
        await p.click(".process-link");
        await p.waitForTimeout(550);
        sweep.push(
          await p.evaluate((pb) => {
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
              pH: +q(".look--copy p").getBoundingClientRect().height.toFixed(1),
              optical: +(title.top + title.height / 2 - innerHeight / 2).toFixed(1),
              claimShare: +(
                ((Math.min(lms.bottom, demo.top) - title.top) / innerHeight) *
                100
              ).toFixed(1),
              demoVis: +vis(q(".demo-frame")).toFixed(1),
              lmsToDemo: +(demo.top - lms.bottom).toFixed(1),
              isIn: /\bis-in\b/.test(q(".demo-band").className),
            };
          }, pb)
        );
      }
      result.sweep1120 = sweep;
    }
    await p.close();
  }

  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  const mid = [];
  for (const pb of [11, 12, 13.75, 15, 16]) {
    await page.evaluate((pb) => {
      document
        .querySelector(".look-inner--after-demo")
        .style.setProperty("padding-bottom", `${pb}rem`, "important");
    }, pb);
    await page.evaluate(() =>
      document.querySelector(".look-inner--after-demo").scrollIntoView({ block: "center" })
    );
    await page.waitForTimeout(200);
    mid.push(
      await page.evaluate((pb) => {
        const q = (s) => document.querySelector(s);
        const vis = (el) => {
          if (!el) return 0;
          const b = el.getBoundingClientRect();
          return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
        };
        const cta = q(".look-inner--after-demo .cta-trial").getBoundingClientRect();
        const demo = q(".demo-frame").getBoundingClientRect();
        return {
          pb,
          urgH2Vis: +vis(q("#urgency h2")).toFixed(1),
          storyVis: +vis(q(".look--story")).toFixed(1),
          gapDemoToCta: +(cta.top - demo.bottom).toFixed(1),
        };
      }, pb)
    );
  }
  result.mid = mid;

  // mobile padB sweep
  const mob = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mob.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  const mobSweep = [];
  for (const pb of [10.5, 12, 13, 14, 15, 16]) {
    await mob.evaluate((pb) => {
      document
        .querySelector(".look--copy .look-inner")
        .style.setProperty("padding-bottom", `${pb}rem`, "important");
    }, pb);
    await mob.click(".process-link");
    await mob.waitForTimeout(500);
    mobSweep.push(
      await mob.evaluate((pb) => {
        const q = (s) => document.querySelector(s);
        const vis = (el) => {
          if (!el) return 0;
          const b = el.getBoundingClientRect();
          return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
        };
        return {
          pb,
          interestPVis: +vis(q(".look--copy p")).toFixed(1),
          interestH2Vis: +vis(q(".look--copy h2")).toFixed(1),
          solTitleVis: +vis(q("#solution-title")).toFixed(1),
        };
      }, pb)
    );
  }
  result.mobSweep = mobSweep;
  await mob.close();

  fs.writeFileSync(path.join(out, "recheck36.json"), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  server.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
