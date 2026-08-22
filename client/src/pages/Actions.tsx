import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';
import { ActionRecord } from '../types';
import DataTable, { Column } from '../components/DataTable';
import { StatusBadge } from '../components/Badges';
import { EmptyState, InlineError, SkeletonRows } from '../components/States';
import PageHeader from '../components/PageHeader';
import { entityName, formatTimestamp } from '../utils/format';

const PAGE_SIZE = 25;
const STATUS_FILTERS = ['ALL', 'ALLOWED', 'ALLOWED_WITH_APPROVAL', 'BLOCKED'];

export default function Actions() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('ALL');
  const [offset, setOffset] = useState(0);

  const q = useApi(
    () => api.actions({ limit: PAGE_SIZE, offset, status: status === 'ALL' ? undefined : status }),
    [status, offset],
  );

  const columns: Column<ActionRecord>[] = [
    { key: 'timestamp', header: 'Timestamp', render: (a) => <span className="font-mono text-[11px] whitespace-nowrap">{a.timestamp ? formatTimestamp(a.timestamp) : '—'}</span>, sortValue: (a) => a.timestamp },
    { key: 'type', header: 'Action', render: (a) => <span className="font-mono text-[11.5px]">{a.type}</span>, sortValue: (a) => a.type },
    { key: 'agent', header: 'Agent', render: (a) => <span className="text-[12px]">{entityName(a.agent)}</span>, sortValue: (a) => entityName(a.agent, '') },
    { key: 'system', header: 'System', render: (a) => <span className="font-mono text-[11.5px]">{a.system ?? '—'}</span>, sortValue: (a) => a.system ?? '' },
    { key: 'reason', header: 'Reason', render: (a) => <span className="max-w-md truncate text-[12px] text-muted">{a.reason ?? '—'}</span> },
    { key: 'status', header: 'Status', render: (a) => <StatusBadge status={String(a.status)} />, sortValue: (a) => String(a.status) },
  ];

  const total = q.data?.total ?? 0;

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader
        title="Actions"
        subtitle="Decision log of every evaluated agent action."
        actions={
          <div className="flex items-center gap-1 rounded-md border border-line bg-panel p-0.5">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => { setStatus(s); setOffset(0); }}
                className={`rounded px-2 py-1 font-mono text-[10.5px] tracking-wide ${
                  status === s ? 'bg-accent-soft font-semibold text-accent' : 'text-muted hover:text-ink'
                }`}
              >
                {s.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        }
      />
      {q.loading ? (
        <SkeletonRows rows={8} cols={6} />
      ) : q.error ? (
        <InlineError error={q.error} onRetry={q.reload} />
      ) : (q.data?.actions ?? []).length === 0 ? (
        <EmptyState title="No actions recorded." hint={status !== 'ALL' ? `No ${status.replace(/_/g, ' ').toLowerCase()} actions in the log.` : 'Decision activity will appear here as agents act.'} />
      ) : (
        <>
          <DataTable columns={columns} rows={q.data!.actions} rowKey={(a) => a.id} onRowClick={(a) => navigate(`/actions/${a.id}`)} initialSort={{ key: 'timestamp', dir: 'desc' }} />
          <div className="mt-3 flex items-center justify-between">
            <span className="font-mono text-[11px] text-muted">
              {total} total · showing {offset + 1}–{Math.min(offset + PAGE_SIZE, total)}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={offset === 0}
                onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
                className="rounded border border-line bg-panel p-1.5 text-muted hover:text-ink disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                disabled={offset + PAGE_SIZE >= total}
                onClick={() => setOffset((o) => o + PAGE_SIZE)}
                className="rounded border border-line bg-panel p-1.5 text-muted hover:text-ink disabled:opacity-40"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
