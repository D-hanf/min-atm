import React, { useEffect, useState } from 'react'

import InputField from '../../../../components/InputField'
import RupiahInput from '../../../../components/RupiahInput'
import SelectItems from '../../../../components/SelectItems'
import { useTheme } from '../../../../context/ThemeContext'

const TarikTunaiForm = ({ formData, onChange, onValidChange }) => {
  const { isDark } = useTheme()
  const [nominalError, setNominalError] = useState('')
  const [feeType, setFeeType] = useState('Digital')
  const [sumberDanaList, setSumberDanaList] = useState([])
  const [sameSourceError, setSameSourceError] = useState('')
  const [manualFee, setManualFee] = useState(false)

  const fetchSaldo = async () => {
    try {
      const result = await window.api.getSaldoAwal()
      setSumberDanaList(result)
    } catch (error) {
      console.error('❌ Gagal ambil data saldo:', error)
    }
  }

  useEffect(() => {
    fetchSaldo()
  }, [])

  const handleFeeTypeChange = (e) => {
    setFeeType(e.target.value)
  }

  // Validasi dan perhitungan fee
  useEffect(() => {
    const nominal = parseInt(formData.nominal_transaksi || '0', 10)

    if (!formData.nominal_transaksi) {
      setManualFee(false)
    }

    if (!isNaN(nominal) && !manualFee) {
      let fee = 5000
      if (nominal > 3000000 && nominal <= 5000000) {
        fee = 10000
      } else if (nominal >= 5000000) {
        fee = Math.round((nominal / 1000000) * 2000)
      }

      if (formData.fee !== fee) {
        onChange({
          target: { name: 'fee', value: fee }
        })
      }
    }
  }, [formData.nominal_transaksi, manualFee])

  // Validasi saldo cukup
  useEffect(() => {
    const nominal = parseFloat(formData.nominal_transaksi || 0)
    const sumberDana = sumberDanaList.find((item) => item.id === parseInt(formData.sumber_dana_id))

    if (sumberDana && nominal > sumberDana.saldo) {
      setNominalError(
        `Saldo tidak cukup. Saldo tersedia: Rp ${sumberDana.saldo.toLocaleString('id-ID')}`
      )
      onValidChange?.(false)
    } else {
      setNominalError('')
      onValidChange?.(true)
    }
  }, [formData.sumber_dana_id, formData.nominal_transaksi, sumberDanaList])

  return (
    <>
      {/* Header Nomor Transaksi */}
      <div
        className={`${isDark ? 'bg-gray-700 border-blue-700' : 'bg-gray-50 border-blue-500'} p-4 rounded-lg mb-4 border-l-4`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            Nomor Transaksi:
          </span>
          <span
            className={`${isDark ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-blue-800'} text-sm font-semibold px-3 py-1 rounded-full`}
          >
            {formData.no_transaksi || 'Generating...'}
          </span>
        </div>
      </div>

      <InputField
        name="tanggal"
        type="date"
        value={formData.tanggal || new Date().toISOString().split('T')[0]}
        onChange={onChange}
      >
        Tanggal
      </InputField>
      <SelectItems
        options={sumberDanaList
          .filter((item) => {
            const nama = item.nama_sumber_dana.toLowerCase()
            return nama === 'laci' || nama === 'cash'
          })
          .map((item) => ({
            label: item.nama_sumber_dana,
            value: item.id
          }))}
        label="Sumber Dana"
        name="sumber_dana_id"
        value={formData.sumber_dana_id || ''}
        onChange={onChange}
        required
      />

      <SelectItems
        options={sumberDanaList
          .filter((item) => {
            const nama = item.nama_sumber_dana.toLowerCase()
            return nama !== 'laci' && nama !== 'cash'
          })
          .map((item) => ({
            label: item.nama_sumber_dana,
            value: item.id
          }))}
        label="Terima Dana"
        name="terima_dana_id"
        value={formData.terima_dana_id || ''}
        onChange={onChange}
        required
      />

      {sameSourceError && <p className="text-sm text-red-500 mb-2">{sameSourceError}</p>}

      <RupiahInput
        name="nominal_transaksi"
        value={formData.nominal_transaksi}
        onChange={onChange}
        label="Nominal Transaksi"
        error={nominalError}
        required
      />

      <InputField
        name="fee"
        type="text"
        value={
          formData.fee
            ? new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(formData.fee)
            : ''
        }
        onChange={(e) => {
          setManualFee(true)
          const numericFee = parseInt(e.target.value.replace(/[^\d]/g, ''), 10) || 0
          onChange({
            target: { name: 'fee', value: numericFee }
          })
        }}
      >
        Fee
      </InputField>

      <InputField
        name="keterangan"
        type="text"
        value={formData.keterangan || ''}
        onChange={onChange}
        required={false}
      >
        Keterangan
      </InputField>
    </>
  )
}

export default TarikTunaiForm
