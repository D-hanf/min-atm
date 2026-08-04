import React, { useEffect, useState } from 'react'
import { findMatchingRule, formatRupiahDisplay, parseRupiahInput } from './feeBonusUtils'

import InputField from '../../../../components/InputField'
import SelectItems from '../../../../components/SelectItems'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import { useTheme } from '../../../../context/ThemeContext'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)

const JENIS_TRANSAKSI = 'Jasa Transfer'

const JasaTransferForm = ({ formData, onChange }) => {
  const { isDark } = useTheme()
  const [sumberDanaList, setSumberDanaList] = useState([])
  const [manualFee, setManualFee] = useState(false)

  // Alat & bonus
  const [alatList, setAlatList] = useState([])
  const [feeRules, setFeeRules] = useState([])
  const [alatBonusRules, setAlatBonusRules] = useState([]) // rentang bonus utk alat + jenis transaksi ini
  const [manualBonus, setManualBonus] = useState(false)

  const getNowDateTimeLocalWIB = () => dayjs().tz('Asia/Jakarta').format('YYYY-MM-DDTHH:mm')
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

  // Ambil rentang bonus untuk alat + jenis transaksi ini (Jasa Transfer).
  useEffect(() => {
    const fetchBonusRules = async () => {
      if (!formData.alat_id) {
        setAlatBonusRules([])
        return
      }
      try {
        const result = await window.api.getAlatBonusJenisRules({
          alat_id: formData.alat_id,
          jenis_transaksi: JENIS_TRANSAKSI
        })
        setAlatBonusRules(result || [])
      } catch (error) {
        console.error('❌ Gagal ambil aturan bonus alat:', error)
      }
    }
    fetchBonusRules()
  }, [formData.alat_id])

  // Jasa Transfer tidak punya field nominal transaksi, jadi tier fee dicocokkan dengan
  // nominal 0 (asumsinya admin mengatur 1 rentang flat "0 ke atas" untuk jenis ini)
  useEffect(() => {
    if (manualFee) return
    const matched = findMatchingRule(feeRules, 0)
    onChange({ target: { name: 'fee', value: matched ? Number(matched.fee) : 0 } })
    onChange({ target: { name: 'is_fee_manual', value: false } })
  }, [feeRules, manualFee])

  useEffect(() => {
    if (manualBonus) return
    const matched = findMatchingRule(alatBonusRules, 0)
    onChange({ target: { name: 'bonus', value: matched ? Number(matched.bonus) : 0 } })
    onChange({ target: { name: 'is_bonus_manual', value: false } })
  }, [alatBonusRules, manualBonus])

  // Sinkronkan sumber dana agar sama dengan metode pembayaran
  useEffect(() => {
    if (formData.metode_pembayaran) {
      onChange({ target: { name: 'sumber_dana_id', value: formData.metode_pembayaran } })
    }
  }, [formData.metode_pembayaran])

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
      {/* Nomor Transaksi */}
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
            {formData.transactionNumber || 'Generating...'}
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

      {/* Metode Pembayaran */}
      <SelectItems
        options={sumberDanaList.map((item) => ({
          label: item.nama_sumber_dana,
          value: item.id
        }))}
        label="Metode Pembayaran"
        name="metode_pembayaran"
        value={formData.metode_pembayaran || ''}
        onChange={(e) => {
          const id = e.target.value
          onChange({ target: { name: 'metode_pembayaran', value: id } })
        }}
      />

      {/* Fee */}
      <InputField name="fee" type="text" value={formatRupiahDisplay(formData.fee)} onChange={handleFeeChange}>
        Biaya Jasa
      </InputField>
      {formData.is_fee_manual && (
        <div className="col-span-2 flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-md bg-yellow-100 text-yellow-800 border border-yellow-300">
          ⚠️ Fee diisi manual oleh karyawan (berbeda dari aturan fee default)
        </div>
      )}

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
        name="description"
        type="text"
        value={formData.description || ''}
        onChange={onChange}
        required={false}
      >
        Keterangan
      </InputField>
    </>
  )
}

export default JasaTransferForm