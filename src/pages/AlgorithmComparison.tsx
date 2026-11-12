import { useState, useMemo, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Gauge,
  Shuffle,
  Swords,
} from 'lucide-react';
import GridCanvas from '@/components/GridCanvas';
import { PageHeader, LegendDot } from '@/components/ui';
import {
  GridState,
  Heuristic,
  randomizeWalls,
} from '@/lib/grid';
import { PRESETS, presetById } from '@/lib/presets';
import { apiCompare } from '@/lib/api';
import type { CompareResponse } from '@/lib/api';
import { overlayFor } from '@/lib/frontier';
import { usePlayback } from '@/lib/usePlayback';

export default function AlgorithmComparison() {
  const [grid, setGrid] = useState<GridState>(() => {
    const g = presetById('rooms')!.build();
    return g;
  });
  const [heuristic, setHeuristic] = useState<Heuristic>('manhattan');
  const [density, setDensity] = useState(25);
  const [speed, setSpeed] = useState(5);
  const [result, setResult] = useState<CompareResponse | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalFrames = Math.max(
    (result?.astar.frames.length ?? 0) + (result?.astar.path.length ?? 0),
    (result?.greedy.frames.length ?? 0) + (result?.greedy.path.length ?? 0)
  );
  const playback = usePlayback(totalFrames, speed);

  const overlayA = useMemo(
    () => overlayFor(result?.astar ?? null, playback.frame, playback.state === 'done', grid.start, grid.goal),
    [result, playback.frame, playback.state, grid.start, grid.goal]
  );
  const overlayG = useMemo(
    () => overlayFor(result?.greedy ?? null, playback.frame, playback.state === 'done', grid.start, grid.goal),
    [result, playback.frame, playback.state, grid.start, grid.goal]
  );

  const markDirty = () => {
    setResult(null);
    playback.reset();
  };

  const generateRandom = () => {
    setGrid((g) => ({ ...g, walls: randomizeWalls(g, density / 100) }));
    markDirty();
  };

  const runBoth = async () => {
    setRunning(true);
    setError(null);
    try {
      const cmp = await apiCompare(grid, heuristic);
      setResult(cmp);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not run comparison.');
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    if (result) playback.play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const pickRandomMap = () => {
    const preset = PRESETS[Math.floor(Math.random() * PRESETS.length)];
    const g = preset.build();
    if (g.walls.size === 0) g.walls = randomizeWalls(g, 0.22);
    setGrid(g);
    markDirty();
  };

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Algorithm Comparison"
        title={<>Greedy Best-First <span className="text-slate-500">vs</span> <span className="text-cyan-soft">A*</span></>}
        description="Both planners explore the same map at the same time. Watch how greedy search
          races toward the goal but can be misled, while A* balances distance with cost already paid."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Controls bar */}
        <div className="glass-panel p-4 flex flex-wrap items-center gap-x-6 gap-y-4">
          <button onClick={runBoth} disabled={running} className="btn-primary">
            {running ? 'Running…' : <><Swords size={16} /> Run both</>}
          </button>
          <button onClick={generateRandom} className="btn-ghost">
            <Shuffle size={15} /> Randomize map
          </button>
          <button onClick={pickRandomMap} className="btn-ghost">
            <Gauge size={15} /> Surprise preset
          </button>

          <div className="min-w-[140px]">
            <label className="input-label">Heuristic</label>
            <select
              className="select-input"
              value={heuristic}
              onChange={(e) => {
                setHeuristic(e.target.value as Heuristic);
                markDirty();
              }}
            >
              <option value="manhattan">Manhattan</option>
              <option value="euclidean">Euclidean</option>
            </select>
          </div>

          <div className="min-w-[160px] flex-1 max-w-xs">
            <label className="input-label flex justify-between">
              <span>Speed</span>
              <span className="text-cyan-soft font-mono">{speed}×</span>
            </label>
            <input
              type="range"
              min={1}
              max={12}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
            />
          </div>

          <div className="min-w-[160px] flex-1 max-w-xs">
            <label className="input-label flex justify-between">
              <span>Obstacle density</span>
              <span className="text-cyan-soft font-mono">{density}%</span>
            </label>
            <input
              type="range"
              min={0}
              max={45}
              value={density}
              onChange={(e) => setDensity(Number(e.target.value))}
            />
          </div>
        </div>

        {/* Playback bar */}
        <div className="glass-panel p-4 flex flex-wrap items-center gap-3">
          <button onClick={playback.stepBack} className="btn-ghost px-3" aria-label="Step back">
            <SkipBack size={16} />
          </button>
          {playback.state === 'playing' ? (
            <button onClick={playback.pause} className="btn-primary px-4" aria-label="Pause">
              <Pause size={18} />
            </button>
          ) : (
            <button onClick={playback.play} disabled={!result} className="btn-primary px-4" aria-label="Play">
              <Play size={18} />
            </button>
          )}
          <button onClick={playback.stepForward} className="btn-ghost px-3" aria-label="Step forward">
            <SkipForward size={16} />
          </button>
          <button onClick={playback.reset} className="btn-ghost px-3" aria-label="Reset">
            <RotateCcw size={16} />
          </button>
          <div className="flex-1 min-w-[160px]">
            <input
              type="range"
              min={0}
              max={totalFrames}
              value={playback.frame}
              onChange={(e) => playback.goTo(Number(e.target.value))}
              disabled={!result}
            />
          </div>
          <span className="text-xs font-mono text-slate-400">
            frame {playback.frame} / {totalFrames}
          </span>
        </div>

        {error && (
          <p className="text-sm text-amber-400/90 glass-panel p-4">{error}</p>
        )}

        {/* Side-by-side boards */}
        <div className="grid lg:grid-cols-2 gap-6">
          {(['greedy', 'astar'] as const).map((side) => {
            const run = result?.[side];
            const overlay = side === 'astar' ? overlayA : overlayG;
            const reached = run && run.path.length > 0;
            const winner =
              result && reached && result.astar.stats.pathCost !== result.greedy.stats.pathCost
                ? (result.astar.stats.pathCost! < result.greedy.stats.pathCost! ? 'astar' : 'greedy')
                : null;
            return (
              <div key={side} className="glass-panel p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-semibold text-lg text-white flex items-center gap-2">
                    {side === 'astar' ? (
                      <><span className="text-cyan-soft">A*</span> Search</>
                    ) : (
                      <>Greedy Best-First</>
                    )}
                    {winner === side && (
                      <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-cyan/15 border border-cyan/40 text-cyan-soft">
                        shorter path
                      </span>
                    )}
                  </h3>
                  <span className="text-xs font-mono text-slate-500">
                    {heuristic === 'manhattan' ? 'h = Manhattan' : 'h = Euclidean'}
                  </span>
                </div>

                <div className="flex justify-center overflow-x-auto">
                  <GridCanvas grid={grid} overlay={overlay} cellSize={24}
                    robotPosition={run && playback.frame > run.frames.length && run.path.length > 0
                      ? run.path[Math.min(playback.frame - run.frames.length - 1, run.path.length - 1)]
                      : undefined} />
                </div>

                {run ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="stat-card !p-3">
                      <span className="stat-value !text-base">{reached ? run.stats.pathCost : '—'}</span>
                      <span className="stat-label">Path cost</span>
                    </div>
                    <div className="stat-card !p-3">
                      <span className="stat-value !text-base">{run.stats.nodesExpanded}</span>
                      <span className="stat-label">Expanded</span>
                    </div>
                    <div className="stat-card !p-3">
                      <span className="stat-value !text-base">{run.stats.maxFrontier}</span>
                      <span className="stat-label">Max frontier</span>
                    </div>
                    <div className="stat-card !p-3">
                      <span className="stat-value !text-base">{run.stats.executionTimeMs.toFixed(2)}</span>
                      <span className="stat-label">Time (ms)</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Run both planners to see results.</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Shared legend + reading guide */}
        <div className="glass-panel p-5">
          <div className="flex flex-wrap gap-x-6 gap-y-2 mb-3">
            <LegendDot color="rgba(34, 211, 238, 0.16)" label="Explored" />
            <LegendDot color="rgba(251, 191, 36, 0.35)" label="Frontier" />
            <LegendDot color="#22d3ee" label="Final path" />
            <LegendDot color="#22c55e" label="Start" />
            <LegendDot color="#f43f5e" label="Goal" />
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">
            <span className="text-cyan-soft font-medium">How to read this:</span> greedy
            best-first only trusts the estimated distance to the goal, so it explores less but can
            find a longer path or get stuck. A* also counts the cost already paid, which usually
            means more exploration but a guaranteed shortest path when the heuristic is admissible.
          </p>
          <p className="text-[11px] text-slate-500 mt-3">
            These paths and metrics come from the real Python algorithms on identical maps.
          </p>
        </div>
      </div>
    </div>
  );
}
