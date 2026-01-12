import { describe, it, expect, vi } from "vitest";
import { createColorEngine } from "../../src/engines/colorEngine/index";

const phonemeEngine = {
  analyzeWord: () => ({
    vowelFamily: "AE",
    phonemes: ["T", "EH", "S", "T"],
    coda: "ST",
    rhymeKey: "AE-ST",
  }),
  CMU_DICT: { TEST: true, PAIN: true, FEAR: true },
  DICT_V2: { words: {} },
};

describe("Syntactic Engine", () => {
  it("keeps channels stable when enrichment lands", async () => {
    const enrichmentProvider = vi.fn(async () => ({
      evidence: [
        { type: "definition", value: "a sample definition", source: "enriched" },
      ],
      confidenceBoost: 0.2,
      enriched: true,
      isValid: true,
    }));

    const engine = createColorEngine({
      phonemeEngine,
      enrichmentProvider,
      isEnrichmentEnabled: () => true,
      enrichmentDelayMs: 0,
    });

    const base = engine.getTokenResult("TEST");
    await engine.requestEnrichment("TEST");
    const enriched = engine.getTokenResult("TEST");

    expect(enriched.channels).toEqual(base.channels);
    expect(enriched.enriched).toBe(true);
    expect(enriched.evidence.some((item) => item.type === "definition")).toBe(true);
  });

  it("dedupes enrichment requests per token", async () => {
    let resolvePromise = null;
    const enrichmentProvider = vi.fn(
      () =>
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
    );

    const engine = createColorEngine({
      phonemeEngine,
      enrichmentProvider,
      isEnrichmentEnabled: () => true,
      enrichmentDelayMs: 0,
    });

    const first = engine.requestEnrichment("PAIN");
    const second = engine.requestEnrichment("PAIN");

    expect(first).toBe(second);

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(enrichmentProvider).toHaveBeenCalledTimes(1);

    resolvePromise?.({
      evidence: [{ type: "definition", value: "hurt", source: "enriched" }],
      enriched: true,
      isValid: true,
    });
    await first;
  });

  it("never blocks fast results when enrichment fails", async () => {
    const enrichmentProvider = vi.fn(async () => {
      throw new Error("network down");
    });

    const engine = createColorEngine({
      phonemeEngine,
      enrichmentProvider,
      isEnrichmentEnabled: () => true,
      enrichmentDelayMs: 0,
    });

    const fastResult = engine.getTokenResult("FEAR");
    await engine.requestEnrichment("FEAR");
    const after = engine.getTokenResult("FEAR");

    expect(fastResult.channels.text.className).toBe(after.channels.text.className);
    expect(after.enriched).toBe(false);
  });
});
