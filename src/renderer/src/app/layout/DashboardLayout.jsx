import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../../shared/ui/Sidebar";
import Breadcrumb from "../../shared/ui/BreadCrumb";

const DashboardLayout = () => {
  return (
    <>
      <div className="container max-w-[1200px] mx-auto flex flex-col sm:flex-row justify-between gap-x-8 px-4">
        <div className="w-[300px]">
          <Sidebar />
        </div>
        <div className="w-full py-6 px-0 sm:px-4">
          <Breadcrumb />
          <Outlet />
        </div>
      </div>
    </>
  );
};

export default DashboardLayout;
