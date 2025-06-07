import { HiPencilSquare, HiPlus, HiTrash, HiXMark } from 'react-icons/hi2'
import React, { useState } from 'react'

const HalamanDetilToko = () => {
  // Sample employee data - replace with your actual data source
  const [employees, setEmployees] = useState([
    {
      id: 1,
      name: 'John Doe',
      address: 'Jl. Kenanga No. 10, Malang',
      phone: '081234567890',
      role: 'Kasir'
    },
    {
      id: 2,
      name: 'Jane Smith',
      address: 'Jl. Mawar No. 25, Malang',
      phone: '081234567891',
      role: 'Manager'
    },
    {
      id: 3,
      name: 'Robert Johnson',
      address: 'Jl. Melati No. 15, Malang',
      phone: '081234567892',
      role: 'Admin'
    },
    {
      id: 4,
      name: 'Sarah Williams',
      address: 'Jl. Anggrek No. 7, Malang',
      phone: '081234567893',
      role: 'Kasir'
    }
  ])
  
  // State for modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editEmployeeId, setEditEmployeeId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    role: 'Kasir'
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
    setEditEmployeeId(null)
    setFormData({ name: '', address: '', phone: '', role: 'Kasir' })
    setIsModalOpen(true)
  }

  const openEditModal = (employee) => {
    setIsEditMode(true)
    setEditEmployeeId(employee.id)
    setFormData({
      name: employee.name,
      address: employee.address,
      phone: employee.phone,
      role: employee.role
    })
    setIsModalOpen(true)
  }

  const handleSaveEmployee = () => {
    if (!formData.name || !formData.address || !formData.phone || !formData.role) {
      // Add validation feedback if needed
      return
    }

    if (isEditMode) {
      // Update existing employee
      setEmployees(
        employees.map((employee) =>
          employee.id === editEmployeeId
            ? {
                ...employee,
                name: formData.name,
                address: formData.address,
                phone: formData.phone,
                role: formData.role
              }
            : employee
        )
      )
    } else {
      // Add new employee
      const newId = Math.max(...employees.map((employee) => employee.id), 0) + 1
      setEmployees([
        ...employees,
        {
          id: newId,
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          role: formData.role
        }
      ])
    }

    // Reset form and close modal
    setFormData({ name: '', address: '', phone: '', role: 'Kasir' })
    setIsModalOpen(false)
  }

  const handleDeleteEmployee = (id) => {
    setEmployees(employees.filter(employee => employee.id !== id))
  }

  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Detil Toko</h1>
        <button 
          onClick={openAddModal}
          className="mt-3 md:mt-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors"
        >
          <HiPlus size={18} />
          <span>Tambah Pegawai</span>
        </button>
      </div>

      {/* Modal for adding/editing employee */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-50"></div>
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 z-10">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-800">
                  {isEditMode ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}
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
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nama Lengkap"
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
                    placeholder="Alamat Lengkap"
                    required
                  ></textarea>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor HP
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

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="Kasir">Kasir</option>
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                  </select>
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
                  onClick={handleSaveEmployee}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-medium text-gray-700">Informasi Toko</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Nama Toko</p>
              <p className="text-base font-medium">Cabang Malang</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Alamat</p>
              <p className="text-base">Jl. Soekarno Hatta No. 45, Malang</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Nomor Telepon</p>
              <p className="text-base">081234567891</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Pegawai</p>
              <p className="text-base">{employees.length} orang</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-medium text-gray-700">Daftar Pegawai</h2>
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
                  Nama Lengkap
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Alamat
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Nomor HP
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Role
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
              {employees.map((employee, index) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{employee.address}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{employee.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        employee.role === 'Manager'
                          ? 'bg-green-100 text-green-800'
                          : employee.role === 'Admin'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {employee.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(employee)}
                        className="inline-flex items-center px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200"
                      >
                        <HiPencilSquare className="mr-1" size={16} />
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteEmployee(employee.id)}
                        className="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                      >
                        <HiTrash className="mr-1" size={16} />
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {employees.length === 0 && (
          <div className="py-8 text-center text-gray-500">
            Belum ada data pegawai. Silakan tambahkan pegawai baru.
          </div>
        )}
      </div>
    </div>
  )
}

export default HalamanDetilToko