import { useState, useEffect } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';
import { SCROLL_LIMITS } from "../../data/scrollLimits";

const theme = {
  // Using the existing CSS classes from ReadPage.css
  ltr: 'ltr',
  rtl: 'rtl',
  placeholder: 'editor-placeholder', // This class doesn't exist, placeholder is handled by a div
  paragraph: 'editor-line', // Lexical's paragraph will be our line
};

function onError(error) {
  console.error(error);
}

// Plugin to initialize the editor with plain text content
function PlainTextInitPlugin({ content }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    editor.update(() => {
      const root = $getRoot();
      root.clear();
      const lines = content.split('\n');
      lines.forEach(line => {
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
    const handleClick = (event) => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const node = selection.anchorNode;

      if (node?.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        if (!text) return;

        let start = range.startOffset;
        let end = range.startOffset;

        // Expand to word boundaries
        while (start > 0 && text[start - 1].match(/\w/)) {
          start--;
        }
        while (end < text.length && text[end].match(/\w/)) {
          end++;
        }

        const word = text.substring(start, end);
        if (word) {
          onWordClick?.(word);
        }
      }
    };

    const editorElement = editor.getRootElement();
    if (editorElement) {
      editorElement.addEventListener('click', handleClick);
      return () => editorElement.removeEventListener('click', handleClick);
    }
  }, [editor, onWordClick]);

  return null;
}


export default function ScrollEditorLexical({
  initialTitle = "",
  initialContent = "",
  onSave,
  onContentChange,
  onCancel,
  isEditing = false,
  disabled = false,
  onWordClick,
}) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState(null);

  const initialConfig = {
    namespace: 'ScholomanceEditor',
    theme,
    onError,
    editable: !disabled && !isSaving,
  };

  const handleOnChange = (editorState) => {
    editorState.read(() => {
      const root = $getRoot();
      const text = root.getTextContent();
      setContent(text);
      onContentChange?.(text);
    });
  };

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
  
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const isOverLimit = charCount > SCROLL_LIMITS.content;
  const remaining = SCROLL_LIMITS.content - charCount;

  return (
    <div className={`scroll-editor ${content.trim() ? "has-text" : "is-empty"}`}>
      <div className="editor-header">
        <input
          type="text"
          id="scroll-title"
          className="editor-title-input"
          placeholder="Scroll Title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={disabled || isSaving}
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
        <LexicalComposer initialConfig={initialConfig}>
          <RichTextPlugin
            contentEditable={<ContentEditable className="editor-content" />}
            placeholder={<div className="editor-placeholder">Inscribe thy verses upon this sacred parchment...</div>}
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <AutoFocusPlugin />
          <PlainTextInitPlugin content={initialContent} />
          <OnChangePlugin onChange={handleOnChange} />
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
            disabled={disabled || isSaving || !content.trim() || isOverLimit}
          >
            {isSaving ? "Inscribing..." : (isEditing ? "Update Scroll" : "Save Scroll")}
          </button>
        </div>
      </div>
    </div>
  );
}



