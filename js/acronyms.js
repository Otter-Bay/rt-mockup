/* Abbreviations and acronyms for the Ask feature and the info-button library. Owner: Ken + Claude.
   DRAFT (Nov 17, 2026): written in our own words for Ken's review, built from common usage and checked against the accepted lists named
   in the hub (strategy/library-sources.md): MedlinePlus "Some Common Abbreviations" (NLM, public domain) and, for respiratory symbols,
   the AARC "Preferred Terms and Symbols". The "do not use" card follows The Joint Commission's official Do Not Use list.
   Load after scales.js and before voice.js. Adds window.ACRONYMS (for quick answers in Ask) and grouped glossary cards to window.SCALES. */
(function () {
  if (!window.SCALES) return;
  // [abbreviation, meaning, group, extra note (optional)]
  const RT = [
    // Blood gases and oxygenation
    ["ABG", "Arterial blood gas", "gas"], ["PaO2", "Partial pressure of oxygen in arterial blood", "gas"],
    ["PaCO2", "Partial pressure of carbon dioxide in arterial blood", "gas"], ["PAO2", "Partial pressure of oxygen in the alveoli (alveolar PO2)", "gas", "Capital A = alveolar; small a = arterial."],
    ["PvO2", "Partial pressure of oxygen in mixed venous blood", "gas"], ["SaO2", "Arterial oxygen saturation, measured from a blood sample (co-oximetry)", "gas"],
    ["SpO2", "Oxygen saturation measured by pulse oximetry", "gas"], ["SvO2", "Mixed venous oxygen saturation (pulmonary artery blood)", "gas"],
    ["ScvO2", "Central venous oxygen saturation (superior vena cava blood)", "gas"], ["FIO2", "Fraction of inspired oxygen (0.21 to 1.0)", "gas"],
    ["CaO2", "Arterial oxygen content (mL O2 per dL of blood)", "gas"], ["CvO2", "Mixed venous oxygen content", "gas"],
    ["DO2", "Oxygen delivery to the tissues (cardiac output × CaO2)", "gas"], ["VO2", "Oxygen consumption", "gas"],
    ["P(A-a)O2", "Alveolar-to-arterial oxygen difference (A-a gradient)", "gas"], ["P/F", "PaO2/FIO2 ratio", "gas"],
    ["OI", "Oxygenation index: (mean airway pressure × FIO2 × 100) ÷ PaO2", "gas"], ["HCO3-", "Bicarbonate", "gas"],
    ["BE", "Base excess (negative value = base deficit)", "gas"], ["COHb", "Carboxyhemoglobin", "gas"], ["MetHb", "Methemoglobin", "gas"],
    ["PetCO2", "End-tidal partial pressure of CO2 (also written ETCO2)", "gas"], ["ETCO2", "End-tidal CO2 (same as PetCO2)", "gas"],
    ["Hb", "Hemoglobin (also Hgb)", "gas"],
    // Ventilation and mechanics
    ["VT", "Tidal volume", "vent"], ["VE", "Minute ventilation (exhaled volume per minute)", "vent"], ["VA", "Alveolar ventilation", "vent"],
    ["VD", "Dead space volume", "vent"], ["VD/VT", "Dead space to tidal volume ratio", "vent"], ["f", "Respiratory rate (frequency)", "vent"],
    ["PIP", "Peak inspiratory pressure", "vent"], ["Pplat", "Plateau pressure (inspiratory pause pressure)", "vent"],
    ["PEEP", "Positive end-expiratory pressure", "vent"], ["PEEPi", "Intrinsic PEEP (auto-PEEP)", "vent"],
    ["DP", "Driving pressure: plateau pressure minus PEEP (also written ΔP)", "vent"],
    ["Cst", "Static compliance: VT ÷ (Pplat − PEEP)", "vent"], ["Cdyn", "Dynamic compliance: VT ÷ (PIP − PEEP)", "vent"],
    ["Raw", "Airway resistance", "vent"], ["I:E", "Inspiratory-to-expiratory time ratio", "vent"], ["TI", "Inspiratory time", "vent"],
    ["Paw", "Mean airway pressure (also written P̄aw or MAP)", "vent"],
    ["RSBI", "Rapid shallow breathing index: rate ÷ VT in liters", "vent"], ["NIF", "Negative inspiratory force (same idea as MIP)", "vent"],
    ["MIP", "Maximal inspiratory pressure (also PImax)", "vent"], ["MEP", "Maximal expiratory pressure (also PEmax)", "vent"],
    ["SBT", "Spontaneous breathing trial", "vent"], ["PBW", "Predicted body weight (used to set VT)", "vent"], ["IBW", "Ideal body weight", "vent"],
    // Ventilator modes and support
    ["VC", "Volume control (a vent mode); in pulmonary function, VC also means vital capacity", "mode"], ["PC", "Pressure control", "mode"],
    ["A/C", "Assist-control", "mode"], ["SIMV", "Synchronized intermittent mandatory ventilation", "mode"], ["PSV", "Pressure support ventilation", "mode"],
    ["CPAP", "Continuous positive airway pressure", "mode"], ["BiPAP", "Bilevel positive airway pressure (BiPAP is a brand name; bilevel PAP is the general term)", "mode"],
    ["IPAP", "Inspiratory positive airway pressure", "mode"], ["EPAP", "Expiratory positive airway pressure", "mode"],
    ["PRVC", "Pressure-regulated volume control", "mode"], ["APRV", "Airway pressure release ventilation", "mode"],
    ["HFOV", "High-frequency oscillatory ventilation", "mode"], ["NIV", "Noninvasive ventilation", "mode"], ["NPPV", "Noninvasive positive-pressure ventilation", "mode"],
    ["PAV", "Proportional assist ventilation", "mode"], ["NAVA", "Neurally adjusted ventilatory assist", "mode"], ["HFNC", "High-flow nasal cannula", "mode"],
    ["ECMO", "Extracorporeal membrane oxygenation", "mode"], ["iNO", "Inhaled nitric oxide", "mode"],
    // Pulmonary function
    ["PFT", "Pulmonary function test", "pft"], ["FVC", "Forced vital capacity", "pft"], ["FEV1", "Forced expiratory volume in the first second", "pft"],
    ["FEV1/FVC", "Ratio of FEV1 to FVC (low in obstruction)", "pft"], ["FEF25-75%", "Forced expiratory flow between 25% and 75% of the FVC", "pft"],
    ["PEF", "Peak expiratory flow", "pft"], ["TLC", "Total lung capacity", "pft"], ["RV", "Residual volume", "pft"], ["FRC", "Functional residual capacity", "pft"],
    ["ERV", "Expiratory reserve volume", "pft"], ["IRV", "Inspiratory reserve volume", "pft"], ["IC", "Inspiratory capacity", "pft"],
    ["DLCO", "Diffusing capacity of the lungs for carbon monoxide", "pft"], ["MVV", "Maximal voluntary ventilation", "pft"], ["LLN", "Lower limit of normal", "pft"],
    // Airways, devices and therapy
    ["ETT", "Endotracheal tube", "equip"], ["NC", "Nasal cannula", "equip"], ["NRB", "Nonrebreather mask", "equip"], ["SVN", "Small-volume nebulizer", "equip"],
    ["MDI", "Metered-dose inhaler", "equip"], ["DPI", "Dry-powder inhaler", "equip"], ["SMI", "Soft mist inhaler", "equip"], ["BVM", "Bag-valve-mask", "equip"],
    ["LMA", "Laryngeal mask airway", "equip"], ["OPA", "Oropharyngeal airway", "equip"], ["NPA", "Nasopharyngeal airway", "equip"],
    ["HME", "Heat and moisture exchanger", "equip"], ["IS", "Incentive spirometry", "equip"], ["PEP", "Positive expiratory pressure (airway clearance device)", "equip"],
    ["CPT", "Chest physiotherapy", "equip"], ["HFCWO", "High-frequency chest wall oscillation (the vest)", "equip"], ["IPV", "Intrapulmonary percussive ventilation", "equip"],
    ["MI-E", "Mechanical insufflation-exsufflation (cough assist)", "equip"], ["VAP", "Ventilator-associated pneumonia", "equip"],
    // Conditions
    ["ARDS", "Acute respiratory distress syndrome", "dx"], ["COPD", "Chronic obstructive pulmonary disease", "dx"], ["OSA", "Obstructive sleep apnea", "dx"],
    ["CSA", "Central sleep apnea", "dx"], ["OHS", "Obesity hypoventilation syndrome", "dx"], ["CHF", "Congestive heart failure", "dx"], ["PE", "Pulmonary embolism", "dx"],
    ["CF", "Cystic fibrosis", "dx"], ["ILD", "Interstitial lung disease", "dx"], ["TB", "Tuberculosis", "dx"], ["RSV", "Respiratory syncytial virus", "dx"],
    ["RDS", "Respiratory distress syndrome (in premature newborns)", "dx"], ["BPD", "Bronchopulmonary dysplasia", "dx"], ["TTN", "Transient tachypnea of the newborn", "dx"],
    ["MAS", "Meconium aspiration syndrome", "dx"], ["PPHN", "Persistent pulmonary hypertension of the newborn", "dx"], ["DKA", "Diabetic ketoacidosis", "dx"],
    ["GBS", "Guillain-Barré syndrome", "dx"], ["MG", "Myasthenia gravis", "dx"], ["ALS", "Amyotrophic lateral sclerosis", "dx"],
    // Medications
    ["SABA", "Short-acting beta2 agonist (for example albuterol)", "rx"], ["LABA", "Long-acting beta2 agonist (for example salmeterol, formoterol)", "rx"],
    ["SAMA", "Short-acting muscarinic antagonist (for example ipratropium)", "rx"], ["LAMA", "Long-acting muscarinic antagonist (for example tiotropium)", "rx"],
    ["ICS", "Inhaled corticosteroid (for example fluticasone, budesonide)", "rx"], ["LTRA", "Leukotriene receptor antagonist (for example montelukast)", "rx"],
    ["NMBA", "Neuromuscular blocking agent (paralytic)", "rx"],
    // Care settings and resuscitation
    ["BLS", "Basic life support", "care"], ["ACLS", "Advanced cardiovascular life support", "care"], ["PALS", "Pediatric advanced life support", "care"],
    ["NRP", "Neonatal Resuscitation Program", "care"], ["CPR", "Cardiopulmonary resuscitation", "care"], ["ROSC", "Return of spontaneous circulation", "care"],
    ["DNR", "Do not resuscitate", "care"], ["DNI", "Do not intubate", "care"], ["ICU", "Intensive care unit", "care"], ["NICU", "Neonatal intensive care unit", "care"],
    ["PICU", "Pediatric intensive care unit", "care"], ["GCS", "Glasgow Coma Scale", "care"], ["RASS", "Richmond Agitation-Sedation Scale", "care"],
    ["AHI", "Apnea-hypopnea index (events per hour of sleep)", "care"],
  ];

  // Sleep abbreviations (Nov 20, 2026). Written in our own words; checked against the abbreviations used in the
  // AASM scoring manual (terms only, no text copied). Draft for Jac's review.
  const SLEEP = [
    // Recording and signals
    ["PSG", "Polysomnography: an overnight sleep study recording brain waves, eyes, muscles, breathing, oxygen and heart", "rec"],
    ["EEG", "Electroencephalogram: brain-wave recording used to stage sleep", "rec"], ["EOG", "Electrooculogram: eye-movement recording", "rec"],
    ["EMG", "Electromyogram: muscle-activity recording (chin and legs in a sleep study)", "rec"], ["ECG", "Electrocardiogram (EKG): heart rhythm recording", "rec"],
    ["F4-M1", "Frontal EEG lead referenced to the opposite (left) mastoid", "rec", "C4-M1 and O2-M1 are the central and occipital leads; M2 is the right mastoid."],
    ["C4-M1", "Central EEG lead referenced to the left mastoid", "rec"], ["O2-M1", "Occipital EEG lead referenced to the left mastoid", "rec"],
    ["E1-M2", "Left eye lead referenced to the right mastoid", "rec"], ["E2-M2", "Right eye lead referenced to the right mastoid", "rec"],
    ["Cz", "Midline central EEG electrode position", "rec"], ["RIP", "Respiratory inductance plethysmography: chest and abdomen effort belts", "rec"],
    ["RIPsum", "The chest and abdomen RIP signals added together (tracks volume)", "rec"], ["RIPflow", "Airflow estimated from the RIPsum signal", "rec"],
    ["PVDF", "Polyvinylidene fluoride: a sensor material used in some airflow and effort sensors", "rec"],
    ["PAT", "Peripheral arterial tonometry: finger sensor used by some home sleep apnea tests", "rec"],
    ["DC", "Direct current: a channel type used for slow signals such as oximetry or pressure", "rec"],
    // Staging and timing
    ["W", "Stage W: wake", "stage"], ["N1", "Stage N1: lightest NREM sleep", "stage"], ["N2", "Stage N2: NREM sleep with spindles and K complexes", "stage"],
    ["N3", "Stage N3: deep NREM (slow wave) sleep", "stage"], ["NREM", "Non-rapid eye movement sleep (stages N1, N2, N3)", "stage"],
    ["REM", "Rapid eye movement sleep (stage R)", "stage"], ["REMs", "Rapid eye movements (the eye movements themselves)", "stage"],
    ["SEM", "Slow eye movements (common at sleep onset)", "stage"], ["LAMF", "Low-amplitude, mixed-frequency EEG activity", "stage"],
    ["TST", "Total sleep time", "stage"], ["TRT", "Total recording time: lights out to lights on", "stage"],
    ["SL", "Sleep latency: lights out to the first epoch of any sleep", "stage"], ["WASO", "Wake after sleep onset", "stage"],
    ["SE", "Sleep efficiency: TST ÷ TRT × 100", "stage"], ["SOREMP", "Sleep-onset REM period: REM sleep within 15 minutes of sleep onset", "stage"],
    ["MSLT", "Multiple Sleep Latency Test: daytime nap test for sleepiness and narcolepsy", "stage"],
    ["MWT", "Maintenance of Wakefulness Test: daytime test of the ability to stay awake", "stage"], ["ESS", "Epworth Sleepiness Scale", "stage"],
    // Infants and children
    ["PDR", "Posterior dominant rhythm: the main relaxed-wake EEG rhythm over the back of the head", "peds"],
    ["HH", "Hypnagogic hypersynchrony: bursts of high-voltage slow waves at sleep onset in children", "peds"],
    ["PSW", "Posterior slow waves of youth", "peds"], ["PMA", "Postmenstrual age: gestational age plus age since birth", "peds"],
    ["GA", "Gestational age", "peds"], ["CA", "Conceptional age: older term replaced by postmenstrual age", "peds"],
    ["TA", "Tracé alternant: infant quiet-sleep EEG pattern of alternating high and low voltage", "peds"], ["TMA", "Transient muscle activity", "peds"],
    // Breathing events
    ["AHI", "Apnea-hypopnea index: apneas + hypopneas per hour of sleep", "resp"], ["AI", "Apnea index: apneas per hour of sleep", "resp"],
    ["HI", "Hypopnea index: hypopneas per hour of sleep", "resp"], ["OAHI", "Obstructive apnea-hypopnea index", "resp"],
    ["CAI", "Central apnea index", "resp"], ["CAHI", "Central apnea-hypopnea index", "resp"],
    ["RERA", "Respiratory effort-related arousal", "resp"], ["RDI", "Respiratory disturbance index: apneas + hypopneas + RERAs per hour of sleep", "resp"],
    ["ODI", "Oxygen desaturation index: 3% or 4% oxygen drops per hour", "resp"],
    ["REI", "Respiratory event index: events per hour of monitoring time (home sleep apnea tests)", "resp"],
    ["MT", "Monitoring time: the recording time used in a home sleep apnea test", "resp"], ["HSAT", "Home sleep apnea test", "resp"],
    ["OSA", "Obstructive sleep apnea", "resp"], ["CSA", "Central sleep apnea", "resp"], ["CSR", "Cheyne-Stokes respiration (crescendo-decrescendo breathing)", "resp"],
    ["PAP", "Positive airway pressure", "resp"], ["CPAP", "Continuous positive airway pressure", "resp"], ["APAP", "Auto-adjusting positive airway pressure", "resp"],
    ["BPAP", "Bilevel positive airway pressure", "resp"], ["ASV", "Adaptive servo-ventilation", "resp"],
    // Movements and arousals
    ["ArI", "Arousal index: arousals per hour of sleep", "move"], ["LM", "Leg movement", "move"],
    ["PLM", "Periodic limb movement", "move"], ["PLMS", "Periodic limb movements of sleep", "move"], ["PLMSI", "PLMS index: periodic limb movements per hour of sleep", "move"],
    ["PLMSArI", "PLMS arousal index: periodic limb movements with arousal per hour of sleep", "move"],
    ["ALMA", "Alternating leg muscle activation", "move"], ["HFT", "Hypnagogic foot tremor", "move"], ["EFM", "Excessive fragmentary myoclonus", "move"],
    ["RBD", "REM sleep behavior disorder", "move"], ["RWA", "REM sleep without atonia", "move"], ["RMD", "Rhythmic movement disorder", "move"],
    ["RLS", "Restless legs syndrome", "move"],
    // Organizations and credentials
    ["AASM", "American Academy of Sleep Medicine", "org"], ["BRPT", "Board of Registered Polysomnographic Technologists", "org"],
    ["RPSGT", "Registered Polysomnographic Technologist (BRPT credential)", "org"], ["CPSGT", "Certified Polysomnographic Technician (BRPT credential)", "org"],
    ["SDS", "Sleep Disorders Specialist (NBRC credential for respiratory therapists)", "org"],
  ];
  const SGROUPS = { rec: "recording and signals", stage: "staging, timing and daytime tests", peds: "infants and children", resp: "breathing events and PAP",
    move: "movements and arousals", org: "organizations and credentials" };
  const GROUPS = { gas: "blood gases and oxygenation", vent: "ventilation and mechanics", mode: "ventilator modes and support", pft: "pulmonary function",
    equip: "airways, devices and therapy", dx: "conditions", rx: "medications", care: "care, scales and resuscitation" };

  // Joint Commission "Do Not Use" list (official, applies to all orders and medication documents). Facts restated in our own words.
  const DNU = [
    ["U, u (unit)", "Can be read as 0, 4 or cc", "Write \"unit\""], ["IU (International Unit)", "Can be read as IV or the number 10", "Write \"International Unit\""],
    ["Q.D., QD, q.d., qd (daily)", "Mistaken for each other (Q.O.D.); the period can look like an I", "Write \"daily\""],
    ["Q.O.D., QOD, q.o.d., qod (every other day)", "The O can look like an I (\"four times a day\")", "Write \"every other day\""],
    ["Trailing zero (X.0 mg)", "Decimal point missed: 1.0 mg read as 10 mg", "Write X mg"], ["No leading zero (.X mg)", "Decimal point missed: .5 mg read as 5 mg", "Write 0.X mg"],
    ["MS, MSO4, MgSO4", "Can mean morphine sulfate or magnesium sulfate; mixed up with each other", "Write \"morphine sulfate\" or \"magnesium sulfate\""],
  ];

  const T = (head, rows) => `<table class="sct"><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  const add = {};
  Object.keys(GROUPS).forEach((g) => {
    const rows = RT.filter((r) => r[2] === g);
    add["abbr_" + g] = { field: "rt", title: `RT abbreviations: ${GROUPS[g]}`, intro: `What common respiratory care abbreviations stand for (${GROUPS[g]}).`,
      body: T(["Abbreviation", "Stands for"], rows.map((r) => [`<b>${r[0]}</b>`, r[1] + (r[3] ? ` <small>${r[3]}</small>` : "")])),
      note: "Respiratory symbols follow the AARC preferred terms and symbols.",
      src: "MedlinePlus, \"Some Common Abbreviations\" (National Library of Medicine); AARC, Preferred Terms and Symbols; Open RN nursing textbooks (CC BY 4.0)",
      links: [["MedlinePlus abbreviations", "https://medlineplus.gov/appendixb.html"], ["AARC preferred terms and symbols", "https://aarc.org/wp-content/uploads/2024/12/respiratory-care-preferred-terms-and-symbols.pdf"]] };
  });
  add.abbr_donotuse = { field: "all", title: "Abbreviations not to use (medication safety)",
    intro: "The Joint Commission's official \"Do Not Use\" list for orders and medication records. These cause dosing errors.",
    body: T(["Don't write", "Why it's risky", "Instead"], DNU), note: "Your facility may add more to this list (for example, from ISMP's list of error-prone abbreviations). Follow your facility's policy.",
    src: "The Joint Commission, Official \"Do Not Use\" List of Abbreviations",
    links: [["The Joint Commission: Do Not Use list", "https://jointcommission.org/resources/news-and-multimedia/fact-sheets/facts-about-do-not-use-list"]] };
  Object.keys(SGROUPS).forEach((g) => {
    const rows = SLEEP.filter((r) => r[2] === g);
    add["sabbr_" + g] = { field: "sleep", title: `Sleep abbreviations: ${SGROUPS[g]}`, intro: `What common sleep-medicine abbreviations stand for (${SGROUPS[g]}).`,
      body: T(["Abbreviation", "Stands for"], rows.map((r) => [`<b>${r[0]}</b>`, r[1] + (r[3] ? ` <small>${r[3]}</small>` : "")])),
      note: "Terms follow the AASM scoring manual's usage, written in our own words.",
      src: "Standard sleep-medicine terminology, checked against the abbreviations used in the AASM Manual for the Scoring of Sleep and Associated Events (no text copied)" };
  });
  Object.assign(window.SCALES, add);

  // Quick-answer table for Ask: "what does RSBI stand for?" -> one line, plus the card it's on.
  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
  const map = {};
  RT.forEach((r) => { const k = norm(r[0]); (map[k] = map[k] || []).push({ abbr: r[0], meaning: r[1], card: "abbr_" + r[2], field: "rt" }); });
  SLEEP.forEach((r) => { const k = norm(r[0]); (map[k] = map[k] || []).push({ abbr: r[0], meaning: r[1], card: "sabbr_" + r[2], field: "sleep" }); });
  window.ACRONYMS = { norm, map };
})();
