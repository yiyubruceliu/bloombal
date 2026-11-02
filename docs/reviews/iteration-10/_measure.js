const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../../src");
const out = path.resolve(__dirname);
fs.mkdirSync(out, { recursive: true });

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

function rb(el) {
  if (!el) return null;
  const b = el.getBoundingClientRect();
  return {
    t: +b.top.toFixed(1),
    b: +b.bottom.toFixed(1),
    l: +b.left.toFixed(1),
    r: +b.right.toFixed(1),
    w: +b.width.toFixed(1),
    h: +b.height.toFixed(1),
  };
}

async function measure(page) {
  return page.evaluate(() => {
    const r = (el) => (el ? el.getBoundingClientRect() : null);
    const cs = (el) => (el ? getComputedStyle(el) : null);
    const q = (s) => document.querySelector(s);
    const box = (el) => {
      if (!el) return null;
      const b = r(el);
      return {
        t: +b.top.toFixed(1),
        b: +b.bottom.toFixed(1),
        l: +b.left.toFixed(1),
        r: +b.right.toFixed(1),
        w: +b.width.toFixed(1),
        h: +b.height.toFixed(1),
      };
    };
    const area = (el) => {
      const b = r(el);
      return b ? +(b.width * b.height).toFixed(0) : 0;
    };

    const brand = q(".brand");
    const main = q(".headline-main");
    const val = q(".headline-validation");
    const lede = q(".hero-lede");
    const cta = q(".look--hero .cta-trial");
    const process = q(".process-link");
    const desk = q(".hero-desk");
    const indices = q(".look-indices");
    const plate = q(".hero-bone-plate");
    const frame = q(".hero-frame");
    const after = q(".look-inner--after-demo");
    const midCta = after && after.querySelector(".cta-trial");
    const lms = q(".mechanism-lms");
    const demo = q("#demo");
    const urgency = q("#urgency");
    const partners = q("#partners");
    const strip = q(".partner-strip");
    const footer = q("#contact");

    const processTop = r(process)?.top;
    const ctaBot = r(cta)?.bottom;
    const deskTop = r(desk)?.top;
    const processBot = r(process)?.bottom;

    const imgs = [...document.querySelectorAll(".partner-strip img")].map((img) => {
      const b = r(img);
      return {
        alt: img.alt,
        w: +b.width.toFixed(1),
        h: +b.height.toFixed(1),
        l: +b.left.toFixed(1),
        r: +b.right.toFixed(1),
        t: +b.top.toFixed(1),
      };
    });
    const stripR = r(strip);
    const emptyRight =
      stripR && imgs.length
        ? +(((stripR.right - Math.max(...imgs.map((i) => i.r))) / stripR.width) * 100).toFixed(1)
        : null;
    const gapsBetween = [];
    for (let i = 1; i < imgs.length; i++) {
      gapsBetween.push(+(imgs[i].l - imgs[i - 1].r).toFixed(1));
    }

    const fr = r(frame);
    const vr = r(val);
    const rightEmpty = fr && vr ? +(((fr.right - vr.right) / fr.width) * 100).toFixed(1) : null;

    const idx = box(indices);
    const mainBox = box(main);
    const indexIntrudes = idx && mainBox ? idx.r > mainBox.l - 4 : null;

    const uInner = urgency.querySelector(".look-inner");
    const uh2 = urgency.querySelector("h2");
    const up = urgency.querySelector("p");
    const uPadTop = parseFloat(cs(uInner).paddingTop);
    const uPadBot = parseFloat(cs(uInner).paddingBottom);
    const uH = r(urgency).height;

    const afterOrder = after
      ? [...after.children].map((el) => ({
          cls: el.className,
          tag: el.tagName,
          top: +r(el).top.toFixed(1),
          h: +r(el).height.toFixed(1),
        }))
      : [];

    const sol = q("#solution");
    const solKids = [...sol.children].map((el) => ({
      tag: el.tagName,
      id: el.id || null,
      cls: el.className,
      top: +r(el).top.toFixed(1),
      h: +r(el).height.toFixed(1),
    }));

    const fKids = [...footer.querySelector(".look-inner").children].map((el) => ({
      tag: el.tagName,
      cls: el.className,
      top: +r(el).top.toFixed(1),
    }));

    // Z-path Y order of hero Attention nodes
    const heroZ = [
      ["brand", brand],
      ["main", main],
      ["val", val],
      ["lede", lede],
      ["cta", cta],
      ["process", process],
      ["desk", desk],
    ].map(([name, el]) => ({ name, t: box(el)?.t, b: box(el)?.b, pos: cs(el)?.position, z: cs(el)?.zIndex }));

    // body measure
    const problemP = q("#problem p");
    const problemMeasure = problemP
      ? {
          chApprox: +(problemP.getBoundingClientRect().width / parseFloat(cs(problemP).fontSize)).toFixed(1),
          maxW: cs(problemP).maxWidth,
          w: +r(problemP).width.toFixed(1),
        }
      : null;

    // demo video controls overlap oral?
    const video = q(".demo-video");
    const videoBox = box(video);

    return {
      brandPos: cs(brand).position,
      brandZ: cs(brand).zIndex,
      plateZ: cs(plate).zIndex,
      brandOp: cs(brand).opacity,
      processGap: processTop != null && ctaBot != null ? +(processTop - ctaBot).toFixed(1) : null,
      processDesk:
        processBot != null && deskTop != null ? +(deskTop - processBot).toFixed(1) : null,
      ctaDesk: ctaBot != null && deskTop != null ? +(deskTop - ctaBot).toFixed(1) : null,
      processOverDesk: processBot != null && deskTop != null ? processBot > deskTop : null,
      ctaOverDesk: ctaBot != null && deskTop != null ? ctaBot > deskTop : null,
      ctaArea: area(cta),
      valArea: area(val),
      ctaMassRatio: +(area(cta) / area(val)).toFixed(2),
      rightEmpty,
      indexIntrudes,
      idx,
      mainBox,
      brand: box(brand),
      cta: box(cta),
      process: box(process),
      desk: box(desk),
      lede: box(lede),
      val: box(val),
      imgs,
      emptyRight,
      gapsBetween,
      stripW: stripR ? +stripR.width.toFixed(1) : null,
      partnersH: box(partners)?.h,
      urgencyH: +uH.toFixed(1),
      urgencyPadRatio: +((uPadTop + uPadBot) / uH).toFixed(2),
      afterH: box(after)?.h,
      afterPad: {
        t: parseFloat(cs(after).paddingTop),
        b: parseFloat(cs(after).paddingBottom),
      },
      afterOrder,
      midCta: box(midCta),
      lms: box(lms),
      lmsToCta: midCta && lms ? +(r(midCta).top - r(lms).bottom).toFixed(1) : null,
      solKids,
      fKids,
      processHref: process.getAttribute("href"),
      willP: frame.className,
      frameT: cs(frame).transform,
      frameH: box(frame)?.h,
      viewportH: window.innerHeight,
      heroZ,
      problemMeasure,
      videoBox,
      demoOp: cs(demo).opacity,
      demoClasses: demo.className,
      urgToPart: +(r(partners).top - r(urgency).bottom).toFixed(1),
      partToFoot: +(r(footer).top - r(partners).bottom).toFixed(1),
      problemDocTop: q("#problem").offsetTop,
      demoDocTop: q("#demo").offsetTop,
      solutionDocTop: q("#solution").offsetTop,
      urgencyDocTop: q("#urgency").offsetTop,
      partnersDocTop: q("#partners").offsetTop,
      // CTA horizontal alignment vs process
      ctaProcessAlign: {
        ctaL: box(cta)?.l,
        processL: box(process)?.l,
        delta: box(cta) && box(process) ? +(box(process).l - box(cta).l).toFixed(1) : null,
      },
      // Validation ice underline vs lede collision
      valLedeGap: box(val) && box(lede) ? +(box(lede).t - box(val).b).toFixed(1) : null,
      ledeCtaGap: box(lede) && box(cta) ? +(box(cta).t - box(lede).b).toFixed(1) : null,
      // copyright contrast approx
      copyrightColor: cs(q(".copyright")).color,
      footerBg: cs(footer).backgroundColor,
      // solution title max-width creates short line then orphan?
      solTitle: {
        fs: cs(q("#solution-title")).fontSize,
        maxW: cs(q("#solution-title")).maxWidth,
        w: box(q("#solution-title"))?.w,
        h: box(q("#solution-title"))?.h,
      },
      // look-inner width vs demo-band width (scan path zig)
      lookInnerW: box(q(".look--solution > .look-inner"))?.w,
      demoBandW: box(demo)?.w,
      lookInnerL: box(q(".look--solution > .look-inner"))?.l,
      demoBandL: box(demo)?.l,
    };
  });
}

server.listen(8112, async () => {
  const browser = await chromium.launch({ headless: true });
  const results = {};

  for (const vp of [
    { w: 1280, h: 720, name: "d1280" },
    { w: 1120, h: 720, name: "w1120" },
    { w: 390, h: 844, name: "m390" },
    { w: 1440, h: 900, name: "w1440" },
  ]) {
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
    await page.goto("http://127.0.0.1:8112/", { waitUntil: "networkidle" });
    await page.waitForTimeout(700);
    await page.screenshot({
      path: path.join(out, `capture-${vp.name}-hero.png`),
      fullPage: false,
    });
    results[vp.name] = await measure(page);

    // index active at partners / urgency / contact
    const indexMap = {};
    for (const sel of ["#urgency", "#partners", "#contact"]) {
      await page.locator(sel).scrollIntoViewIfNeeded();
      await page.waitForTimeout(250);
      indexMap[sel] = await page.evaluate(() =>
        [...document.querySelectorAll(".look-index")].map((a) => ({
          t: a.textContent.trim(),
          on: a.classList.contains("is-active"),
        }))
      );
    }
    results[vp.name].indexAt = indexMap;

    if (vp.name === "d1280") {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(100);
      await page.locator("#demo").scrollIntoViewIfNeeded();
      await page.waitForTimeout(800);
      await page.screenshot({
        path: path.join(out, "capture-d1280-demo.png"),
        fullPage: false,
      });
      results[vp.name].demoRevealAfterScroll = await page.evaluate(() => ({
        op: getComputedStyle(document.querySelector("#demo")).opacity,
        cls: document.querySelector("#demo").className,
      }));
      await page.locator("#partners").scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      await page.screenshot({
        path: path.join(out, "capture-d1280-partners.png"),
        fullPage: false,
      });
      await page.locator("#contact").scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      await page.screenshot({
        path: path.join(out, "capture-d1280-footer.png"),
        fullPage: false,
      });

      // mid-scroll: solution title + mechanism without demo fully in view
      await page.evaluate(() => {
        const sol = document.querySelector("#solution");
        window.scrollTo(0, sol.offsetTop - 40);
      });
      await page.waitForTimeout(400);
      results[vp.name].atSolutionEntry = await page.evaluate(() => {
        const demo = document.querySelector("#demo");
        const mech = document.querySelector(".mechanism");
        const title = document.querySelector("#solution-title");
        const dr = demo.getBoundingClientRect();
        const vh = window.innerHeight;
        return {
          titleTop: +title.getBoundingClientRect().top.toFixed(1),
          mechTop: +mech.getBoundingClientRect().top.toFixed(1),
          demoTop: +dr.top.toFixed(1),
          demoInView: dr.top < vh && dr.bottom > 0,
          demoOpacity: getComputedStyle(demo).opacity,
          demoCls: demo.className,
          // how much of demo is below fold when title is near top
          demoBelowFoldPx: Math.max(0, +(dr.top - vh).toFixed(1)),
        };
      });
      await page.screenshot({
        path: path.join(out, "capture-d1280-solution-entry.png"),
        fullPage: false,
      });
    }

    if (vp.name === "m390") {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(100);
      results[vp.name].heroClip = await page.evaluate(() => {
        const frame = document.querySelector(".hero-frame");
        const process = document.querySelector(".process-link");
        const cta = document.querySelector(".look--hero .cta-trial");
        const desk = document.querySelector(".hero-desk");
        const brand = document.querySelector(".brand");
        const fr = frame.getBoundingClientRect();
        const pr = process.getBoundingClientRect();
        const cr = cta.getBoundingClientRect();
        const dr = desk.getBoundingClientRect();
        const imgs = [...document.querySelectorAll(".partner-strip img")].map((i) => {
          const b = i.getBoundingClientRect();
          return { alt: i.alt, t: +b.top.toFixed(1), l: +b.left.toFixed(1), h: +b.height.toFixed(1) };
        });
        return {
          frameOverflow: getComputedStyle(frame).overflow,
          frameH: +fr.height.toFixed(1),
          processClipped: pr.bottom > fr.bottom + 1,
          ctaClipped: cr.bottom > fr.bottom + 1,
          processOverDesk: pr.bottom > dr.top,
          ctaOverDesk: cr.bottom > dr.top,
          processDeskClear: +(dr.top - pr.bottom).toFixed(1),
          ctaDeskClear: +(dr.top - cr.bottom).toFixed(1),
          padBottom: getComputedStyle(frame).paddingBottom,
          processFs: getComputedStyle(process).fontSize,
          ctaFs: getComputedStyle(cta).fontSize,
          brandTop: +brand.getBoundingClientRect().top.toFixed(1),
          indicesBox: (() => {
            const b = document.querySelector(".look-indices").getBoundingClientRect();
            return { t: +b.top.toFixed(1), r: +b.right.toFixed(1), w: +b.width.toFixed(1) };
          })(),
          partnerTops: imgs,
          partnerRows: [...new Set(imgs.map((i) => Math.round(i.t)))].length,
          flexWrap: getComputedStyle(document.querySelector(".partner-strip")).flexWrap,
        };
      });
      await page.locator("#partners").scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      await page.screenshot({
        path: path.join(out, "capture-m390-partners.png"),
        fullPage: false,
      });
    }

    if (vp.name === "w1120") {
      // verify copy visible above plate (sample center of brand)
      results[vp.name].paintSample = await page.evaluate(async () => {
        const brand = document.querySelector(".wordmark");
        const b = brand.getBoundingClientRect();
        const x = Math.floor(b.left + b.width / 2);
        const y = Math.floor(b.top + b.height / 2);
        // rough: text should be ink not bone-only
        const ink = getComputedStyle(brand).color;
        const pos = getComputedStyle(document.querySelector(".brand")).position;
        const z = getComputedStyle(document.querySelector(".brand")).zIndex;
        return { ink, pos, z, brandBox: { x, y, ...{ t: b.top, l: b.left, w: b.width } } };
      });
    }

    await page.close();
  }

  // live 8080
  const page2 = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  try {
    await page2.goto("http://127.0.0.1:8080/", {
      waitUntil: "domcontentloaded",
      timeout: 8000,
    });
    results.live8080 = await page2.evaluate(() => ({
      hasPartners: !!document.querySelector("#partners"),
      hasStats: !!document.querySelector("#statistics"),
      hasAbout: !!document.querySelector("#about"),
      hasProcessLink: !!document.querySelector(".process-link"),
      hasMechanismLms: !!document.querySelector(".mechanism-lms"),
      title: document.title,
      bodySnippet: document.body.innerText.slice(0, 200),
    }));
  } catch (e) {
    results.live8080 = { error: String(e) };
  }

  fs.writeFileSync(path.join(out, "metrics.json"), JSON.stringify(results, null, 2));

  const summary = {
    d1280: {
      processGap: results.d1280.processGap,
      processDesk: results.d1280.processDesk,
      ctaDesk: results.d1280.ctaDesk,
      mass: results.d1280.ctaMassRatio,
      rightEmpty: results.d1280.rightEmpty,
      afterH: results.d1280.afterH,
      afterPad: results.d1280.afterPad,
      urgPad: results.d1280.urgencyPadRatio,
      urgencyH: results.d1280.urgencyH,
      partnersH: results.d1280.partnersH,
      emptyRightPartners: results.d1280.emptyRight,
      gapsBetween: results.d1280.gapsBetween,
      imgs: results.d1280.imgs,
      processHref: results.d1280.processHref,
      demoReveal: results.d1280.demoRevealAfterScroll,
      atSolutionEntry: results.d1280.atSolutionEntry,
      lmsToCta: results.d1280.lmsToCta,
      afterOrder: results.d1280.afterOrder,
      indexAt: results.d1280.indexAt,
      lookVsDemo: {
        lookW: results.d1280.lookInnerW,
        demoW: results.d1280.demoBandW,
        lookL: results.d1280.lookInnerL,
        demoL: results.d1280.demoBandL,
      },
      heroZ: results.d1280.heroZ,
      valLedeGap: results.d1280.valLedeGap,
      ledeCtaGap: results.d1280.ledeCtaGap,
      problemMeasure: results.d1280.problemMeasure,
      solTitle: results.d1280.solTitle,
    },
    w1120: {
      brandPos: results.w1120.brandPos,
      brandZ: results.w1120.brandZ,
      processGap: results.w1120.processGap,
      processDesk: results.w1120.processDesk,
      ctaDesk: results.w1120.ctaDesk,
      processOverDesk: results.w1120.processOverDesk,
      paintSample: results.w1120.paintSample,
      indexAt: results.w1120.indexAt,
    },
    m390: {
      brandPos: results.m390.brandPos,
      heroClip: results.m390.heroClip,
      processDesk: results.m390.processDesk,
      ctaDesk: results.m390.ctaDesk,
      afterH: results.m390.afterH,
      urgPad: results.m390.urgencyPadRatio,
    },
    w1440: {
      rightEmpty: results.w1440.rightEmpty,
      brand: results.w1440.brand,
      cta: results.w1440.cta,
      frameCentered: results.w1440.brand && results.w1440.brand.l > 80,
    },
    live8080: results.live8080,
  };
  console.log(JSON.stringify(summary, null, 2));
  await browser.close();
  server.close();
});
