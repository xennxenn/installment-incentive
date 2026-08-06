import React, { useState } from 'react';
import { 
  Search, Plus, FileSpreadsheet, ArrowUp, ArrowDown, CheckSquare, 
  Square, Trash2, X, AlertCircle, CheckCircle2, SlidersHorizontal, Calendar, Clock
} from 'lucide-react';
import { Job, Team, LeaveRecord, JobTypeId } from '../types';
import { JOB_TYPES, TIME_SLOTS, DEFAULT_TIME_SLOT } from '../data/initialData';

interface JobManagementProps {
  jobs: Job[];
  teams: Team[];
  leaves: LeaveRecord[];
  onAddJob: (jobData: Partial<Job>) => void;
  onUpdateJob: (id: string, field: keyof Job, value: any) => void;
  onDeleteJob: (id: string) => void;
  onMoveJob: (id: string, direction: -1 | 1) => void;
  onToggleCheck: (id: string, currentStatus: boolean) => void;
  onExportCSV: () => void;
  themeColor: string;
  themeTextColor: string;
  periodStart: string;
  periodEnd: string;
  jobSortOrder: 'asc' | 'desc';
  setJobSortOrder: (order: 'asc' | 'desc') => void;
}

export const JobManagement: React.FC<JobManagementProps> = ({
  jobs,
  teams,
  leaves,
  onAddJob,
  onUpdateJob,
  onDeleteJob,
  onMoveJob,
  onToggleCheck,
  onExportCSV,
  themeColor,
  themeTextColor,
  periodStart,
  periodEnd,
  jobSortOrder,
  setJobSortOrder
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state for new job
  const [newDate, setNewDate] = useState(() => {
    const today = new Date().toISOString().split('T')[0];
    return today >= periodStart && today <= periodEnd ? today : periodStart;
  });
  const [newTimeSlot, setNewTimeSlot] = useState(DEFAULT_TIME_SLOT);
  const [newOrderNo, setNewOrderNo] = useState('');
  const [newCustomer, setNewCustomer] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newType, setNewType] = useState<JobTypeId>('install');
  const [newRails, setNewRails] = useState<number>(12);
  const [newSelectedTechs, setNewSelectedTechs] = useState<string[]>([]);

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) return;

    onAddJob({
      date: newDate,
      timeSlot: newTimeSlot,
      orderNo: (newOrderNo.trim() || `ORD-${Date.now().toString().slice(-5)}`).toUpperCase(),
      customer: newCustomer.trim(),
      location: newLocation.trim(),
      type: newType,
      rails: Number(newRails) || 0,
      selectedTechs: newSelectedTechs,
      isChecked: false,
      orderIndex: Date.now()
    });

    // Reset modal
    setShowAddModal(false);
    setNewOrderNo('');
    setNewCustomer('');
    setNewLocation('');
    setNewRails(12);
    setNewSelectedTechs([]);
  };

  const toggleModalTech = (techId: string) => {
    setNewSelectedTechs(prev =>
      prev.includes(techId) ? prev.filter(id => id !== techId) : [...prev, techId]
    );
  };

  const filteredJobs = jobs.filter(j => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      (j.customer || '').toLowerCase().includes(q) ||
      (j.orderNo || '').toLowerCase().includes(q) ||
      (j.location || '').toLowerCase().includes(q) ||
      (j.date || '').includes(q)
    );
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header Bar */}
      <div className="p-4 border-b border-gray-200 bg-gray-50/80 flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-gray-800 text-base">รายการบันทึกงานติดตั้งผ้าม่าน</h2>
          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-semibold">
            {filteredJobs.length} งาน
          </span>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-2xl justify-end">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              type="text"
              placeholder="ค้นหา: เลขออเดอร์, ชื่อลูกค้า, สถานที่..."
              className="w-full pl-9 pr-8 py-1.5 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort selector */}
          <select
            className="border border-gray-200 rounded-xl text-xs px-2.5 py-1.5 bg-white text-gray-700 font-medium focus:outline-none"
            value={jobSortOrder}
            onChange={e => setJobSortOrder(e.target.value as 'asc' | 'desc')}
          >
            <option value="desc">เรียง: ล่าสุดขึ้นก่อน</option>
            <option value="asc">เรียง: เก่าสุดขึ้นก่อน</option>
          </select>

          {/* CSV Export */}
          <button
            onClick={onExportCSV}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <FileSpreadsheet size={14} />
            <span>ส่งออก CSV</span>
          </button>

          {/* Add Job button */}
          <button
            onClick={() => setShowAddModal(true)}
            style={{ backgroundColor: themeColor, color: themeTextColor }}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-opacity"
          >
            <Plus size={15} />
            <span>เพิ่มงานใหม่</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100/70 text-[11px] text-gray-500 font-bold uppercase tracking-wider border-b border-gray-200">
            <tr>
              <th className="p-3 text-center w-10">#</th>
              <th className="p-3 w-36">วันที่ / ช่วงเวลา</th>
              <th className="p-3 w-52">รายละเอียดลูกค้า & Order</th>
              <th className="p-3 w-40">ประเภทงาน</th>
              <th className="p-3 text-center w-24">จำนวน (ราง/ตร.ม.)</th>
              <th className="p-3">ทีมช่างที่เข้าปฏิบัติงาน</th>
              <th className="p-3 text-right w-28">Incentive งาน</th>
              <th className="p-3 text-center w-20">ตรวจงาน</th>
              <th className="p-3 text-center w-16">ลำดับ</th>
              <th className="p-3 text-center w-12">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs">
            {filteredJobs.map((job, index) => {
              const calcVal = (job as any).calculatedValue || 0;

              return (
                <tr
                  key={job.id}
                  className={`hover:bg-gray-50/80 transition-colors ${
                    job.isChecked ? 'bg-emerald-50/20' : ''
                  }`}
                >
                  <td className="p-3 text-center text-gray-400 font-medium">
                    {index + 1}
                  </td>

                  {/* Date & Time slot */}
                  <td className="p-3 align-top space-y-1">
                    <input
                      type="date"
                      value={job.date}
                      onChange={e => onUpdateJob(job.id, 'date', e.target.value)}
                      className="border border-gray-200 rounded-lg p-1 text-xs w-full font-medium text-gray-800 bg-white"
                    />
                    <select
                      className="border border-gray-200 rounded-lg p-1 text-[11px] w-full text-gray-600 bg-white"
                      value={job.timeSlot || DEFAULT_TIME_SLOT}
                      onChange={e => onUpdateJob(job.id, 'timeSlot', e.target.value)}
                    >
                      {TIME_SLOTS.map(slot => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Order, Customer, Location */}
                  <td className="p-3 align-top space-y-1">
                    <input
                      placeholder="Order No. (พิมพ์ใหญ่)"
                      value={(job.orderNo || '').toUpperCase()}
                      onChange={e => onUpdateJob(job.id, 'orderNo', e.target.value.toUpperCase())}
                      className="border border-blue-200 bg-blue-50/50 rounded-lg p-1 text-xs font-bold text-blue-900 w-full uppercase tracking-wide font-mono"
                    />
                    <input
                      placeholder="ชื่อลูกค้า"
                      value={job.customer || ''}
                      onChange={e => onUpdateJob(job.id, 'customer', e.target.value)}
                      className="border border-gray-200 rounded-lg p-1 text-xs w-full text-gray-800 bg-white"
                    />
                    <input
                      placeholder="สถานที่/ที่อยู่"
                      value={job.location || ''}
                      onChange={e => onUpdateJob(job.id, 'location', e.target.value)}
                      className="border border-gray-200 rounded-lg p-1 text-xs w-full text-gray-500 bg-white"
                    />
                  </td>

                  {/* Job Type */}
                  <td className="p-3 align-top">
                    <select
                      value={job.type}
                      onChange={e => onUpdateJob(job.id, 'type', e.target.value as JobTypeId)}
                      className="border border-gray-200 rounded-lg p-1.5 w-full text-xs font-semibold text-gray-800 bg-white"
                    >
                      {JOB_TYPES.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Rails count */}
                  <td className="p-3 align-top text-center">
                    <input
                      type="number"
                      min={0}
                      step={job.type === 'install_wall_linen' || job.type === 'install_wall_mural' ? "0.1" : "1"}
                      value={job.rails}
                      onChange={e => {
                        const raw = parseFloat(e.target.value);
                        if (isNaN(raw)) {
                          onUpdateJob(job.id, 'rails', 0);
                        } else {
                          const isSqm = job.type === 'install_wall_linen' || job.type === 'install_wall_mural';
                          const val = isSqm ? Math.round(raw * 10) / 10 : Math.round(raw);
                          onUpdateJob(job.id, 'rails', val);
                        }
                      }}
                      className="border border-gray-200 rounded-lg p-1.5 w-16 text-center text-xs font-bold bg-white"
                    />
                    <div className="text-[10px] text-gray-400 mt-0.5 font-medium">
                      {job.type === 'install_wall_linen' || job.type === 'install_wall_mural' ? 'ตร.ม.' : 'ราง'}
                    </div>
                  </td>

                  {/* Tech Selector badges */}
                  <td className="p-3 align-top">
                    <div className="flex flex-wrap items-start gap-1.5 py-0.5 w-full">
                      {(teams || []).filter(Boolean).map(team => (
                        <div key={team.id} className="border border-gray-300 rounded-lg p-1.5 bg-white shadow-2xs">
                          <div className="font-bold text-[10px] text-gray-800 mb-1 leading-tight border-b border-gray-100 pb-0.5">
                            {team?.name || ''}
                          </div>
                          <div className="flex flex-wrap items-center gap-1">
                            {(team.members || []).filter(Boolean).map(member => {
                              const isSelected = (job.selectedTechs || []).includes(member.id);

                              const leave = leaves.find(l => l.techId === member.id && l.date === job.date);
                              const isNoInc = leave?.type === 'no_inc';
                              const isLeave = leave && !isNoInc;

                              const isResigned = member.resignDate && job.date >= member.resignDate;
                              const isNotYetJoined = member.joinDate && job.date < member.joinDate;
                              const isDisabled = isLeave || isResigned || isNotYetJoined;

                              let badgeStyle = {};
                              if (isSelected && !isDisabled) {
                                badgeStyle = isNoInc
                                  ? { backgroundColor: '#f3e8ff', color: '#7e22ce', borderColor: '#d8b4fe' }
                                  : { backgroundColor: themeColor, color: themeTextColor, borderColor: themeColor };
                              }

                              return (
                                <button
                                  key={member.id}
                                  onClick={() => {
                                    if (!isDisabled) {
                                      const current = job.selectedTechs || [];
                                      const next = current.includes(member.id)
                                        ? current.filter(id => id !== member.id)
                                        : [...current, member.id];
                                      onUpdateJob(job.id, 'selectedTechs', next);
                                    }
                                  }}
                                  disabled={isDisabled}
                                  style={badgeStyle}
                                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold border transition-all whitespace-nowrap ${
                                    !isSelected && !isDisabled ? 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200' : ''
                                  } ${
                                    isLeave ? 'opacity-40 cursor-not-allowed bg-red-100 text-red-500 border-red-200 line-through' : ''
                                  } ${
                                    isResigned || isNotYetJoined ? 'line-through bg-gray-200 text-gray-400 cursor-not-allowed border-gray-300' : ''
                                  }`}
                                  title={
                                    isLeave
                                      ? `ลา (${leave?.type})`
                                      : isNoInc
                                      ? 'เข้างานแต่ไม่คิดเงิน (No Incentive)'
                                      : isResigned
                                      ? 'ลาออกแล้ว'
                                      : isNotYetJoined
                                      ? 'ยังไม่เริ่มงาน'
                                      : 'คลิกเพื่อเลือก/ยกเลิกช่าง'
                                  }
                                >
                                  {member?.name || ''}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>

                  {/* Calculated Incentive */}
                  <td className="p-3 text-right align-top font-black text-sm text-gray-900">
                    ฿{calcVal.toLocaleString()}
                  </td>

                  {/* IsChecked toggle */}
                  <td className="p-3 text-center align-top">
                    <button
                      onClick={() => onToggleCheck(job.id, job.isChecked)}
                      className="p-1 text-gray-400 hover:text-gray-900 transition-colors"
                      title={job.isChecked ? 'ตรวจแล้ว' : 'ยังไม่ได้ตรวจ'}
                    >
                      {job.isChecked ? (
                        <CheckSquare size={20} className="text-emerald-600" />
                      ) : (
                        <Square size={20} />
                      )}
                    </button>
                  </td>

                  {/* Up / Down ordering */}
                  <td className="p-3 text-center align-top">
                    <div className="flex flex-col items-center gap-1">
                      <button
                        onClick={() => onMoveJob(job.id, -1)}
                        className="text-gray-400 hover:text-gray-900 p-0.5"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        onClick={() => onMoveJob(job.id, 1)}
                        className="text-gray-400 hover:text-gray-900 p-0.5"
                      >
                        <ArrowDown size={12} />
                      </button>
                    </div>
                  </td>

                  {/* Delete button */}
                  <td className="p-3 text-center align-top">
                    <button
                      onClick={() => onDeleteJob(job.id)}
                      className="text-gray-300 hover:text-red-600 p-1 rounded transition-colors"
                      title="ลบงาน"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}

            {filteredJobs.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center py-12 text-gray-400">
                  ไม่พบรายการงานติดตั้งผ้าม่าน
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Job Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-[100] p-4 no-print">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <Plus size={18} />
                <span>บันทึกงานติดตั้งผ้าม่านใหม่</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">วันที่ทำงาน:</label>
                  <input
                    type="date"
                    required
                    className="w-full border rounded-xl p-2 font-bold text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    value={newDate}
                    onChange={e => setNewDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">ช่วงเวลา:</label>
                  <select
                    className="w-full border rounded-xl p-2 font-semibold text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300"
                    value={newTimeSlot}
                    onChange={e => setNewTimeSlot(e.target.value)}
                  >
                    {TIME_SLOTS.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  เลขที่เอกสาร / Order No. <span className="text-[10px] text-gray-500 font-normal">(ภาษาอังกฤษพิมพ์ใหญ่เท่านั้น)</span>:
                </label>
                <input
                  type="text"
                  placeholder="เช่น ORD-2026-008"
                  className="w-full border rounded-xl p-2 font-bold text-xs uppercase tracking-wide font-mono focus:outline-none focus:ring-2 focus:ring-gray-300"
                  value={newOrderNo}
                  onChange={e => setNewOrderNo(e.target.value.toUpperCase())}
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">ชื่อลูกค้า:</label>
                <input
                  type="text"
                  placeholder="เช่น คุณสมชาย (บ้านเดี่ยว)"
                  className="w-full border rounded-xl p-2 text-xs focus:outline-none focus:ring-2 focus:ring-gray-300"
                  value={newCustomer}
                  onChange={e => setNewCustomer(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">สถานที่ / โครงการ:</label>
                <input
                  type="text"
                  placeholder="เช่น หมู่บ้านเศรษฐสิริ แจ้งวัฒนะ"
                  className="w-full border rounded-xl p-2 text-xs focus:outline-none focus:ring-2 focus:ring-gray-300"
                  value={newLocation}
                  onChange={e => setNewLocation(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">ประเภทงาน:</label>
                  <select
                    className="w-full border rounded-xl p-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-gray-300"
                    value={newType}
                    onChange={e => setNewType(e.target.value as JobTypeId)}
                  >
                    {JOB_TYPES.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    จำนวน ({newType === 'install_wall_linen' || newType === 'install_wall_mural' ? 'ตร.ม.' : 'ราง'}):
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={newType === 'install_wall_linen' || newType === 'install_wall_mural' ? "0.1" : "1"}
                    className="w-full border rounded-xl p-2 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                    value={newRails}
                    onChange={e => {
                      const raw = parseFloat(e.target.value);
                      if (isNaN(raw)) {
                        setNewRails(0);
                      } else {
                        const isSqm = newType === 'install_wall_linen' || newType === 'install_wall_mural';
                        const val = isSqm ? Math.round(raw * 10) / 10 : Math.round(raw);
                        setNewRails(val);
                      }
                    }}
                  />
                  {newType === 'install_wall_linen' && (
                    <p className="text-[10px] text-emerald-600 font-semibold mt-1">* คิดค่า Incentive 50 บาท / ตร.ม.</p>
                  )}
                  {newType === 'install_wall_mural' && (
                    <p className="text-[10px] text-emerald-600 font-semibold mt-1">* คิดค่า Incentive 75 บาท / ตร.ม.</p>
                  )}
                </div>
              </div>

              {/* Selecting Technicians */}
              <div>
                <label className="block font-bold text-gray-700 mb-2">เลือกช่างที่จะปฏิบัติงาน:</label>
                <div className="space-y-2 border rounded-xl p-3 max-h-48 overflow-y-auto bg-gray-50/50">
                  {(teams || []).filter(Boolean).map(team => (
                    <div key={team.id} className="space-y-1">
                      <div className="text-[11px] font-bold text-gray-600">{team?.name || ''}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {(team.members || []).filter(Boolean).map(member => {
                          const isSelected = newSelectedTechs.includes(member.id);
                          return (
                            <button
                              type="button"
                              key={member.id}
                              onClick={() => toggleModalTech(member.id)}
                              style={
                                isSelected
                                  ? { backgroundColor: themeColor, color: themeTextColor }
                                  : {}
                              }
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                                !isSelected ? 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100' : ''
                              }`}
                            >
                              {member?.name || ''}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl font-semibold text-gray-700"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: themeColor, color: themeTextColor }}
                  className="px-5 py-2 rounded-xl font-bold shadow-md hover:opacity-90 transition-opacity"
                >
                  บันทึกข้อมูลงาน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
