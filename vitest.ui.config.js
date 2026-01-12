import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const htmlEncodingSnifferMock = path.resolve(__dirname, "tests/mocks/html-encoding-sniffer.js");

export default defineConfig({
  test: {
    include: ["tests/ui/**/*.spec.{js,jsx,ts,tsx}"],
    environment: "happy-dom",
    setupFiles: ["tests/setupTests.js"],
    globals: true,
  },
  esbuild: {
    jsx: "automatic",
  },
  resolve: {
    alias: {
      "html-encoding-sniffer": htmlEncodingSnifferMock,
    },
  },
});
