// ── Potion and scroll display definitions ✅ VERIFIED from ItemSpriteSheet.java ──
//
// Sprite atlas: public/items.png (256×512 px, 16×16 px cells)
// Formula: POTIONS = xy(1,23) → row 22 (0-indexed) → sy = 22*16 = 352
//          SCROLLS = xy(1,20) → row 19               → sy = 19*16 = 304
//          sx = atlasColumnIndex * 16
//
// Atlas column order (from ItemSpriteSheet.java):
//   Potions: Crimson(0) Amber(1) Golden(2) Jade(3) Turquoise(4) Azure(5)
//            Indigo(6) Magenta(7) Bistre(8) Charcoal(9) Silver(10) Ivory(11)
//   Scrolls: Kaunan(0) Sowilo(1) Laguz(2) Yngvi(3) Gyfu(4) Raido(5)
//            Isaz(6) Mannaz(7) Naudiz(8) Berkanan(9) Odal(10) Tiwaz(11)
//
// ID ordering (p1-p12, s1-s12) matches the original POTION_UNKNOWNS / SCROLL_UNKNOWNS
// constants in the legacy App.jsx.

export const POTION_UNKNOWNS = [
  { id: "p1",  label: "Turquoise", sx: 64,  sy: 352 },
  { id: "p2",  label: "Crimson",   sx: 0,   sy: 352 },
  { id: "p3",  label: "Azure",     sx: 80,  sy: 352 },
  { id: "p4",  label: "Jade",      sx: 48,  sy: 352 },
  { id: "p5",  label: "Golden",    sx: 32,  sy: 352 },
  { id: "p6",  label: "Magenta",   sx: 112, sy: 352 },
  { id: "p7",  label: "Charcoal",  sx: 144, sy: 352 },
  { id: "p8",  label: "Bistre",    sx: 128, sy: 352 },
  { id: "p9",  label: "Amber",     sx: 16,  sy: 352 },
  { id: "p10", label: "Ivory",     sx: 176, sy: 352 },
  { id: "p11", label: "Silver",    sx: 160, sy: 352 },
  { id: "p12", label: "Indigo",    sx: 96,  sy: 352 },
];

export const SCROLL_UNKNOWNS = [
  { id: "s1",  label: "YNGVI",    sx: 48,  sy: 304 },
  { id: "s2",  label: "RAIDO",    sx: 80,  sy: 304 },
  { id: "s3",  label: "LAGUZ",    sx: 32,  sy: 304 },
  { id: "s4",  label: "NAUDIZ",   sx: 128, sy: 304 },
  { id: "s5",  label: "GYFU",     sx: 64,  sy: 304 },
  { id: "s6",  label: "SOWILO",   sx: 16,  sy: 304 },
  { id: "s7",  label: "MANNAZ",   sx: 112, sy: 304 },
  { id: "s8",  label: "KAUNAN",   sx: 0,   sy: 304 },
  { id: "s9",  label: "ISAZ",     sx: 96,  sy: 304 },
  { id: "s10", label: "BERKANAN", sx: 144, sy: 304 },
  { id: "s11", label: "ODAL",     sx: 160, sy: 304 },
  { id: "s12", label: "TIWAZ",    sx: 176, sy: 304 },
];
