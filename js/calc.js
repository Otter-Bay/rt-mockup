/* On-screen calculator, like the one on the NBRC exam. Owner: Ken + Claude.
   A "Calc" button at the top of the answer ribbon opens a floating calculator over the question.
   It leaves the A-D and Final buttons uncovered, can be dragged anywhere (up, down and side to side; Ken, Nov 27), and (like the NBRC exam)
   closes when you move to a new question. Works with taps, clicks, or the keyboard.
   It opens low, over the answer choices, and scrolls the question so the stem, values and any image
   stay readable above it.
   app.js calls calcButton() inside the ribbon, calcPanel() at the end of render(), and calcAfterRender() after drawing. */

const CALC = { open: false, qid: null, y: null, x: null, justOpened: false, disp: "0", acc: null, op: null, fresh: false, mem: 0, err: "", expr: "" };
const CALC_SYM = { "+": "+", "-": "−", "*": "×", "/": "÷" };
const CALC_ICON = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="2.5" width="14" height="19" rx="2.5"/><path d="M8 6.5h8"/><path d="M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 14.5h.01M12 14.5h.01M15.5 14.5h.01M8.5 18h.01M12 18h.01M15.5 18h.01"/></svg>';

// Key layout, 6 columns x 4 rows plus a memory strip, so the calculator stays short: [label, action, value, extra class]
const CALC_MEM = [["MC", "mem", "c"], ["MR", "mem", "r"], ["M+", "mem", "+"], ["M−", "mem", "-"]];
const CALC_KEYS = [
  [["7", "d", "7"], ["8", "d", "8"], ["9", "d", "9"], ["÷", "op", "/", "o"], ["⌫", "clr", "bs", "f"], ["C", "clr", "c", "f"]],
  [["4", "d", "4"], ["5", "d", "5"], ["6", "d", "6"], ["×", "op", "*", "o"], ["%", "fn", "pct", "f"], ["CE", "clr", "ce", "f"]],
  [["1", "d", "1"], ["2", "d", "2"], ["3", "d", "3"], ["−", "op", "-", "o"], ["√x", "fn", "sqrt", "f"], ["x²", "fn", "sq", "f"]],
  [["±", "fn", "neg", "f"], ["0", "d", "0"], [".", "d", "."], ["+", "op", "+", "o"], ["1/x", "fn", "inv", "f"], ["=", "eq", "", "eq"]],
];
const CALC_ARIA = { "⌫": "Backspace", "−": "Minus", "×": "Times", "÷": "Divided by", "±": "Change sign", "√x": "Square root", "x²": "Square", "1/x": "Reciprocal",
  "%": "Percent", "CE": "Clear entry", "C": "Clear all", "MC": "Memory clear", "MR": "Memory recall", "M+": "Memory add", "M−": "Memory subtract", "=": "Equals" };

function calcFmt(n) {
  if (!isFinite(n)) return null;
  if (n === 0) return "0";
  const a = Math.abs(n);
  if (a >= 1e12 || a < 1e-9) return n.toExponential(6).replace(/\.?0+e/, "e");
  return String(parseFloat(n.toPrecision(12)));
}
function calcFail(msg) { CALC.err = msg; CALC.disp = "0"; CALC.acc = null; CALC.op = null; CALC.fresh = true; CALC.expr = ""; }
function calcSet(n) { const s = calcFmt(n); if (s === null) return calcFail("Error"); CALC.disp = s; CALC.fresh = true; }
function calcRun(a, op, b) {
  if (op === "/" && b === 0) { calcFail("Cannot divide by zero"); return null; }
  return op === "+" ? a + b : op === "-" ? a - b : op === "*" ? a * b : a / b;
}
function calcReset() { Object.assign(CALC, { disp: "0", acc: null, op: null, fresh: false, err: "", expr: "" }); }

function calcPress(kind, v) {
  const C = CALC;
  if (C.err && !(kind === "clr" && v !== "bs") && kind !== "d" && kind !== "mem") return;
  if (C.err && (kind === "d" || kind === "mem")) calcReset();
  const x = parseFloat(C.disp);
  if (kind === "d") {
    if (C.fresh) { C.disp = v === "." ? "0." : v; C.fresh = false; if (!C.op) C.expr = ""; return; }
    if (v === "." && C.disp.includes(".")) return;
    if (C.disp.replace(/[-.]/g, "").length >= 12) return;
    C.disp = C.disp === "0" && v !== "." ? v : C.disp === "-0" && v !== "." ? "-" + v : C.disp + v;
  } else if (kind === "op") {
    if (C.op && !C.fresh) { const r = calcRun(C.acc, C.op, x); if (r === null) return; calcSet(r); C.acc = parseFloat(C.disp); }
    else if (!C.op) C.acc = x;
    C.op = v; C.fresh = true; C.expr = `${calcFmt(C.acc)} ${CALC_SYM[v]}`;
  } else if (kind === "eq") {
    if (!C.op) { C.expr = `${calcFmt(x)} =`; C.fresh = true; return; }
    const r = calcRun(C.acc, C.op, x); if (r === null) return;
    C.expr = `${calcFmt(C.acc)} ${CALC_SYM[C.op]} ${calcFmt(x)} =`; calcSet(r); C.acc = null; C.op = null;
  } else if (kind === "fn") {
    if (v === "neg") { if (C.disp !== "0") C.disp = C.disp.startsWith("-") ? C.disp.slice(1) : "-" + C.disp; return; }
    if (v === "sqrt") { if (x < 0) return calcFail("Invalid input"); calcSet(Math.sqrt(x)); }
    if (v === "sq") calcSet(x * x);
    if (v === "inv") { if (x === 0) return calcFail("Cannot divide by zero"); calcSet(1 / x); }
    if (v === "pct") calcSet(C.op && (C.op === "+" || C.op === "-") && C.acc !== null ? C.acc * x / 100 : x / 100);
  } else if (kind === "clr") {
    if (v === "c") calcReset();
    else if (v === "ce") { C.disp = "0"; C.err = ""; C.fresh = false; }
    else if (v === "bs") { if (C.fresh) return; C.disp = C.disp.length > 1 ? C.disp.slice(0, -1) : "0"; if (C.disp === "-" || C.disp === "-0") C.disp = "0"; }
  } else if (kind === "mem") {
    if (v === "c") C.mem = 0;
    if (v === "r") { C.disp = calcFmt(C.mem); C.fresh = true; }
    if (v === "+") { C.mem += x; C.fresh = true; }
    if (v === "-") { C.mem -= x; C.fresh = true; }
  }
}

function calcDisplay() {
  const C = CALC;
  return `<span class="calcexpr" aria-hidden="true"><span class="calcm" title="Value in memory">${C.mem !== 0 ? "M" : ""}</span><span>${C.expr || "&nbsp;"}</span></span>
    <output class="calcval ${C.err ? "err" : ""}" aria-live="polite">${C.err || C.disp}</output>`;
}

/* Ribbon button (app.js puts it at the top of the answer ribbon). */
function calcButton() {
  const on = CALC.open && CALC.qid === (typeof Q === "function" && Q() ? Q().id : null);
  return `<button type="button" class="calcbtn ${on ? "on" : ""}" data-calc="toggle" aria-pressed="${on}" aria-label="Calculator">${CALC_ICON}<span>Calc</span></button>`;
}

/* Floating calculator (app.js adds it at the end of render()). Closes on a new question, like the NBRC exam. */
function calcPanel() {
  const q = typeof Q === "function" ? Q() : null;
  if (!CALC.open || !q || CALC.qid !== q.id) { CALC.open = false; return ""; }
  const pos = (CALC.y === null ? "" : `top:${CALC.y}px;bottom:auto;`) + (CALC.x === null ? "" : `left:${CALC.x}px;`);
  return `<div class="calc" id="calc" role="dialog" aria-label="Calculator" style="${pos}">
    <div class="calchead" data-calc-drag title="Drag to move"><span class="calcgrip" aria-hidden="true"></span><div class="calcdisp" id="calcdisp">${calcDisplay()}</div><button type="button" class="calcx" data-calc="toggle" aria-label="Close calculator">${ICON.x}</button></div>
    <div class="calcmem">${CALC_MEM.map(([l, k, v]) => `<button type="button" class="ck m" data-calc="${k}" data-v="${v}" aria-label="${CALC_ARIA[l]}">${l}</button>`).join("")}</div>
    <div class="calckeys">${CALC_KEYS.map((row) => row.map(([l, k, v, cls]) =>
      `<button type="button" class="ck ${cls || ""}" data-calc="${k}" data-v="${v}"${CALC_ARIA[l] ? ` aria-label="${CALC_ARIA[l]}"` : ""}>${l}</button>`).join("")).join("")}</div>
  </div>`;
}

function calcRefresh() { const d = document.getElementById("calcdisp"); if (d) d.innerHTML = calcDisplay(); }

function calcToggle() {
  const q = Q(); if (!q) return;
  if (CALC.open && CALC.qid === q.id) CALC.open = false;
  else { if (CALC.qid !== q.id) { calcReset(); CALC.y = null; CALC.x = null; } CALC.open = true; CALC.qid = q.id; CALC.justOpened = true; }
  render();
}

/* After each render: leave room to scroll everything above the calculator, and when it first opens,
   scroll so the data the student needs (stem, values table, image) sits fully above it. */
function calcAfterRender() {
  const calc = document.getElementById("calc"), content = document.getElementById("content");
  if (!content) return;
  if (!calc) { content.style.paddingBottom = ""; return; }
  const ct = content.getBoundingClientRect(), cb = calc.getBoundingClientRect();
  const scale = ct.height / content.offsetHeight || 1;
  const covered = Math.max(0, (ct.bottom - cb.top) / scale);            // content hidden under the calculator
  content.style.paddingBottom = Math.round(covered + 16) + "px";
  if (!CALC.justOpened) return;
  CALC.justOpened = false;
  const opts = content.querySelector(".opts");
  const kids = [...content.children].filter((el) => !opts || el.compareDocumentPosition(opts) & Node.DOCUMENT_POSITION_FOLLOWING);
  if (!kids.length) return;
  const top = kids[0].offsetTop - content.offsetTop - 12;
  const bottom = kids[kids.length - 1].offsetTop + kids[kids.length - 1].offsetHeight - content.offsetTop + 12;
  const visible = content.clientHeight - covered;
  const fit = (t, b) => Math.min(Math.max(content.scrollTop, b - visible), t);   // smallest scroll that shows t..b
  let want;
  if (bottom - top <= visible) want = fit(top, bottom);                          // whole stem + values + image fits
  else {
    // Otherwise the values table and image come first: show them whole, with as much of the stem as fits.
    const data = kids.filter((el) => el.matches(".vals, figure"));
    if (data.length) {
      const dt = data[0].offsetTop - content.offsetTop - 12, last = data[data.length - 1];
      const db = last.offsetTop + last.offsetHeight - content.offsetTop + 12;
      want = db - dt <= visible ? Math.max(db - visible, top) : dt;
    } else want = top;
  }
  content.scrollTop = Math.max(0, want);
}

document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-calc]");
  if (!b || typeof QS === "undefined" || !QS.length) return;
  const k = b.dataset.calc;
  if (k === "toggle") return calcToggle();
  calcPress(k, b.dataset.v); calcRefresh();
});

// Keyboard: digits, + - * /, Enter or =, Backspace, Delete (CE), Escape (C, then close). Ignored while typing in a text box.
document.addEventListener("keydown", (e) => {
  if (!document.getElementById("calc") || e.ctrlKey || e.metaKey || e.altKey) return;
  const t = e.target; if (t && (t.tagName === "TEXTAREA" || t.tagName === "INPUT")) return;
  if (S.view || S.scale || S.fb || S.settings || S.intro) return;
  const k = e.key; let a = null;
  if (/^[0-9]$/.test(k) || k === "." || k === ",") a = ["d", k === "," ? "." : k];
  else if ("+-*/".includes(k) && k.length === 1) a = ["op", k];
  else if (k === "x" || k === "X") a = ["op", "*"];
  else if (k === "Enter" || k === "=") a = ["eq", ""];
  else if (k === "Backspace") a = ["clr", "bs"];
  else if (k === "Delete") a = ["clr", "ce"];
  else if (k === "%") a = ["fn", "pct"];
  else if (k === "Escape") { e.stopImmediatePropagation(); if (CALC.disp !== "0" || CALC.op || CALC.err) { calcPress("clr", "c"); calcRefresh(); } else { CALC.open = false; render(); } e.preventDefault(); return; }
  if (!a) return;
  e.preventDefault(); calcPress(a[0], a[1]); calcRefresh();
  const btn = document.querySelector(`#calc [data-calc="${a[0]}"][data-v="${a[1]}"]`);
  if (btn) { btn.classList.add("hit"); setTimeout(() => btn.classList.remove("hit"), 120); }
}, true);

// Drag the calculator anywhere on the screen by its title bar (up, down and side to side).
let calcDrag = null;
document.addEventListener("pointerdown", (e) => {
  const h = e.target.closest("[data-calc-drag]");
  if (!h || e.target.closest("[data-calc]")) return;
  const el = document.getElementById("calc"), phone = document.getElementById("phone");
  const scale = phone.getBoundingClientRect().height / phone.offsetHeight || 1;
  calcDrag = { el, phone, scale, x0: e.clientX, y0: e.clientY, left0: el.offsetLeft, top0: el.offsetTop };
  h.setPointerCapture(e.pointerId); e.preventDefault();
});
document.addEventListener("pointermove", (e) => {
  if (!calcDrag) return;
  const { el, phone, scale, x0, y0, left0, top0 } = calcDrag;
  const maxY = phone.clientHeight - el.offsetHeight - 8, maxX = phone.clientWidth - el.offsetWidth - 8;
  CALC.y = Math.round(Math.min(maxY, Math.max(8, top0 + (e.clientY - y0) / scale)));
  CALC.x = Math.round(Math.min(maxX, Math.max(8, left0 + (e.clientX - x0) / scale)));
  el.style.top = CALC.y + "px"; el.style.bottom = "auto"; el.style.left = CALC.x + "px";
});
document.addEventListener("pointerup", () => { if (calcDrag) { calcDrag = null; calcAfterRender(); } });
