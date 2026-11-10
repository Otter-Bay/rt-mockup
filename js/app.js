/* App shell and question screen. Owner: question pop-up team.
   Stats page lives in stats.js; review list and progress storage in progress.js. */
// ---------- data: questions load from data/questions.json (same fields as the Firebase question document) ----------
let QS = [], ALL = [];
const IMG_KIND_SHORT = (t) => t || "Image";
function adapt(d) {
  return {
    id: d.questionId, section: d.section, sec: d.section, topic: d.topic, ans: d.correctAnswer,
    stem: d.stem, rows: d.stemTable || [], after: d.stemAfterTable || "", opts: d.options, why: d.rationale,
    img: d.image ? ((window.IMG_DATA && window.IMG_DATA[d.image.file]) || d.image.file) : null, cap: d.image ? IMG_KIND_SHORT(d.image.type) : "", alt: d.image ? d.image.alt : "",
    w: d.image ? d.image.width : 0, h: d.image ? d.image.height : 0, status: d.status,
    rank: d.vetting ? d.vetting.rank : null, score: d.vetting ? d.vetting.claudeScore : null, concern: d.vetting ? d.vetting.claudeConcern : "", conf: d.vetting ? d.vetting.confidence : null,
    scales: d.infoScales || [],
    secName: d.sectionName || "", domName: d.domainName || "", domain: d.domain || (d.section || "").split("-")[0], lvl: d.cognitiveLevel || "", age: d.patientAge || "", tgroup: d.topicGroup || "",
    ev: d.image && d.evidence ? d.evidence : null
  };
}
const L4 = ["A","B","C","D"];
const REASONS = ["The keyed answer is wrong","More than one answer is correct","The question is unclear","Data or image error","Outdated guideline","Typo","Something else"];
const ZOOMS = [1, 1.5, 2, 3];

const freshRun = (set) => set.map(() => ({ out: {}, sel: null, done: false, unsure: false, note: null }));
const S = { page: window.START_PAGE || "quiz", mode: "study", requireOut: false, intro: !window.VET_MODE && !seenIntro(), settings: false, set: [], qi: 0, run: [], results: false, reviewing: false,
  started: Date.now(), finishedMs: 0, fb: null, reason: null, reported: {}, view: null, viewEv: false, scale: null, zoom: 1, rot: true,
  build: { src: "all", secs: {}, mode: "study", count: "10", fmt: {}, lvls: {}, ages: {} }, loadError: null };
const Q = () => QS[S.set[S.qi]];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ICON = {
  check: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>',
  expand: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>',
  flag: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/></svg>',
  x: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12"/><path d="M18 6L6 18"/></svg>',
  minus: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/></svg>',
  plus: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
  rotate: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></svg>',
  info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 11v6"/><path d="M12 7.5v.01"/></svg>',
  ruleout: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M5.8 5.8l12.4 12.4"/></svg>',
  restore: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg>',
  gear: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  ro: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-label="rule-out button" role="img" style="vertical-align:-3px"><circle cx="12" cy="12" r="9"/><path d="M5.8 5.8l12.4 12.4"/></svg>',
  ok: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>',
  no: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12"/><path d="M18 6L6 18"/></svg>',
  chart: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/></svg>',
  unsure: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4.5"/><path d="M12 17.5v.01"/></svg>',
  bookmark: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
  sent: '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0F7A46" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M7 12l3.5 3.5L17 9"/></svg>'
};
const fmt = (ms) => { const s = Math.floor(ms / 1000); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); };
const cur = () => S.run[S.qi];
const revealed = () => cur().done && (S.mode === "study" || S.reviewing);

function canSubmit() {
  const c = cur();
  if (c.done || !c.sel) return false;
  if (S.requireOut) return L4.filter((l) => c.out[l]).length === 3;
  return true;
}

function guideText() {
  const c = cur();
  const outN = L4.filter((l) => c.out[l]).length;
  if (S.requireOut) {
    if (outN < 3) return [false, `Rule out ${3 - outN === 3 ? "three choices" : 3 - outN + " more"} with the ${ICON.ro} button, then tap Final. Ask yourself why each one is wrong.`];
    return [true, "Three ruled out. Your answer is selected. Tap Final to submit."];
  }
  if (c.sel) return [true, `${c.sel} is selected. Tap Final to submit, or use ${ICON.ro} to rule out choices first.`];
  return [false, `Tap a letter or an answer to choose it. Use ${ICON.ro} to rule out choices you think are wrong.`];
}

function render() {
  const phone = document.getElementById("phone");
  const keep = document.getElementById("content");
  const scroll = keep ? keep.scrollTop : 0;
  const vn = document.getElementById("vetNotes");
  if (vn && window.VET_MODE && VDRAFT[vn.dataset.q]) VDRAFT[vn.dataset.q].notes = vn.value;
  const draft = document.getElementById("fbWhy");
  const draftVal = draft ? draft.value : "";
  let h = "";
  const exam = S.mode === "exam";
  const PAGE = window.PAGES && window.PAGES[S.page];
  if (!PAGE) h += `<div class="appbar">${window.PAGES && window.PAGES.home ? `<button type="button" class="homebtn" data-act="go" data-v="home" aria-label="Home">${window.APP_LABEL || "RRT"}</button>` : `<b>${window.APP_LABEL || "RRT"}</b>`}<span class="mode ${exam ? "exam" : S.mode === "flash" ? "flash" : ""}">${exam ? "Exam <span id=\"timer\">" + fmt((S.results ? S.finishedMs : Date.now() - S.started)) + "</span>" : S.mode === "flash" ? "Flashcards" : "Study"}</span>
    <span class="count">${S.page === "stats" ? "Stats" : S.results && !S.reviewing ? "Results" : (S.mode === "flash" ? "Card " : "Question ") + (S.qi + 1) + " of " + S.set.length}</span>
    <button type="button" class="iconbtn" data-act="stats" aria-label="Stats and review list">${ICON.chart}</button>
    <button type="button" class="iconbtn" data-act="settings" aria-label="Settings">${ICON.gear}</button></div>`;

  if (!QS.length) {
    h += `<div class="sheet"><div class="stats"><p class="empty">${S.loadError ? "Couldn't load the questions. Check your connection and refresh the page." : "Loading questions…"}</p></div></div>`;
  } else if (PAGE) {
    h += PAGE();
  } else if (S.page === "stats") {
    h += statsPage();
  } else if (S.mode === "flash" && window.FLASH) {
    h += FLASH.card();
  } else if (S.results && !S.reviewing) {
    const correct = S.run.filter((r, i) => r.sel === QS[S.set[i]].ans).length;
    h += `<div class="sheet"><div class="results"><p class="eyebrow">Exam mode · finished</p><h2>Your results</h2>
      <div class="score"><div><b>${correct} / ${S.set.length}</b><span>correct</span></div><div><b>${fmt(S.finishedMs)}</b><span>total time</span></div></div>
      <p style="margin:0;font-size:14px;color:var(--muted)">Review any question to see the answer and rationale, or to report a problem.</p>
      <ol class="rlist">${S.set.map((qx, i) => { const q = QS[qx], r = S.run[i], ok = r.sel === q.ans; return `<li><span class="mark ${ok ? "ok" : "no"}" aria-label="${ok ? "Correct" : "Incorrect"}">${ok ? ICON.ok : ICON.no}</span>
        <span class="info"><b>${q.id}</b>Your answer ${r.sel} · Correct ${q.ans}${RL[q.id] ? `<br><span class="badge">On review list</span>` : ""}</span><button type="button" class="btn grey" data-act="review" data-i="${i}">Review</button></li>`; }).join("")}</ol>
      <button type="button" class="btn" data-act="restart">Start a new exam</button></div></div>`;
  } else {
    const q = Q(), c = cur(), rev = revealed();
    const correct = rev && c.sel === q.ans;
    h += `<div class="sheet"><div class="sheethead"><div class="grab"></div><div class="meta"><div><span class="qid">${q.id}</span>${q.status === "draft" ? `<span class="draft">Draft</span>` : ""}<span class="sec">${esc(q.section)}</span></div>
      <div style="display:flex;align-items:center"><div class="prog" aria-hidden="true"><i style="width:${Math.round((S.qi + 1) / S.set.length * 100)}%"></i></div><button type="button" class="whybtn" data-act="intro">${ICON.info}<span>How it works</span></button></div></div></div>`;
    if (S.qi === 0 && !c.done && !S.reviewing) { const [ready, txt] = guideText(); h += `<p class="guide ${ready ? "ready" : ""}" aria-live="polite">${ready ? ICON.check : ICON.info}<span>${txt}</span></p>`; }
    h += `<div class="body"><div class="content" id="content"><p class="stem">${esc(q.stem)}</p>`;
    if (q.rows.length) h += `<dl class="vals">${q.rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>`;
    if (q.after) h += `<p class="stem">${esc(q.after)}</p>`;
    if (q.img) h += `<figure><button type="button" class="imgbtn" data-act="view" aria-label="Enlarge ${esc(q.cap.toLowerCase())}"><img src="${q.img}" alt="${esc(q.alt)}"><span class="ex" aria-hidden="true">${ICON.expand}</span></button><figcaption>${esc(q.cap.toUpperCase())} · TAP TO ENLARGE</figcaption></figure>`;
    h += `<ol class="opts">${L4.map((l, i) => {
      let cls = "", tag = "";
      if (!rev) cls = c.out[l] ? "out" : (c.sel === l ? "sel" : "");
      else if (l === q.ans) { cls = "ok"; tag = l === c.sel ? "Your answer · Correct" : "Correct answer"; }
      else if (l === c.sel) { cls = "no"; tag = "Your answer"; }
      else cls = "dim";
      const locked = c.done;
      return `<li class="opt ${cls}"><button type="button" class="pick" data-act="pick" data-l="${l}" ${locked ? "disabled" : ""} aria-pressed="${c.sel === l}"><span class="l">${l}.</span><span><span class="t">${esc(q.opts[i])}</span>${tag ? `<span class="tag">${tag}</span>` : ""}</span></button>${locked ? "" :
        `<button type="button" class="strike" data-act="strike" data-l="${l}" aria-label="${c.out[l] ? "Restore choice " + l : "Rule out choice " + l}" aria-pressed="${!!c.out[l]}">${c.out[l] ? ICON.restore : ICON.ruleout}</button>`}</li>`;
    }).join("")}</ol>`;
    if (rev) h += `<div class="result" id="result" tabindex="-1"><h3 class="${correct ? "ok" : "no"}">${correct ? ICON.check + "Correct" : "Not quite. The answer is " + q.ans + "."}</h3><p>${esc(q.why)}</p></div>${scaleButtons(q, c)}${window.VET_MODE ? vetBox(q, c) : reviewBox(q, c)}`;
    else if (c.done && exam) h += `<p style="margin:0;font-size:14px;color:var(--muted)">Answer saved.</p>`;
    h += `</div><nav class="ribbon" aria-label="Answer choices">${calcButton()}${window.VET_MODE ? "" : `<button type="button" class="ns ${c.unsure ? "on" : ""}" data-act="unsure" ${c.done ? "disabled" : ""} aria-pressed="${c.unsure}" aria-label="Not sure. Adds this question to your review list">${ICON.unsure}<span>Not<br>sure</span></button>`}<div class="spacer"></div>${L4.map((l) => {
        let cls;
        if (!rev) cls = c.out[l] ? "out" : (c.sel === l ? "sel" : "");
        else cls = l === q.ans ? "ok" : l === c.sel ? "no" : "dim";
        return `<button type="button" class="rb ${cls}" data-act="pick" data-l="${l}" ${c.done ? "disabled" : ""} aria-pressed="${c.sel === l}" aria-label="Choose ${l}${c.out[l] ? " (ruled out; tap to restore)" : ""}">${l}</button>`;
      }).join("")}<button type="button" class="final" data-act="final" ${canSubmit() ? "" : "disabled"} aria-label="Submit final answer">${ICON.check}<span>${exam ? "Submit" : "Final"}</span></button></nav></div>`;
    if (rev) {
      h += `<div class="foot">${window.VET_MODE ? "" : `<button type="button" class="btn line" data-act="fb">${ICON.flag}<span>${S.reported[q.id] ? "Reported" : "Report a problem"}</span></button>`}<div class="spacer"></div>
        ${S.reviewing ? `<button type="button" class="btn" data-act="backresults">Back to results</button>` : window.VET_MODE ? vetFootBtn(q) : `<button type="button" class="btn" data-act="next">${S.qi === S.set.length - 1 ? "Start over" : "Next question"}</button>`}</div>`;
    }
    h += `</div>`;
  }

  if (S.fb === "open") {
    const q = Q();
    h += `<div class="scrim"><div class="dialog" role="dialog" aria-modal="true" aria-labelledby="fbt">
      <div><h2 id="fbt">Report a problem</h2><p class="sub">${q.id} · Your answer: ${cur().sel} · Keyed answer: ${q.ans}</p></div>
      <fieldset><legend>What's wrong with this question?</legend>${REASONS.map((r, i) => `<button type="button" class="reason" data-act="reason" data-i="${i}" aria-pressed="${S.reason === i}"><i aria-hidden="true"></i><span>${r}</span></button>`).join("")}</fieldset>
      <div style="display:flex;flex-direction:column;gap:6px"><label for="fbWhy">Tell us why (optional)</label><textarea id="fbWhy" rows="3" placeholder="For example: the PaCO2 is outside Winter's range, so compensation isn't appropriate."></textarea></div>
      <div class="row"><button type="button" class="btn grey" data-act="fbclose">Cancel</button><button type="button" class="btn" data-act="send" ${S.reason === null ? "disabled" : ""}>Send report</button></div></div></div>`;
  } else if (S.fb === "sent") {
    h += `<div class="scrim"><div class="dialog" role="dialog" aria-modal="true" aria-labelledby="fbt">${ICON.sent}<h2 id="fbt">Report sent</h2>
      <p style="margin:0;font-size:15px;line-height:1.5">Thanks. A reviewer will check ${Q().id} for "${REASONS[S.reason].toLowerCase()}". If the question, answer, or both change, you'll get a note in Messages.</p>
      <button type="button" class="btn" data-act="fbclose" style="align-self:flex-start;padding:0 24px">Done</button></div></div>`;
  }

  if (S.settings) {
    h += `<div class="scrim"><div class="dialog" role="dialog" aria-modal="true" aria-labelledby="setT"><h2 id="setT">Settings</h2>
      <fieldset><legend>Practice mode</legend>
        <button type="button" class="reason" data-act="mode" data-m="study" aria-pressed="${S.mode === "study"}"><i aria-hidden="true"></i><span>Study mode<small>See the answer and rationale after each question.</small></span></button>
        <button type="button" class="reason" data-act="mode" data-m="exam" aria-pressed="${S.mode === "exam"}"><i aria-hidden="true"></i><span>Exam mode<small>Timed. Answers and rationales appear only at the end, like the real test.</small></span></button>
        <button type="button" class="reason" data-act="mode" data-m="flash" aria-pressed="${S.mode === "flash"}"><i aria-hidden="true"></i><span>Flashcards<small>See only the question, think of the answer, then flip the card and rate yourself.</small></span></button>
      </fieldset>
      <label class="switch" for="reqOut"><input type="checkbox" id="reqOut" data-act="reqout" ${S.requireOut ? "checked" : ""}><span>Require ruling out before submitting<small>Final stays locked until you've ruled out the other three choices.</small></span></label>
      <p style="margin:0;font-size:13px;color:var(--muted)">Changing the mode starts a new set of questions.</p>
      ${window.viewSettings ? window.viewSettings() : ""}
      ${(window.SETTINGS_EXTRA || []).map((f) => f()).join("")}
      <div class="row"><button type="button" class="btn grey" data-act="intro">How this app works</button><button type="button" class="btn" data-act="setclose">Done</button></div></div></div>`;
  }

  if (S.intro && !PAGE && S.page === "quiz") {   // "How it works" appears the first time someone opens the questions, not over Home
    h += `<div class="scrim intro"><div class="dialog" role="dialog" aria-modal="true" aria-labelledby="introT">
      <p class="eyebrow">How this app works</p>
      <h2 id="introT">Choose your answer, or rule out the wrong ones first</h2>
      <p style="margin:0;font-size:15px;line-height:1.45;color:#24313E">Tap a letter or an answer to choose it, then tap Final. If you're unsure, tap ${ICON.ro} beside a choice to gray it out, or tap <b>Not sure</b> to save the question to your review list. Here's why ruling out helps.</p>
      <ul>
        <li><span class="num">1</span><span><b>Thinking about wrong answers helps you remember more.</b> When practice questions have believable wrong answers, working out why they're wrong helps you retain related facts, not just the one being tested. <span class="cite">(Little &amp; Bjork, 2015)</span></span></li>
        <li><span class="num">2</span><span><b>It shows what you partly know.</b> Ruling out even one choice reflects real knowledge. Students tested this way guessed less and reported feeling less stressed than with single-answer questions. <span class="cite">(Bond et al., 2013; Vanderoost et al., 2018)</span></span></li>
        <li><span class="num">3</span><span><b>Use it when it helps.</b> Ruling out takes extra effort, and the real exam only asks for one best answer, so it's optional. Turn on "Require ruling out" in Settings if you want the practice.</span></li>
      </ul>
      <p class="tip"><b>Tip:</b> Read the question and predict the answer before you look at the choices. Then check the other choices and ask why each one is wrong.</p>
      <details><summary>Sources</summary><ol>
        <li>Little JL, Bjork EL. Optimizing multiple-choice tests as tools for learning. <i>Memory &amp; Cognition</i>. 2015;43(1):14-26. <a href="https://doi.org/10.3758/s13421-014-0452-8" target="_blank" rel="noopener">doi:10.3758/s13421-014-0452-8</a></li>
        <li>Bond AE, et al. Negatively-marked MCQ assessments that reward partial knowledge do not introduce gender bias yet increase student performance and satisfaction and reduce anxiety. <i>PLoS ONE</i>. 2013;8(2):e55956. <a href="https://doi.org/10.1371/journal.pone.0055956" target="_blank" rel="noopener">doi:10.1371/journal.pone.0055956</a></li>
        <li>Vanderoost J, et al. Elimination testing with adapted scoring reduces guessing and anxiety in multiple-choice assessments, but does not increase grade average in comparison with negative marking. <i>PLoS ONE</i>. 2018. <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC6168139" target="_blank" rel="noopener">PMC6168139</a></li>
        <li>Newton PM, et al. Negatively marked elimination-format multiple-choice questions are associated with high cognitive load and poor student experience compared to single best answer. <i>Medical Science Educator</i>. 2025;35(3):1411-1422. <a href="https://doi.org/10.1007/s40670-025-02318-7" target="_blank" rel="noopener">doi:10.1007/s40670-025-02318-7</a></li>
      </ol></details>
      <button type="button" class="btn" data-act="introclose" style="width:100%">Start practicing</button>
    </div></div>`;
  }
  if (QS.length && S.page === "quiz" && (!S.results || S.reviewing)) h += calcPanel();
  if (S.scale) h += scaleSheet();
  if (S.askSet && typeof askSheet === "function") h += askSheet();
  h += `<div id="viewer-root"></div>`;
  phone.innerHTML = h;
  const c2 = document.getElementById("content"); if (c2) c2.scrollTop = S.toTop ? 0 : scroll; S.toTop = false;
  if (S.resRestore != null) {   // back from reviewing: same spot in the results list, with the reviewed one highlighted
    const rs = document.querySelector(".results"), li = rs && rs.querySelectorAll(".rlist li")[S.resRestore];
    if (rs) rs.scrollTop = S.resScroll || 0; if (li) { li.classList.add("flash"); setTimeout(() => li.classList.remove("flash"), 1600); }
    S.resRestore = null;
  }
  const d = document.getElementById("fbWhy"); if (d) d.value = draftVal;
  renderViewer();
  calcAfterRender();
}

function reviewBox(q, c) {
  const on = !!RL[q.id];
  const note = c.note;
  let cls = on ? "on" : "", st, p, btn;
  if (note === "added-missed") { st = "Added to your review list"; p = "You'll see this question again. Answer it correctly without tapping Not sure two times in a row to clear it."; }
  else if (note === "added-unsure") { st = "Added to your review list"; p = "You marked this one Not sure, so it stays in your practice rotation until you're confident."; }
  else if (note === "progress") { st = "Still on your review list (1 of 2)"; p = "Correct and confident. One more confident correct answer clears it."; }
  else if (note === "cleared") { cls = "clear"; st = "Cleared from your review list"; p = "Two confident correct answers in a row. Nice work."; }
  else if (note === "manual-add") { st = "Added to your review list"; p = "It will stay until you clear it with two confident correct answers, or remove it."; }
  else if (note === "manual-remove") { st = "Removed from your review list"; p = "You can add it back anytime."; }
  else { st = on ? "On your review list" : "Not on your review list"; p = on ? (REASON_TXT[RL[q.id].reason] + ".") : "Add it if you'd like to see it again."; }
  btn = on ? `<button type="button" class="btn grey small" data-act="rlremove">Remove from review list</button>`
           : `<button type="button" class="btn grey small" data-act="rladd">${ICON.bookmark} Keep on my review list</button>`;
  return `<div class="rl ${cls}" aria-live="polite"><span class="st">${cls === "clear" ? ICON.ok : ICON.bookmark}${st}</span><p>${p}</p>${btn}</div>`;
}

function renderViewer() {
  const root = document.getElementById("viewer-root");
  if (!root) return;
  if (!S.view) { root.innerHTML = ""; return; }
  const phone = document.getElementById("phone");
  const q = Q();
  const iw = q.w, ih = q.h;
  const aspect = iw / ih;
  const availW = phone.clientWidth - 24, availH = phone.clientHeight - 64 - 52 - 24;
  const base = S.rot ? Math.min(availH, availW * aspect) : Math.min(availW, availH * aspect);
  const W = Math.round(base * S.zoom), H = Math.round(W / aspect);
  const zi = ZOOMS.indexOf(S.zoom);
  const box = S.rot ? `width:${H}px;height:${W}px` : `width:${W}px;height:${H}px`;
  const img = S.rot ? `position:absolute;left:0;top:0;width:${W}px;height:${H}px;transform-origin:0 0;transform:translate(${H}px,0) rotate(90deg)` : `display:block;width:${W}px;height:${H}px`;
  const hint = S.zoom === 1 ? (S.rot ? "Turn your phone sideways to read it. Zoom in for detail." : "Zoom in for detail, then drag or swipe to move around.") : "Drag or swipe to move around the image.";
  root.innerHTML = `<div class="viewer" role="dialog" aria-modal="true" aria-label="${esc(q.cap)}${S.viewEv ? " with evidence circled" : ""}, enlarged">
    <div class="vbar"><button type="button" class="vb" data-act="vclose" aria-label="Close image">${ICON.x}</button><span class="ttl"></span>
    <button type="button" class="vb" data-act="zout" aria-label="Zoom out" ${zi === 0 ? "disabled" : ""}>${ICON.minus}</button><span class="zl" aria-live="polite">${S.zoom === 1 ? "Fit" : S.zoom + "×"}</span>
    <button type="button" class="vb" data-act="zin" aria-label="Zoom in" ${zi === ZOOMS.length - 1 ? "disabled" : ""}>${ICON.plus}</button>
    <button type="button" class="vb" data-act="rot" aria-pressed="${S.rot}" aria-label="Rotate image">${ICON.rotate}<span>Rotate</span></button></div>
    <div class="vscroll" id="vscroll"><div class="vbox" style="${box}">${S.viewEv && q.ev
      ? `<div class="evwrap" style="${img}"><img src="${S.view}" alt="${esc(q.alt)}" style="width:100%;height:100%" draggable="false">${evOverlay(q)}</div>`
      : `<img src="${S.view}" alt="${esc(q.alt)}" style="${img}" draggable="false">`}</div></div>
    <p class="vhint">${hint}</p></div>`;
}

let drag = null;
document.addEventListener("pointerdown", (e) => {
  const v = e.target.closest("#vscroll");
  if (!v || e.pointerType !== "mouse") return;
  drag = { el: v, x: e.clientX, y: e.clientY, l: v.scrollLeft, t: v.scrollTop }; v.style.cursor = "grabbing";
});
window.addEventListener("pointermove", (e) => { if (!drag) return; drag.el.scrollLeft = drag.l - (e.clientX - drag.x); drag.el.scrollTop = drag.t - (e.clientY - drag.y); });
window.addEventListener("pointerup", () => { if (drag) drag.el.style.cursor = "grab"; drag = null; });

function scrollToResult() {
  const box = document.getElementById("content"), r = document.getElementById("result");
  if (!box || !r) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const top = r.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - 12;
  requestAnimationFrame(() => {
    box.scrollTo({ top: Math.max(0, top), behavior: reduce ? "auto" : "smooth" });
    r.classList.add("flash");
    r.focus({ preventScroll: true });
  });
}

function newRun() { if (window.FLASH) FLASH.reset(); S.qi = 0; S.run = freshRun(S.set); S.results = false; S.reviewing = false; S.started = Date.now(); S.finishedMs = 0; S.fb = null; S.reason = null; }

document.addEventListener("change", (e) => {
  if (e.target.dataset && e.target.dataset.act === "reqout") { S.requireOut = e.target.checked; render(); }
});
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-act]");
  if (!b || b.disabled || b.dataset.act === "reqout") return;
  if (!QS.length) return;
  const a = b.dataset.act, c = S.run[S.qi];
  if (window.PAGE_ACTIONS && window.PAGE_ACTIONS[a]) { if (window.PAGE_ACTIONS[a](b) === false) return; }
  else if (STATS_ACTIONS[a]) { if (STATS_ACTIONS[a](b) === false) return; }
  else if (a === "pick") {
    const l = b.dataset.l; if (c.done) return;
    if (c.out[l]) { c.out[l] = false; }          // tapping a ruled-out choice restores it
    else c.sel = c.sel === l ? null : l;
  }
  else if (a === "strike") {
    const l = b.dataset.l; if (c.done) return;
    c.out[l] = !c.out[l];
    if (c.out[l] && c.sel === l) c.sel = null;
    const left = L4.filter((x) => !c.out[x]);
    if (left.length === 1 && !c.sel) c.sel = left[0];   // last one standing becomes the selection
  }
  else if (a === "final") {
    if (!canSubmit()) return;
    c.done = true;
    recordAnswer(Q(), c);
    if (S.mode === "exam") {
      if (S.qi < S.set.length - 1) { S.qi += 1; const ct = document.getElementById("content"); if (ct) ct.scrollTop = 0; }
      else { S.results = true; S.finishedMs = Date.now() - S.started; }
    }
  }
  else if (a === "next") { S.scale = null; if (S.qi === S.set.length - 1) newRun(); else S.qi += 1; const ct = document.getElementById("content"); if (ct) ct.scrollTop = 0; S.fb = null; S.reason = null; }
  else if (a === "review") { S.resScroll = (document.querySelector(".results") || {}).scrollTop || 0; S.qi = Number(b.dataset.i); S.reviewing = true; S.toTop = true; }   // open at the question, remember the list spot
  else if (a === "backresults") { S.reviewing = false; S.fb = null; S.resRestore = S.qi; }
  else if (a === "restart") newRun();
  else if (a === "fb") { S.fb = "open"; S.reason = null; }
  else if (a === "fbclose") { S.fb = null; }
  else if (a === "reason") { S.reason = Number(b.dataset.i); }
  else if (a === "send") { if (S.reason === null) return; S.fb = "sent"; S.reported[Q().id] = true; }
  else if (a === "settings") { S.settings = true; }
  else if (a === "unsure") { if (!c.done) c.unsure = !c.unsure; }
  else if (a === "rladd") { RL[Q().id] = { reason: "manual", streak: 0, added: Date.now() }; save("rtReviewList", RL); c.note = "manual-add"; }
  else if (a === "rlremove") { delete RL[Q().id]; save("rtReviewList", RL); c.note = "manual-remove"; }
  else if (a === "setclose") { S.settings = false; }
  else if (a === "mode") { if (S.mode !== b.dataset.m) { S.mode = b.dataset.m; S.build.mode = S.mode; newRun(); } }
  else if (a === "intro") { S.intro = true; S.settings = false; }
  else if (a === "introclose") { S.intro = false; markIntro(); }
  else if (a === "view") { S.view = Q().img; S.viewEv = false; S.zoom = 1; S.rot = true; }
  else if (a === "evview") { S.view = Q().img; S.viewEv = true; S.zoom = 1; S.rot = true; }
  else if (a === "vclose") { S.view = null; S.viewEv = false; }
  else if (a === "scale") { S.scale = b.dataset.k; }
  else if (a === "scaleclose") { S.scale = null; }
  else if (a === "zin") { const i = ZOOMS.indexOf(S.zoom); if (i < ZOOMS.length - 1) S.zoom = ZOOMS[i + 1]; }
  else if (a === "zout") { const i = ZOOMS.indexOf(S.zoom); if (i > 0) S.zoom = ZOOMS[i - 1]; }
  else if (a === "rot") { S.rot = !S.rot; S.zoom = 1; }
  render();
  if (a === "final" && S.mode === "study") scrollToResult();
  if (a === "view" || a === "evview" || a === "rot") { const v = document.querySelector('.viewer [data-act="vclose"]'); if (v) v.focus(); }
});
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (S.view) { S.view = null; S.viewEv = false; } else if (S.askSet) S.askSet = false; else if (S.scale) S.scale = null; else if (S.fb) S.fb = null; else if (S.settings) S.settings = false; else if (S.intro) { S.intro = false; markIntro(); } else return;
  render();
});

setInterval(() => { if (S.mode === "exam" && !S.results) { const t = document.getElementById("timer"); if (t) t.textContent = fmt(Date.now() - S.started); } }, 1000);

const holder = document.getElementById("holder");
function fit() {
  if (window.viewFit && window.viewFit()) return;   // views.js: phone, tablet and desktop layouts
  const phone = document.getElementById("phone");
  if (window.innerWidth <= 500) { phone.style.transform = ""; holder.style.width = ""; holder.style.height = ""; return; }
  const s = Math.min(1, (window.innerHeight - 110) / 860, (window.innerWidth - 32) / 406);
  phone.style.transform = `scale(${s})`;
  holder.style.width = Math.round(406 * s) + "px";
  holder.style.height = Math.round(860 * s) + "px";
}
window.addEventListener("resize", () => { fit(); if (S.view) renderViewer(); });
fit();
render();
(window.EMBEDDED_QUESTIONS ? Promise.resolve(window.EMBEDDED_QUESTIONS) : fetch("data/questions.json", { cache: "no-cache" })
  .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }))
  .then((d) => { QS = d.questions.map(adapt); ALL = QS.map((_, i) => i); S.set = ALL.slice(); newRun(); (window.AFTER_LOAD || []).forEach((f) => f()); render(); if (window.vetAfterLoad) vetAfterLoad(); })
  .catch((e) => { S.loadError = String(e); render(); });
