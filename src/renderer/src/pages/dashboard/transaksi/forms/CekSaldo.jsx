import React, { useEffect, useState } from 'react'

import InputField from '../../../../components/InputField'

/**
 * Form untuk transaksi "Cek Saldo" (cek saldo kartu ATM via alat EDC/mesin dll).
 *
 * Asumsi API (sesuaikan nama method dengan yang sudah ada di preload/main process):
 *   window.api.getAlat()       -> Promise<Array<{ id, nama_alat, is_active, bonus_cek_saldo, sumber_dana_bonus_id }>>
 *                                  (master data alat yang sama dengan yang dikelola di halaman KelolaFeeAlat)
 *   window.api.getSaldoAwal()  -> Promise<Array<{ id, nama_sumber_dana, ... }>>
 *                                  (dipakai juga di form transaksi lain untuk pilihan sumber dana)
 *
 * Field yang disimpan ke formData:
 *   - alat_id        : id alat yang dipilih
 *   - alat_nama      : nama alat (disimpan juga supaya tabel riwayat tidak perlu join)
 *   - sumber_dana_id : id sumber dana tujuan masuknya bonus (default ikut alat, bisa diubah manual)
 *                      -> PENTING: pakai nama field `sumber_dana_id` yang sama dengan kolom
 *                         transaksi.sumber_dana_id di database (dipakai semua jenis transaksi),
 *                         BUKAN nama field baru, supaya backend createTransaksi bisa menemukan
 *                         sumber dananya.
 *   - bonus          : nominal bonus yang didapat dari cek saldo (auto dari alat, bisa diubah manual)
 *   - is_bonus_manual: true jika kasir mengubah bonus dari nilai default alat
 *                      -> dipakai oleh tabel riwayat transaksi di frontend untuk menampilkan
 *                         badge/notifikasi "bonus diubah manual oleh karyawan"
 *   - nama_pelanggan : opsional, nama pemilik kartu
 *   - keterangan     : opsional
 */

// Format angka jadi "Rp 1.000.000" saat ditampilkan di input
const formatAngkaInput = (value) => {
  const digits = String(value ?? '').replace(/[^0-9]/g, '')
  return digits ? `Rp ${new Intl.NumberFormat('id-ID').format(Number(digits))}` : 'Rp '
}

// Balikin ke angka murni (buang "Rp" dan titik pemisah ribuan) sebelum disimpan ke state
const parseAngkaInput = (value) => String(value ?? '').replace(/[^0-9]/g, '')

const CekSaldo = ({ formData, onChange, onValidChange }) => {
  const [alatList, setAlatList] = useState([])
  const [loadingAlat, setLoadingAlat] = useState(true)

  const [sumberDanaList, setSumberDanaList] = useState([])
  const [loadingSumberDana, setLoadingSumberDana] = useState(true)

  useEffect(() => {
    const fetchAlat = async () => {
      try {
        if (window.api && window.api.getAlat) {
          const result = await window.api.getAlat()
          // Hanya tampilkan alat yang statusnya aktif (mengikuti master data di halaman KelolaFeeAlat)
          const activeOnly = (result || []).filter((a) => a.is_active === undefined || !!a.is_active)
          setAlatList(activeOnly)
        } else {
          console.warn('⚠️ API getAlat belum tersedia, lengkapi di preload/main process')
        }
      } catch (error) {
        console.error('❌ Gagal ambil data alat:', error)
      } finally {
        setLoadingAlat(false)
      }
    }
    fetchAlat()
  }, [])

  useEffect(() => {
    const fetchSumberDana = async () => {
      try {
        if (window.api && window.api.getSaldoAwal) {
          const result = await window.api.getSaldoAwal()
          setSumberDanaList(result || [])
        } else {
          console.warn('⚠️ API getSaldoAwal belum tersedia, lengkapi di preload/main process')
        }
      } catch (error) {
        console.error('❌ Gagal ambil data sumber dana:', error)
      } finally {
        setLoadingSumberDana(false)
      }
    }
    fetchSumberDana()
  }, [])

  // Validasi: alat harus dipilih, sumber dana tujuan bonus harus dipilih,
  // bonus harus terisi (boleh 0 kalau memang tidak ada bonus)
  useEffect(() => {
    const isValid =
      !!formData.alat_id &&
      !!formData.sumber_dana_id &&
      formData.bonus !== '' &&
      formData.bonus !== undefined &&
      formData.bonus !== null
    onValidChange?.(isValid)
  }, [formData.alat_id, formData.sumber_dana_id, formData.bonus, onValidChange])

  const selectedAlat = alatList.find((a) => String(a.id) === String(formData.alat_id))

  const handleAlatChange = (e) => {
    const alatId = e.target.value
    const alat = alatList.find((a) => String(a.id) === String(alatId))

    onChange({
      target: { name: 'alat_id', value: alatId }
    })
    onChange({
      target: { name: 'alat_nama', value: alat ? alat.nama_alat : '' }
    })
    // Set bonus & sumber dana tujuan ke default alat, reset flag manual setiap kali ganti alat
    onChange({
      target: { name: 'bonus', value: alat ? (alat.bonus_cek_saldo ?? 0) : 0 }
    })
    onChange({
      target: {
        name: 'sumber_dana_id',
        value: alat && alat.sumber_dana_bonus_id ? alat.sumber_dana_bonus_id : ''
      }
    })
    onChange({
      target: { name: 'is_bonus_manual', value: false }
    })
  }

  const handleSumberDanaChange = (e) => {
    onChange({ target: { name: 'sumber_dana_id', value: e.target.value } })
  }

  const handleBonusChange = (e) => {
    const newBonus = parseAngkaInput(e.target.value)
    const defaultBonus = selectedAlat ? Number(selectedAlat.bonus_cek_saldo ?? 0) : null
    const isManual = defaultBonus !== null && Number(newBonus || 0) !== defaultBonus

    onChange({ target: { name: 'bonus', value: newBonus } })
    onChange({ target: { name: 'is_bonus_manual', value: isManual } })
  }

  return (
    <>
      <div className="col-span-2 flex flex-col gap-1">
        <label className="text-sm font-medium">Pilih Alat</label>
        <select
          name="alat_id"
          value={formData.alat_id || ''}
          onChange={handleAlatChange}
          disabled={loadingAlat}
          className="border rounded-md px-3 py-2 bg-transparent"
        >
          <option value="" disabled>
            {loadingAlat ? 'Memuat daftar alat...' : 'Pilih alat cek saldo'}
          </option>
          {alatList.map((alat) => (
            <option key={alat.id} value={alat.id}>
              {alat.nama_alat}
            </option>
          ))}
        </select>
        {!loadingAlat && alatList.length === 0 && (
          <p className="text-xs text-red-500 mt-1">
            Belum ada alat terdaftar. Hubungi admin untuk menambahkan alat di halaman master data.
          </p>
        )}
      </div>

      <div className="col-span-2 flex flex-col gap-1">
        <label className="text-sm font-medium">Bonus Masuk ke Sumber Dana</label>
        <select
          name="sumber_dana_id"
          value={formData.sumber_dana_id || ''}
          onChange={handleSumberDanaChange}
          disabled={loadingSumberDana}
          className="border rounded-md px-3 py-2 bg-transparent"
        >
          <option value="" disabled>
            {loadingSumberDana ? 'Memuat daftar sumber dana...' : 'Pilih sumber dana tujuan bonus'}
          </option>
          {sumberDanaList.map((sd) => (
            <option key={sd.id} value={sd.id}>
              {sd.nama_sumber_dana}
            </option>
          ))}
        </select>
      </div>

      <InputField
        name="nama_pelanggan"
        type="text"
        value={formData.nama_pelanggan || ''}
        onChange={onChange}
        required={false}
      >
        Nama Pelanggan
      </InputField>

      <InputField
        name="bonus"
        type="text"
        value={formatAngkaInput(formData.bonus)}
        onChange={handleBonusChange}
      >
        Bonus
      </InputField>

      {formData.is_bonus_manual && (
        <div className="col-span-2 flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-md bg-yellow-100 text-yellow-800 border border-yellow-300">
          ⚠️ Bonus diisi manual oleh karyawan (berbeda dari default alat
          {selectedAlat ? ` "${selectedAlat.nama_alat}"` : ''})
        </div>
      )}

      <InputField
        name="keterangan"
        className="col-span-2"
        value={formData.keterangan || ''}
        onChange={onChange}
        required={false}
      >
        Keterangan
      </InputField>
    </>
  )
}

export default CekSaldo