import React from 'react'
import { FaUniversity, FaWallet, FaMobileAlt, FaCreditCard, FaChartLine } from 'react-icons/fa'

const FundSourcesCard = ({ totalAssets, fundSources, formatRupiah }) => {
  // Icon mapping untuk setiap sumber dana
  const getIconBySource = (sourceName) => {
    const iconMap = {
      DANA: <FaWallet className="text-blue-500" />,
      BRI: <FaUniversity className="text-orange-500" />,
      LACI: <FaCreditCard className="text-gray-600" />,
      SEABANK: <FaUniversity className="text-blue-600" />,
      MANDIRI: <FaUniversity className="text-yellow-600" />,
      EKGIPOS: <FaMobileAlt className="text-green-500" />,
      BCA: <FaUniversity className="text-blue-400" />,
      BNI: <FaUniversity className="text-orange-600" />
    }
    return iconMap[sourceName] || <FaWallet className="text-gray-500" />
  }

  // Background color mapping untuk setiap sumber dana
  const getBgColorBySource = (sourceName) => {
    const bgMap = {
      DANA: 'bg-blue-100',
      BRI: 'bg-orange-100',
      LACI: 'bg-gray-100',
      SEABANK: 'bg-blue-100',
      MANDIRI: 'bg-yellow-100',
      EKGIPOS: 'bg-green-100',
      BCA: 'bg-blue-100',
      BNI: 'bg-orange-100'
    }
    return bgMap[sourceName] || 'bg-gray-100'
  }

  return (
    <div className="grid gap-4 mb-6">
      {/* Total Aset Card - Following FinancialSummaryCards style */}
      {/* Total Aset */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Total Aset</h2>
        <div className="text-3xl font-bold text-green-600">{formatRupiah(totalAssets)}</div>
      </div>

      <h3 className="text-lg font-semibold text-gray-700 mb-4">
        Sumber Dana ({fundSources.length})
      </h3>

      {/* Sumber Dana Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {fundSources.map((source, index) => (
          <div
            key={index}
            className="bg-white shadow rounded-lg p-4 flex items-center justify-between transition-transform hover:shadow-lg hover:-translate-y-1"
          >
            <div className="flex items-center">
              <div className={`${getBgColorBySource(source.name)} p-2 rounded-full mr-3`}>
                {getIconBySource(source.name)}
              </div>
              <div>
                <p className="text-sm text-gray-500">{source.name}</p>
                <p className="font-bold">{formatRupiah(source.balance)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FundSourcesCard
