import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { STATE_CLASS_MAP } from "../../src/js/stateClasses.js";
import { COLOR_SCHEMA, DESIGN_TOKENS } from "../../src/engines/colorEngine/index";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

const readCss = (relativePath: string) =>
  readFileSync(path.join(repoRoot, relativePath), "utf8");

const CSS = `${readCss("src/index.css")}\n${readCss("src/css/layers.css")}`;

const expectSelector = (className: string) => {
  expect(CSS).toMatch(new RegExp(`\\.${className}\\b`));
};

const expectVariable = (varName: string) => {
  const normalized = varName.replace(/^--/, "");
  expect(CSS).toMatch(new RegExp(`--${normalized}\\s*:`));
};

describe("CSS invariants", () => {
  it("defines state classes used by the Color API", () => {
    const classes = [
      ...Object.values(STATE_CLASS_MAP.school),
      ...Object.values(STATE_CLASS_MAP.vowelFamily),
      ...Object.values(COLOR_SCHEMA.classes.feel),
    ];
    classes.forEach(expectSelector);
  });

  it("exposes required color tokens as CSS variables", () => {
    const tokens = [
      "vowel-A",
      "vowel-AE",
      "vowel-AO",
      "vowel-AW",
      "vowel-AY",
      "vowel-EH",
      "vowel-ER",
      "vowel-EY",
      "vowel-IH",
      "vowel-IY",
      "vowel-OH",
      "vowel-OW",
      "vowel-OY",
      "vowel-UH",
      "vowel-UW",
      "feel-neutral",
      "feel-joy",
      "feel-sorrow",
      "feel-rage",
      "feel-fear",
      "feel-awe",
      "feel-desire",
    ];
    tokens.forEach((token) => expectVariable(token));
  });

  it("keeps COLOR_SCHEMA variables in sync with CSS", () => {
    Object.values(COLOR_SCHEMA.cssVariables.schools).forEach(expectVariable);
    Object.values(COLOR_SCHEMA.cssVariables.vowels).forEach(expectVariable);
    Object.values(COLOR_SCHEMA.cssVariables.feels).forEach(expectVariable);
  });

  it("keeps DESIGN_TOKENS cssVar entries in sync with CSS", () => {
    [
      ...Object.values(DESIGN_TOKENS.schools),
      ...Object.values(DESIGN_TOKENS.feels),
      ...Object.values(DESIGN_TOKENS.vowels),
    ].forEach((token) => expectVariable(token.cssVar));
  });
});
