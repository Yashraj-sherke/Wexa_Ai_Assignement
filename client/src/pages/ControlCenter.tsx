import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';
import { Agent, Coworker, ActionRecord, Policy } from '../types';
import { EmptyState, InlineError, Panel, SkeletonPanel, SkeletonRows } from '../components/States';
import { RiskBadge, StatusBadge } from '../components/Badges';
import PageHeader from '../components/PageHeader';
import { entityName, numericValue, timeAgo } from '../utils/format';

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

function StatTile({ label, value, to }: { label: string; value: number | string; to: string }) {
  return (
    <Link
      to={to}
      className="rounded-lg border border-line bg-panel px-4 py-3 transition-colors hover:border-accent/50 hover:bg-accent-soft/30"
    >
      <div className="text-[10.5px] font-semibold tracking-[0.08em] text-muted uppercase">{label}</div>
      <div className="mt-1 font-mono text-[22px] leading-none font-semibold text-ink">
        {value}
      </div>
    </Link>
  );
}

export default function ControlCenter() {
  const coworkersQ = useApi(() => api.coworkers(), []);
  const agentsQ = useApi(() => api.agents(), []);
  const systemsQ = useApi(() => api.systems(), []);
  const assetsQ = useApi(() => api.dataAssets(), []);
  const policiesQ = useApi(() => api.policies(), []);
  const actionsQ = useApi(() => api.actions({ limit: 8 }), []);

  const dbDown =
    coworkersQ.error?.code === 'DB_UNAVAILABLE' && agentsQ.error?.code === 'DB_UNAVAILABLE';

  // Treat malformed/null list entries as absent instead of letting one bad API
  // row take down the entire dashboard.
  const coworkers = (coworkersQ.data ?? []).filter(isPresent);
  const agents = (agentsQ.data ?? []).filter(isPresent);
  const systems = (systemsQ.data ?? []).filter(isPresent);
  const assets = (assetsQ.data ?? []).filter(isPresent);
  const policies = (policiesQ.data ?? []).filter(isPresent);
  const recentActions = (actionsQ.data?.actions ?? []).filter(isPresent);
  const highRiskAgents: Agent[] = agents.filter((a) =>
    ['HIGH', 'CRITICAL'].includes(String(a.riskLevel ?? '').toUpperCase()),
  );
  const policyWarnings = policies.filter(
    (p: Policy) => String(p.status ?? '').toUpperCase() !== 'ACTIVE',
  );

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Control Center"
        subtitle="Understand what your AI can reach before it acts."
      />

      {dbDown && (
        <div className="mb-4">
          <InlineError error={coworkersQ.error!} onRetry={() => window.location.reload()} />
        </div>
      )}

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {coworkersQ.loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonPanel key={i} className="h-[64px]" />)
        ) : (
          <>
            <StatTile label="Coworkers" value={coworkers.length} to="/coworkers" />
            <StatTile label="Agents" value={agents.length} to="/agents" />
            <StatTile label="Connected Systems" value={systems.length} to="/systems" />
            <StatTile label="Protected Data Assets" value={assets.length} to="/data-assets" />
            <StatTile label="Active Policies" value={policies.length} to="/policies" />
          </>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* High-risk agents */}
        <Panel title="High-Risk Agents" className="xl:col-span-1">
          {agentsQ.loading ? (
            <SkeletonRows rows={4} cols={3} />
          ) : agentsQ.error ? (
            <InlineError error={agentsQ.error} onRetry={agentsQ.reload} />
          ) : highRiskAgents.length === 0 ? (
            <EmptyState title="No high-risk agents." hint="All agents currently carry LOW or MEDIUM risk." />
          ) : (
            <ul className="divide-y divide-line/70">
              {highRiskAgents.slice(0, 8).map((a) => (
                <li key={a.id}>
                  <Link to={`/agents/${a.id}`} className="flex items-center justify-between gap-2 py-2 hover:bg-canvas/60">
                    <div className="min-w-0">
                      <div className="truncate text-[12.5px] font-medium text-ink">{a.name}</div>
                      <div className="truncate font-mono text-[10.5px] text-muted">{a.coworker}</div>
                    </div>
                    <RiskBadge level={String(a.riskLevel)} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Policy warnings */}
        <Panel title="Policy Warnings" className="xl:col-span-1">
          {policiesQ.loading ? (
            <SkeletonRows rows={3} cols={2} />
          ) : policiesQ.error ? (
            <InlineError error={policiesQ.error} onRetry={policiesQ.reload} />
          ) : policyWarnings.length === 0 ? (
            <EmptyState
              title="No policy conflicts detected."
              hint="All policies are active and evaluated without conflicts."
            />
          ) : (
            <ul className="space-y-2">
              {policyWarnings.map((p: Policy) => (
                  <li key={p.id} className="flex items-start gap-2.5 rounded border border-warn/30 bg-warn-soft px-3 py-2">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warn" />
                    <div className="min-w-0">
                      <Link to={`/policies/${p.id}`} className="text-[12.5px] font-medium text-ink hover:text-accent">
                        {p.name}
                      </Link>
                      <p className="font-mono text-[10.5px] text-muted">
                        status {p.status} · priority {numericValue(p.priority)}
                      </p>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </Panel>

        {/* Recent activity */}
        <Panel
          title="Recent Activity"
          className="xl:col-span-1"
          actions={
            <Link to="/actions" className="flex items-center gap-1 text-[11px] font-medium text-accent hover:underline">
              All actions <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          {actionsQ.loading ? (
            <SkeletonRows rows={6} cols={3} />
          ) : actionsQ.error ? (
            <InlineError error={actionsQ.error} onRetry={actionsQ.reload} />
          ) : recentActions.length === 0 ? (
            <EmptyState title="No actions recorded." hint="Decision activity will appear here as agents act." />
          ) : (
            <ul className="divide-y divide-line/70">
              {recentActions.map((a: ActionRecord) => (
                <li key={a.id}>
                  <Link to={`/actions/${a.id}`} className="flex items-center justify-between gap-2 py-2 hover:bg-canvas/60">
                    <div className="min-w-0">
                      <div className="truncate text-[12.5px] text-ink">
                        <span className="font-medium">{entityName(a.agent, a.type)}</span>
                        {a.system && <span className="text-muted"> → {a.system}</span>}
                      </div>
                      <div className="truncate font-mono text-[10.5px] text-muted">
                        {a.type} · {a.timestamp ? timeAgo(a.timestamp) : ''}
                      </div>
                    </div>
                    <StatusBadge status={String(a.status)} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Coworker risk strip */}
      <Panel title="Coworker Risk Overview" className="mt-4">
        {coworkersQ.loading ? (
          <SkeletonRows rows={4} cols={6} />
        ) : coworkersQ.error ? (
          <InlineError error={coworkersQ.error} onRetry={coworkersQ.reload} />
        ) : coworkers.length === 0 ? (
          <EmptyState title="No coworkers registered." hint="Coworkers appear once onboarded into ControlGraph." />
        ) : (
          <ul className="divide-y divide-line/70">
            {coworkers.map((c: Coworker) => (
              <li key={c.id}>
                <Link to={`/coworkers/${c.id}`} className="flex items-center gap-4 py-2 hover:bg-canvas/60">
                  <span className="w-44 truncate text-[12.5px] font-medium text-ink">{c.name}</span>
                  <span className="w-32 truncate font-mono text-[10.5px] text-muted">{c.owner}</span>
                  <span className="font-mono text-[10.5px] text-muted">{numericValue(c.agents)} agents · {numericValue(c.systems)} systems</span>
                  <div className="ml-auto flex items-center gap-3">
                    <div className="h-1.5 w-28 overflow-hidden rounded-full bg-line">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, Math.max(4, numericValue(c.riskScore)))}%`,
                          background:
                            ['HIGH', 'CRITICAL'].includes(String(c.riskLevel ?? '').toUpperCase())
                              ? '#a83a32'
                              : String(c.riskLevel ?? '').toUpperCase() === 'MEDIUM'
                                ? '#a3670a'
                                : '#2e7d4f',
                        }}
                      />
                    </div>
                    <RiskBadge level={String(c.riskLevel)} score={c.riskScore} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
