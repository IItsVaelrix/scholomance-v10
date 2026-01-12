import { useState, useEffect, useRef } from 'react';
import { createAudioBus, AudioBus } from '../lib/audio/AudioBus';
import { VisualSync } from '../lib/audio/VisualSync';

export function useAudioAnalyzer(audioEl: HTMLMediaElement | null) {
  const [sync, setSync] = useState<VisualSync | null>(null);
  const busRef = useRef<AudioBus | null>(null);

  useEffect(() => {
    if (!audioEl) return;

    try {
      const bus = createAudioBus(audioEl);
      busRef.current = bus;
      
      const visualSync = new VisualSync(bus);
      setSync(visualSync);

      return () => {
        visualSync.stop();
        bus.cleanup();
        setSync(null);
      };
    } catch (e) {
      console.error("Audio Context setup failed", e);
    }
  }, [audioEl]);

  return sync;
}
