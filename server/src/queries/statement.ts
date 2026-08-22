/** A parameterized Cypher statement. User input MUST only ever enter `params`. */
export interface Statement {
  cypher: string;
  params: Record<string, unknown>;
}

export function stmt(cypher: string, params: Record<string, unknown> = {}): Statement {
  return { cypher, params };
}

/** Relationship type lists written explicitly per query for clarity (CONTAINS is
 *  both a label keyword and a relationship type here, so no wildcard rel lists). */
export const ACCESS_RELS = "USES|CONNECTS_TO|PROVIDES|CAN_ACCESS|CONTAINS";
