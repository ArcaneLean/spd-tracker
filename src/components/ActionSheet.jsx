import { useState } from "react";
import { POTION_SOURCES, SCROLL_SOURCES } from "../sources.js";
import { THROW_EFFECT_TYPES } from "../runState.js";
import { POTION_WEIGHTS, SCROLL_WEIGHTS } from "../floorDropWeights.js";
import { POTION_UNKNOWNS, SCROLL_UNKNOWNS, WEAPON_ITEMS, ARMOR_ITEMS, MISSILE_ITEMS } from "../items.js";
import { ItemSprite } from "./ItemSprite.jsx";

// Sources shown for gear pickups (no floor restriction needed)
const GEAR_SOURCES = [
  { id: "floor_drop",    label: "Floor drop" },
  { id: "chest",         label: "Chest / Skeleton" },
  { id: "golden_chest",  label: "Golden Chest (gold key)" },
  { id: "tombstone",     label: "Tombstone (Crypt Room)" },
  { id: "flock_trap",    label: "Trap Room (Levitation on floor, prize chest — curse removed)" },
  { id: "sentry_room",   label: "Sentry Room (chest, curse confirmed)" },
  { id: "crystal_vault", label: "Crystal Vault Room (crystal key)" },
  { id: "armory",        label: "Armory Room" },
  { id: "sacrifice_room", label: "Sacrifice Room (always cursed, one tier above normal)" },
  { id: "boss",          label: "Boss drop" },
  { id: "other",         label: "Other" },
];

// Sources that pre-confirm the effect on pickup
const SOURCE_CONFIRMED_EFFECTS = {
  tombstone: "cursed",
  sacrifice_room: "cursed",
};

const GEAR_CATEGORIES = [
  { id: "weapon",   label: "Weapon",   icon: "⚔️" },
  { id: "armor",    label: "Armor",    icon: "🛡️" },
  { id: "missile",  label: "Missile",  icon: "🏹" },
  { id: "artifact", label: "Artifact", icon: "🏺" },
];

/**
 * Filters sources to those available on the given floor.
 * Handles both [min, max] ranges and [f1, f2, ...] specific-floor lists.
 */
function sourcesForFloor(sources, floor) {
  return sources.filter(s => {
    const f = s.floors;
    if (f.length === 2 && f[1] >= f[0]) return floor >= f[0] && floor <= f[1];
    return f.includes(floor);
  });
}

/** Bottom sheet wrapper */
function Sheet({ onClose, children }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 rounded-t-2xl max-h-[85vh] overflow-y-auto">
        {children}
      </div>
    </>
  );
}

/** Row button used in action menus */
function ActionBtn({ onClick, children, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 text-sm border-b border-gray-800 hover:bg-gray-800 active:bg-gray-700 transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

// ── Item action sheet (potions and scrolls) ───────────────────────────────────

/**
 * @param {{
 *   itemId: string,
 *   run: import('../runState.js').RunState,
 *   floor: number,
 *   probs: Array<{name:string,probability:number}>,
 *   onUpdate: (newRun: object) => void,
 *   onClose: () => void,
 * }} props
 */
export function ItemActionSheet({ itemId, run, floor, probs, onUpdate, onClose }) {
  const [view, setView] = useState("menu"); // menu|probs|pickup|identify|use|stone|stone_result|throw
  const [selectedName, setSelectedName] = useState(null);

  const isPotion = itemId.startsWith("p");
  const unknowns = isPotion ? POTION_UNKNOWNS : SCROLL_UNKNOWNS;
  const item = unknowns.find(u => u.id === itemId);
  const sources = isPotion ? POTION_SOURCES : SCROLL_SOURCES;
  const weights = isPotion ? POTION_WEIGHTS : SCROLL_WEIGHTS;
  const identified = run.identified[itemId];

  // Type names sorted by probability (exclude already-identified-elsewhere names)
  const takenNames = new Set(
    Object.entries(run.identified)
      .filter(([id]) => id !== itemId)
      .map(([, name]) => name)
  );
  const typeNames = (probs?.length > 0 ? probs : weights.map(w => ({ name: w.name, probability: 0 })))
    .filter(d => !takenNames.has(d.name))
    .map(d => d.name);

  function mutate(updater) {
    const updated = updater({ ...run, identified: { ...run.identified } });
    onUpdate(updated);
    onClose();
  }

  function doPickup(sourceId) {
    mutate(r => {
      const obs = { id: itemId, sourceId, floor };
      const key = isPotion ? "potionPickups" : "scrollPickups";
      return { ...r, [key]: [...r[key], obs] };
    });
  }

  function doIdentify(name) {
    mutate(r => ({ ...r, identified: { ...r.identified, [itemId]: name } }));
  }

  function doClearIdent() {
    mutate(r => {
      const ident = { ...r.identified };
      delete ident[itemId];
      return { ...r, identified: ident };
    });
  }

  function doUse(observedEffect) {
    mutate(r => {
      const entry = { id: itemId, itemType: isPotion ? "potion" : "scroll", floor, observedEffect: observedEffect ?? null };
      const updated = { ...r, used: [...r.used, entry] };
      if (observedEffect) updated.identified = { ...r.identified, [itemId]: observedEffect };
      return updated;
    });
  }

  function doThrowHarmless() {
    mutate(r => ({
      ...r,
      thrownHarmless: [...(r.thrownHarmless ?? []), { id: itemId, floor }],
    }));
  }

  function doStone(name, correct) {
    mutate(r => {
      const result = { id: itemId, guessedName: name, correct };
      const updated = { ...r, stoneResults: [...r.stoneResults, result] };
      if (correct) updated.identified = { ...r.identified, [itemId]: name };
      return updated;
    });
  }

  // ── Views ──────────────────────────────────────────────────────────────────

  const Header = () => (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
      {item && <ItemSprite sx={item.sx} sy={item.sy} scale={2} />}
      <div>
        <p className="text-sm font-semibold text-gray-100">{item?.label}</p>
        {identified && <p className="text-xs text-yellow-400">{identified}</p>}
      </div>
      <button onClick={onClose} className="ml-auto text-gray-500 hover:text-gray-300 text-xl leading-none">×</button>
    </div>
  );

  if (view === "menu") return (
    <Sheet onClose={onClose}>
      <Header />
      <ActionBtn onClick={() => setView("probs")}>📊 View probabilities</ActionBtn>
      <ActionBtn onClick={() => setView("pickup")}>🎒 Record pickup</ActionBtn>
      <ActionBtn onClick={() => setView("identify")}>🔍 Identify</ActionBtn>
      <ActionBtn onClick={() => setView("use")}>💧 Use</ActionBtn>
      {isPotion && <ActionBtn onClick={() => setView("throw")}>🏹 Throw</ActionBtn>}
      <ActionBtn onClick={() => setView("stone")}>🔮 Stone of Intuition</ActionBtn>
      {identified && (
        <ActionBtn onClick={doClearIdent} className="text-red-400">✕ Clear identification</ActionBtn>
      )}
    </Sheet>
  );

  if (view === "probs") {
    const allProbs = probs?.length > 0 ? probs : weights.map(w => ({ name: w.name, probability: 0 }));
    const filtered = allProbs.filter(p => !takenNames.has(p.name));
    const maxProb = filtered[0]?.probability ?? 0;
    return (
      <Sheet onClose={onClose}>
        <Header />
        <p className="px-4 py-2 text-xs text-gray-500">
          {identified
            ? "Identified — full distribution shown for reference"
            : "Probability distribution (excluding identified types)"}
        </p>
        <div className="px-4 pb-4 flex flex-col gap-2">
          {filtered.map(({ name, probability }) => {
            const pct = Math.round(probability * 100);
            const barPct = maxProb > 0 ? Math.round((probability / maxProb) * 100) : 0;
            const color = probability >= 0.8 ? "bg-yellow-400"
              : probability >= 0.5 ? "bg-yellow-600"
              : probability >= 0.2 ? "bg-blue-600"
              : "bg-gray-600";
            return (
              <div key={name}>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className={name === identified ? "text-yellow-400 font-medium" : "text-gray-300"}>
                    {name}
                  </span>
                  <span className="text-gray-400">{pct}%</span>
                </div>
                <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full ${color} transition-all`} style={{ width: `${barPct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <ActionBtn onClick={() => setView("menu")} className="text-gray-500">← Back</ActionBtn>
      </Sheet>
    );
  }

  if (view === "pickup") {
    const available = sourcesForFloor(sources, floor).filter(s => !s.id.startsWith("library_"));
    return (
      <Sheet onClose={onClose}>
        <Header />
        <p className="px-4 py-2 text-xs text-gray-500">Source (F{floor})</p>
        {available.map(s => (
          <ActionBtn key={s.id} onClick={() => doPickup(s.id)}>{s.label}</ActionBtn>
        ))}
        {available.length === 0 && (
          <p className="px-4 py-3 text-sm text-gray-500">No sources available on F{floor}.</p>
        )}
        <ActionBtn onClick={() => setView("menu")} className="text-gray-500">← Back</ActionBtn>
      </Sheet>
    );
  }

  if (view === "identify") return (
    <Sheet onClose={onClose}>
      <Header />
      <p className="px-4 py-2 text-xs text-gray-500">Select type (sorted by probability)</p>
      {typeNames.map(name => (
        <ActionBtn key={name} onClick={() => doIdentify(name)}>{name}</ActionBtn>
      ))}
      <ActionBtn onClick={() => setView("menu")} className="text-gray-500">← Back</ActionBtn>
    </Sheet>
  );

  if (view === "use") return (
    <Sheet onClose={onClose}>
      <Header />
      <p className="px-4 py-2 text-xs text-gray-500">Did you observe the effect?</p>
      <ActionBtn onClick={() => setView("use_effect")}>Yes — select observed type</ActionBtn>
      <ActionBtn onClick={() => doUse(null)}>No — effect unknown</ActionBtn>
      <ActionBtn onClick={() => setView("menu")} className="text-gray-500">← Back</ActionBtn>
    </Sheet>
  );

  if (view === "use_effect") return (
    <Sheet onClose={onClose}>
      <Header />
      <p className="px-4 py-2 text-xs text-gray-500">What did it do?</p>
      {typeNames.map(name => (
        <ActionBtn key={name} onClick={() => doUse(name)}>{name}</ActionBtn>
      ))}
      <ActionBtn onClick={() => setView("use")} className="text-gray-500">← Back</ActionBtn>
    </Sheet>
  );

  if (view === "stone") return (
    <Sheet onClose={onClose}>
      <Header />
      <p className="px-4 py-2 text-xs text-gray-500">What did you guess?</p>
      {typeNames.map(name => (
        <ActionBtn key={name} onClick={() => { setSelectedName(name); setView("stone_result"); }}>{name}</ActionBtn>
      ))}
      <ActionBtn onClick={() => setView("menu")} className="text-gray-500">← Back</ActionBtn>
    </Sheet>
  );

  if (view === "stone_result") return (
    <Sheet onClose={onClose}>
      <Header />
      <p className="px-4 py-3 text-sm text-gray-200">Guessed: <span className="text-yellow-400">{selectedName}</span></p>
      <ActionBtn onClick={() => doStone(selectedName, true)} className="text-green-400">✓ Correct!</ActionBtn>
      <ActionBtn onClick={() => doStone(selectedName, false)} className="text-red-400">✕ Wrong</ActionBtn>
      <ActionBtn onClick={() => setView("stone")} className="text-gray-500">← Back</ActionBtn>
    </Sheet>
  );

  if (view === "throw") return (
    <Sheet onClose={onClose}>
      <Header />
      <p className="px-4 py-2 text-xs text-gray-500">What happened?</p>
      <ActionBtn onClick={doThrowHarmless}>Splashes harmlessly (rules out: {THROW_EFFECT_TYPES.join(", ")})</ActionBtn>
      <p className="px-4 pt-3 pb-1 text-xs text-gray-600 uppercase tracking-wide">Visible effect (identifies)</p>
      {THROW_EFFECT_TYPES.map(name => (
        <ActionBtn key={name} onClick={() => doIdentify(name)}>{name}</ActionBtn>
      ))}
      <ActionBtn onClick={() => setView("menu")} className="text-gray-500">← Back</ActionBtn>
    </Sheet>
  );

  return null;
}

function itemsForCategory(category) {
  if (category === "weapon")  return WEAPON_ITEMS;
  if (category === "armor")   return ARMOR_ITEMS;
  if (category === "missile") return MISSILE_ITEMS;
  return [];
}

// ── Gear action sheet ─────────────────────────────────────────────────────────

/**
 * Used both for adding a new gear pickup and editing an existing one.
 *
 * @param {{
 *   pickup: object|null,   // null when adding new
 *   run: import('../runState.js').RunState,
 *   floor: number,
 *   onUpdate: (newRun: object) => void,
 *   onClose: () => void,
 * }} props
 */
export function GearActionSheet({ pickup, run, floor, onUpdate, onClose }) {
  const [view, setView] = useState(pickup ? "menu" : "add_cat");
  const [category, setCategory] = useState(pickup?.category ?? null);
  const [itemName, setItemName] = useState(pickup?.itemName ?? null);

  function mutate(updater) {
    onUpdate(updater({ ...run }));
    onClose();
  }

  function doAdd(sourceId) {
    mutate(r => ({
      ...r,
      gearPickups: [...r.gearPickups, {
        id: Date.now().toString(),
        category,
        itemName,
        sourceId,
        floor,
        observedLevel: null,
        observedEffect: SOURCE_CONFIRMED_EFFECTS[sourceId] ?? null,
      }],
    }));
  }

  function doSetItemName(name) {
    mutate(r => ({
      ...r,
      gearPickups: r.gearPickups.map(g =>
        g.id === pickup.id ? { ...g, itemName: name } : g
      ),
    }));
  }

  function doSetLevel(level) {
    mutate(r => ({
      ...r,
      gearPickups: r.gearPickups.map(g =>
        g.id === pickup.id ? { ...g, observedLevel: level } : g
      ),
    }));
  }

  function doSetEffect(effect) {
    mutate(r => ({
      ...r,
      gearPickups: r.gearPickups.map(g =>
        g.id === pickup.id ? { ...g, observedEffect: effect } : g
      ),
    }));
  }

  function doRemove() {
    mutate(r => ({ ...r, gearPickups: r.gearPickups.filter(g => g.id !== pickup.id) }));
  }

  const GearHeader = () => (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
      <span className="text-xl">{pickup ? { weapon: "⚔️", armor: "🛡️", missile: "🏹", artifact: "🏺" }[pickup.category] : "🎒"}</span>
      <p className="text-sm font-semibold text-gray-100">
        {pickup ? `${pickup.itemName ?? pickup.category} (F${pickup.floor})` : "Add gear"}
      </p>
      <button onClick={onClose} className="ml-auto text-gray-500 hover:text-gray-300 text-xl leading-none">×</button>
    </div>
  );

  if (view === "add_cat") return (
    <Sheet onClose={onClose}>
      <GearHeader />
      <p className="px-4 py-2 text-xs text-gray-500">Category</p>
      {GEAR_CATEGORIES.map(c => (
        <ActionBtn key={c.id} onClick={() => { setCategory(c.id); setView(c.id === "artifact" ? "add_src" : "add_item"); }}>
          {c.icon} {c.label}
        </ActionBtn>
      ))}
    </Sheet>
  );

  if (view === "add_item") {
    const items = itemsForCategory(category);
    const tiers = [...new Set(items.map(i => i.tier))];
    return (
      <Sheet onClose={onClose}>
        <GearHeader />
        <ActionBtn onClick={() => { setItemName(null); setView("add_src"); }} className="text-gray-500">
          Skip — unknown item
        </ActionBtn>
        {tiers.map(tier => (
          <div key={tier}>
            <p className="px-4 pt-3 pb-1 text-xs text-gray-600 uppercase tracking-wide">Tier {tier}</p>
            {items.filter(i => i.tier === tier).map(i => (
              <ActionBtn key={i.name} onClick={() => { setItemName(i.name); setView("add_src"); }}>
                {i.name}
              </ActionBtn>
            ))}
          </div>
        ))}
        <ActionBtn onClick={() => setView("add_cat")} className="text-gray-500">← Back</ActionBtn>
      </Sheet>
    );
  }

  if (view === "add_src") return (
    <Sheet onClose={onClose}>
      <GearHeader />
      <p className="px-4 py-2 text-xs text-gray-500">Source</p>
      {GEAR_SOURCES.map(s => (
        <ActionBtn key={s.id} onClick={() => doAdd(s.id)}>{s.label}</ActionBtn>
      ))}
      <ActionBtn onClick={() => setView("add_cat")} className="text-gray-500">← Back</ActionBtn>
    </Sheet>
  );

  if (view === "menu") return (
    <Sheet onClose={onClose}>
      <GearHeader />
      {pickup.category !== "artifact" && (
        <ActionBtn onClick={() => setView("edit_item")}>
          {pickup.itemName
            ? `✏️ Change item type (${pickup.itemName})`
            : "Set item type"}
        </ActionBtn>
      )}
      {pickup.category !== "artifact" && (
        <ActionBtn onClick={() => setView("level")}>
          {pickup.observedLevel
            ? `✏️ Change level (${pickup.observedLevel})`
            : "Set upgrade level"}
        </ActionBtn>
      )}
      <ActionBtn onClick={() => setView("effect")}>
        {pickup.observedEffect
          ? `✏️ Change ${pickup.category === "artifact" ? "curse status" : "effect"} (${pickup.observedEffect})`
          : `Set ${pickup.category === "artifact" ? "curse status" : "effect"}`}
      </ActionBtn>
      <ActionBtn onClick={doRemove} className="text-red-400">🗑 Remove</ActionBtn>
    </Sheet>
  );

  if (view === "edit_item") {
    const items = itemsForCategory(pickup.category);
    const tiers = [...new Set(items.map(i => i.tier))];
    return (
      <Sheet onClose={onClose}>
        <GearHeader />
        <ActionBtn onClick={() => doSetItemName(null)} className="text-gray-500">
          Clear — unknown item
        </ActionBtn>
        {tiers.map(tier => (
          <div key={tier}>
            <p className="px-4 pt-3 pb-1 text-xs text-gray-600 uppercase tracking-wide">Tier {tier}</p>
            {items.filter(i => i.tier === tier).map(i => (
              <ActionBtn
                key={i.name}
                onClick={() => doSetItemName(i.name)}
                className={i.name === pickup.itemName ? "text-yellow-400" : ""}
              >
                {i.name === pickup.itemName ? "✓ " : ""}{i.name}
              </ActionBtn>
            ))}
          </div>
        ))}
        <ActionBtn onClick={() => setView("menu")} className="text-gray-500">← Back</ActionBtn>
      </Sheet>
    );
  }

  if (view === "level") return (
    <Sheet onClose={onClose}>
      <GearHeader />
      {["+0", "+1", "+2"].map(lv => (
        <ActionBtn key={lv} onClick={() => doSetLevel(lv)}>{lv}</ActionBtn>
      ))}
      <ActionBtn onClick={() => setView("menu")} className="text-gray-500">← Back</ActionBtn>
    </Sheet>
  );

  if (view === "effect") {
    const effects = pickup.category === "artifact"
      ? ["cursed", "not cursed"]
      : pickup.category === "armor"
        ? ["plain", "cursed", "inscribed"]
        : ["plain", "cursed", "enchanted"];
    return (
      <Sheet onClose={onClose}>
        <GearHeader />
        {effects.map(ef => (
          <ActionBtn key={ef} onClick={() => doSetEffect(ef)}>{ef}</ActionBtn>
        ))}
        <ActionBtn onClick={() => setView("menu")} className="text-gray-500">← Back</ActionBtn>
      </Sheet>
    );
  }

  return null;
}
