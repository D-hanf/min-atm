import React, { useEffect, useState } from 'react'

import InputField from '../../../../components/InputField'

/**
 * Form untuk transaksi "Input Bonus Alat" — dipakai saat alat (mis. EDC/mesin
 * dari bank tertentu) TIDAK memberi bonus per transaksi, melainkan menumpuk
 * bonusnya dan baru dikirim/dicairkan setelah beberapa transaksi berjalan.
 *
 * Supaya bonus yang tertunda ini tetap tercatat, kasir/admin input satu entri
 * "Input Bonus Alat" berisi nominal bonus yang BENAR-BENAR diterima (biasanya
 * dari notifikasi/mutasi bank saat pencairan) — BUKAN nilai yang dihitung
 * otomatis dari aturan bonus per-transaksi (alat_bonus_jenis_rules). Form ini
 * SENGAJA tidak auto-mengisi default seperti form Cek Saldo: dua konsep bonus
 * ini beda total, jumlah yang menumpuk lalu cair sekaligus tidak bisa
 * diprediksi dari aturan per-transaksi manapun, jadi dipaksa selalu diisi
 * manual supaya tidak ada default yang salah kesimpan tanpa disadari.
 *
 * Asumsi API (sesuaikan nama method dengan yang sudah ada di preload/main process):
 *   window.api.getAlat()      -> Promise<Array<{ id, nama_alat, is_active, sumber_dana_bonus_id }>>
 *                                 (master data alat yang sama dengan yang dikelola di halaman KelolaFeeAlat)
 *   window.api.getSaldoAwal() -> Promise<Array<{ id, nama_sumber_dana, ... }>>
 *                                 (dipakai juga di form transaksi lain untuk pilihan sumber dana)
 *
 * Field yang disimpan ke formData:
 *   - alat_id        : id alat yang bonusnya sedang dicairkan
 *   - alat_nama      : nama alat (disimpan juga supaya tabel riwayat tidak perlu join)
 *   - sumber_dana_id : id sumber dana tujuan masuknya bonus
 *                      -> PENTING: pakai nama field `sumber_dana_id` yang sama dengan kolom
 *                         transaksi.sumber_dana_id di database (dipakai semua jenis transaksi),
 *                         supaya backend createTransaksi bisa menemukan sumber dananya.
 *   - bonus          : nominal bonus yang dicairkan — SELALU diisi manual oleh
 *                       kasir/admin sesuai jumlah yang benar-benar diterima
 *   - keterangan     : sangat dianjurkan diisi (mis. rentang tanggal/jumlah
 *                       transaksi yang diakumulasi) supaya gampang ditelusuri
 *                       saat audit — tidak ada field terstruktur untuk ini,
 *                       cuma teks bebas
 *
 * nominal_transaksi & fee entri ini SELALU 0 (lihat useEffect pemaksaan fee di
 * bawah) — satu-satunya angka yang berarti di sini adalah `bonus`, yang di
 * laporan keuangan (getLaporanKeuangan) otomatis terhitung sebagai keuntungan
 * murni karena nominalMasuk - nominalKeluar keduanya 0.
 */

// Format angka jadi "Rp 1.000.000" saat ditampilkan di input
const formatAngkaInput = (value) => {
  const digits = String(value ?? '').replace(/[^0-9]/g, '')
  return digits ? `Rp ${new Intl.NumberFormat('id-ID').format(Number(digits))}` : 'Rp '
}

// Balikin ke angka murni (buang "Rp" dan titik pemisah ribuan) sebelum disimpan ke state
const parseAngkaInput = (value) => String(value ?? '').replace(/[^0-9]/g, '')

const InputBonusAlat = ({ formData, onChange, onValidChange }) => {
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

  // Validasi: alat & sumber dana tujuan harus dipilih, dan bonus harus diisi
  // angka > 0 — beda dengan Cek Saldo yang boleh 0, di sini kalau 0 berarti
  // memang belum ada apa-apa yang perlu dicatat (jangan sampai kesimpan entri
  // kosong tanpa disadari).
  useEffect(() => {
    const isValid = !!formData.alat_id && !!formData.sumber_dana_id && Number(formData.bonus || 0) > 0
    onValidChange?.(isValid)
  }, [formData.alat_id, formData.sumber_dana_id, formData.bonus, onValidChange])

  // 🔒 Input Bonus Alat TIDAK PERNAH punya fee atau nominal transaksi — form
  // ini murni mencatat bonus yang tertunda/terkumpul. Paksa fee ke 0 begitu
  // form ini aktif, supaya sisa fee dari jenis transaksi lain yang sempat
  // dipilih kasir sebelumnya tidak ikut tersimpan tanpa disadari.
  useEffect(() => {
    if (formData.fee !== 0 && formData.fee !== '0') {
      onChange({ target: { name: 'fee', value: 0 } })
    }
    if (formData.is_fee_manual) {
      onChange({ target: { name: 'is_fee_manual', value: false } })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleAlatChange = (e) => {
    const alatId = e.target.value
    const alat = alatList.find((a) => String(a.id) === String(alatId))

    onChange({ target: { name: 'alat_id', value: alatId } })
    onChange({ target: { name: 'alat_nama', value: alat ? alat.nama_alat : '' } })

    // Sumber dana tujuan ikut default alat (bisa diubah manual kalau perlu).
    // BONUS SENGAJA TIDAK di-auto-isi di sini — lihat penjelasan di docstring
    // atas kenapa form ini tidak boleh meniru mekanisme auto-default Cek Saldo.
    onChange({
      target: {
        name: 'sumber_dana_id',
        value: alat && alat.sumber_dana_bonus_id ? alat.sumber_dana_bonus_id : ''
      }
    })
  }

  const handleSumberDanaChange = (e) => {
    onChange({ target: { name: 'sumber_dana_id', value: e.target.value } })
  }

  const handleBonusChange = (e) => {
    const newBonus = parseAngkaInput(e.target.value)
    onChange({ target: { name: 'bonus', value: newBonus } })
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
            {loadingAlat ? 'Memuat daftar alat...' : 'Pilih alat '}
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
        name="bonus"
        type="text"
        value={formatAngkaInput(formData.bonus)}
        onChange={handleBonusChange}
      >
        Jumlah Bonus 
      </InputField>

      <InputField
        name="keterangan"
        className="col-span-2"
        value={formData.keterangan || ''}
        onChange={onChange}
        required={false}
        placeholder="cth: akumulasi transaksi 1-20 Jul, dicairkan lewat notifikasi mutasi bank"
      >
        Keterangan
      </InputField>
    </>
  )
}

export default InputBonusAlat