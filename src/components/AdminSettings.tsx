import React, { useState } from 'react';
import { 
  Shield, Palette, UserPlus, Trash2, Database, RefreshCw, Key, UserCheck, AlertTriangle
} from 'lucide-react';
import { AppUser, Role } from '../types';

interface AdminSettingsProps {
  currentUser: AppUser;
  appUsers: AppUser[];
  onAddUser: (user: Omit<AppUser, 'id'>) => void;
  onRemoveUser: (id: string, username: string) => void;
  themeColor: string;
  onSaveTheme: (color: string) => void;
  onCleanGhostData: () => void;
  onResetData: () => void;
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
  onResetData
}) => {
  const [selectedColor, setSelectedColor] = useState(themeColor);
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

        {/* 3. Maintenance Tools */}
        <div>
          <h3 className="font-bold text-sm text-gray-800 flex items-center gap-2 mb-3">
            <Database size={16} className="text-blue-600" />
            <span>เครื่องมือทำความสะอาดและกู้คืนระบบ</span>
          </h3>

          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-blue-900">
                  เคลียร์รายชื่อช่างตกค้าง (Clean Ghost Technician Data)
                </p>
                <p className="text-[11px] text-blue-700 mt-0.5">
                  ค้นหาและลบรายชื่อช่างที่ถูกลบไปแล้ว แต่ยังมีชื่อค้างในรายการงานติดตั้งเก่า
                </p>
              </div>
              <button
                onClick={onCleanGhostData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <RefreshCw size={14} />
                <span>ทำความสะอาด</span>
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold text-amber-900">
                  กู้คืนข้อมูลเริ่มต้นตัวอย่าง (Reset Initial Sample Data)
                </p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  ลบและโหลดชุดข้อมูลตัวอย่างเริ่มต้น (ทีมช่าง, รายการงาน, วันลา) กลับมาใช้งานใหม่
                </p>
              </div>
              <button
                onClick={onResetData}
                className="bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <AlertTriangle size={14} />
                <span>รีเซ็ตข้อมูล</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
