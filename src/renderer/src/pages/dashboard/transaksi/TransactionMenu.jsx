import React from 'react'
import { useTheme } from '../../../context/ThemeContext'

const TransactionMenu = ({ onSelectTransaction }) => {
  const { isDark } = useTheme()

  const menuItems = [
    {
      id: 'tarik-tunai',
      name: 'Tarik Tunai',
      icon: '💰',
      bgColor: isDark ? 'bg-sky-800' : 'bg-sky-100',
      hoverColor: isDark ? 'hover:bg-sky-700' : 'hover:bg-sky-200'
    },
    {
      id: 'transfer',
      name: 'Transfer',
      icon: '🔄',
      bgColor: isDark ? 'bg-emerald-800' : 'bg-emerald-100',
      hoverColor: isDark ? 'hover:bg-emerald-700' : 'hover:bg-emerald-200'
    },
    {
      id: 'jasa-transfer',
      name: 'Jasa Transfer',
      icon: '🏦',
      bgColor: isDark ? 'bg-amber-800' : 'bg-amber-100',
      hoverColor: isDark ? 'hover:bg-amber-700' : 'hover:bg-amber-200'
    },
    {
      id: 'mode-pulsa',
      name: 'Mode Pulsa',
      icon: '📱',
      bgColor: isDark ? 'bg-violet-800' : 'bg-violet-100',
      hoverColor: isDark ? 'hover:bg-violet-700' : 'hover:bg-violet-200'
    },
    {
      id: 'cek-saldo',
      name: 'Cek Saldo',
      icon: '💳',
      bgColor: isDark ? 'bg-rose-800' : 'bg-rose-100',
      hoverColor: isDark ? 'hover:bg-rose-700' : 'hover:bg-rose-200'
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