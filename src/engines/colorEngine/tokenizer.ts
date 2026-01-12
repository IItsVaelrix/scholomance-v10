export type Token = {
  raw: string;
  normalized: string;
  start: number;
  end: number;
};

export const normalizeToken = (word: string) =>
  String(word || "")
    .replace(/[’‘]/g, "'")
    .replace(/[^A-Za-z']/g, "")
    .toUpperCase();

export const tokenizeText = (text: string): Token[] => {
  if (!text) return [];
  const tokens: Token[] = [];
  const wordRegex = /[A-Za-z']+/g;
  let match = wordRegex.exec(text);
  while (match) {
    const raw = match[0];
    const normalized = normalizeToken(raw);
    if (normalized) {
      tokens.push({
        raw,
        normalized,
        start: match.index,
        end: match.index + raw.length,
      });
    }
    match = wordRegex.exec(text);
  }
  return tokens;
};
