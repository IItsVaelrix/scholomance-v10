import { useState, useCallback, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { usePhonemeEngine } from "../../hooks/usePhonemeEngine.jsx";
import { useScrolls } from "../../hooks/useScrolls.jsx";
import { useProgression } from "../../hooks/useProgression.jsx";
import { XP_SOURCES } from "../../data/progression_constants.js";
import { ReferenceEngine } from "../../lib/reference.engine.js";
import GrimoireScroll from "./GrimoireScroll.jsx";
import AnnotationPanel from "./AnnotationPanel.jsx";
import ScrollEditor from "./ScrollEditor.jsx";
import ScrollList from "./ScrollList.jsx";
import "./ReadPage.css";

export default function ReadPage() {
  const { isReady, engine } = usePhonemeEngine();
  const { scrolls, createScroll, updateScroll, deleteScroll, getScrollById } =
    useScrolls();
  const { addXP } = useProgression(); // NEW

  const [annotation, setAnnotation] = useState(null);
  const [analyzedWords, setAnalyzedWords] = useState({}); // Track analyzed words
  const [activeScrollId, setActiveScrollId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState("editor"); // "editor" | "viewer"
  const [announcement, setAnnouncement] = useState(""); // NEW: For screen readers
  const [isTruesight, setIsTruesight] = useState(false); // Truesight toggle

  const activeScroll = activeScrollId ? getScrollById(activeScrollId) : null;

  // Create announcement when annotation changes
  useEffect(() => {
    if (annotation) {
      setAnnouncement(
        `${annotation.word}: ${annotation.vowelFamily} vowel family, ` +
        `${annotation.phonemes.length} phonemes, ` +
        `rhyme key ${annotation.rhymeKey}`
      );
    } else {
      setAnnouncement("");
    }
  }, [annotation]);

  // Handle Truesight activation
  useEffect(() => {
    if (isTruesight && activeScroll && engine && isReady) {
      const words = activeScroll.content.split(/\s+/);
      const newAnalysis = { ...analyzedWords };
      let hasUpdates = false;

      words.forEach(word => {
        const clean = word.replace(/[^A-Za-z']/g, "").toUpperCase();
        if (clean && !newAnalysis[clean]) {
          const result = engine.analyzeWord(clean);
          if (result) {
            newAnalysis[clean] = {
              word: clean,
              ...result,
              rhymeKey: result.rhymeKey ?? `${result.vowelFamily}-${result.coda ?? ""}`
            };
            hasUpdates = true;
          }
        }
      });

      if (hasUpdates) {
        setAnalyzedWords(newAnalysis);
      }
    }
  }, [isTruesight, activeScroll, engine, isReady]);

  const analyze = useCallback(
    async (word) => {
      const clean = String(word || "")
        .replace(/[^A-Za-z']/g, "")
        .toUpperCase();
      if (!clean) return;

      const result = engine.analyzeWord(clean);
      if (result) {
        const rhymeKey =
          result.rhymeKey ?? `${result.vowelFamily}-${result.coda ?? ""}`;
        
        // Fetch external references
        const references = await ReferenceEngine.fetchAll(clean);

        const analysis = {
          word: clean,
          ...result,
          rhymeKey,
          ...references // Add definition, synonyms, rhymes
        };

        setAnnotation(analysis);
        setAnalyzedWords((prev) => ({ ...prev, [clean]: analysis }));
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
        // Award XP for creating scroll - NEW
        addXP(XP_SOURCES.SCROLL_CREATED, "scroll-creation");
      }
    },
    [isEditing, activeScrollId, updateScroll, createScroll, addXP]
  );

  const handleSelectScroll = useCallback((id) => {
    setActiveScrollId(id);
    setIsEditing(false);
    setViewMode("viewer");
    setAnnotation(null);
    setAnalyzedWords({}); // Reset analyzed words
    setIsTruesight(false); // Reset Truesight
  }, []);

  const handleNewScroll = useCallback(() => {
    setActiveScrollId(null);
    setIsEditing(false);
    setViewMode("editor");
    setAnnotation(null);
    setAnalyzedWords({}); // Reset analyzed words
    setIsTruesight(false); // Reset Truesight
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
    <section className="readPage page-theme--read">
      {/* Live region for screen reader announcements */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      <div className="container">
        <header className="grimoire-header">
          <div className="kicker">The Arcane Codex</div>
          <h1 className="grimoire-title">Scribe &amp; Analyze</h1>
          <p className="grimoire-subtitle">
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
                <div key={`view-${activeScrollId}`} className="flex flex-col gap-6 h-full animate-fadeIn">
                  <div className="flex items-center justify-between glass p-6 rounded-xl border-soft">
                    <h2 className="text-2xl font-bold text-primary">{activeScroll.title}</h2>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        className={`btn ${isTruesight ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setIsTruesight(!isTruesight)}
                        title="Reveal rhyme families"
                      >
                        <span className="btn-icon">👁</span>
                        {isTruesight ? "Truesight: ON" : "Truesight: OFF"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleEditScroll}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                  <GrimoireScroll
                    text={activeScroll.content}
                    analyzedWords={analyzedWords}
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
                <div className="scroll-placeholder animate-scaleIn">
                  <div className="placeholder-sigil">📜</div>
                  <h3 className="text-2xl font-bold mb-4">Select or Create a Scroll</h3>
                  <p className="mb-8">Choose a scroll from the list or start a new inscription.</p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleNewScroll}
                  >
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