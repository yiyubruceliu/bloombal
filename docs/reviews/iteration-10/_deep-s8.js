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

server.listen(8113, async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  await page.goto("http://127.0.0.1:8113/#demo", { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await page.screenshot({
    path: path.join(__dirname, "capture-d1280-hash-demo.png"),
    fullPage: false,
  });
  const hashLand = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const vis = (el) => {
      const b = el.getBoundingClientRect();
      return {
        t: +b.top.toFixed(1),
        b: +b.bottom.toFixed(1),
        inView: b.top < window.innerHeight && b.bottom > 0,
        above: b.bottom <= 0,
      };
    };
    return {
      scrollY: window.scrollY,
      title: vis(q("#solution-title")),
      mech: vis(q(".mechanism")),
      demo: vis(q("#demo")),
      demoOp: getComputedStyle(q("#demo")).opacity,
      lms: vis(q(".mechanism-lms")),
      midCta: vis(q(".look-inner--after-demo .cta-trial")),
    };
  });

  await page.goto("http://127.0.0.1:8113/", { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await page.click(".process-link");
  await page.waitForTimeout(900);
  await page.screenshot({
    path: path.join(__dirname, "capture-d1280-after-process-click.png"),
    fullPage: false,
  });
  const afterClick = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const vis = (el) => {
      const b = el.getBoundingClientRect();
      return {
        t: +b.top.toFixed(1),
        b: +b.bottom.toFixed(1),
        visiblePx: Math.max(
          0,
          Math.min(b.bottom, window.innerHeight) - Math.max(b.top, 0)
        ),
      };
    };
    return {
      scrollY: +window.scrollY.toFixed(1),
      title: vis(q("#solution-title")),
      mech: vis(q(".mechanism")),
      demo: vis(q("#demo")),
      demoOp: getComputedStyle(q("#demo")).opacity,
      problemVisible: (() => {
        const b = q("#problem").getBoundingClientRect();
        return b.bottom > 0 && b.top < window.innerHeight;
      })(),
    };
  });

  await page.goto("http://127.0.0.1:8113/", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const ledeCta = await page.evaluate(() => {
    const lede = document.querySelector(".hero-lede");
    const cta = document.querySelector(".look--hero .cta-trial");
    const lb = lede.getBoundingClientRect();
    const cb = cta.getBoundingClientRect();
    return {
      ledeBottom: +lb.bottom.toFixed(1),
      ctaTop: +cb.top.toFixed(1),
      gap: +(cb.top - lb.bottom).toFixed(1),
      ledeH: +lb.height.toFixed(1),
      ctaH: +cb.height.toFixed(1),
      processTopPct: getComputedStyle(document.querySelector(".process-link")).top,
      ctaTopPct: getComputedStyle(cta).top,
      ledeTopPct: getComputedStyle(lede).top,
      ctaMinH: getComputedStyle(cta).minHeight,
    };
  });

  const partnerOcc = await page.evaluate(() => {
    const strip = document.querySelector(".partner-strip");
    const sr = strip.getBoundingClientRect();
    const imgs = [...strip.querySelectorAll("img")];
    const markArea = imgs.reduce((a, i) => {
      const b = i.getBoundingClientRect();
      return a + b.width * b.height;
    }, 0);
    const bs = imgs.map((i) => i.getBoundingClientRect());
    return {
      stripArea: +(sr.width * sr.height).toFixed(0),
      markArea: +markArea.toFixed(0),
      occupancy: +((markArea / (sr.width * sr.height)) * 100).toFixed(1),
      gaps: [+(bs[1].left - bs[0].right).toFixed(1), +(bs[2].left - bs[1].right).toFixed(1)],
      markHeights: bs.map((b) => +b.height.toFixed(1)),
    };
  });

  // column zigzag: measure centers
  const zig = await page.evaluate(() => {
    const title = document.querySelector("#solution-title").getBoundingClientRect();
    const mech = document.querySelector(".mechanism").getBoundingClientRect();
    const demo = document.querySelector("#demo").getBoundingClientRect();
    const midCta = document
      .querySelector(".look-inner--after-demo .cta-trial")
      .getBoundingClientRect();
    const urg = document.querySelector("#urgency h2").getBoundingClientRect();
    const strip = document.querySelector(".partner-strip").getBoundingClientRect();
    const center = (b) => +(b.left + b.width / 2).toFixed(1);
    return {
      titleC: center(title),
      mechC: center(mech),
      demoC: center(demo),
      midCtaC: center(midCta),
      urgC: center(urg),
      stripC: center(strip),
      titleW: +title.width.toFixed(1),
      demoW: +demo.width.toFixed(1),
      deltaTitleDemoLeft: +(demo.left - title.left).toFixed(1),
    };
  });

  const page2 = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page2.addInitScript(() => {
    // freeze IO by stubbing after load — capture class add timing
  });
  await page2.goto("http://127.0.0.1:8113/", { waitUntil: "domcontentloaded" });
  const early = await page2.evaluate(() => {
    const demo = document.querySelector("#demo");
    return { cls: demo.className, op: getComputedStyle(demo).opacity };
  });
  await page2.evaluate(() => document.querySelector("#demo").scrollIntoView());
  const mid = await page2.evaluate(() => ({
    cls: document.querySelector("#demo").className,
    op: getComputedStyle(document.querySelector("#demo")).opacity,
  }));
  await page2.waitForTimeout(100);
  const late = await page2.evaluate(() => ({
    cls: document.querySelector("#demo").className,
    op: getComputedStyle(document.querySelector("#demo")).opacity,
  }));

  // stacked 1120: lede-cta gap + first viewport composition
  const page3 = await browser.newPage({ viewport: { width: 1120, height: 720 } });
  await page3.goto("http://127.0.0.1:8113/", { waitUntil: "networkidle" });
  await page3.waitForTimeout(500);
  await page3.screenshot({
    path: path.join(__dirname, "capture-w1120-hero.png"),
    fullPage: false,
  });
  const stackHero = await page3.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const box = (el) => {
      const b = el.getBoundingClientRect();
      return { t: +b.top.toFixed(1), b: +b.bottom.toFixed(1), h: +b.height.toFixed(1) };
    };
    const lede = box(q(".hero-lede"));
    const cta = box(q(".look--hero .cta-trial"));
    const process = box(q(".process-link"));
    const desk = box(q(".hero-desk"));
    const brand = box(q(".brand"));
    const main = box(q(".headline-main"));
    return {
      brand,
      main,
      lede,
      cta,
      process,
      desk,
      ledeCtaGap: +(cta.t - lede.b).toFixed(1),
      ctaProcessGap: +(process.t - cta.b).toFixed(1),
      processDesk: +(desk.t - process.b).toFixed(1),
      viewportFill:
        "brand+claim+lede+cta+process above desk; desk " + desk.h + "px of " + window.innerHeight,
    };
  });

  const out = {
    hashLand,
    afterClick,
    ledeCta,
    partnerOcc,
    zig,
    demoEarly: { early, mid, late },
    stackHero,
  };
  fs.writeFileSync(path.join(__dirname, "deep-s8.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
  server.close();
});
