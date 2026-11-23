/* Voice questions ("Ask"), demo. Owner: Ken + Claude. Team decision: Nov 16 meeting (hub DECISIONS.md, "Voice Q&A feature").
   A learner asks a question out loud (or types it). The app finds the closest card in the expert-vetted answer library
   (for now: the info-button cards in scales.js, sleep_scales.js and cna_scales.js), shows it, and can read it aloud.
   No match: the learner can send the question to our experts. In this mock-up sent questions stay in this browser (localStorage);
   no network calls and no AI calls. Matching is a small keyword and synonym index built from each card's text.
   Quick launch: add ?ask=1 to the address to open straight to the Ask screen and start listening (the web app manifest's
   "Ask a question" shortcut uses it). Load after app.js and the card files. Adds a page through window.PAGES / PAGE_ACTIONS
   and wraps render() (same pattern as coach.js), so app.js stays untouched. */
(function () {
  if (!window.SCALES) return;
  const EXAM = window.EXAM || "RRT";
  const FIELD_NAME = { rt: "respiratory therapy", sleep: "sleep technology", cna: "nurse assistant" };
  // Which card fields are in scope for each app. SDS is an NBRC specialty for respiratory therapists, so RT cards count there too.
  const APP_FIELDS = { RRT: ["rt"], SDS: ["rt", "sleep"], RPSGT: ["sleep"], CNA: ["cna"] };
  const MINE = [...(APP_FIELDS[EXAM] || ["rt"]), "all"];   // "all" = cards for every field (for example medication safety)
  // Same colors as each app's home theme in home.js (kept short on purpose).
  const THEME = { RRT: ["#0A4A63", "#3FB8B3", "#E7F4F3", "#F5B83D", "#3A2600"], SDS: ["#14193F", "#7E8FD6", "#ECEEF8", "#C9B8FF", "#1C1240"],
    RPSGT: ["#123B2E", "#7CC4A0", "#EAF4EE", "#F2A65A", "#3A1E00"], CNA: ["#5A2340", "#F2A3A0", "#FBEFF0", "#FFD37A", "#3A2400"] }[EXAM] || [];
  const themeVars = () => THEME.length ? `--bay:${THEME[0]};--tide:${THEME[1]};--glass:${THEME[2]};--buoy:${THEME[3]};--accentInk:${THEME[4]}` : "";
  const EXAMPLES = { RRT: ["What is static compliance?", "Glasgow Coma Scale", "Nasal cannula FIO2"],
    SDS: ["How is a hypopnea scored?", "What does AHI mean?", "Medicare CPAP compliance"],
    RPSGT: ["Arousal rule", "How do I score sleep stages?", "Periodic limb movements"],
    CNA: ["Normal pulse range", "How do I put on PPE?", "Fowler's position"] }[EXAM] || ["Glasgow Coma Scale"];

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const TTS = "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined";
  const KEY = "obAskSent";
  const loadSent = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } };
  const V = { text: "", listening: false, res: null, pick: 0, from: "home", sent: false, err: "", speaking: false };
  let rec = null;

  // ---------- Matching: keyword and synonym index over the cards ----------
  // Extra words people say for each card (abbreviations, everyday names). The card's own title, intro, table and note are indexed too.
  const ALIAS = {
    apgar: "newborn score", borg: "dyspnea breathlessness short of breath shortness rating", gcs: "gcs glasgow coma consciousness level",
    rass: "rass sedation agitation", berlin: "ards acute respiratory distress syndrome", gold: "copd emphysema chronic bronchitis gold",
    naepp: "asthma severity classify", mallampati: "mallampati difficult airway intubation", ahi: "ahi apnea hypopnea index sleep apnea osa severity",
    spaulding: "disinfect disinfection sterilize sterilization equipment cleaning", ls: "lecithin sphingomyelin fetal lung maturity",
    ardsnet: "peep fio2 table ards", abg: "abg interpret interpretation arterial blood gas acid base acidosis alkalosis ph bicarb bicarbonate winters compensation",
    oxy: "pf ratio gradient alveolar oxygenation index", o2dev: "oxygen nasal cannula mask venturi nonrebreather entrainment fio2 device",
    cylinder: "oxygen tank cylinder how long last duration minutes", ventcalc: "ventilator vent compliance static dynamic resistance plateau tidal volume ibw ideal predicted body weight minute ventilation",
    weaning: "wean weaning extubate extubation sbt spontaneous breathing trial rsbi nif mip", pft: "pulmonary function test spirometry fev1 fvc obstructive restrictive",
    nrp: "neonatal newborn resuscitation nrp", airwaysize: "endotracheal tube ett size depth", airwaycare: "suction suctioning cuff pressure trach tracheostomy",
    precautions: "isolation airborne droplet contact standard precautions", start: "start triage mass casualty", dyshb: "carbon monoxide co poisoning methemoglobin",
    ecg: "ekg ecg heart rhythm interval", acls: "cpr compressions code acls defibrillation", croup: "croup westley", hfnc: "high flow nasal cannula hfnc",
    niv: "bipap cpap noninvasive niv mask ventilation", cf: "cystic fibrosis sweat chloride", actionplan: "asthma action plan peak flow zone",
    staging: "sleep stage stages staging rem score scoring", arousal: "arousal", resp_adult: "apnea hypopnea rera score scoring respiratory event",
    hypopnea: "hypopnea score scoring cms aasm", peds_resp: "pediatric child children", plm: "periodic limb movement plm rls leg kick",
    cardiac: "heart arrhythmia sleep cardiac", stats: "sleep efficiency latency total sleep time", tech: "filter setting sampling rate recording",
    titration: "cpap titration pressure", cms: "medicare compliance coverage cpap insurance", ess: "epworth sleepiness", stopbang: "stop bang screening",
    circadian: "circadian shift work delayed phase", mslt: "mslt mwt nap test narcolepsy", electrodes: "electrode sensor placement", infant: "infant baby",
    o2titr: "oxygen bleed titration", papmodes: "bilevel bipap apap asv pap mode", download: "download compliance leak", alt_tx: "oral appliance surgery alternative",
    hsat: "home sleep test hsat", artifacts: "artifact artifacts",
    vitals: "vital signs normal pulse rate heart rate blood pressure temperature respirations", io: "intake output fluid", positions: "fowler sims supine prone lateral position positioning",
    isolation: "isolation precautions", ppe: "glove gloves gown mask donning doffing ppe put on take off", fire: "fire race pass extinguisher",
    pressure: "bed sore bedsore pressure ulcer injury", rom: "range of motion abduction flexion", diets: "diet diets clear liquid",
    transfers: "gait belt transfer wheelchair walking", documentation: "charting chart documentation", abbr_donotuse: "do not use dangerous unsafe banned abbreviation abbreviations unit units qd qod daily every other day trailing leading zero ms mso4 mgso4 medication error safe", abuse: "abuse neglect report", rights: "resident rights",
  };
  // Words that mean the same thing in a question (each side is also searched for the other).
  const SYN = { o2: "oxygen", oxygen: "o2", ekg: "ecg", ecg: "ekg", vent: "ventilator", ventilator: "vent", bipap: "bilevel", bilevel: "bipap",
    glasgow: "gcs", gcs: "glasgow", bp: "blood pressure", hr: "pulse", sat: "spo2", sats: "spo2", tube: "ett", ett: "tube", trach: "tracheostomy",
    copd: "emphysema", bedsore: "pressure", co: "monoxide", pco2: "paco2", po2: "pao2", co2: "paco2", bicarb: "hco3", hco3: "bicarbonate" };
  const STOP = new Set(("a an the of for to in on at by and or is are was be it its this that what whats how do does did i im me my you your we our can could should would will " +
    "tell about explain show give find get know need want please mean means meaning when why which who where with from into there their them then than " +
    "use used using like some any much many calculate calculating calculation figure out work whats best good way most right correct proper " +
    "hi hello hey thanks thank ok okay um uh").split(" "));   // greetings and filler from spoken questions
  // Light word endings: "scored", "scoring", "scores" and "score" all become "scor"; "injuries" becomes "injury".
  const stem = (w) => {
    if (/^\d/.test(w)) return w;
    if (w.length > 4 && w.endsWith("ies")) return w.slice(0, -3) + "y";
    for (const end of ["ing", "ed", "es", "s", "e"]) if (w.endsWith(end) && !w.endsWith("ss") && w.length - end.length >= 3) return w.slice(0, -end.length);
    return w;
  };
  const PLAIN = {};   // stem -> a readable word, for showing "Searched for"
  const plainWords = (s) => String(s).toLowerCase().replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, " ").replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").split(" ").filter((w) => w.length > 1 && !STOP.has(w));
  const remember = (s) => plainWords(s).forEach((w) => { const t = stem(w); if (!PLAIN[t] || w.length < PLAIN[t].length) PLAIN[t] = w; });
  const words = (s) => String(s).toLowerCase().replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, " ").replace(/[’']/g, "").replace(/[^a-z0-9]+/g, " ").split(" ").filter((w) => w.length > 1 && !STOP.has(w)).map(stem);

  const SYN2 = {};
  Object.keys(SYN).forEach((k) => { SYN2[stem(k)] = SYN[k].split(" ").map(stem); });
  let IDX = null, N = 0;
  function build() {
    const cards = Object.keys(SCALES).map((k) => {
      const s = SCALES[k], w = {};
      const add = (txt, wt) => words(txt).forEach((t) => { if (!STOP.has(t) && (w[t] || 0) < wt) w[t] = wt; });
      add(s.body || "", 1); add((s.intro || "") + " " + (s.note || ""), 1.5); add(s.title, 3); add(ALIAS[k] || "", 2);
      remember([s.title, ALIAS[k] || "", s.intro, s.body, s.note].join(" "));
      return { k, w, seq: " " + words([s.title, ALIAS[k] || "", s.intro, s.body, s.note].join(" ")).join(" ") + " " };
    });
    const df = {};
    cards.forEach((c) => Object.keys(c.w).forEach((t) => { df[t] = (df[t] || 0) + 1; }));
    N = cards.length;
    IDX = { cards, idf: (t) => Math.log(1 + N / (df[t] || 0.5)) };
  }

  // ---------- Spelling and sound-alike fixes ----------
  // Speech recognition and typing both make mistakes ("glascow", "complience", "app gar", "range of moshun").
  // A word that isn't in the library is swapped for the closest library word: one or two letters off, or the same sound.
  let VOCAB = null;
  function vocab() {
    if (VOCAB) return VOCAB;
    const wt = {};
    IDX.cards.forEach((c) => Object.keys(c.w).forEach((t) => { wt[t] = Math.max(wt[t] || 0, c.w[t]); }));
    Object.keys(SYN2).forEach((t) => { wt[t] = Math.max(wt[t] || 0, 2); });
    VOCAB = Object.keys(wt).filter((t) => t.length >= 3 && !/^\d+$/.test(t)).map((t) => ({ t, s: sound(t), strong: wt[t] >= 2 }));
    return VOCAB;
  }
  // Rough "sounds like" key: same key = same sound ("moshun" and "motion", "canula" and "cannula").
  function sound(w) {
    let s = w.toLowerCase().replace(/tion|sion/g, "xn").replace(/ph/g, "f").replace(/ck|q/g, "k").replace(/sh|ch/g, "x")
      .replace(/c(?=[eiy])/g, "s").replace(/c/g, "k").replace(/z/g, "s").replace(/x(?![n])/g, "x").replace(/gh/g, "g").replace(/dg/g, "j");
    s = s[0] + s.slice(1).replace(/[aeiouyhw]/g, "");
    return s.replace(/(.)\1+/g, "$1");
  }
  function dist(a, b) {            // edit distance, with swapped neighbors counting as one
    if (Math.abs(a.length - b.length) > 2) return 9;
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
    return d[a.length][b.length];
  }
  const known = (t) => IDX.cards.some((c) => c.w[t]) || !!SYN2[t];
  function closest(t) {
    if (t.length < 4 || /^\d/.test(t) || known(t)) return null;
    const max = t.length >= 7 ? 2 : 1, st = sound(t);
    let best = null;
    for (const v of vocab()) {
      const dd = dist(t, v.t);
      const sameSound = v.s === st && v.s.length >= 3 && Math.abs(v.t.length - t.length) <= 2;
      let score = dd <= max ? dd : sameSound ? max + 0.5 : 9;
      if (score < 9) score -= (sameSound ? 0.3 : 0) + (v.strong ? 0.1 : 0);   // ties go to same-sounding words and card titles or aliases
      if (score < 9 && (!best || score < best.score || (score === best.score && v.t.length > best.t.length))) best = { t: v.t, score };
    }
    return best && best.t;
  }
  // Fix the question's words; also joins two words that should be one ("app gar" -> "apgar").
  function fixWords(toks, raw) {
    const out = [], fixes = [], said = (i, n) => raw.slice(i, i + n).join(" "), show = (t) => PLAIN[t] || t;
    for (let i = 0; i < toks.length; i++) {
      const t = toks[i];
      if (known(t) || t.length < 3) { out.push(t); continue; }
      const next = toks[i + 1];
      if (next && !known(next)) {
        const joined = stem(t + next), j = known(joined) ? joined : closest(joined);
        if (j) { out.push(j); fixes.push([said(i, 2), show(j)]); i++; continue; }
      }
      const c = closest(t);
      if (c) { out.push(c); fixes.push([said(i, 1), show(c)]); } else out.push(t);
    }
    return { toks: out, fixes };
  }

  // Common mishearings of medical terms by speech recognition. This list grows from the questions students send in.
  const MISHEAR = [[/\b(bye|by|buy|bi) ?pap\b/g, "bipap"], [/\b(see|sea|c) ?pap\b/g, "cpap"], [/\ba ?pap\b/g, "apap"], [/\btrake?s?\b/g, "trach"],
    [/\ba b g\b/g, "abg"], [/\be k g\b/g, "ekg"], [/\bard s\b|\ba r d s\b/g, "ards"], [/\bc o p d\b/g, "copd"], [/\bpeak flow\b/g, "peak flow"],
    [/\bo two\b|\boh two\b/g, "o2"], [/\bc o two\b|\bsee oh two\b/g, "co2"], [/\bfi o2\b|\bfio two\b/g, "fio2"], [/\bsp o2\b|\bsat\b/g, "spo2"]];
  function unmishear(text) {
    let t = " " + String(text).toLowerCase() + " ";
    MISHEAR.forEach(([re, w]) => { t = t.replace(re, w); });
    return t.trim();
  }

  // ---------- Abbreviations: "what does RSBI stand for?" gets a one-line quick answer (acronyms.js) ----------
  const ABBR_COMMON = new Set(["raw", "mas", "pep", "is", "be", "ic", "pc", "nc", "pe", "mg", "f", "va", "ve", "dp", "rv", "oi", "hb", "cf", "tb", "vc", "ms", "sl", "mt", "ca", "ta", "ga", "hh", "lm", "dc", "ai", "hi", "se", "w", "pat", "rip", "rem"]);
  // Everyday words that are also abbreviations ("is" = incentive spirometry, "be" = base excess, "hi" = hypopnea index).
  // They count only when they are the thing being asked about ("what does IS stand for?") or the whole question ("IS?").
  const GRAMMAR = new Set([...STOP, ..."am as if no so up us he go oh ok hi".split(" ")]);
  function abbrHits(text) {
    const A = window.ACRONYMS;
    if (!A) return { hits: [], asked: false };
    const src = String(text);
    const asked = /\b(stand|stands) for\b|\bshort for\b|\babbreviation\b|\bacronym\b|^\s*what (does|do|is) \S+( \S+)? mean/i.test(src);
    const keys = [];
    // The word being asked about: "what does X stand for / mean", "what is X short for", "meaning of X", or a one-word question.
    const m = src.match(/what (?:does|do|is) (?:the )?(?:abbreviation |acronym )?(.+?) (?:stand for|stands for|mean|short for)/i)
      || src.match(/\b(?:meaning of|abbreviation|acronym)\s+(?:of |for )?(?:the )?(\S+(?: \S+)?)\s*\??\s*$/i)
      || src.match(/^\s*(\S+)\s*\??\s*$/);
    if (m) keys.push(A.norm(m[1].replace(/\b([a-z])\s(?=[a-z]\b)/gi, "$1")));
    // Spoken letters ("r s b i") become one word; then each word is checked. Short or everyday words count only in capitals or when asked;
    // grammar words ("is", "be", "an") never count here.
    const joined = src.replace(/\b([a-z0-9])(?:[ .]+(?=[a-z0-9]\b))/gi, "$1");
    joined.split(/\s+/).forEach((w) => {
      const k = A.norm(w);
      if (!k || !A.map[k] || GRAMMAR.has(k)) return;
      const caps = /[A-Z]/.test(w) && w.replace(/[^A-Za-z]/g, "").length >= 2 && w === w.toUpperCase();
      if (caps || asked || (k.length >= 3 && !ABBR_COMMON.has(k))) keys.push(k);
    });
    const seen = new Set(), hits = [];
    keys.forEach((k) => (A.map[k] || []).forEach((h) => { if (!seen.has(h.abbr)) { seen.add(h.abbr); hits.push(h); } }));
    hits.sort((a, b) => (MINE.includes(b.field) ? 1 : 0) - (MINE.includes(a.field) ? 1 : 0));   // this app's meaning first
    return { hits: hits.slice(0, 3), asked };
  }

  // Returns { best, others, q } with card keys, or best = null when nothing is close enough.
  function match(text) {
    const ab = abbrHits(text);
    const r = matchCards(text);
    r.abbr = ab.hits;
    if (ab.hits.length && (ab.asked || !r.best)) {   // a "stand for" question goes to the glossary card
      const cards = [...new Set(ab.hits.map((h) => h.card))];
      r.others = [...new Set([...cards.slice(1), r.best, ...r.others])].filter((x) => x && x !== cards[0]).slice(0, 2);
      r.best = cards[0];
    }
    return r;
  }
  function matchCards(text) {
    if (!IDX) build();
    const raw = plainWords(unmishear(text)).filter((w) => !STOP.has(stem(w)));
    const fixed = fixWords(raw.map(stem), raw);
    const toks = fixed.toks;
    const unknown = new Set(toks.filter((t) => !known(t)));
    if (!toks.length) return { best: null, others: [], q: text };
    const uniq = [...new Set(toks)];
    const total = uniq.reduce((a, t) => a + IDX.idf(t) * (unknown.has(t) ? 0.35 : 1), 0);   // words the library doesn't know count for less
    const scored = IDX.cards.map((c) => {
      let score = 0, got = 0;
      for (const t of uniq) {
        let wt = c.w[t] || 0;
        if (!wt && SYN2[t]) wt = Math.max(...SYN2[t].map((x) => (c.w[x] || 0) * 0.9));
        if (wt) { score += IDX.idf(t) * wt; got += IDX.idf(t); }
      }
      for (let i = 0; i < toks.length - 1; i++) if (c.seq.includes(` ${toks[i]} ${toks[i + 1]} `)) score += IDX.idf(toks[i]) + IDX.idf(toks[i + 1]);   // phrase bonus
      const cover = total ? got / total : 0;
      const field = SCALES[c.k].field || "rt";
      return { k: c.k, cover, score, final: score * (0.4 + cover) * (MINE.includes(field) ? 1.4 : 1) };
    }).filter((x) => x.score > 0).sort((a, b) => b.final - a.final);
    const top = scored[0];
    if (!top || top.cover < 0.5 || top.score < 4) return { best: null, others: [], q: text, near: scored.slice(0, 3), fixes: fixed.fixes };
    const others = scored.slice(1).filter((x) => x.cover >= 0.34 && x.final >= top.final * 0.35).slice(0, 2).map((x) => x.k);
    return { best: top.k, others, q: text, near: scored.slice(0, 3), fixes: fixed.fixes };
  }

  window.OB_ASK_MATCH = (t) => match(t);   // for testing

  // ---------- Read aloud ----------
  function cardSpeech(k) {
    const s = SCALES[k], out = [s.title + ".", s.intro || ""];
    try {
      const doc = new DOMParser().parseFromString(`<div>${s.body || ""}</div>`, "text/html");
      doc.querySelectorAll("table").forEach((tb) => {
        const head = [...tb.querySelectorAll("thead th")].map((th) => th.textContent.trim());
        tb.querySelectorAll("tbody tr").forEach((tr) => {
          const cells = [...tr.children].map((td) => td.textContent.trim());
          out.push(cells.map((c, i) => !c ? "" : i === 0 ? c + ":" : (head[i] ? head[i] + ", " : "") + c + ".").filter(Boolean).join(" "));
        });
      });
    } catch (e) {}
    if (s.note) out.push(String(s.note).replace(/<[^>]+>/g, " "));
    return out.join(" ").replace(/\s+/g, " ").replace(/ · /g, ". ");
  }
  function stopSpeak() { if (TTS) { try { speechSynthesis.cancel(); } catch (e) {} } V.speaking = false; }
  function speak(k) {
    if (!TTS) return;
    stopSpeak();
    const ab = V.res && V.res.abbr && V.res.abbr.length ? V.res.abbr.map((h) => `${h.abbr.split("").join(" ")} stands for ${h.meaning}.`).join(" ") + " " : "";
    const u = new SpeechSynthesisUtterance(ab + cardSpeech(k));
    u.lang = "en-US"; u.rate = 1;
    u.onend = u.onerror = () => { V.speaking = false; if (S.page === "ask") render(); };
    V.speaking = true;
    speechSynthesis.speak(u);
  }

  // ---------- Listening ----------
  const ERR = { "not-allowed": "The microphone is blocked. Allow it for this site in your browser settings, or type your question.",
    "service-not-allowed": "Speech recognition isn't allowed in this browser. Type your question instead.",
    "no-speech": "I didn't hear anything. Tap the mic and try again.", "audio-capture": "No microphone was found. Type your question instead.",
    network: "Speech recognition needs a connection in this browser. Type your question instead.", nosupport: "This browser can't listen. Type your question instead." };
  function setBox(t) { const ta = document.getElementById("askText"); if (ta) ta.value = t; }
  function listen() {
    stopSpeak(); V.err = ""; V.sent = false;
    if (!SR) { V.err = "nosupport"; render(); const ta = document.getElementById("askText"); if (ta) ta.focus(); return; }
    if (rec) { try { rec.stop(); } catch (e) {} return; }   // tapping again stops listening
    V.text = ""; V.res = null;
    rec = new SR();
    rec.lang = "en-US"; rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
    rec.onresult = (e) => { let t = ""; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; V.text = t.trim(); setBox(V.text); };
    rec.onerror = (e) => { if (e.error !== "aborted") V.err = e.error || "nosupport"; };
    rec.onend = () => { rec = null; V.listening = false; if (V.text.trim() && !V.err) find(); else render(); };
    try { rec.start(); V.listening = true; } catch (e) { rec = null; V.listening = false; V.err = "nosupport"; }
    render();
  }
  function stopListening() { if (rec) { try { rec.abort(); } catch (e) {} rec = null; } V.listening = false; }
  function find() {
    const ta = document.getElementById("askText"); if (ta) V.text = ta.value;
    V.err = ""; V.sent = false; V.pick = 0;
    V.res = V.text.trim() ? match(V.text) : null;
    render();
    const sc = document.querySelector(".askscroll"), r = document.getElementById("askRes");   // bring the answer into view
    if (sc && r) sc.scrollTop += r.getBoundingClientRect().top - sc.getBoundingClientRect().top - 8;
  }

  // ---------- Screen ----------
  const MIC = '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg>';
  const SPK = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
  const BACK = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
  window.ASK_ICON = MIC.replace('width="34" height="34"', 'width="20" height="20"');

  function cardHtml(k) {
    const s = SCALES[k], field = s.field || "rt";
    const scope = MINE.includes(field) ? "" : `<p class="askscope">This is ${FIELD_NAME[field] || "other field"} information; check what's in your scope of practice.</p>`;
    return `<article class="askcard" aria-labelledby="askCardT">
      ${scope}<h2 id="askCardT">${s.title}</h2><p class="asksub">${s.intro || ""}</p>
      <div class="sctwrap">${s.body || ""}</div>${s.note ? `<p class="scnote">${s.note}</p>` : ""}
      ${sourceBox(k)}
    </article>`;
  }
  // "Source" button: where the card's information comes from, when it was added and last changed, and its expert-review status.
  const fmtDate = (d) => { if (!d) return ""; const [y, m, dd] = d.split("-").map(Number); return new Date(y, m - 1, dd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); };
  function sourceBox(k) {
    const s = SCALES[k], m = (window.CARD_META || {})[k] || {};
    const rev = s.reviewed ? `Checked by ${esc(s.reviewed.by)} on ${fmtDate(s.reviewed.date)}` : "Expert review: pending";
    const links = (s.links || []).map(([t, u]) => `<li><a href="${u}" target="_blank" rel="noopener">${esc(t)}</a></li>`).join("");
    return `<details class="asksrc"><summary>${SRCICON}<span>Source</span></summary>
      <dl>
        <dt>Where it comes from</dt><dd>${s.src || "Otter Bay"}${links ? `<ul>${links}</ul>` : ""}</dd>
        <dt>Written by</dt><dd>Otter Bay, in our own words from the sources above</dd>
        ${m.added ? `<dt>Added</dt><dd>${fmtDate(m.added)}${m.changed && m.changed !== m.added ? ` <span class="asksrcsub">(last changed ${fmtDate(m.changed)})</span>` : ""}</dd>` : ""}
        <dt>Review</dt><dd>${rev}</dd>
      </dl>
      <p class="asksrcnote">The library is checked every 3 months. For learning only: follow your facility's protocols.</p>
    </details>`;
  }
  const SRCICON = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/></svg>`;
  function sendBox() {
    if (V.sent) return `<div class="askthanks" role="status"><b>Thanks! Your question was sent to our experts.</b><span>We review questions every 3 months and add the most-asked ones to the library. See what you've sent in Settings.</span></div>`;
    return `<button type="button" class="asksend" data-act="asksend">Send it to our experts</button>
      <p class="askfine">Only the question is sent, no name. Check it has no patient names or details.</p>`;
  }
  function results() {
    const r = V.res;
    if (!r) return `<div class="asktry"><p>Try asking:</p>${EXAMPLES.map((x) => `<button type="button" class="askex" data-act="askex" data-q="${esc(x)}">“${esc(x)}”</button>`).join("")}</div>`;
    if (!r.best) return `<div class="asknone" id="askRes" role="status"><h2>Good question! It's not in our library yet.</h2>
      <p>Our experts can add it. Send it to us and we'll look at it in the next library update.</p>${sendBox()}</div>`;
    const list = [r.best, ...r.others], k = list[V.pick] || r.best;
    const quick = r.abbr && r.abbr.length ? `<div class="askabbr"><p class="asklabel">Quick answer</p>${r.abbr.map((h) => `<p><b>${esc(h.abbr)}</b> = ${esc(h.meaning)}</p>`).join("")}</div>` : "";
    return `<div id="askRes" class="askres" role="status">${quick}
      ${r.fixes && r.fixes.length ? `<p class="askfix">Searched for: ${r.fixes.map((f) => `<b>${esc(f[1])}</b>`).join(", ")} <small>(you said ${r.fixes.map((f) => `“${esc(f[0])}”`).join(", ")})</small></p>` : ""}
      <p class="asklabel">${V.pick === 0 ? "Best match" : "Another match"}</p>
      ${TTS ? `<button type="button" class="askread ${V.speaking ? "on" : ""}" data-act="askread" data-k="${k}" aria-pressed="${V.speaking}">${SPK}<span>${V.speaking ? "Stop reading" : "Read aloud"}</span></button>` : ""}
      ${cardHtml(k)}
      ${list.length > 1 ? `<p class="asklabel">Also close</p><div class="askalt">${list.map((x, i) => i === V.pick ? "" : `<button type="button" class="askalt1" data-act="askpick" data-i="${i}">${SCALES[x].title}${MINE.includes(SCALES[x].field || "rt") ? "" : ` <small>${FIELD_NAME[SCALES[x].field]}</small>`}</button>`).join("")}</div>` : ""}
      <details class="asknot"><summary>Not what you asked?</summary>${sendBox()}</details>
    </div>`;
  }
  // The question that was on screen, inside Ask, so the spelling of a term is right there (Ken, Nov 22). Tap a word to add it.
  // The explanation shows only once the answer is revealed, so Ask never gives away an answer.
  const askWords = (t) => String(t || "").replace(/<[^>]+>/g, " ").split(/(\s+)/).map((w) => /\S/.test(w)
    ? `<button type="button" class="askw" data-act="askword" data-w="${esc(w.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9%]+$/g, ""))}">${esc(w)}</button>` : w).join("");
  function askQuestion() {
    const q = V.q; if (!q) return "";
    const rows = (q.rows || []).map((r) => `<p>${askWords(r[0])}: ${askWords(r[1])}</p>`).join("");
    const opts = (q.opts || []).map((o, i) => `<p><b>${"ABCD"[i]}.</b> ${askWords(o)}</p>`).join("");
    return `<details class="askqview"${V.qOpen ? " open" : ""}><summary>See the question (tap a word to add it)</summary><div class="askqbody">
      <p>${askWords(q.stem)}</p>${rows}${q.after ? `<p>${askWords(q.after)}</p>` : ""}${opts}
      ${V.qWhy && q.why ? `<p class="asklabel">Explanation</p><p>${askWords(q.why)}</p>` : ""}</div></details>`;
  }
  function ask() {
    const status = V.listening ? "Listening… ask your question" : V.err ? (ERR[V.err] || ERR.nosupport) : !SR ? "Type your question below." : "Tap the mic and ask, or type below.";
    return `<div class="ob ask" style="${themeVars()}">
      <header class="obtop asktop"><button type="button" class="askback" data-act="askback" aria-label="Back">${BACK}<span>Back</span></button><span class="wm">Ask a question<small>Answers from our reference library</small></span></header>
      <div class="obscroll askscroll">
        <p class="askcare"><span>For learning only. At work, follow your facility's protocols and your supervisor.</span> <b>Never say patient names or details.</b></p>
        <div class="askq"><label for="askText">Your question</label>
          <textarea id="askText" rows="2" enterkeyhint="search" placeholder="For example: What is static compliance?">${esc(V.text)}</textarea>
          <button type="button" class="askfind" data-act="askfind">Find the answer</button></div>
        ${askQuestion()}
        ${results()}
      </div>
      <div class="askdock">
        <p class="askstatus ${V.listening ? "on" : ""} ${V.err ? "err" : ""}" aria-live="polite">${status}</p>
        <button type="button" class="askmic ${V.listening ? "on" : ""}" data-act="askmic" aria-pressed="${V.listening}" aria-label="${V.listening ? "Stop listening" : "Ask out loud"}" ${SR ? "" : "disabled"}>${MIC}<span>${V.listening ? "Stop" : "Ask"}</span></button>
      </div>
    </div>`;
  }

  function open(listenNow) {
    if (S.page !== "ask") V.from = S.page === "quiz" || window.PAGES[S.page] ? S.page : "home";
    if (S.page === "quiz" && typeof Q === "function") { try { V.q = Q(); V.qWhy = typeof revealed === "function" && revealed(); } catch (e) { V.q = null; } }
    else if (S.page !== "ask") V.q = null;
    S.page = "ask"; S.settings = false; S.scale = null;
    V.res = null; V.text = ""; V.err = ""; V.sent = false;
    if (listenNow && SR) { listen(); return false; }
    return undefined;
  }

  window.PAGES = Object.assign(window.PAGES || {}, { ask });
  window.PAGE_ACTIONS = Object.assign(window.PAGE_ACTIONS || {}, {
    ask: () => open(false),
    askback: () => { stopListening(); stopSpeak(); S.page = V.from || "home"; },
    askmic: () => { if (V.listening) { try { rec && rec.stop(); } catch (e) {} return false; } listen(); return false; },
    askfind: () => { stopListening(); find(); return false; },
    askword: (b) => {
      const w = b.dataset.w; if (!w) return false;
      V.text = (V.text.trim() ? V.text.trim() + " " : "") + w; setBox(V.text); b.classList.add("added");
      return false;   // no re-render, so the question stays open where it was
    },
    askex: (b) => { V.text = b.dataset.q; setBox(V.text); find(); return false; },
    askpick: (b) => { stopSpeak(); V.pick = Number(b.dataset.i) || 0; },
    askread: (b) => { if (V.speaking) stopSpeak(); else speak(b.dataset.k); },
    asksend: () => {
      const q = (V.text || "").trim(); if (!q) return false;
      const list = loadSent(); list.unshift({ q, app: EXAM, at: Date.now() });
      try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, 50))); } catch (e) {}
      V.sent = true;
    },
  });

  // Settings: the questions this learner has sent.
  (window.SETTINGS_EXTRA = window.SETTINGS_EXTRA || []).push(() => {
    const list = loadSent();
    return `<fieldset class="asksent"><legend>Questions you've sent</legend>${list.length
      ? `<ul>${list.slice(0, 10).map((x) => `<li><span>“${esc(x.q)}”</span><small>${new Date(x.at).toLocaleDateString([], { month: "short", day: "numeric" })} · ${x.app}</small></li>`).join("")}</ul>`
      : `<p>None yet. When the library can't answer, tap <b>Send it to our experts</b> on the Ask screen.</p>`}</fieldset>`;
  });

  // Ask button on the main screens (Home, Progress, Apps, Questions): added after each render so home.js and app.js stay untouched.
  const r0 = render;
  render = function () {
    if (S.page !== "ask" && (V.listening || V.speaking)) { stopListening(); stopSpeak(); }
    r0();
    if (S.page === "ask") { const ta = document.getElementById("askText"); if (ta && ta.value !== V.text) ta.value = V.text; return; }
    const btn = `<button type="button" class="askbtn" data-act="ask" aria-label="Ask a question">${window.ASK_ICON}<span>Ask</span></button>`;
    const top = document.querySelector("#phone .obtop .obgear"); if (top) top.insertAdjacentHTML("beforebegin", btn);
    const bar = document.querySelector('#phone .appbar [data-act="stats"]'); if (bar) bar.insertAdjacentHTML("beforebegin", btn.replace("askbtn", "askbtn bar"));
  };
  document.addEventListener("input", (e) => { if (e.target && e.target.id === "askText") V.text = e.target.value; });
  document.addEventListener("toggle", (e) => { if (e.target.classList && e.target.classList.contains("askqview")) V.qOpen = e.target.open; }, true);
  document.addEventListener("keydown", (e) => {
    if (e.target && e.target.id === "askText" && e.key === "Enter" && !e.shiftKey) { e.preventDefault(); stopListening(); find(); }
  });

  window.VOICE = { match, build, cardSpeech, open: (l) => { open(l); render(); } };

  // Quick launch: ?ask=1 opens straight to the Ask screen and starts listening.
  if (new URLSearchParams(location.search).get("ask") === "1") {
    open(false); render();
    if (SR) setTimeout(listen, 250);
  } else render();
})();
