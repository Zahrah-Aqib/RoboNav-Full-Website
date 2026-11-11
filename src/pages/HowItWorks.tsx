import { Link } from 'react-router-dom';
import { ArrowRight, Compass, Coins, ListTree, MousePointer2, Gauge, MoveRight } from 'lucide-react';
import { PageHeader, SectionTitle, Reveal } from '@/components/ui';

const concepts = [
  {
    icon: Coins,
    title: 'Cost so far (g)',
    text: 'How many steps the robot has already taken from the start cell. A* adds this to the heuristic; greedy search ignores it completely.',
  },
  {
    icon: Compass,
    title: 'Heuristic (h)',
    text: 'An optimistic estimate of the remaining distance to the goal. Manhattan distance counts horizontal + vertical steps; Euclidean uses straight-line distance.',
  },
  {
    icon: ListTree,
    title: 'Frontier',
    text: 'The set of cells discovered but not yet explored. Greedy search orders the frontier by h alone; A* orders it by g + h, which is what makes it systematic.',
  },
  {
    icon: Gauge,
    title: 'Admissibility',
    text: 'A heuristic is admissible when it never overestimates the true remaining cost. Manhattan is admissible for 4-direction movement, which is why A* with it finds optimal paths.',
  },
];

const steps = [
  {
    title: 'Draw or generate a map',
    text: 'Use the wall, eraser, start, and goal tools on the grid, generate obstacles at a chosen density, or start from a preset like Maze Rooms or the Greedy Trap.',
    link: { to: '/simulator', label: 'Open Grid Simulator' },
  },
  {
    title: 'Pick heuristic and movement',
    text: 'Choose Manhattan or Euclidean as the distance estimate. Movement is 4-directional (up, down, left, right) by default, matching unit step costs.',
  },
  {
    title: 'Run one planner or both',
    text: 'The simulator runs a single algorithm; the comparison page executes greedy best-first and A* on the same map and animates them side by side.',
    link: { to: '/comparison', label: 'Compare algorithms' },
  },
  {
    title: 'Step, scrub, and speed up',
    text: 'Play, pause, step forward or back, and drag the timeline to any frame. Speed control changes how many frames animate per second.',
  },
  {
    title: 'Study the metrics',
    text: 'Path cost tells you the route length, nodes expanded tells you the exploration effort, max frontier shows memory pressure, and execution time is reported by the planner itself.',
  },
  {
    title: 'Chart and export experiments',
    text: 'The Experiment Lab charts metrics per map and exports everything as CSV so you can drop results straight into your report.',
    link: { to: '/lab', label: 'Enter Experiment Lab' },
  },
];

export default function HowItWorks() {
  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="How It Works"
        title={<>The ideas behind <span className="text-cyan-soft">informed search</span></>}
        description="A short, friendly tour of the concepts the site visualizes — no prior robotics
          knowledge needed."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-14">
        {/* Core concepts */}
        <section>
          <Reveal>
            <SectionTitle>Four ideas explain everything</SectionTitle>
          </Reveal>
          <div className="grid sm:grid-cols-2 gap-5 mt-8">
            {concepts.map((c, i) => (
              <Reveal key={c.title} delay={(i % 2) as 0 | 1}>
                <div className="glass-panel p-6 h-full flex gap-4 hover:border-cyan/40 transition-colors">
                  <span className="w-11 h-11 rounded-xl bg-cyan-dim/30 border border-cyan/40 flex items-center justify-center shrink-0 shadow-glow-sm">
                    <c.icon className="text-cyan-soft" size={20} />
                  </span>
                  <div>
                    <h3 className="font-display font-semibold text-white mb-1.5">{c.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{c.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* Algorithm walkthrough */}
        <section>
          <Reveal>
            <SectionTitle>Greedy vs A* in one picture</SectionTitle>
          </Reveal>
          <Reveal>
            <div className="glass-panel p-6 sm:p-8 mt-8 grid md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
              <div className="space-y-3">
                <h3 className="font-display font-semibold text-amber-300">Greedy Best-First</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Always expands the frontier cell that <em>looks</em> closest to the goal.
                  Very fast and cheap on memory — but easily fooled by obstacles that make the
                  direct route impossible, and the path it finds can be far from the shortest.
                </p>
                <p className="text-xs font-mono text-amber-300/80">priority = h(cell)</p>
              </div>

              <div className="flex md:flex-col items-center justify-center gap-2 text-slate-500">
                <MoveRight className="rotate-180 md:rotate-0" size={22} />
                <span className="text-xs font-mono">versus</span>
                <MoveRight size={22} />
              </div>

              <div className="space-y-3">
                <h3 className="font-display font-semibold text-cyan-soft">A* Search</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Expands the frontier cell with the smallest <em>total estimated cost</em>:
                  steps already taken plus the estimated remainder. With an admissible
                  heuristic it is guaranteed to find the shortest path — at the price of
                  exploring more cells.
                </p>
                <p className="text-xs font-mono text-cyan-soft/80">priority = g(cell) + h(cell)</p>
              </div>
            </div>
          </Reveal>
        </section>

        {/* Workflow */}
        <section>
          <Reveal>
            <SectionTitle>Using the site</SectionTitle>
          </Reveal>
          <div className="mt-8 space-y-4">
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={((i % 3) as 0 | 1 | 2)}>
                <div className="glass-panel p-5 flex items-start gap-4 hover:border-cyan/40 transition-colors">
                  <span className="font-mono text-cyan-soft/70 text-sm mt-0.5 w-8 shrink-0">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1">
                    <h3 className="font-display font-semibold text-white mb-1 flex items-center gap-2">
                      {s.title}
                      {i === 0 && <MousePointer2 size={14} className="text-cyan-soft/60" />}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{s.text}</p>
                  </div>
                  {s.link && (
                    <Link
                      to={s.link.to}
                      className="btn-ghost text-xs shrink-0 hidden sm:inline-flex"
                    >
                      {s.link.label} <ArrowRight size={13} />
                    </Link>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
