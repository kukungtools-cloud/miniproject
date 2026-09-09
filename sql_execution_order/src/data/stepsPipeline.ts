import type { ExecutionStep } from '../types/sql';
import { RAW_UKT_MAHASISWA } from './initialData';

export const STEPS_PIPELINE: ExecutionStep[] = [
  {
    id: 1,
    stepKey: 'FROM',
    label: '1. FROM',
    subtitle: 'Memuat Sumber Data',
    clause: 'FROM ukt_mahasiswa',
    description: 'Query engine memuat seluruh tabel mentah ukt_mahasiswa (8 baris) ke dalam memori kerja (working set).',
    explanation: {
      whyOrder: 'Engine harus mengidentifikasi tabel sumber (ukt_mahasiswa) sebelum dapat memfilter atau menghitung kolom apapun.',
      engineAction: 'Memuat 8 baris mentah tabel ukt_mahasiswa ke dalam working set memori eksekusi.',
      pitfallAvoided: 'Kolom tidak dapat diproses jika tabel belum dialokasikan ke memori.'
    },
    activeSqlLines: [8],
    soundType: 'scan',
    columns: [
      { key: 'nama', label: 'nama' },
      { key: 'fakultas', label: 'fakultas' },
      { key: 'status', label: 'status', align: 'center' },
      { key: 'nominal', label: 'nominal', align: 'right' }
    ],
    getRows: () => ({
      evaluatingRows: RAW_UKT_MAHASISWA,
      resultRows: RAW_UKT_MAHASISWA
    })
  },
  {
    id: 2,
    stepKey: 'WHERE',
    label: '2. WHERE',
    subtitle: 'Filter Baris Individual',
    clause: "WHERE status = 'Lunas'",
    description: "Menyaring baris mentah per baris. Mahasiswa status 'Belum' (Budi & Fajar) ter-scan lalu dieliminasi.",
    explanation: {
      whyOrder: 'Menyaring baris individual sebelum GROUP BY menghemat memori dan beban kalkulasi agregasi secara drastis.',
      engineAction: "Mengevaluasi predicate status = 'Lunas'. 2 baris Belum gagal dieliminasi, menyisakan 6 baris Lunas.",
      pitfallAvoided: 'Alias SELECT (seperti jumlah_mhs_lunas atau total_ukt) belum ada di tahap ini, sehingga tidak bisa dipakai di WHERE.'
    },
    activeSqlLines: [9],
    soundType: 'filter',
    columns: [
      { key: 'nama', label: 'nama' },
      { key: 'fakultas', label: 'fakultas' },
      { key: 'status', label: 'status', align: 'center' },
      { key: 'nominal', label: 'nominal', align: 'right' }
    ],
    getRows: () => ({
      evaluatingRows: RAW_UKT_MAHASISWA.map(r => ({
        ...r,
        isFailingFilter: r.status === 'Belum',
        isPassingFilter: r.status === 'Lunas'
      })),
      resultRows: RAW_UKT_MAHASISWA.filter(r => r.status === 'Lunas')
    })
  },
  {
    id: 3,
    stepKey: 'GROUP_BY',
    label: '3. GROUP BY',
    subtitle: 'Pengelompokan & Agregasi',
    clause: 'GROUP BY fakultas',
    description: 'Baris dengan fakultas sama disatukan. Terbentuk 3 grup fakultas (Fasilkom, FEB, FT) dan fungsi agregat dihitung per grup.',
    explanation: {
      whyOrder: 'Setelah data tidak valid dibuang, baris dikelompokkan ke bucket unik fakultas untuk fungsi agregasi.',
      engineAction: 'Meringkas 6 baris menjadi 3 grup: Fasilkom (2 mhs), FEB (3 mhs), FT (1 mhs).',
      pitfallAvoided: 'Kolom non-agregat di SELECT harus tercantum dalam klausa GROUP BY.'
    },
    activeSqlLines: [10],
    soundType: 'merge',
    columns: [
      { key: 'fakultas', label: 'fakultas' },
      { key: 'jumlah_mhs_lunas', label: 'COUNT(nama)', align: 'center' },
      { key: 'ukt_terendah', label: 'MIN(nominal)', align: 'right' },
      { key: 'ukt_tertinggi', label: 'MAX(nominal)', align: 'right' },
      { key: 'total_ukt', label: 'SUM(nominal)', align: 'right' },
      { key: 'rata_rata_ukt', label: 'AVG(nominal)', align: 'right' }
    ],
    getRows: () => ({
      evaluatingRows: [
        { id: 'group-fasilkom', fakultas: 'Fasilkom', jumlah_mhs_lunas: 2, ukt_terendah: 7500000, ukt_tertinggi: 8000000, total_ukt: 15500000, rata_rata_ukt: 7750000, isMerged: true, isHighlight: true },
        { id: 'group-feb', fakultas: 'FEB', jumlah_mhs_lunas: 3, ukt_terendah: 5000000, ukt_tertinggi: 5500000, total_ukt: 15500000, rata_rata_ukt: 5166667, isMerged: true },
        { id: 'group-ft', fakultas: 'FT', jumlah_mhs_lunas: 1, ukt_terendah: 6000000, ukt_tertinggi: 6000000, total_ukt: 6000000, rata_rata_ukt: 6000000, isMerged: true },
      ],
      resultRows: [
        { id: 'group-fasilkom', fakultas: 'Fasilkom', jumlah_mhs_lunas: 2, ukt_terendah: 7500000, ukt_tertinggi: 8000000, total_ukt: 15500000, rata_rata_ukt: 7750000 },
        { id: 'group-feb', fakultas: 'FEB', jumlah_mhs_lunas: 3, ukt_terendah: 5000000, ukt_tertinggi: 5500000, total_ukt: 15500000, rata_rata_ukt: 5166667 },
        { id: 'group-ft', fakultas: 'FT', jumlah_mhs_lunas: 1, ukt_terendah: 6000000, ukt_tertinggi: 6000000, total_ukt: 6000000, rata_rata_ukt: 6000000 },
      ]
    })
  },
  {
    id: 4,
    stepKey: 'HAVING',
    label: '4. HAVING',
    subtitle: 'Filter Hasil Agregasi',
    clause: 'HAVING COUNT(nama) >= 2',
    description: 'Mengevaluasi hasil penjumlahan tiap grup. Grup FT (1 mhs) gagal syarat (>= 2) dan dieliminasi.',
    explanation: {
      whyOrder: 'HAVING memfilter kelompok baris berdasarkan hasil kalkulasi agregat setelah GROUP BY selesai.',
      engineAction: 'Fasilkom (COUNT=2) & FEB (COUNT=3) lolos checklist hijau. FT (COUNT=1) silang merah lalu dieliminasi.',
      pitfallAvoided: 'Fungsi agregat TIDAK BISA diletakkan di WHERE. Gunakan HAVING untuk memfilter hasil agregat.'
    },
    activeSqlLines: [11],
    soundType: 'filter',
    columns: [
      { key: 'fakultas', label: 'fakultas' },
      { key: 'jumlah_mhs_lunas', label: 'COUNT(nama)', align: 'center' },
      { key: 'ukt_terendah', label: 'MIN(nominal)', align: 'right' },
      { key: 'ukt_tertinggi', label: 'MAX(nominal)', align: 'right' },
      { key: 'total_ukt', label: 'SUM(nominal)', align: 'right' },
      { key: 'rata_rata_ukt', label: 'AVG(nominal)', align: 'right' }
    ],
    getRows: () => ({
      evaluatingRows: [
        { id: 'group-fasilkom', fakultas: 'Fasilkom', jumlah_mhs_lunas: 2, ukt_terendah: 7500000, ukt_tertinggi: 8000000, total_ukt: 15500000, rata_rata_ukt: 7750000, isPassingHaving: true },
        { id: 'group-feb', fakultas: 'FEB', jumlah_mhs_lunas: 3, ukt_terendah: 5000000, ukt_tertinggi: 5500000, total_ukt: 15500000, rata_rata_ukt: 5166667, isPassingHaving: true },
        { id: 'group-ft', fakultas: 'FT', jumlah_mhs_lunas: 1, ukt_terendah: 6000000, ukt_tertinggi: 6000000, total_ukt: 6000000, rata_rata_ukt: 6000000, isFailingHaving: true },
      ],
      resultRows: [
        { id: 'group-fasilkom', fakultas: 'Fasilkom', jumlah_mhs_lunas: 2, ukt_terendah: 7500000, ukt_tertinggi: 8000000, total_ukt: 15500000, rata_rata_ukt: 7750000 },
        { id: 'group-feb', fakultas: 'FEB', jumlah_mhs_lunas: 3, ukt_terendah: 5000000, ukt_tertinggi: 5500000, total_ukt: 15500000, rata_rata_ukt: 5166667 },
      ]
    })
  },
  {
    id: 5,
    stepKey: 'SELECT',
    label: '5. SELECT',
    subtitle: 'Proyeksi Kolom & Alias',
    clause: 'SELECT fakultas, COUNT(nama) AS jumlah_mhs_lunas, ...',
    description: 'Header fungsi agregat bertransformasi mulus menjadi nama alias resmi (jumlah_mhs_lunas, ukt_terendah, ukt_tertinggi, total_ukt, rata_rata_ukt).',
    explanation: {
      whyOrder: 'SELECT dieksekusi setelah filter agar hanya memproyeksikan kolom untuk baris yang valid.',
      engineAction: 'Menetapkan alias resmi pada kolom agregasi di working memory.',
      pitfallAvoided: 'Alias baru tercipta di step ini, sehingga tidak bisa digunakan di WHERE atau GROUP BY sebelumnya.'
    },
    activeSqlLines: [1, 2, 3, 4, 5, 6, 7],
    soundType: 'scan',
    columns: [
      { key: 'fakultas', label: 'fakultas' },
      { key: 'jumlah_mhs_lunas', label: 'jumlah_mhs_lunas', align: 'center' },
      { key: 'ukt_terendah', label: 'ukt_terendah', align: 'right' },
      { key: 'ukt_tertinggi', label: 'ukt_tertinggi', align: 'right' },
      { key: 'total_ukt', label: 'total_ukt', align: 'right' },
      { key: 'rata_rata_ukt', label: 'rata_rata_ukt', align: 'right' }
    ],
    getRows: () => ({
      evaluatingRows: [
        { id: 'group-fasilkom', fakultas: 'Fasilkom', jumlah_mhs_lunas: 2, ukt_terendah: 7500000, ukt_tertinggi: 8000000, total_ukt: 15500000, rata_rata_ukt: 7750000 },
        { id: 'group-feb', fakultas: 'FEB', jumlah_mhs_lunas: 3, ukt_terendah: 5000000, ukt_tertinggi: 5500000, total_ukt: 15500000, rata_rata_ukt: 5166667 },
      ],
      resultRows: [
        { id: 'group-fasilkom', fakultas: 'Fasilkom', jumlah_mhs_lunas: 2, ukt_terendah: 7500000, ukt_tertinggi: 8000000, total_ukt: 15500000, rata_rata_ukt: 7750000 },
        { id: 'group-feb', fakultas: 'FEB', jumlah_mhs_lunas: 3, ukt_terendah: 5000000, ukt_tertinggi: 5500000, total_ukt: 15500000, rata_rata_ukt: 5166667 },
      ]
    })
  },
  {
    id: 6,
    stepKey: 'ORDER_BY',
    label: '6. ORDER BY',
    subtitle: 'Pengurutan Baris',
    clause: 'ORDER BY total_ukt DESC',
    description: 'Baris diurutkan secara visual via reordering FLIP berdasarkan total_ukt secara menurun (DESC).',
    explanation: {
      whyOrder: 'Sorting adalah operasi O(n log n), sehingga dilakukan di akhir pada baris hasil proyeksi.',
      engineAction: 'Mengurutkan baris secara menurun (DESC) berdasarkan kolom alias total_ukt.',
      pitfallAvoided: 'ORDER BY boleh menggunakan nama alias dari SELECT karena SELECT sudah dieksekusi sebelumnya.'
    },
    activeSqlLines: [12],
    soundType: 'sort',
    columns: [
      { key: 'fakultas', label: 'fakultas' },
      { key: 'jumlah_mhs_lunas', label: 'jumlah_mhs_lunas', align: 'center' },
      { key: 'ukt_terendah', label: 'ukt_terendah', align: 'right' },
      { key: 'ukt_tertinggi', label: 'ukt_tertinggi', align: 'right' },
      { key: 'total_ukt', label: 'total_ukt', align: 'right' },
      { key: 'rata_rata_ukt', label: 'rata_rata_ukt', align: 'right' }
    ],
    getRows: () => ({
      evaluatingRows: [
        { id: 'group-fasilkom', fakultas: 'Fasilkom', jumlah_mhs_lunas: 2, ukt_terendah: 7500000, ukt_tertinggi: 8000000, total_ukt: 15500000, rata_rata_ukt: 7750000, rank: 1, isHighlight: true },
        { id: 'group-feb', fakultas: 'FEB', jumlah_mhs_lunas: 3, ukt_terendah: 5000000, ukt_tertinggi: 5500000, total_ukt: 15500000, rata_rata_ukt: 5166667, rank: 2 },
      ],
      resultRows: [
        { id: 'group-fasilkom', fakultas: 'Fasilkom', jumlah_mhs_lunas: 2, ukt_terendah: 7500000, ukt_tertinggi: 8000000, total_ukt: 15500000, rata_rata_ukt: 7750000, rank: 1 },
        { id: 'group-feb', fakultas: 'FEB', jumlah_mhs_lunas: 3, ukt_terendah: 5000000, ukt_tertinggi: 5500000, total_ukt: 15500000, rata_rata_ukt: 5166667, rank: 2 },
      ]
    })
  },
  {
    id: 7,
    stepKey: 'LIMIT',
    label: '7. LIMIT',
    subtitle: 'Pemotongan Hasil',
    clause: 'LIMIT 1',
    description: 'Mengambil 1 baris teratas (LIMIT 1). Baris ke-2 (FEB) terpotong/hilang. Eksekusi selesai: 1 baris final!',
    explanation: {
      whyOrder: 'LIMIT dijalankan paling akhir setelah urutan baris sudah final agar hasilnya deterministik.',
      engineAction: 'Memotong baris di luar batas kuota (FEB dieliminasi), menghasilkan 1 baris final (Fasilkom).',
      pitfallAvoided: 'Menjalankan LIMIT tanpa ORDER BY menghasilkan baris yang tidak pasti (non-deterministik).'
    },
    activeSqlLines: [13],
    soundType: 'success',
    columns: [
      { key: 'fakultas', label: 'fakultas' },
      { key: 'jumlah_mhs_lunas', label: 'jumlah_mhs_lunas', align: 'center' },
      { key: 'ukt_terendah', label: 'ukt_terendah', align: 'right' },
      { key: 'ukt_tertinggi', label: 'ukt_tertinggi', align: 'right' },
      { key: 'total_ukt', label: 'total_ukt', align: 'right' },
      { key: 'rata_rata_ukt', label: 'rata_rata_ukt', align: 'right' }
    ],
    getRows: () => ({
      evaluatingRows: [
        { id: 'group-fasilkom', fakultas: 'Fasilkom', jumlah_mhs_lunas: 2, ukt_terendah: 7500000, ukt_tertinggi: 8000000, total_ukt: 15500000, rata_rata_ukt: 7750000, rank: 1 },
        { id: 'group-feb', fakultas: 'FEB', jumlah_mhs_lunas: 3, ukt_terendah: 5000000, ukt_tertinggi: 5500000, total_ukt: 15500000, rata_rata_ukt: 5166667, rank: 2, isSlicedLimit: true },
      ],
      resultRows: [
        { id: 'group-fasilkom', fakultas: 'Fasilkom', jumlah_mhs_lunas: 2, ukt_terendah: 7500000, ukt_tertinggi: 8000000, total_ukt: 15500000, rata_rata_ukt: 7750000, rank: 1 },
      ]
    })
  }
];
