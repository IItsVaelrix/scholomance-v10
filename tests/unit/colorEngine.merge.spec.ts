import { describe, it, expect } from "vitest";
import { mergeEnrichment } from "../../src/engines/colorEngine/merge";

const base = {
  version: "color-engine@1",
  token: "TEST",
  classes: ["editor-word"],
  channels: {
    text: { source: "rune", className: "vowel-ae" },
    accent: { source: "feel", className: "feel-neutral" },
    border: { source: "feel", className: "feel-neutral" },
    glow: { source: "feel", className: "feel-neutral" },
  },
  chips: [
    { type: "school", label: "PSYCHIC", className: "school-psychic", confidence: 0.6, source: "fast" },
  ],
  evidence: [{ type: "rhyme", value: "AE-ST", source: "fast" }],
  confidence: 0.6,
  enriched: false,
};

describe("colorEngine merge", () => {
  it("does not mutate channels while merging enrichment", () => {
    const merged = mergeEnrichment(base, {
      evidence: [{ type: "definition", value: "a test definition", source: "enriched" }],
      confidenceBoost: 0.2,
      enriched: true,
      isValid: true,
    });

    expect(merged.channels).toEqual(base.channels);
    expect(merged.enriched).toBe(true);
    expect(merged.evidence.some((item) => item.type === "definition")).toBe(true);
  });
});
