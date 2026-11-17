# CRT/RRT App – Mock-up

> **Team home base:** start at the private [Otter Bay Hub](https://github.com/Otter-Bay/otter-bay-hub) for the map of every repo, how-to guides, and the decision log.

Live: https://otter-bay.github.io/rt-mockup/

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
| `js/scrollhint.js` | Small down-arrow in the bottom-right of any scrollable area (questions, Practice, home, results, pop-ups) while there's more below; tap to scroll. Hides at the bottom. Loaded on all four apps. | Ken + Claude |
| `js/focus.js` | "Suggested focus" card at the top of the Practice page (CNA for now): picks up to 2 sections to work on from the learner's results, the exam outline weights (`window.EXAM_WEIGHTS`), untried sections, and the review list. Each suggestion has a **Why?** button that opens ring charts (your score there, its share of the exam, and your % correct by Domain, Task, or Topic, with the suggested one highlighted). Wraps `statsBody()` so `stats.js` stays untouched. | Ken + Claude |
| `js/acronyms.js` | Abbreviations and acronyms: RT glossary cards (grouped by topic) and The Joint Commission's "do not use" card, plus the quick-answer table Ask uses for "what does RSBI stand for?". Draft for Ken's review. | Ken + Claude |
| `js/card_meta.js`, `tools/card_dates.py` | When each info card was added and last changed, for Ask's **Source** button. Generated from git history: run `python3 tools/card_dates.py` after editing card files. | Ken + Claude |
| `js/cna_scales.js` | CNA reference cards (vital signs, intake and output, positions, isolation, PPE, fire safety, pressure injuries, range of motion, diets, transfers, charting, abuse, resident rights) | Ken + Claude |
| `js/home.js`, `css/home.css` | Otter Bay home page, Apps (products) page, themed Stats frame, bottom navigation | Ken + Claude |
| `js/views.js`, `css/views.css` | Screen layouts: Phone, Tablet and Desktop. The app detects the device and opens in its layout; **Settings → Screen layout** previews the others (desktop: all three; tablet: Tablet and Phone; phone: no choice). Remembered per device. Add `?device=tablet` (or `phone`, `desktop`) to the address to test as another device. | Ken + Claude |
| `js/voice.js`, `css/voice.css` | **Ask** (voice questions, demo): mic button on Home, Progress, Apps and the question screen. Listens with the browser's speech recognition (or the learner types), matches the question to the info-button cards from all three card files (keyword and synonym index), shows the best match plus up to 2 runner-ups, and reads it aloud. No match: "Send it to our experts" (kept in this browser for the demo; listed in Settings). Learning/protocol note, privacy reminder, and a scope-of-practice note when a card is from another field. `?ask=1` opens straight to listening. | Ken + Claude |
| `manifest.webmanifest` (one per app folder), `images/icons/` | Web app manifests and icons. Each has an **Ask a question** shortcut (`./?ask=1`) that Android shows on a long-press of the home-screen icon. | Ken + Claude |
| `docs/voice-demo/` | Screenshots of the Ask screen for the pull request | Ken + Claude |
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

## Ask: voice questions (demo, November 17)
Tap **Ask** (mic) at the top of Home, Progress, Apps or a question, or open the app with `?ask=1` (for example https://otter-bay.github.io/rt-mockup/?ask=1) to go straight to listening. The answer library for now is the info-button cards; every app loads all three card files (`scales.js`, `sleep_scales.js`, `cna_scales.js`) so the library is shared, and each card file tags its cards with a `field` (`rt`, `sleep`, `cna`) for the scope-of-practice note. Questions the library can't answer can be sent to the team; in the mock-up they stay in the browser (Settings → Questions you've sent). No network or AI calls.

## CNA sample (November 3)
CNA Ready lives at `/cna/` with its own review list and stats. Its 20 questions come from the private `cna-question-bank` (batch 1, 200 questions). The home page has a sunrise theme for CNA, and the exam tiles now show four apps in two rows.

## Sleep samples
The SDS sample lives at `/sds/` and the RPSGT sample at `/rpsgt/` on the same site. Each exam keeps its own review list and stats in the browser. The full sleep question banks are private.

## Home page (October 25)
The site now opens on the Otter Bay home page. Stats content in `js/stats.js` was reordered (summary, by-domain progress with weakest section, review list, practice builder) and split into `statsBody()` so the home frame can wrap it; all existing actions still work.

## Practice builder (October 25, later)
The Stats page is now the **Practice** tab: what to practice (all, not tried, review list, missed), sections you tap to select (with % correct bars and the weakest section flagged), more filters (images, data lists, rule cards, thinking level, patient age), count and mode, and a Start button that stays pinned at the bottom with a live match count. Bottom bar: Home, Practice, Questions, Apps.

**Focus on Domain, Task or Topic.** Questions can be filtered by exam domain, task (outline section), or topic group (`topicGroup` field, e.g. "Mechanical ventilation", "PAP titration"). "Missed questions" now covers every question ever answered wrong, with an option to keep only the ones missed on the last attempt. Each row shows how many questions match, so "5 missed questions in Domain II" is two taps.

## Publishing changes (auto-update)

Before every push that changes the mock-up, run `python3 tools/release.py`. It stamps one build number into `version.json` and every app page. Each page checks `version.json` when it opens and, if the site has a newer build, reloads itself once with a fresh address. That keeps Discord's built-in browser and other caches from showing an old version.
