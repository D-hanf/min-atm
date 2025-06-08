import { FaExchangeAlt, FaStar, FaUniversity, FaWallet } from 'react-icons/fa'

import React from 'react'

const FinancialSummaryCards = ({ financialSummary, formatRupiah }) => {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <div className="bg-white shadow rounded-lg p-4 flex items-center justify-between  transition-transform hover:shadow-lg hover:-translate-y-1">
        <div className="flex items-center">
          <div className="bg-blue-100 p-2 rounded-full mr-3">
            <FaWallet className="text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Tarik Tunai</p>
            <p className="font-bold">{formatRupiah(financialSummary.cashWithdrawal)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-4 flex items-center justify-between  transition-transform hover:shadow-lg hover:-translate-y-1">
        <div className="flex items-center">
          <div className="bg-green-100 p-2 rounded-full mr-3">
            <FaExchangeAlt className="text-green-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Transfer</p>
            <p className="font-bold">{formatRupiah(financialSummary.transfer)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-4 flex items-center justify-between  transition-transform hover:shadow-lg hover:-translate-y-1">
        <div className="flex items-center">
          <div className="bg-purple-100 p-2 rounded-full mr-3">
            <FaUniversity className="text-purple-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Adm Bank</p>
            <p className="font-bold">{formatRupiah(financialSummary.bankAdmin)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-4 flex items-center justify-between  transition-transform hover:shadow-lg hover:-translate-y-1">
        <div className="flex items-center">
          <div className="bg-yellow-100 p-2 rounded-full mr-3">
            <FaStar className="text-yellow-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Profit</p>
            <p className="font-bold">{formatRupiah(financialSummary.profit)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FinancialSummaryCards