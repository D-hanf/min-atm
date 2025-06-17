import { HiPencilSquare, HiPlus, HiViewfinderCircle, HiXMark } from 'react-icons/hi2'
import React, { useState } from 'react'

import ButtonInput from './ButtonInput'
import SearchField from './SearchField'

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
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const totalPages = Math.ceil(data.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentData = data.slice(indexOfFirstItem, indexOfLastItem)

  const handleEdit = (id) => {
    if (userRole === 'kasir') {
      setShowPermissionModal(true)
      return
    }
    onEdit(id)
  }

  const handleDelete = (id) => {
    if (userRole === 'kasir') {
      setShowPermissionModal(true)
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
      <div className="flex justify-between items-center px-6 py-3 bg-gray-50 border-t">
        <p className="text-sm text-gray-600">
          Halaman {currentPage} dari {totalPages}
        </p>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded bg-gray-200 text-sm text-gray-700 hover:bg-gray-300 disabled:opacity-50"
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
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded bg-gray-200 text-sm text-gray-700 hover:bg-gray-300 disabled:opacity-50"
          >
            Selanjutnya
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden w-full">
        <div className="p-4 border-b flex items-center justify-between border-gray-200 bg-gray-50">
          <div className="flex flex-col w-full">
            <h2 className="text-lg font-medium text-gray-700">{title}</h2>
            <p className="text-sm text-gray-500">{info}</p>
          </div>
          <div className="flex gap-10 w-full justify-end">
            <div className="flex-1 max-w-xs">
              <SearchField
                placeholder="Cari Data"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
              />
            </div>
            <div>{onAdd}</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  No
                </th>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {col.label}
                  </th>
                ))}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentData.map((item, index) => (
                <tr key={item.id ?? index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </td>
                  {columns.map((col) => (
                    <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item[col.key]}</div>
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
                        color={userRole === 'kasir' ? 'gray' : 'yellow'}
                        size={btnSize}
                        onClick={() => handleEdit(item.id)}
                        className={userRole === 'kasir' ? 'opacity-60 cursor-not-allowed' : ''}
                      >
                        <HiPencilSquare className="mr-1" size={16} />
                        Edit
                      </ButtonInput>
                      <ButtonInput
                        color={userRole === 'kasir' ? 'gray' : 'red'}
                        size={btnSize}
                        onClick={() => handleDelete(item.id)}
                        className={userRole === 'kasir' ? 'opacity-60 cursor-not-allowed' : ''}
                      >
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
          <div className="py-8 text-center text-gray-500">Belum ada data untuk ditampilkan.</div>
        )}

        {data.length > itemsPerPage && renderPagination()}
      </div>

      {showPermissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600/25">
          <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 relative">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 19c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Akses Terbatas</h3>
              <p className="text-gray-600 mb-6">
                Anda memerlukan izin admin untuk melakukan aksi ini. Silakan hubungi administrator
                untuk mendapatkan akses.
              </p>
              <ButtonInput
                onClick={() => setShowPermissionModal(false)}
                color="blue"
                className="w-full"
              >
                Mengerti
              </ButtonInput>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default TableContent
