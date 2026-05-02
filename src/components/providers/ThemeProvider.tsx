'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeContextValue {
  theme: Theme            // user preference: light | dark | system
  resolved: 'light' | 'dark' // what's actually applied (system → resolved)
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)
const STORAGE_KEY = 'pos-pro-theme'

function readSystem(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(t: 'light' | 'dark') {
  if (typeof document === 'undefined') return
  const html = document.documentElement
  if (t === 'dark') {
    html.classList.add('dark')
    html.style.colorScheme = 'dark'
  } else {
    html.classList.remove('dark')
    html.style.colorScheme = 'light'
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolved, setResolved] = useState<'light' | 'dark'>('light')

  // Load saved preference once on mount
  useEffect(() => {
    const saved = (typeof window !== 'undefined' && (localStorage.getItem(STORAGE_KEY) as Theme)) || 'system'
    setThemeState(saved)
    const initialResolved = saved === 'system' ? readSystem() : saved
    setResolved(initialResolved)
    applyTheme(initialResolved)
  }, [])

  // React to system theme changes when in 'system' mode
  useEffect(() => {
    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    function handler(e: MediaQueryListEvent) {
      const next = e.matches ? 'dark' : 'light'
      setResolved(next)
      applyTheme(next)
    }
    media.addEventListener('change', handler)
    return () => media.removeEventListener('change', handler)
  }, [theme])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, t)
    const next = t === 'system' ? readSystem() : t
    setResolved(next)
    applyTheme(next)
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}

/**
 * Inline script that applies the saved theme BEFORE first render
 * to prevent flash-of-wrong-theme. Inject into <head> via dangerouslySetInnerHTML.
 */
export const themeInitScript = `
(function() {
  try {
    var saved = localStorage.getItem('${STORAGE_KEY}') || 'system';
    var resolved = saved === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : saved;
    if (resolved === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.style.colorScheme = 'light';
    }
  } catch (e) {}
})();
`.trim()
