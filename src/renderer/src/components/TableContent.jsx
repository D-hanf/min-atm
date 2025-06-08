import { HiPencilSquare, HiPlus, HiViewfinderCircle, HiXMark } from 'react-icons/hi2'

import ButtonInput from './ButtonInput'
import React from 'react'
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
}) => {

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden w-full">
      {/* Card Header */}
      <div className="p-4 border-b flex items-center justify-between border-gray-200 bg-gray-50">
        <div className="flex flex-col w-full">
          <h2 className="text-lg font-medium text-gray-700">{title}</h2>
          <p className="text-sm text-gray-500">{info}</p>
        </div>
        <div className='flex gap-10 w-full justify-end'>
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

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                No
              </th>
              {/* dynamic column headers */}
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
            {data.map((item, index) => (
              <tr key={item.id ?? index} className="hover:bg-gray-50">
                {/* row index */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>

                {/* dynamic cells */}
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item[col.key]}</div>
                  </td>
                ))}

                {/* action buttons */}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    {showView && (
                      <ButtonInput color="blue" size={btnSize} onClick={() => onView(item.id)}>
                        <HiViewfinderCircle className="mr-1" size={16} />
                        Kelola
                      </ButtonInput>
                    )}
                    <ButtonInput color="yellow" size={btnSize} onClick={() => onEdit(item.id)}>
                      <HiPencilSquare className="mr-1" size={16} />
                      Edit
                    </ButtonInput>

                    <ButtonInput color="red" size={btnSize} onClick={() => onDelete(item.id)}>
                      <HiXMark className="mr-1" size={16} /> Hapus
                    </ButtonInput>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* empty‑state indicator */}
      {data.length === 0 && (
        <div className="py-8 text-center text-gray-500">Belum ada data untuk ditampilkan.</div>
      )}
    </div>
  )
}

export default TableContent
