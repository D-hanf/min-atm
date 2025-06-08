import { AiOutlineMinus, AiOutlinePlus, AiOutlineShop } from 'react-icons/ai'
import {
  HiBars3,
  HiOutlineArrowLeftEndOnRectangle,
  HiOutlineCog,
  HiOutlineCube,
  HiOutlineCurrencyDollar,
  HiOutlineHome,
  HiOutlineShoppingBag,
  HiOutlineUser,
  HiXMark
} from 'react-icons/hi2'
import { HiOutlineBars4, HiOutlineChevronDoubleLeft } from 'react-icons/hi2'
import { Link, useLocation } from 'react-router-dom'
import React, { useState } from 'react'

const Sidebar = () => {
  const location = useLocation()
  const currentLocation = location.pathname
  const [isOpen, setIsOpen] = useState(true)
  const [expandedMenu, setExpandedMenu] = useState(null)

  const toggleSubMenu = (index) => {
    if (expandedMenu === index) {
      setExpandedMenu(null)
    } else {
      setExpandedMenu(index)
    }
  }

  const navigations = [
    {
      title: 'Menu',
      items: [
        {
          label: 'Dashboard',
          icon: <HiOutlineHome size={18} />,
          to: '/dashboard'
        },
        {
          label: 'Transaksi',
          icon: <HiOutlineShoppingBag size={18} />,
          to: '/dashboard/transaksi'
        },
        {
          label: 'Kelola Data',
          icon: <HiOutlineCube size={18} />,
          hasSubmenu: true,
          submenu: [
            {
              label: 'Pindah Saldo',
              to: '/dashboard/pindah-saldo'
            },
            {
              label: 'Ambil Saldo',
              to: '/dashboard/ambil-saldo'
            },
            {
              label: 'Saldo Awal',
              to: '/dashboard/saldo-awal'
            }
          ]
        }
      ]
    },
    {
      title: 'Pengaturan',
      items: [
        {
          label: 'Kelola Toko',
          icon: <HiOutlineCog size={18} />,
          to: '/dashboard/kelola-toko'
        },
        {
          label: 'Kelola Toko',
          icon: <AiOutlineShop size={18} />,
          to: '/dashboard/kelola-toko'
        },
        {
          label: 'Logout',
          icon: <HiOutlineArrowLeftEndOnRectangle size={18} />,
          to: '/'
          // onClick: logout, // Uncomment if you want to handle logout
        }
      ]
    }
  ]

  return (
    <div
  className={`
    flex flex-col h-screen bg-white border-r border-zinc-200 overflow-y-auto
    transition-all duration-300 ease-in-out
    ${isOpen ? "w-64" : "w-16"}
  `}
>
  <div className="flex justify-between items-center px-4 py-6">
    {isOpen ? (
      <>
        <h1 className="text-xl font-bold text-zinc-800">Cashier App</h1>
        <HiOutlineChevronDoubleLeft
          onClick={() => setIsOpen(false)}
          className="cursor-pointer"
          size={24}
        />
      </>
    ) : (
      <HiOutlineBars4
        onClick={() => setIsOpen(true)}
        className="cursor-pointer mx-auto"
        size={24}
      />
    )}
  </div>

  {isOpen && (
    <div className="flex items-center gap-3 px-4 py-4 border-t border-b border-zinc-200">
      <div className="w-10 h-10 rounded-full bg-zinc-200 overflow-hidden">
        <img
          src="/placeholder-profile.jpg"
          alt="Profile"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null
            e.target.src =
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23999'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E"
          }}
        />
      </div>
      <div>
        <p className="font-medium text-sm">John Doe</p>
        <p className="text-xs text-zinc-500">Admin Toko</p>
      </div>
    </div>
  )}

  <div className="flex-1 py-6 px-2">
    {navigations.map((section, index) => (
      <div key={index} className={index > 0 ? "mt-8" : ""}>
        {isOpen && (
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4 px-2">
            {section.title}
          </h3>
        )}
        <ul className="space-y-2">
          {section.items.map((item, idx) => (
            <li key={idx}>
              {item.hasSubmenu ? (
                <button
                  onClick={() => toggleSubMenu(`${index}-${idx}`)}
                  className={`flex items-center gap-x-3 w-full p-2.5 rounded-md transition-colors hover:bg-zinc-50 text-sm text-zinc-700`}
                >
                  <span className="text-zinc-600 min-w-[20px]">{item.icon}</span>
                  {isOpen && <span>{item.label}</span>}
                </button>
              ) : (
                <Link
                  to={item.to}
                  className={`flex items-center gap-x-3 p-2.5 rounded-md transition-colors ${
                    currentLocation === item.to
                      ? "bg-zinc-100 text-zinc-800 font-medium"
                      : "text-zinc-600 hover:bg-zinc-50"
                  }`}
                  onClick={item.onClick}
                >
                  <span className="text-zinc-600 min-w-[20px]">{item.icon}</span>
                  {isOpen && <span className="text-sm">{item.label}</span>}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    ))}
  </div>
</div>

  )
}

export default Sidebar
