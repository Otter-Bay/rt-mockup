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
