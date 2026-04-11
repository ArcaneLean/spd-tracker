// ── Source definitions ✅ VERIFIED from source files (unless marked ⚠️) ────────
//
// Each source has:
//   type:       "potion" | "scroll"
//   label:      display name
//   floors:     [min, max] floor range it can appear on
//   method:     "weighted" | "flat" | "fixed" | "warlock" | "shop" | "other"
//   exclusions: for "flat" — names removed before calculating
//   fixed:      for "fixed" — always this specific item
//   guaranteed: for "shop" — names always present (hardcoded in ShopRoom.java)
//   note:       extra info shown to user
//
// Sources verified from:
//   Generator.java    — standard weight tables
//   Scorpio.java      — Random.oneOf, excludes Healing + Strength
//   Succubus.java     — Random.oneOf, excludes Identify + Upgrade
//   Warlock.java      — special 2-path logic (~1/3 Healing, rest weighted excl. Healing)
//   DM100.java        — no createLoot override, uses standard Generator.random
//   ShopRoom.java     — full item list hardcoded
//   RegularLevel.java — chest/skeleton use same Generator.random() as floor drop

export const POTION_SOURCES = [
  {
    id: "floor_drop",
    label: "Floor drop",
    floors: [1, 26],
    method: "weighted",
    // ✅ VERIFIED: Generator.java — standard two-deck weighted system
    note: "Standard weighted drop.",
  },
  {
    id: "shop",
    label: "Shop",
    floors: [6, 11, 16, 20],
    method: "shop",
    // ✅ VERIFIED: ShopRoom.java — PotionOfHealing hardcoded + 2 randomUsingDefaults(POTION)
    // + 0-2 more from 50/50 potion/scroll slots. randomUsingDefaults has NO exclusions.
    guaranteed: ["Healing"],
    note: "Always has Healing. Other potions are fully random (can be any potion incl. duplicates).",
  },
  {
    id: "chest",
    label: "Chest / Skeleton",
    floors: [1, 26],
    method: "weighted",
    // ✅ VERIFIED: RegularLevel.java createItems() — item is generated with Generator.random()
    // first, then the container type (heap/chest/skeleton/locked chest) is chosen afterwards.
    // All container types share the same loot table.
    note: "Standard weighted drop — same table as floor heap.",
  },
  {
    id: "study_room",
    label: "Study Room",
    floors: [1, 26],
    method: "weighted",
    // ✅ VERIFIED: StudyRoom.java (standard room)
    // Bookshelves + regular door + single Terrain.PEDESTAL in center.
    // 50% chance: findPrizeItem() (artifact/stone — not a potion).
    // 50% chance: Generator.random(Random.oneOf(POTION, SCROLL)) — standard weighted, no exclusions.
    // When it drops a potion it is always via Generator.random → identical weights to floor drop.
    note: "Standard weighted drop. Room may also drop a scroll or a prize item instead.",
  },
  {
    id: "crystal_choice",
    label: "Crystal Choice Room (2 crystal doors)",
    floors: [1, 26],
    method: "weighted",
    // ✅ VERIFIED: CrystalChoiceRoom.java
    // One of two rooms behind a crystal key door. The potions/scrolls room has
    // NormalIntRange(3,4) items (50% = 3, 50% = 4), each generated via
    // Generator.random(Random.oneOf(POTION, SCROLL)) — standard weighted pool, 50/50 type.
    // No exclusions; standard weights apply identically to both potions and scrolls.
    // CrystalChoiceRoom is in EQUIP_SPECIALS, shuffled with no floor restriction.
    note: "Standard weighted drop. Room has 3–4 items (50/50), each randomly a potion or scroll.",
  },
  {
    id: "crystal_path",
    label: "Crystal Path Room (6 crystal doors)",
    floors: [1, 26],
    method: "weighted",
    // ✅ VERIFIED: CrystalPathRoom.java
    // 3 potions + 3 scrolls total, sorted least-to-most rare across 3 door pairs.
    // One potion slot is 50% fixed PotionOfExperience (or exotic), rest standard weighted no dupes.
    // Prize rooms (last pair, marked autoExplored) only accessible after opening earlier doors.
    note: "Standard weighted. 3 potions + 3 scrolls sorted by rarity across 3 door pairs. One slot may be fixed Experience.",
  },
  {
    id: "laboratory",
    label: "Alchemy Lab (locked door — F3 or F4 each chapter)",
    floors: [3, 4, 8, 9, 13, 14, 18, 19, 23, 24],
    method: "weighted",
    // ✅ VERIFIED: LaboratoryRoom.java — regular special room, Door.Type.LOCKED (iron key).
    // prize() priority: TrinketCatalyst → PotionOfStrength (if owed) → Generator.random(50% POTION, 50% STONE).
    // The fallback potion uses Generator.random(POTION) — standard weighted, Strength impossible.
    // If the potion is Strength, it comes from the priority path, not the random generator.
    note: "Fallback potion is standard weighted. Room primarily drops Strength or TrinketCatalyst first.",
  },
  {
    id: "secret_lab",
    label: "Secret Alchemy Lab (hidden door)",
    floors: [1, 26],
    method: "lab",
    // ✅ VERIFIED: SecretLaboratoryRoom.java — secret room (hidden door), extends SecretRoom.
    // Custom potionChances HashMap, 2–3 potions dropped.
    // Strength excluded entirely. Experience heavily favored (6). Healing de-weighted (1).
    // Each drop can become an exotic variant based on ExoticCrystals trinket chance.
    weights: {
      "Healing":       1,
      "Mind Vision":   2,
      "Frost":         3,
      "Liquid Flame":  3,
      "Toxic Gas":     3,
      "Haste":         4,
      "Invisibility":  4,
      "Levitation":    4,
      "Paralytic Gas": 4,
      "Purity":        4,
      "Experience":    6,
    },
    note: "Custom weights — Strength impossible, Experience most likely (6/38 ≈ 16%), Healing least likely (1/38 ≈ 3%).",
  },
  {
    id: "swarm",
    label: "Swarm of Flies",
    floors: [3, 4, 6],
    method: "fixed",
    // ✅ VERIFIED: Swarm.java — loot = PotionOfHealing.class
    // lootChance = 1/(6*(generation+1)); ~1/6 for unsplit, halves with each split.
    // LimitedDrops.SWARM_HP counter caps total drops at 5 per run.
    fixed: "Healing",
    note: "Always Healing. ~1/6 drop chance (unsplit); decreases with each split. Max 5 drops per run.",
  },
  {
    id: "vampire_bat",
    label: "Vampire Bat",
    floors: [11, 14],
    method: "fixed",
    // ✅ VERIFIED: Bat.java — 1/6 drop chance per kill, max 7 Healing drops total per run
    fixed: "Healing",
    note: "Always Healing. Max 7 drops per run.",
  },
  {
    id: "fire_elemental",
    label: "Fire Elemental",
    floors: [16, 19],
    method: "fixed",
    // ✅ VERIFIED: Elemental.java
    fixed: "Liquid Flame",
    note: "Always Liquid Flame.",
  },
  {
    id: "warlock",
    label: "Dwarf Warlock",
    floors: [16, 19],
    method: "warlock",
    // ✅ VERIFIED: Warlock.java
    // ~1/3 chance tries to drop Healing (scales down over run via LimitedDrops counter)
    // Otherwise: randomUsingDefaults(POTION) excluding Healing
    // Note: Strength CAN appear in the non-Healing path (no exclusion for it)
    note: "~33% chance Healing (decreases over run). Otherwise standard weights excl. Healing.",
  },
  {
    id: "scorpio",
    label: "Scorpio",
    floors: [21, 24],
    method: "flat",
    // ✅ VERIFIED: Scorpio.java
    // Random.oneOf(POTION.classes) with do...while excluding Healing AND Strength
    exclusions: ["Healing", "Strength"],
    note: "Flat equal chance across all potions except Healing and Strength.",
  },
  {
    id: "demon_spawner",
    label: "Demon Spawner",
    floors: [21, 24],
    method: "fixed",
    // ✅ VERIFIED: DemonSpawner.java
    fixed: "Healing",
    note: "Always Healing.",
  },
  {
    id: "acidic_scorpio",
    label: "Acidic Scorpio (rare)",
    floors: [21, 24],
    method: "fixed",
    // ⚠️ WIKI ONLY: rare variant drop
    fixed: "Experience",
    note: "Always Experience.",
  },
  {
    id: "boss",
    label: "Boss drop",
    floors: [1, 26],
    method: "flat",
    // ⚠️ WIKI ONLY: exact boss drop tables not source-verified
    // Does NOT exclude Strength — unlike all random sources.
    exclusions: [],
    note: "⚠️ Boss/special drop. Strength is possible.",
  },
  {
    id: "other",
    label: "Other",
    floors: [1, 26],
    method: "other",
    note: "Unknown source — Strength is possible.",
  },
];

export const SCROLL_SOURCES = [
  {
    id: "floor_drop",
    label: "Floor drop",
    floors: [1, 26],
    method: "weighted",
    // ✅ VERIFIED: Generator.java — standard two-deck weighted system
    note: "Standard weighted drop.",
  },
  {
    id: "shop",
    label: "Shop",
    floors: [6, 11, 16, 20],
    method: "shop",
    // ✅ VERIFIED: ShopRoom.java
    // ScrollOfIdentify, ScrollOfRemoveCurse, ScrollOfMagicMapping hardcoded.
    // Plus 0-2 random scrolls from 50/50 potion/scroll slots (randomUsingDefaults, no exclusions).
    guaranteed: ["Identify", "Remove Curse", "Magic Mapping"],
    note: "Always has Identify, Remove Curse, Magic Mapping. May have additional random scrolls.",
  },
  // ── Internal library room sources (not shown in source picker) ─────────────
  // Generated synthetically by toEngineInput() when a library room is recorded.
  // fixedFraction = 1/n where n = number of unidentified scrolls in the library.
  // ✅ VERIFIED: LibraryRoom.java — first scroll always Identify or RemoveCurse (50/50).
  {
    id: "library_1of1",
    label: "Library (only unidentified scroll)",
    floors: [1, 26],
    method: "flat_include",
    inclusions: ["Identify", "Remove Curse"],
  },
  {
    id: "library_1of2",
    label: "Library (1 of 2 unidentified scrolls)",
    floors: [1, 26],
    method: "library_mixture",
    fixedFraction: 1 / 2,
    inclusions: ["Identify", "Remove Curse"],
  },
  {
    id: "library_1of3",
    label: "Library (1 of 3 unidentified scrolls)",
    floors: [1, 26],
    method: "library_mixture",
    fixedFraction: 1 / 3,
    inclusions: ["Identify", "Remove Curse"],
  },
  {
    id: "chest",
    label: "Chest / Skeleton",
    floors: [1, 26],
    method: "weighted",
    // ✅ VERIFIED: RegularLevel.java createItems() — same Generator.random() as floor drops.
    note: "Standard weighted drop — same table as floor heap.",
  },
  {
    id: "study_room",
    label: "Study Room",
    floors: [1, 26],
    method: "weighted",
    // ✅ VERIFIED: StudyRoom.java (standard room) — see POTION_SOURCES entry for full details.
    note: "Standard weighted drop. Room may also drop a potion or a prize item instead.",
  },
  {
    id: "crystal_choice",
    label: "Crystal Choice Room (2 crystal doors)",
    floors: [1, 26],
    method: "weighted",
    // ✅ VERIFIED: CrystalChoiceRoom.java — see POTION_SOURCES entry for full details.
    note: "Standard weighted drop. Room has 3–4 items (50/50), each randomly a potion or scroll.",
  },
  {
    id: "crystal_path",
    label: "Crystal Path Room (6 crystal doors)",
    floors: [1, 26],
    method: "weighted",
    // ✅ VERIFIED: CrystalPathRoom.java
    // 3 potions + 3 scrolls total, sorted least-to-most rare across 3 door pairs.
    // One potion slot is 50% fixed PotionOfExperience (or exotic), rest standard weighted no dupes.
    // Prize rooms (last pair) only accessible after opening earlier doors.
    note: "Standard weighted. 3 potions + 3 scrolls sorted by rarity across 3 door pairs. One slot may be fixed Experience.",
  },
  {
    id: "dm100",
    label: "DM-100",
    floors: [6, 9],
    method: "weighted",
    // ✅ VERIFIED: DM100.java — no createLoot() override, uses standard Generator.random(SCROLL).
    // Drop chance: 25% (lootChance = 0.25f in source)
    note: "Standard weighted. 25% drop chance.",
  },
  {
    id: "succubus",
    label: "Succubus",
    floors: [16, 24],
    method: "flat",
    // ✅ VERIFIED: Succubus.java
    // do { loot = Random.oneOf(SCROLL.classes) } while (loot == Identify || loot == Upgrade)
    // Drop chance: 33% (lootChance = 0.33f in source)
    exclusions: ["Identify", "Upgrade"],
    note: "Flat equal chance across all scrolls except Identify and Upgrade. 33% drop chance.",
  },
  {
    id: "spectral_necromancer",
    label: "Spectral Necromancer (rare)",
    floors: [6, 9],
    method: "fixed",
    // ⚠️ WIKI ONLY
    fixed: "Remove Curse",
    note: "Always Remove Curse.",
  },
  {
    id: "quest",
    label: "Quest / fixed reward",
    floors: [1, 26],
    method: "flat",
    // ⚠️ WIKI ONLY: exact quest reward tables not source-verified
    // Does NOT exclude Upgrade — unlike all random sources.
    exclusions: [],
    note: "⚠️ Quest/fixed reward. Upgrade is possible.",
  },
  {
    id: "other",
    label: "Other",
    floors: [1, 26],
    method: "other",
    note: "Unknown source — Upgrade is possible.",
  },
];
