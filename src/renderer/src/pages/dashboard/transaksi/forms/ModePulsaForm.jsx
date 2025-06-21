import React, { useEffect, useState } from 'react'

import InputField from '../../../../components/InputField'
import RupiahInput from '../../../../components/RupiahInput'
import SelectItems from '../../../../components/SelectItems'
import { useTheme } from '../../../../context/ThemeContext'

const ModePulsaForm = ({ formData, onChange, onValidChange }) => {
  const { isDark } = useTheme()
  const [sumberDanaList, setSumberDanaList] = useState([])
  const [manualFee, setManualFee] = useState(false)
  const [manualAdmin, setManualAdmin] = useState(false)
  const [nominalError, setNominalError] = useState('')

  useEffect(() => {
    const fetchSaldo = async () => {
      try {
        const result = await window.api.getSaldoAwal()
        setSumberDanaList(result)
      } catch (error) {
        console.error('❌ Gagal ambil data saldo:', error)
      }
    }

    fetchSaldo()
  }, [])

  useEffect(() => {
    setManualAdmin(false)
  }, [formData.sumber_dana_id])

  useEffect(() => {
    const sumberDana = sumberDanaList.find((item) => item.id === parseInt(formData.sumber_dana_id))
    if (sumberDana && !manualAdmin) {
      onChange({ target: { name: 'biaya_admin', value: sumberDana.biaya_admin || 0 } })
    }
  }, [formData.sumber_dana_id, sumberDanaList, manualAdmin])

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
  // Validasi saldo cukup
  useEffect(() => {
    const nominal = parseFloat(formData.nominal_transaksi || 0)
    const admin = parseFloat(formData.biaya_admin || 0)
    const totalPengeluaran = nominal + admin

    const sumberDana = sumberDanaList.find((item) => item.id === parseInt(formData.sumber_dana_id))

    if (sumberDana && totalPengeluaran > sumberDana.saldo) {
      setNominalError(
        `Saldo tidak cukup. Saldo tersedia: Rp ${sumberDana.saldo.toLocaleString('id-ID')}`
      )
      onValidChange?.(false)
    } else {
      setNominalError('')
      onValidChange?.(true)
    }
  }, [
    formData.sumber_dana_id,
    formData.nominal_transaksi,
    formData.biaya_admin, // ✅ tambahkan dependency-nya juga
    sumberDanaList
  ])

  return (
    <>
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
        options={sumberDanaList.map((item) => ({
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
        options={sumberDanaList.map((item) => ({
          label: item.nama_sumber_dana,
          value: item.id
        }))}
        label="Terima Dana"
        name="terima_dana_id"
        value={formData.terima_dana_id || ''}
        onChange={onChange}
        required
      />

      <RupiahInput
        name="nominal_transaksi"
        value={formData.nominal_transaksi}
        onChange={onChange}
        label="Nominal"
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
        name="biaya_admin"
        type="text"
        value={
          formData.biaya_admin
            ? new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(formData.biaya_admin)
            : ''
        }
        onChange={(e) => {
          setManualAdmin(true)
          const numericAdmin = parseInt(e.target.value.replace(/[^\d]/g, ''), 10) || 0
          onChange({
            target: { name: 'biaya_admin', value: numericAdmin }
          })
        }}
         required={false}
      >
        Biaya Admin
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

export default ModePulsaForm
