import { useState } from "react";
import { CLASS_START_IDS } from "../classStartIds.js";
import { createNewRun, applyClassStartIds } from "../runState.js";
import { POTION_UNKNOWNS, SCROLL_UNKNOWNS } from "../items.js";
import { ItemSprite } from "./ItemSprite.jsx";

const CLASSES = ["Warrior", "Mage", "Rogue", "Huntress", "Duelist", "Cleric"];

const CLASS_ICONS = {
  Warrior: "⚔️", Mage: "🔮", Rogue: "🗡️",
  Huntress: "🏹", Duelist: "🤺", Cleric: "✝️",
};

/**
 * Full-screen run setup wizard.
 * Step 1: Choose hero class
 * Step 2: For each class-start identified type, select which color/rune it is
 * Step 3: Confirm and start
 *
 * @param {{ onComplete: (RunState) => void }} props
 */
export function RunSetup({ onComplete }) {
  const [heroClass, setHeroClass] = useState(null);
  const [bindings, setBindings] = useState({}); // typeName → itemId
  const [bindIdx, setBindIdx] = useState(0);   // index into allTypes to bind

  // All type names to bind for the selected class
  const allTypes = heroClass
    ? [
        ...CLASS_START_IDS[heroClass].potions.map(n => ({ name: n, kind: "potion" })),
        ...CLASS_START_IDS[heroClass].scrolls.map(n => ({ name: n, kind: "scroll" })),
      ]
    : [];

  const alreadyBound = new Set(Object.values(bindings));
  const currentType = allTypes[bindIdx] ?? null;

  function handleClassSelect(cls) {
    setHeroClass(cls);
    setBindings({});
    setBindIdx(0);
  }

  function handleBind(itemId) {
    const updated = { ...bindings, [currentType.name]: itemId };
    setBindings(updated);
    if (bindIdx + 1 < allTypes.length) {
      setBindIdx(bindIdx + 1);
    } else {
      // All bound — build resolved map { id → typeName } and start
      const resolvedMap = {};
      for (const [typeName, id] of Object.entries(updated)) {
        resolvedMap[id] = typeName;
      }
      const run = createNewRun(heroClass);
      applyClassStartIds(run, resolvedMap);
      onComplete(run);
    }
  }

  function handleSkipBinding() {
    // Start run without binding class-start items
    const resolvedMap = {};
    for (const [typeName, id] of Object.entries(bindings)) {
      resolvedMap[id] = typeName;
    }
    const run = createNewRun(heroClass);
    if (Object.keys(resolvedMap).length > 0) applyClassStartIds(run, resolvedMap);
    onComplete(run);
  }

  // ── Step 1: Class selection ──────────────────────────────────────────────────
  if (!heroClass) {
    return (
      <div className="min-h-dvh bg-gray-950 flex flex-col items-center justify-center p-6 gap-6">
        <h1 className="text-xl font-bold text-gray-100">New Run</h1>
        <p className="text-gray-400 text-sm">Choose your hero class</p>
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          {CLASSES.map(cls => (
            <button
              key={cls}
              onClick={() => handleClassSelect(cls)}
              className="flex flex-col items-center gap-1 p-4 bg-gray-800 border border-gray-700 rounded-xl hover:border-yellow-500 active:scale-95 transition-all"
            >
              <span className="text-2xl">{CLASS_ICONS[cls]}</span>
              <span className="text-sm text-gray-200">{cls}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Step 2: Bind class-start items ──────────────────────────────────────────
  if (currentType) {
    const items = currentType.kind === "potion" ? POTION_UNKNOWNS : SCROLL_UNKNOWNS;
    const available = items.filter(it => !alreadyBound.has(it.id));

    return (
      <div className="min-h-dvh bg-gray-950 flex flex-col p-4 gap-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">{CLASS_ICONS[heroClass]}</span>
          <h1 className="text-base font-bold text-gray-100">{heroClass}</h1>
          <span className="ml-auto text-xs text-gray-500">{bindIdx + 1}/{allTypes.length}</span>
        </div>
        <p className="text-gray-300 text-sm">
          Which {currentType.kind === "potion" ? "color" : "rune"} is your{" "}
          <span className="text-yellow-400 font-semibold">{currentType.name}</span>?
        </p>
        <div className="grid grid-cols-4 gap-2">
          {available.map(item => (
            <button
              key={item.id}
              onClick={() => handleBind(item.id)}
              className="flex flex-col items-center gap-1 p-2 bg-gray-800 border border-gray-700 rounded-xl hover:border-yellow-500 active:scale-95 transition-all"
            >
              <ItemSprite sx={item.sx} sy={item.sy} scale={3} />
              <span className="text-xs text-gray-400 leading-none">{item.label}</span>
            </button>
          ))}
        </div>
        <button
          onClick={handleSkipBinding}
          className="text-xs text-gray-600 hover:text-gray-400 mt-2"
        >
          Skip remaining — I'll identify later
        </button>
      </div>
    );
  }

  // Should not reach here (completes in handleBind), but safety fallback
  return null;
}
