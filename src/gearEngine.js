import {
  GEAR_UPGRADE_PROBS,
  GOLDEN_CHEST_UPGRADE_PROBS,
  CRYPT_ROOM_UPGRADE_PROBS,
  FLOCK_TRAP_UPGRADE_PROBS,
  WEAPON_EFFECT_PROBS,
  ARMOR_EFFECT_PROBS,
} from "./floorDropWeights.js";

// ── Type definitions ──────────────────────────────────────────────────────────

/**
 * @typedef {"weapon"|"armor"|"missile"} GearCategory
 */

/**
 * @typedef {object} ParchmentScrapConfig
 * Multipliers applied by the ParchmentScrap trinket.
 * Both default to 1.0 (no trinket equipped).
 * @property {number} curseMultiplier  - scales the cursed threshold (0.3 × this)
 * @property {number} enchantMultiplier - scales the enchant/inscribe threshold
 */

/**
 * @typedef {object} GearInput
 * @property {GearCategory}          category      - item category
 * @property {string}                [sourceId]    - pickup source (affects upgrade level probs)
 * @property {ParchmentScrapConfig}  [parchmentScrap] - optional trinket config
 */

/**
 * @typedef {object} GearProbabilityEntry
 * @property {string} label       - display label (e.g. "+0", "plain", "enchanted")
 * @property {number} probability - 0..1
 */

/**
 * @typedef {object} GearOutput
 * @property {GearProbabilityEntry[]} upgradeLevel - +0 / +1 / +2 distribution
 * @property {GearProbabilityEntry[]} effect       - plain / cursed / enchanted|inscribed distribution
 */

// ── Effect threshold constants (from Weapon.java, Armor.java) ─────────────────
// ✅ VERIFIED: Weapon.java random(), MissileWeapon.java random(), Armor.java random()
//
//   Weapon/missile: effectRoll < 0.3 * curseMultiplier          → cursed
//                   effectRoll >= 1 - (0.1 * enchantMultiplier)  → enchanted
//   Armor:          effectRoll < 0.3 * curseMultiplier            → cursed
//                   effectRoll >= 1 - (0.15 * enchantMultiplier) → inscribed
//
// ParchmentScrap multiplier table (ParchmentScrap.java):
//   level  enchantChanceMultiplier  curseChanceMultiplier
//   none   1                        1
//   0      2                        1.5
//   1      4                        2
//   2      7                        1
//   3      10                       0

const CURSED_BASE            = 0.3;   // base cursed window
const WEAPON_ENCHANT_WINDOW  = 0.1;   // base enchanted window (10%)
const ARMOR_INSCRIBE_WINDOW  = 0.15;  // base inscribed window (15%)

// ── Effect probability calculator ─────────────────────────────────────────────

/**
 * Compute effect probabilities (plain/cursed/enchanted or plain/cursed/inscribed)
 * for a given category and ParchmentScrap multipliers.
 *
 * The game checks cursed FIRST, then enchanted — so when the thresholds overlap
 * (cursedThreshold >= enchantThreshold) the overlapping region is entirely cursed.
 *
 * @param {GearCategory} category
 * @param {ParchmentScrapConfig} scrap
 * @returns {GearProbabilityEntry[]}
 */
function computeEffectProbs(category, scrap) {
  const isArmor = category === "armor";
  const window  = isArmor ? ARMOR_INSCRIBE_WINDOW : WEAPON_ENCHANT_WINDOW;

  // effectRoll < cursedThreshold → cursed
  const cursedThreshold = Math.min(CURSED_BASE * scrap.curseMultiplier, 1);

  // effectRoll >= enchantThreshold → enchanted/inscribed
  // Clamped to [0, 1]; can go negative at high multipliers (everything enchanted)
  const enchantThreshold = Math.max(1 - (window * scrap.enchantMultiplier), 0);

  // When cursedThreshold > enchantThreshold, cursed is checked first so the
  // overlapping range [enchantThreshold, cursedThreshold) is still cursed.
  const effectiveEnchant = Math.max(enchantThreshold, cursedThreshold);

  const cursedProb = cursedThreshold;
  const effectProb = Math.max(1 - effectiveEnchant, 0);
  const plainProb  = Math.max(effectiveEnchant - cursedThreshold, 0);

  const effectLabel = isArmor ? "inscribed" : "enchanted";

  return [
    { label: "plain",      probability: plainProb  },
    { label: "cursed",     probability: cursedProb },
    { label: effectLabel,  probability: effectProb },
  ].filter(e => e.probability > 0);
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Compute probability distributions for a randomly generated piece of gear.
 *
 * Upgrade level probabilities are the same for all categories and are not
 * affected by ParchmentScrap (only the effect roll is modified).
 *
 * @param {GearInput} input
 * @returns {GearOutput}
 */
export function computeGearProbabilities(input) {
  const { category, sourceId, parchmentScrap } = input;

  // Artifacts: always +0, flat 30% cursed chance from Artifact.random().
  // ✅ VERIFIED: Artifact.java random() — Random.Float() < 0.3f → cursed
  // No source or ParchmentScrap modifier applies.
  if (category === "artifact") {
    return {
      upgradeLevel: [],
      effect: [
        { label: "not cursed", probability: 0.7 },
        { label: "cursed",     probability: 0.3 },
      ],
    };
  }

  const scrap = {
    curseMultiplier:  parchmentScrap?.curseMultiplier  ?? 1.0,
    enchantMultiplier: parchmentScrap?.enchantMultiplier ?? 1.0,
  };

  const upgradeProbTable =
    sourceId === "golden_chest"                              ? GOLDEN_CHEST_UPGRADE_PROBS :
    sourceId === "tombstone"                                 ? CRYPT_ROOM_UPGRADE_PROBS   :
    (sourceId === "flock_trap" || sourceId === "sentry_room") ? FLOCK_TRAP_UPGRADE_PROBS   :
    GEAR_UPGRADE_PROBS;

  const upgradeLevel = upgradeProbTable.map(e => ({
    label: e.level,
    probability: e.probability,
  }));

  // Source-specific effect overrides.
  let effect;
  if (sourceId === "tombstone") {
    // CryptRoom: always cursed — ParchmentScrap irrelevant.
    effect = [{ label: "cursed", probability: 1.0 }];
  } else if (sourceId === "flock_trap" || sourceId === "sentry_room") {
    // Flock Trap Room / Sentry Room: curse explicitly removed, cursed=false, cursedKnown=true.
    // ✅ VERIFIED: SentryRoom.java — hasCurseGlyph() → inscribe(null); cursed=false; cursedKnown=true
    // Redistribute cursed probability to plain; enchanted/inscribed unchanged.
    // ParchmentScrap irrelevant for this source (curse removal overrides it).
    const baseTable = category === "armor" ? ARMOR_EFFECT_PROBS : WEAPON_EFFECT_PROBS;
    const cursedProb = baseTable.find(e => e.effect === "cursed")?.probability ?? 0;
    effect = baseTable
      .filter(e => e.effect !== "cursed")
      .map(e => ({
        label: e.effect,
        probability: e.effect === "plain" ? e.probability + cursedProb : e.probability,
      }));
  } else {
    // For base probabilities (no ParchmentScrap), use the pre-verified table
    // values directly rather than re-deriving from thresholds, to avoid
    // floating-point drift. Only recompute when a trinket is actually active.
    const isUnmodified = scrap.curseMultiplier === 1.0 && scrap.enchantMultiplier === 1.0;
    if (isUnmodified) {
      const baseTable = category === "armor" ? ARMOR_EFFECT_PROBS : WEAPON_EFFECT_PROBS;
      effect = baseTable.map(e => ({ label: e.effect, probability: e.probability }));
    } else {
      effect = computeEffectProbs(category, scrap);
    }
  }

  return { upgradeLevel, effect };
}
