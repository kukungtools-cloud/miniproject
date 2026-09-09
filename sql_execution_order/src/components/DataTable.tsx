import { motion, AnimatePresence } from 'framer-motion';
import type { TableColumn, TableRow as ITableRow, StepKey } from '../types/sql';
import { TableRow } from './TableRow';
import { Database, Filter, Layers, CheckSquare, Sparkles, ArrowUpDown, Scissors } from 'lucide-react';

interface DataTableProps {
  data: ITableRow[];
  columns: TableColumn[];
  activeStepKey: StepKey;
  subPhase: 'evaluating' | 'committed';
  title?: string;
  stepNumber: number;
}

export const DataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  activeStepKey,
  subPhase,
  title = 'Working Dataset Memory',
  stepNumber,
}) => {
  const getStepIcon = (key: StepKey) => {
    switch (key) {
      case 'FROM': return <Database className="w-3.5 h-3.5 text-emerald-400" />;
      case 'WHERE': return <Filter className="w-3.5 h-3.5 text-amber-400" />;
      case 'GROUP_BY': return <Layers className="w-3.5 h-3.5 text-blue-400" />;
      case 'HAVING': return <CheckSquare className="w-3.5 h-3.5 text-purple-400" />;
      case 'SELECT': return <Sparkles className="w-3.5 h-3.5 text-cyan-400" />;
      case 'ORDER_BY': return <ArrowUpDown className="w-3.5 h-3.5 text-orange-400" />;
      case 'LIMIT': return <Scissors className="w-3.5 h-3.5 text-rose-400" />;
    }
  };

  return (
    <div className="w-full flex-1 min-h-0 flex flex-col rounded-xl glass-card border border-white/10 shadow-xl overflow-hidden backdrop-blur-xl">
      {/* Table Top Status Bar */}
      <div className="px-3 py-1.5 bg-slate-900/90 border-b border-white/[0.08] flex items-center justify-between gap-1.5 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded-md bg-slate-800 border border-white/10 shadow-inner shrink-0">
            {getStepIcon(activeStepKey)}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] sm:text-[13px] font-mono font-bold tracking-wider px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
              STEP {stepNumber}: {activeStepKey}
            </span>
            <h3 className="text-[13px] sm:text-[14.5px] font-semibold text-slate-200 whitespace-nowrap">{title}</h3>
          </div>
        </div>

        {/* Row count pill */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[12px] text-slate-400 hidden 2xl:inline">In-Memory:</span>
          <motion.div
            key={data.length}
            initial={{ scale: 1.15, color: '#34D399' }}
            animate={{ scale: 1, color: '#F1F5F9' }}
            transition={{ duration: 0.25 }}
            className="px-2 py-0.5 rounded-full bg-slate-800 border border-white/10 text-[13px] sm:text-[14px] font-mono font-bold text-slate-200 shadow-inner flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            {data.length} {data.length === 1 ? 'row' : 'rows'}
          </motion.div>
        </div>
      </div>

      {/* Dynamic Transformation Notification Banner */}
      <motion.div
        key={`${activeStepKey}-${subPhase}`}
        initial={{ opacity: 0, y: -3 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-3 py-1 bg-blue-950/40 border-b border-blue-500/20 flex items-center gap-2 shrink-0 font-sans"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <p className="text-[13.5px] sm:text-[14.5px] text-blue-200 font-medium truncate">
            {activeStepKey === 'FROM' && '📥 Memuat 8 baris tabel mentah ukt_mahasiswa ke buffer memori kerja.'}
            {activeStepKey === 'WHERE' && "🔍 Filter predicate status = 'Lunas': 2 mahasiswa 'Belum' tereliminasi, menyisakan 6 mahasiswa."}
            {activeStepKey === 'GROUP_BY' && '🧬 Grouping by fakultas: Terbentuk 3 grup (Fasilkom, FEB, FT) & kalkulasi agregat (COUNT, MIN, MAX, SUM, AVG).'}
            {activeStepKey === 'HAVING' && '⚖️ Filter agregat HAVING COUNT(nama) >= 2: FT (1 mhs) gagal syarat dan tereliminasi.'}
            {activeStepKey === 'SELECT' && '✨ Proyeksi kolom agregasi resmi: jumlah_mhs_lunas, ukt_terendah, ukt_tertinggi, total_ukt, rata_rata_ukt.'}
            {activeStepKey === 'ORDER_BY' && '🔄 Sorting in-memory by total_ukt DESC: Fasilkom & FEB masing-masing ber-total Rp 15.500.000.'}
            {activeStepKey === 'LIMIT' && '✂️ Slicing dataset LIMIT 1: Mengambil 1 baris teratas (Fasilkom), FEB dipotong. Selesai! 🎉'}
          </p>
        </div>
      </motion.div>

      {/* Table Body Area */}
      <div className="flex-1 min-h-0 overflow-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-950/80 border-b border-white/[0.08]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`py-1.5 px-3 text-[13.5px] sm:text-[14.5px] font-mono font-bold uppercase tracking-wider text-slate-400 ${
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left'
                  }`}
                >
                  <motion.div
                    layout
                    key={col.label}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`inline-flex items-center gap-1.5 ${
                      col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'
                    }`}
                  >
                    <span>{col.label}</span>
                  </motion.div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            <AnimatePresence mode="popLayout">
              {data.map((row, idx) => (
                <TableRow
                  key={row.id}
                  row={row}
                  index={idx}
                  columns={columns}
                  activeStepKey={activeStepKey}
                  subPhase={subPhase}
                />
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Footer Info Strip */}
      <div className="px-3 py-1 bg-slate-950/60 border-t border-white/[0.04] flex items-center justify-between text-[13px] text-slate-400 font-mono shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Phase:</span>
          <span className="text-emerald-400 uppercase font-bold">{subPhase}</span>
        </div>
      </div>
    </div>
  );
};
