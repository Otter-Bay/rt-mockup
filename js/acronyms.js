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
      note: "Draft for expert review. Respiratory symbols follow the AARC preferred terms and symbols." };
  });
  add.abbr_donotuse = { field: "all", title: "Abbreviations not to use (medication safety)",
    intro: "The Joint Commission's official \"Do Not Use\" list for orders and medication records. These cause dosing errors.",
    body: T(["Don't write", "Why it's risky", "Instead"], DNU), note: "Your facility may add more to this list (for example, from ISMP's list of error-prone abbreviations). Follow your facility's policy." };
  Object.assign(window.SCALES, add);

  // Quick-answer table for Ask: "what does RSBI stand for?" -> one line, plus the card it's on.
  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
  const map = {};
  RT.forEach((r) => { const k = norm(r[0]); (map[k] = map[k] || []).push({ abbr: r[0], meaning: r[1], card: "abbr_" + r[2], field: "rt" }); });
  window.ACRONYMS = { norm, map };
})();
