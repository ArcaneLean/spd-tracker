/**
 * A thin horizontal bar showing the top candidate's probability as a fill.
 * Colour shifts from gray (uncertain) → yellow (confident).
 *
 * @param {{ dist: Array<{name:string, probability:number}> }} props
 */
export function ProbBar({ dist }) {
  if (!dist || dist.length === 0) return <div className="h-1 w-full" />;
  const top = dist[0].probability;
  const pct = Math.round(top * 100);
  const color = top >= 0.8 ? "bg-yellow-400" : top >= 0.5 ? "bg-yellow-600" : "bg-gray-600";
  return (
    <div className="h-1 w-full bg-gray-700 rounded-full overflow-hidden">
      <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}
