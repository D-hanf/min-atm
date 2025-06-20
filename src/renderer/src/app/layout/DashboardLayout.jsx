import { Outlet, useNavigate } from 'react-router-dom'

import Breadcrumb from '../../shared/ui/BreadCrumb'
import Sidebar from '../../shared/ui/Sidebar'
import { useState } from 'react'

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // const navigate = useNavigate()
  return (
    <div className="flex w-full h-screen">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      <div className="flex-1 overflow-auto">
        <div className="py-6 px-4">
          <Breadcrumb />
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout
