import React, { createContext, useContext, useEffect, useState } from 'react'

// Define available themes
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark'
}

// Define available color schemes
export const COLOR_SCHEMES = {
  DEFAULT: 'default',
  BLUE: 'blue',
  GREEN: 'green',
  PURPLE: 'purple',
  YELLOW: 'yellow',
  ORANGE: 'orange',
  PINK: 'pink'
}

const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  // Initialize from localStorage or default to light theme with default color scheme
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme')
    return savedTheme || THEMES.LIGHT
  })

  const [colorScheme, setColorScheme] = useState(() => {
    const savedColorScheme = localStorage.getItem('colorScheme')
    return savedColorScheme || COLOR_SCHEMES.DEFAULT
  })

  // Update document attributes and localStorage when theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)

    // Apply dark mode class to html element
    if (theme === THEMES.DARK) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [theme])

  // Update document attributes and localStorage when color scheme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-color-scheme', colorScheme)
    localStorage.setItem('colorScheme', colorScheme)

    // Apply the color variables based on the selected scheme
    const root = document.documentElement

    // Reset previous colors
    root.style.removeProperty('--color-accent')
    root.style.removeProperty('--color-bg-tint')
    root.style.removeProperty('--color-bg-tint-dark')

    // Set new colors based on the selected scheme
    switch (colorScheme) {
      case COLOR_SCHEMES.BLUE:
        root.style.setProperty('--color-accent', theme === THEMES.DARK ? '#38bdf8' : '#0ea5e9')
        root.style.setProperty('--color-bg-tint', '#f0f9ff')
        root.style.setProperty('--color-bg-tint-dark', '#075985')
        break
      case COLOR_SCHEMES.GREEN:
        root.style.setProperty('--color-accent', theme === THEMES.DARK ? '#6ee7b7' : '#10b981')
        root.style.setProperty('--color-bg-tint', '#ecfdf5')
        root.style.setProperty('--color-bg-tint-dark', '#065f46')
        break
      case COLOR_SCHEMES.PURPLE:
        root.style.setProperty('--color-accent', theme === THEMES.DARK ? '#c4b5fd' : '#8b5cf6')
        root.style.setProperty('--color-bg-tint', '#f5f3ff')
        root.style.setProperty('--color-bg-tint-dark', '#5b21b6')
        break
      case COLOR_SCHEMES.YELLOW:
        root.style.setProperty('--color-accent', theme === THEMES.DARK ? '#fcd34d' : '#f59e0b')
        root.style.setProperty('--color-bg-tint', '#fffbeb')
        root.style.setProperty('--color-bg-tint-dark', '#92400e')
        break
      case COLOR_SCHEMES.ORANGE:
        root.style.setProperty('--color-accent', theme === THEMES.DARK ? '#fdba74' : '#f97316')
        root.style.setProperty('--color-bg-tint', '#fff7ed')
        root.style.setProperty('--color-bg-tint-dark', '#9a3412')
        break
      case COLOR_SCHEMES.PINK:
        root.style.setProperty('--color-accent', theme === THEMES.DARK ? '#fda4af' : '#ec4899')
        root.style.setProperty('--color-bg-tint', '#fdf2f8')
        root.style.setProperty('--color-bg-tint-dark', '#9d174d')
        break
      default:
        root.style.setProperty('--color-accent', theme === THEMES.DARK ? '#93c5fd' : '#3b82f6')
        root.style.setProperty('--color-bg-tint', '#f9fafb')
        root.style.setProperty('--color-bg-tint-dark', '#1f2937')
        break
    }
  }, [colorScheme, theme])

  // Toggle between light and dark mode
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT))
  }

  // Change to a specific theme
  const changeTheme = (newTheme) => {
    setTheme(newTheme)
  }

  // Change to a specific color scheme
  const changeColorScheme = (newColorScheme) => {
    setColorScheme(newColorScheme)
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colorScheme,
        toggleTheme,
        changeTheme,
        changeColorScheme,
        isDark: theme === THEMES.DARK
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

// Custom hook for using the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
