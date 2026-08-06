import React, { useState } from 'react';
import { 
  Users, Plus, Trash2, Pencil, ArrowRightLeft, X, Check, UserPlus
} from 'lucide-react';
import { Team, TeamMember } from '../types';

interface TeamManagementProps {
  teams: Team[];
  onAddTeam: (name: string) => void;
  onDeleteTeam: (id: string) => void;
  onAddMember: (teamId: string, member: Omit<TeamMember, 'id'>) => void;
  onUpdateMember: (teamId: string, memberId: string, data: Partial<TeamMember>) => void;
  onDeleteMember: (teamId: string, memberId: string) => void;
  onTransferMember: (sourceTeamId: string, member: TeamMember, targetTeamId: string, effectiveDate: string) => void;
  onResetTeamsToDefault?: () => void;
  themeColor: string;
  themeTextColor: string;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({
  teams,
  onAddTeam,
  onDeleteTeam,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  onTransferMember,
  onResetTeamsToDefault,
  themeColor,
  themeTextColor
}) => {
  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');

  const [addingMemberTo, setAddingMemberTo] = useState<string | null>(null);
  const [newMember, setNewMember] = useState({
    name: '',
    joinDate: new Date().toISOString().split('T')[0],
    resignDate: ''
  });

  const [editingMember, setEditingMember] = useState<{
    teamId: string;
    memberId: string;
    data: { name: string; joinDate: string; resignDate: string };
  } | null>(null);

  const [transferringMember, setTransferringMember] = useState<{
    teamId: string;
    member: TeamMember;
    targetTeamId: string;
    effectiveDate: string;
  } | null>(null);

  const handleCreateTeam = () => {
    if (newTeamName.trim()) {
      onAddTeam(newTeamName.trim());
      setNewTeamName('');
      setIsAddingTeam(false);
    }
  };

  const handleCreateMember = (teamId: string) => {
    if ((newMember?.name || '').trim()) {
      onAddMember(teamId, {
        name: (newMember?.name || '').trim(),
        joinDate: newMember.joinDate || new Date().toISOString().split('T')[0],
        resignDate: newMember.resignDate || undefined
      });
      setAddingMemberTo(null);
      setNewMember({ name: '', joinDate: new Date().toISOString().split('T')[0], resignDate: '' });
    }
  };

  const handleSaveMemberEdit = () => {
    if (editingMember && (editingMember.data?.name || '').trim()) {
      onUpdateMember(editingMember.teamId, editingMember.memberId, {
        name: (editingMember.data?.name || '').trim(),
        joinDate: editingMember.data.joinDate,
        resignDate: editingMember.data.resignDate || undefined
      });
      setEditingMember(null);
    }
  };

  const handleConfirmTransfer = () => {
    if (transferringMember && transferringMember.targetTeamId && transferringMember.effectiveDate) {
      onTransferMember(
        transferringMember.teamId,
        transferringMember.member,
        transferringMember.targetTeamId,
        transferringMember.effectiveDate
      );
      setTransferringMember(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">จัดการโครงสร้างทีมช่างติดตั้งผ้าม่าน</h2>
          <p className="text-xs text-gray-500">
            เพิ่ม แก้ไข หรือย้ายทีมช่าง พร้อมระบุวันเริ่มงานและวันลาออก เพื่อแบ่งยอด Incentive ถูกต้องตามประวัติ
          </p>
        </div>
        {onResetTeamsToDefault && (
          <button
            onClick={onResetTeamsToDefault}
            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl border border-gray-300 flex items-center gap-1.5 transition-colors shadow-sm"
            title="รีเซ็ตทีมช่างทั้งหมดให้กลับไปเป็นค่าเริ่มต้นจากโค้ดล่าสุด"
          >
            <Users size={14} />
            <span>ซิงค์ทีมช่างเป็นค่าเริ่มต้น</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {(teams || []).filter(Boolean).map(team => (
          <div
            key={team.id}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 relative group flex flex-col justify-between"
          >
            <div>
              {/* Header of card */}
              <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs"
                    style={{ backgroundColor: themeColor, color: themeTextColor }}
                  >
                    <Users size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-gray-900">{team.name || ''}</h3>
                    <span className="text-[10px] text-gray-400">
                      สมาชิก {(team.members || []).filter(Boolean).length} คน
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteTeam(team.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-600 p-1 rounded transition-all"
                  title="ลบทีม"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Members List */}
              <ul className="space-y-2 mb-4">
                {(team.members || []).filter(Boolean).map(member => {
                  const isTransferringThis =
                    transferringMember?.member?.id === member.id &&
                    transferringMember?.teamId === team.id;
                  const isEditingThis =
                    editingMember?.memberId === member.id &&
                    editingMember?.teamId === team.id;

                  return (
                    <li
                      key={member.id}
                      className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 text-xs text-gray-800 transition-all hover:border-gray-200"
                    >
                      {/* Transfer view */}
                      {isTransferringThis ? (
                        <div className="space-y-2 bg-blue-50/80 p-2.5 rounded-lg border border-blue-200">
                          <div className="font-bold text-blue-900 flex items-center gap-1.5 text-xs">
                            <ArrowRightLeft size={14} />
                            <span>ย้ายช่าง {member?.name || ''} ไปทีมใหม่</span>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 mb-0.5">เลือกทีมปลายทาง:</label>
                            <select
                              className="w-full border rounded-lg p-1.5 text-xs bg-white font-medium"
                              value={transferringMember.targetTeamId}
                              onChange={e =>
                                setTransferringMember({
                                  ...transferringMember,
                                  targetTeamId: e.target.value
                                })
                              }
                            >
                              <option value="">-- เลือกทีมปลายทาง --</option>
                              {(teams || [])
                                .filter(t => t && t.id !== team.id)
                                .map(t => (
                                  <option key={t.id} value={t.id}>
                                    {t?.name || ''}
                                  </option>
                                ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-gray-500 mb-0.5">วันที่มีผลย้าย:</label>
                            <input
                              type="date"
                              className="w-full border rounded-lg p-1 text-xs bg-white"
                              value={transferringMember.effectiveDate}
                              onChange={e =>
                                setTransferringMember({
                                  ...transferringMember,
                                  effectiveDate: e.target.value
                                })
                              }
                            />
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={handleConfirmTransfer}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1 rounded-lg font-bold text-xs shadow-xs"
                            >
                              ยืนยันย้าย
                            </button>
                            <button
                              onClick={() => setTransferringMember(null)}
                              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 rounded-lg text-xs"
                            >
                              ยกเลิก
                            </button>
                          </div>
                        </div>
                      ) : isEditingThis ? (
                        /* Edit view */
                        <div className="space-y-2">
                          <input
                            className="w-full border rounded-lg p-1.5 font-bold text-xs bg-white"
                            value={editingMember.data?.name || ''}
                            onChange={e =>
                              setEditingMember({
                                ...editingMember,
                                data: { ...editingMember.data, name: e.target.value }
                              })
                            }
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-[10px] font-bold text-gray-400 block">วันเริ่มงาน:</span>
                              <input
                                type="date"
                                className="w-full border rounded-lg p-1 text-xs bg-white"
                                value={editingMember.data.joinDate}
                                onChange={e =>
                                  setEditingMember({
                                    ...editingMember,
                                    data: { ...editingMember.data, joinDate: e.target.value }
                                  })
                                }
                              />
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-gray-400 block">วันออก/ย้าย:</span>
                              <input
                                type="date"
                                className="w-full border rounded-lg p-1 text-xs bg-white"
                                value={editingMember.data.resignDate}
                                onChange={e =>
                                  setEditingMember({
                                    ...editingMember,
                                    data: { ...editingMember.data, resignDate: e.target.value }
                                  })
                                }
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={handleSaveMemberEdit}
                              style={{ backgroundColor: themeColor, color: themeTextColor }}
                              className="flex-1 py-1 rounded-lg font-bold text-xs"
                            >
                              บันทึก
                            </button>
                            <button
                              onClick={() => setEditingMember(null)}
                              className="flex-1 bg-gray-200 text-gray-700 py-1 rounded-lg text-xs"
                            >
                              ยกเลิก
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Normal view */
                        <div className="flex justify-between items-center">
                          <div>
                            <div className={`font-bold ${member.resignDate ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                              {member?.name || ''}{' '}
                              {member.resignDate && (
                                <span className="text-[10px] text-red-500 font-normal no-underline ml-1">
                                  (ลาออก/ย้ายทีม)
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-0.5">
                              เริ่ม: {member.joinDate || '2024-01-01'}
                              {member.resignDate ? ` • ออก: ${member.resignDate}` : ''}
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                setTransferringMember({
                                  teamId: team.id,
                                  member,
                                  targetTeamId: '',
                                  effectiveDate: new Date().toISOString().split('T')[0]
                                })
                              }
                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-white rounded border border-transparent hover:border-gray-200"
                              title="ย้ายทีมช่าง"
                            >
                              <ArrowRightLeft size={13} />
                            </button>
                            <button
                              onClick={() =>
                                setEditingMember({
                                  teamId: team.id,
                                  memberId: member.id,
                                  data: {
                                    name: member?.name || '',
                                    joinDate: member?.joinDate || '',
                                    resignDate: member?.resignDate || ''
                                  }
                                })
                              }
                              className="p-1 text-gray-400 hover:text-gray-900 hover:bg-white rounded border border-transparent hover:border-gray-200"
                              title="แก้ไขข้อมูล"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => onDeleteMember(team.id, member.id)}
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-white rounded border border-transparent hover:border-gray-200"
                              title="ลบช่าง"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Add member box */}
            {addingMemberTo === team.id ? (
              <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl space-y-2 text-xs">
                <input
                  placeholder="ชื่อช่างติดตั้ง"
                  className="w-full border rounded-lg p-1.5 font-semibold text-xs bg-white"
                  value={newMember?.name || ''}
                  onChange={e => setNewMember({ ...newMember, name: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 block">วันเริ่มงาน:</span>
                    <input
                      type="date"
                      className="w-full border rounded-lg p-1 text-xs bg-white"
                      value={newMember.joinDate}
                      onChange={e => setNewMember({ ...newMember, joinDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 block">วันออก (ถ้ามี):</span>
                    <input
                      type="date"
                      className="w-full border rounded-lg p-1 text-xs bg-white"
                      value={newMember.resignDate}
                      onChange={e => setNewMember({ ...newMember, resignDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleCreateMember(team.id)}
                    style={{ backgroundColor: themeColor, color: themeTextColor }}
                    className="flex-1 py-1 rounded-lg font-bold text-xs"
                  >
                    บันทึกเพิ่ม
                  </button>
                  <button
                    onClick={() => setAddingMemberTo(null)}
                    className="flex-1 bg-gray-200 text-gray-700 py-1 rounded-lg text-xs"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAddingMemberTo(team.id)}
                className="w-full border-2 border-dashed border-gray-200 hover:border-gray-400 p-2.5 rounded-xl text-xs font-semibold text-gray-400 hover:text-gray-700 flex items-center justify-center gap-1.5 transition-all"
              >
                <UserPlus size={14} />
                <span>+ เพิ่มช่างในทีม</span>
              </button>
            )}
          </div>
        ))}

        {/* Add Team Box */}
        {isAddingTeam ? (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-center space-y-3">
            <h3 className="font-bold text-sm text-gray-800">สร้างทีมช่างใหม่</h3>
            <input
              placeholder="ชื่อทีมช่าง เช่น ทีมช่างโชค"
              className="w-full border rounded-xl p-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-gray-300"
              autoFocus
              value={newTeamName}
              onChange={e => setNewTeamName(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreateTeam}
                style={{ backgroundColor: themeColor, color: themeTextColor }}
                className="flex-1 py-2 rounded-xl text-xs font-bold shadow-sm"
              >
                สร้างทีม
              </button>
              <button
                onClick={() => setIsAddingTeam(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-xl text-xs font-semibold"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingTeam(true)}
            className="bg-gray-50 border-2 border-dashed border-gray-200 hover:border-gray-400 hover:bg-white rounded-2xl flex flex-col items-center justify-center p-8 text-gray-400 hover:text-gray-700 transition-all min-h-[220px]"
          >
            <Plus size={32} className="mb-2" />
            <span className="font-bold text-xs">เพิ่มทีมช่างติดตั้งใหม่</span>
          </button>
        )}
      </div>
    </div>
  );
};
