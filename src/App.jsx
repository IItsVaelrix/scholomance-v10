import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Navigation from "./components/Navigation/Navigation.jsx";
import { SongProvider } from "./hooks/useCurrentSong.jsx";
import { PhonemeEngineProvider } from "./hooks/usePhonemeEngine.jsx";
import { buildStateClasses } from "./js/stateClasses.js";

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export default function App() {
  const location = useLocation();
  const activeSection = location.pathname.replace("/", "") || "watch";
  const stateClasses = buildStateClasses({
    section: activeSection,
    theme: activeSection,
  });

  return (
    <PhonemeEngineProvider>
      <SongProvider>
        <div className={`app-shell ${stateClasses}`}>
          <header className="app-header surface" data-surface="header" data-role="hud">
            <Navigation />
          </header>
          <main className="app-main surface" data-surface="main">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                className="page-shell surface"
                data-surface="page"
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
          <footer className="app-footer surface" data-surface="footer" aria-hidden="true" />
        </div>
      </SongProvider>
    </PhonemeEngineProvider>
  );
}
