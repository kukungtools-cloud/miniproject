export type StepKey = 
  | 'FROM' 
  | 'WHERE' 
  | 'GROUP_BY' 
  | 'HAVING' 
  | 'SELECT' 
  | 'ORDER_BY' 
  | 'LIMIT';

export type AudioSoundType = 'scan' | 'filter' | 'merge' | 'sort' | 'success';

export interface TableRow {
  id: string | number;
  nama?: string;
  fakultas?: string;
  status?: string;
  nominal?: number;
  jumlah_mhs_lunas?: number;
  ukt_terendah?: number;
  ukt_tertinggi?: number;
  total_ukt?: number;
  rata_rata_ukt?: number;
  rank?: number;
  // Visual state flags for animations & transitions
  isFailingFilter?: boolean;
  isPassingFilter?: boolean;
  isMerged?: boolean;
  isFailingHaving?: boolean;
  isPassingHaving?: boolean;
  isSlicedLimit?: boolean;
  isHighlight?: boolean;
  [key: string]: unknown;
}

export interface TableColumn {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  badge?: string;
}

export interface StepExplanation {
  whyOrder: string;
  engineAction: string;
  pitfallAvoided: string;
}

export interface ExecutionStep {
  id: number;
  stepKey: StepKey;
  label: string;
  subtitle: string;
  clause: string;
  description: string;
  explanation: StepExplanation;
  activeSqlLines: number[];
  soundType: AudioSoundType;
  columns: TableColumn[];
  getRows: () => {
    evaluatingRows: TableRow[];
    resultRows: TableRow[];
  };
}

export type PlaybackSpeed = 0.5 | 1 | 2;
