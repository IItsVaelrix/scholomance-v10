import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useColorEngine } from "../../hooks/useColorEngine.jsx";
import { useScrolls } from "../../hooks/useScrolls.jsx";
import AnnotationPanel from "./AnnotationPanel.jsx";
import ScrollEditor from "./ScrollEditor.jsx";
import ScrollList from "./ScrollList.jsx";
import { blendSchoolColor, getEvidenceValue } from "../../engines/colorEngine/index.ts";
import { buildStateClasses } from "../../js/stateClasses.js";
import "./ReadPage.css";

const RHYME_IDLE_MS = 2250;
const MAX_ANALYSIS_TOKENS = 160;
const BASE_SCORES = {
  VOID: 1,
  PSYCHIC: 0,
  ALCHEMY: 0,
  WILL: 0,
  SONIC: 0,
};

export default function ReadPage() {
  const { isReady, engine: colorEngine, revision } = useColorEngine();
  const { scrolls, createScroll, updateScroll, deleteScroll, getScrollById } = useScrolls();

  const [annotation, setAnnotation] = useState(null);
  const [activeScrollId, setActiveScrollId] = useState(null);
  const [rhymeSchool, setRhymeSchool] = useState("VOID");
  const [rhymeScores, setRhymeScores] = useState(BASE_SCORES);
  const [isIdle, setIsIdle] = useState(true);
  const idleTimerRef = useRef(null);
  const annotationRequestRef = useRef(0);
  const isEditing = !!activeScrollId;

  const activeScroll = activeScrollId ? getScrollById(activeScrollId) : null;

  useEffect(() => {
    // Auto-load the most recently updated scroll on refresh.
    // This keeps the writing "session" feeling persistent.
    if (!activeScrollId && scrolls.length) {
      setActiveScrollId(scrolls[0].id);
    }
  }, [activeScrollId, scrolls]);

  const analyzeRhymeProfile = useCallback(
    (text) => {
      if (!text?.trim() || !colorEngine?.getTokenResult) {
        return { scores: BASE_SCORES, dominant: "VOID" };
      }

      const tokens = (text.match(/[A-Za-z']+/g) || []).slice(-MAX_ANALYSIS_TOKENS);
      if (!tokens.length) {
        return { scores: BASE_SCORES, dominant: "VOID" };
      }

      const analyses = tokens
        .map((token) => colorEngine.getTokenResult(token))
        .filter(Boolean)
        .map((result) => {
          const rhymeKey = getEvidenceValue(result, "rhyme");
          const phonemeValue = getEvidenceValue(result, "phoneme");
          const phonemeCount = phonemeValue
            ? phonemeValue.split(/\s+/).filter(Boolean).length
            : 0;
          const codaEvidence = result.evidence.find(
            (item) => item.type === "phoneme" && item.value.startsWith("coda:")
          );
          const coda = codaEvidence ? codaEvidence.value.slice(5) : null;
          const codaGroups = result.evidence
            .filter((item) => item.type === "usage" && item.value.startsWith("coda-group:"))
            .map((item) => item.value.slice("coda-group:".length));
          const school =
            result.chips.find((chip) => chip.type === "school")?.label || "VOID";
          return {
            coda,
            codaGroups,
            rhymeKey,
            phonemeCount,
            school,
          };
        });

      if (!analyses.length) {
        return { scores: BASE_SCORES, dominant: "VOID" };
      }

      const interactionBoosts = new Array(analyses.length).fill(0);
      for (let i = 1; i < analyses.length; i++) {
        const prev = analyses[i - 1];
        const curr = analyses[i];
        let boost = 0;
        if (prev.rhymeKey && curr.rhymeKey && prev.rhymeKey === curr.rhymeKey) {
          boost = 0.6;
        } else if (prev.coda && curr.coda) {
          const sharesGroup =
            prev.codaGroups?.length &&
            curr.codaGroups?.length &&
            prev.codaGroups.some((group) => curr.codaGroups.includes(group));
          if (sharesGroup || prev.coda === curr.coda) {
            boost = 0.35;
          }
        }
        if (boost) {
          interactionBoosts[i] += boost;
          interactionBoosts[i - 1] += boost * 0.6;
        }
      }

      const scores = { VOID: 0, PSYCHIC: 0, ALCHEMY: 0, WILL: 0, SONIC: 0 };
      analyses.forEach((result, index) => {
        const codaTokens = result.coda ? result.coda.split(/[^A-Z]+/).filter(Boolean) : [];
        const codaWeight = Math.min(1.2, codaTokens.length * 0.35);
        const phonemeWeight = Math.min(0.8, Math.max(0, result.phonemeCount - 2) * 0.06);
        const wordScore = 1 + codaWeight + phonemeWeight + interactionBoosts[index];
        scores[result.school] += wordScore;
      });

      let dominant = "VOID";
      let maxScore = -1;
      Object.entries(scores).forEach(([school, score]) => {
        if (score > maxScore) {
          maxScore = score;
          dominant = school;
        }
      });

      return { scores, dominant };
    },
    [colorEngine]
  );

  const handleIdleAnalyze = useCallback(
    (value) => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        if (!value?.trim()) {
          setRhymeScores(BASE_SCORES);
          setRhymeSchool("VOID");
          return;
        }
        const { scores, dominant } = analyzeRhymeProfile(value);
        setRhymeScores(scores);
        setRhymeSchool(dominant);
        setIsIdle(true);
      }, RHYME_IDLE_MS);
    },
    [analyzeRhymeProfile]
  );

  useEffect(() => {
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  const rhymeStyle = useMemo(() => {
    const [r, g, b] = blendSchoolColor(rhymeScores);
    const accent = `rgb(${r}, ${g}, ${b})`;
    const soft = `rgba(${r}, ${g}, ${b}, 0.18)`;
    const glow = `rgba(${r}, ${g}, ${b}, 0.45)`;
    return {
      "--school-accent": accent,
      "--school-accent-soft": soft,
      "--school-accent-glow": glow,
    };
  }, [rhymeScores]);

  const analyze = useCallback(
    (word) => {
      if (!colorEngine?.getTokenResult) return;
      const result = colorEngine.getTokenResult(word);
      setAnnotation(result);
      const requestId = annotationRequestRef.current + 1;
      annotationRequestRef.current = requestId;
      colorEngine
        .requestEnrichment(word)
        .then(() => {
          if (annotationRequestRef.current !== requestId) return;
          setAnnotation(colorEngine.getTokenResult(word));
        })
        .catch(() => {});
    },
    [colorEngine]
  );

  const handleSaveScroll = useCallback(
    (title, content) => {
      if (isEditing && activeScrollId) {
        updateScroll(activeScrollId, { title, content });
      } else {
        const newScroll = createScroll(title, content);
        setActiveScrollId(newScroll.id);
      }
      // For now, let's analyze the first word of the content after saving.
      const firstWord = content.split(/\s+/)[0];
      if (firstWord) {
        analyze(firstWord);
      }
    },
    [isEditing, activeScrollId, updateScroll, createScroll, analyze]
  );

  const handleDeleteScroll = useCallback((idToDelete) => {
    deleteScroll(idToDelete);
    if (activeScrollId === idToDelete) {
      setActiveScrollId(null);
    }
  }, [activeScrollId, deleteScroll]);

  const handleNewScroll = () => {
    setActiveScrollId(null);
  };

  const stateClasses = buildStateClasses({
    view: "editor",
    overlay: annotation ? "open" : "closed",
    school: rhymeSchool,
  });

  return (
    <section
      className={`readPage surface ${stateClasses} ${isIdle ? "rhyme-idle" : ""}`}
      data-surface="read"
      style={rhymeStyle}
    >
      <div className="read-layout">
        <aside className="read-sidebar">
          <ScrollList
            scrolls={scrolls}
            activeScrollId={activeScrollId}
            onSelect={setActiveScrollId}
            onDelete={handleDeleteScroll}
            onNewScroll={handleNewScroll}
          />
        </aside>
        <main className="read-stage" data-surface="workbench">
          <ScrollEditor
            key={activeScrollId || "new"}
            initialTitle={activeScroll ? activeScroll.title : ""}
            initialContent={activeScroll ? activeScroll.content : ""}
            onSave={handleSaveScroll}
            onContentChange={handleIdleAnalyze}
            onWordClick={analyze}
            isEditing={isEditing}
            disabled={!isReady}
            colorEngine={colorEngine}
            engineRevision={revision}
          />
        </main>
      </div>

      {annotation && (
        <AnnotationPanel
          annotation={annotation}
          onClose={() => setAnnotation(null)}
        />
      )}
    </section>
  );
}
