/* Reference cards for clinical scales. A question lists the cards it uses in "infoScales"
   (e.g. ["apgar"]). The info button appears only after the learner submits a final answer. */
const T = (head, rows) => `<table class="sct"><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
window.SCALES = {
  apgar: { title: "APGAR score", intro: "Scored at 1 and 5 minutes after birth. Each sign scores 0 to 2; total 0 to 10.",
    body: T(["Sign", "0", "1", "2"], [
      ["<b>A</b>ppearance (color)", "Blue or pale all over", "Body pink, extremities blue", "Pink all over"],
      ["<b>P</b>ulse (heart rate)", "Absent", "Below 100/min", "100/min or more"],
      ["<b>G</b>rimace (reflex irritability)", "No response", "Grimace", "Cry, cough, or sneeze"],
      ["<b>A</b>ctivity (muscle tone)", "Limp", "Some flexion", "Active motion"],
      ["<b>R</b>espiration", "Absent", "Slow, irregular; weak cry", "Good effort; strong cry"]]),
    note: "7 to 10 reassuring · 4 to 6 moderately abnormal · 0 to 3 low. If the 5-minute score is below 7, repeat every 5 minutes up to 20 minutes. Resuscitation is never delayed to assign a score.",
    src: "AAP/ACOG Committee Opinion 644, The Apgar Score (2015)" },
  borg: { title: "Modified Borg dyspnea scale (CR10)", intro: "The patient rates breathlessness from 0 to 10.",
    body: T(["Rating", "Description"], [["0", "Nothing at all"], ["0.5", "Very, very slight (just noticeable)"], ["1", "Very slight"], ["2", "Slight"], ["3", "Moderate"], ["4", "Somewhat severe"], ["5", "Severe"], ["6", ""], ["7", "Very severe"], ["8", ""], ["9", "Very, very severe (almost maximal)"], ["10", "Maximal"]]),
    note: "Often used to guide exercise intensity and to track dyspnea during a 6-minute walk test.", src: "Borg GA. Med Sci Sports Exerc. 1982;14(5):377-381" },
  gcs: { title: "Glasgow Coma Scale", intro: "Add the best eye, verbal, and motor responses. Total 3 to 15.",
    body: T(["Score", "Eye opening", "Verbal", "Motor"], [
      ["6", "", "", "Obeys commands"], ["5", "", "Oriented", "Localizes pain"], ["4", "Spontaneous", "Confused", "Withdraws from pain"],
      ["3", "To voice", "Inappropriate words", "Abnormal flexion (decorticate)"], ["2", "To pain", "Incomprehensible sounds", "Extension (decerebrate)"], ["1", "None", "None", "None"]]),
    note: "13 to 15 mild · 9 to 12 moderate · 8 or less severe. A GCS of 8 or less usually means the patient can't protect the airway.",
    src: "Teasdale G, Jennett B. Lancet. 1974;2(7872):81-84" },
  rass: { title: "Richmond Agitation-Sedation Scale (RASS)", intro: "Observe first, then call the patient's name, then use physical stimulation if needed.",
    body: T(["Score", "Term", "Description"], [
      ["+4", "Combative", "Violent; immediate danger to staff"], ["+3", "Very agitated", "Pulls at or removes tubes or catheters; aggressive"],
      ["+2", "Agitated", "Frequent nonpurposeful movement; fights the ventilator"], ["+1", "Restless", "Anxious, but movements not aggressive"],
      ["0", "Alert and calm", ""], ["−1", "Drowsy", "Sustained awakening to voice (eyes open 10 seconds or more)"],
      ["−2", "Light sedation", "Briefly awakens to voice (less than 10 seconds)"], ["−3", "Moderate sedation", "Movement or eye opening to voice, but no eye contact"],
      ["−4", "Deep sedation", "No response to voice; moves or opens eyes to physical stimulation"], ["−5", "Unarousable", "No response to voice or physical stimulation"]]),
    note: "A common target for ventilated adults is light sedation, RASS −2 to 0.", src: "Sessler CN, et al. Am J Respir Crit Care Med. 2002;166(10):1338-1344" },
  berlin: { title: "Berlin definition of ARDS", intro: "All four criteria must be met.",
    body: T(["Criterion", "Requirement"], [
      ["Timing", "Within 1 week of a known insult or new or worsening respiratory symptoms"],
      ["Chest imaging", "Bilateral opacities not fully explained by effusions, collapse, or nodules"],
      ["Origin of edema", "Not fully explained by heart failure or fluid overload"],
      ["Oxygenation (PEEP or CPAP 5 cm H2O or more)", "Mild: PaO2/FIO2 above 200 to 300<br>Moderate: above 100 to 200<br>Severe: 100 or less"]]),
    note: "The 2023 global definition keeps these categories and adds SpO2/FIO2 and patients on HFNC at 30 L/min or more.",
    src: "ARDS Definition Task Force. JAMA. 2012;307(23):2526-2533; Matthay MA, et al. Am J Respir Crit Care Med. 2024;209(1):37-47" },
  gold: { title: "GOLD spirometric grades for COPD", intro: "Requires a postbronchodilator FEV1/FVC below 0.70.",
    body: T(["Grade", "Severity", "FEV1 % predicted"], [["GOLD 1", "Mild", "80% or more"], ["GOLD 2", "Moderate", "50% to 79%"], ["GOLD 3", "Severe", "30% to 49%"], ["GOLD 4", "Very severe", "Below 30%"]]) +
      T(["Group", "Exacerbations in past year", "Symptoms"], [["A", "0 or 1 moderate, no hospitalization", "mMRC 0 to 1 or CAT below 10"], ["B", "0 or 1 moderate, no hospitalization", "mMRC 2 or more or CAT 10 or more"], ["E", "2 or more moderate, or 1 or more leading to hospitalization", "Any"]]),
    note: "The grade describes airflow limitation; the A/B/E group guides initial drug therapy.", src: "Global Initiative for Chronic Obstructive Lung Disease (GOLD) report" },
  naepp: { title: "Asthma severity, age 12 and older (NAEPP)", intro: "Classify by the most severe feature present.",
    body: T(["Feature", "Intermittent", "Mild persistent", "Moderate persistent", "Severe persistent"], [
      ["Symptoms", "2 days/wk or less", "More than 2 days/wk, not daily", "Daily", "Throughout the day"],
      ["Night awakenings", "2×/month or less", "3 to 4×/month", "More than 1×/wk, not nightly", "Often 7×/wk"],
      ["SABA use", "2 days/wk or less", "More than 2 days/wk, not daily", "Daily", "Several times a day"],
      ["Activity limits", "None", "Minor", "Some", "Extreme"],
      ["FEV1 % predicted", "Above 80%", "Above 80%", "60% to 80%", "Below 60%"]]),
    note: "Severity is classified before starting long-term control therapy.", src: "NAEPP Expert Panel Report 3 (2007)" },
  mallampati: { title: "Mallampati classification", intro: "Patient sits upright, opens the mouth fully, and protrudes the tongue without phonating.",
    body: T(["Class", "Structures visible"], [["I", "Soft palate, fauces, uvula, tonsillar pillars"], ["II", "Soft palate, fauces, uvula"], ["III", "Soft palate, base of uvula"], ["IV", "Hard palate only"]]),
    note: "Classes III and IV predict a difficult laryngoscopy.", src: "Samsoon GL, Young JR. Anaesthesia. 1987;42(5):487-490" },
  ahi: { title: "Sleep apnea severity by AHI (adults)", intro: "Apnea-hypopnea index = apneas plus hypopneas per hour of sleep.",
    body: T(["AHI (events/hour)", "Severity"], [["Below 5", "Normal"], ["5 to 14", "Mild"], ["15 to 29", "Moderate"], ["30 or more", "Severe"]]),
    note: "Children use lower cutoffs; an AHI above 1 is abnormal in most pediatric criteria.", src: "American Academy of Sleep Medicine" },
  spaulding: { title: "Spaulding classification", intro: "The level of reprocessing depends on what the device touches.",
    body: T(["Category", "Contact", "Minimum processing", "Examples"], [
      ["Critical", "Sterile tissue or the vascular system", "Sterilization", "Surgical instruments, intravascular catheters"],
      ["Semicritical", "Mucous membranes or nonintact skin", "High-level disinfection", "Bronchoscopes, laryngoscope blades, reusable breathing circuits"],
      ["Noncritical", "Intact skin only", "Low-level disinfection", "BP cuffs, stethoscopes, pulse oximeter probes"]]),
    note: "Thorough cleaning always comes before disinfection or sterilization.", src: "CDC Guideline for Disinfection and Sterilization in Healthcare Facilities (2008, updated)" },
  ls: { title: "L/S ratio and fetal lung maturity", intro: "Lecithin/sphingomyelin ratio measured in amniotic fluid.",
    body: T(["L/S ratio", "Interpretation"], [["2:1 or higher", "Mature; low risk of RDS"], ["1.5:1 to 1.9:1", "Borderline"], ["Below 1.5:1", "Immature; high risk of RDS"]]),
    note: "Infants of diabetic mothers can develop RDS even at 2:1. The presence of phosphatidylglycerol (PG) supports maturity.", src: "Gluck L, et al. Am J Obstet Gynecol. 1971;109(3):440-445" },
  ardsnet: { title: "ARDSNet PEEP/FIO2 table (lower PEEP/higher FIO2)", intro: "Goal: PaO2 55 to 80 mm Hg or SpO2 88% to 95%.",
    body: T(["FIO2", "PEEP (cm H2O)"], [["0.30", "5"], ["0.40", "5 to 8"], ["0.50", "8 to 10"], ["0.60", "10"], ["0.70", "10 to 14"], ["0.80", "14"], ["0.90", "14 to 18"], ["1.0", "18 to 24"]]),
    note: "Move up or down one step at a time to stay within the oxygenation goal.", src: "NIH NHLBI ARDS Network. N Engl J Med. 2000;342(18):1301-1308" },
  abg: { title: "Blood gas normals and compensation", intro: "Normal arterial values (adult, sea level) and the expected compensation for each primary disorder.",
    body: T(["Value", "Normal range"], [["pH", "7.35 to 7.45"], ["PaCO2", "35 to 45 mm Hg"], ["HCO3-", "22 to 26 mEq/L"], ["Base excess", "−2 to +2 mEq/L"], ["PaO2 (room air)", "80 to 100 mm Hg"], ["SaO2", "95% to 100%"]]) +
      T(["Primary disorder", "Expected compensation"], [
        ["Metabolic acidosis", "PaCO2 = 1.5 × HCO3- + 8 (±2) (Winter's formula)"],
        ["Metabolic alkalosis", "PaCO2 rises about 0.7 mm Hg per 1 mEq/L rise in HCO3-"],
        ["Acute respiratory acidosis", "HCO3- rises about 1 mEq/L per 10 mm Hg rise in PaCO2"],
        ["Chronic respiratory acidosis", "HCO3- rises about 3.5 to 4 mEq/L per 10 mm Hg rise in PaCO2"],
        ["Acute respiratory alkalosis", "HCO3- falls about 2 mEq/L per 10 mm Hg fall in PaCO2"],
        ["Chronic respiratory alkalosis", "HCO3- falls about 4 to 5 mEq/L per 10 mm Hg fall in PaCO2"]]),
    note: "Compensation brings the pH toward normal but rarely all the way. A normal pH with abnormal PaCO2 and HCO3- suggests full compensation or a mixed disorder. Anion gap = Na+ − (Cl- + HCO3-); normal is about 8 to 12 mEq/L.",
    src: "Egan's Fundamentals of Respiratory Care; Berend K, et al. N Engl J Med. 2014;371(15):1434-1445" },
  oxy: { title: "Oxygenation indices", intro: "Common ways to judge how well the lungs move O2 into the blood.",
    body: T(["Index", "Formula", "Interpretation"], [
      ["P/F ratio", "PaO2 ÷ FIO2", "Normal about 400 to 500. 300 or less means impaired oxygenation (see the Berlin ARDS card for severity)."],
      ["Alveolar O2 (PAO2)", "FIO2 × (PB − 47) − PaCO2 ÷ 0.8", "At sea level on room air, about 100 mm Hg."],
      ["A–a gradient", "PAO2 − PaO2", "About 5 to 15 mm Hg on room air in young adults; rises with age (roughly age ÷ 4 + 4). Widens with V/Q mismatch, shunt, or diffusion problems; normal in pure hypoventilation."],
      ["Oxygenation index (OI)", "(Mean airway pressure × FIO2 × 100) ÷ PaO2", "Higher is worse. In neonates, about 25 or more is severe failure (iNO is often considered), and 40 or more is a common ECMO threshold."]]),
    note: "Use the same FIO2 as a decimal for P/F (0.40, not 40) and as a percent inside the OI formula (× 100).",
    src: "Egan's Fundamentals of Respiratory Care; AARC CPG: Inhaled Nitric Oxide for Neonates" },
  o2dev: { title: "O2 delivery devices", intro: "Typical flows and approximate FIO2. Low-flow devices give a variable FIO2 that depends on the patient's breathing pattern.",
    body: T(["Device", "Flow", "Approximate FIO2"], [
      ["Nasal cannula", "1 to 6 L/min", "24% to 44% (about +4% per L/min)"],
      ["Simple mask", "5 to 10 L/min (at least 5 to flush CO2)", "35% to 50%"],
      ["Partial rebreathing mask", "Enough to keep the bag from collapsing (often 10 L/min or more)", "40% to 70%"],
      ["Nonrebreathing mask", "10 to 15 L/min, bag stays inflated", "60% to 80% or more"],
      ["High-flow nasal cannula", "Adults up to 60 L/min", "21% to 100%, set on the blender"]]) +
      T(["Air-entrainment FIO2", "Air:O2 ratio", "Total parts"], [["24%", "25:1", "26"], ["28%", "10:1", "11"], ["30%", "8:1", "9"], ["35%", "5:1", "6"], ["40%", "3:1", "4"], ["50%", "1.7:1", "2.7"], ["60%", "1:1", "2"], ["100%", "0:1", "1"]]),
    note: "Total flow = O2 flow × total parts. An air-entrainment device meets the patient's demand only if total flow is at least about 3 to 4 times the minute ventilation, or exceeds peak inspiratory flow.",
    src: "Egan's Fundamentals of Respiratory Care; AARC CPG: Oxygen Therapy in the Acute Care Facility" },
  cylinder: { title: "O2 cylinder duration", intro: "Minutes remaining = gauge pressure (psig) × cylinder factor ÷ flow (L/min).",
    body: T(["Cylinder", "Factor (L/psig)", "Full volume (about)"], [["D", "0.16", "350 L"], ["E", "0.28", "625 to 660 L"], ["M", "1.56", "3,000 L"], ["G", "2.41", "5,300 L"], ["H or K", "3.14", "6,900 L"]]),
    note: "A full cylinder reads about 2,200 psig. Many protocols subtract a safety reserve (often 200 to 500 psig) before calculating, so the cylinder isn't run empty.",
    src: "Egan's Fundamentals of Respiratory Care; Cairo JM, Mosby's Respiratory Care Equipment" },
  ventcalc: { title: "Ventilator calculations", intro: "Formulas used at the bedside.",
    body: T(["Measure", "Formula", "Notes"], [
      ["Predicted body weight (PBW)", "Male: 50 + 2.3 × (height in inches − 60)<br>Female: 45.5 + 2.3 × (height in inches − 60)", "Set VT from PBW, not actual weight."],
      ["Lung-protective VT", "6 to 8 mL/kg PBW (start at 6 in ARDS)", "Keep plateau pressure 30 cm H2O or less and driving pressure (Pplat − PEEP) about 15 or less."],
      ["Static compliance", "VT ÷ (Pplat − PEEP)", "Normal about 50 to 100 mL/cm H2O in a ventilated adult."],
      ["Dynamic compliance", "VT ÷ (PIP − PEEP)", "Falls with either higher resistance or lower compliance."],
      ["Airway resistance", "(PIP − Pplat) ÷ flow in L/sec", "Use constant (square-wave) flow. Normal with an ETT is about 5 to 10 cm H2O/L/sec."],
      ["New rate for a target PaCO2", "Current rate × current PaCO2 ÷ desired PaCO2", "Assumes VT and dead space stay the same."],
      ["Minute ventilation", "VT × rate", "Normal adult resting VE about 5 to 10 L/min."]]),
    note: "A rising PIP with an unchanged Pplat points to resistance (secretions, bronchospasm, kinked tube). When PIP and Pplat both rise, compliance has fallen.",
    src: "ARDSNet protocol; Pilbeam's Mechanical Ventilation" },
  weaning: { title: "Weaning and extubation readiness", intro: "Commonly used thresholds. No single number decides; use them together with the patient's overall condition.",
    body: T(["Measure", "Favors weaning or extubation"], [
      ["Rapid shallow breathing index (f ÷ VT in liters)", "Below 105 breaths/min/L"],
      ["Maximal inspiratory pressure (MIP or NIF)", "More negative than −20 to −30 cm H2O"],
      ["Vital capacity", "More than 10 to 15 mL/kg"],
      ["Minute ventilation", "Below 10 L/min"],
      ["Oxygenation", "P/F above 150 to 200 on PEEP 5 to 8 cm H2O and FIO2 0.40 to 0.50 or less"],
      ["Clinical status", "Cause of failure improving, hemodynamically stable, awake or easily arousable, adequate cough"]]) +
      T(["Spontaneous breathing trial (SBT)", "Usual practice"], [
        ["How", "30 to 120 minutes on low pressure support (5 to 8 cm H2O) or a T-piece, paired with a daily sedation interruption (SAT)"],
        ["Stop the trial if", "RR above 35, SpO2 below 90%, HR above 140 or a 20% change, SBP above 180 or below 90, or marked distress, diaphoresis, or anxiety"],
        ["Cuff leak test", "A leak below about 110 mL (or under about 12% to 24% of VT) suggests a higher risk of postextubation stridor; steroids before extubation are often recommended"]]),
    note: "Passing the SBT shows the patient can breathe without the ventilator. Extubation also needs an airway the patient can protect: cough, secretions, and mental status.",
    src: "ACCP/ATS Liberation from Mechanical Ventilation guideline (2017); Yang KL, Tobin MJ. N Engl J Med. 1991;324:1445-1450" },
  pft: { title: "Pulmonary function interpretation", intro: "Basic patterns and test-quality rules.",
    body: T(["Pattern", "Key findings"], [
      ["Obstructive", "FEV1/FVC below the lower limit of normal (GOLD uses below 0.70 after a bronchodilator)"],
      ["Restrictive", "TLC below the lower limit of normal (about 80% predicted). A low FVC with a normal or high FEV1/FVC only suggests restriction until TLC is measured."],
      ["Mixed", "Low FEV1/FVC and low TLC"],
      ["Bronchodilator response", "Classically an increase of 12% and 200 mL in FEV1 or FVC (the 2022 standard uses more than 10% of the predicted value)"],
      ["DLCO", "Low with emphysema, interstitial disease, pulmonary vascular disease, or anemia; can be high with polycythemia, asthma, or pulmonary hemorrhage"]]) +
      T(["Quality and challenge testing", "Standard"], [
        ["Acceptable maneuver", "Good start, no cough in the first second, no early termination or leak"],
        ["Repeatability", "The two largest FVC and FEV1 values within 150 mL; usually no more than 8 attempts"],
        ["Volume calibration", "3-L syringe check daily, within ±3%"],
        ["Methacholine challenge (PC20)", "Below 1 mg/mL moderate-to-severe hyperresponsiveness · 1 to 4 mild · 4 to 16 borderline · above 16 normal"]]),
    note: "Compare results to lower limits of normal from current reference equations when they're available.",
    src: "ATS/ERS Standardization of Spirometry (2019); ERS/ATS Interpretive Strategies (2022); ATS methacholine guideline (1999)" },
  nrp: { title: "Newborn resuscitation numbers", intro: "Key targets from the Neonatal Resuscitation Program.",
    body: T(["Minutes after birth", "Target preductal SpO2"], [["1", "60% to 65%"], ["2", "65% to 70%"], ["3", "70% to 75%"], ["4", "75% to 80%"], ["5", "80% to 85%"], ["10", "85% to 95%"]]) +
      T(["Step", "Guidance"], [
        ["Start PPV", "Apneic or gasping, or HR below 100/min after initial steps"],
        ["PPV settings", "Rate 40 to 60 breaths/min; PIP about 20 to 25 cm H2O; PEEP about 5 cm H2O"],
        ["Starting FIO2", "21% at 35 weeks or more; 21% to 30% below 35 weeks; titrate to the SpO2 table"],
        ["Chest compressions", "HR below 60/min despite 30 seconds of effective PPV (ideally through an airway); 3 compressions to 1 breath, 120 events/min, with FIO2 1.0"],
        ["Epinephrine", "HR still below 60/min after 60 seconds of compressions with ventilation"]]),
    note: "Place the oximeter on the right hand or wrist for a preductal reading. Effective ventilation is the most important step in newborn resuscitation.",
    src: "AAP/AHA Neonatal Resuscitation Program, 8th edition (2021)" },
  airwaysize: { title: "Airway sizes and depths", intro: "Starting sizes; always have one size larger and smaller ready.",
    body: T(["Patient", "ETT internal diameter", "Insertion depth (at the lip)"], [
      ["Newborn below 1 kg (under 28 wk)", "2.5 mm", "About weight in kg + 6 cm"],
      ["Newborn 1 to 2 kg (28 to 34 wk)", "3.0 mm", "About weight in kg + 6 cm"],
      ["Newborn above 2 kg (over 34 wk)", "3.5 mm", "About weight in kg + 6 cm"],
      ["Child, cuffed tube", "Age in years ÷ 4 + 3.5", "About 3 × the tube size"],
      ["Child, uncuffed tube", "Age in years ÷ 4 + 4", "About 3 × the tube size"],
      ["Adult female", "7.0 to 7.5 mm", "About 21 cm"],
      ["Adult male", "7.5 to 8.0 mm", "About 23 cm"]]) +
      T(["Other airways", "How to size"], [["Oropharyngeal airway", "Corner of the mouth to the angle of the jaw (or earlobe)"], ["Nasopharyngeal airway", "Tip of the nose to the tragus of the ear (or earlobe)"]]),
    note: "Confirm ETT placement with exhaled CO2 (capnography) and a chest radiograph. The tip should sit about 3 to 5 cm above the carina in adults.",
    src: "AAP/AHA NRP 8th edition; AHA PALS; Egan's Fundamentals of Respiratory Care" },
  airwaycare: { title: "Artificial airway care numbers", intro: "Common targets for suctioning and cuff care.",
    body: T(["Item", "Usual target"], [
      ["Cuff pressure", "20 to 30 cm H2O (about 15 to 22 mm Hg)"],
      ["Suction pressure: adult", "−100 to −150 mm Hg"],
      ["Suction pressure: child", "−80 to −100 mm Hg"],
      ["Suction pressure: neonate", "−60 to −80 mm Hg"],
      ["Catheter size", "No more than half the ETT internal diameter (up to 70% in neonates)"],
      ["Suction duration", "15 seconds or less per pass"],
      ["Preoxygenation", "100% O2 for 30 to 60 seconds before suctioning, especially if the patient desaturates"]]),
    note: "Cuff pressure above about 30 cm H2O can reduce tracheal mucosal blood flow; too low raises the risk of aspiration and VAP.",
    src: "AARC CPG: Endotracheal Suctioning of Mechanically Ventilated Patients (2010); Egan's Fundamentals of Respiratory Care" },
  precautions: { title: "Isolation precautions", intro: "Standard precautions for every patient, plus transmission-based precautions when needed.",
    body: T(["Type", "Examples", "Key measures"], [
      ["Airborne", "Tuberculosis, measles, varicella", "Fit-tested N95 or higher respirator; negative-pressure airborne infection isolation room (AIIR)"],
      ["Droplet", "Influenza, pertussis, Neisseria meningitidis, mycoplasma", "Surgical mask within about 6 feet; private room preferred"],
      ["Contact", "MRSA, VRE, C. difficile, RSV (with droplet)", "Gown and gloves on entry; dedicated equipment"]]) +
      T(["PPE", "Order"], [["Putting on (donning)", "Gown → mask or respirator → goggles or face shield → gloves"], ["Taking off (doffing)", "Gloves → goggles or face shield → gown → mask or respirator (outside the room), then hand hygiene"]]),
    note: "Use soap and water, not alcohol rub, after caring for a patient with C. difficile; alcohol doesn't kill the spores.",
    src: "CDC Guideline for Isolation Precautions (2007, updated); CDC PPE sequence" },
  start: { title: "START triage", intro: "Simple Triage and Rapid Treatment for adults in a mass-casualty incident.",
    body: T(["Finding", "Category"], [
      ["Can walk", "Minor (green)"],
      ["Not breathing after the airway is repositioned", "Expectant or deceased (black)"],
      ["Breathing again after the airway is repositioned", "Immediate (red)"],
      ["Respiratory rate above 30/min", "Immediate (red)"],
      ["No radial pulse or capillary refill more than 2 seconds", "Immediate (red)"],
      ["Can't follow simple commands", "Immediate (red)"],
      ["Everyone else", "Delayed (yellow)"]]),
    note: "Remember RPM: Respirations 30, Perfusion 2 (seconds), Mental status (can follow commands). Children use the JumpSTART version.",
    src: "START triage (Newport Beach Fire Department / Hoag Hospital); CHEMM, U.S. HHS" },
  dyshb: { title: "CO poisoning and methemoglobinemia", intro: "Standard pulse oximetry can't tell these abnormal hemoglobins from normal oxyhemoglobin.",
    body: T(["", "Carbon monoxide (COHb)", "Methemoglobin (MetHb)"], [
      ["Normal level", "Below about 3% (smokers up to about 10%)", "Below about 1% to 2%"],
      ["SpO2 reading", "Falsely normal or high", "Tends toward about 85% regardless of the true SaO2"],
      ["PaO2", "Usually normal", "Usually normal"],
      ["How to measure", "CO-oximetry", "CO-oximetry"],
      ["Treatment", "100% O2 (NRB or ventilator); hyperbaric O2 for severe cases", "Stop the cause; methylene blue for significant levels"]]),
    note: "A gap between the SpO2 and the CO-oximeter SaO2 is the clue. Common MetHb causes include benzocaine and other topical anesthetics, dapsone, and nitrates.",
    src: "Egan's Fundamentals of Respiratory Care; Hampson NB, et al. Am J Respir Crit Care Med. 2012;186(11):1095-1101" },
  ecg: { title: "ECG basics", intro: "Normal intervals and quick rhythm clues.",
    body: T(["Measure", "Normal"], [["Heart rate", "60 to 100/min"], ["PR interval", "0.12 to 0.20 second (3 to 5 small boxes)"], ["QRS duration", "Below 0.12 second (under 3 small boxes)"], ["Paper speed", "25 mm/sec: 1 small box = 0.04 sec, 1 large box = 0.20 sec"]]) +
      T(["Rhythm or finding", "Clues"], [
        ["Atrial fibrillation", "Irregularly irregular, no distinct P waves"],
        ["Ventricular tachycardia", "Wide QRS, regular, usually above 120 to 150/min"],
        ["Ventricular fibrillation", "Chaotic waveform, no identifiable QRS"],
        ["Hyperkalemia", "Peaked T waves, then wide QRS and loss of P waves; can progress to a sine-wave pattern"],
        ["Hypokalemia", "Flattened T waves and U waves"]]),
    note: "Pulseless VT and VF are shockable rhythms; asystole and PEA are not.",
    src: "AHA ACLS Provider Manual; Egan's Fundamentals of Respiratory Care" },
  acls: { title: "Adult CPR and ACLS numbers", intro: "Key numbers from current AHA guidelines.",
    body: T(["Item", "Guidance"], [
      ["Compressions", "100 to 120/min, at least 2 inches (5 cm) but not more than 2.4 inches (6 cm), full recoil, minimal pauses"],
      ["Ratio without an advanced airway", "30 compressions to 2 breaths"],
      ["With an advanced airway", "1 breath every 6 seconds (10/min) with continuous compressions"],
      ["Shockable rhythm (VF or pulseless VT)", "Defibrillate (biphasic about 120 to 200 J per the device), then resume CPR right away for 2 minutes"],
      ["Epinephrine", "1 mg IV/IO every 3 to 5 minutes"],
      ["Amiodarone (refractory VF/pVT)", "300 mg first dose, then 150 mg"],
      ["Synchronized cardioversion", "Unstable tachycardia with a pulse; shock is timed to the QRS"]]),
    note: "Waveform capnography helps: a PetCO2 below about 10 mm Hg during CPR suggests poor compressions, and a sudden rise suggests return of spontaneous circulation.",
    src: "AHA Guidelines for CPR and ECC (2020, 2023 update)" },
  croup: { title: "Westley croup score", intro: "Add the points for each sign.",
    body: T(["Sign", "Points"], [
      ["Stridor", "0 none · 1 with agitation · 2 at rest"],
      ["Retractions", "0 none · 1 mild · 2 moderate · 3 severe"],
      ["Air entry", "0 normal · 1 decreased · 2 markedly decreased"],
      ["Cyanosis", "0 none · 4 with agitation · 5 at rest"],
      ["Level of consciousness", "0 normal · 5 disoriented"]]),
    note: "2 or less mild · 3 to 5 moderate · 6 to 11 severe · 12 or more impending respiratory failure. Dexamethasone is given for all severities; nebulized racemic epinephrine is added for moderate or severe croup, with observation for at least 2 to 4 hours afterward for rebound.",
    src: "Westley CR, et al. Am J Dis Child. 1978;132(5):484-487; Bjornson CL, Johnson DW. CMAJ. 2013;185(15):1317-1323" },
  hfnc: { title: "High-flow nasal cannula", intro: "Heated, humidified gas at flows that meet or exceed the patient's inspiratory demand.",
    body: T(["Item", "Usual practice"], [
      ["Adult flow", "Often started at 30 to 40 L/min and titrated up to 60 L/min"],
      ["Infant and child flow", "About 1 to 2 L/kg/min (commonly 2 L/kg/min in bronchiolitis), up to device limits"],
      ["FIO2", "Set on the blender, 21% to 100%, titrated to the SpO2 goal"],
      ["Prong size", "Prongs should fill no more than about half of each nostril, so gas can escape"],
      ["Benefits", "Washes out upper-airway dead space, gives a small PEEP effect, delivers a more reliable FIO2, and improves comfort and secretion clearance"]]),
    note: "Rising RR, work of breathing, or FIO2 needs on HFNC can signal failure; don't let it delay escalation to NIV or intubation.",
    src: "AARC CPG: Use of Heated High-Flow Nasal Cannula (2021); Franklin D, et al. N Engl J Med. 2018;378:1121-1131" },
  niv: { title: "Noninvasive ventilation (NIV)", intro: "Typical starting settings and who is a poor candidate.",
    body: T(["Item", "Usual practice"], [
      ["Initial settings (COPD)", "IPAP about 10 to 12 cm H2O, EPAP about 4 to 5 cm H2O; raise IPAP in steps of 2 to lower PaCO2"],
      ["To improve oxygenation", "Raise EPAP (and keep the IPAP − EPAP difference) or raise FIO2"],
      ["To improve ventilation", "Widen the gap between IPAP and EPAP (more pressure support)"],
      ["Reassess", "ABG or clinical response within 1 to 2 hours"]]) +
      T(["Poor candidates or contraindications", ""], [["Cardiac or respiratory arrest; unstable hemodynamics", ""], ["Can't protect the airway, copious secretions, or uncooperative", ""], ["Facial trauma, burns, or recent facial or upper-GI surgery", ""], ["Uncontrolled vomiting or high aspiration risk", ""]]),
    note: "NIV works best for COPD exacerbations with hypercapnia and for cardiogenic pulmonary edema.",
    src: "ERS/ATS Clinical Practice Guidelines: Noninvasive Ventilation for Acute Respiratory Failure (2017)" },
  cf: { title: "Cystic fibrosis essentials", intro: "Diagnosis and daily therapy.",
    body: T(["Sweat chloride", "Interpretation"], [["60 mmol/L or more", "Consistent with CF"], ["30 to 59 mmol/L", "Intermediate; further testing (genetics) needed"], ["Below 30 mmol/L", "CF unlikely"]]) +
      T(["Common order of inhaled therapy", ""], [["1. Bronchodilator", "Opens the airways first"], ["2. Hypertonic saline", "Hydrates secretions"], ["3. Dornase alfa (Pulmozyme)", "Thins mucus; timing relative to airway clearance varies by program"], ["4. Airway clearance", "Removes the loosened secretions"], ["5. Inhaled antibiotic or steroid", "Last, so it reaches cleared airways"]]),
    note: "Dornase alfa must not be mixed with other drugs in the nebulizer. CFTR modulators (such as elexacaftor/tezacaftor/ivacaftor) treat the underlying protein defect for eligible mutations.",
    src: "Cystic Fibrosis Foundation diagnosis consensus (Farrell PM, et al. J Pediatr. 2017;181S:S4-S15); CFF airway clearance guidelines" },
  actionplan: { title: "Asthma action plan zones", intro: "Zones are based on symptoms and peak flow as a percent of the patient's personal best.",
    body: T(["Zone", "Peak flow", "Meaning and action"], [
      ["Green", "80% to 100%", "Doing well; take daily controller medicines"],
      ["Yellow", "50% to 79%", "Caution; add quick-relief medicine and follow the plan, call the provider if not improving"],
      ["Red", "Below 50%", "Medical alert; take quick-relief medicine and get emergency help now"]]),
    note: "Each patient's plan uses their own personal best peak flow, measured when they are well.",
    src: "NAEPP Expert Panel Report 3 (2007); NHLBI asthma action plan" },
};

/* Shown only after the final answer (team decision), so a card never gives the answer away. */
function scaleButtons(q, c) {
  if (!c.done) return "";
  const btns = (q.scales || []).filter((k) => SCALES[k]).map((k) =>
    `<button type="button" class="scalebtn" data-act="scale" data-k="${k}">${ICON.info}<span>${SCALES[k].title}</span></button>`);
  if (q.ev) btns.unshift(`<button type="button" class="scalebtn" data-act="scale" data-k="__ev">${ICON.info}<span>Show the evidence on the ${q.ev.label}</span></button>`);
  return btns.length ? `<div class="scalerow">${btns.join("")}</div>` : "";
}

/* Circles and numbered badges drawn over the image. Coordinates are image pixels,
   so the same overlay works at any display size (question card or full-screen viewer). */
function evOverlay(q, box) {
  const ev = q.ev, W = q.w, H = q.h, isEcg = ev.label === "EKG";
  const x0 = box ? box.x : 0, x1 = box ? box.x + box.w : W;
  const stroke = (el) => `${el.replace("/>", ` stroke="${ev.halo}" stroke-width="7" fill="none" vector-effect="non-scaling-stroke"/>`)}${el.replace("/>", ` stroke="${ev.color}" stroke-width="3.5" fill="none" vector-effect="non-scaling-stroke"/>`)}`;
  // Each badge sits just outside its mark: anchor point on the mark + a CSS shift away from it.
  const SHIFT = { ne: "translate(3px, calc(-100% - 3px))", nw: "translate(calc(-100% - 3px), calc(-100% - 3px))",
    se: "translate(3px, 3px)", sw: "translate(calc(-100% - 3px), 3px)", n: "translate(-50%, calc(-100% - 4px))", s: "translate(-50%, 4px)" };
  let svg = "", badges = "";
  for (const m of ev.marks) {
    let ax, ay, dir;
    if (m.kind === "span") {
      const t = H * 0.04;
      svg += stroke(`<path d="M${m.x1} ${m.y - t}V${m.y + t}M${m.x1} ${m.y}H${m.x2}M${m.x2} ${m.y - t}V${m.y + t}"/>`);
      dir = m.badge || "s"; ax = (m.x1 + m.x2) / 2; ay = dir === "n" ? m.y - t : m.y + t;
    } else {
      svg += stroke(`<ellipse cx="${m.cx}" cy="${m.cy}" rx="${m.rx}" ry="${m.ry}"/>`);
      dir = m.badge || ((m.cx + m.rx * 0.71 - x0) / (x1 - x0) > 0.88 ? "nw" : "ne");
      const k = 0.71;
      ax = dir === "n" || dir === "s" ? m.cx : dir.endsWith("e") ? m.cx + m.rx * k : m.cx - m.rx * k;
      ay = dir === "n" ? m.cy - m.ry : dir === "s" ? m.cy + m.ry : dir.startsWith("n") ? m.cy - m.ry * k : m.cy + m.ry * k;
    }
    if (m.n) badges += `<span class="evbadge ${isEcg ? "ecg" : ""}" style="left:${ax / W * 100}%;top:${ay / H * 100}%;transform:${SHIFT[dir]};background:${ev.color}" aria-hidden="true">${m.n}</span>`;
  }
  return `<svg class="evsvg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">${svg}</svg>${badges}`;
}

function evidenceSheet() {
  const q = Q(), ev = q.ev; if (!ev) return "";
  const isEcg = ev.label === "EKG";
  const notes = ev.marks.filter((m) => m.n && m.note);
  return `<div class="scrim"><div class="dialog scaledlg" role="dialog" aria-modal="true" aria-labelledby="scT">
    <div class="schead"><h2 id="scT">Evidence on the ${ev.label}</h2><button type="button" class="vb" data-act="scaleclose" aria-label="Close">${ICON.x}</button></div>
    <p class="sub">The circled areas are what make ${q.ans} the correct answer.</p>
    <figure><button type="button" class="imgbtn evimg" data-act="evview" aria-label="Enlarge the ${ev.label} with the evidence circled">${ev.view
      ? `<span class="evcrop" style="aspect-ratio:${ev.view.w}/${q.h}"><span class="evwrap" style="width:${q.w / ev.view.w * 100}%;left:${-ev.view.x / ev.view.w * 100}%"><img src="${q.img}" alt="${esc(q.alt)}">${evOverlay(q, ev.view)}</span></span>`
      : `<span class="evwrap"><img src="${q.img}" alt="${esc(q.alt)}">${evOverlay(q)}</span>`}<span class="ex" aria-hidden="true">${ICON.expand}</span></button>
    <figcaption>${ev.view ? `${esc(q.cap.toUpperCase())} · ZOOMED IN · TAP TO SEE THE WHOLE STRIP` : `${esc(q.cap.toUpperCase())} · TAP TO ENLARGE`}</figcaption></figure>
    <ol class="evlist">${notes.map((m) => `<li><span class="evn ${isEcg ? "ecg" : ""}" style="background:${ev.color}">${m.n}</span><span>${esc(m.note)}</span></li>`).join("")}</ol>
    <p class="scnote">${esc(ev.takeaway)}</p>
    <button type="button" class="btn" data-act="scaleclose" style="width:100%">Back to the question</button></div></div>`;
}

function scaleSheet() {
  if (S.scale === "__ev") return evidenceSheet();
  const s = SCALES[S.scale]; if (!s) return "";
  return `<div class="scrim"><div class="dialog scaledlg" role="dialog" aria-modal="true" aria-labelledby="scT">
    <div class="schead"><h2 id="scT">${s.title}</h2><button type="button" class="vb" data-act="scaleclose" aria-label="Close">${ICON.x}</button></div>
    <p class="sub">${s.intro}</p><div class="sctwrap">${s.body}</div>
    ${s.note ? `<p class="scnote">${s.note}</p>` : ""}<p class="scsrc">Source: ${s.src}</p>
    <button type="button" class="btn" data-act="scaleclose" style="width:100%">Back to the question</button></div></div>`;
}
/* Field tag for the shared answer library (voice.js scope notes): cards added above without a field are rt cards. */
Object.keys(window.SCALES).forEach((k) => { if (!window.SCALES[k].field) window.SCALES[k].field = "rt"; });
