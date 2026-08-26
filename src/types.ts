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
  | 'fix_free'
  | string;

export type UnitType = 'rails' | 'sqm' | 'fixed' | 'none';

export type CalcFormulaType = 
  | 'curtain_standard'      // base attendance * techs + extra rails over threshold * extraRailRate + specialBonus
  | 'rate_per_sqm'          // quantity (sqm) * ratePerSqm + (baseAttendanceRate * techs)
  | 'rate_per_unit'         // quantity * ratePerUnit + (baseAttendanceRate * techs)
  | 'fixed_per_job'         // fixed amount for job (split among techs)
  | 'fixed_per_tech'        // fixed amount * count of techs (e.g. measure job: 250 * techs)
  | 'free_no_pay';          // 0 pay

export interface JobTypeConfig {
  id: string;
  label: string;
  unitType?: UnitType;
  unitLabel?: string;
  isExcludedFromRails?: boolean;
  calcFormulaType?: CalcFormulaType;
  ratePerUnit?: number; // e.g. 50 THB/sq.m. for WallLinen, 75 for WallMural
  baseAttendancePerTech?: number; // specific attendance pay for this job type per tech
  fixedAmount?: number;
  bonusAmount?: number;
  isSystem?: boolean;
  description?: string;
}

export interface Job {
  id: string;
  date: string; // YYYY-MM-DD
  timeSlot: string;
  orderNo: string;
  customer: string;
  location: string;
  type: JobTypeId;
  rails: number; // Supports 1 decimal place e.g. 12.5 for sqm
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
  baseTechPay: number;        // e.g. 250 THB per tech for standard curtains
  measureTechPay: number;     // e.g. 250 THB per tech
  freeRailsThreshold: number; // e.g. 10 rails
  extraRailRate: number;      // e.g. 20 THB per extra rail
  highLadderBonus: number;    // e.g. 100 THB extra
  scaffoldBonus: number;      // e.g. 200 THB extra
  wallLinenSqmRate?: number;  // e.g. 50 THB per sq.m.
  wallMuralSqmRate?: number;  // e.g. 75 THB per sq.m.
  wallLinenAttendancePay?: number; // ค่าเข้างานช่าง WallLinen แต่ละคน (แยกจากผ้าม่าน)
  wallMuralAttendancePay?: number; // ค่าเข้างานช่าง WallMural แต่ละคน (แยกจากผ้าม่าน)
  customJobTypes?: JobTypeConfig[]; // Custom job types configured by Super Admin
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

