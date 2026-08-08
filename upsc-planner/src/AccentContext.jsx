import React, { createContext, useContext, useState, useEffect } from 'react';

const AccentContext = createContext();

// Explicit Tailwind class maps so the JIT compiler doesn't purge them
export const accentMap = {
  indigo: {
    primary: 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-600 dark:border-indigo-500',
    ring: 'focus:ring-indigo-500 dark:focus:ring-indigo-400',
    bgLight: 'bg-indigo-50 dark:bg-indigo-900/20',
    badge: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400',
  },
  emerald: {
    primary: 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-600 dark:border-emerald-500',
    ring: 'focus:ring-emerald-500 dark:focus:ring-emerald-400',
    bgLight: 'bg-emerald-50 dark:bg-emerald-900/20',
    badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
  },
  rose: {
    primary: 'bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700 text-white',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-600 dark:border-rose-500',
    ring: 'focus:ring-rose-500 dark:focus:ring-rose-400',
    bgLight: 'bg-rose-50 dark:bg-rose-900/20',
    badge: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
  },
  amber: {
    primary: 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700 text-white',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-600 dark:border-amber-500',
    ring: 'focus:ring-amber-500 dark:focus:ring-amber-400',
    bgLight: 'bg-amber-50 dark:bg-amber-900/20',
    badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  },
  cyan: {
    primary: 'bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-600 dark:hover:bg-cyan-700 text-white',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-600 dark:border-cyan-500',
    ring: 'focus:ring-cyan-500 dark:focus:ring-cyan-400',
    bgLight: 'bg-cyan-50 dark:bg-cyan-900/20',
    badge: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400',
  },
};

export const AccentProvider = ({ children }) => {
  const [accent, setAccent] = useState(localStorage.getItem('accentColor') || 'indigo');

  useEffect(() => {
    localStorage.setItem('accentColor', accent);
  }, [accent]);

  return (
    <AccentContext.Provider value={{ accent, setAccent, themeClasses: accentMap[accent] || accentMap.indigo }}>
      {children}
    </AccentContext.Provider>
  );
};

export const useAccent = () => useContext(AccentContext);