export type Role = 'super_admin' | 'admin';

export interface AppUser {
  id: string;
  username: string;
  password?: string;
  name: string;
  role: Role;
}

export interface TeamMember {
  id: string;
  name: string;
  joinDate: string; // YYYY-MM-DD
  resignDate?: string; // YYYY-MM-DD
}

export interface Team {
  id: string;
  name: string;
  members: TeamMember[];
}

export type JobTypeId = 
  | 'measure' 
  | 'travel_go' 
  | 'travel_back' 
  | 'install' 
  | 'install_high' 
  | 'install_scaffold' 
  | 'install_wall_linen'
  | 'install_wall_mural'
  | 'fix' 
  | 'fix_scaffold' 
  | 'fix_free';

export interface JobTypeConfig {
  id: JobTypeId;
  label: string;
  isExcludedFromRails?: boolean;
}

export interface Job {
  id: string;
  date: string; // YYYY-MM-DD
  timeSlot: string;
  orderNo: string;
  customer: string;
  location: string;
  type: JobTypeId;
  rails: number;
  selectedTechs: string[]; // Member IDs
  isChecked: boolean;
  orderIndex: number;
  createdAt?: string;
}

export type LeaveTypeId = 'sick' | 'business' | 'vacation' | 'absent' | 'no_inc';

export interface LeaveTypeConfig {
  id: LeaveTypeId;
  label: string;
  short: string;
  color: string;
}

export interface LeaveRecord {
  id: string;
  techId: string;
  date: string; // YYYY-MM-DD
  type: LeaveTypeId;
}

export interface PayPeriod {
  id?: string;
  name: string;
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
}

export interface IncentiveRules {
  baseTechPay: number;        // e.g. 250 THB per tech
  measureTechPay: number;     // e.g. 250 THB per tech
  freeRailsThreshold: number; // e.g. 10 rails
  extraRailRate: number;      // e.g. 20 THB per extra rail
  highLadderBonus: number;    // e.g. 100 THB extra
  scaffoldBonus: number;      // e.g. 200 THB extra
  wallLinenSqmRate?: number;  // e.g. 50 THB per sq.m.
  wallMuralSqmRate?: number;  // e.g. 75 THB per sq.m.
}

export interface NotificationState {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export interface ConfirmModalState {
  title: string;
  message: string;
  onConfirm: () => void;
}
