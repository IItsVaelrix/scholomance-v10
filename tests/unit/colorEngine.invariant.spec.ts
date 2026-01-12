import { describe, it, expect } from "vitest";
import { createColorEngine } from "../../src/engines/colorEngine/index";

describe("colorEngine invariants", () => {
  it("never mutates channels with enrichment", async () => {
    const engine = createColorEngine({
      enrichmentProvider: async () => ({
        evidence: [{ type: "definition", value: "sample", source: "enriched" }],
        confidenceBoost: 0.1,
        enriched: true,
        isValid: true,
      }),
      isEnrichmentEnabled: () => true,
      enrichmentDelayMs: 0,
    });

    const base = engine.getTokenResult("oracle");
    await engine.requestEnrichment("oracle");
    const enriched = engine.getTokenResult("oracle");

    expect(enriched.channels).toEqual(base.channels);
    expect(enriched.enriched).toBe(true);
  });

  it("always returns the required shape", () => {
    const engine = createColorEngine({ isEnrichmentEnabled: () => false });
    const result = engine.getTokenResult("rune");

    expect(result.token).toBeTruthy();
    expect(result.channels.text.source).toMatch(/school|rune/);
    expect(result.channels.accent.source).toBe("feel");
    expect(result.channels.border.source).toBe("feel");
    expect(result.channels.glow.source).toBe("feel");
    expect(Array.isArray(result.chips)).toBe(true);
    expect(Array.isArray(result.evidence)).toBe(true);
  });
});
