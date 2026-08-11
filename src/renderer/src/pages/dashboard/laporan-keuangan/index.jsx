import * as XLSX from 'xlsx'

import React, { useEffect, useState } from 'react'

import TableContent from '../../../components/TableContent'
import TableRekapTahunan from '../../../components/TableRekapTahunan'
import autoTable from 'jspdf-autotable'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { saveAs } from 'file-saver'
import { useAuth } from '../../../context/AuthContext'
import { useRef } from 'react'

// Helper untuk konversi bulan ke format Indonesia
const bulanIndo = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
]

// Format waktu simpan agar lebih mudah dibaca
function formatWaktuSimpan(waktuStr) {
  if (!waktuStr) return '-'
  const d = new Date(waktuStr)
  if (isNaN(d.getTime())) return waktuStr
  // Format: 2025-08-03 12:58:13
  const tahun = d.getFullYear()
  const bulan = String(d.getMonth() + 1).padStart(2, '0')
  const hari = String(d.getDate()).padStart(2, '0')
  const jam = String(d.getHours()).padStart(2, '0')
  const menit = String(d.getMinutes()).padStart(2, '0')
  const detik = String(d.getSeconds()).padStart(2, '0')
  return `${tahun}-${bulan}-${hari} ${jam}:${menit}:${detik}`
}

// Format tanggal transaksi tanpa detik (YYYY-MM-DD HH:mm)
function formatTanggalTanpaDetik(val) {
  if (!val) return ''
  // ganti 'T' jadi spasi kalau ada
  const s = String(val).replace('T', ' ')
  // Jika sudah YYYY-MM-DD HH:mm:ss -> potong detik
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) return s.slice(0, 16)
  // Jika sudah YYYY-MM-DD HH:mm biarkan
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(s)) return s
  // Jika hanya tanggal YYYY-MM-DD, kembalikan apa adanya
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  // fallback: coba parse Date
  const d = new Date(s)
  if (!isNaN(d.getTime())) {
    const tahun = d.getFullYear()
    const bulan = String(d.getMonth() + 1).padStart(2, '0')
    const hari = String(d.getDate()).padStart(2, '0')
    const jam = String(d.getHours()).padStart(2, '0')
    const menit = String(d.getMinutes()).padStart(2, '0')
    return `${tahun}-${bulan}-${hari} ${jam}:${menit}`
  }
  return s
}

const LaporanKeuangan = () => {
  
  // Helper untuk konversi periode ke format 'Agustus 2025'
  const bulanIndo = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember'
  ]
  function formatPeriodeIndo(periode) {
    if (!periode) return ''
    const [tahun, bulan] = periode.split('-')
    const bulanIdx = parseInt(bulan, 10) - 1
    return `${bulanIndo[bulanIdx]} ${tahun}`
  }
  // Periode type: 'bulanan' or 'tahunan'
  const [periodeType, setPeriodeType] = useState('bulanan')
  const [periodeSnapshot, setPeriodeSnapshot] = useState(() => {
    const now = new Date()
    return 'bulanan'
      ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      : `${now.getFullYear()}`
  })
  const [snapshotSaldo, setSnapshotSaldo] = useState([])
  // Hitung total saldo keseluruhan dari snapshot sesuai periode
  let totalSaldoAwal = 0
  let totalSaldoAwalPrev = 0
  if (periodeType?.toLowerCase() === 'bulanan') {
    totalSaldoAwal = snapshotSaldo.reduce((sum, item) => sum + Number(item.saldo_awal || 0), 0)
    // Hitung periode sebelumnya
    const [tahun, bulan] = periodeSnapshot.split('-')
    let prevBulan = parseInt(bulan, 10) - 1
    let prevTahun = parseInt(tahun, 10)
    if (prevBulan < 1) {
      prevBulan = 12
      prevTahun -= 1
    }
    const prevPeriode = `${prevTahun}-${String(prevBulan).padStart(2, '0')}`
    // Ambil snapshot saldo awal periode sebelumnya
    // (data sudah diambil dari backend, perlu request baru jika ingin real-time)
    // Untuk demo, gunakan state untuk simpan hasilnya
    const [snapshotSaldoPrev, setSnapshotSaldoPrev] = useState([])
    useEffect(() => {
      if (periodeType === 'bulanan') {
        window.api
          .getSnapshotSaldoAwal({ periode: prevPeriode, tipe: 'bulanan' })
          .then(setSnapshotSaldoPrev)
      }
    }, [prevPeriode, periodeType])
    totalSaldoAwalPrev = snapshotSaldoPrev.reduce(
      (sum, item) => sum + Number(item.saldo_awal || 0),
      0
    )
  } else if (periodeType === 'tahunan') {
    // Untuk tahunan, ambil saldo awal pertama per sumber dana di tahun itu
    const sumberDanaMap = {}
    snapshotSaldo.forEach((item) => {
      // Ambil bulan dari periode, format 'YYYY-MM'
      const bulan = item.periode?.split('-')[1] || '01'
      const key = item.nama_sumber_dana
      if (!sumberDanaMap[key] || bulan < sumberDanaMap[key].bulan) {
        sumberDanaMap[key] = { saldo_awal: Number(item.saldo_awal || 0), bulan }
      }
    })
    totalSaldoAwal = Object.values(sumberDanaMap).reduce((sum, obj) => sum + obj.saldo_awal, 0)
    // Periode sebelumnya (tahun sebelumnya)
    const prevTahun = String(parseInt(periodeSnapshot, 10) - 1)
    const [snapshotSaldoPrev, setSnapshotSaldoPrev] = useState([])
    useEffect(() => {
      if (periodeType === 'tahunan') {
        window.api
          .getSnapshotSaldoAwal({ periode: prevTahun, tipe: 'tahunan' })
          .then(setSnapshotSaldoPrev)
      }
    }, [prevTahun, periodeType])
    // Hitung saldo awal tahun sebelumnya
    const sumberDanaMapPrev = {}
    snapshotSaldoPrev.forEach((item) => {
      const bulan = item.periode?.split('-')[1] || '01'
      const key = item.nama_sumber_dana
      if (!sumberDanaMapPrev[key] || bulan < sumberDanaMapPrev[key].bulan) {
        sumberDanaMapPrev[key] = { saldo_awal: Number(item.saldo_awal || 0), bulan }
      }
    })
    totalSaldoAwalPrev = Object.values(sumberDanaMapPrev).reduce(
      (sum, obj) => sum + obj.saldo_awal,
      0
    )
  }

  // Ambil snapshot saldo awal
  const fetchSnapshotSaldoAwal = async (periode) => {
    try {
      // Kirim tipe periode ke backend jika perlu
      const data = await window.api.getSnapshotSaldoAwal({
        periode,
        tipe: periodeType
      })
      setSnapshotSaldo(data)
    } catch (err) {
      console.error('❌ Gagal ambil snapshot saldo awal:', err)
    }
  }

  useEffect(() => {
    fetchSnapshotSaldoAwal(periodeSnapshot)
  }, [periodeSnapshot, periodeType])
  const [laporan, setLaporan] = useState([])
  const [filterText, setFilterText] = useState('')
  const { user } = useAuth()
  const userRole = user?.role?.toLowerCase() || 'kasir'
  const [totalKeuntungan, setTotalKeuntungan] = useState(0)
  const [totalHutang, setTotalHutang] = useState(0)

  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value || 0)
  }
  // Fetch laporan keuangan
  const fetchLaporanKeuangan = async () => {
    try {
      const data = await window.api.getLaporanKeuangan(userRole)
      setLaporan(data)
      // Hitung total keuntungan dan total hutang sesuai filter bulanan
      let totalKeuntunganVal = 0
      let totalHutangVal = 0
      if (periodeType === 'bulanan') {
        const [tahun, bulan] = periodeSnapshot.split('-')
        data.forEach((item) => {
          if (item.tanggal) {
            const [itemTahun, itemBulan] = item.tanggal.split('-')
            if (`${itemTahun}-${itemBulan}` === periodeSnapshot) {
              totalKeuntunganVal += Number(item.keuntungan || 0)
              totalHutangVal = Number(item.total_hutang || 0)
            }
          }
        })
      } else if (periodeType === 'tahunan') {
        // Hitung total keuntungan hanya dari tahun yang dipilih
        data.forEach((item) => {
          if (item.tanggal) {
            const [itemTahun] = item.tanggal.split('-')
            if (itemTahun === periodeSnapshot) {
              totalKeuntunganVal += Number(item.keuntungan || 0)
              totalHutangVal = Number(item.total_hutang || 0)
            }
          }
        })
      }
      setTotalKeuntungan(totalKeuntunganVal)
      setTotalHutang(totalHutangVal)
    } catch (error) {
      console.error('❌ Gagal ambil data laporan keuangan:', error)
    }
  }

  useEffect(() => {
    fetchLaporanKeuangan()
  }, [userRole, periodeSnapshot, periodeType])

  const transactionColumns = [
    { key: 'tanggal_display', label: 'Tanggal' },
    { key: 'jenis_transaksi', label: 'Jenis Transaksi' },
    { key: 'nominal_transaksi', label: 'Nominal Keluar' },
    { key: 'nominal_masuk', label: 'Nominal Masuk' },
    { key: 'selisih_masuk_keluar', label: 'Selisih Masuk/Keluar' }
  ]

  // laporan harian
  const [filterTanggal, setFilterTanggal] = useState('')
  // Hitung keuntungan harian sesuai filterTanggal
  const totalKeuntunganHarian = React.useMemo(() => {
    if (!filterTanggal) return null
    return laporan
      .filter((item) => {
        if (!item.tanggal) return false
        // Ambil hanya bagian tanggal (support format 'YYYY-MM-DD HH:mm:ss' atau sudah date only)
        const itemDate = item.tanggal.slice(0, 10)
        return itemDate === filterTanggal
      })
      .reduce((sum, item) => {
        const explicit = item.keuntungan
        // Jika backend belum sediakan field keuntungan, hitung dari nominal masuk - keluar
        const fallback = Number(item.nominal_masuk || 0) - Number(item.nominal_transaksi || 0)
        return sum + Number(explicit !== undefined ? explicit : fallback || 0)
      }, 0)
  }, [laporan, filterTanggal])

  // Untuk bulanan: filter data transaksi sesuai bulan
  const filteredData =
    periodeType === 'bulanan'
      ? laporan
          .filter((item) => {
            // Asumsi item.tanggal format 'YYYY-MM-DD'
            if (!item.tanggal) return false
            const [tahun, bulan] = item.tanggal.split('-')
            return (
              `${tahun}-${bulan}` === periodeSnapshot &&
              Object.values(item).some((val) =>
                String(val).toLowerCase().includes(filterText.toLowerCase())
              )
            )
          })
          .map((item) => ({
            ...item,
            // Display-only tanggal without seconds for the table
            tanggal_display: formatTanggalTanpaDetik(item.tanggal),
            nominal_transaksi: formatRupiah(item.nominal_transaksi),
            nominal_masuk: formatRupiah(item.nominal_masuk),
            selisih_masuk_keluar: formatRupiah(
              item.keuntungan !== undefined
                ? Number(item.keuntungan || 0)
                : Number(item.nominal_masuk || 0) - Number(item.nominal_transaksi || 0)
            )
          }))
      : []

  // Untuk tahunan: rekap per bulan
  const rekapTahunan = (() => {
    if (periodeType !== 'tahunan') return []
    // Buat array 12 bulan
    const bulanArr = Array.from({ length: 12 }, (_, i) => ({
      bulan: i + 1,
      nominal_masuk: 0,
      nominal_keluar: 0,
      keuntungan: 0
    }))
    laporan.forEach((item) => {
      if (!item.tanggal) return
      const [tahun, bulan] = item.tanggal.split('-')
      if (tahun === periodeSnapshot) {
        const idx = parseInt(bulan, 10) - 1
        bulanArr[idx].nominal_masuk += Number(item.nominal_masuk || 0)
        bulanArr[idx].nominal_keluar += Number(item.nominal_transaksi || 0)
        bulanArr[idx].keuntungan += Number(item.keuntungan || 0)
      }
    })
    // Format rupiah setelah penjumlahan
    return bulanArr.map((row) => ({
      ...row,
      nominal_masuk: formatRupiah(row.nominal_masuk),
      nominal_keluar: formatRupiah(row.nominal_keluar),
      keuntungan: formatRupiah(row.keuntungan)
    }))
  })()

  // print area
  const printRef = useRef()

  const handlePrint = () => {
    const doc = new jsPDF()
    let y = 10

    // Header
    doc.setFontSize(14)
    doc.text(
      `Laporan Keuangan - ${periodeType === 'bulanan' ? formatPeriodeIndo(periodeSnapshot) : periodeSnapshot}`,
      14,
      y
    )
    y += 10

    // Snapshot Saldo Awal
    doc.setFontSize(12)
    doc.text('Snapshot Saldo Awal', 14, y)
    y += 4

    let dataToShow = snapshotSaldo
    if (periodeType === 'tahunan') {
      const sumberDanaMap = {}
      snapshotSaldo.forEach((item) => {
        const bulan = item.periode?.split('-')[1] || '01'
        const key = item.nama_sumber_dana
        if (!sumberDanaMap[key] || bulan < sumberDanaMap[key].bulan) {
          sumberDanaMap[key] = { ...item, bulan }
        }
      })
      dataToShow = Object.values(sumberDanaMap)
    }

    autoTable(doc, {
      startY: y + 2,
      head: [['Sumber Dana', 'Saldo Awal']],
      body: dataToShow.map((item) => [item.nama_sumber_dana, formatRupiah(item.saldo_awal)]),
      styles: { fontSize: 10 },
      margin: { left: 14 }
    })

    y = doc.lastAutoTable.finalY + 10

    // Total saldo
    autoTable(doc, {
      startY: y,
      head: [['Deskripsi', 'Jumlah']],
      body: [
        ['Total Saldo Keseluruhan', formatRupiah(totalSaldoAwal)],
        ['Total Saldo Periode Sebelumnya', formatRupiah(totalSaldoAwalPrev)],
        ['Selisih dari Periode Sebelumnya', formatRupiah(totalSaldoAwal - totalSaldoAwalPrev)]
      ],
      styles: { fontSize: 10 },
      margin: { left: 14 }
    })

    y = doc.lastAutoTable.finalY + 10

    // Keuntungan & Hutang
    autoTable(doc, {
      startY: y,
      head: [['Info', 'Jumlah']],
      body: [
        ['Total Keuntungan', formatRupiah(totalKeuntungan)],
        ['Total Hutang', formatRupiah(totalHutang)]
      ],
      styles: { fontSize: 10 },
      margin: { left: 14 }
    })

    y = doc.lastAutoTable.finalY + 10

    // Transaksi atau Rekap
    if (periodeType === 'bulanan') {
      autoTable(doc, {
        startY: y,
        head: [['Tanggal', 'Jenis Transaksi', 'Nominal Keluar', 'Nominal Masuk', 'Selisih']],
        body: filteredData.map((item) => [
          item.tanggal,
          item.jenis_transaksi,
          item.nominal_transaksi,
          item.nominal_masuk,
          item.selisih_masuk_keluar
        ]),
        styles: { fontSize: 9 },
        margin: { left: 14 }
      })
    } else {
      autoTable(doc, {
        startY: y,
        head: [['Bulan', 'Nominal Masuk', 'Nominal Keluar', 'Keuntungan']],
        body: rekapTahunan.map((item) => [
          bulanIndo[item.bulan - 1],
          item.nominal_masuk,
          item.nominal_keluar,
          item.keuntungan
        ]),
        styles: { fontSize: 9 },
        margin: { left: 14 }
      })
    }

    // Instead of save(), convert to blob and open in new tab to auto-print
    const pdfBlob = doc.output('bloburl')
    const printWindow = window.open(pdfBlob)
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.focus()
        printWindow.print()
      }
    }
  }

  const exportToPDF = () => {
    const doc = new jsPDF()

    let y = 10

    // Header
    doc.setFontSize(14)
    doc.text(
      `Laporan Keuangan - ${periodeType === 'bulanan' ? formatPeriodeIndo(periodeSnapshot) : periodeSnapshot}`,
      14,
      y
    )
    y += 10

    // Snapshot Saldo Awal
    doc.setFontSize(12)
    doc.text('Snapshot Saldo Awal', 14, y)
    y += 4

    let dataToShow = snapshotSaldo
    if (periodeType === 'tahunan') {
      const sumberDanaMap = {}
      snapshotSaldo.forEach((item) => {
        const bulan = item.periode?.split('-')[1] || '01'
        const key = item.nama_sumber_dana
        if (!sumberDanaMap[key] || bulan < sumberDanaMap[key].bulan) {
          sumberDanaMap[key] = { ...item, bulan }
        }
      })
      dataToShow = Object.values(sumberDanaMap)
    }

    autoTable(doc, {
      startY: y + 2,
      head: [['Sumber Dana', 'Saldo Awal']],
      body: dataToShow.map((item) => [item.nama_sumber_dana, formatRupiah(item.saldo_awal)]),
      styles: { fontSize: 10 },
      margin: { left: 14 }
    })

    y = doc.lastAutoTable.finalY + 10

    // Total saldo
    autoTable(doc, {
      startY: y,
      head: [['Deskripsi', 'Jumlah']],
      body: [
        ['Total Saldo Keseluruhan', formatRupiah(totalSaldoAwal)],
        ['Total Saldo Periode Sebelumnya', formatRupiah(totalSaldoAwalPrev)],
        ['Selisih dari Periode Sebelumnya', formatRupiah(totalSaldoAwal - totalSaldoAwalPrev)]
      ],
      styles: { fontSize: 10 },
      margin: { left: 14 }
    })

    y = doc.lastAutoTable.finalY + 10

    // Keuntungan & Hutang
    autoTable(doc, {
      startY: y,
      head: [['Info', 'Jumlah']],
      body: [
        ['Total Keuntungan', formatRupiah(totalKeuntungan)],
        ['Total Hutang', formatRupiah(totalHutang)]
      ],
      styles: { fontSize: 10 },
      margin: { left: 14 }
    })

    y = doc.lastAutoTable.finalY + 10

    // Data transaksi atau rekap tahunan
    if (periodeType === 'bulanan') {
      autoTable(doc, {
        startY: y,
        head: [['Tanggal', 'Jenis Transaksi', 'Nominal Keluar', 'Nominal Masuk', 'Selisih']],
        body: filteredData.map((item) => [
          item.tanggal,
          item.jenis_transaksi,
          item.nominal_transaksi,
          item.nominal_masuk,
          item.selisih_masuk_keluar
        ]),
        styles: { fontSize: 9 },
        margin: { left: 14 }
      })
    } else {
      autoTable(doc, {
        startY: y,
        head: [['Bulan', 'Nominal Masuk', 'Nominal Keluar', 'Keuntungan']],
        body: rekapTahunan.map((item) => [
          bulanIndo[item.bulan - 1],
          item.nominal_masuk,
          item.nominal_keluar,
          item.keuntungan
        ]),
        styles: { fontSize: 9 },
        margin: { left: 14 }
      })
    }

    doc.save('laporan-keuangan.pdf')
  }

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet([])

    let row = 0

    const addRow = (arr, bold = false) => {
      XLSX.utils.sheet_add_aoa(ws, [arr], { origin: { r: row, c: 0 } })
      if (bold) {
        const range = { s: { r: row, c: 0 }, e: { r: row, c: arr.length - 1 } }
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell = ws[XLSX.utils.encode_cell({ r: row, c: C })]
          if (!cell.s) cell.s = {}
          cell.s.font = { bold: true }
        }
      }
      row += 1
    }

    // Header: periode
    addRow(
      [
        `Saldo Awal Periode: ${periodeType === 'bulanan' ? formatPeriodeIndo(periodeSnapshot) : periodeSnapshot}`
      ],
      true
    )

    // Snapshot
    addRow(['Sumber Dana', 'Saldo Awal'], true)

    let dataToShow = snapshotSaldo
    if (periodeType === 'tahunan') {
      const sumberDanaMap = {}
      snapshotSaldo.forEach((item) => {
        const bulan = item.periode?.split('-')[1] || '01'
        const key = item.nama_sumber_dana
        if (!sumberDanaMap[key] || bulan < sumberDanaMap[key].bulan) {
          sumberDanaMap[key] = { ...item, bulan }
        }
      })
      dataToShow = Object.values(sumberDanaMap)
    }

    dataToShow.forEach((item) => {
      addRow([item.nama_sumber_dana, Number(item.saldo_awal)])
    })

    row++ // Spacer

    addRow(['Total Saldo Keseluruhan', totalSaldoAwal], true)
    addRow(['Total Saldo Periode Sebelumnya', totalSaldoAwalPrev])
    addRow(['Selisih dari Periode Sebelumnya', totalSaldoAwal - totalSaldoAwalPrev])

    row++
    addRow(['Total Keuntungan', totalKeuntungan], true)
    addRow(['Total Hutang', totalHutang])

    row++

    if (periodeType === 'bulanan') {
      addRow(
        ['Tanggal', 'Jenis Transaksi', 'Nominal Keluar', 'Nominal Masuk', 'Selisih Masuk/Keluar'],
        true
      )
      filteredData.forEach((item) => {
        addRow([
          item.tanggal,
          item.jenis_transaksi,
          parseInt(item.nominal_transaksi.replace(/\D/g, '')) || 0,
          parseInt(item.nominal_masuk.replace(/\D/g, '')) || 0,
          parseInt(item.selisih_masuk_keluar.replace(/\D/g, '')) || 0
        ])
      })
    } else {
      addRow(['Bulan', 'Nominal Masuk', 'Nominal Keluar', 'Keuntungan'], true)
      rekapTahunan.forEach((rowItem) => {
        addRow([
          bulanIndo[rowItem.bulan - 1],
          parseInt(rowItem.nominal_masuk.replace(/\D/g, '')) || 0,
          parseInt(rowItem.nominal_keluar.replace(/\D/g, '')) || 0,
          parseInt(rowItem.keuntungan.replace(/\D/g, '')) || 0
        ])
      })
    }

    // Auto-width
    const colWidths = []
    const keys = Object.keys(ws)
    keys.forEach((key) => {
      if (key[0] === '!') return
      const col = key.replace(/[0-9]/g, '')
      const colIdx = XLSX.utils.decode_col(col)
      const val = ws[key].v
      const len = val ? String(val).length : 10
      if (!colWidths[colIdx] || colWidths[colIdx] < len) {
        colWidths[colIdx] = len
      }
    })

    ws['!cols'] = colWidths.map((w) => ({ wch: w + 5 }))

    XLSX.utils.book_append_sheet(wb, ws, 'Laporan')
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([buffer], { type: 'application/octet-stream' })
    saveAs(blob, 'laporan-keuangan.xlsx')
  }

  // State untuk data summary_log
  const [summaryLog, setSummaryLog] = useState([])

  // Ambil data summary_log dari preload
  useEffect(() => {
    if (window.api && window.api.getSummaryLog) {
      window.api.getSummaryLog().then((data) => {
        console.log('[DEBUG] getSummaryLog result:', data)
        setSummaryLog(Array.isArray(data) ? data : [])
      })
    } else {
      console.warn('[DEBUG] window.api.getSummaryLog not found')
    }
  }, [])

  // State dan filter untuk pencarian dan tanggal log summary
  const [filterLogText, setFilterLogText] = useState('')
  const [filterLogDate, setFilterLogDate] = useState('')
  const [logItemsPerPage, setLogItemsPerPage] = useState(20)
  const [logCurrentPage, setLogCurrentPage] = useState(1)
  const filteredLog = summaryLog.filter(function (row) {
    const financial = row.financialSummary || {}
    const saldoAwalArr = Array.isArray(row.saldoAwal) ? row.saldoAwal : []
    // Gabungkan semua string yang bisa dicari
    let searchString = formatWaktuSimpan(row.waktu_simpan || row.waktu)
    searchString += ' ' + Object.values(financial).map(String).join(' ')
    searchString +=
      ' ' +
      saldoAwalArr
        .map(function (item) {
          return item.nama_sumber_dana + ' ' + item.saldo
        })
        .join(' ')
    searchString = searchString.toLowerCase()
    // Filter tanggal
    let matchDate = true
    if (filterLogDate) {
      let tanggal = ''
      if (row.waktu_simpan || row.waktu) {
        const d = new Date(row.waktu_simpan || row.waktu)
        if (!isNaN(d.getTime())) {
          tanggal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
        }
      }
      matchDate = tanggal === filterLogDate
    }
    return searchString.includes(filterLogText.toLowerCase()) && matchDate
  })
  const logTotalPages =
    logItemsPerPage === 'all' ? 1 : Math.ceil(filteredLog.length / logItemsPerPage)
  const logIndexOfLastItem =
    logItemsPerPage === 'all' ? filteredLog.length : logCurrentPage * logItemsPerPage
  const logIndexOfFirstItem = logItemsPerPage === 'all' ? 0 : logIndexOfLastItem - logItemsPerPage
  const logCurrentData = filteredLog.slice(logIndexOfFirstItem, logIndexOfLastItem)
  return (
    <div className="pb-8">
      {/* Header halaman */}
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-gray-800">Laporan Keuangan</h1>
        <p className="text-sm text-gray-500">
          Ringkasan keuntungan, hutang, dan riwayat transaksi per periode.
        </p>
      </div>

      {/* Toolbar: filter periode & aksi export */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 mb-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          {/* Filter periode */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Tipe Periode
              </label>
              <select
                value={periodeType}
                onChange={(e) => {
                  setPeriodeType(e.target.value)
                  // Reset periodeSnapshot sesuai tipe
                  const now = new Date()
                  setPeriodeSnapshot(
                    e.target.value === 'bulanan'
                      ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
                      : `${now.getFullYear()}`
                  )
                }}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="bulanan">Bulanan</option>
                <option value="tahunan">Tahunan</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Periode
              </label>
              {periodeType === 'bulanan' ? (
                <input
                  type="month"
                  value={periodeSnapshot}
                  onChange={(e) => setPeriodeSnapshot(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              ) : (
                <input
                  type="number"
                  min="2000"
                  max="2100"
                  value={periodeSnapshot}
                  onChange={(e) => setPeriodeSnapshot(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white text-gray-700 w-28 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              )}
            </div>
            <span className="text-sm text-gray-500 pb-1.5">
              Menampilkan data{' '}
              <span className="font-medium text-gray-700">
                {periodeType === 'bulanan' ? formatPeriodeIndo(periodeSnapshot) : periodeSnapshot}
              </span>
            </span>
          </div>

          {/* Tombol export */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 transition-colors text-white px-3 py-1.5 rounded-md text-sm font-medium shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 4a1 1 0 011-1h8a1 1 0 011 1v2H5V4zm-2 4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a1 1 0 001 1h10a1 1 0 001-1v-2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3zm10 6H7v-2h6v2z" clipRule="evenodd" />
              </svg>
              Cetak
            </button>
            <button
              onClick={exportToPDF}
              className="inline-flex items-center gap-1.5 bg-red-500 hover:bg-red-600 active:bg-red-700 transition-colors text-white px-3 py-1.5 rounded-md text-sm font-medium shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 000 2h.01a1 1 0 100-2H6zm3 0a1 1 0 100 2h5a1 1 0 100-2H9zm-3 4a1 1 0 000 2h.01a1 1 0 100-2H6zm3 0a1 1 0 100 2h5a1 1 0 100-2H9z" clipRule="evenodd" />
              </svg>
              Export PDF
            </button>
            <button
              onClick={exportToExcel}
              className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-600 active:bg-green-700 transition-colors text-white px-3 py-1.5 rounded-md text-sm font-medium shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 4a2 2 0 012-2h6.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a2 2 0 01-2 2H5a2 2 0 01-2-2V4z" opacity="0.3" />
                <path fillRule="evenodd" d="M7 9a1 1 0 011.6-.8L11 10l2.4-1.8a1 1 0 111.2 1.6L12 11.8V14a1 1 0 11-2 0v-2.2l-2.6-1.95A1 1 0 017 9z" clipRule="evenodd" />
              </svg>
              Export Excel
            </button>
          </div>
        </div>
      </div>
      {/* ========================================= ini yang di print ======================================== */}
      <div id="print-area" ref={printRef}>
        {/* Tampilkan snapshot saldo awal */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden w-full mb-4">
          {/* Header */}
          <div className="p-4 border-b flex flex-wrap items-center justify-between gap-4 border-gray-200 bg-gray-50">
            <div className="flex flex-col w-full sm:w-auto">
              <h2 className="text-lg font-medium text-gray-700">
                Saldo Awal Periode{' '}
                {periodeType === 'bulanan' ? formatPeriodeIndo(periodeSnapshot) : periodeSnapshot}
              </h2>
              <p className="text-sm text-gray-500">Total Data: {snapshotSaldo.length}</p>
            </div>
          </div>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sumber Dana
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Saldo Awal
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(() => {
                  let dataToShow = snapshotSaldo
                  if (periodeType === 'tahunan') {
                    // Ambil satu baris per sumber dana (bulan pertama di tahun itu)
                    const sumberDanaMap = {}
                    snapshotSaldo.forEach((item) => {
                      const bulan = item.periode?.split('-')[1] || '01'
                      const key = item.nama_sumber_dana
                      if (!sumberDanaMap[key] || bulan < sumberDanaMap[key].bulan) {
                        sumberDanaMap[key] = { ...item, bulan }
                      }
                    })
                    dataToShow = Object.values(sumberDanaMap)
                  }
                  if (dataToShow.length === 0) {
                    return (
                      <tr>
                        <td colSpan={2} className="py-8 text-center text-gray-500">
                          Tidak ada data snapshot untuk periode ini.
                        </td>
                      </tr>
                    )
                  }
                  return dataToShow.map((item) => (
                    <tr key={item.nama_sumber_dana} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {item.nama_sumber_dana}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-black">
                        {formatRupiah(item.saldo_awal)}
                      </td>
                    </tr>
                  ))
                })()}
              </tbody>
            </table>
          </div>
          {/* Total */}
          <div className="bg-gray-100 rounded-lg py-2 px-4 mt-4 flex flex-col gap-2 font-bold text-base text-black">
            <div className="flex justify-between items-center">
              <div>Total Saldo Keseluruhan:</div>
              <div>{formatRupiah(totalSaldoAwal)}</div>
            </div>
            {((periodeType === 'bulanan' && periodeSnapshot) ||
              (periodeType === 'tahunan' && periodeSnapshot)) && (
              <>
                <div className="flex justify-between items-center text-sm font-normal text-gray-700">
                  <div>Total Saldo Periode Sebelumnya:</div>
                  <div>{formatRupiah(totalSaldoAwalPrev)}</div>
                </div>
                <div className="flex justify-between items-center text-sm font-normal text-gray-700">
                  <div>Selisih dari periode sebelumnya:</div>
                  <div
                    className={
                      totalSaldoAwal - totalSaldoAwalPrev >= 0 ? 'text-green-600' : 'text-red-600'
                    }
                  >
                    {formatRupiah(totalSaldoAwal - totalSaldoAwalPrev)}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {/* Total Keuntungan */}
          <div className="bg-white rounded-lg shadow-md border-l-4 border-teal-500 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-teal-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.093c.622-.117 1.197-.342 1.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
              Total Keuntungan
            </div>
            <div className="text-2xl font-bold text-teal-600 mt-1">
              {formatRupiah(totalKeuntungan)}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              Periode {periodeType === 'bulanan' ? formatPeriodeIndo(periodeSnapshot) : periodeSnapshot}
            </div>
          </div>

          {/* Total Hutang */}
          <div className="bg-white rounded-lg shadow-md border-l-4 border-orange-500 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-orange-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Total Hutang
            </div>
            <div className="text-2xl font-bold text-orange-600 mt-1">
              {formatRupiah(totalHutang)}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">Belum lunas hingga saat ini</div>
          </div>

          {/* Keuntungan Harian */}
          <div className="bg-white rounded-lg shadow-md border-l-4 border-purple-500 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              Keuntungan Harian
            </div>
            <div className="text-2xl font-bold text-purple-600 mt-1">
              {totalKeuntunganHarian === null
                ? '—'
                : formatRupiah(totalKeuntunganHarian)}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              {filterTanggal ? `Tanggal: ${filterTanggal}` : 'Pilih tanggal di tabel transaksi'}
            </div>
          </div>
        </div>
        {periodeType === 'bulanan' ? (
          <TableContent
            data={filteredData}
            showJenisTransaksiFilter={true}
            showDateFilter={true}
            columns={transactionColumns}
            title="Laporan Keuangan"
            info={`Total Data: ${filteredData.length}`}
            btnSize="xs"
            userRole={userRole}
            editDelete={false}
            onFilterChange={(text) => setFilterText(text)}
            onDateChange={(date) => setFilterTanggal(date)}
          />
        ) : (
          <TableRekapTahunan data={rekapTahunan} />
        )}
        {/* Tabel log summary di paling bawah, dengan pagination */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden w-full mt-8 mb-4">
          <div className="p-4 border-b flex flex-wrap items-center justify-between gap-4 border-gray-200 bg-gray-50">
            <div className="flex flex-col w-full sm:w-auto">
              <h2 className="text-lg font-medium text-gray-700">Riwayat Simpan Laporan Keuangan</h2>
              <p className="text-sm text-gray-500">Total Data: {filteredLog.length}</p>
            </div>
            {/* Input filter tanggal dan pencarian */}
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={filterLogDate}
                onChange={(e) => setFilterLogDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[130px]"
              />
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                <input
                  type="text"
                  placeholder="Cari log..."
                  value={filterLogText}
                  onChange={(e) => setFilterLogText(e.target.value)}
                  className="border border-gray-300 rounded-md pl-8 pr-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[180px]"
                />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Waktu Simpan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Financial Summary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Saldo Awal
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logCurrentData.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-gray-500">
                      Belum ada riwayat simpan laporan keuangan.
                    </td>
                  </tr>
                ) : (
                  logCurrentData.map((row, idx) => {
                    const financial = row.financialSummary || {}
                    const saldoAwalArr = Array.isArray(row.saldoAwal) ? row.saldoAwal : []
                    const totalSaldoAwal = saldoAwalArr.reduce(
                      (sum, item) => sum + Number(item.saldo || 0),
                      0
                    )
                    return (
                      <tr key={row.id || idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                          {row.waktu_simpan || row.waktu
                            ? formatTanggalTanpaDetik(row.waktu_simpan || row.waktu)
                            : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-pre-wrap">
                          <div className="mb-2 font-semibold">Ringkasan:</div>
                          <ul className="list-disc pl-4">
                            <li>
                              Penarikan Tunai:{' '}
                              <span className="font-mono">
                                {formatRupiah(financial.cashWithdrawal)}
                              </span>
                            </li>
                            <li>
                              Transfer:{' '}
                              <span className="font-mono">{formatRupiah(financial.transfer)}</span>
                            </li>
                            <li>
                              Admin Bank:{' '}
                              <span className="font-mono">{formatRupiah(financial.bankAdmin)}</span>
                            </li>
                            <li>
                              Profit:{' '}
                              <span className="font-mono">{formatRupiah(financial.profit)}</span>
                            </li>
                            <li>
                              Mode Pulsa:{' '}
                              <span className="font-mono">{formatRupiah(financial.modePulsa)}</span>
                            </li>
                            <li>
                              Total Aset:{' '}
                              <span className="font-mono">
                                {formatRupiah(financial.totalAssets)}
                              </span>
                            </li>
                          </ul>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 whitespace-pre-wrap">
                          <div className="mb-2 font-semibold">Saldo Awal:</div>
                          <ul className="list-disc pl-4">
                            {saldoAwalArr.map((item, i) => (
                              <li key={i}>
                                {item.nama_sumber_dana}:{' '}
                                <span className="font-mono">{formatRupiah(item.saldo)}</span>
                              </li>
                            ))}
                          </ul>
                          <div className="mt-2 font-bold">
                            Total Saldo Awal:{' '}
                            <span className="font-mono">{formatRupiah(totalSaldoAwal)}</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination controls moved below table */}
          <div className="flex flex-wrap justify-between items-center px-6 py-3 gap-2 bg-gray-50 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Tampilkan:</span>
              <select
                value={logItemsPerPage}
                onChange={(e) => {
                  const val = e.target.value === 'all' ? 'all' : Number(e.target.value)
                  setLogItemsPerPage(val)
                  setLogCurrentPage(1)
                }}
                className="border rounded px-2 py-1 text-sm bg-white border-gray-300"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value="all">Semua</option>
              </select>
            </div>
            <p className="text-sm text-gray-600">
              Halaman {logCurrentPage} dari {logTotalPages}
            </p>
            {logItemsPerPage !== 'all' && (
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setLogCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={logCurrentPage === 1}
                  className="px-3 py-1 rounded text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                >
                  Sebelumnya
                </button>
                {(() => {
                  const maxVisible = 5
                  let start = Math.max(1, logCurrentPage - Math.floor(maxVisible / 2))
                  let end = Math.min(logTotalPages, start + maxVisible - 1)
                  if (end - start + 1 < maxVisible) {
                    start = Math.max(1, end - maxVisible + 1)
                  }
                  const pages = []
                  for (let p = start; p <= end; p++) pages.push(p)
                  return pages.map((num) => (
                    <button
                      key={num}
                      onClick={() => setLogCurrentPage(num)}
                      className={`px-3 py-1 rounded text-sm ${
                        num === logCurrentPage
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {num}
                    </button>
                  ))
                })()}
                <button
                  onClick={() => setLogCurrentPage((prev) => Math.min(prev + 1, logTotalPages))}
                  disabled={logCurrentPage === logTotalPages}
                  className="px-3 py-1 rounded text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                >
                  Selanjutnya
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LaporanKeuangan