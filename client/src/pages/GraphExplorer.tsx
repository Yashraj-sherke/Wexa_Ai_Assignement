import { useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { useApi } from '../hooks/useApi';
import { GraphData, GraphNode } from '../types';
import PageHeader from '../components/PageHeader';
import { EmptyState, InlineError, Panel, SkeletonPanel } from '../components/States';
import GraphCanvas from '../features/graph/GraphCanvas';

const NODE_TYPES = [
  { value: 'Coworker', label: 'Coworker', list: 'coworkers' },
  { value: 'Agent', label: 'Agent', list: 'agents' },
  { value: 'System', label: 'System', list: 'systems' },
  { value: 'DataAsset', label: 'Data Asset', list: 'dataAssets' },
  { value: 'Policy', label: 'Policy', list: 'policies' },
] as const;

type Entity = { id: string; name?: string; label?: string };

export default function GraphExplorer() {
  const [nodeType, setNodeType] = useState<string>('Agent');
  const [nodeId, setNodeId] = useState('');
  const [depth, setDepth] = useState(2);
  const [nodeFilter, setNodeFilter] = useState<string>('ALL');
  const [edgeFilter, setEdgeFilter] = useState<string>('ALL');
  const [pathFrom, setPathFrom] = useState('');
  const [pathTo, setPathTo] = useState('');

  const typeDef = NODE_TYPES.find((t) => t.value === nodeType)!;
  const entitiesQ = useApi(
    () => (api as unknown as Record<string, () => Promise<Entity[]>>)[typeDef.list](),
    [nodeType],
  );
  const graphQ = useApi(
    () => (nodeId ? api.graph(nodeType, nodeId, depth) : Promise.resolve({ nodes: [], edges: [] } as GraphData)),
    [nodeType, nodeId, depth],
  );

  useEffect(() => {
    setNodeId('');
    setPathFrom('');
    setPathTo('');
  }, [nodeType]);

  useEffect(() => {
    if (!nodeId && entitiesQ.data && entitiesQ.data.length > 0) setNodeId(entitiesQ.data[0].id);
  }, [entitiesQ.data, nodeId]);

  const nodeTypes = useMemo(
    () => Array.from(new Set((graphQ.data?.nodes ?? []).map((n) => n.type))),
    [graphQ.data],
  );
  const edgeTypes = useMemo(
    () => Array.from(new Set((graphQ.data?.edges ?? []).map((e) => e.type))),
    [graphQ.data],
  );

  const filtered = useMemo<GraphData>(() => {
    const d = graphQ.data ?? { nodes: [], edges: [] };
    if (nodeFilter === 'ALL' && edgeFilter === 'ALL') return d;
    const nodes = d.nodes.filter((n) => nodeFilter === 'ALL' || n.type === nodeFilter);
    const ids = new Set(nodes.map((n) => n.id));
    const edges = d.edges.filter(
      (e) => (edgeFilter === 'ALL' || e.type === edgeFilter) && ids.has(e.source) && ids.has(e.target),
    );
    return { nodes, edges };
  }, [graphQ.data, nodeFilter, edgeFilter]);

  const graphNodes = graphQ.data?.nodes ?? [];

  function nodeOptionLabel(n: GraphNode) {
    return `${n.type} · ${n.label}`;
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader title="Graph Explorer" subtitle="Traverse the full access graph from any node." />

      <Panel className="mb-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-[10.5px] font-semibold tracking-[0.08em] text-muted uppercase">Node Type</span>
            <select
              value={nodeType}
              onChange={(e) => setNodeType(e.target.value)}
              className="w-full rounded-md border border-line bg-canvas px-2.5 py-1.5 text-[12.5px] text-ink outline-none focus:border-accent"
            >
              {NODE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[10.5px] font-semibold tracking-[0.08em] text-muted uppercase">Start Node</span>
            <select
              value={nodeId}
              onChange={(e) => setNodeId(e.target.value)}
              className="w-full rounded-md border border-line bg-canvas px-2.5 py-1.5 text-[12.5px] text-ink outline-none focus:border-accent"
            >
              {entitiesQ.loading ? (
                <option value="">Loading…</option>
              ) : (
                (entitiesQ.data ?? []).map((e) => (
                  <option key={e.id} value={e.id}>{e.name ?? e.label ?? e.id}</option>
                ))
              )}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[10.5px] font-semibold tracking-[0.08em] text-muted uppercase">
              Depth <span className="font-mono text-ink">{depth}</span>
            </span>
            <input
              type="range"
              min={1}
              max={4}
              step={1}
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              className="mt-2 w-full accent-[#1f5f8b]"
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1 block text-[10.5px] font-semibold tracking-[0.08em] text-muted uppercase">Filter Nodes</span>
              <select
                value={nodeFilter}
                onChange={(e) => setNodeFilter(e.target.value)}
                className="w-full rounded-md border border-line bg-canvas px-2 py-1.5 text-[11.5px] text-ink outline-none focus:border-accent"
              >
                <option value="ALL">All types</option>
                {nodeTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-[10.5px] font-semibold tracking-[0.08em] text-muted uppercase">Filter Edges</span>
              <select
                value={edgeFilter}
                onChange={(e) => setEdgeFilter(e.target.value)}
                className="w-full rounded-md border border-line bg-canvas px-2 py-1.5 text-[11.5px] text-ink outline-none focus:border-accent"
              >
                <option value="ALL">All relations</option>
                {edgeTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-1 items-end gap-3 border-t border-line pt-3 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[10.5px] font-semibold tracking-[0.08em] text-muted uppercase">Path From</span>
            <select
              value={pathFrom}
              onChange={(e) => setPathFrom(e.target.value)}
              className="w-full rounded-md border border-line bg-canvas px-2.5 py-1.5 text-[12px] text-ink outline-none focus:border-accent"
            >
              <option value="">—</option>
              {graphNodes.map((n) => (
                <option key={n.id} value={n.id}>{nodeOptionLabel(n)}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[10.5px] font-semibold tracking-[0.08em] text-muted uppercase">Path To</span>
            <select
              value={pathTo}
              onChange={(e) => setPathTo(e.target.value)}
              className="w-full rounded-md border border-line bg-canvas px-2.5 py-1.5 text-[12px] text-ink outline-none focus:border-accent"
            >
              <option value="">—</option>
              {graphNodes.map((n) => (
                <option key={n.id} value={n.id}>{nodeOptionLabel(n)}</option>
              ))}
            </select>
          </label>
        </div>
      </Panel>

      {entitiesQ.error ? (
        <InlineError error={entitiesQ.error} onRetry={entitiesQ.reload} />
      ) : graphQ.loading ? (
        <SkeletonPanel className="h-[560px]" />
      ) : graphQ.error ? (
        <InlineError error={graphQ.error} onRetry={graphQ.reload} />
      ) : !nodeId ? (
        <EmptyState title="Select a start node." hint="Choose a node type and entity to explore its neighborhood." />
      ) : (filtered.nodes ?? []).length === 0 ? (
        <EmptyState
          title={nodeFilter !== 'ALL' || edgeFilter !== 'ALL' ? 'No nodes match the current filters.' : 'No graph data for this node.'}
          hint="Adjust the filters or select a different start node."
        />
      ) : (
        <GraphCanvas
          data={filtered}
          height={560}
          pathEndpoints={pathFrom && pathTo ? [pathFrom, pathTo] : null}
        />
      )}

      {graphQ.data && (
        <p className="mt-2 font-mono text-[10.5px] text-muted">
          {filtered.nodes.length} nodes · {filtered.edges.length} edges (of {graphQ.data.nodes.length} / {graphQ.data.edges.length} fetched)
        </p>
      )}
    </div>
  );
}
