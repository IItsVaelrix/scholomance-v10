import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

document.documentElement.dataset.visualTest = "true";

window.matchMedia = (query = "") => ({
  matches: query.includes("prefers-reduced-motion"),
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
});

if (!window.ResizeObserver) {
  window.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

if (!document.execCommand) {
  document.execCommand = () => false;
}

if (!window.getSelection) {
  window.getSelection = () => ({
    rangeCount: 0,
    getRangeAt: () => null,
    removeAllRanges: () => {},
    addRange: () => {},
  });
}

window.confirm = vi.fn(() => true);

if (typeof global.fetch !== "function") {
  global.fetch = vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({}),
    text: async () => "",
    arrayBuffer: async () => new ArrayBuffer(0),
  }));
} else {
  vi.spyOn(global, "fetch").mockImplementation(async () => ({
    ok: true,
    status: 200,
    json: async () => ({}),
    text: async () => "",
    arrayBuffer: async () => new ArrayBuffer(0),
  }));
}
