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
  ".woff": "font/woff",
  ".woff2": "font/woff2",
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
function alpha(str) {
  const m = String(str).match(/[\d.]+/g);
  return m && m[3] !== undefined ? parseFloat(m[3]) : 1;
}

server.listen(8108, async () => {
  const browser = await chromium.launch({ headless: true });
  const metrics = {};

  async function measure(label, w, h) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.goto("http://127.0.0.1:8108/", { waitUntil: "networkidle" });
    await page.waitForTimeout(700);

    const data = await page.evaluate(() => {
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
          area: +(r.width * r.height).toFixed(0),
          display: cs.display,
          overflow: {
            sw: el.scrollWidth,
            cw: el.clientWidth,
            overflow: el.scrollWidth > el.clientWidth + 1,
          },
          whiteSpace: cs.whiteSpace,
          position: cs.position,
          pad: cs.padding,
          ff: cs.fontFamily.split(",")[0].replace(/"/g, ""),
        };
      };
      const desk = document.querySelector(".hero-desk")?.getBoundingClientRect();
      const heroFrame = document.querySelector(".hero-frame");
      const fr = heroFrame?.getBoundingClientRect();
      const cta = document.querySelector(".look--hero .cta-trial");
      const process = document.querySelector(".process-link");
      const val = document.querySelector(".headline-validation-text");
      const valR = val?.getBoundingClientRect();
      const foot = document.querySelector("#contact");
      const partners = document.querySelector("#partners");
      const strip = document.querySelector(".partner-strip");
      const mech = document.querySelector(".mechanism");
      const demo = document.querySelector("#demo");
      const after = document.querySelector(".look-inner--after-demo");
      const orderY = {
        solutionTitle: document.querySelector("#solution-title")?.getBoundingClientRect().top,
        mechanism: mech?.getBoundingClientRect().top,
        demo: demo?.getBoundingClientRect().top,
        midCta: after?.querySelector(".cta-trial")?.getBoundingClientRect().top,
      };
      return {
        vw: window.innerWidth,
        vh: window.innerHeight,
        heroFrame: fr
          ? {
              w: +fr.width.toFixed(1),
              h: +fr.height.toFixed(1),
              aspect: +(fr.width / fr.height).toFixed(3),
            }
          : null,
        main: pick(".headline-main"),
        validation: pick(".headline-validation"),
        valText: val
          ? {
              w: +valR.width.toFixed(1),
              h: +valR.height.toFixed(1),
              area: +(valR.width * valR.height).toFixed(0),
              color: getComputedStyle(val).color,
              border: getComputedStyle(val).borderBottom,
            }
          : null,
        lede: pick(".hero-lede"),
        cta: pick(".look--hero .cta-trial"),
        process: pick(".process-link"),
        deskTop: desk ? +desk.top.toFixed(1) : null,
        deskH: desk ? +desk.height.toFixed(1) : null,
        processVsCta:
          cta && process
            ? {
                ctaBottom: +cta.getBoundingClientRect().bottom.toFixed(1),
                processTop: +process.getBoundingClientRect().top.toFixed(1),
                gap: +(
                  process.getBoundingClientRect().top - cta.getBoundingClientRect().bottom
                ).toFixed(1),
                ctaFs: getComputedStyle(cta).fontSize,
                processFs: getComputedStyle(process).fontSize,
                processBottom: +process.getBoundingClientRect().bottom.toFixed(1),
              }
            : null,
        ctaClearDesk: cta && desk ? +(desk.top - cta.getBoundingClientRect().bottom).toFixed(1) : null,
        processClearDesk:
          process && desk
            ? +(desk.top - process.getBoundingClientRect().bottom).toFixed(1)
            : null,
        footCta: pick("#contact .cta-trial"),
        footerBg: foot ? getComputedStyle(foot).backgroundColor : null,
        footEmail: pick(".footer-email"),
        footAbout: pick(".footer-about"),
        copyright: pick(".copyright"),
        social: pick(".social-links a"),
        footerOrder: [...document.querySelectorAll("#contact .look-inner > *")].map((el) => ({
          tag:
            el.tagName.toLowerCase() +
            (el.className ? "." + String(el.className).split(" ")[0] : ""),
          top: +el.getBoundingClientRect().top.toFixed(1),
          text: el.textContent.trim().slice(0, 48),
        })),
        h2s: [...document.querySelectorAll("section h2, footer h2")].map((el) => {
          const cs = getComputedStyle(el);
          const r = el.getBoundingClientRect();
          return {
            id: el.closest("section,footer")?.id,
            fs: cs.fontSize,
            text: el.textContent.trim().slice(0, 50),
            top: +r.top.toFixed(1),
          };
        }),
        partners: {
          line: pick(".partners-line"),
          strip: pick(".partner-strip"),
          stripH: strip ? +strip.getBoundingClientRect().height.toFixed(1) : null,
          markCount: strip ? strip.querySelectorAll("img").length : 0,
          lookH: partners ? +partners.getBoundingClientRect().height.toFixed(0) : null,
          pad: partners ? getComputedStyle(partners.querySelector(".look-inner")).padding : null,
          imgs: strip
            ? [...strip.querySelectorAll("img")].map((img) => {
                const r = img.getBoundingClientRect();
                return { alt: img.alt, w: +r.width.toFixed(1), h: +r.height.toFixed(1) };
              })
            : [],
          doublePrint: !!(
            document.querySelector(".partners-line") && document.querySelector(".partner-strip")
          ),
        },
        solutionOrder: orderY,
        mechanismBeforeDemo:
          orderY.mechanism != null && orderY.demo != null && orderY.mechanism < orderY.demo,
        midCta: pick("#solution .cta-trial"),
        problem: {
          h2: pick("#problem-title"),
          p: pick("#problem p"),
          lookH: +document.querySelector("#problem").getBoundingClientRect().height.toFixed(0),
          pad: getComputedStyle(document.querySelector("#problem .look-inner")).padding,
          ch: (() => {
            const p = document.querySelector("#problem p");
            const r = p.getBoundingClientRect();
            return +(r.width / parseFloat(getComputedStyle(p).fontSize)).toFixed(1);
          })(),
          wordCount: document.querySelector("#problem p").textContent.trim().split(/\s+/).length,
        },
        urgency: {
          lookH: +document.querySelector("#urgency").getBoundingClientRect().height.toFixed(0),
          pad: getComputedStyle(document.querySelector("#urgency .look-inner")).padding,
          h2: pick("#urgency h2"),
          p: pick("#urgency p"),
          wordCount: document.querySelector("#urgency p").textContent.trim().split(/\s+/).length,
        },
        demoVideo: pick(".demo-video"),
        demoFrame: pick(".demo-frame"),
        poster: document.querySelector(".demo-video")?.getAttribute("poster"),
        src: document.querySelector(".demo-video source")?.getAttribute("src"),
        videoFilter: getComputedStyle(document.querySelector(".demo-video")).filter,
        heroRightEmpty:
          fr && valR ? +((fr.width - (valR.right - fr.left)) / fr.width).toFixed(3) : null,
        sectionIds: [...document.querySelectorAll("header[id],section[id],footer[id]")].map(
          (e) => e.id
        ),
        indices: [...document.querySelectorAll(".look-index")].map((a) => ({
          href: a.getAttribute("href"),
          text: a.textContent.trim(),
        })),
        clay: !!document.body.innerHTML.match(/clay|By 2025|look--ink|Fredoka/i),
        bodyBg: getComputedStyle(document.body).backgroundColor,
        bonePlateOp: getComputedStyle(document.querySelector(".hero-bone-plate")).opacity,
        lookPad: [...document.querySelectorAll("header.look, section.look, footer.look")].map(
          (el) => {
            const r = el.getBoundingClientRect();
            const inner = el.querySelector(".look-inner, .hero-frame");
            const ics = inner ? getComputedStyle(inner) : null;
            const ir = inner?.getBoundingClientRect();
            return {
              id: el.id,
              h: +r.height.toFixed(0),
              pad: ics?.padding,
              ratioPad:
                ir && ics
                  ? +(
                      (parseFloat(ics.paddingTop) + parseFloat(ics.paddingBottom)) /
                      ir.height
                    ).toFixed(2)
                  : null,
            };
          }
        ),
        brand: pick(".brand"),
        mark: pick(".brand-mark"),
        wordmark: pick(".wordmark"),
        mechanism: pick(".mechanism"),
        solutionTitleInner: pick("#solution > .look-inner:first-of-type"),
        afterDemo: pick(".look-inner--after-demo"),
        pageScrollHeight: document.documentElement.scrollHeight,
        midCtaIsolation: (() => {
          const c = after?.querySelector(".cta-trial");
          if (!c) return null;
          const r = c.getBoundingClientRect();
          const parent = after.getBoundingClientRect();
          return {
            ctaH: +r.height.toFixed(1),
            bandH: +parent.height.toFixed(1),
            padTop: getComputedStyle(after).paddingTop,
            padBottom: getComputedStyle(after).paddingBottom,
            loneChild: after.children.length === 1,
          };
        })(),
      };
    });

    if (data.valText)
      data.validationContrast = +contrast(rgb(data.valText.color), rgb(data.bodyBg)).toFixed(2);
    if (data.cta) data.ctaContrast = +contrast(rgb(data.cta.color), rgb(data.cta.bg)).toFixed(2);
    if (data.cta && data.valText) data.ctaVsValArea = +(data.cta.area / data.valText.area).toFixed(2);
    if (data.process)
      data.mutedContrast = +contrast(rgb(data.process.color), rgb(data.bodyBg)).toFixed(2);
    if (data.footCta && data.footerBg) {
      data.footerSameFill = data.footCta.bg === data.footerBg;
      data.footerCtaContrast = +contrast(rgb(data.footCta.color), rgb(data.footCta.bg)).toFixed(2);
      data.footerPlaqueVsField = +contrast(rgb(data.footCta.bg), rgb(data.footerBg)).toFixed(2);
    }
    if (data.copyright && data.footerBg) {
      data.copyrightContrastBlended = +contrast(
        blendOver(rgb(data.copyright.color), rgb(data.footerBg), alpha(data.copyright.color)),
        rgb(data.footerBg)
      ).toFixed(2);
    }
    if (data.footAbout && data.footerBg) {
      data.aboutContrastBlended = +contrast(
        blendOver(rgb(data.footAbout.color), rgb(data.footerBg), alpha(data.footAbout.color)),
        rgb(data.footerBg)
      ).toFixed(2);
    }
    if (data.footEmail && data.footerBg) {
      data.emailContrastBlended = +contrast(
        blendOver(rgb(data.footEmail.color), rgb(data.footerBg), alpha(data.footEmail.color)),
        rgb(data.footerBg)
      ).toFixed(2);
    }

    await page.screenshot({
      path: path.join(out, "capture-" + label + "-hero.png"),
      fullPage: false,
    });

    await page.locator("#demo").scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    const box = await page.locator(".demo-video").boundingBox();
    if (box) {
      const shot = await page.screenshot({
        type: "png",
        clip: {
          x: Math.max(0, box.x),
          y: Math.max(0, box.y),
          width: Math.min(box.width, w - Math.max(0, box.x)),
          height: Math.min(box.height, h - Math.max(0, box.y)),
        },
      });
      let demoPaint = { method: "none" };
      try {
        const sharp = require("sharp");
        const { data: raw, info } = await sharp(shot)
          .raw()
          .ensureAlpha()
          .toBuffer({ resolveWithObject: true });
        const midX = Math.floor(info.width / 2);
        const midY = Math.floor(info.height / 2);
        const mi = (midY * info.width + midX) * 4;
        let nearWhite = 0;
        let nearBone = 0;
        const n = info.width * info.height;
        for (let i = 0; i < raw.length; i += 4) {
          if (raw[i] > 240 && raw[i + 1] > 240 && raw[i + 2] > 240) nearWhite++;
          // bone ~246,244,239 or bone-deep ~234,232,227
          const dr = Math.abs(raw[i] - 246) + Math.abs(raw[i + 1] - 244) + Math.abs(raw[i + 2] - 239);
          const dd = Math.abs(raw[i] - 234) + Math.abs(raw[i + 1] - 232) + Math.abs(raw[i + 2] - 227);
          if (dr < 18 || dd < 18) nearBone++;
        }
        const corner = (x, y) => {
          const i = (y * info.width + x) * 4;
          return [raw[i], raw[i + 1], raw[i + 2]];
        };
        demoPaint = {
          method: "sharp-clip",
          mid: [raw[mi], raw[mi + 1], raw[mi + 2]],
          whiteShare: +(nearWhite / n).toFixed(3),
          boneShare: +(nearBone / n).toFixed(3),
          corners: [
            corner(2, 2),
            corner(info.width - 3, 2),
            corner(2, info.height - 3),
            corner(info.width - 3, info.height - 3),
          ],
          w: info.width,
          h: info.height,
        };
      } catch (e) {
        demoPaint = { method: "error", error: String(e.message || e) };
      }
      data.demoPaint = demoPaint;
    }

    await page.screenshot({
      path: path.join(out, "capture-" + label + "-demo.png"),
      fullPage: false,
    });

    if (await page.locator("#partners").count()) {
      await page.locator("#partners").scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      await page.screenshot({
        path: path.join(out, "capture-" + label + "-partners.png"),
        fullPage: false,
      });
    }

    await page.locator("#contact").scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await page.screenshot({
      path: path.join(out, "capture-" + label + "-footer.png"),
      fullPage: false,
    });

    metrics[label] = data;
    await page.close();
  }

  await measure("d1280", 1280, 720);
  await measure("w1120", 1120, 720);
  await measure("w1200", 1200, 720);
  await measure("w1024", 1024, 720);
  await measure("m390", 390, 844);

  const cssSrc = fs.readFileSync(path.join(root, "css/styles.css"), "utf8");
  const htmlSrc = fs.readFileSync(path.join(root, "index.html"), "utf8");
  metrics.sourceDebt = {
    proofH2InCss: cssSrc.includes(".look.look--proof h2"),
    proofH2InHtml: /id="partners"[\s\S]*?<h2/.test(htmlSrc),
    partnersDoubleVoice:
      htmlSrc.includes("partners-line") && htmlSrc.includes("partner-strip"),
    indexCount: (htmlSrc.match(/class="look-index/g) || []).length,
    ctaCount: (htmlSrc.match(/class="cta-trial"/g) || []).length,
    deadSelectors: [
      ".em",
      ".look--ink",
      ".look-num",
      ".partners-lede",
      ".partners-cta",
      ".balance-grid",
      ".look h3",
      ".stat-link",
    ].filter((s) => cssSrc.includes(s)),
  };

  fs.writeFileSync(path.join(out, "metrics.json"), JSON.stringify(metrics, null, 2));

  const d = metrics.d1280;
  console.log(
    JSON.stringify(
      {
        clay: d.clay,
        footerSameFill: d.footerSameFill,
        footerPlaqueVsField: d.footerPlaqueVsField,
        footerCtaContrast: d.footerCtaContrast,
        copyright: d.copyrightContrastBlended,
        email: d.emailContrastBlended,
        about: d.aboutContrastBlended,
        mechanismBeforeDemo: d.mechanismBeforeDemo,
        demoPaint: d.demoPaint,
        videoFilter: d.videoFilter,
        ctaVsVal: d.ctaVsValArea,
        ctaArea: d.cta?.area,
        valArea: d.valText?.area,
        processGap: d.processVsCta,
        ctaClear: d.ctaClearDesk,
        processClear: d.processClearDesk,
        heroRight: d.heroRightEmpty,
        problemCh: d.problem.ch,
        problemWords: d.problem.wordCount,
        lookPad: d.lookPad,
        partners: d.partners,
        footerOrder: d.footerOrder.map((x) => x.tag),
        h2s: d.h2s,
        urgencyH: d.urgency.lookH,
        problemH: d.problem.lookH,
        midCtaIsolation: d.midCtaIsolation,
        mutedContrast: d.mutedContrast,
        w1120: {
          heroFrame: metrics.w1120.heroFrame,
          mainOverflow: metrics.w1120.main?.overflow,
          valOverflow: metrics.w1120.validation?.overflow,
          mainFs: metrics.w1120.main?.fontSize,
          position: metrics.w1120.main?.position,
          processGap: metrics.w1120.processVsCta,
          processClear: metrics.w1120.processClearDesk,
          ctaClear: metrics.w1120.ctaClearDesk,
          ctaVsVal: metrics.w1120.ctaVsValArea,
        },
        w1200: {
          heroFrame: metrics.w1200.heroFrame,
          mainOverflow: metrics.w1200.main?.overflow,
          valOverflow: metrics.w1200.validation?.overflow,
          mainFs: metrics.w1200.main?.fontSize,
          position: metrics.w1200.main?.position,
          processGap: metrics.w1200.processVsCta,
          processClear: metrics.w1200.processClearDesk,
          ctaClear: metrics.w1200.ctaClearDesk,
        },
        w1024: {
          position: metrics.w1024.main?.position,
          mainFs: metrics.w1024.main?.fontSize,
          processFs: metrics.w1024.processVsCta?.processFs,
          ctaFs: metrics.w1024.processVsCta?.ctaFs,
          processGap: metrics.w1024.processVsCta?.gap,
        },
        m390: {
          processFs: metrics.m390.processVsCta?.processFs,
          ctaFs: metrics.m390.processVsCta?.ctaFs,
          partnersH: metrics.m390.partners.lookH,
          stripH: metrics.m390.partners.stripH,
          processClear: metrics.m390.processClearDesk,
          ctaClear: metrics.m390.ctaClearDesk,
          demoPaint: metrics.m390.demoPaint,
          lookPad: metrics.m390.lookPad,
          midCtaIsolation: metrics.m390.midCtaIsolation,
        },
        sourceDebt: metrics.sourceDebt,
      },
      null,
      2
    )
  );

  await browser.close();
  server.close();
});
