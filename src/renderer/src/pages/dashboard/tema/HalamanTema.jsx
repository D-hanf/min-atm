import React from 'react'
import { HiMoon, HiSun } from 'react-icons/hi2'
import { COLOR_SCHEMES, THEMES, useTheme } from '../../../context/ThemeContext'

const HalamanTema = () => {
  const { theme, colorScheme, changeTheme, changeColorScheme, isDark } = useTheme()

  const colorSchemes = [
    { id: COLOR_SCHEMES.DEFAULT, name: 'Default', className: 'bg-gray-100 dark:bg-gray-800' },
    { id: COLOR_SCHEMES.BLUE, name: 'Blue', className: 'bg-blue-100 dark:bg-blue-900' },
    { id: COLOR_SCHEMES.GREEN, name: 'Green', className: 'bg-green-100 dark:bg-green-900' },
    { id: COLOR_SCHEMES.PURPLE, name: 'Purple', className: 'bg-purple-100 dark:bg-purple-900' },
    { id: COLOR_SCHEMES.YELLOW, name: 'Yellow', className: 'bg-yellow-100 dark:bg-yellow-900' },
    { id: COLOR_SCHEMES.ORANGE, name: 'Orange', className: 'bg-orange-100 dark:bg-orange-900' },
    { id: COLOR_SCHEMES.PINK, name: 'Pink', className: 'bg-pink-100 dark:bg-pink-900' }
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8 text-gray-800 dark:text-white">Pengaturan Tema</h1>
      
      {/* Theme Mode Selection */}
      <div className="mb-10 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-white">Mode Tampilan</h2>
        <div className="flex gap-4">
          <div 
            onClick={() => changeTheme(THEMES.LIGHT)}
            className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
              ${theme === THEMES.LIGHT 
                ? 'border-blue-500 ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900' 
                : 'border-gray-200 dark:border-gray-700'}`}
          >
            <HiSun className="text-3xl text-orange-500 mb-2" />
            <span className="text-gray-800 dark:text-white font-medium">Light Mode</span>
          </div>
          
          <div 
            onClick={() => changeTheme(THEMES.DARK)}
            className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
              ${theme === THEMES.DARK 
                ? 'border-blue-500 ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900' 
                : 'border-gray-200 dark:border-gray-700'}`}
          >
            <HiMoon className="text-3xl text-purple-500 mb-2" />
            <span className="text-gray-800 dark:text-white font-medium">Dark Mode</span>
          </div>
        </div>
      </div>
      
      {/* Color Scheme Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-white">Warna Tema</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {colorSchemes.map((scheme) => (
            <div 
              key={scheme.id}
              onClick={() => changeColorScheme(scheme.id)}
              className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                ${colorScheme === scheme.id 
                  ? 'border-blue-500 ring-2 ring-blue-500' 
                  : 'border-gray-200 dark:border-gray-700'}`}
            >
              <div className={`w-16 h-16 rounded-full mb-2 ${scheme.className}`}></div>
              <span className="text-gray-800 dark:text-white font-medium">{scheme.name}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Preview Section */}
      <div className="mt-10 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-white">Pratinjau</h2>
        <div className={`p-4 rounded-lg border dark:border-gray-700 ${
          colorScheme === COLOR_SCHEMES.DEFAULT ? (isDark ? 'bg-gray-700' : 'bg-gray-100') :
          colorScheme === COLOR_SCHEMES.BLUE ? (isDark ? 'bg-blue-800' : 'bg-blue-100') : 
          colorScheme === COLOR_SCHEMES.GREEN ? (isDark ? 'bg-green-800' : 'bg-green-100') :
          colorScheme === COLOR_SCHEMES.PURPLE ? (isDark ? 'bg-purple-800' : 'bg-purple-100') :
          colorScheme === COLOR_SCHEMES.YELLOW ? (isDark ? 'bg-yellow-800' : 'bg-yellow-100') :
          colorScheme === COLOR_SCHEMES.ORANGE ? (isDark ? 'bg-orange-800' : 'bg-orange-100') :
          colorScheme === COLOR_SCHEMES.PINK ? (isDark ? 'bg-pink-800' : 'bg-pink-100') : ''
        }`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-500"></div>
            <div>
              <h3 className="font-medium text-gray-800 dark:text-white">Sample Card</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Preview how your theme looks</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
              Primary Button
            </button>
            <button className="px-4 py-2 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded-md">
              Secondary Button
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HalamanTema
