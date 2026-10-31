import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

export type ThemePreference = "system" | "light" | "dark";

type ThemeContextValue = {
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const STORAGE_KEY = "themePreference";

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>("system");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const storedPreference = window.localStorage.getItem(STORAGE_KEY);
      if (storedPreference === "system" || storedPreference === "light" || storedPreference === "dark") {
        setThemePreferenceState(storedPreference);
      }
    } catch {
      // Keep the system preference if local storage is unavailable.
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const systemPreference = window.matchMedia("(prefers-color-scheme: dark)");
    const updateTheme = () => {
      const isDark = themePreference === "dark" || (themePreference === "system" && systemPreference.matches);
      document.documentElement.classList.toggle("dark", isDark);
      document.documentElement.style.colorScheme = isDark ? "dark" : "light";
      document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
        meta.content = isDark ? "#0a0a0a" : "#ffffff";
      });
    };

    updateTheme();
    if (themePreference === "system") {
      systemPreference.addEventListener("change", updateTheme);
    }
    const headObserver = new MutationObserver(updateTheme);
    headObserver.observe(document.head, { childList: true, subtree: true });
    return () => {
      if (themePreference === "system") {
        systemPreference.removeEventListener("change", updateTheme);
      }
      headObserver.disconnect();
    };
  }, [isReady, themePreference]);

  const setThemePreference = useCallback((preference: ThemePreference) => {
    setThemePreferenceState(preference);
    try {
      window.localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      // The selected theme still applies for this session without local storage.
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ themePreference, setThemePreference }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemePreference = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useThemePreference must be used within ThemeProvider");
  return context;
};
