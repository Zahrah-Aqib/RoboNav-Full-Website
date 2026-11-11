import { ReactNode } from 'react';

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: ReactNode;
  description: string;
}) {
  return (
    <div className="border-b border-navy-600/40 bg-navy-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 page-enter">
        <p className="text-xs font-mono uppercase tracking-[0.25em] text-cyan-soft/80 mb-3">
          {eyebrow}
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-3 leading-tight">
          {title}
        </h1>
        <p className="max-w-2xl text-slate-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-display text-xl sm:text-2xl font-semibold text-white flex items-center gap-3">
      <span className="w-6 h-0.5 bg-cyan rounded-full shadow-glow-sm shrink-0" />
      {children}
    </h2>
  );
}

/** Fade-up wrapper for scroll reveal (pure CSS, triggers on mount). */
export function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: 0 | 1 | 2 | 3;
  className?: string;
}) {
  const delayClass = delay ? `reveal-delay-${delay}` : '';
  return (
    <div className={`reveal ${delayClass} ${className}`}>{children}</div>
  );
}

/** Small colored badge used in legends. */
export function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-300">
      <span
        className="w-3 h-3 rounded-[3px] border border-white/10"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
