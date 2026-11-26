/* Jingle player (Ken, Nov 26, 2026). A phone player for the "Make it a song" part of the study sheet.
   Ken's decisions (DECISIONS.md, Nov 26): a first batch of 8 styles; Claude drafts three example songs per style and Ken approves
   them; instrumental guide only (the student sings); "Use my recording" turns on by itself after they record; sea shanty is the
   default style; a weaker-fit style shows a one-line caution plus a suggested style, never a block; car mode comes after v1;
   facts are dragged from the fact tray on this screen.
   Rules: public-domain or original melodies only, played by our own synth; recordings stay on this device (IndexedDB); lyric text
   stays in the study page's song object (song.lines; new keys "hook" and "chorus"); new storage is per exam and new:
   obJinglePrefs:${EXAM} (style, favorite, use my recording, verse order, tempo), obStudyMethods:${EXAM} (what they studied, for the
   coach) and the IndexedDB database obJingleRec:${EXAM} (their recordings). Existing keys are untouched. */
(function () {
  const W = typeof window !== "undefined" ? window : globalThis;
  if (typeof document === "undefined") return;
  const EXAM = W.EXAM || "RRT";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ---------- Styles: 8 in the first batch. Melodies are traditional (public domain) or our own. ----------
  // A phrase is 8 beats: [note, beats] pairs, "-" = rest. Each lyric line is sung over one phrase.
  const STYLES = {
    shanty: { name: "Sea shanty", bpm: 112, tune: "Traditional sea shanty tune (public domain)", drums: "shanty", lead: true,
      phrases: [["A4 .5", "A4 .5", "A4 .5", "A4 .5", "A4 .5", "A4 .5", "A4 .5", "D4 .5", "F4 1", "A4 1", "- 2"],
        ["G4 .5", "G4 .5", "G4 .5", "G4 .5", "G4 .5", "G4 .5", "G4 .5", "C4 .5", "E4 1", "G4 1", "- 2"],
        ["A4 .5", "A4 .5", "A4 .5", "A4 .5", "A4 .5", "A4 .5", "A4 .5", "B4 .5", "C5 1", "D5 1", "- 2"],
        ["C5 1", "A4 1", "G4 1", "E4 1", "D4 2", "D4 2"]],
      chorus: [["A4 1", "A4 .5", "A4 .5", "D4 1", "F4 1", "A4 2", "- 2"], ["G4 1", "E4 1", "C4 1", "E4 1", "D4 2", "- 2"]] },
    chant: { name: "Chant", bpm: 100, tune: "Our own chant", drums: "chant", lead: true,
      phrases: [["D4 1", "D4 1", "D4 1", "F4 1", "D4 1", "D4 1", "C4 2"], ["D4 1", "D4 1", "F4 1", "G4 1", "F4 1", "D4 1", "D4 2"]] },
    rap: { name: "Rap", bpm: 92, tune: "Our own beat", drums: "rap", lead: false, bassline: ["D2 1.5", "D2 .5", "- 1", "F2 1", "D2 1.5", "A1 .5", "C2 2"],
      phrases: [["- 8"]] },
    nursery: { name: "Nursery", bpm: 104, tune: "", drums: "soft", lead: true, nursery: true, phrases: [] },
    march: { name: "March", bpm: 116, tune: "Our own march", drums: "march", lead: true,
      phrases: [["C4 1", "E4 1", "G4 1", "E4 1", "F4 1", "D4 1", "C4 2"], ["G4 1", "F4 1", "E4 1", "D4 1", "E4 1", "D4 1", "C4 2"],
        ["E4 1", "G4 1", "C5 1", "G4 1", "A4 1", "F4 1", "G4 2"], ["F4 1", "E4 1", "D4 1", "G4 1", "C4 2", "- 2"]] },
    counting: { name: "Counting song", bpm: 104, tune: "Our own counting tune", drums: "soft", lead: true,
      phrases: [["C4 .5", "D4 .5", "E4 .5", "F4 .5", "G4 1", "G4 1", "A4 1", "G4 1", "E4 2"], ["G4 .5", "F4 .5", "E4 .5", "D4 .5", "C4 1", "E4 1", "D4 1", "D4 1", "C4 2"]] },
    call: { name: "Call and answer", bpm: 100, tune: "Our own call-and-answer tune", drums: "chant", lead: true, call: true,
      phrases: [["E4 1", "G4 1", "A4 1", "C5 1", "G4 1", "E4 1", "D4 1", "C4 1"]] },
    cheer: { name: "Cheer", bpm: 120, tune: "Our own cheer beat", drums: "cheer", lead: false, phrases: [["- 8"]] },
  };
  const ORDER = ["shanty", "chant", "rap", "nursery", "march", "counting", "call", "cheer"];
  const DEFAULT_STYLE = "shanty";

  // Fit advice (JINGLE_PLAN table), for these 8 styles. Advice only: every style stays tappable.
  const TYPES = { list: "a list of signs or items", numbers: "numbers and ranges", sequence: "steps in order", cause: "cause and effect",
    definition: "terms and meanings", drug: "drug names and doses", compare: "this-versus-that comparisons", letters: "a letter mnemonic" };
  const FIT = {
    shanty: { good: ["list", "sequence"], why: "A repeating chorus holds the set.", weak: { definition: "A long shanty can pad a short definition with filler." } },
    chant: { good: ["list", "definition", "letters"], why: "Even and spoken, easy to say in order.", weak: {} },
    rap: { good: [], why: "", weak: { numbers: "Loose rap timing makes it easy to rush or mumble an exact number.", drug: "Fast talk can muddle a drug name or dose." } },
    nursery: { good: ["numbers", "cause", "definition", "letters"], why: "A tune you already know leaves room for the facts.", weak: {} },
    march: { good: ["list", "numbers", "sequence", "drug"], why: "Crisp beats keep things in order.", weak: {} },
    counting: { good: ["numbers", "drug", "letters"], why: "Digits land right on the beat.", weak: {} },
    call: { good: ["sequence", "cause", "definition", "compare"], why: "One half asks, the other answers.", weak: {} },
    cheer: { good: [], why: "", weak: { cause: "Too punchy: the “therefore” can get lost.", sequence: "Short shouts can lose the order of steps." } },
  };
  function factType(m) {
    const facts = m.allFacts || m.facts || [], txt = (f) => [f.label, ...(f.details || []).map((d) => d.text)].join(" ");
    const title = String(m.title || "");
    if (/\b[A-Z]{4,}\b/.test(title) && facts.length >= 4) return "letters";
    const n = facts.length || 1, has = (re) => facts.filter((f) => re.test(txt(f))).length / n;
    if (has(/\b(mg|mcg|dose|inhaled|medication|drug)\b/i) >= 0.4) return "drug";
    if (has(/\b(law|principle|increases?|decreases?|because|→|rises|falls)\b/i) >= 0.5) return "cause";
    if (has(/\b(step|first|then|next|don|doff|before|after)\b/i) >= 0.5) return "sequence";
    if (has(/\bvs\.?\b|\bversus\b/i) >= 0.3) return "compare";
    if (has(/\d/) >= 0.6) return "numbers";
    if (has(/\b(means|is called|stands for|=)\b/i) >= 0.5) return "definition";
    return "list";
  }
  const bestFor = (type) => ORDER.find((s) => FIT[s].good.includes(type)) || DEFAULT_STYLE;

  // ---------- Example songs: drafts for Ken to approve (batch 1, Nov 26) ----------
  const DRAFT = "Draft for Ken's approval";
  const RD = ["Tachypnea", "Accessory muscles", "Retractions", "Cyanosis", "Nasal flaring", "Tripod"];
  const EX = {
    shanty: [
      { t: "Distress signs", n: "6 signs", hook: "See the signs, then act right now", v: ["Breaths come racin', that's tachypnea", "Shoulder muscles join the work", "Chest wall sinking, retractions", "Lips go blue, that's cyanosis", "Nostrils flaring, need more air", "Lean and plant, the tripod pose"], chorus: ["Heave and look, then help them now"] },
      { t: "Gas laws", n: "10 facts", hook: "Haul away the gas laws, crew", v: ["Boyle says squeeze it, pressure's up", "Charles says heat it, volume grows", "Gay-Lussac: heat, pressure climbs", "Dalton adds each gas's share", "Henry: more push, more dissolves", "Narrow tube, resistance soars", "Tiny bubbles, pressure's high", "Speed up, side-wall pressure drops", "Widen gently, pull in air", "Graham: light gas runs ahead"], chorus: ["Way-hay, the gases flow"] },
      { t: "APGAR score", n: "5 signs", hook: "Count the newborn, one to ten", v: ["Color: blue, pink core, all pink", "Pulse: none, under, hundred up", "Grimace: none, a face, then cry", "Limp, some flexing, active kicks", "Breathing: none, slow, then strong cry"], chorus: ["Seven up is lookin' good", "Under seven, score again"] },
    ],
    chant: [{ t: "Distress signs", n: "6 signs", hook: "Look and listen, count and see", v: ["Fast breaths: tachypnea", "Neck and shoulders: accessory muscles", "Ribs pull in: retractions", "Blue lips: cyanosis", "Nose flares: nasal flaring", "Leaning forward: tripod"], chorus: ["Spot it early, act it fast"] }],
    rap: [{ t: "Distress signs", n: "6 signs", hook: "Check the chest, don't guess, assess", v: ["Rate climbing high, tachypnea's the clue", "Neck muscles straining, accessory crew", "Skin sucking in, retractions in view", "Lips turning blue, cyanosis, that's true", "Nostrils flaring wide, they need air too", "Leaning on knees, tripod, that's the cue"], chorus: ["Call it in quick, get the team on cue"] }],
    nursery: [{ t: "Distress signs", n: "6 signs", hook: "Watch them breathe and look them through", v: ["Breathing fast: tachypnea", "Neck muscles help: accessory", "Ribs suck in: retractions show", "Lips turn blue: cyanosis", "Nostrils flare to pull in air", "Hands on knees: the tripod pose"], chorus: ["When you see it, call for help"] }],
    march: [{ t: "Distress signs", n: "6 signs", hook: "Left, right, check the breathing", v: ["One: the rate is racing, tachypnea", "Two: the neck is working, accessory", "Three: the ribs are sinking, retractions", "Four: the lips are bluish, cyanosis", "Five: the nose is flaring, nasal flaring", "Six: they lean on knees, the tripod"], chorus: ["March on in and help them breathe"] }],
    counting: [{ t: "Distress signs", n: "6 signs", hook: "Count the signs, there are six", v: ["One, fast breathing, tachypnea", "Two, neck muscles, accessory", "Three, ribs pulling, retractions", "Four, blue lips, cyanosis", "Five, nose flaring, nasal flare", "Six, leaning in, the tripod"], chorus: ["Six signs counted, act right now"] }],
    call: [{ t: "Distress signs", n: "6 signs", hook: "What do you see? Tell me now!", v: ["Breathing fast? Tachypnea!", "Neck muscles? Accessory!", "Ribs pull in? Retractions!", "Lips are blue? Cyanosis!", "Nose wide open? Nasal flaring!", "Hands on knees? The tripod!"], chorus: ["What do we do? Get help now!"] }],
    cheer: [{ t: "Distress signs", n: "6 signs", hook: "Gimme a sign! Distress!", v: ["Fast breaths! Tachypnea!", "Neck strain! Accessory!", "Ribs in! Retractions!", "Blue lips! Cyanosis!", "Flared nose! Nasal flaring!", "Lean in! Tripod!"], chorus: ["See it, call it, help them breathe!"] }],
  };
  void RD;

  // ---------- Storage (new, per exam) ----------
  const PREFS_KEY = "obJinglePrefs:" + EXAM, LOG_KEY = "obStudyMethods:" + EXAM, DB_NAME = "obJingleRec:" + EXAM;
  const ld = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v == null ? d : v; } catch (e) { return d; } };
  const sv = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  let PREFS = ld(PREFS_KEY, {});
  const pref = (k) => (PREFS[k] = PREFS[k] || {});
  const savePrefs = () => sv(PREFS_KEY, PREFS);
  function logMethod(k, e) {
    const L = ld(LOG_KEY, []); L.push({ k, m: "jingle", e, t: Date.now() }); sv(LOG_KEY, L.slice(-500));
  }
  function db() {
    return new Promise((res, rej) => {
      try { const r = indexedDB.open(DB_NAME, 1); r.onupgradeneeded = () => r.result.createObjectStore("takes"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); } catch (e) { rej(e); }
    });
  }
  async function getTake(k) { try { const d = await db(); return await new Promise((res) => { const q = d.transaction("takes").objectStore("takes").get(k); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); }); } catch (e) { return null; } }
  async function putTake(k, v) { try { const d = await db(); await new Promise((res) => { const t = d.transaction("takes", "readwrite"); t.objectStore("takes").put(v, k); t.oncomplete = res; t.onerror = res; }); } catch (e) {} }
  const HAS_TAKE = {};

  // ---------- The song for a topic ----------
  const S = () => W.OB_STUDY;
  function clip(s, n) { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1).replace(/[\s,;:]+\S*$/, "") + "…" : s; }
  const starter = (f) => clip(f.label + ((f.details || [])[0] ? ": " + (f.details[0].text || "") : ""), 44);
  function songFor(m, page) {
    const facts = m.allFacts || m.facts, P = pref(m.k), lines = (page && page.song && page.song.lines) || {};
    const own = (key) => (lines[key] != null && String(lines[key]).trim()) ? String(lines[key]).trim() : "";
    const MI = ((W.MEMORY_IDEAS || {})[m.k] || {}).jingle || {};
    const order = (P.slots && P.slots.length === facts.length && P.slots.every((i) => facts[i])) ? P.slots : facts.map((f, i) => i);
    const verses = order.map((fi, j) => ({ key: String(fi), slot: "V" + (j + 1), fact: facts[fi], text: own(String(fi)) || (MI.lines || [])[fi] || starter(facts[fi]) }));
    const hook = own("hook") || MI.hook || m.title;
    const chorus = own("chorus") || ((MI.refrain || []).length ? MI.refrain.join(" / ") : "Sing it once more, then you know");
    return { hook, verses, chorus, order };
  }
  // Sung order: hook, each verse, chorus (a "/" in the chorus splits it over two phrases)
  function sungLines(song) {
    const out = [{ part: "Hook", text: song.hook }];
    song.verses.forEach((v) => out.push({ part: v.slot, text: v.text }));
    String(song.chorus).split(/\s*\/\s*/).filter(Boolean).forEach((t) => out.push({ part: "Chorus", text: t, chorus: true }));
    return out;
  }
  function exampleLines(e) { return [{ part: "Hook", text: e.hook }, ...e.v.map((t, i) => ({ part: "V" + (i + 1), text: t })), ...e.chorus.map((t) => ({ part: "Chorus", text: t, chorus: true }))]; }

  // ---------- Synth (Web Audio, offline, no files) ----------
  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const midi = (p) => { const m = /^([A-G])(#|b)?(\d)$/.exec(p); return m ? 12 * (Number(m[3]) + 1) + NOTE[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0) : null; };
  const hz = (n) => 440 * Math.pow(2, (n - 69) / 12);
  let AC = null, MASTER = null, NOISE = null;
  // A soft piano (Ken, Nov 26: "sounds like a cheap toy, rather it be a nice piano"). Still our own synth, offline, no files:
  // two slightly detuned strings with a piano's overtones, a hammer tap, brightness that fades as the note rings, and a little room.
  let PIANO = null, WET = null;
  function ctx() {
    if (!AC) {
      AC = new (W.AudioContext || W.webkitAudioContext)();
      const comp = AC.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3;
      MASTER = AC.createGain(); MASTER.gain.value = 0.8; MASTER.connect(comp); comp.connect(AC.destination);
      NOISE = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const d = NOISE.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const amps = [0, 1, 0.52, 0.34, 0.2, 0.16, 0.1, 0.07, 0.05, 0.035, 0.025, 0.018, 0.012];
      PIANO = AC.createPeriodicWave(new Float32Array(amps.length), new Float32Array(amps), { disableNormalization: false });
      // a small room: 1.8 s of fading noise as the reverb's echo
      const len = Math.floor(AC.sampleRate * 1.8), ir = AC.createBuffer(2, len, AC.sampleRate);
      for (let c = 0; c < 2; c++) { const x = ir.getChannelData(c); for (let i = 0; i < len; i++) x[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
      const conv = AC.createConvolver(); conv.buffer = ir; WET = AC.createGain(); WET.gain.value = 0.16; WET.connect(conv); conv.connect(comp);
    }
    if (AC.state === "suspended") AC.resume();
    loadSamples();
    return AC;
  }
  const NODES = [];
  function env(g, t, peak, a, dur) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
  function piano(n, t, dur, vel) {
    const f = hz(n), v = vel == null ? 1 : vel, peak = 0.2 * v;
    const ring = Math.min(2.2, Math.max(0.35, 1.2 * Math.sqrt(261.6 / f)));   // low notes ring longer
    const lp = AC.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = 0.5;
    lp.frequency.setValueAtTime(Math.min(12000, f * 14), t); lp.frequency.setTargetAtTime(Math.max(f * 3, 700), t + 0.01, 0.35);
    const g = AC.createGain();
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + 0.004);
    g.gain.setTargetAtTime(peak * 0.4, t + 0.004, 0.09);
    g.gain.setTargetAtTime(0.0001, t + 0.3, ring);
    g.gain.setTargetAtTime(0.0001, t + Math.max(0.12, dur), 0.07);   // the damper comes down when the note ends
    [0, 3.5].forEach((cents) => { const o = AC.createOscillator(); o.setPeriodicWave(PIANO); o.frequency.value = f; o.detune.value = cents; o.connect(lp); o.start(t); o.stop(t + dur + 0.6); NODES.push(o); });
    lp.connect(g); g.connect(MASTER); g.connect(WET);
    noise(t, 0.02, "bandpass", Math.min(4000, f * 4), 0.05 * v);   // the hammer
  }
  // A real grand piano when its notes have loaded (Ken, Nov 26: "the higher the fidelity ... the better"): Salamander Grand Piano V3
  // by Alexander Holm, CC BY 3.0 (audio/piano/LICENSE.txt). 18 recorded notes, a minor third apart, each pitched to its neighbors.
  // The vetting pages carry the same notes inside the page (W.OB_PIANO_DATA). Until they load, the soft synth piano above plays.
  const SAMPLE_MIDI = [33, 36, 39, 42, 45, 48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81, 84], SAMPLES = {};
  let SAMPLES_ASKED = false;
  const PIANO_BASE = (() => { try { const sc = document.querySelector('script[src*="js/jingle.js"]'); if (sc && sc.src) return sc.src.replace(/js\/jingle\.js.*$/, "") + "audio/piano/"; } catch (e) {} return "audio/piano/"; })();
  function loadSamples() {
    if (SAMPLES_ASKED || !AC) return; SAMPLES_ASKED = true;
    SAMPLE_MIDI.forEach((m) => {
      const src = (W.OB_PIANO_DATA && W.OB_PIANO_DATA[m]) || PIANO_BASE + "p" + m + ".mp3";
      // notes inside the page are decoded directly (a page's security rules may not allow fetching data: addresses)
      const get = /^data:/.test(src) ? Promise.resolve().then(() => { const bin = atob(src.split(",")[1]), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; })
        : fetch(src).then((r) => r.arrayBuffer());
      get.then((ab) => new Promise((res, rej) => AC.decodeAudioData(ab, res, rej))).then((buf) => { SAMPLES[m] = buf; }).catch(() => {});
    });
  }
  function grand(n, t, dur, vel) {
    const near = SAMPLE_MIDI.reduce((a, m) => (SAMPLES[m] && Math.abs(m - n) < Math.abs(a - n) ? m : a), -99);
    if (near < 0 || Math.abs(near - n) > 3) return false;
    const src = AC.createBufferSource(), g = AC.createGain(), peak = 0.55 * (vel == null ? 1 : vel);
    src.buffer = SAMPLES[near]; src.playbackRate.value = Math.pow(2, (n - near) / 12);
    g.gain.setValueAtTime(peak, t); g.gain.setTargetAtTime(0.0001, t + Math.max(0.15, dur), 0.12);   // the damper at the end of the note
    src.connect(g); g.connect(MASTER); g.connect(WET); src.start(t); src.stop(t + Math.max(0.15, dur) + 0.8); NODES.push(src);
    return true;
  }
  const lead = (n, t, dur) => { if (!grand(n, t, dur, 1)) piano(n, t, dur, 1); };
  const bass = (n, t, dur) => { if (!grand(n, t, dur, 0.6)) piano(n, t, dur, 0.7); };
  function kick(t, v) { const o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12); env(g, t, 0.3 * (v || 1), 0.005, 0.16); o.connect(g); g.connect(MASTER); o.start(t); o.stop(t + 0.2); NODES.push(o); }
  function noise(t, dur, type, freq, lvl) { const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = NOISE; f.type = type; f.frequency.value = freq; env(g, t, lvl, 0.003, dur); s.connect(f); f.connect(g); g.connect(MASTER); s.start(t); s.stop(t + dur + 0.02); NODES.push(s); }
  const snare = (t, v) => noise(t, 0.14, "bandpass", 1800, 0.16 * (v || 1));
  const hat = (t, v) => noise(t, 0.04, "highpass", 7000, 0.06 * (v || 1));
  const clap = (t) => { [0, 0.012, 0.025].forEach((d) => noise(t + d, 0.08, "bandpass", 1200, 0.14)); };
  // one bar of 8 beats per lyric line; drums by style
  function drums(kind, t, b) {
    for (let i = 0; i < 8; i++) {
      const x = t + i * b;
      if (kind === "shanty") { if (i % 2 === 0) kick(x, 0.8); else snare(x, 0.5); }
      else if (kind === "chant") { if (i % 2 === 0) kick(x, 0.7); else clap(x); }
      else if (kind === "rap") { if (i % 4 === 0 || i % 4 === 2.5) kick(x); if (i % 4 === 2) kick(x + b * 0.5, 0.8); if (i % 2 === 1) snare(x); hat(x); hat(x + b / 2, 0.6); }
      else if (kind === "march") { if (i % 2 === 0) kick(x, 0.8); snare(x, i % 2 ? 0.8 : 0.4); if (i % 4 === 3) { snare(x + b / 3, 0.35); snare(x + 2 * b / 3, 0.35); } }
      else if (kind === "cheer") { if (i % 4 === 0 || i % 4 === 1) kick(x); if (i % 4 === 2) clap(x); }
      else if (kind === "soft") { if (i % 4 === 0) kick(x, 0.5); hat(x, 0.5); }
    }
  }
  function parsePhrase(ph) { return ph.map((s) => { const [p, d] = s.split(/\s+/); return { n: p === "-" ? null : midi(p), d: Number(d) || 1 }; }); }
  // Nursery: split the chosen public-domain tune (recall.js TUNES) into 8-beat phrases
  function nurseryPhrases(tuneKey) {
    const T = (S() && S().TUNES || {})[tuneKey] || (S() && S().TUNES || {}).twinkle; if (!T) return [["C4 8"]];
    const notes = T.notes.split(/\s+/).map((x) => { const [p, d] = x.split(":"); return p + " " + (Number(d) || 1); });
    const out = []; let cur = [], sum = 0;
    notes.forEach((x) => { cur.push(x); sum += Number(x.split(" ")[1]); if (sum >= 8 - 1e-6 || (sum >= 7 && Number(x.split(" ")[1]) >= 2)) { if (sum < 8) cur.push("- " + (8 - sum)); out.push(cur); cur = []; sum = 0; } });
    if (cur.length) { cur.push("- " + Math.max(0, 8 - sum)); out.push(cur); }
    return out;
  }
  function phraseFor(st, i, chorus, tuneKey) {
    const ph = st.nursery ? nurseryPhrases(tuneKey) : st.phrases;
    if (chorus && st.chorus) return st.chorus[i % st.chorus.length];
    return ph[i % ph.length];
  }

  // ---------- Timing: when each line and word plays (shared by the synth and by a recording) ----------
  function syl(w) { const B = S() && S().beats; return Math.max(1, B ? B(w) : 1); }
  function schedule(lines, style, tempo) {
    const st = STYLES[style], b = 60 / st.bpm / (tempo || 1), bar = 8 * b, out = [];
    lines.forEach((ln, i) => {
      const t0 = i * bar, words = String(ln.text).split(/\s+/).filter(Boolean), w = words.map(syl), tot = w.reduce((a, x) => a + x, 0) || 1;
      const span = (st.call ? 8 : 7) * b; let acc = 0;
      out.push({ i, t0, t1: t0 + bar, words: words.map((x, j) => { const s = t0 + (acc / tot) * span; acc += w[j]; return { w: x, t: s }; }) });
    });
    return { lines: out, total: lines.length * bar, b };
  }
  function playSynth(lines, style, tempo, tuneKey, from) {
    const st = STYLES[style], c = ctx(), sch = schedule(lines, style, tempo), b = sch.b, start = c.currentTime + 0.08 - (from ? sch.lines[from].t0 : 0);
    let verseN = 0, chorusN = 0;
    lines.forEach((ln, i) => {
      const t0 = start + sch.lines[i].t0; if (i < (from || 0)) { if (ln.chorus) chorusN++; else verseN++; return; }
      drums(st.drums, t0, b);
      if (st.bassline) { let t = t0; parsePhrase(st.bassline).forEach((x) => { if (x.n != null) bass(x.n, t, x.d * b); t += x.d * b; }); }
      else if (st.lead) { const root = parsePhrase(phraseFor(st, ln.chorus ? chorusN : verseN, ln.chorus, tuneKey)).find((x) => x.n != null); if (root) { bass(root.n - 24, t0, 4 * b); bass(root.n - 24 + 7, t0 + 4 * b, 4 * b); } }
      if (st.lead) { let t = t0; parsePhrase(phraseFor(st, ln.chorus ? chorusN : verseN, ln.chorus, tuneKey)).forEach((x) => { if (x.n != null) lead(x.n, t, x.d * b); t += x.d * b; }); }
      if (ln.chorus) chorusN++; else verseN++;
    });
    return { start, sch };
  }
  function stopAudio() { NODES.splice(0).forEach((n) => { try { n.stop(); } catch (e) {} }); if (AUD) { try { AUD.pause(); } catch (e) {} } }

  // ---------- Player state ----------
  const P = { playing: false, ex: null, start: 0, sch: null, lines: [], loop: true, tempo: 1, raf: 0, rec: null, recChunks: [], recMsg: "", sel: null, line: 0 };
  let AUD = null;
  function curLines(m, page) { return P.ex ? exampleLines(P.ex.e) : sungLines(songFor(m, page)); }
  function styleOf(k) { return (P.ex && P.ex.style) || pref(k).style || DEFAULT_STYLE; }
  async function play(m, page, from) {
    stop(true);
    const k = m.k, style = styleOf(k), lines = curLines(m, page), tune = (page && page.song && page.song.tune) || "twinkle";
    P.lines = lines; P.playing = true; P.line = from || 0;
    const useRec = !P.ex && pref(k).useRec && HAS_TAKE[k];
    if (useRec) {
      const take = await getTake(k);
      if (take && take.blob) {
        const sch = schedule(take.lines || lines, take.style || style, take.tempo || 1);
        AUD = new Audio(URL.createObjectURL(take.blob)); P.sch = sch; P.lines = take.lines || lines; P.audio = true;
        AUD.currentTime = from ? sch.lines[from].t0 : 0; AUD.play().catch(() => {});
        AUD.onended = () => { if (P.loop && P.playing) play(m, page, 0); else stop(); };
        tick(); logMethod(k, "play-own"); return;
      }
    }
    P.audio = false;
    const r = playSynth(lines, style, P.tempo, tune, from || 0); P.start = r.start; P.sch = r.sch;
    tick(); logMethod(k, P.ex ? "play-example" : "play");
    const endAt = r.sch.total - (from ? r.sch.lines[from].t0 : 0);
    clearTimeout(P.endT); P.endT = setTimeout(() => { if (!P.playing) return; if (P.loop && !P.rec) { logMethod(k, "loop"); play(m, page, 0); } else stop(); }, endAt * 1000 + 150);
  }
  function stop(quiet) { P.playing = false; clearTimeout(P.endT); cancelAnimationFrame(P.raf); stopAudio(); if (!quiet) paintKaraoke(-1, -1); }
  function now() { return P.audio && AUD ? AUD.currentTime : (AC ? AC.currentTime - P.start : 0); }
  function tick() {
    cancelAnimationFrame(P.raf);
    const step = () => {
      if (!P.playing || !P.sch) return;
      const t = now(), L = P.sch.lines; let li = L.findIndex((x) => t >= x.t0 && t < x.t1); if (li < 0) li = t >= (L[L.length - 1] || { t1: 0 }).t1 ? L.length - 1 : 0;
      const ws = L[li].words; let wi = -1; ws.forEach((w, j) => { if (t >= w.t) wi = j; });
      P.line = li; paintKaraoke(li, wi); P.raf = requestAnimationFrame(step);
    };
    P.raf = requestAnimationFrame(step);
  }
  // the big current line with the current word lit (also the caption); reduced motion just swaps the line
  function paintKaraoke(li, wi) {
    const box = document.querySelector(".jkara"); if (!box) return;
    const ln = P.lines[li >= 0 ? li : 0]; if (!ln) return;
    if (box.dataset.li !== String(li)) {
      box.dataset.li = String(li);
      box.innerHTML = `<small>${esc(ln.part)}</small><span>${String(ln.text).split(/\s+/).filter(Boolean).map((w, j) => `<b data-w="${j}">${esc(w)}</b>`).join(" ")}</span>`;
      document.querySelectorAll(".jline").forEach((el) => el.classList.toggle("on", el.dataset.li === String(li)));
    }
    box.querySelectorAll("b[data-w]").forEach((el) => el.classList.toggle("on", Number(el.dataset.w) === wi));
  }

  // ---------- Recording (stays on this device) ----------
  async function startRec(m, page) {
    if (!navigator.mediaDevices || !W.MediaRecorder) { P.recMsg = "Recording isn't available in this browser."; return; }
    let stream; try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { P.recMsg = "The microphone wasn't allowed, so nothing was recorded."; rerender(); return; }
    const k = m.k, style = styleOf(k), lines = curLines(m, page), tempo = P.tempo;
    const rec = new MediaRecorder(stream); P.rec = rec; P.recChunks = []; P.recMsg = "Recording… sing along with the music (headphones help).";
    rec.ondataavailable = (e) => { if (e.data && e.data.size) P.recChunks.push(e.data); };
    rec.onstop = async () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(P.recChunks, { type: rec.mimeType || "audio/webm" });
      await putTake(k, { blob, style, tempo, lines, at: Date.now() }); HAS_TAKE[k] = true;
      pref(k).useRec = true; savePrefs(); logMethod(k, "record");   // Ken: Use my recording turns on by itself
      P.rec = null; P.loop = P.loopWas !== false; P.recMsg = "Saved on this phone. Your recording now plays; switch it off to hear the music instead."; rerender();
    };
    P.loopWas = P.loop; rec.start(); P.loop = false; await play(m, page, 0); rerender();
    clearTimeout(P.recT); P.recT = setTimeout(() => { if (P.rec) stopRec(); }, (P.sch ? P.sch.total : 30) * 1000 + 400);
  }
  function stopRec() { clearTimeout(P.recT); if (P.rec && P.rec.state !== "inactive") P.rec.stop(); stop(); }

  // ---------- Screen ----------
  let RERENDER = null;
  const rerender = () => { if (RERENDER) RERENDER(); else if (typeof W.render === "function") W.render(); };
  // The jingle method in five steps (Ken, Nov 26: "get used to the jingle methodology")
  const HOW = (open) => `<details class="jhow"${open ? " open" : ""}><summary>How the jingle method works</summary><ol>
    <li><b>Pick a style.</b> A ✓ means it suits this kind of fact; a ! means it may not, but you decide.</li>
    <li><b>Hear an example</b> to get the feel of the style.</li>
    <li><b>Make it yours:</b> drag a fact onto the hook, a verse or the chorus, or type your own words. About the same number of beats on each line sings best.</li>
    <li><b>Sing along three times</b> with the words lighting up, slower at 0.75× first. Then record yourself; your voice becomes the one that plays.</li>
    <li><b>Later, recall it:</b> look only at the topic (or your recall map) and sing the line that goes with each fact.</li></ol></details>`;
  function html(m, page, opts) {
    opts = opts || {};
    const k = m.k, Pk = pref(k), style = styleOf(k), type = factType(m), fit = FIT[style];
    if (!SAMPLES_ASKED) { try { ctx(); } catch (e) {} }   // start fetching the piano notes as soon as the player opens
    if (HAS_TAKE[k] == null) { HAS_TAKE[k] = false; getTake(k).then((t) => { if (t) { HAS_TAKE[k] = true; rerender(); } }); }
    const song = songFor(m, page), facts = m.allFacts || m.facts;
    const good = (s) => FIT[s].good.includes(type), weak = (s) => !!FIT[s].weak[type];
    let h = `<section class="jplayer${opts.embedded ? " embedded" : ""}" id="askRes"><header class="jhead">${opts.embedded ? `<button type="button" class="jback" data-act="jclose">✕ Close</button>` : `<button type="button" class="jback" data-act="jback">‹ Sheet</button>`}<h2>Jingle</h2>
      <button type="button" class="jfav${Pk.fav ? " on" : ""}" data-act="jfav" aria-pressed="${!!Pk.fav}" aria-label="${Pk.fav ? "Remove from My jingles" : "Add to My jingles"}">${Pk.fav ? "★" : "☆"}</button></header>
      <h3 class="jtitle">${esc(m.title)}</h3>
      ${opts.embedded ? "" : `<div class="jlinks"><button type="button" data-act="jcard">Card</button><button type="button" data-act="jback">Recall map</button></div>`}`;
    const favs = Object.keys(PREFS).filter((x) => PREFS[x].fav && x !== k && (W.SCALES || {})[x]);
    if (favs.length && !opts.embedded) h += `<p class="jmy"><b>My jingles:</b> ${favs.map((x) => `<button type="button" data-act="jopen" data-k="${esc(x)}">${esc(W.SCALES[x].title)}</button>`).join("")}</p>`;
    h += `<div class="jbody"><div class="jmain"><div class="jstyles"><p class="asklabel">Style <span>8 to choose from · more coming</span></p><div class="jchips">${ORDER.map((s) => `<button type="button" data-act="jstyle" data-v="${s}" class="${style === s ? "on" : ""}" aria-pressed="${style === s}">${esc(STYLES[s].name)}${good(s) ? ' <i class="ok" aria-label="good fit">✓</i>' : weak(s) ? ' <i class="warn" aria-label="may not fit">!</i>' : ""}</button>`).join("")}</div>`;
    if (good(style)) h += `<p class="jfit ok">Good fit for ${esc(TYPES[type])}. ${esc(fit.why)}</p>`;
    else if (weak(style)) { const alt = bestFor(type); h += `<p class="jfit warn">${esc(STYLES[style].name)} may not be the best fit for ${esc(TYPES[type])}. ${esc(fit.weak[type])} You decide. <button type="button" data-act="jstyle" data-v="${alt}">Try ${esc(STYLES[alt].name)}</button></p>`; }
    if (style === "nursery") { const T = (S().TUNES || {}), cur = (page.song && page.song.tune) || "twinkle"; h += `<div class="jtunes">${Object.entries(T).map(([v, t]) => `<button type="button" data-act="jtune" data-v="${v}" class="${cur === v ? "on" : ""}">${esc(t.name)}</button>`).join("")}</div>`; }
    else h += `<p class="jtune">${esc(STYLES[style].tune)}</p>`;
    h += `</div>`;
    const exs = EX[style] || [];
    h += `<p class="asklabel">3 examples you can use <span class="jdraft">${DRAFT}</span></p><div class="jexs">`;
    for (let i = 0; i < 3; i++) { const e = exs[i]; const on = P.ex && P.ex.style === style && P.ex.i === i;
      h += e ? `<button type="button" class="jex${on ? " on" : ""}" data-act="jex" data-i="${i}"><b>♪ ${esc(e.t)}</b><small>${on && P.playing ? "Playing" : esc(e.n)}</small></button>` : `<div class="jex soon"><b>♪</b><small>Next batch</small></div>`; }
    h += `</div>`;
    if (P.ex) h += `<p class="jexnote">Playing an example. <button type="button" data-act="jmine">Back to my song</button></p>`;
    // the fact tray and the song's parts (drag, or tap a fact then tap a line)
    h += `<p class="asklabel">Drag a fact onto a part of the song <span>or tap a fact, then a line</span></p><div class="jtray">${facts.map((f, i) => `<button type="button" class="jfact${P.sel === i ? " on" : ""}" data-fact="${i}" data-act="jpick" data-i="${i}">${esc(clip(f.label, 28))}</button>`).join("")}</div>`;
    const row = (part, key, text, li, ph) => `<div class="jline" data-li="${li}" data-slot="${esc(key)}"><span class="jpart">${esc(part)}</span><input type="text" data-jline="${esc(key)}" value="${esc(text)}" placeholder="${esc(ph || "")}" aria-label="${esc(part)} line"><em>${S().beats ? S().beats(text) + " beats" : ""}</em></div>`;
    let li = 0;
    h += `<div class="jlines">${row("Hook", "hook", song.hook, li++)}`;
    song.verses.forEach((v) => { h += row(v.slot, "v:" + v.key, v.text, li++, starter(v.fact)); });
    String(song.chorus).split(/\s*\/\s*/).filter(Boolean).forEach((t, j, a) => { h += j === 0 ? row("Chorus", "chorus", a.join(" / "), li) : ""; li++; });
    h += `</div>`;
    // the player
    const takeOn = !!(Pk.useRec && HAS_TAKE[k]);
    h += `</div><aside class="jside"><div class="jdock"><div class="jkara" aria-live="polite" data-li=""><small>Hook</small><span>${esc(P.ex ? P.ex.e.hook : song.hook)}</span></div>
      <div class="jcontrols"><button type="button" class="jloop${P.loop ? " on" : ""}" data-act="jloop" aria-pressed="${P.loop}" aria-label="Loop">⟲</button>
      <button type="button" data-act="jprev" aria-label="Previous line">⏮</button>
      <button type="button" class="jplay" data-act="jplay" aria-label="${P.playing ? "Stop" : "Play"}">${P.playing ? "■" : "▶"}</button>
      <button type="button" data-act="jnext" aria-label="Next line">⏭</button>
      <button type="button" class="jrec${P.rec ? " on" : ""}" data-act="jrec">${P.rec ? "■ Stop" : HAS_TAKE[k] ? "● Re-record" : "● Record"}</button></div>
      <div class="jbottom"><div class="jtempo" role="group" aria-label="Speed">${[0.75, 1, 1.25].map((t) => `<button type="button" data-act="jtempo" data-v="${t}" class="${P.tempo === t ? "on" : ""}">${t}×</button>`).join("")}</div>
      <label class="juse${HAS_TAKE[k] ? "" : " off"}"><span>Use my recording</span><input type="checkbox" data-act="juserec" ${takeOn ? "checked" : ""} ${HAS_TAKE[k] ? "" : "disabled"}></label></div></div>
      ${P.recMsg ? `<p class="jrecmsg" role="status">${esc(P.recMsg)}</p>` : ""}
      <p class="sthelp">Recordings stay on this device. Sing it three times, then look only at your pictures and sing the line that goes with each one.</p>${HOW(opts.embedded)}</aside></div></section>`;
    return h;
  }

  // ---------- Actions ----------
  const st = () => S().state, mdl = () => S().model(st().k, { mine: S().page(), layout: "cards" }), page = () => S().page();
  function setLine(key, val) {
    const pg = page(); if (!pg) return; pg.song = pg.song || { tune: "", lines: {}, print: false, asked: false }; pg.song.lines = pg.song.lines || {};
    const k2 = key.startsWith("v:") ? key.slice(2) : key; pg.song.lines[k2] = val; S().savePage();
  }
  function dropFact(fi, slotKey) {
    const m = mdl(), facts = m.allFacts || m.facts, f = facts[fi]; if (!f) return;
    if (slotKey === "hook" || slotKey === "chorus") { setLine(slotKey, starter(f)); }
    else if (slotKey.startsWith("v:")) {
      const song = songFor(m, page()), order = song.order.slice(), from = order.indexOf(fi), to = order.indexOf(Number(slotKey.slice(2)));
      if (from >= 0 && to >= 0) { order[from] = order[to]; order[to] = fi; pref(m.k).slots = order; savePrefs(); }
    }
    P.sel = null; logMethod(m.k, "arrange");
  }
  W.PAGE_ACTIONS = Object.assign(W.PAGE_ACTIONS || {}, {
    jback: () => { stop(); st().jingle = false; P.ex = null; },
    jcard: () => { stop(); st().jingle = false; P.ex = null; if (W.PAGE_ACTIONS.stback) return W.PAGE_ACTIONS.stback(); },
    jopen: (b) => { stop(); P.ex = null; if (W.PAGE_ACTIONS.stopenpage) W.PAGE_ACTIONS.stopenpage({ dataset: { k: b.dataset.k } }); st().jingle = true; },
    jfav: () => { const p = pref(st().k); p.fav = !p.fav; savePrefs(); },
    jstyle: (b) => { const was = P.playing; stop(); P.ex = null; pref(st().k).style = b.dataset.v; savePrefs(); if (was) setTimeout(() => play(mdl(), page(), 0), 30); },
    jtune: (b) => { const pg = page(); pg.song.tune = b.dataset.v; S().savePage(); },
    jex: (b) => { const style = styleOf(st().k), i = Number(b.dataset.i), e = (EX[style] || [])[i]; if (!e) return; const same = P.ex && P.ex.style === style && P.ex.i === i && P.playing; stop(); P.ex = same ? null : { style, i, e }; if (!same) play(mdl(), page(), 0); },
    jmine: () => { stop(); P.ex = null; },
    jplay: () => { if (P.playing) { stop(); } else play(mdl(), page(), 0); },
    jprev: () => { if (!P.lines.length) P.lines = curLines(mdl(), page()); play(mdl(), page(), Math.max(0, P.line - 1)); },
    jnext: () => { if (!P.lines.length) P.lines = curLines(mdl(), page()); play(mdl(), page(), Math.min(P.lines.length - 1, P.line + 1)); },
    jloop: () => { P.loop = !P.loop; },
    jtempo: (b) => { P.tempo = Number(b.dataset.v) || 1; if (P.playing && !P.audio) play(mdl(), page(), P.line); },
    jrec: () => { if (P.rec) stopRec(); else { P.ex = null; startRec(mdl(), page()); } },
    juserec: (b) => { pref(st().k).useRec = !!b.checked; savePrefs(); if (P.playing) play(mdl(), page(), 0); },
    jpick: (b) => { const i = Number(b.dataset.i); P.sel = P.sel === i ? null : i; },
  });
  // typing a line saves it without redrawing (the keyboard stays up)
  document.addEventListener("input", (e) => {
    const t = e.target; if (!t || !t.dataset || t.dataset.jline == null) return;
    setLine(t.dataset.jline, t.value);
    const em = t.parentElement && t.parentElement.querySelector("em"); if (em && S().beats) em.textContent = S().beats(t.value) + " beats";
  });
  // tap a fact, then tap a line (works everywhere); or drag a fact chip onto a line with a finger or a mouse
  let DRAG = null;
  document.addEventListener("click", (e) => {
    if (P.sel == null) return; const line = e.target.closest && e.target.closest(".jline[data-slot]"); if (!line) return;
    e.preventDefault(); dropFact(P.sel, line.dataset.slot); rerender();
  }, true);
  document.addEventListener("pointerdown", (e) => {
    const chip = e.target.closest && e.target.closest(".jfact[data-fact]"); if (!chip) return;
    DRAG = { i: Number(chip.dataset.fact), x: e.clientX, y: e.clientY, ghost: null, chip };
  });
  document.addEventListener("pointermove", (e) => {
    if (!DRAG) return;
    if (!DRAG.ghost) {
      if (Math.hypot(e.clientX - DRAG.x, e.clientY - DRAG.y) < 8) return;
      DRAG.ghost = DRAG.chip.cloneNode(true); DRAG.ghost.className = "jfact jghost"; document.body.appendChild(DRAG.ghost); DRAG.chip.classList.add("lifted");
    }
    e.preventDefault();
    DRAG.ghost.style.left = e.clientX + "px"; DRAG.ghost.style.top = e.clientY + "px";
    const over = document.elementFromPoint(e.clientX, e.clientY), line = over && over.closest && over.closest(".jline[data-slot]");
    document.querySelectorAll(".jline.drop").forEach((x) => x !== line && x.classList.remove("drop")); if (line) line.classList.add("drop");
  }, { passive: false });
  document.addEventListener("pointerup", (e) => {
    if (!DRAG) return; const d = DRAG; DRAG = null;
    if (!d.ghost) return;
    d.ghost.remove(); d.chip.classList.remove("lifted"); document.querySelectorAll(".jline.drop").forEach((x) => x.classList.remove("drop"));
    const over = document.elementFromPoint(e.clientX, e.clientY), line = over && over.closest && over.closest(".jline[data-slot]");
    if (line) { dropFact(d.i, line.dataset.slot); rerender(); }
    const swallow = (ev) => { ev.stopPropagation(); ev.preventDefault(); document.removeEventListener("click", swallow, true); };
    document.addEventListener("click", swallow, true); setTimeout(() => document.removeEventListener("click", swallow, true), 300);
  });

  W.OB_JINGLE = { html: (m, pg, o) => html(m, pg, o), setRerender: (f) => { RERENDER = f; }, stop, factType, schedule, STYLES, EX, FIT, ORDER };
})();
