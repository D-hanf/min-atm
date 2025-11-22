import {
  HalamanAmbilSaldo,
  HalamanAwalSaldo,
  HalamanHutang,
  HalamanPindahSaldo
} from '../../pages/dashboard/kelolaData'
import { HalamanDetilToko, HalamanKelolaToko } from '../../pages/dashboard/kelolaToko'

import { DashboardLayout } from '../layout'
import { DashboardPage } from '../../pages/dashboard/home'
import { HalamanProfile } from '../../pages/dashboard/profile'
import { HalamanTema } from '../../pages/dashboard/tema' // Import the theme page
import { HalamanTransaksi } from '../../pages/dashboard/transaksi'
import KelolaToko from '../../pages/dashboard/kelolaToko/KelolaToko'
import Keuntungan from '../../pages/dashboard/laporan-keuangan/Keuntungan'
import LaporanAset from '../../pages/dashboard/transaksi/laporan-aset'
import LaporanKeuangan from '../../pages/dashboard/laporan-keuangan'
import LoginForm from '../../pages/Login'
import React from 'react'
import { Route } from 'react-router-dom'

// import ProtectedRoute from "./ProtectedRoute";

const DashboardRoutes = () => {
  return (
    <>
      {/* <Route element={<ProtectedRoute />}> */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="transaksi" element={<HalamanTransaksi />} />
        <Route path="transaksi/laporan-aset" element={<LaporanAset />} />
        <Route path="pindah-saldo" element={<HalamanPindahSaldo />} />
        <Route path="ambil-saldo" element={<HalamanAmbilSaldo />} />
        <Route path="saldo-awal" element={<HalamanAwalSaldo />} />
        <Route path="hutang" element={<HalamanHutang />} />
        <Route path="laporan-keuangan" element={<LaporanKeuangan />} />
        <Route path="laporan-keuangan/keuntungan" element={<Keuntungan />} />
        <Route path="kelola-toko" element={<KelolaToko />} />
        <Route path="kelola-toko/:id" element={<HalamanDetilToko />} />
        <Route path="profile" element={<HalamanProfile />} />
        <Route path="tema" element={<HalamanTema />} /> {/* Add the theme route */}
        {/* <Route path="password" element={<ChangePasswordPage />} /> */}
      </Route>
      <Route path="/" element={<LoginForm />}></Route>
      {/* </Route> */}
    </>
  )
}

export default DashboardRoutes
