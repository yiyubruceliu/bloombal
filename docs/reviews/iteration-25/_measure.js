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
  await new Promise((r) => server.listen(8361, r));
  const browser = await chromium.launch({ headless: true });
  const metrics = { paidCheck: {}, deeper: {} };
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const shot = (name) => page.screenshot({ path: path.join(out, name), fullPage: false });

  await page.goto("http://127.0.0.1:8361/", { waitUntil: "networkidle" });
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
    const brand = box(q(".brand"));
    const mark = box(q(".brand-mark"));
    const main = box(q(".headline-main"));
    const area = (el) => (el ? el.w * el.h : 0);
    const hero = q(".look--hero");
    const bone = q(".hero-bone");
    const hb = hero.getBoundingClientRect();
    const boneB = bone.getBoundingClientRect();
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
      brand: brand,
      mark: mark,
      main: main,
      desk: desk,
      rightFieldEmptyW: desk ? +(1280 - desk.r).toFixed(1) : null,
      heroH: +hb.height.toFixed(1),
      boneOccupancyPct: +((boneB.width * boneB.height) / (hb.width * hb.height) * 100).toFixed(1),
      headlineFont: getComputedStyle(q(".headline-main")).fontFamily,
      ledeFont: getComputedStyle(q(".hero-lede")).fontFamily,
      ledeSize: getComputedStyle(q(".hero-lede")).fontSize,
      ledeMeasureCh: (() => {
        const el = q(".hero-lede");
        const cs = getComputedStyle(el);
        const ch = parseFloat(cs.fontSize);
        return +(el.getBoundingClientRect().width / ch).toFixed(1);
      })(),
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
        cy: +(b.top + b.height / 2).toFixed(1),
      };
    };
    const h2 = q("#problem-title");
    const p = q("#problem .look-inner p");
    const idx = q(".look-indices");
    const h2b = h2.getBoundingClientRect();
    const ib = idx.getBoundingClientRect();
    const next = q("#solution").getBoundingClientRect();
    const pb = p.getBoundingClientRect();
    return {
      hash: location.hash,
      title: vis(h2),
      body: vis(p),
      bodyFullH: +pb.height.toFixed(1),
      activeIndex: q(".look-index.is-active")?.textContent?.trim(),
      scrollMargin: getComputedStyle(q("#problem")).scrollMarginTop,
      readingClearance: +(h2b.left - ib.right).toFixed(1),
      opticalCentreDelta: +(h2b.top + h2b.height / 2 - innerHeight / 2).toFixed(1),
      lookH: +q("#problem").getBoundingClientRect().height.toFixed(1),
      emptyBelowBody: Math.max(0, Math.min(next.top, innerHeight) - pb.bottom),
      padRatio: (() => {
        const inner = q("#problem .look-inner");
        const cs = getComputedStyle(inner);
        const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
        const sh = q("#problem").getBoundingClientRect().height;
        return +(pad / sh).toFixed(2);
      })(),
      titleFontSize: getComputedStyle(h2).fontSize,
      bodyFontSize: getComputedStyle(p).fontSize,
      bodyMeasureCh: +(pb.width / parseFloat(getComputedStyle(p).fontSize)).toFixed(1),
      sectionJobCount: {
        h2: 1,
        paragraphs: q("#problem .look-inner").querySelectorAll("p").length,
      },
    };
  });

  // Desire entry via process
  await page.goto("http://127.0.0.1:8361/", { waitUntil: "networkidle" });
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
        h: +b.height.toFixed(1),
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
      titleLines: Math.round(
        title.getBoundingClientRect().height / parseFloat(getComputedStyle(title).lineHeight)
      ),
    };
  });

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
    const demo = q(".demo-band");
    const play = q(".demo-play");
    return {
      title: vis(title),
      mech: vis(q(".mechanism")),
      lms: vis(q(".mechanism-lms")),
      demo: vis(demo),
      play: vis(play),
      essayBeforeDemo: +(demo.getBoundingClientRect().top - title.getBoundingClientRect().top).toFixed(1),
      demoVisibleAtEntry: (vis(demo)?.visiblePx || 0) > 20,
      playLabel: play?.textContent?.trim(),
      videoControls: q(".demo-video").hasAttribute("controls"),
      poster: q(".demo-video")?.getAttribute("poster"),
      posterSrc: q(".demo-video")?.currentSrc || q(".demo-video")?.src,
    };
  });

  // demo centered — play position after iter-13
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
    const oralZone = {
      t: vb.top + vb.height * 0.62,
      b: vb.bottom - 8,
      l: vb.left,
      r: vb.right,
    };
    const centerBand = {
      t: vb.top + vb.height * 0.35,
      b: vb.top + vb.height * 0.65,
      l: vb.left + vb.width * 0.25,
      r: vb.left + vb.width * 0.75,
    };
    const overlap = (z) => {
      const ox = Math.max(0, Math.min(pb.right, z.r) - Math.max(pb.left, z.l));
      const oy = Math.max(0, Math.min(pb.bottom, z.b) - Math.max(pb.top, z.t));
      return +(ox * oy).toFixed(1);
    };
    const cs = getComputedStyle(play);
    return {
      controlsIdle: v.hasAttribute("controls"),
      playHidden: play.hidden,
      playBox: {
        t: +pb.top.toFixed(1),
        b: +pb.bottom.toFixed(1),
        l: +pb.left.toFixed(1),
        r: +pb.right.toFixed(1),
        w: +pb.width.toFixed(1),
        h: +pb.height.toFixed(1),
        cy: +(pb.top + pb.height / 2).toFixed(1),
        cx: +(pb.left + pb.width / 2).toFixed(1),
      },
      videoBox: {
        t: +vb.top.toFixed(1),
        h: +vb.height.toFixed(1),
        cy: +(vb.top + vb.height / 2).toFixed(1),
        cx: +(vb.left + vb.width / 2).toFixed(1),
        bottom: +vb.bottom.toFixed(1),
        left: +vb.left.toFixed(1),
      },
      frameBox: { l: +fb.left.toFixed(1), b: +fb.bottom.toFixed(1), pad: getComputedStyle(frame).padding },
      playCenterOffsetFromVideoCenter: +(
        pb.top + pb.height / 2 - (vb.top + vb.height / 2)
      ).toFixed(1),
      playOverlapOralZoneArea: overlap(oralZone),
      playOverlapCenterBand: overlap(centerBand),
      playFromBottom: +(vb.bottom - pb.bottom).toFixed(1),
      playFromLeft: +(pb.left - vb.left).toFixed(1),
      playBg: cs.backgroundColor,
      playColor: cs.color,
      playBorder: cs.border,
      playPctOfVideoArea: +(((pb.width * pb.height) / (vb.width * vb.height)) * 100).toFixed(2),
      // ink plaque vs Trial CTA grammar
      midCtaBg: getComputedStyle(q(".look-inner--after-demo .cta-trial")).backgroundColor,
      midCtaColor: getComputedStyle(q(".look-inner--after-demo .cta-trial")).color,
    };
  });

  // after-demo CTA centered — urgency clear?
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
        b: +b.bottom.toFixed(1),
        visiblePx: Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0)),
        cx: +(b.left + b.width / 2).toFixed(1),
      };
    };
    const after = q(".look-inner--after-demo");
    const cs = getComputedStyle(after);
    const cta = q(".look-inner--after-demo .cta-trial");
    const demo = q(".demo-band");
    const urg = q("#urgency h2");
    return {
      demo: vis(demo),
      cta: vis(cta),
      urgencyTitle: vis(urg),
      afterH: +after.getBoundingClientRect().height.toFixed(1),
      afterPadTop: parseFloat(cs.paddingTop),
      afterPadBottom: parseFloat(cs.paddingBottom),
      storyPadTop: parseFloat(getComputedStyle(q(".look--story .look-inner")).paddingTop),
      gapCtaToUrg: +(urg.getBoundingClientRect().top - cta.getBoundingClientRect().bottom).toFixed(1),
      deltaCtaDemoCx: +(
        demo.getBoundingClientRect().left +
        demo.getBoundingClientRect().width / 2 -
        (cta.getBoundingClientRect().left + cta.getBoundingClientRect().width / 2)
      ).toFixed(1),
      isPast: q(".look-indices").classList.contains("is-past"),
      activeIndex: q(".look-index.is-active")?.textContent?.trim() || null,
      displayFlex: cs.display,
      justifyContent: cs.justifyContent,
    };
  });

  await page.evaluate(() => document.querySelector("#urgency").scrollIntoView({ block: "center" }));
  await page.waitForTimeout(250);
  await shot("capture-d1280-urgency.png");
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
    const p = q("#urgency p");
    const pb = p.getBoundingClientRect();
    return {
      padRatio: +(pad / sh).toFixed(2),
      padTop: parseFloat(cs.paddingTop),
      padBottom: parseFloat(cs.paddingBottom),
      h: +sh.toFixed(1),
      isPast: nav.classList.contains("is-past"),
      isOverFooter: nav.classList.contains("is-over-footer"),
      activeIndex: q(".look-index.is-active")?.textContent?.trim() || null,
      indicesOpacity: getComputedStyle(nav).opacity,
      readingClearance: +(h2.left - idx.right).toFixed(1),
      bodyVis: Math.max(0, Math.min(pb.bottom, innerHeight) - Math.max(pb.top, 0)),
      titleOptical: +(h2.top + h2.height / 2 - innerHeight / 2).toFixed(1),
      titleSize: getComputedStyle(q("#urgency h2")).fontSize,
      emptyBelowBody: Math.max(0, innerHeight - pb.bottom),
      partnersPeek: (() => {
        const b = q("#partners").getBoundingClientRect();
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
    const vis = (el) => {
      if (!el) return 0;
      const b = el.getBoundingClientRect();
      return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    };
    return {
      markHeights: imgs.map((i) => +i.getBoundingClientRect().height.toFixed(1)),
      markWidths: imgs.map((i) => +i.getBoundingClientRect().width.toFixed(1)),
      cssHeight: getComputedStyle(imgs[0]).height,
      occPct: +((markW / strip.width) * 100).toFixed(1),
      stripW: +strip.width.toFixed(1),
      gaps,
      isPast: nav.classList.contains("is-past"),
      isOverFooter: nav.classList.contains("is-over-footer"),
      indicesOpacity: getComputedStyle(nav).opacity,
      gutterOverlapX: Math.max(0, Math.min(idx.right, first.right) - Math.max(idx.left, first.left)),
      stripLeftClearance: +(first.left - idx.right).toFixed(1),
      urgencyVis: vis(q("#urgency")),
      urgencyH2Vis: vis(q("#urgency h2")),
      partnersVis: vis(q("#partners")),
      contactVis: vis(q("#contact")),
      contactH2Vis: vis(q("#contact h2")),
      proofPad: getComputedStyle(q(".look--proof .look-inner")).padding,
      partnersH: +q("#partners").getBoundingClientRect().height.toFixed(1),
    };
  });

  // footer hide
  await page.evaluate(() => document.querySelector("#contact").scrollIntoView({ block: "start" }));
  await page.waitForTimeout(300);
  await shot("capture-d1280-footer-start.png");
  metrics.footerStart = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const nav = q(".look-indices");
    const footer = q("#contact");
    const h2 = q("#contact h2");
    const cta = q("#contact .cta-trial");
    const ft = footer.getBoundingClientRect().top;
    return {
      isOverFooter: nav.classList.contains("is-over-footer"),
      isPast: nav.classList.contains("is-past"),
      indicesOpacity: getComputedStyle(nav).opacity,
      indexRuleOpacity: getComputedStyle(q(".index-rule")).opacity,
      footerTopViewport: +ft.toFixed(1),
      threshold: +(innerHeight * 0.55).toFixed(1),
      h2Vis: (() => {
        const b = h2.getBoundingClientRect();
        return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
      })(),
      ctaVis: (() => {
        const b = cta.getBoundingClientRect();
        return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
      })(),
      footerOrder: (() => {
        const nodes = [...footer.querySelector(".look-inner").children].map((el) => ({
          tag: el.tagName,
          cls: el.className,
          t: +el.getBoundingClientRect().top.toFixed(1),
        }));
        return nodes;
      })(),
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

  // mid CTA path recheck
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

  // Type ladder across sections
  metrics.typeLadder = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const size = (sel) => {
      const el = q(sel);
      return el ? getComputedStyle(el).fontSize : null;
    };
    const family = (sel) => {
      const el = q(sel);
      return el ? getComputedStyle(el).fontFamily : null;
    };
    return {
      heroMain: size(".headline-main"),
      heroVal: size(".headline-validation"),
      heroLede: size(".hero-lede"),
      problem: size("#problem-title"),
      solution: size("#solution-title"),
      urgency: size("#urgency h2"),
      partners: size("#partners h2"),
      partnersHasH2: !!q("#partners h2"),
      footer: size("#contact h2"),
      body: size(".look--copy p"),
      mech: size(".mechanism"),
      lms: size(".mechanism-lms"),
      cta: size(".look--hero .cta-trial"),
      play: size(".demo-play"),
      index: size(".look-index"),
      families: {
        display: family(".headline-main"),
        solution: family("#solution-title"),
        body: family(".look--copy p"),
        cta: family(".look--hero .cta-trial"),
        play: family(".demo-play"),
        index: family(".look-index"),
      },
    };
  });

  // Texture / border inventory
  metrics.surfaceGrammar = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const cs = (sel) => {
      const el = q(sel);
      if (!el) return null;
      const s = getComputedStyle(el);
      return {
        bg: s.backgroundColor,
        border: s.border,
        borderTop: s.borderTop,
        radius: s.borderRadius,
        shadow: s.boxShadow,
      };
    };
    return {
      body: cs("body"),
      hero: cs(".look--hero"),
      copy: cs(".look--copy"),
      solution: cs(".look--solution"),
      story: cs(".look--story"),
      proof: cs(".look--proof"),
      footer: cs(".look--footer"),
      demoFrame: cs(".demo-frame"),
      cta: cs(".look--hero .cta-trial"),
      play: cs(".demo-play"),
      partnerImg: cs(".partner-strip img"),
      indexRule: cs(".index-rule"),
    };
  });

  // Animation presence
  metrics.animation = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    return {
      heroPresent: q(".hero-frame")?.classList.contains("is-present"),
      heroWill: q(".hero-frame")?.classList.contains("will-present"),
      demoIn: q(".demo-band")?.classList.contains("is-in"),
      demoWill: q(".demo-band")?.classList.contains("will-reveal"),
      heroTransform: getComputedStyle(q(".hero-frame")).transform,
      demoTransform: getComputedStyle(q(".demo-band")).transform,
      heroTransition: getComputedStyle(q(".hero-frame")).transition,
      demoTransition: getComputedStyle(q(".demo-band")).transition,
      motionIdeaCount: 2,
    };
  });

  // Mobile 390
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:8361/", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await shot("capture-m390-hero.png");
  metrics.mobileHero = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const brand = q(".brand").getBoundingClientRect();
    const title = q(".headline-main").getBoundingClientRect();
    const cta = q(".look--hero .cta-trial").getBoundingClientRect();
    const desk = q(".hero-desk").getBoundingClientRect();
    return {
      brandVisible: brand.bottom > 0 && brand.top < innerHeight,
      titleVisible: title.bottom > 0,
      ctaVisible: cta.bottom > 0 && cta.top < innerHeight,
      brandTop: +brand.top.toFixed(1),
      brandOp: getComputedStyle(q(".brand")).opacity,
      processClear: (() => {
        const p = q(".process-link").getBoundingClientRect();
        return +(desk.top - p.bottom).toFixed(1);
      })(),
      deskInFirstViewport: desk.top < innerHeight,
      deskVisiblePx: Math.max(0, Math.min(desk.bottom, innerHeight) - Math.max(desk.top, 0)),
      claimAboveDesk: title.bottom < desk.top,
      heroStackOrder: {
        brandT: +brand.top.toFixed(1),
        titleT: +title.top.toFixed(1),
        ctaT: +cta.top.toFixed(1),
        deskT: +desk.top.toFixed(1),
      },
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
      cssH: getComputedStyle(imgs[0]).height,
      rows: rows.size,
      gutterOverlapX: Math.max(0, Math.min(idx.right, first.right) - Math.max(idx.left, first.left)),
      stripLeft: +strip.left.toFixed(1),
      idxRight: +idx.right.toFixed(1),
      clearance: +(first.left - idx.right).toFixed(1),
      isPast: q(".look-indices").classList.contains("is-past"),
      indicesOpacity: getComputedStyle(q(".look-indices")).opacity,
      lookInnerPadLeft: getComputedStyle(q("#partners .look-inner")).paddingLeft,
    };
  });

  await page.click('a.look-index[href="#problem"]');
  await page.waitForTimeout(800);
  await shot("capture-m390-problem.png");
  metrics.mobileInterest = await page.evaluate(() => {
    const p = document.querySelector("#problem .look-inner p");
    const h2 = document.querySelector("#problem-title");
    const pb = p.getBoundingClientRect();
    const hb = h2.getBoundingClientRect();
    return {
      titleVis: Math.max(0, Math.min(hb.bottom, innerHeight) - Math.max(hb.top, 0)),
      bodyVis: Math.max(0, Math.min(pb.bottom, innerHeight) - Math.max(pb.top, 0)),
      bodyH: +pb.height.toFixed(1),
      opticalCentreDelta: +(hb.top + hb.height / 2 - innerHeight / 2).toFixed(1),
      emptyBelow: Math.max(0, innerHeight - pb.bottom),
    };
  });

  // Mobile rail clearance for copy/solution/story (iter-14 #1)
  const gutterAt = async (sel) => {
    await page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: "center" }), sel);
    await page.waitForTimeout(150);
    return page.evaluate((sel) => {
      const idx = document.querySelector(".look-indices").getBoundingClientRect();
      const h2 =
        document.querySelector(`${sel} h2`) ||
        document.querySelector(`${sel} #problem-title`) ||
        document.querySelector(`${sel} #solution-title`);
      const b = h2.getBoundingClientRect();
      return {
        sel,
        idxR: +idx.right.toFixed(1),
        textL: +b.left.toFixed(1),
        clearance: +(b.left - idx.right).toFixed(1),
        overlapX: Math.max(0, Math.min(idx.right, b.right) - Math.max(idx.left, b.left)),
      };
    }, sel);
  };
  metrics.mobileGutters = {
    problem: await gutterAt("#problem"),
    solution: await gutterAt("#solution"),
    urgency: await gutterAt("#urgency"),
  };
  await page.evaluate(() => document.querySelector("#urgency").scrollIntoView({ block: "center" }));
  await page.waitForTimeout(150);
  await shot("capture-m390-urgency.png");

  await page.evaluate(() =>
    document.querySelector(".look-inner--after-demo").scrollIntoView({ block: "center" })
  );
  await page.waitForTimeout(200);
  metrics.mobileAfterDemo = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const cta = q(".look-inner--after-demo .cta-trial").getBoundingClientRect();
    const urg = q("#urgency h2").getBoundingClientRect();
    const demo = q(".demo-band").getBoundingClientRect();
    return {
      urgencyVis: Math.max(0, Math.min(urg.bottom, innerHeight) - Math.max(urg.top, 0)),
      ctaCx: +(cta.left + cta.width / 2).toFixed(1),
      demoCx: +(demo.left + demo.width / 2).toFixed(1),
      deltaCx: +(demo.left + demo.width / 2 - (cta.left + cta.width / 2)).toFixed(1),
      viewportW: innerWidth,
    };
  });

  // Mid width 1120
  await page.setViewportSize({ width: 1120, height: 720 });
  await page.goto("http://127.0.0.1:8361/", { waitUntil: "networkidle" });
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
    const title = q("#solution-title");
    return {
      titleVis: vis(title),
      titleT: +title.getBoundingClientRect().top.toFixed(1),
      mechVis: vis(q(".mechanism")),
      lmsVis: vis(q(".mechanism-lms")),
      demoVis: vis(q(".demo-band")),
      claimH: +(
        q(".mechanism-lms").getBoundingClientRect().bottom -
        title.getBoundingClientRect().top
      ).toFixed(1),
      brandOp: getComputedStyle(q(".brand")).opacity,
      brandVisible: q(".brand").getBoundingClientRect().top < 720,
      opticalTitle: +(
        title.getBoundingClientRect().top +
        title.getBoundingClientRect().height / 2 -
        innerHeight / 2
      ).toFixed(1),
    };
  });

  // Index 03
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("http://127.0.0.1:8361/", { waitUntil: "networkidle" });
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

  // Desire evidence genre — poster content check via canvas sample? skip; note poster path
  metrics.desireEvidence = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const v = q(".demo-video");
    return {
      poster: v?.getAttribute("poster"),
      src: v?.getAttribute("src") || v?.querySelector("source")?.getAttribute("src"),
      mechanismText: q(".mechanism")?.textContent?.trim(),
      lmsText: q(".mechanism-lms")?.textContent?.trim(),
      solutionTitle: q("#solution-title")?.textContent?.trim(),
    };
  });

  // Reduced motion
  const rmPage = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    reducedMotion: "reduce",
  });
  await rmPage.goto("http://127.0.0.1:8361/", { waitUntil: "networkidle" });
  await rmPage.waitForTimeout(400);
  metrics.reducedMotion = await rmPage.evaluate(() => {
    const q = (s) => document.querySelector(s);
    return {
      playHidden: q(".demo-play")?.hidden,
      controls: q(".demo-video")?.hasAttribute("controls"),
      demoWill: q(".demo-band")?.classList.contains("will-reveal"),
      demoIn: q(".demo-band")?.classList.contains("is-in"),
      demoOp: getComputedStyle(q(".demo-band")).opacity,
      heroTransform: getComputedStyle(q(".hero-frame")).transform,
    };
  });
  await rmPage.close();

  // Compare 8080 lag?
  let liveLag = null;
  try {
    const live = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await live.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded", timeout: 5000 });
    await live.waitForTimeout(800);
    liveLag = await live.evaluate(() => {
      const q = (s) => document.querySelector(s);
      const play = q(".demo-play");
      const after = q(".look-inner--after-demo");
      const partner = q(".partner-strip img");
      return {
        playExists: !!play,
        playBottom: play ? getComputedStyle(play).bottom : null,
        playTop: play ? getComputedStyle(play).top : null,
        afterDisplay: after ? getComputedStyle(after).display : null,
        partnerH: partner ? getComputedStyle(partner).height : null,
        hasOverFooterLogicHint: document.body.innerHTML.includes("is-over-footer"),
      };
    });
    await live.close();
  } catch (e) {
    liveLag = { error: String(e.message || e) };
  }

  // Probe geometry for is-past honesty at urgency centre
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("http://127.0.0.1:8361/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.querySelector("#urgency").scrollIntoView({ block: "center" }));
  await page.waitForTimeout(250);
  metrics.urgencyPastProbe = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const y = window.innerHeight * 0.35;
    const solutionBottom = q("#solution").getBoundingClientRect().bottom + window.scrollY;
    const urgTop = q("#urgency").getBoundingClientRect().top;
    return {
      probeY: +y.toFixed(1),
      scrollY: +window.scrollY.toFixed(1),
      solutionBottomDoc: +solutionBottom.toFixed(1),
      urgTopVp: +urgTop.toFixed(1),
      urgInProbe: urgTop < y,
      isPast: q(".look-indices").classList.contains("is-past"),
      activeIndex: q(".look-index.is-active")?.textContent?.trim() || null,
      indicesOpacity: getComputedStyle(q(".look-indices")).opacity,
    };
  });

  // Mid-page texture: consecutive bone fields
  metrics.midTexture = await page.evaluate(() => {
    const sels = [".look--copy", ".look--solution", ".look--story", ".look--proof", ".look--footer"];
    return sels.map((sel) => {
      const el = document.querySelector(sel);
      const s = getComputedStyle(el);
      return {
        sel,
        bg: s.backgroundColor,
        borderTop: s.borderTop,
        padTop: getComputedStyle(el.querySelector(".look-inner") || el).paddingTop,
        padBottom: getComputedStyle(el.querySelector(".look-inner") || el).paddingBottom,
      };
    });
  });

  metrics.paidCheck = {
    // iter-14 acceptances
    mobileRailClearance: {
      problem: metrics.mobileGutters.problem,
      solution: metrics.mobileGutters.solution,
      urgency: metrics.mobileGutters.urgency,
      allClear:
        metrics.mobileGutters.problem.clearance >= 8 &&
        metrics.mobileGutters.solution.clearance >= 8 &&
        metrics.mobileGutters.urgency.clearance >= 8 &&
        metrics.mobileGutters.problem.overlapX === 0 &&
        metrics.mobileGutters.solution.overlapX === 0 &&
        metrics.mobileGutters.urgency.overlapX === 0,
    },
    urgencyOnMidCta: metrics.midCtaPath.urgencyVisiblePx,
    urgencyClearsMidCta: metrics.midCtaPath.urgencyVisiblePx === 0,
    afterDemoUrgencyVis: metrics.afterDemo.urgencyTitle?.visiblePx,
    playQuietVsTrial: metrics.demoPlay.playBg !== metrics.demoPlay.midCtaBg,
    playBg: metrics.demoPlay.playBg,
    midCtaBg: metrics.demoPlay.midCtaBg,
    isPastAtUrgency: metrics.urgencyPastProbe.isPast,
    noActiveAtUrgency: !metrics.urgencyPastProbe.activeIndex,
    partnersIsolation: {
      urgencyH2: metrics.partners.urgencyH2Vis,
      contactH2: metrics.partners.contactH2Vis,
      isolated:
        metrics.partners.urgencyH2Vis === 0 && metrics.partners.contactH2Vis === 0,
    },
    interestOptical: metrics.interestLand.opticalCentreDelta,
    interestOpticalOk: Math.abs(metrics.interestLand.opticalCentreDelta) <= 60,
    // prior paid
    footerIndicesHiddenAtEnd: metrics.footerEnd.indicesOpacity === "0" && metrics.footerEnd.isOverFooter,
    midCtaCentered: Math.abs(metrics.midCtaPath.deltaCtaDemoCx) <= 40,
    playOralOverlap: metrics.demoPlay.playOverlapOralZoneArea,
    idleControls: metrics.demoPlay.controlsIdle,
    mobilePartnerClearance: metrics.mobilePartners.clearance,
  };

  metrics.deeper = {
    interestOptical: metrics.interestLand.opticalCentreDelta,
    interestEmptyBelow: metrics.interestLand.emptyBelowBody,
    interestBodyVis: metrics.interestLand.body?.visiblePx,
    w1120TitleVis: metrics.w1120Desire.titleVis,
    w1120DemoVis: metrics.w1120Desire.demoVis,
    w1120OpticalTitle: metrics.w1120Desire.opticalTitle,
    playFromBottom: metrics.demoPlay.playFromBottom,
    playFromLeft: metrics.demoPlay.playFromLeft,
    urgencyPadRatio: metrics.urgencyRail.padRatio,
    urgencyEmptyBelow: metrics.urgencyRail.emptyBelowBody,
    urgencyPartnersPeek: metrics.urgencyRail.partnersPeek,
    urgencyTitleOptical: metrics.urgencyRail.titleOptical,
    index03ClaimPct: metrics.index03Land.claimOccupiesViewportPct,
    index03DemoIn: metrics.index03Land.demoInFirstViewport,
    index03Optical: metrics.index03Land.opticalCentreTitle,
    rightFieldEmpty: metrics.hero1280.rightFieldEmptyW,
    partnersHasH2: metrics.typeLadder.partnersHasH2,
    midTexture: metrics.midTexture,
    urgencyPastProbe: metrics.urgencyPastProbe,
    typeLadder: metrics.typeLadder,
    liveLag,
  };

  fs.writeFileSync(path.join(out, "metrics.json"), JSON.stringify(metrics, null, 2));
  console.log(
    JSON.stringify(
      {
        paidCheck: metrics.paidCheck,
        interest: {
          optical: metrics.interestLand.opticalCentreDelta,
          empty: metrics.interestLand.emptyBelowBody,
          bodyVis: metrics.interestLand.body?.visiblePx,
          titleT: metrics.interestLand.title?.t,
        },
        midCta: metrics.midCtaPath,
        afterDemo: {
          urg: metrics.afterDemo.urgencyTitle?.visiblePx,
          gap: metrics.afterDemo.gapCtaToUrg,
          afterPadB: metrics.afterDemo.afterPadBottom,
          storyPadT: metrics.afterDemo.storyPadTop,
          deltaCx: metrics.afterDemo.deltaCtaDemoCx,
          isPast: metrics.afterDemo.isPast,
        },
        partnersViewport: {
          urgH2: metrics.partners.urgencyH2Vis,
          partners: metrics.partners.partnersVis,
          contactH2: metrics.partners.contactH2Vis,
          proofPad: metrics.partners.proofPad,
        },
        demoPlay: {
          oral: metrics.demoPlay.playOverlapOralZoneArea,
          fromBottom: metrics.demoPlay.playFromBottom,
          fromLeft: metrics.demoPlay.playFromLeft,
          bg: metrics.demoPlay.playBg,
          midCtaBg: metrics.demoPlay.midCtaBg,
          quiet: metrics.demoPlay.playBg !== metrics.demoPlay.midCtaBg,
        },
        urgencyPast: metrics.urgencyPastProbe,
        mobileGutters: metrics.mobileGutters,
        w1120: metrics.w1120Desire,
        midTexture: metrics.midTexture,
        liveLag: metrics.deeper.liveLag,
      },
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
