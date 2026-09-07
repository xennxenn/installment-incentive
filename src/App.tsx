import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Users, Key, ArrowUp, AlertCircle, CheckCircle, Shield, 
  HelpCircle
} from 'lucide-react';

import { 
  AppUser, Team, TeamMember, Job, LeaveRecord, PayPeriod, 
  IncentiveRules, NotificationState, ConfirmModalState, LeaveTypeId,
  RuleVersion, PeriodRuleSaveOptions, AutoBackupConfig, BackupInterval
} from './types';

import { 
  DEFAULT_SUPER_ADMIN, DEFAULT_USERS, DEFAULT_INCENTIVE_RULES, 
  INITIAL_TEAMS, getInitialJobs, getInitialLeaves, getInitialHolidays 
} from './data/initialData';

import { calculateIncentives, getEffectiveRulesForPeriod, calculateSingleJobIncentive, formatDateTH, addDays } from './utils/calculator';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { JobManagement } from './components/JobManagement';
import { TeamManagement } from './components/TeamManagement';
import { CalendarLeave } from './components/CalendarLeave';
import { Reports } from './components/Reports';
import { AdminSettings } from './components/AdminSettings';
import { IncentiveRulesModal } from './components/IncentiveRulesModal';
import { getCurrentAutoPeriod, generateAutoPeriodsList } from './utils/periodUtils';
import { 
  subscribeToRealtimeData, 
  saveToRealtimeDb, 
  createDatabaseSnapshot, 
  fetchDatabaseSnapshots, 
  restoreSnapshotById, 
  deleteDatabaseSnapshot,
  exportFullBackupJSON, 
  parseAndValidateBackupJSON,
  SnapshotSummary,
  AppFirebaseData
} from './utils/firebaseSync';

const APP_KEY_PREFIX = 'curtain_incentive_v2_';

// Auto-correction for jobs that were mistakenly parsed with US date format M/D/YY (e.g. 9/1/26 becoming 2026-01-09 instead of 2026-09-01)
const sanitizeCorruptedDates = (jobsList: Job[]): { jobs: Job[]; hasChanged: boolean } => {
  let changed = false;
  const updated = jobsList.map(j => {
    if (j.date === '2026-01-09') {
      const isSuspect =
        ['2600718/1', '2600799/1', '2600770/1', '2600763/1', '10220089/1'].includes(j.orderNo) ||
        ['คุณพัชร์ธนัน', 'คุณนุชรินทร์', 'คุณปัน', 'คุณวลัยพรรณ', 'Mr.Chris Cole'].some(name => (j.customer || '').includes(name));
      if (isSuspect) {
        changed = true;
        return { ...j, date: '2026-09-01' };
      }
    }
    return j;
  });
  return { jobs: updated, hasChanged: changed };
};

// Auto-sanitize leaves for transferred technicians: re-routes leaves to active team member ID and deduplicates leaves on the same day
const sanitizeTransferredLeaves = (
  leavesList: LeaveRecord[],
  teamsList: Team[]
): { leaves: LeaveRecord[]; hasChanged: boolean } => {
  let changed = false;
  const allMembers = (teamsList || []).flatMap(t => t.members || []);
  const seenTechDate = new Map<string, string>(); // "normName_date" -> leaveId

  const cleanList: LeaveRecord[] = [];

  for (const leave of leavesList) {
    if (!leave || !leave.techId || !leave.date) continue;
    const member = allMembers.find(m => m.id === leave.techId);
    if (!member) {
      cleanList.push(leave);
      continue;
    }

    let actualTechId = leave.techId;
    const isBeforeJoin = member.joinDate && leave.date < member.joinDate;
    const isAfterResign = member.resignDate && leave.date >= member.resignDate;

    if (isBeforeJoin && member.transferredFromId) {
      actualTechId = member.transferredFromId;
      changed = true;
    } else if (isAfterResign && member.transferredToId) {
      actualTechId = member.transferredToId;
      changed = true;
    } else if (isBeforeJoin || isAfterResign) {
      // Find if another record exists for the same technician name that is active on this date
      const norm = member.name.trim().toLowerCase();
      const activeRecord = allMembers.find(m =>
        m.name.trim().toLowerCase() === norm &&
        (!m.joinDate || m.joinDate <= leave.date) &&
        (!m.resignDate || leave.date < m.resignDate)
      );
      if (activeRecord) {
        actualTechId = activeRecord.id;
        changed = true;
      }
    }

    const normName = (allMembers.find(m => m.id === actualTechId)?.name || member.name).trim().toLowerCase();
    const key = `${normName}_${leave.date}`;

    if (seenTechDate.has(key)) {
      // Duplicate leave for the same technician on the same day! Discard duplicate
      changed = true;
      continue;
    }

    seenTechDate.set(key, leave.id);
    cleanList.push(actualTechId !== leave.techId ? { ...leave, techId: actualTechId } : leave);
  }

  return { leaves: cleanList, hasChanged: changed };
};

export default function App() {
  // --- State Initialization with LocalStorage Persistence ---
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem(`${APP_KEY_PREFIX}user`);
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      return parsed && typeof parsed === 'object' && parsed.username ? parsed : null;
    } catch (e) {
      return null;
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

  // Snapshots for point-in-time recovery & disaster prevention
  const [snapshots, setSnapshots] = useState<SnapshotSummary[]>([]);
  const [isLoadingSnapshots, setIsLoadingSnapshots] = useState(false);

  // Automated Cloud Backup configuration (hourly, daily, weekly)
  const [autoBackupConfig, setAutoBackupConfig] = useState<AutoBackupConfig>(() => {
    try {
      const saved = localStorage.getItem(`${APP_KEY_PREFIX}auto_backup_config`);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      enabled: true,
      interval: 'daily',
      lastBackupTimestamp: 0
    };
  });

  const loadSnapshots = async () => {
    setIsLoadingSnapshots(true);
    try {
      const list = await fetchDatabaseSnapshots();
      setSnapshots(list);
    } catch (err) {
      console.error('Error fetching snapshots list:', err);
    } finally {
      setIsLoadingSnapshots(false);
    }
  };

  useEffect(() => {
    loadSnapshots();
  }, []);

  const [teams, setTeams] = useState<Team[]>(() => {
    try {
      const saved = localStorage.getItem(`${APP_KEY_PREFIX}teams`);
      if (!saved) return INITIAL_TEAMS;
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Strip out any fake technician m11 generated in previous runs
        const hasFake = parsed.some((t: any) => t?.members?.some((m: any) => m?.id === 'm11' || m?.name === 'ช่างเซฟ'));
        if (hasFake) {
          const cleaned = parsed.map((t: any) => ({
            ...t,
            members: (t.members || []).filter((m: any) => m.id !== 'm11' && m.name !== 'ช่างเซฟ')
          }));
          return cleaned.length > 0 ? cleaned : INITIAL_TEAMS;
        }
        return parsed.filter(Boolean);
      }
      return INITIAL_TEAMS;
    } catch (e) {
      return INITIAL_TEAMS;
    }
  });

  const [jobs, setJobs] = useState<Job[]>(() => {
    try {
      const saved = localStorage.getItem(`${APP_KEY_PREFIX}jobs`);
      if (!saved) return getInitialJobs(getCurrentAutoPeriod().start);
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Check if this contains the generated batch (e.g. job-t1- or ORD-2026-001)
        const isGeneratedFakeBatch = parsed.some((j: any) => 
          (typeof j?.id === 'string' && (j.id.startsWith('job-t1-') || j.id.startsWith('job-t2-'))) ||
          (typeof j?.orderNo === 'string' && j.orderNo.startsWith('ORD-2026-'))
        );
        if (isGeneratedFakeBatch) {
          return getInitialJobs(getCurrentAutoPeriod().start);
        }
        const { jobs: cleanJobs, hasChanged } = sanitizeCorruptedDates(parsed.filter(Boolean));
        if (hasChanged) {
          try {
            localStorage.setItem(`${APP_KEY_PREFIX}jobs`, JSON.stringify(cleanJobs));
          } catch (e) {}
        }
        return cleanJobs;
      }
      return getInitialJobs(getCurrentAutoPeriod().start);
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
      if (Array.isArray(parsed)) {
        // Check if this was the fake holidays array
        if (parsed.includes('2026-08-17') && parsed.includes('2026-08-24')) {
          return getInitialHolidays(getCurrentAutoPeriod().start);
        }
        return parsed.filter(Boolean);
      }
      return getInitialHolidays(getCurrentAutoPeriod().start);
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

  const [ruleVersions, setRuleVersions] = useState<RuleVersion[]>(() => {
    try {
      const saved = localStorage.getItem(`${APP_KEY_PREFIX}rule_versions`);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch (e) {
      return [];
    }
  });

  const [periodRulesMap, setPeriodRulesMap] = useState<Record<string, IncentiveRules>>(() => {
    try {
      const saved = localStorage.getItem(`${APP_KEY_PREFIX}period_rules_map`);
      if (!saved) return {};
      const parsed = JSON.parse(saved);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) {
      return {};
    }
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [jobSortOrder, setJobSortOrder] = useState<'asc' | 'desc' | 'manual'>('manual');
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
        const { jobs: cleanJobs, hasChanged } = sanitizeCorruptedDates(data.jobs);
        setJobs(cleanJobs);
        if (hasChanged) {
          saveToRealtimeDb({ jobs: cleanJobs });
        }
      }
      if (data.teams && Array.isArray(data.teams)) {
        // Anti-ghost sanitizer for "ยังไม่ตรวจ" or invalid tech names
        const ghostIds = new Set<string>();
        const sanitizedTeams = data.teams.map(t => ({
          ...t,
          members: (t.members || []).filter(m => {
            const isGhost = !m.name || m.name.includes('ยังไม่ตรวจ') || m.name.includes('ตรวจแล้ว') || m.name.includes('ตรวจสอบ');
            if (isGhost) ghostIds.add(m.id);
            return !isGhost;
          })
        }));
        setTeams(sanitizedTeams);

        if (ghostIds.size > 0 && data.jobs) {
          setJobs(prevJobs => prevJobs.map(j => ({
            ...j,
            selectedTechs: (j.selectedTechs || []).filter(tid => !ghostIds.has(tid))
          })));
        }
      }
      if (data.leaves && Array.isArray(data.leaves)) {
        const currentTeams = (data.teams && Array.isArray(data.teams)) ? data.teams : teams;
        const sanitized = sanitizeTransferredLeaves(data.leaves, currentTeams);
        setLeaves(sanitized.leaves);
        if (sanitized.hasChanged) {
          saveToRealtimeDb({ leaves: sanitized.leaves });
        }
      }
      if (data.holidays && Array.isArray(data.holidays)) setHolidays(data.holidays);
      if (data.period && data.period.start) setPeriod(data.period);
      if (data.savedPeriods && Array.isArray(data.savedPeriods)) setSavedPeriods(data.savedPeriods);
      if (data.rules && typeof data.rules === 'object') setRules(prev => ({ ...prev, ...data.rules }));
      if (data.appUsers && Array.isArray(data.appUsers)) setAppUsers(data.appUsers);
      if (data.themeColor) setThemeColor(data.themeColor);
      if (data.autoBackupConfig && typeof data.autoBackupConfig === 'object') {
        setAutoBackupConfig(prev => ({ ...prev, ...data.autoBackupConfig }));
      }

      hasLoadedFromRemoteRef.current = true;

      setTimeout(() => {
        isRemoteUpdateRef.current = false;
      }, 500);
    });
    return () => unsubscribe();
  }, []);

  // --- Persistence Effects (LocalStorage + Direct Cloud Firestore Realtime Sync) ---
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`${APP_KEY_PREFIX}user`, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(`${APP_KEY_PREFIX}user`);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(`${APP_KEY_PREFIX}app_users`, JSON.stringify(appUsers));
    if (hasLoadedFromRemoteRef.current && !isRemoteUpdateRef.current) {
      saveToRealtimeDb({ appUsers });
    }
  }, [appUsers]);

  useEffect(() => {
    localStorage.setItem(`${APP_KEY_PREFIX}period`, JSON.stringify(period));
    if (hasLoadedFromRemoteRef.current && !isRemoteUpdateRef.current) {
      saveToRealtimeDb({ period });
    }
  }, [period]);

  useEffect(() => {
    localStorage.setItem(`${APP_KEY_PREFIX}saved_periods`, JSON.stringify(savedPeriods));
    if (hasLoadedFromRemoteRef.current && !isRemoteUpdateRef.current) {
      saveToRealtimeDb({ savedPeriods });
    }
  }, [savedPeriods]);

  useEffect(() => {
    localStorage.setItem(`${APP_KEY_PREFIX}teams`, JSON.stringify(teams));
    if (hasLoadedFromRemoteRef.current && !isRemoteUpdateRef.current) {
      saveToRealtimeDb({ teams });
    }
  }, [teams]);

  useEffect(() => {
    localStorage.setItem(`${APP_KEY_PREFIX}jobs`, JSON.stringify(jobs));
    if (hasLoadedFromRemoteRef.current && !isRemoteUpdateRef.current) {
      saveToRealtimeDb({ jobs });
    }
  }, [jobs]);

  useEffect(() => {
    localStorage.setItem(`${APP_KEY_PREFIX}leaves`, JSON.stringify(leaves));
    if (hasLoadedFromRemoteRef.current && !isRemoteUpdateRef.current) {
      saveToRealtimeDb({ leaves });
    }
  }, [leaves]);

  useEffect(() => {
    localStorage.setItem(`${APP_KEY_PREFIX}holidays`, JSON.stringify(holidays));
    if (hasLoadedFromRemoteRef.current && !isRemoteUpdateRef.current) {
      saveToRealtimeDb({ holidays });
    }
  }, [holidays]);

  useEffect(() => {
    localStorage.setItem(`${APP_KEY_PREFIX}theme_color`, themeColor);
    if (hasLoadedFromRemoteRef.current && !isRemoteUpdateRef.current) {
      saveToRealtimeDb({ themeColor });
    }
  }, [themeColor]);

  useEffect(() => {
    localStorage.setItem(`${APP_KEY_PREFIX}rules`, JSON.stringify(rules));
    if (hasLoadedFromRemoteRef.current && !isRemoteUpdateRef.current) {
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

  // Effective Rules for the active period (supporting historical period rule versions)
  const activeEffectiveRules = useMemo(() => {
    return getEffectiveRulesForPeriod(safePeriod, rules, ruleVersions, periodRulesMap);
  }, [safePeriod, rules, ruleVersions, periodRulesMap]);

  // Calculations
  const calcData = useMemo(() => {
    return calculateIncentives(jobs, teams, holidays, leaves, safePeriod, activeEffectiveRules, jobSortOrder);
  }, [jobs, teams, holidays, leaves, safePeriod, activeEffectiveRules, jobSortOrder]);

  // Save rules with period-scope support & automatic recalculation
  const handleSaveRulesWithOptions = (newRules: IncentiveRules, saveOptions?: PeriodRuleSaveOptions) => {
    const scope = saveOptions?.scope || 'from_period_onward';
    const targetPeriodId = saveOptions?.targetPeriodId || safePeriod.id || 'current';
    const targetPeriod = savedPeriods.find(p => p.id === targetPeriodId) || safePeriod;
    const targetPeriodName = targetPeriod.name || 'รอบปัจจุบัน';
    const targetStartDate = targetPeriod.start || safePeriod.start;

    // 1. Update current working rules
    setRules(newRules);
    localStorage.setItem(`${APP_KEY_PREFIX}rules`, JSON.stringify(newRules));

    // 2. Create version record
    const newVersion: RuleVersion = {
      id: `v_${Date.now()}`,
      name: `สูตร ${scope === 'all_periods' ? 'ทุกรอบคำนวณ' : scope === 'specific_period_only' ? `เฉพาะรอบ ${targetPeriodName}` : `ตั้งแต่รอบ ${targetPeriodName} เป็นต้นไป`}`,
      effectiveFromPeriodId: targetPeriodId,
      effectiveFromPeriodName: targetPeriodName,
      effectiveFromDate: targetStartDate,
      scope: scope,
      specificPeriodId: scope === 'specific_period_only' ? targetPeriodId : undefined,
      rules: newRules,
      createdAt: new Date().toISOString()
    };

    const updatedVersions = [newVersion, ...ruleVersions];
    setRuleVersions(updatedVersions);
    localStorage.setItem(`${APP_KEY_PREFIX}rule_versions`, JSON.stringify(updatedVersions));

    // 3. Update period rules mapping if specific period
    let updatedPeriodMap = { ...periodRulesMap };
    if (scope === 'specific_period_only') {
      updatedPeriodMap[targetPeriodId] = newRules;
      setPeriodRulesMap(updatedPeriodMap);
      localStorage.setItem(`${APP_KEY_PREFIX}period_rules_map`, JSON.stringify(updatedPeriodMap));
    } else if (scope === 'all_periods') {
      updatedPeriodMap = {};
      setPeriodRulesMap({});
      localStorage.removeItem(`${APP_KEY_PREFIX}period_rules_map`);
    }

    // 4. Recalculate all jobs based on their respective effective period rules
    const updatedJobs = jobs.map(job => {
      // Find the period corresponding to this job's date
      const jobPeriod = savedPeriods.find(p => p.start && p.end && job.date >= p.start && job.date <= p.end) || safePeriod;
      const jobEffectiveRules = getEffectiveRulesForPeriod(jobPeriod, newRules, updatedVersions, updatedPeriodMap);
      const computedValue = calculateSingleJobIncentive(job, teams, leaves, jobEffectiveRules);
      return { ...job, calculatedValue: computedValue };
    });

    setJobs(updatedJobs);
    localStorage.setItem(`${APP_KEY_PREFIX}jobs`, JSON.stringify(updatedJobs));

    if (hasLoadedFromRemoteRef.current && !isRemoteUpdateRef.current) {
      saveToRealtimeDb({ rules: newRules, jobs: updatedJobs });
    }

    showNotification(`บันทึกสูตรคำนวณสำเร็จ (${newVersion.name}) และคำนวณยอดใหม่อัตโนมัติเรียบร้อย!`, 'success');
  };

  const handleDeleteRuleVersion = (versionId: string) => {
    const updated = ruleVersions.filter(v => v.id !== versionId);
    setRuleVersions(updated);
    localStorage.setItem(`${APP_KEY_PREFIX}rule_versions`, JSON.stringify(updated));
    showNotification('ลบเวอร์ชันสูตรเรียบร้อยแล้ว');
  };

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
    const now = Date.now();
    const newJob: Job = {
      id: `job-${now}-${Math.random().toString(36).substring(2, 6)}`,
      date: jobData.date || safePeriod.start,
      timeSlot: jobData.timeSlot || '10.00 - 11.30',
      orderNo: (jobData.orderNo || '').trim().toUpperCase(),
      customer: jobData.customer || '',
      location: jobData.location || '',
      type,
      rails: formatQuantity(type, jobData.rails || 0),
      selectedTechs: jobData.selectedTechs || [],
      isChecked: false,
      orderIndex: now + 1000000
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
    const total = importedJobsData.length;
    // Row 0 in CSV gets the highest orderIndex so it appears at the very top, row 1 next, row 2 next, etc.
    const rawNewJobs: Job[] = importedJobsData.map((data, idx) => {
      const type = data.type || 'install';
      const orderIndex = baseTime + (total - idx) * 100;
      return {
        id: `job-${baseTime}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        date: data.date || safePeriod.start,
        timeSlot: data.timeSlot || '10.00 - 11.30',
        orderNo: (data.orderNo || '').trim().toUpperCase() || '-',
        customer: data.customer || '',
        location: data.location || '',
        type,
        rails: formatQuantity(type, data.rails || 0),
        selectedTechs: data.selectedTechs || [],
        isChecked: !!data.isChecked,
        orderIndex
      };
    });

    const newJobs: Job[] = sanitizeCorruptedDates(rawNewJobs).jobs;

    let mergedJobs: Job[] = [];
    setJobs(prev => {
      const maxExisting = prev.reduce((max, j) => Math.max(max, j.orderIndex || 0), 0);
      const shift = maxExisting >= baseTime ? maxExisting - baseTime + 1000 : 0;
      const adjustedNewJobs = shift > 0
        ? newJobs.map(j => ({ ...j, orderIndex: j.orderIndex + shift }))
        : newJobs;
      mergedJobs = [...adjustedNewJobs, ...prev];
      return mergedJobs;
    });

    // Explicitly write to localStorage and remote DB for maximum reliability
    try {
      localStorage.setItem(`${APP_KEY_PREFIX}jobs`, JSON.stringify(mergedJobs.length > 0 ? mergedJobs : newJobs));
      saveToRealtimeDb({
        jobs: mergedJobs.length > 0 ? mergedJobs : newJobs,
        teams: updatedTeams && updatedTeams.length > 0 ? updatedTeams : undefined
      });
    } catch (e) {
      console.warn('Error saving imported jobs directly:', e);
    }

    const insideCount = newJobs.filter(j => j.date && j.date >= safePeriod.start && j.date <= safePeriod.end).length;
    const outsideCount = newJobs.length - insideCount;
    if (outsideCount > 0) {
      showNotification(`นำเข้าข้อมูลเรียบร้อย ${newJobs.length} รายการ (ตรงกับรอบปัจจุบัน ${insideCount} รายการ, ส่วนอีก ${outsideCount} รายการจะแสดงตามรอบวันที่ของงานนั้นๆ)`);
    } else {
      showNotification(`นำเข้าข้อมูลเรียบร้อย ${newJobs.length} รายการ (ตรงตามรอบวันที่ที่เลือก)`);
    }
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
    setJobs(prev => {
      // 1. Build an array of jobs ensuring each has a valid numeric orderIndex
      const indexedList = prev.map((j, i) => ({
        ...j,
        orderIndex: typeof j.orderIndex === 'number' ? j.orderIndex : (prev.length - i) * 1000
      }));

      // 2. Sort according to current orderIndex (descending)
      indexedList.sort((a, b) => (b.orderIndex || 0) - (a.orderIndex || 0));

      const currentIndex = indexedList.findIndex(j => j.id === id);
      if (currentIndex === -1) return prev;

      const targetIndex = currentIndex + direction;
      if (targetIndex < 0 || targetIndex >= indexedList.length) return prev;

      // 3. Swap the items in the indexedList
      const temp = indexedList[currentIndex];
      indexedList[currentIndex] = indexedList[targetIndex];
      indexedList[targetIndex] = temp;

      // 4. Re-assign clean, strictly decreasing orderIndex so order is locked and synced
      return indexedList.map((j, i) => ({
        ...j,
        orderIndex: (indexedList.length - i) * 1000
      }));
    });
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
    setTeams(prevTeams => {
      const sourceTeam = prevTeams.find(t => t.id === teamId);
      const currentMember = sourceTeam?.members?.find(m => m.id === memberId);
      if (!currentMember) return prevTeams;

      let syncedTargetTeamName: string | null = null;
      let syncedDate: string | null = null;
      let syncType: 'departure_to_join' | 'join_to_departure' | null = null;

      // Check if resignDate changed
      const resignDateChanged = data.resignDate !== undefined && data.resignDate !== currentMember.resignDate;
      // Check if joinDate changed
      const joinDateChanged = data.joinDate !== undefined && data.joinDate !== currentMember.joinDate;
      // Check if name changed
      const nameChanged = data.name !== undefined && data.name.trim() !== currentMember.name.trim();

      // Find linked counterpart in other teams
      let linkedTeamId: string | null = null;
      let linkedMemberId: string | null = null;
      let isSourceOldTeam = false;

      // Priority 1: Check explicit IDs
      if (currentMember.transferredToId) {
        for (const t of prevTeams) {
          if (t.id === teamId) continue;
          const found = (t.members || []).find(m => m.id === currentMember.transferredToId);
          if (found) {
            linkedTeamId = t.id;
            linkedMemberId = found.id;
            isSourceOldTeam = true;
            break;
          }
        }
      } else if (currentMember.transferredFromId) {
        for (const t of prevTeams) {
          if (t.id === teamId) continue;
          const found = (t.members || []).find(m => m.id === currentMember.transferredFromId);
          if (found) {
            linkedTeamId = t.id;
            linkedMemberId = found.id;
            isSourceOldTeam = false;
            break;
          }
        }
      }

      // Priority 2: Fallback lookup by matching name
      if (!linkedMemberId) {
        const cleanName = currentMember.name.trim().toLowerCase();
        for (const t of prevTeams) {
          if (t.id === teamId) continue;
          const match = (t.members || []).find(m => m.name.trim().toLowerCase() === cleanName);
          if (match) {
            linkedTeamId = t.id;
            linkedMemberId = match.id;
            if (currentMember.resignDate && !match.resignDate) {
              isSourceOldTeam = true;
            } else if (!currentMember.resignDate && match.resignDate) {
              isSourceOldTeam = false;
            } else if (currentMember.joinDate && match.joinDate && currentMember.joinDate < match.joinDate) {
              isSourceOldTeam = true;
            } else {
              isSourceOldTeam = false;
            }
            break;
          }
        }
      }

      const nextTeams = prevTeams.map(t => {
        // 1. Update member in source team
        if (t.id === teamId) {
          return {
            ...t,
            members: (t.members || []).map(m => {
              if (m.id !== memberId) return m;
              const updated = { ...m, ...data };
              if (linkedTeamId && linkedMemberId) {
                const targetT = prevTeams.find(x => x.id === linkedTeamId);
                if (isSourceOldTeam && !m.transferredToId) {
                  updated.transferredToId = linkedMemberId;
                  updated.transferredToTeamName = targetT?.name;
                } else if (!isSourceOldTeam && !m.transferredFromId) {
                  updated.transferredFromId = linkedMemberId;
                  updated.transferredFromTeamName = targetT?.name;
                }
              }
              return updated;
            })
          };
        }

        // 2. If this team contains the linked counterpart, synchronize!
        if (linkedTeamId && t.id === linkedTeamId && linkedMemberId) {
          return {
            ...t,
            members: (t.members || []).map(m => {
              if (m.id !== linkedMemberId) return m;
              const updated = { ...m };

              // If name was updated, keep name in sync
              if (nameChanged && data.name) {
                updated.name = data.name.trim();
              }

              // Business rule:
              // - วันสิ้นสุดทีมเก่าคือวันสุดท้ายที่ทำงานของทีมเก่า
              // - วันเริ่มต้นทีมใหม่คือวันเริ่มทำงานของทีมใหม่ (+1 วันถัดไป)
              if (isSourceOldTeam) {
                // Source is old team. User updated resignDate (วันสุดท้ายที่ทำงานทีมเก่า)
                if (resignDateChanged && data.resignDate) {
                  const autoNewJoin = addDays(data.resignDate, 1);
                  updated.joinDate = autoNewJoin;
                  syncedTargetTeamName = t.name;
                  syncedDate = autoNewJoin;
                  syncType = 'departure_to_join';
                }
                if (!updated.transferredFromId) {
                  updated.transferredFromId = memberId;
                  updated.transferredFromTeamName = sourceTeam?.name;
                }
              } else {
                // Source is new team. User updated joinDate (วันเริ่มทำงานทีมใหม่)
                if (joinDateChanged && data.joinDate) {
                  const autoOldResign = addDays(data.joinDate, -1);
                  updated.resignDate = autoOldResign;
                  syncedTargetTeamName = t.name;
                  syncedDate = autoOldResign;
                  syncType = 'join_to_departure';
                }
                if (!updated.transferredToId) {
                  updated.transferredToId = memberId;
                  updated.transferredToTeamName = sourceTeam?.name;
                }
              }

              return updated;
            })
          };
        }

        return t;
      });

      localStorage.setItem(`${APP_KEY_PREFIX}teams`, JSON.stringify(nextTeams));
      saveToRealtimeDb({ teams: nextTeams });

      if (syncType === 'departure_to_join' && syncedTargetTeamName && syncedDate) {
        showNotification(
          `อัปเดตข้อมูลช่างสำเร็จ และซิงค์วันเริ่มงานที่ทีมใหม่ (${syncedTargetTeamName}: ${formatDateTH(syncedDate)}) แล้ว`,
          'success'
        );
      } else if (syncType === 'join_to_departure' && syncedTargetTeamName && syncedDate) {
        showNotification(
          `อัปเดตข้อมูลช่างสำเร็จ และซิงค์วันสุดท้ายที่ทำงานทีมเดิม (${syncedTargetTeamName}: ${formatDateTH(syncedDate)}) แล้ว`,
          'success'
        );
      } else {
        showNotification('อัปเดตข้อมูลช่างสำเร็จ', 'success');
      }

      return nextTeams;
    });
  };

  /**
   * Dedicated atomic sync function to align transfer dates between old and new teams in 1 step:
   * - วันสิ้นสุดทีมเก่าคือวันสุดท้ายที่ทำงานของทีมเก่า
   * - วันเริ่มต้นทีมใหม่คือวันเริ่มทำงานของทีมใหม่
   */
  const handleSyncTransferDates = (
    oldTeamId: string,
    oldMemberId: string,
    newTeamId: string,
    newMemberId: string,
    lastWorkingDayOldTeam: string,
    firstWorkingDayNewTeam: string
  ) => {
    setTeams(prevTeams => {
      const oldTeam = prevTeams.find(t => t.id === oldTeamId);
      const newTeam = prevTeams.find(t => t.id === newTeamId);

      const nextTeams = prevTeams.map(t => {
        if (t.id === oldTeamId) {
          return {
            ...t,
            members: (t.members || []).map(m => {
              if (m.id !== oldMemberId) return m;
              return {
                ...m,
                resignDate: lastWorkingDayOldTeam,
                transferredToId: newMemberId,
                transferredToTeamName: newTeam?.name || m.transferredToTeamName
              };
            })
          };
        }
        if (t.id === newTeamId) {
          return {
            ...t,
            members: (t.members || []).map(m => {
              if (m.id !== newMemberId) return m;
              return {
                ...m,
                joinDate: firstWorkingDayNewTeam,
                transferredFromId: oldMemberId,
                transferredFromTeamName: oldTeam?.name || m.transferredFromTeamName
              };
            })
          };
        }
        return t;
      });

      localStorage.setItem(`${APP_KEY_PREFIX}teams`, JSON.stringify(nextTeams));
      saveToRealtimeDb({ teams: nextTeams });

      showNotification(
        `ซิงค์ข้อมูลอัตโนมัติสำเร็จ: ทีมเก่าทำงานวันสุดท้าย ${formatDateTH(lastWorkingDayOldTeam)} • ทีมใหม่เริ่มงาน ${formatDateTH(firstWorkingDayNewTeam)}`,
        'success'
      );

      return nextTeams;
    });
  };

  const handleDeleteMember = (teamId: string, memberId: string) => {
    requestConfirm('ลบช่างออกจากทีม', 'ยืนยันลบสมาชิกท่านนี้?', () => {
      setTeams(prevTeams => {
        const nextTeams = prevTeams.map(t =>
          t.id === teamId ? { ...t, members: (t.members || []).filter(m => m.id !== memberId) } : t
        );
        localStorage.setItem(`${APP_KEY_PREFIX}teams`, JSON.stringify(nextTeams));
        saveToRealtimeDb({ teams: nextTeams });
        return nextTeams;
      });
      setConfirmModal(null);
      showNotification('ลบช่างเรียบร้อยแล้ว');
    });
  };

  const handleTransferMember = (
    sourceTeamId: string,
    member: TeamMember,
    targetTeamId: string,
    departureDate: string,
    newTeamJoinDate?: string
  ) => {
    setTeams(prevTeams => {
      const sourceTeam = prevTeams.find(t => t.id === sourceTeamId);
      const targetTeam = prevTeams.find(t => t.id === targetTeamId);

      if (!sourceTeam || !targetTeam) return prevTeams;

      // Default: new team start date is the day right after departureDate (last working day)
      const actualJoinDate = newTeamJoinDate || (departureDate ? addDays(departureDate, 1) : departureDate);
      const newMemberId = `m-${Date.now()}`;

      // Set resign date and target link for source team record
      const updatedSourceMembers = (sourceTeam.members || []).map(m =>
        m.id === member.id
          ? {
              ...m,
              resignDate: departureDate,
              transferredToId: newMemberId,
              transferredToTeamName: targetTeam.name
            }
          : m
      );

      // Create new record in target team with join date and source link
      const newTargetRecord: TeamMember = {
        id: newMemberId,
        name: member?.name || '',
        joinDate: actualJoinDate,
        resignDate: undefined,
        transferredFromId: member.id,
        transferredFromTeamName: sourceTeam.name
      };

      const updatedTargetMembers = [...(targetTeam.members || []), newTargetRecord];

      const nextTeams = prevTeams.map(t => {
        if (t.id === sourceTeamId) return { ...t, members: updatedSourceMembers };
        if (t.id === targetTeamId) return { ...t, members: updatedTargetMembers };
        return t;
      });

      localStorage.setItem(`${APP_KEY_PREFIX}teams`, JSON.stringify(nextTeams));
      saveToRealtimeDb({ teams: nextTeams });

      showNotification(
        `ย้ายช่าง ${member?.name || ''} ไปยัง ${targetTeam?.name || ''} เรียบร้อย (ทีมเดิมทำงานวันสุดท้าย: ${formatDateTH(departureDate)} • ทีมใหม่เริ่มงาน: ${formatDateTH(actualJoinDate)})`,
        'success'
      );

      return nextTeams;
    });
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
    const allMembers = (teams || []).flatMap(t => t.members || []);
    const targetMember = allMembers.find(m => m.id === techId);

    // Collect all related technician IDs for this person across transfers/teams
    const relatedTechIds = new Set<string>([techId]);
    if (targetMember?.transferredToId) relatedTechIds.add(targetMember.transferredToId);
    if (targetMember?.transferredFromId) relatedTechIds.add(targetMember.transferredFromId);
    if (targetMember?.name) {
      const norm = targetMember.name.trim().toLowerCase();
      allMembers.forEach(m => {
        if (m.name.trim().toLowerCase() === norm) relatedTechIds.add(m.id);
      });
    }

    if (leaveType === 'clear') {
      setLeaves(prev => prev.filter(l => !(relatedTechIds.has(l.techId) && l.date === dateStr)));
      showNotification('ยกเลิกวันลาสำเร็จ');
    } else {
      // Guard: Cannot set leave before starting work or after leaving/transferring from this team
      if (targetMember) {
        if (targetMember.joinDate && dateStr < targetMember.joinDate) {
          showNotification(
            `ไม่สามารถบันทึกวันลาได้เนื่องจากช่างยังไม่ได้เริ่มงานในทีมนี้ (เริ่มงาน ${formatDateTH(targetMember.joinDate)})`,
            'error'
          );
          return;
        }
        if (targetMember.resignDate && dateStr >= targetMember.resignDate) {
          showNotification(
            `ไม่สามารถบันทึกวันลาได้เนื่องจากช่างย้ายทีมหรือออกจากทีมนี้แล้ว (ตั้งแต่วันที่ ${formatDateTH(targetMember.resignDate)})`,
            'error'
          );
          return;
        }
      }

      setLeaves(prev => {
        // Remove any leaves for this technician on dateStr across all related IDs to prevent duplicates
        const filtered = prev.filter(l => !(relatedTechIds.has(l.techId) && l.date === dateStr));
        return [
          ...filtered,
          { id: `l-${Date.now()}`, techId, date: dateStr, type: leaveType }
        ];
      });

      // If taking actual leave (not no_inc), unselect tech from jobs on that date
      if (leaveType !== 'no_inc') {
        let removedCount = 0;
        setJobs(prev =>
          prev.map(j => {
            if (j.date === dateStr && (j.selectedTechs || []).some(id => relatedTechIds.has(id))) {
              removedCount++;
              return {
                ...j,
                selectedTechs: j.selectedTechs.filter(id => !relatedTechIds.has(id))
              };
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
    requestConfirm('เคลียร์ข้อมูลช่างตกค้าง', 'ระบบจะตรวจสอบและลบรายชื่อช่างที่ไม่อยู่ในทีม หรือลาออกไปแล้วออกจากรายการงานเก่า รวมถึงลบวันลาที่ซ้ำซ้อน ยืนยันหรือไม่?', () => {
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

      // Also clean up duplicate/misplaced leaves
      const sanitized = sanitizeTransferredLeaves(leaves, teams);
      if (sanitized.hasChanged) {
        setLeaves(sanitized.leaves);
      }

      setConfirmModal(null);
      if (cleanedJobs > 0 || sanitized.hasChanged) {
        showNotification(`ทำความสะอาดข้อมูลค้างเรียบร้อย (ปรับปรุง ${cleanedJobs} งาน${sanitized.hasChanged ? ' และเคลียร์วันลาซ้ำซ้อน' : ''})`, 'success');
      } else {
        showNotification('ไม่พบรายชื่อช่างตกค้างหรือวันลาซ้ำซ้อนในระบบ', 'info');
      }
    });
  };

  // Export full JSON backup file directly to computer
  const handleExportBackupJSON = () => {
    try {
      const payload: AppFirebaseData = {
        teams,
        jobs,
        leaves,
        holidays,
        period: safePeriod,
        savedPeriods,
        rules,
        appUsers,
        themeColor,
        updatedAt: Date.now()
      };
      exportFullBackupJSON(payload);
      showNotification('ดาวน์โหลดไฟล์สำรองข้อมูล (.json) เรียบร้อยแล้ว', 'success');
    } catch (err: any) {
      showNotification(`ดาวน์โหลดไม่สำเร็จ: ${err?.message || err}`, 'error');
    }
  };

  // Import and restore from uploaded JSON backup file
  const handleImportBackupJSON = async (file: File) => {
    const text = await file.text();
    const imported = parseAndValidateBackupJSON(text);

    // Automatically snapshot current database first for disaster protection
    await createDatabaseSnapshot(`สำรองก่อนกู้คืนไฟล์ ${file.name}`, {
      teams,
      jobs,
      leaves,
      holidays,
      period: safePeriod,
      savedPeriods,
      rules,
      appUsers,
      themeColor,
      updatedAt: Date.now()
    });

    const newTeams = imported.teams || INITIAL_TEAMS;
    const newJobs = imported.jobs || [];
    const newLeaves = imported.leaves || [];
    const newHolidays = imported.holidays || [];
    const newPeriod = imported.period || safePeriod;
    const newSavedPeriods = imported.savedPeriods || savedPeriods;
    const newRules = imported.rules || rules;
    const newAppUsers = imported.appUsers || appUsers;
    const newThemeColor = imported.themeColor || themeColor;

    setTeams(newTeams);
    setJobs(newJobs);
    setLeaves(newLeaves);
    setHolidays(newHolidays);
    setPeriod(newPeriod);
    setSavedPeriods(newSavedPeriods);
    setRules(newRules);
    setAppUsers(newAppUsers);
    setThemeColor(newThemeColor);

    await saveToRealtimeDb({
      teams: newTeams,
      jobs: newJobs,
      leaves: newLeaves,
      holidays: newHolidays,
      period: newPeriod,
      savedPeriods: newSavedPeriods,
      rules: newRules,
      appUsers: newAppUsers,
      themeColor: newThemeColor,
      updatedAt: Date.now()
    });

    await loadSnapshots();
    showNotification(`กู้คืนข้อมูลสำเร็จ (${newJobs.length} งาน, ${newTeams.length} ทีม)`, 'success');
  };

  // --- Automated Cloud Backup Engine (Runs on interval: hourly, daily, weekly) ---
  useEffect(() => {
    if (!autoBackupConfig.enabled) return;

    const runBackupCheck = async () => {
      if (!hasLoadedFromRemoteRef.current) return;

      const intervalMs =
        autoBackupConfig.interval === 'hourly'
          ? 60 * 60 * 1000 // 1 hour
          : autoBackupConfig.interval === 'weekly'
          ? 7 * 24 * 60 * 60 * 1000 // 7 days
          : 24 * 60 * 60 * 1000; // 1 day

      const last = autoBackupConfig.lastBackupTimestamp || 0;
      const now = Date.now();

      if (now - last >= intervalMs) {
        console.log(`[Auto Backup] Initiating automated ${autoBackupConfig.interval} backup to Cloud...`);
        const intervalLabels: Record<BackupInterval, string> = {
          hourly: 'ทุก 1 ชั่วโมง',
          daily: 'ทุก 1 วัน',
          weekly: 'ทุก 1 สัปดาห์'
        };
        const backupTypeMap: Record<BackupInterval, 'auto_hourly' | 'auto_daily' | 'auto_weekly'> = {
          hourly: 'auto_hourly',
          daily: 'auto_daily',
          weekly: 'auto_weekly'
        };

        const nowStr = new Date(now).toLocaleString('th-TH', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });

        const label = `สำรองข้อมูลอัตโนมัติ (${intervalLabels[autoBackupConfig.interval]})`;

        try {
          await createDatabaseSnapshot(
            label,
            {
              teams,
              jobs,
              leaves,
              holidays,
              period: safePeriod,
              savedPeriods,
              rules,
              appUsers,
              themeColor,
              autoBackupConfig: {
                ...autoBackupConfig,
                lastBackupTimestamp: now,
                lastBackupDateStr: nowStr
              },
              updatedAt: now
            },
            backupTypeMap[autoBackupConfig.interval]
          );

          const updatedConfig: AutoBackupConfig = {
            ...autoBackupConfig,
            lastBackupTimestamp: now,
            lastBackupDateStr: nowStr
          };

          setAutoBackupConfig(updatedConfig);
          localStorage.setItem(`${APP_KEY_PREFIX}auto_backup_config`, JSON.stringify(updatedConfig));
          saveToRealtimeDb({ autoBackupConfig: updatedConfig });
          await loadSnapshots();
          console.log(`[Auto Backup] Successfully backed up at ${nowStr}`);
        } catch (err) {
          console.error('[Auto Backup] Failed to backup to Firestore:', err);
        }
      }
    };

    const timer = setInterval(runBackupCheck, 60 * 1000);
    runBackupCheck();

    return () => clearInterval(timer);
  }, [autoBackupConfig, teams, jobs, leaves, holidays, safePeriod, savedPeriods, rules, appUsers, themeColor]);

  // Create point-in-time snapshot on Cloud
  const handleCreateCloudSnapshot = async (label: string) => {
    const payload: AppFirebaseData = {
      teams,
      jobs,
      leaves,
      holidays,
      period: safePeriod,
      savedPeriods,
      rules,
      appUsers,
      themeColor,
      updatedAt: Date.now()
    };
    await createDatabaseSnapshot(label, payload, 'manual');
    await loadSnapshots();
    showNotification('บันทึกจุดกู้คืนบน Cloud สำเร็จ', 'success');
  };

  // Restore state from a chosen snapshot ID
  const handleRestoreSnapshot = async (snapshotId: string) => {
    // Safety snapshot of current before restoring historical
    await createDatabaseSnapshot('สำรองความปลอดภัยก่อนกู้คืนย้อนหลัง', {
      teams,
      jobs,
      leaves,
      holidays,
      period: safePeriod,
      savedPeriods,
      rules,
      appUsers,
      themeColor,
      updatedAt: Date.now()
    }, 'safety');

    const restored = await restoreSnapshotById(snapshotId);
    if (restored) {
      if (restored.teams) setTeams(restored.teams);
      if (restored.jobs) setJobs(restored.jobs);
      if (restored.leaves) setLeaves(restored.leaves);
      if (restored.holidays) setHolidays(restored.holidays);
      if (restored.period) setPeriod(restored.period);
      if (restored.savedPeriods) setSavedPeriods(restored.savedPeriods);
      if (restored.rules) setRules(restored.rules);
      if (restored.appUsers) setAppUsers(restored.appUsers);
      if (restored.themeColor) setThemeColor(restored.themeColor);

      await loadSnapshots();
      showNotification('กู้คืนข้อมูลตามจุดกู้คืนเรียบร้อยแล้ว', 'success');
    }
  };

  const handleUpdateAutoBackupConfig = (config: AutoBackupConfig) => {
    setAutoBackupConfig(config);
    localStorage.setItem(`${APP_KEY_PREFIX}auto_backup_config`, JSON.stringify(config));
    saveToRealtimeDb({ autoBackupConfig: config });
    showNotification('บันทึกการตั้งค่าสำรองข้อมูลอัตโนมัติเรียบร้อย', 'success');
  };

  const handleTriggerAutoBackupNow = async () => {
    const now = Date.now();
    const nowStr = new Date(now).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const intervalLabels: Record<BackupInterval, string> = {
      hourly: 'ทุก 1 ชั่วโมง',
      daily: 'ทุก 1 วัน',
      weekly: 'ทุก 1 สัปดาห์'
    };
    const backupTypeMap: Record<BackupInterval, 'auto_hourly' | 'auto_daily' | 'auto_weekly'> = {
      hourly: 'auto_hourly',
      daily: 'auto_daily',
      weekly: 'auto_weekly'
    };

    await createDatabaseSnapshot(
      `สำรองข้อมูลตามรอบ (${intervalLabels[autoBackupConfig.interval]})`,
      {
        teams,
        jobs,
        leaves,
        holidays,
        period: safePeriod,
        savedPeriods,
        rules,
        appUsers,
        themeColor,
        autoBackupConfig: {
          ...autoBackupConfig,
          lastBackupTimestamp: now,
          lastBackupDateStr: nowStr
        },
        updatedAt: now
      },
      backupTypeMap[autoBackupConfig.interval]
    );

    const updatedConfig: AutoBackupConfig = {
      ...autoBackupConfig,
      lastBackupTimestamp: now,
      lastBackupDateStr: nowStr
    };
    setAutoBackupConfig(updatedConfig);
    localStorage.setItem(`${APP_KEY_PREFIX}auto_backup_config`, JSON.stringify(updatedConfig));
    saveToRealtimeDb({ autoBackupConfig: updatedConfig });
    await loadSnapshots();
  };

  const handleDeleteSnapshot = async (id: string) => {
    await deleteDatabaseSnapshot(id);
    await loadSnapshots();
  };

  // Reset sample data safely with emergency snapshot
  const handleResetData = () => {
    requestConfirm(
      'รีเซ็ตเป็นชุดข้อมูลเริ่มต้น',
      'ระบบจะสร้างจุดสำรองข้อมูลบน Cloud ให้ก่อนเสมอ แล้วจึงนำข้อมูลตั้งต้นเริ่มต้น (ช่าง 5 ทีม, รายการงาน 9 งาน) กลับมาใช้งาน ยืนยันหรือไม่?',
      async () => {
        // Auto snapshot current state first
        try {
          await createDatabaseSnapshot('สำรองก่อนกดรีเซ็ตข้อมูล', {
            teams,
            jobs,
            leaves,
            holidays,
            period: safePeriod,
            savedPeriods,
            rules,
            appUsers,
            themeColor,
            updatedAt: Date.now()
          });
        } catch (e) {
          console.warn('Auto snapshot error:', e);
        }

        const curStart = getCurrentAutoPeriod().start;
        const cleanTeams = INITIAL_TEAMS;
        const cleanJobs = getInitialJobs(curStart);
        const cleanLeaves = getInitialLeaves(curStart);
        const cleanHolidays = getInitialHolidays(curStart);
        const cleanRules = DEFAULT_INCENTIVE_RULES;

        setTeams(cleanTeams);
        setJobs(cleanJobs);
        setLeaves(cleanLeaves);
        setHolidays(cleanHolidays);
        setRules(cleanRules);

        await saveToRealtimeDb({
          teams: cleanTeams,
          jobs: cleanJobs,
          leaves: cleanLeaves,
          holidays: cleanHolidays,
          rules: cleanRules
        });

        await loadSnapshots();
        setConfirmModal(null);
        showNotification('✅ นำข้อมูลตั้งต้นกลับมาใช้งานเรียบร้อยแล้ว', 'success');
      }
    );
  };

  // Clear data for current calculation period (Super Admin only) with emergency snapshot
  const handleClearPeriodData = () => {
    if (currentUser?.role !== 'super_admin') {
      showNotification('เฉพาะ Super Admin เท่านั้นที่สามารถลบข้อมูลในรอบคำนวณได้', 'warning');
      return;
    }
    requestConfirm(
      'ยืนยันการลบข้อมูลในรอบคำนวณ',
      `ระบบจะสำรองข้อมูลก่อนลบให้เสมอ คุณต้องการลบรายการงานและวันลาทั้งหมดในรอบคำนวณ (${safePeriod.start} ถึง ${safePeriod.end}) ใช่หรือไม่?`,
      async () => {
        try {
          await createDatabaseSnapshot(`สำรองก่อนลบข้อมูลรอบ ${safePeriod.start} ถึง ${safePeriod.end}`, {
            teams,
            jobs,
            leaves,
            holidays,
            period: safePeriod,
            savedPeriods,
            rules,
            appUsers,
            themeColor,
            updatedAt: Date.now()
          });
        } catch (e) {
          console.warn('Auto snapshot error:', e);
        }

        const start = safePeriod.start;
        const end = safePeriod.end;
        const updatedJobs = jobs.filter(j => j.date && (j.date < start || j.date > end));
        const updatedLeaves = leaves.filter(l => l.date && (l.date < start || l.date > end));

        setJobs(updatedJobs);
        setLeaves(updatedLeaves);

        await saveToRealtimeDb({
          jobs: updatedJobs,
          leaves: updatedLeaves
        });

        await loadSnapshots();
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
        rules={activeEffectiveRules}
        onSaveRules={handleSaveRulesWithOptions}
        themeColor={themeColor}
        themeTextColor={themeTextColor}
        payPeriods={savedPeriods}
        currentPeriod={safePeriod}
        ruleVersions={ruleVersions}
        onDeleteRuleVersion={handleDeleteRuleVersion}
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
            rules={activeEffectiveRules}
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
            rules={activeEffectiveRules}
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
            onSyncTransferDates={handleSyncTransferDates}
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
            onExportBackupJSON={handleExportBackupJSON}
            onImportBackupJSON={handleImportBackupJSON}
            onCreateCloudSnapshot={handleCreateCloudSnapshot}
            snapshots={snapshots}
            onRestoreSnapshot={handleRestoreSnapshot}
            isLoadingSnapshots={isLoadingSnapshots}
            autoBackupConfig={autoBackupConfig}
            onUpdateAutoBackupConfig={handleUpdateAutoBackupConfig}
            onDeleteSnapshot={handleDeleteSnapshot}
            onTriggerAutoBackupNow={handleTriggerAutoBackupNow}
          />
        )}
      </main>
    </div>
  );
}
