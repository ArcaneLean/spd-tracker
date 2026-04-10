import { CLASS_START_IDS } from "./classStartIds.js";

// ── Type definitions ──────────────────────────────────────────────────────────

/**
 * @typedef {"Warrior"|"Mage"|"Huntress"|"Rogue"|"Duelist"|"Cleric"} HeroClass
 */

/**
 * @typedef {object} ParchmentScrapState
 * Only the upgrade level is stored — multipliers are always derived on demand
 * via deriveParchmentConfig(). Never store the multiplier values directly.
 * ✅ VERIFIED: ParchmentScrap.java (v3.3.8 · commit 7b8b845)
 *
 * @property {boolean}  equipped
 * @property {0|1|2|3} upgradeLevel
 */

/**
 * @typedef {object} GearPickup
 * One piece of gear recorded during the run.
 * @property {string}                                             id             - unique within run (e.g. Date.now().toString())
 * @property {"weapon"|"armor"|"missile"}                        category
 * @property {string}                                            sourceId       - e.g. "floor_drop", "chest"
 * @property {number}                                            floor
 * @property {"+0"|"+1"|"+2"|null}                               observedLevel  - null until player inspects
 * @property {"plain"|"cursed"|"enchanted"|"inscribed"|null}     observedEffect - null until known
 */

/**
 * @typedef {object} UsedItem
 * History log entry for a used potion or scroll.
 * If observedEffect reveals identity, the caller MUST also write to
 * RunState.identified — this array is an append-only audit log.
 * @property {string}            id             - colorId or runeId
 * @property {"potion"|"scroll"} itemType
 * @property {number}            floor
 * @property {string|null}       observedEffect - type name if revealed by use, else null
 */

/**
 * @typedef {object} StoneResult
 * History log for one Stone of Intuition use.
 *
 * Invariant — if correct is true, the caller MUST also write
 *   identified[id] = guessedName
 * The engine never reads stoneResults directly; it derives Denial entries
 * from wrong guesses only (see toEngineInput).
 *
 * @property {string}  id          - colorId or runeId
 * @property {string}  guessedName - the type name that was guessed
 * @property {boolean} correct     - true = confirmed identity; false = ruled out
 */

/**
 * @typedef {object} RunState
 * Complete state of a single SPD run. This is the serialised save file.
 *
 * @property {number}                version      - schema version; current: 1
 * @property {HeroClass|null}        heroClass    - null until selected; stored for display only
 *
 * @property {Record<string,string>} potionColors - colorId → display color ("p1" → "Crimson")
 * @property {Record<string,string>} scrollRunes  - runeId  → display rune  ("s1" → "YNGVI")
 *
 * @property {Record<string,string>} identified
 *   Single authoritative source of all hard-confirmed id → typeName mappings.
 *   Potions and scrolls share this map (IDs are disjoint: p1..p12 vs s1..s12).
 *   Written by: applyClassStartIds, explicit identification, use-with-effect,
 *   Stone of Intuition correct guess.
 *   NEVER reconstruct from the log arrays — always write here directly.
 *
 * @property {import('./identifyEngine.js').Observation[]} potionPickups
 *   Every potion pickup this run. Shape: { id, sourceId, floor }.
 *   Maps directly to EngineInput.potions.observations.
 *
 * @property {import('./identifyEngine.js').Observation[]} scrollPickups
 *   Every scroll pickup this run. Shape: { id, sourceId, floor }.
 *   Maps directly to EngineInput.scrolls.observations.
 *
 * @property {import('./identifyEngine.js').HintRoom[]} hintRooms
 *   Special rooms (with floorPotion != null) seen this run. Shape: { roomId, floor }.
 *   Only include rooms from POTION_HINT_ROOMS — others have no engine effect.
 *   Maps directly to EngineInput.hintRooms.
 *
 * @property {{ floor: number, scrollIds: string[] }[]} libraryRooms
 *   Library rooms seen this run. Each entry records the floor and which scroll
 *   rune IDs (1–3) were present in the room.
 *   The engine constraint: exactly one of scrollIds is Identify or Remove Curse.
 *   Processed by toEngineInput() into synthetic scroll observations.
 *
 * @property {GearPickup[]}        gearPickups    - all gear items recorded
 * @property {ParchmentScrapState} parchmentScrap - current trinket state
 * @property {UsedItem[]}          used           - append-only log of used items
 * @property {StoneResult[]}       stoneResults   - append-only log of Stone uses
 */

// ── Constants ─────────────────────────────────────────────────────────────────

const CURRENT_VERSION = 1;

const ALL_POTION_IDS = ["p1","p2","p3","p4","p5","p6","p7","p8","p9","p10","p11","p12"];
const ALL_SCROLL_IDS = ["s1","s2","s3","s4","s5","s6","s7","s8","s9","s10","s11","s12"];

// ── ParchmentScrap ────────────────────────────────────────────────────────────

/**
 * Compute ParchmentScrapConfig from the trinket's stored upgrade level.
 *
 * ✅ VERIFIED from ParchmentScrap.java (v3.3.8 · commit 7b8b845)
 *   enchantChanceMultiplier: 2 / 4 / 7 / 10  (levels 0-3)
 *   curseChanceMultiplier:   1.5 / 2 / 1 / 0 (levels 0-3)
 *
 * Note: at level 2, curse chance DROPS back to base (1×) while enchant soars.
 * At level 3, curse chance is 0 — all gear is either enchanted or plain.
 *
 * @param {0|1|2|3} upgradeLevel
 * @returns {import('./gearEngine.js').ParchmentScrapConfig}
 */
export function deriveParchmentConfig(upgradeLevel) {
  const enchantMultipliers = [2, 4, 7, 10];
  const curseMultipliers   = [1.5, 2, 1, 0];
  return {
    enchantMultiplier: enchantMultipliers[upgradeLevel] ?? 1,
    curseMultiplier:   curseMultipliers[upgradeLevel]   ?? 1,
  };
}

// ── Factory ───────────────────────────────────────────────────────────────────

/**
 * Create a fresh RunState for a new run.
 *
 * @param {HeroClass|null} [heroClass]
 * @returns {RunState}
 */
export function createNewRun(heroClass = null) {
  return {
    version:      CURRENT_VERSION,
    heroClass,
    potionColors: {},
    scrollRunes:  {},
    identified:   {},
    potionPickups: [],
    scrollPickups: [],
    hintRooms:      [],
    libraryRooms:   [],
    gearPickups:    [],
    parchmentScrap: { equipped: false, upgradeLevel: 0 },
    used:          [],
    stoneResults:  [],
  };
}

// ── Class start identifications ───────────────────────────────────────────────

/**
 * Merge a resolved class-start identification map into state.identified.
 *
 * The caller (UI) is responsible for asking the player which visual ID
 * corresponds to each pre-identified type, then passing the resolved map here.
 *
 * Example:
 *   applyClassStartIds(state, { "p3": "Healing", "s2": "Identify" })
 *
 * This function does NOT look up CLASS_START_IDS itself — that lookup happens
 * in the UI, which knows the heroClass and can present the correct prompt.
 * CLASS_START_IDS is imported here only so consumers can access it via this module.
 *
 * @param {RunState} state       - mutated in place
 * @param {Record<string,string>} resolvedMap - { id: typeName } from the player
 * @returns {RunState}
 */
export function applyClassStartIds(state, resolvedMap) {
  Object.assign(state.identified, resolvedMap);
  return state;
}

export { CLASS_START_IDS };

// ── Engine input helpers ──────────────────────────────────────────────────────

/**
 * Derive EngineConfig for the identify engine.
 * Does not depend on RunState — the ID sets are fixed constants.
 *
 * @returns {import('./identifyEngine.js').EngineConfig}
 */
export function toEngineConfig() {
  return {
    potionIds: ALL_POTION_IDS,
    scrollIds: ALL_SCROLL_IDS,
  };
}

/**
 * Derive EngineInput from RunState for the identify engine.
 * This is a pure structural projection — no logic, no data loss.
 *
 * @param {RunState} state
 * @returns {import('./identifyEngine.js').EngineInput}
 */
const FIXED_SCROLL_TYPES = new Set(["Identify", "Remove Curse"]);

export function toEngineInput(state) {
  const scrollIdentified = Object.fromEntries(
    Object.entries(state.identified).filter(([id]) => id.startsWith("s"))
  );

  // Start with real pickup observations, then append synthetic library constraints.
  const scrollObservations = [...state.scrollPickups];

  for (const lib of (state.libraryRooms ?? [])) {
    // If any scroll in this library is already confirmed as Identify or Remove Curse,
    // the "exactly one fixed" constraint is satisfied — no synthetic obs needed.
    if (lib.scrollIds.some(id => FIXED_SCROLL_TYPES.has(scrollIdentified[id]))) continue;

    // Scrolls whose type is still unknown
    const unidentified = lib.scrollIds.filter(id => !scrollIdentified[id]);
    if (unidentified.length === 0) continue;

    const n = unidentified.length;
    const sourceId = n === 1 ? "library_1of1" : n === 2 ? "library_1of2" : "library_1of3";
    for (const id of unidentified) {
      scrollObservations.push({ id, sourceId, floor: lib.floor });
    }
  }

  return {
    potions: {
      identified: Object.fromEntries(
        Object.entries(state.identified).filter(([id]) => id.startsWith("p"))
      ),
      observations: state.potionPickups,
      denials: state.stoneResults
        .filter(r => !r.correct && r.id.startsWith("p"))
        .map(({ id, guessedName }) => ({ id, guessedName })),
    },
    scrolls: {
      identified: scrollIdentified,
      observations: scrollObservations,
      denials: state.stoneResults
        .filter(r => !r.correct && r.id.startsWith("s"))
        .map(({ id, guessedName }) => ({ id, guessedName })),
    },
    hintRooms: state.hintRooms,
  };
}

/**
 * Derive GearInput for a single GearPickup entry.
 * ParchmentScrap multipliers are computed from the stored upgrade level.
 *
 * @param {GearPickup} gearPickup
 * @param {RunState} state
 * @returns {import('./gearEngine.js').GearInput}
 */
export function toGearInput(gearPickup, state) {
  const { category, sourceId } = gearPickup;
  const { parchmentScrap } = state;

  if (!parchmentScrap.equipped) {
    return { category, sourceId };
  }
  return {
    category,
    sourceId,
    parchmentScrap: deriveParchmentConfig(parchmentScrap.upgradeLevel),
  };
}

// ── Persistence ───────────────────────────────────────────────────────────────

/**
 * Serialise RunState to a JSON string for storage.
 *
 * @param {RunState} state
 * @returns {string}
 */
export function saveRunState(state) {
  return JSON.stringify(state);
}

/**
 * Parse and migrate a raw JSON string (from localStorage) into RunState.
 * Falls back to a fresh run if raw is null, unparseable, or unrecognised.
 *
 * @param {string|null} raw
 * @returns {RunState}
 */
export function loadRunState(raw) {
  if (!raw) return createNewRun();

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return createNewRun();
  }

  if (!data || typeof data !== "object") return createNewRun();

  // v1 — current schema
  if (data.version === CURRENT_VERSION) {
    return data;
  }

  // Unknown / future version — return fresh run rather than corrupting state
  return createNewRun();
}
