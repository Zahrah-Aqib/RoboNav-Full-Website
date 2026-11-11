/**
 * Mock demonstration data — NOT real experimental results.
 *
 * These fixtures exist so the UI can be reviewed and styled before the
 * Python FastAPI planning backend is connected. Every page that renders
 * these numbers labels them as "demo data" on screen. Do not cite them
 * in reports or presentations.
 */
import type { GridState, Heuristic } from './grid';
import { generateDemoRun, RunResult } from './demoRun';

export interface ExperimentRow {
  id: number;
  mapName: string;
  rows: number;
  cols: number;
  density: number;
  algorithm: 'astar' | 'greedy';
  heuristic: Heuristic;
  pathCost: number;
  nodesExpanded: number;
  maxFrontier: number;
  executionTimeMs: number;
}

/**
 * Hand-written illustrative rows for the Experiment Lab. Values are
 * invented for layout purposes and carry no scientific meaning.
 */
export const MOCK_EXPERIMENT_ROWS: ExperimentRow[] = [
  { id: 1, mapName: 'Corridor Wall', rows: 12, cols: 16, density: 0.15, algorithm: 'astar', heuristic: 'manhattan', pathCost: 26, nodesExpanded: 61, maxFrontier: 14, executionTimeMs: 0.42 },
  { id: 2, mapName: 'Corridor Wall', rows: 12, cols: 16, density: 0.15, algorithm: 'greedy', heuristic: 'manhattan', pathCost: 26, nodesExpanded: 38, maxFrontier: 9, executionTimeMs: 0.27 },
  { id: 3, mapName: 'Maze Rooms', rows: 12, cols: 16, density: 0.3, algorithm: 'astar', heuristic: 'manhattan', pathCost: 30, nodesExpanded: 88, maxFrontier: 21, executionTimeMs: 0.61 },
  { id: 4, mapName: 'Maze Rooms', rows: 12, cols: 16, density: 0.3, algorithm: 'greedy', heuristic: 'manhattan', pathCost: 38, nodesExpanded: 52, maxFrontier: 13, executionTimeMs: 0.35 },
  { id: 5, mapName: 'Scattered Blocks', rows: 12, cols: 16, density: 0.2, algorithm: 'astar', heuristic: 'euclidean', pathCost: 22, nodesExpanded: 74, maxFrontier: 18, executionTimeMs: 0.55 },
  { id: 6, mapName: 'Scattered Blocks', rows: 12, cols: 16, density: 0.2, algorithm: 'greedy', heuristic: 'euclidean', pathCost: 26, nodesExpanded: 44, maxFrontier: 11, executionTimeMs: 0.31 },
  { id: 7, mapName: 'Greedy Trap', rows: 9, cols: 16, density: 0.28, algorithm: 'astar', heuristic: 'manhattan', pathCost: 24, nodesExpanded: 79, maxFrontier: 19, executionTimeMs: 0.58 },
  { id: 8, mapName: 'Greedy Trap', rows: 9, cols: 16, density: 0.28, algorithm: 'greedy', heuristic: 'manhattan', pathCost: 44, nodesExpanded: 57, maxFrontier: 15, executionTimeMs: 0.4 },
  { id: 9, mapName: 'Empty Field', rows: 12, cols: 16, density: 0, algorithm: 'astar', heuristic: 'manhattan', pathCost: 25, nodesExpanded: 39, maxFrontier: 8, executionTimeMs: 0.24 },
  { id: 10, mapName: 'Empty Field', rows: 12, cols: 16, density: 0, algorithm: 'greedy', heuristic: 'manhattan', pathCost: 25, nodesExpanded: 25, maxFrontier: 5, executionTimeMs: 0.16 },
];

/**
 * Paired mock comparison for the Algorithm Comparison page. Both sides
 * are generated from the same deterministic demo runner so the
 * animation, path, and stats line up with what the user sees.
 */
export function MOCK_COMPARE_RESPONSE(
  grid: GridState,
  heuristic: Heuristic
): { astar: RunResult; greedy: RunResult; timings: { astar: number; greedy: number } } {
  const astar = generateDemoRun(grid, {
    wandering: 0.35,
    seedLabel: `astar:${heuristic}:${grid.rows}x${grid.cols}:${grid.walls.size}:${grid.start.row}:${grid.goal.row}`,
  });
  const greedy = generateDemoRun(grid, {
    wandering: 3.2,
    seedLabel: `greedy:${heuristic}:${grid.rows}x${grid.cols}:${grid.walls.size}:${grid.start.row}:${grid.goal.row}`,
  });
  return { astar, greedy, timings: { astar: astar.stats.executionTimeMs, greedy: greedy.stats.executionTimeMs } };
}

/** Example CSV payload shape shown on the Documentation page. */
export const MOCK_CSV_SAMPLE = `map,rows,cols,density,algorithm,heuristic,path_cost,nodes_expanded,max_frontier,time_ms
Corridor Wall,12,16,0.15,astar,manhattan,26,61,14,0.42
Corridor Wall,12,16,0.15,greedy,manhattan,26,38,9,0.27
Maze Rooms,12,16,0.30,astar,manhattan,30,88,21,0.61
Maze Rooms,12,16,0.30,greedy,manhattan,38,52,13,0.35`;
