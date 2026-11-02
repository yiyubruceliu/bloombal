const fs = require("fs");
const path = require("path");
const file = path.join(__dirname, "_verify32.js");
let s = fs.readFileSync(file, "utf8");
const nl = s.includes("\r\n") ? "\r\n" : "\n";

const oldM = [
  "    return {",
  '      interest: window.__glyph(document.querySelector(".look--copy p")),',
  '      urgBody: window.__glyph(document.querySelector("#urgency p")),',
  '      mech: window.__glyph(document.querySelector(".mechanism")),',
  '      lms: window.__glyph(document.querySelector(".mechanism-lms")),',
  '      storyGrain: before(".look--story"),',
  '      copyGrain: before(".look--copy"),',
  '      proofGrain: before(".look--proof"),',
  '      proofInnerZ: getComputedStyle(document.querySelector(".look--proof .look-inner")).zIndex,',
  '      proofBg: getComputedStyle(document.querySelector(".look--proof")).backgroundColor,',
  "    };",
].join(nl);

const newM = [
  "    return {",
  '      interest: window.__glyph(document.querySelector(".look--copy p")),',
  '      urgBody: window.__glyph(document.querySelector("#urgency p")),',
  '      mech: window.__glyph(document.querySelector(".mechanism")),',
  '      lms: window.__glyph(document.querySelector(".mechanism-lms")),',
  '      storyGrain: before(".look--story"),',
  '      copyGrain: before(".look--copy"),',
  '      proofGrain: before(".look--proof"),',
  '      solutionGrain: before(".look--solution"),',
  '      solutionPos: getComputedStyle(document.querySelector(".look--solution")).position,',
  '      proofInnerZ: getComputedStyle(document.querySelector(".look--proof .look-inner")).zIndex,',
  '      proofBg: getComputedStyle(document.querySelector(".look--proof")).backgroundColor,',
  "    };",
].join(nl);

if (!s.includes(oldM)) {
  console.error("OLD MEASURES NOT FOUND");
  process.exit(1);
}
s = s.replace(oldM, newM);

const marker = "  const accept = {" + nl + "    lmsGlyph:";
if (!s.includes(marker)) {
  console.error("accept marker missing");
  process.exit(1);
}

const inject = [
  "  const accept = {",
  "    iter32_lmsToDemoBand1280: {",
  "      value: desire1280.gaps.lmsToDemo,",
  "      pass: desire1280.gaps.lmsToDemo >= 40 && desire1280.gaps.lmsToDemo <= 48,",
  '      target: "40-48",',
  "    },",
  "    iter32_demoVis1280: {",
  "      value: desire1280.demoVis,",
  "      pass: desire1280.demoVis >= 115,",
  '      target: ">=115 prefer>=120",',
  "    },",
  "    iter32_mechToLms1120: {",
  "      titleToMech: desire1120.gaps.titleToMech,",
  "      mechToLms: desire1120.gaps.mechToLms,",
  "      pass: desire1120.gaps.mechToLms >= 36 && Math.abs(desire1120.gaps.mechToLms - desire1120.gaps.titleToMech) <= 4,",
  '      target: "~titleToMech (~39, >=36)",',
  "    },",
  "    iter32_mechToLms1280: {",
  "      titleToMech: desire1280.gaps.titleToMech,",
  "      mechToLms: desire1280.gaps.mechToLms,",
  "      pass: desire1280.gaps.mechToLms >= 36 && Math.abs(desire1280.gaps.mechToLms - desire1280.gaps.titleToMech) <= 4,",
  '      target: "~titleToMech (~39, >=36)",',
  "    },",
  "    iter32_solutionGrain: {",
  "      value: measures.solutionGrain,",
  "      pass:",
  '        measures.solutionGrain?.content === \'""\' &&',
  "        parseFloat(measures.solutionGrain?.opacity) >= 0.22 &&",
  "        parseFloat(measures.solutionGrain?.opacity) <= 0.28,",
  '      target: "0.22-0.28",',
  "    },",
  "    lmsGlyph:",
].join(nl);

s = s.replace(marker, inject);

const oldLog =
  "console.log(JSON.stringify({ accept, desire1120Gaps: desire1120.gaps, desire1280Gaps: desire1280.gaps, lms: measures.lms, proofGrain: measures.proofGrain, interestPVis: { d1280: desire1280.interestPVis, w1120: desire1120.interestPVis }, mechToLms: desire1120.gaps.mechToLms }, null, 2));";
const newLog =
  "console.log(JSON.stringify({ accept, desire1120Gaps: desire1120.gaps, desire1280Gaps: desire1280.gaps, desire1280Vis: { demoVis: desire1280.demoVis, videoVis: desire1280.videoVis, lmsMb: desire1280.lmsMb, lmsMt: desire1280.lmsMt }, lms: measures.lms, solutionGrain: measures.solutionGrain, proofGrain: measures.proofGrain, interestPVis: { d1280: desire1280.interestPVis, w1120: desire1120.interestPVis } }, null, 2));";
if (!s.includes(oldLog)) {
  console.error("log marker missing");
  process.exit(1);
}
s = s.replace(oldLog, newLog);

fs.writeFileSync(file, s);
console.log("ok", {
  solutionGrain: s.includes("solutionGrain: before"),
  iter32: s.includes("iter32_solutionGrain"),
  videoVis: s.includes("videoVis:"),
});
