import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X, Navigation } from 'lucide-react';

const links = [
  { to: '/', label: 'Home' },
  { to: '/simulator', label: 'Grid Simulator' },
  { to: '/comparison', label: 'Algorithm Comparison' },
  { to: '/lab', label: 'Experiment Lab' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/about', label: 'About & Team' },
  { to: '/docs', label: 'Documentation' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 rounded-md text-sm font-display font-medium transition-colors duration-200 cursor-pointer ${
      isActive
        ? 'text-cyan-soft bg-cyan/10 shadow-glow-sm'
        : 'text-slate-300 hover:text-cyan-soft hover:bg-navy-700/50'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-navy-600/50 bg-navy-900/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group" onClick={() => setOpen(false)}>
          <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-dim to-navy-700 border border-cyan/50 flex items-center justify-center shadow-glow-sm group-hover:shadow-glow transition-shadow">
            <Navigation className="w-4.5 h-4.5 text-cyan-soft" size={18} />
          </span>
          <span className="font-display font-bold text-lg tracking-tight text-white">
            Robo<span className="text-cyan-soft">Nav</span>
          </span>
        </Link>

        <nav className="hidden xl:flex items-center gap-1">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <button
          className="xl:hidden p-2 rounded-lg text-slate-300 hover:text-cyan-soft hover:bg-navy-700/50 transition cursor-pointer"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle navigation menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <nav className="xl:hidden border-t border-navy-600/50 bg-navy-900/95 backdrop-blur-xl px-4 py-3 flex flex-col gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={linkClass}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
