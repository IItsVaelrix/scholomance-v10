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

export const PhonemeEngine = {
  DICT_V2: null as PhonemeDict | null,
  RULES_V2: null as Record<string, unknown> | null,
  WORD_CACHE: new Map<string, PhonemeAnalysis>(),

  async init(options: { signal?: AbortSignal } = {}) {
    try {
      const [dict, rules] = await Promise.all([
        fetch("/phoneme_dictionary_v2.json", { signal: options.signal }).then((r) => r.json()),
        fetch("/rhyme_matching_rules_v2.json", { signal: options.signal }).then((r) => r.json()),
      ]);

      this.DICT_V2 = dict;
      this.RULES_V2 = rules;

      console.log(`ST-XPD v2 Active: ${dict.vowel_families.length} Families.`);
      return dict.vowel_families.length;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return 0;
      }
      console.warn("PhonemeEngine: Using demo mode (dictionary files not found)");
      // Return a fallback for demo mode
      return 14;
    }
  },

  analyzeWord(word: string): PhonemeAnalysis | null {
    const upper = String(word || "").toUpperCase();
    if (!upper) return null;

    // Check cache first
    if (this.WORD_CACHE.has(upper)) {
      return this.WORD_CACHE.get(upper);
    }

    // If dictionary is loaded, try to look up
    if (this.DICT_V2?.words?.[upper]) {
      const entry = this.DICT_V2.words[upper];
      const result: PhonemeAnalysis = {
        vowelFamily: entry.vowelFamily,
        phonemes: entry.phonemes,
        coda: entry.coda ?? null,
        rhymeKey: `${entry.vowelFamily}-${entry.coda || "open"}`,
      };
      this.WORD_CACHE.set(upper, result);
      return result;
    }

    // Fallback: simple vowel-based analysis for demo
    const vowelMatch = upper.match(/[AEIOU]+/g);
    if (!vowelMatch) {
      return {
        vowelFamily: "UH",
        phonemes: upper.split(""),
        coda: null,
        rhymeKey: "UH-open",
      };
    }

    const dominantVowel = vowelMatch[vowelMatch.length - 1];
    const vowelFamily = this.guessVowelFamily(dominantVowel);
    const coda = this.extractCoda(upper);

    const result: PhonemeAnalysis = {
      vowelFamily,
      phonemes: this.splitToPhonemes(upper),
      coda,
      rhymeKey: `${vowelFamily}-${coda || "open"}`,
    };

    this.WORD_CACHE.set(upper, result);
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
    return map[vowel] || map[vowel[0]] || "A";
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
          phonemes.push(char + next + "1");
          i += 2;
        } else {
          phonemes.push(char + "1");
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
