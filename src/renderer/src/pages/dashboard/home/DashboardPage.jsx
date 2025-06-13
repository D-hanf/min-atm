import { HiCurrencyDollar, HiShoppingBag, HiUserGroup, HiWallet } from 'react-icons/hi2'
import React, { useEffect, useState } from 'react'

import DashboardCard from '../../../features/dashboard/ui/DashboardCard'
import { Link } from 'react-router-dom'

const DashboardPage = () => {
  // Sample store data - in a real app, this would come from a context, API or props
  const [stores, setStores] = useState([
    {
      id: 1,
      name: 'Toko Pusat',
      totalEmployees: 8,
      address: 'Jl. Raya Pusat No. 123',
      phone: '081234567890'
    },
    {
      id: 2,
      name: 'Cabang Malang',
      totalEmployees: 5,
      address: 'Jl. Soekarno Hatta No. 45, Malang',
      phone: '081234567891'
    },
    {
      id: 3,
      name: 'Cabang Surabaya',
      totalEmployees: 6,
      address: 'Jl. Pemuda No. 56, Surabaya',
      phone: '081234567892'
    },
    {
      id: 4,
      name: 'Cabang Jakarta',
      totalEmployees: 10,
      address: 'Jl. Sudirman No. 78, Jakarta',
      phone: '081234567893'
    }
  ])

  // Sample account balances
  const [accountBalances, setAccountBalances] = useState([
    { platform: 'BRI', balance: 5000000 },
    { platform: 'BNI', balance: 3500000 },
    { platform: 'Mandiri', balance: 4200000 },
    { platform: 'DANA', balance: 1800000 },
    { platform: 'OVO', balance: 950000 },
    { platform: 'GoPay', balance: 1200000 }
  ])

  // Calculate total balance from all accounts
  const totalBalance = accountBalances.reduce((total, account) => total + account.balance, 0)

  // Calculate statistics
  const totalStores = stores.length
  const totalEmployees = stores.reduce((total, store) => total + store.totalEmployees, 0)

  // Sample sales data
  const totalSales = 25000000

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
      name: 'Total Penjualan',
      value: `Rp ${totalSales.toLocaleString('id-ID')}`,
      icon: <HiCurrencyDollar size={24} className="text-yellow-600" />,
      linkTo: '/dashboard/laporan'
    },
    {
      name: 'Total Saldo',
      value: `Rp ${totalBalance.toLocaleString('id-ID')}`,
      icon: <HiWallet size={24} className="text-purple-600" />,
      linkTo: '/dashboard/kelola-data/ambil-saldo'
    }
  ]

  // Tambahkan ini di atas useEffect:
  const [users, setUsers] = useState([])

  useEffect(() => {
    if (window.api && typeof window.api.getUsers === 'function') {
      window.api.getUsers().then((users) => {
        console.log('Users:', users)
        setUsers(users) // kamu belum punya setUsers di state
      })
    } else {
      console.warn('window.api.getUsers is not available')
    }
  }, [])

  return (
    <div>
      <table className="table-auto border-collapse border border-gray-400">
        <thead>
          <tr>
            <th className="border border-gray-300 px-4 py-2">Name</th>
            <th className="border border-gray-300 px-4 py-2">Email</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td className="border border-gray-300 px-4 py-2">{user.name}</td>
              <td className="border border-gray-300 px-4 py-2">{user.email}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statistic.map((stat, index) => (
          <Link to={stat.linkTo} key={index} className="block hover:no-underline">
            <div className="bg-white rounded-lg shadow-md p-6 transition-transform hover:shadow-lg hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{stat.name}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-full">{stat.icon}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Daftar Toko</h2>
          <Link
            to="/dashboard/kelola-toko"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Lihat Semua
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => (
            <div key={store.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-5">
                <h3 className="font-bold text-lg mb-2">{store.name}</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p className="flex items-start">
                    <span className="font-medium mr-2">Alamat:</span>
                    <span>{store.address}</span>
                  </p>
                  <p className="flex items-center">
                    <span className="font-medium mr-2">Telepon:</span>
                    <span>{store.phone}</span>
                  </p>
                  <p className="flex items-center">
                    <span className="font-medium mr-2">Jumlah Pegawai:</span>
                    <span>{store.totalEmployees} orang</span>
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 border-t border-gray-100">
                <Link
                  to={`/dashboard/kelola-toko/${store.id}`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Lihat Detail
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Account Balances Section */}
      <div className="mt-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Saldo Rekening</h2>
          <Link
            to="/dashboard/kelola-data/ambil-saldo"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Lihat Semua
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {accountBalances.map((account, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-4">
              <h3 className="font-semibold text-gray-700">{account.platform}</h3>
              <p className="text-lg font-bold mt-2">
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0
                }).format(account.balance)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
