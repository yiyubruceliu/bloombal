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
  fs.createReadStream(fp).pipe(res);
});

(async () => {
  await new Promise((r) => server.listen(8971, r));
  const b = await chromium.launch({ headless: true });
  const out = {};
  for (const [w, label] of [
    [1280, "d1280"],
    [1120, "w1120"],
  ]) {
    const p = await b.newPage({ viewport: { width: w, height: 720 } });
    await p.goto("http://127.0.0.1:8971/", { waitUntil: "networkidle" });
    await p.click(".process-link");
    await p.waitForTimeout(450);
    out[label] = await p.evaluate(() => {
      const t = document.querySelector("#solution-title").getBoundingClientRect();
      const interestH2 = document.querySelector(".look--copy h2").getBoundingClientRect();
      const interestP = document.querySelector(".look--copy p").getBoundingClientRect();
      const mech = document.querySelector(".mechanism").getBoundingClientRect();
      const lms = document.querySelector(".mechanism-lms").getBoundingClientRect();
      const demo = document.querySelector(".demo-frame").getBoundingClientRect();
      const vis = (box) =>
        Math.max(0, Math.min(box.bottom, innerHeight) - Math.max(box.top, 0));
      return {
        titleT: +t.top.toFixed(1),
        optical: +(t.top + t.height / 2 - innerHeight / 2).toFixed(1),
        interestH2Vis: +vis(interestH2).toFixed(1),
        interestPVis: +vis(interestP).toFixed(1),
        mechVis: +vis(mech).toFixed(1),
        lmsVis: +vis(lms).toFixed(1),
        demoVis: +vis(demo).toFixed(1),
        claimShare: +(
          ((Math.min(lms.bottom, demo.top) - t.top) / innerHeight) *
          100
        ).toFixed(1),
        lmsToDemo: +(demo.top - lms.bottom).toFixed(1),
        titleToMech: +(mech.top - t.bottom).toFixed(1),
        mechToLms: +(lms.top - mech.bottom).toFixed(1),
      };
    });
    await p.screenshot({
      path: path.join(__dirname, `capture-${label}-process-land-bleed.png`),
    });
    await p.close();
  }
  fs.writeFileSync(path.join(__dirname, "bleed.json"), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await b.close();
  server.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
