import { motion } from "framer-motion";
import { getStateClass } from "../../js/stateClasses.js";

export default function AnnotationPanel({ annotation, onClose }) {
  const vowelClass = getStateClass("vowelFamily", annotation?.vowelFamily);

  return (
    <motion.aside
      className={`aside aside--grimoire surface annotation-panel ${vowelClass}`}
      data-surface="analysis"
      data-role="overlay"
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", damping: 22 }}
      aria-label="Word annotation panel"
    >
      {/* Leather panel texture */}
      <div className="aside-texture" aria-hidden="true" />

      <div className="analysis-shell" data-role="analysis">
        <div className="asideTop">
          <h3
            className="asideTitle accent-text"
          >
            {annotation.word}
          </h3>
          <button className="close grimoire-close" onClick={onClose} aria-label="Close">
            <span>&#x2715;</span>
          </button>
        </div>

        <div className="annotation-content">
          <div className="stat grimoire-stat">
            <div className="statLabel">
              <span className="stat-sigil">&#x2726;</span>
              Vowel Family
            </div>
            <div
              className="statValue accent-text"
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

          {annotation.coda && (
            <div className="stat grimoire-stat">
              <div className="statLabel">
                <span className="stat-sigil">&#x2729;</span>
                Coda
              </div>
              <div className="statValue">{annotation.coda}</div>
            </div>
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
      </div>
    </motion.aside>
  );
}
