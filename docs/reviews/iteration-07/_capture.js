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
    "Content-Type": mime[path.extname(fp)] || "application/octet-stream",
  });
  fs.createReadStream(fp).pipe(res);
});

function contrast(fg, bg) {
  const L = (c) => {
    const [r, g, b] = c.map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const a = L(fg);
  const b = L(bg);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}
function rgb(str) {
  const m = String(str).match(/(\d+)/g);
  return m ? m.slice(0, 3).map(Number) : [0, 0, 0];
}
function blendOver(fg, bg, a) {
  return fg.map((c, i) => Math.round(c * a + bg[i] * (1 - a)));
}

server.listen(8107, async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto("http://127.0.0.1:8107/", { waitUntil: "networkidle" });
  await page.waitForTimeout(900);

  const desk = await page.evaluate(() => {
    const pick = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        sel,
        x: +r.x.toFixed(1),
        y: +r.y.toFixed(1),
        w: +r.width.toFixed(1),
        h: +r.height.toFixed(1),
        bottom: +r.bottom.toFixed(1),
        top: +r.top.toFixed(1),
        fontSize: cs.fontSize,
        color: cs.color,
        bg: cs.backgroundColor,
        fw: cs.fontWeight,
        area: +(r.width * r.height).toFixed(0),
        pad: cs.padding,
        display: cs.display,
        filter: cs.filter,
        opacity: cs.opacity,
        lh: cs.lineHeight,
        maxW: cs.maxWidth,
        letterSpacing: cs.letterSpacing,
      };
    };
    const val = document.querySelector(".headline-validation-text");
    const valCS = getComputedStyle(val);
    const valR = val.getBoundingClientRect();
    const deskR = document.querySelector(".hero-desk").getBoundingClientRect();
    const ruleR = document.querySelector(".index-rule").getBoundingClientRect();
    const video = document.querySelector(".demo-video");
    const footCta = document.querySelector("#contact .cta-trial");
    const footEmail = document.querySelector(".footer-email");
    const footAbout = document.querySelector(".footer-about");
    const footH2 = document.querySelector("#contact h2");
    const fc = footCta.getBoundingClientRect();
    const fe = footEmail.getBoundingClientRect();
    const fa = footAbout.getBoundingClientRect();
    const fh = footH2.getBoundingClientRect();
    return {
      brand: pick(".brand"),
      mark: pick(".brand-mark"),
      wordmark: pick(".wordmark"),
      main: pick(".headline-main"),
      validation: pick(".headline-validation"),
      valText: {
        fontSize: valCS.fontSize,
        color: valCS.color,
        borderBottom: valCS.borderBottom,
        w: +valR.width.toFixed(1),
        h: +valR.height.toFixed(1),
        area: +(valR.width * valR.height).toFixed(0),
      },
      lede: pick(".hero-lede"),
      cta: pick(".look--hero .cta-trial"),
      process: pick(".process-link"),
      midCta: pick("#solution .cta-trial"),
      footCta: pick("#contact .cta-trial"),
      footerEmail: pick(".footer-email"),
      footerAbout: pick(".footer-about"),
      copyright: pick(".copyright"),
      social: pick(".social-links a"),
      deskTop: +deskR.top.toFixed(1),
      deskH: +deskR.height.toFixed(1),
      ruleBottom: +ruleR.bottom.toFixed(1),
      demo: pick(".demo-video"),
      frame: pick(".demo-frame"),
      poster: video?.getAttribute("poster"),
      src: video?.querySelector("source")?.getAttribute("src"),
      loop: video?.loop,
      controls: video?.controls,
      h2s: [...document.querySelectorAll("section h2, footer h2")].map((el) => {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return {
          id: el.closest("section,footer")?.id,
          fontSize: cs.fontSize,
          maxW: cs.maxWidth,
          w: +r.width.toFixed(1),
          chApprox: +(r.width / parseFloat(cs.fontSize)).toFixed(1),
          text: el.textContent.trim().slice(0, 70),
        };
      }),
      ctas: [...document.querySelectorAll(".cta-trial")].map((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return {
          parent: el.closest("header,section,footer")?.id || "?",
          w: +r.width.toFixed(1),
          h: +r.height.toFixed(1),
          area: +(r.width * r.height).toFixed(0),
          fontSize: cs.fontSize,
          display: cs.display,
        };
      }),
      hasPartnerStrip: !!document.querySelector(".partner-strip"),
      hasContext: !!document.querySelector("#context"),
      hasLookInk: !!document.querySelector(".look--ink"),
      hasEm: !!document.querySelector(".em"),
      mechanism: pick(".mechanism"),
      urgencyP: pick("#urgency p"),
      problemP: pick("#problem p"),
      problemInner: pick("#problem .look-inner"),
      proofInner: pick("#partners .look-inner"),
      storyInner: pick("#urgency .look-inner"),
      solutionTitleInner: pick("#solution > .look-inner:first-of-type"),
      afterDemo: pick(".look-inner--after-demo"),
      footer: pick("#contact"),
      footerInner: pick("#contact .look-inner"),
      bodyBg: getComputedStyle(document.body).backgroundColor,
      footerBg: getComputedStyle(document.querySelector("#contact")).backgroundColor,
      heroRightEmpty: (() => {
        const frame = document.querySelector(".hero-frame").getBoundingClientRect();
        const val = document.querySelector(".headline-validation").getBoundingClientRect();
        return +((frame.width - (val.right - frame.left)) / frame.width).toFixed(3);
      })(),
      processVsCta: (() => {
        const c = document.querySelector(".look--hero .cta-trial").getBoundingClientRect();
        const p = document.querySelector(".process-link").getBoundingClientRect();
        return {
          ctaBottom: +c.bottom.toFixed(1),
          processTop: +p.top.toFixed(1),
          gap: +(p.top - c.bottom).toFixed(1),
          ctaFs: getComputedStyle(document.querySelector(".look--hero .cta-trial")).fontSize,
          processFs: getComputedStyle(document.querySelector(".process-link")).fontSize,
        };
      })(),
      footerStack: {
        h2Bottom: +fh.bottom.toFixed(1),
        ctaTop: +fc.top.toFixed(1),
        ctaBottom: +fc.bottom.toFixed(1),
        aboutTop: +fa.top.toFixed(1),
        aboutBottom: +fa.bottom.toFixed(1),
        emailTop: +fe.top.toFixed(1),
        emailX: +fe.x.toFixed(1),
        ctaX: +fc.x.toFixed(1),
        emailBesideCta: Math.abs(fe.top - fc.top) < 20 && fe.x > fc.x + 40,
        aboutBetweenCtaAndEmail: fa.top > fc.bottom && fa.bottom < fe.top + 1,
        order: [
          "h2@" + Math.round(fh.top),
          "cta@" + Math.round(fc.top),
          "about@" + Math.round(fa.top),
          "email@" + Math.round(fe.top),
        ],
      },
      brandAlign: (() => {
        const m = document.querySelector(".brand-mark").getBoundingClientRect();
        const w = document.querySelector(".wordmark").getBoundingClientRect();
        return {
          markTop: +m.top.toFixed(1),
          markH: +m.height.toFixed(1),
          wordTop: +w.top.toFixed(1),
          wordH: +w.height.toFixed(1),
          markCenter: +(m.top + m.height / 2).toFixed(1),
          wordCenter: +(w.top + w.height / 2).toFixed(1),
          deltaCenter: +(m.top + m.height / 2 - (w.top + w.height / 2)).toFixed(1),
        };
      })(),
      indices: [...document.querySelectorAll(".look-index")].map((a) => ({
        href: a.getAttribute("href"),
        text: a.textContent.trim(),
        active: a.classList.contains("is-active"),
      })),
      sectionIds: [...document.querySelectorAll("header[id], section[id], footer[id]")].map(
        (el) => el.id
      ),
      lookPad: [...document.querySelectorAll("header.look, section.look, footer.look")].map(
        (el) => {
          const r = el.getBoundingClientRect();
          const inner = el.querySelector(".look-inner, .hero-frame");
          const ir = inner?.getBoundingClientRect();
          const ics = inner ? getComputedStyle(inner) : null;
          return {
            id: el.id,
            h: +r.height.toFixed(0),
            pad: ics?.padding,
            contentH: ir ? +(ir.height - (parseFloat(ics.paddingTop) + parseFloat(ics.paddingBottom))).toFixed(0) : null,
            ratioPad: ir
              ? +(
                  (parseFloat(ics.paddingTop) + parseFloat(ics.paddingBottom)) /
                  ir.height
                ).toFixed(2)
              : null,
          };
        }
      ),
      problemMeasure: (() => {
        const p = document.querySelector("#problem p");
        const cs = getComputedStyle(p);
        const r = p.getBoundingClientRect();
        return {
          maxW: cs.maxWidth,
          w: +r.width.toFixed(1),
          ch: +(r.width / parseFloat(cs.fontSize)).toFixed(1),
          fontSize: cs.fontSize,
        };
      })(),
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
      bonePlateOpacity: getComputedStyle(document.querySelector(".hero-bone-plate")).opacity,
      wash: (() => {
        const after = getComputedStyle(document.querySelector(".hero-frame"), "::after");
        return { height: after.height, top: after.top, bg: after.backgroundImage.slice(0, 80) };
      })(),
    };
  });

  desk.validationContrast = +contrast(rgb(desk.valText.color), rgb(desk.bodyBg)).toFixed(2);
  desk.ctaContrast = +contrast(rgb(desk.cta.color), rgb(desk.cta.bg)).toFixed(2);
  desk.ctaVsValArea = +(desk.cta.area / desk.valText.area).toFixed(2);
  desk.mutedContrast = +contrast(rgb(desk.process.color), rgb(desk.bodyBg)).toFixed(2);
  const footInk = rgb(desk.footerBg);
  const emailComp = rgb(desk.footerEmail.color);
  const copyComp = rgb(desk.copyright.color);
  // approximate alpha from rgba string
  const emailA = (() => {
    const m = String(desk.footerEmail.color).match(/[\d.]+/g);
    return m && m[3] !== undefined ? parseFloat(m[3]) : 1;
  })();
  const copyA = (() => {
    const m = String(desk.copyright.color).match(/[\d.]+/g);
    return m && m[3] !== undefined ? parseFloat(m[3]) : 1;
  })();
  const emailBlend = blendOver(emailComp, footInk, emailA);
  const copyBlend = blendOver(copyComp, footInk, copyA);
  const aboutA = (() => {
    const m = String(desk.footerAbout.color).match(/[\d.]+/g);
    return m && m[3] !== undefined ? parseFloat(m[3]) : 1;
  })();
  const aboutBlend = blendOver(rgb(desk.footerAbout.color), footInk, aboutA);
  desk.footerEmailContrastBlended = +contrast(emailBlend, footInk).toFixed(2);
  desk.copyrightContrastBlended = +contrast(copyBlend, footInk).toFixed(2);
  desk.footerAboutContrastBlended = +contrast(aboutBlend, footInk).toFixed(2);

  await page.screenshot({ path: path.join(out, "capture-hero.png"), fullPage: false });

  await page.locator("#demo").scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);
  const demoPaint = await page.evaluate(async () => {
    const v = document.querySelector(".demo-video");
    const r = v.getBoundingClientRect();
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, v.clientWidth);
    canvas.height = Math.max(1, v.clientHeight);
    const ctx = canvas.getContext("2d");
    const img = new Image();
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
      img.src = v.getAttribute("poster");
    });
    const ir = img.width / img.height;
    const vr = canvas.width / canvas.height;
    let dw, dh, dx, dy;
    if (ir > vr) {
      dw = canvas.width;
      dh = dw / ir;
      dx = 0;
      dy = (canvas.height - dh) / 2;
    } else {
      dh = canvas.height;
      dw = dh * ir;
      dx = (canvas.width - dw) / 2;
      dy = 0;
    }
    ctx.fillStyle = getComputedStyle(v).backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, dx, dy, dw, dh);
    // approximate sepia(0.12) contrast(0.96) brightness(0.98) on mid sample
    const sample = (x, y) => {
      const d = ctx.getImageData(
        Math.min(canvas.width - 1, Math.max(0, x)),
        Math.min(canvas.height - 1, Math.max(0, y)),
        1,
        1
      ).data;
      return [d[0], d[1], d[2]];
    };
    const midRaw = sample(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2));
    const whiteShare = (() => {
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let nearWhite = 0;
      let n = 0;
      for (let i = 0; i < data.length; i += 16) {
        n++;
        if (data[i] > 245 && data[i + 1] > 245 && data[i + 2] > 245) nearWhite++;
      }
      return +(nearWhite / n).toFixed(3);
    })();
    return {
      w: +r.width.toFixed(1),
      h: +r.height.toFixed(1),
      maxHeight: getComputedStyle(v).maxHeight,
      objectFit: getComputedStyle(v).objectFit,
      bg: getComputedStyle(v).backgroundColor,
      filter: getComputedStyle(v).filter,
      midRaw,
      corners: [sample(2, 2), sample(canvas.width - 3, 2), sample(2, canvas.height - 3)],
      imgW: img.width,
      imgH: img.height,
      letterboxDx: +dx.toFixed(1),
      letterboxDy: +dy.toFixed(1),
      whiteShare,
      aspect: getComputedStyle(v).aspectRatio,
    };
  });
  desk.demoPaint = demoPaint;
  await page.screenshot({ path: path.join(out, "capture-demo.png"), fullPage: false });

  await page.locator("#urgency").scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(out, "capture-urgency.png"), fullPage: false });

  await page.locator("#partners").scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(out, "capture-partners.png"), fullPage: false });

  await page.locator("#contact").scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(out, "capture-footer.png"), fullPage: false });

  desk.rhythm = await page.evaluate(() => {
    return [...document.querySelectorAll("header.look, section.look, footer.look")].map(
      (el) => {
        const r = el.getBoundingClientRect();
        return {
          id: el.id,
          h: +r.height.toFixed(0),
          top: +(r.top + window.scrollY).toFixed(0),
          bg: getComputedStyle(el).backgroundColor,
          borderTop: getComputedStyle(el).borderTop,
        };
      }
    );
  });

  // intermediate breakpoint: hero nowrap overflow risk
  const mid = await browser.newPage({ viewport: { width: 1024, height: 720 } });
  await mid.goto("http://127.0.0.1:8107/", { waitUntil: "networkidle" });
  await mid.waitForTimeout(500);
  const midBp = await mid.evaluate(() => {
    const main = document.querySelector(".headline-main");
    const val = document.querySelector(".headline-validation");
    const frame = document.querySelector(".hero-frame").getBoundingClientRect();
    const cta = document.querySelector(".look--hero .cta-trial").getBoundingClientRect();
    const desk = document.querySelector(".hero-desk").getBoundingClientRect();
    const process = document.querySelector(".process-link").getBoundingClientRect();
    return {
      frameW: +frame.width.toFixed(1),
      frameH: +frame.height.toFixed(1),
      main: {
        fontSize: getComputedStyle(main).fontSize,
        scroll: main.scrollWidth,
        client: main.clientWidth,
        overflow: main.scrollWidth > main.clientWidth + 1,
        whiteSpace: getComputedStyle(main).whiteSpace,
      },
      val: {
        fontSize: getComputedStyle(val).fontSize,
        scroll: val.scrollWidth,
        client: val.clientWidth,
        overflow: val.scrollWidth > val.clientWidth + 1,
      },
      ctaBottom: +cta.bottom.toFixed(1),
      deskTop: +desk.top.toFixed(1),
      processBottom: +process.bottom.toFixed(1),
      processFs: getComputedStyle(document.querySelector(".process-link")).fontSize,
      ctaFs: getComputedStyle(document.querySelector(".look--hero .cta-trial")).fontSize,
      gap: +(process.top - cta.bottom).toFixed(1),
    };
  });
  await mid.close();

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto("http://127.0.0.1:8107/", { waitUntil: "networkidle" });
  await mobile.waitForTimeout(700);
  const m = await mobile.evaluate(() => {
    const h2s = [...document.querySelectorAll("section h2, footer h2")].map((el) => ({
      id: el.closest("section,footer")?.id,
      fontSize: getComputedStyle(el).fontSize,
      text: el.textContent.trim().slice(0, 48),
    }));
    const cta = document.querySelector(".look--hero .cta-trial");
    const cr = cta.getBoundingClientRect();
    const deskEl = document.querySelector(".hero-desk").getBoundingClientRect();
    const process = document.querySelector(".process-link").getBoundingClientRect();
    const lede = document.querySelector(".hero-lede");
    const partners = document.querySelector("#partners").getBoundingClientRect();
    const footCta = document.querySelector("#contact .cta-trial").getBoundingClientRect();
    const footAbout = document.querySelector(".footer-about").getBoundingClientRect();
    const footEmail = document.querySelector(".footer-email").getBoundingClientRect();
    const main = document.querySelector(".headline-main");
    const val = document.querySelector(".headline-validation");
    return {
      h2s,
      lede: {
        fontSize: getComputedStyle(lede).fontSize,
        color: getComputedStyle(lede).color,
      },
      cta: {
        w: +cr.width.toFixed(1),
        h: +cr.height.toFixed(1),
        fontSize: getComputedStyle(cta).fontSize,
        bottom: +cr.bottom.toFixed(1),
      },
      processBottom: +process.bottom.toFixed(1),
      processFs: getComputedStyle(document.querySelector(".process-link")).fontSize,
      deskTop: +deskEl.top.toFixed(1),
      deskClear: +(deskEl.top - process.bottom).toFixed(1),
      heroH: +document.querySelector(".hero-frame").getBoundingClientRect().height.toFixed(1),
      partnersH: +partners.height.toFixed(1),
      partnersText: document.querySelector("#partners h2").textContent.trim(),
      footerOrder: {
        ctaBottom: +footCta.bottom.toFixed(1),
        aboutTop: +footAbout.top.toFixed(1),
        emailTop: +footEmail.top.toFixed(1),
        aboutBetween: footAbout.top > footCta.bottom && footAbout.bottom <= footEmail.top + 2,
      },
      nowrap: {
        mainOverflow: main.scrollWidth > main.clientWidth + 1,
        valOverflow: val.scrollWidth > val.clientWidth + 1,
        mainFs: getComputedStyle(main).fontSize,
        valFs: getComputedStyle(val).fontSize,
      },
      lookPad: [...document.querySelectorAll("section.look .look-inner, footer.look .look-inner")].map(
        (el) => ({
          id: el.closest("section,footer")?.id,
          pad: getComputedStyle(el).padding,
          h: +el.getBoundingClientRect().height.toFixed(0),
        })
      ),
    };
  });
  await mobile.screenshot({
    path: path.join(out, "capture-mobile-hero.png"),
    fullPage: false,
  });
  await mobile.locator("#partners").scrollIntoViewIfNeeded();
  await mobile.waitForTimeout(200);
  await mobile.screenshot({
    path: path.join(out, "capture-mobile-partners.png"),
    fullPage: false,
  });
  await mobile.locator("#contact").scrollIntoViewIfNeeded();
  await mobile.waitForTimeout(200);
  await mobile.screenshot({
    path: path.join(out, "capture-mobile-footer.png"),
    fullPage: false,
  });

  let live8080 = null;
  try {
    const live = await browser.newPage();
    await live.goto("http://127.0.0.1:8080/", {
      waitUntil: "domcontentloaded",
      timeout: 8000,
    });
    live8080 = await live.evaluate(() => ({
      hasClay: !!document.querySelector('source[src*="clay"]'),
      has2025: (document.body.innerText || "").includes("2025"),
      hasPartnerStrip: !!document.querySelector(".partner-strip"),
      hasProcessStill: !!document.querySelector('video[poster*="process-still"]'),
      hasContext: !!document.querySelector("#context"),
      hasFooterAbout: !!document.querySelector(".footer-about"),
      ledeSize: getComputedStyle(document.querySelector(".hero-lede") || document.body)
        .fontSize,
      ctaCount: document.querySelectorAll(".cta-trial").length,
      hasLookInk: !!document.querySelector(".look--ink"),
      processFs: getComputedStyle(document.querySelector(".process-link") || document.body)
        .fontSize,
      title: document.title,
    }));
    await live.close();
  } catch (e) {
    live8080 = { error: String(e) };
  }

  const metrics = { desktop: desk, midBp, mobile: m, live8080 };
  fs.writeFileSync(path.join(out, "metrics.json"), JSON.stringify(metrics, null, 2));
  console.log(JSON.stringify(metrics, null, 2));
  await browser.close();
  server.close();
});
