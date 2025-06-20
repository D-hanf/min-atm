import { FaExchangeAlt, FaStar, FaUniversity, FaWallet } from 'react-icons/fa'
import { FaMobile } from 'react-icons/fa6'
import React from 'react'
import { useTheme } from '../context/ThemeContext'

const FinancialSummaryCards = ({ financialSummary, formatRupiah, userRole }) => {
  const { isDark } = useTheme()

  return (
    <div className={`grid gap-4 mb-6 grid-cols-5`}>
      <div
        className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow rounded-lg p-4 flex items-center justify-between transition-transform hover:shadow-lg hover:-translate-y-1`}
      >
        <div className="flex items-center">
          <div className={`${isDark ? 'bg-blue-900' : 'bg-blue-100'} p-2 rounded-full mr-3`}>
            <FaWallet className="text-blue-500" />
          </div>
          <div>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Tarik Tunai</p>
            <p className={`font-bold ${isDark ? 'text-white' : ''}`}>
              {formatRupiah(financialSummary.cashWithdrawal)}
            </p>
          </div>
        </div>
      </div>

      <div
        className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow rounded-lg p-4 flex items-center justify-between transition-transform hover:shadow-lg hover:-translate-y-1`}
      >
        <div className="flex items-center">
          <div className={`${isDark ? 'bg-green-900' : 'bg-green-100'} p-2 rounded-full mr-3`}>
            <FaExchangeAlt className="text-green-500" />
          </div>
          <div>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Transfer</p>
            <p className={`font-bold ${isDark ? 'text-white' : ''}`}>
              {formatRupiah(financialSummary.transfer)}
            </p>
          </div>
        </div>
      </div>

      <div
        className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow rounded-lg p-4 flex items-center justify-between transition-transform hover:shadow-lg hover:-translate-y-1`}
      >
        <div className="flex items-center">
          <div className={`${isDark ? 'bg-purple-900' : 'bg-purple-100'} p-2 rounded-full mr-3`}>
            <FaUniversity className="text-purple-500" />
          </div>
          <div>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Adm Bank</p>
            <p className={`font-bold ${isDark ? 'text-white' : ''}`}>
              {formatRupiah(financialSummary.bankAdmin)}
            </p>
          </div>
        </div>
      </div>

      <div
        className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow rounded-lg p-4 flex items-center justify-between transition-transform hover:shadow-lg hover:-translate-y-1`}
      >
        <div className="flex items-center">
          <div className={`${isDark ? 'bg-yellow-900' : 'bg-yellow-100'} p-2 rounded-full mr-3`}>
            <FaStar className="text-yellow-500" />
          </div>
          <div>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Jumlah Admin</p>
            <p className={`font-bold ${isDark ? 'text-white' : ''}`}>
              {formatRupiah(financialSummary.profit)}
            </p>
          </div>
        </div>
      </div>

      <div
        className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow rounded-lg p-4 flex items-center justify-between transition-transform hover:shadow-lg hover:-translate-y-1`}
      >
        <div className="flex items-center">
          <div className={`${isDark ? 'bg-red-900' : 'bg-red-100'} p-2 rounded-full mr-3`}>
            <FaMobile className="text-red-500" />
          </div>
          <div>
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Mode Pulsa</p>
            <p className={`font-bold ${isDark ? 'text-white' : ''}`}>
              {formatRupiah(financialSummary.modePulsa)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FinancialSummaryCards
