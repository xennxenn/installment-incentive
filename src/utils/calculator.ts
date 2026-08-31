import { Job, Team, LeaveRecord, PayPeriod, IncentiveRules, JobTypeId, JobTypeConfig, RuleVersion } from '../types';
import { JOB_TYPES, LEAVE_TYPES, DEFAULT_INCENTIVE_RULES } from '../data/initialData';

export interface CalculatedReportRow {
  date: string;
  time: string;
  type: string;
  customer: string;
  location: string;
  rails: number | string;
  techs: number | string;
  note: string;
  inc: number | string;
  isHoliday?: boolean;
  isLeave?: boolean;
  orderNo?: string;
  teamName?: string;
  isChecked?: boolean;
}

export interface CalculatedTeamStat extends Team {
  totalEarned: number;
  totalRails: number;
  totalWallSqm: number;
  totalMeasures: number;
  totalJobs: number;
  members: Array<{
    id: string;
    name: string;
    joinDate: string;
    resignDate?: string;
    incentive: number;
    workDays: number;
    leaves: Array<{ date: string; type: string }>;
  }>;
}

export interface IndividualStat {
  id: string;
  name: string;
  teamName: string;
  workDays: number;
  incentive: number;
  joinDate: string;
  resignDate?: string;
  leaves: Array<{ date: string; type: string }>;
}

export interface JobTypeOverallStat {
  typeId: string;
  label: string;
  unitLabel: string;
  jobCount: number;
  totalQuantity: number;
  totalIncentive: number;
  percentage: number;
}

export interface JobTypeBreakdownItem {
  typeId: string;
  label: string;
  unitLabel: string;
  jobCount: number;
  totalQuantity: number;
  totalIncentive: number;
}

export interface JobTypeTeamStat {
  teamId: string;
  teamName: string;
  totalIncentive: number;
  breakdown: JobTypeBreakdownItem[];
}

export interface JobTypeTechStat {
  techId: string;
  techName: string;
  teamName: string;
  totalIncentive: number;
  breakdown: JobTypeBreakdownItem[];
}

export interface CalculationResult {
  periodJobs: Job[];
  totalIncentive: number;
  teamStats: CalculatedTeamStat[];
  individualStats: IndividualStat[];
  totalTechs: number;
  periodWorkingDays: number;
  totalRails: number;
  totalWallSqm: number;
  totalMeasureJobs: number;
  reportTeamLogs: Record<string, { name: string; rows: CalculatedReportRow[] }>;
  reportTechLogs: Record<string, { name: string; teamName: string; rows: CalculatedReportRow[] }>;
  allJobsDetailed: CalculatedReportRow[];
  jobTypeAnalytics: {
    overall: JobTypeOverallStat[];
    byTeam: JobTypeTeamStat[];
    byTech: JobTypeTechStat[];
  };
}

export const formatDateTH = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('th-TH', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    });
  } catch (e) {
    return dateStr;
  }
};

export const formatQuantity = (val: number, unitLabel?: string): string => {
  if (val === 0) return '0';
  const formatted = Number.isInteger(val) ? val.toString() : val.toFixed(1);
  return unitLabel ? `${formatted} ${unitLabel}` : formatted;
};

export const getDaysArray = (startStr: string, endStr: string): string[] => {
  const arr: string[] = [];
  try {
    const dt = new Date(startStr);
    const endDate = new Date(endStr);
    while (dt <= endDate) {
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const d = String(dt.getDate()).padStart(2, '0');
      arr.push(`${y}-${m}-${d}`);
      dt.setDate(dt.getDate() + 1);
    }
  } catch (e) {
    // fallback
  }
  return arr;
};

/**
 * Resolves the effective incentive rules for a given pay period.
 * Supports rule versioning so historical periods retain their original formulas
 * while newer periods use updated formulas automatically.
 */
export function getEffectiveRulesForPeriod(
  period: PayPeriod,
  currentRules: IncentiveRules,
  ruleVersions?: RuleVersion[],
  periodRulesMap?: Record<string, IncentiveRules>
): IncentiveRules {
  if (!period) return currentRules || DEFAULT_INCENTIVE_RULES;

  // 1. Direct period-specific mapping by period ID or name
  if (periodRulesMap) {
    if (period.id && periodRulesMap[period.id]) {
      return { ...DEFAULT_INCENTIVE_RULES, ...periodRulesMap[period.id] };
    }
    if (period.name && periodRulesMap[period.name]) {
      return { ...DEFAULT_INCENTIVE_RULES, ...periodRulesMap[period.name] };
    }
  }

  // 2. Rule versioning lookup
  if (ruleVersions && Array.isArray(ruleVersions) && ruleVersions.length > 0) {
    // Filter versions that apply to this period
    // Priority:
    // A) specific_period_only matching period.id
    const specific = ruleVersions.find(
      v => v.scope === 'specific_period_only' && (v.specificPeriodId === period.id || v.effectiveFromPeriodId === period.id)
    );
    if (specific && specific.rules) {
      return { ...DEFAULT_INCENTIVE_RULES, ...specific.rules };
    }

    // B) from_period_onward matching period.start >= version.effectiveFromDate
    const periodStart = period.start || '2000-01-01';
    const onwardMatches = ruleVersions
      .filter(v => v.scope === 'from_period_onward' && v.effectiveFromDate && periodStart >= v.effectiveFromDate)
      .sort((a, b) => (b.effectiveFromDate || '').localeCompare(a.effectiveFromDate || '') || (b.createdAt || '').localeCompare(a.createdAt || ''));

    if (onwardMatches.length > 0 && onwardMatches[0].rules) {
      return { ...DEFAULT_INCENTIVE_RULES, ...onwardMatches[0].rules };
    }

    // C) all_periods version (latest)
    const allMatches = ruleVersions
      .filter(v => v.scope === 'all_periods')
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    if (allMatches.length > 0 && allMatches[0].rules) {
      return { ...DEFAULT_INCENTIVE_RULES, ...allMatches[0].rules };
    }
  }

  return currentRules || DEFAULT_INCENTIVE_RULES;
}

/**
 * Calculates the exact incentive value (THB) for a single job based on the provided rules,
 * active technician members, leaves, and formula configurations.
 */
export function calculateSingleJobIncentive(
  job: Partial<Job>,
  teams: Team[],
  leaves: LeaveRecord[] = [],
  rules: IncentiveRules = DEFAULT_INCENTIVE_RULES
): number {
  if (!job) return 0;
  const safeTeams = (teams || []).filter(Boolean);
  const safeLeaves = (leaves || []).filter(Boolean);
  const safeRules = rules || DEFAULT_INCENTIVE_RULES;

  const allConfiguredTypes: JobTypeConfig[] =
    safeRules.customJobTypes && safeRules.customJobTypes.length > 0
      ? safeRules.customJobTypes
      : JOB_TYPES;

  const rawVal = parseFloat(String(job.rails ?? 0));
  const railsOrSqm = isNaN(rawVal) ? 0 : Math.max(0, Math.round(rawVal * 10) / 10);
  const jobDate = job.date || '';

  // Filter valid techs: person existed and active on that day
  const validTechs = (job.selectedTechs || []).filter(tid => {
    let memberRecord = null;
    for (const t of safeTeams) {
      const found = (t?.members || []).find(m => m && m.id === tid);
      if (found) {
        memberRecord = found;
        break;
      }
    }
    if (!memberRecord) return false;

    const isJoined = !memberRecord.joinDate || !jobDate || memberRecord.joinDate <= jobDate;
    const isResigned = memberRecord.resignDate && jobDate && jobDate >= memberRecord.resignDate;
    return isJoined && !isResigned;
  });

  // Filter techs who earn incentive (exclude 'no_inc')
  const payingTechs = validTechs.filter(tid => {
    const l = safeLeaves.find(x => x && x.techId === tid && x.date === jobDate);
    return !(l && l.type === 'no_inc');
  });

  const cnt = payingTechs.length;
  if (cnt === 0) return 0;

  const jobType = job.type || 'install';
  const currentTypeConfig = allConfiguredTypes.find(t => t.id === jobType);

  if (jobType === 'measure') {
    const measurePay = safeRules.measureTechPay !== undefined ? safeRules.measureTechPay : (currentTypeConfig?.fixedAmount ?? 250);
    return measurePay * cnt;
  }
  if (jobType === 'install_wall_linen') {
    const rate = safeRules.wallLinenSqmRate !== undefined ? safeRules.wallLinenSqmRate : (currentTypeConfig?.ratePerUnit ?? 50);
    const attendance = safeRules.wallLinenAttendancePay !== undefined ? safeRules.wallLinenAttendancePay : (currentTypeConfig?.baseAttendancePerTech ?? 0);
    return (railsOrSqm * rate) + (attendance * cnt);
  }
  if (jobType === 'install_wall_mural') {
    const rate = safeRules.wallMuralSqmRate !== undefined ? safeRules.wallMuralSqmRate : (currentTypeConfig?.ratePerUnit ?? 75);
    const attendance = safeRules.wallMuralAttendancePay !== undefined ? safeRules.wallMuralAttendancePay : (currentTypeConfig?.baseAttendancePerTech ?? 0);
    return (railsOrSqm * rate) + (attendance * cnt);
  }
  if (['travel_go', 'travel_back', 'fix_free'].includes(jobType) || currentTypeConfig?.calcFormulaType === 'free_no_pay') {
    return 0;
  }

  if (currentTypeConfig) {
    if (currentTypeConfig.calcFormulaType === 'rate_per_sqm' || currentTypeConfig.calcFormulaType === 'rate_per_unit') {
      const rate = currentTypeConfig.ratePerUnit ?? 50;
      const attendance = currentTypeConfig.baseAttendancePerTech ?? 0;
      return (railsOrSqm * rate) + (attendance * cnt);
    }
    if (currentTypeConfig.calcFormulaType === 'fixed_per_tech') {
      const fixedAmt = currentTypeConfig.fixedAmount ?? safeRules.measureTechPay ?? 250;
      return fixedAmt * cnt;
    }
    if (currentTypeConfig.calcFormulaType === 'fixed_per_job') {
      return currentTypeConfig.fixedAmount ?? 0;
    }

    // Standard curtain formula with custom job type overrides
    const basePayPerTech = safeRules.baseTechPay !== undefined ? safeRules.baseTechPay : (currentTypeConfig.baseAttendancePerTech ?? 250);
    const basePay = basePayPerTech * cnt;
    const freeRails = safeRules.freeRailsThreshold !== undefined ? safeRules.freeRailsThreshold : 10;
    const extraRate = safeRules.extraRailRate !== undefined ? safeRules.extraRailRate : 20;
    const extraRails = railsOrSqm > freeRails ? (railsOrSqm - freeRails) * extraRate : 0;

    let specialBonus = 0;
    if (jobType === 'install_high') {
      specialBonus = safeRules.highLadderBonus !== undefined ? safeRules.highLadderBonus : (currentTypeConfig.bonusAmount ?? 0);
    } else if (jobType === 'install_scaffold' || jobType === 'fix_scaffold') {
      specialBonus = safeRules.scaffoldBonus !== undefined ? safeRules.scaffoldBonus : (currentTypeConfig.bonusAmount ?? 0);
    } else {
      specialBonus = currentTypeConfig.bonusAmount ?? 0;
    }

    return basePay + extraRails + specialBonus;
  }

  // Fallback standard curtain formula
  const basePay = (safeRules.baseTechPay ?? 250) * cnt;
  const freeRails = safeRules.freeRailsThreshold ?? 10;
  const extraRate = safeRules.extraRailRate ?? 20;
  const extraRails = railsOrSqm > freeRails ? (railsOrSqm - freeRails) * extraRate : 0;
  let specialBonus = 0;
  if (jobType === 'install_high') specialBonus = safeRules.highLadderBonus ?? 0;
  if (jobType === 'install_scaffold' || jobType === 'fix_scaffold') specialBonus = safeRules.scaffoldBonus ?? 0;

  return basePay + extraRails + specialBonus;
}

export function calculateIncentives(
  jobs: Job[],
  teams: Team[],
  holidays: string[],
  leaves: LeaveRecord[],
  period: PayPeriod,
  rules: IncentiveRules,
  jobSortOrder: 'asc' | 'desc' | 'manual' = 'manual'
): CalculationResult {
  const safePeriod = period && period.start && period.end ? period : { name: 'รอบปัจจุบัน', start: '2026-01-01', end: '2026-12-31' };
  const safeTeams = (teams || []).filter(Boolean);
  const safeJobs = (jobs || []).filter(Boolean);
  const safeLeaves = (leaves || []).filter(Boolean);
  const safeHolidays = (holidays || []).filter(Boolean);
  const safeRules = rules || DEFAULT_INCENTIVE_RULES;

  const allConfiguredTypes: JobTypeConfig[] = (safeRules.customJobTypes && safeRules.customJobTypes.length > 0)
    ? safeRules.customJobTypes
    : JOB_TYPES;

  const periodJobs = safeJobs.filter(j => j && j.date && j.date >= safePeriod.start && j.date <= safePeriod.end);

  // Sorting
  periodJobs.sort((a, b) => {
    if (jobSortOrder === 'desc') {
      const dateDiff = (b.date || '').localeCompare(a.date || '');
      if (dateDiff !== 0) return dateDiff;
      const timeDiff = (b.timeSlot || '').localeCompare(a.timeSlot || '');
      if (timeDiff !== 0) return timeDiff;
      return (b.orderIndex || 0) - (a.orderIndex || 0);
    } else if (jobSortOrder === 'asc') {
      const dateDiff = (a.date || '').localeCompare(b.date || '');
      if (dateDiff !== 0) return dateDiff;
      const timeDiff = (a.timeSlot || '').localeCompare(b.timeSlot || '');
      if (timeDiff !== 0) return timeDiff;
      return (a.orderIndex || 0) - (b.orderIndex || 0);
    } else {
      // 'manual' order: strictly respect orderIndex
      return (b.orderIndex || 0) - (a.orderIndex || 0);
    }
  });

  const dailyTeamIncentive: Record<string, Record<string, { amount: number; rails: number; wallSqm: number; measures: number; jobsCount: number }>> = {};
  let globalTotalRails = 0;
  let globalTotalWallSqm = 0;
  let globalTotalMeasureJobs = 0;

  // 1. Process each job to compute calculatedValue and split into teams
  safeJobs.forEach(job => {
    // Calculate single job incentive using shared pure function
    const val = calculateSingleJobIncentive(job, safeTeams, safeLeaves, safeRules);

    // Allow 1 decimal place float (e.g. 12.5)
    const rawVal = parseFloat(String(job.rails));
    const railsOrSqm = isNaN(rawVal) ? 0 : Math.max(0, Math.round(rawVal * 10) / 10);
    const isInPeriod = job && job.date && job.date >= safePeriod.start && job.date <= safePeriod.end;

    const currentTypeConfig = allConfiguredTypes.find(t => t.id === job.type);
    const isCurtain = !currentTypeConfig?.isExcludedFromRails && (!currentTypeConfig?.unitType || currentTypeConfig.unitType === 'rails');
    const isSqm = currentTypeConfig?.unitType === 'sqm' || job.type === 'install_wall_linen' || job.type === 'install_wall_mural';
    const isMeasure = job.type === 'measure' || currentTypeConfig?.calcFormulaType === 'fixed_per_tech';

    if (isInPeriod) {
      if (isCurtain) {
        globalTotalRails += railsOrSqm;
      } else if (isSqm) {
        globalTotalWallSqm += railsOrSqm;
      }
      if (isMeasure) {
        globalTotalMeasureJobs += 1;
      }
    }

    // Filter valid techs: person existed and active on that day
    const validTechs = (job.selectedTechs || []).filter(tid => {
      let memberRecord = null;
      for (const t of safeTeams) {
        const found = (t?.members || []).find(m => m && m.id === tid);
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

    // Filter techs who earn incentive (exclude 'no_inc')
    const payingTechs = validTechs.filter(tid => {
      const l = safeLeaves.find(x => x && x.techId === tid && x.date === job.date);
      return !(l && l.type === 'no_inc');
    });

    const cnt = payingTechs.length;

    // Attach to job temporarily
    (job as Job & { calculatedValue?: number }).calculatedValue = val;

    // Distribute to teams involved
    if (isInPeriod && cnt > 0 && val > 0) {
      const teamsInvolved: Record<string, number> = {};
      payingTechs.forEach(tid => {
        const t = safeTeams.find(x => (x?.members || []).some(m => m && m.id === tid));
        if (t) {
          teamsInvolved[t.id] = (teamsInvolved[t.id] || 0) + 1;
        }
      });

      const date = job.date;
      if (!dailyTeamIncentive[date]) dailyTeamIncentive[date] = {};

      const totalTechsInJob = cnt;
      const totalTeamsCount = Object.keys(teamsInvolved).length;

      Object.keys(teamsInvolved).forEach(teamId => {
        const teamTechCount = teamsInvolved[teamId];
        const teamShare = (val * teamTechCount) / totalTechsInJob;

        if (!dailyTeamIncentive[date][teamId]) {
          dailyTeamIncentive[date][teamId] = { amount: 0, rails: 0, wallSqm: 0, measures: 0, jobsCount: 0 };
        }
        dailyTeamIncentive[date][teamId].amount += teamShare;
        dailyTeamIncentive[date][teamId].jobsCount += 1 / totalTeamsCount;

        if (isCurtain) {
          dailyTeamIncentive[date][teamId].rails += railsOrSqm / totalTeamsCount;
        } else if (isSqm) {
          dailyTeamIncentive[date][teamId].wallSqm += railsOrSqm / totalTeamsCount;
        }
        if (isMeasure) {
          dailyTeamIncentive[date][teamId].measures += 1;
        }
      });
    }
  });

  const daysInPeriod = getDaysArray(safePeriod.start, safePeriod.end);
  const periodWorkingDays = daysInPeriod.filter(d => !safeHolidays.includes(d)).length;

  const reportTeamLogs: Record<string, { name: string; rows: CalculatedReportRow[] }> = {};
  const reportTechLogs: Record<string, { name: string; teamName: string; rows: CalculatedReportRow[] }> = {};
  const allJobsDetailed: CalculatedReportRow[] = [];

  safeTeams.forEach(t => {
    if (!t) return;
    reportTeamLogs[t.id] = { name: t.name || '', rows: [] };
    (t.members || []).forEach(m => {
      if (!m) return;
      reportTechLogs[m.id] = { name: m.name || '', teamName: t.name || '', rows: [] };
    });
  });

  // Track job-type level statistics
  const jobTypeCountMap: Record<string, { count: number; quantity: number; incentive: number }> = {};
  const jobTypeTeamMap: Record<string, Record<string, { count: number; quantity: number; incentive: number }>> = {};
  const jobTypeTechMap: Record<string, Record<string, { count: number; quantity: number; incentive: number }>> = {};

  allConfiguredTypes.forEach(t => {
    jobTypeCountMap[t.id] = { count: 0, quantity: 0, incentive: 0 };
  });

  const teamStats: CalculatedTeamStat[] = safeTeams.map(team => {
    const membersList = (team.members || []).filter(Boolean);
    const memberEarnings: Record<string, number> = {};
    const memberLeavesList: Record<string, Array<{ date: string; type: string }>> = {};

    membersList.forEach(m => {
      memberEarnings[m.id] = 0;
      memberLeavesList[m.id] = [];
    });

    let teamTotalEarned = 0;
    let teamTotalRails = 0;
    let teamTotalWallSqm = 0;
    let teamTotalMeasures = 0;
    let teamTotalJobs = 0;

    daysInPeriod.forEach(day => {
      const dayStats = dailyTeamIncentive[day]?.[team.id];
      const isHol = safeHolidays.includes(day);

      if (isHol) {
        reportTeamLogs[team.id]?.rows.push({
          isHoliday: true,
          date: day,
          time: '-',
          type: '-',
          customer: 'วันหยุดบริษัท',
          location: '-',
          rails: '-',
          techs: '-',
          note: '-',
          inc: '-'
        });
        membersList.forEach(m => {
          reportTechLogs[m.id]?.rows.push({
            isHoliday: true,
            date: day,
            time: '-',
            type: '-',
            customer: 'วันหยุดบริษัท',
            location: '-',
            rails: '-',
            techs: '-',
            note: '-',
            inc: '-'
          });
        });
      } else {
        membersList.forEach(m => {
          const leave = safeLeaves.find(l => l && l.techId === m.id && l.date === day);
          if (leave) {
            if (!memberLeavesList[m.id]) memberLeavesList[m.id] = [];
            memberLeavesList[m.id].push({ date: day, type: leave.type });
            const lName = LEAVE_TYPES.find(x => x.id === leave.type)?.label || 'ลา';

            if (leave.type === 'no_inc') {
              reportTechLogs[m.id]?.rows.push({
                isLeave: true,
                date: day,
                time: '-',
                type: '-',
                customer: `สถานะ: ${lName}`,
                location: '-',
                rails: '-',
                techs: '-',
                note: '-',
                inc: '-'
              });
            } else {
              reportTechLogs[m.id]?.rows.push({
                isLeave: true,
                date: day,
                time: '-',
                type: '-',
                customer: `ลา (${lName})`,
                location: '-',
                rails: '-',
                techs: '-',
                note: '-',
                inc: '-'
              });
            }
          }
        });
      }

      const dayJobs = periodJobs
        .filter(j => j && j.date === day)
        .sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''));

      dayJobs.forEach(job => {
        const involvedTeams: Record<string, string[]> = {};

        const validTechsInJob = (job.selectedTechs || []).filter(tid => {
          let memberRecord = null;
          for (const t of safeTeams) {
            const found = (t?.members || []).find(m => m && m.id === tid);
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

        const totalTechsInJob = validTechsInJob.length;

        validTechsInJob.forEach(tid => {
          const tMatch = safeTeams.find(x => (x?.members || []).some(m => m && m.id === tid));
          if (tMatch) {
            if (!involvedTeams[tMatch.id]) involvedTeams[tMatch.id] = [];
            involvedTeams[tMatch.id].push(tid);
          }
        });

        const totalTeams = Object.keys(involvedTeams).length;
        const isShared = totalTeams > 1;

        const currentType = allConfiguredTypes.find(t => t.id === job.type);
        const isExcluded = currentType?.isExcludedFromRails || ['measure', 'travel_go', 'travel_back', 'fix_free', 'install_wall_linen', 'install_wall_mural'].includes(job.type);
        const isSqmJob = currentType?.unitType === 'sqm' || job.type === 'install_wall_linen' || job.type === 'install_wall_mural';
        const rawRails = parseFloat(String(job.rails));
        const jobRailsOrSqm = isNaN(rawRails) ? 0 : Math.round(rawRails * 10) / 10;

        if (involvedTeams[team.id]) {
          const teamTechs = involvedTeams[team.id];
          const teamTechCount = teamTechs.length;
          const jobVal = (job as Job & { calculatedValue?: number }).calculatedValue || 0;

          const teamShareAmt = totalTechsInJob > 0 ? (jobVal * teamTechCount) / totalTechsInJob : 0;
          const teamRailsShare = isExcluded ? 0 : jobRailsOrSqm / totalTeams;
          const typeLabel = currentType?.label || job.type;
          const noteStr = isShared ? 'งานควบ' : '';

          let formattedQuantity: string | number = '-';
          if (isSqmJob) {
            formattedQuantity = `${jobRailsOrSqm} ตร.ม.`;
          } else if (!isExcluded) {
            formattedQuantity = Number.isInteger(teamRailsShare) ? teamRailsShare : Number(teamRailsShare.toFixed(1));
          }

          reportTeamLogs[team.id]?.rows.push({
            date: job.date,
            time: job.timeSlot || '-',
            type: typeLabel,
            customer: job.customer || '-',
            location: job.location || '-',
            rails: formattedQuantity,
            techs: teamTechCount,
            note: noteStr,
            inc: teamShareAmt,
            orderNo: job.orderNo,
            isChecked: job.isChecked
          });

          // Compute individual head share
          const activeMembers = membersList.filter(m => (!m.joinDate || m.joinDate <= day) && (!m.resignDate || m.resignDate > day));

          const eligibleMembers = activeMembers.filter(m => {
            const leave = safeLeaves.find(l => l && l.techId === m.id && l.date === day);
            return !leave || leave.type === 'vacation';
          });

          const sharePerHead = eligibleMembers.length > 0 ? teamShareAmt / eligibleMembers.length : 0;
          const railsPerHead = eligibleMembers.length > 0 ? teamRailsShare / eligibleMembers.length : 0;

          activeMembers.forEach(m => {
            const isEligible = eligibleMembers.some(em => em.id === m.id);
            const isNoInc = safeLeaves.find(l => l && l.techId === m.id && l.date === job.date)?.type === 'no_inc';

            let noteDisplay = noteStr;
            if (isNoInc) noteDisplay = noteStr ? `${noteStr} (No Incentive)` : 'No Incentive';

            let memberQty: string | number = '-';
            if (isSqmJob) {
              memberQty = `${jobRailsOrSqm} ตร.ม.`;
            } else if (!isExcluded) {
              memberQty = isEligible ? (Number.isInteger(railsPerHead) ? railsPerHead : Number(railsPerHead.toFixed(1))) : 0;
            }

            reportTechLogs[m.id]?.rows.push({
              date: job.date,
              time: job.timeSlot || '-',
              type: typeLabel,
              customer: job.customer || '-',
              location: job.location || '-',
              rails: memberQty,
              techs: teamTechCount,
              note: noteDisplay,
              inc: isEligible ? sharePerHead : 0,
              orderNo: job.orderNo,
              isChecked: job.isChecked
            });

            // Update Job Type Tech Stats
            if (isEligible && sharePerHead > 0) {
              if (!jobTypeTechMap[m.id]) jobTypeTechMap[m.id] = {};
              if (!jobTypeTechMap[m.id][job.type]) {
                jobTypeTechMap[m.id][job.type] = { count: 0, quantity: 0, incentive: 0 };
              }
              jobTypeTechMap[m.id][job.type].count += 1;
              jobTypeTechMap[m.id][job.type].quantity += typeof memberQty === 'number' ? memberQty : (isSqmJob ? jobRailsOrSqm : 0);
              jobTypeTechMap[m.id][job.type].incentive += sharePerHead;
            }
          });

          // Update Job Type Team Stats
          if (!jobTypeTeamMap[team.id]) jobTypeTeamMap[team.id] = {};
          if (!jobTypeTeamMap[team.id][job.type]) {
            jobTypeTeamMap[team.id][job.type] = { count: 0, quantity: 0, incentive: 0 };
          }
          jobTypeTeamMap[team.id][job.type].count += 1;
          jobTypeTeamMap[team.id][job.type].quantity += jobRailsOrSqm;
          jobTypeTeamMap[team.id][job.type].incentive += teamShareAmt;
        }
      });

      if (dayStats) {
        teamTotalRails += dayStats.rails;
        teamTotalWallSqm += dayStats.wallSqm;
        teamTotalMeasures += dayStats.measures;
        teamTotalJobs += dayStats.jobsCount;

        const dailyPot = dayStats.amount || 0;
        if (dailyPot > 0) {
          teamTotalEarned += dailyPot;
          const activeMembers = membersList.filter(m => (!m.joinDate || m.joinDate <= day) && (!m.resignDate || m.resignDate > day));
          const eligibleMembers = activeMembers.filter(m => {
            const leave = safeLeaves.find(l => l && l.techId === m.id && l.date === day);
            return !leave || leave.type === 'vacation';
          });
          const sharePerHead = eligibleMembers.length > 0 ? dailyPot / eligibleMembers.length : 0;
          activeMembers.forEach(m => {
            if (eligibleMembers.some(em => em.id === m.id)) {
              memberEarnings[m.id] = (memberEarnings[m.id] || 0) + sharePerHead;
            }
          });
        }
      }
    });

    return {
      ...team,
      totalEarned: teamTotalEarned,
      totalRails: Math.round(teamTotalRails * 10) / 10,
      totalWallSqm: Math.round(teamTotalWallSqm * 10) / 10,
      totalMeasures: teamTotalMeasures,
      totalJobs: Math.round(teamTotalJobs),
      members: membersList.map(m => ({
        ...m,
        incentive: memberEarnings[m.id] || 0,
        workDays: daysInPeriod.filter(d =>
          !safeHolidays.includes(d) &&
          (!m.joinDate || m.joinDate <= d) &&
          (!m.resignDate || m.resignDate > d) &&
          !safeLeaves.find(l => l && l.techId === m.id && l.date === d && l.type !== 'no_inc')
        ).length,
        leaves: memberLeavesList[m.id] || []
      }))
    };
  });

  // Build All Jobs Detailed Master List
  periodJobs.forEach(job => {
    const currentType = allConfiguredTypes.find(t => t.id === job.type);
    const typeLabel = currentType?.label || job.type;
    const isSqmJob = currentType?.unitType === 'sqm' || job.type === 'install_wall_linen' || job.type === 'install_wall_mural';
    const rawRails = parseFloat(String(job.rails));
    const qty = isNaN(rawRails) ? 0 : Math.round(rawRails * 10) / 10;
    const isExcluded = currentType?.isExcludedFromRails || ['measure', 'travel_go', 'travel_back', 'fix_free'].includes(job.type);

    let displayQty: string | number = '-';
    if (isSqmJob) {
      displayQty = `${qty} ตร.ม.`;
    } else if (!isExcluded) {
      displayQty = Number.isInteger(qty) ? qty : qty.toFixed(1);
    }

    // Collect team names
    const teamNamesSet = new Set<string>();
    (job.selectedTechs || []).forEach(tid => {
      const tm = safeTeams.find(t => (t.members || []).some(m => m.id === tid));
      if (tm?.name) teamNamesSet.add(tm.name);
    });

    const jobIncentive = (job as Job & { calculatedValue?: number }).calculatedValue || 0;

    allJobsDetailed.push({
      date: job.date,
      time: job.timeSlot || '-',
      type: typeLabel,
      customer: job.customer || '-',
      location: job.location || '-',
      rails: displayQty,
      techs: (job.selectedTechs || []).length,
      note: Array.from(teamNamesSet).join(', ') || '-',
      inc: jobIncentive,
      orderNo: job.orderNo || '-',
      teamName: Array.from(teamNamesSet).join(', ') || 'ไม่มีทีม',
      isChecked: job.isChecked
    });

    // Update Overall Job Type Stats
    if (!jobTypeCountMap[job.type]) {
      jobTypeCountMap[job.type] = { count: 0, quantity: 0, incentive: 0 };
    }
    jobTypeCountMap[job.type].count += 1;
    jobTypeCountMap[job.type].quantity += qty;
    jobTypeCountMap[job.type].incentive += jobIncentive;
  });

  const exactTotalIncentive = teamStats.reduce((sum, t) => sum + t.totalEarned, 0);

  const individualStats: IndividualStat[] = (teamStats || [])
    .filter(Boolean)
    .flatMap(t => (t?.members || []).filter(Boolean).map(m => ({ ...m, teamName: t?.name || '' })))
    .sort((a, b) => (b?.incentive || 0) - (a?.incentive || 0));

  const totalTechs = teamStats.reduce((acc, t) => acc + (t.members || []).length, 0);

  // Overall Job Type Analytics
  const overallJobTypeStats: JobTypeOverallStat[] = Object.keys(jobTypeCountMap)
    .map(typeId => {
      const config = allConfiguredTypes.find(t => t.id === typeId);
      const data = jobTypeCountMap[typeId];
      const percent = exactTotalIncentive > 0 ? (data.incentive / exactTotalIncentive) * 100 : 0;
      return {
        typeId,
        label: config?.label || typeId,
        unitLabel: config?.unitLabel || (config?.unitType === 'sqm' ? 'ตร.ม.' : config?.unitType === 'rails' ? 'ราง' : '-'),
        jobCount: data.count,
        totalQuantity: Math.round(data.quantity * 10) / 10,
        totalIncentive: data.incentive,
        percentage: Math.round(percent * 10) / 10
      };
    })
    .filter(stat => stat.jobCount > 0 || stat.totalIncentive > 0)
    .sort((a, b) => b.totalIncentive - a.totalIncentive);

  // Job Type by Team
  const jobTypeByTeamStats: JobTypeTeamStat[] = safeTeams
    .map(t => {
      const teamBreakdownMap = jobTypeTeamMap[t.id] || {};
      const breakdown: JobTypeBreakdownItem[] = Object.keys(teamBreakdownMap)
        .map(typeId => {
          const config = allConfiguredTypes.find(ct => ct.id === typeId);
          const data = teamBreakdownMap[typeId];
          return {
            typeId,
            label: config?.label || typeId,
            unitLabel: config?.unitLabel || (config?.unitType === 'sqm' ? 'ตร.ม.' : config?.unitType === 'rails' ? 'ราง' : '-'),
            jobCount: data.count,
            totalQuantity: Math.round(data.quantity * 10) / 10,
            totalIncentive: data.incentive
          };
        })
        .filter(b => b.jobCount > 0 || b.totalIncentive > 0)
        .sort((a, b) => b.totalIncentive - a.totalIncentive);

      const teamTotal = breakdown.reduce((sum, b) => sum + b.totalIncentive, 0);
      return {
        teamId: t.id,
        teamName: t.name,
        totalIncentive: teamTotal,
        breakdown
      };
    })
    .filter(t => t.breakdown.length > 0);

  // Job Type by Tech
  const jobTypeByTechStats: JobTypeTechStat[] = individualStats
    .map(m => {
      const techBreakdownMap = jobTypeTechMap[m.id] || {};
      const breakdown: JobTypeBreakdownItem[] = Object.keys(techBreakdownMap)
        .map(typeId => {
          const config = allConfiguredTypes.find(ct => ct.id === typeId);
          const data = techBreakdownMap[typeId];
          return {
            typeId,
            label: config?.label || typeId,
            unitLabel: config?.unitLabel || (config?.unitType === 'sqm' ? 'ตร.ม.' : config?.unitType === 'rails' ? 'ราง' : '-'),
            jobCount: data.count,
            totalQuantity: Math.round(data.quantity * 10) / 10,
            totalIncentive: data.incentive
          };
        })
        .filter(b => b.jobCount > 0 || b.totalIncentive > 0)
        .sort((a, b) => b.totalIncentive - a.totalIncentive);

      const techTotal = breakdown.reduce((sum, b) => sum + b.totalIncentive, 0);
      return {
        techId: m.id,
        techName: m.name,
        teamName: m.teamName,
        totalIncentive: techTotal,
        breakdown
      };
    })
    .filter(tech => tech.breakdown.length > 0);

  return {
    periodJobs,
    totalIncentive: Math.round(exactTotalIncentive),
    teamStats,
    individualStats,
    totalTechs,
    periodWorkingDays,
    totalRails: Math.round(globalTotalRails * 10) / 10,
    totalWallSqm: Math.round(globalTotalWallSqm * 10) / 10,
    totalMeasureJobs: globalTotalMeasureJobs,
    reportTeamLogs,
    reportTechLogs,
    allJobsDetailed,
    jobTypeAnalytics: {
      overall: overallJobTypeStats,
      byTeam: jobTypeByTeamStats,
      byTech: jobTypeByTechStats
    }
  };
}

