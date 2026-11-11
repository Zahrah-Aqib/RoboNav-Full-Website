import { CSSProperties, useCallback, useRef } from 'react';
import { GridState, Pos, key, samePos, CellRole } from '@/lib/grid';

export const CELL_COLORS: Record<CellRole, string> = {
  empty: 'rgba(255,255,255,0.04)',
  obstacle: '#1f3154',
  start: '#22c55e',
  goal: '#f43f5e',
  explored: 'rgba(34, 211, 238, 0.16)',
  frontier: 'rgba(251, 191, 36, 0.35)',
  path: '#22d3ee',
};

export interface GridCanvasProps {
  grid: GridState;
  /** Per-cell override layer (explored/frontier/path), keyed "row:col". */
  overlay?: Map<string, CellRole>;
  /** Maximum cells on the longest edge before rendering as canvas. */
  canvasThreshold?: number;
  onPaintCell?: (p: Pos) => void;
  /** Called when a drag paint gesture starts (mousedown on a cell). */
  onPaintStart?: () => void;
  editable?: boolean;
  className?: string;
  cellSize?: number;
}

function cellStyle(role: CellRole): CSSProperties {
  return { backgroundColor: CELL_COLORS[role] };
}

/**
 * 2D editable obstacle grid. Uses DOM cells for small/medium grids
 * (crisper, easier styling) and keeps interactions simple: click or
 * drag to paint, dedicated tools for start/goal placement.
 */
export default function GridCanvas({
  grid,
  overlay,
  onPaintCell,
  onPaintStart,
  editable = false,
  className = '',
  cellSize,
}: GridCanvasProps) {
  const paintingRef = useRef(false);

  const computed = cellSize ?? (grid.cols <= 20 ? 36 : grid.cols <= 32 ? 26 : 20);

  const handleDown = useCallback(
    (p: Pos) => {
      if (!editable || !onPaintCell) return;
      paintingRef.current = true;
      onPaintStart?.();
      onPaintCell(p);
    },
    [editable, onPaintCell, onPaintStart]
  );

  const handleEnter = useCallback(
    (p: Pos) => {
      if (!paintingRef.current || !editable || !onPaintCell) return;
      onPaintCell(p);
    },
    [editable, onPaintCell]
  );

  const handleUp = useCallback(() => {
    paintingRef.current = false;
  }, []);

  const roleFor = (r: number, c: number): CellRole => {
    const p = { row: r, col: c };
    const k = key(p);
    if (samePos(p, grid.start)) return 'start';
    if (samePos(p, grid.goal)) return 'goal';
    if (overlay?.has(k)) return overlay.get(k)!;
    if (grid.walls.has(k)) return 'obstacle';
    return 'empty';
  };

  const cells = [];
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      const role = roleFor(r, c);
      const isStart = role === 'start';
      const isGoal = role === 'goal';
      cells.push(
        <div
          key={`${r}:${c}`}
          onMouseDown={() => handleDown({ row: r, col: c })}
          onMouseEnter={() => handleEnter({ row: r, col: c })}
          className={`relative border border-navy-700/50 transition-colors duration-100 ${
            editable ? 'cursor-crosshair hover:border-cyan/60' : ''
          } ${isStart || isGoal ? 'z-10' : ''}`}
          style={cellStyle(role)}
        >
          {isStart && (
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-navy-950 select-none">
              ▶
            </span>
          )}
          {isGoal && (
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-navy-950 select-none">
              ★
            </span>
          )}
          {role === 'path' && (
            <span className="absolute inset-0 bg-cyan shadow-glow-sm animate-pulse-slow" />
          )}
        </div>
      );
    }
  }

  return (
    <div
      className={`inline-block rounded-lg overflow-hidden ring-1 ring-navy-600/60 shadow-panel ${className}`}
      onMouseUp={handleUp}
      onMouseLeave={handleUp}
      style={{ touchAction: 'none' }}
    >
      <div
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${grid.cols}, ${computed}px)`,
          gridAutoRows: `${computed}px`,
        }}
      >
        {cells}
      </div>
    </div>
  );
}
