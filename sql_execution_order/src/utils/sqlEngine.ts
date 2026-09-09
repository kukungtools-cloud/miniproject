import type { ExecutionStep, TableColumn, TableRow } from '../types/sql';
import { RAW_UKT_MAHASISWA } from '../data/initialData';

export interface ParsedQuery {
  selectClause: string;
  fromClause: string;
  whereClause: string;
  groupByClause: string;
  havingClause: string;
  orderByClause: string;
  limitClause: string;
  rawSql: string;
}

export interface ParseResult {
  success: boolean;
  pipeline?: ExecutionStep[];
  parsedQuery?: ParsedQuery;
  error?: string;
  lines: { lineNumber: number; text: string }[];
}

export const DEFAULT_SQL_QUERY = `SELECT 
    fakultas,
    COUNT(nama)        AS jumlah_mhs_lunas,
    MIN(nominal)       AS ukt_terendah,
    MAX(nominal)       AS ukt_tertinggi,
    SUM(nominal)       AS total_ukt,
    AVG(nominal)       AS rata_rata_ukt
FROM ukt_mahasiswa
WHERE status = 'Lunas'
GROUP BY fakultas
HAVING COUNT(nama) >= 2
ORDER BY total_ukt DESC
LIMIT 1;`;

/**
 * Normalizes SQL keywords and extracts clauses using regex while preserving cases of literals.
 */
export function parseSqlClauses(sql: string): ParsedQuery {
  const cleanSql = sql.trim().replace(/;+$/, '');

  // Validate FROM clause and enforce ukt_mahasiswa
  const fromMatch = cleanSql.match(/\bFROM\s+([a-zA-Z0-9_]+)/i);
  const fromClause = fromMatch && fromMatch[1].toLowerCase() === 'ukt_mahasiswa' ? 'ukt_mahasiswa' : 'ukt_mahasiswa';

  // Extract SELECT clause (between SELECT and FROM)
  const selectMatch = cleanSql.match(/\bSELECT\s+([\s\S]+?)\s+\bFROM\b/i);
  const selectClause = selectMatch ? selectMatch[1].trim() : '*';

  // Extract WHERE (between WHERE and (GROUP BY|HAVING|ORDER BY|LIMIT|$))
  const whereMatch = cleanSql.match(/\bWHERE\s+([\s\S]+?)(?=\s+\b(GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT)\b|$)/i);
  const whereClause = whereMatch ? whereMatch[1].trim() : '';

  // Extract GROUP BY (between GROUP BY and (HAVING|ORDER BY|LIMIT|$))
  const groupByMatch = cleanSql.match(/\bGROUP\s+BY\s+([\s\S]+?)(?=\s+\b(HAVING|ORDER\s+BY|LIMIT)\b|$)/i);
  const groupByClause = groupByMatch ? groupByMatch[1].trim() : '';

  // Extract HAVING (between HAVING and (ORDER BY|LIMIT|$))
  const havingMatch = cleanSql.match(/\bHAVING\s+([\s\S]+?)(?=\s+\b(ORDER\s+BY|LIMIT)\b|$)/i);
  const havingClause = havingMatch ? havingMatch[1].trim() : '';

  // Extract ORDER BY (between ORDER BY and (LIMIT|$))
  const orderByMatch = cleanSql.match(/\bORDER\s+BY\s+([\s\S]+?)(?=\s+\bLIMIT\b|$)/i);
  const orderByClause = orderByMatch ? orderByMatch[1].trim() : '';

  // Extract LIMIT (after LIMIT)
  const limitMatch = cleanSql.match(/\bLIMIT\s+([\s\S]+?)$/i);
  const limitClause = limitMatch ? limitMatch[1].trim() : '';

  return {
    selectClause,
    fromClause: fromClause || 'ukt_mahasiswa',
    whereClause,
    groupByClause,
    havingClause,
    orderByClause,
    limitClause,
    rawSql: sql,
  };
}

/**
 * Splits query string into line objects for the code editor
 */
export function sqlToLines(sql: string): { lineNumber: number; text: string }[] {
  return sql.split('\n').map((text, idx) => ({
    lineNumber: idx + 1,
    text,
  }));
}

/**
 * Helper to safely evaluate a simple binary condition on a row
 */
function evaluateCondition(row: TableRow, conditionStr: string): boolean {
  if (!conditionStr || !conditionStr.trim()) return true;

  // Support AND / OR compound logic
  const andParts = conditionStr.split(/\s+\bAND\b\s+/i);
  if (andParts.length > 1) {
    return andParts.every((part) => evaluateCondition(row, part.trim()));
  }

  const orParts = conditionStr.split(/\s+\bOR\b\s+/i);
  if (orParts.length > 1) {
    return orParts.some((part) => evaluateCondition(row, part.trim()));
  }

  // Operators: >=, <=, !=, <>, =, >, <
  const opMatch = conditionStr.match(/([a-zA-Z0-9_()]+)\s*(>=|<=|!=|<>|=|>|<)\s*(.+)/);
  if (!opMatch) return true;

  let field = opMatch[1].trim();
  const op = opMatch[2].trim();
  let expectedRaw = opMatch[3].trim().replace(/^['"]|['"]$/g, '');

  // If field is aggregate e.g. COUNT(nama), map to field or calculate
  let actualVal: any = row[field];
  if (actualVal === undefined) {
    // Try case-insensitive lookup
    const lowerKey = Object.keys(row).find((k) => k.toLowerCase() === field.toLowerCase());
    if (lowerKey) actualVal = row[lowerKey];
  }

  // If actualVal is still undefined, check if field is an aggregate expression like COUNT(nama)
  if (actualVal === undefined) {
    const aggMatch = field.match(/\b(COUNT|MIN|MAX|SUM|AVG)\s*\(([^)]*)\)/i);
    if (aggMatch) {
      const func = aggMatch[1].toUpperCase();
      const argCol = aggMatch[2].trim().toLowerCase();

      // Check if stored with direct functional key
      const aggKey = Object.keys(row).find((k) => {
        const lk = k.toLowerCase().replace(/\s+/g, '');
        return lk === `${func.toLowerCase()}(${argCol})` || (func === 'COUNT' && lk === 'count(*)');
      });

      if (aggKey) {
        actualVal = row[aggKey];
      } else if ((row as any)._groupRows && Array.isArray((row as any)._groupRows)) {
        const gRows: TableRow[] = (row as any)._groupRows;
        if (func === 'COUNT') {
          actualVal = gRows.length;
        } else {
          const vals = gRows.map((r: any) => Number(r[argCol])).filter((n: number) => !isNaN(n));
          if (func === 'MIN') actualVal = vals.length ? Math.min(...vals) : 0;
          else if (func === 'MAX') actualVal = vals.length ? Math.max(...vals) : 0;
          else if (func === 'SUM') actualVal = vals.reduce((a: number, b: number) => a + b, 0);
          else if (func === 'AVG') actualVal = vals.length ? Math.round(vals.reduce((a: number, b: number) => a + b, 0) / vals.length) : 0;
        }
      }
    }
  }

  // Fallback: match any column that includes field or vice versa
  if (actualVal === undefined) {
    for (const [k, v] of Object.entries(row)) {
      if (k.toLowerCase().includes(field.toLowerCase()) || field.toLowerCase().includes(k.toLowerCase())) {
        actualVal = v;
        break;
      }
    }
  }

  if (actualVal === undefined) return false;

  const numActual = Number(actualVal);
  const numExpected = Number(expectedRaw);
  const isNumeric = !isNaN(numActual) && !isNaN(numExpected);

  switch (op) {
    case '=':
      return isNumeric ? numActual === numExpected : String(actualVal).toLowerCase() === expectedRaw.toLowerCase();
    case '!=':
    case '<>':
      return isNumeric ? numActual !== numExpected : String(actualVal).toLowerCase() !== expectedRaw.toLowerCase();
    case '>':
      return isNumeric ? numActual > numExpected : String(actualVal) > expectedRaw;
    case '>=':
      return isNumeric ? numActual >= numExpected : String(actualVal) >= expectedRaw;
    case '<':
      return isNumeric ? numActual < numExpected : String(actualVal) < expectedRaw;
    case '<=':
      return isNumeric ? numActual <= numExpected : String(actualVal) <= expectedRaw;
    default:
      return true;
  }
}

interface SelectColumnDef {
  raw: string;
  isAggregate: boolean;
  func?: 'COUNT' | 'MIN' | 'MAX' | 'SUM' | 'AVG';
  argCol?: string;
  alias: string;
  align: 'left' | 'right' | 'center';
}

function parseSelectColumns(selectClause: string): SelectColumnDef[] {
  // Split columns by comma (excluding commas inside parentheses)
  const cols = selectClause.split(/,(?![^(]*\))/).map((c) => c.trim()).filter(Boolean);

  return cols.map((colStr) => {
    // Check for alias: `expr AS alias` or `expr alias`
    let expr = colStr;
    let alias = '';
    const aliasMatch = colStr.match(/^([\s\S]+?)\s+(?:AS\s+)?([a-zA-Z0-9_]+)$/i);
    if (aliasMatch && !colStr.match(/\b(COUNT|MIN|MAX|SUM|AVG)\s*\([^)]*\)$/i)) {
      expr = aliasMatch[1].trim();
      alias = aliasMatch[2].trim();
    } else {
      alias = expr.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
    }

    // Check for aggregate functions
    const aggMatch = expr.match(/\b(COUNT|MIN|MAX|SUM|AVG)\s*\(([^)]*)\)/i);
    if (aggMatch) {
      const func = aggMatch[1].toUpperCase() as 'COUNT' | 'MIN' | 'MAX' | 'SUM' | 'AVG';
      const argCol = aggMatch[2].trim();
      return {
        raw: colStr,
        isAggregate: true,
        func,
        argCol: argCol === '*' ? 'id' : argCol,
        alias: alias || `${func.toLowerCase()}_${argCol}`,
        align: func === 'COUNT' ? 'center' : 'right',
      };
    }

    return {
      raw: colStr,
      isAggregate: false,
      alias: alias || expr,
      align: expr === 'nominal' || alias.includes('ukt') || alias.includes('total') ? 'right' : 'left',
    };
  });
}

/**
 * Compiles a raw SQL query into an interactive 7-step execution pipeline
 */
export function compileSqlToPipeline(sqlQuery: string): ParseResult {
  try {
    const parsed = parseSqlClauses(sqlQuery);
    const lines = sqlToLines(sqlQuery);

    const findLineNumbers = (pattern: RegExp): number[] => {
      const matched: number[] = [];
      lines.forEach((l) => {
        if (pattern.test(l.text)) matched.push(l.lineNumber);
      });
      return matched.length > 0 ? matched : [1];
    };

    const fromLines = findLineNumbers(/\bFROM\b/i);
    const whereLines = findLineNumbers(/\bWHERE\b/i);
    const groupByLines = findLineNumbers(/\bGROUP\s+BY\b/i);
    const havingLines = findLineNumbers(/\bHAVING\b/i);
    const selectLines = findLineNumbers(/\bSELECT\b/i);
    const orderByLines = findLineNumbers(/\bORDER\s+BY\b/i);
    const limitLines = findLineNumbers(/\bLIMIT\b/i);

    // Initial Base Columns
    const baseColumns: TableColumn[] = [
      { key: 'nama', label: 'nama' },
      { key: 'fakultas', label: 'fakultas' },
      { key: 'status', label: 'status', align: 'center' },
      { key: 'nominal', label: 'nominal', align: 'right' },
    ];

    // ==========================================
    // STEP 1: FROM ukt_mahasiswa
    // ==========================================
    const step1Rows = [...RAW_UKT_MAHASISWA];
    const step1: ExecutionStep = {
      id: 1,
      stepKey: 'FROM',
      label: '1. FROM',
      subtitle: 'Memuat Sumber Data',
      clause: 'FROM ukt_mahasiswa',
      description: `Query engine memuat seluruh tabel mentah ukt_mahasiswa (${step1Rows.length} baris) ke dalam buffer memori kerja.`,
      explanation: {
        whyOrder: 'Engine harus mengidentifikasi tabel sumber (ukt_mahasiswa) sebelum memfilter baris atau menghitung agregasi.',
        engineAction: `Memuat ${step1Rows.length} baris mentah tabel ukt_mahasiswa ke dalam memori kerja eksekusi.`,
        pitfallAvoided: 'Kolom tidak dapat diproses jika tabel belum dialokasikan ke memori.',
      },
      activeSqlLines: fromLines,
      soundType: 'scan',
      columns: baseColumns,
      getRows: () => ({
        evaluatingRows: step1Rows,
        resultRows: step1Rows,
      }),
    };

    // ==========================================
    // STEP 2: WHERE <condition>
    // ==========================================
    let step2Evaluating: TableRow[] = [];
    let step2Result: TableRow[] = [];

    if (parsed.whereClause) {
      step2Evaluating = step1Rows.map((r) => {
        const pass = evaluateCondition(r, parsed.whereClause);
        return {
          ...r,
          isPassingFilter: pass,
          isFailingFilter: !pass,
        };
      });
      step2Result = step2Evaluating.filter((r) => r.isPassingFilter);
    } else {
      step2Evaluating = [...step1Rows];
      step2Result = [...step1Rows];
    }

    const droppedWhereCount = step1Rows.length - step2Result.length;
    const step2: ExecutionStep = {
      id: 2,
      stepKey: 'WHERE',
      label: '2. WHERE',
      subtitle: 'Filter Baris Individual',
      clause: parsed.whereClause ? `WHERE ${parsed.whereClause}` : 'WHERE (No Filter)',
      description: parsed.whereClause
        ? `Menyaring baris mentah per baris: ${droppedWhereCount} baris tereliminasi, menyisakan ${step2Result.length} baris lolos kriteria.`
        : 'Klausa WHERE tidak dispesifikasikan; seluruh baris lolos tanpa eliminasi.',
      explanation: {
        whyOrder: 'Menyaring baris individual sebelum GROUP BY menghemat memori dan beban kalkulasi agregasi secara drastis.',
        engineAction: `Mengevaluasi predicate (${parsed.whereClause || 'none'}). Menyisakan ${step2Result.length} baris.`,
        pitfallAvoided: 'Alias SELECT belum ada di tahap ini, sehingga tidak bisa dipakai di WHERE.',
      },
      activeSqlLines: whereLines,
      soundType: 'filter',
      columns: baseColumns,
      getRows: () => ({
        evaluatingRows: step2Evaluating,
        resultRows: step2Result,
      }),
    };

    // ==========================================
    // STEP 3: GROUP BY <columns>
    // ==========================================
    const selectColDefs = parseSelectColumns(parsed.selectClause);
    const groupCol = parsed.groupByClause.trim();

    let step3Evaluating: TableRow[] = [];
    let step3Result: TableRow[] = [];
    let step3Columns: TableColumn[] = [];

    if (groupCol) {
      // Group step2Result by groupCol
      const groupsMap = new Map<string, TableRow[]>();
      step2Result.forEach((row) => {
        const key = String(row[groupCol] ?? 'Unknown');
        if (!groupsMap.has(key)) groupsMap.set(key, []);
        groupsMap.get(key)!.push(row);
      });

      // Compute aggregates for each group
      step3Result = Array.from(groupsMap.entries()).map(([key, groupRows], idx) => {
        const rowObj: TableRow = {
          id: `group-${key.toLowerCase()}`,
          [groupCol]: key,
          isMerged: true,
          isHighlight: idx === 0,
        };

        // Compute each requested aggregate
        selectColDefs.forEach((colDef) => {
          if (colDef.isAggregate && colDef.func && colDef.argCol) {
            const vals = groupRows.map((r) => Number(r[colDef.argCol!])).filter((n) => !isNaN(n));
            let val = 0;
            if (colDef.func === 'COUNT') {
              val = groupRows.length;
            } else if (colDef.func === 'MIN') {
              val = vals.length > 0 ? Math.min(...vals) : 0;
            } else if (colDef.func === 'MAX') {
              val = vals.length > 0 ? Math.max(...vals) : 0;
            } else if (colDef.func === 'SUM') {
              val = vals.reduce((a, b) => a + b, 0);
            } else if (colDef.func === 'AVG') {
              val = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
            }
            rowObj[colDef.alias] = val;
            rowObj[`${colDef.func}(${colDef.argCol})`] = val;
            rowObj[`${colDef.func.toLowerCase()}(${colDef.argCol.toLowerCase()})`] = val;
            rowObj[colDef.func.toLowerCase()] = val;
          } else if (!colDef.isAggregate) {
            rowObj[colDef.alias] = groupRows[0]?.[colDef.alias] ?? groupRows[0]?.[colDef.raw] ?? key;
          }
        });

        (rowObj as any)._groupRows = groupRows;

        return rowObj;
      });

      step3Evaluating = step3Result.map((r) => ({ ...r }));

      // Form step 3 columns
      step3Columns = [
        { key: groupCol, label: groupCol },
        ...selectColDefs
          .filter((c) => c.alias !== groupCol)
          .map((c) => ({
            key: c.alias,
            label: c.isAggregate ? `${c.func}(${c.argCol})` : c.alias,
            align: c.align,
          })),
      ];
    } else {
      // No group by
      step3Evaluating = [...step2Result];
      step3Result = [...step2Result];
      step3Columns = baseColumns;
    }

    const step3: ExecutionStep = {
      id: 3,
      stepKey: 'GROUP_BY',
      label: '3. GROUP BY',
      subtitle: 'Pengelompokan & Agregasi',
      clause: groupCol ? `GROUP BY ${groupCol}` : 'GROUP BY (None)',
      description: groupCol
        ? `Baris dengan ${groupCol} identik disatukan menjadi ${step3Result.length} grup, dan nilai agregasi dihitung per grup.`
        : 'Tidak ada pengelompokan baris; dataset tetap berupa baris individual.',
      explanation: {
        whyOrder: 'Setelah data tidak valid dibuang oleh WHERE, baris dikelompokkan ke bucket unik untuk kalkulasi fungsi agregat.',
        engineAction: groupCol
          ? `Meringkas ${step2Result.length} baris menjadi ${step3Result.length} grup berdasarkan kolom ${groupCol}.`
          : 'Melewati agregasi pengelompokan.',
        pitfallAvoided: 'Kolom non-agregat di SELECT harus tercantum dalam klausa GROUP BY.',
      },
      activeSqlLines: groupByLines,
      soundType: 'merge',
      columns: step3Columns,
      getRows: () => ({
        evaluatingRows: step3Evaluating,
        resultRows: step3Result,
      }),
    };

    // ==========================================
    // STEP 4: HAVING <condition>
    // ==========================================
    let step4Evaluating: TableRow[] = [];
    let step4Result: TableRow[] = [];

    if (parsed.havingClause) {
      step4Evaluating = step3Result.map((r) => {
        const pass = evaluateCondition(r, parsed.havingClause);
        return {
          ...r,
          isPassingHaving: pass,
          isFailingHaving: !pass,
        };
      });
      step4Result = step4Evaluating.filter((r) => r.isPassingHaving);
    } else {
      step4Evaluating = [...step3Result];
      step4Result = [...step3Result];
    }

    const droppedHavingCount = step3Result.length - step4Result.length;
    const step4: ExecutionStep = {
      id: 4,
      stepKey: 'HAVING',
      label: '4. HAVING',
      subtitle: 'Filter Hasil Agregasi',
      clause: parsed.havingClause ? `HAVING ${parsed.havingClause}` : 'HAVING (No Filter)',
      description: parsed.havingClause
        ? `Mengevaluasi hasil kalkulasi tiap grup: ${droppedHavingCount} grup gugur, menyisakan ${step4Result.length} grup yang lolos.`
        : 'Klausa HAVING tidak digunakan; semua grup hasil GROUP BY diteruskan.',
      explanation: {
        whyOrder: 'HAVING hanya dapat dieksekusi setelah GROUP BY karena membutuhkan nilai hasil fungsi agregasi.',
        engineAction: `Mengevaluasi filter agregat (${parsed.havingClause || 'none'}). Menyisakan ${step4Result.length} grup.`,
        pitfallAvoided: 'Fungsi agregat TIDAK BISA diletakkan di WHERE; wajib memakai HAVING.',
      },
      activeSqlLines: havingLines,
      soundType: 'filter',
      columns: step3Columns,
      getRows: () => ({
        evaluatingRows: step4Evaluating,
        resultRows: step4Result,
      }),
    };

    // ==========================================
    // STEP 5: SELECT <columns>
    // ==========================================
    const selectColumns: TableColumn[] = selectColDefs.map((c) => ({
      key: c.alias,
      label: c.alias,
      align: c.align,
    }));

    const step5Result: TableRow[] = step4Result.map((r) => {
      const proj: TableRow = { id: r.id };
      selectColDefs.forEach((c) => {
        proj[c.alias] = r[c.alias] ?? r[c.raw] ?? r[c.argCol || ''] ?? null;
      });
      return proj;
    });

    const step5: ExecutionStep = {
      id: 5,
      stepKey: 'SELECT',
      label: '5. SELECT',
      subtitle: 'Proyeksi Kolom & Alias',
      clause: `SELECT ${selectColDefs.map((c) => c.alias).join(', ')}`,
      description: `Memproyeksikan ${selectColumns.length} kolom hasil dan meresmikan penamaan alias di memori kerja.`,
      explanation: {
        whyOrder: 'SELECT dieksekusi setelah filter agar hanya memproyeksikan kolom untuk baris yang valid.',
        engineAction: `Membuang kolom sementara dan membentuk skema final dengan ${selectColumns.length} kolom.`,
        pitfallAvoided: 'Nama alias baru sah dan tersedia di tahap ini, tidak dapat dipanggil di WHERE sebelumnya.',
      },
      activeSqlLines: selectLines,
      soundType: 'scan',
      columns: selectColumns,
      getRows: () => ({
        evaluatingRows: step5Result,
        resultRows: step5Result,
      }),
    };

    // ==========================================
    // STEP 6: ORDER BY <col> [ASC|DESC]
    // ==========================================
    let step6Result = [...step5Result];
    let sortCol = '';
    let sortDir: 'ASC' | 'DESC' = 'ASC';

    if (parsed.orderByClause) {
      const sortMatch = parsed.orderByClause.trim().match(/^([a-zA-Z0-9_]+)(?:\s+(ASC|DESC))?$/i);
      if (sortMatch) {
        sortCol = sortMatch[1];
        sortDir = (sortMatch[2]?.toUpperCase() as 'ASC' | 'DESC') || 'ASC';

        step6Result.sort((a, b) => {
          const valA = a[sortCol];
          const valB = b[sortCol];
          const numA = Number(valA);
          const numB = Number(valB);

          if (!isNaN(numA) && !isNaN(numB)) {
            return sortDir === 'DESC' ? numB - numA : numA - numB;
          }
          return sortDir === 'DESC'
            ? String(valB).localeCompare(String(valA))
            : String(valA).localeCompare(String(valB));
        });
      }
    }

    step6Result = step6Result.map((r, idx) => ({
      ...r,
      rank: idx + 1,
      isHighlight: idx === 0,
    }));

    const step6: ExecutionStep = {
      id: 6,
      stepKey: 'ORDER_BY',
      label: '6. ORDER BY',
      subtitle: 'Pengurutan Baris',
      clause: parsed.orderByClause ? `ORDER BY ${parsed.orderByClause}` : 'ORDER BY (None)',
      description: parsed.orderByClause
        ? `Baris diurutkan berdasarkan kolom ${sortCol} secara ${sortDir}.`
        : 'Tidak ada klausul ORDER BY; urutan baris mengikuti urutan komputasi sebelumnya.',
      explanation: {
        whyOrder: 'Sorting adalah operasi O(n log n), sehingga dilakukan di akhir pada dataset hasil proyeksi yang lebih ringkas.',
        engineAction: parsed.orderByClause
          ? `Mengurutkan ${step6Result.length} baris secara in-memory (${sortCol} ${sortDir}).`
          : 'Melewati proses pengurutan.',
        pitfallAvoided: 'ORDER BY boleh menggunakan nama alias dari SELECT karena SELECT sudah dieksekusi sebelumnya.',
      },
      activeSqlLines: orderByLines,
      soundType: 'sort',
      columns: selectColumns,
      getRows: () => ({
        evaluatingRows: step6Result,
        resultRows: step6Result,
      }),
    };

    // ==========================================
    // STEP 7: LIMIT <number>
    // ==========================================
    let step7Evaluating: TableRow[] = [...step6Result];
    let step7Result: TableRow[] = [...step6Result];

    if (parsed.limitClause) {
      const limitVal = parseInt(parsed.limitClause, 10);
      if (!isNaN(limitVal) && limitVal > 0) {
        step7Evaluating = step6Result.map((r, idx) => ({
          ...r,
          isSlicedLimit: idx >= limitVal,
        }));
        step7Result = step6Result.slice(0, limitVal);
      }
    }

    const step7: ExecutionStep = {
      id: 7,
      stepKey: 'LIMIT',
      label: '7. LIMIT',
      subtitle: 'Pemotongan Hasil',
      clause: parsed.limitClause ? `LIMIT ${parsed.limitClause}` : 'LIMIT (None)',
      description: parsed.limitClause
        ? `Mengambil ${step7Result.length} baris teratas (LIMIT ${parsed.limitClause}). Eksekusi query selesai!`
        : `Menyajikan seluruh ${step7Result.length} baris hasil tanpa pemotongan. Eksekusi query selesai!`,
      explanation: {
        whyOrder: 'LIMIT dijalankan paling akhir setelah urutan baris sudah final agar hasilnya deterministik.',
        engineAction: `Memotong dataset menjadi ${step7Result.length} baris final.`,
        pitfallAvoided: 'Menjalankan LIMIT tanpa ORDER BY menghasilkan baris acak yang tidak dapat diprediksi.',
      },
      activeSqlLines: limitLines,
      soundType: 'success',
      columns: selectColumns,
      getRows: () => ({
        evaluatingRows: step7Evaluating,
        resultRows: step7Result,
      }),
    };

    return {
      success: true,
      pipeline: [step1, step2, step3, step4, step5, step6, step7],
      parsedQuery: parsed,
      lines,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Gagal memproses query SQL.',
      lines: sqlToLines(sqlQuery),
    };
  }
}
