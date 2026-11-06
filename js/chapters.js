/* "Start fresh" with chapters. Owner: Ken + Claude (Nov 6, 2026).
   Starting fresh never deletes anything: it closes the current CHAPTER (a snapshot of scores + review list with its
   dates) and starts a new one at zero. Settings (gear) lists past chapters: view one read-only, or make it current again
   (today's progress is saved as a chapter first, so nothing is ever lost).
   In the Stats demo, chapters live in memory only (two pretend past chapters, nothing saved).
   Wraps render(), statsBody() and the Home page, so app.js / stats.js / home.js stay unchanged. Load after demo.js. */
(function () {
  const DEMO = !!window.DEMO_ON;
  const today = () => new Date().toISOString().slice(0, 10);
  const fmt = (d) => d ? new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: new Date(d).getFullYear() !== new Date().getFullYear() ? "numeric" : undefined }) : "the start";
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const score = (st) => { const v = Object.values(st); return { tried: v.length, pct: v.length ? Math.round(v.filter((x) => x.lastCorrect).length / v.length * 100) : null }; };

  let CH = DEMO ? [] : load("chapters", []);          // newest first: { id, from, to, tried, pct, st, rl }
  let START = DEMO ? null : load("chapterStart", null); // when the current chapter began (null = since first use)
  const saveAll = () => { if (!DEMO) { save("chapters", CH); save("chapterStart", START); } };

  if (DEMO) {   // two pretend past chapters built from the demo answers, so the team can try viewing them
    const mk = (keep, flip, from, to, id) => {
      const st = {}; const ids = Object.keys(ST);
      ids.forEach((k, i) => { if (i % 100 < keep) { const x = clone(ST[k]); if (i % 100 < flip) x.lastCorrect = false; st[k] = x; } });
      const s = score(st); return { id, from, to, tried: s.tried, pct: s.pct, st, rl: {} };
    };
    const d = (n) => { const t = new Date(); t.setDate(t.getDate() - n); return t.toISOString().slice(0, 10); };
    CH = [mk(70, 9, d(62), d(31), "demo2"), mk(40, 14, d(110), d(63), "demo1")];
    START = d(30);
  }

  // Viewing a past chapter: swap it in (in memory), never save.
  let VIEW = null;
  try { const v = sessionStorage.getItem(NS + "chView"); if (v) { VIEW = CH.find((c) => c.id === v) || null; sessionStorage.removeItem(NS + "chView"); } } catch (e) {}
  if (VIEW) {
    const s0 = save; save = function (k, v) { if (k === "rtStats" || k === "rtReviewList" || k === "dayLog") return; s0(k, v); };
    for (const k in ST) delete ST[k]; for (const k in RL) delete RL[k];
    Object.assign(ST, clone(VIEW.st)); Object.assign(RL, clone(VIEW.rl));
  }
  const reloadTo = (page) => { try { sessionStorage.setItem(NS + "chPage", page || ""); } catch (e) {} location.reload(); };
  try { const pg = sessionStorage.getItem(NS + "chPage"); if (pg) { sessionStorage.removeItem(NS + "chPage"); window.addEventListener("DOMContentLoaded", () => { S.page = pg; render(); }); } } catch (e) {}

  let UI = null;   // null | "confirm" | "done"
  function startFresh() {
    const s = score(ST);
    if (s.tried) CH.unshift({ id: "c" + Date.now(), from: START, to: today(), tried: s.tried, pct: s.pct, st: clone(ST), rl: clone(RL) });
    for (const k in ST) delete ST[k]; for (const k in RL) delete RL[k];
    START = today();
    if (!DEMO) { save("rtStats", ST); save("rtReviewList", RL); } saveAll();
  }
  function makeCurrent(id) {
    const c = CH.find((x) => x.id === id); if (!c) return;
    const s = score(ST);
    CH = CH.filter((x) => x.id !== id);
    if (s.tried && !VIEW && !DEMO) CH.unshift({ id: "c" + Date.now(), from: START, to: today(), tried: s.tried, pct: s.pct, st: clone(ST), rl: clone(RL) });
    if (DEMO) {   // in memory only: save the live (not the viewed) progress as a chapter, then bring this one back
      const live = window.__chLive || { st: clone(ST), rl: clone(RL) }, sl = score(live.st);
      if (sl.tried) CH.unshift({ id: "c" + Date.now(), from: START, to: today(), tried: sl.tried, pct: sl.pct, st: live.st, rl: live.rl });
      for (const k in ST) delete ST[k]; for (const k in RL) delete RL[k]; Object.assign(ST, clone(c.st)); Object.assign(RL, clone(c.rl));
      START = c.from; VIEW = null; window.__chLive = null; return;
    }
    // real: write the chapter as the current progress (today's was saved above, or is still in storage if we were viewing)
    if (VIEW) { const cur = load("rtStats", {}), sc = score(cur); if (sc.tried) CH.unshift({ id: "c" + Date.now(), from: START, to: today(), tried: sc.tried, pct: sc.pct, st: cur, rl: load("rtReviewList", {}) }); }
    localStorage.setItem(NS + "rtStats", JSON.stringify(c.st)); localStorage.setItem(NS + "rtReviewList", JSON.stringify(c.rl));
    START = c.from; saveAll(); reloadTo("stats");
  }

  const css = document.createElement("style");
  css.textContent = `.chsec { border-top: 1px solid #E3E7EB; padding-top: 12px; display: flex; flex-direction: column; gap: 8px; }
.chsec h3 { margin: 0; font-size: 15px; } .chsec p { margin: 0; font-size: 13px; color: #5B6672; line-height: 1.4; }
.chfresh { min-height: 46px; border-radius: 12px; border: 2px solid #3A4654; background: #fff; color: #3A4654; font: inherit; font-weight: 700; cursor: pointer; }
.chconfirm { background: #F3F5F7; border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.chconfirm b { font-size: 15px; } .chrow { display: flex; gap: 8px; } .chrow button { flex: 1; }
.chyes { min-height: 44px; border-radius: 10px; border: 0; background: #3A4654; color: #fff; font: inherit; font-weight: 700; cursor: pointer; }
.chno { min-height: 44px; border-radius: 10px; border: 1.5px solid #C9D0D6; background: #fff; color: #3A4654; font: inherit; font-weight: 700; cursor: pointer; }
.chdone { background: #E3F4EA; border: 1.5px solid #9ED3B4; color: #17603C; border-radius: 12px; padding: 10px 12px; font-size: 13px; }
.chlist { display: flex; flex-direction: column; gap: 6px; margin: 0; padding: 0; list-style: none; }
.chlist li { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border: 1.5px solid #DDE3E8; border-radius: 12px; }
.chlist .chinfo { flex: 1; font-size: 14px; } .chlist .chinfo small { display: block; font-size: 12px; color: #5B6672; }
.chlist .chpct { font-weight: 800; font-size: 16px; color: #12202E; }
.chview { min-height: 36px; padding: 0 12px; border-radius: 9px; border: 1.5px solid #3A4654; background: #fff; color: #3A4654; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
.chbar { margin: 0 0 12px; padding: 10px 12px; border-radius: 14px; background: #FFF6E0; border: 1.5px dashed #C9962E; color: #4A3500; font-size: 13px; line-height: 1.4; display: flex; flex-direction: column; gap: 8px; }
.chbar b { display: block; font-size: 14px; } .chbar .chrow button { min-height: 40px; }`;
  document.head.appendChild(css);

  const curLine = () => { const s = score(ST); return `${START ? `Since ${fmt(START)}` : "Since you started"} · ${s.tried} question${s.tried === 1 ? "" : "s"} tried${s.pct == null ? "" : ` · ${s.pct}% right`}`; };
  function settingsSection() {
    const list = CH.length ? `<h3>Past progress</h3><ul class="chlist">${CH.map((c) => `<li><span class="chinfo">${fmt(c.from)} – ${fmt(c.to)}<small>${c.tried} questions tried</small></span><span class="chpct">${c.pct == null ? "–" : c.pct + "%"}</span><button type="button" class="chview" data-act="chview" data-id="${c.id}">View</button></li>`).join("")}</ul>` : "";
    const body = UI === "confirm"
      ? `<div class="chconfirm" role="alertdialog" aria-labelledby="chq"><b id="chq">Start fresh?</b><span>Your scores, charts and review list go back to zero. Your progress so far is saved under Past progress, so you can look back or bring it back anytime.</span>
         <div class="chrow"><button type="button" class="chno" data-act="chno">Cancel</button><button type="button" class="chyes" data-act="chyes">Start fresh</button></div></div>`
      : `${UI === "done" ? `<div class="chdone" role="status">Fresh start! Your earlier progress is saved below.</div>` : ""}<button type="button" class="chfresh" data-act="chask">Start fresh</button>`;
    return `<section class="chsec" aria-labelledby="chT"><h3 id="chT">Your progress</h3><p>${curLine()}${DEMO ? ". (Stats demo: nothing here is saved.)" : ""}</p>${body}${list}</section>`;
  }
  const viewBar = () => VIEW ? `<div class="chbar" role="note"><span><b>Viewing ${fmt(VIEW.from)} – ${fmt(VIEW.to)}</b>Past progress, read only. Practice here won't change it.</span>
    <div class="chrow"><button type="button" class="chno" data-act="chback">Back to now</button><button type="button" class="chyes" data-act="chmake" data-id="${VIEW.id}">Make this my current progress</button></div></div>` : "";

  window.PAGE_ACTIONS = Object.assign(window.PAGE_ACTIONS || {}, {
    chask: () => { UI = "confirm"; },
    chno: () => { UI = null; },
    chyes: () => { startFresh(); UI = "done"; },
    chview: (b) => {
      const c = CH.find((x) => x.id === b.dataset.id); if (!c) return;
      if (DEMO) { VIEW = c; window.__chLive = window.__chLive || { st: clone(ST), rl: clone(RL) }; for (const k in ST) delete ST[k]; for (const k in RL) delete RL[k]; Object.assign(ST, clone(c.st)); Object.assign(RL, clone(c.rl)); S.settings = false; S.page = "stats"; UI = null; return; }
      try { sessionStorage.setItem(NS + "chView", c.id); } catch (e) {} reloadTo("stats"); return false;
    },
    chback: () => {
      if (DEMO && window.__chLive) { for (const k in ST) delete ST[k]; for (const k in RL) delete RL[k]; Object.assign(ST, window.__chLive.st); Object.assign(RL, window.__chLive.rl); window.__chLive = null; VIEW = null; return; }
      reloadTo("stats"); return false;
    },
    chmake: (b) => { makeCurrent(b.dataset.id); UI = null; },
  });

  document.addEventListener("DOMContentLoaded", () => {
    // Progress page: viewing banner on top; the old testing-only reset link is replaced by Settings > Start fresh.
    if (typeof statsBody === "function") { const base = statsBody; statsBody = function () { return viewBar() + base().replace(/<button type="button" class="link" data-act="resetstats">[^<]*<\/button>/, ""); }; }
    const P = window.PAGES || {};
    if (P.home) { const h = P.home; P.home = function () { const out = h(); return VIEW ? out.replace('<div class="obscroll">', `<div class="obscroll"><section class="obsec">${viewBar()}</section>`) : out; }; }
    // Settings dialog: add the Start fresh section above its Done row.
    const r0 = render;
    render = function () {
      r0();
      if (!S.settings) { UI = null; return; }
      const dlg = document.querySelector('.dialog[aria-labelledby="setT"]'); if (!dlg || dlg.querySelector(".chsec")) return;
      const row = dlg.querySelector(".row"); const tmp = document.createElement("div"); tmp.innerHTML = settingsSection();
      dlg.insertBefore(tmp.firstElementChild, row);
      if (UI === "confirm") { const y = dlg.querySelector(".chyes"); if (y) y.focus(); }
    };
    render();
  });
})();
