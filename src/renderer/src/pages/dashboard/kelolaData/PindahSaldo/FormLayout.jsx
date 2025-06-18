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

  // Platform options
  const [platformSourceOptions, setPlatformSourceOptions] = useState('')
  const [platformDestinationOptions, setPlatformDestinationOptions] = useState('')
  
  // Selected saldo objects
  const [selectedSourceSaldo, setSelectedSourceSaldo] = useState(null)
  const [selectedDestSaldo, setSelectedDestSaldo] = useState(null)

  // Sample current user (would come from auth context in real app)
  const currentUser = {
    name: 'Ahmad Sulaiman',
    role: 'Admin'
  }

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
        user: currentUser.name
      }))
    }
  }, [modalOpen, saldoOptions])

  // Set the selected saldo when platform changes
  useEffect(() => {
    if (platformSourceOptions && saldoData.length > 0) {
      // Find the first saldo entry that matches the selected platform
      const matchingSaldo = saldoData.find(s => 
        s.nama_sumber_dana && 
        s.nama_sumber_dana.toLowerCase().includes(platformSourceOptions.toLowerCase())
      )
      
      if (matchingSaldo) {
        setSelectedSourceSaldo(matchingSaldo)
        setFormData(prev => ({
          ...prev,
          senderBalance: matchingSaldo.nama_sumber_dana,
          senderBalanceId: matchingSaldo.id
        }))
      }
    } else {
      setSelectedSourceSaldo(null)
      setFormData(prev => ({
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
      const matchingSaldo = saldoData.find(s => 
        s.nama_sumber_dana && 
        s.nama_sumber_dana.toLowerCase().includes(platformDestinationOptions.toLowerCase())
      )
      
      if (matchingSaldo) {
        setSelectedDestSaldo(matchingSaldo)
        setFormData(prev => ({
          ...prev,
          receiverBalance: matchingSaldo.nama_sumber_dana,
          receiverBalanceId: matchingSaldo.id
        }))
      }
    } else {
      setSelectedDestSaldo(null)
      setFormData(prev => ({
        ...prev,
        receiverBalance: '',
        receiverBalanceId: null
      }))
    }
  }, [platformDestinationOptions, saldoData])

  const handleInputChange = (e) => {
    const { name, value } = e.target

    // Special handling for amount and operational fields
    if (name === 'amount' || name === 'operational') {
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

  const handleSubmit = () => {
    // Prepare data for submission - extract raw values from formatted currency
    const submissionData = {
      ...formData,
      platformSource: platformSourceOptions,
      platformDestination: platformDestinationOptions,
      senderBalanceId: selectedSourceSaldo?.id,
      receiverBalanceId: selectedDestSaldo?.id,
      amount: formData.amountRaw || extractNumeric(formData.amount),
      operational: formData.operationalRaw || extractNumeric(formData.operational)
    }

    onSubmit(submissionData)
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
  }

  // Extract unique platforms from saldo data for select options
  const getPlatformOptions = () => {
    // Group saldo by platform for dropdown options
    const platformGroups = {};
    
    saldoData.forEach(item => {
      if (item.nama_sumber_dana) {
        // Extract platform name (e.g., "DANA Pusat" -> "DANA")
        const platformMatch = item.nama_sumber_dana.match(/^(\w+)/);
        if (platformMatch) {
          const platform = platformMatch[1];
          platformGroups[platform] = true;
        }
      }
    });
    
    // Convert to array of options with default option first
    return [
      { label: "Pilih platform", value: "" },
      ...Object.keys(platformGroups).map(platform => ({
        label: platform,
        value: platform
      }))
    ];
  }

  return (
    <>
      <div className="w-full flex justify-end">
        <ButtonInput size="xs" onClick={() => setModalOpen(true)}>
          <HiPlus size={18} />
          {buttonText}
        </ButtonInput>
      </div>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleSubmit}>
        <InputField
          name="user"
          type="text"
          value={formData.user || currentUser.name}
          onChange={handleInputChange}
          disabled={true}
        >
          User Pemindah
        </InputField>

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
          </div>
        </div>

        {/* Balance section with flex layout */}
        <div className="col-span-2 flex gap-4 mb-4">
          {/* Left side - Sender Balance */}
          <div className="flex-1">
            <InputField
              name="senderBalance"
              type="text"
              value={selectedSourceSaldo ? 
                `${formatRupiah(selectedSourceSaldo.saldo)}` : 
                '-'}
              onChange={() => {}} // No change handler needed as it's disabled
              disabled={true}
            >
              Saldo Pengirim
            </InputField>
          </div>

          {/* Right side - Receiver Balance */}
          <div className="flex-1">
            <InputField
              name="receiverBalance"
              type="text"
              value={selectedDestSaldo ? 
                `${formatRupiah(selectedDestSaldo.saldo)}` : 
                '-'}
              onChange={() => {}} // No change handler needed as it's disabled
              disabled={true}
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
        >
          Keterangan
        </InputField>
      </Modal>
    </>
  )
}

export default FormLayout
