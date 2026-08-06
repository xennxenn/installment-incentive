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
          <div className="flex items-center gap-2 text-[10px]">
            {LEAVE_TYPES.map(t => (
              <span key={t.id} className={`px-1.5 py-0.5 rounded font-bold ${t.color}`}>
                {t.short}:{t.label}
              </span>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="text-left sticky left-0 bg-white p-2 min-w-[110px] font-bold text-gray-600 border-b z-10">
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
              {allMembers.map((member, idx) => (
                <tr key={`${member.id}-${idx}`} className="hover:bg-gray-50/80 transition-colors">
                  <td className="py-2 px-2 sticky left-0 bg-white border-r border-gray-100 font-bold text-gray-800 z-10">
                    <div>{member?.name || ''}</div>
                    <div className="text-[9px] text-gray-400 font-normal">{member.teamName}</div>
                  </td>
                  {daysInPeriod.map(dStr => {
                    const l = leaves.find(x => x.techId === member.id && x.date === dStr);
                    const isHol = holidays.includes(dStr);
                    const leaveConfig = l ? LEAVE_TYPES.find(t => t.id === l.type) : null;

                    return (
                      <td
                        key={dStr}
                        onClick={e => !isHol && handleCellClick(e, member.id, dStr)}
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

              {allMembers.length === 0 && (
                <tr>
                  <td colSpan={daysInPeriod.length + 1} className="text-center py-8 text-gray-400">
                    ยังไม่มีช่างในระบบ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
