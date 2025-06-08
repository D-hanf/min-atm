import { Outlet, useNavigate } from 'react-router-dom'

import Breadcrumb from '../../shared/ui/BreadCrumb'
import Sidebar from '../../shared/ui/Sidebar'
import { useState } from 'react'

const DashboardLayout = () => {
  // const navigate = useNavigate()
  return (
    <div className="flex w-full h-full ">
      <Sidebar className='w-1/3'/>
      <div
        className={`
      flex-1 transition-all duration-300
      ml-4 w-3/4
    `}
      >
        <div className="py-6 px-4">
          <Breadcrumb />
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout
