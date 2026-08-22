import { numericValue, statusColor, riskColor } from '../utils/format';

const tones: Record<string, string> = {
  ok: 'bg-ok-soft text-ok border-ok/30',
  warn: 'bg-warn-soft text-warn border-warn/30',
  bad: 'bg-bad-soft text-bad border-bad/30',
  muted: 'bg-canvas text-muted border-line',
};

export function StatusBadge({ status }: { status: string }) {
  const tone = tones[statusColor(status)];
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-px font-mono text-[10px] font-medium tracking-wide uppercase ${tone}`}>
      {status?.replace(/_/g, ' ') || '—'}
    </span>
  );
}

export function RiskBadge({ level, score }: { level: string; score?: unknown }) {
  const tone = tones[riskColor(level ?? '')];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded border px-1.5 py-px font-mono text-[10px] font-medium tracking-wide uppercase ${tone}`}>
      {score != null && <span>{numericValue(score)}</span>}
      {level ?? '—'}
    </span>
  );
}

export function SensitivityBadge({ sensitivity }: { sensitivity: string }) {
  const s = sensitivity?.toUpperCase() ?? '';
  const tone = s === 'SENSITIVE' || s === 'CONFIDENTIAL' ? tones.bad : s === 'INTERNAL' ? tones.warn : tones.muted;
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-px font-mono text-[10px] font-medium tracking-wide uppercase ${tone}`}>
      {sensitivity || '—'}
    </span>
  );
}
