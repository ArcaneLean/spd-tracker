import { useState } from "react";
import { SCROLL_UNKNOWNS } from "../items.js";
import { ItemSprite } from "./ItemSprite.jsx";

/**
 * Bottom sheet for recording a library room.
 * The player selects which scroll rune IDs (1–3) were present in the library.
 *
 * @param {{
 *   floor: number,
 *   existing: string[] | null,   // null = new room; existing scrollIds = edit
 *   run: object,
 *   onUpdate: (newRun: object) => void,
 *   onClose: () => void,
 * }} props
 */
export function LibraryRoomSheet({ floor, existing, run, onUpdate, onClose }) {
  const [selected, setSelected] = useState(new Set(existing ?? []));

  function toggle(id) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 3) {
        next.add(id);
      }
      return next;
    });
  }

  function confirm() {
    const scrollIds = [...selected];
    if (scrollIds.length === 0) return;

    let updated;
    if (existing) {
      // Replace existing library room entry for this floor
      updated = {
        ...run,
        libraryRooms: run.libraryRooms.map(lib =>
          lib.floor === floor && sameIds(lib.scrollIds, existing)
            ? { floor, scrollIds }
            : lib
        ),
      };
    } else {
      updated = {
        ...run,
        libraryRooms: [...(run.libraryRooms ?? []), { floor, scrollIds }],
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
            <p className="text-sm font-semibold text-gray-100">Library Room — F{floor}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Select scrolls in the room (1–3). Exactly one is Identify or Remove Curse.
            </p>
          </div>
          <button onClick={onClose} className="ml-auto text-gray-500 hover:text-gray-300 text-xl leading-none">×</button>
        </div>

        <div className="grid grid-cols-4 gap-2 p-3">
          {SCROLL_UNKNOWNS.map(item => {
            const isSelected = selected.has(item.id);
            const isIdentified = run.identified?.[item.id];
            return (
              <button
                key={item.id}
                onClick={() => toggle(item.id)}
                disabled={!isSelected && selected.size >= 3}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all active:scale-95
                  ${isSelected
                    ? "border-blue-400 bg-blue-900/40"
                    : selected.size >= 3
                      ? "border-gray-800 bg-gray-800/30 opacity-40"
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
            disabled={selected.size === 0}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {selected.size === 0
              ? "Select scrolls to confirm"
              : `Confirm ${selected.size} scroll${selected.size > 1 ? "s" : ""}`}
          </button>
        </div>
      </div>
    </>
  );
}

function sameIds(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  const sa = [...a].sort();
  const sb = [...b].sort();
  return sa.every((v, i) => v === sb[i]);
}
