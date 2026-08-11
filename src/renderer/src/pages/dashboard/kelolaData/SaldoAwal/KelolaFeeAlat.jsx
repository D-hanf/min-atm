import React, { useEffect, useMemo, useState } from 'react'

import AlertDialog from '../../../../components/AlertDialog'
import ButtonInput from '../../../../components/ButtonInput'
import ConfirmDialog from '../../../../components/ConfirmDialog'
import { HiPlus } from 'react-icons/hi'
import InputField from '../../../../components/InputField'
import Modal from '../../../../shared/ui/Modal'
import PageContainer from '../../../../components/PageContainer'
import TableContent from '../../../../components/TableContent'
import { useTheme } from '../../../../context/ThemeContext'

// 5 menu transaksi yang ada di TransactionMenu.jsx — urutan ini juga dipakai sebagai urutan tab
const JENIS_TRANSAKSI_LIST = ['Tarik Tunai', 'Transfer', 'Jasa Transfer', 'Mode Pulsa', 'Cek Saldo']

const formatRupiah = (value) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(Number(value) || 0)

// Tampilan rentang nominal, mis. "Rp0 - Rp999.999" atau "Rp5.000.000 ke atas"
const formatRentang = (min, max) =>
  max === null || max === undefined
    ? `${formatRupiah(min)} ke atas`
    : `${formatRupiah(min)} - ${formatRupiah(max)}`

// Format angka jadi "Rp 1.000.000" — dipakai supaya saat mengetik di input fee/bonus/nominal,
// tampilannya sudah pakai prefix + pemisah ribuan ala Rupiah
const formatAngkaInput = (value) => {
  const digits = String(value ?? '').replace(/[^0-9]/g, '')
  return digits ? `Rp ${new Intl.NumberFormat('id-ID').format(Number(digits))}` : 'Rp '
}

// Balikin ke angka murni (buang "Rp" dan titik pemisah ribuan) sebelum disimpan ke state/payload
const parseAngkaInput = (value) => String(value ?? '').replace(/[^0-9]/g, '')

const emptyRuleForm = { nominal_min: '', nominal_max: '', value: '' }
const emptyAlatForm = {
  nama_alat: '',
  keterangan: '',
  is_active: true,
  bonus_tarik_tunai: '',
  sumber_dana_bonus_id: ''
}

// Input angka dengan tampilan format Rupiah + info error kecil di bawah field (tanpa modal)
const CurrencyField = ({ name, label, value, onChange, error, required = true, className = '' }) => (
  <div className={className}>
    <InputField
      name={name}
      type="text"
      value={formatAngkaInput(value)}
      onChange={(e) => onChange(parseAngkaInput(e.target.value))}
      required={required}
    >
      {label}
    </InputField>
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
)

const KelolaFeeAlat = () => {
  const { isDark } = useTheme()
  const [activeTab, setActiveTab] = useState('fee') // 'fee' | 'alat'

  const [alertMessage, setAlertMessage] = useState('')
  const [showAlert, setShowAlert] = useState(false)
  const notify = (msg) => {
    setAlertMessage(msg)
    setShowAlert(true)
  }

  return (
    <PageContainer title="Pengaturan Fee & Alat">
      <div className="flex gap-2 px-4 mb-4">
        <button
          onClick={() => setActiveTab('fee')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'fee'
              ? 'bg-indigo-600 text-white'
              : isDark
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Fee per Transaksi
        </button>
        <button
          onClick={() => setActiveTab('alat')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'alat'
              ? 'bg-indigo-600 text-white'
              : isDark
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Alat & Bonus
        </button>
      </div>

      {activeTab === 'fee' ? (
        <FeeRulesSection isDark={isDark} notify={notify} />
      ) : (
        <AlatSection isDark={isDark} notify={notify} />
      )}

      <AlertDialog
        isOpen={showAlert}
        onClose={() => setShowAlert(false)}
        title="Informasi"
        message={alertMessage}
      />
    </PageContainer>
  )
}

// =====================================================================
// SECTION 1 — Fee berjenjang per jenis transaksi
// =====================================================================

const FeeRulesSection = ({ isDark, notify }) => {
  const [jenisAktif, setJenisAktif] = useState(JENIS_TRANSAKSI_LIST[0])
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState(null) // null = mode tambah
  const [form, setForm] = useState(emptyRuleForm)
  const [fieldErrors, setFieldErrors] = useState({})
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const fetchRules = async (jenis) => {
    setLoading(true)
    try {
      const result = await window.api.getFeeRules(jenis)
      setRules(result || [])
    } catch (err) {
      console.error('❌ Gagal ambil aturan fee:', err)
      notify('Gagal mengambil data fee. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRules(jenisAktif)
  }, [jenisAktif])

  const openTambah = () => {
    setEditingRule(null)
    setForm(emptyRuleForm)
    setFieldErrors({})
    setModalOpen(true)
  }

  const openEdit = (rule) => {
    setEditingRule(rule)
    setForm({
      nominal_min: rule.nominal_min,
      nominal_max: rule.nominal_max ?? '',
      value: rule.fee
    })
    setFieldErrors({})
    setModalOpen(true)
  }

  const handleEditById = (id) => {
    const rule = rules.find((r) => r.id === id)
    if (rule) openEdit(rule)
  }

  const validate = () => {
    const errors = {}
    if (form.nominal_min === '' || form.nominal_min === null || form.nominal_min === undefined) {
      errors.nominal_min = 'Nominal minimum wajib diisi.'
    }
    if (form.value === '' || form.value === null || form.value === undefined) {
      errors.value = 'Fee wajib diisi.'
    }
    if (
      form.nominal_max !== '' &&
      form.nominal_min !== '' &&
      Number(form.nominal_max) <= Number(form.nominal_min)
    ) {
      errors.nominal_max = 'Nominal maksimum harus lebih besar dari nominal minimum.'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    const payload = {
      jenis_transaksi: jenisAktif,
      nominal_min: Number(form.nominal_min),
      nominal_max: form.nominal_max === '' ? null : Number(form.nominal_max),
      fee: Number(form.value)
    }

    try {
      if (editingRule) {
        await window.api.updateFeeRule({ id: editingRule.id, ...payload })
      } else {
        await window.api.createFeeRule(payload)
      }
      setModalOpen(false)
      fetchRules(jenisAktif)
    } catch (err) {
      console.error('❌ Gagal simpan aturan fee:', err)
      notify(err?.message || 'Gagal menyimpan aturan fee.')
    }
  }

  const handleDelete = async () => {
    try {
      await window.api.deleteFeeRule(confirmDeleteId)
      setConfirmDeleteId(null)
      fetchRules(jenisAktif)
    } catch (err) {
      console.error('❌ Gagal hapus aturan fee:', err)
      notify(err?.message || 'Gagal menghapus aturan fee.')
    }
  }

  const tableData = useMemo(
    () =>
      rules.map((rule) => ({
        ...rule,
        rentang: formatRentang(rule.nominal_min, rule.nominal_max),
        feeDisplay: formatRupiah(rule.fee)
      })),
    [rules]
  )

  return (
    <div className="px-4">
      {/* Sub-tab jenis transaksi */}
      <div className="flex flex-wrap gap-2 mb-4">
        {JENIS_TRANSAKSI_LIST.map((jenis) => (
          <button
            key={jenis}
            onClick={() => setJenisAktif(jenis)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              jenisAktif === jenis
                ? 'bg-emerald-600 text-white border-emerald-600'
                : isDark
                  ? 'border-gray-700 text-gray-300 hover:border-emerald-600'
                  : 'border-gray-300 text-gray-600 hover:border-emerald-600'
            }`}
          >
            {jenis}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Memuat data...</p>
      ) : (
        <TableContent
          title={`Rentang Fee — ${jenisAktif}`}
          info='Semakin besar nominal transaksi, fee bisa diatur semakin besar. Rentang tidak boleh tumpang tindih.'
          data={tableData}
          columns={[
            { key: 'rentang', label: 'Rentang Nominal' },
            { key: 'feeDisplay', label: 'Fee' }
          ]}
          onEdit={handleEditById}
          onDelete={(id) => setConfirmDeleteId(id)}
          onAdd={() => (
            <ButtonInput size="xs" onClick={openTambah}>
              <HiPlus size={16} />
              Tambah Rentang
            </ButtonInput>
          )}
          btnSize="xs"
        />
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        title={editingRule ? 'Edit Rentang Fee' : `Tambah Rentang Fee — ${jenisAktif}`}
      >
        <CurrencyField
          name="nominal_min"
          label="Nominal Minimum"
          value={form.nominal_min}
          onChange={(v) => setForm({ ...form, nominal_min: v })}
          error={fieldErrors.nominal_min}
        />
        <CurrencyField
          name="nominal_max"
          label='Nominal Maksimum (kosongkan jika "ke atas")'
          value={form.nominal_max}
          onChange={(v) => setForm({ ...form, nominal_max: v })}
          error={fieldErrors.nominal_max}
          required={false}
        />
        <CurrencyField
          name="value"
          label="Fee (Rp)"
          className="col-span-2"
          value={form.value}
          onChange={(v) => setForm({ ...form, value: v })}
          error={fieldErrors.value}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}

// =====================================================================
// SECTION 2 — Master alat + bonus berjenjang per alat
// =====================================================================

const AlatSection = ({ isDark, notify }) => {
  const [alatList, setAlatList] = useState([])
  const [loading, setLoading] = useState(true)

  const [alatModalOpen, setAlatModalOpen] = useState(false)
  const [editingAlat, setEditingAlat] = useState(null)
  const [alatForm, setAlatForm] = useState(emptyAlatForm)
  const [alatFieldErrors, setAlatFieldErrors] = useState({})
  const [confirmDeleteAlatId, setConfirmDeleteAlatId] = useState(null)

  const [sumberDanaList, setSumberDanaList] = useState([])

  useEffect(() => {
    const fetchSumberDana = async () => {
      try {
        if (window.api && window.api.getSaldoAwal) {
          const result = await window.api.getSaldoAwal()
          setSumberDanaList(result || [])
        }
      } catch (err) {
        console.error('❌ Gagal ambil data sumber dana:', err)
      }
    }
    fetchSumberDana()
  }, [])

  const fetchAlat = async () => {
    setLoading(true)
    try {
      const result = await window.api.getAlat()
      setAlatList(result || [])
    } catch (err) {
      console.error('❌ Gagal ambil data alat:', err)
      notify('Gagal mengambil data alat. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlat()
  }, [])

  const openTambahAlat = () => {
    setEditingAlat(null)
    setAlatForm(emptyAlatForm)
    setAlatFieldErrors({})
    setAlatModalOpen(true)
  }

  const openEditAlat = (alat) => {
    setEditingAlat(alat)
    setAlatForm({
      nama_alat: alat.nama_alat,
      keterangan: alat.keterangan || '',
      is_active: !!alat.is_active,
      bonus_tarik_tunai: alat.bonus_tarik_tunai ?? '',
      sumber_dana_bonus_id: alat.sumber_dana_bonus_id ?? ''
    })
    setAlatFieldErrors({})
    setAlatModalOpen(true)
  }

  const handleEditAlatById = (id) => {
    const alat = alatList.find((a) => a.id === id)
    if (alat) openEditAlat(alat)
  }

  const validateAlat = () => {
    const errors = {}
    if (!alatForm.nama_alat.trim()) errors.nama_alat = 'Nama alat wajib diisi.'
    setAlatFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmitAlat = async () => {
    if (!validateAlat()) return
    try {
      const payload = {
        nama_alat: alatForm.nama_alat,
        keterangan: alatForm.keterangan,
        bonus_tarik_tunai: alatForm.bonus_tarik_tunai === '' ? 0 : Number(alatForm.bonus_tarik_tunai),
        sumber_dana_bonus_id: alatForm.sumber_dana_bonus_id === '' ? null : Number(alatForm.sumber_dana_bonus_id)
      }

      if (editingAlat) {
        await window.api.updateAlat({
          id: editingAlat.id,
          ...payload,
          is_active: alatForm.is_active ? 1 : 0
        })
      } else {
        await window.api.createAlat(payload)
      }
      setAlatModalOpen(false)
      fetchAlat()
    } catch (err) {
      console.error('❌ Gagal simpan alat:', err)
      notify(err?.message || 'Gagal menyimpan alat.')
    }
  }

  const handleDeleteAlat = async () => {
    try {
      await window.api.deleteAlat(confirmDeleteAlatId)
      setConfirmDeleteAlatId(null)
      fetchAlat()
    } catch (err) {
      console.error('❌ Gagal hapus alat:', err)
      notify('Gagal menghapus alat.')
    }
  }

  const tableData = useMemo(
    () =>
      alatList.map((alat) => ({
        ...alat,
        statusDisplay: alat.is_active ? 'Aktif' : 'Nonaktif',
        bonusTarikTunaiDisplay: formatRupiah(alat.bonus_tarik_tunai)
      })),
    [alatList]
  )

  return (
    <div className="px-4 flex flex-col gap-6">
      {loading ? (
        <p className="text-gray-500 text-sm">Memuat data...</p>
      ) : (
        <TableContent
          title="Daftar Alat"
          info="Setiap alat punya rentang bonus sendiri berdasarkan nominal transaksi (mirip fee)."
          data={tableData}
          columns={[
            { key: 'nama_alat', label: 'Nama Alat' },
            // { key: 'bonusTarikTunaiDisplay', label: 'Bonus Tarik Tunai' },
            { key: 'statusDisplay', label: 'Status' },
            { key: 'keterangan', label: 'Keterangan' },
          ]}
          onEdit={handleEditAlatById}
          onDelete={(id) => setConfirmDeleteAlatId(id)}
          onAdd={() => (
            <ButtonInput size="xs" onClick={openTambahAlat}>
              <HiPlus size={16} />
              Tambah Alat
            </ButtonInput>
          )}
          btnSize="xs"
        />
      )}

      <AlatBonusJenisTable alatList={alatList} isDark={isDark} notify={notify} />

      <Modal
        isOpen={alatModalOpen}
        onClose={() => setAlatModalOpen(false)}
        onSubmit={handleSubmitAlat}
        title={editingAlat ? 'Edit Alat' : 'Tambah Alat'}
      >
        <div className="col-span-2">
          <InputField
            name="nama_alat"
            type="text"
            value={alatForm.nama_alat}
            onChange={(e) => setAlatForm({ ...alatForm, nama_alat: e.target.value })}
          >
            Nama Alat
          </InputField>
          {alatFieldErrors.nama_alat && (
            <p className="text-xs text-red-500 mt-1">{alatFieldErrors.nama_alat}</p>
          )}
        </div>
        <InputField
          name="keterangan"
          className="col-span-2"
          value={alatForm.keterangan}
          onChange={(e) => setAlatForm({ ...alatForm, keterangan: e.target.value })}
          required={false}
        >
          Keterangan
        </InputField>
      
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-sm font-medium">Sumber Dana Tujuan Bonus (default)</label>
          <select
            value={alatForm.sumber_dana_bonus_id}
            onChange={(e) => setAlatForm({ ...alatForm, sumber_dana_bonus_id: e.target.value })}
            className={`border rounded-md px-3 py-2 text-sm ${
              isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300'
            }`}
          >
            <option value="">Pilih sumber dana (opsional)</option>
            {sumberDanaList.map((sd) => (
              <option key={sd.id} value={sd.id}>
                {sd.nama_sumber_dana}
              </option>
            ))}
          </select>
        </div>
        {editingAlat && (
          <label className="col-span-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={alatForm.is_active}
              onChange={(e) => setAlatForm({ ...alatForm, is_active: e.target.checked })}
            />
            Alat aktif
          </label>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDeleteAlatId}
        onClose={() => setConfirmDeleteAlatId(null)}
        onConfirm={handleDeleteAlat}
      />
    </div>
  )
}

// =====================================================================
// BONUS ALAT PER JENIS TRANSAKSI — berjenjang berdasarkan rentang nominal,
// sekaligus per jenis transaksi (mirip FeeRulesSection, tapi tiap baris juga
// terikat ke 1 alat). Tab jenis transaksi di atas, tabel di bawahnya
// menampilkan SEMUA alat sebagai baris (alat bisa punya beberapa rentang).
// =====================================================================

const emptyAlatBonusJenisForm = { alat_id: '', nominal_min: '', nominal_max: '', value: '' }

const AlatBonusJenisTable = ({ alatList, isDark, notify }) => {
  const [jenisAktif, setJenisAktif] = useState(JENIS_TRANSAKSI_LIST[0])
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRule, setEditingRule] = useState(null) // null = mode tambah
  const [form, setForm] = useState(emptyAlatBonusJenisForm)
  const [fieldErrors, setFieldErrors] = useState({})
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const fetchRules = async (jenis) => {
    setLoading(true)
    try {
      const result = await window.api.getAlatBonusJenisRules({ jenis_transaksi: jenis })
      setRules(result || [])
    } catch (err) {
      console.error('❌ Gagal ambil aturan bonus alat per jenis transaksi:', err)
      notify('Gagal mengambil data bonus. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRules(jenisAktif)
  }, [jenisAktif])

  const openTambah = () => {
    setEditingRule(null)
    setForm(emptyAlatBonusJenisForm)
    setFieldErrors({})
    setModalOpen(true)
  }

  const openEdit = (rule) => {
    setEditingRule(rule)
    setForm({
      alat_id: rule.alat_id,
      nominal_min: rule.nominal_min,
      nominal_max: rule.nominal_max ?? '',
      value: rule.bonus
    })
    setFieldErrors({})
    setModalOpen(true)
  }

  const handleEditById = (id) => {
    const rule = rules.find((r) => r.id === id)
    if (rule) openEdit(rule)
  }

  const isCekSaldo = jenisAktif === 'Cek Saldo'

  const validate = () => {
    const errors = {}
    if (!form.alat_id) {
      errors.alat_id = 'Alat wajib dipilih.'
    }
    if (!isCekSaldo && (form.nominal_min === '' || form.nominal_min === null || form.nominal_min === undefined)) {
      errors.nominal_min = 'Nominal minimum wajib diisi.'
    }
    if (form.value === '' || form.value === null || form.value === undefined) {
      errors.value = 'Bonus wajib diisi.'
    }
    if (
      !isCekSaldo &&
      form.nominal_max !== '' &&
      form.nominal_min !== '' &&
      Number(form.nominal_max) <= Number(form.nominal_min)
    ) {
      errors.nominal_max = 'Nominal maksimum harus lebih besar dari nominal minimum.'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    // Bonus Cek Saldo tidak berjenjang — selalu 1 nilai flat per alat yang
    // berlaku untuk semua nominal (nominal_min = 0, nominal_max = tak terbatas).
    const payload = isCekSaldo
      ? {
          alat_id: Number(form.alat_id),
          jenis_transaksi: jenisAktif,
          nominal_min: 0,
          nominal_max: null,
          bonus: Number(form.value)
        }
      : {
          alat_id: Number(form.alat_id),
          jenis_transaksi: jenisAktif,
          nominal_min: Number(form.nominal_min),
          nominal_max: form.nominal_max === '' ? null : Number(form.nominal_max),
          bonus: Number(form.value)
        }

    try {
      if (editingRule) {
        await window.api.updateAlatBonusJenisRule({ id: editingRule.id, ...payload })
      } else {
        await window.api.createAlatBonusJenisRule(payload)
      }
      setModalOpen(false)
      fetchRules(jenisAktif)
    } catch (err) {
      console.error('❌ Gagal simpan aturan bonus:', err)
      notify(err?.message || 'Gagal menyimpan aturan bonus.')
    }
  }

  const handleDelete = async () => {
    try {
      await window.api.deleteAlatBonusJenisRule(confirmDeleteId)
      setConfirmDeleteId(null)
      fetchRules(jenisAktif)
    } catch (err) {
      console.error('❌ Gagal hapus aturan bonus:', err)
      notify(err?.message || 'Gagal menghapus aturan bonus.')
    }
  }

  const tableData = useMemo(
    () =>
      rules.map((rule) => ({
        ...rule,
        alatDisplay: rule.nama_alat || alatList.find((a) => String(a.id) === String(rule.alat_id))?.nama_alat || '-',
        rentang: formatRentang(rule.nominal_min, rule.nominal_max),
        bonusDisplay: formatRupiah(rule.bonus)
      })),
    [rules, alatList]
  )

  return (
    <div>
      {/* Sub-tab jenis transaksi — gaya sama dengan FeeRulesSection */}
      <div className="flex flex-wrap gap-2 mb-4">
        {JENIS_TRANSAKSI_LIST.map((jenis) => (
          <button
            key={jenis}
            onClick={() => setJenisAktif(jenis)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              jenisAktif === jenis
                ? 'bg-emerald-600 text-white border-emerald-600'
                : isDark
                  ? 'border-gray-700 text-gray-300 hover:border-emerald-600'
                  : 'border-gray-300 text-gray-600 hover:border-emerald-600'
            }`}
          >
            {jenis}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Memuat data...</p>
      ) : (
        <TableContent
          title={`Bonus Alat — ${jenisAktif}`}
          info={
            isCekSaldo
              ? 'Bonus Cek Saldo bersifat flat per alat (tidak berjenjang berdasarkan nominal).'
              : 'Tiap alat bisa punya beberapa rentang nominal, dengan bonus berbeda-beda per rentang. Rentang tidak boleh tumpang tindih untuk alat yang sama.'
          }
          data={tableData}
          columns={
            isCekSaldo
              ? [
                  { key: 'alatDisplay', label: 'Alat' },
                  { key: 'bonusDisplay', label: 'Bonus' }
                ]
              : [
                  { key: 'alatDisplay', label: 'Alat' },
                  { key: 'rentang', label: 'Rentang Nominal' },
                  { key: 'bonusDisplay', label: 'Bonus' }
                ]
          }
          onEdit={handleEditById}
          onDelete={(id) => setConfirmDeleteId(id)}
          onAdd={() => (
            <ButtonInput size="xs" onClick={openTambah}>
              <HiPlus size={14} />
              {isCekSaldo ? 'Tambah Bonus' : 'Tambah Rentang'}
            </ButtonInput>
          )}
          btnSize="xs"
        />
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        title={
          editingRule
            ? isCekSaldo
              ? 'Edit Bonus Cek Saldo'
              : 'Edit Rentang Bonus'
            : isCekSaldo
              ? 'Tambah Bonus Cek Saldo'
              : `Tambah Rentang Bonus — ${jenisAktif}`
        }
      >
        <div className="col-span-2 flex flex-col gap-1">
          <label className="text-sm font-medium">Alat</label>
          <select
            value={form.alat_id}
            onChange={(e) => setForm({ ...form, alat_id: e.target.value })}
            className={`border rounded-md px-3 py-2 text-sm ${
              isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300'
            }`}
          >
            <option value="">Pilih alat</option>
            {alatList.map((alat) => (
              <option key={alat.id} value={alat.id}>
                {alat.nama_alat}
                {!alat.is_active ? ' (Nonaktif)' : ''}
              </option>
            ))}
          </select>
          {fieldErrors.alat_id && <p className="text-xs text-red-500 mt-1">{fieldErrors.alat_id}</p>}
        </div>

        {!isCekSaldo && (
          <>
            <CurrencyField
              name="nominal_min"
              label="Nominal Minimum"
              value={form.nominal_min}
              onChange={(v) => setForm({ ...form, nominal_min: v })}
              error={fieldErrors.nominal_min}
            />
            <CurrencyField
              name="nominal_max"
              label='Nominal Maksimum (kosongkan jika "ke atas")'
              value={form.nominal_max}
              onChange={(v) => setForm({ ...form, nominal_max: v })}
              error={fieldErrors.nominal_max}
              required={false}
            />
          </>
        )}
        <CurrencyField
          name="value"
          label="Bonus (Rp)"
          className="col-span-2"
          value={form.value}
          onChange={(v) => setForm({ ...form, value: v })}
          error={fieldErrors.value}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}

export default KelolaFeeAlat