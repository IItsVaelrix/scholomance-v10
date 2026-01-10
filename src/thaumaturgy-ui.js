// js/thaumaturgy-ui.js
export const CodexUI = {
  // Master School mapping for Dial Rotations
  SCHOOL_ANGLES: { VOID: 0, PSYCHIC: 72, ALCHEMY: 144, WILL: 216, SONIC: 288 },

  tuneRadio(school) {
    const targetAngle = this.SCHOOL_ANGLES[school] || 0;
    const radioDial = "#radioDial";
    const radioInterface = ".radio-interface";

    // Stop any current ritual animations to prevent logic collisions
    gsap.killTweensOf([radioDial, radioInterface]);

    const tl = gsap.timeline();

    // Phase 1: The "Jitter" (Searching for the frequency)
    tl.to(radioInterface, {
      x: () => (Math.random() - 0.5) * 4,
      y: () => (Math.random() - 0.5) * 4,
      duration: 0.1,
      repeat: 6,
      ease: "rough({ template: none, strength: 1, points: 20, taper: 'none', randomize: true })",
      clearProps: "x,y" // Restore integrity of layout after jitter
    });

    // Phase 2: The Seek (Turning the dial with physical noise)
    tl.to(radioDial, {
      rotation: targetAngle + (Math.random() * 10 - 5), // Slight "miss" before correction
      duration: 1.2,
      ease: "power2.inOut"
    }, "-=0.3"); // Overlap with jitter for fluid motion

    // Phase 3: The Correction (Clicking into the exact school frequency)
    tl.to(radioDial, {
      rotation: targetAngle,
      duration: 0.6,
      ease: "back.out(2)",
      onComplete: () => this.igniteInterface(school)
    });
  },

  igniteInterface(school) {
    // School-specific colors from the established 14-vowel palette
    const colors = {
      VOID: "#a1a1aa",
      PSYCHIC: "#00E5FF", // IY
      ALCHEMY: "#D500F9", // EY
      WILL: "#FF6600",    // AE
      SONIC: "#651FFF"    // AO
    };

    const targetColor = colors[school] || colors.VOID;

    // Flash the display to confirm frequency lock
    gsap.fromTo(".radio-display", 
      { boxShadow: `0 0 0px transparent` },
      { 
        boxShadow: `0 0 40px ${targetColor}`, 
        borderColor: targetColor, 
        duration: 0.4, 
        yoyo: true, 
        repeat: 1 
      }
    );
  },

  showAnnotation(word, analysis) {
    const panel = document.getElementById('annotationPanel');
    if (!panel) return;

    document.getElementById('annoWord').textContent = word.toUpperCase();
    // Dynamically color the title based on the detected vowel family
    document.getElementById('annoWord').style.color = `var(--vowel-${analysis.vowelFamily})`;
    
    document.getElementById('annoContent').innerHTML = `
      <div class="anno-stat"><span>FAMILY</span><b>${analysis.vowelFamily}</b></div>
      <div class="anno-stat"><span>PHONEMES</span><b>${analysis.phonemes.join(' · ')}</b></div>
      <div class="anno-stat"><span>RHYME KEY</span><b>${analysis.rhymeKey}</b></div>
    `;
    panel.classList.add('active');
  },

  closeAnnotation() {
    document.getElementById('annotationPanel')?.classList.remove('active');
  }
};
