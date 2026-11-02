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

const server = http.createServer((req, res) => {
  let u = decodeURIComponent((req.url || "/").split("?")[0]);
  if (u === "/") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
    return;
  }
  const fp = path.normalize(path.join(root, u.replace(/^\//, "")));
  if (!fp.startsWith(root) || !fs.existsSync(fp)) {
    res.writeHead(404);
    res.end("no");
    return;
  }
  res.writeHead(200);
  fs.createReadStream(fp).pipe(res);
});

(async () => {
  await new Promise((r) => server.listen(8791, r));
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.goto("http://127.0.0.1:8791/", { waitUntil: "networkidle" });

  const heroY = await p.evaluate(() => {
    const hs = getComputedStyle(document.querySelector(".hero-frame"));
    return {
      ledeY: hs.getPropertyValue("--r-lede-y").trim(),
      ctaY: hs.getPropertyValue("--r-cta-trial-y").trim(),
      procY: hs.getPropertyValue("--r-process-link-y").trim(),
      deskY: hs.getPropertyValue("--r-desk-still-y").trim(),
      deskH: hs.getPropertyValue("--r-desk-still-h").trim(),
    };
  });

  await p.evaluate(() => {
    const f = document.querySelector(".look--footer");
    const y = f.getBoundingClientRect().top + window.scrollY - (innerHeight - 457);
    window.scrollTo(0, Math.max(0, y));
  });
  await p.waitForTimeout(250);

  const footMeta = await p.evaluate(() => {
    const email = document.querySelector(".footer-email");
    const social = document.querySelector(".social-links a");
    const copy = document.querySelector(".copyright");
    const cta = document.querySelector(".look--footer .cta-trial");
    const cs = (el) => getComputedStyle(el);
    return {
      emailFs: cs(email).fontSize,
      emailColor: cs(email).color,
      socialFs: cs(social).fontSize,
      socialColor: cs(social).color,
      copyFs: cs(copy).fontSize,
      copyColor: cs(copy).color,
      ctaMb: cs(cta).marginBottom,
      gapCtaEmail: +(
        email.getBoundingClientRect().top - cta.getBoundingClientRect().bottom
      ).toFixed(1),
      iceInCss: !!Array.from(document.styleSheets).find(() => false),
    };
  });

  // check hover color by temporarily forcing :hover via class simulation — read stylesheet text
  const cssText = fs.readFileSync(path.join(root, "css/styles.css"), "utf8");
  const iceHover =
    /footer-email:hover[\s\S]{0,120}/.exec(cssText)?.[0] ||
    /social-links a:hover[\s\S]{0,120}/.exec(cssText)?.[0] ||
    "missing";

  await p.evaluate(() => {
    document.querySelector("#problem").scrollIntoView({ block: "start" });
  });
  await p.waitForTimeout(200);
  const grain = await p.evaluate(() => {
    const before = getComputedStyle(document.querySelector(".look--copy"), "::before");
    return {
      content: before.content,
      opacity: before.opacity,
      bgImage: before.backgroundImage.slice(0, 220),
      position: before.position,
    };
  });

  // Desire LMS / mid Trial residual hierarchy
  const desireAction = await p.evaluate(() => {
    const mid = document.querySelector(".cta-trial-mid, .look--solution ~ .cta-trial, a.cta-trial");
    const all = [...document.querySelectorAll(".cta-trial")].map((el) => {
      const b = el.getBoundingClientRect();
      const parent = el.closest(".look")?.className || el.parentElement?.className;
      return {
        text: el.textContent.trim().slice(0, 40),
        parent,
        t: +b.top.toFixed(1),
        h: +b.height.toFixed(1),
        fs: getComputedStyle(el).fontSize,
      };
    });
    const sticky = getComputedStyle(document.querySelector(".look-indices") || document.body);
    return { allCtas: all, stickyOp: sticky.opacity };
  });

  const out = { heroY, footMeta, iceHoverSnippet: iceHover.slice(0, 200), grain, desireAction };
  fs.writeFileSync(path.join(__dirname, "footprobe.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await b.close();
  server.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
