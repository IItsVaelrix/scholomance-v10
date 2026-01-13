
/**
 * Reference Engine
 * Integrates external APIs for Dictionary, Thesaurus, and Rhymes.
 * 
 * Sources:
 * - Rhymes: Datamuse API (Free, no key)
 * - Dictionary: Merriam-Webster Collegiate (Key required) OR Free Dictionary API (Fallback)
 * - Thesaurus: Merriam-Webster Collegiate (Key required) OR Datamuse (Fallback)
 */

export const ReferenceEngine = {
  
  getKeys() {
    return {
      dictKey: localStorage.getItem('mw_dict_key'),
      thesKey: localStorage.getItem('mw_thes_key')
    };
  },

  setKeys(dictKey, thesKey) {
    if (dictKey) localStorage.setItem('mw_dict_key', dictKey);
    if (thesKey) localStorage.setItem('mw_thes_key', thesKey);
  },

  async fetchAll(word) {
    const [rhymes, definition, synonyms] = await Promise.allSettled([
      this.getRhymes(word),
      this.getDefinition(word),
      this.getSynonyms(word)
    ]);

    return {
      rhymes: rhymes.status === 'fulfilled' ? rhymes.value : [],
      definition: definition.status === 'fulfilled' ? definition.value : null,
      synonyms: synonyms.status === 'fulfilled' ? synonyms.value : []
    };
  },

  async getRhymes(word) {
    try {
      // Datamuse is excellent for rhymes
      const res = await fetch(`https://api.datamuse.com/words?rel_rhy=${word}&max=20`);
      if (!res.ok) throw new Error('Rhyme fetch failed');
      const data = await res.json();
      return data.map(item => item.word);
    } catch (e) {
      console.warn("Rhyme fetch error:", e);
      return [];
    }
  },

  async getDefinition(word) {
    const { dictKey } = this.getKeys();
    
    if (dictKey) {
      // Merriam-Webster
      try {
        const res = await fetch(`3b69cc4c-e581-4a81-93d3-dab9fea39d1e/dictionary/en/${word}?key=${dictKey}`);
        if (!res.ok) throw new Error('MW Dictionary fetch failed');
        const data = await res.json();
        
        if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
          // Extract first short definition
          return {
            source: 'Merriam-Webster',
            text: data[0].shortdef?.[0] || 'No definition found',
            partOfSpeech: data[0].fl || ''
          };
        }
      } catch (e) {
        console.warn("MW Dictionary error:", e);
      }
    }

    // Fallback: Free Dictionary API
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
      if (!res.ok) throw new Error('Free Dict fetch failed');
      const data = await res.json();
      
      if (Array.isArray(data) && data.length > 0) {
        const firstMeaning = data[0].meanings?.[0];
        return {
          source: 'Free Dictionary API',
          text: firstMeaning?.definitions?.[0]?.definition || 'No definition found',
          partOfSpeech: firstMeaning?.partOfSpeech || ''
        };
      }
    } catch (e) {
      console.warn("Free Dict error:", e);
    }

    return null;
  },

  async getSynonyms(word) {
    const { thesKey } = this.getKeys();

    if (thesKey) {
      // Merriam-Webster Thesaurus
      try {
        const res = await fetch(`7b564568-9462-41a8-b6cf-60d54bc9e9bc/thesaurus/en/${word}?key=${thesKey}`);
        if (!res.ok) throw new Error('MW Thesaurus fetch failed');
        const data = await res.json();
        
        if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object') {
          return data[0].meta?.syns?.[0] || [];
        }
      } catch (e) {
        console.warn("MW Thesaurus error:", e);
      }
    }

    // Fallback: Datamuse
    try {
      const res = await fetch(`https://api.datamuse.com/words?rel_syn=${word}&max=10`);
      if (!res.ok) throw new Error('Datamuse Synonym fetch failed');
      const data = await res.json();
      return data.map(item => item.word);
    } catch (e) {
      console.warn("Datamuse Synonym error:", e);
      return [];
    }
  }
};
