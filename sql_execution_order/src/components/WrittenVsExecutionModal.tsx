import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, HelpCircle } from 'lucide-react';

interface WrittenVsExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WrittenVsExecutionModal: React.FC<WrittenVsExecutionModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const comparisonData = [
    {
      step: 1,
      clause: 'FROM / JOIN',
      writtenOrder: 'Urutan #2 di kode',
      executionOrder: 'Tahap #1 di Eksekusi',
      reason: 'Engine harus memuat tabel sumber ke memori kerja (working set) sebelum operasi apapun dapat dimulai.',
    },
    {
      step: 2,
      clause: 'WHERE',
      writtenOrder: 'Urutan #3 di kode',
      executionOrder: 'Tahap #2 di Eksekusi',
      reason: 'Menyaring baris individual sebelum GROUP BY untuk mengurangi ukuran data yang harus diagregasikan sedini mungkin.',
    },
    {
      step: 3,
      clause: 'GROUP BY',
      writtenOrder: 'Urutan #4 di kode',
      executionOrder: 'Tahap #3 di Eksekusi',
      reason: 'Mengelompokkan baris yang tersisa berdasarkan kunci identik untuk kalkulasi fungsi agregasi (seperti SUM).',
    },
    {
      step: 4,
      clause: 'HAVING',
      writtenOrder: 'Urutan #5 di kode',
      executionOrder: 'Tahap #4 di Eksekusi',
      reason: 'Menyaring kelompok baris berdasarkan hasil agregasi. Hanya bisa dijalankan setelah GROUP BY selesai dihitung.',
    },
    {
      step: 5,
      clause: 'SELECT',
      writtenOrder: 'Urutan #1 di kode (Paling Awal)',
      executionOrder: 'Tahap #5 di Eksekusi',
      reason: 'Memproyeksikan kolom dan menetapkan alias (misal AS total). Inilah mengapa alias SELECT tidak bisa dipakai di WHERE!',
    },
    {
      step: 6,
      clause: 'ORDER BY',
      writtenOrder: 'Urutan #6 di kode',
      executionOrder: 'Tahap #6 di Eksekusi',
      reason: 'Mengurutkan baris hasil proyeksi. Di tahap ini, alias dari SELECT akhirnya valid dan boleh digunakan.',
    },
    {
      step: 7,
      clause: 'LIMIT / OFFSET',
      writtenOrder: 'Urutan #7 di kode',
      executionOrder: 'Tahap #7 di Eksekusi',
      reason: 'Memotong jumlah baris sesuai batas kuota setelah hasil akhir sudah terurut secara definitif.',
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-2xl max-h-[85vh] overflow-y-auto glass-card border border-white/10 rounded-2xl shadow-2xl p-5 flex flex-col gap-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white">
                  Written Syntax vs Physical Execution Order
                </h2>
                <p className="text-[11px] text-slate-400">
                  Mengapa sintaks SQL ditulis berbeda dengan cara engine mengeksekusinya?
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Golden Rule Banner */}
          <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-slate-200 leading-normal">
            <span className="font-semibold text-blue-300">💡 Golden Rule Arsitektur SQL:</span> Kita menulis <code className="text-emerald-300 font-mono">SELECT</code> paling awal untuk kenyamanan membaca manusia, namun engine harus memuat data (<code className="text-emerald-300 font-mono">FROM</code>) dan memfilternya (<code className="text-emerald-300 font-mono">WHERE</code>) terlebih dahulu sebelum bisa memproyeksikan kolom.
          </div>

          {/* Step Comparison List */}
          <div className="flex flex-col gap-2">
            {comparisonData.map((item) => (
              <div
                key={item.step}
                className="p-2.5 rounded-xl bg-slate-900/60 border border-white/[0.04] flex flex-col gap-1 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center justify-between flex-wrap gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-300 font-mono font-bold text-[10px] flex items-center justify-center border border-blue-500/40">
                      {item.step}
                    </span>
                    <h3 className="font-mono font-bold text-white text-xs">
                      {item.clause}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    <span className="text-slate-400 line-through decoration-slate-600">
                      {item.writtenOrder}
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-500" />
                    <span className="text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                      {item.executionOrder}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 leading-normal font-sans pl-7">
                  {item.reason}
                </p>
              </div>
            ))}
          </div>

          {/* Close CTA */}
          <div className="pt-1 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs font-mono tracking-wider transition-colors shadow-md shadow-blue-600/25"
            >
              MENGERTI &amp; TUTUP
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
