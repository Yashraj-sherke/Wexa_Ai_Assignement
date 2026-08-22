export function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return iso;
  const diff = Date.now() - t;
  const m = Math.round(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

/** Render either the current string API shape or a legacy `{name}` reference safely. */
export function entityName(value: unknown, fallback = '—'): string {
  if (typeof value === 'string' && value.trim()) return value;
  if (value && typeof value === 'object' && 'name' in value) {
    const name = (value as { name?: unknown }).name;
    if (typeof name === 'string' && name.trim()) return name;
  }
  return fallback;
}

/** Convert numbers and serialized Neo4j integers (`{low, high}`) to JS numbers. */
export function numericValue(value: unknown, fallback = 0): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  if (value && typeof value === 'object') {
    const integer = value as { low?: unknown; high?: unknown; toNumber?: unknown };
    if (typeof integer.toNumber === 'function') {
      const parsed = (integer.toNumber as () => number)();
      return Number.isFinite(parsed) ? parsed : fallback;
    }
    if (typeof integer.low === 'number' && typeof integer.high === 'number') {
      const parsed = integer.high * 0x100000000 + (integer.low >>> 0);
      return Number.isFinite(parsed) ? parsed : fallback;
    }
  }
  return fallback;
}

export function riskColor(level: string): string {
  switch (level?.toUpperCase()) {
    case 'CRITICAL':
    case 'HIGH':
      return 'bad';
    case 'MEDIUM':
      return 'warn';
    default:
      return 'ok';
  }
}

export function statusColor(status: string): 'ok' | 'warn' | 'bad' | 'muted' {
  switch (status?.toUpperCase()) {
    case 'ALLOWED':
    case 'ACTIVE':
    case 'HEALTHY':
    case 'CONNECTED':
    case 'ENABLED':
      return 'ok';
    case 'ALLOWED_WITH_APPROVAL':
    case 'WARNING':
    case 'PENDING':
    case 'DEGRADED':
      return 'warn';
    case 'BLOCKED':
    case 'ERROR':
    case 'SUSPENDED':
    case 'DISCONNECTED':
      return 'bad';
    default:
      return 'muted';
  }
}

export function riskBarColor(level: string): string {
  switch (level?.toUpperCase()) {
    case 'CRITICAL':
      return '#7c2d26';
    case 'HIGH':
      return '#a83a32';
    case 'MEDIUM':
      return '#a3670a';
    default:
      return '#2e7d4f';
  }
}
