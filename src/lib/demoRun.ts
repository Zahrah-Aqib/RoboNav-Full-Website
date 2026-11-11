/**
 * DEMO-ONLY visualization generator.
 *
 * This is NOT a real search implementation and the numbers it produces
 * are NOT real experimental results. It produces a plausible-looking
 * animation sequence (explored cells, frontier, path) purely so the UI
 * can be demonstrated before the Python FastAPI backend is connected.
 * When the backend is live, `src/lib/api.ts` replaces these outputs.
 *
 * The "greedy wanders more, A* is more direct" flavor comes from the
 * order in which candidate cells are admitted to the sequence, which is
 * a hand-tuned visual heuristic — nothing more.
 */
import {
  GridState,
  Pos,
  key,
  parseKey,
  neighbors4,
  samePos,
  heuristicDistance,
} from './grid';

export interface RunFrame {
  /** Cell that became explored this frame. */
  explored: Pos;
  /** Cells currently sitting in the frontier (for tinting). */
  frontier: Pos[];
}

export interface RunResult {
  frames: RunFrame[];
  /** Final path from start to goal, in order (null if demo found none). */
  path: Pos[];
  stats: {
    pathCost: number | null;
    nodesExpanded: number;
    maxFrontier: number;
    executionTimeMs: number;
  };
}

interface GenOptions {
  /** Lower = more directed (A*-like), higher = more wandering (greedy-like). */
  wandering: number;
  seedLabel: string;
}

function randomSeed(label: string): number {
  let h = 2166136261;
  for (let i = 0; i < label.length; i++) {
    h ^= label.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Produce a demo expansion sequence + path. Internally walks a
 * heuristic-guided flood; `wandering` distorts priorities so the greedy
 * variant visually fans out more. Deterministic per (map, options).
 */
export function generateDemoRun(
  grid: GridState,
  opts: GenOptions
): RunResult {
  const rand = mulberry32(randomSeed(opts.seedLabel) ^ (grid.walls.size * 7919));
  const exploredOrder: Pos[] = [];
  const exploredSet = new Set<string>();
  const frontierSet = new Set<string>();
  const cameFrom = new Map<string, string>();

  const start = grid.start;
  const goal = grid.goal;
  exploredSet.add(key(start));
  exploredOrder.push(start);

  let current = start;
  let maxFrontier = 1;
  let guard = 0;
  const maxGuard = grid.rows * grid.cols * 6;

  const openSet = new Set<string>([key(start)]);

  while (!samePos(current, goal) && guard++ < maxGuard) {
    openSet.delete(key(current));
    const candidates = neighbors4(current).filter((n) => {
      const k = key(n);
      return (
        n.row >= 0 &&
        n.row < grid.rows &&
        n.col >= 0 &&
        n.col < grid.cols &&
        !grid.walls.has(k) &&
        !exploredSet.has(k)
      );
    });

    for (const c of candidates) {
      const k = key(c);
      if (!openSet.has(k)) {
        openSet.add(k);
        frontierSet.add(k);
        cameFrom.set(k, key(current));
      }
    }
    if (openSet.size > maxFrontier) maxFrontier = openSet.size;

    // Sort open cells by distorted distance; `wandering` injects noise.
    const openCells = Array.from(openSet).map(parseKey);
    openCells.sort((a, b) => {
      const da = heuristicDistance('manhattan', a, goal) + rand() * opts.wandering;
      const db = heuristicDistance('manhattan', b, goal) + rand() * opts.wandering;
      return da - db;
    });
    current = openCells[0] ?? current;
    if (!exploredSet.has(key(current))) {
      exploredSet.add(key(current));
      frontierSet.delete(key(current));
      exploredOrder.push(current);
    }

    // Record a frontier snapshot every few steps so the animation has body.
    if (exploredOrder.length % 3 === 0) {
      // frontier tinting is derived from exploredOrder in the UI; snapshots
      // intentionally lightweight to keep frame count manageable.
    }
  }

  // Reconstruct path.
  const path: Pos[] = [];
  if (samePos(current, goal)) {
    let k: string | undefined = key(goal);
    while (k) {
      path.unshift(parseKey(k));
      k = cameFrom.get(k);
    }
  }

  const frames: RunFrame[] = exploredOrder.map((p) => ({
    explored: p,
    frontier: [],
  }));

  return {
    frames,
    path,
    stats: {
      pathCost: path.length > 0 ? path.length - 1 : null,
      nodesExpanded: exploredOrder.length,
      maxFrontier,
      // Demo-only placeholder timing; real timing comes from the backend.
      executionTimeMs: Number((exploredOrder.length * (0.02 + rand() * 0.015)).toFixed(3)),
    },
  };
}
