import { Outlet, useNavigate } from "react-router-dom";

import Breadcrumb from "../../shared/ui/BreadCrumb";
import React from "react";
import Sidebar from "../../shared/ui/Sidebar";

const DashboardLayout = () => {
  return (
    <>
      <div className="w-full mx-auto flex flex-col sm:flex-row">
        <div className="w-full sm:w-3/12">
          <Sidebar />
        </div>
        <div className="w-full sm:w-9/12 py-6 px-0 sm:px-4">
          <Breadcrumb />
          <Outlet />
        </div>
      </div>
    </>
  );
};

export default DashboardLayout;