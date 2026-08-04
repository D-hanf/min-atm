import React, { useEffect, useMemo, useState } from 'react'

import AlertDialog from '../../../components/AlertDialog'
import ConfirmDialog from '../../../components/ConfirmDialog'
import InputField from '../../../components/InputField'
import ModalEdit from '../../../shared/ui/Modal'
import PageContainer from '../../../components/PageContainer'
import SelectItems from '../../../components/SelectItems'
import TableContent from '../../../components/TableContent'
import TransactionFormLayout from '../transaksi/FormLayout'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import { useAuth } from '../../../context/AuthContext'
import utc from 'dayjs/plugin/utc'

// ⚠️ SESUAIKAN path ini ke lokasi folder Transaksi kamu yang sebenarnya.
// Ini adalah FormLayout yang sama persis dipakai HalamanTransaksi.jsx
// (berisi TransactionMenu + TarikTunaiForm/TransferForm/JasaTransferForm/ModePulsaForm)

dayjs.extend(utc)
dayjs.extend(timezone)

const formatRupiah = (value) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(Number(value || 0))

const extractNumeric = (formattedValue) => {
  if (!formattedValue) return ''
  return formattedValue.toString().replace(/[^0-9]/g, '')
}

// Format rupiah khusus input pindah saldo (persis formatInputRupiah di HalamanPindahSaldo.jsx)
const formatInputRupiah = (value) => {
  const cleaned = String(value || '').replace(/[^0-9]/g, '')
  const number = parseInt(cleaned, 10)
  if (isNaN(number)) return 'Rp 0'
  return 'Rp' + number.toLocaleString('id-ID')
}

const toDisplayDate = (value) =>
  dayjs(value).isValid() ? dayjs(value).tz('Asia/Jakarta').format('YYYY-MM-DD') : value || '-'

const toDisplayDateTime = (value) =>
  dayjs(value).isValid() ? dayjs(value).tz('Asia/Jakarta').format('YYYY-MM-DD HH:mm') : value || '-'

const getTodayWIB = () => dayjs().tz('Asia/Jakarta').format('YYYY-MM-DD')
const getNowDateTimeLocalWIB = () => dayjs().tz('Asia/Jakarta').format('YYYY-MM-DDTHH:mm')

// Format untuk <input type="datetime-local"> — persis di semua Halaman*.jsx
const toInputDateTimeLocal = (val) => {
  if (!val) return getNowDateTimeLocalWIB()
  return dayjs(val).isValid()
    ? dayjs(val).tz('Asia/Jakarta').format('YYYY-MM-DDTHH:mm')
    : getNowDateTimeLocalWIB()
}

// Normalisasi ke format DB (YYYY-MM-DD HH:mm:ss) — persis di semua Halaman*.jsx
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

const asArray = (value) => (Array.isArray(value) ? value : [])

const normalizeJenisTransaksi = (value) => {
  const text = (value || '').toString().toLowerCase()
  if (!text) return '-'
  if (text.includes('jasa')) return 'jasa transfer'
  if (text.includes('tarik')) return 'tarik tunai'
  if (text.includes('mode pulsa')) return 'mode pulsa'
  if (text.includes('transfer')) return 'transfer'
  if (text.includes('hutang')) return 'hutang'
  if (text.includes('ambil saldo')) return 'ambil saldo'
  if (text.includes('pindah saldo')) return 'pindah saldo'
  return text
}

const parseMoney = (value) => Number(String(value || 0).replace(/[^0-9]/g, '')) || 0

// parseRupiah — persis di HalamanTransaksi.jsx (dipakai untuk konversi string rupiah balik ke angka)
const parseRupiah = (value) =>
  Number(
    String(value)
      .replace(/[^0-9,-]+/g, '')
      .replace(',', '.')
  ) || 0

const getNamaSumberDanaById = (id, saldoList) => {
  const numericId = Number(id)
  const found = saldoList.find((item) => item.id === numericId)
  return found ? found.nama_sumber_dana : '-'
}

// Menghitung saldo_akhir & memformat item transaksi — persis logic di dalam fetchTransaksi() HalamanTransaksi.jsx
const buildFormattedTransaksiItem = (item, saldoList) => {
  const nominal = Number(item.nominal_transaksi || 0)
  const fee = Number(item.fee || 0)
  const adminBank = Number(item.biaya_admin_bank || item.biaya_admin || 0)
  const saldoAwal = Number(item.saldo_awal || 0)
  const jenis = item.jenis_transaksi?.toLowerCase() || ''

  let final = saldoAwal
  const sumberSamaDenganTerima = Number(item.sumber_dana_id) === Number(item.terima_dana_id)

  switch (jenis) {
    case 'tarik tunai':
      final -= nominal
      break
    case 'transfer':
    case 'mode pulsa':
      final -= nominal + adminBank
      if (sumberSamaDenganTerima) {
        final += nominal
      }
      break
    case 'jasa transfer':
      break
  }

  if (Number(item.sumber_dana_id) === Number(item.metode_pembayaran)) {
    final += fee
  }

  return {
    id: item.id,
    tanggal: toDisplayDateTime(item.tanggal),
    no_transaksi: item.no_transaksi,
    sumber_dana: item.sumber_dana,
    terima_dana_nama: item.terima_dana_nama || '-',
    jenis_transaksi: item.jenis_transaksi || '-',
    tipe_transaksi: item.tipe_transaksi || '-',
    saldo_awal: formatRupiah(saldoAwal),
    terima_dana_id: item.terima_dana_id || '-',
    nama_pelanggan: item.nama_pelanggan || '-',
    nomor_tujuan: item.nomor_tujuan || '-',
    nominal_transaksi: formatRupiah(nominal),
    fee: formatRupiah(fee),
    metode_pembayaran: Number(item.metode_pembayaran) || null,
    metode_pembayaran_nama: getNamaSumberDanaById(item.metode_pembayaran, saldoList) || '-',
    biaya_admin: formatRupiah(adminBank),
    saldo_akhir: formatRupiah(final),
    keterangan: item.keterangan || '-',
    user_name: item.user_name || '-',
    is_edited: !!item.is_edited,
    edited_at: item.edited_at || null
  }
}

// ── Deteksi kategori & id asli dari prefix id gabungan (transaksi-12, hutang-3, dst) ──
const getRowCategory = (compositeId) => {
  const idStr = String(compositeId || '')
  if (idStr.startsWith('transaksi-')) return 'transaksi'
  if (idStr.startsWith('hutang-')) return 'hutang'
  if (idStr.startsWith('pindah-')) return 'pindah'
  if (idStr.startsWith('ambil-')) return 'ambil'
  return null
}

const getRawId = (compositeId) => {
  const idStr = String(compositeId || '')
  const parts = idStr.split('-')
  return parts.length > 1 ? Number(parts[1]) : null
}

// Ekstrak grup platform dari nama_sumber_dana (kata pertama) — persis getPlatformOptions di FormLayout/Halaman*.jsx
const getPlatformOptions = (saldoList) => {
  const platformGroups = {}
  saldoList.forEach((item) => {
    if (item.nama_sumber_dana) {
      const platformMatch = item.nama_sumber_dana.match(/^(\w+)/)
      if (platformMatch) {
        platformGroups[platformMatch[1]] = true
      }
    }
  })
  return Object.keys(platformGroups).map((platform) => ({ label: platform, value: platform }))
}

const KoreksiTransaksi = () => {
  const { user: loggedInUser } = useAuth()
  const userRole = loggedInUser?.role?.toLowerCase() || 'kasir'
  const isAdmin = userRole === 'admin'

  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [searchValue, setSearchValue] = useState('')
  const [rows, setRows] = useState([])

  // ── Data mentah per kategori, dipakai untuk isi form edit ──
  const [rawData, setRawData] = useState({
    transaksi: [],
    hutang: [],
    pindah: [],
    ambil: []
  })
  const [saldoAwalOptions, setSaldoAwalOptions] = useState([]) // dropdown platform/sumber dana
  const [users, setUsers] = useState([])

  // ── Alert & info dialog (akses & validasi) ──
  const [showAlertDialog, setShowAlertDialog] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')

  // ── State delete (generik semua kategori) ──
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmMessage, setConfirmMessage] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null) // { category, rawId }

  // ── State Tandai Salah (generik semua kategori) ──
  const [markModalOpen, setMarkModalOpen] = useState(false)
  const [markNote, setMarkNote] = useState('')
  const [markNoteError, setMarkNoteError] = useState(false)
  const [markTarget, setMarkTarget] = useState(null) // { table, id }

  const [markInfoOpen, setMarkInfoOpen] = useState(false)
  const [markInfoData, setMarkInfoData] = useState(null) // { keterangan, oleh, olehId, pada, table, id }
  const [showUnmarkConfirm, setShowUnmarkConfirm] = useState(false)

  // ── State Tandai Benar/Sesuai (generik semua kategori) ──
  const [showVerifyConfirm, setShowVerifyConfirm] = useState(false)
  const [verifyTarget, setVerifyTarget] = useState(null) // { table, id }

  const [verifyInfoOpen, setVerifyInfoOpen] = useState(false)
  const [verifyInfoData, setVerifyInfoData] = useState(null) // { oleh, olehId, pada, table, id }
  const [showUnverifyConfirm, setShowUnverifyConfirm] = useState(false)

  // Mapping kategori (prefix id gabungan) → nama tabel di database
  const categoryToTable = {
    transaksi: 'transaksi',
    hutang: 'hutang',
    pindah: 'pindah_saldo',
    ambil: 'ambil_saldo'
  }

  // ─────────────────────────────────────────────────────────
  // AMBIL SALDO — disamakan persis dengan HalamanAmbilSaldo.jsx
  // ─────────────────────────────────────────────────────────
  const [ambilModalOpen, setAmbilModalOpen] = useState(false)
  const [ambilFormData, setAmbilFormData] = useState({
    id: null,
    petugas_pengambil_id: 1,
    platform: '',
    saldo_platform: '',
    nominal_pengambilan: '',
    biaya_admin: '',
    metode_pengambilan: '',
    tujuan_pengambilan: '',
    tanggal_pengambilan: getNowDateTimeLocalWIB(),
    keterangan: ''
  })
  const [ambilSelectedPlatform, setAmbilSelectedPlatform] = useState(null)

  // ─────────────────────────────────────────────────────────
  // HUTANG — disamakan persis dengan HalamanHutang.jsx
  // ─────────────────────────────────────────────────────────
  const [hutangModalOpen, setHutangModalOpen] = useState(false)
  const [hutangFormData, setHutangFormData] = useState({
    id: null,
    petugas_id: 1,
    platform_id: null,
    platform_name: '',
    saldo_platform: '',
    nominal_transaksi: '',
    jenis_transaksi: 'Ambil Hutang',
    biaya_admin: '0',
    tanggal_transaksi: getNowDateTimeLocalWIB(),
    keterangan: ''
  })
  const [hutangSelectedPlatform, setHutangSelectedPlatform] = useState(null)
  const [hutangIsEditingPaid, setHutangIsEditingPaid] = useState(false)

  // ─────────────────────────────────────────────────────────
  // PINDAH SALDO — disamakan persis dengan HalamanPindahSaldo.jsx
  // ─────────────────────────────────────────────────────────
  const [pindahModalOpen, setPindahModalOpen] = useState(false)
  const [pindahFormData, setPindahFormData] = useState({
    id: null,
    user: '',
    userId: null,
    tanggal: getNowDateTimeLocalWIB(),
    platformSource: '',
    platformDestination: '',
    senderBalanceId: null,
    receiverBalanceId: null,
    amount: '',
    operational: '',
    description: ''
  })
  const [pindahPlatformSourceOptions, setPindahPlatformSourceOptions] = useState('')
  const [pindahPlatformDestinationOptions, setPindahPlatformDestinationOptions] = useState('')
  const [pindahSelectedSourceSaldo, setPindahSelectedSourceSaldo] = useState(null)
  const [pindahSelectedDestSaldo, setPindahSelectedDestSaldo] = useState(null)

  // ─────────────────────────────────────────────────────────
  // TRANSAKSI — disamakan persis dengan HalamanTransaksi.jsx
  // (reuse komponen FormLayout formType="transaction" yang sama,
  // bukan modal custom — supaya sub-form Tarik Tunai/Transfer/
  // Jasa Transfer/Mode Pulsa tetap konsisten dengan halaman asli)
  // ─────────────────────────────────────────────────────────
  const [showTransaksiEditModal, setShowTransaksiEditModal] = useState(false)
  const [transaksiEditData, setTransaksiEditData] = useState(null)

  const fetchAll = async () => {
    try {
      setIsLoading(true)
      setLoadError('')

      // 🔓 Halaman Koreksi Transaksi sengaja selalu menampilkan SEMUA data,
      // terlepas dari role yang login. Backend (get-transaksi/get-hutang/dst)
      // membatasi hasil ke "hari ini saja" kalau role yang dikirim = 'kasir',
      // jadi di sini kita selalu kirim 'admin' supaya kasir pun bisa melihat
      // seluruh riwayat transaksi (bukan berarti kasir jadi admin — hak edit/
      // hapus tetap dikontrol terpisah lewat `isAdmin` di bawah).
      const dataFetchRole = 'admin'

      const [transaksiRes, hutangRes, pindahRes, ambilRes, saldoRes, usersRes] =
        await Promise.allSettled([
          window.api?.getTransaksi?.(dataFetchRole),
          window.api?.getHutang?.(dataFetchRole),
          window.api?.getPindahSaldo?.(dataFetchRole),
          window.api?.getAmbilSaldo?.(dataFetchRole),
          window.api?.getSaldoAwal?.(),
          window.api?.getUsers?.()
        ])

      const transaksiList = asArray(transaksiRes.status === 'fulfilled' ? transaksiRes.value : [])
      const hutangList = asArray(hutangRes.status === 'fulfilled' ? hutangRes.value : [])
      const pindahList = asArray(pindahRes.status === 'fulfilled' ? pindahRes.value : [])
      const ambilList = asArray(ambilRes.status === 'fulfilled' ? ambilRes.value : [])
      const saldoListRaw = asArray(saldoRes.status === 'fulfilled' ? saldoRes.value : [])
      const userList = asArray(usersRes.status === 'fulfilled' ? usersRes.value : [])

      setRawData({
        transaksi: transaksiList,
        hutang: hutangList,
        pindah: pindahList,
        ambil: ambilList
      })
      setSaldoAwalOptions(saldoListRaw)
      setUsers(userList)

      const saldoById = new Map(
        saldoListRaw.map((item) => [Number(item.id), item.nama_sumber_dana])
      )
      const userById = new Map(
        userList.map((item) => [Number(item.id), item.nama || item.name || item.username || '-'])
      )

      const mergedRows = [
        ...transaksiList.map((item) => ({
          id: `transaksi-${item.id}`,
          sortDate: item.tanggal,
          tanggal: toDisplayDateTime(item.tanggal),
          tgl_bayar: '-',
          oleh: item.user_name || '-',
          jenis: normalizeJenisTransaksi(item.jenis_transaksi),
          jenis_transaksi: normalizeJenisTransaksi(item.jenis_transaksi),
          nominal: formatRupiah(item.nominal_transaksi),
          sumber_dana: item.sumber_dana || '-',
          tujuan_dana: item.terima_dana_nama || '-',
          deskripsi: item.keterangan || '-',
          is_marked_wrong: !!item.is_marked_wrong,
          marked_note: item.marked_note || '',
          marked_by: item.marked_by || '',
          marked_by_id: item.marked_by_id ?? null,
          marked_at: item.marked_at || null,
          is_verified: !!item.is_verified,
          verified_by: item.verified_by || '',
          verified_by_id: item.verified_by_id ?? null,
          verified_at: item.verified_at || null
        })),
        ...hutangList.map((item) => ({
          id: `hutang-${item.id}`,
          sortDate: item.tanggal_transaksi || item.tanggal,
          tanggal: toDisplayDateTime(item.tanggal_transaksi || item.tanggal),
          tgl_bayar: item.tanggal_bayar_hutang ? toDisplayDate(item.tanggal_bayar_hutang) : '-',
          oleh: userById.get(Number(item.petugas_id)) || item.user_name || item.petugas_name || '-',
          jenis: 'hutang',
          jenis_transaksi: 'hutang',
          nominal: formatRupiah(item.nominal_transaksi),
          sumber_dana: item.platform_name || item.platform || '-',
          tujuan_dana: '-',
          deskripsi: item.keterangan || '-',
          is_marked_wrong: !!item.is_marked_wrong,
          marked_note: item.marked_note || '',
          marked_by: item.marked_by || '',
          marked_by_id: item.marked_by_id ?? null,
          marked_at: item.marked_at || null,
          is_verified: !!item.is_verified,
          verified_by: item.verified_by || '',
          verified_by_id: item.verified_by_id ?? null,
          verified_at: item.verified_at || null
        })),
        ...pindahList.map((item) => ({
          id: `pindah-${item.id}`,
          sortDate: item.tanggal,
          tanggal: toDisplayDateTime(item.tanggal),
          tgl_bayar: '-',
          oleh: userById.get(Number(item.user_pemindah_id)) || item.user || '-',
          jenis: 'pindah saldo',
          jenis_transaksi: 'pindah saldo',
          nominal: formatRupiah(item.nominal),
          sumber_dana: saldoById.get(Number(item.sumber_dana_id)) || item.sumber_dana || '-',
          tujuan_dana: saldoById.get(Number(item.tujuan_dana_id)) || item.tujuan_dana || '-',
          deskripsi: item.keterangan || '-',
          is_marked_wrong: !!item.is_marked_wrong,
          marked_note: item.marked_note || '',
          marked_by: item.marked_by || '',
          marked_by_id: item.marked_by_id ?? null,
          marked_at: item.marked_at || null,
          is_verified: !!item.is_verified,
          verified_by: item.verified_by || '',
          verified_by_id: item.verified_by_id ?? null,
          verified_at: item.verified_at || null
        })),
        ...ambilList.map((item) => ({
          id: `ambil-${item.id}`,
          sortDate: item.tanggal_pengambilan,
          tanggal: toDisplayDateTime(item.tanggal_pengambilan),
          tgl_bayar: '-',
          oleh:
            userById.get(Number(item.petugas_pengambil_id)) ||
            item.user_name ||
            item.petugas_name ||
            '-',
          jenis: 'ambil saldo',
          jenis_transaksi: 'ambil saldo',
          nominal: formatRupiah(item.nominal_pengambilan),
          sumber_dana: item.platform || item.platform_name || '-',
          tujuan_dana: '-',
          deskripsi: item.keterangan || '-',
          is_marked_wrong: !!item.is_marked_wrong,
          marked_note: item.marked_note || '',
          marked_by: item.marked_by || '',
          marked_by_id: item.marked_by_id ?? null,
          marked_at: item.marked_at || null,
          is_verified: !!item.is_verified,
          verified_by: item.verified_by || '',
          verified_by_id: item.verified_by_id ?? null,
          verified_at: item.verified_at || null
        }))
      ].sort((a, b) => {
        // Baris yang belum dikoreksi (belum ditandai benar maupun salah)
        // selalu ditampilkan lebih dulu, lalu di dalam masing-masing
        // kelompok diurutkan dari data paling baru.
        const isUncorrected = (row) => !row.is_marked_wrong && !row.is_verified
        const aUncorrected = isUncorrected(a)
        const bUncorrected = isUncorrected(b)
        if (aUncorrected !== bUncorrected) return aUncorrected ? -1 : 1
        return dayjs(b.sortDate).valueOf() - dayjs(a.sortDate).valueOf()
      })

      setRows(mergedRows)
    } catch (error) {
      console.error('❌ Gagal memuat data:', error)
      setLoadError('Gagal memuat data.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!loggedInUser) return

    fetchAll()
  }, [loggedInUser])

  const totalRows = useMemo(() => rows.length, [rows.length])
  const summaryCards = useMemo(() => {
    const isTransaksi = (jenis) =>
      ['tarik tunai', 'transfer', 'jasa transfer', 'mode pulsa'].includes(jenis)
    const transaksiRows = rows.filter((row) =>
      isTransaksi((row.jenis_transaksi || row.jenis || '').toLowerCase())
    )
    const hutangRows = rows.filter((row) => (row.jenis_transaksi || row.jenis) === 'hutang')
    const mutasiSaldoRows = rows.filter((row) =>
      ['pindah saldo', 'ambil saldo'].includes(
        (row.jenis_transaksi || row.jenis || '').toLowerCase()
      )
    )

    return [
      {
        label: 'Total Data',
        value: rows.length,
        subtitle: 'Semua pencatatan gabungan',
        tone: 'from-slate-900 via-slate-800 to-slate-700'
      },
      {
        label: 'Transaksi',
        value: transaksiRows.length,
        subtitle: `Nominal ${formatRupiah(transaksiRows.reduce((sum, row) => sum + parseMoney(row.nominal), 0))}`,
        tone: 'from-blue-700 via-blue-600 to-cyan-500'
      },
      {
        label: 'Hutang',
        value: hutangRows.length,
        subtitle: `Nominal ${formatRupiah(hutangRows.reduce((sum, row) => sum + parseMoney(row.nominal), 0))}`,
        tone: 'from-amber-700 via-amber-600 to-orange-500'
      },
      {
        label: 'Mutasi Saldo',
        value: mutasiSaldoRows.length,
        subtitle: `Nominal ${formatRupiah(mutasiSaldoRows.reduce((sum, row) => sum + parseMoney(row.nominal), 0))}`,
        tone: 'from-emerald-700 via-emerald-600 to-teal-500'
      }
    ]
  }, [rows])

  // ═══════════════════════════════════════════════════════════
  // AMBIL SALDO — buka modal, ganti platform, currency input, submit
  // (persis logic HalamanAmbilSaldo.jsx)
  // ═══════════════════════════════════════════════════════════
  const openEditAmbilSaldo = (rawId) => {
    const itemToEdit = rawData.ambil.find((item) => item.id === rawId)
    if (!itemToEdit) return

    let formattedDate
    try {
      formattedDate = toInputDateTimeLocal(itemToEdit.tanggal_pengambilan)
    } catch (error) {
      formattedDate = getNowDateTimeLocalWIB()
    }

    setAmbilFormData({
      id: itemToEdit.id,
      petugas_pengambil_id: itemToEdit.petugas_pengambil_id,
      platform: itemToEdit.platform,
      saldo_platform: itemToEdit.saldo_platform?.toString() ?? '',
      nominal_pengambilan: formatRupiah(itemToEdit.nominal_pengambilan),
      biaya_admin: formatRupiah(itemToEdit.biaya_admin || 0),
      metode_pengambilan: itemToEdit.metode_pengambilan || '',
      tujuan_pengambilan: itemToEdit.tujuan_pengambilan || '',
      tanggal_pengambilan: formattedDate,
      keterangan: itemToEdit.keterangan || ''
    })

    const matchingSaldoAwal = saldoAwalOptions.find(
      (item) => item.nama_sumber_dana?.toLowerCase() === itemToEdit.platform?.toLowerCase()
    )
    setAmbilSelectedPlatform(matchingSaldoAwal || null)
    setAmbilModalOpen(true)
  }

  const handleAmbilPlatformChange = (selectedPlatformName) => {
    const selectedItem = saldoAwalOptions.find(
      (item) => item.nama_sumber_dana?.toLowerCase() === selectedPlatformName?.toLowerCase()
    )

    if (selectedItem) {
      setAmbilSelectedPlatform(selectedItem)
      setAmbilFormData((prev) => ({
        ...prev,
        platform: selectedItem.nama_sumber_dana,
        saldo_platform: selectedItem.saldo.toString(),
        biaya_admin: formatRupiah(selectedItem.biaya_admin)
      }))
    } else {
      setAmbilSelectedPlatform(null)
    }
  }

  const handleAmbilCurrencyInputChange = (e, fieldName) => {
    const numericValue = extractNumeric(e.target.value)
    setAmbilFormData((prev) => ({ ...prev, [fieldName]: formatRupiah(numericValue) }))
  }

  const handleSubmitEditAmbilSaldo = async () => {
    try {
      const formattedDate = toDbDateTime(ambilFormData.tanggal_pengambilan)
      const numericNominalPengambilan = extractNumeric(ambilFormData.nominal_pengambilan)
      const numericBiayaAdmin = extractNumeric(ambilFormData.biaya_admin)

      const updatedEntry = {
        id: ambilFormData.id,
        petugas_pengambil_id: parseInt(ambilFormData.petugas_pengambil_id) || 1,
        platform: ambilFormData.platform,
        saldo_platform: parseFloat(ambilFormData.saldo_platform) || 0,
        nominal_pengambilan: parseFloat(numericNominalPengambilan) || 0,
        biaya_admin: parseFloat(numericBiayaAdmin) || 0,
        metode_pengambilan: ambilFormData.metode_pengambilan,
        tujuan_pengambilan: ambilFormData.tujuan_pengambilan,
        tanggal_pengambilan: formattedDate,
        keterangan: ambilFormData.keterangan
      }

      await window.api.updateAmbilSaldo(updatedEntry)
      await fetchAll()
      setAmbilModalOpen(false)
      console.log('✅ Data ambil saldo berhasil diupdate')
    } catch (error) {
      console.error('❌ Gagal update data ambil saldo:', error)
      setAlertMessage('Gagal menyimpan perubahan data ambil saldo.')
      setShowAlertDialog(true)
    }
  }

  // ═══════════════════════════════════════════════════════════
  // HUTANG — buka modal, ganti platform, currency input, submit
  // (persis logic HalamanHutang.jsx)
  // ═══════════════════════════════════════════════════════════
  const openEditHutang = (rawId) => {
    const itemToEdit = rawData.hutang.find((item) => item.id === rawId)
    if (!itemToEdit) return

    let formattedDate
    try {
      formattedDate = toInputDateTimeLocal(itemToEdit.tanggal_transaksi)
    } catch (error) {
      formattedDate = getNowDateTimeLocalWIB()
    }

    setHutangFormData({
      id: itemToEdit.id,
      petugas_id: itemToEdit.petugas_id,
      platform_id: itemToEdit.platform_id,
      platform_name: itemToEdit.platform_name,
      saldo_platform: itemToEdit.saldo_platform?.toString() ?? '',
      nominal_transaksi: formatRupiah(itemToEdit.nominal_transaksi),
      jenis_transaksi: itemToEdit.jenis_transaksi || 'Ambil Hutang',
      biaya_admin: formatRupiah(itemToEdit.biaya_admin || 0),
      tanggal_transaksi: formattedDate,
      keterangan: itemToEdit.keterangan || ''
    })

    // Jika hutang sudah lunas, jenis transaksi dikunci ke "Bayar Hutang" (sama seperti HalamanHutang.jsx)
    setHutangIsEditingPaid(itemToEdit.status_bayar === 1)

    const match = saldoAwalOptions.find((item) => item.id === itemToEdit.platform_id)
    setHutangSelectedPlatform(match || null)
    setHutangModalOpen(true)
  }

  const handleSelectHutangPlatform = (eOrVal) => {
    const value = eOrVal?.target ? eOrVal.target.value : eOrVal
    const selected = saldoAwalOptions.find((p) => String(p.id) === String(value))
    setHutangFormData((prev) => ({
      ...prev,
      platform_id: value,
      platform_name: selected?.nama_sumber_dana || '',
      saldo_platform: selected?.saldo ?? prev.saldo_platform
    }))
    setHutangSelectedPlatform(selected || null)
  }

  const handleHutangCurrencyInputChange = (e, field) => {
    const numericValue = extractNumeric(e.target.value)
    setHutangFormData((prev) => ({ ...prev, [field]: formatRupiah(numericValue) }))
  }

  const handleSubmitEditHutang = async () => {
    try {
      const formattedDate = dayjs(hutangFormData.tanggal_transaksi)
        .tz('Asia/Jakarta')
        .format('YYYY-MM-DD HH:mm:ss')

      const updatedEntry = {
        id: hutangFormData.id,
        petugas_id: parseInt(hutangFormData.petugas_id) || 1,
        platform_id: hutangFormData.platform_id,
        saldo_platform: parseFloat(hutangFormData.saldo_platform) || 0,
        nominal_transaksi: parseFloat(extractNumeric(hutangFormData.nominal_transaksi)) || 0,
        // Jika sedang edit data yang sudah lunas, paksa 'Bayar Hutang' agar selaras dengan logic delta di backend
        jenis_transaksi: hutangIsEditingPaid ? 'Bayar Hutang' : hutangFormData.jenis_transaksi,
        biaya_admin: parseFloat(extractNumeric(hutangFormData.biaya_admin) || 0),
        tanggal_transaksi: formattedDate,
        keterangan: hutangFormData.keterangan,
        role: userRole
      }

      await window.api.updateHutang(updatedEntry)
      await fetchAll()
      setHutangModalOpen(false)
      console.log('✅ Data hutang berhasil diupdate')
    } catch (error) {
      console.error('❌ Gagal update data hutang:', error)
      setAlertMessage('Gagal menyimpan perubahan data hutang.')
      setShowAlertDialog(true)
    }
  }

  // ═══════════════════════════════════════════════════════════
  // PINDAH SALDO — buka modal, ganti platform sumber/tujuan, submit
  // (persis logic HalamanPindahSaldo.jsx)
  // ═══════════════════════════════════════════════════════════
  const openEditPindahSaldo = (rawId) => {
    const itemToEdit = rawData.pindah.find((item) => item.id === rawId)
    if (!itemToEdit) return

    const sourceSaldo = saldoAwalOptions.find((s) => s.id === itemToEdit.sumber_dana_id)
    const destSaldo = saldoAwalOptions.find((s) => s.id === itemToEdit.tujuan_dana_id)
    const petugas = users.find((u) => u.id === itemToEdit.user_pemindah_id)

    const platformSource = itemToEdit.platform ? itemToEdit.platform.split('>')[0]?.trim() : ''
    const platformDestination = itemToEdit.platform ? itemToEdit.platform.split('>')[1]?.trim() : ''

    let formattedDate
    try {
      formattedDate = toInputDateTimeLocal(itemToEdit.tanggal)
    } catch (error) {
      formattedDate = getNowDateTimeLocalWIB()
    }

    setPindahFormData({
      id: itemToEdit.id,
      user: petugas?.nama || petugas?.username || '-',
      userId: itemToEdit.user_pemindah_id,
      tanggal: formattedDate,
      platformSource,
      platformDestination,
      senderBalanceId: itemToEdit.sumber_dana_id,
      receiverBalanceId: itemToEdit.tujuan_dana_id,
      amount: formatInputRupiah(String(itemToEdit.nominal || 0)),
      operational: formatInputRupiah(String(itemToEdit.biaya_admin || 0)),
      description: itemToEdit.keterangan || ''
    })

    setPindahPlatformSourceOptions(platformSource)
    setPindahPlatformDestinationOptions(platformDestination)
    setPindahSelectedSourceSaldo(sourceSaldo || null)
    setPindahSelectedDestSaldo(destSaldo || null)
    setPindahModalOpen(true)
  }

  const handlePindahSourceChange = (value) => {
    setPindahPlatformSourceOptions(value)
    if (value) {
      const matchingSaldo = saldoAwalOptions.find(
        (s) => s.nama_sumber_dana && s.nama_sumber_dana.toLowerCase().includes(value.toLowerCase())
      )
      if (matchingSaldo) {
        setPindahSelectedSourceSaldo(matchingSaldo)
        setPindahFormData((prev) => ({ ...prev, senderBalanceId: matchingSaldo.id }))
      }
    } else {
      setPindahSelectedSourceSaldo(null)
      setPindahFormData((prev) => ({ ...prev, senderBalanceId: null }))
    }
  }

  const handlePindahDestChange = (value) => {
    setPindahPlatformDestinationOptions(value)
    if (value) {
      const matchingSaldo = saldoAwalOptions.find(
        (s) => s.nama_sumber_dana && s.nama_sumber_dana.toLowerCase().includes(value.toLowerCase())
      )
      if (matchingSaldo) {
        setPindahSelectedDestSaldo(matchingSaldo)
        setPindahFormData((prev) => ({ ...prev, receiverBalanceId: matchingSaldo.id }))
      }
    } else {
      setPindahSelectedDestSaldo(null)
      setPindahFormData((prev) => ({ ...prev, receiverBalanceId: null }))
    }
  }

  const handleSubmitEditPindahSaldo = async () => {
    try {
      const cleanedAmount = parseInt(String(pindahFormData.amount).replace(/[^0-9]/g, ''), 10)
      const cleanedOperational = parseInt(
        String(pindahFormData.operational).replace(/[^0-9]/g, ''),
        10
      )
      const id = pindahFormData.id

      if (!id) {
        setAlertMessage('Error: Tidak dapat mengupdate data - ID tidak ditemukan')
        setShowAlertDialog(true)
        return
      }

      if (!pindahSelectedSourceSaldo || !pindahSelectedDestSaldo) {
        setAlertMessage('Sumber dana atau tujuan dana tidak dipilih')
        setShowAlertDialog(true)
        return
      }

      // Ambil saldo terbaru langsung dari server sebelum validasi & submit
      const latestSaldoData = await window.api.getSaldoAwal()
      const latestSourceSaldo = latestSaldoData.find((s) => s.id === pindahSelectedSourceSaldo.id)
      const latestDestSaldo = latestSaldoData.find((s) => s.id === pindahSelectedDestSaldo.id)

      if (!latestSourceSaldo || !latestDestSaldo) {
        setAlertMessage('Gagal mendapatkan data saldo terbaru')
        setShowAlertDialog(true)
        return
      }

      const originalTransfer = rawData.pindah.find((t) => t.id === id)
      if (originalTransfer) {
        const originalTotal =
          Number(originalTransfer.nominal || 0) + Number(originalTransfer.biaya_admin || 0)
        const newTotal = cleanedAmount + cleanedOperational

        if (newTotal > originalTotal && latestSourceSaldo.saldo + originalTotal < newTotal) {
          setAlertMessage(
            `Saldo ${latestSourceSaldo.nama_sumber_dana} tidak mencukupi untuk menambah nominal transfer.`
          )
          setShowAlertDialog(true)
          return
        }
      } else if (latestSourceSaldo.saldo < cleanedAmount + cleanedOperational) {
        setAlertMessage(
          `Saldo ${latestSourceSaldo.nama_sumber_dana} tidak mencukupi untuk transfer.`
        )
        setShowAlertDialog(true)
        return
      }

      const platformString = `${pindahPlatformSourceOptions} > ${pindahPlatformDestinationOptions}`

      const transferData = {
        id,
        sumber_dana_id: pindahSelectedSourceSaldo.id,
        tujuan_dana_id: pindahSelectedDestSaldo.id,
        user_pemindah_id: pindahFormData.userId || (loggedInUser ? loggedInUser.id : 1),
        nominal: cleanedAmount,
        platform: platformString,
        biaya_admin: cleanedOperational || 0,
        saldo_sumber: latestSourceSaldo.saldo,
        saldo_tujuan: latestDestSaldo.saldo,
        keterangan: pindahFormData.description,
        tanggal: toDbDateTime(pindahFormData.tanggal) || getTodayWIB(),
        role: userRole
      }

      await window.api.updatePindahSaldo(transferData)
      await fetchAll()
      console.log('✅ Data pindah saldo berhasil diupdate')
    } catch (error) {
      console.error('❌ Gagal update data pindah saldo:', error)
      setAlertMessage(`Error updating transfer: ${error.message || 'Unknown error'}`)
      setShowAlertDialog(true)
    } finally {
      setPindahSelectedSourceSaldo(null)
      setPindahSelectedDestSaldo(null)
      setPindahModalOpen(false)
    }
  }

  // ═══════════════════════════════════════════════════════════
  // TRANSAKSI — buka form edit (reuse FormLayout), submit
  // (persis logic handleTransactionEdit & handleEditSubmit di HalamanTransaksi.jsx)
  // ═══════════════════════════════════════════════════════════
  const openEditTransaksi = (rawId) => {
    const rawItem = rawData.transaksi.find((item) => item.id === rawId)
    if (!rawItem) return

    // Bangun ulang versi terformat (sama seperti item di state `transactions` HalamanTransaksi.jsx)
    const formattedItem = buildFormattedTransaksiItem(rawItem, saldoAwalOptions)

    // Lalu konversi balik ke angka mentah — persis cleanedData di handleTransactionEdit()
    const cleanedData = {
      ...formattedItem,
      saldo_awal: parseRupiah(formattedItem.saldo_awal),
      nominal_transaksi: parseRupiah(formattedItem.nominal_transaksi),
      fee: parseRupiah(formattedItem.fee),
      biaya_admin: parseRupiah(formattedItem.biaya_admin),
      saldo_akhir: parseRupiah(formattedItem.saldo_akhir),
      metode_pembayaran: formattedItem.metode_pembayaran || ''
    }

    setTransaksiEditData(cleanedData)
    setShowTransaksiEditModal(true)
  }

  const handleSubmitEditTransaksi = async (updatedData) => {
    try {
      const payload = {
        id: transaksiEditData.id,
        data: { ...updatedData, tanggal: toDbDateTime(updatedData.tanggal) }
      }

      await window.api.editTransaksi(payload)
      await fetchAll()

      setShowTransaksiEditModal(false)
      setTransaksiEditData(null)
      console.log('✅ Data transaksi berhasil diupdate')
    } catch (error) {
      console.error('❌ Gagal mengedit transaksi:', error)
      setAlertMessage('Gagal menyimpan perubahan data transaksi.')
      setShowAlertDialog(true)
    }
  }

  const handleTransaksiEditClose = () => {
    setShowTransaksiEditModal(false)
    setTransaksiEditData(null)
  }

  // ─────────────────────────────────────────────────────────
  // EDIT (router): cek kategori dari prefix id → arahkan ke handler yang sesuai
  // ─────────────────────────────────────────────────────────
  const handleEdit = (compositeId) => {
    if (!loggedInUser) {
      setAlertMessage('Pengguna tidak terdeteksi.')
      setShowAlertDialog(true)
      return
    }

    const category = getRowCategory(compositeId)
    const rawId = getRawId(compositeId)
    if (!category || rawId === null) return

    switch (category) {
      case 'ambil':
        openEditAmbilSaldo(rawId)
        break
      case 'hutang':
        openEditHutang(rawId)
        break
      case 'pindah':
        openEditPindahSaldo(rawId)
        break
      case 'transaksi':
        openEditTransaksi(rawId)
        break

      default:
        return
    }
  }

  // ─────────────────────────────────────────────────────────
  // DELETE (router): cek kategori dari prefix id → panggil API sesuai kategori
  // ─────────────────────────────────────────────────────────
  const handleDelete = (compositeId) => {
    if (!loggedInUser || loggedInUser.role?.toLowerCase() !== 'admin') {
      setAlertMessage('Maaf, hanya admin yang dapat menghapus data.')
      setShowAlertDialog(true)
      return
    }

    const category = getRowCategory(compositeId)
    const rawId = getRawId(compositeId)
    if (!category || rawId === null) return

    const messages = {
      ambil: 'Apakah Anda yakin ingin menghapus data pengambilan saldo ini?',
      hutang: 'Apakah Anda yakin ingin menghapus transaksi hutang ini?',
      pindah: 'Apakah Anda yakin ingin menghapus data pemindahan saldo ini?',
      transaksi: 'Apakah Anda yakin ingin menghapus transaksi ini?'
    }

    setConfirmMessage(messages[category] || 'Apakah Anda yakin ingin menghapus data ini?')
    setDeleteTarget({ category, rawId })
    setShowConfirmDialog(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    const { category, rawId } = deleteTarget

    try {
      switch (category) {
        case 'ambil':
          await window.api.deleteAmbilSaldo(rawId)
          break
        case 'hutang':
          await window.api.deleteHutang(rawId)
          break
        case 'pindah':
          await window.api.deletePindahSaldo(rawId)
          break
        case 'transaksi':
          await window.api.deleteTransaksi(rawId)
          break

        default:
          return
      }

      await fetchAll()
      console.log(`✅ Data ${category} berhasil dihapus`)
    } catch (error) {
      console.error('❌ Error saat menghapus data:', error)
      setAlertMessage('Gagal menghapus data.')
      setShowAlertDialog(true)
    } finally {
      setShowConfirmDialog(false)
      setDeleteTarget(null)
    }
  }

  // ─────────────────────────────────────────────────────────
  // TANDAI SALAH (router): buka modal input keterangan jika belum
  // ditandai, atau tampilkan info penandaan jika sudah ditandai.
  // ─────────────────────────────────────────────────────────
  const handleToggleMarkSalah = (compositeId) => {
    if (!loggedInUser) {
      setAlertMessage('Pengguna tidak terdeteksi.')
      setShowAlertDialog(true)
      return
    }

    const category = getRowCategory(compositeId)
    const rawId = getRawId(compositeId)
    if (!category || rawId === null) return

    const row = rows.find((r) => r.id === compositeId)
    if (!row) return

    if (row.is_marked_wrong) {
      setMarkInfoData({
        keterangan: row.marked_note || '-',
        oleh: row.marked_by || '-',
        olehId: row.marked_by_id ?? null,
        pada: row.marked_at ? toDisplayDateTime(row.marked_at) : '-',
        table: categoryToTable[category],
        id: rawId
      })
      setMarkInfoOpen(true)
      return
    }

    setMarkTarget({ table: categoryToTable[category], id: rawId })
    setMarkNote('')
    setMarkNoteError(false)
    setMarkModalOpen(true)
  }

  // Proses submit sebenarnya: validasi sinkron dulu (supaya Modal tahu boleh
  // nutup diri atau tidak lewat return value), lalu proses API di background.
  const submitMarkSalah = () => {
    if (!markTarget) return false

    if (!markNote.trim()) {
      setMarkNoteError(true)
      return false // Modal.jsx membaca `false` ini untuk TIDAK menutup diri
    }

    const { table, id } = markTarget
    const keterangan = markNote.trim()
    const user_name = loggedInUser?.nama || loggedInUser?.username || '-'
    const user_id = loggedInUser?.id ?? null

    ;(async () => {
      try {
        await window.api.markSalah({ table, id, keterangan, user_name, user_id })
        await fetchAll()
        console.log('✅ Data berhasil ditandai salah')
      } catch (error) {
        console.error('❌ Gagal menandai data salah:', error)
        setAlertMessage('Gagal menandai data sebagai salah.')
        setShowAlertDialog(true)
      }
    })()

    return true
  }

  // Dipanggil oleh Modal.jsx saat tombol "Simpan" diklik (form submit)
  const handleSubmitMarkSalah = () => submitMarkSalah()

  // Dipanggil manual saat user tekan Enter di textarea (di luar form submit Modal)
  const handleEnterSubmitMarkSalah = () => {
    const ok = submitMarkSalah()
    if (ok) {
      setMarkModalOpen(false)
      setMarkTarget(null)
      setMarkNote('')
      setMarkNoteError(false)
    }
  }

  // Hanya admin atau orang yang menandai sendiri yang boleh membatalkan tanda salah
  const canUnmarkSalah =
    markInfoData &&
    (isAdmin || (loggedInUser && markInfoData.olehId != null && Number(loggedInUser.id) === Number(markInfoData.olehId)))

  // Konfirmasi unmark pakai ConfirmDialog kustom, BUKAN window.confirm() bawaan
  // browser — window.confirm() bikin Electron kehilangan fokus keyboard sampai
  // window di-alt+tab, sehingga textarea jadi tidak bisa diketik setelahnya.
  const handleUnmarkSalah = () => {
    if (!markInfoData) return
    setShowUnmarkConfirm(true)
  }

  const confirmUnmarkSalah = async () => {
    if (!markInfoData) return

    try {
      await window.api.unmarkSalah({ table: markInfoData.table, id: markInfoData.id })
      await fetchAll()
      setMarkInfoOpen(false)
      setMarkInfoData(null)
      console.log('✅ Tandai salah dibatalkan')
    } catch (error) {
      console.error('❌ Gagal membatalkan tandai salah:', error)
      setAlertMessage('Gagal membatalkan tandai salah.')
      setShowAlertDialog(true)
    } finally {
      setShowUnmarkConfirm(false)
    }
  }

  // ─────────────────────────────────────────────────────────
  // TANDAI BENAR/SESUAI (router): tampilkan konfirmasi jika belum
  // diverifikasi, atau tampilkan info verifikasi jika sudah.
  // ─────────────────────────────────────────────────────────
  const handleToggleVerified = (compositeId) => {
    if (!loggedInUser) {
      setAlertMessage('Pengguna tidak terdeteksi.')
      setShowAlertDialog(true)
      return
    }

    const category = getRowCategory(compositeId)
    const rawId = getRawId(compositeId)
    if (!category || rawId === null) return

    const row = rows.find((r) => r.id === compositeId)
    if (!row) return

    if (row.is_marked_wrong) {
      setAlertMessage('Data ini sudah ditandai salah. Batalkan tanda salah terlebih dahulu jika ingin menandainya benar/sesuai.')
      setShowAlertDialog(true)
      return
    }

    if (row.is_verified) {
      setVerifyInfoData({
        oleh: row.verified_by || '-',
        olehId: row.verified_by_id ?? null,
        pada: row.verified_at ? toDisplayDateTime(row.verified_at) : '-',
        table: categoryToTable[category],
        id: rawId
      })
      setVerifyInfoOpen(true)
      return
    }

    setVerifyTarget({ table: categoryToTable[category], id: rawId })
    setShowVerifyConfirm(true)
  }

  const confirmVerify = async () => {
    if (!verifyTarget) return
    const { table, id } = verifyTarget
    const user_name = loggedInUser?.nama || loggedInUser?.username || '-'
    const user_id = loggedInUser?.id ?? null

    try {
      await window.api.markBenar({ table, id, user_name, user_id })
      await fetchAll()
      console.log('✅ Data berhasil ditandai benar/sesuai')
    } catch (error) {
      console.error('❌ Gagal menandai data benar/sesuai:', error)
      setAlertMessage('Gagal menandai data sebagai benar/sesuai.')
      setShowAlertDialog(true)
    } finally {
      setShowVerifyConfirm(false)
      setVerifyTarget(null)
    }
  }

  // Hanya admin atau orang yang memverifikasi sendiri yang boleh membatalkan verifikasi
  const canUnverify =
    verifyInfoData &&
    (isAdmin || (loggedInUser && verifyInfoData.olehId != null && Number(loggedInUser.id) === Number(verifyInfoData.olehId)))

  const handleUnverify = () => {
    if (!verifyInfoData) return
    setShowUnverifyConfirm(true)
  }

  const confirmUnverify = async () => {
    if (!verifyInfoData) return

    try {
      await window.api.unmarkBenar({ table: verifyInfoData.table, id: verifyInfoData.id })
      await fetchAll()
      setVerifyInfoOpen(false)
      setVerifyInfoData(null)
      console.log('✅ Tandai benar/sesuai dibatalkan')
    } catch (error) {
      console.error('❌ Gagal membatalkan tandai benar/sesuai:', error)
      setAlertMessage('Gagal membatalkan tandai benar/sesuai.')
      setShowAlertDialog(true)
    } finally {
      setShowUnverifyConfirm(false)
    }
  }

  return (
    <PageContainer title="Koreksi Transaksi">
      <div className="px-4 pb-6">
        <div className="mb-4">
          <p className="text-sm text-gray-500">
            Koreksi dan tandai kesalahan pada informasi transaksi, hutang, pindah saldo, dan ambil
            saldo.
          </p>
        </div>

        <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div
              key={card.label}
              className={`rounded-2xl bg-gradient-to-br ${card.tone} p-4 text-white shadow-md`}
            >
              <div className="text-sm/5 opacity-80">{card.label}</div>
              <div className="mt-2 text-2xl font-semibold">{card.value}</div>
              <div className="mt-1 text-xs opacity-80">{card.subtitle}</div>
            </div>
          ))}
        </div>

        {loadError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        )}

        {isLoading ? (
          <div className="rounded-lg border bg-white px-4 py-10 text-center text-gray-600">
            Memuat data...
          </div>
        ) : (
          <TableContent
            data={rows}
            columns={[
              { key: 'tanggal', label: 'Tanggal' },
              { key: 'tgl_bayar', label: 'Tgl Bayar' },
              { key: 'oleh', label: 'Oleh' },
              { key: 'jenis', label: 'Jenis' },
              { key: 'nominal', label: 'Nominal' },
              { key: 'sumber_dana', label: 'Sumber Dana' },
              { key: 'tujuan_dana', label: 'Tujuan Dana' }
            ]}
            onEdit={isAdmin ? handleEdit : null}
            onDelete={isAdmin ? handleDelete : null}
            onMark={handleToggleMarkSalah}
            onVerify={handleToggleVerified}
            info={`Total data: ${totalRows}`}
            btnSize="xs"
            userRole={userRole}
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            editDelete={isAdmin ? true : false}
            marked={true}
            showDateFilter
            showSumberDanaFilter
            showJenisTransaksiFilter
            showKoreksiFilter
          />
        )}
      </div>

      {/* ── Modal Edit Ambil Saldo ── */}
      <ModalEdit
        isOpen={ambilModalOpen}
        onClose={() => setAmbilModalOpen(false)}
        onSubmit={handleSubmitEditAmbilSaldo}
        title="Edit Data Pengambilan Saldo"
      >
        <div className="col-span-2 mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Petugas Pengambil
          </label>
          <div className="p-2 bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 border rounded-md">
            {(() => {
              const petugas = users.find((u) => u.id === ambilFormData.petugas_pengambil_id)
              if (petugas) return petugas.nama || petugas.username || 'ID: ' + petugas.id
              if (loggedInUser && loggedInUser.id === ambilFormData.petugas_pengambil_id) {
                return loggedInUser.nama || loggedInUser.username || 'ID: ' + loggedInUser.id
              }
              return 'ID: ' + ambilFormData.petugas_pengambil_id
            })()}
          </div>
          <input
            type="hidden"
            name="petugas_pengambil_id"
            value={ambilFormData.petugas_pengambil_id}
          />
        </div>

        <InputField
          name="tanggal_pengambilan"
          type="datetime-local"
          value={ambilFormData.tanggal_pengambilan || getNowDateTimeLocalWIB()}
          onChange={(e) =>
            setAmbilFormData((prev) => ({ ...prev, tanggal_pengambilan: e.target.value }))
          }
        >
          Tanggal & Jam Pengambilan
        </InputField>

        <div className="col-span-2 mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Platform/Sumber Dana
          </label>
          <select
            className="w-full p-2 border rounded-md border-gray-300 bg-white text-gray-800 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-blue-500 focus:border-blue-500"
            value={ambilFormData.platform}
            onChange={(e) => handleAmbilPlatformChange(e.target.value)}
            disabled={saldoAwalOptions.length === 0}
          >
            <option value="">-- Pilih Sumber Dana --</option>
            {saldoAwalOptions.map((item) => (
              <option key={item.id} value={item.nama_sumber_dana}>
                {item.nama_sumber_dana}
              </option>
            ))}
          </select>
        </div>

        {ambilSelectedPlatform ? (
          <div className="col-span-2 mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Saldo Platform
            </label>
            <div className="p-2 bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 border rounded-md">
              {formatRupiah(ambilFormData.saldo_platform)}
            </div>
          </div>
        ) : (
          <InputField
            name="saldo_platform"
            type="number"
            value={ambilFormData.saldo_platform || ''}
            onChange={(e) =>
              setAmbilFormData((prev) => ({ ...prev, saldo_platform: e.target.value }))
            }
          >
            Saldo Platform
          </InputField>
        )}

        <InputField
          name="nominal_pengambilan"
          type="text"
          value={ambilFormData.nominal_pengambilan || ''}
          onChange={(e) => handleAmbilCurrencyInputChange(e, 'nominal_pengambilan')}
          placeholder="Rp 0"
        >
          Nominal Pengambilan
        </InputField>

        <InputField
          name="biaya_admin"
          required={false}
          type="text"
          value={ambilFormData.biaya_admin || ''}
          onChange={(e) => handleAmbilCurrencyInputChange(e, 'biaya_admin')}
          placeholder="Rp 0"
          className={ambilSelectedPlatform ? 'border-yellow-500' : ''}
        >
          Biaya Admin{' '}
          {ambilSelectedPlatform && (
            <span className="text-xs text-yellow-600">(dari platform, dapat diedit)</span>
          )}
        </InputField>

        <InputField
          name="metode_pengambilan"
          value={ambilFormData.metode_pengambilan || ''}
          onChange={(e) =>
            setAmbilFormData((prev) => ({ ...prev, metode_pengambilan: e.target.value }))
          }
        >
          Metode Pengambilan
        </InputField>

        <InputField
          name="tujuan_pengambilan"
          value={ambilFormData.tujuan_pengambilan || ''}
          onChange={(e) =>
            setAmbilFormData((prev) => ({ ...prev, tujuan_pengambilan: e.target.value }))
          }
        >
          Tujuan Pengambilan
        </InputField>

        <InputField
          name="keterangan"
          value={ambilFormData.keterangan || ''}
          required={false}
          onChange={(e) => setAmbilFormData((prev) => ({ ...prev, keterangan: e.target.value }))}
        >
          Keterangan
        </InputField>
      </ModalEdit>

      {/* ── Modal Edit Hutang ── */}
      <ModalEdit
        isOpen={hutangModalOpen}
        onClose={() => setHutangModalOpen(false)}
        onSubmit={handleSubmitEditHutang}
        title="Edit Data Hutang"
      >
        <div className="col-span-2 mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Petugas
          </label>
          <div className="p-2 bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 border rounded-md">
            {(() => {
              const petugas = users.find((u) => u.id === hutangFormData.petugas_id)
              if (petugas) return petugas.nama || petugas.username || 'ID: ' + petugas.id
              if (loggedInUser && loggedInUser.id === hutangFormData.petugas_id) {
                return loggedInUser.nama || loggedInUser.username || 'ID: ' + loggedInUser.id
              }
              return 'ID: ' + hutangFormData.petugas_id
            })()}
          </div>
        </div>

        <InputField
          name="tanggal_transaksi"
          type="datetime-local"
          value={hutangFormData.tanggal_transaksi || getNowDateTimeLocalWIB()}
          onChange={(e) =>
            setHutangFormData((prev) => ({ ...prev, tanggal_transaksi: e.target.value }))
          }
        >
          Tanggal & Jam Transaksi
        </InputField>

        <SelectItems
          options={saldoAwalOptions.map((item) => ({
            label: item.nama_sumber_dana,
            value: item.id
          }))}
          label="Platform/Sumber Dana"
          name="platform_id"
          value={hutangFormData.platform_id || ''}
          onChange={handleSelectHutangPlatform}
          required
        />

        <div className="col-span-2 mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Saldo Platform Saat Ini
          </label>
          <div className="p-2 bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 border rounded-md">
            {formatRupiah(hutangFormData.saldo_platform)}
          </div>
        </div>

        <div className="col-span-2 mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Jenis Transaksi
          </label>
          <div className="flex gap-4">
            {hutangIsEditingPaid ? (
              <label className="inline-flex items-center text-gray-700 dark:text-gray-300">
                <input
                  type="radio"
                  name="jenis_transaksi"
                  value="Bayar Hutang"
                  checked
                  readOnly
                  className="form-radio h-4 w-4 text-blue-600"
                />
                <span className="ml-2">Bayar Hutang</span>
              </label>
            ) : (
              <>
                <label className="inline-flex items-center text-gray-700 dark:text-gray-300">
                  <input
                    type="radio"
                    name="jenis_transaksi"
                    value="Ambil Hutang"
                    checked={hutangFormData.jenis_transaksi?.toLowerCase() === 'ambil hutang'}
                    onChange={(e) =>
                      setHutangFormData((prev) => ({ ...prev, jenis_transaksi: e.target.value }))
                    }
                    className="form-radio h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Ambil Hutang</span>
                </label>
                <label className="inline-flex items-center text-gray-700 dark:text-gray-300">
                  <input
                    type="radio"
                    name="jenis_transaksi"
                    value="Bayar Hutang"
                    checked={hutangFormData.jenis_transaksi?.toLowerCase() === 'bayar hutang'}
                    onChange={(e) =>
                      setHutangFormData((prev) => ({ ...prev, jenis_transaksi: e.target.value }))
                    }
                    className="form-radio h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Bayar Hutang</span>
                </label>
              </>
            )}
          </div>
        </div>

        <InputField
          name="nominal_transaksi"
          type="text"
          value={hutangFormData.nominal_transaksi}
          onChange={(e) => handleHutangCurrencyInputChange(e, 'nominal_transaksi')}
          placeholder="Rp 0"
        >
          Nominal Transaksi
        </InputField>

        <InputField
          name="biaya_admin"
          type="text"
          value={hutangFormData.biaya_admin}
          onChange={(e) => handleHutangCurrencyInputChange(e, 'biaya_admin')}
          placeholder="Rp 0"
          required={false}
        >
          Biaya Admin
        </InputField>

        <InputField
          name="keterangan"
          type="text"
          className="col-span-2"
          value={hutangFormData.keterangan}
          onChange={(e) => setHutangFormData((prev) => ({ ...prev, keterangan: e.target.value }))}
          placeholder="Tambahan informasi transaksi hutang"
          required={false}
        >
          Keterangan
        </InputField>
      </ModalEdit>

      {/* ── Modal Edit Pindah Saldo ── */}
      <ModalEdit
        isOpen={pindahModalOpen}
        onClose={() => setPindahModalOpen(false)}
        onSubmit={handleSubmitEditPindahSaldo}
        title="Edit Data Pemindahan Saldo"
      >
        <div className="col-span-2 mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            User Pemindah
          </label>
          <div className="p-2 border rounded-md bg-gray-100 border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
            {pindahFormData.user ||
              (loggedInUser
                ? loggedInUser.username || loggedInUser.nama || 'User ID: ' + loggedInUser.id
                : 'Loading...')}
          </div>
          <input
            type="hidden"
            name="userId"
            value={pindahFormData.userId || (loggedInUser ? loggedInUser.id : 1)}
          />
        </div>

        <InputField
          name="tanggal"
          type="datetime-local"
          value={pindahFormData.tanggal || getNowDateTimeLocalWIB()}
          onChange={(e) => setPindahFormData((prev) => ({ ...prev, tanggal: e.target.value }))}
        >
          Tanggal & Jam
        </InputField>

        <div className="col-span-2 flex gap-4 mb-4">
          <div className="flex-1">
            <SelectItems
              onChange={(e) => handlePindahSourceChange(e.target.value)}
              name="platformSource"
              label="Platform Sumber"
              value={pindahPlatformSourceOptions}
              options={getPlatformOptions(saldoAwalOptions)}
            />
          </div>
          <div className="flex-1">
            <SelectItems
              onChange={(e) => handlePindahDestChange(e.target.value)}
              name="platformDestination"
              label="Platform Penerima"
              value={pindahPlatformDestinationOptions}
              options={getPlatformOptions(saldoAwalOptions)}
            />
          </div>
        </div>

        <div className="col-span-2 flex gap-4 mb-4">
          <div className="flex-1">
            <InputField
              name="senderBalance"
              type="text"
              value={
                pindahSelectedSourceSaldo ? formatRupiah(pindahSelectedSourceSaldo.saldo) : '-'
              }
              onChange={() => {}}
              disabled={true}
              className={pindahSelectedSourceSaldo?.saldo === 0 ? 'text-red-500' : ''}
            >
              Saldo Pengirim
            </InputField>
          </div>
          <div className="flex-1">
            <InputField
              name="receiverBalance"
              type="text"
              value={pindahSelectedDestSaldo ? formatRupiah(pindahSelectedDestSaldo.saldo) : '-'}
              onChange={() => {}}
              disabled={true}
              className={pindahSelectedDestSaldo?.saldo === 0 ? 'text-red-500' : ''}
            >
              Saldo Penerima
            </InputField>
          </div>
        </div>

        <InputField
          name="amount"
          value={pindahFormData.amount || ''}
          onChange={(e) =>
            setPindahFormData((prev) => ({ ...prev, amount: formatInputRupiah(e.target.value) }))
          }
        >
          Nominal
        </InputField>

        <InputField
          name="operational"
          value={pindahFormData.operational || ''}
          onChange={(e) =>
            setPindahFormData((prev) => ({
              ...prev,
              operational: formatInputRupiah(e.target.value)
            }))
          }
        >
          Operasional
        </InputField>

        <InputField
          name="description"
          value={pindahFormData.description || ''}
          onChange={(e) => setPindahFormData((prev) => ({ ...prev, description: e.target.value }))}
          required={false}
          className="col-span-2"
        >
          Keterangan
        </InputField>
      </ModalEdit>

      {/* ── Form Edit Transaksi — reuse komponen FormLayout yang sama dengan HalamanTransaksi.jsx ── */}
      {showTransaksiEditModal && transaksiEditData && (
        <TransactionFormLayout
          onSubmit={handleSubmitEditTransaksi}
          onClose={handleTransaksiEditClose}
          formType="transaction"
          isEdit={true}
          editData={transaksiEditData}
          onValidChange={() => {}}
        />
      )}

      {/* ── Konfirmasi Delete (semua kategori) ── */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => {
          setShowConfirmDialog(false)
          setDeleteTarget(null)
        }}
        onConfirm={confirmDelete}
        title="Konfirmasi Hapus"
        message={confirmMessage}
      />

      <AlertDialog
        isOpen={showAlertDialog}
        onClose={() => setShowAlertDialog(false)}
        title="Informasi"
        message={alertMessage}
      />

      {/* ── Modal Input Keterangan: Tandai Salah ── */}
      <ModalEdit
        isOpen={markModalOpen}
        onClose={() => {
          setMarkModalOpen(false)
          setMarkTarget(null)
          setMarkNote('')
          setMarkNoteError(false)
        }}
        onSubmit={handleSubmitMarkSalah}
        title="Tandai Data Salah"
      >
        <div className="col-span-2 mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700">
            Keterangan Kesalahan
          </label>
          <textarea
            className={`w-full p-2 border rounded-md bg-white text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              markNoteError ? 'border-red-400' : 'border-gray-300'
            }`}
            rows={3}
            value={markNote}
            onChange={(e) => {
              setMarkNote(e.target.value)
              if (markNoteError) setMarkNoteError(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleEnterSubmitMarkSalah()
              }
            }}
            placeholder="Contoh: nominal salah input, harusnya Rp50.000"
            autoFocus
          />
          {markNoteError && (
            <p className="mt-1 text-xs text-red-500">Keterangan kesalahan wajib diisi.</p>
          )}
        </div>
      </ModalEdit>

      {/* ── Info Penandaan Kesalahan ── */}
      {markInfoOpen && markInfoData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Detail Penandaan Kesalahan
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs font-medium text-gray-500 mb-0.5">Keterangan</div>
                <div className="text-gray-800 whitespace-pre-wrap">{markInfoData.keterangan}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 mb-0.5">Ditandai oleh</div>
                <div className="text-gray-800">{markInfoData.oleh}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 mb-0.5">Ditandai pada</div>
                <div className="text-gray-800">{markInfoData.pada}</div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              {canUnmarkSalah && (
                <button
                  type="button"
                  onClick={handleUnmarkSalah}
                  className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700"
                >
                  Batalkan Tanda Salah
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setMarkInfoOpen(false)
                  setMarkInfoData(null)
                }}
                className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Konfirmasi Batalkan Tanda Salah ── */}
      <ConfirmDialog
        isOpen={showUnmarkConfirm}
        onClose={() => setShowUnmarkConfirm(false)}
        onConfirm={confirmUnmarkSalah}
        title="Konfirmasi"
        message="Yakin ingin membatalkan tandai salah pada data ini?"
      />

      {/* ── Konfirmasi Tandai Benar/Sesuai ── */}
      <ConfirmDialog
        isOpen={showVerifyConfirm}
        onClose={() => {
          setShowVerifyConfirm(false)
          setVerifyTarget(null)
        }}
        onConfirm={confirmVerify}
        title="Konfirmasi"
        message="Tandai data ini sebagai benar/sesuai?"
      />

      {/* ── Info Penandaan Benar/Sesuai ── */}
      {verifyInfoOpen && verifyInfoData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Detail Penandaan Benar/Sesuai
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs font-medium text-gray-500 mb-0.5">Ditandai oleh</div>
                <div className="text-gray-800">{verifyInfoData.oleh}</div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-500 mb-0.5">Ditandai pada</div>
                <div className="text-gray-800">{verifyInfoData.pada}</div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              {canUnverify && (
                <button
                  type="button"
                  onClick={handleUnverify}
                  className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700"
                >
                  Batalkan Tanda Benar
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setVerifyInfoOpen(false)
                  setVerifyInfoData(null)
                }}
                className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Konfirmasi Batalkan Tanda Benar/Sesuai ── */}
      <ConfirmDialog
        isOpen={showUnverifyConfirm}
        onClose={() => setShowUnverifyConfirm(false)}
        onConfirm={confirmUnverify}
        title="Konfirmasi"
        message="Yakin ingin membatalkan tandai benar/sesuai pada data ini?"
      />
    </PageContainer>
  )
}

export default KoreksiTransaksi