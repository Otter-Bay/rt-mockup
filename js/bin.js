/* Memory Arcade ("Play to Learn"; first named the bin, until Ken renamed it, t136u to t140u) and its games (mockup).
   Code names (bin*, obBin storage keys) stay as they were so saved cards keep working.
   - One tap "Add to Arcade" flag on a practice question's reference card (after the answer) and on Ask answers. The flag holds the
     concept (the Ask card), so every question about Apgar lands on the same card.
   - Memory Arcade: each card shows its step (1 Make it, 2 Recall it, 3 Use it, then quick checks) and ONE Continue button. A short
     session runs 2 or 3 cards and ends with a small win. "Pick a different game" opens the games gallery.
   - Ten games, all with the same controls (tap a choice; Check / Next), score, streak, quick rounds, optional sound.
   - Mockup scope: games are built for three example cards, one per content type: Apgar (scoring grid), Gas laws (laws and
     relationships), Blood gas normals with Oxygenation indices (equations and numbers). Every clinical fact comes from those cards
     (js/scales.js); only the emoji, game wording and crossword clue phrasing are ours. Other flagged cards get step 1 (study page).
   Quick checks are spaced 1, 7 and 30 days apart; the mockup has a "pretend a day passed" link so it can be tried in one sitting.
   Pure data builders run in Node for tools/test_ask.js; the screen part needs a browser. */
(function () {
  const W = window, EXAM = W.EXAM || "RRT";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const rnd = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
  const rows = (k, t) => { const tb = W.OB_STUDY.tables((W.SCALES[k] || {}).body); return (tb[t || 0] || { rows: [], heads: [] }); };
  const short = (s) => String(s).replace(/\s*\(.*$/, "").replace(/'s (law|principle)$|\s+(law|principle)$/i, "");
  // MC options: the answer plus up to n-1 different distractors
  const opts = (a, pool, n) => shuffle([a, ...shuffle([...new Set(pool.filter((x) => x && x !== a))]).slice(0, (n || 4) - 1)]);

  // ---------- The three example cards ----------
  const EX = {
    apgar: { cat: "Scoring grid", rec: "table", use: "baby", tip: "In order, the rows spell A-P-G-A-R.", boss: ["👾", "The Fussy Monster"], icons: ["👶", "💓", "😖", "🤸", "🎺"],
      // a picture for each 0 / 1 / 2 description (rows follow the card): blue baby, pink with blue hands, all pink; no beat, slow, fast; ...
      cellIcons: [["🥶", "🧤", "🌸"], ["💔", "🐢", "🐇"], ["😐", "😬", "😭"], ["🧸", "🦐", "🥊"], ["😶", "😢", "📣"]],
      words: [["PINK", "Appearance scores 2: ___ all over"], ["BLUE", "Appearance scores 0: ___ or pale all over"], ["ABSENT", "Pulse or respiration that scores 0"],
        ["GRIMACE", "Reflex irritability that scores 1"], ["LIMP", "Muscle tone that scores 0"], ["FLEXION", "Activity scores 1: some ___"], ["CRY", "Respiration scores 2: good effort; strong ___"],
        ["SNEEZE", "Grimace scores 2: cry, cough, or ___"], ["TEN", "The highest total score"], ["FIVE", "Apgar is scored at 1 and ___ minutes after birth"]] },
    gaslaws: { cat: "Laws and relationships", rec: "match", use: "case", boss: ["🐙", "The Pressure Kraken"], icons: ["💉", "🫖", "🌡️", "🎂", "🥤", "🚰", "🫧", "✈️", "⏳", "🏃"], bIcons: ["🗜️", "🎈", "🧯", "➕", "💧", "🐍", "🔵", "💨", "🌪️", "⚖️"], heldIcons: { Temperature: "🔥", Pressure: "🎈", Volume: "📦", "Not applicable": "➖" },
      words: [["BOYLE", "P1V1 = P2V2"], ["CHARLES", "V1/T1 = V2/T2"], ["DALTON", "Total pressure = the sum of each gas's partial pressure"], ["HENRY", "Dissolved gas rises with that gas's partial pressure"],
        ["LAPLACE", "Pressure in a bubble = 2 × surface tension ÷ radius"], ["GRAHAM", "Diffusion rate is inversely proportional to the square root of gram molecular weight"],
        ["VENTURI", "A gradual widening after a narrowing restores pressure so a jet can entrain a second gas"], ["BERNOULLI", "As gas speeds up through a narrowing, its lateral pressure falls"],
        ["KELVIN", "Gas-law math uses temperature in ___ (°C + 273)"], ["SIXTEEN", "Halve an airway's radius and resistance goes up ___ times"]] },
    abg: { cat: "Equations and numbers", rec: "blanks", use: "calc", boss: ["🐉", "The Acid Dragon"], icons: ["🧪", "💨", "🧁", "⚖️", "🫁", "🩸"], oxyIcons: ["➗", "🎈", "📏"], bIcons: ["🍋", "🌫️", "🧂", "🎚️", "🌬️", "❤️", "✖️", "➖", "📐"],
      words: [["WINTERS", "Formula for the expected PaCO2 in metabolic acidosis"], ["SHUNT", "The A–a gradient widens with V/Q mismatch, ___, or diffusion problems"], ["AGE", "The A–a gradient rises with ___"],
        ["NORMAL", "The A–a gradient in pure hypoventilation"], ["GRADIENT", "PAO2 − PaO2 = the A–a ___"], ["FORTYSEVEN", "Subtract this from PB in the PAO2 equation"],
        ["ANIONGAP", "Na+ − (Cl- + HCO3-)"], ["SEVEN", "Normal pH starts with ___ point three five"], ["HUNDRED", "PAO2 at sea level on room air is about one ___ mm Hg"]] },
  };
  // Sleep examples (Ken, t126u to t129u): Build the Table row order is a per-card setting. order: true means the rows must go in
  // sequence (AHI runs normal to severe); otherwise any row label can go in any row and that row's cells must match it.
  // These two use only the table-style games; facts come from the ahi and staging cards (the short hallmarks are cut from the card text).
  EX.ahi = { cat: "Classification, in order", rec: "table", useGame: "sort", order: true, simple: true, boss: ["🦛", "The Snore Hippo"], games: ["table", "match", "sort", "attack", "blanks", "bingo", "escape", "boss"],
    icons: ["😴", "🙂", "😐", "😫"], bIcons: ["🟢", "🟡", "🟠", "🔴"], tones: [2, 1, 0, 4], swap: true };
  EX.staging = { cat: "Classification, any order", rec: "table", useGame: "blanks", simple: true, boss: ["🦉", "The Night Owl"], games: ["table", "match", "sort", "attack", "blanks", "bingo", "escape", "boss"],
    icons: ["☀️", "🥱", "🧵", "🌊", "👁️"], bIcons: ["👓", "〰️", "🌀", "🐋", "🪚"], tones: [2, 1, 0, 3, 4],
    short: ["Alpha (8–13 Hz) over the occipital region in more than half the epoch", "Alpha replaced by low-amplitude 4–7 Hz activity", "K-complex (not tied to an arousal) or sleep spindle (11–16 Hz, 0.5 s or more)",
      "Slow-wave activity (0.5–2 Hz, 75 µV or more, frontal) in more than 20% of the epoch", "Low-amplitude mixed-frequency EEG, rapid eye movements, lowest chin tone"] };
  const ALIAS = { oxy: "abg" };
  const exKey = (k) => (EX[k] ? k : ALIAS[k]) || null;

  // ---------- Facts from the cards, shaped for games ----------
  // pairs: prompt (a, with an icon) and answer (b). table: headers and cells. sort: columns and items. qs(): multiple-choice questions.
  const num = (s) => Number(String(s).replace("−", "-").replace("+", ""));
  function data(k0) { const D = data0(k0); if (D) deco(D); return D; }
  function data0(k0) {
    const k = exKey(k0); if (!k) return null;
    const E = EX[k], card = W.SCALES[k], title = W.OB_STUDY.plain(card.title);
    if (E.simple) return simple(k, E, card);
    if (k === "apgar") {
      const t = rows("apgar"), signs = t.rows.map((r) => short(r[0])), cols = t.heads.slice(1);
      const pairs = []; t.rows.forEach((r, i) => cols.forEach((c, j) => pairs.push({ a: `${signs[i]} · scores ${c}`, icon: E.icons[i], b: r[j + 1], bicon: E.cellIcons[i][j], tone: j, row: i, col: j })));
      return { k, E, title, pairs, table: { corner: "Sign", rowHeads: signs.map((s, i) => ({ t: s, icon: E.icons[i] })), colHeads: cols.map((c, j) => ({ t: c, tone: j })), cells: t.rows.map((r) => r.slice(1)), cellIcons: E.cellIcons, cellTone: t.rows.map(() => [0, 1, 2]) },
        sort: { cols: cols.map((c) => "Scores " + c), items: pairs.map((p) => ({ t: `${p.bicon} ${signs[p.row]}: ${p.b}`, col: p.col, tone: p.tone })) },
        oddRound() { const c = rnd(0, 2), same = shuffle(pairs.filter((p) => p.col === c)).slice(0, 3), odd = pick(pairs.filter((p) => p.col !== c && !same.some((s) => s.row === p.row && s.b === p.b)));
          return { q: "Three of these score the same. Which one doesn't?", tiles: shuffle([...same.map((p) => ({ t: `${p.bicon} ${signs[p.row]}: ${p.b}`, odd: false })), { t: `${odd.bicon} ${signs[odd.row]}: ${odd.b}`, odd: true }]), why: `The other three score ${cols[c]}; “${odd.b}” scores ${cols[odd.col]} for ${signs[odd.row]}.` }; },
        qs() { return shuffle(pairs).map((p) => Math.random() < 0.6
          ? { p: `${p.icon} ${signs[p.row]} scores ${cols[p.col]}: ___`, a: p.b, o: opts(p.b, [...pairs.filter((x) => x.row === p.row).map((x) => x.b), pick(pairs).b]) }
          : { p: `${p.icon} ${signs[p.row]}: “${p.b}” scores how many points?`, a: cols[p.col], o: cols.slice() }); },
        note: W.OB_STUDY.plain(card.note) };
    }
    if (k === "gaslaws") {
      const t = rows("gaslaws"), laws = t.rows.map((r) => r[0]);
      const pairs = t.rows.map((r, i) => ({ a: short(r[0]), icon: E.icons[i], b: r[1], ex: r[3], held: r[2], row: i }));
      const held = [...new Set(t.rows.map((r) => r[2]))];
      return { k, E, title, pairs, table: { corner: "Law", rowHeads: pairs.map((p) => ({ t: p.a, icon: p.icon })), colHeads: [{ t: "Held constant" }], cells: pairs.map((p) => [p.held]), cellIcons: pairs.map((p) => [E.heldIcons[p.held]]), cellTone: pairs.map((p) => [held.indexOf(p.held)]) },
        sort: { cols: held, items: pairs.map((p) => ({ t: `${p.icon} ${laws[p.row]}`, col: held.indexOf(p.held), tone: held.indexOf(p.held) })) },
        oddRound() { const na = shuffle(pairs.filter((p) => p.held === "Not applicable")).slice(0, 3), odd = pick(pairs.filter((p) => p.held !== "Not applicable"));
          return { q: "Three of these laws don't hold anything constant. Which one does?", tiles: shuffle([...na.map((p) => ({ t: `${p.icon} ${laws[p.row]}`, odd: false })), { t: `${odd.icon} ${laws[odd.row]}`, odd: true }]), why: `${laws[odd.row]} holds ${odd.held.toLowerCase()} constant.` }; },
        qs() { const L = laws.map(short); return shuffle(pairs).flatMap((p) => [
          { p: `Which law? “${p.b}”`, a: short(laws[p.row]), o: opts(short(laws[p.row]), L) },
          { p: `At the bedside: “${p.ex}”. Which law?`, a: short(laws[p.row]), o: opts(short(laws[p.row]), L) },
          ...(p.held !== "Not applicable" ? [{ p: `${p.icon} ${laws[p.row]} holds ___ constant`, a: p.held, o: opts(p.held, held.filter((h) => h !== "Not applicable")) }] : [])]).slice(0, 14); },
        note: W.OB_STUDY.plain(card.note) };
    }
    // abg + oxy
    const n = rows("abg", 0), c = rows("abg", 1), o = rows("oxy", 0);
    const pairs = n.rows.map((r, i) => ({ a: `Normal ${r[0]}`, icon: E.icons[i], b: r[1], row: i }))
      .concat(o.rows.slice(0, 3).map((r, i) => ({ a: `${r[0]} formula`, icon: E.oxyIcons[i], b: r[1], row: 6 + i, interp: r[2] })));
    const ranges = n.rows.map((r) => { const m = r[1].replace(/%/g, "").match(/([−+-]?[\d.]+)\s*to\s*([−+-]?[\d.]+)/); return { name: r[0], lo: num(m[1]), hi: num(m[2]), unit: (r[1].match(/(mm Hg|mEq\/L|%)/) || [""])[0], dec: /\./.test(m[1]) ? 2 : 0 }; });
    // a made-up value for Speed Sort / Odd One Out: 0 below the card's normal range, 1 inside it, 2 above it (SaO2 has no "too high")
    const value = (want) => {
      const R = pick(ranges.filter((r) => want !== 2 || r.name !== "SaO2")), d = R.dec, step = d ? 0.01 : 1, span = Math.max(R.hi - R.lo, d ? 0.1 : 10);
      let v = want === 1 ? R.lo + Math.random() * (R.hi - R.lo) : want === 0 ? R.lo - (0.2 + Math.random() * 0.6) * span : R.hi + (0.2 + Math.random() * 0.6) * span;
      v = Math.round(v / step) * step;
      if (want === 1) v = Math.min(Math.max(v, R.lo), R.hi); else if (want === 0) v = Math.min(v, R.lo - step); else v = Math.max(v, R.hi + step);
      const sv = (v > 0 && R.name === "Base excess" ? "+" : "") + v.toFixed(d).replace("-", "−");
      return { t: `${R.name} ${sv}${R.unit === "%" ? "%" : R.unit ? " " + R.unit : ""}`, v, name: R.name, col: want, why: `Normal ${R.name}: ${n.rows[ranges.indexOf(R)][1]}` };
    };
    return { k, E, title: "Blood gas normals and oxygenation", pairs, ranges, value, comp: c.rows,
      table: { corner: "Value", rowHeads: n.rows.map((r, i) => ({ t: r[0], icon: E.icons[i] })), colHeads: [{ t: "Normal range" }], cells: n.rows.map((r) => [r[1]]) },
      sort: { cols: ["Too low", "Normal", "Too high"], gen: () => value(rnd(0, 2)) },
      oddRound() { const ok = []; while (ok.length < 3) { const v = value(1); if (!ok.some((x) => x.name === v.name)) ok.push(v); } const bad = value(Math.random() < 0.5 ? 0 : 2);
        return { q: "Three are normal. Which one isn't?", tiles: shuffle([...ok.map((v) => ({ t: v.t, odd: false })), { t: bad.t, odd: true }]), why: bad.why }; },
      qs() { const nb = n.rows.map((r) => r[1]), cb = c.rows.map((r) => r[1]), ob = o.rows.map((r) => r[1]);
        return shuffle([...n.rows.map((r, i) => ({ p: `${E.icons[i]} Normal ${r[0]}: ___`, a: r[1], o: opts(r[1], nb) })),
          ...c.rows.map((r) => ({ p: `${r[0]}: expected compensation?`, a: r[1], o: opts(r[1], cb, 3) })),
          ...o.rows.slice(0, 3).map((r, i) => ({ p: `${E.oxyIcons[i]} ${r[0]} = ___`, a: r[1], o: opts(r[1], ob) }))]); },
      note: W.OB_STUDY.plain(card.note) };
  }

  // a two-column card as table, pairs, sort and quick questions (AHI: rows are the severity, cells the AHI range)
  function simple(k, E, card) {
    const t = rows(k), head = E.swap ? [t.heads[1], t.heads[0]] : t.heads;
    const R2 = t.rows.map((r, i) => E.swap ? [r[1], r[0]] : [r[0], E.short ? E.short[i] : r[1]]);
    const pairs = R2.map((r, i) => ({ a: r[0], icon: E.icons[i], b: r[1], bicon: E.bIcons[i], tone: E.tones[i], row: i }));
    const cols = R2.map((r) => r[0]);
    const sort = k === "ahi" ? { cols, gen: () => { const i = rnd(0, 3), v = rnd([0, 5, 15, 30][i], [4, 14, 29, 80][i]); return { t: `AHI ${v} events/hour`, col: i, why: `${R2[i][0]}: ${R2[i][1]}` }; } }
      : { cols, items: pairs.map((p) => ({ t: `${p.bicon} ${p.b}`, col: p.row, tone: p.tone })) };
    return { k, E, title: W.OB_STUDY.plain(card.title), pairs, sort,
      table: { corner: head[0], rowHeads: pairs.map((p) => ({ t: p.a, icon: p.icon })), colHeads: [{ t: head[1] }], cells: pairs.map((p) => [p.b]), cellIcons: pairs.map((p) => [p.bicon]), cellTone: pairs.map((p) => [p.tone]) },
      qs() { const A = pairs.map((p) => p.a), Bs = pairs.map((p) => p.b);
        return shuffle(pairs.flatMap((p) => [{ p: `${p.icon} ${p.a}: ___`, a: p.b, o: opts(p.b, Bs) }, { p: `${p.bicon} “${p.b}”: which one?`, a: p.a, o: opts(p.a, A) }])); },
      note: W.OB_STUDY.plain(card.note || "") };
  }

  // a picture and color for every answer: pairs (Match, Bingo), table cells, and multiple-choice options through D.deco
  function deco(D) {
    const E = D.E, T = D.table;
    if (D.k === "gaslaws") D.pairs.forEach((p, i) => { p.bicon = E.bIcons[i]; p.tone = D.sort.cols.indexOf(p.held); });
    if (D.k === "abg") { D.pairs.forEach((p, i) => { p.bicon = E.bIcons[i]; p.tone = i < 6 ? 2 : 3; }); T.cellIcons = T.cells.map((r, i) => [E.bIcons[i]]); T.cellTone = T.cells.map(() => [2]); }
    const m = {};
    D.pairs.forEach((p) => { m[p.b] = { icon: p.bicon, tone: p.tone }; if (D.k === "gaslaws") m[p.a] = { icon: p.icon, tone: null }; if (E.simple) m[p.a] = { icon: p.icon, tone: p.tone }; });
    T.colHeads.forEach((c) => { if (c.tone != null) m[c.t] = m[c.t] || { icon: "", tone: c.tone }; });
    if (D.k === "apgar") D.sort.cols.forEach((c, j) => { m[c] = { icon: "", tone: j }; });
    if (E.heldIcons) Object.keys(E.heldIcons).forEach((h) => { m[h] = { icon: E.heldIcons[h], tone: D.sort.cols.indexOf(h) }; });
    D.deco = m;
  }

  // ---------- "Use it": apply the card to a case ----------
  function scenario(k0) {
    const D = data(k0); if (!D) return null;
    if (D.k === "apgar") {
      const t = rows("apgar"), s = t.rows.map(() => rnd(0, 2)), hr = s[1] === 0 ? "No heart rate (absent)" : s[1] === 1 ? `Heart rate ${rnd(6, 9) * 10 + rnd(0, 9)}/min` : `Heart rate ${rnd(10, 16) * 10}/min`;
      const total = s.reduce((a, b) => a + b, 0);
      const lines = [`👶 Color: ${t.rows[0][s[0] + 1]}`, `💓 ${hr}`, `😖 Reflex: ${t.rows[2][s[2] + 1]}`, `🤸 Tone: ${t.rows[3][s[3] + 1]}`, `🎺 Breathing: ${t.rows[4][s[4] + 1]}`];
      const band = total >= 7 ? "7 to 10: reassuring" : total >= 4 ? "4 to 6: moderately abnormal" : "0 to 3: low";
      return { kind: "baby", title: "Score the Baby", q: "A newborn at 1 minute. What's the Apgar score?", lines, a: String(total), o: Array.from({ length: 11 }, (_, i) => String(i)),
        why: `${t.rows.map((r, i) => `${short(r[0])} ${s[i]}`).join(" + ")} = ${total} (${band}).` };
    }
    if (D.k === "gaslaws") {
      const p = pick(D.pairs), L = D.pairs.map((x) => x.a);
      return { kind: "case", title: "Which law is at work?", q: "At the bedside:", lines: [`${p.ex}.`], a: p.a, o: opts(p.a, L), why: `${p.a}: ${p.b}.` };
    }
    // calculations from the Oxygenation indices and blood gas cards
    const type = rnd(0, 2);
    if (type === 0) { const pc = pick([36, 40, 44, 48]), PA = Math.round(0.21 * (760 - 47) - pc / 0.8), pa = rnd(50, PA - 5), aa = PA - pa;
      return { kind: "calc", title: "Calculate it", q: "Room air (FIO2 0.21), sea level (PB 760). What's the A–a gradient?", lines: [`PaCO2 ${pc} mm Hg · PaO2 ${pa} mm Hg`], a: `${aa} mm Hg`,
        o: shuffle([aa, aa + 10, aa - 8, aa + 20].map((x) => `${x} mm Hg`)), why: `PAO2 = 0.21 × (760 − 47) − ${pc} ÷ 0.8 ≈ ${PA}. A–a = ${PA} − ${pa} = ${aa} mm Hg.` }; }
    if (type === 1) { const pa = rnd(6, 12) * 10, f = pick([0.4, 0.5, 0.6]), pf = Math.round(pa / f);
      return { kind: "calc", title: "Calculate it", q: "What's the P/F ratio?", lines: [`PaO2 ${pa} mm Hg on FIO2 ${f.toFixed(2)}`], a: String(pf), o: shuffle([...new Set([pf, pf + 50, pf - 40, Math.round(pa / (f + 0.1)), pf + 90])].slice(0, 4).map(String)),
        why: `P/F = ${pa} ÷ ${f.toFixed(2)} = ${pf}. ${pf <= 300 ? "300 or less means impaired oxygenation." : "Above 300."}` }; }
    const h = rnd(5, 9) * 2, e = 1.5 * h + 8;
    return { kind: "calc", title: "Calculate it", q: "Metabolic acidosis. What PaCO2 do you expect (Winter's formula)?", lines: [`HCO3- ${h} mEq/L`], a: `${e - 2} to ${e + 2} mm Hg`,
      o: shuffle([...new Set([e, e + 8, e - 7, 40, e + 15])].slice(0, 4).map((x) => `${x - 2} to ${x + 2} mm Hg`)), why: `PaCO2 = 1.5 × ${h} + 8 (±2) = ${e} ± 2 mm Hg.` };
  }

  // ---------- Crossword: place words so they cross ----------
  function crossword(words) {
    for (let attempt = 0; attempt < 30; attempt++) {
      const list = attempt ? shuffle(words) : words.slice().sort((a, b) => b[0].length - a[0].length);
      const grid = new Map(), placed = [], key = (x, y) => x + "," + y;
      const fits = (w, x, y, dx, dy) => {
        let cross = 0;
        if (grid.has(key(x - dx, y - dy)) || grid.has(key(x + dx * w.length, y + dy * w.length))) return -1;
        for (let i = 0; i < w.length; i++) {
          const cx = x + dx * i, cy = y + dy * i, g = grid.get(key(cx, cy));
          if (g) { if (g.ch !== w[i] || g.dir === (dx ? "a" : "d")) return -1; cross++; }
          else if (grid.has(key(cx + dy, cy + dx)) || grid.has(key(cx - dy, cy - dx))) return -1;
        }
        return cross;
      };
      const put = (w, clue, x, y, dx, dy) => { for (let i = 0; i < w.length; i++) { const k = key(x + dx * i, y + dy * i), g = grid.get(k); grid.set(k, { ch: w[i], dir: g ? "both" : dx ? "a" : "d" }); } placed.push({ w, clue, x, y, dir: dx ? "a" : "d" }); };
      put(list[0][0], list[0][1], 0, 0, 1, 0);
      for (const [w, clue] of list.slice(1)) {
        let best = null;
        for (const p of placed) for (let i = 0; i < p.w.length; i++) for (let j = 0; j < w.length; j++) {
          if (p.w[i] !== w[j]) continue;
          const dx = p.dir === "a" ? 0 : 1, dy = 1 - dx, px = p.x + (p.dir === "a" ? i : 0), py = p.y + (p.dir === "a" ? 0 : i);
          const x = px - dx * j, y = py - dy * j, f = fits(w, x, y, dx, dy);
          if (f > 0 && (!best || f > best.f)) best = { x, y, dx, dy, f };
        }
        if (best) put(w, clue, best.x, best.y, best.dx, best.dy);
      }
      if (placed.length >= Math.min(words.length, 7)) {
        const xs = [...grid.keys()].map((k) => +k.split(",")[0]), ys = [...grid.keys()].map((k) => +k.split(",")[1]), mx = Math.min(...xs), my = Math.min(...ys);
        placed.forEach((p) => { p.x -= mx; p.y -= my; });
        const starts = [...new Set(placed.map((p) => p.y * 100 + p.x))].sort((a, b) => a - b);
        placed.forEach((p) => { p.n = starts.indexOf(p.y * 100 + p.x) + 1; });
        return { w: Math.max(...xs) - mx + 1, h: Math.max(...ys) - my + 1, words: placed.sort((a, b) => (a.dir > b.dir ? 1 : a.dir < b.dir ? -1 : a.n - b.n)) };
      }
    }
    return null;
  }

  // ---------- Games ----------
  const GAMES = [
    ["table", "Build the Table", "🧩", "Drag (tap) each block into its row, column and cell"],
    ["match", "Memory Match", "🃏", "Flip two tiles; find each fact's pair"],
    ["blanks", "Fill the Blanks", "✍️", "Quick fill-ins, or call-and-response out loud"],
    ["baby", "Score the Baby", "👶", "Use the card on a patient case"],
    ["crossword", "Crossword", "🔤", "Clues straight from the card"],
    ["odd", "Odd One Out", "🔍", "Three belong together. Spot the fourth"],
    ["sort", "Speed Sort", "⚡", "Sort falling blocks before they land"],
    ["bingo", "Bingo", "🎱", "Hear the call, stamp the match"],
    ["escape", "Escape Room", "🔐", "Each right answer opens a padlock"],
    ["boss", "Boss Battle", "⚔️", "Right answers knock down its health"],
    ["attack", "Fact Attack", "🚀", "Fire the matching launcher at falling facts"],
  ];
  const gameName = (g, k) => g === "baby" ? (exKey(k) === "apgar" ? "Score the Baby" : exKey(k) === "gaslaws" ? "Which law is at work?" : "Calculate it") : (GAMES.find((x) => x[0] === g) || [, g])[1];

  function API() { return { EX, ALIAS, GAMES, exKey, data, scenario, crossword, gameName }; }
  if (typeof document === "undefined") { W.OB_BIN = API(); return; }

  // ======================= Screen =======================
  const KEY = `obBin:${EXAM}`, DAY = 864e5;
  // the arcade otter (Ken, t141u to t143u): tagline-free icon (sign reads only Memory Arcade) on the home button and in the calm Memory Arcade screen header (t145u to t147u)
  const IMG = ((document.querySelector('link[href*="voice.css"]') || {}).href || "").replace(/css\/voice\.css.*$/, "") + "images/brand/";
  const load = () => { try { return Object.assign({ cards: {}, streak: 0, lastDay: "", sound: true, badges: [], offset: 0 }, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { return { cards: {}, streak: 0, lastDay: "", sound: true, badges: [], offset: 0 }; } };
  let B = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(B)); } catch (e) {} };
  const now = () => Date.now() + (B.offset || 0) * DAY;
  const today = () => new Date(now()).toDateString();
  const inBin = (k) => !!B.cards[k] && !B.cards[k].mastered;
  const CHECKS = [1, 7, 30];
  function addCard(k) { if (!B.cards[k] || B.cards[k].mastered) B.cards[k] = { added: now(), step: 1, checks: 0, due: 0, best: {}, mastered: false }; save(); }
  // a session: up to 3 example cards that have a game step ready (step 1 is the study page, opened from Continue)
  const sessionCards = () => Object.keys(B.cards).filter((k) => { const c = B.cards[k]; return exKey(k) && !c.mastered && c.step > 1 && !(c.step === 4 && c.due > now()); }).slice(0, 3);
  // where the card is: 1 make, 2 recall, 3 use, 4 quick check (due or waiting)
  const stepName = (c) => c.mastered ? "Mastered" : c.step === 1 ? "Make it" : c.step === 2 ? "Recall it" : c.step === 3 ? "Use it" : (c.due <= now() ? "Quick check due" : `Quick check in ${Math.max(1, Math.ceil((c.due - now()) / DAY))} day${Math.ceil((c.due - now()) / DAY) > 1 ? "s" : ""}`);
  const level = (k) => { const c = B.cards[k] || {}; return c.mastered ? 7 : (c.step || 1) + (c.checks || 0); };   // 1 to 7; table row blocks lose their words from 3 (Use it) up

  // the flag: same control everywhere
  function flag(k) {
    if (!W.SCALES[k]) return "";
    const on = inBin(k);
    return `<button type="button" class="binflag${on ? " on" : ""}" data-act="binflag" data-k="${k}" aria-pressed="${on}"><span aria-hidden="true">${on ? "★" : "🕹"}</span><span><b>${on ? "In your Memory Arcade" : "Add to Arcade"}</b><small>${esc(W.SCALES[k].title)}</small></span></button>`;
  }
  // practice questions: a flag under the reference-card buttons (shown after the answer, like the cards)
  const origScale = W.scaleButtons;
  if (typeof origScale === "function") W.scaleButtons = function (q, c) {
    const h = origScale(q, c); if (!c || !c.done) return h;
    const ks = (q.scales || []).filter((k) => W.SCALES[k]);
    return h + (ks.length ? `<div class="binflags">${ks.map(flag).join("")}</div>` : "");
  };
  // home: the Memory Arcade button
  const way = () => { const n = Object.values(B.cards).filter((c) => !c.mastered).length;
    return `<button type="button" class="way binway arcadeway" data-act="binopen" aria-label="Memory Arcade, Play to Learn${n ? `, ${n} saved` : ""}"><img class="arcotter" src="${IMG}otter-arcade-icon.jpg" alt="" width="56" height="56"><span class="arctext"><b>Memory Arcade</b><span>Play to Learn${n ? "" : " · tap 🕹 Add to Arcade on any answer"}</span></span>${n ? `<span class="arcbadge">${n}</span>` : ""}</button>`; };

  // ---------- sound (optional) ----------
  let AC = null;
  function beep(kind) {
    if (!B.sound) return;
    try { AC = AC || new (W.AudioContext || W.webkitAudioContext)(); } catch (e) { return; }
    const seq = kind === "ok" ? [[660, .08], [880, .12]] : kind === "no" ? [[180, .22]] : [[523, .1], [659, .1], [784, .1], [1047, .25]];
    let t = AC.currentTime + 0.02;
    seq.forEach(([f, d]) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = kind === "no" ? "sawtooth" : "triangle"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(kind === "no" ? 0.08 : 0.18, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d + 0.02); t += d; });
  }

  // ---------- game state ----------
  let G = null, VIEW = "bin", GAL = null, SESSION = null;
  const hit = (ok, msg, i) => { G.fb = { ok, msg: msg || "", i, n: (G.fb ? G.fb.n : 0) + 1 }; if (ok) { G.score += 10 + Math.min(G.streak, 5) * 2; G.streak++; G.right++; G.best = Math.max(G.best, G.streak); beep("ok"); } else { G.streak = 0; G.wrong++; beep("no"); } };
  function start(game, k) {
    const D = data(k); if (!D) return;
    G = { game, k, D, wait: null, calc: "", score: 0, streak: 0, best: 0, right: 0, wrong: 0, i: 0, fb: null, over: false, t0: Date.now() };
    const g = G;
    if (game === "table") {
      const T = D.table, blocks = [];
      T.rowHeads.forEach((r, i) => blocks.push({ id: "r" + i, kind: "rh", v: r.t, icon: r.icon }));
      T.colHeads.forEach((c, j) => blocks.push({ id: "c" + j, kind: "ch", v: c.t, tone: c.tone }));
      T.cells.forEach((row, i) => row.forEach((v, j) => blocks.push({ id: `x${i}_${j}`, kind: "cell", v, icon: (T.cellIcons || [])[i] && T.cellIcons[i][j], tone: (T.cellTone || [])[i] ? T.cellTone[i][j] : null })));
      g.blocks = shuffle(blocks); g.slots = {}; g.sel = null; g.n = blocks.length;
    } else if (game === "match") {
      const ps = shuffle(D.pairs).slice(0, 6);
      g.tiles = shuffle(ps.flatMap((p, i) => [{ p: i, side: "a", t: p.a, icon: p.icon }, { p: i, side: "b", t: p.b, icon: p.bicon || "", tone: p.tone }])); g.open = []; g.got = []; g.moves = 0; g.n = 6;
    } else if (game === "blanks") { g.qs = D.qs().slice(0, 8); g.n = g.qs.length; g.cr = !!(G && G.cr); g.reveal = false; }
    else if (game === "baby") { g.qs = [scenario(k), scenario(k), scenario(k)]; g.n = 3; }
    else if (game === "crossword") { g.cw = crossword(D.E.words); g.n = g.cw.words.length; g.typed = g.cw.words.map(() => ""); g.checked = false; }
    else if (game === "odd") { g.rounds = Array.from({ length: 6 }, () => D.oddRound()); g.n = 6; }
    else if (game === "sort") { g.items = Array.from({ length: 10 }, () => D.sort.gen ? D.sort.gen() : pick(D.sort.items)); g.n = 10; g.cols = D.sort.cols; nextFall(); }
    else if (game === "attack") { Object.assign(g, { cols: D.sort.cols, blocks: [], fx: [], uid: 0, combo: 0, hearts: 3, wave: 1, spawned: 0, bossOut: false, n: 21, nextSpawn: Date.now() + 600, slow: 0, freeze: 0, shield: false }); atkRun(g); }
    else if (game === "bingo") { const ps = shuffle(D.pairs).slice(0, 9); g.board = ps; g.calls = shuffle(ps.map((_, i) => i)); g.stamped = []; g.n = 9; }
    else if (game === "escape") { g.qs = D.qs().slice(0, 5); g.n = 5; g.keys = 3; g.open = 0; }
    else if (game === "boss") { g.qs = D.qs(); g.hp = 100; g.hearts = 3; g.n = g.qs.length; g.hitAnim = 0; }
    VIEW = "game";
  }
  function finish(win) {
    if (!G || G.over) return; G.over = true; G.win = win; clearTimeout(G.timer);
    const pct = G.right + G.wrong ? Math.round(100 * G.right / (G.right + G.wrong)) : 0; G.pct = pct;
    const c = B.cards[G.k]; G.moved = "";
    if (c && win && pct >= 70) {
      const ex = EX[exKey(G.k)];
      const useG = EX[exKey(G.k)].useGame || "baby";
      if (c.step === 2 && G.game !== useG) { c.step = 3; G.moved = "Next step: Use it"; }
      else if (c.step === 3 && G.game === useG) { c.step = 4; c.due = now() + CHECKS[0] * DAY; G.moved = "Next: a quick check in 1 day"; }
      else if (c.step === 4 && c.due <= now()) { c.checks++; if (c.checks >= CHECKS.length) { c.mastered = true; G.moved = "Mastered! It leaves your Arcade."; } else { c.due = now() + CHECKS[c.checks] * DAY; G.moved = `Next quick check in ${CHECKS[c.checks]} days`; } }
      void ex;
    }
    if (c) c.best[G.game] = Math.max(c.best[G.game] || 0, G.score);
    save(); beep(win ? "win" : "no");
    if (win && G.right > 0 && G.wrong === 0) celebrate();
  }
  // perfect score party (Ken, t148u to t153u): "Yes, perfect score!!!" bubble, fist pump, side-view moonwalk, confetti raining and balloons bobbing (t154u), 4.5 s at most; tap to skip
  const YES = "Yes, perfect score!!!";
  function celebrate() {
    const old = document.querySelector(".party"); if (old) old.remove();
    const still = W.matchMedia && W.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cols = ["#E53935", "#FB8C00", "#FDD835", "#43A047", "#1E88E5", "#8E24AA"];
    const el = document.createElement("div");
    el.className = "party" + (still ? " still" : ""); el.setAttribute("role", "status"); el.setAttribute("aria-label", YES);
    el.innerHTML = `<div class="pstage"><p class="pbubble">${YES}</p><img class="pyes" src="${IMG}otter-yes.webp" alt="" width="242" height="300">${still ? "" : `<img class="pmw" src="${IMG}otter-moonwalk.webp" alt="" width="202" height="300">`}</div>` +
      (still ? "" : `<div class="pconf" aria-hidden="true">${Array.from({ length: 72 }, (_, i) => `<i style="--x:${(i * 37) % 100}%;--d:${((i * 53) % 120) / 100}s;--t:${1.6 + (i % 5) * 0.25}s;--dx:${(i % 7) * 9 - 27}px;--w:${5 + (i % 4) * 2}px;--h:${8 + (i % 3) * 4}px;--f:${0.5 + (i % 4) * 0.15}s;--c:${cols[i % 6]}"></i>`).join("")}</div><div class="pball" aria-hidden="true">${Array.from({ length: 7 }, (_, i) => `<b style="--x:${4 + i * 14}%;--y:${48 + (i * 29) % 26}vh;--d:${(i % 4) * 0.15}s;--p:${1.1 + (i % 3) * 0.3}s;--c:${cols[(i + 2) % 6]}"></b>`).join("")}</div>`) +
      `<small class="pskip">Tap to continue</small>`;
    const done = () => { el.classList.add("out"); setTimeout(() => el.remove(), 250); };
    el.addEventListener("click", done);
    document.body.appendChild(el);
    if (!still) setTimeout(() => el.classList.add("mw"), 1800);
    setTimeout(done, still ? 2600 : 4250);   // gone by 4.5 s, under Ken's 5 s cap (t154u)
  }
  function nextFall() { const g = G; clearTimeout(g.timer); g.fallStart = Date.now(); g.dur = Math.max(3200, 6500 - g.streak * 350);
    g.timer = setTimeout(() => { if (G !== g || g.over) return; hit(false, "Too slow"); sortMiss(g, g.items[g.i]); render(); }, g.dur); }
  // Fact Attack (Ken picked attack mode, t134u; it replaced Block Drop): gray fact blocks fall, the player fires the matching launcher.
  // Combos raise the multiplier and unlock power-ups; a wrong shot or a block that lands pauses with the answer until Next.
  // 3 waves of 6 blocks, each ending with a boss block that takes 3 right hits (a new fact after each hit).
  const dropIcon = (it) => (it.t.match(/^([^\w\s]\S*) /) || [])[1] || "", dropText = (it) => it.t.replace(/^[^\w\s]\S* /, "");
  const atkItem = (g) => g.D.sort.gen ? g.D.sort.gen() : pick(g.D.sort.items);
  const POW = { slow: ["⏱", "Slow motion"], shield: ["🛡", "Shield"], clear: ["💥", "Blast the lowest block"], freeze: ["❄", "Freeze"] };
  function atkRun(g) { clearInterval(g.timer); g.last = Date.now(); g.timer = setInterval(() => { if (G !== g || g.over) return clearInterval(g.timer); if (g.wait) { g.last = Date.now(); return; } atkTick(g); render(); }, 110); }
  function atkTick(g) {
    const now = Date.now(), dt = (now - g.last) / 1000, f = now < g.freeze ? 0 : now < g.slow ? 0.4 : 1; g.last = now;
    g.blocks.forEach((b) => { b.y += b.v * dt * f; });
    if (f && now >= g.nextSpawn) {
      if (g.spawned < 6) { if (g.blocks.length < 3) { g.blocks.push({ id: ++g.uid, it: atkItem(g), x: rnd(0, 58), y: -6, v: rnd(7, 12) + g.wave * 2.5 }); g.spawned++; } g.nextSpawn = now + Math.max(700, 2300 - g.wave * 400) + rnd(0, 700); }
      else if (!g.bossOut && !g.blocks.length) { g.blocks.push({ id: ++g.uid, it: atkItem(g), x: 29, y: -6, v: 5 + g.wave, boss: true, hp: 3 }); g.bossOut = true; }
    }
    const down = g.blocks.find((b) => b.y >= 100);
    if (down) { g.blocks = g.blocks.filter((b) => b !== down); if (down.boss) g.bossOut = false;
      if (g.shield) { g.shield = false; g.fb = { ok: true, msg: "🛡 Your shield took that one", n: (g.fb ? g.fb.n : 0) + 1 }; }
      else { g.hearts--; g.combo = 0; g.shake = now; hit(false, "It landed! −1 ❤"); g.wait = { a: g.cols[down.it.col], why: dropText(down.it), col: down.it.col, go: () => { if (g.hearts <= 0) finish(false); } }; } }
    g.fx = g.fx.filter((e) => now - e.t0 < 700);
  }
  function atkPower(g, now) {
    const P = { 3: "slow", 5: "shield", 8: "clear", 12: "freeze" }, p = P[g.combo] || (g.combo > 12 && g.combo % 4 === 0 ? pick(Object.keys(POW)) : null); if (!p) return;
    if (p === "slow") g.slow = now + 5000; else if (p === "freeze") g.freeze = now + 4000; else if (p === "shield") g.shield = true;
    else { const low = g.blocks.filter((b) => !b.boss).sort((a, b) => b.y - a.y)[0]; if (low) { g.blocks = g.blocks.filter((b) => b !== low); g.i++; g.fx.push({ k: "burst", x: low.x, y: low.y, tone: low.it.tone, t0: now }); } }
    g.fb.msg += ` · ${POW[p][0]} ${POW[p][1]}!`;
  }
  function atkFire(j) {
    const g = G; if (!g || g.game !== "attack" || g.wait || g.over) return false;
    const b = g.blocks.find((x) => x.id === g.sel) || g.blocks.slice().sort((a, c) => c.y - a.y)[0]; if (!b) return false;
    const now = Date.now(), ok = j === b.it.col; g.fx.push({ k: "shot", j, x: b.x, y: b.y, t0: now, ok }); g.sel = null;
    if (ok) { g.combo++; const mult = 1 + Math.floor(g.combo / 3); hit(true, `Hit! ×${mult}`); g.score += 10 * (mult - 1); g.fx.push({ k: "burst", x: b.x, y: b.y, tone: b.it.tone, t0: now });
      if (b.boss && --b.hp > 0) { b.it = atkItem(g); b.y = Math.max(-6, b.y - 12); g.fb.msg = `Boss hit! ${b.hp} more`; }
      else { g.blocks = g.blocks.filter((x) => x !== b); g.i++;
        if (b.boss) { g.wave++; g.spawned = 0; g.bossOut = false; g.nextSpawn = now + 1500; g.fb.msg = g.wave > 3 ? "All waves cleared!" : `Wave ${g.wave - 1} cleared! 🎉`; beep("win"); if (g.wave > 3) { finish(true); render(); return false; } } }
      atkPower(g, now); }
    else { g.combo = 0; hit(false, "Wrong launcher"); g.shake = now; g.wait = { a: g.cols[b.it.col], why: dropText(b.it), col: b.it.col, go: () => {} }; }
    render(); return false;
  }
  document.addEventListener("keydown", (e) => { if (!G || G.game !== "attack" || !/^[1-9]$/.test(e.key) || +e.key > G.cols.length) return; e.preventDefault(); atkFire(+e.key - 1); });

  // Speed Sort: a miss pauses the game and shows the right column until Next
  function sortMiss(g, it) { g.wait = { a: g.cols[it.col], why: (it.why ? it.why + ". " : "") + it.t.replace(/^[^\w\s]\S* /, ""), go: () => sortNext(g) }; }
  function sortNext(g) { g.i++; if (g.i >= g.n) finish(true); else nextFall(); }

  // ---------- views ----------
  const hud = () => `<div class="ghud"><span class="gsc" aria-label="Score">⭐ ${G.score}</span><span class="gstk${G.streak >= 3 ? " hot" : ""}" aria-label="Streak">🔥 ${G.streak}</span>${G.game === "boss" ? "" : `<span class="gpr">${Math.min(G.i + (/^(table|match|crossword)$/.test(G.game) ? 0 : 1), G.n)} / ${G.n}</span>`}
    <button type="button" class="gsnd" data-act="binsound" aria-label="Sound ${B.sound ? "on" : "off"}">${B.sound ? "🔊" : "🔇"}</button></div>`;
  const fbBar = () => G.fb ? `<p class="gfb ${G.fb.ok ? "ok" : "no"}" role="status" data-n="${G.fb.n}">${G.fb.ok ? "✓ " + (G.fb.msg || pick(["Nice!", "Yes!", "Got it!", "Sharp!"])) : "✗ " + esc(G.fb.msg || "Not quite")}</p>` : `<p class="gfb"></p>`;
  // shared answer buttons: a picture and color from the card when it has one; after an answer they lock, the right one turns green
  // (Apgar questions that name the score skip the color so it doesn't give the answer away)
  const mc = (o, act, opt) => { opt = opt || {}; const w = G.wait, dm = G.D.deco || {};
    return `<div class="${opt.pad ? "gpad" : "gopts"}">${o.map((x) => { const d = opt.pad ? null : dm[x], tone = d && d.tone != null && !opt.noTone ? " tone" + d.tone : "";
      return `<button type="button" class="gopt${tone}${w ? (x === w.a ? " right" : x === w.v ? " wrong" : "") : ""}" data-act="${act}" data-v="${esc(x)}" ${w ? "disabled" : ""}>${d && d.icon ? `<i>${d.icon}</i> ` : ""}${esc(x)}</button>`; }).join("")}</div>`; };
  // after any answer the right answer (and how to get it) stays up until Next
  const waitBox = () => { const w = G.wait; if (!w) return "";
    return `<div class="gwait">${w.a != null ? `<p class="gwhy"><b>${w.ok ? "✓ Right:" : "Answer:"}</b> ${esc(w.a)}${w.why ? `<br>${esc(w.why)}` : ""}</p>` : w.msg ? `<p class="ghelp">${esc(w.msg)}</p>` : ""}<button type="button" class="gbig" data-act="bgnext">Next ▶</button></div>`; };
  // on-screen calculator for number questions; open by default in Calculate it
  const CK = ["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "−", "0", ".", "(", ")", "C", "⌫", "+", "="];
  const calcBox = () => { const g = G; if (!(g.D.k === "abg" && /^(blanks|baby|escape|boss|crossword)$/.test(g.game))) return "";
    const open = g.calcOpen != null ? g.calcOpen : g.game === "baby";
    return `<details class="gcalc"${open ? " open" : ""}><summary>🧮 Calculator</summary><div class="gcalcd" aria-live="polite">${esc(g.calc || "0")}</div><div class="gkeys">${CK.map((k) => `<button type="button" data-act="bgcalc" data-v="${k}" class="${/[÷×−+=]/.test(k) ? "op" : ""}">${k}</button>`).join("")}</div></details>`; };
  function calcKey(k) {
    const g = G; let c = g.calc || "";
    if (k === "C") c = ""; else if (k === "⌫") c = c.slice(0, -1);
    else if (k === "=") { const e = c.replace(/÷/g, "/").replace(/×/g, "*").replace(/−/g, "-");
      try { if (!/^[\d.+\-*/() ]+$/.test(e)) throw 0; const v = Function("return (" + e + ")")(); c = Number.isFinite(v) ? String(Math.round(v * 1e4) / 1e4) : "Error"; } catch (x) { c = "Error"; } }
    else c = (c === "Error" ? "" : c) + k;
    g.calc = c; const el = document.querySelector(".gcalcd"); if (el) el.textContent = c || "0";
  }
  function gameView() {
    const g = G, D = g.D;
    let h = "";
    if (g.over) return resultView();
    if (g.game === "table") {
      const T = D.table, lv = level(g.k), fade = lv >= 3;
      const slot = (id, kind, label) => { const b = g.slots[id]; return `<button type="button" class="gslot ${kind}${b ? " full" : ""}${b && b.tone != null ? " tone" + b.tone : ""}${g.fb && !g.fb.ok && g.fb.i === id ? " shake" : ""}${g.fb && g.fb.ok && g.fb.i === id ? " pop" : ""}" data-act="bgslot" data-id="${id}" aria-label="${label}">${b ? `${b.icon ? `<i>${b.icon}</i>` : ""}<span${fade && b.icon ? ' class="faded"' : ""}>${esc(b.v)}</span>` : ""}</button>`; };
      h += `<p class="ghelp">Tap a block, then tap where it goes: the row names, the column names, then every cell.${D.E.order ? " Order matters here: put the rows in order, top to bottom." : " Rows can go in any order."}${fade ? " You know this card well, so blocks show only their picture." : ""}</p>`;
      h += `<div class="gtable" style="grid-template-columns: minmax(84px, 1.1fr) repeat(${T.colHeads.length}, minmax(0, 1fr))"><div class="gcorner">${esc(T.corner)}</div>`;
      T.colHeads.forEach((c, j) => { h += slot("c" + j, "ch", "Column " + (j + 1)); });
      T.rowHeads.forEach((r, i) => { h += slot("r" + i, "rh", "Row " + (i + 1)); T.colHeads.forEach((c, j) => { h += slot(`x${i}_${j}`, "cell", `Row ${i + 1}, column ${j + 1}`); }); });
      h += `</div>${fbBar()}<div class="gtray">${g.blocks.filter((b) => !b.used).map((b) => `<button type="button" class="gblock ${b.kind}${b.tone != null ? " tone" + b.tone : ""}${g.sel === b.id ? " sel" : ""}" data-act="bgblock" data-id="${b.id}">${b.icon ? `<i>${b.icon}</i>` : ""}<span${fade && b.icon ? ' class="faded"' : ""}>${esc(b.v)}</span></button>`).join("")}</div>`;
    } else if (g.game === "match") {
      h += `<p class="ghelp">Flip two tiles. Match each fact with its answer. Moves: <b>${g.moves}</b></p><div class="gmatch">${g.tiles.map((t, i) => { const up = g.open.includes(i) || g.got.includes(t.p);
        return `<button type="button" class="gtile ${up ? "up" : ""}${up && t.tone != null ? " tone" + t.tone : ""} ${g.got.includes(t.p) ? "got" : ""} ${t.side}" data-act="bgflip" data-i="${i}" ${g.got.includes(t.p) ? "disabled" : ""}><span class="gfront">${up ? `${t.icon ? `<i>${t.icon}</i>` : ""}<span>${esc(t.t)}</span>` : "?"}</span></button>`; }).join("")}</div>${fbBar()}`;
    } else if (g.game === "blanks") {
      const q = g.qs[g.i];
      h += `<div class="gseg">${[["mc", "Fill the blank"], ["cr", "Call and response"]].map(([v, t]) => `<button type="button" data-act="bgcr" data-v="${v}" class="${(g.cr ? "cr" : "mc") === v ? "on" : ""}">${t}</button>`).join("")}</div>
        <div class="gcard${g.fb && g.fb.n ? (g.fb.ok ? " pop" : " shake") : ""}"><p class="gq">${esc(q.p)}</p></div>`;
      if (g.cr) h += g.reveal ? `<p class="gans">${esc(q.a)}</p><p class="ghelp">Did you say it?</p><div class="gopts two"><button type="button" class="gopt" data-act="bgself" data-v="1">✓ Got it</button><button type="button" class="gopt" data-act="bgself" data-v="0">✗ Not yet</button></div>`
        : `<p class="ghelp">Say the answer out loud, then check.</p><button type="button" class="gbig" data-act="bgreveal">Show the answer</button>`;
      else h += mc(q.o, "bgpick", { noTone: /scores \d/.test(q.p) });
      h += fbBar() + waitBox() + calcBox();
    } else if (g.game === "baby") {
      const q = g.qs[g.i];
      h += `<div class="gcase"><p class="gq">${esc(q.q)}</p><ul>${q.lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul></div>`;
      h += calcBox() + mc(q.o, "bgpick", { pad: q.kind === "baby" });
      h += fbBar() + waitBox();
    } else if (g.game === "crossword") {
      const C = g.cw, cell = {};
      C.words.forEach((w, wi) => { for (let i = 0; i < w.w.length; i++) { const x = w.x + (w.dir === "a" ? i : 0), y = w.y + (w.dir === "a" ? 0 : i), k = x + "," + y; cell[k] = cell[k] || { ch: w.w[i], n: i === 0 ? w.n : cell[k] && cell[k].n, ws: [] }; if (i === 0) cell[k].n = w.n; cell[k].ws.push([wi, i]); } });
      const sz = Math.min(30, Math.floor(330 / Math.max(C.w, 1)));
      h += `<p class="ghelp">Type each answer under its clue. Letters fill the grid as you go.</p><div class="gcw" style="grid-template-columns: repeat(${C.w}, ${sz}px); grid-auto-rows: ${sz}px">`;
      for (let y = 0; y < C.h; y++) for (let x = 0; x < C.w; x++) { const c = cell[x + "," + y];
        if (!c) { h += `<i></i>`; continue; }
        const [wi, li] = c.ws[0], ch = (g.typed[wi][li] || (c.ws[1] ? g.typed[c.ws[1][0]][c.ws[1][1]] : "") || "").toUpperCase();
        const st = g.checked ? (ch === c.ch ? " ok" : " no") : "";
        h += `<b class="gcc${st}" data-cell="${x},${y}" style="font-size:${sz * 0.5}px">${c.n ? `<sup>${c.n}</sup>` : ""}<span>${esc(ch)}</span></b>`; }
      h += `</div><ol class="gclues">${C.words.map((w, wi) => { const ok = g.checked && g.typed[wi].toUpperCase() === w.w;
        return `<li class="${g.checked ? (ok ? "ok" : "no") : ""}"><span><b>${w.n} ${w.dir === "a" ? "Across" : "Down"}</b> ${esc(w.clue)} <small>(${w.w.length})</small>${g.checked && !ok ? `<em class="gcwans">Answer: ${w.w}</em>` : ""}</span>
          <input type="text" data-cw="${wi}" maxlength="${w.w.length}" value="${esc(g.typed[wi])}" autocapitalize="characters" autocomplete="off" spellcheck="false" aria-label="${w.n} ${w.dir === "a" ? "across" : "down"}"></li>`; }).join("")}</ol>
        ${fbBar()}${calcBox()}<button type="button" class="gbig" data-act="bgcwcheck">Check my answers</button>${g.checked ? `<button type="button" class="glink" data-act="bgcwdone">Done: see my score</button>` : ""}`;
    } else if (g.game === "odd") {
      const r = g.rounds[g.i];
      h += `<p class="gq">${esc(r.q)}</p><div class="godd">${r.tiles.map((t, i) => `<button type="button" class="gopt big${g.wait ? (t.odd ? " right" : g.fb && g.fb.i === i ? " wrong" : "") : ""}" data-act="bgodd" data-i="${i}" ${g.wait ? "disabled" : ""}>${esc(t.t)}</button>`).join("")}</div>${fbBar()}${waitBox()}`;
    } else if (g.game === "sort") {
      const it = g.items[g.i], el = Date.now() - g.fallStart;
      h += `<p class="ghelp">Tap the right column before the block lands. It speeds up as your streak grows.</p>
        <div class="gfall"><div class="gdrop" style="${g.wait ? "top:180px;animation:none" : `animation-duration:${g.dur}ms;animation-delay:-${el}ms`}" data-i="${g.i}">${esc(it.t)}</div><div class="gground"></div></div>
        ${fbBar()}<div class="gcols" style="grid-template-columns: repeat(${g.cols.length}, 1fr)">${g.cols.map((c, j) => { const d = (D.deco || {})[c]; return `<button type="button" class="gcol${d && d.tone != null ? " tone" + d.tone : ""}${g.wait && j === it.col ? " right" : ""}" data-act="bgsort" data-v="${j}" ${g.wait ? "disabled" : ""}>${d && d.icon ? `<i>${d.icon}</i> ` : ""}${esc(c)}</button>`; }).join("")}</div>${waitBox()}`;
    } else if (g.game === "attack") {
      const now = Date.now(), n = g.cols.length, dm = D.deco || {}, TC = ["#E53935", "#FB8C00", "#43A047", "#1E88E5", "#8E24AA"];
      const pw = [g.slow > now ? "⏱" : "", g.freeze > now ? "❄" : "", g.shield ? "🛡" : ""].join(" ");
      h += `<div class="gatkbar"><span>${"❤️".repeat(Math.max(0, g.hearts))}${"🤍".repeat(Math.max(0, 3 - g.hearts))}</span><span>Wave ${Math.min(g.wave, 3)} of 3</span><span class="gcombo${g.combo >= 3 ? " hot" : ""}">×${1 + Math.floor(g.combo / 3)} combo ${g.combo}</span><span>${pw}</span></div>`;
      h += `<div class="gfield${g.shake && now - g.shake < 350 ? " shake" : ""}${g.freeze > now ? " frozen" : ""}${g.slow > now ? " slowmo" : ""}" style="animation-delay:-${now - (g.shake || 0)}ms">`;
      h += g.blocks.map((b) => `<button type="button" class="gab${b.boss ? " boss" : ""}${g.sel === b.id ? " sel" : ""}" data-act="bgasel" data-v="${b.id}" style="left:${b.x}%;top:${b.y * 0.82}%">${b.boss ? `<em>${D.E.boss[0]} ${esc(D.E.boss[1])} ${"♥".repeat(b.hp)}</em>` : ""}${dropIcon(b.it) ? `<i>${dropIcon(b.it)}</i>` : ""}<small>${esc(dropText(b.it))}</small></button>`).join("");
      h += g.fx.map((e) => e.k === "shot" ? `<i class="gshot${e.ok ? "" : " bad"}" style="--fx:${(e.j + 0.5) / n * 100}%;--tx:${e.x + 21}%;--ty:${e.y * 0.82 + 4}%;animation-delay:-${now - e.t0}ms"></i>`
        : Array.from({ length: 10 }, (_, i) => { const a = i / 10 * 6.283; return `<i class="gpart" style="left:${e.x + 21}%;top:${e.y * 0.82 + 4}%;--dx:${Math.round(Math.cos(a) * 46)}px;--dy:${Math.round(Math.sin(a) * 46)}px;background:${e.tone != null ? TC[e.tone] : "#FFD54F"};animation-delay:-${now - e.t0}ms"></i>`; }).join("")).join("");
      h += `<div class="gground"></div></div><div class="gcannons" style="grid-template-columns: repeat(${n}, 1fr)">${g.cols.map((t, j) => { const d = dm[t]; return `<button type="button" class="gcan${d && d.tone != null ? " tone" + d.tone : ""}${g.wait && g.wait.col === j ? " right" : ""}" data-act="bgafire" data-v="${j}" ${g.wait ? "disabled" : ""}><b>${j + 1}</b>${d && d.icon ? `<i>${d.icon}</i>` : ""}<span>${esc(t)}</span></button>`; }).join("")}</div>
        ${fbBar()}${waitBox()}<p class="ghelp">Tap a block to aim (or it aims at the lowest), then tap its launcher or press 1–${n}. Combos of 3, 5, 8 and 12 unlock ⏱ 🛡 💥 ❄.</p>`;
    } else if (g.game === "bingo") {
      const call = g.board[g.calls[g.i]];
      h += `<div class="gcall"><small>The call</small><b>${call.icon ? call.icon + " " : ""}${esc(call.a)}</b></div><div class="gbingo">${g.board.map((p, i) => `<button type="button" class="gbc${p.tone != null ? " tone" + p.tone : ""}${g.stamped.includes(i) ? " st" : ""}${g.fb && g.fb.i === i && !g.fb.ok ? " shake" : ""}${g.wait && g.calls[g.i] === i ? " right" : ""}" data-act="bgbingo" data-i="${i}" ${g.stamped.includes(i) ? "disabled" : ""}>${p.bicon ? `<i>${p.bicon}</i>` : ""}<span>${esc(p.b)}</span>${g.stamped.includes(i) ? '<em aria-hidden="true">★</em>' : ""}</button>`).join("")}</div>${fbBar()}${waitBox()}`;
    } else if (g.game === "escape") {
      const q = g.qs[g.open];
      h += `<div class="gdoor"><div class="glocks">${g.qs.map((_, i) => `<span class="${i < g.open ? "open" : i === g.open ? "cur" : ""}${g.fb && !g.fb.ok && i === g.open ? " shake" : ""}">${i < g.open ? "🔓" : "🔒"}</span>`).join("")}</div><p>🗝️ Keys left: <b>${"🗝️".repeat(g.keys) || "none"}</b></p></div>
        <div class="gcard"><p class="gq">${esc(q.p)}</p></div>${mc(q.o, "bgpick", { noTone: /scores \d/.test(q.p) })}${fbBar()}${waitBox()}${calcBox()}`;
    } else if (g.game === "boss") {
      const q = g.qs[g.i % g.qs.length], [ic, nm] = D.E.boss;
      h += `<div class="gboss"><div class="gbossme${g.fb && g.fb.ok ? " hurt" : ""}" data-n="${g.fb ? g.fb.n : 0}">${ic}</div><b>${nm}</b><div class="ghp"><i style="width:${g.hp}%"></i></div><small>${g.hp} HP</small>
        <p class="ghearts">You: ${"❤️".repeat(g.hearts)}${"🤍".repeat(3 - g.hearts)}</p></div><div class="gcard${g.fb && !g.fb.ok ? " shake" : ""}"><p class="gq">${esc(q.p)}</p></div>${mc(q.o, "bgpick", { noTone: /scores \d/.test(q.p) })}${fbBar()}${waitBox()}${calcBox()}`;
    }
    return h;
  }
  function resultView() {
    const g = G, stars = g.pct >= 90 ? 3 : g.pct >= 70 ? 2 : g.pct >= 40 ? 1 : 0;
    const msg = g.game === "boss" ? (g.win ? `You beat ${g.D.E.boss[1]}!` : `${g.D.E.boss[1]} wins this round.`) : g.game === "escape" ? (g.win ? `You escaped in ${Math.max(1, Math.round((Date.now() - g.t0) / 1000))} second${Math.round((Date.now() - g.t0) / 1000) > 1 ? "s" : ""}!` : "Out of keys. The door stays locked.") : g.game === "bingo" ? "BINGO!" : g.game === "attack" ? (g.win ? "You fought off every wave!" : "Out of hearts!") : g.win ? "Round complete!" : "Round over";
    const more = SESSION && SESSION.queue.length;
    return `<div class="gres${g.win ? " win" : ""}"><p class="gstars" aria-label="${stars} of 3 stars">${"★".repeat(stars)}<span>${"★".repeat(3 - stars)}</span></p><h2>${esc(msg)}</h2>
      <p class="gnums"><span><b>${g.score}</b>points</span><span><b>${g.pct}%</b>right</span><span><b>${g.best}</b>best streak</span></p>
      ${g.moved ? `<p class="gmoved">🎯 ${esc(g.moved)}</p>` : ""}${g.game === "table" && g.D.E.tip ? `<p class="gwhy">💡 ${esc(g.D.E.tip)}</p>` : ""}
      ${g.win ? `<div class="stconfetti" aria-hidden="true">${Array.from({ length: 24 }, (_, i) => `<i style="--x:${(i * 41) % 100}%;--d:${(i % 6) * 0.08}s;--c:${["#C62828", "#E65100", "#B08900", "#2E7D32", "#1565C0", "#6A1B9A"][i % 6]}"></i>`).join("")}</div>` : ""}
      <button type="button" class="gbig" data-act="${more ? "binnext" : "binend"}">${more ? "Continue: next card ▶" : SESSION ? "Finish session" : "Back to my Memory Arcade"}</button>
      <div class="grow"><button type="button" class="glink" data-act="bgagain">Play again</button><button type="button" class="glink" data-act="bingallery" data-k="${g.k}">Pick a different game</button></div></div>`;
  }
  function binView() {
    const cards = Object.entries(B.cards).filter(([, c]) => !c.mastered), done = Object.entries(B.cards).filter(([, c]) => c.mastered);
    let h = `<div class="archead"><div><h1 class="arch1">Play to Learn</h1><p>Memory Arcade</p></div><img class="archead-otter" src="${IMG}otter-arcade-icon.jpg" alt="" width="52" height="52"></div><div class="bintop"><p>🔥 <b>${B.streak}</b>-day streak</p><button type="button" class="gsnd" data-act="binsound" aria-label="Sound ${B.sound ? "on" : "off"}">${B.sound ? "🔊" : "🔇"}</button></div>`;
    if (!cards.length) h += `<div class="binempty"><p><b>Your Memory Arcade is empty.</b> Tap <b>🕹 Add to Arcade</b> after you answer a question (or on an Ask answer) to put that topic here.</p>
      <button type="button" class="gbig" data-act="binseed">Try the examples</button><p class="ghelp">Apgar (scoring grid), Gas laws (laws), Blood gas normals (numbers), and two sleep tables: AHI severity (order matters) and sleep stages (any order).</p></div>`;
    else {
      const sc = sessionCards().length;
      h += sc ? `<button type="button" class="gbig" data-act="binsession">▶ Quick session: ${sc} card${sc > 1 ? "s" : ""}, about 5 minutes</button><ul class="binlist">`
        : `<p class="ghelp">Tap <b>Continue</b> on a card to make its study page. Then its games are ready for a quick session.</p><ul class="binlist">`;
      cards.forEach(([k, c]) => { const ex = exKey(k), s = c.step;
        h += `<li class="bincard"><div class="binhead"><b>${esc(W.SCALES[k].title)}</b><small>${ex ? EX[ex].cat : "Study page"}</small></div>
          <ol class="binsteps" aria-label="Steps">${["Make it", "Recall it", "Use it", "Check"].map((t, i) => `<li class="${s > i + 1 ? "done" : s === i + 1 ? "cur" : ""}">${s > i + 1 ? "✓" : i + 1}<span>${t}</span></li>`).join("")}</ol>
          <p class="binnow">${c.step === 1 ? "Next: make your study page (pictures and a song)" : c.step === 2 && ex ? `Next: recall it with ${esc(gameName(EX[ex].rec, k))}` : c.step === 3 && ex ? `Next: use it with ${esc(gameName(EX[ex].useGame || "baby", k))}` : esc(stepName(c))}${c.step === 4 ? ` · checks ${c.checks} of 3 (1, 7, 30 days)` : ""}</p>
          <div class="binrow"><button type="button" class="bincont" data-act="bincont" data-k="${k}" ${c.step === 4 && c.due > now() ? "disabled" : ""}>Continue</button>
          ${ex ? `<button type="button" class="glink" data-act="bingallery" data-k="${k}">Pick a different game</button>` : `<span class="ghelp">Games come later for this card</span>`}</div></li>`; });
      const gk = cards.map(([k]) => k).find(exKey);
      h += `</ul><button type="button" class="glink small" data-act="binday">(Mockup) Pretend a day passed</button>`;
      if (gk) h += `<p class="asklabel">Games</p><div class="gmini">${GAMES.filter(([g]) => !EX[exKey(gk)].games || EX[exKey(gk)].games.includes(g)).map(([g, n, ic]) => `<button type="button" data-act="binplay" data-g="${g}" data-k="${gk}"><i>${ic}</i><span>${esc(n === "Score the Baby" ? "Use it" : n)}</span></button>`).join("")}</div><p class="ghelp">Games use ${esc(W.SCALES[gk].title)}. Use <b>Pick a different game</b> on a card to choose for that card.</p>`;
    }
    if (done.length) h += `<p class="asklabel">Mastered</p><p class="ghelp">${done.map(([k]) => "🏅 " + esc(W.SCALES[k].title)).join("<br>")}</p>`;
    return h;
  }
  function galleryView(k) {
    const ex = exKey(k), E = EX[ex];
    return `<p class="ghelp">Every game uses the same card: <b>${esc(W.SCALES[k].title)}</b>. Same controls in each: tap to choose, a score, a streak.</p><div class="ggal">
      <button type="button" class="ggame make" data-act="binmake" data-k="${k}"><i>🎨</i><b>Make it: study page</b><small>Draw your pictures, add a song</small></button>
      ${GAMES.filter(([g]) => !E.games || E.games.includes(g)).map(([g, , ic, d]) => `<button type="button" class="ggame" data-act="binplay" data-g="${g}" data-k="${k}"><i>${ic}</i><b>${esc(gameName(g, k))}</b><small>${esc(d)}</small>${g === E.rec ? '<em>Best to recall</em>' : g === E.use ? '<em>Best to use it</em>' : ""}${B.cards[k] && B.cards[k].best[g] ? `<u>Best ${B.cards[k].best[g]}</u>` : ""}</button>`).join("")}</div>`;
  }
  function winView() {
    const s = SESSION.done;
    return `<div class="gres win"><p class="gbadge">${SESSION.badge ? SESSION.badge[1] : "🔥"}</p><h2>Session done!</h2>${SESSION.badge ? `<p class="gmoved">New badge: ${esc(SESSION.badge[2])}</p>` : `<p class="gmoved">Streak kept: ${B.streak} day${B.streak === 1 ? "" : "s"}</p>`}<p class="gnums"><span><b>${s.cards}</b>cards</span><span><b>${s.points}</b>points</span><span><b>🔥 ${B.streak}</b>day streak</span></p>
      <p class="ghelp">Short and done. Come back tomorrow to keep your streak; quick checks come back at 1, 7 and 30 days.</p>
      <div class="stconfetti" aria-hidden="true">${Array.from({ length: 30 }, (_, i) => `<i style="--x:${(i * 37) % 100}%;--d:${(i % 7) * 0.08}s;--c:${["#C62828", "#E65100", "#B08900", "#2E7D32", "#1565C0", "#6A1B9A"][i % 6]}"></i>`).join("")}</div>
      <button type="button" class="gbig" data-act="binhome">Back to my Memory Arcade</button></div>`;
  }
  function page() {
    const theme = W.OB_THEME ? W.OB_THEME() : "";
    const title = VIEW === "game" ? gameName(G.game, G.k) : VIEW === "gallery" ? "Pick a game" : VIEW === "win" ? "Nice work" : "Memory Arcade";
    const sub = VIEW === "game" ? G.D.title : VIEW === "gallery" ? W.SCALES[GAL].title : "Play to Learn";
    const body = VIEW === "game" ? (G.over ? "" : hud()) + gameView() : VIEW === "gallery" ? galleryView(GAL) : VIEW === "win" ? winView() : binView();
    return `<div class="ob ask bin" style="${theme}"><header class="obtop asktop"><button type="button" class="askback" data-act="binback" aria-label="Back"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg><span>Back</span></button>
      ${VIEW === "bin" ? "" : `<span class="wm">${esc(title)}<small>${esc(sub)}</small></span>`}</header><div class="obscroll askscroll binscroll">${body}</div></div>`;
  }

  // ---------- actions ----------
  const after = (fn, ms) => { const g = G; setTimeout(() => { if (G && G === g && !g.over) { fn(); render(); } }, ms); };   // only for the game that set it
  function nextQ() { const g = G; g.i++; g.why = ""; if (g.i >= g.n) finish(true); }
  function runCard(k) {
    const c = B.cards[k], ex = exKey(k);
    if (!ex || c.step === 1) { c.step = Math.max(c.step, ex ? 2 : 1); save(); SESSION = null; W.PAGE_ACTIONS.stopenpage({ dataset: { k } }); return; }
    const E = EX[ex];
    start(c.step === 2 ? E.rec : c.step === 3 ? E.useGame || "baby" : "blanks", k);
    if (c.step === 4) { G.qs = G.qs.slice(0, 5); G.n = 5; G.check = true; }
  }
  function endSession() {
    if (SESSION) { const d = today(); if (B.lastDay !== d) { const y = new Date(now() - DAY).toDateString(); B.streak = B.lastDay === y ? B.streak + 1 : 1; B.lastDay = d; }
      // a small badge: first session, then 3-, 7- and 30-day streaks
      const earn = [["first", "🏅", "First session"], ["s3", "🥉", "3-day streak"], ["s7", "🥈", "7-day streak"], ["s30", "🥇", "30-day streak"]].find(([id]) => !B.badges.includes(id) && (id === "first" || B.streak >= +id.slice(1)));
      SESSION.badge = earn || null; if (earn) B.badges.push(earn[0]); save(); VIEW = "win"; }
    else VIEW = "bin";
    G = null;
  }
  W.PAGES = Object.assign(W.PAGES || {}, { bin: page });
  W.PAGE_ACTIONS = Object.assign(W.PAGE_ACTIONS || {}, {
    binflag: (b) => { const k = b.dataset.k; if (inBin(k)) delete B.cards[k]; else addCard(k); save(); },
    binopen: () => { B = load(); VIEW = "bin"; G = null; S.page = "bin"; S.settings = false; },
    binback: () => { if (G) clearTimeout(G.timer); if (VIEW === "game" || VIEW === "gallery" || VIEW === "win") { VIEW = "bin"; G = null; SESSION = null; } else S.page = "home"; },
    binhome: () => { VIEW = "bin"; SESSION = null; },
    // the three examples start at different steps so the mockup shows each one (Apgar's study page counts as made)
    binseed: () => { [["apgar", 2], ["gaslaws", 1], ["abg", 3], ["ahi", 2], ["staging", 2]].forEach(([k, st]) => { if (W.SCALES[k]) { addCard(k); B.cards[k].step = st; } }); save(); },
    binday: () => { B.offset = (B.offset || 0) + 1; save(); },
    binsound: () => { B.sound = !B.sound; save(); },
    bincont: (b) => { SESSION = null; runCard(b.dataset.k); },
    binsession: () => { const due = sessionCards();
      if (!due.length) return; SESSION = { queue: due.slice(1), done: { cards: 0, points: 0 } }; runCard(due[0]); },
    binnext: () => { SESSION.done.cards++; SESSION.done.points += G.score; const k = SESSION.queue.shift(); runCard(k); },
    binend: () => { if (SESSION) { SESSION.done.cards++; SESSION.done.points += G.score; } endSession(); },
    bingallery: (b) => { if (G) clearTimeout(G.timer); GAL = b.dataset.k; VIEW = "gallery"; G = null; },
    binplay: (b) => { if (!B.cards[b.dataset.k]) addCard(b.dataset.k); start(b.dataset.g, b.dataset.k); },
    binmake: (b) => { const c = B.cards[b.dataset.k]; if (c && c.step === 1 && exKey(b.dataset.k)) { c.step = 2; save(); } W.PAGE_ACTIONS.stopenpage({ dataset: { k: b.dataset.k } }); },
    bgagain: () => { start(G.game, G.k); },
    // Build the Table
    bgblock: (b) => { G.sel = G.sel === b.dataset.id ? null : b.dataset.id; G.fb = null; },
    bgslot: (b) => { const g = G, id = b.dataset.id; if (g.slots[id]) return false;
      if (!g.sel) { g.fb = { ok: false, msg: "Pick a block first", n: (g.fb ? g.fb.n : 0) + 1 }; return; }
      const blk = g.blocks.find((x) => x.id === g.sel), T = g.D.table;
      // rows: in order only when the card says order matters; a cell must match the label actually placed in its row
      const ordered = !!g.D.E.order, rl = id[0] === "x" && g.slots["r" + id.slice(1).split("_")[0]], src = rl ? T.rowHeads.findIndex((r) => r.t === rl.v) : -1;
      const want = id[0] === "r" ? ["rh", ordered ? T.rowHeads[+id.slice(1)].t : blk.kind === "rh" ? blk.v : null] : id[0] === "c" ? ["ch", T.colHeads[+id.slice(1)].t] : ["cell", src >= 0 ? T.cells[src][+id.split("_")[1]] : null];
      // a cell is right only once its row and column headers are in place, so the learner rebuilds the whole grid
      const ready = id[0] !== "x" || (g.slots["r" + id.slice(1).split("_")[0]] && g.slots["c" + id.split("_")[1]]);
      if (blk.kind === want[0] && blk.v === want[1] && ready) { g.slots[id] = blk; blk.used = true; g.sel = null; g.i++; hit(true, "", id); if (g.i >= g.n) finish(true); }
      else hit(false, !ready ? "Place that row's and column's names first" : blk.kind !== want[0] ? (want[0] === "rh" ? "That spot is a row name" : want[0] === "ch" ? "That spot is a column name" : "That spot is a cell") : "Not there. Try another spot", id); },
    // Memory Match
    bgflip: (b) => { const g = G, i = +b.dataset.i; if (g.lock || g.open.includes(i)) return false;
      g.open.push(i); if (g.open.length < 2) return;
      g.moves++; const [x, y] = g.open.map((j) => g.tiles[j]);
      if (x.p === y.p && x.side !== y.side) { g.got.push(x.p); g.open = []; g.i++; hit(true, "A pair!"); if (g.got.length === g.n) finish(true); }
      else { hit(false, "Not a pair"); g.lock = true; g.wait = { msg: "Look at both, then tap Next to flip them back.", go: () => { g.open = []; g.lock = false; } }; } },
    // shared multiple choice (Fill the Blanks, Score the Baby, Escape Room, Boss Battle)
    bgpick: (b) => { const g = G; if (g.wait) return false; const v = b.dataset.v;
      const q = g.game === "escape" ? g.qs[g.open] : g.game === "boss" ? g.qs[g.i % g.qs.length] : g.qs[g.i], ok = v === q.a; let go = nextQ;
      if (g.game === "escape") { if (ok) { hit(true, "Unlocked!"); go = () => { g.open++; g.i = g.open; if (g.open >= g.n) finish(true); }; } else { g.keys--; hit(false, "Wrong key"); go = () => { if (g.keys <= 0) finish(false); }; } }
      else if (g.game === "boss") { if (ok) { const d = 20 + (g.streak >= 2 ? 10 : 0); g.hp = Math.max(0, g.hp - d); hit(true, d > 20 ? `Combo hit! −${d}` : `Hit! −${d}`); go = () => { g.i++; if (g.hp <= 0) finish(true); }; }
        else { g.hearts--; hit(false, "Ouch!"); go = () => { g.i++; if (g.hearts <= 0) finish(false); }; } }
      else hit(ok);
      g.wait = { a: q.a, v, ok, why: q.why || "", go }; },
    bgnext: () => { const w = G.wait; if (!w) return false; G.wait = null; G.fb = null; G.calc = ""; w.go(); },
    bgasel: (b) => { if (G.wait) return false; G.sel = +b.dataset.v; },
    bgafire: (b) => atkFire(+b.dataset.v),
    bgcalc: (b) => { calcKey(b.dataset.v); return false; },
    bgcr: (b) => { G.cr = b.dataset.v === "cr"; G.reveal = false; },
    bgreveal: () => { G.reveal = true; },
    bgself: (b) => { hit(b.dataset.v === "1", b.dataset.v === "1" ? "" : "It'll come back soon"); G.reveal = false; nextQ(); },
    // Crossword
    bgcwcheck: () => { const g = G; g.checked = true; const right = g.cw.words.filter((w, i) => g.typed[i].toUpperCase() === w.w).length;
      g.right = right; g.wrong = g.n - right; g.score = right * 15; g.i = right; g.fb = { ok: right === g.n, msg: right === g.n ? "Every word right!" : `${right} of ${g.n} right. Fix the red ones.`, n: 1 }; beep(right === g.n ? "win" : "no"); },
    bgcwdone: () => { finish(G.right >= G.n * 0.7); },
    // Odd One Out
    bgodd: (b) => { const g = G; if (g.lock) return false; const r = g.rounds[g.i], i = +b.dataset.i, ok = r.tiles[i].odd;
      if (g.wait) return false; hit(ok, ok ? "" : "That one belongs", i); g.wait = { a: r.tiles.find((t) => t.odd).t, ok, why: r.why, go: nextQ }; },
    // Speed Sort
    bgsort: (b) => { const g = G; if (g.wait) return false; const it = g.items[g.i], ok = +b.dataset.v === it.col;
      if (ok) { hit(true); sortNext(g); } else { clearTimeout(g.timer); hit(false); sortMiss(g, it); } },
    // Bingo
    bgbingo: (b) => { const g = G, i = +b.dataset.i; if (g.wait) return false;
      if (g.calls[g.i] === i) { g.stamped.push(i); hit(true, "Stamped!", i); g.i++;
        const L = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
        if (L.some((l) => l.every((x) => g.stamped.includes(x))) || g.i >= g.n) finish(true); }
      else { hit(false, "Not that one", i); g.wait = { a: g.board[g.calls[g.i]].b, why: "Tap Next, then stamp it.", go: () => {} }; } },
  });
  document.addEventListener("toggle", (e) => { if (G && e.target.classList && e.target.classList.contains("gcalc")) G.calcOpen = e.target.open; }, true);
  // crossword typing: fill the grid without redrawing (keeps the keyboard up)
  document.addEventListener("input", (e) => {
    const t = e.target; if (!G || G.game !== "crossword" || !t.dataset || t.dataset.cw == null) return;
    const wi = +t.dataset.cw, w = G.cw.words[wi]; G.typed[wi] = t.value.replace(/[^a-z]/gi, "").toUpperCase(); if (t.value !== G.typed[wi]) t.value = G.typed[wi];
    for (let i = 0; i < w.w.length; i++) { const x = w.x + (w.dir === "a" ? i : 0), y = w.y + (w.dir === "a" ? 0 : i), el = document.querySelector(`[data-cell="${x},${y}"] span`); if (el) el.textContent = G.typed[wi][i] || ""; }
  });

  W.OB_BIN = Object.assign(API(), { flag, way, inBin, celebrate, state: () => ({ B, G, VIEW }) });
})();
