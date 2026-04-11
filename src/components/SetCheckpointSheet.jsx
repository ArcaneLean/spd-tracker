import { useState } from "react";
import { POTION_UNKNOWNS, SCROLL_UNKNOWNS } from "../items.js";
import { ItemSprite } from "./ItemSprite.jsx";

// ✅ VERIFIED: Dungeon.java souNeeded() + posNeeded()
// Each floor set guarantees exactly ONE scroll type (Upgrade) dropped 3×
// and ONE potion type (Strength) dropped 2×. All drops within a set share the
// same visual ID — so the player will have seen one rune 2–3× and one color 2×.
// Boss floors (5, 10, 15, 20, 25) are skipped for both mechanics.

const SET_CONFIGS = {
  1: { label: "Set 1", floorRange: "F1–4", floors: [1, 4], souDrops: 3, posDrops: 2 },
  2: { label: "Set 2", floorRange: "F6–9", floors: [6, 9], souDrops: 3, posDrops: 2 },
  3: { label: "Set 3", floorRange: "F11–14", floors: [11, 14], souDrops: 3, posDrops: 2 },
  4: { label: "Set 4", floorRange: "F16–19", floors: [16, 19], souDrops: 3, posDrops: 2 },
  5: { label: "Set 5", floorRange: "F21–24", floors: [21, 24], souDrops: 3, posDrops: 2 },
};

/**
 * Count how many times each ID was picked up within the given floor range.
 * @param {object[]} pickups  - array of { id, floor, ... }
 * @param {[number, number]} floors - [min, max] inclusive
 * @returns {Record<string, number>}
 */
function countPickups(pickups, [minFloor, maxFloor]) {
  const counts = {};
  for (const p of pickups) {
    if (p.floor >= minFloor && p.floor <= maxFloor) {
      counts[p.id] = (counts[p.id] ?? 0) + 1;
    }
  }
  return counts;
}

/**
 * Bottom sheet shown at the start of each new floor set (floors 6, 11, 16, 21, 26).
 *
 * The player identifies ONE rune as Scroll of Upgrade and ONE color as Potion of
 * Strength. The tracker surfaces pickup counts from the set's floor range so the
 * player can spot the rune/color that appeared 2–3 times — that's the guaranteed type.
 *
 * @param {{
 *   set: 1|2|3|4|5,
 *   run: object,
 *   onUpdate: (newRun: object) => void,
 *   onClose: () => void,
 * }} props
 */
export function SetCheckpointSheet({ set, run, onUpdate, onClose }) {
  const cfg = SET_CONFIGS[set];

  const scrollCounts = countPickups(run.scrollPickups ?? [], cfg.floors);
  const potionCounts = countPickups(run.potionPickups ?? [], cfg.floors);

  const upgradeId = Object.entries(run.identified).find(([id, name]) => id.startsWith("s") && name === "Upgrade")?.[0] ?? null;
  const strengthId = Object.entries(run.identified).find(([id, name]) => id.startsWith("p") && name === "Strength")?.[0] ?? null;

  const [selectedScroll, setSelectedScroll] = useState(upgradeId);
  const [selectedPotion, setSelectedPotion] = useState(strengthId);

  function toggleScroll(id) {
    if (run.identified[id] && run.identified[id] !== "Upgrade") return;
    setSelectedScroll(prev => prev === id ? null : id);
  }

  function togglePotion(id) {
    if (run.identified[id] && run.identified[id] !== "Strength") return;
    setSelectedPotion(prev => prev === id ? null : id);
  }

  function acknowledge(extraIdentified = {}) {
    onUpdate({
      ...run,
      identified: { ...run.identified, ...extraIdentified },
      acknowledgedSets: [...(run.acknowledgedSets ?? []), set],
    });
    onClose();
  }

  function confirm() {
    const extra = {};
    if (selectedScroll && !run.identified[selectedScroll]) extra[selectedScroll] = "Upgrade";
    if (selectedPotion && !run.identified[selectedPotion]) extra[selectedPotion] = "Strength";
    acknowledge(extra);
  }

  const hasNewIdentification =
    (selectedScroll && !run.identified[selectedScroll]) ||
    (selectedPotion && !run.identified[selectedPotion]);

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-40" onClick={() => acknowledge()} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center px-4 py-3 border-b border-gray-800">
          <div>
            <p className="text-sm font-semibold text-gray-100">
              {cfg.label} complete ({cfg.floorRange})
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {cfg.souDrops} × Upgrade scroll dropped · {cfg.posDrops} × Strength potion dropped.
              The rune/color you saw most often is the guaranteed type.
            </p>
          </div>
          <button onClick={() => acknowledge()} className="ml-auto text-gray-500 hover:text-gray-300 text-xl leading-none">×</button>
        </div>

        {/* Scrolls of Upgrade — single select */}
        <p className="px-4 pt-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Which rune is Scroll of Upgrade?
        </p>
        <div className="grid grid-cols-4 gap-2 p-3 pt-2">
          {SCROLL_UNKNOWNS.map(item => {
            const identName = run.identified[item.id];
            const isUpgrade = identName === "Upgrade";
            const isOtherType = identName && !isUpgrade;
            const isSelected = selectedScroll === item.id;
            const count = scrollCounts[item.id] ?? 0;
            return (
              <button
                key={item.id}
                onClick={() => toggleScroll(item.id)}
                disabled={isOtherType}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all active:scale-95
                  ${isUpgrade || isSelected
                    ? "border-blue-400 bg-blue-900/40"
                    : isOtherType
                      ? "border-gray-800 bg-gray-800/30 opacity-40"
                      : "border-gray-700 bg-gray-800/60 hover:border-gray-500"}`}
              >
                <ItemSprite sx={item.sx} sy={item.sy} scale={3} />
                <span className="text-xs text-gray-400 leading-tight">{item.label}</span>
                {count > 0 && (
                  <span className={`text-xs font-semibold leading-tight ${count >= 2 ? "text-blue-300" : "text-gray-500"}`}>
                    ×{count} on {cfg.floorRange}
                  </span>
                )}
                {identName && (
                  <span className="text-xs text-yellow-400 leading-tight truncate w-full text-center">
                    {identName}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Potions of Strength — single select */}
        <p className="px-4 pt-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Which color is Potion of Strength?
        </p>
        <div className="grid grid-cols-4 gap-2 p-3 pt-2">
          {POTION_UNKNOWNS.map(item => {
            const identName = run.identified[item.id];
            const isStrength = identName === "Strength";
            const isOtherType = identName && !isStrength;
            const isSelected = selectedPotion === item.id;
            const count = potionCounts[item.id] ?? 0;
            return (
              <button
                key={item.id}
                onClick={() => togglePotion(item.id)}
                disabled={isOtherType}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all active:scale-95
                  ${isStrength || isSelected
                    ? "border-orange-400 bg-orange-900/40"
                    : isOtherType
                      ? "border-gray-800 bg-gray-800/30 opacity-40"
                      : "border-gray-700 bg-gray-800/60 hover:border-gray-500"}`}
              >
                <ItemSprite sx={item.sx} sy={item.sy} scale={3} />
                <span className="text-xs text-gray-400 leading-tight">{item.label}</span>
                {count > 0 && (
                  <span className={`text-xs font-semibold leading-tight ${count >= 2 ? "text-orange-300" : "text-gray-500"}`}>
                    ×{count} on {cfg.floorRange}
                  </span>
                )}
                {identName && (
                  <span className="text-xs text-yellow-400 leading-tight truncate w-full text-center">
                    {identName}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="px-3 pb-4 flex gap-2">
          <button
            onClick={() => acknowledge()}
            className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-semibold rounded-xl transition-colors"
          >
            Skip
          </button>
          <button
            onClick={confirm}
            disabled={!hasNewIdentification}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {hasNewIdentification ? "Identify" : "Nothing new to identify"}
          </button>
        </div>
      </div>
    </>
  );
}

// Which floor entering triggers which set's checkpoint
export const SET_CHECKPOINT_FLOORS = { 6: 1, 11: 2, 16: 3, 21: 4, 26: 5 };
