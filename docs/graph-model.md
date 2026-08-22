# ControlGraph — Graph Data Model

## Operational chain (access / reachability)

```
┌──────────┐  CONTAINS  ┌───────────┐  HAS_STEP  ┌───────┐  USES   ┌────────┐
│ Coworker │───────────▶│ Workflow  │───────────▶│ Agent │────────▶│ Skill  │
└──────────┘            └───────────┘            └───┬───┘         └───┬────┘
                                                   │                 │ USES
                             GOVERNED_BY / CAN_ACCESS                ▼
                                                   │           ┌───────────┐
                                                   │           │ Connector │
                                                   │           └─────┬─────┘
                                                   │        CONNECTS_TO
                                                   │                 ▼
                                                   │           ┌────────┐
                                                   │           │ System │
                                                   │           └───┬────┘
                                                   │            PROVIDES
                                                   ▼                 ▼
                                             ┌───────────┐      ┌──────────┐
                                             │ Resource ◀──────│ (Resource)│
                                             └─────┬─────┘      └──────────┘
                                              CONTAINS
                                                   ▼
                                             ┌───────────┐
                                             │ DataAsset │  (sensitivity: LOW..CRITICAL)
                                             └───────────┘
```

## Governance chain (authorization)

```
┌───────┐  GOVERNED_BY  ┌────────┐  GRANTS    ┌────────────┐
│ Agent │──────────────▶│ Policy │───────────▶│ Permission │
└───┬───┘               └───┬────┘            └────────────┘
    │                       │ REQUIRES
    │                       ▼
    │                 ┌───────────────┐
    │                 │ ApprovalGate  │
    │                 └───────────────┘
    │ APPLIES_TO (reverse view of GOVERNED_BY on policy side)
    ▼
  Policy
```

## Decision trace (why was an action allowed?)

```
┌────────┐  EXECUTED_BY  ┌───────┐  GOVERNED_BY  ┌────────┐
│ Action │──────────────▶│ Agent │──────────────▶│ Policy │
└───┬────┘               └───┬───┘               └───┬────┘
    │                        │                       │ GRANTS
    │ ACCESSED               │ CAN_PERFORM           ▼
    ▼                        ▼                 ┌────────────┐
┌──────────┐            ┌────────┐            │ Permission │
│ Resource │            │ Action │            └────────────┘
└────┬─────┘            └────────┘
     │ CONTAINS
     ▼
┌───────────┐
│ DataAsset │
└───────────┘
```

## Knowledge chain

```
┌───────┐  USES  ┌────────────────┐  CONTAINS  ┌──────────┐
│ Agent │───────▶│ KnowledgeBase  │───────────▶│ Document │
└───────┘        └────────────────┘            └──────────┘
```

## Ownership

```
┌──────┐  OWNS  ┌──────────┐
│ User │───────▶│ Coworker │
└──────┘        └──────────┘
```

## Shared-connector blast radius (why the graph matters)

```
Agent A ─USES▶ Skill X ─USES▶ ┌────────────┐ ◀USES─ Skill Y ─◀USES Agent B
                              │ Connector  │
Agent C ─USES▶ Skill Z ─USES▶ │ (shared)   │ ─CONNECTS_TO▶ System ─▶ Resource ─▶ DataAsset
                              └────────────┘
```

A permission change affecting the shared connector changes reachability for A, B and C simultaneously — one traversal reveals the full blast radius.
