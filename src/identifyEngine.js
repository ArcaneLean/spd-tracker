import { POTION_WEIGHTS, SCROLL_WEIGHTS } from "./floorDropWeights.js";
import { POTION_SOURCES, SCROLL_SOURCES } from "./sources.js";
import { SPECIAL_ROOMS } from "./specialRooms.js";

// ── Constants ─────────────────────────────────────────────────────────────────

const ROOM_HINT_BOOST  = 6;   // multiplier applied to a type when a hint room is seen on that floor
const SOLVER_ITERATIONS = 30; // Sinkhorn iterations — converges well before this

// ── Type definitions ──────────────────────────────────────────────────────────

/**
 * @typedef {object} Observation
 * One pickup of an unidentified potion or scroll.
 * The same id can appear multiple times (each pickup compounds the evidence).
 * @property {string} id       - colorId ("p3") or runeId ("s7")
 * @property {string} sourceId - matches an id in POTION_SOURCES / SCROLL_SOURCES
 * @property {number} floor    - floor number 1–26
 */

/**
 * @typedef {object} HintRoom
 * A special room observed on a floor. Any room with a non-null floorPotion
 * provides soft evidence that potion is present on that floor.
 * @property {string} roomId - matches an id in SPECIAL_ROOMS
 * @property {number} floor  - floor number 1–26
 */

/**
 * @typedef {object} Denial
 * A Stone of Intuition result where the guess was wrong.
 * Hard-excludes that type name for this specific id.
 * @property {string} id          - colorId or runeId
 * @property {string} guessedName - type name that was ruled out
 */

/**
 * @typedef {object} ItemInput
 * @property {Record<string, string>} identified   - { id: typeName } hard-confirmed mappings
 * @property {Observation[]}          observations  - every pickup of an unidentified item this run
 * @property {Denial[]}               denials       - Stone of Intuition wrong guesses
 */

/**
 * @typedef {object} EngineInput
 * @property {ItemInput}  potions
 * @property {ItemInput}  scrolls
 * @property {HintRoom[]} hintRooms - special rooms seen across all floors this run
 */

/**
 * @typedef {object} EngineConfig
 * All 12 ids for each item type — needed by the Sinkhorn solver to enforce the
 * one-to-one constraint even for colors/runes never yet observed.
 * @property {string[]} potionIds - e.g. ["p1", "p2", ..., "p12"]
 * @property {string[]} scrollIds - e.g. ["s1", "s2", ..., "s12"]
 */

/**
 * @typedef {object} TypeProbability
 * @property {string} name        - type name e.g. "Healing"
 * @property {number} probability - 0..1; sums to 1 across the full distribution
 */

/**
 * @typedef {object} EngineOutput
 * @property {Record<string, TypeProbability[]>} potions - colorId → sorted distribution
 * @property {Record<string, TypeProbability[]>} scrolls - runeId  → sorted distribution
 */

// ── Likelihood function ───────────────────────────────────────────────────────

/**
 * P(observing typeName | source) — unnormalized, proportional weight.
 *
 * Returns 0 if the source makes this type impossible (e.g. Strength from a
 * weighted floor drop), 1 for uniform sources, or the deck weight for weighted
 * sources. This is multiplied across all observations of the same id.
 *
 * @param {string} typeName
 * @param {object|null} source - a source definition object, or null for unknown
 * @param {Array<{name:string, weight:number}>} weights - POTION_WEIGHTS or SCROLL_WEIGHTS
 * @returns {number}
 */
function getLikelihood(typeName, source, weights) {
  if (!source || source.method === "other") {
    return 1; // unknown source: fully uniform — Strength/Upgrade remain possible
  }
  if (source.method === "fixed") {
    return typeName === source.fixed ? 1 : 0;
  }
  if (source.method === "flat") {
    const excl = new Set(source.exclusions ?? []);
    return excl.has(typeName) ? 0 : 1;
  }
  if (source.method === "flat_include") {
    const incl = new Set(source.inclusions ?? []);
    return incl.has(typeName) ? 1 : 0;
  }
  if (source.method === "library_mixture") {
    // Used for library rooms where exactly 1 of n scrolls is Identify/RemoveCurse (50/50)
    // and the rest are standard weighted. fixedFraction = 1/n (number of unidentified scrolls
    // remaining in the library). Sinkhorn normalises the rest.
    const fixedFraction = source.fixedFraction ?? 0.5;
    const fixedSet = new Set(source.inclusions ?? []);
    const w = weights.find(wt => wt.name === typeName)?.weight ?? 0;
    const totalW = weights.reduce((s, wt) => s + wt.weight, 0);
    const fixedSetSize = fixedSet.size || 1;
    const fixedContrib = fixedSet.has(typeName) ? fixedFraction * totalW / fixedSetSize : 0;
    return fixedContrib + (1 - fixedFraction) * w;
  }
  if (source.method === "lab") {
    // Source carries its own weight table — used for rooms with non-standard distributions.
    return source.weights?.[typeName] ?? 0;
  }
  if (source.method === "warlock") {
    if (typeName === "Healing") return 1;
    // Non-Healing path uses randomUsingDefaults(POTION) excluding Healing.
    // Strength has weight 0 so it still can't appear. Scale by 2/3 to reflect
    // that Healing takes ~1/3 of the total probability mass.
    return (weights.find(w => w.name === typeName)?.weight ?? 0) * (2 / 3);
  }
  if (source.method === "shop") {
    const guaranteed = new Set(source.guaranteed ?? []);
    const base = weights.find(w => w.name === typeName)?.weight ?? 0;
    return guaranteed.has(typeName) ? base * 3 : base;
  }
  // "weighted" — standard deck weights. weight:0 means impossible from this source.
  return weights.find(w => w.name === typeName)?.weight ?? 0;
}

// ── Hint room helper ──────────────────────────────────────────────────────────

/**
 * For each id, collect the set of type names hinted by special rooms seen on
 * the same floor as an observation of that id.
 *
 * @param {HintRoom[]} hintRooms
 * @param {Observation[]} observations
 * @param {Set<string>} identifiedNames - type names already hard-identified (skip hinting)
 * @returns {Map<string, Set<string>>} id → Set of hinted type names
 */
function buildHintSets(hintRooms, observations, identifiedNames) {
  // Map floor → set of hinted type names from rooms on that floor
  const floorHints = new Map();
  for (const { roomId, floor } of hintRooms) {
    const room = SPECIAL_ROOMS.find(r => r.id === roomId);
    if (!room?.floorPotion) continue;
    if (identifiedNames.has(room.floorPotion)) continue; // already known — no hint needed
    if (!floorHints.has(floor)) floorHints.set(floor, new Set());
    floorHints.get(floor).add(room.floorPotion);
  }

  // Map each id to the union of hints from all floors it was observed on
  const idHints = new Map();
  for (const { id, floor } of observations) {
    const hints = floorHints.get(floor);
    if (!hints) continue;
    if (!idHints.has(id)) idHints.set(id, new Set());
    for (const name of hints) idHints.get(id).add(name);
  }

  return idHints;
}

// ── Core solver ───────────────────────────────────────────────────────────────

/**
 * Solve the probability distribution for one item type (potions or scrolls).
 *
 * @param {string[]} allIds       - all 12 colorIds or runeIds
 * @param {ItemInput} itemInput
 * @param {HintRoom[]} hintRooms
 * @param {Array<{name:string, weight:number}>} weights
 * @param {object[]} sources
 * @returns {Record<string, TypeProbability[]>}
 */
function solveItemType(allIds, itemInput, hintRooms, weights, sources) {
  const { identified, observations, denials } = itemInput;
  const names = weights.map(w => w.name);

  // Build lookup maps from hard evidence
  const identIdToName = { ...identified };
  const identNameToId = {};
  for (const [id, name] of Object.entries(identIdToName)) {
    identNameToId[name] = id;
  }

  // Group observations by id
  const obsByid = {};
  for (const obs of observations) {
    if (!obsByid[obs.id]) obsByid[obs.id] = [];
    obsByid[obs.id].push(obs);
  }

  // Group denials by id
  const denialsByid = {};
  for (const { id, guessedName } of denials) {
    if (!denialsByid[id]) denialsByid[id] = new Set();
    denialsByid[id].add(guessedName);
  }

  // Build hint sets — only for unidentified type names
  const identifiedNames = new Set(Object.values(identIdToName));
  const hintSets = buildHintSets(hintRooms, observations, identifiedNames);

  // ── Build belief matrix ───────────────────────────────────────────────────
  // belief[id][name] = unnormalized likelihood product (prior × observations × hints)

  const belief = {};

  for (const id of allIds) {
    belief[id] = {};

    if (identIdToName[id]) {
      // Hard-identified: lock to known name
      for (const name of names) {
        belief[id][name] = name === identIdToName[id] ? 1 : 0;
      }
      continue;
    }

    const idObs    = obsByid[id] ?? [];
    const idDenials = denialsByid[id] ?? new Set();
    const idHints  = hintSets.get(id) ?? new Set();

    for (const name of names) {
      // Zero out names already claimed by another identified id
      if (identNameToId[name]) {
        belief[id][name] = 0;
        continue;
      }
      // Zero out names ruled out by Stone of Intuition
      if (idDenials.has(name)) {
        belief[id][name] = 0;
        continue;
      }

      if (idObs.length === 0) {
        // Unobserved id: uniform prior, boosted by hint rooms
        belief[id][name] = idHints.has(name) ? ROOM_HINT_BOOST : 1;
        continue;
      }

      // Observed: multiply likelihoods across all observations
      let L = 1;
      for (const obs of idObs) {
        const src = sources.find(s => s.id === obs.sourceId) ?? null;
        L *= getLikelihood(name, src, weights);
      }

      // Room hint boost
      if (idHints.has(name)) L *= ROOM_HINT_BOOST;

      belief[id][name] = L;
    }
  }

  // ── Sinkhorn solver ───────────────────────────────────────────────────────
  // Enforces the one-to-one constraint: each type belongs to exactly one id.
  // Iterates row-normalize (each id sums to 1) then column-normalize
  // (each name's total mass across ids is capped at 1).

  const unidentIds = allIds.filter(id => !identIdToName[id]);

  for (let iter = 0; iter < SOLVER_ITERATIONS; iter++) {
    // Row normalize
    for (const id of unidentIds) {
      const total = names.reduce((s, n) => s + (belief[id][n] ?? 0), 0);
      if (total > 0) {
        for (const name of names) belief[id][name] = (belief[id][name] ?? 0) / total;
      }
    }
    // Column normalize
    for (const name of names) {
      if (identNameToId[name]) continue;
      const colTotal = unidentIds.reduce((s, id) => s + (belief[id][name] ?? 0), 0);
      if (colTotal > 1) {
        for (const id of unidentIds) {
          belief[id][name] = (belief[id][name] ?? 0) / colTotal;
        }
      }
    }
  }

  // ── Build output ──────────────────────────────────────────────────────────

  const result = {};
  for (const id of allIds) {
    if (identIdToName[id]) {
      result[id] = [{ name: identIdToName[id], probability: 1 }];
      continue;
    }
    const dist = names
      .map(name => ({ name, probability: belief[id][name] ?? 0 }))
      .filter(d => d.probability > 0.001)
      .sort((a, b) => b.probability - a.probability);
    const total = dist.reduce((s, d) => s + d.probability, 0);
    result[id] = total > 0 ? dist.map(d => ({ ...d, probability: d.probability / total })) : dist;
  }

  return result;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Compute probability distributions for all unidentified potions and scrolls.
 *
 * @param {EngineInput} input
 * @param {EngineConfig} config
 * @returns {EngineOutput}
 */
export function computeProbabilities(input, config) {
  const { potionIds, scrollIds } = config;

  return {
    potions: solveItemType(
      potionIds,
      input.potions,
      input.hintRooms,
      POTION_WEIGHTS,
      POTION_SOURCES,
    ),
    scrolls: solveItemType(
      scrollIds,
      input.scrolls,
      input.hintRooms,
      SCROLL_WEIGHTS,
      SCROLL_SOURCES,
    ),
  };
}
