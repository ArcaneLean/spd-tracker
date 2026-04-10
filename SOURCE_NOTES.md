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

---

## Things to verify next

- [ ] All mob `createLoot()` methods in `mobs/` — are there any potion/scroll drops we're missing?
- [ ] Exact Warlock healing probability — is it really 1/3? Check `LimitedDrops` counter decay
- [ ] Boss drop tables (Goo, Tengu, DM-300, etc.) — do they give potions or scrolls?
- [x] Chest / skeleton loot — ✅ VERIFIED: same Generator.random() call as floor drops; container type is decided after item generation (RegularLevel.java createItems())
- [ ] Library room loot — `$SPD/levels/rooms/special/LibraryRoom.java`
- [ ] Exotic potions / scrolls — separate weight tables?
- [ ] Combat damage formula — Armor.java `drRoll()` and `MeleeWeapon.java` damage ranges per tier
