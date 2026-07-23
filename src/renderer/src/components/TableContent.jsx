import { HiPencilSquare, HiViewfinderCircle, HiXMark } from 'react-icons/hi2'
import React, { useEffect, useState } from 'react'

import AlertDialog from './AlertDialog'
import ButtonInput from './ButtonInput'
import { FaCheck } from 'react-icons/fa6'
import SearchField from './SearchField'
import { useTheme } from '../context/ThemeContext'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)

const TableContent = ({
  data = [],
  columns = [],
  onEdit = () => {},
  onDateChange = () => {},
  onDelete = () => {},
  onStatus = () => {},
  onView = () => {},
  onAdd = () => {},
  onSearchChange = () => {},
  showView = false,
  hidden = true,
  editDelete = true,
  title,
  statusHutang,
  bayar = false,
  info,
  btnSize,
  searchValue = '',
  userRole = 'admin',
  showDateFilter = false,
  showSumberDanaFilter = false,
  showJenisTransaksiFilter = false,
  showTerimaDanaFilter = false,
  showPembayarFeeFilter = false,
  showEditedFilter = false,
  onSumberDanaChange = () => {},
  onJenisTransaksiChange = () => {},
  onTerimaDanaChange = () => {},
  onPembayarFeeChange = () => {},
  onEditedFilterChange = () => {}
}) => {
  const [loggedInUser, setLoggedInUser] = useState(null)
  const [showAlertDialog, setShowAlertDialog] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSumberDana, setSelectedSumberDana] = useState('')
  const [selectedJenisTransaksi, setSelectedJenisTransaksi] = useState('')
  const [selectedTerimaDana, setSelectedTerimaDana] = useState('')
  const [selectedPembayarFee, setSelectedPembayarFee] = useState('')
  const [selectedEditedFilter, setSelectedEditedFilter] = useState('')
  const itemsPerPage = 20
  const { isDark } = useTheme()

  // Get unique values for filter options
  const uniqueSumberDana = [...new Set(data.map(item => 
    item.sumber_dana || item.platform_name || item.sumber_nama || ''
  ).filter(Boolean))]
  
  const uniqueJenisTransaksi = [...new Set(data.map(item => 
    item.jenis_transaksi || ''
  ).filter(Boolean))]

  const uniqueTerimaDana = [...new Set(data.map(item => 
    item.terima_dana_nama || ''
  ).filter(Boolean))]

  const uniquePembayarFee = [...new Set(data.map(item => 
    item.metode_pembayaran_nama || ''
  ).filter(Boolean))]

  // Hitung jumlah transaksi yang pernah diedit
  const editedCount = data.filter(item => item.is_edited || item.edited).length
  const totalCount = data.length

  useEffect(() => {
    const userString = localStorage.getItem('user')
    if (userString) {
      setLoggedInUser(JSON.parse(userString))
    }
  }, [])

  const handleEdit = (id) => {
    if (loggedInUser?.role?.toLowerCase() !== 'admin' && userRole?.toLowerCase() !== 'kasir') {
      setAlertMessage('Maaf, hanya admin yang dapat mengedit data.')
      setShowAlertDialog(true)
      return
    }
    onEdit(id)
  }

  const handleDelete = (id) => {
    if (!loggedInUser || loggedInUser.role?.toLowerCase() !== 'admin') {
      setAlertMessage('Maaf, hanya admin yang dapat menghapus data.')
      setShowAlertDialog(true)
      return
    }
    onDelete(id)
  }

  const handleStatus = (id) => {
    if (loggedInUser?.role?.toLowerCase() !== 'admin' && userRole?.toLowerCase() !== 'kasir') {
      setAlertMessage('Maaf, hanya admin yang dapat mengedit data.')
      setShowAlertDialog(true)
      return
    }
    onStatus(id)
  }
  // Filtering berdasarkan tanggal, sumber dana, jenis transaksi, terima dana, pembayar fee dan search
  const DataItems = data
  const filteredData = DataItems.filter((item) => {
    const rawDate = item.tanggal || item.tanggal_pengambilan || ''
    // Perbaikan: gunakan dayjs dengan timezone WIB untuk konsistensi
    const itemDate = rawDate && dayjs(rawDate).isValid() 
      ? dayjs(rawDate).tz('Asia/Jakarta').format('YYYY-MM-DD') 
      : ''

    const matchDate = showDateFilter && selectedDate ? itemDate === selectedDate : true

    const matchSumberDana = showSumberDanaFilter && selectedSumberDana 
      ? (item.sumber_dana || item.platform_name || item.sumber_nama || '').toLowerCase() === (selectedSumberDana || '').toLowerCase()
      : true

    const matchJenisTransaksi = showJenisTransaksiFilter && selectedJenisTransaksi
      ? (item.jenis_transaksi || '').toLowerCase() === (selectedJenisTransaksi || '').toLowerCase()
      : true

    const matchTerimaDana = showTerimaDanaFilter && selectedTerimaDana
      ? (item.terima_dana_nama || '').toLowerCase() === (selectedTerimaDana || '').toLowerCase()
      : true

    const matchPembayarFee = showPembayarFeeFilter && selectedPembayarFee
      ? (item.metode_pembayaran_nama || '').toLowerCase() === (selectedPembayarFee || '').toLowerCase()
      : true

    const matchEditedFilter = showEditedFilter && selectedEditedFilter
      ? (selectedEditedFilter === 'edited' ? !!(item.is_edited || item.edited) : 
         selectedEditedFilter === 'not-edited' ? !(item.is_edited || item.edited) : true)
      : true

    const matchSearch = searchValue
      ? JSON.stringify(item).toLowerCase().includes(searchValue.toLowerCase())
      : true

    return matchDate && matchSumberDana && matchJenisTransaksi && matchTerimaDana && matchPembayarFee && matchEditedFilter && matchSearch
  })

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentData = filteredData.slice(indexOfFirstItem, indexOfLastItem)

  const renderPagination = () => (
    <div
      className={`flex justify-between items-center px-6 py-3 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-t'}`}
    >
      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
        Halaman {currentPage} dari {totalPages}
      </p>
      <div className="flex gap-2 items-center">
        <button
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className={`px-3 py-1 rounded text-sm ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50'}`}
        >
          Sebelumnya
        </button>
        {(() => {
          const maxVisible = 5
          let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
          let end = Math.min(totalPages, start + maxVisible - 1)
          if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1)
          }
          const pages = []
          for (let p = start; p <= end; p++) pages.push(p)
          return pages.map((num) => (
            <button
              key={num}
              onClick={() => setCurrentPage(num)}
              className={`px-3 py-1 rounded text-sm ${
                num === currentPage
                  ? 'bg-blue-500 text-white'
                  : isDark
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {num}
            </button>
          ))
        })()}
        <button
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className={`px-3 py-1 rounded text-sm ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50'}`}
        >
          Selanjutnya
        </button>
      </div>
    </div>
  )

  return (
    <>
      <div
        className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md overflow-hidden w-full`}
      >
        {/* Header */}
        <div
          className={`p-4 border-b flex flex-wrap items-center justify-between gap-4 ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}
        >
          <div className="flex flex-col w-full sm:w-auto">
            <h2 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>
              {title}
            </h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{info}</p>
          </div>
          <div className="flex items-center gap-3">
            {onAdd && (
              <div className="flex">{typeof onAdd === 'function' ? onAdd() : onAdd}</div>
            )}
          </div>
        </div>

        {/* Filters Section */}
        {(showDateFilter || showSumberDanaFilter || showJenisTransaksiFilter || showTerimaDanaFilter || showPembayarFeeFilter || showEditedFilter) && (
          <div className={`p-4 border-b ${isDark ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-25'}`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4 mb-4">
              {showDateFilter && (
                <div className="flex flex-col min-w-0">
                  <label className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Filter Tanggal
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      const value = e.target.value
                      setSelectedDate(e.target.value)
                      onDateChange(value)
                    }}
                    className={`border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300'}`}
                  />
                </div>
              )}
              {showSumberDanaFilter && (
                <div className="flex flex-col min-w-0">
                  <label className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Filter Sumber Dana
                  </label>
                  <select
                    value={selectedSumberDana}
                    onChange={(e) => {
                      const value = e.target.value
                      setSelectedSumberDana(value)
                      onSumberDanaChange(value)
                    }}
                    className={`border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300'}`}
                  >
                    <option value="">Semua Sumber Dana</option>
                    {uniqueSumberDana.map(sumber => (
                      <option key={sumber} value={sumber}>{sumber}</option>
                    ))}
                  </select>
                </div>
              )}
              {showJenisTransaksiFilter && (
                <div className="flex flex-col min-w-0">
                  <label className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Filter Jenis Transaksi
                  </label>
                  <select
                    value={selectedJenisTransaksi}
                    onChange={(e) => {
                      const value = e.target.value
                      setSelectedJenisTransaksi(value)
                      onJenisTransaksiChange(value)
                    }}
                    className={`border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300'}`}
                  >
                    <option value="">Semua Jenis Transaksi</option>
                    {uniqueJenisTransaksi.map(jenis => (
                      <option key={jenis} value={jenis}>{jenis}</option>
                    ))}
                  </select>
                </div>
              )}
              {showTerimaDanaFilter && (
                <div className="flex flex-col min-w-0">
                  <label className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Filter Terima Dana
                  </label>
                  <select
                    value={selectedTerimaDana}
                    onChange={(e) => {
                      const value = e.target.value
                      setSelectedTerimaDana(value)
                      onTerimaDanaChange(value)
                    }}
                    className={`border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300'}`}
                  >
                    <option value="">Semua Terima Dana</option>
                    {uniqueTerimaDana.map(terima => (
                      <option key={terima} value={terima}>{terima}</option>
                    ))}
                  </select>
                </div>
              )}
              {showPembayarFeeFilter && (
                <div className="flex flex-col min-w-0">
                  <label className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Filter Pembayar Fee
                  </label>
                  <select
                    value={selectedPembayarFee}
                    onChange={(e) => {
                      const value = e.target.value
                      setSelectedPembayarFee(value)
                      onPembayarFeeChange(value)
                    }}
                    className={`border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300'}`}
                  >
                    <option value="">Semua Pembayar Fee</option>
                    {uniquePembayarFee.map(pembayar => (
                      <option key={pembayar} value={pembayar}>{pembayar}</option>
                    ))}
                  </select>
                </div>
              )}
              {showEditedFilter && (
                <div className="flex flex-col min-w-0">
                  <label className={`text-xs font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Filter Data Edit {editedCount > 0 && (
                      <span className={`inline-flex items-center justify-center min-w-[1.5rem] h-6 px-2 ml-2 rounded-full text-xs font-bold ${isDark ? 'bg-yellow-500 text-yellow-900' : 'bg-yellow-400 text-yellow-900'}`}>
                        {editedCount}
                      </span>
                    )}
                  </label>
                  <select
                    value={selectedEditedFilter}
                    onChange={(e) => {
                      const value = e.target.value
                      setSelectedEditedFilter(value)
                      onEditedFilterChange(value)
                    }}
                    className={`border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300'}`}
                  >
                    <option value="">Semua Data</option>
                    <option value="edited">Hanya Yang Diedit ({editedCount})</option>
                    <option value="not-edited">Belum Diedit ({totalCount - editedCount})</option>
                  </select>
                </div>
              )}
            </div>
            
            {/* Search Field - Full width below filters */}
            <div className="w-full">
              <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                Pencarian
              </label>
              <SearchField
                placeholder="Cari data..."
                className={`w-full border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white'} rounded-md px-3 py-2`}
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table
            className={`min-w-full divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}
          >
            <thead className={isDark ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                {editDelete && (
                  <th
                    className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-16`}
                  >
                    No
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}
                  >
                    {col.label}
                  </th>
                ))}
                {editDelete && (
                  <th
                    className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'} sticky right-0 z-10`}
                  >
                    Aksi
                  </th>
                )}
              </tr>
            </thead>
            <tbody
              className={`${isDark ? 'bg-gray-800 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'}`}
            >
              {currentData.map((item, index) => (
                <tr
                  key={item.id ?? index}
                  className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} ${item.is_edited || item.edited ? (isDark ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-200') : ''}`}
                >
                  {editDelete && (
                    <td
                      className={`px-6 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                    >
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-6 py-4 text-sm whitespace-nowrap truncate max-w-[180px]"
                    >
                      {typeof item[col.key] === 'object' && item[col.key] !== null ? (
                        <div className="leading-snug">
                          <div className="font-medium">{item[col.key].nama}</div>
                          <div className="text-xs text-gray-500">{item[col.key].nomor}</div>
                        </div>
                      ) : (
                        <div className={`${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                          {item[col.key]}
                        </div>
                      )}
                    </td>
                  ))}
                  <td
                    className={`px-6 py-4 text-right text-sm font-medium sticky right-0 z-10 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
                  >
                    <div className="flex justify-end gap-2">
                      {showView && (
                        <ButtonInput color="blue" size={btnSize} onClick={() => onView(item.id)}>
                          <HiViewfinderCircle className="mr-1" size={16} />
                          Kelola
                        </ButtonInput>
                      )}
                      {editDelete && (
                        <>
                          {hidden &&(
                            <ButtonInput
                            color="yellow"
                            size={btnSize}
                            onClick={() => handleEdit(item.id)}
                          >
                            <HiPencilSquare className="mr-1" size={16} />
                            Edit
                          </ButtonInput>
                          )}
                          <ButtonInput
                            color="red"
                            size={btnSize}
                            onClick={() => handleDelete(item.id)}
                          >
                            <HiXMark className="mr-1" size={16} />
                            Hapus
                          </ButtonInput>
                          {bayar && (
                            <ButtonInput
                              color={
                                statusHutang[item.id]?.toLowerCase() === 'bayar hutang'
                                  ? 'blue'
                                  : 'yellow'
                              }
                              size={btnSize}
                              onClick={() => onStatus(item.id)}
                              disabled={statusHutang[item.id]?.toLowerCase() === 'bayar hutang'}
                            >
                              <FaCheck size={16} />
                              {statusHutang[item.id]?.toLowerCase() === 'bayar hutang'
                                ? ''
                                : 'Bayar'}
                            </ButtonInput>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && (
          <div className={`py-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Tidak ada data sesuai filter.
          </div>
        )}

        {filteredData.length > itemsPerPage && renderPagination()}

        <AlertDialog
          isOpen={showAlertDialog}
          onClose={() => setShowAlertDialog(false)}
          title="Akses Terbatas"
          message={alertMessage}
        />
      </div>
    </>
  )
}

export default TableContent
