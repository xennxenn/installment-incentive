import React, { useState, useEffect } from 'react';
import { 
  Sliders, X, Check, RotateCcw, Plus, Trash2, Tag, HelpCircle, 
  Layers, Calendar, History, Sparkles, AlertCircle, Clock, Pencil, Save, ArrowRight
} from 'lucide-react';
import { IncentiveRules, JobTypeConfig, CalcFormulaType, UnitType, PayPeriod, RuleScope, RuleVersion, PeriodRuleSaveOptions } from '../types';
import { DEFAULT_INCENTIVE_RULES, JOB_TYPES } from '../data/initialData';

interface IncentiveRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: IncentiveRules;
  onSaveRules: (rules: IncentiveRules, saveOptions?: PeriodRuleSaveOptions) => void;
  themeColor: string;
  themeTextColor: string;
  payPeriods?: PayPeriod[];
  currentPeriod?: PayPeriod;
  ruleVersions?: RuleVersion[];
  onDeleteRuleVersion?: (versionId: string) => void;
}

// Synchronizes specific job types with standard rule values
export const syncJobTypesWithRules = (
  types: JobTypeConfig[],
  updatedRules: Partial<IncentiveRules>
): JobTypeConfig[] => {
  return types.map(t => {
    const copy = { ...t };
    if (copy.id === 'install') {
      if (updatedRules.baseTechPay !== undefined) {
        copy.baseAttendancePerTech = updatedRules.baseTechPay;
        copy.description = `คิดฐานค่าช่าง ${updatedRules.baseTechPay} บาท/คน + รางส่วนเกิน`;
      }
    } else if (copy.id === 'install_high' || copy.id === 'fix_high') {
      if (updatedRules.baseTechPay !== undefined) {
        copy.baseAttendancePerTech = updatedRules.baseTechPay;
      }
      if (updatedRules.highLadderBonus !== undefined) {
        copy.bonusAmount = updatedRules.highLadderBonus;
        copy.description = `คิดสูตรมาตรฐาน + โบนัสบันไดสูง ${updatedRules.highLadderBonus} บาท`;
      }
    } else if (copy.id === 'install_scaffold' || copy.id === 'fix_scaffold') {
      if (updatedRules.baseTechPay !== undefined) {
        copy.baseAttendancePerTech = updatedRules.baseTechPay;
      }
      if (updatedRules.scaffoldBonus !== undefined) {
        copy.bonusAmount = updatedRules.scaffoldBonus;
        copy.description = `คิดสูตรมาตรฐาน + โบนัสนั่งร้าน ${updatedRules.scaffoldBonus} บาท`;
      }
    } else if (copy.id === 'fix') {
      if (updatedRules.baseTechPay !== undefined) {
        copy.baseAttendancePerTech = updatedRules.baseTechPay;
      }
    } else if (copy.id === 'install_wall_linen') {
      if (updatedRules.wallLinenSqmRate !== undefined) {
        copy.ratePerUnit = updatedRules.wallLinenSqmRate;
      }
      if (updatedRules.wallLinenAttendancePay !== undefined) {
        copy.baseAttendancePerTech = updatedRules.wallLinenAttendancePay;
      }
      const rate = updatedRules.wallLinenSqmRate ?? copy.ratePerUnit ?? 50;
      const att = updatedRules.wallLinenAttendancePay ?? copy.baseAttendancePerTech ?? 0;
      copy.description = `คำนวณ ${rate} บาท/ตร.ม.${att > 0 ? ` (+ ค่าเข้างาน ${att} บาท/คน)` : ''}`;
    } else if (copy.id === 'install_wall_mural') {
      if (updatedRules.wallMuralSqmRate !== undefined) {
        copy.ratePerUnit = updatedRules.wallMuralSqmRate;
      }
      if (updatedRules.wallMuralAttendancePay !== undefined) {
        copy.baseAttendancePerTech = updatedRules.wallMuralAttendancePay;
      }
      const rate = updatedRules.wallMuralSqmRate ?? copy.ratePerUnit ?? 75;
      const att = updatedRules.wallMuralAttendancePay ?? copy.baseAttendancePerTech ?? 0;
      copy.description = `คำนวณ ${rate} บาท/ตร.ม.${att > 0 ? ` (+ ค่าเข้างาน ${att} บาท/คน)` : ''}`;
    } else if (copy.id === 'measure') {
      if (updatedRules.measureTechPay !== undefined) {
        copy.fixedAmount = updatedRules.measureTechPay;
        copy.description = `คิดเหมา ${updatedRules.measureTechPay} บาทต่อคน`;
      }
    }
    return copy;
  });
};

export const IncentiveRulesModal: React.FC<IncentiveRulesModalProps> = ({
  isOpen,
  onClose,
  rules,
  onSaveRules,
  themeColor,
  themeTextColor,
  payPeriods = [],
  currentPeriod,
  ruleVersions = [],
  onDeleteRuleVersion
}) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'job_types' | 'versions'>('rules');
  
  // Initialize form data and ensure customJobTypes are synchronized with rules
  const [formData, setFormData] = useState<IncentiveRules>(() => {
    const mergedRules = { ...DEFAULT_INCENTIVE_RULES, ...rules };
    const initialTypes = mergedRules.customJobTypes && mergedRules.customJobTypes.length > 0
      ? mergedRules.customJobTypes
      : JOB_TYPES;
    return {
      ...mergedRules,
      customJobTypes: syncJobTypesWithRules(initialTypes, mergedRules)
    };
  });

  // Keep formData in sync whenever modal opens or rules change
  useEffect(() => {
    if (isOpen) {
      const mergedRules = { ...DEFAULT_INCENTIVE_RULES, ...rules };
      const currentConfigured = mergedRules.customJobTypes && mergedRules.customJobTypes.length > 0
        ? mergedRules.customJobTypes
        : JOB_TYPES;
      const map = new Map<string, JobTypeConfig>();
      JOB_TYPES.forEach(t => map.set(t.id, t));
      currentConfigured.forEach(t => {
        if (map.has(t.id)) {
          map.set(t.id, { ...map.get(t.id)!, ...t });
        } else {
          map.set(t.id, t);
        }
      });
      const allTypes = Array.from(map.values());
      setFormData({
        ...mergedRules,
        customJobTypes: syncJobTypesWithRules(allTypes, mergedRules)
      });
    }
  }, [isOpen, rules]);

  // Scope & Effective Period states
  const defaultPeriodId = currentPeriod?.id || (payPeriods && payPeriods[0]?.id) || '';
  const [scope, setScope] = useState<RuleScope>('from_period_onward');
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(defaultPeriodId);

  // State for creating a new custom job type
  const [newTypeLabel, setNewTypeLabel] = useState('');
  const [newTypeUnit, setNewTypeUnit] = useState<UnitType>('sqm');
  const [newTypeFormula, setNewTypeFormula] = useState<CalcFormulaType>('rate_per_sqm');
  const [newTypeRate, setNewTypeRate] = useState<number>(50);
  const [newTypeAttendance, setNewTypeAttendance] = useState<number>(0);
  const [newTypeFixed, setNewTypeFixed] = useState<number>(200);
  const [newTypeBonus, setNewTypeBonus] = useState<number>(0);
  const [newTypeDesc, setNewTypeDesc] = useState('');
  const [showAddTypeForm, setShowAddTypeForm] = useState(false);

  // State for editing an existing job type
  const [editingJobType, setEditingJobType] = useState<JobTypeConfig | null>(null);

  if (!isOpen) return null;

  const targetPeriodObj = payPeriods.find(p => p.id === selectedPeriodId) || currentPeriod;

  // Handle changing rules in Tab 1 and immediately sync customJobTypes
  const handleRuleFieldChange = (field: keyof IncentiveRules, value: number) => {
    const updated = {
      ...formData,
      [field]: value
    };
    const syncedTypes = syncJobTypesWithRules(formData.customJobTypes || JOB_TYPES, { [field]: value });
    setFormData({
      ...updated,
      customJobTypes: syncedTypes
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const saveOptions: PeriodRuleSaveOptions = {
      scope: scope,
      targetPeriodId: selectedPeriodId || targetPeriodObj?.id || 'current',
      targetPeriodName: targetPeriodObj?.name || 'รอบปัจจุบัน',
      targetPeriodStartDate: targetPeriodObj?.start
    };
    onSaveRules(formData, saveOptions);
    onClose();
  };

  const handleResetDefault = () => {
    const defaultSynced = {
      ...DEFAULT_INCENTIVE_RULES,
      customJobTypes: syncJobTypesWithRules(JOB_TYPES, DEFAULT_INCENTIVE_RULES)
    };
    setFormData(defaultSynced);
  };

  // Add new job type
  const handleAddJobType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeLabel.trim()) return;

    const newId = `custom_${Date.now()}`;
    const newConfig: JobTypeConfig = {
      id: newId,
      label: newTypeLabel.trim(),
      unitType: newTypeUnit,
      unitLabel: newTypeUnit === 'sqm' ? 'ตร.ม.' : newTypeUnit === 'rails' ? 'ราง' : '-',
      isExcludedFromRails: newTypeUnit !== 'rails',
      calcFormulaType: newTypeFormula,
      ratePerUnit: newTypeRate,
      baseAttendancePerTech: newTypeAttendance,
      fixedAmount: newTypeFixed,
      bonusAmount: newTypeBonus,
      isSystem: false,
      description: newTypeDesc.trim() || `${newTypeLabel.trim()} (${newTypeFormula})`
    };

    const currentTypes = formData.customJobTypes || JOB_TYPES;
    const updatedTypes = [...currentTypes, newConfig];
    const newFormData: IncentiveRules = {
      ...formData,
      customJobTypes: updatedTypes
    };
    setFormData(newFormData);

    // Save immediately so it propagates to JobManagement and Firestore without needing another click!
    const saveOptions: PeriodRuleSaveOptions = {
      scope: scope,
      targetPeriodId: selectedPeriodId || targetPeriodObj?.id || 'current',
      targetPeriodName: targetPeriodObj?.name || 'รอบปัจจุบัน',
      targetPeriodStartDate: targetPeriodObj?.start
    };
    onSaveRules(newFormData, saveOptions);

    // Reset
    setNewTypeLabel('');
    setNewTypeDesc('');
    setShowAddTypeForm(false);
  };

  // Save edited job type and sync back to standard rules if linked
  const handleSaveEditJobType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJobType || !editingJobType.label.trim()) return;

    const currentTypes = formData.customJobTypes || JOB_TYPES;
    const updatedTypes = currentTypes.map(t => t.id === editingJobType.id ? editingJobType : t);

    // Sync back to main formData fields for linked system types
    const updatedRulesPartial: Partial<IncentiveRules> = {};
    if (editingJobType.id === 'install_high' || editingJobType.id === 'fix_high') {
      updatedRulesPartial.highLadderBonus = editingJobType.bonusAmount ?? 0;
      if (editingJobType.baseAttendancePerTech !== undefined) {
        updatedRulesPartial.baseTechPay = editingJobType.baseAttendancePerTech;
      }
    } else if (editingJobType.id === 'install_scaffold' || editingJobType.id === 'fix_scaffold') {
      updatedRulesPartial.scaffoldBonus = editingJobType.bonusAmount ?? 0;
      if (editingJobType.baseAttendancePerTech !== undefined) {
        updatedRulesPartial.baseTechPay = editingJobType.baseAttendancePerTech;
      }
    } else if (editingJobType.id === 'install_wall_linen') {
      updatedRulesPartial.wallLinenSqmRate = editingJobType.ratePerUnit ?? 50;
      updatedRulesPartial.wallLinenAttendancePay = editingJobType.baseAttendancePerTech ?? 0;
    } else if (editingJobType.id === 'install_wall_mural') {
      updatedRulesPartial.wallMuralSqmRate = editingJobType.ratePerUnit ?? 75;
      updatedRulesPartial.wallMuralAttendancePay = editingJobType.baseAttendancePerTech ?? 0;
    } else if (editingJobType.id === 'measure') {
      updatedRulesPartial.measureTechPay = editingJobType.fixedAmount ?? 250;
    } else if (editingJobType.id === 'install') {
      if (editingJobType.baseAttendancePerTech !== undefined) {
        updatedRulesPartial.baseTechPay = editingJobType.baseAttendancePerTech;
      }
    }

    const newFormData: IncentiveRules = {
      ...formData,
      ...updatedRulesPartial,
      customJobTypes: updatedTypes
    };
    setFormData(newFormData);

    const saveOptions: PeriodRuleSaveOptions = {
      scope: scope,
      targetPeriodId: selectedPeriodId || targetPeriodObj?.id || 'current',
      targetPeriodName: targetPeriodObj?.name || 'รอบปัจจุบัน',
      targetPeriodStartDate: targetPeriodObj?.start
    };
    onSaveRules(newFormData, saveOptions);

    setEditingJobType(null);
  };

  const handleDeleteJobType = (id: string) => {
    const currentTypes = formData.customJobTypes || JOB_TYPES;
    const updatedTypes = currentTypes.filter(t => t.id !== id);
    const newFormData: IncentiveRules = {
      ...formData,
      customJobTypes: updatedTypes
    };
    setFormData(newFormData);

    const saveOptions: PeriodRuleSaveOptions = {
      scope: scope,
      targetPeriodId: selectedPeriodId || targetPeriodObj?.id || 'current',
      targetPeriodName: targetPeriodObj?.name || 'รอบปัจจุบัน',
      targetPeriodStartDate: targetPeriodObj?.start
    };
    onSaveRules(newFormData, saveOptions);
  };

  const currentJobTypes = formData.customJobTypes && formData.customJobTypes.length > 0
    ? formData.customJobTypes
    : JOB_TYPES;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-[100] p-4 no-print">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 space-y-4 max-h-[94vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Sliders size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900">ตั้งค่าสูตร Incentive & เลือกรอบที่มีผลบังคับใช้</h3>
              <p className="text-[11px] text-gray-500">
                ข้อมูลสูตรมาตรฐานและประเภทงานเชื่อมโยงกันแบบ Real-time พร้อมเลือกรอบคำนวณที่ต้องการ
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b pb-2 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'rules'
                ? 'bg-gray-900 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Sliders size={13} />
            <span>สูตรคำนวณ & อัตรามาตรฐาน</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('job_types')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'job_types'
                ? 'bg-gray-900 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Layers size={13} />
            <span>ประเภทงาน & สูตร ({currentJobTypes.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('versions')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'versions'
                ? 'bg-gray-900 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <History size={13} />
            <span>ประวัติเวอร์ชันสูตร ({ruleVersions.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-4 text-xs">
          {activeTab === 'rules' && (
            <form id="rules-form" onSubmit={handleSubmit} className="space-y-4">
              
              {/* Effective Pay Period Selection Section */}
              <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                    <Calendar size={16} className="text-blue-600" />
                    <span>เลือกรอบคำนวณที่มีผลบังคับใช้ (ไม่กระทบงานรอบก่อนหน้า)</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800">
                    คำนวณยอดใหม่อัตโนมัติ
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
                  {/* Option 1: From Period Onward */}
                  <label
                    onClick={() => setScope('from_period_onward')}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      scope === 'from_period_onward'
                        ? 'bg-white border-blue-600 shadow-sm ring-1 ring-blue-600'
                        : 'bg-white/60 border-blue-200/80 hover:bg-white text-gray-700'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="radio"
                        name="rule_scope"
                        checked={scope === 'from_period_onward'}
                        onChange={() => setScope('from_period_onward')}
                        className="mt-0.5 text-blue-600"
                      />
                      <div>
                        <div className="font-bold text-gray-900 text-xs">เริ่มตั้งแต่รอบนี้เป็นต้นไป</div>
                        <div className="text-[10px] text-emerald-700 font-medium mt-0.5">
                          ✓ แนะนำ (รักษายอดในอดีต)
                        </div>
                      </div>
                    </div>
                  </label>

                  {/* Option 2: Specific Period Only */}
                  <label
                    onClick={() => setScope('specific_period_only')}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      scope === 'specific_period_only'
                        ? 'bg-white border-blue-600 shadow-sm ring-1 ring-blue-600'
                        : 'bg-white/60 border-blue-200/80 hover:bg-white text-gray-700'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="radio"
                        name="rule_scope"
                        checked={scope === 'specific_period_only'}
                        onChange={() => setScope('specific_period_only')}
                        className="mt-0.5 text-blue-600"
                      />
                      <div>
                        <div className="font-bold text-gray-900 text-xs">เฉพาะรอบที่เลือกเท่านั้น</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          รอบอื่นๆ ใช้สูตรเดิม
                        </div>
                      </div>
                    </div>
                  </label>

                  {/* Option 3: All Periods */}
                  <label
                    onClick={() => setScope('all_periods')}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      scope === 'all_periods'
                        ? 'bg-white border-blue-600 shadow-sm ring-1 ring-blue-600'
                        : 'bg-white/60 border-blue-200/80 hover:bg-white text-gray-700'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="radio"
                        name="rule_scope"
                        checked={scope === 'all_periods'}
                        onChange={() => setScope('all_periods')}
                        className="mt-0.5 text-blue-600"
                      />
                      <div>
                        <div className="font-bold text-gray-900 text-xs">ทุกรอบคำนวณทั้งหมด</div>
                        <div className="text-[10px] text-amber-600 mt-0.5">
                          รวมย้อนหลังทั้งหมด
                        </div>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Target Period Dropdown */}
                {scope !== 'all_periods' && (
                  <div className="pt-2 border-t border-blue-100 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <label className="font-bold text-gray-700 text-xs shrink-0">
                      {scope === 'from_period_onward' ? 'เริ่มใช้งานตั้งแต่รอบ:' : 'รอบที่ต้องการบังคับใช้:'}
                    </label>
                    <select
                      value={selectedPeriodId}
                      onChange={e => setSelectedPeriodId(e.target.value)}
                      className="border border-blue-300 rounded-xl p-1.5 text-xs font-semibold text-blue-900 bg-white shadow-2xs w-full sm:w-auto flex-1"
                    >
                      {payPeriods.map(p => (
                        <option key={p.id || p.name} value={p.id}>
                          {p.name} ({p.start} ถึง {p.end})
                        </option>
                      ))}
                      {!payPeriods.some(p => p.id === currentPeriod?.id) && currentPeriod && (
                        <option value={currentPeriod.id || 'current'}>
                          {currentPeriod.name} ({currentPeriod.start} ถึง {currentPeriod.end})
                        </option>
                      )}
                    </select>
                  </div>
                )}
              </div>

              {/* Group 1: Standard Curtain Rates */}
              <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-200 space-y-3">
                <div className="font-bold text-gray-800 text-xs flex items-center justify-between border-b border-gray-200/80 pb-1.5">
                  <span>1. งานผ้าม่านมาตรฐาน (Curtain Installation)</span>
                  <span className="text-[10px] text-emerald-700 font-semibold">เชื่อมโยงไปยังประเภทงานผ้าม่านอัตโนมัติ</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      ค่าฐานช่างต่อคน/วัน (Base Pay):
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min={0}
                        className="w-full border rounded-xl p-2 pr-12 font-bold text-sm text-gray-800 bg-white"
                        value={formData.baseTechPay}
                        onChange={e => handleRuleFieldChange('baseTechPay', Number(e.target.value) || 0)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-[11px]">บาท/คน</span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      งานวัดพื้นที่ต่อคน (Measure Pay):
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min={0}
                        className="w-full border rounded-xl p-2 pr-12 font-bold text-sm text-gray-800 bg-white"
                        value={formData.measureTechPay}
                        onChange={e => handleRuleFieldChange('measureTechPay', Number(e.target.value) || 0)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-[11px]">บาท/คน</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      รางฟรีขั้นต่ำ (Free Rails Threshold):
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min={0}
                        className="w-full border rounded-xl p-2 pr-10 font-bold text-sm text-gray-800 bg-white"
                        value={formData.freeRailsThreshold}
                        onChange={e => handleRuleFieldChange('freeRailsThreshold', Number(e.target.value) || 0)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-[11px]">ราง</span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      ค่ารางส่วนเกิน (Extra Rail Rate):
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min={0}
                        className="w-full border rounded-xl p-2 pr-12 font-bold text-sm text-gray-800 bg-white"
                        value={formData.extraRailRate}
                        onChange={e => handleRuleFieldChange('extraRailRate', Number(e.target.value) || 0)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-[11px]">บาท/ราง</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      โบนัสติดตั้ง/บันไดสูง (ใส่ 0 ได้หากไม่คิดโบนัส):
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min={0}
                        className="w-full border rounded-xl p-2 pr-10 font-bold text-sm text-gray-800 bg-white"
                        value={formData.highLadderBonus}
                        onChange={e => handleRuleFieldChange('highLadderBonus', Number(e.target.value) || 0)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-[11px]">บาท</span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      โบนัสติดตั้ง/นั่งร้าน (ใส่ 0 ได้หากไม่คิดโบนัส):
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min={0}
                        className="w-full border rounded-xl p-2 pr-10 font-bold text-sm text-gray-800 bg-white"
                        value={formData.scaffoldBonus}
                        onChange={e => handleRuleFieldChange('scaffoldBonus', Number(e.target.value) || 0)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-[11px]">บาท</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Group 2: WallLinen & WallMural Separate Attendance & Rates */}
              <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-200 space-y-3">
                <div className="font-bold text-amber-900 text-xs flex items-center justify-between border-b border-amber-200 pb-1.5">
                  <span>2. ติดตั้ง WallLinen & WallMural (คิด ตร.ม. ทศนิยม 1 ตำแหน่ง & แยกค่าเข้างาน)</span>
                  <span className="text-[10px] text-amber-700 font-normal">สูตร: (ตร.ม. × อัตรา) + (ค่าเข้างาน × ช่าง)</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      WallLinen (อัตราต่อ ตร.ม.):
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min={0}
                        step="0.1"
                        className="w-full border rounded-xl p-2 pr-14 font-bold text-sm text-gray-800 bg-white"
                        value={formData.wallLinenSqmRate ?? 50}
                        onChange={e => handleRuleFieldChange('wallLinenSqmRate', Number(e.target.value) || 0)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-[11px]">บาท/ตร.ม.</span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      ค่าเข้างาน WallLinen ต่อคน:
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        className="w-full border rounded-xl p-2 pr-12 font-bold text-sm text-gray-800 bg-white"
                        value={formData.wallLinenAttendancePay ?? 0}
                        onChange={e => handleRuleFieldChange('wallLinenAttendancePay', Number(e.target.value) || 0)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-[11px]">บาท/คน</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      WallMural (อัตราต่อ ตร.ม.):
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min={0}
                        step="0.1"
                        className="w-full border rounded-xl p-2 pr-14 font-bold text-sm text-gray-800 bg-white"
                        value={formData.wallMuralSqmRate ?? 75}
                        onChange={e => handleRuleFieldChange('wallMuralSqmRate', Number(e.target.value) || 0)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-[11px]">บาท/ตร.ม.</span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      ค่าเข้างาน WallMural ต่อคน:
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        className="w-full border rounded-xl p-2 pr-12 font-bold text-sm text-gray-800 bg-white"
                        value={formData.wallMuralAttendancePay ?? 0}
                        onChange={e => handleRuleFieldChange('wallMuralAttendancePay', Number(e.target.value) || 0)}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-[11px]">บาท/คน</span>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}

          {activeTab === 'job_types' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-800 text-xs">รายการประเภทงานและสูตรการคำนวณทั้งหมด</h4>
                  <p className="text-[11px] text-gray-500">
                    สามารถกดปุ่ม <span className="font-bold text-blue-600">"แก้ไข"</span> ที่แต่ละประเภทงานเพื่อปรับเปลี่ยนอัตรา โบนัส หรือรูปแบบสูตรได้ทันที
                  </p>
                </div>
                {!showAddTypeForm && !editingJobType && (
                  <button
                    type="button"
                    onClick={() => setShowAddTypeForm(true)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1 shadow-2xs"
                  >
                    <Plus size={14} />
                    <span>เพิ่มประเภทงานใหม่</span>
                  </button>
                )}
              </div>

              {/* Edit Existing Job Type Form */}
              {editingJobType && (
                <form
                  onSubmit={handleSaveEditJobType}
                  className="bg-blue-50/80 border border-blue-300 p-4 rounded-xl space-y-3 shadow-xs"
                >
                  <div className="flex items-center justify-between border-b border-blue-200 pb-2">
                    <div className="flex items-center gap-1.5 font-bold text-blue-900 text-xs">
                      <Pencil size={15} className="text-blue-600" />
                      <span>แก้ไขประเภทงาน: {editingJobType.label} {editingJobType.isSystem ? '(ระบบ)' : '(กำหนดเอง)'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingJobType(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">ชื่อประเภทงาน:</label>
                      <input
                        type="text"
                        required
                        value={editingJobType.label}
                        onChange={e => setEditingJobType({ ...editingJobType, label: e.target.value })}
                        className="w-full border rounded-xl p-2 bg-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">หน่วยนับ:</label>
                      <select
                        value={editingJobType.unitType || 'none'}
                        onChange={e => {
                          const u = e.target.value as UnitType;
                          setEditingJobType({
                            ...editingJobType,
                            unitType: u,
                            unitLabel: u === 'sqm' ? 'ตร.ม.' : u === 'rails' ? 'ราง' : '-',
                            isExcludedFromRails: u !== 'rails'
                          });
                        }}
                        className="w-full border rounded-xl p-2 bg-white font-semibold"
                      >
                        <option value="rails">ราง (Rails)</option>
                        <option value="sqm">ตารางเมตร (ตร.ม. / Sq.m.)</option>
                        <option value="none">ไม่มีหน่วย (นับตามงาน/ช่าง)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">รูปแบบสูตรคำนวณ:</label>
                      <select
                        value={editingJobType.calcFormulaType || 'curtain_standard'}
                        onChange={e => setEditingJobType({ ...editingJobType, calcFormulaType: e.target.value as CalcFormulaType })}
                        className="w-full border rounded-xl p-2 bg-white font-semibold"
                      >
                        <option value="curtain_standard">สูตรผ้าม่านมาตรฐาน (+โบนัส)</option>
                        <option value="rate_per_sqm">คิดตาม ตร.ม. (ตร.ม. × อัตรา + ค่าเข้างาน)</option>
                        <option value="rate_per_unit">คิดตามหน่วย (จำนวน × อัตรา + ค่าเข้างาน)</option>
                        <option value="fixed_per_tech">เหมาจ่ายต่อช่าง (จำนวนช่าง × บาท)</option>
                        <option value="fixed_per_job">เหมาจ่ายต่องาน (ราคาคงที่)</option>
                        <option value="free_no_pay">ไม่คิดเงิน (Free/ไม่มี Incentive)</option>
                      </select>
                    </div>
                  </div>

                  {/* Formula-Specific Parameters for Edit */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-white p-3 rounded-xl border border-blue-200">
                    {(editingJobType.calcFormulaType === 'rate_per_sqm' || editingJobType.calcFormulaType === 'rate_per_unit') && (
                      <>
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">
                            อัตราต่อหน่วย ({editingJobType.unitType === 'sqm' ? 'บาท/ตร.ม.' : 'บาท/หน่วย'}):
                          </label>
                          <input
                            type="number"
                            min={0}
                            step="0.1"
                            value={editingJobType.ratePerUnit ?? 0}
                            onChange={e => setEditingJobType({ ...editingJobType, ratePerUnit: Number(e.target.value) || 0 })}
                            className="w-full border rounded-xl p-2 bg-white font-bold"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">ค่าเข้างานต่อช่าง 1 คน (บาท/คน):</label>
                          <input
                            type="number"
                            min={0}
                            value={editingJobType.baseAttendancePerTech ?? 0}
                            onChange={e => setEditingJobType({ ...editingJobType, baseAttendancePerTech: Number(e.target.value) || 0 })}
                            className="w-full border rounded-xl p-2 bg-white font-bold"
                          />
                        </div>
                      </>
                    )}

                    {editingJobType.calcFormulaType === 'fixed_per_tech' && (
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">จำนวนเงินเหมาต่อช่าง 1 คน (บาท/คน):</label>
                        <input
                          type="number"
                          min={0}
                          value={editingJobType.fixedAmount ?? 250}
                          onChange={e => setEditingJobType({ ...editingJobType, fixedAmount: Number(e.target.value) || 0 })}
                          className="w-full border rounded-xl p-2 bg-white font-bold"
                        />
                      </div>
                    )}

                    {editingJobType.calcFormulaType === 'fixed_per_job' && (
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">จำนวนเงินเหมารวมทั้งงาน (บาท):</label>
                        <input
                          type="number"
                          min={0}
                          value={editingJobType.fixedAmount ?? 0}
                          onChange={e => setEditingJobType({ ...editingJobType, fixedAmount: Number(e.target.value) || 0 })}
                          className="w-full border rounded-xl p-2 bg-white font-bold"
                        />
                      </div>
                    )}

                    {editingJobType.calcFormulaType === 'curtain_standard' && (
                      <>
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">
                            โบนัสพิเศษประจำประเภทงาน (บาท - ใส่ 0 หากไม่มีโบนัส):
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={editingJobType.bonusAmount ?? 0}
                            onChange={e => setEditingJobType({ ...editingJobType, bonusAmount: Number(e.target.value) || 0 })}
                            className="w-full border rounded-xl p-2 bg-white font-bold"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">ค่าฐานช่างต่อคน (Base Pay):</label>
                          <input
                            type="number"
                            min={0}
                            value={editingJobType.baseAttendancePerTech ?? formData.baseTechPay ?? 250}
                            onChange={e => setEditingJobType({ ...editingJobType, baseAttendancePerTech: Number(e.target.value) || 0 })}
                            className="w-full border rounded-xl p-2 bg-white font-bold"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">คำอธิบายเพิ่มเติม:</label>
                    <input
                      type="text"
                      value={editingJobType.description || ''}
                      onChange={e => setEditingJobType({ ...editingJobType, description: e.target.value })}
                      className="w-full border rounded-xl p-2 bg-white text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1 border-t border-blue-200">
                    <button
                      type="button"
                      onClick={() => setEditingJobType(null)}
                      className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 font-semibold"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs flex items-center gap-1.5"
                    >
                      <Save size={14} />
                      <span>บันทึกการแก้ไขประเภทงาน</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Add New Job Type Form */}
              {showAddTypeForm && !editingJobType && (
                <form
                  onSubmit={handleAddJobType}
                  className="bg-emerald-50/50 border border-emerald-200 p-3.5 rounded-xl space-y-3"
                >
                  <div className="font-bold text-emerald-900 text-xs border-b border-emerald-200 pb-1">
                    เพิ่มประเภทงานใหม่ & กำหนดสูตรคำนวณ
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">ชื่อประเภทงาน:</label>
                      <input
                        type="text"
                        required
                        placeholder="เช่น ติดตั้งฟิล์มกรองแสง"
                        value={newTypeLabel}
                        onChange={e => setNewTypeLabel(e.target.value)}
                        className="w-full border rounded-xl p-2 bg-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">หน่วยนับ:</label>
                      <select
                        value={newTypeUnit}
                        onChange={e => setNewTypeUnit(e.target.value as UnitType)}
                        className="w-full border rounded-xl p-2 bg-white font-semibold"
                      >
                        <option value="sqm">ตารางเมตร (ตร.ม. / Sq.m.)</option>
                        <option value="rails">ราง (Rails)</option>
                        <option value="none">ไม่มีหน่วย (นับตามงาน/ช่าง)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">รูปแบบสูตรคำนวณ:</label>
                      <select
                        value={newTypeFormula}
                        onChange={e => setNewTypeFormula(e.target.value as CalcFormulaType)}
                        className="w-full border rounded-xl p-2 bg-white font-semibold"
                      >
                        <option value="rate_per_sqm">คิดตาม ตร.ม. (ตร.ม. × อัตรา + ค่าเข้างาน)</option>
                        <option value="rate_per_unit">คิดตามหน่วย (จำนวน × อัตรา + ค่าเข้างาน)</option>
                        <option value="fixed_per_tech">เหมาจ่ายต่อช่าง (จำนวนช่าง × บาท)</option>
                        <option value="fixed_per_job">เหมาจ่ายต่องาน (ราคาคงที่)</option>
                        <option value="curtain_standard">สูตรผ้าม่านมาตรฐาน (+โบนัส)</option>
                        <option value="free_no_pay">ไม่คิดเงิน (Free/ไม่มี Incentive)</option>
                      </select>
                    </div>
                  </div>

                  {/* Formula-Specific Parameters */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-white p-3 rounded-xl border border-emerald-100">
                    {(newTypeFormula === 'rate_per_sqm' || newTypeFormula === 'rate_per_unit') && (
                      <>
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">
                            อัตราต่อหน่วย ({newTypeUnit === 'sqm' ? 'บาท/ตร.ม.' : 'บาท/หน่วย'}):
                          </label>
                          <input
                            type="number"
                            min={0}
                            step="0.1"
                            value={newTypeRate}
                            onChange={e => setNewTypeRate(Number(e.target.value) || 0)}
                            className="w-full border rounded-xl p-2 bg-white font-bold"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">ค่าเข้างานต่อช่าง 1 คน (ถ้ามี):</label>
                          <input
                            type="number"
                            min={0}
                            value={newTypeAttendance}
                            onChange={e => setNewTypeAttendance(Number(e.target.value) || 0)}
                            className="w-full border rounded-xl p-2 bg-white font-bold"
                          />
                        </div>
                      </>
                    )}

                    {newTypeFormula === 'fixed_per_tech' && (
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">จำนวนเงินต่อช่าง 1 คน:</label>
                        <input
                          type="number"
                          min={0}
                          value={newTypeFixed}
                          onChange={e => setNewTypeFixed(Number(e.target.value) || 0)}
                          className="w-full border rounded-xl p-2 bg-white font-bold"
                        />
                      </div>
                    )}

                    {newTypeFormula === 'fixed_per_job' && (
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">จำนวนเงินเหมารวมทั้งงาน:</label>
                        <input
                          type="number"
                          min={0}
                          value={newTypeFixed}
                          onChange={e => setNewTypeFixed(Number(e.target.value) || 0)}
                          className="w-full border rounded-xl p-2 bg-white font-bold"
                        />
                      </div>
                    )}

                    {newTypeFormula === 'curtain_standard' && (
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">โบนัสพิเศษเพิ่ม (ถ้ามี):</label>
                        <input
                          type="number"
                          min={0}
                          value={newTypeBonus}
                          onChange={e => setNewTypeBonus(Number(e.target.value) || 0)}
                          className="w-full border rounded-xl p-2 bg-white font-bold"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">คำอธิบายเพิ่มเติม (Optional):</label>
                    <input
                      type="text"
                      placeholder="เช่น คิดค่าส่วนแบ่งการติดตั้งฟิล์ม 80 บาท/ตร.ม."
                      value={newTypeDesc}
                      onChange={e => setNewTypeDesc(e.target.value)}
                      className="w-full border rounded-xl p-2 bg-white text-xs"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1 border-t border-emerald-200">
                    <button
                      type="button"
                      onClick={() => setShowAddTypeForm(false)}
                      className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-700 font-semibold"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                    >
                      บันทึกประเภทงานใหม่
                    </button>
                  </div>
                </form>
              )}

              {/* Job Types List */}
              <div className="space-y-2.5">
                {currentJobTypes.map(t => {
                  // Display dynamic badge for active calculation parameters
                  let detailBadge = '';
                  if (t.calcFormulaType === 'rate_per_sqm' || t.calcFormulaType === 'rate_per_unit') {
                    detailBadge = `฿${t.ratePerUnit ?? 0}/${t.unitLabel || 'ตร.ม.'}${t.baseAttendancePerTech ? ` + ค่าเข้างาน ฿${t.baseAttendancePerTech}/คน` : ''}`;
                  } else if (t.calcFormulaType === 'fixed_per_tech') {
                    detailBadge = `฿${t.fixedAmount ?? 250}/คน`;
                  } else if (t.calcFormulaType === 'fixed_per_job') {
                    detailBadge = `฿${t.fixedAmount ?? 0}/งาน`;
                  } else if (t.calcFormulaType === 'curtain_standard') {
                    detailBadge = `ฐาน ฿${t.baseAttendancePerTech ?? formData.baseTechPay ?? 250}/คน${(t.bonusAmount !== undefined && t.bonusAmount > 0) ? ` + โบนัส ฿${t.bonusAmount}` : (t.bonusAmount === 0 ? ' (โบนัส ฿0)' : '')}`;
                  } else if (t.calcFormulaType === 'free_no_pay') {
                    detailBadge = 'ไม่คิดเงิน (฿0)';
                  }

                  return (
                    <div
                      key={t.id}
                      className="p-3 bg-gray-50/80 border border-gray-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white hover:border-gray-300 transition-all shadow-2xs"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-gray-900 text-xs">{t.label}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-gray-200 text-gray-700">
                            หน่วย: {t.unitLabel || (t.unitType === 'sqm' ? 'ตร.ม.' : t.unitType === 'rails' ? 'ราง' : '-')}
                          </span>
                          {t.isSystem ? (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium border border-blue-100">
                              ระบบ
                            </span>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
                              กำหนดเอง
                            </span>
                          )}
                          {detailBadge && (
                            <span className="text-[10px] px-2 py-0.5 rounded-lg bg-amber-50 text-amber-900 font-bold border border-amber-200">
                              {detailBadge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500">
                          {t.description || `สูตร: ${t.calcFormulaType || 'มาตรฐาน'}`}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => setEditingJobType(t)}
                          className="px-2.5 py-1 text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-2xs"
                          title="แก้ไขประเภทงานและสูตรนี้"
                        >
                          <Pencil size={13} />
                          <span>แก้ไข</span>
                        </button>
                        {!t.isSystem && (
                          <button
                            type="button"
                            onClick={() => handleDeleteJobType(t.id)}
                            className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="ลบประเภทงานนี้"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'versions' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-gray-800 text-xs">ประวัติเวอร์ชันสูตรและการบังคับใช้ตามรอบ</h4>
                  <p className="text-[11px] text-gray-500">ระบบบันทึกเวอร์ชันสูตรอัตโนมัติ เพื่อให้ข้อมูลในอดีตคงเดิม</p>
                </div>
              </div>

              {ruleVersions.length === 0 ? (
                <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 space-y-2">
                  <Clock size={28} className="mx-auto text-gray-400" />
                  <div className="font-bold text-gray-700">ยังไม่มีการสร้างเวอร์ชันสูตรแยก</div>
                  <div className="text-gray-400 text-xs">
                    เมื่อคุณแก้ไขสูตรคำนวณและเลือก "เริ่มตั้งแต่รอบนี้เป็นต้นไป" หรือ "เฉพาะรอบนี้" ระบบจะสร้างเวอร์ชันให้อัตโนมัติ
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {ruleVersions.map(v => (
                    <div
                      key={v.id}
                      className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-xs">
                              {v.name || 'เวอร์ชันสูตร'}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              v.scope === 'specific_period_only'
                                ? 'bg-purple-100 text-purple-800'
                                : v.scope === 'from_period_onward'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {v.scope === 'specific_period_only'
                                ? 'เฉพาะรอบนี้'
                                : v.scope === 'from_period_onward'
                                ? 'ตั้งแต่รอบนี้เป็นต้นไป'
                                : 'ทุกรอบ'}
                            </span>
                          </div>
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            รอบ: {v.effectiveFromPeriodName || v.effectiveFromPeriodId} (เริ่มวันที่: {v.effectiveFromDate})
                          </div>
                        </div>

                        {onDeleteRuleVersion && (
                          <button
                            type="button"
                            onClick={() => onDeleteRuleVersion(v.id)}
                            className="p-1 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="ลบเวอร์ชันนี้"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>

                      <div className="bg-white p-2 rounded-lg border border-gray-100 text-[11px] text-gray-600 grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>ฐานช่าง: <b>฿{v.rules.baseTechPay}</b></div>
                        <div>งานวัด: <b>฿{v.rules.measureTechPay}</b></div>
                        <div>รางฟรี: <b>{v.rules.freeRailsThreshold}</b></div>
                        <div>ส่วนเกิน: <b>฿{v.rules.extraRailRate}</b></div>
                        <div>บันไดสูง: <b>฿{v.rules.highLadderBonus ?? 0}</b></div>
                        <div>นั่งร้าน: <b>฿{v.rules.scaffoldBonus ?? 0}</b></div>
                        <div>WallLinen: <b>฿{v.rules.wallLinenSqmRate}/ตร.ม.</b></div>
                        <div>WallMural: <b>฿{v.rules.wallMuralSqmRate}/ตร.ม.</b></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t shrink-0">
          <button
            type="button"
            onClick={handleResetDefault}
            className="text-gray-500 hover:text-gray-800 font-semibold flex items-center gap-1"
          >
            <RotateCcw size={13} />
            <span>คืนค่ามาตรฐานทั้งหมด</span>
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              style={{ backgroundColor: themeColor, color: themeTextColor }}
              className="px-5 py-1.5 rounded-xl font-bold shadow-md hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              <Check size={15} />
              <span>บันทึกและคำนวณยอดใหม่</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
