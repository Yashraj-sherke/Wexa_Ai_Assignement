import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  AlertTriangle, Bot, ChevronDown, CircleCheck, CircleX, Database, GitBranch,
  LayoutDashboard, Link2, Play, Search, Settings, ShieldCheck, Users,
} from 'lucide-react';
import { api } from '../services/api';
import { formatTimestamp } from '../utils/format';

/* ---------------- DB health polling ---------------- */

interface DbHealth {
  connected: boolean;
  checking: boolean;
  lastChecked: string | null;
  detail?: string;
}

const DbHealthContext = createContext<{
  db: DbHealth;
  refresh: () => void;
}>({ db: { connected: false, checking: true, lastChecked: null }, refresh: () => {} });

export const useDbHealth = () => useContext(DbHealthContext);

function useDbHealthPolling(): { db: DbHealth; refresh: () => void } {
  const [db, setDb] = useState<DbHealth>({ connected: false, checking: true, lastChecked: null });
  const refresh = useCallback(() => {
    setDb((d) => ({ ...d, checking: true }));
    api
      .health()
      .then((h) =>
        setDb({
          connected: (h.database ?? '').toUpperCase() === 'CONNECTED',
          checking: false,
          lastChecked: new Date().toISOString(),
        }),
      )
      .catch((e) =>
        setDb({
          connected: false,
          checking: false,
          lastChecked: new Date().toISOString(),
          detail: e?.message ?? 'Health check failed',
        }),
      );
  }, []);
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 15000);
    return () => clearInterval(t);
  }, [refresh]);
  return { db, refresh };
}

function DbBanner({ db, onRetry }: { db: DbHealth; onRetry: () => void }) {
  const [expanded, setExpanded] = useState(false);
  if (db.connected || db.checking) return null;
  return (
    <div className="border-b border-bad/40 bg-bad-soft px-6 py-2.5">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-4 gap-y-2">
        <AlertTriangle className="h-4 w-4 shrink-0 text-bad" />
        <p className="text-xs font-semibold tracking-wide text-bad">
          DATABASE CONNECTION UNAVAILABLE — ControlGraph cannot currently retrieve graph data.
        </p>
        <span className="font-mono text-[11px] text-muted">
          Last checked: {db.lastChecked ? formatTimestamp(db.lastChecked) : '—'}
        </span>
        <button
          onClick={onRetry}
          className="rounded border border-bad/40 bg-panel px-2 py-0.5 text-[11px] font-medium text-bad hover:bg-white"
        >
          Retry connection
        </button>
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-[11px] font-medium text-bad underline underline-offset-2"
        >
          {expanded ? 'Hide' : 'Show'} technical details
        </button>
        {expanded && (
          <pre className="w-full overflow-x-auto rounded border border-bad/30 bg-panel p-2 font-mono text-[11px] text-muted">
{`endpoint:  ${api.baseUrl}/api/health
status:    DISCONNECTED
detail:    ${db.detail ?? 'No response from health endpoint'}`}
          </pre>
        )}
      </div>
    </div>
  );
}

/* ---------------- Sidebar / layout ---------------- */

const NAV = [
  { to: '/', label: 'Control Center', icon: LayoutDashboard, end: true },
  { to: '/coworkers', label: 'Coworkers', icon: Users },
  { to: '/agents', label: 'Agents', icon: Bot },
  { to: '/systems', label: 'Systems', icon: Database },
  { to: '/data-assets', label: 'Data Assets', icon: Link2 },
  { to: '/policies', label: 'Policies', icon: ShieldCheck },
  { to: '/actions', label: 'Actions', icon: GitBranch },
  { to: '/simulator', label: 'Simulator', icon: Play },
  { to: '/graph', label: 'Graph Explorer', icon: GitBranch },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const ROUTE_LABELS: Record<string, string> = {
  coworkers: 'Coworkers', agents: 'Agents', systems: 'Systems', 'data-assets': 'Data Assets',
  policies: 'Policies', actions: 'Actions', simulator: 'Simulator', graph: 'Graph Explorer',
  settings: 'Settings',
};

function Breadcrumb() {
  const loc = useLocation();
  const parts = loc.pathname.split('/').filter(Boolean);
  const crumbs = ['Control Center', ...parts.map((p) => ROUTE_LABELS[p] ?? (p.length > 12 ? `${p.slice(0, 10)}…` : p))];
  return (
    <nav className="flex items-center gap-1.5 font-mono text-[11px] text-muted">
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-line">/</span>}
          <span className={i === crumbs.length - 1 ? 'text-ink' : ''}>{c}</span>
        </span>
      ))}
    </nav>
  );
}

export default function AppLayout() {
  const { db, refresh } = useDbHealthPolling();
  return (
    <DbHealthContext.Provider value={{ db, refresh }}>
      <div className="flex h-full min-h-screen">
        {/* Sidebar */}
        <aside className="flex w-56 shrink-0 flex-col border-r border-line bg-panel shadow-[1px_0_10px_rgba(0,0,0,0.02)]">
          <Link to="/" className="flex items-center gap-3 border-b border-line px-5 py-4 hover:bg-canvas/50 transition-colors">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-accent/80 font-mono text-[14px] font-bold text-white shadow-sm">
              CG
            </div>
            <div>
              <div className="text-[14px] leading-tight font-bold text-ink tracking-tight">ControlGraph</div>
              <div className="text-[10px] leading-tight text-muted tracking-wide uppercase mt-0.5 font-medium">Access intelligence</div>
            </div>
          </Link>
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-all duration-200 ${
                    isActive
                      ? 'bg-accent/10 font-semibold text-accent'
                      : 'text-muted hover:bg-canvas hover:text-ink hover:translate-x-0.5'
                  }`
                }
              >
                <Icon className={`h-4 w-4 ${useLocation().pathname === to ? 'text-accent' : 'text-muted'}`} />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-line p-4">
            <div className="text-[10px] font-bold tracking-widest text-muted uppercase mb-2">Database Status</div>
            <div
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 font-mono text-[11px] font-medium transition-colors ${
                db.checking
                  ? 'border-line bg-canvas text-muted'
                  : db.connected
                    ? 'border-ok/20 bg-ok-soft text-ok'
                    : 'border-bad/20 bg-bad-soft text-bad'
              }`}
            >
              {db.checking ? (
                <Database className="h-3.5 w-3.5 animate-pulse" />
              ) : db.connected ? (
                <CircleCheck className="h-3.5 w-3.5" />
              ) : (
                <CircleX className="h-3.5 w-3.5" />
              )}
              {db.checking ? 'Checking…' : db.connected ? 'CognoDB Connected' : 'Disconnected'}
            </div>
          </div>
        </aside>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col bg-canvas/30 relative">
          <DbBanner db={db} onRetry={refresh} />
          {/* Top bar with Frosted Glass */}
          <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-line bg-panel/70 px-6 py-3 backdrop-blur-md">
            <Breadcrumb />
            <div className="ml-auto flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-1.5 text-muted shadow-sm transition-all focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/20">
                <Search className="h-4 w-4" />
                <input
                  placeholder="Search graph…"
                  className="w-48 bg-transparent text-[13px] text-ink outline-none placeholder:text-muted/70"
                />
              </div>
              <span className="flex items-center gap-1.5 rounded-full border border-warn/30 bg-warn/10 px-2.5 py-1 font-mono text-[10px] font-bold tracking-wider text-warn">
                <span className="h-1.5 w-1.5 rounded-full bg-warn animate-pulse"></span>
                PRODUCTION
              </span>
              <div className="h-5 w-px bg-line mx-1"></div>
              <button className="flex items-center gap-2.5 text-[13px] font-medium text-muted hover:text-ink transition-colors">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 font-mono text-[11px] font-bold text-accent border border-accent/20">
                  OP
                </div>
                <span className="hidden lg:inline">ops@controlgraph.io</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-70" />
              </button>
            </div>
          </header>
          <main className="min-w-0 flex-1 overflow-x-hidden px-6 py-5">
            <Outlet />
          </main>
        </div>
      </div>
    </DbHealthContext.Provider>
  );
}
