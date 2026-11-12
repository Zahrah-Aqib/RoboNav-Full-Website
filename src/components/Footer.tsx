import { Link } from 'react-router-dom';
import { Navigation, Github, BookOpen, FlaskConical } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-navy-600/50 bg-navy-900/60 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-8 h-8 rounded-lg bg-cyan-dim/30 border border-cyan/40 flex items-center justify-center">
              <Navigation className="text-cyan-soft" size={16} />
            </span>
            <span className="font-display font-bold text-white">
              Robo<span className="text-cyan-soft">Nav</span>
            </span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
            An educational robotics path-planning platform comparing Greedy Best-First Search and
            A* on editable obstacle grids.
          </p>
        </div>

        <div>
          <h3 className="font-display font-semibold text-sm text-white mb-3">Explore</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/simulator" className="text-slate-400 hover:text-cyan-soft transition flex items-center gap-2">
                <FlaskConical size={14} /> Grid Simulator
              </Link>
            </li>
            <li>
              <Link to="/comparison" className="text-slate-400 hover:text-cyan-soft transition flex items-center gap-2">
                <Navigation size={14} /> Algorithm Comparison
              </Link>
            </li>
            <li>
              <Link to="/docs" className="text-slate-400 hover:text-cyan-soft transition flex items-center gap-2">
                <BookOpen size={14} /> Documentation
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-display font-semibold text-sm text-white mb-3">Project</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Student robotics project. Search algorithms run in Python behind a FastAPI service;
            this site is the interactive front end.
          </p>
          <a
            href="https://github.com/Zahrah-Aqib/RoboNav"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-cyan-soft transition mt-3"
          >
            <Github size={16} /> Source repository
          </a>
        </div>
      </div>

      <div className="border-t border-navy-600/40 py-4 text-center">
        <p className="text-xs text-slate-500">
          RoboNav — Educational robot navigation with real Python Greedy and A* search.
        </p>
      </div>
    </footer>
  );
}
