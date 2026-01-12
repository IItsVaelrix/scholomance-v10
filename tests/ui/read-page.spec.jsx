import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, beforeEach } from "vitest";
import ReadPage from "../../src/pages/Read/ReadPage.jsx";
import { createColorEngine } from "../../src/engines/colorEngine/index.ts";

const engine = createColorEngine({
  isEnrichmentEnabled: () => false,
});

vi.mock("../../src/hooks/useColorEngine.jsx", () => ({
  useColorEngine: () => ({
    isReady: true,
    engine,
    revision: 0,
  }),
}));

const setEditorText = (editor, text) => {
  editor.textContent = text;
  editor.innerHTML = text.replace(/\n/g, "<br>");
  fireEvent.input(editor, { target: { innerText: text } });
};

describe("ReadPage UI", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows word and character count", async () => {
    const { container } = render(<ReadPage />);
    const editor = container.querySelector("#scroll-content");
    setEditorText(editor, "one two three four five");

    await waitFor(() => {
      expect(screen.getByText(/words/i)).toBeInTheDocument();
      expect(screen.getByText(/100,000/)).toBeInTheDocument();
    });
  });

  it("preserves line spacing", async () => {
    const { container } = render(<ReadPage />);
    const editor = container.querySelector("#scroll-content");
    setEditorText(editor, "First line.\nSecond line.\n\nFourth line.");

    await waitFor(() => {
      expect(container.querySelector("#scroll-content").textContent).toContain("Fourth line.");
    });
  });

  it("opens annotation panel when a word is clicked", async () => {
    const { container } = render(<ReadPage />);
    const editor = container.querySelector("#scroll-content");
    setEditorText(editor, "The cat sat on the mat");

    await waitFor(() => {
      expect(container.querySelector("#scroll-content .editor-word")).toBeTruthy();
    });

    fireEvent.click(screen.getByText("cat"));

    const panel = await screen.findByRole("dialog");
    expect(panel).toBeVisible();
    expect(screen.getByText(/CAT/)).toBeVisible();
  });

  it("closes annotation panel", async () => {
    const { container } = render(<ReadPage />);
    const editor = container.querySelector("#scroll-content");
    setEditorText(editor, "Test word analysis");

    await waitFor(() => {
      expect(container.querySelector("#scroll-content .editor-word")).toBeTruthy();
    });

    fireEvent.click(screen.getByText("word"));
    const panel = await screen.findByRole("dialog");
    expect(panel).toBeVisible();

    fireEvent.click(screen.getByLabelText(/close/i));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });
});
