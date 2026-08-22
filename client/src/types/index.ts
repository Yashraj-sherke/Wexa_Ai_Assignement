// Types mirroring the ControlGraph API contract.

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type CoworkerStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type Environment = 'PRODUCTION' | 'STAGING' | 'DEVELOPMENT';

export interface Health {
  status: string;
  database: 'CONNECTED' | 'DISCONNECTED' | string;
}

export interface Coworker {
  id: string;
  name: string;
  owner: string;
  status: CoworkerStatus | string;
  workflows: number;
  agents: number;
  systems: number;
  riskScore: number;
  riskLevel: RiskLevel | string;
  description: string;
  environment: Environment | string;
}

export interface CoworkerDetail extends Coworker {
  accessibleResources: ResourceRef[];
  policies: PolicyRef[];
  recentActions: ActionRecord[];
}

export interface ResourceRef {
  id: string;
  type: string;
  label: string;
  sensitivity?: string;
}

export interface PolicyRef {
  id: string;
  name: string;
  effect?: string;
}

export interface ActionRecord {
  id: string;
  type: string;
  timestamp: string;
  status: 'ALLOWED' | 'BLOCKED' | 'ALLOWED_WITH_APPROVAL' | string;
  reason?: string;
  agent?: string;
  system?: string;
}

export interface Agent {
  id: string;
  name: string;
  purpose: string;
  status: string;
  riskLevel: RiskLevel | string;
  coworker: string;
  systems: number | string[];
}

export interface AgentDetail extends Agent {
  impact?: AgentImpact;
  [key: string]: unknown;
}

export interface RiskFactor {
  label: string;
  points: number;
}

export interface AgentImpact {
  directResources: ResourceRef[];
  indirectResources: ResourceRef[];
  sensitiveDataAssets: ResourceRef[];
  systems: ResourceRef[];
  connectors: ResourceRef[];
  workflowsAffected: ResourceRef[];
  policies: PolicyRef[];
  risk: {
    score: number;
    level: RiskLevel | string;
    factors: RiskFactor[];
  };
}

export interface SystemRecord {
  id: string;
  name: string;
  type?: string;
  status?: string;
  criticality?: string;
  description?: string;
  [key: string]: unknown;
}

export interface DataAsset {
  id: string;
  name: string;
  system?: string;
  sensitivity: 'SENSITIVE' | 'CONFIDENTIAL' | 'INTERNAL' | 'PUBLIC' | string;
  type?: string;
  description?: string;
  [key: string]: unknown;
}

export interface Policy {
  id: string;
  name: string;
  effect: 'ALLOW' | 'DENY' | string;
  scope: string;
  priority: number;
  status: string;
  agents: number | string[];
  resources: number | string[];
  description?: string;
  [key: string]: unknown;
}

export interface PolicyDetail extends Policy {
  permissions?: PermissionRef[];
  approvalGates?: { label: string; [key: string]: unknown }[];
  recentDecisions?: ActionRecord[];
}

export interface PermissionRef {
  id: string;
  action: string;
  scope?: string;
}

export interface Permission {
  id: string;
  action: string;
  scope: string;
  effect: string;
}

export interface PagedActions {
  actions: ActionRecord[];
  total: number;
  limit: number;
  offset: number;
}

export interface TraceCheck {
  label: string;
  passed: boolean;
  reason: string;
}

export interface ActionTrace {
  action: ActionRecord;
  path: ResourceRef[];
  checks: TraceCheck[];
  policy: PolicyRef | null;
}

export interface ImpactSnapshot {
  resources: number;
  sensitiveAssets: number;
  systems: number;
  riskScore: number;
  riskLevel: RiskLevel | string;
}

export interface SimulationResult {
  before: ImpactSnapshot;
  after: ImpactSnapshot;
  delta: {
    resources: number;
    sensitiveAssets: number;
    systems: number;
  };
  newlyReachable: (ResourceRef & { sensitivity?: string })[];
  newPaths: { nodes: ResourceRef[]; edges: GraphEdge[] }[];
}

export type NodeType =
  | 'Coworker' | 'Agent' | 'Workflow' | 'Connector' | 'System'
  | 'DataAsset' | 'Policy' | 'Permission' | 'Action' | string;

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  properties?: Record<string, unknown>;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ApiErrorPayload {
  code: string;
  message: string;
}

export class ApiError extends Error {
  code: string;
  status?: number;
  constructor(code: string, message: string, status?: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}
