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
        ${big ? `<div class="frow"><button type="button" class="fgo" data-act="focusgo" data-sec="${esc(big.r.sec)}" data-src="all">Practice this</button></div>` : ""}`;
    } else if (!list.length) {
      body = `<p class="fhint">You're doing well everywhere you've practiced (80% or better). Keep mixing in new questions, or try Exam mode.</p>`;
    } else {
      body = `<ol class="flist">${list.map((s) => `<li><p>${s.text}</p><div class="frow"><button type="button" class="fgo fchoose" data-sec="${esc(s.sec)}">Practice this</button></div></li>`).join("")}</ol>
        <p class="fnote">Based on your answers so far${W ? " and the exam outline" : ""}. It updates as you practice.</p>`;
    }
    return `<section class="step fcard" aria-label="Suggested focus"><h2>Suggested focus</h2>${body}</section>`;
  }

  const base = statsBody;
  statsBody = function () {
    const h = base();
    const i = h.indexOf("</div>");   // after the page heading block
    const btn = `<button type="button" class="fwhy fcharts" data-all="1"><span class="fcring" aria-hidden="true"></span><span><b>See your charts</b><small>Your scores by domain, task and topic</small></span><span class="fcgo" aria-hidden="true">›</span></button>`;
    const vs = Object.values(ST), up = upFrom(vs.filter((x) => x.lastCorrect).length, vs.length, vs.reduce((a, x) => a + x.correct, 0), vs.reduce((a, x) => a + x.attempts, 0));
    const upRow = up ? `<div class="fuprow">${up}<span class="fupnote">Your retries are paying off.</span></div>` : "";
    return i < 0 ? upRow + btn + card() + h : h.slice(0, i + 6) + upRow + btn + card() + h.slice(i + 6);
  };

  window.PAGE_ACTIONS = Object.assign(window.PAGE_ACTIONS || {}, {
    focusgo: (b) => {
      const by = b.dataset.by || "task", key = b.dataset.key || b.dataset.sec;
      S.build.focus = by; S.build.secs = by === "task" ? { [key]: true } : {}; S.build.doms = by === "domain" ? { [key]: true } : {}; S.build.tops = by === "topic" ? { [key]: true } : {};
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
    return `<figure class="fring ${opts.hl ? "hl" : ""} ${opts.early ? "early" : ""}" ${opts.deco ? 'aria-hidden="true" data-x="' : 'role="img" aria-label="'}${esc(label)}: ${empty ? "not tried yet" : v + "%"}${opts.early ? " (early result)" : ""}${sub ? ", " + esc(sub) : ""}">
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
      const r = o[k] || (o[k] = { key: k, name: by === "domain" ? (domName(q.domain) || "Domain " + q.domain) : by === "topic" ? k : (q.secName || q.sec), secs: new Set(), total: 0, att: 0, cor: 0, allAtt: 0, allCor: 0 });
      r.total++; r.secs.add(q.sec); const st = ST[q.id]; if (st) { r.att += 1; r.cor += st.lastCorrect ? 1 : 0; r.allAtt += st.attempts; r.allCor += st.correct; }   // latest try per question
    }
    const rows = Object.values(o);
    return by === "topic" ? rows.sort((a, b) => b.total - a.total) : rows.sort((a, b) => a.key.localeCompare(b.key, undefined, { numeric: true }));
  }
  // Each view gets its own ring color so Domain, Task and Topic are easy to tell apart (checked for color-blind safety).
  const BYCOLOR = { domain: "#008F86", task: "#3D5AD6", topic: "#6E4BC2" };
  const KEY = () => `<div class="fwkey" id="fwkey" hidden><b>How to read these charts</b><ul>
        <li><b>Ring or bar</b> = your % right in that area, counting your <b>latest try</b> at each question. Get one right on a retry and it counts as right.</li>
        <li><b>Faded</b> = early result. You've tried fewer than ${MIN_ATT} questions there, so the number could change a lot. Answer a few more to firm it up.</li>
        <li><b>Dashed</b> = not tried yet.</li>
        <li><b>Gold box, "Suggested"</b> = where we recommend practicing next.</li>
        <li><b>Colors</b> = which view you're on: <span class="fwdot" style="background:${BYCOLOR.domain}"></span>Domain, <span class="fwdot" style="background:${BYCOLOR.task}"></span>Task, <span class="fwdot" style="background:${BYCOLOR.topic}"></span>Topic.</li>
        <li><b>Weakest first</b> = the areas needing the most work are at the top.</li></ul></div>`;
  const TABS = (by) => [["domain", "Domain"], ["task", "Task"], ["topic", "Topic"]].map(([k, l]) => `<button type="button" role="tab" class="fwtab" data-by="${k}" aria-selected="${by === k}"><span class="fwdot" style="background:${BYCOLOR[k]}"></span>${l}</button>`).join("");
  let WHY = null;   // { sec, by }
  function whySheet() {
    if (WHY.all) return allSheet();
    if (WHY.choose) return chooseSheet();
    const sec = WHY.sec, by = WHY.by, rows = sectionRows(), r = rows.find((x) => x.sec === sec) || { sec, name: sec, total: 0, tried: 0, att: 0, cor: 0 };
    const w = weightOf(sec, r.total, QS.length), p = r.att ? r.cor / r.att * 100 : null;
    const q0 = QS.find((q) => q.sec === sec) || {}, dW = DOMW();
    const reason = p == null ? `You haven't tried ${esc(r.name || sec)} yet, and it's about ${w}% of the exam, so it's worth a look.`
      : `You're getting ${Math.round(p)}% right in ${esc(r.name || sec)} (${r.att} answer${r.att === 1 ? "" : "s"}), and it's about ${w}% of the exam. A low score in a big area costs the most points.`;
    const hlKey = by === "domain" ? q0.domain : by === "topic" ? q0.tgroup : sec;
    const grid = gridFor(by, (k) => k === hlKey);
    return `<div class="scrim fwscrim"><div class="dialog fwdlg" role="dialog" aria-modal="true" aria-labelledby="fwT">
      <div class="schead"><h2 id="fwT">Why ${esc(r.name || sec)}?</h2><button type="button" class="vb fwx" aria-label="Close">${ICON.x}</button></div>
      <div class="fwtop">${ring(p, "Your score here", r.att ? `${r.cor} of ${r.att} right` : "Not tried yet", { big: true, early: r.att > 0 && r.att < MIN_ATT, color: "#3A4654" })}
        <div class="fwshare">${upFrom(r.cor, r.att, r.allCor, r.allAtt)}<b>About ${w}% of the exam</b><small>How much of the real test comes from this area (exam outline)</small>
          <span class="fwbar" role="img" aria-label="About ${w}% of the exam"><i style="width:${Math.max(2, Math.min(100, w))}%"></i></span></div></div>
      <p class="fwwhy">${reason}</p>
      <div class="fwhrow"><h3 class="fwh">Your scores by area</h3><button type="button" class="fwinfo" aria-expanded="false" aria-controls="fwkey" aria-label="How to read these charts">i</button></div>
      ${KEY()}
      <div class="seg fwseg" role="tablist" aria-label="Group by">${TABS(by)}</div>
      <p class="fwhint">${by === "topic" ? `Your % correct by topic, weakest first. Tap any bar to see where it ranks and practice it.` : `Each ring is your % correct, weakest first. Tap any ring to see where it ranks and practice it.`}</p>
      ${grid}
      <button type="button" class="btn fwgo" data-sec="${esc(sec)}">Practice ${esc(r.name || sec)}</button>
    </div>${tray()}${pickCard()}</div>`;
  }
  // "Up from" line: latest-try score vs. the average of every try ever (only shown when it's a real improvement).
  const upFrom = (c, n, aC, aA) => { if (!n || !aA || aA <= n) return ""; const now = Math.round(c / n * 100), all = Math.round(aC / aA * 100);
    return now - all >= 3 ? `<span class="fup"><b><span aria-hidden="true">▲</span> Up ${now - all} point${now - all === 1 ? "" : "s"}</b><small>from ${all}% counting every try</small></span>` : ""; };
  let LASTHL = () => false;
  // "My set": areas picked across Domain / Task / Topic, practiced together. Keys look like "task|I-B".
  const SEL = () => (WHY.sel = WHY.sel || new Set());
  const keyOf = (by, q) => by === "domain" ? q.domain : by === "topic" ? (q.tgroup || "Other") : q.sec;
  function selIdx() { const out = []; const sel = [...SEL()].map((s) => s.split("|")); for (const ix of ALL) { const q = QS[ix]; if (sel.some(([by, k]) => keyOf(by, q) === k)) out.push(ix); } return out; }
  function selName(s) { const [by, k] = s.split("|"); const g = groups(by).find((x) => x.key === k); return g ? (by === "domain" ? `${k}. ${g.name}` : g.name) : k; }
  /* Coach line in the set tray: one gentle suggestion about the current picks (never blocks starting).
     Judges an area only after JUDGE answers there. Order: removed something needed > missed something big >
     picked something already strong > set too small or too big > (rarely) a good mix. */
  const JUDGE = 5;
  function setCoach(n) {
    if (!WHY || !n || (window.COACH_OFF && window.COACH_OFF())) return "";
    const D = WHY.dismissed || (WHY.dismissed = new Set()), sel = SEL();
    const tasks = ranked("task"), tOf = (k) => tasks.find((x) => x.key === k);
    const picked = new Set(selIdx().map((ix) => QS[ix].sec));                 // tasks the set covers, however they were picked
    const pc = (x) => Math.round(x.p * 100), judged = tasks.filter((x) => x.att >= JUDGE && x.p != null);
    const lowest = judged.slice().sort((a, b) => a.p - b.p)[0];
    const info = (k) => { const [by, key] = k.split("|"); const x = ranked(by).find((y) => y.key === key); return x && Object.assign({ by, k }, x); };
    const say = (id, html, btn) => D.has(id) ? null : { id, html, btn };
    const pick = [];
    // 1. Took out something they need
    if (WHY.removed && !sel.has(WHY.removed)) {
      const x = info(WHY.removed);
      if (x && x.att >= JUDGE && x.p != null && x.p < 0.85) {
        const nm = esc(x.by === "domain" ? `${x.key}. ${x.name}` : x.name);
        pick.push(say("rm|" + x.k, `You took out <b>${nm}</b>. ${lowest && x.by === "task" && lowest.key === x.key ? `It's your lowest score (${pc(x)}%)` : `You're at ${pc(x)}% there`}, so it might be worth keeping.`,
          `<button type="button" class="fwcact" data-add="${esc(x.k)}">Put it back</button>`));
      }
    }
    // 2. Missed something big: the top practice priority isn't in the set
    const top = tasks.find((x) => x.att >= JUDGE && x.p != null && (x.p < 0.9 || x.rl > 0));
    if (top && !picked.has(top.key)) pick.push(say("add|" + top.key, `<b>${esc(top.name)}</b> is about ${top.w}% of the exam${top.rl ? ` and has ${top.rl} of your misses` : ` and you're at ${pc(top)}%`}. Might be worth adding?`,
      `<button type="button" class="fwcact" data-add="task|${esc(top.key)}">Add it</button>`));
    // 3. Picked something already strong while a weaker area is left out
    const strong = [...picked].map(tOf).filter((x) => x && x.att >= JUDGE && x.p != null && x.p >= 0.9 && !x.rl).sort((a, b) => b.p - a.p)[0];
    const weak = tasks.find((x) => x.att >= JUDGE && x.p != null && x.p < 0.9 && !picked.has(x.key));
    if (strong && weak) pick.push(say("strong|" + strong.key, `You're at ${pc(strong)}% in <b>${esc(strong.name)}</b>. Fine as a refresher, though practice might help your score more in <b>${esc(weak.name)}</b>.`));
    // 4. Size
    if (n < 10) pick.push(say("small|" + n, `That's only ${n} question${n === 1 ? "" : "s"}. Adding another area or two might make a better session.`));
    else if (n > 100) pick.push(say("big|" + n, `That's ${n} questions, a long session. Fine if you have time, or you might pick fewer areas.`));
    // 5. A good mix (only after they've changed something, so it stays rare)
    const top2 = tasks.filter((x) => x.att >= JUDGE && x.p != null && x.p < 0.9).slice(0, 2);
    if (WHY.touched && top2.length && top2.every((x) => picked.has(x.key))) pick.push(say("good", "Good mix: this covers the areas where practice should help your score most."));
    const m = pick.find(Boolean); if (!m) return "";
    return `<div class="fwcoach" role="status"><span class="coachav" aria-hidden="true">🦦</span><p>${m.html}</p>${m.btn || ""}<button type="button" class="fwcx" data-m="${esc(m.id)}" aria-label="Dismiss this tip">×</button></div>`;
  }
  function tray() {
    const sel = SEL(); if (!sel.size) return "";
    const n = selIdx().length;
    return `<div class="fwtray" role="region" aria-label="My practice set">${setCoach(n)}<div class="fwchips">${[...sel].map((s) => `<button type="button" class="fwchip" data-s="${esc(s)}" aria-label="Remove ${esc(selName(s))}"><span class="fwdot" style="background:${BYCOLOR[s.split("|")[0]]}"></span>${esc(selName(s))} <b aria-hidden="true">×</b></button>`).join("")}</div>
      ${setOpts(n, sel.size)}</div>`;
  }
  /* How many, and how (Nov 9 meeting): pick 10, 20 or 50 and Study, Exam or Flashcards right here, or cancel.
     Asking for more than the ticked areas hold tops the set up with questions not tried yet from other areas. */
  const MODES = [["study", "Study"], ["exam", "Exam"], ["flash", "Flashcards"]];
  function setCount() { return Number(WHY.count || S.build.count || 10) || 10; }
  function setMode() { return WHY.mode || S.build.mode || "study"; }
  function setOpts(n, areas) {
    const want = setCount(), mode = setMode(), extra = Math.max(0, Math.min(want, ALL.length) - n), total = Math.min(want, ALL.length);
    const noun = mode === "flash" ? "card" : "question";
    return `<div class="fwopts"><div class="fwrow"><span class="fwlbl">How many</span><div class="fwseg" role="group" aria-label="How many questions">${["10", "20", "50"].map((v) => `<button type="button" class="fwcnt" data-n="${v}" aria-pressed="${String(want) === v}">${v}</button>`).join("")}</div></div>
      <div class="fwrow"><span class="fwlbl">How</span><div class="fwseg" role="group" aria-label="Practice mode">${MODES.map(([k, l]) => `<button type="button" class="fwmode" data-m="${k}" aria-pressed="${mode === k}">${l}</button>`).join("")}</div></div>
      ${want > ALL.length ? `<p class="askhint">This mock-up has only ${ALL.length} sample questions, so a set tops out at ${ALL.length}. The full app will have more.</p>` : ""}
      ${n && extra ? `<p class="fwextra">${areas === 1 ? "This area has" : "These areas have"} ${n} question${n === 1 ? "" : "s"}, so ${extra} new one${extra === 1 ? "" : "s"} from other areas ${extra === 1 ? "is" : "are"} added.</p>` : ""}
      <div class="fwgo2"><button type="button" class="btn grey fwcancel">Cancel</button><button type="button" class="btn fwsetgo" ${n ? "" : "disabled"}>${n ? `Start ${total} ${noun}${total === 1 ? "" : "s"}` : "No sample questions in these yet"}</button></div></div>`;
  }
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function buildFromSel() {
    const want = setCount(), mine = shuffle(selIdx()), have = new Set(mine);
    if (mine.length >= want) return mine.slice(0, want);
    const others = ALL.filter((ix) => !have.has(ix)), fresh = shuffle(others.filter((ix) => !ST[QS[ix].id])), tried = shuffle(others.filter((ix) => ST[QS[ix].id]));
    return mine.concat(fresh, tried).slice(0, want);
  }
  function gridFor(by, isHl) {
    LASTHL = isHl;
    const g = groups(by).sort((a, b) => { const pa = a.att ? a.cor / a.att : 2, pb = b.att ? b.cor / b.att : 2; return pa - pb || b.total - a.total; });
    const dW = DOMW();
    const lbl = (x, pc) => `${esc(x.name)}: ${pc == null ? "not tried yet" : pc + "% correct, " + x.cor + " of " + x.att}${x.att > 0 && x.att < MIN_ATT ? " (early result)" : ""}${isHl(x.key) ? ", suggested" : ""}. Tap to include it in your practice set or leave it out.`;
    const btn = (x, pc, inner) => { const on = SEL().has(by + "|" + x.key); return `<button type="button" class="fpick ${on ? "picked" : ""}" data-by="${by}" data-key="${esc(x.key)}" role="checkbox" aria-checked="${on}" aria-label="${lbl(x, pc)}">${inner}<span class="fpchk ${on ? "" : "off"}" aria-hidden="true">${on ? "✓" : ""}</span></button>`; };
    if (by === "topic") return `<div class="ftbars">${g.map((x) => {
      const pc = x.att ? Math.round(x.cor / x.att * 100) : null, early = x.att > 0 && x.att < MIN_ATT, hl = isHl(x.key);
      return btn(x, pc, `<div class="ftb ${hl ? "hl" : ""} ${early ? "early" : ""} ${pc == null ? "nt" : ""}" aria-hidden="true">
        <span class="ftn">${esc(x.name)}${hl ? "<i>Suggested</i>" : ""}</span><b class="ftp">${pc == null ? "–" : pc + "%"}</b>
        <span class="ftt"><i style="width:${pc || 0}%;background:${BYCOLOR.topic}"></i></span>
        <small class="fts">${pc == null ? "Not tried" : `${x.cor} of ${x.att}${early ? " · early" : ""}`}</small></div>`); }).join("")}</div>`;
    return `<div class="fwgrid">${g.map((x) => {
      const pc = x.att ? x.cor / x.att * 100 : null;
      const share = by === "domain" ? (dW[x.key] != null ? `${dW[x.key]}% of exam` : "") : `${weightOf(x.key, x.total, QS.length)}% of exam`;
      return btn(x, pc == null ? null : Math.round(pc), ring(pc, by === "domain" ? `${x.key}. ${x.name}` : x.name, (x.att ? `${x.att} tried · ` : "Not tried · ") + share, { hl: isHl(x.key), early: x.att > 0 && x.att < MIN_ATT, color: BYCOLOR[by], deco: true }));
    }).join("")}</div>`;
  }
  // Where an area ranks for practice: same idea as Suggested focus (low score x big share of the exam, plus review-list misses).
  function shareOf(by, x) { const dW = DOMW(); return by === "task" ? weightOf(x.key, x.total, QS.length) : by === "domain" && dW[x.key] != null ? dW[x.key] : Math.round(x.total / QS.length * 100); }
  function ranked(by) {
    const rl = {}; for (const q of QS) if (RL[q.id]) { const k = by === "domain" ? q.domain : by === "topic" ? (q.tgroup || "Other") : q.sec; rl[k] = (rl[k] || 0) + 1; }
    return groups(by).map((x) => {
      const w = shareOf(by, x), p = x.att ? x.cor / x.att : null;
      const score = p == null ? w * 0.45 : x.att < MIN_ATT ? (1 - p) * w * 0.6 + w * 0.2 + (rl[x.key] || 0) * 2 : (1 - p) * w + (rl[x.key] || 0) * 2;
      return Object.assign({}, x, { w, p, rl: rl[x.key] || 0, score });
    }).sort((a, b) => b.score - a.score);
  }
  const NOUN = { domain: ["domain", "domains"], task: ["task", "tasks"], topic: ["topic", "topics"] };
  function pickCard() {
    if (!WHY.pick) return "";
    const { by, key } = WHY.pick, list = ranked(by), i = list.findIndex((x) => x.key === key), x = list[i];
    if (!x) return "";
    const n = list.length, rank = i + 1, pc = x.p == null ? null : Math.round(x.p * 100), hl = LASTHL(key);
    const name = by === "domain" ? `${x.key}. ${x.name}` : x.name;
    const why = hl || rank === 1 ? "This is one of the areas we'd suggest most. Great pick."
      : x.p == null ? "You haven't tried this yet. Practicing here also makes your suggestions more accurate."
      : x.p >= 0.8 ? "You're already strong here (80% or better). Practicing keeps it fresh and builds confidence, so it's a fine choice too."
      : rank <= Math.ceil(n / 2) ? "Good choice. It's in the top half of areas where practice will help your score most."
      : "Any practice helps. This one's lower on the list, so mix in a suggested area when you can.";
    const avail = ALL.filter((ix) => { const q = QS[ix]; return (by === "domain" ? q.domain : by === "topic" ? (q.tgroup || "Other") : q.sec) === key; }).length;
    return `<div class="fpscrim"><div class="fpcard" role="dialog" aria-modal="true" aria-labelledby="fpT">
      <p class="fpkind"><span class="fwdot" style="background:${BYCOLOR[by]}"></span>${by === "domain" ? "Domain" : by === "task" ? "Task" : "Topic"}${hl ? ` <i>Suggested</i>` : ""}</p>
      <h3 id="fpT">${esc(name)}</h3>
      <dl class="fpdl">
        <div><dt>Your score</dt><dd>${pc == null ? "Not tried yet" : `${pc}% <small>(${x.cor} of ${x.att} right${x.att < MIN_ATT ? ", early result" : ""})</small>${upFrom(x.cor, x.att, x.allCor, x.allAtt)}`}</dd></div>
        <div><dt>Share of the exam</dt><dd>About ${x.w}%</dd></div>
        <div><dt>Practice priority</dt><dd>#${rank} of ${n} ${NOUN[by][1]} <span class="fprank" aria-hidden="true"><i style="width:${Math.round((n - rank + 1) / n * 100)}%"></i></span></dd></div>
      </dl>
      <p class="fpwhy">${why}</p>
      ${avail ? "" : `<p class="fpnone">The mock-up's 20 sample questions don't cover this ${NOUN[by][0]} yet. The full app will.</p>`}
      <div class="fpbtns">${avail ? `<button type="button" class="btn fpgo">Practice this ${NOUN[by][0]}</button>` : ""}
        </div>
      <button type="button" class="fpx">Back to charts</button>
    </div></div>`;
  }
  function chooseSheet() {   // "Practice this" on a suggestion: start with it, offer to add others
    const by = WHY.by, first = WHY.choose, list = ranked(by), sel = SEL(), sug = new Set(suggestions().list.map((x) => x.sec));
    const fname = selName((WHY.chooseBy || "task") + "|" + first);
    const rows = list.map((x, i) => {
      const k = by + "|" + x.key, on = sel.has(k), pc = x.p == null ? null : Math.round(x.p * 100);
      const isSug = by === "task" && sug.has(x.key);
      const n = ALL.filter((ix) => keyOf(by, QS[ix]) === x.key).length;
      return `<button type="button" class="fcrow ${on ? "on" : ""}" data-s="${esc(k)}" role="checkbox" aria-checked="${on}">
        <span class="fcbox" aria-hidden="true">${on ? "✓" : ""}</span>
        <span class="fcname"><b>${esc(by === "domain" ? `${x.key}. ${x.name}` : x.name)}</b>${isSug ? "<i>Suggested</i>" : ""}
          <small>${pc == null ? "Not tried yet" : `${pc}% right`} · about ${x.w}% of exam${n ? "" : " · no sample questions yet"}</small></span>
        <span class="fcpri" title="Practice priority">#${i + 1}</span></button>`;
    }).join("");
    return `<div class="scrim fwscrim"><div class="dialog fwdlg" role="dialog" aria-modal="true" aria-labelledby="fwT">
      <div class="schead"><h2 id="fwT">Practice ${esc(fname)}</h2><button type="button" class="vb fwx" aria-label="Close">${ICON.x}</button></div>
      <p class="fcq"><b>Want to add any other areas?</b> Tick as many as you like. They're listed by practice priority: #1 is where practice should help your score most.</p>
      <div class="seg fwseg" role="tablist" aria-label="Group by">${TABS(by)}</div>
      <div class="fclist">${(() => { const allOn = list.every((x) => sel.has(by + "|" + x.key));
        return `<button type="button" class="fcrow fcall ${allOn ? "on" : ""}" data-all="${by}" role="checkbox" aria-checked="${allOn}"><span class="fcbox" aria-hidden="true">${allOn ? "✓" : ""}</span>
          <span class="fcname"><b>All ${NOUN[by][1]}</b><small>${allOn ? "Tap to clear them all" : `Tick all ${list.length} at once`}</small></span><span></span></button>`; })()}${rows}</div>
      <button type="button" class="fcjust">Just ${esc(fname)}</button>
    </div>${tray()}</div>`;
  }
  function allSheet() {   // "See your charts": the whole picture, with the suggested areas highlighted
    const by = WHY.by, { list } = suggestions(), secs = new Set(list.map((x) => x.sec));
    const keys = new Set();
    if (by === "topic") groups("topic").filter((x) => x.att >= MIN_ATT && x.cor / x.att < 0.8).sort((a, b) => a.cor / a.att - b.cor / b.att).slice(0, 2).forEach((x) => keys.add(x.key));   // 2 weakest topics
    else for (const q of QS) if (secs.has(q.sec)) keys.add(by === "domain" ? q.domain : q.sec);
    const att = Object.values(ST).length, cor = Object.values(ST).filter((x) => x.lastCorrect).length, allA = Object.values(ST).reduce((a, x) => a + x.attempts, 0), allC = Object.values(ST).reduce((a, x) => a + x.correct, 0);
    const tried = QS.filter((q) => ST[q.id]).length, p = att ? cor / att * 100 : null;
    return `<div class="scrim fwscrim"><div class="dialog fwdlg" role="dialog" aria-modal="true" aria-labelledby="fwT">
      <div class="schead"><h2 id="fwT">Your charts</h2><button type="button" class="vb fwx" aria-label="Close">${ICON.x}</button></div>
      <div class="fwtop">${ring(p, "Overall", att ? `${cor} of ${att} right` : "Not started yet", { big: true, color: "#3A4654" })}
        <div class="fwshare"><b>${tried} of ${QS.length} questions tried</b>${upFrom(cor, att, allC, allA)}<small>${list.length ? "Gold boxes are the areas we suggest practicing next." : "Answer more questions to get suggestions."}</small>
          <span class="fwbar" role="img" aria-label="${tried} of ${QS.length} tried"><i style="width:${Math.max(2, Math.round(tried / Math.max(1, QS.length) * 100))}%"></i></span></div></div>
      <div class="fwhrow"><h3 class="fwh">Your scores by area</h3><button type="button" class="fwinfo" aria-expanded="false" aria-controls="fwkey" aria-label="How to read these charts">i</button></div>
      ${KEY()}
      <div class="seg fwseg" role="tablist" aria-label="Group by">${TABS(by)}</div>
      <p class="fwhint">Tick any ${by === "topic" ? "bar" : "ring"} to add it to your practice set; tap again to take it out.${!list.length ? "" : by === "task" ? " The suggested ones start ticked." : " Gold ones are suggested."}</p>
      ${gridFor(by, (k) => keys.has(k))}
    </div>${tray()}</div>`;
  }
  function preselect() { WHY.sel = new Set(suggestions().list.map((x) => "task|" + x.sec)); }
  window.__focusSuggest = () => suggestions().list.map((x) => x.sec);   // used by the coach's one-time tips
  window.openCharts = function () { WHY = { all: true, by: "task" }; preselect(); openWhy(); };
  function openWhy() {
    const ph = document.getElementById("phone"); if (!ph) return;
    let box = document.getElementById("fwbox"); if (box) box.remove();
    box = document.createElement("div"); box.id = "fwbox"; box.innerHTML = whySheet(); ph.appendChild(box);
    const sc = box.querySelector(".fwscrim"), theme = document.querySelector(".ob");   // carry the app's theme colors
    if (theme) sc.style.cssText = theme.getAttribute("style") || "";
    const dl = box.querySelector(".fwdlg"); if (dl && WHY.scroll) dl.scrollTop = WHY.scroll;
    (box.querySelector(".fpgo, .fpx") || box.querySelector(".fwx")).focus();
  }
  function closeWhy() { WHY = null; const b = document.getElementById("fwbox"); if (b) b.remove(); }
  document.addEventListener("click", (e) => {
    const inf = e.target.closest && e.target.closest(".fwinfo");
    if (inf) { e.stopPropagation(); const k = document.getElementById("fwkey"), open = k.hidden; k.hidden = !open; inf.setAttribute("aria-expanded", String(open)); return; }
    const ch = e.target.closest && e.target.closest(".fchoose");
    if (ch) { e.stopPropagation(); WHY = { choose: ch.dataset.sec, chooseBy: "task", by: "task", sel: new Set(["task|" + ch.dataset.sec]) }; openWhy(); return; }
    const cr = e.target.closest && e.target.closest(".fcrow, .fcjust");
    if (cr && WHY) {
      e.stopPropagation();
      if (cr.classList.contains("fcjust")) { const key = WHY.choose, by = WHY.chooseBy || "task"; closeWhy(); window.PAGE_ACTIONS.focusgo({ dataset: { by, key, src: "all" } }); render(); return; }
      const S2 = SEL();
      if (cr.dataset.all) { const by = cr.dataset.all, keys = ranked(by).map((x) => by + "|" + x.key), allOn = keys.every((k) => S2.has(k));
        keys.forEach((k) => allOn ? S2.delete(k) : S2.add(k)); if (allOn && WHY.choose) S2.add((WHY.chooseBy || "task") + "|" + WHY.choose);
        WHY.scroll = document.querySelector(".fwdlg").scrollTop; openWhy(); const a2 = document.querySelector(".fcall"); if (a2) a2.focus(); return; }
      const k = cr.dataset.s; if (S2.has(k)) { S2.delete(k); WHY.removed = k; } else { S2.add(k); if (WHY.removed === k) WHY.removed = null; } WHY.touched = true; WHY.scroll = document.querySelector(".fwdlg").scrollTop; openWhy();
      const again = document.querySelector(`.fcrow[data-s="${CSS.escape(k)}"]`); if (again) again.focus(); return;
    }
    const pk = e.target.closest && e.target.closest(".fpick, .fpx, .fpgo, .fpadd, .fwchip, .fwsetgo, .fpscrim, .fwcact, .fwcx, .fwcnt, .fwmode, .fwcancel");
    if (pk && WHY) {
      e.stopPropagation();
      if (pk.classList.contains("fwcact")) { const k = pk.dataset.add; SEL().add(k); if (WHY.removed === k) WHY.removed = null; WHY.touched = true; WHY.scroll = document.querySelector(".fwdlg").scrollTop; openWhy(); return; }
      if (pk.classList.contains("fwcx")) { (WHY.dismissed || (WHY.dismissed = new Set())).add(pk.dataset.m); WHY.scroll = document.querySelector(".fwdlg").scrollTop; openWhy(); return; }
      if (pk.classList.contains("fpick")) {   // tick or untick this area for the practice set
        const k = pk.dataset.by + "|" + pk.dataset.key, S2 = SEL(); if (S2.has(k)) { S2.delete(k); WHY.removed = k; } else { S2.add(k); if (WHY.removed === k) WHY.removed = null; } WHY.touched = true;
        WHY.scroll = document.querySelector(".fwdlg").scrollTop; openWhy();
        const again = document.querySelector(`.fpick[data-by="${pk.dataset.by}"][data-key="${CSS.escape(pk.dataset.key)}"]`); if (again) again.focus(); return; }
      // Practicing an area from the charts opens the same chooser as Suggested focus, with that area ticked, so more can be added.
      if (pk.classList.contains("fpgo")) { const { by, key } = WHY.pick; WHY = { choose: key, chooseBy: by, by, sel: new Set([by + "|" + key]) }; openWhy(); return; }
      if (pk.classList.contains("fpadd")) { const k = WHY.pick.by + "|" + WHY.pick.key, S2 = SEL(); S2.has(k) ? S2.delete(k) : S2.add(k); WHY.pick = null; openWhy(); return; }
      if (pk.classList.contains("fwchip")) { SEL().delete(pk.dataset.s); WHY.removed = pk.dataset.s; WHY.touched = true; WHY.scroll = document.querySelector(".fwdlg").scrollTop; openWhy(); return; }
      if (pk.classList.contains("fwcnt")) { WHY.count = pk.dataset.n; WHY.scroll = document.querySelector(".fwdlg").scrollTop; openWhy(); const b2 = document.querySelector(`.fwcnt[data-n="${pk.dataset.n}"]`); if (b2) b2.focus(); return; }
      if (pk.classList.contains("fwmode")) { WHY.mode = pk.dataset.m; WHY.scroll = document.querySelector(".fwdlg").scrollTop; openWhy(); const b2 = document.querySelector(`.fwmode[data-m="${pk.dataset.m}"]`); if (b2) b2.focus(); return; }
      if (pk.classList.contains("fwcancel")) { closeWhy(); return; }
      if (pk.classList.contains("fwsetgo")) { if (!selIdx().length) return; const set = buildFromSel(), mode = setMode(); S.build.count = String(setCount()); S.build.mode = mode; closeWhy();
        S.set = set; S.mode = mode; newRun(); S.page = "quiz"; render(); return; }
      if (pk.classList.contains("fpx") || (pk.classList.contains("fpscrim") && e.target === pk)) { WHY.pick = null; openWhy(); return; }
      return;
    }
    const t = e.target.closest && e.target.closest(".fwhy, .fwx, .fwtab, .fwgo, .fwscrim");
    if (!t) return;
    if (t.classList.contains("fwhy")) { e.stopPropagation(); WHY = t.dataset.all ? { all: true, by: "task" } : { sec: t.dataset.sec, by: "task" }; if (WHY.all) preselect(); openWhy(); return; }
    e.stopPropagation();
    if (t.classList.contains("fwx") || (t.classList.contains("fwscrim") && e.target === t)) return closeWhy();
    if (t.classList.contains("fwtab")) { WHY.by = t.dataset.by; WHY.pick = null; WHY.scroll = 0; openWhy(); return; }
    if (t.classList.contains("fwgo")) { const sec = t.dataset.sec; closeWhy(); window.PAGE_ACTIONS.focusgo({ dataset: { sec, src: "all" } }); render(); }
  }, true);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && WHY) { if (WHY.pick) { WHY.pick = null; openWhy(); } else closeWhy(); } });

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
.fwhrow { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
.fwhrow .fwh { margin: 0; }
.fwinfo { width: 26px; height: 26px; border-radius: 13px; border: 1.5px solid #8A939E; background: #fff; color: #3A4654; font: inherit; font-size: 14px; font-weight: 800; font-style: italic; font-family: Georgia, serif; cursor: pointer; padding: 0; line-height: 1; }
.fwinfo[aria-expanded="true"] { background: #3A4654; color: #fff; border-color: #3A4654; }
.fwinfo:focus-visible { outline: 3px solid #8CC4FF; outline-offset: 2px; }
.fwkey { background: #F3F5F7; border-radius: 12px; padding: 10px 12px; font-size: 13px; line-height: 1.45; color: #24313E; }
.fwkey ul { margin: 6px 0 0; padding-left: 18px; display: flex; flex-direction: column; gap: 4px; }
.fcharts { width: 100%; display: flex; align-items: center; gap: 12px; text-align: left; min-height: 64px; padding: 10px 14px; margin: 0 0 12px; border-radius: 14px; border: 2px solid #3A4654; background: #fff; color: #12202E; font: inherit; cursor: pointer; box-shadow: 0 2px 8px rgba(18,32,46,.08); }
.fcharts b { display: block; font-size: 16px; } .fcharts small { display: block; font-size: 12px; color: #5B6672; font-weight: 400; }
.fcharts > span:nth-child(2) { flex: 1; }
.fcring { width: 34px; height: 34px; flex-shrink: 0; border-radius: 50%; background: conic-gradient(#008F86 0 33%, #3D5AD6 0 66%, #6E4BC2 0); -webkit-mask: radial-gradient(circle, transparent 10px, #000 11px); mask: radial-gradient(circle, transparent 10px, #000 11px); }
.fcgo { font-size: 26px; color: #5B6672; line-height: 1; }
.fpick { display: block; width: 100%; padding: 0; margin: 0; border: 0; background: none; font: inherit; color: inherit; text-align: inherit; cursor: pointer; border-radius: 12px; }
.fpick:hover .fring, .fpick:hover .ftb { background: #EEF2F6; } .fpick:hover .fring.hl, .fpick:hover .ftb.hl { background: #FFEDB8; }
.fpick:focus-visible { outline: 3px solid #8CC4FF; outline-offset: 1px; }
.fwgrid .fpick { height: 100%; } .fwgrid .fpick .fring { height: 100%; }
.fpscrim { position: absolute; inset: 0; z-index: 8; background: rgba(18,32,46,.45); display: flex; align-items: flex-end; }
.fpcard { width: 100%; background: #fff; border-radius: 20px 20px 0 0; padding: 16px 18px 18px; box-shadow: 0 -6px 24px rgba(18,32,46,.25); max-height: 80%; overflow-y: auto; }
.fpkind { margin: 0; font-size: 12px; font-weight: 700; color: #5B6672; text-transform: uppercase; letter-spacing: .05em; }
.fpkind i { font-style: normal; margin-left: 6px; padding: 1px 6px; border-radius: 6px; background: #FFF3D1; color: #6A4A00; box-shadow: inset 0 0 0 1.5px #E8B13A; }
.fpcard h3 { margin: 4px 0 10px; font-size: 18px; color: #12202E; }
.fpdl { margin: 0; display: flex; flex-direction: column; gap: 6px; }
.fpdl div { display: flex; justify-content: space-between; gap: 10px; align-items: baseline; padding: 6px 0; border-bottom: 1px solid #EDF0F3; }
.fpdl dt { font-size: 13px; color: #5B6672; } .fpdl dd { margin: 0; font-size: 15px; font-weight: 700; color: #12202E; text-align: right; }
.fpdl dd small { font-weight: 400; color: #5B6672; font-size: 12px; }
.fprank { display: block; width: 110px; height: 6px; margin: 4px 0 0 auto; border-radius: 3px; background: #E3E7EB; overflow: hidden; } .fprank i { display: block; height: 100%; background: #3A4654; }
.fpwhy { margin: 12px 0; font-size: 14px; line-height: 1.45; color: #24313E; }
.fpnone { margin: 0 0 8px; font-size: 13px; color: #5B6672; }
.fpgo { width: 100%; }
.fpx { width: 100%; margin-top: 8px; min-height: 44px; border: 0; background: none; color: #3A4654; font: inherit; font-weight: 700; cursor: pointer; text-decoration: underline; }
.fpick { position: relative; } .fpchk { position: absolute; top: 4px; right: 4px; width: 20px; height: 20px; border-radius: 5px; background: #3A4654; color: #fff; font-size: 12px; font-weight: 800; line-height: 20px; text-align: center; }
.fpick.picked .fring, .fpick.picked .ftb { box-shadow: inset 0 0 0 2px #3A4654; }
.fpchk.off { background: #fff; box-shadow: inset 0 0 0 2px #8A96A3; }
.fpick.picked .fring.hl, .fpick.picked .ftb.hl { box-shadow: inset 0 0 0 2px #3A4654, inset 0 0 0 4px #E8B13A; }
.ftbars .fpick { padding-right: 32px; box-sizing: border-box; } .ftbars .fpchk { top: 50%; right: 4px; transform: translateY(-50%); }
.fpbtns { display: flex; flex-direction: column; gap: 8px; }
.fpadd { min-height: 46px; border-radius: 12px; border: 2px solid #3A4654; background: #fff; color: #3A4654; font: inherit; font-weight: 700; cursor: pointer; }
.fpadd.on { background: #3A4654; color: #fff; }
.fwscrim { flex-direction: column; justify-content: flex-end; align-items: stretch; } .fwdlg { flex: 0 1 auto; min-height: 0; }
.fwscrim:has(.fwtray) .fwdlg { border-bottom-left-radius: 0; border-bottom-right-radius: 0; }
.fwtray { flex-shrink: 0; width: 100%; box-sizing: border-box; background: #fff; border-top: 1px solid #DDE3E8; padding: 10px 14px 12px; box-shadow: 0 -4px 14px rgba(18,32,46,.12); }
.fwcoach { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 0 0 8px; padding: 8px 6px 8px 10px; border-radius: 12px; background: #E3F4EA; color: #17603C; }
.fwcoach p { flex: 1 1 180px; margin: 0; font-size: 13px; line-height: 1.35; font-weight: 600; } .fwcoach b { color: #0F4A2D; }
.fwcoach .coachav { flex-shrink: 0; width: 28px; height: 28px; border-radius: 14px; background: #fff; display: flex; align-items: center; justify-content: center; font-size: 16px; }
.fwcact { flex-shrink: 0; min-height: 34px; padding: 0 12px; border-radius: 17px; border: 1.5px solid #17603C; background: #fff; color: #17603C; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; }
.fwcoach { position: relative; padding-right: 36px; } .fwcx { position: absolute; top: 4px; right: 2px; width: 32px; height: 32px; border: 0; border-radius: 16px; background: transparent; color: #17603C; font: inherit; font-size: 18px; cursor: pointer; }
.fwcact:focus-visible, .fwcx:focus-visible { outline: 3px solid #8CC4FF; outline-offset: 1px; }
.fwchips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; max-height: 76px; overflow-y: auto; }
.fwchip { display: inline-flex; align-items: center; gap: 4px; min-height: 30px; padding: 0 10px; border-radius: 15px; border: 1px solid #C9D0D6; background: #F3F5F7; color: #24313E; font: inherit; font-size: 12px; font-weight: 600; cursor: pointer; }
.fwchip b { margin-left: 2px; color: #5B6672; }
.fwsetgo { width: 100%; }
.fwopts { display: flex; flex-direction: column; gap: 8px; }
.fwrow { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.fwlbl { width: 76px; flex-shrink: 0; font-size: 13px; font-weight: 700; color: #3E4A57; }
.fwseg { flex: 1; display: flex; gap: 6px; min-width: 0; }
.fwcnt, .fwmode { flex: 1; min-height: 40px; padding: 0 8px; border-radius: 10px; border: 1.5px solid #C9D0D6; background: #fff; color: #24313E; font: inherit; font-size: 14px; font-weight: 700; cursor: pointer; }
.fwcnt[aria-pressed="true"], .fwmode[aria-pressed="true"] { background: #3A4654; border-color: #3A4654; color: #fff; }
.fwcnt:focus-visible, .fwmode:focus-visible, .fwcancel:focus-visible { outline: 3px solid #8CC4FF; outline-offset: 1px; }
.fwextra { margin: 0; font-size: 13px; line-height: 1.4; color: #4A3300; background: #FFF6E0; border-radius: 10px; padding: 8px 10px; }
.fwgo2 { display: flex; gap: 8px; } .fwgo2 .fwcancel { flex: 0 0 auto; min-width: 96px; } .fwgo2 .fwsetgo { flex: 1; width: auto; }
.fcq { margin: 0; font-size: 14px; line-height: 1.45; color: #24313E; } .fcq b { display: block; font-size: 16px; margin-bottom: 2px; }
.fclist { display: flex; flex-direction: column; gap: 6px; }
.fcrow { display: grid; grid-template-columns: 28px 1fr auto; align-items: center; gap: 10px; width: 100%; min-height: 56px; padding: 8px 10px; border-radius: 12px; border: 1.5px solid #DDE3E8; background: #fff; font: inherit; color: #24313E; text-align: left; cursor: pointer; }
.fcrow.on { border-color: #3A4654; background: #F3F5F7; }
.fcrow:focus-visible { outline: 3px solid #8CC4FF; outline-offset: 2px; }
.fcbox { width: 24px; height: 24px; border-radius: 6px; border: 2px solid #8A939E; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; color: #fff; }
.fcrow.on .fcbox { background: #3A4654; border-color: #3A4654; }
.fcname b { font-size: 14px; } .fcname small { display: block; font-size: 12px; color: #5B6672; }
.fcname i { display: inline-block; margin-left: 6px; font-style: normal; font-size: 10px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: #6A4A00; background: #FFF3D1; padding: 1px 5px; border-radius: 5px; box-shadow: inset 0 0 0 1.5px #E8B13A; }
.fcall { border-style: dashed; } .fcall.on { border-style: solid; }
.fcpri { font-size: 13px; font-weight: 800; color: #5B6672; }
.fcjust { min-height: 44px; border: 0; background: none; color: #3A4654; font: inherit; font-weight: 700; text-decoration: underline; cursor: pointer; }
.fup { display: inline-flex; flex-direction: column; align-items: flex-start; margin: 4px 0 6px; padding: 5px 10px; border-radius: 10px; background: #E3F4EA; border: 1.5px solid #9ED3B4; color: #17603C; line-height: 1.25; }
.fup b { font-size: 14px; font-weight: 800; } .fup small { font-size: 11px; font-weight: 500; color: #2C6B49; }
.fpdl dd .fup { margin: 6px 0 0; align-items: flex-end; text-align: right; }
.fuprow { display: flex; align-items: center; gap: 10px; margin: 0 0 10px; } .fuprow .fup { margin: 0; flex-shrink: 0; }
.fupnote { font-size: 13px; color: #24313E; }
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
