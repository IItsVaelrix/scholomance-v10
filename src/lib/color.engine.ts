import { getStateClass } from "../js/stateClasses.js";
import {
  fetchDictionaryEntry,
  getCachedDictionaryEntry,
  isDictionaryApiEnabled,
} from "./dictionaryApi.js";

// Color Engine for Scholomance
// Maps phoneme analysis + local feel heuristics to stable styling channels.

export type School = "VOID" | "PSYCHIC" | "ALCHEMY" | "WILL" | "SONIC";

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

export function blendSchoolColor(scores: Record<School, number>): [number, number, number] {
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
}

export type Feel =
  | "Unknown"
  | "Neutral"
  | "Joy"
  | "Sorrow"
  | "Rage"
  | "Fear"
  | "Awe"
  | "Desire";

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

const ENGINE_VERSION = "color-engine@1";
const ENRICHMENT_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const ENRICHMENT_NEGATIVE_TTL_MS = 1000 * 60 * 60 * 24;

type PhonemeAnalysis = {
  vowelFamily: string;
  phonemes: string[];
  coda: string | null;
  rhymeKey: string;
};

export type PhonemeEngineLike = {
  analyzeWord?: (word: string) => PhonemeAnalysis | null;
  CMU_DICT?: Record<string, unknown> | null;
  DICT_V2?: { words?: Record<string, unknown> } | null;
};

export type ChannelSource = "school" | "rune" | "feel";
export type ChipSource = "fast" | "enriched";
export type EvidenceSource = "fast" | "enriched";

export type Channel = {
  source: ChannelSource;
  className: string;
};

export type Chip = {
  type: "school" | "rune" | "feel";
  label: string;
  className: string;
  confidence: number;
  source: ChipSource;
};

export type Evidence = {
  type: "phoneme" | "rhyme" | "usage" | "definition";
  value: string;
  source: EvidenceSource;
};

export type SyntacticResult = {
  version: string;
  token: string;
  classes: string[];
  channels: {
    text: Channel;
    accent: Channel;
    border: Channel;
    glow: Channel;
  };
  chips: Chip[];
  evidence: Evidence[];
  confidence: number;
  enriched: boolean;
};

export type Decoration = {
  start: number;
  end: number;
  result: SyntacticResult;
};

type EnrichmentPatch = {
  chips?: Chip[];
  evidence?: Evidence[];
  confidenceBoost?: number;
  enriched?: boolean;
  isValid?: boolean;
};

type EnrichmentRecord = {
  result: SyntacticResult;
  updatedAt: number;
  signature: string;
  isValid: boolean;
};

type EnrichmentProvider = (token: string, options?: { signal?: AbortSignal }) => Promise<EnrichmentPatch | null>;

type SyntacticEngineOptions = {
  phonemeEngine?: PhonemeEngineLike | null;
  onEnriched?: () => void;
  enrichmentProvider?: EnrichmentProvider;
  isEnrichmentEnabled?: () => boolean;
  concurrency?: number;
  enrichmentDelayMs?: number;
};

const normalizeToken = (word: string) =>
  String(word || "")
    .replace(/[’‘]/g, "'")
    .replace(/[^A-Za-z']/g, "")
    .toUpperCase();

const getFastFeel = (token: string): Feel => FAST_FEEL_LOOKUP.get(token) || "Unknown";

const getRuneLabel = (vowelFamily?: string | null) => {
  if (!vowelFamily) return "Rune";
  return `${RUNE_LABELS[vowelFamily] || vowelFamily} Rune`;
};

const buildResultSignature = (result: SyntacticResult) => {
  const chips = result.chips
    .map((chip) => `${chip.type}:${chip.label}:${chip.confidence}:${chip.source}:${chip.className}`)
    .join("|");
  const evidence = result.evidence
    .map((item) => `${item.type}:${item.value}:${item.source}`)
    .join("|");
  return `${result.enriched}-${result.confidence}-${chips}-${evidence}`;
};

const mergeEnrichment = (base: SyntacticResult, patch: EnrichmentPatch): SyntacticResult => {
  if (!patch) return base;
  const chips = [...base.chips];
  const evidence = [...base.evidence];

  patch.chips?.forEach((chip) => {
    const exists = chips.some(
      (existing) =>
        existing.type === chip.type &&
        existing.label === chip.label &&
        existing.source === chip.source
    );
    if (!exists) chips.push(chip);
  });

  patch.evidence?.forEach((item) => {
    const exists = evidence.some(
      (existing) =>
        existing.type === item.type &&
        existing.value === item.value &&
        existing.source === item.source
    );
    if (!exists) evidence.push(item);
  });

  const nextConfidence = Math.min(
    1,
    Math.max(base.confidence, base.confidence + (patch.confidenceBoost || 0))
  );

  return {
    ...base,
    chips,
    evidence,
    confidence: nextConfidence,
    enriched: patch.enriched || base.enriched,
  };
};

const buildEnrichmentPatch = (token: string) => {
  const cached = getCachedDictionaryEntry(token, { maxAgeMs: ENRICHMENT_TTL_MS });
  if (cached?.definitions?.length) {
    return {
      evidence: cached.definitions.slice(0, 2).map((definition) => ({
        type: "definition" as const,
        value: definition,
        source: "enriched" as const,
      })),
      confidenceBoost: 0.12,
      enriched: true,
      isValid: true,
    };
  }
  return null;
};

const defaultEnrichmentProvider: EnrichmentProvider = async (token, options = {}) => {
  if (!isDictionaryApiEnabled()) return null;
  const cached = buildEnrichmentPatch(token);
  if (cached) return cached;
  const entry = await fetchDictionaryEntry(token, {
    signal: options.signal,
    maxAgeMs: ENRICHMENT_TTL_MS,
    force: true,
  });
  if (!entry?.definitions?.length) {
    return { isValid: false };
  }
  return {
    evidence: entry.definitions.slice(0, 2).map((definition) => ({
      type: "definition",
      value: definition,
      source: "enriched",
    })),
    confidenceBoost: entry.isValid ? 0.12 : 0,
    enriched: entry.isValid,
    isValid: entry.isValid,
  };
};

export const getEvidenceValue = (result: SyntacticResult | null, type: Evidence["type"]) => {
  if (!result) return null;
  return result.evidence.find((item) => item.type === type)?.value || null;
};

export const createSyntacticEngine = (options: SyntacticEngineOptions = {}) => {
  let phonemeEngine = options.phonemeEngine || null;
  const fastCache = new Map<string, SyntacticResult>();
  const enrichedCache = new Map<string, EnrichmentRecord>();
  const inFlight = new Map<string, Promise<SyntacticResult | null>>();
  const pending = new Set<string>();
  const queue: Array<{ token: string; resolve: (result: SyntacticResult | null) => void }> = [];
  let activeRequests = 0;
  let notifyTimer = null as ReturnType<typeof setTimeout> | null;
  let pumpTimer = null as ReturnType<typeof setTimeout> | null;
  let disposed = false;

  const isEnrichmentEnabled = options.isEnrichmentEnabled || isDictionaryApiEnabled;
  const enrichmentProvider = options.enrichmentProvider || defaultEnrichmentProvider;
  const concurrency = options.concurrency ?? 3;
  const enrichmentDelayMs = options.enrichmentDelayMs ?? 120;

  const notify = () => {
    if (notifyTimer || disposed) return;
    notifyTimer = setTimeout(() => {
      notifyTimer = null;
      options.onEnriched?.();
    }, 0);
  };

  const getCacheKey = (token: string) => `${ENGINE_VERSION}::${token}`;

  const isInDict = (token: string) =>
    Boolean(phonemeEngine?.CMU_DICT?.[token] || phonemeEngine?.DICT_V2?.words?.[token]);

  const getFastResult = (token: string): SyntacticResult => {
    const key = getCacheKey(token);
    const cached = fastCache.get(key);
    if (cached) return cached;

    const analysis = phonemeEngine?.analyzeWord?.(token) || null;
    const vowelFamily = analysis?.vowelFamily || "";
    const runeClass = vowelFamily ? getStateClass("vowelFamily", vowelFamily) : "";
    const school = vowelFamily ? VOWEL_TO_SCHOOL[vowelFamily] || "VOID" : "VOID";
    const schoolClass = getStateClass("school", school);
    const inDict = Boolean(analysis && isInDict(token));
    const baseConfidence = analysis ? (inDict ? 0.86 : 0.62) : 0.28;
    const feel = getFastFeel(token);
    const feelClass = FEEL_CLASS_MAP[feel];
    const feelConfidence = feel === "Unknown" ? 0.2 : 0.6;

    const result: SyntacticResult = {
      version: ENGINE_VERSION,
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
      evidence: [
        ...(analysis?.phonemes?.length
          ? [
              {
                type: "phoneme" as const,
                value: analysis.phonemes.join(" "),
                source: "fast" as const,
              },
            ]
          : []),
        ...(analysis?.rhymeKey
          ? [
              {
                type: "rhyme" as const,
                value: analysis.rhymeKey,
                source: "fast" as const,
              },
            ]
          : []),
        ...(analysis?.coda
          ? [
              {
                type: "phoneme" as const,
                value: `coda:${analysis.coda}`,
                source: "fast" as const,
              },
            ]
          : []),
      ],
      confidence: baseConfidence,
      enriched: false,
    };

    fastCache.set(key, result);
    return result;
  };

  const getEnrichedRecord = (token: string) => {
    const key = getCacheKey(token);
    const record = enrichedCache.get(key);
    if (!record) return null;
    const ttl = record.isValid ? ENRICHMENT_TTL_MS : ENRICHMENT_NEGATIVE_TTL_MS;
    if (Date.now() - record.updatedAt > ttl) {
      enrichedCache.delete(key);
      return null;
    }
    return record;
  };

  const getResult = (token: string) => {
    const record = getEnrichedRecord(token);
    if (record) return record.result;
    return getFastResult(token);
  };

  const runEnrichment = async (token: string) => {
    const base = getFastResult(token);
    let patch: EnrichmentPatch | null = null;
    try {
      patch = await enrichmentProvider(token);
    } catch {
      patch = null;
    }
    const merged = patch ? mergeEnrichment(base, patch) : base;
    const isValid = patch?.isValid ?? Boolean(patch?.evidence?.length);
    const nextSignature = buildResultSignature(merged);
    const existing = getEnrichedRecord(token);
    if (!existing || existing.signature !== nextSignature) {
      enrichedCache.set(getCacheKey(token), {
        result: merged,
        updatedAt: Date.now(),
        signature: nextSignature,
        isValid,
      });
      notify();
    }
    return merged;
  };

  const pump = () => {
    if (disposed) return;
    while (activeRequests < concurrency && queue.length) {
      const entry = queue.shift();
      if (!entry) break;
      activeRequests += 1;
      pending.delete(entry.token);
      runEnrichment(entry.token)
        .then((result) => entry.resolve(result))
        .finally(() => {
          activeRequests -= 1;
          inFlight.delete(entry.token);
          if (queue.length) schedulePump();
        });
    }
  };

  const schedulePump = () => {
    if (pumpTimer || disposed) return;
    pumpTimer = setTimeout(() => {
      pumpTimer = null;
      pump();
    }, enrichmentDelayMs);
  };

  const requestEnrichment = (rawToken: string) => {
    const token = normalizeToken(rawToken);
    if (!token || !isEnrichmentEnabled()) return Promise.resolve(null);
    const cached = getEnrichedRecord(token);
    if (cached) return Promise.resolve(cached.result);
    const existing = inFlight.get(token);
    if (existing) return existing;

    const promise = new Promise<SyntacticResult | null>((resolve) => {
      if (!pending.has(token)) {
        pending.add(token);
        queue.push({ token, resolve });
        schedulePump();
      } else {
        resolve(null);
      }
    });
    inFlight.set(token, promise);
    return promise;
  };

  const decorate = (text: string) => {
    const decorations: Decoration[] = [];
    if (!text) return { decorations };
    const wordRegex = /[A-Za-z']+/g;
    let match = wordRegex.exec(text);
    while (match) {
      const raw = match[0];
      const token = normalizeToken(raw);
      if (token) {
        const result = getResult(token);
        decorations.push({
          start: match.index,
          end: match.index + raw.length,
          result,
        });
        requestEnrichment(token);
      }
      match = wordRegex.exec(text);
    }
    return { decorations };
  };

  const setPhonemeEngine = (next: PhonemeEngineLike | null) => {
    if (phonemeEngine === next) return;
    phonemeEngine = next;
    fastCache.clear();
    enrichedCache.clear();
    pending.clear();
    inFlight.clear();
    queue.length = 0;
  };

  const dispose = () => {
    disposed = true;
    fastCache.clear();
    enrichedCache.clear();
    pending.clear();
    inFlight.clear();
    queue.length = 0;
    if (notifyTimer) clearTimeout(notifyTimer);
    if (pumpTimer) clearTimeout(pumpTimer);
  };

  return {
    version: ENGINE_VERSION,
    getResult,
    getFastResult,
    requestEnrichment,
    decorate,
    setPhonemeEngine,
    dispose,
  };
};

// Placeholder for Merriam API integration
export async function getPsychologicalState(text: string): Promise<Record<string, number>> {
  console.log("getPsychologicalState called with:", text);
  return Promise.resolve({
    joy: 0.1,
    sadness: 0.2,
    anger: 0.7,
  });
}
