import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ExecutionStep, StepKey } from '../types/sql';
import { Copy, Check, Terminal, Cpu, Save, RotateCcw, Lock, AlertCircle, X, Edit3 } from 'lucide-react';

interface QueryEditorProps {
  currentStep: ExecutionStep;
  rawSql: string;
  lines: { lineNumber: number; text: string }[];
  onUpdateQuery: (newSql: string) => void;
  onResetQuery: () => void;
  parseError?: string;
  isEditing?: boolean;
  onCloseEdit?: () => void;
}

export const QueryEditor: React.FC<QueryEditorProps> = ({
  currentStep,
  rawSql,
  lines,
  onUpdateQuery,
  onResetQuery,
  parseError,
  isEditing: externalIsEditing,
  onCloseEdit,
}) => {
  const [copied, setCopied] = useState(false);
  const [internalIsEditing, setInternalIsEditing] = useState(false);
  const isEditing = externalIsEditing !== undefined ? externalIsEditing : internalIsEditing;
  const setIsEditing = (val: boolean) => {
    if (externalIsEditing !== undefined && !val) {
      onCloseEdit?.();
    }
    setInternalIsEditing(val);
  };
  const [draftSql, setDraftSql] = useState(rawSql);
  const [lockWarning, setLockWarning] = useState<string | null>(null);

  // Sync draftSql when rawSql changes or edit mode is toggled
  useEffect(() => {
    setDraftSql(rawSql);
  }, [rawSql, isEditing]);

  const getLineExecutionBadge = (lineText: string, _lineNum?: number): { stepNum: number; label: string } | null => {
    const t = lineText.trim().toUpperCase();
    if (t.startsWith('SELECT')) return { stepNum: 5, label: '5. SELECT' };
    if (t.startsWith('FROM')) return { stepNum: 1, label: '1. FROM' };
    if (t.startsWith('WHERE')) return { stepNum: 2, label: '2. WHERE' };
    if (t.startsWith('GROUP BY')) return { stepNum: 3, label: '3. GROUP BY' };
    if (t.startsWith('HAVING')) return { stepNum: 4, label: '4. HAVING' };
    if (t.startsWith('ORDER BY')) return { stepNum: 6, label: '6. ORDER BY' };
    if (t.startsWith('LIMIT')) return { stepNum: 7, label: '7. LIMIT' };
    return null;
  };

  const getOperatorName = (key: StepKey): string => {
    switch (key) {
      case 'FROM': return 'OP_SEQ_SCAN [ukt_mahasiswa]';
      case 'WHERE': return 'OP_ROW_FILTER [predicate]';
      case 'GROUP_BY': return 'OP_HASH_AGGREGATE [grouping]';
      case 'HAVING': return 'OP_FILTER_GROUPS [aggregate filter]';
      case 'SELECT': return 'OP_PROJECT_COLUMNS [projection & aliases]';
      case 'ORDER_BY': return 'OP_SORT_IN_MEMORY [order by total_ukt]';
      case 'LIMIT': return 'OP_SLICE_LIMIT [limit slice]';
    }
  };

  const getMemoryStat = (key: StepKey): string => {
    switch (key) {
      case 'FROM': return 'Buffer: 8 rows allocated';
      case 'WHERE': return 'Buffer: filtered in-memory';
      case 'GROUP_BY': return 'Buffer: grouped in-memory';
      case 'HAVING': return 'Buffer: aggregate verified';
      case 'SELECT': return 'Buffer: projected columns';
      case 'ORDER_BY': return 'Buffer: sorted in-memory';
      case 'LIMIT': return 'Buffer: slice completed';
    }
  };

  const copyQuery = () => {
    navigator.clipboard.writeText(isEditing ? draftSql : rawSql).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSaveQuery = () => {
    let finalSql = draftSql;

    // Enforce static table source ukt_mahasiswa
    const fromMatch = finalSql.match(/\bFROM\s+([a-zA-Z0-9_]+)/i);
    if (!fromMatch) {
      setLockWarning('Query harus memiliki klausa "FROM ukt_mahasiswa". Menambahkan otomatis...');
      finalSql = finalSql.replace(/\bWHERE\b/i, 'FROM ukt_mahasiswa\nWHERE');
    } else if (fromMatch[1].toLowerCase() !== 'ukt_mahasiswa') {
      setLockWarning('Tabel dikunci ke "ukt_mahasiswa" karena dataset statis.');
      finalSql = finalSql.replace(/\bFROM\s+[a-zA-Z0-9_]+/i, 'FROM ukt_mahasiswa');
    } else {
      setLockWarning(null);
    }

    setDraftSql(finalSql);
    onUpdateQuery(finalSql);
    setIsEditing(false);
  };

  const handleCloseEdit = () => {
    setDraftSql(rawSql);
    setLockWarning(null);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSaveQuery();
    }
  };

  const highlightSyntax = (text: string) => {
    const keywords = ['SELECT', 'FROM', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT', 'AS', 'DESC', 'ASC', 'AND', 'OR'];
    const funcs = ['COUNT', 'MIN', 'MAX', 'SUM', 'AVG'];

    let formatted = text;
    keywords.forEach(kw => {
      const reg = new RegExp(`\\b${kw}\\b`, 'g');
      formatted = formatted.replace(reg, `<span class="text-blue-400 font-bold">${kw}</span>`);
    });

    funcs.forEach(fn => {
      const reg = new RegExp(`\\b${fn}\\b`, 'g');
      formatted = formatted.replace(reg, `<span class="text-amber-300 font-semibold">${fn}</span>`);
    });

    formatted = formatted.replace(/'Lunas'/g, `<span class="text-emerald-300">'Lunas'</span>`);
    formatted = formatted.replace(/'Belum'/g, `<span class="text-rose-300">'Belum'</span>`);

    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  return (
    <div className="w-full flex-1 min-h-0 rounded-xl glass-card border border-white/10 shadow-lg overflow-hidden flex flex-col backdrop-blur-xl">
      {/* Editor Header */}
      <div className="px-3 py-1.5 bg-slate-900/90 border-b border-white/[0.08] flex items-center justify-between gap-1.5 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1 mr-1 shrink-0">
            <span className="w-2 h-2 rounded-full bg-rose-500/80"></span>
            <span className="w-2 h-2 rounded-full bg-amber-500/80"></span>
            <span className="w-2 h-2 rounded-full bg-emerald-500/80"></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300 text-[11px] font-mono shrink-0">
            <Terminal className="w-3 h-3 text-blue-400" />
            <span>query.sql</span>
          </div>

          {/* Locked Table Source Pill */}
          <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.2 rounded bg-slate-800 border border-white/10 text-[10px] font-mono text-slate-400" title="Tabel sumber dikunci ke ukt_mahasiswa">
            <Lock className="w-2.5 h-2.5 text-amber-400" />
            <span>ukt_mahasiswa</span>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isEditing ? (
            <>
              <button
                onClick={handleSaveQuery}
                className="flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-mono font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all"
                title="Simpan Kueri SQL (Ctrl + Enter)"
              >
                <Save className="w-3 h-3" />
                <span>Save</span>
              </button>
              <button
                onClick={handleCloseEdit}
                className="flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-white/10 transition-all"
                title="Batalkan Edit (Close)"
              >
                <X className="w-3 h-3 text-rose-400" />
                <span>Close</span>
              </button>
            </>
          ) : null}

          <button
            onClick={onResetQuery}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-mono text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-all"
            title="Reset ke Default Query"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span className="hidden md:inline">Reset</span>
          </button>

          <button
            onClick={copyQuery}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10.5px] font-mono text-slate-400 hover:text-slate-100 hover:bg-white/[0.06] transition-all border border-transparent hover:border-white/10"
            title="Copy SQL Query"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Warning/Error Notification Banner */}
      <AnimatePresence>
        {(parseError || lockWarning) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-2.5 py-1 bg-amber-500/15 border-b border-amber-500/30 flex items-center gap-1.5 text-[11px] font-mono text-amber-300 shrink-0"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span>{lockWarning || parseError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Code Editor Body */}
      {isEditing ? (
        /* Edit Mode Textarea */
        <div className="flex-1 min-h-0 p-2 bg-slate-950 flex flex-col font-mono text-xs relative">
          <div className="text-[10px] text-slate-400 pb-1 flex items-center justify-between border-b border-white/[0.06] mb-1">
            <span className="flex items-center gap-1">
              <Edit3 className="w-3 h-3 text-blue-400" />
              <span>Ketik kueri SQL di bawah (nama tabel dikunci ke <strong>ukt_mahasiswa</strong>):</span>
            </span>
            <span className="text-[9.5px] text-slate-500">Tekan Ctrl+Enter untuk Save</span>
          </div>

          <textarea
            value={draftSql}
            onChange={(e) => setDraftSql(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            className="flex-1 w-full bg-slate-950 text-slate-100 font-mono text-[13px] sm:text-[13.5px] leading-relaxed p-1.5 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none border border-white/[0.08]"
            placeholder="SELECT ... FROM ukt_mahasiswa ..."
            spellCheck={false}
          />
        </div>
      ) : (
        /* Execution Step View Mode */
        <div
          onClick={() => setIsEditing(true)}
          className="flex-1 min-h-0 p-1.5 sm:p-2 bg-slate-950/70 font-mono overflow-y-auto overflow-x-hidden relative select-none cursor-pointer group"
          title="Klik di sini untuk mengedit kueri SQL"
        >
          {lines.map((line) => {
            const isHighlighted = currentStep.activeSqlLines.includes(line.lineNumber);
            const badge = getLineExecutionBadge(line.text, line.lineNumber);
            const isCurrentActiveStep = badge?.stepNum === currentStep.id;

            return (
              <motion.div
                key={line.lineNumber}
                animate={{
                  backgroundColor: isHighlighted ? 'rgba(59, 130, 246, 0.18)' : 'transparent',
                }}
                transition={{ duration: 0.2 }}
                className={`flex items-center justify-between gap-1.5 px-2 py-0.5 rounded-lg my-0.5 relative transition-colors ${
                  isHighlighted
                    ? 'border-l-4 border-blue-500 pl-1.5 bg-blue-500/15 shadow-[inset_0_0_16px_rgba(59,130,246,0.15)]'
                    : 'border-l-4 border-transparent pl-1.5 group-hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10.5px] xl:text-[11.5px] w-4 text-right select-none font-mono ${
                    isHighlighted ? 'text-blue-400 font-bold' : 'text-slate-600'
                  }`}>
                    {line.lineNumber}
                  </span>

                  <div className="text-slate-100 font-mono whitespace-pre text-[12.5px] sm:text-[13px] lg:text-[13.5px] xl:text-[14px] font-medium leading-tight">
                    {highlightSyntax(line.text)}
                  </div>
                </div>

                {badge && (
                  <div className="flex items-center shrink-0 ml-auto pl-1">
                    <span
                      className={`text-[9px] xl:text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded border transition-all ${
                        isCurrentActiveStep
                          ? 'bg-blue-500 text-white border-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.6)] scale-105'
                          : badge.stepNum < currentStep.id
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35'
                          : 'bg-slate-800/90 text-slate-500 border-slate-700/60'
                      }`}
                    >
                      Step {badge.stepNum}
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Live Engine Operator & Telemetry Box */}
      <div className="p-2 bg-slate-900/90 border-t border-white/[0.08] flex flex-col gap-1 shrink-0 font-mono">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10.5px] font-bold text-blue-300 uppercase tracking-tight">
              {getOperatorName(currentStep.stepKey)}
            </span>
          </div>
          <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold">
            {getMemoryStat(currentStep.stepKey)}
          </span>
        </div>
        <div className="text-[10px] text-slate-400 font-sans leading-snug">
          {currentStep.explanation.engineAction}
        </div>
      </div>

      {/* Editor Footer */}
      <div className="px-2.5 py-1 bg-slate-900/60 border-t border-white/[0.05] flex items-center justify-between text-[10px] text-slate-400 font-mono shrink-0">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>Clause: <strong className="text-blue-300">{currentStep.clause}</strong></span>
        </span>
        <span className="text-[9px] text-slate-500">
          Order #{currentStep.id} of 7
        </span>
      </div>
    </div>
  );
};
