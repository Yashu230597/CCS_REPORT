export interface ExcelRow {
  id: string;
  rowNumber: number;
  uploadDate: string;
  [key: string]: any;
}

export interface UploadResponse {
  success: boolean;
  data: ExcelRow[];
  totalRows: number;
  fileName: string;
  uploadDate: string;
}

export interface UploadInfo {
  fileName: string;
  uploadDate: string;
  totalRows: number;
}

export interface ApiError {
  error: string;
  details?: string;
}

export interface ColumnConfig {
  title: string;
  dataIndex: string;
  key: string;
  width?: number;
  render?: (text: any, record: ExcelRow) => any;
  sorter?: boolean;
  filters?: Array<{ text: string; value: string }>;
}

export type StatusType = 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'COMPLETED' | 'FAILED' | 'PROCESSING'; 