import ConfirmDialog from '../../../components/ConfirmDialog'
import FormLayout from '../../../features/dashboard/ui/kelola-toko/FormLayout'
import InputField from '../../../components/InputField'
import ModalEdit from '../../../shared/ui/Modal'
import React from 'react'
import SearchField from '../../../components/SearchField'
import TableContent from '../../../components/TableContent'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

const dataToko = [
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
]

const KelolaToko = () => {
  // state to manage data toko
  const [data, setData] = useState(dataToko)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    namaToko: '',
    noTlp: '',
    alamat: '',
    jumlahKaryawan: 0
  })
  const [filterText, setFilterText] = useState('')

  // function to handle delete action
  const handleDelete = (id) => {
    setDeleteId(id)
    setShowConfirmDialog(true)
  }

  const confirmDelete = () => {
    setData((prev) => prev.filter((item) => item.id !== deleteId))
    setShowConfirmDialog(false)
    setDeleteId(null)
  }

  // function to handle form submit
  const handleFormSubmit = (formData) => {
    const newData = {
      id: Date.now(), // unique id based on timestamp
      name: formData.name,
      phone: formData.phone,
      address: formData.address,
      totalEmployees: Number(formData.totalEmployees || 0)
    }
    setData((data) => [...data, newData])
  }

  const handleEdit = (id) => {
    const itemToEdit = data.find((item) => item.id === id)
    if (itemToEdit) {
      setFormData(itemToEdit)
      setModalOpen(true)
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
      <div className="flex justify-end mb-4 w-full">
        {/* add new data */}
        <FormLayout onSubmit={handleFormSubmit}></FormLayout>
      </div>

      {/* show all data  */}
      <SearchField type="text" placeholder="Cari" value={filterText} onChange={(e) => setFilterText(e.target.value)}/>

      <TableContent
        data={filteredData}
        columns={[
          { key: 'name', label: 'Nama Toko' },
          { key: 'phone', label: 'No. Telp' },
          { key: 'totalEmployees', label: 'Jumlah Karyawan' },
          { key: 'address', label: 'Alamat' }
        ]}
        // onEdit={(item) => console.log('Edit', item)}
        showView={true}
        onView={handleManageStore}
        onEdit={handleEdit}
        onDelete={handleDelete}
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
        onSubmit={(updatedData) => {
          setData((prevData) =>
            prevData.map((item) => (item.id === formData.id ? { ...item, ...updatedData } : item))
          )
          setModalOpen(false)
          setFormData({ namaToko: '', noTlp: '', alamat: '', jumlahKaryawan: 0 })
        }}
      >
        <InputField
          name="namaToko"
          value={formData.namaToko}
          onChange={(e) => setFormData({ ...formData, namaToko: e.target.value })}
        >
          Nama Toko
        </InputField>
        <InputField
          name="noTlp"
          value={formData.noTlp}
          type="number"
          onChange={(e) => setFormData({ ...formData, noTlp: e.target.value })}
        >
          No. Telp
        </InputField>
        <InputField
          name="jumlahKaryawan"
          value={formData.jumlahKaryawan}
          type="number"
          onChange={(e) => setFormData({ ...formData, jumlahKaryawan: e.target.value })}
        >
          Jumlah Karyawan
        </InputField>
        <InputField
          name="alamat"
          value={formData.alamat}
          onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
        >
          Alamat
        </InputField>
      </ModalEdit>
    </>
  )
}

export default KelolaToko;
