import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Users, Info, X } from 'lucide-react';
import { Team, LeaveRecord, LeaveTypeId } from '../types';
import { LEAVE_TYPES } from '../data/initialData';
import { getDaysArray, formatDateTH } from '../utils/calculator';

interface CalendarLeaveProps {
  teams: Team[];
  holidays: string[];
  leaves: LeaveRecord[];
  periodStart: string;
  periodEnd: string;
  onToggleHoliday: (dateStr: string) => void;
  onSetLeave: (techId: string, dateStr: string, leaveType: LeaveTypeId | 'clear') => void;
}

export const CalendarLeave: React.FC<CalendarLeaveProps> = ({
  teams,
  holidays,
  leaves,
  periodStart,
  periodEnd,
  onToggleHoliday,
  onSetLeave
}) => {
  const [activeCell, setActiveCell] = useState<{
    techId: string;
    date: string;
    top: number;
    left: number;
  } | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveCell(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInPeriod = getDaysArray(periodStart, periodEnd);

  const handleCellClick = (e: React.MouseEvent, techId: string, dateStr: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setActiveCell({
      techId,
      date: dateStr,
      top: rect.bottom + window.scrollY,
      left: Math.min(rect.left + window.scrollX, window.innerWidth - 180)
    });
  };

  const allMembers = (teams || []).filter(Boolean).flatMap(t =>
    (t?.members || []).filter(Boolean).map(m => ({ ...m, teamName: t?.name || '' }))
  );

  // Show members who have at least one active working day in this period, or who have existing leave in this period
  const visibleMembers = allMembers.filter(m => {
    const hasActiveDay = daysInPeriod.some(dStr => {
      const isJoined = !m.joinDate || m.joinDate <= dStr;
      const isNotResigned = !m.resignDate || dStr <= m.resignDate;
      return isJoined && isNotResigned;
    });
    const hasLeave = leaves.some(l => l.techId === m.id && daysInPeriod.includes(l.date));
    return hasActiveDay || hasLeave;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
      {/* Leave Type Floating Menu */}
      {activeCell && (
        <div
          ref={menuRef}
          className="absolute bg-white shadow-2xl border border-gray-200 rounded-2xl p-2 z-[999] w-48 no-print space-y-1"
          style={{ top: activeCell.top - 180, left: activeCell.left }}
        >
          <div className="text-[10px] font-bold text-gray-400 px-2.5 py-1 uppercase border-b mb-1">
            เลือกประเภทวันลา ({formatDateTH(activeCell.date)})
          </div>
          {LEAVE_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => {
                onSetLeave(activeCell.techId, activeCell.date, type.id);
                setActiveCell(null);
              }}
              className="w-full text-left px-2.5 py-1.5 text-xs hover:bg-gray-50 rounded-xl flex items-center gap-2 transition-colors"
            >
              <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${type.color}`}>
                {type.short}
              </span>
              <span className="font-semibold text-gray-800">{type.label}</span>
            </button>
          ))}
          <div className="h-px bg-gray-100 my-1"></div>
          <button
            onClick={() => {
              onSetLeave(activeCell.techId, activeCell.date, 'clear');
              setActiveCell(null);
            }}
            className="w-full text-left px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-xl font-semibold flex items-center gap-1.5"
          >
            <X size={14} />
            <span>ยกเลิกการลา</span>
          </button>
        </div>
      )}

      {/* Company Holidays Panel */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
            <Calendar className="text-red-500" size={18} />
            <span>วันหยุดบริษัท / วันหยุดนักขัตฤกษ์</span>
          </h3>
          <span className="text-xs text-gray-400">คลิกที่วันเพื่อตั้งเป็นวันหยุด</span>
        </div>

        <div className="grid grid-cols-7 text-center text-xs font-bold text-gray-400 gap-1 mb-2 border-b pb-2">
          <div>อา</div>
          <div>จ</div>
          <div>อ</div>
          <div>พ</div>
          <div>พฤ</div>
          <div>ศ</div>
          <div>ส</div>
        </div>

        <div className="grid grid-cols-7 text-center text-xs gap-1.5">
          {(() => {
            if (daysInPeriod.length === 0) return null;
            const [y, m, d] = daysInPeriod[0].split('-').map(Number);
            const firstDate = new Date(y, m - 1, d);
            const startOffset = firstDate.getDay();

            return (
              <>
                {Array(startOffset)
                  .fill(null)
                  .map((_, i) => (
                    <div key={`blank-${i}`} className="p-2 rounded-xl bg-gray-50/30"></div>
                  ))}
                {daysInPeriod.map(dStr => {
                  const dayNum = parseInt(dStr.split('-')[2], 10);
                  const isHol = holidays.includes(dStr);

                  return (
                    <button
                      key={dStr}
                      onClick={() => onToggleHoliday(dStr)}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center h-14 transition-all ${
                        isHol
                          ? 'bg-red-50 border-red-300 text-red-600 font-extrabold shadow-2xs'
                          : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-800 font-bold'
                      }`}
                    >
                      <span className="text-base">{dayNum}</span>
                      {isHol && <span className="text-[9px] font-bold text-red-500">วันหยุด</span>}
                    </button>
                  );
                })}
              </>
            );
          })()}
        </div>

        <div className="mt-4 pt-3 border-t text-[11px] text-gray-500 flex items-center gap-2">
          <Info size={14} className="text-gray-400" />
          <span>งานที่เกิดขึ้นในวันหยุดบริษัท จะไม่ถูกหักวันทำงานในการคำนวณฐาน Incentive</span>
        </div>
      </div>

      {/* Technician Attendance & Leave Matrix */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
            <Users className="text-orange-500" size={18} />
            <span>ตารางบันทึกวันลาพนักงาน</span>
          </h3>
          <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
            {LEAVE_TYPES.map(t => (
              <span key={t.id} className={`px-1.5 py-0.5 rounded font-bold ${t.color}`}>
                {t.short}:{t.label}
              </span>
            ))}
            <span
              className="px-1.5 py-0.5 rounded font-semibold bg-slate-100 text-slate-500 border border-slate-200"
              title="ช่องวันที่ยังไม่ได้เริ่มงานหรือย้ายทีมไปแล้ว จะถูกซ่อนและล็อกไม่ให้ลงข้อมูล เพื่อป้องกันการใส่ข้อมูลซ้ำ"
            >
              / : อยู่นอกสังกัด (ซ่อนเพื่อกันใส่ซ้ำ)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="text-left sticky left-0 bg-white p-2 min-w-[130px] font-bold text-gray-600 border-b z-10">
                  ช่าง / สังกัด
                </th>
                {daysInPeriod.map(dStr => {
                  const dayNum = parseInt(dStr.split('-')[2], 10);
                  const isHol = holidays.includes(dStr);
                  return (
                    <th
                      key={dStr}
                      className={`min-w-[28px] p-1 text-center border-b font-bold ${
                        isHol ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500'
                      }`}
                    >
                      <div className="text-[10px]">{dayNum}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {(visibleMembers.length > 0 ? visibleMembers : allMembers).map((member, idx) => (
                <tr key={`${member.id}-${idx}`} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-2 px-2 sticky left-0 bg-white border-r border-gray-100 font-bold text-gray-800 z-10 shadow-[1px_0_2px_rgba(0,0,0,0.03)]">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span>{member?.name || ''}</span>
                      {member.transferredToTeamName && (
                        <span className="text-[8.5px] px-1 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium whitespace-nowrap">
                          ย้ายไป {member.transferredToTeamName}
                        </span>
                      )}
                      {member.transferredFromTeamName && (
                        <span className="text-[8.5px] px-1 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium whitespace-nowrap">
                          ย้ายมาจาก {member.transferredFromTeamName}
                        </span>
                      )}
                    </div>
                    <div className="text-[9px] text-gray-400 font-normal flex items-center gap-1 mt-0.5">
                      <span>{member.teamName}</span>
                      {member.resignDate && (
                        <span className="text-amber-600 font-medium">• สิ้นสุด {member.resignDate}</span>
                      )}
                      {member.joinDate && member.transferredFromTeamName && (
                        <span className="text-emerald-600 font-medium">• เริ่ม {member.joinDate}</span>
                      )}
                    </div>
                  </td>
                  {daysInPeriod.map(dStr => {
                    const l = leaves.find(x => x.techId === member.id && x.date === dStr);
                    const isHol = holidays.includes(dStr);
                    const leaveConfig = l ? LEAVE_TYPES.find(t => t.id === l.type) : null;

                    const isNotYetJoined = Boolean(member.joinDate && dStr < member.joinDate);
                    const isResigned = Boolean(member.resignDate && dStr > member.resignDate);
                    const isInactive = isNotYetJoined || isResigned;

                    // Tooltip text explaining reason
                    const inactiveTooltip = isNotYetJoined
                      ? (member.transferredFromTeamName
                          ? `ยังไม่เริ่มงานในสังกัด ${member.teamName} (ย้ายมาจาก ${member.transferredFromTeamName} วันที่ ${formatDateTH(member.joinDate)}) - ซ่อนไม่ให้ลงข้อมูลซ้ำ`
                          : `ยังไม่เริ่มงานในสังกัด ${member.teamName} (เริ่มงานวันที่ ${formatDateTH(member.joinDate)}) - ซ่อนไม่ให้ลงข้อมูลซ้ำ`)
                      : isResigned
                      ? (member.transferredToTeamName
                          ? `ย้ายไปสังกัด ${member.transferredToTeamName} แล้ว (ทำงานวันสุดท้ายที่นี่เมื่อ ${formatDateTH(member.resignDate)}) - สิ้นสุดสังกัดเดิมแล้ว`
                          : `สิ้นสุดการทำงานในสังกัด ${member.teamName} แล้ว (ทำงานวันสุดท้ายเมื่อ ${formatDateTH(member.resignDate)})`)
                      : '';

                    if (isInactive) {
                      return (
                        <td
                          key={dStr}
                          title={inactiveTooltip}
                          onClick={e => {
                            // If there is an accidental existing leave on an inactive date, allow clicking to clear it
                            if (l) handleCellClick(e, member.id, dStr);
                          }}
                          className={`border border-gray-100 text-center select-none ${
                            l
                              ? 'bg-amber-100/70 text-amber-800 font-bold cursor-pointer ring-1 ring-amber-300'
                              : 'bg-slate-100/80 text-slate-300 font-bold cursor-not-allowed opacity-60'
                          }`}
                        >
                          {l ? (leaveConfig?.short || l.type) : '/'}
                        </td>
                      );
                    }

                    return (
                      <td
                        key={dStr}
                        onClick={e => !isHol && handleCellClick(e, member.id, dStr)}
                        title={
                          isHol
                            ? 'วันหยุดบริษัท'
                            : leaveConfig
                            ? `${member.name} (${member.teamName}): ${leaveConfig.label} (${formatDateTH(dStr)})`
                            : `คลิกเพื่อบันทึกวันลา (${formatDateTH(dStr)})`
                        }
                        className={`border border-gray-100 text-center font-bold cursor-pointer transition-colors ${
                          isHol ? 'bg-red-50/50 cursor-not-allowed' : 'hover:bg-gray-100'
                        } ${leaveConfig ? leaveConfig.color : ''}`}
                      >
                        {leaveConfig ? leaveConfig.short : ''}
                      </td>
                    );
                  })}
                </tr>
              ))}

              {visibleMembers.length === 0 && allMembers.length === 0 && (
                <tr>
                  <td colSpan={daysInPeriod.length + 1} className="text-center py-8 text-gray-400">
                    ยังไม่มีช่างในระบบ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-500 flex items-center gap-2">
          <Info size={14} className="text-blue-500 shrink-0" />
          <span>
            <strong>ป้องกันข้อมูลซ้ำ:</strong> สำหรับช่างที่มีการย้ายทีม วันที่ยังไม่ได้เริ่มงานหรือย้ายทีมไปแล้ว จะถูกซ่อนและล็อก (เครื่องหมาย <span className="font-bold text-slate-400">/</span>) เพื่อป้องกันการลงวันลาซ้ำซ้อนข้ามสังกัด
          </span>
        </div>
      </div>
    </div>
  );
};
