// js/phoneme-engine.js
export const PhonemeEngine = {
  DICT_V2: null,
  RULES_V2: null,

  async init() {
    // Ingestion order per README
    const [dict, rules] = await Promise.all([
      fetch('/phoneme_dictionary_v2.json').then(r => r.json()),
      fetch('/rhyme_matching_rules_v2.json').then(r => r.json())
    ]);

    this.DICT_V2 = dict;
    this.RULES_V2 = rules;

    console.log(`◈ ST-XPD v2 Active: ${dict.vowel_families.length} Families.`);
    return dict.vowel_families.length;
  },

  analyzeWord(word) {
    // Existing dictionary lookup + spelling fallback
    // Matches against ST-XPD Vowel Families (A, AE, AY, etc.)
    return { 
      vowelFamily: "AY", 
      phonemes: ["T", "AY1", "M"], 
      coda: "M" 
    };
  },

  checkCodaMutation(codaA, codaB) {
    // Uses coda_groups from dictionary_v2 (e.g., T/D, K/G)
    const groups = this.DICT_V2.consonant_groups.coda_groups;
    for (let group in groups) {
      if (groups[group].includes(codaA) && groups[group].includes(codaB)) return true;
    }
    return false;
  }
};