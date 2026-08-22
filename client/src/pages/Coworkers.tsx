import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';
import { Coworker } from '../types';
import DataTable, { Column } from '../components/DataTable';
import { RiskBadge, StatusBadge } from '../components/Badges';
import { EmptyState, InlineError, SkeletonRows } from '../components/States';
import PageHeader from '../components/PageHeader';
import { numericValue } from '../utils/format';

export default function Coworkers() {
  const navigate = useNavigate();
  const q = useApi(() => api.coworkers(), []);

  const columns: Column<Coworker>[] = [
    {
      key: 'name', header: 'Coworker',
      render: (c) => (
        <div className="min-w-0">
          <div className="font-medium text-ink">{c.name}</div>
          <div className="font-mono text-[10.5px] text-muted">{c.id}</div>
        </div>
      ),
      sortValue: (c) => c.name,
      className: 'min-w-[200px]',
    },
    { key: 'owner', header: 'Owner', render: (c) => <span className="font-mono text-[11.5px]">{c.owner}</span>, sortValue: (c) => c.owner },
    { key: 'workflows', header: 'Workflows', render: (c) => <span className="font-mono">{numericValue(c.workflows)}</span>, sortValue: (c) => numericValue(c.workflows) },
    { key: 'agents', header: 'Agents', render: (c) => <span className="font-mono">{numericValue(c.agents)}</span>, sortValue: (c) => numericValue(c.agents) },
    { key: 'systems', header: 'Connected Systems', render: (c) => <span className="font-mono">{numericValue(c.systems)}</span>, sortValue: (c) => numericValue(c.systems) },
    {
      key: 'risk', header: 'Risk',
      render: (c) => <RiskBadge level={String(c.riskLevel)} score={c.riskScore} />,
      sortValue: (c) => numericValue(c.riskScore),
    },
    { key: 'status', header: 'Status', render: (c) => <StatusBadge status={String(c.status)} />, sortValue: (c) => String(c.status) },
  ];

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader title="Coworkers" subtitle="AI coworkers registered in the access graph." />
      {q.loading ? (
        <SkeletonRows rows={6} cols={7} />
      ) : q.error ? (
        <InlineError error={q.error} onRetry={q.reload} />
      ) : (q.data ?? []).length === 0 ? (
        <EmptyState title="No coworkers registered." hint="Coworkers appear once onboarded into ControlGraph." />
      ) : (
        <DataTable
          columns={columns}
          rows={q.data!}
          rowKey={(c) => c.id}
          onRowClick={(c) => navigate(`/coworkers/${c.id}`)}
          initialSort={{ key: 'risk', dir: 'desc' }}
        />
      )}
    </div>
  );
}
