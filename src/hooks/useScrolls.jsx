import { useCallback, useMemo } from "react";
import { useLocalStorage } from "react-use";

const STORAGE_KEY = "scholomance-scrolls";

/**
 * Scroll structure:
 * {
 *   id: string,
 *   title: string,
 *   content: string,
 *   createdAt: number,
 *   updatedAt: number
 * }
 */

const generateId = () => `scroll-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export function useScrolls() {
  const [scrolls, setScrolls] = useLocalStorage(STORAGE_KEY, []);

  const createScroll = useCallback(
    (title, content) => {
      const now = Date.now();
      const newScroll = {
        id: generateId(),
        title: title.trim() || "Untitled Scroll",
        content: content.trim(),
        createdAt: now,
        updatedAt: now,
      };
      setScrolls((prev) => [newScroll, ...(prev || [])]);
      return newScroll;
    },
    [setScrolls]
  );

  const updateScroll = useCallback(
    (id, updates) => {
      setScrolls((prev) =>
        (prev || []).map((scroll) =>
          scroll.id === id
            ? { ...scroll, ...updates, updatedAt: Date.now() }
            : scroll
        )
      );
    },
    [setScrolls]
  );

  const deleteScroll = useCallback(
    (id) => {
      setScrolls((prev) => (prev || []).filter((scroll) => scroll.id !== id));
    },
    [setScrolls]
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
