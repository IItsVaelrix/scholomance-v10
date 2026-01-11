import { useMemo, useReducer, useCallback } from "react";
import { createWorldSessionFromScroll } from "../lib/scrollworld.engine";
import { worldReducer } from "../lib/world.runtime";

export function useScrollWorld(scroll) {
  const session = useMemo(() => createWorldSessionFromScroll(scroll), [scroll]);
  const [state, dispatchBase] = useReducer(
    (s, a) => worldReducer(session.world, s, a),
    session.state
  );

  const dispatch = useCallback((action) => dispatchBase(action), []);

  const currentNode = session.world.nodes.find((n) => n.id === state.nodeId);

  const entitiesHere = (currentNode?.entities || [])
    .map((id) => session.world.entitiesById[id])
    .filter(Boolean)
    .map((entity) => hydrateEntity(entity, state));

  return { world: session.world, state, dispatch, currentNode, entitiesHere };
}

function hydrateEntity(entity, state) {
  const hiddenState = state.entityStateById?.[entity.id]?.hiddenState || entity.hiddenState;
  const contents = entity.contents?.map((child) => hydrateEntity(child, state));
  return { ...entity, hiddenState, contents };
}
