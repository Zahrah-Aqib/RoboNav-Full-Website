import { useMemo, useState } from 'react';
import { Download, FlaskConical, Info } from 'lucide-react';
import { PageHeader, SectionTitle } from '@/components/ui';
import { BarChart, TrendChart } from '@/components/charts';
import { MOCK_EXPERIMENT_ROWS, ExperimentRow } from '@/lib/mockData';

type Metric = 'nodesExpanded' | 'pathCost' | 'executionTimeMs' | 'maxFrontier';

const METRIC_LABELS: Record<Metric, string> = {
  nodesExpanded: 'Nodes expanded',
  pathCost: 'Path cost',
  executionTimeMs: 'Execution time (ms)',
  maxFrontier: 'Max frontier size',
};

const ALGO_LABEL: Record<ExperimentRow['algorithm'], string> = {
  astar: 'A*',
  greedy: 'Greedy',
};

function toCsv(rows: ExperimentRow[]): string {
  const header =
    'map,rows,cols,density,algorithm,heuristic,path_cost,nodes_expanded,max_frontier,time_ms';
  const lines = rows.map((r) =>
    [
      `"${r.mapName}"`,
      r.rows,
      r.cols,
      r.density.toFixed(2),
      r.algorithm,
      r.heuristic,
      r.pathCost,
      r.nodesExpanded,
      r.maxFrontier,
      r.executionTimeMs,
    ].join(',')
  );
  return [header, ...lines].join('\n');
}

export default function ExperimentLab() {
  const rows = MOCK_EXPERIMENT_ROWS;
  const [metric, setMetric] = useState<Metric>('nodesExpanded');

  const maps = useMemo(() => Array.from(new Set(rows.map((r) => r.mapName))), [rows]);

  const chartData = useMemo(() => {
    return maps.map((m) => {
      const astar = rows.find((r) => r.mapName === m && r.algorithm === 'astar');
      const greedy = rows.find((r) => r.mapName === m && r.algorithm === 'greedy');
      return {
        label: m,
        value: greedy?.[metric] ?? 0,
        compareValue: astar?.[metric],
      };
    });
  }, [maps, rows, metric]);

  const expansionTrend = useMemo(
    () =>
      rows
        .filter((r) => r.algorithm === 'greedy')
        .map((r) => r.nodesExpanded),
    [rows]
  );

  const downloadCsv = () => {
    const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'robonav-experiment-demo.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Experiment Lab"
        title={<>Compare, chart, and <span className="text-cyan-soft">export</span></>}
        description="Run batches of maps through both planners, chart the metrics that matter for
          your report, and export everything as CSV. Values below are demo placeholders until the
          Python backend is connected."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Demo data notice */}
        <div className="glass-panel p-4 flex items-start gap-3 border-amber-400/30">
          <Info className="text-amber-400 shrink-0 mt-0.5" size={18} />
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="font-medium text-amber-300">Demo dataset.</span> These numbers are
            hand-written illustrations of the output format — they are not real algorithm runs and
            should not be cited in a report. Once the FastAPI backend is connected, this page will
            chart live results instead.
          </p>
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="glass-panel p-6 space-y-4">
            <SectionTitle>Metric by map</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(METRIC_LABELS) as Metric[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMetric(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-display font-medium transition cursor-pointer border ${
                    metric === m
                      ? 'bg-cyan/15 border-cyan/50 text-cyan-soft shadow-glow-sm'
                      : 'bg-navy-800/60 border-navy-600 text-slate-300 hover:text-cyan-soft'
                  }`}
                >
                  {METRIC_LABELS[m]}
                </button>
              ))}
            </div>
            <BarChart
              data={chartData}
              unit={metric === 'executionTimeMs' ? ' ms' : ''}
              colorA="#fbbf24"
              colorB="#22d3ee"
            />
            <div className="flex gap-5 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#22d3ee' }} /> A*
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#fbbf24' }} /> Greedy
              </span>
            </div>
          </div>

          <div className="glass-panel p-6 space-y-4">
            <SectionTitle>Greedy expansion across runs</SectionTitle>
            <TrendChart values={expansionTrend} color="#fbbf24" />
            <p className="text-sm text-slate-400 leading-relaxed">
              Each bar is one demo run. In real experiments this view makes it easy to spot
              where greedy best-first expands far fewer nodes than A* — and where that
              cheapness costs it the shortest path.
            </p>
          </div>
        </div>

        {/* Data table */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <SectionTitle>Experiment data</SectionTitle>
            <button onClick={downloadCsv} className="btn-primary">
              <Download size={16} /> Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-widest text-slate-400 border-b border-navy-600/60">
                  <th className="py-2.5 pr-4 font-display">Map</th>
                  <th className="py-2.5 pr-4 font-display">Size</th>
                  <th className="py-2.5 pr-4 font-display">Density</th>
                  <th className="py-2.5 pr-4 font-display">Algorithm</th>
                  <th className="py-2.5 pr-4 font-display">Heuristic</th>
                  <th className="py-2.5 pr-4 font-display text-right">Cost</th>
                  <th className="py-2.5 pr-4 font-display text-right">Expanded</th>
                  <th className="py-2.5 pr-4 font-display text-right">Max frontier</th>
                  <th className="py-2.5 font-display text-right">Time (ms)</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-navy-700/40 hover:bg-navy-700/30 transition-colors"
                  >
                    <td className="py-2.5 pr-4 text-slate-200">{r.mapName}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-slate-400">
                      {r.rows}×{r.cols}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-xs text-slate-400">
                      {r.density.toFixed(2)}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          r.algorithm === 'astar'
                            ? 'bg-cyan/10 text-cyan-soft border border-cyan/30'
                            : 'bg-amber-400/10 text-amber-300 border border-amber-400/30'
                        }`}
                      >
                        {ALGO_LABEL[r.algorithm]}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-400 capitalize">{r.heuristic}</td>
                    <td className="py-2.5 pr-4 font-mono text-right text-slate-200">{r.pathCost}</td>
                    <td className="py-2.5 pr-4 font-mono text-right text-slate-200">{r.nodesExpanded}</td>
                    <td className="py-2.5 pr-4 font-mono text-right text-slate-200">{r.maxFrontier}</td>
                    <td className="py-2.5 font-mono text-right text-slate-200">
                      {r.executionTimeMs.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 mt-4 flex items-center gap-2">
            <FlaskConical size={13} />
            Exported CSVs carry the same columns as the live backend will produce, so report
            tooling can be written once.
          </p>
        </div>
      </div>
    </div>
  );
}
