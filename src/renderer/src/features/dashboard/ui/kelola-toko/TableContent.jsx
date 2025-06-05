import ButtonInput from './../../../../components/ButtonInput'
import React from 'react'

const TableContent = ({ data, columns, onEdit, onDelete }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {/* mapping table title */}
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {col.label}
              </th>
            ))}
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Aksi
            </th>
          </tr>
        </thead>
        {/* mapping table content using multiple loop */}
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item) => (
            <tr key={item.id}>
              {columns.map((col) => (
                <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                  {item[col.key]}
                </td>
              ))}
              <td className="px-6 py-4 whitespace-nowrap ">
                <div className="flex flex-col gap-y-2">
                  <ButtonInput color="yellow" size="sm" onClick={() => onEdit(item)}>
                    Edit
                  </ButtonInput>
                  <ButtonInput color="red" size="sm" onClick={() => onDelete(item.id)}>
                    Hapus
                  </ButtonInput>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
export default TableContent
