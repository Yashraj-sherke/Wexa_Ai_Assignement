import { api } from '../services/api';
import { useApi } from '../hooks/useApi';
import { DataAsset } from '../types';
import DataTable, { Column } from '../components/DataTable';
import { SensitivityBadge } from '../components/Badges';
import { EmptyState, InlineError, SkeletonRows } from '../components/States';
import PageHeader from '../components/PageHeader';

export default function DataAssets() {
  const q = useApi(() => api.dataAssets(), []);

  const columns: Column<DataAsset>[] = [
    {
      key: 'name', header: 'Data Asset',
      render: (d) => (
        <div>
          <div className="font-medium text-ink">{d.name}</div>
          <div className="font-mono text-[10.5px] text-muted">{d.id}</div>
        </div>
      ),
      sortValue: (d) => d.name,
      className: 'min-w-[220px]',
    },
    { key: 'system', header: 'System', render: (d) => <span className="font-mono text-[11.5px]">{d.system ?? '—'}</span>, sortValue: (d) => d.system ?? '' },
    { key: 'type', header: 'Type', render: (d) => <span className="font-mono text-[11.5px]">{d.type ?? '—'}</span>, sortValue: (d) => d.type ?? '' },
    { key: 'sensitivity', header: 'Sensitivity', render: (d) => <SensitivityBadge sensitivity={String(d.sensitivity ?? '')} />, sortValue: (d) => String(d.sensitivity ?? '') },
    { key: 'description', header: 'Description', render: (d) => <span className="text-[12px] text-muted">{d.description ?? '—'}</span> },
  ];

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader title="Data Assets" subtitle="Data reachable through connected systems." />
      {q.loading ? (
        <SkeletonRows rows={6} cols={5} />
      ) : q.error ? (
        <InlineError error={q.error} onRetry={q.reload} />
      ) : (q.data ?? []).length === 0 ? (
        <EmptyState title="No data assets discovered." hint="Data assets appear as the graph is populated." />
      ) : (
        <DataTable columns={columns} rows={q.data!} rowKey={(d) => d.id} initialSort={{ key: 'sensitivity', dir: 'asc' }} />
      )}
    </div>
  );
}
