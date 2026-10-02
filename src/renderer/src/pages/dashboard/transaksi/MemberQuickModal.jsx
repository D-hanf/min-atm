import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTheme } from '../../../context/ThemeContext'
import AlertDialog from '../../../components/AlertDialog'

/**
 * MemberQuickModal — popup input cepat transaksi member.
 *
 * Perbaikan:
 * - Focus langsung ke input ID member (bukan setTimeout lagi, pakai autoFocus + trap focus)
 * - Lookup member otomatis saat mengetik (debounce 600ms) — tidak perlu tekan Enter lagi
 * - Enter di field manapun akan submit jika semua data valid
 * - ID member di posisi paling atas
 */
const MemberQuickModal = ({ isOpen, onClose, onDraftCreated, user }) => {
  const { isDark } = useTheme()
  const [nominal, setNominal] = useState('')
  const [memberInput, setMemberInput] = useState('')
  const [jenisTransaksi, setJenisTransaksi] = useState('')
  const [jenisOptions, setJenisOptions] = useState([])
  const [memberInfo, setMemberInfo] = useState(null)
  const [memberError, setMemberError] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '', variant: 'warning' })

  const memberInputRef = useRef(null)
  const debounceRef = useRef(null)


  // ──────────────────────────────────────────────
  // Helper
  // ──────────────────────────────────────────────
  const parseNominal = (val) => Number(String(val).replace(/[^0-9]/g, '')) || 0
  const formatNominal = (val) => {
    const digits = String(val).replace(/[^0-9]/g, '')
    return digits ? new Intl.NumberFormat('id-ID').format(Number(digits)) : ''
  }

  const isFormValid = jenisTransaksi.trim() !== '' && (jenisTransaksi === 'Cek Saldo' ? true : parseNominal(nominal) > 0)

  // ──────────────────────────────────────────────
  // Load jenis transaksi yang bisa dapat poin
  // ──────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return
    const load = async () => {
      try {
        const result = await window.api.getJenisTransaksiDenganPoin()
        const options = result || []
        setJenisOptions(options)
        if (options.length === 1) setJenisTransaksi(options[0])
        else setJenisTransaksi('')
      } catch {
        const fallback = ['Tarik Tunai', 'Transfer', 'Mode Pulsa']
        setJenisOptions(fallback)
        setJenisTransaksi('')
      }
    }
    load()
  }, [isOpen])

  // ──────────────────────────────────────────────
  // Reset form & focus saat modal dibuka
  // ──────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setNominal('')
      setMemberInput('')
      setMemberInfo(null)
      setMemberError('')

      // Focus ke input ID member — pakai requestAnimationFrame untuk
      // memastikan modal sudah dirender (menghindari delay lama setTimeout)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          memberInputRef.current?.focus()
        })
      })
    } else {
      // Bersihkan debounce saat modal ditutup
      clearTimeout(debounceRef.current)
    }
  }, [isOpen])

  // ──────────────────────────────────────────────
  // Lookup member
  // ──────────────────────────────────────────────
  const lookupMember = useCallback(async (query) => {
    const q = query?.trim()
    if (!q) {
      setMemberInfo(null)
      setMemberError('')
      return
    }
    setLoading(true)
    setMemberError('')
    setMemberInfo(null)
    try {
      // Cari member berdasarkan member_id atau no telepon (backend sudah mendukung keduanya)
      let result = await window.api.getMemberById(q)

      if (result) {
        setMemberInfo(result)
        setMemberError('')
      } else {
        setMemberError(`Member "${q}" tidak ditemukan`)
      }
    } catch (e) {
      setMemberError('Gagal mencari member: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // ──────────────────────────────────────────────
  // Handle perubahan input ID member
  // — auto-lookup dengan debounce 600ms
  // — jika input terdeteksi sebagai barcode scan (panjang tiba-tiba >= 8 char),
  //   lookup langsung tanpa tunggu debounce
  // ──────────────────────────────────────────────
  const handleMemberInputChange = (e) => {
    const val = e.target.value
    setMemberInput(val)
    setMemberInfo(null)
    setMemberError('')

    clearTimeout(debounceRef.current)

    if (!val.trim()) return

    // Deteksi kemungkinan barcode (panjang >= 8 karakter) → lookup cepat 100ms
    const delay = val.length >= 8 ? 100 : 600
    debounceRef.current = setTimeout(() => {
      lookupMember(val)
    }, delay)
  }

  // Enter di input ID member: batalkan debounce, lookup langsung
  const handleMemberKeyDown = (e) => {
    if (e.key === 'Enter') {
      clearTimeout(debounceRef.current)
      lookupMember(memberInput)
      e.preventDefault()
    }
  }

  // ──────────────────────────────────────────────
  // Tekan Enter di field lain → submit jika valid
  // ──────────────────────────────────────────────
  const handleFieldKeyDown = (e) => {
    if (e.key === 'Enter' && isFormValid) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // ──────────────────────────────────────────────
  // Submit draft
  // ──────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!isFormValid) return
    setSubmitting(true)
    try {
      const now = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).replace('T', ' ').slice(0, 19)
      const result = await window.api.createTransaksiDraft({
        member_id: memberInfo?.member_id ?? null,
        jenis_transaksi: jenisTransaksi,
        nominal: parseNominal(nominal),
        tanggal: now,
        user_id: user?.id ?? null,
        user_name: user?.nama || user?.name || user?.username || 'System'
      })
      if (result?.success) {
        onDraftCreated?.()
        onClose()
      }
    } catch (e) {
      setAlertState({ isOpen: true, title: 'Gagal', message: 'Gagal menyimpan draft: ' + e.message, variant: 'warning' })
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  const inputCls = `w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
    isDark
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
      : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'
  }`
  const labelCls = `block text-xs font-semibold mb-1.5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      // Klik backdrop tutup modal
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${
          isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'
        }`}
        // Hentikan event supaya klik di dalam modal tidak menutup
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700 bg-blue-900/30' : 'border-gray-100 bg-blue-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold">M</div>
              <div>
                <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Transaksi Member</h2>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Scan kartu atau isi manual, lalu tekan Enter</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`text-lg leading-none px-2 py-1 rounded-lg transition-colors ${
                isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* ── 1. ID Member / No. Telepon (PALING ATAS, auto-focus) ── */}
          <div>
            <label className={labelCls}>
              ID Member / No. Telepon
              <span className={`ml-1 font-normal ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>(opsional)</span>
            </label>
            <div className="flex gap-2">
              <input
                ref={memberInputRef}
                type="text"
                value={memberInput}
                onChange={handleMemberInputChange}
                onKeyDown={handleMemberKeyDown}
                className={`${inputCls} flex-1`}
                placeholder="Scan kartu atau ketik ID / No. Telepon..."
                autoComplete="off"
              />
              {loading && (
                <div className="flex items-center px-3">
                  <span className="animate-spin text-blue-400 text-lg">⏳</span>
                </div>
              )}
            </div>

            {/* Member ditemukan */}
            {memberInfo && (
              <div className={`mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                isDark ? 'bg-green-900/40 text-green-300 border border-green-800' : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                <span>✅</span>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold">{memberInfo.member_id}</span>
                  {memberInfo.nama && <span className="ml-1.5 opacity-80">{memberInfo.nama}</span>}
                  {memberInfo.telepon && <span className="ml-1 opacity-60 text-xs">({memberInfo.telepon})</span>}
                  <span className="ml-2 text-yellow-500 font-medium">⭐ {memberInfo.total_poin} poin</span>
                </div>
                {/* Hapus pilihan member */}
                <button
                  onClick={() => { setMemberInfo(null); setMemberInput(''); setMemberError(''); memberInputRef.current?.focus() }}
                  className="text-xs opacity-60 hover:opacity-100"
                >✕</button>
              </div>
            )}

            {/* Error */}
            {memberError && (
              <p className={`mt-2 text-xs px-3 py-2 rounded-lg ${
                isDark ? 'bg-red-900/40 text-red-300' : 'bg-red-50 text-red-600'
              }`}>
                ⚠️ {memberError}
              </p>
            )}

            {!memberInfo && !memberError && !memberInput && (
              <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Ketik atau scan barcode kartu member. Boleh dikosongkan jika tidak ada member.
              </p>
            )}
          </div>

          {/* ── 2. Jenis Transaksi ── */}
          <div>
            <label className={labelCls}>Jenis Transaksi <span className="text-red-500">*</span></label>
            <select
              value={jenisTransaksi}
              onChange={e => setJenisTransaksi(e.target.value)}
              onKeyDown={handleFieldKeyDown}
              className={inputCls}
            >
              {jenisOptions.length > 1 && <option value="">— Pilih Jenis —</option>}
              {jenisOptions.map(j => (
                <option key={j} value={j}>{j}</option>
              ))}
              {jenisOptions.length === 0 && <option value="">Memuat...</option>}
            </select>
            <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Hanya jenis transaksi yang dapat poin (diatur admin di halaman Member)
            </p>
          </div>

          {/* ── 3. Nominal ── */}
          {jenisTransaksi !== 'Cek Saldo' && (
            <div>
              <label className={labelCls}>Nominal Transaksi <span className="text-red-500">*</span></label>
              <div className="relative">
                <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium pointer-events-none ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Rp</span>
                <input
                  type="text"
                  value={formatNominal(nominal)}
                  onChange={e => setNominal(e.target.value)}
                  onKeyDown={handleFieldKeyDown}
                  className={`${inputCls} pl-9`}
                  placeholder="0"
                  inputMode="numeric"
                  autoComplete="off"
                />
              </div>
            </div>
          )}
          
          {/* Hint Enter */}
          {isFormValid && (
            <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              Tekan <kbd className={`px-1 py-0.5 rounded text-[10px] font-mono ${isDark ? 'bg-gray-700 border border-gray-600' : 'bg-gray-100 border border-gray-300'}`}>Enter</kbd> untuk menyimpan
            </p>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t flex gap-3 ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <button
            onClick={onClose}
            className={`flex-1 py-2.5 rounded-xl text-sm border font-medium transition-colors ${
              isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !isFormValid}
            className="flex-1 py-2.5 rounded-xl text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <><span className="animate-spin">⏳</span> Menyimpan...</>
            ) : (
              <><span>💾</span> Simpan Draft</>
            )}
          </button>
        </div>
      </div>
      <AlertDialog
        isOpen={alertState.isOpen}
        title={alertState.title}
        message={alertState.message}
        variant={alertState.variant}
        onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}

export default MemberQuickModal
