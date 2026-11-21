"""Puts the Ask and Go-to-question additions into the private question-vetting pages (Claude artifacts).
Usage: python3 tools/vetting/build_pages.py BUNDLE.js OUT_DIR PAGE.html [PAGE.html ...]
Each PAGE.html is the page as last read from its artifact. Writes OUT_DIR/<same name>, ready to republish to the same artifact.
Safe to re-run: a page that already has the additions gets them replaced, not doubled."""
import pathlib, re, sys
bundle = pathlib.Path(sys.argv[1]).read_text(encoding="utf-8")
out = pathlib.Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
COUNT = '<span class="count">${S.page === "stats" ? "Stats" : S.results && !S.reviewing ? "Results" : "Question " + (S.qi + 1) + " of " + S.set.length}</span>'
COUNT_BTN = ('${S.page === "quiz" && !S.results && window.VET_MODE ? `<button type="button" class="count countbtn" data-act="stats" aria-label="Question ${S.qi + 1} of ${S.set.length}. Open the list to go to any question">'
             'Question ${S.qi + 1} of ${S.set.length}<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>` : `' + COUNT + '`}')
CHIPS = '<div class="chips">${chip("all", "All " + n.total)}'
START, END = "<script>\n/* OB vetting additions */\n", "\n/* end OB vetting additions */\n</script>\n"
for f in sys.argv[3:]:
    p = pathlib.Path(f); s = p.read_text(encoding="utf-8")
    s = re.sub(re.escape(START) + r".*?" + re.escape(END), "", s, flags=re.S)
    s = re.sub(r"<script>\n/\* Ask in the vetting pages\..*?</script>\n", "", s, flags=re.S)   # older form of the Ask addition
    if COUNT in s: s = s.replace(COUNT, COUNT_BTN, 1)
    if "obGotoBox" not in s: s = s.replace(CHIPS, '${window.obGotoBox ? window.obGotoBox() : ""}' + CHIPS, 1)
    s = s.replace("Scale and rule cards appear after you answer.", "Scale and rule cards, and Ask, appear after you answer.")
    s = s.replace("Tap the chart icon (top right) to see your progress or jump to any question.", "Tap “Question 1 of 200” at the top to go to any question.")
    s = s.replace("Tap the list icon (top right) to see progress or jump to any question.", "Tap “Question 1 of 200” at the top to go to any question.")
    assert "countbtn" in s and "obGotoBox" in s, f"{p.name}: page layout changed, additions not placed"
    i = s.rstrip().rfind("</body></html>")
    s = s[:i] + START + bundle + END + s[i:]
    (out / p.name).write_text(s, encoding="utf-8"); print(p.name, len(s))
