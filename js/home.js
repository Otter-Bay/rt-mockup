/* Home and Products pages (Otter Bay theme). Owner: Ken + Claude.
   Adds pages to app.js through window.PAGES / window.PAGE_ACTIONS. Uses globals from app.js (S, QS, ALL, newRun, render)
   and progress.js (RL, ST, load, save). Each exam site sets window.EXAM ("RRT", "SDS", "RPSGT", "CNA") and window.EXAM_LINKS. */
(function () {
  const EXAMS = [
    { key: "RRT", name: "CRT/RRT Ready", sub: "Respiratory therapy", href: (window.EXAM_LINKS || {}).RRT },
    { key: "SDS", name: "SDS Ready", sub: "Sleep disorders specialist", href: (window.EXAM_LINKS || {}).SDS },
    { key: "RPSGT", name: "RPSGT Ready", sub: "Sleep technologist", href: (window.EXAM_LINKS || {}).RPSGT },
    { key: "CNA", name: "CNA Ready", sub: "Nurse assistant", href: (window.EXAM_LINKS || {}).CNA },
  ];
  // Each app has its own look on the same Otter Bay bones: daytime bay for CRT/RRT, night bay for SDS, dusk kelp forest for RPSGT, sunrise tide pool for CNA.
  const THEMES = {
    RRT: { app: "CRT/RRT Ready", hi: ["Let's get your feet wet.", "Ready to pick up where you left off?"], bay: "#0A4A63", mid: "#0E6E8C", low: "#2A9FA6", tide: "#3FB8B3", accent: "#F5B83D", accentInk: "#3A2600", glass: "#E7F4F3",
           sky: '<circle cx="330" cy="40" r="22" fill="#FFE3A1" opacity=".9"/><circle cx="330" cy="40" r="34" fill="#FFE3A1" opacity=".15"/>' },
    SDS: { app: "SDS Ready", hi: ["Settle in for your first study.", "Back for another night shift?"], bay: "#14193F", mid: "#24306B", low: "#3B4F8F", tide: "#7E8FD6", accent: "#C9B8FF", accentInk: "#1C1240", glass: "#ECEEF8",
           sky: '<path d="M342 22a20 20 0 1 0 14 34a16 16 0 0 1-14-34z" fill="#F4EBC6"/>' + [[40, 30], [90, 16], [150, 40], [210, 14], [262, 34], [300, 70], [120, 74], [24, 80]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 ? 1.4 : 2.2}" fill="#fff" opacity=".85"/>`).join("") },
    RPSGT: { app: "RPSGT Ready", hi: ["Let's dive into the tracings.", "Ready for more tracings?"], bay: "#123B2E", mid: "#1F5A45", low: "#3F8668", tide: "#7CC4A0", accent: "#F2A65A", accentInk: "#3A1E00", glass: "#EAF4EE",
             sky: '<path d="M0 70h60l8-18 10 34 10-26 8 10h40l8-18 10 34 10-26 8 10h200" fill="none" stroke="#BFEAD3" stroke-width="2" opacity=".55"/>' },
    CNA: { app: "CNA Ready", hi: ["Let's start your first shift.", "Ready for another shift?"], bay: "#5A2340", mid: "#8A3A5C", low: "#C0607A", tide: "#F2A3A0", accent: "#FFD37A", accentInk: "#3A2400", glass: "#FBEFF0",
           sky: '<circle cx="335" cy="58" r="24" fill="#FFD9A0" opacity=".9"/><circle cx="335" cy="58" r="38" fill="#FFD9A0" opacity=".18"/>' + [[262, 26], [290, 16], [300, 38]].map(([x, y]) => `<path d="M${x - 8} ${y}q8-7 16 0" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".7"/>`).join("") },
  };
  const ROOT = ((document.querySelector('link[href*="home.css"]') || {}).href || "").replace(/css\/home\.css.*$/, "");
  const PHOTO = { RRT: { src: ROOT + "images/brand/otter-rrt.jpg", alt: "A sea otter in the bay holding a wooden CRT/RRT sign" },
                  SDS: { src: ROOT + "images/brand/otter-sds.jpg", alt: "A sleepy sea otter floating in the bay holding a wooden SDS sign" },
                  CNA: { src: ROOT + "images/brand/otter-cna.jpg?v=3", alt: "A curious, playful sea otter in the bay holding a wooden CNA sign" } };
  const TH = THEMES[window.EXAM || "RRT"];
  const PH = PHOTO[window.EXAM || "RRT"];
  const themeVars = () => `--bay:${TH.bay};--tide:${TH.tide};--buoy:${TH.accent};--glass:${TH.glass};--mid:${TH.mid};--low:${TH.low};--accentInk:${TH.accentInk}`;
  const topbar = () => `<header class="obtop"><span class="wm">${TH.app}<small>by Otter Bay</small></span><button type="button" class="obgear" data-act="settings" aria-label="Settings">${ICON.gear}</button></header>`;
  const DAY = (d) => d.toISOString().slice(0, 10);
  const LOG = load("dayLog", {});                       // { "2026-10-25": answered count }

  // Count answers per day for the tide chart, without changing progress.js.
  const rec = window.recordAnswer;
  window.recordAnswer = function (q, c) { rec(q, c); const k = DAY(new Date()); LOG[k] = (LOG[k] || 0) + 1; save("dayLog", LOG); };

  const greet = () => { const h = new Date().getHours(); return h < 5 ? "Up late?" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening"; };

  // Swimming otter drawn to match the Otter Bay loading video (navy back, white face, closed-eye smile).
  const OTTER = `<svg class="otter" viewBox="0 0 340 130" aria-hidden="true">
  <g class="o-body">
    <path d="M140 90c-8 9-6 17 6 20 9 2 16-2 14-8-1-5-9-7-12-12z" fill="#0B1F4F" opacity=".8"/>
    <path d="M2 87C32 85 64 77 102 61 142 44 186 34 222 38c10 1 18 4 24 9l-24 39z" fill="#0B1F4F" stroke="#fff" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M210 88C212 72 222 56 236 47 246 38 262 33 277 37 290 41 300 50 307 57 313 59 316 62 315 66 313 71 302 74 291 76 279 79 270 83 264 88z" fill="#fff"/>
    <path d="M256 70q8 5 18 3" stroke="#0B1F4F" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".35"/>
    <path d="M241 44c-2-6 3-11 8-9 4 1 5 6 2 9" fill="#fff" stroke="#0B1F4F" stroke-width="2" stroke-linejoin="round"/>
    <path d="M272 50q5.5-5 11 0" stroke="#0B1F4F" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    <path d="M305 61c3-2 8-1 9 2 1 3-2 6-6 6-3 0-5-3-3-8z" fill="#0B1F4F"/>
    <path d="M307 69q-1 4-7 5" stroke="#0B1F4F" stroke-width="2.1" fill="none" stroke-linecap="round"/>
    <path d="M300 70l22 -3M300 72l22 5M298 74l17 10" stroke="#0B1F4F" stroke-width="1.2" stroke-linecap="round" opacity=".9"/>
    <path d="M258 88c0-7 6-12 13-12 6 0 10 4 9 10" fill="#fff" stroke="#0B1F4F" stroke-width="2" stroke-linecap="round"/>
    <path d="M266 80l1 4M272 79v4" stroke="#0B1F4F" stroke-width="1.4" stroke-linecap="round"/>
  </g>
  <g class="o-wake" fill="none" stroke="#fff" stroke-linecap="round">
    <path d="M0 89c40-3 90-2 140 0s100 2 150 0c12-1 26-4 34-14" stroke-width="4"/>
    <path d="M14 96c50-2 110-1 170 1s90 0 120-4" stroke-width="2.4" opacity=".8"/>
    <path d="M40 104c60-2 120-1 180 1" stroke-width="1.6" opacity=".55"/>
    <path d="M322 70c5-3 9-8 11-15M326 78c5-1 10-5 13-10" stroke-width="2.2" opacity=".9"/>
  </g>
</svg>`;

  function weekBars() {
    const out = [], now = new Date();
    for (let k = 6; k >= 0; k--) { const d = new Date(now); d.setDate(now.getDate() - k); out.push({ d, n: LOG[DAY(d)] || 0 }); }
    const max = Math.max(5, ...out.map((x) => x.n));
    return `<div class="tide" role="img" aria-label="Questions answered each day this week: ${out.map((x) => x.n).join(", ")}">${out.map((x) =>
      `<div class="tcol"><div class="tbar" style="height:${Math.max(4, Math.round(x.n / max * 100))}%"><span>${x.n || ""}</span></div><i>${x.d.toLocaleDateString([], { weekday: "narrow" })}</i></div>`).join("")}</div>`;
  }

  function nav(active) {
    const it = (k, label, icon) => `<button type="button" class="nb ${active === k ? "on" : ""}" data-act="go" data-v="${k}" aria-current="${active === k ? "page" : "false"}">${icon}<span>${label}</span></button>`;
    const I = {
      home: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>',
      quiz: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
      stats: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
      products: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/><circle cx="12" cy="12" r="3.5"/></svg>',
    };
    // Progress tab: a ring like the score rings on that page. After 10 answers the ring fills to your % correct and a small badge shows it.
    const att = Object.values(ST).length, cor = Object.values(ST).filter((x) => x.lastCorrect).length;
    const pc = att >= 10 ? Math.round(cor / att * 100) : null, C = 53.41;   // ring circumference for r = 8.5
    const ring = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5" opacity=".28"/><circle cx="12" cy="12" r="8.5" transform="rotate(-90 12 12)" stroke-dasharray="${(pc == null ? 75 : Math.max(pc, 2)) / 100 * C} ${C}"/></svg>`;
    const prog = `<button type="button" class="nb ${active === "stats" ? "on" : ""}" data-act="go" data-v="stats" aria-current="${active === "stats" ? "page" : "false"}" aria-label="Progress${pc == null ? "" : `, ${pc}% correct`}">${ring}${pc == null ? "" : `<b class="nbadge" aria-hidden="true">${pc}%</b>`}<span>Progress</span></button>`;
    return `<nav class="bnav" aria-label="Main">${it("home", "Home", I.home)}${prog}${it("quiz", "Questions", I.quiz)}${it("products", "Apps", I.products)}</nav>`;
  }

  function home() {
    const exam = EXAMS.find((e) => e.key === (window.EXAM || "RRT"));
    const answered = QS.filter((q) => ST[q.id]).length;
    const att = Object.values(ST).length, cor = Object.values(ST).filter((x) => x.lastCorrect).length;
    const rl = QS.filter((q) => RL[q.id]).length;
    const pct = QS.length ? Math.round(answered / QS.length * 100) : 0;
    const next = Math.min(10, QS.length - answered) || 10;
    return `<div class="ob" style="${themeVars()}">
      ${topbar()}
      <div class="obscroll">
        ${PH ? `<section class="bay photo">
          <p class="hello">${greet()}</p>
          <h1>${TH.hi[answered ? 1 : 0]}</h1>
          <figure class="hero"><img src="${PH.src}" alt="${PH.alt}" width="720" height="1072"></figure>
          <div class="today">
                <p class="tl">${TH.app} practice</p>
                <p class="tb">${answered ? `${next} new question${next === 1 ? "" : "s"}${rl ? ` and ${rl} from your review list` : ""}` : "Start with 10 questions to see where you stand"}</p>
                <button type="button" class="obstart" data-act="go" data-v="quiz">${answered ? "Keep going" : "Start practicing"}</button>
              </div>
        </section>` : `<section class="bay">
          <svg class="sky" viewBox="0 0 390 100" preserveAspectRatio="xMidYMin slice" aria-hidden="true">${TH.sky}</svg>
          <p class="hello">${greet()}</p>
          <h1>${TH.hi[answered ? 1 : 0]}</h1>
          <div class="water">
            <div class="raft">
              <div class="today">
                <p class="tl">${TH.app} practice</p>
                <p class="tb">${answered ? `${next} new question${next === 1 ? "" : "s"}${rl ? ` and ${rl} from your review list` : ""}` : "Start with 10 questions to see where you stand"}</p>
                <button type="button" class="obstart" data-act="go" data-v="quiz">${answered ? "Keep going" : "Start practicing"}</button>
              </div>
              ${OTTER}
            </div>
            <svg class="waves" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true"><path d="M0 22c40-14 80 14 120 0s80-14 120 0 80 14 120 0 40-8 40-8v46H0z" style="fill:var(--tide)" opacity=".55"/><path d="M0 34c50-12 90 12 140 0s90-12 140 0 80 12 120 0v26H0z" style="fill:var(--bay)"/></svg>
          </div>
        </section>`}
        <section class="obsec">
          <h2>Your exam</h2>
          <div class="exams">${EXAMS.map((e) => e.key === exam.key
            ? `<span class="ex on" aria-current="true"><b>${e.name}</b><small>${e.sub}</small></span>`
            : e.soon ? `<span class="ex soon"><b>${e.name}</b><small>Coming soon</small></span>`
            : `<a class="ex" href="${e.href}"><b>${e.name}</b><small>${e.sub}</small></a>`).join("")}</div>
        </section>
        <section class="obsec">
          <div class="meter"><div><b>${answered}</b> of ${QS.length} questions tried</div><div class="track" aria-hidden="true"><i style="width:${pct}%"></i></div>
            <div class="mrow"><span>${att ? Math.round(cor / att * 100) : 0}% correct</span><span>${rl} on your review list</span></div></div>
        </section>
        <section class="obsec">
          <h2>Ways to practice</h2>
          <div class="ways">
            <button type="button" class="way" data-act="go" data-v="review"><b>Review list</b><span>${rl ? `${rl} question${rl === 1 ? "" : "s"} to revisit` : "Missed and unsure questions land here"}</span></button>
            <button type="button" class="way" data-act="go" data-v="exam"><b>Exam mode</b><span>Timed, with answers at the end</span></button>
            <button type="button" class="way" data-act="go" data-v="build"><b>Build a set</b><span>Choose sections, question types and mode</span></button>
            <button type="button" class="way" data-act="go" data-v="new"><b>Not tried yet</b><span>${QS.length - answered} question${QS.length - answered === 1 ? "" : "s"} you haven't seen</span></button>
          </div>
        </section>
        <section class="obsec">
          <h2>This week's tide</h2>
          ${weekBars()}
          <p class="fine">Questions answered each day.</p>
        </section>
      </div>
      ${nav("home")}
    </div>`;
  }

  const PRODUCTS = [
    { key: "RRT", name: "CRT/RRT Ready", color: "#0E6E8C", mark: '<path d="M4 34c6 0 6-8 12-8s6 8 12 8 6-8 12-8 6 8 12 8" />', blurb: "Practice for the NBRC Respiratory Therapist exam: blood gases, ventilator graphics, rhythm strips, and case-based questions in the same format as the test.", facts: ["Questions written to the January 2027 outline", "Rule-out answers, review list, exam mode", "Images and data lists like the real exam"], status: "In development", sample: (window.EXAM_LINKS || {}).RRT },
    { key: "SDS", name: "SDS Ready", color: "#24306B", mark: '<path d="M38 12a16 16 0 1 0 10 28a13 13 0 0 1-10-28z" />', blurb: "Practice for the NBRC Sleep Disorders Specialty exam: staging epochs, respiratory event scoring, PAP titration, and treatment follow-up.", facts: ["Original PSG tracings and PAP reports", "AASM scoring and CMS rule cards", "Questions written to the SDS outline"], status: "In development", sample: (window.EXAM_LINKS || {}).SDS },
    { key: "RPSGT", name: "RPSGT Ready", color: "#1F5A45", mark: '<path d="M4 28h8l4-12 6 24 6-18 4 6h16" />', blurb: "Practice for the BRPT Registered Polysomnographic Technologist exam, built around the tracings and scoring you use on every shift.", facts: ["Written to the BRPT blueprint", "Scoring, instrumentation, and PAP therapy", "Pediatric and infant scoring practice"], status: "In development", sample: (window.EXAM_LINKS || {}).RPSGT },
    { key: "CNA", name: "CNA Ready", color: "#8A3A5C", mark: '<path d="M26 40s-13-8-13-17a7 7 0 0 1 13-4 7 7 0 0 1 13 4c0 9-13 17-13 17z" />', blurb: "Practice for the California nurse assistant certification exam: daily care, safety and infection control, resident rights, and communication.", facts: ["Written to the California written exam outline", "Rule cards for vital signs, PPE, positions and more", "English now; Spanish planned"], status: "In development", sample: (window.EXAM_LINKS || {}).CNA },
  ];

  function products() {
    return `<div class="ob" style="${themeVars()}">
      ${topbar()}
      <div class="obscroll">
        <section class="obsec">
          <h1 class="ph">The Otter Bay apps</h1>
          <p class="lede">Exam prep for the people who care for patients and keep them breathing and sleeping safely. Pick the app for the credential you're working toward.</p>
        </section>
        ${PRODUCTS.map((p) => `<article class="prod" style="--pc:${p.color}">
          <div class="phead">${PHOTO[p.key] ? `<img class="pphoto" src="${PHOTO[p.key].src}" alt="" width="52" height="52">` : `<svg class="pmark" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="25" fill="var(--pc)"/><g fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${p.mark}</g></svg>`}
            <div><h2>${p.name}</h2><span class="pstat ${p.status === "Coming soon" ? "soon" : ""}">${p.status}</span></div></div>
          <p>${p.blurb}</p>
          <ul>${p.facts.map((f) => `<li>${f}</li>`).join("")}</ul>
          <div class="pfoot"><span class="price">Pricing not set yet</span>
            ${p.key === (window.EXAM || "RRT") ? `<button type="button" class="pbtn" data-act="go" data-v="quiz">Try the sample</button>`
              : p.sample ? `<a class="pbtn" href="${p.sample}">Try the sample</a>` : `<span class="pbtn off" aria-disabled="true">Sample coming soon</span>`}</div>
        </article>`).join("")}
        <article class="prod raft2" style="--pc:#7A4E2D">
          <div class="phead"><svg class="pmark" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="25" fill="var(--pc)"/><g fill="#fff"><circle cx="19" cy="27" r="6"/><circle cx="33" cy="27" r="6"/><rect x="18" y="25" width="16" height="4" rx="2"/></g></svg>
            <div><h2>The Raft</h2><span class="pstat soon">Bundle idea</span></div></div>
          <p>Sea otters hold paws while they sleep so they don't drift apart. The Raft keeps the apps together for programs that teach more than one of these fields.</p>
          <div class="pfoot"><span class="price">Pricing not set yet</span><span class="pbtn off" aria-disabled="true">Coming later</span></div>
        </article>
        <p class="fine pad">Questions are drafts under expert review. Not affiliated with the NBRC, BRPT, Credentia, or the California Department of Public Health.</p>
      </div>
      ${nav("products")}
    </div>`;
  }

  function stats() {
    return `<div class="ob obstats" style="${themeVars()}">
      ${topbar()}
      <div class="obscroll"><div class="stats">${statsBody().replace('<h1 class="ph">Practice</h1>', '<h1 class="ph">Your progress</h1>').replace('<section class="step"><h2>What to practice</h2>', '<p class="bpset">Build a practice set</p><section class="step"><h2>What to practice</h2>')}</div></div>
      <div class="startbar"><span>${(() => { const m = matching().length; return m ? `${m} match · ${S.build.mode === "exam" ? "Exam" : "Study"} mode` : "Nothing matches yet"; })()}</span>
        <button type="button" class="obstart" data-act="buildstart" ${matching().length ? "" : "disabled"}>${startLabel()}</button></div>
      ${nav("stats")}
    </div>`;
  }

  window.PAGES = Object.assign(window.PAGES || {}, { home, products, stats });
  window.PAGE_ACTIONS = Object.assign(window.PAGE_ACTIONS || {}, {
    go: (b) => {
      const v = b.dataset.v;
      if (v === "home" || v === "products") S.page = v;
      else if (v === "quiz") { S.page = "quiz"; }
      else if (v === "stats" || v === "build") { S.page = "stats"; }
      else if (v === "review") { S.build.src = "review"; S.page = "stats"; }
      else if (v === "new") { S.build.src = "new"; S.page = "stats"; }
      else if (v === "exam") { S.mode = "exam"; S.build.mode = "exam"; S.set = ALL.slice(); newRun(); S.page = "quiz"; }
      const sc = document.querySelector(".obscroll"); if (sc) sc.scrollTop = 0;
    },
  });
})();
