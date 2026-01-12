import { AudioBus } from './AudioBus';
import { AnalysisEngine, OnsetDetector, BPMEstimator } from './AnalysisEngine';

export class VisualSync {
  public bpm: number | null = null;
  public bands = { bass: 0, mids: 0, highs: 0 };
  public raw: Uint8Array = new Uint8Array(0);
  public bus: AudioBus;

  private engine: AnalysisEngine;
  private onset: OnsetDetector;
  private bpmEst: BPMEstimator;
  
  private listeners: (() => void)[] = [];
  private frameId: number = 0;
  private lastBeatTime: number = 0;
  private beatCooldown: number = 250; // ms

  // Dynamic threshold
  private fluxHistory: number[] = [];
  private fluxHistorySize = 30;

  constructor(bus: AudioBus) {
    this.engine = new AnalysisEngine(bus.analyser);
    this.onset = new OnsetDetector(bus.analyser.frequencyBinCount);
    this.bpmEst = new BPMEstimator(60, 6);
    this.start();
  }

  onBeat(cb: () => void) {
    this.listeners.push(cb);
  }

  offBeat(cb: () => void) {
    this.listeners = this.listeners.filter(l => l !== cb);
  }

  private start() {
    let frameCount = 0;

    const loop = () => {
      const spectral = this.engine.getSpectralData();
      this.bands.bass = spectral.bass;
      this.bands.mids = spectral.mids;
      this.bands.highs = spectral.highs;
      this.raw = spectral.raw;

      const flux = this.onset.detect(spectral.raw);
      this.bpmEst.push(flux);

      // Dynamic thresholding
      this.fluxHistory.push(flux);
      if (this.fluxHistory.length > this.fluxHistorySize) this.fluxHistory.shift();
      
      const avgFlux = this.fluxHistory.reduce((a,b) => a+b, 0) / Math.max(1, this.fluxHistory.length);
      const threshold = Math.max(5, avgFlux * 1.5); // Min threshold 5 to avoid noise

      if (flux > threshold && (performance.now() - this.lastBeatTime > this.beatCooldown)) {
        this.lastBeatTime = performance.now();
        this.listeners.forEach(cb => cb());
      }

      if (frameCount++ % 60 === 0) {
        this.bpm = this.bpmEst.estimate();
      }

      this.frameId = requestAnimationFrame(loop);
    };
    loop();
  }

  stop() {
    cancelAnimationFrame(this.frameId);
  }
}
