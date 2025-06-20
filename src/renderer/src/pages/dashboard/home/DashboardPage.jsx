import { HiCurrencyDollar, HiShoppingBag, HiUserGroup, HiWallet } from 'react-icons/hi2'
import React, { use, useEffect, useState } from 'react'

import DashboardCard from '../../../features/dashboard/ui/DashboardCard'
import { Link } from 'react-router-dom'
import { useTheme } from '../../../context/ThemeContext'

const DashboardPage = () => {
  const { isDark } = useTheme()
  // Sample account balances

  const [users, setUsers] = useState([])
  const [sumberDanaList, setSumberDanaList] = useState([])
  const [toko, setToko] = useState([])
  const [totalPegawaiTiapToko, setTotalPegawaiTiapToko] = useState(0)
  const [totalSeluruhPegawai, setTotalSeluruhPegawai] = useState(0)
  // Sample sales data
  const [transaction, setTransactions] = useState([])

  const fetchTransaksi = async () => {
    try {
      const result = await window.api.getTransaksi()
      setTransactions(result)
    } catch (error) {
      console.error('Gagal ambil data transaksi:', error)
    }
  }

  const fetchSaldo = async () => {
    try {
      const result = await window.api.getSaldoAwal()
      setSumberDanaList(result)
    } catch (error) {
      console.error('Gagal ambil data saldo:', error)
    }
  }
  const fetchToko = async () => {
    try {
      const result = await window.api.getTokoWithEmployeeCount()
      setToko(result)
      setTotalPegawaiTiapToko(result.reduce((total, toko) => total + toko.total_pegawai, 0))
    } catch (error) {
      console.error('Gagal ambil data toko:', error)
    }
  }
  useEffect(() => {
    fetchToko()
    fetchTransaksi()
    fetchSaldo()
  }, [])
  const totalProfit = transaction.reduce((total, trx) => total + (trx.fee || 0), 0)
  const totalBalance = sumberDanaList.reduce((acc, curr) => acc + curr.saldo, 0)

  const countTotalKaryawan = async () => {
    try {
      const result = await window.api.countKaryawan()
      setTotalSeluruhPegawai(result)
    } catch (error) {
      console.error('Gagal ambil data Users:', error)
    }
  }

  useEffect(() => {
    countTotalKaryawan()
  }, [])

  const totalStores = toko.length

  const totalEmployees = totalSeluruhPegawai
  const statistic = [
    {
      name: 'Total Toko',
      value: totalStores,
      icon: <HiShoppingBag size={24} className="text-blue-600" />,
      linkTo: '/dashboard/kelola-toko'
    },
    {
      name: 'Total Pegawai',
      value: totalEmployees,
      icon: <HiUserGroup size={24} className="text-green-600" />,
      linkTo: '/dashboard/kelola-toko'
    },
    {
      name: 'Total profit',
      value: `Rp ${totalProfit.toLocaleString('id-ID')}`,

      icon: <HiCurrencyDollar size={24} className="text-yellow-600" />,
      linkTo: '/dashboard/transaksi'
    },
    {
      name: 'Total Saldo',
      value: `Rp ${totalBalance.toLocaleString('id-ID')}`,
      icon: <HiWallet size={24} className="text-purple-600" />,
      linkTo: '/dashboard/saldo-awal'
    }
  ]

  return (
    <div>
      <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-6`}>
        Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statistic.map((stat, index) => (
          <Link to={stat.linkTo} key={index} className="block hover:no-underline">
            <div
              className={`${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} rounded-lg shadow-md p-6 transition-all hover:shadow-lg hover:-translate-y-1`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`${isDark ? 'text-gray-300' : 'text-gray-500'} text-sm`}>
                    {stat.name}
                  </p>
                  <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : ''}`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-full`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : ''}`}>Daftar Toko</h2>
          <Link
            to="/dashboard/kelola-toko"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Lihat Semua
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {toko.map((store) => (
            <div
              key={store.id}
              className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md overflow-hidden`}
            >
              <div className="p-5">
                <h3 className={`font-bold text-lg mb-2 ${isDark ? 'text-white' : ''}`}>
                  {store.nama_toko}
                </h3>
                <div className={`space-y-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  <p className="flex items-start">
                    <span className="font-medium mr-2">Alamat:</span>
                    <span>{store.alamat}</span>
                  </p>
                  <p className="flex items-center">
                    <span className="font-medium mr-2">Telepon:</span>
                    <span>{store.no_telepon}</span>
                  </p>
                  <p className="flex items-center">
                    <span className="font-medium mr-2">Jumlah Pegawai:</span>
                    <span>{store.totalEmployees} orang</span>
                  </p>
                </div>
              </div>
              <div
                className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'} p-4 border-t`}
              >
                <Link
                  to={`/dashboard/kelola-toko/${store.id}`}
                  className="text-blue-500 hover:text-blue-400 text-sm font-medium"
                >
                  Lihat Detail
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
