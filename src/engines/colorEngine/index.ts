import { tokenizeText, normalizeToken, type Token } from "./tokenizer";
import { buildFastResult, blendSchoolColor, SCHOOL_COLORS, VOWEL_TO_SCHOOL } from "./fastPass";
import { defaultEnrichmentProvider } from "./enrichment";
import { buildResultSignature, mergeEnrichment } from "./merge";
import { getCacheKey, getEnrichedRecord, type EnrichmentRecord } from "./cache";
import { isDictionaryApiEnabled } from "../../lib/dictionaryApi.js";
import { STATE_CLASS_MAP } from "../../js/stateClasses.js";

export type School = "VOID" | "PSYCHIC" | "ALCHEMY" | "WILL" | "SONIC";

export type Feel =
  | "Unknown"
  | "Neutral"
  | "Joy"
  | "Sorrow"
  | "Rage"
  | "Fear"
  | "Awe"
  | "Desire";

export type PhonemeAnalysis = {
  vowelFamily: string;
  phonemes: string[];
  coda: string | null;
  rhymeKey: string;
};

export type PhonemeEngineLike = {
  analyzeWord?: (word: string) => PhonemeAnalysis | null;
  CMU_DICT?: Record<string, unknown> | null;
  DICT_V2?: {
    words?: Record<string, unknown>;
    consonant_groups?: {
      coda_groups?: Record<string, string[]>;
    };
  } | null;
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

export type EnrichmentPatch = {
  chips?: Chip[];
  evidence?: Evidence[];
  confidenceBoost?: number;
  enriched?: boolean;
  isValid?: boolean;
};

export type EnrichmentProvider = (
  token: string,
  options?: { signal?: AbortSignal }
) => Promise<EnrichmentPatch | null>;

export type ColorEngine = {
  version: string;
  decorateText: (text: string) => { tokens: Token[]; decorations: Decoration[] };
  getTokenResult: (token: string) => SyntacticResult;
  requestEnrichment: (token: string) => Promise<void>;
};

export type ColorEngineOptions = {
  phonemeEngine?: PhonemeEngineLike | null;
  onEnriched?: () => void;
  enrichmentProvider?: EnrichmentProvider;
  isEnrichmentEnabled?: () => boolean;
  concurrency?: number;
  enrichmentDelayMs?: number;
};

export type ColorEngineInternal = ColorEngine & {
  setPhonemeEngine: (engine: PhonemeEngineLike | null) => void;
  dispose: () => void;
};

export const ENGINE_VERSION = "color-engine@1";

export const COLOR_SCHEMA = {
  classes: {
    school: STATE_CLASS_MAP.school,
    vowelFamily: STATE_CLASS_MAP.vowelFamily,
    feel: {
      Unknown: "feel-unknown",
      Neutral: "feel-neutral",
      Joy: "feel-joy",
      Sorrow: "feel-sorrow",
      Rage: "feel-rage",
      Fear: "feel-fear",
      Awe: "feel-awe",
      Desire: "feel-desire",
    },
  },
  cssVariables: {
    schools: {
      VOID: "--void",
      PSYCHIC: "--psychic",
      ALCHEMY: "--alchemy",
      WILL: "--will",
      SONIC: "--sonic",
    },
    vowels: {
      A: "--vowel-A",
      AE: "--vowel-AE",
      AO: "--vowel-AO",
      AW: "--vowel-AW",
      AY: "--vowel-AY",
      EH: "--vowel-EH",
      ER: "--vowel-ER",
      EY: "--vowel-EY",
      IH: "--vowel-IH",
      IY: "--vowel-IY",
      OH: "--vowel-OH",
      OW: "--vowel-OW",
      OY: "--vowel-OY",
      UH: "--vowel-UH",
      UW: "--vowel-UW",
    },
    feels: {
      Unknown: "--feel-neutral",
      Neutral: "--feel-neutral",
      Joy: "--feel-joy",
      Sorrow: "--feel-sorrow",
      Rage: "--feel-rage",
      Fear: "--feel-fear",
      Awe: "--feel-awe",
      Desire: "--feel-desire",
    },
  },
} as const;

export type DesignToken = { cssVar: string; rgb: [number, number, number] };

export const DESIGN_TOKENS: {
  schools: Record<School, DesignToken>;
  feels: Record<Feel, DesignToken>;
  vowels: Record<string, DesignToken>;
} = {
  schools: {
    VOID: { cssVar: "--void", rgb: SCHOOL_COLORS.VOID },
    PSYCHIC: { cssVar: "--psychic", rgb: SCHOOL_COLORS.PSYCHIC },
    ALCHEMY: { cssVar: "--alchemy", rgb: SCHOOL_COLORS.ALCHEMY },
    WILL: { cssVar: "--will", rgb: SCHOOL_COLORS.WILL },
    SONIC: { cssVar: "--sonic", rgb: SCHOOL_COLORS.SONIC },
  },
  feels: {
    Unknown: { cssVar: "--feel-neutral", rgb: [154, 160, 166] },
    Neutral: { cssVar: "--feel-neutral", rgb: [154, 160, 166] },
    Joy: { cssVar: "--feel-joy", rgb: [255, 209, 102] },
    Sorrow: { cssVar: "--feel-sorrow", rgb: [91, 124, 250] },
    Rage: { cssVar: "--feel-rage", rgb: [255, 93, 93] },
    Fear: { cssVar: "--feel-fear", rgb: [111, 207, 151] },
    Awe: { cssVar: "--feel-awe", rgb: [90, 208, 194] },
    Desire: { cssVar: "--feel-desire", rgb: [255, 111, 177] },
  },
  vowels: {
    A: { cssVar: "--vowel-A", rgb: [255, 23, 68] },
    AE: { cssVar: "--vowel-AE", rgb: [255, 138, 0] },
    AO: { cssVar: "--vowel-AO", rgb: [101, 31, 255] },
    AW: { cssVar: "--vowel-AW", rgb: [0, 230, 118] },
    AY: { cssVar: "--vowel-AY", rgb: [0, 229, 255] },
    EH: { cssVar: "--vowel-EH", rgb: [0, 176, 255] },
    ER: { cssVar: "--vowel-ER", rgb: [118, 255, 3] },
    EY: { cssVar: "--vowel-EY", rgb: [213, 0, 249] },
    IH: { cssVar: "--vowel-IH", rgb: [41, 121, 255] },
    IY: { cssVar: "--vowel-IY", rgb: [24, 255, 255] },
    OH: { cssVar: "--vowel-OH", rgb: [255, 87, 34] },
    OW: { cssVar: "--vowel-OW", rgb: [245, 0, 87] },
    OY: { cssVar: "--vowel-OY", rgb: [255, 109, 0] },
    UH: { cssVar: "--vowel-UH", rgb: [0, 200, 83] },
    UW: { cssVar: "--vowel-UW", rgb: [100, 255, 218] },
  },
};

export { blendSchoolColor, VOWEL_TO_SCHOOL };
export { type Token } from "./tokenizer";

export const getEvidenceValue = (result: SyntacticResult | null, type: Evidence["type"]) => {
  if (!result) return null;
  return result.evidence.find((item) => item.type === type)?.value || null;
};

export const createColorEngine = (options: ColorEngineOptions = {}): ColorEngineInternal => {
  let phonemeEngine = options.phonemeEngine || null;
  const fastCache = new Map<string, SyntacticResult>();
  const enrichedCache = new Map<string, EnrichmentRecord>();
  const inFlight = new Map<string, Promise<void>>();
  const queue: Array<{ token: string; resolve: () => void }> = [];
  let activeRequests = 0;
  let notifyTimer: ReturnType<typeof setTimeout> | null = null;
  let pumpTimer: ReturnType<typeof setTimeout> | null = null;
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

  const getKey = (token: string) => getCacheKey(ENGINE_VERSION, token);

  const getFastResult = (token: string) => {
    const key = getKey(token);
    const cached = fastCache.get(key);
    if (cached) return cached;
    const result = buildFastResult(token, phonemeEngine, ENGINE_VERSION);
    fastCache.set(key, result);
    return result;
  };

  const getTokenResult = (rawToken: string) => {
    const token = normalizeToken(rawToken) || "";
    const key = getKey(token);
    const record = getEnrichedRecord(enrichedCache, key);
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
    const existing = getEnrichedRecord(enrichedCache, getKey(token));
    if (!existing || existing.signature !== nextSignature) {
      enrichedCache.set(getKey(token), {
        result: merged,
        updatedAt: Date.now(),
        signature: nextSignature,
        isValid,
      });
      notify();
    }
  };

  const pump = () => {
    if (disposed) return;
    while (activeRequests < concurrency && queue.length) {
      const entry = queue.shift();
      if (!entry) break;
      activeRequests += 1;
      runEnrichment(entry.token)
        .catch(() => {})
        .finally(() => {
          activeRequests -= 1;
          inFlight.delete(entry.token);
          entry.resolve();
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
    if (!token || !isEnrichmentEnabled() || disposed) return Promise.resolve();
    const cached = getEnrichedRecord(enrichedCache, getKey(token));
    if (cached) return Promise.resolve();
    const existing = inFlight.get(token);
    if (existing) return existing;

    const promise = new Promise<void>((resolve) => {
      queue.push({ token, resolve });
      schedulePump();
    });
    inFlight.set(token, promise);
    return promise;
  };

  const decorateText = (text: string) => {
    try {
      const tokens = tokenizeText(text);
      const decorations = tokens.map((token) => {
        const result = getTokenResult(token.normalized);
        void requestEnrichment(token.normalized);
        return {
          start: token.start,
          end: token.end,
          result,
        };
      });
      return { tokens, decorations };
    } catch {
      return { tokens: [], decorations: [] };
    }
  };

  const setPhonemeEngine = (next: PhonemeEngineLike | null) => {
    if (phonemeEngine === next) return;
    phonemeEngine = next;
    fastCache.clear();
    enrichedCache.clear();
    inFlight.clear();
    queue.length = 0;
  };

  const dispose = () => {
    disposed = true;
    fastCache.clear();
    enrichedCache.clear();
    inFlight.clear();
    queue.length = 0;
    if (notifyTimer) clearTimeout(notifyTimer);
    if (pumpTimer) clearTimeout(pumpTimer);
  };

  return {
    version: ENGINE_VERSION,
    decorateText,
    getTokenResult,
    requestEnrichment,
    setPhonemeEngine,
    dispose,
  };
};
