// Phoneme Analysis Engine for ST-XPD Vowel Family System
type PhonemeEntry = {
  vowelFamily: string;
  phonemes: string[];
  coda?: string | null;
};

type PhonemeDict = {
  vowel_families: string[];
  words: Record<string, PhonemeEntry>;
  consonant_groups?: {
    coda_groups?: Record<string, string[]>;
  };
};

type PhonemeAnalysis = {
  vowelFamily: string;
  phonemes: string[];
  coda: string | null;
  rhymeKey: string;
};

type CmuEntry = {
  ph: string[];
  vf: string[];
  cd: string[];
};

const DICT_CACHE_VERSION = "v2.1"; // Update this to force-invalidate the cache
const CACHE_KEYS = {
  version: "dict_cache_version",
  dict: "dict_v2_cache",
  rules: "rules_v2_cache",
};
const MAX_WORD_CACHE = 5000;

const safeGetItem = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeRemoveItem = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage failures (private mode, disabled storage).
  }
};

const getCached = (key) => {
  const item = safeGetItem(key);
  if (!item) return null;
  try {
    return JSON.parse(item);
  } catch {
    return null;
  }
};

export const PhonemeEngine = {
  DICT_V2: null as PhonemeDict | null,
  RULES_V2: null as Record<string, unknown> | null,
  CMU_DICT: null as Record<string, CmuEntry> | null,
  WORD_CACHE: new Map<string, PhonemeAnalysis>(),

  async init(options: { signal?: AbortSignal } = {}) {
    safeRemoveItem("cmu_dict_cache");
    // 1. Try to load from cache
    const cachedVersion = safeGetItem(CACHE_KEYS.version);
    if (cachedVersion === DICT_CACHE_VERSION) {
      const dict = getCached(CACHE_KEYS.dict);
      const rules = getCached(CACHE_KEYS.rules);

      if (dict && rules) {
        this.DICT_V2 = dict;
        this.RULES_V2 = rules;
        console.log(`ST-XPD v2 Active (from cache): ${dict.vowel_families.length} Families.`);
        return { mode: "full", familiesCount: dict.vowel_families.length };
      }
    }

    // 2. If cache is invalid or missing, fetch from network
    try {
      const [dict, rules, cmuDict] = await Promise.all([
        fetch("/phoneme_dictionary_v2.json", { signal: options.signal }).then((r) => r.json()),
        fetch("/rhyme_matching_rules_v2.json", { signal: options.signal }).then((r) => r.json()),
        fetch("/dicts/cmudict.min.json", { signal: options.signal })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ]);

      this.DICT_V2 = dict;
      this.RULES_V2 = rules;
      this.CMU_DICT = cmuDict;

      // 3. Store in cache for next time
      try {
        localStorage.setItem(CACHE_KEYS.dict, JSON.stringify(dict));
        localStorage.setItem(CACHE_KEYS.rules, JSON.stringify(rules));
        localStorage.setItem(CACHE_KEYS.version, DICT_CACHE_VERSION);
      } catch (e) {
        console.warn("PhonemeEngine: Could not save dictionaries to localStorage.", e);
        // Clear potential partial cache to avoid issues
        Object.values(CACHE_KEYS).forEach((key) => safeRemoveItem(key));
      }

      console.log(`ST-XPD v2 Active: ${dict.vowel_families.length} Families.`);
      return { mode: "full", familiesCount: dict.vowel_families.length };
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return { mode: "demo", familiesCount: 0 };
      }
      console.warn("PhonemeEngine: Using demo mode (dictionary files not found)");
      return { mode: "demo", familiesCount: 14 };
    }
  },

  analyzeWord(word: string): PhonemeAnalysis | null {
    const upper = normalizeToken(word);
    if (!upper) return null;

    // Check cache first
    if (this.WORD_CACHE.has(upper)) {
      return this.WORD_CACHE.get(upper);
    }

    // Prefer CMUdict if available
    if (this.CMU_DICT?.[upper]) {
      const entry = this.CMU_DICT[upper];
      const vowelFamily = entry.vf?.[entry.vf.length - 1] || "UH";
      const coda = entry.cd?.length ? entry.cd.join("") : null;
      const result: PhonemeAnalysis = {
        vowelFamily,
        phonemes: entry.ph,
        coda,
        rhymeKey: makeRhymeKey(vowelFamily, coda),
      };
      setWordCache(this.WORD_CACHE, upper, result);
      return result;
    }

    // If dictionary is loaded, try to look up
    if (this.DICT_V2?.words?.[upper]) {
      const entry = this.DICT_V2.words[upper];
      const result: PhonemeAnalysis = {
        vowelFamily: entry.vowelFamily,
        phonemes: entry.phonemes,
        coda: entry.coda ?? null,
        rhymeKey: makeRhymeKey(entry.vowelFamily, entry.coda ?? null),
      };
      setWordCache(this.WORD_CACHE, upper, result);
      return result;
    }

    // Fallback: simple vowel-based analysis for demo
    const vowelMatch = upper.match(/[AEIOU]+/g);
    if (!vowelMatch) {
      return {
        vowelFamily: "UH",
        phonemes: upper.split(""),
        coda: null,
        rhymeKey: makeRhymeKey("UH", null),
      };
    }

    const dominantVowel = vowelMatch[vowelMatch.length - 1];
    const vowelFamily = this.guessVowelFamily(dominantVowel);
    const coda = this.extractCoda(upper);

    const result: PhonemeAnalysis = {
      vowelFamily,
      phonemes: this.splitToPhonemes(upper),
      coda,
      rhymeKey: makeRhymeKey(vowelFamily, coda),
    };

    setWordCache(this.WORD_CACHE, upper, result);
    return result;
  },

  guessVowelFamily(vowel: string) {
    // Simplified mapping based on common patterns
    const map = {
      A: "A",
      E: "EH",
      I: "IH",
      O: "OH",
      U: "UH",
      AI: "AY",
      AY: "AY",
      EE: "IY",
      EA: "IY",
      OO: "UW",
      OU: "AW",
      OW: "OW",
      OI: "OY",
      OY: "OY",
    };
    return map[vowel] || map[vowel[0]] || "UH";
  },

  extractCoda(word: string) {
    const match = word.match(/[^AEIOU]+$/);
    return match ? match[0] : null;
  },

  splitToPhonemes(word: string) {
    // Very simplified - production needs CMU dictionary
    const phonemes = [];
    let i = 0;
    while (i < word.length) {
      const char = word[i];
      if (/[AEIOU]/.test(char)) {
        // Check for digraphs
        const next = word[i + 1];
        if (next && /[AEIOU]/.test(next)) {
          phonemes.push(char + next);
          i += 2;
        } else {
          phonemes.push(char);
          i++;
        }
      } else if (/[A-Z]/.test(char)) {
        phonemes.push(char);
        i++;
      } else {
        i++;
      }
    }
    return phonemes;
  },

  checkCodaMutation(codaA: string, codaB: string) {
    if (!this.DICT_V2?.consonant_groups?.coda_groups) return false;
    const groups = this.DICT_V2.consonant_groups.coda_groups;
    for (let group in groups) {
      if (groups[group].includes(codaA) && groups[group].includes(codaB)) {
        return true;
      }
    }
    return false;
  },
};

function normalizeToken(word: string) {
  return String(word || "")
    .replace(/[’‘]/g, "'")
    .replace(/[^A-Za-z']/g, "")
    .toUpperCase();
}

function makeRhymeKey(vowelFamily: string, coda: string | null) {
  return `${vowelFamily}-${coda || "open"}`;
}

function setWordCache(cache: Map<string, PhonemeAnalysis>, key: string, value: PhonemeAnalysis) {
  cache.set(key, value);
  if (cache.size <= MAX_WORD_CACHE) return;
  const oldestKey = cache.keys().next().value;
  if (oldestKey) cache.delete(oldestKey);
}
