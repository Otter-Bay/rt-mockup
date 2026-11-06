/* Learner progress: review list and per-question stats, saved in this browser.
   In the real app these map to users/{uid}/reviewList and users/{uid}/questionProgress in Firestore. */
function seenIntro() { try { return localStorage.getItem("rtIntroSeen") === "1"; } catch (e) { return false; } }
function markIntro() { try { localStorage.setItem("rtIntroSeen", "1"); } catch (e) {} }
// Each exam (RRT, SDS, RPSGT) keeps its own review list and stats on the same site.
const NS = window.APP_LABEL && window.APP_LABEL !== "RRT" ? window.APP_LABEL + ":" : "";
function load(k, d) { try { const v = localStorage.getItem(NS + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
function save(k, v) { try { localStorage.setItem(NS + k, JSON.stringify(v)); } catch (e) {} }
const RL = load("rtReviewList", {});   // { questionId: { reason: "missed"|"unsure"|"manual", streak: 0|1, added: ms } }
const ST = load("rtStats", {});        // { questionId: { attempts, correct, lastCorrect } }
// SCORING RULE (Nov 6): every score counts your LATEST try at each question, so improvement shows right away
// and early mistakes stop dragging you down. attempts/correct are kept for the "up from X% counting every try" line.
const REASON_TXT = { missed: "Answered wrong", unsure: "Marked not sure", manual: "Added by you" };

function recordAnswer(q, c) {
  const ok = c.sel === q.ans;
  const st = ST[q.id] || { attempts: 0, correct: 0, lastCorrect: null };
  st.attempts += 1; if (ok) st.correct += 1; st.lastCorrect = ok; ST[q.id] = st; save("rtStats", ST);
  if (!ok) { RL[q.id] = { reason: "missed", streak: 0, added: Date.now() }; c.note = "added-missed"; }
  else if (c.unsure) { RL[q.id] = { reason: "unsure", streak: 0, added: Date.now() }; c.note = "added-unsure"; }
  else if (RL[q.id]) {
    RL[q.id].streak += 1;
    if (RL[q.id].streak >= 2) { delete RL[q.id]; c.note = "cleared"; } else c.note = "progress";
  } else c.note = null;
  save("rtReviewList", RL);
}

/* Encouraging words after a comparison (exams or chapters). d = change in points, mins = minutes faster (+) or slower (-),
   best = area that improved most, next = good area to practice next, since = label of the earlier try. Plain and honest. */
function cheer(d, opts) {
  const o = opts || {}, clean = (n) => String(n).replace(/^([IVX]+|\d+)\.\s*/, "");   // "III. Role of the Nurse Aide" -> "Role of the Nurse Aide"
  const best = o.best ? `<b>${esc(clean(o.best))}</b>` : "", next = o.next ? `<b>${esc(clean(o.next))}</b>` : "";
  const faster = o.mins >= 1 ? `, and you finished ${o.mins} minute${o.mins === 1 ? "" : "s"} faster` : "";
  let tone, msg;
  if (d >= 10) { tone = "up"; msg = `Big jump: up ${d} points since ${o.since}${faster}. ${best ? `Your work on ${best} really shows.` : "Your practice is paying off."}`; }
  else if (d >= 3) { tone = "up"; msg = `Nice progress: up ${d} points${faster}. ${best ? `${best} improved the most.` : "Keep it going."}${next ? ` Next, a little more ${next} could lift you further.` : ""}`; }
  else if (d > -3) { tone = "steady"; msg = `Holding steady${faster}. Consistency counts on exam day.${next ? ` To push higher, try a set from ${next}.` : ""}`; }
  else { tone = "soft"; msg = `A tougher one this time, down ${-d} points. ${o.exam ? "Every exam is a different mix of questions, so one score doesn't define you." : "Breaks and new material can do that, and it comes back with practice."}${next ? ` ${next} is a good place to practice next.` : ""}`; }
  const close = tone === "up" ? "You're well on your way to being as prepared as you can be for test day."
    : tone === "steady" ? "You're on your way to being as prepared as you can be for test day."
    : "Keep going. You're still on your way to being as prepared as you can be for test day.";
  return `<p class="cheer ${tone}" role="status">${msg} <span class="cheerend">${close}</span></p>`;
}
(function () { const c = document.createElement("style");
  c.textContent = `.cheer { margin: 0; padding: 10px 12px; border-radius: 12px; font-size: 14px; line-height: 1.45; color: #24313E; background: #F3F5F7; }
.cheer.up { background: #E3F4EA; color: #17603C; } .cheerend { display: block; margin-top: 4px; font-weight: 700; } .cheer.soft { background: #FFF6E0; color: #4A3500; }`;
  document.head.appendChild(c); })();
