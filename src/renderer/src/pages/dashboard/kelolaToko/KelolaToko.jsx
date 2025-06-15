import React, { useEffect } from 'react'

import ConfirmDialog from '../../../components/ConfirmDialog'
import FormLayout from '../../../features/dashboard/ui/kelola-toko/FormLayout'
import InputField from '../../../components/InputField'
import ModalEdit from '../../../shared/ui/Modal'
import TableContent from '../../../components/TableContent'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

const KelolaToko = () => {
  // state to manage data toko
  const [data, setData] = useState([])
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  })
  const [filterText, setFilterText] = useState('')

  const fetchToko = async () => {
    try {
      const result = await window.api.getTokoWithEmployeeCount()
      setData(result)
    } catch (error) {
      console.error('❌ Gagal ambil data toko:', error)
    }
  }

  useEffect(() => {
    fetchToko()
  }, [])
  // function to handle delete action
  const handleDelete = (id) => {
    setDeleteId(id)
    setShowConfirmDialog(true)
  }

  const confirmDelete = async () => {
    try {
      await window.api.deleteToko(deleteId)
      fetchToko()
    } catch (error) {
      console.error('Gagal hapus toko:', error)
    } finally {
      setShowConfirmDialog(false)
      setDeleteId(null)
    }
  }

  // function to handle form submit
  const handleFormSubmit = async (formData) => {
    const newData = {
      nama_toko: formData.name,
      no_telepon: formData.phone,
      alamat: formData.address
    }
    try {
      await window.api.createToko(newData)
      fetchToko()
      console.log('data toko =>', newData)
    } catch (error) {
      console.error('❌ Gagal tambah data toko:', error)
    }
  }

  const handleEdit = (id) => {
    const itemToEdit = data.find((item) => item.id === id)
    if (itemToEdit) {
      setFormData({
        id: itemToEdit.id,
        name: itemToEdit.nama_toko,
        phone: itemToEdit.no_telepon,
        address: itemToEdit.alamat
      })
      setModalOpen(true)
    }
  }

  const handleSubmitEdit = async (updatedData) => {
    console.log('🔧 Mengirim data update:', updatedData)
    const updateEntry = {
      id: updatedData.id,
      nama_toko: updatedData.name,
      no_telepon: updatedData.phone,
      alamat: updatedData.address
    }
    try {
      await window.api.updateToko(updateEntry)
      await fetchToko()
    } catch (error) {
      console.error('❌ Gagal update data toko:', error)
    }
  }

  const filteredData = data.filter((item) =>
    Object.values(item).some((val) => String(val).toLowerCase().includes(filterText.toLowerCase()))
  )
  // Import useNavigate at the top of your file
  const navigate = useNavigate()

  // Function to navigate to store management page
  const handleManageStore = (storeId) => {
    navigate(`/dashboard/kelola-toko/${storeId}`)
  }
  return (
    <>
      {/* show all data  */}
      <TableContent
        data={filteredData}
        columns={[
          { key: 'nama_toko', label: 'Nama Toko' },
          { key: 'no_telepon', label: 'No. Telp' },
          { key: 'totalEmployees', label: 'Jumlah Karyawan' },
          { key: 'alamat', label: 'Alamat' }
        ]}
        // onEdit={(item) => console.log('Edit', item)}
        showView={true}
        onView={handleManageStore}
        onEdit={handleEdit}
        onDelete={handleDelete}
        btnSize={'xs'}
        title={'Data Toko'}
        searchValue={filterText}
        onSearchChange={setFilterText}
        onAdd={<FormLayout onSubmit={handleFormSubmit}></FormLayout>}
      />

      {/* pop up confirm to delete */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={confirmDelete}
      />

      <ModalEdit
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={() => handleSubmitEdit(formData)}
      >
        <InputField
          name="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        >
          Nama Toko
        </InputField>
        <InputField
          name="phone"
          value={formData.phone}
          type="number"
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        >
          No. Telp
        </InputField>
        <InputField
          name="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        >
          Alamat
        </InputField>
      </ModalEdit>
    </>
  )
}

export default KelolaToko
