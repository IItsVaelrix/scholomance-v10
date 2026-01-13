import { motion } from "framer-motion";
import { useEffect, useRef } from "react";

export default function AnnotationPanel({ annotation, onClose }) {
  const closeRef = useRef(null);
  const previousFocus = useRef(document.activeElement);

  useEffect(() => {
    // Focus close button on open
    closeRef.current?.focus();
    const nodeToRestore = previousFocus.current;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      // Restore focus on close
      nodeToRestore?.focus();
    };
  }, [onClose]);

  return (
    <motion.aside
      className="aside aside--grimoire"
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 22 }}
      aria-label="Word annotation panel"
      role="complementary"
    >
      {/* Leather panel texture */}
      <div className="aside-texture" aria-hidden="true" />

      <div className="asideTop">
        <h3
          className="asideTitle"
          style={{
            color: `var(--vowel-${annotation.vowelFamily})`,
          }}
        >
          {annotation.word}
        </h3>
        <button 
          ref={closeRef}
          className="close grimoire-close" 
          onClick={onClose} 
          aria-label="Close"
        >
          <span>&#x2715;</span>
        </button>
      </div>

      <div className="annotation-content">
        {/* Phonetic Section */}
        <div className="annotation-section-title">Phonetic Structure</div>
        
        <div className="stat grimoire-stat">
          <div className="statLabel">
            <span className="stat-sigil">&#x2726;</span>
            Vowel Family
          </div>
          <div
            className="statValue"
            style={{ color: `var(--vowel-${annotation.vowelFamily})` }}
          >
            {annotation.vowelFamily}
          </div>
        </div>

        <div className="stat grimoire-stat">
          <div className="statLabel">
            <span className="stat-sigil">&#x2727;</span>
            Phonemes
          </div>
          <div className="statValue phoneme-list">
            {annotation.phonemes.map((p, i) => (
              <span key={i} className="phoneme-chip">
                {p}
              </span>
            ))}
          </div>
        </div>

        <div className="stat grimoire-stat">
          <div className="statLabel">
            <span className="stat-sigil">&#x2728;</span>
            Rhyme Key
          </div>
          <div className="statValue rhyme-key">{annotation.rhymeKey}</div>
        </div>

        {/* Semantic Section */}
        <div className="annotation-section-title mt-6">Lexical Meaning</div>
        
        {annotation.definition ? (
          <div className="stat grimoire-stat">
            <div className="statLabel italic">
              {annotation.definition.partOfSpeech}
            </div>
            <div className="statValue definition-text">
              {annotation.definition.text}
              <div className="text-xs opacity-50 mt-1">Source: {annotation.definition.source}</div>
            </div>
          </div>
        ) : (
          <div className="text-xs opacity-50 italic px-4">No definition found.</div>
        )}

        {annotation.synonyms?.length > 0 && (
          <div className="stat grimoire-stat">
            <div className="statLabel">Synonyms</div>
            <div className="statValue flex flex-wrap gap-2">
              {annotation.synonyms.slice(0, 8).map((syn, i) => (
                <span key={syn} className="text-sm opacity-80 underline decoration-dotted">
                  {syn}{i < Math.min(annotation.synonyms.length, 8) - 1 ? "," : ""}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Rhyme Section */}
        <div className="annotation-section-title mt-6">Resonance (Rhymes)</div>
        {annotation.rhymes?.length > 0 ? (
          <div className="stat grimoire-stat">
            <div className="statValue flex flex-wrap gap-2">
              {annotation.rhymes.slice(0, 12).map((r) => (
                <span key={r} className="phoneme-chip opacity-90 border-soft">
                  {r}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-xs opacity-50 italic px-4">No rhymes discovered.</div>
        )}
      </div>

      <div className="aside-footer">
        <div className="grimoire-divider">
          <span>&#x2767;</span>
        </div>
        <p className="aside-note">
          Word analysis powered by the ST-XPD vowel family system.
        </p>
      </div>
    </motion.aside>
  );
}
