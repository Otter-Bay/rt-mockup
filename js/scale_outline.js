/* Outline tags for each info card, by exam. Used by the Study List (js/bin.js).
   FlutterFlow: these are fields on the concept document (domain, task, taskName, topic), not on a question.
   A card keeps its own place on the exam blueprint even if a student opens it from a different question
   or has a different Task chosen on the stats page. */
(function (W) {
  const OTHER = { domain: "", task: "", topic: "", taskName: "Other", domainName: "", topicName: "", other: true };

  // Sleep cards: SDS and RPSGT share the cards but not the Task ids.
  // AHI is the severity index (reporting), not staging. HSAT is test selection, not staging.
  const SDS = {
    staging:   { domain: "III", domainName: "Study Analysis", task: "III-B", taskName: "Sleep Staging", topic: "Sleep staging" },
    infant:    { domain: "III", domainName: "Study Analysis", task: "III-B", taskName: "Sleep Staging", topic: "Sleep staging" },
    arousal:   { domain: "III", domainName: "Study Analysis", task: "III-C", taskName: "Sleep Event Identification", topic: "Arousals" },
    resp_adult:{ domain: "III", domainName: "Study Analysis", task: "III-C", taskName: "Sleep Event Identification", topic: "Respiratory events" },
    hypopnea:  { domain: "III", domainName: "Study Analysis", task: "III-C", taskName: "Sleep Event Identification", topic: "Respiratory events" },
    peds_resp: { domain: "III", domainName: "Study Analysis", task: "III-C", taskName: "Sleep Event Identification", topic: "Respiratory events" },
    plm:       { domain: "III", domainName: "Study Analysis", task: "III-C", taskName: "Sleep Event Identification", topic: "Movements and parasomnias" },
    cardiac:   { domain: "III", domainName: "Study Analysis", task: "III-C", taskName: "Sleep Event Identification", topic: "Cardiac events" },
    stats:     { domain: "III", domainName: "Study Analysis", task: "III-D", taskName: "Sleep Event Reporting", topic: "Reports and calculations" },
    ahi:       { domain: "III", domainName: "Study Analysis", task: "III-D", taskName: "Sleep Event Reporting", topic: "Reports and calculations" },
    tech:      { domain: "I", domainName: "Pre-Testing", task: "I-B", taskName: "Study Preparations", topic: "Sensors, setup and calibration" },
    electrodes:{ domain: "I", domainName: "Pre-Testing", task: "I-B", taskName: "Study Preparations", topic: "Sensors, setup and calibration" },
    artifacts: { domain: "II", domainName: "Sleep Disorders Testing", task: "II-A", taskName: "Signal Maintenance During Testing", topic: "Artifacts and signal quality" },
    titration: { domain: "II", domainName: "Sleep Disorders Testing", task: "II-B", taskName: "Therapeutic Interventions During Testing", topic: "PAP titration" },
    o2titr:    { domain: "II", domainName: "Sleep Disorders Testing", task: "II-B", taskName: "Therapeutic Interventions During Testing", topic: "PAP titration" },
    stopbang:  { domain: "I", domainName: "Pre-Testing", task: "I-A", taskName: "Identification and Care of At-Risk Individuals", topic: "Screening and test selection" },
    ess:       { domain: "I", domainName: "Pre-Testing", task: "I-A", taskName: "Identification and Care of At-Risk Individuals", topic: "Circadian, insomnia and hypersomnia" },
    circadian: { domain: "I", domainName: "Pre-Testing", task: "I-A", taskName: "Identification and Care of At-Risk Individuals", topic: "Circadian, insomnia and hypersomnia" },
    mslt:      { domain: "I", domainName: "Pre-Testing", task: "I-A", taskName: "Identification and Care of At-Risk Individuals", topic: "Screening and test selection" },
    hsat:      { domain: "I", domainName: "Pre-Testing", task: "I-A", taskName: "Identification and Care of At-Risk Individuals", topic: "Home sleep testing" },
    papmodes:  { domain: "V", domainName: "Treatment Plan", task: "V-A", taskName: "Treatment Plan Development", topic: "PAP titration" },
    cms:       { domain: "V", domainName: "Treatment Plan", task: "V-C", taskName: "Treatment Plan Evaluation", topic: "PAP follow-up and adherence" },
    download:  { domain: "V", domainName: "Treatment Plan", task: "V-C", taskName: "Treatment Plan Evaluation", topic: "PAP follow-up and adherence" },
    alt_tx:    { domain: "V", domainName: "Treatment Plan", task: "V-A", taskName: "Treatment Plan Development", topic: "PAP follow-up and adherence" }
  };
  const RPSGT = {
    staging:   { domain: "3", domainName: "Scoring, Reporting, and Data Verification", task: "3-A", taskName: "Score adult studies", topic: "Sleep staging" },
    infant:    { domain: "3", domainName: "Scoring, Reporting, and Data Verification", task: "3-B", taskName: "Score pediatric and infant studies", topic: "Sleep staging" },
    arousal:   { domain: "3", domainName: "Scoring, Reporting, and Data Verification", task: "3-A", taskName: "Score adult studies", topic: "Arousals" },
    resp_adult:{ domain: "3", domainName: "Scoring, Reporting, and Data Verification", task: "3-A", taskName: "Score adult studies", topic: "Respiratory events" },
    hypopnea:  { domain: "3", domainName: "Scoring, Reporting, and Data Verification", task: "3-A", taskName: "Score adult studies", topic: "Respiratory events" },
    peds_resp: { domain: "3", domainName: "Scoring, Reporting, and Data Verification", task: "3-B", taskName: "Score pediatric and infant studies", topic: "Respiratory events" },
    plm:       { domain: "3", domainName: "Scoring, Reporting, and Data Verification", task: "3-C", taskName: "Generate and verify report", topic: "Movements and parasomnias" },
    cardiac:   { domain: "3", domainName: "Scoring, Reporting, and Data Verification", task: "3-A", taskName: "Score adult studies", topic: "Cardiac events" },
    stats:     { domain: "3", domainName: "Scoring, Reporting, and Data Verification", task: "3-C", taskName: "Generate and verify report", topic: "Reports and calculations" },
    ahi:       { domain: "3", domainName: "Scoring, Reporting, and Data Verification", task: "3-C", taskName: "Generate and verify report", topic: "Reports and calculations" },
    tech:      { domain: "2", domainName: "Sleep Study Preparation and Performance", task: "2-A", taskName: "Determine technical preparation", topic: "Sensors, setup and calibration" },
    electrodes:{ domain: "2", domainName: "Sleep Study Preparation and Performance", task: "2-A", taskName: "Determine technical preparation", topic: "Sensors, setup and calibration" },
    artifacts: { domain: "2", domainName: "Sleep Study Preparation and Performance", task: "2-C", taskName: "Identify, respond, and document", topic: "Artifacts and signal quality" },
    titration: { domain: "2", domainName: "Sleep Study Preparation and Performance", task: "2-B", taskName: "Perform procedures and follow practice guidelines", topic: "PAP titration" },
    o2titr:    { domain: "4", domainName: "Treatment and Intervention", task: "4-C", taskName: "Administer oxygen therapy", topic: "PAP titration" },
    hsat:      { domain: "2", domainName: "Sleep Study Preparation and Performance", task: "2-B", taskName: "Perform procedures and follow practice guidelines", topic: "Home sleep testing" },
    stopbang:  { domain: "1", domainName: "Clinical Overview, Education, Patient Support", task: "1-A", taskName: "Patient information and clinical assessment", topic: "Screening and test selection" },
    ess:       { domain: "1", domainName: "Clinical Overview, Education, Patient Support", task: "1-A", taskName: "Patient information and clinical assessment", topic: "Circadian, insomnia and hypersomnia" },
    circadian: { domain: "1", domainName: "Clinical Overview, Education, Patient Support", task: "1-A", taskName: "Patient information and clinical assessment", topic: "Circadian, insomnia and hypersomnia" },
    mslt:      { domain: "1", domainName: "Clinical Overview, Education, Patient Support", task: "1-B", taskName: "Patient and caregiver education", topic: "Reports and calculations" },
    papmodes:  { domain: "4", domainName: "Treatment and Intervention", task: "4-A", taskName: "Administer PAP therapy", topic: "PAP follow-up and adherence" },
    cms:       { domain: "4", domainName: "Treatment and Intervention", task: "4-A", taskName: "Administer PAP therapy", topic: "PAP follow-up and adherence" },
    download:  { domain: "4", domainName: "Treatment and Intervention", task: "4-A", taskName: "Administer PAP therapy", topic: "PAP follow-up and adherence" },
    alt_tx:    { domain: "4", domainName: "Treatment and Intervention", task: "4-B", taskName: "Identify alternative therapies", topic: "Alternative therapies" }
  };
  // CRT/RRT and CNA: cards that the sample questions consistently attach to one Task.
  const RRT = {
    apgar:     { domain: "I", domainName: "Patient data", task: "I-B", taskName: "Perform Clinical Assessment", topic: "Neonatal and pediatric" },
    gcs:       { domain: "I", domainName: "Patient data", task: "I-B", taskName: "Perform Clinical Assessment", topic: "Patient assessment" },
    berlin:    { domain: "I", domainName: "Patient data", task: "I-D", taskName: "Evaluate Procedure Results", topic: "Mechanical ventilation" },
    gold:      { domain: "III", domainName: "Interventions", task: "III-F", taskName: "Use Evidence-Based Practice", topic: "Pulmonary function and diagnostics" },
    pft:       { domain: "III", domainName: "Interventions", task: "III-F", taskName: "Use Evidence-Based Practice", topic: "Pulmonary function and diagnostics" },
    rass:      { domain: "III", domainName: "Interventions", task: "III-E", taskName: "Make or Recommend Changes to the Respiratory Care Plan", topic: "Mechanical ventilation" },
    acls:      { domain: "III", domainName: "Interventions", task: "III-G", taskName: "Provide Respiratory Care in High-Risk Situations", topic: "Cardiac and ECG" },
    o2dev:     { domain: "II", domainName: "Equipment and safety", task: "II-A", taskName: "Troubleshoot Devices During and After Assembling", topic: "Noninvasive support and oxygen" },
    croup:     { domain: "III", domainName: "Interventions", task: "III-D", taskName: "Administer Medications and Specialty Gases", topic: "Neonatal and pediatric" }
  };
  const CNA = {
    vitals:    { domain: "I", domainName: "Physical Care Skills", task: "I-B", taskName: "Basic nursing skills", topic: "Vital signs and measurements" },
    pressure:  { domain: "I", domainName: "Physical Care Skills", task: "I-B", taskName: "Basic nursing skills", topic: "Skin care" },
    fire:      { domain: "I", domainName: "Physical Care Skills", task: "I-B", taskName: "Basic nursing skills", topic: "Safety and emergency" },
    diets:     { domain: "I", domainName: "Physical Care Skills", task: "I-B", taskName: "Basic nursing skills", topic: "Nutrition and hydration" },
    isolation: { domain: "I", domainName: "Physical Care Skills", task: "I-B", taskName: "Basic nursing skills", topic: "Infection control" },
    rom:       { domain: "I", domainName: "Physical Care Skills", task: "I-C", taskName: "Restorative skills", topic: "Mobility and positioning" },
    transfers: { domain: "I", domainName: "Physical Care Skills", task: "I-C", taskName: "Restorative skills", topic: "Mobility and positioning" },
    rights:    { domain: "III", domainName: "Role of the Nurse Aide", task: "III-B", taskName: "Client rights", topic: "Resident rights" }
  };

  const OUTLINE = { SDS: SDS, RPSGT: RPSGT, RRT: RRT, CNA: CNA };

  function fromEntry(e) {
    if (!e || !(e.task || e.sec)) return null;
    const task = e.task || e.sec;
    const topic = e.topic || e.tgroup || "";
    return { domain: e.domain || (String(task).split("-")[0] || ""), task, taskName: e.taskName || e.secName || task,
      topic, topicName: e.topicName || topic, domainName: e.domainName || e.domName || "", other: false };
  }
  function scaleKeys(q) { return (q.scales || q.infoScales || []).filter(Boolean); }
  function majorityFromQuestions(k, qs) {
    if (!qs || !qs.length) return null;
    const hits = qs.filter((q) => !q.demo && scaleKeys(q).includes(k) && (q.sec || q.section));
    // Only questions that are really about this card (only scale, or listed first). Related-card mentions do not count.
    const primary = hits.filter((q) => { const s = scaleKeys(q); return s.length === 1 || s[0] === k; });
    if (!primary.length) return null;
    const tally = {};
    primary.forEach((q) => { const t = q.sec || q.section; tally[t] = (tally[t] || 0) + 1; });
    const top = Object.keys(tally).sort((a, b) => tally[b] - tally[a])[0];
    const q = primary.find((x) => (x.sec || x.section) === top);
    return q ? fromEntry({ task: q.sec || q.section, taskName: q.secName || q.sectionName, domain: q.domain,
      domainName: q.domName || q.domainName, topic: q.tgroup || q.topicGroup || q.topic }) : null;
  }

  function taxonomyForScale(k, opts) {
    opts = opts || {};
    const exam = opts.exam || W.EXAM || "";
    const card = ((opts.scales || W.SCALES || {})[k]) || {};
    // Fields stored on the card itself win (portable to FlutterFlow).
    const own = fromEntry({ task: card.sec || card.task, taskName: card.secName || card.taskName, domain: card.domain,
      domainName: card.domainName || card.domName, topic: card.tgroup || card.topic });
    if (own) return own;
    const mapped = fromEntry((OUTLINE[exam] || {})[k]);
    if (mapped) return mapped;
    const maj = majorityFromQuestions(k, opts.qs || (typeof QS !== "undefined" ? QS : null));
    if (maj) return maj;
    return Object.assign({}, OTHER);
  }

  W.SCALE_OUTLINE = OUTLINE;
  W.taxonomyForScale = taxonomyForScale;
  if (typeof module !== "undefined" && module.exports) module.exports = { SCALE_OUTLINE: OUTLINE, taxonomyForScale, OTHER };
})(typeof window !== "undefined" ? window : globalThis);
