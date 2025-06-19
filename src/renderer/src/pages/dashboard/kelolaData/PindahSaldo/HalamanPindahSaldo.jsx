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

const HalamanPindahSaldo = () => {
  const [stores, setStores] = useState([])
  const [selectedStore, setSelectedStore] = useState(null)
  const [transfers, setTransfers] = useState([])
  const [saldoData, setSaldoData] = useState([])
  const [users, setUsers] = useState([])
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
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

  // Add new states for logged in user and alert dialog
  const [loggedInUser, setLoggedInUser] = useState(null)
  const [showAlertDialog, setShowAlertDialog] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Get user data from localStorage
        const userString = localStorage.getItem('user')
        if (userString) {
          setLoggedInUser(JSON.parse(userString))
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

  const handleAddTransfer = async (formData) => {
    try {
      const cleanedAmount = parseInt(String(formData.amount).replace(/[^0-9]/g, ''), 10)
      const cleanedOperational = parseInt(String(formData.operational).replace(/[^0-9]/g, ''), 10)

      // Prepare platform string for database
      const platformString = `${formData.platformSource} > ${formData.platformDestination}`

      // Get the currently logged in user (should come from auth context)
      // For now we'll use a dummy user id
      const currentUserId = 1 // This should be dynamic in a real app

      // Get current saldo for source and destination
      const sourceSaldo = saldoData.find((s) => s.nama_sumber_dana === formData.senderBalance)
      const destSaldo = saldoData.find((s) => s.nama_sumber_dana === formData.receiverBalance)

      if (!sourceSaldo || !destSaldo) {
        console.error('Saldo source or destination not found')
        return
      }

      // Create data object for API
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
        tanggal: new Date().toISOString().split('T')[0]
      }

      // Call API to save data
      const result = await window.api.createPindahSaldo(transferData)

      if (result) {
        // Refresh data after successful creation
        const updatedTransfers = await window.api.getPindahSaldo()
        const updatedSaldo = await window.api.getSaldoAwal()
        setSaldoData(updatedSaldo)

        // Transform the new data
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
    }
  }

  const handleDelete = (id) => {
    // Check if user is admin first
    if (!loggedInUser || loggedInUser.role !== 'admin') {
      setAlertMessage('Maaf, hanya admin yang dapat menghapus data pemindahan saldo.')
      setShowAlertDialog(true)
      return
    }

    // If admin, proceed with delete confirmation
    const transferToDelete = transfers.find((item) => item.id === id)
    setDeleteId(id)

    // Set confirmation message with amount details
    const confirmMessage = transferToDelete
      ? `Apakah Anda yakin ingin menghapus data pemindahan saldo ini? 
      \nNominal ${formatRupiah(transferToDelete.amount)} dan biaya admin ${formatRupiah(
        transferToDelete.operational
      )} 
      akan dikembalikan ke saldo ${transferToDelete.senderBalance}.`
      : 'Apakah Anda yakin ingin menghapus data pemindahan saldo ini?'

    setConfirmMessage(confirmMessage)
    setShowConfirmDialog(true)
  }

  const confirmDelete = async () => {
    try {
      // Before deletion, get the current transfer details for user feedback
      const transferToDelete = transfers.find((item) => item.id === deleteId)

      // Call API to delete and revert the transfer
      await window.api.deletePindahSaldo(deleteId)

      // Show success notification/feedback
      console.log('Transfer deleted successfully')
      // You could add a toast/notification here to show success message
      // For example: "Transfer deleted and Rp X returned to [source account]"

      // Refresh data after successful deletion
      const updatedTransfers = await window.api.getPindahSaldo()
      const updatedSaldo = await window.api.getSaldoAwal()
      setSaldoData(updatedSaldo)

      // Transform the new data
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
      // You could add a toast/notification here to show error message
    } finally {
      setShowConfirmDialog(false)
      setDeleteId(null)
    }
  }

  const handleEdit = (id) => {
    // Check if user is admin first
    if (!loggedInUser || loggedInUser.role !== 'admin') {
      setAlertMessage('Maaf, hanya admin yang dapat mengedit data pemindahan saldo.')
      setShowAlertDialog(true)
      return
    }

    // If admin, proceed with edit
    const itemToEdit = transfers.find((item) => item.id === id)
    if (itemToEdit) {
      // Set form data with item values
      setFormData({
        id: itemToEdit.id,
        user: itemToEdit.user,
        platformSource: itemToEdit.platformSource,
        platformDestination: itemToEdit.platformDestination,
        senderBalance: itemToEdit.senderBalance,
        senderBalanceId: itemToEdit.senderBalanceId, // Make sure we set the IDs
        receiverBalance: itemToEdit.receiverBalance,
        receiverBalanceId: itemToEdit.receiverBalanceId, // Make sure we set the IDs
        amount: formatInputRupiah(String(itemToEdit.amount)),
        operational: formatInputRupiah(String(itemToEdit.operational)),
        description: itemToEdit.description
      })

      // Set platform options
      setPlatformSourceOptions(itemToEdit.platformSource)
      setPlatformDestinationOptions(itemToEdit.platformDestination)

      // Set selected saldo
      const sourceSaldo = saldoData.find((s) => s.id === itemToEdit.senderBalanceId)
      const destSaldo = saldoData.find((s) => s.id === itemToEdit.receiverBalanceId)
      setSelectedSourceSaldo(sourceSaldo)
      setSelectedDestSaldo(destSaldo)

      setModalOpen(true)
    }
  }

  // Add state for selected saldo objects
  const [selectedSourceSaldo, setSelectedSourceSaldo] = useState(null)
  const [selectedDestSaldo, setSelectedDestSaldo] = useState(null)

  // Extract unique platforms from saldo data for select options
  const getPlatformOptions = () => {
    // Group saldo by platform for dropdown options
    const platformGroups = {}

    saldoData.forEach((item) => {
      if (item.nama_sumber_dana) {
        // Extract platform name (e.g., "DANA Pusat" -> "DANA")
        const platformMatch = item.nama_sumber_dana.match(/^(\w+)/)
        if (platformMatch) {
          const platform = platformMatch[1]
          platformGroups[platform] = true
        }
      }
    })

    // Convert to array of options with default option first
    return [
      ...Object.keys(platformGroups).map((platform) => ({
        label: platform,
        value: platform
      }))
    ]
  }

  const filteredData = transfers
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

  const formatInputRupiah = (value) => {
    const cleaned = value.replace(/[^0-9]/g, '')
    const number = parseInt(cleaned, 10)
    if (isNaN(number)) return ''
    return 'Rp' + number.toLocaleString('id-ID')
  }

  return (
    <>
      <div className="flex w-full gap-4 items-center mb-6">
        <div className="flex w-full gap-4 items-center p-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-800 ">Pindah Saldo</h1>
          </div>
          {/* <div className="flex-1 max-w-xs">
            <Dropdown
              className="w-full"
              color={'gray'}
              label="Pilih Toko"
              items={stores.map((store) => store.nama_toko)}
              onSelect={(index) => setSelectedStore(stores[index])}
            />
          </div> */}
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
        onSubmit={async (updatedData) => {
          try {
            const cleanedAmount = parseInt(String(updatedData.amount).replace(/[^0-9]/g, ''), 10)
            const cleanedOperational = parseInt(
              String(updatedData.operational).replace(/[^0-9]/g, ''),
              10
            )

            // Ensure we have the ID from formData if not in updatedData
            const id = formData.id

            if (!id) {
              console.error('Error: Missing ID for update operation')
              alert('Error: Cannot update record - missing ID')
              return
            }

            console.log('Updating record with ID:', id)

            // Fix: Always use default userId
            const userId = 1

            // Prepare platform string for database
            const platformString = `${platformSourceOptions} > ${platformDestinationOptions}`

            // Find the source and destination saldo by IDs from selected saldo objects
            if (!selectedSourceSaldo || !selectedDestSaldo) {
              console.error('Source or destination saldo not selected')
              return
            }

            // Get the latest saldo data to ensure we're using current balances
            const latestSaldoData = await window.api.getSaldoAwal()

            // Find the latest balances for the selected source and destination
            const latestSourceSaldo = latestSaldoData.find((s) => s.id === selectedSourceSaldo.id)
            const latestDestSaldo = latestSaldoData.find((s) => s.id === selectedDestSaldo.id)

            if (!latestSourceSaldo || !latestDestSaldo) {
              console.error('Failed to get latest saldo data')
              return
            }

            // Create data object for API with latest balances
            const transferData = {
              id: id, // Use the ID from formData
              sumber_dana_id: selectedSourceSaldo.id,
              tujuan_dana_id: selectedDestSaldo.id,
              user_pemindah_id: userId,
              nominal: cleanedAmount,
              platform: platformString,
              biaya_admin: cleanedOperational || 0,
              saldo_sumber: latestSourceSaldo.saldo,
              saldo_tujuan: latestDestSaldo.saldo,
              keterangan: updatedData.description,
              tanggal: new Date().toISOString().split('T')[0]
            }

            console.log('Updating transfer with data:', transferData)

            // Call API to update data
            const result = await window.api.updatePindahSaldo(transferData)
            console.log('Update result:', result)

            if (result) {
              // Refresh data after successful update
              const updatedTransfers = await window.api.getPindahSaldo()
              const updatedSaldo = await window.api.getSaldoAwal()
              setSaldoData(updatedSaldo)

              // Transform the new data
              const transformedTransfers = await Promise.all(
                (updatedTransfers || []).map(async (transfer) => {
                  const sourceSaldo = updatedSaldo.find((s) => s.id === transfer.sumber_dana_id)
                  const destSaldo = updatedSaldo.find((s) => s.id === transfer.tujuan_dana_id)
                  const user = users.find((u) => u.id === transfer.user_pemindah_id)

                  return {
                    id: transfer.id,
                    user: user?.nama || 'Unknown',
                    userId: transfer.user_pemindah_id,
                    platformSource: transfer.platform
                      ? transfer.platform.split('>')[0]?.trim()
                      : '',
                    platformDestination: transfer.platform
                      ? transfer.platform.split('>')[1]?.trim()
                      : '',
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
            alert(`Error updating transfer: ${error.message || 'Unknown error'}`)
          } finally {
            // Reset form and selected values
            setSelectedSourceSaldo(null)
            setSelectedDestSaldo(null)
            setModalOpen(false)
          }
        }}
      >
        <InputField
          name="user"
          value={formData.user || ''}
          onChange={(e) => setFormData({ ...formData, user: e.target.value })}
          disabled={true}
        >
          User Pemindah
        </InputField>

        {/* Platform section with flex layout */}
        <div className="col-span-2 flex gap-4 mb-4">
          <div className="flex-1">
            <SelectItems
              onChange={(e) => {
                setPlatformSourceOptions(e.target.value)

                // Find matching saldo entry
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

                // Find matching saldo entry
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
              value={selectedSourceSaldo ? `${formatRupiah(selectedSourceSaldo.saldo)}` : '-'}
              onChange={() => {}} // No change handler needed as it's disabled
              disabled={true}
            >
              Saldo Pengirim
            </InputField>
          </div>

          <div className="flex-1">
            <InputField
              name="receiverBalance"
              type="text"
              value={selectedDestSaldo ? `${formatRupiah(selectedDestSaldo.saldo)}` : '-'}
              onChange={() => {}} // No change handler needed as it's disabled
              disabled={true}
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

      {/* Add AlertDialog for non-admin users */}
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
