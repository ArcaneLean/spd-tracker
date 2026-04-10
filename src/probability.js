/**
 * estimateProbabilities
 *
 * Given what you've already identified in a run and the source of a new
 * unidentified potion or scroll, returns the probability distribution over
 * the remaining possible types for that item.
 *
 * How it works:
 *   - Each run, all 12 potion types (and scroll types) are randomly assigned
 *     to colors/runes. Once a type is identified (color → type mapping known),
 *     it is removed from the pool of possibilities for any remaining unknowns.
 *   - The source determines the weight or method used to generate the item,
 *     which shapes the probability distribution over the remaining pool.
 *
 * @param {object}   opts
 * @param {string[]} opts.identified
 *   Type names already identified this run (e.g. ["Healing", "Frost"]).
 *   These are excluded from the output — their color/rune is already known.
 * @param {string}   opts.sourceId
 *   Source id string matching an entry in the sources array
 *   (e.g. "floor_drop", "scorpio", "warlock").
 * @param {Array<{name: string, weight: number}>} opts.weights
 *   Full weight table for the item type (POTION_WEIGHTS or SCROLL_WEIGHTS).
 *   weight: 0 means the type never appears from random sources (Strength, Upgrade).
 * @param {object[]} opts.sources
 *   Source definitions array (POTION_SOURCES or SCROLL_SOURCES).
 *
 * @returns {Array<{name: string, probability: number}>}
 *   Probability distribution over unidentified types, sorted descending.
 *   Probabilities sum to 1. Returns [] if the distribution cannot be determined
 *   (e.g. fixed source whose type is already identified, or no candidates remain).
 */
export function estimateProbabilities({ identified, sourceId, weights, sources }) {
  const source = sources.find(s => s.id === sourceId);
  if (!source) throw new Error(`Unknown source id: "${sourceId}"`);

  const identifiedSet = new Set(identified);

  // ── Fixed source: always one specific type ────────────────────────────────
  if (source.method === "fixed") {
    if (identifiedSet.has(source.fixed)) return [];
    return [{ name: source.fixed, probability: 1 }];
  }

  // ── All other methods: build (name, rawWeight) candidate list ─────────────
  const excluded = new Set(source.exclusions ?? []);
  let candidates;

  if (source.method === "weighted" || source.method === "shop") {
    // Standard Generator weight table.
    // weight > 0 check removes Strength/Upgrade which have weight 0 and never
    // appear from random sources.
    candidates = weights
      .filter(w => w.weight > 0 && !excluded.has(w.name) && !identifiedSet.has(w.name))
      .map(w => ({ name: w.name, rawWeight: w.weight }));

  } else if (source.method === "flat" || source.method === "other") {
    // Equal weight across all eligible types (e.g. Scorpio uses Random.oneOf).
    // "other" and "boss" include weight-0 types (Strength/Upgrade are possible).
    candidates = weights
      .filter(w => !excluded.has(w.name) && !identifiedSet.has(w.name))
      .map(w => ({ name: w.name, rawWeight: 1 }));

  } else if (source.method === "warlock") {
    // Dwarf Warlock: ~1/3 chance Healing, ~2/3 weighted excluding Healing and Strength.
    // Verified from Warlock.java: two separate code paths with LimitedDrops gating.
    //
    // We model this as: give Healing a rawWeight = (sum of other weights) / 2
    // so that P(Healing) = rawWeight / total = (X/2) / (X + X/2) = 1/3.
    const healingKnown = identifiedSet.has("Healing");
    const others = weights
      .filter(w => w.name !== "Healing" && w.name !== "Strength" &&
                   !identifiedSet.has(w.name) && w.weight > 0)
      .map(w => ({ name: w.name, rawWeight: w.weight }));
    const otherTotal = others.reduce((s, c) => s + c.rawWeight, 0);

    candidates = healingKnown
      ? others
      : [{ name: "Healing", rawWeight: otherTotal / 2 }, ...others];

  } else {
    throw new Error(`Unknown source method: "${source.method}"`);
  }

  if (candidates.length === 0) return [];

  const total = candidates.reduce((s, c) => s + c.rawWeight, 0);
  return candidates
    .map(c => ({ name: c.name, probability: c.rawWeight / total }))
    .sort((a, b) => b.probability - a.probability);
}
