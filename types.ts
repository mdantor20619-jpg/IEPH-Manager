
export interface Student {
  id: string;
  name: string;
  roll: string;
  phone: string;
  admissionDate: string;
  admissionMonth: string;
  status: 'ACTIVE' | 'SUSPENDED';
  fees: { [month: string]: boolean };
  attendance?: { [date: string]: 'PRESENT' | 'ABSENT' };
  fines?: { [date: string]: number };
}

export interface PresentationHistoryEntry {
  dateCompleted: string;
  completedAt: string;
  noteContent?: string;
}

export interface Batch {
  id: string;
  name: string;
  className: string;
  time: string;
  days: string[];
  students: Student[];
  presentation?: string;
  presentationDateTime?: string;
  presentationViewed?: boolean;
  presentationHistory?: PresentationHistoryEntry[];
  monthlyFee: number;
  fineAlertEnabled?: boolean;
  status?: 'ACTIVE' | 'OFFLINE' | 'TERMINATED';
}

export enum View {
  DASHBOARD = 'DASHBOARD',
  BATCH_MANAGER = 'BATCH_MANAGER',
  STUDENT_DETAILS = 'STUDENT_DETAILS',
  AI_ASSISTANT = 'AI_ASSISTANT',
  SETTINGS = 'SETTINGS',
  BACKUP = 'BACKUP'
}

export interface User {
  name: string;
  gmailConnected?: string | null;
}

export interface AppData {
  batches: Batch[];
  lastSync: string | null;
  userEmail: string | null;
  globalMonthlyFee: number;
}
