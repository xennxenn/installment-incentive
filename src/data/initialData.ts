import { AppUser, Team, Job, LeaveRecord, IncentiveRules, JobTypeConfig, LeaveTypeConfig } from '../types';

export const LOGO_URL = 'https://lh3.googleusercontent.com/d/1xT2ysUSWkTcFxs1ztoGxZuQcnO_c66Tu';

export const DEFAULT_SUPER_ADMIN: AppUser = {
  id: 'u-admin-1',
  username: 'T58121',
  password: '1234',
  name: 'Admin T58121',
  role: 'super_admin'
};

export const DEFAULT_USERS: AppUser[] = [
  DEFAULT_SUPER_ADMIN,
  {
    id: 'u-admin-2',
    username: 'manager',
    password: '1234',
    name: 'ผู้จัดการแผนกติดตั้ง',
    role: 'admin'
  }
];

export const JOB_TYPES: JobTypeConfig[] = [
  { 
    id: 'install', 
    label: 'ติดตั้งทั่วไป', 
    unitType: 'rails', 
    unitLabel: 'ราง', 
    calcFormulaType: 'curtain_standard', 
    isSystem: true,
    description: 'คิดฐานค่าช่าง + รางส่วนเกินเกินเกณฑ์ฟรี'
  },
  { 
    id: 'install_high', 
    label: 'ติดตั้ง/บันไดสูง', 
    unitType: 'rails', 
    unitLabel: 'ราง', 
    calcFormulaType: 'curtain_standard', 
    bonusAmount: 100, 
    isSystem: true,
    description: 'คิดสูตรมาตรฐาน + โบนัสบันไดสูง 100 บาท'
  },
  { 
    id: 'install_scaffold', 
    label: 'ติดตั้ง/นั่งร้าน', 
    unitType: 'rails', 
    unitLabel: 'ราง', 
    calcFormulaType: 'curtain_standard', 
    bonusAmount: 200, 
    isSystem: true,
    description: 'คิดสูตรมาตรฐาน + โบนัสนั่งร้าน 200 บาท'
  },
  { 
    id: 'install_wall_linen', 
    label: 'ติดตั้ง WallLinen', 
    unitType: 'sqm', 
    unitLabel: 'ตร.ม.', 
    isExcludedFromRails: true, 
    calcFormulaType: 'rate_per_sqm', 
    ratePerUnit: 50, 
    baseAttendancePerTech: 0,
    isSystem: true,
    description: 'คำนวณ 50 บาท/ตร.ม. (+ ค่าเข้างานต่อคนถ้ามี)'
  },
  { 
    id: 'install_wall_mural', 
    label: 'ติดตั้ง WallMural', 
    unitType: 'sqm', 
    unitLabel: 'ตร.ม.', 
    isExcludedFromRails: true, 
    calcFormulaType: 'rate_per_sqm', 
    ratePerUnit: 75, 
    baseAttendancePerTech: 0,
    isSystem: true,
    description: 'คำนวณ 75 บาท/ตร.ม. (+ ค่าเข้างานต่อคนถ้ามี)'
  },
  { 
    id: 'measure', 
    label: 'วัดพื้นที่', 
    unitType: 'none', 
    unitLabel: '-', 
    isExcludedFromRails: true, 
    calcFormulaType: 'fixed_per_tech', 
    fixedAmount: 250, 
    isSystem: true,
    description: 'คิดเหมา 250 บาทต่อคน'
  },
  { 
    id: 'fix', 
    label: 'งานแก้ไข', 
    unitType: 'rails', 
    unitLabel: 'ราง', 
    calcFormulaType: 'curtain_standard', 
    isSystem: true,
    description: 'คิดสูตรผ้าม่านมาตรฐาน'
  },
  { 
    id: 'fix_scaffold', 
    label: 'งานแก้ไข/นั่งร้าน', 
    unitType: 'rails', 
    unitLabel: 'ราง', 
    calcFormulaType: 'curtain_standard', 
    bonusAmount: 200, 
    isSystem: true,
    description: 'คิดสูตรมาตรฐาน + โบนัสนั่งร้าน 200 บาท'
  },
  { 
    id: 'travel_go', 
    label: 'วันเดินทางไป', 
    unitType: 'none', 
    unitLabel: '-', 
    isExcludedFromRails: true, 
    calcFormulaType: 'free_no_pay', 
    isSystem: true,
    description: 'บันทึกวันเดินทาง (ไม่คิดเงิน)'
  },
  { 
    id: 'travel_back', 
    label: 'วันเดินทางกลับ', 
    unitType: 'none', 
    unitLabel: '-', 
    isExcludedFromRails: true, 
    calcFormulaType: 'free_no_pay', 
    isSystem: true,
    description: 'บันทึกวันเดินทาง (ไม่คิดเงิน)'
  },
  { 
    id: 'fix_free', 
    label: 'แก้ไขซ้ำ/ไม่คิดค่าบริการ', 
    unitType: 'none', 
    unitLabel: '-', 
    isExcludedFromRails: true, 
    calcFormulaType: 'free_no_pay', 
    isSystem: true,
    description: 'งานแก้ไขซ้ำ ไม่คิด Incentive'
  }
];

export const DEFAULT_INCENTIVE_RULES: IncentiveRules = {
  baseTechPay: 250,
  measureTechPay: 250,
  freeRailsThreshold: 10,
  extraRailRate: 20,
  highLadderBonus: 100,
  scaffoldBonus: 200,
  wallLinenSqmRate: 50,
  wallMuralSqmRate: 75,
  wallLinenAttendancePay: 0,
  wallMuralAttendancePay: 0,
  customJobTypes: JOB_TYPES
};

export const LEAVE_TYPES: LeaveTypeConfig[] = [
  { id: 'sick', label: 'ลาป่วย', short: 'ป', color: 'bg-red-100 text-red-700 border-red-200' },
  { id: 'business', label: 'ลากิจ', short: 'ก', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { id: 'vacation', label: 'พักร้อน', short: 'พ', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { id: 'absent', label: 'ขาดงาน', short: 'ข', color: 'bg-gray-200 text-gray-700 border-gray-300' },
  { id: 'no_inc', label: 'No Incentive (ทำงานไม่คิดค่าอินเซนทีฟ)', short: 'N', color: 'bg-purple-100 text-purple-700 border-purple-200' }
];

export const TIME_SLOTS = [
  "10.00 - 11.30",
  "10.00 - 14.30",
  "10.00 - 17.00",
  "13.00 - 14.30",
  "13.00 - 17.00",
  "15.30 - 17.00"
];

export const DEFAULT_TIME_SLOT = "10.00 - 11.30";

export const INITIAL_TEAMS: Team[] = [
  {
    id: 't-1',
    name: 'ทีมช่างนาย',
    members: [
      { id: 'm1', name: 'ช่างนาย', joinDate: '2020-01-01' },
      { id: 'm2', name: 'ช่างอาท', joinDate: '2020-01-01' },
      { id: 'm3', name: 'ช่างลิด', joinDate: '2020-01-01' },
      { id: 'm11', name: 'ช่างเซฟ', joinDate: '2020-01-01' }
    ]
  },
  {
    id: 't-2',
    name: 'ทีมช่างเบนซ์',
    members: [
      { id: 'm4', name: 'ช่างเบนซ์', joinDate: '2020-01-01' },
      { id: 'm5', name: 'ช่างกี้', joinDate: '2020-01-01' }
    ]
  },
  {
    id: 't-3',
    name: 'ทีมช่างอั้ม',
    members: [
      { id: 'm6', name: 'ช่างอั้ม', joinDate: '2020-01-01' },
      { id: 'm7', name: 'ช่างต้อม', joinDate: '2020-01-01' },
      { id: 'm8', name: 'ช่างทัด', joinDate: '2020-01-01' }
    ]
  },
  {
    id: 't-4',
    name: 'ทีมตัววิ่ง',
    members: [
      { id: 'm9', name: 'ช่างเวียร์', joinDate: '2020-01-01' }
    ]
  },
  {
    id: 't-5',
    name: 'ทีมวัดพื้นที่',
    members: [
      { id: 'm10', name: 'ช่างเอก', joinDate: '2020-01-01' }
    ]
  }
];

export function getInitialJobs(currentMonthStr: string): Job[] {
  // Generate sample jobs for the current month
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  
  return [
    {
      id: 'job-101',
      date: `${y}-${m}-02`,
      timeSlot: '10.00 - 14.30',
      orderNo: 'ORD-2026-001',
      customer: 'คุณสมชาย (บ้านเดี่ยวราชพฤกษ์)',
      location: 'โครงการ Grand Bangkok Boulevard ราชพฤกษ์',
      type: 'install',
      rails: 18,
      selectedTechs: ['m1', 'm2', 'm3'],
      isChecked: true,
      orderIndex: 1
    },
    {
      id: 'job-102',
      date: `${y}-${m}-03`,
      timeSlot: '10.00 - 11.30',
      orderNo: 'ORD-2026-002',
      customer: 'คุณศิริพร (คอนโดทองหล่อ)',
      location: 'Ashton Chula-Silom ชั้น 24',
      type: 'measure',
      rails: 0,
      selectedTechs: ['m10'],
      isChecked: true,
      orderIndex: 2
    },
    {
      id: 'job-103',
      date: `${y}-${m}-05`,
      timeSlot: '13.00 - 17.00',
      orderNo: 'ORD-2026-003',
      customer: 'คุณนพดล (ทาวน์โฮมบางนา)',
      location: 'Indy Bangna กม.7',
      type: 'install_high',
      rails: 14,
      selectedTechs: ['m4', 'm5'],
      isChecked: true,
      orderIndex: 3
    },
    {
      id: 'job-104',
      date: `${y}-${m}-08`,
      timeSlot: '10.00 - 17.00',
      orderNo: 'ORD-2026-004',
      customer: 'โครงการเพนท์เฮาส์สุขุมวิท 39',
      location: 'The Diplomat 39',
      type: 'install_scaffold',
      rails: 26,
      selectedTechs: ['m6', 'm7', 'm8', 'm9'],
      isChecked: true,
      orderIndex: 4
    },
    {
      id: 'job-105',
      date: `${y}-${m}-10`,
      timeSlot: '10.00 - 14.30',
      orderNo: 'ORD-2026-005',
      customer: 'คุณวิชัย (อาคารสำนักงานสีลม)',
      location: 'Silom Complex ชั้น 18',
      type: 'install',
      rails: 12,
      selectedTechs: ['m1', 'm2'],
      isChecked: false,
      orderIndex: 5
    },
    {
      id: 'job-106',
      date: `${y}-${m}-12`,
      timeSlot: '13.00 - 14.30',
      orderNo: 'ORD-2026-006',
      customer: 'คุณลัดดา (บ้านแฝดแจ้งวัฒนะ)',
      location: 'เศรษฐสิริ แจ้งวัฒนะ',
      type: 'fix',
      rails: 4,
      selectedTechs: ['m9'],
      isChecked: true,
      orderIndex: 6
    },
    {
      id: 'job-107',
      date: `${y}-${m}-15`,
      timeSlot: '10.00 - 17.00',
      orderNo: 'ORD-2026-007',
      customer: 'คุณกิตติศักดิ์ (พูลวิลล่าหัวหิน)',
      location: 'Huahin Lagoon Villa',
      type: 'install',
      rails: 32,
      selectedTechs: ['m1', 'm2', 'm3', 'm4', 'm5'],
      isChecked: false,
      orderIndex: 7
    },
    {
      id: 'job-108',
      date: `${y}-${m}-11`,
      timeSlot: '10.00 - 15.00',
      orderNo: 'ORD-2026-008',
      customer: 'คุณภาณุ (โชว์รูมสาทร)',
      location: 'Sathorn Square ชั้น 12',
      type: 'install_wall_linen',
      rails: 18.5,
      selectedTechs: ['m4', 'm5'],
      isChecked: true,
      orderIndex: 8
    },
    {
      id: 'job-109',
      date: `${y}-${m}-14`,
      timeSlot: '11.00 - 16.00',
      orderNo: 'ORD-2026-009',
      customer: 'คุณสุมล (วิลล่ารัชดา)',
      location: 'Ratchada Private Residence',
      type: 'install_wall_mural',
      rails: 12.8,
      selectedTechs: ['m6', 'm7'],
      isChecked: true,
      orderIndex: 9
    }
  ];
}

export function getInitialLeaves(currentMonthStr: string): LeaveRecord[] {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');

  return [
    { id: 'l-1', techId: 'm3', date: `${y}-${m}-06`, type: 'sick' },
    { id: 'l-2', techId: 'm5', date: `${y}-${m}-11`, type: 'vacation' },
    { id: 'l-3', techId: 'm8', date: `${y}-${m}-14`, type: 'business' }
  ];
}

export function getInitialHolidays(currentMonthStr: string): string[] {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');

  return [`${y}-${m}-01`, `${y}-${m}-13`];
}
