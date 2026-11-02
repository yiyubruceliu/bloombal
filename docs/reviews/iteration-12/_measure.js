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

const box = (el) => {
  if (!el) return null;
  const b = el.getBoundingClientRect();
  return {
    t: +b.top.toFixed(1),
    b: +b.bottom.toFixed(1),
    l: +b.left.toFixed(1),
    r: +b.right.toFixed(1),
    w: +b.width.toFixed(1),
    h: +b.height.toFixed(1),
    cx: +(b.left + b.width / 2).toFixed(1),
  };
};

(async () => {
  await new Promise((r) => server.listen(8117, r));
  const browser = await chromium.launch({ headless: true });
  const metrics = {};
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const shot = (name) => page.screenshot({ path: path.join(out, name), fullPage: false });

  await page.goto("http://127.0.0.1:8117/", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await shot("capture-d1280-hero.png");
  metrics.hero1280 = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const box = (el) => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return {
        t: +b.top.toFixed(1),
        b: +b.bottom.toFixed(1),
        l: +b.left.toFixed(1),
        r: +b.right.toFixed(1),
        w: +b.width.toFixed(1),
        h: +b.height.toFixed(1),
        cx: +(b.left + b.width / 2).toFixed(1),
      };
    };
    const lede = box(q(".hero-lede"));
    const cta = box(q(".look--hero .cta-trial"));
    const proc = box(q(".process-link"));
    const desk = box(q(".hero-desk"));
    const val = box(q(".headline-validation"));
    const brand = box(q(".brand"));
    const idx = box(q(".look-indices"));
    const area = (el) => (el ? el.w * el.h : 0);
    const overlap = (a, b) => {
      if (!a || !b) return null;
      const x = Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l));
      const y = Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t));
      return +(x * y).toFixed(1);
    };
    return {
      lede,
      cta,
      proc,
      desk,
      val,
      brand,
      indices: idx,
      indicesPos: getComputedStyle(q(".look-indices")).position,
      indexRule: box(q(".index-rule")),
      indexRulePos: getComputedStyle(q(".index-rule")).position,
      ledeCtaGap: lede && cta ? +(cta.t - lede.b).toFixed(1) : null,
      ctaProcGap: cta && proc ? +(proc.t - cta.b).toFixed(1) : null,
      procDesk: desk && proc ? +(desk.t - proc.b).toFixed(1) : null,
      ctaMassRatio: val && cta ? +(area(cta) / area(val)).toFixed(2) : null,
      processHref: q(".process-link")?.getAttribute("href"),
      demoIdPresent: !!q("#demo"),
      brandIdxOverlap: overlap(brand, idx),
      headlineIdxOverlap: overlap(box(q(".headline-main")), idx),
      rightEmptyPct: +(((1280 - (brand?.r || 0)) / 1280) * 100).toFixed(1),
    };
  });

  // process → #solution
  await page.click(".process-link");
  await page.waitForTimeout(900);
  await shot("capture-d1280-after-process.png");
  metrics.afterProcess = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const vis = (el) => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return {
        t: +b.top.toFixed(1),
        b: +b.bottom.toFixed(1),
        l: +b.left.toFixed(1),
        visiblePx: Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0)),
        cx: +(b.left + b.width / 2).toFixed(1),
      };
    };
    return {
      scrollY: +scrollY.toFixed(1),
      hash: location.hash,
      title: vis(q("#solution-title")),
      mech: vis(q(".mechanism")),
      lms: vis(q(".mechanism-lms")),
      demo: vis(q(".demo-band")),
      midCta: vis(q(".look-inner--after-demo .cta-trial")),
      problem: vis(q("#problem")),
      activeIndex: document.querySelector(".look-index.is-active")?.textContent,
      claimStackH:
        q(".mechanism-lms") && q("#solution-title")
          ? +(
              q(".mechanism-lms").getBoundingClientRect().bottom -
              q("#solution-title").getBoundingClientRect().top
            ).toFixed(1)
          : null,
      evidenceInView: (vis(q(".demo-band"))?.visiblePx || 0) > 40,
    };
  });

  // #demo hash redirect
  await page.goto("http://127.0.0.1:8117/#demo", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await shot("capture-d1280-hash-demo.png");
  metrics.hashDemo = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const vis = (el) => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return {
        t: +b.top.toFixed(1),
        visiblePx: Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0)),
        above: b.bottom <= 0,
      };
    };
    return {
      hash: location.hash,
      scrollY: +scrollY.toFixed(1),
      title: vis(q("#solution-title")),
      mech: vis(q(".mechanism")),
      lms: vis(q(".mechanism-lms")),
      demo: vis(q(".demo-band")),
      demoId: !!q("#demo"),
    };
  });

  // Desire geometry
  await page.goto("http://127.0.0.1:8117/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.querySelector("#solution").scrollIntoView());
  await page.waitForTimeout(400);
  await shot("capture-d1280-solution.png");
  metrics.desire = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const box = (el) => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return {
        t: +b.top.toFixed(1),
        b: +b.bottom.toFixed(1),
        l: +b.left.toFixed(1),
        w: +b.width.toFixed(1),
        h: +b.height.toFixed(1),
        cx: +(b.left + b.width / 2).toFixed(1),
      };
    };
    const title = q("#solution-title");
    const demo = q(".demo-band");
    const inner = q(".look--solution > .look-inner");
    const cta = q(".look-inner--after-demo .cta-trial");
    const lms = q(".mechanism-lms");
    const mech = q(".mechanism");
    const idx = q(".look-indices");
    const tb = box(title);
    const db = box(demo);
    const ib = box(inner);
    const cb = box(cta);
    const lb = box(lms);
    const mb = box(mech);
    const ibx = box(idx);
    const overlapX = (a, b) => {
      if (!a || !b) return 0;
      return Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l));
    };
    const lh = parseFloat(getComputedStyle(title).lineHeight);
    return {
      title: tb,
      mech: mb,
      lms: lb,
      demo: db,
      inner: ib,
      cta: cb,
      indices: ibx,
      deltaTitleDemoLeft: tb && db ? +(db.l - tb.l).toFixed(1) : null,
      deltaTitleDemoCx: tb && db ? +(db.cx - tb.cx).toFixed(1) : null,
      titleWidthPctOfDemo: tb && db ? +((tb.w / db.w) * 100).toFixed(1) : null,
      titleLines: Math.round(tb.h / lh),
      h2MaxW: getComputedStyle(title).maxWidth,
      lmsAboveDemo: lb && db ? lb.b < db.t : null,
      ctaAloneUnderDemo: cb && lb ? cb.t > lb.b && cb.t > db.b : null,
      indicesOverlapTitleX: overlapX(ibx, tb),
      indicesOverlapInnerX: overlapX(ibx, ib),
      readingClearance: tb && ibx ? +(tb.l - ibx.r).toFixed(1) : null,
      orderTops: {
        title: tb?.t,
        mech: mb?.t,
        lms: lb?.t,
        demo: db?.t,
        cta: cb?.t,
      },
    };
  });

  // demo centered — native chrome / Oral row
  await page.evaluate(() =>
    document.querySelector(".demo-band").scrollIntoView({ block: "center" })
  );
  await page.waitForTimeout(500);
  await shot("capture-d1280-demo.png");
  metrics.demoChrome = await page.evaluate(() => {
    const v = document.querySelector(".demo-video");
    const f = document.querySelector(".demo-frame");
    const vb = v.getBoundingClientRect();
    const fb = f.getBoundingClientRect();
    return {
      videoControls: v.hasAttribute("controls"),
      videoH: +vb.height.toFixed(1),
      frameH: +fb.height.toFixed(1),
      controlsReserveEstimate: 48,
      oralRowRiskZoneFromBottom: 64,
      framePad: getComputedStyle(f).padding,
      demoOp: getComputedStyle(document.querySelector(".demo-band")).opacity,
      hasWill: document.querySelector(".demo-band").classList.contains("will-reveal"),
      hasIn: document.querySelector(".demo-band").classList.contains("is-in"),
      poster: v.getAttribute("poster"),
    };
  });

  // after-demo CTA centered — urgency collision
  await page.evaluate(() =>
    document.querySelector(".look-inner--after-demo").scrollIntoView({ block: "center" })
  );
  await page.waitForTimeout(300);
  await shot("capture-d1280-after-demo.png");
  metrics.afterDemoViewport = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const vis = (el) => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return {
        t: +b.top.toFixed(1),
        b: +b.bottom.toFixed(1),
        visiblePx: Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0)),
      };
    };
    const after = q(".look-inner--after-demo");
    const cs = getComputedStyle(after);
    return {
      demo: vis(q(".demo-band")),
      cta: vis(q(".look-inner--after-demo .cta-trial")),
      lms: vis(q(".mechanism-lms")),
      urgencyTitle: vis(q("#urgency h2")),
      afterPadTop: parseFloat(cs.paddingTop),
      afterPadBottom: parseFloat(cs.paddingBottom),
      afterH: +after.getBoundingClientRect().height.toFixed(1),
      ctaH: +q(".look-inner--after-demo .cta-trial").getBoundingClientRect().height.toFixed(1),
    };
  });

  // urgency / partners / footer with fixed indices
  await page.evaluate(() => document.querySelector("#urgency").scrollIntoView());
  await page.waitForTimeout(250);
  metrics.urgency = await page.evaluate(() => {
    const s = document.querySelector("#urgency");
    const inner = s.querySelector(".look-inner");
    const sh = s.getBoundingClientRect().height;
    const cs = getComputedStyle(inner);
    const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    const idx = document.querySelector(".look-indices").getBoundingClientRect();
    const h2 = document.querySelector("#urgency h2").getBoundingClientRect();
    return {
      h: +sh.toFixed(1),
      pad: +pad.toFixed(1),
      padRatio: +(pad / sh).toFixed(2),
      activeIndex: document.querySelector(".look-index.is-active")?.textContent,
      indicesInView: idx.bottom > 0 && idx.top < innerHeight,
      indicesOverlapH2X: Math.max(0, Math.min(idx.right, h2.right) - Math.max(idx.left, h2.left)),
      readingClearance: +(h2.left - idx.right).toFixed(1),
    };
  });

  await page.evaluate(() => document.querySelector("#partners").scrollIntoView());
  await page.waitForTimeout(250);
  await shot("capture-d1280-partners.png");
  metrics.partners = await page.evaluate(() => {
    const strip = document.querySelector(".partner-strip");
    const imgs = [...strip.querySelectorAll("img")].map((i) => {
      const b = i.getBoundingClientRect();
      return { l: +b.left.toFixed(1), r: +b.right.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) };
    });
    const gaps = [];
    for (let i = 0; i < imgs.length - 1; i++) gaps.push(+(imgs[i + 1].l - imgs[i].r).toFixed(1));
    const sb = strip.getBoundingClientRect();
    const occ = imgs.reduce((a, i) => a + i.w, 0);
    return {
      gaps,
      occPct: +((occ / sb.width) * 100).toFixed(1),
      stripW: +sb.width.toFixed(1),
      markHs: imgs.map((i) => i.h),
      justify: getComputedStyle(strip).justifyContent,
      activeIndex: document.querySelector(".look-index.is-active")?.textContent,
    };
  });

  await page.evaluate(() => document.querySelector("#contact").scrollIntoView());
  await page.waitForTimeout(250);
  await shot("capture-d1280-footer.png");
  metrics.footer = await page.evaluate(() => {
    const idx = document.querySelector(".look-indices").getBoundingClientRect();
    const foot = document.querySelector(".look--footer");
    const h2 = foot.querySelector("h2").getBoundingClientRect();
    const kids = [...foot.querySelector(".look-inner").children].map((el) => ({
      tag: el.tagName + (el.className ? "." + String(el.className).split(" ")[0] : ""),
      t: +el.getBoundingClientRect().top.toFixed(1),
    }));
    return {
      kids,
      activeIndex: document.querySelector(".look-index.is-active")?.textContent,
      indicesInView: idx.bottom > 0 && idx.top < innerHeight,
      indicesOnInk: true,
      indicesColor: getComputedStyle(document.querySelector(".look-index")).color,
      activeColor: getComputedStyle(document.querySelector(".look-index.is-active")).color,
      footerBg: getComputedStyle(foot).backgroundColor,
      readingClearance: +(h2.left - idx.right).toFixed(1),
      indicesVsInkContrastRisk: "stone/ink on ink field",
    };
  });

  // full index path + lying active
  await page.goto("http://127.0.0.1:8117/", { waitUntil: "networkidle" });
  metrics.indexPath = await page.evaluate(async () => {
    const pts = ["#home", "#problem", "#solution", "#urgency", "#partners", "#contact"];
    const out = [];
    for (const sel of pts) {
      document.querySelector(sel).scrollIntoView();
      await new Promise((r) => setTimeout(r, 120));
      window.dispatchEvent(new Event("scroll"));
      await new Promise((r) => setTimeout(r, 40));
      const b = document.querySelector(".look-indices").getBoundingClientRect();
      const stone = getComputedStyle(document.querySelector(".look-index:not(.is-active)") || document.querySelector(".look-index")).color;
      const active = getComputedStyle(document.querySelector(".look-index.is-active")).color;
      const field = getComputedStyle(document.querySelector(sel)).backgroundColor;
      out.push({
        sel,
        idx: document.querySelector(".look-index.is-active")?.textContent,
        indicesVisible: b.bottom > 0 && b.top < innerHeight,
        indicesTop: +b.top.toFixed(1),
        fieldBg: field,
        activeColor: active,
        stoneColor: stone,
      });
    }
    return out;
  });

  // index 02 / 03 landings
  await page.goto("http://127.0.0.1:8117/", { waitUntil: "networkidle" });
  await page.click('a.look-index[href="#problem"]');
  await page.waitForTimeout(900);
  metrics.index02Click = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const vis = (el) => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return {
        t: +b.top.toFixed(1),
        visiblePx: Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0)),
      };
    };
    const idx = q(".look-indices").getBoundingClientRect();
    const title = q("#problem-title").getBoundingClientRect();
    return {
      title: vis(q("#problem-title")),
      body: vis(q("#problem p")),
      scrollMargin: getComputedStyle(q("#problem")).scrollMarginTop,
      clearance: +(title.left - idx.right).toFixed(1),
      titleOpticalFromCenter: +(title.top + title.height / 2 - innerHeight / 2).toFixed(1),
    };
  });

  await page.goto("http://127.0.0.1:8117/", { waitUntil: "networkidle" });
  await page.click('a.look-index[href="#solution"]');
  await page.waitForTimeout(900);
  await shot("capture-d1280-index03-click.png");
  metrics.index03Click = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const vis = (el) => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return {
        t: +b.top.toFixed(1),
        visiblePx: Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0)),
      };
    };
    return {
      title: vis(q("#solution-title")),
      mech: vis(q(".mechanism")),
      lms: vis(q(".mechanism-lms")),
      demo: vis(q(".demo-band")),
      demoVisibleEnough: (vis(q(".demo-band"))?.visiblePx || 0) > 80,
    };
  });

  // Desire entry fold: title→LMS height vs remaining room for evidence
  await page.goto("http://127.0.0.1:8117/#solution", { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  metrics.desireEntryFold = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const title = q("#solution-title").getBoundingClientRect();
    const lms = q(".mechanism-lms").getBoundingClientRect();
    const demo = q(".demo-band").getBoundingClientRect();
    const claimH = lms.bottom - title.top;
    const roomBelow = innerHeight - lms.bottom;
    return {
      claimH: +claimH.toFixed(1),
      roomBelowClaim: +roomBelow.toFixed(1),
      demoTop: +demo.top.toFixed(1),
      demoVisiblePx: Math.max(0, Math.min(demo.bottom, innerHeight) - Math.max(demo.top, 0)),
      titleTop: +title.top.toFixed(1),
      scrollMargin: getComputedStyle(q("#solution")).scrollMarginTop,
      evidenceStartsBelowFold: demo.top >= innerHeight - 24,
    };
  });

  // 1120 / 390 stack collisions
  await page.setViewportSize({ width: 1120, height: 720 });
  await page.goto("http://127.0.0.1:8117/", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await shot("capture-w1120-hero.png");
  metrics.hero1120 = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const box = (el) => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { t: +b.top.toFixed(1), b: +b.bottom.toFixed(1), l: +b.left.toFixed(1), r: +b.right.toFixed(1), op: getComputedStyle(el).opacity, z: getComputedStyle(el).zIndex, pos: getComputedStyle(el).position };
    };
    const brand = box(q(".brand"));
    const idx = box(q(".look-indices"));
    const overlap = (a, b) => {
      if (!a || !b) return 0;
      const x = Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l));
      const y = Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t));
      return +(x * y).toFixed(1);
    };
    return {
      brand,
      idx,
      brandIdxOverlap: overlap(brand, idx),
      indicesW: idx?.r - idx?.l,
      ledeCtaGap: +(box(q(".look--hero .cta-trial")).t - box(q(".hero-lede")).b).toFixed(1),
      brandOp: brand?.op,
    };
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:8117/", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await shot("capture-m390-hero.png");
  metrics.hero390 = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const box = (el) => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { t: +b.top.toFixed(1), b: +b.bottom.toFixed(1), l: +b.left.toFixed(1), r: +b.right.toFixed(1), op: getComputedStyle(el).opacity };
    };
    const brand = box(q(".brand"));
    const idx = box(q(".look-indices"));
    const overlap = (a, b) => {
      if (!a || !b) return 0;
      const x = Math.max(0, Math.min(a.r, b.r) - Math.max(a.l, b.l));
      const y = Math.max(0, Math.min(a.b, b.b) - Math.max(a.t, b.t));
      return +(x * y).toFixed(1);
    };
    const proc = box(q(".process-link"));
    const desk = box(q(".hero-desk"));
    return {
      brand,
      idx,
      brandIdxOverlap: overlap(brand, idx),
      titleIdxOverlap: overlap(box(q(".headline-main")), idx),
      padLeft: getComputedStyle(q(".hero-frame")).paddingLeft,
      indicesW: +(idx.r - idx.l).toFixed(1),
      procDeskClear: +(desk.t - proc.b).toFixed(1),
      ctaFont: getComputedStyle(q(".look--hero .cta-trial")).fontSize,
      procFont: getComputedStyle(q(".process-link")).fontSize,
    };
  });
  await page.evaluate(() => document.querySelector("#partners").scrollIntoView());
  await page.waitForTimeout(250);
  await shot("capture-m390-partners.png");
  metrics.partners390 = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll(".partner-strip img")].map((i) => {
      const b = i.getBoundingClientRect();
      return {
        t: +b.top.toFixed(1),
        l: +b.left.toFixed(1),
        w: +b.width.toFixed(1),
        h: +b.height.toFixed(1),
      };
    });
    const rows = new Set(imgs.map((i) => Math.round(i.t)));
    const idx = document.querySelector(".look-indices").getBoundingClientRect();
    const strip = document.querySelector(".partner-strip").getBoundingClientRect();
    return {
      imgs,
      rowCount: rows.size,
      indicesOverlapStripX: Math.max(0, Math.min(idx.right, strip.right) - Math.max(idx.left, strip.left)),
      activeIndex: document.querySelector(".look-index.is-active")?.textContent,
    };
  });

  // mid CTA orphan band + Desire consequence order
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("http://127.0.0.1:8117/", { waitUntil: "networkidle" });
  metrics.sectionRhythm = await page.evaluate(() => {
    const secs = ["#problem", "#solution", "#urgency", "#partners", "#contact"].map((sel) => {
      const el = document.querySelector(sel);
      const h = el.getBoundingClientRect().height;
      const inner = el.querySelector(".look-inner");
      const cs = inner ? getComputedStyle(inner) : null;
      const pad = cs ? parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) : 0;
      return { sel, h: +h.toFixed(1), pad: +pad.toFixed(1), padRatio: h ? +(pad / h).toFixed(2) : null };
    });
    const after = document.querySelector(".look-inner--after-demo");
    const acs = getComputedStyle(after);
    const afterH = after.getBoundingClientRect().height;
    const afterPad = parseFloat(acs.paddingTop) + parseFloat(acs.paddingBottom);
    const ctaH = document.querySelector(".look-inner--after-demo .cta-trial").getBoundingClientRect().height;
    return {
      secs,
      afterDemo: {
        h: +afterH.toFixed(1),
        pad: +afterPad.toFixed(1),
        ctaH: +ctaH.toFixed(1),
        padRatio: +(afterPad / afterH).toFixed(2),
        orphanRatio: +((afterH - ctaH) / afterH).toFixed(2),
      },
      lookOrder: [...document.querySelectorAll("section.look, footer.look, header.look")].map(
        (el) => el.id || el.className
      ),
    };
  });

  // check live :8080 drift
  try {
    const live = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await live.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 5000 });
    metrics.live8080 = await live.evaluate(() => ({
      hasStatistics: !!document.querySelector("#statistics"),
      hasAbout: !!document.querySelector("#about"),
      hasPartners: !!document.querySelector("#partners"),
      hasSolution: !!document.querySelector("#solution"),
      title: document.title,
    }));
    await live.close();
  } catch (e) {
    metrics.live8080 = { error: String(e.message || e) };
  }

  fs.writeFileSync(path.join(out, "metrics.json"), JSON.stringify(metrics, null, 2));
  console.log(JSON.stringify(metrics, null, 2));
  await browser.close();
  server.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
