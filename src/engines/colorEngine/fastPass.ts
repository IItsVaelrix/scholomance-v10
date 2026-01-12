import { getStateClass } from "../../js/stateClasses.js";
import type {
  Evidence,
  Feel,
  PhonemeAnalysis,
  PhonemeEngineLike,
  School,
  SyntacticResult,
} from "./index";

export const VOWEL_TO_SCHOOL: Record<string, School> = {
  A: "WILL",
  AA: "WILL",
  AH: "WILL",
  AE: "PSYCHIC",
  AO: "ALCHEMY",
  AW: "WILL",
  AY: "PSYCHIC",
  EH: "SONIC",
  ER: "VOID",
  EY: "SONIC",
  IH: "SONIC",
  IY: "SONIC",
  OH: "ALCHEMY",
  OW: "ALCHEMY",
  OY: "PSYCHIC",
  UH: "VOID",
  UW: "VOID",
};

export const SCHOOL_COLORS: Record<School, [number, number, number]> = {
  VOID: [161, 161, 170],
  PSYCHIC: [0, 229, 255],
  ALCHEMY: [213, 0, 249],
  WILL: [255, 138, 0],
  SONIC: [101, 31, 255],
};

export const blendSchoolColor = (scores: Record<School, number>): [number, number, number] => {
  let total = 0;
  let r = 0;
  let g = 0;
  let b = 0;
  Object.entries(scores || {}).forEach(([school, weight]) => {
    const color = SCHOOL_COLORS[school as School];
    if (!color || !weight) return;
    total += weight;
    r += color[0] * weight;
    g += color[1] * weight;
    b += color[2] * weight;
  });
  if (!total) return SCHOOL_COLORS.VOID;
  return [Math.round(r / total), Math.round(g / total), Math.round(b / total)];
};

const FEEL_CLASS_MAP: Record<Feel, string> = {
  Unknown: "",
  Neutral: "feel-neutral",
  Joy: "feel-joy",
  Sorrow: "feel-sorrow",
  Rage: "feel-rage",
  Fear: "feel-fear",
  Awe: "feel-awe",
  Desire: "feel-desire",
};

const FEEL_CHIP_CLASS_MAP: Record<Feel, string> = {
  Unknown: "feel-unknown",
  Neutral: "feel-neutral",
  Joy: "feel-joy",
  Sorrow: "feel-sorrow",
  Rage: "feel-rage",
  Fear: "feel-fear",
  Awe: "feel-awe",
  Desire: "feel-desire",
};

const FAST_FEEL_LEXICON: Record<Feel, string[]> = {
  Unknown: [],
  Neutral: [],
  Joy: ["JOY", "DELIGHT", "LOVE", "HAPPY", "GLAD", "BRIGHT"],
  Sorrow: ["SAD", "SORROW", "GRIEF", "MOURN", "TEAR", "WEEP"],
  Rage: ["RAGE", "FURY", "ANGER", "WRATH", "HATE", "BLOOD"],
  Fear: ["FEAR", "DREAD", "PANIC", "TERROR", "SHADE", "CHILL"],
  Awe: ["AWE", "WONDER", "MAJESTY", "VISION", "EPIC", "RELIC"],
  Desire: ["DESIRE", "CRAVE", "HUNGER", "YEARN", "BURN", "LONG"],
};

const FAST_FEEL_LOOKUP = new Map<string, Feel>();
Object.entries(FAST_FEEL_LEXICON).forEach(([feel, words]) => {
  words.forEach((word) => FAST_FEEL_LOOKUP.set(word, feel as Feel));
});

const RUNE_LABELS: Record<string, string> = {
  A: "Ash",
  AE: "Aether",
  AO: "Omen",
  AW: "Wyrd",
  AY: "Aegis",
  EH: "Echo",
  ER: "Elder",
  EY: "Eidolon",
  IH: "Ichor",
  IY: "Eon",
  OH: "Oath",
  OW: "Owl",
  OY: "Oracle",
  UH: "Umbral",
  UW: "Umber",
};

const VOWEL_FAMILY_GUESS_MAP: Record<string, string> = {
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

const getFastFeel = (token: string): Feel => FAST_FEEL_LOOKUP.get(token) || "Unknown";

const getRuneLabel = (vowelFamily?: string | null) => {
  if (!vowelFamily) return "Rune";
  return `${RUNE_LABELS[vowelFamily] || vowelFamily} Rune`;
};

const guessVowelFamily = (vowel: string) =>
  VOWEL_FAMILY_GUESS_MAP[vowel] || VOWEL_FAMILY_GUESS_MAP[vowel[0]] || "UH";

const extractCoda = (word: string) => {
  const match = word.match(/[^AEIOU]+$/);
  return match ? match[0] : null;
};

const splitToPhonemes = (word: string) => {
  const phonemes = [] as string[];
  let i = 0;
  while (i < word.length) {
    const char = word[i];
    if (/[AEIOU]/.test(char)) {
      const next = word[i + 1];
      if (next && /[AEIOU]/.test(next)) {
        phonemes.push(char + next);
        i += 2;
      } else {
        phonemes.push(char);
        i += 1;
      }
    } else if (/[A-Z]/.test(char)) {
      phonemes.push(char);
      i += 1;
    } else {
      i += 1;
    }
  }
  return phonemes;
};

const makeRhymeKey = (vowelFamily: string, coda: string | null) =>
  `${vowelFamily}-${coda || "open"}`;

const fallbackAnalyze = (token: string): PhonemeAnalysis => {
  const upper = token.toUpperCase();
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
  const vowelFamily = guessVowelFamily(dominantVowel);
  const coda = extractCoda(upper);
  return {
    vowelFamily,
    phonemes: splitToPhonemes(upper),
    coda,
    rhymeKey: makeRhymeKey(vowelFamily, coda),
  };
};

export const analyzeToken = (token: string, phonemeEngine: PhonemeEngineLike | null) => {
  const upper = token.toUpperCase();
  const analyzed = phonemeEngine?.analyzeWord?.(upper);
  return analyzed || fallbackAnalyze(upper);
};

export const isTokenInDict = (token: string, phonemeEngine: PhonemeEngineLike | null) =>
  Boolean(phonemeEngine?.CMU_DICT?.[token] || phonemeEngine?.DICT_V2?.words?.[token]);

const getCodaGroups = (coda: string | null, phonemeEngine: PhonemeEngineLike | null) => {
  if (!coda) return [];
  const groups = phonemeEngine?.DICT_V2?.consonant_groups?.coda_groups;
  if (!groups) return [];
  return Object.entries(groups)
    .filter(([, members]) => members.includes(coda))
    .map(([group]) => group);
};

export const buildFastResult = (
  token: string,
  phonemeEngine: PhonemeEngineLike | null,
  engineVersion: string
): SyntacticResult => {
  const analysis = analyzeToken(token, phonemeEngine);
  const vowelFamily = analysis?.vowelFamily || "UH";
  const runeClass = getStateClass("vowelFamily", vowelFamily) || getStateClass("vowelFamily", "UH");
  const school = VOWEL_TO_SCHOOL[vowelFamily] || "VOID";
  const schoolClass = getStateClass("school", school);
  const inDict = analysis ? isTokenInDict(token, phonemeEngine) : false;
  const baseConfidence = analysis ? (inDict ? 0.86 : 0.62) : 0.28;
  const feel = getFastFeel(token);
  const feelClass = FEEL_CLASS_MAP[feel];
  const feelConfidence = feel === "Unknown" ? 0.2 : 0.6;
  const codaGroups = analysis?.coda ? getCodaGroups(analysis.coda, phonemeEngine) : [];

  const evidence: Evidence[] = [];
  if (analysis?.phonemes?.length) {
    evidence.push({
      type: "phoneme",
      value: analysis.phonemes.join(" "),
      source: "fast",
    });
  }
  if (analysis?.rhymeKey) {
    evidence.push({
      type: "rhyme",
      value: analysis.rhymeKey,
      source: "fast",
    });
  }
  if (analysis?.coda) {
    evidence.push({
      type: "phoneme",
      value: `coda:${analysis.coda}`,
      source: "fast",
    });
  }
  evidence.push({
    type: "usage",
    value: `vowel:${vowelFamily}`,
    source: "fast",
  });
  codaGroups.forEach((group) => {
    evidence.push({
      type: "usage",
      value: `coda-group:${group}`,
      source: "fast",
    });
  });

  return {
    version: engineVersion,
    token,
    classes: ["editor-word"],
    channels: {
      text: { source: "rune", className: runeClass },
      accent: { source: "feel", className: feelClass },
      border: { source: "feel", className: feelClass },
      glow: { source: "feel", className: feelClass },
    },
    chips: [
      {
        type: "school",
        label: school,
        className: schoolClass,
        confidence: baseConfidence,
        source: "fast",
      },
      {
        type: "rune",
        label: getRuneLabel(vowelFamily),
        className: runeClass,
        confidence: baseConfidence,
        source: "fast",
      },
      {
        type: "feel",
        label: feel,
        className: FEEL_CHIP_CLASS_MAP[feel],
        confidence: feelConfidence,
        source: "fast",
      },
    ],
    evidence,
    confidence: baseConfidence,
    enriched: false,
  };
};
