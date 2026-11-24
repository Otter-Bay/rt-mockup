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
  // An abbreviation question shows the card about it, with its tables (Ken, Nov 22), not just the glossary
  ["SDS", "what does AHI stand for", "ahi", ["AHI"], []],
  ["SDS", "what does RERA stand for", "resp_adult", ["RERA"], []],
  ["SDS", "what does REM stand for", "staging", ["REM"], []],
  ["SDS", "what does ASV stand for", "papmodes", ["ASV"], []],
  ["SDS", "what does HSAT stand for", "hsat", ["HSAT"], []],
  ["RRT", "what does ABG stand for", "abg", ["ABG"], []],
  ["RRT", "what does GCS stand for", "gcs", ["GCS"], []],
  ["RRT", "what does RSBI stand for", "weaning", ["RSBI"], []],
  ["RRT", "what does ARDS stand for", "berlin", ["ARDS"], []],
  // Ordinary questions
  ["RRT", "glascow coma scale", "gcs", [], []],
  ["CNA", "normal pulse range", "vitals", [], []],
  ["SDS", "How is a hypopnea scored?", "hypopnea", [], ["IS"]],
  // Gas laws card (Ken, Nov 23: the kettle / syringe example)
  ["RRT", "what is boyles law", "gaslaws", [], []],
  ["RRT", "Charles's law", "gaslaws", [], []],
  ["SDS", "Dalton's law of partial pressures", "gaslaws", [], []],
  ["RRT", "What is the Bernoulli principle?", "gaslaws", [], []],
  ["RRT", "Graham's law", "gaslaws", [], []],
];
// A question about one row of a table still returns that card, names the row, and does not invent a row for a general abbreviation question (Ken, Nov 23)
const ROW_CHECKS = [
  ["SDS", "What is a severe AHI?", "ahi", "Severe"],
  ["RPSGT", "What is the duration for an arousal?", "arousal", "Duration"],
  ["SDS", "what does AHI stand for", "ahi", null],
  ["RRT", "What is Boyle's law?", "gaslaws", "Boyle"],
  ["RRT", "What is the Bernoulli principle?", "gaslaws", "Bernoulli"],
  ["RRT", "What is Graham's law?", "gaslaws", "Graham"],
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
for (const [exam, q, best, row] of ROW_CHECKS) {
  const r = (M[exam] = M[exam] || load(exam))(q);
  const text = ((r.hit && r.hit.cells) || []).join(" ");
  const errs = [];
  if (r.best !== best) errs.push(`best card ${r.best}, expected ${best}`);
  if (row && !text.includes(row)) errs.push(`expected row mentioning ${row}, got ${text || "no row"}`);
  if (!row && r.hit) errs.push(`should not highlight a row, got ${text}`);
  if (errs.length) bad++;
  console.log(`${errs.length ? "FAIL" : "ok  "} [${exam}] ${q} -> ${r.best} row:${text || "none"}${errs.length ? "  <- " + errs.join("; ") : ""}`);
}
// The See-the-question button stays easy to find in the apps and the vetting Ask window (Ken, Nov 23)
const TIP = "Tip: tap any word in the question to add it to your question";
const UI_FILES = [
  ["js/voice.js", [TIP, "obAskQCue", "askqview", "cue"]],
  ["css/voice.css", ["askqcue", "text-decoration-style: dotted", ".askqview.cue"]],
  ["tools/vetting/ask_ui.js", [TIP, "obAskQCue", "obaskqtip", "obaskqcue", "text-decoration-style:dotted"]],
];
let ui = 0;
for (const [file, needles] of UI_FILES) {
  const src = fs.readFileSync(path.join(ROOT, file), "utf8");
  const missing = needles.filter((n) => !src.includes(n));
  if (missing.length) { bad++; ui++; console.log(`FAIL [ui] ${file} missing: ${missing.join(", ")}`); }
  else console.log(`ok   [ui] ${file}`);
}


// Study sheets (js/recall.js): every card prints as a recall map and a traditional page, nothing overlaps, and the parts Ken asked for are there (Nov 23)
let st = 0;
const study = (name, ok, why) => { st++; if (!ok) bad++; console.log(`${ok ? "ok  " : "FAIL"} [study] ${name}${ok ? "" : "  <- " + why}`); };
function loadStudy(exam) {
  const ctx = vm.createContext({ console }); ctx.window = ctx; ctx.EXAM = exam;
  for (const f of ["js/scales.js", "js/sleep_scales.js", "js/cna_scales.js", "js/acronyms.js", "js/memory_ideas.js", "js/recall.js"])
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx, { filename: f });
  return ctx;
}
{
  const C = loadStudy("SDS"), SB = C.OB_STUDY;
  const keys = Object.keys(C.SCALES), broken = [], overlap = [], trad = [];
  for (const k of keys) {
    const svg = SB.recallSvg(SB.model(k, {}), {});
    if (!svg.startsWith("<svg")) { broken.push(k); continue; }
    const H = Number(svg.match(/viewBox="0 0 612 (\d+)/)[1]), bx = SB.last().boxes;
    const r = bx.map((b) => [b.x1, b.y1, b.x2, b.y2]);
    if (r.some((a, i) => a[0] < 0 || a[2] > 612 || a[1] < 0 || a[3] > H || r.some((b, j) => j > i && a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1]))) overlap.push(k);
    if (!/<table class="tsheettbl"/.test(SB.traditionalHtml(SB.model(k, {}), {}))) trad.push(k);
  }
  study(`all ${keys.length} cards make a recall map`, !broken.length, broken.join(", "));
  study("no fact spaces overlap or leave the page", !overlap.length, overlap.join(", "));
  study("all cards make a traditional sheet with the full table", !trad.length, trad.join(", "));
  const ahi = SB.model("ahi", { hit: { table: 0, row: 3 } });
  study("AHI rows colored normal, mild, moderate, severe", ahi.facts.map((f) => f.sev).join() === "normal,mild,moderate,severe", ahi.facts.map((f) => f.sev).join());
  const filled = SB.recallSvg(ahi, {}), practice = SB.recallSvg(ahi, { mode: "practice" });
  study("draw-your-own space and prompt on every fact", (filled.match(/class="rspace"/g) || []).length === 4 && filled.includes("Draw something that reminds you of this"), "missing spaces or prompt");
  study("the row asked about is starred", filled.includes("You asked about this"), "no star");
  study("Practice hides the answers", (filled.match(/>Severe<\/text>/g) || []).length === 2 && (practice.match(/>Severe<\/text>/g) || []).length === 1, "answers still showing");
  study("ideas are off unless asked for", !filled.includes('opacity=".55"') && SB.recallSvg(ahi, { ideas: true }).includes('opacity=".55"'), "ideas showing by default");
  const gl = SB.model("gaslaws", {}), ideaOf = (l) => (gl.facts.find((f) => f.label.startsWith(l)) || { idea: {} }).idea.shape;
  study("gas-law ideas: Boyle syringe, Charles kettle, Henry bottle, Laplace bubble, Bernoulli wing, Venturi hourglass, Graham runner",
    ideaOf("Boyle") === "syringe" && ideaOf("Charles") === "kettle" && ideaOf("Henry") === "bottle" && ideaOf("Laplace") === "bubble" && ideaOf("Bernoulli") === "wing" && ideaOf("Venturi") === "hourglass" && ideaOf("Graham") === "runner",
    ["Boyle", "Charles", "Henry", "Laplace", "Bernoulli", "Venturi", "Graham"].map(ideaOf).join());
  // Print fits one letter page; the layout picks the height and text size that print the biggest text. 10 rows plus picture ideas
  // is a lot for one page, so this guards against it getting smaller than it is today (about 4.5 pt detail text).
  const eff = (mm) => { SB.recallSvg(mm, { ideas: true }); const L = SB.last(); return L.s * Math.min(1, 792 / L.H); };
  const glEff = eff(gl), glSongEff = eff(SB.model("gaslaws", { mine: { song: { print: true } } }));
  study("10-row Gas laws card prints on one letter page with detail text of 4.4 pt or more (with or without the song)", gl.facts.length === 10 && glEff * 9.6 >= 4.4 && glSongEff * 9.6 >= 4.4, `${(glEff * 9.6).toFixed(1)} pt, with song ${(glSongEff * 9.6).toFixed(1)} pt`);
  // On screen nothing is shrunk: the page grows taller and scrolls (Ken, Nov 23: "we use a down arrow head on any screen that can scroll")
  const small = keys.filter((k) => { SB.recallSvg(SB.model(k, {}), { screen: true }); const L = SB.last(); return !(L.s >= 1 && L.Wd === 400); });
  study("on screen every card keeps full-size text (scrolls instead of shrinking)", !small.length, small.join(", "));
  const scrOver = keys.filter((k) => { SB.recallSvg(SB.model(k, {}), { screen: true }); const L = SB.last(), r = L.boxes.map((b) => [b.x1, b.y1, b.x2, b.y2]);
    return r.some((a, i) => a[0] < 0 || a[2] > 400 || a[3] > L.H || r.some((b, j) => j > i && a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1])); });
  study("on screen no fact spaces overlap or leave the page", !scrOver.length, scrOver.join(", "));
  const built = SB.recallSvg(ahi, { custom: { ink: [{ c: "#C62828", pts: [[100, 300], [140, 320]] }], stickers: { 3: { shape: "lungs", c: "#C62828" } }, moves: { 0: [10, -5] } } });
  study("a built page prints the learner's drawing and shapes", built.includes('class="rink"') && built.includes('stroke="#C62828" stroke-width="2.4"'), "drawing missing");
  // The builder and thumbnail tag the SVG by rewriting its class; if that rewrite stops matching, taps on the page do nothing (caught Nov 23)
  const scrSvg = SB.recallSvg(ahi, { screen: true }), tags = [...fs.readFileSync(path.join(ROOT, "js/recall.js"), "utf8").matchAll(/\.replace\('(class="recallsvg[^']*)'/g)].map((m) => m[1]);
  study("builder and thumbnail class tags match the drawn SVG", tags.length >= 2 && tags.every((t) => scrSvg.includes(t)), tags.join(" | "));
  // Picture ideas and the jingle: ours by default, the learner's own words win (Ken, Nov 23)
  const MI = C.MEMORY_IDEAS, done = Object.keys(MI);
  const sizeBad = done.filter((k) => { const mm = SB.model(k, {}); return MI[k].pictures.length !== mm.facts.length || MI[k].jingle.lines.length !== mm.facts.length || MI[k].pictures.some((t) => t.length < 40); });
  study(`picture ideas and jingle written for ${done.join(", ")}: one per row`, done.includes("gaslaws") && done.includes("apgar") && !sizeBad.length, sizeBad.join(", "));
  const offBeat = []; done.forEach((k) => { const mm = SB.model(k, {}); mm.song.lines.forEach((l) => { if (SB.beats(l.text) !== SB.TUNES[mm.song.tune].beats) offBeat.push(`${k}: "${l.text}" = ${SB.beats(l.text)}`); }); });
  study("every starter jingle line has the tune's 7 beats", !offBeat.length, offBeat.join("; "));
  study("tunes are public domain only", Object.values(SB.TUNES).every((t) => /^(Twinkle|Mary Had|London Bridge|Yankee Doodle|Row, Row)/.test(t.name)), Object.values(SB.TUNES).map((t) => t.name).join(", "));
  const glDef = SB.recallSvg(SB.model("gaslaws", {}), { screen: true });
  study("our picture idea shows under each fact by default", (glDef.match(/class="rpic"/g) || []).length >= 10 && glDef.includes("Picture idea:") && glDef.includes("syringe"), "no picture ideas");
  const own = { pics: { 0: "My grandpa's bike pump: push down hard and it gets tight" }, song: { tune: "mary", print: true, lines: { 0: "Boyle squeezed the balloon too tight" } } };
  const gm = SB.model("gaslaws", { mine: own }), gsvg = SB.recallSvg(gm, {}), gtr = SB.traditionalHtml(gm, {});
  study("the learner's own picture words replace ours on the sheet and the printout", gm.facts[0].picMine && gsvg.includes("My picture:") && gsvg.includes("bike pump") && gtr.includes("bike pump") && !gm.facts[1].picMine, "own words missing");
  study("the learner's song lines and tune print as a lyrics strip (map and traditional)", gsvg.includes("Boyle squeezed the balloon too tight") && gsvg.includes("Mary Had a Little Lamb") && gsvg.includes("Charles says heat it, volume grows") && gtr.includes("ts-song") && gtr.includes("Boyle squeezed the balloon too tight"), "lyrics strip missing");
  const reset = SB.model("gaslaws", { mine: { pics: { 0: "  " }, song: { lines: { 0: "Boyle says squeeze it, pressure's up" } } } });
  study("blank or unchanged words fall back to our suggestion", !reset.facts[0].picMine && reset.facts[0].pic === MI.gaslaws.pictures[0] && !reset.song.lines[0].mine, "reset");
  study("the song stays off the printout until the learner turns it on", !SB.recallSvg(SB.model("gaslaws", {}), {}).includes("starter jingle"), "song printed by default");
  const prac = SB.recallSvg(gm, { mode: "practice" });
  study("Practice prints the first words of each line as a cue", prac.includes("Boyle squeezed ______________") && !prac.includes("balloon too tight"), "practice lyrics");
  const bxOf = (mine) => { SB.recallSvg(SB.model("gaslaws", { mine }), { builder: true, screen: true, noSong: true }); return JSON.stringify(SB.last().boxes.map((b) => [b.x1, b.y1, b.x2, b.y2].map(Math.round))); };
  study("in the builder, typing a picture idea or turning the song on never moves the drawing spaces", bxOf({}) === bxOf({ pics: { 0: "pump", 3: "a very long description ".repeat(12) }, song: { print: true } }), "layout moved");
  const plain0 = SB.model("ahi", {});
  study("cards not written yet keep draw-your-own and blank song lines", plain0.facts.every((f) => !f.pic) && plain0.song.lines.every((l) => !l.text) && SB.recallSvg(plain0, {}).includes("Draw something that reminds you of this"), "fallback");
  study("Why this works lists 5 sources with links", SB.WHY.refs.length === 5 && SB.WHY.refs.every((r) => /^https:\/\/doi\.org\//.test(r[1])), "sources");
  const C2 = loadStudy("CNA"), vit = C2.OB_STUDY.model("vitals", {});
  study("CNA vitals: no false severity colors", vit.facts.every((f) => !f.sev), vit.facts.map((f) => f.sev).join());
}
const PAGES_HTML = ["index.html", "sds/index.html", "rpsgt/index.html", "cna/index.html"];
const missingRecall = PAGES_HTML.filter((p) => !fs.readFileSync(path.join(ROOT, p), "utf8").includes("js/recall.js"));
const missingIdeas = PAGES_HTML.filter((f) => { const h = fs.readFileSync(path.join(ROOT, f), "utf8"); const a = h.indexOf("js/memory_ideas.js"), b = h.indexOf("js/recall.js"); return a < 0 || a > b; });
study("all four apps load the picture ideas and jingles before the study sheet", !missingIdeas.length, missingIdeas.join(", "));
study("all four apps load the study sheet", !missingRecall.length, missingRecall.join(", "));
const vsrc = fs.readFileSync(path.join(ROOT, "js/voice.js"), "utf8");
study("Ask offers Print study sheet and brings back Your study page", vsrc.includes("Print study sheet") && vsrc.includes("Your study page") && vsrc.includes("My study pages"), "button text missing");

// ---------- Memory Arcade (study bin) and games (js/bin.js) ----------
{
  const exams = ["RRT", "SDS", "RPSGT", "CNA"].map((e) => { const C = loadStudy(e); vm.runInContext(fs.readFileSync(path.join(ROOT, "js/bin.js"), "utf8"), C, { filename: "js/bin.js" }); return C; });
  const C = exams[0], BN = C.OB_BIN, card = (k) => JSON.stringify(C.SCALES[k]) + JSON.stringify(C.SCALES.oxy || "");
  study("the bin's three example cards load in all four apps", exams.every((X) => ["apgar", "gaslaws", "abg"].every((k) => X.OB_BIN.data(k))), "an example card is missing in one app");
  study("eleven games, each with a name", BN.GAMES.length === 11 && BN.GAMES.every((g) => g[1] && g[2]), BN.GAMES.length);
  study("oxygenation indices share the blood gas example; other cards have no games yet", BN.exKey("oxy") === "abg" && BN.exKey("ess") === null && BN.data("ess") === null, "exKey");
  const D = { apgar: BN.data("apgar"), gaslaws: BN.data("gaslaws"), abg: BN.data("abg") };
  const plainOf = (k) => C.OB_STUDY.plain(card(k));
  const offCard = []; for (const k in D) for (const p of D[k].pairs) if (!plainOf(k).includes(p.b)) offCard.push(k + ": " + p.b);
  study("every game answer is copied from its card", !offCard.length, offCard.slice(0, 3).join(" | "));
  const ap = D.apgar.table;
  study("Build the Table: Apgar is a 5 × 3 grid with its row and column names", ap.rowHeads.length === 5 && ap.colHeads.map((c) => c.t).join() === "0,1,2" && ap.cells.every((r) => r.length === 3), JSON.stringify(ap.colHeads));
  study("Apgar answer blocks each have a picture and a score color", ap.cellIcons.length === 5 && ap.cellIcons.every((r) => r.length === 3 && r.every(Boolean)) && new Set(ap.cellIcons.flat()).size === 15 && ap.cellTone.every((r) => r.join() === "0,1,2"), "cell pictures");
  study("every answer on all three cards has a picture and a color", Object.values(D).every((d) => d.pairs.every((p) => p.bicon && p.tone != null) && d.table.cells.every((r, i) => r.every((_, j) => d.table.cellIcons[i][j]))), "pair or cell without a picture");
  study("answers stay up until Next (no auto-advance), and number games offer a calculator", !/after\(\(\) =>/.test(fs.readFileSync(path.join(ROOT, "js/bin.js"), "utf8")) && /bgnext:/.test(fs.readFileSync(path.join(ROOT, "js/bin.js"), "utf8")) && /calcBox\(\)/.test(fs.readFileSync(path.join(ROOT, "js/bin.js"), "utf8")), "auto-advance left");
  {
    // Build the Table row order flag: AHI rows must be in order; Apgar and sleep stages take any order, and cells follow the placed label
    const X = loadStudy("SDS"); vm.runInContext(fs.readFileSync(path.join(ROOT, "js/bin.js"), "utf8"), X, { filename: "js/bin.js" });
    const XB = X.OB_BIN, ah = XB.data("ahi"), stg = XB.data("staging");
    study("sleep examples: AHI is ordered, sleep stages and Apgar are not", XB.EX.ahi.order === true && !XB.EX.staging.order && !XB.EX.apgar.order && XB.EX.apgar.tip.includes("A-P-G-A-R"), "order flags");
    study("AHI table runs Normal, Mild, Moderate, Severe with the card's ranges", ah.table.rowHeads.map((r) => r.t).join() === "Normal,Mild,Moderate,Severe" && ah.table.cells.map((c) => c[0]).join("|") === "Below 5|5 to 14|15 to 29|30 or more", JSON.stringify(ah.table.cells));
    const stPlain = X.OB_STUDY.plain(JSON.stringify(X.SCALES.staging));
    study("sleep stage hallmarks are cut from the staging card", stg.pairs.length === 5 && stg.pairs.every((p) => stPlain.includes(p.b)), stg.pairs.map((p) => p.b).find((b) => !stPlain.includes(b)));
    let ahOk = true; for (let i = 0; i < 200; i++) { const v = ah.sort.gen(), n = +v.t.match(/\d+/)[0], c = n < 5 ? 0 : n < 15 ? 1 : n < 30 ? 2 : 3; if (c !== v.col) ahOk = false; }
    study("Speed Sort: made-up AHI values land in the right severity", ahOk, "AHI sort");
    const bsrc2 = fs.readFileSync(path.join(ROOT, "js/bin.js"), "utf8");
    study("Build the Table checks a cell against the label placed in its row, and row order only when the card says so", bsrc2.includes("const ordered = !!g.D.E.order") && bsrc2.includes("T.cells[src]"), "order logic");
  }
  {
    const X = loadStudy("SDS"); vm.runInContext(fs.readFileSync(path.join(ROOT, "js/bin.js"), "utf8"), X, { filename: "js/bin.js" });
    const bad = Object.keys(X.OB_BIN.EX).filter((k) => { const d = X.OB_BIN.data(k), E = X.OB_BIN.EX[k]; if (E.games && !E.games.includes("attack")) return true;
      for (let i = 0; i < 30; i++) { const it = d.sort.gen ? d.sort.gen() : d.sort.items[i % d.sort.items.length]; if (!(it.col >= 0 && it.col < d.sort.cols.length) || !it.t) return true; } return false; });
    study("Fact Attack (replaced Block Drop): every study bin card has launchers and falling facts that each belong to one, and blocks fall gray", !X.OB_BIN.GAMES.some((g) => g[0] === "drop") && X.OB_BIN.GAMES.some((g) => g[0] === "attack") && /\.gab \{[^}]*#ECEFF1/.test(fs.readFileSync(path.join(ROOT, "css/voice.css"), "utf8")) && !/class="gab\$\{[^"]*tone/.test(fs.readFileSync(path.join(ROOT, "js/bin.js"), "utf8")) && !bad.length, bad.join(", "));
  }
  let babyOk = true, babyWhy = "";
  for (let i = 0; i < 200; i++) { const s = BN.scenario("apgar"), parts = s.why.match(/(\d) \+ .* = (\d+)/), nums = s.why.split("=")[0].match(/\d/g).map(Number), tot = +s.a;
    const band = tot >= 7 ? "reassuring" : tot >= 4 ? "moderately abnormal" : "low";
    if (!parts || nums.length !== 5 || nums.reduce((a, b) => a + b, 0) !== tot || !s.why.includes(band) || !s.o.includes(s.a)) { babyOk = false; babyWhy = s.why; break; }
    const hr = s.lines[1].match(/(\d+)\/min/); if (hr && ((nums[1] === 1) !== (+hr[1] < 100))) { babyOk = false; babyWhy = s.lines[1] + " scored " + nums[1]; break; } }
  study("Score the Baby: the total is the sum of the 5 signs, the heart rate matches its score, and the band follows the card", babyOk, babyWhy);
  let calcOk = true, calcWhy = "";
  for (let i = 0; i < 300; i++) { const s = BN.scenario("abg"), L = s.lines[0], o = new Set(s.o);
    if (o.size !== s.o.length || !s.o.includes(s.a)) { calcOk = false; calcWhy = "options " + s.o; break; }
    let m;
    if ((m = L.match(/PaCO2 (\d+) mm Hg · PaO2 (\d+)/))) { const want = Math.round(0.21 * (760 - 47) - m[1] / 0.8) - m[2]; if (s.a !== want + " mm Hg") { calcOk = false; calcWhy = L + " → " + s.a; break; } }
    else if ((m = L.match(/PaO2 (\d+) mm Hg on FIO2 ([\d.]+)/))) { if (s.a !== String(Math.round(m[1] / m[2]))) { calcOk = false; calcWhy = L + " → " + s.a; break; } }
    else if ((m = L.match(/HCO3- (\d+)/))) { const e = 1.5 * m[1] + 8; if (s.a !== `${e - 2} to ${e + 2} mm Hg`) { calcOk = false; calcWhy = L + " → " + s.a; break; } }
    else { calcOk = false; calcWhy = "unknown case " + L; break; } }
  study("Calculate it: A–a gradient, P/F ratio and Winter's formula answers are right, with no repeated choices", calcOk, calcWhy);
  let sortOk = true, sortWhy = "";
  for (let i = 0; i < 300; i++) { const v = D.abg.value(i % 3), R = D.abg.ranges.find((r) => r.name === v.name); if (!R) continue;
    const got = v.v < R.lo ? 0 : v.v > R.hi ? 2 : 1; if (got !== v.col) { sortOk = false; sortWhy = v.t + " in column " + v.col; break; } }
  study("Speed Sort: made-up blood gas values land in the right column (too low, normal, too high)", sortOk, sortWhy);
  let oddOk = true;
  for (const k in D) for (let i = 0; i < 50; i++) { const r = D[k].oddRound(); if (r.tiles.length !== 4 || r.tiles.filter((t) => t.odd).length !== 1 || new Set(r.tiles.map((t) => t.t)).size !== 4) oddOk = false; }
  study("Odd One Out: four different tiles with exactly one odd one", oddOk, "bad round");
  let mcOk = true, mcWhy = "";
  for (const k in D) for (let i = 0; i < 20; i++) for (const q of D[k].qs()) if (!q.o.includes(q.a) || new Set(q.o).size !== q.o.length || q.o.length < 2) { mcOk = false; mcWhy = k + ": " + q.p; }
  for (const k of ["apgar", "gaslaws"]) for (let i = 0; i < 50; i++) { const s = BN.scenario(k); if (!s.o.includes(s.a) || new Set(s.o).size !== s.o.length) { mcOk = false; mcWhy = k + " scenario"; } }
  study("every multiple-choice question has its answer among different choices", mcOk, mcWhy);
  let cwOk = true, cwWhy = "";
  for (const k in D) for (let i = 0; i < 20; i++) { const cw = BN.crossword(D[k].E.words), grid = {};
    if (!cw || cw.words.length < 7) { cwOk = false; cwWhy = k + " placed " + (cw && cw.words.length); break; }
    for (const w of cw.words) for (let j = 0; j < w.w.length; j++) { const x = w.x + (w.dir === "a" ? j : 0), y = w.y + (w.dir === "a" ? 0 : j), key = x + "," + y;
      if (x < 0 || y < 0 || x >= cw.w || y >= cw.h || (grid[key] && grid[key] !== w.w[j])) { cwOk = false; cwWhy = k + ": " + w.w; } grid[key] = w.w[j]; } }
  study("Crossword: at least 7 words placed, crossing letters agree, all inside the grid", cwOk, cwWhy);
  const clueOff = [];
  for (const k in D) for (const [w] of D[k].E.words) { const t = plainOf(k).toUpperCase().replace(/[^A-Z]/g, ""), alt = { TEN: "10", FIVE: "5MINUTE", SIXTEEN: "16", SEVEN: "735", HUNDRED: "100MM", FORTYSEVEN: "47", ANIONGAP: "ANIONGAP" }[w];
    if (!t.includes(w) && !(alt && plainOf(k).toUpperCase().replace(/[^A-Z0-9]/g, "").includes(alt))) clueOff.push(w); }
  study("every crossword answer is on its card", !clueOff.length, clueOff.join(", "));
  const missingBin = PAGES_HTML.filter((f) => { const h = fs.readFileSync(path.join(ROOT, f), "utf8"); return !(h.indexOf("js/bin.js") > h.indexOf("js/voice.js")); });
  study("all four apps load the study bin after Ask", !missingBin.length, missingBin.join(", "));
  const hsrc = fs.readFileSync(path.join(ROOT, "js/home.js"), "utf8");
  study("Add to Arcade flag on Ask answers, Memory Arcade on home", vsrc.includes("OB_BIN.flag(k)") && hsrc.includes("OB_BIN.way()") && vsrc.includes("window.OB_THEME = themeVars"), "hook missing");
  const bsrc = fs.readFileSync(path.join(ROOT, "js/bin.js"), "utf8");
  study("arcade otter: calm header with an h1 and a small otter on the Memory Arcade screen, small otter on the button, both image files present and the small one under 60 KB", bsrc.includes('class="archead"') && !bsrc.includes('class="archero"') && bsrc.includes('<h1 class="arch1">Play to Learn</h1>') && bsrc.split("otter-arcade-icon.jpg").length === 3 && fs.existsSync(path.join(ROOT, "images/brand/otter-arcade.jpg")) && fs.statSync(path.join(ROOT, "images/brand/otter-arcade-256.jpg")).size < 60000, "otter images");
  study("perfect score party: fires on a win with no misses, bubble says Yes, perfect score!!!, moonwalk still, confetti, streamers (some in front, none over the face), no balloons, reduced-motion still version, both otter cut-outs present", bsrc.includes("if (win && G.right > 0 && G.wrong === 0) celebrate();") && bsrc.includes('"Yes, perfect score!!!"') && bsrc.includes("otter-moonwalk.webp") && bsrc.includes('class="pstream"') && bsrc.includes("pstream-front") && !bsrc.includes('class="pball"') && !bsrc.includes("function balloons") && bsrc.includes('class="pconf"') && bsrc.includes("prefers-reduced-motion") && fs.existsSync(path.join(ROOT, "images/brand/otter-yes.webp")) && fs.existsSync(path.join(ROOT, "images/brand/otter-moonwalk.webp")), "party");
  study("renamed Memory Arcade: no \"study bin\" or \"Study this\" left in what the learner sees", !/study bin|Study this/i.test(bsrc.split("\n").filter((l) => !/^\s*(\/\/|\/\*|\*)/.test(l)).join("\n")) && bsrc.includes(">Memory Arcade<") && bsrc.includes("Play to Learn") && bsrc.includes("Add to Arcade") && bsrc.includes("obBin:"), "old name in the UI");
  study("practice questions get the flag through scaleButtons, after the answer", /W\.scaleButtons = function \(q, c\)/.test(bsrc) && bsrc.includes("if (!c || !c.done) return h"), "wrap missing");
}

const total = CHECKS.length + ROW_CHECKS.length + UI_FILES.length + st;
console.log(bad ? `\n${bad} of ${total} checks failed` : `\nAll ${total} checks passed`);
process.exit(bad ? 1 : 0);
