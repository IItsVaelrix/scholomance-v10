import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { usePhonemeEngine } from "../../hooks/usePhonemeEngine.jsx";
import { useScrolls } from "../../hooks/useScrolls.jsx";
import GrimoireScroll from "./GrimoireScroll.jsx";
import AnnotationPanel from "./AnnotationPanel.jsx";
import ScrollEditor from "./ScrollEditor.jsx";
import ScrollList from "./ScrollList.jsx";
import "./ReadPage.css";

export default function ReadPage() {
  const { isReady, engine } = usePhonemeEngine();
  const { scrolls, createScroll, updateScroll, deleteScroll, getScrollById } = useScrolls();

  const [annotation, setAnnotation] = useState(null);
  const [activeScrollId, setActiveScrollId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState("editor"); // "editor" | "viewer"

  const activeScroll = activeScrollId ? getScrollById(activeScrollId) : null;

  const analyze = useCallback(
    (word) => {
      const clean = String(word || "")
        .replace(/[^A-Za-z']/g, "")
        .toUpperCase();
      if (!clean) return;

      const result = engine.analyzeWord(clean);
      if (result) {
        setAnnotation({
          word: clean,
          ...result,
          rhymeKey: result.rhymeKey ?? `${result.vowelFamily}-${result.coda ?? ""}`,
        });
      }
    },
    [engine]
  );

  const handleSaveScroll = useCallback(
    (title, content) => {
      if (isEditing && activeScrollId) {
        updateScroll(activeScrollId, { title, content });
        setIsEditing(false);
        setViewMode("viewer");
      } else {
        const newScroll = createScroll(title, content);
        setActiveScrollId(newScroll.id);
        setViewMode("viewer");
      }
    },
    [isEditing, activeScrollId, updateScroll, createScroll]
  );

  const handleSelectScroll = useCallback((id) => {
    setActiveScrollId(id);
    setIsEditing(false);
    setViewMode("viewer");
    setAnnotation(null);
  }, []);

  const handleNewScroll = useCallback(() => {
    setActiveScrollId(null);
    setIsEditing(false);
    setViewMode("editor");
    setAnnotation(null);
  }, []);

  const handleEditScroll = useCallback(() => {
    setIsEditing(true);
    setViewMode("editor");
  }, []);

  const handleDeleteScroll = useCallback(
    (id) => {
      deleteScroll(id);
      if (activeScrollId === id) {
        setActiveScrollId(null);
        setViewMode("editor");
      }
    },
    [deleteScroll, activeScrollId]
  );

  const handleCancelEdit = useCallback(() => {
    if (activeScrollId) {
      setIsEditing(false);
      setViewMode("viewer");
    } else {
      setViewMode("editor");
    }
  }, [activeScrollId]);

  return (
    <section className="readPage">
      {/* Ambient candlelight */}
      <div className="candle-ambience" aria-hidden="true" />
      <div className="candle-ambience candle-ambience--secondary" aria-hidden="true" />

      <div className="container">
        <header className="sectionHeader grimoire-header">
          <div className="kicker">The Arcane Codex</div>
          <h1 className="title grimoire-title">
            <span className="illuminated-letter">S</span>cribe &amp; Analyze
          </h1>
          <p className="subtitle grimoire-subtitle">
            Inscribe thy verses upon sacred scrolls. Each word becomes a portal —
            click to unveil its vowel-family, phonemes, and rhyme key.
          </p>
        </header>

        <div className="codex-layout">
          {/* Left Panel: Scroll List */}
          <aside className="codex-sidebar">
            <ScrollList
              scrolls={scrolls}
              activeScrollId={activeScrollId}
              onSelect={handleSelectScroll}
              onDelete={handleDeleteScroll}
              onNewScroll={handleNewScroll}
            />
          </aside>

          {/* Right Panel: Editor or Viewer */}
          <main className="codex-main">
            <AnimatePresence mode="wait">
              {viewMode === "editor" ? (
                <ScrollEditor
                  key={isEditing ? `edit-${activeScrollId}` : "new"}
                  initialTitle={isEditing && activeScroll ? activeScroll.title : ""}
                  initialContent={isEditing && activeScroll ? activeScroll.content : ""}
                  onSave={handleSaveScroll}
                  onCancel={isEditing ? handleCancelEdit : undefined}
                  isEditing={isEditing}
                  disabled={!isReady}
                />
              ) : activeScroll ? (
                <div key={`view-${activeScrollId}`} className="scroll-viewer">
                  <div className="viewer-header">
                    <h2 className="viewer-title">{activeScroll.title}</h2>
                    <button
                      type="button"
                      className="viewer-edit-btn"
                      onClick={handleEditScroll}
                    >
                      <span>&#x270E;</span> Edit
                    </button>
                  </div>
                  <GrimoireScroll
                    text={activeScroll.content}
                    onWordClick={analyze}
                    disabled={!isReady}
                    onAnalyzeEthereal={() => {
                      const words = activeScroll.content.split(/\s+/);
                      if (words.length > 0) analyze(words[0]);
                    }}
                    isEngineReady={isReady}
                  />
                </div>
              ) : (
                <div className="scroll-placeholder">
                  <div className="placeholder-sigil">&#x1F4DC;</div>
                  <h3>Select or Create a Scroll</h3>
                  <p>Choose a scroll from the list or start a new inscription.</p>
                  <button
                    type="button"
                    className="grimoire-button"
                    onClick={handleNewScroll}
                  >
                    <span className="button-sigil">&#x271A;</span>
                    Begin New Scroll
                  </button>
                </div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>

      <AnimatePresence>
        {annotation && (
          <AnnotationPanel
            annotation={annotation}
            onClose={() => setAnnotation(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
