import React, { useEffect } from 'react'

import ButtonInput from '../../../../components/ButtonInput'
import Dropdown from '../../../../components/Dropdown'
import { HiPlus } from 'react-icons/hi'
import InputField from '../../../../components/InputField'
import Modal from '../../../../shared/ui/Modal'
import { useState } from 'react'
import { useTheme } from '../../../../context/ThemeContext'

const FormLayout = ({ onSubmit, buttonText = 'Transaksi Hutang', initialData = {} }) => {
  const { isDark } = useTheme()
  const [modalOpen, setModalOpen] = useState(false)
  const [loggedInUser, setLoggedInUser] = useState(null)
  // Add state to persist the previously selected platform
  const [lastSelectedPlatform, setLastSelectedPlatform] = useState('')
  const [formData, setFormData] = useState({
    user_id: 1, // Will be replaced with current user ID
    platform: '',
    platformId: null, // Store the platform ID for the database
    currentBalance: '',
    amount: '',
    transactionType: 'Ambil Hutang', // Default to "Ambil Hutang"
    tanggal: new Date().toISOString().split('T')[0],
    description: ''
  })
  const [saldoAwalOptions, setSaldoAwalOptions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlatform, setSelectedPlatform] = useState(null)

  // Add error state to track validation errors
  const [errors, setErrors] = useState({
    platform: '',
    amount: '',
    balance: ''
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
        // Use the last selected platform if available
        platform: lastSelectedPlatform || '',
        platformId: null,
        currentBalance: '',
        amount: '',
        transactionType: 'Ambil Hutang', // Default to "Ambil Hutang"
        tanggal: new Date().toISOString().split('T')[0],
        description: ''
      })

      // If we have a last selected platform, reselect it when the options are loaded
      if (lastSelectedPlatform) {
        // We need to wait for saldoAwalOptions to be populated
        setTimeout(() => {
          const platform = saldoAwalOptions.find((p) => p.nama_sumber_dana === lastSelectedPlatform)
          if (platform) {
            handlePlatformChange(lastSelectedPlatform)
          }
        }, 300) // Small delay to ensure saldoAwalOptions is populated
      } else {
        setSelectedPlatform(null)
      }
    }
  }, [modalOpen, loggedInUser, lastSelectedPlatform, saldoAwalOptions.length])

  const handleInputChange = (e) => {
    const { name, value } = e.target

    // Special handling for currency fields
    if (name === 'amount') {
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
      // Save the selected platform name for future use
      setLastSelectedPlatform(selectedItem.nama_sumber_dana)

      // Update form data with selected platform, its current saldo, and biaya_admin
      setFormData({
        ...formData,
        platform: selectedItem.nama_sumber_dana,
        platformId: selectedItem.id, // Store the actual platform ID
        currentBalance: formatRupiah(selectedItem.saldo),
        currentBalanceRaw: selectedItem.saldo.toString()
      })
    } else {
      setSelectedPlatform(null)
      // Don't reset lastSelectedPlatform here to maintain persistence
      setFormData({
        ...formData,
        platform: '',
        platformId: null,
        currentBalance: '',
        currentBalanceRaw: ''
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

  const handleSubmit = () => {
    // Reset all errors
    const newErrors = {
      platform: '',
      amount: '',
      balance: ''
    }

    let isValid = true

    // Validate platform selection
    if (!selectedPlatform || !formData.platform || !formData.platformId) {
      newErrors.platform = 'Pilih platform/sumber dana terlebih dahulu'
      isValid = false
    }

    // Validate transaction amount
    if (!formData.amount || formData.amountRaw === '0') {
      newErrors.amount = 'Masukkan nominal transaksi yang valid'
      isValid = false
    }

    // Validate withdrawal amount doesn't exceed current balance for Bayar Hutang type
    if (selectedPlatform && formData.amount && formData.transactionType === 'Bayar Hutang') {
      const currentBalance = parseFloat(formData.currentBalanceRaw || 0)
      const transactionAmount = parseFloat(
        formData.amountRaw || extractNumeric(formData.amount) || 0
      )

      if (transactionAmount > currentBalance) {
        newErrors.balance = `Saldo ${selectedPlatform.nama_sumber_dana} tidak mencukupi untuk pembayaran hutang sebesar ${formatRupiah(transactionAmount)}.`
        isValid = false
      }
    }

    // Update error states
    setErrors(newErrors)

    // If form is not valid, stop here without closing modal
    if (!isValid) {
      return false
    }

    // Prepare data for submission
    const submissionData = {
      // Map form fields to database fields
      petugas_id: parseInt(formData.user_id, 10) || 1,
      platform_id: parseInt(formData.platformId, 10),
      saldo_platform: parseFloat(formData.currentBalanceRaw || 0),
      nominal_transaksi: parseFloat(formData.amountRaw || extractNumeric(formData.amount) || 0),
      biaya_admin: 0, // Default to 0 since fee was removed
      tanggal_transaksi: formData.tanggal,
      keterangan: formData.description,
      // Add the transaction type
      jenis_transaksi: formData.transactionType
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
          <label
            className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Petugas
          </label>
          <div
            className={`p-2 ${
              isDark
                ? 'bg-gray-700 border-gray-600 text-gray-300'
                : 'bg-gray-100 border-gray-300 text-gray-700'
            } border rounded-md`}
          >
            {loggedInUser ? loggedInUser.nama || 'User ID: ' + loggedInUser.id : 'Loading...'}
          </div>
          {/* Hidden input to store the actual user ID */}
          <input type="hidden" name="user_id" value={formData.user_id} />
        </div>

        {/* Platform dropdown */}
        <div className="col-span-2 mb-4">
          <label
            className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Platform/Sumber Dana
          </label>
          <select
            className={`w-full p-2 border rounded-md ${
              isDark
                ? 'border-gray-600 bg-gray-700 text-white'
                : 'border-gray-300 bg-white text-gray-800'
            } focus:ring-blue-500 focus:border-blue-500`}
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
            <label
              className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Saldo Platform Saat Ini
            </label>
            <div
              className={`p-2 ${
                isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'
              } border rounded-md ${
                selectedPlatform.saldo === 0
                  ? 'text-red-500'
                  : isDark
                    ? 'text-gray-300'
                    : 'text-gray-700'
              }`}
            >
              {selectedPlatform.saldo === 0
                ? 'Tidak ada Saldo'
                : formatRupiah(selectedPlatform.saldo)}
            </div>
            {errors.balance && <p className="text-red-500 text-xs mt-1">{errors.balance}</p>}
          </div>
        )}

        {/* Transaction Type Radio Buttons */}
        <div className="col-span-2 mb-4">
          <label
            className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Jenis Transaksi
          </label>
          <div className="flex gap-4">
            <label
              className={`inline-flex items-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
            >
              <input
                type="radio"
                name="transactionType"
                value="Ambil Hutang"
                checked={formData.transactionType === 'Ambil Hutang'}
                onChange={handleInputChange}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2">Ambil Hutang</span>
            </label>
            <label
              className={`inline-flex items-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
            >
              <input
                type="radio"
                name="transactionType"
                value="Bayar Hutang"
                checked={formData.transactionType === 'Bayar Hutang'}
                onChange={handleInputChange}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2">Bayar Hutang</span>
            </label>
          </div>
        </div>

        <InputField
          name="amount"
          type="text"
          value={formData.amount || ''}
          onChange={handleInputChange}
          placeholder="Rp 0"
        >
          Nominal Transaksi
        </InputField>
        {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}

        <InputField
          name="tanggal"
          type="date"
          value={formData.tanggal || new Date().toISOString().split('T')[0]}
          onChange={handleInputChange}
        >
          Tanggal Transaksi
        </InputField>

        <InputField
          name="description"
          className="col-span-2"
          value={formData.description || ''}
          onChange={handleInputChange}
          placeholder="Tambahan informasi transaksi hutang"
          required={false}
        >
          Keterangan
        </InputField>
      </Modal>
    </>
  )
}

export default FormLayout
