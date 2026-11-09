/* Coach touches. Owner: Ken + Claude (Nov 6, 2026). Small, warm, true messages that make a learner feel noticed:
   1. Effort: a "this week" line on Home, and "Welcome back" after a week or more away.
   2. "I got it" moments: a line under the answer when a previously missed question is now right, and a count
      when a question clears from the review list.
   3. Milestones: a short toast the first time someone reaches 25 / 50 / 100 / 150 questions, every question tried,
      80% in an area, and their 1st / 5th practice exam. Each one shows once.
   Guardrails: never guilt, never empty praise, never in the middle of a timed exam, never blocks studying.
   Stats demo: nothing is saved; milestones already passed in the demo data are treated as seen.
   Load after exams.js and before app.js; wraps recordAnswer() and render() at DOMContentLoaded. */
(function () {
  if (window.VET_MODE) return;
  const DEMO = !!window.DEMO_ON;
  const SEEN = DEMO ? {} : load("coachSeen", {});
  const saveSeen = () => { if (!DEMO) save("coachSeen", SEEN); };
  let cleared = DEMO ? 0 : load("rlCleared", 0), gotItShown = 0;
  const GOTIT = ["You got this one right this time. Last time it tripped you up.", "Nice, you've got it now. This one used to get you.",
    "Right this time. That's exactly what practice is for.", "This one beat you before. Not this time."];
  const day = (d) => d.toISOString().slice(0, 10);
  // Learners can turn the coach off in Settings ("Coach tips"). Remembered on this device; applies to every coach message.
  const OFF = () => !!load("coachOff", false);
  window.COACH_OFF = OFF;

  // ---- 1. Welcome back (real mode only; computed once per visit)
  let welcome = "";
  if (!DEMO) {
    const last = load("lastSeen", null), today = day(new Date());
    if (last && last !== today) { const gap = Math.round((new Date(today) - new Date(last)) / 86400000); if (gap >= 7 && Object.keys(ST).length) welcome = `Welcome back. It's been ${gap} days, and everything you've done so far is right where you left it.`; }
    save("lastSeen", today);
  }
  function weekLine() {
    const log = load("dayLog", {}), now = new Date(); let n = 0;
    for (let k = 0; k < 7; k++) { const d = new Date(now); d.setDate(now.getDate() - k); n += log[day(d)] || 0; }
    if (welcome) return welcome;
    if (n >= 50) return `${n} questions this week. You're putting in real work, and it shows.`;
    if (n >= 20) return `${n} questions this week. Steady practice like this is what gets people ready.`;
    if (n > 0) return `${n} question${n === 1 ? "" : "s"} this week. Every one counts.`;
    return "";
  }

  // ---- 3. Milestones
  const tried = () => Object.keys(ST).length;
  function checkMilestones() {
    const out = [], n = tried(), total = QS.length;
    const M = [[25, "25 questions done. You've started building a real base."], [50, "50 questions! That's real momentum."],
      [100, "100 questions. Most of preparing is showing up, and you're doing it."], [150, "150 questions. You've seen most of the bank now."]];
    for (const [t, msg] of M) if (n >= t && total >= t && !SEEN["q" + t]) out.push(["q" + t, msg]);
    if (total >= 20 && n >= total && !SEEN.all) out.push(["all", "You've tried every question in the bank. That takes real commitment."]);
    if (typeof sectionRows === "function") for (const r of sectionRows()) {
      if (r.att >= 5 && r.cor / r.att >= 0.8 && !SEEN["a80:" + r.sec]) out.push(["a80:" + r.sec, `You just reached ${Math.round(r.cor / r.att * 100)}% in ${r.name || r.sec}. That's strong.`]);
    }
    if (!DEMO) { const ex = load("examLog", []).length;
      if (ex >= 1 && !SEEN.ex1) out.push(["ex1", "Your first practice exam is done. The first one is the hardest to start."]);
      if (ex >= 5 && !SEEN.ex5) out.push(["ex5", "Five practice exams finished. The real thing is starting to feel familiar."]); }
    return out.filter(([k]) => !TQ.some((x) => x[0] === k));
  }
  // demo: treat milestones already passed as seen, so only new ones pop
  const primeDemo = () => { if (DEMO) { for (const [k] of checkMilestones()) SEEN[k] = 1; } };

  // Coach identity: a friendly otter, speaking as "your coach" (rule-based messages, so it never claims to be AI)
  const AV = `<span class="coachav" aria-hidden="true">🦦</span>`;
  const said = (txt) => `${AV}<span><b class="coachby">Your coach</b>${esc(txt)}</span>`;
  // ---- toast (one at a time, polite, tap to dismiss, never during a timed exam)
  const TQ = []; let showing = false, shownThisVisit = 0;   // at most 2 pop-ups per visit; the rest wait for a later visit   // toast queue (named TQ so it never hides the app's Q())
  let curToast = null, closedRef = null;
  function toast() {
    if (OFF()) { if (curToast) { curToast.remove(); curToast = null; } showing = false; return; }
    const inExam = S.mode === "exam" && !S.results && S.page === "quiz";
    if (curToast && inExam) { curToast.remove(); curToast = null; showing = false; }   // never over a timed exam
    if (curToast && !curToast.isConnected) { const ph = document.getElementById("phone"); if (ph) ph.appendChild(curToast); }   // a redraw wiped it: put it back
    if (showing || !TQ.length || shownThisVisit >= 2) return;
    if (S.mode === "exam" && !S.results && S.page === "quiz") return;   // wait until the exam is over
    if (document.querySelector("#fwbox, .scrim, .viewer")) return;   // wait while a pop-up, chart sheet or image is open
    const ph = document.getElementById("phone"); if (!ph) return;
    showing = true; const t = document.createElement("div"); t.className = "coachtoast"; t.setAttribute("role", "status");
    const [key, txt] = TQ.shift(); SEEN[key] = 1; saveSeen(); shownThisVisit++; t.innerHTML = said(txt);
    let closed = false;
    const done = () => { if (closed) return; closed = true; t.classList.add("out"); setTimeout(() => { t.remove(); curToast = null; showing = false; toast(); }, 250); };
    curToast = t;
    t.addEventListener("click", done); ph.appendChild(t); setTimeout(done, 5200);
  }
  // If a pop-up, chart sheet or image opens while a tip is showing, let the tip go instead of coming back afterwards.
  document.addEventListener("click", () => setTimeout(() => { if (curToast && document.querySelector("#fwbox, .scrim, .viewer")) curToast.click(); }, 0), true);

  const css = document.createElement("style");
  css.textContent = `.coachline { margin: 0; padding: 10px 12px; border-radius: 12px; background: #E3F4EA; color: #17603C; font-size: 14px; font-weight: 600; line-height: 1.4; display: flex; gap: 10px; align-items: flex-start; }
.coachav { flex-shrink: 0; width: 32px; height: 32px; border-radius: 16px; background: #FFF3D1; box-shadow: inset 0 0 0 2px #E8B13A; display: flex; align-items: center; justify-content: center; font-size: 19px; line-height: 1; }
.coachby { display: block; font-size: 11px; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; opacity: .75; margin-bottom: 1px; }
.coachline.fb { background: #F3F5F7; color: #24313E; font-weight: 500; }
.coachfb { min-height: 44px; border-radius: 10px; border: 2px solid #3A4654; background: #fff; color: #3A4654; font: inherit; font-weight: 700; cursor: pointer; }
.cssec { display: flex; flex-direction: column; gap: 6px; } .cssec h3 { margin: 0; font-size: 15px; } .cshint { margin: 0; font-size: 13px; color: #3A4654; line-height: 1.45; }
.cslist { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.cslist li { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border: 1.5px solid #DDE3E8; border-radius: 12px; font-size: 13px; }
.cslist li > span:first-child { flex: 1; } .cslist b { display: block; font-size: 14px; } .cslist small { display: block; color: #8A5A00; font-weight: 700; }
.csrep { min-height: 38px; padding: 0 10px; border-radius: 9px; border: 1.5px solid #3A4654; background: #fff; color: #3A4654; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
.csdone { font-size: 13px; font-weight: 700; color: #17603C; } .csrow { display: flex; gap: 8px; } .csrow .btn { flex: 1; }
.rlist li.flash { box-shadow: 0 0 0 3px #8CC4FF; transition: box-shadow .4s; }
.coachweek { margin: 0; padding: 10px 12px; border-radius: 12px; background: #F3F5F7; color: #24313E; font-size: 14px; line-height: 1.4; display: flex; gap: 10px; align-items: flex-start; }
.coachtoast { position: absolute; left: 12px; right: 12px; top: 64px; z-index: 12; display: flex; gap: 10px; align-items: flex-start; padding: 12px 14px; border-radius: 14px;
  background: #24313E; color: #fff; font-size: 14px; font-weight: 600; line-height: 1.4; box-shadow: 0 8px 24px rgba(18,32,46,.3); cursor: pointer; animation: ctin .25s ease-out; }
.phone:has(#fwbox, .scrim, .viewer) .coachtoast { display: none; }   /* never on top of a pop-up or chart sheet */
.coachtoast.out { opacity: 0; transform: translateY(-6px); transition: opacity .25s, transform .25s; }
@keyframes ctin { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .coachtoast { animation: none; } .coachtoast.out { transition: none; } }`;
  document.head.appendChild(css);

  // Settings switch: "Coach tips" on or off
  (window.SETTINGS_EXTRA = window.SETTINGS_EXTRA || []).push(() => `<label class="switch" for="coachOn"><input type="checkbox" id="coachOn" ${OFF() ? "" : "checked"}><span>Coach tips<small>Short notes from the coach: encouragement, milestones, and suggestions when you build a practice set.</small></span></label>`);
  document.addEventListener("change", (e) => { if (e.target && e.target.id === "coachOn") { save("coachOff", !e.target.checked); render(); } });

  // ---- End-of-session summary. Study mode used to loop back to question 1; now the last "Next" shows this.
  let DONE = false;   // study summary showing
  const missedMulti = () => S.set.map((ix, i) => ({ i, q: QS[ix] })).filter(({ q }) => ST[q.id] && ST[q.id].attempts - ST[q.id].correct >= 2);
  function repeatList() {
    const L = missedMulti(); if (!L.length) return "";
    if (!SEEN.tipReport) { SEEN.tipReport = S.started; saveSeen(); }   // the full tip shows during the first session it appears in, then a short line
    const tipOnce = SEEN.tipReport === S.started;
    return `<section class="cssec"><h3>Missed more than once</h3>
      <p class="cshint">${tipOnce ? "These keep tripping you up. Often that just means more practice, but if a question or its answer seems unclear, unfair or wrong, tell us with <b>Report a problem</b>. We read every report and fix what's wrong." : "If one of these seems unclear or wrong, report it and we'll take a look."}</p>
      <ul class="cslist">${L.map(({ i, q }) => `<li><span><b>${esc(q.id)}</b>${esc(q.topic || q.secName || "")}<small>Missed ${ST[q.id].attempts - ST[q.id].correct} times</small></span>
        ${S.reported[q.id] ? `<span class="csdone">Reported ✓</span>` : `<button type="button" class="csrep" data-act="coachrep" data-i="${i}">Report a problem</button>`}</li>`).join("")}</ul></section>`;
  }
  function studySummary() {
    const n = S.set.length, right = S.run.filter((r, i) => r.done && r.sel === QS[S.set[i]].ans).length, missed = S.set.map((ix, i) => i).filter((i) => S.run[i].done && S.run[i].sel !== QS[S.set[i]].ans);
    const p = n ? Math.round(right / n * 100) : 0;
    const V = p >= 90 ? ["Excellent session. You clearly know this material.", "That was sharp. You're in great shape on these."]
      : p >= 70 ? ["A solid session. A little more on the ones you missed and you've got them.", "Good work. You're close on the ones you missed."]
      : p >= 50 ? ["Good effort. The ones you missed are on your review list, so they'll come back around.", "Steady work. Your review list will bring the misses back so they stick."]
      : ["A tough set, and that's okay. Missed questions are where the learning happens, and they're on your review list.", "Hard ones today. That's how you find what to work on, and your review list has them saved."];
    const msg = `${right} of ${n}. ${V[S.started % V.length]}`;
    return `<div class="sheet"><div class="results csum"><p class="eyebrow">Study mode · session done</p><h2>Nice work</h2>
      <div class="score"><div><b>${right} / ${n}</b><span>correct</span></div><div><b>${p}%</b><span>this session</span></div></div>
      ${OFF() ? "" : `<div class="coachline">${said(msg)}</div>`}
      ${missed.length ? `<section class="cssec"><h3>Missed this time</h3><p class="cshint">${missed.map((i) => esc(QS[S.set[i]].id)).join(", ")}. Review any of them below, or practice just these again.</p>
        <div class="csrow"><button type="button" class="btn" data-act="coachagain">Practice these ${missed.length} again</button></div></section>` : ""}
      ${repeatList()}
      <ol class="rlist">${S.set.map((qx, i) => { const q = QS[qx], r = S.run[i], ok = r.done && r.sel === q.ans; return `<li><span class="mark ${ok ? "ok" : "no"}" aria-label="${ok ? "Correct" : "Incorrect"}">${ok ? ICON.ok : ICON.no}</span>
        <span class="info"><b>${q.id}</b>${r.done ? `Your answer ${r.sel} · Correct ${q.ans}` : "Not answered"}</span><button type="button" class="btn grey" data-act="coachrev" data-i="${i}">Review</button></li>`; }).join("")}</ol>
      <div class="csrow"><button type="button" class="btn grey" data-act="go" data-v="stats">See your progress</button><button type="button" class="btn" data-act="coachnew">Start a new set</button></div></div></div>`;
  }
  window.PAGE_ACTIONS = Object.assign(window.PAGE_ACTIONS || {}, {
    // same as the app's "next", except the last question of a study set opens the summary
    next: () => { S.scale = null; S.fb = null; S.reason = null;
      if (S.qi === S.set.length - 1) { if (S.mode === "study" && S.set.length > 1) { DONE = true; } else newRun(); }
      else S.qi += 1;
      const ct = document.getElementById("content"); if (ct) ct.scrollTop = 0; },
    coachrep: (b) => { S.qi = Number(b.dataset.i); S.fb = "open"; S.reason = null; },
    coachrev: (b) => { S.resScroll = (document.querySelector(".results") || {}).scrollTop || 0; S.qi = Number(b.dataset.i); DONE = false; S.reviewing = true; S.__fromSummary = true; S.toTop = true; },
    coachagain: () => { const set = S.set.filter((ix, i) => S.run[i].done && S.run[i].sel !== QS[ix].ans); DONE = false; S.set = set; newRun(); },
    coachnew: () => { DONE = false; newRun(); },
    backresults: () => { S.reviewing = false; S.fb = null; S.resRestore = S.qi; if (S.__fromSummary) { S.__fromSummary = false; DONE = true; S.__sumRestore = S.qi; } },
  });
  document.addEventListener("DOMContentLoaded", () => {
    // ---- 2. "I got it" moments, attached to the question just answered
    const rec = window.recordAnswer;
    window.recordAnswer = function (q, c) {
      const before = ST[q.id] ? ST[q.id].lastCorrect : null;
      const r = rec.apply(this, arguments);
      const ok = c.sel === q.ans;
      if (c.note === "cleared") { cleared++; if (!DEMO) save("rlCleared", cleared); c.coach = `Cleared! That's ${cleared} question${cleared === 1 ? "" : "s"} you've mastered from your review list.`; }
      else if (ok && before === false && gotItShown < 2) { c.coach = GOTIT[(gotItShown + Math.floor(Date.now() / 1024)) % GOTIT.length]; gotItShown++; }
      else if (!ok && ST[q.id] && ST[q.id].attempts - ST[q.id].correct >= 2 && !S.reported[q.id] && !SEEN["fb:" + q.id]) {   // missed 2+ times: maybe the question is the problem (said once per question)
        SEEN["fb:" + q.id] = 1; saveSeen();
        c.coach = `This one has tripped you up ${ST[q.id].attempts - ST[q.id].correct} times. That happens, and it's on your review list. If you think the question or the answer is unclear, unfair or wrong, please tell us. We read every report.`;
        c.coachFb = true;
      }
      TQ.push(...checkMilestones());
      return r;
    };
    const P = window.PAGES || {};
    if (P.home) { const h = P.home; P.home = function () { const out = h(), w = OFF() ? "" : weekLine();
      return w ? out.replace(/(<div class="obscroll">(?:<section class="obsec[^"]*">[\s\S]*?<\/section>)*)/, `$1<section class="obsec"><p class="coachweek">${said(w)}</p></section>`) : out; }; }
    const r0 = render;
    render = function () {
      if (DONE && (S.page !== "quiz" || S.mode !== "study")) DONE = false;
      r0();
      if (DONE && S.page === "quiz") { const sh = document.querySelector("#phone .sheet"); if (sh) { const back = S.__sumRestore; sh.outerHTML = studySummary();
        if (back != null) { const rs = document.querySelector(".results"), li = rs && rs.querySelectorAll(".rlist li")[back]; if (rs) rs.scrollTop = S.resScroll || 0; if (li) { li.classList.add("flash"); setTimeout(() => li.classList.remove("flash"), 1600); } S.__sumRestore = null; } } }
      if (S.page === "quiz" && !S.reviewing && !DONE && S.mode === "study" && S.qi === S.set.length - 1 && S.set.length > 1) {   // relabel the last "Start over"
        const nb = document.querySelector('.foot [data-act="next"]'); if (nb) nb.textContent = "See your summary"; }
      if (S.results && S.mode === "exam" && !S.reviewing) { const rl = document.querySelector(".results .rlist"); if (rl && !document.querySelector(".results .cssec")) rl.insertAdjacentHTML("beforebegin", repeatList()); }
      if (S.results && S.mode === "exam" && !DEMO) TQ.push(...checkMilestones());   // exam milestones: the exam is saved as its results appear
      const c = S.run && S.run[S.qi];
      if (c && c.coach && c.done && !OFF() && S.mode !== "exam" && S.page === "quiz" && !document.querySelector(".coachline")) {
        const at = document.querySelector(".rl") || document.querySelector(".opts");
        if (at) at.insertAdjacentHTML("afterend", `<div class="coachline ${c.coachFb ? "fb" : ""}" role="status">${said(c.coach)}</div>${c.coachFb && !S.reported[QS[S.set[S.qi]].id] ? `<button type="button" class="coachfb" data-act="fb">Report a problem with this question</button>` : ""}`);
      }
      toast();
    };
    (window.AFTER_LOAD = window.AFTER_LOAD || []).push(primeDemo);
    if (!DEMO) (window.AFTER_LOAD).push(() => { TQ.push(...checkMilestones()); });

    // ---- One-time "easier way" tips. Each watches for a clear pattern, shows once ever, and shares the 2-per-visit limit.
    const tip = (key, msg) => { const k = "tip:" + key; if (!SEEN[k] && !TQ.some((x) => x[0] === k)) TQ.push([k, msg]); };
    const bump = (k) => { SEEN["n:" + k] = (SEEN["n:" + k] || 0) + 1; saveSeen(); return SEEN["n:" + k]; };
    const A = window.PAGE_ACTIONS || {};
    // 1. Building by hand exactly what Suggested focus already offers
    const SA = typeof STATS_ACTIONS === "object" ? STATS_ACTIONS : {};   // the builder's Start button lives in stats.js
    if (SA.buildstart) { const bs = SA.buildstart; SA.buildstart = function (b) {
      const picked = Object.keys(S.build.secs || {}).filter((k) => S.build.secs[k]), sug = typeof sectionRows === "function" && window.__focusSuggest ? window.__focusSuggest() : [];
      if (S.build.focus === "task" && picked.length && picked.every((k) => sug.includes(k)) && bump("manualSug") >= 2)
        tip("practiceThis", "Shortcut: the Practice this button in Suggested focus starts a set from those areas in one tap.");
      return bs.apply(this, arguments); }; }
    // 2. Starting a new set while skipping the ones just missed
    if (A.coachnew) { const cn = A.coachnew; A.coachnew = function () {
      const missed = S.run.some((r, i) => r.done && r.sel !== QS[S.set[i]].ans);
      if (missed && bump("skipMissed") >= 2) tip("reviewList", "Your misses are saved for you. Review list on Home brings them back whenever you're ready, or tap Practice these again at the end of a set.");
      return cn.apply(this, arguments); }; }
    document.addEventListener("click", (e) => {
      const t = e.target.closest && e.target.closest('[data-act="go"], .fcharts, [data-act="democharts"]'); if (!t) return;
      // 3. Getting to the Progress page the long way (Home > Build a set) instead of the Progress tab
      if (t.dataset && t.dataset.act === "go" && t.dataset.v === "build" && !t.classList.contains("nb") && bump("homeBuild") >= 3)
        tip("progressTab", "Tip: the Progress tab at the bottom takes you straight to your scores and the set builder from any screen.");
      if (t.classList.contains("fcharts") || t.dataset.act === "democharts") { SEEN.chartsSeen = 1; saveSeen(); }
    }, true);
    const r1 = render, examSeen = {};
    render = function () {
      r1();
      // 4. Very short practice exams
      if (S.mode === "exam" && S.page === "quiz" && !S.results && S.qi === 0 && !examSeen[S.started]) {
        examSeen[S.started] = 1; if (S.set.length < 10 && bump("shortExam") >= 2) tip("examSize", "Practice exams feel most like the real thing with 25 or more questions. You can set the size in Build a set.");
      }
      // 5. Lots of practice but never opened the charts
      if (!SEEN.chartsSeen && Object.keys(ST).length >= 40 && S.page === "stats") tip("charts", "Have you seen your charts? Tap See your charts on this page to see your scores by area and where to focus.");
      toast();
    };
    // Redraw once now that Home and the question screen are wrapped. When the questions are built into the page
    // (private copies), the app's last draw happens before this point, so the coach's Home line would be missing.
    if (QS.length) render();
  });
})();
