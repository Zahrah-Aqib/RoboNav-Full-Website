import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Grid3X3,
  Scale,
  FlaskConical,
  BookOpen,
  Cpu,
  Route,
  Timer,
  Layers,
} from 'lucide-react';
import RobotScene from '@/components/RobotScene';
import { Reveal, SectionTitle } from '@/components/ui';

const features = [
  {
    icon: Grid3X3,
    title: 'Grid Simulator',
    text: 'Paint obstacles, move the start and goal, and watch a search unfold cell by cell.',
    to: '/simulator',
    cta: 'Open simulator',
  },
  {
    icon: Scale,
    title: 'Algorithm Comparison',
    text: 'Greedy Best-First versus A* side by side: explored cells, path cost, and speed.',
    to: '/comparison',
    cta: 'Compare algorithms',
  },
  {
    icon: FlaskConical,
    title: 'Experiment Lab',
    text: 'Batch maps through both planners and export the results as CSV for your report.',
    to: '/lab',
    cta: 'Enter the lab',
  },
  {
    icon: BookOpen,
    title: 'Documentation',
    text: 'The API contract, data formats, and how to connect the Python backend.',
    to: '/docs',
    cta: 'Read the docs',
  },
];

const metrics = [
  { icon: Route, label: 'Path cost', desc: 'Total steps from start to goal' },
  { icon: Layers, label: 'Nodes expanded', desc: 'How much of the map was explored' },
  { icon: Timer, label: 'Execution time', desc: 'Wall-clock time reported by the planner' },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-900 via-navy-950 to-navy-950" />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-cyan/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-20 grid lg:grid-cols-2 gap-12 items-center">
          <div className="page-enter">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan/30 bg-cyan/5 text-xs font-mono text-cyan-soft mb-6">
              <Cpu size={13} /> Robotics path-planning visualizer
            </span>
            <h1 className="font-display text-4xl sm:text-5xl xl:text-6xl font-bold leading-tight text-white mb-6">
              Watch your robot
              <br />
              <span className="text-cyan-soft drop-shadow-[0_0_20px_rgba(62,233,255,0.5)]">
                think its way home.
              </span>
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed mb-8 max-w-lg">
              RoboNav is an interactive laboratory for greedy best-first search and A*.
              Draw a world, run both planners, and compare how each one explores —
              step by step, cell by cell.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/simulator" className="btn-primary text-base px-6 py-3">
                Launch the simulator <ArrowRight size={18} />
              </Link>
              <Link to="/comparison" className="btn-ghost text-base px-6 py-3">
                Greedy vs A*
              </Link>
            </div>
          </div>

          {/* 3D decoration with CSS fallback built in */}
          <div className="hidden md:block h-[420px] relative">
            <div className="absolute inset-0 bg-cyan/5 blur-3xl rounded-full" />
            <RobotScene className="w-full h-full" />
            <p className="absolute bottom-2 inset-x-0 text-center text-xs text-slate-500 font-mono">
              decorative 3D scene — simulation runs in 2D
            </p>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <Reveal>
          <SectionTitle>What you can do</SectionTitle>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={(i % 4) as 0 | 1 | 2 | 3}>
              <Link
                to={f.to}
                className="glass-panel group p-6 flex flex-col gap-4 h-full hover:border-cyan/50 hover:shadow-glow-sm transition-all duration-300 hover:-translate-y-1"
              >
                <span className="w-11 h-11 rounded-xl bg-cyan-dim/30 border border-cyan/40 flex items-center justify-center shadow-glow-sm group-hover:shadow-glow transition-shadow">
                  <f.icon className="text-cyan-soft" size={20} />
                </span>
                <div>
                  <h3 className="font-display font-semibold text-white mb-1.5">{f.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{f.text}</p>
                </div>
                <span className="mt-auto inline-flex items-center gap-1.5 text-sm text-cyan-soft font-display font-medium">
                  {f.cta}
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Metrics strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <Reveal>
          <div className="glass-panel p-8 grid sm:grid-cols-3 gap-8">
            {metrics.map((m) => (
              <div key={m.label} className="flex items-start gap-4">
                <span className="w-10 h-10 rounded-lg bg-cyan/10 border border-cyan/30 flex items-center justify-center shrink-0">
                  <m.icon className="text-cyan-soft" size={18} />
                </span>
                <div>
                  <h3 className="font-display font-semibold text-white">{m.label}</h3>
                  <p className="text-sm text-slate-400 mt-0.5">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* How it fits together */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <Reveal>
          <SectionTitle>How the project fits together</SectionTitle>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-5 mt-8">
          {[
            {
              step: '01',
              title: 'Design a world',
              text: 'Draw obstacles or generate them randomly, pick a heuristic, and set the grid size.',
            },
            {
              step: '02',
              title: 'Run both planners',
              text: 'The Python FastAPI service executes each search and streams back every expanded cell.',
            },
            {
              step: '03',
              title: 'Compare and export',
              text: 'Inspect the animated results, study the metrics, and export experiments as CSV.',
            },
          ].map((s, i) => (
            <Reveal key={s.step} delay={(i % 3) as 0 | 1 | 2}>
              <div className="glass-panel p-6 relative overflow-hidden h-full">
                <span className="absolute -top-3 -right-1 font-display font-bold text-6xl text-cyan/10 select-none">
                  {s.step}
                </span>
                <h3 className="font-display font-semibold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <p className="mt-6 text-sm text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse-slow" />
            Demonstration notice: until the Python backend is connected, the site shows
            clearly-labelled demo data, not real algorithm runs.
          </p>
        </Reveal>
      </section>
    </div>
  );
}
