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

server.listen(8099, async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto("http://127.0.0.1:8099/", { waitUntil: "networkidle" });
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
        area: +(r.width * r.height).toFixed(0),
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
      deskTop: +deskR.top.toFixed(1),
      deskH: +deskR.height.toFixed(1),
      ruleBottom: +ruleR.bottom.toFixed(1),
      ruleH: +ruleR.height.toFixed(1),
      demo: pick(".demo-video"),
      frame: pick(".demo-frame"),
      poster: video?.getAttribute("poster"),
      src: video?.querySelector("source")?.getAttribute("src"),
      h2s: [...document.querySelectorAll("section h2, footer h2")].map((el) => {
        const cs = getComputedStyle(el);
        return {
          id: el.closest("section,footer")?.id,
          fontSize: cs.fontSize,
          text: el.textContent.trim().slice(0, 52),
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
          text: li.querySelector("span")?.textContent,
          imgW: ir ? +ir.width.toFixed(1) : 0,
          imgH: ir ? +ir.height.toFixed(1) : 0,
          blend: img ? getComputedStyle(img).mixBlendMode : null,
        };
      }),
      aboutBg: getComputedStyle(document.querySelector("#context")).backgroundColor,
      footerBg: getComputedStyle(document.querySelector("#contact")).backgroundColor,
      aboutH: document.querySelector("#context").getBoundingClientRect().height,
      footerH: document.querySelector("#contact").getBoundingClientRect().height,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      urgencyEm: getComputedStyle(document.querySelector("#urgency .em")).fontStyle,
      lookInnerPad: getComputedStyle(document.querySelector("#problem .look-inner")).padding,
      solutionTitlePad: getComputedStyle(
        document.querySelector("#solution > .look-inner")
      ).padding,
      afterDemoPad: getComputedStyle(
        document.querySelector(".look-inner--after-demo")
      ).padding,
      caption: document.querySelector(".demo-caption")?.textContent,
      mechanism: document.querySelector(".mechanism")?.textContent,
      privacy: [...document.querySelectorAll(".footer-legal a")].map((a) =>
        a.getAttribute("href")
      ),
      inkStackGap: (() => {
        const a = document.querySelector("#context").getBoundingClientRect();
        const f = document.querySelector("#contact").getBoundingClientRect();
        return +(f.top - a.bottom).toFixed(1);
      })(),
      heroRightEmpty: (() => {
        const frame = document.querySelector(".hero-frame").getBoundingClientRect();
        const val = document.querySelector(".headline-validation").getBoundingClientRect();
        return +((frame.width - (val.right - frame.left)) / frame.width).toFixed(3);
      })(),
      nowrapOverflow: (() => {
        const main = document.querySelector(".headline-main");
        return {
          mainScroll: main.scrollWidth,
          mainClient: main.clientWidth,
          overflow: main.scrollWidth > main.clientWidth + 1,
        };
      })(),
    };
  });

  desk.validationContrast = +contrast(rgb(desk.valText.color), rgb(desk.bodyBg)).toFixed(2);
  desk.ctaContrast = +contrast(rgb(desk.cta.color), rgb(desk.cta.bg)).toFixed(2);
  desk.ctaVsValArea = +(desk.cta.area / desk.valText.area).toFixed(2);

  await page.screenshot({ path: path.join(out, "capture-hero.png"), fullPage: false });
  await page.locator("#demo").scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);
  const demoPaint = await page.evaluate(() => {
    const v = document.querySelector(".demo-video");
    const r = v.getBoundingClientRect();
    return {
      w: +r.width.toFixed(1),
      h: +r.height.toFixed(1),
      maxHeight: getComputedStyle(v).maxHeight,
      readyState: v.readyState,
      poster: v.getAttribute("poster"),
    };
  });
  desk.demoPaint = demoPaint;
  await page.screenshot({ path: path.join(out, "capture-demo.png"), fullPage: false });

  await page.locator("#partners").scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(out, "capture-partners.png"), fullPage: false });

  await page.locator("#context").scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await page.screenshot({
    path: path.join(out, "capture-about-footer.png"),
    fullPage: false,
  });

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await mobile.goto("http://127.0.0.1:8099/", { waitUntil: "networkidle" });
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
    const desk = document.querySelector(".hero-desk").getBoundingClientRect();
    const process = document.querySelector(".process-link").getBoundingClientRect();
    return {
      h2s,
      cta: {
        w: +cr.width.toFixed(1),
        h: +cr.height.toFixed(1),
        fontSize: getComputedStyle(cta).fontSize,
        bottom: +cr.bottom.toFixed(1),
      },
      processBottom: +process.bottom.toFixed(1),
      deskTop: +desk.top.toFixed(1),
      deskOverlap: +(process.bottom - desk.top).toFixed(1),
      heroH: +document.querySelector(".hero-frame").getBoundingClientRect().height.toFixed(1),
    };
  });
  await mobile.screenshot({
    path: path.join(out, "capture-mobile-hero.png"),
    fullPage: false,
  });

  // sample process-still pixels for contrast (load in page)
  await page.goto("http://127.0.0.1:8099/img/plates/process-still.png");
  // skip; already visually inspected

  const metrics = { desktop: desk, mobile: m };
  fs.writeFileSync(path.join(out, "metrics.json"), JSON.stringify(metrics, null, 2));
  console.log(JSON.stringify(metrics, null, 2));
  await browser.close();
  server.close();
});
