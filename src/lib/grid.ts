/**
 * Grid model shared by every interactive page.
 * Pure data + helpers — no search logic. The actual path planning
 * is (or will be) executed by the Python / FastAPI backend.
 */

export type Heuristic = 'manhattan' | 'euclidean';
export type PaintTool = 'wall' | 'erase' | 'start' | 'goal';

export interface Pos {
  row: number;
  col: number;
}

/** Cells flagged by the planner (or, for now, the demo runner). */
export type CellRole =
  | 'empty'
  | 'obstacle'
  | 'start'
  | 'goal'
  | 'explored'
  | 'frontier'
  | 'path';

export interface GridState {
  rows: number;
  cols: number;
  /** Obstacle coordinates as "row:col" keys for cheap lookups. */
  walls: Set<string>;
  start: Pos;
  goal: Pos;
}

export const key = (p: Pos): string => `${p.row}:${p.col}`;
export const parseKey = (k: string): Pos => {
  const [row, col] = k.split(':').map(Number);
  return { row, col };
};
export const inBounds = (g: Pick<GridState, 'rows' | 'cols'>, p: Pos): boolean =>
  p.row >= 0 && p.row < g.rows && p.col >= 0 && p.col < g.cols;

export const samePos = (a: Pos, b: Pos): boolean => a.row === b.row && a.col === b.col;

/** 4-direction movement is the default; this is the neighbor set the backend uses. */
export const neighbors4 = (p: Pos): Pos[] => [
  { row: p.row - 1, col: p.col },
  { row: p.row + 1, col: p.col },
  { row: p.row, col: p.col - 1 },
  { row: p.row, col: p.col + 1 },
];

/** Manhattan distance — admissible for 4-direction movement with unit costs. */
export const manhattan = (a: Pos, b: Pos): number =>
  Math.abs(a.row - b.row) + Math.abs(a.col - b.col);

/** Euclidean distance — used as a comparison heuristic in the demo. */
export const euclidean = (a: Pos, b: Pos): number =>
  Math.sqrt((a.row - b.row) ** 2 + (a.col - b.col) ** 2);

export function heuristicDistance(name: Heuristic, a: Pos, b: Pos): number {
  return name === 'manhattan' ? manhattan(a, b) : euclidean(a, b);
}

export function createGrid(rows: number, cols: number): GridState {
  return {
    rows,
    cols,
    walls: new Set<string>(),
    start: { row: Math.floor(rows / 2), col: 1 },
    goal: { row: Math.floor(rows / 2), col: cols - 2 },
  };
}

/** Randomly sprinkle obstacles; keeps start and goal cells clear. */
export function randomizeWalls(grid: GridState, density: number): Set<string> {
  const walls = new Set<string>();
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      const p = { row: r, col: c };
      if (samePos(p, grid.start) || samePos(p, grid.goal)) continue;
      if (Math.random() < density) walls.add(key(p));
    }
  }
  return walls;
}

/** Clamp / repair grid state after a dimension change. */
/** Resize a grid without leaving obstacles on the start or goal cells. */
export function resizeGrid(grid: GridState, rows: number, cols: number): GridState {
  const next = createGrid(rows, cols);

  // Keep valid existing obstacle coordinates.
  const walls = new Set<string>();
  grid.walls.forEach((cell) => {
    if (inBounds({ rows, cols }, parseKey(cell))) walls.add(cell);
  });

  // Keep the start/goal in bounds even when shrinking the map.
  next.start = {
    row: Math.max(0, Math.min(grid.start.row, rows - 1)),
    col: Math.max(0, Math.min(grid.start.col, cols - 1)),
  };
  next.goal = {
    row: Math.max(0, Math.min(grid.goal.row, rows - 1)),
    col: Math.max(0, Math.min(grid.goal.col, cols - 1)),
  };

  // Avoid making the goal occupy the start after resizing.
  if (samePos(next.start, next.goal)) {
    next.goal = {
      row: next.goal.row,
      col: next.goal.col === cols - 1 ? 0 : cols - 1,
    };
  }

  // A start/goal may not be an obstacle.
  walls.delete(key(next.start));
  walls.delete(key(next.goal));
  next.walls = walls;
  return next;
}
