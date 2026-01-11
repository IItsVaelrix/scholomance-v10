import { computeScrollMetrics } from "./scroll.metrics";
import { generateWorldFromScroll } from "./world.procgen";
import { createInitialWorldState } from "./world.runtime";
import type { ScrollInput } from "../types/scrollworld";

export function createWorldSessionFromScroll(scroll: ScrollInput) {
  const metrics = computeScrollMetrics(scroll);
  const world = generateWorldFromScroll(metrics, scroll);
  const state = createInitialWorldState(world);
  return { world, state };
}
