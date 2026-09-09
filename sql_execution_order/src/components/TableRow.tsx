import { motion } from 'framer-motion';
import type { TableColumn, TableRow as ITableRow, StepKey } from '../types/sql';
import { CheckCircle2, XCircle, Sparkles, Award } from 'lucide-react';

interface TableRowProps {
  row: ITableRow;
  index: number;
  columns: TableColumn[];
  activeStepKey: StepKey;
  subPhase: 'evaluating' | 'committed';
}

export const TableRow: React.FC<TableRowProps> = ({
  row,
  index,
  columns,
  activeStepKey,
  subPhase,
}) => {
  const isFailingWhere = activeStepKey === 'WHERE' && row.isFailingFilter;
  const isPassingWhere = activeStepKey === 'WHERE' && row.isPassingFilter;
  const isFailingHaving = activeStepKey === 'HAVING' && row.isFailingHaving;
  const isPassingHaving = activeStepKey === 'HAVING' && row.isPassingHaving;
  const isSlicedLimit = activeStepKey === 'LIMIT' && row.isSlicedLimit;
  const isMerged = activeStepKey === 'GROUP_BY' && row.isMerged;

  return (
    <motion.tr
      layout
      key={row.id}
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{
        opacity: isFailingWhere && subPhase === 'committed' ? 0 : 1,
        y: 0,
        scale: 1,
        backgroundColor: isFailingWhere
          ? 'rgba(239, 68, 68, 0.12)'
          : isPassingWhere && subPhase === 'evaluating'
          ? 'rgba(16, 185, 129, 0.08)'
          : isFailingHaving
          ? 'rgba(239, 68, 68, 0.14)'
          : isPassingHaving && subPhase === 'evaluating'
          ? 'rgba(16, 185, 129, 0.08)'
          : isMerged
          ? 'rgba(59, 130, 246, 0.12)'
          : isSlicedLimit
          ? 'rgba(148, 163, 184, 0.06)'
          : index % 2 === 0
          ? 'rgba(15, 23, 42, 0.4)'
          : 'rgba(20, 30, 52, 0.2)',
      }}
      exit={{
        opacity: 0,
        scale: 0.9,
        height: 0,
        transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
      }}
      transition={{
        layout: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
        opacity: { duration: 0.35 },
      }}
      className={`group border-b border-white/[0.04] transition-colors relative ${
        isFailingWhere ? 'ring-1 ring-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.2)]' : ''
      } ${
        isFailingHaving ? 'ring-1 ring-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.2)]' : ''
      } ${
        isMerged ? 'ring-1 ring-blue-500/40' : ''
      }`}
    >
      {columns.map((col, colIdx) => {
        const val = row[col.key];

        return (
          <td
            key={col.key}
            className={`py-1.5 px-3 sm:py-2 text-[15px] sm:text-[16px] font-medium ${
              col.align === 'right'
                ? 'text-right font-mono'
                : col.align === 'center'
                ? 'text-center'
                : 'text-left'
            } ${
              colIdx === 0 ? 'text-slate-100 font-semibold' : 'text-slate-300'
            }`}
          >
            <div className={`inline-flex items-center gap-1.5 ${
              col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'
            }`}>
              {/* Row Rank Badge */}
              {colIdx === 0 && row.rank && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[13px] sm:text-[14px] font-bold font-mono ${
                    row.rank === 1
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                      : row.rank === 2
                      ? 'bg-slate-300/20 text-slate-200 border border-slate-400/40'
                      : 'bg-amber-800/20 text-amber-600 border border-amber-800/30'
                  }`}
                  title={`Rank #${row.rank}`}
                >
                  {row.rank === 1 ? <Award className="w-3.5 h-3.5 text-amber-400" /> : `#${row.rank}`}
                </motion.span>
              )}

              {/* Group By Merge Badge */}
              {colIdx === 0 && isMerged && (
                <span className="px-1.5 py-0.5 rounded text-[12px] sm:text-[13px] font-mono font-bold tracking-wide bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  MERGED
                </span>
              )}

              {/* Value rendering */}
              {col.key === 'status' ? (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[13px] sm:text-[14px] font-mono font-bold ${
                    val === 'Lunas' || val === 'paid'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {String(val)}
                </span>
              ) : ['nominal', 'ukt_terendah', 'ukt_tertinggi', 'total_ukt', 'rata_rata_ukt', 'amount', 'total'].includes(col.key) ? (
                <span className={`font-mono text-[14px] sm:text-[15.5px] font-bold ${
                  row.rank === 1
                    ? 'text-amber-300'
                    : isMerged
                    ? 'text-blue-300'
                    : 'text-emerald-400'
                }`}>
                  Rp {Math.round(Number(val)).toLocaleString('id-ID')}
                </span>
              ) : col.key === 'jumlah_mhs_lunas' ? (
                <span className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-white/10 font-mono text-[13.5px] font-bold text-cyan-300 shadow-inner">
                  {Number(val)} mhs
                </span>
              ) : (
                <span className="text-slate-100 font-medium">{String(val)}</span>
              )}

              {/* HAVING Step Validation Icons */}
              {activeStepKey === 'HAVING' && colIdx === columns.length - 1 && (
                <div className="ml-1.5 flex items-center">
                  {isPassingHaving && (
                    <span className="inline-flex items-center gap-1 text-emerald-400 text-[12px] sm:text-[12.5px] font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      PASS
                    </span>
                  )}
                  {isFailingHaving && (
                    <span className="inline-flex items-center gap-1 text-rose-400 text-[12px] sm:text-[12.5px] font-semibold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30 animate-pulse">
                      <XCircle className="w-3.5 h-3.5" />
                      FAIL
                    </span>
                  )}
                </div>
              )}

              {/* WHERE Step Filter Badges */}
              {activeStepKey === 'WHERE' && col.key === 'status' && (
                <>
                  {isFailingWhere && (
                    <span className="text-[12px] sm:text-[12.5px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      DROP
                    </span>
                  )}
                  {isPassingWhere && (
                    <span className="text-[12px] sm:text-[12.5px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      KEEP
                    </span>
                  )}
                </>
              )}

              {/* LIMIT Cutoff Badge */}
              {isSlicedLimit && colIdx === columns.length - 1 && (
                <span className="text-[12px] sm:text-[12.5px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                  SLICED (LIMIT 1)
                </span>
              )}
            </div>
          </td>
        );
      })}
    </motion.tr>
  );
};
