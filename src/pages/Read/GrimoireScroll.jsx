import { useMemo } from "react";

export default function GrimoireScroll({
  text,
  onWordClick,
  disabled,
  onAnalyzeEthereal,
  isEngineReady,
}) {
  const renderWords = useMemo(() => {
    const parts = text.split(/(\s+)/);
    return parts.map((p, i) => {
      if (/^\s+$/.test(p)) {
        return (
          <span key={i} className="grimoire-space">
            {p}
          </span>
        );
      }
      const clean = p.replace(/[^A-Za-z']/g, "");
      return (
        <button
          key={i}
          className="grimoire-word"
          disabled={disabled || !clean}
          onClick={() => onWordClick?.(clean)}
          title={disabled ? "Awakening the engine..." : "Analyze this word"}
        >
          {p}
        </button>
      );
    });
  }, [text, disabled, onWordClick]);

  return (
    <div className="grimoire-cover surface" data-surface="scroll">
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
          <span className="margin-symbol margin-symbol--1">&#x2609;</span>
          <span className="margin-symbol margin-symbol--2">&#x263D;</span>
          <span className="margin-symbol margin-symbol--3">&#x2641;</span>
          <span className="margin-symbol margin-symbol--4">&#x2644;</span>
        </div>

        {/* Scroll text content */}
        <div className="grimoire-text">
          <span className="drop-cap">E</span>
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
