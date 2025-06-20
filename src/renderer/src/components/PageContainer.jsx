import React from 'react'
import { useTheme } from '../context/ThemeContext'

const PageContainer = ({ children, title }) => {
  const { isDark } = useTheme()
  
  return (
    <div className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} min-h-screen rounded-lg shadow-md p-6 transition-colors duration-300`}>
      {title && (
        <h1 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          {title}
        </h1>
      )}
      {children}
    </div>
  )
}

export default PageContainer
