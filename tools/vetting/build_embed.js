/* Builds the Ask bundle that goes inside the private question-vetting pages (Claude artifacts).
   Usage: node tools/vetting/build_embed.js OUT.js
   The bundle: the whole current info-card library (scales.js, sleep_scales.js, cna_scales.js, acronyms.js, card_meta.js),
   Ask's matching code from js/voice.js (spelling fixes, abbreviations, scoring), tools/vetting/ask_ui.js and tools/vetting/nav_ui.js (Go to question).
   The library is added to the page's existing window.SCALES, so newer card versions replace older copies in the page.
   Re-run and re-embed whenever the library changes. */
const fs = require("fs"), vm = require("vm"), path = require("path");
const ROOT = path.join(__dirname, "..", "..");
const win = {};
const ctx = vm.createContext({ window: win, console });
for (const f of ["js/scales.js", "js/sleep_scales.js", "js/cna_scales.js", "js/acronyms.js", "js/card_meta.js"])
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx, { filename: f });

const voice = fs.readFileSync(path.join(ROOT, "js/voice.js"), "utf8").split("\n");
const start = voice.findIndex((l) => l.startsWith("(function () {"));
const end = voice.findIndex((l) => l.includes("window.OB_ASK_MATCH ="));
if (start < 0 || end < 0) throw new Error("voice.js layout changed: can't find the matching section");
const matcher = voice.slice(start, end + 1).join("\n") + "\n})();";

const J = (o) => JSON.stringify(o).replace(/<\//g, "<\\/");
const out = `/* Ask in the vetting pages. Generated ${new Date().toISOString().slice(0, 10)} by rt-mockup tools/vetting/build_embed.js; do not edit here. */
window.EXAM = window.EXAM || ({ SDS: "SDS", RPSGT: "RPSGT", CNA: "CNA" }[window.APP_LABEL] || "RRT");
Object.assign(window.SCALES = window.SCALES || {}, ${J(win.SCALES)});
window.CARD_META = ${J(win.CARD_META)};
window.ACRONYMS = { norm: (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, ""), map: ${J(win.ACRONYMS.map)} };
${matcher}
${fs.readFileSync(path.join(__dirname, "ask_ui.js"), "utf8")}
${fs.readFileSync(path.join(__dirname, "nav_ui.js"), "utf8")}`;
fs.writeFileSync(process.argv[2], out.replace(/<\/script/gi, "<\\/script"));
console.log("cards:", Object.keys(win.SCALES).length, "abbreviations:", Object.keys(win.ACRONYMS.map).length, "bytes:", out.length);
