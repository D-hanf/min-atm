import React, { useEffect, useState } from 'react'

import ButtonInput from '../../../../components/ButtonInput'
import Dropdown from '../../../../components/Dropdown'
import { HiPlus } from 'react-icons/hi'
import InputField from '../../../../components/InputField'
import Modal from '../../../../shared/ui/Modal'
import SelectItems from '../../../../components/SelectItems'

const FormLayout = ({
  onSubmit,
  buttonText = 'Tambah Pemindahan Saldo',
  initialData = {},
  saldoOptions = []
}) => {
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState(initialData)
  const [saldoData, setSaldoData] = useState([])
  const [loggedInUser, setLoggedInUser] = useState(null)

  // Platform options
  const [platformSourceOptions, setPlatformSourceOptions] = useState('')
  const [platformDestinationOptions, setPlatformDestinationOptions] = useState('')

  // Selected saldo objects
  const [selectedSourceSaldo, setSelectedSourceSaldo] = useState(null)
  const [selectedDestSaldo, setSelectedDestSaldo] = useState(null)

  // Add error state variables
  const [errors, setErrors] = useState({
    platformSource: '',
    platformDestination: '',
    amount: '',
    balance: ''
  })

  // Fetch logged in user from localStorage
  useEffect(() => {
    const userString = localStorage.getItem('user')
    if (userString) {
      const user = JSON.parse(userString)
      setLoggedInUser(user)
    }
  }, [])

  // Format currency with special handling for zero balance - only used for displaying account balances
  const formatBalanceDisplay = (value) => {
    if (value === null || value === undefined) return 'Tidak ada Saldo'

    // Convert to number and check if it's zero
    const numericValue = Number(value)
    if (numericValue === 0) return 'Tidak ada Saldo'

    // Format as currency
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(numericValue)
  }

  // Format currency for input values - always show the amount, even if zero
  const formatRupiah = (value) => {
    if (value === null || value === undefined) return 'Rp 0'

    // Remove all non-numeric characters
    const numeric = value.toString().replace(/[^0-9]/g, '')

    // Convert to number - even if it's zero, we'll display it
    const numericValue = Number(numeric)

    // Format as currency
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(numericValue)
  }

  // Extract numeric value from formatted string
  const extractNumeric = (formattedValue) => {
    if (!formattedValue) return ''
    return formattedValue.toString().replace(/[^0-9]/g, '')
  }

  // Fetch saldo data when the component mounts or when modal opens
  useEffect(() => {
    const fetchSaldoData = async () => {
      try {
        if (saldoOptions && saldoOptions.length > 0) {
          setSaldoData(saldoOptions)
        } else {
          const result = await window.api.getSaldoAwal()
          setSaldoData(result || [])
        }
      } catch (error) {
        console.error('Error fetching saldo data:', error)
      }
    }

    if (modalOpen) {
      fetchSaldoData()

      // Auto-fill user when modal opens
      setFormData((prevData) => ({
        ...prevData,
        user: loggedInUser
          ? loggedInUser.username || loggedInUser.nama || 'User ID: ' + loggedInUser.id
          : 'Loading...',
        user_id: loggedInUser ? loggedInUser.id : 1 // Store user ID for backend
      }))
    }
  }, [modalOpen, saldoOptions, loggedInUser])

  // Set the selected saldo when platform changes
  useEffect(() => {
    if (platformSourceOptions && saldoData.length > 0) {
      // Find the first saldo entry that matches the selected platform
      const matchingSaldo = saldoData.find(
        (s) =>
          s.nama_sumber_dana &&
          s.nama_sumber_dana.toLowerCase().includes(platformSourceOptions.toLowerCase())
      )

      if (matchingSaldo) {
        setSelectedSourceSaldo(matchingSaldo)

        // Set operational value from the source platform's biaya_admin
        const biayaAdmin = matchingSaldo.biaya_admin || 0

        setFormData((prev) => ({
          ...prev,
          senderBalance: matchingSaldo.nama_sumber_dana,
          senderBalanceId: matchingSaldo.id,
          operational: formatRupiah(biayaAdmin), // Always format as Rupiah, even if zero
          operationalRaw: biayaAdmin.toString()
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
  }, [platformSourceOptions, saldoData])

  // Set the selected destination saldo when platform changes
  useEffect(() => {
    if (platformDestinationOptions && saldoData.length > 0) {
      // Find the first saldo entry that matches the selected platform
      const matchingSaldo = saldoData.find(
        (s) =>
          s.nama_sumber_dana &&
          s.nama_sumber_dana.toLowerCase().includes(platformDestinationOptions.toLowerCase())
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
  }, [platformDestinationOptions, saldoData])

  // Reset errors when platforms change
  useEffect(() => {
    setErrors({ ...errors, platformSource: '', balance: '' })
  }, [platformSourceOptions])

  useEffect(() => {
    setErrors({ ...errors, platformDestination: '' })
  }, [platformDestinationOptions])

  const handleInputChange = (e) => {
    const { name, value } = e.target

    // Special handling for amount and operational fields
    if (name === 'amount' || name === 'operational') {
      const numericValue = extractNumeric(value)
      setFormData({
        ...formData,
        [name]: formatRupiah(numericValue), // Always format as Rupiah, even if zero
        [`${name}Raw`]: numericValue // Store raw value for submission
      })

      // Clear error when user types in the field
      if (name === 'amount') {
        setErrors({ ...errors, amount: '' })
      }
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  // Handle form submission with validation
  const handleSubmit = () => {
    // Reset errors
    const newErrors = {
      platformSource: '',
      platformDestination: '',
      amount: '',
      balance: ''
    }

    let isValid = true

    // Validate source platform
    if (!selectedSourceSaldo) {
      newErrors.platformSource = 'Pilih platform sumber terlebih dahulu'
      isValid = false
    }

    // Validate destination platform
    if (!selectedDestSaldo) {
      newErrors.platformDestination = 'Pilih platform tujuan terlebih dahulu'
      isValid = false
    }

    // Validate amount
    if (!formData.amount || formData.amountRaw === '0') {
      newErrors.amount = 'Masukkan nominal transfer yang valid'
      isValid = false
    }

    // Check if source has sufficient balance
    if (selectedSourceSaldo) {
      const amountValue = parseInt(formData.amountRaw || extractNumeric(formData.amount), 10)
      const operationalValue = parseInt(
        formData.operationalRaw || extractNumeric(formData.operational),
        10
      )
      const totalNeeded = amountValue + operationalValue

      if (selectedSourceSaldo.saldo < totalNeeded) {
        newErrors.balance = `Saldo ${selectedSourceSaldo.nama_sumber_dana} tidak mencukupi untuk transfer sebesar ${formatRupiah(amountValue)} + biaya admin ${formatRupiah(operationalValue)}.`
        isValid = false
      }
    }

    // Update error states
    setErrors(newErrors)

    // If form is not valid, stop here and don't proceed with submission
    if (!isValid) {
      return false // Return false to indicate validation failed
    }

    // Prepare data for submission - extract raw values from formatted currency
    const submissionData = {
      ...formData,
      platformSource: platformSourceOptions,
      platformDestination: platformDestinationOptions,
      senderBalanceId: selectedSourceSaldo?.id,
      receiverBalanceId: selectedDestSaldo?.id,
      amount: formData.amountRaw || extractNumeric(formData.amount),
      operational: formData.operationalRaw || extractNumeric(formData.operational),
      user_id: loggedInUser ? loggedInUser.id : 1 // Ensure user ID is sent to backend
    }

    // Submit the data
    onSubmit(submissionData)

    // Close modal and reset form after successful submission
    setModalOpen(false)

    // Reset form data after submission
    setFormData({
      user: '',
      platformSource: '',
      platformDestination: '',
      senderBalance: '',
      receiverBalance: '',
      amount: '',
      operational: '',
      description: ''
    })
    setPlatformSourceOptions('')
    setPlatformDestinationOptions('')
    setSelectedSourceSaldo(null)
    setSelectedDestSaldo(null)

    return true // Return true to indicate successful validation and submission
  }

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

  return (
    <>
      <div className="w-full flex justify-end">
        <ButtonInput size="xs" onClick={() => setModalOpen(true)}>
          <HiPlus size={18} />
          {buttonText}
        </ButtonInput>
      </div>
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={() => handleSubmit()}
        preventCloseOnSubmit={true} // Add this prop if your Modal component supports it
      >
        {/* Replace input field with display of user name */}
        <div className="col-span-2 mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Petugas Pemindah</label>
          <div className="p-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
            {loggedInUser
              ? loggedInUser.username || loggedInUser.nama || 'User ID: ' + loggedInUser.id
              : 'Loading...'}
          </div>
          {/* Hidden input to store the user ID */}
          <input type="hidden" name="user_id" value={loggedInUser ? loggedInUser.id : 1} />
        </div>

        {/* Platform section with flex layout */}
        <div className="col-span-2 flex gap-4 mb-4">
          {/* Left side - Platform Source */}
          <div className="flex-1">
            <SelectItems
              onChange={(e) => {
                setPlatformSourceOptions(e.target.value)
              }}
              name="platformSource"
              label="Platform Sumber"
              value={platformSourceOptions}
              options={getPlatformOptions()}
            ></SelectItems>
            {errors.platformSource && (
              <p className="text-red-500 text-xs mt-1">{errors.platformSource}</p>
            )}
          </div>

          {/* Right side - Platform Destination */}
          <div className="flex-1">
            <SelectItems
              onChange={(e) => {
                setPlatformDestinationOptions(e.target.value)
              }}
              name="platformDestination"
              label="Platform Penerima"
              value={platformDestinationOptions}
              options={getPlatformOptions()}
            ></SelectItems>
            {errors.platformDestination && (
              <p className="text-red-500 text-xs mt-1">{errors.platformDestination}</p>
            )}
          </div>
        </div>

        {/* Balance section with flex layout */}
        <div className="col-span-2 flex gap-4 mb-4">
          {/* Left side - Sender Balance */}
          <div className="flex-1">
            <InputField
              name="senderBalance"
              type="text"
              value={selectedSourceSaldo ? formatBalanceDisplay(selectedSourceSaldo.saldo) : '-'}
              onChange={() => {}} // No change handler needed as it's disabled
              disabled={true}
              className={
                selectedSourceSaldo && selectedSourceSaldo.saldo === 0 ? 'text-red-500' : ''
              }
            >
              Saldo Pengirim
            </InputField>
            {errors.balance && <p className="text-red-500 text-xs mt-1">{errors.balance}</p>}
          </div>

          {/* Right side - Receiver Balance */}
          <div className="flex-1">
            <InputField
              name="receiverBalance"
              type="text"
              value={selectedDestSaldo ? formatBalanceDisplay(selectedDestSaldo.saldo) : '-'}
              onChange={() => {}} // No change handler needed as it's disabled
              disabled={true}
              className={selectedDestSaldo && selectedDestSaldo.saldo === 0 ? 'text-red-500' : ''}
            >
              Saldo Penerima
            </InputField>
          </div>
        </div>

        <InputField
          name="amount"
          type="text"
          value={formData.amount || ''}
          onChange={handleInputChange}
          placeholder="Rp 0"
        >
          Nominal
        </InputField>
        {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}

        <InputField
          name="operational"
          type="text"
          value={formData.operational || ''}
          onChange={handleInputChange}
          placeholder="Rp 0"
        >
          Operasional
        </InputField>

        <InputField
          required={false}
          name="description"
          className="col-span-2"
          value={formData.description || ''}
          onChange={handleInputChange}
          placeholder="Tambahkan keterangan (opsional)"
        >
          Keterangan
        </InputField>
      </Modal>
    </>
  )
}

export default FormLayout
