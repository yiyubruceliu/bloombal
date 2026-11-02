const { chromium } = require("playwright");
const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../../../src");
const out = __dirname;
const PORT = 9032;

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

function glyph(el) {
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
    fw: cs.fontWeight,
    mt: cs.marginTop,
    mb: cs.marginBottom,
    lh: cs.lineHeight,
  };
}

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);

  // --- Attention hero ---
  await page.screenshot({ path: path.join(out, "capture-d1280-hero.png") });
  const hero = await page.evaluate(() => {
    const desk = document.querySelector(".hero-desk").getBoundingClientRect();
    const proc = document.querySelector(".process-link").getBoundingClientRect();
    const lede = document.querySelector(".hero-lede").getBoundingClientRect();
    const cta = document.querySelector(".look--hero .cta-trial").getBoundingClientRect();
    return {
      deskVis: +(Math.min(desk.bottom, innerHeight) - Math.max(desk.top, 0)).toFixed(1),
      procDesk: +(desk.top - proc.bottom).toFixed(1),
      ledeCta: +(cta.top - lede.bottom).toFixed(1),
      ctaProc: +(proc.top - cta.bottom).toFixed(1),
      liveLag: {
        hasOverFooterLogicHint: !!(window.__lookNav && String(window.__lookNav).includes("footer")),
        scriptHint: document.querySelector("script")?.textContent?.includes("look--footer") || false,
      },
    };
  });

  // --- Glyph + grains @1280 ---
  const measures = await page.evaluate((glyphSrc) => {
    // eslint-disable-next-line no-eval
    eval("window.__glyph = " + glyphSrc);
    const before = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const cs = getComputedStyle(el, "::before");
      return {
        content: cs.content,
        opacity: cs.opacity,
        bgImage: (cs.backgroundImage || "").slice(0, 180),
      };
    };
    return {
      interest: window.__glyph(document.querySelector(".look--copy p")),
      urgBody: window.__glyph(document.querySelector("#urgency p")),
      mech: window.__glyph(document.querySelector(".mechanism")),
      lms: window.__glyph(document.querySelector(".mechanism-lms")),
      storyGrain: before(".look--story"),
      copyGrain: before(".look--copy"),
      proofGrain: before(".look--proof"),
      proofInnerZ: getComputedStyle(document.querySelector(".look--proof .look-inner")).zIndex,
      proofBg: getComputedStyle(document.querySelector(".look--proof")).backgroundColor,
    };
  }, glyph.toString());

  // Desire land @1280
  await page.click(".process-link");
  await page.waitForTimeout(450);
  await page.screenshot({ path: path.join(out, "capture-d1280-process-land.png") });
  const desire1280 = await page.evaluate((glyphSrc) => {
    eval("window.__glyph = " + glyphSrc);
    const q = (s) => document.querySelector(s);
    const box = (el) => {
      const b = el.getBoundingClientRect();
      return { t: +b.top.toFixed(1), b: +b.bottom.toFixed(1), h: +b.height.toFixed(1) };
    };
    const title = box(q("#solution-title"));
    const mech = box(q(".mechanism"));
    const lms = box(q(".mechanism-lms"));
    const demo = box(q(".demo-frame"));
    const interestH2 = q(".look--copy h2").getBoundingClientRect();
    const interestP = q(".look--copy p").getBoundingClientRect();
    const vis = (b) => Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    const claimH = Math.min(lms.b, demo.t) - title.t;
    const titleEl = q("#solution-title");
    const lineH = parseFloat(getComputedStyle(titleEl).lineHeight);
    return {
      title,
      titleLines: Math.round(title.h / lineH),
      gaps: {
        titleToMech: +(mech.t - title.b).toFixed(1),
        mechToLms: +(lms.t - mech.b).toFixed(1),
        lmsToDemo: +(demo.t - lms.b).toFixed(1),
      },
      claimShare: +((claimH / innerHeight) * 100).toFixed(1),
      optical: +(title.t + title.h / 2 - innerHeight / 2).toFixed(1),
      interestH2Vis: +vis(interestH2).toFixed(1),
      interestPVis: +vis(interestP).toFixed(1),
      mechVis: +vis(q(".mechanism").getBoundingClientRect()).toFixed(1),
      lmsVis: +vis(q(".mechanism-lms").getBoundingClientRect()).toFixed(1),
      demoVis: +vis(q(".demo-frame").getBoundingClientRect()).toFixed(1),
      lms: window.__glyph(q(".mechanism-lms")),
      mech: window.__glyph(q(".mechanism")),
      viewProcess: (() => {
        const vp = q(".demo-view-process") || q(".view-process") || q("[href='#solution']");
        const oral = q(".demo-oral") || q(".demo-play");
        const frame = q(".demo-frame").getBoundingClientRect();
        // try common selectors
        const link = [...document.querySelectorAll("a,button")].find((el) =>
          /view process/i.test(el.textContent || "")
        );
        if (!link) return { found: false };
        const lr = link.getBoundingClientRect();
        const oralR = oral ? oral.getBoundingClientRect() : null;
        return {
          found: true,
          text: link.textContent.trim(),
          top: +lr.top.toFixed(1),
          left: +lr.left.toFixed(1),
          overlapsVideo: !(
            lr.bottom < frame.top ||
            lr.top > frame.bottom ||
            lr.right < frame.left ||
            lr.left > frame.right
          )
            ? false
            : !(lr.right < frame.left || lr.left > frame.right) &&
              !(lr.bottom < frame.top || lr.top > frame.bottom),
          oralOverlap: oralR
            ? Math.max(
                0,
                Math.min(lr.bottom, oralR.bottom) - Math.max(lr.top, oralR.top)
              ) > 0 &&
              Math.max(0, Math.min(lr.right, oralR.right) - Math.max(lr.left, oralR.left)) > 0
            : null,
        };
      })(),
    };
  }, glyph.toString());

  // Desire @1120
  const p1120 = await browser.newPage({ viewport: { width: 1120, height: 720 } });
  await p1120.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  await p1120.click(".process-link");
  await p1120.waitForTimeout(450);
  await p1120.screenshot({ path: path.join(out, "capture-w1120-desire-stack.png") });
  const desire1120 = await p1120.evaluate((glyphSrc) => {
    eval("window.__glyph = " + glyphSrc);
    const q = (s) => document.querySelector(s);
    const box = (el) => {
      const b = el.getBoundingClientRect();
      return { t: +b.top.toFixed(1), b: +b.bottom.toFixed(1), h: +b.height.toFixed(1) };
    };
    const title = box(q("#solution-title"));
    const mech = box(q(".mechanism"));
    const lms = box(q(".mechanism-lms"));
    const demo = box(q(".demo-frame"));
    const interestP = q(".look--copy p").getBoundingClientRect();
    const interestH2 = q(".look--copy h2").getBoundingClientRect();
    const vis = (b) => Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    const claimH = Math.min(lms.b, demo.t) - title.t;
    const titleEl = q("#solution-title");
    const lineH = parseFloat(getComputedStyle(titleEl).lineHeight);
    return {
      title,
      titleLines: Math.round(title.h / lineH),
      gaps: {
        titleToMech: +(mech.t - title.b).toFixed(1),
        mechToLms: +(lms.t - mech.b).toFixed(1),
        lmsToDemo: +(demo.t - lms.b).toFixed(1),
      },
      claimShare: +((claimH / innerHeight) * 100).toFixed(1),
      optical: +(title.t + title.h / 2 - innerHeight / 2).toFixed(1),
      interestH2Vis: +vis(interestH2).toFixed(1),
      interestPVis: +vis(interestP).toFixed(1),
      lms: window.__glyph(q(".mechanism-lms")),
      mech: window.__glyph(q(".mechanism")),
    };
  }, glyph.toString());
  await p1120.close();

  // Mid CTA
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    const mid = [...document.querySelectorAll(".cta-trial")][1];
    const y =
      mid.getBoundingClientRect().top +
      window.scrollY -
      (innerHeight / 2 - mid.getBoundingClientRect().height / 2);
    window.scrollTo(0, Math.max(0, y));
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(out, "capture-d1280-mid-cta.png") });
  const mid = await page.evaluate(() => {
    const demo = document.querySelector(".demo-frame").getBoundingClientRect();
    const midEl = [...document.querySelectorAll(".cta-trial")][1].getBoundingClientRect();
    const urg = document.querySelector("#urgency").getBoundingClientRect();
    const midCx = midEl.left + midEl.width / 2;
    return {
      gapDemoToCta: +(midEl.top - demo.bottom).toFixed(1),
      urgVis: Math.max(0, Math.min(urg.bottom, innerHeight) - Math.max(urg.top, 0)),
      afterPadT: getComputedStyle(document.querySelector(".look-inner--after-demo")).paddingTop,
      deltaCx: +(midCx - innerWidth / 2).toFixed(1),
    };
  });

  // Urgency centre + peeks
  await page.evaluate(() => {
    const h2 = document.querySelector("#urgency h2");
    const y =
      h2.getBoundingClientRect().top +
      window.scrollY -
      (innerHeight / 2 - h2.getBoundingClientRect().height / 2);
    window.scrollTo(0, Math.max(0, y));
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(out, "capture-d1280-urgency.png") });
  const urg = await page.evaluate(() => {
    const h2 = document.querySelector("#urgency h2").getBoundingClientRect();
    const partners = document.querySelector("#partners").getBoundingClientRect();
    const contact = document.querySelector("#contact")
      ? document.querySelector("#contact").getBoundingClientRect()
      : null;
    const vis = (b) => Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    return {
      urgOptical: +(h2.top + h2.height / 2 - innerHeight / 2).toFixed(1),
      partnersVis: +vis(partners).toFixed(1),
      contactVis: contact ? +vis(contact).toFixed(1) : null,
    };
  });

  // Partners centre
  await page.evaluate(() => {
    const h2 = document.querySelector("#partners h2") || document.querySelector(".look--proof h2");
    const y =
      h2.getBoundingClientRect().top +
      window.scrollY -
      (innerHeight / 2 - h2.getBoundingClientRect().height / 2);
    window.scrollTo(0, Math.max(0, y));
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(out, "capture-d1280-partners.png") });
  const partners = await page.evaluate(() => {
    const urg = document.querySelector("#urgency").getBoundingClientRect();
    const contact =
      document.querySelector(".look--footer") || document.querySelector("#contact");
    const cr = contact.getBoundingClientRect();
    const vis = (b) => Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
    const logos = [...document.querySelectorAll(".look--proof img, .partners img, #partners img")];
    return {
      urgVis: +vis(urg).toFixed(1),
      contactVis: +vis(cr).toFixed(1),
      logoCount: logos.length,
      proofGrainOpacity: getComputedStyle(document.querySelector(".look--proof"), "::before")
        .opacity,
    };
  });

  // Footer start
  await page.evaluate(() => {
    const f = document.querySelector(".look--footer");
    window.scrollTo(0, f.getBoundingClientRect().top + window.scrollY - 263);
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(out, "capture-d1280-footer-start.png") });
  const footer = await page.evaluate((glyphSrc) => {
    eval("window.__glyph = " + glyphSrc);
    const h2 = document.querySelector(".look--footer h2");
    const cta = document.querySelector(".look--footer .cta-trial");
    const contact = document.querySelector(".look--footer .footer-contact, .look--footer a[href^='mailto']");
    const copy = document.querySelector(".look--footer .footer-copy, .look--footer .copyright, .look--footer small");
    const hr = h2.getBoundingClientRect();
    const cr = cta.getBoundingClientRect();
    const vis = (b) => Math.max(0, Math.min(b.bottom, innerHeight) - Math.max(b.top, 0));
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
    const solH2 = document.querySelector("#solution-title");
    return {
      h2Vis: +vis(hr).toFixed(1),
      ctaVis: +vis(cr).toFixed(1),
      h2Color: cs.color,
      h2Fs: cs.fontSize,
      footerBg: bg,
      contrast: +ratio.toFixed(2),
      solutionFs: solH2 ? getComputedStyle(solH2).fontSize : null,
      contactOp: contact ? getComputedStyle(contact).opacity : null,
      copyOp: copy ? getComputedStyle(copy).opacity || getComputedStyle(copy).color : null,
    };
  }, glyph.toString());

  // Interest land optical
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    const h2 = document.querySelector(".look--copy h2");
    const y =
      h2.getBoundingClientRect().top +
      window.scrollY -
      (innerHeight / 2 - h2.getBoundingClientRect().height / 2);
    window.scrollTo(0, Math.max(0, y));
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: path.join(out, "capture-d1280-interest.png") });
  const interestLand = await page.evaluate(() => {
    const h2 = document.querySelector(".look--copy h2").getBoundingClientRect();
    const body = document.querySelector(".look--copy p").getBoundingClientRect();
    return {
      optical: +(h2.top + h2.height / 2 - innerHeight / 2).toFixed(1),
      emptyBelow: +(innerHeight - body.bottom).toFixed(1),
      field: getComputedStyle(document.querySelector(".look--copy")).backgroundColor,
      grainOp: getComputedStyle(document.querySelector(".look--copy"), "::before").opacity,
    };
  });

  // Story grain capture
  await page.evaluate(() => {
    const h2 = document.querySelector("#urgency h2");
    const y =
      h2.getBoundingClientRect().top +
      window.scrollY -
      (innerHeight / 2 - h2.getBoundingClientRect().height / 2);
    window.scrollTo(0, Math.max(0, y));
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(out, "capture-d1280-story-grain.png") });

  // Proof grain capture (partners)
  await page.evaluate(() => {
    const h2 = document.querySelector(".look--proof h2");
    const y =
      h2.getBoundingClientRect().top +
      window.scrollY -
      (innerHeight / 2 - h2.getBoundingClientRect().height / 2);
    window.scrollTo(0, Math.max(0, y));
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(out, "capture-d1280-proof-grain.png") });

  // Mobile hero
  const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await m.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" });
  await m.waitForTimeout(200);
  await m.screenshot({ path: path.join(out, "capture-m390-hero.png") });
  await m.close();

  // Acceptance gates
  const accept = {
    lmsGlyph: {
      value: measures.lms?.glyphCh,
      pass: measures.lms?.glyphCh >= 65,
      target: ">=65",
    },
    lmsToDemo1120: {
      value: desire1120.gaps.lmsToDemo,
      pass: desire1120.gaps.lmsToDemo >= 40,
      target: ">=40",
    },
    lmsToDemo1280: {
      value: desire1280.gaps.lmsToDemo,
      pass: desire1280.gaps.lmsToDemo >= 40,
      target: ">=40",
    },
    claimShare1120: {
      value: desire1120.claimShare,
      pass: desire1120.claimShare >= 40,
      target: ">=40",
    },
    claimShare1280: {
      value: desire1280.claimShare,
      pass: desire1280.claimShare >= 40,
      target: ">=40",
    },
    titleLines1120: {
      value: desire1120.titleLines,
      pass: desire1120.titleLines === 2,
      target: "2",
    },
    optical1120: {
      value: desire1120.optical,
      pass: Math.abs(desire1120.optical) <= 120,
      target: "±120",
    },
    proofGrain: {
      value: measures.proofGrain?.opacity,
      pass:
        measures.proofGrain?.content === '""' &&
        parseFloat(measures.proofGrain?.opacity) >= 0.25 &&
        parseFloat(measures.proofGrain?.opacity) <= 0.35,
      target: "0.25–0.35",
    },
    partnersPeeks: {
      urgVis: partners.urgVis,
      contactVis: partners.contactVis,
      pass: partners.urgVis === 0 && partners.contactVis === 0,
    },
    midBreath: {
      gap: mid.gapDemoToCta,
      urgVis: mid.urgVis,
      pass: mid.gapDemoToCta >= 36 && mid.urgVis === 0,
    },
    footerContrast: {
      value: footer.contrast,
      pass: footer.contrast >= 4.5,
    },
    dualSeam: {
      ledeCta: hero.ledeCta,
      ctaProc: hero.ctaProc,
      pass: hero.ledeCta >= 20 && hero.ctaProc >= 20,
    },
  };

  const result = {
    hero,
    measures,
    desire1280,
    desire1120,
    mid,
    urg,
    partners,
    footer,
    interestLand,
    accept,
  };
  fs.writeFileSync(path.join(out, "verify31.json"), JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ accept, desire1120Gaps: desire1120.gaps, desire1280Gaps: desire1280.gaps, lms: measures.lms, proofGrain: measures.proofGrain, interestPVis: { d1280: desire1280.interestPVis, w1120: desire1120.interestPVis }, mechToLms: desire1120.gaps.mechToLms }, null, 2));
  await browser.close();
  server.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
