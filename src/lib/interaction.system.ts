import type { WorldEntity } from "../types/scrollworld";

type InteractionResult = {
  message: string;
  targetState?: { hiddenState: "visible" | "obscured" | "locked" };
};

export function resolveInteraction(tool?: WorldEntity, target?: WorldEntity): InteractionResult {
  if (!tool || !target) return { message: "Nothing happens." };

  if (tool.tags?.includes("flammable") && target.tags?.includes("flammable")) {
    return { message: "The fire spreads!" };
  }

  if (tool.tags?.includes("heavy") && target.tags?.includes("hollow")) {
    return {
      message: `You smashed the ${target.name}, revealing what was inside!`,
      targetState: { hiddenState: "visible" },
    };
  }

    return { message: `You can't do that with ${tool.name}.` };
}
