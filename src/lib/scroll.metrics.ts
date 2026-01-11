import type { ScrollInput, ScrollMetrics } from "../types/scrollworld";

function normalizeText(text: string) {
  return (text || "").replace(/\s+/g, " ").trim();
}

function tokenize(text: string) {
  return normalizeText(text)
    .toLowerCase()
    .split(/[^a-z0-9']+/)
    .filter(Boolean);
}

export function hash32(str: string) {
  // FNV-1a 32-bit
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function computeScrollMetrics(scroll: ScrollInput): ScrollMetrics {
  const text = normalizeText(scroll?.text || "");
  const tokens = tokenize(text);
  const unique = new Set(tokens);

  const tokenCount = tokens.length;
  const uniqueCount = unique.size;
  const lineCount = (scroll?.text || "").split("\n").filter((l) => l.trim()).length;

  const punctCount = (scroll?.text || "").match(/[!?.,;:]/g)?.length ?? 0;
  const volatility = tokenCount ? punctCount / tokenCount : 0;

  const raw = tokenCount * 0.6 + uniqueCount * 1.2 + lineCount * 3 + volatility * 200;
  const complexity = Math.max(10, Math.floor(raw));

  const seed = hash32(`${scroll?.id || ""}|${scroll?.title || ""}|${text}`);

  return {
    seed,
    tokenCount,
    uniqueCount,
    lineCount,
    volatility,
    complexity,
  };
}
