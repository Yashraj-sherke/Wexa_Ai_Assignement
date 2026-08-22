import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Play } from 'lucide-react';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';
import { RiskBadge, StatusBadge } from '../components/Badges';
import { EmptyState, InlineError, Panel, SkeletonPanel } from '../components/States';
import PageHeader from '../components/PageHeader';
import ResourceList, { KV } from '../components/ResourceList';
import GraphCanvas from '../features/graph/GraphCanvas';
import { riskBarColor } from '../utils/format';

function RiskFactors({ factors, score, level }: { factors: { label: string; points: number }[]; score: number; level: string }) {
  const max = Math.max(1, ...factors.map((f) => f.points));
  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <div className="font-mono text-[26px] leading-none font-semibold text-ink">{score}</div>
        <RiskBadge level={level} />
        <div className="ml-auto h-1.5 w-32 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(3, score))}%`, background: riskBarColor(level) }} />
        </div>
      </div>
      {factors.length === 0 ? (
        <p className="text-[12px] text-muted">No risk factors recorded.</p>
      ) : (
        <ul className="space-y-1.5">
          {factors.map((f) => (
            <li key={f.label} className="flex items-center gap-2">
              <span className="w-48 truncate text-[12px] text-ink">{f.label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full bg-accent" style={{ width: `${(f.points / max) * 100}%` }} />
              </div>
              <span className="w-8 text-right font-mono text-[11px] text-muted">+{f.points}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AgentDetail() {
  const { id = '' } = useParams();
  const agentQ = useApi(() => api.agent(id), [id]);
  const impactQ = useApi(() => api.agentImpact(id), [id]);
  const graphQ = useApi(() => api.graph('Agent', id, 2), [id]);

  if (agentQ.loading) {
    return (
      <div className="mx-auto max-w-[1400px] space-y-4">
        <SkeletonPanel className="h-24" />
        <SkeletonPanel className="h-96" />
      </div>
    );
  }
  if (agentQ.error || !agentQ.data) {
    return (
      <div className="mx-auto max-w-[1400px]">
        <Link to="/agents" className="mb-3 inline-flex items-center gap-1 text-[12px] text-muted hover:text-ink">
          <ArrowLeft className="h-3 w-3" /> Back to Agents
        </Link>
        <InlineError error={agentQ.error ?? { code: 'NOT_FOUND', message: 'Agent not found.' }} onRetry={agentQ.reload} />
      </div>
    );
  }

  const a = agentQ.data;

  return (
    <div className="mx-auto max-w-[1400px]">
      <Link to="/agents" className="mb-3 inline-flex items-center gap-1 text-[12px] text-muted hover:text-ink">
        <ArrowLeft className="h-3 w-3" /> Back to Agents
      </Link>
      <PageHeader
        title={a.name}
        subtitle={a.purpose}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={String(a.status)} />
            <RiskBadge level={String(a.riskLevel)} />
            <Link
              to={`/simulator?agent=${encodeURIComponent(a.id)}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-accent/40 bg-accent-soft px-2.5 py-1 text-[11.5px] font-medium text-accent hover:bg-accent/10"
            >
              <Play className="h-3 w-3" /> Simulate Permission
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Panel><KV label="Coworker">{a.coworker}</KV><KV label="Agent ID"><span className="font-mono text-[11px]">{a.id}</span></KV></Panel>
        <Panel>
          <KV label="Direct Resources">{impactQ.data?.directResources.length ?? '—'}</KV>
          <KV label="Indirect Resources">{impactQ.data?.indirectResources.length ?? '—'}</KV>
        </Panel>
        <Panel>
          <KV label="Sensitive Data Assets">{impactQ.data?.sensitiveDataAssets.length ?? '—'}</KV>
          <KV label="Systems">{impactQ.data?.systems.length ?? '—'}</KV>
        </Panel>
        <Panel>
          <KV label="Connectors">{impactQ.data?.connectors.length ?? '—'}</KV>
          <KV label="Workflows Affected">{impactQ.data?.workflowsAffected.length ?? '—'}</KV>
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel title="Direct Resources" className="xl:col-span-1">
          {impactQ.loading ? <div className="h-32 animate-pulse rounded bg-line/50" /> : impactQ.error ? <InlineError error={impactQ.error} onRetry={impactQ.reload} /> : (
            <ResourceList items={impactQ.data!.directResources} empty="No direct resource access." />
          )}
        </Panel>
        <Panel title="Indirect Resources" className="xl:col-span-1">
          {impactQ.loading ? <div className="h-32 animate-pulse rounded bg-line/50" /> : impactQ.data ? (
            <ResourceList items={impactQ.data.indirectResources} empty="No indirect reachability detected." />
          ) : null}
        </Panel>
        <Panel title="Sensitive Data Assets" className="xl:col-span-1">
          {impactQ.loading ? <div className="h-32 animate-pulse rounded bg-line/50" /> : impactQ.data ? (
            <ResourceList items={impactQ.data.sensitiveDataAssets} empty="No sensitive data assets reachable." />
          ) : null}
        </Panel>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel title="Risk Factor Breakdown" className="xl:col-span-1">
          {impactQ.loading ? <div className="h-40 animate-pulse rounded bg-line/50" /> : impactQ.data ? (
            <RiskFactors factors={impactQ.data.risk.factors} score={impactQ.data.risk.score} level={String(impactQ.data.risk.level)} />
          ) : null}
        </Panel>
        <Panel title="Systems & Connectors" className="xl:col-span-1">
          {impactQ.loading ? <div className="h-32 animate-pulse rounded bg-line/50" /> : impactQ.data ? (
            <div className="space-y-2">
              <ResourceList items={impactQ.data.systems} empty="No systems connected." />
              <div className="border-t border-line pt-2">
                <div className="mb-1 text-[10px] font-semibold tracking-[0.08em] text-muted uppercase">Connectors</div>
                <ResourceList items={impactQ.data.connectors} empty="No connectors in use." />
              </div>
            </div>
          ) : null}
        </Panel>
        <Panel title="Workflows Affected & Policies" className="xl:col-span-1">
          {impactQ.loading ? <div className="h-32 animate-pulse rounded bg-line/50" /> : impactQ.data ? (
            <div className="space-y-2">
              <ResourceList items={impactQ.data.workflowsAffected} empty="No workflows affected." />
              <div className="border-t border-line pt-2">
                <div className="mb-1 text-[10px] font-semibold tracking-[0.08em] text-muted uppercase">Policies</div>
                {impactQ.data.policies.length === 0 ? (
                  <p className="py-1 text-[12px] text-muted">No policies govern this agent.</p>
                ) : (
                  <ul className="divide-y divide-line/70">
                    {impactQ.data.policies.map((p) => (
                      <li key={p.id}>
                        <Link to={`/policies/${p.id}`} className="block py-1.5 text-[12.5px] text-ink hover:text-accent">
                          {p.name}
                          {p.effect && <span className="ml-2 font-mono text-[10px] tracking-wide text-muted uppercase">{p.effect}</span>}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : null}
        </Panel>
      </div>

      <Panel title="Access Impact Graph" className="mt-4">
        {graphQ.loading ? (
          <SkeletonPanel className="h-[420px]" />
        ) : graphQ.error ? (
          <InlineError error={graphQ.error} onRetry={graphQ.reload} />
        ) : (graphQ.data?.nodes ?? []).length === 0 ? (
          <EmptyState title="No graph data." hint="This agent has no connected nodes in the graph." />
        ) : (
          <GraphCanvas data={graphQ.data!} height={440} />
        )}
      </Panel>
    </div>
  );
}
