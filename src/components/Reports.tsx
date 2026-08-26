import React, { useState } from 'react';
import { Printer, Users, User } from 'lucide-react';
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
  const [reportType, setReportType] = useState<'team' | 'tech'>('team');
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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden print-clean-container">
      {/* Controls Bar (hidden during printing) */}
      <div className="p-4 border-b border-gray-200 bg-gray-50/80 flex flex-wrap justify-between items-center gap-3 no-print">
        <div className="flex items-center gap-2 border-b border-gray-200 pb-1">
          <button
            onClick={() => setReportType('team')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              reportType === 'team' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Users size={14} />
            <span>รายงานแยกตามทีม</span>
          </button>
          <button
            onClick={() => setReportType('tech')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
              reportType === 'tech' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <User size={14} />
            <span>รายงานแยกตามบุคคล (สลิปสวัสดิการ)</span>
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
      <div className="p-6 md:p-8 bg-white">
        {/* Team Report View */}
        {reportType === 'team' && (
          <div>
            {selectedTeamId && calcData?.reportTeamLogs?.[selectedTeamId] ? (
              <div>
                {/* Formal Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse border border-gray-300">
                    <thead>
                      {/* Formal Corporate Header Block & Metrics Header (Repeats on every printed page) */}
                      <tr className="print-header-row">
                        <td colSpan={10} className="print-header-cell border-none p-0 pb-2">
                          <div className="border-b-2 border-gray-900 pb-2.5 mb-2.5">
                            <div className="flex flex-wrap justify-between items-start gap-3">
                              <div className="flex items-start gap-3">
                                <img src={LOGO_URL} alt="PASAYA" className="h-[52px] w-auto object-contain flex-shrink-0" />
                                <div className="text-xs text-gray-900 space-y-0.5 leading-tight">
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
                              <div className="text-right text-[11px] leading-tight">
                                <div className="inline-block border border-gray-300 rounded-lg p-1.5 px-2.5 bg-white text-left shadow-2xs space-y-0.5">
                                  <div><strong className="text-gray-900">เลขที่เอกสาร:</strong> INC-TM-{(period?.id || '2026').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}-{selectedTeamId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}</div>
                                  <div><strong className="text-gray-900">วันที่ออกเอกสาร:</strong> {issueDateStr}</div>
                                </div>
                              </div>
                            </div>

                            <div className="text-center mt-2.5 space-y-0.5">
                              <h1 className="font-black text-base text-gray-900 tracking-tight leading-tight">
                                เอกสารใบแจ้งรายละเอียดสวัสดิการค่าตอบแทนพิเศษ (สรุปรายทีม)
                              </h1>
                              <p className="text-xs font-semibold text-gray-700 leading-tight">
                                ประจำรอบการคำนวณ: <span className="text-gray-900 font-bold">{period?.name || ''}</span> ({formatDateTH(period?.start || '')} ถึง {formatDateTH(period?.end || '')})
                              </p>
                            </div>
                          </div>

                          {/* Team Info Metrics Header */}
                          <div className="grid grid-cols-3 gap-2 mb-2 p-2 bg-white border border-gray-300 rounded-lg text-xs font-normal leading-tight">
                            <div>
                              <span className="text-gray-600 block text-[11px]">ทีมช่างปฏิบัติงาน:</span>
                              <strong className="text-xs md:text-sm text-gray-900 font-bold">{calcData.reportTeamLogs[selectedTeamId]?.name || ''}</strong>
                            </div>
                            <div>
                              <span className="text-gray-600 block text-[11px]">จำนวนรายการงานทั้งหมด:</span>
                              <strong className="text-xs md:text-sm text-gray-900 font-bold">
                                {calcData.reportTeamLogs[selectedTeamId].rows.filter(r => !r.isHoliday).length} รายการ
                              </strong>
                            </div>
                            <div className="text-right">
                              <span className="text-gray-600 block text-[11px]">ยอดรวม Incentive ทีมสุทธิ:</span>
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
                        </td>
                      </tr>

                      {/* Column Headers */}
                      <tr className="bg-white text-gray-900 font-bold border-b border-gray-300">
                        <th className="border border-gray-300 p-2 text-center w-10">ลำดับ</th>
                        <th className="border border-gray-300 p-2">วันที่</th>
                        <th className="border border-gray-300 p-2 text-center">เวลา</th>
                        <th className="border border-gray-300 p-2">ประเภทงาน</th>
                        <th className="border border-gray-300 p-2">ชื่อลูกค้า / งาน</th>
                        <th className="border border-gray-300 p-2">สถานที่ติดตั้ง</th>
                        <th className="border border-gray-300 p-2 text-center">ปริมาณ (ราง/ตร.ม.)</th>
                        <th className="border border-gray-300 p-2 text-center">จำนวนช่าง</th>
                        <th className="border border-gray-300 p-2 text-center">หมายเหตุ</th>
                        <th className="border border-gray-300 p-2 text-right">Incentive ทีม (บาท)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calcData.reportTeamLogs[selectedTeamId].rows.map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          className={row.isHoliday ? 'bg-white text-gray-500 italic' : 'bg-white'}
                        >
                          <td className="border border-gray-300 p-2 text-center text-gray-500 font-medium">{rIdx + 1}</td>
                          <td className="border border-gray-300 p-2 whitespace-nowrap font-medium text-gray-900">{formatDateTH(row.date)}</td>
                          {row.isHoliday ? (
                            <td colSpan={8} className="border border-gray-300 p-2 text-center font-bold text-red-600 bg-white">
                              วันหยุดบริษัท
                            </td>
                          ) : (
                            <>
                              <td className="border border-gray-300 p-2 text-center text-gray-600">{row.time}</td>
                              <td className="border border-gray-300 p-2 font-semibold text-gray-800">{row.type}</td>
                              <td className="border border-gray-300 p-2 font-medium text-gray-900">{row.customer}</td>
                              <td className="border border-gray-300 p-2 text-gray-600">{row.location}</td>
                              <td className="border border-gray-300 p-2 text-center font-bold text-gray-900">{row.rails}</td>
                              <td className="border border-gray-300 p-2 text-center font-bold text-gray-900">{row.techs}</td>
                              <td className="border border-gray-300 p-2 text-center text-[10px] text-gray-500">{row.note || '-'}</td>
                              <td className="border border-gray-300 p-2 text-right font-black text-gray-900">
                                {row.inc !== '-' ? `฿${Number(row.inc).toLocaleString()}` : '-'}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}

                      {calcData.reportTeamLogs[selectedTeamId].rows.length === 0 && (
                        <tr>
                          <td colSpan={10} className="text-center p-8 text-gray-400">
                            ไม่มีข้อมูลงานของทีมนี้ในช่วงเวลาที่เลือก
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-white font-bold border-t-2 border-gray-400">
                      <tr>
                        <td colSpan={6} className="border border-gray-300 p-2.5 text-right font-black text-gray-900">
                          รวมสรุปผลงานทีมประจำรอบ:
                        </td>
                        <td className="border border-gray-300 p-2.5 text-center text-blue-800 font-black">
                          {Number(
                            calcData.reportTeamLogs[selectedTeamId].rows
                              .reduce((sum, r) => sum + (typeof r.rails === 'number' ? r.rails : 0), 0)
                              .toFixed(1)
                          )}
                        </td>
                        <td className="border border-gray-300 p-2.5" colSpan={2}></td>
                        <td className="border border-gray-300 p-2.5 text-right text-emerald-800 font-black text-sm">
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
                <div className="mt-12 pt-6 border-t border-gray-300 text-xs text-gray-800 break-inside-avoid">
                  <div className="font-bold text-center mb-6 text-gray-900 text-xs tracking-wider uppercase">
                    ช่องทางลงนามอนุมัติเอกสาร (OFFICIAL APPROVAL SIGN-OFF)
                  </div>
                  <div className="grid grid-cols-3 gap-6 text-center">
                    <div>
                      <div className="border-b border-dashed border-gray-400 w-4/5 mx-auto mb-2"></div>
                      <p className="font-bold text-gray-900">(........................................................)</p>
                      <p className="text-[11px] text-gray-600 font-medium mt-1">ผู้จัดทำรายงาน / Prepared By</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">วันที่ ........ / ........ / .............</p>
                    </div>
                    <div>
                      <div className="border-b border-dashed border-gray-400 w-4/5 mx-auto mb-2"></div>
                      <p className="font-bold text-gray-900">(........................................................)</p>
                      <p className="text-[11px] text-gray-600 font-medium mt-1">หัวหน้าฝ่ายปฏิบัติการ / Supervisor</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">วันที่ ........ / ........ / .............</p>
                    </div>
                    <div>
                      <div className="border-b border-dashed border-gray-400 w-4/5 mx-auto mb-2"></div>
                      <p className="font-bold text-gray-900">(........................................................)</p>
                      <p className="text-[11px] text-gray-600 font-medium mt-1">ผู้อนุมัติจ่าย / Authorized Signatory</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">วันที่ ........ / ........ / .............</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400 font-medium">
                กรุณาเลือกทีมช่างที่ต้องการแสดงรายงาน
              </div>
            )}
          </div>
        )}

        {/* Individual Technician Report / Payslip View */}
        {reportType === 'tech' && (
          <div>
            {selectedTechId && calcData?.reportTechLogs?.[selectedTechId] ? (
              <div>
                {/* Formal Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse border border-gray-300">
                    <thead>
                      {/* Formal Corporate Header Block & Individual Info Box (Repeats on every printed page) */}
                      <tr className="print-header-row">
                        <td colSpan={10} className="print-header-cell border-none p-0 pb-2">
                          <div className="border-b-2 border-gray-900 pb-2.5 mb-2.5">
                            <div className="flex flex-wrap justify-between items-start gap-3">
                              <div className="flex items-start gap-3">
                                <img src={LOGO_URL} alt="PASAYA" className="h-[52px] w-auto object-contain flex-shrink-0" />
                                <div className="text-xs text-gray-900 space-y-0.5 leading-tight">
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
                              <div className="text-right text-[11px] leading-tight">
                                <div className="inline-block border border-gray-300 rounded-lg p-1.5 px-2.5 bg-white text-left shadow-2xs space-y-0.5">
                                  <div><strong className="text-gray-900">เลขที่เอกสาร:</strong> INC-TC-{(period?.id || '2026').replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}-{selectedTechId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}</div>
                                  <div><strong className="text-gray-900">วันที่ออกเอกสาร:</strong> {issueDateStr}</div>
                                </div>
                              </div>
                            </div>

                            <div className="text-center mt-2.5 space-y-0.5">
                              <h1 className="font-black text-base text-gray-900 tracking-tight leading-tight">
                                เอกสารใบแจ้งรายละเอียดสวัสดิการค่าตอบแทนพิเศษ
                              </h1>
                              <p className="text-xs font-semibold text-gray-700 leading-tight">
                                ประจำรอบการคำนวณ: <span className="text-gray-900 font-bold">{period?.name || ''}</span> ({formatDateTH(period?.start || '')} ถึง {formatDateTH(period?.end || '')})
                              </p>
                            </div>
                          </div>

                          {/* Individual Info Box */}
                          <div className="grid grid-cols-3 gap-2 mb-2 p-2 bg-white border border-gray-300 rounded-lg text-xs font-normal leading-tight">
                            <div>
                              <span className="text-gray-600 block text-[11px]">ชื่อ-นามสกุล ช่าง:</span>
                              <strong className="text-xs md:text-sm text-gray-900 font-bold">{calcData.reportTechLogs[selectedTechId]?.name || ''}</strong>
                            </div>
                            <div>
                              <span className="text-gray-600 block text-[11px]">สังกัดทีมช่าง:</span>
                              <strong className="text-xs md:text-sm text-gray-900 font-bold">{calcData.reportTechLogs[selectedTechId]?.teamName || ''}</strong>
                            </div>
                            <div className="text-right">
                              <span className="text-gray-600 block text-[11px]">ยอดรวม Incentive สุทธิส่วนบุคคล:</span>
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
                        </td>
                      </tr>

                      {/* Column Headers */}
                      <tr className="bg-white text-gray-900 font-bold border-b border-gray-300">
                        <th className="border border-gray-300 p-2 text-center w-10">ลำดับ</th>
                        <th className="border border-gray-300 p-2">วันที่</th>
                        <th className="border border-gray-300 p-2 text-center">เวลา</th>
                        <th className="border border-gray-300 p-2">ประเภทงาน</th>
                        <th className="border border-gray-300 p-2">ชื่อลูกค้า / งาน</th>
                        <th className="border border-gray-300 p-2">สถานที่ติดตั้ง</th>
                        <th className="border border-gray-300 p-2 text-center">ส่วนแบ่ง (ราง/ตร.ม.)</th>
                        <th className="border border-gray-300 p-2 text-center">จำนวนช่างทีม</th>
                        <th className="border border-gray-300 p-2 text-center">สถานะ/หมายเหตุ</th>
                        <th className="border border-gray-300 p-2 text-right">Incentive ส่วนบุคคล (บาท)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calcData.reportTechLogs[selectedTechId].rows.map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          className={
                            row.isHoliday
                              ? 'bg-white text-gray-500'
                              : row.isLeave
                              ? 'bg-white text-amber-900'
                              : 'bg-white'
                          }
                        >
                          <td className="border border-gray-300 p-2 text-center text-gray-500 font-medium">{rIdx + 1}</td>
                          <td className="border border-gray-300 p-2 whitespace-nowrap font-medium text-gray-900">{formatDateTH(row.date)}</td>
                          {row.isHoliday ? (
                            <td colSpan={8} className="border border-gray-300 p-2 text-center font-bold text-red-600 bg-white">
                              วันหยุดบริษัท
                            </td>
                          ) : row.isLeave ? (
                            <td colSpan={8} className="border border-gray-300 p-2 text-center font-bold text-amber-800 bg-white">
                              {row.customer}
                            </td>
                          ) : (
                            <>
                              <td className="border border-gray-300 p-2 text-center text-gray-600">{row.time}</td>
                              <td className="border border-gray-300 p-2 font-semibold text-gray-800">{row.type}</td>
                              <td className="border border-gray-300 p-2 font-medium text-gray-900">{row.customer}</td>
                              <td className="border border-gray-300 p-2 text-gray-600">{row.location}</td>
                              <td className="border border-gray-300 p-2 text-center font-bold text-gray-900">{row.rails}</td>
                              <td className="border border-gray-300 p-2 text-center font-bold text-gray-900">{row.techs}</td>
                              <td className="border border-gray-300 p-2 text-center text-[10px] text-gray-500">{row.note || '-'}</td>
                              <td className="border border-gray-300 p-2 text-right font-black text-gray-900">
                                {row.inc !== '-' && Number(row.inc) > 0
                                  ? `฿${Number(row.inc).toLocaleString()}`
                                  : row.inc === 0
                                  ? '฿0 (ไม่เข้าเกณฑ์/วันลา)'
                                  : '-'}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}

                      {calcData.reportTechLogs[selectedTechId].rows.length === 0 && (
                        <tr>
                          <td colSpan={10} className="text-center p-8 text-gray-400">
                            ไม่มีข้อมูลการเข้างานของช่างท่านนี้ในช่วงเวลาที่เลือก
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-white font-bold border-t-2 border-gray-400">
                      <tr>
                        <td colSpan={6} className="border border-gray-300 p-2.5 text-right font-black text-gray-900">
                          รวมค่า Incentive สุทธิส่วนบุคคล:
                        </td>
                        <td className="border border-gray-300 p-2.5 text-center text-blue-800 font-black">
                          {Number(
                            calcData.reportTechLogs[selectedTechId].rows
                              .reduce((sum, r) => sum + (typeof r.rails === 'number' ? r.rails : 0), 0)
                              .toFixed(1)
                          )}
                        </td>
                        <td className="border border-gray-300 p-2.5" colSpan={2}></td>
                        <td className="border border-gray-300 p-2.5 text-right text-emerald-800 font-black text-sm">
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
                <div className="mt-12 pt-6 border-t border-gray-300 text-xs text-gray-800 break-inside-avoid">
                  <div className="font-bold text-center mb-6 text-gray-900 text-xs tracking-wider uppercase">
                    ช่องทางลงนามและอนุมัติ (OFFICIAL SIGN-OFF & APPROVAL)
                  </div>
                  <div className="grid grid-cols-2 gap-8 text-center max-w-2xl mx-auto">
                    <div>
                      <div className="border-b border-dashed border-gray-400 w-4/5 mx-auto mb-2"></div>
                      <p className="font-bold text-gray-900">(........................................................)</p>
                      <p className="text-[11px] text-gray-600 font-medium mt-1">ลายมือชื่อพนักงานผู้รับเงิน / Employee Signature</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">วันที่ ........ / ........ / .............</p>
                    </div>
                    <div>
                      <div className="border-b border-dashed border-gray-400 w-4/5 mx-auto mb-2"></div>
                      <p className="font-bold text-gray-900">(........................................................)</p>
                      <p className="text-[11px] text-gray-600 font-medium mt-1">ผู้อนุมัติการจ่ายสวัสดิการ / Authorized Signatory</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">วันที่ ........ / ........ / .............</p>
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
      </div>
    </div>
  );
};
