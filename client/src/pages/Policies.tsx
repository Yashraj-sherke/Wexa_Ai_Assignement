import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';
import { Policy } from '../types';
import DataTable, { Column } from '../components/DataTable';
import { StatusBadge } from '../components/Badges';
import { EmptyState, InlineError, SkeletonRows } from '../components/States';
import PageHeader from '../components/PageHeader';
import { numericValue } from '../utils/format';

export default function Policies() {
  const navigate = useNavigate();
  const q = useApi(() => api.policies(), []);

  const columns: Column<Policy>[] = [
    {
      key: 'name', header: 'Policy',
      render: (p) => (
        <div>
          <div className="font-medium text-ink">{p.name}</div>
          <div className="font-mono text-[10.5px] text-muted">{p.id}</div>
        </div>
      ),
      sortValue: (p) => p.name,
      className: 'min-w-[220px]',
    },
    {
      key: 'effect', header: 'Effect',
      render: (p) => (
        <span
          className={`inline-flex rounded border px-1.5 py-px font-mono text-[10px] font-medium tracking-wide uppercase ${
            String(p.effect).toUpperCase() === 'DENY'
              ? 'border-bad/30 bg-bad-soft text-bad'
              : 'border-ok/30 bg-ok-soft text-ok'
          }`}
        >
          {p.effect}
        </span>
      ),
      sortValue: (p) => String(p.effect),
    },
    { key: 'scope', header: 'Scope', render: (p) => <span className="font-mono text-[11.5px]">{p.scope}</span>, sortValue: (p) => p.scope },
    { key: 'agents', header: 'Agents', render: (p) => <span className="font-mono">{Array.isArray(p.agents) ? p.agents.length : numericValue(p.agents)}</span>, sortValue: (p) => (Array.isArray(p.agents) ? p.agents.length : numericValue(p.agents)) },
    { key: 'resources', header: 'Resources', render: (p) => <span className="font-mono">{Array.isArray(p.resources) ? p.resources.length : numericValue(p.resources)}</span>, sortValue: (p) => (Array.isArray(p.resources) ? p.resources.length : numericValue(p.resources)) },
    { key: 'priority', header: 'Priority', render: (p) => <span className="font-mono">{numericValue(p.priority)}</span>, sortValue: (p) => numericValue(p.priority) },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={String(p.status)} />, sortValue: (p) => String(p.status) },
  ];

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader title="Policies" subtitle="Governing policies evaluated on every agent action." />
      {q.loading ? (
        <SkeletonRows rows={6} cols={7} />
      ) : q.error ? (
        <InlineError error={q.error} onRetry={q.reload} />
      ) : (q.data ?? []).length === 0 ? (
        <EmptyState title="No policies defined." hint="Define policies to govern agent access decisions." />
      ) : (
        <DataTable
          columns={columns}
          rows={q.data!}
          rowKey={(p) => p.id}
          onRowClick={(p) => navigate(`/policies/${p.id}`)}
          initialSort={{ key: 'priority', dir: 'desc' }}
        />
      )}
    </div>
  );
}
