import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  HiOutlineArrowPath,
  HiOutlineCog6Tooth,
  HiOutlinePencil,
  HiOutlinePlusCircle,
  HiOutlinePrinter,
  HiOutlineQueueList,
  HiOutlineTrash,
  HiOutlineUserPlus,
  HiOutlineXCircle
} from 'react-icons/hi2'
import AlertDialog from '../../../components/AlertDialog'
import JsBarcode from 'jsbarcode'
import { useAuth } from '../../../context/AuthContext'
import { useTheme } from '../../../context/ThemeContext'
import ConfirmDialog from '../../../components/ConfirmDialog'

/* ─────────────────────────────────────────────
   KOMPONEN BARCODE — render Code128 ke <svg>
───────────────────────────────────────────── */
const Barcode = ({ value, width = 1.2, height = 35, fontSize = 10 }) => {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current && value) {
      try {
        JsBarcode(ref.current, value, {
          format: 'CODE128',
          width,
          height,
          fontSize,
          margin: 2,
          displayValue: true
        })
      } catch (e) {
        console.error('Barcode error:', e)
      }
    }
  }, [value, width, height, fontSize])
  return <svg ref={ref} />
}

/* ─────────────────────────────────────────────
   CETAK KARTU MEMBER (popup print)
   Ukuran fixed: 85.6mm × 54mm (standar kartu CR80)
───────────────────────────────────────────── */
const cetakKartu = (member, storeName = 'JAYA MART') => {
  const svg = document.createElement('svg')
  JsBarcode(svg, member.member_id, {
    format: 'CODE128',
    width: 1.5,
    height: 25,
    fontSize: 10,
    margin: 2,
    displayValue: true
  })
  const htmlCode = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Kartu Member - ${storeName}</title>
    <style>
      @page { size: 76mm 48mm; margin: 0; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      html, body { width: 76mm; height: 48mm; margin: 0; padding: 0; }
      body { font-family: Arial, Helvetica, sans-serif; display: flex; justify-content: center; align-items: center; background: #f5f5f5; }
      .card {
        width: 76mm; height: 48mm;
        background: #ffffff; border: 1px solid #d1d5db; border-radius: 3.5mm;
        padding: 3.5mm 4mm; display: flex; flex-direction: column;
        align-items: center; justify-content: space-between; overflow: hidden;
        position: relative;
      }
      .header { text-align: center; border-bottom: 1.5px solid #2563eb; width: 100%; padding-bottom: 1mm; margin-bottom: 1mm; }
      .store-name { font-size: 10pt; font-weight: 900; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.5px; }
      .card-subtitle { font-size: 6pt; color: #2563eb; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; margin-top: 0.5mm; }
      .member-info { text-align: center; margin: 0.5mm 0; }
      .nama { font-size: 9pt; font-weight: bold; color: #1f2937; text-align: center; max-width: 65mm; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
      .barcode-wrap { text-align: center; max-width: 100%; }
      .barcode-wrap svg { max-width: 65mm; height: auto; }
      @media print {
        body { background: none; }
        .card { border: none; box-shadow: none; margin: 0; }
      }
    </style></head><body>
    <div class="card">
      <div class="header">
        <div class="store-name">${storeName}</div>
        <div class="card-subtitle">KARTU MEMBER</div>
      </div>
      <div class="member-info">
        <div class="nama">${member.nama || 'PELANGGAN SETIA'}</div>
      </div>
      <div class="barcode-wrap">${svg.outerHTML}</div>
    </div>
    </div>
  </body></html>`
  
  const iframe = document.createElement('iframe')
  iframe.style.display = 'none'
  document.body.appendChild(iframe)
  iframe.contentDocument.write(htmlCode)
  iframe.contentDocument.close()
  
  setTimeout(() => {
    iframe.contentWindow.focus()
    iframe.contentWindow.print()
    setTimeout(() => {
      document.body.removeChild(iframe)
    }, 1000)
  }, 300)
}

const cetakBanyakKartu = (members, storeName = 'JAYA MART') => {
  const htmlStart = `<html><head><title>Cetak Banyak Kartu</title><style>
      @page { size: auto; margin: 0; }
      body { margin: 0; padding: 5mm; display: flex; flex-wrap: wrap; gap: 5mm; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f3f4f6; }
      .card { 
        width: 76mm; height: 48mm; padding: 2mm; background: white; 
        border-radius: 4mm; box-shadow: 0 4px 6px -1px rgb(0 0 0/0.1); 
        display: inline-flex; flex-direction: column; justify-content: flex-start;
        box-sizing: border-box; page-break-inside: avoid; border: 1px solid #e5e7eb;
        margin: 2.5mm; vertical-align: top;
      }
      .header { text-align: center; border-bottom: 1.5px solid #2563eb; width: 100%; padding-bottom: 1mm; margin-bottom: 1mm; }
      .store-name { font-size: 10pt; font-weight: 900; color: #1e3a8a; text-transform: uppercase; letter-spacing: 0.5px; }
      .card-subtitle { font-size: 6pt; color: #2563eb; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; margin-top: 0.5mm; }
      .member-info { text-align: center; margin: 0.5mm 0; }
      .nama { font-size: 9pt; font-weight: bold; color: #1f2937; text-align: center; max-width: 65mm; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
      .barcode-wrap { text-align: center; max-width: 100%; }
      .barcode-wrap svg { max-width: 65mm; height: auto; }
      @media print {
        body { background: none; padding: 0; display: block; text-align: center; }
        .card { border: 1px dashed #999 !important; box-shadow: none; }
      }
    </style></head><body>`

  let htmlContent = members.map((member) => {
    const svg = document.createElement('svg')
    JsBarcode(svg, member.member_id, { format: 'CODE128', width: 1.2, height: 30, fontSize: 11, margin: 0, displayValue: true })
    return `<div class="card">
      <div class="header">
        <div class="store-name">${storeName}</div>
        <div class="card-subtitle">KARTU MEMBER</div>
      </div>
      <div class="member-info">
        <div class="nama">${member.nama || 'PELANGGAN SETIA'}</div>
      </div>
      <div class="barcode-wrap">${svg.outerHTML}</div>
    </div>`
  }).join('')

  const htmlCode = htmlStart + htmlContent + `</body></html>`
  
  const iframe = document.createElement('iframe')
  iframe.style.display = 'none'
  document.body.appendChild(iframe)
  iframe.contentDocument.write(htmlCode)
  iframe.contentDocument.close()
  
  setTimeout(() => {
    iframe.contentWindow.focus()
    iframe.contentWindow.print()
    setTimeout(() => {
      document.body.removeChild(iframe)
    }, 1000)
  }, 300)
}

/* ─────────────────────────────────────────────
   MODAL FORM MEMBER (tambah / edit)
───────────────────────────────────────────── */
const MemberFormModal = ({ isOpen, member, onClose, onSave, isDark, allMembers = [] }) => {
  const [form, setForm] = useState({ nama: '', telepon: '', alamat: '', keterangan: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    if (member) setForm({ nama: member.nama || '', telepon: member.telepon || '', alamat: member.alamat || '', keterangan: member.keterangan || '' })
    else setForm({ nama: '', telepon: '', alamat: '', keterangan: '' })
    setError('')
  }, [member, isOpen])

  const handleSubmit = () => {
    if (form.telepon) {
      const isDuplicate = allMembers.some(
        m => m.telepon === form.telepon && m.member_id !== member?.member_id
      )
      if (isDuplicate) {
        setError(`Nomor telepon sudah terdaftar pada member lain.`)
        return
      }
    }
    setError('')
    onSave(form)
  }

  if (!isOpen) return null
  const inputCls = `w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`
  const labelCls = `block text-xs font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`w-full max-w-md rounded-xl shadow-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>{member ? 'Edit Data Member' : 'Daftarkan Member Baru'}</h2>
        {!member && <p className={`text-xs mb-4 p-3 rounded-lg ${isDark ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>💡 ID member digenerate otomatis (MB-XXXX). Identitas boleh diisi belakangan.</p>}
        <div className="space-y-3">
          {[['nama', 'Nama'], ['telepon', 'Telepon'], ['alamat', 'Alamat'], ['keterangan', 'Keterangan']].map(([f, l]) => (
            <div key={f}>
              <label className={labelCls}>{l} <span className="text-gray-400">(opsional)</span></label>
              <input className={inputCls} value={form[f]} onChange={(e) => {
                setForm(p => ({ ...p, [f]: e.target.value }))
                if (f === 'telepon') setError('')
              }} placeholder={`Isi ${l.toLowerCase()}...`} />
              {f === 'telepon' && error && <p className="text-red-500 text-xs mt-1">{error}</p>}
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className={`flex-1 py-2 rounded-lg text-sm border ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>Batal</button>
          <button onClick={handleSubmit} className="flex-1 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 font-medium">{member ? 'Simpan' : 'Daftarkan'}</button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   MODAL LINK TRANSAKSI → MEMBER
───────────────────────────────────────────── */
const LinkTransaksiModal = ({ isOpen, member, onClose, isDark }) => {
  const [transactions, setTransactions] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  useEffect(() => {
    if (!isOpen || !member) return
    const load = async () => {
      setLoading(true)
      try {
        const all = await window.api.getTransaksi('admin')
        const unlinked = all.filter(t => !t.member_id && ['Transfer', 'Tarik Tunai', 'Mode Pulsa'].includes(t.jenis_transaksi)).slice(0, 50)
        setTransactions(unlinked); setSelected(new Set()); setResult(null)
      } catch (e) { console.error(e) } finally { setLoading(false) }
    }
    load()
  }, [isOpen, member])
  const toggle = (id) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const handleLink = async () => {
    if (selected.size === 0) return
    setLoading(true)
    let totalPoin = 0; const errors = []
    for (const id of selected) {
      try { const r = await window.api.linkMemberToTransaksi({ transaksi_id: id, member_id: member.member_id }); totalPoin += r.poin_ditambahkan || 0 }
      catch (e) { errors.push(`#${id}: ${e.message}`) }
    }
    setLoading(false)
    setResult({ totalPoin, errors, count: selected.size - errors.length })
  }
  if (!isOpen) return null
  const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)
  const fmtD = (d) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[85vh] ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className={`p-5 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Kaitkan Transaksi → <span className="text-blue-500">{member?.member_id}</span></h2>
          <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Centang transaksi yang dilayani member ini. Poin otomatis dihitung & ditambahkan.</p>
        </div>
        {result ? (
          <div className="p-6 text-center">
            <div className="text-4xl mb-2">✅</div>
            <p className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>{result.count} transaksi berhasil dikaitkan</p>
            <p className={`text-sm mt-1 text-green-500`}>+{result.totalPoin} poin ditambahkan</p>
            {result.errors.length > 0 && <p className="text-xs text-red-500 mt-2">{result.errors.join(', ')}</p>}
            <button onClick={onClose} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Tutup</button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4">
              {loading && <p className={`text-center text-sm py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Memuat...</p>}
              {!loading && transactions.length === 0 && <p className={`text-center text-sm py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Tidak ada transaksi yang belum dikaitkan</p>}
              {!loading && transactions.map(t => (
                <label key={t.id} className={`flex items-center gap-3 p-3 rounded-lg mb-2 cursor-pointer border transition-colors ${selected.has(t.id) ? (isDark ? 'border-blue-500 bg-blue-900/30' : 'border-blue-400 bg-blue-50') : (isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50')}`}>
                  <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggle(t.id)} className="w-4 h-4 accent-blue-500" />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{t.jenis_transaksi} — {fmt(t.nominal_transaksi)}</p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.no_transaksi} · {fmtD(t.tanggal)}{t.nama_pelanggan ? ` · ${t.nama_pelanggan}` : ''}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className={`p-4 border-t flex gap-3 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button onClick={onClose} className={`flex-1 py-2 rounded-lg text-sm border ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>Batal</button>
              <button onClick={handleLink} disabled={selected.size === 0 || loading} className="flex-1 py-2 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 font-medium">Kaitkan {selected.size > 0 ? `(${selected.size})` : ''} Transaksi</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   MODAL RIWAYAT POIN
───────────────────────────────────────────── */
const PoinLogModal = ({ isOpen, member, onClose, isDark }) => {
  const [logs, setLogs] = useState([])
  useEffect(() => {
    if (!isOpen || !member) return
    window.api.getMemberPoinLog(member.member_id).then(setLogs).catch(console.error)
  }, [isOpen, member])
  if (!isOpen) return null
  const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0)
  const fmtD = (d) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`w-full max-w-lg rounded-xl shadow-2xl flex flex-col max-h-[80vh] ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className={`p-5 border-b ${isDark ? 'border-gray-700 text-white' : 'border-gray-200 text-gray-800'}`}>
          <h2 className="text-lg font-bold">Riwayat Poin — {member?.member_id}</h2>
          <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total: <span className="font-bold text-yellow-500">{member?.total_poin || 0} poin</span></p>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {logs.length === 0 && <p className={`text-center text-sm py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Belum ada riwayat poin</p>}
          {logs.map(log => (
            <div key={log.id} className={`flex items-center gap-3 p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <span className="text-xl">{log.poin_masuk >= 0 ? '⭐' : '🔻'}</span>
              <div className="flex-1">
                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{log.poin_masuk >= 0 ? '+' : ''}{log.poin_masuk} poin</p>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{log.keterangan}{log.nominal_transaksi ? ` · ${fmt(log.nominal_transaksi)}` : ''}</p>
                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{fmtD(log.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className={`p-4 border-t flex justify-end ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <button onClick={onClose} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Tutup</button>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   MODAL OPSI CETAK SEMUA KARTU
───────────────────────────────────────────── */
const PrintOptionModal = ({ isOpen, onClose, onPrintAll, onPrintUnprinted, isDark }) => {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`w-full max-w-sm rounded-xl shadow-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>Cetak Semua Kartu</h2>
        <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Pilih data member yang ingin dicetak (semua data di database akan diambil):</p>
        
        <div className="space-y-3">
          <button onClick={onPrintAll} className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors">
            Cetak Semua Data
          </button>
          <button onClick={onPrintUnprinted} className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm bg-indigo-600 text-white hover:bg-indigo-700 font-medium transition-colors">
            Cetak Data yang Belum Dicetak
          </button>
        </div>
        
        <button onClick={onClose} className={`w-full mt-4 py-2 rounded-lg text-sm border ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
          Batal
        </button>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   MODAL KONFIGURASI POIN (admin only)
   - Aturan perolehan poin (poin_rules CRUD)
   - Masa berlaku poin (poin_settings)
   - Reset semua poin
───────────────────────────────────────────── */
const PoinConfigModal = ({ isOpen, onClose, isDark, onRefresh }) => {
  const [rules, setRules] = useState([])
  const [settings, setSettings] = useState({ masa_berlaku_bulan: 0, terakhir_reset: null })
  const [loading, setLoading] = useState(false)
  const [newRule, setNewRule] = useState({ jenis_transaksi: '*', nominal_min: 0, nominal_max: '', poin: 1 })
  const [editingRule, setEditingRule] = useState(null)
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} })
  const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '', variant: 'warning' })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [r, s] = await Promise.all([window.api.getPoinRules(), window.api.getPoinSettings()])
      setRules(r || [])
      setSettings(s || { masa_berlaku_bulan: 0, terakhir_reset: null })
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }, [])

  useEffect(() => { if (isOpen) loadData() }, [isOpen, loadData])

  const handleSaveRule = async () => {
    const payload = {
      jenis_transaksi: newRule.jenis_transaksi || '*',
      nominal_min: Number(newRule.nominal_min) || 0,
      nominal_max: newRule.nominal_max === '' || newRule.nominal_max === null ? null : Number(newRule.nominal_max),
      poin: Number(newRule.poin) || 1
    }
    try {
      if (editingRule) {
        await window.api.updatePoinRule({ id: editingRule.id, data: payload })
      } else {
        await window.api.createPoinRule(payload)
      }
      setNewRule({ jenis_transaksi: '*', nominal_min: 0, nominal_max: '', poin: 1 })
      setEditingRule(null)
      loadData()
    } catch (e) { setAlertState({ isOpen: true, title: 'Error', message: 'Gagal: ' + e.message, variant: 'warning' }) }
  }

  const handleDeleteRule = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Aturan',
      message: 'Hapus aturan poin ini?',
      onConfirm: async () => {
        try {
          await window.api.deletePoinRule(id)
          loadData()
          setConfirmDialog(prev => ({ ...prev, isOpen: false }))
        } catch (e) { setAlertState({ isOpen: true, title: 'Error', message: 'Gagal: ' + e.message, variant: 'warning' }) }
      }
    })
  }

  const handleSaveSettings = async () => {
    try {
      await window.api.updatePoinSettings({ masa_berlaku_bulan: settings.masa_berlaku_bulan })
      setAlertState({ isOpen: true, title: 'Sukses', message: 'Pengaturan masa berlaku poin berhasil disimpan.', variant: 'success' })
    } catch (e) { setAlertState({ isOpen: true, title: 'Error', message: 'Gagal: ' + e.message, variant: 'warning' }) }
  }

  const handleResetAllPoin = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reset Poin',
      message: '⚠️ RESET SEMUA POIN MEMBER ke 0?\n\nAksi ini tidak bisa dibatalkan. Semua poin member akan dikosongkan.',
      onConfirm: async () => {
        try {
          await window.api.resetAllMemberPoin({ reason: 'Reset manual oleh admin' })
          setAlertState({ isOpen: true, title: 'Sukses', message: 'Semua poin member berhasil di-reset ke 0.', variant: 'success' })
          loadData()
          onRefresh()
          setConfirmDialog(prev => ({ ...prev, isOpen: false }))
        } catch (e) { setAlertState({ isOpen: true, title: 'Error', message: 'Gagal: ' + e.message, variant: 'warning' }) }
      }
    })
  }

  if (!isOpen) return null

  const inputCls = `w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`
  const fmtN = (n) => new Intl.NumberFormat('id-ID').format(n || 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className={`w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh] ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        />
        <div className={`p-5 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>⚙️ Konfigurasi Poin Member</h2>
          <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Atur perolehan poin & masa berlaku (khusus Admin)</p>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* ── ATURAN PEROLEHAN POIN ── */}
          <div>
            <h3 className={`text-sm font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-700'}`}>📋 Aturan Perolehan Poin</h3>
            <p className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Tentukan berapa poin yang didapat member per transaksi berdasarkan jenis dan rentang nominal.
            </p>

            {/* Form add/edit rule */}
            <div className={`grid grid-cols-5 gap-2 p-3 rounded-lg mb-3 ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <div>
                <label className={`block text-[10px] font-medium mb-0.5 ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Jenis Transaksi</label>
                <select className={inputCls} value={newRule.jenis_transaksi} onChange={e => setNewRule(p => ({ ...p, jenis_transaksi: e.target.value }))}>
                  <option value="*">Semua Jenis</option>
                  <option value="Transfer">Transfer</option>
                  <option value="Tarik Tunai">Tarik Tunai</option>
                  <option value="Mode Pulsa">Mode Pulsa</option>
                  <option value="Cek Saldo">Cek Saldo</option>
                  <option value="Jasa Transfer">Jasa Transfer</option>
                </select>
              </div>
              <div>
                <label className={`block text-[10px] font-medium mb-0.5 ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Nominal Min</label>
                <input type="number" className={inputCls} value={newRule.nominal_min} onChange={e => setNewRule(p => ({ ...p, nominal_min: e.target.value }))} placeholder="0" />
              </div>
              <div>
                <label className={`block text-[10px] font-medium mb-0.5 ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Nominal Max</label>
                <input type="number" className={inputCls} value={newRule.nominal_max} onChange={e => setNewRule(p => ({ ...p, nominal_max: e.target.value }))} placeholder="∞ (kosong)" />
              </div>
              <div>
                <label className={`block text-[10px] font-medium mb-0.5 ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Poin</label>
                <input type="number" min="1" className={inputCls} value={newRule.poin} onChange={e => setNewRule(p => ({ ...p, poin: e.target.value }))} />
              </div>
              <div className="flex items-end">
                <button onClick={handleSaveRule} className="w-full py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 font-medium">
                  {editingRule ? 'Update' : 'Tambah'}
                </button>
              </div>
            </div>

            {/* Rule list */}
            {rules.length === 0 && <p className={`text-xs text-center py-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Belum ada aturan poin. Tambahkan aturan di atas.</p>}
            {rules.map(r => (
              <div key={r.id} className={`flex items-center justify-between p-2.5 rounded-lg mb-1.5 ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {r.jenis_transaksi === '*' ? 'Semua Jenis' : r.jenis_transaksi} — <span className="text-yellow-500 font-bold">{r.poin} poin</span>
                  </p>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Nominal: Rp {fmtN(r.nominal_min)} — {r.nominal_max ? `Rp ${fmtN(r.nominal_max)}` : '∞ (tidak terbatas)'}
                  </p>
                </div>
                <div className="flex gap-1 ml-2 flex-shrink-0">
                  <button onClick={() => {
                    setEditingRule(r)
                    setNewRule({ jenis_transaksi: r.jenis_transaksi, nominal_min: r.nominal_min, nominal_max: r.nominal_max ?? '', poin: r.poin })
                  }} className={`p-1.5 rounded ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}>
                    <HiOutlinePencil size={14} className={isDark ? 'text-gray-300' : 'text-gray-500'} />
                  </button>
                  <button onClick={() => handleDeleteRule(r.id)} className={`p-1.5 rounded ${isDark ? 'hover:bg-red-900/40' : 'hover:bg-red-50'}`}>
                    <HiOutlineTrash size={14} className="text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ── MASA BERLAKU POIN ── */}
          <div className={`p-4 rounded-xl border ${isDark ? 'border-gray-700 bg-gray-700/30' : 'border-gray-200 bg-gray-50'}`}>
            <h3 className={`text-sm font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>⏰ Masa Berlaku Poin</h3>
            <p className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Tentukan berapa bulan poin berlaku sebelum direset otomatis. Set 0 = poin tidak pernah expired.
            </p>
            <div className="flex items-center gap-3">
              <select className={`${inputCls} max-w-[200px]`} value={settings.masa_berlaku_bulan} onChange={e => setSettings(p => ({ ...p, masa_berlaku_bulan: Number(e.target.value) }))}>
                <option value={0}>Selamanya (tidak expired)</option>
                <option value={1}>1 Bulan</option>
                <option value={3}>3 Bulan</option>
                <option value={6}>6 Bulan</option>
                <option value={12}>12 Bulan (1 Tahun)</option>
              </select>
              <button onClick={handleSaveSettings} className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">Simpan</button>
            </div>
            {settings.terakhir_reset && (
              <p className={`text-xs mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Terakhir reset: {new Date(settings.terakhir_reset).toLocaleString('id-ID')}
              </p>
            )}
          </div>

          {/* ── RESET POIN ── */}
          <div className={`p-4 rounded-xl border ${isDark ? 'border-red-900/50 bg-red-900/10' : 'border-red-200 bg-red-50'}`}>
            <h3 className={`text-sm font-bold mb-2 ${isDark ? 'text-red-400' : 'text-red-700'}`}>🔄 Reset Semua Poin</h3>
            <p className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Reset poin semua member ke 0. Riwayat pengurangan poin akan dicatat di log poin.
            </p>
            <button onClick={handleResetAllPoin} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 font-medium">
              Reset Semua Poin ke 0
            </button>
          </div>
        </div>

        <div className={`p-4 border-t flex justify-end ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <button onClick={onClose} className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Tutup</button>
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

/* ─────────────────────────────────────────────
   HALAMAN UTAMA MEMBER
───────────────────────────────────────────── */
const PAGE_SIZE = 15

export default function HalamanMember() {
  const { isDark } = useTheme()
  const { user } = useAuth()
  const isAdmin = user?.role?.toLowerCase() === 'admin'
  const [allMembers, setAllMembers] = useState([])
  const [totalData, setTotalData] = useState(0)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterMode, setFilterMode] = useState('month') // 'all', '7_days', '30_days', 'month', 'custom'
  const [customDate, setCustomDate] = useState({ from: '', to: '' })
  const [printStatus, setPrintStatus] = useState('all') // 'all', 'printed', 'not_printed'
  const [loading, setLoading] = useState(false)
  const [formModal, setFormModal] = useState({ open: false, member: null })
  const [linkModal, setLinkModal] = useState({ open: false, member: null })
  const [poinModal, setPoinModal] = useState({ open: false, member: null })
  const [poinConfigModal, setPoinConfigModal] = useState(false)
  const [page, setPage] = useState(1)
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} })
  const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '', variant: 'warning' })

  // Scan/lookup field — prominent at top
  const [scanValue, setScanValue] = useState('')
  const [scanResult, setScanResult] = useState(null)
  const [scanLoading, setScanLoading] = useState(false)
  const scanRef = useRef(null)

  const [namaToko, setNamaToko] = useState('JAYA MART')

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [search])

  const getDateFilter = () => {
    let dateFrom = undefined
    let dateTo = undefined
    const now = new Date()
    
    if (filterMode === 'month') {
      dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
      dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
    } else if (filterMode === '7_days') {
      const past = new Date(now)
      past.setDate(now.getDate() - 7)
      dateFrom = past.toISOString().slice(0, 10)
      dateTo = now.toISOString().slice(0, 10)
    } else if (filterMode === '30_days') {
      const past = new Date(now)
      past.setDate(now.getDate() - 30)
      dateFrom = past.toISOString().slice(0, 10)
      dateTo = now.toISOString().slice(0, 10)
    } else if (filterMode === 'custom') {
      dateFrom = customDate.from || undefined
      dateTo = customDate.to || undefined
    }
    return { dateFrom, dateTo }
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { dateFrom, dateTo } = getDateFilter()

      const res = await window.api.getMembers({
        search: debouncedSearch,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        dateFrom,
        dateTo,
        printStatus: printStatus !== 'all' ? printStatus : undefined
      })
      setAllMembers(res.data)
      setTotalData(res.total)
    }
    catch (e) { console.error(e) } finally { setLoading(false) }
  }, [debouncedSearch, page, filterMode, printStatus, customDate])

  useEffect(() => { load() }, [load])

  const [printOptionModal, setPrintOptionModal] = useState(false)

  const handleCetakSemua = () => {
    setPrintOptionModal(true)
  }

  const executeCetakDatabase = async (mode) => {
    setLoading(true)
    setPrintOptionModal(false)
    try {
      const { dateFrom, dateTo } = getDateFilter()
      // mode: 'all' or 'not_printed'
      const res = await window.api.getMembers({
        limit: 0, // no limit
        search: debouncedSearch, // apply current search
        dateFrom, // apply current date filter
        dateTo,
        printStatus: mode === 'not_printed' ? 'not_printed' : (printStatus !== 'all' ? printStatus : undefined)
      })
      
      const toPrint = res.data
      if (!toPrint || toPrint.length === 0) {
        setAlertState({ isOpen: true, title: 'Info', message: 'Tidak ada data member yang sesuai dengan filter saat ini untuk dicetak.', variant: 'info' })
        setLoading(false)
        return
      }
      
      cetakBanyakKartu(toPrint, namaToko)
      
      await window.api.markMembersPrinted(toPrint.map(m => m.member_id))
      load()
    } catch (e) {
      console.error(e)
      setAlertState({ isOpen: true, title: 'Error', message: 'Gagal mencetak: ' + e.message, variant: 'warning' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchToko = async () => {
      try {
        const res = await window.api.getToko()
        const toko = Array.isArray(res) ? res[0] : res
        if (toko?.nama_toko) {
          setNamaToko(toko.nama_toko.toUpperCase())
        }
      } catch (e) {
        console.error('Gagal memuat nama toko:', e)
      }
    }
    fetchToko()
  }, [])

  const handleSave = async (form) => {
    try {
      if (formModal.member) await window.api.updateMember({ member_id: formModal.member.member_id, data: form })
      else await window.api.createMember(form)
      setFormModal({ open: false, member: null }); load()
    } catch (e) { setAlertState({ isOpen: true, title: 'Error', message: 'Gagal: ' + e.message, variant: 'warning' }) }
  }

  const handleDeactivate = (m) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Nonaktifkan Member',
      message: `Nonaktifkan member ${m.member_id}?`,
      onConfirm: async () => {
        await window.api.deactivateMember(m.member_id)
        load()
        setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  const handleReactivate = (m) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Aktifkan Member',
      message: `Aktifkan kembali member ${m.member_id}?`,
      onConfirm: async () => {
        await window.api.reactivateMember(m.member_id)
        load()
        setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  const handleDeleteMember = (m) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Data Member',
      message: `Member ID: ${m.member_id}\nNama: ${m.nama || 'Tanpa Nama'}\nTotal Poin: ${m.total_poin}\n\nApakah Anda yakin? Data member dan riwayat poinnya akan dihapus secara permanen.`,
      onConfirm: async () => {
        try {
          await window.api.deleteMember(m.member_id)
          setAlertState({ isOpen: true, title: 'Hapus Data Member', variant: 'success', message: 'Member berhasil dihapus' })
          load()
          setConfirmDialog(prev => ({ ...prev, isOpen: false }))
        } catch (err) {
          setAlertState({ isOpen: true, title: 'Hapus Data Member', variant: 'warning', message: 'Gagal menghapus member' })
        }
      }
    })
  }

  // Barcode scan handler — kasir scan barcode, hasilnya muncul di scanValue
  const handleScan = useCallback(async (idStr) => {
    const trimmed = (idStr || '').trim()
    if (!trimmed) { setScanResult(null); return }
    setScanLoading(true)
    try {
      const res = await window.api.getMemberById(trimmed)
      setScanResult(res || null)
    } catch { setScanResult(null) } finally { setScanLoading(false) }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => handleScan(scanValue), 200)
    return () => clearTimeout(timer)
  }, [scanValue, handleScan])

  // Total pages based on totalData from DB
  const totalPages = Math.max(1, Math.ceil(totalData / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const displayed = allMembers

  const cardBg = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
  const textMain = isDark ? 'text-white' : 'text-gray-800'
  const textSub = isDark ? 'text-gray-400' : 'text-gray-500'

  return (
    <div className="space-y-5">
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
      <PrintOptionModal
        isOpen={printOptionModal}
        onClose={() => setPrintOptionModal(false)}
        onPrintAll={() => executeCetakDatabase('all')}
        onPrintUnprinted={() => executeCetakDatabase('not_printed')}
        isDark={isDark}
      />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className={`text-2xl font-bold ${textMain}`}>🏅 Data Member</h1>
          <p className={`text-sm mt-0.5 ${textSub}`}>{totalData} member terdaftar</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isAdmin && (
            <button onClick={() => setPoinConfigModal(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shadow transition-colors ${isDark ? 'bg-yellow-900/50 text-yellow-300 hover:bg-yellow-900/70' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200'}`}>
              <HiOutlineCog6Tooth size={18} /> Konfigurasi Poin
            </button>
          )}
          <button onClick={() => setFormModal({ open: true, member: null })}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow transition-colors">
            <HiOutlineUserPlus size={18} /> Daftarkan Member Baru
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input type="text" placeholder="Filter daftar: nama, ID member, atau nomor telepon..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className={`flex-1 border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400'}`} />
        <select 
          value={filterMode} 
          onChange={(e) => { setFilterMode(e.target.value); setPage(1); }}
          className={`border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
        >
          <option value="all">Semua Riwayat</option>
          <option value="7_days">7 Hari Terakhir</option>
          <option value="30_days">30 Hari Terakhir</option>
          <option value="month">Bulan Ini</option>
          <option value="custom">Custom</option>
        </select>

        {filterMode === 'custom' && (
          <div className="flex gap-2">
            <input 
              type="date"
              value={customDate.from}
              onChange={(e) => setCustomDate(p => ({ ...p, from: e.target.value }))}
              className={`border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
            />
            <span className={`self-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>-</span>
            <input 
              type="date"
              value={customDate.to}
              onChange={(e) => setCustomDate(p => ({ ...p, to: e.target.value }))}
              className={`border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
            />
          </div>
        )}

        <select 
          value={printStatus} 
          onChange={(e) => { setPrintStatus(e.target.value); setPage(1); }}
          className={`border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-800'}`}
        >
          <option value="all">Semua Cetak</option>
          <option value="printed">Sudah Dicetak</option>
          <option value="not_printed">Belum Dicetak</option>
        </select>
        <button onClick={handleCetakSemua}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shadow transition-colors ${isDark ? 'bg-indigo-900/50 text-indigo-300 hover:bg-indigo-900/70 border-indigo-700' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'}`}>
          <HiOutlinePrinter size={18} /> Cetak Semua
        </button>
      </div>
     

      {/* Grid member */}
      {loading && <p className={`text-center py-10 ${textSub}`}>Memuat data member...</p>}
      {!loading && displayed.length === 0 && (
        <div className={`text-center py-16 rounded-xl border ${cardBg}`}>
          <p className="text-4xl mb-2">👥</p>
          <p className={`font-medium ${textMain}`}>{search ? 'Member tidak ditemukan' : 'Belum ada member'}</p>
          <p className={`text-sm mt-1 ${textSub}`}>{search ? 'Coba kata kunci lain' : 'Klik "Daftarkan Member Baru" untuk mulai'}</p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayed.map((m) => (
          <div key={m.id} className={`rounded-xl border p-4 flex flex-col gap-3 hover:shadow-md transition-shadow ${cardBg} ${!m.is_active ? 'opacity-50' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-mono font-semibold truncate ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{m.member_id}</p>
                <p className={`font-semibold truncate mt-0.5 ${textMain}`}>{m.nama || <span className={`italic font-normal ${textSub}`}>Nama belum diisi</span>}</p>
                <p className={`text-xs ${textSub}`}>{m.telepon || '—'}</p>
              </div>
              <div className="text-right flex-shrink-0 ml-2">
                <p className="text-2xl font-bold text-yellow-500">{m.total_poin}</p>
                <p className={`text-xs ${textSub}`}>poin</p>
              </div>
            </div>
            <div className="flex justify-center overflow-hidden">
              <Barcode value={m.member_id} width={1.2} height={32} fontSize={9} />
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.is_active ? (isDark ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700') : (isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500')}`}>
                {m.is_active ? 'Aktif' : 'Nonaktif'}
              </span>
              <span className={`text-xs ${textSub}`}>Daftar: {new Date(m.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
            <div className={`flex flex-wrap gap-2 pt-1 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
              <button onClick={() => setFormModal({ open: true, member: m })}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium ${isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                <HiOutlinePencil size={13} /> Edit
              </button>
              <button onClick={async () => {
                cetakKartu(m, namaToko)
                try {
                  await window.api.markMembersPrinted([m.member_id])
                  load()
                } catch (e) {
                  console.error(e)
                }
              }}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium ${isDark ? 'bg-indigo-900/50 text-indigo-300 hover:bg-indigo-800/50' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'} ${m.is_printed ? 'opacity-60' : ''}`}>
                <HiOutlinePrinter size={13} /> {m.is_printed ? 'Cetak Ulang' : 'Cetak Kartu'}
              </button>
              {m.is_active && (
                <button onClick={() => setLinkModal({ open: true, member: m })}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium ${isDark ? 'bg-blue-900/50 text-blue-300 hover:bg-blue-800/50' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}>
                  <HiOutlinePlusCircle size={13} /> Kaitkan Transaksi
                </button>
              )}
              <button onClick={() => setPoinModal({ open: true, member: m })}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium ${isDark ? 'bg-yellow-900/40 text-yellow-400 hover:bg-yellow-900/60' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'}`}>
                <HiOutlineQueueList size={13} /> Riwayat Poin
              </button>
              {/* Nonaktifkan / Aktifkan / Hapus */}
              {/* {isAdmin && m.is_active && (
                <button onClick={() => handleDeactivate(m)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium ${isDark ? 'bg-amber-900/40 text-amber-400 hover:bg-amber-900/60' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}>
                  <HiOutlineXCircle size={13} /> Nonaktifkan
                </button>
              )} */}
              {isAdmin && !m.is_active && (
                <button onClick={() => handleReactivate(m)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium ${isDark ? 'bg-green-900/40 text-green-400 hover:bg-green-900/60' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                  <HiOutlineArrowPath size={13} /> Aktifkan Kembali
                </button>
              )}
              {isAdmin && (
                <button onClick={() => handleDeleteMember(m)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium ${isDark ? 'bg-red-900/40 text-red-400 hover:bg-red-900/60' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                  <HiOutlineTrash size={13} /> Hapus
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage <= 1}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-30 ${isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            ← Prev
          </button>
          <span className={`text-sm ${textSub}`}>Hal {safePage} / {totalPages} ({totalData} member)</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage >= totalPages}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-30 ${isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            Next →
          </button>
        </div>
      )}

      <MemberFormModal isOpen={formModal.open} member={formModal.member} allMembers={allMembers}
        onClose={() => setFormModal({ open: false, member: null })} onSave={handleSave} isDark={isDark} />
      <LinkTransaksiModal isOpen={linkModal.open} member={linkModal.member}
        onClose={() => { setLinkModal({ open: false, member: null }); load() }} isDark={isDark} />
      <PoinLogModal isOpen={poinModal.open} member={poinModal.member}
        onClose={() => setPoinModal({ open: false, member: null })} isDark={isDark} />
      <PoinConfigModal isOpen={poinConfigModal}
        onClose={() => setPoinConfigModal(false)} isDark={isDark} onRefresh={load} />
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
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
