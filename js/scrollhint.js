/* "More below" arrow. Owner: Ken + Claude.
   Shows a small round down-arrow in the bottom-right corner of any scrollable area (question, Practice page, home page,
   results, pop-up cards) while there is more content below. Tapping it scrolls down most of a screen.
   It hides itself at the bottom. Works by watching the page, so no other file needs to change. Load last. */
(function () {
  const SEL = ".content, .stats, .results, .obscroll, .dialog";
  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const buttons = new Map();   // scroll element -> its arrow button
  let queued = false;

  const css = document.createElement("style");
  css.textContent = `.scrollhint { position: absolute; z-index: 6; width: 36px; height: 36px; margin-left: -18px; border-radius: 18px;
  border: 0; background: rgba(18,32,46,.78); color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer;
  box-shadow: 0 4px 12px rgba(18,32,46,.3); opacity: 1; transition: opacity .2s; padding: 0; }
.scrollhint:hover { background: rgba(18,32,46,.9); }
.scrollhint:focus-visible { outline: 3px solid #8CC4FF; outline-offset: 2px; }
.scrollhint[hidden] { display: none; }
@media (prefers-reduced-motion: no-preference) { .scrollhint svg { animation: shbob 1.6s ease-in-out infinite; } }
@keyframes shbob { 0%, 100% { transform: translateY(-2px); } 50% { transform: translateY(2px); } }`;
  document.head.appendChild(css);

  const ARROW = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';

  function place(el, btn) {
    const host = el.offsetParent;
    if (!host) { btn.hidden = true; return; }
    if (btn.parentNode !== host) host.appendChild(btn);
    // position from el's box relative to its offsetParent
    let x = el.offsetLeft, y = el.offsetTop;
    btn.style.left = (x + el.clientWidth - 30) + "px";   // bottom-right corner, clear of left-aligned content
    btn.style.top = (y + el.clientHeight - 48) + "px";
    const more = el.scrollHeight - el.scrollTop - el.clientHeight > 24;
    const top = document.querySelector(".scrim");   // a pop-up is open: only its own arrow shows
    btn.hidden = !more || el.clientHeight < 140 || (top && !top.contains(el));
  }

  function update() {
    queued = false;
    const live = new Set(document.querySelectorAll(SEL));
    for (const [el, btn] of buttons) if (!live.has(el) || !el.isConnected) { btn.remove(); buttons.delete(el); }
    for (const el of live) {
      const st = getComputedStyle(el).overflowY;
      if (st !== "auto" && st !== "scroll") continue;
      let btn = buttons.get(el);
      if (!btn) {
        btn = document.createElement("button");
        btn.type = "button"; btn.className = "scrollhint"; btn.innerHTML = ARROW;
        btn.setAttribute("aria-label", "Scroll down for more");
        btn.addEventListener("click", (e) => { e.stopPropagation(); el.scrollBy({ top: el.clientHeight * 0.8, behavior: reduce ? "auto" : "smooth" }); });
        buttons.set(el, btn);
      }
      place(el, btn);
    }
  }
  const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };

  // Re-check after every screen change (but ignore our own arrows being added or moved).
  new MutationObserver((muts) => {
    if (muts.every((m) => [...m.addedNodes, ...m.removedNodes].every((n) => n.classList && n.classList.contains("scrollhint")))) return;
    schedule();
  }).observe(document.body, { childList: true, subtree: true });
  document.addEventListener("scroll", schedule, true);
  window.addEventListener("resize", schedule);
  document.addEventListener("toggle", schedule, true);   // <details> opening changes height
  window.addEventListener("load", schedule);
  setTimeout(schedule, 300);
})();
