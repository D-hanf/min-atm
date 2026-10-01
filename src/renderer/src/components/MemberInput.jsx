import React, { useEffect, useState } from 'react'
import { HiOutlineCheckBadge, HiOutlineExclamationTriangle, HiOutlineQrCode } from 'react-icons/hi2'
import { useTheme } from '../context/ThemeContext'

export default function MemberInput({ value = '', onChange }) {
  const { isDark } = useTheme()
  const [memberInfo, setMemberInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [errorText, setErrorText] = useState('')

  useEffect(() => {
    const trimmed = (value || '').trim()
    if (!trimmed) {
      setMemberInfo(null)
      setErrorText('')
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await window.api.getMemberById(trimmed)
        if (res) {
          setMemberInfo(res)
          setErrorText('')
        } else {
          setMemberInfo(null)
          setErrorText('ID Member tidak terdaftar')
        }
      } catch (err) {
        setMemberInfo(null)
        setErrorText('Gagal memeriksa member')
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [value])

  const inputCls = `w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono ${
    isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
  }`
  const labelCls = `block text-xs font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className={labelCls}>
          🏅 ID Member / Scan Kartu <span className="text-gray-400 font-normal">(opsional)</span>
        </label>
        <span className="text-[11px] text-blue-500 flex items-center gap-1 font-mono">
          <HiOutlineQrCode size={13} /> Scan / Ketik ID
        </span>
      </div>

      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value.toUpperCase())}
        placeholder="Contoh: MB-1001 (atau scan barcode)"
        className={inputCls}
      />

      {loading && <p className="text-xs text-gray-400 italic">Mengecek ID member...</p>}

      {!loading && memberInfo && (
        <div
          className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium ${
            memberInfo.is_active
              ? isDark
                ? 'bg-green-900/30 text-green-300 border border-green-800'
                : 'bg-green-50 text-green-700 border border-green-200'
              : isDark
                ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-800'
                : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
          }`}
        >
          {memberInfo.is_active ? (
            <HiOutlineCheckBadge size={16} className="text-green-500 flex-shrink-0" />
          ) : (
            <HiOutlineExclamationTriangle size={16} className="text-yellow-500 flex-shrink-0" />
          )}
          <span>
            {memberInfo.is_active ? 'Member Aktif' : 'Member Nonaktif'}:{' '}
            <strong>{memberInfo.nama || memberInfo.member_id}</strong> ({memberInfo.total_poin} poin)
          </span>
        </div>
      )}

      {!loading && errorText && value && (
        <p className="text-xs text-red-500 font-medium">⚠️ {errorText}</p>
      )}
    </div>
  )
}
