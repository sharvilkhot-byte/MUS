export type Screenshot = {
  path: string;
  data: string; // Base64
  isMobile: boolean;
};

export type StreamChunk = {
  type: 'status' | 'data' | 'error' | 'complete';
  message?: string;
  payload?: any;
};

export type DataChunk = {
  type: 'data';
  payload: {
    key: ExpertKey;
    data: any;
  };
};

export type CompleteChunk = {
  type: 'complete';
  payload: {
    auditId: string;
    screenshotUrl: string;
  };
};

export type AnalysisReport = Record<string, any>;

export type ExpertKey =
  | 'Strategy Audit expert'
  | 'UX Audit expert'
  | 'Product Audit expert'
  | 'Visual Audit expert';


// NEW Types for Mixed Inputs
export type AuditInputType = 'url' | 'upload';

export interface AuditInput {
  type: AuditInputType;
  url?: string; // For type='url'
  file?: File; // For type='upload' (Frontend)
  fileData?: string; // Base64 (Service)
  id: string; // Unique ID for React lists
}