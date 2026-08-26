import React, { useState, useRef } from 'react';
import { 
  Search, Plus, FileSpreadsheet, ArrowUp, ArrowDown, CheckSquare, 
  Square, Trash2, X, AlertCircle, CheckCircle2, SlidersHorizontal, Calendar, Clock,
  Upload, FileUp, Download
} from 'lucide-react';
import { Job, Team, LeaveRecord, JobTypeId, IncentiveRules } from '../types';
import { JOB_TYPES, TIME_SLOTS, DEFAULT_TIME_SLOT } from '../data/initialData';

interface JobManagementProps {
  jobs: Job[];
  teams: Team[];
  leaves: LeaveRecord[];
  rules?: IncentiveRules;
  onAddJob: (jobData: Partial<Job>) => void;
  onBatchAddJobs?: (importedJobs: Partial<Job>[], updatedTeams?: Team[]) => void;
  onUpdateJob: (id: string, field: keyof Job, value: any) => void;
  onDeleteJob: (id: string) => void;
  onMoveJob: (id: string, direction: -1 | 1) => void;
  onToggleCheck: (id: string, currentStatus: boolean) => void;
  onExportCSV: () => void;
  themeColor: string;
  themeTextColor: string;
  periodStart: string;
  periodEnd: string;
  jobSortOrder: 'asc' | 'desc' | 'manual';
  setJobSortOrder: (order: 'asc' | 'desc' | 'manual') => void;
}

export const JobManagement: React.FC<JobManagementProps> = ({
  jobs,
  teams,
  leaves,
  rules,
  onAddJob,
  onBatchAddJobs,
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
  const availableJobTypes = rules?.customJobTypes && rules.customJobTypes.length > 0
    ? rules.customJobTypes
    : JOB_TYPES;

  const getJobTypeInfo = (typeId: string) => {
    return availableJobTypes.find(t => t.id === typeId) || JOB_TYPES.find(t => t.id === typeId);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [filterByPeriod, setFilterByPeriod] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // CSV Import State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFileName, setImportFileName] = useState('');
  const [importPreviewJobs, setImportPreviewJobs] = useState<Partial<Job>[]>([]);
  const [pendingUpdatedTeams, setPendingUpdatedTeams] = useState<Team[] | null>(null);

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

  // --- CSV Import Utilities ---
  const parseCSVText = (text: string): string[][] => {
    const lines: string[][] = [];
    let currentRow: string[] = [];
    let currentVal = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentVal += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentVal.trim());
        currentVal = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') i++;
        currentRow.push(currentVal.trim());
        if (currentRow.some(c => c.length > 0)) lines.push(currentRow);
        currentRow = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    if (currentVal.length > 0 || currentRow.length > 0) {
      currentRow.push(currentVal.trim());
      if (currentRow.some(c => c.length > 0)) lines.push(currentRow);
    }
    return lines;
  };

  const normalizeDate = (dateStr: string, fallback: string): string => {
    if (!dateStr) return fallback;
    const s = dateStr.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const dmY = s.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);
    if (dmY) {
      const day = dmY[1].padStart(2, '0');
      const month = dmY[2].padStart(2, '0');
      const year = dmY[3];
      return `${year}-${month}-${day}`;
    }
    return s || fallback;
  };

  const matchJobType = (typeStr: string): JobTypeId => {
    if (!typeStr) return 'install';
    const s = typeStr.trim();

    if (s.includes('บันไดสูง')) return 'install_high';
    if (s.includes('ติดตั้ง') && s.includes('นั่งร้าน')) return 'install_scaffold';
    if (s.includes('แก้ไข') && s.includes('นั่งร้าน')) return 'fix_scaffold';
    if (/wall\s*linen/i.test(s) || s.includes('วอลล์ลิเนน')) return 'install_wall_linen';
    if (/wall\s*mural/i.test(s) || s.includes('วอลล์มิวรัล')) return 'install_wall_mural';
    if (s.includes('วัดพื้นที่')) return 'measure';
    if (s.includes('แก้ไขซ้ำ') || s.includes('ไม่คิดค่า')) return 'fix_free';
    if (s.includes('แก้ไข')) return 'fix';
    if (s.includes('เดินทางไป')) return 'travel_go';
    if (s.includes('เดินทางกลับ')) return 'travel_back';
    if (s.includes('ติดตั้ง')) return 'install';

    return 'install';
  };

  const matchTechnicians = (techText: string, teamList: Team[]): string[] => {
    if (!techText) return [];
    const allMembers = (teamList || []).flatMap(t => t.members || []);
    
    // Split by commas, slashes, pluses, or Thai conjunctions
    const rawParts = techText.split(/[,/+]|\s+และ\s+/).map(s => s.trim()).filter(Boolean);
    const matchedIds: string[] = [];

    for (const part of rawParts) {
      const cleanPart = part.replace(/^ช่าง/, '').trim();
      if (!cleanPart) continue;

      let found = allMembers.find(
        m => m.name.trim() === part || m.name.replace(/^ช่าง/, '').trim() === cleanPart
      );

      if (!found && cleanPart.length >= 2) {
        found = allMembers.find(m => {
          const memberClean = m.name.replace(/^ช่าง/, '').trim();
          return memberClean.includes(cleanPart) || cleanPart.includes(memberClean);
        });
      }

      if (found && !matchedIds.includes(found.id)) {
        matchedIds.push(found.id);
      }
    }

    return matchedIds;
  };

  const handleDownloadTemplate = () => {
    const headers = "วันที่,ลูกค้า,สถานที่,Order No,เวลา,ประเภทงาน,จำนวนราง,ทีมช่าง,รายชื่อช่าง,ตรวจสอบ,ค่า Incentive\n";
    const exampleRows = [
      '2026-08-05,"คุณวสุ","พังงา","2600673/1",10.00 - 17.00,ติดตั้ง,5,"ช่างนาย, ช่างเซฟ",ยังไม่ตรวจ,500',
      '2026-08-04,"คุณกีรติ ณ ระนอง (พี)","สายไหม","2600689/1",15.30 - 17.00,ติดตั้ง,3,"ช่างเบนซ์",ยังไม่ตรวจ,250',
      '2026-08-04,"คุณสมเกียรติ","สุขุมวิท50","-",13.00 - 17.00,วัดพื้นที่,30,"ช่างเบนซ์, ช่างกี้",ยังไม่ตรวจ,500'
    ].join('\n');

    const blob = new Blob(['\uFEFF' + headers + exampleRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'curtain_jobs_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const computeIncentiveForPreview = (job: Partial<Job>, matchedTechCount: number) => {
    const type = job.type || 'install';
    const rails = job.rails || 0;
    const r = rules || { baseTechPay: 250, freeRailsThreshold: 10, extraRailRate: 20, measureTechPay: 250, highLadderBonus: 100, scaffoldBonus: 200, wallLinenSqmRate: 50, wallMuralSqmRate: 75 };

    if (matchedTechCount === 0) return 0;
    if (type === 'measure') return (r.measureTechPay || 250) * matchedTechCount;
    if (type === 'install_wall_linen') return rails * (r.wallLinenSqmRate ?? 50);
    if (type === 'install_wall_mural') return rails * (r.wallMuralSqmRate ?? 75);
    if (['travel_go', 'travel_back', 'fix_free'].includes(type)) return 0;

    const basePay = (r.baseTechPay || 250) * matchedTechCount;
    const extraRails = rails > (r.freeRailsThreshold || 10) ? (rails - (r.freeRailsThreshold || 10)) * (r.extraRailRate || 20) : 0;
    let specialBonus = 0;
    if (type === 'install_high') specialBonus = r.highLadderBonus || 100;
    if (type === 'install_scaffold' || type === 'fix_scaffold') specialBonus = r.scaffoldBonus || 200;

    return basePay + extraRails + specialBonus;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = parseCSVText(text);
      if (lines.length === 0) return;

      let dateIdx = 0;
      let customerIdx = 1;
      let locationIdx = 2;
      let orderNoIdx = 3;
      let timeSlotIdx = 4;
      let typeIdx = 5;
      let railsIdx = 6;
      let teamListIdx = 7;
      let techListIdx = 8;
      let checkedIdx = 9;

      const firstRow = lines[0].map(h => h.toLowerCase().trim());
      let hasHeader = false;

      firstRow.forEach((h, i) => {
        if (h.includes('วัน')) { dateIdx = i; hasHeader = true; }
        else if (h.includes('ลูกค้า')) { customerIdx = i; hasHeader = true; }
        else if (h.includes('สถานที่')) { locationIdx = i; hasHeader = true; }
        else if (h.includes('order')) { orderNoIdx = i; hasHeader = true; }
        else if (h.includes('เวลา')) { timeSlotIdx = i; hasHeader = true; }
        else if (h.includes('ประเภท')) { typeIdx = i; hasHeader = true; }
        else if (h.includes('ราง') || h.includes('จำนวน')) { railsIdx = i; hasHeader = true; }
        else if (h.includes('รายชื่อช่าง') || h.includes('ช่าง')) { techListIdx = i; hasHeader = true; }
        else if (h.includes('ทีม')) { teamListIdx = i; hasHeader = true; }
        else if (h.includes('ตรวจ')) { checkedIdx = i; hasHeader = true; }
      });

      const dataRows = hasHeader ? lines.slice(1) : lines;
      const parsedJobs: Partial<Job>[] = [];

      let currentTeamsState = [...(teams || [])];
      let teamsWereModified = false;

      const matchOrAddTech = (rawName: string): string | null => {
        const cleanName = rawName.replace(/^ช่าง/, '').trim();
        if (!cleanName) return null;

        // Search in existing teams
        const allMembers = currentTeamsState.flatMap(t => t.members || []);
        let found = allMembers.find(
          m => m.name.trim() === rawName.trim() || m.name.replace(/^ช่าง/, '').trim() === cleanName
        );

        if (!found && cleanName.length >= 2) {
          found = allMembers.find(m => {
            const mClean = m.name.replace(/^ช่าง/, '').trim();
            return mClean.includes(cleanName) || cleanName.includes(mClean);
          });
        }

        if (found) return found.id;

        // Auto-create missing technician and add to first team
        teamsWereModified = true;
        const newTechId = `m-imp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const fullTechName = rawName.trim().startsWith('ช่าง') ? rawName.trim() : `ช่าง${rawName.trim()}`;
        const newMember = { id: newTechId, name: fullTechName, joinDate: '2020-01-01' };

        if (currentTeamsState.length > 0) {
          currentTeamsState = currentTeamsState.map((t, idx) => {
            if (idx === 0) {
              return { ...t, members: [...(t.members || []), newMember] };
            }
            return t;
          });
        } else {
          currentTeamsState = [{
            id: 't-imp-1',
            name: 'ทีมช่างทั่วไป',
            members: [newMember]
          }];
        }

        return newTechId;
      };

      dataRows.forEach(row => {
        if (!row || row.length < 2) return;
        const rawDate = row[dateIdx] || '';
        const dateStr = normalizeDate(rawDate, periodStart);
        const customer = row[customerIdx] || '';
        const location = row[locationIdx] || '';
        
        let rawOrderNo = (row[orderNoIdx] || '').trim();
        if (rawOrderNo === '-' || !rawOrderNo) rawOrderNo = '-';
        else rawOrderNo = rawOrderNo.toUpperCase();

        const timeSlot = row[timeSlotIdx] || DEFAULT_TIME_SLOT;
        const type = matchJobType(row[typeIdx] || '');
        const rails = parseFloat(row[railsIdx]) || 0;

        const rawTechText = (row[techListIdx] || '') + ' ' + (row[teamListIdx] || '');
        const techParts = rawTechText.split(/[,/+]|\s+และ\s+/).map(s => s.trim()).filter(Boolean);
        const selectedTechs: string[] = [];

        techParts.forEach(part => {
          const tid = matchOrAddTech(part);
          if (tid && !selectedTechs.includes(tid)) {
            selectedTechs.push(tid);
          }
        });

        const rawChecked = (row[checkedIdx] || '').trim();
        const isChecked = rawChecked === 'ตรวจแล้ว' || rawChecked === 'ตรวจสอบแล้ว' || rawChecked === 'true';

        parsedJobs.push({
          date: dateStr,
          customer,
          location,
          orderNo: rawOrderNo,
          timeSlot,
          type,
          rails,
          selectedTechs,
          isChecked
        });
      });

      if (teamsWereModified) {
        setPendingUpdatedTeams(currentTeamsState);
      } else {
        setPendingUpdatedTeams(null);
      }

      setImportPreviewJobs(parsedJobs);
      setShowImportModal(true);

      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsText(file, 'UTF-8');
  };

  const handleConfirmImport = () => {
    if (importPreviewJobs.length > 0 && onBatchAddJobs) {
      onBatchAddJobs(importPreviewJobs, pendingUpdatedTeams || undefined);
    }
    setShowImportModal(false);
    setImportPreviewJobs([]);
    setImportFileName('');
    setPendingUpdatedTeams(null);
  };

  const displayJobs = React.useMemo(() => {
    const list = jobs.filter(j => {
      const inPeriod = !filterByPeriod || !j.date || (j.date >= periodStart && j.date <= periodEnd);
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        (j.customer || '').toLowerCase().includes(q) ||
        (j.orderNo || '').toLowerCase().includes(q) ||
        (j.location || '').toLowerCase().includes(q) ||
        (j.date || '').includes(q);
      return inPeriod && matchesSearch;
    });

    if (jobSortOrder === 'desc') {
      return [...list].sort((a, b) => {
        const dateDiff = (b.date || '').localeCompare(a.date || '');
        if (dateDiff !== 0) return dateDiff;
        const timeDiff = (b.timeSlot || '').localeCompare(a.timeSlot || '');
        if (timeDiff !== 0) return timeDiff;
        return (b.orderIndex || 0) - (a.orderIndex || 0);
      });
    } else if (jobSortOrder === 'asc') {
      return [...list].sort((a, b) => {
        const dateDiff = (a.date || '').localeCompare(b.date || '');
        if (dateDiff !== 0) return dateDiff;
        const timeDiff = (a.timeSlot || '').localeCompare(b.timeSlot || '');
        if (timeDiff !== 0) return timeDiff;
        return (a.orderIndex || 0) - (b.orderIndex || 0);
      });
    } else {
      // 'manual': strictly by orderIndex descending (Row 1 on top)
      return [...list].sort((a, b) => (b.orderIndex || 0) - (a.orderIndex || 0));
    }
  }, [jobs, filterByPeriod, periodStart, periodEnd, searchQuery, jobSortOrder]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
      {/* Header Bar */}
      <div className="p-4 border-b border-gray-200 bg-gray-50/80 flex flex-wrap justify-between items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-bold text-gray-800 text-base">รายการบันทึกงานติดตั้งผ้าม่าน</h2>
          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-semibold">
            {displayJobs.length} งาน
          </span>
          <button
            onClick={() => setFilterByPeriod(!filterByPeriod)}
            className={`text-xs px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1.5 transition-colors ${
              filterByPeriod
                ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200'
            }`}
            title="คลิกเพื่อสลับการกรองแสดงเฉพาะในรอบคำนวณ"
          >
            <Calendar size={13} />
            <span>{filterByPeriod ? `รอบ: ${periodStart} ถึง ${periodEnd}` : 'แสดงทุกรอบคำนวณ'}</span>
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-2xl justify-end">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[180px]">
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
            className="border border-gray-200 rounded-xl text-xs px-2.5 py-1.5 bg-white text-gray-700 font-medium focus:outline-none shadow-2xs"
            value={jobSortOrder}
            onChange={e => setJobSortOrder(e.target.value as 'asc' | 'desc' | 'manual')}
          >
            <option value="manual">เรียง: ตามลำดับนำเข้า / กำหนดเอง</option>
            <option value="desc">เรียง: วันที่ล่าสุดขึ้นก่อน</option>
            <option value="asc">เรียง: วันที่เก่าสุดขึ้นก่อน</option>
          </select>

          {/* Action Buttons Group on the same line */}
          <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,text/csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
              title="นำเข้าข้อมูลงานจากไฟล์ CSV"
            >
              <Upload size={14} />
              <span>นำเข้า CSV</span>
            </button>

            <button
              onClick={onExportCSV}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
              title="ส่งออกรายการงานเป็นไฟล์ CSV"
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
      </div>

      {/* Main Table Container with smooth vertical and horizontal scrolling */}
      <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-220px)] rounded-b-2xl">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100/95 backdrop-blur-xs text-[11px] text-gray-600 font-bold uppercase tracking-wider border-b border-gray-200 sticky top-0 z-10 shadow-2xs">
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
            {displayJobs.map((job, index) => {
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
                      {availableJobTypes.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Rails / Units count */}
                  {(() => {
                    const currentTypeInfo = getJobTypeInfo(job.type);
                    const isSqmUnit = currentTypeInfo?.unitType === 'sqm' || job.type === 'install_wall_linen' || job.type === 'install_wall_mural';
                    const unitLabel = currentTypeInfo?.unitLabel || (isSqmUnit ? 'ตร.ม.' : currentTypeInfo?.unitType === 'rails' ? 'ราง' : currentTypeInfo?.unitType === 'fixed' ? 'งาน' : '-');

                    return (
                      <td className="p-3 align-top text-center">
                        <input
                          type="number"
                          min={0}
                          step={isSqmUnit ? "0.1" : "1"}
                          value={job.rails}
                          onWheel={e => e.currentTarget.blur()}
                          onChange={e => {
                            const raw = parseFloat(e.target.value);
                            if (isNaN(raw)) {
                              onUpdateJob(job.id, 'rails', 0);
                            } else {
                              const val = isSqmUnit ? Math.round(raw * 10) / 10 : Math.round(raw);
                              onUpdateJob(job.id, 'rails', val);
                            }
                          }}
                          className="border border-gray-200 rounded-lg p-1.5 w-16 text-center text-xs font-bold bg-white"
                        />
                        <div className="text-[10px] text-gray-400 mt-0.5 font-medium">
                          {unitLabel}
                        </div>
                      </td>
                    );
                  })()}

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
                    <div className="flex flex-col items-center gap-0.5">
                      <button
                        onClick={() => onMoveJob(job.id, -1)}
                        disabled={index === 0}
                        className={`p-0.5 rounded transition-colors ${
                          index === 0
                            ? 'text-gray-200 cursor-not-allowed'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                        title="เลื่อนขึ้นด้านบน"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        onClick={() => onMoveJob(job.id, 1)}
                        disabled={index === displayJobs.length - 1}
                        className={`p-0.5 rounded transition-colors ${
                          index === displayJobs.length - 1
                            ? 'text-gray-200 cursor-not-allowed'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                        title="เลื่อนลงด้านล่าง"
                      >
                        <ArrowDown size={13} />
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

            {displayJobs.length === 0 && (
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
                    {availableJobTypes.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                {(() => {
                  const currentSelectedType = getJobTypeInfo(newType);
                  const isSqmUnit = currentSelectedType?.unitType === 'sqm' || newType === 'install_wall_linen' || newType === 'install_wall_mural';
                  const unitLabel = currentSelectedType?.unitLabel || (isSqmUnit ? 'ตร.ม.' : currentSelectedType?.unitType === 'rails' ? 'ราง' : currentSelectedType?.unitType === 'fixed' ? 'งาน' : '-');

                  return (
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">
                        จำนวน ({unitLabel}):
                      </label>
                      <input
                        type="number"
                        min={0}
                        step={isSqmUnit ? "0.1" : "1"}
                        className="w-full border rounded-xl p-2 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                        value={newRails}
                        onChange={e => {
                          const raw = parseFloat(e.target.value);
                          if (isNaN(raw)) {
                            setNewRails(0);
                          } else {
                            const val = isSqmUnit ? Math.round(raw * 10) / 10 : Math.round(raw);
                            setNewRails(val);
                          }
                        }}
                      />
                      {currentSelectedType?.description && (
                        <p className="text-[10px] text-emerald-600 font-semibold mt-1">
                          * {currentSelectedType.description}
                        </p>
                      )}
                    </div>
                  );
                })()}
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

      {/* CSV Import Preview Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100">
            {/* Header */}
            <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                  <Upload size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-base">
                    ตรวจสอบข้อมูลก่อนนำเข้า CSV (Preview Import)
                  </h3>
                  <p className="text-xs text-gray-500">
                    ไฟล์: <span className="font-semibold text-gray-700">{importFileName}</span> | พบทั้งหมด{' '}
                    <span className="font-bold text-blue-600">{importPreviewJobs.length}</span> รายการ
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 font-semibold"
                  title="ดาวน์โหลดไฟล์ตัวอย่าง Template CSV"
                >
                  <Download size={13} />
                  <span>โหลด Template CSV</span>
                </button>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Table Preview Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {importPreviewJobs.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                  ไม่พบข้อมูลงานที่ถูกต้องในไฟล์ CSV กรุณาตรวจสอบโครงสร้างไฟล์ตาม Template
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-gray-100 text-gray-600 font-bold border-b border-gray-200">
                      <tr>
                        <th className="p-2.5 text-center w-8">#</th>
                        <th className="p-2.5 w-24">วันที่</th>
                        <th className="p-2.5 w-28">Order No</th>
                        <th className="p-2.5">ลูกค้า & สถานที่</th>
                        <th className="p-2.5 w-28">ประเภทงาน</th>
                        <th className="p-2.5 text-center w-16">จำนวน</th>
                        <th className="p-2.5">ทีมช่างที่แมตช์ได้</th>
                        <th className="p-2.5 text-right w-24">ค่า Incentive</th>
                        <th className="p-2.5 text-center w-20">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {importPreviewJobs.map((job, idx) => {
                        const typeInfo = JOB_TYPES.find(t => t.id === job.type);
                        const currentTeamsForLookup = pendingUpdatedTeams || teams || [];
                        const matchedMembers = currentTeamsForLookup
                          .flatMap(t => t.members || [])
                          .filter(m => (job.selectedTechs || []).includes(m.id));
                        const estIncentive = computeIncentiveForPreview(job, matchedMembers.length);

                        return (
                          <tr key={idx} className="hover:bg-blue-50/40">
                            <td className="p-2.5 text-center font-mono text-gray-400">{idx + 1}</td>
                            <td className="p-2.5 whitespace-nowrap font-medium text-gray-700">{job.date}</td>
                            <td className="p-2.5 whitespace-nowrap font-bold text-blue-700">{job.orderNo}</td>
                            <td className="p-2.5">
                              <div className="font-semibold text-gray-800">{job.customer || '-'}</div>
                              <div className="text-[10px] text-gray-500">{job.location || '-'}</div>
                            </td>
                            <td className="p-2.5 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                                {typeInfo?.label || job.type}
                              </span>
                            </td>
                            <td className="p-2.5 text-center font-bold text-gray-800">{job.rails}</td>
                            <td className="p-2.5">
                              {matchedMembers.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {matchedMembers.map(m => (
                                    <span key={m.id} className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-medium">
                                      {m.name}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-amber-600 text-[10px] font-medium italic">
                                  ยังไม่ได้แมตช์ช่าง
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-right font-black text-emerald-700">
                              ฿{estIncentive.toLocaleString()}
                            </td>
                            <td className="p-2.5 text-center">
                              {job.isChecked ? (
                                <span className="text-emerald-600 font-bold text-[10px]">ตรวจแล้ว</span>
                              ) : (
                                <span className="text-gray-400 text-[10px]">ยังไม่ตรวจ</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                * ตรวจสอบความถูกต้อง แล้วกดปุ่มยืนยันเพื่อบันทึกเข้าสู่ระบบ
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-xl font-semibold text-xs text-gray-700 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={importPreviewJobs.length === 0}
                  style={{ backgroundColor: themeColor, color: themeTextColor }}
                  className="px-5 py-2 rounded-xl font-bold text-xs shadow-md hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CheckCircle2 size={15} />
                  <span>ยืนยันนำเข้าข้อมูล {importPreviewJobs.length} รายการ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
