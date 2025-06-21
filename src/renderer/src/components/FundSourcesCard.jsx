import {
  FaChevronDown,
  FaChevronUp,
  FaCreditCard,
  FaMobileAlt,
  FaUniversity,
  FaWallet
} from 'react-icons/fa'

import { useState } from 'react'
import { useTheme } from '../context/ThemeContext'

const FundSourcesCard = ({ totalAssets, fundSources, formatRupiah }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const { isDark, colorScheme } = useTheme()

  // Icon mapping untuk setiap sumber dana
  const getIconBySource = (sourceName) => {
    const iconMap = {
      DANA: <FaWallet className="text-blue-500" />,
      GOPAY: <FaWallet className="text-cyan-500" />,
      OVO: <FaWallet className="text-purple-600" />,
      SHOPEEPAY: <FaWallet className="text-orange-500" />,
      LINKAJA: <FaWallet className="text-red-500" />,
      FLIP: <FaWallet className="text-pink-500" />,
      EKGIPOS: <FaMobileAlt className="text-green-500" />,

      BCA: <FaUniversity className="text-blue-400" />,
      BNI: <FaUniversity className="text-orange-600" />,
      BRI: <FaUniversity className="text-orange-500" />,
      BTN: <FaUniversity className="text-blue-800" />,
      MANDIRI: <FaUniversity className="text-yellow-600" />,
      CIMB: <FaUniversity className="text-red-500" />,
      PERMATA: <FaUniversity className="text-green-600" />,
      SEABANK: <FaUniversity className="text-blue-600" />,
      JAGO: <FaUniversity className="text-purple-500" />,

      LACI: <FaCreditCard className="text-gray-600" />,
      DOMPET: <FaWallet className="text-gray-400" />,
      KAS: <FaWallet className="text-green-700" />,
      CASH: <FaWallet className="text-green-700" />,
      PAYPAL: <FaCreditCard className="text-blue-700" />,
      WISE: <FaCreditCard className="text-teal-600" />
    }

    return iconMap[sourceName.toUpperCase()] || <FaWallet className="text-gray-500" />
  }

  // Background color mapping untuk setiap sumber dana
  const getBgColorBySource = (sourceName) => {
    const sourceKey = sourceName.toUpperCase()

    // Base color classes without dark mode variations
    const baseColorMap = {
      DANA: 'blue',
      GOPAY: 'cyan',
      OVO: 'purple',
      SHOPEEPAY: 'orange',
      LINKAJA: 'red',
      FLIP: 'pink',
      EKGIPOS: 'green',

      BCA: 'blue',
      BNI: 'orange',
      BRI: 'orange',
      BTN: 'blue',
      MANDIRI: 'yellow',
      CIMB: 'red',
      PERMATA: 'green',
      SEABANK: 'blue',
      JAGO: 'purple',

      LACI: 'gray',
      DOMPET: 'gray',
      KAS: 'green',
      CASH: 'green',
      PAYPAL: 'blue',
      WISE: 'teal'
    }

    const color = baseColorMap[sourceKey] || 'gray'

    // Apply dark mode variants
    return isDark ? `bg-${color}-800 dark:bg-${color}-900` : `bg-${color}-100 dark:bg-${color}-800`
  }

  const handleToggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  const shouldShowBanks = isExpanded || isHovered

  return (
    <div className="grid gap-4 mb-6">
      {/* Total Aset Card */}
      <div
        className={`mb-6 cursor-pointer transition-all duration-300 ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'} p-4 rounded-lg`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleToggleExpanded}
      >
        <div className="flex items-center justify-between">
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-2`}>
            Total Aset
          </h2>
          <div className="mb-2 transition-transform duration-300">
            {shouldShowBanks ? (
              <FaChevronUp className="text-blue-500" />
            ) : (
              <FaChevronDown className={isDark ? 'text-gray-500' : 'text-gray-400'} />
            )}
          </div>
        </div>
        <div className="text-3xl font-bold text-green-600">{formatRupiah(totalAssets)}</div>
      </div>

      {/* Sumber Dana Cards Grid with slide animation */}
      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${
          shouldShowBanks
            ? 'max-h-screen opacity-100 transform translate-y-0'
            : 'max-h-0 opacity-0 transform -translate-y-4'
        }`}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 p-4 gap-4">
          {fundSources.map((source, index) => (
            <div
              key={index}
              className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow rounded-lg p-4 flex items-center gap-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                shouldShowBanks ? 'animate-slideDown' : ''
              }`}
              style={{
                animationDelay: `${index * 50}ms`
              }}
            >
              <div
                className={`${getBgColorBySource(source.nama_sumber_dana)} p-2 rounded-full mr-3`}
              >
                {getIconBySource(source.nama_sumber_dana)}
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {source.nama_sumber_dana}
                </p>
                <p className={`font-bold ${isDark ? 'text-white' : ''}`}>
                  {formatRupiah(Number(source.saldo || 0))}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

export default FundSourcesCard
