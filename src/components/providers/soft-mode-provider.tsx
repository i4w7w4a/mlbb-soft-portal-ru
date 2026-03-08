"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type SoftModeContextValue = {
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  toggle: () => void;
};

const SoftModeContext = createContext<SoftModeContextValue | null>(null);

const STORAGE_KEY = "soft-mode-enabled";

export function SoftModeProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem(STORAGE_KEY) === "true";
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, String(enabled));
    document.documentElement.dataset.softMode = enabled ? "on" : "off";
  }, [enabled]);

  const value = useMemo<SoftModeContextValue>(
    () => ({
      enabled,
      setEnabled,
      toggle: () => setEnabled((current) => !current),
    }),
    [enabled],
  );

  return <SoftModeContext.Provider value={value}>{children}</SoftModeContext.Provider>;
}

export function useSoftMode() {
  const context = useContext(SoftModeContext);

  if (!context) {
    throw new Error("useSoftMode must be used inside SoftModeProvider");
  }

  return context;
}
