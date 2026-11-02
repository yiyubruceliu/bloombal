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
  await new Promise((r) => server.listen(8931, r));
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.goto("http://127.0.0.1:8931/", { waitUntil: "networkidle" });

  const interest = await p.evaluate(() => {
    const body = document.querySelector(".look--copy p");
    const inner = document.querySelector(".look--copy .look-inner");
    const cs = getComputedStyle(body);
    const br = body.getBoundingClientRect();
    const ir = inner.getBoundingClientRect();
    const chPx = (() => {
      const s = document.createElement("span");
      s.textContent = "abcdefghijklmnopqrstuvwxyz";
      s.style.cssText = `font:${cs.font};position:absolute;visibility:hidden;white-space:nowrap`;
      document.body.appendChild(s);
      const w = s.getBoundingClientRect().width / 26;
      s.remove();
      return w;
    })();
    return {
      bodyFs: cs.fontSize,
      bodyMw: cs.maxWidth,
      bodyW: +br.width.toFixed(1),
      measureChCss: +(br.width / parseFloat(cs.fontSize)).toFixed(1),
      measureChGlyph: +(br.width / chPx).toFixed(1),
      innerW: +ir.width.toFixed(1),
      innerMaxW: getComputedStyle(inner).maxWidth,
      lookInnerRule: getComputedStyle(inner).width,
    };
  });

  const desk = await p.evaluate(() => {
    const desk = document.querySelector(".hero-desk").getBoundingClientRect();
    const proc = document.querySelector(".process-link").getBoundingClientRect();
    const lede = document.querySelector(".hero-lede").getBoundingClientRect();
    const cta = document.querySelector(".look--hero .cta-trial").getBoundingClientRect();
    return {
      deskH: +desk.height.toFixed(1),
      deskVis: +(Math.min(desk.bottom, innerHeight) - Math.max(desk.top, 0)).toFixed(1),
      procDesk: +(desk.top - proc.bottom).toFixed(1),
      ledeCta: +(cta.top - lede.bottom).toFixed(1),
      ctaProc: +(proc.top - cta.bottom).toFixed(1),
      deskTopCss: getComputedStyle(document.querySelector(".hero-desk")).top,
      deskHCss: getComputedStyle(document.querySelector(".hero-desk")).height,
    };
  });

  // footer start: same as measure â€” scroll until footer top enters
  await p.evaluate(() => {
    const f = document.querySelector(".look--footer");
    const y = f.getBoundingClientRect().top + window.scrollY - (innerHeight - 457);
    window.scrollTo(0, Math.max(0, y));
  });
  await p.waitForTimeout(250);
  const foot = await p.evaluate(() => {
    const h2 = document.querySelector(".look--footer h2");
    const cta = document.querySelector(".look--footer .cta-trial");
    const hb = h2.getBoundingClientRect();
    const cb = cta.getBoundingClientRect();
    const vis = (el) => {
      const b = el.getBoundingClientRect();
      return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    };
    return {
      h2Text: h2.textContent.trim(),
      h2Fs: getComputedStyle(h2).fontSize,
      h2Lh: getComputedStyle(h2).lineHeight,
      h2H: +hb.height.toFixed(1),
      h2T: +hb.top.toFixed(1),
      h2Vis: +vis(h2).toFixed(1),
      ctaH: +cb.height.toFixed(1),
      ctaT: +cb.top.toFixed(1),
      ctaVis: +vis(cta).toFixed(1),
      footerTopVp: +document.querySelector(".look--footer").getBoundingClientRect().top.toFixed(1),
      padT: getComputedStyle(document.querySelector(".look--footer .look-inner")).paddingTop,
    };
  });

  await p.setViewportSize({ width: 1120, height: 720 });
  await p.goto("http://127.0.0.1:8931/", { waitUntil: "networkidle" });
  await p.click(".process-link");
  await p.waitForTimeout(400);
  const claim = await p.evaluate(() => {
    const t = document.querySelector("#solution-title").getBoundingClientRect();
    const lms = document.querySelector(".mechanism-lms").getBoundingClientRect();
    const demo = document.querySelector(".demo-band").getBoundingClientRect();
    const claimH = Math.min(lms.bottom, demo.top) - t.top;
    return {
      claimH: +claimH.toFixed(1),
      share: +((claimH / innerHeight) * 100).toFixed(1),
      need40: +(0.4 * innerHeight).toFixed(1),
      short40: +(0.4 * innerHeight - claimH).toFixed(1),
      optical: +(t.top + t.height / 2 - innerHeight / 2).toFixed(1),
      lines: Math.round(t.height / parseFloat(getComputedStyle(document.querySelector("#solution-title")).lineHeight)),
    };
  });

  const out = { interest, desk, foot, claim };
  fs.writeFileSync(path.join(__dirname, "accept.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await b.close();
  server.close();
})();
