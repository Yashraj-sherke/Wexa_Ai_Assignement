// Central API client. Unwraps {success,data} / {success,error} envelopes
// and throws typed ApiError objects.
import {
  ApiError,
  ActionTrace,
  Agent,
  AgentDetail,
  AgentImpact,
  Coworker,
  CoworkerDetail,
  DataAsset,
  GraphData,
  Health,
  PagedActions,
  Permission,
  Policy,
  PolicyDetail,
  SimulationResult,
  SystemRecord,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
  } catch {
    throw new ApiError('NETWORK_ERROR', 'Cannot reach the ControlGraph API.', 0);
  }
  let body: { success?: boolean; data?: T; error?: { code: string; message: string } };
  try {
    body = await res.json();
  } catch {
    throw new ApiError('INVALID_RESPONSE', `Unexpected non-JSON response (${res.status}).`, res.status);
  }
  if (!res.ok || body.success === false || body.error) {
    const err = body.error ?? { code: 'UNKNOWN', message: `Request failed (${res.status}).` };
    throw new ApiError(err.code, err.message, res.status);
  }
  return body.data as T;
}

export const api = {
  baseUrl: BASE_URL,
  health: () => request<Health>('/api/health'),
  coworkers: () => request<Coworker[]>('/api/coworkers'),
  coworker: (id: string) => request<CoworkerDetail>(`/api/coworkers/${id}`),
  agents: () => request<Agent[]>('/api/agents'),
  agent: (id: string) => request<AgentDetail>(`/api/agents/${id}`),
  agentImpact: (id: string) => request<AgentImpact>(`/api/agents/${id}/impact`),
  systems: () => request<SystemRecord[]>('/api/systems'),
  dataAssets: () => request<DataAsset[]>('/api/data-assets'),
  policies: () => request<Policy[]>('/api/policies'),
  policy: (id: string) => request<PolicyDetail>(`/api/policies/${id}`),
  actions: (params?: { limit?: number; offset?: number; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.limit != null) q.set('limit', String(params.limit));
    if (params?.offset != null) q.set('offset', String(params.offset));
    if (params?.status) q.set('status', params.status);
    const qs = q.toString();
    return request<PagedActions>(`/api/actions${qs ? `?${qs}` : ''}`);
  },
  actionTrace: (id: string) => request<ActionTrace>(`/api/actions/${id}/trace`),
  simulate: (payload: { agentId: string; permissionId: string; mode: 'grant' | 'revoke' }) =>
    request<SimulationResult>('/api/simulator/access-impact', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  graph: (nodeType: string, nodeId: string, depth = 2) =>
    request<GraphData>(`/api/graph/${nodeType}/${nodeId}?depth=${depth}`),
  permissions: () => request<Permission[]>('/api/permissions'),
};
