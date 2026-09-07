import React, { useState, useRef } from 'react';
import { 
  Shield, Palette, UserPlus, Trash2, Database, RefreshCw, Key, UserCheck, AlertTriangle,
  Cloud, Download, Upload, History, Camera, CheckCircle2, RotateCcw, Clock, Calendar,
  Play, Sparkles, Filter, Search, Check, AlertCircle
} from 'lucide-react';
import { AppUser, Role, AutoBackupConfig, BackupInterval } from '../types';
import { SnapshotSummary } from '../utils/firebaseSync';

interface AdminSettingsProps {
  currentUser: AppUser;
  appUsers: AppUser[];
  onAddUser: (user: Omit<AppUser, 'id'>) => void;
  onRemoveUser: (id: string, username: string) => void;
  themeColor: string;
  onSaveTheme: (color: string) => void;
  onCleanGhostData: () => void;
  onResetData: () => void;
  periodStart: string;
  periodEnd: string;
  onClearPeriodData: () => void;
  onExportBackupJSON: () => void;
  onImportBackupJSON: (file: File) => Promise<void>;
  onCreateCloudSnapshot: (label: string) => Promise<void>;
  snapshots: SnapshotSummary[];
  onRestoreSnapshot: (id: string) => Promise<void>;
  isLoadingSnapshots?: boolean;
  autoBackupConfig: AutoBackupConfig;
  onUpdateAutoBackupConfig: (config: AutoBackupConfig) => void;
  onDeleteSnapshot?: (id: string) => Promise<void>;
  onTriggerAutoBackupNow?: () => Promise<void>;
}

const COLOR_PRESETS = [
  '#424242', // Graphite Dark Gray
  '#1e3a8a', // Deep Royal Blue
  '#065f46', // Deep Emerald Green
  '#7c2d12', // Rich Terracotta / Amber Brown
  '#581c87', // Deep Purple
  '#0f172a'  // Midnight Navy
];

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  currentUser,
  appUsers,
  onAddUser,
  onRemoveUser,
  themeColor,
  onSaveTheme,
  onCleanGhostData,
  onResetData,
  periodStart,
  periodEnd,
  onClearPeriodData,
  onExportBackupJSON,
  onImportBackupJSON,
  onCreateCloudSnapshot,
  snapshots,
  onRestoreSnapshot,
  isLoadingSnapshots = false,
  autoBackupConfig,
  onUpdateAutoBackupConfig,
  onDeleteSnapshot,
  onTriggerAutoBackupNow
}) => {
  const [selectedColor, setSelectedColor] = useState(themeColor);
  const [snapshotLabel, setSnapshotLabel] = useState('');
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isTriggeringBackup, setIsTriggeringBackup] = useState(false);
  const [snapshotFilter, setSnapshotFilter] = useState<'all' | 'auto_hourly' | 'auto_daily' | 'auto_weekly' | 'safety' | 'manual'>('all');
  const [snapshotSearch, setSnapshotSearch] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  const handleCreateSnapshotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingSnapshot(true);
    try {
      await onCreateCloudSnapshot(snapshotLabel.trim() || 'สำรองข้อมูลด้วยตนเอง');
      setSnapshotLabel('');
      showStatus('บันทึกจุดสำรองข้อมูลบน Cloud เรียบร้อยแล้ว');
    } catch (err: any) {
      showStatus('เกิดข้อผิดพลาดในการสร้างจุดสำรองข้อมูล: ' + (err?.message || ''), 'error');
    } finally {
      setIsCreatingSnapshot(false);
    }
  };

  const handleTriggerBackupClick = async () => {
    if (!onTriggerAutoBackupNow) return;
    setIsTriggeringBackup(true);
    try {
      await onTriggerAutoBackupNow();
      showStatus('สำรองข้อมูลขึ้น Cloud สำเร็จเรียบร้อย');
    } catch (err: any) {
      showStatus('ไม่สามารถสำรองข้อมูลได้: ' + (err?.message || ''), 'error');
    } finally {
      setIsTriggeringBackup(false);
    }
  };

  const handleDeleteSnapshotClick = async (snapshot: SnapshotSummary) => {
    if (!onDeleteSnapshot) return;
    if (!window.confirm(`ยืนยันการลบจุดสำรองข้อมูล:\n"${snapshot.label}"\nวันที่: ${snapshot.dateStr}\n\nการลบจุดสำรองนี้จะไม่กระทบกับข้อมูลปัจจุบันในระบบ ยืนยันหรือไม่?`)) {
      return;
    }
    try {
      await onDeleteSnapshot(snapshot.id);
      showStatus(`ลบจุดสำรอง "${snapshot.label}" เรียบร้อย`);
    } catch (err: any) {
      showStatus('ไม่สามารถลบจุดสำรองได้: ' + (err?.message || ''), 'error');
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm(`ยืนยันการนำเข้าและกู้คืนข้อมูลจากไฟล์ "${file.name}" ใช่หรือไม่?\nข้อมูลที่มีอยู่ในระบบจะถูกแทนที่ด้วยข้อมูลจากไฟล์สำรองนี้`)) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsImporting(true);
    try {
      await onImportBackupJSON(file);
      showStatus('กู้คืนข้อมูลจากไฟล์ JSON สำเร็จเรียบร้อย');
    } catch (err: any) {
      showStatus('เกิดข้อผิดพลาดในการกู้คืนไฟล์: ' + (err?.message || ''), 'error');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRestoreClick = async (snapshot: SnapshotSummary) => {
    if (!window.confirm(`ยืนยันการกู้คืนข้อมูลย้อนกลับไปยัง:\n"${snapshot.label}"\nวันที่สำรอง: ${snapshot.dateStr}\n(ข้อมูลงาน: ${snapshot.jobsCount} รายการ, ทีมช่าง: ${snapshot.teamsCount} ทีม)\n\nระบบจะสร้างจุดสำรองความปลอดภัยของข้อมูลปัจจุบันให้ก่อนเสมอ แล้วจึงกู้คืนข้อมูลชุดนี้ขึ้น Cloud ทันที`)) {
      return;
    }

    try {
      await onRestoreSnapshot(snapshot.id);
      showStatus(`กู้คืนข้อมูลย้อนกลับไปยังจุด "${snapshot.label}" (${snapshot.dateStr}) สำเร็จ`);
    } catch (err: any) {
      showStatus('ไม่สามารถกู้คืนข้อมูลได้: ' + (err?.message || ''), 'error');
    }
  };

  const getBackupTypeBadge = (type?: string) => {
    switch (type) {
      case 'auto_hourly':
        return { label: 'ทุก 1 ชม.', bg: 'bg-cyan-50 text-cyan-700 border-cyan-200' };
      case 'auto_daily':
        return { label: 'ทุก 1 วัน', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'auto_weekly':
        return { label: 'ทุก 1 สัปดาห์', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'safety':
        return { label: 'ฉุกเฉิน/ก่อนรีเซ็ต', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      default:
        return { label: 'บันทึกเอง', bg: 'bg-gray-100 text-gray-700 border-gray-200' };
    }
  };

  const filteredSnapshots = (snapshots || []).filter(s => {
    if (snapshotFilter !== 'all') {
      if (snapshotFilter === 'auto_hourly' && s.backupType !== 'auto_hourly') return false;
      if (snapshotFilter === 'auto_daily' && s.backupType !== 'auto_daily') return false;
      if (snapshotFilter === 'auto_weekly' && s.backupType !== 'auto_weekly') return false;
      if (snapshotFilter === 'safety' && s.backupType !== 'safety') return false;
      if (snapshotFilter === 'manual' && s.backupType !== 'manual') return false;
    }
    if (snapshotSearch.trim()) {
      const q = snapshotSearch.toLowerCase();
      const matchesLabel = (s.label || '').toLowerCase().includes(q);
      const matchesDate = (s.dateStr || '').toLowerCase().includes(q);
      return matchesLabel || matchesDate;
    }
    return true;
  });
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    name: '',
    role: 'admin' as Role
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if ((newUser.username || '').trim() && (newUser.password || '').trim()) {
      onAddUser({
        username: newUser.username.trim(),
        password: newUser.password.trim(),
        name: (newUser.name || '').trim() || newUser.username.trim(),
        role: newUser.role
      });
      setNewUser({ username: '', password: '', name: '', role: 'admin' });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-1">
          <Shield className="text-blue-600" size={20} />
          <span>การตั้งค่าผู้ดูแลระบบ (Super Admin Console)</span>
        </h2>
        <p className="text-xs text-gray-500 mb-6">
          จัดการสีธีมแอปพลิเคชัน บัญชีผู้ใช้งานระบบ และเครื่องมือบำรุงรักษาฐานข้อมูล
        </p>

        {/* 1. Theme Palette Customization */}
        <div className="mb-8 pb-6 border-b border-gray-100">
          <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2 mb-3">
            <Palette size={16} className="text-purple-600" />
            <span>ปรับแต่งโทนสีธีมหลักของแอปพลิเคชัน</span>
          </h3>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="color"
                value={selectedColor}
                onChange={e => setSelectedColor(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border border-gray-300"
              />
              <input
                type="text"
                value={selectedColor}
                onChange={e => setSelectedColor(e.target.value)}
                className="border rounded-lg p-2 w-28 text-xs font-mono uppercase font-bold text-center bg-white"
                maxLength={7}
              />

              <div className="flex items-center gap-1.5 ml-2">
                {COLOR_PRESETS.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    style={{ backgroundColor: color }}
                    className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                      selectedColor === color ? 'border-amber-400 scale-110 shadow-sm' : 'border-white'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-gray-200/60">
              <p className="text-[11px] text-gray-500">
                สีที่เลือกจะถูกบันทึกและปรับใช้เป็นธีมหลักของแถบเมนูและปุ่มกดทั้งหมด
              </p>
              <button
                onClick={() => onSaveTheme(selectedColor)}
                className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-colors"
              >
                บันทึกเปลี่ยนสีธีม
              </button>
            </div>
          </div>
        </div>

        {/* 2. User Accounts Management */}
        <div className="mb-8 pb-6 border-b border-gray-100">
          <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2 mb-3">
            <UserCheck size={16} className="text-emerald-600" />
            <span>การจัดการผู้ใช้งานเข้าระบบ (App Users)</span>
          </h3>

          <form onSubmit={handleCreateUser} className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3 mb-4">
            <div className="font-bold text-xs text-gray-700 flex items-center gap-1.5">
              <UserPlus size={14} />
              <span>เพิ่มผู้ใช้งานใหม่</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <input
                type="text"
                placeholder="Username"
                required
                className="border rounded-lg px-3 py-1.5 text-xs bg-white font-medium focus:outline-none focus:ring-2 focus:ring-gray-300"
                value={newUser.username}
                onChange={e => setNewUser({ ...newUser, username: e.target.value })}
              />
              <input
                type="password"
                placeholder="Password"
                required
                className="border rounded-lg px-3 py-1.5 text-xs bg-white font-medium focus:outline-none focus:ring-2 focus:ring-gray-300"
                value={newUser.password}
                onChange={e => setNewUser({ ...newUser, password: e.target.value })}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                placeholder="ชื่อแสดงผล (Display Name) เช่น ผู้จัดการแผนก"
                className="flex-1 border rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-gray-300"
                value={newUser?.name || ''}
                onChange={e => setNewUser({ ...newUser, name: e.target.value })}
              />
              <select
                className="border rounded-lg px-3 py-1.5 text-xs bg-white font-semibold"
                value={newUser.role}
                onChange={e => setNewUser({ ...newUser, role: e.target.value as Role })}
              >
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-colors"
              >
                เพิ่มผู้ใช้
              </button>
            </div>
          </form>

          {/* User List */}
          <div className="space-y-2">
            {(appUsers || []).filter(Boolean).map(user => (
              <div
                key={user.id}
                className="flex justify-between items-center p-3 bg-white rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <div className="text-xs font-bold text-gray-800">
                    {user.username}{' '}
                    <span className="text-gray-400 font-normal">({user.name || user.username})</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                        user.role === 'super_admin'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {user.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      รหัสผ่าน: {user.password || '••••••••'}
                    </span>
                  </div>
                </div>

                {user.username !== 'T58121' && user.username !== currentUser?.username && (
                  <button
                    onClick={() => onRemoveUser(user.id, user.username)}
                    className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="ลบผู้ใช้"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 3. Professional Automated Cloud Backup & Recovery Vault */}
        <div className="mb-8 pb-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <Database size={17} className="text-emerald-600" />
              <span>ระบบสำรองข้อมูลอัตโนมัติขึ้น Cloud (Automated Cloud Backup & Disaster Recovery)</span>
            </h3>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <Cloud size={12} />
              <span>Cloud Protection Active</span>
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            ระบบจะสำรองข้อมูลงาน รายชื่อทีมช่าง วันลา และการคำนวณทั้งหมดขึ้น Cloud แบบอัตโนมัติตามรอบเวลาที่เลือก พร้อมทั้งสามารถเลือกเรียกคืนข้อมูลย้อนหลังจากไฟล์ใดก็ได้โดยมีวันเวลาที่สำรองกำกับไว้อย่างชัดเจน
          </p>

          <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-5">
            {/* Automated Backup Settings Panel */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                    autoBackupConfig?.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <Clock size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 flex items-center gap-2">
                      <span>การสำรองข้อมูลอัตโนมัติ (Automated Cloud Backup)</span>
                      <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
                        autoBackupConfig?.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {autoBackupConfig?.enabled ? 'เปิดทำงาน' : 'ปิดใช้งาน'}
                      </span>
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      {autoBackupConfig?.lastBackupDateStr 
                        ? `สำรองข้อมูลล่าสุดเมื่อ: ${autoBackupConfig.lastBackupDateStr}`
                        : 'ยังไม่มีประวัติการสำรองอัตโนมัติในรอบนี้'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTriggerBackupClick}
                    disabled={isTriggeringBackup}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    title="สั่งสำรองข้อมูลขึ้น Cloud ทันทีตอนนี้"
                  >
                    <RefreshCw size={13} className={isTriggeringBackup ? 'animate-spin' : ''} />
                    <span>{isTriggeringBackup ? 'กำลังสำรองข้อมูล...' : 'สำรองขึ้น Cloud ตอนนี้'}</span>
                  </button>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoBackupConfig?.enabled ?? true}
                      onChange={e => onUpdateAutoBackupConfig({
                        ...autoBackupConfig,
                        enabled: e.target.checked
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>

              {/* Frequency Selection */}
              <div className="mt-3.5">
                <label className="block text-[11px] font-bold text-gray-700 mb-2">
                  เลือกความถี่ในการสำรองข้อมูลอัตโนมัติ (Backup Frequency):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => onUpdateAutoBackupConfig({
                      ...autoBackupConfig,
                      interval: 'hourly'
                    })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      autoBackupConfig?.interval === 'hourly'
                        ? 'bg-blue-50/80 border-blue-500 shadow-2xs ring-1 ring-blue-400'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <Clock size={14} className="text-blue-600" />
                        <span>ทุก 1 ชั่วโมง</span>
                      </span>
                      {autoBackupConfig?.interval === 'hourly' && (
                        <CheckCircle2 size={15} className="text-blue-600" />
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500">
                      สำรองทุกๆ 60 นาที เหมาะสำหรับช่วงที่มีการบันทึกงานใหม่ตลอดเวลา
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateAutoBackupConfig({
                      ...autoBackupConfig,
                      interval: 'daily'
                    })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      autoBackupConfig?.interval === 'daily'
                        ? 'bg-emerald-50/80 border-emerald-500 shadow-2xs ring-1 ring-emerald-400'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <Calendar size={14} className="text-emerald-600" />
                        <span>ทุก 1 วัน</span>
                        <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">แนะนำ</span>
                      </span>
                      {autoBackupConfig?.interval === 'daily' && (
                        <CheckCircle2 size={15} className="text-emerald-600" />
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500">
                      สำรองทุกๆ 24 ชั่วโมง ช่วยเก็บสำเนาสรุปยอดงานประจำวันอย่างปลอดภัย
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => onUpdateAutoBackupConfig({
                      ...autoBackupConfig,
                      interval: 'weekly'
                    })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      autoBackupConfig?.interval === 'weekly'
                        ? 'bg-indigo-50/80 border-indigo-500 shadow-2xs ring-1 ring-indigo-400'
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <Calendar size={14} className="text-indigo-600" />
                        <span>ทุก 1 สัปดาห์</span>
                      </span>
                      {autoBackupConfig?.interval === 'weekly' && (
                        <CheckCircle2 size={15} className="text-indigo-600" />
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500">
                      สำรองทุกๆ 7 วัน เหมาะสำหรับการเก็บประวัติรายงวดคำนวณเงิน
                    </p>
                  </button>
                </div>
              </div>
            </div>

            {/* Offline Dual-Protection: Export JSON & Import JSON */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-white border border-gray-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold">
                    <Download size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">ดาวน์โหลดไฟล์สำรองทั้งหมด (JSON Backup)</h4>
                    <p className="text-[11px] text-gray-500">สำรองไฟล์เก็บไว้ในคอมพิวเตอร์แบบ Offline อีก 1 ชั้น</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onExportBackupJSON}
                  className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <Download size={14} />
                  <span>ดาวน์โหลดไฟล์สำรองข้อมูล (.json)</span>
                </button>
              </div>

              <div className="p-3 bg-white border border-gray-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                    <Upload size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">กู้คืนข้อมูลจากไฟล์สำรอง (Restore from JSON)</h4>
                    <p className="text-[11px] text-gray-500">เลือกไฟล์ .json ที่เคยดาวน์โหลดไว้เพื่อกู้คืนข้อมูลเดิม</p>
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  onChange={handleFileSelected}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isImporting}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <Upload size={14} />
                  <span>{isImporting ? 'กำลังนำเข้าและกู้คืน...' : 'เลือกไฟล์ .json เพื่อกู้คืน'}</span>
                </button>
              </div>
            </div>

            {/* Manual Cloud Snapshot Creation */}
            <div className="pt-2 border-t border-gray-200">
              <form onSubmit={handleCreateSnapshotSubmit} className="flex flex-wrap items-center gap-2">
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    placeholder="พิมพ์ชื่อจุดสำรองฉุกเฉิน (เช่น ก่อนปรับยอดเดือนมีนาคม, สำรองก่อนแก้ไขใหญ่)"
                    value={snapshotLabel}
                    onChange={e => setSnapshotLabel(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isCreatingSnapshot}
                  className="bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Camera size={14} />
                  <span>{isCreatingSnapshot ? 'กำลังบันทึก...' : 'บันทึกจุดสำรองกำหนดเอง'}</span>
                </button>
              </form>
            </div>

            {/* Snapshots History & Selection Table */}
            <div className="pt-3 border-t border-gray-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <History size={15} className="text-blue-600" />
                    <span>คลังจุดสำรองข้อมูลบน Cloud (Cloud Snapshot Vault & Restore)</span>
                  </h4>
                  <p className="text-[11px] text-gray-500">
                    เลือกเรียกคืนข้อมูลจากจุดสำรองใดก็ได้ โดยแต่ละไฟล์มีวันและเวลาที่สำรองกำกับไว้อย่างชัดเจน
                  </p>
                </div>
                <span className="text-[11px] font-bold text-gray-600 bg-gray-200/80 px-2.5 py-0.5 rounded-full">
                  ทั้งหมด {snapshots.length} รายการ
                </span>
              </div>

              {/* Filter Tabs and Search Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSnapshotFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                      snapshotFilter === 'all'
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    ทั้งหมด ({snapshots.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSnapshotFilter('auto_hourly')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                      snapshotFilter === 'auto_hourly'
                        ? 'bg-cyan-700 text-white'
                        : 'bg-white text-cyan-800 hover:bg-cyan-50 border border-cyan-200'
                    }`}
                  >
                    ทุก 1 ชม. ({snapshots.filter(s => s.backupType === 'auto_hourly').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSnapshotFilter('auto_daily')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                      snapshotFilter === 'auto_daily'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-200'
                    }`}
                  >
                    ทุก 1 วัน ({snapshots.filter(s => s.backupType === 'auto_daily').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSnapshotFilter('auto_weekly')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                      snapshotFilter === 'auto_weekly'
                        ? 'bg-indigo-700 text-white'
                        : 'bg-white text-indigo-800 hover:bg-indigo-50 border border-indigo-200'
                    }`}
                  >
                    ทุก 1 สัปดาห์ ({snapshots.filter(s => s.backupType === 'auto_weekly').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSnapshotFilter('safety')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                      snapshotFilter === 'safety'
                        ? 'bg-amber-700 text-white'
                        : 'bg-white text-amber-800 hover:bg-amber-50 border border-amber-200'
                    }`}
                  >
                    ฉุกเฉิน ({snapshots.filter(s => s.backupType === 'safety').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSnapshotFilter('manual')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer ${
                      snapshotFilter === 'manual'
                        ? 'bg-gray-700 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    บันทึกเอง ({snapshots.filter(s => s.backupType === 'manual').length})
                  </button>
                </div>

                <div className="relative min-w-[160px]">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อหรือวันที่..."
                    value={snapshotSearch}
                    onChange={e => setSnapshotSearch(e.target.value)}
                    className="w-full pl-7 pr-3 py-1 text-[11px] border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                  />
                </div>
              </div>

              {isLoadingSnapshots ? (
                <div className="text-center py-6 text-xs text-gray-400">กำลังโหลดรายการจุดกู้คืน...</div>
              ) : filteredSnapshots.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-xl border border-gray-200 text-xs text-gray-400 space-y-1">
                  <p className="font-semibold text-gray-600">ไม่พบจุดสำรองข้อมูลในเงื่อนไขที่เลือก</p>
                  <p className="text-[11px] text-gray-400">ระบบจะทำการสำรองข้อมูลอัตโนมัติตามรอบ หรือท่านสามารถกดสำรองได้ทันที</p>
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-xl bg-white divide-y divide-gray-100 shadow-2xs">
                  {filteredSnapshots.map(s => {
                    const badge = getBackupTypeBadge(s.backupType);
                    return (
                      <div key={s.id} className="p-3 flex flex-wrap items-center justify-between hover:bg-gray-50/90 gap-3 transition-colors">
                        <div className="min-w-[220px]">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${badge.bg}`}>
                              {badge.label}
                            </span>
                            <p className="text-xs font-bold text-gray-900">
                              {s.label}
                            </p>
                          </div>
                          
                          {/* Clear Date & Time Stamp Display */}
                          <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-gray-500 mt-1">
                            <span className="font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded flex items-center gap-1">
                              <Calendar size={11} />
                              <span>วันเวลาสำรอง: {s.dateStr}</span>
                            </span>
                            <span>•</span>
                            <span>งาน: <strong className="text-gray-800">{s.jobsCount}</strong> รายการ</span>
                            <span>•</span>
                            <span>ทีมช่าง: <strong className="text-gray-800">{s.teamsCount}</strong> ทีม</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleRestoreClick(s)}
                            className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors whitespace-nowrap cursor-pointer"
                            title="เลือกเรียกคืนข้อมูลไฟล์นี้"
                          >
                            <RotateCcw size={13} />
                            <span>เรียกคืนข้อมูลไฟล์นี้</span>
                          </button>

                          {onDeleteSnapshot && (
                            <button
                              type="button"
                              onClick={() => handleDeleteSnapshotClick(s)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="ลบจุดสำรองนี้"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4. Maintenance Tools with Protection Guards */}
        <div>
          <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-rose-600" />
            <span>เครื่องมือทำความสะอาดและบำรุงรักษา (มีระบบป้องกันข้อมูล)</span>
          </h3>

          <div className="space-y-3">
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
              <div className="max-w-md">
                <p className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <Trash2 size={14} className="text-rose-600" />
                  <span>ลบเฉพาะรายการในรอบคำนวณ ({periodStart} ถึง {periodEnd})</span>
                </p>
                <p className="text-[11px] text-rose-700 mt-0.5">
                  ลบรายการงานและวันลาที่อยู่ในช่วงรอบคำนวณนี้ออก (ระบบจะสำรองข้อมูลฉุกเฉินให้ก่อนเสมอ)
                </p>
              </div>
              <button
                onClick={onClearPeriodData}
                className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Clear ข้อมูลรอบนี้</span>
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
              <div className="max-w-md">
                <p className="text-xs font-bold text-blue-900">
                  เคลียร์รายชื่อช่างตกค้าง (Clean Ghost Technician Data)
                </p>
                <p className="text-[11px] text-blue-700 mt-0.5">
                  ตรวจสอบและปลดล็อคชื่อช่างที่ถูกลบไปแล้ว แต่ยังมีรหัสค้างอยู่ในบันทึกงานเก่า
                </p>
              </div>
              <button
                onClick={onCleanGhostData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>ทำความสะอาด</span>
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
              <div className="max-w-md">
                <p className="text-xs font-bold text-amber-900">
                  รีเซ็ตเป็นชุดข้อมูลเริ่มต้นมาตรฐาน (Reset to Default Seed)
                </p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  โหลดชุดข้อมูลตัวอย่างเริ่มต้น (ระบบจะสร้างจุดสำรองข้อมูลบน Cloud ให้ก่อนรีเซ็ตเสมอ)
                </p>
              </div>
              <button
                onClick={onResetData}
                className="bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>รีเซ็ตเป็นค่าเริ่มต้น</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
