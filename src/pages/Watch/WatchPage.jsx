import { motion } from "framer-motion";
import { useCurrentSong } from "../../hooks/useCurrentSong.jsx";
import { schoolToBadgeClass } from "../../data/library";
import { getStateClass } from "../../js/stateClasses.js";
import "./WatchPage.css";

export default function WatchPage() {
  const { currentSong } = useCurrentSong();
  const schoolClass = getStateClass("school", currentSong.school);

  return (
    <section className={`watchPage surface ${schoolClass}`} data-surface="watch">
      <article className="container surface" data-surface="watch-shell">
        <header className="sectionHeader surface" data-surface="watch-header">
          <div className="kicker">Sonic Thaumaturgy Interface</div>
          <h1 className="title">A ritual UI for rhythm, rhyme, and phoneme alchemy.</h1>
          <p className="subtitle">
            Watch the current invocation, then tune the radio by school-frequency.
            When you&apos;re ready, step into the Codex and inspect the phonetic skeleton of a word.
          </p>
          <div className="badgeRow">
            <span className={`badge ${schoolToBadgeClass(currentSong.school)}`}>
              {currentSong.school}
            </span>
            <span className="badge badge--accent">
              <span className="accent-text">{currentSong.title}</span>
            </span>
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
        >
          <div className="crt-monitor surface" data-surface="watch-monitor">
            {/* Ventilation grille */}
            <div className="crt-grille" aria-hidden="true" />

            {/* Control panel */}
            <div className="crt-controls">
              <div className="crt-led" aria-hidden="true" />
              <div className="crt-brand">SCHOLOMANCE</div>
              <div className="crt-model">ST-XPD</div>
            </div>

            {/* Screen */}
            <div className="crt-screen">
              <div className="crt-screen-edge" aria-hidden="true" />
              <div className="crt-scanlines" aria-hidden="true" />
              <div className="crt-phosphor" aria-hidden="true" />

              <div className="videoFrame">
                <iframe
                  title={`YouTube player: ${currentSong.title}`}
                  src={`https://www.youtube.com/embed/${currentSong.yt}?autoplay=0&rel=0&modestbranding=1`}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>

            {/* Bottom panel with LCD info */}
            <div className="crt-info-panel">
              <div className="lcd-display">
                <span className="lcd-label">SIGNAL</span>
                <span className="lcd-value lcd-value--accent">{currentSong.school}</span>
              </div>
              <div className="lcd-display">
                <span className="lcd-label">TRACK</span>
                <span className="lcd-value">{currentSong.title}</span>
              </div>
              <div className="lcd-display">
                <span className="lcd-label">STATUS</span>
                <span className="lcd-value lcd-active">LOCKED</span>
              </div>
            </div>
          </div>
        </motion.div>
      </article>
    </section>
  );
}
