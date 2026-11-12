import { useCallback, useRef } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import { Bot } from 'lucide-react';
import type { GridState, Pos, CellRole } from '@/lib/grid';
import { key, samePos } from '@/lib/grid';

const CELL_COLORS: Record<CellRole, string> = {
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
  overlay?: Map<string, CellRole>;
  /** A real robot marker that advances along the planned path. */
  robotPosition?: Pos;
  onPaintCell?: (position: Pos) => void;
  onPaintStart?: () => void;
  editable?: boolean;
  className?: string;
  cellSize?: number;
}

function cellStyle(role: CellRole): CSSProperties {
  return { backgroundColor: CELL_COLORS[role] };
}

/** Draw and edit a 2D obstacle grid using mouse, touch or a stylus. */
export default function GridCanvas({
  grid,
  overlay,
  robotPosition,
  onPaintCell,
  onPaintStart,
  editable = false,
  className = '',
  cellSize,
}: GridCanvasProps) {
  const paintingRef = useRef(false);
  const lastPaintRef = useRef('');
  const gridRef = useRef<HTMLDivElement>(null);

  const computed = cellSize ?? (grid.cols <= 20 ? 36 : grid.cols <= 32 ? 26 : 20);

  const paintCell = useCallback((position: Pos) => {
    if (!editable || !onPaintCell) return;
    // Avoid repainting a cell on every small pointer movement.
    const id = key(position);
    if (id === lastPaintRef.current) return;
    lastPaintRef.current = id;
    onPaintCell(position);
  }, [editable, onPaintCell]);

  const handlePointerDown = (position: Pos) => {
    if (!editable) return;
    paintingRef.current = true;
    lastPaintRef.current = '';
    onPaintStart?.();
    paintCell(position);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!paintingRef.current || !editable || !gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const row = Math.floor((event.clientY - rect.top) / computed);
    const col = Math.floor((event.clientX - rect.left) / computed);
    if (row >= 0 && row < grid.rows && col >= 0 && col < grid.cols) {
      paintCell({ row, col });
    }
  };

  const stopPainting = () => {
    paintingRef.current = false;
    lastPaintRef.current = '';
  };

  const roleFor = (position: Pos): CellRole => {
    const id = key(position);
    if (samePos(position, grid.start)) return 'start';
    if (samePos(position, grid.goal)) return 'goal';
    if (overlay?.has(id)) return overlay.get(id)!;
    if (grid.walls.has(id)) return 'obstacle';
    return 'empty';
  };

  const cells = [];
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const position = { row, col };
      const role = roleFor(position);
      const isStart = role === 'start';
      const isGoal = role === 'goal';
      const isRobot = !!robotPosition && samePos(position, robotPosition);

      cells.push(
        <div
          key={row + ':' + col}
          onPointerDown={() => handlePointerDown(position)}
          className={
            'relative border border-navy-700/50 transition-colors duration-100 ' +
            (editable ? 'cursor-crosshair hover:border-cyan/60 ' : '') +
            (isStart || isGoal ? 'z-10' : '')
          }
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
            <span className="absolute inset-0 bg-cyan/75 shadow-glow-sm animate-pulse-slow" />
          )}
          {isRobot && (
            <span className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none">
              <span className="rounded-md bg-cyan-dim text-white border border-white/60 shadow-glow-sm p-0.5">
                <Bot size={Math.max(11, Math.round(computed * 0.5))} strokeWidth={2.5}/>
              </span>
            </span>
          )}
        </div>
      );
    }
  }

  return (
    <div
      ref={gridRef}
      className={'inline-block rounded-lg overflow-hidden ring-1 ring-navy-600/60 shadow-panel ' + className}
      onPointerMove={handlePointerMove}
      onPointerUp={stopPainting}
      onPointerCancel={stopPainting}
      onPointerLeave={stopPainting}
      style={{ touchAction: 'none' }}
    >
      <div className="grid"
        style={{
          gridTemplateColumns: 'repeat(' + grid.cols + ', ' + computed + 'px)',
          gridAutoRows: computed + 'px',
        }}
      >
        {cells}
      </div>
    </div>
  );
}
