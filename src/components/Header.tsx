import React, { useState } from 'react';
import { 
  BarChart3, FileText, Users, Calendar, FileSpreadsheet, Shield, 
  Printer, LogOut, FolderPlus, X, Pencil, Sparkles, Sliders
} from 'lucide-react';
import { AppUser, PayPeriod } from '../types';
import { getAutoPeriodForMonth } from '../utils/periodUtils';

interface HeaderProps {
  currentUser: AppUser;
  period: PayPeriod;
  setPeriod: (period: PayPeriod) => void;
  savedPeriods: PayPeriod[];
  onSavePeriod: (name: string, start?: string, end?: string) => void;
  onUpdatePeriod: (period: PayPeriod) => void;
  onDeletePeriod: (id: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  themeColor: string;
  themeTextColor: string;
  onLogout: () => void;
  onOpenRulesModal: () => void;
}

const MAIN_TABS = [
  { id: 'dashboard', icon: BarChart3, label: 'ภาพรวม (Dashboard)' },
  { id: 'jobs', icon: FileText, label: 'บันทึกงาน (Jobs)' },
  { id: 'teams', icon: Users, label: 'ทีมช่าง (Teams)' },
  { id: 'calendar', icon: Calendar, label: 'ปฏิทินวันลา (Calendar)' },
  { id: 'reports', icon: FileSpreadsheet, label: 'รายงาน (Reports)' }
];

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  period,
  setPeriod,
  savedPeriods,
  onSavePeriod,
  onUpdatePeriod,
  onDeletePeriod,
  activeTab,
  setActiveTab,
  themeColor,
  themeTextColor,
  onLogout,
  onOpenRulesModal
}) => {
  const safePeriod = (period && period.start && period.end) ? period : { id: 'default', name: 'รอบปัจจุบัน', start: '2026-01-01', end: '2026-01-31' };
  const safeSavedPeriods = Array.isArray(savedPeriods) ? savedPeriods.filter(Boolean) : [];

  const [showPeriodManager, setShowPeriodManager] = useState(false);
  const [newPeriodName, setNewPeriodName] = useState('');
  const [newPeriodStart, setNewPeriodStart] = useState(safePeriod.start);
  const [newPeriodEnd, setNewPeriodEnd] = useState(safePeriod.end);
  const [editingPeriod, setEditingPeriod] = useState<PayPeriod | null>(null);

  const visibleTabs = [...MAIN_TABS];
  if (currentUser?.role === 'super_admin') {
    visibleTabs.push({ id: 'admin', icon: Shield, label: 'ผู้ดูแล (Admin)' });
  }

  const applyPreset = (monthOffset: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + monthOffset);
    const autoP = getAutoPeriodForMonth(d.getFullYear(), d.getMonth());

    setNewPeriodName(autoP.name);
    setNewPeriodStart(autoP.start);
    setNewPeriodEnd(autoP.end);
  };

  const handleSave = () => {
    const nameToUse = newPeriodName.trim() || 'รอบคำนวณใหม่';
    const startToUse = newPeriodStart || period?.start || '2026-01-01';
    const endToUse = newPeriodEnd || period?.end || '2026-01-31';
    onSavePeriod(nameToUse, startToUse, endToUse);
    setNewPeriodName('');
  };

  const handleUpdate = () => {
    if (editingPeriod && (editingPeriod.name || '').trim()) {
      onUpdatePeriod(editingPeriod);
      setEditingPeriod(null);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50 no-print shadow-sm">
      <div className="w-full px-3 md:px-6 py-3">
        {/* Top bar */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm"
              style={{ backgroundColor: themeColor, color: themeTextColor }}
            >
              P
            </div>
            <div>
              <h1 className="font-extrabold text-base md:text-lg text-gray-900 tracking-tight leading-tight">
                PASAYA Curtain Incentive System
              </h1>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Realtime Cloud Sync</span>
                </div>
                <span>ผู้ใช้งาน: <strong className="text-gray-700">{currentUser?.name || currentUser?.username || 'ผู้ใช้'}</strong> ({currentUser?.role || 'admin'})</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenRulesModal}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
            >
              <Sliders size={14} className="text-gray-500" />
              <span>สูตรคำนวณ</span>
            </button>
            <button
              onClick={() => window.print()}
              style={{ backgroundColor: themeColor, color: themeTextColor }}
              className="px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 hover:opacity-90 text-xs font-semibold shadow-sm transition-all"
            >
              <Printer size={14} />
              <span>พิมพ์</span>
            </button>
            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold transition-colors"
            >
              <LogOut size={14} />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>

        {/* Bottom bar: Period Selector + Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100">
          {/* Period Picker */}
          <div className="relative flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1">เลือกรอบคำนวณ:</span>
            
            {/* Direct select dropdown */}
            <select
              value={safeSavedPeriods.some(p => p && p.id === safePeriod.id) ? safePeriod.id : (safePeriod?.name === 'กำหนดเอง' ? 'custom' : safePeriod.id || 'custom')}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'manage') {
                  setShowPeriodManager(true);
                } else if (val !== 'custom') {
                  const found = safeSavedPeriods.find(p => p && p.id === val);
                  if (found) setPeriod(found);
                }
              }}
              className="bg-white border border-gray-300 rounded-lg text-xs font-extrabold px-2 py-1 cursor-pointer focus:ring-2 focus:ring-gray-300 transition-colors shadow-2xs max-w-[180px] truncate"
              style={{ color: themeColor }}
            >
              {safeSavedPeriods.map((p, idx) => (
                <option key={p?.id || idx} value={p?.id}>
                  {p?.name || 'รอบคำนวณ'} ({p?.start || ''} ถึง {p?.end || ''})
                </option>
              ))}
              {!safeSavedPeriods.some(p => p && p.id === safePeriod.id) && (
                <option value="custom">
                  {safePeriod?.name || 'กำหนดเอง'} ({safePeriod?.start || ''} ถึง {safePeriod?.end || ''})
                </option>
              )}
              <option value="manage" className="font-bold text-blue-600">+ เพิ่ม / จัดการรอบคำนวณ...</option>
            </select>

            <input
              type="date"
              value={safePeriod.start}
              onChange={e => {
                const newStart = e.target.value;
                setPeriod({
                  id: safePeriod.id || `p-${Date.now()}`,
                  name: 'กำหนดเอง',
                  start: newStart,
                  end: safePeriod.end || newStart
                });
              }}
              className="bg-white border border-gray-200 rounded-md text-xs px-2 py-1 font-medium text-gray-700"
            />
            <span className="text-gray-400 text-xs">-</span>
            <input
              type="date"
              value={safePeriod.end}
              onChange={e => {
                const newEnd = e.target.value;
                setPeriod({
                  id: safePeriod.id || `p-${Date.now()}`,
                  name: 'กำหนดเอง',
                  start: safePeriod.start || newEnd,
                  end: newEnd
                });
              }}
              className="bg-white border border-gray-200 rounded-md text-xs px-2 py-1 font-medium text-gray-700"
            />

            <button
              onClick={() => setShowPeriodManager(!showPeriodManager)}
              className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 flex items-center gap-1 transition-colors shadow-2xs"
              title="จัดการรอบคำนวณ"
            >
              <FolderPlus size={14} className="text-gray-600" />
              <span>จัดการรอบ</span>
            </button>

            {/* Saved periods dropdown modal */}
            {showPeriodManager && (
              <div className="absolute top-full left-0 mt-2 w-96 bg-white border border-gray-200 shadow-2xl rounded-2xl z-50 p-4 space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-sm text-gray-800">
                    <Calendar size={16} className="text-gray-600" />
                    <span>จัดการรอบคำนวณ</span>
                  </div>
                  <button onClick={() => setShowPeriodManager(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={18} />
                  </button>
                </div>

                {/* Form to Add New Period */}
                <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-700">เพิ่มรอบคำนวณใหม่</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => applyPreset(0)}
                        className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] text-gray-600 hover:bg-gray-100"
                      >
                        เดือนนี้
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset(1)}
                        className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] text-gray-600 hover:bg-gray-100"
                      >
                        เดือนถัดไป
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset(-1)}
                        className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-[10px] text-gray-600 hover:bg-gray-100"
                      >
                        เดือนก่อน
                      </button>
                    </div>
                  </div>

                  <div>
                    <input
                      className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-gray-400 bg-white"
                      placeholder="ชื่อรอบคำนวณ (เช่น รอบ ก.ค. 2569)"
                      value={newPeriodName}
                      onChange={e => setNewPeriodName(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-400 block mb-0.5">วันที่เริ่ม</label>
                      <input
                        type="date"
                        className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white"
                        value={newPeriodStart}
                        onChange={e => setNewPeriodStart(e.target.value)}
                      />
                    </div>
                    <span className="text-gray-400 text-xs self-end pb-1.5">-</span>
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-400 block mb-0.5">วันที่สิ้นสุด</label>
                      <input
                        type="date"
                        className="w-full border border-gray-200 rounded-lg px-2 py-1 text-xs bg-white"
                        value={newPeriodEnd}
                        onChange={e => setNewPeriodEnd(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      handleSave();
                      setShowPeriodManager(false);
                    }}
                    style={{ backgroundColor: themeColor, color: themeTextColor }}
                    className="w-full py-1.5 rounded-lg text-xs font-bold hover:opacity-90 transition-opacity shadow-sm mt-1"
                  >
                    + บันทึกและเลือกใช้รอบนี้
                  </button>
                </div>

                {/* Saved Periods List */}
                <div>
                  <h5 className="font-bold text-xs text-gray-700 mb-2">รอบคำนวณที่บันทึกไว้ ({safeSavedPeriods.length})</h5>
                  <ul className="max-h-40 overflow-y-auto space-y-1.5 text-xs pr-1">
                    {safeSavedPeriods.map((p, idx) => (
                      <li key={p.id || idx} className={`flex items-center justify-between p-2 rounded-xl border ${safePeriod.id === p.id ? 'border-blue-300 bg-blue-50/50' : 'border-gray-100 hover:bg-gray-50'}`}>
                        {editingPeriod?.id === p?.id ? (
                          <div className="space-y-1.5 w-full" onClick={e => e.stopPropagation()}>
                            <input
                              className="border rounded px-2 py-1 text-xs w-full font-bold text-gray-800"
                              value={editingPeriod?.name || ''}
                              onChange={e => setEditingPeriod(prev => prev ? { ...prev, name: e.target.value } : null)}
                            />
                            <div className="flex items-center gap-1">
                              <input
                                type="date"
                                className="border rounded px-1 py-0.5 text-xs flex-1"
                                value={editingPeriod?.start || ''}
                                onChange={e => setEditingPeriod(prev => prev ? { ...prev, start: e.target.value } : null)}
                              />
                              <span className="text-gray-400">-</span>
                              <input
                                type="date"
                                className="border rounded px-1 py-0.5 text-xs flex-1"
                                value={editingPeriod?.end || ''}
                                onChange={e => setEditingPeriod(prev => prev ? { ...prev, end: e.target.value } : null)}
                              />
                            </div>
                            <div className="flex gap-1 justify-end pt-1">
                              <button onClick={handleUpdate} className="bg-emerald-600 text-white px-2 py-0.5 rounded text-xs font-bold">บันทึก</button>
                              <button onClick={() => setEditingPeriod(null)} className="bg-gray-200 px-2 py-0.5 rounded text-xs">ยกเลิก</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => { setPeriod(p); setShowPeriodManager(false); }}
                              className="text-left font-medium text-gray-700 hover:text-blue-600 flex-1"
                            >
                              <div className="font-bold text-xs text-gray-800 flex items-center gap-1.5">
                                <span>{p?.name || ''}</span>
                                {safePeriod?.id === p?.id && (
                                  <span className="text-[10px] bg-blue-600 text-white px-1.5 py-0.2 rounded-full font-bold">ใช้งานอยู่</span>
                                )}
                              </div>
                              <div className="text-[10px] text-gray-500 mt-0.5">{p?.start} ถึง {p?.end}</div>
                            </button>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); setEditingPeriod(p); }}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-white rounded-md"
                                title="แก้ไข"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); p.id && onDeletePeriod(p.id); }}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-white rounded-md"
                                title="ลบ"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          </>
                        )}
                      </li>
                    ))}
                    {safeSavedPeriods.length === 0 && (
                      <p className="text-gray-400 text-center py-3 text-xs">ไม่มีรอบที่บันทึกไว้</p>
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200 overflow-x-auto">
            {visibleTabs.map(t => {
              const IconComponent = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    isActive ? 'shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                  style={isActive ? { backgroundColor: themeColor, color: themeTextColor } : {}}
                >
                  <IconComponent size={14} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
