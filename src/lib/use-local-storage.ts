"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

/**
 * Read/write a `localStorage` value without a mount effect.
 *
 * `useSyncExternalStore` gives us the SSR-safe read for free: the server
 * snapshot returns `null` (so the first client render matches the server and
 * there's no hydration mismatch), then React swaps in the real stored value.
 * This replaces the classic `useEffect(() => setState(localStorage...))`
 * pattern, which the `react-hooks/set-state-in-effect` lint rule flags.
 *
 * Writes go through `setValue`, which also fires a same-tab event so other
 * hook instances bound to the same key re-read (the native `storage` event
 * only fires in *other* tabs).
 *
 * If `localStorage` itself throws (Safari "block all cookies", some
 * webviews), it transparently falls back to an in-memory store so controlled
 * inputs bound to the hook still work for the session — they just don't
 * persist.
 */

const memoryStore = new Map<string, string>();

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return memoryStore.has(key) ? memoryStore.get(key)! : null;
  }
}

function writeRaw(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    memoryStore.set(key, value);
  }
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  parse: (raw: string) => T = JSON.parse,
  serialize: (value: T) => string = JSON.stringify,
): [T, (value: T) => void] {
  const eventName = `local-storage:${key}`;

  const subscribe = useCallback(
    (onChange: () => void) => {
      function onStorage(e: StorageEvent) {
        if (e.key === key) onChange();
      }
      window.addEventListener("storage", onStorage);
      window.addEventListener(eventName, onChange);
      return () => {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener(eventName, onChange);
      };
    },
    [key, eventName],
  );

  // Returns the raw string (a primitive — stable under Object.is when
  // unchanged, so useSyncExternalStore won't loop) or null.
  const getSnapshot = useCallback((): string | null => readRaw(key), [key]);

  const raw = useSyncExternalStore(subscribe, getSnapshot, () => null);

  const value = useMemo(() => {
    if (raw == null) return initialValue;
    try {
      return parse(raw);
    } catch {
      return initialValue;
    }
  }, [raw, parse, initialValue]);

  const setValue = useCallback(
    (next: T) => {
      writeRaw(key, serialize(next));
      window.dispatchEvent(new Event(eventName));
    },
    [key, eventName, serialize],
  );

  return [value, setValue];
}
