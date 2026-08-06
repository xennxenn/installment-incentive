import React, { useState } from 'react';
import { 
  DollarSign, Ruler, MapPin, Users, FileText, CalendarDays, 
  BarChart3, Award, Info, Sliders, ChevronRight, ExternalLink
} from 'lucide-react';
import { CalculationResult } from '../utils/calculator';
import { IncentiveRules, PayPeriod, LeaveRecord, Team } from '../types';
import { CardDetailModal, CardDetailType } from './CardDetailModal';

interface DashboardProps {
  calcData: CalculationResult;
  themeColor: string;
  themeTextColor: string;
  rules: IncentiveRules;
  onOpenRulesModal: () => void;
  onNavigateToTab: (tab: string) => void;
  period?: PayPeriod;
  holidays?: string[];
  leaves?: LeaveRecord[];
  teams?: Team[];
}

export const Dashboard: React.FC<DashboardProps> = ({
  calcData,
  themeColor,
  themeTextColor,
  rules,
  onOpenRulesModal,
  onNavigateToTab,
  period,
  holidays = [],
  leaves = [],
  teams = []
}) => {
  const [selectedDetailType, setSelectedDetailType] = useState<CardDetailType>(null);
  const maxTeamIncentive = Math.max(...(calcData?.teamStats || []).map(t => t.totalEarned), 1);

  return (
    <div className="space-y-6">
      {/* Metric Cards Grid - Clickable for details */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        
        {/* Card 1: Incentive รวม */}
        <div
          onClick={() => setSelectedDetailType('totalIncentive')}
          style={{ backgroundColor: themeColor, color: themeTextColor }}
          className="p-4 rounded-2xl shadow-md relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl cursor-pointer group active:scale-[0.98]"
          title="คลิกเพื่อดูรายละเอียด ยอด Incentive รวม"
        >
          <div className="flex justify-between items-start">
            <h3 className="text-[11px] uppercase font-bold opacity-80 tracking-wider">Incentive รวม</h3>
            <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded-full font-medium opacity-0 group-hover:opacity-100 transition-opacity">ดูรายละเอียด</span>
          </div>
          <div className="text-xl md:text-2xl font-black mt-1">
            ฿{calcData.totalIncentive.toLocaleString()}
          </div>
          <DollarSign className="absolute -right-2 -bottom-2 opacity-15 group-hover:opacity-25 transition-opacity" size={54} />
        </div>

        {/* Card 2: จำนวนรางรวม */}
        <div
          onClick={() => setSelectedDetailType('totalRails')}
          className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-blue-300 cursor-pointer group active:scale-[0.98]"
          title="คลิกเพื่อดูรายละเอียด จำนวนรางรวม"
        >
          <div className="flex justify-between items-start">
            <h3 className="text-[11px] uppercase font-bold text-gray-500 tracking-wider">จำนวนรางรวม</h3>
            <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-medium opacity-0 group-hover:opacity-100 transition-opacity">ดูรายละเอียด</span>
          </div>
          <div className="text-xl md:text-2xl font-bold mt-1 text-gray-900">
            {calcData.totalRails.toLocaleString()}{' '}
            <span className="text-xs font-normal text-gray-400">ราง</span>
          </div>
          <Ruler className="absolute -right-2 -bottom-2 opacity-10 text-gray-500 group-hover:opacity-20 transition-opacity" size={54} />
        </div>

        {/* Card 3: งานวัดพื้นที่ */}
        <div
          onClick={() => setSelectedDetailType('measureJobs')}
          className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-purple-300 cursor-pointer group active:scale-[0.98]"
          title="คลิกเพื่อดูรายละเอียด งานวัดพื้นที่"
        >
          <div className="flex justify-between items-start">
            <h3 className="text-[11px] uppercase font-bold text-gray-500 tracking-wider">งานวัดพื้นที่</h3>
            <span className="text-[9px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full font-medium opacity-0 group-hover:opacity-100 transition-opacity">ดูรายละเอียด</span>
          </div>
          <div className="text-xl md:text-2xl font-bold mt-1 text-gray-900">
            {calcData.totalMeasureJobs}{' '}
            <span className="text-xs font-normal text-gray-400">งาน</span>
          </div>
          <MapPin className="absolute -right-2 -bottom-2 opacity-10 text-gray-500 group-hover:opacity-20 transition-opacity" size={54} />
        </div>

        {/* Card 4: จำนวนช่าง */}
        <div
          onClick={() => setSelectedDetailType('totalTechs')}
          className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-amber-300 cursor-pointer group active:scale-[0.98]"
          title="คลิกเพื่อดูรายละเอียด จำนวนช่าง"
        >
          <div className="flex justify-between items-start">
            <h3 className="text-[11px] uppercase font-bold text-gray-500 tracking-wider">จำนวนช่าง</h3>
            <span className="text-[9px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full font-medium opacity-0 group-hover:opacity-100 transition-opacity">ดูรายละเอียด</span>
          </div>
          <div className="text-xl md:text-2xl font-bold mt-1 text-gray-900">
            {calcData.totalTechs}{' '}
            <span className="text-xs font-normal text-gray-400">คน</span>
          </div>
          <Users className="absolute -right-2 -bottom-2 opacity-10 text-gray-500 group-hover:opacity-20 transition-opacity" size={54} />
        </div>

        {/* Card 5: จำนวนงานรวม */}
        <div
          onClick={() => setSelectedDetailType('periodJobs')}
          className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-indigo-300 cursor-pointer group active:scale-[0.98]"
          title="คลิกเพื่อดูรายละเอียด จำนวนงานรวม"
        >
          <div className="flex justify-between items-start">
            <h3 className="text-[11px] uppercase font-bold text-gray-500 tracking-wider">จำนวนงานรวม</h3>
            <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded-full font-medium opacity-0 group-hover:opacity-100 transition-opacity">ดูรายละเอียด</span>
          </div>
          <div className="text-xl md:text-2xl font-bold mt-1 text-gray-900">
            {calcData.periodJobs.length}{' '}
            <span className="text-xs font-normal text-gray-400">งาน</span>
          </div>
          <FileText className="absolute -right-2 -bottom-2 opacity-10 text-gray-500 group-hover:opacity-20 transition-opacity" size={54} />
        </div>

        {/* Card 6: วันทำการ */}
        <div
          onClick={() => setSelectedDetailType('workingDays')}
          className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm relative overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-rose-300 cursor-pointer group active:scale-[0.98]"
          title="คลิกเพื่อดูรายละเอียด วันทำการและวันหยุด"
        >
          <div className="flex justify-between items-start">
            <h3 className="text-[11px] uppercase font-bold text-gray-500 tracking-wider">วันทำการ</h3>
            <span className="text-[9px] bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded-full font-medium opacity-0 group-hover:opacity-100 transition-opacity">ดูรายละเอียด</span>
          </div>
          <div className="text-xl md:text-2xl font-bold mt-1 text-gray-900">
            {calcData.periodWorkingDays}{' '}
            <span className="text-xs font-normal text-gray-400">วัน</span>
          </div>
          <CalendarDays className="absolute -right-2 -bottom-2 opacity-10 text-gray-500 group-hover:opacity-20 transition-opacity" size={54} />
        </div>
      </div>

      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Performance Breakdown */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                <BarChart3 size={18} className="text-gray-700" />
                <span>ยอด Incentive แยกตามทีมช่าง</span>
              </h3>
              <button
                onClick={() => onNavigateToTab('jobs')}
                className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-0.5 font-medium"
              >
                ดูงานทั้งหมด <ChevronRight size={14} />
              </button>
            </div>

            <div className="space-y-4">
              {(calcData?.teamStats || []).filter(Boolean).map(team => {
                const percentage = Math.round((team.totalEarned / (calcData.totalIncentive || 1)) * 100);
                const barWidth = Math.max(3, Math.round((team.totalEarned / maxTeamIncentive) * 100));

                return (
                  <div key={team.id} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800">{team.name || ''}</span>
                        <span className="text-[10px] text-gray-400 font-normal">
                          ({(team.members || []).length} คน • {(team.totalRails || 0).toLocaleString()} ราง)
                        </span>
                      </div>
                      <div className="font-bold text-gray-900">
                        ฿{Math.round(team.totalEarned || 0).toLocaleString()}{' '}
                        <span className="text-gray-400 font-normal text-[10px]">({percentage}%)</span>
                      </div>
                    </div>

                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-100">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          backgroundColor: themeColor,
                          width: `${barWidth}%`
                        }}
                      />
                    </div>
                  </div>
                );
              })}

              {(!calcData?.teamStats || calcData.teamStats.length === 0) && (
                <p className="text-xs text-gray-400 text-center py-6">ไม่มีข้อมูลทีมช่าง</p>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 text-xs text-gray-500 flex justify-between items-center">
            <span>รวมทั้งหมด {calcData.teamStats.length} ทีม</span>
            <span className="font-bold text-gray-800">เฉลี่ย ฿{Math.round(calcData.totalIncentive / Math.max(1, calcData.teamStats.length)).toLocaleString()}/ทีม</span>
          </div>
        </div>

        {/* Individual Technician Leaderboard */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base text-gray-900 flex items-center gap-2">
                <Award size={18} className="text-amber-500" />
                <span>อันดับรายได้ช่างประจำรอบ</span>
              </h3>
              <button
                onClick={() => onNavigateToTab('reports')}
                className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-0.5 font-medium"
              >
                ดูสลิปสวัสดิการ <ChevronRight size={14} />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[320px] pr-1">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-500 font-semibold sticky top-0 border-b border-gray-200">
                  <tr>
                    <th className="p-2.5 text-center w-8">#</th>
                    <th className="p-2.5 text-left">ชื่อช่าง</th>
                    <th className="p-2.5 text-left">สังกัดทีม</th>
                    <th className="p-2.5 text-center">วันทำงาน</th>
                    <th className="p-2.5 text-right">Incentive สะสม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(calcData?.individualStats || []).filter(Boolean).map((tech, idx) => {
                    const isTop3 = idx < 3;
                    return (
                      <tr key={tech.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="p-2.5 text-center font-bold">
                          {idx === 0 && <span className="text-amber-500">🥇</span>}
                          {idx === 1 && <span className="text-slate-400">🥈</span>}
                          {idx === 2 && <span className="text-amber-700">🥉</span>}
                          {!isTop3 && <span className="text-gray-400">{idx + 1}</span>}
                        </td>
                        <td className="p-2.5 font-bold text-gray-800">{tech.name || ''}</td>
                        <td className="p-2.5 text-gray-500">{tech.teamName || ''}</td>
                        <td className="p-2.5 text-center font-medium text-gray-700">{tech.workDays || 0} วัน</td>
                        <td className="p-2.5 text-right font-extrabold text-emerald-600">
                          ฿{Math.round(tech.incentive || 0).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}

                  {(!calcData?.individualStats || calcData.individualStats.length === 0) && (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-gray-400">
                        ยังไม่มีข้อมูลช่างในรอบนี้
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500 flex justify-between items-center">
            <span>ช่างทั้งหมด {calcData.individualStats.length} คน</span>
            <span className="font-semibold text-gray-700">
              เฉลี่ย ฿{Math.round(calcData.totalIncentive / Math.max(1, calcData.individualStats.length)).toLocaleString()}/คน
            </span>
          </div>
        </div>
      </div>

      {/* Card Detail Modal */}
      <CardDetailModal
        type={selectedDetailType}
        onClose={() => setSelectedDetailType(null)}
        calcData={calcData}
        period={period}
        rules={rules}
        holidays={holidays}
        leaves={leaves}
        teams={teams}
        themeColor={themeColor}
        themeTextColor={themeTextColor}
      />
    </div>
  );
};
