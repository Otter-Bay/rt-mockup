/* CNA reference cards (CNA Ready bank). Load after scales.js. Owner: Ken + Claude.
   Summarized in our own words from standard nurse assistant texts and the cited public guidance; no exam or textbook text is reproduced.
   Ranges and intervals marked "per policy" vary between facilities and textbooks: follow the care plan and facility policy. */
(function () {
  const T = (head, rows) => `<table class="sct"><thead><tr>${head.map((h) => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  Object.assign(window.SCALES, {
    vitals: { title: "Adult vital signs", intro: "Usual resting ranges for adults. Report any reading outside the range, or a big change from the resident's usual.",
      body: T(["Measure", "Usual range", "How to measure"], [
        ["Pulse", "60–100 beats/min", "Radial: 2–3 fingertips on the thumb side of the wrist; count 1 full minute"],
        ["Respirations", "12–20 breaths/min", "One rise + one fall = 1 breath; count 1 full minute without telling the resident"],
        ["Blood pressure", "Normal is below 120/80", "Right-size cuff on the bare upper arm; first sound = systolic, last sound = diastolic"],
        ["Temperature (oral)", "About 97.6–99.6 °F", "Wait at least 15 min after eating, drinking or smoking; rectal reads higher, axillary lower"]]),
      note: "Don't take blood pressure on an arm with an IV, a dialysis access, an injury, or on the side of a mastectomy. Record the exact number right away.",
      src: "Standard nurse assistant texts; American Heart Association blood pressure categories" },
    io: { title: "Intake and output", intro: "Record fluids in milliliters (mL) so intake and output can be compared.",
      body: T(["Item", "Equals"], [["1 fluid ounce", "30 mL"], ["8 oz cup or carton", "240 mL"], ["4 oz (half cup)", "120 mL"], ["1 liter", "1,000 mL"]]) +
        T(["Counts as intake", "Does not count"], [["Water, juice, milk, coffee, broth, soup", "Mashed potatoes, applesauce"], ["Gelatin, ice cream, sherbet, ice chips", "Cooked cereal such as oatmeal"]]),
      note: "Measure output in a graduate on a flat surface at eye level. Output includes urine, vomit, and drainage.",
      src: "Standard nurse assistant texts; check facility policy for items such as ice chips" },
    positions: { title: "Body positions", intro: "Change position at least every 2 hours (or as the care plan says) and keep the body aligned.",
      body: T(["Position", "What it is", "Often used for"], [
        ["Fowler's", "Head of bed raised about 45–60°", "Easier breathing, talking, eating in bed"],
        ["High Fowler's", "Head of bed raised 60–90°", "Meals and swallowing problems"],
        ["Semi-Fowler's", "Head of bed raised about 30–45°", "Comfort, tube feedings"],
        ["Supine", "Flat on the back", "Some procedures; protect heels and sacrum"],
        ["Lateral", "On the side, pillows at back and between knees", "Pressure relief"],
        ["Sims'", "Left side, upper knee drawn up", "Enemas, rectal care"],
        ["Prone", "On the stomach", "Only if ordered"]]),
      src: "Standard nurse assistant texts" },
    isolation: { title: "Isolation precautions", intro: "Standard precautions are used for every resident. Transmission-based precautions are added for known or suspected infections.",
      body: T(["Type", "Spread by", "Examples", "Wear"], [
        ["Contact", "Touch: skin, surfaces, equipment", "MRSA wounds, C. diff, scabies", "Gown and gloves; dedicated equipment"],
        ["Droplet", "Large droplets within about 6 feet", "Influenza, pertussis", "Mask on entering the room"],
        ["Airborne", "Tiny particles that stay in the air", "Tuberculosis, measles, chickenpox", "Fit-tested N95; negative-pressure room, door closed"]]),
      note: "C. diff spores are not killed by alcohol hand rub: wash with soap and water.",
      src: "CDC/HICPAC Guideline for Isolation Precautions (2007, updated)" },
    ppe: { title: "Putting on and taking off PPE", intro: "One common sequence. Follow your facility's training.",
      body: T(["Putting on", "Taking off"], [["1. Hand hygiene", "1. Gloves (most contaminated)"], ["2. Gown", "2. Goggles or face shield"], ["3. Mask or respirator", "3. Gown: touch the inside only, roll it away"], ["4. Goggles or face shield", "4. Mask or respirator"], ["5. Gloves, over the gown cuffs", "5. Hand hygiene"]]),
      note: "Gloves and gown can also come off together, rolled inside out. Perform hand hygiene any time hands get contaminated.",
      src: "CDC, Sequence for Putting On and Removing PPE" },
    fire: { title: "Fire safety: RACE and PASS", intro: "What to do if you find a fire, and how to use an extinguisher.",
      body: T(["RACE", ""], [["R — Rescue", "Move anyone in immediate danger"], ["A — Alarm", "Pull the alarm and report"], ["C — Contain", "Close doors and windows"], ["E — Extinguish or evacuate", "Only if it's small and safe"]]) +
        T(["PASS", ""], [["P — Pull", "Pull the pin"], ["A — Aim", "Aim at the base of the fire"], ["S — Squeeze", "Squeeze the handle"], ["S — Sweep", "Sweep side to side"]]),
      note: "Oxygen makes fires start more easily and burn faster: no smoking, candles, or open flames near it.",
      src: "Standard facility fire-safety training" },
    pressure: { title: "Pressure injuries", intro: "Damage to skin and tissue from pressure, usually over a bony area.",
      body: T(["Stage", "What you may see"], [["1", "Intact skin with redness that does not fade when pressed (in darker skin: purple, bluish, or darker, warmer or firmer)"], ["2", "Shallow open area or blister; skin partly lost"], ["3", "Deeper wound into fat; no bone or muscle showing"], ["4", "Wound with bone, tendon or muscle showing"]]) +
        T(["Position", "Check these areas"], [["On the back", "Back of head, shoulder blades, elbows, sacrum, heels"], ["On the side", "Ear, shoulder, hip, knees, ankles"], ["Sitting", "Shoulder blades, sacrum, buttocks, back of knees, heels"]]),
      note: "Nurse aides report changes; the nurse stages the wound. Float heels with a pillow under the calves, keep skin clean and dry, and don't massage reddened areas.",
      src: "National Pressure Injury Advisory Panel staging (2016)" },
    rom: { title: "Range of motion words", intro: "Move each joint slowly and gently. Support above and below the joint, and stop if there is pain.",
      body: T(["Word", "Movement"], [["Flexion", "Bending a joint"], ["Extension", "Straightening a joint"], ["Abduction", "Moving away from the middle of the body"], ["Adduction", "Moving toward the middle of the body"], ["Rotation", "Turning a joint"], ["Dorsiflexion", "Bending the foot up toward the shin"], ["Plantar flexion", "Pointing the foot down"]]),
      note: "Passive ROM: the aide moves the joint. Active ROM: the resident moves it. Regular ROM helps prevent contractures.",
      src: "Standard nurse assistant texts" },
    diets: { title: "Common diets", intro: "Always check the diet order before serving food or drinks.",
      body: T(["Diet", "What it means"], [["NPO", "Nothing by mouth"], ["Clear liquid", "See-through liquids: water, apple juice, broth, plain gelatin, tea"], ["Full liquid", "Clear liquids plus milk, cream soups, pudding, ice cream"], ["Mechanical soft", "Chopped or ground food that is easy to chew"], ["Pureed", "Food blended smooth"], ["Thickened liquids", "Liquids thickened to an ordered consistency for swallowing problems"]]),
      note: "Report coughing or choking during meals. Residents with swallowing problems stay upright for at least 30 minutes after eating, or longer if the care plan says so.",
      src: "Standard nurse assistant texts; facility diet manual" },
    transfers: { title: "Transfers and walking", intro: "Safety steps for moving a resident.",
      body: T(["Step", "Why"], [["Lock bed and wheelchair brakes", "Keeps equipment from rolling"], ["Nonskid footwear on", "Prevents slipping"], ["Transfer belt over clothing, snug with flat fingers under it", "Firm, safe grip"], ["Wheelchair on the resident's strong side", "Resident pivots on the stronger leg"], ["Walk slightly behind, on the weak side", "Where a fall is most likely"]]),
      note: "If the resident starts to fall, don't try to stop it: hold the belt, bring the resident close, and ease them to the floor, protecting the head. Then call the nurse.",
      src: "NNAAP skills listing; standard nurse assistant texts" },
    documentation: { title: "Charting basics", intro: "The record is a legal document.",
      body: T(["Do", "Don't"], [["Chart after care is given", "Chart care in advance"], ["Record exact measurements right away", "Round numbers or write them on scrap paper"], ["Paper: one line through an error, then initial and date", "Erase, scribble, or use correction fluid"], ["Use facts you saw or measured, and the resident's own words", "Use labels like \"rude\" or guess a diagnosis"]]) +
        T(["12-hour", "24-hour"], [["12:00 midnight", "0000"], ["8:15 a.m.", "0815"], ["12:00 noon", "1200"], ["3:30 p.m.", "1530"], ["11:45 p.m.", "2345"]]),
      note: "After noon, add 12 to the hour.", src: "Standard nurse assistant texts" },
    abuse: { title: "Abuse and neglect", intro: "In California, nurse assistants are mandated reporters of elder and dependent adult abuse.",
      body: T(["Type", "Examples"], [["Physical", "Hitting, slapping, pinching, rough handling"], ["Verbal or psychological", "Threats, insults, yelling, humiliating"], ["Sexual", "Any unwanted sexual contact or comments"], ["Financial", "Taking or pressuring for money or belongings"], ["Neglect", "Not giving needed care, food, water, toileting, repositioning"], ["Involuntary seclusion", "Keeping a resident apart or confined against their will"]]),
      note: "Protect the resident, then report right away to the nurse in charge and follow facility policy and state reporting rules.",
      src: "42 CFR 483.12; California Welfare and Institutions Code 15630" },
    rights: { title: "Resident rights", intro: "Federal law (OBRA) and California law protect residents' rights in long-term care.",
      body: T(["Right", "What it looks like"], [["Dignity and privacy", "Knock, close curtains, cover the body, keep information private"], ["Make choices", "Daily schedule, clothes, food preferences, activities"], ["Refuse care", "Respect it, offer another time, report it to the nurse"], ["Personal possessions", "Keep and use own belongings, labeled"], ["Mail and communication", "Mail delivered unopened; private phone calls and visits"], ["Voice complaints", "Without fear of retaliation; the long-term care ombudsman can help"], ["Freedom from restraints", "Only with an order, and only as a last resort"]]),
      src: "42 CFR 483.10 (resident rights)" },
  });
})();
