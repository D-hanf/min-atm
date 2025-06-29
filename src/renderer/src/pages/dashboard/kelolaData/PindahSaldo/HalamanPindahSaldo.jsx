import React, { useEffect, useState } from 'react'

import AlertDialog from '../../../../components/AlertDialog'
import ButtonInput from '../../../../components/ButtonInput'
import ConfirmDialog from '../../../../components/ConfirmDialog'
import Dropdown from '../../../../components/Dropdown'
import FormLayout from './FormLayout'
import InputField from '../../../../components/InputField'
import ModalEdit from '../../../../shared/ui/Modal'
import SearchField from '../../../../components/SearchField'
import SelectItems from '../../../../components/SelectItems'
import TableContent from '../../../../components/TableContent'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import { useTheme } from '../../../../context/ThemeContext'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)
const HalamanPindahSaldo = () => {
  const [stores, setStores] = useState([])
  const { isDark } = useTheme()
  const [selectedStore, setSelectedStore] = useState(null)
  const [transfers, setTransfers] = useState([])
  const [saldoData, setSaldoData] = useState([])
  const [users, setUsers] = useState([])
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const getTodayWIB = () => {
    return dayjs().tz('Asia/Jakarta').format('YYYY-MM-DD')
  }
  const [formData, setFormData] = useState({
    user: '',
    platformSource: '',
    platformDestination: '',
    senderBalance: '',
    receiverBalance: '',
    amount: '',
    operational: '',
    description: ''
  })
  const [filterText, setFilterText] = useState('')
  const [platformSourceOptions, setPlatformSourceOptions] = useState('')
  const [platformDestinationOptions, setPlatformDestinationOptions] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [confirmMessage, setConfirmMessage] = useState('')
  const [userRole, setUserRole] = useState(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'))
    // always lowercase
    return (storedUser?.role || 'kasir').toLowerCase()
  })
  // Add new states for logged in user and alert dialog
  const [loggedInUser, setLoggedInUser] = useState(null)
  const [showAlertDialog, setShowAlertDialog] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  // Add state for selected saldo objects
  const [selectedSourceSaldo, setSelectedSourceSaldo] = useState(null)
  const [selectedDestSaldo, setSelectedDestSaldo] = useState(null)

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Get user data from localStorage
        const userString = localStorage.getItem('user')
        if (userString) {
          const userObj = JSON.parse(userString)
          setLoggedInUser(userObj)
          // always lowercase
          setUserRole((userObj.role || 'kasir').toLowerCase())
        }

        // Fetch stores data
        const storesData = await window.api.getTokoWithEmployeeCount()
        setStores(storesData || [])

        // Fetch saldo data
        const saldoResult = await window.api.getSaldoAwal()
        setSaldoData(saldoResult || [])

        // Fetch users data
        const usersData = await window.api.getUsers()
        setUsers(usersData || [])

        // Fetch transfer data
        const transfersData = await window.api.getPindahSaldo()

        // Transform the data for display
        const transformedTransfers = await Promise.all(
          (transfersData || []).map(async (transfer) => {
            // Get source and destination saldo names
            const sourceSaldo = saldoResult.find((s) => s.id === transfer.sumber_dana_id)
            const destSaldo = saldoResult.find((s) => s.id === transfer.tujuan_dana_id)

            // Get user info
            const user = usersData.find((u) => u.id === transfer.user_pemindah_id)

            return {
              id: transfer.id,
              user: user?.nama || 'Unknown',
              userId: transfer.user_pemindah_id,
              platformSource: transfer.platform ? transfer.platform.split('>')[0]?.trim() : '',
              platformDestination: transfer.platform ? transfer.platform.split('>')[1]?.trim() : '',
              senderBalance: sourceSaldo?.nama_sumber_dana || 'Unknown',
              senderBalanceId: transfer.sumber_dana_id,
              receiverBalance: destSaldo?.nama_sumber_dana || 'Unknown',
              receiverBalanceId: transfer.tujuan_dana_id,
              amount: transfer.nominal,
              operational: transfer.biaya_admin || 0,
              description: transfer.keterangan || '',
              date: transfer.tanggal
            }
          })
        )

        setTransfers(transformedTransfers)
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Updated columns definition to match our database structure
  const columns = [
    { key: 'date', label: 'Tanggal' },
    { key: 'user', label: 'User Pemindah' },
    { key: 'platformSource', label: 'Platform Sumber' },
    { key: 'platformDestination', label: 'Platform Penerima' },
    { key: 'senderBalance', label: 'Saldo Pengirim' },
    { key: 'receiverBalance', label: 'Saldo Penerima' },
    { key: 'formattedAmount', label: 'Nominal' },
    { key: 'formattedOperational', label: 'Operasional' },
    { key: 'description', label: 'Keterangan' }
  ]

  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value)
  }

  // New function for displaying account balances
  const formatBalanceDisplay = (value) => {
    if (value === null || value === undefined) return 'Tidak ada Saldo'
    const numericValue = Number(value)
    if (numericValue === 0) return 'Tidak ada Saldo'
    return formatRupiah(numericValue)
  }

  const formatInputRupiah = (value) => {
    const cleaned = value.replace(/[^0-9]/g, '')
    const number = parseInt(cleaned, 10)
    if (isNaN(number)) return 'Rp 0'
    return 'Rp' + number.toLocaleString('id-ID')
  }

  const handleAddTransfer = async (formData) => {
    try {
      const cleanedAmount = parseInt(String(formData.amount).replace(/[^0-9]/g, ''), 10)
      const cleanedOperational = parseInt(String(formData.operational).replace(/[^0-9]/g, ''), 10)
      const platformString = `${formData.platformSource} > ${formData.platformDestination}`
      const currentUserId = formData.user_id || (loggedInUser ? loggedInUser.id : 1)
      const sourceSaldo = saldoData.find((s) => s.nama_sumber_dana === formData.senderBalance)
      const destSaldo = saldoData.find((s) => s.nama_sumber_dana === formData.receiverBalance)

      if (!sourceSaldo || !destSaldo) {
        console.error('Saldo source or destination not found')
        return
      }

      const totalNeeded = cleanedAmount + cleanedOperational
      if (sourceSaldo.saldo < totalNeeded) {
        setAlertMessage(
          `Saldo ${sourceSaldo.nama_sumber_dana} tidak mencukupi untuk transfer sebesar ${formatRupiah(cleanedAmount)} + biaya admin ${formatRupiah(cleanedOperational)}.`
        )
        setShowAlertDialog(true)
        return
      }

      const transferData = {
        sumber_dana_id: sourceSaldo.id,
        tujuan_dana_id: destSaldo.id,
        user_pemindah_id: currentUserId,
        nominal: cleanedAmount,
        platform: platformString,
        biaya_admin: cleanedOperational || 0,
        saldo_sumber: sourceSaldo.saldo,
        saldo_tujuan: destSaldo.saldo,
        keterangan: formData.description,
        tanggal: formData.tanggal || getTodayWIB()
      }

      const result = await window.api.createPindahSaldo(transferData)

      if (result) {
        const updatedTransfers = await window.api.getPindahSaldo()
        const updatedSaldo = await window.api.getSaldoAwal()
        setSaldoData(updatedSaldo)

        const transformedTransfers = await Promise.all(
          (updatedTransfers || []).map(async (transfer) => {
            const sourceSaldo = updatedSaldo.find((s) => s.id === transfer.sumber_dana_id)
            const destSaldo = updatedSaldo.find((s) => s.id === transfer.tujuan_dana_id)
            const user = users.find((u) => u.id === transfer.user_pemindah_id)

            return {
              id: transfer.id,
              user: user?.nama || 'Unknown',
              userId: transfer.user_pemindah_id,
              platformSource: transfer.platform ? transfer.platform.split('>')[0]?.trim() : '',
              platformDestination: transfer.platform ? transfer.platform.split('>')[1]?.trim() : '',
              senderBalance: sourceSaldo?.nama_sumber_dana || 'Unknown',
              senderBalanceId: transfer.sumber_dana_id,
              receiverBalance: destSaldo?.nama_sumber_dana || 'Unknown',
              receiverBalanceId: transfer.tujuan_dana_id,
              amount: transfer.nominal,
              operational: transfer.biaya_admin || 0,
              description: transfer.keterangan || '',
              date: transfer.tanggal
            }
          })
        )

        setTransfers(transformedTransfers)
      }
    } catch (error) {
      console.error('Error creating transfer:', error)
      setAlertMessage(`Gagal melakukan pemindahan saldo: ${error.message || 'Unknown error'}`)
      setShowAlertDialog(true)
    }
  }

  const handleDelete = (id) => {
    // Check if user is admin first
    if (!loggedInUser || (loggedInUser.role || '').toLowerCase() !== 'admin') {
      setAlertMessage('Maaf, hanya admin yang dapat menghapus data pemindahan saldo.')
      setShowAlertDialog(true)
      return
    }

    const transferToDelete = transfers.find((item) => item.id === id)
    setDeleteId(id)
    const confirmMessage = 'Apakah Anda yakin ingin menghapus data pemindahan saldo ini?'
    setConfirmMessage(confirmMessage)
    setShowConfirmDialog(true)
  }

  const confirmDelete = async () => {
    try {
      await window.api.deletePindahSaldo(deleteId)
      const updatedTransfers = await window.api.getPindahSaldo()
      const updatedSaldo = await window.api.getSaldoAwal()
      setSaldoData(updatedSaldo)

      const transformedTransfers = await Promise.all(
        (updatedTransfers || []).map(async (transfer) => {
          const sourceSaldo = updatedSaldo.find((s) => s.id === transfer.sumber_dana_id)
          const destSaldo = updatedSaldo.find((s) => s.id === transfer.tujuan_dana_id)
          const user = users.find((u) => u.id === transfer.user_pemindah_id)

          return {
            id: transfer.id,
            user: user?.nama || 'Unknown',
            userId: transfer.user_pemindah_id,
            platformSource: transfer.platform ? transfer.platform.split('>')[0]?.trim() : '',
            platformDestination: transfer.platform ? transfer.platform.split('>')[1]?.trim() : '',
            senderBalance: sourceSaldo?.nama_sumber_dana || 'Unknown',
            senderBalanceId: transfer.sumber_dana_id,
            receiverBalance: destSaldo?.nama_sumber_dana || 'Unknown',
            receiverBalanceId: transfer.tujuan_dana_id,
            amount: transfer.nominal,
            operational: transfer.biaya_admin || 0,
            description: transfer.keterangan || '',
            date: transfer.tanggal
          }
        })
      )

      setTransfers(transformedTransfers)
    } catch (error) {
      console.error('Error deleting transfer:', error)
    } finally {
      setShowConfirmDialog(false)
      setDeleteId(null)
    }
  }

  const handleEdit = (id) => {
    const itemToEdit = transfers.find((item) => item.id === id)
    if (!itemToEdit) return

    const today = getTodayWIB()

    // Validasi: kasir hanya boleh edit transaksi hari ini
    if (userRole.toLowerCase() === 'kasir' && itemToEdit.date !== today) {
      setAlertMessage(
        'Kasir hanya bisa mengedit pemindahan saldo hari ini. Hubungi admin untuk mengubah data lama.'
      )
      setShowAlertDialog(true)
      return
    }

    const sourceSaldo = saldoData.find((s) => s.id === itemToEdit.senderBalanceId)
    const destSaldo = saldoData.find((s) => s.id === itemToEdit.receiverBalanceId)

    const cleanedData = {
      id: itemToEdit.id,
      user: itemToEdit.user,
      tanggal: itemToEdit.date,
      userId: itemToEdit.userId,
      platformSource: itemToEdit.platformSource,
      platformDestination: itemToEdit.platformDestination,
      senderBalance: itemToEdit.senderBalance,
      senderBalanceId: itemToEdit.senderBalanceId,
      receiverBalance: itemToEdit.receiverBalance,
      receiverBalanceId: itemToEdit.receiverBalanceId,
      amount: formatInputRupiah(itemToEdit.amount.toString()),
      operational: formatInputRupiah(itemToEdit.operational.toString()),
      description: itemToEdit.description
    }

    setFormData(cleanedData)
    setPlatformSourceOptions(itemToEdit.platformSource)
    setPlatformDestinationOptions(itemToEdit.platformDestination)
    setSelectedSourceSaldo(sourceSaldo)
    setSelectedDestSaldo(destSaldo)
    setModalOpen(true)
  }

  // Extract unique platforms from saldo data for select options
  const getPlatformOptions = () => {
    const platformGroups = {}
    saldoData.forEach((item) => {
      if (item.nama_sumber_dana) {
        const platformMatch = item.nama_sumber_dana.match(/^(\w+)/)
        if (platformMatch) {
          const platform = platformMatch[1]
          platformGroups[platform] = true
        }
      }
    })
    return [
      ...Object.keys(platformGroups).map((platform) => ({
        label: platform,
        value: platform
      }))
    ]
  }

  // FILTER DATA: kasir hanya lihat data hari ini
  const filteredData = transfers
    .filter((item) => {
      // role kasir hanya tampilkan data hari ini
      if (userRole.toLowerCase() === 'kasir') {
        return item.date === getTodayWIB()
      }
      return true
    })
    .filter((item) =>
      Object.values(item).some((val) =>
        String(val).toLowerCase().includes(filterText.toLowerCase())
      )
    )
    .map((item, index) => ({
      ...item,
      no: index + 1,
      formattedAmount: formatRupiah(item.amount),
      formattedOperational: formatRupiah(item.operational)
    }))

  const handleSubmitEdit = async (updatedData) => {
    try {
      const cleanedAmount = parseInt(String(updatedData.amount).replace(/[^0-9]/g, ''), 10)
      const cleanedOperational = parseInt(
        String(updatedData.operational).replace(/[^0-9]/g, ''),
        10
      )

      const id = formData.id

      if (!id) {
        console.error('Error: Missing ID for update operation')
        setAlertMessage('Error: Tidak dapat mengupdate data - ID tidak ditemukan')
        setShowAlertDialog(true)
        return
      }

      const userId = formData.userId || (loggedInUser ? loggedInUser.id : 1)
      const platformString = `${platformSourceOptions} > ${platformDestinationOptions}`

      if (!selectedSourceSaldo || !selectedDestSaldo) {
        console.error('Source or destination saldo not selected')
        setAlertMessage('Sumber dana atau tujuan dana tidak dipilih')
        setShowAlertDialog(true)
        return
      }

      const latestSaldoData = await window.api.getSaldoAwal()
      const latestSourceSaldo = latestSaldoData.find((s) => s.id === selectedSourceSaldo.id)
      const latestDestSaldo = latestSaldoData.find((s) => s.id === selectedDestSaldo.id)

      if (!latestSourceSaldo || !latestDestSaldo) {
        console.error('Failed to get latest saldo data')
        setAlertMessage('Gagal mendapatkan data saldo terbaru')
        setShowAlertDialog(true)
        return
      }

      const originalTransfer = transfers.find((t) => t.id === id)
      if (originalTransfer) {
        const originalTotal = originalTransfer.amount + originalTransfer.operational
        const newTotal = cleanedAmount + cleanedOperational

        if (newTotal > originalTotal && latestSourceSaldo.saldo + originalTotal < newTotal) {
          setAlertMessage(
            `Saldo ${latestSourceSaldo.nama_sumber_dana} tidak mencukupi untuk menambah nominal transfer.`
          )
          setShowAlertDialog(true)
          return
        }
      } else if (latestSourceSaldo.saldo < cleanedAmount + cleanedOperational) {
        setAlertMessage(
          `Saldo ${latestSourceSaldo.nama_sumber_dana} tidak mencukupi untuk transfer.`
        )
        setShowAlertDialog(true)
        return
      }

      const transferData = {
        id: id,
        sumber_dana_id: selectedSourceSaldo.id,
        tujuan_dana_id: selectedDestSaldo.id,
        user_pemindah_id: userId,
        nominal: cleanedAmount,
        platform: platformString,
        biaya_admin: cleanedOperational || 0,
        saldo_sumber: latestSourceSaldo.saldo,
        saldo_tujuan: latestDestSaldo.saldo,
        keterangan: updatedData.description,
        tanggal: formData.tanggal || getTodayWIB()

      }

      const result = await window.api.updatePindahSaldo(transferData)

      if (result) {
        const updatedTransfers = await window.api.getPindahSaldo()
        const updatedSaldo = await window.api.getSaldoAwal()
        setSaldoData(updatedSaldo)

        const transformedTransfers = await Promise.all(
          (updatedTransfers || []).map(async (transfer) => {
            const sourceSaldo = updatedSaldo.find((s) => s.id === transfer.sumber_dana_id)
            const destSaldo = updatedSaldo.find((s) => s.id === transfer.tujuan_dana_id)
            const user = users.find((u) => u.id === transfer.user_pemindah_id)

            return {
              id: transfer.id,
              user: user?.nama || 'Unknown',
              userId: transfer.user_pemindah_id,
              platformSource: transfer.platform ? transfer.platform.split('>')[0]?.trim() : '',
              platformDestination: transfer.platform ? transfer.platform.split('>')[1]?.trim() : '',
              senderBalance: sourceSaldo?.nama_sumber_dana || 'Unknown',
              senderBalanceId: transfer.sumber_dana_id,
              receiverBalance: destSaldo?.nama_sumber_dana || 'Unknown',
              receiverBalanceId: transfer.tujuan_dana_id,
              amount: transfer.nominal,
              operational: transfer.biaya_admin || 0,
              description: transfer.keterangan || '',
              date: transfer.tanggal
            }
          })
        )

        setTransfers(transformedTransfers)
      }
    } catch (error) {
      console.error('Error updating transfer:', error)
      setAlertMessage(`Error updating transfer: ${error.message || 'Unknown error'}`)
      setShowAlertDialog(true)
    } finally {
      setSelectedSourceSaldo(null)
      setSelectedDestSaldo(null)
      setModalOpen(false)
    }
  }

  return (
    <>
      <div className="flex w-full gap-4 items-center mb-6">
        <div className="flex w-full gap-4 items-center p-4">
          <div className="flex items-center">
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Pindah Saldo
            </h1>
          </div>
        </div>
      </div>
      <div>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <p>Loading...</p>
          </div>
        ) : (
          <TableContent
            searchValue={filterText}
            onSearchChange={setFilterText}
            btnSize={'xs'}
            data={filteredData}
            showDateFilter={true}
            userRole={userRole}
            title={'Pindah Saldo'}
            columns={columns}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onAdd={
              <FormLayout
                onSubmit={handleAddTransfer}
                buttonText="Tambah Pemindahan Saldo"
                saldoOptions={saldoData}
              ></FormLayout>
            }
          />
        )}
      </div>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={confirmDelete}
        title="Konfirmasi Hapus"
        message={confirmMessage}
      />

      <ModalEdit
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmitEdit}
        title="Edit Data Pemindahan Saldo"
      >
        {/* Replace input field with display of user name */}
        <div className="col-span-2 mb-4">
          <label
            className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
          >
            User Pemindah
          </label>
          <div
            className={`p-2 border rounded-md ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-gray-200'
                : 'bg-gray-100 border-gray-300 text-gray-700'
            }`}
          >
            {formData.user ||
              (loggedInUser
                ? loggedInUser.username || loggedInUser.nama || 'User ID: ' + loggedInUser.id
                : 'Loading...')}
          </div>
          <input
            type="hidden"
            name="userId"
            value={formData.userId || (loggedInUser ? loggedInUser.id : 1)}
          />
        </div>
        <InputField
          name="tanggal"
          type="date"
          value={formData.tanggal || getTodayWIB}
          onChange={(e) => setFormData({ ...formData, tanggal: e.target.value })}
        >
          Tanggal
        </InputField>

        {/* Platform section with flex layout */}
        <div className="col-span-2 flex gap-4 mb-4">
          <div className="flex-1">
            <SelectItems
              onChange={(e) => {
                setPlatformSourceOptions(e.target.value)
                if (e.target.value) {
                  const matchingSaldo = saldoData.find(
                    (s) =>
                      s.nama_sumber_dana &&
                      s.nama_sumber_dana.toLowerCase().includes(e.target.value.toLowerCase())
                  )
                  if (matchingSaldo) {
                    setSelectedSourceSaldo(matchingSaldo)
                    setFormData((prev) => ({
                      ...prev,
                      senderBalance: matchingSaldo.nama_sumber_dana,
                      senderBalanceId: matchingSaldo.id
                    }))
                  }
                } else {
                  setSelectedSourceSaldo(null)
                  setFormData((prev) => ({
                    ...prev,
                    senderBalance: '',
                    senderBalanceId: null
                  }))
                }
              }}
              name="platformSource"
              label="Platform Sumber"
              value={platformSourceOptions}
              options={getPlatformOptions()}
            ></SelectItems>
          </div>

          <div className="flex-1">
            <SelectItems
              onChange={(e) => {
                setPlatformDestinationOptions(e.target.value)
                if (e.target.value) {
                  const matchingSaldo = saldoData.find(
                    (s) =>
                      s.nama_sumber_dana &&
                      s.nama_sumber_dana.toLowerCase().includes(e.target.value.toLowerCase())
                  )
                  if (matchingSaldo) {
                    setSelectedDestSaldo(matchingSaldo)
                    setFormData((prev) => ({
                      ...prev,
                      receiverBalance: matchingSaldo.nama_sumber_dana,
                      receiverBalanceId: matchingSaldo.id
                    }))
                  }
                } else {
                  setSelectedDestSaldo(null)
                  setFormData((prev) => ({
                    ...prev,
                    receiverBalance: '',
                    receiverBalanceId: null
                  }))
                }
              }}
              name="platformDestination"
              label="Platform Penerima"
              value={platformDestinationOptions}
              options={getPlatformOptions()}
            ></SelectItems>
          </div>
        </div>

        {/* Balance section with flex layout */}
        <div className="col-span-2 flex gap-4 mb-4">
          <div className="flex-1">
            <InputField
              name="senderBalance"
              type="text"
              value={selectedSourceSaldo ? formatBalanceDisplay(selectedSourceSaldo.saldo) : '-'}
              onChange={() => {}}
              disabled={true}
              className={
                selectedSourceSaldo && selectedSourceSaldo.saldo === 0 ? 'text-red-500' : ''
              }
            >
              Saldo Pengirim
            </InputField>
          </div>

          <div className="flex-1">
            <InputField
              name="receiverBalance"
              type="text"
              value={selectedDestSaldo ? formatBalanceDisplay(selectedDestSaldo.saldo) : '-'}
              onChange={() => {}}
              disabled={true}
              className={selectedDestSaldo && selectedDestSaldo.saldo === 0 ? 'text-red-500' : ''}
            >
              Saldo Penerima
            </InputField>
          </div>
        </div>

        <InputField
          name="amount"
          value={formData.amount || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              amount: formatInputRupiah(e.target.value)
            })
          }
        >
          Nominal
        </InputField>

        <InputField
          name="operational"
          value={formData.operational || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              operational: formatInputRupiah(e.target.value)
            })
          }
        >
          Operasional
        </InputField>

        <InputField
          name="description"
          value={formData.description || ''}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required={false}
          className="col-span-2"
        >
          Keterangan
        </InputField>
      </ModalEdit>

      <AlertDialog
        isOpen={showAlertDialog}
        onClose={() => setShowAlertDialog(false)}
        title="Akses Terbatas"
        message={alertMessage}
      />
    </>
  )
}

export default HalamanPindahSaldo
