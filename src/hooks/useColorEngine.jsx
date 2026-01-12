import { createContext, useContext, useEffect, useRef, useState } from "react";
import { PhonemeEngine } from "../lib/phoneme.engine";
import { createColorEngine } from "../engines/colorEngine/index.ts";

const ColorEngineContext = createContext(null);

export function ColorEngineProvider({ children }) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("loading");
  const [revision, setRevision] = useState(0);
  const engineRef = useRef(null);

  if (!engineRef.current) {
    engineRef.current = createColorEngine({
      onEnriched: () => setRevision((prev) => prev + 1),
    });
  }

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    PhonemeEngine.init({ signal: controller.signal })
      .then((result) => {
        if (!mounted) return;
        setMode(result?.mode || "demo");
        setIsReady(true);
        engineRef.current?.setPhonemeEngine?.(PhonemeEngine);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        if (mounted) {
          setError(err);
          setMode("demo");
          setIsReady(true);
          engineRef.current?.setPhonemeEngine?.(PhonemeEngine);
        }
      });
    return () => {
      mounted = false;
      controller.abort();
      engineRef.current?.dispose?.();
    };
  }, []);

  return (
    <ColorEngineContext.Provider
      value={{ isReady, mode, error, revision, engine: engineRef.current }}
    >
      {children}
    </ColorEngineContext.Provider>
  );
}

export function useColorEngine() {
  const context = useContext(ColorEngineContext);
  if (!context) {
    throw new Error("useColorEngine must be used within ColorEngineProvider");
  }
  return context;
}
