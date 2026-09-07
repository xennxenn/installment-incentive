import React, { useState } from 'react';
import { 
  Users, Plus, Trash2, Pencil, ArrowRightLeft, X, Check, UserPlus, Calendar, ArrowRight
} from 'lucide-react';
import { Team, TeamMember } from '../types';

interface TeamManagementProps {
  teams: Team[];
  onAddTeam: (name: string) => void;
  onDeleteTeam: (id: string) => void;
  onAddMember: (teamId: string, member: Omit<TeamMember, 'id'>) => void;
  onUpdateMember: (teamId: string, memberId: string, data: Partial<TeamMember>) => void;
  onDeleteMember: (teamId: string, memberId: string) => void;
  onTransferMember: (
    sourceTeamId: string,
    member: TeamMember,
    targetTeamId: string,
    departureDate: string,
    newTeamJoinDate?: string
  ) => void;
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
    departureDate: string;
    newTeamJoinDate: string;
  } | null>(null);

  // Helper to identify if a member was transferred to/from another team
  const getLinkedInfo = (member: TeamMember, currentTeamId: string) => {
    if (member.transferredToTeamName || member.transferredToId) {
      return {
        type: 'transferred_out' as const,
        teamName: member.transferredToTeamName || 'ทีมใหม่',
        memberId: member.transferredToId
      };
    }
    if (member.transferredFromTeamName || member.transferredFromId) {
      return {
        type: 'transferred_in' as const,
        teamName: member.transferredFromTeamName || 'ทีมเดิม',
        memberId: member.transferredFromId
      };
    }
    // Heuristic fallback for previously existing data
    if (member.resignDate) {
      for (const t of teams) {
        if (t.id === currentTeamId) continue;
        const match = (t.members || []).find(
          m => m.name.trim().toLowerCase() === member.name.trim().toLowerCase() && !m.resignDate
        );
        if (match) {
          return {
            type: 'transferred_out' as const,
            teamName: t.name,
            memberId: match.id
          };
        }
      }
    } else {
      for (const t of teams) {
        if (t.id === currentTeamId) continue;
        const match = (t.members || []).find(
          m => m.name.trim().toLowerCase() === member.name.trim().toLowerCase() && m.resignDate
        );
        if (match) {
          return {
            type: 'transferred_in' as const,
            teamName: t.name,
            memberId: match.id
          };
        }
      }
    }
    return null;
  };

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
    if (
      transferringMember &&
      transferringMember.targetTeamId &&
      transferringMember.departureDate &&
      transferringMember.newTeamJoinDate
    ) {
      onTransferMember(
        transferringMember.teamId,
        transferringMember.member,
        transferringMember.targetTeamId,
        transferringMember.departureDate,
        transferringMember.newTeamJoinDate
      );
      setTransferringMember(null);
    }
  };

  const handleDepartureDateChange = (val: string) => {
    setTransferringMember(prev => {
      if (!prev) return null;
      return {
        ...prev,
        departureDate: val,
        newTeamJoinDate: val // By default, keep start date at new team in sync with departure date
      };
    });
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
                  const linked = getLinkedInfo(member, team.id);

                  return (
                    <li
                      key={member.id}
                      className="bg-gray-50 border border-gray-100 rounded-xl p-2.5 text-xs text-gray-800 transition-all hover:border-gray-200"
                    >
                      {/* Transfer view */}
                      {isTransferringThis ? (
                        <div className="space-y-3 bg-gradient-to-br from-blue-50 to-indigo-50/80 p-3 rounded-xl border border-blue-200 shadow-xs">
                          <div className="flex items-center justify-between border-b border-blue-200/70 pb-2">
                            <div className="font-bold text-blue-900 flex items-center gap-1.5 text-xs">
                              <ArrowRightLeft size={15} className="text-blue-600" />
                              <span>ย้ายช่าง: <span className="underline decoration-blue-400 font-bold">{member?.name || ''}</span></span>
                            </div>
                            <span className="text-[10px] font-semibold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md">
                              ทีมเดิม: {team.name}
                            </span>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-gray-700 mb-1">
                              เลือกทีมใหม่ (ปลายทาง): <span className="text-red-500">*</span>
                            </label>
                            <select
                              className="w-full border border-blue-300 rounded-lg p-1.5 text-xs bg-white font-medium focus:ring-2 focus:ring-blue-400"
                              value={transferringMember.targetTeamId}
                              onChange={e =>
                                setTransferringMember({
                                  ...transferringMember,
                                  targetTeamId: e.target.value
                                })
                              }
                            >
                              <option value="">-- กรุณาเลือกทีมใหม่ที่จะย้ายไป --</option>
                              {(teams || [])
                                .filter(t => t && t.id !== team.id)
                                .map(t => (
                                  <option key={t.id} value={t.id}>
                                    {t?.name || ''}
                                  </option>
                                ))}
                            </select>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white/90 p-2.5 rounded-lg border border-blue-100">
                            <div>
                              <label className="block text-[10px] font-bold text-red-700 mb-0.5 flex items-center gap-1">
                                <Calendar size={11} />
                                <span>วันที่ออกจากทีมเก่า ({team.name}):</span>
                              </label>
                              <input
                                type="date"
                                className="w-full border border-red-200 rounded-lg p-1.5 text-xs bg-white focus:ring-1 focus:ring-red-400 font-semibold text-gray-800"
                                value={transferringMember.departureDate}
                                onChange={e => handleDepartureDateChange(e.target.value)}
                              />
                              <span className="text-[9px] text-gray-500 mt-0.5 block leading-tight">
                                สิ้นสุดการคิดงานในทีมเดิม ณ วันนี้
                              </span>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-emerald-700 mb-0.5 flex items-center gap-1">
                                <Calendar size={11} />
                                <span>วันที่เริ่มงานสำหรับทีมใหม่:</span>
                              </label>
                              <input
                                type="date"
                                className="w-full border border-emerald-200 rounded-lg p-1.5 text-xs bg-white focus:ring-1 focus:ring-emerald-400 font-semibold text-gray-800"
                                value={transferringMember.newTeamJoinDate}
                                onChange={e =>
                                  setTransferringMember({
                                    ...transferringMember,
                                    newTeamJoinDate: e.target.value
                                  })
                                }
                              />
                              <span className="text-[9px] text-emerald-600 mt-0.5 block leading-tight font-medium">
                                ✓ ซิงค์ตรงกับวันย้าย (เริ่มคิดงานทีมใหม่)
                              </span>
                            </div>
                          </div>

                          {/* Preview Summary */}
                          {transferringMember.targetTeamId && (
                            <div className="p-2 rounded-lg bg-blue-100/70 border border-blue-200 text-[11px] text-blue-900 space-y-1">
                              <div className="font-bold flex items-center gap-1 text-[10px] uppercase text-blue-800">
                                <span>📋 สรุปผลการย้ายทีม:</span>
                              </div>
                              <div className="flex flex-col gap-0.5 text-[10px]">
                                <div className="flex items-center gap-1">
                                  <span className="text-red-700 font-bold">• ทีมเดิม ({team.name}):</span>
                                  <span>ออกจากทีมวันที่ <b className="text-red-700">{transferringMember.departureDate}</b></span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-emerald-700 font-bold">• ทีมใหม่ ({teams.find(t => t.id === transferringMember.targetTeamId)?.name || 'ทีมปลายทาง'}):</span>
                                  <span>เริ่มงานวันที่ <b className="text-emerald-700">{transferringMember.newTeamJoinDate}</b></span>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={handleConfirmTransfer}
                              disabled={!transferringMember.targetTeamId || !transferringMember.departureDate || !transferringMember.newTeamJoinDate}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-1.5 rounded-lg font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
                            >
                              <Check size={14} />
                              <span>ยืนยันย้ายช่าง</span>
                            </button>
                            <button
                              onClick={() => setTransferringMember(null)}
                              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                            >
                              ยกเลิก
                            </button>
                          </div>
                        </div>
                      ) : isEditingThis ? (
                        /* Edit view */
                        <div className="space-y-2.5 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200">
                          <div className="flex justify-between items-center">
                            <span className="text-[11px] font-bold text-gray-800">
                              แก้ไขข้อมูลช่าง: <span className="text-amber-800">{member.name}</span>
                            </span>
                            {linked && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1">
                                <ArrowRightLeft size={10} />
                                {linked.type === 'transferred_out'
                                  ? `ย้ายไปทีม ${linked.teamName}`
                                  : `ย้ายมาจากทีม ${linked.teamName}`}
                              </span>
                            )}
                          </div>

                          <input
                            className="w-full border rounded-lg p-1.5 font-bold text-xs bg-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                            placeholder="ชื่อช่างติดตั้ง"
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
                              <span className="text-[10px] font-bold text-gray-600 block">
                                {linked?.type === 'transferred_in' ? 'วันเริ่มงาน (ทีมนี้):' : 'วันเริ่มงาน:'}
                              </span>
                              <input
                                type="date"
                                className="w-full border rounded-lg p-1 text-xs bg-white font-medium"
                                value={editingMember.data.joinDate}
                                onChange={e =>
                                  setEditingMember({
                                    ...editingMember,
                                    data: { ...editingMember.data, joinDate: e.target.value }
                                  })
                                }
                              />
                              {linked?.type === 'transferred_in' && (
                                <span className="text-[9px] text-blue-600 block mt-0.5 font-medium leading-tight">
                                  🔄 ซิงค์กับวันออกจาก {linked.teamName}
                                </span>
                              )}
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-gray-600 block">
                                {linked?.type === 'transferred_out' ? 'วันออกจากทีมนี้:' : 'วันออก/ย้าย:'}
                              </span>
                              <input
                                type="date"
                                className="w-full border rounded-lg p-1 text-xs bg-white font-medium"
                                value={editingMember.data.resignDate}
                                onChange={e =>
                                  setEditingMember({
                                    ...editingMember,
                                    data: { ...editingMember.data, resignDate: e.target.value }
                                  })
                                }
                              />
                              {linked?.type === 'transferred_out' && (
                                <span className="text-[9px] text-blue-600 block mt-0.5 font-medium leading-tight">
                                  🔄 ซิงค์กับวันเริ่มงานที่ {linked.teamName}
                                </span>
                              )}
                            </div>
                          </div>

                          {linked && (
                            <div className="text-[10px] text-blue-800 bg-blue-50/90 p-2 rounded-lg border border-blue-200 flex items-start gap-1.5">
                              <span className="font-bold shrink-0">⚡ ซิงค์อัตโนมัติ:</span>
                              <span className="leading-tight">
                                {linked.type === 'transferred_out'
                                  ? `เมื่อบันทึก วันที่ออกจากทีมนี้จะถูกนำไปอัปเดตเป็นวันเริ่มงานของทีม ${linked.teamName} โดยอัตโนมัติ`
                                  : `เมื่อบันทึก วันเริ่มงานของทีมนี้จะถูกนำไปอัปเดตเป็นวันที่ออกจากทีมเดิม (${linked.teamName}) โดยอัตโนมัติ`}
                              </span>
                            </div>
                          )}

                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={handleSaveMemberEdit}
                              style={{ backgroundColor: themeColor, color: themeTextColor }}
                              className="flex-1 py-1.5 rounded-lg font-bold text-xs shadow-xs hover:opacity-90 transition-opacity"
                            >
                              บันทึกข้อมูล
                            </button>
                            <button
                              onClick={() => setEditingMember(null)}
                              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                            >
                              ยกเลิก
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Normal view */
                        <div className="flex justify-between items-center gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`font-bold ${member.resignDate ? 'text-gray-500' : 'text-gray-900'}`}>
                                {member?.name || ''}
                              </span>
                              {linked?.type === 'transferred_out' && (
                                <span
                                  className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 inline-flex items-center gap-0.5"
                                  title={`ย้ายไปสังกัดทีม ${linked.teamName}`}
                                >
                                  <ArrowRightLeft size={9} />
                                  ย้ายไป {linked.teamName}
                                </span>
                              )}
                              {linked?.type === 'transferred_in' && (
                                <span
                                  className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-0.5"
                                  title={`ย้ายมาจากทีม ${linked.teamName}`}
                                >
                                  <ArrowRightLeft size={9} />
                                  ย้ายมาจาก {linked.teamName}
                                </span>
                              )}
                              {member.resignDate && !linked && (
                                <span className="text-[9px] text-red-500 font-semibold bg-red-50 px-1.5 py-0.2 rounded border border-red-200">
                                  ลาออก
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-gray-500 mt-0.5 flex flex-wrap items-center gap-x-2">
                              <span>
                                {linked?.type === 'transferred_in' ? 'วันที่เริ่มงานทีมนี้: ' : 'เริ่ม: '}
                                <b className="text-gray-700 font-medium">{member.joinDate || '-'}</b>
                              </span>
                              {member.resignDate && (
                                <span className="text-red-600">
                                  • วันที่ออกจากทีม: <b className="font-semibold">{member.resignDate}</b>
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => {
                                const today = new Date().toISOString().split('T')[0];
                                setTransferringMember({
                                  teamId: team.id,
                                  member,
                                  targetTeamId: '',
                                  departureDate: today,
                                  newTeamJoinDate: today
                                });
                              }}
                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-white rounded border border-transparent hover:border-gray-200 transition-colors"
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
                              className="p-1 text-gray-400 hover:text-gray-900 hover:bg-white rounded border border-transparent hover:border-gray-200 transition-colors"
                              title="แก้ไขข้อมูล"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => onDeleteMember(team.id, member.id)}
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-white rounded border border-transparent hover:border-gray-200 transition-colors"
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
