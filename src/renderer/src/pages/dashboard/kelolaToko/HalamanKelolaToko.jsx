import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HiPencilSquare, HiPlus, HiViewfinderCircle, HiXMark } from 'react-icons/hi2'

const HalamanKelolaToko = () => {
  // Sample data - replace with your actual data source
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

  // State for modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editStoreId, setEditStoreId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: ''
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const openAddModal = () => {
    setIsEditMode(false)
    setEditStoreId(null)
    setFormData({ name: '', address: '', phone: '' })
    setIsModalOpen(true)
  }

  const openEditModal = (store) => {
    setIsEditMode(true)
    setEditStoreId(store.id)
    setFormData({
      name: store.name,
      address: store.address,
      phone: store.phone
    })
    setIsModalOpen(true)
  }

  const handleSaveStore = () => {
    if (!formData.name || !formData.address || !formData.phone) {
      // Add validation feedback if needed
      return
    }

    if (isEditMode) {
      // Update existing store
      setStores(
        stores.map((store) =>
          store.id === editStoreId
            ? {
                ...store,
                name: formData.name,
                address: formData.address,
                phone: formData.phone
              }
            : store
        )
      )
    } else {
      // Add new store
      const newId = Math.max(...stores.map((store) => store.id), 0) + 1
      setStores([
        ...stores,
        {
          id: newId,
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          totalEmployees: 0 // New store starts with 0 employees
        }
      ])
    }

    // Reset form and close modal
    setFormData({ name: '', address: '', phone: '' })
    setIsModalOpen(false)
  }

  // Import useNavigate at the top of your file
  const navigate = useNavigate()

  // Function to navigate to store management page
  const handleManageStore = (storeId) => {
    navigate(`/dashboard/kelola-toko/${storeId}`)
  }

  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Kelola Data Toko</h1>
        <button
          onClick={openAddModal}
          className="mt-3 md:mt-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
        >
          <HiPlus size={18} />
          <span>Tambah Cabang</span>
        </button>
      </div>

      {/* Modal for adding/editing store */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-50"></div>
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 z-10">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  {isEditMode ? 'Edit Cabang' : 'Tambah Cabang Baru'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <HiXMark size={24} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Toko
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nama Toko"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Alamat
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Alamat Toko"
                    required
                  ></textarea>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor Telepon
                  </label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="08xxxxxxxxxx"
                    required
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveStore}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-medium text-gray-700">Daftar Toko</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16"
                >
                  No
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Nama Toko
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Total Pegawai
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stores.map((store, index) => (
                <tr key={store.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{store.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{store.totalEmployees} orang</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleManageStore(store.id)}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                      >
                        <HiViewfinderCircle className="mr-1" size={16} />
                        Kelola
                      </button>
                      <button 
                        onClick={() => openEditModal(store)}
                        className="inline-flex items-center px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200"
                      >
                        <HiPencilSquare className="mr-1" size={16} />
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {stores.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            Belum ada data toko. Silakan tambahkan cabang baru.
          </div>
        )}
      </div>
    </div>
  )
}

export default HalamanKelolaToko