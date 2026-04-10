// ── Class start identifications ✅ VERIFIED from HeroClass.java ───────────────
//
// Source: HeroClass.java (v3.3.8 · commit 7b8b845)
//   initHero()       line 117 — new ScrollOfIdentify().identify() — ALL classes
//   initWarrior()    lines 186–187
//   initMage()       lines 200–201
//   initRogue()      lines 217–218
//   initHuntress()   lines 229–230
//   initDuelist()    lines 244–245
//   initCleric()     lines 259–260
//
// Each class pre-identifies certain potion and scroll types at run start.
// These are TYPE NAMES (matching POTION_WEIGHTS / SCROLL_WEIGHTS), NOT visual IDs.
//
// The player sees which color/rune is pre-identified in-game, but the app
// cannot know this automatically. The UI must prompt the player to bind each
// pre-identified type to its visual ID, then call:
//   applyClassStartIds(state, { "p3": "Healing", "s2": "Identify" })
//
// heroClass is stored on RunState for display/reference — CLASS_START_IDS is
// only consulted when constructing the initial identification prompt.

/**
 * @typedef {object} ClassStartIds
 * @property {string[]} potions - type names of potions pre-identified at run start
 * @property {string[]} scrolls - type names of scrolls pre-identified at run start
 */

/**
 * @type {Record<string, ClassStartIds>}
 * ✅ VERIFIED from HeroClass.java (v3.3.8 · commit 7b8b845)
 */
export const CLASS_START_IDS = {
  Warrior:  { potions: ["Healing"],      scrolls: ["Identify", "Rage"]         },
  Mage:     { potions: ["Liquid Flame"], scrolls: ["Identify", "Upgrade"]       },
  Rogue:    { potions: ["Invisibility"], scrolls: ["Identify", "Magic Mapping"] },
  Huntress: { potions: ["Mind Vision"],  scrolls: ["Identify", "Lullaby"]       },
  Duelist:  { potions: ["Strength"],     scrolls: ["Identify", "Mirror Image"]  },
  Cleric:   { potions: ["Purity"],       scrolls: ["Identify", "Remove Curse"]  },
};
