import { HiPencilSquare, HiPlus, HiViewfinderCircle, HiXMark } from 'react-icons/hi2'
import React, { useEffect, useState } from 'react'

import AlertDialog from '../components/AlertDialog'
import ButtonInput from './ButtonInput'
import SearchField from './SearchField'
import AlertDialog from './AlertDialog'
import { useTheme } from '../context/ThemeContext'

const TableContent = ({
  data = [],
  columns = [],
  onEdit = () => {},
  onDelete = () => {},
  onView = () => {},
  onAdd = () => {},
  onSearchChange = () => {},
  showView = false,
  title,
  info,
  btnSize,
  searchValue = '',
  userRole = 'admin'
}) => {
  // Add new states for logged in user and alert dialog
  const [loggedInUser, setLoggedInUser] = useState(null)
  const [showAlertDialog, setShowAlertDialog] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6
  const { isDark } = useTheme()

  const totalPages = Math.ceil(data.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const reversedData = [...data].reverse() // data terbaru di atas
  const currentData = reversedData.slice(indexOfFirstItem, indexOfLastItem)

  useEffect(() => {
    // Get user data from localStorage
    const userString = localStorage.getItem('user')
    if (userString) {
      setLoggedInUser(JSON.parse(userString))
    }
  }, [])

  const handleEdit = (id) => {
    if (!loggedInUser || loggedInUser.role !== 'admin') {
      setAlertMessage('Maaf, hanya admin yang dapat mengedit data.')
      setShowAlertDialog(true)
      return
    }
    onEdit(id)
  }

  const handleDelete = (id) => {
    if (!loggedInUser || loggedInUser.role !== 'admin') {
      setAlertMessage('Maaf, hanya admin yang dapat menghapus data.')
      setShowAlertDialog(true)
      return
    }
    onDelete(id)
  }

  const renderPagination = () => {
    const pageNumbers = []
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i)
    }

    return (
      <div className={`flex justify-between items-center px-6 py-3 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-t'}`}>
        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Halaman {currentPage} dari {totalPages}
        </p>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded text-sm ${
              isDark 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50'
            }`}
          >
            Sebelumnya
          </button>
          {pageNumbers.map((num) => (
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
            className={`px-3 py-1 rounded text-sm ${
              isDark 
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50'
            }`}
          >
            Selanjutnya
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md overflow-hidden w-full`}>
        <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex flex-col w-full">
            <h2 className={`text-lg font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>{title}</h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{info}</p>
          </div>
          <div className="flex gap-10 w-full justify-end">
            <div className="flex-1 max-w-xs">
              <SearchField
                placeholder="Cari Data"
                className={`w-full border ${isDark ? 'border-gray-700 bg-gray-700 text-white' : 'border-gray-300'} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400`}
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
              />
            </div>
            <div>{onAdd}</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className={`min-w-full divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
            <thead className={isDark ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider w-16`}>
                  No
                </th>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-6 py-3 text-left text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}
                  >
                    {col.label}
                  </th>
                ))}
                <th className={`px-6 py-3 text-right text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wider`}>
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className={`${isDark ? 'bg-gray-800 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'}`}>
              {currentData.map((item, index) => (
                <tr key={item.id ?? index} className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{item[col.key]}</div>
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      {showView && (
                        <ButtonInput color="blue" size={btnSize} onClick={() => onView(item.id)}>
                          <HiViewfinderCircle className="mr-1" size={16} />
                          Kelola
                        </ButtonInput>
                      )}
                      <ButtonInput
                        color="yellow"
                        size={btnSize}
                        onClick={() => handleEdit(item.id)}
                      >
                        <HiPencilSquare className="mr-1" size={16} />
                        Edit
                      </ButtonInput>
                      <ButtonInput color="red" size={btnSize} onClick={() => handleDelete(item.id)}>
                        <HiXMark className="mr-1" size={16} />
                        Hapus
                      </ButtonInput>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.length === 0 && (
          <div className={`py-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Belum ada data untuk ditampilkan.</div>
        )}

        {data.length > itemsPerPage && renderPagination()}

        {/* Add AlertDialog for non-admin users */}
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
