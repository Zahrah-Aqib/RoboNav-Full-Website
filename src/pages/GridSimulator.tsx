import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Shuffle,
  Eraser,
  BrickWall,
  Flag,
  MapPin,
  Layers,
  Wand2,
} from 'lucide-react';
import GridCanvas from '@/components/GridCanvas';
import { PageHeader, SectionTitle, LegendDot } from '@/components/ui';
import {
  GridState,
  PaintTool,
  Pos,
  CellRole,
  createGrid,
  randomizeWalls,
  resizeGrid,
  key,
  samePos,
  Heuristic,
} from '@/lib/grid';
import { PRESETS, presetById } from '@/lib/presets';
import { apiRun } from '@/lib/api';
import { RunResult } from '@/lib/demoRun';
import { usePlayback } from '@/lib/usePlayback';

const DEFAULT_ROWS = 12;
const DEFAULT_COLS = 16;

export default function GridSimulator() {
  const [grid, setGrid] = useState<GridState>(() => presetById('corridor')!.build());
  const [tool, setTool] = useState<PaintTool>('wall');
  const [heuristic, setHeuristic] = useState<Heuristic>('manhattan');
  const [rowsInput, setRowsInput] = useState(String(DEFAULT_ROWS));
  const [colsInput, setColsInput] = useState(String(DEFAULT_COLS));
  const [density, setDensity] = useState(20);
  const [algorithm, setAlgorithm] = useState<'astar' | 'greedy'>('astar');
  const [run, setRun] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [apiNotice, setApiNotice] = useState<string | null>(null);

  const totalFrames = run?.frames.length ?? 0;
  const playback = usePlayback(totalFrames, 5);

  // Overlay derived from playback position.
  const overlay = useMemo(() => {
    const m = new Map<string, CellRole>();
    if (!run) return m;
    for (let i = 0; i < playback.frame; i++) {
      const f = run.frames[i];
      if (f) m.set(key(f.explored), 'explored');
    }
    if (playback.state === 'done' && run.path.length > 0) {
      run.path.forEach((p) => {
        if (!samePos(p, grid.start) && !samePos(p, grid.goal)) m.set(key(p), 'path');
      });
    }
    return m;
  }, [run, playback.frame, playback.state, grid.start, grid.goal]);

  const markDirty = () => {
    setRun(null);
    playback.reset();
  };

  const paint = useCallback(
    (p: Pos) => {
      setGrid((g) => {
        const k = key(p);
        if (tool === 'start') {
          if (g.walls.has(k) || samePos(p, g.goal)) return g;
          return { ...g, start: p };
        }
        if (tool === 'goal') {
          if (g.walls.has(k) || samePos(p, g.start)) return g;
          return { ...g, goal: p };
        }
        if (samePos(p, g.start) || samePos(p, g.goal)) return g;
        const walls = new Set(g.walls);
        if (tool === 'wall') walls.add(k);
        else if (tool === 'erase') walls.delete(k);
        return { ...g, walls };
      });
      if (tool !== 'start' && tool !== 'goal') markDirty();
    },
    [tool]
  );

  const applyPreset = (id: string) => {
    const preset = presetById(id);
    if (!preset) return;
    const built = preset.build();
    setGrid(built);
    setRowsInput(String(built.rows));
    setColsInput(String(built.cols));
    markDirty();
  };

  const generateRandom = () => {
    setGrid((g) => ({ ...g, walls: randomizeWalls(g, density / 100) }));
    markDirty();
  };

  const clearWalls = () => {
    setGrid((g) => ({ ...g, walls: new Set() }));
    markDirty();
  };

  const applyDimensions = () => {
    const r = Math.max(5, Math.min(40, parseInt(rowsInput) || DEFAULT_ROWS));
    const c = Math.max(5, Math.min(60, parseInt(colsInput) || DEFAULT_COLS));
    setRowsInput(String(r));
    setColsInput(String(c));
    setGrid((g) => resizeGrid(g, r, c));
    markDirty();
  };

  const runAlgorithm = async () => {
    setRunning(true);
    setApiNotice(null);
    try {
      const result = await apiRun(grid, algorithm, heuristic);
      setRun(result);
      if (result.path.length === 0) {
        setApiNotice('The demo run could not reach the goal on this map. Try clearing some obstacles.');
      }
    } catch {
      setApiNotice('Something went wrong while running the planner. Please try again.');
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    // Auto-play a fresh run.
    if (run) playback.play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run]);

  const tools: { id: PaintTool; label: string; icon: typeof BrickWall }[] = [
    { id: 'wall', label: 'Wall', icon: BrickWall },
    { id: 'erase', label: 'Erase', icon: Eraser },
    { id: 'start', label: 'Start', icon: MapPin },
    { id: 'goal', label: 'Goal', icon: Flag },
  ];

  const stats = run?.stats;
  const reached = run && run.path.length > 0;

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Grid Simulator"
        title={<>Design a world, run <span className="text-cyan-soft">one</span> planner</>}
        description="Paint obstacles with your mouse, place the start and goal, and animate how the
          search expands. Tune the grid, generate maps at random, or pick a preset."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid lg:grid-cols-[1fr_320px] gap-8 items-start">
        {/* Canvas side */}
        <div className="glass-panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex flex-wrap gap-2">
              {tools.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTool(t.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-medium transition cursor-pointer border ${
                    tool === t.id
                      ? 'bg-cyan/15 border-cyan/50 text-cyan-soft shadow-glow-sm'
                      : 'bg-navy-800/60 border-navy-600 text-slate-300 hover:text-cyan-soft hover:border-navy-500'
                  }`}
                >
                  <t.icon size={14} /> {t.label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={generateRandom} className="btn-ghost text-xs">
                <Shuffle size={14} /> Random
              </button>
              <button onClick={clearWalls} className="btn-ghost text-xs">
                <Wand2 size={14} /> Clear
              </button>
            </div>
          </div>

          <div className="flex justify-center overflow-x-auto py-4">
            <GridCanvas
              grid={grid}
              overlay={overlay}
              editable
              onPaintCell={paint}
              onPaintStart={markDirty}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-navy-600/50 pt-4">
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <LegendDot color="#1f3154" label="Obstacle" />
              <LegendDot color="rgba(34, 211, 238, 0.16)" label="Explored" />
              <LegendDot color="#22d3ee" label="Path" />
              <LegendDot color="#22c55e" label="Start" />
              <LegendDot color="#f43f5e" label="Goal" />
            </div>
            <p className="text-xs text-slate-500 font-mono">
              {grid.rows} × {grid.cols} · 4-direction movement
            </p>
          </div>
        </div>

        {/* Controls side */}
        <div className="space-y-5">
          <div className="glass-panel p-5 space-y-4">
            <SectionTitle>Run setup</SectionTitle>

            <div>
              <label className="input-label">Algorithm</label>
              <select
                className="select-input"
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value as 'astar' | 'greedy')}
              >
                <option value="astar">A* Search</option>
                <option value="greedy">Greedy Best-First Search</option>
              </select>
            </div>

            <div>
              <label className="input-label">Heuristic</label>
              <select
                className="select-input"
                value={heuristic}
                onChange={(e) => setHeuristic(e.target.value as Heuristic)}
              >
                <option value="manhattan">Manhattan distance</option>
                <option value="euclidean">Euclidean distance</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">Rows</label>
                <input
                  type="number"
                  min={5}
                  max={40}
                  className="number-input"
                  value={rowsInput}
                  onChange={(e) => setRowsInput(e.target.value)}
                />
              </div>
              <div>
                <label className="input-label">Columns</label>
                <input
                  type="number"
                  min={5}
                  max={60}
                  className="number-input"
                  value={colsInput}
                  onChange={(e) => setColsInput(e.target.value)}
                />
              </div>
              <button onClick={applyDimensions} className="btn-ghost text-xs col-span-2 justify-center">
                <Layers size={14} /> Apply size
              </button>
            </div>

            <div>
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

            <div>
              <label className="input-label">Preset maps</label>
              <div className="grid gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p.id)}
                    className="text-left px-3 py-2 rounded-lg bg-navy-800/60 border border-navy-600 hover:border-cyan/40 hover:bg-navy-700/60 transition text-sm text-slate-200 cursor-pointer"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={runAlgorithm} disabled={running} className="btn-primary w-full justify-center">
              {running ? 'Running…' : <><Play size={16} /> Run planner</>}
            </button>
            {apiNotice && (
              <p className="text-xs text-amber-400/90 leading-relaxed">{apiNotice}</p>
            )}
          </div>

          {/* Playback */}
          <div className="glass-panel p-5 space-y-3">
            <SectionTitle>Playback</SectionTitle>
            <div className="flex items-center justify-center gap-2">
              <button onClick={playback.stepBack} className="btn-ghost px-3" aria-label="Step back">
                <SkipBack size={16} />
              </button>
              {playback.state === 'playing' ? (
                <button onClick={playback.pause} className="btn-primary px-4" aria-label="Pause">
                  <Pause size={18} />
                </button>
              ) : (
                <button
                  onClick={playback.play}
                  disabled={!run}
                  className="btn-primary px-4"
                  aria-label="Play"
                >
                  <Play size={18} />
                </button>
              )}
              <button onClick={playback.stepForward} className="btn-ghost px-3" aria-label="Step forward">
                <SkipForward size={16} />
              </button>
              <button onClick={() => { setRun(null); playback.reset(); }} className="btn-ghost px-3" aria-label="Reset">
                <RotateCcw size={16} />
              </button>
            </div>
            <div>
              <input
                type="range"
                min={0}
                max={totalFrames}
                value={playback.frame}
                onChange={(e) => playback.goTo(Number(e.target.value))}
                disabled={!run}
              />
              <p className="text-center text-xs font-mono text-slate-400 mt-1">
                frame {playback.frame} / {totalFrames}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="glass-panel p-5 space-y-3">
            <SectionTitle>Result metrics</SectionTitle>
            {!stats && (
              <p className="text-sm text-slate-500">Run the planner to see metrics here.</p>
            )}
            {stats && (
              <div className="grid grid-cols-2 gap-3">
                <div className="stat-card">
                  <span className="stat-value">{reached ? stats.pathCost : '—'}</span>
                  <span className="stat-label">Path cost</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{stats.nodesExpanded}</span>
                  <span className="stat-label">Nodes expanded</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{stats.maxFrontier}</span>
                  <span className="stat-label">Max frontier</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{stats.executionTimeMs.toFixed(2)}</span>
                  <span className="stat-label">Time (ms)</span>
                </div>
              </div>
            )}
            {run && (
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Demo demonstration data — not a real algorithm run. Connect the Python backend
                to replace it (see Documentation).
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
