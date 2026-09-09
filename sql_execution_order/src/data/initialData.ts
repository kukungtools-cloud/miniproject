import type { TableRow } from '../types/sql';

export const RAW_UKT_MAHASISWA: TableRow[] = [
  { id: 'row-1', nama: 'Dimas', fakultas: 'Fasilkom', status: 'Lunas', nominal: 7500000 },
  { id: 'row-2', nama: 'Siti', fakultas: 'FEB', status: 'Lunas', nominal: 5000000 },
  { id: 'row-3', nama: 'Budi', fakultas: 'Fasilkom', status: 'Belum', nominal: 7500000 },
  { id: 'row-4', nama: 'Rina', fakultas: 'FT', status: 'Lunas', nominal: 6000000 },
  { id: 'row-5', nama: 'Eko', fakultas: 'FEB', status: 'Lunas', nominal: 5500000 },
  { id: 'row-6', nama: 'Dewi', fakultas: 'Fasilkom', status: 'Lunas', nominal: 8000000 },
  { id: 'row-7', nama: 'Fajar', fakultas: 'FT', status: 'Belum', nominal: 6000000 },
  { id: 'row-8', nama: 'Gita', fakultas: 'FEB', status: 'Lunas', nominal: 5000000 },
];

export const SQL_QUERY_LINES = [
  { lineNumber: 1, text: 'SELECT' },
  { lineNumber: 2, text: '    fakultas,' },
  { lineNumber: 3, text: '    COUNT(nama)        AS jumlah_mhs_lunas,' },
  { lineNumber: 4, text: '    MIN(nominal)       AS ukt_terendah,' },
  { lineNumber: 5, text: '    MAX(nominal)       AS ukt_tertinggi,' },
  { lineNumber: 6, text: '    SUM(nominal)       AS total_ukt,' },
  { lineNumber: 7, text: '    AVG(nominal)       AS rata_rata_ukt' },
  { lineNumber: 8, text: 'FROM ukt_mahasiswa' },
  { lineNumber: 9, text: "WHERE status = 'Lunas'" },
  { lineNumber: 10, text: 'GROUP BY fakultas' },
  { lineNumber: 11, text: 'HAVING COUNT(nama) >= 2' },
  { lineNumber: 12, text: 'ORDER BY total_ukt DESC' },
  { lineNumber: 13, text: 'LIMIT 1;' },
];
