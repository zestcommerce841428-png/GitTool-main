'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext<{ theme: string; setTheme: (theme: string) => void }>({
    theme: 'System',
    setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState('system');

    useEffect(() => {
        const savedTheme = localStorage.getItem('gittool-theme');
        if (savedTheme) {
            setTheme(savedTheme.toLowerCase());
        }
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;

        // Remove explicit classes to start fresh
        root.classList.remove('light', 'dark');

        let activeTheme = theme;
        if (theme === 'system') {
            activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                ? 'dark'
                : 'light';
        }

        root.classList.add(activeTheme);
        root.style.colorScheme = activeTheme;

        // Save selection to localStorage
        localStorage.setItem('gittool-theme', theme);

    }, [theme]);

    // Optional: listen for system theme changes if set to System
    useEffect(() => {
        if (theme !== 'system') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            const root = window.document.documentElement;
            root.classList.remove('light', 'dark');
            const newTheme = e.matches ? 'dark' : 'light';
            root.classList.add(newTheme);
            root.style.colorScheme = newTheme;
        };

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        } else if (mediaQuery.addListener) {
            mediaQuery.addListener(handleChange);
            return () => mediaQuery.removeListener(handleChange);
        }
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);
