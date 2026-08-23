import { AlertTriangle, Inbox, RotateCw } from 'lucide-react';
import { ApiError } from '../types';

export function SkeletonRows({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full overflow-hidden rounded border border-line bg-panel">
      <div className="space-y-0">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 border-b border-line px-3 py-2.5 last:border-b-0">
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="h-3 flex-1 animate-pulse rounded-sm bg-line/80" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonPanel({ className = 'h-40' }: { className?: string }) {
  return <div className={`animate-pulse rounded border border-line bg-panel ${className}`} />;
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded border border-line border-dashed bg-panel px-6 py-10 text-center">
      <Inbox className="mb-2 h-5 w-5 text-muted" />
      <p className="text-sm font-medium text-ink">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-xs text-muted">{hint}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function InlineError({ error, onRetry }: { error: ApiError | { code: string; message: string }; onRetry?: () => void }) {
  return (
    <div className="flex items-start gap-3 rounded border border-bad/30 bg-bad-soft px-4 py-3">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-bad" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-bad">
          {error.code === 'DB_UNAVAILABLE' ? 'Graph database unavailable.' : 'Failed to load data.'}
        </p>
        <p className="mt-0.5 font-mono text-[11px] text-muted">{error.message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1 rounded border border-line bg-panel px-2 py-1 text-[11px] font-medium text-ink hover:bg-canvas"
        >
          <RotateCw className="h-3 w-3" /> Retry
        </button>
      )}
    </div>
  );
}

export function Panel({
  title,
  actions,
  children,
  className = '',
}: {
  title?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-line bg-panel shadow-glass ${className}`}>
      {title && (
        <header className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="text-[11px] font-bold tracking-widest text-muted uppercase">{title}</h2>
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
