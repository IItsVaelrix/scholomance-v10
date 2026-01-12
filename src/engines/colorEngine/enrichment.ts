import {
  fetchDictionaryEntry,
  getCachedDictionaryEntry,
  isDictionaryApiEnabled,
} from "../../lib/dictionaryApi.js";
import { ENRICHMENT_TTL_MS } from "./cache";
import type { EnrichmentPatch, EnrichmentProvider } from "./index";

const buildEnrichmentPatch = (token: string): EnrichmentPatch | null => {
  const cached = getCachedDictionaryEntry(token, { maxAgeMs: ENRICHMENT_TTL_MS });
  if (cached?.definitions?.length) {
    return {
      evidence: cached.definitions.slice(0, 2).map((definition) => ({
        type: "definition" as const,
        value: definition,
        source: "enriched" as const,
      })),
      confidenceBoost: 0.12,
      enriched: true,
      isValid: true,
    };
  }
  return null;
};

export const defaultEnrichmentProvider: EnrichmentProvider = async (token, options = {}) => {
  if (!isDictionaryApiEnabled()) return null;
  const cached = buildEnrichmentPatch(token);
  if (cached) return cached;
  const entry = await fetchDictionaryEntry(token, {
    signal: options.signal,
    maxAgeMs: ENRICHMENT_TTL_MS,
    force: true,
  });
  if (!entry?.definitions?.length) {
    return { isValid: false };
  }
  return {
    evidence: entry.definitions.slice(0, 2).map((definition) => ({
      type: "definition",
      value: definition,
      source: "enriched",
    })),
    confidenceBoost: entry.isValid ? 0.12 : 0,
    enriched: entry.isValid,
    isValid: entry.isValid,
  };
};
