/**
 * API service module.
 *
 * The real search algorithms (A*, Greedy Best-First) are implemented in
 * Python and exposed by a FastAPI backend. This module is the single
 * integration point: when the backend is available, flip
 * `BACKEND_URL` to its base URL and the UI keeps working unchanged.
 *
 * Expected endpoints (documented in /docs):
 *   POST /api/run      — run ONE algorithm on a map, returns frames + stats
 *   POST /api/compare  — run BOTH algorithms, returns paired results
 *
 * Until the backend exists, every call falls back to
 * `MOCK_*` fixtures in `src/lib/mockData.ts`, which are clearly labelled
 * demonstration data — not real measurements.
 */
import type { GridState, Heuristic } from './grid';
import type { RunResult } from './demoRun';
import { generateDemoRun } from './demoRun';
import { MOCK_COMPARE_RESPONSE } from './mockData';

// TODO(setup): point at the FastAPI service, e.g. 'https://api.robonav.local'
export const BACKEND_URL: string | null = null;

export interface RunRequest {
  map: {
    rows: number;
    cols: number;
    /** Flat list of obstacle cell indices (row * cols + col). */
    obstacles: number[];
    start: { row: number; col: number };
    goal: { row: number; col: number };
  };
  algorithm: 'astar' | 'greedy';
  heuristic: Heuristic;
  movement: '4dir' | '8dir';
}

export interface CompareRequest {
  map: RunRequest['map'];
  algorithms: ['astar', 'greedy'];
  heuristic: Heuristic;
  movement: '4dir' | '8dir';
}

export interface CompareResponse {
  astar: RunResult;
  greedy: RunResult;
  /** Server-reported timing measured around the algorithm call. */
  timings: { astar: number; greedy: number };
}

export function gridToApiMap(grid: GridState): RunRequest['map'] {
  return {
    rows: grid.rows,
    cols: grid.cols,
    obstacles: Array.from(grid.walls).map((k) => {
      const [r, c] = k.split(':').map(Number);
      return r * grid.cols + c;
    }),
    start: grid.start,
    goal: grid.goal,
  };
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<T>;
}

/**
 * Run one algorithm. Falls back to the local demo generator while the
 * Python backend is not connected.
 */
export async function apiRun(
  grid: GridState,
  algorithm: 'astar' | 'greedy',
  heuristic: Heuristic
): Promise<RunResult> {
  if (BACKEND_URL) {
    return post<RunResult>('/api/run', {
      map: gridToApiMap(grid),
      algorithm,
      heuristic,
      movement: '4dir',
    } satisfies RunRequest);
  }
  // Fallback: deterministic demo animation, labelled as demo data in the UI.
  return generateDemoRun(grid, {
    wandering: algorithm === 'greedy' ? 3.2 : 0.35,
    seedLabel: `${algorithm}:${heuristic}:${grid.rows}x${grid.cols}:${grid.walls.size}:${grid.start.row}:${grid.goal.row}`,
  });
}

/**
 * Run both algorithms side by side. Falls back to mock fixtures while
 * the backend is not connected.
 */
export async function apiCompare(
  grid: GridState,
  heuristic: Heuristic
): Promise<CompareResponse> {
  if (BACKEND_URL) {
    return post<CompareResponse>('/api/compare', {
      map: gridToApiMap(grid),
      algorithms: ['astar', 'greedy'],
      heuristic,
      movement: '4dir',
    } satisfies CompareRequest);
  }
  return MOCK_COMPARE_RESPONSE(grid, heuristic);
}
