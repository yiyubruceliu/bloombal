const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../../src");
const PORT = 9347;
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
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
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
  await new Promise((r) => server.listen(PORT, r));
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  await p.evaluate(() => {
    const f = document.querySelector(".look--footer");
    window.scrollTo(0, f.getBoundingClientRect().top + window.scrollY - 80);
  });
  await p.waitForTimeout(300);

  const baseline = await p.evaluate(() => {
    const h2 = document.querySelector(".look--footer h2");
    const cta = document.querySelector(".look--footer .cta-trial");
    const cs = getComputedStyle(h2);
    const ccs = getComputedStyle(cta);
    const hr = h2.getBoundingClientRect();
    const cr = cta.getBoundingClientRect();
    return {
      h2Mb: cs.marginBottom,
      h2Mt: cs.marginTop,
      h2PadB: cs.paddingBottom,
      h2Lh: cs.lineHeight,
      h2Fs: cs.fontSize,
      h2H: +hr.height.toFixed(1),
      ctaMt: ccs.marginTop,
      ctaPadT: ccs.paddingTop,
      gap: +(cr.top - hr.bottom).toFixed(1),
      className: h2.className,
      parentClass: h2.parentElement?.parentElement?.className,
    };
  });

  // Force more-specific override
  await p.evaluate(() => {
    let s = document.getElementById("diag");
    if (!s) {
      s = document.createElement("style");
      s.id = "diag";
      document.head.appendChild(s);
    }
    s.textContent = `.look.look--footer h2{margin-bottom:1.85rem !important;}`;
  });
  await p.waitForTimeout(100);
  const forced = await p.evaluate(() => {
    const h2 = document.querySelector(".look--footer h2");
    const cta = document.querySelector(".look--footer .cta-trial");
    const cs = getComputedStyle(h2);
    const hr = h2.getBoundingClientRect();
    const cr = cta.getBoundingClientRect();
    return {
      h2Mb: cs.marginBottom,
      gap: +(cr.top - hr.bottom).toFixed(1),
    };
  });

  // Probe ladder with correct specificity
  const probes = [];
  for (const mb of ["1.85rem", "2rem", "2.25rem", "2.5rem"]) {
    await p.evaluate((mb) => {
      document.getElementById("diag").textContent =
        `.look.look--footer h2{margin-bottom:${mb} !important;}`;
    }, mb);
    await p.waitForTimeout(80);
    const m = await p.evaluate(() => {
      const h2 = document.querySelector(".look--footer h2");
      const cta = document.querySelector(".look--footer .cta-trial");
      return {
        h2Mb: getComputedStyle(h2).marginBottom,
        gap: +(
          cta.getBoundingClientRect().top - h2.getBoundingClientRect().bottom
        ).toFixed(1),
      };
    });
    probes.push({ mb, ...m });
  }

  console.log(JSON.stringify({ baseline, forced, probes }, null, 2));
  await b.close();
  server.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
