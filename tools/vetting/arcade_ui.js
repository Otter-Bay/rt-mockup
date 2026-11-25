/* Add to Arcade, inside the question-vetting pages. Same look and concept-key behavior as the apps (js/bin.js flag()).
   Writes localStorage obBin:{EXAM} in the same format so a page on the same origin as the app shares the Arcade.
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

  function flag(k) {
    if (!W.SCALES || !W.SCALES[k]) return "";
    const on = inBin(k);
    return `<button type="button" class="binflag${on ? " on" : ""}" data-act="binflag" data-k="${k}" aria-pressed="${on}"><span aria-hidden="true">${on ? "★" : "🕹"}</span><span><b>${on ? "In your Memory Arcade" : "Add to Arcade"}</b><small>${esc(W.SCALES[k].title)}</small></span></button>`;
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
  function flags(q) {
    const ks = keysFor(q);
    if (!ks.length) return `<p class="obarcnote">No reference card is linked to this question yet, so it can't go in the Arcade. You can still Ask about it.</p>${bar()}`;
    return `<div class="binflags">${ks.map(flag).join("")}</div>${bar()}`;
  }
  let copied = false;
  function bar() {
    const n = liveKeys().length;
    return `<div class="obarcbar"><p><b>Memory Arcade:</b> ${n ? n + " topic" + (n === 1 ? "" : "s") + " flagged on this page." : "tap Add to Arcade to save this topic."}</p>
      ${n ? `<div class="obarcacts"><button type="button" class="obarcbtn" data-act="obarccopy">${copied ? "Copied" : "Copy list"}</button>
        <a class="obarcbtn" href="${esc(appHref())}" target="_blank" rel="noopener">Open in ${esc(APP_NAME)}</a></div>
        <p class="obarcnote">A Claude artifact or a file on your computer can't share saved cards with the app automatically. Copy the list or open the link. The list is an OBARC1 code of topic keys only. If the link does not add them, use Import on the Memory Arcade screen.</p>`
        : `<p class="obarcnote">This page can't share storage with the app. After you add topics, Copy list and Open in ${esc(APP_NAME)} will appear here.</p>`}
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
.obaskcard .binflag{margin:0 0 8px}`;
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
    const btn = `<div class="binflags">${flag(k)}</div>`;
    return h.replace('<button type="button" class="btn" data-act="scaleclose" style="width:100%">Back to the question</button>', btn + '<button type="button" class="btn" data-act="scaleclose" style="width:100%">Back to the question</button>');
  };

  W.PAGE_ACTIONS = Object.assign(W.PAGE_ACTIONS || {}, {
    binflag: (b) => { toggle(b && b.dataset && b.dataset.k); copied = false; },
    obarccopy: () => {
      const code = listCode();
      copied = true;
      const done = () => { const el = document.querySelector("[data-act=obarccopy]"); if (el) el.textContent = "Copied"; };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(code).then(done).catch(done); else done();
      return false;  // keep the page from a full re-render so "Copied" stays visible
    }
  });

  W.OB_VET_ARCADE = { flag, keysFor, listCode, inBin, toggle };
})();
