import { describe, it, expect, vi } from "vitest";
import { assessRisk, computeDelta, clampScore, levelForScore } from "../src/services/riskService.js";
import { buildReachSet, unionGrant, subtractRevoke, snapshot, simulatorService } from "../src/services/simulatorService.js";
import { agentRepository } from "../src/repositories/agentRepository.js";
import { simulatorRepository } from "../src/repositories/simulatorRepository.js";

describe("risk model", () => {
  it("returns LOW with no factors", () => {
    const r = assessRisk({
      sensitiveDataReachable: 0, hasDestructiveAction: false, hasExternalConnector: false,
      hasNoApprovalGate: false, hasSharedConnector: false, hasBroadScope: false,
    });
    expect(r.score).toBe(0);
    expect(r.level).toBe("LOW");
    expect(r.factors).toHaveLength(0);
  });

  it("accumulates transparent factors and clamps at 100", () => {
    const r = assessRisk({
      sensitiveDataReachable: 3, hasDestructiveAction: true, hasExternalConnector: true,
      hasNoApprovalGate: true, hasSharedConnector: true, hasBroadScope: true,
    });
    expect(r.score).toBe(100);
    expect(r.level).toBe("CRITICAL");
    expect(r.factors.map((f) => f.points).reduce((a, b) => a + b, 0)).toBe(100);
    expect(r.factors.map((f) => f.label)).toContain("Sensitive data reachable");
  });

  it("maps score bands to levels", () => {
    expect(levelForScore(0)).toBe("LOW");
    expect(levelForScore(29)).toBe("LOW");
    expect(levelForScore(30)).toBe("MEDIUM");
    expect(levelForScore(60)).toBe("HIGH");
    expect(levelForScore(80)).toBe("CRITICAL");
    expect(clampScore(150)).toBe(100);
    expect(clampScore(-5)).toBe(0);
  });
});

describe("simulator pure logic", () => {
  const before = buildReachSet(
    [{ id: "r1" }],
    [{ id: "a1", sensitivity: "CRITICAL" }, { id: "a2", sensitivity: "LOW" }],
    [{ id: "s1" }]
  );

  it("unionGrant adds only granted items without mutating input", () => {
    const after = unionGrant(before, {
      resourceIds: ["r1", "r2"],
      sensitiveAssetIds: ["a3"],
      systemIds: ["s2"],
    });
    expect(after.resourceIds.size).toBe(2);
    expect(after.sensitiveAssetIds.size).toBe(2); // only HIGH/CRITICAL counted at build; a3 counted as given
    expect(before.resourceIds.size).toBe(1); // unchanged
  });

  it("subtractRevoke removes revoked items", () => {
    const after = subtractRevoke(before, { resourceIds: ["r1"], sensitiveAssetIds: ["a1"], systemIds: [] });
    expect(after.resourceIds.size).toBe(0);
    expect(after.sensitiveAssetIds.size).toBe(0);
  });

  it("delta computation is signed", () => {
    expect(computeDelta({ resources: 2, sensitiveAssets: 1, systems: 1 }, { resources: 4, sensitiveAssets: 1, systems: 3 }))
      .toEqual({ resources: 2, sensitiveAssets: 0, systems: 2 });
  });

  it("snapshot applies the risk model to a reach set", () => {
    const snap = snapshot(before, { destructive: true, external: false, noGate: false, shared: false, broad: false });
    expect(snap.resources).toBe(1);
    expect(snap.sensitiveAssets).toBe(1);
    expect(snap.riskScore).toBe(50); // 30 sensitive + 20 destructive
    expect(snap.riskLevel).toBe("MEDIUM");
  });
});

describe("simulatorService with mocked repositories", () => {
  it("computes grant before/after without touching the graph", async () => {
    vi.spyOn(agentRepository, "detail").mockResolvedValue({
      agent: { id: "ag_x", name: "X" }, coworkers: [], workflows: [], skills: [],
      knowledgeBases: [], directResources: [],
    } as never);
    vi.spyOn(agentRepository, "reachableResources").mockResolvedValue([
      { resource: { id: "r1", name: "R1" }, pathIds: ["ag_x", "r1"], pathLabels: ["Agent", "Resource"], pathNames: ["X", "R1"], pathRels: ["CAN_ACCESS"] },
    ]);
    vi.spyOn(agentRepository, "reachableDataAssets").mockResolvedValue([
      { resource: undefined, asset: { id: "a1", sensitivity: "CRITICAL" }, pathIds: [], pathLabels: [], pathNames: [], pathRels: [] } as never,
    ]);
    vi.spyOn(agentRepository, "reachableSystems").mockResolvedValue([{ id: "s1" }]);
    vi.spyOn(agentRepository, "approvalGates").mockResolvedValue([]);
    vi.spyOn(agentRepository, "destructiveActions").mockResolvedValue([]);
    vi.spyOn(agentRepository, "sharedConnectorAgents").mockResolvedValue([]);
    vi.spyOn(agentRepository, "externalConnectors").mockResolvedValue([]);

    vi.spyOn(simulatorRepository, "permission").mockResolvedValue({ id: "perm_read_hr", action: "READ", scope: "resource:res_hr_records", effect: "ALLOW" });
    vi.spyOn(simulatorRepository, "permissionScopeResources").mockResolvedValue([{ id: "res_hr_records", name: "HR Records" }] as never);
    vi.spyOn(simulatorRepository, "dataAssetsByResource").mockResolvedValue([
      { resourceId: "res_hr_records", asset: { id: "da_hr", sensitivity: "HIGH" } },
    ]);
    vi.spyOn(simulatorRepository, "systemsByResource").mockResolvedValue([
      { resourceId: "res_hr_records", system: { id: "sys_internal_crm" } },
    ]);
    vi.spyOn(simulatorRepository, "hypotheticalPaths").mockResolvedValue([]);

    const result = await simulatorService.simulate({ agentId: "ag_x", permissionId: "perm_read_hr", mode: "grant" });

    expect(result.before.resources).toBe(1);
    expect(result.after.resources).toBe(2);
    expect(result.delta.resources).toBe(1);
    expect(result.delta.sensitiveAssets).toBe(1);
    expect(result.delta.systems).toBe(1);
    expect(result.after.riskScore).toBeGreaterThanOrEqual(result.before.riskScore);
    expect(result.newlyReachable.some((n) => n.id === "res_hr_records")).toBe(true);
    vi.restoreAllMocks();
  });
});
