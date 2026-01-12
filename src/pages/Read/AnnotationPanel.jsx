import { motion } from "framer-motion";
import { useLayoutEffect, useRef, useState, useEffect } from "react";
import { getStateClass } from "../../js/stateClasses.js";

export default function AnnotationPanel({ annotation, onClose }) {
  const vowelEvidence = annotation?.evidence?.find(
    (item) => item.type === "usage" && item.value.startsWith("vowel:")
  );
  const vowelFamily = vowelEvidence ? vowelEvidence.value.slice(6) : "";
  const vowelClass = getStateClass("vowelFamily", vowelFamily);
  const phonemeEvidence = annotation?.evidence?.find(
    (item) => item.type === "phoneme" && !item.value.startsWith("coda:")
  );
  const phonemes = phonemeEvidence?.value?.split(/\s+/).filter(Boolean) || [];
  const rhymeKey = annotation?.evidence?.find((item) => item.type === "rhyme")?.value || "";
  const definitions = annotation?.evidence
    ?.filter((item) => item.type === "definition")
    .map((item) => item.value) || [];
  const codaEvidence = annotation?.evidence?.find(
    (item) => item.type === "phoneme" && item.value.startsWith("coda:")
  );
  const coda = codaEvidence ? codaEvidence.value.slice(5) : null;
  const panelRef = useRef(null);
  const closeButtonRef = useRef(null);
  const resizeRef = useRef(null);
  const [constraints, setConstraints] = useState(null);

  // Handle keyboard events (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Handle focus on open
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useLayoutEffect(() => {
    const updateConstraints = () => {
      if (!panelRef.current) return;
      const rect = panelRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const left = -rect.left;
      const top = -rect.top;
      const right = viewportWidth - (rect.left + rect.width);
      const bottom = viewportHeight - (rect.top + rect.height);
      setConstraints({ left, top, right, bottom });
    };

    updateConstraints();
    const handleResize = () => {
      requestAnimationFrame(updateConstraints);
    };
    window.addEventListener("resize", handleResize);
    if (panelRef.current && window.ResizeObserver) {
      resizeRef.current = new ResizeObserver(() => {
        requestAnimationFrame(updateConstraints);
      });
      resizeRef.current.observe(panelRef.current);
    }
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <motion.aside
      className={`aside aside--grimoire surface annotation-panel ${vowelClass}`}
      data-surface="analysis"
      data-role="overlay"
      initial={{ y: 18, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 18, opacity: 0 }}
      transition={{ type: "spring", damping: 22 }}
      drag
      dragConstraints={constraints || undefined}
      dragMomentum={false}
      dragElastic={0.12}
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="annotation-title"
    >
      {/* Leather panel texture */}
      <div className="aside-texture" aria-hidden="true" />

      <div className="analysis-shell" data-role="analysis">
        <div className="asideTop">
          <h3
            id="annotation-title"
            className="asideTitle accent-text"
          >
            {annotation.token}
          </h3>
          <button
            ref={closeButtonRef}
            className="close grimoire-close"
            onClick={onClose}
            aria-label="Close"
          >
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
              {vowelFamily || "Unknown"}
            </div>
          </div>

          <div className="stat grimoire-stat">
            <div className="statLabel">
              <span className="stat-sigil">&#x2727;</span>
              Phonemes
            </div>
            <div className="statValue phoneme-list">
              {phonemes.map((p, i) => (
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
            <div className="statValue rhyme-key">{rhymeKey || "Unknown"}</div>
          </div>

          {definitions.length ? (
            <div className="stat grimoire-stat">
              <div className="statLabel">
                <span className="stat-sigil">&#x2736;</span>
                Definition
              </div>
              <div className="statValue definition-list">
                {definitions.map((definition, index) => (
                  <div key={index} className="definition-item">
                    {definition}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {coda && (
            <div className="stat grimoire-stat">
              <div className="statLabel">
                <span className="stat-sigil">&#x2729;</span>
                Coda
              </div>
              <div className="statValue">{coda}</div>
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
