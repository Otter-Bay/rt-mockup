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
    // pretend earlier chapters: fewer questions tried, and most areas a bit weaker back then (one area slightly stronger)
    const h = (str) => { let x = 2166136261; for (const ch of str) x = Math.imul(x ^ ch.charCodeAt(0), 16777619);
      x ^= x >>> 16; x = Math.imul(x, 0x85ebca6b); x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); x ^= x >>> 16; return (x >>> 0) / 4294967296; };
    const secOf = {}; if (window.DEMO_DATA) for (const x of window.DEMO_DATA.stubs) secOf[x[0]] = x[1];
    const mk = (keep, weaker, from, to, id) => {
      const st = {};
      for (const k of Object.keys(ST)) {
        if (h(k + id) * 100 >= keep) continue;
        const x = clone(ST[k]), sec = secOf[k] || "", bias = h(sec + id);       // per-area: how much weaker back then
        const slip = bias > 0.88;                                                // one-ish area was stronger then
        if (!slip && x.lastCorrect && h(k + "w" + id) < weaker * (0.4 + bias)) x.lastCorrect = false;
        if (slip && !x.lastCorrect && h(k + "s" + id) < 0.7) x.lastCorrect = true;
        st[k] = x;
      }
      const s2 = score(st); return { id, from, to, tried: s2.tried, pct: s2.pct, st, rl: {} };
    };
    const d = (n) => { const t = new Date(); t.setDate(t.getDate() - n); return t.toISOString().slice(0, 10); };
    CH = [mk(75, 0.22, d(62), d(31), "demo2"), mk(45, 0.45, d(110), d(63), "demo1")];
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
.chbar b { display: block; font-size: 14px; }
.chcmp { min-height: 40px; border-radius: 10px; border: 2px solid #3A4654; background: #fff; color: #3A4654; font: inherit; font-weight: 700; cursor: pointer; }
.chtrend { margin: 4px 0 0; padding: 10px 12px 4px; border: 1.5px solid #DDE3E8; border-radius: 12px; }
.chtrend figcaption { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; font-size: 14px; }
.fupmini { font-size: 12px; font-weight: 800; color: #17603C; background: #E3F4EA; border-radius: 8px; padding: 2px 7px; }
.chscrim { z-index: 9; } .cmpkey { margin: 0; font-size: 13px; color: #3A4654; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.cmpkey .k1, .cmpkey .k2 { display: inline-block; width: 12px; height: 12px; border-radius: 6px; } .cmpkey .k1 { border: 2.5px solid #8A939E; background: #fff; } .cmpkey .k2 { background: #3A4654; margin-left: 8px; }
.cmpsum { margin: 0; font-size: 14px; color: #24313E; }
.cmplist { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
.cmplist li { display: grid; grid-template-columns: 1fr 150px 54px; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid #EDF0F3; }
.cmplist li.early { opacity: .55; }
.cmpn { font-size: 13px; font-weight: 700; color: #24313E; } .cmpn small { display: block; font-size: 11px; font-weight: 400; color: #5B6672; }
.cmpd { font-size: 13px; text-align: right; } .chbar .chrow button { min-height: 40px; }`;
  document.head.appendChild(css);

  const curLine = () => { const s = score(ST); return `${START ? `Since ${fmt(START)}` : "Since you started"} · ${s.tried} question${s.tried === 1 ? "" : "s"} tried${s.pct == null ? "" : ` · ${s.pct}% right`}`; };
  // ---- Visual 1: "Your chapters" trend (oldest -> Now), shown above the Past progress list
  const short = (d) => d ? new Date(d + "T12:00:00").toLocaleDateString("en-US", { month: "short" }) : "Start";
  function trend() {
    const live = VIEW ? (DEMO ? window.__chLive && window.__chLive.st : load("rtStats", {})) : ST;
    const pts = CH.slice().reverse().map((c) => ({ pct: c.pct, lab: c.from ? `${short(c.from)}–${short(c.to)}` : `Until ${short(c.to)}` }));
    const nowS = score(live || {}); pts.push({ pct: nowS.pct, lab: "Now", now: true });
    const P = pts.filter((x) => x.pct != null); if (P.length < 2) return "";
    const W = 300, H = 120, L = 24, R = 24, T = 26, B = 30, step = (W - L - R) / (P.length - 1), y = (v) => T + (100 - v) / 100 * (H - T - B);
    const xy = P.map((p, i) => [L + i * step, y(p.pct)]);
    const first = P[0].pct, last = P[P.length - 1].pct, d = last - first;
    return `<figure class="chtrend" role="img" aria-label="Your overall score by chapter: ${P.map((p) => `${p.lab} ${p.pct}%`).join(", ")}">
      <figcaption><b>Your chapters</b>${d >= 3 ? `<span class="fupmini">▲ ${d} points since your first chapter</span>` : ""}</figcaption>
      <svg viewBox="0 0 ${W} ${H}" width="100%" aria-hidden="true">
        <line x1="${L}" x2="${W - R}" y1="${y(0)}" y2="${y(0)}" stroke="#E3E7EB"/>
        <polyline points="${xy.map((p) => p.join(",")).join(" ")}" fill="none" stroke="#8A939E" stroke-width="2" stroke-linejoin="round"/>
        ${P.map((p, i) => `<circle cx="${xy[i][0]}" cy="${xy[i][1]}" r="${p.now ? 7 : 5.5}" fill="${p.now ? "#3A4654" : "#fff"}" stroke="#3A4654" stroke-width="2.5"/>
          <text x="${xy[i][0]}" y="${xy[i][1] - 12}" text-anchor="middle" font-size="13" font-weight="800" fill="#12202E">${p.pct}%</text>
          <text x="${xy[i][0]}" y="${H - 8}" text-anchor="middle" font-size="11" fill="${p.now ? "#12202E" : "#5B6672"}" font-weight="${p.now ? 800 : 500}">${p.lab}</text>`).join("")}
      </svg></figure>`;
  }
  // ---- Visual 2: "Compare with now" (two dots per area: then vs now)
  let CMP = null;   // null | { by }
  const keyOf = (by, q) => by === "domain" ? q.domain : by === "topic" ? (q.tgroup || "Other") : q.sec;
  const nameOf = (by, q) => by === "domain" ? `${q.domain}. ${domName(q.domain) || ""}` : by === "topic" ? (q.tgroup || "Other") : (q.secName || q.sec);
  function areaScores(st, by) { const o = {}; for (const q of QS) { const k = keyOf(by, q), x = st[q.id]; const r = o[k] || (o[k] = { key: k, name: nameOf(by, q), n: 0, c: 0 }); if (x) { r.n++; if (x.lastCorrect) r.c++; } } return o; }
  function compareSheet() {
    const by = CMP.by, live = DEMO ? (window.__chLive ? window.__chLive.st : ST) : load("rtStats", {});
    const A = areaScores(VIEW.st, by), Bn = areaScores(live, by);
    const rows = Object.keys(A).map((k) => { const a = A[k], b = Bn[k]; const pa = a.n ? Math.round(a.c / a.n * 100) : null, pb = b.n ? Math.round(b.c / b.n * 100) : null;
      return { name: a.name, pa, pb, d: pa != null && pb != null ? pb - pa : null, early: (a.n && a.n < 3) || (b.n && b.n < 3) }; })
      .filter((r) => r.pa != null || r.pb != null).sort((x, y) => (y.d == null ? -999 : y.d) - (x.d == null ? -999 : x.d));
    const W = 150, X = (v) => 6 + v / 100 * (W - 12);
    const row = (r) => {
      const col = r.d == null ? "#8A939E" : r.d >= 3 ? "#1F7A4D" : r.d <= -3 ? "#B7791F" : "#8A939E";
      const lab = r.d == null ? (r.pa == null ? "new" : "not tried now") : r.d >= 3 ? `+${r.d}` : r.d <= -3 ? `–${-r.d}` : "same";
      return `<li class="${r.early ? "early" : ""}"><span class="cmpn">${esc(r.name)}<small>${r.pa == null ? "–" : r.pa + "%"} then · ${r.pb == null ? "–" : r.pb + "%"} now${r.early ? " · early" : ""}</small></span>
        <svg width="${W}" height="20" viewBox="0 0 ${W} 20" aria-hidden="true"><line x1="6" x2="${W - 6}" y1="10" y2="10" stroke="#E3E7EB" stroke-width="2"/>
          ${r.pa != null && r.pb != null ? `<line x1="${X(r.pa)}" x2="${X(r.pb)}" y1="10" y2="10" stroke="${col}" stroke-width="4" stroke-linecap="round"/>` : ""}
          ${r.pa != null ? `<circle cx="${X(r.pa)}" cy="10" r="5.5" fill="#fff" stroke="#8A939E" stroke-width="2.5"/>` : ""}
          ${r.pb != null ? `<circle cx="${X(r.pb)}" cy="10" r="6" fill="#3A4654"/>` : ""}</svg>
        <b class="cmpd" style="color:${col}">${lab}</b></li>`;
    };
    const tabs = [["domain", "Domain"], ["task", "Task"], ["topic", "Topic"]].map(([k, l]) => `<button type="button" role="tab" class="cmptab" data-cmpby="${k}" aria-selected="${by === k}">${l}</button>`).join("");
    const up = rows.filter((r) => r.d != null && r.d >= 3).length, down = rows.filter((r) => r.d != null && r.d <= -3).length;
    return `<div class="scrim chscrim"><div class="dialog" role="dialog" aria-modal="true" aria-labelledby="cmpT">
      <div class="schead"><h2 id="cmpT">Then vs. now</h2><button type="button" class="vb chcx" aria-label="Close">${ICON.x}</button></div>
      <p class="cmpkey"><span class="k1"></span> ${fmt(VIEW.from)} – ${fmt(VIEW.to)} <span class="k2"></span> Now</p>
      ${(() => { const sa = score(VIEW.st).pct, sb = score(live).pct; if (sa == null || sb == null) return "";
        const best = rows.filter((r) => r.d != null && !r.early && r.d >= 3)[0], nxt = rows.filter((r) => r.pb != null && !r.early).sort((x, y) => x.pb - y.pb)[0];
        return cheer(sb - sa, { since: fmt(VIEW.to), best: best && best.name, next: nxt && nxt.pb < 85 ? nxt.name : "" }); })()}
      <p class="cmpsum">${up ? `<b>${up} area${up === 1 ? "" : "s"} improved</b>` : "No big changes yet"}${down ? `, ${down} slipped a little` : ""}. Biggest changes first.</p>
      <div class="seg fwseg" role="tablist" aria-label="Group by">${tabs}</div>
      <ul class="cmplist">${rows.map(row).join("")}</ul>
    </div></div>`;
  }
  function settingsSection() {
    const list = CH.length ? `${trend()}<h3>Past progress</h3><ul class="chlist">${CH.map((c) => `<li><span class="chinfo">${fmt(c.from)} – ${fmt(c.to)}<small>${c.tried} questions tried</small></span><span class="chpct">${c.pct == null ? "–" : c.pct + "%"}</span><button type="button" class="chview" data-act="chview" data-id="${c.id}">View</button></li>`).join("")}</ul>` : "";
    const body = UI === "confirm"
      ? `<div class="chconfirm" role="alertdialog" aria-labelledby="chq"><b id="chq">Start fresh?</b><span>Your scores, charts and review list go back to zero. Your progress so far is saved under Past progress, so you can look back or bring it back anytime.</span>
         <div class="chrow"><button type="button" class="chno" data-act="chno">Cancel</button><button type="button" class="chyes" data-act="chyes">Start fresh</button></div></div>`
      : `${UI === "done" ? `<div class="chdone" role="status">Fresh start! Your earlier progress is saved below.</div>` : ""}<button type="button" class="chfresh" data-act="chask">Start fresh</button>`;
    return `<section class="chsec" aria-labelledby="chT"><h3 id="chT">Your progress</h3><p>${curLine()}${DEMO ? ". (Stats demo: nothing here is saved.)" : ""}</p>${body}${list}</section>`;
  }
  const viewBar = () => VIEW ? `<div class="chbar" role="note"><span><b>Viewing ${fmt(VIEW.from)} – ${fmt(VIEW.to)}</b>Past progress, read only. Practice here won't change it.</span>
    <button type="button" class="chcmp" data-act="chcmp">Compare with now</button>
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
    chback: () => { CMP = null;
      if (DEMO && window.__chLive) { for (const k in ST) delete ST[k]; for (const k in RL) delete RL[k]; Object.assign(ST, window.__chLive.st); Object.assign(RL, window.__chLive.rl); window.__chLive = null; VIEW = null; return; }
      reloadTo("stats"); return false;
    },
    chmake: (b) => { CMP = null; makeCurrent(b.dataset.id); UI = null; },
    chcmp: () => { CMP = { by: "task" }; },
  });

  document.addEventListener("click", (e) => {
    if (!CMP) return;
    const t = e.target.closest && e.target.closest(".chcx, [data-cmpby], .chscrim"); if (!t) return;
    if (t.dataset.cmpby) { e.stopPropagation(); CMP.by = t.dataset.cmpby; render(); return; }
    if (t.classList.contains("chcx") || (t.classList.contains("chscrim") && e.target === t)) { e.stopPropagation(); CMP = null; render(); }
  }, true);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && CMP) { CMP = null; render(); } });
  document.addEventListener("DOMContentLoaded", () => {
    // Progress page: viewing banner on top; the old testing-only reset link is replaced by Settings > Start fresh.
    if (typeof statsBody === "function") { const base = statsBody; statsBody = function () { return viewBar() + base().replace(/<button type="button" class="link" data-act="resetstats">[^<]*<\/button>/, ""); }; }
    const P = window.PAGES || {};
    if (P.home) { const h = P.home; P.home = function () { const out = h(); return VIEW ? out.replace('<div class="obscroll">', `<div class="obscroll"><section class="obsec">${viewBar()}</section>`) : out; }; }
    // Settings dialog: add the Start fresh section above its Done row.
    const r0 = render;
    render = function () {
      r0();
      const ph = document.getElementById("phone"), old = document.getElementById("chbox"); if (old) old.remove();
      if (CMP && VIEW && ph) { const box = document.createElement("div"); box.id = "chbox"; box.innerHTML = compareSheet(); ph.appendChild(box);
        const th = document.querySelector(".ob"); if (th) box.firstElementChild.style.cssText = th.getAttribute("style") || ""; box.querySelector(".chcx").focus(); }
      if (!S.settings) { UI = null; return; }
      const dlg = document.querySelector('.dialog[aria-labelledby="setT"]'); if (!dlg || dlg.querySelector(".chsec")) return;
      const row = dlg.querySelector(".row"); const tmp = document.createElement("div"); tmp.innerHTML = settingsSection();
      dlg.insertBefore(tmp.firstElementChild, row);
      if (UI === "confirm") { const y = dlg.querySelector(".chyes"); if (y) y.focus(); }
    };
    render();
  });
})();
