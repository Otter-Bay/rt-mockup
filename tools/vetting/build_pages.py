"""Puts the Ask and Go-to-question additions into the private question-vetting pages (Claude artifacts).
Usage: python3 tools/vetting/build_pages.py BUNDLE.js OUT_DIR PAGE.html [PAGE.html ...]
Each PAGE.html is the page as last read from its artifact. Writes OUT_DIR/<same name>, ready to republish to the same artifact.
Safe to re-run: a page that already has the additions gets them replaced, not doubled."""
import pathlib, re, sys
bundle = pathlib.Path(sys.argv[1]).read_text(encoding="utf-8")
out = pathlib.Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
COUNT = '<span class="count">${S.page === "stats" ? "Stats" : S.results && !S.reviewing ? "Results" : "Question " + (S.qi + 1) + " of " + S.set.length}</span>'
# On the question list the same spot becomes "< Back to question 12": the top bar doesn't scroll, so it's always in reach.
BACK_BTN = ('${window.VET_MODE && S.page === "stats" && QS.length ? `<button type="button" class="count countbtn" data-act="backquiz" aria-label="Back to question ${S.qi + 1}">'
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>Back to question ${S.qi + 1}</button>` : `')
COUNT_BTN = BACK_BTN + ('${S.page === "quiz" && !S.results && window.VET_MODE ? `<button type="button" class="count countbtn" data-act="stats" aria-label="Question ${S.qi + 1} of ${S.set.length}. Open the list to go to any question">'
             'Question ${S.qi + 1} of ${S.set.length}<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>` : `' + COUNT + '`}`}')
CHART = '<button type="button" class="iconbtn" data-act="stats" aria-label="Stats and review list">${ICON.chart}</button>'
CHART_VET = '${window.VET_MODE ? "" : `' + CHART + '`}'   # vetting: the question button opens the same list, so no chart icon (Ken, Nov 20)
CHIPS = '<div class="chips">${chip("all", "All " + n.total)}'
START, END = "<script>\n/* OB vetting additions */\n", "\n/* end OB vetting additions */\n</script>\n"
for f in sys.argv[3:]:
    p = pathlib.Path(f); s = p.read_text(encoding="utf-8")
    s = re.sub(re.escape(START) + r".*?" + re.escape(END), "", s, flags=re.S)
    s = re.sub(r"<script>\n/\* Ask in the vetting pages\..*?</script>\n", "", s, flags=re.S)   # older form of the Ask addition
    if COUNT in s and 'data-act="backquiz" aria-label="Back to question' not in s: s = s.replace(COUNT, COUNT_BTN, 1)   # once only, so re-runs don't nest it
    if CHART in s and CHART_VET not in s: s = s.replace(CHART, CHART_VET, 1)
    if "obGotoBox" not in s: s = s.replace(CHIPS, '${window.obGotoBox ? window.obGotoBox() : ""}' + CHIPS, 1)
    s = s.replace('\n    <div class="row"><button type="button" class="btn grey" data-act="backquiz">Back to questions</button></div>', "")   # replaced by the top-bar button
    # Image viewer: open sideways only when the screen is upright; a sideways phone or a computer shows it straight (Ken, Nov 22)
    s = s.replace("S.zoom = 1; S.rot = true; }", "S.zoom = 1; S.rot = innerWidth < innerHeight; }")
    # calculator drags side to side as well as up and down (Ken, Nov 27), same as js/calc.js in the apps
    for a, b in [["   It leaves the A-D and Final buttons uncovered, can be dragged up or down, and (like the NBRC exam)", "   It leaves the A-D and Final buttons uncovered, can be dragged anywhere (up, down and side to side; Ken, Nov 27), and (like the NBRC exam)"], ["const CALC = { open: false, qid: null, y: null, justOpened: false, disp: \"0\", acc: null, op: null, fresh: false, mem: 0, err: \"\", expr: \"\" };", "const CALC = { open: false, qid: null, y: null, x: null, justOpened: false, disp: \"0\", acc: null, op: null, fresh: false, mem: 0, err: \"\", expr: \"\" };"], ["  const pos = CALC.y === null ? \"\" : `top:${CALC.y}px;bottom:auto`;", "  const pos = (CALC.y === null ? \"\" : `top:${CALC.y}px;bottom:auto;`) + (CALC.x === null ? \"\" : `left:${CALC.x}px;`);"], ["  else { if (CALC.qid !== q.id) { calcReset(); CALC.y = null; } CALC.open = true; CALC.qid = q.id; CALC.justOpened = true; }", "  else { if (CALC.qid !== q.id) { calcReset(); CALC.y = null; CALC.x = null; } CALC.open = true; CALC.qid = q.id; CALC.justOpened = true; }"], ["// Drag the calculator up or down by its title bar.", "// Drag the calculator anywhere on the screen by its title bar (up, down and side to side)."], ["  calcDrag = { el, phone, scale, y0: e.clientY, top0: el.offsetTop };", "  calcDrag = { el, phone, scale, x0: e.clientX, y0: e.clientY, left0: el.offsetLeft, top0: el.offsetTop };"], ["  const { el, phone, scale, y0, top0 } = calcDrag;\n  const max = phone.clientHeight - el.offsetHeight - 8;\n  CALC.y = Math.round(Math.min(max, Math.max(8, top0 + (e.clientY - y0) / scale)));\n  el.style.top = CALC.y + \"px\"; el.style.bottom = \"auto\";", "  const { el, phone, scale, x0, y0, left0, top0 } = calcDrag;\n  const maxY = phone.clientHeight - el.offsetHeight - 8, maxX = phone.clientWidth - el.offsetWidth - 8;\n  CALC.y = Math.round(Math.min(maxY, Math.max(8, top0 + (e.clientY - y0) / scale)));\n  CALC.x = Math.round(Math.min(maxX, Math.max(8, left0 + (e.clientX - x0) / scale)));\n  el.style.top = CALC.y + \"px\"; el.style.bottom = \"auto\"; el.style.left = CALC.x + \"px\";"]]:
        s = s.replace(a, b, 1)
    s = s.replace('style="width:100%">Back to the question</button>', 'style="width:100%">Back to questions</button>')   # Ken, Nov 26: "s" says there are more questions
    s = s.replace("Scale and rule cards appear after you answer.", "Scale and rule cards, and Ask, appear after you answer.")
    s = s.replace("Tap the chart icon (top right) to see your progress or jump to any question.", "Tap “Question 1 of 200” at the top to go to any question.")
    s = s.replace("Tap the list icon (top right) to see progress or jump to any question.", "Tap “Question 1 of 200” at the top to go to any question.")
    # Screen layouts (Ken, Nov 26): the page's fit() asks views.js first, and Settings shows the "Screen layout" choice
    FIT0 = 'function fit() {\n  const phone = document.getElementById("phone");'
    if FIT0 in s and "window.viewFit && window.viewFit()" not in s: s = s.replace(FIT0, 'function fit() {\n  if (window.viewFit && window.viewFit()) return;   // views.js: phone, tablet and desktop layouts\n  const phone = document.getElementById("phone");', 1)
    SET0 = '<p style="margin:0;font-size:13px;color:var(--muted)">Changing the mode starts a new set of questions.</p>\n'
    if SET0 in s and "window.viewSettings ? window.viewSettings()" not in s: s = s.replace(SET0, SET0 + '      ${window.viewSettings ? window.viewSettings() : ""}\n', 1)
    assert "window.viewFit && window.viewFit()" in s and "window.viewSettings ? window.viewSettings()" in s, f"{p.name}: fit or settings layout changed"
    assert "countbtn" in s and "obGotoBox" in s and 'data-act="backquiz">Back to questions</button></div>' not in s, f"{p.name}: page layout changed, additions not placed"
    i = s.rstrip().rfind("</body></html>")
    s = s[:i] + START + bundle + END + s[i:]
    (out / p.name).write_text(s, encoding="utf-8"); print(p.name, len(s))
