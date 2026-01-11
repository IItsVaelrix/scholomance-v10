import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

const MAX_TITLE_LENGTH = 100;
const MAX_CONTENT_LENGTH = 100000; // ~100KB text limit for localStorage safety

export default function ScrollEditor({
  initialTitle = "",
  initialContent = "",
  onSave,
  onCancel,
  isEditing = false,
  disabled = false,
}) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    setTitle(initialTitle);
    setContent(initialContent);
  }, [initialTitle, initialContent]);

  useEffect(() => {
    if (textareaRef.current && !initialContent) {
      textareaRef.current.focus();
    }
  }, [initialContent]);

  const handleSave = async () => {
    setValidationError(null);

    // Validation
    if (!content.trim()) {
      setValidationError("Content cannot be empty");
      return;
    }
    if (title.length > MAX_TITLE_LENGTH) {
      setValidationError(`Title must be ${MAX_TITLE_LENGTH} characters or less`);
      return;
    }
    if (content.length > MAX_CONTENT_LENGTH) {
      setValidationError(`Content must be ${MAX_CONTENT_LENGTH.toLocaleString()} characters or less`);
      return;
    }

    setIsSaving(true);
    try {
      await onSave?.(title.trim(), content.trim());
      setValidationError(null);
    } catch (err) {
      setValidationError(err.message || "Failed to save scroll");
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

  return (
    <motion.div
      className="scroll-editor surface"
      data-surface="editor"
      data-role="editor"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <div className="editor-header">
        <input
          type="text"
          className="editor-title-input"
          placeholder="Scroll Title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={disabled || isSaving}
          maxLength={MAX_TITLE_LENGTH}
        />
        <div className="editor-stats">
          <span className="stat-badge">{wordCount} words</span>
          <span className="stat-badge">{charCount} / {MAX_CONTENT_LENGTH.toLocaleString()} chars</span>
        </div>
      </div>

      {validationError && (
        <div className="editor-validation-error">
          <span className="error-sigil">⚠</span>
          {validationError}
        </div>
      )}

      <div className="editor-body">
        <div className="editor-margin" aria-hidden="true">
          <span className="margin-glyph">&#x2609;</span>
          <span className="margin-glyph">&#x263D;</span>
          <span className="margin-glyph">&#x2641;</span>
        </div>
        <textarea
          ref={textareaRef}
          className="editor-textarea"
          placeholder="Inscribe thy verses upon this sacred parchment...

Click any word after saving to analyze its phonetic structure."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isSaving}
          maxLength={MAX_CONTENT_LENGTH}
          spellCheck="false"
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
            disabled={disabled || isSaving || !content.trim()}
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
