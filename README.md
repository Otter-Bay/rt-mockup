# CRT/RRT App – Mock-up

> **Team home base:** start at the private [Otter Bay Hub](https://github.com/kccook23-rt/otter-bay-hub) for the map of every repo, how-to guides, and the decision log.

Live: https://kccook23-rt.github.io/rt-mockup/

**This is the team's mock-up.** New mock-up features go here (not in one-off artifacts), so everyone on Discord sees the same version at the link above.

Clickable design mock-up of the CRT/RRT exam-prep app. Not production code: the real app will be built in Flutter + Firebase, using this as the reference for look and behavior.

## Who works on what

| File | What it is | Owner |
|---|---|---|
| `js/app.js` | App shell, question pop-up, image viewer, settings, intro card, report-a-problem | Ken + Claude |
| `js/stats.js` | Stats page and "Build a practice set" | **Noelle** |
| `js/scales.js` | Info-button cards, shown only after the final answer. Scale reference cards (APGAR, GCS, GOLD, etc.): a question lists them in `infoScales`. Evidence cards for graphs and EKGs: circles drawn from the question's `evidence` field (pixel coordinates on the image, plus a note per circle). | Ken + Claude |
| `css/evidence.css` | Styles for the evidence cards | Ken + Claude |
| `js/calc.js`, `css/calc.css` | On-screen calculator, like the NBRC exam's. "Calc" button at the top of the answer ribbon; floating, draggable, keyboard-friendly; closes on each new question. | Ken + Claude |
| `js/sleep_scales.js` | Sleep reference cards (staging, scoring rules, titration, CMS, ESS, STOP-BANG) used by the sleep samples | Ken + Claude |
| `sds/` | 20-question public sample for the SDS sleep app (its own `data/` and `images/`; shares the JS and CSS above) | Ken + Claude |
| `rpsgt/` | 20-question public sample for the RPSGT sleep app (same layout as `sds/`) | Ken + Claude |
| `cna/` | 20-question public sample for CNA Ready, the California nurse assistant app (same layout as `sds/`; English) | Ken + Claude |
| `js/cna_scales.js` | CNA reference cards (vital signs, intake and output, positions, isolation, PPE, fire safety, pressure injuries, range of motion, diets, transfers, charting, abuse, resident rights) | Ken + Claude |
| `js/home.js`, `css/home.css` | Otter Bay home page, Apps (products) page, themed Stats frame, bottom navigation | Ken + Claude |
| `js/progress.js` | Review list and per-question progress storage (used by both) | Shared: post in Discord before changing |
| `css/app.css` | Colors, fonts, layout | Shared: post in Discord before changing |
| `data/questions.json` | 20-question public sample, same fields as the Firebase question document | Ken + Claude |
| `images/` | Rhythm strips, ventilator graphics, capnogram | Ken + Claude |

Rules of thumb
- Edit only your own file when you can. For shared files, give the team a heads-up first.
- Every change saved to the `main` branch goes live at the link above in about a minute.
- **This project is public.** The full question bank is not here; it lives in the private `rt-question-bank` project.

## Running it on your computer
The page loads `data/questions.json`, so open it through a local web server instead of double-clicking `index.html`. For example, run `python3 -m http.server` in this folder and visit http://localhost:8000.

## After changing a CSS or JS file
In `index.html`, change the `?v=` number on the file links (for example `?v=20261022` → `?v=20261022b`) so everyone's browser loads the new version instead of an old saved copy.

## CNA sample (November 3)
CNA Ready lives at `/cna/` with its own review list and stats. Its 20 questions come from the private `cna-question-bank` (batch 1, 200 questions). The home page has a sunrise theme for CNA, and the exam tiles now show four apps in two rows.

## Sleep samples
The SDS sample lives at `/sds/` and the RPSGT sample at `/rpsgt/` on the same site. Each exam keeps its own review list and stats in the browser. The full sleep question banks are private.

## Home page (October 25)
The site now opens on the Otter Bay home page. Stats content in `js/stats.js` was reordered (summary, by-domain progress with weakest section, review list, practice builder) and split into `statsBody()` so the home frame can wrap it; all existing actions still work.

## Practice builder (October 25, later)
The Stats page is now the **Practice** tab: what to practice (all, not tried, review list, missed), sections you tap to select (with % correct bars and the weakest section flagged), more filters (images, data lists, rule cards, thinking level, patient age), count and mode, and a Start button that stays pinned at the bottom with a live match count. Bottom bar: Home, Practice, Questions, Apps.

**Focus on Domain, Task or Topic.** Questions can be filtered by exam domain, task (outline section), or topic group (`topicGroup` field, e.g. "Mechanical ventilation", "PAP titration"). "Missed questions" now covers every question ever answered wrong, with an option to keep only the ones missed on the last attempt. Each row shows how many questions match, so "5 missed questions in Domain II" is two taps.
