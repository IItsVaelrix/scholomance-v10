import { useCallback, useMemo, useEffect } from "react";
import { useLocalStorage } from "react-use";

const STORAGE_KEY = "scholomance-scrolls";
const SCHEMA_VERSION = 1;

/**
 * Scroll structure (v1):
 * {
 *   id: string,
 *   title: string,
 *   content: string,
 *   createdAt: number,
 *   updatedAt: number,
 *   _version: number (schema version)
 * }
 */

const generateId = () => `scroll-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const migrateScrollData = (rawData) => {
  if (!Array.isArray(rawData)) return [];

  return rawData.map((scroll) => {
    // Already has version - assume it's correct
    if (scroll._version === SCHEMA_VERSION) return scroll;

    // Legacy scroll without version - migrate to v1
    if (!scroll._version) {
      return {
        ...scroll,
        _version: 1,
        createdAt: scroll.createdAt || Date.now(),
        updatedAt: scroll.updatedAt || Date.now(),
      };
    }

    // Future versions would be handled here
    return scroll;
  });
};

export function useScrolls() {
  const [rawScrolls, setRawScrolls] = useLocalStorage(STORAGE_KEY, []);

  // Migrate data on first load
  const scrolls = useMemo(() => migrateScrollData(rawScrolls), [rawScrolls]);

  // Persist migrated data back if needed
  useEffect(() => {
    const needsMigration = (rawScrolls || []).some((s) => s._version !== SCHEMA_VERSION);
    if (needsMigration && scrolls.length > 0) {
      setRawScrolls(scrolls);
    }
  }, [rawScrolls, scrolls, setRawScrolls]);

  const createScroll = useCallback(
    (title, content) => {
      const now = Date.now();
      const newScroll = {
        id: generateId(),
        title: title.trim() || "Untitled Scroll",
        content: content.trim(),
        createdAt: now,
        updatedAt: now,
        _version: SCHEMA_VERSION,
      };
      setRawScrolls((prev) => [newScroll, ...(prev || [])]);
      return newScroll;
    },
    [setRawScrolls]
  );

  const updateScroll = useCallback(
    (id, updates) => {
      setRawScrolls((prev) =>
        (prev || []).map((scroll) =>
          scroll.id === id
            ? { ...scroll, ...updates, updatedAt: Date.now(), _version: SCHEMA_VERSION }
            : scroll
        )
      );
    },
    [setRawScrolls]
  );

  const deleteScroll = useCallback(
    (id) => {
      setRawScrolls((prev) => (prev || []).filter((scroll) => scroll.id !== id));
    },
    [setRawScrolls]
  );

  const getScrollById = useCallback(
    (id) => (scrolls || []).find((s) => s.id === id) || null,
    [scrolls]
  );

  const sortedScrolls = useMemo(
    () => [...(scrolls || [])].sort((a, b) => b.updatedAt - a.updatedAt),
    [scrolls]
  );

  return {
    scrolls: sortedScrolls,
    createScroll,
    updateScroll,
    deleteScroll,
    getScrollById,
    scrollCount: (scrolls || []).length,
  };
}
