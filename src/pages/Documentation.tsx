import { Copy, Check, Server, Braces, Database } from 'lucide-react';
import { useState } from 'react';
import { PageHeader, SectionTitle, Reveal } from '@/components/ui';
import { MOCK_CSV_SAMPLE } from '@/lib/mockData';

function CodeBlock({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="relative rounded-xl overflow-hidden border border-navy-600/70 bg-navy-950/80">
      <div className="flex items-center justify-between px-4 py-2 border-b border-navy-600/50 bg-navy-900/60">
        <span className="text-xs font-mono text-slate-400">{label}</span>
        <button
          onClick={copy}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-soft transition cursor-pointer"
        >
          {copied ? <Check size={13} className="text-cyan-soft" /> : <Copy size={13} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-xs font-mono leading-relaxed text-slate-300">
        {code}
      </pre>
    </div>
  );
}

const runRequestExample = `POST /api/run
{
  "map": {
    "rows": 12,
    "cols": 16,
    "obstacles": [27, 28, 29, 43],
    "start": { "row": 0, "col": 0 },
    "goal":  { "row": 11, "col": 15 }
  },
  "algorithm": "astar",      // "astar" | "greedy"
  "heuristic": "manhattan",  // "manhattan" | "euclidean"
  "movement": "4dir"
}`;

const runResponseExample = `{
  "frames": [
    { "explored": { "row": 0, "col": 0 }, "frontier": [] },
    { "explored": { "row": 1, "col": 0 }, "frontier": [] }
  ],
  "path": [
    { "row": 0, "col": 0 },
    { "row": 1, "col": 0 }
  ],
  "stats": {
    "pathCost": 26,
    "nodesExpanded": 61,
    "maxFrontier": 14,
    "executionTimeMs": 0.42
  }
}`;

export default function Documentation() {
  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="Documentation"
        title={<>Architecture and <span className="text-cyan-soft">API contract</span></>}
        description="How RoboNav is put together, what the Python backend must expose, and how the
          front end consumes it."
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-12">
        {/* Architecture */}
        <Reveal>
          <section className="glass-panel p-6 sm:p-8 space-y-5">
            <SectionTitle>Architecture</SectionTitle>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                {
                  icon: Braces,
                  title: 'React front end',
                  text: 'Grid editing, playback, comparison and charts. No search logic lives here — only rendering of results it receives.',
                },
                {
                  icon: Server,
                  title: 'FastAPI service',
                  text: 'Implements greedy best-first and A* from scratch in Python. Exposes POST /api/run and POST /api/compare.',
                },
                {
                  icon: Database,
                  title: 'Data flow',
                  text: 'The front end sends the map as obstacle indices; the backend streams back frames, the final path, and metrics.',
                },
              ].map((b) => (
                <div key={b.title} className="rounded-xl bg-navy-800/60 border border-navy-600/60 p-4">
                  <b.icon className="text-cyan-soft mb-2" size={20} />
                  <h3 className="font-display font-semibold text-white text-sm mb-1.5">{b.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{b.text}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              The front end talks to the backend through a single service module
              (<span className="font-mono text-cyan-soft text-xs">src/lib/api.ts</span>).
              While no backend URL is configured, that module returns clearly-labelled demo
              data so every page stays fully explorable.
            </p>
          </section>
        </Reveal>

        {/* Endpoints */}
        <Reveal>
          <section className="space-y-5">
            <SectionTitle>Endpoints</SectionTitle>
            <div className="glass-panel p-6 space-y-3">
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 rounded-md bg-cyan/15 border border-cyan/40 text-cyan-soft font-mono text-xs">
                  POST
                </span>
                <code className="font-mono text-sm text-white">/api/run</code>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Runs one algorithm on one map. The request carries the grid dimensions, a flat
                list of obstacle cell indices (<span className="font-mono text-xs">row * cols + col</span>),
                the start and goal cells, the algorithm name, the heuristic, and the movement mode.
              </p>
              <CodeBlock label="request body" code={runRequestExample} />
            </div>

            <div className="glass-panel p-6 space-y-3">
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 rounded-md bg-cyan/15 border border-cyan/40 text-cyan-soft font-mono text-xs">
                  POST
                </span>
                <code className="font-mono text-sm text-white">/api/compare</code>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Runs both algorithms on the same map in one call and returns two result
                objects plus server-measured timings, so the comparison page can render them
                from a single request.
              </p>
              <CodeBlock label="response body (both endpoints share this result shape)" code={runResponseExample} />
            </div>
          </section>
        </Reveal>

        {/* Field reference */}
        <Reveal>
          <section className="glass-panel p-6 sm:p-8 space-y-4">
            <SectionTitle>Result fields</SectionTitle>
            <dl className="divide-y divide-navy-600/40">
              {[
                ['frames', 'One entry per expansion step. "explored" is the cell that became explored; "frontier" lists cells visible in the frontier at that moment.'],
                ['path', 'The final route from start to goal, in order. Empty when no route exists.'],
                ['stats.pathCost', 'Total step cost of the path (unit costs in 4-direction movement). Null when unreachable.'],
                ['stats.nodesExpanded', 'Number of cells removed from the frontier and explored — the "effort" of the search.'],
                ['stats.maxFrontier', 'Largest the frontier ever grew — a proxy for memory usage.'],
                ['stats.executionTimeMs', 'Wall-clock time measured by the server around the algorithm call.'],
              ].map(([term, def]) => (
                <div key={term} className="py-3 grid sm:grid-cols-[180px_1fr] gap-1 sm:gap-4">
                  <dt className="font-mono text-xs text-cyan-soft pt-0.5">{term}</dt>
                  <dd className="text-sm text-slate-400 leading-relaxed">{def}</dd>
                </div>
              ))}
            </dl>
          </section>
        </Reveal>

        {/* CSV format */}
        <Reveal>
          <section className="glass-panel p-6 sm:p-8 space-y-4">
            <SectionTitle>CSV export format</SectionTitle>
            <p className="text-sm text-slate-400 leading-relaxed">
              The Experiment Lab exports one row per (map, algorithm) pair with these columns.
              The sample below uses the same demo placeholder values shown on that page.
            </p>
            <CodeBlock label="robonav-experiment-demo.csv" code={MOCK_CSV_SAMPLE} />
          </section>
        </Reveal>

        {/* Getting started with the backend */}
        <Reveal>
          <section className="glass-panel p-6 sm:p-8 space-y-3">
            <SectionTitle>Connecting the Python backend</SectionTitle>
            <ol className="space-y-3 text-sm text-slate-400 leading-relaxed list-decimal list-inside">
              <li>
                Implement the two endpoints above in FastAPI, returning the result shape
                documented here.
              </li>
              <li>
                Set the service base URL in the front end&apos;s API module
                (<span className="font-mono text-cyan-soft text-xs">BACKEND_URL</span>) — every
                page switches from demo data to live results automatically.
              </li>
              <li>
                Keep responses CORS-enabled for the site&apos;s origin, since the browser calls
                the service directly.
              </li>
            </ol>
          </section>
        </Reveal>
      </div>
    </div>
  );
}
