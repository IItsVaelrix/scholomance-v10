export interface AudioBus {
  ctx: AudioContext;
  analyser: AnalyserNode;
  resume: () => Promise<void>;
  cleanup: () => void;
}

export function createAudioBus(audioEl: HTMLMediaElement): AudioBus {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  const ctx = new AudioContext();
  
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  analyser.smoothingTimeConstant = 0.8;

  // Create source from the element
  // Note: This requires the audio element to be CORS-enabled if playing remote files
  // (crossOrigin="anonymous")
  const source = ctx.createMediaElementSource(audioEl);
  const gain = ctx.createGain();

  source.connect(analyser);
  analyser.connect(gain);
  gain.connect(ctx.destination);

  return {
    ctx,
    analyser,
    resume: () => ctx.resume(),
    cleanup: () => {
      source.disconnect();
      analyser.disconnect();
      gain.disconnect();
      if (ctx.state !== 'closed') {
        ctx.close();
      }
    }
  };
}
