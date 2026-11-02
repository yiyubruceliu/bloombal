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
  await new Promise((r) => server.listen(8125, r));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto("http://127.0.0.1:8125/", { waitUntil: "networkidle" });

  // Precise play vs diagram regions (poster is process-still)
  await page.evaluate(() =>
    document.querySelector(".demo-band").scrollIntoView({ block: "center" })
  );
  const playPrecise = await page.evaluate(() => {
    const play = document.querySelector(".demo-play").getBoundingClientRect();
    const v = document.querySelector(".demo-video").getBoundingClientRect();
    // Approximate label boxes from process diagram geometry (fractions of video)
    const zones = {
      studentIcon: {
        t: v.top + v.height * 0.28,
        b: v.top + v.height * 0.72,
        l: v.left + v.width * 0.02,
        r: v.left + v.width * 0.22,
      },
      oralLabel: {
        t: v.top + v.height * 0.55,
        b: v.top + v.height * 0.78,
        l: v.left + v.width * 0.32,
        r: v.left + v.width * 0.68,
      },
      factor2Arrow: {
        t: v.top + v.height * 0.55,
        b: v.top + v.height * 0.78,
        l: v.left + v.width * 0.18,
        r: v.left + v.width * 0.38,
      },
      bottomLeftCorner: {
        t: v.top + v.height * 0.78,
        b: v.bottom,
        l: v.left,
        r: v.left + v.width * 0.28,
      },
    };
    const overlap = (z) => {
      const ox = Math.max(0, Math.min(play.right, z.r) - Math.max(play.left, z.l));
      const oy = Math.max(0, Math.min(play.bottom, z.b) - Math.max(play.top, z.t));
      return +(ox * oy).toFixed(1);
    };
    return {
      play: {
        l: +((play.left - v.left) / v.width * 100).toFixed(1),
        b: +((v.bottom - play.bottom) / v.height * 100).toFixed(1),
        t: +((play.top - v.top) / v.height * 100).toFixed(1),
        wPct: +((play.width / v.width) * 100).toFixed(1),
        hPct: +((play.height / v.height) * 100).toFixed(1),
      },
      overlaps: Object.fromEntries(Object.entries(zones).map(([k, z]) => [k, overlap(z)])),
      playInkMatchesCta:
        getComputedStyle(document.querySelector(".demo-play")).backgroundColor ===
        getComputedStyle(document.querySelector(".look-inner--after-demo .cta-trial"))
          .backgroundColor,
    };
  });

  // Mid CTA frame collision budget — how much more pad needed
  await page.evaluate(() =>
    document.querySelector(".look-inner--after-demo").scrollIntoView({ block: "center" })
  );
  const collision = await page.evaluate(() => {
    const cta = document.querySelector(".look-inner--after-demo .cta-trial").getBoundingClientRect();
    const urg = document.querySelector("#urgency h2").getBoundingClientRect();
    const urgSec = document.querySelector("#urgency").getBoundingClientRect();
    const partners = document.querySelector("#partners").getBoundingClientRect();
    const after = document.querySelector(".look-inner--after-demo");
    const story = document.querySelector(".look--story .look-inner");
    const proof = document.querySelector(".look--proof .look-inner");
    return {
      ctaBottom: +cta.bottom.toFixed(1),
      urgTop: +urg.top.toFixed(1),
      gapCtaToUrg: +(urg.top - cta.bottom).toFixed(1),
      urgH2Vis: Math.max(0, Math.min(urg.bottom, innerHeight) - Math.max(urg.top, 0)),
      urgSecVis: Math.max(0, Math.min(urgSec.bottom, innerHeight) - Math.max(urgSec.top, 0)),
      partnersVis: Math.max(0, Math.min(partners.bottom, innerHeight) - Math.max(partners.top, 0)),
      afterPadB: getComputedStyle(after).paddingBottom,
      afterPadT: getComputedStyle(after).paddingTop,
      storyPadT: getComputedStyle(story).paddingTop,
      storyPadB: getComputedStyle(story).paddingBottom,
      proofPadT: getComputedStyle(proof).paddingTop,
      proofPadB: getComputedStyle(proof).paddingBottom,
      neededCutForUrgZero: Math.max(
        0,
        Math.min(urg.bottom, innerHeight) - Math.max(urg.top, 0)
      ),
      // if we push urgency below fold by increasing gap
      gapNeededForZeroUrg: Math.max(0, innerHeight - cta.bottom),
    };
  });

  // Index honesty through Consequence
  const indexHonesty = [];
  for (const [label, sel, block] of [
    ["solutionStart", "#solution", "start"],
    ["demoCenter", ".demo-band", "center"],
    ["afterDemoCenter", ".look-inner--after-demo", "center"],
    ["urgencyCenter", "#urgency", "center"],
    ["urgencyStart", "#urgency", "start"],
    ["partnersCenter", "#partners", "center"],
    ["contactStart", "#contact", "start"],
  ]) {
    await page.evaluate(
      ({ sel, block }) => {
        document.querySelector(sel).scrollIntoView({ block });
      },
      { sel, block }
    );
    await page.waitForTimeout(120);
    indexHonesty.push(
      await page.evaluate((label) => {
        const nav = document.querySelector(".look-indices");
        const sol = document.querySelector("#solution");
        const y = scrollY + innerHeight * 0.35;
        const solBottom = sol.offsetTop + sol.offsetHeight;
        return {
          label,
          active: document.querySelector(".look-index.is-active")?.textContent?.trim() || null,
          isPast: nav.classList.contains("is-past"),
          isOverFooter: nav.classList.contains("is-over-footer"),
          op: getComputedStyle(nav).opacity,
          y: +y.toFixed(1),
          solBottom: +solBottom.toFixed(1),
          yPastSol: y >= solBottom,
          urgVis: (() => {
            const b = document.querySelector("#urgency").getBoundingClientRect();
            return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
          })(),
        };
      }, label)
    );
  }

  // Interest optical + void
  await page.evaluate(() => {
    document.querySelector("#problem").scrollIntoView({ block: "start" });
  });
  await page.waitForTimeout(400);
  const interest = await page.evaluate(() => {
    const h2 = document.querySelector("#problem-title").getBoundingClientRect();
    const p = document.querySelector("#problem .look-inner p").getBoundingClientRect();
    const sec = document.querySelector("#problem").getBoundingClientRect();
    const next = document.querySelector("#solution").getBoundingClientRect();
    const inner = document.querySelector("#problem .look-inner");
    const cs = getComputedStyle(inner);
    return {
      titleOptical: +(h2.top + h2.height / 2 - innerHeight / 2).toFixed(1),
      titleT: +h2.top.toFixed(1),
      bodyVis: Math.max(0, Math.min(p.bottom, innerHeight) - Math.max(p.top, 0)),
      emptyBelowBody: Math.max(0, Math.min(next.top, innerHeight) - p.bottom),
      secH: +sec.height.toFixed(1),
      padT: parseFloat(cs.paddingTop),
      padB: parseFloat(cs.paddingBottom),
      scrollMargin: getComputedStyle(document.querySelector("#problem")).scrollMarginTop,
      // to centre title: need title cy ≈ 360; currently cy = titleOptical + 360
      shiftDownNeeded: +(innerHeight / 2 - (h2.top + h2.height / 2)).toFixed(1),
    };
  });

  // Partners isolation remeasure with strip cy at 360
  await page.evaluate(() =>
    document.querySelector(".partner-strip").scrollIntoView({ block: "center" })
  );
  await page.waitForTimeout(100);
  const partnersIso = await page.evaluate(() => {
    const vis = (el) => {
      if (!el) return 0;
      const b = el.getBoundingClientRect();
      return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    };
    const strip = document.querySelector(".partner-strip").getBoundingClientRect();
    return {
      stripCy: +(strip.top + strip.height / 2).toFixed(1),
      urgH2: vis(document.querySelector("#urgency h2")),
      urgSec: vis(document.querySelector("#urgency")),
      partners: vis(document.querySelector("#partners")),
      contactH2: vis(document.querySelector("#contact h2")),
      contactCta: vis(document.querySelector("#contact .cta-trial")),
      contactSec: vis(document.querySelector("#contact")),
      proofPadT: parseFloat(getComputedStyle(document.querySelector(".look--proof .look-inner")).paddingTop),
      proofPadB: parseFloat(getComputedStyle(document.querySelector(".look--proof .look-inner")).paddingBottom),
      storyPadB: parseFloat(getComputedStyle(document.querySelector(".look--story .look-inner")).paddingBottom),
      partnersH: +document.querySelector("#partners").getBoundingClientRect().height.toFixed(1),
      urgencyH: +document.querySelector("#urgency").getBoundingClientRect().height.toFixed(1),
    };
  });

  // Mid-width Desire entry detail
  await page.setViewportSize({ width: 1120, height: 720 });
  await page.goto("http://127.0.0.1:8125/", { waitUntil: "networkidle" });
  await page.click(".process-link");
  await page.waitForTimeout(900);
  const w1120 = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const vis = (el) => {
      const b = el.getBoundingClientRect();
      return {
        t: +b.top.toFixed(1),
        b: +b.bottom.toFixed(1),
        vis: Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0)),
        h: +b.height.toFixed(1),
      };
    };
    const title = q("#solution-title");
    const lh = parseFloat(getComputedStyle(title).lineHeight);
    return {
      title: vis(title),
      titleLines: Math.round(title.getBoundingClientRect().height / lh),
      titleLineH: lh,
      visibleLinesApprox: +(vis(title).vis / lh).toFixed(2),
      mech: vis(q(".mechanism")),
      lms: vis(q(".mechanism-lms")),
      demo: vis(q(".demo-band")),
      scrollMargin: getComputedStyle(q("#solution")).scrollMarginTop,
      claimTop: +title.getBoundingClientRect().top.toFixed(1),
      // how much title is clipped above
      titleClippedAbove: Math.max(0, -title.getBoundingClientRect().top),
    };
  });

  // Texture: consecutive section border-tops / bone sameness
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("http://127.0.0.1:8125/", { waitUntil: "networkidle" });
  const texture = await page.evaluate(() => {
    const sels = [
      ".look--hero",
      ".look--copy",
      ".look--solution",
      ".look--story",
      ".look--proof",
      ".look--footer",
    ];
    return sels.map((s) => {
      const el = document.querySelector(s);
      const cs = getComputedStyle(el);
      return {
        s,
        bg: cs.backgroundColor,
        borderTop: cs.borderTop,
        h: +el.getBoundingClientRect().height.toFixed(1),
      };
    });
  });

  console.log(
    JSON.stringify(
      { playPrecise, collision, indexHonesty, interest, partnersIso, w1120, texture },
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
