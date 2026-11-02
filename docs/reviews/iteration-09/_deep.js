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

server.listen(8111, async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto("http://127.0.0.1:8111/", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  const deep = await page.evaluate(() => {
    const cs = (el) => getComputedStyle(el);
    const r = (el) => el.getBoundingClientRect();
    const muted = document.querySelector(".mechanism-lms");
    const process = document.querySelector(".process-link");
    const after = document.querySelector(".look-inner--after-demo");
    const demo = document.querySelector("#demo");
    const frame = document.querySelector(".demo-frame");
    const video = document.querySelector(".demo-video");
    const strip = document.querySelector(".partner-strip");
    const urgency = document.querySelector("#urgency");
    const problemP = document.querySelector("#problem p");
    const heroCta = document.querySelector(".look--hero .cta-trial");
    const desk = document.querySelector(".hero-desk");
    const val = document.querySelector(".headline-validation-text");
    const indices = document.querySelector(".look-indices");
    const indexRule = document.querySelector(".index-rule");
    const midCta = after.querySelector(".cta-trial");
    const lms = after.querySelector(".mechanism-lms");
    const imgs = [...strip.querySelectorAll("img")].map((img) => {
      const b = r(img);
      return { alt: img.alt, right: b.right, w: +b.width.toFixed(1), h: +b.height.toFixed(1) };
    });
    const stripR = r(strip);
    const lastRight = Math.max(...imgs.map((i) => i.right));
    const uh2 = urgency.querySelector("h2");
    const up = urgency.querySelector("p");
    const uInner = urgency.querySelector(".look-inner");
    return {
      lmsColor: cs(muted).color,
      lmsFs: cs(muted).fontSize,
      processColor: cs(process).color,
      processFs: cs(process).fontSize,
      heroCtaPad: cs(heroCta).padding,
      heroCtaFs: cs(heroCta).fontSize,
      heroCtaBox: {
        w: +r(heroCta).width.toFixed(1),
        h: +r(heroCta).height.toFixed(1),
      },
      valBox: { w: +r(val).width.toFixed(1), h: +r(val).height.toFixed(1) },
      ctaVsVal: +((r(heroCta).width * r(heroCta).height) / (r(val).width * r(val).height)).toFixed(2),
      processGap: +(r(process).top - r(heroCta).bottom).toFixed(2),
      processClearDesk: +(r(desk).top - r(process).bottom).toFixed(2),
      ctaClearDesk: +(r(desk).top - r(heroCta).bottom).toFixed(2),
      partnerRightEmpty: +((stripR.right - lastRight) / stripR.width).toFixed(3),
      partnerImgs: imgs,
      stripW: +stripR.width.toFixed(1),
      demoToAfterGap: +(r(after).top - r(demo).bottom).toFixed(1),
      afterStructure: {
        lmsH: +r(lms).height.toFixed(1),
        ctaH: +r(midCta).height.toFixed(1),
        bandH: +r(after).height.toFixed(1),
        lmsToCta: +(r(midCta).top - r(lms).bottom).toFixed(1),
        demoToLms: +(r(lms).top - r(demo).bottom).toFixed(1),
        padTop: cs(after).paddingTop,
        padBottom: cs(after).paddingBottom,
        children: [...after.children].map((c) => c.className || c.tagName),
      },
      urgency: {
        lookH: +r(urgency).height.toFixed(0),
        contentH: +(r(up).bottom - r(uh2).top).toFixed(1),
        padTop: cs(uInner).paddingTop,
        padBottom: cs(uInner).paddingBottom,
        padRatio: +(
          (parseFloat(cs(uInner).paddingTop) + parseFloat(cs(uInner).paddingBottom)) /
          r(uInner).height
        ).toFixed(2),
        wordCount: up.textContent.trim().split(/\s+/).length,
      },
      problem: {
        pW: +r(problemP).width.toFixed(1),
        fs: parseFloat(cs(problemP).fontSize),
        ch: +(r(problemP).width / parseFloat(cs(problemP).fontSize)).toFixed(1),
        lookH: +document.querySelector("#problem").getBoundingClientRect().height.toFixed(0),
        wordCount: problemP.textContent.trim().split(/\s+/).length,
      },
      demo: {
        frameBg: cs(frame).backgroundColor,
        videoBg: cs(video).backgroundColor,
        videoH: +r(video).height.toFixed(1),
        frameH: +r(frame).height.toFixed(1),
        objectFit: cs(video).objectFit,
        maxH: cs(video).maxHeight,
      },
      indices: {
        count: document.querySelectorAll(".look-index").length,
        indexBottom: +r(indices).bottom.toFixed(1),
        ruleBottom: +r(indexRule).bottom.toFixed(1),
        deskTop: +r(desk).top.toFixed(1),
      },
      footerH: +document.querySelector("#contact").getBoundingClientRect().height.toFixed(0),
      mutedToken: getComputedStyle(document.documentElement).getPropertyValue("--muted").trim(),
    };
  });

  deep.lmsContrast = +contrast(rgb(deep.lmsColor), [246, 244, 239]).toFixed(2);
  deep.processContrast = +contrast(rgb(deep.processColor), [246, 244, 239]).toFixed(2);

  await page.locator("#demo").scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const paint = await page.evaluate(async () => {
    const video = document.querySelector(".demo-video");
    const poster = video.getAttribute("poster");
    const img = new Image();
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
      img.src = poster;
    });
    const c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const { data, width, height } = ctx.getImageData(0, 0, c.width, c.height);
    let nearWhite = 0;
    let nearBone = 0;
    let nearInk = 0;
    const n = width * height;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r > 240 && g > 240 && b > 240) nearWhite++;
      const dr = Math.abs(r - 246) + Math.abs(g - 244) + Math.abs(b - 239);
      const dd = Math.abs(r - 234) + Math.abs(g - 232) + Math.abs(b - 227);
      if (dr < 18 || dd < 18) nearBone++;
      if (r < 40 && g < 60 && b < 90) nearInk++;
    }
    const midX = Math.floor(width / 2);
    const midY = Math.floor(height / 2);
    const mi = (midY * width + midX) * 4;
    const corner = (x, y) => {
      const i = (y * width + x) * 4;
      return [data[i], data[i + 1], data[i + 2]];
    };
    return {
      natural: [width, height],
      mid: [data[mi], data[mi + 1], data[mi + 2]],
      whiteShare: +(nearWhite / n).toFixed(3),
      boneShare: +(nearBone / n).toFixed(3),
      inkShare: +(nearInk / n).toFixed(3),
      corners: [
        corner(2, 2),
        corner(width - 3, 2),
        corner(2, height - 3),
        corner(width - 3, height - 3),
      ],
    };
  });
  deep.posterPaint = paint;

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  await page.locator("#partners").scrollIntoViewIfNeeded();
  deep.m390partners = await page.evaluate(() => {
    const strip = document.querySelector(".partner-strip");
    const rr = strip.getBoundingClientRect();
    const imgs = [...strip.querySelectorAll("img")].map((img) => {
      const b = img.getBoundingClientRect();
      return {
        alt: img.alt,
        y: +b.y.toFixed(1),
        x: +b.x.toFixed(1),
        w: +b.width.toFixed(1),
        h: +b.height.toFixed(1),
      };
    });
    const rows = new Set(imgs.map((i) => Math.round(i.y / 4) * 4)).size;
    return {
      stripH: +rr.height.toFixed(1),
      rows,
      imgs,
      lookH: +document.querySelector("#partners").getBoundingClientRect().height.toFixed(0),
      afterBand: (() => {
        const after = document.querySelector(".look-inner--after-demo");
        return {
          h: +after.getBoundingClientRect().height.toFixed(1),
          padTop: getComputedStyle(after).paddingTop,
          padBottom: getComputedStyle(after).paddingBottom,
        };
      })(),
    };
  });

  await page.setViewportSize({ width: 1279, height: 720 });
  await page.waitForTimeout(300);
  deep.at1279 = await page.evaluate(() => {
    const main = document.querySelector(".headline-main");
    const cta = document.querySelector(".look--hero .cta-trial");
    const process = document.querySelector(".process-link");
    const desk = document.querySelector(".hero-desk");
    const val = document.querySelector(".headline-validation-text");
    return {
      position: getComputedStyle(main).position,
      mainFs: getComputedStyle(main).fontSize,
      processGap: +(process.getBoundingClientRect().top - cta.getBoundingClientRect().bottom).toFixed(1),
      ctaClear: +(desk.getBoundingClientRect().top - cta.getBoundingClientRect().bottom).toFixed(1),
      processClear: +(desk.getBoundingClientRect().top - process.getBoundingClientRect().bottom).toFixed(1),
      ctaVsVal: +(
        (cta.getBoundingClientRect().width * cta.getBoundingClientRect().height) /
        (val.getBoundingClientRect().width * val.getBoundingClientRect().height)
      ).toFixed(2),
      deskH: +desk.getBoundingClientRect().height.toFixed(1),
    };
  });

  let live8080 = null;
  try {
    const res = await fetch("http://127.0.0.1:8080/");
    const t = await res.text();
    live8080 = {
      status: res.status,
      clay: /clay|By 2025|look--ink|Fredoka/i.test(t),
      hasPartners: t.includes('id="partners"'),
      hasProcessStill: t.includes("process-still"),
      hasMechanismLms: t.includes("mechanism-lms"),
      hasStatistics: t.includes('id="statistics"'),
      hasAbout: t.includes('id="about"') || t.includes("footer-about"),
    };
  } catch (e) {
    live8080 = { error: String(e.message || e) };
  }
  deep.live8080 = live8080;

  const cssSrc = fs.readFileSync(path.join(root, "css/styles.css"), "utf8");
  deep.sourceDebt = {
    grayscaleFilter: /partner-strip img[\s\S]*?grayscale/.test(cssSrc),
    processGapToken: cssSrc.match(/--r-process-link-y:\s*([^;]+)/)?.[1],
    ctaY: cssSrc.match(/--r-cta-trial-y:\s*([^;]+)/)?.[1],
    ctaH: cssSrc.match(/--r-cta-trial-h:\s*([^;]+)/)?.[1],
    muted: cssSrc.match(/--muted:\s*([^;]+)/)?.[1],
  };

  fs.writeFileSync(path.join(__dirname, "deep.json"), JSON.stringify(deep, null, 2));
  console.log(JSON.stringify(deep, null, 2));
  await browser.close();
  server.close();
});
