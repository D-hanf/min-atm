import {
  HiOutlineArrowLeftEndOnRectangle,
  HiOutlineBars4,
  HiOutlineChevronDoubleLeft,
  HiOutlineCog,
  HiOutlineCube,
  HiOutlineHome,
  HiOutlineShoppingBag,
  HiOutlineSwatch,
  HiOutlineViewColumns
} from 'react-icons/hi2'
import { Link, useLocation } from 'react-router-dom'
import React, { useEffect, useState } from 'react'

import { AiOutlineShop } from 'react-icons/ai'
import ConfirmDialog from '../../components/ConfirmDialog'
import { PiMoneyLight } from 'react-icons/pi'
import { TbReportMoney } from 'react-icons/tb'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../context/ThemeContext'

const Sidebar = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const currentLocation = location.pathname
  const [hoveringSidebar, setHoveringSidebar] = useState(false)
  const [openSubmenu, setOpenSubmenu] = useState(null)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const { isDark } = useTheme()

  useEffect(() => {
    setIsOpen(hoveringSidebar)
    if (!hoveringSidebar) setOpenSubmenu(null)
  }, [hoveringSidebar])

  const user = JSON.parse(localStorage.getItem('user'))
  const isAdmin = user?.role === 'admin'

  const toggleSubmenu = (index) => {
    if (isOpen) {
      setOpenSubmenu((prev) => (prev === index ? null : index))
    }
  }

  const handleSubmenuHover = (index) => {
    if (!isOpen) {
      setOpenSubmenu(index)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    navigate('/')
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
          label: "Koreksi transaksi",
          icon: <HiOutlineViewColumns size={18} />,
          to: '/dashboard/koreksi-transaksi'
        },
        {
          label: "Semua transaksi",
          icon: <HiOutlineViewColumns size={18} />,
          to: '/dashboard/semua-transaksi'
        },
        
        {
          label: 'Kelola Data',
          icon: <HiOutlineCube size={18} />,
          hasSubmenu: true,
          submenu: [
            { label: 'Pindah Saldo', to: '/dashboard/pindah-saldo' },
            { label: 'Ambil Saldo', to: '/dashboard/ambil-saldo' },
            { label: 'Hutang', to: '/dashboard/hutang' },
            ...(isAdmin ? [{ label: 'Saldo Awal', to: '/dashboard/saldo-awal' }] : [])
          ]
        },
        ...(isAdmin
          ? [
              {
                label: 'Laporan Keuangan',
                icon: <TbReportMoney size={18} />,
                to: '/dashboard/laporan-keuangan'
              },
              { label: 'Laporan Aset',
                icon: <HiOutlineCube size={18} />, to: '/dashboard/transaksi/laporan-aset' },
              {
                label: 'Keuntungan',
                icon: <PiMoneyLight size={18} />,
                to: '/dashboard/laporan-keuangan/keuntungan'
              }
            ]
          : [])
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
          label: isAdmin ? 'Setting Sistem' : 'Setting Kolom',
          icon: <HiOutlineCog size={18} />,
          to: '/dashboard/setting'
        },
        {
          label: 'Tema Aplikasi',
          icon: <HiOutlineSwatch size={18} />,
          to: '/dashboard/tema'
        },
        {
          label: 'Logout',
          icon: <HiOutlineArrowLeftEndOnRectangle size={18} />,
          action: () => setConfirmLogout(true)
        }
      ]
    }
  ]

  return (
    <>
      <div
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => {
          setIsOpen(false)
          setOpenSubmenu(null)
        }}
        className={`
    flex flex-col h-screen ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-zinc-200'} border-r transition-all duration-300 ease-in-out
    ${isOpen ? 'w-64' : 'w-[80px]'}
  `}
      >
        <div className="flex items-center justify-between px-4 py-6">
          {isOpen && (
            <h1
              className={`text-xl font-bold ${isDark ? 'text-white' : 'text-zinc-800'} select-none`}
            >
              mini ATM
            </h1>
          )}
        </div>

        <div
          className={`flex items-center gap-3 px-4 py-4 ${isDark ? 'border-gray-700' : 'border-zinc-200'} border-t border-b cursor-default transition-all duration-300
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
              <p className={`font-medium text-sm ${isDark ? 'text-white' : ''}`}>{user.nama}</p>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-zinc-500'}`}>{user.role}</p>
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

        <div className="flex-1 py-6 px-5">
          {navigations.map((section, iSection) => (
            <div key={iSection} className={iSection > 0 ? 'mt-6' : ''}>
              {isOpen && (
                <h3
                  className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-zinc-500'} uppercase tracking-wider mb-4 px-2 select-none`}
                >
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
                          ${
                            isDark
                              ? 'hover:bg-gray-700 text-gray-300'
                              : 'hover:bg-zinc-100 text-zinc-700'
                          } select-none
                          ${currentLocation.startsWith(item.to) ? `${isDark ? 'bg-gray-800 text-white' : 'bg-zinc-100 text-zinc-800'} font-medium` : ''}`}
                        >
                          <span className={isDark ? 'text-gray-400' : 'text-zinc-600'}>
                            {item.icon}
                          </span>
                          <span
                            className={`transition-all duration-300 ease-in-out
                            ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}`}
                          >
                            {item.label}
                          </span>
                        </button>

                        {isOpen && openSubmenu === `${iSection}-${iItem}` && (
                          <div className="ml-6 mt-2 space-y-1 select-none">
                            {item.submenu.map((sub, subIdx) => (
                              <button
                                key={subIdx}
                                onClick={() => navigate(sub.to)}
                                className={`block w-full text-left px-2 py-1 rounded text-sm transition-colors
                                ${
                                  currentLocation === sub.to
                                    ? isDark
                                      ? 'bg-gray-700 font-medium text-white'
                                      : 'bg-zinc-100 font-medium text-zinc-800'
                                    : isDark
                                      ? 'text-gray-400 hover:bg-gray-800'
                                      : 'text-zinc-600 hover:bg-zinc-50'
                                }`}
                              >
                                {sub.label}
                              </button>
                            ))}
                          </div>
                        )}

                        {!isOpen && openSubmenu === `${iSection}-${iItem}` && (
                          <div
                            className={`absolute left-full top-0 ml-2 w-48 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-zinc-200'} border rounded shadow-lg opacity-100 visible transition-opacity duration-200 z-20`}
                          >
                            <ul className="py-2">
                              {item.submenu.map((sub, subIdx) => (
                                <li key={subIdx}>
                                  <Link
                                    to={sub.to}
                                    className={`block px-3 py-2 text-sm ${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-zinc-700 hover:bg-zinc-50'} whitespace-nowrap`}
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
                      <button
                        onClick={() => (item.action ? item.action() : navigate(item.to))}
                        className={`flex items-center gap-x-3 p-2.5 w-full text-left rounded-md transition-colors duration-200
                        ${
                          currentLocation === item.to
                            ? isDark
                              ? 'bg-gray-800 text-white font-medium'
                              : 'bg-zinc-100 text-zinc-800 font-medium'
                            : isDark
                              ? 'text-gray-300 hover:bg-gray-700'
                              : 'text-zinc-600 hover:bg-zinc-100'
                        }
                        select-none`}
                      >
                        <span className={isDark ? 'text-gray-400' : 'text-zinc-600'}>
                          {item.icon}
                        </span>
                        <span
                          className={`transition-all duration-300 ease-in-out
                          ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}`}
                        >
                          {item.label}
                        </span>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={handleLogout}
        title="Konfirmasi Logout"
        message="Apakah Anda yakin ingin keluar dari aplikasi?"
      />
    </>
  )
}

export default Sidebar
