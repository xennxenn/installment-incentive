import React, { useState } from 'react';
import { 
  X, DollarSign, Ruler, MapPin, Users, FileText, CalendarDays, 
  Search, Info, Building2, CheckCircle2, AlertCircle
} from 'lucide-react';
import { CalculationResult, formatDateTH } from '../utils/calculator';
import { PayPeriod, IncentiveRules, Team, LeaveRecord } from '../types';
import { JOB_TYPES, LEAVE_TYPES } from '../data/initialData';

export type CardDetailType = 
  | 'totalIncentive' 
  | 'totalRails' 
  | 'measureJobs' 
  | 'totalTechs' 
  | 'periodJobs' 
  | 'workingDays'
  | null;

interface CardDetailModalProps {
  type: CardDetailType;
  onClose: () => void;
  calcData: CalculationResult;
  period?: PayPeriod;
  rules: IncentiveRules;
  holidays?: string[];
  leaves?: LeaveRecord[];
  teams?: Team[];
  themeColor: string;
  themeTextColor: string;
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({
  type,
  onClose,
  calcData,
  period,
  rules,
  holidays = [],
  leaves = [],
  teams = [],
  themeColor,
  themeTextColor
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!type) return null;

  const getTitle = () => {
    switch (type) {
      case 'totalIncentive':
        return {
          title: 'รายละเอียด ยอด Incentive รวม',
          subtitle: `สรุปส่วนแบ่งค่าช่างประจำรอบ (${period?.name || 'รอบปัจจุบัน'})`,
          icon: DollarSign,
          iconBg: 'bg-emerald-100 text-emerald-600'
        };
      case 'totalRails':
        return {
          title: 'รายละเอียด จำนวนรางทั้งหมด',
          subtitle: `รายการติดตั้งผ้าม่านประจำรอบ (${period?.name || 'รอบปัจจุบัน'})`,
          icon: Ruler,
          iconBg: 'bg-blue-100 text-blue-600'
        };
      case 'measureJobs':
        return {
          title: 'รายละเอียด งานวัดพื้นที่',
          subtitle: `รายการสถิติงามวัดสถานที่จริงก่อนติดตั้ง`,
          icon: MapPin,
          iconBg: 'bg-purple-100 text-purple-600'
        };
      case 'totalTechs':
        return {
          title: 'รายละเอียด ช่างติดตั้งทั้งหมด',
          subtitle: `รายชื่อช่างติดตั้งในสังกัดและสถิติการทำงาน`,
          icon: Users,
          iconBg: 'bg-amber-100 text-amber-600'
        };
      case 'periodJobs':
        return {
          title: 'รายละเอียด รายการงานทั้งหมดในรอบ',
          subtitle: `จำนวน ${calcData.periodJobs.length} งาน ในช่วงวันที่ ${formatDateTH(period?.start || '')} ถึง ${formatDateTH(period?.end || '')}`,
          icon: FileText,
          iconBg: 'bg-indigo-100 text-indigo-600'
        };
      case 'workingDays':
        return {
          title: 'รายละเอียด วันทำการและวันหยุด',
          subtitle: `ปฏิทินวันทำการ วันหยุดบริษัท และวันลาของพนักงาน`,
          icon: CalendarDays,
          iconBg: 'bg-rose-100 text-rose-600'
        };
      default:
        return {
          title: 'รายละเอียดข้อมูล',
          subtitle: '',
          icon: Info,
          iconBg: 'bg-gray-100 text-gray-600'
        };
    }
  };

  const headerInfo = getTitle();
  const IconComp = headerInfo.icon;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[100] p-3 md:p-6 no-print animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${headerInfo.iconBg}`}>
              <IconComp size={22} />
            </div>
            <div>
              <h3 className="font-extrabold text-base md:text-lg text-gray-900 leading-tight">
                {headerInfo.title}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {headerInfo.subtitle}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-6 flex-1 bg-gray-50/50">
          
          {/* SEARCH BAR if applicable */}
          {(type === 'periodJobs' || type === 'totalTechs' || type === 'measureJobs' || type === 'totalRails') && (
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหา Order No, ชื่อลูกค้า, หรือชื่อช่าง..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-gray-300 shadow-2xs"
              />
            </div>
          )}

          {/* 1. TOTAL INCENTIVE DETAIL */}
          {type === 'totalIncentive' && (
            <div className="space-y-5">
              {/* Top Banner Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-emerald-600 text-white p-4 rounded-xl shadow-xs">
                  <span className="text-[11px] text-emerald-100 font-semibold block uppercase">ยอด Incentive รวมทั้งหมด</span>
                  <span className="text-2xl font-black block mt-1">฿{calcData.totalIncentive.toLocaleString()}</span>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-2xs">
                  <span className="text-[11px] text-gray-500 font-semibold block uppercase">เฉลี่ยต่อทีม ({calcData.teamStats.length} ทีม)</span>
                  <span className="text-xl font-bold text-gray-800 block mt-1">
                    ฿{Math.round(calcData.totalIncentive / Math.max(1, calcData.teamStats.length)).toLocaleString()}
                  </span>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-2xs">
                  <span className="text-[11px] text-gray-500 font-semibold block uppercase">เฉลี่ยต่อช่าง ({calcData.totalTechs} คน)</span>
                  <span className="text-xl font-bold text-gray-800 block mt-1">
                    ฿{Math.round(calcData.totalIncentive / Math.max(1, calcData.totalTechs)).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Team Breakdown Table */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
                <div className="p-3 bg-gray-50 border-b border-gray-200 font-bold text-xs text-gray-700 flex justify-between items-center">
                  <span>สรุปส่วนแบ่งแยกตามทีมช่าง</span>
                  <span className="text-[10px] text-gray-400 font-normal">เรียงจากยอดสูงสุด</span>
                </div>
                <table className="w-full text-xs">
                  <thead className="bg-gray-100/70 text-gray-600 font-semibold border-b">
                    <tr>
                      <th className="p-2.5 text-left">ชื่อทีม</th>
                      <th className="p-2.5 text-center">จำนวนช่าง</th>
                      <th className="p-2.5 text-center">จำนวนราง</th>
                      <th className="p-2.5 text-center">งานวัดพื้นที่</th>
                      <th className="p-2.5 text-right">ยอดที่ได้ (บาท)</th>
                      <th className="p-2.5 text-right">สัดส่วน (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(calcData?.teamStats || []).map(team => {
                      const pct = Math.round((team.totalEarned / Math.max(1, calcData.totalIncentive)) * 100);
                      return (
                        <tr key={team.id} className="hover:bg-gray-50">
                          <td className="p-2.5 font-bold text-gray-800 flex items-center gap-1.5">
                            <Building2 size={14} className="text-gray-400" />
                            <span>{team?.name || ''}</span>
                          </td>
                          <td className="p-2.5 text-center font-medium">{team.members.length} คน</td>
                          <td className="p-2.5 text-center font-medium">{team.totalRails} ราง</td>
                          <td className="p-2.5 text-center font-medium">{team.totalMeasures} งาน</td>
                          <td className="p-2.5 text-right font-extrabold text-emerald-600">
                            ฿{Math.round(team.totalEarned).toLocaleString()}
                          </td>
                          <td className="p-2.5 text-right font-bold text-gray-600">{pct}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Formula summary footer */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Info size={14} />
                  <span>สูตรคำนวณในระบบ:</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  ค่าฐานช่างประจำวัน: ฿{rules.baseTechPay} /คน/วัน • งานติดตั้งฟรี {rules.freeRailsThreshold} รางแรก (ส่วนเกิน ฿{rules.extraRailRate}/ราง) • งานวัดพื้นที่ ฿{rules.measureTechPay} /คน/งาน
                </p>
              </div>
            </div>
          )}

          {/* 2. TOTAL RAILS DETAIL */}
          {type === 'totalRails' && (
            <div className="space-y-5">
              <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-2xs flex justify-between items-center">
                <div>
                  <span className="text-xs text-gray-500 font-semibold block">จำนวนรางติดตั้งสะสมในรอบ</span>
                  <span className="text-2xl font-black text-gray-900 mt-1 block">{calcData.totalRails.toLocaleString()} ราง</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500 font-semibold block">เฉลี่ยต่อวันทำการ ({calcData.periodWorkingDays} วัน)</span>
                  <span className="text-lg font-bold text-blue-600 mt-1 block">
                    {(calcData.totalRails / Math.max(1, calcData.periodWorkingDays)).toFixed(1)} ราง/วัน
                  </span>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
                <div className="p-3 bg-gray-50 border-b border-gray-200 font-bold text-xs text-gray-700">
                  รายการงานที่มีการติดตั้งผ้าม่าน/ราง
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100/70 text-gray-600 font-semibold border-b sticky top-0">
                      <tr>
                        <th className="p-2.5 text-left">วันที่</th>
                        <th className="p-2.5 text-left">เลข Order</th>
                        <th className="p-2.5 text-left">ลูกค้า / สถานที่</th>
                        <th className="p-2.5 text-center">ประเภทงาน</th>
                        <th className="p-2.5 text-right font-bold text-blue-700">จำนวนราง</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {calcData.periodJobs
                        .filter(j => Number(j.rails || 0) > 0)
                        .filter(j => {
                          if (!searchTerm) return true;
                          const term = searchTerm.toLowerCase();
                          return (
                            (j.orderNo || '').toLowerCase().includes(term) ||
                            (j.customer || '').toLowerCase().includes(term)
                          );
                        })
                        .map(job => (
                          <tr key={job.id} className="hover:bg-gray-50">
                            <td className="p-2.5 font-medium text-gray-600">{formatDateTH(job.date)}</td>
                            <td className="p-2.5 font-bold text-gray-900">{job.orderNo || '-'}</td>
                            <td className="p-2.5 text-gray-800">
                              <div className="font-semibold">{job.customer || '-'}</div>
                              <div className="text-[10px] text-gray-400">{job.location}</div>
                            </td>
                            <td className="p-2.5 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                {JOB_TYPES.find(j => j.id === job.jobType)?.label || job.jobType}
                              </span>
                            </td>
                            <td className="p-2.5 text-right font-black text-blue-600 text-sm">
                              {job.rails} ราง
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 3. MEASURE JOBS DETAIL */}
          {type === 'measureJobs' && (
            <div className="space-y-5">
              <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-2xs flex justify-between items-center">
                <div>
                  <span className="text-xs text-gray-500 font-semibold block">จำนวนงานวัดพื้นที่สะสม</span>
                  <span className="text-2xl font-black text-purple-700 mt-1 block">{calcData.totalMeasureJobs} งาน</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500 font-semibold block">อัตราค่าตอบแทนต่อช่าง</span>
                  <span className="text-lg font-bold text-purple-700 mt-1 block">฿{rules.measureTechPay} /คน/งาน</span>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
                <div className="p-3 bg-gray-50 border-b border-gray-200 font-bold text-xs text-gray-700">
                  รายการงานวัดพื้นที่สถานที่จริง
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100/70 text-gray-600 font-semibold border-b sticky top-0">
                      <tr>
                        <th className="p-2.5 text-left">วันที่</th>
                        <th className="p-2.5 text-left">เลข Order</th>
                        <th className="p-2.5 text-left">ลูกค้า</th>
                        <th className="p-2.5 text-left">สถานที่</th>
                        <th className="p-2.5 text-center">ช่างที่เข้าปฏิบัติงาน</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {calcData.periodJobs
                        .filter(j => j.jobType === 'measure')
                        .filter(j => {
                          if (!searchTerm) return true;
                          const term = searchTerm.toLowerCase();
                          return (
                            (j.orderNo || '').toLowerCase().includes(term) ||
                            (j.customer || '').toLowerCase().includes(term)
                          );
                        })
                        .map(job => {
                          const assignedTechs = (teams || [])
                            .flatMap(t => t.members || [])
                            .filter(m => (job.selectedTechs || []).includes(m.id));

                          return (
                            <tr key={job.id} className="hover:bg-gray-50">
                              <td className="p-2.5 font-medium text-gray-600">{formatDateTH(job.date)}</td>
                              <td className="p-2.5 font-bold text-gray-900">{job.orderNo || '-'}</td>
                              <td className="p-2.5 font-semibold text-gray-800">{job.customer || '-'}</td>
                              <td className="p-2.5 text-gray-500">{job.location || '-'}</td>
                              <td className="p-2.5 text-center">
                                <div className="flex flex-wrap gap-1 justify-center">
                                  {assignedTechs.map(tech => (
                                    <span key={tech?.id || Math.random()} className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px] font-semibold border border-purple-200">
                                      {tech?.name || ''}
                                    </span>
                                  ))}
                                  {assignedTechs.length === 0 && (
                                    <span className="text-gray-400 italic text-[11px]">ไม่ได้ระบุช่าง</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 4. TOTAL TECHS DETAIL */}
          {type === 'totalTechs' && (
            <div className="space-y-5">
              <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-2xs flex justify-between items-center">
                <div>
                  <span className="text-xs text-gray-500 font-semibold block">จำนวนช่างติดตั้งทั้งหมด</span>
                  <span className="text-2xl font-black text-amber-600 mt-1 block">{calcData.totalTechs} คน</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-500 font-semibold block">จำนวนทีมช่าง</span>
                  <span className="text-lg font-bold text-gray-800 mt-1 block">{calcData.teamStats.length} ทีม</span>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
                <div className="p-3 bg-gray-50 border-b border-gray-200 font-bold text-xs text-gray-700">
                  รายชื่อพนักงานช่างและสถิติการทำงาน
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100/70 text-gray-600 font-semibold border-b sticky top-0">
                      <tr>
                        <th className="p-2.5 text-left">ชื่อช่าง</th>
                        <th className="p-2.5 text-left">สังกัดทีม</th>
                        <th className="p-2.5 text-center">วันที่เข้าทำงาน</th>
                        <th className="p-2.5 text-center">วันทำงานในรอบ</th>
                        <th className="p-2.5 text-right">Incentive สะสม</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(calcData?.individualStats || [])
                        .filter(tech => {
                          if (!tech) return false;
                          if (!searchTerm) return true;
                          const term = searchTerm.toLowerCase();
                          return (
                            (tech.name || '').toLowerCase().includes(term) ||
                            (tech.teamName || '').toLowerCase().includes(term)
                          );
                        })
                        .map(tech => (
                          <tr key={tech.id} className="hover:bg-gray-50">
                            <td className="p-2.5 font-bold text-gray-800">{tech?.name || ''}</td>
                            <td className="p-2.5 font-medium text-gray-600">{tech.teamName}</td>
                            <td className="p-2.5 text-center text-gray-500">{formatDateTH(tech.joinDate) || '-'}</td>
                            <td className="p-2.5 text-center font-bold text-gray-700">{tech.workDays} วัน</td>
                            <td className="p-2.5 text-right font-extrabold text-emerald-600">
                              ฿{Math.round(tech.incentive).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 5. PERIOD JOBS DETAIL */}
          {type === 'periodJobs' && (
            <div className="space-y-5">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
                <div className="p-3 bg-gray-50 border-b border-gray-200 font-bold text-xs text-gray-700 flex justify-between items-center">
                  <span>รายการงานติดตั้งทั้งหมดในรอบคำนวณ</span>
                  <span className="text-gray-500 text-[11px] font-normal">รวม {calcData.periodJobs.length} งาน</span>
                </div>
                <div className="max-h-[420px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100/70 text-gray-600 font-semibold border-b sticky top-0">
                      <tr>
                        <th className="p-2.5 text-left">วันที่</th>
                        <th className="p-2.5 text-left">เวลา</th>
                        <th className="p-2.5 text-left">เลข Order</th>
                        <th className="p-2.5 text-left">ลูกค้า</th>
                        <th className="p-2.5 text-center">ประเภท</th>
                        <th className="p-2.5 text-center">ราง</th>
                        <th className="p-2.5 text-center">มูลค่าคิดคำนวณ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {calcData.periodJobs
                        .filter(job => {
                          if (!searchTerm) return true;
                          const term = searchTerm.toLowerCase();
                          return (
                            (job.orderNo || '').toLowerCase().includes(term) ||
                            (job.customer || '').toLowerCase().includes(term) ||
                            (job.location || '').toLowerCase().includes(term)
                          );
                        })
                        .map(job => (
                          <tr key={job.id} className="hover:bg-gray-50">
                            <td className="p-2.5 font-medium text-gray-700">{formatDateTH(job.date)}</td>
                            <td className="p-2.5 text-gray-500">{job.timeSlot}</td>
                            <td className="p-2.5 font-bold text-gray-900">{job.orderNo || '-'}</td>
                            <td className="p-2.5 font-semibold text-gray-800">
                              <div>{job.customer || '-'}</div>
                              <div className="text-[10px] text-gray-400 font-normal">{job.location}</div>
                            </td>
                            <td className="p-2.5 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700 border">
                                {JOB_TYPES.find(j => j.id === job.jobType)?.label || job.jobType}
                              </span>
                            </td>
                            <td className="p-2.5 text-center font-bold text-blue-600">{job.rails}</td>
                            <td className="p-2.5 text-center font-extrabold text-emerald-600">
                              ฿{((job as any).calculatedValue || 0).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 6. WORKING DAYS DETAIL */}
          {type === 'workingDays' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-2xs">
                  <span className="text-xs text-gray-500 font-semibold block uppercase">จำนวนวันทำการสุทธิ</span>
                  <span className="text-2xl font-black text-rose-600 mt-1 block">{calcData.periodWorkingDays} วัน</span>
                  <p className="text-[11px] text-gray-400 mt-1">
                    ช่วงวันที่ {formatDateTH(period?.start || '')} ถึง {formatDateTH(period?.end || '')}
                  </p>
                </div>
                <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-2xs">
                  <span className="text-xs text-gray-500 font-semibold block uppercase">จำนวนวันหยุดบริษัทในรอบ</span>
                  <span className="text-2xl font-black text-amber-600 mt-1 block">{holidays.length} วัน</span>
                  <p className="text-[11px] text-gray-400 mt-1">
                    ระบบหักวันหยุดประจำสัปดาห์/นักขัตฤกษ์ให้อัตโนมัติ
                  </p>
                </div>
              </div>

              {/* Holidays List */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
                <div className="p-3 bg-gray-50 border-b border-gray-200 font-bold text-xs text-gray-700 flex items-center gap-1.5">
                  <CalendarDays size={14} className="text-rose-500" />
                  <span>วันหยุดบริษัทในรอบนี้ ({holidays.length} วัน)</span>
                </div>
                <div className="p-3">
                  {holidays.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {holidays.map(hDate => (
                        <span key={hDate} className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg font-semibold text-xs flex items-center gap-1">
                          <span>{formatDateTH(hDate)}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-2">ไม่มีวันหยุดในรอบนี้</p>
                  )}
                </div>
              </div>

              {/* Leaves Summary */}
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
                <div className="p-3 bg-gray-50 border-b border-gray-200 font-bold text-xs text-gray-700 flex items-center gap-1.5">
                  <Users size={14} className="text-amber-500" />
                  <span>สรุปการลางานของพนักงานในรอบนี้</span>
                </div>
                <div className="max-h-[250px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100/70 text-gray-600 font-semibold border-b">
                      <tr>
                        <th className="p-2.5 text-left">ชื่อช่าง</th>
                        <th className="p-2.5 text-center">ประเภทการลา</th>
                        <th className="p-2.5 text-left">วันที่ลา</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {leaves.length > 0 ? (
                        leaves.map((leave, idx) => {
                          const techName = (teams || [])
                            .flatMap(t => t.members || [])
                            .find(m => m.id === leave.memberId)?.name || leave.memberId;

                          return (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="p-2.5 font-bold text-gray-800">{techName}</td>
                              <td className="p-2.5 text-center">
                                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-200 font-semibold text-[10px]">
                                  {LEAVE_TYPES.find(l => l.id === leave.type)?.label || leave.type}
                                </span>
                              </td>
                              <td className="p-2.5 font-medium text-gray-600">{formatDateTH(leave.date)}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-gray-400">
                            ไม่มีประวัติการลาในรอบนี้
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 md:p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
