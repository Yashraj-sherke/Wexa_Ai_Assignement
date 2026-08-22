import type { RiskAssessment, RiskFactor, RiskLevel } from "../types/index.js";

export interface RiskFacts {
  /** number of HIGH/CRITICAL data assets reachable */
  sensitiveDataReachable: number;
  /** agent can perform an action whose type contains WRITE or DELETE */
  hasDestructiveAction: boolean;
  /** agent reaches a connector typed external */
  hasExternalConnector: boolean;
  /** no ApprovalGate on any governing policy */
  hasNoApprovalGate: boolean;
  /** agent shares a connector with at least one other agent */
  hasSharedConnector: boolean;
  /** permission/resource scope is broad (wildcard) */
  hasBroadScope: boolean;
}

export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, score));
}

export function levelForScore(score: number): RiskLevel {
  if (score >= 80) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 30) return "MEDIUM";
  return "LOW";
}

/** Transparent additive risk model. Always returns factors explaining the score. */
export function assessRisk(facts: RiskFacts): RiskAssessment {
  const factors: RiskFactor[] = [];
  let score = 0;
  if (facts.sensitiveDataReachable > 0) {
    factors.push({ label: "Sensitive data reachable", points: 30 });
    score += 30;
  }
  if (facts.hasDestructiveAction) {
    factors.push({ label: "Destructive permission (WRITE/DELETE)", points: 20 });
    score += 20;
  }
  if (facts.hasExternalConnector) {
    factors.push({ label: "External connector", points: 15 });
    score += 15;
  }
  if (facts.hasNoApprovalGate) {
    factors.push({ label: "No approval gate", points: 15 });
    score += 15;
  }
  if (facts.hasSharedConnector) {
    factors.push({ label: "Shared connector", points: 10 });
    score += 10;
  }
  if (facts.hasBroadScope) {
    factors.push({ label: "Broad resource scope", points: 10 });
    score += 10;
  }
  const finalScore = clampScore(score);
  return { score: finalScore, level: levelForScore(finalScore), factors };
}

/** Pure delta computation for the simulator. */
export function computeDelta(
  before: { resources: number; sensitiveAssets: number; systems: number },
  after: { resources: number; sensitiveAssets: number; systems: number }
): { resources: number; sensitiveAssets: number; systems: number } {
  return {
    resources: after.resources - before.resources,
    sensitiveAssets: after.sensitiveAssets - before.sensitiveAssets,
    systems: after.systems - before.systems,
  };
}
