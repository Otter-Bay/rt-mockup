/* Example stats ("demo mode"). Owner: Ken + Claude. Kept for showing the stats to the team, new members, reviewers and partners.
   Loads a 200-question outline (sections and topics only, no question wording or answers) plus pretend answers from
   js/demo/<app>.js, so the Progress page, Suggested focus, charts and home meter have something real to show.
   - How it starts: DEMO_DEFAULT below. A link with ?demo turns it on (?demo=0 turns it off), e.g. .../rt-mockup/cna/?demo
     The choice is remembered per app in this browser. The banner's "Use my own" / "Show example stats" buttons switch it too.
   - PLAN: after the team has seen it, set DEMO_DEFAULT = false so the normal link shows real answers, and share the ?demo link.
   - While on, nothing you answer is saved, and your own stats stay untouched in this browser.
   - Practice sets still use the 20 sample questions (the extra 180 exist only as stats).
   Load right after progress.js and js/demo/<app>.js. app.js calls window.AFTER_LOAD hooks once questions load. */
(function () {
  const D = window.DEMO_DATA; if (!D) return;
  const KEY = NS + "demoStats";
  const DEMO_DEFAULT = true;   // on while the team reviews; switch to false afterwards (see PLAN above)
  let on = DEMO_DEFAULT;
  try {
    const q = new URLSearchParams(location.search);
    if (q.has("demo")) localStorage.setItem(KEY, q.get("demo") === "0" ? "off" : "on");
    const v = localStorage.getItem(KEY); if (v) on = v === "on";
  } catch (e) {}
  window.DEMO_ON = on;
  const setOn = (v) => { try { localStorage.setItem(KEY, v ? "on" : "off"); } catch (e) {}
    const u = new URL(location.href); u.searchParams.delete("demo"); location.href = u.toString(); };   // drop ?demo so the switch sticks

  if (on) {
    // Don't save anything while showing example data.
    const realSave = save, realLoad = load;
    save = function (k, v) { if (k === "rtStats" || k === "rtReviewList" || k === "dayLog") return; realSave(k, v); };
    const day = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
    const log = {}; for (const [ago, n] of D.days) log[day(ago)] = n;
    load = function (k, d) { return k === "dayLog" ? Object.assign({}, log) : realLoad(k, d); };
    // Swap in the example answers (in memory only).
    for (const k in ST) delete ST[k];
    for (const k in RL) delete RL[k];
    for (const id in D.st) { const [attempts, correct, last] = D.st[id]; ST[id] = { attempts, correct, lastCorrect: !!last }; }
    const now = Date.now();
    for (const id in D.rl) { const [reason, streak] = D.rl[id]; RL[id] = { reason, streak, added: now }; }
    // Once the 20 sample questions load, add the rest of the 200 as stats-only entries (not in ALL, so never shown as questions).
    (window.AFTER_LOAD = window.AFTER_LOAD || []).push(() => {
      const have = new Set(QS.map((q) => q.id));
      for (const [id, sec, secName, domain, domName, tgroup, lvl, age, img, rows, scales] of D.stubs) {
        if (have.has(id)) continue;
        QS.push({ id, sec, section: sec, secName, domain, domName, tgroup, topic: tgroup || secName, lvl, age: age || "",
          img: img ? "demo" : null, rows: rows ? [1] : [], scales: new Array(scales).fill(""), demo: true });
      }
    });
  }

  const css = document.createElement("style");
  css.textContent = `.demobar { margin: 0 0 12px; padding: 10px; border-radius: 14px; background: #F3F5F7; border: 1px solid #DDE3E8; }
.dseg { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.dseg button { min-height: 52px; padding: 6px 8px; border-radius: 10px; border: 2px solid #C9D0D6; background: #fff; color: #3A4654; font: inherit; cursor: pointer; text-align: center; }
.dseg button b { display: block; font-size: 14px; } .dseg button small { display: block; font-size: 11px; font-weight: 400; color: #5B6672; }
.dseg button[aria-pressed="true"] { border-color: #3A4654; background: #3A4654; color: #fff; } .dseg button[aria-pressed="true"] small { color: #D7DEE4; }
.dseg button:focus-visible { outline: 3px solid #8CC4FF; outline-offset: 2px; }
.dnote { margin: 8px 2px 0; font-size: 12px; line-height: 1.4; color: #3A4654; }
.obsec > .demobar { margin: 0; }
.demotop { padding-bottom: 4px; }
.demonew { width: 100%; margin-top: 10px; display: grid; grid-template-columns: 1fr auto; text-align: left; padding: 12px 14px; border-radius: 14px; border: 0; background: #3A4654; color: #fff; font: inherit; cursor: pointer; }
.demonew b { font-size: 16px; } .demonew small { grid-row: 2; font-size: 12px; opacity: .85; } .demonew span { grid-row: 1 / 3; grid-column: 2; align-self: center; font-size: 28px; }`;
  document.head.appendChild(css);
  const n = D.stubs.length;
  const bar = (where) => `<div class="demobar" role="group" aria-label="Which stats to show">
      <div class="dseg"><button type="button" data-act="demooff" aria-pressed="${!on}"><b>My answers</b><small>20 sample questions</small></button>
        <button type="button" data-act="demoon" aria-pressed="${on}"><b>Stats demo</b><small>200 pretend answers</small></button></div>
      <p class="dnote">${on ? `Showing <b>pretend answers on ${n} questions</b>. Nothing you answer is saved. Practice uses the 20 sample questions.` : "Showing <b>your own answers</b> from this browser."}</p></div>
    ${on && where === "home" && window.openCharts ? `<button type="button" class="demonew" data-act="democharts"><b>New: see your charts</b><small>Scores by domain, task and topic, plus where to focus next</small><span aria-hidden="true">›</span></button>` : ""}`;

  window.PAGE_ACTIONS = Object.assign(window.PAGE_ACTIONS || {}, { demooff: () => { if (on) setOn(false); }, demoon: () => { if (!on) setOn(true); },
    democharts: () => { S.page = "stats"; setTimeout(() => window.openCharts && window.openCharts(), 0); } });

  // Put the banner on top of the Practice page and the Home page (wrapping, so stats.js and home.js stay unchanged).
  document.addEventListener("DOMContentLoaded", () => {
    if (typeof statsBody === "function") { const base = statsBody; statsBody = function () { return bar() + base(); }; }
    const P = window.PAGES || {};
    if (P.home) { const h = P.home; P.home = function () { return h().replace('<div class="obscroll">', `<div class="obscroll"><section class="obsec demotop">${bar("home")}</section>`); }; }
    if (typeof render === "function") render();
  });
})();
