import { HiPencilSquare, HiPlus, HiTrash, HiXMark } from 'react-icons/hi2'
import React, { useEffect, useState } from 'react'

import ConfirmDialog from '../../../../components/ConfirmDialog'
import FormLayout from './FormLayout'
import InputField from '../../../../components/InputField'
import ModalEdit from '../../../../shared/ui/Modal'
import TableContent from '../../../../components/TableContent'
import { useParams } from 'react-router-dom'

const HalamanDetilToko = () => {
  // Sample employee data - replace with your actual data source
  const [employees, setEmployees] = useState([])
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  // State for modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editEmployeeId, setEditEmployeeId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    phone: '',
    role: ''
  })
  const { id: toko_Id } = useParams()
  const [deleteId, setDeleteId] = useState(null)
  const [filterText, setFilterText] = useState('')
  const fetchUsers = async () => {
    try {
      const result = await window.api.getKaryawan(Number(toko_Id))
      const users = Array.isArray(result) ? result : result?.data || []
      setEmployees(users)
    } catch (error) {
      console.error('❌ Gagal ambil data Users:', error)
    }
  }

  useEffect(() => {
    if (!isNaN(Number(toko_Id))) {
      fetchUsers()
    }
  }, [toko_Id])

  const handleDelete = (id) => {
    setDeleteId(id)
    setShowConfirmDialog(true)
  }

  const confirmDelete = async () => {
    try {
      await window.api.deleteKaryawan(deleteId)
      fetchUsers()
    } catch (error) {
      console.error('Gagal hapus Users:', error)
    } finally {
      setShowConfirmDialog(false)
      setDeleteId(null)
    }
  }

  const handleFormSubmit = async (formData) => {
    const parsedToko_Id = Number(toko_Id)
    if (isNaN(parsedToko_Id)) {
      console.error('❌ toko_Id tidak valid:', toko_Id)
      return
    }

    const newData = {
      nama: formData.name,
      username: formData.username,
      password: formData.password,
      no_telepon: formData.phone,
      role: formData.role,
      toko_id: parsedToko_Id
    }

    try {
      await window.api.createKaryawan(newData)
      fetchUsers()
    } catch (error) {
      console.error('❌ Gagal tambah data pegawai:', error)
    }
  }

  const handleEdit = (id) => {
    const employee = employees.find((emp) => emp.id === id)
    if (employee) {
      setFormData({
        id: employee.id,
        name: employee.nama,
        username: employee.username,
        password: employee.password, // biasanya tidak ditampilkan (opsional)
        phone: employee.no_telepon,
        role: employee.role
      })
      setIsModalOpen(true)
    }
  }

  const handleEditSubmit = async (updatedData) => {
    const updateEntry = {
      user_id: updatedData.id,
      nama: updatedData.name,
      username: updatedData.username,
      password: updatedData.password,
      no_telepon: updatedData.phone,
      role: updatedData.role
    }

    try {
      await window.api.updateKaryawan(updateEntry)
      await fetchUsers()
    } catch (error) {
      console.error('❌ Gagal update data pegawai:', error)
    }
  }

  const filteredData = employees
    .filter((emp) => emp.role !== 'admin') // sembunyikan role admin
    .filter((emp) =>
      Object.values(emp).some((value) =>
        String(value).toLowerCase().includes(filterText.toLowerCase())
      )
    )

  const employeeColumns = [
    { key: 'nama', label: 'Nama Pegawai' },
    { key: 'username', label: 'Username' },
    { key: 'password', label: 'Password' },
    { key: 'no_telepon', label: 'Nomor Telepon' },
    { key: 'role', label: 'Role' }
  ]

  const [tokoInfo, setTokoInfo] = useState(null)

  const fetchTokoInfo = async () => {
    try {
      const data = await window.api.getTokoById(Number(toko_Id))
      setTokoInfo(data)
    } catch (err) {
      console.error('❌ Gagal ambil data toko:', err)
    }
  }

  useEffect(() => {
    if (!isNaN(Number(toko_Id))) {
      fetchTokoInfo()
    }
  }, [toko_Id])

  return (
    <div className="container mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-medium text-gray-700">Informasi Toko</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Nama Toko</p>
              <p className="text-base font-medium">{tokoInfo?.nama_toko}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Alamat</p>
              <p className="text-base">{tokoInfo?.alamat}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Nomor Telepon</p>
              <p className="text-base">{tokoInfo?.no_telepon}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Pegawai</p>
              <p className="text-base">
                {employees.filter((emp) => emp.role !== 'admin').length} orang
              </p>
            </div>
          </div>
        </div>
      </div>

      <TableContent
        data={filteredData}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSearchChange={setFilterText}
        searchValue={filterText}
        btnSize={'xs'}
        title={'Daftar Pegawai'}
        columns={employeeColumns}
        onAdd={
          <FormLayout
            onSubmit={(data) => {
              handleFormSubmit(data)
              setIsModalOpen(false)
            }}
          ></FormLayout>
        }
      ></TableContent>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={confirmDelete}
      ></ConfirmDialog>

      <ModalEdit
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={() => {
          handleEditSubmit(formData)
          setIsModalOpen(false)
        }}
      >
        <InputField
          name="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        >
          Nama Pegawai
        </InputField>

        <InputField
          name="username"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        >
          Username
        </InputField>

        <InputField
          name="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        >
          Password
        </InputField>
        <InputField
          name="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        >
          Nomor Telepon
        </InputField>
        <InputField
          name="role"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
        >
          Jabatan
        </InputField>
      </ModalEdit>
    </div>
  )
}

export default HalamanDetilToko
