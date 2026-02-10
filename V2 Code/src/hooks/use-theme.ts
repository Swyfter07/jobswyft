import { useState, useEffect } from 'react';

/**
 * useTheme
 * Manages dark/light mode state and persists it to local storage.
 * Synchronizes with document.documentElement for Tailwind dark mode support.
 */
export function useTheme() {
    const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
        // Initial check from localStorage or system preference
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('theme');
            if (saved) return saved === 'dark';
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    });

    useEffect(() => {
        const root = window.document.documentElement;
        if (isDarkMode) {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    // Handle system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            if (!localStorage.getItem('theme')) {
                setIsDarkMode(e.matches);
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const toggleTheme = () => setIsDarkMode(prev => !prev);

    return {
        isDarkMode,
        setIsDarkMode,
        toggleTheme
    };
}
