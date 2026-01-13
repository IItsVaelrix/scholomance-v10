import { useEffect, useMemo, useRef, useState, memo } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical";
import { motion } from "framer-motion";
import { SCROLL_LIMITS } from "../../data/scrollLimits";
import { getEvidenceValue } from "../../engines/colorEngine/index.ts";

const theme = {
  paragraph: "editor-line",
  placeholder: "editor-placeholder",
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildEditorMarkup = (text, decorations = []) => {
  if (!text) return "";
  const lines = String(text).split("\n");
  let decorationIndex = 0;
  return lines
    .map((line, index) => {
      if (!line) {
        return `<div class="editor-line" data-line="${index}"><br></div>`;
      }
      const wordRegex = /[A-Za-z']+/g;
      const wordMatches = Array.from(line.matchAll(wordRegex));
      const lineDecorations = wordMatches.map(() => decorations[decorationIndex++] || null);
      const rhymeCounts = lineDecorations.reduce((acc, decoration) => {
        const rhymeKey = getEvidenceValue(decoration?.result || null, "rhyme");
        if (!rhymeKey) return acc;
        acc[rhymeKey] = (acc[rhymeKey] || 0) + 1;
        return acc;
      }, {});
      let html = "";
      let lastIndex = 0;
      let wordIndex = 0;
      line.replace(wordRegex, (match, offset) => {
        const before = line.slice(lastIndex, offset);
        if (before) {
          html += escapeHtml(before);
        }
        const decoration = lineDecorations[wordIndex];
        const result = decoration?.result || null;
        const rhymeKey = getEvidenceValue(result, "rhyme");
        const isRhyming = rhymeKey && rhymeCounts[rhymeKey] > 1;
        const baseClasses = result?.classes?.length ? result.classes : ["editor-word"];
        const textClass = isRhyming ? result?.channels?.text?.className : "";
        const feelClass = result?.channels?.accent?.className || "";
        const schoolClass =
          result?.chips?.find((chip) => chip.type === "school")?.className || "";
        const feelLabel = result?.chips?.find((chip) => chip.type === "feel")?.label || "";
        const schoolLabel =
          result?.chips?.find((chip) => chip.type === "school")?.label || "";
        const confidence = result?.confidence ?? "";
        const enriched = result?.enriched ? "true" : "false";
        const classes = [
          ...new Set([
            ...baseClasses,
            textClass,
            feelClass,
            schoolClass,
            feelClass ? "has-feel" : "",
            isRhyming ? "is-rhyming" : "",
          ]),
        ]
          .filter(Boolean)
          .join(" ");
        const attrs = [
          rhymeKey ? `data-rhyme="${rhymeKey}"` : "",
          feelLabel ? `data-feel="${feelLabel.toLowerCase()}"` : "",
          schoolLabel ? `data-school="${schoolLabel.toLowerCase()}"` : "",
          confidence !== "" ? `data-confidence="${confidence.toFixed?.(2) || confidence}"` : "",
          `data-enriched="${enriched}"`,
        ]
          .filter(Boolean)
          .join(" ");
        html += `<span class="${classes}" ${attrs}>${escapeHtml(match)}</span>`;
        lastIndex = offset + match.length;
        wordIndex += 1;
        return match;
      });
      const tail = line.slice(lastIndex);
      if (tail) {
        html += escapeHtml(tail);
      }
      return `<div class="editor-line" data-line="${index}">${html || "<br>"}</div>`;
    })
    .join("");
};

const StatsPanel = memo(function StatsPanel({ wordCount, charCount, limit, isOverLimit }) {
  return (
    <div className="editor-stats">
      <span className="stat-badge">{wordCount} words</span>
      <span className={`stat-badge ${isOverLimit ? "stat-badge--alert" : ""}`}>
        {charCount} / {limit.toLocaleString()} chars
      </span>
    </div>
  );
});

function PlainTextInitPlugin({ content }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    editor.update(() => {
      const root = $getRoot();
      root.clear();
      content.split("\n").forEach((line) => {
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(line));
        root.append(paragraph);
      });
    });
  }, [content, editor]);
  return null;
}

function WordClickPlugin({ onWordClick }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const rootEl = editor.getRootElement();
    if (!rootEl) return;

    const handleClick = (event) => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);
      const node = selection.anchorNode;
      if (node?.nodeType !== Node.TEXT_NODE) return;
      const text = node.textContent || "";
      let start = range.startOffset;
      let end = range.startOffset;
      while (start > 0 && /\w/.test(text[start - 1])) start -= 1;
      while (end < text.length && /\w/.test(text[end])) end += 1;
      const word = text.slice(start, end);
      if (word) onWordClick?.(word);
    };

    rootEl.addEventListener("click", handleClick);
    return () => rootEl.removeEventListener("click", handleClick);
  }, [editor, onWordClick]);

  return null;
}

const COMMIT_DELAY_MS = 500;
const SLOW_DECORATE_DELAY_MS = 550;
const TYPING_IDLE_MS = 550;
const LINE_CACHE_LIMIT = 500;

const countStats = (text) => {
  const trimmed = text.trim();
  return {
    words: trimmed ? trimmed.split(/\s+/).length : 0,
    chars: text.length,
  };
};

const getCaretOffset = (rootEl) => {
  const selection = window.getSelection?.();
  if (!selection || selection.rangeCount === 0 || !rootEl) return null;
  const range = selection.getRangeAt(0);
  const startNode = range.startContainer;
  const lineEl =
    (startNode.nodeType === Node.TEXT_NODE
      ? startNode.parentElement?.closest(".editor-line")
      : startNode.closest?.(".editor-line")) || null;
  if (!lineEl || !rootEl.contains(lineEl)) return null;
  const lines = Array.from(rootEl.querySelectorAll(".editor-line"));
  const lineIndex = lines.indexOf(lineEl);
  if (lineIndex < 0) return null;
  const lineRange = range.cloneRange();
  lineRange.selectNodeContents(lineEl);
  lineRange.setEnd(range.startContainer, range.startOffset);
  const lineOffset = lineRange.toString().length;
  let offset = lineOffset;
  for (let i = 0; i < lineIndex; i += 1) {
    offset += lines[i].innerText.length + 1;
  }
  return offset;
};

export default function ScrollEditor({
  initialTitle = "",
  initialContent = "",
  onSave,
  onContentChange,
  onCancel,
  isEditing = false,
  disabled = false,
  colorEngine = null,
  engineRevision = 0,
  onWordClick,
  analysisEnabled = false,
  onToggleAnalysis,
}) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [stats, setStats] = useState(() => countStats(initialContent));
  const [hasContent, setHasContent] = useState(() => Boolean(initialContent.trim()));
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [decoratedMarkup, setDecoratedMarkup] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const hasContentRef = useRef(Boolean(initialContent.trim()));
  const contentRef = useRef(initialContent);
  const commitTimerRef = useRef(null);
  const slowTimerRef = useRef(null);
  const typingTimerRef = useRef(null);
  const rootElRef = useRef(null);
  const lineCacheRef = useRef(new Map());
  const autoAnnotatedRef = useRef(false);
  const isVisualTest =
    typeof document !== "undefined" &&
    document.documentElement?.dataset?.visualTest === "true";

  useEffect(() => {
    setTitle(initialTitle);
    setContent(initialContent);
    setStats(countStats(initialContent));
    contentRef.current = initialContent;
    const nextHasContent = Boolean(initialContent.trim());
    hasContentRef.current = nextHasContent;
    setHasContent(nextHasContent);
    setDecoratedMarkup("");
  }, [initialTitle, initialContent]);

  useEffect(() => {
    return () => {
      if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, []);

  useEffect(() => {
    decorateCurrent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineRevision, colorEngine]);

  useEffect(() => {
    if (autoAnnotatedRef.current) return;
    if (typeof document === "undefined") return;
    if (document.documentElement.dataset.visualTest !== "true") return;
    if (!colorEngine?.getTokenResult) return;
    if (!analysisEnabled) return;
    const firstWord = contentRef.current.trim().split(/\s+/)[0];
    if (firstWord && onWordClick) {
      autoAnnotatedRef.current = true;
      onWordClick(firstWord);
    }
  }, [decoratedMarkup, onWordClick, colorEngine, engineRevision, analysisEnabled]);

  useEffect(() => {
    if (!analysisEnabled) {
      setDecoratedMarkup("");
    }
  }, [analysisEnabled]);

  const isOverLimit = stats.chars > SCROLL_LIMITS.content;
  const remaining = SCROLL_LIMITS.content - stats.chars;

  function decorateCurrent() {
    if (!analysisEnabled || !colorEngine) {
      setDecoratedMarkup("");
      return;
    }
    const sourceText = String(contentRef.current || "");
    if (!sourceText.trim()) {
      setDecoratedMarkup("");
      return;
    }
    try {
      const lines = sourceText.split("\n");
      const cache = lineCacheRef.current;
      const parts = lines.map((line, index) => {
        const cacheKey = `${engineRevision}|${line}`;
        if (cache.has(cacheKey)) {
          const cached = cache.get(cacheKey);
          cache.delete(cacheKey);
          cache.set(cacheKey, cached);
          return cached.replace('data-line="0"', `data-line="${index}"`);
        }
        const { decorations } = colorEngine.decorateText(line);
        const markup = buildEditorMarkup(line, decorations);
        const normalized = markup.replace('data-line="0"', `data-line="${index}"`);
        cache.set(cacheKey, normalized);
        if (cache.size > LINE_CACHE_LIMIT) {
          const oldestKey = cache.keys().next().value;
          cache.delete(oldestKey);
        }
        return normalized;
      });
      setDecoratedMarkup(parts.join(""));
    } catch {
      // swallow decoration errors to avoid blocking input
    }
  }

  function scheduleSlowDecorate() {
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    if (!analysisEnabled) {
      slowTimerRef.current = null;
      setDecoratedMarkup("");
      return;
    }
    if (!contentRef.current.trim()) {
      slowTimerRef.current = null;
      setDecoratedMarkup("");
      return;
    }
    if (isVisualTest) {
      slowTimerRef.current = null;
      decorateCurrent();
      return;
    }
    slowTimerRef.current = setTimeout(() => {
      slowTimerRef.current = null;
      decorateCurrent();
    }, SLOW_DECORATE_DELAY_MS);
  }

  const initialConfig = useMemo(
    () => ({
      namespace: "ScholomanceEditor",
      theme,
      editable: !disabled && !isSaving,
      onError: (err) => console.error(err),
    }),
    [disabled, isSaving]
  );

  const scheduleCommit = () => {
    if (commitTimerRef.current) clearTimeout(commitTimerRef.current);
    commitTimerRef.current = setTimeout(() => {
      commitTimerRef.current = null;
      const next = contentRef.current;
      setContent(next);
      onContentChange?.(next);
    }, COMMIT_DELAY_MS);
  };

  const handleEditorKeyDown = (event) => {
    const key = event.key.toLowerCase();
    if ((event.ctrlKey || event.metaKey) && key === "s") {
      event.preventDefault();
      if (!disabled && !isSaving) {
        handleSave();
      }
      return;
    }
    if ((event.ctrlKey || event.metaKey) && key === "enter") {
      event.preventDefault();
      if (!disabled && !isSaving) {
        handleSave();
      }
      return;
    }
    if (event.key === "Escape") {
      if (analysisEnabled && onToggleAnalysis) {
        event.preventDefault();
        onToggleAnalysis(false);
        return;
      }
      if (onCancel) {
        event.preventDefault();
        onCancel();
      }
    }
  };

  const scheduleTypingIdle = () => {
    setIsTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      setIsTyping(false);
    }, TYPING_IDLE_MS);
  };

  const handleEditorChange = (editorState, editor) => {
    editorState.read(() => {
      const root = $getRoot();
      const text = root.getTextContent();
      contentRef.current = text;
      const nextHasContent = Boolean(text.trim());
      if (nextHasContent !== hasContentRef.current) {
        hasContentRef.current = nextHasContent;
        setHasContent(nextHasContent);
      }
      if (analysisEnabled && !text.trim()) {
        if (slowTimerRef.current) {
          clearTimeout(slowTimerRef.current);
          slowTimerRef.current = null;
        }
        setDecoratedMarkup("");
      }

      const nextStats = countStats(text);
      if (nextStats.words !== stats.words || nextStats.chars !== stats.chars) {
        setStats(nextStats);
      }

      const rootEl = editor.getRootElement();
      if (rootEl && !rootElRef.current) {
        rootElRef.current = rootEl;
      }

      // Fast pass: decorate only the active line
      if (analysisEnabled && colorEngine && rootElRef.current) {
        const offset = getCaretOffset(rootElRef.current);
        if (offset !== null) {
          const lines = text.split("\n");
          let remainingOffset = offset;
          let activeLineText = lines[0] || "";
          for (let i = 0; i < lines.length; i += 1) {
            const len = lines[i].length + 1;
            if (remainingOffset <= len) {
              activeLineText = lines[i];
              break;
            }
            remainingOffset -= len;
          }
          try {
            colorEngine.decorateText(activeLineText);
          } catch {
            /* ignore fast-pass errors */
          }
        }
      }

      scheduleCommit();
      if (text.trim()) {
        scheduleSlowDecorate();
      } else if (analysisEnabled) {
        setDecoratedMarkup("");
      }
      scheduleTypingIdle();
    });
  };

  const handleSave = async () => {
    setValidationError(null);
    const latest = contentRef.current;

    if (!latest.trim()) {
      setValidationError({ field: "content", message: "Content cannot be empty" });
      return;
    }
    if (title.length > SCROLL_LIMITS.title) {
      setValidationError({
        field: "title",
        message: `Title must be ${SCROLL_LIMITS.title} characters or less`,
      });
      return;
    }
    if (latest.length > SCROLL_LIMITS.content) {
      setValidationError({
        field: "content",
        message: `Content must be ${SCROLL_LIMITS.content.toLocaleString()} characters or less`,
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSave?.(title.trim(), latest.trim());
      setValidationError(null);
      setContent(latest);
      onContentChange?.(latest);
    } catch (err) {
      setValidationError({
        field: "form",
        message: err.message || "Failed to save scroll",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formError = validationError?.field === "form";
  const contentError = validationError?.field === "content";
  const titleError = validationError?.field === "title";

  const hasOverlay = Boolean(analysisEnabled && hasContent && decoratedMarkup);

  return (
    <motion.div
      className={`scroll-editor surface ${contentRef.current.trim() ? "has-text" : "is-empty"} ${
        hasOverlay ? "has-overlay" : ""
      }`}
      data-surface="editor"
      data-role="editor"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <div className="editor-header">
        <label htmlFor="scroll-title" className="sr-only">
          Scroll Title
        </label>
        <input
          type="text"
          id="scroll-title"
          className="editor-title-input"
          placeholder="Scroll Title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={disabled || isSaving}
          maxLength={SCROLL_LIMITS.title}
          aria-invalid={titleError}
          aria-describedby={titleError ? "editor-error-message" : undefined}
        />
        <StatsPanel
          wordCount={stats.words}
          charCount={stats.chars}
          limit={SCROLL_LIMITS.content}
          isOverLimit={isOverLimit}
        />
      </div>

      {(validationError && !formError) && (
        <div id="editor-error-message" className="editor-validation-error" role="alert">
          <span className="error-sigil">⚠</span>
          {validationError.message}
        </div>
      )}

      <div className="editor-body" style={{ position: "relative" }}>
        <span id="scrollBodyLabel" className="sr-only">Scroll text</span>
        <p id="editorHelp" className="sr-only">
          Editor. Type to write. Press Control+S to save. Press Escape to exit analysis mode.
        </p>
        {decoratedMarkup ? (
          <div
            className="editor-content overlay analysis-overlay"
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              opacity: isTyping ? 0.3 : 1,
              zIndex: 0,
            }}
            dangerouslySetInnerHTML={{ __html: decoratedMarkup }}
          />
        ) : null}
        <LexicalComposer initialConfig={initialConfig} key={`${engineRevision}-${initialContent}`}>
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                id="scrollBody"
                className="editor-content"
                role="textbox"
                aria-multiline="true"
                aria-labelledby="scrollBodyLabel"
                aria-describedby="editorHelp"
                tabIndex={0}
                onKeyDown={handleEditorKeyDown}
              />
            }
            placeholder={
              <div className="editor-placeholder">
                Inscribe thy verses upon this sacred parchment...
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <PlainTextInitPlugin content={initialContent} />
          <OnChangePlugin onChange={handleEditorChange} />
          <WordClickPlugin onWordClick={onWordClick} />
        </LexicalComposer>
      </div>

      <div className="editor-footer">
        <div className="editor-hint">
          <kbd>Ctrl</kbd>+<kbd>S</kbd> to save
          {onCancel && (
            <>
              {" "}&middot; <kbd>Esc</kbd> to cancel
            </>
          )}
          {isOverLimit && (
            <span className="editor-warning">
              Reduce by {Math.abs(remaining)} chars to save
            </span>
          )}
        </div>
        <div className="editor-actions">
          {onCancel && (
            <button
              type="button"
              className="editor-btn editor-btn--secondary"
              onClick={onCancel}
              disabled={isSaving}
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            className="editor-btn editor-btn--primary"
            onClick={handleSave}
            disabled={disabled || isSaving || !contentRef.current.trim() || isOverLimit}
          >
            {isSaving ? (
              <>
                <span className="btn-sigil spinning">&#x263C;</span>
                Inscribing...
              </>
            ) : (
              <>
                <span className="btn-sigil">&#x2605;</span>
                {isEditing ? "Update Scroll" : "Save Scroll"}
              </>
            )}
          </button>
        </div>
        {formError && (
          <div className="editor-validation-error" role="alert">
            <span className="error-sigil">⚠</span>
            {validationError.message}
          </div>
        )}
      </div>
    </motion.div>
  );
}
