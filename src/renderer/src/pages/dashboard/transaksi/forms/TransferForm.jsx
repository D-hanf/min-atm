import React, { useEffect, useState } from 'react'
import { findMatchingRule, formatRupiahDisplay, parseRupiahInput } from './feeBonusUtils'

import InputField from '../../../../components/InputField'
import RupiahInput from '../../../../components/RupiahInput'
import SelectItems from '../../../../components/SelectItems'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import { useTheme } from '../../../../context/ThemeContext'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)

const JENIS_TRANSAKSI = 'Transfer'

const TransferForm = ({ formData, onChange, onValidChange }) => {
  const { isDark } = useTheme()
  const [nominalError, setNominalError] = useState('')
  const [feeType, setFeeType] = useState('Digital')
  const [sumberDanaList, setSumberDanaList] = useState([])
  const [sameSourceError, setSameSourceError] = useState('')
  const [manualFee, setManualFee] = useState(false)
  const [manualAdmin, setManualAdmin] = useState(false)

  // Alat & bonus
  const [alatList, setAlatList] = useState([])
  const [feeRules, setFeeRules] = useState([])
  const [alatBonusRules, setAlatBonusRules] = useState([])
  const [manualBonus, setManualBonus] = useState(false)

  const fetchSaldo = async () => {
    try {
      const result = await window.api.getSaldoAwal()
      setSumberDanaList(result)
    } catch (error) {
      console.error('❌ Gagal ambil data saldo:', error)
    }
  }
  const getNowDateTimeLocalWIB = () => dayjs().tz('Asia/Jakarta').format('YYYY-MM-DDTHH:mm')
  useEffect(() => {
    fetchSaldo()
  }, [])

  useEffect(() => {
    const fetchAlat = async () => {
      try {
        const result = await window.api.getAlat()
        setAlatList((result || []).filter((a) => a.is_active === undefined || !!a.is_active))
      } catch (error) {
        console.error('❌ Gagal ambil data alat:', error)
      }
    }
    fetchAlat()
  }, [])

  useEffect(() => {
    const fetchFeeRules = async () => {
      try {
        const result = await window.api.getFeeRules(JENIS_TRANSAKSI)
        setFeeRules(result || [])
      } catch (error) {
        console.error('❌ Gagal ambil aturan fee:', error)
      }
    }
    fetchFeeRules()
  }, [])

  useEffect(() => {
    const fetchBonusRules = async () => {
      if (!formData.alat_id) {
        setAlatBonusRules([])
        return
      }
      try {
        const result = await window.api.getAlatBonusRules(formData.alat_id)
        setAlatBonusRules(result || [])
      } catch (error) {
        console.error('❌ Gagal ambil aturan bonus alat:', error)
      }
    }
    fetchBonusRules()
  }, [formData.alat_id])

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
  }, [formData.nominal_transaksi, manualFee])

  // Auto-isi fee dari aturan fee admin (fee_rules), selama belum diubah manual oleh karyawan
  useEffect(() => {
    if (manualFee) return
    const matched = findMatchingRule(feeRules, formData.nominal_transaksi)
    onChange({ target: { name: 'fee', value: matched ? Number(matched.fee) : 0 } })
    onChange({ target: { name: 'is_fee_manual', value: false } })
  }, [formData.nominal_transaksi, feeRules, manualFee])

  // Auto-isi bonus dari aturan bonus alat (alat_bonus_rules), selama belum diubah manual
  useEffect(() => {
    if (manualBonus) return
    const matched = findMatchingRule(alatBonusRules, formData.nominal_transaksi)
    onChange({ target: { name: 'bonus', value: matched ? Number(matched.bonus) : 0 } })
    onChange({ target: { name: 'is_bonus_manual', value: false } })
  }, [formData.nominal_transaksi, alatBonusRules, manualBonus])

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
  }, [formData.sumber_dana_id, formData.nominal_transaksi, formData.biaya_admin, sumberDanaList])

  const handleFeeChange = (e) => {
    setManualFee(true)
    const numericFee = parseRupiahInput(e.target.value)
    onChange({ target: { name: 'fee', value: numericFee } })
    onChange({ target: { name: 'is_fee_manual', value: true } })
  }

  const handleAlatChange = (e) => {
    const alatId = e.target.value
    const alat = alatList.find((a) => String(a.id) === String(alatId))
    onChange({ target: { name: 'alat_id', value: alatId } })
    onChange({ target: { name: 'alat_nama', value: alat ? alat.nama_alat : '' } })
    setManualBonus(false)
  }

  const handleBonusChange = (e) => {
    setManualBonus(true)
    const numericBonus = parseRupiahInput(e.target.value)
    onChange({ target: { name: 'bonus', value: numericBonus } })
    onChange({ target: { name: 'is_bonus_manual', value: true } })
  }

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
        type="datetime-local"
        value={formData.tanggal || formData.date || getNowDateTimeLocalWIB()}
        onChange={onChange}
      >
        Tanggal & Jam
      </InputField>

      <InputField
        name="nama_pelanggan"
        type="text"
        value={formData.nama_pelanggan || ''}
        onChange={onChange}
      >
        Nama Pelanggan
      </InputField>

      <InputField
        name="nomor_tujuan"
        type="text"
        value={formData.nomor_tujuan || ''}
        onChange={onChange}
      >
        Nomor Rekening Tujuan
      </InputField>
      <SelectItems
        options={[
          { label: 'Briva', value: 'Briva' },
          { label: 'Antar Bank', value: 'Antar Bank' },
          { label: 'Sesama Bank', value: 'Sesama Bank' }
        ]}
        label="Tipe Transaksi"
        name="tipe_transaksi"
        value={formData.tipe_transaksi || ''}
        onChange={onChange}
      />

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

      {sameSourceError && <p className="text-sm text-red-500 mb-2">{sameSourceError}</p>}

      <RupiahInput
        name="nominal_transaksi"
        value={formData.nominal_transaksi}
        onChange={onChange}
        label="Nominal"
        error={nominalError}
        required
      />

      <InputField name="fee" type="text" value={formatRupiahDisplay(formData.fee)} onChange={handleFeeChange}>
        Biaya Jasa
      </InputField>
      {formData.is_fee_manual && (
        <div className="col-span-2 flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-md bg-yellow-100 text-yellow-800 border border-yellow-300">
          ⚠️ Fee diisi manual oleh karyawan (berbeda dari aturan fee default)
        </div>
      )}

      <SelectItems
        options={sumberDanaList.map((item) => ({
          label: item.nama_sumber_dana,
          value: item.id
        }))}
        label="Metode Pembayaran (Fee Masuk ke)"
        name="metode_pembayaran"
        value={formData.metode_pembayaran || ''}
        onChange={onChange}
        required
      />

      <InputField
        name="biaya_admin"
        type="text"
        value={formatRupiahDisplay(formData.biaya_admin)}
        onChange={(e) => {
          setManualAdmin(true)
          const numericAdmin = parseRupiahInput(e.target.value)
          onChange({ target: { name: 'biaya_admin', value: numericAdmin } })
        }}
        required={false}
      >
        Biaya Admin
      </InputField>

      <SelectItems
        options={alatList.map((alat) => ({
          label: alat.nama_alat,
          value: alat.id
        }))}
        label="Alat yang Digunakan"
        name="alat_id"
        value={formData.alat_id || ''}
        onChange={handleAlatChange}
        required={false}
      />

      <InputField
        name="bonus"
        type="text"
        value={formatRupiahDisplay(formData.bonus)}
        onChange={handleBonusChange}
        required={false}
      >
        Bonus Alat
      </InputField>
      {formData.is_bonus_manual && (
        <div className="col-span-2 flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-md bg-yellow-100 text-yellow-800 border border-yellow-300">
          ⚠️ Bonus diisi manual oleh karyawan (berbeda dari default alat)
        </div>
      )}

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

export default TransferForm