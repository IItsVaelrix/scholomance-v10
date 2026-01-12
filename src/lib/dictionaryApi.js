const API_BASE = "https://www.dictionaryapi.com/api/v3/references/collegiate/json";
const API_KEY = import.meta.env.VITE_DICTIONARY_API_KEY;

const cache = new Map();

const isCacheFresh = (record, maxAgeMs) => {
  if (!record) return false;
  if (!maxAgeMs) return true;
  return Date.now() - record.cachedAt <= maxAgeMs;
};

const normalizeToken = (word) =>
  String(word || "")
    .replace(/[’‘]/g, "'")
    .replace(/[^A-Za-z']/g, "")
    .toUpperCase();

const isEntryResponse = (data) =>
  Array.isArray(data) && data.length > 0 && typeof data[0] === "object";

const extractDefinitions = (data) => {
  if (!isEntryResponse(data)) return [];
  const defs = data.flatMap((entry) => entry?.shortdef || []);
  const unique = [];
  defs.forEach((def) => {
    const text = String(def || "").trim();
    if (!text || unique.includes(text)) return;
    unique.push(text);
  });
  return unique.slice(0, 4);
};

export const isDictionaryApiEnabled = () => Boolean(API_KEY);

export const getCachedDictionaryEntry = (word, options = {}) => {
  const key = normalizeToken(word);
  if (!key) return null;
  const record = cache.get(key);
  if (!isCacheFresh(record, options.maxAgeMs)) return null;
  return record?.entry || null;
};

export const fetchDictionaryEntry = async (word, options = {}) => {
  const key = normalizeToken(word);
  if (!key || !API_KEY) return null;
  if (!options.force) {
    const cached = getCachedDictionaryEntry(key, options);
    if (cached) return cached;
  }

  const url = `${API_BASE}/${encodeURIComponent(key)}?key=${API_KEY}`;
  const response = await fetch(url, { signal: options.signal });
  if (!response.ok) {
    throw new Error(`Dictionary API error: ${response.status}`);
  }
  const data = await response.json();
  const entry = {
    isValid: isEntryResponse(data),
    definitions: extractDefinitions(data),
    raw: data,
    _cachedAt: Date.now(),
  };
  cache.set(key, { entry, cachedAt: entry._cachedAt });
  return entry;
};
