import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../../shared/ui/Sidebar'
import { useTheme } from '../../context/ThemeContext'
import { useState } from 'react'

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const { isDark, colorScheme } = useTheme()
  
  // Determine the background color based on theme and color scheme
  const getBgColorClass = () => {
    if (!isDark) {
      // Light mode backgrounds
      switch(colorScheme) {
        case 'blue': return 'bg-blue-50';
        case 'green': return 'bg-green-50';
        case 'purple': return 'bg-purple-50';
        case 'yellow': return 'bg-yellow-50';
        case 'orange': return 'bg-orange-50';
        case 'pink': return 'bg-pink-50';
        default: return 'bg-gray-50';
      }
    } else {
      // Dark mode backgrounds
      switch(colorScheme) {
        case 'blue': return 'bg-blue-900';
        case 'green': return 'bg-green-900';
        case 'purple': return 'bg-purple-900';
        case 'yellow': return 'bg-yellow-900';
        case 'orange': return 'bg-orange-900';
        case 'pink': return 'bg-pink-900';
        default: return 'bg-gray-900';
      }
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <main className={`flex-1 overflow-y-auto ${getBgColorClass()} transition-colors duration-300`}>
        <div className={`container mx-auto p-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default DashboardLayout
