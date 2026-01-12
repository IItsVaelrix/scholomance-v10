import type { EnrichmentPatch, SyntacticResult } from "./index";

export const buildResultSignature = (result: SyntacticResult) => {
  const chips = result.chips
    .map((chip) => `${chip.type}:${chip.label}:${chip.confidence}:${chip.source}:${chip.className}`)
    .join("|");
  const evidence = result.evidence
    .map((item) => `${item.type}:${item.value}:${item.source}`)
    .join("|");
  return `${result.enriched}-${result.confidence}-${chips}-${evidence}`;
};

export const mergeEnrichment = (base: SyntacticResult, patch: EnrichmentPatch): SyntacticResult => {
  if (!patch) return base;
  const chips = [...base.chips];
  const evidence = [...base.evidence];

  patch.chips?.forEach((chip) => {
    const exists = chips.some(
      (existing) =>
        existing.type === chip.type &&
        existing.label === chip.label &&
        existing.source === chip.source
    );
    if (!exists) chips.push(chip);
  });

  patch.evidence?.forEach((item) => {
    const exists = evidence.some(
      (existing) =>
        existing.type === item.type &&
        existing.value === item.value &&
        existing.source === item.source
    );
    if (!exists) evidence.push(item);
  });

  const nextConfidence = Math.min(
    1,
    Math.max(base.confidence, base.confidence + (patch.confidenceBoost || 0))
  );

  return {
    ...base,
    chips,
    evidence,
    confidence: nextConfidence,
    enriched: patch.enriched || base.enriched,
  };
};
