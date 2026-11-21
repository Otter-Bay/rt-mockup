/* Ask regression tests: questions people really asked, and what Ask must (or must not) answer.
   Run: node tools/test_ask.js   (exits with an error if any check fails). Add a line whenever Ask gets one wrong.
   Each check: [app, question, expected best card or null, abbreviations that must appear, abbreviations that must NOT appear] */
const fs = require("fs"), vm = require("vm"), path = require("path");
const ROOT = path.join(__dirname, "..");
const CHECKS = [
  // Grammar words are not abbreviations (Ken, Nov 20: "what is hyponia" answered with IS = incentive spirometry)
  ["RRT", "what is hyponia", "hypopnea", [], ["IS"]],
  ["RRT", "what IS hyponia", "hypopnea", [], ["IS"]],
  ["RRT", "what is hyponia mean", "hypopnea", [], ["IS"]],
  ["RRT", "What is the meaning of hyponia", "hypopnea", [], ["IS"]],
  ["SDS", "what is an abbreviation for hypopnea", null, [], ["IS"]],
  ["RRT", "what would be a normal base excess", null, [], ["BE"]],
  ["SDS", "hi what is a hypopnea", "hypopnea", [], ["HI"]],
  // ...but they still work when they are what's being asked about
  ["RRT", "what does IS stand for", null, ["IS"], []],
  ["RRT", "what does is stand for", null, ["IS"], []],
  ["RRT", "IS?", null, ["IS"], []],
  ["RRT", "what does BE mean", null, ["BE"], []],
  ["SDS", "what does HI stand for", null, ["HI"], []],
  // Abbreviations that worked before
  ["RRT", "what does RSBI stand for", null, ["RSBI"], []],
  ["RRT", "what does r s b i stand for", null, ["RSBI"], []],
  ["SDS", "what does WASO stand for", null, ["WASO"], []],
  ["RPSGT", "what does SOREMP mean", null, ["SOREMP"], []],
  ["RPSGT", "WASO", null, ["WASO"], []],
  // Ordinary questions
  ["RRT", "glascow coma scale", "gcs", [], []],
  ["CNA", "normal pulse range", "vitals", [], []],
  ["SDS", "How is a hypopnea scored?", "hypopnea", [], ["IS"]],
];

function load(exam) {
  const ctx = vm.createContext({ console }); ctx.window = ctx; ctx.EXAM = exam;
  ctx.localStorage = { getItem: () => null, setItem() {} };
  for (const f of ["js/scales.js", "js/sleep_scales.js", "js/cna_scales.js", "js/acronyms.js", "js/card_meta.js"])
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx, { filename: f });
  const v = fs.readFileSync(path.join(ROOT, "js/voice.js"), "utf8").split("\n");
  const a = v.findIndex((l) => l.startsWith("(function () {")), b = v.findIndex((l) => l.includes("window.OB_ASK_MATCH ="));
  vm.runInContext(v.slice(a, b + 1).join("\n") + "\n})();", ctx, { filename: "voice.js (matching)" });
  return ctx.OB_ASK_MATCH;
}
const M = {};
let bad = 0;
for (const [exam, q, best, must, mustNot] of CHECKS) {
  const r = (M[exam] = M[exam] || load(exam))(q);
  const ab = (r.abbr || []).map((h) => h.abbr);
  const errs = [];
  if (best !== null && r.best !== best) errs.push(`best card ${r.best}, expected ${best}`);
  must.forEach((x) => { if (!ab.includes(x)) errs.push(`missing ${x}`); });
  mustNot.forEach((x) => { if (ab.includes(x)) errs.push(`wrongly read "${x}" as an abbreviation`); });
  if (errs.length) bad++;
  console.log(`${errs.length ? "FAIL" : "ok  "} [${exam}] ${q} -> ${r.best}${ab.length ? " (" + ab.join(", ") + ")" : ""}${errs.length ? "  <- " + errs.join("; ") : ""}`);
}
console.log(bad ? `\n${bad} of ${CHECKS.length} checks failed` : `\nAll ${CHECKS.length} checks passed`);
process.exit(bad ? 1 : 0);
