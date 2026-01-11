import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

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
    if (!content.trim()) return;
    setIsSaving(true);
    try {
      await onSave?.(title, content);
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
      className="scroll-editor"
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
          maxLength={100}
        />
        <div className="editor-stats">
          <span className="stat-badge">{wordCount} words</span>
          <span className="stat-badge">{charCount} chars</span>
        </div>
      </div>

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
