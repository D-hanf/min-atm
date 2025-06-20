import React from 'react'
import { useTheme } from '../../../context/ThemeContext'

const TransactionMenu = ({ onSelectTransaction }) => {
  const { isDark } = useTheme()
  
  const menuItems = [
    {
      id: 'tarik-tunai',
      name: 'Tarik Tunai',
      icon: '💰',
      bgColor: isDark ? 'bg-blue-900' : 'bg-blue-100',
      hoverColor: isDark ? 'hover:bg-blue-800' : 'hover:bg-blue-200'
    },
    {
      id: 'transfer',
      name: 'Transfer',
      icon: '🔄',
      bgColor: isDark ? 'bg-green-900' : 'bg-green-100',
      hoverColor: isDark ? 'hover:bg-green-800' : 'hover:bg-green-200'
    },
    {
      id: 'jasa-transfer',
      name: 'Jasa Transfer',
      icon: '🏦',
      bgColor: isDark ? 'bg-yellow-900' : 'bg-yellow-100',
      hoverColor: isDark ? 'hover:bg-yellow-800' : 'hover:bg-yellow-200'
    },
    {
      id: 'mode-pulsa',
      name: 'Mode Pulsa',
      icon: '📱',
      bgColor: isDark ? 'bg-purple-900' : 'bg-purple-100',
      hoverColor: isDark ? 'hover:bg-purple-800' : 'hover:bg-purple-200'
    }
  ]

  return (
    <div className="grid grid-cols-2 gap-4 w-full">
      {menuItems.map((item) => (
        <div
          key={item.id}
          onClick={() => onSelectTransaction(item.id, item.name)}
          className={`p-6 ${item.bgColor} rounded-lg text-center cursor-pointer ${item.hoverColor} transition-colors flex flex-col items-center justify-center`}
        >
          <div className="text-3xl mb-2">{item.icon}</div>
          <div className={`font-medium ${isDark ? 'text-white' : ''}`}>{item.name}</div>
        </div>
      ))}
    </div>
  )
}

export default TransactionMenu
