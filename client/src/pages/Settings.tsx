import { api } from '../services/api';
import PageHeader from '../components/PageHeader';
import { Panel } from '../components/States';
import { KV } from '../components/ResourceList';
import { useDbHealth } from '../layouts/AppLayout';
import { formatTimestamp } from '../utils/format';
import { ExternalLink, RefreshCw } from 'lucide-react';

export default function Settings() {
  const { db, refresh } = useDbHealth();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Settings" subtitle="Connection and environment information." />
      <div className="space-y-4">
        <Panel title="API Connection">
          <KV label="API Base URL">
            <span className="font-mono text-[11px]">{api.baseUrl}</span>
          </KV>
          <KV label="Configured via">
            <span className="font-mono text-[11px]">VITE_API_URL</span>
          </KV>
          <KV label="Database State">
            <span className={db.connected ? 'text-ok' : 'text-bad'}>
              {db.connected ? 'CognoDB Connected' : 'Disconnected'}
            </span>
          </KV>
          <KV label="Last Health Check">
            <span className="font-mono text-[11px]">{db.lastChecked ? formatTimestamp(db.lastChecked) : '—'}</span>
          </KV>
          <div className="mt-3 flex gap-2">
            <button
              onClick={refresh}
              className="inline-flex items-center gap-1.5 rounded-md border border-line bg-canvas px-2.5 py-1 text-[11.5px] font-medium text-ink hover:border-accent/50"
            >
              <RefreshCw className="h-3 w-3" /> Re-check connection
            </button>
            <a
              href={`${api.baseUrl}/api/health`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-line bg-canvas px-2.5 py-1 text-[11.5px] font-medium text-ink hover:border-accent/50"
            >
              <ExternalLink className="h-3 w-3" /> Open /api/health
            </a>
          </div>
        </Panel>

        <Panel title="Environment">
          <KV label="Environment">PRODUCTION</KV>
          <KV label="Frontend">React + Vite (client)</KV>
          <KV label="Graph Engine">CognoDB</KV>
        </Panel>
      </div>
    </div>
  );
}
