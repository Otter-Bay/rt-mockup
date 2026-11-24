/* Ready-made memory helps for study sheets: a picture idea for each row of a card and a starter jingle. Owner: Ken + Claude.
   (Ken, Nov 23: "I'd like to give them strong examples for everything that could come up. Do it for them, but let them type in a
   different image description. Same with the jingle. Make one for them, but allow them to put in their own words.")
   The learner's own words always win (saved with their study page, js/recall.js). Pictures come first; the jingle is optional.
   Our own words. Tunes are public domain only. Lyrics: one line per row, in the order of the card's table rows; "refrain" lines
   come after. Every line is 7 beats, stressed on 1, 3, 5 and 7 (TWIN-kle TWIN-kle LIT-tle STAR), so it also fits the first line of
   Mary Had a Little Lamb, London Bridge and Yankee Doodle.
   Phase 1 (Nov 23): gaslaws and apgar. The other cards fall back to "draw your own" and blank lines until written. */
window.MEMORY_IDEAS = {
  gaslaws: {
    pictures: [
      "A thumb pushes a syringe plunger: the air is squeezed into half the space and a pressure needle swings up. Beside it, a chest opens like a bellows and air rushes in.",
      "A kettle on a heated humidifier: the gas inside puffs up like a balloon as the heat rises, while a lid weight keeps the pressure the same.",
      "A sealed steel O2 cylinder baking in the sun with a thermometer taped on. The tank can't grow, so its gauge needle climbs.",
      "A layer cake of gases: a thick nitrogen layer, an oxygen layer, and thin CO2 and water-vapor layers stacked up to the total pressure (about 760 mm Hg at sea level).",
      "A capped soda bottle with no bubbles; open it and the gas fizzes out. A hyperbaric chamber pushes extra oxygen into the blood the same way.",
      "A hand pinches a garden hose to half its width and a resistance meter jumps to 16×. A long, thick-syrup hose is slow too.",
      "Two soap bubbles on one straw: the small one empties into the big one because its pressure is higher. A surfactant spray keeps the small alveolus open.",
      "An airplane wing in a wind tunnel: air races over the curved top, the side pressure drops and the wing lifts. A fast jet in a nebulizer sucks medicine up a straw.",
      "An hourglass-shaped tube: oxygen jets through the narrow waist, the tube widens gently, and room air is pulled in through side windows, as in an air-entrainment mask.",
      "A small, light runner sprints past a big, heavy runner: lighter gases diffuse faster. CO2 wears 'solubility sneakers' and crosses the lung wall about 20 times faster than O2.",
    ],
    jingle: { tune: "twinkle", lines: [
      "Boyle says squeeze it, pressure's up",
      "Charles says heat it, volume grows",
      "Gay-Lussac: heat, pressure climbs",
      "Dalton adds each gas's share",
      "Henry: more push, more dissolves",
      "Narrow tube, resistance soars",
      "Tiny bubbles, pressure's high",
      "Speed up, side-wall pressure drops",
      "Widen gently, pull in air",
      "Graham: light gas runs ahead",
    ] },
  },
  apgar: {
    pictures: [
      "A baby in three outfits: all blue or pale (0), a pink body wearing blue mittens and booties (1), and pink from head to toe (2).",
      "A heart drummer: the drum is silent (0), a slow beat under 100 a minute (1), and a fast beat of 100 or more on a speedometer (2).",
      "A feather tickles the baby's foot (or a suction catheter in the nose): no reaction (0), a scrunched-up grimace (1), and a big cry, cough or sneeze (2).",
      "A floppy rag doll (0), a baby half curled up (1), and a baby kicking and punching like a little boxer (2).",
      "A tiny trumpet: silent with no breaths (0), a weak, slow, uneven toot (1), and a loud, strong cry (2).",
    ],
    jingle: { tune: "twinkle", lines: [
      "Color: blue, pink core, all pink",
      "Pulse: none, under, hundred up",
      "Grimace: none, a face, then cry",
      "Limp, some flexing, active kicks",
      "Breathing: none, slow, then strong cry",
    ], refrain: [
      "Seven up to ten is good",
      "Under seven? Score again",
    ] },
  },
};
