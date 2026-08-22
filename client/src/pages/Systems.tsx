import { api } from '../services/api';
import { useApi } from '../hooks/useApi';
import { SystemRecord } from '../types';
import DataTable, { Column } from '../components/DataTable';
import { StatusBadge } from '../components/Badges';
import { EmptyState, InlineError, SkeletonRows } from '../components/States';
import PageHeader from '../components/PageHeader';

export default function Systems() {
  const q = useApi(() => api.systems(), []);

  const columns: Column<SystemRecord>[] = [
    {
      key: 'name', header: 'System',
      render: (s) => (
        <div>
          <div className="font-medium text-ink">{s.name}</div>
          <div className="font-mono text-[10.5px] text-muted">{s.id}</div>
        </div>
      ),
      sortValue: (s) => s.name,
      className: 'min-w-[200px]',
    },
    { key: 'type', header: 'Type', render: (s) => <span className="font-mono text-[11.5px]">{s.type ?? '—'}</span>, sortValue: (s) => s.type ?? '' },
    {
      key: 'criticality', header: 'Criticality',
      render: (s) =>
        s.criticality ? (
          <span className="font-mono text-[10.5px] tracking-wide uppercase text-muted">{s.criticality}</span>
        ) : (
          <span className="text-muted">—</span>
        ),
      sortValue: (s) => s.criticality ?? '',
    },
    { key: 'status', header: 'Status', render: (s) => (s.status ? <StatusBadge status={String(s.status)} /> : <span className="text-muted">—</span>), sortValue: (s) => s.status ?? '' },
    { key: 'description', header: 'Description', render: (s) => <span className="text-[12px] text-muted">{s.description ?? '—'}</span> },
  ];

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader title="Systems" subtitle="Connected enterprise systems reachable through the graph." />
      {q.loading ? (
        <SkeletonRows rows={6} cols={5} />
      ) : q.error ? (
        <InlineError error={q.error} onRetry={q.reload} />
      ) : (q.data ?? []).length === 0 ? (
        <EmptyState title="No systems connected." hint="Connect a system to begin mapping reachable data." />
      ) : (
        <DataTable columns={columns} rows={q.data!} rowKey={(s) => s.id} initialSort={{ key: 'name', dir: 'asc' }} />
      )}
    </div>
  );
}
