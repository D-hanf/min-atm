// import { useAuth } from "@/app/contexts/AuthContext";

import {
  HiBars3,
  HiOutlineArrowLeftEndOnRectangle,
  HiOutlineDocument,
  HiOutlineKey,
  HiOutlinePencilSquare,
  HiOutlineUserCircle,
  HiXMark,
} from "react-icons/hi2";
import { Link, useLocation } from "react-router-dom";
import React, { useState } from "react";

import { AiOutlineShop } from "react-icons/ai";

const Sidebar = () => {
  const location = useLocation();
  const currentLocation = location.pathname;
  // const { logout } = useAuth();

  const [isOpen, setIsOpen] = useState(false);

  const navigations = [
    {
      title: "Dashboard",
      items: [
        {
          label: "Articles",
          icon: <HiOutlineDocument size={18} />,
          to: "/dashboard/article",
        },
        {
          label: "Write",
          icon: <HiOutlinePencilSquare size={18} />,
          to: "/dashboard/write",
        },
      ],
    },
    {
      title: "Settings",
      items: [
        {
          label: "Edit Profile",
          icon: <HiOutlineUserCircle size={18} />,
          to: "/dashboard/profile",
        },
        {
          label: "Kelola Toko",
          icon: <AiOutlineShop size={18} />,
          to: "/dashboard/kelola-toko",
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
        className="md:hidden py-4 cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        <HiBars3 size={24} />
      </button>

      {/* Sidebar Drawer */}
      <div
        className={`fixed top-0 left-0 w-64 h-full bg-white z-50 border-r border-zinc-200 transform transition-transform duration-300 ease-in-out
        ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:static md:block`}
      >
        {/* Close button for mobile */}
        <div className="flex justify-end w-full p-4 md:hidden">
          <button className="cursor-pointer" onClick={() => setIsOpen(false)}>
            <HiXMark size={24} />
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="container py-6 pl-4">
          {navigations.map((section, index) => (
            <div key={index} className={index > 0 ? "mt-12" : ""}>
              <h3 className="text-sm sm:text-md font-semibold">
                {section.title}
              </h3>
              <ul className="mt-6">
                {section.items.map((item, idx) => (
                  <li
                    key={idx}
                    className={`flex items-center gap-x-4 p-3 ${
                      currentLocation.startsWith(item.to)
                        ? "bg-zinc-100 border-r-2 border-zinc-800"
                        : ""
                    }`}
                  >
                    {item.icon}
                    <Link
                      to={item.to}
                      className="text-sm text-zinc-700 font-normal"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <button
            onClick={() => setIsOpen(false)}
            className="text-sm flex items-center gap-4 mt-12 p-3 cursor-pointer"
          >
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
