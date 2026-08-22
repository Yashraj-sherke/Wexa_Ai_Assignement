import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';
import { RiskBadge, StatusBadge } from '../components/Badges';
import { EmptyState, InlineError, Panel, SkeletonPanel, SkeletonRows } from '../components/States';
import PageHeader from '../components/PageHeader';
import ResourceList, { KV } from '../components/ResourceList';
import GraphCanvas from '../features/graph/GraphCanvas';
import { numericValue, timeAgo } from '../utils/format';

export default function CoworkerDetail() {
  const { id = '' } = useParams();
  const q = useApi(() => api.coworker(id), [id]);
  const g = useApi(() => api.graph('Coworker', id, 2), [id]);

  if (q.loading) {
    return (
      <div className="mx-auto max-w-[1400px] space-y-4">
        <SkeletonPanel className="h-24" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <SkeletonPanel className="h-64" />
          <SkeletonPanel className="h-64" />
          <SkeletonPanel className="h-64" />
        </div>
      </div>
    );
  }
  if (q.error || !q.data) {
    return (
      <div className="mx-auto max-w-[1400px]">
        <Link to="/coworkers" className="mb-3 inline-flex items-center gap-1 text-[12px] text-muted hover:text-ink">
          <ArrowLeft className="h-3 w-3" /> Back to Coworkers
        </Link>
        <InlineError error={q.error ?? { code: 'NOT_FOUND', message: 'Coworker not found.' }} onRetry={q.reload} />
      </div>
    );
  }

  const c = q.data;

  return (
    <div className="mx-auto max-w-[1400px]">
      <Link to="/coworkers" className="mb-3 inline-flex items-center gap-1 text-[12px] text-muted hover:text-ink">
        <ArrowLeft className="h-3 w-3" /> Back to Coworkers
      </Link>
      <PageHeader
        title={c.name}
        subtitle={c.description}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={String(c.status)} />
            <RiskBadge level={String(c.riskLevel)} score={c.riskScore} />
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Panel><KV label="Owner">{c.owner}</KV><KV label="Environment">{c.environment}</KV></Panel>
        <Panel><KV label="Workflows">{numericValue(c.workflows)}</KV><KV label="Agents">{numericValue(c.agents)}</KV></Panel>
        <Panel><KV label="Systems">{numericValue(c.systems)}</KV><KV label="Accessible Resources">{c.accessibleResources.length}</KV></Panel>
        <Panel><KV label="Policies">{c.policies.length}</KV><KV label="Recent Actions">{c.recentActions.length}</KV></Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel title="Accessible Resources">
          <ResourceList items={c.accessibleResources} empty="No reachable resources recorded." />
        </Panel>
        <Panel title="Governing Policies">
          {c.policies.length === 0 ? (
            <p className="py-2 text-[12px] text-muted">No policies apply to this coworker.</p>
          ) : (
            <ul className="divide-y divide-line/70">
              {c.policies.map((p) => (
                <li key={p.id}>
                  <Link to={`/policies/${p.id}`} className="flex items-center justify-between py-1.5 hover:bg-canvas/60">
                    <span className="text-[12.5px] text-ink">{p.name}</span>
                    {p.effect && <span className="font-mono text-[10px] tracking-wide text-muted uppercase">{p.effect}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Recent Actions">
          {c.recentActions.length === 0 ? (
            <EmptyState title="No recent actions." hint="Decision activity will appear here as this coworker's agents act." />
          ) : (
            <ul className="divide-y divide-line/70">
              {c.recentActions.map((a) => (
                <li key={a.id}>
                  <Link to={`/actions/${a.id}`} className="flex items-center justify-between gap-2 py-1.5 hover:bg-canvas/60">
                    <span className="min-w-0 truncate font-mono text-[11px] text-ink">{a.type}</span>
                    <span className="shrink-0 font-mono text-[10px] text-muted">{a.timestamp ? timeAgo(a.timestamp) : ''}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Reachability Graph" className="mt-4">
        {g.loading ? (
          <SkeletonPanel className="h-[420px]" />
        ) : g.error ? (
          <InlineError error={g.error} onRetry={g.reload} />
        ) : (g.data?.nodes ?? []).length === 0 ? (
          <EmptyState title="No graph data." hint="This coworker has no connected nodes in the graph." />
        ) : (
          <GraphCanvas data={g.data!} height={440} />
        )}
      </Panel>
    </div>
  );
}
