import React, { useState } from 'react';
import { Printer, Users, User, Layers, LayoutDashboard } from 'lucide-react';
import { Team, PayPeriod } from '../types';
import { CalculationResult, formatDateTH } from '../utils/calculator';
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
  const [reportType, setReportType] = useState<'overview' | 'team' | 'tech' | 'job_types'>('overview');
  const [jobTypeViewSubtab, setJobTypeViewSubtab] = useState<'overall' | 'by_team' | 'by_tech'>('overall');
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.id || '');
  const [selectedTechId, setSelectedTechId] = useState<string>('');

  const allTechs = (teams || []).filter(Boolean).flatMap(t =>
    (t?.members || []).filter(Boolean).map(m => ({ id: m.id, name: m.name || '', teamName: t?.name || '' }))
  );

  const issueDateStr = new Date().toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const overallStats = calcData?.jobTypeAnalytics?.overall || [];
  const teamJobTypeStats = calcData?.jobTypeAnalytics?.byTeam || [];
  const techJobTypeStats = calcData?.jobTypeAnalytics?.byTech || [];

  return (
    <div className="bg-white print:bg-transparent print-clean-container">
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
                    {tech?.name || ''} ({tech?.teamName || ''})
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

      {/* Official Printed Document Area */}
      <div className="p-4 md:p-6 bg-white print:bg-transparent print:p-0 print:m-0 print-clean-container">
        {/* 0. Overview Report View */}
        {reportType === 'overview' && (
          <div className="report-scroll-container">
            {/* Document Header - Clean Flex block matching system preview, no print overlap */}
            <div className="document-header border-b-2 border-gray-900 pb-2 mb-3">
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-start gap-3">
                  <img src={LOGO_URL} alt="PASAYA" className="h-[44px] w-auto object-contain block flex-shrink-0" />
                  <div className="text-gray-900 leading-tight space-y-0.5">
                    <h2 className="font-extrabold text-xs md:text-sm text-gray-900 tracking-tight leading-tight">
                      บริษัท เท็กซ์ไทล์ แกลลอรี่ จํากัด
                    </h2>
                    <p className="text-[10.5px] text-gray-800 font-medium leading-tight whitespace-nowrap">
                      77/191-192 อาคารสินสาธรทาวเวอร์ ชั้น 42 ถนนกรุงธนบุรี แขวงคลองต้นไทร เขตคลองสาน กรุงเทพฯ 10600 (สํานักงานใหญ่)
                    </p>
                    <p className="text-[10.5px] text-gray-800 font-medium leading-tight whitespace-nowrap">
                      เลขประจําตัวผู้เสียภาษี 0105546015615 โทร: 0-2440-0955 แฟ็กซ์: 0-2440-0933-4
                    </p>
                  </div>
                </div>
                <div className="text-right text-[11px] leading-tight whitespace-nowrap text-gray-800 flex-shrink-0">
                  <div><strong className="text-gray-900">เลขที่เอกสาร:</strong> INC-OV-{(period?.id || '2026').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}</div>
                  <div><strong className="text-gray-900">วันที่ออกเอกสาร:</strong> {issueDateStr}</div>
                </div>
              </div>

              <div className="text-center mt-2 space-y-0.5">
                <h1 className="font-black text-base text-gray-900 tracking-tight leading-tight">
                  เอกสารสรุปรายงานภาพรวมสวัสดิการค่าตอบแทนพิเศษ (OVERALL INCENTIVE SUMMARY REPORT)
                </h1>
                <p className="text-xs font-semibold text-gray-700 leading-tight">
                  ประจำรอบการคำนวณ: <span className="text-gray-900 font-bold">{period?.name || ''}</span> ({formatDateTH(period?.start || '')} ถึง {formatDateTH(period?.end || '')})
                </p>
              </div>

              {/* Overall Key KPIs Metrics Line */}
              <div className="flex justify-between items-center text-xs mt-2 pt-1.5 px-1 text-gray-800 font-medium">
                <div>
                  <span className="text-gray-500 text-[10px] block">ยอด Incentive รวมทั้งสิ้น:</span>
                  <strong className="text-sm font-black text-emerald-800">฿{calcData.totalIncentive.toLocaleString()}</strong>
                </div>
                <div className="text-center">
                  <span className="text-gray-500 text-[10px] block">ปริมาณรางรวม:</span>
                  <strong className="text-xs font-bold text-gray-900">{calcData.totalRails.toLocaleString()} ราง</strong>
                </div>
                <div className="text-center">
                  <span className="text-gray-500 text-[10px] block">งานวัดพื้นที่:</span>
                  <strong className="text-xs font-bold text-purple-800">{calcData.totalMeasureJobs} งาน</strong>
                </div>
                <div className="text-center">
                  <span className="text-gray-500 text-[10px] block">จำนวนช่างปฏิบัติงาน:</span>
                  <strong className="text-xs font-bold text-amber-800">{calcData.totalTechs} คน</strong>
                </div>
                <div className="text-center">
                  <span className="text-gray-500 text-[10px] block">จำนวนงานรวม:</span>
                  <strong className="text-xs font-bold text-indigo-800">{calcData.periodJobs.length} งาน</strong>
                </div>
                <div className="text-right">
                  <span className="text-gray-500 text-[10px] block">วันทำการในรอบ:</span>
                  <strong className="text-xs font-bold text-rose-800">{calcData.periodWorkingDays} วัน</strong>
                </div>
              </div>
            </div>

            <table className="report-table w-full text-left text-xs border-collapse border border-gray-300 bg-transparent">
              <thead>
                {/* Unified 7 Column Headers */}
                <tr className="text-gray-900 font-bold border-b border-gray-400 table-column-header bg-transparent">
                  <th className="border border-gray-300 py-1.5 px-2 text-center w-10 bg-transparent">ลำดับ</th>
                  <th className="border border-gray-300 py-1.5 px-2 text-left bg-transparent">รายการ / ทีมช่าง / ช่างปฏิบัติงาน</th>
                  <th className="border border-gray-300 py-1.5 px-2 text-center w-32 bg-transparent">สมาชิก / สังกัดทีม</th>
                  <th className="border border-gray-300 py-1.5 px-2 text-center w-24 bg-transparent">งานที่ทำ / วันทำงาน</th>
                  <th className="border border-gray-300 py-1.5 px-2 text-center w-28 bg-transparent">ปริมาณรวม</th>
                  <th className="border border-gray-300 py-1.5 px-2 text-right w-36 bg-transparent">Incentive (บาท)</th>
                  <th className="border border-gray-300 py-1.5 px-2 text-right w-20 bg-transparent">สัดส่วน (%)</th>
                </tr>
              </thead>

              <tbody className="bg-transparent">
                {/* Section 1: Team Summary */}
                <tr className="bg-transparent">
                  <td colSpan={7} className="border border-gray-300 py-1.5 px-2 text-left font-black text-gray-900 text-xs bg-transparent">
                    ส่วนที่ 1: สรุปผลงานและยอด Incentive แยกตามทีมช่าง (ทั้งหมด {calcData.teamStats.length} ทีม)
                  </td>
                </tr>
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
                      <td className="border border-gray-300 py-1.5 px-2 text-center font-bold text-gray-900 bg-transparent">{(team.totalRails || 0).toLocaleString()} ราง</td>
                      <td className="border border-gray-300 py-1.5 px-2 text-right font-black text-emerald-800 bg-transparent">฿{Math.round(team.totalEarned || 0).toLocaleString()}</td>
                      <td className="border border-gray-300 py-1.5 px-2 text-right font-semibold text-gray-700 bg-transparent">{percentage}%</td>
                    </tr>
                  );
                })}
                <tr className="font-bold border-t border-b border-gray-400 bg-transparent">
                  <td colSpan={3} className="border border-gray-300 py-1.5 px-2 text-right font-black text-gray-900 bg-transparent">รวมผลงานทีมทั้งหมด:</td>
                  <td className="border border-gray-300 py-1.5 px-2 text-center font-black text-gray-900 bg-transparent">{calcData.periodJobs.length} งาน</td>
                  <td className="border border-gray-300 py-1.5 px-2 text-center font-black text-blue-900 bg-transparent">{calcData.totalRails.toLocaleString()} ราง</td>
                  <td className="border border-gray-300 py-1.5 px-2 text-right font-black text-emerald-800 text-sm bg-transparent">฿{calcData.totalIncentive.toLocaleString()}</td>
                  <td className="border border-gray-300 py-1.5 px-2 text-right font-black text-gray-900 bg-transparent">100%</td>
                </tr>

                {/* Section 2: Job Types Summary */}
                <tr className="bg-transparent">
                  <td colSpan={7} className="border border-gray-300 py-1.5 px-2 text-left font-black text-gray-900 text-xs bg-transparent pt-3">
                    ส่วนที่ 2: สรุปสัดส่วนผลงานแยกตามประเภทงาน (Job Type Analytics - ทั้งหมด {overallStats.length} ประเภทงาน)
                  </td>
                </tr>
                {overallStats.map((item, idx) => (
                  <tr key={item.typeId} className="bg-transparent">
                    <td className="border border-gray-300 py-1.5 px-2 text-center text-gray-600 font-medium bg-transparent">{idx + 1}</td>
                    <td className="border border-gray-300 py-1.5 px-2 font-bold text-gray-900 bg-transparent">{item.label}</td>
                    <td className="border border-gray-300 py-1.5 px-2 text-center text-gray-500 bg-transparent">-</td>
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
                <tr className="font-bold border-t border-b border-gray-400 bg-transparent">
                  <td colSpan={3} className="border border-gray-300 py-1.5 px-2 text-right font-black text-gray-900 bg-transparent">รวมผลงานทุกประเภท:</td>
                  <td className="border border-gray-300 py-1.5 px-2 text-center font-black text-blue-900 bg-transparent">{overallStats.reduce((s, i) => s + i.jobCount, 0)} งาน</td>
                  <td className="border border-gray-300 py-1.5 px-2 bg-transparent text-center text-gray-500">-</td>
                  <td className="border border-gray-300 py-1.5 px-2 text-right font-black text-emerald-800 text-sm bg-transparent">฿{Math.round(overallStats.reduce((s, i) => s + i.totalIncentive, 0)).toLocaleString()}</td>
                  <td className="border border-gray-300 py-1.5 px-2 text-right font-black text-gray-900 bg-transparent">100%</td>
                </tr>

                {/* Section 3: Individual Technician Summary */}
                <tr className="bg-transparent">
                  <td colSpan={7} className="border border-gray-300 py-1.5 px-2 text-left font-black text-gray-900 text-xs bg-transparent pt-3">
                    ส่วนที่ 3: สรุปผลตอบแทนสวัสดิการช่างรายบุคคล (Individual Technician Earnings - ทั้งหมด {calcData.individualStats.length} คน)
                  </td>
                </tr>
                {calcData.individualStats.map((tech, idx) => {
                  const percentage = calcData.totalIncentive > 0
                    ? ((tech.incentive / calcData.totalIncentive) * 100).toFixed(1)
                    : '0.0';
                  return (
                    <tr key={tech.id} className="bg-transparent">
                      <td className="border border-gray-300 py-1.5 px-2 text-center text-gray-600 font-medium bg-transparent">{idx + 1}</td>
                      <td className="border border-gray-300 py-1.5 px-2 font-bold text-gray-900 bg-transparent">{tech.name}</td>
                      <td className="border border-gray-300 py-1.5 px-2 text-center text-gray-700 font-medium bg-transparent">{tech.teamName}</td>
                      <td className="border border-gray-300 py-1.5 px-2 text-center font-semibold text-gray-800 bg-transparent">{tech.workDays || 0} วัน</td>
                      <td className="border border-gray-300 py-1.5 px-2 text-center text-gray-500 bg-transparent">-</td>
                      <td className="border border-gray-300 py-1.5 px-2 text-right font-black text-emerald-800 bg-transparent">฿{Math.round(tech.incentive || 0).toLocaleString()}</td>
                      <td className="border border-gray-300 py-1.5 px-2 text-right font-semibold text-gray-700 bg-transparent">{percentage}%</td>
                    </tr>
                  );
                })}
                <tr className="font-bold border-t-2 border-b-2 border-gray-400 bg-transparent">
                  <td colSpan={2} className="border border-gray-300 py-1.5 px-2 text-right font-black text-gray-900 bg-transparent">รวมจ่ายค่าสวัสดิการช่างรายบุคคล:</td>
                  <td className="border border-gray-300 py-1.5 px-2 text-center text-gray-700 font-bold bg-transparent">{calcData.individualStats.length} คน</td>
                  <td className="border border-gray-300 py-1.5 px-2 text-center font-black text-blue-900 bg-transparent">
                    {calcData.individualStats.reduce((s, t) => s + (t.workDays || 0), 0)} วัน-คน
                  </td>
                  <td className="border border-gray-300 py-1.5 px-2 text-center text-gray-500 bg-transparent">-</td>
                  <td className="border border-gray-300 py-1.5 px-2 text-right font-black text-emerald-800 text-sm bg-transparent">
                    ฿{Math.round(calcData.individualStats.reduce((s, t) => s + (t.incentive || 0), 0)).toLocaleString()}
                  </td>
                  <td className="border border-gray-300 py-1.5 px-2 text-right font-black text-gray-900 bg-transparent">100%</td>
                </tr>
              </tbody>
            </table>

            {/* Official 4-Box Signature Block */}
            <div className="mt-6 pt-3 border-t border-gray-300 text-xs text-gray-800 print-signature-block">
              <div className="font-bold text-center mb-9 text-gray-900 text-xs tracking-wider uppercase">
                ช่องทางลงนามและอนุมัติ (OFFICIAL SIGN-OFF & APPROVAL)
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center max-w-4xl mx-auto">
                <div>
                  <p className="font-bold text-gray-900 tracking-wider">(........................................................)</p>
                  <p className="text-[11px] text-gray-700 font-semibold mt-1.5">ผู้จัดทำรายงาน / Prepared By</p>
                  <p className="text-[10px] text-gray-500 mt-1">วันที่ ........ / ........ / .............</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900 tracking-wider">(........................................................)</p>
                  <p className="text-[11px] text-gray-700 font-semibold mt-1.5">พนักงานตรวจสอบ / Checked By</p>
                  <p className="text-[10px] text-gray-500 mt-1">วันที่ ........ / ........ / .............</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900 tracking-wider">(........................................................)</p>
                  <p className="text-[11px] text-gray-700 font-semibold mt-1.5">ผู้จัดการแผนก / Dept Manager</p>
                  <p className="text-[10px] text-gray-500 mt-1">วันที่ ........ / ........ / .............</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900 tracking-wider">(........................................................)</p>
                  <p className="text-[11px] text-gray-700 font-semibold mt-1.5">ผู้อนุมัติจ่าย / Authorized Signatory</p>
                  <p className="text-[10px] text-gray-500 mt-1">วันที่ ........ / ........ / .............</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 1. Team Report View */}
        {reportType === 'team' && (
          <div>
            {selectedTeamId && calcData?.reportTeamLogs?.[selectedTeamId] ? (
              <div>
                <div className="report-scroll-container">
                  {/* Document Header - Clean Flex block matching system preview, no print overlap */}
                  <div className="document-header border-b-2 border-gray-900 pb-2 mb-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-start gap-3">
                        <img src={LOGO_URL} alt="PASAYA" className="h-[44px] w-auto object-contain block flex-shrink-0" />
                        <div className="text-gray-900 leading-tight space-y-0.5">
                          <h2 className="font-extrabold text-xs md:text-sm text-gray-900 tracking-tight leading-tight">
                            บริษัท เท็กซ์ไทล์ แกลลอรี่ จํากัด
                          </h2>
                          <p className="text-[10.5px] text-gray-800 font-medium leading-tight whitespace-nowrap">
                            77/191-192 อาคารสินสาธรทาวเวอร์ ชั้น 42 ถนนกรุงธนบุรี แขวงคลองต้นไทร เขตคลองสาน กรุงเทพฯ 10600 (สํานักงานใหญ่)
                          </p>
                          <p className="text-[10.5px] text-gray-800 font-medium leading-tight whitespace-nowrap">
                            เลขประจําตัวผู้เสียภาษี 0105546015615 โทร: 0-2440-0955 แฟ็กซ์: 0-2440-0933-4
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-[11px] leading-tight whitespace-nowrap text-gray-800 flex-shrink-0">
                        <div><strong className="text-gray-900">เลขที่เอกสาร:</strong> INC-TM-{(period?.id || '2026').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}-{selectedTeamId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}</div>
                        <div><strong className="text-gray-900">วันที่ออกเอกสาร:</strong> {issueDateStr}</div>
                      </div>
                    </div>

                    <div className="text-center mt-2 space-y-0.5">
                      <h1 className="font-black text-base text-gray-900 tracking-tight leading-tight">
                        เอกสารใบแจ้งรายละเอียดสวัสดิการค่าตอบแทนพิเศษ (สรุปรายทีม)
                      </h1>
                      <p className="text-xs font-semibold text-gray-700 leading-tight">
                        ประจำรอบการคำนวณ: <span className="text-gray-900 font-bold">{period?.name || ''}</span> ({formatDateTH(period?.start || '')} ถึง {formatDateTH(period?.end || '')})
                      </p>
                    </div>

                    {/* Team Info Metrics Line - Clean borderless flex */}
                    <div className="flex justify-between items-center text-xs mt-2 pt-1.5 px-1 text-gray-800 font-medium">
                      <div>
                        <span className="text-gray-500 text-[10px] block">ทีมช่างปฏิบัติงาน:</span>
                        <strong className="text-xs md:text-sm text-gray-900 font-bold">{calcData.reportTeamLogs[selectedTeamId]?.name || ''}</strong>
                      </div>
                      <div className="text-center">
                        <span className="text-gray-500 text-[10px] block">จำนวนรายการงานทั้งหมด:</span>
                        <strong className="text-xs md:text-sm text-gray-900 font-bold">
                          {calcData.reportTeamLogs[selectedTeamId].rows.filter(r => !r.isHoliday).length} รายการ
                        </strong>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-500 text-[10px] block">ยอดรวม Incentive ทีมสุทธิ:</span>
                        <strong className="text-sm md:text-base text-emerald-800 font-black">
                          ฿{Math.round(
                            calcData.reportTeamLogs[selectedTeamId].rows.reduce(
                              (sum, r) => sum + (typeof r.inc === 'number' ? r.inc : 0),
                              0
                            )
                          ).toLocaleString()}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <table className="report-table w-full text-left text-xs border-collapse border border-gray-300 bg-transparent">
                    <thead>
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

                {/* Official Sign-off Approval Block */}
                <div className="mt-6 pt-3 border-t border-gray-300 text-xs text-gray-800 print-signature-block">
                  <div className="font-bold text-center mb-9 text-gray-900 text-xs tracking-wider uppercase">
                    ช่องทางลงนามและอนุมัติ (OFFICIAL SIGN-OFF & APPROVAL)
                  </div>
                  <div className="grid grid-cols-2 gap-12 text-center max-w-xl mx-auto">
                    <div>
                      <p className="font-bold text-gray-900 tracking-wider">(........................................................)</p>
                      <p className="text-[11px] text-gray-700 font-semibold mt-1.5">หัวหน้าทีมช่าง / Team Lead Signature</p>
                      <p className="text-[10px] text-gray-500 mt-1">วันที่ ........ / ........ / .............</p>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 tracking-wider">(........................................................)</p>
                      <p className="text-[11px] text-gray-700 font-semibold mt-1.5">ผู้อนุมัติการจ่ายสวัสดิการ / Authorized Signatory</p>
                      <p className="text-[10px] text-gray-500 mt-1">วันที่ ........ / ........ / .............</p>
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
                  {/* Document Header - Clean Flex block matching system preview, no print overlap */}
                  <div className="document-header border-b-2 border-gray-900 pb-2 mb-3">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-start gap-3">
                        <img src={LOGO_URL} alt="PASAYA" className="h-[44px] w-auto object-contain block flex-shrink-0" />
                        <div className="text-gray-900 leading-tight space-y-0.5">
                          <h2 className="font-extrabold text-xs md:text-sm text-gray-900 tracking-tight leading-tight">
                            บริษัท เท็กซ์ไทล์ แกลลอรี่ จํากัด
                          </h2>
                          <p className="text-[10.5px] text-gray-800 font-medium leading-tight whitespace-nowrap">
                            77/191-192 อาคารสินสาธรทาวเวอร์ ชั้น 42 ถนนกรุงธนบุรี แขวงคลองต้นไทร เขตคลองสาน กรุงเทพฯ 10600 (สํานักงานใหญ่)
                          </p>
                          <p className="text-[10.5px] text-gray-800 font-medium leading-tight whitespace-nowrap">
                            เลขประจําตัวผู้เสียภาษี 0105546015615 โทร: 0-2440-0955 แฟ็กซ์: 0-2440-0933-4
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-[11px] leading-tight whitespace-nowrap text-gray-800 flex-shrink-0">
                        <div><strong className="text-gray-900">เลขที่เอกสาร:</strong> SLIP-{(period?.id || '2026').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}-{selectedTechId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}</div>
                        <div><strong className="text-gray-900">วันที่ออกเอกสาร:</strong> {issueDateStr}</div>
                      </div>
                    </div>

                    <div className="text-center mt-2 space-y-0.5">
                      <h1 className="font-black text-base text-gray-900 tracking-tight leading-tight">
                        เอกสารใบแจ้งสวัสดิการค่าตอบแทนพิเศษรายบุคคล (INDIVIDUAL INCENTIVE SLIP)
                      </h1>
                      <p className="text-xs font-semibold text-gray-700 leading-tight">
                        ประจำรอบการคำนวณ: <span className="text-gray-900 font-bold">{period?.name || ''}</span> ({formatDateTH(period?.start || '')} ถึง {formatDateTH(period?.end || '')})
                      </p>
                    </div>

                    {/* Tech Info Metrics Line - Clean borderless flex */}
                    <div className="flex justify-between items-center text-xs mt-2 pt-1.5 px-1 text-gray-800 font-medium">
                      <div>
                        <span className="text-gray-500 text-[10px] block">ชื่อพนักงานช่าง:</span>
                        <strong className="text-xs md:text-sm text-gray-900 font-bold">
                          {calcData.reportTechLogs[selectedTechId]?.name || ''}
                        </strong>
                        <span className="text-gray-500 text-[10px] block">
                          (สังกัดทีม: {calcData.reportTechLogs[selectedTechId]?.teamName || ''})
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-gray-500 text-[10px] block">วันเข้าปฏิบัติงานจริง:</span>
                        <strong className="text-xs md:text-sm text-gray-900 font-bold">
                          {calcData.individualStats.find(s => s.id === selectedTechId)?.workDays || 0} วัน
                        </strong>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-500 text-[10px] block">ยอดรับเงินสุทธิส่วนบุคคล:</span>
                        <strong className="text-sm md:text-base text-emerald-800 font-black">
                          ฿{Math.round(
                            calcData.reportTechLogs[selectedTechId].rows.reduce(
                              (sum, r) => sum + (typeof r.inc === 'number' ? r.inc : 0),
                              0
                            )
                          ).toLocaleString()}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <table className="report-table w-full text-left text-xs border-collapse border border-gray-300 bg-transparent">
                    <thead>
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

                {/* Official Sign-off Approval Block */}
                <div className="mt-6 pt-3 border-t border-gray-300 text-xs text-gray-800 print-signature-block">
                  <div className="font-bold text-center mb-9 text-gray-900 text-xs tracking-wider uppercase">
                    ช่องทางลงนามและอนุมัติ (OFFICIAL SIGN-OFF & APPROVAL)
                  </div>
                  <div className="grid grid-cols-2 gap-12 text-center max-w-xl mx-auto">
                    <div>
                      <p className="font-bold text-gray-900 tracking-wider">(........................................................)</p>
                      <p className="text-[11px] text-gray-700 font-semibold mt-1.5">ลายมือชื่อพนักงานผู้รับเงิน / Employee Signature</p>
                      <p className="text-[10px] text-gray-500 mt-1">วันที่ ........ / ........ / .............</p>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 tracking-wider">(........................................................)</p>
                      <p className="text-[11px] text-gray-700 font-semibold mt-1.5">ผู้อนุมัติการจ่ายสวัสดิการ / Authorized Signatory</p>
                      <p className="text-[10px] text-gray-500 mt-1">วันที่ ........ / ........ / .............</p>
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
              {/* Document Header - Clean Flex block matching system preview, no print overlap */}
              <div className="document-header border-b-2 border-gray-900 pb-2 mb-3">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-start gap-3">
                    <img src={LOGO_URL} alt="PASAYA" className="h-[44px] w-auto object-contain block flex-shrink-0" />
                    <div className="text-gray-900 leading-tight space-y-0.5">
                      <h2 className="font-extrabold text-xs md:text-sm text-gray-900 tracking-tight leading-tight">
                        บริษัท เท็กซ์ไทล์ แกลลอรี่ จํากัด
                      </h2>
                      <p className="text-[10.5px] text-gray-800 font-medium leading-tight whitespace-nowrap">
                        77/191-192 อาคารสินสาธรทาวเวอร์ ชั้น 42 ถนนกรุงธนบุรี แขวงคลองต้นไทร เขตคลองสาน กรุงเทพฯ 10600 (สํานักงานใหญ่)
                      </p>
                      <p className="text-[10.5px] text-gray-800 font-medium leading-tight whitespace-nowrap">
                        รายงานวิเคราะห์สัดส่วนผลงานและค่าตอบแทน แยกตามประเภทงาน
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-[11px] leading-tight whitespace-nowrap text-gray-800 flex-shrink-0">
                    <div><strong className="text-gray-900">หมวดรายงาน:</strong> {jobTypeViewSubtab === 'overall' ? 'ภาพรวมทั้งบริษัท' : jobTypeViewSubtab === 'by_team' ? 'สรุปแยกตามทีม' : 'สรุปแยกตามรายคน'}</div>
                    <div><strong className="text-gray-900">วันที่ออกเอกสาร:</strong> {issueDateStr}</div>
                  </div>
                </div>

                <div className="text-center mt-2 space-y-0.5">
                  <h1 className="font-black text-base text-gray-900 tracking-tight leading-tight">
                    รายงานวิเคราะห์ผลงานและสถิติ Incentive แยกตามประเภทงาน (JOB TYPE ANALYTICS)
                  </h1>
                  <p className="text-xs font-semibold text-gray-700 leading-tight">
                    ประจำรอบการคำนวณ: <span className="text-gray-900 font-bold">{period?.name || ''}</span> ({formatDateTH(period?.start || '')} ถึง {formatDateTH(period?.end || '')})
                  </p>
                </div>
              </div>

              <table className="report-table w-full text-left text-xs border-collapse border border-gray-300 bg-transparent">
                <thead>
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
                      <th className="border border-gray-300 py-1.5 px-2 text-left w-36 bg-transparent">ชื่อช่าง</th>
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
                                className="border border-gray-300 py-1.5 px-2 font-bold text-gray-900 align-top bg-transparent"
                              >
                                {techStat.techName}
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
                          <td colSpan={6} className="text-center p-8 text-gray-400 bg-transparent">
                            ไม่มีข้อมูลผลงานรายคน
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </>
                )}
              </table>
            </div>

            {/* Official Sign-off Approval Block */}
            <div className="mt-6 pt-3 border-t border-gray-300 text-xs text-gray-800 print-signature-block">
              <div className="font-bold text-center mb-9 text-gray-900 text-xs tracking-wider uppercase">
                ช่องทางลงนามและอนุมัติ (OFFICIAL SIGN-OFF & APPROVAL)
              </div>
              <div className="grid grid-cols-2 gap-12 text-center max-w-xl mx-auto">
                <div>
                  <p className="font-bold text-gray-900 tracking-wider">(........................................................)</p>
                  <p className="text-[11px] text-gray-700 font-semibold mt-1.5">ผู้จัดทำรายงาน / Prepared By</p>
                  <p className="text-[10px] text-gray-500 mt-1">วันที่ ........ / ........ / .............</p>
                </div>
                <div>
                  <p className="font-bold text-gray-900 tracking-wider">(........................................................)</p>
                  <p className="text-[11px] text-gray-700 font-semibold mt-1.5">ผู้อนุมัติการจ่ายสวัสดิการ / Authorized Signatory</p>
                  <p className="text-[10px] text-gray-500 mt-1">วันที่ ........ / ........ / .............</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
