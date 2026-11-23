/* Finding a question in the vetting pages (Ken, Nov 20, 2026: "that little graph icon gives no real clue").
   The "Question 12 of 200" counter in the top bar is now a button that opens the question list, and the list
   has a "Go to question" box: type a number (12) or a question ID (RT-0112, 112) and press Go.
   The page's own markup changes are made by build_pages.py; this file adds the box's behavior. */
(function () {
  if (typeof S === "undefined" || typeof QS === "undefined") return;
  const css = document.createElement("style");
  css.textContent = `
.countbtn{margin-left:auto;display:inline-flex;align-items:center;gap:4px;min-height:40px;padding:0 10px 0 12px;border-radius:20px;border:1.5px solid #C9D2DC;background:#fff;color:#0B4F94;font:inherit;font-size:14px;font-weight:700;cursor:pointer;font-variant-numeric:tabular-nums;white-space:nowrap}
.countbtn:hover{background:#EEF4FB}.countbtn svg{flex-shrink:0}
.appbar .countbtn + .iconbtn{margin-left:0}
.obgoto{display:flex;flex-direction:column;gap:6px;padding:12px;border-radius:12px;background:#EEF4FB;border:1.5px solid #B9CFE8}
.obgoto label{font-size:15px;font-weight:700}
.obgoto div{display:flex;gap:8px}
.obgoto input{flex:1;min-width:0;font:inherit;font-size:17px;padding:10px 12px;border:1.5px solid #AAB4BF;border-radius:10px}
.obgoto button{min-height:46px;padding:0 18px;border-radius:10px;border:0;background:#0B5CAD;color:#fff;font:inherit;font-size:16px;font-weight:700;cursor:pointer}
.obgoto p{margin:0;font-size:13px;color:#4A5663}.obgoto p.err{color:#A3360A;font-weight:700}
/* A phone turned sideways (Ken, Nov 22): fill the screen instead of showing a small phone frame with notes around it,
   so a rotated EKG or tracing gets the whole screen. */
@media (max-height:540px) and (pointer:coarse){
  .stage{padding:0!important;display:block!important}
  .stage>.note{display:none!important}
  .holder{width:100%!important;height:100dvh!important}
  .phone{position:relative!important;transform:none!important;width:100%!important;height:100dvh!important;border-radius:0!important;border:0!important;box-shadow:none!important}
}`;
  document.head.appendChild(css);
  let err = "";
  const qAt = (i) => QS[S.set[i]];   // S.set holds positions in QS, the question list
  window.obGotoBox = () => `<form class="obgoto" data-obgoto="form"><label for="obGotoIn">Go to question</label>
    <div><input id="obGotoIn" inputmode="text" autocomplete="off" placeholder="Number, like 12, or ID, like ${esc(S.set.length ? qAt(0).id : "")}"><button type="submit">Go</button></div>
    ${err ? `<p class="err" role="alert">${esc(err)}</p>` : `<p>Or scroll the list below and tap any question.</p>`}</form>`;
  function find(v) {
    v = String(v).trim().toUpperCase(); if (!v) return -1;
    if (/^#?\d+$/.test(v)) {                                   // a number: its place in the list (the #1 to #200 shown below)
      const n = Number(v.replace("#", ""));
      const byRank = S.set.findIndex((_, i) => qAt(i).rank === n);
      return byRank >= 0 ? byRank : n >= 1 && n <= S.set.length ? n - 1 : -1;
    }
    const exact = S.set.findIndex((_, i) => String(qAt(i).id).toUpperCase() === v);   // a question ID
    if (exact >= 0) return exact;
    const digits = v.replace(/\D/g, "");
    return digits ? S.set.findIndex((_, i) => String(qAt(i).id).replace(/\D/g, "") === digits.padStart(4, "0")) : -1;
  }
  document.addEventListener("submit", (e) => {
    if (!e.target.matches || !e.target.matches('[data-obgoto="form"]')) return;
    e.preventDefault();
    const v = document.getElementById("obGotoIn").value, i = find(v);
    if (i < 0) { err = `Couldn't find "${v}". Try a number from 1 to ${S.set.length} or a question ID.`; render(); const n = document.getElementById("obGotoIn"); if (n) { n.value = v; n.focus(); } return; }
    err = "";
    const b = document.createElement("button"); b.type = "button"; b.dataset.act = "vetjump"; b.dataset.i = i; b.hidden = true;
    document.body.appendChild(b); b.click(); b.remove();       // same path as tapping the question in the list
  });
})();
