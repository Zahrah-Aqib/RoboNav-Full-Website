/**
 * Tiny dependency-free bar chart used in the Experiment Lab.
 * Drawn with divs — keeps the bundle small and the styling consistent
 * with the glass theme.
 */
export interface BarDatum {
  label: string;
  value: number;
  /** Secondary series value (e.g. the other algorithm), drawn behind. */
  compareValue?: number;
}

export interface BarChartProps {
  data: BarDatum[];
  unit?: string;
  colorA?: string;
  colorB?: string;
  height?: number;
}

export function BarChart({
  data,
  unit = '',
  colorA = '#22d3ee',
  colorB = 'rgba(251, 191, 36, 0.75)',
  height = 180,
}: BarChartProps) {
  const max = Math.max(...data.map((d) => Math.max(d.value, d.compareValue ?? 0)), 1);

  return (
    <div className="flex items-end gap-4 overflow-x-auto pb-2" style={{ minHeight: height + 34 }}>
      {data.map((d) => (
        <div key={d.label} className="flex flex-col items-center gap-1.5 min-w-[64px] flex-1">
          <div className="w-full flex items-end justify-center gap-1" style={{ height }}>
            {d.compareValue !== undefined && (
              <div
                className="w-1/2 rounded-t-md transition-all duration-500 relative group"
                style={{ height: `${(d.compareValue / max) * 100}%`, backgroundColor: colorB }}
                title={`${d.label}: ${d.compareValue}${unit}`}
              >
                <span className="absolute -top-5 inset-x-0 text-center text-[10px] font-mono text-amber-300/90 opacity-0 group-hover:opacity-100 transition">
                  {d.compareValue}{unit}
                </span>
              </div>
            )}
            <div
              className="w-1/2 rounded-t-md transition-all duration-500 relative group shadow-glow-sm"
              style={{ height: `${(d.value / max) * 100}%`, backgroundColor: colorA }}
              title={`${d.label}: ${d.value}${unit}`}
            >
              <span className="absolute -top-5 inset-x-0 text-center text-[10px] font-mono text-cyan-soft opacity-0 group-hover:opacity-100 transition">
                {d.value}{unit}
              </span>
            </div>
          </div>
          <span className="text-[11px] text-slate-400 text-center leading-tight max-w-[90px]">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/** Simple line-ish trend rendered as connected bars over a row index. */
export function TrendChart({
  values,
  labels,
  color = '#22d3ee',
  unit = '',
  height = 140,
}: {
  values: number[];
  labels?: string[];
  color?: string;
  unit?: string;
  height?: number;
}) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {values.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col justify-end group relative">
          <div
            className="rounded-t-sm transition-all duration-300 group-hover:brightness-125"
            style={{ height: `${(v / max) * 100}%`, backgroundColor: color, minHeight: 2 }}
            title={labels?.[i] ? `${labels[i]}: ${v}${unit}` : `${v}${unit}`}
          />
        </div>
      ))}
    </div>
  );
}
