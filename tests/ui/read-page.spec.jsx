import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { vi, describe, it, beforeEach } from "vitest";
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical";
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

const setEditorText = async (editor, text) => {
  if (!editor) return;
  const lexicalEditor = editor.__lexicalEditor;
  if (lexicalEditor) {
    await act(async () => {
      lexicalEditor.update(() => {
        const root = $getRoot();
        root.clear();
        text.split("\n").forEach((line) => {
          const paragraph = $createParagraphNode();
          paragraph.append($createTextNode(line));
          root.append(paragraph);
        });
      });
    });
    return;
  }

  await act(async () => {
    editor.textContent = text;
    editor.innerHTML = text.replace(/\n/g, "<br>");
    fireEvent.input(editor, { target: { innerText: text } });
  });
};

const enableAnalysisMode = () => {
  const toggle = screen.getByRole("button", { name: /analysis mode/i });
  fireEvent.click(toggle);
};

describe("ReadPage UI", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows word and character count", async () => {
    const { container } = render(<ReadPage />);
    enableAnalysisMode();
    const editor = container.querySelector("#scroll-content");
    await setEditorText(editor, "one two three four five");

    await waitFor(() => {
      expect(screen.getByText(/words/i)).toBeInTheDocument();
      expect(screen.getByText(/100,000/)).toBeInTheDocument();
    });
  });

  it("preserves line spacing", async () => {
    const { container } = render(<ReadPage />);
    enableAnalysisMode();
    const editor = container.querySelector("#scroll-content");
    await setEditorText(editor, "First line.\nSecond line.\n\nFourth line.");

    await waitFor(() => {
      expect(container.querySelector("#scroll-content").textContent).toContain("Fourth line.");
    });
  });

  it("opens annotation panel when a word is clicked", async () => {
    const { container } = render(<ReadPage />);
    enableAnalysisMode();
    const editor = container.querySelector("#scroll-content");
    await setEditorText(editor, "The cat sat on the mat");

    await waitFor(() => {
      expect(container.querySelector(".editor-content.overlay .editor-word")).toBeTruthy();
    });

    fireEvent.click(screen.getByText("cat"));

    const panel = await screen.findByRole("dialog");
    expect(panel).toBeVisible();
    expect(screen.getByText(/CAT/)).toBeVisible();
  });

  it("closes annotation panel", async () => {
    const { container } = render(<ReadPage />);
    enableAnalysisMode();
    const editor = container.querySelector("#scroll-content");
    await setEditorText(editor, "Test word analysis");

    await waitFor(() => {
      expect(container.querySelector(".editor-content.overlay .editor-word")).toBeTruthy();
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
