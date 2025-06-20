import React, { useEffect } from 'react'

import ButtonInput from '../../../../components/ButtonInput'
import Dropdown from '../../../../components/Dropdown'
import { HiPlus } from 'react-icons/hi'
import InputField from '../../../../components/InputField'
import Modal from '../../../../shared/ui/Modal'
import { useState } from 'react'

const FormLayout = ({ onSubmit, buttonText = 'Ambil Saldo', initialData = {} }) => {
  const [modalOpen, setModalOpen] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState(null)
  const [formData, setFormData] = useState({
    user_id: 1, // Will be replaced with current user ID
    platform: '',
    currentBalance: '',
    amount: '',
    fee: '',
    withdrawalMethod: '',
    withdrawalAccount: '',
    withdrawalDate: new Date().toISOString().split('T')[0],
    description: ''
  })
  const [saldoAwalOptions, setSaldoAwalOptions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState(null)

  // Add error state to track validation errors
  const [errors, setErrors] = useState({
    platform: '',
    amount: '',
    balance: '',
    withdrawalMethod: '',
    withdrawalAccount: ''
  })

  // Format currency
  const formatRupiah = (value) => {
    if (!value) return ''

    // Remove all non-numeric characters
    const numeric = value.toString().replace(/[^0-9]/g, '')

    // Format as currency
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(numeric)
  }

  // Extract numeric value from formatted string
  const extractNumeric = (formattedValue) => {
    if (!formattedValue) return ''
    return formattedValue.toString().replace(/[^0-9]/g, '')
  }

  // Fetch saldo_awal data from database
  const fetchSaldoAwal = async () => {
    try {
      setIsLoading(true)
      const result = await window.api.getSaldoAwal()
      setSaldoAwalOptions(result)
      console.log('✅ Data saldo awal berhasil diambil:', result)
    } catch (error) {
      console.error('❌ Gagal ambil data saldo awal:', error)
      setSaldoAwalOptions([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Fetch saldo_awal data when component mounts
    fetchSaldoAwal()

    // Get logged in user from localStorage
    const userString = localStorage.getItem('user')
    if (userString) {
      const user = JSON.parse(userString)
      setLoggedInUser(user)
      setFormData((prev) => ({
        ...prev,
        user_id: user.id || 1 // Set user ID from logged in user
      }))
    }
  }, [])

  useEffect(() => {
    // Reset form when modal opens and fetch fresh data
    if (modalOpen) {
      fetchSaldoAwal()
      setFormData({
        user_id: loggedInUser?.id || 1, // Use logged in user ID
        platform: '',
        currentBalance: '',
        amount: '',
        fee: '',
        withdrawalMethod: '',
        withdrawalAccount: '',
        withdrawalDate: new Date().toISOString().split('T')[0],
        description: ''
      })
      setSelectedPlatform(null)
    }
  }, [modalOpen, loggedInUser])

  const handleInputChange = (e) => {
    const { name, value } = e.target

    // Special handling for currency fields
    if (name === 'amount' || name === 'fee') {
      const numericValue = extractNumeric(value)
      setFormData({
        ...formData,
        [name]: formatRupiah(numericValue),
        [`${name}Raw`]: numericValue // Store raw value for submission
      })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handlePlatformChange = (selectedPlatformName) => {
    // Find the selected saldo_awal item
    const selectedItem = saldoAwalOptions.find(
      (item) => item.nama_sumber_dana === selectedPlatformName
    )

    if (selectedItem) {
      setSelectedPlatform(selectedItem)

      // Update form data with selected platform, its current saldo, and biaya_admin
      setFormData({
        ...formData,
        platform: selectedItem.nama_sumber_dana,
        platformId: selectedItem.id,
        currentBalance: formatRupiah(selectedItem.saldo),
        currentBalanceRaw: selectedItem.saldo.toString(),
        fee: formatRupiah(selectedItem.biaya_admin), // Auto-populate fee field
        feeRaw: selectedItem.biaya_admin.toString() // Store raw value for submission
      })
    } else {
      setSelectedPlatform(null)
      setFormData({
        ...formData,
        platform: '',
        platformId: null,
        currentBalance: '',
        currentBalanceRaw: '',
        fee: '',
        feeRaw: ''
      })
    }
  }

  // Instead of having the Modal call handleSubmit directly,
  // we'll create a custom submit handler that the Modal will call
  const onModalSubmit = (e) => {
    // Only call preventDefault if e is actually an event object
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault()
    }

    // Call our validation function
    const isValid = handleSubmit()

    // Return false to prevent the Modal from closing when validation fails
    return isValid
  }

  // Our handleSubmit function with modification to ensure modal stays open
  const handleSubmit = () => {
    // Reset all errors
    const newErrors = {
      platform: '',
      amount: '',
      balance: '',
      withdrawalMethod: '',
      withdrawalAccount: ''
    }

    let isValid = true

    // Validate platform selection
    if (!selectedPlatform || !formData.platform) {
      newErrors.platform = 'Pilih platform/sumber dana terlebih dahulu'
      isValid = false
    }

    // Validate withdrawal amount
    if (!formData.amount || formData.amountRaw === '0') {
      newErrors.amount = 'Masukkan nominal pengambilan yang valid'
      isValid = false
    }

    // Validate withdrawal method
    if (!formData.withdrawalMethod) {
      newErrors.withdrawalMethod = 'Masukkan metode pengambilan'
      isValid = false
    }

    // Validate withdrawal account
    if (!formData.withdrawalAccount) {
      newErrors.withdrawalAccount = 'Masukkan tujuan pengambilan'
      isValid = false
    }

    // Validate withdrawal amount doesn't exceed current balance
    if (selectedPlatform && formData.amount) {
      const currentBalance = parseFloat(formData.currentBalanceRaw || 0)
      const withdrawalAmount = parseFloat(
        formData.amountRaw || extractNumeric(formData.amount) || 0
      )
      const adminFee = parseFloat(formData.feeRaw || extractNumeric(formData.fee) || 0)
      const totalWithdrawal = withdrawalAmount + adminFee

      if (totalWithdrawal > currentBalance) {
        newErrors.balance = `Saldo ${selectedPlatform.nama_sumber_dana} tidak mencukupi untuk pengambilan sebesar ${formatRupiah(withdrawalAmount)} + biaya admin ${formatRupiah(adminFee)}.`
        isValid = false
      }
    }

    // Update error states
    setErrors(newErrors)

    // If form is not valid, explicitly set modalOpen to true to ensure it stays open
    if (!isValid) {
      setModalOpen(true); // Force modal to stay open
      return false;
    }

    // Prepare data for submission
    const submissionData = {
      ...formData,
      // Map form fields to database fields
      petugas_pengambil_id: parseInt(formData.user_id, 10) || 1,
      platform: formData.platform,
      saldo_platform: parseFloat(formData.currentBalanceRaw || 0),
      nominal_pengambilan: parseFloat(formData.amountRaw || extractNumeric(formData.amount) || 0),
      biaya_admin: parseFloat(formData.feeRaw || extractNumeric(formData.fee) || 0),
      metode_pengambilan: formData.withdrawalMethod,
      tujuan_pengambilan: formData.withdrawalAccount,
      tanggal_pengambilan: formData.withdrawalDate,
      keterangan: formData.description
    }

    // Submit the data
    onSubmit(submissionData)

    // Only close the modal if validation passed
    setModalOpen(false)

    return true
  }

  return (
    <>
      <div className="w-full flex justify-end">
        <ButtonInput size="xs" onClick={() => setModalOpen(true)}>
          <HiPlus size={18} />
          {buttonText}
        </ButtonInput>
      </div>

      {/* Change the onSubmit to use our custom handler */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={onModalSubmit}>
        {/* Replace ID input field with read-only display of user name */}
        <div className="col-span-2 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Petugas Pengambil</label>
          <div className="p-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
            {loggedInUser ? loggedInUser.nama || 'User ID: ' + loggedInUser.id : 'Loading...'}
          </div>
          {/* Hidden input to store the actual user ID */}
          <input type="hidden" name="user_id" value={formData.user_id} />
        </div>

        {/* Platform dropdown */}
        <div className="col-span-2 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Platform/Sumber Dana
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={formData.platform}
            onChange={(e) => handlePlatformChange(e.target.value)}
            disabled={isLoading || saldoAwalOptions.length === 0}
          >
            <option value="">-- Pilih Sumber Dana --</option>
            {saldoAwalOptions.map((item) => (
              <option key={item.id} value={item.nama_sumber_dana}>
                {item.nama_sumber_dana}
              </option>
            ))}
          </select>
          {errors.platform && <p className="text-red-500 text-xs mt-1">{errors.platform}</p>}
          {saldoAwalOptions.length === 0 && !isLoading && (
            <p className="text-red-500 text-xs mt-1">
              Tidak ada sumber dana tersedia. Silakan tambahkan sumber dana terlebih dahulu.
            </p>
          )}
        </div>

        {/* Show current balance only when platform is selected */}
        {selectedPlatform && (
          <div className="col-span-2 mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Saldo Platform Saat Ini
            </label>
            <div
              className={`p-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700 ${selectedPlatform.saldo === 0 ? 'text-red-500' : ''}`}
            >
              {selectedPlatform.saldo === 0
                ? 'Tidak ada Saldo'
                : formatRupiah(selectedPlatform.saldo)}
            </div>
            {errors.balance && <p className="text-red-500 text-xs mt-1">{errors.balance}</p>}
          </div>
        )}

        <InputField
          name="amount"
          type="text"
          value={formData.amount || ''}
          onChange={handleInputChange}
          placeholder="Rp 0"
        >
          Nominal Pengambilan
        </InputField>
        {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}

        <InputField
          name="fee"
          type="text"
          value={formData.fee || ''}
          onChange={handleInputChange}
          placeholder="Rp 0"
          className={selectedPlatform ? 'border-yellow-500' : ''}
        >
          Biaya Admin{' '}
          {selectedPlatform && (
            <span className="text-xs text-yellow-600">(dari platform, dapat diedit)</span>
          )}
        </InputField>

        <InputField
          name="withdrawalMethod"
          type="text"
          value={formData.withdrawalMethod || ''}
          onChange={handleInputChange}
          placeholder="Transfer Bank/Tunai/dll"
        >
          Metode Pengambilan
        </InputField>
        {errors.withdrawalMethod && (
          <p className="text-red-500 text-xs mt-1">{errors.withdrawalMethod}</p>
        )}

        <InputField
          name="withdrawalAccount"
          type="text"
          value={formData.withdrawalAccount || ''}
          onChange={handleInputChange}
          placeholder="No. Rekening/Nama Penerima"
        >
          Tujuan Pengambilan
        </InputField>
        {errors.withdrawalAccount && (
          <p className="text-red-500 text-xs mt-1">{errors.withdrawalAccount}</p>
        )}

        <InputField
          name="withdrawalDate"
          type="date"
          value={formData.withdrawalDate || new Date().toISOString().split('T')[0]}
          onChange={handleInputChange}
        >
          Tanggal Pengambilan
        </InputField>

        <InputField
          name="description"
          className="col-span-2"
          value={formData.description || ''}
          onChange={handleInputChange}
          placeholder="Tambahan informasi pengambilan saldo"
          required={false}
        >
          Keterangan
        </InputField>
      </Modal>
    </>
  )
}

export default FormLayout
