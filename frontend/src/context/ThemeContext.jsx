import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

// Utility: generate random hex color
const generateRandomColor = () => {
  return `#${Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, '0')}`;
};

export const ThemeProvider = ({ children, userId }) => {
  /* ================== LOGIC #2 (UNCHANGED) ================== */

  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return (
      savedTheme ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light')
    );
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  /* ================== PROFILE COLOR (USER-SCOPED) ================== */

  const storageKey = userId ? `profileBgColor_${userId}` : null;

  const [profileBgColor, setProfileBgColor] = useState(() => {
    if (!storageKey) return null;
    return localStorage.getItem(storageKey) || generateRandomColor();
  });

  useEffect(() => {
    if (!storageKey || !profileBgColor) return;
    localStorage.setItem(storageKey, profileBgColor);
  }, [profileBgColor, storageKey]);

  const randomizeProfileBg = () => {
    setProfileBgColor(generateRandomColor());
  };

  /* ================================================================ */

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme,
        profileBgColor,
        randomizeProfileBg,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
