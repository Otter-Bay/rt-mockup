/* Study sheets for Ask answers: print the topic you just asked about. Owner: Ken + Claude. (Ken, Nov 23: "the key point being
   having the option to be able to print out an area they are asking about".)
   Two styles, remembered per learner (localStorage obStudyStyle):
     - Recall map: a slash recall pattern (in the spirit of the Evelyn Wood note-taking method; our own design and drawing, no
       course material). The topic runs up a diagonal line from bottom left to top right; each fact cluster (a table row) branches
       off it inside a roomy dashed space where the learner draws their OWN picture around the fact ("Draw your own" is the default,
       Ken: the learner should come up with the image). "Show ideas" adds a faint premade outline (syringe for Boyle's law, kettle for
       Charles's law, ...) as an optional hint. Severity rows are colored green to red AND get their own line style, so a black and
       white printout still shows them.
     - Traditional: a plain outline page: title, the direct answer, the full table, notes, source and lines for notes.
   Each style has Filled (the answer) and Practice (blanks to fill from memory, then flip to Filled and check).
   Pure string builders (no DOM), so tools/test_ask.js can run them in Node. Load after the card files; voice.js draws the screen. */
(function () {
  const W = window;
  const EXAM = W.EXAM || "RRT";
  const APP = { RRT: "CRT/RRT Ready", SDS: "SDS Ready", RPSGT: "RPSGT Ready", CNA: "CNA Ready" }[EXAM] || "Otter Bay";
  const BAY = { RRT: "#0A4A63", SDS: "#14193F", RPSGT: "#123B2E", CNA: "#5A2340" }[EXAM] || "#0A4A63";
  const TIDE = { RRT: "#2C9C97", SDS: "#5B6FC4", RPSGT: "#3F9A6E", CNA: "#C0607A" }[EXAM] || "#2C9C97";
  const ROOT = (() => { try { return ((document.querySelector('link[href*="voice.css"]') || {}).href || "").replace(/css\/voice\.css.*$/, ""); } catch (e) { return ""; } })();
  const LOGO = ROOT + "images/icons/app-" + EXAM.toLowerCase() + "-192.png";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', nbsp: " ", minus: "−", times: "×", deg: "°", le: "≤", ge: "≥", rarr: "→", middot: "·" };
  const plain = (h) => String(h || "").replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").replace(/&(#\d+|[a-z]+);/gi, (m, e) => e[0] === "#" ? String.fromCharCode(+e.slice(1)) : (ENT[e.toLowerCase()] || " ")).replace(/\s+/g, " ").trim();

  // Why this works: verified sources (opened Nov 23, 2026). Shown from the style picker and as one line on the printed map.
  const WHY = {
    text: "In memory studies, people remembered things they drew better than things they wrote out, and drawing also did better than just picturing it or looking at a ready-made picture. " +
      "Making something yourself (your words, your picture) is remembered better than reading it, and laying facts out as a linked map helps people keep them. " +
      "Then filling the Practice sheet from memory and checking it is itself practice: recalling a fact makes it stick longer than rereading it.",
    refs: [
      ["Wammes, Meade & Fernandes (2016). The drawing effect: Evidence for reliable and robust memory benefits in free recall. Quarterly Journal of Experimental Psychology, 69(9), 1752-1776.", "https://doi.org/10.1080/17470218.2015.1094494"],
      ["Fernandes, Wammes & Meade (2018). The surprisingly powerful influence of drawing on memory. Current Directions in Psychological Science, 27(5), 302-308.", "https://doi.org/10.1177/0963721418755385"],
      ["Slamecka & Graf (1978). The generation effect: Delineation of a phenomenon. Journal of Experimental Psychology: Human Learning and Memory, 4(6), 592-604.", "https://doi.org/10.1037/0278-7393.4.6.592"],
      ["Nesbit & Adesope (2006). Learning with concept and knowledge maps: A meta-analysis. Review of Educational Research, 76(3), 413-448.", "https://doi.org/10.3102/00346543076003413"],
      ["Roediger & Karpicke (2006). Test-enhanced learning: Taking memory tests improves long-term retention. Psychological Science, 17(3), 249-255.", "https://doi.org/10.1111/j.1467-9280.2006.01693.x"],
    ],
  };

  // Optional jingle: public-domain tunes only. "beats" is the line length the tune wants; notes play the opening (note:beats).
  const TUNES = {
    twinkle: { name: "Twinkle, Twinkle, Little Star", beats: 7, meter: "TWIN-kle TWIN-kle LIT-tle STAR", notes: "C4 C4 G4 G4 A4 A4 G4:2 F4 F4 E4 E4 D4 D4 C4:2" },
    mary: { name: "Mary Had a Little Lamb", beats: 7, meter: "MA-ry HAD a LIT-tle LAMB", notes: "E4 D4 C4 D4 E4 E4 E4:2 D4 D4 D4:2 E4 G4 G4:2" },
    london: { name: "London Bridge Is Falling Down", beats: 7, meter: "LON-don BRIDGE is FALL-ing DOWN", notes: "G4:1.5 A4:.5 G4 F4 E4 F4 G4:2 D4 E4 F4:2 E4 F4 G4:2" },
    yankee: { name: "Yankee Doodle", beats: 7, meter: "YAN-kee DOO-dle WENT to TOWN", notes: "C4:.5 C4:.5 D4:.5 E4:.5 C4:.5 E4:.5 D4 C4:.5 C4:.5 D4:.5 E4:.5 C4 B3" },
    row: { name: "Row, Row, Row Your Boat", beats: 5, meter: "ROW, row, ROW your BOAT", notes: "C4:1.5 C4:1.5 C4 D4:.5 E4:1.5 E4 D4:.5 E4 F4:.5 G4:3" },
  };
  // About how many beats (syllables) a line has; a guide for the learner, not a grade.
  function beats(line) {
    const SAY = { hundred: 2, charles: 1, poiseuille: 2, fio2: 4, o2: 2, co2: 3 };
    return String(line || "").toLowerCase().replace(/(\d+)/g, (n) => " " + "x ".repeat(n.length === 1 ? 1 : n.length === 2 ? 2 : 3)).split(/[^a-z0-9']+/).filter(Boolean).reduce((a, w) => {
      if (SAY[w] != null) return a + SAY[w];
      let n = 0; const pos = /'s$/.test(w); w = w.replace(/'s$/, "");
      n = (w.match(/[aeiouy]+/g) || []).length;
      if (/[^aeiouy]le$/.test(w) || /[^aeiouy]les$/.test(w)) { /* bubble, bubbles: the -le is a beat */ }
      else if (/e$/.test(w) && n > 1) n--;
      else if (/[^aeiouy](es|ed)$/.test(w) && !/(ses|zes|xes|ches|shes|ces|ges|ted|ded)$/.test(w) && n > 1) n--;
      if (pos && /(s|z|x|ch|sh|ce|ge)$/.test(w)) n++;
      return a + Math.max(1, n);
    }, 0);
  }

  // ---------- The card as rows ----------
  function tables(body) {
    const out = [];
    String(body || "").replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (m, html) => {
      const heads = [...html.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map((x) => plain(x[1]));
      const tb = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
      const rows = [...(tb ? tb[1] : html).matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)]
        .map((r) => [...r[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) => plain(c[1]))).filter((c) => c.length);
      out.push({ heads, rows });
      return "";
    });
    return out;
  }
  // Severity: color plus a line style of its own, so black and white prints still tell them apart.
  const SEV = {
    normal: { c: "#2E7D32", dash: "", w: 1.4, name: "Normal" },
    mild: { c: "#B08900", dash: "7 3", w: 1.7, name: "Mild" },
    moderate: { c: "#E65100", dash: "2 2.5", w: 2, name: "Moderate" },
    severe: { c: "#C62828", dash: "", w: 2.8, name: "Severe" },
    vsevere: { c: "#7F0000", dash: "", w: 2.8, name: "Very severe", dbl: true },
  };
  // Only a cell that IS a severity word counts ("Severe", "Moderate"), or a zone color, so "Normal is below 120/80" is not colored.
  const SEVWORD = /^(normal|mild|moderate|severe|very severe|critical|reassuring|green|yellow|red|low|high)(\b.{0,14})?$/i;
  function severity(cells) {
    const t = cells.map((c) => String(c).trim()).filter((c) => SEVWORD.test(c) && c.split(/\s+/).length <= 3).join(" ").toLowerCase();
    if (!t) return "";
    if (/very severe|critical|life.threat/.test(t)) return "vsevere";
    if (/\bsevere\b|\bred\b/.test(t)) return "severe";
    if (/\bmoderate(ly)?\b|\byellow\b/.test(t)) return "moderate";
    if (/\bmild\b/.test(t)) return "mild";
    if (/\bnormal\b|reassuring|\bgreen\b/.test(t)) return "normal";
    return "";
  }
  // Idea outlines (hints only; off by default). First match wins: the row's own words, then the card's title, then the field.
  const IDEAS = [
    [/bernoulli/, "wing", "an airplane wing or a jet: fast gas, low side pressure"],
    [/venturi/, "hourglass", "an hourglass-shaped tube: narrow, then gently wider"],
    [/graham/, "runner", "a small, fast runner: light gases diffuse faster"],
    [/boyle/, "syringe", "a syringe: squeeze it, pressure up, volume down"],
    [/charles/, "kettle", "a kettle: heat it and the gas expands"],
    [/gay.lussac/, "gauge", "a pressure gauge on a hot tank"],
    [/dalton/, "layers", "stacked layers: each gas adds its share"],
    [/henry/, "bottle", "a soda bottle: gas dissolved under pressure"],
    [/poiseuille/, "tube", "a tube: narrow it and resistance soars"],
    [/laplace|surfactant|alveol/, "bubble", "a bubble: smaller means higher pressure"],
    [/temperature|\btemp\b|fever/, "thermo", "a thermometer"],
    [/pulse|heart|cardiac|rhythm|blood pressure|\bbp\b|ecg|ekg|arrhythm/, "heart", "a heart"],
    [/\bseconds?\b|\bminutes?\b|\bhours?\b|duration|latency|before it|\btime\b/, "clock", "a clock"],
    [/\beeg\b|brain|arousal|conscious|alpha|theta|eye opening|verbal|motor/, "brain", "a thought cloud"],
    [/\bph\b|hco3|paco2|pao2|sao2|blood|acidosis|alkalosis|base excess/, "drop", "a blood drop"],
    [/glove|gown|mask|isolation|precaution|fire|ppe|hand hygiene|infection/, "shield", "a shield"],
    [/stage r\b|\brem\b|\bsleep\b|\bn[123]\b|night/, "moon", "a moon"],
    [/fev1|lung|copd|respir|breath|airway|apnea|oxygen|\bo2\b|ventilat|spirom/, "lungs", "lungs"],
  ];
  const FIELD_IDEA = { rt: ["lungs", "lungs"], sleep: ["moon", "a moon"], cna: ["heart", "a heart"], all: ["shield", "a shield"] };
  function idea(text, card) {
    const t = text.toLowerCase();
    for (const [re, shape, tip] of IDEAS) if (re.test(t)) return { shape, tip };
    const c = ((card.title || "") + " " + (card.intro || "")).toLowerCase();
    for (const [re, shape, tip] of IDEAS) if (shape !== "clock" && re.test(c)) return { shape, tip };   // "per hour" in a title is not about time
    const f = FIELD_IDEA[card.field || "rt"] || FIELD_IDEA.rt;
    return { shape: f[0], tip: f[1] };
  }
  // Abbreviations used on the card, for the "Connects to" links.
  function abbrsOn(card) {
    const A = W.ACRONYMS; if (!A) return [];
    const txt = plain([card.title, card.intro, card.body, card.note].join(" "));
    const seen = new Set(), out = [];
    (txt.match(/\b[A-Za-z]*[A-Z][A-Za-z0-9]*[A-Z0-9][A-Za-z0-9-]*\b/g) || []).forEach((w) => {
      const h = (A.map[A.norm(w)] || []).find((x) => x.abbr === w);
      if (h && !seen.has(w)) { seen.add(w); out.push(h); }
    });
    return out.slice(0, 4);
  }
  // A card as a list of facts (one per table row). Cards without a table use their sentences.
  function model(k, opts) {
    const card = (W.SCALES || {})[k]; if (!card) return null;
    opts = opts || {};
    const tbs = tables(card.body);
    const facts = [];
    tbs.forEach((tb, ti) => tb.rows.forEach((cells, ri) => {
      const label = cells[0] || "";
      const details = cells.slice(1).map((c, i) => ({ head: tbs[ti].heads.length > 2 ? tbs[ti].heads[i + 1] || "" : "", text: c })).filter((d) => d.text && !/^(not applicable|n\/a|none|—|-)$/i.test(d.text));
      facts.push({ table: ti, row: ri, label, details, sev: severity(cells),
        idea: idea(cells.join(" "), card), hit: !!(opts.hit && opts.hit.table === ti && opts.hit.row === ri) });
    }));
    if (!facts.length) plain([card.body, card.intro].join(" ")).split(/(?<=\.)\s+/).filter(Boolean).slice(0, 8).forEach((s, i) =>
      facts.push({ table: 0, row: i, label: s.split(/[,:;]/)[0].slice(0, 40), details: [{ head: "", text: s }], sev: "", idea: idea(s, card), hit: false }));
    // Ready-made picture ideas and jingle (js/memory_ideas.js); the learner's own words (opts.mine = their study page) win.
    const MI = (W.MEMORY_IDEAS || {})[k] || {}, mine = opts.mine || {}, mp = mine.pics || {}, ms = mine.song || {}, ml = ms.lines || {};
    facts.forEach((f, i) => { f.picDefault = (MI.pictures || [])[i] || ""; const own = mp[i];
      f.picMine = !!(own && own.trim()); f.pic = f.picMine ? own.trim() : f.picDefault; });
    const J = MI.jingle || {}, tune = TUNES[ms.tune] ? ms.tune : TUNES[J.tune] ? J.tune : "twinkle";
    const songLines = facts.map((f, i) => ({ key: String(i), label: f.label, def: (J.lines || [])[i] || "", own: ml[i] }))
      .concat((J.refrain || []).map((t, i) => ({ key: "r" + i, label: "Refrain", def: t, own: ml["r" + i] })))
      .map((l) => Object.assign(l, { mine: !!(l.own != null && l.own.trim() && l.own.trim() !== l.def), text: (l.own != null && l.own.trim()) ? l.own.trim() : l.def }));
    const song = { tune, tuneName: TUNES[tune].name, beats: TUNES[tune].beats, suggested: J.tune || "", lines: songLines, print: !!ms.print, hasDefault: !!(J.lines || []).length };
    const related = (opts.related || []).filter((r) => r !== k && W.SCALES[r]).slice(0, 2).map((r) => W.SCALES[r].title);
    const out = { k, song, title: plain(card.title), intro: plain(card.intro), note: plain(card.note), src: plain(card.src), field: card.field || "rt",
      heads: tbs.map((t) => t.heads), facts, abbrs: abbrsOn(card), related, q: opts.q || "", answer: opts.answer || "" };
    return opts.layout === "cards" ? asCards(out) : out;
  }
  // The starter map (Ken, Nov 26): the topic in the center squircle with an otter placeholder picture, and every fact as an index card
  // around it. Internally it is one fact (the topic) whose caption lists the facts, which is the index-card map the builder already
  // makes; allFacts keeps the real facts for the picture-idea list, the traditional page and the song.
  function asCards(m) {
    const cap = m.facts.map((f) => [f.label, ...(f.details || []).map((d) => "  " + (d.head ? d.head + ": " : "") + d.text)].join("\n")).join("\n");
    return Object.assign({}, m, { cards: true, allFacts: m.facts, capDefault: cap,
      facts: [{ table: 0, row: 0, label: m.title, details: [], sev: null, idea: {}, hit: false, pic: "", picDefault: "", picMine: false }] });
  }
  const PLACEHOLDER = { shape: "photo", w: 320, h: 320, scale: 0.85, placeholder: true };
  // which map a saved page uses: pages built on the old line map before the starter changed keep it
  const pageLayout = (p) => (p && p.layout) || (p && ((p.ink || []).length || Object.keys(p.moves || {}).length || Object.keys(p.stickers || {}).length) ? "line" : "cards");

  // ---------- Text measuring and wrapping (Helvetica-like widths, good enough for layout) ----------
  const CW = (ch) => /[il.,:;'|!]/.test(ch) ? 0.28 : /[mwMW]/.test(ch) ? 0.83 : /[A-Z0-9]/.test(ch) ? 0.64 : 0.52;
  const textW = (s, fs, bold) => [...String(s)].reduce((a, ch) => a + CW(ch), 0) * fs * (bold ? 1.07 : 1);
  function wrap(s, maxW, fs, bold) {
    const words = String(s).split(/\s+/).filter(Boolean), lines = [];
    let cur = "";
    words.forEach((w) => {
      const t = cur ? cur + " " + w : w;
      if (textW(t, fs, bold) <= maxW || !cur) cur = t; else { lines.push(cur); cur = w; }
    });
    if (cur) lines.push(cur);
    return lines;
  }

  // ---------- Idea outlines: simple original line drawings around a box (x, y, w, h) ----------
  const P = (d, c, extra) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" ${extra || ""}/>`;
  const SHAPES = {
    syringe: (x, y, w, h, c) => P(`M${x} ${y}h${w}v${h}h${-w}z`, c) + P(`M${x - 4} ${y - 5}v${h + 10}`, c) + P(`M${x - 18} ${y + h / 2}h18M${x - 18} ${y + h / 2 - 9}v18`, c) +
      P(`M${x + w} ${y + h / 2 - 5}h7v10h-7M${x + w + 7} ${y + h / 2}h18`, c) + [1, 2, 3, 4, 5].map((i) => P(`M${x + (w * i) / 6} ${y}v6`, c)).join(""),
    kettle: (x, y, w, h, c) => P(`M${x + 6} ${y}h${w - 12}q8 0 9 10l3 ${h - 14}q0 8-10 8h${-w + 8}q-10 0-10-8l3 ${-h + 14}q1-10 9-10z`, c) +
      P(`M${x + w * 0.28} ${y}q${w * 0.22}-16 ${w * 0.44} 0`, c) + P(`M${x + w * 0.5} ${y - 9}v-3`, c) + P(`M${x + w + 2} ${y + h * 0.55}l16-${h * 0.45}l4 3`, c) +
      P(`M${x + w + 22} ${y - 4}q-5-6 0-11t0-11M${x + w + 13} ${y - 2}q-5-6 0-11t0-11`, c, 'opacity=".7"'),
    gauge: (x, y, w, h, c) => P(`M${x} ${y}h${w}v${h}h${-w}z`, c, 'rx="6"') + `<circle cx="${x + w}" cy="${y}" r="13" fill="#fff" stroke="${c}" stroke-width="1.6"/>` +
      P(`M${x + w} ${y}l7-6`, c) + P(`M${x + w * 0.3} ${y + h + 14}q-4-6 0-10q4 4 4-2q5 6 1 12M${x + w * 0.6} ${y + h + 14}q-4-6 0-10q4 4 4-2q5 6 1 12`, c),
    layers: (x, y, w, h, c) => [12, 6, 0].map((o) => `<rect x="${x + o}" y="${y + o}" width="${w}" height="${h}" rx="6" fill="#fff" stroke="${c}" stroke-width="1.6"/>`).join(""),
    bottle: (x, y, w, h, c) => P(`M${x + w * 0.38} ${y - 18}v-6h${w * 0.24}v6M${x + w * 0.4} ${y - 18}v8q0 6-${w * 0.3} 10h-${w * 0.02}q-${w * 0.08} 0-${w * 0.08} 10v${h - 2}q0 8 8 8h${w - 16 + w * 0.04}q8 0 8-8v-${h - 2}q0-10-${w * 0.08}-10q-${w * 0.3}-4-${w * 0.3}-10v-8`, c) +
      [[0.06, 0.8, 3], [0.1, 0.5, 2.2], [0.93, 0.7, 2.6], [0.9, 0.35, 2]].map(([a, b, r]) => `<circle cx="${x + w * a}" cy="${y + h * b}" r="${r}" fill="none" stroke="${c}" stroke-width="1.2"/>`).join(""),
    tube: (x, y, w, h, c) => P(`M${x} ${y}h${w}M${x} ${y + h}h${w}`, c) + `<ellipse cx="${x}" cy="${y + h / 2}" rx="8" ry="${h / 2}" fill="none" stroke="${c}" stroke-width="1.6"/><ellipse cx="${x + w}" cy="${y + h / 2}" rx="8" ry="${h / 2}" fill="none" stroke="${c}" stroke-width="1.6"/>` +
      P(`M${x - 26} ${y + h / 2}h14l-5-4m5 4l-5 4M${x + w + 12} ${y + h / 2}h14l-5-4m5 4l-5 4`, c),
    bubble: (x, y, w, h, c) => `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 2 + 14}" ry="${h / 2 + 12}" fill="none" stroke="${c}" stroke-width="1.6"/>` +
      P(`M${x + 6} ${y + 4}q8-12 26-12`, c) + `<circle cx="${x + w + 20}" cy="${y - 6}" r="6" fill="none" stroke="${c}" stroke-width="1.3"/><circle cx="${x + w + 8}" cy="${y - 16}" r="3.5" fill="none" stroke="${c}" stroke-width="1.2"/>`,
    thermo: (x, y, w, h, c) => P(`M${x + 8} ${y}h${w}a${h / 2} ${h / 2} 0 0 1 0 ${h}h-${w}`, c) + `<circle cx="${x - 4}" cy="${y + h / 2}" r="${Math.min(16, h / 2 + 6)}" fill="none" stroke="${c}" stroke-width="1.6"/>` +
      [1, 2, 3, 4, 5, 6].map((i) => P(`M${x + 8 + (w * i) / 7} ${y}v5`, c)).join(""),
    heart: (x, y, w, h, c) => P(`M${x + w / 2} ${y + 2}c${-w * 0.12}-16 ${-w * 0.55}-18 ${-w * 0.58} 6c-2 ${h * 0.5} ${w * 0.3} ${h * 0.85} ${w * 0.58} ${h + 14}c${w * 0.28}-${h * 0.15 + 14} ${w * 0.6}-${h * 0.5 + 14} ${w * 0.58}-${h + 14 - 2 - h * 0.0}c-3-24-${w * 0.46}-22-${w * 0.58}-6z`, c),
    clock: (x, y, w, h, c) => `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 2 + 12}" ry="${h / 2 + 12}" fill="none" stroke="${c}" stroke-width="1.6"/>` +
      [[0, -1], [1, 0], [0, 1], [-1, 0]].map(([a, b]) => P(`M${x + w / 2 + a * (w / 2 + 12)} ${y + h / 2 + b * (h / 2 + 12)}l${-a * 6} ${-b * 6}`, c)).join("") + P(`M${x + w / 2 - 6} ${y - 16}h12M${x + w / 2} ${y - 16}v4`, c),
    brain: (x, y, w, h, c) => { const n = Math.max(4, Math.round(w / 36)), m = Math.max(2, Math.round(h / 30)); let d = `M${x} ${y}`;
      for (let i = 0; i < n; i++) d += `q${w / n / 2}-12 ${w / n} 0`; for (let i = 0; i < m; i++) d += `q12 ${h / m / 2} 0 ${h / m}`;
      for (let i = 0; i < n; i++) d += `q-${w / n / 2} 12 -${w / n} 0`; for (let i = 0; i < m; i++) d += `q-12 -${h / m / 2} 0 -${h / m}`; return P(d, c); },
    drop: (x, y, w, h, c) => P(`M${x + w / 2} ${y - 22}C${x + w + 4} ${y + h * 0.1} ${x + w + 16} ${y + h + 12} ${x + w / 2} ${y + h + 12}C${x - 16} ${y + h + 12} ${x - 4} ${y + h * 0.1} ${x + w / 2} ${y - 22}z`, c),
    shield: (x, y, w, h, c) => P(`M${x - 8} ${y - 8}q${w / 2 + 8} -10 ${w + 16} 0v${h * 0.6}q0 ${h * 0.4 + 10} -${w / 2 + 8} ${h * 0.4 + 22}q-${w / 2 + 8} -12 -${w / 2 + 8} -${h * 0.4 + 22}z`, c),
    moon: (x, y, w, h, c) => `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 2 + 14}" ry="${h / 2 + 12}" fill="none" stroke="${c}" stroke-width="1.6"/>` +
      P(`M${x - 4} ${y - 4}q-14 ${h / 2 + 4} 0 ${h + 8}`, c) + P(`M${x + w + 16} ${y - 14}l2 5 5 1-5 2-2 5-2-5-5-2 5-1z`, c),
    wing: (x, y, w, h, c) => P(`M${x - 10} ${y + h * 0.55}C${x - 6} ${y - 16} ${x + w * 0.55} ${y - 18} ${x + w + 14} ${y + h * 0.35}C${x + w * 0.6} ${y + h + 10} ${x + w * 0.1} ${y + h + 12} ${x - 10} ${y + h * 0.55}z`, c) +
      P(`M${x - 30} ${y - 6}h16M${x - 30} ${y + h * 0.5}h14M${x - 30} ${y + h + 6}h16`, c, 'stroke-dasharray="4 3"'),
    hourglass: (x, y, w, h, c) => P(`M${x - 12} ${y - 8}L${x + w * 0.3} ${y + h * 0.2}Q${x + w * 0.38} ${y - 2} ${x + w * 0.5} ${y - 2}L${x + w + 12} ${y - 10}M${x - 12} ${y + h + 8}L${x + w * 0.3} ${y + h * 0.8}Q${x + w * 0.38} ${y + h + 2} ${x + w * 0.5} ${y + h + 2}L${x + w + 12} ${y + h + 10}`, c) +
      P(`M${x - 26} ${y + h / 2}h12l-4-3m4 3l-4 3`, c),
    runner: (x, y, w, h, c) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="none" stroke="${c}" stroke-width="1.6"/>` +
      `<circle cx="${x + w + 14}" cy="${y - 10}" r="4" fill="none" stroke="${c}" stroke-width="1.6"/>` +
      P(`M${x + w + 12} ${y - 5}l-4 10l6 6l-2 9M${x + w + 8} ${y + 5}l-7 6M${x + w + 10} ${y - 1}l8 4M${x + w + 8} ${y + 5}l-6 2`, c) +
      P(`M${x - 6} ${y - 8}h-14M${x - 6} ${y - 2}h-10`, c, 'opacity=".7"'),
    lungs: (x, y, w, h, c) => P(`M${x + w / 2} ${y - 18}v12M${x + w / 2} ${y - 6}l-14 10M${x + w / 2} ${y - 6}l14 10`, c) +
      P(`M${x + w / 2 - 8} ${y}q-${w * 0.25}-6 -${w / 2 - 2} 10q-10 ${h * 0.5} -2 ${h}q${w * 0.2} 6 ${w / 2 - 6} 2z`, c) +
      P(`M${x + w / 2 + 8} ${y}q${w * 0.25}-6 ${w / 2 - 2} 10q10 ${h * 0.5} 2 ${h}q-${w * 0.2} 6 -${w / 2 - 6} 2z`, c),
  };


  // Full-color stickers (Ken, Nov 25): picture files in images/stickers/ (js/stickers.js lists them with related words),
  // shown whole and never recolored. No line art anywhere: old pages that saved a line-drawing name show the matching
  // sticker instead. Every fact without the learner's own picture gets a related sticker pulled from its words.
  const STK = (W.OB_STICKERS && W.OB_STICKERS.length) ? W.OB_STICKERS : [["lungs", "Lungs", 317, 320], ["stethoscope", "Stethoscope", 305, 320], ["thumbs-up", "Thumbs up", 207, 320],
    ["star", "Star", 320, 315], ["otter-celebrate", "Otter celebrate", 253, 320], ["otter-face", "Otter face", 279, 320]].map(([id, label, w, h]) => ({ id, label, w, h, cat: "Stickers", words: [] }));
  const ART = {}; STK.forEach((t) => { ART[t.id] = [t.id + ".webp", t.label, t.w, t.h]; });
  const OLD = { syringe: "syringe", kettle: "teapot", gauge: "stopwatch", layers: "books", bottle: "droplet", tube: "test-tube", bubble: "bubbles", wing: "wing",
    hourglass: "hourglass-done", runner: "person-running", lungs: "lungs", heart: "anatomical-heart", drop: "droplet", brain: "cloud", moon: "crescent-moon",
    clock: "alarm-clock", thermo: "thermometer", shield: "shield" };
  const artId = (n) => ART[n] ? n : (OLD[n] && ART[OLD[n]] ? OLD[n] : "");
  const ART_BASE = (() => { try { const l = typeof document !== "undefined" && document.querySelector('link[href*="voice.css"]'); if (l && l.href) return l.href.replace(/css\/voice\.css.*$/, "") + "images/stickers/"; } catch (e) {} return "images/stickers/"; })();
  const artSrc = (n) => artId(n) ? ART_BASE + ART[artId(n)][0] : "";
  const hasSticker = (n) => !!(n && n !== "photo" && artId(n));
  // draw a sticker inside (x, y, w, h), whole and centered
  function stickerArt(n, x, y, w, h) {
    const id = artId(n); if (!id) return "";
    const src = esc(artSrc(id));
    return `<image class="rsticker" href="${src}" xlink:href="${src}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(1, w).toFixed(1)}" height="${Math.max(1, h).toFixed(1)}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  // Related stickers for some words: a sticker scores for each of its word stems the text contains (whole words for
  // short stems), so "SpO2 < 90%, blue lips" pulls the falling chart and the cold blue face.
  const stkWords = (t) => String(t || "").toLowerCase().replace(/[^a-z0-9%/+]+/g, " ").split(" ").filter(Boolean);   // "slow-wave" counts as slow + wave
  function stickerScores(text) {
    const ws = stkWords(text), joined = " " + ws.join(" ") + " ", out = {};
    STK.forEach((t) => {
      let sc = 0;
      (t.words || []).forEach((st) => { const q = st.replace(/-/g, " "); if (q.includes(" ")) { if (joined.includes(" " + q + " ")) sc += 2; }
        else if (q.length <= 3 ? ws.includes(q) : ws.some((w) => w.startsWith(q))) sc += q.length >= 6 ? 1.5 : 1; });
      // a whole phrase from the fact (like "eyes closed" or "8 13 hz") is the strongest sign: graph close-ups win there
      (t.phrases || []).forEach((ph) => { if (joined.includes(" " + stkWords(ph).join(" ") + " ")) sc += 3; });
      if (sc > 0) out[t.id] = sc;
    });
    return out;
  }
  function hubSuggestions(m, n, taken) {
    const facts = m.allFacts || m.facts, sc = {}, add = (t, w) => { const x = stickerScores(t); Object.keys(x).forEach((id) => { sc[id] = (sc[id] || 0) + x[id] * w; }); };
    add(m.title, 3); facts.forEach((f) => add([f.label, ...(f.details || []).map((d) => d.text)].join(" "), 1));
    const titleSc = stickerScores(m.title), fam = {}, order = {}; STK.forEach((t, k) => { fam[t.id] = t.same || t.id; order[t.id] = k; });
    const seen = new Set((taken || []).map((id) => fam[id] || id));
    const ok = Object.keys(sc).filter((id) => ART[id] && !(GRAPH[id] && !(titleSc[id] >= 3)) && !(taken || []).includes(id));
    const best = Math.max(0, ...ok.map((id) => sc[id]));   // only pictures that clearly match the topic's words (Ken, Nov 26)
    return ok.filter((id) => sc[id] >= Math.max(3, best * 0.25))
      .sort((a, b) => sc[b] - sc[a] || order[a] - order[b]).filter((id) => !seen.has(fam[id]) && seen.add(fam[id])).slice(0, n || 12);
  }
  function suggestStickers(text, n) {
    const sc = stickerScores(text), order = {}; STK.forEach((t, k) => { order[t.id] = k; });
    const fam = {}; STK.forEach((t) => { fam[t.id] = t.same || t.id; });
    const seen = new Set();   // one per family: a second drawing of the same idea only shows up when the first is used
    return Object.keys(sc).sort((a, b) => sc[b] - sc[a] || order[a] - order[b]).filter((id) => !seen.has(fam[id]) && seen.add(fam[id])).slice(0, n || 8);
  }
  // one sticker per fact, different from the others on the same map; when no word matches, one that fits the field
  const FIELD_STK = { sleep: ["crescent-moon", "zzz", "sleeping-face", "bed", "owl", "alarm-clock", "brain", "eye"], cna: ["hospital", "stethoscope", "clipboard", "person-in-bed", "shield", "older-person", "droplet", "thumbs-up"],
    rt: ["lungs", "wind-face", "stethoscope", "balloon", "droplet", "gear", "drop-of-blood", "stopwatch"] };
  // Pulled stickers are unique across all of a learner's maps (Ken, Nov 25: "unique stickers for every picture graph
  // made even if it's the same info over two different picture graphs"). Each slot (topic, fact, card) keeps the sticker
  // it was given, saved per exam on this device (obStickerPick:EXAM, a new key), and no other map's slot reuses it.
  // When every sticker is taken, the least-used one is reused, so more stickers can simply be added to the library.
  let AUTO_CARD = () => "";
  const PICK_KEY = () => "obStickerPick:" + (W.EXAM || "RRT");
  let PICKS = null;
  function picks() {
    if (PICKS) return PICKS;
    try { PICKS = JSON.parse((typeof localStorage !== "undefined" && localStorage.getItem(PICK_KEY())) || "{}") || {}; } catch (e) { PICKS = {}; }
    return PICKS;
  }
  function savePicks() { try { if (typeof localStorage !== "undefined") localStorage.setItem(PICK_KEY(), JSON.stringify(PICKS)); } catch (e) {} }
  // slots: [{ key: "topic|f0" or "topic|f0|c2", text }] for one map; returns { key: stickerId }
  const GRAPH = {}; STK.forEach((t) => { if (t.graph) GRAPH[t.id] = 1; });   // a graph close-up needs a strong match (several of its words, or a phrase)
  function assignStickers(topic, slots, fieldName, reserved) {
    const P = picks(), mine = (k) => k.split("|")[0] === topic, out = {}, here = new Set(reserved || []), count = {};
    Object.keys(P).forEach((k) => { if (!mine(k) && ART[P[k]]) count[P[k]] = (count[P[k]] || 0) + 1; });
    const takenElsewhere = (id) => !!count[id];
    let changed = false;
    slots.forEach((sl) => { const id = P[sl.key]; if (ART[id] && !takenElsewhere(id) && !here.has(id)) { out[sl.key] = id; here.add(id); } });
    // best matches first across the whole map, so the fact that fits a sticker best gets it
    const todo = slots.filter((sl) => !out[sl.key]).map((sl) => ({ sl, sc: stickerScores(sl.text) }));
    const fresh = (id) => ART[id] && !here.has(id) && !takenElsewhere(id);
    const give = (sl, id) => { out[sl.key] = id; here.add(id); if (P[sl.key] !== id) { P[sl.key] = id; changed = true; } };
    for (;;) {
      let best = null;
      todo.forEach((t) => { if (out[t.sl.key]) return; Object.keys(t.sc).forEach((id) => { if (fresh(id) && !(GRAPH[id] && t.sc[id] < 3) && (!best || t.sc[id] > best.v)) best = { t, id, v: t.sc[id] }; }); });
      if (!best) break;
      give(best.t.sl, best.id);
    }
    const ex = String(W.EXAM || ""), field = FIELD_STK[fieldName] || FIELD_STK[/SDS|RPSGT/.test(ex) ? "sleep" : /CNA/.test(ex) ? "cna" : "rt"] || [];
    todo.forEach((t) => {
      if (out[t.sl.key]) return;
      // a graph close-up only ever goes on a fact whose words call for it
      const plainIds = STK.filter((x) => !x.graph).map((x) => x.id);
      let id = field.find(fresh) || plainIds.find(fresh);
      if (!id) id = Object.keys(t.sc).filter((x) => !(GRAPH[x] && t.sc[x] < 3)).concat(plainIds).filter((x) => ART[x] && !here.has(x)).sort((a, b) => (count[a] || 0) - (count[b] || 0))[0] || "";
      if (id) give(t.sl, id);
    });
    if (changed) savePicks();
    return out;
  }

  // where a sticker sits beside a fact without covering its words: next to the text box, on the side away from the
  // slash (out toward the page edge), about as tall as the box. The learner's size setting scales it.
  function stickerSpot(b, scale, Wd, ar) {
    const bh = b.cy2 - b.cy1, sc = Math.min(1.3, Math.max(0.4, (scale == null ? 0.8 : scale) / 0.8));
    const slashRight = b.ax != null ? b.ax >= (b.cx1 + b.cx2) / 2 : true;
    if (ar) {
      // a graph close-up: as large as the empty part of the fact's space allows, never over the words, the branch
      // or the hint line (Ken, Nov 25: "a large part of the graph")
      const m = 6, yb = b.y2 - 16, gx1 = slashRight ? b.x1 + m : b.cx1, gx2 = slashRight ? b.cx2 : b.x2 - m;
      const R = [[b.x1 + m, b.y1 + m, b.cx1 - m, yb], [b.cx2 + m, b.y1 + m, b.x2 - m, yb], [gx1, b.y1 + m, gx2, b.cy1 - m], [gx1, b.cy2 + m, gx2, yb]]
        .filter((r, k) => !(k === (slashRight ? 1 : 0)));
      let best = null;
      R.forEach(([x1, y1, x2, y2]) => {
        const rw = x2 - x1, rh = y2 - y1; if (rw < 20 || rh < 14) return;
        let w = Math.min(rw, rh / ar, 280 * sc), h = w * ar;
        if (!best || w * h > best[2] * best[3]) best = [x1 + (rw - w) / 2, y1 + (rh - h) / 2, w, h];
      });
      if (best && best[2] >= 90) return best;
    }
    const side = Math.min(64, Math.max(34, bh + 14)) * sc;
    const room = { L: b.cx1 - 6, R: (Wd || 400) - b.cx2 - 6 };
    const pref = slashRight ? "L" : "R", other = pref === "L" ? "R" : "L";
    const at = room[pref] >= side ? pref : room[other] >= side ? other : (room[pref] >= room[other] ? pref : other);
    const s2 = Math.min(side, Math.max(0, room[at]));
    if (s2 < 22) return null;   // no room beside the words: no sticker rather than one on top of them
    const x = at === "L" ? b.cx1 - s2 - 4 : b.cx2 + 4;
    return [x, (b.cy1 + b.cy2) / 2 - s2 / 2, s2, s2];
  }
  const isGraph = (n) => { const id = artId(n); const t = id && STK.find((x) => x.id === id); return t && t.graph ? t.h / t.w : 0; };

  // Photo and sticker size: 25–100% of the fact's drawing space, never overflowing (Ken, t193u).
  const clampScale = (v) => Math.min(1, Math.max(0.25, Number(v) || 0.7));
  function photoBox(b, st) {
    const bw = b.x2 - b.x1, bh = b.y2 - b.y1;
    const scale = clampScale(st.scale == null ? 0.7 : st.scale);
    const ar = (st.w > 0 && st.h > 0) ? st.h / st.w : 1;
    let w = bw * scale, h = w * ar;
    if (h > bh - 2) { h = Math.max(1, bh - 2); w = h / (ar || 1); }
    if (w > bw - 2) { w = Math.max(1, bw - 2); h = w * ar; }
    return { x: b.x1 + (bw - w) / 2, y: b.y1 + (bh - h) / 2, w, h, scale };
  }
  const clampThumb = (v) => Math.min(1.5, Math.max(0.5, Number(v) || 1));
  function thumbBox(th) {
    const sc = clampThumb(th && th.scale), base = 28;
    let w = base * sc, h = w;
    if (th && th.w > 0 && th.h > 0) h = w * (th.h / th.w);
    if (w > 48) { h *= 48 / w; w = 48; }
    if (h > 48) { w *= 48 / h; h = 48; }
    if (w < 16) { h *= 16 / (w || 16); w = 16; }
    return { w, h, scale: sc };
  }
  // Place a photo so its content (st.fit, or the full image) fills the dest box, keeping aspect ratio (Ken t230u).
  // mode: "cover" fills the box (may crop); "contain" shows the whole picture; "auto" (default)
  // contains when the picture is much wider than the box so side details are not cropped.
  function photoCover(st, r, mode) {
    const sw = st && st.w, sh = st && st.h;
    const f = st && st.fit, has = f && f.w > 0 && f.h > 0;
    const fx = has ? Math.max(0, Number(f.x) || 0) : 0, fy = has ? Math.max(0, Number(f.y) || 0) : 0;
    const fw = has ? Math.min(1 - fx, Number(f.w) || 1) : 1, fh = has ? Math.min(1 - fy, Number(f.h) || 1) : 1;
    if (!(sw > 0 && sh > 0)) return { x: r.x, y: r.y, w: r.w, h: r.h, slice: mode !== "contain" };
    const trimW = Math.max(1, fw * sw), trimH = Math.max(1, fh * sh);
    const coverScale = Math.max(r.w / trimW, r.h / trimH), meetScale = Math.min(r.w / trimW, r.h / trimH);
    const destAR = r.w / (r.h || 1), srcAR = trimW / trimH;
    let scale = coverScale;
    if (mode === "contain" || (mode !== "cover" && srcAR > destAR * 1.22)) scale = meetScale;
    const fullW = sw * scale, fullH = sh * scale;
    const tx = r.x + (r.w - trimW * scale) / 2, ty = r.y + (r.h - trimH * scale) / 2;
    return { x: tx - fx * fullW, y: ty - fy * fullH, w: fullW, h: fullH, slice: false };
  }
  function branchThumbEl(th, cx, cy, color, fi, pin, builder) {
    if (!th || !(th.src || hasSticker(th.shape))) {
      if (!builder) return "";
      return `<g class="rthumbadd" data-cap="${fi}" data-pin="${pin}" transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)})"><circle r="9" fill="#fff" fill-opacity=".95" stroke="${color}" stroke-width="1.2" stroke-dasharray="2 2"/><path d="M-4 0h8M0-4v8" fill="none" stroke="${color}" stroke-width="1.2" stroke-linecap="round"/></g>`;
    }
    const T = thumbBox(th), x = cx - T.w / 2, y = cy - T.h / 2;
    const inner = (th.shape === "photo" && th.src)
      ? `<image class="rthumbimg" href="${esc(th.src)}" xlink:href="${esc(th.src)}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${T.w.toFixed(1)}" height="${T.h.toFixed(1)}" preserveAspectRatio="xMidYMid meet"/>`
      : `<g>${ART[th.shape] ? stickerArt(th.shape, x, y, T.w, T.h) : stickerArt(th.shape, x, y, T.w, Math.max(10, T.h * 0.7))}</g>`;
    return `<g class="rthumb" data-cap="${fi}" data-pin="${pin}">${inner}</g>`;
  }
  function photoEl(st, b, clipId) {
    const r = photoBox(b, st), src = esc(st.src || "");
    return `<image class="rphoto" href="${src}" xlink:href="${src}" x="${r.x.toFixed(1)}" y="${r.y.toFixed(1)}" width="${r.w.toFixed(1)}" height="${r.h.toFixed(1)}" preserveAspectRatio="xMidYMid meet" clip-path="url(#${clipId})"/>`;
  }
  function scaledHr(hr, b, st) {
    if (!st || st.scale == null) return hr;
    const sc = clampScale(st.scale), bw = b.x2 - b.x1, bh = b.y2 - b.y1, ar = hr[3] / (hr[2] || 1);
    let w = bw * sc, h = w * ar;
    if (h > bh - 2) { h = Math.max(1, bh - 2); w = h / (ar || 1); }
    return [b.x1 + (bw - w) / 2, b.y1 + (bh - h) / 2, w, h];
  }
  // Printable recall notes in the spirit of Evelyn Wood (Ken, t198u–t222u). Level 0 is a squircle (extra-rounded
  // square, rx ~22% of the side) with the title on top and the topic picture below. Level 1 is an index card
  // (sharper rx 6) with a colored header, the picture nearest the hub, and the facts to remember inside (they wrap).
  // Level 2 is a pill/tag for deeper nesting. Lines carry no text. Pill-ended tabs sit just inside the squircle;
  // card tabs use rx 5. Phone screens stack; print uses a landscape sheet.
  const BRANCH = ["#0A4A63", "#B3261E", "#1565C0", "#2E7D32", "#E65100", "#6A1B9A", "#8A6D00"];
  const FILLER = /^(the|a|an|of|and|or|to|for|in|on|at|is|are|be|with|that|this|from|by|as|it)$/i;
  function keywords(s, max) {
    const t = String(s || "").replace(/<[^>]+>/g, " ").replace(/^\s*(?:[•●▪◦\-–]|\d{1,2}[.)])\s+/, "").replace(/\s+/g, " ").trim();
    if (!t) return "";
    const words = t.split(" ");
    if (words.length <= (max || 7)) return t;
    const kept = words.filter((w, i) => i === 0 || !FILLER.test(w.replace(/[^A-Za-z]/g, "")));
    return (kept.length ? kept : words).slice(0, max || 7).join(" ");
  }
  // Card text is the learner's facts word for word: never trimmed to keywords and never cut off (Ken, Nov 25:
  // "the info is important to be no less prominent than the image"). Only extra spaces and bullets are cleaned up.
  const clean = (s) => String(s || "").replace(/<[^>]+>/g, " ").replace(/^\s*(?:[•●▪◦\-–]|\d{1,2}[.)])\s+/, "").replace(/\s+/g, " ").trim();
  function capItems(st, f, b) {
    const label = clean(((b && b.label) || []).join(" ") || (f && (Array.isArray(f.label) ? f.label.join(" ") : f.label)) || "");
    const raw = [];
    if (st && st.cap != null && String(st.cap).trim()) {
      String(st.cap).split(/\n/).forEach((line) => {
        const m = line.match(/^(\s*)(.*)$/);
        const text = clean(m ? m[2] : line);
        if (text) raw.push({ indent: m ? m[1].replace(/\t/g, "  ").length : 0, text });
      });
    } else {
      ((b && b.lines) || []).forEach((ln) => {
        const head = clean(ln.head || "");
        const text = clean(ln.text || "");
        if (head && text) raw.push({ indent: 0, text: head, facts: [text] });
        else if (text || head) raw.push({ indent: ln.indent ? 2 : 0, text: text || head });
      });
    }
    const roots = [], stack = [];
    raw.forEach((r) => {
      const node = { text: r.text, facts: r.facts ? r.facts.slice() : [], kids: [] };
      while (stack.length && stack[stack.length - 1].indent >= r.indent) stack.pop();
      if (!stack.length) roots.push(node); else stack[stack.length - 1].node.kids.push(node);
      stack.push({ indent: r.indent, node });
    });
    if (!roots.length && label) roots.push({ text: label, facts: [], kids: [] });
    return { label, items: roots };
  }
  function fitLines(text, maxW, maxFs, minFs, maxLines, bold) {
    let fs = maxFs, lines = wrap(String(text || ""), maxW, fs, !!bold);
    for (; fs >= minFs; fs -= 0.4) {
      lines = wrap(String(text || ""), maxW, fs, !!bold);
      if (lines.length <= maxLines && lines.every((l) => textW(l, fs, !!bold) <= maxW + 0.5)) break;
    }
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      const last = lines[lines.length - 1], cut = last.replace(/…$/, "");
      let t = cut;
      while (t.length && textW(t + "…", fs, !!bold) > maxW) t = t.slice(0, -1);
      if (t) lines[lines.length - 1] = t + "…";
    }
    return { lines, fs, h: (lines.length || 1) * fs * 1.18 };
  }
  function cardLabel(item) {
    if ((item.facts && item.facts.length) || (item.kids && item.kids.length)) return item.text || "";
    const t = item.text || "";
    const m = t.match(/^(.{1,22}?)(?:\s*[:—–]\s+|\s{2,})(.+)$/);
    if (m) return m[1].trim();
    const words = t.split(" ");
    if (words.length >= 2 && words[0].length <= 16) return words[0];
    return t;
  }
  function factLines(item) {
    if (item.facts && item.facts.length) return item.facts.slice();
    if (item.kids && item.kids.length && item.kids.every((k) => !(k.kids && k.kids.length))) return item.kids.map((k) => k.text).filter(Boolean);
    const t = item.text || "";
    const m = t.match(/^(.{1,22}?)(?:\s*[:—–]\s+|\s{2,})(.+)$/);
    if (m) return [m[2].trim()];
    const words = t.split(" ");
    if (words.length >= 2 && words[0].length <= 16) return [words.slice(1).join(" ")];
    return [];
  }
  // Level shapes are fixed app-wide (Ken t209u, t216u): 0 = squircle, 1 = index card (rx 6), 2 = pill.
  const HUB_RX_RATIO = 0.22, CARD_RX = 6, HUB_TAB = { w: 4, h: 8 }, CARD_TAB = { w: 4, h: 8, rx: 2 };
  function hubGeom(space, st, title, stacked) {
    const sw = space.x2 - space.x1, sh = space.y2 - space.y1;
    const reserve = stacked ? 12 : Math.max(86, Math.min(320, sw * 0.31));   // room for cards wide enough to hold their words
    const maxSide = Math.min(sw - 2 * reserve, stacked ? sh * 0.48 : sh * 0.82, stacked ? 200 : 420);
    const minSide = 108;
    const sc = clampScale(st && st.scale != null ? st.scale : (stacked ? 0.7 : 0.85));
    let side = Math.max(minSide, Math.min(maxSide, minSide + (maxSide - minSide) * ((sc - 0.25) / 0.75)));
    const pad = Math.max(8, side * 0.06);
    function layout(side) {
      const rx = side * HUB_RX_RATIO, innerW = Math.max(40, side - 2 * pad);
      const fit = fitLines(title || "", innerW, Math.min(16, side * 0.09), 8, 3, true);
      const titlePad = 8, titleH = fit.h + 2, gap = 4, bottomPad = 8;
      const imgTop = titlePad + titleH + gap;
      const availH = Math.max(24, side - bottomPad - imgTop);
      // Tight title-to-figure gap so the well (and the figure) read as filled, arms kept complete (Ken t230u, t237u).
      return { side, rx, fit, titleH, titlePad, pad, imgW: innerW, imgH: availH, imgTop, bottomPad };
    }
    let L = layout(side);
    while (side < maxSide && L.fit.fs < 11) { side += 6; L = layout(side); }
    const cx = (space.x1 + space.x2) / 2;
    const cy = stacked ? space.y1 + 10 + L.side / 2 : (space.y1 + space.y2) / 2;
    return {
      shape: "squircle", cx, cy, w: L.side, h: L.side, rx: L.rx, pad: L.pad, fit: L.fit,
      titlePad: L.titlePad, titleY: cy - L.side / 2 + L.titlePad, stroke: Math.max(3.2, L.side * 0.018),
      img: { x: cx - L.imgW / 2, y: cy - L.side / 2 + L.imgTop, w: L.imgW, h: L.imgH },
      x1: cx - L.side / 2, y1: cy - L.side / 2, x2: cx + L.side / 2, y2: cy + L.side / 2
    };
  }
  const FACT_FS = 10.5, FACT_FS_SUB = 9; // fact text never shrinks to make room for a picture (Ken t243u)
  function textColFits(textColW, item) {
    const facts = factLines(item);
    if (!facts.length) return true;
    return facts.every((f, i) => {
      const fs = i === 0 ? FACT_FS : FACT_FS_SUB, bold = i === 0, cap = i === 0 ? 3 : 2;
      const lines = wrap(String(f || ""), textColW, fs, bold);
      return lines.length <= cap && lines.every((l) => textW(l, fs, bold) <= textColW + 0.5);
    });
  }
  function factBlocks(item, colW) {
    const facts = factLines(item), blocks = [];
    (facts.length ? facts : [""]).forEach((f, i) => {
      if (!f && facts.length) return;
      const fs = i === 0 ? FACT_FS : FACT_FS_SUB, bold = i === 0;
      blocks.push({ lines: wrap(String(f || ""), colW, fs, bold), fs, bold });   // every line: the card grows instead of cutting text
    });
    if (!facts.length) return [];
    return blocks;
  }
  function blocksH(blocks) {
    return blocks.reduce((a, b) => a + b.lines.length * b.fs * 1.28 + 3, 0);
  }
  function isShortFacts(item, bandW) {
    const facts = factLines(item);
    if (facts.length === 0) return true;
    if (facts.length > 2) return false;
    return blocksH(factBlocks(item, bandW)) <= FACT_FS * 1.28 * 2 + 6;
  }
  function containArea(srcW, srcH, slotW, slotH) {
    if (!(slotW > 0 && slotH > 0)) return 0;
    if (!(srcW > 0 && srcH > 0)) return slotW * slotH;
    const z = Math.min(slotW / srcW, slotH / srcH);
    return srcW * z * srcH * z;
  }
  // Cover on a tall photo in a short slot crops the head or the feet. Use contain so both stay visible (Ken, trip/cyano).
  function photoFitMode(th, colW, colH, band, bodyW, bodyH) {
    if (band) return "contain";
    if (!(th && th.w > 0 && th.h > 0 && colW > 0 && colH > 0)) return "auto";
    const cover = Math.max(colW / th.w, colH / th.h);
    if (th.h * cover > colH + 1) return "contain";
    const bodyArea = Math.max(1, (bodyW || colW) * (bodyH || colH));
    if (containArea(th.w, th.h, colW, colH) / bodyArea >= 0.58) return "contain";
    return "auto";
  }
  function srcSize(th) {
    if (th && th.w > 0 && th.h > 0) return { w: th.w, h: th.h };
    return { w: 0, h: 0 };
  }
  function cardImgBox(th, cardW) {
    const sc = clampThumb(th && th.scale != null ? th.scale : 1);
    const col = Math.max(52, Math.round((cardW || 176) * 0.40));
    return { w: col, h: col, scale: sc, col };
  }
  // Index card (Ken, Nov 25): the facts come first and are never cut, shrunk or crowded. The picture is shown whole
  // (contain) at its own shape, sized by the learner's S/M/L (50–150%): in a side column it is never wider than the
  // text column (L = as wide as the text), and with short text it sits under the text at up to the card's width.
  // The card grows to fit both. maxH only limits the picture, never the words.
  function picAR(th) {
    if (!th) return 1;
    if (th.shape === "photo") return th.w > 0 && th.h > 0 ? th.w / th.h : 1;
    if (ART[th.shape]) return ART[th.shape][2] / ART[th.shape][3];
    return 2;   // old line drawings are wide
  }
  function cardGeom(cx, cy, side, item, th, maxW, maxH, builder) {
    const W = Math.min(300, Math.max(156, maxW || 200));
    const rx = CARD_RX, pad = 7, tabGutter = CARD_TAB.w + 3, gap = 8;
    const inner = W - pad * 2 - tabGutter;
    const sc = clampThumb(th && th.scale != null ? th.scale : 1), frac = sc / 1.5;   // S .33, M .67, L 1
    const label = cardLabel(item);
    const facts = factLines(item);
    const headFit = fitLines(label, W - 16, 11, 10, 3, true);
    const headH = Math.max(22, headFit.h + 8);
    const hasPic = !!(th && (th.src || hasSticker(th.shape)));
    const slot = hasPic || builder;
    const ar = hasPic ? picAR(th) : 1;
    const short = isShortFacts(item, inner);
    const graphPic = hasPic && !th.src && !!isGraph(th.shape);   // a graph close-up runs the full card width, under the words
    const useBand = slot && (short || !facts.length || graphPic);
    let blocks, textColW, textH, picW = 0, picH = 0, bodyH, textLayout, bandH = 0, imgRelX = 0, imgRelY = 0, textRelX;
    if (!slot) {
      textLayout = "full"; textColW = inner; blocks = factBlocks(item, inner); textH = blocksH(blocks);
      bodyH = textH + pad * 2; textRelX = side === "R" ? tabGutter + pad : pad;
    } else if (useBand) {
      textLayout = "band"; textColW = inner; blocks = factBlocks(item, inner); textH = blocks.length ? blocksH(blocks) : 0;
      bandH = blocks.length ? textH + 6 : 0;
      picW = inner * (graphPic && th.auto ? 1 : frac); picH = picW / ar;
      // under short text the picture may be bigger than the words, but not by much: about 3 lines of text tall at M
      const want = graphPic ? picW / ar : Math.min(170, Math.max(110, (textH || 20) * 3) * frac * 1.5);
      const capH = Math.min(want, maxH ? Math.max(40, maxH - headH - bandH - pad * 2) : want);
      if (picH > capH) { picH = capH; picW = picH * ar; }
      if (picW > inner) { picW = inner; picH = picW / ar; }
      if (!hasPic) { picW = Math.min(inner, 120); picH = 52; }
      bodyH = bandH + picH + pad * 2;
      textRelX = side === "R" ? tabGutter + pad : pad;
      imgRelX = textRelX + (inner - picW) / 2; imgRelY = headH + bandH + pad;
    } else {
      textLayout = "side";
      const colMax = (inner - gap) / 2;   // the picture column is never wider than the text column
      picW = colMax * frac; picH = picW / ar;
      if (!hasPic) { picW = Math.min(colMax, 56); picH = 52; }
      textColW = inner - gap - picW;
      blocks = factBlocks(item, textColW); textH = blocksH(blocks);
      const capH = maxH ? Math.max(textH, maxH - headH - pad * 2) : Math.max(textH, 170);
      if (picH > capH) { picH = capH; picW = picH * ar; textColW = inner - gap - picW; blocks = factBlocks(item, textColW); textH = blocksH(blocks); }
      bodyH = Math.max(textH, picH) + pad * 2;
      const picOnRight = side === "L";   // nearest the hub
      const colX = picOnRight ? pad + textColW + gap : tabGutter;
      textRelX = picOnRight ? pad : tabGutter + picW + gap;
      imgRelX = colX + (picOnRight ? (inner - gap - textColW - picW) / 2 : 0); imgRelY = headH + pad + (bodyH - pad * 2 - picH) / 2;
    }
    const H = headH + bodyH;
    return { shape: "card", cx, cy, w: W, h: H, rx, headH, headFit, blocks, pad, tabGutter, side, textColW, label, textLayout, bandH,
      textRelX, textH, hasPic, img: picW, imgW: picW, imgH: picH, imgRelX, imgRelY, imgBox: { w: picW, h: picH, scale: sc, col: picW },
      x1: cx - W / 2, y1: cy - H / 2, x2: cx + W / 2, y2: cy + H / 2 };
  }
  function pillGeom(cx, cy, item) {
    const label = item.text || "";
    const fit = fitLines(label, 86, 9, 6.5, 2, true);
    const pad = 6, h = Math.max(28, fit.h + pad * 2), w = Math.max(h + 10, (fit.lines.reduce((m, l) => Math.max(m, textW(l, fit.fs, true)), 0)) + pad * 2 + 8);
    return { shape: "pill", cx, cy, w, h, rx: h / 2, fit, label, x1: cx - w / 2, y1: cy - h / 2, x2: cx + w / 2, y2: cy + h / 2 };
  }
  function squircleAnchor(hub, side, y) {
    const x = side === "L" ? hub.x1 : hub.x2;
    const lo = hub.y1 + hub.rx + 4, hi = hub.y2 - hub.rx - 4;
    return { x, y: Math.min(hi, Math.max(lo, y)), side };
  }
  function cardInnerEdge(card) {
    // side L means the card sits on the left; the edge nearest the hub is the right edge
    return card.side === "L" ? card.x2 : card.x1;
  }
  function tabRect(edgeX, edgeY, dir, tab) {
    // dir: R/L/U/D = the direction the tab extends (into the shape). Center is the line's endpoint.
    const deep = tab.w, along = tab.h, rx = tab.rx != null ? tab.rx : deep / 2;
    let x, y, w, h;
    if (dir === "R") { x = edgeX; y = edgeY - along / 2; w = deep; h = along; }
    else if (dir === "L") { x = edgeX - deep; y = edgeY - along / 2; w = deep; h = along; }
    else if (dir === "U") { x = edgeX - along / 2; y = edgeY - deep; w = along; h = deep; }
    else { x = edgeX - along / 2; y = edgeY; w = along; h = deep; }
    return { x, y, w, h, rx, cx: x + w / 2, cy: y + h / 2, dir };
  }
  function rectTabEl(edgeX, edgeY, dir, color, cls, attrs, tab) {
    const r = (tab && tab.cx != null && tab.dir === dir) ? tab : tabRect(edgeX, edgeY, dir, tab);
    return `<rect class="${cls}" ${attrs || ""} x="${r.x.toFixed(1)}" y="${r.y.toFixed(1)}" width="${r.w}" height="${r.h}" rx="${r.rx}" fill="${color}"/>`;
  }
  function tabElAt(r, color, cls, attrs) {
    return `<rect class="${cls}" ${attrs || ""} x="${r.x.toFixed(1)}" y="${r.y.toFixed(1)}" width="${r.w}" height="${r.h}" rx="${r.rx}" fill="${color}"/>`;
  }
  function elbowLeader(hubTab, cardTab, side) {
    // Elbow lives in the gap between hub and card, never inside either shape, so corner
    // cards are not cut across. Both ends are the rendered tab centers.
    const gapLo = side === "L" ? cardTab.cx : hubTab.cx;
    const gapHi = side === "L" ? hubTab.cx : cardTab.cx;
    const elbowX = (gapLo + gapHi) / 2;
    const d = `M${hubTab.cx.toFixed(1)} ${hubTab.cy.toFixed(1)}L${elbowX.toFixed(1)} ${hubTab.cy.toFixed(1)}L${elbowX.toFixed(1)} ${cardTab.cy.toFixed(1)}L${cardTab.cx.toFixed(1)} ${cardTab.cy.toFixed(1)}`;
    return { d, elbowX, hx1: Math.min(elbowX, cardTab.cx), hx2: Math.max(elbowX, cardTab.cx), hy: cardTab.cy };
  }
  function composePhoto(b, st, mode) {
    if (mode === "list") {
      const hub = hubGeom(b, st, "", (b.x2 - b.x1) < 520);
      return hub.img;
    }
    return photoBox(b, st);
  }
  function capLayout(photo, st, text) {
    const tx = st.tx == null ? 0.5 : Math.min(0.95, Math.max(0.05, Number(st.tx)));
    const ty = st.ty == null ? 0.14 : Math.min(0.95, Math.max(0.05, Number(st.ty)));
    const maxW = Math.max(40, photo.w * 0.92), maxH = Math.max(16, photo.h * 0.55);
    let fs = Math.min(16, maxH * 0.28), lines, h;
    for (; fs >= 7; fs -= 0.5) {
      lines = wrap(text, maxW - 12, fs, true);
      h = lines.length * fs * 1.22 + 10;
      if (h <= maxH && lines.every((l) => textW(l, fs, true) <= maxW - 12)) break;
    }
    const w = Math.min(maxW, Math.max.apply(null, lines.map((l) => textW(l, fs, true))) + 12);
    let x = photo.x + tx * photo.w - w / 2, y = photo.y + ty * photo.h - h / 2;
    x = Math.min(photo.x + photo.w - w - 2, Math.max(photo.x + 2, x));
    y = Math.min(photo.y + photo.h - h - 2, Math.max(photo.y + 2, y));
    return { x, y, w, h, fs, lines, tx, ty, photo };
  }
  function calloutLayout(space, photo, st, tree, wide, builder, fi) {
    const items = tree.items || [], n = Math.max(items.length, 1);
    const sw = space.x2 - space.x1, sh = space.y2 - space.y1;
    const stacked = !wide && sw < 520;
    const pins = st.pins || [];
    const own = (st && st.thumbs) || {}, thumbs = {};
    // a card without the learner's picture shows the sticker pulled for it (unique across maps)
    items.forEach((it, c) => { const a = !own[c] && fi != null ? AUTO_CARD(fi, c) : ""; thumbs[c] = own[c] || (a ? { shape: a, scale: 1, auto: true } : undefined); });
    const hub = hubGeom(space, st, tree.label || "", stacked);
    const both = !stacked && sw >= 520;
    function assignSide(i) {
      const pin = pins[i];
      return (pin && pin.side) || (both ? (i % 2 === 0 ? "L" : "R") : (stacked ? "L" : "R"));
    }
    const left = [], right = [];
    items.forEach((item, i) => { (assignSide(i) === "L" ? left : right).push({ item, i }); });
    const nodes = [];
    const cardW = stacked ? Math.min(sw - 36, 300) : Math.min(300, Math.max(168, (sw - hub.w - 56) / 2));
    let tight = false;
    function placeGroup(list, side) {
      const m = list.length;
      if (stacked || !m) return;
      // Cards take the height their words need. When a side is too full, pictures get smaller first (never the text);
      // if it still doesn't fit, the map is marked tight so the builder can suggest a second map.
      const avail = sh - 16, minGap = 8;
      let cap = null, geoms = list.map((it) => cardGeom(0, 0, side, it.item, thumbs[it.i], cardW, null, builder));
      const total = (gs) => gs.reduce((a, g) => a + g.h, 0) + minGap * (m - 1);
      for (let c = 200; total(geoms) > avail && c >= 30; c -= 10) { cap = c; geoms = list.map((it) => cardGeom(0, 0, side, it.item, thumbs[it.i], cardW, c + 40, builder)); }
      if (total(geoms) > avail) tight = true;
      const sumH = geoms.reduce((a, g) => a + g.h, 0);
      const gapY = m > 1 ? Math.min(28, Math.max(minGap, (avail - sumH) / (m - 1))) : 0;
      let y = space.y1 + 8 + Math.max(0, (avail - sumH - gapY * (m - 1)) / 2);
      list.forEach((it, k) => {
        const pin = pins[it.i] || {};
        const cx = side === "L" ? space.x1 + cardW / 2 + 4 : space.x2 - cardW / 2 - 4;
        const g0 = geoms[k];
        let cy = pin.y != null && pin.y >= 0 && pin.y <= 1 ? space.y1 + pin.y * sh : y + g0.h / 2;
        y += g0.h + gapY;
        const card = cardGeom(cx, cy, side, it.item, thumbs[it.i], cardW, cap == null ? null : cap + 40, builder);
        if (!tight) {
          if (card.y1 < space.y1 + 2) { card.cy += (space.y1 + 2 - card.y1); card.y1 = card.cy - card.h / 2; card.y2 = card.cy + card.h / 2; }
          if (card.y2 > space.y2 - 2) { card.cy -= (card.y2 - (space.y2 - 2)); card.y1 = card.cy - card.h / 2; card.y2 = card.cy + card.h / 2; }
        }
        const defaultY = card.cy;
        const hy = pin.y != null && pin.ang == null ? squircleAnchor(hub, side, space.y1 + (pin.y) * sh).y : squircleAnchor(hub, side, defaultY).y;
        const hA = squircleAnchor(hub, side, hy);
        const bA = { x: cardInnerEdge(card), y: card.cy, side };
        const hubDir = side === "L" ? "R" : "L";
        const cardDir = side === "L" ? "L" : "R";
        const hubTab = tabRect(hA.x, hA.y, hubDir, HUB_TAB);
        const cardTab = tabRect(bA.x, bA.y, cardDir, CARD_TAB);
        const route = elbowLeader(hubTab, cardTab, side);
        const color = BRANCH[it.i % BRANCH.length];
        const kids = [];
        const deep = (it.item.kids || []).filter((k) => k.kids && k.kids.length);
        deep.forEach((k, ki) => {
          const py = card.y2 + 16 + ki * 32;
          const px = side === "L" ? card.cx : card.cx;
          const pill = pillGeom(px, py, k);
          kids.push({ pill, item: k, color, leader: `M${card.cx.toFixed(1)} ${card.y2.toFixed(1)}L${pill.cx.toFixed(1)} ${pill.y1.toFixed(1)}` });
        });
        nodes.push({ i: it.i, th: thumbs[it.i], item: it.item, side, color, leader: route.d, card, hA, bA, elbowX: route.elbowX, hubTab, cardTab, hubDir, cardDir, kids, depth: 0, hx1: route.hx1, hx2: route.hx2, hy: route.hy });
      });
    }
    if (stacked) {
      let y = hub.y2 + 24;
      items.forEach((item, i) => {
        const card = cardGeom((space.x1 + space.x2) / 2 + 10, y, "L", item, thumbs[i], cardW, null, builder);
        card.cx = space.x1 + 22 + card.w / 2;
        card.cy = y + card.h / 2;
        card.x1 = card.cx - card.w / 2; card.x2 = card.cx + card.w / 2;
        card.y1 = y; card.y2 = y + card.h;
        const pin = pins[i] || {};
        const frac = i / Math.max(n, 1);
        const hA = squircleAnchor(hub, "L", hub.y2 - 8 - (1 - frac) * Math.min(hub.h * 0.35, n * 10));
        // prefer bottom edge for stacked: along the bottom of the squircle
        const bx = hub.cx - hub.w * 0.18 + frac * hub.w * 0.2;
        const hB = { x: Math.min(hub.x2 - hub.rx, Math.max(hub.x1 + hub.rx, bx)), y: hub.y2, side: "B" };
        const bA = { x: card.x1, y: card.cy, side: "L" };
        const hubTab = tabRect(hB.x, hB.y, "U", HUB_TAB);
        const cardTab = tabRect(bA.x, bA.y, "R", CARD_TAB);
        // down from the hub, left into the gutter beside the cards, then down to the card: never across a card's words
        const elbowX = space.x1 + 6 + (i % 6) * 2.2, dropY = hub.y2 + 6 + (i % 6) * 1.6;
        const leader = `M${hubTab.cx.toFixed(1)} ${hubTab.cy.toFixed(1)}L${hubTab.cx.toFixed(1)} ${dropY.toFixed(1)}L${elbowX.toFixed(1)} ${dropY.toFixed(1)}L${elbowX.toFixed(1)} ${cardTab.cy.toFixed(1)}L${cardTab.cx.toFixed(1)} ${cardTab.cy.toFixed(1)}`;
        const color = BRANCH[i % BRANCH.length];
        nodes.push({ i, th: thumbs[i], item, side: "L", color, leader, card, hA: hB, bA, elbowX, hubTab, cardTab, hubDir: "U", cardDir: "R", kids: [], depth: 0, hx1: Math.min(elbowX, cardTab.cx), hx2: Math.max(elbowX, cardTab.cx), hy: cardTab.cy, stacked: true });
        y = card.y2 + 10;
      });
    } else {
      placeGroup(left, "L");
      placeGroup(right, "R");
    }
    return { photo: hub.img, label: tree.label, nodes, both, stacked, hub, tight };
  }
  function photoElAt(st, r, clipId, cover) {
    const src = esc(st.src || "");
    const mode = cover === "contain" || cover === false ? "contain" : (cover === "cover" || cover === true ? "auto" : (cover || "auto"));
    const box = photoCover(st, r, mode);
    const fit = box.slice ? (mode === "contain" ? "xMidYMid meet" : "xMidYMid slice") : "xMidYMid meet";
    return `<image class="rphoto" href="${src}" xlink:href="${src}" x="${box.x.toFixed(1)}" y="${box.y.toFixed(1)}" width="${box.w.toFixed(1)}" height="${box.h.toFixed(1)}" preserveAspectRatio="${fit}" clip-path="url(#${clipId})" data-px="${r.x.toFixed(1)}" data-py="${r.y.toFixed(1)}" data-pw="${r.w.toFixed(1)}" data-ph="${r.h.toFixed(1)}"/>`;
  }
  function capEl(st, photo, text, i, practice) {
    const L = capLayout(photo, st, text || "");
    const body = practice ? `<line class="rrule" x1="${L.x + 6}" y1="${L.y + L.h / 2}" x2="${L.x + L.w - 6}" y2="${L.y + L.h / 2}" stroke="#5A6670" stroke-width="1"/>`
      : L.lines.map((ln, j) => `<text x="${(L.x + 6).toFixed(1)}" y="${(L.y + 5 + L.fs * 0.85 + j * L.fs * 1.22).toFixed(1)}" font-size="${L.fs.toFixed(1)}" font-weight="700" fill="#14222C">${esc(ln)}</text>`).join("");
    return `<g class="rcap" data-cap="${i}" data-px="${photo.x.toFixed(1)}" data-py="${photo.y.toFixed(1)}" data-pw="${photo.w.toFixed(1)}" data-ph="${photo.h.toFixed(1)}">
      <rect class="rcapbg" x="${L.x.toFixed(1)}" y="${L.y.toFixed(1)}" width="${L.w.toFixed(1)}" height="${L.h.toFixed(1)}" rx="6" fill="#fff" fill-opacity=".86"/>${body}</g>`;
  }
  // The number to remember, on the picture itself (Ken, Nov 26: "tachycardia at >160" → "> 160" inside the racing heart).
  // A cutoff (> 160, RR > 20/min, SpO2 < 90%) first, then a range with a unit (8–13 Hz), then a decimal range (7.35–7.45).
  const KV_UNIT = "%|beats\\/min|breaths\\/min|\\/min|bpm|mm ?Hg|Hz|µV|uV|°[CF]|cm ?H2O|mL\\/kg|mEq\\/L|sec\\b|s\\b";
  const KV_CUT = new RegExp("(?:\\b(HR|RR|SpO2|SaO2|PaO2|PaCO2|pH|HCO3-?|AHI|SBP|DBP|BP|MAP|EtCO2|FiO2|PEEP|Vt|GCS|Temp)\\s*)?(≥|≤|>=|<=|>|<)\\s*(\\d+(?:[.⁄]\\d+)?)\\s*(" + KV_UNIT + ")?", "i");
  const KV_RANGE = new RegExp("(\\d+(?:\\.\\d+)?)\\s*[–-]\\s*(\\d+(?:\\.\\d+)?)\\s*(" + KV_UNIT + ")");
  const keyValue = (text) => keyValue0(text).replace(/⁄/g, "/");
  function keyValue0(text) {
    // "below 120/80" reads as < 120/80; a blood pressure is one number
    const t = String(text || "").replace(/\b(?:below|under|less than)\s+(?=\d)/gi, "< ").replace(/\b(?:above|over|more than|greater than)\s+(?=\d)/gi, "> ")
      .replace(/\b(\d{2,3})\/(\d{2,3})\b(?!\s*(?:min|hr))/g, "$1⁄$2");
    let m = t.match(KV_CUT);
    // just the number (Ken, Nov 26): the comparator, the value and its unit, never the word before it
    if (m) { const op = { ">=": "≥", "<=": "≤" }[m[2]] || m[2]; return `${op} ${m[3]}${m[4] ? (/^[%°/]/.test(m[4]) ? "" : " ") + m[4].replace(/\s+/g, "") : ""}`.replace(/ ?(beats|breaths)\/min/, "/min"); }
    m = t.match(KV_RANGE); if (m) return `${m[1]}–${m[2]}${/^[%°/]/.test(m[3]) ? "" : " "}${m[3].replace(/\s+/g, "")}`.replace(/ ?(beats|breaths)\/min/, "/min");
    m = t.match(/\b(\d+\.\d+)\s*[–-]\s*(\d+\.\d+)\b/); if (m) return `${m[1]}–${m[2]}`;
    return "";
  }
  // a small dark label inside the picture's box, bottom center; left off when the picture is too small to hold it clearly
  function valueBadge(x, y, w, h, v) {
    if (!v || w < 44 || h < 40) return "";
    let fs = Math.min(15, Math.max(9, h * 0.15)), tw = textW(v, fs, true);
    while (tw + fs > w * 0.94 && fs > 8.5) { fs -= 0.5; tw = textW(v, fs, true); }
    if (tw + fs > w * 0.94) return "";
    const bw = tw + fs, bh = fs * 1.55, bx = x + (w - bw) / 2, by = y + h - bh - 2;
    return `<g class="rvalue"><rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="${(bh / 2).toFixed(1)}" fill="#14222C" fill-opacity=".88" stroke="#fff" stroke-width="1.2"/><text x="${(x + w / 2).toFixed(1)}" y="${(by + bh / 2 + fs * 0.36).toFixed(1)}" text-anchor="middle" font-size="${fs.toFixed(1)}" font-weight="700" fill="#fff">${esc(v)}</text></g>`;
  }
  function cardFace(card, th, color, fi, pin, practice, builder, idp) {
    idp = idp || "";   // unique per drawing, so several maps on one print page never share clip paths
    const { x1, y1, w, h, rx, headH, headFit, blocks, pad } = card;
    const band = card.textLayout === "band";
    const imgX = x1 + card.imgRelX, imgY = y1 + card.imgRelY, colW = card.imgW, colH = card.imgH;
    const textX = x1 + card.textRelX;
    let g = `<g class="rcard" data-cap="${fi}" data-pin="${pin}">`;
    const cardClip = `${idp}rcardclip${fi}p${pin}`;
    g += `<clipPath id="${cardClip}"><rect x="${x1.toFixed(1)}" y="${y1.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${rx}"/></clipPath>`;
    g += `<g class="rcardface" clip-path="url(#${cardClip})">`;
    g += `<rect class="rcardbg" x="${x1.toFixed(1)}" y="${y1.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${rx}" fill="#fff"/>`;
    g += `<rect class="rcardhead" x="${x1.toFixed(1)}" y="${y1.toFixed(1)}" width="${w.toFixed(1)}" height="${headH.toFixed(1)}" fill="${color}"/>`;
    if (!practice) {
      headFit.lines.forEach((ln, j) => {
        g += `<text class="rkw" x="${(x1 + w / 2).toFixed(1)}" y="${(y1 + 5 + headFit.fs * 0.85 + j * headFit.fs * 1.18).toFixed(1)}" text-anchor="middle" font-size="${headFit.fs.toFixed(1)}" font-weight="700" fill="#fff">${esc(ln)}</text>`;
      });
      // every line is drawn: the card was sized to hold all of the text
      let ty = y1 + headH + (band ? 5 : pad) + (blocks[0] ? blocks[0].fs * 0.9 : 0);
      blocks.forEach((b) => {
        b.lines.forEach((ln) => {
          g += `<text class="rfactline" x="${textX.toFixed(1)}" y="${ty.toFixed(1)}" font-size="${b.fs.toFixed(1)}" font-weight="${b.bold ? 700 : 400}" fill="#14222C">${esc(ln)}</text>`;
          ty += b.fs * 1.28;
        });
        ty += 3;
      });
    }
    if (colW > 0 && colH > 0) {
      const clip = `${idp}rcimg${fi}p${pin}`;
      g += `<clipPath id="${clip}"><rect x="${imgX.toFixed(1)}" y="${imgY.toFixed(1)}" width="${colW.toFixed(1)}" height="${colH.toFixed(1)}" rx="4"/></clipPath>`;
      if (th && th.shape === "photo" && th.src) {
        const src = esc(th.src);   // the slot already has the picture's shape, so it fills the slot and stays whole
        g += `<g class="rthumb" data-cap="${fi}" data-pin="${pin}"><image class="rthumbimg" href="${src}" xlink:href="${src}" x="${imgX.toFixed(1)}" y="${imgY.toFixed(1)}" width="${colW.toFixed(1)}" height="${colH.toFixed(1)}" preserveAspectRatio="xMidYMid meet" clip-path="url(#${clip})"/></g>`;
      } else if (th && hasSticker(th.shape)) {
        // the card's own number goes on the picture (never in Practice, where it would give the answer away; graph close-ups have theirs)
        const kv = !practice && !isGraph(th.shape) ? keyValue(blocks.map((b) => b.lines.join(" ")).join(" ")) : "";
        g += `<g class="rthumb" data-cap="${fi}" data-pin="${pin}">${stickerArt(th.shape, imgX, imgY, colW, colH)}${valueBadge(imgX, imgY, colW, colH, kv)}</g>`;
      } else if (builder) {
        g += `<g class="rthumbadd" data-cap="${fi}" data-pin="${pin}" transform="translate(${(imgX + colW / 2).toFixed(1)} ${(imgY + colH / 2).toFixed(1)})"><rect x="${(-colW / 2).toFixed(1)}" y="${(-colH / 2).toFixed(1)}" width="${colW.toFixed(1)}" height="${colH.toFixed(1)}" rx="4" fill="#F4F7F8" stroke="${color}" stroke-width="1.2" stroke-dasharray="3 2"/><path d="M-6 0h12M0-6v12" fill="none" stroke="${color}" stroke-width="1.4" stroke-linecap="round"/></g>`;
      }
    }
    g += `</g>`;
    g += `<rect class="rcardstroke" x="${x1.toFixed(1)}" y="${y1.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="${rx}" fill="none" stroke="${color}" stroke-width="2.6"/>`;
    g += `</g>`;
    return g;
  }
  function calloutEl(space, photo, st, tree, fi, practice, builder, selPin, wide) {
    const L = calloutLayout(space, photo || {}, st, tree, wide, builder, fi);
    const cid = "rc" + SVGN + "f" + fi;
    const hub = L.hub, thumbs = (st && st.thumbs) || {};
    let g = `<g class="rdiagram" data-cap="${fi}" data-px="${hub.x1.toFixed(1)}" data-py="${hub.y1.toFixed(1)}" data-pw="${hub.w.toFixed(1)}" data-ph="${hub.h.toFixed(1)}" data-cx="${hub.cx.toFixed(1)}" data-cy="${hub.cy.toFixed(1)}" data-w="${hub.w.toFixed(1)}" data-h="${hub.h.toFixed(1)}" data-rx="${hub.rx.toFixed(1)}">`;
    const sw = hub.stroke, inset = sw / 2;
    g += `<clipPath id="${cid}hub"><rect x="${hub.x1.toFixed(1)}" y="${hub.y1.toFixed(1)}" width="${hub.w.toFixed(1)}" height="${hub.h.toFixed(1)}" rx="${hub.rx.toFixed(1)}"/></clipPath>`;
    g += `<clipPath id="${cid}hubIn"><rect x="${(hub.x1 + inset).toFixed(1)}" y="${(hub.y1 + inset).toFixed(1)}" width="${(hub.w - sw).toFixed(1)}" height="${(hub.h - sw).toFixed(1)}" rx="${Math.max(0, hub.rx - inset).toFixed(1)}"/></clipPath>`;
    g += `<g class="rhub rhubpic" data-cap="${fi}">`;
    g += `<rect class="rhubfill" x="${hub.x1.toFixed(1)}" y="${hub.y1.toFixed(1)}" width="${hub.w.toFixed(1)}" height="${hub.h.toFixed(1)}" rx="${hub.rx.toFixed(1)}" fill="#fff" stroke="none"/>`;
    if (st && st.src) g += st.placeholder ? photoElAt(st, hub.img, cid + "hubIn", "contain").replace('class="rphoto"', 'class="rphoto rplaceholder" opacity=".38"') : photoElAt(st, hub.img, cid + "hubIn", "contain");
    if (st && st.placeholder && !wide) {
      // two choices on the placeholder (screen only): the learner's own picture, or pictures suggested from the topic's words
      const bw = Math.min(118, (hub.w - 30) / 2), bh = 28, by = hub.img.y + hub.img.h - bh - 4, gx = hub.cx;
      [["sthubmine", "📷 My picture", gx - bw - 4], ["sthubsuggest", "✨ Suggestions", gx + 4]].forEach(([act, t, x]) => {
        g += `<g class="rhubbtn" data-act="${act}" role="button" tabindex="0"><rect x="${x.toFixed(1)}" y="${by.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh}" rx="${bh / 2}" fill="#0B4F6C"/><text x="${(x + bw / 2).toFixed(1)}" y="${(by + bh / 2 + 4).toFixed(1)}" text-anchor="middle" font-size="${Math.min(11.5, bw / 9.5).toFixed(1)}" font-weight="700" fill="#fff">${t}</text></g>`;
      });
    }
    if (tree.label && !practice) {
      const bandY = hub.y1 + inset;
      const bandHt = Math.max(0, hub.img.y - bandY);
      g += `<rect class="rhubband" x="${(hub.x1 + inset).toFixed(1)}" y="${bandY.toFixed(1)}" width="${(hub.w - sw).toFixed(1)}" height="${bandHt.toFixed(1)}" fill="#fff" clip-path="url(#${cid}hubIn)"/>`;
      hub.fit.lines.forEach((ln, j) => {
        g += `<text class="rhubtitle" x="${hub.cx.toFixed(1)}" y="${(hub.titleY + hub.fit.fs * 0.9 + j * hub.fit.fs * 1.18).toFixed(1)}" text-anchor="middle" font-size="${hub.fit.fs.toFixed(1)}" font-weight="700" fill="#14222C">${esc(ln)}</text>`;
      });
    }
    g += `<rect class="rhubstroke" x="${hub.x1.toFixed(1)}" y="${hub.y1.toFixed(1)}" width="${hub.w.toFixed(1)}" height="${hub.h.toFixed(1)}" rx="${hub.rx.toFixed(1)}" fill="none" stroke="#0A2A4A" stroke-width="${sw.toFixed(1)}"/>`;
    g += `</g>`;
    L.nodes.forEach((node) => {
      const on = selPin === node.i ? " sel" : "";
      g += `<g class="rcallout${on}" data-cap="${fi}" data-pin="${node.i}">`;
      g += `<path class="rleader" d="${node.leader}" fill="none" stroke="${node.color}" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>`;
      g += `<line class="rrule" x1="${node.hx1.toFixed(1)}" y1="${node.hy.toFixed(1)}" x2="${node.hx2.toFixed(1)}" y2="${node.hy.toFixed(1)}" stroke="${node.color}" stroke-width="2.3" stroke-linecap="round"/>`;
      if (!practice) g += cardFace(node.card, node.th, node.color, fi, node.i, practice, builder, cid);
      (node.kids || []).forEach((k) => {
        const p = k.pill;
        g += `<path class="rleader" d="${k.leader}" fill="none" stroke="${k.color}" stroke-width="1.3" stroke-linecap="round"/>`;
        g += `<rect class="rpill" x="${p.x1.toFixed(1)}" y="${p.y1.toFixed(1)}" width="${p.w.toFixed(1)}" height="${p.h.toFixed(1)}" rx="${p.rx.toFixed(1)}" fill="#fff" stroke="${k.color}" stroke-width="1.8"/>`;
        if (!practice) p.fit.lines.forEach((ln, j) => {
          g += `<text x="${p.cx.toFixed(1)}" y="${(p.y1 + p.h / 2 + p.fit.fs * 0.35 + j * p.fit.fs * 1.15).toFixed(1)}" text-anchor="middle" font-size="${p.fit.fs.toFixed(1)}" font-weight="700" fill="${k.color}">${esc(ln)}</text>`;
        });
      });
      g += `</g>`;
    });
    // Tabs on top of the outlines, just inside both ends (Ken t210u, t216u)
    L.nodes.forEach((node) => {
      const hubTab = node.hubTab || tabRect(node.hA.x, node.hA.y, node.hubDir || (node.hA.side === "B" ? "U" : (node.hA.x <= hub.cx ? "R" : "L")), Object.assign({ rx: HUB_TAB.w / 2 }, HUB_TAB));
      const cardTab = node.cardTab || tabRect(node.bA.x, node.bA.y, node.cardDir || (node.bA.x >= node.card.cx ? "L" : "R"), CARD_TAB);
      g += `<g class="rpin" data-cap="${fi}" data-pin="${node.i}">${tabElAt(hubTab, node.color, "rtab rtab-hub", "")}</g>`;
      g += tabElAt(cardTab, node.color, "rtab rclip", `data-cap="${fi}" data-pin="${node.i}"`);
    });
    g += `</g>`;
    return g;
  }

  function slashFactEl(b, st, tree, practice) {
    // Mini slash inside a fact space when there is a list but no picture (Wood's slash recall).
    const x0 = b.x1 + 10, y0 = b.y2 - 12, x1 = b.x2 - 10, y1 = b.y1 + 16;
    const items = tree.items || [];
    const n = Math.max(items.length, 1);
    let g = `<line class="rslash" x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="${BAY}" stroke-width="2.2" stroke-linecap="round"/>`;
    if (tree.label) g += `<text x="${x0 + 4}" y="${y0 - 4}" font-size="8.5" font-weight="700" fill="${BAY}">${esc(tree.label)}</text>`;
    items.forEach((it, i) => {
      const t = i / Math.max(n - 1, 1), sx = x0 + (x1 - x0) * (0.18 + 0.64 * t), sy = y0 + (y1 - y0) * (0.18 + 0.64 * t);
      const right = i % 2 === 0, hx1 = right ? sx + 8 : b.x1 + 8, hx2 = right ? b.x2 - 8 : sx - 8, hy = sy;
      const fs = 9, tw = textW(it.text, fs, true), tx = right ? hx1 + 2 : hx2 - tw - 2, col = BRANCH[i % BRANCH.length];
      g += `<path d="M${sx} ${sy}L${right ? hx1 : hx2} ${hy}" fill="none" stroke="${col}" stroke-width="1.3" stroke-linecap="round"/>`;
      g += `<line class="rrule" x1="${Math.min(hx1, hx2)}" y1="${hy}" x2="${Math.max(hx1, hx2)}" y2="${hy}" stroke="${col}" stroke-width="1.3"/>`;
      if (!practice) g += `<text class="rkw" x="${tx}" y="${hy - 2}" font-size="${fs}" font-weight="700" fill="${col}">${esc(it.text)}</text>`;
    });
    return `<g class="rslashfact">${g}</g>`;
  }

  // ---------- Recall map (SVG) ----------
  // opts: { mode: "filled"|"practice", ideas: bool, hideNames: bool }
  // opts.screen: laid out for a phone screen (narrower page, never shrunk; it grows taller and the screen scrolls with the app's
  // down-arrow cue). Without it: laid out for one letter page (shrinks if it must). A built page keeps the screen layout so the
  // learner's drawing lines up, and print fits it to the page.
  function lines(x, y, text, fs, maxW, attrs, lh) {
    const ls = wrap(text, maxW, fs, /font-weight="700"/.test(attrs || ""));
    lh = lh || fs * 1.25;
    return { h: ls.length * lh, svg: ls.map((l, i) => `<text x="${x}" y="${y + i * lh}" font-size="${fs}" ${attrs || ""}>${esc(l)}</text>`).join("") };
  }
  function topicMeta(m) {
    const card = (W.SCALES || {})[m && m.k];
    const cardTitle = card ? plain(card.title) : "";
    const title = (m && m.title) || "";
    const same = !card || !title || !cardTitle || title === cardTitle || cardTitle.indexOf(title) === 0 || title.indexOf(cardTitle) === 0;
    if (!same) return { abbrs: [], related: [], note: "", src: "" };
    return { abbrs: (m && m.abbrs) || [], related: (m && m.related) || [], note: (m && m.note) || "", src: (m && m.src) || "" };
  }
  function recallSvg(m, opts) {
    opts = opts || {};
    if (m && m.cards) {
      const cu = opts.custom || {}; let st0 = (cu.stickers || {})[0] || {};
      if (st0.shape && st0.shape !== "photo" && hasSticker(st0.shape)) { const id = artId(st0.shape); st0 = Object.assign({}, st0, { shape: "photo", src: artSrc(id), w: ART[id][2], h: ART[id][3], sticker: id }); }
      const real = st0.shape === "photo" && st0.src && !st0.placeholder;
      const st = Object.assign({}, real ? {} : PLACEHOLDER, real ? {} : { src: ART_BASE + "otter-face.webp" }, st0, real ? {} : { shape: "photo", placeholder: true, src: ART_BASE + "otter-face.webp" }, { cap: st0.cap || m.capDefault });
      opts = Object.assign({}, opts, { custom: Object.assign({}, cu, { stickers: Object.assign({}, cu.stickers || {}, { 0: st }) }) });
    }
    const practice = opts.mode === "practice", scr = !!opts.screen, land = !scr && !!(opts.landscape || opts.print);
    const Wd = scr ? 400 : land ? 1008 : 612, M = scr ? 14 : land ? 20 : 22;
    // header (measured first so the drawing area knows where to start)
    let hd = `<image href="${LOGO}" x="${M}" y="16" width="26" height="26"/>`;
    hd += `<text x="${M + 32}" y="27" font-size="9" font-weight="700" fill="${BAY}">${esc(APP)} · Otter Bay</text><text x="${M + 32}" y="39" font-size="8.5" fill="#5A6670">Study sheet: recall map${practice ? " (practice)" : ""}</text>`;
    hd += `<text x="${Wd - M}" y="27" text-anchor="end" font-size="8.5" fill="#5A6670">Name ${scr ? "______________" : "______________________"}</text><text x="${Wd - M}" y="40" text-anchor="end" font-size="8.5" fill="#5A6670">Date ____________</text>`;
    let hy = 66;
    const t1 = lines(M, hy, m.title, 19, Wd - 2 * M, 'font-weight="700" fill="#14222C"', 22); hd += t1.svg; hy += t1.h - 22;
    if (m.intro) { const t = lines(M, hy + 15, m.intro, 9.5, Wd - 2 * M, 'fill="#3B4A55"', 12); hd += t.svg; hy += 15 + t.h - 12; }
    if (m.answer && !practice) { const t = lines(M, hy + 16, "You asked: “" + m.q + "” → " + m.answer, 10, Wd - 2 * M, 'fill="#14222C"', 13); hd += t.svg; hy += 16 + t.h - 13; }
    const head = hy + 20;
    hd += `<line x1="${M}" y1="${head - 6}" x2="${Wd - M}" y2="${head - 6}" stroke="#D5DDE2"/>`;
    // footer rows (measured first, drawn after the layout)
    const meta = topicMeta(m);
    const FW = Wd - 2 * M, rows = [];
    const links = [...meta.abbrs.map((a) => `${a.abbr} = ${a.meaning}`), ...meta.related.map((t) => "See also: " + t)];
    if (links.length) rows.push({ h: 20 * (scr ? 2 : 1), links: true });
    if (meta.note) { const t = lines(0, 0, (practice ? "⚠ Remember:" : "⚠ Remember: " + meta.note), 9, FW, "", 11.5); rows.push({ h: t.h + 5, text: practice ? "⚠ Remember:" : "⚠ Remember: " + meta.note, fs: 9, fill: "#24313E", line: practice }); }
    const used = [...new Set(m.facts.map((f) => f.sev).filter(Boolean))];
    if (used.length) rows.push({ h: 16, key: true });
    const steps = "How to use: 1) Draw your own picture around each fact (odd or funny sticks best). 2) Later, print Practice and fill it in from memory. 3) Check it against Filled and add what you missed in another color.";
    const why = "Why it works: drawing and making your own notes, then recalling them, help memory (Wammes et al. 2016; Slamecka & Graf 1978; Roediger & Karpicke 2006).";
    const src = "Source: " + (meta.src || "Otter Bay") + ". Written by Otter Bay in our own words. For learning only; follow your facility's protocols.";
    const song = m.song && m.song.print && !opts.noSong ? songItems(m, practice) : null;
    if (song) { const cols = Wd >= 600 ? (Math.max(...song.map((t) => textW(t, 8.4))) < (FW - 28) / 3 ? 3 : 2) : 1, cw = (FW - (cols - 1) * 14) / cols, per = Math.ceil(song.length / cols);
      const colsL = Array.from({ length: cols }, (_, c) => song.slice(c * per, (c + 1) * per).map((t) => wrap(t, cw - 4, 8.4)));
      rows.push({ h: 15 + Math.max(...colsL.map((c) => c.reduce((a, l) => a + l.length * 10.6 + 1.5, 0))) + 6, song: colsL, cw }); }
    [[steps, 8.2, "#24313E"], [why, 7.2, "#5A6670"], [src, 7.2, "#5A6670"]].forEach(([t, fs, fill]) => rows.push({ h: lines(0, 0, t, fs, FW, "", fs * 1.3).h + 3, text: t, fs, fill }));
    const foot = rows.reduce((a, r) => a + r.h, 0) + 16;
    // the drawing area: screen keeps the text full size and grows taller; print shrinks first, then grows (and print fits the page)
    // stickers pulled for each fact (one per fact without its own picture), chosen before the layout so a graph close-up
    // can get a full-width space under its words (Ken, Nov 25: "a large part of the graph")
    const topicKey = m.k || plain(m.title), cu0 = opts.custom || {}, fslots = [];
    if (!opts.noAuto) m.facts.forEach((f, i) => { const st = (cu0.stickers || {})[i]; if (!st || !st.shape) fslots.push({ key: `${topicKey}|f${i}`, text: [f.label, ...(f.details || []).map((d) => d.text)].join(" ") }); });
    const fpicked = fslots.length ? assignStickers(topicKey, fslots, m.field) : {};
    opts = Object.assign({}, opts, { _gAR: m.facts.map((f, i) => isGraph(fpicked[`${topicKey}|f${i}`] || "")) });
    let H = scr ? 640 : land ? 756 : 792, out = null;
    const SCALES = scr ? [1.15, 1.08, 1] : land ? [1.2, 1.1, 1, 0.93, 0.86, 0.8, 0.74, 0.68] : [1.45, 1.3, 1.18, 1.08, 1, 0.93, 0.86, 0.8, 0.74, 0.68, 0.62, 0.58];
    if (scr) {
      for (let grow = 0; grow < 24 && !out; grow++, H = Math.round(H * 1.12))
        for (const s of SCALES) { out = layout(m, opts, s, Wd, H, M, head, foot); if (out) { out.H = H; break; } }
    } else {
      // print: find the page height and text size that print the biggest text once fitted to the letter page, then take the
      // shortest page within 7% of that, so the sheet still fills the paper's width
      const cand = []; let best = 0;
      for (let grow = 0; grow < 12; grow++, H = Math.round(H * 1.08)) {
        if (best && SCALES[0] * 792 / H <= best) break;
        for (const s of SCALES) { if (s * 792 / H <= best * 0.93) break; const o = layout(m, opts, s, Wd, H, M, head, foot); if (o) { o.H = H; o.eff = s * Math.min(1, 792 / H); cand.push(o); best = Math.max(best, o.eff); break; } }
      }
      out = cand.find((o) => o.eff >= best * 0.93) || null;
    }
    if (!out) return "";
    const { boxes, x0, y0, x1, y1, s, title } = out;
    H = out.H;
    const cu = opts.custom || {}, uid = "r" + (++SVGN);
    boxes.forEach((b, i) => { const mv = (cu.moves || {})[i]; if (!mv) return; ["x1", "x2", "cx1", "cx2"].forEach((q) => { b[q] += mv[0]; }); ["y1", "y2", "cy1", "cy2"].forEach((q) => { b[q] += mv[1]; }); });
    H = out.H;
    // On a phone the index cards stack under the topic picture; the fact's space grows to hold every card, everything
    // below moves down, and the page gets taller (Ken, Nov 25: the cards ran past the map and over the footer).
    const listedAt = (b, i) => { const st = (cu.stickers || {})[i]; if (!(st && st.shape === "photo" && st.src)) return null; const tree = capItems(st, b.f, b); return tree.items && tree.items.length >= 2 ? { st, tree } : null; };
    // stickers pulled for this map: one per fact without its own picture, and one per index card without one
    const slots = [];
    if (!opts.noAuto) boxes.forEach((b, i) => {
      const L0 = listedAt(b, i);
      if (L0) L0.tree.items.forEach((it, c) => { if (!((L0.st.thumbs || {})[c])) slots.push({ key: `${topicKey}|f${i}|c${c}`, text: [it.text, ...factLines(it)].join(" ") }); });
    });
    const picked = Object.assign({}, fpicked, slots.length ? assignStickers(topicKey, slots, m.field, Object.values(fpicked).concat(((cu.stickers || {})[0] || {}).sticker || [])) : {});
    const autoStk = {}; boxes.forEach((b, i) => { autoStk[i] = picked[`${topicKey}|f${i}`] || ""; });
    AUTO_CARD = (i, c) => picked[`${topicKey}|f${i}|c${c}`] || "";
    if (scr) boxes.map((b, i) => [b, i]).sort((p, q) => p[0].y1 - q[0].y1).forEach(([b, i]) => {
      const L0 = listedAt(b, i); if (!L0) return;
      const CL = calloutLayout(b, composePhoto(b, L0.st, "list"), L0.st, L0.tree, false, opts.builder, i);
      const bottom = Math.max(CL.hub.y2, ...CL.nodes.map((n) => n.card.y2)) + 10, delta = bottom - b.y2;
      if (delta <= 0 && !(m.cards && delta < -12)) return;   // the starter map also gives back space its cards don't use
      boxes.forEach((o) => { if (o !== b && o.y1 >= b.y2 - 1) ["y1", "y2", "cy1", "cy2", "ay"].forEach((q) => { if (o[q] != null) o[q] += delta; }); });
      b.y2 += delta; H += delta;
    });
    const ang = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI;
    let g = "";
    const pictorialWide = boxes.some((b, i) => !!listedAt(b, i) && (scr || (b.x2 - b.x1) >= 520));
    if (!pictorialWide) {
      g += `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="${BAY}" stroke-width="4" stroke-linecap="round"/>`;
      g += `<circle cx="${x0}" cy="${y0}" r="5" fill="${BAY}"/><path d="M${x1} ${y1}l-14 1 6 9z" fill="${BAY}" transform="rotate(${ang + 135} ${x1} ${y1})" opacity="0"/>`;
      g += `<text x="${title.x}" y="${title.y}" transform="rotate(${ang} ${title.x} ${title.y})" font-size="${title.fs}" font-weight="700" fill="${BAY}">${esc(title.text)}</text>`;
    }
    boxes.forEach((b, i) => {
      const f = b.f, sv = SEV[f.sev], col = sv ? sv.c : TIDE;
      const st = (cu.stickers || {})[i];
      const tree0 = (st && st.shape === "photo" && st.src) ? capItems(st, f, b) : null;
      const listed0 = !!(tree0 && tree0.items.length >= 2 && (scr || (b.x2 - b.x1) >= 520));
      // branch from the slash to the fact (follows the fact when the learner moves it)
      if (!listed0) {
      const ex = Math.abs(b.ax - b.cx1) < Math.abs(b.ax - b.cx2) ? b.cx1 : b.cx2, ey = Math.min(Math.max(b.ay, b.cy1 + 6), b.cy2 - 6);
      g += `<path d="M${b.ax} ${b.ay}Q${(b.ax + ex) / 2} ${b.ay} ${ex} ${ey}" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round"/><circle cx="${b.ax}" cy="${b.ay}" r="3.2" fill="${col}"/>`;
      }
      g += `<g class="rfact${opts.sel === i ? " sel" : ""}" data-fi="${i}">`;
      // the draw-your-own space
      g += `<clipPath id="${uid}c${i}"><rect x="${b.x1}" y="${b.y1}" width="${b.x2 - b.x1}" height="${b.y2 - b.y1}" rx="12"/></clipPath>`;
      if (!(listed0 && land && !scr) && !m.cards) {
      g += `<rect class="rspace" x="${b.x1}" y="${b.y1}" width="${b.x2 - b.x1}" height="${b.y2 - b.y1}" rx="12" fill="${opts.builder ? "#fff" : "none"}" fill-opacity="${opts.builder ? ".01" : "0"}" stroke="${opts.sel === i ? BAY : "#A9B4BD"}" stroke-width="${opts.sel === i ? 2 : 1}" stroke-dasharray="4 4"/>`;
      }
      const ix = (b.cx1 - b.x1) * 0.45, iy = (b.cy1 - b.y1) * 0.4;
      const hr = [b.cx1 - ix, b.cy1 - iy, b.cx2 - b.cx1 + 2 * ix, b.cy2 - b.cy1 + 2 * iy];
      const tree = (st && st.shape === "photo" && st.src) ? capItems(st, f, b) : null;
      const listed = !!(tree && tree.items.length >= 2);
      if (st && st.shape === "photo" && st.src) {
        if (listed) g += calloutEl(b, st, st, tree, i, practice, opts.builder, opts.branch, !opts.screen);
        else {
          const ph = composePhoto(b, st, "cap");
          g += photoElAt(st, ph, uid + "c" + i);
          g += capEl(st, ph, (tree.items[0] && tree.items[0].text) || tree.label, i, practice);
        }
      } else {
        // the learner's sticker, or one pulled from the fact's words (Ken, Nov 25: a related sticker for every fact)
        const own = st && hasSticker(st.shape), id = own ? st.shape : autoStk[i];
        const sq = id && (!own && b.gph && isGraph(id) ? [b.cx1 + Math.max(0, (b.cx2 - b.cx1) - b.gph / isGraph(id)) / 2, b.cy2 + b.gpy, Math.min(b.cx2 - b.cx1, b.gph / isGraph(id)), b.gph] : stickerSpot(b, own ? clampScale(st.scale == null ? 0.8 : st.scale) : 0.8, Wd, isGraph(id)));
        const kv = sq && !practice && !isGraph(id) ? keyValue([f.label, ...(f.details || []).map((d) => d.text)].join(" ")) : "";
        if (sq) g += `<g class="${own ? "rsticked" : "rauto"}">${stickerArt(id, ...sq)}${valueBadge(...sq, kv)}</g>`;
      }
      // the fact itself — hidden when a photo is composing the words (Ken, t198u: not a stamp over the card)
      if (!(st && st.shape === "photo" && st.src)) {
      const cw = b.cx2 - b.cx1, ch = b.cy2 - b.cy1;
      g += `<rect x="${b.cx1}" y="${b.cy1}" width="${cw}" height="${ch}" rx="7" fill="${col}" fill-opacity=".07" stroke="${col}" stroke-width="${sv ? sv.w : 1.2}"${sv && sv.dash ? ` stroke-dasharray="${sv.dash}"` : ""}/>`;
      if (sv && sv.dbl) g += `<rect x="${b.cx1 + 3}" y="${b.cy1 + 3}" width="${cw - 6}" height="${ch - 6}" rx="5" fill="none" stroke="${col}" stroke-width="1"/>`;
      let ty = b.cy1 + b.pad + b.lfs * 0.85;
      if (practice && opts.hideNames) { g += `<line x1="${b.cx1 + b.pad}" y1="${ty + 2}" x2="${b.cx1 + Math.min(cw - b.pad, b.pad + 110)}" y2="${ty + 2}" stroke="#7A8791" stroke-width=".9"/>`; ty += b.lfs * 1.25; }
      else b.label.forEach((ln) => { g += `<text x="${b.cx1 + b.pad}" y="${ty}" font-size="${b.lfs}" font-weight="700" fill="#14222C">${esc(ln)}</text>`; ty += b.lfs * 1.2; });
      if (f.hit) g += `<text x="${b.cx2 - 4}" y="${b.cy1 - 4}" text-anchor="end" font-size="${9 * s}" font-weight="700" fill="${BAY}">★ You asked about this</text>`;
      b.lines.forEach((ln) => {
        if (practice) g += `<line x1="${b.cx1 + b.pad + (ln.indent || 0)}" y1="${ty + 2}" x2="${b.cx2 - b.pad}" y2="${ty + 2}" stroke="#7A8791" stroke-width=".9"/>` + (ln.head ? `<text x="${b.cx1 + b.pad}" y="${ty}" font-size="${b.dfs * 0.86}" font-weight="700" fill="#5A6670">${esc(ln.head)}</text>` : "");
        else g += `<text x="${b.cx1 + b.pad}" y="${ty}" font-size="${b.dfs}" fill="#24313E">${ln.head ? `<tspan font-weight="700" fill="#5A6670" font-size="${b.dfs * 0.86}">${esc(ln.head)} </tspan>` : ""}${esc(ln.text)}</text>`;
        ty += b.dfs * 1.28;
      });
      } else if (f.hit) g += `<text x="${b.x2 - 4}" y="${b.y1 - 4}" text-anchor="end" font-size="${9 * s}" font-weight="700" fill="${BAY}">★ You asked about this</text>`;
      if (b.pic) { let py = b.cy2 + 7 * s + b.pfs * 0.85; const n = f.picMine ? "My picture:" : "Picture idea:";
        b.pic.forEach((ln, j) => { g += `<text class="rpic" x="${b.x1 + b.pad + 4 * s}" y="${py}" font-size="${b.pfs}" font-style="italic" fill="#4E5B66">${j === 0 ? `<tspan font-weight="700" font-style="normal" fill="${f.picMine ? BAY : "#5A6670"}">${esc(n)}</tspan>${esc(ln.slice(n.length))}` : esc(ln)}</text>`; py += b.pfs * 1.22; }); }
      const tip = b.pic || st || opts.custom ? "" : opts.ideas ? `Idea: ${f.idea.tip}. Or draw your own.` : "✎ Draw something that reminds you of this";
      if (tip) g += `<text class="rtip" x="${b.x2 - 8}" y="${b.y2 - 6}" text-anchor="end" font-size="${7.2 * Math.min(Math.max(s, .8), 1.2)}" font-style="italic" fill="#8A959E">${esc(tip)}</text>`;
      g += `</g>`;
    });
    // the learner's own drawing, on top
    (cu.ink || []).forEach((k) => { g += inkPath(k); });
    // footer
    let fy = H - foot + 14, ft = `<line x1="${M}" y1="${H - foot}" x2="${Wd - M}" y2="${H - foot}" stroke="#D5DDE2"/>`;
    rows.forEach((r) => {
      if (r.links) {
        let lx = M + 70, ly = fy;
        ft += `<text x="${M}" y="${fy + 4}" font-size="8.5" font-weight="700" fill="${BAY}">Connects to</text>`;
        links.forEach((t) => {
          let tw = Math.min(textW(t, 8) + 14, Wd - M - (M + 70));
          if (lx + tw > Wd - M) { if (!scr || ly > fy) return; lx = M + 70; ly += 20; }
          if (!m.cards) ft += `<path d="M${x0} ${y0}Q${(x0 + lx + tw / 2) / 2} ${(y0 + ly) / 2 - 8} ${lx + tw / 2} ${ly - 6}" fill="none" stroke="#7A8791" stroke-width="1" stroke-dasharray="1.5 3"/>`;
          ft += `<rect x="${lx}" y="${ly - 6}" width="${tw}" height="14" rx="7" fill="#fff" stroke="#7A8791" stroke-dasharray="1.5 2.5"/><text x="${lx + 7}" y="${ly + 4}" font-size="8" fill="#24313E">${esc(clip(t, tw - 12, 8))}</text>`;
          lx += tw + 6;
        });
      } else if (r.song) {
        ft += `<text x="${M}" y="${fy + 4}" font-size="9" font-weight="700" fill="${BAY}">♪ ${m.song.lines.some((l) => l.mine) ? "My jingle" : "Our starter jingle"}<tspan font-weight="400" fill="#5A6670">  ·  tune: ${esc(m.song.tuneName)}${practice ? "  ·  sing it and fill in the rest" : ""}</tspan></text>`;
        r.song.forEach((col, c) => { let yy = fy + 18; col.forEach((ls) => { ls.forEach((l) => { ft += `<text x="${M + c * (r.cw + 14)}" y="${yy}" font-size="8.4" fill="#24313E">${esc(l)}</text>`; yy += 10.6; }); yy += 1.5; }); });
      } else if (r.key) {
        let lx = M + 30;
        ft += `<text x="${M}" y="${fy + 4}" font-size="8" font-weight="700" fill="#5A6670">Key</text>`;
        Object.keys(SEV).filter((x) => used.includes(x)).forEach((x) => { const v = SEV[x];
          ft += `<rect x="${lx}" y="${fy - 5}" width="22" height="11" rx="3" fill="${v.c}" fill-opacity=".08" stroke="${v.c}" stroke-width="${v.w}"${v.dash ? ` stroke-dasharray="${v.dash}"` : ""}/><text x="${lx + 27}" y="${fy + 4}" font-size="8" fill="#24313E">${v.name}</text>`; lx += 34 + textW(v.name, 8); });
      } else {
        const t = lines(M, fy + 4, r.text, r.fs, FW, `fill="${r.fill}"`, r.fs * (r.fs === 9 ? 1.28 : 1.3));
        ft += t.svg.replace(/>(⚠ Remember:|How to use:|Why it works:)/, (x, w) => `><tspan font-weight="700"${w[0] === "⚠" ? ' fill="#8A2E08"' : ""}>${w}</tspan>`);
        if (r.line) ft += `<line x1="${M + 70}" y1="${fy + 6}" x2="${Wd - M}" y2="${fy + 6}" stroke="#7A8791" stroke-width=".9"/>`;
      }
      fy += r.h;
    });
    out.facts = boxes;
    LAST = { boxes, H, s, Wd };
    return `<svg class="recallsvg${scr ? " screen" : ""}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${Wd} ${H}" width="${Wd}" height="${H}" font-family="Helvetica, Arial, sans-serif" role="img" aria-label="Recall map: ${esc(m.title)}">` +
      `<rect width="${Wd}" height="${H}" fill="#fff"/>${hd}${g}${ft}</svg>`;
  }
  let SVGN = 0, LAST = null;
  // The jingle as printed lines: "1. Boyle says squeeze it, pressure's up". Practice keeps the first two words as a cue.
  const short = (lab) => String(lab).replace(/\s*\(.*$/, "").replace(/'s\b/g, "").replace(/\b(law|principle|score)\b/gi, "").replace(/\s+/g, " ").trim();
  function songItems(m, practice) {
    let n = 0;
    return m.song.lines.filter((l) => l.text).map((l) => {
      const s = short(l.label), cue = l.key[0] === "r" || !s || l.text.toLowerCase().includes(s.toLowerCase().split(/[\s-]/)[0]) ? "" : `  (${s})`;
      const t = practice ? l.text.split(/\s+/).slice(0, 2).join(" ") + " ______________" : l.text;
      return (l.key[0] === "r" ? "♪ " : `${++n}. `) + t + cue;
    });
  }
  const inkPath = (k) => k.pts && k.pts.length > 1 ? `<path class="rink" d="M${k.pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L")}" fill="none" stroke="${k.c}" stroke-width="${k.w || 2.6}" stroke-linecap="round" stroke-linejoin="round"/>` : "";
  const clip = (t, maxW, fs) => { t = String(t); if (textW(t, fs) <= maxW) return t; while (t.length > 4 && textW(t + "…", fs) > maxW) t = t.slice(0, -1); return t.trimEnd() + "…"; };

  // Place each fact's space along the slash, alternating sides where it fits; null if it doesn't fit at this scale.
  function layout(m, opts, s, Wd, H, M, head, foot) {
    const top = head + 6, bot = H - foot - 10;
    const x0 = M + 14, y0 = bot, x1 = Wd - M - 8, y1 = top + 4;
    const slashX = (y) => x0 + (x1 - x0) * (y0 - y) / (y0 - y1);
    const lfs = 11.5 * s, dfs = 9.6 * s, pfs = 8.2 * s, pad = 6 * s, spX = 22 * s, spT = 24 * s, spB = 20 * Math.max(s, .8);   // roomy spaces to draw in
    const practice = opts.mode === "practice";
    const title = { text: m.title, fs: 14 * Math.min(Math.max(s, .8), 1.15) };
    const titleLen = textW(m.title, title.fs, true);
    const along = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / along, uy = (y1 - y0) / along;
    title.x = x0 + ux * 16 + uy * 7; title.y = y0 + uy * 16 - ux * 7;   // start near the bottom, just above the line
    const obst = [];
    for (let d = 10; d < titleLen + 20; d += 14) { const px = x0 + ux * d, py = y0 + uy * d; obst.push([px - 9, py - title.fs - 8, px + 9, py + 2]); }
    const placed = [];
    const hits = (r, ignoreObst) => r[0] < M || r[2] > Wd - M || r[1] < top || r[3] > bot || (ignoreObst ? placed : placed.concat(obst)).some((o) => r[0] < o[2] + 5 && r[2] > o[0] - 5 && r[1] < o[3] + 5 && r[3] > o[1] - 5);
    const boxes = [];
    let t = 0.02, pref = "down";
    const stMap = (opts.custom && opts.custom.stickers) || {};
    for (const f of m.facts) {
      let done = null;
      const stF = stMap[boxes.length];
      const treeF = (stF && stF.shape === "photo" && stF.src) ? capItems(stF, f, { label: [f.label], lines: (f.details || []).map((d) => ({ head: d.head, text: d.text })) }) : null;
      const listedF = !!(treeF && treeF.items.length >= 2);
      const baseWs = [258, 228, 290, 198, 172];
      const wideW = Math.min(Wd - 2 * M, Wd >= 900 ? Wd - 2 * M : (opts.screen ? 372 : 380));
      const widths = listedF ? [wideW, 340, 300].concat(baseWs) : baseWs;
      const sizes = widths.map((bw) => {
        const inner = bw - 2 * spX - 2 * pad;
        const label = wrap(f.label, inner, lfs, true);
        const lines = [];
        f.details.forEach((d) => {
          const hw = d.head ? textW(d.head + " ", dfs * 0.86, true) : 0;
          const wl = wrap(d.text, inner - hw * 0.0, dfs);
          const first = wrap((d.head ? d.head + " " : "") + d.text, inner, dfs);
          first.forEach((ln, i) => lines.push({ head: i === 0 ? d.head : "", text: i === 0 && d.head ? ln.slice(d.head.length + 1) : ln, w: textW(ln, dfs), indent: i === 0 && d.head ? hw : 0 }));
          void wl;
        });
        const ch = pad * 2 + label.length * lfs * 1.2 + lines.length * dfs * 1.28 + (practice ? 2 : 0);
        // the picture idea (ours or the learner's) sits under the fact, inside the drawing space
        let pic = f.pic && !opts.noPics ? wrap((f.picMine ? "My picture: " : "Picture idea: ") + f.pic, bw - 2 * pad - 8 * s, pfs) : null;
        // the builder keeps a fixed 3-line strip, so typing a new picture idea never moves the learner's drawing
        if (opts.builder) { if (pic && pic.length > 3) { pic = pic.slice(0, 3); pic[2] = clip(pic[2] + " …", bw - 2 * pad - 8 * s, pfs); } }
        let sb = opts.builder ? 7 * s + 3 * pfs * 1.22 + 5 * s : pic ? 7 * s + pic.length * pfs * 1.22 + 5 * s : spB;
        const gar = !listedF && opts._gAR && opts._gAR[boxes.length];
        let gph = 0, gpy = 0;
        if (gar) { gpy = (pic || opts.builder ? sb - 5 * s : 0) + 6 * s; gph = Math.min((bw - 2 * spX) * gar, 130 * s); sb = gpy + gph + 18 * s; }
        if (listedF) {
          const n = treeF.items.length, stacked = bw < 520;
          const fillH = Math.max(0, bot - top - 8);
          const hubD = stacked ? Math.min(160, bw - 16) : Math.min(360, Math.max(220, bw * 0.34));
          let h = stacked ? hubD + 18 + n * 108 + 16 : Math.max(hubD + 24, Math.ceil(n / 2) * 150 + 28);
          if (!stacked && m.facts.length === 1 && fillH > h) h = fillH;
          else h = h + (sb || 0);
          return { bw, label, lines, ch, pic, sb, h };
        }
        return { bw, label, lines, ch, pic, sb, h: ch + spT + sb, gph, gpy };
      });
      if (listedF && !done) {
        const z = sizes[0];
        for (let y = top; y + z.h <= bot + 0.5 && !done; y += 6) {
          const r = [M, y, M + z.bw, y + z.h];
          if (!hits(r, z.bw >= 520)) { done = { r, z, side: "down", ax: slashX(y + z.h / 2), ay: y + z.h / 2, tt: t }; break; }
        }
      }
      for (let tt = t; tt <= 1.0001 && !done; tt += 0.006) {
        const ax = x0 + (x1 - x0) * tt, ay = y0 + (y1 - y0) * tt;
        for (const side of [pref, pref === "up" ? "down" : "up"]) {
          for (const z of sizes) {
            for (const fr of [0.5, 0.25, 0.75]) {   // where the branch meets the space: middle, upper or lower part
              let r;
              if (side === "up") { const yb = ay + z.h * (1 - fr), xr = slashX(yb) - 10 * s; r = [xr - z.bw, yb - z.h, xr, yb]; if (xr > ax) continue; }
              else { const yt = ay - z.h * fr, xl = slashX(yt) + 10 * s; r = [xl, yt, xl + z.bw, yt + z.h]; }
              if (!hits(r)) { done = { r, z, side, ax, ay, tt }; break; }
            }
            if (done) break;
          }
          if (done) break;
        }
      }
      if (!done) return null;
      const { r, z, side, ax, ay } = done;
      placed.push(r);
      const cx1 = r[0] + spX, cx2 = r[2] - spX, cy1 = r[1] + spT, cy2 = cy1 + z.ch;
      boxes.push({ f, side, ax, ay: Math.min(Math.max(ay, cy1 + 4), cy2 - 4), x1: r[0], y1: r[1], x2: r[2], y2: r[3], cx1, cx2, cy1, cy2, label: z.label, lines: z.lines, pic: z.pic, pfs, lfs, dfs, pad, gph: z.gph, gpy: z.gpy });
      // keep the branch level: the branch leaves the slash at the fact's height
      const b = boxes[boxes.length - 1]; b.ax = slashX(b.ay);
      t = done.tt; pref = side === "up" ? "down" : "up";
    }
    return { boxes, x0, y0, x1, y1, s, title, rects: placed };
  }

  // ---------- Traditional sheet (HTML) ----------
  function traditionalHtml(m, opts) {
    opts = opts || {};
    const practice = opts.mode === "practice";
    const card = W.SCALES[m.k];
    let t = 0;
    const body = String(card.body || "").replace(/<table[\s\S]*?<\/table>/gi, (tb) => {
      const ti = t++; let r = 0;
      return tb.replace(/<table[^>]*>/i, '<table class="tsheettbl">').replace(/<tbody[\s\S]*?<\/tbody>/i, (tbody) => tbody.replace(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi, (row, inner) => {
        const ri = r++, f = m.facts.find((x) => x.table === ti && x.row === ri);
        let c = 0;
        const cells = practice ? inner.replace(/<td\b[^>]*>([\s\S]*?)<\/td>/gi, (td, v) => (c++ === 0 ? td : '<td class="blank">&nbsp;</td>')) : inner;
        return `<tr${f && f.hit && !practice ? ' class="hit"' : ""}>${cells}</tr>`;
      }));
    });
    const long = m.facts.length > 7 || plain(card.body).length > 1400;   // long cards: tighter print so it stays on one page
    return `<article class="tsheet${long ? " long" : ""}">
      <header><img src="${LOGO}" alt="" width="26" height="26"><div><b>${esc(APP)} · Otter Bay</b><span>Study sheet${practice ? " (practice: fill in the blanks)" : ""}</span></div><p>Name ____________________<br>Date __________</p></header>
      <h1>${esc(m.title)}</h1>${m.intro ? `<p class="ts-intro">${esc(m.intro)}</p>` : ""}
      ${m.answer && !practice ? `<p class="ts-ans"><b>You asked:</b> “${esc(m.q)}”<br><b>Answer:</b> ${esc(m.answer)}</p>` : ""}
      <div class="tbody">${body}</div>
      ${topicMeta(m).note ? `<p class="ts-note"><b>Remember:</b> ${practice ? '<span class="ts-blankline"></span>' : esc(topicMeta(m).note)}</p>` : ""}
      ${topicMeta(m).abbrs.length ? `<p class="ts-abbrs"><b>Abbreviations:</b> ${topicMeta(m).abbrs.map((a) => `${esc(a.abbr)} = ${esc(a.meaning)}`).join("; ")}</p>` : ""}
      ${m.facts.some((f) => f.picMine) ? `<div class="ts-pics"><b>My pictures</b><ul>${m.facts.filter((f) => f.pic).map((f) => `<li><b>${esc(f.label)}:</b> ${esc(f.pic)}</li>`).join("")}</ul></div>` : ""}
      ${m.song && m.song.print ? `<div class="ts-song"><b>♪ ${m.song.lines.some((l) => l.mine) ? "My jingle" : "Our starter jingle"}</b> <span>(tune: ${esc(m.song.tuneName)})</span><ol>${songItems(m, practice).map((t) => `<li>${esc(t)}</li>`).join("")}</ol></div>` : ""}
      <div class="ts-mynotes"><b>My notes</b>${"<span></span>".repeat(long || (m.song && m.song.print) ? 2 : 5)}</div>
      <footer>Source: ${esc(topicMeta(m).src || "Otter Bay")}. Written by Otter Bay in our own words. For learning only; follow your facility's protocols.</footer>
    </article>`;
  }


  // Image identity for uniqueness checks on a recall map and on print pages (Ken, t222u).
  function hashStr(s) {
    let h = 5381;
    const t = String(s || "");
    for (let i = 0; i < t.length; i++) h = ((h << 5) + h) + t.charCodeAt(i) | 0;
    return (h >>> 0).toString(36);
  }
  function imageId(st) {
    if (!st) return "";
    if (st.src) return "src:" + hashStr(st.src);
    if (st.shape && st.shape !== "photo") return "shape:" + st.shape;
    return "";
  }
  function collectImageIds(pg) {
    const out = [];
    if (!pg) return out;
    const add = (st, where) => { const id = imageId(st); if (id) out.push({ id, where, sample: !!(st && st.shape && st.shape !== "photo" && !st.src) }); };
    add(pg.hub, "topic");
    Object.keys(pg.stickers || {}).forEach((k) => {
      const st = pg.stickers[k];
      add(st, "fact:" + k);
      Object.keys((st && st.thumbs) || {}).forEach((t) => add(st.thumbs[t], "fact:" + k + ":" + t));
    });
    return out;
  }
  function printPageKey() { return "obPrintPages:" + EXAM; }
  function findImageConflicts(ids, others) {
    const have = {};
    (others || []).forEach((o) => { (o.ids || []).forEach((id) => { if (!have[id]) have[id] = o; }); });
    const hits = [];
    (ids || []).forEach((it) => {
      const id = it.id || it;
      const owner = have[id];
      if (owner) hits.push({ id, where: it.where, other: owner.label || owner.title || "another page", sample: !!(it.sample || owner.sample) });
    });
    return hits;
  }

  function API() { return { keyValue, suggestStickers, hubSuggestions, scores: stickerScores, resetPicks: () => { PICKS = {}; }, TUNES, beats, songItems, model, recallSvg, traditionalHtml, layout, severity, idea, tables, SHAPES, SEV, WHY, plain, last: () => LAST, photoBox, clampScale, keywords, capItems, capLayout, calloutLayout, composePhoto, thumbBox, clampThumb, photoCover, photoFitMode, FACT_FS, FACT_FS_SUB, imageId, collectImageIds, printPageKey, findImageConflicts, topicMeta, cardGeom, tabRect, elbowLeader, HUB_TAB, CARD_TAB }; }

  // ======================= Screen: the study-sheet page inside Ask (browser only) =======================
  if (typeof document === "undefined") { W.OB_STUDY = API(); return; }
  const STYLE_KEY = "obStudyStyle", PAGE_KEY = (k) => `obStudyPage:${EXAM}:${k}`;
  const ld = (key, d) => { try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? d : v; } catch (e) { return d; } };
  const sv = (key, v) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} };
  const pref = ld(STYLE_KEY, {});
  const ST = { k: null, q: "", answer: "", related: [], hit: null, style: pref.style || "map", map: pref.map || "hand", mode: "filled", ideas: false,
    tool: "draw", color: "#C62828", sel: null, zoom: false, celebrate: false, msg: "", panel: "", songPop: false, from: "ask", fromK: "", focus: null, branch: null, focusBranch: null };
  const savePref = () => sv(STYLE_KEY, { style: ST.style, map: ST.map });
  const getPage = (k) => ld(PAGE_KEY(k), null);
  const blankPage = () => ({ layout: "cards", ink: [], stickers: {}, moves: {}, hist: [], done: false, at: Date.now(), pics: {}, song: { tune: "", lines: {}, print: false, asked: false } });
  // older saved pages (before picture ideas and songs) get the new parts
  const fixPage = (p) => { if (!p) return p; p.layout = pageLayout(p); p.pics = p.pics || {}; p.song = Object.assign({ tune: "", lines: {}, print: false, asked: false }, p.song || {}); return p; };
  let PG = null;
  const savePage = () => { if (!ST.k || !PG) return; PG.at = Date.now(); PG.title = (W.SCALES[ST.k] || {}).title; sv(PAGE_KEY(ST.k), PG); };
  const hasPage = (k) => { const p = getPage(k); return !!(p && ((p.ink || []).length || Object.keys(p.stickers || {}).length || Object.keys(p.moves || {}).length ||
    Object.values(p.pics || {}).some((t) => t && t.trim()) || Object.values((p.song || {}).lines || {}).some((t) => t && t.trim()))); };
  function listPages() {
    const out = [];
    try { for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i); if (key && key.startsWith(`obStudyPage:${EXAM}:`)) { const k = key.split(":")[2]; if (W.SCALES[k] && hasPage(k)) out.push({ k, title: W.SCALES[k].title, at: (getPage(k) || {}).at || 0, done: !!(getPage(k) || {}).done }); } } } catch (e) {}
    return out.sort((a, b) => b.at - a.at);
  }
  const COLORS = [["#C62828", "Red"], ["#E65100", "Orange"], ["#B08900", "Gold"], ["#2E7D32", "Green"], ["#1565C0", "Blue"], ["#6A1B9A", "Purple"], ["#14222C", "Black"]];
  const stkBtn = (id) => `<button type="button" data-act="ststicker" data-s="${id}" aria-label="${esc(ART[id][1])}"><img src="${esc(artSrc(id))}" alt="" width="44" height="44" loading="lazy"><span>${esc(ART[id][1])}</span></button>`;
  // stickers related to the fact or card being decorated (the words the learner sees on it)
  function stkSuggest() {
    try {
      const m = mdl(), f = ST.sel != null ? m.facts[ST.sel] : null; if (!f) return STK.slice(0, 8).map((t) => t.id);
      let text = [f.label, ...(f.details || []).map((d) => d.text)].join(" ");
      if (ST.branch != null) { const it = (capItems((PG.stickers || {})[ST.sel], f, ((LAST && LAST.boxes) || [])[ST.sel] || {}).items || [])[ST.branch]; if (it) text = [it.text, ...factLines(it)].join(" "); }
      const sc = stickerScores(text), graphs = Object.keys(sc).filter((id) => GRAPH[id] && sc[id] >= 3);
      if (graphs.length) return graphs.sort((a, b) => sc[b] - sc[a]).slice(0, 8);   // a graph answer: only graph close-ups
      const ids = suggestStickers(text, 8);
      return ids.length ? ids : STK.slice(0, 8).map((t) => t.id);
    } catch (e) { return STK.slice(0, 8).map((t) => t.id); }
  }
  const STICKERS = [["syringe", "Syringe"], ["kettle", "Kettle"], ["gauge", "Gauge"], ["layers", "Layers"], ["bottle", "Bottle"], ["tube", "Tube"], ["bubble", "Bubble"],
    ["wing", "Wing"], ["hourglass", "Venturi tube"], ["runner", "Runner"], ["lungs", "Lungs"], ["heart", "Heart"], ["drop", "Drop"], ["brain", "Cloud"], ["moon", "Moon"], ["clock", "Clock"], ["thermo", "Thermometer"], ["shield", "Shield"]];
  const PROMPTS = ["What does “{f}” remind you of? Draw it around the box.", "Picture “{f}” at the bedside. What would you see?",
    "Odd and funny sticks best. What silly picture fits “{f}”?", "If “{f}” were an object, what would it be?"];
  const mdl = (k) => {
    const m = model(k || ST.k, { hit: ST.hit, q: ST.q, answer: ST.answer, related: ST.related, mine: PG, layout: pageLayout(PG) });
    // the topic picture keeps the card list with it, so the builder's card tools see every card
    if (m && m.cards && PG && PG.stickers && PG.stickers[0] && !PG.stickers[0].cap) PG.stickers[0].cap = m.capDefault;
    return m;
  };
  function open(k, o) {
    o = o || {};
    ST.k = k; ST.q = o.q || ""; ST.answer = o.answer || ""; ST.related = o.related || []; ST.hit = o.hit || null;
    ST.sel = null; ST.mode = "filled"; ST.ideas = false; ST.celebrate = false; ST.msg = ""; ST.zoom = false; ST.panel = o.panel || ""; ST.songPop = false;
    ST.from = o.from || "ask"; ST.fromK = o.fromK || k; ST.focus = null; ST.branch = null; ST.focusBranch = null; ST.ppNote = null;
    ST.replace = null; ST.slotDraw = null; ST.focusPaste = false;
    if (o.build) { ST.style = "map"; ST.map = "build"; }
    PG = fixPage(getPage(k)) || blankPage();
  }
  // Which facts have a picture yet (a sticker, or a line drawn in or across their space)
  function decorated(m) {
    if (m.cards) { const st0 = (PG.stickers || {})[0]; return [!!(st0 && ((st0.shape === "photo" && st0.src && !st0.placeholder) || hasSticker(st0.shape)))]; }
    recallSvg(m, { custom: PG, builder: true, screen: true, noSong: true });
    const bx = (LAST && LAST.boxes) || [];
    return bx.map((b, i) => !!(PG.stickers[i]) || PG.ink.some((k) => k.pts.some((p) => p[0] >= b.x1 - 6 && p[0] <= b.x2 + 6 && p[1] >= b.y1 - 6 && p[1] <= b.y2 + 6)));
  }
  const seg = (act, cur, items) => `<div class="stseg" role="group">${items.map(([v, t]) => `<button type="button" data-act="${act}" data-v="${v}" aria-pressed="${cur === v}" class="${cur === v ? "on" : ""}">${t}</button>`).join("")}</div>`;
  function whyBox() {
    return `<details class="stwhy"><summary>Why this works</summary><p>${esc(WHY.text)}</p><ol>${WHY.refs.map(([t, u]) => `<li>${esc(t)} <a href="${u}" target="_blank" rel="noopener">${u.replace("https://", "")}</a></li>`).join("")}</ol></details>`;
  }
  function screen() {
    const m = mdl(); if (!m) return "";
    const backLabel = ST.from === "bin" ? "Back to Study List" : ST.from === "settings" ? "Back to Settings" : "Back to the answer";
    let h = `<section class="stsheet" id="askRes"><div class="sthead"><button type="button" class="stback" data-act="stback">‹ ${backLabel}</button>
      <h2>Study sheet</h2><p class="stsub">Print the topic you asked about: <b>${esc(m.title)}</b></p>
      ${window.OB_BIN && OB_BIN.flag && ST.k ? `<div class="binflags starcade">${OB_BIN.flag(ST.k)}</div>` : ""}</div>
      <div class="stpick"><p class="asklabel">Style</p>${seg("ststyle", ST.style, [["map", "Recall map"], ["trad", "Traditional"]])}`;
    if (ST.style === "map") h += seg("stmap", ST.map, [["hand", "Draw on paper"], ["build", "Build it here"]]);
    h += whyBox() + `</div>`;
    if (ST.style === "trad" || ST.map === "hand") {
      h += `<div class="stopts">${seg("stmode", ST.mode, [["filled", "Filled"], ["practice", "Practice (blanks)"]])}
        ${ST.style === "map" && !m.cards ? `<label class="stchk"><input type="checkbox" data-act="stideas" ${ST.ideas ? "checked" : ""}> Show ideas (a starter picture)</label>` : ""}
        <p class="sthelp">${ST.mode === "practice" ? "Fill it in from memory, then switch to Filled and check. Add what you missed in another color." : ST.style === "map" ? "Each fact has an empty space. Draw your own picture around it after you print." : "A plain page with the full table, ready to print."}</p></div>`;
      h += `<button type="button" class="stprint" data-act="stprint">${PRINTICON}<span>Print this sheet</span></button>
      <button type="button" class="staddprint" data-act="staddprint">Add to print page</button>
      <button type="button" class="stprinttraybtn" data-act="stprinttray">Print pages</button>`;
      h += memPanels(m);
      h += `<div class="stpaper ${ST.zoom ? "zoom" : ""}">${paperHtml(m)}</div>
        <button type="button" class="stzoom" data-act="stzoom">${ST.zoom ? "Fit to screen" : "Zoom in"}</button>`;
    } else h += builder(m);
    if (ST.panel === "printpages") h += printPagesHtml();
    return h + `</section>`;
  }
  // What the paper on screen shows (also redrawn in place while the learner types, so the keyboard stays up)
  function paperHtml(m) {
    if (ST.style === "map" && ST.map === "build") return recallSvg(m, { custom: PG, builder: true, screen: true, noSong: true, sel: ST.tool === "sticker" ? ST.sel : null, branch: ST.branch }).replace('class="recallsvg', 'class="recallsvg builder');
    return ST.style === "map" ? recallSvg(m, { mode: ST.mode, ideas: ST.ideas, screen: true }) : traditionalHtml(m.allFacts ? Object.assign({}, m, { facts: m.allFacts }) : m, { mode: ST.mode });
  }
  function refreshPaper() { const el = document.querySelector(".stsheet .stpaper"); if (el && ST.k) el.innerHTML = paperHtml(mdl()); }
  // Picture ideas (ours, or the learner's own words) and the optional song. (Ken, Nov 23: "Do it for them, but let them type in a
  // different image description. Same with the jingle. Make one for them, but allow them to put in their own words.")
  function memPanels(m) {
    const FF = m.allFacts || m.facts, anyDef = FF.some((f) => f.picDefault), mineN = FF.filter((f) => f.picMine).length;
    let h = `<div class="stmem"><button type="button" class="stmembtn${ST.panel === "pics" ? " on" : ""}" data-act="stpanel" data-v="pics" aria-expanded="${ST.panel === "pics"}">
      <span class="stmemic" aria-hidden="true">✎</span><span><b>Picture ideas</b><small>${anyDef ? (mineN ? `${mineN} in your own words` : "We wrote one for each fact. Change any to your own.") : "Describe your own picture for each fact."}</small></span><i aria-hidden="true">${ST.panel === "pics" ? "▴" : "▾"}</i></button>`;
    if (ST.panel === "pics") {
      h += `<div class="stpanel"><p class="sthelp">${anyDef ? "Here's a picture for each fact to get you started. Type your own words to make it yours: yours goes on the sheet. Your own picture sticks best." : "Write what you'll draw for each fact. It goes on the sheet under the fact."}</p>`;
      FF.forEach((f, i) => { h += `<div class="stpicrow"><label for="stpic${i}"><b>${esc(f.label)}</b><span class="sttag ${f.picMine ? "mine" : ""}" data-tag="${i}">${f.picMine ? "Yours" : f.picDefault ? "Suggested" : "Empty"}</span></label>
        <textarea id="stpic${i}" data-stpic="${i}" rows="${Math.max(3, Math.ceil((f.pic || f.picDefault || "").length / 40) + 1)}" placeholder="${esc(f.picDefault ? f.picDefault : "What will you draw for “" + f.label + "”?")}">${esc(f.pic)}</textarea>
        <button type="button" class="streset" data-act="stpicreset" data-i="${i}" ${f.picMine ? "" : "hidden"}>↺ ${f.picDefault ? "Back to our suggestion" : "Clear"}</button></div>`; });
      h += `</div>`;
    }
    const sg = m.song, mineL = sg.lines.filter((l) => l.mine).length;
    h += `<button type="button" class="stmembtn song${ST.panel === "song" ? " on" : ""}" data-act="stpanel" data-v="song" aria-expanded="${ST.panel === "song"}">
      <span class="stmemic" aria-hidden="true">♪</span><span><b>Make it a song</b><small>Optional${sg.hasDefault ? ` · ${mineL ? mineL + " lines in your words" : "starter jingle to " + esc(TUNES[sg.suggested] ? TUNES[sg.suggested].name : sg.tuneName)}` : ""}${sg.print ? " · on your printout" : ""}</small></span><i aria-hidden="true">${ST.panel === "song" ? "▴" : "▾"}</i></button>`;
    if (ST.panel === "song") {
      const T = TUNES[sg.tune];
      h += `<div class="stpanel stsong"><p class="sthelp">${sg.hasDefault ? "We wrote a starter jingle: one line for each fact. Sing it as is, or change any line to your own words." : "Pick a tune you know and write one short line for each fact."} Use a tune you already know well; a new tune makes it harder.</p>
        <p class="asklabel">Tune</p><div class="sttunes">${Object.entries(TUNES).map(([v, t]) => `<button type="button" data-act="sttune" data-v="${v}" aria-pressed="${sg.tune === v}" class="${sg.tune === v ? "on" : ""}">${esc(t.name)}${v === sg.suggested ? "<small>our pick</small>" : ""}</button>`).join("")}</div>
        <p class="stmeter"><span>Each line: about <b>${T.beats} beats</b>, like “${esc(T.meter)}”.</span> <button type="button" class="stplay" data-act="stplay">▶ Hear the tune</button></p>`;
      sg.lines.forEach((l) => { const n = beats(l.text); h += `<div class="stlyric"><label for="stly${l.key}"><b>${esc(l.label)}</b><span class="sttag ${l.mine ? "mine" : ""}" data-tag="l${l.key}">${l.mine ? "Yours" : l.def ? "Suggested" : "Empty"}</span><span class="stbeats ${n === T.beats ? "ok" : ""}" data-beats="${l.key}">${l.text ? n + " beats" : ""}</span></label>
        <input id="stly${l.key}" type="text" data-stlyric="${l.key}" value="${esc(l.text)}" placeholder="${esc(l.def || "Your line for “" + l.label + "”")}" autocomplete="off">
        <button type="button" class="streset" data-act="stlyreset" data-k="${l.key}" ${l.mine ? "" : "hidden"}>↺ ${l.def ? "Back to our line" : "Clear"}</button></div>`; });
      h += `<label class="stchk"><input type="checkbox" data-act="stsongprint" ${sg.print ? "checked" : ""}> Put my song on the printout</label>
        ${mineL ? `<button type="button" class="streset" data-act="stlyresetall">↺ Use our whole jingle again</button>` : ""}
        <p class="sthelp">Sing it out loud three times. Later, look only at your pictures and sing the line that goes with each one.</p></div>`;
    }
    return h + `</div>`;
  }

  // Size slider/buttons for the selected photo or shape (Ken, t193u).
  function sizeRow() {
    const st = ST.sel != null ? (PG.stickers || {})[ST.sel] : null; if (!st) return "";
    if (ST.branch != null) {
      const th = (st.thumbs || {})[ST.branch]; if (!th) return "";
      const sc = Math.round(clampThumb(th.scale) * 100);
      return `<div class="stsize"><span>Fact picture size</span>
        <button type="button" data-act="stsize" data-v="0.5" aria-pressed="${sc <= 70}">S</button>
        <button type="button" data-act="stsize" data-v="1" aria-pressed="${sc > 70 && sc < 130}">M</button>
        <button type="button" data-act="stsize" data-v="1.5" aria-pressed="${sc >= 130}">L</button>
        <label class="stsizerange"><input type="range" min="50" max="150" step="5" value="${sc}" data-stscale="thumb" aria-label="Fact picture size"><span class="stsizeval">${sc}%</span></label></div>`;
    }
    const sc = Math.round(clampScale(st.scale == null ? (st.shape === "photo" ? 0.7 : 1) : st.scale) * 100);
    return `<div class="stsize"><span>Size</span>
      <button type="button" data-act="stsize" data-v="0.25" aria-pressed="${sc <= 33}">S</button>
      <button type="button" data-act="stsize" data-v="0.6" aria-pressed="${sc > 33 && sc < 85}">M</button>
      <button type="button" data-act="stsize" data-v="1" aria-pressed="${sc >= 85}">L</button>
      <label class="stsizerange"><input type="range" min="25" max="100" step="5" value="${sc}" data-stscale="1" aria-label="Image size"><span class="stsizeval">${sc}%</span></label></div>`;
  }
  function defaultCapText(st, f, b) {
    const tree = capItems({ cap: "" }, f, b || {});
    const lines = [];
    if (tree.label) lines.push(tree.label);
    (tree.items || []).forEach((it) => { if (it.text && it.text !== tree.label) lines.push(it.text); (it.kids || []).forEach((k) => lines.push("  " + k.text)); });
    return lines.join("\n");
  }
  function capRow(m) {
    const st = ST.sel != null ? (PG.stickers || {})[ST.sel] : null;
    if (!st || st.shape !== "photo") return "";
    const f = m.facts[ST.sel], boxes = (LAST && LAST.boxes) || [], b = boxes[ST.sel] || { label: (f && f.label) || [], lines: [] };
    const tree = capItems(st, f, b), list = tree.items.length >= 2;
    const def = defaultCapText({ cap: "" }, f, b);
    const val = st.cap != null ? st.cap : def;
    const snaps = [["Top left", 0.18, 0.16], ["Top", 0.5, 0.16], ["Top right", 0.82, 0.16], ["Middle left", 0.18, 0.5], ["Middle", 0.5, 0.5], ["Middle right", 0.82, 0.5], ["Bottom left", 0.18, 0.84], ["Bottom", 0.5, 0.84], ["Bottom right", 0.82, 0.84]];
    const tx = st.tx == null ? 0.5 : st.tx, ty = st.ty == null ? 0.14 : st.ty;
    let h = `<div class="stcap">`;
    if (list) h += `<p class="sthelp">The big picture should show this topic itself (a person in distress for “Signs of Respiratory Distress,” not a decoration). Each fact sits in its own index card: tap a card, then paste or pick a picture for that fact. Drag a tab to move where the line plugs in. Everything to remember stays inside the card.</p>`;
    else {
      h += `<p class="sthelp">The name sits at the top inside the picture, not as a stamp over the card. Drag it to a clear spot, or snap it.</p><div class="stsnaps" role="group" aria-label="Text position">`;
      snaps.forEach(([lab, x, y]) => {
        const on = Math.abs(tx - x) < 0.12 && Math.abs(ty - y) < 0.12;
        h += `<button type="button" data-act="stcapsnap" data-x="${x}" data-y="${y}" aria-label="${lab}" aria-pressed="${on}" class="${on ? "on" : ""}"></button>`;
      });
      h += `</div>`;
    }
    h += `<label class="stcaplab">Words in the picture<textarea data-stcap="${ST.sel}" rows="${list ? 4 : 3}">${esc(val)}</textarea></label></div>`;
    return h;
  }
  function setBranchThumb(next) {
    if (ST.sel == null) { ST.msg = "Tap a fact on the page first, then pick its picture."; return false; }
    const prev = PG.stickers[ST.sel] || {};
    if (ST.branch == null) {
      PG.hist.push({ t: "st", i: ST.sel, prev: PG.stickers[ST.sel] || null });
      if (next) PG.stickers[ST.sel] = Object.assign({}, prev, next); else delete PG.stickers[ST.sel];
      ST.focus = ST.sel; ST.focusBranch = null;
      ST.msg = next && next.shape === "photo" ? "" : (next ? "Nice start! Now make it yours: switch to Draw and add your own details." : "");
      if (next) uniqueNote(next);
      savePage(); return true;
    }
    const thumbs = Object.assign({}, prev.thumbs || {});
    PG.hist.push({ t: "st", i: ST.sel, prev });
    if (next) thumbs[ST.branch] = next; else delete thumbs[ST.branch];
    PG.stickers[ST.sel] = Object.assign({}, prev, { thumbs });
    ST.focus = ST.sel; ST.focusBranch = ST.branch; ST.msg = "";
    if (next) uniqueNote(next);
    savePage(); return true;
  }
  function uniqueNote(next) {
    const id = imageId(next); if (!id || ST.sel == null) return;
    const where = ST.branch != null ? "fact:" + ST.sel + ":" + ST.branch : "fact:" + ST.sel;
    if (collectImageIds(PG).some((x) => x.where !== where && x.id === id)) {
      ST.msg = "This picture is already used on this page. A slightly different one will stick better.";
      return;
    }
    try {
      const hits = findImageConflicts([{ id, where }], ppOtherImages(ppLoad(), null, -1));
      if (hits.length) ST.msg = "This picture already appears on “" + hits[0].other + "”. A slightly different one will stick better.";
    } catch (e) {}
  }
  function setSticker(next) { return setBranchThumb(next); }
  function showFact(i, br) {
    const el = (br != null ? document.querySelector(`.rcallout[data-cap="${i}"][data-pin="${br}"]`) : null) || document.querySelector(`.rfact[data-fi="${i}"]`);
    const sc = document.querySelector(".askscroll");
    if (el) el.classList.add("just");
    if (el && sc) {
      const er = el.getBoundingClientRect(), sr = sc.getBoundingClientRect();
      sc.scrollTop += (er.top + er.height / 2) - (sr.top + sr.height * 0.45);
    }
    const paper = document.querySelector(".stpaper");
    if (el && paper) {
      const er = el.getBoundingClientRect(), pr = paper.getBoundingClientRect();
      if (er.top < pr.top || er.bottom > pr.bottom) paper.scrollTop += er.top - pr.top - 12;
    }
  }
  function afterRender() {
    if (ST.focus != null) { const i = ST.focus, br = ST.focusBranch; ST.focus = null; ST.focusBranch = null; setTimeout(() => showFact(i, br), 0); }
    if (ST.focusPaste) { ST.focusPaste = false; setTimeout(() => { const box = document.getElementById("streplacebox") || document.getElementById("stpastebox"); if (box) box.focus(); }, 0); }
  }
  function enableUndo() { const b = document.querySelector('[data-act="stundo"]'); if (b) b.disabled = !(PG && PG.hist.length); }
  function isLightMat(r, g, b, a) {
    if (a < 8) return true;
    const lum = (r + g + b) / 3, ch = Math.max(r, g, b) - Math.min(r, g, b);
    return ch <= 12 && lum >= 218;
  }
  function flattenLightMat(ctx, w, h) {
    let img;
    try { img = ctx.getImageData(0, 0, w, h); } catch (e) { return 0; }
    const d = img.data;
    const seen = new Uint8Array(w * h);
    const qx = [], qy = [];
    const push = (x, y) => {
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const k = y * w + x;
      if (seen[k]) return;
      const i = k * 4;
      if (!isLightMat(d[i], d[i + 1], d[i + 2], d[i + 3])) return;
      seen[k] = 1; qx.push(x); qy.push(y);
    };
    for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
    for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
    let n = 0, qi = 0;
    while (qi < qx.length) {
      const x = qx[qi], y = qy[qi++];
      const i = (y * w + x) * 4;
      d[i] = d[i + 1] = d[i + 2] = 255; n++;
      push(x - 1, y); push(x + 1, y); push(x, y - 1); push(x, y + 1);
    }
    if (n) ctx.putImageData(img, 0, 0);
    return n;
  }
  function trimLightBox(ctx, w, h) {
    let data;
    try { data = ctx.getImageData(0, 0, w, h).data; } catch (e) { return null; }
    const at = (x, y) => { const i = (y * w + x) * 4; return [data[i], data[i + 1], data[i + 2], data[i + 3]]; };
    const corners = [at(0, 0), at(w - 1, 0), at(0, h - 1), at(w - 1, h - 1)];
    const bg = [0, 1, 2, 3].map((i) => Math.round(corners.reduce((s, p) => s + p[i], 0) / 4));
    const spread = Math.max.apply(null, corners.map((c) => Math.hypot(c[0] - bg[0], c[1] - bg[1], c[2] - bg[2])));
    if (spread > 40) return null;
    const lum = (bg[0] + bg[1] + bg[2]) / 3;
    if (bg[3] > 8 && lum < 218) return null;
    let minx = w, miny = h, maxx = -1, maxy = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4, a = data[i + 3];
      if (a < 8) continue;
      if (Math.hypot(data[i] - bg[0], data[i + 1] - bg[1], data[i + 2] - bg[2]) > 28) {
        if (x < minx) minx = x; if (y < miny) miny = y; if (x > maxx) maxx = x; if (y > maxy) maxy = y;
      }
    }
    if (maxx < 0) return null;
    const padX = Math.max(2, Math.round((maxx - minx + 1) * 0.03)), padY = Math.max(2, Math.round((maxy - miny + 1) * 0.03));
    minx = Math.max(0, minx - padX); miny = Math.max(0, miny - padY);
    maxx = Math.min(w - 1, maxx + padX); maxy = Math.min(h - 1, maxy + padY);
    const tw = maxx - minx + 1, th = maxy - miny + 1;
    if (tw * th > 0.88 * w * h) return null;
    return { x: minx, y: miny, w: tw, h: th };
  }
  function shrinkImage(src, cb) {
    const im = new Image();
    im.onload = () => {
      let w = im.naturalWidth || im.width, h = im.naturalHeight || im.height; if (!w || !h) return;
      const max = 512, z = Math.min(1, max / Math.max(w, h));
      w = Math.max(1, Math.round(w * z)); h = Math.max(1, Math.round(h * z));
      let c = document.createElement("canvas"); c.width = w; c.height = h;
      const ctx = c.getContext("2d"); ctx.drawImage(im, 0, 0, w, h);
      flattenLightMat(ctx, w, h);
      const trim = trimLightBox(ctx, w, h);
      if (trim) {
        const cropped = document.createElement("canvas"); cropped.width = trim.w; cropped.height = trim.h;
        cropped.getContext("2d").drawImage(c, trim.x, trim.y, trim.w, trim.h, 0, 0, trim.w, trim.h);
        c = cropped; w = trim.w; h = trim.h;
      }
      let url = "";
      try { url = c.toDataURL("image/webp", 0.82); } catch (e) {}
      if (!url || url.indexOf("image/webp") < 0) { try { url = c.toDataURL("image/png"); } catch (e) { url = src; } }
      if (url.length > 200000) { try { url = c.toDataURL("image/jpeg", 0.8); } catch (e) {} }
      cb({ src: url, w, h });
    };
    im.onerror = () => {};
    im.src = src;
  }
  function applyPhoto(data) {
    if (!data || !data.src) return;
    if (ST.sel == null) { ST.msg = "Tap a fact, or a line, then paste or choose its picture."; render(); return; }
    const prev = (ST.branch != null ? ((PG.stickers[ST.sel] || {}).thumbs || {})[ST.branch] : PG.stickers[ST.sel]) || {};
    const scale = ST.branch != null ? (prev.scale != null ? prev.scale : 1) : (prev.scale != null ? prev.scale : 0.7);
    setBranchThumb({ shape: "photo", src: data.src, w: data.w, h: data.h, scale });
    const box = document.getElementById("stpastebox"); if (box) box.innerHTML = "";
    render();
  }
  function takeImage(srcOrFile) {
    if (!srcOrFile) return;
    if (typeof srcOrFile === "string") { shrinkImage(srcOrFile, applyPhoto); return; }
    if (srcOrFile.type && !/^image\//.test(srcOrFile.type)) return;
    const fr = new FileReader(); fr.onload = () => shrinkImage(fr.result, applyPhoto); fr.readAsDataURL(srcOrFile);
  }


  const SLOT_DRAW = 320;
  function slotLabel() {
    const m = mdl(); if (!m) return "this picture";
    if (ST.sel == null) return "this picture";
    if (ST.branch != null) {
      const it = ((capItems((PG.stickers || {})[ST.sel], m.facts[ST.sel], ((LAST && LAST.boxes) || [])[ST.sel] || {}).items) || [])[ST.branch];
      return (it && it.text) || "this fact";
    }
    return m.facts[ST.sel] ? m.facts[ST.sel].label : "this topic";
  }
  // Suggestions for the topic picture (Ken, Nov 26): as many related pictures as fit the screen while each stays easy to see,
  // only ones whose words match the topic, none already used on another map or on this one's cards.
  function hubSugHtml(m) {
    if (!ST.hubSug || !m.cards) return "";
    const vw = Math.min(760, (W.innerWidth || 400) - 40), vh = (W.innerHeight || 800) * 0.6, tile = 92, gap = 8;
    const cols = Math.max(3, Math.floor((vw + gap) / (tile + gap))), rows = Math.max(2, Math.floor(vh / (tile + 22 + gap)));
    const P0 = picks(), mineK = (k2) => k2.split("|")[0] === m.k;
    const taken = Object.keys(P0).filter((k2) => !mineK(k2)).map((k2) => P0[k2]).concat(Object.keys(P0).filter(mineK).filter((k2) => k2 !== m.k + "|hub").map((k2) => P0[k2]));
    const ids = hubSuggestions(m, cols * rows, taken);
    return `<div class="sthubsug" role="dialog" aria-label="Suggested topic pictures"><div class="sthubsughead"><p class="streplacetitle">Pictures for “${esc(m.title)}”</p>
      <button type="button" class="rzoomx" data-act="sthubclose">Close ✕</button></div>
      ${ids.length ? `<p class="sthelp">Picked from the words on this topic. Tap one to use it. Your own picture sticks best.</p>
      <div class="sthubgrid" style="grid-template-columns:repeat(${cols},1fr)">${ids.map((id) => `<button type="button" data-act="sthubpick" data-s="${id}"><img src="${esc(artSrc(id))}" alt="" loading="lazy"><span>${esc(ART[id][1])}</span></button>`).join("")}</div>`
        : `<p class="sthelp">No close matches for this topic yet. Use your own picture: a photo, a drawing, or paste one.</p>`}
      <div class="strow"><button type="button" data-act="sthubmine">📷 Use my own picture instead</button></div></div>`;
  }
  function openReplace(sel, branch) {
    ST.map = "build"; ST.tool = "sticker"; ST.sel = sel;
    ST.branch = (branch == null || branch !== branch) ? null : branch;
    ST.replace = { sel: ST.sel, branch: ST.branch }; ST.slotDraw = null;
    ST.focus = ST.sel; ST.focusBranch = ST.branch; ST.msg = "";
  }
  function replaceMenuHtml() {
    if (!ST.replace || ST.slotDraw) return "";
    const lab = slotLabel();
    return `<div class="streplace" id="streplace" role="dialog" aria-label="Replace picture">
      <p class="streplacetitle">Replace this picture</p>
      <p class="sthelp">“${esc(lab)}”. Paste, drop, pick from your photo gallery, take a photo, draw, or use a sticker. You come back here when you tap Done.</p>
      <div class="streplaceacts">
        <button type="button" data-act="streplacepaste">Paste</button>
        <button type="button" data-act="streplacedrop">Drop</button>
        <label class="streplacebtn">Photo gallery<input type="file" accept="image/*" id="stgallery" class="stpastefile"></label>
        <label class="streplacebtn">Take photo<input type="file" accept="image/*" id="stcamera" class="stpastefile" capture="environment"></label>
        <button type="button" data-act="streplacedraw">Draw</button>
        <button type="button" data-act="streplacestickers">Stickers</button>
        <label class="streplacebtn">Draw on this photo<input type="file" accept="image/*" id="stdrawfile" class="stpastefile"></label>
      </div>
      <div class="stpastebox streplacedrop" id="streplacebox" contenteditable="true" spellcheck="false" role="textbox" aria-label="Paste or drop a photo here" data-placeholder="Paste or drop a photo here"></div>
      <button type="button" class="streplaceclose" data-act="streplaceclose">Close</button>
    </div>`;
  }
  function coverBox(w, h, box) {
    const ar = (w > 0 && h > 0) ? h / w : 1;
    let dw = box, dh = dw * ar;
    if (dh < box) { dh = box; dw = dh / (ar || 1); }
    return { x: (box - dw) / 2, y: (box - dh) / 2, w: dw, h: dh };
  }
  function slotDrawHtml() {
    const d = ST.slotDraw; if (!d) return "";
    const lab = slotLabel();
    const S = SLOT_DRAW;
    let bg = "";
    if (d.bg && d.bg.src) {
      const b = coverBox(d.bg.w || S, d.bg.h || S, S);
      const src = esc(d.bg.src);
      bg = `<image href="${src}" xlink:href="${src}" x="${b.x.toFixed(1)}" y="${b.y.toFixed(1)}" width="${b.w.toFixed(1)}" height="${b.h.toFixed(1)}" preserveAspectRatio="xMidYMid slice"/>`;
    }
    const ink = (d.ink || []).map((k) => `<path d="M${k.pts.map((q) => q[0].toFixed(1) + " " + q[1].toFixed(1)).join("L")}" fill="none" stroke="${esc(k.c)}" stroke-width="${k.w || 2.6}" stroke-linecap="round" stroke-linejoin="round"/>`).join("");
    return `<div class="stdrawslot" id="stdrawslot" role="dialog" aria-labelledby="stdrawtitle">
      <p class="streplacetitle" id="stdrawtitle">${d.bg ? "Draw on this photo" : "Draw a picture"} for “${esc(lab)}”</p>
      <p class="sthelp">Draw with your finger or mouse. Lift and continue as often as you like; tap Done when you are finished.</p>
      <svg class="stdrawsvg" viewBox="0 0 ${S} ${S}" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <rect width="${S}" height="${S}" fill="#fff"/>${bg}${ink}
      </svg>
      <div class="strow"><button type="button" data-act="stdrawundo" ${(d.ink || []).length ? "" : "disabled"}>↶ Undo</button>
        <button type="button" data-act="stdrawclear">Clear</button>
        <button type="button" data-act="stdrawcancel">Cancel</button>
        <button type="button" class="stdone" data-act="stdrawdone">Done</button></div>
    </div>`;
  }
  function startSlotDraw(bg) {
    ST.slotDraw = { sel: ST.sel, branch: ST.branch, bg: bg || null, ink: [] };
    ST.replace = ST.replace || { sel: ST.sel, branch: ST.branch };
  }
  function finishSlotDraw() {
    const d = ST.slotDraw; if (!d) return;
    const S = SLOT_DRAW, out = 512;
    const c = document.createElement("canvas"); c.width = out; c.height = out;
    const ctx = c.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, out, out);
    const z = out / S;
    const done = () => {
      (d.ink || []).forEach((k) => {
        if (!k.pts || k.pts.length < 2) return;
        ctx.beginPath(); ctx.lineCap = "round"; ctx.lineJoin = "round";
        ctx.strokeStyle = k.c || "#C62828"; ctx.lineWidth = (k.w || 2.6) * z;
        ctx.moveTo(k.pts[0][0] * z, k.pts[0][1] * z);
        k.pts.forEach((q, i) => { if (i) ctx.lineTo(q[0] * z, q[1] * z); });
        ctx.stroke();
      });
      let url = "";
      try { url = c.toDataURL("image/webp", 0.82); } catch (e) {}
      if (!url || url.indexOf("image/webp") < 0) { try { url = c.toDataURL("image/png"); } catch (e) { url = c.toDataURL("image/jpeg", 0.8); } }
      ST.slotDraw = null; ST.replace = null;
      applyPhoto({ src: url, w: out, h: out });
    };
    if (d.bg && d.bg.src) {
      const im = new Image();
      im.onload = () => {
        const b = coverBox(im.naturalWidth || d.bg.w || S, im.naturalHeight || d.bg.h || S, out);
        try { ctx.drawImage(im, b.x, b.y, b.w, b.h); } catch (e) {}
        done();
      };
      im.onerror = done;
      im.src = d.bg.src;
    } else done();
  }

  function builder(m) {
    const dec = decorated(m), n = dec.length, got = dec.filter(Boolean).length;
    const next = m.facts[dec.findIndex((d) => !d)];
    if (got === n && n && !PG.done) { PG.done = true; ST.celebrate = true; savePage(); }
    const prompt = ST.msg || (m.cards && next ? "Pick a topic picture: tap My picture or Suggestions on the otter. Each card already has a picture for its fact; tap one to change it." : next ? PROMPTS[(m.facts.indexOf(next) + PG.ink.length) % PROMPTS.length].replace("{f}", next.label) : "Every fact has a picture. Print it, then try Practice from memory tomorrow.");
    const seenImgs = {}, mapDups = collectImageIds(PG).filter((x) => { if (seenImgs[x.id]) return true; seenImgs[x.id] = 1; return false; });
    const tools = [["look", "👀 Look"], ["draw", "✏️ Draw"], ["sticker", "⭐ Stickers"], ["move", "✋ Move"]];
    let h = `<div class="stbuild"><p class="stprompt" aria-live="polite">${esc(prompt)}</p>
      <div class="sttools">${seg("sttool", ST.tool, tools)}</div>
      <div class="stcolors" role="group" aria-label="Color">${COLORS.map(([c, t]) => `<button type="button" data-act="stcolor" data-c="${c}" aria-label="${t}" aria-pressed="${ST.color === c}" class="${ST.color === c ? "on" : ""}" style="--c:${c}"></button>`).join("")}</div>`;
    if (ST.tool === "sticker") {
      const factLab = ST.sel != null && m.facts[ST.sel] ? m.facts[ST.sel].label : "";
      const branchLab = ST.branch != null && ST.sel != null ? ((capItems((PG.stickers || {})[ST.sel], m.facts[ST.sel], ((LAST && LAST.boxes) || [])[ST.sel] || {}).items || [])[ST.branch] || {}).text : "";
      const help = ST.sel == null ? "Tap a fact for its topic picture, or tap a card to add a picture for that fact."
        : ST.branch != null ? `Picture for “${esc(branchLab || "this fact")}”. It should show that fact, not a decoration.`
        : `Topic picture for “${esc(factLab)}”. It should show this topic itself, not a decoration. Tap a card to add a picture for one fact.`;
      h += `<p class="sthelp">${help}</p>
      <p class="stsub">Suggested for this fact</p><div class="ststickers art">${stkSuggest().map(stkBtn).join("")}</div>
      ${[...new Set(STK.map((t) => t.cat))].map((cat) => `<details class="stcat"><summary>${esc(cat)}</summary><div class="ststickers art">${STK.filter((t) => t.cat === cat).map((t) => stkBtn(t.id)).join("")}</div></details>`).join("")}
      <div class="ststickers">
      <button type="button" data-act="ststicker" data-s="" aria-label="No shape"><span class="none">✕</span><span>None</span></button></div>
      <div class="stpaste" id="stpaste">
        <div class="stpastebox" id="stpastebox" contenteditable="true" spellcheck="false" role="textbox" aria-label="Paste a sticker or photo, drop one here, or tap to choose" data-placeholder="Paste a sticker or photo, drop one here, or tap to choose"></div>
        <label class="stpastechoose">Choose a photo<input type="file" accept="image/*" id="stpastefile" class="stpastefile"></label>
      </div>${sizeRow()}${capRow(m)}`; }
    if (ST.tool === "move") h += `<p class="sthelp">Drag a fact to where it makes sense to you. Its branch follows.</p>`;
    if (ST.tool === "draw") h += `<p class="sthelp">Draw with your finger or mouse right on the page. Lift and continue as often as you like; tap Done when you are finished.</p>`;
    if (mapDups.length) h += `<p class="stppnote" role="status">Two facts on this page share a picture. A slightly different one will stick better.</p>`;
    h += replaceMenuHtml() + slotDrawHtml() + hubSugHtml(m);
    h += `<div class="stpaper builder tool-${ST.tool} ${ST.zoom ? "zoom" : ""}">${paperHtml(m)}</div>
      <div class="strow"><button type="button" data-act="stzoom">${ST.zoom ? "Fit to screen" : "Zoom in"}</button><button type="button" data-act="stundo" ${PG.hist.length ? "" : "disabled"}>↶ Undo</button><button type="button" data-act="stclear">Clear</button><button type="button" class="stdone" data-act="stdone">Done</button></div>
      <p class="stprog"><span class="stbar"><i style="width:${n ? Math.round(100 * got / n) : 0}%"></i></span>${m.cards ? (got ? "Topic picture added" : "No topic picture yet") : `${got} of ${n} facts have a picture`}${PG.done ? ' · <b>🏅 Page built!</b>' : ""}</p>
      <button type="button" class="stprint" data-act="stprint">${PRINTICON}<span>Print my page</span></button>
      <button type="button" class="staddprint" data-act="staddprint">Add to print page</button>
      <button type="button" class="stprinttraybtn" data-act="stprinttray">Print pages</button>
      <p class="sthelp">Saved on this device as you go. Ask about this topic again and your page comes back.</p></div>`;
    h += memPanels(m);
    if (ST.celebrate && !PG.song.asked) ST.songPop = true;
    if (ST.songPop) h += `<div class="stsongpop" role="dialog" aria-labelledby="stsongq"><p class="stsongq" id="stsongq">♪ Want to make it a song?</p>
      <p>${m.song.hasDefault ? `We wrote a starter jingle to <b>${esc(m.song.tuneName)}</b>, one line for each fact. Sing it, or change any words to make it yours.` : "Pick a tune you know and write one short line for each fact."} It's optional: your page is already done.</p>
      <div class="strow"><button type="button" class="stsongyes" data-act="stsongyes">Try it</button><button type="button" data-act="stsongno">Not now</button></div></div>`;
    if (ST.celebrate) { ST.celebrate = false; h += `<div class="stconfetti" aria-hidden="true">${Array.from({ length: 28 }, (_, i) => `<i style="--x:${(i * 37) % 100}vw;--d:${(i % 7) * 0.09}s;--c:${COLORS[i % COLORS.length][0]}"></i>`).join("")}</div>
      <div class="stbadge" role="status">🏅 Page built! Every fact has your own picture.</div>`; }
    return h;
  }
  const PRINTICON = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/></svg>';
  // The page to print, exactly as chosen (or built).
  function printHtml() {
    const m = mdl();
    if (ST.style === "trad") return traditionalHtml(m.allFacts ? Object.assign({}, m, { facts: m.allFacts }) : m, { mode: ST.mode });
    if (ST.map === "build") return builtForPrint(m, PG);   // same layout as the builder, so the drawing lines up
    return recallSvg(m, { mode: ST.mode, ideas: ST.ideas, landscape: true, print: true });
  }
  // A built page on letter paper: lay the facts out for print, then carry each drawing over to its fact's new spot (each stroke
  // goes with the fact space it sits in, scaled evenly). Long cards built on the phone are tall; this keeps the print full width.
  function builtForPrint(m, pg) {
    recallSvg(m, { custom: pg, screen: true, builder: true, noSong: true });   // exactly the builder's layout
    const S = LAST.boxes.map((b) => ({ x1: b.x1, y1: b.y1, x2: b.x2, y2: b.y2 }));
    recallSvg(m, { custom: { stickers: pg.stickers }, ideas: false, landscape: true, print: true });
    const P0 = LAST.boxes.map((b) => ({ x1: b.x1, y1: b.y1, x2: b.x2, y2: b.y2 }));
    const near = (p) => { let bi = -1, bd = 1e9; S.forEach((b, i) => { const dx = Math.max(b.x1 - p[0], 0, p[0] - b.x2), dy = Math.max(b.y1 - p[1], 0, p[1] - b.y2), d = dx * dx + dy * dy; if (d < bd) { bd = d; bi = i; } }); return bi; };
    const ink = (pg.ink || []).map((k) => {
      const c = k.pts.reduce((a, p) => [a[0] + p[0] / k.pts.length, a[1] + p[1] / k.pts.length], [0, 0]), i = near(c);
      if (i < 0 || !P0[i]) return null;
      const s = S[i], q = P0[i], f = Math.min((q.x2 - q.x1) / (s.x2 - s.x1), (q.y2 - q.y1) / (s.y2 - s.y1));
      const ox = (q.x1 + q.x2) / 2 - (s.x1 + s.x2) / 2 * f, oy = (q.y1 + q.y2) / 2 - (s.y1 + s.y2) / 2 * f;
      return { c: k.c, w: Math.max(1.2, (k.w || 2.6) * f), pts: k.pts.map((p) => [p[0] * f + ox, p[1] * f + oy]) };
    }).filter(Boolean);
    return recallSvg(m, { custom: { ink, stickers: pg.stickers }, landscape: true, print: true });
  }
  function preparePrint() {
    let el = document.getElementById("obPrint");
    if (!el) { el = document.createElement("div"); el.id = "obPrint"; document.body.appendChild(el); }
    el.innerHTML = printHtml();
    el.className = ST.style === "trad" ? "obprint-trad" : "obprint-map";
    document.documentElement.classList.add("obprinting");
    if (ST.style !== "trad") document.documentElement.classList.add("obprint-map");
    else document.documentElement.classList.remove("obprint-map");
    return el;
  }
  window.addEventListener("afterprint", () => document.documentElement.classList.remove("obprinting", "obprint-map"));

  // Print pages tray: several maps on one landscape letter sheet (Ken, t218u–t222u).
  // Stored under a new key only (obPrintPages:${EXAM}); existing study keys are left alone.
  function ppLoad() {
    try { const d = JSON.parse(localStorage.getItem(printPageKey()) || "null"); if (d && Array.isArray(d.pages)) return d; } catch (e) {}
    return { pages: [] };
  }
  function ppSave(d) { try { localStorage.setItem(printPageKey(), JSON.stringify({ pages: d.pages || [] })); } catch (e) {} }
  function ppNew(layout) { return { id: "p" + Date.now().toString(36) + Math.floor(Math.random() * 1000).toString(36), layout: layout || 1, items: [] }; }
  function itemImages(k) {
    const pg = fixPage(getPage(k)) || {};
    return collectImageIds(pg);
  }
  function ppOtherImages(data, skipPage, skipIndex) {
    const others = [];
    (data.pages || []).forEach((pg) => {
      (pg.items || []).forEach((it, i) => {
        if (pg.id === skipPage && i === skipIndex) return;
        const ids = (it.imgs || itemImages(it.k).map((x) => x.id));
        others.push({ ids, label: it.title || it.k, title: it.title || it.k, sample: false, page: pg.id });
      });
    });
    return others;
  }
  function ppConflictsFor(k, data, pageId) {
    const ids = itemImages(k);
    const others = ppOtherImages(data, pageId, -1);
    // also images already on the target page, and across all pages
    return findImageConflicts(ids, others);
  }
  function addToPrintPage(pageId, layout) {
    const data = ppLoad();
    let page = pageId && data.pages.find((p) => p.id === pageId);
    if (!page) { page = ppNew(layout || 1); data.pages.push(page); }
    if (page.items.length >= (page.layout || 1)) { ST.msg = "That page is full. Pick another page, or start a new one."; return false; }
    const m = mdl();
    const imgs = itemImages(ST.k).map((x) => x.id);
    const conflicts = ppConflictsFor(ST.k, data, page.id);
    page.items.push({ k: ST.k, title: (m && m.title) || ST.k, kind: ST.style === "trad" ? "trad" : "map", imgs });
    ppSave(data);
    ST.ppNote = conflicts.length
      ? { conflicts, k: ST.k, page: page.id }
      : null;
    ST.msg = conflicts.length
      ? ""
      : "Added to a print page (" + page.items.length + " of " + (page.layout || 1) + ").";
    ST.panel = "printpages";
    return true;
  }
  function ppSwap(k) {
    ST.k = k; ST.style = "map"; ST.map = "build"; ST.tool = "sticker"; ST.sel = null; ST.branch = null;
    ST.panel = ""; ST.ppNote = null;
    ST.msg = "Pick a slightly different picture so this page stays unique.";
    PG = fixPage(getPage(k)) || blankPage();
  }
  function printPagesHtml() {
    const data = ppLoad(), m = mdl();
    const curK = ST.k;
    let h = `<div class="stprintpages"><h3>Print pages</h3>
      <p class="sthelp">Combine maps on landscape letter pages: one, two stacked, or four in a grid. Saved on this device.</p>`;
    if (ST.ppNote && ST.ppNote.conflicts && ST.ppNote.conflicts.length) {
      const c = ST.ppNote.conflicts[0];
      h += `<div class="stppnote" role="status"><p>This picture already appears on “${esc(c.other)}”. A slightly different one will stick better.</p>
        <button type="button" class="stppswap" data-act="stprintswap" data-k="${esc(ST.ppNote.k)}">Swap image</button></div>`;
    }
    h += `<div class="stppadd"><p class="asklabel">Add “${esc((m && m.title) || "this topic")}” to</p>`;
    data.pages.forEach((pg, i) => {
      const cap = pg.layout || 1, used = (pg.items || []).length, open = used < cap;
      h += `<button type="button" class="stpppick" data-act="stprintaddto" data-id="${pg.id}" ${open ? "" : "disabled"}>${open ? "Page " + (i + 1) + " · " + used + " of " + cap : "Page " + (i + 1) + " is full"}</button>`;
    });
    h += `<div class="stpplayouts"><span>New page</span>`;
    [1, 2, 4].forEach((n) => { h += `<button type="button" data-act="stprintnew" data-v="${n}">${n === 1 ? "1 up" : n === 2 ? "2 stacked" : "4 in a grid"}</button>`; });
    h += `</div></div>`;
    if (!data.pages.length) h += `<p class="sthelp">No print pages yet. Choose a layout above to start one.</p>`;
    data.pages.forEach((pg, i) => {
      h += `<div class="stppage"><header><b>Page ${i + 1}</b> ${seg("stprintlayout", String(pg.layout || 1), [["1", "1"], ["2", "2"], ["4", "4"]]).replace('data-act="stprintlayout"', 'data-act="stprintlayout" data-id="' + pg.id + '"')}
        <button type="button" class="stppdelpage" data-act="stprintdelpage" data-id="${pg.id}" aria-label="Remove this page">✕</button></header><ol>`;
      (pg.items || []).forEach((it, j) => {
        const conf = findImageConflicts(itemImages(it.k), ppOtherImages(data, pg.id, j));
        h += `<li><span>${esc(it.title || it.k)}</span>
          <span class="stppbtns">
            <button type="button" data-act="stprintmove" data-id="${pg.id}" data-i="${j}" data-dir="-1" aria-label="Move up" ${j ? "" : "disabled"}>↑</button>
            <button type="button" data-act="stprintmove" data-id="${pg.id}" data-i="${j}" data-dir="1" aria-label="Move down" ${j < pg.items.length - 1 ? "" : "disabled"}>↓</button>
            <button type="button" data-act="stprintremove" data-id="${pg.id}" data-i="${j}" aria-label="Remove">Remove</button>
            ${conf.length ? `<button type="button" data-act="stprintswap" data-k="${esc(it.k)}">Swap image</button>` : ""}
          </span>
          ${conf.length ? `<small class="stppwarn">This picture also appears on “${esc(conf[0].other)}”.</small>` : ""}
        </li>`;
      });
      h += `</ol></div>`;
    });
    h += `<div class="strow"><button type="button" class="stprint" data-act="stprintall">${PRINTICON}<span>Print all</span></button>
      <button type="button" data-act="stprinttray" data-v="off">Close</button></div></div>`;
    return h;
  }
  function slotHtml(it) {
    if (!it) return `<div class="pslot empty"></div>`;
    const keep = PG, kk = ST.k, stStyle = ST.style, stMap = ST.map, stMode = ST.mode;
    const page = fixPage(getPage(it.k));
    let html = "";
    try {
      ST.k = it.k; PG = page || blankPage();
      const m = model(it.k, { mine: PG, layout: pageLayout(PG) });
      if (it.kind === "trad") html = traditionalHtml(m.allFacts ? Object.assign({}, m, { facts: m.allFacts }) : m, { mode: "filled" });
      else if (page) html = builtForPrint(m, PG);
      else html = recallSvg(m, { mode: "filled", landscape: true, print: true });
    } catch (e) { html = `<p>${esc(it.title || it.k)}</p>`; }
    ST.k = kk; PG = keep; ST.style = stStyle; ST.map = stMap; ST.mode = stMode;
    return `<div class="pslot">${html}</div>`;
  }
  function printAllHtml() {
    const data = ppLoad();
    return data.pages.map((pg) => {
      const n = pg.layout || 1, items = (pg.items || []).slice(0, n);
      while (items.length < n) items.push(null);
      return `<div class="ppage layout-${n}">${items.map(slotHtml).join("")}</div>`;
    }).join("");
  }
  function preparePrintAll() {
    let el = document.getElementById("obPrint");
    if (!el) { el = document.createElement("div"); el.id = "obPrint"; document.body.appendChild(el); }
    el.innerHTML = printAllHtml();
    el.className = "obprint-map obprint-pages";
    document.documentElement.classList.add("obprinting", "obprint-map");
    return el;
  }

  function thumb(k) {
    const p = getPage(k); if (!p) return "";
    const keep = PG, kk = ST.k; PG = p; ST.k = k;
    const svg = recallSvg(model(k, { mine: fixPage(p), layout: pageLayout(p) }), { custom: p, screen: true, builder: true, noSong: true });
    PG = keep; ST.k = kk;
    return svg.replace('class="recallsvg', 'class="recallsvg thumb');
  }
  // Drawing and dragging on the page. Pointer up only ends the current stroke — it must not re-render or navigate, or the leftover
  // click lands on a control (often Back) after the page jumps to the top (Ken, t195u). Many strokes are expected. Done leaves.
  let pen = null, drag = null, capDrag = null, pinDrag = null, skipClick = 0;
  const svgPt = (svg, e) => { const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const r = pt.matrixTransform(svg.getScreenCTM().inverse()); return [r.x, r.y]; };
  let slotPen = null;
  document.addEventListener("pointerdown", (e) => {
    const dsvg = e.target.closest && e.target.closest("svg.stdrawsvg");
    if (dsvg && ST.slotDraw) {
      e.preventDefault(); e.stopPropagation();
      const p = svgPt(dsvg, e);
      const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
      el.setAttribute("class", "rink"); el.setAttribute("fill", "none"); el.setAttribute("stroke", ST.color); el.setAttribute("stroke-width", "2.6"); el.setAttribute("stroke-linecap", "round"); el.setAttribute("stroke-linejoin", "round");
      dsvg.appendChild(el); slotPen = { svg: dsvg, el, k: { c: ST.color, w: 2.6, pts: [p] } };
      try { dsvg.setPointerCapture(e.pointerId); } catch (x) {}
      return;
    }
    const svg = e.target.closest && e.target.closest("svg.recallsvg.builder"); if (!svg || !PG) return;
    if (e.target.closest("[data-act]")) return;
    e.stopPropagation();
    const p = svgPt(svg, e), fact = e.target.closest(".rfact"), fi = fact ? Number(fact.dataset.fi) : null;
    const pin = e.target.closest && e.target.closest(".rpin"), cap = e.target.closest && e.target.closest(".rcap");
    const pic = e.target.closest && e.target.closest(".rhubpic, .rthumb, .rthumbadd");
    if ((ST.tool === "sticker" || ST.tool === "look") && pic && pic.dataset.cap != null && !pin) {
      e.preventDefault();
      const br = pic.classList.contains("rhubpic") ? null : (pic.dataset.pin != null ? Number(pic.dataset.pin) : null);
      openReplace(Number(pic.dataset.cap), br);
      render(); return;
    }
    if ((ST.tool === "sticker" || ST.tool === "look") && (pin || cap)) {
      e.preventDefault();
      const host = pin || cap, fi2 = Number(host.dataset.cap);
      if (fi2 >= 0 && PG.stickers[fi2]) {
        const box = host.closest("[data-cx]") || host.closest("[data-px]") || host;
        const photo = { x: Number(box.dataset.px), y: Number(box.dataset.py), w: Number(box.dataset.pw), h: Number(box.dataset.ph) };
        const start = { svg, i: fi2, p0: p, prev: Object.assign({}, PG.stickers[fi2]), photo, n: pin ? Number(pin.dataset.pin) : null,
          cx: Number(box.dataset.cx), cy: Number(box.dataset.cy), w: Number(box.dataset.w), h: Number(box.dataset.h) };
        if (pin) pinDrag = start; else capDrag = start;
        ST.sel = fi2; ST.tool = "sticker";
        try { svg.setPointerCapture(e.pointerId); } catch (x) {}
        return;
      }
    }
    if (ST.tool === "draw") {
      e.preventDefault();
      const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
      el.setAttribute("class", "rink"); el.setAttribute("fill", "none"); el.setAttribute("stroke", ST.color); el.setAttribute("stroke-width", "2.6"); el.setAttribute("stroke-linecap", "round"); el.setAttribute("stroke-linejoin", "round");
      svg.appendChild(el); pen = { svg, el, k: { c: ST.color, w: 2.6, pts: [p] } };
      try { svg.setPointerCapture(e.pointerId); } catch (x) {}
    } else if (ST.tool === "move" && fi != null) {
      e.preventDefault(); drag = { svg, fact, i: fi, p0: p, m0: PG.moves[fi] || [0, 0] };
      try { svg.setPointerCapture(e.pointerId); } catch (x) {}
    } else if (ST.tool === "sticker" || ST.tool === "look") {
      const call = e.target.closest && e.target.closest(".rcallout, .rthumb, .rthumbadd");
      if (call && call.dataset.cap != null && !(ST.tool === "look" && call.classList.contains("rcallout"))) {
        ST.sel = Number(call.dataset.cap); ST.branch = Number(call.dataset.pin); ST.tool = "sticker"; ST.focus = ST.sel; ST.focusBranch = ST.branch; render(); return;
      }
      if (fi != null && ST.tool !== "look") { ST.sel = fi; ST.branch = null; ST.tool = "sticker"; ST.focus = fi; render(); }
    }
  });
  const photoFrac = (d, p) => {
    const ph = d.photo, x = ph.w ? (p[0] - ph.x) / ph.w : 0.5, y = ph.h ? (p[1] - ph.y) / ph.h : 0.5;
    return [Math.min(1, Math.max(0, x)), Math.min(1, Math.max(0, y))];
  };
  document.addEventListener("pointermove", (e) => {
    if (slotPen) { const p = svgPt(slotPen.svg, e), l = slotPen.k.pts[slotPen.k.pts.length - 1]; if (Math.hypot(p[0] - l[0], p[1] - l[1]) < 1.5) return;
      slotPen.k.pts.push(p); slotPen.el.setAttribute("d", "M" + slotPen.k.pts.map((q) => q[0].toFixed(1) + " " + q[1].toFixed(1)).join("L")); }
    else if (pen) { const p = svgPt(pen.svg, e), l = pen.k.pts[pen.k.pts.length - 1]; if (Math.hypot(p[0] - l[0], p[1] - l[1]) < 1.5) return;
      pen.k.pts.push(p); pen.el.setAttribute("d", "M" + pen.k.pts.map((q) => q[0].toFixed(1) + " " + q[1].toFixed(1)).join("L")); }
    else if (drag) { const p = svgPt(drag.svg, e); drag.d = [p[0] - drag.p0[0], p[1] - drag.p0[1]]; drag.fact.setAttribute("transform", `translate(${drag.d[0]} ${drag.d[1]})`); }
    else if (capDrag) {
      const fr = photoFrac(capDrag, svgPt(capDrag.svg, e));
      PG.stickers[capDrag.i] = Object.assign({}, PG.stickers[capDrag.i], { tx: fr[0], ty: fr[1] });
      capDrag.moved = true; refreshPaper();
    } else if (pinDrag) {
      const pt = svgPt(pinDrag.svg, e), pins = (PG.stickers[pinDrag.i].pins || []).slice();
      let side, y;
      if (pinDrag.cx && pinDrag.w) {
        side = pt[0] < pinDrag.cx ? "L" : "R";
        y = Math.min(1, Math.max(0, (pt[1] - (pinDrag.cy - pinDrag.h / 2)) / (pinDrag.h || 1)));
      } else {
        const fr = photoFrac(pinDrag, pt);
        side = fr[0] < 0.5 ? "L" : "R";
        y = fr[1];
      }
      pins[pinDrag.n] = Object.assign({}, pins[pinDrag.n] || {}, { side, y });
      PG.stickers[pinDrag.i] = Object.assign({}, PG.stickers[pinDrag.i], { pins });
      pinDrag.moved = true; refreshPaper();
    }
  });
  const endPtr = (e) => {
    if (slotPen) {
      const k = slotPen.k, el = slotPen.el; slotPen = null;
      if (e) { e.preventDefault(); e.stopPropagation(); }
      if (k.pts.length > 1 && ST.slotDraw) { ST.slotDraw.ink = (ST.slotDraw.ink || []).concat([k]); skipClick = 1; const b = document.querySelector('[data-act="stdrawundo"]'); if (b) b.disabled = false; }
      else if (el && el.parentNode) el.parentNode.removeChild(el);
    } else if (pen) {
      const k = pen.k, el = pen.el; pen = null;
      if (e) { e.preventDefault(); e.stopPropagation(); }
      if (k.pts.length > 1) { PG.ink.push(k); PG.hist.push({ t: "ink" }); ST.msg = ""; savePage(); skipClick = 1; enableUndo(); }
      else if (el && el.parentNode) el.parentNode.removeChild(el);
    } else if (drag) {
      const d = drag.d, i = drag.i, m0 = drag.m0; drag = null;
      if (e) { e.preventDefault(); e.stopPropagation(); }
      if (d) { PG.hist.push({ t: "mv", i, prev: m0 }); PG.moves[i] = [m0[0] + d[0], m0[1] + d[1]]; savePage(); skipClick = 1; refreshPaper(); enableUndo(); }
    } else if (capDrag || pinDrag) {
      const d = capDrag || pinDrag; capDrag = pinDrag = null;
      if (e) { e.preventDefault(); e.stopPropagation(); }
      if (d.moved) { PG.hist.push({ t: "st", i: d.i, prev: d.prev }); savePage(); skipClick = 1; enableUndo(); }
    }
  };
  document.addEventListener("pointerup", endPtr); document.addEventListener("pointercancel", endPtr);
  document.addEventListener("click", (e) => { if (!skipClick) return; skipClick = 0; e.preventDefault(); e.stopPropagation(); }, true);

  // Paste, drop or choose a photo/sticker (Ken, t191u–t194u). iPhone keyboard stickers paste into the contenteditable box.
  const imageFromClipboard = (e) => {
    const cd = e.clipboardData || e.dataTransfer; if (!cd) return null;
    const items = cd.items || [];
    for (let i = 0; i < items.length; i++) { if (items[i].type && items[i].type.indexOf("image/") === 0) { const f = items[i].getAsFile(); if (f) return f; } }
    const files = cd.files || [];
    if (files.length && (!files[0].type || files[0].type.indexOf("image/") === 0)) return files[0];
    return null;
  };
  document.addEventListener("paste", (e) => {
    if (!document.getElementById("stpaste") && !document.getElementById("streplace")) return;
    const f = imageFromClipboard(e);
    if (f) { e.preventDefault(); takeImage(f); return; }
    const box = document.getElementById("streplacebox") || document.getElementById("stpastebox");
    setTimeout(() => {
      if (!box) return;
      const img = box.querySelector("img");
      if (img && (img.src || img.getAttribute("src"))) takeImage(img.src || img.getAttribute("src"));
      box.innerHTML = "";
    }, 0);
  });
  const dropHost = (el) => el && el.closest && el.closest("#stpaste, #streplace, #streplacebox, #stdrawslot");
  document.addEventListener("dragover", (e) => { if (dropHost(e.target)) { e.preventDefault(); if (e.dataTransfer) e.dataTransfer.dropEffect = "copy"; } });
  document.addEventListener("drop", (e) => {
    if (!dropHost(e.target)) return;
    e.preventDefault();
    const f = imageFromClipboard(e); if (f) takeImage(f);
  });
  document.addEventListener("change", (e) => {
    const id = e.target && e.target.id;
    if (id === "stpastefile" || id === "stgallery" || id === "stcamera") {
      const f = e.target.files && e.target.files[0]; e.target.value = ""; if (f) takeImage(f);
    } else if (id === "stdrawfile") {
      const f = e.target.files && e.target.files[0]; e.target.value = "";
      if (f) {
        const fr = new FileReader();
        fr.onload = () => shrinkImage(fr.result, (data) => { startSlotDraw(data); render(); });
        fr.readAsDataURL(f);
      }
    }
    else if (e.target && e.target.dataset && e.target.dataset.stscale && PG && ST.sel != null && PG.stickers[ST.sel]) {
      const prev = PG.stickers[ST.sel], thumb = e.target.dataset.stscale === "thumb";
      PG.hist.push({ t: "st", i: ST.sel, prev });
      if (thumb && ST.branch != null) {
        const thumbs = Object.assign({}, prev.thumbs || {}), th = thumbs[ST.branch]; if (!th) return;
        thumbs[ST.branch] = Object.assign({}, th, { scale: clampThumb(Number(e.target.value) / 100) });
        PG.stickers[ST.sel] = Object.assign({}, prev, { thumbs });
        ST.focusBranch = ST.branch;
      } else PG.stickers[ST.sel] = Object.assign({}, prev, { scale: clampScale(Number(e.target.value) / 100) });
      ST.focus = ST.sel; savePage(); enableUndo();
    }
  });
  // Typing a picture idea or a lyric: save as they type, update the tag and beat count, and redraw just the paper.
  let typeT = 0;
  document.addEventListener("input", (e) => {
    const t = e.target;
    if (t && t.dataset && t.dataset.stscale && PG && ST.sel != null && PG.stickers[ST.sel]) {
      const thumb = t.dataset.stscale === "thumb", v = thumb ? clampThumb(Number(t.value) / 100) : clampScale(Number(t.value) / 100);
      const lab = t.parentNode && t.parentNode.querySelector(".stsizeval"); if (lab) lab.textContent = Math.round(v * 100) + "%";
      const prev = PG.stickers[ST.sel];
      if (thumb && ST.branch != null) {
        const thumbs = Object.assign({}, prev.thumbs || {}), th = thumbs[ST.branch]; if (!th) return;
        thumbs[ST.branch] = Object.assign({}, th, { scale: v });
        PG.stickers[ST.sel] = Object.assign({}, prev, { thumbs });
      } else PG.stickers[ST.sel] = Object.assign({}, prev, { scale: v });
      savePage(); refreshPaper(); return;
    }
    if (t && t.dataset && t.dataset.stcap != null && PG) {
      const i = Number(t.dataset.stcap);
      if (!PG.stickers[i]) return;
      PG.stickers[i] = Object.assign({}, PG.stickers[i], { cap: t.value });
      savePage(); clearTimeout(typeT); typeT = setTimeout(refreshPaper, 200); return;
    }
    if (!PG || !t.dataset) return;
    const m0 = mdl();
    if (t.dataset.stpic != null) {
      const i = t.dataset.stpic, f = (m0.allFacts || m0.facts)[i], v = t.value;
      if (!v.trim() || v.trim() === f.picDefault) delete PG.pics[i]; else PG.pics[i] = v;
      const mine = !!PG.pics[i], tag = document.querySelector(`[data-tag="${i}"]`), rb = t.parentNode.querySelector(".streset");
      if (tag) { tag.textContent = mine ? "Yours" : f.picDefault ? "Suggested" : "Empty"; tag.classList.toggle("mine", mine); }
      if (rb) rb.hidden = !mine;
    } else if (t.dataset.stlyric != null) {
      const k = t.dataset.stlyric, l = m0.song.lines.find((x) => x.key === k), v = t.value;
      if (!v.trim() || v.trim() === l.def) delete PG.song.lines[k]; else { PG.song.lines[k] = v; PG.song.print = true; }
      const mine = !!PG.song.lines[k], tag = document.querySelector(`[data-tag="l${k}"]`), bt = document.querySelector(`[data-beats="${k}"]`), rb = t.parentNode.querySelector(".streset");
      const n = beats(v || l.def), want = TUNES[m0.song.tune].beats;
      if (tag) { tag.textContent = mine ? "Yours" : l.def ? "Suggested" : "Empty"; tag.classList.toggle("mine", mine); }
      if (bt) { bt.textContent = (v || l.def) ? n + " beats" : ""; bt.classList.toggle("ok", n === want); }
      if (rb) rb.hidden = !mine;
      const pc = document.querySelector('[data-act="stsongprint"]'); if (pc && mine) pc.checked = true;
    } else return;
    savePage(); clearTimeout(typeT); typeT = setTimeout(refreshPaper, 250);
  });
  // "Hear the tune": the opening of a public-domain melody, played with the Web Audio API (no files, no network).
  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  let AC = null;
  function playTune(k) {
    const T = TUNES[k]; if (!T) return;
    try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    let t = AC.currentTime + 0.05; const beat = k === "yankee" ? 0.36 : 0.42;
    T.notes.split(/\s+/).forEach((n) => {
      const [p, d] = n.split(":"), midi = 12 * (Number(p.slice(-1)) + 1) + NOTE[p[0]], dur = (Number(d) || 1) * beat;
      const o = AC.createOscillator(), g = AC.createGain();
      o.type = "triangle"; o.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.92);
      o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + dur); t += dur;
    });
  }

  W.PAGE_ACTIONS = Object.assign(W.PAGE_ACTIONS || {}, {
    ststyle: (b) => { ST.style = b.dataset.v; savePref(); },
    stmap: (b) => { ST.map = b.dataset.v; savePref(); },
    stmode: (b) => { ST.mode = b.dataset.v; },
    stideas: (b) => { ST.ideas = !!b.checked; },
    sttool: (b) => { ST.tool = b.dataset.v; ST.msg = ""; },
    stcolor: (b) => { ST.color = b.dataset.c; },
    stzoom: () => { ST.zoom = !ST.zoom; },
    sthubmine: () => { ST.style = "map"; ST.hubSug = false; openReplace(0, null); savePref(); },
    sthubsuggest: () => { ST.style = "map"; ST.map = "build"; ST.replace = null; ST.slotDraw = null; ST.sel = 0; ST.branch = null; ST.hubSug = true; savePref();
      setTimeout(() => { const el = document.querySelector(".sthubsug"); if (el) el.scrollIntoView({ block: "start", behavior: "smooth" }); }, 60); },
    sthubclose: () => { ST.hubSug = false; },
    sthubpick: (b) => {
      const id = artId(b.dataset.s); if (!id) return;
      const m = mdl(), prev = (PG.stickers || {})[0] || {};
      PG.hist.push({ t: "st", i: 0, prev: PG.stickers[0] || null });
      PG.stickers = Object.assign({}, PG.stickers, { 0: Object.assign({}, prev, { shape: "photo", src: artSrc(id), w: ART[id][2], h: ART[id][3], sticker: id, scale: prev.scale || 0.85, cap: prev.cap || m.capDefault }) });
      delete PG.stickers[0].placeholder; PG.layout = "cards";
      const P0 = picks(); P0[m.k + "|hub"] = id; savePicks(); savePage(); ST.hubSug = false; ST.msg = "";
    },
    ststicker: (b) => {
      if (ST.sel == null) { ST.msg = "Tap a fact, or a card, then pick its shape."; return; }
      const prev = (ST.branch != null ? ((PG.stickers[ST.sel] || {}).thumbs || {})[ST.branch] : PG.stickers[ST.sel]) || {};
      setBranchThumb(b.dataset.s ? { shape: b.dataset.s, scale: prev.scale } : null);   // no tint: stickers keep their own colors
    },
    stsize: (b) => {
      if (ST.sel == null || !PG.stickers[ST.sel]) return false;
      const prev = PG.stickers[ST.sel];
      if (ST.branch != null) {
        const thumbs = Object.assign({}, prev.thumbs || {}), th = thumbs[ST.branch]; if (!th) return false;
        PG.hist.push({ t: "st", i: ST.sel, prev });
        thumbs[ST.branch] = Object.assign({}, th, { scale: clampThumb(b.dataset.v) });
        PG.stickers[ST.sel] = Object.assign({}, prev, { thumbs });
        ST.focus = ST.sel; ST.focusBranch = ST.branch; savePage(); return;
      }
      PG.hist.push({ t: "st", i: ST.sel, prev });
      PG.stickers[ST.sel] = Object.assign({}, prev, { scale: clampScale(b.dataset.v) });
      ST.focus = ST.sel; savePage();
    },
    stcapsnap: (b) => {
      if (ST.sel == null || !PG.stickers[ST.sel]) return false;
      const prev = PG.stickers[ST.sel];
      PG.hist.push({ t: "st", i: ST.sel, prev });
      PG.stickers[ST.sel] = Object.assign({}, prev, { tx: Number(b.dataset.x), ty: Number(b.dataset.y) });
      ST.focus = ST.sel; savePage();
    },
    stundo: () => { const h = PG.hist.pop(); if (!h) return;
      if (h.t === "ink") PG.ink.pop(); else if (h.t === "st") { if (h.prev) PG.stickers[h.i] = h.prev; else delete PG.stickers[h.i]; }
      else if (h.t === "mv") { if (h.prev[0] || h.prev[1]) PG.moves[h.i] = h.prev; else delete PG.moves[h.i]; }
      savePage(); },
    stclear: () => { if (!confirm("Clear your drawings, shapes and moves on this page?")) return false; PG = blankPage(); savePage(); },
    stprint: () => { preparePrint(); setTimeout(() => window.print(), 50); return false; },
    staddprint: () => { ST.panel = "printpages"; ST.ppNote = null; },
    stprinttray: (b) => { ST.panel = b.dataset.v === "off" ? "" : (ST.panel === "printpages" ? "" : "printpages"); ST.ppNote = ST.panel === "printpages" ? ST.ppNote : null; },
    stprintnew: (b) => { addToPrintPage(null, Number(b.dataset.v) || 1); },
    stprintaddto: (b) => { addToPrintPage(b.dataset.id); },
    stprintlayout: (b) => {
      const data = ppLoad(), page = data.pages.find((p) => p.id === b.dataset.id);
      if (!page) return false;
      const n = Number(b.dataset.v) || 1;
      if (page.items.length > n) { ST.msg = "Remove an item first, or move it to another page. This layout only holds " + n + "."; return; }
      page.layout = n; ppSave(data);
    },
    stprintremove: (b) => {
      const data = ppLoad(), page = data.pages.find((p) => p.id === b.dataset.id);
      if (!page) return false;
      page.items.splice(Number(b.dataset.i), 1); ppSave(data);
    },
    stprintmove: (b) => {
      const data = ppLoad(), page = data.pages.find((p) => p.id === b.dataset.id);
      if (!page) return false;
      const i = Number(b.dataset.i), j = i + Number(b.dataset.dir);
      if (j < 0 || j >= page.items.length) return false;
      const t = page.items[i]; page.items[i] = page.items[j]; page.items[j] = t; ppSave(data);
    },
    stprintdelpage: (b) => {
      const data = ppLoad();
      data.pages = data.pages.filter((p) => p.id !== b.dataset.id); ppSave(data);
    },
    stprintall: () => { preparePrintAll(); setTimeout(() => window.print(), 50); return false; },
    stprintswap: (b) => { ppSwap(b.dataset.k); },
    streplacepaste: () => { ST.focusPaste = true; },
    streplacedrop: () => { ST.focusPaste = true; ST.msg = "Drop a photo on the box below."; },
    streplacedraw: () => { startSlotDraw(null); },
    streplacestickers: () => { ST.replace = null; ST.tool = "sticker"; ST.focus = ST.sel; ST.focusBranch = ST.branch; },
    streplaceclose: () => { ST.replace = null; ST.slotDraw = null; },
    stdrawundo: () => { if (ST.slotDraw && ST.slotDraw.ink.length) ST.slotDraw.ink.pop(); },
    stdrawclear: () => { if (ST.slotDraw) ST.slotDraw.ink = []; },
    stdrawcancel: () => { ST.slotDraw = null; },
    stdrawdone: () => { finishSlotDraw(); return false; },
    stpanel: (b) => { ST.panel = ST.panel === b.dataset.v ? "" : b.dataset.v; },
    stpicreset: (b) => { delete PG.pics[b.dataset.i]; savePage(); },
    sttune: (b) => { PG.song.tune = b.dataset.v; savePage(); },
    stlyreset: (b) => { delete PG.song.lines[b.dataset.k]; savePage(); },
    stlyresetall: () => { if (!confirm("Use our whole jingle again? Your own lines will be replaced.")) return false; PG.song.lines = {}; savePage(); },
    stsongprint: (b) => { PG.song.print = !!b.checked; savePage(); },
    stsongyes: () => { ST.songPop = false; ST.panel = "song"; PG.song.asked = true; PG.song.print = true; savePage();
      setTimeout(() => { const el = document.querySelector(".stsong"); if (el) el.scrollIntoView({ block: "start", behavior: "smooth" }); }, 60); },
    stsongno: () => { ST.songPop = false; PG.song.asked = true; savePage(); },
    stplay: () => { playTune(mdl().song.tune); return false; },
  });

  // Tap a box to read it big (Ken, Nov 26): tapping a fact or index card opens it enlarged at the top of the screen; tapping
  // another box swaps it in, so only one is ever enlarged. Works on every recall map on screen, and in the builder's Look tool.
  // It is a copy of the map zoomed to that box (same shapes, colors and pictures), never a second layout to keep in step.
  let zoomTap = null;
  function zoomTarget(t) {
    if (!t || !t.closest) return null;
    const svg = t.closest("svg.recallsvg"); if (!svg || svg.classList.contains("thumb")) return null;
    if (svg.classList.contains("builder") && ST.tool !== "look") return null;
    if (t.closest(".rpin, .rcap, .rhub, .rhubpic, .rthumb, .rthumbadd, [data-act]")) return null;   // pictures keep their Replace menu
    const el = t.closest(".rcard") || t.closest(".rfact"); return el ? { svg, el } : null;
  }
  function showZoom(svg, el) {
    const inv = svg.getScreenCTM && svg.getScreenCTM(); if (!inv) return;
    // the words and pictures, not the empty draw-your-own space around them, so the text comes up as big as it can
    const parts = [...el.children].filter((x) => !x.matches("clipPath, .rspace, .rtip") && x.getBoundingClientRect().width > 0).map((x) => x.getBoundingClientRect());
    const r0 = el.getBoundingClientRect(), r = parts.length ? { left: Math.min(...parts.map((x) => x.left)), top: Math.min(...parts.map((x) => x.top)), right: Math.max(...parts.map((x) => x.right)), bottom: Math.max(...parts.map((x) => x.bottom)) } : r0, m = inv.inverse();
    const a = svg.createSVGPoint(), b = svg.createSVGPoint(); a.x = r.left; a.y = r.top; b.x = r.right; b.y = r.bottom;
    const p = a.matrixTransform(m), q = b.matrixTransform(m), pad = 6;
    const vb = [p.x - pad, p.y - pad, q.x - p.x + 2 * pad, q.y - p.y + 2 * pad];
    if (!(vb[2] > 4 && vb[3] > 4)) return;
    const c = svg.cloneNode(true);
    c.removeAttribute("width"); c.removeAttribute("height"); c.setAttribute("class", "recallsvg rzoomsvg");
    c.setAttribute("viewBox", vb.map((v) => v.toFixed(1)).join(" ")); c.setAttribute("preserveAspectRatio", "xMidYMid meet");
    let box = document.querySelector(".rzoom");
    if (!box) {
      box = document.createElement("div"); box.className = "rzoom"; box.setAttribute("role", "dialog"); box.setAttribute("aria-label", "Enlarged box");
      box.innerHTML = '<div class="rzoombar"><span>Tap another box to switch</span><button type="button" class="rzoomx" aria-label="Close">Close ✕</button></div><div class="rzoombody"></div>';
      document.body.appendChild(box);
      box.querySelector(".rzoomx").addEventListener("click", hideZoom);
    }
    const body = box.querySelector(".rzoombody"); body.innerHTML = ""; body.appendChild(c);
    body.style.aspectRatio = (vb[2] / vb[3]).toFixed(3);
    document.querySelectorAll(".rzoomed").forEach((x) => x.classList.remove("rzoomed"));
    el.classList.add("rzoomed");
  }
  function hideZoom() { const z = document.querySelector(".rzoom"); if (z) z.remove(); document.querySelectorAll(".rzoomed").forEach((x) => x.classList.remove("rzoomed")); }
  document.addEventListener("pointerdown", (e) => {
    const z = zoomTarget(e.target); zoomTap = z ? { z, x: e.clientX, y: e.clientY, t: Date.now() } : null;
  }, true);
  document.addEventListener("pointerup", (e) => {
    const zt = zoomTap; zoomTap = null;
    if (!zt || Math.hypot(e.clientX - zt.x, e.clientY - zt.y) > 8 || Date.now() - zt.t > 700) return;
    // the map may have re-rendered under the finger; find the same box again
    let { svg, el } = zt.z;
    if (!el.isConnected) {
      const cap = el.dataset.cap, pin = el.dataset.pin, fi = el.dataset.fi;
      const n = cap != null ? document.querySelector(`svg.recallsvg:not(.thumb):not(.rzoomsvg) .rcard[data-cap="${cap}"][data-pin="${pin}"]`) : document.querySelector(`svg.recallsvg:not(.thumb):not(.rzoomsvg) .rfact[data-fi="${fi}"]`);
      if (!n) return; el = n; svg = n.closest("svg");
    }
    showZoom(svg, el);
  }, true);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") hideZoom(); });

  W.OB_STUDY = Object.assign(API(), { open, screen, hasPage, listPages, thumb, preparePrint, state: ST, afterRender });
})();
