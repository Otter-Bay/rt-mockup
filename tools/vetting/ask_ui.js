/* Ask, inside the question-vetting pages (Ken, Nov 20, 2026): after the final answer is chosen, an "Ask about this" button
   opens the Ask library so reviewers can look things up while they vet. It suggests cards related to the question,
   takes typed or spoken questions, and shows the card with its Source panel. A question the library can't answer can be
   added to the reviewer's notes, so library gaps come back to us with the verdicts.
   Built into the vetting pages by tools/vetting/build_embed.js; uses window.OB_ASK_MATCH from the same bundle. */
(function () {
  if (!window.SCALES || !window.OB_ASK_MATCH || typeof window.scaleButtons !== "function") return;
  const EXAM = window.EXAM;
  const MINE = [...({ RRT: ["rt"], SDS: ["rt", "sleep"], RPSGT: ["sleep"], CNA: ["cna"] }[EXAM] || ["rt"]), "all"];
  const FIELD_NAME = { rt: "respiratory therapy", sleep: "sleep technology", cna: "nurse assistant" };
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const strip = (s) => String(s || "").replace(/<[^>]+>/g, " ");
  const MIC = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
  const X = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  const css = document.createElement("style");
  css.textContent = `
.obaskrow{display:flex;margin:2px 0 4px}
.obaskbtn{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:8px 16px;border-radius:22px;border:2px solid #0F7A46;background:#E6F4EC;color:#0B5E36;font:inherit;font-size:14px;font-weight:700;cursor:pointer}
.obaskbtn:hover{background:#D6EEDF}
.obask{position:fixed;inset:0;z-index:1000;background:rgba(18,32,46,.5);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;font-family:var(--font,Arial,sans-serif)}
.obaskdlg{background:#fff;color:#12202E;width:100%;max-width:560px;max-height:100%;overflow-y:auto;border-radius:20px;padding:18px;box-sizing:border-box;display:flex;flex-direction:column;gap:12px;box-shadow:0 20px 60px rgba(0,0,0,.3)}
.obaskhead{display:flex;align-items:flex-start;gap:10px}.obaskhead h2{margin:0;font-size:20px;flex:1}.obaskhead p{margin:2px 0 0;font-size:13px;color:#4A5663;font-weight:400}
.obaskx{width:44px;height:44px;border-radius:22px;border:0;background:#EEF1F4;color:#24313E;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0}
.obasklbl{margin:0;font-size:13px;font-weight:700;color:#4A5663;letter-spacing:.03em}
.obaskchips{display:flex;flex-wrap:wrap;gap:8px}
.obaskchip{min-height:40px;padding:6px 12px;border-radius:20px;border:1.5px solid #1F5FA8;background:#EEF4FB;color:#154A86;font:inherit;font-size:14px;font-weight:700;cursor:pointer;text-align:left}
.obaskchip[aria-pressed="true"]{background:#1F5FA8;color:#fff}
.obaskform{display:flex;gap:8px}
.obaskform input{flex:1;min-width:0;font:inherit;font-size:16px;padding:10px 12px;border:1.5px solid #AAB4BF;border-radius:12px}
.obaskform button{min-height:46px;border-radius:12px;border:0;font:inherit;font-weight:700;font-size:15px;cursor:pointer;padding:0 14px}
.obaskgo{background:#0B5CAD;color:#fff}.obaskmic{background:#E6F4EC;color:#0B5E36;width:46px;padding:0!important;display:flex;align-items:center;justify-content:center}
.obaskmic.on{background:#C2410C;color:#fff}
.obaskmsg{margin:0;font-size:13px;color:#4A5663}
.obaskquick{margin:0;padding:10px 12px;border-radius:12px;background:#FFF3D1;border:1.5px solid #E8B13A;font-size:15px;line-height:1.4}
.obaskcard{border:1.5px solid #E3E7EB;border-radius:14px;padding:14px;display:flex;flex-direction:column;gap:10px}
.obaskcard h3{margin:0;font-size:18px}.obaskcard .asksub{margin:0;font-size:14px;color:#4A5663;line-height:1.45}
.obaskscope{margin:0;font-size:13px;font-weight:700;color:#8A2E08;background:#FDECE2;border-radius:8px;padding:6px 10px}
.obasksrc summary{cursor:pointer;font-weight:700;color:#0B4F94;min-height:32px;display:flex;align-items:center}
.obasksrc dl{margin:6px 0 0;font-size:13px;line-height:1.4;display:grid;grid-template-columns:max-content 1fr;gap:4px 12px}.obasksrc dt{font-weight:700;color:#4A5663}.obasksrc dd{margin:0}
.obasksrc ul{margin:4px 0 0;padding-left:18px}.obasksrc a{color:#0B4F94}
.obasknone{display:flex;flex-direction:column;gap:8px;padding:12px;border-radius:12px;background:#F6F8FA;border:1px solid #E3E7EB}.obasknone p{margin:0;font-size:14px;line-height:1.45}
.obasknote{align-self:flex-start;min-height:42px;padding:0 14px;border-radius:12px;border:2px solid #AAB4BF;background:#fff;font:inherit;font-weight:700;font-size:14px;cursor:pointer}
.obaskfine{margin:0;font-size:12px;color:#4A5663}
.obaskq{border:1.5px solid #C9D2DC;border-radius:12px;background:#F6F8FA}
.obaskq summary{cursor:pointer;min-height:44px;display:flex;align-items:center;padding:0 12px;font-weight:700;color:#0B4F94;font-size:14px}
.obaskqbody{padding:0 12px 12px;max-height:38vh;overflow-y:auto;display:flex;flex-direction:column;gap:8px;font-size:15px;line-height:1.55}
.obaskqbody p{margin:0}.obaskqbody .lbl{font-size:12px;font-weight:700;color:#4A5663;letter-spacing:.03em}
.obaskw{display:inline;border:0;background:none;padding:1px 1px;margin:0;font:inherit;color:inherit;cursor:pointer;border-radius:4px;text-align:left}
.obaskw:hover,.obaskw:focus-visible{background:#DDEBFA;color:#0B4F94}
.obaskw.added{background:#D6EEDF}
@media (max-width:500px){.obask{padding:0;align-items:stretch}.obaskdlg{border-radius:0;max-width:none}}`;
  document.head.appendChild(css);

  // The button sits after the info-card buttons, which appear only once the final answer is chosen.
  const orig = window.scaleButtons;
  window.scaleButtons = function (q, c) {
    const base = orig.apply(this, arguments);
    if (!c || !c.done) return base;
    return base + `<div class="obaskrow"><button type="button" class="obaskbtn" data-obask="open">${MIC}<span>Ask about this question</span></button></div>`;
  };

  const A = { q: null, text: "", res: null, pick: null, listening: false, msg: "", noted: false, qopen: false };
  let rec = null, box = null;

  function related(q) {
    const out = [];
    const fits = (k) => /^s?abbr_/.test(k) ? false : MINE.includes(window.SCALES[k].field || "rt");   // suggestions stay in this exam's field; glossaries only on request
    const add = (k) => { if (k && window.SCALES[k] && !out.includes(k) && fits(k)) out.push(k); };
    (q.scales || []).forEach((k) => { if (k && window.SCALES[k] && !out.includes(k)) out.push(k); });
    const correct = q.opts && q.ans ? q.opts["ABCD".indexOf(q.ans)] : "";
    [q.topic, `${q.topic || ""} ${strip(q.stem)}`, `${q.topic || ""} ${correct || ""}`].forEach((t) => {
      if (!t) return;
      const r = window.OB_ASK_MATCH(t);
      add(r.best); (r.others || []).forEach(add);
    });
    return out.slice(0, 5);
  }
  const fmtDate = (d) => { if (!d) return ""; const [y, m, dd] = d.split("-").map(Number); return new Date(y, m - 1, dd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); };
  function card(k) {
    const s = window.SCALES[k], field = s.field || "rt", m = (window.CARD_META || {})[k] || {};
    const scope = MINE.includes(field) ? "" : `<p class="obaskscope">This is ${FIELD_NAME[field] || "other field"} information; check what's in your scope of practice.</p>`;
    const links = (s.links || []).map(([t, u]) => `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a></li>`).join("");
    const rev = s.reviewed ? `Checked by ${esc(s.reviewed.by)} on ${fmtDate(s.reviewed.date)}` : "Expert review: pending";
    return `<article class="obaskcard">${scope}<h3>${s.title}</h3>${s.intro ? `<p class="asksub">${s.intro}</p>` : ""}
      <div class="sctwrap">${s.body || ""}</div>${s.note ? `<p class="scnote">${s.note}</p>` : ""}
      <details class="obasksrc"><summary>Source</summary><dl>
        <dt>Where it comes from</dt><dd>${s.src || "Otter Bay"}${links ? `<ul>${links}</ul>` : ""}</dd>
        <dt>Written by</dt><dd>Otter Bay, in our own words</dd>
        ${m.added ? `<dt>Added</dt><dd>${fmtDate(m.added)}${m.changed && m.changed !== m.added ? ` (last changed ${fmtDate(m.changed)})` : ""}</dd>` : ""}
        <dt>Review</dt><dd>${rev}</dd></dl></details></article>`;
  }
  // The question itself, inside Ask, so the spelling of a term is right there (Ken, Nov 22). Tap a word to add it to the question box.
  const words = (t) => strip(t).split(/(\s+)/).map((w) => /\S/.test(w) ? `<button type="button" class="obaskw" data-obask="word" data-w="${esc(w.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9%]+$/g, ""))}">${esc(w)}</button>` : w).join("");
  function questionBlock(q) {
    const rows = (q.rows || []).map((r) => `<p>${words(r[0])}: ${words(r[1])}</p>`).join("");
    const opts = (q.opts || []).map((o, i) => `<p><b>${"ABCD"[i]}.</b> ${words(o)}</p>`).join("");
    return `<details class="obaskq"${A.qopen ? " open" : ""} data-obask="qtoggle"><summary>See the question (tap a word to add it)</summary><div class="obaskqbody">
      <p>${words(q.stem)}</p>${rows}${q.after ? `<p>${words(q.after)}</p>` : ""}${opts}
      ${q.why ? `<p class="lbl">EXPLANATION</p><p>${words(q.why)}</p>` : ""}</div></details>`;
  }
  function draw() {
    if (!box) return;
    const q = A.q, rel = related(q), r = A.res;
    const keep = document.activeElement && document.activeElement.id === "obaskIn";
    const qb = box.querySelector(".obaskqbody"), qScroll = qb ? qb.scrollTop : 0;
    let res = "";
    if (r && r.best) {
      const list = [r.best, ...(r.others || [])], k = A.pick && list.includes(A.pick) ? A.pick : r.best;
      const quick = (r.abbr || []).map((h) => `<b>${esc(h.abbr)}</b> = ${esc(h.meaning)}${MINE.includes(h.field) ? "" : ` <small>(${FIELD_NAME[h.field]})</small>`}`).join("<br>");
      res = `${quick ? `<p class="obaskquick">${quick}</p>` : ""}
        ${list.length > 1 ? `<div class="obaskchips">${list.map((x) => `<button type="button" class="obaskchip" data-obask="pick" data-k="${x}" aria-pressed="${x === k}">${esc(strip(window.SCALES[x].title))}</button>`).join("")}</div>` : ""}
        ${card(k)}`;
    } else if (r) {
      res = `<div class="obasknone"><p><b>Not in the library yet.</b> If learners would ask this, add it to your notes for this question and we'll consider a new card at the next library update.</p>
        ${document.getElementById("vetNotes") ? `<button type="button" class="obasknote" data-obask="note">${A.noted ? "Added to your notes ✓" : "Add to my notes"}</button>` : ""}</div>`;
    } else if (A.pick) {
      res = card(A.pick);
    }
    box.innerHTML = `<div class="obaskdlg" role="dialog" aria-modal="true" aria-labelledby="obaskT">
      <div class="obaskhead"><div style="flex:1"><h2 id="obaskT">Ask</h2><p>${esc(q.id)}${q.topic ? " · " + esc(q.topic) : ""}</p></div>
        <button type="button" class="obaskx" data-obask="close" aria-label="Close">${X}</button></div>
      ${rel.length ? `<p class="obasklbl">RELATED TO THIS QUESTION</p><div class="obaskchips">${rel.map((k) => `<button type="button" class="obaskchip" data-obask="rel" data-k="${k}" aria-pressed="${!r && A.pick === k}">${esc(strip(window.SCALES[k].title))}</button>`).join("")}</div>` : ""}
      ${questionBlock(q)}
      <form class="obaskform" data-obask="form"><input id="obaskIn" type="text" autocomplete="off" placeholder="Type a question, e.g. What does WASO stand for?" value="${esc(A.text)}" aria-label="Your question">
        ${SR ? `<button type="button" class="obaskmic${A.listening ? " on" : ""}" data-obask="mic" aria-label="${A.listening ? "Stop listening" : "Speak your question"}">${MIC}</button>` : ""}
        <button type="submit" class="obaskgo">Ask</button></form>
      ${A.msg ? `<p class="obaskmsg" role="status">${esc(A.msg)}</p>` : ""}
      ${res}
      <p class="obaskfine">Answers come from our reference library (draft, being vetted). For learning only: follow your facility's protocols.</p></div>`;
    const qb2 = box.querySelector(".obaskqbody"); if (qb2) qb2.scrollTop = qScroll;
    if (keep) { const i = document.getElementById("obaskIn"); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
  }
  function open() {
    const q = typeof Q === "function" ? Q() : null; if (!q) return;
    Object.assign(A, { q, text: "", res: null, pick: null, msg: "", noted: false });
    box = document.createElement("div"); box.className = "obask";
    document.body.appendChild(box); draw();
    const i = document.getElementById("obaskIn"); if (i) i.focus();
  }
  function close() { stop(); if (box) box.remove(); box = null; }
  function ask(t) {
    A.text = t.trim(); if (!A.text) return;
    A.res = window.OB_ASK_MATCH(A.text); A.pick = null; A.noted = false; A.msg = ""; draw();
  }
  function stop() { if (rec) { try { rec.abort(); } catch (e) {} rec = null; } A.listening = false; }
  function listen() {
    if (A.listening) { stop(); draw(); return; }
    try {
      rec = new SR(); rec.lang = "en-US"; rec.interimResults = true; rec.maxAlternatives = 1;
      rec.onresult = (e) => { const t = Array.from(e.results).map((x) => x[0].transcript).join(" "); const i = document.getElementById("obaskIn"); if (i) i.value = t; A.text = t; if (e.results[e.results.length - 1].isFinal) { stop(); ask(t); } };
      rec.onerror = () => { stop(); A.msg = "The microphone isn't available here. Type your question instead."; draw(); };
      rec.onend = () => { if (A.listening) { stop(); draw(); } };
      rec.start(); A.listening = true; A.msg = "Listening…"; draw();
    } catch (e) { stop(); A.msg = "The microphone isn't available here. Type your question instead."; draw(); }
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-obask]"); if (!b || b.tagName === "FORM") { if (box && e.target === box) close(); return; }
    const a = b.dataset.obask;
    if (a === "open") open();
    else if (a === "close") close();
    else if (a === "rel") { A.res = null; A.pick = b.dataset.k; A.msg = ""; draw(); }
    else if (a === "pick") { A.pick = b.dataset.k; draw(); }
    else if (a === "mic") listen();
    else if (a === "word") {
      const i = document.getElementById("obaskIn"), w = b.dataset.w; if (!i || !w) return;
      i.value = (i.value.trim() ? i.value.trim() + " " : "") + w; A.text = i.value; b.classList.add("added");
    }
    else if (a === "note") {
      const el = document.getElementById("vetNotes");
      if (el && !A.noted) { el.value = (el.value ? el.value.trimEnd() + "\n" : "") + `Ask gap: "${A.text}" isn't in the library.`; el.dispatchEvent(new Event("input", { bubbles: true })); A.noted = true; draw(); }
    }
  });
  document.addEventListener("submit", (e) => {
    if (!e.target.matches || !e.target.matches('[data-obask="form"]')) return;
    e.preventDefault(); const i = document.getElementById("obaskIn"); ask(i ? i.value : "");
  });
  document.addEventListener("toggle", (e) => { if (e.target.classList && e.target.classList.contains("obaskq")) A.qopen = e.target.open; }, true);
  document.addEventListener("input", (e) => { if (e.target.id === "obaskIn") A.text = e.target.value; });
  document.addEventListener("keydown", (e) => {
    if (!box) return;
    if (e.key === "Escape") { e.stopPropagation(); close(); }
    else if (box.contains(e.target)) e.stopPropagation();   // keep the page's keyboard shortcuts out of the Ask window
  }, true);
  if (typeof render === "function") { try { render(); } catch (e) {} }
})();
