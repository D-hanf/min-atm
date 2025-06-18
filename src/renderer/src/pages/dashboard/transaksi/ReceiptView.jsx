const ReceiptView = ({ financialSummary, fundSources, formatRupiah }) => {
  return (
    <div className="print-only p-6">
      <h2 className="text-xl font-bold mb-4">Ringkasan Keuangan</h2>

      <div className="mb-4">
        <h3 className="font-semibold mb-2">Transaksi</h3>
        <ul className="space-y-1">
          <li>Tarik Tunai: {formatRupiah(financialSummary.cashWithdrawal)}</li>
          <li>Transfer: {formatRupiah(financialSummary.transfer)}</li>
          <li>Mode Pulsa: {formatRupiah(financialSummary.modePulsa)}</li>
          <li>Admin Bank: {formatRupiah(financialSummary.bankAdmin)}</li>
          <li>Keuntungan (Profit): {formatRupiah(financialSummary.profit)}</li>
        </ul>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold mb-2">Sumber Dana</h3>
        <ul className="space-y-1">
          {fundSources.map((source, index) => (
            <li key={index}>
              {source.nama_sumber_dana}: {formatRupiah(source.saldo)}
            </li>
          ))}
        </ul>
      </div>

      <div className="font-bold mt-4">
        Total Aset: {formatRupiah(financialSummary.totalAssets)}
      </div>
    </div>
  )
}

export default ReceiptView