import React from "react";
import TableContent from "../features/dashboard/ui/kelola-toko/TableContent";

const dataToko = [
  { id: 1, namaToko: "Toko Maju Jaya", alamat: "Jakarta", jumlahKaryawan: 10 },
  { id: 2, namaToko: "Toko Sumber Rezeki", alamat: "Bandung", jumlahKaryawan: 8 },
  { id: 3, namaToko: "Toko Sentosa", alamat: "Surabaya", jumlahKaryawan: 6 },
  { id: 4, namaToko: "Toko Amanah", alamat: "Yogyakarta", jumlahKaryawan: 12 },
  { id: 5, namaToko: "Toko Berkah", alamat: "Bekasi", jumlahKaryawan: 5 },
  { id: 6, namaToko: "Toko Makmur", alamat: "Depok", jumlahKaryawan: 9 },
  { id: 7, namaToko: "Toko Jaya Abadi", alamat: "Tangerang", jumlahKaryawan: 7 },
  { id: 8, namaToko: "Toko Rizki", alamat: "Semarang", jumlahKaryawan: 4 },
  { id: 9, namaToko: "Toko Sejahtera", alamat: "Medan", jumlahKaryawan: 11 },
  { id: 10, namaToko: "Toko Mandiri", alamat: "Palembang", jumlahKaryawan: 3 },
];

const KelolaToko = () => {
  return (
    <TableContent
  data={dataToko}
  columns={[
    { key: "namaToko", label: "Nama Toko" },
    { key: "jumlahKaryawan", label: "Jumlah Karyawan" },
    { key: "alamat", label: "Alamat" },
  ]}
  onEdit={(item) => console.log("Edit", item)}
  onDelete={(id) => console.log("Hapus", id)}
/>

  );
};

export default KelolaToko;