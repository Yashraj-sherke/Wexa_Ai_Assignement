import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';
import { Agent } from '../types';
import DataTable, { Column } from '../components/DataTable';
import { RiskBadge, StatusBadge } from '../components/Badges';
import { EmptyState, InlineError, SkeletonRows } from '../components/States';
import PageHeader from '../components/PageHeader';

export default function Agents() {
  const navigate = useNavigate();
  const q = useApi(() => api.agents(), []);

  const columns: Column<Agent>[] = [
    {
      key: 'name', header: 'Agent',
      render: (a) => (
        <div className="min-w-0">
          <div className="font-medium text-ink">{a.name}</div>
          <div className="max-w-md truncate text-[11px] text-muted">{a.purpose}</div>
        </div>
      ),
      sortValue: (a) => a.name,
      className: 'min-w-[220px]',
    },
    { key: 'coworker', header: 'Coworker', render: (a) => <span className="text-[12px]">{a.coworker}</span>, sortValue: (a) => a.coworker },
    {
      key: 'systems', header: 'Systems',
      render: (a) => <span className="font-mono">{Array.isArray(a.systems) ? a.systems.length : a.systems}</span>,
      sortValue: (a) => (Array.isArray(a.systems) ? a.systems.length : Number(a.systems) || 0),
    },
    { key: 'risk', header: 'Risk', render: (a) => <RiskBadge level={String(a.riskLevel)} />, sortValue: (a) => String(a.riskLevel) },
    { key: 'status', header: 'Status', render: (a) => <StatusBadge status={String(a.status)} />, sortValue: (a) => String(a.status) },
  ];

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader title="Agents" subtitle="Autonomous agents and the access they hold." />
      {q.loading ? (
        <SkeletonRows rows={6} cols={5} />
      ) : q.error ? (
        <InlineError error={q.error} onRetry={q.reload} />
      ) : (q.data ?? []).length === 0 ? (
        <EmptyState title="No agents registered." hint="Agents appear once deployed within a coworker." />
      ) : (
        <DataTable
          columns={columns}
          rows={q.data!}
          rowKey={(a) => a.id}
          onRowClick={(a) => navigate(`/agents/${a.id}`)}
          initialSort={{ key: 'risk', dir: 'desc' }}
        />
      )}
    </div>
  );
}
