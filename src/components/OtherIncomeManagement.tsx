import React, { useState, useMemo } from 'react';
import { 
  Coins, Plus, Search, Filter, Calendar, Edit3, Trash2, X, Check, 
  AlertCircle, DollarSign, Wrench, FileText, Info, ArrowRight, User
} from 'lucide-react';
import { Team, PayPeriod, OtherIncomeRecord, OtherIncomeCategory, AllowanceType } from '../types';
import { formatDateTH, getTechOfficialName, isMemberActiveInPeriod } from '../utils/calculator';
import { getAllowancePeriodForDate, getAllowancePeriodMatchingCurtainPeriod, AllowancePeriod } from '../utils/periodUtils';

interface OtherIncomeManagementProps {
  otherIncomes: OtherIncomeRecord[];
  teams: Team[];
  curtainPeriod: PayPeriod;
  onAddOtherIncome: (record: Omit<OtherIncomeRecord, 'id' | 'createdAt'>) => void;
  onUpdateOtherIncome: (id: string, record: Partial<OtherIncomeRecord>) => void;
  onDeleteOtherIncome: (id: string) => void;
  onDeleteMultipleOtherIncomes?: (ids: string[]) => void;
  themeColor: string;
  themeTextColor: string;
}

export const OtherIncomeManagement: React.FC<OtherIncomeManagementProps> = ({
  otherIncomes,
  teams,
  curtainPeriod,
  onAddOtherIncome,
  onUpdateOtherIncome,
  onDeleteOtherIncome,
  onDeleteMultipleOtherIncomes,
  themeColor,
  themeTextColor
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'all' | OtherIncomeCategory>('all');
  const [selectedTechFilter, setSelectedTechFilter] = useState<string>('all');
  const [viewScope, setViewScope] = useState<'period' | 'all'>('period');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<OtherIncomeRecord | null>(null);

  // Deletion Confirmation & Selection States (In-App Dialog, no window.confirm)
  const [itemToDelete, setItemToDelete] = useState<OtherIncomeRecord | null>(null);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>([]);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Form State
  const [formTechId, setFormTechId] = useState('');
  const [formDate, setFormDate] = useState(curtainPeriod?.start || new Date().toISOString().slice(0, 10));
  const [formCategory, setFormCategory] = useState<OtherIncomeCategory>('allowance');
  const [formAllowanceType, setFormAllowanceType] = useState<AllowanceType>('upcountry_300');
  const [formAmount, setFormAmount] = useState<number>(300);
  const [formTitle, setFormTitle] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formError, setFormError] = useState('');

  // Allowance period corresponding to the current curtain period
  const matchingAllowancePeriod = useMemo(() => {
    return getAllowancePeriodMatchingCurtainPeriod(curtainPeriod);
  }, [curtainPeriod]);

  // List of all active technicians in current period
  const allActiveTechs = useMemo(() => {
    return (teams || []).flatMap(team => 
      (team.members || [])
        .filter(m => isMemberActiveInPeriod(m, curtainPeriod?.start, curtainPeriod?.end))
        .map(m => ({
          ...m,
          teamName: team.name,
          officialName: getTechOfficialName(m)
        }))
    );
  }, [teams, curtainPeriod]);

  // Map of tech ID to tech details (including historic/transferred)
  const techMap = useMemo(() => {
    const map = new Map<string, { officialName: string; employeeId?: string; teamName: string }>();
    (teams || []).forEach(team => {
      (team.members || []).forEach(m => {
        map.set(m.id, {
          officialName: getTechOfficialName(m),
          employeeId: m.employeeId,
          teamName: team.name
        });
      });
    });
    return map;
  }, [teams]);

  // Computed cycle of current form date
  const previewAllowancePeriod: AllowancePeriod = useMemo(() => {
    return getAllowancePeriodForDate(formDate);
  }, [formDate]);

  // Open modal for new record
  const handleOpenAddModal = () => {
    setEditingRecord(null);
    setFormTechId(allActiveTechs[0]?.id || '');
    setFormDate(curtainPeriod?.start || new Date().toISOString().slice(0, 10));
    setFormCategory('allowance');
    setFormAllowanceType('upcountry_300');
    setFormAmount(300);
    setFormTitle('เบี้ยเลี้ยงต่างจังหวัด');
    setFormNote('');
    setFormError('');
    setIsModalOpen(true);
  };

  // Open modal for editing record
  const handleOpenEditModal = (rec: OtherIncomeRecord) => {
    setEditingRecord(rec);
    setFormTechId(rec.techId);
    setFormDate(rec.date);
    setFormCategory(rec.category);
    setFormAllowanceType(rec.allowanceType || 'upcountry_300');
    setFormAmount(rec.amount);
    setFormTitle(rec.title || '');
    setFormNote(rec.note || '');
    setFormError('');
    setIsModalOpen(true);
  };

  // Handle Category Change in form
  const handleCategoryChange = (cat: OtherIncomeCategory) => {
    setFormCategory(cat);
    if (cat === 'allowance') {
      const isAbroad = formAllowanceType === 'abroad_800';
      setFormAmount(isAbroad ? 800 : 300);
      setFormTitle(isAbroad ? 'เบี้ยเลี้ยงต่างประเทศ' : 'เบี้ยเลี้ยงต่างจังหวัด');
    } else if (cat === 'ac_install') {
      if (editingRecord && editingRecord.category === 'ac_install') {
        setFormAmount(editingRecord.amount);
        setFormTitle(editingRecord.title || 'ค่าติดตั้งแอร์');
      } else {
        setFormAmount(500);
        setFormTitle('ค่าติดตั้งแอร์');
      }
    } else {
      if (editingRecord && editingRecord.category === 'other') {
        setFormAmount(editingRecord.amount);
        setFormTitle(editingRecord.title || '');
      } else {
        setFormAmount(300);
        setFormTitle('');
      }
    }
  };

  // Handle Allowance Type Change in form
  const handleAllowanceTypeChange = (atype: AllowanceType) => {
    setFormAllowanceType(atype);
    if (atype === 'upcountry_300') {
      setFormAmount(300);
      setFormTitle('เบี้ยเลี้ยงต่างจังหวัด');
    } else {
      setFormAmount(800);
      setFormTitle('เบี้ยเลี้ยงต่างประเทศ');
    }
  };

  // Handle Save Form
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTechId) {
      setFormError('กรุณาเลือกช่างผู้ปฏิบัติงาน');
      return;
    }
    if (!formDate) {
      setFormError('กรุณาระบุวันที่');
      return;
    }
    if (formAmount <= 0) {
      setFormError('กรุณาระบุยอดเงินที่มากกว่า 0 บาท');
      return;
    }
    if (formCategory === 'other' && !formTitle.trim()) {
      setFormError('กรุณาระบุรายละเอียดสำหรับค่าอื่นๆ');
      return;
    }

    if (editingRecord) {
      onUpdateOtherIncome(editingRecord.id, {
        techId: formTechId,
        date: formDate,
        category: formCategory,
        allowanceType: formCategory === 'allowance' ? formAllowanceType : undefined,
        amount: Number(formAmount),
        title: formTitle.trim() || (formCategory === 'ac_install' ? 'ค่าติดตั้งแอร์' : 'ค่าอื่นๆ'),
        note: formNote.trim() || undefined,
        updatedAt: new Date().toISOString()
      });
    } else {
      onAddOtherIncome({
        techId: formTechId,
        date: formDate,
        category: formCategory,
        allowanceType: formCategory === 'allowance' ? formAllowanceType : undefined,
        amount: Number(formAmount),
        title: formTitle.trim() || (formCategory === 'ac_install' ? 'ค่าติดตั้งแอร์' : 'ค่าอื่นๆ'),
        note: formNote.trim() || undefined
      });
    }

    setIsModalOpen(false);
  };

  // Filter records based on view scope, category, tech, search
  const filteredRecords = useMemo(() => {
    return otherIncomes.filter(rec => {
      // 1. Period Scope Filter
      if (viewScope === 'period') {
        if (rec.category === 'allowance') {
          // Allowance uses 21st-20th cycle matching current curtain period
          if (rec.date < matchingAllowancePeriod.start || rec.date > matchingAllowancePeriod.end) {
            return false;
          }
        } else {
          // AC install and other income follow the curtain period
          if (curtainPeriod?.start && curtainPeriod?.end) {
            if (rec.date < curtainPeriod.start || rec.date > curtainPeriod.end) {
              return false;
            }
          }
        }
      }

      // 2. Category Filter
      if (selectedCategoryFilter !== 'all' && rec.category !== selectedCategoryFilter) {
        return false;
      }

      // 3. Technician Filter
      if (selectedTechFilter !== 'all' && rec.techId !== selectedTechFilter) {
        return false;
      }

      // 4. Search Query
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const tech = techMap.get(rec.techId);
        const nameMatch = tech?.officialName?.toLowerCase().includes(query);
        const empIdMatch = tech?.employeeId?.toLowerCase().includes(query);
        const titleMatch = rec.title?.toLowerCase().includes(query);
        const noteMatch = rec.note?.toLowerCase().includes(query);
        if (!nameMatch && !empIdMatch && !titleMatch && !noteMatch) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [
    otherIncomes, 
    viewScope, 
    matchingAllowancePeriod, 
    curtainPeriod, 
    selectedCategoryFilter, 
    selectedTechFilter, 
    searchTerm, 
    techMap
  ]);

  // Statistics for KPI Cards (based on current period or all records)
  const stats = useMemo(() => {
    const list = filteredRecords;
    let totalAmount = 0;
    let allowanceCount = 0;
    let allowanceAmount = 0;
    let acCount = 0;
    let acAmount = 0;
    let otherCount = 0;
    let otherAmount = 0;

    list.forEach(r => {
      totalAmount += r.amount || 0;
      if (r.category === 'allowance') {
        allowanceCount += 1;
        allowanceAmount += r.amount || 0;
      } else if (r.category === 'ac_install') {
        acCount += 1;
        acAmount += r.amount || 0;
      } else {
        otherCount += 1;
        otherAmount += r.amount || 0;
      }
    });

    return {
      totalAmount,
      totalCount: list.length,
      allowanceCount,
      allowanceAmount,
      acCount,
      acAmount,
      otherCount,
      otherAmount
    };
  }, [filteredRecords]);

  // Selected items total amount
  const selectedTotalAmount = useMemo(() => {
    const idSet = new Set(selectedRecordIds);
    return otherIncomes.filter(r => idSet.has(r.id)).reduce((sum, r) => sum + (r.amount || 0), 0);
  }, [selectedRecordIds, otherIncomes]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Explanation */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border border-amber-200/80 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div 
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
              style={{ backgroundColor: themeColor, color: themeTextColor }}
            >
              <Coins size={22} />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
                <span>จัดการรายได้อื่นๆ ของช่าง (Other Incomes & Allowances)</span>
                <span className="bg-amber-100 text-amber-900 text-[11px] font-bold px-2 py-0.5 rounded-full border border-amber-300">
                  เฉพาะรายงานรายบุคคล
                </span>
              </h2>
              <div className="text-xs text-gray-600 mt-1 leading-relaxed space-y-1">
                <p className="flex items-center gap-1.5 font-medium text-gray-700">
                  <Info size={14} className="text-amber-600 shrink-0" />
                  <span>
                    <strong>ค่าเบี้ยเลี้ยง:</strong> รอบคำนวณทุกวันที่ 21 ถึง 20 ของเดือนถัดไป (เช่น รอบ 21/08/2026 - 20/09/2026 คือรอบคำนวณเดือนกันยายน 2026)
                  </span>
                </p>
                <p className="flex items-center gap-1.5 font-medium text-gray-700">
                  <Info size={14} className="text-blue-600 shrink-0" />
                  <span>
                    <strong>ค่าติดตั้งแอร์ & ค่าอื่นๆ:</strong> บันทึกตามวันที่ และรอบคำนวณตามรอบติดตั้งผ้าม่าน ({curtainPeriod?.name || 'รอบปัจจุบัน'})
                  </span>
                </p>
                <p className="text-[11px] text-gray-500 italic">
                  * หมายเหตุ: ยอดรายได้นี้จะไม่นำไปแสดงในหน้าสรุปผ้าม่านหรือแดชบอร์ด โดยจะแสดงเฉพาะในหน้ารายงาน <strong>"ค่าตอบแทนรวมรายบุคคล"</strong> เท่านั้น
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
            <button
              onClick={handleOpenAddModal}
              style={{ backgroundColor: themeColor, color: themeTextColor }}
              className="px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm hover:opacity-90 transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>เพิ่มรายได้อื่นๆ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Other Income */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">รวมรายได้อื่นๆ ทั้งสิ้น</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 tracking-tight">
            ฿{Math.round(stats.totalAmount).toLocaleString()}
          </div>
          <div className="text-[11px] text-gray-500 mt-1 font-medium">
            ทั้งหมด {stats.totalCount} รายการ ({viewScope === 'period' ? 'ในรอบคำนวณนี้' : 'ข้อมูลทั้งหมด'})
          </div>
        </div>

        {/* Per Diem (ค่าเบี้ยเลี้ยง) */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">ค่าเบี้ยเลี้ยง (21-20)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Calendar size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-900 tracking-tight">
            ฿{Math.round(stats.allowanceAmount).toLocaleString()}
          </div>
          <div className="text-[11px] text-amber-700 mt-1 font-medium">
            รวม {stats.allowanceCount} วัน ({matchingAllowancePeriod.name})
          </div>
        </div>

        {/* AC Install (ค่าติดตั้งแอร์) */}
        <div className="bg-white p-4 rounded-2xl border border-blue-200/80 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">ค่าติดตั้งแอร์</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Wrench size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-900 tracking-tight">
            ฿{Math.round(stats.acAmount).toLocaleString()}
          </div>
          <div className="text-[11px] text-blue-700 mt-1 font-medium">
            รวม {stats.acCount} รายการ (ตามรอบผ้าม่าน)
          </div>
        </div>

        {/* Other (ค่าอื่นๆ) */}
        <div className="bg-white p-4 rounded-2xl border border-purple-200/80 shadow-2xs hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">ค่าอื่นๆ ระบุเอง</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              <FileText size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-900 tracking-tight">
            ฿{Math.round(stats.otherAmount).toLocaleString()}
          </div>
          <div className="text-[11px] text-purple-700 mt-1 font-medium">
            รวม {stats.otherCount} รายการ (ตามรอบผ้าม่าน)
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: View Scope Toggles */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setViewScope('period')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewScope === 'period'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              รอบคำนวณปัจจุบัน ({curtainPeriod?.name || 'รอบนี้'})
            </button>
            <button
              onClick={() => setViewScope('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewScope === 'all'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              ดูข้อมูลทั้งหมดทุกรอบ ({otherIncomes.length})
            </button>
          </div>

          {/* Right: Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setSelectedCategoryFilter('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                selectedCategoryFilter === 'all'
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setSelectedCategoryFilter('allowance')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                selectedCategoryFilter === 'allowance'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              ค่าเบี้ยเลี้ยง (300/800)
            </button>
            <button
              onClick={() => setSelectedCategoryFilter('ac_install')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                selectedCategoryFilter === 'ac_install'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              ค่าติดตั้งแอร์
            </button>
            <button
              onClick={() => setSelectedCategoryFilter('other')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                selectedCategoryFilter === 'other'
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              ค่าอื่นๆ ระบุเอง
            </button>
          </div>
        </div>

        {/* Bottom Filter Row: Search & Tech Selector */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
          {/* Search box */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={15} />
            <input
              type="text"
              placeholder="ค้นหาชื่อช่าง, รหัสพนักงาน, รายละเอียด หรือหมายเหตุ..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Tech dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-600 whitespace-nowrap">ช่าง:</span>
            <select
              value={selectedTechFilter}
              onChange={e => setSelectedTechFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-gray-300 max-w-[240px]"
            >
              <option value="all">-- ช่างทุกคน ({allActiveTechs.length} คน) --</option>
              {allActiveTechs.map(tech => (
                <option key={tech.id} value={tech.id}>
                  {tech.employeeId ? `[${tech.employeeId}] ` : ''}{tech.officialName} ({tech.teamName})
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {(searchTerm || selectedCategoryFilter !== 'all' || selectedTechFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategoryFilter('all');
                setSelectedTechFilter('all');
              }}
              className="text-xs text-red-600 hover:text-red-700 font-bold px-2 py-1 rounded-lg hover:bg-red-50"
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>
      </div>

      {/* Bulk Selection Bar */}
      {selectedRecordIds.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-bold text-amber-950">
              เลือกแล้ว {selectedRecordIds.length} รายการ
            </span>
            <span className="text-amber-800">
              (ยอดรวม: <strong className="text-amber-950 font-black">฿{selectedTotalAmount.toLocaleString()}</strong>)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Trash2 size={13} />
              <span>ลบรายการที่เลือก ({selectedRecordIds.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedRecordIds([])}
              className="px-3 py-1.5 text-gray-600 hover:text-gray-900 font-semibold rounded-xl hover:bg-amber-100/70 transition-colors"
            >
              ยกเลิกการเลือก
            </button>
          </div>
        </div>
      )}

      {/* Records Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 font-bold">
                <th className="py-3 px-3 text-center w-10">
                  <input
                    type="checkbox"
                    className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
                    checked={filteredRecords.length > 0 && selectedRecordIds.length === filteredRecords.length}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedRecordIds(filteredRecords.map(r => r.id));
                      } else {
                        setSelectedRecordIds([]);
                      }
                    }}
                    title="เลือกทั้งหมด"
                  />
                </th>
                <th className="py-3 px-3 text-center w-12">ลำดับ</th>
                <th className="py-3 px-3 w-24">วันที่</th>
                <th className="py-3 px-3 text-center w-24">รหัสพนักงาน</th>
                <th className="py-3 px-3 w-48">ชื่อ-นามสกุล</th>
                <th className="py-3 px-3 w-28">สังกัดทีม</th>
                <th className="py-3 px-3 w-36">ประเภทรายได้</th>
                <th className="py-3 px-3">รายละเอียด / หมายเหตุ</th>
                <th className="py-3 px-3 w-44">รอบคำนวณ</th>
                <th className="py-3 px-3 text-right w-32">จำนวนเงิน</th>
                <th className="py-3 px-3 text-center w-20">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRecords.map((rec, idx) => {
                const tech = techMap.get(rec.techId);
                const recAllowancePeriod = getAllowancePeriodForDate(rec.date);
                const isSelected = selectedRecordIds.includes(rec.id);

                return (
                  <tr key={rec.id} className={`transition-colors ${isSelected ? 'bg-amber-50/50' : 'hover:bg-gray-50/80'}`}>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="checkbox"
                        className="rounded text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
                        checked={isSelected}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedRecordIds(prev => [...prev, rec.id]);
                          } else {
                            setSelectedRecordIds(prev => prev.filter(id => id !== rec.id));
                          }
                        }}
                      />
                    </td>
                    <td className="py-3 px-3 text-center text-gray-500 font-medium">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap font-medium text-gray-900">
                      {formatDateTH(rec.date)}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-gray-700">
                      {tech?.employeeId || '-'}
                    </td>
                    <td className="py-3 px-3 font-bold text-gray-900 whitespace-nowrap">
                      {tech?.officialName || 'ช่างที่ไม่พบในระบบ'}
                    </td>
                    <td className="py-3 px-3 text-gray-600 whitespace-nowrap">
                      {tech?.teamName || '-'}
                    </td>
                    <td className="py-3 px-3">
                      {rec.category === 'allowance' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          <Calendar size={12} className="text-amber-700" />
                          <span>{rec.allowanceType === 'abroad_800' ? 'เบี้ยเลี้ยงต่างประเทศ (800)' : 'เบี้ยเลี้ยงต่างจังหวัด (300)'}</span>
                        </span>
                      )}
                      {rec.category === 'ac_install' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                          <Wrench size={12} className="text-blue-700" />
                          <span>ค่าติดตั้งแอร์</span>
                        </span>
                      )}
                      {rec.category === 'other' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-300">
                          <FileText size={12} className="text-purple-700" />
                          <span>ค่าอื่นๆ ระบุเอง</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-gray-900">{rec.title || '-'}</div>
                      {rec.note && <div className="text-[11px] text-gray-500 mt-0.5">{rec.note}</div>}
                    </td>
                    <td className="py-3 px-3">
                      {rec.category === 'allowance' ? (
                        <div className="text-[11px] leading-tight">
                          <span className="font-bold text-amber-900">{recAllowancePeriod.name}</span>
                          <span className="block text-gray-500 text-[10px]">
                            ({formatDateTH(recAllowancePeriod.start)} - {formatDateTH(recAllowancePeriod.end)})
                          </span>
                        </div>
                      ) : (
                        <div className="text-[11px] leading-tight">
                          <span className="font-bold text-gray-800">{curtainPeriod?.name || 'รอบผ้าม่าน'}</span>
                          <span className="block text-gray-500 text-[10px]">
                            ({formatDateTH(curtainPeriod?.start || '')} - {formatDateTH(curtainPeriod?.end || '')})
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-sm text-emerald-800 whitespace-nowrap">
                      ฿{rec.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(rec)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="แก้ไข"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setItemToDelete(rec)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="ลบ"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Coins size={36} className="text-gray-300" />
                      <p className="text-sm font-bold text-gray-500">ไม่พบรายการรายได้อื่นๆ</p>
                      <p className="text-xs text-gray-400 max-w-sm">
                        ยังไม่มีรายการในเงื่อนไขการค้นหา หรือยังไม่ได้บันทึกค่าเบี้ยเลี้ยง/ติดตั้งแอร์/ค่าอื่นๆ
                      </p>
                      <button
                        onClick={handleOpenAddModal}
                        style={{ backgroundColor: themeColor, color: themeTextColor }}
                        className="mt-2 px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm hover:opacity-90"
                      >
                        <Plus size={14} />
                        <span>เพิ่มรายการแรก</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            {filteredRecords.length > 0 && (
              <tfoot className="bg-gray-50 border-t-2 border-gray-300 font-bold text-gray-900">
                <tr>
                  <td colSpan={8} className="py-3 px-3 text-right font-black">
                    รวมยอดเงินทั้งหมด ({filteredRecords.length} รายการ):
                  </td>
                  <td className="py-3 px-3 text-right font-black text-sm text-emerald-800">
                    ฿{Math.round(stats.totalAmount).toLocaleString()}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div 
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-bold shadow-2xs"
                  style={{ backgroundColor: themeColor, color: themeTextColor }}
                >
                  <Coins size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm md:text-base text-gray-900">
                    {editingRecord ? 'แก้ไขรายการรายได้อื่นๆ' : 'เพิ่มรายได้อื่นๆ ของช่าง'}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    เบี้ยเลี้ยง, ค่าติดตั้งแอร์ หรือค่าอื่นๆ ระบุเอง
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Technician Selector */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  1. เลือกช่างผู้ปฏิบัติงาน <span className="text-red-500">*</span>
                </label>
                <select
                  value={formTechId}
                  onChange={e => setFormTechId(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs font-bold focus:ring-2 focus:ring-gray-400"
                  required
                >
                  <option value="">-- กรุณาเลือกช่าง --</option>
                  {allActiveTechs.map(tech => (
                    <option key={tech.id} value={tech.id}>
                      {tech.employeeId ? `[${tech.employeeId}] ` : ''}{tech.officialName} (สังกัด: {tech.teamName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  2. วันที่ปฏิบัติงาน / วันที่มีค่าใช้จ่าย <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs font-bold focus:ring-2 focus:ring-gray-400"
                  required
                >
                </input>
              </div>

              {/* Category Selector */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1.5">
                  3. ประเภทรายได้ <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleCategoryChange('allowance')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                      formCategory === 'allowance'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    ค่าเบี้ยเลี้ยง
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCategoryChange('ac_install')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                      formCategory === 'ac_install'
                        ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    ค่าติดตั้งแอร์
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCategoryChange('other')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                      formCategory === 'other'
                        ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    ค่าอื่นๆ ระบุเอง
                  </button>
                </div>
              </div>

              {/* Category Specific Controls */}
              {formCategory === 'allowance' && (
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
                  <div>
                    <label className="text-xs font-bold text-amber-900 block mb-1">
                      เลือกรายการเบี้ยเลี้ยง (Dropdown):
                    </label>
                    <select
                      value={formAllowanceType}
                      onChange={e => handleAllowanceTypeChange(e.target.value as AllowanceType)}
                      className="w-full bg-white border border-amber-300 rounded-xl p-2.5 text-xs font-black text-amber-950 focus:ring-2 focus:ring-amber-400"
                    >
                      <option value="upcountry_300">เบี้ยเลี้ยงต่างจังหวัด (300 บาท/วัน)</option>
                      <option value="abroad_800">เบี้ยเลี้ยงต่างประเทศ (800 บาท/วัน)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold text-amber-900 bg-white p-2.5 rounded-xl border border-amber-200">
                    <span>ยอดเงินเบี้ยเลี้ยง:</span>
                    <span className="text-sm font-black text-emerald-800">฿{formAmount.toLocaleString()} บาท</span>
                  </div>

                  {/* Calculation Cycle Indicator */}
                  <div className="bg-amber-100/70 p-2.5 rounded-xl border border-amber-300 text-[11px] text-amber-950 space-y-0.5">
                    <div className="font-bold flex items-center gap-1.5">
                      <Calendar size={13} className="text-amber-800" />
                      <span>รอบคำนวณเบี้ยเลี้ยง (21 ถึง 20 เดือนถัดไป):</span>
                    </div>
                    <p className="font-black text-amber-900 pl-4">
                      {previewAllowancePeriod.name} ({formatDateTH(previewAllowancePeriod.start)} - {formatDateTH(previewAllowancePeriod.end)})
                    </p>
                  </div>
                </div>
              )}

              {formCategory === 'ac_install' && (
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-3">
                  <div>
                    <label className="text-xs font-bold text-blue-900 block mb-1">
                      ยอดเงินค่าติดตั้งแอร์ (บาท) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={formAmount || ''}
                      onChange={e => setFormAmount(parseFloat(e.target.value) || 0)}
                      placeholder="เช่น 500 หรือ 1200"
                      className="w-full bg-white border border-blue-300 rounded-xl p-2.5 text-xs font-black text-blue-950 focus:ring-2 focus:ring-blue-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-blue-900 block mb-1">
                      รายละเอียดงานติดตั้งแอร์ (ระบุเอง)
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={e => setFormTitle(e.target.value)}
                      placeholder="เช่น ติดตั้งแอร์ 1 เครื่อง โครงการมัณฑนา"
                      className="w-full bg-white border border-blue-300 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-400"
                    />
                  </div>

                  <div className="bg-blue-100/70 p-2 rounded-xl text-[11px] text-blue-900 font-semibold flex items-center gap-1.5">
                    <Info size={14} className="text-blue-700 shrink-0" />
                    <span>รอบคำนวณ: ตามรอบติดตั้งผ้าม่าน ({curtainPeriod?.name || 'รอบปัจจุบัน'})</span>
                  </div>
                </div>
              )}

              {formCategory === 'other' && (
                <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-3">
                  <div>
                    <label className="text-xs font-bold text-purple-900 block mb-1">
                      รายละเอียดรายการ (ระบุเอง) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={e => setFormTitle(e.target.value)}
                      placeholder="เช่น ค่าขนส่งพิเศษ, ค่าเก็บงานนอกรอบ, ค่าเดินทาง ฯลฯ"
                      className="w-full bg-white border border-purple-300 rounded-xl p-2.5 text-xs font-medium focus:ring-2 focus:ring-purple-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-purple-900 block mb-1">
                      ยอดเงิน (บาท) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={formAmount || ''}
                      onChange={e => setFormAmount(parseFloat(e.target.value) || 0)}
                      placeholder="ระบุจำนวนเงิน"
                      className="w-full bg-white border border-purple-300 rounded-xl p-2.5 text-xs font-black text-purple-950 focus:ring-2 focus:ring-purple-400"
                      required
                    />
                  </div>

                  <div className="bg-purple-100/70 p-2 rounded-xl text-[11px] text-purple-900 font-semibold flex items-center gap-1.5">
                    <Info size={14} className="text-purple-700 shrink-0" />
                    <span>รอบคำนวณ: ตามรอบติดตั้งผ้าม่าน ({curtainPeriod?.name || 'รอบปัจจุบัน'})</span>
                  </div>
                </div>
              )}

              {/* Additional Note */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  หมายเหตุเพิ่มเติม (ถ้ามี)
                </label>
                <input
                  type="text"
                  value={formNote}
                  onChange={e => setFormNote(e.target.value)}
                  placeholder="เช่น หมายเหตุประกอบการเบิกจ่าย"
                  className="w-full bg-white border border-gray-300 rounded-xl p-2 text-xs font-medium focus:ring-2 focus:ring-gray-400"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-between border-t border-gray-100">
                {editingRecord ? (
                  <button
                    type="button"
                    onClick={() => setItemToDelete(editingRecord)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-1.5 border border-red-200 transition-colors"
                  >
                    <Trash2 size={14} />
                    <span>ลบรายการนี้</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    style={{ backgroundColor: themeColor, color: themeTextColor }}
                    className="px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:opacity-90"
                  >
                    <Check size={14} />
                    <span>{editingRecord ? 'บันทึกการแก้ไข' : 'บันทึกรายการ'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Item Delete Confirmation Modal (In-App Dialog, immune to iframe alert/confirm blockage) */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in duration-150">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">ยืนยันการลบรายการ</h3>
                  <p className="text-xs text-gray-500">คุณต้องการลบรายการนี้ออกจากระบบใช่หรือไม่?</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-5 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">ช่างผู้ปฏิบัติงาน:</span>
                  <span className="font-bold text-gray-900">
                    {techMap.get(itemToDelete.techId)?.officialName || 'ไม่ระบุชื่อ'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">ประเภทรายได้:</span>
                  <span className="font-semibold text-gray-800">
                    {itemToDelete.category === 'allowance' 
                      ? (itemToDelete.allowanceType === 'abroad_800' ? 'เบี้ยเลี้ยงต่างประเทศ (800)' : 'เบี้ยเลี้ยงต่างจังหวัด (300)')
                      : itemToDelete.category === 'ac_install' ? 'ค่าติดตั้งแอร์' : 'ค่าอื่นๆ ระบุเอง'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">รายละเอียด:</span>
                  <span className="font-semibold text-gray-800">{itemToDelete.title || '-'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500">วันที่:</span>
                  <span className="font-semibold text-gray-800">{formatDateTH(itemToDelete.date)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-gray-700 font-bold">ยอดเงิน:</span>
                  <span className="font-black text-sm text-red-600">฿{itemToDelete.amount.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setItemToDelete(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const deleteId = itemToDelete.id;
                    onDeleteOtherIncome(deleteId);
                    setSelectedRecordIds(prev => prev.filter(id => id !== deleteId));
                    if (isModalOpen && editingRecord?.id === deleteId) {
                      setIsModalOpen(false);
                    }
                    setItemToDelete(null);
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Trash2 size={14} />
                  <span>ยืนยันลบรายการ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in duration-150">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">ยืนยันการลบหลายรายการ</h3>
                  <p className="text-xs text-gray-500">คุณต้องการลบรายการที่เลือกทั้งหมดออกจากระบบใช่หรือไม่?</p>
                </div>
              </div>

              <div className="bg-red-50/70 rounded-xl p-4 border border-red-100 mb-5 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">จำนวนรายการที่เลือก:</span>
                  <span className="font-bold text-red-700 text-sm">{selectedRecordIds.length} รายการ</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-red-200/60">
                  <span className="text-gray-700 font-bold">ยอดเงินรวมทั้งสิ้น:</span>
                  <span className="font-black text-sm text-red-700">฿{selectedTotalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsBulkDeleteModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onDeleteMultipleOtherIncomes) {
                      onDeleteMultipleOtherIncomes(selectedRecordIds);
                    } else {
                      selectedRecordIds.forEach(id => onDeleteOtherIncome(id));
                    }
                    setSelectedRecordIds([]);
                    setIsBulkDeleteModalOpen(false);
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Trash2 size={14} />
                  <span>ยืนยันลบ {selectedRecordIds.length} รายการ</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
