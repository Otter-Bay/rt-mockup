/* Practice-exam history and "Compare exams". Owner: Ken + Claude (Nov 6, 2026).
   Every finished Exam-mode set is remembered (date, score, time, and which questions were right), so learners can
   see their practice exams improve and compare any two tries by area (Domain / Task / Topic).
   - Exam results screen: "vs your last exam" line + Compare exams button.
   - Progress page: "Your practice exams" trend (2+ exams) + Compare exams button.
   - Stats demo: four pretend past exams in memory; new demo exams are added in memory only.
   Exam history is kept across Start fresh (it's a log of tries, not a score). Wraps render() and statsBody(). */
(function () {
  const DEMO = !!window.DEMO_ON;
  const clone = (o) => JSON.parse(JSON.stringify(o));
  let LOG = DEMO ? null : load("examLog", []);   // oldest first: { id, at, n, c, ms, items: [[qid, 1|0], ...] }
  const saveLog = () => { if (!DEMO) save("examLog", LOG); };
  const mins = (ms) => { const m = Math.round(ms / 60000); return m < 1 ? "under a minute" : m + " min"; };
  const day = (t) => new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const pct = (e) => Math.round(e.c / e.n * 100);

  function demoLog() {   // four pretend exams of 25 questions, improving with one dip, built from the demo outline
    const ids = QS.map((q) => q.id), h = (s) => { let x = 2166136261; for (const ch of s) x = Math.imul(x ^ ch.charCodeAt(0), 16777619);
      x ^= x >>> 16; x = Math.imul(x, 0x85ebca6b); x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); x ^= x >>> 16; return (x >>> 0) / 4294967296; };
    const plan = [[34, 0.60, 41], [26, 0.68, 38], [19, 0.64, 39], [6, 0.78, 33]], out = [];
    plan.forEach(([ago, p, m], k) => {
      const pick = ids.map((id) => [id, h(id + "e" + k)]).sort((a, b) => a[1] - b[1]).slice(0, 25).map(([id]) => id);
      // exactly round(25 * p) right; areas get a per-exam lean so the by-area comparison shows real differences
      const ranked = pick.map((id) => { const q = QS.find((x) => x.id === id); return [id, h(id + "r" + k) - h((q && q.sec) + "b" + k) * 0.5]; }).sort((a, b) => a[1] - b[1]);
      const nRight = Math.round(25 * p), right = new Set(ranked.slice(0, nRight).map(([id]) => id));
      const items = pick.map((id) => [id, right.has(id) ? 1 : 0]);
      const t = new Date(); t.setDate(t.getDate() - ago);
      out.push({ id: "demo" + k, at: t.getTime(), n: 25, c: items.filter((x) => x[1]).length, ms: m * 60000 + 17000, items });
    });
    return out;
  }
  const log = () => { if (!LOG) { if (QS.length < 50) return []; LOG = demoLog(); } return LOG; };   // demo: wait for the 200-question outline

  // Remember each exam once, when its results screen first appears.
  let lastLogged = null;
  function maybeLog() {
    if (!(S.results && S.mode === "exam") || lastLogged === S.started || window.VET_MODE) return;
    if (log().some((e) => e.id === "x" + S.started)) { lastLogged = S.started; return; }
    const items = S.set.map((ix, i) => [QS[ix].id, S.run[i].sel === QS[ix].ans ? 1 : 0]);
    log().push({ id: "x" + S.started, at: Date.now(), n: items.length, c: items.filter((x) => x[1]).length, ms: S.finishedMs, items });
    lastLogged = S.started; saveLog();
  }

  // ---- trend chart (same look as the chapters chart)
  function trend() {
    const L = log().slice(-8); if (L.length < 2) return "";
    const W = 300, H = 120, PL = 24, PR = 24, T = 26, B = 30, step = (W - PL - PR) / (L.length - 1), y = (v) => T + (100 - v) / 100 * (H - T - B);
    const xy = L.map((e, i) => [PL + i * step, y(pct(e))]), d = pct(L[L.length - 1]) - pct(L[0]);
    return `<figure class="chtrend" role="img" aria-label="Your practice exam scores: ${L.map((e) => `${day(e.at)} ${pct(e)}%`).join(", ")}">
      <figcaption><b>Your practice exams</b>${d >= 3 ? `<span class="fupmini">▲ ${d} points since your first</span>` : ""}</figcaption>
      <svg viewBox="0 0 ${W} ${H}" width="100%" aria-hidden="true"><line x1="${PL}" x2="${W - PR}" y1="${y(0)}" y2="${y(0)}" stroke="#E3E7EB"/>
        <polyline points="${xy.map((p) => p.join(",")).join(" ")}" fill="none" stroke="#8A939E" stroke-width="2" stroke-linejoin="round"/>
        ${L.map((e, i) => { const last = i === L.length - 1; return `<circle cx="${xy[i][0]}" cy="${xy[i][1]}" r="${last ? 7 : 5.5}" fill="${last ? "#3A4654" : "#fff"}" stroke="#3A4654" stroke-width="2.5"/>
          <text x="${xy[i][0]}" y="${xy[i][1] - 12}" text-anchor="middle" font-size="13" font-weight="800" fill="#12202E">${pct(e)}%</text>
          <text x="${xy[i][0]}" y="${H - 8}" text-anchor="middle" font-size="11" fill="${last ? "#12202E" : "#5B6672"}" font-weight="${last ? 800 : 500}">${day(e.at)}</text>`; }).join("")}
      </svg></figure>`;
  }
  const vsLast = (e, prev) => {
    if (!prev) return "";
    const dp = pct(e) - pct(prev), dm = Math.round((prev.ms - e.ms) / 60000);
    const sc = dp >= 3 ? `<b class="exup">▲ ${dp} points</b>` : dp <= -3 ? `<b class="exdown">▼ ${-dp} points</b>` : `<b>About the same score</b>`;
    const tm = Math.abs(dm) >= 1 ? ` · ${Math.abs(dm)} min ${dm > 0 ? "faster" : "slower"}` : "";
    const a1 = areas(prev, "domain"), a2 = areas(e, "domain"), ks = Object.keys(a2);
    const gain = ks.filter((k) => a1[k] && a1[k].n >= 5 && a2[k].n >= 5).map((k) => ({ name: a2[k].name, d: Math.round(a2[k].c / a2[k].n * 100 - a1[k].c / a1[k].n * 100) })).sort((x, y) => y.d - x.d)[0];
    const weak = ks.filter((k) => a2[k].n >= 5).map((k) => ({ name: a2[k].name, p: a2[k].c / a2[k].n })).sort((x, y) => x.p - y.p)[0];
    return `<span>${sc}${tm} vs. your last exam (${day(prev.at)}, ${pct(prev)}%)</span>${cheer(dp, { since: day(prev.at), mins: dm, best: gain && gain.d >= 3 ? gain.name : "", next: weak && weak.p < 0.85 ? weak.name : "", exam: true, n: e.n, key: prev.id + e.id })}`;
  };

  // ---- Compare exams sheet
  let CMP = null;   // { a, b, by }
  const keyOf = (by, q) => by === "domain" ? q.domain : by === "topic" ? (q.tgroup || "Other") : q.sec;
  const nameOf = (by, q) => by === "domain" ? `${q.domain}. ${domName(q.domain) || ""}` : by === "topic" ? (q.tgroup || "Other") : (q.secName || q.sec);
  function areas(e, by) { const o = {}; for (const [id, ok] of e.items) { const q = QS.find((x) => x.id === id); if (!q) continue; const k = keyOf(by, q), r = o[k] || (o[k] = { name: nameOf(by, q), n: 0, c: 0 }); r.n++; r.c += ok; } return o; }
  function sheet() {
    const L = log(), A = L.find((e) => e.id === CMP.a), Bx = L.find((e) => e.id === CMP.b); if (!A || !Bx) return "";
    const by = CMP.by, a = areas(A, by), b = areas(Bx, by);
    const rows = [...new Set([...Object.keys(a), ...Object.keys(b)])].map((k) => { const x = a[k], y = b[k]; const pa = x ? Math.round(x.c / x.n * 100) : null, pb = y ? Math.round(y.c / y.n * 100) : null;
      return { name: (x || y).name, pa, pb, na: x ? x.n : 0, nb: y ? y.n : 0, d: pa != null && pb != null ? pb - pa : null, early: (x && x.n < 3) || (y && y.n < 3) }; })
      .sort((r, s) => (s.d == null ? -999 : s.d) - (r.d == null ? -999 : r.d));
    const W = 150, X = (v) => 6 + v / 100 * (W - 12);
    const opt = (sel) => L.map((e) => `<option value="${e.id}" ${e.id === sel ? "selected" : ""}>${day(e.at)} · ${pct(e)}% · ${mins(e.ms)}</option>`).join("");
    const row = (r) => { const col = r.d == null ? "#8A939E" : r.d >= 3 ? "#1F7A4D" : r.d <= -3 ? "#B7791F" : "#8A939E";
      const lab = r.d == null ? (r.pa == null ? `only ${day(Bx.at)}` : `only ${day(A.at)}`) : r.d >= 3 ? `+${r.d}` : r.d <= -3 ? `–${-r.d}` : "same";
      return `<li class="${r.early ? "early" : ""}"><span class="cmpn">${esc(r.name)}<small>${r.pa == null ? "–" : `${r.pa}% (${r.na})`} → ${r.pb == null ? "–" : `${r.pb}% (${r.nb})`}${r.early ? " · few questions" : ""}</small></span>
        <svg width="${W}" height="20" viewBox="0 0 ${W} 20" aria-hidden="true"><line x1="6" x2="${W - 6}" y1="10" y2="10" stroke="#E3E7EB" stroke-width="2"/>
        ${r.pa != null && r.pb != null ? `<line x1="${X(r.pa)}" x2="${X(r.pb)}" y1="10" y2="10" stroke="${col}" stroke-width="4" stroke-linecap="round"/>` : ""}
        ${r.pa != null ? `<circle cx="${X(r.pa)}" cy="10" r="5.5" fill="#fff" stroke="#8A939E" stroke-width="2.5"/>` : ""}${r.pb != null ? `<circle cx="${X(r.pb)}" cy="10" r="6" fill="#3A4654"/>` : ""}</svg>
        <b class="cmpd" style="color:${col}">${lab}</b></li>`; };
    const dp = pct(Bx) - pct(A), dm = Math.round((A.ms - Bx.ms) / 60000);
    const tabs = [["domain", "Domain"], ["task", "Task"], ["topic", "Topic"]].map(([k, l]) => `<button type="button" role="tab" class="cmptab" data-exby="${k}" aria-selected="${by === k}">${l}</button>`).join("");
    return `<div class="scrim exscrim"><div class="dialog" role="dialog" aria-modal="true" aria-labelledby="exT">
      <div class="schead"><h2 id="exT">Compare exams</h2><button type="button" class="vb exx" aria-label="Close">${ICON.x}</button></div>
      <div class="expick"><label><span><span class="k1"></span> Earlier</span><select data-exsel="a">${opt(CMP.a)}</select></label>
        <label><span><span class="k2"></span> Later</span><select data-exsel="b">${opt(CMP.b)}</select></label></div>
      <div class="exsum"><div><b class="${dp >= 3 ? "exup" : dp <= -3 ? "exdown" : ""}">${dp >= 3 ? "▲ " + dp : dp <= -3 ? "▼ " + -dp : "±0"}</b><small>points (${pct(A)}% → ${pct(Bx)}%)</small></div>
        <div><b>${Math.abs(dm) >= 1 ? `${Math.abs(dm)} min ${dm > 0 ? "faster" : "slower"}` : "Same time"}</b><small>${mins(A.ms)} → ${mins(Bx.ms)}</small></div></div>
      <div class="seg fwseg" role="tablist" aria-label="Group by">${tabs}</div>
      ${(() => { const best = rows.filter((r) => r.d != null && r.na >= 5 && r.nb >= 5 && r.d >= 3).sort((x, y) => y.d - x.d)[0];
        const nxt = rows.filter((r) => r.pb != null && r.nb >= 5).sort((x, y) => x.pb - y.pb)[0];
        return cheer(dp, { since: day(A.at), mins: dm, best: best && best.name, next: nxt && nxt.pb < 85 ? nxt.name : "", exam: true, n: Bx.n, key: A.id + Bx.id }); })()}
      <p class="cmpsum">Each exam has different questions, so small areas can swing. Biggest changes first.</p>
      <ul class="cmplist">${rows.map(row).join("")}</ul>
    </div></div>`;
  }
  function openCmp(bId) { const L = log(); if (L.length < 2) return; let bi = bId ? L.findIndex((e) => e.id === bId) : L.length - 1; if (bi < 0) bi = L.length - 1;
    const ai = bi > 0 ? bi - 1 : 1; CMP = { a: L[Math.min(ai, bi)].id, b: L[Math.max(ai, bi)].id, by: "domain" }; }   // domain first: an exam has enough questions per domain

  window.PAGE_ACTIONS = Object.assign(window.PAGE_ACTIONS || {}, { excmp: (b) => { openCmp(b.dataset.id); } });
  document.addEventListener("click", (e) => {
    if (!CMP) return;
    const t = e.target.closest && e.target.closest(".exx, [data-exby], .exscrim"); if (!t) return;
    if (t.dataset.exby) { e.stopPropagation(); CMP.by = t.dataset.exby; render(); return; }
    if (t.classList.contains("exx") || (t.classList.contains("exscrim") && e.target === t)) { e.stopPropagation(); CMP = null; render(); }
  }, true);
  document.addEventListener("change", (e) => { const s = e.target.closest && e.target.closest("[data-exsel]"); if (s && CMP) { CMP[s.dataset.exsel] = s.value; render(); } });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && CMP) { CMP = null; render(); } });

  const css = document.createElement("style");
  css.textContent = `.exvs { margin: 0; padding: 10px 12px; border-radius: 12px; background: #F3F5F7; font-size: 14px; color: #24313E; display: flex; flex-direction: column; gap: 8px; }
.exup { color: #17603C; } .exdown { color: #8A5A00; }
.exbtn { min-height: 44px; border-radius: 10px; border: 2px solid #3A4654; background: #fff; color: #3A4654; font: inherit; font-weight: 700; cursor: pointer; }
.excard { display: flex; flex-direction: column; gap: 8px; }
.exscrim { z-index: 9; }
.expick { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.expick label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; font-weight: 700; color: #3A4654; }
.expick select { min-height: 40px; border-radius: 9px; border: 1.5px solid #C9D0D6; padding: 0 6px; font: inherit; font-size: 13px; background: #fff; color: #12202E; }
.expick .k1, .expick .k2 { display: inline-block; width: 11px; height: 11px; border-radius: 6px; vertical-align: -1px; } .expick .k1 { border: 2.5px solid #8A939E; } .expick .k2 { background: #3A4654; }
.exsum { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; } .exsum div { background: #F3F5F7; border-radius: 12px; padding: 10px; }
.exsum b { display: block; font-size: 18px; } .exsum small { font-size: 12px; color: #5B6672; }`;
  document.head.appendChild(css);

  document.addEventListener("DOMContentLoaded", () => {
    // Progress page: practice-exam card just above Suggested focus (only once there's at least one exam)
    if (typeof statsBody === "function") { const base = statsBody; statsBody = function () {
      const h = base(), L = log(); if (!L.length) return h;
      const last = L[L.length - 1];
      const card = `<section class="step excard" aria-label="Your practice exams">${trend() || `<h2>Your practice exams</h2><p class="hint">Last exam: ${day(last.at)}, ${pct(last)}% in ${mins(last.ms)}. Take another to compare.</p>`}
        ${L.length > 1 ? `<button type="button" class="exbtn" data-act="excmp">Compare exams</button>` : ""}</section>`;
      const i = h.indexOf('<section class="step fcard"'); return i < 0 ? h + card : h.slice(0, i) + card + h.slice(i);
    }; }
    const r0 = render;
    render = function () {
      maybeLog(); r0();
      // exam results screen: "vs your last exam" + Compare
      if (S.results && S.mode === "exam" && !S.reviewing && S.page !== "stats") {
        const sc = document.querySelector(".results .score"), L = log(), me = L.find((e) => e.id === "x" + S.started);
        if (sc && me && !document.querySelector(".exvs")) { const prev = L[L.indexOf(me) - 1];
          sc.insertAdjacentHTML("afterend", `<div class="exvs">${prev ? vsLast(me, prev) : "<span>Your first practice exam is saved. Take another to see how you compare.</span>"}${prev ? `<button type="button" class="exbtn" data-act="excmp" data-id="${me.id}">Compare exams</button>` : ""}</div>`); }
      }
      const ph = document.getElementById("phone"), old = document.getElementById("exbox"); if (old) old.remove();
      if (CMP && ph) { const box = document.createElement("div"); box.id = "exbox"; box.innerHTML = sheet(); ph.appendChild(box);
        const th = document.querySelector(".ob"); if (th && box.firstElementChild) box.firstElementChild.style.cssText = th.getAttribute("style") || ""; const x = box.querySelector(".exx"); if (x) x.focus(); }
    };
  });
})();
