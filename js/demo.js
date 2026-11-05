/* Example stats ("demo mode") for team walk-throughs. Owner: Ken + Claude. TEMPORARY: remove once the team has seen it.
   Loads a 200-question outline (sections and topics only, no question wording or answers) plus example answers from
   js/demo/<app>.js (pretend answers, same style for every app), so the Practice page, Suggested focus and home meter have something real to show.
   - On by default. A banner on the Home and Practice pages says it's example data and has a switch.
   - While on, nothing you answer is saved, and your own stats stay untouched in this browser.
   - Practice sets still use the 20 sample questions (the extra 180 exist only as stats).
   Load right after progress.js and js/demo/<app>.js. app.js calls window.AFTER_LOAD hooks once questions load. */
(function () {
  const D = window.DEMO_DATA; if (!D) return;
  const KEY = NS + "demoStats";
  let on = true; try { on = localStorage.getItem(KEY) !== "off"; } catch (e) {}
  window.DEMO_ON = on;
  const setOn = (v) => { try { localStorage.setItem(KEY, v ? "on" : "off"); } catch (e) {} location.reload(); };

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
  css.textContent = `.demobar { display: flex; align-items: center; gap: 10px; margin: 0 0 12px; padding: 10px 12px; border-radius: 12px;
  background: #EEF1FF; border: 1.5px dashed #6E7BD6; color: #22295A; font-size: 13px; line-height: 1.4; }
.demobar b { display: block; font-size: 13px; }
.demobar button { flex-shrink: 0; min-height: 36px; padding: 0 12px; border-radius: 9px; border: 1.5px solid #6E7BD6; background: #fff; color: #22295A; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
.demobar.off { background: #F3F5F7; border-color: #C9D0D6; color: #3A4654; }
.demobar.off button { border-color: #C9D0D6; color: #3A4654; }
.obsec > .demobar { margin: 0; }`;
  document.head.appendChild(css);
  const n = D.stubs.length;
  const bar = () => on
    ? `<div class="demobar" role="note"><span><b>Example stats</b>Pretend answers on a ${n}-question bank. Nothing you answer is saved while this is on. Practice uses the 20 sample questions.</span><button type="button" data-act="demooff">Use my own</button></div>`
    : `<div class="demobar off" role="note"><span>Showing your own answers.</span><button type="button" data-act="demoon">Show example stats</button></div>`;

  window.PAGE_ACTIONS = Object.assign(window.PAGE_ACTIONS || {}, { demooff: () => setOn(false), demoon: () => setOn(true) });

  // Put the banner on top of the Practice page and the Home page (wrapping, so stats.js and home.js stay unchanged).
  document.addEventListener("DOMContentLoaded", () => {
    if (typeof statsBody === "function") { const base = statsBody; statsBody = function () { return bar() + base(); }; }
    const P = window.PAGES || {};
    if (P.home) { const h = P.home; P.home = function () { return h().replace('<section class="obsec">', `<section class="obsec">${bar()}</section><section class="obsec">`); }; }
    if (typeof render === "function") render();
  });
})();
