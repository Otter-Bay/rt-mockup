/* Jingle player inside the question-vetting pages (Ken, Nov 26: "give me the desktop version to get used to the jingle
   methodology ... use SDS 200 vetting"). Each question's topic gets a "♪ Try it as a jingle" button beside Add to Study List,
   and the Study List pop-up gets one per topic. It opens the same player as the apps (js/jingle.js) full screen, laid out for a
   computer (lines on the left, player on the right) and for a phone. It opens from the Study List pop-up: each saved topic has
   Picture, Jingle, Flashcard and Game, and Jingle plays right here.
   This page can't share storage with the app: lyrics, style and recordings made here stay in this browser. Storage uses the
   app's names (obStudyPage:${EXAM}:topic for the words, obJinglePrefs:${EXAM}, obStudyMethods:${EXAM}, IndexedDB obJingleRec:${EXAM}).
   Built into the vetting pages by tools/vetting/build_embed.js, after recall.js (data half only), memory_ideas.js and jingle.js. */
(function () {
  const W = window, EXAM = W.EXAM || "RRT";
  if (!W.OB_JINGLE || !W.OB_STUDY) return;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // the page the player edits: the same study-page record as the app, kept in this browser
  const PAGE_KEY = (k) => `obStudyPage:${EXAM}:${k}`;
  const ST = { k: null, jingle: true };
  let PG = null;
  const blank = () => ({ layout: "cards", ink: [], stickers: {}, moves: {}, hist: [], done: false, at: Date.now(), pics: {}, song: { tune: "", lines: {}, print: false, asked: false } });
  const loadPage = (k) => { try { const p = JSON.parse(localStorage.getItem(PAGE_KEY(k)) || "null"); if (p) { p.song = Object.assign({ tune: "", lines: {}, print: false, asked: false }, p.song || {}); return p; } } catch (e) {} return blank(); };
  Object.assign(W.OB_STUDY, { state: ST, page: () => PG, savePage: () => { if (!ST.k || !PG) return; PG.at = Date.now(); PG.title = (W.SCALES[ST.k] || {}).title; try { localStorage.setItem(PAGE_KEY(ST.k), JSON.stringify(PG)); } catch (e) {} } });

  let box = null;
  function draw() {
    if (!box || !ST.k) return;
    const m = W.OB_STUDY.model(ST.k, { mine: PG, layout: "cards" }); if (!m) return;
    const keepY = box.scrollTop;
    box.querySelector(".objingin").innerHTML = W.OB_JINGLE.html(m, PG, { embedded: true });
    box.scrollTop = keepY;
  }
  function open(k) {
    if (!k || !W.SCALES[k]) return;
    W.OB_JINGLE.stop(true);
    ST.k = k; PG = loadPage(k);
    if (!box) {
      box = document.createElement("div"); box.className = "objing"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "Jingle player");
      box.innerHTML = '<div class="objingin"></div>'; document.body.appendChild(box);
    }
    box.scrollTop = 0; draw();
  }
  let FROM_LIST = false;
  // closing goes back to where they came from: the Study List when they started there
  function close() { W.OB_JINGLE.stop(true); if (box) box.remove(); box = null; if (FROM_LIST && W.OB_VET_ARCADE && W.OB_VET_ARCADE.openPop) { FROM_LIST = false; W.OB_VET_ARCADE.openPop("", ""); } }
  W.OB_JINGLE.setRerender(draw);
  // clicks inside the player: the page's own click handler doesn't know these buttons
  document.addEventListener("click", (e) => {
    const go = e.target.closest && e.target.closest('[data-objing]');
    if (go) { e.preventDefault(); e.stopPropagation(); FROM_LIST = !!go.closest(".obarcpop"); if (W.OB_VET_ARCADE && W.OB_VET_ARCADE.closePop) W.OB_VET_ARCADE.closePop(); open(go.dataset.objing); return; }
    if (!box || !box.contains(e.target)) return;
    const b = e.target.closest("[data-act]"); if (!b || b.disabled) return;
    const a = b.dataset.act;
    if (a === "jclose") { e.preventDefault(); close(); return; }
    if (a === "jback" || a === "jcard" || a === "jopen") { e.preventDefault(); close(); return; }
    const f = (W.PAGE_ACTIONS || {})[a]; if (!f || !/^j/.test(a)) return;
    if (b.tagName !== "INPUT") e.preventDefault();
    e.stopPropagation();
    if (f(b) !== false) draw();
  }, true);
  document.addEventListener("keydown", (e) => { if (box && e.key === "Escape") { e.stopPropagation(); close(); } }, true);

  // "Try it as a jingle" beside each Add to Study List button (under the question, and on a reference card)
  const jbtn = (k) => W.SCALES[k] ? `<button type="button" class="objingbtn" data-objing="${esc(k)}"><span aria-hidden="true">♪</span><span><b>Try it as a jingle</b><small>${esc(W.SCALES[k].title)}</small></span></button>` : "";
  const addJ = (h) => String(h).replace(/(<button type="button" class="binflag[^"]*" data-act="binflag" data-k="([^"]+)"[\s\S]*?<\/button>)/g, (all, btn, k) => btn + jbtn(k));
  // (Ken, Nov 26: how to study belongs on the Study List, so there's no jingle button under each question; see arcade_ui.js)
  void addJ;

  const css = document.createElement("style");
  css.textContent = `
.objing{position:fixed;inset:0;z-index:1100;background:#EEF4F7;overflow:auto;-webkit-overflow-scrolling:touch;font-family:var(--font,Arial,sans-serif);color:#14222C}
.objingin{max-width:1180px;margin:0 auto;padding:12px 14px 40px;box-sizing:border-box}
.objing .asklabel{font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#3B4A55}
.objing .sthelp{font-size:14px;color:#3B4A55;margin:0;line-height:1.45}
.objing button{-webkit-tap-highlight-color:transparent}
.objingbtn{display:flex;align-items:center;gap:10px;width:100%;margin:6px 0 0;padding:10px 14px;border-radius:14px;border:2px solid #0B4F6C;background:#fff;color:#0B4F6C;font:inherit;text-align:left;cursor:pointer;min-height:52px}
.objingbtn>span:first-child{font-size:22px}.objingbtn b{display:block;font-size:15px}.objingbtn small{display:block;font-size:12.5px;color:#4A5663}
.obarclist .objingsm{min-height:40px;padding:0 12px;border-radius:10px;border:1.5px solid #0B4F6C;background:#fff;color:#0B4F6C;font:inherit;font-size:13px;font-weight:700;cursor:pointer}
${W.OB_JINGLE_CSS || ""}`;
  document.head.appendChild(css);
  W.OB_VET_JINGLE = { open, close };
})();
