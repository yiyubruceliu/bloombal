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

const visFn = () => {
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
      cy: +(b.top + b.height / 2).toFixed(1),
      visiblePx: Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0)),
    };
  };
  return { q, box };
};

(async () => {
  await new Promise((r) => server.listen(8119, r));
  const browser = await chromium.launch({ headless: true });
  const metrics = { paidCheck: {}, deeper: {} };
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const shot = (name) => page.screenshot({ path: path.join(out, name), fullPage: false });

  await page.goto("http://127.0.0.1:8119/", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
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
    const area = (el) => (el ? el.w * el.h : 0);
    return {
      ledeCtaGap: lede && cta ? +(cta.t - lede.b).toFixed(1) : null,
      ctaProcGap: cta && proc ? +(proc.t - cta.b).toFixed(1) : null,
      procDesk: desk && proc ? +(desk.t - proc.b).toFixed(1) : null,
      ctaMassRatio: val && cta ? +(area(cta) / area(val)).toFixed(2) : null,
      processHref: q(".process-link")?.getAttribute("href"),
      demoIdPresent: !!q("#demo"),
      indicesPos: getComputedStyle(q(".look-indices")).position,
      indexRulePos: getComputedStyle(q(".index-rule")).position,
      indexRuleH: box(q(".index-rule"))?.h,
      videoControlsIdle: q(".demo-video")?.hasAttribute("controls"),
      playBtnPresent: !!q(".demo-play"),
    };
  });

  // Interest: index 02 land
  await page.click('a.look-index[href="#problem"]');
  await page.waitForTimeout(900);
  await shot("capture-d1280-index02.png");
  metrics.interestLand = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const vis = (el) => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return {
        t: +b.top.toFixed(1),
        b: +b.bottom.toFixed(1),
        visiblePx: Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0)),
        h: +b.height.toFixed(1),
      };
    };
    const h2 = q("#problem-title");
    const p = q("#problem .look-inner p");
    const idx = q(".look-indices");
    const h2b = h2.getBoundingClientRect();
    const ib = idx.getBoundingClientRect();
    return {
      hash: location.hash,
      title: vis(h2),
      body: vis(p),
      bodyFullH: +p.getBoundingClientRect().height.toFixed(1),
      activeIndex: q(".look-index.is-active")?.textContent?.trim(),
      scrollMargin: getComputedStyle(q("#problem")).scrollMarginTop,
      readingClearance: +(h2b.left - ib.right).toFixed(1),
      opticalCentreDelta: +(h2b.top + h2b.height / 2 - innerHeight / 2).toFixed(1),
      lookH: +q("#problem").getBoundingClientRect().height.toFixed(1),
      padRatio: (() => {
        const inner = q("#problem .look-inner");
        const cs = getComputedStyle(inner);
        const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
        const sh = q("#problem").getBoundingClientRect().height;
        return +(pad / sh).toFixed(2);
      })(),
    };
  });

  // Desire entry via process
  await page.goto("http://127.0.0.1:8119/", { waitUntil: "networkidle" });
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
        visiblePx: Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0)),
        cx: +(b.left + b.width / 2).toFixed(1),
        w: +b.width.toFixed(1),
      };
    };
    const title = q("#solution-title");
    const demo = q(".demo-band");
    const claimBottom = q(".mechanism-lms").getBoundingClientRect().bottom;
    const claimTop = title.getBoundingClientRect().top;
    return {
      title: vis(title),
      mech: vis(q(".mechanism")),
      lms: vis(q(".mechanism-lms")),
      demo: vis(demo),
      midCta: vis(q(".look-inner--after-demo .cta-trial")),
      claimStackH: +(claimBottom - claimTop).toFixed(1),
      claimStackVisible: Math.max(
        0,
        Math.min(claimBottom, innerHeight) - Math.max(claimTop, 0)
      ),
      evidenceInView: (vis(demo)?.visiblePx || 0) > 40,
      activeIndex: q(".look-index.is-active")?.textContent?.trim(),
      deltaTitleDemoCx: +(
        demo.getBoundingClientRect().left +
        demo.getBoundingClientRect().width / 2 -
        (title.getBoundingClientRect().left + title.getBoundingClientRect().width / 2)
      ).toFixed(1),
      titleWidthPct: +(
        (title.getBoundingClientRect().width / demo.getBoundingClientRect().width) *
        100
      ).toFixed(1),
    };
  });

  // Desire claim stack vs fold: how much essay before evidence at solution start
  await page.evaluate(() => document.querySelector("#solution").scrollIntoView({ block: "start" }));
  await page.waitForTimeout(400);
  await shot("capture-d1280-solution-start.png");
  metrics.desireFold = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const vis = (el) => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return {
        t: +b.top.toFixed(1),
        b: +b.bottom.toFixed(1),
        visiblePx: Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0)),
        h: +b.height.toFixed(1),
      };
    };
    const title = q("#solution-title");
    const mech = q(".mechanism");
    const lms = q(".mechanism-lms");
    const demo = q(".demo-band");
    const play = q(".demo-play");
    const lh = parseFloat(getComputedStyle(title).lineHeight);
    return {
      title: vis(title),
      mech: vis(mech),
      lms: vis(lms),
      demo: vis(demo),
      play: vis(play),
      titleLines: Math.round(title.getBoundingClientRect().height / lh),
      essayBeforeDemo:
        demo.getBoundingClientRect().top - title.getBoundingClientRect().top,
      demoVisibleAtEntry: (vis(demo)?.visiblePx || 0) > 20,
      playOverPoster: !!play && !play.hidden,
      playLabel: play?.textContent?.trim(),
      playArea: play
        ? +(play.getBoundingClientRect().width * play.getBoundingClientRect().height).toFixed(0)
        : null,
      videoControls: q(".demo-video").hasAttribute("controls"),
    };
  });

  // demo centered — play button obscures poster evidence?
  await page.evaluate(() =>
    document.querySelector(".demo-band").scrollIntoView({ block: "center" })
  );
  await page.waitForTimeout(400);
  await shot("capture-d1280-demo.png");
  metrics.demoPlay = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const v = q(".demo-video");
    const play = q(".demo-play");
    const frame = q(".demo-frame");
    const vb = v.getBoundingClientRect();
    const pb = play.getBoundingClientRect();
    const fb = frame.getBoundingClientRect();
    // oral/factor row estimate: lower third of poster
    const oralZone = {
      t: vb.top + vb.height * 0.62,
      b: vb.bottom - 8,
      l: vb.left,
      r: vb.right,
    };
    const ox = Math.max(0, Math.min(pb.right, oralZone.r) - Math.max(pb.left, oralZone.l));
    const oy = Math.max(0, Math.min(pb.bottom, oralZone.b) - Math.max(pb.top, oralZone.t));
    return {
      controlsIdle: v.hasAttribute("controls"),
      playHidden: play.hidden,
      playBox: {
        t: +pb.top.toFixed(1),
        b: +pb.bottom.toFixed(1),
        w: +pb.width.toFixed(1),
        h: +pb.height.toFixed(1),
        cy: +(pb.top + pb.height / 2).toFixed(1),
      },
      videoBox: { t: +vb.top.toFixed(1), h: +vb.height.toFixed(1), cy: +(vb.top + vb.height / 2).toFixed(1) },
      playCenterOffsetFromVideoCenter: +(
        pb.top +
        pb.height / 2 -
        (vb.top + vb.height / 2)
      ).toFixed(1),
      playOverlapOralZoneArea: +(ox * oy).toFixed(1),
      playPctOfVideoArea: +(((pb.width * pb.height) / (vb.width * vb.height)) * 100).toFixed(2),
      framePad: getComputedStyle(frame).padding,
      poster: v.getAttribute("poster"),
    };
  });

  // after-demo CTA centered — urgency
  await page.evaluate(() =>
    document.querySelector(".look-inner--after-demo").scrollIntoView({ block: "center" })
  );
  await page.waitForTimeout(300);
  await shot("capture-d1280-after-demo.png");
  metrics.afterDemo = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const vis = (el) => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return {
        t: +b.top.toFixed(1),
        visiblePx: Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0)),
      };
    };
    const after = q(".look-inner--after-demo");
    const cs = getComputedStyle(after);
    const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    const cta = q(".look-inner--after-demo .cta-trial");
    return {
      demo: vis(q(".demo-band")),
      cta: vis(cta),
      urgencyTitle: vis(q("#urgency h2")),
      afterH: +after.getBoundingClientRect().height.toFixed(1),
      ctaH: +cta.getBoundingClientRect().height.toFixed(1),
      afterPadTop: parseFloat(cs.paddingTop),
      afterPadBottom: parseFloat(cs.paddingBottom),
      padRatio: +(pad / after.getBoundingClientRect().height).toFixed(2),
      isPast: q(".look-indices").classList.contains("is-past"),
      activeIndex: q(".look-index.is-active")?.textContent?.trim() || null,
    };
  });

  // sticky rail honesty past solution
  await page.evaluate(() => document.querySelector("#urgency").scrollIntoView({ block: "center" }));
  await page.waitForTimeout(250);
  metrics.urgencyRail = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const nav = q(".look-indices");
    const s = q("#urgency");
    const inner = s.querySelector(".look-inner");
    const sh = s.getBoundingClientRect().height;
    const cs = getComputedStyle(inner);
    const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    const h2 = q("#urgency h2").getBoundingClientRect();
    const idx = nav.getBoundingClientRect();
    return {
      padRatio: +(pad / sh).toFixed(2),
      h: +sh.toFixed(1),
      isPast: nav.classList.contains("is-past"),
      isOverFooter: nav.classList.contains("is-over-footer"),
      activeIndex: q(".look-index.is-active")?.textContent?.trim() || null,
      indicesOpacity: getComputedStyle(nav).opacity,
      indicesVisible: idx.bottom > 0 && idx.top < innerHeight && parseFloat(getComputedStyle(nav).opacity) > 0.05,
      readingClearance: +(h2.left - idx.right).toFixed(1),
      bodyVis: (() => {
        const p = q("#urgency p");
        const b = p.getBoundingClientRect();
        return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
      })(),
    };
  });

  await page.evaluate(() => document.querySelector("#partners").scrollIntoView({ block: "center" }));
  await page.waitForTimeout(300);
  await shot("capture-d1280-partners.png");
  metrics.partners = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const imgs = [...document.querySelectorAll(".partner-strip img")];
    const strip = q(".partner-strip").getBoundingClientRect();
    const markW = imgs.reduce((a, img) => a + img.getBoundingClientRect().width, 0);
    const gaps = [];
    for (let i = 0; i < imgs.length - 1; i++) {
      gaps.push(
        +(
          imgs[i + 1].getBoundingClientRect().left - imgs[i].getBoundingClientRect().right
        ).toFixed(1)
      );
    }
    const nav = q(".look-indices");
    const idx = nav.getBoundingClientRect();
    const first = imgs[0].getBoundingClientRect();
    return {
      markHeights: imgs.map((i) => +i.getBoundingClientRect().height.toFixed(1)),
      markWidths: imgs.map((i) => +i.getBoundingClientRect().width.toFixed(1)),
      htmlHeightAttrs: imgs.map((i) => i.getAttribute("height")),
      cssHeight: getComputedStyle(imgs[0]).height,
      occPct: +((markW / strip.width) * 100).toFixed(1),
      stripW: +strip.width.toFixed(1),
      gaps,
      isPast: nav.classList.contains("is-past"),
      activeIndex: q(".look-index.is-active")?.textContent?.trim() || null,
      indicesOpacity: getComputedStyle(nav).opacity,
      gutterOverlapX: Math.max(0, Math.min(idx.right, first.right) - Math.max(idx.left, first.left)),
      stripLeftClearance: +(first.left - idx.right).toFixed(1),
    };
  });

  // footer hide + Action path
  await page.evaluate(() => document.querySelector("#contact").scrollIntoView({ block: "start" }));
  await page.waitForTimeout(300);
  await shot("capture-d1280-footer-start.png");
  metrics.footerStart = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const nav = q(".look-indices");
    const footer = q("#contact");
    const h2 = q("#contact h2");
    const cta = q("#contact .cta-trial");
    const y = scrollY + innerHeight * 0.35;
    return {
      isOverFooter: nav.classList.contains("is-over-footer"),
      isPast: nav.classList.contains("is-past"),
      indicesOpacity: getComputedStyle(nav).opacity,
      indexRuleOpacity: getComputedStyle(q(".index-rule")).opacity,
      yProbe: +y.toFixed(1),
      footerTop: +footer.offsetTop.toFixed(1),
      h2: (() => {
        const b = h2.getBoundingClientRect();
        return { t: +b.t?.toFixed?.(1) || +b.top.toFixed(1), visiblePx: Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0)) };
      })(),
      ctaVis: (() => {
        const b = cta.getBoundingClientRect();
        return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
      })(),
      activeIndex: q(".look-index.is-active")?.textContent?.trim() || null,
    };
  });

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(250);
  await shot("capture-d1280-footer-end.png");
  metrics.footerEnd = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const nav = q(".look-indices");
    return {
      isOverFooter: nav.classList.contains("is-over-footer"),
      indicesOpacity: getComputedStyle(nav).opacity,
      pointerEvents: getComputedStyle(nav).pointerEvents,
      indexRuleOpacity: getComputedStyle(q(".index-rule")).opacity,
    };
  });

  // threshold: when does is-over-footer flip relative to partners/urgency still visible?
  await page.evaluate(() => {
    const f = document.querySelector("#contact");
    window.scrollTo(0, f.offsetTop - window.innerHeight * 0.4);
  });
  await page.waitForTimeout(200);
  metrics.footerThreshold = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const nav = q(".look-indices");
    const vis = (el) => {
      if (!el) return 0;
      const b = el.getBoundingClientRect();
      return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    };
    return {
      isOverFooter: nav.classList.contains("is-over-footer"),
      indicesOpacity: getComputedStyle(nav).opacity,
      partnersVis: vis(q("#partners")),
      urgencyVis: vis(q("#urgency")),
      contactH2Vis: vis(q("#contact h2")),
      contactCtaVis: vis(q("#contact .cta-trial")),
      scrollY: +scrollY.toFixed(1),
    };
  });

  // Desire→Consequence: partners as coda — how much of viewport when partners centered is still urgency/demo?
  await page.evaluate(() =>
    document.querySelector("#partners").scrollIntoView({ block: "center" })
  );
  await page.waitForTimeout(200);
  metrics.partnersViewport = await page.evaluate(() => {
    const vis = (el) => {
      if (!el) return 0;
      const b = el.getBoundingClientRect();
      return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    };
    const q = (s) => document.querySelector(s);
    return {
      urgencyVis: vis(q("#urgency")),
      partnersVis: vis(q("#partners")),
      contactVis: vis(q("#contact")),
      afterDemoVis: vis(q(".look-inner--after-demo")),
    };
  });

  // Mid CTA vs demo optical path — mid Trial alone but how far from evidence?
  await page.evaluate(() =>
    document.querySelector(".look-inner--after-demo .cta-trial").scrollIntoView({ block: "center" })
  );
  await page.waitForTimeout(200);
  metrics.midCtaPath = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const cta = q(".look-inner--after-demo .cta-trial").getBoundingClientRect();
    const demo = q(".demo-band").getBoundingClientRect();
    const urg = q("#urgency h2").getBoundingClientRect();
    return {
      ctaCy: +(cta.top + cta.height / 2).toFixed(1),
      demoBottomVisible: Math.max(0, Math.min(demo.bottom, innerHeight) - Math.max(demo.top, 0)),
      gapDemoToCta: +(cta.top - demo.bottom).toFixed(1),
      urgencyVisiblePx: Math.max(0, Math.min(urg.bottom, innerHeight) - Math.max(urg.top, 0)),
      ctaCx: +(cta.left + cta.width / 2).toFixed(1),
      demoCx: +(demo.left + demo.width / 2).toFixed(1),
      deltaCtaDemoCx: +(demo.left + demo.width / 2 - (cta.left + cta.width / 2)).toFixed(1),
    };
  });

  // Mobile 390
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:8119/", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await shot("capture-m390-hero.png");
  metrics.mobileHero = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const brand = q(".brand").getBoundingClientRect();
    const title = q(".headline-main").getBoundingClientRect();
    const cta = q(".look--hero .cta-trial").getBoundingClientRect();
    const bone = getComputedStyle(q(".hero-bone")).zIndex;
    const brandZ = getComputedStyle(q(".brand")).zIndex;
    return {
      brandVisible: brand.bottom > 0 && brand.top < innerHeight,
      titleVisible: title.bottom > 0,
      ctaVisible: cta.bottom > 0,
      brandTop: +brand.top.toFixed(1),
      boneZ: bone,
      brandZ: brandZ,
      brandOp: getComputedStyle(q(".brand")).opacity,
      processClear: (() => {
        const p = q(".process-link").getBoundingClientRect();
        const d = q(".hero-desk").getBoundingClientRect();
        return +(d.top - p.bottom).toFixed(1);
      })(),
    };
  });

  await page.evaluate(() => document.querySelector("#partners").scrollIntoView({ block: "center" }));
  await page.waitForTimeout(300);
  await shot("capture-m390-partners.png");
  metrics.mobilePartners = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const imgs = [...document.querySelectorAll(".partner-strip img")];
    const idx = q(".look-indices").getBoundingClientRect();
    const strip = q(".partner-strip").getBoundingClientRect();
    const first = imgs[0].getBoundingClientRect();
    const rows = new Set(imgs.map((i) => Math.round(i.getBoundingClientRect().top)));
    return {
      markH: imgs.map((i) => +i.getBoundingClientRect().height.toFixed(1)),
      rows: rows.size,
      gutterOverlapX: Math.max(0, Math.min(idx.right, first.right) - Math.max(idx.left, first.left)),
      stripLeft: +strip.left.toFixed(1),
      idxRight: +idx.right.toFixed(1),
      clearance: +(first.left - idx.right).toFixed(1),
      isPast: q(".look-indices").classList.contains("is-past"),
      indicesOpacity: getComputedStyle(q(".look-indices")).opacity,
      lookInnerPadLeft: getComputedStyle(q("#partners .look-inner")).paddingLeft,
      lookInnerLeft: +q("#partners .look-inner").getBoundingClientRect().left.toFixed(1),
    };
  });

  // Interest on mobile — body fold
  await page.click('a.look-index[href="#problem"]');
  await page.waitForTimeout(800);
  metrics.mobileInterest = await page.evaluate(() => {
    const p = document.querySelector("#problem .look-inner p");
    const h2 = document.querySelector("#problem-title");
    const pb = p.getBoundingClientRect();
    const hb = h2.getBoundingClientRect();
    return {
      titleVis: Math.max(0, Math.min(hb.bottom, innerHeight) - Math.max(hb.top, 0)),
      bodyVis: Math.max(0, Math.min(pb.bottom, innerHeight) - Math.max(pb.top, 0)),
      bodyH: +pb.height.toFixed(1),
    };
  });

  // Mid width 1120 — Desire claim stack fold
  await page.setViewportSize({ width: 1120, height: 720 });
  await page.goto("http://127.0.0.1:8119/", { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await page.click(".process-link");
  await page.waitForTimeout(900);
  await shot("capture-w1120-after-process.png");
  metrics.w1120Desire = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const vis = (el) => {
      if (!el) return 0;
      const b = el.getBoundingClientRect();
      return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    };
    return {
      titleVis: vis(q("#solution-title")),
      mechVis: vis(q(".mechanism")),
      lmsVis: vis(q(".mechanism-lms")),
      demoVis: vis(q(".demo-band")),
      claimH: +(
        q(".mechanism-lms").getBoundingClientRect().bottom -
        q("#solution-title").getBoundingClientRect().top
      ).toFixed(1),
      brandOp: getComputedStyle(q(".brand")).opacity,
      brandVisible: q(".brand").getBoundingClientRect().top < 720,
    };
  });

  // Index 03 land — claim vs evidence budget
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("http://127.0.0.1:8119/", { waitUntil: "networkidle" });
  await page.click('a.look-index[href="#solution"]');
  await page.waitForTimeout(900);
  await shot("capture-d1280-index03.png");
  metrics.index03Land = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const vis = (el) => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return {
        t: +b.top.toFixed(1),
        visiblePx: Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0)),
      };
    };
    const title = q("#solution-title");
    const demo = q(".demo-band");
    const claimBottom = q(".mechanism-lms").getBoundingClientRect().bottom;
    return {
      title: vis(title),
      mech: vis(q(".mechanism")),
      lms: vis(q(".mechanism-lms")),
      demo: vis(demo),
      claimOccupiesViewportPct: +(
        (Math.max(0, Math.min(claimBottom, innerHeight) - Math.max(title.getBoundingClientRect().top, 0)) /
          innerHeight) *
        100
      ).toFixed(1),
      demoInFirstViewport: (vis(demo)?.visiblePx || 0) > 40,
      opticalCentreTitle: +(
        title.getBoundingClientRect().top +
        title.getBoundingClientRect().height / 2 -
        innerHeight / 2
      ).toFixed(1),
    };
  });

  // Reduced motion + keyboard play
  const rmPage = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    reducedMotion: "reduce",
  });
  await rmPage.goto("http://127.0.0.1:8119/", { waitUntil: "networkidle" });
  await rmPage.waitForTimeout(400);
  metrics.reducedMotion = await rmPage.evaluate(() => {
    const q = (s) => document.querySelector(s);
    return {
      playHidden: q(".demo-play")?.hidden,
      controls: q(".demo-video")?.hasAttribute("controls"),
      demoWill: q(".demo-band")?.classList.contains("will-reveal"),
      demoIn: q(".demo-band")?.classList.contains("is-in"),
      demoOp: getComputedStyle(q(".demo-band")).opacity,
    };
  });
  await rmPage.close();

  // paid acceptance spot-checks summary
  metrics.paidCheck = {
    footerIndicesHidden: metrics.footerEnd.indicesOpacity === "0",
    noActivePastSolution: metrics.urgencyRail.activeIndex === null && metrics.urgencyRail.isPast,
    partnerMarkH: metrics.partners.markHeights,
    partnerOcc: metrics.partners.occPct,
    urgencyOnMidCta: metrics.afterDemo.urgencyTitle?.visiblePx,
    idleControls: metrics.demoPlay.controlsIdle,
    playPresent: !metrics.demoPlay.playHidden,
  };

  fs.writeFileSync(path.join(out, "metrics.json"), JSON.stringify(metrics, null, 2));
  console.log(JSON.stringify({ paidCheck: metrics.paidCheck, deeperHints: {
    interestBodyVis: metrics.interestLand.body?.visiblePx,
    interestBodyFull: metrics.interestLand.bodyFullH,
    claimStackAt03: metrics.index03Land.claimOccupiesViewportPct,
    demoInAt03: metrics.index03Land.demoInFirstViewport,
    playOralOverlap: metrics.demoPlay.playOverlapOralZoneArea,
    afterDemoUrgency: metrics.afterDemo.urgencyTitle?.visiblePx,
    partnerOcc: metrics.partners.occPct,
    partnerH: metrics.partners.markHeights,
    midCtaDemoCx: metrics.midCtaPath.deltaCtaDemoCx,
    mobileGutter: metrics.mobilePartners,
    footerThreshold: metrics.footerThreshold,
    desireFoldDemo: metrics.desireFold.demoVisibleAtEntry,
    claimStackH: metrics.afterProcess.claimStackH,
  }}, null, 2));

  await browser.close();
  server.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
