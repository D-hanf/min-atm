import React, { useEffect, useState } from 'react'

// ─────────────────────────────────────────────────────────
// Widget khusus ADMIN: atur berapa hari ke belakang dari hari ini
// data yang boleh dilihat role KASIR di halaman ini.
//
// TIDAK ADA opsi "tidak dibatasi" — kasir SELALU dibatasi. Default 1
// hari (hari ini saja), admin cuma bisa naikkan/turunkan jumlah harinya
// (minimal 1), bukan menonaktifkan pembatasannya.
//
// Setting-nya PER HALAMAN — dibedakan lewat prop `pageKey`
// (mis. 'semua-transaksi', 'koreksi-transaksi'). Mengatur di satu
// halaman TIDAK mempengaruhi halaman lain, walaupun komponennya
// dipakai bareng-bareng di banyak halaman.
//
// Cuma dirender kalau isAdmin true (dicek dari parent).
// Setelah berhasil disimpan, panggil onSaved(setting) supaya
// parent bisa langsung re-filter data yang sedang ditampilkan.
// ─────────────────────────────────────────────────────────

const DataVisibilitySettings = ({ pageKey, pageLabel, onSaved }) => {
	const [isLoading, setIsLoading] = useState(true)
	const [days, setDays] = useState(1)
	const [savedDays, setSavedDays] = useState(1)
	const [isSaving, setIsSaving] = useState(false)
	const [savedMessage, setSavedMessage] = useState('')

	useEffect(() => {
		if (!pageKey) return
		let isMounted = true
		const fetchSetting = async () => {
			try {
				setIsLoading(true)
				const result = await window.api?.getDataVisibilitySetting?.(pageKey)
				if (isMounted && result) {
					const nextDays = Number(result.days) > 0 ? Number(result.days) : 1
					setDays(nextDays)
					setSavedDays(nextDays)
				}
			} catch (error) {
				console.error('❌ Gagal ambil setting visibilitas data:', error)
			} finally {
				if (isMounted) setIsLoading(false)
			}
		}
		fetchSetting()
		return () => {
			isMounted = false
		}
	}, [pageKey])

	const cleanDays = Math.max(1, Number(days) || 1)
	const isDirty = cleanDays !== savedDays

	const adjustDays = (delta) => {
		setDays((d) => Math.max(1, Number(d || 1) + delta))
	}

	const handleSave = async () => {
		if (!pageKey) return
		try {
			setIsSaving(true)
			setSavedMessage('')
			const result = await window.api?.saveDataVisibilitySetting?.({ pageKey, days: cleanDays })
			if (result?.success) {
				setDays(result.days)
				setSavedDays(result.days)
				setSavedMessage('Perubahan tersimpan.')
				onSaved?.({ days: result.days })
				setTimeout(() => setSavedMessage(''), 2500)
			}
		} catch (error) {
			console.error('❌ Gagal simpan setting visibilitas data:', error)
			setSavedMessage('Gagal menyimpan, coba lagi.')
		} finally {
			setIsSaving(false)
		}
	}

	if (isLoading) {
		return (
			<div className="mb-4 h-[68px] animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
		)
	}

	return (
		<div className="mb-4 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
			<div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
				<div className="flex items-start gap-3">
					<span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-base text-amber-600">
						🔒
					</span>
					<div>
						<div className="flex items-center gap-2">
							<span className="text-sm font-semibold text-gray-800">
								Visibilitas Data Kasir
							</span>
							{pageLabel && (
								<span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
									{pageLabel}
								</span>
							)}
						</div>
						<p className="mt-0.5 text-xs text-gray-500">
							Kasir hanya melihat data {savedDays} hari terakhir di halaman ini
						</p>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<span className="text-sm text-gray-600">Tampilkan</span>
					<div className="flex items-center rounded-lg border border-gray-300 bg-white">
						<button
							type="button"
							onClick={() => adjustDays(-1)}
							className="px-2.5 py-1.5 text-gray-500 hover:text-gray-800"
							aria-label="Kurangi hari"
						>
							−
						</button>
						<input
							type="number"
							min={1}
							value={days}
							onChange={(e) => setDays(e.target.value)}
							className="w-12 border-x border-gray-300 bg-transparent py-1.5 text-center text-sm outline-none"
						/>
						<button
							type="button"
							onClick={() => adjustDays(1)}
							className="px-2.5 py-1.5 text-gray-500 hover:text-gray-800"
							aria-label="Tambah hari"
						>
							+
						</button>
					</div>
					<span className="text-sm text-gray-600">hari terakhir</span>
				</div>
			</div>

			{(isDirty || savedMessage) && (
				<div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-slate-50 px-4 py-2.5">
					{savedMessage && (
						<span
							className={`text-xs ${savedMessage.startsWith('Gagal') ? 'text-red-600' : 'text-emerald-600'}`}
						>
							{savedMessage}
						</span>
					)}
					{isDirty && (
						<button
							type="button"
							onClick={handleSave}
							disabled={isSaving}
							className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-60"
						>
							{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
						</button>
					)}
				</div>
			)}
		</div>
	)
}

export default DataVisibilitySettings