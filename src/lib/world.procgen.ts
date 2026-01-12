import { mulberry32, pick, int, chance } from "./rng";
import { NODE_TYPES, ENTITY_TYPES } from "../data/world.schema";
import type { EntityType, NodeType } from "../data/world.schema";
import type { ScrollInput, ScrollMetrics, World, WorldEntity, WorldNode } from "../types/scrollworld";

function id(prefix: string, n: number) {
  return `${prefix}_${n}`;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export function generateWorldFromScroll(metrics: ScrollMetrics, scroll: ScrollInput): World {
  const rng = mulberry32(metrics.seed);

  const nodeCount = clamp(Math.floor(metrics.complexity / 35), 6, 60);
  const extraEdges = clamp(Math.floor(metrics.complexity / 90), 2, 40);
  const entityBudget = clamp(Math.floor(metrics.complexity / 10), 15, 300);

  const nodes: WorldNode[] = [];
  for (let i = 0; i < nodeCount; i++) {
    const type: NodeType = i === 0 ? "HUB" : pick(rng, NODE_TYPES);
    nodes.push({
      id: id("N", i),
      type,
      title: nodeTitle(rng, type, scroll),
      description: nodeDescription(rng, type),
      entities: [],
    });
  }

  const edges: World["edges"] = [];
  for (let i = 0; i < nodeCount - 1; i++) {
    edges.push({ from: nodes[i].id, to: nodes[i + 1].id, locked: chance(rng, 0.15) });
  }
  for (let k = 0; k < extraEdges; k++) {
    const a = int(rng, 0, nodeCount - 1);
    const b = int(rng, 0, nodeCount - 1);
    if (a !== b) edges.push({ from: nodes[a].id, to: nodes[b].id, locked: chance(rng, 0.1) });
  }

  const entities: WorldEntity[] = [];
  let idCounter = 0;
  const allocId = (prefix) => id(prefix, idCounter++);

  while (entities.length < entityBudget) {
    const node = pick(rng, nodes);
    const kind: EntityType = pick(rng, ENTITY_TYPES);

    const ent = makeEntity(rng, kind, scroll, metrics, node.type, allocId, entityBudget - entities.length, 0);
    const created = collectEntities(ent);
    for (const createdEntity of created) entities.push(createdEntity);
    node.entities.push(ent.id);
  }

  const arena = nodes.find((n) => n.type === "ARENA") || nodes[nodes.length - 1];
  const boss = makeMonster(rng, scroll, metrics, "BOSS", allocId("M"));
  entities.push(boss);
  arena.entities.push(boss.id);

  return {
    seed: metrics.seed,
    metrics,
    nodes,
    edges,
    entitiesById: Object.fromEntries(entities.map((x) => [x.id, x])),
    startNodeId: nodes[0].id,
  };
}

function nodeTitle(rng: () => number, type: NodeType, scroll: ScrollInput) {
  const t = (scroll?.title || "SCROLL").toUpperCase();
  const pool = {
    HUB: [`${t} ATRIUM`, "EDEN OF TEXT", "THE INDEX HALL"],
    ROOM: ["MARGIN CELL", "INK QUARTERS", "SYNTAX CHAMBER"],
    ARENA: ["RHYME PIT", "THE STRESS TEST", "BOSS STAGE"],
    SHRINE: ["ALTAR OF WILL", "GLYPH SHRINE", "QUIET VOW"],
    VAULT: ["ARCHIVE VAULT", "SEALED LEXICON", "LOCKED CACHE"],
    RIFT: ["VOID RIFT", "SPECTRAL TEAR", "BLACKLIGHT SPLICE"],
  };
  return pick(rng, pool[type] || pool.ROOM);
}

function nodeDescription(rng: () => number, type: NodeType) {
  const mood = pick(rng, ["hushed", "hostile", "luminous", "obsidian", "spectral", "indigo-gold"]);
  const hook = pick(rng, [
    "clickable glyphs shimmer on the walls",
    "the air feels like an unfinished line",
    "the floor is tiled with broken metaphors",
    "you hear cadence, like footsteps made of syllables",
  ]);
  return `${mood} ${type.toLowerCase()} where ${hook}.`;
}

function makeEntity(
  rng: () => number,
  kind: EntityType,
  scroll: ScrollInput,
  metrics: ScrollMetrics,
  nodeType: NodeType,
  allocId: (prefix: string) => string,
  budgetRemaining: number,
  depth: number
): WorldEntity {
  switch (kind) {
    case "MONSTER":
      return makeMonster(rng, scroll, metrics, nodeType === "ARENA" ? "ELITE" : "COMMON", allocId("M"));
    case "ITEM":
      return makeContainerEntity(
        {
          id: allocId("I"),
          type: "ITEM",
          name: pick(rng, ["Key Sigil", "Ink Vial", "Phoneme Shard", "Mirror Token", "Thread Spool"]),
          description: pick(rng, [
            "A small object with a quiet hum.",
            "It smells faintly of ink and metal.",
            "Its surface flickers with latent syntax.",
          ]),
          tags: baseItemTags(rng),
          effects: {
            unlockChance: 0.2 + Math.min(0.5, metrics.volatility),
            heal: chance(rng, 0.25) ? int(rng, 5, 25) : 0,
          },
          consumedOnUse: chance(rng, 0.6),
          hiddenState: "visible",
        },
        rng,
        scroll,
        metrics,
        allocId,
        budgetRemaining,
        depth
      );
    case "NPC":
      return {
        id: allocId("P"),
        type: "NPC",
        name: pick(rng, ["Archivist", "Golem Scribe", "Mute Oracle", "Syntax Monk"]),
        description: pick(rng, [
          "They watch you as if you were a line about to be revised.",
          "A figure of paper and patience.",
          "Their eyes track the rhythm of your steps.",
        ]),
        tags: ["readable"],
        dialogue: pick(rng, [
          "Your scroll wrote this place into being.",
          "Click carefully. Every choice is a stanza.",
          "The monsters are just contradictions with teeth.",
        ]),
        hiddenState: "visible",
      };
    case "DOOR":
      return {
        id: allocId("D"),
        type: "DOOR",
        name: pick(rng, ["Sealed Gate", "Locked Margin", "Glyph Latch"]),
        description: pick(rng, [
          "A barrier etched with unstable glyphs.",
          "The hinges vibrate like a plucked string.",
          "It resists, as if the room wants to stay closed.",
        ]),
        tags: ["hollow", "hidden"],
        locked: chance(rng, 0.7),
        keyHint: pick(rng, ["Key Sigil", "Mirror Token", "Phoneme Shard"]),
        hiddenState: chance(rng, 0.7) ? "locked" : "obscured",
        contents: [],
      };
    case "CLUE":
    default:
      return {
        id: allocId("C"),
        type: "CLUE",
        title: pick(rng, ["Marginalia", "Red Thread Note", "Blacklight Annotation"]),
        description: "A note that seems to wait for a second glance.",
        text: clueText(rng, scroll, metrics),
        tags: ["readable", "hidden"],
        hiddenState: chance(rng, 0.4) ? "obscured" : "visible",
      };
  }
}

function clueText(rng: () => number, scroll: ScrollInput, metrics: ScrollMetrics) {
  const t = scroll?.title || "Untitled";
  const scale = metrics.complexity;
  return `A clue from "${t}": the world grows with your words (complexity=${scale}).`;
}

function makeMonster(
  rng: () => number,
  scroll: ScrollInput,
  metrics: ScrollMetrics,
  rank: "COMMON" | "ELITE" | "BOSS",
  idValue: string
): WorldEntity {
  const base = 10 + Math.floor(metrics.uniqueCount / 8);
  const rankMult = rank === "BOSS" ? 6 : rank === "ELITE" ? 2.5 : 1;
  const hp = Math.floor(base * rankMult + int(rng, 0, 20));
  const atk = Math.floor((base / 2) * rankMult + int(rng, 0, 8));

  return {
    id: rank === "BOSS" ? "M_BOSS" : idValue,
    type: "MONSTER",
    rank,
    name: pick(rng, [
      "Comma Wraith",
      "Apostrophe Ghoul",
      "Run-On Hydra",
      "Metaphor Mimic",
      "Obsidian Larva",
      "Spectral Splitter",
    ]),
    stats: { hp, atk },
    loot: chance(rng, 0.5) ? ["Ink Vial"] : ["Phoneme Shard"],
    tags: [],
    description: "A creature assembled from punctuation and appetite.",
    hiddenState: "visible",
  };
}

function baseItemTags(rng: () => number) {
  const tags = ["moveable"];
  if (chance(rng, 0.35)) tags.push("flammable");
  if (chance(rng, 0.25)) tags.push("heavy");
  if (chance(rng, 0.2)) tags.push("hidden");
  return tags;
}

function makeContainerEntity(
  entity: WorldEntity,
  rng: () => number,
  scroll: ScrollInput,
  metrics: ScrollMetrics,
  allocId: (prefix: string) => string,
  budgetRemaining: number,
  depth: number
) {
  if (depth > 2) return entity;
  if (budgetRemaining < 2) return entity;
  if (!chance(rng, 0.22)) return entity;

  const childCount = int(rng, 1, Math.min(3, budgetRemaining - 1));
  const contents = [];
  for (let i = 0; i < childCount; i++) {
    const kind: EntityType = pick(rng, ENTITY_TYPES);
    const child = makeEntity(rng, kind, scroll, metrics, "ROOM", allocId, budgetRemaining - 1, depth + 1);
    contents.push(child);
  }

  return {
    ...entity,
    tags: [...new Set([...(entity.tags || []), "hollow"])],
    hiddenState: chance(rng, 0.6) ? "obscured" : entity.hiddenState,
    contents,
  };
}

function collectEntities(entity: WorldEntity) {
  const all = [entity];
  if (entity.contents?.length) {
    for (const child of entity.contents) {
      all.push(...collectEntities(child));
    }
  }
  return all;
}
