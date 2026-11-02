const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../../src");
const out = __dirname;
const PORT = 9134;

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

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch({ headless: true });

  // Accurate hero anatomy @1280
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const hero = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const visH = (el) => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return +(Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0))).toFixed(1);
    };
    const frame = q(".look--hero .hero-frame");
    const img = q(".look--hero .hero-frame img") || q(".look--hero img.hero-plate") || q(".look--hero img");
    const process = q(".process-link");
    const cta = q(".look--hero .cta-trial");
    const lede = [...q(".look--hero").querySelectorAll("p")].find((p) => !p.closest(".brand"));
    const validation = q(".look--hero .validation, .look--hero .ice-word, .look--hero span.ice");
    const h1 = q(".look--hero h1");
    const brand = q(".brand-mark, .site-brand, .look--hero .brand");
    const imgR = img?.getBoundingClientRect();
    const procR = process?.getBoundingClientRect();
    const ctaR = cta?.getBoundingClientRect();
    const ledeR = lede?.getBoundingClientRect();
    // desk = portion of hero image below fold line / process
    return {
      imgSel: img?.className || img?.tagName,
      imgTop: imgR ? +imgR.top.toFixed(1) : null,
      imgBottom: imgR ? +imgR.bottom.toFixed(1) : null,
      imgVisibleH: visH(img),
      deskBelowProcess: imgR && procR ? +Math.max(0, Math.min(imgR.bottom, innerHeight) - Math.max(imgR.top, procR.bottom)).toFixed(1) : null,
      procDesk: imgR && procR ? +(imgR.top - procR.bottom).toFixed(1) : null,
      ledeCta: ledeR && ctaR ? +(ctaR.top - ledeR.bottom).toFixed(1) : null,
      ctaProc: ctaR && procR ? +(procR.top - ctaR.bottom).toFixed(1) : null,
      ctaYPct: ctaR ? +(((ctaR.top + ctaR.height / 2) / innerHeight) * 100).toFixed(1) : null,
      procYPct: procR ? +(((procR.top + procR.height / 2) / innerHeight) * 100).toFixed(1) : null,
      validationText: validation?.textContent?.trim() || h1?.innerHTML?.includes("Validation") || null,
      h1Html: h1?.innerHTML?.slice(0, 120),
      brandOk: !!document.body.innerText.match(/Bloombal/),
      frameTransform: frame ? getComputedStyle(frame).transform : null,
      frameClasses: frame?.className,
    };
  });

  // Gap anatomy @1280 process land
  await page.click(".process-link");
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(out, "capture-d1280-process-land-gap.png") });
  const anatomy = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const lms = q(".mechanism-lms");
    const demo = q(".demo-frame");
    const band = q(".demo-band");
    const firstInner = q(".look--solution .look-inner:not(.look-inner--after-demo)");
    const lmsR = lms.getBoundingClientRect();
    const demoR = demo.getBoundingClientRect();
    const bandR = band.getBoundingClientRect();
    const lmsCs = getComputedStyle(lms);
    const firstCs = getComputedStyle(firstInner);
    const bandCs = getComputedStyle(band);
    const demoCs = getComputedStyle(demo);
    // Children between lms and demo?
    const solution = q(".look--solution");
    const between = [];
    let walk = lms.nextElementSibling;
    while (walk && walk !== band && !walk.contains(band)) {
      between.push({
        tag: walk.tagName,
        className: walk.className,
        h: +walk.getBoundingClientRect().height.toFixed(1),
        mt: getComputedStyle(walk).marginTop,
        mb: getComputedStyle(walk).marginBottom,
      });
      walk = walk.nextElementSibling;
      if (between.length > 8) break;
    }
    // If band is descendant of firstInner, measure padding bottom contribution
    return {
      lmsToDemo: +(demoR.top - lmsR.bottom).toFixed(1),
      lmsMb: lmsCs.marginBottom,
      lmsMbPx: parseFloat(lmsCs.marginBottom),
      firstInnerPb: firstCs.paddingBottom,
      firstInnerPbPx: parseFloat(firstCs.paddingBottom),
      firstInnerMb: firstCs.marginBottom,
      bandMt: bandCs.marginTop,
      demoMt: demoCs.marginTop,
      bandTopVsLmsBottom: +(bandR.top - lmsR.bottom).toFixed(1),
      demoTopVsBandTop: +(demoR.top - bandR.top).toFixed(1),
      sumParts: +(parseFloat(lmsCs.marginBottom) + parseFloat(firstCs.paddingBottom)).toFixed(1),
      residual:
        +(
          demoR.top -
          lmsR.bottom -
          parseFloat(lmsCs.marginBottom) -
          parseFloat(firstCs.paddingBottom)
        ).toFixed(1),
      between,
      bandClass: band.className,
      transform: bandCs.transform,
      // Interest bleed geometry
      interest: (() => {
        const p = q(".look--copy p").getBoundingClientRect();
        const h2 = q(".look--copy h2").getBoundingClientRect();
        const sol = q("#solution-title").getBoundingClientRect();
        const copy = q(".look--copy").getBoundingClientRect();
        return {
          pVis: +(Math.max(0, Math.min(p.bottom, innerHeight) - Math.max(p.top, 0))).toFixed(1),
          h2Vis: +(Math.max(0, Math.min(h2.bottom, innerHeight) - Math.max(h2.top, 0))).toFixed(1),
          copyBottom: +copy.bottom.toFixed(1),
          solTop: +sol.top.toFixed(1),
          copyToSol: +(sol.top - copy.bottom).toFixed(1),
          pBottom: +p.bottom.toFixed(1),
          scrollY: +window.scrollY.toFixed(1),
          solutionScrollMargin: getComputedStyle(q("#solution")).scrollMarginTop,
          problemScrollMargin: getComputedStyle(q("#problem")).scrollMarginTop,
        };
      })(),
    };
  });

  // Glyph measures for Desire bodies
  const glyphs = await page.evaluate(() => {
    const measure = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const cs = getComputedStyle(el);
      const br = el.getBoundingClientRect();
      const s = document.createElement("span");
      s.textContent = "abcdefghijklmnopqrstuvwxyz";
      s.style.cssText = `font:${cs.font};position:absolute;visibility:hidden;white-space:nowrap`;
      document.body.appendChild(s);
      const chPx = s.getBoundingClientRect().width / 26;
      s.remove();
      return {
        glyphCh: +(br.width / chPx).toFixed(1),
        cssMaxW: cs.maxWidth,
        fw: cs.fontWeight,
        fs: cs.fontSize,
      };
    };
    return {
      interest: measure(".look--copy p"),
      mech: measure(".mechanism"),
      lms: measure(".mechanism-lms"),
      urg: measure("#urgency p"),
    };
  });

  // Interest bleed: what non-pad levers exist?
  // Probe: if we temporarily change scroll-margin only (virtual)
  const bleedProbe = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const vis = (el) => {
      const b = el.getBoundingClientRect();
      return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    };
    const baseline = {
      interestPVis: +vis(q(".look--copy p")).toFixed(1),
      optical: (() => {
        const t = q("#solution-title").getBoundingClientRect();
        return +(t.top + t.height / 2 - innerHeight / 2).toFixed(1);
      })(),
      claimShare: (() => {
        const title = q("#solution-title").getBoundingClientRect();
        const lms = q(".mechanism-lms").getBoundingClientRect();
        const demo = q(".demo-frame").getBoundingClientRect();
        return +(((Math.min(lms.bottom, demo.top) - title.top) / innerHeight) * 100).toFixed(1);
      })(),
      scrollMargin: getComputedStyle(q("#solution")).scrollMarginTop,
    };
    // Simulate larger scroll-margin by scrolling up so title sits higher (more negative optical)
    // Actually: process-link uses scrollIntoView / hash — check how process-link scrolls
    return { baseline, processHref: q(".process-link")?.getAttribute("href") };
  });

  // Mid desktop gap anatomy
  const p1120 = await browser.newPage({ viewport: { width: 1120, height: 720 } });
  await p1120.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  await p1120.click(".process-link");
  await p1120.waitForTimeout(600);
  await p1120.screenshot({ path: path.join(out, "capture-w1120-process-land-gap.png") });
  const anatomy1120 = await p1120.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const lms = q(".mechanism-lms");
    const demo = q(".demo-frame");
    const firstInner = q(".look--solution .look-inner:not(.look-inner--after-demo)");
    const lmsR = lms.getBoundingClientRect();
    const demoR = demo.getBoundingClientRect();
    return {
      lmsToDemo: +(demoR.top - lmsR.bottom).toFixed(1),
      lmsMb: getComputedStyle(lms).marginBottom,
      firstInnerPb: getComputedStyle(firstInner).paddingBottom,
      sum: +(parseFloat(getComputedStyle(lms).marginBottom) + parseFloat(getComputedStyle(firstInner).paddingBottom)).toFixed(1),
      demoVis: +(Math.max(0, Math.min(demoR.bottom, innerHeight) - Math.max(demoR.top, 0))).toFixed(1),
      claimShare: (() => {
        const title = q("#solution-title").getBoundingClientRect();
        const lmsB = q(".mechanism-lms").getBoundingClientRect();
        return +(((Math.min(lmsB.bottom, demoR.top) - title.top) / innerHeight) * 100).toFixed(1);
      })(),
    };
  });
  await p1120.close();

  // Type ladder
  const ladder = await page.evaluate(() => {
    const fs = (s) => parseFloat(getComputedStyle(document.querySelector(s)).fontSize);
    return {
      problem: fs(".look--copy h2"),
      solution: fs("#solution-title"),
      footer: fs(".look--footer h2"),
      urgency: fs("#urgency h2"),
      partners: fs("#partners h2"),
    };
  });

  // Proof settle fires?
  await page.evaluate(() => {
    const el = document.querySelector(".look--proof");
    const y = el.getBoundingClientRect().top + window.scrollY - innerHeight * 0.4;
    window.scrollTo(0, Math.max(0, y));
  });
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(out, "capture-d1280-proof-grain.png") });
  const proofMotion = await page.evaluate(() => {
    const el = document.querySelector(".look--proof");
    return {
      className: el.className,
      innerTransform: getComputedStyle(el.querySelector(".look-inner")).transform,
    };
  });

  // Interest→Desire bleed: scroll-margin sensitivity (non-destructive virtual scroll)
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  await page.click(".process-link");
  await page.waitForTimeout(500);
  const bleedSweep = [];
  for (const dy of [0, -40, -80, -120, -160]) {
    await page.evaluate((dy) => {
      // re-land then nudge
      const sol = document.querySelector("#solution");
      const top = sol.getBoundingClientRect().top + window.scrollY;
      // process-link typically lands with scroll-margin; measure current then offset
      window.scrollTo(0, window.scrollY + dy);
    }, dy === 0 ? 0 : dy - (bleedSweep.length ? bleedSweep[bleedSweep.length - 1].dy : 0));
    // simpler: absolute land then offset from natural
    if (dy === 0) {
      // already at process land
    } else {
      await page.evaluate(() => document.querySelector(".process-link").click());
      await page.waitForTimeout(400);
      await page.evaluate((dy) => window.scrollBy(0, dy), dy);
      await page.waitForTimeout(100);
    }
    const m = await page.evaluate((dy) => {
      const q = (s) => document.querySelector(s);
      const vis = (el) => {
        const b = el.getBoundingClientRect();
        return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
      };
      const title = q("#solution-title").getBoundingClientRect();
      const lms = q(".mechanism-lms").getBoundingClientRect();
      const demo = q(".demo-frame").getBoundingClientRect();
      return {
        dy,
        interestPVis: +vis(q(".look--copy p")).toFixed(1),
        optical: +(title.top + title.height / 2 - innerHeight / 2).toFixed(1),
        claimShare: +(((Math.min(lms.bottom, demo.top) - title.top) / innerHeight) * 100).toFixed(1),
        demoVis: +vis(q(".demo-frame")).toFixed(1),
        lmsToDemo: +(demo.top - lms.bottom).toFixed(1),
      };
    }, dy);
    bleedSweep.push(m);
    // reset to process land for next absolute offset
    await page.click(".process-link");
    await page.waitForTimeout(400);
  }

  const result = {
    hero,
    anatomy1280: anatomy,
    anatomy1120,
    glyphs,
    bleedProbe,
    bleedSweep,
    ladder,
    proofMotion,
    unpaidFocus: {
      lmsFloorBreach1280: anatomy.lmsToDemo < 40,
      lmsFloorDelta: +(40 - anatomy.lmsToDemo).toFixed(1),
      softOver1120: anatomy1120.lmsToDemo > 48,
      interestBleed: anatomy.interest.pVis,
      demoVisPrefer120Short: +(120 - 117.4).toFixed(1),
    },
  };
  fs.writeFileSync(path.join(out, "gap34.json"), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  server.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
