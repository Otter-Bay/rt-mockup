/* Question picker (Ken, Nov 27: "I also like the popup on which question you're on ... yes, add them"). The "Question 5 of 20"
   in the top bar becomes a button, like on the vetting pages. It opens a list of the block: type a number or tap any question,
   with filters for the ones not answered yet and (in Study mode) the ones missed. In Exam mode it shows only answered or
   not, never right or wrong, so the exam stays an exam. Nothing is saved; it only moves S.qi within the current block.
   Load after app.js. */
(function () {
  const W = window;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const P = { open: false, f: "all", msg: "" };
  const CHEV = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  const exam = () => S.mode === "exam";
  // where each question in the block stands: "todo", "right", "missed" (Study), or "done" (Exam)
  const status = (i) => { const r = S.run[i]; if (!r || !r.done) return "todo"; if (exam()) return "done"; return r.sel === QS[S.set[i]].ans ? "right" : "missed"; };
  const LABEL = { todo: "Not yet", right: "Right", missed: "Missed", done: "Answered" };
  const button = () => `<button type="button" class="count countbtn" data-act="qpick" aria-haspopup="dialog" aria-label="Question ${S.qi + 1} of ${S.set.length}. Open the list to go to any question"><span class="qpw">Question&nbsp;</span>${S.qi + 1} of ${S.set.length}${CHEV}</button>`;

  function sheet() {
    const all = S.set.map((_, i) => i), st = all.map(status);
    const n = (k) => st.filter((x) => x === k).length;
    const chips = [["all", `All ${all.length}`], ["todo", `Not answered ${n("todo")}`]].concat(exam() ? [] : [["missed", `Missed ${n("missed")}`]]);
    const show = all.filter((i) => P.f === "all" || st[i] === P.f);
    const rows = show.map((i) => { const q = QS[S.set[i]], here = i === S.qi;
      return `<li><button type="button" class="qprow${here ? " here" : ""}" data-act="qpickto" data-i="${i}"${here ? ' aria-current="true"' : ""}>
        <span class="qpn">#${i + 1}</span><span class="qpt"><b>${esc(q.topic || q.id)}</b>${here ? "<small>You're here</small>" : ""}</span>
        <span class="qps ${st[i]}">${LABEL[st[i]]}</span></button></li>`; }).join("");
    return `<div class="qpwrap" data-act="qpickx"><div class="qpsheet" role="dialog" aria-modal="true" aria-labelledby="qpT">
      <div class="qphead"><h2 id="qpT">Go to a question</h2><button type="button" class="qpx" data-act="qpickx" aria-label="Close">✕</button></div>
      <div class="qpgo"><input id="qpNum" type="number" inputmode="numeric" min="1" max="${all.length}" placeholder="Question number, 1 to ${all.length}" aria-label="Question number">
        <button type="button" class="btn" data-act="qpickgo">Go</button></div>
      ${P.msg ? `<p class="qpmsg" role="status">${esc(P.msg)}</p>` : ""}
      <div class="qpchips" role="group" aria-label="Show">${chips.map(([k, t]) => `<button type="button" class="qpchip${P.f === k ? " on" : ""}" data-act="qpickf" data-f="${k}" aria-pressed="${P.f === k}">${t}</button>`).join("")}</div>
      <ol class="qplist">${rows || `<li class="qpnone">${P.f === "todo" ? "Every question in this block is answered." : "None missed. Nice work."}</li>`}</ol>
    </div></div>`;
  }
  function go(i) { if (i < 0 || i >= S.set.length) return; S.qi = i; S.scale = null; S.fb = null; S.reason = null; S.toTop = true; P.open = false; P.msg = ""; }
  Object.assign(W.PAGE_ACTIONS = W.PAGE_ACTIONS || {}, {
    qpick: () => { P.open = true; P.msg = ""; P.f = "all"; },
    qpickx: () => { P.open = false; P.msg = ""; },
    qpickf: (b) => { P.f = b.dataset.f; P.msg = ""; },
    qpickto: (b) => go(Number(b.dataset.i)),
    qpickgo: () => { const el = document.getElementById("qpNum"), v = Math.round(Number(el && el.value));
      if (v >= 1 && v <= S.set.length) go(v - 1); else P.msg = `Type a number from 1 to ${S.set.length}.`; }
  });
  // the backdrop closes it; taps inside the sheet don't fall through to it
  document.addEventListener("click", (e) => { if (P.open && e.target.closest && e.target.closest(".qpsheet") && e.target.closest("[data-act]") === e.target.closest(".qpwrap")) e.stopPropagation(); }, true);
  document.addEventListener("keydown", (e) => {
    if (!P.open) return;
    if (e.key === "Escape") { P.open = false; W.render(); }
    else if (e.key === "Enter" && e.target && e.target.id === "qpNum") { e.preventDefault(); W.PAGE_ACTIONS.qpickgo(); W.render(); }
  });
  if (typeof W.render === "function") {
    const r0 = W.render;
    W.render = function () {
      const out = r0.apply(this, arguments);
      if (P.open && !(S.page === "quiz" && !S.results && !S.reviewing && S.mode !== "flash")) P.open = false;
      if (P.open) {
        const ph = document.getElementById("phone"); if (ph) { ph.insertAdjacentHTML("beforeend", sheet());
          const h = ph.querySelector(".qprow.here"), l = ph.querySelector(".qplist"); if (h && l) { const hr = h.getBoundingClientRect(), lr = l.getBoundingClientRect(); if (hr.bottom > lr.bottom) l.scrollTop += hr.bottom - lr.bottom + lr.height / 2 - hr.height / 2; }
          const x = ph.querySelector(".qpx"); if (x && !ph.contains(document.activeElement)) x.focus({ preventScroll: true }); }
      }
      return out;
    };
  }
  const css = document.createElement("style");
  css.textContent = `.appbar .countbtn{margin-left:auto;display:inline-flex;align-items:center;gap:4px;min-height:40px;padding:0 10px 0 12px;border-radius:20px;border:1.5px solid #C9D2DC;background:#fff;color:#0B4F94;font:inherit;font-size:14px;font-weight:700;cursor:pointer;font-variant-numeric:tabular-nums;white-space:nowrap}
.appbar .countbtn:hover{background:#EEF4FB}.appbar .countbtn svg{flex-shrink:0}
@media (max-width:480px){.appbar .countbtn{padding:0 6px 0 10px;min-height:38px}.appbar .countbtn .qpw{display:none}}
html[data-view="phone"] .appbar .countbtn{padding:0 6px 0 10px;min-height:38px}html[data-view="phone"] .appbar .countbtn .qpw{display:none}
.qpwrap{position:absolute;inset:0;z-index:60;background:rgba(10,24,36,.45);display:flex;align-items:flex-end;border-radius:inherit;overflow:hidden}
.qpsheet{width:100%;max-height:86%;display:flex;flex-direction:column;gap:10px;box-sizing:border-box;padding:14px 16px 16px;background:var(--sheet,#fff);border-radius:22px 22px 0 0;box-shadow:0 -8px 28px rgba(0,0,0,.2)}
@media (min-width:700px){html:not([data-view="phone"]) .qpwrap{align-items:center;justify-content:center}html:not([data-view="phone"]) .qpsheet{max-width:600px;max-height:80%;border-radius:22px}}
.qphead{display:flex;align-items:center;justify-content:space-between}.qphead h2{margin:0;font-size:20px}
.qpx{width:44px;height:44px;border-radius:50%;border:0;background:#EEF2F6;font-size:18px;cursor:pointer;color:var(--ink,#12202E)}
.qpgo{display:flex;gap:8px}.qpgo input{flex:1;min-width:0;min-height:48px;padding:0 12px;border:1.5px solid #B9C4CF;border-radius:12px;font:inherit;font-size:16px}
.qpgo .btn{flex:0 0 auto;min-width:72px}
.qpmsg{margin:0;font-size:14px;color:#8A2E08}
.qpchips{display:flex;gap:6px;flex-wrap:wrap}
.qpchip{min-height:40px;padding:0 14px;border-radius:20px;border:1.5px solid #C9D2DC;background:#fff;font:inherit;font-size:14px;font-weight:700;color:var(--ink,#12202E);cursor:pointer}
.qpchip.on{background:#0B5CAD;border-color:#0B5CAD;color:#fff}
.qplist{list-style:none;margin:0;padding:0;overflow:auto;display:flex;flex-direction:column;gap:6px;min-height:0}
.qprow{display:flex;align-items:center;gap:10px;width:100%;min-height:52px;padding:8px 12px;border:1.5px solid var(--rule,#E3E7EB);border-radius:12px;background:#fff;font:inherit;text-align:left;cursor:pointer;color:var(--ink,#12202E)}
.qprow.here{border:2px solid #0B5CAD;background:#EEF4FB}
.qpn{font-size:13px;font-weight:700;color:var(--muted,#4A5663);width:38px;flex-shrink:0;font-variant-numeric:tabular-nums}
.qpt{flex:1;min-width:0}.qpt b{display:block;font-size:15px;line-height:1.3}.qpt small{display:block;font-size:12.5px;color:#0B5CAD;font-weight:700}
.qps{flex-shrink:0;font-size:12.5px;font-weight:700;padding:3px 10px;border-radius:999px;background:#E3E7EB;color:#4A5663}
.qps.right{background:#E6F4EC;color:#0B5E36}.qps.missed{background:#FDECE2;color:#8A2E08}.qps.done{background:#E8EEF5;color:#0B4F94}
.qpnone{padding:16px 4px;color:var(--muted,#4A5663);font-size:15px}`;
  document.head.appendChild(css);
  W.OB_QPICK = { button, state: P };
})();
