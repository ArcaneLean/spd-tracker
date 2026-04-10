// ── Special rooms ✅ ALL VERIFIED from source files ───────────────────────────
//
// Source: spd-source/core/.../levels/rooms/special/ (v3.3.8 · commit 7b8b845)
//
// doorType values match Door.Type in source:
//   "locked"    — requires iron key (entrance().set(Door.Type.LOCKED))
//   "regular"   — standard door
//   "barricade" — barricade (burn to enter)
//   "crystal"   — crystal door (PitRoom only)
//   "empty"     — no door (SacrificeRoom)
//   "unlocked"  — always open, cannot be hidden (DemonSpawnerRoom)
//
// floorPotion: the potion added via level.addItemToSpawn() — spawns somewhere
//   else on the floor, not inside the room itself.

export const SPECIAL_ROOMS = [
  {
    id: "armory",
    label: "Armory Room",
    doorType: "locked",
    floorPotion: null,
    // ✅ VERIFIED: ArmoryRoom.java
    // Drops 2-3 items from: bomb, melee weapon, armor, missile weapon (max 1 each).
    // May also place a TrinketCatalyst if one is queued.
    note: "Drops 2-3 items: bomb / weapon / armor / missile (max 1 per category).",
  },
  {
    id: "crypt",
    label: "Crypt Room",
    doorType: "locked",
    floorPotion: null,
    // ✅ VERIFIED: CryptRoom.java
    // Contains tombs. Drops a tier+(depth/5)+1 armor as prize.
    note: "Drops one armor piece (tier scaled to depth+1).",
  },
  {
    id: "crystal_choice",
    label: "Crystal Choice Room",
    doorType: "locked",
    floorPotion: null,
    // ✅ VERIFIED: CrystalChoiceRoom.java
    // Two crystal chests — one visible reward (potion/scroll), one hidden.
    // Spawns both an iron key and a crystal key on the floor.
    note: "Two crystal chests (potion or scroll). Requires iron key + crystal key.",
  },
  {
    id: "crystal_path",
    label: "Crystal Path Room",
    doorType: "regular",
    floorPotion: null,
    // ✅ VERIFIED: CrystalPathRoom.java
    // Crystal chests along a trap-filled path. Spawns 3 crystal keys on the floor.
    // Final reward includes Scroll of Metamorphosis/Transmutation or
    // Potion of Divine Inspiration/Experience.
    note: "Crystal chests on trap path. Spawns 3 crystal keys. No iron key.",
  },
  {
    id: "crystal_vault",
    label: "Crystal Vault Room",
    doorType: "locked",
    floorPotion: null,
    // ✅ VERIFIED: CrystalVaultRoom.java
    // One crystal chest with a random item. Spawns iron key + crystal key.
    note: "One crystal chest. Requires iron key + crystal key.",
  },
  {
    id: "demon_spawner",
    label: "Demon Spawner Room",
    doorType: "unlocked",
    floorPotion: null,
    // ✅ VERIFIED: DemonSpawnerRoom.java
    // Contains a demon spawner mob. Door is always unlocked and cannot be hidden.
    note: "Contains a demon spawner. Always open.",
  },
  {
    id: "garden",
    label: "Garden Room",
    doorType: "locked",
    floorPotion: null,
    // ✅ VERIFIED: GardenRoom.java
    // Full of high grass and plants/seeds.
    note: "High grass room with plants and seeds.",
  },
  {
    id: "laboratory",
    label: "Laboratory Room",
    doorType: "locked",
    floorPotion: null,
    // ✅ VERIFIED: LaboratoryRoom.java
    // Contains an alchemy pot and a prize: random potion or runestone.
    // Source: Generator.random(Random.oneOf(POTION, STONE))
    note: "Alchemy pot + random potion or runestone.",
  },
  {
    id: "library",
    label: "Library Room",
    doorType: "locked",
    floorPotion: null,
    // ✅ VERIFIED: LibraryRoom.java
    // Bookcases. Prize scroll: 50% Identify, 50% Remove Curse — or random scroll.
    // Source: Random.Int(2)==0 ? Identify : RemoveCurse, else Generator.random(SCROLL)
    note: "Prize scroll: 50% Identify / 50% Remove Curse, or random scroll.",
  },
  {
    id: "magical_fire",
    label: "Eternal Fire Room",
    doorType: "regular",
    floorPotion: "Frost",
    // ✅ VERIFIED: MagicalFireRoom.java — level.addItemToSpawn(new PotionOfFrost())
    // Room has a firewall barrier; contains 3-4 random items behind it.
    // Frost potion spawns elsewhere on the floor.
    note: "Guarantees Frost potion on the floor. Contains items behind fire wall.",
  },
  {
    id: "magic_well",
    label: "Magic Well Room",
    doorType: "locked",
    floorPotion: null,
    // ✅ VERIFIED: MagicWellRoom.java
    // Contains a well of various effects.
    note: "Contains a magic well.",
  },
  {
    id: "pit",
    label: "Pit Room",
    doorType: "crystal",
    floorPotion: null,
    // ✅ VERIFIED: PitRoom.java
    // Accessible from above via a pit (chasm). Crystal door at entrance.
    // Drops a ring, artifact, or random items on a skeleton.
    note: "Entered via chasm. Drops ring / artifact / random items. Crystal door.",
  },
  {
    id: "pool",
    label: "Flooded Vault",
    doorType: "regular",
    floorPotion: "Invisibility",
    // ✅ VERIFIED: PoolRoom.java — level.addItemToSpawn(new PotionOfInvisibility())
    // Flooded room with a weapon/armor/missile prize on a pedestal.
    // Invisibility potion spawns elsewhere on the floor.
    note: "Guarantees Invisibility potion on the floor. Prize weapon/armor/missile on pedestal.",
  },
  {
    id: "runestone",
    label: "Runestone Room",
    doorType: "locked",
    floorPotion: null,
    // ✅ VERIFIED: RunestoneRoom.java
    // Contains a prize runestone on a pedestal.
    // Source: Generator.random(STONE)
    note: "Prize runestone on a pedestal.",
  },
  {
    id: "sacrifice",
    label: "Sacrifice Room",
    doorType: "empty",
    floorPotion: null,
    // ✅ VERIFIED: SacrificeRoom.java
    // Sacrifice altar with a weapon prize (tier scaled to depth+1).
    // No door — open archway.
    note: "Sacrifice altar. Drops one weapon (tier scaled to depth+1). No door.",
  },
  {
    id: "sentry",
    label: "Sentry Room",
    doorType: "regular",
    floorPotion: "Haste",
    // ✅ VERIFIED: SentryRoom.java — level.addItemToSpawn(new PotionOfHaste())
    // Sentries guard a prize weapon/armor/missile on a pedestal.
    // Haste potion spawns elsewhere on the floor.
    note: "Guarantees Haste potion on the floor. Prize weapon/armor/missile on pedestal.",
  },
  {
    id: "shop",
    label: "Shop",
    doorType: "regular",
    floorPotion: null,
    // ✅ VERIFIED: ShopRoom.java
    // Merchant with fixed and random inventory. See POTION_SOURCES / SCROLL_SOURCES
    // for shop loot details.
    note: "Merchant shop. See source definitions for inventory details.",
  },
  {
    id: "statue",
    label: "Statue Room",
    doorType: "locked",
    floorPotion: null,
    // ✅ VERIFIED: StatueRoom.java
    // Animated statue guardian protecting a weapon on a pedestal.
    note: "Animated statue guarding a weapon.",
  },
  {
    id: "storage",
    label: "Barricade Room",
    doorType: "barricade",
    floorPotion: "Liquid Flame",
    // ✅ VERIFIED: StorageRoom.java — level.addItemToSpawn(new PotionOfLiquidFlame())
    // Door is a barricade — must be burned to enter.
    // Liquid Flame potion spawns elsewhere on the floor.
    note: "Guarantees Liquid Flame potion on the floor. Barricade door (burn to enter).",
  },
  {
    id: "toxic_gas",
    label: "Toxic Gas Room",
    doorType: "regular",
    floorPotion: "Purity",
    // ✅ VERIFIED: ToxicGasRoom.java — level.addItemToSpawn(new PotionOfPurity())
    // Room filled with toxic gas and a skull on a pedestal.
    // Purity potion spawns elsewhere on the floor.
    note: "Guarantees Purity potion on the floor. Room filled with toxic gas.",
  },
  {
    id: "traps",
    label: "Trap Room",
    doorType: "regular",
    floorPotion: "Levitation",
    // ✅ VERIFIED: TrapsRoom.java — level.addItemToSpawn(new PotionOfLevitation())
    // Trap-filled room with a prize weapon/armor on a pedestal.
    // Levitation potion spawns elsewhere on the floor.
    note: "Guarantees Levitation potion on the floor. Prize weapon/armor on pedestal.",
  },
  {
    id: "treasury",
    label: "Treasury Room",
    doorType: "locked",
    floorPotion: null,
    // ✅ VERIFIED: TreasuryRoom.java
    // Drops 2-3 items: TrinketCatalyst (if queued) or Gold.
    // If items are on a heap (not chest): also scatters 6 small gold piles.
    note: "Drops 2-3 items: TrinketCatalyst or Gold. Statue in center.",
  },
  {
    id: "weak_floor",
    label: "Weak Floor Room",
    doorType: "regular",
    floorPotion: null,
    // ✅ VERIFIED: WeakFloorRoom.java
    // Contains a hidden well beneath a weak floor tile.
    note: "Hidden well under weak floor.",
  },
];

// Convenience: rooms that guarantee a specific potion spawns on the floor.
// These are used as soft evidence in probability calculations.
export const POTION_HINT_ROOMS = SPECIAL_ROOMS.filter(r => r.floorPotion !== null);
