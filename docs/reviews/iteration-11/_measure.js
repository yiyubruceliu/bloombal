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
  await new Promise((r) => server.listen(8115, r));
  const browser = await chromium.launch({ headless: true });
  const metrics = {};
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const shot = (name) => page.screenshot({ path: path.join(out, name), fullPage: false });

  await page.goto("http://127.0.0.1:8115/", { waitUntil: "networkidle" });
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
    const area = (el) => (el ? el.w * el.h : 0);
    return {
      lede,
      cta,
      proc,
      desk,
      val,
      brand: box(q(".brand")),
      ledeCtaGap: lede && cta ? +(cta.t - lede.b).toFixed(1) : null,
      ctaProcGap: cta && proc ? +(proc.t - cta.b).toFixed(1) : null,
      procDesk: desk && proc ? +(desk.t - proc.b).toFixed(1) : null,
      ctaDesk: desk && cta ? +(desk.t - cta.b).toFixed(1) : null,
      ctaMassRatio: val && cta ? +(area(cta) / area(val)).toFixed(2) : null,
      processHref: q(".process-link")?.getAttribute("href"),
      indicesPos: getComputedStyle(q(".look-indices")).position,
      indicesBox: box(q(".look-indices")),
      rightEmptyPct: +(((1280 - (box(q(".brand"))?.r || 0)) / 1280) * 100).toFixed(1),
    };
  });

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
      title: vis(q("#solution-title")),
      mech: vis(q(".mechanism")),
      demo: vis(q("#demo")),
      problem: vis(q("#problem")),
      lms: vis(q(".mechanism-lms")),
      midCta: vis(q(".look-inner--after-demo .cta-trial")),
      activeIndex: document.querySelector(".look-index.is-active")?.textContent,
      demoOp: getComputedStyle(q("#demo")).opacity,
    };
  });

  await page.goto("http://127.0.0.1:8115/#demo", { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
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
      scrollY: +scrollY.toFixed(1),
      title: vis(q("#solution-title")),
      mech: vis(q(".mechanism")),
      demo: vis(q("#demo")),
      demoScrollMargin: getComputedStyle(q("#demo")).scrollMarginTop,
      solutionScrollMargin: getComputedStyle(q("#solution")).scrollMarginTop,
    };
  });

  await page.goto("http://127.0.0.1:8115/", { waitUntil: "networkidle" });
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
    const demo = q("#demo");
    const inner = q(".look--solution > .look-inner");
    const cta = q(".look-inner--after-demo .cta-trial");
    const lms = q(".mechanism-lms");
    const tb = box(title);
    const db = box(demo);
    const ib = box(inner);
    const cb = box(cta);
    const lb = box(lms);
    return {
      title: tb,
      mech: box(q(".mechanism")),
      demo: db,
      inner: ib,
      cta: cb,
      lms: lb,
      deltaTitleDemoLeft: tb && db ? +(db.l - tb.l).toFixed(1) : null,
      deltaInnerDemoLeft: ib && db ? +(db.l - ib.l).toFixed(1) : null,
      deltaCtaDemoLeft: cb && db ? +(cb.l - db.l).toFixed(1) : null,
      afterOrder: cb && lb ? (cb.t < lb.t ? "cta-then-lms" : "lms-then-cta") : null,
      ctaLmsGap: cb && lb ? +(lb.t - cb.b).toFixed(1) : null,
      h2MaxW: getComputedStyle(title).maxWidth,
      titleLines: Math.round(
        title.getBoundingClientRect().height / parseFloat(getComputedStyle(title).lineHeight)
      ),
    };
  });

  await page.evaluate(() =>
    document.querySelector("#demo").scrollIntoView({ block: "center" })
  );
  await page.waitForTimeout(500);
  await shot("capture-d1280-demo.png");
  metrics.demoReveal = await page.evaluate(() => {
    const d = document.querySelector("#demo");
    return {
      op: getComputedStyle(d).opacity,
      hasWill: d.classList.contains("will-reveal"),
      hasIn: d.classList.contains("is-in"),
      videoControls: document.querySelector(".demo-video")?.hasAttribute("controls"),
    };
  });

  // Sample poster field color
  metrics.posterSample = await page.evaluate(() => {
    const v = document.querySelector(".demo-video");
    const b = v.getBoundingClientRect();
    // approximate via frame bg
    const frame = document.querySelector(".demo-frame");
    return {
      frameBg: getComputedStyle(frame).backgroundColor,
      videoBg: getComputedStyle(v).backgroundColor,
      framePad: getComputedStyle(frame).padding,
    };
  });

  await page.evaluate(() => document.querySelector("#urgency").scrollIntoView());
  await page.waitForTimeout(300);
  metrics.urgency = await page.evaluate(() => {
    const s = document.querySelector("#urgency");
    const inner = s.querySelector(".look-inner");
    const sh = s.getBoundingClientRect().height;
    const cs = getComputedStyle(inner);
    const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    const idxBox = document.querySelector(".look-indices").getBoundingClientRect();
    return {
      h: +sh.toFixed(1),
      pad: +pad.toFixed(1),
      padRatio: +(pad / sh).toFixed(2),
      activeIndex: document.querySelector(".look-index.is-active")?.textContent,
      indicesInView: idxBox.bottom > 0 && idxBox.top < innerHeight,
      indicesTop: +idxBox.top.toFixed(1),
    };
  });

  await page.evaluate(() => document.querySelector("#partners").scrollIntoView());
  await page.waitForTimeout(300);
  await shot("capture-d1280-partners.png");
  metrics.partners = await page.evaluate(() => {
    const strip = document.querySelector(".partner-strip");
    const imgs = [...strip.querySelectorAll("img")].map((i) => {
      const b = i.getBoundingClientRect();
      return {
        l: +b.left.toFixed(1),
        r: +b.right.toFixed(1),
        w: +b.width.toFixed(1),
        h: +b.height.toFixed(1),
      };
    });
    const gaps = [];
    for (let i = 0; i < imgs.length - 1; i++) gaps.push(+(imgs[i + 1].l - imgs[i].r).toFixed(1));
    const sb = strip.getBoundingClientRect();
    const occ = imgs.reduce((a, i) => a + i.w, 0);
    const idxBox = document.querySelector(".look-indices").getBoundingClientRect();
    return {
      gaps,
      occPct: +((occ / sb.width) * 100).toFixed(1),
      stripW: +sb.width.toFixed(1),
      justify: getComputedStyle(strip).justifyContent,
      activeIndex: document.querySelector(".look-index.is-active")?.textContent,
      indicesInView: idxBox.bottom > 0 && idxBox.top < innerHeight,
    };
  });

  await page.evaluate(() => document.querySelector("#contact").scrollIntoView());
  await page.waitForTimeout(300);
  await shot("capture-d1280-footer.png");
  metrics.footer = await page.evaluate(() => {
    const foot = document.querySelector(".look--footer");
    const kids = [...foot.querySelector(".look-inner").children].map((el) => ({
      tag: el.tagName + (el.className ? "." + String(el.className).split(" ")[0] : ""),
      t: +el.getBoundingClientRect().top.toFixed(1),
    }));
    const cta = document.querySelector(".look--footer .cta-trial");
    const idxBox = document.querySelector(".look-indices").getBoundingClientRect();
    return {
      kids,
      ctaBg: getComputedStyle(cta).backgroundColor,
      footBg: getComputedStyle(foot).backgroundColor,
      activeIndex: document.querySelector(".look-index.is-active")?.textContent,
      indicesInView: idxBox.bottom > 0 && idxBox.top < innerHeight,
    };
  });

  // Index path through full scroll
  await page.goto("http://127.0.0.1:8115/", { waitUntil: "networkidle" });
  metrics.indexPath = await page.evaluate(async () => {
    const pts = ["#home", "#problem", "#solution", "#urgency", "#partners", "#contact"];
    const out = [];
    for (const sel of pts) {
      document.querySelector(sel).scrollIntoView();
      await new Promise((r) => setTimeout(r, 100));
      window.dispatchEvent(new Event("scroll"));
      await new Promise((r) => setTimeout(r, 50));
      const b = document.querySelector(".look-indices").getBoundingClientRect();
      out.push({
        sel,
        idx: document.querySelector(".look-index.is-active")?.textContent,
        indicesVisible: b.bottom > 0 && b.top < innerHeight,
        indicesTop: +b.top.toFixed(1),
      });
    }
    return out;
  });

  metrics.measureAudit = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const ch = (el) => {
      if (!el) return null;
      const fs = parseFloat(getComputedStyle(el).fontSize);
      return +(el.getBoundingClientRect().width / fs).toFixed(1);
    };
    const sm = (id) => {
      const el = document.getElementById(id);
      return el ? getComputedStyle(el).scrollMarginTop : null;
    };
    const sel = getComputedStyle(document.documentElement);
    return {
      problemCh: ch(q("#problem p")),
      mechCh: ch(q(".mechanism")),
      lmsCh: ch(q(".mechanism-lms")),
      solutionTitleCh: ch(q("#solution-title")),
      scrollMargins: {
        home: sm("home"),
        problem: sm("problem"),
        solution: sm("solution"),
        demo: sm("demo"),
        urgency: sm("urgency"),
        partners: sm("partners"),
        contact: sm("contact"),
      },
      focusOutlineCta: getComputedStyle(q(".cta-trial")).outlineStyle,
      iceToken: sel.getPropertyValue("--ice") || null,
    };
  });

  // mid CTA continuation under demo (scroll so demo bottom + after-demo in view)
  await page.evaluate(() => {
    const demo = document.querySelector("#demo");
    const after = document.querySelector(".look-inner--after-demo");
    after.scrollIntoView({ block: "center" });
  });
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
    return {
      demo: vis(q("#demo")),
      cta: vis(q(".look-inner--after-demo .cta-trial")),
      lms: vis(q(".mechanism-lms")),
      urgencyTitle: vis(q("#urgency h2")),
    };
  });

  // 1120 stack
  await page.setViewportSize({ width: 1120, height: 720 });
  await page.goto("http://127.0.0.1:8115/", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await shot("capture-w1120-hero.png");
  metrics.hero1120 = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const info = (el) => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return {
        t: +b.top.toFixed(1),
        b: +b.bottom.toFixed(1),
        pos: getComputedStyle(el).position,
        z: getComputedStyle(el).zIndex,
        op: getComputedStyle(el).opacity,
      };
    };
    const lede = info(q(".hero-lede"));
    const cta = info(q(".look--hero .cta-trial"));
    return {
      brand: info(q(".brand")),
      lede,
      cta,
      proc: info(q(".process-link")),
      val: info(q(".headline-validation")),
      ledeCtaGap: lede && cta ? +(cta.t - lede.b).toFixed(1) : null,
      plateZ: getComputedStyle(q(".hero-bone-plate")).zIndex,
      boneZ: getComputedStyle(q(".hero-bone")).zIndex,
    };
  });

  // 390
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("http://127.0.0.1:8115/", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await shot("capture-m390-hero.png");
  metrics.hero390 = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const box = (el) => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return {
        t: +b.top.toFixed(1),
        b: +b.bottom.toFixed(1),
        op: getComputedStyle(el).opacity,
        z: getComputedStyle(el).zIndex,
      };
    };
    const proc = box(q(".process-link"));
    const desk = box(q(".hero-desk"));
    return {
      brand: box(q(".brand")),
      title: box(q(".headline-main")),
      cta: box(q(".look--hero .cta-trial")),
      proc,
      desk,
      procDeskClear: proc && desk ? +(desk.t - proc.b).toFixed(1) : null,
      ctaFont: getComputedStyle(q(".look--hero .cta-trial")).fontSize,
      procFont: getComputedStyle(q(".process-link")).fontSize,
    };
  });
  await page.evaluate(() => document.querySelector("#partners").scrollIntoView());
  await page.waitForTimeout(300);
  await shot("capture-m390-partners.png");
  metrics.partners390 = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll(".partner-strip img")].map((i) => {
      const b = i.getBoundingClientRect();
      return { t: +b.top.toFixed(1), l: +b.left.toFixed(1), w: +b.width.toFixed(1) };
    });
    const rows = new Set(imgs.map((i) => Math.round(i.t)));
    return { imgs, rowCount: rows.size };
  });

  // Click index 03 from hero — lands where?
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("http://127.0.0.1:8115/", { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
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
      scrollY: +scrollY.toFixed(1),
      title: vis(q("#solution-title")),
      mech: vis(q(".mechanism")),
      demo: vis(q("#demo")),
      problemVisiblePx: vis(q("#problem"))?.visiblePx,
    };
  });

  // #problem hash / index 02
  await page.goto("http://127.0.0.1:8115/", { waitUntil: "networkidle" });
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
    return {
      scrollY: +scrollY.toFixed(1),
      title: vis(q("#problem-title")),
      body: vis(q("#problem p")),
      problemScrollMargin: getComputedStyle(q("#problem")).scrollMarginTop,
      titleOptical: vis(q("#problem-title"))?.t,
    };
  });

  fs.writeFileSync(path.join(out, "metrics.json"), JSON.stringify(metrics, null, 2));
  console.log(JSON.stringify(metrics, null, 2));
  await browser.close();
  server.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
