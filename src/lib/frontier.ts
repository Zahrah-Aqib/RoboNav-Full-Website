/** Build the overlay from actual Python search frames and the planned robot route. */
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

  const searchLength = run.frames.length;

  // First animate which nodes were actually selected by the algorithm.
  for (let i = 0; i < Math.min(frameNumber, searchLength); i++) {
    overlay.set(key(run.frames[i].explored), 'explored');
  }

  // During the search show the exact set of nodes waiting in the frontier.
  if (frameNumber > 0 && frameNumber <= searchLength) {
    for (const position of run.frames[frameNumber - 1].frontier) {
      if (!samePos(position, start) && !samePos(position, goal)) {
        overlay.set(key(position), 'frontier');
      }
    }
  }

  // After search finishes, animate the robot walking along the final path.
  const walked = isDone
    ? run.path.length
    : Math.max(0, frameNumber - searchLength);
  for (const position of run.path.slice(0, walked)) {
    if (!samePos(position, start) && !samePos(position, goal)) {
      overlay.set(key(position), 'path');
    }
  }

  return overlay;
}
