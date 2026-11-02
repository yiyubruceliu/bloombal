const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../../src");
const out = __dirname;
const PORT = 9341;

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

async function landChrome(page) {
  return page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const vis = (el) => {
      if (!el) return 0;
      const b = el.getBoundingClientRect();
      return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    };
    const frame = q(".demo-frame");
    const video = q(".demo-frame video") || q(".demo-video");
    const fr = frame.getBoundingClientRect();
    const vr = video.getBoundingClientRect();
    const play = [...document.querySelectorAll("a,button")].find((el) =>
      /view process/i.test(el.textContent || "")
    );
    const playR = play?.getBoundingClientRect();
    let oralOverlap = 0;
    if (playR && vr) {
      const oral = {
        left: vr.left + vr.width * 0.25,
        right: vr.left + vr.width * 0.75,
        top: vr.top + vr.height * 0.2,
        bottom: vr.top + vr.height * 0.8,
      };
      const ox = Math.max(0, Math.min(playR.right, oral.right) - Math.max(playR.left, oral.left));
      const oy = Math.max(0, Math.min(playR.bottom, oral.bottom) - Math.max(playR.top, oral.top));
      oralOverlap = ox * oy;
    }
    const title = q("#solution-title").getBoundingClientRect();
    const lms = q(".mechanism-lms").getBoundingClientRect();
    const band = q(".demo-band");
    const chrome = vr.top - fr.top;
    return {
      chromeAbove: +chrome.toFixed(1),
      chromeBelow: +(fr.bottom - vr.bottom).toFixed(1),
      mattePct: +(((fr.height - vr.height) / fr.height) * 100).toFixed(1),
      demoVis: +vis(frame).toFixed(1),
      videoVis: +vis(video).toFixed(1),
      videoShare: +((vis(video) / Math.max(1, vis(frame))) * 100).toFixed(1),
      framePad: getComputedStyle(frame).padding,
      playTop: play ? getComputedStyle(play).top : null,
      playFs: play ? getComputedStyle(play).fontSize : null,
      playPad: play ? getComputedStyle(play).padding : null,
      playH: playR ? +playR.height.toFixed(1) : null,
      playFill: playR && chrome > 0 ? +((playR.height / chrome) * 100).toFixed(1) : null,
      emptyAbove: playR ? +(playR.top - fr.top).toFixed(1) : null,
      emptyBelow: playR ? +(vr.top - playR.bottom).toFixed(1) : null,
      oralOverlap: +oralOverlap.toFixed(1),
      playClearVideo: playR
        ? !(
            playR.bottom > vr.top &&
            playR.top < vr.bottom &&
            playR.right > vr.left &&
            playR.left < vr.right
          )
        : null,
      playInMatte: playR ? playR.bottom <= vr.top + 1 : null,
      optical: +(title.top + title.height / 2 - innerHeight / 2).toFixed(1),
      claimShare: +(((Math.min(lms.bottom, fr.top) - title.top) / innerHeight) * 100).toFixed(1),
      lmsToDemo: +(fr.top - lms.bottom).toFixed(1),
      isIn: /\bis-in\b/.test(band.className),
      interestPVis: +vis(q(".look--copy p")).toFixed(1),
      interestH2Vis: +vis(q(".look--copy h2")).toFixed(1),
      interestFieldVis: +vis(q(".look--copy")).toFixed(1),
    };
  });
}

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch({ headless: true });

  const midConfirm = {};
  for (const [w, h, label] of [
    [1280, 720, "d1280"],
    [1120, 720, "w1120"],
    [390, 844, "m390"],
  ]) {
    const p = await browser.newPage({ viewport: { width: w, height: h } });
    await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
    await p.evaluate(() =>
      document.querySelector(".look-inner--after-demo").scrollIntoView({ block: "center" })
    );
    await p.waitForTimeout(280);
    await p.screenshot({ path: path.join(out, `capture-${label}-mid-block-center.png`) });
    midConfirm[label] = await p.evaluate(() => {
      const q = (s) => document.querySelector(s);
      const vis = (el) => {
        if (!el) return 0;
        const b = el.getBoundingClientRect();
        return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
      };
      const demo = q(".demo-frame").getBoundingClientRect();
      const cta = q(".look-inner--after-demo .cta-trial").getBoundingClientRect();
      const story = q(".look--story");
      return {
        gapDemoToCta: +(cta.top - demo.bottom).toFixed(1),
        urgH2Vis: +vis(q("#urgency h2")).toFixed(1),
        urgPVis: +vis(q("#urgency p")).toFixed(1),
        storyVis: +vis(story).toFixed(1),
        afterPadT: getComputedStyle(q(".look-inner--after-demo")).paddingTop,
        afterPadB: getComputedStyle(q(".look-inner--after-demo")).paddingBottom,
        deltaCx: +(cta.left + cta.width / 2 - innerWidth / 2).toFixed(1),
      };
    });
    await p.close();
  }

  const d = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await d.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  await d.screenshot({ path: path.join(out, "capture-d1280-hero.png") });
  await d.click(".process-link");
  await d.waitForTimeout(500);
  const baseline = await landChrome(d);
  await d.screenshot({ path: path.join(out, "capture-d1280-process-land.png") });
  await d.screenshot({ path: path.join(out, "capture-d1280-demo-chrome.png") });

  // Field anatomy at Desire land
  const fieldAnatomy = await d.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const copy = q(".look--copy");
    const p = q(".look--copy p");
    const h2 = q(".look--copy h2");
    const sol = q(".look--solution");
    const parseRgb = (c) => {
      const m = (c || "").match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      return m ? [+m[1], +m[2], +m[3]] : [0, 0, 0];
    };
    const copyRgb = parseRgb(getComputedStyle(copy).backgroundColor);
    const boneRgb = parseRgb(getComputedStyle(sol).backgroundColor);
    const cr = copy.getBoundingClientRect();
    const pr = p.getBoundingClientRect();
    const hr = h2.getBoundingClientRect();
    const vis = (b) => Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    return {
      copyTop: +cr.top.toFixed(1),
      copyBottom: +cr.bottom.toFixed(1),
      pTop: +pr.top.toFixed(1),
      pBottom: +pr.bottom.toFixed(1),
      h2Top: +hr.top.toFixed(1),
      h2Bottom: +hr.bottom.toFixed(1),
      deadBelowP: +(cr.bottom - pr.bottom).toFixed(1),
      deadAboveInView: +(Math.min(pr.top, innerHeight) - Math.max(cr.top, 0)).toFixed(1),
      fieldVis: +vis(cr).toFixed(1),
      pVis: +vis(pr).toFixed(1),
      h2Vis: +vis(hr).toFixed(1),
      copyPad: getComputedStyle(q(".look--copy .look-inner")).padding,
      copyField: getComputedStyle(copy).backgroundColor,
      solutionField: getComputedStyle(sol).backgroundColor,
      fieldDeltaRgb: Math.max(
        Math.abs(copyRgb[0] - boneRgb[0]),
        Math.abs(copyRgb[1] - boneRgb[1]),
        Math.abs(copyRgb[2] - boneRgb[2])
      ),
      copyGrain: getComputedStyle(copy, "::before").opacity,
      solutionGrain: getComputedStyle(sol, "::before").opacity,
      copyBorderTop: getComputedStyle(copy).borderTop,
    };
  });
  await d.screenshot({ path: path.join(out, "capture-d1280-field-bone.png") });

  // Further matte / quieter play probes (iter40 shipped play 0.72/0.22/0.6)
  const matteCombos = [];
  for (const c of [
    { note: "shipped-iter40" },
    { pt: "2rem", playTop: "0.08rem", note: "2.0+top" },
    {
      pt: "2rem",
      playTop: "0.08rem",
      playFs: "0.68rem",
      playPad: "0.2rem 0.55rem",
      note: "2.0+tighter-play",
    },
    { pt: "1.85rem", playTop: "0.06rem", note: "1.85+top" },
    {
      pt: "1.85rem",
      playTop: "0.06rem",
      playFs: "0.68rem",
      playPad: "0.2rem 0.55rem",
      note: "1.85+tighter-play",
    },
    {
      playFs: "0.68rem",
      playPad: "0.2rem 0.55rem",
      note: "play-quieter-only",
    },
    {
      borderOff: true,
      note: "copy-hairline-off",
    },
  ]) {
    await d.evaluate((c) => {
      const frame = document.querySelector(".demo-frame");
      const play = [...document.querySelectorAll("a,button")].find((el) =>
        /view process/i.test(el.textContent || "")
      );
      const copy = document.querySelector(".look--copy");
      frame.style.removeProperty("padding");
      if (play) {
        play.style.removeProperty("top");
        play.style.removeProperty("font-size");
        play.style.removeProperty("padding");
      }
      copy?.style.removeProperty("border-top");
      if (c.pt) frame.style.padding = `${c.pt} 0.75rem 0.75rem`;
      if (play) {
        if (c.playTop) play.style.top = c.playTop;
        if (c.playFs) play.style.fontSize = c.playFs;
        if (c.playPad) play.style.padding = c.playPad;
      }
      if (c.borderOff) copy.style.borderTop = "none";
    }, c);
    await d.click(".process-link");
    await d.waitForTimeout(400);
    const m = await landChrome(d);
    matteCombos.push({
      ...c,
      ...m,
      dualGateOk:
        m.lmsToDemo >= 40 &&
        m.lmsToDemo <= 48 &&
        m.demoVis >= 115 &&
        Math.abs(m.optical) <= 120 &&
        m.claimShare >= 40 &&
        m.isIn,
      clearOk: m.playClearVideo && m.oralOverlap === 0,
      preferShare72: m.videoShare >= 72,
      preferChrome35: m.chromeAbove <= 35,
      preferShare74: m.videoShare >= 74,
      preferChrome32: m.chromeAbove <= 32,
      playQuiet: m.playFill != null && m.playFill < 70,
    });
  }
  await d.evaluate(() => {
    const frame = document.querySelector(".demo-frame");
    const play = [...document.querySelectorAll("a,button")].find((el) =>
      /view process/i.test(el.textContent || "")
    );
    const copy = document.querySelector(".look--copy");
    frame.style.removeProperty("padding");
    if (play) {
      play.style.removeProperty("top");
      play.style.removeProperty("font-size");
      play.style.removeProperty("padding");
    }
    copy?.style.removeProperty("border-top");
  });

  // Desire→Consequence / solution→story field seam probes
  await d.click(".process-link");
  await d.waitForTimeout(450);
  const seamAnatomy = await d.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const parseRgb = (c) => {
      const m = (c || "").match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      return m ? [+m[1], +m[2], +m[3]] : [0, 0, 0];
    };
    const sol = q(".look--solution");
    const story = q(".look--story");
    const proof = q(".look--proof");
    const copy = q(".look--copy");
    const solRgb = parseRgb(getComputedStyle(sol).backgroundColor);
    const storyRgb = parseRgb(getComputedStyle(story).backgroundColor);
    const proofRgb = parseRgb(getComputedStyle(proof).backgroundColor);
    const boneRgb = parseRgb(getComputedStyle(copy).backgroundColor);
    const delta = (a, b) =>
      Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));
    return {
      solutionField: getComputedStyle(sol).backgroundColor,
      storyField: getComputedStyle(story).backgroundColor,
      proofField: getComputedStyle(proof).backgroundColor,
      copyField: getComputedStyle(copy).backgroundColor,
      copyBorderTop: getComputedStyle(copy).borderTopWidth + " " + getComputedStyle(copy).borderTopColor,
      solStoryDelta: delta(solRgb, storyRgb),
      storyProofDelta: delta(storyRgb, proofRgb),
      copySolDelta: delta(boneRgb, solRgb),
      solutionGrain: getComputedStyle(sol, "::before").opacity,
      storyGrain: getComputedStyle(story, "::before").opacity,
      proofGrain: getComputedStyle(proof, "::before").opacity,
      copyGrain: getComputedStyle(copy, "::before").opacity,
    };
  });

  // Desire→Consequence bridge probes (story field toward bone / quieter grain)
  const storyBridge = [];
  for (const c of [
    { note: "baseline" },
    { field: "var(--bone)", grain: null, note: "story-bone-only" },
    { field: "var(--bone)", grain: "0.25", note: "story-bone+grain25" },
    { field: "var(--bone)", grain: "0.3", note: "story-bone+grain30" },
    { field: "#f4f2ec", grain: "0.3", note: "story-mid+grain30" },
    { field: null, grain: "0.25", note: "story-grain25-only" },
    { field: "var(--bone-deep)", grain: "0.3", note: "story-boneDeep+grain30" },
  ]) {
    await d.evaluate((c) => {
      let s = document.getElementById("gap41-story");
      if (!s) {
        s = document.createElement("style");
        s.id = "gap41-story";
        document.head.appendChild(s);
      }
      let css = "";
      if (c.field) css += `.look--story{background:${c.field} !important;}`;
      if (c.grain) css += `.look--story::before{opacity:${c.grain} !important;}`;
      s.textContent = css;
    }, c);
    await d.evaluate(() => {
      const h2 = document.querySelector("#urgency h2");
      const y =
        h2.getBoundingClientRect().top +
        window.scrollY -
        (innerHeight / 2 - h2.getBoundingClientRect().height / 2);
      window.scrollTo(0, Math.max(0, y));
    });
    await d.waitForTimeout(280);
    const m = await d.evaluate(() => {
      const q = (s) => document.querySelector(s);
      const vis = (el) => {
        if (!el) return 0;
        const b = el.getBoundingClientRect();
        return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
      };
      const parseRgb = (col) => {
        const mm = (col || "").match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        return mm ? [+mm[1], +mm[2], +mm[3]] : [0, 0, 0];
      };
      const story = q(".look--story");
      const sol = q(".look--solution");
      const storyRgb = parseRgb(getComputedStyle(story).backgroundColor);
      const solRgb = parseRgb(getComputedStyle(sol).backgroundColor);
      return {
        storyField: getComputedStyle(story).backgroundColor,
        solStoryDelta: Math.max(
          Math.abs(storyRgb[0] - solRgb[0]),
          Math.abs(storyRgb[1] - solRgb[1]),
          Math.abs(storyRgb[2] - solRgb[2])
        ),
        storyGrain: getComputedStyle(story, "::before").opacity,
        solutionGrain: getComputedStyle(sol, "::before").opacity,
        urgH2Vis: +vis(q("#urgency h2")).toFixed(1),
        partnersPeek: +vis(q("#partners")).toFixed(1),
        storyVis: +vis(story).toFixed(1),
        emptyAboveH2: +(
          q("#urgency h2").getBoundingClientRect().top -
          Math.max(story.getBoundingClientRect().top, 0)
        ).toFixed(1),
        stickyPast: q(".look-indices")?.classList.contains("is-past"),
      };
    });
    storyBridge.push({ ...c, ...m });
  }
  await d.evaluate(() => document.getElementById("gap41-story")?.remove());

  // Hairline-off at Desire land (Interest→Desire continuity polish)
  await d.click(".process-link");
  await d.waitForTimeout(400);
  const hairlineProbe = await d.evaluate(() => {
    const copy = document.querySelector(".look--copy");
    const before = getComputedStyle(copy).borderTop;
    copy.style.borderTop = "none";
    const after = getComputedStyle(copy).borderTop;
    const q = (s) => document.querySelector(s);
    const vis = (el) => {
      if (!el) return 0;
      const b = el.getBoundingClientRect();
      return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    };
    const title = q("#solution-title").getBoundingClientRect();
    const lms = q(".mechanism-lms").getBoundingClientRect();
    const fr = q(".demo-frame").getBoundingClientRect();
    const out = {
      before,
      after,
      interestPVis: +vis(q(".look--copy p")).toFixed(1),
      interestFieldVis: +vis(q(".look--copy")).toFixed(1),
      optical: +(title.top + title.height / 2 - innerHeight / 2).toFixed(1),
      lmsToDemo: +(fr.top - lms.bottom).toFixed(1),
      demoVis: +vis(q(".demo-frame")).toFixed(1),
      isIn: /\bis-in\b/.test(q(".demo-band").className),
      claimShare: +(((Math.min(lms.bottom, fr.top) - title.top) / innerHeight) * 100).toFixed(1),
    };
    copy.style.removeProperty("border-top");
    return out;
  });

  // Attention dual-seam spot-check
  await d.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  await d.waitForTimeout(300);
  const hero = await d.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const brand = q(".look--hero .brand, .look-brand, .wordmark, header .brand");
    const h1 = q(".look--hero h1");
    const lede = q(".look--hero .lede, .look--hero p");
    const cta = q(".look--hero .cta-trial");
    const proc = q(".process-link");
    const desk = q(".hero-desk, .desk-plate, .look--hero img, .look--hero video");
    const gap = (a, b) => {
      if (!a || !b) return null;
      return +(b.getBoundingClientRect().top - a.getBoundingClientRect().bottom).toFixed(1);
    };
    const visH = (el) => {
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return +Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0)).toFixed(1);
    };
    return {
      ledeCta: gap(lede, cta),
      ctaProc: gap(cta, proc),
      procDesk: gap(proc, desk),
      deskVis: visH(desk),
      h1Text: h1?.textContent?.trim()?.slice(0, 80) || null,
    };
  });

  // Interest hash
  await d.goto(`http://127.0.0.1:${PORT}/#problem`, { waitUntil: "networkidle" });
  await d.waitForTimeout(350);
  await d.screenshot({ path: path.join(out, "capture-d1280-interest-hash.png") });
  const interestHash = await d.evaluate(() => {
    const h2 = document.querySelector(".look--copy h2, #problem h2");
    const b = h2.getBoundingClientRect();
    return { optical: +(b.top + b.height / 2 - innerHeight / 2).toFixed(1) };
  });

  // Urgency / partners / footer
  await d.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  await d.evaluate(() => {
    const h2 = document.querySelector("#urgency h2");
    const y =
      h2.getBoundingClientRect().top +
      window.scrollY -
      (innerHeight / 2 - h2.getBoundingClientRect().height / 2);
    window.scrollTo(0, Math.max(0, y));
  });
  await d.waitForTimeout(280);
  await d.screenshot({ path: path.join(out, "capture-d1280-urgency.png") });
  const urgencyCentre = await d.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const vis = (el) => {
      if (!el) return 0;
      const b = el.getBoundingClientRect();
      return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    };
    const h2 = q("#urgency h2").getBoundingClientRect();
    const p = q("#urgency p").getBoundingClientRect();
    const story = q(".look--story").getBoundingClientRect();
    return {
      partnersPeek: +vis(q("#partners")).toFixed(1),
      h2Optical: +(h2.top + h2.height / 2 - innerHeight / 2).toFixed(1),
      emptyAboveH2: +(h2.top - Math.max(story.top, 0)).toFixed(1),
      emptyBelowP: +(Math.min(story.bottom, innerHeight) - p.bottom).toFixed(1),
      storyGrain: getComputedStyle(q(".look--story"), "::before").opacity,
      stickyPast: q(".look-indices")?.classList.contains("is-past"),
    };
  });

  await d.evaluate(() => {
    const el = document.querySelector("#partners");
    const y =
      el.getBoundingClientRect().top +
      window.scrollY -
      (innerHeight / 2 - el.getBoundingClientRect().height / 2);
    window.scrollTo(0, Math.max(0, y));
  });
  await d.waitForTimeout(280);
  await d.screenshot({ path: path.join(out, "capture-d1280-partners.png") });
  const partnersCentre = await d.evaluate(() => {
    const vis = (el) => {
      if (!el) return 0;
      const b = el.getBoundingClientRect();
      return Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    };
    return {
      urgPeek: +vis(document.querySelector("#urgency")).toFixed(1),
      contactPeek: +vis(document.querySelector("#contact")).toFixed(1),
      proofGrain: getComputedStyle(document.querySelector(".look--proof"), "::before").opacity,
    };
  });

  await d.evaluate(() => {
    const f = document.querySelector(".look--footer");
    window.scrollTo(0, f.getBoundingClientRect().top + window.scrollY - 80);
  });
  await d.waitForTimeout(250);
  await d.screenshot({ path: path.join(out, "capture-d1280-footer-start.png") });
  const footer = await d.evaluate(() => {
    const h2 = document.querySelector(".look--footer h2");
    const cs = getComputedStyle(h2);
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
    const bg = getComputedStyle(document.querySelector(".look--footer")).backgroundColor;
    const L1 = lum(parse(cs.color));
    const L2 = lum(parse(bg));
    const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    return {
      contrast: +ratio.toFixed(2),
      h2Fs: cs.fontSize,
      solutionH2Fs: getComputedStyle(document.querySelector("#solution-title")).fontSize,
    };
  });

  for (const [w, h, label] of [
    [1120, 720, "w1120"],
    [390, 844, "m390"],
  ]) {
    const p = await browser.newPage({ viewport: { width: w, height: h } });
    await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
    if (label === "m390") await p.screenshot({ path: path.join(out, "capture-m390-hero.png") });
    await p.click(".process-link");
    await p.waitForTimeout(500);
    await p.screenshot({ path: path.join(out, `capture-${label}-process-land.png`) });
    await p.close();
  }

  const iter40Bone =
    fieldAnatomy.fieldDeltaRgb === 0 && Number(fieldAnatomy.copyGrain) === 0.25;
  const iter40Play =
    baseline.playFill != null &&
    baseline.playFill < 75 &&
    /0\.72rem/.test(String(baseline.playFs || "")) ;
  const dualGateHold =
    baseline.videoShare >= 72 &&
    baseline.chromeAbove <= 35 &&
    baseline.playClearVideo &&
    baseline.oralOverlap === 0 &&
    baseline.lmsToDemo >= 40 &&
    baseline.lmsToDemo <= 48 &&
    baseline.demoVis >= 115 &&
    baseline.isIn &&
    baseline.interestPVis <= 12 &&
    baseline.claimShare >= 40 &&
    Math.abs(baseline.optical) <= 120;

  const midPaid =
    midConfirm.d1280?.urgH2Vis === 0 &&
    midConfirm.w1120?.urgH2Vis === 0 &&
    midConfirm.m390?.urgH2Vis === 0;

  const safeFurther = matteCombos.filter(
    (m) =>
      m.note !== "shipped-iter40" &&
      m.note !== "copy-hairline-off" &&
      m.dualGateOk &&
      m.clearOk &&
      (m.preferShare74 || m.preferChrome32 || m.playQuiet)
  );

  const storySafe = storyBridge.filter(
    (b) =>
      b.note !== "baseline" &&
      b.partnersPeek === 0 &&
      b.urgH2Vis > 0 &&
      b.stickyPast === true
  );

  let nextPrimary = "scan-captures-for-craft";
  if (!iter40Bone) {
    nextPrimary = "interest-field-colour-grain-bridge";
  } else if (seamAnatomy.solStoryDelta > 0 || Number(seamAnatomy.storyGrain) > 0.3) {
    nextPrimary = "desire-consequence-field-grain-bridge";
  } else if (/\d+px/.test(fieldAnatomy.copyBorderTop) && !/^0px/.test(fieldAnatomy.copyBorderTop)) {
    nextPrimary = "interest-desire-hairline-drop";
  } else if (safeFurther.length) {
    nextPrimary = "further-matte-or-play-quiet";
  }

  const result = {
    midConfirm,
    baseline,
    fieldAnatomy,
    seamAnatomy,
    storyBridge,
    storySafe,
    hairlineProbe,
    matteCombos,
    safeFurther,
    hero,
    interestHash,
    urgencyCentre,
    partnersCentre,
    footer,
    acceptance: {
      iter40_fieldDelta0: fieldAnatomy.fieldDeltaRgb === 0,
      iter40_grain25: Number(fieldAnatomy.copyGrain) === 0.25,
      iter40_playFillUnder75: baseline.playFill != null && baseline.playFill < 75,
      iter40_playFs72: /0\.72rem/.test(String(baseline.playFs || "")),
      hold_videoShare72: baseline.videoShare >= 72,
      hold_chrome35: baseline.chromeAbove <= 35,
      hold_clearOral: baseline.playClearVideo && baseline.oralOverlap === 0,
      hold_dualGate:
        baseline.lmsToDemo >= 40 &&
        baseline.lmsToDemo <= 48 &&
        baseline.demoVis >= 115 &&
        baseline.isIn,
      hold_interestPVis12: baseline.interestPVis <= 12,
      hold_mid: midPaid,
      iter40Bone,
      iter40Play,
      dualGateHold,
      midPaid,
    },
    recommendation: {
      nextPrimary,
      solStoryDelta: seamAnatomy.solStoryDelta,
      storyGrainLoud: Number(seamAnatomy.storyGrain) > 0.3,
      copyHairlinePresent: !/^0px/.test(String(fieldAnatomy.copyBorderTop || "")),
      furtherMatteSafe: safeFurther,
      storySafe,
    },
  };

  fs.writeFileSync(path.join(out, "verify40.json"), JSON.stringify(result, null, 2));
  console.log(
    JSON.stringify(
      {
        acceptance: result.acceptance,
        baseline: {
          videoShare: baseline.videoShare,
          chromeAbove: baseline.chromeAbove,
          playFill: baseline.playFill,
          playFs: baseline.playFs,
          playPad: baseline.playPad,
          playH: baseline.playH,
          clear: baseline.playClearVideo,
          oral: baseline.oralOverlap,
          lmsToDemo: baseline.lmsToDemo,
          demoVis: baseline.demoVis,
          isIn: baseline.isIn,
          claimShare: baseline.claimShare,
          optical: baseline.optical,
          interestPVis: baseline.interestPVis,
          interestFieldVis: baseline.interestFieldVis,
        },
        midConfirm,
        fieldAnatomy,
        seamAnatomy,
        hairlineProbe,
        safeFurther: safeFurther.map((m) => ({
          note: m.note,
          videoShare: m.videoShare,
          chromeAbove: m.chromeAbove,
          playFill: m.playFill,
          clearOk: m.clearOk,
          dualGateOk: m.dualGateOk,
        })),
        storySafe: storySafe.map((b) => ({
          note: b.note,
          solStoryDelta: b.solStoryDelta,
          storyGrain: b.storyGrain,
          partnersPeek: b.partnersPeek,
          urgH2Vis: b.urgH2Vis,
        })),
        hero,
        interestHash,
        urgencyCentre,
        partnersCentre,
        footer,
        nextPrimary,
      },
      null,
      2
    )
  );

  await browser.close();
  server.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
