import React, { useEffect, useState } from 'react'

import ButtonInput from '../../../../components/ButtonInput'
import Dropdown from '../../../../components/Dropdown'
import { HiPlus } from 'react-icons/hi'
import InputField from '../../../../components/InputField'
import Modal from '../../../../shared/ui/Modal'
import SelectItems from '../../../../components/SelectItems'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import { useTheme } from '../../../../context/ThemeContext'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)
const FormLayout = ({
  onSubmit,
  buttonText = 'Tambah Pemindahan Saldo',
  initialData = {},
  saldoOptions = []
}) => {
  const { isDark } = useTheme()
  const [modalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState(initialData)
  const [saldoData, setSaldoData] = useState([])
  const [loggedInUser, setLoggedInUser] = useState(null)

  const [platformSourceOptions, setPlatformSourceOptions] = useState('')
  const [platformDestinationOptions, setPlatformDestinationOptions] = useState('')

  const [selectedSourceSaldo, setSelectedSourceSaldo] = useState(null)
  const [selectedDestSaldo, setSelectedDestSaldo] = useState(null)

  const [errors, setErrors] = useState({
    platformSource: '',
    platformDestination: '',
    amount: '',
    balance: ''
  })
  // Datetime (WIB) for datetime-local input
  const getNowDateTimeLocalWIB = () => dayjs().tz('Asia/Jakarta').format('YYYY-MM-DDTHH:mm')
  const toDbDateTime = (val) => {
    if (!val) return dayjs().tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm:ss')
    if (val.includes(' ')) {
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(val)) return `${val}:00`
      return val
    }
    if (val.includes('T')) {
      const base = val.replace('T', ' ')
      return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(base) ? `${base}:00` : base
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return `${val} 00:00:00`
    return val
  }

  useEffect(() => {
    const userString = localStorage.getItem('user')
    if (userString) {
      const user = JSON.parse(userString)
      setLoggedInUser(user)
    }
  }, [])

  const formatBalanceDisplay = (value) => {
    if (value === null || value === undefined) return 'Tidak ada Saldo'
    const numericValue = Number(value)
    if (numericValue === 0) return 'Tidak ada Saldo'
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(numericValue)
  }

  const formatRupiah = (value) => {
    if (value === null || value === undefined) return 'Rp 0'
    const numeric = value.toString().replace(/[^0-9]/g, '')
    const numericValue = Number(numeric)
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(numericValue)
  }

  const extractNumeric = (formattedValue) => {
    if (!formattedValue) return ''
    return formattedValue.toString().replace(/[^0-9]/g, '')
  }

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
      setFormData((prevData) => ({
        ...prevData,
        user: loggedInUser?.username || loggedInUser?.nama || 'User ID: ' + loggedInUser?.id,
        user_id: loggedInUser?.id || 1,
  tanggal: getNowDateTimeLocalWIB() // default datetime (local WIB)
      }))
    }
  }, [modalOpen, saldoOptions, loggedInUser])

  useEffect(() => {
    if (platformSourceOptions && saldoData.length > 0) {
      const matchingSaldo = saldoData.find((s) =>
        s.nama_sumber_dana?.toLowerCase().includes(platformSourceOptions.toLowerCase())
      )

      if (matchingSaldo) {
        const biayaAdmin = matchingSaldo.biaya_admin || 0

        setSelectedSourceSaldo(matchingSaldo)
        setFormData((prev) => ({
          ...prev,
          senderBalance: matchingSaldo.nama_sumber_dana,
          senderBalanceId: matchingSaldo.id,
          operational: formatRupiah(biayaAdmin),
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

  useEffect(() => {
    if (platformDestinationOptions && saldoData.length > 0) {
      const matchingSaldo = saldoData.find((s) =>
        s.nama_sumber_dana?.toLowerCase().includes(platformDestinationOptions.toLowerCase())
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

  useEffect(() => {
    setErrors({ ...errors, platformSource: '', balance: '' })
  }, [platformSourceOptions])

  useEffect(() => {
    setErrors({ ...errors, platformDestination: '' })
  }, [platformDestinationOptions])

  const handleInputChange = (e) => {
    const { name, value } = e.target

    if (name === 'amount' || name === 'operational') {
      const numericValue = extractNumeric(value)
      setFormData({
        ...formData,
        [name]: formatRupiah(numericValue),
        [`${name}Raw`]: numericValue
      })

      if (name === 'amount') {
        setErrors({ ...errors, amount: '' })
      }
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const handleSubmit = () => {
    const newErrors = {
      platformSource: '',
      platformDestination: '',
      amount: '',
      balance: ''
    }

    let isValid = true

    if (!selectedSourceSaldo) {
      newErrors.platformSource = 'Pilih platform sumber terlebih dahulu'
      isValid = false
    }

    if (!selectedDestSaldo) {
      newErrors.platformDestination = 'Pilih platform tujuan terlebih dahulu'
      isValid = false
    }

    if (!formData.amount || formData.amountRaw === '0') {
      newErrors.amount = 'Masukkan nominal transfer yang valid'
      isValid = false
    }

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

    setErrors(newErrors)

    if (!isValid) return false

    const submissionData = {
      ...formData,
      platformSource: platformSourceOptions,
      platformDestination: platformDestinationOptions,
      senderBalanceId: selectedSourceSaldo?.id,
      receiverBalanceId: selectedDestSaldo?.id,
      amount: formData.amountRaw || extractNumeric(formData.amount),
      operational: formData.operationalRaw || extractNumeric(formData.operational),
      user_id: loggedInUser?.id || 1,
      tanggal: toDbDateTime(formData.tanggal)
    }

    onSubmit(submissionData)
    setModalOpen(false)

    setFormData({
      user: '',
      platformSource: '',
      platformDestination: '',
      senderBalance: '',
      receiverBalance: '',
      amount: '',
      operational: '',
      description: '',
      tanggal: ''
    })
    setPlatformSourceOptions('')
    setPlatformDestinationOptions('')
    setSelectedSourceSaldo(null)
    setSelectedDestSaldo(null)

    return true
  }

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
    return Object.keys(platformGroups).map((platform) => ({
      label: platform,
      value: platform
    }))
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
        <div className="col-span-2 mb-4">
          <label
            className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
          >
            Petugas Pemindah
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
        </div>

        {/* TANGGAL TRANSAKSI */}
        <InputField
          name="tanggal"
          type="datetime-local"
          value={formData.tanggal || getNowDateTimeLocalWIB()}
          onChange={handleInputChange}
        >
          Tanggal & Jam
        </InputField>

        <div className="col-span-2 flex gap-4 mb-4">
          <div className="flex-1">
            <SelectItems
              onChange={(e) => setPlatformSourceOptions(e.target.value)}
              name="platformSource"
              label="Platform Sumber"
              value={platformSourceOptions}
              options={getPlatformOptions()}
            />
            {errors.platformSource && (
              <p className="text-red-500 text-xs mt-1">{errors.platformSource}</p>
            )}
          </div>
          <div className="flex-1">
            <SelectItems
              onChange={(e) => setPlatformDestinationOptions(e.target.value)}
              name="platformDestination"
              label="Platform Penerima"
              value={platformDestinationOptions}
              options={getPlatformOptions()}
            />
            {errors.platformDestination && (
              <p className="text-red-500 text-xs mt-1">{errors.platformDestination}</p>
            )}
          </div>
        </div>

        <div className="col-span-2 flex gap-4 mb-4">
          <div className="flex-1">
            <InputField
              name="senderBalance"
              type="text"
              value={selectedSourceSaldo ? formatBalanceDisplay(selectedSourceSaldo.saldo) : '-'}
              disabled
              className={selectedSourceSaldo?.saldo === 0 ? 'text-red-500' : ''}
            >
              Saldo Pengirim
            </InputField>
            {errors.balance && <p className="text-red-500 text-xs mt-1">{errors.balance}</p>}
          </div>
          <div className="flex-1">
            <InputField
              name="receiverBalance"
              type="text"
              value={selectedDestSaldo ? formatBalanceDisplay(selectedDestSaldo.saldo) : '-'}
              disabled
              className={selectedDestSaldo?.saldo === 0 ? 'text-red-500' : ''}
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
