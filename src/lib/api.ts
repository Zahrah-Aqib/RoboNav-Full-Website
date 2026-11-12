/**
 * Client for the real Python FastAPI backend.
 * No invented paths, mock metrics, or silent fallback values.
 */
import type { GridState, Heuristic, Pos } from './grid';

export const BACKEND_URL =
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export interface RunFrame {
  explored: Pos;
  frontier: Pos[];
  frontierDetails?: Array<Pos & { g: number; h: number; f: number }>;
  g?: number;
  h?: number;
  f?: number;
}

export interface RunResult {
  frames: RunFrame[];
  path: Pos[];
  status: 'found' | 'no_path';
  stats: {
    pathCost: number | null;
    nodesExpanded: number;
    nodesTested: number;
    maxFrontier: number;
    executionTimeMs: number;
  };
}

export interface CompareResponse {
  astar: RunResult;
  greedy: RunResult;
  timings: { astar: number; greedy: number };
}

export interface ExperimentRow {
  id: number;
  mapName: string;
  rows: number;
  cols: number;
  density: number | null;
  seed: number | null;
  algorithm: 'astar' | 'greedy';
  heuristic: Heuristic;
  status: 'found' | 'no_path';
  pathCost: number | null;
  nodesExpanded: number;
  nodesTested: number;
  maxFrontier: number;
  executionTimeMs: number;
}

export interface ExperimentSummary {
  size: number;
  density: number;
  algorithm: 'astar' | 'greedy';
  runs: number;
  successes: number;
  avgPathCost: number | null;
  avgNodesExpanded: number;
  avgMaxFrontier: number;
  avgExecutionTimeMs: number;
  comparableRuns: number;
  nonOptimalGreedyCount: number;
  greedyNonOptimalPct: number | null;
}

export interface ExperimentResponse {
  rows: ExperimentRow[];
  summary: ExperimentSummary[];
  comparisons: Array<{
    mapName: string;
    comparable: boolean;
    greedyNonOptimal: boolean | null;
    astarCost: number | null;
    greedyCost: number | null;
  }>;
  overall: {
    mapsTested: number;
    comparableRuns: number;
    nonOptimalGreedyCount: number;
    greedyNonOptimalPct: number | null;
  };
}

export function gridToApiMap(grid: GridState) {
  return {
    rows: grid.rows,
    cols: grid.cols,
    obstacles: Array.from(grid.walls).map((entry) => {
      const [r, c] = entry.split(':').map(Number);
      return r * grid.cols + c;
    }),
    start: grid.start,
    goal: grid.goal,
  };
}

async function post<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(BACKEND_URL + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      'Cannot reach the Python backend. Start it on port 8000 and reload this page.'
    );
  }
  if (!response.ok) {
    let message = 'Request failed (' + response.status + ')';
    try {
      const error = await response.json() as { detail?: string };
      if (typeof error.detail === 'string') message = error.detail;
    } catch {
      // Keep the HTTP error when the server has no JSON body.
    }
    throw new Error(message);
  }
  return response.json() as Promise<T>;
}

export function apiRun(
  grid: GridState,
  algorithm: 'astar' | 'greedy',
  heuristic: Heuristic,
): Promise<RunResult> {
  return post('/api/run', {
    map: gridToApiMap(grid),
    algorithm,
    heuristic,
    movement: '4dir',
  });
}

export function apiCompare(grid: GridState, heuristic: Heuristic): Promise<CompareResponse> {
  return post('/api/compare', {
    map: gridToApiMap(grid),
    algorithms: ['astar', 'greedy'],
    heuristic,
    movement: '4dir',
  });
}

export function apiExperiments(
  gridSizes: number[],
  densities: number[],
  seeds: number[],
  heuristic: Heuristic,
): Promise<ExperimentResponse> {
  return post('/api/experiments', { gridSizes, densities, seeds, heuristic, includeUTrap: true });
}
