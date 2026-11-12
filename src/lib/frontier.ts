/** Build the overlay from actual Python frontier snapshots, not demo values. */
import type { Pos, CellRole } from './grid';
import { key, samePos } from './grid';
import type { RunResult } from './api';

export function overlayFor(
  run: RunResult | null,
  frameNumber: number,
  isDone: boolean,
  start: Pos,
  goal: Pos,
): Map<string, CellRole> {
  const overlay = new Map<string, CellRole>();
  if (!run) return overlay;

  // All previously selected nodes appear as explored cells.
  for (let i = 0; i < frameNumber; i++) {
    if (run.frames[i]) overlay.set(key(run.frames[i].explored), 'explored');
  }

  // Show the actual frontier after expanding the latest selected node.
  const latest = run.frames[Math.max(0, frameNumber - 1)];
  if (latest) {
    for (const position of latest.frontier) {
      if (!samePos(position, start) && !samePos(position, goal)) {
        overlay.set(key(position), 'frontier');
      }
    }
  }

  // Only paint the final route when the search animation finishes.
  if (isDone) {
    for (const position of run.path) {
      if (!samePos(position, start) && !samePos(position, goal)) {
        overlay.set(key(position), 'path');
      }
    }
  }
  return overlay;
}
