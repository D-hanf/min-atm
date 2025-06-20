import { Outlet } from 'react-router-dom'
import React from 'react'
import Sidebar from '../../shared/ui/Sidebar'
import { useTheme } from '../../context/ThemeContext'

const DashboardLayout = () => {
  const { isDark, colorScheme } = useTheme()

  const getBgColorClass = () => {
    if (!isDark) {
      switch(colorScheme) {
        case 'blue': return 'bg-blue-50'
        case 'green': return 'bg-green-50'
        case 'purple': return 'bg-purple-50'
        case 'yellow': return 'bg-yellow-50'
        case 'orange': return 'bg-orange-50'
        case 'pink': return 'bg-pink-50'
        default: return 'bg-gray-50'
      }
    } else {
      switch(colorScheme) {
        case 'blue': return 'bg-blue-900'
        case 'green': return 'bg-green-900'
        case 'purple': return 'bg-purple-900'
        case 'yellow': return 'bg-yellow-900'
        case 'orange': return 'bg-orange-900'
        case 'pink': return 'bg-pink-900'
        default: return 'bg-gray-900'
      }
    }
  }

  return (
    <div className={`flex h-screen w-screen ${getBgColorClass()} transition-colors duration-300`}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className={`min-h-screen p-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default DashboardLayout
