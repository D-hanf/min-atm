import { Outlet, useNavigate } from "react-router-dom";

import Breadcrumb from "../../shared/ui/BreadCrumb";
import React from "react";
import Sidebar from "../../shared/ui/Sidebar";

const DashboardLayout = () => {
  return (
    <>
      <div className="w-full mx-auto flex flex-col sm:flex-row justify-between gap-x-8">
        <div className="w-[300px]">
          <Sidebar />
        </div>
        <div className="w-full py-6 px-0 sm:px-4">
          <Breadcrumb />
          <Outlet />
        </div>
        <div>
        </div>
      </div>
    </>
  );
};

export default DashboardLayout;
