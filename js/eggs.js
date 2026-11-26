/* Two Easter eggs for dedicated students (Ken, Nov 26). Nothing here shows up unless a student earns it, so it never appears in a
   demo or a grant review by accident, and it never changes a score or blocks studying.
   - Captain's hat: study 30 days in a row (any day with at least one answered question) and the otter on the home screen wears
     a captain's hat from then on. A short note says so the first time.
   - Legend of the Bay: get every question in the 200-question block right (the latest try at each, the app's scoring rule), and a
     gold "Legend of the Bay" badge sits under the home greeting. The perfect-score party plays when it's earned.
   Saved per exam under a new key, obEggs:${EXAM}. Load after app.js and bin.js (it wraps recordAnswer and render). */
(function () {
  const W = window, EXAM = W.EXAM || W.APP_LABEL || "RRT", KEY = "obEggs:" + EXAM, HAT_DAYS = 30;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let E = (() => { try { return Object.assign({ last: "", streak: 0, best: 0, hat: false, legend: false, note: "" }, JSON.parse(localStorage.getItem(KEY) || "{}") || {}); } catch (e) { return { last: "", streak: 0, best: 0, hat: false, legend: false, note: "" }; } })();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(E)); } catch (e) {} };
  const day = (d) => { const x = d || new Date(); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); };

  function studiedToday() {
    const today = day(); if (E.last === today) return;
    const y = new Date(); y.setDate(y.getDate() - 1);
    E.streak = E.last === day(y) ? E.streak + 1 : 1; E.last = today; E.best = Math.max(E.best, E.streak);
    if (!E.hat && E.streak >= HAT_DAYS) { E.hat = true; E.hatAt = Date.now(); E.note = "hat"; }
    save();
  }
  // every question in the block right: the latest try at each one (the app's scoring rule), so a dedicated student gets there by
  // working the review list until nothing is missed. The block is the whole bank (200 questions in each app).
  function legendCheck() {
    if (E.legend || typeof QS === "undefined" || typeof ST === "undefined" || !QS.length || QS.length < 20) return;
    if (QS.every((q) => ST[q.id] && ST[q.id].lastCorrect === true)) {
      E.legend = true; E.legendAt = Date.now(); E.legendN = QS.length; save();
      setTimeout(() => { if (W.OB_BIN && W.OB_BIN.celebrate) W.OB_BIN.celebrate(); }, 400);
    }
  }
  if (typeof W.recordAnswer === "function") {
    const rec0 = W.recordAnswer;
    // example stats (demo mode, used for demos and reviews) never count toward either egg
    W.recordAnswer = function (q, c) { rec0(q, c); if (W.DEMO_ON) return; try { studiedToday(); legendCheck(); } catch (e) {} };
  }

  // what the home screen shows: the otter in its hat, the badge, and a one-time note
  const BADGE = '<svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#E0B43A" stroke="#9C6D12" stroke-width="1.5"/><path d="M12 6.5l1.6 3.4 3.7.4-2.8 2.5.8 3.7L12 14.6l-3.3 1.9.8-3.7-2.8-2.5 3.7-.4z" fill="#FFF6D6"/></svg>';
  function decorate() {
    if (W.DEMO_ON && !E.preview) return;   // never during a demo with example stats
    const img = document.querySelector(".bay.photo .hero img");
    if (img && E.hat) {
      const src = img.getAttribute("src") || "";
      if (/otter-(rrt|sds|cna)\.jpg/.test(src) && !/-captain/.test(src)) { img.setAttribute("src", src.replace(/otter-(rrt|sds|cna)\.jpg(\?[^"]*)?/, "otter-$1-captain.jpg")); img.alt += ", wearing a captain's hat"; }
    }
    const h1 = document.querySelector(".bay h1");
    if (h1 && E.legend && !document.querySelector(".oblegend")) {
      h1.insertAdjacentHTML("afterend", `<p class="oblegend" title="Every question in the block answered right">${BADGE}<span>Legend of the Bay</span></p>`);
    }
    if (E.note === "hat" && h1 && !document.querySelector(".obeggnote")) {
      h1.insertAdjacentHTML("afterend", `<p class="obeggnote" role="status">⚓ ${HAT_DAYS} days in a row! Your otter earned a captain's hat. <button type="button" class="obeggok">Aye</button></p>`);
    }
  }
  document.addEventListener("click", (e) => { if (e.target.closest && e.target.closest(".obeggok")) { E.note = ""; save(); const n = document.querySelector(".obeggnote"); if (n) n.remove(); } }, true);
  if (typeof W.render === "function") {
    const r0 = W.render;
    W.render = function () { const out = r0.apply(this, arguments); try { decorate(); } catch (e) {} return out; };
  }
  try { decorate(); } catch (e) {}

  const css = document.createElement("style");
  css.textContent = `.oblegend{display:inline-flex;align-items:center;gap:6px;margin:4px 0 0;padding:4px 12px 4px 6px;border-radius:999px;background:#FFF6DB;border:1.5px solid #E0B43A;color:#6A4A00;font-weight:700;font-size:14px}
.obeggnote{margin:6px 0 0;padding:8px 12px;border-radius:12px;background:#FFF6DB;border:1.5px solid #E0B43A;color:#4A3300;font-size:14px;font-weight:700}
.obeggnote .obeggok{margin-left:8px;font:inherit;font-weight:700;color:#0B4F6C;background:#fff;border:2px solid #0B4F6C;border-radius:999px;padding:2px 12px;cursor:pointer}`;
  document.head.appendChild(css);
  // for testing only, from the browser console: OB_EGGS.test("hat") or OB_EGGS.test("legend"); OB_EGGS.reset()
  W.OB_EGGS = { state: () => Object.assign({}, E), test: (k) => { E.preview = true; if (k === "hat") { E.hat = true; E.note = "hat"; } if (k === "legend") { E.legend = true; E.legendN = (typeof QS !== "undefined" && QS.length) || 0; } save(); if (W.render) W.render(); },
    reset: () => { E = { last: "", streak: 0, best: 0, hat: false, legend: false, note: "" }; save(); if (W.render) W.render(); } };
})();
