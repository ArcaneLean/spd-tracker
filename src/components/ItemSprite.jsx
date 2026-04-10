/**
 * Renders one 16×16 sprite from the items.png atlas at a given scale.
 * Default scale=3 produces a 48×48px output with pixel-perfect scaling.
 */
export function ItemSprite({ sx, sy, scale = 3 }) {
  const size = 16 * scale;
  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundImage: "url(/items.png)",
        backgroundPosition: `-${sx * scale}px -${sy * scale}px`,
        backgroundSize: `${256 * scale}px ${512 * scale}px`,
        imageRendering: "pixelated",
        flexShrink: 0,
      }}
    />
  );
}
