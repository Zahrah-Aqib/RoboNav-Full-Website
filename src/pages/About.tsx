import { GraduationCap, Target, Github, Mail, Bot, Search, Wrench } from 'lucide-react';
import { PageHeader, SectionTitle, Reveal } from '@/components/ui';

const values = [
  {
    icon: Target,
    title: 'Understanding over performance',
    text: 'The goal is to make search behaviour visible, not to benchmark production planners. Every metric on screen exists to build intuition.',
  },
  {
    icon: GraduationCap,
    title: 'Built as a course project',
    text: 'RoboNav was designed so the code stays readable for students: a small React front end, a clearly-scoped Python service, and no hidden magic.',
  },
  {
    icon: Bot,
    title: 'Honest about demo data',
    text: 'Until the Python backend is connected, every number is labelled as a placeholder. We would rather show an honest notice than invented results.',
  },
];

const team = [
  {
    name: 'Team Role: Algorithms',
    icon: Search,
    text: 'Implements the A* and greedy best-first planners in Python, designs the heuristics, and validates optimality on known maps.',
  },
  {
    name: 'Team Role: Interface',
    icon: Bot,
    text: 'Builds the React front end: the editable grid, playback controls, side-by-side comparison, and charting in the Experiment Lab.',
  },
  {
    name: 'Team Role: Integration',
    icon: Wrench,
    text: 'Owns the FastAPI service and the API contract, keeps the demo data honest, and wires real results into the UI.',
  },
];

export default function About() {
  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="About & Team"
        title={<>A student project about <span className="text-cyan-soft">making search visible</span></>}
        description="RoboNav started as a question: what does a path-planning algorithm actually do
          inside the robot's head? This site is our attempt to answer it interactively."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-14">
        <section className="grid lg:grid-cols-2 gap-8 items-start">
          <Reveal>
            <div className="space-y-4">
              <SectionTitle>The story</SectionTitle>
              <p className="text-slate-400 leading-relaxed">
                Textbook diagrams of A* show a neat expanding diamond. Real runs are messier:
                the frontier bulges around walls, greedy search dives into dead ends, and two
                algorithms given the identical map can disagree completely about which cells
                matter.
              </p>
              <p className="text-slate-400 leading-relaxed">
                We wanted a tool where a student could draw those walls themselves, run both
                planners side by side, and scrub through the disagreement frame by frame —
                then take the numbers away as CSV for a report. That tool is RoboNav.
              </p>
            </div>
          </Reveal>

          <div className="space-y-4">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={(i as 0 | 1 | 2)}>
                <div className="glass-panel p-5 flex gap-4 hover:border-cyan/40 transition-colors">
                  <span className="w-10 h-10 rounded-lg bg-cyan-dim/30 border border-cyan/40 flex items-center justify-center shrink-0">
                    <v.icon className="text-cyan-soft" size={18} />
                  </span>
                  <div>
                    <h3 className="font-display font-semibold text-white mb-1">{v.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{v.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section>
          <Reveal>
            <SectionTitle>The team</SectionTitle>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-5 mt-8">
            {team.map((t, i) => (
              <Reveal key={t.name} delay={(i % 3) as 0 | 1 | 2}>
                <div className="glass-panel p-6 h-full flex flex-col gap-4 items-start hover:-translate-y-1 hover:border-cyan/40 transition-all duration-300">
                  <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-dim/40 to-navy-700 border border-cyan/40 flex items-center justify-center shadow-glow-sm">
                    <t.icon className="text-cyan-soft" size={22} />
                  </span>
                  <div>
                    <h3 className="font-display font-semibold text-white mb-1.5">{t.name}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{t.text}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        <section>
          <Reveal>
            <div className="glass-panel p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="font-display text-xl font-semibold text-white mb-1">
                  Curious about the code?
                </h2>
                <p className="text-sm text-slate-400">
                  The project is open for classmates to read, fork, and extend.
                </p>
              </div>
              <div className="flex gap-3">
                <a href="https://github.com" target="_blank" rel="noreferrer" className="btn-primary">
                  <Github size={16} /> Repository
                </a>
                <a href="mailto:team@robonav.example" className="btn-ghost">
                  <Mail size={16} /> Contact
                </a>
              </div>
            </div>
          </Reveal>
        </section>
      </div>
    </div>
  );
}
