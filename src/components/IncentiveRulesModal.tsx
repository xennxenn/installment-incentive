import React, { useState } from 'react';
import { Sliders, X, Check, RotateCcw, Plus, Trash2, Tag, HelpCircle, Layers } from 'lucide-react';
import { IncentiveRules, JobTypeConfig, CalcFormulaType, UnitType } from '../types';
import { DEFAULT_INCENTIVE_RULES, JOB_TYPES } from '../data/initialData';

interface IncentiveRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: IncentiveRules;
  onSaveRules: (rules: IncentiveRules) => void;
  themeColor: string;
  themeTextColor: string;
}

export const IncentiveRulesModal: React.FC<IncentiveRulesModalProps> = ({
  isOpen,
  onClose,
  rules,
  onSaveRules,
  themeColor,
  themeTextColor
}) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'job_types'>('rules');
  const [formData, setFormData] = useState<IncentiveRules>(() => ({
    ...DEFAULT_INCENTIVE_RULES,
    ...rules,
    customJobTypes: rules.customJobTypes && rules.customJobTypes.length > 0 ? rules.customJobTypes : JOB_TYPES
  }));

  // State for creating a new custom job type
  const [newTypeLabel, setNewTypeLabel] = useState('');
  const [newTypeUnit, setNewTypeUnit] = useState<UnitType>('sqm');
  const [newTypeFormula, setNewTypeFormula] = useState<CalcFormulaType>('rate_per_sqm');
  const [newTypeRate, setNewTypeRate] = useState<number>(50);
  const [newTypeAttendance, setNewTypeAttendance] = useState<number>(0);
  const [newTypeFixed, setNewTypeFixed] = useState<number>(200);
  const [newTypeBonus, setNewTypeBonus] = useState<number>(100);
  const [newTypeDesc, setNewTypeDesc] = useState('');
  const [showAddTypeForm, setShowAddTypeForm] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveRules(formData);
    onClose();
  };

  const handleResetDefault = () => {
    setFormData(DEFAULT_INCENTIVE_RULES);
  };

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
    setFormData({
      ...formData,
      customJobTypes: [...currentTypes, newConfig]
    });

    // Reset
    setNewTypeLabel('');
    setNewTypeDesc('');
    setShowAddTypeForm(false);
  };

  const handleDeleteJobType = (id: string) => {
    const currentTypes = formData.customJobTypes || JOB_TYPES;
    setFormData({
      ...formData,
      customJobTypes: currentTypes.filter(t => t.id !== id)
    });
  };

  const currentJobTypes = formData.customJobTypes && formData.customJobTypes.length > 0
    ? formData.customJobTypes
    : JOB_TYPES;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-[100] p-4 no-print">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Sliders size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900">ตั้งค่าสูตร Incentive & ประเภทงาน</h3>
              <p className="text-[11px] text-gray-500">ปรับเปลี่ยนพารามิเตอร์การคำนวณและเพิ่มประเภทงานแบบไดนามิก</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b pb-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
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
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'job_types'
                ? 'bg-gray-900 text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Layers size={13} />
            <span>ประเภทงาน & สูตรคำนวณ ({currentJobTypes.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-4 text-xs">
          {activeTab === 'rules' ? (
            <form id="rules-form" onSubmit={handleSubmit} className="space-y-4">
              {/* Group 1: Standard Curtain Rates */}
              <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-200 space-y-3">
                <div className="font-bold text-gray-800 text-xs flex items-center gap-1.5 border-b border-gray-200/80 pb-1.5">
                  <span>1. งานผ้าม่านมาตรฐาน (Curtain Installation)</span>
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
                        onChange={e => setFormData({ ...formData, baseTechPay: Number(e.target.value) || 0 })}
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
                        onChange={e => setFormData({ ...formData, measureTechPay: Number(e.target.value) || 0 })}
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
                        onChange={e => setFormData({ ...formData, freeRailsThreshold: Number(e.target.value) || 0 })}
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
                        onChange={e => setFormData({ ...formData, extraRailRate: Number(e.target.value) || 0 })}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-[11px]">บาท/ราง</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      โบนัสติดตั้ง/บันไดสูง:
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min={0}
                        className="w-full border rounded-xl p-2 pr-10 font-bold text-sm text-gray-800 bg-white"
                        value={formData.highLadderBonus}
                        onChange={e => setFormData({ ...formData, highLadderBonus: Number(e.target.value) || 0 })}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-[11px]">บาท</span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      โบนัสติดตั้ง/นั่งร้าน:
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min={0}
                        className="w-full border rounded-xl p-2 pr-10 font-bold text-sm text-gray-800 bg-white"
                        value={formData.scaffoldBonus}
                        onChange={e => setFormData({ ...formData, scaffoldBonus: Number(e.target.value) || 0 })}
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
                        onChange={e => setFormData({ ...formData, wallLinenSqmRate: Number(e.target.value) || 0 })}
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
                        onChange={e => setFormData({ ...formData, wallLinenAttendancePay: Number(e.target.value) || 0 })}
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
                        onChange={e => setFormData({ ...formData, wallMuralSqmRate: Number(e.target.value) || 0 })}
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
                        onChange={e => setFormData({ ...formData, wallMuralAttendancePay: Number(e.target.value) || 0 })}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-[11px]">บาท/คน</span>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Job Types Management View */}
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-gray-800 text-xs">รายการประเภทงานทั้งหมด ({currentJobTypes.length})</h4>
                  <p className="text-[11px] text-gray-500">Super Admin สามารถเพิ่มประเภทงานและสูตรคำนวณแบบกำหนดเองได้</p>
                </div>
                {!showAddTypeForm && (
                  <button
                    type="button"
                    onClick={() => setShowAddTypeForm(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-xs transition-colors text-xs"
                  >
                    <Plus size={14} />
                    <span>เพิ่มประเภทงานใหม่</span>
                  </button>
                )}
              </div>

              {/* Add Job Type Form */}
              {showAddTypeForm && (
                <form onSubmit={handleAddJobType} className="bg-emerald-50/60 border border-emerald-200 p-3.5 rounded-xl space-y-3">
                  <div className="flex justify-between items-center border-b border-emerald-200 pb-1.5">
                    <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <Tag size={14} />
                      <span>สร้างประเภทงานและกำหนดสูตรคำนวณ</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddTypeForm(false)}
                      className="text-emerald-700 hover:text-emerald-900 font-semibold"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">ชื่อประเภทงาน:</label>
                      <input
                        type="text"
                        required
                        placeholder="เช่น ติดตั้งฟิล์มกรองแสง, ซักผ้าม่าน"
                        value={newTypeLabel}
                        onChange={e => setNewTypeLabel(e.target.value)}
                        className="w-full border rounded-xl p-2 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">หน่วยนับปริมาณงาน:</label>
                      <select
                        value={newTypeUnit}
                        onChange={e => setNewTypeUnit(e.target.value as UnitType)}
                        className="w-full border rounded-xl p-2 bg-white font-semibold"
                      >
                        <option value="sqm">ตารางเมตร (ตร.ม.) - รองรับทศนิยม 1 ตำแหน่ง</option>
                        <option value="rails">ราง (รางผ้าม่าน)</option>
                        <option value="fixed">เหมาจ่าย / งาน</option>
                        <option value="none">ไม่ระบุหน่วย</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">รูปแบบสูตรคำนวณ:</label>
                      <select
                        value={newTypeFormula}
                        onChange={e => setNewTypeFormula(e.target.value as CalcFormulaType)}
                        className="w-full border rounded-xl p-2 bg-white font-semibold"
                      >
                        <option value="rate_per_sqm">ตามจำนวน ตร.ม. (ตร.ม. × อัตรา) + ค่าเข้างาน</option>
                        <option value="rate_per_unit">ตามจำนวนหน่วย (จำนวน × อัตรา) + ค่าเข้างาน</option>
                        <option value="curtain_standard">สูตรผ้าม่านมาตรฐาน (ฐานช่าง + รางเกิน + โบนัส)</option>
                        <option value="fixed_per_tech">เหมาจ่ายต่อคน (เช่น __ บาท/ช่าง 1 คน)</option>
                        <option value="fixed_per_job">เหมาจ่ายรวมทั้งงาน (หารแบ่งช่างทุกคน)</option>
                        <option value="free_no_pay">งานฟรี / วันเดินทาง (0 บาท)</option>
                      </select>
                    </div>

                    {(newTypeFormula === 'rate_per_sqm' || newTypeFormula === 'rate_per_unit') && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">ราคาต่อหน่วย:</label>
                          <input
                            type="number"
                            min={0}
                            value={newTypeRate}
                            onChange={e => setNewTypeRate(Number(e.target.value) || 0)}
                            className="w-full border rounded-xl p-2 bg-white font-bold"
                          />
                        </div>
                        <div>
                          <label className="block font-bold text-gray-700 mb-1">ค่าเข้างาน/คน:</label>
                          <input
                            type="number"
                            min={0}
                            value={newTypeAttendance}
                            onChange={e => setNewTypeAttendance(Number(e.target.value) || 0)}
                            className="w-full border rounded-xl p-2 bg-white font-bold"
                          />
                        </div>
                      </div>
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
              <div className="space-y-2">
                {currentJobTypes.map(t => (
                  <div
                    key={t.id}
                    className="p-3 bg-gray-50/70 border border-gray-200 rounded-xl flex items-center justify-between gap-3 hover:bg-white transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-xs">{t.label}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-gray-200 text-gray-700">
                          หน่วย: {t.unitLabel || (t.unitType === 'sqm' ? 'ตร.ม.' : t.unitType === 'rails' ? 'ราง' : '-')}
                        </span>
                        {t.isSystem ? (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                            ระบบ
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                            กำหนดเอง
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {t.description || `สูตร: ${t.calcFormulaType || 'มาตรฐาน'}`}
                      </p>
                    </div>

                    {!t.isSystem && (
                      <button
                        type="button"
                        onClick={() => handleDeleteJobType(t.id)}
                        className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="ลบประเภทงานนี้"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
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
              className="px-5 py-1.5 rounded-xl font-bold shadow-md hover:opacity-90 transition-opacity flex items-center gap-1"
            >
              <Check size={14} />
              <span>บันทึกการตั้งค่า</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

