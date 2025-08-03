import React, { useEffect, useState } from 'react'

import TableContent from '../../../components/TableContent'
import TableRekapTahunan from '../../../components/TableRekapTahunan'

const LaporanKeuangan = () => {
  // Helper untuk konversi periode ke format 'Agustus 2025'
  const bulanIndo = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
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
  let totalSaldoAwal = 0;
  let totalSaldoAwalPrev = 0;
  if (periodeType === 'bulanan') {
    totalSaldoAwal = snapshotSaldo.reduce((sum, item) => sum + Number(item.saldo_awal || 0), 0);
    // Hitung periode sebelumnya
    const [tahun, bulan] = periodeSnapshot.split('-');
    let prevBulan = parseInt(bulan, 10) - 1;
    let prevTahun = parseInt(tahun, 10);
    if (prevBulan < 1) {
      prevBulan = 12;
      prevTahun -= 1;
    }
    const prevPeriode = `${prevTahun}-${String(prevBulan).padStart(2, '0')}`;
    // Ambil snapshot saldo awal periode sebelumnya
    // (data sudah diambil dari backend, perlu request baru jika ingin real-time)
    // Untuk demo, gunakan state untuk simpan hasilnya
    const [snapshotSaldoPrev, setSnapshotSaldoPrev] = useState([]);
    useEffect(() => {
      if (periodeType === 'bulanan') {
        window.api.getSnapshotSaldoAwal({ periode: prevPeriode, tipe: 'bulanan' }).then(setSnapshotSaldoPrev);
      }
    }, [prevPeriode, periodeType]);
    totalSaldoAwalPrev = snapshotSaldoPrev.reduce((sum, item) => sum + Number(item.saldo_awal || 0), 0);
  } else if (periodeType === 'tahunan') {
    // Untuk tahunan, ambil saldo awal pertama per sumber dana di tahun itu
    const sumberDanaMap = {};
    snapshotSaldo.forEach(item => {
      // Ambil bulan dari periode, format 'YYYY-MM'
      const bulan = item.periode?.split('-')[1] || '01';
      const key = item.nama_sumber_dana;
      if (!sumberDanaMap[key] || bulan < sumberDanaMap[key].bulan) {
        sumberDanaMap[key] = { saldo_awal: Number(item.saldo_awal || 0), bulan };
      }
    });
    totalSaldoAwal = Object.values(sumberDanaMap).reduce((sum, obj) => sum + obj.saldo_awal, 0);
    // Periode sebelumnya (tahun sebelumnya)
    const prevTahun = String(parseInt(periodeSnapshot, 10) - 1);
    const [snapshotSaldoPrev, setSnapshotSaldoPrev] = useState([]);
    useEffect(() => {
      if (periodeType === 'tahunan') {
        window.api.getSnapshotSaldoAwal({ periode: prevTahun, tipe: 'tahunan' }).then(setSnapshotSaldoPrev);
      }
    }, [prevTahun, periodeType]);
    // Hitung saldo awal tahun sebelumnya
    const sumberDanaMapPrev = {};
    snapshotSaldoPrev.forEach(item => {
      const bulan = item.periode?.split('-')[1] || '01';
      const key = item.nama_sumber_dana;
      if (!sumberDanaMapPrev[key] || bulan < sumberDanaMapPrev[key].bulan) {
        sumberDanaMapPrev[key] = { saldo_awal: Number(item.saldo_awal || 0), bulan };
      }
    });
    totalSaldoAwalPrev = Object.values(sumberDanaMapPrev).reduce((sum, obj) => sum + obj.saldo_awal, 0);
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
  const [userRole, setUserRole] = useState(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'))
    return storedUser?.role ? storedUser.role.toLowerCase() : 'kasir'
  })
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
    { key: 'tanggal', label: 'Tanggal' },
    { key: 'jenis_transaksi', label: 'Jenis Transaksi' },
    { key: 'nominal_transaksi', label: 'Nominal Keluar' },
    { key: 'nominal_masuk', label: 'Nominal Masuk' },
    { key: 'selisih_masuk_keluar', label: 'Selisih Masuk/Keluar' },
  ]

  // Untuk bulanan: filter data transaksi sesuai bulan
  const filteredData = periodeType === 'bulanan'
    ? laporan
        .filter((item) => {
          // Asumsi item.tanggal format 'YYYY-MM-DD'
          if (!item.tanggal) return false
          const [tahun, bulan] = item.tanggal.split('-')
          return (
            `${tahun}-${bulan}` === periodeSnapshot &&
            Object.values(item).some((val) => String(val).toLowerCase().includes(filterText.toLowerCase()))
          )
        })
        .map((item) => ({
          ...item,
          nominal_transaksi: formatRupiah(item.nominal_transaksi),
          nominal_masuk: formatRupiah(item.nominal_masuk),
          selisih_masuk_keluar: formatRupiah(Number(item.nominal_masuk || 0) - Number(item.nominal_transaksi || 0))
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
    laporan.forEach(item => {
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
    return bulanArr.map(row => ({
      ...row,
      nominal_masuk: formatRupiah(row.nominal_masuk),
      nominal_keluar: formatRupiah(row.nominal_keluar),
      keuntungan: formatRupiah(row.keuntungan)
    }))
  })()

  return (
    <div>
      {/* Pilih tipe periode dan periode snapshot saldo awal */}
      <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 12 }}>
        <label style={{ fontWeight: 'bold', marginRight: 8 }}>Tipe Periode:</label>
        <select
          value={periodeType}
          onChange={e => {
            setPeriodeType(e.target.value)
            // Reset periodeSnapshot sesuai tipe
            const now = new Date()
            setPeriodeSnapshot(
              e.target.value === 'bulanan'
                ? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
                : `${now.getFullYear()}`
            )
          }}
          style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ccc' }}
        >
          <option value="bulanan">Bulanan</option>
          <option value="tahunan">Tahunan</option>
        </select>
        <label style={{ fontWeight: 'bold', marginLeft: 16, marginRight: 8 }}>Periode Saldo Awal:</label>
        {periodeType === 'bulanan' ? (
          <input
            type="month"
            value={periodeSnapshot}
            onChange={e => setPeriodeSnapshot(e.target.value)}
            style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ccc' }}
          />
        ) : (
          <input
            type="number"
            min="2000"
            max="2100"
            value={periodeSnapshot}
            onChange={e => setPeriodeSnapshot(e.target.value)}
            style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ccc', width: 100 }}
          />
        )}
      </div>

      {/* Tampilkan snapshot saldo awal */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden w-full mb-4">
        {/* Header */}
        <div className="p-4 border-b flex flex-wrap items-center justify-between gap-4 border-gray-200 bg-gray-50">
          <div className="flex flex-col w-full sm:w-auto">
            <h2 className="text-lg font-medium text-gray-700">
              Saldo Awal Periode {periodeType === 'bulanan' ? formatPeriodeIndo(periodeSnapshot) : periodeSnapshot}
            </h2>
            <p className="text-sm text-gray-500">Total Data: {snapshotSaldo.length}</p>
          </div>
        </div>
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sumber Dana</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo Awal</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(() => {
                let dataToShow = snapshotSaldo;
                if (periodeType === 'tahunan') {
                  // Ambil satu baris per sumber dana (bulan pertama di tahun itu)
                  const sumberDanaMap = {};
                  snapshotSaldo.forEach(item => {
                    const bulan = item.periode?.split('-')[1] || '01';
                    const key = item.nama_sumber_dana;
                    if (!sumberDanaMap[key] || bulan < sumberDanaMap[key].bulan) {
                      sumberDanaMap[key] = { ...item, bulan };
                    }
                  });
                  dataToShow = Object.values(sumberDanaMap);
                }
                if (dataToShow.length === 0) {
                  return (
                    <tr>
                      <td colSpan={2} className="py-8 text-center text-gray-500">Tidak ada data snapshot untuk periode ini.</td>
                    </tr>
                  );
                }
                return dataToShow.map(item => (
                  <tr key={item.nama_sumber_dana} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 whitespace-nowrap">{item.nama_sumber_dana}</td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-black">{formatRupiah(item.saldo_awal)}</td>
                  </tr>
                ));
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
          {((periodeType === 'bulanan' && periodeSnapshot) || (periodeType === 'tahunan' && periodeSnapshot)) && (
            <>
              <div className="flex justify-between items-center text-sm font-normal text-gray-700">
                <div>Total Saldo Periode Sebelumnya:</div>
                <div>{formatRupiah(totalSaldoAwalPrev)}</div>
              </div>
              <div className="flex justify-between items-center text-sm font-normal text-gray-700">
                <div>Selisih dari periode sebelumnya:</div>
                <div className={totalSaldoAwal - totalSaldoAwalPrev >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatRupiah(totalSaldoAwal - totalSaldoAwalPrev)}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ background: '#e0f7fa', padding: '1rem', borderRadius: '8px', minWidth: '180px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Total Keuntungan</div>
          <div style={{ fontSize: '1.3rem', color: '#00796b' }}>{formatRupiah(totalKeuntungan)}</div>
        </div>
        <div style={{ background: '#fff3e0', padding: '1rem', borderRadius: '8px', minWidth: '180px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Total Hutang</div>
          <div style={{ fontSize: '1.3rem', color: '#e65100' }}>{formatRupiah(totalHutang)}</div>
        </div>
      </div>
      {periodeType === 'bulanan' ? (
        <TableContent
          data={filteredData}
          showDateFilter={true}
          columns={transactionColumns}
          title="Laporan Keuangan"
          info={`Total Data: ${filteredData.length}`}
          btnSize="xs"
          userRole={userRole}
          editDelete={false}
          onFilterChange={(text) => setFilterText(text)}
        />
      ) : (
        <TableRekapTahunan data={rekapTahunan} />
      )}
    </div>
  )
}

export default LaporanKeuangan
