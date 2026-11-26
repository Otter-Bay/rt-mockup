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
  for (const f of ["js/scales.js", "js/sleep_scales.js", "js/cna_scales.js", "js/acronyms.js", "js/card_meta.js", "js/scale_outline.js"])
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
  for (const f of ["js/scales.js", "js/sleep_scales.js", "js/cna_scales.js", "js/acronyms.js", "js/scale_outline.js", "js/memory_ideas.js", "js/stickers.js", "js/recall.js"])
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
  // Ken, Nov 25: no line art; every fact gets a related full-color sticker pulled from its words
  study("no line art: every fact shows a pulled full-color sticker", (filled.match(/class="rauto"/g) || []).length === ahi.facts.length && !/<path[^>]*stroke-width="1\.6"/.test(filled), (filled.match(/class="rauto"/g) || []).length + " of " + ahi.facts.length);
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
  study("a built page prints the learner's drawing and shapes", built.includes('class="rink"') && /class="rsticker"[^>]*lungs\.webp/.test(built), "drawing missing");
  // Stickers (Ken, Nov 25): full-color artwork is never recolored; an old saved line drawing keeps working, in one ink, not the old tint
  const oldShape = SB.recallSvg(ahi, { custom: { stickers: { 3: { shape: "kettle", c: "#C62828" } } } });
  study("stickers keep their own colors; an old line-drawing page shows the matching sticker", !/rsticker[^>]*(fill|stroke)=/.test(built) && /class="rsticker"[^>]*teapot\.webp/.test(oldShape), "old page not mapped");
  // related and unique (Ken, Nov 25): a sticker that fits the words, and never the same pulled sticker on two maps
  // the number to remember sits inside its picture, as just the number (Ken, Nov 26)
  const kvs = ["Tachycardia at >160", "RR > 20/min", "SpO2 < 90%", "Alpha 8–13 Hz", "pH 7.35–7.45", "Retractions"].map(SB.keyValue);
  study("a card's number goes inside its picture, just the number", kvs.join("|") === "> 160|> 20/min|< 90%|8–13 Hz|7.35–7.45|", kvs.join("|"));
  const sug = (t) => SB.suggestStickers(t, 3);
  study("pulled stickers are related to the words", sug("Blue lips, cyanosis")[0] === "cold-face" && sug("K-complex or sleep spindle").some((x) => /k-complex|sleep-spindle/.test(x)) && sug("Inhaled corticosteroid (for example fluticasone)")[0] === "pill" && sug("Heart rate and ECG")[0] === "anatomical-heart", [sug("Blue lips, cyanosis"), sug("K-complex or sleep spindle"), sug("Inhaled corticosteroid (for example fluticasone)"), sug("Heart rate and ECG")].join(" / "));
  SB.resetPicks();
  const pullA = SB.recallSvg(SB.model("abg", {}), { screen: true }), pullB = SB.recallSvg(SB.model("oxy", {}), { screen: true }), pullA2 = SB.recallSvg(SB.model("abg", {}), { screen: true });
  const ids = (svg) => [...svg.matchAll(/class="rauto"[^>]*><image class="rsticker"[^>]*href="images\/stickers\/([^".]+)\.webp"/g)].map((x) => x[1]);
  const a1 = ids(pullA), b1 = ids(pullB), a2 = ids(pullA2);
  study("pulled stickers differ within a map and between maps, and stay put when a map is drawn again", a1.length > 3 && new Set(a1).size === a1.length && !a1.some((x) => b1.includes(x)) && a1.join() === a2.join(), JSON.stringify({ a1, b1, a2 }));
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
  // Image maker and printable recall notes (Ken, t191u–t222u)
  study("size is clamped to 25–100%", SB.clampScale(0.1) === 0.25 && SB.clampScale(2) === 1 && SB.clampScale(0.7) === 0.7, String(SB.clampScale(0.1)));
  const photo = { shape: "photo", src: "data:image/png;base64,AAAA", w: 200, h: 100, scale: 0.5 };
  SB.recallSvg(ahi, { custom: { stickers: { 0: photo } }, screen: true, builder: true });
  const box0 = SB.last().boxes[0], pb = SB.photoBox(box0, photo);
  study("a pasted photo stays inside its fact space at the chosen size", pb.w <= (box0.x2 - box0.x1) + 0.01 && pb.h <= (box0.y2 - box0.y1) + 0.01 && Math.abs(pb.w - 0.5 * (box0.x2 - box0.x1)) < 0.6, JSON.stringify(pb));
  const capSvg = SB.recallSvg(ahi, { custom: { stickers: { 0: Object.assign({}, photo, { cap: "Normal AHI" }) } }, screen: true, builder: true });
  study("plain text sits in a caption box on the photo, not as a stamp over the card", capSvg.includes('class="rcap"') && capSvg.includes("Normal AHI") && capSvg.includes('class="rphoto"') && !/rfact[\s\S]*Normal AHI[\s\S]*rphoto/.test(capSvg), "caption missing");
  const listSt = { shape: "photo", src: "data:image/png;base64,AAAA", w: 200, h: 200, scale: 0.7, cap: "Normal under 5\nMild 5 to 15\nModerate 15 to 30\nSevere 30 or more" };
  const listSvg = SB.recallSvg(ahi, { custom: { stickers: { 0: listSt } }, screen: true, builder: true });
  const listBox = SB.last().boxes[0], listPh = SB.composePhoto(listBox, listSt, "list");
  const items = SB.capItems(listSt, ahi.facts[0], listBox);
  const L = SB.calloutLayout(listBox, listPh, listSt, items, false);
  study("a bullet list becomes index-card recall notes: facts live in the cards, not on the lines", items.items.length >= 2 && listSvg.includes('class="rcallout"') && listSvg.includes('class="rcard"') && listSvg.includes('class="rcardhead"') && listSvg.includes('class="rkw"') && listSvg.includes('class="rpin"') && listSvg.includes('class="rrule"') && listSvg.includes('class="rhub') && !listSvg.includes('class="rcapbg"') && listPh.w < (listBox.x2 - listBox.x1) - 40, "list=" + items.items.length);
  study("the center is a squircle (extra-rounded square) with the title inside", listSvg.includes('class="rhub') && listSvg.includes('class="rhubtitle"') && L.hub && L.hub.rx / L.hub.w > 0.18 && L.hub.rx / L.hub.w < 0.28, L.hub ? "rx=" + L.hub.rx + " side=" + L.hub.w : "no hub");
  study("index cards have sharp corners (rx about 6) to contrast with the squircle", listSvg.includes('rx="6"') || /class="rcardbg"[^>]*rx="6"/.test(listSvg), "card rx missing");
  study("connector tabs sit just inside both ends, pill-shaped on the hub", listSvg.includes('rtab-hub') && listSvg.includes('rclip') && /rtab rtab-hub"/.test(listSvg), "tabs missing");
  study("on a narrow screen the topic sits above stacked cards", L.stacked === true, "expected stacked on a phone-width fact space");
  const landSvg = SB.recallSvg(ahi, { custom: { stickers: { 0: listSt } }, landscape: true, print: true, builder: true });
  const landL = SB.calloutLayout(SB.last().boxes[0], listPh, listSt, items, true);
  study("print uses a wide landscape layout, not the stacked phone fallback", landSvg.includes('viewBox="0 0 1008') && landL.stacked === false, "print layout " + (SB.last().Wd || "?") + " stacked=" + landL.stacked);
  study("print-scale tabs are about 4×8, pill-ended, about twice the line weight", /class="rtab rtab-hub"[^>]*width="4"[^>]*height="8"[^>]*rx="2"/.test(landSvg) && /class="rtab rclip"[^>]*width="4"[^>]*height="8"/.test(landSvg) && landSvg.includes('stroke-width="2.3"'), "print tabs not 4x8");
  study("keywords stay short (Wood: keywords, not sentences)", SB.keywords("The mild range of the AHI is 5 to 15 events per hour of sleep", 7).split(" ").length <= 7, SB.keywords("The mild range of the AHI is 5 to 15 events per hour of sleep", 7));
  const nest = SB.capItems({ cap: "Airway\n  Tongue\n  Soft palate\nBreathing" }, {}, { label: ["OSA"], lines: [] });
  study("nested bullets become sub-branches off the parent line", nest.items.length === 2 && nest.items[0].kids.length === 2 && nest.items[0].kids[0].text === "Tongue", JSON.stringify(nest.items));
  const withThumb = Object.assign({}, listSt, { thumbs: { 0: { shape: "photo", src: "data:image/png;base64,BBBB", w: 40, h: 40, scale: 1 } } });
  const thSvg = SB.recallSvg(ahi, { custom: { stickers: { 0: withThumb } }, screen: true, builder: true });
  study("each card can show a fact picture without replacing the topic photo; cards without one get a pulled sticker", thSvg.includes('class="rthumb"') && thSvg.includes('class="rphoto"') && /class="rthumb"[^>]*><image class="rsticker"/.test(thSvg), "thumb or topic photo missing");
  const tb = SB.thumbBox({ w: 200, h: 200, scale: 3 }), tbMin = SB.thumbBox({ scale: 0.2 });
  study("legacy branch thumbnails stay small (16–48 px)", tb.w <= 48 && tb.h <= 48 && tbMin.w >= 16, JSON.stringify({ tb, tbMin }));
  const longCap = { shape: "photo", src: "data:image/png;base64,AAAA", w: 200, h: 200, scale: 0.7, cap: "Tripod position\n  Leaning forward, hands on knees to open the chest\nNasal flaring\n  Esp. in infants" };
  const longSvg = SB.recallSvg(ahi, { custom: { stickers: { 0: Object.assign({}, listSt, longCap) } }, landscape: true, print: true, builder: true });
  study("long fact lines wrap inside the card instead of overflowing", longSvg.includes("Leaning") && longSvg.includes("forward") && longSvg.includes('class="rfactline"'), "wrapped fact missing");
  const idA = SB.imageId({ src: "data:image/png;base64,AAAA" }), idB = SB.imageId({ src: "data:image/png;base64,BBBB" }), idS = SB.imageId({ shape: "lungs" });
  study("image ids distinguish photos and sample shapes", idA && idA !== idB && idS === "shape:lungs" && idA.indexOf("src:") === 0, idA + " " + idB + " " + idS);
  const conf = SB.findImageConflicts([{ id: idA, where: "a" }], [{ ids: [idA], label: "Page 2" }]);
  study("a repeated image on another print page is flagged", conf.length === 1 && conf[0].other === "Page 2", JSON.stringify(conf));
  study("print pages use a new storage key", SB.printPageKey() === "obPrintPages:SDS", SB.printPageKey());
  const thumbs = {};
  for (let i = 0; i < 4; i++) thumbs[i] = { shape: "photo", src: "data:image/png;base64,BBBB", w: 200, h: 200, scale: 1 };
  const fillSt = Object.assign({}, listSt, { thumbs });
  const oneMap = Object.assign({}, ahi, { title: "Signs of Respiratory Distress", intro: "", note: "", src: "", abbrs: [], related: [], facts: [{ label: "Signs of Respiratory Distress", details: [], sev: null, idea: { shape: "lungs" } }] });
  const fillSvg = SB.recallSvg(oneMap, { custom: { stickers: { 0: fillSt } }, landscape: true, print: true, builder: true, noPics: true, noSong: true });
  const fillBox = SB.last().boxes[0], fillH = SB.last().H;
  const fillL = SB.calloutLayout(fillBox, SB.composePhoto(fillBox, fillSt, "list"), fillSt, SB.capItems(fillSt, oneMap.facts[0], fillBox), true);
  const card = fillL.nodes[0].card;
  study("card pictures are whole at their own shape, and a side picture is never wider than the text column", Math.abs(card.imgW / card.imgH - 1) < 0.02 && (card.textLayout === "band" || card.imgW <= card.textColW), "imgW=" + card.imgW + " imgH=" + card.imgH + " text=" + card.textColW + " layout=" + card.textLayout);
  const hubInner = fillL.hub.w - 2 * fillL.hub.pad;
  study("the hub picture fills the well under the title", fillL.hub.img && Math.abs(fillL.hub.img.w - hubInner) < 1 && fillL.hub.img.h >= 24 && fillL.hub.img.y >= fillL.hub.y1 + 6 && fillL.hub.img.y + fillL.hub.img.h <= fillL.hub.y2 - 6, "hub img " + JSON.stringify(fillL.hub.img));
  const shortCap = "Tachypnea\n  RR > 20/min\n  Earliest sign";
  const wideTh = { shape: "photo", src: "data:image/png;base64,CCCC", w: 512, h: 220, scale: 1 };
  const shortSt = { shape: "photo", src: "data:image/png;base64,AAAA", w: 400, h: 400, scale: 0.85, cap: shortCap, thumbs: { 0: wideTh } };
  const shortM = Object.assign({}, oneMap, { facts: [{ label: "Signs of Respiratory Distress", details: [], sev: null, idea: { shape: "lungs" } }] });
  SB.recallSvg(shortM, { custom: { stickers: { 0: shortSt } }, landscape: true, print: true, builder: true, noPics: true, noSong: true });
  const shortBox = SB.last().boxes[0];
  const shortL = SB.calloutLayout(shortBox, SB.composePhoto(shortBox, shortSt, "list"), shortSt, SB.capItems(shortSt, shortM.facts[0], shortBox), true);
  const shortCard = shortL.nodes[0].card;
  const shortArea = shortCard.imgW * shortCard.imgH, bodyArea = shortCard.w * (shortCard.h - shortCard.headH);
  study("short fact text sits in a top band; the whole picture sits under it, about 3 text lines tall at M", shortCard.textLayout === "band" && shortCard.bandH > 0 && Math.abs(shortCard.imgW / shortCard.imgH - 512 / 220) < 0.05 && shortCard.imgH <= Math.max(64, shortCard.textH * 3) + 1 && shortCard.imgRelY >= shortCard.headH + shortCard.bandH, JSON.stringify({ layout: shortCard.textLayout, imgW: shortCard.imgW, imgH: shortCard.imgH, textH: shortCard.textH, bandH: shortCard.bandH }));
  const cov = SB.photoCover({ w: 100, h: 50, fit: { x: 0.2, y: 0.1, w: 0.5, h: 0.8 } }, { x: 0, y: 0, w: 40, h: 40 }, "cover");
  study("a photo with empty margins is zoomed to its content and still covers the slot", cov.w > 40 && cov.h > 40 && cov.x < 0, JSON.stringify(cov));
  const wide = SB.photoCover({ w: 200, h: 80 }, { x: 0, y: 0, w: 80, h: 80 }, "auto");
  study("a wide fact picture stays complete instead of cropping its sides", wide.w <= 80.1 && wide.h < 80, JSON.stringify(wide));
  study("fact text uses a fixed 10.5/9 pt size that is never reduced to make room for a picture", SB.FACT_FS === 10.5 && SB.FACT_FS_SUB === 9, "FACT_FS=" + SB.FACT_FS + " SUB=" + SB.FACT_FS_SUB);
  const longFacts = { text: "Alveolar gas equation", facts: ["The alveolar gas equation estimates PAO2 from PIO2, PaCO2 and the respiratory exchange ratio, and it is used at the bedside", "A second supporting detail that is also fairly long so the text column has to keep its size"] };
  const shortFacts = { text: "Tachypnea", facts: ["RR > 20/min", "Earliest sign"] };
  const pic = { shape: "photo", src: "data:image/png;base64,AAAA", w: 400, h: 400 };
  const longCard = SB.cardGeom(200, 200, "R", longFacts, pic, 280, 200);
  const shortPic = SB.cardGeom(200, 200, "R", shortFacts, pic, 280, 200);
  const longFs = (longCard.blocks || []).map((b) => b.fs);
  const shortFs = (shortPic.blocks || []).map((b) => b.fs);
  const fsOk = (arr) => arr.length && arr.every((fs, i) => fs === (i === 0 ? SB.FACT_FS : SB.FACT_FS_SUB));
  study("a long-text card keeps 10.5/9 pt fact text and every word, with the picture no wider than the text", fsOk(longFs) && fsOk(shortFs) && longCard.imgW <= longCard.textColW && longCard.blocks.map((bl) => bl.lines.join(" ")).join(" ") === longFacts.facts.join(" "), JSON.stringify({ longFs, shortFs, longImg: longCard.imgW, longText: longCard.textColW }));
  // Ken, Nov 25: "the info is important to be no less prominent than the image" — no size setting lets the picture outgrow the words
  const sizes = [0.5, 1, 1.5].map((sc) => SB.cardGeom(200, 200, "L", longFacts, Object.assign({}, pic, { scale: sc }), 280));
  study("at S, M and L the picture grows but never gets wider than the text column", sizes[0].imgW < sizes[1].imgW && sizes[1].imgW < sizes[2].imgW && sizes.every((c) => c.imgW <= c.textColW + 0.01), sizes.map((c) => Math.round(c.imgW) + "/" + Math.round(c.textColW)).join(" "));
  const fullCap = SB.capItems({ cap: "W\n  Alpha (8–13 Hz) over the occipital region in more than half the epoch, or eye blinks, reading or rapid eye movements with normal or high chin tone" }, null, {});
  study("card text is the learner's words in full, not trimmed to keywords", fullCap.items[0].kids[0].text === "Alpha (8–13 Hz) over the occipital region in more than half the epoch, or eye blinks, reading or rapid eye movements with normal or high chin tone", fullCap.items[0].kids[0].text);
  const numCap = SB.capItems({ cap: "pH\n  7.35 to 7.45\nBase excess\n  -2 to +2 mEq/L\n1. Listed item" }, null, {});
  study("numbers that start a line are kept (7.35 is not a list number, -2 is not a bullet)", numCap.items[0].kids[0].text === "7.35 to 7.45" && numCap.items[1].kids[0].text === "-2 to +2 mEq/L" && numCap.items[2].text === "Listed item", JSON.stringify(numCap.items.map((x) => [x.text, (x.kids[0] || {}).text])));
  const tallTh = { w: 275, h: 512 };
  study("a tall photo in a short slot uses contain so the head and feet stay visible", SB.photoFitMode(tallTh, 166, 165, false, 277, 165) === "contain", SB.photoFitMode(tallTh, 166, 165, false, 277, 165));
  study("the card tab sits in a gutter and does not cover the picture", card.tabGutter >= 4 && card.imgW + card.tabGutter <= card.w - 4, JSON.stringify({ w: card.w, imgW: card.imgW, gutter: card.tabGutter }));
  const ends = fillL.nodes.map((n) => {
    const pts = (n.leader.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
    const sx = pts[0], sy = pts[1], ex = pts[pts.length - 2], ey = pts[pts.length - 1];
    const ok = n.hubTab && n.cardTab && Math.abs(sx - n.hubTab.cx) < 0.2 && Math.abs(sy - n.hubTab.cy) < 0.2 && Math.abs(ex - n.cardTab.cx) < 0.2 && Math.abs(ey - n.cardTab.cy) < 0.2;
    return ok;
  });
  study("every connector starts at the hub tab center and ends at the card tab center", ends.length === fillL.nodes.length && ends.every(Boolean), JSON.stringify(fillL.nodes.map((n) => ({ i: n.i, leader: n.leader, hub: n.hubTab && [n.hubTab.cx, n.hubTab.cy], card: n.cardTab && [n.cardTab.cx, n.cardTab.cy] }))));
  study("card header and picture are clipped to the rounded card", fillSvg.includes("rcardclip") && fillSvg.includes('class="rcardface"') && fillSvg.includes('class="rcardstroke"'), "card clip missing");
  const hubFillAt = fillSvg.indexOf('class="rhubfill"'), hubBandAt = fillSvg.indexOf('class="rhubband"'), hubStrokeAt = fillSvg.indexOf('class="rhubstroke"');
  study("the hub border is drawn last and the title band stays inside it", hubStrokeAt > hubFillAt && (hubBandAt < 0 || hubStrokeAt > hubBandAt) && /class="rhubfill"[^>]*stroke="none"/.test(fillSvg) && /class="rhubband"[^>]*fill="#fff"/.test(fillSvg) && !/class="rhubband"[^>]*fill-opacity/.test(fillSvg), "hub stroke order " + [hubFillAt, hubBandAt, hubStrokeAt].join(","));
  const cardStrokeAt = fillSvg.indexOf('class="rcardstroke"'), cardHeadAt = fillSvg.indexOf('class="rcardhead"');
  study("each card border is drawn after the header strip", cardStrokeAt > cardHeadAt && cardStrokeAt > 0, "card stroke order");
  study("the landscape map fills the page above the footer", fillBox.x2 - fillBox.x1 >= 900 && (fillBox.y2 - fillBox.y1) >= 0.72 * (fillH - fillBox.y1 - 16), "box=" + [fillBox.x1, fillBox.y1, fillBox.x2, fillBox.y2].map(Math.round).join(",") + " H=" + fillH);
  const retitled = Object.assign({}, ahi, { title: "Signs of Respiratory Distress", intro: "", facts: [{ label: "Signs of Respiratory Distress", details: [], sev: null, idea: { shape: "lungs" } }] });
  const rdSvg = SB.recallSvg(retitled, { landscape: true, print: true, noSong: true, noPics: true });
  const ahiSvg = SB.recallSvg(ahi, { landscape: true, print: true, noSong: true, noPics: true });
  study("a retitled map does not keep another topic's footer", !/Apnea-hypopnea|American Academy of Sleep Medicine|Children use lower cutoffs/.test(rdSvg) && rdSvg.includes("Source: Otter Bay"), "leak in custom map footer");
  study("a topic's own footer still prints when the title matches", ahiSvg.includes("Apnea-hypopnea") && ahiSvg.includes("American Academy of Sleep Medicine"), "AHI footer missing");
}


const PAGES_HTML = ["index.html", "sds/index.html", "rpsgt/index.html", "cna/index.html"];
const missingRecall = PAGES_HTML.filter((p) => !fs.readFileSync(path.join(ROOT, p), "utf8").includes("js/recall.js"));
const missingIdeas = PAGES_HTML.filter((f) => { const h = fs.readFileSync(path.join(ROOT, f), "utf8"); const a = h.indexOf("js/memory_ideas.js"), b = h.indexOf("js/recall.js"); return a < 0 || a > b; });
study("all four apps load the picture ideas and jingles before the study sheet", !missingIdeas.length, missingIdeas.join(", "));
study("all four apps load the study sheet", !missingRecall.length, missingRecall.join(", "));
const vsrc = fs.readFileSync(path.join(ROOT, "js/voice.js"), "utf8");
study("Ask offers Print study sheet and brings back Your study page", vsrc.includes("Print study sheet") && vsrc.includes("Your study page") && vsrc.includes("My study pages"), "button text missing");
const rsrc = fs.readFileSync(path.join(ROOT, "js/recall.js"), "utf8");
study("the image maker has paste/drop/choose, a size control, and Done", rsrc.includes("stpastebox") && rsrc.includes("Paste a sticker or photo, drop one here, or tap to choose") && rsrc.includes("data-stscale") && rsrc.includes('data-act="stdone"'), "ui missing");
study("fact text size is a constant, not a shrinking fit", rsrc.includes("const FACT_FS = 10.5, FACT_FS_SUB = 9") && !/factBlocks[\s\S]{0,200}fitLines\(/.test(rsrc) && /function textColFits[\s\S]{0,400}FACT_FS/.test(rsrc), "FACT_FS missing or fact text uses a shrinking fitter");
study("drawing a stroke does not re-render or navigate on pointer up", rsrc.includes("skipClick") && !/if \(pen\) \{ const k = pen\.k; pen = null; if \(k\.pts\.length > 1\)[\s\S]{0,180}render\(\)/.test(rsrc), "endPtr still calls render");
study("Back and Done return to the Ask card, Memory Arcade, or Settings", vsrc.includes("returnFromStudy") && vsrc.includes('from === "bin"') && vsrc.includes('from === "settings"') && vsrc.includes("stdone"), "origin return missing");

const vcss = fs.readFileSync(path.join(ROOT, "css/voice.css"), "utf8");
study("print maps go on a landscape letter page, in color, with the app chrome hidden", rsrc.includes("landscape: true") && vcss.includes("@page { size: letter landscape; margin: 0.4in; }") && vcss.includes("print-color-adjust: exact") && vcss.includes("body > *:not(#obPrint)"), "print css missing");
study("print hides edit and resize handles", vcss.includes("html.obprinting .rthumbadd") && vcss.includes("display: none !important") && vcss.includes(".rhandle"), "print handle hide missing");
study("print hides the Replace menu", vcss.includes("html.obprinting .streplace") && vcss.includes("html.obprinting .stdrawslot"), "replace menu not hidden in print");
study("each picture has a Replace menu: Paste, Drop, Photo gallery, Take photo, Draw, Stickers, Draw on this photo",
  rsrc.includes('id="streplace"') && rsrc.includes("Replace this picture") && rsrc.includes("streplacepaste") && rsrc.includes("streplacedrop") && rsrc.includes("Photo gallery") && rsrc.includes('id="stgallery"') && rsrc.includes("Take photo") && rsrc.includes('id="stcamera"') && rsrc.includes('capture="environment"') && rsrc.includes("streplacedraw") && rsrc.includes("streplacestickers") && rsrc.includes("Draw on this photo") && rsrc.includes('id="stdrawfile"') && rsrc.includes("stdrawdone") && rsrc.includes("openReplace") && rsrc.includes("rhubpic"),
  "replace menu missing");
function inputTag(src, id) {
  const i = src.indexOf('id="' + id + '"');
  if (i < 0) return "";
  const from = src.lastIndexOf("<input", i);
  const to = src.indexOf(">", i);
  return src.slice(from < 0 ? i : from, to < 0 ? i + 120 : to + 1);
}
const gal = inputTag(rsrc, "stgallery"), cam = inputTag(rsrc, "stcamera"), drw = inputTag(rsrc, "stdrawfile");
study("Photo gallery opens the OS picker with no capture attribute; Take photo uses the camera",
  /accept="image\/\*"/.test(gal) && !/capture=/.test(gal) && /accept="image\/\*"/.test(cam) && /capture="environment"/.test(cam) && /accept="image\/\*"/.test(drw) && !/capture=/.test(drw),
  "gal=" + gal + " cam=" + cam);
study("Draw on this photo has its own Done (it does not leave the study sheet)", rsrc.includes('data-act="stdrawdone"') && /function finishSlotDraw/.test(rsrc) && rsrc.includes("startSlotDraw"), "slot draw missing");

study("Add to print page, Print pages tray, Print all, and swap-image are in the study sheet", rsrc.includes("staddprint") && rsrc.includes("stprinttray") && rsrc.includes("stprintall") && rsrc.includes("stprintswap") && rsrc.includes("obPrintPages:"), "print pages ui missing");

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
    const atksrc = fs.readFileSync(path.join(ROOT, "js/bin.js"), "utf8");
    const vcss = fs.readFileSync(path.join(ROOT, "css/voice.css"), "utf8");
    const games = X.OB_BIN.GAMES.map((g) => g[0]);
    const missingDemo = games.filter((g) => !new RegExp("const DEMOS =[\\s\\S]*?" + g + ":\\s*\\[").test(atksrc) || !new RegExp("const DEMO_BOARD =[\\s\\S]*?" + g + ":").test(atksrc));
    study("Memory Arcade demos: every game has a short auto-play how-to (ghost finger, captions, Skip and Start) before the first play, a ? to replay it, seen-state in its own obArcadeDemo key, Fact Attack's old how-to card is folded in, and Next stays on screen after a miss", !missingDemo.length && atksrc.includes("obArcadeDemo:") && atksrc.includes('data-act="bgdemostart"') && atksrc.includes('data-act="bgdemoskip"') && atksrc.includes('data-act="bgdemohelp"') && atksrc.includes("demo: !demoSeen(game)") && atksrc.includes("if (g.demo) return demoView()") && atksrc.includes("function demoView()") && atksrc.includes("function endDemo()") && atksrc.includes('aria-label="How to play"') && !atksrc.includes("B.atkHow") && !atksrc.includes("bgatkstart") && !/\.atkhow/.test(vcss) && /\.gdemo /.test(vcss) && vcss.includes(".gdemo-finger") && vcss.includes("position: sticky") && vcss.includes(".bin:has(.gwait) .gfield") && vcss.includes(".bin:has(.gwait) .gfall"), missingDemo.join(", ") || "demo wiring missing");
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
  study("Add to Study List flag on Ask answers, Study List on home", vsrc.includes("OB_BIN.flag(k)") && hsrc.includes("OB_BIN.way()") && vsrc.includes("window.OB_THEME = themeVars"), "hook missing");
  const bsrc = fs.readFileSync(path.join(ROOT, "js/bin.js"), "utf8");
  study("Study List header and home button use a list control, not the arcade otter", bsrc.includes('class="archead"') && bsrc.includes('<h1 class="arch1">Study List</h1>') && bsrc.includes("listway") && !/arcadeway/.test(bsrc.split("\n").filter((l) => !/^\s*(\/\/|\/\*|\*)/.test(l)).join("\n")) && !bsrc.includes('class="archero"'), "list header/button");
  study("party otter images still present and the small one under 60 KB", fs.existsSync(path.join(ROOT, "images/brand/otter-arcade.jpg")) && fs.existsSync(path.join(ROOT, "images/brand/otter-arcade-icon.jpg")) && fs.statSync(path.join(ROOT, "images/brand/otter-arcade-256.jpg")).size < 60000, "otter images");
  study("perfect score party: fires on a win with no misses, bubble says Yes, perfect score!!!, moonwalk still, confetti, streamers (some in front, none over the face), no balloons, reduced-motion still version, both otter cut-outs present", bsrc.includes("if (win && G.right > 0 && G.wrong === 0) celebrate();") && bsrc.includes('"Yes, perfect score!!!"') && bsrc.includes("otter-moonwalk.webp") && bsrc.includes('class="pstream"') && bsrc.includes("pstream-front") && !bsrc.includes('class="pball"') && !bsrc.includes("function balloons") && bsrc.includes('class="pconf"') && bsrc.includes("prefers-reduced-motion") && fs.existsSync(path.join(ROOT, "images/brand/otter-yes.webp")) && fs.existsSync(path.join(ROOT, "images/brand/otter-moonwalk.webp")), "party");
  const learnerBin = bsrc.split("\n").filter((l) => !/^\s*(\/\/|\/\*|\*)/.test(l)).join("\n");
  study("Study List: learner-facing names, same obBin key, new style and tip keys", !/study bin|Study this|Add to Arcade|In your Memory Arcade|Play to Learn/i.test(learnerBin) && bsrc.includes("Add to Study List") && bsrc.includes("Saved to Study List") && bsrc.includes("obBin:") && bsrc.includes("obStudyStyle:") && bsrc.includes("obStudyTip:") && !bsrc.includes("obBin2") && !bsrc.includes("obArcade:"), "study list names/keys");
  study("each saved item offers Picture, Jingle, Flashcard, and Game, with last style remembered", bsrc.includes('["picture", "Picture"]') && bsrc.includes('["jingle", "Jingle"]') && bsrc.includes('["flash", "Flashcard"]') && bsrc.includes('["game", "Game"]') && bsrc.includes("data-act=\"binstyle\"") && bsrc.includes("rememberStyle") && /TIP\.shown < 2/.test(bsrc) && bsrc.includes("You can pick how to study it"), "style picker or tip missing");
  study("stats-page Task only sorts or highlights the list, never hides items, and All items is a tab", bsrc.includes("Your focus") && bsrc.includes("More in your list") && bsrc.includes("All items") && bsrc.includes("data-act=\"binall\"") && bsrc.includes('class="bintabs"') && bsrc.includes('role="tablist"') && !bsrc.includes('glink" data-act="binall"') && bsrc.includes("nothing else is hidden") && bsrc.includes("currentFocusTasks") && !/VIEW = \"bin\".*filter.*focus/.test(bsrc), "focus hide/sort missing");
  study("all four apps load the card outline before the Study List", !PAGES_HTML.filter((f) => { const h = fs.readFileSync(path.join(ROOT, f), "utf8"); const a = h.indexOf("js/scale_outline.js"), b = h.indexOf("js/bin.js"); return a < 0 || a > b; }).length, "scale_outline.js missing or after bin.js");
  {
    const T = (function () {
      const ctx = vm.createContext({ console, EXAM: "SDS" }); ctx.window = ctx;
      vm.runInContext(fs.readFileSync(path.join(ROOT, "js/scale_outline.js"), "utf8"), ctx, { filename: "js/scale_outline.js" });
      return ctx.taxonomyForScale;
    })();
    const ahi = T("ahi", { exam: "SDS" }), hsat = T("hsat", { exam: "SDS" }), st = T("staging", { exam: "SDS" });
    const gas = T("gaslaws", { exam: "SDS" }), otherFocus = T("nosuch", { exam: "SDS" });
    const polluted = T("ahi", { exam: "SDS", qs: [{ sec: "III-B", secName: "Sleep Staging", tgroup: "Sleep staging", scales: ["ahi", "staging"] }] });
    study("AHI and HSAT keep their own Tasks, not Sleep Staging", ahi.task === "III-D" && ahi.taskName === "Sleep Event Reporting" && hsat.task === "I-A" && hsat.topic === "Home sleep testing" && st.task === "III-B" && polluted.task === "III-D", JSON.stringify({ ahi, hsat, st, polluted }));
    study("a card with no outline falls back to Other and never matches a focus Task", gas.other === true && gas.task === "" && gas.taskName === "Other" && otherFocus.other === true && otherFocus.task !== "III-B", JSON.stringify({ gas, otherFocus }));
    const infer = (bsrc.split("function inferTaxonomy")[1] || "").split("function tagItem")[0];
    study("Study List tagging uses the card outline, not the current question or the stats-page focus", bsrc.includes("taxonomyForScale") && infer.includes("taxonomyForScale") && !infer.includes("Q()") && !infer.includes("S.build") && !infer.includes("currentFocus"), infer.slice(0, 200) || "inferTaxonomy missing");
  }
  study("practice questions get the flag through scaleButtons, after the answer", /W\.scaleButtons = function \(q, c\)/.test(bsrc) && bsrc.includes("if (!c || !c.done) return h"), "wrap missing");
  study("Add to Study List on info sheets and study pages, hidden in print",
    bsrc.includes("origSheet") && bsrc.includes("W.scaleSheet") && rsrc.includes("starcade") && rsrc.includes("OB_BIN.flag")
    && vcss.includes("html.obprinting .starcade") && vcss.includes("#obPrint .binflag"), "info/study flag or print hide missing");
  const SDS = exams.find((X) => X.EXAM === "SDS") || exams[1];
  const parsed = SDS.OB_BIN.parseArcadeList("OBARC1:SDS:staging,staging,nonesuch,ahi", SDS.SCALES);
  const bare = SDS.OB_BIN.parseArcadeList("  ahi , staging ", SDS.SCALES);
  study("Study List import keeps only known concept keys and de-duplicates, without changing the obBin key name",
    JSON.stringify(parsed) === JSON.stringify(["staging", "ahi"]) && JSON.stringify(bare) === JSON.stringify(["ahi", "staging"])
    && bsrc.includes("obBin:") && bsrc.includes("parseArcadeList") && !bsrc.includes("obBin2") && !bsrc.includes("obArcade:"),
    JSON.stringify(parsed) + " / " + JSON.stringify(bare));
  const asrc = fs.readFileSync(path.join(ROOT, "tools/vetting/ask_ui.js"), "utf8");
  const arsrc = fs.readFileSync(path.join(ROOT, "tools/vetting/arcade_ui.js"), "utf8");
  const embed = fs.readFileSync(path.join(ROOT, "tools/vetting/build_embed.js"), "utf8");
  study("vetting pages get the same Add to Study List flag and an export list, not question text",
    asrc.includes("OB_VET_ARCADE.flag") && arsrc.includes("obBin:") && arsrc.includes("OBARC1:") && arsrc.includes("data-act=\"binflag\"")
    && arsrc.includes("Add to Study List") && arsrc.includes("Saved to Study List") && !arsrc.includes("Add to Arcade")
    && embed.includes("arcade_ui.js") && !arsrc.includes("questionId") && !arsrc.includes("EMBEDDED_QUESTIONS"),
    "vetting study-list hook missing");
}

const total = CHECKS.length + ROW_CHECKS.length + UI_FILES.length + st;
console.log(bad ? `\n${bad} of ${total} checks failed` : `\nAll ${total} checks passed`);
process.exit(bad ? 1 : 0);
