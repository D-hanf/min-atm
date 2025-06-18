import {
  HiOutlineArrowLeftEndOnRectangle,
  HiOutlineBars4,
  HiOutlineChevronDoubleLeft,
  HiOutlineCube,
  HiOutlineHome,
  HiOutlineShoppingBag
} from 'react-icons/hi2'
import { Link, useLocation } from 'react-router-dom'
import React, { useEffect, useState } from 'react'

import { AiOutlineShop } from 'react-icons/ai'

const Sidebar = () => {
  const location = useLocation()
  const currentLocation = location.pathname
  const [isOpen, setIsOpen] = useState(false)
  const [hoveringSidebar, setHoveringSidebar] = useState(false)
  const [openSubmenu, setOpenSubmenu] = useState(null)

  // Atur sidebar open/close sesuai hover state
  useEffect(() => {
    setIsOpen(hoveringSidebar)
    if (!hoveringSidebar) setOpenSubmenu(null)
  }, [hoveringSidebar])

  // Ambil data user
  const user = JSON.parse(localStorage.getItem('user'))
  const isAdmin = user?.role === 'admin' // ⬅️ Cek role user

  // Toggle submenu saat sidebar terbuka klik menu
  const toggleSubmenu = (index) => {
    if (isOpen) {
      setOpenSubmenu((prev) => (prev === index ? null : index))
    }
  }

  // Hover submenu muncul saat sidebar tertutup
  const handleSubmenuHover = (index) => {
    if (!isOpen) {
      setOpenSubmenu(index)
    }
  }

  const navigations = [
    {
      title: 'Menu',
      items: [
        ...(isAdmin
          ? [
              {
                label: 'Dashboard',
                icon: <HiOutlineHome size={18} />,
                to: '/dashboard'
              }
            ]
          : []),
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
            { label: 'Pindah Saldo', to: '/dashboard/pindah-saldo' },
            { label: 'Ambil Saldo', to: '/dashboard/ambil-saldo' },
            ...(isAdmin ? [{ label: 'Saldo Awal', to: '/dashboard/saldo-awal' }] : [])
          ]
        }
      ]
    },
    {
      title: 'Pengaturan',
      items: [
        ...(isAdmin
          ? [
              {
                label: 'Kelola Toko',
                icon: <AiOutlineShop size={18} />,
                to: '/dashboard/kelola-toko'
              }
            ]
          : []),
        {
          label: 'Logout',
          icon: <HiOutlineArrowLeftEndOnRectangle size={18} />,
          to: '/'
        }
      ]
    }
  ]

  return (
    <div
      onMouseEnter={() => setHoveringSidebar(true)}
      onMouseLeave={() => setHoveringSidebar(false)}
      className={`flex flex-col h-screen bg-white border-r border-zinc-200 
        transition-all duration-300 ease-in-out
        ${isOpen ? 'w-64 opacity-100' : 'w-20 opacity-80'}
        relative`}
      style={{
        transform: isOpen ? 'translateX(0)' : 'translateX(-10px)'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-6">
        {isOpen && <h1 className="text-xl font-bold text-zinc-800 select-none">mini ATM</h1>}
      </div>

      {/* Profile section: selalu tampil */}
      <div
        className={`flex items-center gap-3 px-4 py-4 border-t border-b border-zinc-200 cursor-default transition-all duration-300
          ${isOpen ? 'w-full' : 'w-12 mx-auto justify-center'}`}
      >
        <div
          className={`rounded-full overflow-hidden bg-zinc-200 flex-shrink-0 transition-all duration-300
          ${isOpen ? 'w-10 h-10' : 'w-8 h-8'}`}
        >
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
        {isOpen && (
          <div className="select-none">
            <p className="font-medium text-sm">{user.nama}</p>
            <p className="text-xs text-zinc-500">{user.role}</p>

            {user.role === 'admin' && (
              <Link
                to="/dashboard/profile"
                className="mt-1 block text-blue-600 hover:underline text-xs"
              >
                Edit Profil
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Navigation items */}
      <div className="flex-1 py-6 px-5">
        {navigations.map((section, iSection) => (
          <div key={iSection} className={iSection > 0 ? 'mt-6' : ''}>
            {isOpen && (
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4 px-2 select-none">
                {section.title}
              </h3>
            )}
            <ul>
              {section.items.map((item, iItem) => (
                <li
                  key={iItem}
                  className="relative group"
                  onMouseEnter={() => handleSubmenuHover(`${iSection}-${iItem}`)}
                  onMouseLeave={() => !isOpen && setOpenSubmenu(null)}
                >
                  {item.hasSubmenu ? (
                    <>
                      <button
                        onClick={() => toggleSubmenu(`${iSection}-${iItem}`)}
                        className={`flex items-center gap-x-3 w-full p-2.5 rounded-md
                        transition-colors duration-200
                        hover:bg-zinc-50 text-sm text-zinc-700 select-none
                        ${currentLocation.startsWith(item.to) ? 'bg-zinc-100 font-medium text-zinc-800' : ''}`}
                      >
                        <span className="text-zinc-600 min-w-[20px]">{item.icon}</span>
                        <span
                          className={`transition-all duration-300 ease-in-out
                          ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}`}
                        >
                          {item.label}
                        </span>
                      </button>

                      {/* Submenu saat sidebar terbuka dan toggle aktif */}
                      {isOpen && openSubmenu === `${iSection}-${iItem}` && (
                        <div className="ml-6 mt-2 space-y-1 select-none">
                          {item.submenu.map((sub, subIdx) => (
                            <Link
                              key={subIdx}
                              to={sub.to}
                              className={`block px-2 py-1 rounded text-sm transition-colors
                              ${
                                currentLocation === sub.to
                                  ? 'bg-zinc-100 font-medium text-zinc-800'
                                  : 'text-zinc-600 hover:bg-zinc-50'
                              }`}
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      )}

                      {/* Submenu dropdown saat sidebar tertutup dan hover menu */}
                      {!isOpen && openSubmenu === `${iSection}-${iItem}` && (
                        <div className="absolute left-full top-0 ml-2 w-48 bg-white border border-zinc-200 rounded shadow-lg opacity-100 visible transition-opacity duration-200 z-20">
                          <ul className="py-2">
                            {item.submenu.map((sub, subIdx) => (
                              <li key={subIdx}>
                                <Link
                                  to={sub.to}
                                  className="block px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 whitespace-nowrap"
                                >
                                  {sub.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      to={item.to}
                      className={`flex items-center gap-x-3 p-2.5 rounded-md transition-colors duration-200
                      ${currentLocation === item.to ? 'bg-zinc-100 text-zinc-800 font-medium' : 'text-zinc-600 hover:bg-zinc-50'}
                      select-none`}
                    >
                      <span className="text-zinc-600 min-w-[20px]">{item.icon}</span>
                      <span
                        className={`transition-all duration-300 ease-in-out
                        ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}`}
                      >
                        {item.label}
                      </span>
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
