import { Job, Team, LeaveRecord, PayPeriod, IncentiveRules, JobTypeId } from '../types';
import { JOB_TYPES, LEAVE_TYPES } from '../data/initialData';

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
}

export interface CalculatedTeamStat extends Team {
  totalEarned: number;
  totalRails: number;
  totalMeasures: number;
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

export interface CalculationResult {
  periodJobs: Job[];
  totalIncentive: number;
  teamStats: CalculatedTeamStat[];
  individualStats: IndividualStat[];
  totalTechs: number;
  periodWorkingDays: number;
  totalRails: number;
  totalMeasureJobs: number;
  reportTeamLogs: Record<string, { name: string; rows: CalculatedReportRow[] }>;
  reportTechLogs: Record<string, { name: string; teamName: string; rows: CalculatedReportRow[] }>;
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
  const safeRules = rules || { baseTechPay: 250, freeRailsThreshold: 10, extraRailRate: 20, measureTechPay: 250, highLadderBonus: 100, scaffoldBonus: 200, wallLinenSqmRate: 50, wallMuralSqmRate: 75 };

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

  const dailyTeamIncentive: Record<string, Record<string, { amount: number; rails: number; measures: number }>> = {};
  let globalTotalRails = 0;
  let globalTotalMeasureJobs = 0;

  // 1. Process each job to compute calculatedValue and split into teams
  safeJobs.forEach(job => {
    let val = 0;
    const rails = Math.max(0, parseInt(String(job.rails)) || 0);
    const isInPeriod = job && job.date && job.date >= safePeriod.start && job.date <= safePeriod.end;
    const excludedTypes: JobTypeId[] = ['measure', 'travel_go', 'travel_back', 'fix_free', 'install_wall_linen', 'install_wall_mural'];

    if (isInPeriod) {
      if (!excludedTypes.includes(job.type)) {
        globalTotalRails += rails;
      }
      if (job.type === 'measure') {
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

    if (cnt === 0) {
      val = 0;
    } else {
      if (job.type === 'measure') {
        val = safeRules.measureTechPay * cnt;
      } else if (job.type === 'install_wall_linen') {
        const rate = safeRules.wallLinenSqmRate ?? 50;
        val = rails * rate;
      } else if (job.type === 'install_wall_mural') {
        const rate = safeRules.wallMuralSqmRate ?? 75;
        val = rails * rate;
      } else if (['travel_go', 'travel_back', 'fix_free'].includes(job.type)) {
        val = 0;
      } else {
        const basePay = safeRules.baseTechPay * cnt;
        const extraRails = rails > safeRules.freeRailsThreshold ? (rails - safeRules.freeRailsThreshold) * safeRules.extraRailRate : 0;
        let specialBonus = 0;
        if (job.type === 'install_high') specialBonus = safeRules.highLadderBonus;
        if (job.type === 'install_scaffold' || job.type === 'fix_scaffold') specialBonus = safeRules.scaffoldBonus;

        val = basePay + extraRails + specialBonus;
      }
    }

    // Attach to job temporarily
    (job as Job & { calculatedValue?: number }).calculatedValue = val;

    // Distribute to teams involved
    if (isInPeriod && cnt > 0) {
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
          dailyTeamIncentive[date][teamId] = { amount: 0, rails: 0, measures: 0 };
        }
        dailyTeamIncentive[date][teamId].amount += teamShare;

        if (!excludedTypes.includes(job.type)) {
          dailyTeamIncentive[date][teamId].rails += rails / totalTeamsCount;
        }
        if (job.type === 'measure') {
          dailyTeamIncentive[date][teamId].measures += 1;
        }
      });
    }
  });

  const daysInPeriod = getDaysArray(safePeriod.start, safePeriod.end);
  const periodWorkingDays = daysInPeriod.filter(d => !safeHolidays.includes(d)).length;

  const reportTeamLogs: Record<string, { name: string; rows: CalculatedReportRow[] }> = {};
  const reportTechLogs: Record<string, { name: string; teamName: string; rows: CalculatedReportRow[] }> = {};

  safeTeams.forEach(t => {
    if (!t) return;
    reportTeamLogs[t.id] = { name: t.name || '', rows: [] };
    (t.members || []).forEach(m => {
      if (!m) return;
      reportTechLogs[m.id] = { name: m.name || '', teamName: t.name || '', rows: [] };
    });
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
    let teamTotalMeasures = 0;

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
        const excludedTypes: JobTypeId[] = ['measure', 'travel_go', 'travel_back', 'fix_free', 'install_wall_linen', 'install_wall_mural'];
        const isExcluded = excludedTypes.includes(job.type);
        const isSqmJob = job.type === 'install_wall_linen' || job.type === 'install_wall_mural';

        if (involvedTeams[team.id]) {
          const teamTechs = involvedTeams[team.id];
          const teamTechCount = teamTechs.length;
          const jobVal = (job as Job & { calculatedValue?: number }).calculatedValue || 0;
          const jobRails = parseInt(String(job.rails)) || 0;

          const teamShareAmt = totalTechsInJob > 0 ? (jobVal * teamTechCount) / totalTechsInJob : 0;
          const teamRailsShare = isExcluded ? 0 : jobRails / totalTeams;
          const typeLabel = JOB_TYPES.find(t => t.id === job.type)?.label || job.type;
          const noteStr = isShared ? 'งานควบ' : '';

          reportTeamLogs[team.id]?.rows.push({
            date: job.date,
            time: job.timeSlot || '-',
            type: typeLabel,
            customer: job.customer || '-',
            location: job.location || '-',
            rails: isSqmJob ? `${jobRails} ตร.ม.` : (isExcluded ? '-' : Number(teamRailsShare.toFixed(2))),
            techs: teamTechCount,
            note: noteStr,
            inc: teamShareAmt
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

            reportTechLogs[m.id]?.rows.push({
              date: job.date,
              time: job.timeSlot || '-',
              type: typeLabel,
              customer: job.customer || '-',
              location: job.location || '-',
              rails: isSqmJob ? `${jobRails} ตร.ม.` : (isExcluded ? '-' : (isEligible ? Number(railsPerHead.toFixed(2)) : 0)),
              techs: teamTechCount,
              note: noteDisplay,
              inc: isEligible ? sharePerHead : 0
            });
          });
        }
      });

      if (dayStats) {
        teamTotalRails += dayStats.rails;
        teamTotalMeasures += dayStats.measures;
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
      totalRails: teamTotalRails,
      totalMeasures: teamTotalMeasures,
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

  const exactTotalIncentive = teamStats.reduce((sum, t) => sum + t.totalEarned, 0);

  const individualStats: IndividualStat[] = (teamStats || [])
    .filter(Boolean)
    .flatMap(t => (t?.members || []).filter(Boolean).map(m => ({ ...m, teamName: t?.name || '' })))
    .sort((a, b) => (b?.incentive || 0) - (a?.incentive || 0));

  const totalTechs = teamStats.reduce((acc, t) => acc + (t.members || []).length, 0);

  return {
    periodJobs,
    totalIncentive: Math.round(exactTotalIncentive),
    teamStats,
    individualStats,
    totalTechs,
    periodWorkingDays,
    totalRails: globalTotalRails,
    totalMeasureJobs: globalTotalMeasureJobs,
    reportTeamLogs,
    reportTechLogs
  };
}
