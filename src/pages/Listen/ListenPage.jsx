import { useState, useMemo } from "react";
import { motion, useAnimation } from "framer-motion";
import { useCurrentSong } from "../../hooks/useCurrentSong.jsx";
import { COLORS, LIBRARY } from "../../data/library";
import NixieTube from "./NixieTube.jsx";
import BrassGearDial from "./BrassGearDial.jsx";
import HolographicEmbed from "./HolographicEmbed.jsx";
import { getStateClass } from "../../js/stateClasses.js";
import "./ListenPage.css";

export default function ListenPage() {
  const { currentKey, currentSong, setCurrentKey } = useCurrentSong();
  const [isTuning, setIsTuning] = useState(false);
  const interfaceControls = useAnimation();

  const currentColor = COLORS[currentSong.school] || COLORS.VOID;
  const schoolClass = getStateClass("school", currentSong.school);
  const entries = useMemo(() => Object.entries(LIBRARY), []);

  const handleTune = async (targetSchool, songKey) => {
    if (isTuning) return;
    setIsTuning(true);

    // Update song immediately for responsiveness
    setCurrentKey(songKey);

    // Jitter animation
    await interfaceControls.start({
      x: [0, -4, 4, -2, 2, 0],
      y: [0, 2, -2, 1, -1, 0],
      transition: { duration: 0.42 },
    });

    setIsTuning(false);
  };

  // Convert school to frequency display
  const getFrequency = (school) => {
    const freqMap = {
      VOID: "00.0",
      PSYCHIC: "72.0",
      ALCHEMY: "144",
      WILL: "216",
      SONIC: "288",
    };
    return freqMap[school] || "00.0";
  };

  return (
    <section className={`listenPage surface ${schoolClass}`} data-surface="listen">
      <article className="container surface" data-surface="listen-shell">
        <header className="sectionHeader surface" data-surface="listen-header">
          <div className="kicker">Aetheric Frequency Modulator</div>
          <h1 className="title">Tune the school. Lock the signal.</h1>
          <p className="subtitle">
            Rotate the brass dial to cycle frequencies, or select a track below for precise calibration.
          </p>
        </header>

        <motion.div
          className="radio-cabinet"
          animate={interfaceControls}
        >
          {/* Ambient glow */}
          <div className="radio-glow" aria-hidden="true" />

          {/* Top panel with nixie tubes */}
          <div className="nixie-panel">
            <div className="nixie-label">FREQUENCY</div>
            <div className="nixie-display">
              {getFrequency(currentSong.school).split("").map((digit, i) => (
                <NixieTube key={i} value={digit} index={i} />
              ))}
            </div>
            <div className="nixie-unit">MHz</div>
          </div>

          {/* Main control area */}
          <div className="radio-main">
            {/* Brass dial section */}
            <div className="dial-section">
              <BrassGearDial
                school={currentSong.school}
                onTune={() => {
                  const keys = entries.map(([k]) => k);
                  const idx = Math.max(0, keys.indexOf(currentKey));
                  const nextKey = keys[(idx + 1) % keys.length];
                  const next = LIBRARY[nextKey];
                  handleTune(next.school, nextKey);
                }}
                disabled={isTuning}
              />
              <div className="dial-label">
                <span className="dial-school">
                  {currentSong.school}
                </span>
                <span className="dial-status">LOCKED</span>
              </div>
            </div>

            {/* Player section */}
            <div className="player-section">
              <div className="player-header">
                <h3 className="player-title">{currentSong.title}</h3>
                <div className="oscilloscope">
                  <div className="oscilloscope-wave" />
                  <div className="oscilloscope-grid" />
                </div>
              </div>

              <HolographicEmbed
                trackId={currentSong.sc}
                color={currentColor}
              />

              {/* Visualizer bars */}
              <div className="vacuum-visualizer">
                {Array.from({ length: 14 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="vacuum-bar"
                    animate={!isTuning ? { height: [10, 50, 20, 60, 15] } : { height: 10 }}
                    transition={{
                      duration: 0.55,
                      repeat: Infinity,
                      repeatType: "mirror",
                      delay: i * 0.05,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Track selection grid */}
          <div className="track-panel">
            <div className="track-panel-header">
              <span className="rivet" />
              <span className="track-panel-title">SIGNAL ARCHIVE</span>
              <span className="rivet" />
            </div>
            <div className="trackGrid">
              {entries.map(([key, t]) => {
                const active = key === currentKey;
                const trackSchoolClass = getStateClass("school", t.school);
                return (
                  <button
                    key={key}
                    className={`trackCard ${trackSchoolClass} ${active ? "trackCardActive" : ""}`}
                    onClick={() => handleTune(t.school, key)}
                    disabled={isTuning}
                  >
                    <div className="trackTop">
                      <span className="vacuum-indicator" />
                      <p className="trackTitle">{t.title}</p>
                    </div>
                    <div className="trackMeta">{t.school} FREQ</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Decorative elements */}
          <div className="cabinet-screws">
            <span className="screw screw-tl" />
            <span className="screw screw-tr" />
            <span className="screw screw-bl" />
            <span className="screw screw-br" />
          </div>
        </motion.div>
      </article>
    </section>
  );
}
