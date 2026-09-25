import React, { useState } from 'react';
import { Printer, Users, User, Layers, LayoutDashboard, FileSpreadsheet, ClipboardList, CheckSquare, AlertCircle } from 'lucide-react';
import { Team, PayPeriod } from '../types';
import { CalculationResult, formatDateTH, getTechOfficialName, isMemberActiveInPeriod } from '../utils/calculator';
import { LOGO_URL } from '../data/initialData';

interface ReportsProps {
  teams: Team[];
  calcData: CalculationResult;
  period: PayPeriod;
  themeColor: string;
  themeTextColor: string;
}

export const Reports: React.FC<ReportsProps> = ({
  teams,
  calcData,
  period,
  themeColor,
  themeTextColor
}) => {
  const [reportType, setReportType] = useState<'overview' | 'team' | 'tech' | 'job_types' | 'jobs_list'>('overview');
  const [jobTypeViewSubtab, setJobTypeViewSubtab] = useState<'overall' | 'by_team' | 'by_tech'>('overall');
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.id || '');
  const [selectedTechId, setSelectedTechId] = useState<string>('');

  // Selective printing controls for Overview Report (รายงานภาพรวมทั้งหมด)
  const [overviewSections, setOverviewSections] = useState({
    kpis: true,       // สรุปภาพรวม KPI
    section1: true,   // สรุปผลงานและยอด Incentive แยกตามทีมช่าง
    section2: true,   // สรุปสัดส่วนผลงานแยกตามประเภทงาน
    section3: true,   // สรุปผลตอบแทนสวัสดิการช่างรายบุคคล
    signatures: true, // ช่องทางลงนามและอนุมัติ
  });

  // Filter technicians who are active in this specific pay period
  const allTechs = (teams || []).filter(Boolean).flatMap(t =>
    (t?.members || [])
      .filter(m => m && isMemberActiveInPeriod(m, period?.start, period?.end))
      .map(m => ({ 
        id: m.id, 
        name: m.name || '', 
        employeeId: m.employeeId || '',
        fullName: m.fullName || '',
        officialName: getTechOfficialName(m),
        teamName: t?.name || '' 
      }))
  );

  const issueDateStr = new Date().toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const overallStats = calcData?.jobTypeAnalytics?.overall || [];
  const teamJobTypeStats = calcData?.jobTypeAnalytics?.byTeam || [];
  const techJobTypeStats = calcData?.jobTypeAnalytics?.byTech || [];

  const getTechNamesForJob = (jobTechs?: string[]) => {
    if (!jobTechs || jobTechs.length === 0) return '-';
    const names = (teams || [])
      .filter(Boolean)
      .flatMap(t => (t?.members || []).filter(Boolean))
      .filter(m => m && jobTechs.includes(m.id))
      .map(m => getTechOfficialName(m))
      .filter(Boolean);
    return names.length > 0 ? names.join(', ') : '-';
  };

  return (
    <div className="bg-transparent print:bg-transparent print-clean-container">
      {/* Controls Bar (hidden during printing) */}
      <div className="p-4 border-b border-gray-200 bg-gray-50/95 backdrop-blur-xs flex flex-wrap justify-between items-center gap-3 no-print sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-1.5 border-b border-gray-200 pb-1">
          <button
            onClick={() => setReportType('overview')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              reportType === 'overview' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <LayoutDashboard size={14} />
            <span>รายงานภาพรวมทั้งหมด</span>
          </button>
          <button
            onClick={() => setReportType('team')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              reportType === 'team' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Users size={14} />
            <span>รายงานแยกตามทีม</span>
          </button>
          <button
            onClick={() => setReportType('tech')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              reportType === 'tech' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <User size={14} />
            <span>รายงานแยกรายคน (สลิปสวัสดิการ)</span>
          </button>
          <button
            onClick={() => setReportType('job_types')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              reportType === 'job_types' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Layers size={14} />
            <span>รายงานแยกตามประเภทงาน</span>
          </button>
          <button
            onClick={() => setReportType('jobs_list')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              reportType === 'jobs_list' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <FileSpreadsheet size={14} />
            <span>รายงานรายการงานทั้งหมด (ตามรอบวันที่)</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {reportType === 'team' && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-700">เลือกทีม:</label>
              <select
                className="border border-gray-200 rounded-xl p-1.5 text-xs font-semibold bg-white"
                value={selectedTeamId}
                onChange={e => setSelectedTeamId(e.target.value)}
              >
                <option value="">-- กรุณาเลือกทีม --</option>
                {(teams || []).filter(Boolean).map(t => (
                  <option key={t.id} value={t.id}>
                    {t?.name || ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {reportType === 'tech' && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-700">เลือกพนักงาน:</label>
              <select
                className="border border-gray-200 rounded-xl p-1.5 text-xs font-semibold bg-white"
                value={selectedTechId}
                onChange={e => setSelectedTechId(e.target.value)}
              >
                <option value="">-- กรุณาเลือกพนักงาน --</option>
                {(allTechs || []).filter(Boolean).map(tech => (
                  <option key={tech.id} value={tech.id}>
                    {tech.employeeId ? `[${tech.employeeId}] ` : ''}{tech.officialName} ({tech.teamName})
                  </option>
                ))}
              </select>
            </div>
          )}

          {reportType === 'job_types' && (
            <div className="flex items-center gap-1 bg-gray-200/70 p-1 rounded-xl">
              <button
                onClick={() => setJobTypeViewSubtab('overall')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  jobTypeViewSubtab === 'overall' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ภาพรวมทั้งหมด
              </button>
              <button
                onClick={() => setJobTypeViewSubtab('by_team')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  jobTypeViewSubtab === 'by_team' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                แยกตามทีม
              </button>
              <button
                onClick={() => setJobTypeViewSubtab('by_tech')}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  jobTypeViewSubtab === 'by_tech' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                แยกตามรายคน
              </button>
            </div>
          )}

          <button
            onClick={() => window.print()}
            style={{ backgroundColor: themeColor, color: themeTextColor }}
            className="px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-opacity"
          >
            <Printer size={14} />
            <span>พิมพ์รายงานนี้</span>
          </button>
        </div>
      </div>

      {/* Overview Report Section Selector Bar (Hidden during printing) */}
      {reportType === 'overview' && (
        <div className="bg-white border-b border-gray-200 px-4 py-2.5 no-print shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 sticky top-[61px] z-20">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 mr-1.5">
              <CheckSquare size={16} className="text-indigo-600 shrink-0" />
              <span>เลือกหัวข้อที่ต้องการพิมพ์:</span>
            </div>

            {/* Checkbox for Team Summary */}
            <label
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer select-none transition-all border ${
                overviewSections.section1
                  ? 'bg-blue-50 text-blue-900 border-blue-300 shadow-2xs'
                  : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100 hover:text-gray-600'
              }`}
            >
              <input
                type="checkbox"
                checked={overviewSections.section1}
                onChange={e => setOverviewSections(prev => ({ ...prev, section1: e.target.checked }))}
                className="rounded text-blue-600 focus:ring-blue-400 h-3.5 w-3.5 cursor-pointer"
              />
              <span>สรุปตามทีมช่าง</span>
            </label>

            {/* Checkbox for Job Type Summary */}
            <label
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer select-none transition-all border ${
                overviewSections.section2
                  ? 'bg-purple-50 text-purple-900 border-purple-300 shadow-2xs'
                  : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100 hover:text-gray-600'
              }`}
            >
              <input
                type="checkbox"
                checked={overviewSections.section2}
                onChange={e => setOverviewSections(prev => ({ ...prev, section2: e.target.checked }))}
                className="rounded text-purple-600 focus:ring-purple-400 h-3.5 w-3.5 cursor-pointer"
              />
              <span>สรุปตามประเภทงาน</span>
            </label>

            {/* Checkbox for Individual Summary */}
            <label
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer select-none transition-all border ${
                overviewSections.section3
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300 shadow-2xs'
                  : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100 hover:text-gray-600'
              }`}
            >
              <input
                type="checkbox"
                checked={overviewSections.section3}
                onChange={e => setOverviewSections(prev => ({ ...prev, section3: e.target.checked }))}
                className="rounded text-emerald-600 focus:ring-emerald-400 h-3.5 w-3.5 cursor-pointer"
              />
              <span>สรุปรายบุคคล</span>
            </label>

            <span className="text-gray-300 hidden sm:inline">|</span>

            {/* Additional Options */}
            <label
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium cursor-pointer select-none transition-all border ${
                overviewSections.kpis
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100 hover:text-gray-600'
              }`}
            >
              <input
                type="checkbox"
                checked={overviewSections.kpis}
                onChange={e => setOverviewSections(prev => ({ ...prev, kpis: e.target.checked }))}
                className="rounded text-amber-600 focus:ring-amber-400 h-3 w-3 cursor-pointer"
              />
              <span>สรุป KPI รวม</span>
            </label>

            <label
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium cursor-pointer select-none transition-all border ${
                overviewSections.signatures
                  ? 'bg-slate-100 text-slate-800 border-slate-300'
                  : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100 hover:text-gray-600'
              }`}
            >
              <input
                type="checkbox"
                checked={overviewSections.signatures}
                onChange={e => setOverviewSections(prev => ({ ...prev, signatures: e.target.checked }))}
                className="rounded text-slate-700 focus:ring-slate-400 h-3 w-3 cursor-pointer"
              />
              <span>ช่องลงนามอนุมัติ</span>
            </label>
          </div>

          {/* Presets and Quick actions */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-gray-400 text-[11px]">เลือกด่วน:</span>
            <button
              type="button"
              onClick={() =>
                setOverviewSections({
                  kpis: true,
                  section1: true,
                  section2: true,
                  section3: true,
                  signatures: true,
                })
              }
              className="px-2 py-1 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-semibold transition-colors text-[11px]"
            >
              เลือกทั้งหมด
            </button>
            <button
              type="button"
              onClick={() =>
                setOverviewSections({
                  kpis: true,
                  section1: true,
                  section2: false,
                  section3: true,
                  signatures: true,
                })
              }
              className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold transition-colors text-[11px] border border-indigo-200"
              title="เลือกเฉพาะสรุปตามทีมช่าง และสรุปรายบุคคล"
            >
              เฉพาะทีม &amp; รายบุคคล
            </button>
            <button
              type="button"
              onClick={() =>
                setOverviewSections({
                  kpis: false,
                  section1: false,
                  section2: false,
                  section3: false,
                  signatures: false,
                })
              }
              className="px-2 py-1 rounded-md text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors text-[11px]"
            >
              ล้างทั้งหมด
            </button>
          </div>
        </div>
      )}

      {/* Official Printed Document Area */}
      <div className="p-4 md:p-6 bg-transparent print:bg-transparent print:p-0 print:m-0 print-clean-container">
        {/* 0. Overview Report View */}
        {reportType === 'overview' && (
          <div className="report-scroll-container">
            {/* Document Header (always shown at the top of the Overview report) */}
            <div className="border-b-2 border-gray-900 pb-2 mb-2">
              <table className="w-full border-none border-collapse text-left m-0 p-0 bg-transparent">
                <tbody>
                  <tr>
                    <td className="border-none p-0 align-top bg-transparent">
                      <table className="border-none border-collapse bg-transparent">
                        <tbody>
                          <tr>
                            <td className="border-none p-0 pr-3 align-middle w-12 bg-transparent">
                              <img src={LOGO_URL} alt="PASAYA" className="h-[46px] w-auto object-contain block" />
                            </td>
                            <td className="border-none p-0 align-middle bg-transparent">
                              <h2 className="font-extrabold text-xs md:text-sm text-gray-900 tracking-tight leading-tight">
                                บริษัท เท็กซ์ไทล์ แกลลอรี่ จํากัด
                              </h2>
                              <p className="text-[10.5px] text-gray-800 font-medium leading-tight whitespace-nowrap">
                                77/191-192 อาคารสินสาธรทาวเวอร์ ชั้น 42 ถนนกรุงธนบุรี แขวงคลองต้นไทร เขตคลองสาน กรุงเทพฯ 10600 (สํานักงานใหญ่)
                              </p>
                              <p className="text-[10.5px] text-gray-800 font-medium leading-tight whitespace-nowrap">
                                เลขประจําตัวผู้เสียภาษี 0105546015615 โทร: 0-2440-0955 แฟ็กซ์: 0-2440-0933-4
                              </p>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                    <td className="border-none p-0 align-top text-right whitespace-nowrap bg-transparent">
                      <div className="border border-gray-400 rounded-sm px-2.5 py-1 text-left text-[10.5px] leading-relaxed inline-block bg-transparent print-bordered-box">
                        <div><span className="text-gray-600">เลขที่เอกสาร:</span> <strong className="text-gray-900 ml-1">INC-OV-{(period?.id || '2026').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}</strong></div>
                        <div><span className="text-gray-600">วันที่ออกเอกสาร:</span> <strong className="text-gray-900 ml-1">{issueDateStr}</strong></div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="text-center mt-2 space-y-0.5">
                <h1 className="font-black text-base text-gray-900 tracking-tight leading-tight">
                  เอกสารสรุปรายงานภาพรวมสวัสดิการค่าตอบแทนพิเศษ (OVERALL INCENTIVE SUMMARY REPORT)
                </h1>
                <p className="text-xs font-semibold text-gray-700 leading-tight">
                  ประจำรอบการคำนวณ: <span className="text-gray-900 font-bold">{period?.name || ''}</span> ({formatDateTH(period?.start || '')} ถึง {formatDateTH(period?.end || '')})
                </p>
              </div>
            </div>

            {/* Overall Metrics Key KPIs Row - Clean bordered box */}
            {overviewSections.kpis && (
              <table className="w-full border border-gray-400 rounded-sm border-collapse text-xs mb-3 text-center bg-transparent print-bordered-box">
                <tbody>
                  <tr>
                    <td className="border-r border-gray-400 p-2 text-left bg-transparent">
                      <span className="text-gray-600 block text-[10px] leading-snug">Incentive รวมทั้งสิ้น</span>
                      <strong className="text-sm md:text-base text-emerald-800 font-black block leading-snug">
                        ฿{calcData.totalIncentive.toLocaleString()}
                      </strong>
                    </td>
                    <td className="border-r border-gray-400 p-2 text-center bg-transparent">
                      <span className="text-gray-600 block text-[10px] leading-snug">จำนวนรางรวม</span>
                      <strong className="text-sm font-bold text-gray-900 block leading-snug">
                        {calcData.totalRails.toLocaleString()} <span className="text-[10px] font-normal text-gray-500">ราง</span>
                      </strong>
                    </td>
                    <td className="border-r border-gray-400 p-2 text-center bg-transparent">
                      <span className="text-gray-600 block text-[10px] leading-snug">งานวัดพื้นที่</span>
                      <strong className="text-sm font-bold text-purple-800 block leading-snug">
                        {calcData.totalMeasureJobs} <span className="text-[10px] font-normal text-gray-500">งาน</span>
                      </strong>
                    </td>
                    <td className="border-r border-gray-400 p-2 text-center bg-transparent">
                      <span className="text-gray-600 block text-[10px] leading-snug">จำนวนช่าง</span>
                      <strong className="text-sm font-bold text-amber-800 block leading-snug">
                        {calcData.totalTechs} <span className="text-[10px] font-normal text-gray-500">คน</span>
                      </strong>
                    </td>
                    <td className="border-r border-gray-400 p-2 text-center bg-transparent">
                      <span className="text-gray-600 block text-[10px] leading-snug">จำนวนงานรวม</span>
                      <strong className="text-sm font-bold text-indigo-800 block leading-snug">
                        {calcData.periodJobs.length} <span className="text-[10px] font-normal text-gray-500">งาน</span>
                      </strong>
                    </td>
                    <td className="p-2 text-right bg-transparent">
                      <span className="text-gray-600 block text-[10px] leading-snug">วันทำการในรอบ</span>
                      <strong className="text-sm font-bold text-rose-800 block leading-snug">
                        {calcData.periodWorkingDays} <span className="text-[10px] font-normal text-gray-500">วัน</span>
                      </strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}

            {/* Section 1: Team Summary Table with repeating thead */}
            {overviewSections.section1 && (
              <table className="report-table w-full text-left text-xs border-collapse border border-gray-300 mb-4 bg-transparent">
                <thead>
                  <tr>
                    <th colSpan={7} className="border-none p-0 font-normal text-left bg-transparent">
                      <div className="font-extrabold text-xs text-gray-900 py-1 border-b border-gray-300 flex justify-between items-center mb-1">
                        <span>สรุปผลงานและยอด Incentive แยกตามทีมช่าง</span>
                        <span className="text-[11px] font-normal text-gray-600">ทั้งหมด {calcData.teamStats.length} ทีม</span>
                      </div>
                    </th>
                  </tr>
                  <tr className="text-gray-900 font-bold border-b border-gray-400 table-column-header bg-transparent">
                    <th className="border border-gray-300 py-1.5 px-2 text-center w-10 bg-transparent">ลำดับ</th>
                    <th className="border border-gray-300 py-1.5 px-2 text-left bg-transparent">ทีมช่างปฏิบัติงาน</th>
                    <th className="border border-gray-300 py-1.5 px-2 text-center w-24 bg-transparent">สมาชิกช่าง (คน)</th>
                    <th className="border border-gray-300 py-1.5 px-2 text-center w-24 bg-transparent">งานที่ทำ (งาน)</th>
                    <th className="border border-gray-300 py-1.5 px-2 text-center w-28 bg-transparent">ปริมาณราง (ราง)</th>
                    <th className="border border-gray-300 py-1.5 px-2 text-right w-36 bg-transparent">Incentive ทีม (บาท)</th>
                    <th className="border border-gray-300 py-1.5 px-2 text-right w-24 bg-transparent">สัดส่วน (%)</th>
                  </tr>
                </thead>
                <tbody className="bg-transparent">
                  {calcData.teamStats.map((team, idx) => {
                    const teamJobCount = (calcData.reportTeamLogs[team.id]?.rows || []).filter(r => !r.isHoliday).length;
                    const percentage = calcData.totalIncentive > 0
                      ? ((team.totalEarned / calcData.totalIncentive) * 100).toFixed(1)
                      : '0.0';
                    return (
                      <tr key={team.id} className="bg-transparent">
                        <td className="border border-gray-300 py-1.5 px-2 text-center text-gray-600 font-medium bg-transparent">{idx + 1}</td>
                        <td className="border border-gray-300 py-1.5 px-2 font-bold text-gray-900 bg-transparent">{team.name}</td>
                        <td className="border border-gray-300 py-1.5 px-2 text-center font-semibold text-gray-800 bg-transparent">{(team.members || []).length} คน</td>
                        <td className="border border-gray-300 py-1.5 px-2 text-center font-semibold text-gray-800 bg-transparent">{teamJobCount} งาน</td>
                        <td className="border border-gray-300 py-1.5 px-2 text-center font-bold text-gray-900 bg-transparent">{(team.totalRails || 0).toLocaleString()}</td>
                        <td className="border border-gray-300 py-1.5 px-2 text-right font-black text-emerald-800 bg-transparent">฿{Math.round(team.totalEarned || 0).toLocaleString()}</td>
                        <td className="border border-gray-300 py-1.5 px-2 text-right font-semibold text-gray-700 bg-transparent">{percentage}%</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-transparent">
                  <tr className="font-bold border-t border-b-2 border-gray-400 bg-transparent">
                    <td colSpan={3} className="border border-gray-300 py-1.5 px-2 text-right font-black text-gray-900 bg-transparent">รวมผลงานทีมทั้งหมด:</td>
                    <td className="border border-gray-300 py-1.5 px-2 text-center font-black text-gray-900 bg-transparent">{calcData.periodJobs.length} งาน</td>
                    <td className="border border-gray-300 py-1.5 px-2 text-center font-black text-blue-900 bg-transparent">{calcData.totalRails.toLocaleString()}</td>
                    <td className="border border-gray-300 py-1.5 px-2 text-right font-black text-emerald-800 text-sm bg-transparent">฿{calcData.totalIncentive.toLocaleString()}</td>
                    <td className="border border-gray-300 py-1.5 px-2 text-right font-black text-gray-900 bg-transparent">100%</td>
                  </tr>
                </tfoot>
              </table>
            )}

            {/* Section 2: Job Type Summary Table with repeating thead */}
            {overviewSections.section2 && (
              <table className="report-table w-full text-left text-xs border-collapse border border-gray-300 mb-4 bg-transparent">
                <thead>
                  <tr>
                    <th colSpan={6} className="border-none p-0 font-normal text-left bg-transparent">
                      <div className="font-extrabold text-xs text-gray-900 py-1 border-b border-gray-300 flex justify-between items-center mb-1">
                        <span>สรุปสัดส่วนผลงานแยกตามประเภทงาน (Job Type Analytics)</span>
                        <span className="text-[11px] font-normal text-gray-600">ทั้งหมด {overallStats.length} ประเภทงาน</span>
                      </div>
                    </th>
                  </tr>
                  <tr className="text-gray-900 font-bold border-b border-gray-400 table-column-header bg-transparent">
                    <th className="border border-gray-300 py-1.5 px-2 text-center w-10 bg-transparent">ลำดับ</th>
                    <th className="border border-gray-300 py-1.5 px-2 text-left bg-transparent">ประเภทงาน (Job Type)</th>
                    <th className="border border-gray-300 py-1.5 px-2 text-center w-24 bg-transparent">จำนวนงาน (Jobs)</th>
                    <th className="border border-gray-300 py-1.5 px-2 text-center w-28 bg-transparent">ปริมาณรวม</th>
                    <th className="border border-gray-300 py-1.5 px-2 text-right w-36 bg-transparent">Incentive รวม (บาท)</th>
                    <th className="border border-gray-300 py-1.5 px-2 text-right w-24 bg-transparent">สัดส่วน (%)</th>
                  </tr>
                </thead>
                <tbody className="bg-transparent">
                  {overallStats.map((item, idx) => (
                    <tr key={item.typeId} className="bg-transparent">
                      <td className="border border-gray-300 py-1.5 px-2 text-center text-gray-600 font-medium bg-transparent">{idx + 1}</td>
                      <td className="border border-gray-300 py-1.5 px-2 font-bold text-gray-900 bg-transparent">{item.label}</td>
                      <td className="border border-gray-300 py-1.5 px-2 text-center font-semibold text-gray-800 bg-transparent">{item.jobCount} งาน</td>
                      <td className="border border-gray-300 py-1.5 px-2 text-center font-bold text-gray-900 bg-transparent">
                        {item.totalQuantity > 0 ? `${item.totalQuantity.toLocaleString()} ${item.unitLabel}` : '-'}
                      </td>
                      <td className="border border-gray-300 py-1.5 px-2 text-right font-black text-emerald-800 bg-transparent">
                        ฿{Math.round(item.totalIncentive).toLocaleString()}
                      </td>
                      <td className="border border-gray-300 py-1.5 px-2 text-right font-semibold text-gray-700 bg-transparent">
                        {item.percentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-transparent">
                  <tr className="font-bold border-t border-b-2 border-gray-400 bg-transparent">
                    <td colSpan={2} className="border border-gray-300 py-1.5 px-2 text-right font-black text-gray-900 bg-transparent">รวมผลงานทุกประเภท:</td>
                    <td className="border border-gray-300 py-1.5 px-2 text-center font-black text-blue-900 bg-transparent">{overallStats.reduce((s, i) => s + i.jobCount, 0)} งาน</td>
                    <td className="border border-gray-300 py-1.5 px-2 bg-transparent"></td>
                    <td className="border border-gray-300 py-1.5 px-2 text-right font-black text-emerald-800 text-sm bg-transparent">฿{Math.round(overallStats.reduce((s, i) => s + i.totalIncentive, 0)).toLocaleString()}</td>
                    <td className="border border-gray-300 py-1.5 px-2 text-right font-black text-gray-900 bg-transparent">100%</td>
                  </tr>
                </tfoot>
              </table>
            )}

            {/* Section 3: Individual Technician Summary Table with repeating thead */}
            {overviewSections.section3 && (
              <table className="report-table w-full text-left text-xs border-collapse border border-gray-300 mb-4 bg-transparent">
                <thead>
                  <tr>
                    <th colSpan={7} className="border-none p-0 font-normal text-left bg-transparent">
                      <div className="font-extrabold text-xs text-gray-900 py-1 border-b border-gray-300 flex justify-between items-center mb-1">
                        <span>สรุปผลตอบแทนสวัสดิการช่างรายบุคคล (Individual Technician Earnings)</span>
                        <span className="text-[11px] font-normal text-gray-600">ทั้งหมด {calcData.individualStats.length} คน</span>
                      </div>
                    </th>
                  </tr>
                  <tr className="text-gray-900 font-bold border-b border-gray-400 table-column-header bg-transparent">
                    <th className="border border-gray-300 py-1.5 px-2 text-center w-10 bg-transparent">ลำดับ</th>
                    <th className="border border-gray-300 py-1.5 px-2 text-center w-24 bg-transparent">รหัสพนักงาน</th>
                    <th className="border border-gray-300 py-1.5 px-2 text-left bg-transparent">ชื่อจริง (ชื่อเล่น) นามสกุล</th>
                    <th className="border border-gray-300 py-1.5 px-2 text-left w-36 bg-transparent">สังกัดทีม</th>
                    <th className="border border-gray-300 py-1.5 px-2 text-center w-28 bg-transparent">วันทำงานจริง</th>
                    <th className="border border-gray-300 py-1.5 px-2 text-right w-36 bg-transparent">ยอดรับสุทธิ (บาท)</th>
                    <th className="border border-gray-300 py-1.5 px-2 text-right w-24 bg-transparent">สัดส่วน (%)</th>
                  </tr>
                </thead>
                <tbody className="bg-transparent">
                  {calcData.individualStats.map((tech, idx) => {
                    const percentage = calcData.totalIncentive > 0
                      ? ((tech.incentive / calcData.totalIncentive) * 100).toFixed(1)
                      : '0.0';
                    return (
                      <tr key={tech.id} className="bg-transparent">
                        <td className="border border-gray-300 py-1.5 px-2 text-center text-gray-600 font-medium bg-transparent">{idx + 1}</td>
                        <td className="border border-gray-300 py-1.5 px-2 text-center font-mono text-gray-700 bg-transparent">{tech.employeeId || '-'}</td>
                        <td className="border border-gray-300 py-1.5 px-2 font-bold text-gray-900 bg-transparent">{getTechOfficialName(tech)}</td>
                        <td className="border border-gray-300 py-1.5 px-2 text-gray-700 font-medium bg-transparent">{tech.teamName}</td>
                        <td className="border border-gray-300 py-1.5 px-2 text-center font-semibold text-gray-800 bg-transparent">{tech.workDays || 0} วัน</td>
                        <td className="border border-gray-300 py-1.5 px-2 text-right font-black text-emerald-800 bg-transparent">฿{Math.round(tech.incentive || 0).toLocaleString()}</td>
                        <td className="border border-gray-300 py-1.5 px-2 text-right font-semibold text-gray-700 bg-transparent">{percentage}%</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-transparent">
                  <tr className="font-bold border-t border-b-2 border-gray-400 bg-transparent">
                    <td colSpan={3} className="border border-gray-300 py-1.5 px-2 text-right font-black text-gray-900 bg-transparent">รวมจ่ายค่าสวัสดิการช่างรายบุคคล:</td>
                    <td className="border border-gray-300 py-1.5 px-2 text-gray-700 bg-transparent">{calcData.individualStats.length} คน</td>
                    <td className="border border-gray-300 py-1.5 px-2 text-center font-black text-blue-900 bg-transparent">
                      {calcData.individualStats.reduce((s, t) => s + (t.workDays || 0), 0)} วัน-คน
                    </td>
                    <td className="border border-gray-300 py-1.5 px-2 text-right font-black text-emerald-800 text-sm bg-transparent">
                      ฿{Math.round(calcData.individualStats.reduce((s, t) => s + (t.incentive || 0), 0)).toLocaleString()}
                    </td>
                    <td className="border border-gray-300 py-1.5 px-2 text-right font-black text-gray-900 bg-transparent">100%</td>
                  </tr>
                </tfoot>
              </table>
            )}

            {/* Empty state alert when no section is checked */}
            {!overviewSections.section1 && !overviewSections.section2 && !overviewSections.section3 && (
              <div className="p-8 text-center bg-gray-50/90 border border-dashed border-gray-300 rounded-xl my-4 no-print">
                <AlertCircle size={32} className="mx-auto text-amber-500 mb-2" />
                <h3 className="font-bold text-sm text-gray-800">ยังไม่ได้เลือกส่วนข้อมูลสำหรับพิมพ์รายงาน</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                  กรุณาทำเครื่องหมายถูกที่ตัวเลือกด้านบน (เช่น สรุปตามทีมช่าง, สรุปตามประเภทงาน หรือสรุปรายบุคคล) เพื่อเลือกข้อมูลที่ต้องการนำมาแสดงและพิมพ์ออกรายงาน
                </p>
                <div className="mt-3.5 flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOverviewSections(prev => ({ ...prev, section1: true, section3: true }))}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                  >
                    เลือกสรุปตามทีมช่าง และสรุปรายบุคคล
                  </button>
                  <button
                    type="button"
                    onClick={() => setOverviewSections({ kpis: true, section1: true, section2: true, section3: true, signatures: true })}
                    className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                  >
                    เลือกทั้งหมด
                  </button>
                </div>
              </div>
            )}

            {/* Official 4-Box Signature Block - 1/3 reduced gap */}
            {overviewSections.signatures && (
              <div className="mt-5 pt-3 border-t border-gray-300 text-xs text-gray-800 print-signature-block">
                <div className="font-bold text-center mb-2.5 text-gray-900 text-xs tracking-wider uppercase">
                  ช่องทางลงนามและอนุมัติ (OFFICIAL SIGN-OFF & APPROVAL)
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="flex flex-col justify-between min-h-[90px]">
                    <div className="h-11 md:h-12 w-full"></div>
                    <div>
                      <p className="font-bold text-gray-900 tracking-wider">(........................................................)</p>
                      <p className="text-[11px] text-gray-700 font-semibold mt-1">ผู้จัดทำรายงาน / Prepared By</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">วันที่ ........ / ........ / .............</p>
                    </div>
                  </div>
                  <div className="flex flex-col justify-between min-h-[90px]">
                    <div className="h-11 md:h-12 w-full"></div>
                    <div>
                      <p className="font-bold text-gray-900 tracking-wider">(........................................................)</p>
                      <p className="text-[11px] text-gray-700 font-semibold mt-1">พนักงานตรวจสอบ / Checked By</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">วันที่ ........ / ........ / .............</p>
                    </div>
                  </div>
                  <div className="flex flex-col justify-between min-h-[90px]">
                    <div className="h-11 md:h-12 w-full"></div>
                    <div>
                      <p className="font-bold text-gray-900 tracking-wider">(........................................................)</p>
                      <p className="text-[11px] text-gray-700 font-semibold mt-1">ผู้จัดการแผนก / Dept Manager</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">วันที่ ........ / ........ / .............</p>
                    </div>
                  </div>
                  <div className="flex flex-col justify-between min-h-[90px]">
                    <div className="h-11 md:h-12 w-full"></div>
                    <div>
                      <p className="font-bold text-gray-900 tracking-wider">(........................................................)</p>
                      <p className="text-[11px] text-gray-700 font-semibold mt-1">ผู้อนุมัติจ่าย / Authorized Signatory</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">วันที่ ........ / ........ / .............</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 1. Team Report View */}
        {reportType === 'team' && (
          <div>
            {selectedTeamId && calcData?.reportTeamLogs?.[selectedTeamId] ? (
              <div>
                <div className="report-scroll-container">
                  <table className="report-table w-full text-left text-xs border-collapse border border-gray-300 bg-transparent">
                    <thead>
                      <tr className="print-header-row">
                        <th colSpan={10} className="border-none p-0 pb-2 font-normal text-left bg-transparent">
                          <div className="border-b-2 border-gray-900 pb-2 mb-2">
                            <table className="w-full border-none border-collapse text-left m-0 p-0 bg-transparent">
                              <tbody>
                                <tr>
                                  <td className="border-none p-0 align-top bg-transparent">
                                    <table className="border-none border-collapse bg-transparent">
                                      <tbody>
                                        <tr>
                                          <td className="border-none p-0 pr-3 align-middle w-12 bg-transparent">
                                            <img src={LOGO_URL} alt="PASAYA" className="h-[46px] w-auto object-contain block" />
                                          </td>
                                          <td className="border-none p-0 align-middle bg-transparent">
                                            <h2 className="font-extrabold text-xs md:text-sm text-gray-900 tracking-tight leading-tight">
                                              บริษัท เท็กซ์ไทล์ แกลลอรี่ จํากัด
                                            </h2>
                                            <p className="text-[10.5px] text-gray-800 font-medium leading-tight whitespace-nowrap">
                                              77/191-192 อาคารสินสาธรทาวเวอร์ ชั้น 42 ถนนกรุงธนบุรี แขวงคลองต้นไทร เขตคลองสาน กรุงเทพฯ 10600 (สํานักงานใหญ่)
                                            </p>
                                            <p className="text-[10.5px] text-gray-800 font-medium leading-tight whitespace-nowrap">
                                              เลขประจําตัวผู้เสียภาษี 0105546015615 โทร: 0-2440-0955 แฟ็กซ์: 0-2440-0933-4
                                            </p>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </td>
                                  <td className="border-none p-0 align-top text-right whitespace-nowrap bg-transparent">
                                    <div className="border border-gray-400 rounded-sm px-2.5 py-1 text-left text-[10.5px] leading-relaxed inline-block bg-transparent print-bordered-box">
                                      <div><span className="text-gray-600">เลขที่เอกสาร:</span> <strong className="text-gray-900 ml-1">INC-TM-{(period?.id || '2026').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}-{selectedTeamId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}</strong></div>
                                      <div><span className="text-gray-600">วันที่ออกเอกสาร:</span> <strong className="text-gray-900 ml-1">{issueDateStr}</strong></div>
                                    </div>
                                  </td>
                                </tr>
                              </tbody>
                            </table>

                            <div className="text-center mt-2 space-y-0.5">
                              <h1 className="font-black text-base text-gray-900 tracking-tight leading-tight">
                                เอกสารใบแจ้งรายละเอียดสวัสดิการค่าตอบแทนพิเศษ (สรุปรายทีม)
                              </h1>
                              <p className="text-xs font-semibold text-gray-700 leading-tight">
                                ประจำรอบการคำนวณ: <span className="text-gray-900 font-bold">{period?.name || ''}</span> ({formatDateTH(period?.start || '')} ถึง {formatDateTH(period?.end || '')})
                              </p>
                            </div>
                          </div>

                          {/* Team Info Metrics Header - Clean bordered box */}
                          <table className="w-full border border-gray-400 rounded-sm border-collapse text-xs mb-2 text-left bg-transparent print-bordered-box">
                            <tbody>
                              <tr>
                                <td className="border-r border-gray-400 p-2 text-left w-1/3 align-middle bg-transparent">
                                  <span className="text-gray-600 block text-[10.5px] leading-snug">ทีมช่างปฏิบัติงาน:</span>
                                  <strong className="text-xs md:text-sm text-gray-900 font-bold block leading-snug">{calcData.reportTeamLogs[selectedTeamId]?.name || ''}</strong>
                                </td>
                                <td className="border-r border-gray-400 p-2 text-center w-1/3 align-middle bg-transparent">
                                  <span className="text-gray-600 block text-[10.5px] leading-snug">จำนวนรายการงานทั้งหมด:</span>
                                  <strong className="text-xs md:text-sm text-gray-900 font-bold block leading-snug">
                                    {calcData.reportTeamLogs[selectedTeamId].rows.filter(r => !r.isHoliday).length} รายการ
                                  </strong>
                                </td>
                                <td className="p-2 text-right w-1/3 align-middle bg-transparent">
                                  <span className="text-gray-600 block text-[10.5px] leading-snug">ยอดรวม Incentive ทีมสุทธิ:</span>
                                  <strong className="text-sm md:text-base text-emerald-800 font-black block leading-snug">
                                    ฿{Math.round(
                                      calcData.reportTeamLogs[selectedTeamId].rows.reduce(
                                        (sum, r) => sum + (typeof r.inc === 'number' ? r.inc : 0),
                                        0
                                      )
                                    ).toLocaleString()}
                                  </strong>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </th>
                      </tr>

                      {/* Column Headers */}
                      <tr className="text-gray-900 font-bold border-b border-gray-400 table-column-header bg-transparent">
                        <th className="border border-gray-300 py-1.5 px-2 text-center w-10 bg-transparent">ลำดับ</th>
                        <th className="border border-gray-300 py-1.5 px-2 text-center w-20 bg-transparent">วันที่</th>
                        <th className="border border-gray-300 py-1.5 px-2 text-center w-24 bg-transparent">เวลา</th>
                        <th className="border border-gray-300 py-1.5 px-2 text-left w-24 bg-transparent">ประเภทงาน</th>
                        <th className="border border-gray-300 py-1.5 px-2 text-left bg-transparent">ชื่อลูกค้า / งาน</th>
                        <th className="border border-gray-300 py-1.5 px-2 text-left w-28 bg-transparent">สถานที่ติดตั้ง</th>
                        <th className="border border-gray-300 py-1.5 px-2 text-center w-24 bg-transparent">ปริมาณ (ราง/ตร.ม.)</th>
                        <th className="border border-gray-300 py-1.5 px-2 text-center w-20 bg-transparent">จำนวนช่าง</th>
                        <th className="border border-gray-300 py-1.5 px-2 text-center w-24 bg-transparent">สถานะ/หมายเหตุ</th>
                        <th className="border border-gray-300 py-1.5 px-2 text-right w-36 bg-transparent">Incentive ทีม (บาท)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-transparent">
                      {calcData.reportTeamLogs[selectedTeamId].rows.map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          className={row.isHoliday ? 'text-gray-500 bg-transparent' : 'bg-transparent'}
                        >
                          <td className="border border-gray-300 py-1.5 px-2 text-center text-gray-600 font-medium bg-transparent">{rIdx + 1}</td>
                          <td className="border border-gray-300 py-1.5 px-2 text-center whitespace-nowrap font-medium text-gray-900 bg-transparent">{formatDateTH(row.date)}</td>
                          {row.isHoliday ? (
                            <td colSpan={8} className="border border-gray-300 py-1.5 px-2 text-center font-bold text-red-600 bg-transparent">
                              วันหยุดบริษัท
                            </td>
                          ) : (
                            <>
                              <td className="border border-gray-300 py-1.5 px-2 text-center text-gray-700 bg-transparent">{row.time}</td>
                              <td className="border border-gray-300 py-1.5 px-2 font-semibold text-gray-900 bg-transparent">{row.type}</td>
                              <td className="border border-gray-300 py-1.5 px-2 font-medium text-gray-900 bg-transparent">{row.customer}</td>
                              <td className="border border-gray-300 py-1.5 px-2 text-gray-700 bg-transparent">{row.location}</td>
                              <td className="border border-gray-300 py-1.5 px-2 text-center font-bold text-gray-900 bg-transparent">
                                {typeof row.rails === 'number' ? (row.rails % 1 === 0 ? row.rails : Number(row.rails.toFixed(2))) : row.rails || '-'}
                              </td>
                              <td className="border border-gray-300 py-1.5 px-2 text-center font-bold text-gray-900 bg-transparent">{row.techs}</td>
                              <td className="border border-gray-300 py-1.5 px-2 text-center text-[11px] text-gray-500 bg-transparent">{row.note || '-'}</td>
                              <td className="border border-gray-300 py-1.5 px-2 text-right font-bold text-gray-900 bg-transparent">
                                {typeof row.inc === 'number'
                                  ? `฿${row.inc % 1 === 0 ? row.inc.toLocaleString() : Number(row.inc.toFixed(3)).toLocaleString()}`
                                  : row.inc !== '-'
                                  ? `฿${row.inc}`
                                  : '-'}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}

                      {calcData.reportTeamLogs[selectedTeamId].rows.length === 0 && (
                        <tr>
                          <td colSpan={10} className="text-center p-8 text-gray-400 bg-transparent">
                            ไม่มีข้อมูลงานของทีมนี้ในช่วงเวลาที่เลือก
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="font-bold border-t-2 border-gray-400 bg-transparent">
                      <tr>
                        <td colSpan={6} className="border border-gray-300 py-2 px-2.5 text-right font-black text-gray-900 bg-transparent">
                          รวมสรุปผลงานทีมประจำรอบ:
                        </td>
                        <td className="border border-gray-300 py-2 px-2.5 text-center text-blue-900 font-black bg-transparent">
                          {Number(
                            calcData.reportTeamLogs[selectedTeamId].rows
                              .reduce((sum, r) => sum + (typeof r.rails === 'number' ? r.rails : 0), 0)
                              .toFixed(2)
                          )}
                        </td>
                        <td className="border border-gray-300 py-2 px-2.5 bg-transparent" colSpan={2}></td>
                        <td className="border border-gray-300 py-2 px-2.5 text-right text-emerald-800 font-black text-sm bg-transparent">
                          ฿
                          {Math.round(
                            calcData.reportTeamLogs[selectedTeamId].rows.reduce(
                              (sum, r) => sum + (typeof r.inc === 'number' ? r.inc : 0),
                              0
                            )
                          ).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Official Sign-off Approval Block - 1/3 reduced gap */}
                <div className="mt-5 pt-3 border-t border-gray-300 text-xs text-gray-800 print-signature-block">
                  <div className="font-bold text-center mb-2.5 text-gray-900 text-xs tracking-wider uppercase">
                    ช่องทางลงนามและอนุมัติ (OFFICIAL SIGN-OFF & APPROVAL)
                  </div>
                  <div className="grid grid-cols-2 gap-8 text-center max-w-2xl mx-auto">
                    <div className="flex flex-col justify-between min-h-[90px]">
                      <div className="h-11 md:h-12 w-full"></div>
                      <div>
                        <p className="font-bold text-gray-900 tracking-wider">(........................................................)</p>
                        <p className="text-[11px] text-gray-700 font-semibold mt-1">หัวหน้าทีมช่าง / Team Lead Signature</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">วันที่ ........ / ........ / .............</p>
                      </div>
                    </div>
                    <div className="flex flex-col justify-between min-h-[90px]">
                      <div className="h-11 md:h-12 w-full"></div>
                      <div>
                        <p className="font-bold text-gray-900 tracking-wider">(........................................................)</p>
                        <p className="text-[11px] text-gray-700 font-semibold mt-1">ผู้อนุมัติการจ่ายสวัสดิการ / Authorized Signatory</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">วันที่ ........ / ........ / .............</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 font-medium">
                กรุณาเลือกทีมที่ต้องการดูรายงาน
              </div>
            )}
          </div>
        )}

        {/* 2. Individual Tech Report View */}
        {reportType === 'tech' && (
          <div>
            {selectedTechId && calcData?.reportTechLogs?.[selectedTechId] ? (
              <div>
                <div className="report-scroll-container">
                  <table className="report-table w-full text-left text-xs border-collapse border border-gray-300 bg-transparent">
                    <thead>
                      <tr className="print-header-row">
                        <th colSpan={10} className="border-none p-0 pb-2 font-normal text-left bg-transparent">
                          <div className="border-b-2 border-gray-900 pb-2 mb-2">
                            <table className="w-full border-none border-collapse text-left m-0 p-0 bg-transparent">
                              <tbody>
                                <tr>
                                  <td className="border-none p-0 align-top bg-transparent">
                                    <table className="border-none border-collapse bg-transparent">
                                      <tbody>
                                        <tr>
                                          <td className="border-none p-0 pr-3 align-middle w-12 bg-transparent">
                                            <img src={LOGO_URL} alt="PASAYA" className="h-[46px] w-auto object-contain block" />
                                          </td>
                                          <td className="border-none p-0 align-middle bg-transparent">
                                            <h2 className="font-extrabold text-xs md:text-sm text-gray-900 tracking-tight leading-tight">
                                              บริษัท เท็กซ์ไทล์ แกลลอรี่ จํากัด
                                            </h2>
                                            <p className="text-[10.5px] text-gray-800 font-medium leading-tight whitespace-nowrap">
                                              77/191-192 อาคารสินสาธรทาวเวอร์ ชั้น 42 ถนนกรุงธนบุรี แขวงคลองต้นไทร เขตคลองสาน กรุงเทพฯ 10600 (สํานักงานใหญ่)
                                            </p>
                                            <p className="text-[10.5px] text-gray-800 font-medium leading-tight whitespace-nowrap">
                                              เลขประจําตัวผู้เสียภาษี 0105546015615 โทร: 0-2440-0955 แฟ็กซ์: 0-2440-0933-4
                                            </p>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </td>
                                  <td className="border-none p-0 align-top text-right whitespace-nowrap bg-transparent">
                                    <div className="border border-gray-400 rounded-sm px-2.5 py-1 text-left text-[10.5px] leading-relaxed inline-block bg-transparent print-bordered-box">
                                      <div><span className="text-gray-600">เลขที่เอกสาร:</span> <strong className="text-gray-900 ml-1">SLIP-{(period?.id || '2026').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}-{selectedTechId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}</strong></div>
                                      <div><span className="text-gray-600">วันที่ออกเอกสาร:</span> <strong className="text-gray-900 ml-1">{issueDateStr}</strong></div>
                                    </div>
                                  </td>
                                </tr>
                              </tbody>
                            </table>

                            <div className="text-center mt-2 space-y-0.5">
                              <h1 className="font-black text-base text-gray-900 tracking-tight leading-tight">
                                เอกสารใบแจ้งสวัสดิการค่าตอบแทนพิเศษรายบุคคล (INDIVIDUAL INCENTIVE SLIP)
                              </h1>
                              <p className="text-xs font-semibold text-gray-700 leading-tight">
                                ประจำรอบการคำนวณ: <span className="text-gray-900 font-bold">{period?.name || ''}</span> ({formatDateTH(period?.start || '')} ถึง {formatDateTH(period?.end || '')})
                              </p>
                            </div>
                          </div>

                          {/* Tech Info Metrics Header - Clean border box as in IMG_1823.png */}
                          {(() => {
                            const selectedTechItem = allTechs.find(t => t.id === selectedTechId) || (teams || []).flatMap(t => t.members || []).find(m => m.id === selectedTechId);
                            return (
                              <table className="w-full border border-gray-400 rounded-sm border-collapse text-xs mb-2 bg-transparent print-bordered-box">
                                <tbody>
                                  <tr>
                                    <td className="border-r border-gray-400 p-2 text-left w-1/3 align-middle bg-transparent">
                                      {selectedTechItem?.employeeId && (
                                        <span className="text-[10px] font-mono text-gray-500 block leading-tight">
                                          รหัสพนักงาน: <strong>{selectedTechItem.employeeId}</strong>
                                        </span>
                                      )}
                                      <span className="text-gray-600 block text-[10.5px] leading-snug">ชื่อพนักงานช่าง:</span>
                                      <strong className="text-xs md:text-sm text-gray-900 font-bold block leading-snug">
                                        {selectedTechItem ? getTechOfficialName(selectedTechItem) : (calcData.reportTechLogs[selectedTechId]?.name || '')}
                                      </strong>
                                      <span className="text-gray-500 text-[10px] md:text-[10.5px] block leading-snug">
                                        (สังกัดทีม: {calcData.reportTechLogs[selectedTechId]?.teamName || ''})
                                      </span>
                                    </td>
                                    <td className="border-r border-gray-400 p-2 text-center w-1/3 align-middle bg-transparent">
                                      <span className="text-gray-600 block text-[10.5px] leading-snug">วันเข้าปฏิบัติงานจริง:</span>
                                      <strong className="text-xs md:text-sm text-gray-900 font-bold block leading-snug">
                                        {calcData.individualStats.find(s => s.id === selectedTechId)?.workDays || 0} วัน
                                      </strong>
                                    </td>
                                    <td className="p-2 text-right w-1/3 align-middle bg-transparent">
                                      <span className="text-gray-600 block text-[10.5px] leading-snug">ยอดรับเงินสุทธิส่วนบุคคล:</span>
                                      <strong className="text-sm md:text-base text-emerald-800 font-black block leading-snug">
                                        ฿{Math.round(
                                          calcData.reportTechLogs[selectedTechId]?.rows?.reduce(
                                            (sum, r) => sum + (typeof r.inc === 'number' ? r.inc : 0),
                                            0
                                          ) || 0
                                        ).toLocaleString()}
                                      </strong>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            );
                          })()}
                        </th>
                      </tr>

                      {/* Column Headers */}
                      <tr className="text-gray-900 font-bold border-b border-gray-400 table-column-header bg-transparent">
                        <th className="border border-gray-300 py-1.5 px-2 text-center w-10 bg-transparent">ลำดับ</th>
                        <th className="border border-gray-300 py-1.5 px-2 text-center w-20 bg-transparent">วันที่</th>
                        <th className="border border-gray-300 py-1.5 px-2 text-center w-24 bg-transparent">เวลา</th>
                        <th className="border border-gray-300 py-1.5 px-2 text-left w-24 bg-transparent">ประเภทงาน</th>
                        <th className="border border-gray-300 py-1.5 px-2 text-left bg-transparent">ชื่อลูกค้า / งาน</th>
                        <th className="border border-gray-300 py-1.5 px-2 text-left w-28 bg-transparent">สถานที่ติดตั้ง</th>
                        <th className="border border-gray-300 py-1.5 px-2 text-center w-24 bg-transparent">สัดส่วนปริมาณ</th>
                        <th className="border border-gray-300 py-1.5 px-2 text-center w-20 bg-transparent">จำนวนช่าง</th>
                        <th className="border border-gray-300 py-1.5 px-2 text-center w-24 bg-transparent">สถานะ/หมายเหตุ</th>
                        <th className="border border-gray-300 py-1.5 px-2 text-right w-36 bg-transparent">Incentive ที่ได้รับ (บาท)</th>
                      </tr>
                    </thead>
                    <tbody className="bg-transparent">
                      {calcData.reportTechLogs[selectedTechId].rows.map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          className={row.isHoliday ? 'text-gray-500 bg-transparent' : 'bg-transparent'}
                        >
                          <td className="border border-gray-300 py-1.5 px-2 text-center text-gray-600 font-medium bg-transparent">{rIdx + 1}</td>
                          <td className="border border-gray-300 py-1.5 px-2 text-center whitespace-nowrap font-medium text-gray-900 bg-transparent">{formatDateTH(row.date)}</td>
                          {row.isHoliday ? (
                            <td colSpan={8} className="border border-gray-300 py-1.5 px-2 text-center font-bold text-red-600 bg-transparent">
                              วันหยุดบริษัท
                            </td>
                          ) : row.isLeave ? (
                            <td colSpan={8} className="border border-gray-300 py-1.5 px-2 text-center font-bold text-amber-800 bg-transparent">
                              {row.customer}
                            </td>
                          ) : (
                            <>
                              <td className="border border-gray-300 py-1.5 px-2 text-center text-gray-700 bg-transparent">{row.time}</td>
                              <td className="border border-gray-300 py-1.5 px-2 font-semibold text-gray-900 bg-transparent">{row.type}</td>
                              <td className="border border-gray-300 py-1.5 px-2 font-medium text-gray-900 bg-transparent">{row.customer}</td>
                              <td className="border border-gray-300 py-1.5 px-2 text-gray-700 bg-transparent">{row.location}</td>
                              <td className="border border-gray-300 py-1.5 px-2 text-center font-bold text-gray-900 bg-transparent">
                                {typeof row.rails === 'number' ? (row.rails % 1 === 0 ? row.rails : Number(row.rails.toFixed(2))) : row.rails || '-'}
                              </td>
                              <td className="border border-gray-300 py-1.5 px-2 text-center font-bold text-gray-900 bg-transparent">{row.techs}</td>
                              <td className="border border-gray-300 py-1.5 px-2 text-center text-[11px] text-gray-500 bg-transparent">{row.note || '-'}</td>
                              <td className="border border-gray-300 py-1.5 px-2 text-right font-bold text-gray-900 bg-transparent">
                                {typeof row.inc === 'number' && row.inc > 0
                                  ? `฿${row.inc % 1 === 0 ? row.inc.toLocaleString() : Number(row.inc.toFixed(3)).toLocaleString()}`
                                  : row.inc === 0
                                  ? '฿0 (ไม่เข้าเกณฑ์/วันลา)'
                                  : row.inc !== '-'
                                  ? `฿${row.inc}`
                                  : '-'}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}

                      {calcData.reportTechLogs[selectedTechId].rows.length === 0 && (
                        <tr>
                          <td colSpan={10} className="text-center p-8 text-gray-400 bg-transparent">
                            ไม่มีข้อมูลการเข้างานของช่างท่านนี้ในช่วงเวลาที่เลือก
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="font-bold border-t-2 border-gray-400 bg-transparent">
                      <tr>
                        <td colSpan={6} className="border border-gray-300 py-2 px-2.5 text-right font-black text-gray-900 bg-transparent">
                          รวมค่า Incentive สุทธิส่วนบุคคล:
                        </td>
                        <td className="border border-gray-300 py-2 px-2.5 text-center text-blue-900 font-black bg-transparent">
                          {Number(
                            calcData.reportTechLogs[selectedTechId].rows
                              .reduce((sum, r) => sum + (typeof r.rails === 'number' ? r.rails : 0), 0)
                              .toFixed(2)
                          )}
                        </td>
                        <td className="border border-gray-300 py-2 px-2.5 bg-transparent" colSpan={2}></td>
                        <td className="border border-gray-300 py-2 px-2.5 text-right text-emerald-800 font-black text-sm bg-transparent">
                          ฿
                          {Math.round(
                            calcData.reportTechLogs[selectedTechId].rows.reduce(
                              (sum, r) => sum + (typeof r.inc === 'number' ? r.inc : 0),
                              0
                            )
                          ).toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Official Sign-off Approval Block - 1/3 reduced gap */}
                <div className="mt-5 pt-3 border-t border-gray-300 text-xs text-gray-800 print-signature-block">
                  <div className="font-bold text-center mb-2.5 text-gray-900 text-xs tracking-wider uppercase">
                    ช่องทางลงนามและอนุมัติ (OFFICIAL SIGN-OFF & APPROVAL)
                  </div>
                  <div className="grid grid-cols-2 gap-8 text-center max-w-2xl mx-auto">
                    <div className="flex flex-col justify-between min-h-[90px]">
                      <div className="h-11 md:h-12 w-full"></div>
                      <div>
                        <p className="font-bold text-gray-900 tracking-wider">(........................................................)</p>
                        <p className="text-[11px] text-gray-700 font-semibold mt-1">ลายมือชื่อพนักงานผู้รับเงิน / Employee Signature</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">วันที่ ........ / ........ / .............</p>
                      </div>
                    </div>
                    <div className="flex flex-col justify-between min-h-[90px]">
                      <div className="h-11 md:h-12 w-full"></div>
                      <div>
                        <p className="font-bold text-gray-900 tracking-wider">(........................................................)</p>
                        <p className="text-[11px] text-gray-700 font-semibold mt-1">ผู้อนุมัติการจ่ายสวัสดิการ / Authorized Signatory</p>
                        <p className="text-[10px] text-gray-500 mt-0.5">วันที่ ........ / ........ / .............</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 font-medium">
                กรุณาเลือกพนักงานที่ต้องการดูรายงาน / สลิปสวัสดิการ
              </div>
            )}
          </div>
        )}

        {/* 3. Job Types Categorized Report View */}
        {reportType === 'job_types' && (
          <div>
            <div className="report-scroll-container">
              <table className="report-table w-full text-left text-xs border-collapse border border-gray-300 bg-transparent">
                <thead>
                  <tr className="print-header-row">
                    <th colSpan={6} className="border-none p-0 pb-2 font-normal text-left bg-transparent">
                      <div className="border-b-2 border-gray-900 pb-2 mb-2">
                        <table className="w-full border-none border-collapse text-left m-0 p-0 bg-transparent">
                          <tbody>
                            <tr>
                              <td className="border-none p-0 align-top bg-transparent">
                                <table className="border-none border-collapse bg-transparent">
                                  <tbody>
                                    <tr>
                                      <td className="border-none p-0 pr-3 align-middle w-12 bg-transparent">
                                        <img src={LOGO_URL} alt="PASAYA" className="h-[46px] w-auto object-contain block" />
                                      </td>
                                      <td className="border-none p-0 align-middle bg-transparent">
                                        <h2 className="font-extrabold text-xs md:text-sm text-gray-900 tracking-tight leading-tight">
                                          บริษัท เท็กซ์ไทล์ แกลลอรี่ จํากัด
                                        </h2>
                                        <p className="text-[10.5px] text-gray-800 font-medium leading-tight whitespace-nowrap">
                                          77/191-192 อาคารสินสาธรทาวเวอร์ ชั้น 42 ถนนกรุงธนบุรี แขวงคลองต้นไทร เขตคลองสาน กรุงเทพฯ 10600 (สํานักงานใหญ่)
                                        </p>
                                        <p className="text-[10.5px] text-gray-800 font-medium leading-tight whitespace-nowrap">
                                          รายงานวิเคราะห์สัดส่วนผลงานและค่าตอบแทน แยกตามประเภทงาน
                                        </p>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                              <td className="border-none p-0 align-top text-right whitespace-nowrap bg-transparent">
                                <div className="border border-gray-400 rounded-sm px-2.5 py-1 text-left text-[10.5px] leading-relaxed inline-block bg-transparent print-bordered-box">
                                  <div><span className="text-gray-600">หมวดรายงาน:</span> <strong className="text-gray-900 ml-1">{jobTypeViewSubtab === 'overall' ? 'ภาพรวมทั้งบริษัท' : jobTypeViewSubtab === 'by_team' ? 'สรุปแยกตามทีม' : 'สรุปแยกตามรายคน'}</strong></div>
                                  <div><span className="text-gray-600">วันที่ออกเอกสาร:</span> <strong className="text-gray-900 ml-1">{issueDateStr}</strong></div>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        <div className="text-center mt-2 space-y-0.5">
                          <h1 className="font-black text-base text-gray-900 tracking-tight leading-tight">
                            รายงานวิเคราะห์ผลงานและสถิติ Incentive แยกตามประเภทงาน (JOB TYPE ANALYTICS)
                          </h1>
                          <p className="text-xs font-semibold text-gray-700 leading-tight">
                            ประจำรอบการคำนวณ: <span className="text-gray-900 font-bold">{period?.name || ''}</span> ({formatDateTH(period?.start || '')} ถึง {formatDateTH(period?.end || '')})
                          </p>
                        </div>
                      </div>
                    </th>
                  </tr>

                  {/* Dynamic Column Headers by Subtab */}
                  {jobTypeViewSubtab === 'overall' && (
                    <tr className="text-gray-900 font-bold border-b border-gray-400 table-column-header bg-transparent">
                      <th className="border border-gray-300 py-1.5 px-2 text-center w-10 bg-transparent">ลำดับ</th>
                      <th className="border border-gray-300 py-1.5 px-2 text-left bg-transparent">ประเภทงาน (Job Type)</th>
                      <th className="border border-gray-300 py-1.5 px-2 text-center w-28 bg-transparent">จำนวนงาน (Jobs)</th>
                      <th className="border border-gray-300 py-1.5 px-2 text-center w-36 bg-transparent">ปริมาณรวม (ราง / ตร.ม.)</th>
                      <th className="border border-gray-300 py-1.5 px-2 text-right w-36 bg-transparent">รวม Incentive (บาท)</th>
                      <th className="border border-gray-300 py-1.5 px-2 text-right w-24 bg-transparent">สัดส่วน (%)</th>
                    </tr>
                  )}

                  {jobTypeViewSubtab === 'by_team' && (
                    <tr className="text-gray-900 font-bold border-b border-gray-400 table-column-header bg-transparent">
                      <th className="border border-gray-300 py-1.5 px-2 text-center w-10 bg-transparent">ลำดับ</th>
                      <th className="border border-gray-300 py-1.5 px-2 text-left w-36 bg-transparent">ทีมช่าง</th>
                      <th className="border border-gray-300 py-1.5 px-2 text-left bg-transparent">ประเภทงาน</th>
                      <th className="border border-gray-300 py-1.5 px-2 text-center w-24 bg-transparent">จำนวนงาน</th>
                      <th className="border border-gray-300 py-1.5 px-2 text-center w-32 bg-transparent">ปริมาณรวม</th>
                      <th className="border border-gray-300 py-1.5 px-2 text-right w-36 bg-transparent">Incentive ทีม (บาท)</th>
                    </tr>
                  )}

                  {jobTypeViewSubtab === 'by_tech' && (
                    <tr className="text-gray-900 font-bold border-b border-gray-400 table-column-header bg-transparent">
                      <th className="border border-gray-300 py-1.5 px-2 text-center w-10 bg-transparent">ลำดับ</th>
                      <th className="border border-gray-300 py-1.5 px-2 text-center w-24 bg-transparent">รหัสพนักงาน</th>
                      <th className="border border-gray-300 py-1.5 px-2 text-left w-48 bg-transparent">ชื่อจริง (ชื่อเล่น) นามสกุล</th>
                      <th className="border border-gray-300 py-1.5 px-2 text-left w-28 bg-transparent">สังกัดทีม</th>
                      <th className="border border-gray-300 py-1.5 px-2 text-left bg-transparent">ประเภทงาน</th>
                      <th className="border border-gray-300 py-1.5 px-2 text-center w-20 bg-transparent">จำนวนงาน</th>
                      <th className="border border-gray-300 py-1.5 px-2 text-right w-32 bg-transparent">Incentive ที่ได้ (บาท)</th>
                    </tr>
                  )}
                </thead>

                {/* Subtab 1: Overall */}
                {jobTypeViewSubtab === 'overall' && (
                  <>
                    <tbody className="bg-transparent">
                      {overallStats.map((item, idx) => (
                        <tr key={item.typeId} className="bg-transparent">
                          <td className="border border-gray-300 py-1.5 px-2 text-center text-gray-600 font-medium bg-transparent">{idx + 1}</td>
                          <td className="border border-gray-300 py-1.5 px-2 font-bold text-gray-900 bg-transparent">{item.label}</td>
                          <td className="border border-gray-300 py-1.5 px-2 text-center font-semibold text-gray-800 bg-transparent">{item.jobCount} งาน</td>
                          <td className="border border-gray-300 py-1.5 px-2 text-center font-bold text-gray-900 bg-transparent">
                            {item.totalQuantity > 0 ? `${item.totalQuantity.toLocaleString()} ${item.unitLabel}` : '-'}
                          </td>
                          <td className="border border-gray-300 py-1.5 px-2 text-right font-black text-emerald-800 bg-transparent">
                            ฿{Math.round(item.totalIncentive).toLocaleString()}
                          </td>
                          <td className="border border-gray-300 py-1.5 px-2 text-right font-semibold text-gray-700 bg-transparent">
                            {item.percentage}%
                          </td>
                        </tr>
                      ))}
                      {overallStats.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center p-8 text-gray-400 bg-transparent">
                            ไม่มีข้อมูลรายการงานในรอบคำนวณนี้
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="font-bold border-t-2 border-gray-400 bg-transparent">
                      <tr>
                        <td colSpan={2} className="border border-gray-300 py-2 px-2.5 text-right font-black text-gray-900 bg-transparent">
                          รวมผลงานทุกประเภท:
                        </td>
                        <td className="border border-gray-300 py-2 px-2.5 text-center text-blue-900 font-black bg-transparent">
                          {overallStats.reduce((s, i) => s + i.jobCount, 0)} งาน
                        </td>
                        <td className="border border-gray-300 py-2 px-2.5 bg-transparent"></td>
                        <td className="border border-gray-300 py-2 px-2.5 text-right text-emerald-800 font-black text-sm bg-transparent">
                          ฿{Math.round(overallStats.reduce((s, i) => s + i.totalIncentive, 0)).toLocaleString()}
                        </td>
                        <td className="border border-gray-300 py-2 px-2.5 text-right font-black bg-transparent">100%</td>
                      </tr>
                    </tfoot>
                  </>
                )}

                {/* Subtab 2: By Team */}
                {jobTypeViewSubtab === 'by_team' && (
                  <>
                    <tbody className="bg-transparent">
                      {teamJobTypeStats.flatMap((teamStat, tIdx) => {
                        return teamStat.breakdown.map((item, bIdx) => (
                          <tr key={`${teamStat.teamId}_${item.typeId}`} className="bg-transparent">
                            {bIdx === 0 && (
                              <td
                                rowSpan={teamStat.breakdown.length}
                                className="border border-gray-300 py-1.5 px-2 text-center text-gray-600 font-medium align-top bg-transparent"
                              >
                                {tIdx + 1}
                              </td>
                            )}
                            {bIdx === 0 && (
                              <td
                                rowSpan={teamStat.breakdown.length}
                                className="border border-gray-300 py-1.5 px-2 font-bold text-gray-900 align-top bg-transparent"
                              >
                                {teamStat.teamName}
                                <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                                  รวม: ฿{Math.round(teamStat.totalIncentive).toLocaleString()}
                                </div>
                              </td>
                            )}
                            <td className="border border-gray-300 py-1.5 px-2 font-medium text-gray-900 bg-transparent">{item.label}</td>
                            <td className="border border-gray-300 py-1.5 px-2 text-center font-semibold text-gray-800 bg-transparent">{item.jobCount} งาน</td>
                            <td className="border border-gray-300 py-1.5 px-2 text-center font-bold text-gray-900 bg-transparent">
                              {item.totalQuantity > 0 ? `${item.totalQuantity.toLocaleString()} ${item.unitLabel}` : '-'}
                            </td>
                            <td className="border border-gray-300 py-1.5 px-2 text-right font-black text-gray-900 bg-transparent">
                              ฿{Math.round(item.totalIncentive).toLocaleString()}
                            </td>
                          </tr>
                        ));
                      })}
                      {teamJobTypeStats.length === 0 && (
                        <tr>
                          <td colSpan={6} className="text-center p-8 text-gray-400 bg-transparent">
                            ไม่มีข้อมูลรายการงานของทีม
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </>
                )}

                {/* Subtab 3: By Tech */}
                {jobTypeViewSubtab === 'by_tech' && (
                  <>
                    <tbody className="bg-transparent">
                      {techJobTypeStats.flatMap((techStat, tIdx) => {
                        return techStat.breakdown.map((item, bIdx) => (
                          <tr key={`${techStat.techId}_${item.typeId}`} className="bg-transparent">
                            {bIdx === 0 && (
                              <td
                                rowSpan={techStat.breakdown.length}
                                className="border border-gray-300 py-1.5 px-2 text-center text-gray-600 font-medium align-top bg-transparent"
                              >
                                {tIdx + 1}
                              </td>
                            )}
                            {bIdx === 0 && (
                              <td
                                rowSpan={techStat.breakdown.length}
                                className="border border-gray-300 py-1.5 px-2 text-center font-mono text-gray-700 align-top bg-transparent"
                              >
                                {techStat.employeeId || '-'}
                              </td>
                            )}
                            {bIdx === 0 && (
                              <td
                                rowSpan={techStat.breakdown.length}
                                className="border border-gray-300 py-1.5 px-2 font-bold text-gray-900 align-top bg-transparent"
                              >
                                {getTechOfficialName(techStat)}
                              </td>
                            )}
                            {bIdx === 0 && (
                              <td
                                rowSpan={techStat.breakdown.length}
                                className="border border-gray-300 py-1.5 px-2 text-gray-600 text-xs align-top bg-transparent"
                              >
                                {techStat.teamName}
                              </td>
                            )}
                            <td className="border border-gray-300 py-1.5 px-2 font-medium text-gray-900 bg-transparent">{item.label}</td>
                            <td className="border border-gray-300 py-1.5 px-2 text-center font-semibold text-gray-800 bg-transparent">{item.jobCount}</td>
                            <td className="border border-gray-300 py-1.5 px-2 text-right font-bold text-gray-900 bg-transparent">
                              ฿{Math.round(item.totalIncentive).toLocaleString()}
                            </td>
                          </tr>
                        ));
                      })}
                      {techJobTypeStats.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center p-8 text-gray-400 bg-transparent">
                            ไม่มีข้อมูลผลงานรายคน
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </>
                )}
              </table>
            </div>

            {/* Official Sign-off Approval Block - 1/3 reduced gap */}
            <div className="mt-5 pt-3 border-t border-gray-300 text-xs text-gray-800 print-signature-block">
              <div className="font-bold text-center mb-2.5 text-gray-900 text-xs tracking-wider uppercase">
                ช่องทางลงนามและอนุมัติ (OFFICIAL SIGN-OFF & APPROVAL)
              </div>
              <div className="grid grid-cols-2 gap-8 text-center max-w-2xl mx-auto">
                <div className="flex flex-col justify-between min-h-[90px]">
                  <div className="h-11 md:h-12 w-full"></div>
                  <div>
                    <p className="font-bold text-gray-900 tracking-wider">(........................................................)</p>
                    <p className="text-[11px] text-gray-700 font-semibold mt-1">ผู้จัดทำรายงาน / Prepared By</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">วันที่ ........ / ........ / .............</p>
                  </div>
                </div>
                <div className="flex flex-col justify-between min-h-[90px]">
                  <div className="h-11 md:h-12 w-full"></div>
                  <div>
                    <p className="font-bold text-gray-900 tracking-wider">(........................................................)</p>
                    <p className="text-[11px] text-gray-700 font-semibold mt-1">ผู้อนุมัติการจ่ายสวัสดิการ / Authorized Signatory</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">วันที่ ........ / ........ / .............</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* 4. All Jobs Detailed Report View (Strictly for Current Period) */}
        {reportType === 'jobs_list' && (
          <div>
            <div className="report-scroll-container">
              <table className="report-table w-full text-left text-xs border-collapse border border-gray-300 bg-transparent">
                <thead>
                  <tr className="print-header-row">
                    <th colSpan={11} className="border-none p-0 pb-2 font-normal text-left bg-transparent">
                      <div className="border-b-2 border-gray-900 pb-2 mb-2">
                        <table className="w-full border-none border-collapse text-left m-0 p-0 bg-transparent">
                          <tbody>
                            <tr>
                              <td className="border-none p-0 align-top bg-transparent">
                                <table className="border-none border-collapse bg-transparent">
                                  <tbody>
                                    <tr>
                                      <td className="border-none p-0 pr-3 align-middle w-12 bg-transparent">
                                        <img src={LOGO_URL} alt="PASAYA" className="h-[46px] w-auto object-contain block" />
                                      </td>
                                      <td className="border-none p-0 align-middle bg-transparent">
                                        <h2 className="font-extrabold text-xs md:text-sm text-gray-900 tracking-tight leading-tight">
                                          บริษัท เท็กซ์ไทล์ แกลลอรี่ จํากัด
                                        </h2>
                                        <p className="text-[10.5px] text-gray-800 font-medium leading-tight whitespace-nowrap">
                                          77/191-192 อาคารสินสาธรทาวเวอร์ ชั้น 42 ถนนกรุงธนบุรี แขวงคลองต้นไทร เขตคลองสาน กรุงเทพฯ 10600 (สํานักงานใหญ่)
                                        </p>
                                        <p className="text-[10.5px] text-gray-800 font-medium leading-tight whitespace-nowrap">
                                          รายงานสรุปรายการงานติดตั้งและค่าตอบแทนสวัสดิการ ประจำรอบการคำนวณ
                                        </p>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              </td>
                              <td className="border-none p-0 align-top text-right whitespace-nowrap bg-transparent">
                                <div className="border border-gray-400 rounded-sm px-2.5 py-1 text-left text-[10.5px] leading-relaxed inline-block bg-transparent print-bordered-box">
                                  <div><span className="text-gray-600">เลขที่เอกสาร:</span> <strong className="text-gray-900 ml-1">INC-JOB-{(period?.id || '2026').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}</strong></div>
                                  <div><span className="text-gray-600">วันที่ออกเอกสาร:</span> <strong className="text-gray-900 ml-1">{issueDateStr}</strong></div>
                                  <div><span className="text-gray-600">สถานะ:</span> <strong className="text-emerald-800 ml-1">รอบที่กำหนด ({calcData.periodJobs.length} งาน)</strong></div>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>

                        <div className="text-center mt-2 space-y-0.5">
                          <h1 className="font-black text-base text-gray-900 tracking-tight leading-tight">
                            รายงานรายการงานติดตั้งและผลประโยชน์สวัสดิการ (PERIOD INSTALLATION JOBS REPORT)
                          </h1>
                          <p className="text-xs font-semibold text-gray-700 leading-tight">
                            ประจำรอบการคำนวณ: <span className="text-gray-900 font-bold">{period?.name || ''}</span> ({formatDateTH(period?.start || '')} ถึง {formatDateTH(period?.end || '')})
                          </p>
                          <p className="text-[11px] text-blue-800 font-medium">
                            * แสดงเฉพาะรายการงานที่อยู่ในรอบวันที่ {formatDateTH(period?.start || '')} ถึง {formatDateTH(period?.end || '')} เท่านั้น
                          </p>
                        </div>
                      </div>

                      {/* Summary Metrics Box */}
                      <table className="w-full border border-gray-400 rounded-sm border-collapse text-xs mb-2 text-left bg-transparent print-bordered-box">
                        <tbody>
                          <tr>
                            <td className="border-r border-gray-400 p-2 text-center w-1/4 align-middle bg-transparent">
                              <span className="text-gray-600 block text-[10.5px] leading-snug">จำนวนงานในรอบ:</span>
                              <strong className="text-xs md:text-sm text-gray-900 font-bold block leading-snug">{calcData.periodJobs.length} งาน</strong>
                            </td>
                            <td className="border-r border-gray-400 p-2 text-center w-1/4 align-middle bg-transparent">
                              <span className="text-gray-600 block text-[10.5px] leading-snug">ตรวจรับแล้ว:</span>
                              <strong className="text-xs md:text-sm text-blue-900 font-bold block leading-snug">
                                {calcData.periodJobs.filter(j => j.isChecked).length} งาน
                              </strong>
                            </td>
                            <td className="border-r border-gray-400 p-2 text-center w-1/4 align-middle bg-transparent">
                              <span className="text-gray-600 block text-[10.5px] leading-snug">ปริมาณรวม (ราง/ตร.ม.):</span>
                              <strong className="text-xs md:text-sm text-gray-900 font-bold block leading-snug">
                                {calcData.totalRails.toLocaleString()} ราง
                              </strong>
                            </td>
                            <td className="p-2 text-right w-1/4 align-middle bg-transparent">
                              <span className="text-gray-600 block text-[10.5px] leading-snug">รวม Incentive ประจำรอบ:</span>
                              <strong className="text-sm md:text-base text-emerald-800 font-black block leading-snug">
                                ฿{Math.round(calcData.totalIncentive).toLocaleString()}
                              </strong>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </th>
                  </tr>

                  {/* Column Headers */}
                  <tr className="text-gray-900 font-bold border-b border-gray-400 table-column-header bg-transparent">
                    <th className="border border-gray-300 py-1.5 px-2 text-center w-10 bg-transparent">ลำดับ</th>
                    <th className="border border-gray-300 py-1.5 px-2 text-center w-20 bg-transparent">วันที่</th>
                    <th className="border border-gray-300 py-1.5 px-2 text-center w-20 bg-transparent">เวลา</th>
                    <th className="border border-gray-300 py-1.5 px-2 text-left w-24 bg-transparent">Order No.</th>
                    <th className="border border-gray-300 py-1.5 px-2 text-left bg-transparent">ชื่อลูกค้า / งาน</th>
                    <th className="border border-gray-300 py-1.5 px-2 text-left w-28 bg-transparent">สถานที่ติดตั้ง</th>
                    <th className="border border-gray-300 py-1.5 px-2 text-left w-24 bg-transparent">ประเภทงาน</th>
                    <th className="border border-gray-300 py-1.5 px-2 text-center w-20 bg-transparent">ปริมาณ</th>
                    <th className="border border-gray-300 py-1.5 px-2 text-left bg-transparent">ช่างปฏิบัติงาน</th>
                    <th className="border border-gray-300 py-1.5 px-2 text-center w-20 bg-transparent">สถานะ</th>
                    <th className="border border-gray-300 py-1.5 px-2 text-right w-28 bg-transparent">Incentive (บาท)</th>
                  </tr>
                </thead>
                <tbody className="bg-transparent">
                  {[...calcData.periodJobs]
                    .sort((a, b) => {
                      const dateComp = (a.date || '').localeCompare(b.date || '');
                      if (dateComp !== 0) return dateComp;
                      const timeComp = (a.timeSlot || '').localeCompare(b.timeSlot || '');
                      if (timeComp !== 0) return timeComp;
                      return (a.orderIndex || 0) - (b.orderIndex || 0);
                    })
                    .map((job, idx) => {
                      const techNames = getTechNamesForJob(job.selectedTechs);
                      const incVal = (job as any).calculatedValue || 0;
                      return (
                        <tr key={job.id || idx} className="bg-transparent">
                          <td className="border border-gray-300 py-1.5 px-2 text-center text-gray-600 font-medium bg-transparent">
                            {idx + 1}
                          </td>
                          <td className="border border-gray-300 py-1.5 px-2 text-center whitespace-nowrap font-medium text-gray-900 bg-transparent">
                            {formatDateTH(job.date)}
                          </td>
                          <td className="border border-gray-300 py-1.5 px-2 text-center text-gray-700 bg-transparent">
                            {job.timeSlot || '-'}
                          </td>
                          <td className="border border-gray-300 py-1.5 px-2 font-mono font-bold text-gray-900 bg-transparent">
                            {job.orderNo || '-'}
                          </td>
                          <td className="border border-gray-300 py-1.5 px-2 font-semibold text-gray-900 bg-transparent">
                            {job.customer || '-'}
                          </td>
                          <td className="border border-gray-300 py-1.5 px-2 text-gray-700 bg-transparent">
                            {job.location || '-'}
                          </td>
                          <td className="border border-gray-300 py-1.5 px-2 text-gray-800 bg-transparent">
                            {job.type}
                          </td>
                          <td className="border border-gray-300 py-1.5 px-2 text-center font-bold text-gray-900 bg-transparent">
                            {job.rails}
                          </td>
                          <td className="border border-gray-300 py-1.5 px-2 text-gray-800 text-[11px] bg-transparent">
                            {techNames}
                          </td>
                          <td className="border border-gray-300 py-1.5 px-2 text-center bg-transparent">
                            {job.isChecked ? (
                              <span className="text-emerald-700 font-bold text-[11px]">ตรวจแล้ว</span>
                            ) : (
                              <span className="text-gray-400 text-[11px]">ยังไม่ตรวจ</span>
                            )}
                          </td>
                          <td className="border border-gray-300 py-1.5 px-2 text-right font-bold text-emerald-800 bg-transparent">
                            ฿{Math.round(incVal).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}

                  {calcData.periodJobs.length === 0 && (
                    <tr>
                      <td colSpan={11} className="text-center p-8 text-gray-400 bg-transparent">
                        ไม่มีข้อมูลรายการงานในรอบคำนวณที่กำหนด ({formatDateTH(period?.start || '')} ถึง {formatDateTH(period?.end || '')})
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="font-bold border-t-2 border-gray-400 bg-transparent">
                  <tr>
                    <td colSpan={7} className="border border-gray-300 py-2 px-2.5 text-right font-black text-gray-900 bg-transparent">
                      รวมรายการงานทั้งหมดในรอบ:
                    </td>
                    <td className="border border-gray-300 py-2 px-2.5 text-center text-blue-900 font-black bg-transparent">
                      {calcData.totalRails.toLocaleString()}
                    </td>
                    <td colSpan={2} className="border border-gray-300 py-2 px-2.5 text-center text-gray-700 font-bold bg-transparent">
                      {calcData.periodJobs.length} งาน
                    </td>
                    <td className="border border-gray-300 py-2 px-2.5 text-right text-emerald-800 font-black text-sm bg-transparent">
                      ฿{Math.round(calcData.totalIncentive).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Official 4-Box Signature Block */}
            <div className="mt-5 pt-3 border-t border-gray-300 text-xs text-gray-800 print-signature-block">
              <div className="font-bold text-center mb-2.5 text-gray-900 text-xs tracking-wider uppercase">
                ช่องทางลงนามและอนุมัติ (OFFICIAL SIGN-OFF & APPROVAL)
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="flex flex-col justify-between min-h-[90px]">
                  <div className="h-11 md:h-12 w-full"></div>
                  <div>
                    <p className="font-bold text-gray-900 tracking-wider">(........................................................)</p>
                    <p className="text-[11px] text-gray-700 font-semibold mt-1">ผู้จัดทำรายงาน / Prepared By</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">วันที่ ........ / ........ / .............</p>
                  </div>
                </div>
                <div className="flex flex-col justify-between min-h-[90px]">
                  <div className="h-11 md:h-12 w-full"></div>
                  <div>
                    <p className="font-bold text-gray-900 tracking-wider">(........................................................)</p>
                    <p className="text-[11px] text-gray-700 font-semibold mt-1">พนักงานตรวจสอบ / Checked By</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">วันที่ ........ / ........ / .............</p>
                  </div>
                </div>
                <div className="flex flex-col justify-between min-h-[90px]">
                  <div className="h-11 md:h-12 w-full"></div>
                  <div>
                    <p className="font-bold text-gray-900 tracking-wider">(........................................................)</p>
                    <p className="text-[11px] text-gray-700 font-semibold mt-1">ผู้จัดการแผนก / Dept Manager</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">วันที่ ........ / ........ / .............</p>
                  </div>
                </div>
                <div className="flex flex-col justify-between min-h-[90px]">
                  <div className="h-11 md:h-12 w-full"></div>
                  <div>
                    <p className="font-bold text-gray-900 tracking-wider">(........................................................)</p>
                    <p className="text-[11px] text-gray-700 font-semibold mt-1">ผู้อนุมัติจ่าย / Authorized Signatory</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">วันที่ ........ / ........ / .............</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
