import React from 'react'

const TransactionMenu = ({ onSelectTransaction }) => {
  const menuItems = [
    {
      id: 'tarik-tunai',
      name: 'Tarik Tunai',
      icon: '💰',
      bgColor: 'bg-blue-100',
      hoverColor: 'hover:bg-blue-200'
    },
    {
      id: 'transfer',
      name: 'Transfer',
      icon: '🔄',
      bgColor: 'bg-green-100',
      hoverColor: 'hover:bg-green-200'
    },
    {
      id: 'jasa-transfer',
      name: 'Jasa Transfer',
      icon: '🏦',
      bgColor: 'bg-yellow-100',
      hoverColor: 'hover:bg-yellow-200'
    },
    {
      id: 'mode-pulsa',
      name: 'Mode Pulsa',
      icon: '📱',
      bgColor: 'bg-purple-100',
      hoverColor: 'hover:bg-purple-200'
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
          <div className="font-medium">{item.name}</div>
        </div>
      ))}
    </div>
  )
}

export default TransactionMenu
