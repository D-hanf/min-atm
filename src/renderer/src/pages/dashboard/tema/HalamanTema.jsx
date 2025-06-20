import React from 'react'
import { HiMoon, HiSun } from 'react-icons/hi2'
import { COLOR_SCHEMES, THEMES, useTheme } from '../../../context/ThemeContext'

const HalamanTema = () => {
  const { theme, colorScheme, changeTheme, changeColorScheme, isDark } = useTheme()

  const colorSchemes = [
    { id: COLOR_SCHEMES.DEFAULT, name: 'Default', className: isDark ? 'bg-gray-700' : 'bg-gray-100' },
    { id: COLOR_SCHEMES.BLUE, name: 'Sky Blue', className: isDark ? 'bg-sky-800' : 'bg-sky-100' },
    { id: COLOR_SCHEMES.GREEN, name: 'Mint', className: isDark ? 'bg-emerald-800' : 'bg-emerald-100' },
    { id: COLOR_SCHEMES.PURPLE, name: 'Lavender', className: isDark ? 'bg-violet-800' : 'bg-violet-100' },
    { id: COLOR_SCHEMES.YELLOW, name: 'Cream', className: isDark ? 'bg-amber-800' : 'bg-amber-100' },
    { id: COLOR_SCHEMES.ORANGE, name: 'Peach', className: isDark ? 'bg-orange-800' : 'bg-orange-100' },
    { id: COLOR_SCHEMES.PINK, name: 'Rose', className: isDark ? 'bg-rose-800' : 'bg-rose-100' }
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className={`text-2xl font-bold mb-8 ${isDark ? 'text-white' : 'text-gray-800'}`}>Pengaturan Tema</h1>

      {/* Theme Mode Selection */}
      <div className={`mb-10 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
        <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-700'}`}>Mode Tampilan</h2>
        <div className="flex gap-4">
          <div
            onClick={() => changeTheme(THEMES.LIGHT)}
            className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer ${
              isDark ? 'hover:bg-gray-700 border-gray-700' : 'hover:bg-gray-50 border-gray-200'
            } transition-colors ${
              theme === THEMES.LIGHT
                ? isDark 
                  ? 'border-blue-500 ring-2 ring-blue-500 bg-blue-900' 
                  : 'border-blue-500 ring-2 ring-blue-500 bg-blue-50'
                : ''
            }`}
          >
            <HiSun className="text-3xl text-orange-500 mb-2" />
            <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>Light Mode</span>
          </div>

          <div
            onClick={() => changeTheme(THEMES.DARK)}
            className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer ${
              isDark ? 'hover:bg-gray-700 border-gray-700' : 'hover:bg-gray-50 border-gray-200'
            } transition-colors ${
              theme === THEMES.DARK
                ? isDark 
                  ? 'border-blue-500 ring-2 ring-blue-500 bg-blue-900' 
                  : 'border-blue-500 ring-2 ring-blue-500 bg-blue-50'
                : ''
            }`}
          >
            <HiMoon className="text-3xl text-purple-500 mb-2" />
            <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>Dark Mode</span>
          </div>
        </div>
      </div>

      {/* Color Scheme Selection */}
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
        <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-700'}`}>Warna Tema</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {colorSchemes.map((scheme) => (
            <div
              key={scheme.id}
              onClick={() => changeColorScheme(scheme.id)}
              className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer ${
                isDark ? 'hover:bg-gray-700 border-gray-700' : 'hover:bg-gray-50 border-gray-200'
              } transition-colors ${
                colorScheme === scheme.id
                  ? isDark 
                    ? 'border-sky-500 ring-2 ring-sky-500' 
                    : 'border-blue-500 ring-2 ring-blue-500'
                  : ''
              }`}
            >
              <div className={`w-16 h-16 rounded-full mb-2 ${scheme.className}`}></div>
              <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{scheme.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Preview Section */}
      <div className={`mt-10 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
        <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-700'}`}>Pratinjau</h2>
        <div
          className={`p-4 rounded-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'} ${
            colorScheme === COLOR_SCHEMES.DEFAULT
              ? isDark
                ? 'bg-gray-700'
                : 'bg-gray-100'
              : colorScheme === COLOR_SCHEMES.BLUE
                ? isDark
                  ? 'bg-sky-800'
                  : 'bg-sky-100'
                : colorScheme === COLOR_SCHEMES.GREEN
                  ? isDark
                    ? 'bg-emerald-800'
                    : 'bg-emerald-100'
                  : colorScheme === COLOR_SCHEMES.PURPLE
                    ? isDark
                      ? 'bg-violet-800'
                      : 'bg-violet-100'
                    : colorScheme === COLOR_SCHEMES.YELLOW
                      ? isDark
                        ? 'bg-amber-800'
                        : 'bg-amber-100'
                      : colorScheme === COLOR_SCHEMES.ORANGE
                        ? isDark
                          ? 'bg-orange-800'
                          : 'bg-orange-100'
                        : colorScheme === COLOR_SCHEMES.PINK
                          ? isDark
                            ? 'bg-rose-800'
                            : 'bg-rose-100'
                          : ''
          }`}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-500"></div>
            <div>
              <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>Sample Card</h3>
              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Preview how your theme looks
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
              Primary Button
            </button>
            <button className={`px-4 py-2 ${
              isDark ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            } rounded-md`}>
              Secondary Button
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HalamanTema
