import {
  HiBars3,
  HiOutlineArrowLeftEndOnRectangle,
  HiOutlineCog,
  HiOutlineCube,
  HiOutlineCurrencyDollar,
  HiOutlineHome,
  HiOutlineShoppingBag,
  HiOutlineUser,
  HiXMark,
} from "react-icons/hi2";
import { Link, useLocation } from "react-router-dom";
import React, { useState } from "react";

const Sidebar = () => {
  const location = useLocation();
  const currentLocation = location.pathname;
  // const { logout } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState(null);

  const toggleSubMenu = (index) => {
    if (expandedMenu === index) {
      setExpandedMenu(null);
    } else {
      setExpandedMenu(index);
    }
  };

  const navigations = [
    {
      title: "Menu",
      items: [
        {
          label: "Dashboard",
          icon: <HiOutlineHome size={18} />,
          to: "/dashboard",
        },
        {
          label: "Transaksi",
          icon: <HiOutlineShoppingBag size={18} />,
          to: "/dashboard/transaksi",
        },
        {
          label: "Kelola Data",
          icon: <HiOutlineCube size={18} />,
          hasSubmenu: true,
          submenu: [
            {
              label: "Pindah Saldo",
              to: "/dashboard/pindah-saldo",
            },
            {
              label: "Ambil Saldo",
              to: "/dashboard/ambil-saldo",
            },
            {
              label: "Saldo Awal",
              to: "/dashboard/saldo-awal",
            },
          ]
        },
      ],
    },
    {
      title: "Pengaturan",
      items: [
        {
          label: "Kelola Toko",
          icon: <HiOutlineCog size={18} />,
          to: "/dashboard/kelola-toko",
        },
        {
          label: "Profil",
          icon: <HiOutlineUser size={18} />,
          to: "/dashboard/profile",
        },
        {
          label: "Logout",
          icon: <HiOutlineArrowLeftEndOnRectangle size={18} />,
          to: "/",
          // onClick: logout, // Uncomment if you want to handle logout
        }
      ],
    },
  ];

  return (
    <>
      {/* Hamburger Trigger for Mobile */}
      <button
        className="sm:hidden py-4 px-6 cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        <HiBars3 size={24} />
      </button>

      {/* Sidebar Drawer */}
      <div
        className={`fixed top-0 left-0 w-full sm:w-auto h-full bg-white z-50 border-r border-zinc-200 transform transition-transform duration-300 ease-in-out
        ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } sm:translate-x-0 sm:static sm:block sm:h-screen overflow-y-auto`}
      >
        {/* Close button for mobile */}
        <div className="flex justify-end w-full p-4 sm:hidden">
          <button className="cursor-pointer" onClick={() => setIsOpen(false)}>
            <HiXMark size={24} />
          </button>
        </div>

        {/* App Name */}
        <div className="px-6 py-6 border-b border-zinc-200">
          <h1 className="text-xl font-bold text-zinc-800">Cashier App</h1>
        </div>

        {/* Profile Section */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-zinc-200">
          <div className="w-10 h-10 rounded-full bg-zinc-200 overflow-hidden">
            <img 
              src="/placeholder-profile.jpg" 
              alt="Profile" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23999'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";
              }}
            />
          </div>
          <div>
            <p className="font-medium text-sm">John Doe</p>
            <p className="text-xs text-zinc-500">Admin Toko</p>
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="py-6 px-6">
          {navigations.map((section, index) => (
            <div key={index} className={index > 0 ? "mt-8" : ""}>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.items.map((item, idx) => (
                  <li key={idx}>
                    {item.hasSubmenu ? (
                      <div>
                        <button
                          onClick={() => toggleSubMenu(`${index}-${idx}`)}
                          className={`flex items-center justify-between w-full gap-x-3 p-2.5 rounded-md transition-colors hover:bg-zinc-50 text-sm text-zinc-700`}
                        >
                          <div className="flex items-center gap-x-3">
                            <span className="text-zinc-600 min-w-[20px]">{item.icon}</span>
                            <span>{item.label}</span>
                          </div>
                          <svg
                            className={`w-4 h-4 transition-transform duration-200 ${
                              expandedMenu === `${index}-${idx}` ? 'transform rotate-180' : ''
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        
                        {expandedMenu === `${index}-${idx}` && (
                          <ul className="pl-10 mt-1 space-y-1.5">
                            {item.submenu.map((subitem, subidx) => (
                              <li key={subidx}>
                                <Link
                                  to={subitem.to}
                                  className={`block p-2.5 text-sm rounded-md transition-colors ${
                                    currentLocation === subitem.to
                                      ? "bg-zinc-100 text-zinc-800 font-medium"
                                      : "text-zinc-600 hover:bg-zinc-50"
                                  }`}
                                  onClick={() => setIsOpen(false)}
                                >
                                  {subitem.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : (
                      <Link
                        to={item.to}
                        className={`flex items-center gap-x-3 p-2.5 rounded-md transition-colors ${
                          currentLocation === item.to
                            ? "bg-zinc-100 text-zinc-800 font-medium"
                            : "text-zinc-600 hover:bg-zinc-50"
                        }`}
                        onClick={item.onClick || (() => setIsOpen(false))}
                      >
                        <span className="text-zinc-600 min-w-[20px]">{item.icon}</span>
                        <span className="text-sm">{item.label}</span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Sidebar;