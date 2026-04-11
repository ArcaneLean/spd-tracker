# SPD Source Notes

**Source:** `spd-source/` — shallow clone of [00-Evan/shattered-pixel-dungeon](https://github.com/00-Evan/shattered-pixel-dungeon)  
**Version:** v3.3.8 · commit `7b8b845` · 2026-03-19  
**Root path:** `spd-source/core/src/main/java/com/shatteredpixel/shatteredpixeldungeon/`

Abbreviate that root as `$SPD` below.

---

## Key paths

| Area | Path |
|------|------|
| Generator (drop weights) | `$SPD/items/Generator.java` |
| Potions | `$SPD/items/potions/` |
| Scrolls | `$SPD/items/scrolls/` |
| Mobs | `$SPD/actors/mobs/` |
| Level rooms | `$SPD/levels/rooms/` |
| Special rooms | `$SPD/levels/rooms/special/` |
| Shop room | `$SPD/levels/rooms/special/ShopRoom.java` |
| Hero stats | `$SPD/actors/hero/Hero.java` |
| Armor base | `$SPD/items/armor/Armor.java` |
| Weapons base | `$SPD/items/weapon/melee/MeleeWeapon.java` |

---

## Drop weight tables — Generator.java

> **Status: verified in App.jsx** (as of Mar 2026)

```
POTION.defaultProbs  = { 0, 3, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1 }
POTION.defaultProbs2 = { 0, 3, 2, 2, 1, 2, 1, 1, 1, 1, 1, 0 }
Order: Strength, Healing, MindVision, Frost, LiquidFlame, ToxicGas,
       Haste, Invisibility, Levitation, ParalyticGas, Purity, Experience

SCROLL.defaultProbs  = { 0, 3, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1 }
SCROLL.defaultProbs2 = { 0, 3, 2, 2, 1, 2, 1, 1, 1, 1, 1, 0 }
Order: Upgrade, Identify, RemoveCurse, MirrorImage, Recharging, Teleportation,
       Lullaby, MagicMapping, Rage, Retribution, Terror, Transmutation
```

Average weights used in the app (deck1 + deck2) / 2 — see `POTION_WEIGHTS` / `SCROLL_WEIGHTS` in `App.jsx`.

---

## Enemy drop sources — verified

| Enemy | File | Drop | Method | Notes |
|-------|------|------|--------|-------|
| Swarm of Flies | `mobs/Swarm.java` | Healing | fixed | ~1/6 chance (unsplit); halves each split generation. Max 5 drops/run (`LimitedDrops.SWARM_HP`). F3, F4, F6. |
| Vampire Bat | `mobs/Bat.java` | Healing | fixed | 1/6 chance, max 7/run |
| Fire Elemental | `mobs/Elemental.java` | Liquid Flame | fixed | |
| Dwarf Warlock | `mobs/DwarfWarlock.java` | Healing or random | warlock | ~1/3 Healing; rest = weighted excl. Healing |
| Scorpio | `mobs/Scorpio.java` | Random potion | flat | `do…while` excl. Healing + Strength |
| Demon Spawner | `mobs/DemonSpawner.java` | Healing | fixed | |
| Acidic Scorpio | `mobs/Scorpio.java` (variant) | Experience | fixed | rare variant |
| DM-100 | `mobs/DM100.java` | Random scroll | weighted | no override; 25% drop chance |
| Succubus | `mobs/Succubus.java` | Random scroll | flat | excl. Identify + Upgrade; 33% drop |
| Spectral Necromancer | `mobs/SpectralNecromancer.java` | Remove Curse | fixed | rare variant |

## Enemy drop sources — NOT YET VERIFIED

These enemies exist in `mobs/` but their `createLoot()` has not been checked:

- [ ] `Gnoll.java` / `GnollBrute.java` / `GnollGuard.java` — Prison region (F6–10)
- [ ] `GnollShaman.java` — Prison region
- [ ] `GnollGeomancer.java` — Prison region (rare)
- [ ] `Skeleton.java` — Sewers/Prison
- [ ] `Thief.java` / `Bandit.java` — Prison (steal items)
- [ ] `Guard.java` — Prison
- [ ] `Elemental.java` (other variants: frost, shock, chaos) — do they drop scrolls?
- [ ] `ChaosElemental.java`
- [ ] `DM300.java` (boss) — drop table
- [ ] `Tengu.java` (boss)
- [ ] `GooWarden.java` (boss)
- [ ] `YogDzewa.java` (final boss)
- [ ] `Wraith.java`
- [ ] `Monk.java` / `Warlock.java` (City F16–19) — Monk drop?
- [ ] `Golem.java` — City
- [ ] `Ripper.java` / `Spawner.java` — Halls

---

## Special rooms — verified

| Room | File | Guarantees |
|------|------|-----------|
| TrapsRoom | `rooms/special/TrapsRoom.java` | Levitation spawned elsewhere on floor |
| StorageRoom (Barricade) | `rooms/special/StorageRoom.java` | Liquid Flame spawned elsewhere |
| PoolRoom (Flooded Vault) | `rooms/special/PoolRoom.java` | Invisibility spawned elsewhere |
| SentryRoom | `rooms/special/SentryRoom.java` | Haste spawned elsewhere |
| ToxicGasRoom | `rooms/special/ToxicGasRoom.java` | Purity spawned elsewhere |
| MagicalFireRoom (Eternal Fire) | `rooms/special/MagicalFireRoom.java` | Frost spawned elsewhere |
| LibraryRoom (special) | `rooms/special/LibraryRoom.java` | Scrolls only (Identify / Remove Curse guaranteed as first item; extras from scroll/trinket pool). No potions. |
| LaboratoryRoom | `rooms/special/LaboratoryRoom.java` | ✅ VERIFIED. Regular special room, `Door.Type.LOCKED` (iron key). Spawns once per chapter on F3 (50%) or F4 (guaranteed). `prize()` priority: (1) TrinketCatalyst if pending, (2) PotionOfStrength if owed, (3) `Generator.random(oneOf(POTION, STONE))` — standard weighted, Strength impossible on this path. Source ID: `laboratory`. |
| SecretLaboratoryRoom | `rooms/secret/SecretLaboratoryRoom.java` | ✅ VERIFIED. Secret room (hidden door, extends SecretRoom). Drops 2–3 potions from custom weight table. Strength excluded entirely. Also drops 2×3–5 energy crystals. Each potion can become exotic via ExoticCrystals trinket. Source ID: `secret_lab`. **Custom weights:** Healing 1, Mind Vision 2, Frost/Liquid Flame/Toxic Gas 3 each, Haste/Invisibility/Levitation/Paralytic Gas/Purity 4 each, Experience 6. Total 38. |
| CrystalChoiceRoom | `rooms/special/CrystalChoiceRoom.java` | ✅ VERIFIED. 2 crystal doors. One sub-room: 3–4 potions/scrolls (standard weighted, 50/50 type each item). Other sub-room: chest with wand/ring/artifact. Entrance: locked (iron key) + 1 crystal key spawned. Source ID: `crystal_choice`. |
| CrystalPathRoom | `rooms/special/CrystalPathRoom.java` | ✅ VERIFIED. 6 crystal doors in 3 pairs along a corridor. 3 potions + 3 scrolls, sorted least-to-most rare, one per room. First 4 rooms visible from path; last 2 (prize rooms, `autoExplored=true`) require opening earlier doors first. One slot: 50% fixed Experience/Transmutation (or exotic). Rest: standard weighted, no dupes. Uses 3 crystal keys. Source ID: `crystal_path`. |
| CrystalVaultRoom | `rooms/special/CrystalVaultRoom.java` | ✅ VERIFIED. 2 crystal chests with wand/ring/artifact (no potions/scrolls). Entrance: locked (iron key) + 1 crystal key spawned. Source ID: `crystal_vault` (gear only). |

## Standard rooms — verified

| Room | File | Drop |
|------|------|------|
| StudyRoom | `rooms/standard/StudyRoom.java` | Bookshelves + regular door + single `Terrain.PEDESTAL` in center. 50%: `findPrizeItem()` (artifact/stone). 50%: `Generator.random(oneOf(POTION, SCROLL))` — standard weighted, no exclusions. |

## Special rooms — gear chest details

| Room | File | Gear source ID | Notes |
|------|------|---------------|-------|
| TrapsRoom (any trap type) | `rooms/special/TrapsRoom.java` | `flock_trap` | ✅ VERIFIED. Trap type varies by floor set (sewers=Flock/Grip/Teleport, prison=Poison/Grip/Explosive, etc.) but prize logic is **identical across all variants**. Chest always present (33% on pedestal, 67% on floor tile — both `Heap.Type.CHEST`). Prize: 67% `findPrizeItem()` (artifact/trinket/stone); if null or 33% chance: 50/50 weapon or armor (no missiles), one tier above normal, curse removed (`cursed=false; cursedKnown=true`), 33% extra `upgrade()`. **Not a normal chest drop.** Side effect: always spawns a PotionOfLevitation elsewhere on the floor. |
| SentryRoom | `rooms/special/SentryRoom.java` | `sentry_room` | Chest (`Heap.Type.CHEST`). 50% `findPrizeItem()` (artifact/trinket — use `chest` source if cursed status unknown). 50%: `randomWeapon/Armor/Missile((depth/5)+1)`. Curse removed (`hasCurseGlyph/hasCurseEnchant` → `inscribe/enchant(null)`); `cursed=false; cursedKnown=true`. 33% extra `upgrade()`. Upgrade and effect probs **identical to flock_trap** — uses `FLOCK_TRAP_UPGRADE_PROBS`. |
| SacrificeRoom | `rooms/special/SacrificeRoom.java` | `sacrifice_room` | ✅ VERIFIED. Weapon only — `Generator.randomWeapon((depth/5)+1)` (one tier above normal). Always: `prize.cursed = prize.cursedKnown = true`. If not originally cursed: `prize.upgrade()` + `prize.enchant(curse)` (unless already has a good enchant). Gold fallback if Challenges blocks item. |

---

## Potion of Strength guaranteed floor mechanic — ✅ VERIFIED

**Sources:** `Dungeon.java posNeeded()`, `Level.java create()`

Identical pattern to the SOU mechanic. Weight 0 in `Generator.java`; placed via `addItemToSpawn()`.

```java
public static boolean posNeeded() {
    int posLeftThisSet = 2 - (LimitedDrops.STRENGTH_POTIONS.count - (depth / 5) * 2);
    if (posLeftThisSet <= 0) return false;
    int floorThisSet = (depth % 5);
    //pos drops every two floors, (1-2, and 3-4) with 50% chance for the earlier one each time
    int targetPOSLeft = 2 - floorThisSet/2;
    if (floorThisSet % 2 == 1 && Random.Int(2) == 0) targetPOSLeft--;
    return targetPOSLeft < posLeftThisSet;
}
```

- **2 POSs guaranteed per floor set**, **10 total** per 25-floor run (fewer than SOUs: 3/set → 15)
- Spread across floor pairs (1–2, 3–4 of each set) with 50% chance for the earlier floor in each pair
- Lands as regular floor `HEAP` — indistinguishable from random potions
- `POTION_WEIGHTS["Strength"]` set to 1.0 as conservative approximation

---

## Scroll of Upgrade guaranteed floor mechanic — ✅ VERIFIED

**Sources:** `Dungeon.java souNeeded()`, `Level.java create()`

The SOU is weight 0 in `Generator.java` — it never comes from the random drop system. Instead, a separate guaranteed mechanism runs on every non-boss floor:

```java
// Dungeon.java
public static boolean souNeeded() {
    int souLeftThisSet = 3 - (LimitedDrops.UPGRADE_SCROLLS.count - (depth / 5) * 3);
    if (souLeftThisSet <= 0) return false;
    int floorThisSet = (depth % 5);
    return Random.Int(5 - floorThisSet) < souLeftThisSet;
}
```

- **3 SOUs guaranteed per floor set** (floors 1–4, 6–9, 11–14, 16–19, 21–24)
- **Boss floors** (5, 10, 15, 20, 25) are skipped — `souNeeded()` is not called there
- **15 total guaranteed SOUs** in a standard 25-floor run
- The probability of a given floor getting the SOU rises toward the end of the set, reaching 100% on the last floor if any are still owed
- The SOU lands as a regular floor `HEAP` — visually identical to any random scroll

**Model implication:** `SCROLL_WEIGHTS["Upgrade"]` is set to 1.5 as a conservative approximation. The true per-scroll probability is floor-and-progress-dependent and cannot be expressed as a fixed weight.

---

## Things to verify next

- [ ] All mob `createLoot()` methods in `mobs/` — are there any potion/scroll drops we're missing?
- [ ] Exact Warlock healing probability — is it really 1/3? Check `LimitedDrops` counter decay
- [ ] Boss drop tables (Goo, Tengu, DM-300, etc.) — do they give potions or scrolls?
- [x] Chest / skeleton loot — ✅ VERIFIED: same Generator.random() call as floor drops; container type is decided after item generation (RegularLevel.java createItems())
- [x] Library room loot — `$SPD/levels/rooms/special/LibraryRoom.java` — scrolls only; see Special rooms table above
- [ ] Exotic potions / scrolls — separate weight tables?
- [ ] Combat damage formula — Armor.java `drRoll()` and `MeleeWeapon.java` damage ranges per tier
