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
  if (!fp.startsWith(root) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
    res.writeHead(404);
    res.end("no");
    return;
  }
  fs.createReadStream(fp).pipe(res);
});

(async () => {
  await new Promise((r) => server.listen(8121, r));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto("http://127.0.0.1:8121/", { waitUntil: "networkidle" });

  await page.evaluate(() =>
    document.querySelector(".demo-band").scrollIntoView({ block: "center" })
  );
  const playMask = await page.evaluate(() => {
    const play = document.querySelector(".demo-play").getBoundingClientRect();
    const v = document.querySelector(".demo-video").getBoundingClientRect();
    const zones = {
      centerBand: {
        t: v.top + v.height * 0.35,
        b: v.top + v.height * 0.65,
        l: v.left + v.width * 0.25,
        r: v.left + v.width * 0.75,
      },
      oralLabelApprox: {
        t: v.top + v.height * 0.48,
        b: v.top + v.height * 0.62,
        l: v.left + v.width * 0.38,
        r: v.left + v.width * 0.62,
      },
    };
    const overlap = (z) => {
      const ox = Math.max(0, Math.min(play.right, z.r) - Math.max(play.left, z.l));
      const oy = Math.max(0, Math.min(play.bottom, z.b) - Math.max(play.top, z.t));
      return +(ox * oy).toFixed(1);
    };
    return {
      overlapCenter: overlap(zones.centerBand),
      overlapOralApprox: overlap(zones.oralLabelApprox),
      play: {
        t: +play.top.toFixed(1),
        b: +play.bottom.toFixed(1),
        cy: +(play.top + play.height / 2).toFixed(1),
      },
      videoCy: +(v.top + v.height / 2).toFixed(1),
    };
  });

  const footerGeom = await page.evaluate(() => {
    const f = document.querySelector("#contact");
    const b = f.getBoundingClientRect();
    return {
      offsetTop: f.offsetTop,
      height: f.offsetHeight,
      docH: document.documentElement.scrollHeight,
      maxScroll: document.documentElement.scrollHeight - innerHeight,
      hideNeedsY: f.offsetTop,
      yAtMaxScroll: document.documentElement.scrollHeight - innerHeight + innerHeight * 0.35,
      canEverHide:
        document.documentElement.scrollHeight - innerHeight + innerHeight * 0.35 >= f.offsetTop,
      footerFracOfViewport: +(f.offsetHeight / innerHeight).toFixed(2),
    };
  });

  const probes = [];
  for (const frac of [0.6, 0.4, 0.25, 0.1, 0, -0.2, -0.5]) {
    await page.evaluate((f) => {
      const el = document.querySelector("#contact");
      window.scrollTo(0, el.offsetTop - innerHeight * f);
    }, frac);
    await page.waitForTimeout(60);
    probes.push(
      await page.evaluate((f) => {
        const nav = document.querySelector(".look-indices");
        const h2 = document.querySelector("#contact h2").getBoundingClientRect();
        const y = scrollY + innerHeight * 0.35;
        return {
          f,
          over: nav.classList.contains("is-over-footer"),
          op: getComputedStyle(nav).opacity,
          h2t: +h2.top.toFixed(1),
          h2vis: Math.max(0, Math.min(h2.bottom, innerHeight) - Math.max(h2.top, 0)),
          y: +y.toFixed(1),
          foot: document.querySelector("#contact").offsetTop,
          scrollY: +scrollY.toFixed(1),
        };
      }, frac)
    );
  }

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(80);
  const atBottom = await page.evaluate(() => {
    const nav = document.querySelector(".look-indices");
    return {
      over: nav.classList.contains("is-over-footer"),
      op: getComputedStyle(nav).opacity,
      scrollY: +scrollY.toFixed(1),
      y: +(scrollY + innerHeight * 0.35).toFixed(1),
      foot: document.querySelector("#contact").offsetTop,
      footH: document.querySelector("#contact").offsetHeight,
    };
  });

  // story / after-demo gap budget
  await page.evaluate(() =>
    document.querySelector(".look-inner--after-demo").scrollIntoView({ block: "center" })
  );
  const collision = await page.evaluate(() => {
    const cta = document.querySelector(".look-inner--after-demo .cta-trial").getBoundingClientRect();
    const urg = document.querySelector("#urgency h2").getBoundingClientRect();
    const after = document.querySelector(".look-inner--after-demo");
    const story = document.querySelector(".look--story .look-inner");
    return {
      ctaBottom: +cta.bottom.toFixed(1),
      urgTop: +urg.top.toFixed(1),
      gapCtaToUrg: +(urg.top - cta.bottom).toFixed(1),
      urgVis: Math.max(0, Math.min(urg.bottom, innerHeight) - Math.max(urg.top, 0)),
      afterPadB: getComputedStyle(after).paddingBottom,
      storyPadT: getComputedStyle(story).paddingTop,
      neededExtraCutPx: Math.max(
        0,
        Math.min(urg.bottom, innerHeight) - Math.max(urg.top, 0)
      ),
    };
  });

  // Interest empty bone under body
  await page.click('a.look-index[href="#problem"]');
  await page.waitForTimeout(700);
  const interestVoid = await page.evaluate(() => {
    const p = document.querySelector("#problem .look-inner p").getBoundingClientRect();
    const next = document.querySelector("#solution").getBoundingClientRect();
    return {
      bodyBottom: +p.bottom.toFixed(1),
      emptyBelowBodyInViewport: Math.max(0, Math.min(next.top, innerHeight) - p.bottom),
      solutionTop: +next.top.toFixed(1),
      titleOptical: +(
        document.querySelector("#problem-title").getBoundingClientRect().top +
        document.querySelector("#problem-title").getBoundingClientRect().height / 2 -
        innerHeight / 2
      ).toFixed(1),
    };
  });

  console.log(
    JSON.stringify(
      { playMask, footerGeom, probes, atBottom, collision, interestVoid },
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
