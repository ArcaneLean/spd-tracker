// ── Potion drop weights ✅ VERIFIED from Generator.java ───────────────────────
//
// SPD uses two alternating decks. Each deck is a weighted pool; when exhausted
// it resets to the other deck. The weights here are the average of both decks
// (defaultProbs + defaultProbs2) / 2, which equals defaultProbsTotal in source.
//
// Source: Generator.java (v3.3.8 · commit 7b8b845)
//   POTION.defaultProbs  = { 0, 3, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1 }
//   POTION.defaultProbs2 = { 0, 3, 2, 2, 1, 2, 1, 1, 1, 1, 1, 0 }
//
// weight: 0 means the type never appears from a random drop.
// Strength is included because a color could correspond to it before the source is known.
//
// Confirmed sources (all call Generator.random() — item is generated before container is chosen):
//   ✅ Floor heap        RegularLevel.java createItems()
//   ✅ Chest             RegularLevel.java createItems()
//   ✅ Locked chest      RegularLevel.java createItems()
//   ✅ Skeletal remains  RegularLevel.java createItems()
//   ✅ Mimic             RegularLevel.java createItems()
export const POTION_WEIGHTS = [
  { name: "Strength",      weight: 0   }, // never random — boss/quest reward only
  { name: "Healing",       weight: 3   }, // avg 3   = 20.00%
  { name: "Mind Vision",   weight: 2   }, // avg 2   = 13.33%
  { name: "Frost",         weight: 1.5 }, // avg 1.5 = 10.00%
  { name: "Liquid Flame",  weight: 1.5 }, // avg 1.5 = 10.00%
  { name: "Toxic Gas",     weight: 1.5 }, // avg 1.5 = 10.00%
  { name: "Haste",         weight: 1   }, // avg 1   =  6.67%
  { name: "Invisibility",  weight: 1   }, // avg 1   =  6.67%
  { name: "Levitation",    weight: 1   }, // avg 1   =  6.67%
  { name: "Paralytic Gas", weight: 1   }, // avg 1   =  6.67%
  { name: "Purity",        weight: 1   }, // avg 1   =  6.67%
  { name: "Experience",    weight: 0.5 }, // avg 0.5 =  3.33%
];

// ── Scroll drop weights ✅ VERIFIED from Generator.java ───────────────────────
//
// Same two-deck system as potions.
//
// Source: Generator.java (v3.3.8 · commit 7b8b845)
//   SCROLL.defaultProbs  = { 0, 3, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1 }
//   SCROLL.defaultProbs2 = { 0, 3, 2, 2, 1, 2, 1, 1, 1, 1, 1, 0 }
//
// weight: 0 means the type never appears from a random drop.
// Upgrade is included because a rune could correspond to it before the source is known.
//
// Confirmed sources (all call Generator.random() — item is generated before container is chosen):
//   ✅ Floor heap        RegularLevel.java createItems()
//   ✅ Chest             RegularLevel.java createItems()
//   ✅ Locked chest      RegularLevel.java createItems()
//   ✅ Skeletal remains  RegularLevel.java createItems()
//   ✅ Mimic             RegularLevel.java createItems()
export const SCROLL_WEIGHTS = [
  { name: "Upgrade",       weight: 0   }, // never random — quest reward only
  { name: "Identify",      weight: 3   }, // avg 3   = 20.00%
  { name: "Remove Curse",  weight: 2   }, // avg 2   = 13.33%
  { name: "Mirror Image",  weight: 1.5 }, // avg 1.5 = 10.00%
  { name: "Recharging",    weight: 1.5 }, // avg 1.5 = 10.00%
  { name: "Teleportation", weight: 1.5 }, // avg 1.5 = 10.00%
  { name: "Lullaby",       weight: 1   }, // avg 1   =  6.67%
  { name: "Magic Mapping", weight: 1   }, // avg 1   =  6.67%
  { name: "Rage",          weight: 1   }, // avg 1   =  6.67%
  { name: "Retribution",   weight: 1   }, // avg 1   =  6.67%
  { name: "Terror",        weight: 1   }, // avg 1   =  6.67%
  { name: "Transmutation", weight: 0.5 }, // avg 0.5 =  3.33%
];

// ── Gear upgrade level ✅ VERIFIED from Weapon.java, Armor.java, MissileWeapon.java ──
//
// All randomly generated gear uses the same upgrade level probabilities.
//
// Source: Weapon.java random(), Armor.java random(), MissileWeapon.java random()
//   Random.Int(4) == 0  → n++  (25% chance of at least +1)
//   Random.Int(5) == 0  → n++  (5% chance of +2, conditional on already being +1)
//
// Confirmed sources (all call .random() on the generated item):
//   ✅ Floor heap        RegularLevel.java createItems()
//   ✅ Chest             RegularLevel.java createItems()
//   ✅ Skeletal remains  RegularLevel.java createItems()
//   ✅ Mimic             RegularLevel.java createItems()
//   ✅ Armory room       ArmoryRoom.java — Generator.randomWeapon/randomArmor/randomMissile()
export const GEAR_UPGRADE_PROBS = [
  { level: "+0", probability: 0.75 }, // 75%
  { level: "+1", probability: 0.20 }, // 20%
  { level: "+2", probability: 0.05 }, //  5%
];

// ── Golden chest (gold key) upgrade level ✅ VERIFIED from RegularLevel.java ───
//
// Items are generated via Generator.random() (same as any drop), but a gate
// determines whether the item goes into a locked chest:
//
//   if (toDrop.isUpgradable() && Random.Int(4 - toDrop.level()) == 0)
//     → place in LOCKED_CHEST with a GoldenKey
//
// This biases golden chests toward higher-level gear (higher level = easier to pass).
// Gate probability by level: +0 → 1/4, +1 → 1/3, +2 → 1/2
//
// Posterior via Bayes (prior = GEAR_UPGRADE_PROBS):
//   joint:    +0: 0.75 × 1/4 = 0.18750
//             +1: 0.20 × 1/3 = 0.06667
//             +2: 0.05 × 1/2 = 0.02500   (total = 0.27917)
//   posterior: +0 ≈ 67.2%,  +1 ≈ 23.9%,  +2 ≈ 9.0%
//
// Effect (cursed/enchanted) is unaffected — the gate condition does not depend on effect.
export const GOLDEN_CHEST_UPGRADE_PROBS = [
  { level: "+0", probability: 0.1875  / 0.27917 }, // ≈ 67.2%
  { level: "+1", probability: 0.06667 / 0.27917 }, // ≈ 23.9%
  { level: "+2", probability: 0.02500 / 0.27917 }, // ≈  9.0%
];

// ── Weapon / missile enchantment ✅ VERIFIED from Weapon.java, MissileWeapon.java ──
//
// Source: Weapon.java random(), MissileWeapon.java random()
//   effectRoll < 0.3f * ParchmentScrap.curseChanceMultiplier()          → cursed
//   effectRoll >= 1f - (0.1f * ParchmentScrap.enchantChanceMultiplier()) → enchanted
//   otherwise → plain
//
// Cursed gear always has a curse enchantment, not just the cursed flag.
//
// ⚠️ ParchmentScrap trinket modifies both thresholds independently.
//    Base rates below assume no ParchmentScrap (both multipliers = 1.0).
//
// Confirmed sources:
//   ✅ Floor heap        RegularLevel.java createItems()
//   ✅ Chest             RegularLevel.java createItems()
//   ✅ Locked chest      RegularLevel.java createItems()
//   ✅ Skeletal remains  RegularLevel.java createItems()
//   ✅ Mimic             RegularLevel.java createItems()
//   ✅ Armory room       ArmoryRoom.java — Generator.randomWeapon/randomMissile()
export const WEAPON_EFFECT_PROBS = [
  { effect: "plain",     probability: 0.60 }, // 60%
  { effect: "cursed",    probability: 0.30 }, // 30%
  { effect: "enchanted", probability: 0.10 }, // 10%
];

// ── Flock Trap Room (TrapsRoom with FlockTrap) upgrade level ✅ VERIFIED from TrapsRoom.java ──
//
// Only appears in sewers (floors 1–4): levelTraps[Dungeon.depth/5 == 0] = {Gripping, Teleportation, Flock}
//
// This source applies ONLY to the specifically-generated gear path (33% of prize rolls).
// The player knows they're on this path because cursedKnown=true is shown on pickup.
// If cursed status is unknown on pickup, use "chest" source instead (findPrizeItem() path).
//
// Source: TrapsRoom.java prize()
//   Generator.randomWeapon/Armor((depth/5)+1) → .random() generates base upgrade level
//   Curse enchant/glyph removed if present: cursed=false, cursedKnown=true
//   Random.Int(3)==0 → prize.upgrade() (33% extra +1)
//
// Upgrade level — prior = GEAR_UPGRADE_PROBS, +1 applied 33% of the time:
//   P(+0) = 0.75 × 2/3 = 0.500
//   P(+1) = 0.75 × 1/3 + 0.20 × 2/3 = 23/60 ≈ 0.383
//   P(+2) = 0.20 × 1/3 + 0.05 × 2/3 = 1/10 = 0.100
//   P(+3) = 0.05 × 1/3 = 1/60 ≈ 0.017
//
// Effect — curse removed, probability redistributed to plain:
//   Weapon: plain=90%, enchanted=10%, cursed=0%  (derived from WEAPON_EFFECT_PROBS)
//   Armor:  plain=85%, inscribed=15%, cursed=0%  (derived from ARMOR_EFFECT_PROBS)
export const FLOCK_TRAP_UPGRADE_PROBS = [
  { level: "+0", probability: 0.75 * (2/3)                          }, // 50.0%
  { level: "+1", probability: 0.75 * (1/3) + 0.20 * (2/3)          }, // 38.3%
  { level: "+2", probability: 0.20 * (1/3) + 0.05 * (2/3)          }, // 10.0%
  { level: "+3", probability: 0.05 * (1/3)                          }, //  1.7%
];

// ── CryptRoom tombstone upgrade level ✅ VERIFIED from CryptRoom.java ─────────
//
// Source: CryptRoom.java prize()
//   1. Armor is generated via Generator.randomArmor((depth/5)+1) — one tier higher
//   2. If the armor was NOT already cursed: prize.upgrade() → free +1
//   3. Always: prize.cursed = prize.cursedKnown = true
//
// The free +1 is conditional on the armor's initial effect roll:
//   P(originally cursed)     = 0.30 → no upgrade
//   P(originally not cursed) = 0.70 → +1 applied
//
// Posterior upgrade level (prior = GEAR_UPGRADE_PROBS):
//   P(+0) = 0.30 × 0.75                = 0.225
//   P(+1) = 0.30 × 0.20 + 0.70 × 0.75 = 0.585
//   P(+2) = 0.30 × 0.05 + 0.70 × 0.20 = 0.155
//   P(+3) =               0.70 × 0.05  = 0.035
//
// Effect is always cursed (cursedKnown = true on pickup). Applies to armor only.
export const CRYPT_ROOM_UPGRADE_PROBS = [
  { level: "+0", probability: 0.225 },
  { level: "+1", probability: 0.585 },
  { level: "+2", probability: 0.155 },
  { level: "+3", probability: 0.035 },
];

// ── Armor glyph ✅ VERIFIED from Armor.java ───────────────────────────────────
//
// Source: Armor.java random()
//   effectRoll < 0.3f  * ParchmentScrap.curseChanceMultiplier()           → cursed
//   effectRoll >= 1f - (0.15f * ParchmentScrap.enchantChanceMultiplier()) → inscribed
//   otherwise → plain
//
// Cursed armor always has a curse glyph, not just the cursed flag.
// Armor has a 15% inscribed window vs 10% for weapons.
//
// ⚠️ ParchmentScrap trinket modifies both thresholds independently.
//    Base rates below assume no ParchmentScrap (both multipliers = 1.0).
//
// Confirmed sources:
//   ✅ Floor heap        RegularLevel.java createItems()
//   ✅ Chest             RegularLevel.java createItems()
//   ✅ Locked chest      RegularLevel.java createItems()
//   ✅ Skeletal remains  RegularLevel.java createItems()
//   ✅ Mimic             RegularLevel.java createItems()
//   ✅ Armory room       ArmoryRoom.java — Generator.randomArmor()
export const ARMOR_EFFECT_PROBS = [
  { effect: "plain",     probability: 0.55 }, // 55%
  { effect: "cursed",    probability: 0.30 }, // 30%
  { effect: "inscribed", probability: 0.15 }, // 15%
];
