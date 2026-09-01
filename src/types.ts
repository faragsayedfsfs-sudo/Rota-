export interface SlotGroup {
  id: string;
  name: string;
  color: string;
  badgeBg: string;
  slots: string[];
}

export interface ShiftActivity {
  id: string;
  name: string;
  shortCode: string;
  category?: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  isWorking: boolean;
  isBreak: boolean;
  iconName: string;
}

export interface StaffRow {
  id: string;
  name: string;
  role: string;
  skills: string[];
  slots: Record<string, string>; // slot string -> activityId or text
  notes?: string;
  targetHours?: number;
  isUnavailable?: boolean; // When true, staff is on Day Off / Unavailable
  unavailableReason?: 'Day Off' | 'Unavailable' | 'Annual Leave' | 'Sick Leave' | string;
}

export interface RotaConfig {
  id: string;
  title: string;
  date: string;
  dayOfWeek: string;
  department: string;
  targetMinCoverage: number;
  timeSlots: string[];
  rows: StaffRow[];
}

export interface GoogleSpreadsheetMeta {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export interface ShiftPreset {
  id: string;
  name: string;
  description: string;
  startSlot: string;
  endSlot: string;
  lunchSlot: string;
  teaSlot?: string;
  activityId: string;
}

export interface StaffShiftPattern {
  id: string;
  name: string;
  category: 'early' | 'late' | 'peak' | 'standard' | 'specialist' | 'custom';
  description: string;
  iconName?: string;
  color?: string;
  slots: Record<string, string>; // slot -> activity text/id
  totalHours: number;
  breakMinutes: number;
  shiftWindow: string;
}

export interface RotaTemplate {
  id: string;
  name: string;
  description: string;
  category: 'standard' | 'early_shift' | 'late_shift' | 'weekend_peak' | 'skeleton' | 'custom';
  tag: string;
  createdAt?: string;
  isBuiltIn?: boolean;
  staffCount: number;
  targetMinCoverage: number;
  totalHours: number;
  averageHoursPerStaff: number;
  timeSlots: string[];
  rows: Array<{
    name: string;
    role: string;
    slots: Record<string, string>;
  }>;
}

