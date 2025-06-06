import React from "react";
import { Route } from "react-router-dom";
import LoginForm from "../../pages/Login";
import { DashboardLayout } from "../layout";
import { DashboardPage } from "../../pages/dashboard/home";

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
          <Route path="transaksi" element={<HalamanTransaksi />} />
          <Route path="pindah-saldo" element={<HalamanPindahSaldo />} />
          <Route path="ambil-saldo" element={<HalamanAmbilSaldo />} />
          <Route path="saldo-awal" element={<HalamanAwalSaldo />} />
          <Route path="kelola-toko" element={<HalamanKelolaToko />} />
          <Route path="kelola-toko/:id" element={<HalamanDetilToko />} />
          <Route path="profile" element={<HalamanProfile />} />
          {/* <Route path="password" element={<ChangePasswordPage />} /> */}
        </Route>
        <Route path="/" element={<LoginForm />}>
        </Route>
      {/* </Route> */}
    </>
  );
};

export default DashboardRoutes;
