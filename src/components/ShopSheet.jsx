import { useState } from "react";
import { POTION_UNKNOWNS, SCROLL_UNKNOWNS } from "../items.js";
import { ItemSprite } from "./ItemSprite.jsx";

/**
 * Bottom sheet for recording a shop visit.
 * The player selects which potion colors and scroll runes were visible in the shop.
 *
 * @param {{
 *   floor: number,
 *   existing: { potionIds: string[], scrollIds: string[] } | null,
 *   run: object,
 *   onUpdate: (newRun: object) => void,
 *   onClose: () => void,
 * }} props
 */
export function ShopSheet({ floor, existing, run, onUpdate, onClose }) {
  const [selectedPotions, setSelectedPotions] = useState(new Set(existing?.potionIds ?? []));
  const [selectedScrolls, setSelectedScrolls] = useState(new Set(existing?.scrollIds ?? []));

  function togglePotion(id) {
    setSelectedPotions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleScroll(id) {
    setSelectedScrolls(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const totalSelected = selectedPotions.size + selectedScrolls.size;

  function confirm() {
    if (totalSelected === 0) return;

    const visit = {
      floor,
      potionIds: [...selectedPotions],
      scrollIds: [...selectedScrolls],
    };

    let updated;
    if (existing) {
      updated = {
        ...run,
        shopVisits: (run.shopVisits ?? []).map(v =>
          v.floor === floor && sameVisit(v, existing) ? visit : v
        ),
      };
    } else {
      updated = {
        ...run,
        shopVisits: [...(run.shopVisits ?? []), visit],
      };
    }
    onUpdate(updated);
    onClose();
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center px-4 py-3 border-b border-gray-800">
          <div>
            <p className="text-sm font-semibold text-gray-100">Shop — F{floor}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Select potions and scrolls visible in the shop.
            </p>
          </div>
          <button onClick={onClose} className="ml-auto text-gray-500 hover:text-gray-300 text-xl leading-none">×</button>
        </div>

        <p className="px-4 pt-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Potions</p>
        <div className="grid grid-cols-4 gap-2 p-3 pt-2">
          {POTION_UNKNOWNS.map(item => {
            const isSelected = selectedPotions.has(item.id);
            const isIdentified = run.identified?.[item.id];
            return (
              <button
                key={item.id}
                onClick={() => togglePotion(item.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all active:scale-95
                  ${isSelected
                    ? "border-green-400 bg-green-900/40"
                    : "border-gray-700 bg-gray-800/60 hover:border-gray-500"}`}
              >
                <ItemSprite sx={item.sx} sy={item.sy} scale={3} />
                <span className="text-xs text-gray-400 leading-tight">{item.label}</span>
                {isIdentified && (
                  <span className="text-xs text-yellow-400 leading-tight truncate w-full text-center">
                    {isIdentified}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <p className="px-4 pt-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">Scrolls</p>
        <div className="grid grid-cols-4 gap-2 p-3 pt-2">
          {SCROLL_UNKNOWNS.map(item => {
            const isSelected = selectedScrolls.has(item.id);
            const isIdentified = run.identified?.[item.id];
            return (
              <button
                key={item.id}
                onClick={() => toggleScroll(item.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all active:scale-95
                  ${isSelected
                    ? "border-green-400 bg-green-900/40"
                    : "border-gray-700 bg-gray-800/60 hover:border-gray-500"}`}
              >
                <ItemSprite sx={item.sx} sy={item.sy} scale={3} />
                <span className="text-xs text-gray-400 leading-tight">{item.label}</span>
                {isIdentified && (
                  <span className="text-xs text-yellow-400 leading-tight truncate w-full text-center">
                    {isIdentified}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="px-3 pb-4">
          <button
            onClick={confirm}
            disabled={totalSelected === 0}
            className="w-full py-3 bg-green-700 hover:bg-green-600 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {totalSelected === 0
              ? "Select items to confirm"
              : `Confirm ${totalSelected} item${totalSelected > 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </>
  );
}

function sameVisit(a, existing) {
  return (
    sameIds(a.potionIds, existing.potionIds) &&
    sameIds(a.scrollIds, existing.scrollIds)
  );
}

function sameIds(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}
