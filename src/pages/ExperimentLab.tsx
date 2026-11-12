import { useMemo, useState } from 'react';
import { Download, FlaskConical, Play, AlertCircle } from 'lucide-react';
import { PageHeader, SectionTitle } from '@/components/ui';
import { BarChart, TrendChart } from '@/components/charts';
import { apiExperiments } from '@/lib/api';
import type { ExperimentRow, ExperimentSummary } from '@/lib/api';
import type { Heuristic } from '@/lib/grid';

type Metric = 'nodesExpanded' | 'pathCost' | 'executionTimeMs' | 'maxFrontier';
const METRICS: Record<Metric, string> = {
  nodesExpanded: 'Nodes expanded',
  pathCost: 'Path cost',
  executionTimeMs: 'Execution time (ms)',
  maxFrontier: 'Maximum frontier',
};

function makeCsv(rows: ExperimentRow[]): string {
  const fields = [
    'mapName', 'rows', 'cols', 'density', 'seed', 'algorithm',
    'heuristic', 'status', 'pathCost', 'nodesExpanded',
    'nodesTested', 'maxFrontier', 'executionTimeMs',
  ] as const;
  return [
    fields.join(','),
    ...rows.map((row) => fields.map((field) => {
      // Handle commas and quotation marks safely in exported CSV cells.
      const value = String(row[field] ?? '');
      return '"' + value.replace(/"/g, '""') + '"';
    }).join(',')),
  ].join('\n');
}

export default function ExperimentLab() {
  const [rows, setRows] = useState<ExperimentRow[]>([]);
  const [summary, setSummary] = useState<ExperimentSummary[]>([]);
  const [metric, setMetric] = useState<Metric>('nodesExpanded');
  const [heuristic, setHeuristic] = useState<Heuristic>('manhattan');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ran, setRan] = useState(false);

  const runBatch = async () => {
    setLoading(true);
    setError('');
    try {
      // Replicate the grid sizes, densities and seeds in our proposal.
      const response = await apiExperiments(
        [10, 20, 50], [0.1, 0.2, 0.3], [1, 2, 3], heuristic,
      );
      setRows(response.rows);
      setSummary(response.summary);
      setRan(true);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Could not run experiments.');
    } finally {
      setLoading(false);
    }
  };

  const byMap = useMemo(() => {
    const names = Array.from(new Set(rows.map((r) => r.mapName)));
    return names.slice(0, 18).map((name) => {
      const a = rows.find((r) => r.mapName === name && r.algorithm === 'astar');
      const g = rows.find((r) => r.mapName === name && r.algorithm === 'greedy');
      return {
        label: name.replace('Random ', '').replace(' (seed ', ' #').replace(')', ''),
        value: metric === 'pathCost' ? (g?.pathCost ?? 0) : (g?.[metric] ?? 0),
        compareValue: metric === 'pathCost' ? (a?.pathCost ?? 0) : (a?.[metric] ?? 0),
      };
    });
  }, [rows, metric]);

  const expandedGreedy = rows
    .filter((r) => r.algorithm === 'greedy')
    .map((r) => r.nodesExpanded);

  const download = () => {
    if (!rows.length) return;
    const blob = new Blob([makeCsv(rows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const element = document.createElement('a');
    element.href = url;
    element.download = 'robonav-real-experiments.csv';
    element.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Experiment Lab"
        title={<>Test, compare, and <span className="text-cyan-soft">export</span></>}
        description="Run real Python A* and Greedy searches on matched random grids. Every result comes from the backend."
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <section className="glass-panel p-6 space-y-4">
          <SectionTitle>Batch experiment setup</SectionTitle>
          <p className="text-sm text-slate-400">
            Tests 10×10, 20×20 and 50×50 grids at 10%, 20% and 30% obstacle density,
            with seeds 1, 2 and 3. Both algorithms use the exact same grid for each seed.
            No external dataset or database is required.
          </p>
          <div className="flex flex-wrap items-end gap-4">
            <label className="min-w-[180px]">
              <span className="input-label">Heuristic</span>
              <select className="select-input" value={heuristic}
                onChange={(event) => setHeuristic(event.target.value as Heuristic)}>
                <option value="manhattan">Manhattan</option>
                <option value="euclidean">Euclidean</option>
              </select>
            </label>
            <button onClick={runBatch} disabled={loading} className="btn-primary">
              <Play size={16} /> {loading ? 'Running experiments…' : 'Run experiments'}
            </button>
            <button onClick={download} disabled={!rows.length} className="btn-ghost">
              <Download size={16} /> Export CSV
            </button>
          </div>
          {error && <p role="alert" className="text-amber-300 text-sm flex items-center gap-2">
            <AlertCircle size={16}/>{error}
          </p>}
          {ran && !error && (
            <p className="text-sm text-cyan-soft">
              Completed {rows.length} measured runs on {rows.length / 2} matched maps.
            </p>
          )}
        </section>

        {rows.length > 0 ? (
          <>
            <div className="grid lg:grid-cols-2 gap-6">
              <section className="glass-panel p-6 space-y-4">
                <SectionTitle>Metrics by map</SectionTitle>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(METRICS) as Metric[]).map((name) => (
                    <button key={name} onClick={() => setMetric(name)}
                      className={metric === name ? 'btn-primary !px-3 !py-1.5' : 'btn-ghost !px-3 !py-1.5'}>
                      {METRICS[name]}
                    </button>
                  ))}
                </div>
                <BarChart data={byMap} colorA="#fbbf24" colorB="#22d3ee"
                  unit={metric === 'executionTimeMs' ? ' ms' : ''} />
                <p className="text-xs text-slate-400">
                  Gold: Greedy | Cyan: A*. Unsolved maps have no valid path cost.
                </p>
              </section>
              <section className="glass-panel p-6 space-y-4">
                <SectionTitle>Greedy expansions across runs</SectionTitle>
                <TrendChart values={expandedGreedy} color="#fbbf24" />
                <p className="text-sm text-slate-400">
                  Each bar represents the actual number of expanded nodes on one map.
                  Expanding fewer nodes does not always give the shortest route.
                </p>
              </section>
            </div>
            <section className="glass-panel p-6">
              <SectionTitle>Average results by grid size and density</SectionTitle>
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm text-left">
                  <thead className="border-b border-navy-600 text-slate-400 text-xs">
                    <tr>
                      {['Grid', 'Density', 'Algorithm', 'Solved', 'Avg cost', 'Avg expanded', 'Avg frontier', 'Avg time (ms)'].map((h) =>
                        <th key={h} className="p-2">{h}</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {summary.map((r) => (
                      <tr key={String(r.size) + '-' + r.density + '-' + r.algorithm}
                        className="border-b border-navy-700/40">
                        <td className="p-2">{r.size}×{r.size}</td>
                        <td className="p-2">{Math.round(r.density * 100)}%</td>
                        <td className="p-2">{r.algorithm === 'astar' ? 'A*' : 'Greedy'}</td>
                        <td className="p-2">{r.successes}/{r.runs}</td>
                        <td className="p-2">{r.avgPathCost ?? 'No path'}</td>
                        <td className="p-2">{r.avgNodesExpanded}</td>
                        <td className="p-2">{r.avgMaxFrontier}</td>
                        <td className="p-2">{r.avgExecutionTimeMs.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <section className="glass-panel p-6">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <SectionTitle>Every individual run</SectionTitle>
                <button onClick={download} className="btn-primary">
                  <Download size={15}/> Download real CSV
                </button>
              </div>
              <div className="overflow-x-auto max-h-[460px] overflow-y-auto mt-4">
                <table className="w-full text-sm">
                  <thead className="text-slate-400 border-b border-navy-600 text-left sticky top-0 bg-navy-900">
                    <tr>
                      {['Map', 'Algorithm', 'Status', 'Path cost', 'Expanded', 'Frontier', 'Time (ms)'].map((h) =>
                        <th key={h} className="p-2">{h}</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id} className="border-b border-navy-700/40">
                        <td className="p-2">{r.mapName}</td>
                        <td className="p-2">{r.algorithm === 'astar' ? 'A*' : 'Greedy'}</td>
                        <td className="p-2">{r.status === 'found' ? 'Found' : 'No path'}</td>
                        <td className="p-2">{r.pathCost ?? '—'}</td>
                        <td className="p-2">{r.nodesExpanded}</td>
                        <td className="p-2">{r.maxFrontier}</td>
                        <td className="p-2">{r.executionTimeMs.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        ) : (
          <section className="glass-panel p-10 text-center text-slate-400">
            <FlaskConical className="mx-auto mb-3 text-cyan-soft" size={28} />
            Run the batch above to generate genuine, repeatable results.
          </section>
        )}
      </div>
    </div>
  );
}
