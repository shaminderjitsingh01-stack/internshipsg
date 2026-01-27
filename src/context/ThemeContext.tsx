"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ThemeContextType {
  isDarkTheme: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      setIsDarkTheme(true);
    }
  }, []);

  // Save theme to localStorage when it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem("theme", isDarkTheme ? "dark" : "light");
    }
  }, [isDarkTheme, mounted]);

  const toggleTheme = () => {
    setIsDarkTheme((prev) => !prev);
  };

  // Prevent flash of wrong theme
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ isDarkTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
