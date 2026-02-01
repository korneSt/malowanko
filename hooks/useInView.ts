"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Tracks whether an element is visible in the viewport.
 * Used to defer fetching (e.g. gallery images) until the element is in view.
 *
 * @param options - IntersectionObserver options (rootMargin, threshold)
 * @returns [ref to attach to element, isInView]
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: IntersectionObserverInit = {}
): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [isInView, setIsInView] = useState(false);

  const { root = null, rootMargin = "100px", threshold = 0 } = options;

  const handleIntersect = useCallback<IntersectionObserverCallback>(
    ([entry]) => {
      setIsInView(entry.isIntersecting);
    },
    []
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(handleIntersect, {
      root,
      rootMargin,
      threshold,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [handleIntersect, root, rootMargin, threshold]);

  return [ref, isInView];
}
