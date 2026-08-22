export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface RiskFactor {
  label: string;
  points: number;
}

export interface RiskAssessment {
  score: number;
  level: RiskLevel;
  factors: RiskFactor[];
}

export interface GraphNode {
  id: string;
  type: string;
  label: string;
  properties: Record<string, unknown>;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
}

export interface Subgraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ReachabilitySnapshot {
  resources: number;
  sensitiveAssets: number;
  systems: number;
  riskScore: number;
  riskLevel: RiskLevel;
}

export interface SimulatorPath {
  nodes: { id: string; type: string; name: string }[];
  edges: { source: string; target: string; type: string }[];
}

export interface SimulatorResult {
  before: ReachabilitySnapshot;
  after: ReachabilitySnapshot;
  delta: { resources: number; sensitiveAssets: number; systems: number };
  newlyReachable: { id: string; type: string; name: string }[];
  newPaths: SimulatorPath[];
}

export interface CoworkerSummary {
  id: string;
  name: string;
  description: string;
  status: string;
  owner: string;
  environment: string;
  workflows: number;
  agents: number;
  systems: number;
  riskScore: number;
  riskLevel: RiskLevel;
}

export interface AgentSummary {
  id: string;
  name: string;
  purpose: string;
  status: string;
  riskLevel: string;
  coworker: string | null;
  systems: number;
}

export interface AgentImpact {
  directResources: { id: string; name: string; type: string; sensitivity: string }[];
  indirectResources: { id: string; name: string; type: string; sensitivity: string }[];
  sensitiveDataAssets: { id: string; name: string; classification: string; sensitivity: string }[];
  systems: { id: string; name: string; type: string }[];
  connectors: { id: string; name: string; provider: string }[];
  workflowsAffected: { id: string; name: string }[];
  policies: { id: string; name: string; effect: string }[];
  risk: RiskAssessment;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
