import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { health } from "../controllers/healthController.js";
import { listCoworkers, getCoworker } from "../controllers/coworkerController.js";
import { listAgents, getAgent, getAgentImpact } from "../controllers/agentController.js";
import {
  listSystems, listDataAssets, listResources, listPolicies, getPolicy, listPermissions,
  listActions, getActionTrace, getGraph, getMetaNodeTypes,
} from "../controllers/catalogController.js";
import { simulateAccessImpact } from "../controllers/simulatorController.js";

export const apiRouter = Router();

apiRouter.get("/health", asyncHandler(health));

apiRouter.get("/coworkers", asyncHandler(listCoworkers));
apiRouter.get("/coworkers/:id", asyncHandler(getCoworker));

apiRouter.get("/agents", asyncHandler(listAgents));
apiRouter.get("/agents/:id", asyncHandler(getAgent));
apiRouter.get("/agents/:id/impact", asyncHandler(getAgentImpact));

apiRouter.get("/systems", asyncHandler(listSystems));
apiRouter.get("/data-assets", asyncHandler(listDataAssets));
apiRouter.get("/resources", asyncHandler(listResources));
apiRouter.get("/policies", asyncHandler(listPolicies));
apiRouter.get("/policies/:id", asyncHandler(getPolicy));
apiRouter.get("/permissions", asyncHandler(listPermissions));

apiRouter.get("/actions", asyncHandler(listActions));
apiRouter.get("/actions/:id/trace", asyncHandler(getActionTrace));

apiRouter.post("/simulator/access-impact", asyncHandler(simulateAccessImpact));

apiRouter.get("/graph/:nodeType/:nodeId", asyncHandler(getGraph));
apiRouter.get("/meta/node-types", asyncHandler(getMetaNodeTypes));
