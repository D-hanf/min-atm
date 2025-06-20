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
  }, [colorScheme])

  // Toggle between light and dark mode
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT)
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
    <ThemeContext.Provider value={{ 
      theme, 
      colorScheme,
      toggleTheme, 
      changeTheme, 
      changeColorScheme,
      isDark: theme === THEMES.DARK
    }}>
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
