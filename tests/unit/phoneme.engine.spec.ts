import { describe, it, expect, beforeEach, vi } from "vitest";
import { PhonemeEngine } from "../../src/lib/phoneme.engine";

// Mock the dictionary data
const mockDict = {
  vowel_families: ["A", "IY"],
  words: {
    TEST: { vowelFamily: "EH", phonemes: ["T", "EH", "S", "T"], coda: "ST" },
    HELLO: { vowelFamily: "OH", phonemes: ["H", "E", "L", "OW"], coda: "L-OW" },
  },
};

const mockCmuDict = {
  COMPUTER: { ph: ["K", "AH", "M", "P", "Y", "UW", "T", "ER"], vf: ["AH", "UW", "ER"], cd: ["T", "ER"] },
};

// Mock the global fetch
global.fetch = vi.fn((url) =>
  Promise.resolve({
    ok: true,
    json: () => {
      if (url.includes("phoneme_dictionary_v2.json")) return Promise.resolve(mockDict);
      if (url.includes("rhyme_matching_rules_v2.json")) return Promise.resolve({ rules: {} });
      if (url.includes("cmudict.min.json")) return Promise.resolve(mockCmuDict);
      return Promise.resolve({});
    },
  })
);

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();
vi.stubGlobal('localStorage', localStorageMock);


describe("PhonemeEngine", () => {
  beforeEach(async () => {
    // Reset cache and state before each test
    PhonemeEngine.WORD_CACHE.clear();
    PhonemeEngine.DICT_V2 = null;
    PhonemeEngine.CMU_DICT = null;
    localStorage.clear();
    vi.clearAllMocks();
    await PhonemeEngine.init();
  });

  describe("Initialization", () => {
    it("should load dictionaries from network and cache them", async () => {
      // First init is done in beforeEach
      expect(PhonemeEngine.DICT_V2).toEqual(mockDict);
      expect(PhonemeEngine.CMU_DICT).toEqual(mockCmuDict);

      // Check if they are in localStorage
      expect(localStorage.getItem("dict_cache_version")).not.toBeNull();
      expect(JSON.parse(localStorage.getItem("dict_v2_cache"))).toEqual(mockDict);
    });

    it("should load dictionaries from cache on second run", async () => {
      // First run (network) happens in beforeEach
      // Now, let's reset the engine state but not the cache, and re-init
      PhonemeEngine.DICT_V2 = null;
      PhonemeEngine.CMU_DICT = null;
      
      // Clear the history from the beforeEach run
      vi.clearAllMocks();

      await PhonemeEngine.init();

      // Check that fetch was NOT called because data is in cache
      expect(global.fetch).not.toHaveBeenCalled();
      // And the data is still loaded
      expect(PhonemeEngine.DICT_V2).toEqual(mockDict);
    });
  });

  describe("analyzeWord", () => {
    it("should analyze a word from the CMU dictionary first", () => {
      const result = PhonemeEngine.analyzeWord("COMPUTER");
      expect(result).toEqual({
        vowelFamily: "ER", // Last vowel family
        phonemes: ["K", "AH", "M", "P", "Y", "UW", "T", "ER"],
        coda: "TER",
        rhymeKey: "ER-TER",
      });
    });

    it("should analyze a word from the custom dictionary if not in CMU", () => {
      const result = PhonemeEngine.analyzeWord("HELLO");
      expect(result).toEqual({
        vowelFamily: "OH",
        phonemes: ["H", "E", "L", "OW"],
        coda: "L-OW",
        rhymeKey: "OH-L-OW",
      });
    });

    it("should use the word cache for subsequent analyses", () => {
      const spy = vi.spyOn(PhonemeEngine.WORD_CACHE, 'get');
      PhonemeEngine.analyzeWord("TEST"); // First call, no cache hit
      const result = PhonemeEngine.analyzeWord("TEST"); // Second call, should hit cache

      expect(spy).toHaveBeenCalledWith("TEST");
      expect(result.vowelFamily).toBe("EH");
    });

    it("should return a fallback analysis for unknown words", () => {
      const result = PhonemeEngine.analyzeWord("QUOKKA");
      expect(result).toBeDefined();
      expect(result.vowelFamily).toBe("A"); // Guessed from 'A'
      expect(result.coda).toBeNull(); // Ends in vowel, so open syllable
      expect(result.rhymeKey).toBe("A-open");
    });

    it("should handle empty or invalid input gracefully", () => {
      expect(PhonemeEngine.analyzeWord("")).toBeNull();
      expect(PhonemeEngine.analyzeWord(null)).toBeNull();
      expect(PhonemeEngine.analyzeWord("123")).toBeNull();
    });
  });
});
