# ControlGraph

**Understand what your AI can reach before it acts.**

ControlGraph is a graph-powered governance and impact-analysis platform for AI Coworkers and agents. It models the operational relationships between Coworkers, workflows, agents, skills, connectors, systems, resources, data assets, permissions, policies and actions in a property graph, then uses graph traversal to answer questions about access, impact, authorization and policy changes.

## Overview

Organizations deploy AI Coworkers that combine workflows, agents, skills and connectors to act on enterprise systems. The real security question is not "what does this agent directly use?" but **"what can this agent reach, through any chain of workflows, skills, shared connectors and systems?"** — and **"what changes if I grant or revoke one permission?"**

ControlGraph answers those questions with multi-hop graph traversal over CognoDB (openCypher over Bolt, accessed with the official Neo4j JavaScript driver).

## Problem

- Access reviews list direct grants, not transitive reachability.
- A connector shared between agents creates blast radii no single-system view shows.
- "Why was this action allowed?" is answerable only by tracing the exact authorization chain: Action → Agent → Policy → Permission → Connector → System → Resource.
- Policy changes are risky because nobody can preview the impact before applying them.

## Why a Graph Database?

A relational model could store all of these entities, but questions involving arbitrary multi-hop relationships across Coworkers, Workflows, Agents, Skills, Connectors, Systems, Resources and DataAssets require increasingly complex joins and recursive CTEs. Consider:

> "Find every sensitive DataAsset reachable from a Coworker through an arbitrary combination of workflows, agents, skills, connectors, systems and resources."

In SQL this is a recursive CTE over a half-dozen join tables with path-type dispatch per hop. In openCypher it is a single pattern:

```cypher
MATCH path =
  (c:Coworker {id: $coworkerId})
  -[:CONTAINS|HAS_STEP|USES|CONNECTS_TO|PROVIDES|CAN_ACCESS|CONTAINS*1..8]->
  (d:DataAsset)
WHERE d.sensitivity IN ['HIGH', 'CRITICAL']
RETURN path
```

ControlGraph naturally models the traversal. The graph also makes the *permission simulator* possible: hypothetical access is computed as a graph difference, not a mutation.

## Product Walkthrough

Hero workflow (under 60 seconds):

1. Open a Coworker → see its graph.
2. Select an Agent → view its reachable graph and **Access Impact** (direct/indirect resources, sensitive data, systems, policies, risk with a transparent factor breakdown).
3. Click **Simulate Permission** → grant a hypothetical permission.
4. Run the simulation → see BEFORE / AFTER / DELTA: newly reachable resources, sensitive assets, systems, and the risk increase — with the exact new paths the traversal found.

Plus:

- **Control Center** — platform stats, high-risk agents, policy warnings, recent activity.
- **Decision Trace** (`/actions/:id`) — explains exactly why an action was allowed, allowed-with-approval, or blocked, with the responsible policy.
- **Policy Explorer** — policies, effects, scopes, approval gates, recent decisions.
- **Graph Explorer** — focused subgraph visualization with filters, path tracing, and selection.

## Architecture

```
route → controller → service → repository → Cypher (queries/)
```

- `client/` — React + TypeScript + Vite + React Router + Tailwind + Cytoscape.js
- `server/` — Node + TypeScript + Express + official `neo4j-driver` (CognoDB over Bolt)
- `scripts/` — `seed.ts`, `reset.ts`, `verify.ts`
- No Cypher in React components; no database calls in route handlers.

## Data Model

15 node types: Coworker, Workflow, Agent, Skill, Connector, System, Resource, DataAsset, Policy, Permission, ApprovalGate, Action, KnowledgeBase, Document, User.

Typed relationships:

```
(:Coworker)-[:CONTAINS]->(:Workflow)
(:Workflow)-[:HAS_STEP]->(:Agent)
(:Agent)-[:USES]->(:Skill | KnowledgeBase)
(:Skill)-[:USES]->(:Connector)
(:Connector)-[:CONNECTS_TO]->(:System)
(:System)-[:PROVIDES]->(:Resource)
(:Resource)-[:CONTAINS]->(:DataAsset)
(:Agent)-[:CAN_ACCESS]->(:Resource)
(:Agent)-[:GOVERNED_BY]->(:Policy)
(:Policy)-[:GRANTS]->(:Permission)
(:Policy)-[:REQUIRES]->(:ApprovalGate)
(:Agent)-[:CAN_PERFORM]->(:Action)
(:Action)-[:ACCESSED]->(:Resource)
(:Action)-[:AUTHORIZED_BY]->(:Policy)
(:Action)-[:EXECUTED_BY]->(:Agent)
(:KnowledgeBase)-[:CONTAINS]->(:Document)
(:Policy)-[:APPLIES_TO]->(:Agent)
(:User)-[:OWNS]->(:Coworker)
```

## Graph Diagram

See [`docs/graph-model.md`](docs/graph-model.md).

```
Coworker → Workflow → Agent → Skill → Connector → System → Resource → DataAsset
                                  Agent → Policy → Permission
                                           Policy → ApprovalGate
Action → Agent / Policy / Resource (decision trace)
```

## Core Traversals

All queries are parameterized; user input is never concatenated into Cypher.

1. Agent → DataAsset multi-hop reachability (`USES|CONNECTS_TO|PROVIDES|CAN_ACCESS|CONTAINS*1..6`)
2. Coworker → sensitive DataAssets (`*1..8`, `sensitivity IN ['HIGH','CRITICAL']`)
3. Reverse: which Coworkers can reach a given DataAsset
4. Policies governing an agent (`GOVERNED_BY`)
5. Decision trace (`EXECUTED_BY|AUTHORIZED_BY|ACCESSED*1..5`)
6. Shared-connector blast radius (other agents reaching the same connector)
7. Simulator: hypothetical reachability computed without mutating the graph

## Permission Simulator

`POST /api/simulator/access-impact` takes `{ agentId, permissionId, mode }`, computes current reachable resources, the hypothetical reachable set (grant or revoke), the difference, the risk delta, affected systems/data assets and the new paths. The graph is **never mutated**; the simulation is deterministic.

## Risk Model

Transparent, deterministic scoring — no ML, no mysterious "AI risk score":

| Factor | Points |
|---|---|
| Sensitive data reachable | +30 |
| Destructive permission (write/delete) | +20 |
| External connector | +15 |
| No approval gate | +15 |
| Shared connector | +10 |
| Broad resource scope | +10 |

Clamped to 0–100. 0–29 LOW · 30–59 MEDIUM · 60–79 HIGH · 80–100 CRITICAL. Every score is displayed with its factors.

## Project Structure

```
controlgraph/
├── client/            # React + Vite frontend
├── server/            # Express + neo4j-driver backend
│   └── src/{config,db,routes,controllers,services,repositories,queries,middleware,types}
├── scripts/           # seed / reset / verify
├── docs/              # graph model diagram
├── .env.example
└── README.md
```

## CognoDB Setup

1. Provision a CognoDB instance (Bolt endpoint).
2. Copy `.env.example` → `server/.env` (and `client/.env` with `VITE_API_URL`).
3. Fill in `COGNODB_URI`, `COGNODB_USERNAME`, `COGNODB_PASSWORD`.

## Environment Variables

| Variable | Purpose |
|---|---|
| `COGNODB_URI` | Bolt URI, e.g. `bolt://localhost:7687` |
| `COGNODB_USERNAME` / `COGNODB_PASSWORD` | Credentials (never committed) |
| `PORT` | API server port (default 4000) |
| `CLIENT_ORIGIN` | Allowed CORS origin |
| `VITE_API_URL` | API base URL for the client |

## Installation

```bash
npm run install:all
```

## Seed Database

```bash
npm run seed    # deterministic realistic dataset (see counts printed)
npm run verify  # connectivity + data sanity checks
npm run reset   # clear only ControlGraph data
```

## Run Locally

```bash
npm run dev:server   # http://localhost:4000
npm run dev:client   # http://localhost:5173
```

## API

All responses: `{"success":true,"data":...}` or `{"success":false,"error":{"code","message"}}`.

| Method | Endpoint |
|---|---|
| GET | `/api/health` |
| GET | `/api/coworkers`, `/api/coworkers/:id` |
| GET | `/api/agents`, `/api/agents/:id`, `/api/agents/:id/impact` |
| GET | `/api/systems`, `/api/data-assets` |
| GET | `/api/policies`, `/api/policies/:id` |
| GET | `/api/actions`, `/api/actions/:id/trace` |
| POST | `/api/simulator/access-impact` |
| GET | `/api/graph/:nodeType/:nodeId` |
| GET | `/api/permissions` |

## Screenshots

_(add after deployment)_

## Design Decisions

- **Graph DB as the product, not a detail** — every feature is a traversal; the UI surfaces paths, not just tables.
- **Readable layering** — route → controller → service → repository → query keeps Cypher explainable in an interview.
- **Simulation without mutation** — the flagship feature is a graph *difference*, keeping production state safe.
- **Restrained enterprise UI** — light, dense, one accent color, status colors only for semantics; the graph canvas is the visual centerpiece.
- **Graceful degradation** — DB failures produce a professional status banner with retry, never a blank screen or leaked credentials.

## Known Limitations

- No authentication/authorization on the API (take-home scope).
- Simulator supports a single permission change per run.
- Graph Explorer caps traversal depth/nodes for performance.
- No pagination on some list endpoints.

## Future Improvements

- Multi-permission simulation batches and saved scenarios.
- Policy change simulation (not just permission grants/revokes).
- Drift detection: live action stream vs. declared graph.
- Time-travel: reachability as of a given timestamp.
