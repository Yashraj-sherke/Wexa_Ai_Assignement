import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, ShieldCheck, X } from 'lucide-react';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';
import { StatusBadge } from '../components/Badges';
import { InlineError, Panel, SkeletonPanel, SkeletonRows } from '../components/States';
import PageHeader from '../components/PageHeader';
import { KV } from '../components/ResourceList';
import { formatTimestamp } from '../utils/format';

export default function ActionDetail() {
  const { id = '' } = useParams();
  const q = useApi(() => api.actionTrace(id), [id]);

  if (q.loading) {
    return (
      <div className="mx-auto max-w-[1400px] space-y-4">
        <SkeletonPanel className="h-24" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <SkeletonPanel className="h-72" />
          <SkeletonPanel className="h-72" />
          <SkeletonPanel className="h-72" />
        </div>
        <SkeletonRows rows={4} cols={3} />
      </div>
    );
  }
  if (q.error || !q.data) {
    return (
      <div className="mx-auto max-w-[1400px]">
        <Link to="/actions" className="mb-3 inline-flex items-center gap-1 text-[12px] text-muted hover:text-ink">
          <ArrowLeft className="h-3 w-3" /> Back to Actions
        </Link>
        <InlineError error={q.error ?? { code: 'NOT_FOUND', message: 'Action not found.' }} onRetry={q.reload} />
      </div>
    );
  }

  const { action, path, checks, policy } = q.data;

  return (
    <div className="mx-auto max-w-[1400px]">
      <Link to="/actions" className="mb-3 inline-flex items-center gap-1 text-[12px] text-muted hover:text-ink">
        <ArrowLeft className="h-3 w-3" /> Back to Actions
      </Link>
      <PageHeader
        title={`Action ${action.type}`}
        subtitle={action.reason}
        actions={<StatusBadge status={String(action.status)} />}
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Panel><KV label="Action ID"><span className="font-mono text-[11px]">{action.id}</span></KV><KV label="Type"><span className="font-mono text-[11px]">{action.type}</span></KV></Panel>
        <Panel><KV label="Timestamp"><span className="font-mono text-[11px]">{action.timestamp ? formatTimestamp(action.timestamp) : '—'}</span></KV><KV label="Status">{action.status}</KV></Panel>
        <Panel>
          <KV label="Responsible Policy">
            {policy ? (
              <Link to={`/policies/${policy.id}`} className="font-medium text-accent hover:underline">{policy.name}</Link>
            ) : (
              'None'
            )}
          </KV>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {/* Vertical decision path */}
        <Panel title="Decision Path">
          <ol className="relative ml-2 border-l border-line">
            {path.map((n, i) => (
              <li key={`${n.id}-${i}`} className="relative mb-4 ml-5 last:mb-0">
                <span
                  className="absolute top-1 -left-[27px] flex h-3 w-3 items-center justify-center rounded-full border-2 border-panel"
                  style={{ background: n.type === 'Policy' ? '#6f9a7a' : n.type === 'DataAsset' ? '#b0574f' : '#64748b' }}
                />
                <div className="font-mono text-[9.5px] tracking-wide text-muted uppercase">{n.type}</div>
                <div className="text-[13px] font-medium text-ink">{n.label}</div>
              </li>
            ))}
          </ol>
          {policy && (
            <div className="mt-3 flex items-center gap-2 rounded border border-ok/30 bg-ok-soft px-3 py-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-ok" />
              <p className="text-[12px] text-ink">
                Decision governed by <Link to={`/policies/${policy.id}`} className="font-medium text-accent hover:underline">{policy.name}</Link>
              </p>
            </div>
          )}
        </Panel>

        {/* Policy checks */}
        <Panel title="Policy Checks">
          <ul className="divide-y divide-line/70">
            {checks.map((c, i) => (
              <li key={i} className="flex items-start gap-2.5 py-2">
                {c.passed ? (
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-ok" />
                ) : (
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-bad" />
                )}
                <div className="min-w-0">
                  <div className="text-[12.5px] font-medium text-ink">{c.label}</div>
                  <div className="text-[11.5px] text-muted">{c.reason}</div>
                </div>
                <span
                  className={`ml-auto shrink-0 font-mono text-[9.5px] font-semibold tracking-wider uppercase ${
                    c.passed ? 'text-ok' : 'text-bad'
                  }`}
                >
                  {c.passed ? 'PASS' : 'FAIL'}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
