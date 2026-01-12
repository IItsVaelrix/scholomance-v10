// Shared data constants for Scholomance

export const LIBRARY = {
  lexiconic: {
    title: "Sonic Thaumaturgy",
    yt: "9_QmbwbY0tc",
    sc: "https://soundcloud.com/vaelrix/black-box-of-limitless-pills-4",
    school: "SONIC",
  },
  schism: {
    title: "Psychic Schism",
    yt: "3tmd-ClpJxA",
    sc: "https://soundcloud.com/vaelrix/bionic-slavery-1",
    school: "PSYCHIC",
  },
  void: {
    title: "VOID",
    yt: "F2yr6zQwqQk",
    sc: "https://soundcloud.com/vaelrix/solar-ray",
    school: "VOID",
  },
  alchemy: {
    title: "Verbal Alchemy",
    yt: "GtgyCnJcZRw",
    sc: "https://soundcloud.com/vaelrix/vaelrix-verbal-alchemy",
    school: "ALCHEMY",
  },
  will: {
    title: "Willpower Surge",
    yt: "5iIUiYkmkw8",
    sc: "https://on.soundcloud.com/aXSjrTPcfYxzdToj8p",
    school: "WILL",
  },
};

export const LIBRARY_STORAGE_KEY = "scholomance-library";

export const LINKS = [
  { id: "watch", path: "/watch", label: "Watch" },
  { id: "listen", path: "/listen", label: "Listen" },
  { id: "read", path: "/read", label: "Read" },
];

export const COLORS = {
  VOID: "#a1a1aa",
  PSYCHIC: "#00E5FF",
  ALCHEMY: "#D500F9",
  WILL: "#FF8A00",
  SONIC: "#651FFF",
};

export const SCHOOL_ANGLES = {
  VOID: 0,
  PSYCHIC: 72,
  ALCHEMY: 144,
  WILL: 216,
  SONIC: 288,
};

export function schoolToBadgeClass(school) {
  return `badge--${String(school || "").toLowerCase()}`;
}

export function resolveLibrary() {
  if (typeof window === "undefined") return LIBRARY;
  try {
    const raw = window.localStorage.getItem(LIBRARY_STORAGE_KEY);
    if (!raw) return LIBRARY;
    const parsed = JSON.parse(raw);
    const normalized = normalizeLibrary(parsed);
    return Object.keys(normalized).length ? normalized : LIBRARY;
  } catch (err) {
    console.warn("Failed to load library override", err);
    return LIBRARY;
  }
}

function normalizeLibrary(data) {
  if (Array.isArray(data)) {
    return data.reduce((acc, entry) => {
      if (!entry?.id || !entry?.title || !entry?.school) return acc;
      acc[entry.id] = {
        title: entry.title,
        yt: entry.yt || "",
        sc: entry.sc || "",
        school: String(entry.school || "").toUpperCase(),
      };
      return acc;
    }, {});
  }
  if (data && typeof data === "object") {
    return Object.entries(data).reduce((acc, [key, entry]) => {
      if (!entry?.title || !entry?.school) return acc;
      acc[key] = {
        title: entry.title,
        yt: entry.yt || "",
        sc: entry.sc || "",
        school: String(entry.school || "").toUpperCase(),
      };
      return acc;
    }, {});
  }
  return {};
}
