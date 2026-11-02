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

server.listen(8106, async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto("http://127.0.0.1:8106/", { waitUntil: "networkidle" });
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
        maxW: cs.maxWidth,
        pad: cs.padding,
        lh: cs.lineHeight,
        border: cs.border,
        opacity: cs.opacity,
      };
    };
    const val = document.querySelector(".headline-validation-text");
    const valCS = getComputedStyle(val);
    const valR = val.getBoundingClientRect();
    const deskR = document.querySelector(".hero-desk").getBoundingClientRect();
    const ruleR = document.querySelector(".index-rule").getBoundingClientRect();
    const video = document.querySelector(".demo-video");
    return {
      brand: pick(".brand"),
      mark: pick(".brand-mark"),
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
      deskTop: +deskR.top.toFixed(1),
      deskH: +deskR.height.toFixed(1),
      ruleBottom: +ruleR.bottom.toFixed(1),
      demo: pick(".demo-video"),
      frame: pick(".demo-frame"),
      poster: video?.getAttribute("poster"),
      src: video?.querySelector("source")?.getAttribute("src"),
      h2s: [...document.querySelectorAll("section h2, footer h2")].map((el) => {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return {
          id: el.closest("section,footer")?.id,
          fontSize: cs.fontSize,
          maxW: cs.maxWidth,
          w: +r.width.toFixed(1),
          text: el.textContent.trim().slice(0, 60),
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
          bg: cs.backgroundColor,
        };
      }),
      partners: [...document.querySelectorAll(".partner-strip li")].map((li) => {
        const img = li.querySelector("img");
        const ir = img?.getBoundingClientRect();
        return {
          alt: img?.alt,
          imgW: ir ? +ir.width.toFixed(1) : 0,
          imgH: ir ? +ir.height.toFixed(1) : 0,
          blend: img ? getComputedStyle(img).mixBlendMode : null,
        };
      }),
      partnerStrip: pick(".partner-strip"),
      about: pick("#context"),
      footer: pick("#contact"),
      aboutBg: getComputedStyle(document.querySelector("#context")).backgroundColor,
      footerBg: getComputedStyle(document.querySelector("#contact")).backgroundColor,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      mechanism: pick(".mechanism"),
      urgencyP: pick("#urgency p"),
      aboutP: pick("#context p"),
      lookH3: !!document.querySelector(".look h3"),
      lookEm: !!document.querySelector(".em"),
      lookInk: !!document.querySelector(".look--ink"),
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
        };
      })(),
      bonePlate: pick(".hero-bone-plate"),
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
      socialColor: getComputedStyle(document.querySelector(".social-links a")).color,
      footerEmail: pick(".footer-email"),
      copyright: pick(".copyright"),
      problemInner: pick("#problem .look-inner"),
      quietInner: pick("#context .look-inner"),
      proofInner: pick("#partners .look-inner"),
      storyInner: pick("#urgency .look-inner"),
      solutionTitleInner: pick("#solution > .look-inner"),
      afterDemo: pick(".look-inner--after-demo"),
      nowrapOverflow: (() => {
        const main = document.querySelector(".headline-main");
        const val = document.querySelector(".headline-validation");
        return {
          main: {
            scroll: main.scrollWidth,
            client: main.clientWidth,
            overflow: main.scrollWidth > main.clientWidth + 1,
          },
          val: {
            scroll: val.scrollWidth,
            client: val.clientWidth,
            overflow: val.scrollWidth > val.clientWidth + 1,
          },
        };
      })(),
      secondaryEqualPrimary: (() => {
        const c = getComputedStyle(document.querySelector(".look--hero .cta-trial"));
        const p = getComputedStyle(document.querySelector(".process-link"));
        return {
          ctaFs: c.fontSize,
          processFs: p.fontSize,
          processColor: p.color,
          processDeco: p.textDecorationLine,
        };
      })(),
    };
  });

  desk.validationContrast = +contrast(rgb(desk.valText.color), rgb(desk.bodyBg)).toFixed(2);
  desk.ctaContrast = +contrast(rgb(desk.cta.color), rgb(desk.cta.bg)).toFixed(2);
  desk.ctaVsValArea = +(desk.cta.area / desk.valText.area).toFixed(2);
  desk.mutedContrast = +contrast(rgb(desk.process.color), rgb(desk.bodyBg)).toFixed(2);
  desk.footerEmailContrast = +contrast(
    rgb(desk.footerEmail.color),
    rgb(desk.footerBg)
  ).toFixed(2);
  desk.socialContrast = +contrast(rgb(desk.socialColor), rgb(desk.footerBg)).toFixed(2);
  desk.copyrightContrast = +contrast(
    rgb(desk.copyright.color),
    rgb(desk.footerBg)
  ).toFixed(2);

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
    img.crossOrigin = "anonymous";
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
    const sample = (x, y) => {
      const d = ctx.getImageData(
        Math.min(canvas.width - 1, Math.max(0, x)),
        Math.min(canvas.height - 1, Math.max(0, y)),
        1,
        1
      ).data;
      return [d[0], d[1], d[2]];
    };
    return {
      w: +r.width.toFixed(1),
      h: +r.height.toFixed(1),
      maxHeight: getComputedStyle(v).maxHeight,
      objectFit: getComputedStyle(v).objectFit,
      bg: getComputedStyle(v).backgroundColor,
      mid: sample(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2)),
      topContent: sample(Math.floor(canvas.width / 2), Math.floor(dy + 8)),
      corners: [sample(2, 2), sample(canvas.width - 3, 2), sample(2, canvas.height - 3)],
      imgW: img.width,
      imgH: img.height,
      letterboxDy: +dy.toFixed(1),
      letterboxDx: +dx.toFixed(1),
    };
  });
  desk.demoPaint = demoPaint;
  await page.screenshot({ path: path.join(out, "capture-demo.png"), fullPage: false });

  await page.locator("#urgency").scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(out, "capture-urgency.png"), fullPage: false });

  await page.locator("#partners").scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(out, "capture-partners.png"), fullPage: false });

  await page.locator("#context").scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await page.screenshot({
    path: path.join(out, "capture-about-footer.png"),
    fullPage: false,
  });

  desk.rhythm = await page.evaluate(() => {
    return [...document.querySelectorAll("header.look, section.look, footer.look")].map(
      (el) => {
        const r = el.getBoundingClientRect();
        return {
          id: el.id || el.className,
          h: +r.height.toFixed(0),
          top: +(r.top + window.scrollY).toFixed(0),
          bg: getComputedStyle(el).backgroundColor,
        };
      }
    );
  });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto("http://127.0.0.1:8106/", { waitUntil: "networkidle" });
  await mobile.waitForTimeout(700);
  const m = await mobile.evaluate(() => {
    const h2s = [...document.querySelectorAll("section h2, footer h2")].map((el) => {
      const cs = getComputedStyle(el);
      return {
        id: el.closest("section,footer")?.id,
        fontSize: cs.fontSize,
        text: el.textContent.trim().slice(0, 40),
      };
    });
    const cta = document.querySelector(".look--hero .cta-trial");
    const cr = cta.getBoundingClientRect();
    const deskEl = document.querySelector(".hero-desk").getBoundingClientRect();
    const process = document.querySelector(".process-link").getBoundingClientRect();
    const lede = document.querySelector(".hero-lede");
    const partners = document.querySelector("#partners").getBoundingClientRect();
    const strip = document.querySelector(".partner-strip").getBoundingClientRect();
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
      deskTop: +deskEl.top.toFixed(1),
      deskOverlap: +(process.bottom - deskEl.top).toFixed(1),
      heroH: +document.querySelector(".hero-frame").getBoundingClientRect().height.toFixed(1),
      partnersH: +partners.height.toFixed(1),
      stripH: +strip.height.toFixed(1),
      partnerImgs: [...document.querySelectorAll(".partner-strip img")].map((img) => {
        const r = img.getBoundingClientRect();
        return { w: +r.width.toFixed(1), h: +r.height.toFixed(1) };
      }),
      nowrap: {
        mainOverflow: main.scrollWidth > main.clientWidth + 1,
        valOverflow: val.scrollWidth > val.clientWidth + 1,
        mainScroll: main.scrollWidth,
        mainClient: main.clientWidth,
      },
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
      aboutClasses: document.querySelector("#context")?.className,
      ledeSize: getComputedStyle(document.querySelector(".hero-lede") || document.body)
        .fontSize,
      ctaCount: document.querySelectorAll(".cta-trial").length,
      hasLookInk: !!document.querySelector(".look--ink"),
    }));
    await live.close();
  } catch (e) {
    live8080 = { error: String(e) };
  }

  const metrics = { desktop: desk, mobile: m, live8080 };
  fs.writeFileSync(path.join(out, "metrics.json"), JSON.stringify(metrics, null, 2));
  console.log(JSON.stringify(metrics, null, 2));
  await browser.close();
  server.close();
});
