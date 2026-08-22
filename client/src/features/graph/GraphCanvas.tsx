import { useEffect, useMemo, useRef, useState } from 'react';
import cytoscape, { Core, ElementDefinition, EventObject } from 'cytoscape';
import { Crosshair, Maximize2, RotateCw } from 'lucide-react';
import { GraphData, GraphNode } from '../../types';

// Muted node colors per type. Canvas is dark for readability; surrounding UI stays light.
export const NODE_COLORS: Record<string, string> = {
  Coworker: '#7d93a8',   // blue-gray
  Agent: '#64748b',      // slate
  Workflow: '#8d99ae',   // neutral
  Connector: '#c99a3c',  // muted amber
  System: '#5b7d99',     // steel
  DataAsset: '#b0574f',  // muted red (sensitive) — neutralized below when not sensitive
  Policy: '#6f9a7a',     // neutral green
  Permission: '#8a8f98',
  Action: '#7a7f87',     // gray
};
const DEFAULT_COLOR = '#8a8f98';

export function nodeColor(node: GraphNode): string {
  if (node.type === 'DataAsset') {
    const sens = String(node.properties?.sensitivity ?? '').toUpperCase();
    return sens === 'SENSITIVE' || sens === 'CONFIDENTIAL' ? NODE_COLORS.DataAsset : '#9aa0a8';
  }
  return NODE_COLORS[node.type] ?? DEFAULT_COLOR;
}

export interface GraphCanvasProps {
  data: GraphData;
  height?: number;
  dark?: boolean;
  /** Optional externally controlled selected node id. */
  selectedId?: string | null;
  onSelectNode?: (node: GraphNode | null) => void;
  /** Highlight the shortest path between two node ids. */
  pathEndpoints?: [string, string] | null;
  showLegend?: boolean;
  className?: string;
}

function toElements(data: GraphData): ElementDefinition[] {
  const nodes: ElementDefinition[] = data.nodes.map((n) => ({
    group: 'nodes' as const,
    data: { id: n.id, label: n.label, type: n.type, color: nodeColor(n), raw: n },
  }));
  const ids = new Set(data.nodes.map((n) => n.id));
  const edges: ElementDefinition[] = data.edges
    .filter((e) => ids.has(e.source) && ids.has(e.target))
    .map((e, i) => ({
      group: 'edges' as const,
      data: { id: `e${i}`, source: e.source, target: e.target, label: e.type },
    }));
  return [...nodes, ...edges];
}

export default function GraphCanvas({
  data,
  height = 380,
  dark = true,
  selectedId,
  onSelectNode,
  pathEndpoints,
  showLegend = true,
  className = '',
}: GraphCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [selected, setSelected] = useState<string | null>(selectedId ?? null);

  const elements = useMemo(() => toElements(data), [data]);

  useEffect(() => {
    if (!containerRef.current) return;
    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        { selector: 'node', style: {
          'background-color': 'data(color)',
          label: 'data(label)',
          color: dark ? '#c8cdd4' : '#3a3f45',
          'font-size': 8,
          'font-family': 'IBM Plex Mono, Consolas, monospace',
          'text-valign': 'bottom',
          'text-margin-y': 5,
          'text-wrap': 'ellipsis',
          'text-max-width': '90px',
          width: 16, height: 16,
          'border-width': 0,
        } },
        { selector: 'node[type = "Coworker"], node[type = "System"]', style: { width: 22, height: 22 } },
        { selector: 'edge', style: {
          width: 1,
          'line-color': dark ? '#3d434b' : '#c9c7c1',
          'target-arrow-shape': 'triangle',
          'arrow-scale': 0.6,
          'curve-style': 'bezier',
          label: 'data(label)',
          'font-size': 6,
          color: dark ? '#6d747d' : '#9a9892',
          'font-family': 'IBM Plex Mono, Consolas, monospace',
          'text-rotation': 'autorotate',
          'text-margin-y': -6,
        } },
        { selector: 'node:selected', style: {
          'border-width': 2.5,
          'border-color': '#e8eef4',
        } },
        { selector: '.highlighted', style: {
          'border-width': 2,
          'border-color': '#d9a441',
        } },
        { selector: '.on-path', style: {
          'border-width': 2.5,
          'border-color': '#4f9edb',
        } },
        { selector: 'edge.on-path', style: {
          width: 2.5,
          'line-color': '#4f9edb',
          'target-arrow-color': '#4f9edb',
        } },
      ],
      layout: {
        name: 'cose',
        animate: false,
        nodeRepulsion: () => 9000,
        idealEdgeLength: 70,
        padding: 30,
      },
      wheelSensitivity: 0.25,
    });
    cyRef.current = cy;

    cy.on('tap', 'node', (e: EventObject) => {
      const id = e.target.id();
      setSelected((prev) => (prev === id ? null : id));
      onSelectNode?.(e.target.data('raw') as GraphNode);
    });
    cy.on('tap', (e: EventObject) => {
      if (e.target === cy) {
        setSelected(null);
        onSelectNode?.(null);
      }
    });

    cy.fit(undefined, 30);
    return () => {
      cy.destroy();
      cyRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements]);

  // Selection + connected highlight
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.elements().removeClass('highlighted on-path');
    if (selected) {
      cy.getElementById(selected).neighborhood().addClass('highlighted');
    }
    if (pathEndpoints && cy.getElementById(pathEndpoints[0]).length && cy.getElementById(pathEndpoints[1]).length) {
      const path = cy.elements().aStar({
        root: `#${CSS.escape(pathEndpoints[0])}`,
        goal: `#${CSS.escape(pathEndpoints[1])}`,
      }).path;
      path?.addClass('on-path');
    }
  }, [selected, pathEndpoints, elements]);

  const fit = () => cyRef.current?.fit(undefined, 30);
  const reset = () => {
    setSelected(null);
    cyRef.current?.elements().removeStyle();
    cyRef.current?.layout({ name: 'cose', animate: false, padding: 30 }).run();
    fit();
  };

  const types = useMemo(() => Array.from(new Set(data.nodes.map((n) => n.type))), [data]);
  const selectedNode = useMemo(
    () => data.nodes.find((n) => n.id === selected) ?? null,
    [data, selected],
  );

  return (
    <div className={`overflow-hidden rounded-lg border border-line bg-panel ${className}`}>
      <div className="relative" style={{ height }}>
        <div
          ref={containerRef}
          className={`cy-canvas ${dark ? 'bg-graph' : 'bg-canvas'}`}
        />
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            title="Fit to view"
            onClick={fit}
            className="rounded border border-line bg-panel/90 p-1.5 text-muted hover:text-ink"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button
            title="Reset layout"
            onClick={reset}
            className="rounded border border-line bg-panel/90 p-1.5 text-muted hover:text-ink"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
        </div>
        {selectedNode && (
          <div className="absolute bottom-2 left-2 rounded border border-line bg-panel/95 px-2.5 py-1.5 font-mono text-[10.5px] text-ink shadow-sm">
            <span className="mr-2 inline-flex items-center gap-1 text-muted">
              <Crosshair className="h-3 w-3" />
            </span>
            {selectedNode.label}
            <span className="ml-2 text-muted">
              {selectedNode.type}
              {selectedNode.properties?.sensitivity ? ` · ${String(selectedNode.properties.sensitivity)}` : ''}
            </span>
          </div>
        )}
      </div>
      {showLegend && types.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line px-3 py-2">
          {types.map((t) => (
            <span key={t} className="flex items-center gap-1.5 font-mono text-[10px] text-muted">
              <span className="h-2 w-2 rounded-full" style={{ background: NODE_COLORS[t] ?? DEFAULT_COLOR }} />
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
