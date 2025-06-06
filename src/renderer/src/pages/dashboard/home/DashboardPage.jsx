import React, { useState, useEffect } from "react";
import DashboardCard from "../../../features/dashboard/ui/DashboardCard";
import { HiShoppingBag, HiUserGroup, HiCurrencyDollar } from "react-icons/hi2";
import { Link } from "react-router-dom";

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
  ]);

  // Calculate statistics
  const totalStores = stores.length;
  const totalEmployees = stores.reduce((total, store) => total + store.totalEmployees, 0);
  
  // Sample sales data
  const totalSales = 25000000;

  const statistic = [
    {
      name: "Total Toko",
      value: totalStores,
      icon: <HiShoppingBag size={24} className="text-blue-600" />,
      linkTo: "/dashboard/kelola-toko"
    },
    {
      name: "Total Pegawai",
      value: totalEmployees,
      icon: <HiUserGroup size={24} className="text-green-600" />,
      linkTo: "/dashboard/kelola-toko"
    },
    {
      name: "Total Penjualan",
      value: `Rp ${(totalSales).toLocaleString('id-ID')}`,
      icon: <HiCurrencyDollar size={24} className="text-yellow-600" />,
      linkTo: "/dashboard/laporan"
    }
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statistic.map((stat, index) => (
          <Link to={stat.linkTo} key={index} className="block hover:no-underline">
            <div className="bg-white rounded-lg shadow-md p-6 transition-transform hover:shadow-lg hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{stat.name}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className="p-3 bg-gray-100 rounded-full">
                  {stat.icon}
                </div>
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
    </div>
  );
};

export default DashboardPage;