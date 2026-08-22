import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';
import { StatusBadge } from '../components/Badges';
import { EmptyState, InlineError, Panel, SkeletonPanel } from '../components/States';
import PageHeader from '../components/PageHeader';
import ResourceList, { KV } from '../components/ResourceList';
import { numericValue, timeAgo } from '../utils/format';

export default function PolicyDetail() {
  const { id = '' } = useParams();
  const q = useApi(() => api.policy(id), [id]);

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
        <Link to="/policies" className="mb-3 inline-flex items-center gap-1 text-[12px] text-muted hover:text-ink">
          <ArrowLeft className="h-3 w-3" /> Back to Policies
        </Link>
        <InlineError error={q.error ?? { code: 'NOT_FOUND', message: 'Policy not found.' }} onRetry={q.reload} />
      </div>
    );
  }

  const p = q.data;

  return (
    <div className="mx-auto max-w-[1400px]">
      <Link to="/policies" className="mb-3 inline-flex items-center gap-1 text-[12px] text-muted hover:text-ink">
        <ArrowLeft className="h-3 w-3" /> Back to Policies
      </Link>
      <PageHeader
        title={p.name}
        subtitle={p.description}
        actions={
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex rounded border px-1.5 py-px font-mono text-[10px] font-medium tracking-wide uppercase ${
                String(p.effect).toUpperCase() === 'DENY' ? 'border-bad/30 bg-bad-soft text-bad' : 'border-ok/30 bg-ok-soft text-ok'
              }`}
            >
              {p.effect}
            </span>
            <StatusBadge status={String(p.status)} />
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Panel><KV label="Scope"><span className="font-mono text-[11px]">{p.scope}</span></KV><KV label="Priority">{numericValue(p.priority)}</KV></Panel>
        <Panel><KV label="Governed Agents">{Array.isArray(p.agents) ? p.agents.length : numericValue(p.agents)}</KV><KV label="Resources">{Array.isArray(p.resources) ? p.resources.length : numericValue(p.resources)}</KV></Panel>
        <Panel><KV label="Permissions">{p.permissions?.length ?? 0}</KV><KV label="Approval Gates">{p.approvalGates?.length ?? 0}</KV></Panel>
        <Panel><KV label="Policy ID"><span className="font-mono text-[11px]">{p.id}</span></KV></Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Panel title="Permissions">
          {(p.permissions ?? []).length === 0 ? (
            <p className="py-2 text-[12px] text-muted">No permissions attached.</p>
          ) : (
            <ul className="divide-y divide-line/70">
              {(p.permissions ?? []).map((perm) => (
                <li key={perm.id} className="flex items-center justify-between py-1.5">
                  <span className="font-mono text-[11.5px] text-ink">{perm.action}</span>
                  {perm.scope && <span className="font-mono text-[10px] text-muted">{perm.scope}</span>}
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Approval Gates">
          {(p.approvalGates ?? []).length === 0 ? (
            <p className="py-2 text-[12px] text-muted">No approval gates configured.</p>
          ) : (
            <ul className="divide-y divide-line/70">
              {(p.approvalGates ?? []).map((g, i) => (
                <li key={i} className="py-1.5 text-[12.5px] text-ink">{g.label}</li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Recent Decisions">
          {(p.recentDecisions ?? []).length === 0 ? (
            <EmptyState title="No recent decisions." hint="Decisions made under this policy will appear here." />
          ) : (
            <ul className="divide-y divide-line/70">
              {(p.recentDecisions ?? []).map((a) => (
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
    </div>
  );
}
