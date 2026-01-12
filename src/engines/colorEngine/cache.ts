import type { SyntacticResult } from "./index";

export const ENRICHMENT_TTL_MS = 1000 * 60 * 60 * 24 * 7;
export const ENRICHMENT_NEGATIVE_TTL_MS = 1000 * 60 * 60 * 24;

export type EnrichmentRecord = {
  result: SyntacticResult;
  updatedAt: number;
  signature: string;
  isValid: boolean;
};

export const getCacheKey = (version: string, token: string) => `${version}::${token}`;

export const getEnrichedRecord = (
  cache: Map<string, EnrichmentRecord>,
  key: string,
  now = Date.now()
) => {
  const record = cache.get(key);
  if (!record) return null;
  const ttl = record.isValid ? ENRICHMENT_TTL_MS : ENRICHMENT_NEGATIVE_TTL_MS;
  if (now - record.updatedAt > ttl) {
    cache.delete(key);
    return null;
  }
  return record;
};
