import React from "react";
import { Route } from "react-router-dom";
import LoginForm from "../../pages/Login";
import { DashboardLayout } from "../layout";
import { DashboardPage } from "../../pages/dashboard/home";
import KelolaToko from "../../pages/KelolaToko";
import LoginForm from "../../pages/Login";
import React from "react";
import { Route } from "react-router-dom";

// import ProtectedRoute from "./ProtectedRoute";

import { HalamanTransaksi } from "../../pages/dashboard/transaksi";
import { HalamanKelolaToko, HalamanDetilToko } from "../../pages/dashboard/kelolaToko";
import { HalamanProfile } from "../../pages/dashboard/profile";
import {
  HalamanAmbilSaldo,
  HalamanAwalSaldo,
  HalamanPindahSaldo,
} from "../../pages/dashboard/kelolaData";

const DashboardRoutes = () => {
  return (
    <>
      {/* <Route element={<ProtectedRoute />}> */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          {/* <Route path="article" element={<ArticleManagePage />} />
          <Route path="article/:id/edit" element={<ArticleEditPage />} />
          <Route path="write" element={<ArticleWritePage />} />
          <Route path="profile" element={<EditProfilePage />} /> */}
          <Route path="kelola-toko" element={<KelolaToko />} />
        </Route>
        <Route path="/" element={<LoginForm />}>
        </Route>
      {/* </Route> */}
    </>
  );
};

export default DashboardRoutes;
