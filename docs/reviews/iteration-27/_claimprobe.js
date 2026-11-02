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
  await new Promise((r) => server.listen(8573, r));
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage({ viewport: { width: 1120, height: 720 } });
  await p.goto("http://127.0.0.1:8573/", { waitUntil: "networkidle" });
  await p.click(".process-link");
  await p.waitForTimeout(400);
  const m = await p.evaluate(() => {
    const cs = (s) => getComputedStyle(document.querySelector(s));
    const box = (s) => document.querySelector(s).getBoundingClientRect();
    const t = box("#solution-title");
    const mech = box(".mechanism");
    const lms = box(".mechanism-lms");
    const demo = box(".demo-band");
    const claimH = Math.min(lms.bottom, demo.top) - t.top;
    return {
      claimH: +claimH.toFixed(1),
      claimShare: +((claimH / innerHeight) * 100).toFixed(1),
      titleH: +t.height.toFixed(1),
      mechH: +mech.height.toFixed(1),
      lmsH: +lms.height.toFixed(1),
      titleToMech: +(mech.top - t.bottom).toFixed(1),
      mechToLms: +(lms.top - mech.bottom).toFixed(1),
      lmsToDemo: +(demo.top - lms.bottom).toFixed(1),
      lmsFs: cs(".mechanism-lms").fontSize,
      lmsFw: cs(".mechanism-lms").fontWeight,
      lmsColor: cs(".mechanism-lms").color,
      mechFs: cs(".mechanism").fontSize,
      solFs: cs("#solution-title").fontSize,
      solPadT: cs(".look--solution > .look-inner:first-of-type").paddingTop,
      playText: document.querySelector(".demo-play")?.textContent,
      playAria: document.querySelector(".demo-play")?.getAttribute("aria-label"),
    };
  });

  await p.setViewportSize({ width: 1280, height: 720 });
  await p.goto("http://127.0.0.1:8573/", { waitUntil: "networkidle" });
  await p.evaluate(() =>
    document.querySelector("#urgency").scrollIntoView({ block: "center" })
  );
  await p.waitForTimeout(200);
  const u = await p.evaluate(() => {
    const body = document.querySelector(".look--story p");
    const pb = body ? body.getBoundingClientRect().bottom : null;
    const part = document.querySelector("#partners").getBoundingClientRect();
    const story = document.querySelector(".look--story").getBoundingClientRect();
    const proof = document.querySelector(".look--proof").getBoundingClientRect();
    return {
      bodyBottom: pb,
      emptyBelowBody: pb ? +(innerHeight - pb).toFixed(1) : null,
      partnersVis: Math.max(
        0,
        Math.min(part.bottom, innerHeight) - Math.max(part.top, 0)
      ),
      storyBottom: +story.bottom.toFixed(1),
      proofTop: +proof.top.toFixed(1),
      proofBg: getComputedStyle(document.querySelector(".look--proof"))
        .backgroundColor,
      storyBg: getComputedStyle(document.querySelector(".look--story"))
        .backgroundColor,
    };
  });

  await p.setViewportSize({ width: 390, height: 844 });
  await p.goto("http://127.0.0.1:8573/", { waitUntil: "networkidle" });
  await p.evaluate(() =>
    document.querySelector("#urgency").scrollIntoView({ block: "center" })
  );
  await p.waitForTimeout(200);
  const mob = await p.evaluate(() => {
    const body = document.querySelector(".look--story p");
    const pb = body ? body.getBoundingClientRect().bottom : null;
    const part = document.querySelector("#partners").getBoundingClientRect();
    return {
      emptyBelowBody: pb ? +(innerHeight - pb).toFixed(1) : null,
      partnersVis: Math.max(
        0,
        Math.min(part.bottom, innerHeight) - Math.max(part.top, 0)
      ),
      partnersT: +part.top.toFixed(1),
      proofBgAtBottom: (() => {
        const el = document.elementFromPoint(195, 840);
        return el
          ? getComputedStyle(el.closest(".look") || el).backgroundColor
          : null;
      })(),
    };
  });

  const result = { m, u, mob };
  fs.writeFileSync(
    path.join(__dirname, "claimprobe.json"),
    JSON.stringify(result, null, 2)
  );
  console.log(JSON.stringify(result, null, 2));
  await b.close();
  server.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
