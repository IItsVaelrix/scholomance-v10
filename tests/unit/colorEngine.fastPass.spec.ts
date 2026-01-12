import { describe, it, expect } from "vitest";
import { buildFastResult } from "../../src/engines/colorEngine/fastPass";

describe("colorEngine fastPass", () => {
  it("provides fallback evidence when phoneme engine is missing", () => {
    const result = buildFastResult("MAGIC", null, "color-engine@1");

    expect(result.token).toBe("MAGIC");
    expect(result.channels.text.source).toBe("rune");
    expect(result.channels.accent.source).toBe("feel");
    expect(result.chips.some((chip) => chip.type === "school")).toBe(true);
    expect(result.chips.some((chip) => chip.type === "rune")).toBe(true);
    expect(result.chips.some((chip) => chip.type === "feel")).toBe(true);
    expect(result.evidence.some((item) => item.type === "usage")).toBe(true);
  });

  it("adds coda-group usage when available", () => {
    const phonemeEngine = {
      analyzeWord: () => ({
        vowelFamily: "AE",
        phonemes: ["T", "EH", "S", "T"],
        coda: "ST",
        rhymeKey: "AE-ST",
      }),
      CMU_DICT: {},
      DICT_V2: {
        words: {},
        consonant_groups: {
          coda_groups: {
            sibilant: ["ST", "SK"],
          },
        },
      },
    };

    const result = buildFastResult("TEST", phonemeEngine, "color-engine@1");
    expect(
      result.evidence.some((item) => item.type === "usage" && item.value === "coda-group:sibilant")
    ).toBe(true);
  });
});
