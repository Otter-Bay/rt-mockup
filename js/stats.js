/* Stats page: the practice builder. Owner: Noelle (reorganized with Ken + Claude, Oct 25).
   Uses shared globals from app.js (S, QS, ALL, ICON, esc, newRun) and progress.js (RL, ST, save, REASON_TXT).
   Flow, top to bottom: a one-line progress summary, then the builder (what to practice -> focus by domain, task or topic ->
   more filters -> how many and which mode), then the review list. The Start button is always in reach.
   Add new buttons by giving them data-act="..." and handling them in STATS_ACTIONS below. */

let RL_ALL = false;
const COUNTS = ["10", "20", "50"];
const DOM_NAMES = { RRT: { I: "Patient data", II: "Equipment and safety", III: "Interventions" } };
const domName = (d) => (QS.find((q) => q.domain === d && q.domName) || {}).domName || (DOM_NAMES[window.EXAM || "RRT"] || {})[d] || "";
const FORMATS = [["img", "With an image", (q) => !!q.img], ["data", "With a data list", (q) => q.rows.length > 0], ["card", "With a rule card", (q) => (q.scales || []).length > 0]];

function sourceOK(q) {
  const b = S.build;
  if (b.src === "review") return !!RL[q.id];
  if (b.src === "missed") return ST[q.id] && ST[q.id].correct < ST[q.id].attempts && (!b.lastOnly || ST[q.id].lastCorrect === false);
  if (b.src === "new") return !ST[q.id];
  return true;
}
function filterOK(q, skip) {
  const b = S.build, any = (o) => Object.values(o || {}).some(Boolean);
  const f = b.focus || "task";
  if (skip !== "focus") {
    if (f === "domain" && any(b.doms) && !b.doms[q.domain]) return false;
    if (f === "task" && any(b.secs) && !b.secs[q.sec]) return false;
    if (f === "topic" && any(b.tops) && !b.tops[q.tgroup]) return false;
  }
  if (skip !== "fmt" && any(b.fmt) && !FORMATS.some(([k, , f]) => b.fmt[k] && f(q))) return false;
  if (skip !== "lvls" && any(b.lvls) && !b.lvls[q.lvl]) return false;
  if (skip !== "ages" && any(b.ages) && !b.ages[q.age.startsWith("Pediatric") ? "Pediatric" : q.age]) return false;
  return true;
}
function matching() { return ALL.filter((i) => sourceOK(QS[i]) && filterOK(QS[i])); }
function buildSet() {
  const m = matching();
  return S.build.count === "all" ? m : m.slice(0, Number(S.build.count));
}
function startLabel() {
  const m = matching().length, n = buildSet().length;
  const w = S.build.mode === "flash" ? "card" : "question";
  return m ? `Start ${n} ${w}${n === 1 ? "" : "s"}` : "No questions match";
}

function sectionRows() {
  const by = {};
  for (const q of QS) {
    const r = by[q.sec] || (by[q.sec] = { sec: q.sec, name: q.secName, dom: q.domain, total: 0, tried: 0, att: 0, cor: 0 });
    r.total++; const st = ST[q.id];
    if (st) { r.tried++; r.att += 1; r.cor += st.lastCorrect ? 1 : 0; r.allAtt = (r.allAtt || 0) + st.attempts; r.allCor = (r.allCor || 0) + st.correct; }   // latest try (see progress.js)
  }
  return Object.values(by).sort((a, b) => a.sec.localeCompare(b.sec, undefined, { numeric: true }));
}

function groupRows(focus) {
  const by = {}, key = (q) => (focus === "domain" ? q.domain : focus === "topic" ? q.tgroup || "Other" : q.sec);
  for (const q of QS) {
    const k = key(q);
    const r = by[k] || (by[k] = { key: k, dom: q.domain, name: focus === "task" ? q.secName : focus === "domain" ? domName(q.domain) : "", total: 0, tried: 0, att: 0, cor: 0, match: 0 });
    r.total++; const st = ST[q.id];
    if (st) { r.tried++; r.att += 1; r.cor += st.lastCorrect ? 1 : 0; r.allAtt = (r.allAtt || 0) + st.attempts; r.allCor = (r.allCor || 0) + st.correct; }   // latest try (see progress.js)
    if (sourceOK(q) && filterOK(q, "focus")) r.match++;
  }
  const rows = Object.values(by);
  return focus === "topic" ? rows.sort((a, b) => b.total - a.total) : rows.sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true }));
}

function statsBody() {
  const b = S.build;
  const att = Object.values(ST).length, cor = Object.values(ST).filter((x) => x.lastCorrect).length;
  const tried = QS.filter((q) => ST[q.id]).length, pct = att ? Math.round(cor / att * 100) : 0;
  const rlIds = QS.filter((q) => RL[q.id]);
  const everMissed = QS.filter((q) => ST[q.id] && ST[q.id].correct < ST[q.id].attempts).length;
  const focus = b.focus || "task", sel = focus === "domain" ? (b.doms = b.doms || {}) : focus === "topic" ? (b.tops = b.tops || {}) : b.secs;
  const grows = groupRows(focus), scored = grows.filter((r) => r.att);
  const weak = scored.length > 1 ? scored.reduce((a, r) => (r.cor / r.att < a.cor / a.att ? r : a)) : null;
  const nFocus = Object.values(sel).filter(Boolean).length;
  const countWord = b.src === "missed" ? "missed" : b.src === "review" ? "to review" : b.src === "new" ? "new" : "questions";
  const doms = [...new Set(grows.map((r) => r.dom))];
  const topicEg = groupRows("topic").slice(0, 2).map((r) => r.key).join(" or ");
  const row = (r) => { const p = r.att ? Math.round(r.cor / r.att * 100) : null; const on = !!sel[r.key]; return `<button type="button" class="secpick ${on ? "on" : ""}" data-act="gsel" data-v="${esc(r.key)}" aria-pressed="${on}" ${r.match ? "" : "data-empty"}>
            <span class="box" aria-hidden="true">${on ? ICON.ok : ""}</span>
            <span class="stext"><b>${focus === "domain" ? `${r.key}. ${esc(r.name)}` : esc(r.key)}${weak && weak.key === r.key ? ` <i class="weaktag">Weakest</i>` : ""}</b>${focus === "task" && r.name ? `<small>${esc(r.name)}</small>` : `<small>${r.tried} of ${r.total} tried${p !== null ? ` · ${p}% correct` : ""}</small>`}
              <span class="sbar" aria-hidden="true"><i style="width:${p === null ? 0 : Math.max(4, p)}%"></i></span></span>
            <span class="sval">${r.match}<small>${countWord}</small></span></button>`; };
  const nMore = ["fmt", "lvls", "ages"].reduce((a, k) => a + Object.values(b[k] || {}).filter(Boolean).length, 0);
  const m = matching().length;

  const src = (v, label, count, hint) => `<button type="button" class="pick2" data-act="src" data-v="${v}" aria-pressed="${b.src === v}" ${count === 0 && v !== "all" ? "disabled" : ""}>
    <span class="dot" aria-hidden="true"></span><span><b>${label}</b><small>${hint}</small></span><em>${count}</em></button>`;
  const chip = (act, v, label, on, count) => `<button type="button" class="chip" data-act="${act}" data-v="${v}" aria-pressed="${!!on}">${label}${count !== undefined ? `<span class="n">${count}</span>` : ""}</button>`;
  const lvls = ["Recall", "Application", "Analysis"].filter((l) => QS.some((q) => q.lvl === l));
  const ages = ["Adult", "Pediatric", "Neonatal"].filter((a) => QS.some((q) => q.age.startsWith(a)));

  return `
    <div class="sthead"><h1 class="ph">Practice</h1>
      <p class="lede">${tried ? `You've tried ${tried} of ${QS.length} questions, ${pct}% correct${rlIds.length ? `, with ${rlIds.length} to revisit` : ""}.` : `${QS.length} questions are ready. Choose what you'd like to work on.`}</p></div>

    <section class="step"><h2>What to practice</h2>
      <div class="pick2s">
        ${src("all", "All questions", QS.length, "Everything in the bank")}
        ${src("new", "Not tried yet", QS.length - tried, "Questions you haven't seen")}
        ${src("review", "My review list", rlIds.length, "Missed or marked Not sure")}
        ${src("missed", "Missed questions", everMissed, "Any question you've gotten wrong")}
        ${b.src === "missed" ? `<label class="sub2"><input type="checkbox" data-act="lastonly" ${b.lastOnly ? "checked" : ""}> Only ones I got wrong the last time</label>` : ""}
      </div>
    </section>

    <section class="step"><div class="steph"><h2>Focus on</h2>${nFocus ? `<button type="button" class="link" data-act="focusclear">Clear ${nFocus}</button>` : `<span class="hint">Everything</span>`}</div>
      <div class="seg" role="tablist" aria-label="Group questions by">${[["domain", "Domain"], ["task", "Task"], ["topic", "Topic"]].map(([k, l]) => `<button type="button" role="tab" data-act="focus" data-v="${k}" aria-selected="${focus === k}">${l}</button>`).join("")}</div>
      <p class="hint">${focus === "domain" ? "The exam's main content areas." : focus === "task" ? "The sections of the exam outline, grouped by domain." : "Subjects such as " + topicEg + "."} Tap to choose. ${countWord === "missed" ? "Numbers show your missed questions." : "Bars show your % correct."}</p>
      ${focus === "task" ? doms.map((d) => {
        const rs = grows.filter((r) => r.dom === d), on = rs.filter((r) => b.secs[r.key]).length, dm = rs.reduce((a, r) => a + r.match, 0);
        return `<details class="dom" ${on || (weak && rs.some((r) => r.key === weak.key)) ? "open" : ""}><summary><span class="dname">${d}. ${esc(domName(d)) || "Domain " + d}</span>
            <span class="dmeta">${on ? `${on} selected` : `${dm} ${countWord}`}</span></summary>
          <button type="button" class="link small" data-act="domall" data-v="${d}">${on === rs.length ? "Clear this domain" : "Select whole domain"}</button>
          ${rs.map(row).join("")}</details>`; }).join("") : `<div class="glist">${grows.map(row).join("")}</div>`}
    </section>

    <section class="step"><details class="more" ${nMore ? "open" : ""}><summary><h2>More filters</h2><span class="hint">${nMore ? `${nMore} on` : "Optional"}</span></summary>
      <fieldset><legend>Question type</legend><div class="chips">${FORMATS.map(([k, l, f]) => chip("fmt", k, l, b.fmt[k], QS.filter(f).length)).join("")}</div></fieldset>
      ${lvls.length > 1 ? `<fieldset><legend>Thinking level</legend><div class="chips">${lvls.map((l) => chip("lvl", l, l, b.lvls[l], QS.filter((q) => q.lvl === l).length)).join("")}</div></fieldset>` : ""}
      ${ages.length > 1 ? `<fieldset><legend>Patient</legend><div class="chips">${ages.map((a) => chip("age", a, a, b.ages[a], QS.filter((q) => q.age.startsWith(a)).length)).join("")}</div></fieldset>` : ""}
    </details></section>

    <section class="step"><h2>How many, and how</h2>
      <div class="chips">${COUNTS.map((v) => chip("count", v, v === "all" ? `All ${m}` : v, b.count === v)).join("")}</div>
      <div class="modes">
        <button type="button" class="mode2" data-act="bmode" data-v="study" aria-pressed="${b.mode === "study"}"><b>Study</b><small>See the answer and why after each question</small></button>
        <button type="button" class="mode2" data-act="bmode" data-v="exam" aria-pressed="${b.mode === "exam"}"><b>Exam</b><small>Timed, with answers at the end</small></button>
        <button type="button" class="mode2" data-act="bmode" data-v="flash" aria-pressed="${b.mode === "flash"}"><b>Flashcards</b><small>Just the question; think, flip, rate yourself</small></button>
      </div>
      <p class="match" aria-live="polite">${m ? `${m} question${m === 1 ? " matches" : "s match"} your choices.` : "Nothing matches. Clear a filter or pick a different set."}</p>
    </section>

    <section class="step"><h2>Review list</h2>
      <p class="hint">Questions you missed or marked Not sure. Each one clears after two confident correct answers in a row.</p>
      ${rlIds.length ? `<ul class="rvlist">${(RL_ALL ? rlIds : rlIds.slice(0, 3)).map((q) => `<li><span class="info"><b>${q.id} · ${esc(q.topic)}</b>${REASON_TXT[RL[q.id].reason]} · ${RL[q.id].streak} of 2 toward clearing</span><button type="button" class="rm" data-act="rlrm" data-id="${q.id}" aria-label="Remove ${q.id} from review list">${ICON.x}</button></li>`).join("")}</ul>
        ${rlIds.length > 3 ? `<button type="button" class="link" data-act="rlall">${RL_ALL ? "Show fewer" : `Show all ${rlIds.length}`}</button>` : ""}`
        : `<p class="hint"><b>Nothing here yet.</b> Tap Not sure on any question you're unsure of, and missed questions land here too.</p>`}
    </section>
    <button type="button" class="link" data-act="resetstats">Reset my stats and review list (for testing)</button>`;
}

function statsPage() {   // plain layout (used where the Otter Bay frame isn't loaded)
  return `<div class="sheet"><div class="stats">${statsBody()}
    <div class="row"><button type="button" class="btn" data-act="buildstart" ${matching().length ? "" : "disabled"}>${startLabel()}</button></div>
    <div class="row"><button type="button" class="btn grey" data-act="backquiz">Back to questions</button></div></div></div>`;
}

const STATS_ACTIONS = {
  stats: () => { S.page = S.page === "stats" ? "quiz" : "stats"; S.view = null; },
  backquiz: () => { S.page = "quiz"; },
  src: (b) => { S.build.src = b.dataset.v; },
  sec: (b) => { const k = b.dataset.v; S.build.secs[k] = !S.build.secs[k]; },
  focus: (b) => { if (S.build.focus === b.dataset.v) return; S.build.focus = b.dataset.v; S.build.secs = {}; S.build.doms = {}; S.build.tops = {}; },
  gsel: (b) => { const f = S.build.focus || "task", o = f === "domain" ? (S.build.doms = S.build.doms || {}) : f === "topic" ? (S.build.tops = S.build.tops || {}) : S.build.secs; o[b.dataset.v] = !o[b.dataset.v]; },
  lastonly: () => { S.build.lastOnly = !S.build.lastOnly; },
  focusclear: () => { S.build.secs = {}; S.build.doms = {}; S.build.tops = {}; },
  secclear: () => { S.build.secs = {}; },
  domall: (b) => { const rs = groupRows("task").filter((r) => r.dom === b.dataset.v), all = rs.every((r) => S.build.secs[r.key]); rs.forEach((r) => { S.build.secs[r.key] = !all; }); },
  fmt: (b) => { const k = b.dataset.v; S.build.fmt[k] = !S.build.fmt[k]; },
  lvl: (b) => { const k = b.dataset.v; S.build.lvls[k] = !S.build.lvls[k]; },
  age: (b) => { const k = b.dataset.v; S.build.ages[k] = !S.build.ages[k]; },
  count: (b) => { S.build.count = b.dataset.v; },
  bmode: (b) => { S.build.mode = b.dataset.v; },
  buildstart: () => { const set = buildSet(); if (!set.length) return false; S.set = set; S.mode = S.build.mode; newRun(); S.page = "quiz"; },
  rlrm: (b) => { delete RL[b.dataset.id]; save("rtReviewList", RL); },
  rlall: () => { RL_ALL = !RL_ALL; },
  resetstats: () => { for (const k in RL) delete RL[k]; for (const k in ST) delete ST[k]; save("rtReviewList", RL); save("rtStats", ST); },
};
