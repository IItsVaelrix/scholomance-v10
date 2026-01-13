import { useMemo, useCallback } from "react";

export default function GrimoireScroll({
  text,
  analyzedWords = {}, // Map of UPPERCASE word -> analysis object
  onWordClick,
  disabled,
  onAnalyzeEthereal,
  isEngineReady,
}) {
  const handleKeyDown = useCallback((e, word) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const clean = word.replace(/[^A-Za-z']/g, "");
      if (clean && !disabled) {
        onWordClick?.(clean);
      }
    }
  }, [disabled, onWordClick]);

  const renderWords = useMemo(() => {
    const parts = text.split(/(\s+)/);
    return parts.map((p, i) => {
      if (/^\s+$/.test(p)) {
        return (
          <span key={i} className="grimoire-space" aria-hidden="true">
            {p}
          </span>
        );
      }
      
      const clean = p.replace(/[^A-Za-z']/g, "").toUpperCase();
      const analysis = analyzedWords[clean];
      const wordClasses = ["grimoire-word"];
      
      if (analysis?.vowelFamily) {
        wordClasses.push(`rhyme-${analysis.vowelFamily}`);
      }

      return (
        <button
          key={i}
          className={wordClasses.join(" ")}
          disabled={disabled || !clean}
          onClick={() => onWordClick?.(clean)}
          onKeyDown={(e) => handleKeyDown(e, clean)}
          aria-label={`Analyze word: ${clean}`}
          aria-disabled={disabled || !clean}
          title={disabled ? "Awakening the engine..." : "Analyze this word"}
          data-rhyme-key={analysis?.rhymeKey}
        >
          {p}
        </button>
      );
    });
  }, [text, disabled, onWordClick, handleKeyDown, analyzedWords]);

  return (
    <div className="grimoire-cover" role="document">
      {/* Leather texture overlay */}
      <div className="leather-texture" aria-hidden="true" />

      {/* Corner flourishes */}
      <div className="grimoire-corner grimoire-corner--tl" aria-hidden="true" />
      <div className="grimoire-corner grimoire-corner--tr" aria-hidden="true" />
      <div className="grimoire-corner grimoire-corner--bl" aria-hidden="true" />
      <div className="grimoire-corner grimoire-corner--br" aria-hidden="true" />

      {/* Spine detail */}
      <div className="grimoire-spine" aria-hidden="true">
        <div className="spine-band" />
        <div className="spine-band" />
        <div className="spine-band" />
      </div>

      {/* Book title on cover */}
      <div className="grimoire-cover-title">
        <span className="cover-sigil">ST-XPD</span>
        <span className="cover-text">Phoneme Codex</span>
      </div>

      {/* The actual page */}
      <div className="parchment">
        {/* Paper texture and aging effects */}
        <div className="parchment-texture" aria-hidden="true" />
        <div className="ink-stain ink-stain--1" aria-hidden="true" />
        <div className="ink-stain ink-stain--2" aria-hidden="true" />
        <div className="coffee-ring" aria-hidden="true" />

        {/* Page header */}
        <div className="page-header">
          <div className="page-ornament">&#x2767;</div>
          <span className="page-title">Click-to-Analyze Scroll</span>
          <div className="page-ornament">&#x2619;</div>
        </div>

        {/* Margin symbols */}
        <div className="margin-symbols" aria-hidden="true">
          <span className="margin-symbol" style={{ top: "20%" }}>&#x2609;</span>
          <span className="margin-symbol" style={{ top: "40%" }}>&#x263D;</span>
          <span className="margin-symbol" style={{ top: "60%" }}>&#x2641;</span>
          <span className="margin-symbol" style={{ top: "80%" }}>&#x2644;</span>
        </div>

        {/* Scroll text content */}
        <div className="grimoire-text" aria-label="Scroll content">
          <span className="drop-cap" aria-hidden="true">E</span>
          {renderWords}
        </div>

        {/* Page footer with action */}
        <div className="page-footer">
          <div className="grimoire-divider">
            <span>&#x2726;</span>
          </div>
          <button
            className="grimoire-button"
            onClick={onAnalyzeEthereal}
            disabled={!isEngineReady}
            aria-label={isEngineReady 
              ? "Analyze all words in scroll" 
              : "Phoneme engine initializing"}
          >
            {isEngineReady ? (
              <>
                <span className="button-sigil">&#x2605;</span>
                Analyze ETHEREAL
              </>
            ) : (
              <>
                <span className="button-sigil spinning">&#x263C;</span>
                Awakening Engine...
              </>
            )}
          </button>
        </div>

        {/* Page number */}
        <div className="page-number">&#x2014; I &#x2014;</div>
      </div>
    </div>
  );
}
