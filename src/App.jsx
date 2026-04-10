import { useState, useMemo, useCallback } from "react";
import { computeProbabilities } from "./identifyEngine.js";
import { computeGearProbabilities } from "./gearEngine.js";
import { POTION_UNKNOWNS, SCROLL_UNKNOWNS } from "./items.js";
import {
  loadRunState, saveRunState,
  toEngineInput, toEngineConfig, toGearInput,
} from "./runState.js";
import { POTION_HINT_ROOMS } from "./specialRooms.js";
import { RunSetup } from "./components/RunSetup.jsx";
import { ItemActionSheet, GearActionSheet } from "./components/ActionSheet.jsx";
import { LibraryRoomSheet } from "./components/LibraryRoomSheet.jsx";
import { ItemSprite } from "./components/ItemSprite.jsx";
import { ProbBar } from "./components/ProbBar.jsx";

// ── Storage helpers ────────────────────────────────────────────────────────────

const STORAGE_KEY = "spdrun6";

function storageLoad() {
  try {
    const raw = (typeof window !== "undefined" && window.storage)
      ? window.storage.get(STORAGE_KEY)
      : localStorage.getItem(STORAGE_KEY);
    return raw ? loadRunState(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function storageSave(run) {
  try {
    const s = JSON.stringify(saveRunState(run));
    if (typeof window !== "undefined" && window.storage) {
      window.storage.set(STORAGE_KEY, s);
    } else {
      localStorage.setItem(STORAGE_KEY, s);
    }
  } catch {
    // storage not available
  }
}

// ── Log helpers ────────────────────────────────────────────────────────────────

function buildLogEntries(run) {
  const entries = [];

  for (const p of run.potionPickups) {
    entries.push({ type: "pickup", kind: "potion", id: p.id, sourceId: p.sourceId, floor: p.floor, _ref: p });
  }
  for (const s of run.scrollPickups) {
    entries.push({ type: "pickup", kind: "scroll", id: s.id, sourceId: s.sourceId, floor: s.floor, _ref: s });
  }
  for (const u of run.used) {
    entries.push({ type: "used", kind: u.itemType, id: u.id, floor: u.floor, observedEffect: u.observedEffect, _ref: u });
  }
  for (const r of run.stoneResults) {
    entries.push({ type: "stone", id: r.id, guessedName: r.guessedName, correct: r.correct, _ref: r });
  }
  for (const g of run.gearPickups) {
    entries.push({ type: "gear", id: g.id, category: g.category, sourceId: g.sourceId, floor: g.floor, _ref: g });
  }
  for (const h of run.hintRooms) {
    entries.push({ type: "hint", roomId: h.roomId, floor: h.floor, _ref: h });
  }
  return entries.reverse();
}

function undoLogEntry(entry, run) {
  const r = { ...run, identified: { ...run.identified } };

  if (entry.type === "pickup") {
    const key = entry.kind === "potion" ? "potionPickups" : "scrollPickups";
    r[key] = r[key].filter(x => x !== entry._ref);
  } else if (entry.type === "used") {
    r.used = r.used.filter(x => x !== entry._ref);
    if (entry.observedEffect) delete r.identified[entry.id];
  } else if (entry.type === "stone") {
    r.stoneResults = r.stoneResults.filter(x => x !== entry._ref);
    if (entry.correct) delete r.identified[entry.id];
  } else if (entry.type === "gear") {
    r.gearPickups = r.gearPickups.filter(x => x.id !== entry.id);
  } else if (entry.type === "hint") {
    r.hintRooms = r.hintRooms.filter(x => x !== entry._ref);
  }
  return r;
}

// ── Source label helper ────────────────────────────────────────────────────────

const SOURCE_LABELS = {
  floor_drop: "floor drop", chest: "chest/skeleton", golden_chest: "golden chest",
  tombstone: "tombstone (crypt)", flock_trap: "flock trap room", crystal_vault: "crystal vault",
  armory: "armory", boss: "boss", other: "other", npc: "NPC", alchemy: "alchemy",
};

// ── ItemChip ───────────────────────────────────────────────────────────────────

function ItemChip({ item, identified, probs, onClick }) {
  const topProb = probs?.[0];
  const candidateName = identified ?? topProb?.name ?? null;
  const confidence = identified ? 1.0 : (topProb?.probability ?? 0);
  const isIdentified = Boolean(identified);

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all active:scale-95
        ${isIdentified
          ? "border-yellow-500 bg-gray-800"
          : "border-gray-700 bg-gray-800/60"}`}
    >
      <ItemSprite sx={item.sx} sy={item.sy} scale={3} />
      <span className="text-xs text-gray-400 leading-tight">{item.label}</span>
      {candidateName && (
        <span className={`text-xs leading-tight font-medium ${isIdentified ? "text-yellow-400" : "text-gray-300"}`}>
          {candidateName}
        </span>
      )}
      <ProbBar dist={isIdentified ? null : probs} />
    </button>
  );
}

// ── ItemsTab ───────────────────────────────────────────────────────────────────

function ItemsTab({ kind, run, floor, probs, onChipTap }) {
  const items = kind === "potion" ? POTION_UNKNOWNS : SCROLL_UNKNOWNS;
  return (
    <div className="grid grid-cols-3 gap-2 p-3">
      {items.map(item => (
        <ItemChip
          key={item.id}
          item={item}
          identified={run.identified[item.id] ?? null}
          probs={probs?.[item.id] ?? null}
          onClick={() => onChipTap(item.id)}
        />
      ))}
    </div>
  );
}

// ── GearCard ───────────────────────────────────────────────────────────────────

const CATEGORY_ICONS = { weapon: "⚔️", armor: "🛡️", missile: "🏹", artifact: "🏺" };

function GearCard({ pickup, run, onClick }) {
  const dist = computeGearProbabilities(toGearInput(pickup, run));

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-3 bg-gray-800 border border-gray-700 rounded-xl active:scale-[0.98] transition-all"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">{CATEGORY_ICONS[pickup.category]}</span>
        <span className="text-sm font-semibold text-gray-100 capitalize">{pickup.category}</span>
        <span className="text-xs text-gray-500 ml-auto">F{pickup.floor} · {SOURCE_LABELS[pickup.sourceId] ?? pickup.sourceId}</span>
      </div>

      {pickup.category !== "artifact" && (
        pickup.observedLevel ? (
          <p className="text-xs text-yellow-400 mb-1">Level: {pickup.observedLevel}</p>
        ) : (
          <div className="mb-1">
            <p className="text-xs text-gray-500 mb-0.5">Upgrade level</p>
            <div className="flex gap-1">
              {dist.upgradeLevel.map(lp => (
                <div key={lp.label} className="flex-1 text-center">
                  <div className="text-xs text-gray-300">{lp.label}</div>
                  <div className="h-1 bg-gray-700 rounded-full overflow-hidden mt-0.5">
                    <div className="h-full bg-blue-500" style={{ width: `${Math.round(lp.probability * 100)}%` }} />
                  </div>
                  <div className="text-xs text-gray-500">{Math.round(lp.probability * 100)}%</div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {pickup.observedEffect ? (
        <p className="text-xs text-yellow-400">{pickup.category === "artifact" ? "Curse" : "Effect"}: {pickup.observedEffect}</p>
      ) : (
        <div>
          <p className="text-xs text-gray-500 mb-0.5">{pickup.category === "artifact" ? "Curse" : "Effect"}</p>
          <div className="flex gap-1">
            {dist.effect.map(ep => (
              <div key={ep.label} className="flex-1 text-center">
                <div className="text-xs text-gray-300 truncate">{ep.label}</div>
                <div className="h-1 bg-gray-700 rounded-full overflow-hidden mt-0.5">
                  <div className="h-full bg-purple-500" style={{ width: `${Math.round(ep.probability * 100)}%` }} />
                </div>
                <div className="text-xs text-gray-500">{Math.round(ep.probability * 100)}%</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </button>
  );
}

// ── GearTab ────────────────────────────────────────────────────────────────────

function GearTab({ run, onAddGear, onEditGear }) {
  return (
    <div className="p-3 flex flex-col gap-3">
      <button
        onClick={onAddGear}
        className="w-full py-3 border border-dashed border-gray-600 rounded-xl text-sm text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-colors"
      >
        + Add gear pickup
      </button>
      {run.gearPickups.length === 0 && (
        <p className="text-center text-sm text-gray-600 py-4">No gear recorded yet</p>
      )}
      {[...run.gearPickups].reverse().map(pickup => (
        <GearCard key={pickup.id} pickup={pickup} run={run} onClick={() => onEditGear(pickup)} />
      ))}
    </div>
  );
}

// ── LogEntry ───────────────────────────────────────────────────────────────────

function LogEntryRow({ entry, run, onUndo }) {
  const isPotion = entry.id?.startsWith("p");
  const items = isPotion ? POTION_UNKNOWNS : SCROLL_UNKNOWNS;
  const item = items?.find(i => i.id === entry.id);
  const identifiedName = entry.id ? run.identified[entry.id] : null;

  let label = "";
  if (entry.type === "pickup") {
    label = `Picked up ${item?.label ?? entry.id} from ${SOURCE_LABELS[entry.sourceId] ?? entry.sourceId} on F${entry.floor}`;
    if (identifiedName) label += ` (${identifiedName})`;
  } else if (entry.type === "used") {
    label = `Used ${item?.label ?? entry.id} on F${entry.floor}`;
    if (entry.observedEffect) label += ` → ${entry.observedEffect}`;
  } else if (entry.type === "stone") {
    label = `Stone: ${item?.label ?? entry.id} guessed "${entry.guessedName}" — ${entry.correct ? "correct" : "wrong"}`;
  } else if (entry.type === "gear") {
    label = `Found ${entry.category} on F${entry.floor} (${SOURCE_LABELS[entry.sourceId] ?? entry.sourceId})`;
  } else if (entry.type === "hint") {
    const room = POTION_HINT_ROOMS.find(r => r.id === entry.roomId);
    label = `Saw ${room?.name ?? entry.roomId} on F${entry.floor}`;
  }

  return (
    <div className="flex items-start gap-2 px-3 py-2.5 border-b border-gray-800">
      {item && <div className="mt-0.5 shrink-0"><ItemSprite sx={item.sx} sy={item.sy} scale={1.5} /></div>}
      <p className="text-xs text-gray-300 flex-1 leading-relaxed">{label}</p>
      <button
        onClick={onUndo}
        className="text-xs text-gray-600 hover:text-red-400 transition-colors shrink-0"
        title="Undo"
      >
        ×
      </button>
    </div>
  );
}

function LogTab({ run, onUndo }) {
  const entries = buildLogEntries(run);
  if (entries.length === 0) {
    return <p className="text-center text-sm text-gray-600 py-10">No events recorded yet</p>;
  }
  return (
    <div>
      {entries.map((entry, i) => (
        <LogEntryRow key={i} entry={entry} run={run} onUndo={() => onUndo(entry)} />
      ))}
    </div>
  );
}

// ── HintRoomPicker ─────────────────────────────────────────────────────────────

function HintRoomPicker({ floor, run, onClose, onUpdate }) {
  const activeOnFloor = run.hintRooms.filter(h => h.floor === floor).map(h => h.roomId);

  function toggle(roomId) {
    let updated;
    if (activeOnFloor.includes(roomId)) {
      updated = { ...run, hintRooms: run.hintRooms.filter(h => !(h.floor === floor && h.roomId === roomId)) };
    } else {
      updated = { ...run, hintRooms: [...run.hintRooms, { roomId, floor }] };
    }
    onUpdate(updated);
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 rounded-t-2xl">
        <div className="flex items-center px-4 py-3 border-b border-gray-800">
          <p className="text-sm font-semibold text-gray-100">Hint rooms on F{floor}</p>
          <button onClick={onClose} className="ml-auto text-gray-500 hover:text-gray-300 text-xl leading-none">×</button>
        </div>
        {POTION_HINT_ROOMS.map(room => (
          <button
            key={room.id}
            onClick={() => toggle(room.id)}
            className={`w-full text-left px-4 py-3 text-sm border-b border-gray-800 transition-colors
              ${activeOnFloor.includes(room.id) ? "text-yellow-400 bg-gray-800" : "text-gray-300 hover:bg-gray-800"}`}
          >
            {activeOnFloor.includes(room.id) ? "✓ " : ""}{room.name}
          </button>
        ))}
      </div>
    </>
  );
}

// ── Header ─────────────────────────────────────────────────────────────────────

const FLOORS = Array.from({ length: 26 }, (_, i) => i + 1);

function Header({ floor, run, onFloorChange, onNewRun, onRoomPickerOpen, onLibraryAdd, onLibraryEdit, onLibraryRemove }) {
  const activeHintRooms = run.hintRooms.filter(h => h.floor === floor);
  const activeLibraryRooms = (run.libraryRooms ?? []).filter(l => l.floor === floor);

  return (
    <div className="sticky top-0 z-30 bg-gray-950 border-b border-gray-800">
      {/* Floor strip */}
      <div className="flex items-center gap-1 px-2 py-2 overflow-x-auto scrollbar-hide">
        <span className="text-xs text-gray-500 shrink-0 mr-1">F</span>
        {FLOORS.map(f => (
          <button
            key={f}
            onClick={() => onFloorChange(f)}
            className={`shrink-0 w-7 h-7 text-xs rounded-lg font-medium transition-colors
              ${f === floor ? "bg-yellow-500 text-gray-950" : "text-gray-400 hover:bg-gray-800"}`}
          >
            {f}
          </button>
        ))}
        <button
          onClick={onNewRun}
          className="shrink-0 ml-2 px-2 h-7 text-xs text-gray-500 border border-gray-700 rounded-lg hover:border-gray-500 hover:text-gray-300 transition-colors"
        >
          New
        </button>
      </div>

      {/* Hint rooms + Library rooms */}
      <div className="flex items-center gap-1.5 px-2 pb-2 overflow-x-auto scrollbar-hide">
        {activeHintRooms.map(h => {
          const room = POTION_HINT_ROOMS.find(r => r.id === h.roomId);
          return (
            <span key={h.roomId} className="shrink-0 px-2 py-0.5 bg-yellow-900/40 border border-yellow-700/50 text-yellow-300 text-xs rounded-full">
              {room?.name ?? h.roomId}
            </span>
          );
        })}
        {activeLibraryRooms.map((lib, i) => {
          const labels = lib.scrollIds.map(id =>
            SCROLL_UNKNOWNS.find(s => s.id === id)?.label ?? id
          );
          return (
            <span
              key={i}
              className="shrink-0 flex items-center gap-1 pl-2 pr-1 py-0.5 bg-blue-900/40 border border-blue-700/50 text-blue-300 text-xs rounded-full cursor-pointer hover:border-blue-500"
              onClick={() => onLibraryEdit(lib)}
            >
              📚 {labels.join(", ")}
              <button
                onClick={e => { e.stopPropagation(); onLibraryRemove(lib); }}
                className="text-blue-500 hover:text-red-400 ml-0.5 leading-none"
              >
                ×
              </button>
            </span>
          );
        })}
        <button
          onClick={onRoomPickerOpen}
          className="shrink-0 px-2 py-0.5 border border-gray-700 text-gray-500 text-xs rounded-full hover:border-gray-500 hover:text-gray-400 transition-colors"
        >
          + room
        </button>
        <button
          onClick={onLibraryAdd}
          className="shrink-0 px-2 py-0.5 border border-gray-700 text-gray-500 text-xs rounded-full hover:border-blue-600 hover:text-blue-400 transition-colors"
        >
          + library
        </button>
      </div>
    </div>
  );
}

// ── TabBar ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "potions", label: "Potions", icon: "🧪" },
  { id: "scrolls", label: "Scrolls", icon: "📜" },
  { id: "gear",    label: "Gear",    icon: "⚔️" },
  { id: "log",     label: "Log",     icon: "📋" },
];

function TabBar({ active, onChange }) {
  return (
    <div className="sticky bottom-0 z-30 bg-gray-950 border-t border-gray-800 flex">
      {TABS.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs transition-colors
            ${t.id === active ? "text-yellow-400" : "text-gray-500 hover:text-gray-400"}`}
        >
          <span>{t.icon}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────────

export default function App() {
  const [run, setRunRaw] = useState(() => storageLoad() ?? null);
  const [floor, setFloor] = useState(1);
  const [tab, setTab] = useState("potions");
  const [sheet, setSheet] = useState(null); // { type: "item", id } | { type: "gear_add" } | { type: "gear_edit", pickup }
  const [showRoomPicker, setShowRoomPicker] = useState(false);
  const [librarySheet, setLibrarySheet] = useState(null); // null | { existing: string[]|null }
  const [confirmNewRun, setConfirmNewRun] = useState(false);

  function setRun(updated) {
    setRunRaw(updated);
    storageSave(updated);
  }

  // Compute probabilities from run state
  const probs = useMemo(() => {
    if (!run) return { potions: {}, scrolls: {} };
    const engineInput = toEngineInput(run);
    const engineConfig = toEngineConfig(run);
    return computeProbabilities(engineInput, engineConfig);
  }, [run]);

  // Build per-item prob map: { p1: [{name, probability}], ... }
  const itemProbMap = useMemo(() => {
    if (!run) return {};
    const map = {};
    for (const item of POTION_UNKNOWNS) {
      map[item.id] = probs.potions?.[item.id] ?? [];
    }
    for (const item of SCROLL_UNKNOWNS) {
      map[item.id] = probs.scrolls?.[item.id] ?? [];
    }
    return map;
  }, [probs]);

  const handleRunComplete = useCallback((newRun) => {
    setRun(newRun);
    setConfirmNewRun(false);
  }, []);

  function handleSheetUpdate(newRun) {
    setRun(newRun);
  }

  function handleUndo(entry) {
    setRun(undoLogEntry(entry, run));
  }

  // Show RunSetup if no run or if user wants a new run
  if (!run || confirmNewRun) {
    return <RunSetup onComplete={handleRunComplete} />;
  }

  return (
    <div className="min-h-dvh bg-gray-950 flex flex-col text-gray-100">
      <Header
        floor={floor}
        run={run}
        onFloorChange={setFloor}
        onNewRun={() => setConfirmNewRun(true)}
        onRoomPickerOpen={() => setShowRoomPicker(true)}
        onLibraryAdd={() => setLibrarySheet({ existing: null })}
        onLibraryEdit={lib => setLibrarySheet({ existing: lib.scrollIds })}
        onLibraryRemove={lib => setRun({
          ...run,
          libraryRooms: run.libraryRooms.filter(l => l !== lib),
        })}
      />

      <div className="flex-1 overflow-y-auto pb-2">
        {tab === "potions" && (
          <ItemsTab
            kind="potion"
            run={run}
            floor={floor}
            probs={itemProbMap}
            onChipTap={id => setSheet({ type: "item", id })}
          />
        )}
        {tab === "scrolls" && (
          <ItemsTab
            kind="scroll"
            run={run}
            floor={floor}
            probs={itemProbMap}
            onChipTap={id => setSheet({ type: "item", id })}
          />
        )}
        {tab === "gear" && (
          <GearTab
            run={run}
            onAddGear={() => setSheet({ type: "gear_add" })}
            onEditGear={pickup => setSheet({ type: "gear_edit", pickup })}
          />
        )}
        {tab === "log" && (
          <LogTab run={run} onUndo={handleUndo} />
        )}
      </div>

      <TabBar active={tab} onChange={setTab} />

      {/* Action sheets */}
      {sheet?.type === "item" && (
        <ItemActionSheet
          itemId={sheet.id}
          run={run}
          floor={floor}
          probs={itemProbMap[sheet.id] ?? []}
          onUpdate={handleSheetUpdate}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet?.type === "gear_add" && (
        <GearActionSheet
          pickup={null}
          run={run}
          floor={floor}
          onUpdate={handleSheetUpdate}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet?.type === "gear_edit" && (
        <GearActionSheet
          pickup={sheet.pickup}
          run={run}
          floor={floor}
          onUpdate={handleSheetUpdate}
          onClose={() => setSheet(null)}
        />
      )}

      {/* Library room sheet */}
      {librarySheet && (
        <LibraryRoomSheet
          floor={floor}
          existing={librarySheet.existing}
          run={run}
          onUpdate={updated => { setRun(updated); }}
          onClose={() => setLibrarySheet(null)}
        />
      )}

      {/* Hint room picker */}
      {showRoomPicker && (
        <HintRoomPicker
          floor={floor}
          run={run}
          onClose={() => setShowRoomPicker(false)}
          onUpdate={updated => { setRun(updated); }}
        />
      )}
    </div>
  );
}
