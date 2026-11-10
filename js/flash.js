/* Flashcards (Nov 9, 2026). Owner: Ken + Claude.
   A third practice mode beside Study and Exam. Each card shows only the question; the learner thinks of the
   answer, taps Show answer, then rates themselves: Got it, Partly, or Missed it.
   Cards are picked exactly like Study questions (the practice-set builder, its filters, and its 10/20/50 count).
   Ratings are self-graded, so they never change % correct or the charts. Missed and Partly cards go on the
   review list (as "missed" and "not sure"); Got it counts toward clearing a card already on the list.
   Load before app.js. app.js draws FLASH.card() when S.mode === "flash". */
(function () {
  const RATE = { got: "Got it", partly: "Partly", missed: "Missed it" };
  const LOG = load("rtFlash", {});   // { questionId: { rate, at } }  (latest rating per card)
  let DONE = false;                  // true once the last card is rated: show the summary

  function rateCard(q, c, v) {
    c.rate = v; LOG[q.id] = { rate: v, at: Date.now() }; save("rtFlash", LOG);
    if (v === "missed") RL[q.id] = { reason: "missed", streak: 0, added: Date.now() };
    else if (v === "partly") RL[q.id] = { reason: "unsure", streak: 0, added: Date.now() };
    else if (RL[q.id] && !c.counted) { RL[q.id].streak += 1; if (RL[q.id].streak >= 2) delete RL[q.id]; }
    if (v === "got") c.counted = true;
    save("rtReviewList", RL);
  }

  function summary() {
    const n = S.set.length, cnt = { got: 0, partly: 0, missed: 0 };
    S.run.forEach((r) => { if (r.rate) cnt[r.rate] += 1; });
    const work = cnt.partly + cnt.missed;
    return `<div class="sheet"><div class="results fcsum"><p class="eyebrow">Flashcards · done</p><h2>${work ? "Nice work" : "All of them. Nice!"}</h2>
      <div class="score fcscore"><div class="g"><b>${cnt.got}</b><span>got it</span></div><div class="p"><b>${cnt.partly}</b><span>partly</span></div><div class="m"><b>${cnt.missed}</b><span>missed</span></div></div>
      <p class="fcnote">${work ? "Your Partly and Missed cards are both on your review list, so they'll come back around. " : ""}Flashcards are self-checked, so they don't change your % correct.</p>
      ${work ? `<button type="button" class="btn" data-act="fcagain">Go again with the ${work} to work on: ${[cnt.partly ? cnt.partly + " partly" : "", cnt.missed ? cnt.missed + " missed" : ""].filter(Boolean).join(" + ")}</button>` : ""}
      <ol class="rlist">${S.set.map((qx, i) => { const q = QS[qx], r = S.run[i]; return `<li><span class="fctag ${r.rate || "none"}">${r.rate ? RATE[r.rate] : "Skipped"}</span>
        <span class="info"><b>${q.id}</b>${esc(q.topic)}</span><button type="button" class="btn grey" data-act="fcgo" data-i="${i}">Look again</button></li>`; }).join("")}</ol>
      <button type="button" class="btn grey" data-act="fcstudy">Change to multiple choice study</button>
      <div class="row"><button type="button" class="btn grey" data-act="go" data-v="stats">See your progress</button><button type="button" class="btn" data-act="buildask">Start a new set</button></div></div></div>`;
  }

  function card() {
    if (DONE) return summary();
    const q = Q(), c = cur();
    let h = `<div class="sheet"><div class="sheethead"><div class="grab"></div><div class="meta"><div><span class="qid">${q.id}</span>${q.status === "draft" ? `<span class="draft">Draft</span>` : ""}<span class="sec">${esc(q.section)}</span></div>
      <div class="prog" aria-hidden="true"><i style="width:${Math.round((S.qi + 1) / S.set.length * 100)}%"></i></div></div>${switcher()}</div>
      <div class="body"><div class="content fccontent" id="content"><div class="fccard${c.flip ? " flipped" : ""}">
      <p class="eyebrow">${c.flip ? "Question" : "Think of the answer, then flip the card"}</p>
      <p class="stem">${esc(q.stem)}</p>`;
    if (q.rows.length) h += `<dl class="vals">${q.rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("")}</dl>`;
    if (q.after) h += `<p class="stem">${esc(q.after)}</p>`;
    if (q.img) h += `<figure><button type="button" class="imgbtn" data-act="view" aria-label="Enlarge ${esc(q.cap.toLowerCase())}"><img src="${q.img}" alt="${esc(q.alt)}"><span class="ex" aria-hidden="true">${ICON.expand}</span></button><figcaption>${esc(q.cap.toUpperCase())} · TAP TO ENLARGE</figcaption></figure>`;
    h += c.opts || c.flip
      ? `<ol class="fcopts">${L4.map((l, i) => `<li class="${c.flip && l === q.ans ? "ok" : ""}"><b>${l}.</b> ${esc(q.opts[i])}</li>`).join("")}</ol>`
      : `<button type="button" class="link fcshow" data-act="fcopts">Show the answer choices</button>`;
    h += `</div>`;
    if (c.flip) {
      h += `<div class="fcans" id="result" tabindex="-1"><p class="eyebrow">Answer</p><h3>${q.ans}. ${esc(q.opts[L4.indexOf(q.ans)])}</h3><p>${esc(q.why)}</p></div>${scaleButtons(q, { done: true })}
        <fieldset class="fcrate"><legend>How did you do?</legend><div class="fcrb">${Object.keys(RATE).map((k) => `<button type="button" class="fcr ${k}" data-act="fcrate" data-v="${k}" aria-pressed="${c.rate === k}">${RATE[k]}</button>`).join("")}</div>
        <p class="fchint">Got it: you knew it. Partly: close, or you weren't sure. Missed it: you didn't know.</p></fieldset>`;
    }
    h += `</div></div><div class="foot">${S.qi > 0 ? `<button type="button" class="btn grey" data-act="fcback">Back</button>` : ""}<div class="spacer"></div>
      ${c.flip ? `<button type="button" class="btn" data-act="fcnext">${S.qi === S.set.length - 1 ? "See results" : c.rate ? "Next card" : "Skip"}</button>`
               : `<button type="button" class="btn fcflip" data-act="fcflip">Show answer</button>`}</div></div>`;
    return h;
  }

  function toTop() { const ct = document.getElementById("content"); if (ct) ct.scrollTop = 0; }
  function advance() { S.scale = null; if (S.qi === S.set.length - 1) DONE = true; else S.qi += 1; toTop(); }

  /* One-tap switch between multiple choice (Study) and Flashcards on the same set, keeping your place (Nov 9). */
  function switcher() {
    if (S.mode !== "study" && S.mode !== "flash") return "";
    return `<div class="mswitch" role="group" aria-label="Question format">${[["study", "Multiple choice"], ["flash", "Flashcard"]].map(([k, l]) => `<button type="button" data-act="mswap" data-m="${k}" aria-pressed="${S.mode === k}">${l}</button>`).join("")}</div>`;
  }
  window.FLASH = { card, switcher, reset: () => { DONE = false; } };
  window.PAGE_ACTIONS = Object.assign(window.PAGE_ACTIONS || {}, {
    mswap: (b) => { const m = b.dataset.m; if (S.mode === m || (m !== "study" && m !== "flash")) return; if (S.qi >= S.set.length) S.qi = 0; DONE = false; S.scale = null; S.mode = m; S.build.mode = m; S.toTop = true; },
    fcopts: () => { cur().opts = true; },
    fcflip: () => { cur().flip = true; setTimeout(() => { const r = document.getElementById("result"), box = document.getElementById("content");
      if (r && box) { box.scrollTo({ top: Math.max(0, r.offsetTop - box.offsetTop - 12), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); r.focus({ preventScroll: true }); } }, 0); },
    fcrate: (b) => { rateCard(Q(), cur(), b.dataset.v); advance(); },
    fcnext: () => advance(),
    fcback: () => { S.scale = null; if (S.qi > 0) S.qi -= 1; toTop(); },
    fcgo: (b) => { DONE = false; S.qi = Number(b.dataset.i); S.toTop = true; },
    fcagain: () => { const set = S.set.filter((ix, i) => S.run[i].rate === "partly" || S.run[i].rate === "missed"); DONE = false; S.set = set; newRun(); },
    fcstudy: () => { DONE = false; S.mode = "study"; S.build.mode = "study"; newRun(); },
  });

  const st = document.createElement("style");
  st.textContent = `
.fccontent { gap: 14px; }
.fccard { display: flex; flex-direction: column; gap: 12px; padding: 16px; border-radius: 16px; background: #FBFCFD; border: 1.5px solid #D5DCE3; box-shadow: 0 2px 10px rgba(18,32,46,.06); }
.fccard.flipped { background: #fff; }
.fcopts { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; font-size: 15px; line-height: 1.4; color: #24313E; }
.fcopts li { padding: 8px 10px; border-radius: 10px; background: #F4F6F8; }
.fcopts li.ok { background: var(--good-bg); border: 2px solid #3FA36B; color: var(--good-ink); font-weight: 700; }
.fcshow { align-self: flex-start; }
.fcans { display: flex; flex-direction: column; gap: 8px; padding: 14px; border-radius: 14px; background: var(--good-bg); border: 1.5px solid #8CCAA6; }
.fcans:focus { outline: none; }
.fcans h3 { margin: 0; font-size: 18px; color: var(--good-ink); }
.fcans p:not(.eyebrow) { margin: 0; font-size: 15px; line-height: 1.5; color: #24313E; }
.fcrate { gap: 8px; }
.fcrb { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.fcr { min-height: 52px; border-radius: 12px; font: inherit; font-size: 15px; font-weight: 700; cursor: pointer; background: #fff; border: 2px solid; }
.fcr.got { border-color: #3FA36B; color: var(--good-ink); } .fcr.partly { border-color: #D99A1E; color: #6A4A00; } .fcr.missed { border-color: #E08A5E; color: #A3360A; }
.fcr.got[aria-pressed="true"] { background: var(--good); border-color: var(--good); color: #fff; }
.fcr.partly[aria-pressed="true"] { background: #B7791F; border-color: #B7791F; color: #fff; }
.fcr.missed[aria-pressed="true"] { background: var(--bad); border-color: var(--bad); color: #fff; }
.fchint { margin: 0; font-size: 13px; color: var(--muted); line-height: 1.4; }
.fcflip { min-width: 160px; }
.fcscore div.g { background: var(--good-bg); border-color: #8CCAA6; } .fcscore div.p { background: #FFF8E6; border-color: #EBC46A; } .fcscore div.m { background: var(--bad-bg); border-color: #F0B79A; }
.fcnote { margin: 0; font-size: 14px; color: var(--muted); line-height: 1.45; }
.fctag { font-size: 12px; font-weight: 700; padding: 3px 8px; border-radius: 10px; white-space: nowrap; flex-shrink: 0; }
.fctag.got { background: var(--good-bg); color: var(--good-ink); } .fctag.partly { background: #FFF3D1; color: #6A4A00; } .fctag.missed { background: var(--bad-bg); color: var(--bad-ink); } .fctag.none { background: #EEF1F4; color: var(--muted); }
.mode.flash { background: #6E4BC2; color: #fff; }
.mswitch { display: flex; gap: 4px; padding: 3px; border-radius: 12px; background: #EEF1F4; }
.mswitch button { flex: 1; min-height: 36px; border: 0; border-radius: 9px; background: transparent; color: #3E4A57; font: inherit; font-size: 14px; font-weight: 700; cursor: pointer; }
.mswitch button[aria-pressed="true"] { background: #fff; color: #12202E; box-shadow: 0 1px 3px rgba(18,32,46,.18); }
.mswitch button:focus-visible { outline: 3px solid #8CC4FF; outline-offset: 1px; }`;
  document.head.appendChild(st);
})();
