export const NODE_TYPES = ["ROOM", "HUB", "ARENA", "SHRINE", "VAULT", "RIFT"] as const;
export const ENTITY_TYPES = ["MONSTER", "ITEM", "NPC", "DOOR", "CLUE"] as const;
export const ENTITY_TAGS = ["flammable", "hollow", "moveable", "readable", "hidden", "heavy"] as const;

export const WORLD_ACTIONS = {
  MOVE: "MOVE",
  INTERACT: "INTERACT",
  PICKUP: "PICKUP",
  FIGHT: "FIGHT",
  FLEE: "FLEE",
  USE_ITEM: "USE_ITEM",
  READ_CLUE: "READ_CLUE",
} as const;

export type NodeType = (typeof NODE_TYPES)[number];
export type EntityType = (typeof ENTITY_TYPES)[number];
export type EntityTag = (typeof ENTITY_TAGS)[number];
export type WorldActionType = (typeof WORLD_ACTIONS)[keyof typeof WORLD_ACTIONS];
export type HiddenState = "visible" | "obscured" | "locked";

export function createWorldId(seed) {
  return `WORLD_${seed}`;
}
