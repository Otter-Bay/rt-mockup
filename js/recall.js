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
    const related = (opts.related || []).filter((r) => r !== k && W.SCALES[r]).slice(0, 2).map((r) => W.SCALES[r].title);
    return { k, title: plain(card.title), intro: plain(card.intro), note: plain(card.note), src: plain(card.src), field: card.field || "rt",
      heads: tbs.map((t) => t.heads), facts, abbrs: abbrsOn(card), related, q: opts.q || "", answer: opts.answer || "" };
  }

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
  function recallSvg(m, opts) {
    opts = opts || {};
    const practice = opts.mode === "practice", scr = !!opts.screen;
    const Wd = scr ? 400 : 612, M = scr ? 14 : 22;
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
    const FW = Wd - 2 * M, rows = [];
    const links = [...m.abbrs.map((a) => `${a.abbr} = ${a.meaning}`), ...m.related.map((t) => "See also: " + t)];
    if (links.length) rows.push({ h: 20 * (scr ? 2 : 1), links: true });
    if (m.note) { const t = lines(0, 0, (practice ? "⚠ Remember:" : "⚠ Remember: " + m.note), 9, FW, "", 11.5); rows.push({ h: t.h + 5, text: practice ? "⚠ Remember:" : "⚠ Remember: " + m.note, fs: 9, fill: "#24313E", line: practice }); }
    const used = [...new Set(m.facts.map((f) => f.sev).filter(Boolean))];
    if (used.length) rows.push({ h: 16, key: true });
    const steps = "How to use: 1) Draw your own picture around each fact (odd or funny sticks best). 2) Later, print Practice and fill it in from memory. 3) Check it against Filled and add what you missed in another color.";
    const why = "Why it works: drawing and making your own notes, then recalling them, help memory (Wammes et al. 2016; Slamecka & Graf 1978; Roediger & Karpicke 2006).";
    const src = "Source: " + (m.src || "Otter Bay") + ". Written by Otter Bay in our own words. For learning only; follow your facility's protocols.";
    [[steps, 8.2, "#24313E"], [why, 7.2, "#5A6670"], [src, 7.2, "#5A6670"]].forEach(([t, fs, fill]) => rows.push({ h: lines(0, 0, t, fs, FW, "", fs * 1.3).h + 3, text: t, fs, fill }));
    const foot = rows.reduce((a, r) => a + r.h, 0) + 16;
    // the drawing area: screen keeps the text full size and grows taller; print shrinks first, then grows (and print fits the page)
    let H = scr ? 640 : 792, out = null;
    const SCALES = scr ? [1.15, 1.08, 1] : [1.45, 1.3, 1.18, 1.08, 1, 0.93, 0.86, 0.8, 0.74, 0.68, 0.62, 0.58];
    for (let grow = 0; grow < (scr ? 24 : 8) && !out; grow++, H = Math.round(H * (scr ? 1.12 : 1.18)))
      for (const s of SCALES) { out = layout(m, opts, s, Wd, H, M, head, foot); if (out) { out.H = H; break; } }
    if (!out) return "";
    const { boxes, x0, y0, x1, y1, s, title } = out;
    H = out.H;
    const cu = opts.custom || {}, uid = "r" + (++SVGN);
    boxes.forEach((b, i) => { const mv = (cu.moves || {})[i]; if (!mv) return; ["x1", "x2", "cx1", "cx2"].forEach((q) => { b[q] += mv[0]; }); ["y1", "y2", "cy1", "cy2"].forEach((q) => { b[q] += mv[1]; }); });
    H = out.H;
    const ang = Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI;
    let g = "";
    // the slash
    g += `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="${BAY}" stroke-width="4" stroke-linecap="round"/>`;
    g += `<circle cx="${x0}" cy="${y0}" r="5" fill="${BAY}"/><path d="M${x1} ${y1}l-14 1 6 9z" fill="${BAY}" transform="rotate(${ang + 135} ${x1} ${y1})" opacity="0"/>`;
    g += `<text x="${title.x}" y="${title.y}" transform="rotate(${ang} ${title.x} ${title.y})" font-size="${title.fs}" font-weight="700" fill="${BAY}">${esc(title.text)}</text>`;
    boxes.forEach((b, i) => {
      const f = b.f, sv = SEV[f.sev], col = sv ? sv.c : TIDE;
      const st = (cu.stickers || {})[i];
      // branch from the slash to the fact (follows the fact when the learner moves it)
      const ex = Math.abs(b.ax - b.cx1) < Math.abs(b.ax - b.cx2) ? b.cx1 : b.cx2, ey = Math.min(Math.max(b.ay, b.cy1 + 6), b.cy2 - 6);
      g += `<path d="M${b.ax} ${b.ay}Q${(b.ax + ex) / 2} ${b.ay} ${ex} ${ey}" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round"/><circle cx="${b.ax}" cy="${b.ay}" r="3.2" fill="${col}"/>`;
      g += `<g class="rfact${opts.sel === i ? " sel" : ""}" data-fi="${i}">`;
      // the draw-your-own space
      g += `<clipPath id="${uid}c${i}"><rect x="${b.x1}" y="${b.y1}" width="${b.x2 - b.x1}" height="${b.y2 - b.y1}" rx="12"/></clipPath>`;
      g += `<rect class="rspace" x="${b.x1}" y="${b.y1}" width="${b.x2 - b.x1}" height="${b.y2 - b.y1}" rx="12" fill="${opts.builder ? "#fff" : "none"}" fill-opacity="${opts.builder ? ".01" : "0"}" stroke="${opts.sel === i ? BAY : "#A9B4BD"}" stroke-width="${opts.sel === i ? 2 : 1}" stroke-dasharray="4 4"/>`;
      const ix = (b.cx1 - b.x1) * 0.45, iy = (b.cy1 - b.y1) * 0.4;
      const hr = [b.cx1 - ix, b.cy1 - iy, b.cx2 - b.cx1 + 2 * ix, b.cy2 - b.cy1 + 2 * iy];
      if (st && SHAPES[st.shape]) g += `<g clip-path="url(#${uid}c${i})">${SHAPES[st.shape](...hr, st.c || col).replace(/stroke-width="1.6"/g, 'stroke-width="2.4"')}</g>`;
      else if (opts.ideas) g += `<g opacity=".55" clip-path="url(#${uid}c${i})">${SHAPES[f.idea.shape](...hr, col)}</g>`;
      // the fact itself
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
      const tip = st || opts.custom ? "" : opts.ideas ? `Idea: ${f.idea.tip}. Or draw your own.` : "✎ Draw something that reminds you of this";
      if (tip) g += `<text x="${b.x2 - 8}" y="${b.y2 - 6}" text-anchor="end" font-size="${7.2 * Math.min(Math.max(s, .8), 1.2)}" font-style="italic" fill="#8A959E">${esc(tip)}</text>`;
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
          ft += `<path d="M${x0} ${y0}Q${(x0 + lx + tw / 2) / 2} ${(y0 + ly) / 2 - 8} ${lx + tw / 2} ${ly - 6}" fill="none" stroke="#7A8791" stroke-width="1" stroke-dasharray="1.5 3"/>`;
          ft += `<rect x="${lx}" y="${ly - 6}" width="${tw}" height="14" rx="7" fill="#fff" stroke="#7A8791" stroke-dasharray="1.5 2.5"/><text x="${lx + 7}" y="${ly + 4}" font-size="8" fill="#24313E">${esc(clip(t, tw - 12, 8))}</text>`;
          lx += tw + 6;
        });
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
    return `<svg class="recallsvg${scr ? " screen" : ""}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Wd} ${H}" width="${Wd}" height="${H}" font-family="Helvetica, Arial, sans-serif" role="img" aria-label="Recall map: ${esc(m.title)}">` +
      `<rect width="${Wd}" height="${H}" fill="#fff"/>${hd}${g}${ft}</svg>`;
  }
  let SVGN = 0, LAST = null;
  const inkPath = (k) => k.pts && k.pts.length > 1 ? `<path class="rink" d="M${k.pts.map((p) => p[0].toFixed(1) + " " + p[1].toFixed(1)).join("L")}" fill="none" stroke="${k.c}" stroke-width="${k.w || 2.6}" stroke-linecap="round" stroke-linejoin="round"/>` : "";
  const clip = (t, maxW, fs) => { t = String(t); if (textW(t, fs) <= maxW) return t; while (t.length > 4 && textW(t + "…", fs) > maxW) t = t.slice(0, -1); return t.trimEnd() + "…"; };

  // Place each fact's space along the slash, alternating sides where it fits; null if it doesn't fit at this scale.
  function layout(m, opts, s, Wd, H, M, head, foot) {
    const top = head + 6, bot = H - foot - 10;
    const x0 = M + 14, y0 = bot, x1 = Wd - M - 8, y1 = top + 4;
    const slashX = (y) => x0 + (x1 - x0) * (y0 - y) / (y0 - y1);
    const lfs = 11.5 * s, dfs = 9.6 * s, pad = 6 * s, spX = 22 * s, spT = 24 * s, spB = 20 * Math.max(s, .8);   // roomy spaces to draw in
    const practice = opts.mode === "practice";
    const title = { text: m.title, fs: 14 * Math.min(Math.max(s, .8), 1.15) };
    const titleLen = textW(m.title, title.fs, true);
    const along = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / along, uy = (y1 - y0) / along;
    title.x = x0 + ux * 16 + uy * 7; title.y = y0 + uy * 16 - ux * 7;   // start near the bottom, just above the line
    const obst = [];
    for (let d = 10; d < titleLen + 20; d += 14) { const px = x0 + ux * d, py = y0 + uy * d; obst.push([px - 9, py - title.fs - 8, px + 9, py + 2]); }
    const placed = [];
    const hits = (r) => r[0] < M || r[2] > Wd - M || r[1] < top || r[3] > bot || placed.concat(obst).some((o) => r[0] < o[2] + 5 && r[2] > o[0] - 5 && r[1] < o[3] + 5 && r[3] > o[1] - 5);
    const boxes = [];
    let t = 0.02, pref = "down";
    for (const f of m.facts) {
      let done = null;
      const sizes = [258, 228, 290, 198, 172].map((bw) => {
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
        return { bw, label, lines, ch, h: ch + spT + spB };
      });
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
      boxes.push({ f, side, ax, ay: Math.min(Math.max(ay, cy1 + 4), cy2 - 4), x1: r[0], y1: r[1], x2: r[2], y2: r[3], cx1, cx2, cy1, cy2, label: z.label, lines: z.lines, lfs, dfs, pad });
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
      ${m.note ? `<p class="ts-note"><b>Remember:</b> ${practice ? '<span class="ts-blankline"></span>' : esc(m.note)}</p>` : ""}
      ${m.abbrs.length ? `<p class="ts-abbrs"><b>Abbreviations:</b> ${m.abbrs.map((a) => `${esc(a.abbr)} = ${esc(a.meaning)}`).join("; ")}</p>` : ""}
      <div class="ts-mynotes"><b>My notes</b>${"<span></span>".repeat(long ? 2 : 5)}</div>
      <footer>Source: ${esc(m.src || "Otter Bay")}. Written by Otter Bay in our own words. For learning only; follow your facility's protocols.</footer>
    </article>`;
  }

  function API() { return { model, recallSvg, traditionalHtml, layout, severity, idea, tables, SHAPES, SEV, WHY, plain, last: () => LAST }; }

  // ======================= Screen: the study-sheet page inside Ask (browser only) =======================
  if (typeof document === "undefined") { W.OB_STUDY = API(); return; }
  const STYLE_KEY = "obStudyStyle", PAGE_KEY = (k) => `obStudyPage:${EXAM}:${k}`;
  const ld = (key, d) => { try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? d : v; } catch (e) { return d; } };
  const sv = (key, v) => { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) {} };
  const pref = ld(STYLE_KEY, {});
  const ST = { k: null, q: "", answer: "", related: [], hit: null, style: pref.style || "map", map: pref.map || "hand", mode: "filled", ideas: false,
    tool: "draw", color: "#C62828", sel: null, zoom: false, celebrate: false, msg: "" };
  const savePref = () => sv(STYLE_KEY, { style: ST.style, map: ST.map });
  const getPage = (k) => ld(PAGE_KEY(k), null);
  const blankPage = () => ({ ink: [], stickers: {}, moves: {}, hist: [], done: false, at: Date.now() });
  let PG = null;
  const savePage = () => { if (!ST.k || !PG) return; PG.at = Date.now(); PG.title = (W.SCALES[ST.k] || {}).title; sv(PAGE_KEY(ST.k), PG); };
  const hasPage = (k) => { const p = getPage(k); return !!(p && ((p.ink || []).length || Object.keys(p.stickers || {}).length || Object.keys(p.moves || {}).length)); };
  function listPages() {
    const out = [];
    try { for (let i = 0; i < localStorage.length; i++) { const key = localStorage.key(i); if (key && key.startsWith(`obStudyPage:${EXAM}:`)) { const k = key.split(":")[2]; if (W.SCALES[k] && hasPage(k)) out.push({ k, title: W.SCALES[k].title, at: (getPage(k) || {}).at || 0, done: !!(getPage(k) || {}).done }); } } } catch (e) {}
    return out.sort((a, b) => b.at - a.at);
  }
  const COLORS = [["#C62828", "Red"], ["#E65100", "Orange"], ["#B08900", "Gold"], ["#2E7D32", "Green"], ["#1565C0", "Blue"], ["#6A1B9A", "Purple"], ["#14222C", "Black"]];
  const STICKERS = [["syringe", "Syringe"], ["kettle", "Kettle"], ["gauge", "Gauge"], ["layers", "Layers"], ["bottle", "Bottle"], ["tube", "Tube"], ["bubble", "Bubble"],
    ["wing", "Wing"], ["hourglass", "Venturi tube"], ["runner", "Runner"], ["lungs", "Lungs"], ["heart", "Heart"], ["drop", "Drop"], ["brain", "Cloud"], ["moon", "Moon"], ["clock", "Clock"], ["thermo", "Thermometer"], ["shield", "Shield"]];
  const PROMPTS = ["What does “{f}” remind you of? Draw it around the box.", "Picture “{f}” at the bedside. What would you see?",
    "Odd and funny sticks best. What silly picture fits “{f}”?", "If “{f}” were an object, what would it be?"];
  const mdl = (k) => model(k || ST.k, { hit: ST.hit, q: ST.q, answer: ST.answer, related: ST.related });
  function open(k, o) {
    o = o || {};
    ST.k = k; ST.q = o.q || ""; ST.answer = o.answer || ""; ST.related = o.related || []; ST.hit = o.hit || null;
    ST.sel = null; ST.mode = "filled"; ST.ideas = false; ST.celebrate = false; ST.msg = ""; ST.zoom = false;
    if (o.build) { ST.style = "map"; ST.map = "build"; }
    PG = getPage(k) || blankPage();
  }
  // Which facts have a picture yet (a sticker, or a line drawn in or across their space)
  function decorated(m) {
    recallSvg(m, { custom: PG, builder: true, screen: true });
    const bx = (LAST && LAST.boxes) || [];
    return bx.map((b, i) => !!(PG.stickers[i]) || PG.ink.some((k) => k.pts.some((p) => p[0] >= b.x1 - 6 && p[0] <= b.x2 + 6 && p[1] >= b.y1 - 6 && p[1] <= b.y2 + 6)));
  }
  const seg = (act, cur, items) => `<div class="stseg" role="group">${items.map(([v, t]) => `<button type="button" data-act="${act}" data-v="${v}" aria-pressed="${cur === v}" class="${cur === v ? "on" : ""}">${t}</button>`).join("")}</div>`;
  function whyBox() {
    return `<details class="stwhy"><summary>Why this works</summary><p>${esc(WHY.text)}</p><ol>${WHY.refs.map(([t, u]) => `<li>${esc(t)} <a href="${u}" target="_blank" rel="noopener">${u.replace("https://", "")}</a></li>`).join("")}</ol></details>`;
  }
  function screen() {
    const m = mdl(); if (!m) return "";
    let h = `<section class="stsheet" id="askRes"><div class="sthead"><button type="button" class="stback" data-act="stback">‹ Back to the answer</button>
      <h2>Study sheet</h2><p class="stsub">Print the topic you asked about: <b>${esc(m.title)}</b></p></div>
      <div class="stpick"><p class="asklabel">Style</p>${seg("ststyle", ST.style, [["map", "Recall map"], ["trad", "Traditional"]])}`;
    if (ST.style === "map") h += seg("stmap", ST.map, [["hand", "Draw on paper"], ["build", "Build it here"]]);
    h += whyBox() + `</div>`;
    if (ST.style === "trad" || ST.map === "hand") {
      h += `<div class="stopts">${seg("stmode", ST.mode, [["filled", "Filled"], ["practice", "Practice (blanks)"]])}
        ${ST.style === "map" ? `<label class="stchk"><input type="checkbox" data-act="stideas" ${ST.ideas ? "checked" : ""}> Show ideas (a starter picture)</label>` : ""}
        <p class="sthelp">${ST.mode === "practice" ? "Fill it in from memory, then switch to Filled and check. Add what you missed in another color." : ST.style === "map" ? "Each fact has an empty space. Draw your own picture around it after you print." : "A plain page with the full table, ready to print."}</p></div>`;
      h += `<button type="button" class="stprint" data-act="stprint">${PRINTICON}<span>Print this sheet</span></button>`;
      h += `<div class="stpaper ${ST.zoom ? "zoom" : ""}">${ST.style === "map" ? recallSvg(m, { mode: ST.mode, ideas: ST.ideas, screen: true }) : traditionalHtml(m, { mode: ST.mode })}</div>
        <button type="button" class="stzoom" data-act="stzoom">${ST.zoom ? "Fit to screen" : "Zoom in"}</button>`;
    } else h += builder(m);
    return h + `</section>`;
  }
  function builder(m) {
    const dec = decorated(m), n = dec.length, got = dec.filter(Boolean).length;
    const next = m.facts[dec.findIndex((d) => !d)];
    if (got === n && n && !PG.done) { PG.done = true; ST.celebrate = true; savePage(); }
    const prompt = ST.msg || (next ? PROMPTS[(m.facts.indexOf(next) + PG.ink.length) % PROMPTS.length].replace("{f}", next.label) : "Every fact has a picture. Print it, then try Practice from memory tomorrow.");
    const tools = [["look", "👀 Look"], ["draw", "✏️ Draw"], ["sticker", "⭐ Stickers"], ["move", "✋ Move"]];
    let h = `<div class="stbuild"><p class="stprompt" aria-live="polite">${esc(prompt)}</p>
      <div class="sttools">${seg("sttool", ST.tool, tools)}</div>
      <div class="stcolors" role="group" aria-label="Color">${COLORS.map(([c, t]) => `<button type="button" data-act="stcolor" data-c="${c}" aria-label="${t}" aria-pressed="${ST.color === c}" class="${ST.color === c ? "on" : ""}" style="--c:${c}"></button>`).join("")}</div>`;
    if (ST.tool === "sticker") h += `<p class="sthelp">${ST.sel == null ? "Tap a fact on the page, then pick a starter shape for it. Then make it yours with Draw." : `Pick a shape for “${esc(m.facts[ST.sel].label)}”.`}</p>
      <div class="ststickers">${STICKERS.map(([sh, t]) => `<button type="button" data-act="ststicker" data-s="${sh}" aria-label="${t}"><svg viewBox="-30 -30 120 90" width="54" height="40" aria-hidden="true">${SHAPES[sh](0, 0, 60, 30, ST.color)}</svg><span>${t}</span></button>`).join("")}
      <button type="button" data-act="ststicker" data-s="" aria-label="No shape"><span class="none">✕</span><span>None</span></button></div>`;
    if (ST.tool === "move") h += `<p class="sthelp">Drag a fact to where it makes sense to you. Its branch follows.</p>`;
    if (ST.tool === "draw") h += `<p class="sthelp">Draw with your finger or mouse right on the page.</p>`;
    h += `<div class="stpaper builder tool-${ST.tool} ${ST.zoom ? "zoom" : ""}">${recallSvg(m, { custom: PG, builder: true, screen: true, sel: ST.tool === "sticker" ? ST.sel : null }).replace('class="recallsvg', 'class="recallsvg builder')}</div>
      <div class="strow"><button type="button" data-act="stzoom">${ST.zoom ? "Fit to screen" : "Zoom in"}</button><button type="button" data-act="stundo" ${PG.hist.length ? "" : "disabled"}>↶ Undo</button><button type="button" data-act="stclear">Clear</button></div>
      <p class="stprog"><span class="stbar"><i style="width:${n ? Math.round(100 * got / n) : 0}%"></i></span>${got} of ${n} facts have a picture${PG.done ? ' · <b>🏅 Page built!</b>' : ""}</p>
      <button type="button" class="stprint" data-act="stprint">${PRINTICON}<span>Print my page</span></button>
      <p class="sthelp">Saved on this device as you go. Ask about this topic again and your page comes back.</p></div>`;
    if (ST.celebrate) { ST.celebrate = false; h += `<div class="stconfetti" aria-hidden="true">${Array.from({ length: 28 }, (_, i) => `<i style="--x:${(i * 37) % 100}vw;--d:${(i % 7) * 0.09}s;--c:${COLORS[i % COLORS.length][0]}"></i>`).join("")}</div>
      <div class="stbadge" role="status">🏅 Page built! Every fact has your own picture.</div>`; }
    return h;
  }
  const PRINTICON = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 14h12v7H6z"/></svg>';
  // The page to print, exactly as chosen (or built).
  function printHtml() {
    const m = mdl();
    if (ST.style === "trad") return traditionalHtml(m, { mode: ST.mode });
    if (ST.map === "build") return recallSvg(m, { custom: PG, screen: true });   // same layout as the builder, so the drawing lines up
    return recallSvg(m, { mode: ST.mode, ideas: ST.ideas });
  }
  function preparePrint() {
    let el = document.getElementById("obPrint");
    if (!el) { el = document.createElement("div"); el.id = "obPrint"; document.body.appendChild(el); }
    el.innerHTML = printHtml();
    document.documentElement.classList.add("obprinting");
    return el;
  }
  window.addEventListener("afterprint", () => document.documentElement.classList.remove("obprinting"));
  function thumb(k) {
    const p = getPage(k); if (!p) return "";
    const keep = PG, kk = ST.k; PG = p; ST.k = k;
    const svg = recallSvg(model(k, {}), { custom: p, screen: true });
    PG = keep; ST.k = kk;
    return svg.replace('class="recallsvg', 'class="recallsvg thumb');
  }
  // Drawing and dragging on the page
  let pen = null, drag = null;
  const svgPt = (svg, e) => { const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const r = pt.matrixTransform(svg.getScreenCTM().inverse()); return [r.x, r.y]; };
  document.addEventListener("pointerdown", (e) => {
    const svg = e.target.closest && e.target.closest("svg.recallsvg.builder"); if (!svg || !PG) return;
    const p = svgPt(svg, e), fact = e.target.closest(".rfact"), fi = fact ? Number(fact.dataset.fi) : null;
    if (ST.tool === "draw") {
      e.preventDefault();
      const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
      el.setAttribute("fill", "none"); el.setAttribute("stroke", ST.color); el.setAttribute("stroke-width", "2.6"); el.setAttribute("stroke-linecap", "round"); el.setAttribute("stroke-linejoin", "round");
      svg.appendChild(el); pen = { svg, el, k: { c: ST.color, w: 2.6, pts: [p] } };
      try { svg.setPointerCapture(e.pointerId); } catch (x) {}
    } else if (ST.tool === "move" && fi != null) {
      e.preventDefault(); drag = { svg, fact, i: fi, p0: p, m0: PG.moves[fi] || [0, 0] };
      try { svg.setPointerCapture(e.pointerId); } catch (x) {}
    } else if ((ST.tool === "sticker" || ST.tool === "look") && fi != null) { ST.sel = fi; ST.tool = "sticker"; render(); }
  });
  document.addEventListener("pointermove", (e) => {
    if (pen) { const p = svgPt(pen.svg, e), l = pen.k.pts[pen.k.pts.length - 1]; if (Math.hypot(p[0] - l[0], p[1] - l[1]) < 1.5) return;
      pen.k.pts.push(p); pen.el.setAttribute("d", "M" + pen.k.pts.map((q) => q[0].toFixed(1) + " " + q[1].toFixed(1)).join("L")); }
    else if (drag) { const p = svgPt(drag.svg, e); drag.d = [p[0] - drag.p0[0], p[1] - drag.p0[1]]; drag.fact.setAttribute("transform", `translate(${drag.d[0]} ${drag.d[1]})`); }
  });
  const endPtr = () => {
    if (pen) { const k = pen.k; pen = null; if (k.pts.length > 1) { PG.ink.push(k); PG.hist.push({ t: "ink" }); ST.msg = ""; savePage(); } render(); }
    else if (drag) { const d = drag.d, i = drag.i, m0 = drag.m0; drag = null; if (d) { PG.hist.push({ t: "mv", i, prev: m0 }); PG.moves[i] = [m0[0] + d[0], m0[1] + d[1]]; savePage(); } render(); }
  };
  document.addEventListener("pointerup", endPtr); document.addEventListener("pointercancel", endPtr);

  W.PAGE_ACTIONS = Object.assign(W.PAGE_ACTIONS || {}, {
    ststyle: (b) => { ST.style = b.dataset.v; savePref(); },
    stmap: (b) => { ST.map = b.dataset.v; savePref(); },
    stmode: (b) => { ST.mode = b.dataset.v; },
    stideas: (b) => { ST.ideas = !!b.checked; },
    sttool: (b) => { ST.tool = b.dataset.v; ST.msg = ""; },
    stcolor: (b) => { ST.color = b.dataset.c; },
    stzoom: () => { ST.zoom = !ST.zoom; },
    ststicker: (b) => {
      if (ST.sel == null) { ST.msg = "Tap a fact on the page first, then pick its shape."; return; }
      PG.hist.push({ t: "st", i: ST.sel, prev: PG.stickers[ST.sel] || null });
      if (b.dataset.s) PG.stickers[ST.sel] = { shape: b.dataset.s, c: ST.color }; else delete PG.stickers[ST.sel];
      ST.msg = b.dataset.s ? "Nice start! Now make it yours: switch to Draw and add your own details." : ""; savePage();
    },
    stundo: () => { const h = PG.hist.pop(); if (!h) return;
      if (h.t === "ink") PG.ink.pop(); else if (h.t === "st") { if (h.prev) PG.stickers[h.i] = h.prev; else delete PG.stickers[h.i]; }
      else if (h.t === "mv") { if (h.prev[0] || h.prev[1]) PG.moves[h.i] = h.prev; else delete PG.moves[h.i]; }
      savePage(); },
    stclear: () => { if (!confirm("Clear your drawings, shapes and moves on this page?")) return false; PG = blankPage(); savePage(); },
    stprint: () => { preparePrint(); setTimeout(() => window.print(), 50); return false; },
  });

  W.OB_STUDY = Object.assign(API(), { open, screen, hasPage, listPages, thumb, preparePrint, state: ST });
})();
