import { HiPencilSquare, HiViewfinderCircle, HiXMark } from 'react-icons/hi2'
import React, { useEffect, useState } from 'react'

import AlertDialog from './AlertDialog'
import ButtonInput from './ButtonInput'
import SearchField from './SearchField'
import { useTheme } from '../context/ThemeContext'

const TableContent = ({
  data = [],
  columns = [],
  onEdit = () => {},
  onDateChange = () => {},
  onDelete = () => {},
  onView = () => {},
  onAdd = () => {},
  onSearchChange = () => {},
  showView = false,
  editDelete = true,
  title,
  info,
  btnSize,
  searchValue = '',
  userRole = 'admin',
  showDateFilter = false // << TAMBAHAN DI SINI
}) => {
  const [loggedInUser, setLoggedInUser] = useState(null)
  const [showAlertDialog, setShowAlertDialog] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedDate, setSelectedDate] = useState('')
  const itemsPerPage = 20
  const { isDark } = useTheme()

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

  // Filtering berdasarkan tanggal dan search
  const DataItems = data
  const filteredData = DataItems.filter((item) => {
    const rawDate = item.tanggal || item.tanggal_pengambilan || ''
    const itemDate = rawDate ? new Date(rawDate).toISOString().slice(0, 10) : ''

    const matchDate = showDateFilter && selectedDate ? itemDate === selectedDate : true

    const matchSearch = searchValue
      ? JSON.stringify(item).toLowerCase().includes(searchValue.toLowerCase())
      : true

    return matchDate && matchSearch
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
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
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
        ))}
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
          <div className="flex flex-wrap gap-3 w-full sm:w-auto items-center justify-end">
            {showDateFilter && (
              <div className="flex flex-col">
                <label className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  Filter Tanggal
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className={`border rounded px-2 py-1 text-sm ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300'}`}
                />
              </div>
            )}
            <div className="flex-1 max-w-xs">
              <SearchField
                placeholder="Cari Data"
                className={`w-full border ${isDark ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-300'} rounded-lg px-3 py-2`}
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
              />
            </div>
            <div>{onAdd}</div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table
            className={`min-w-full divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}
          >
            <thead className={isDark ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                {editDelete && (<th
                  className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-16`}
                >
                  No
                </th>)}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}
                  >
                    {col.label}
                  </th>
                ))}
                {editDelete && (<th
                  className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-50'} sticky right-0 z-10`}
                >
                  Aksi
                </th>)}
              </tr>
            </thead>
            <tbody
              className={`${isDark ? 'bg-gray-800 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'}`}
            >
              {currentData.map((item, index) => (
                <tr
                  key={item.id ?? index}
                  className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}
                >
                 {editDelete && ( <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>)}
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
                          <ButtonInput
                            color="yellow"
                            size={btnSize}
                            onClick={() => handleEdit(item.id)}
                          >
                            <HiPencilSquare className="mr-1" size={16} />
                            Edit
                          </ButtonInput>
                          <ButtonInput
                            color="red"
                            size={btnSize}
                            onClick={() => handleDelete(item.id)}
                          >
                            <HiXMark className="mr-1" size={16} />
                            Hapus
                          </ButtonInput>
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
