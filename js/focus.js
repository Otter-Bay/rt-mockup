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
        ${big ? `<button type="button" class="fgo" data-act="focusgo" data-sec="${esc(big.r.sec)}" data-src="all">Practice this</button>` : ""}`;
    } else if (!list.length) {
      body = `<p class="fhint">You're doing well everywhere you've practiced (80% or better). Keep mixing in new questions, or try Exam mode.</p>`;
    } else {
      body = `<ol class="flist">${list.map((s) => `<li><p>${s.text}</p><button type="button" class="fgo" data-act="focusgo" data-sec="${esc(s.sec)}" data-src="${s.src}">Practice this</button></li>`).join("")}</ol>
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

  const css = document.createElement("style");
  css.textContent = `.fcard { background: #FFF8E6; border: 1.5px solid #EBC46A; border-radius: 14px; padding: 12px 14px; }
.fcard h2 { color: #5A3E00; }
.flist { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 10px; }
.flist p, .fhint { margin: 0 0 6px; font-size: 14px; line-height: 1.45; color: #24313E; }
.fnote { margin: 8px 0 0; font-size: 12px; color: #6A5A3A; }
.fgo { min-height: 40px; padding: 0 14px; border-radius: 10px; border: 0; background: var(--bay, #0B5CAD); color: #fff; font: inherit; font-size: 14px; font-weight: 700; cursor: pointer; }`;
  document.head.appendChild(css);
})();
