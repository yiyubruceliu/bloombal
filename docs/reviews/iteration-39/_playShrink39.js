const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../../src");
const out = __dirname;
const PORT = 9339;

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
  await new Promise((r) => server.listen(PORT, r));
  const b = await chromium.launch({ headless: true });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  await p.click(".process-link");
  await p.waitForTimeout(500);

  const combos = [
    { note: "baseline" },
    { playFs: "0.78rem", playPad: "0.28rem 0.7rem", note: "shrink-only" },
    { playFs: "0.75rem", playPad: "0.25rem 0.65rem", note: "shrink-tighter" },
    {
      pt: "2.1rem",
      playTop: "0.12rem",
      playFs: "0.78rem",
      playPad: "0.28rem 0.7rem",
      note: "2.1+shrink",
    },
    {
      pt: "2rem",
      playTop: "0.08rem",
      playFs: "0.78rem",
      playPad: "0.28rem 0.7rem",
      note: "2.0+shrink",
    },
    {
      pt: "2.1rem",
      playTop: "0.12rem",
      note: "2.1-no-shrink",
    },
  ];
  const outRows = [];
  for (const c of combos) {
    await p.evaluate((c) => {
      const frame = document.querySelector(".demo-frame");
      const play = [...document.querySelectorAll("a,button")].find((el) =>
        /view process/i.test(el.textContent || "")
      );
      frame.style.removeProperty("padding");
      play.style.removeProperty("top");
      play.style.removeProperty("font-size");
      play.style.removeProperty("padding");
      if (c.pt) frame.style.padding = `${c.pt} 0.75rem 0.75rem`;
      if (c.playTop) play.style.top = c.playTop;
      if (c.playFs) play.style.fontSize = c.playFs;
      if (c.playPad) play.style.padding = c.playPad;
    }, c);
    await p.click(".process-link");
    await p.waitForTimeout(350);
    const m = await p.evaluate(() => {
      const frame = document.querySelector(".demo-frame");
      const video = document.querySelector(".demo-frame video");
      const play = [...document.querySelectorAll("a,button")].find((el) =>
        /view process/i.test(el.textContent || "")
      );
      const fr = frame.getBoundingClientRect();
      const vr = video.getBoundingClientRect();
      const pr = play.getBoundingClientRect();
      const vis = (el) => {
        const b = el.getBoundingClientRect();
        return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
      };
      const chrome = vr.top - fr.top;
      return {
        chromeAbove: +chrome.toFixed(1),
        playH: +pr.height.toFixed(1),
        playFill: +((pr.height / chrome) * 100).toFixed(1),
        emptyAbove: +(pr.top - fr.top).toFixed(1),
        emptyBelow: +(vr.top - pr.bottom).toFixed(1),
        videoShare: +((vis(video) / Math.max(1, vis(frame))) * 100).toFixed(1),
        clear: !(
          pr.bottom > vr.top &&
          pr.top < vr.bottom &&
          pr.right > vr.left &&
          pr.left < vr.right
        ),
        lmsToDemo: +(
          fr.top - document.querySelector(".mechanism-lms").getBoundingClientRect().bottom
        ).toFixed(1),
        demoVis: +vis(frame).toFixed(1),
        isIn: /\bis-in\b/.test(document.querySelector(".demo-band").className),
        interestPVis: +vis(document.querySelector(".look--copy p")).toFixed(1),
      };
    });
    outRows.push({ ...c, ...m });
  }

  fs.writeFileSync(path.join(out, "playShrink39.json"), JSON.stringify(outRows, null, 2));
  console.log(JSON.stringify(outRows, null, 2));
  await b.close();
  server.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
