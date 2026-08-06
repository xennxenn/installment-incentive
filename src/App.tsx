import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, Key, ArrowUp, AlertCircle, CheckCircle, Shield, 
  HelpCircle
} from 'lucide-react';

import { 
  AppUser, Team, TeamMember, Job, LeaveRecord, PayPeriod, 
  IncentiveRules, NotificationState, ConfirmModalState, LeaveTypeId 
} from './types';

import { 
  DEFAULT_SUPER_ADMIN, DEFAULT_USERS, DEFAULT_INCENTIVE_RULES, 
  INITIAL_TEAMS, getInitialJobs, getInitialLeaves, getInitialHolidays 
} from './data/initialData';

import { calculateIncentives } from './utils/calculator';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { JobManagement } from './components/JobManagement';
import { TeamManagement } from './components/TeamManagement';
import { CalendarLeave } from './components/CalendarLeave';
import { Reports } from './components/Reports';
import { AdminSettings } from './components/AdminSettings';
import { IncentiveRulesModal } from './components/IncentiveRulesModal';
import { getCurrentAutoPeriod, generateAutoPeriodsList } from './utils/periodUtils';
import { subscribeToRealtimeData, saveToRealtimeDb } from './utils/firebaseSync';

const APP_KEY_PREFIX = 'curtain_incentive_v2_';

export default function App() {
  // --- State Initialization with LocalStorage Persistence ---
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem(`${APP_KEY_PREFIX}user`);
      if (!saved) return DEFAULT_SUPER_ADMIN;
      const parsed = JSON.parse(saved);
      return parsed && typeof parsed === 'object' && parsed.username ? parsed : DEFAULT_SUPER_ADMIN;
    } catch (e) {
      return DEFAULT_SUPER_ADMIN;
    }
  });

  const [appUsers, setAppUsers] = useState<AppUser[]>(() => {
    try {
      const saved = localStorage.getItem(`${APP_KEY_PREFIX}app_users`);
      if (!saved) return DEFAULT_USERS;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed.filter(Boolean) : DEFAULT_USERS;
    } catch (e) {
      return DEFAULT_USERS;
    }
  });

  const [period, setPeriod] = useState<PayPeriod>(() => {
    try {
      const saved = localStorage.getItem(`${APP_KEY_PREFIX}period`);
      if (!saved) return getCurrentAutoPeriod();
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && parsed.start && parsed.end) {
        return {
          id: String(parsed.id || `p-${Date.now()}`),
          name: String(parsed.name || 'รอบปัจจุบัน'),
          start: String(parsed.start),
          end: String(parsed.end)
        };
      }
      return getCurrentAutoPeriod();
    } catch (e) {
      return getCurrentAutoPeriod();
    }
  });

  const [savedPeriods, setSavedPeriods] = useState<PayPeriod[]>(() => {
    try {
      const saved = localStorage.getItem(`${APP_KEY_PREFIX}saved_periods`);
      if (!saved) return generateAutoPeriodsList();
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const cleaned = parsed
          .filter(Boolean)
          .map((p, idx) => ({
            id: String(p.id || `p-${idx}`),
            name: String(p.name || 'รอบคำนวณ'),
            start: String(p.start || '2026-01-01'),
            end: String(p.end || '2026-01-31')
          }));
        return cleaned.length > 0 ? cleaned : generateAutoPeriodsList();
      }
      return generateAutoPeriodsList();
    } catch (e) {
      return generateAutoPeriodsList();
    }
  });

  const [teams, setTeams] = useState<Team[]>(() => {
    try {
      const saved = localStorage.getItem(`${APP_KEY_PREFIX}teams`);
      if (!saved) return INITIAL_TEAMS;
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed.filter(Boolean) : INITIAL_TEAMS;
    } catch (e) {
      return INITIAL_TEAMS;
    }
  });

  const [jobs, setJobs] = useState<Job[]>(() => {
    try {
      const saved = localStorage.getItem(`${APP_KEY_PREFIX}jobs`);
      if (!saved) return getInitialJobs(getCurrentAutoPeriod().start);
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : getInitialJobs(getCurrentAutoPeriod().start);
    } catch (e) {
      return getInitialJobs(getCurrentAutoPeriod().start);
    }
  });

  const [leaves, setLeaves] = useState<LeaveRecord[]>(() => {
    try {
      const saved = localStorage.getItem(`${APP_KEY_PREFIX}leaves`);
      if (!saved) return getInitialLeaves(getCurrentAutoPeriod().start);
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : getInitialLeaves(getCurrentAutoPeriod().start);
    } catch (e) {
      return getInitialLeaves(getCurrentAutoPeriod().start);
    }
  });

  const [holidays, setHolidays] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`${APP_KEY_PREFIX}holidays`);
      if (!saved) return getInitialHolidays(getCurrentAutoPeriod().start);
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : getInitialHolidays(getCurrentAutoPeriod().start);
    } catch (e) {
      return getInitialHolidays(getCurrentAutoPeriod().start);
    }
  });

  const [themeColor, setThemeColor] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(`${APP_KEY_PREFIX}theme_color`);
      return saved || '#424242';
    } catch (e) {
      return '#424242';
    }
  });

  const [rules, setRules] = useState<IncentiveRules>(() => {
    try {
      const saved = localStorage.getItem(`${APP_KEY_PREFIX}rules`);
      if (!saved) return DEFAULT_INCENTIVE_RULES;
      const parsed = JSON.parse(saved);
      return parsed && typeof parsed === 'object' && parsed.baseTechPay !== undefined ? { ...DEFAULT_INCENTIVE_RULES, ...parsed } : DEFAULT_INCENTIVE_RULES;
    } catch (e) {
      return DEFAULT_INCENTIVE_RULES;
    }
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [jobSortOrder, setJobSortOrder] = useState<'asc' | 'desc'>('desc');
  const [notification, setNotification] = useState<NotificationState | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);

  // Login inputs
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  // --- Realtime Firestore Sync ---
  const isRemoteUpdateRef = useRef(false);
  const hasLoadedFromRemoteRef = useRef(false);

  useEffect(() => {
    const unsubscribe = subscribeToRealtimeData((data) => {
      isRemoteUpdateRef.current = true;

      if (data.jobs && Array.isArray(data.jobs)) {
        setJobs(data.jobs);
      }
      if (data.teams && Array.isArray(data.teams)) {
        setTeams(data.teams);
      }
      if (data.leaves && Array.isArray(data.leaves)) setLeaves(data.leaves);
      if (data.holidays && Array.isArray(data.holidays)) setHolidays(data.holidays);
      if (data.period && data.period.start) setPeriod(data.period);
      if (data.savedPeriods && Array.isArray(data.savedPeriods)) setSavedPeriods(data.savedPeriods);
      if (data.rules && typeof data.rules === 'object') setRules(prev => ({ ...prev, ...data.rules }));
      if (data.appUsers && Array.isArray(data.appUsers)) setAppUsers(data.appUsers);
      if (data.themeColor) setThemeColor(data.themeColor);

      hasLoadedFromRemoteRef.current = true;

      setTimeout(() => {
        isRemoteUpdateRef.current = false;
      }, 500);
    });
    return () => unsubscribe();
  }, []);

  // --- Persistence Effects & Realtime Push ---
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`${APP_KEY_PREFIX}user`, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(`${APP_KEY_PREFIX}user`);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(`${APP_KEY_PREFIX}app_users`, JSON.stringify(appUsers));
    if (!isRemoteUpdateRef.current) {
      saveToRealtimeDb({ appUsers });
    }
  }, [appUsers]);

  useEffect(() => {
    localStorage.setItem(`${APP_KEY_PREFIX}period`, JSON.stringify(period));
    if (!isRemoteUpdateRef.current) {
      saveToRealtimeDb({ period });
    }
  }, [period]);

  useEffect(() => {
    localStorage.setItem(`${APP_KEY_PREFIX}saved_periods`, JSON.stringify(savedPeriods));
    if (!isRemoteUpdateRef.current) {
      saveToRealtimeDb({ savedPeriods });
    }
  }, [savedPeriods]);

  useEffect(() => {
    localStorage.setItem(`${APP_KEY_PREFIX}teams`, JSON.stringify(teams));
    if (!isRemoteUpdateRef.current) {
      saveToRealtimeDb({ teams });
    }
  }, [teams]);

  useEffect(() => {
    localStorage.setItem(`${APP_KEY_PREFIX}jobs`, JSON.stringify(jobs));
    if (!isRemoteUpdateRef.current) {
      saveToRealtimeDb({ jobs });
    }
  }, [jobs]);

  useEffect(() => {
    localStorage.setItem(`${APP_KEY_PREFIX}leaves`, JSON.stringify(leaves));
    if (!isRemoteUpdateRef.current) {
      saveToRealtimeDb({ leaves });
    }
  }, [leaves]);

  useEffect(() => {
    localStorage.setItem(`${APP_KEY_PREFIX}holidays`, JSON.stringify(holidays));
    if (!isRemoteUpdateRef.current) {
      saveToRealtimeDb({ holidays });
    }
  }, [holidays]);

  useEffect(() => {
    localStorage.setItem(`${APP_KEY_PREFIX}theme_color`, themeColor);
    if (!isRemoteUpdateRef.current) {
      saveToRealtimeDb({ themeColor });
    }
  }, [themeColor]);

  useEffect(() => {
    localStorage.setItem(`${APP_KEY_PREFIX}rules`, JSON.stringify(rules));
    if (!isRemoteUpdateRef.current) {
      saveToRealtimeDb({ rules });
    }
  }, [rules]);

  // Toast notification
  const showNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const requestConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ title, message, onConfirm });
  };

  // Contrast text color for theme button background
  const themeTextColor = '#ffffff';

  // Safe Period Fallback
  const safePeriod = (period && period.start && period.end) ? period : getCurrentAutoPeriod();

  // Calculations
  const calcData = useMemo(() => {
    return calculateIncentives(jobs, teams, holidays, leaves, safePeriod, rules, jobSortOrder);
  }, [jobs, teams, holidays, leaves, safePeriod, rules, jobSortOrder]);

  // Auth
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const uInput = usernameInput.trim();
    const pInput = passwordInput.trim();

    if (uInput === DEFAULT_SUPER_ADMIN.username && pInput === DEFAULT_SUPER_ADMIN.password) {
      setCurrentUser(DEFAULT_SUPER_ADMIN);
      showNotification(`ยินดีต้อนรับ ${DEFAULT_SUPER_ADMIN.name}`);
      setUsernameInput('');
      setPasswordInput('');
      return;
    }

    const matched = appUsers.find(u => u.username === uInput && u.password === pInput);
    if (matched) {
      setCurrentUser(matched);
      showNotification(`ยินดีต้อนรับ ${matched?.name || matched?.username || 'ผู้ใช้งาน'}`);
      setUsernameInput('');
      setPasswordInput('');
    } else {
      showNotification('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง', 'error');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    showNotification('ออกจากระบบเรียบร้อย');
  };

  // App User Management
  const handleAddAppUser = (newUser: Omit<AppUser, 'id'>) => {
    if (appUsers.some(u => u.username === newUser.username)) {
      showNotification('Username นี้มีในระบบแล้ว', 'error');
      return;
    }
    const created = { id: `u-${Date.now()}`, ...newUser };
    setAppUsers(prev => [...prev, created]);
    showNotification('เพิ่มผู้ใช้งานระบบสำเร็จ');
  };

  const handleRemoveAppUser = (id: string, username: string) => {
    if (username === DEFAULT_SUPER_ADMIN.username) {
      showNotification('ไม่สามารถลบ Super Admin หลักได้', 'error');
      return;
    }
    requestConfirm('ลบผู้ใช้งานระบบ', `ยืนยันลบบัญชี ${username}?`, () => {
      setAppUsers(prev => prev.filter(u => u.id !== id));
      setConfirmModal(null);
      showNotification('ลบผู้ใช้งานสำเร็จ');
    });
  };

  // Period Management
  const handleSavePeriod = (name: string, start?: string, end?: string) => {
    const newP: PayPeriod = {
      id: `p-${Date.now()}`,
      name: name.trim() || 'รอบคำนวณใหม่',
      start: start || safePeriod.start,
      end: end || safePeriod.end
    };
    setSavedPeriods(prev => [...prev.filter(Boolean), newP]);
    setPeriod(newP);
    showNotification(`บันทึกและเลือกรอบคำนวณ "${newP.name}" เรียบร้อยแล้ว`);
  };

  const handleUpdatePeriod = (updated: PayPeriod) => {
    if (!updated || !updated.id) return;
    setSavedPeriods(prev => prev.map(p => (p && p.id === updated.id ? updated : p)));
    if (safePeriod.id === updated.id) setPeriod(updated);
    showNotification('อัปเดตรอบคำนวณสำเร็จ');
  };

  const handleDeletePeriod = (id: string) => {
    requestConfirm('ลบรอบคำนวณ', 'คุณต้องการลบรอบนี้หรือไม่?', () => {
      setSavedPeriods(prev => {
        const next = prev.filter(p => p && p.id !== id);
        if (safePeriod.id === id) {
          const fallback = next[0] || getCurrentAutoPeriod();
          setPeriod(fallback);
        }
        return next.length > 0 ? next : generateAutoPeriodsList();
      });
      setConfirmModal(null);
      showNotification('ลบรอบคำนวณเรียบร้อย');
    });
  };

  // Helper to format rails/sqm quantity
  const formatQuantity = (jobType: string, val: number) => {
    const raw = Number(val) || 0;
    const isSqm = jobType === 'install_wall_linen' || jobType === 'install_wall_mural';
    return isSqm ? Math.round(raw * 10) / 10 : Math.round(raw);
  };

  // Jobs Handlers
  const handleAddJob = (jobData: Partial<Job>) => {
    const type = jobData.type || 'install';
    const newJob: Job = {
      id: `job-${Date.now()}`,
      date: jobData.date || safePeriod.start,
      timeSlot: jobData.timeSlot || '10.00 - 11.30',
      orderNo: (jobData.orderNo || '').trim().toUpperCase(),
      customer: jobData.customer || '',
      location: jobData.location || '',
      type,
      rails: formatQuantity(type, jobData.rails || 0),
      selectedTechs: jobData.selectedTechs || [],
      isChecked: false,
      orderIndex: Date.now()
    };
    setJobs(prev => [newJob, ...prev]);
    showNotification('เพิ่มงานติดตั้งใหม่สำเร็จ');
  };

  const handleBatchAddJobs = (importedJobsData: Partial<Job>[], updatedTeams?: Team[]) => {
    if (updatedTeams && updatedTeams.length > 0) {
      setTeams(updatedTeams);
    }
    if (!importedJobsData || importedJobsData.length === 0) return;
    const baseTime = Date.now();
    const newJobs: Job[] = importedJobsData.map((data, idx) => {
      const type = data.type || 'install';
      const timestamp = baseTime + idx;
      return {
        id: `job-${timestamp}-${Math.random().toString(36).substring(2, 6)}`,
        date: data.date || safePeriod.start,
        timeSlot: data.timeSlot || '10.00 - 11.30',
        orderNo: (data.orderNo || '').trim().toUpperCase() || '-',
        customer: data.customer || '',
        location: data.location || '',
        type,
        rails: formatQuantity(type, data.rails || 0),
        selectedTechs: data.selectedTechs || [],
        isChecked: !!data.isChecked,
        orderIndex: timestamp
      };
    });

    setJobs(prev => [...newJobs, ...prev]);
    showNotification(`นำเข้าข้อมูลเรียบร้อยแล้ว ${newJobs.length} รายการ`);
  };

  const handleUpdateJob = (id: string, field: keyof Job, value: any) => {
    setJobs(prev =>
      prev.map(j => {
        if (j.id !== id) return j;
        let finalVal = value;
        if (field === 'orderNo' && typeof value === 'string') {
          finalVal = value.toUpperCase();
        }
        const updated = { ...j, [field]: finalVal };
        if (field === 'rails' || field === 'type') {
          updated.rails = formatQuantity(updated.type, updated.rails);
        }
        return updated;
      })
    );
  };

  const handleDeleteJob = (id: string) => {
    requestConfirm('ลบงานติดตั้ง', 'คุณแน่ใจหรือไม่ว่าต้องการลบงานนี้?', () => {
      setJobs(prev => prev.filter(j => j.id !== id));
      setConfirmModal(null);
      showNotification('ลบงานเรียบร้อยแล้ว');
    });
  };

  const handleMoveJob = (id: string, direction: -1 | 1) => {
    const idx = calcData.periodJobs.findIndex(j => j.id === id);
    if (idx === -1 || idx + direction < 0 || idx + direction >= calcData.periodJobs.length) return;

    const j1 = calcData.periodJobs[idx];
    const j2 = calcData.periodJobs[idx + direction];

    let o1 = j1.orderIndex || Date.now();
    let o2 = j2.orderIndex || Date.now() - 1000;
    if (o1 === o2) o1 += 1;

    setJobs(prev =>
      prev.map(j => {
        if (j.id === j1.id) return { ...j, orderIndex: o2 };
        if (j.id === j2.id) return { ...j, orderIndex: o1 };
        return j;
      })
    );
  };

  const handleToggleCheck = (id: string, currentStatus: boolean) => {
    setJobs(prev =>
      prev.map(j => (j.id === id ? { ...j, isChecked: !currentStatus } : j))
    );
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'วันที่',
      'เวลา',
      'Order No',
      'ลูกค้า',
      'สถานที่',
      'ประเภทงาน',
      'จำนวนราง',
      'ช่างที่ปฏิบัติงาน',
      'สถานะการตรวจ',
      'ค่า Incentive งาน (บาท)'
    ];

    const rows = calcData.periodJobs.map(j => {
      const validTechs = (j.selectedTechs || []).filter(tid =>
        teams.some(t => (t.members || []).some(m => m.id === tid))
      );
      const tNames = (teams || [])
        .filter(Boolean)
        .flatMap(t => (t?.members || []).filter(Boolean))
        .filter(m => m && validTechs.includes(m.id))
        .map(m => m.name || '')
        .join('; ');

      const calcVal = (j as any).calculatedValue || 0;

      return [
        j.date,
        `"${j.timeSlot || ''}"`,
        `"${(j.orderNo || '').replace(/"/g, '""')}"`,
        `"${(j.customer || '').replace(/"/g, '""')}"`,
        `"${(j.location || '').replace(/"/g, '""')}"`,
        `"${j.type}"`,
        j.rails,
        `"${tNames}"`,
        j.isChecked ? 'ตรวจแล้ว' : 'ยังไม่ตรวจ',
        calcVal
      ].join(',');
    });

    const blob = new Blob(['\uFEFF' + [headers.join(','), ...rows].join('\n')], {
      type: 'text/csv;charset=utf-8;'
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `curtain_incentive_${period?.name || 'period'}_${period?.start || ''}_to_${period?.end || ''}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('ส่งออกไฟล์ CSV สำเร็จ');
  };

  // Team & Member Management Handlers
  const handleAddTeam = (name: string) => {
    const newT: Team = { id: `t-${Date.now()}`, name, members: [] };
    const nextTeams = [...teams, newT];
    setTeams(nextTeams);
    saveToRealtimeDb({ teams: nextTeams });
    showNotification(`สร้างทีม ${name} เรียบร้อยแล้ว`);
  };

  const handleDeleteTeam = (id: string) => {
    requestConfirm('ลบทีมช่าง', 'การลบทีมจะมีผลกับสถิติรายงาน ยืนยันลบหรือไม่?', () => {
      const nextTeams = teams.filter(t => t.id !== id);
      setTeams(nextTeams);
      saveToRealtimeDb({ teams: nextTeams });
      setConfirmModal(null);
      showNotification('ลบทีมเรียบร้อยแล้ว');
    });
  };

  const handleAddMember = (teamId: string, memberData: Omit<TeamMember, 'id'>) => {
    const newMemberRecord: TeamMember = { id: `m-${Date.now()}`, ...memberData };
    const nextTeams = teams.map(t => (t.id === teamId ? { ...t, members: [...(t.members || []), newMemberRecord] } : t));
    setTeams(nextTeams);
    saveToRealtimeDb({ teams: nextTeams });
    showNotification(`เพิ่มช่าง ${memberData?.name || ''} เข้าทีมเรียบร้อย`);
  };

  const handleUpdateMember = (teamId: string, memberId: string, data: Partial<TeamMember>) => {
    const nextTeams = teams.map(t =>
      t.id === teamId
        ? {
            ...t,
            members: (t.members || []).map(m => (m.id === memberId ? { ...m, ...data } : m))
          }
        : t
    );
    setTeams(nextTeams);
    saveToRealtimeDb({ teams: nextTeams });
    showNotification('อัปเดตข้อมูลช่างสำเร็จ');
  };

  const handleDeleteMember = (teamId: string, memberId: string) => {
    requestConfirm('ลบช่างออกจากทีม', 'ยืนยันลบสมาชิกท่านนี้?', () => {
      const nextTeams = teams.map(t =>
        t.id === teamId ? { ...t, members: (t.members || []).filter(m => m.id !== memberId) } : t
      );
      setTeams(nextTeams);
      saveToRealtimeDb({ teams: nextTeams });
      setConfirmModal(null);
      showNotification('ลบช่างเรียบร้อยแล้ว');
    });
  };

  const handleTransferMember = (
    sourceTeamId: string,
    member: TeamMember,
    targetTeamId: string,
    effectiveDate: string
  ) => {
    const sourceTeam = teams.find(t => t.id === sourceTeamId);
    const targetTeam = teams.find(t => t.id === targetTeamId);

    if (!sourceTeam || !targetTeam) return;

    // Set resign date for source team record
    const updatedSourceMembers = (sourceTeam.members || []).map(m =>
      m.id === member.id ? { ...m, resignDate: effectiveDate } : m
    );

    // Create new record in target team with join date
    const newTargetRecord: TeamMember = {
      id: `m-${Date.now()}`,
      name: member?.name || '',
      joinDate: effectiveDate,
      resignDate: undefined
    };

    const updatedTargetMembers = [...(targetTeam.members || []), newTargetRecord];

    const nextTeams = teams.map(t => {
      if (t.id === sourceTeamId) return { ...t, members: updatedSourceMembers };
      if (t.id === targetTeamId) return { ...t, members: updatedTargetMembers };
      return t;
    });

    setTeams(nextTeams);
    saveToRealtimeDb({ teams: nextTeams });

    showNotification(`ย้าย ${member?.name || ''} ไปยัง ${targetTeam?.name || ''} สำเร็จ ระบบคิดสัดส่วนตามวันย้ายให้อัตโนมัติ`);
  };

  const handleResetTeamsToDefault = () => {
    requestConfirm(
      'ยืนยันรีเซ็ตรายชื่อทีมช่าง',
      'คุณต้องการรีเซ็ตรายชื่อทีมช่างทั้งหมดให้เป็นค่าเริ่มต้นตามโค้ดล่าสุด และบันทึกลงฐานข้อมูล Realtime ใช่หรือไม่?',
      () => {
        setTeams(INITIAL_TEAMS);
        saveToRealtimeDb({ teams: INITIAL_TEAMS });
        setConfirmModal(null);
        showNotification('รีเซ็ตรายชื่อทีมช่างเป็นค่าเริ่มต้นล่าสุดและบันทึกลงฐานข้อมูลแล้ว', 'success');
      }
    );
  };

  // Calendar & Leave
  const handleToggleHoliday = (dateStr: string) => {
    setHolidays(prev =>
      prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]
    );
  };

  const handleSetLeave = (techId: string, dateStr: string, leaveType: LeaveTypeId | 'clear') => {
    if (leaveType === 'clear') {
      setLeaves(prev => prev.filter(l => !(l.techId === techId && l.date === dateStr)));
      showNotification('ยกเลิกวันลาสำเร็จ');
    } else {
      const existing = leaves.find(l => l.techId === techId && l.date === dateStr);
      if (existing) {
        setLeaves(prev =>
          prev.map(l => (l.id === existing.id ? { ...l, type: leaveType } : l))
        );
      } else {
        setLeaves(prev => [
          ...prev,
          { id: `l-${Date.now()}`, techId, date: dateStr, type: leaveType }
        ]);
      }

      // If taking actual leave (not no_inc), unselect tech from jobs on that date
      if (leaveType !== 'no_inc') {
        let removedCount = 0;
        setJobs(prev =>
          prev.map(j => {
            if (j.date === dateStr && (j.selectedTechs || []).includes(techId)) {
              removedCount++;
              return { ...j, selectedTechs: j.selectedTechs.filter(id => id !== techId) };
            }
            return j;
          })
        );

        if (removedCount > 0) {
          showNotification(`บันทึกวันลาและปลดรายชื่อออกจาก ${removedCount} งานในวันนี้แล้ว`, 'warning');
        } else {
          showNotification('บันทึกวันลาสำเร็จ');
        }
      } else {
        showNotification('บันทึกสถานะ No Incentive สำเร็จ');
      }
    }
  };

  // Clean Ghost Data
  const handleCleanGhostData = () => {
    requestConfirm('เคลียร์ข้อมูลช่างตกค้าง', 'ระบบจะตรวจสอบและลบรายชื่อช่างที่ไม่อยู่ในทีม หรือลาออกไปแล้วออกจากรายการงานเก่า ยืนยันหรือไม่?', () => {
      let cleanedJobs = 0;
      setJobs(prev =>
        prev.map(job => {
          const original = job.selectedTechs || [];
          const valid = original.filter(tid => {
            let memberRecord: TeamMember | null = null;
            for (const t of teams) {
              const found = (t.members || []).find(m => m.id === tid);
              if (found) {
                memberRecord = found;
                break;
              }
            }
            if (!memberRecord) return false;
            const isJoined = !memberRecord.joinDate || memberRecord.joinDate <= job.date;
            const isResigned = memberRecord.resignDate && job.date >= memberRecord.resignDate;
            return isJoined && !isResigned;
          });

          if (valid.length !== original.length) {
            cleanedJobs++;
            return { ...job, selectedTechs: valid };
          }
          return job;
        })
      );
      setConfirmModal(null);
      if (cleanedJobs > 0) {
        showNotification(`ทำความสะอาดข้อมูลค้างเรียบร้อยใน ${cleanedJobs} งาน`, 'success');
      } else {
        showNotification('ไม่พบรายชื่อช่างตกค้างในระบบ', 'info');
      }
    });
  };

  // Reset sample data
  const handleResetData = () => {
    requestConfirm('รีเซ็ตข้อมูลตัวอย่าง', 'ข้อมูลปัจจุบันจะถูกรีเซ็ตกลับเป็นค่าเริ่มต้นตัวอย่าง ยืนยันหรือไม่?', () => {
      setTeams(INITIAL_TEAMS);
      setJobs(getInitialJobs(getCurrentAutoPeriod().start));
      setLeaves(getInitialLeaves(getCurrentAutoPeriod().start));
      setHolidays(getInitialHolidays(getCurrentAutoPeriod().start));
      setRules(DEFAULT_INCENTIVE_RULES);
      setConfirmModal(null);
      showNotification('รีเซ็ตข้อมูลตัวอย่างเริ่มต้นเรียบร้อยแล้ว');
    });
  };

  // Clear data for current calculation period (Super Admin only)
  const handleClearPeriodData = () => {
    if (currentUser?.role !== 'super_admin') {
      showNotification('เฉพาะ Super Admin เท่านั้นที่สามารถลบข้อมูลในรอบคำนวณได้', 'warning');
      return;
    }
    requestConfirm(
      'ยืนยันการลบข้อมูลในรอบคำนวณ',
      `คุณต้องการลบรายการงานและวันลาทั้งหมดในรอบคำนวณ (${safePeriod.start} ถึง ${safePeriod.end}) ใช่หรือไม่?`,
      () => {
        const start = safePeriod.start;
        const end = safePeriod.end;
        setJobs(prev => prev.filter(j => j.date && (j.date < start || j.date > end)));
        setLeaves(prev => prev.filter(l => l.date && (l.date < start || l.date > end)));
        setConfirmModal(null);
        showNotification(`ลบข้อมูลในรอบคำนวณ ${start} ถึง ${end} เรียบร้อยแล้ว`, 'success');
      }
    );
  };

  // --- Login View ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
        {notification && (
          <div
            className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl shadow-lg text-white flex items-center gap-2 text-xs font-bold ${
              notification.type === 'error' ? 'bg-red-500' : 'bg-emerald-600'
            }`}
          >
            {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
            <span>{notification.message}</span>
          </div>
        )}

        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md text-center border border-gray-200">
          <div className="w-16 h-16 rounded-2xl bg-gray-900 text-white font-black text-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
            P
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Installment Incentive Calculator
          </h2>
          <p className="text-xs text-gray-500 mt-1 mb-6">
            ระบบคำนวณค่า Incentive สำหรับทีมช่างติดตั้งผ้าม่าน
          </p>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">ชื่อผู้ใช้งาน (Username)</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="ชื่อผู้ใช้งาน"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pl-10 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-gray-300"
                  value={usernameInput}
                  onChange={e => setUsernameInput(e.target.value)}
                />
                <Users className="absolute left-3.5 top-3 text-gray-400" size={16} />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">รหัสผ่าน (Password)</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pl-10 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-gray-300"
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                />
                <Key className="absolute left-3.5 top-3 text-gray-400" size={16} />
              </div>
            </div>

            <button
              type="submit"
              style={{ backgroundColor: themeColor, color: themeTextColor }}
              className="w-full font-bold py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-md text-xs mt-2"
            >
              <span>เข้าสู่ระบบ</span>
              <ArrowUp className="rotate-90" size={16} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Main Application View ---
  return (
    <div className="min-h-screen bg-gray-50/60 text-sm font-sans text-gray-800 pb-20 relative">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-2xl shadow-xl text-white flex items-center gap-2 text-xs font-bold no-print ${
            notification.type === 'error'
              ? 'bg-red-500'
              : notification.type === 'warning'
              ? 'bg-amber-500'
              : 'bg-emerald-600'
          }`}
        >
          {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-[100] p-4 no-print">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-gray-900">{confirmModal.title}</h3>
            <p className="text-xs text-gray-600 leading-relaxed">{confirmModal.message}</p>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rules Modal */}
      <IncentiveRulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
        rules={rules}
        onSaveRules={newRules => {
          setRules(newRules);
          showNotification('บันทึกพารามิเตอร์เกณฑ์ Incentive ใหม่เรียบร้อยแล้ว');
        }}
        themeColor={themeColor}
        themeTextColor={themeTextColor}
      />

      {/* Sticky Header Nav */}
      <Header
        currentUser={currentUser}
        period={safePeriod}
        setPeriod={setPeriod}
        savedPeriods={savedPeriods}
        onSavePeriod={handleSavePeriod}
        onUpdatePeriod={handleUpdatePeriod}
        onDeletePeriod={handleDeletePeriod}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        themeColor={themeColor}
        themeTextColor={themeTextColor}
        onLogout={handleLogout}
        onOpenRulesModal={() => setShowRulesModal(true)}
      />

      {/* Main Tab Contents */}
      <main className={`w-full px-3 md:px-6 py-6 ${activeTab !== 'reports' ? 'no-print' : ''}`}>
        {activeTab === 'dashboard' && (
          <Dashboard
            calcData={calcData}
            themeColor={themeColor}
            themeTextColor={themeTextColor}
            rules={rules}
            period={safePeriod}
            holidays={holidays}
            leaves={leaves}
            teams={teams}
            onOpenRulesModal={() => setShowRulesModal(true)}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'jobs' && (
          <JobManagement
            jobs={jobs}
            teams={teams}
            leaves={leaves}
            rules={rules}
            onAddJob={handleAddJob}
            onBatchAddJobs={handleBatchAddJobs}
            onUpdateJob={handleUpdateJob}
            onDeleteJob={handleDeleteJob}
            onMoveJob={handleMoveJob}
            onToggleCheck={handleToggleCheck}
            onExportCSV={handleExportCSV}
            themeColor={themeColor}
            themeTextColor={themeTextColor}
            periodStart={safePeriod.start}
            periodEnd={safePeriod.end}
            jobSortOrder={jobSortOrder}
            setJobSortOrder={setJobSortOrder}
          />
        )}

        {activeTab === 'teams' && (
          <TeamManagement
            teams={teams}
            onAddTeam={handleAddTeam}
            onDeleteTeam={handleDeleteTeam}
            onAddMember={handleAddMember}
            onUpdateMember={handleUpdateMember}
            onDeleteMember={handleDeleteMember}
            onTransferMember={handleTransferMember}
            onResetTeamsToDefault={handleResetTeamsToDefault}
            themeColor={themeColor}
            themeTextColor={themeTextColor}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarLeave
            teams={teams}
            holidays={holidays}
            leaves={leaves}
            periodStart={safePeriod.start}
            periodEnd={safePeriod.end}
            onToggleHoliday={handleToggleHoliday}
            onSetLeave={handleSetLeave}
          />
        )}

        {activeTab === 'reports' && (
          <Reports
            teams={teams}
            calcData={calcData}
            period={safePeriod}
            themeColor={themeColor}
            themeTextColor={themeTextColor}
          />
        )}

        {activeTab === 'admin' && currentUser?.role === 'super_admin' && (
          <AdminSettings
            currentUser={currentUser}
            appUsers={appUsers}
            onAddUser={handleAddAppUser}
            onRemoveUser={handleRemoveAppUser}
            themeColor={themeColor}
            onSaveTheme={color => {
              setThemeColor(color);
              showNotification('บันทึกเปลี่ยนสีธีมหลักเรียบร้อย');
            }}
            onCleanGhostData={handleCleanGhostData}
            onResetData={handleResetData}
            periodStart={safePeriod.start}
            periodEnd={safePeriod.end}
            onClearPeriodData={handleClearPeriodData}
          />
        )}
      </main>
    </div>
  );
}
