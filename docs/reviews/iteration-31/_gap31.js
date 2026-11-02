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
  await new Promise((r) => server.listen(8961, r));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto("http://127.0.0.1:8961/", { waitUntil: "networkidle" });
  await page.waitForTimeout(300);

  const measures = await page.evaluate(() => {
    const glyph = (el) => {
      if (!el) return null;
      const cs = getComputedStyle(el);
      const br = el.getBoundingClientRect();
      const s = document.createElement("span");
      s.textContent = "abcdefghijklmnopqrstuvwxyz";
      s.style.cssText = `font:${cs.font};position:absolute;visibility:hidden;white-space:nowrap`;
      document.body.appendChild(s);
      const chPx = s.getBoundingClientRect().width / 26;
      s.remove();
      const parse = (c) => {
        const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        return m ? [+m[1], +m[2], +m[3]] : [0, 0, 0];
      };
      const lum = ([r, g, b]) => {
        const x = [r, g, b].map((v) => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * x[0] + 0.7152 * x[1] + 0.0722 * x[2];
      };
      const parentBg = (() => {
        let n = el.parentElement;
        while (n) {
          const bg = getComputedStyle(n).backgroundColor;
          if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") return bg;
          n = n.parentElement;
        }
        return "rgb(246,244,239)";
      })();
      const L1 = lum(parse(cs.color));
      const L2 = lum(parse(parentBg));
      const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      return {
        fs: cs.fontSize,
        maxW: cs.maxWidth,
        w: +br.width.toFixed(1),
        cssCh: +(br.width / parseFloat(cs.fontSize)).toFixed(1),
        glyphCh: +(br.width / chPx).toFixed(1),
        color: cs.color,
        bg: parentBg,
        contrast: +ratio.toFixed(2),
        lh: cs.lineHeight,
      };
    };

    const before = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const cs = getComputedStyle(el, "::before");
      return {
        content: cs.content,
        opacity: cs.opacity,
        position: cs.position,
        bgImage: (cs.backgroundImage || "").slice(0, 160),
        zIndex: cs.zIndex,
      };
    };

    return {
      interest: glyph(document.querySelector(".look--copy p")),
      urgBody: glyph(document.querySelector("#urgency p")),
      mech: glyph(document.querySelector(".mechanism")),
      lms: glyph(document.querySelector(".mechanism-lms")),
      storyGrain: before(".look--story"),
      copyGrain: before(".look--copy"),
      storyInnerZ: getComputedStyle(document.querySelector(".look--story .look-inner")).zIndex,
      copyInnerZ: getComputedStyle(document.querySelector(".look--copy .look-inner")).zIndex,
    };
  });

  // urgency centre capture + empty field
  await page.evaluate(() => {
    const h2 = document.querySelector("#urgency h2");
    const y = h2.getBoundingClientRect().top + window.scrollY - (innerHeight / 2 - h2.getBoundingClientRect().height / 2);
    window.scrollTo(0, Math.max(0, y));
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(out, "capture-d1280-urgency-gap.png") });
  const urgFrame = await page.evaluate(() => {
    const h2 = document.querySelector("#urgency h2").getBoundingClientRect();
    const body = document.querySelector("#urgency p").getBoundingClientRect();
    const story = document.querySelector(".look--story").getBoundingClientRect();
    const partners = document.querySelector("#partners").getBoundingClientRect();
    return {
      urgOptical: +(h2.top + h2.height / 2 - innerHeight / 2).toFixed(1),
      bodyBottom: +body.bottom.toFixed(1),
      emptyBelowBody: +(innerHeight - body.bottom).toFixed(1),
      partnersVis: Math.max(0, Math.min(partners.bottom, innerHeight) - Math.max(partners.top, 0)),
      storyBottomVp: +story.bottom.toFixed(1),
      bodyToStoryEnd: +(story.bottom - body.bottom).toFixed(1),
    };
  });

  // Desire land @1120 stack rhythm + support density
  const p1120 = await browser.newPage({ viewport: { width: 1120, height: 720 } });
  await p1120.goto("http://127.0.0.1:8961/", { waitUntil: "networkidle" });
  await p1120.click(".process-link");
  await p1120.waitForTimeout(400);
  await p1120.screenshot({ path: path.join(out, "capture-w1120-desire-stack.png") });
  const desire = await p1120.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const box = (el) => {
      const b = el.getBoundingClientRect();
      return { t: +b.top.toFixed(1), b: +b.bottom.toFixed(1), h: +b.height.toFixed(1) };
    };
    const title = box(q("#solution-title"));
    const mech = box(q(".mechanism"));
    const lms = box(q(".mechanism-lms"));
    const demo = box(q(".demo-frame"));
    const glyph = (el) => {
      const cs = getComputedStyle(el);
      const br = el.getBoundingClientRect();
      const s = document.createElement("span");
      s.textContent = "abcdefghijklmnopqrstuvwxyz";
      s.style.cssText = `font:${cs.font};position:absolute;visibility:hidden;white-space:nowrap`;
      document.body.appendChild(s);
      const chPx = s.getBoundingClientRect().width / 26;
      s.remove();
      return {
        fs: cs.fontSize,
        maxW: cs.maxWidth,
        w: +br.width.toFixed(1),
        glyphCh: +(br.width / chPx).toFixed(1),
        marginTop: cs.marginTop,
        marginBottom: cs.marginBottom,
      };
    };
    const claimH = Math.min(lms.b, demo.t) - title.t;
    return {
      title,
      gaps: {
        titleToMech: +(mech.t - title.b).toFixed(1),
        mechToLms: +(lms.t - mech.b).toFixed(1),
        lmsToDemo: +(demo.t - lms.b).toFixed(1),
      },
      claimShare: +((claimH / innerHeight) * 100).toFixed(1),
      claimH: +claimH.toFixed(1),
      optical: +(title.t + title.h / 2 - innerHeight / 2).toFixed(1),
      mech: glyph(q(".mechanism")),
      lms: glyph(q(".mechanism-lms")),
      mechCss: {
        fs: getComputedStyle(q(".mechanism")).fontSize,
        mw: getComputedStyle(q(".mechanism")).maxWidth,
        mt: getComputedStyle(q(".mechanism")).marginTop,
      },
      lmsCss: {
        fs: getComputedStyle(q(".mechanism-lms")).fontSize,
        mw: getComputedStyle(q(".mechanism-lms")).maxWidth,
        mt: getComputedStyle(q(".mechanism-lms")).marginTop,
        fw: getComputedStyle(q(".mechanism-lms")).fontWeight,
      },
    };
  });

  // footer start bone readable capture
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("http://127.0.0.1:8961/", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    const f = document.querySelector(".look--footer");
    window.scrollTo(0, f.getBoundingClientRect().top + window.scrollY - 263);
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(out, "capture-d1280-footer-h2-paid.png") });

  // mid CTA breath capture
  await page.evaluate(() => {
    const mid = [...document.querySelectorAll(".cta-trial")][1];
    const y = mid.getBoundingClientRect().top + window.scrollY - (innerHeight / 2 - mid.getBoundingClientRect().height / 2);
    window.scrollTo(0, Math.max(0, y));
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(out, "capture-d1280-mid-cta-breath.png") });
  const mid = await page.evaluate(() => {
    const demo = document.querySelector(".demo-frame").getBoundingClientRect();
    const midEl = [...document.querySelectorAll(".cta-trial")][1].getBoundingClientRect();
    const urg = document.querySelector("#urgency").getBoundingClientRect();
    return {
      gapDemoToCta: +(midEl.top - demo.bottom).toFixed(1),
      urgVis: Math.max(0, Math.min(urg.bottom, innerHeight) - Math.max(urg.top, 0)),
      afterPadT: getComputedStyle(document.querySelector(".look-inner--after-demo")).paddingTop,
    };
  });

  // story grain visual at urgency
  await page.evaluate(() => {
    const h2 = document.querySelector("#urgency h2");
    const y = h2.getBoundingClientRect().top + window.scrollY - (innerHeight / 2 - h2.getBoundingClientRect().height / 2);
    window.scrollTo(0, Math.max(0, y));
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(out, "capture-d1280-story-grain.png") });

  // Interest grain compare
  await page.evaluate(() => {
    const h2 = document.querySelector(".look--copy h2");
    const y = h2.getBoundingClientRect().top + window.scrollY - (innerHeight / 2 - h2.getBoundingClientRect().height / 2);
    window.scrollTo(0, Math.max(0, y));
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(out, "capture-d1280-interest-grain.png") });

  // Desire→Action: after mid CTA, how much story still above urgency?
  // Also check mid CTA → urgency section entry breath when scrolling to urgency start
  await page.evaluate(() => {
    const urg = document.querySelector("#urgency");
    window.scrollTo(0, urg.getBoundingClientRect().top + window.scrollY - 80);
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(out, "capture-d1280-urgency-entry.png") });
  const urgEntry = await page.evaluate(() => {
    const mid = [...document.querySelectorAll(".cta-trial")][1].getBoundingClientRect();
    const urgH2 = document.querySelector("#urgency h2").getBoundingClientRect();
    const story = document.querySelector(".look--story").getBoundingClientRect();
    return {
      midVis: Math.max(0, Math.min(mid.bottom, innerHeight) - Math.max(mid.top, 0)),
      urgH2T: +urgH2.top.toFixed(1),
      storyT: +story.top.toFixed(1),
      midBottom: +mid.bottom.toFixed(1),
    };
  });

  const result = { measures, urgFrame, desire, mid, urgEntry };
  fs.writeFileSync(path.join(out, "gap31.json"), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  server.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
