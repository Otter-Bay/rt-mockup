/* Add to Study List, inside the question-vetting pages. Same look and concept-key behavior as the apps (js/bin.js flag()).
   Writes localStorage obBin:{EXAM} in the same format so a page on the same origin as the app shares the Study List.
   A Claude artifact or a local file is a different origin and cannot share storage; the copyable OBARC1: code and
   the "Open in … Ready" link are the way to move the list into the app. Never stores question text, only card keys.
   Built into the vetting pages by tools/vetting/build_embed.js. */
(function () {
  const W = window, EXAM = W.EXAM || "RRT";
  const KEY = "obBin:" + EXAM;
  const APP = { SDS: "https://otter-bay.github.io/rt-mockup/sds/", RPSGT: "https://otter-bay.github.io/rt-mockup/rpsgt/",
    CNA: "https://otter-bay.github.io/rt-mockup/cna/", RRT: "https://otter-bay.github.io/rt-mockup/" }[EXAM] || "https://otter-bay.github.io/rt-mockup/";
  const APP_NAME = { SDS: "SDS Ready", RPSGT: "RPSGT Ready", CNA: "CNA Ready", RRT: "CRT/RRT Ready" }[EXAM] || "the app";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const strip = (s) => String(s || "").replace(/<[^>]+>/g, " ");
  const load = () => { try { return Object.assign({ cards: {}, streak: 0, lastDay: "", sound: true, badges: [], offset: 0 }, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { return { cards: {}, streak: 0, lastDay: "", sound: true, badges: [], offset: 0 }; } };
  let B = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(B)); } catch (e) {} };
  const inBin = (k) => !!B.cards[k] && !B.cards[k].mastered;
  function addCard(k) { if (!B.cards[k] || B.cards[k].mastered) B.cards[k] = { added: Date.now(), step: 1, checks: 0, due: 0, best: {}, mastered: false }; save(); }
  function toggle(k) { if (!k || !W.SCALES[k]) return; if (inBin(k)) delete B.cards[k]; else addCard(k); save(); }
  function liveKeys() { return Object.keys(B.cards).filter((k) => W.SCALES && W.SCALES[k] && !B.cards[k].mastered); }
  function listCode() { return "OBARC1:" + EXAM + ":" + liveKeys().join(","); }
  function appHref() { const ks = liveKeys(); return APP + (ks.length ? "?arcade=" + encodeURIComponent(ks.join(",")) : ""); }

  const TIP_KEY = "obStudyTip:" + EXAM;
  const loadTip = () => { try { return Object.assign({ shown: 0, picked: false }, JSON.parse(localStorage.getItem(TIP_KEY) || "{}") || {}); } catch (e) { return { shown: 0, picked: false }; } };
  let TIP = loadTip(), JUST_TIP = false, JUST_KEY = "";
  const saveTip = () => { try { localStorage.setItem(TIP_KEY, JSON.stringify(TIP)); } catch (e) {} };
  function tipBanner() {
    return `<div class="bintip" role="status"><p><b>Saved!</b> You can pick how to study it (game, picture, jingle, flashcard) from your Study List.</p></div>`;
  }
  function flag(k) {
    if (!W.SCALES || !W.SCALES[k]) return "";
    const on = inBin(k);
    const btn = `<button type="button" class="binflag${on ? " on" : ""}" data-act="binflag" data-k="${k}" aria-pressed="${on}"><span aria-hidden="true">${on ? "★" : "☆"}</span><span><b>${on ? "Saved to Study List" : "Add to Study List"}</b><small>${esc(W.SCALES[k].title)}</small></span></button>`;
    return btn;
  }
  function keysFor(q) {
    const out = [], seen = {};
    const add = (k) => { if (k && W.SCALES && W.SCALES[k] && !seen[k] && !/^s?abbr_/.test(k)) { seen[k] = 1; out.push(k); } };
    (q && q.scales || []).forEach(add);
    if (!out.length && q && typeof W.OB_ASK_MATCH === "function") {
      const correct = q.opts && q.ans ? q.opts["ABCD".indexOf(q.ans)] : "";
      [q.topic, (q.topic || "") + " " + strip(q.stem || ""), (q.topic || "") + " " + (correct || "")].forEach((t) => {
        if (!String(t || "").trim()) return;
        const r = W.OB_ASK_MATCH(t);
        add(r && r.best); (r && r.others || []).forEach(add);
      });
    }
    return out.slice(0, 5);
  }
  // Add to Study List offers only topics that aren't on the list yet (Ken, Nov 26); saved ones are named in one quiet line
  function flagSet(ks) {
    // every topic keeps its place (Ken, Nov 26: so it never looks forgotten): Add for new ones, a gold "already there" card for saved ones
    const saved = (k) => `<div class="binflag obhave" role="note"><span aria-hidden="true">★</span><span><b>Already on your Study List</b><small>${esc(W.SCALES[k].title)}</small></span></div>`;   // See Study List sits just below, in the Study List bar
    return `<div class="obflagset" data-ks="${esc(ks.join(","))}"><div class="binflags">${ks.map((k) => inBin(k) ? saved(k) : flag(k)).join("")}</div></div>`;
  }
  function flags(q) {
    const ks = keysFor(q);
    if (!ks.length) return `<p class="obarcnote">No reference card is linked to this question yet, so it can't go on the Study List. You can still Ask about it.</p>${bar()}`;
    return `${flagSet(ks)}${bar()}`;
  }
  let copied = false;
  function bar() {
    const n = liveKeys().length;
    return `<div class="obarcbar"><p><b>Study List:</b> ${n ? n + " topic" + (n === 1 ? "" : "s") + " saved on this page." : "tap Add to Study List to save this topic."}</p>
      ${n ? `<div class="obarcacts"><button type="button" class="obarcbtn" data-act="obarcopen">See Study List</button><button type="button" class="obarcbtn" data-act="obarccopy">${copied ? "Copied" : "Copy list"}</button>
        <a class="obarcbtn" href="${esc(appHref())}" target="_blank" rel="noopener">Study these in ${esc(APP_NAME)}</a></div>
        <p class="obarcnote">A Claude artifact or a file on your computer can't share saved cards with the app automatically. Copy the list or open the link. The list is an OBARC1 code of topic keys only. If the link does not add them, use Import on the Study List screen.</p>`
        : `<p class="obarcnote">This page can't share storage with the app. After you add topics, a button to study them in ${esc(APP_NAME)} will appear here.</p>`}
      </div>`;
  }

  const css = document.createElement("style");
  css.textContent = `
.binflags{display:grid;gap:8px;margin:10px 0 0}
.binflag{display:flex;align-items:center;gap:10px;width:100%;max-width:100%;box-sizing:border-box;min-height:52px;padding:8px 14px;border-radius:14px;border:2px dashed #F5B83D;background:#FFFBF0;color:#0A4A63;font:inherit;text-align:left;cursor:pointer}
.binflag>span:first-child{font-size:24px;line-height:1;color:#B07A00;flex-shrink:0}
.binflag>span:last-child{min-width:0;flex:1}
.binflag b{display:block;font-size:16px;overflow-wrap:anywhere}
.binflag small{display:block;font-size:13px;color:#4F6B75;overflow-wrap:anywhere}
.binflag.on{border-style:solid;background:#F5B83D;color:#3A2800}
.binflag.on small{color:#3A2800}
.binflag.on>span:first-child{color:#3A2800}
.obarcbar{margin:12px 0 0;padding:12px 14px;border-radius:14px;background:#F4F7FA;display:flex;flex-direction:column;gap:8px}
.obarcbar p{margin:0;font-size:14px;line-height:1.4}
.obarcacts{display:flex;flex-wrap:wrap;gap:8px}
.obarcbtn{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:8px 14px;border-radius:12px;border:2px solid #0A4A63;background:#fff;color:#0A4A63;font:inherit;font-size:14px;font-weight:700;cursor:pointer;text-decoration:none;box-sizing:border-box}
.obarcnote{margin:8px 0 0;font-size:13px;line-height:1.4;color:#4A5663}
.scaledlg .binflags{margin:10px 0 12px}
.obaskcard .binflag{margin:0 0 8px}
.binflagwrap{display:flex;flex-direction:column;gap:8px;width:100%;max-width:100%;box-sizing:border-box}
.bintip{margin:0;padding:12px 14px;border-radius:14px;background:#FFF6D8;border:1.5px solid #E8B13A;color:#3A2800;font-size:14px;line-height:1.4}
.bintip p{margin:0;overflow-wrap:anywhere}
.obarcpop{position:fixed;inset:0;z-index:1000;background:rgba(18,32,46,.5);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;font-family:var(--font,Arial,sans-serif)}
.obarcdlg{background:#fff;color:#12202E;width:100%;max-width:480px;max-height:100%;overflow-y:auto;border-radius:20px;padding:18px;box-sizing:border-box;display:flex;flex-direction:column;gap:12px;box-shadow:0 20px 60px rgba(0,0,0,.3)}
.obarchead{display:flex;align-items:flex-start;gap:10px}.obarchead h2{margin:0;font-size:20px;flex:1}
.obarcx{width:44px;height:44px;border-radius:22px;border:0;background:#EEF1F4;color:#24313E;font-size:18px;cursor:pointer;flex-shrink:0}
.obarcsub{margin:0;font-size:14px;color:#4A5663}
.obarclist{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:8px}
.obarclist li{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;border:1.5px solid #E3E7EB;background:#fff}
.obarclist li.new{border:2px solid #F5B83D;background:#FFFBF0}
.obarclist .t{flex:1;min-width:0;font-size:15px}.obarclist .t b{display:block;overflow-wrap:anywhere}.obarclist .t small{display:block;font-size:12px;font-weight:700;color:#8A5A00}
.obarcrm{min-height:40px;padding:0 12px;border-radius:10px;border:1.5px solid #C9D2DC;background:#fff;color:#4A5663;font:inherit;font-size:13px;font-weight:700;cursor:pointer}
.obarcback{width:100%}
.binflag.obhave{cursor:default;background:#FFF6DB;border:2px solid #F1B92D;color:#4A3300;align-items:center}
.binflag.obhave>span:first-child{color:#C99A2E}.binflag.obhave b{color:#14222C}
.obhavego{margin-left:auto;font:inherit;font-size:13px;font-weight:700;color:#0B4F6C;background:#fff;border:2px solid #0B4F6C;border-radius:999px;padding:4px 12px;cursor:pointer;min-height:36px}
.obarclist li{flex-wrap:wrap}
.obarcstyles{flex-basis:100%;display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:2px}
.obarcst{flex:1 1 auto;min-height:40px;padding:0 12px;border-radius:999px;border:2px solid #0B4F6C;background:#fff;color:#0B4F6C;font:inherit;font-size:14px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;text-decoration:none;white-space:nowrap}
.obarcst:hover{background:#EEF4F7}
.obarcst{gap:6px}.obarcst svg{flex-shrink:0}.obarcext{font-size:12px;opacity:.7}`;
  document.head.appendChild(css);

  const origScale = W.scaleButtons;
  if (typeof origScale === "function") W.scaleButtons = function (q, c) {
    const h = origScale.apply(this, arguments);
    if (!c || !c.done) return h;
    return h + flags(q);
  };
  const origSheet = W.scaleSheet;
  if (typeof origSheet === "function") W.scaleSheet = function () {
    const h = origSheet.apply(this, arguments);
    const k = (typeof S !== "undefined" && S.scale) || "";
    if (!h || !k || k === "__ev" || !W.SCALES || !W.SCALES[k]) return h;
    const btn = flagSet([k]);
    return h.replace('<button type="button" class="btn" data-act="scaleclose" style="width:100%">Back to questions</button>', btn + '<button type="button" class="btn" data-act="scaleclose" style="width:100%">Back to questions</button>');
  };

  /* Clicks (Ken, Nov 25): the vetting page's own click handler doesn't know these buttons, so this file handles them.
     Saving a topic opens a pop-up with the whole Study List, so it's clear it was saved; "Back to questions"
     closes it and leaves the page exactly where it was (nothing behind the pop-up is redrawn except the button itself). */
  let pop = null, popKey = "", popMsg = "";
  function refresh() {
    document.querySelectorAll(".obflagset[data-ks]").forEach((el) => { el.outerHTML = flagSet(el.dataset.ks.split(",").filter(Boolean)); });
    document.querySelectorAll(".obarcbar").forEach((el) => { el.outerHTML = bar(); });
  }
  function drawPop() {
    if (!pop) return;
    const ks = liveKeys().sort((a, b) => B.cards[b].added - B.cards[a].added);
    const items = ks.map((k) => `<li class="${k === popKey ? "new" : ""}"><span class="t"><b>${esc(W.SCALES[k].title)}</b>${k === popKey ? "<small>Just added</small>" : ""}</span>
      <button type="button" class="obarcrm" data-obarc="rm" data-k="${k}" aria-label="Remove ${esc(W.SCALES[k].title)}">Remove</button>
      ${styles(k)}</li>`).join("");
    pop.innerHTML = `<div class="obarcdlg" role="dialog" aria-modal="true" aria-labelledby="obarcT">
      <div class="obarchead"><h2 id="obarcT">${popMsg ? esc(popMsg) : "Your Study List"}</h2>
        <button type="button" class="obarcx" data-obarc="close" aria-label="Close">✕</button></div>
      ${ks.length ? `<p class="obarcsub">${ks.length} topic${ks.length === 1 ? "" : "s"} saved from this page.</p><ul class="obarclist">${items}</ul>
        <div class="obarcacts"><button type="button" class="obarcbtn" data-obarc="copy">${copied ? "Copied" : "Copy list"}</button>
          <a class="obarcbtn" href="${esc(appHref())}" target="_blank" rel="noopener">Study these in ${esc(APP_NAME)}</a></div>
        <p class="obarcnote">Pick how to study each topic. Jingle opens here; Picture, Flashcard and Game open ${esc(APP_NAME)} with your list, straight to that topic. Study these in ${esc(APP_NAME)} opens the whole list there. This page can't share storage with the app.</p>`
        : `<p class="obarcsub">Nothing saved yet. Tap Add to Study List under a question's reference card.</p>`}
      <button type="button" class="btn obarcback" data-obarc="close">Back to questions</button></div>`;
  }
  // How to study a topic lives on the Study List (Ken, Nov 26), the same four styles as the app. Jingle opens right here;
  // Picture, Flashcard and Game open the app with the list imported and that topic's style already open.
  const STYLES = [["picture", "Picture"], ["jingle", "Jingle"], ["flash", "Flashcard"], ["game", "Game"]];
  // the same symbols as the app's Study List (js/bin.js), the joystick for Game (Ken, Nov 26)
  const SI = (d) => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const ICON = {
    picture: SI('<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.6"/><path d="M21 16l-5-5-8 8"/>'),
    jingle: SI('<path d="M9 18V6l11-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>'),
    flash: SI('<rect x="8" y="3" width="13" height="15" rx="2"/><path d="M5 7v12a2 2 0 0 0 2 2h10"/>'),
    game: SI('<rect x="3" y="15" width="18" height="6" rx="2.5"/><path d="M12 15V9.5"/><circle cx="12" cy="6.5" r="3"/><path d="M7 18h.01M16.5 18h.01"/>'),
  };
  function styles(k) {
    return `<div class="obarcstyles" role="group" aria-label="How to study ${esc(W.SCALES[k].title)}">${STYLES.map(([s, t]) =>
      s === "jingle" && W.OB_VET_JINGLE ? `<button type="button" class="obarcst" data-objing="${k}">${ICON[s]}${t}</button>`
        : `<a class="obarcst" href="${esc(appHref() + "&study=" + encodeURIComponent(k + ":" + s))}" target="_blank" rel="noopener" aria-label="${t} (opens ${esc(APP_NAME)})">${ICON[s]}${t}<span aria-hidden="true" class="obarcext">↗</span></a>`).join("")}</div>`;
  }
  function openPop(k, msg) {
    popKey = k || ""; popMsg = msg || "";
    if (!pop) { pop = document.createElement("div"); pop.className = "obarcpop"; document.body.appendChild(pop); }
    drawPop();
    const b = pop.querySelector(".obarcback"); if (b) b.focus();
  }
  function closePop() { if (pop) pop.remove(); pop = null; popKey = ""; popMsg = ""; }
  function copyList(el) {
    const code = listCode(); copied = true;
    const done = () => { document.querySelectorAll('[data-obarc="copy"],[data-act="obarccopy"]').forEach((x) => { x.textContent = "Copied"; }); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done).catch(done); else done();
  }
  document.addEventListener("click", (e) => {
    const f = e.target.closest('[data-act="binflag"]');
    if (f) {
      e.preventDefault(); e.stopPropagation();
      const k = f.dataset.k, was = inBin(k);
      toggle(k); copied = false; refresh();
      if (!was && inBin(k)) openPop(k, "Saved to your Study List");
      return;
    }
    if (e.target.closest('[data-act="obarccopy"]')) { e.preventDefault(); e.stopPropagation(); copyList(); return; }
    if (e.target.closest('[data-act="obarcopen"]')) { e.preventDefault(); e.stopPropagation(); openPop("", ""); return; }
    const b = e.target.closest("[data-obarc]");
    if (!b) { if (pop && e.target === pop) closePop(); return; }
    e.preventDefault(); e.stopPropagation();
    const a = b.dataset.obarc;
    if (a === "close") closePop();
    else if (a === "copy") copyList();
    else if (a === "rm") { delete B.cards[b.dataset.k]; save(); copied = false; if (popKey === b.dataset.k) { popKey = ""; popMsg = ""; } refresh(); drawPop(); }
  }, true);
  document.addEventListener("keydown", (e) => { if (pop && e.key === "Escape") { e.stopPropagation(); closePop(); } }, true);

  W.OB_VET_ARCADE = { flag, keysFor, listCode, inBin, toggle, closePop, openPop };
})();
