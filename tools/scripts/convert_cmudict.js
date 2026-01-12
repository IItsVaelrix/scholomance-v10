#!/usr/bin/env node
import fs from "fs";
import path from "path";

const DEFAULT_INPUT = path.resolve("tools/cmudict/cmudict-0.7b");
const DEFAULT_OUTPUT = path.resolve("public/dicts/cmudict.min.json");
const mappingPath = path.resolve("tools/mappings/arpabetToFamily.json");

const vowelSet = new Set([
  "AA",
  "AE",
  "AH",
  "AO",
  "AW",
  "AY",
  "EH",
  "ER",
  "EY",
  "IH",
  "IY",
  "OW",
  "OY",
  "UH",
  "UW",
  "AX",
  "AXR",
  "IX",
  "UX",
]);

function loadMapping() {
  const raw = fs.readFileSync(mappingPath, "utf8");
  return JSON.parse(raw);
}

function stripStress(phoneme) {
  return phoneme.replace(/\d/g, "");
}

function isVowel(phoneme) {
  return vowelSet.has(phoneme);
}

function normalizeWord(word) {
  return word.replace(/\(\d+\)$/, "");
}

function parseLine(line) {
  if (!line || line.startsWith(";;;")) return null;
  const parts = line.trim().split(/\s+/);
  if (parts.length < 2) return null;
  const rawWord = parts.shift();
  if (!rawWord) return null;
  const word = normalizeWord(rawWord);
  const phonemes = parts.map(stripStress);
  return { word, phonemes };
}

function buildRecord(phonemes, mapping) {
  const vowelFamilies = [];
  let lastVowelIndex = -1;
  phonemes.forEach((ph, idx) => {
    if (isVowel(ph)) {
      lastVowelIndex = idx;
      vowelFamilies.push(mapping[ph] || "UH");
    }
  });

  const coda = lastVowelIndex >= 0 ? phonemes.slice(lastVowelIndex + 1) : [];

  return {
    ph: phonemes,
    vf: vowelFamilies,
    cd: coda,
  };
}

function main() {
  const inputPath = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_INPUT;
  const outputPath = process.argv[3] ? path.resolve(process.argv[3]) : DEFAULT_OUTPUT;

  if (!fs.existsSync(inputPath)) {
    console.error(`Missing CMUdict file at ${inputPath}`);
    process.exit(1);
  }

  const mapping = loadMapping();
  const raw = fs.readFileSync(inputPath, "utf8");
  const lines = raw.split(/\r?\n/);
  const output = {};

  for (const line of lines) {
    const parsed = parseLine(line);
    if (!parsed) continue;
    if (output[parsed.word]) continue; // keep first pronunciation only
    output[parsed.word] = buildRecord(parsed.phonemes, mapping);
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(output));

  console.log(`CMUdict converted: ${Object.keys(output).length} entries -> ${outputPath}`);
}

main();
