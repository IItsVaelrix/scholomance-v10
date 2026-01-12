import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { motion } from "framer-motion";
import { SCROLL_LIMITS } from "../../data/scrollLimits";
import { getEvidenceValue } from "../../engines/colorEngine/index.ts";

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const normalizeEditorText = (value) => String(value || "").replace(/\r\n/g, "\n");

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
        const classes = [
          ...new Set([...baseClasses, textClass, feelClass, feelClass ? "has-feel" : ""]),
        ]
          .filter(Boolean)
          .join(" ");
        html += `<span class="${classes}">${escapeHtml(match)}</span>`;
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

const getRenderDelay = (length) => {
  if (length > 8000) return 300;
  if (length > 3000) return 220;
  if (length > 1200) return 150;
  return 80;
};

const getCaretOffset = (root) => {
  const selection = window.getSelection?.();
  if (!selection || selection.rangeCount === 0 || !root) return null;
  const range = selection.getRangeAt(0);
  const startNode = range.startContainer;
  const lineEl =
    (startNode.nodeType === Node.TEXT_NODE
      ? startNode.parentElement?.closest(".editor-line")
      : startNode.closest?.(".editor-line")) || null;
  if (!lineEl || !root.contains(lineEl)) return null;
  const lines = Array.from(root.children);
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

const setCaretOffset = (root, offset) => {
  if (offset === null || offset === undefined || !root) return;
  const selection = window.getSelection?.();
  if (!selection) return;
  const lines = Array.from(root.children);
  let remaining = offset;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const lineLength = line.innerText.length;
    if (remaining <= lineLength) {
      const range = document.createRange();
      const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      let current = 0;
      while (node) {
        const textLength = node.textContent?.length || 0;
        const next = current + textLength;
        if (remaining <= next) {
          range.setStart(node, Math.max(0, remaining - current));
          range.collapse(true);
          selection.removeAllRanges();
          selection.addRange(range);
          return;
        }
        current = next;
        node = walker.nextNode();
      }
      range.selectNodeContents(line);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }
    remaining -= lineLength + 1;
  }
  const endRange = document.createRange();
  endRange.selectNodeContents(root);
  endRange.collapse(false);
  selection.removeAllRanges();
  selection.addRange(endRange);
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
}) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const editorRef = useRef(null);
  const prevLengthRef = useRef(initialContent.length);
  const effectTimeoutRef = useRef(null);
  const renderTimeoutRef = useRef(null);
  const caretRef = useRef(null);
  const isComposingRef = useRef(false);
  const [inkEffect, setInkEffect] = useState(null);
  const [renderedContent, setRenderedContent] = useState(() =>
    buildEditorMarkup(initialContent, [])
  );

  useEffect(() => {
    setTitle(initialTitle);
    setContent(initialContent);
    prevLengthRef.current = initialContent.length;
  }, [initialTitle, initialContent]);

  useEffect(() => {
    if (editorRef.current && !initialContent) {
      editorRef.current.focus();
    }
  }, [initialContent]);

  useEffect(() => {
    return () => {
      if (effectTimeoutRef.current) {
        clearTimeout(effectTimeoutRef.current);
      }
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, []);
  useEffect(() => {
    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }
    const delay = getRenderDelay(content.length);
    renderTimeoutRef.current = setTimeout(() => {
      try {
        const decorations = colorEngine ? colorEngine.decorateText(content).decorations : [];
        setRenderedContent(buildEditorMarkup(content, decorations));
      } catch (e) {
        console.error("Error building editor markup:", e);
        // Fallback to un-highlighted text to prevent crash
        setRenderedContent(escapeHtml(content).replace(/\n/g, '<br>'));
      }
    }, delay);
  }, [content, colorEngine, engineRevision, disabled]);

  useLayoutEffect(() => {
    if (caretRef.current !== null) {
      setCaretOffset(editorRef.current, caretRef.current);
      caretRef.current = null;
    }
  }, [renderedContent]);

  const handleSave = async () => {
    setValidationError(null);

    // Validation
    if (!content.trim()) {
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
    if (content.length > SCROLL_LIMITS.content) {
      setValidationError({
        field: "content",
        message: `Content must be ${SCROLL_LIMITS.content.toLocaleString()} characters or less`,
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSave?.(title.trim(), content.trim());
      setValidationError(null);
    } catch (err) {
      setValidationError({
        field: "form",
        message: err.message || "Failed to save scroll",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape" && onCancel) {
      onCancel();
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const isOverLimit = charCount > SCROLL_LIMITS.content;
  const remaining = SCROLL_LIMITS.content - charCount;

  const triggerInkEffect = (type) => {
    setInkEffect(type);
    if (effectTimeoutRef.current) {
      clearTimeout(effectTimeoutRef.current);
    }
    effectTimeoutRef.current = setTimeout(() => setInkEffect(null), 240);
  };

  const handleContentChange = (value) => {
    const prevLength = prevLengthRef.current;
    const nextValue =
      value.length > SCROLL_LIMITS.content ? value.slice(0, SCROLL_LIMITS.content) : value;
    setContent(nextValue);
    onContentChange?.(nextValue);
    if (nextValue.length > prevLength) {
      triggerInkEffect("ink");
    } else if (nextValue.length < prevLength) {
      triggerInkEffect("ash");
    }
    prevLengthRef.current = nextValue.length;
  };

  const handleInput = (event) => {
    if (disabled || isSaving || isComposingRef.current) return;
    caretRef.current = getCaretOffset(editorRef.current);
    const rawText = normalizeEditorText(event.currentTarget.innerText);
    handleContentChange(rawText);
  };

  const handlePaste = (event) => {
    if (disabled || isSaving) return;
    event.preventDefault();
    const text = normalizeEditorText(event.clipboardData.getData("text/plain"));
    document.execCommand("insertText", false, text);
  };

  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionEnd = (event) => {
    isComposingRef.current = false;
    handleInput(event);
  };

  const handleWordClick = (e) => {
    if (disabled || isSaving) return;
    const target = e.target;
    if (target.classList.contains("editor-word")) {
      const word = target.innerText;
      onWordClick?.(word);
    }
  };

  const titleError = validationError?.field === "title";
  const contentError = validationError?.field === "content";
  const formError = validationError?.field === "form";

  return (
    <motion.div
      className={`scroll-editor surface ${content.trim() ? "has-text" : "is-empty"} ${
        inkEffect ? `ink-${inkEffect}` : ""
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
        <div className="editor-stats">
          <span className="stat-badge">{wordCount} words</span>
          <span className={`stat-badge ${isOverLimit ? "stat-badge--alert" : ""}`}>
            {charCount} / {SCROLL_LIMITS.content.toLocaleString()} chars
          </span>
        </div>
      </div>

      {(validationError) && (
        <div id="editor-error-message" className="editor-validation-error" role="alert">
          <span className="error-sigil">⚠</span>
          {validationError.message}
        </div>
      )}

      <div className="editor-body">
        <div className="editor-margin" aria-hidden="true">
          <span className="margin-glyph">&#x2609;</span>
          <span className="margin-glyph">&#x263D;</span>
          <span className="margin-glyph">&#x2641;</span>
        </div>
        <label htmlFor="scroll-content" className="sr-only">
          Scroll Content
        </label>
        <div
          ref={editorRef}
          id="scroll-content"
          className="editor-content"
          data-placeholder="Inscribe thy verses upon this sacred parchment...

Click any word after saving to analyze its phonetic structure."
          contentEditable={!disabled && !isSaving}
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-invalid={contentError}
          aria-describedby={contentError ? "editor-error-message" : undefined}
          aria-disabled={disabled || isSaving}
          tabIndex={disabled || isSaving ? -1 : 0}
          onInput={handleInput}
          onClick={handleWordClick}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          spellCheck="false"
          dangerouslySetInnerHTML={{ __html: renderedContent }}
        />
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
            disabled={disabled || isSaving || !content.trim() || isOverLimit}
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
      </div>
    </motion.div>
  );
}
