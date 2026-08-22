import { ReactNode } from 'react';
import { ResourceRef } from '../types';
import { SensitivityBadge } from './Badges';

/** Dense list of graph resource references (id / type / label / sensitivity). */
export default function ResourceList({
  items,
  empty = 'None found.',
  onSelect,
}: {
  items: ResourceRef[];
  empty?: string;
  onSelect?: (r: ResourceRef) => void;
}) {
  if (items.length === 0) {
    return <p className="py-2 text-[12px] text-muted">{empty}</p>;
  }
  return (
    <ul className="divide-y divide-line/70">
      {items.map((r, i) => (
        <li key={`${r.id}-${i}`}>
          <button
            onClick={onSelect ? () => onSelect(r) : undefined}
            className={`flex w-full items-center gap-2 py-1.5 text-left ${onSelect ? 'hover:bg-canvas/60' : 'cursor-default'}`}
          >
            <span className="w-20 shrink-0 font-mono text-[9.5px] tracking-wide text-muted uppercase">{r.type}</span>
            <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink">{r.label}</span>
            {r.sensitivity && <SensitivityBadge sensitivity={r.sensitivity} />}
          </button>
        </li>
      ))}
    </ul>
  );
}

export function KV({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1">
      <span className="text-[10.5px] font-semibold tracking-[0.06em] text-muted uppercase">{label}</span>
      <span className="min-w-0 truncate text-right text-[12.5px] text-ink">{children}</span>
    </div>
  );
}
