import { createContext, useContext, useState, useEffect } from "react";
import { PhonemeEngine } from "../lib/phoneme.engine";

const PhonemeEngineContext = createContext(null);

export function PhonemeEngineProvider({ children }) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    PhonemeEngine.init({ signal: controller.signal })
      .then(() => mounted && setIsReady(true))
      .catch((err) => {
        if (err?.name === "AbortError") return;
        if (mounted) setError(err);
      });
    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  return (
    <PhonemeEngineContext.Provider value={{ isReady, error, engine: PhonemeEngine }}>
      {children}
    </PhonemeEngineContext.Provider>
  );
}

export function usePhonemeEngine() {
  const context = useContext(PhonemeEngineContext);
  if (!context) {
    throw new Error("usePhonemeEngine must be used within PhonemeEngineProvider");
  }
  return context;
}
