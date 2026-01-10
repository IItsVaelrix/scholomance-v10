import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { CodexUI } from './thaumaturgy-ui.js';
import { PhonemeEngine } from './phoneme.engine.js';

// --- DATA CORE (Migrated from codex-core.js) ---
const LIBRARY = {
  "lexiconic": {
    title: "LEXICONIC SPELL",
    yt: "dQw4w9WgXcQ",
    sc: "123456789", // Replace with real SC Track ID
    school: "SONIC"
  },
  "schism": {
    title: "PSYCHIC SCHISM",
    yt: "3tmd-ClpJxA",
    sc: "987654321", // Replace with real SC Track ID
    school: "PSYCHIC"
  }
};

const Navigation = ({ activeSection }) => {
  const scrollTo = (id) => {
    document.getElementById(id).scrollIntoView({ behavior: 'smooth' });
  };

  const links = ['watch', 'listen', 'read'];

  return (
    <nav className="fixed top-0 left-0 w-full z-50 backdrop-blur-md bg-abyss/80 border-b border-white/10 px-8 py-4 flex justify-between items-center">
      <div className="text-xl font-bold tracking-widest text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
        ◈ SCHOLOMANCE
      </div>
      <div className="flex gap-8 relative">
        {links.map((sec) => (
          <div key={sec} className="relative">
            <button 
              onClick={() => scrollTo(sec)}
              className={`relative z-10 px-4 py-2 text-sm font-bold tracking-wider transition-colors duration-300 ${
                activeSection === sec ? 'text-black' : 'text-gray-400 hover:text-white'
              }`}
            >
              {sec.toUpperCase()}
            </button>
            {activeSection === sec && (
              <motion.div
                layoutId="nav-highlight"
                className="absolute inset-0 bg-white rounded-sm shadow-[0_0_15px_rgba(255,255,255,0.8)]"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </div>
        ))}
      </div>
    </nav>
  );
};

const WatchSection = ({ currentSong }) => (
  <section id="watch" className="min-h-screen flex items-center justify-center p-8 pt-24">
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="w-full max-w-5xl"
    >
      <div className="crt-container relative bg-black rounded-3xl overflow-hidden shadow-2xl shadow-purple-900/20">
        <div className="crt-screen">
          <iframe 
            id="yt-player" 
            width="100%" 
            height="600" 
            src={`https://www.youtube.com/embed/${currentSong.yt}?autoplay=0&enablejsapi=1`}
            frameBorder="0" 
            allow="autoplay; encrypted-media" 
            allowFullScreen
            className="w-full h-[600px] object-cover"
          />
        </div>
      </div>
    </motion.div>
  </section>
);

const Visualizer = ({ color, active }) => (
  <div className="flex items-end justify-center gap-1 h-16 w-full mt-4 opacity-80">
    {active && [...Array(12)].map((_, i) => (
      <motion.div
        key={i}
        className="w-2 rounded-t-sm"
        style={{ backgroundColor: color }}
        animate={{
          height: ["10%", "90%", "30%"],
        }}
        transition={{
          duration: 0.4,
          repeat: Infinity,
          repeatType: "reverse",
          delay: i * 0.05,
          ease: "easeInOut"
        }}
      />
    ))}
  </div>
);

const RadioSection = ({ currentSong, onTune }) => {
  const dialControls = useAnimation();
  const interfaceControls = useAnimation();
  const [isTuning, setIsTuning] = useState(false);
  
  const SCHOOLS = ['VOID', 'PSYCHIC', 'ALCHEMY', 'WILL', 'SONIC'];
  const COLORS = {
    VOID: "#a1a1aa",
    PSYCHIC: "#00E5FF",
    ALCHEMY: "#D500F9",
    WILL: "#FF6600",
    SONIC: "#651FFF"
  };

  const handleTune = async (targetSchool, songKey) => {
    if (isTuning) return;
    setIsTuning(true);  
    onTune(songKey); // Update global state
    const targetAngle = CodexUI.SCHOOL_ANGLES[targetSchool] || 0;
    // Phase 1: Jitter Interface
    interfaceControls.start({
      x: [0, -4, 4, -2, 2, 0],
      y: [0, 2, -2, 1, -1, 0],
      transition: { duration: 0.4 }
    });
    // Phase 2: Spin Dial with Physics
    await dialControls.start({
      rotate: targetAngle,
      transition: { type: "spring", stiffness: 40, damping: 12, mass: 1.2 }
    });
  
    setIsTuning(false);
  };

  const currentColor = COLORS[currentSong.school] || COLORS.VOID;

  return (
    <section id="listen" className="min-h-screen flex items-center justify-center p-8">
      <motion.div
        animate={interfaceControls}
        className="bg-gradient-to-br from-[#0f0f1a] to-[#050508] border border-white/10 p-12 rounded-3xl flex flex-col md:flex-row items-center gap-12 shadow-2xl relative overflow-hidden"
      >
        {/* Background Glow */}
        <motion.div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          animate={{ background: `radial-gradient(circle at 30% 50%, ${currentColor}, transparent 70%)` }}
          transition={{ duration: 1 }}
        />

        {/* Dial Control */}
        <div className="relative group cursor-pointer" onClick={() => {
            // Demo Logic: Cycle between the two available songs
            const nextKey = currentSong.school === 'SONIC' ? 'schism' : 'lexiconic';
            handleTune(LIBRARY[nextKey].school, nextKey);
        }}>
          <motion.div 
            className="w-40 h-40 rounded-full border-4 border-[#1a1a2e] bg-black shadow-[0_0_30px_rgba(0,0,0,0.5)] relative z-10"
            animate={dialControls}
          >
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1 h-8 bg-white/80 shadow-[0_0_10px_white]" />
          </motion.div>
          <div className="absolute inset-0 rounded-full border border-white/5 scale-110 animate-pulse" />
          <div className="mt-6 text-center font-ritual text-sm tracking-widest text-gray-400">
            FREQ: <span style={{ color: currentColor, textShadow: `0 0 10px ${currentColor}` }}>{currentSong.school}</span>
          </div>
        </div>

        {/* Display Panel */}
        <div className="w-full md:w-96 bg-black/50 rounded-xl border border-white/10 p-6 backdrop-blur-sm">
          <h3 id="currentTrackTitle" className="text-xl font-bold mb-4 text-white/90">{currentSong.title}</h3>
          <div className="w-full h-32 bg-black/80 rounded-lg mb-4 overflow-hidden">
             <iframe 
               width="100%" 
               src={`https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${currentSong.sc}&color=%23${currentColor.replace('#','')}&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false`}
             ></iframe>
          </div>
          <Visualizer color={currentColor} active={!isTuning} />
        </div>

      </motion.div>
    </section>
  );
};

const ReadSection = ({ isEngineReady }) => {
  const [annotation, setAnnotation] = useState(null);
  const demoWord = "ETHEREAL";
  
  const analyze = async () => {
    const result = PhonemeEngine.analyzeWord(demoWord);
    if(result) setAnnotation({ word: demoWord, ...result });
  };

  return (
    <section id="read" className="min-h-screen relative p-8 pt-24 flex flex-col items-center">
      <div className="w-full max-w-4xl z-10">
        <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-4">
          <h2 className="text-4xl font-bold tracking-tighter text-white">◈ THE CODEX</h2>
          <button 
            className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded text-sm tracking-widest transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={analyze}
            disabled={!isEngineReady}
          >
            {isEngineReady ? `ANALYZE '${demoWord}'` : 'LOADING ENGINE...'}
          </button>
        </div>
        <div id="editor" className="w-full">
          <div id="preview" className="min-h-[400px] p-12 bg-black/40 backdrop-blur-md rounded-2xl border border-white/5 text-lg leading-loose text-gray-300 font-ritual shadow-2xl">
            Select a word to analyze phonetics...
          </div>
        </div>
      </div>

      {/* Reactive Sidebar */}
      <AnimatePresence>
        {annotation && ( 
          <motion.aside 
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
            className="fixed top-0 right-0 h-full w-80 bg-[#0a0a15]/95 backdrop-blur-xl border-l border-white/10 p-8 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] z-40 flex flex-col"
            id="annotationPanel"
          >
            <div className="flex justify-between items-center mb-12 mt-20">
              <h2 className="text-3xl font-bold" style={{ color: `var(--vowel-${annotation.vowelFamily})` }}>
                {annotation.word}
              </h2>
              <button onClick={() => setAnnotation(null)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            
            <div className="space-y-8 font-ritual">
              <div className="border-b border-white/10 pb-2">
                <span className="text-xs text-gray-500 block mb-1">FAMILY</span>
                <b className="text-xl text-white">{annotation.vowelFamily}</b>
              </div>
              <div className="border-b border-white/10 pb-2">
                <span className="text-xs text-gray-500 block mb-1">PHONEMES</span>
                <b className="text-lg text-white">{annotation.phonemes.join(' · ')}</b>
              </div>
              <div className="border-b border-white/10 pb-2">
                <span className="text-xs text-gray-500 block mb-1">RHYME KEY</span>
                <b className="text-lg text-white">{annotation.rhymeKey}</b>
              </div>
            </div>
          </motion.aside>    
        )}
      </AnimatePresence>
    </section>
  );
};

const App = () => {
  const [activeSection, setActiveSection] = useState('watch');
  const [currentSong, setCurrentSong] = useState(LIBRARY['lexiconic']);
  const [isEngineReady, setIsEngineReady] = useState(false);

  useEffect(() => {
    PhonemeEngine.init().then(() => {
      setIsEngineReady(true);
    });
  }, []);

  const handleTune = (songKey) => {
    if (LIBRARY[songKey]) {
      setCurrentSong(LIBRARY[songKey]);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['watch', 'listen', 'read'];
      const scrollPos = window.scrollY + window.innerHeight / 3;
      
      for (const sec of sections) {
        const el = document.getElementById(sec);
        if (el && el.offsetTop <= scrollPos && (el.offsetTop + el.offsetHeight) > scrollPos) {
          setActiveSection(sec);
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <React.Fragment>
      <Navigation activeSection={activeSection} />
      <WatchSection currentSong={currentSong} />
      <RadioSection currentSong={currentSong} onTune={handleTune} />
      <ReadSection isEngineReady={isEngineReady} />
    </React.Fragment>
  );
};

export default App;