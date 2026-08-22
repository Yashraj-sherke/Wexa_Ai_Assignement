import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowDown, Play, RotateCcw } from 'lucide-react';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';
import { ApiError, GraphData, ImpactSnapshot, Permission, SimulationResult } from '../types';
import PageHeader from '../components/PageHeader';
import { Panel, SkeletonPanel } from '../components/States';
import { EmptyState, InlineError } from '../components/States';
import { RiskBadge, SensitivityBadge } from '../components/Badges';
import GraphCanvas from '../features/graph/GraphCanvas';
import ResourceList from '../components/ResourceList';

function Snapshot({ title, snap }: { title: string; snap: ImpactSnapshot }) {
  return (
    <div className="rounded-lg border border-line bg-panel px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10.5px] font-semibold tracking-[0.08em] text-muted uppercase">{title}</span>
        <RiskBadge level={String(snap.riskLevel)} score={snap.riskScore} />
      </div>
      <dl className="space-y-1 font-mono text-[12px]">
        <div className="flex justify-between"><dt className="text-muted">Resources</dt><dd className="text-ink">{snap.resources}</dd></div>
        <div className="flex justify-between"><dt className="text-muted">Sensitive assets</dt><dd className={snap.sensitiveAssets > 0 ? 'text-bad' : 'text-ink'}>{snap.sensitiveAssets}</dd></div>
        <div className="flex justify-between"><dt className="text-muted">Systems</dt><dd className="text-ink">{snap.systems}</dd></div>
      </dl>
    </div>
  );
}

function DeltaCell({ label, value }: { label: string; value: number }) {
  const up = value > 0;
  const down = value < 0;
  return (
    <div className="flex items-center justify-between font-mono text-[12px]">
      <span className="text-muted">{label}</span>
      <span className={up ? 'text-bad' : down ? 'text-ok' : 'text-muted'}>
        {up ? '+' : ''}{value}
      </span>
    </div>
  );
}

export default function Simulator() {
  const [params] = useSearchParams();
  const presetAgent = params.get('agent') ?? '';

  const agentsQ = useApi(() => api.agents(), []);
  const permsQ = useApi(() => api.permissions(), []);

  const [agentId, setAgentId] = useState(presetAgent);
  const [permissionId, setPermissionId] = useState('');
  const [mode, setMode] = useState<'grant' | 'revoke'>('grant');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    if (presetAgent) setAgentId(presetAgent);
  }, [presetAgent]);

  useEffect(() => {
    if (!permissionId && permsQ.data && permsQ.data.length > 0) setPermissionId(permsQ.data[0].id);
  }, [permsQ.data, permissionId]);

  const selectedAgent = useMemo(
    () => (agentsQ.data ?? []).find((a) => a.id === agentId) ?? null,
    [agentsQ.data, agentId],
  );

  async function run() {
    if (!agentId || !permissionId) return;
    setRunning(true);
    setError(null);
    try {
      const r = await api.simulate({ agentId, permissionId, mode });
      setResult(r);
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError('UNKNOWN', String(e)));
      setResult(null);
    } finally {
      setRunning(false);
    }
  }

  const pathsGraph: GraphData | null = useMemo(() => {
    if (!result || result.newPaths.length === 0) return null;
    const nodes = result.newPaths.flatMap((p) => p.nodes).filter((n, i, arr) => arr.findIndex((x) => x.id === n.id) === i);
    const edges = result.newPaths.flatMap((p) => p.edges.map((e) => ({ source: e.source, target: e.target, type: e.type })));
    return { nodes, edges };
  }, [result]);

  const riskWorsened =
    result != null && result.after.riskScore > result.before.riskScore;

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Permission Simulator"
        subtitle="Preview the reachability impact of granting or revoking a permission before changing it."
      />

      {/* Configuration */}
      <Panel title="Simulation Setup" className="mb-4">
        {agentsQ.loading || permsQ.loading ? (
          <SkeletonPanel className="h-16" />
        ) : agentsQ.error ? (
          <InlineError error={agentsQ.error} onRetry={agentsQ.reload} />
        ) : (
          <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-4">
            <label className="block">
              <span className="mb-1 block text-[10.5px] font-semibold tracking-[0.08em] text-muted uppercase">Agent</span>
              <select
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className="w-full rounded-md border border-line bg-canvas px-2.5 py-1.5 text-[12.5px] text-ink outline-none focus:border-accent"
              >
                <option value="">Select an agent…</option>
                {(agentsQ.data ?? []).map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[10.5px] font-semibold tracking-[0.08em] text-muted uppercase">Permission</span>
              <select
                value={permissionId}
                onChange={(e) => setPermissionId(e.target.value)}
                className="w-full rounded-md border border-line bg-canvas px-2.5 py-1.5 text-[12.5px] text-ink outline-none focus:border-accent"
              >
                <option value="">Select a permission…</option>
                {(permsQ.data ?? []).map((p: Permission) => (
                  <option key={p.id} value={p.id}>{p.action} · {p.scope}</option>
                ))}
              </select>
            </label>
            <div>
              <span className="mb-1 block text-[10.5px] font-semibold tracking-[0.08em] text-muted uppercase">Mode</span>
              <div className="flex rounded-md border border-line bg-canvas p-0.5">
                {(['grant', 'revoke'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 rounded px-3 py-1 font-mono text-[11px] tracking-wide uppercase ${
                      mode === m ? 'bg-accent-soft font-semibold text-accent' : 'text-muted hover:text-ink'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={run}
                disabled={!agentId || !permissionId || running}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-accent bg-accent px-3 py-1.5 text-[12px] font-medium text-white hover:opacity-90 disabled:opacity-40"
              >
                <Play className="h-3.5 w-3.5" /> {running ? 'Simulating…' : 'Run Simulation'}
              </button>
              {result && (
                <button
                  onClick={() => setResult(null)}
                  title="Clear results"
                  className="rounded-md border border-line bg-panel p-1.5 text-muted hover:text-ink"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
        {selectedAgent && (
          <p className="mt-2 font-mono text-[10.5px] text-muted">
            agent {selectedAgent.id} · current risk {String(selectedAgent.riskLevel)}
          </p>
        )}
      </Panel>

      {error && <div className="mb-4"><InlineError error={error} onRetry={run} /></div>}

      {!result && !error && (
        <EmptyState
          title="No simulation results yet."
          hint="Select an agent, permission, and mode — then run the simulation to preview the impact."
        />
      )}

      {result && (
        <>
          {riskWorsened && (
            <div className="mb-4 rounded-md border border-bad/40 bg-bad-soft px-4 py-2.5 text-[12px] font-medium text-bad">
              Risk increases from {result.before.riskScore} to {result.after.riskScore} under this change. Review newly reachable sensitive assets below.
            </div>
          )}
          {/* Before / After / Delta */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Snapshot title="Before" snap={result.before} />
            <div className="flex items-center justify-center">
              <ArrowDown className="h-5 w-5 rotate-90 text-muted lg:rotate-0" />
            </div>
            <Snapshot title="After (simulated)" snap={result.after} />
          </div>
          <Panel title="Delta" className="mt-4">
            <div className="mx-auto max-w-sm space-y-1.5">
              <DeltaCell label="Resources" value={result.delta.resources} />
              <DeltaCell label="Sensitive assets" value={result.delta.sensitiveAssets} />
              <DeltaCell label="Systems" value={result.delta.systems} />
            </div>
          </Panel>

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Panel title="Newly Reachable (simulated)">
              {result.newlyReachable.length === 0 ? (
                <EmptyState title="No newly reachable nodes." hint="This change does not alter the agent's reachability." />
              ) : (
                <ul className="divide-y divide-line/70">
                  {result.newlyReachable.map((n, i) => (
                    <li key={`${n.id}-${i}`} className="flex items-center gap-2 py-1.5">
                      <span className="w-20 shrink-0 font-mono text-[9.5px] tracking-wide text-muted uppercase">{n.type}</span>
                      <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink">{n.label}</span>
                      {n.sensitivity && <SensitivityBadge sensitivity={n.sensitivity} />}
                      <span className="shrink-0 rounded border border-accent/40 bg-accent-soft px-1.5 py-px font-mono text-[9px] font-semibold tracking-wider text-accent uppercase">
                        Simulated
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Panel title="New Access Paths">
              {result.newPaths.length === 0 ? (
                <EmptyState title="No new paths." hint="No new graph paths are opened by this change." />
              ) : (
                <div className="space-y-3">
                  <ul className="space-y-2">
                    {result.newPaths.map((p, i) => (
                      <li key={i} className="rounded border border-line bg-canvas px-3 py-2">
                        <div className="flex flex-wrap items-center gap-1 font-mono text-[11px]">
                          {p.nodes.map((n, j) => (
                            <span key={`${n.id}-${j}`} className="flex items-center gap-1">
                              {j > 0 && <span className="text-line">→</span>}
                              <span className={j === 0 ? 'font-semibold text-accent' : 'text-ink'}>{n.label}</span>
                            </span>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Panel>
          </div>

          {pathsGraph && (
            <Panel title="Simulated Path Graph" className="mt-4">
              <GraphCanvas data={pathsGraph} height={360} />
            </Panel>
          )}
        </>
      )}
    </div>
  );
}
