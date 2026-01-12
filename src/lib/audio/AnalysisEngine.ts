export interface SpectralData {
  bass: number;
  mids: number;
  highs: number;
  raw: Uint8Array;
}

export class AnalysisEngine {
  private analyser: AnalyserNode;
  private dataArray: Uint8Array;

  constructor(analyser: AnalyserNode) {
    this.analyser = analyser;
    this.dataArray = new Uint8Array(analyser.frequencyBinCount);
  }

  getSpectralData(): SpectralData {
    this.analyser.getByteFrequencyData(this.dataArray);
    
    // Normalize 0..1
    const avg = (start: number, end: number) => {
      let sum = 0;
      const count = Math.max(1, end - start);
      for (let i = start; i < end; i++) {
        if (i < this.dataArray.length) sum += this.dataArray[i];
      }
      return sum / count / 255;
    };

    return {
      bass: avg(0, 60),
      mids: avg(60, 250),
      highs: avg(250, 512),
      raw: this.dataArray
    };
  }
}

export class OnsetDetector {
  private prev: Float32Array;
  private binCount: number;

  constructor(binCount: number = 1024) {
    this.binCount = binCount;
    this.prev = new Float32Array(binCount);
  }

  detect(current: Uint8Array): number {
    let flux = 0;
    for (let i = 0; i < this.binCount; i++) {
      const v = current[i] / 255;
      const d = v - this.prev[i];
      if (d > 0) flux += d;
      this.prev[i] = v;
    }
    return flux;
  }
}

export class BPMEstimator {
  private sampleRate: number; // approximate FPS of analysis calls
  private bufferSize: number;
  private buffer: Float32Array;
  private idx: number = 0;
  private filled: boolean = false;

  constructor(sampleRate: number = 60, windowSec: number = 6) {
    this.sampleRate = sampleRate;
    this.bufferSize = Math.floor(sampleRate * windowSec);
    this.buffer = new Float32Array(this.bufferSize);
  }

  push(value: number) {
    this.buffer[this.idx] = value;
    this.idx = (this.idx + 1) % this.bufferSize;
    if (this.idx === 0) this.filled = true;
  }

  estimate(minBpm = 70, maxBpm = 180): number | null {
    if (!this.filled && this.idx < this.sampleRate * 2) return null; // Need at least 2s of data

    const minLag = Math.floor(this.sampleRate * 60 / maxBpm);
    const maxLag = Math.floor(this.sampleRate * 60 / minBpm);

    let bestLag = 0;
    let bestCorrelation = -Infinity;

    for (let lag = minLag; lag <= maxLag; lag++) {
      let sum = 0;
      for (let i = 0; i < this.bufferSize; i++) {
        const a = this.buffer[i];
        const b = this.buffer[(i + lag) % this.bufferSize];
        sum += a * b;
      }
      
      if (sum > bestCorrelation) {
        bestCorrelation = sum;
        bestLag = lag;
      }
    }

    if (!bestLag) return null;
    return Math.round(60 * this.sampleRate / bestLag);
  }
}
