/**
 * Python Visualizations is the proposal-aligned Matplotlib interface.
 *
 * The original Grid Simulator remains interactive in React. Here we ask the
 * SAME Python FastAPI backend to render the search states as true Matplotlib
 * figures, using actual search frames (not images created from dummy data).
 *
 * Pygame and Tkinter are desktop alternatives; Matplotlib fulfills the
 * Python-visualization option in the submitted project proposal.
 */
import { useEffect, useState } from 'react';
import { Download, Image as ImageIcon, Play, RefreshCw, FlaskConical } from 'lucide-react';
import { PageHeader, SectionTitle } from '@/components/ui';
import { PRESETS, presetById } from '@/lib/presets';
import { BACKEND_URL, apiRun, apiCompare, gridToApiMap } from '@/lib/api';
import type { RunResult, CompareResponse } from '@/lib/api';
import type { GridState, Heuristic } from '@/lib/grid';

type ViewMode = 'single' | 'comparison';

async function requestPng(endpoint: string, requestBody: unknown): Promise<string> {
  // A Blob URL is created for each response and revoked when its preview changes.
  let response: Response;
  try {
    response = await fetch(BACKEND_URL + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
  } catch {
    throw new Error('Python backend is unavailable. Start FastAPI on port 8000.');
  }
  if (!response.ok) {
    let detail = 'Python visualization failed (HTTP ' + response.status + ').';
    try {
      const parsed = await response.json() as { detail?: string };
      if (typeof parsed.detail === 'string') detail = parsed.detail;
    } catch {
      // Keep the HTTP status when no JSON details are returned.
    }
    throw new Error(detail);
  }
  const blob = await response.blob();
  if (blob.type && !blob.type.includes('png')) {
    throw new Error('Expected a PNG image from the Python visualization API.');
  }
  return URL.createObjectURL(blob);
}

function SearchStatistics({ result, name }: { result: RunResult; name: string }) {
  const s = result.stats;
  return (
    <div className="rounded-xl border border-navy-600/60 bg-navy-900/50 p-4">
      <h3 className="font-display font-semibold text-cyan-soft mb-2">{name}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div><p className="text-slate-400 text-xs">Path cost</p><p className="font-semibold">{s.pathCost ?? 'No path'}</p></div>
        <div><p className="text-slate-400 text-xs">Expanded</p><p className="font-semibold">{s.nodesExpanded}</p></div>
        <div><p className="text-slate-400 text-xs">Max frontier</p><p className="font-semibold">{s.maxFrontier}</p></div>
        <div><p className="text-slate-400 text-xs">Time (ms)</p><p className="font-semibold">{s.executionTimeMs.toFixed(4)}</p></div>
      </div>
    </div>
  );
}

export default function PythonVisualizations() {
  const [presetId, setPresetId] = useState('u-shaped');
  const [grid, setGrid] = useState<GridState>(() => presetById('u-shaped')!.build());
  const [mode, setMode] = useState<ViewMode>('comparison');
  const [algorithm, setAlgorithm] = useState<'astar' | 'greedy'>('astar');
  const [heuristic, setHeuristic] = useState<Heuristic>('manhattan');
  const [result, setResult] = useState<RunResult | CompareResponse | null>(null);
  const [step, setStep] = useState(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [chartUrl, setChartUrl] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [chartLoading, setChartLoading] = useState(false);
  const [error, setError] = useState('');

  // Clean up object URLs so previous PNGs do not stay in browser memory.
  useEffect(() => () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);
  useEffect(() => () => {
    if (chartUrl) URL.revokeObjectURL(chartUrl);
  }, [chartUrl]);

  const comparison = result !== null && 'astar' in result ? result : null;
  const single = result !== null && 'frames' in result ? result : null;
  const maxStep = comparison
    ? Math.max(
        comparison.astar.frames.length + comparison.astar.path.length,
        comparison.greedy.frames.length + comparison.greedy.path.length,
      )
    : single ? single.frames.length + single.path.length : 0;

  const visualBody = (chosenStep: number, currentMode: ViewMode) => ({
    map: gridToApiMap(grid),
    algorithm,
    heuristic,
    mode: currentMode,
    step: chosenStep,
  });

  const runAlgorithms = async () => {
    setRunning(true);
    setError('');
    setResult(null);
    setStep(0);
    try {
      // Search results come from the normal Python API.
      const computed = mode === 'comparison'
        ? await apiCompare(grid, heuristic)
        : await apiRun(grid, algorithm, heuristic);
      setResult(computed);
      // This separate endpoint renders the real results with Matplotlib.
      setImageUrl(await requestPng('/api/visualize', visualBody(0, mode)));
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Could not run visualization.');
    } finally {
      setRunning(false);
    }
  };

  const renderStep = async () => {
    if (!result) return;
    setDrawing(true);
    setError('');
    try {
      // Only redraw when requested to avoid sending a PNG request on every
      // intermediate slider movement.
      setImageUrl(await requestPng('/api/visualize', visualBody(step, mode)));
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Could not draw selected step.');
    } finally {
      setDrawing(false);
    }
  };

  const runCharts = async () => {
    setChartLoading(true);
    setError('');
    try {
      // Matplotlib generates all four charts using the actual matched runs.
      setChartUrl(await requestPng('/api/visualize/experiments', {
        gridSizes: [10, 20, 50],
        densities: [0.1, 0.2, 0.3],
        seeds: [1, 2, 3],
        heuristic,
        includeUTrap: true,
      }));
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Could not generate charts.');
    } finally {
      setChartLoading(false);
    }
  };

  const changeMap = (id: string) => {
    const selected = presetById(id);
    if (!selected) return;
    setPresetId(id);
    setGrid(selected.build());
    setResult(null);
    setStep(0);
    setImageUrl(null);
    setError('');
  };

  const changeMode = (nextMode: ViewMode) => {
    setMode(nextMode);
    setResult(null);
    setStep(0);
    setImageUrl(null);
  };

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Python and Matplotlib"
        title={<>Python <span className="text-cyan-soft">Visualizations</span></>}
        description="Explore genuine Matplotlib figures made by Python using the same A* and Greedy algorithms as our main 2D simulator."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-7">
        <section className="glass-panel p-5 sm:p-6 space-y-5">
          <SectionTitle>Search visualization settings</SectionTitle>
          <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <label>
              <span className="input-label">Test map</span>
              <select className="select-input" value={presetId}
                onChange={event => changeMap(event.target.value)}>
                {PRESETS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
            <label>
              <span className="input-label">View</span>
              <select className="select-input" value={mode}
                onChange={event => changeMode(event.target.value as ViewMode)}>
                <option value="comparison">A* and Greedy side by side</option>
                <option value="single">One algorithm</option>
              </select>
            </label>
            {mode === 'single' && <label>
              <span className="input-label">Algorithm</span>
              <select className="select-input" value={algorithm}
                onChange={event => {
                  setAlgorithm(event.target.value as 'astar' | 'greedy');
                  setResult(null);
                  setStep(0);
                  setImageUrl(null);
                }}>
                <option value="astar">A* Search</option>
                <option value="greedy">Greedy Best-First Search</option>
              </select>
            </label>}
            <label>
              <span className="input-label">Heuristic</span>
              <select className="select-input" value={heuristic}
                onChange={event => {
                  setHeuristic(event.target.value as Heuristic);
                  setResult(null);
                  setStep(0);
                  setImageUrl(null);
                  setChartUrl(null);
                }}>
                <option value="manhattan">Manhattan distance</option>
                <option value="euclidean">Euclidean distance</option>
              </select>
            </label>
          </div>
          <p className="text-sm text-slate-400">{PRESETS.find(p => p.id === presetId)?.description}</p>
          <button className="btn-primary" disabled={running} onClick={runAlgorithms}>
            <Play size={16}/>{running ? 'Running Python and Matplotlib…' : 'Run algorithms and draw Python figure'}
          </button>
          {error && <p role="alert" className="text-amber-300 text-sm">{error}</p>}
        </section>

        {result && <section className="grid gap-3">
          {comparison ? (
            <>
              <SearchStatistics result={comparison.astar} name="A* Search"/>
              <SearchStatistics result={comparison.greedy} name="Greedy Best-First Search"/>
            </>
          ) : single && <SearchStatistics result={single} name={algorithm === 'astar' ? 'A* Search' : 'Greedy Best-First Search'}/>}
        </section>}

        {result && <section className="glass-panel p-5 sm:p-6 space-y-4">
          <SectionTitle>Step-by-step Matplotlib figure</SectionTitle>
          <p className="text-sm text-slate-400">
            First, inspect which nodes the algorithm selected and which cells remain on the frontier.
            The later steps show the robot following the computed path. All figures are generated by Python.
          </p>
          <label className="block">
            <span className="input-label">Step {step} of {maxStep}</span>
            <input className="w-full accent-cyan-400" type="range" min={0} max={maxStep}
              value={step} onChange={event => setStep(Number(event.target.value))}/>
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={renderStep} disabled={drawing} className="btn-primary">
              <RefreshCw size={15}/>{drawing ? 'Rendering…' : 'Render selected step'}
            </button>
            {imageUrl && <a className="btn-ghost" href={imageUrl}
              download={'robonav-matplotlib-step-' + step + '.png'}>
              <Download size={15}/> Download PNG
            </a>}
          </div>
          {imageUrl && <div className="rounded-xl border border-navy-600 overflow-x-auto bg-navy-950 p-2">
            <img src={imageUrl} alt="Real Python Matplotlib visualization of A* and Greedy search"
              className="w-full max-w-full h-auto" />
          </div>}
        </section>}

        <section className="glass-panel p-5 sm:p-6 space-y-4">
          <SectionTitle>Four Matplotlib performance graphs</SectionTitle>
          <p className="text-sm text-slate-400">
            Compare average path cost, expanded nodes, maximum frontier size and execution time across
            identical random maps, including the U-shaped case in the dataset.
          </p>
          <button onClick={runCharts} disabled={chartLoading} className="btn-primary">
            <FlaskConical size={16}/>{chartLoading ? 'Measuring and plotting…' : 'Generate actual experimental charts'}
          </button>
          {chartUrl && <>
            <img src={chartUrl} className="w-full rounded-xl border border-navy-600"
              alt="Four Matplotlib charts showing measured A* and Greedy performance"/>
            <a href={chartUrl} download="robonav-matplotlib-experiments.png"
              className="btn-ghost"><Download size={15}/> Download charts</a>
          </>}
        </section>

        <p className="text-xs text-slate-500 flex items-start gap-2">
          <ImageIcon size={16} className="shrink-0"/>
          Matplotlib is one of the Python visualization options specified in the proposal.
          Pygame and Tkinter are alternative desktop interfaces and are not required as additional
          implementations. This page uses a real Python service, not JavaScript-rendered placeholder images.
        </p>
      </div>
    </div>
  );
}
