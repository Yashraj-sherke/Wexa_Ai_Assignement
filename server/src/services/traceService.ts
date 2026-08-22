import { actionRepository } from "../repositories/actionRepository.js";
import { agentRepository } from "../repositories/agentRepository.js";
import { NotFoundError } from "../types/index.js";

export const traceService = {
  /** Decision trace for an action: graph path evidence (read-only). */
  async getActionTrace(actionId: string) {
    const trace = await actionRepository.trace(actionId);
    if (!trace || !trace.action) throw new NotFoundError(`Action '${actionId}' not found`);

    const agentEdges = (trace.edges as { source: string; target: string; type: string }[]).filter((e) => e.type === "EXECUTED_BY");
    const agentId = agentEdges.length > 0 ? agentEdges[0].target : null;

    const [conflicts, sharedConnectors] = agentId
      ? await Promise.all([agentRepository.policyConflicts(agentId), agentRepository.sharedConnectorAgents(agentId)])
      : [[], []];

    return {
      action: trace.action,
      path: { nodes: trace.nodes ?? [], edges: trace.edges ?? [] },
      policyConflicts: conflicts ?? [],
      blastRadius: sharedConnectors ?? [],
    };
  },
};
