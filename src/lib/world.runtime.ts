import { WORLD_ACTIONS } from "../data/world.schema";
import { resolveInteraction } from "./interaction.system";
import type { HiddenState } from "../data/world.schema";
import type { World, WorldAction, WorldEntity, WorldState } from "../types/scrollworld";

export function createInitialWorldState(world: World): WorldState {
  return {
    worldId: `WORLD_${world.seed}`,
    nodeId: world.startNodeId,
    inventory: [],
    visited: new Set([world.startNodeId]),
    log: [`World born from seed ${world.seed}.`],
    defeated: new Set(),
    entityStateById: {},
  };
}

// Pure reducer: UI dispatches actions; world + state -> next state
export function worldReducer(world: World, state: WorldState, action: WorldAction): WorldState {
  switch (action.type) {
    case WORLD_ACTIONS.MOVE: {
      const to = action.to;
      const visited = new Set(state.visited);
      visited.add(to);
      return { ...state, nodeId: to, visited, log: [...state.log, `Moved to ${to}.`] };
    }

    case WORLD_ACTIONS.PICKUP: {
      const itemId = action.itemId;
      if (state.inventory.includes(itemId)) return state;
      return { ...state, inventory: [...state.inventory, itemId], log: [...state.log, `Picked up ${itemId}.`] };
    }

    case WORLD_ACTIONS.INTERACT: {
      const entityId = action.entityId;
      const ent = world.entitiesById[entityId];
      if (!ent) return state;
      const hiddenState = getHiddenState(state, ent);
      if (ent.contents?.length && hiddenState !== "visible") {
        return {
          ...state,
          entityStateById: {
            ...state.entityStateById,
            [ent.id]: { hiddenState: "visible" },
          },
          log: [...state.log, `You inspect ${ent.name || ent.title || ent.id}, revealing its contents.`],
        };
      }
      const extra =
        ent.text
          ? ` ${ent.text}`
          : ent.dialogue
          ? ` "${ent.dialogue}"`
          : ent.description
          ? ` ${ent.description}`
          : "";
      return {
        ...state,
        log: [...state.log, `Interacted with ${ent.type}: ${ent.name || ent.title || ent.id}.${extra}`],
      };
    }

    case WORLD_ACTIONS.FIGHT: {
      const monsterId = action.monsterId;
      const m = world.entitiesById[monsterId];
      if (!m || m.type !== "MONSTER") return state;

      const win = state.inventory.length > 0;
      if (!win) return { ...state, log: [...state.log, `You lost to ${m.name}. Flee?`] };

      const defeated = new Set(state.defeated);
      defeated.add(monsterId);
      return { ...state, defeated, log: [...state.log, `Defeated ${m.name} (${m.rank}).`] };
    }

    case WORLD_ACTIONS.USE_ITEM: {
      const tool = world.entitiesById[action.toolId];
      const target = world.entitiesById[action.targetId];
      const result = resolveInteraction(tool, target);
      if (!result) return state;

      const nextEntityStateById = { ...state.entityStateById };
      if (result.targetState && target) {
        nextEntityStateById[target.id] = {
          ...(nextEntityStateById[target.id] || {}),
          ...result.targetState,
        };
      }

      return { ...state, entityStateById: nextEntityStateById, log: [...state.log, result.message] };
    }

    default:
      return state;
  }
}

function getHiddenState(state: WorldState, entity: WorldEntity): HiddenState {
  return state.entityStateById?.[entity.id]?.hiddenState || entity.hiddenState;
}
