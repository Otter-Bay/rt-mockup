/* "Suggested focus" card on the Practice page. Owner: Ken + Claude.
   Adds a card to the top of Noelle's Practice page (js/stats.js) without editing it: it wraps statsBody().
   Picks up to 2 sections to work on, weighing (1) how the learner is doing there, (2) how much that section
   counts on the real exam (window.EXAM_WEIGHTS: section -> percent), (3) sections not tried yet, and
   (4) questions waiting on the review list. Load after stats.js and before app.js. */
(function () {
  if (typeof statsBody !== "function") return;
  const MIN_ATT = 3;                       // answers needed before a section's % counts
  const W = window.EXAM_WEIGHTS || null;   // e.g. { "I-B": 39, ... }

  function weightOf(sec, total, all) {     // percent of the exam; falls back to the section's share of the bank
    if (W && W[sec] != null) return W[sec];
    return Math.round(total / all * 100);
  }

  function suggestions() {
    const rows = sectionRows(), all = QS.length;
    const rl = {}; for (const q of QS) if (RL[q.id]) rl[q.sec] = (rl[q.sec] || 0) + 1;
    const answered = rows.reduce((a, r) => a + r.att, 0);
    const out = [];
    for (const r of rows) {
      const w = weightOf(r.sec, r.total, all), name = r.name || r.sec, p = r.att ? r.cor / r.att : null;
      if (r.att >= MIN_ATT && p < 0.8) {
        out.push({ sec: r.sec, score: (1 - p) * w + (rl[r.sec] || 0) * 2, src: "all",
          text: `<b>${esc(name)}</b>: you're getting ${Math.round(p * 100)}% right, and it's about ${w}% of the exam${rl[r.sec] ? `. ${rl[r.sec]} question${rl[r.sec] === 1 ? " is" : "s are"} on your review list` : ""}.` });
      } else if (!r.tried && answered) {
        out.push({ sec: r.sec, score: w * 0.45, src: "new",
          text: `<b>${esc(name)}</b>: you haven't tried any of these yet, and it's about ${w}% of the exam.` });
      } else if (rl[r.sec] >= 2) {
        out.push({ sec: r.sec, score: rl[r.sec] * 2, src: "review",
          text: `<b>${esc(name)}</b>: ${rl[r.sec]} questions from here are on your review list.` });
      }
    }
    out.sort((a, b) => b.score - a.score);
    return { list: out.slice(0, 2), answered, rows };
  }

  function card() {
    const { list, answered, rows } = suggestions();
    let body;
    if (!answered) {
      const big = rows.map((r) => ({ r, w: weightOf(r.sec, r.total, QS.length) })).sort((a, b) => b.w - a.w)[0];
      body = `<p class="fhint">Answer a few questions and I'll suggest where to focus.${big ? ` A good place to start: <b>${esc(big.r.name || big.r.sec)}</b>, the biggest part of the exam (about ${big.w}%).` : ""}</p>
        ${big ? `<div class="frow"><button type="button" class="fgo" data-act="focusgo" data-sec="${esc(big.r.sec)}" data-src="all">Practice this</button><button type="button" class="fwhy" data-sec="${esc(big.r.sec)}">Why? See the charts</button></div>` : ""}`;
    } else if (!list.length) {
      body = `<p class="fhint">You're doing well everywhere you've practiced (80% or better). Keep mixing in new questions, or try Exam mode.</p>`;
    } else {
      body = `<ol class="flist">${list.map((s) => `<li><p>${s.text}</p><div class="frow"><button type="button" class="fgo" data-act="focusgo" data-sec="${esc(s.sec)}" data-src="${s.src}">Practice this</button><button type="button" class="fwhy" data-sec="${esc(s.sec)}">Why? See the charts</button></div></li>`).join("")}</ol>
        <p class="fnote">Based on your answers so far${W ? " and the exam outline" : ""}. It updates as you practice.</p>`;
    }
    return `<section class="step fcard" aria-label="Suggested focus"><h2>Suggested focus</h2>${body}</section>`;
  }

  const base = statsBody;
  statsBody = function () {
    const h = base();
    const i = h.indexOf("</div>");   // after the page heading block
    return i < 0 ? card() + h : h.slice(0, i + 6) + card() + h.slice(i + 6);
  };

  window.PAGE_ACTIONS = Object.assign(window.PAGE_ACTIONS || {}, {
    focusgo: (b) => {
      S.build.focus = "task"; S.build.secs = { [b.dataset.sec]: true }; S.build.doms = {}; S.build.tops = {};
      S.build.src = b.dataset.src || "all";
      if (!matching().length) S.build.src = "all";
      const set = buildSet(); if (!set.length) return false;
      S.set = set; S.mode = S.build.mode; newRun(); S.page = "quiz";
    },
  });

  /* ---- "Why?" sheet: ring charts behind a suggestion ---- */
  const DOMW = () => { const o = {}; if (W) for (const k in W) { const d = k.split("-")[0]; o[d] = (o[d] || 0) + W[k]; } return o; };
  function ring(pct, label, sub, opts) {
    opts = opts || {};
    const size = opts.big ? 96 : 64, empty = pct == null, v = empty ? 0 : Math.max(0, Math.min(100, Math.round(pct)));
    const sw = opts.big ? 3.4 : 3.8;
    return `<figure class="fring ${opts.hl ? "hl" : ""} ${opts.early ? "early" : ""}" role="img" aria-label="${esc(label)}: ${empty ? "not tried yet" : v + "%"}${opts.early ? " (early result)" : ""}${sub ? ", " + esc(sub) : ""}">
      <svg width="${size}" height="${size}" viewBox="0 0 36 36" aria-hidden="true">
        <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#E3E7EB" stroke-width="${sw}" ${empty ? 'stroke-dasharray="2 2"' : ""}/>
        ${empty ? "" : `<circle cx="18" cy="18" r="15.9155" fill="none" stroke="${opts.color || "var(--bay, #0B5CAD)"}" stroke-width="${sw}" stroke-linecap="round"
          stroke-dasharray="${Math.max(v, 0.01)} ${100 - v}" stroke-dashoffset="25" transform="rotate(0 18 18)"/>`}
        <text x="18" y="${opts.big ? 20.2 : 20.4}" text-anchor="middle" font-size="${opts.big ? 8 : 8.6}" font-weight="700" fill="#12202E">${empty ? "—" : v + "%"}</text>
      </svg>
      <figcaption><b>${esc(label)}</b>${sub ? `<small>${esc(sub)}</small>` : ""}${opts.early ? `<em>Early: under ${MIN_ATT} answers</em>` : ""}${opts.hl ? `<i>Suggested</i>` : ""}</figcaption></figure>`;
  }
  function groups(by) {
    const o = {};
    for (const q of QS) {
      const k = by === "domain" ? q.domain : by === "topic" ? (q.tgroup || "Other") : q.sec;
      const r = o[k] || (o[k] = { key: k, name: by === "domain" ? (domName(q.domain) || "Domain " + q.domain) : by === "topic" ? k : (q.secName || q.sec), secs: new Set(), total: 0, att: 0, cor: 0 });
      r.total++; r.secs.add(q.sec); const st = ST[q.id]; if (st) { r.att += st.attempts; r.cor += st.correct; }
    }
    const rows = Object.values(o);
    return by === "topic" ? rows.sort((a, b) => b.total - a.total) : rows.sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true }));
  }
  // Each view gets its own ring color so Domain, Task and Topic are easy to tell apart (checked for color-blind safety).
  const BYCOLOR = { domain: "#008F86", task: "#3D5AD6", topic: "#F07800" };
  let WHY = null;   // { sec, by }
  function whySheet() {
    const sec = WHY.sec, by = WHY.by, rows = sectionRows(), r = rows.find((x) => x.sec === sec) || { sec, name: sec, total: 0, tried: 0, att: 0, cor: 0 };
    const w = weightOf(sec, r.total, QS.length), p = r.att ? r.cor / r.att * 100 : null;
    const q0 = QS.find((q) => q.sec === sec) || {}, dW = DOMW();
    const reason = p == null ? `You haven't tried ${esc(r.name || sec)} yet, and it's about ${w}% of the exam, so it's worth a look.`
      : `You're getting ${Math.round(p)}% right in ${esc(r.name || sec)} (${r.att} answer${r.att === 1 ? "" : "s"}), and it's about ${w}% of the exam. A low score in a big area costs the most points.`;
    const g = groups(by).sort((a, b) => {   // weakest first; not-tried areas at the end
      const pa = a.att ? a.cor / a.att : 2, pb = b.att ? b.cor / b.att : 2;
      return pa - pb || b.total - a.total;
    });
    const hlKey = by === "domain" ? q0.domain : by === "topic" ? q0.tgroup : sec;
    const tbar = (x) => {   // Topic view: one sorted bar per topic (20+ topics read better as a list than as rings)
      const pc = x.att ? Math.round(x.cor / x.att * 100) : null, early = x.att > 0 && x.att < MIN_ATT, hl = x.key === hlKey;
      return `<div class="ftb ${hl ? "hl" : ""} ${early ? "early" : ""} ${pc == null ? "nt" : ""}" role="img" aria-label="${esc(x.name)}: ${pc == null ? "not tried yet" : pc + "%, " + x.cor + " of " + x.att + " correct"}${early ? " (early result)" : ""}">
        <span class="ftn">${esc(x.name)}${hl ? "<i>Suggested</i>" : ""}</span><b class="ftp">${pc == null ? "–" : pc + "%"}</b>
        <span class="ftt"><i style="width:${pc || 0}%;background:${BYCOLOR.topic}"></i></span>
        <small class="fts">${pc == null ? "Not tried" : `${x.cor} of ${x.att}${early ? " · early" : ""}`}</small></div>`;
    };
    const grid = by === "topic" ? `<div class="ftbars">${g.map(tbar).join("")}</div>` : g.map((x) => {
      const pc = x.att ? x.cor / x.att * 100 : null;
      const share = by === "domain" ? (dW[x.key] != null ? `${dW[x.key]}% of exam` : "") : by === "task" ? `${weightOf(x.key, x.total, QS.length)}% of exam` : `${x.total} question${x.total === 1 ? "" : "s"}`;
      const lab = by === "domain" ? `${x.key}. ${x.name}` : x.name;
      return ring(pc, lab, (x.att ? `${x.att} answered · ` : "Not tried · ") + share, { hl: x.key === hlKey, early: x.att > 0 && x.att < MIN_ATT, color: BYCOLOR[by] });
    }).join("");
    return `<div class="scrim fwscrim"><div class="dialog fwdlg" role="dialog" aria-modal="true" aria-labelledby="fwT">
      <div class="schead"><h2 id="fwT">Why ${esc(r.name || sec)}?</h2><button type="button" class="vb fwx" aria-label="Close">${ICON.x}</button></div>
      <div class="fwtop">${ring(p, "Your score here", r.att ? `${r.cor} of ${r.att} correct` : "Not tried yet", { big: true, early: r.att > 0 && r.att < MIN_ATT, color: "#3A4654" })}
        <div class="fwshare"><b>About ${w}% of the exam</b><small>How much of the real test comes from this area (exam outline)</small>
          <span class="fwbar" role="img" aria-label="About ${w}% of the exam"><i style="width:${Math.max(2, Math.min(100, w))}%"></i></span></div></div>
      <p class="fwwhy">${reason}</p>
      <h3 class="fwh">How you're doing by</h3>
      <div class="seg fwseg" role="tablist" aria-label="Group by">${[["domain", "Domain"], ["task", "Task"], ["topic", "Topic"]].map(([k, l]) => `<button type="button" role="tab" class="fwtab" data-by="${k}" aria-selected="${by === k}"><span class="fwdot" style="background:${BYCOLOR[k]}"></span>${l}</button>`).join("")}</div>
      <p class="fwhint">${by === "topic" ? `Your % correct by topic, weakest first. Faded bars are early results (under ${MIN_ATT} answers); dashed: not tried yet.` : `Each ring is your % correct, weakest first. Faded rings are early results (under ${MIN_ATT} answers); dashed rings: not tried yet.`}</p>
      ${by === "topic" ? grid : `<div class="fwgrid">${grid}</div>`}
      <button type="button" class="btn fwgo" data-sec="${esc(sec)}">Practice ${esc(r.name || sec)}</button>
    </div></div>`;
  }
  function openWhy() {
    const ph = document.getElementById("phone"); if (!ph) return;
    let box = document.getElementById("fwbox"); if (box) box.remove();
    box = document.createElement("div"); box.id = "fwbox"; box.innerHTML = whySheet(); ph.appendChild(box);
    const sc = box.querySelector(".fwscrim"), theme = document.querySelector(".ob");   // carry the app's theme colors
    if (theme) sc.style.cssText = theme.getAttribute("style") || "";
    box.querySelector(".fwx").focus();
  }
  function closeWhy() { WHY = null; const b = document.getElementById("fwbox"); if (b) b.remove(); }
  document.addEventListener("click", (e) => {
    const t = e.target.closest && e.target.closest(".fwhy, .fwx, .fwtab, .fwgo, .fwscrim");
    if (!t) return;
    if (t.classList.contains("fwhy")) { e.stopPropagation(); WHY = { sec: t.dataset.sec, by: "task" }; openWhy(); return; }
    e.stopPropagation();
    if (t.classList.contains("fwx") || (t.classList.contains("fwscrim") && e.target === t)) return closeWhy();
    if (t.classList.contains("fwtab")) { WHY.by = t.dataset.by; openWhy(); return; }
    if (t.classList.contains("fwgo")) { const sec = t.dataset.sec; closeWhy(); window.PAGE_ACTIONS.focusgo({ dataset: { sec, src: "all" } }); render(); }
  }, true);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && WHY) closeWhy(); });

  const css = document.createElement("style");
  css.textContent = `.fcard { background: #FFF8E6; border: 1.5px solid #EBC46A; border-radius: 14px; padding: 12px 14px; }
.fcard h2 { color: #5A3E00; }
.flist { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 10px; }
.flist p, .fhint { margin: 0 0 6px; font-size: 14px; line-height: 1.45; color: #24313E; }
.fnote { margin: 8px 0 0; font-size: 12px; color: #6A5A3A; }
.frow { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.fwhy { min-height: 40px; padding: 0 12px; border-radius: 10px; border: 1.5px solid #C9D2DC; background: #fff; color: #24313E; font: inherit; font-size: 14px; font-weight: 700; cursor: pointer; }
.fwscrim { position: absolute; inset: 0; background: rgba(18,32,46,.45); display: flex; align-items: flex-end; z-index: 7; }
.fwdlg { gap: 12px; }
.fwtop { display: flex; align-items: center; gap: 16px; }
.fwshare { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.fwshare b { font-size: 16px; color: #12202E; }
.fwshare small { font-size: 12px; line-height: 1.35; color: #5B6672; }
.fwbar { display: block; height: 8px; border-radius: 4px; background: #E3E7EB; overflow: hidden; margin-top: 4px; }
.fwbar i { display: block; height: 100%; border-radius: 4px; background: #8A939E; }
.fring.early svg circle { opacity: .4; }
.ftbars { display: flex; flex-direction: column; gap: 2px; }
.ftb { display: grid; grid-template-columns: 1fr auto; grid-template-areas: "n p" "t s"; column-gap: 10px; row-gap: 4px; align-items: center; padding: 7px 8px; border-radius: 10px; }
.ftb.hl { background: #FFF3D1; box-shadow: inset 0 0 0 2px #E8B13A; }
.ftn { grid-area: n; font-size: 13px; font-weight: 700; color: #24313E; }
.ftn i { display: inline-block; margin-left: 6px; font-style: normal; font-size: 10px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: #6A4A00; }
.ftp { grid-area: p; font-size: 14px; color: #12202E; text-align: right; }
.ftt { grid-area: t; height: 10px; border-radius: 5px; background: #E3E7EB; overflow: hidden; }
.ftt i { display: block; height: 100%; border-radius: 5px; }
.fts { grid-area: s; font-size: 11px; color: #5B6672; text-align: right; min-width: 52px; }
.ftb.early .ftt i { opacity: .4; }
.ftb.nt .ftt { background: none; border: 2px dashed #C9D0D6; height: 6px; }
.fwdot { display: inline-block; width: 9px; height: 9px; border-radius: 5px; margin-right: 5px; vertical-align: 1px; }
.fring figcaption em { display: block; font-style: normal; font-size: 10px; color: #5B6672; margin-top: 2px; }
.fwwhy { margin: 0; font-size: 15px; line-height: 1.45; color: #24313E; }
.fwh { margin: 4px 0 0; font-size: 16px; }
.fwhint { margin: 0; font-size: 12px; color: #5B6672; }
.fwgrid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px 8px; }
.fring { margin: 0; display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center; padding: 6px 2px; border-radius: 12px; }
.fring.hl { background: #FFF3D1; box-shadow: inset 0 0 0 2px #E8B13A; }
.fring figcaption { font-size: 12px; line-height: 1.25; color: #24313E; }
.fring figcaption b { display: block; font-size: 12px; }
.fring figcaption small { display: block; color: #5B6672; font-size: 11px; }
.fring figcaption i { display: inline-block; margin-top: 3px; font-style: normal; font-size: 10px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: #6A4A00; }
.fwtop .fring figcaption b { font-size: 13px; }
.fgo { min-height: 40px; padding: 0 14px; border-radius: 10px; border: 0; background: var(--bay, #0B5CAD); color: #fff; font: inherit; font-size: 14px; font-weight: 700; cursor: pointer; }`;
  document.head.appendChild(css);
})();
