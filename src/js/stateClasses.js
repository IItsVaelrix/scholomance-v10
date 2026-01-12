export const STATE_CLASS_MAP = {
  section: {
    watch: "mode-watch",
    listen: "mode-listen",
    read: "mode-read",
  },
  theme: {
    watch: "page-theme--watch",
    listen: "page-theme--listen",
    read: "page-theme--read",
  },
  view: {
    editor: "mode-editor",
    viewer: "mode-viewer",
  },
  overlay: {
    open: "mode-overlay",
    closed: "mode-inline",
  },
  school: {
    VOID: "school-void",
    PSYCHIC: "school-psychic",
    ALCHEMY: "school-alchemy",
    WILL: "school-will",
    SONIC: "school-sonic",
  },
  vowelFamily: {
    A: "vowel-a",
    AE: "vowel-ae",
    AO: "vowel-ao",
    AW: "vowel-aw",
    AY: "vowel-ay",
    EH: "vowel-eh",
    ER: "vowel-er",
    EY: "vowel-ey",
    IH: "vowel-ih",
    IY: "vowel-iy",
    OH: "vowel-oh",
    OW: "vowel-ow",
    OY: "vowel-oy",
    UH: "vowel-uh",
    UW: "vowel-uw",
  },
};

export function getStateClass(key, value) {
  if (!value) return "";
  return STATE_CLASS_MAP[key]?.[value] || "";
}

export function buildStateClasses(stateMap) {
  if (!stateMap) return "";
  return Object.entries(stateMap)
    .map(([key, value]) => getStateClass(key, value))
    .filter(Boolean)
    .join(" ");
}
