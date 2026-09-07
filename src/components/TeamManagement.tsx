import React, { useState } from 'react';
import { 
  Users, Plus, Trash2, Pencil, ArrowRightLeft, X, Check, UserPlus, Calendar, ArrowRight,
  AlertTriangle, AlertCircle, Info, RefreshCw
} from 'lucide-react';
import { Team, TeamMember } from '../types';
import { addDays, formatDateTH } from '../utils/calculator';

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
  onSyncTransferDates?: (
    oldTeamId: string,
    oldMemberId: string,
    newTeamId: string,
    newMemberId: string,
    lastWorkingDayOldTeam: string,
    firstWorkingDayNewTeam: string
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
  onSyncTransferDates,
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
    let type: 'transferred_out' | 'transferred_in' | null = null;
    let teamName = '';
    let memberId: string | undefined = undefined;
    let linkedTeam: Team | null = null;
    let linkedMember: TeamMember | null = null;

    if (member.transferredToTeamName || member.transferredToId) {
      type = 'transferred_out';
      memberId = member.transferredToId;
      teamName = member.transferredToTeamName || '';
    } else if (member.transferredFromTeamName || member.transferredFromId) {
      type = 'transferred_in';
      memberId = member.transferredFromId;
      teamName = member.transferredFromTeamName || '';
    } else if (member.resignDate) {
      for (const t of teams) {
        if (t.id === currentTeamId) continue;
        const match = (t.members || []).find(
          m => m.name.trim().toLowerCase() === member.name.trim().toLowerCase() && !m.resignDate
        );
        if (match) {
          type = 'transferred_out';
          teamName = t.name;
          memberId = match.id;
          linkedTeam = t;
          linkedMember = match;
          break;
        }
      }
    } else {
      for (const t of teams) {
        if (t.id === currentTeamId) continue;
        const match = (t.members || []).find(
          m => m.name.trim().toLowerCase() === member.name.trim().toLowerCase() && m.resignDate
        );
        if (match) {
          type = 'transferred_in';
          teamName = t.name;
          memberId = match.id;
          linkedTeam = t;
          linkedMember = match;
          break;
        }
      }
    }

    if (type && !linkedMember) {
      for (const t of teams) {
        if (t.id === currentTeamId) continue;
        const match = (t.members || []).find(
          m => (memberId && m.id === memberId) || m.name.trim().toLowerCase() === member.name.trim().toLowerCase()
        );
        if (match) {
          linkedTeam = t;
          linkedMember = match;
          if (!teamName) teamName = t.name;
          break;
        }
      }
    }

    if (!type) return null;

    // Identify who is old team and who is new team
    const isSourceOldTeam = type === 'transferred_out';
    const oldTeam = isSourceOldTeam ? teams.find(t => t.id === currentTeamId) : linkedTeam;
    const oldMember = isSourceOldTeam ? member : linkedMember;
    const newTeam = isSourceOldTeam ? linkedTeam : teams.find(t => t.id === currentTeamId);
    const newMember = isSourceOldTeam ? linkedMember : member;

    const oldResignDate = oldMember?.resignDate || '';
    const newJoinDate = newMember?.joinDate || '';

    // Standard business rule:
    // - วันสิ้นสุดทีมเก่าคือวันสุดท้ายที่ทำงานของทีมเก่า
    // - วันเริ่มต้นทีมใหม่คือวันเริ่มทำงานของทีมใหม่ (+1 วันถัดไป)
    let hasDateConflict = false;
    let conflictDetails = '';
    let isPerfectSync = false;

    if (oldResignDate && newJoinDate) {
      if (newJoinDate === addDays(oldResignDate, 1)) {
        isPerfectSync = true;
      } else {
        hasDateConflict = true;
        if (newJoinDate <= oldResignDate) {
          conflictDetails = `วันเริ่มงานทีมใหม่ (${newJoinDate}) ซ้อนทับหรือก่อนหน้าวันสุดท้ายทีมเดิม (${oldResignDate})`;
        } else {
          conflictDetails = `มีช่วงเว้นว่างระหว่างวันสิ้นสุดทีมเก่า (${oldResignDate}) กับวันเริ่มทีมใหม่ (${newJoinDate})`;
        }
      }
    }

    return {
      type,
      teamName: teamName || (linkedTeam?.name) || 'ทีมปลายทาง',
      memberId,
      linkedTeam,
      linkedMember,
      oldTeam,
      oldMember,
      newTeam,
      newMember,
      oldResignDate,
      newJoinDate,
      hasDateConflict,
      conflictDetails,
      isPerfectSync
    };
  };

  const handleApplyTransferSync = (
    oldTeamId: string,
    oldMemberId: string,
    newTeamId: string,
    newMemberId: string,
    targetOldResign: string,
    targetNewJoin: string
  ) => {
    if (onSyncTransferDates) {
      onSyncTransferDates(oldTeamId, oldMemberId, newTeamId, newMemberId, targetOldResign, targetNewJoin);
    } else {
      onUpdateMember(oldTeamId, oldMemberId, { resignDate: targetOldResign, transferredToId: newMemberId });
    }
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
        // Rule: new team start date is the NEXT DAY after last working day
        newTeamJoinDate: val ? addDays(val, 1) : ''
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
                                <span>วันสิ้นสุดทีมเก่า (วันสุดท้ายที่ทำงานใน {team.name}):</span>
                              </label>
                              <input
                                type="date"
                                className="w-full border border-red-200 rounded-lg p-1.5 text-xs bg-white focus:ring-1 focus:ring-red-400 font-semibold text-gray-800"
                                value={transferringMember.departureDate}
                                onChange={e => handleDepartureDateChange(e.target.value)}
                              />
                              <span className="text-[9px] text-gray-500 mt-0.5 block leading-tight">
                                ทำงานสังกัดทีมนี้ถึงวันที่เลือกนี้เป็นวันสุดท้าย
                              </span>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-emerald-700 mb-0.5 flex items-center gap-1">
                                <Calendar size={11} />
                                <span>วันเริ่มต้นทีมใหม่ (วันเริ่มทำงานในทีมใหม่):</span>
                              </label>
                              <input
                                type="date"
                                min={transferringMember.departureDate ? addDays(transferringMember.departureDate, 1) : undefined}
                                className={`w-full border rounded-lg p-1.5 text-xs bg-white focus:ring-1 font-semibold text-gray-800 ${
                                  transferringMember.departureDate && transferringMember.newTeamJoinDate && transferringMember.newTeamJoinDate <= transferringMember.departureDate
                                    ? 'border-red-400 focus:ring-red-400 bg-red-50/50'
                                    : 'border-emerald-200 focus:ring-emerald-400'
                                }`}
                                value={transferringMember.newTeamJoinDate}
                                onChange={e =>
                                  setTransferringMember({
                                    ...transferringMember,
                                    newTeamJoinDate: e.target.value
                                  })
                                }
                              />
                              <div className="flex items-center justify-between mt-0.5">
                                <span className="text-[9px] text-emerald-600 leading-tight font-medium">
                                  ✓ เริ่มงานทีมใหม่อัตโนมัติ (วันถัดไป)
                                </span>
                                {transferringMember.departureDate && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setTransferringMember({
                                        ...transferringMember,
                                        newTeamJoinDate: addDays(transferringMember.departureDate, 1)
                                      })
                                    }
                                    className="text-[9px] text-blue-600 hover:underline font-bold"
                                  >
                                    ซิงค์วันถัดไป
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Warning if newTeamJoinDate is on or before departureDate */}
                          {transferringMember.departureDate &&
                            transferringMember.newTeamJoinDate &&
                            transferringMember.newTeamJoinDate <= transferringMember.departureDate && (
                              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-[11px] text-red-700 flex items-start gap-1.5">
                                <AlertCircle size={14} className="text-red-500 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                  <p className="font-bold leading-tight">
                                    วันที่ไม่สอดคล้องกัน: วันเริ่มงานทีมใหม่ ({transferringMember.newTeamJoinDate}) ต้องเป็นวันถัดไปจากวันสุดท้ายที่ทำงานของทีมเก่า ({transferringMember.departureDate})
                                  </p>
                                  <p className="text-[10px] text-red-600 leading-tight">
                                    เนื่องจากวันสิ้นสุดทีมเก่าคือวันสุดท้ายที่ทำงานของทีมเก่า และวันเริ่มต้นทีมใหม่คือวันเริ่มทำงานของทีมใหม่
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setTransferringMember({
                                        ...transferringMember,
                                        newTeamJoinDate: addDays(transferringMember.departureDate, 1)
                                      })
                                    }
                                    className="px-2.5 py-1 bg-white border border-red-300 hover:bg-red-100 text-red-800 rounded-lg font-semibold text-[10px] transition-colors shadow-2xs"
                                  >
                                    ⚡ ซิงค์อัตโนมัติ: ให้ทีมใหม่เริ่มงาน {addDays(transferringMember.departureDate, 1)}
                                  </button>
                                </div>
                              </div>
                            )}

                          {/* Preview Summary */}
                          {transferringMember.targetTeamId && (
                            <div className="p-2 rounded-lg bg-blue-100/70 border border-blue-200 text-[11px] text-blue-900 space-y-1">
                              <div className="font-bold flex items-center gap-1 text-[10px] uppercase text-blue-800">
                                <span>📋 สรุปผลการย้ายทีม (ซิงค์อัตโนมัติ):</span>
                              </div>
                              <div className="flex flex-col gap-0.5 text-[10px]">
                                <div className="flex items-center gap-1">
                                  <span className="text-red-700 font-bold">• ทีมเดิม ({team.name}):</span>
                                  <span>วันสุดท้ายที่ทำงานคือ <b className="text-red-700">{transferringMember.departureDate || '-'}</b></span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-emerald-700 font-bold">• ทีมใหม่ ({teams.find(t => t.id === transferringMember.targetTeamId)?.name || 'ทีมปลายทาง'}):</span>
                                  <span>เริ่มทำงานวันที่ <b className="text-emerald-700">{transferringMember.newTeamJoinDate || '-'}</b></span>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={handleConfirmTransfer}
                              disabled={
                                !transferringMember.targetTeamId ||
                                !transferringMember.departureDate ||
                                !transferringMember.newTeamJoinDate ||
                                transferringMember.newTeamJoinDate <= transferringMember.departureDate
                              }
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
                                  ? `เมื่อบันทึก วันสุดท้ายที่ทำงานของทีมนี้ ระบบจะอัปเดตวันเริ่มงานของทีม ${linked.teamName} เป็นวันถัดไปโดยอัตโนมัติ`
                                  : `เมื่อบันทึก วันเริ่มงานของทีมนี้ ระบบจะอัปเดตวันสุดท้ายที่ทำงานของทีมเดิม (${linked.teamName}) เป็นวันก่อนหน้าโดยอัตโนมัติ`}
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
                                {linked?.type === 'transferred_in' ? 'วันเริ่มงาน (ทีมใหม่): ' : 'เริ่มงาน: '}
                                <b className="text-gray-700 font-medium">{member.joinDate || '-'}</b>
                              </span>
                              {member.resignDate && (
                                <span className="text-red-600">
                                  • วันสุดท้ายที่ทำงาน (ทีมเดิม): <b className="font-semibold">{member.resignDate}</b>
                                </span>
                              )}
                            </div>

                            {/* Alert if date is conflicting between old and new team */}
                            {linked?.hasDateConflict && linked.oldTeam && linked.newTeam && linked.oldMember && linked.newMember && (
                              <div className="mt-2 p-2.5 bg-amber-50/95 border border-amber-300 rounded-xl text-[10px] text-amber-900 space-y-2 shadow-xs">
                                <div className="font-bold flex items-center gap-1.5 text-amber-900 text-[11px]">
                                  <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                                  <span>⚠️ ตรวจพบวันย้ายทีมไม่สอดคล้องกัน (ต้องซิงค์ข้อมูลอัตโนมัติ)</span>
                                </div>
                                <div className="bg-white/90 p-2 rounded-lg border border-amber-200 text-[10px] space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-600">วันสิ้นสุดทีมเก่า ({linked.oldTeam.name}):</span>
                                    <b className="text-red-700">{linked.oldResignDate || 'ยังไม่ระบุ'}</b>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-600">วันเริ่มต้นทีมใหม่ ({linked.newTeam.name}):</span>
                                    <b className="text-emerald-700">{linked.newJoinDate || 'ยังไม่ระบุ'}</b>
                                  </div>
                                  <p className="text-[9px] text-amber-800 font-medium pt-0.5 border-t border-amber-100">
                                    📌 กฎของระบบ: วันสิ้นสุดทีมเก่าคือวันสุดท้ายที่ทำงาน • วันเริ่มต้นทีมใหม่คือวันเริ่มทำงาน (วันถัดไป)
                                  </p>
                                </div>

                                <div className="flex flex-col gap-1.5 pt-0.5">
                                  {/* If inverted (e.g. old is 27 and new is 26): smart swap so old is 26 and new is 27 */}
                                  {linked.oldResignDate && linked.newJoinDate && linked.newJoinDate <= linked.oldResignDate && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const earlier = linked.newJoinDate < linked.oldResignDate ? linked.newJoinDate : addDays(linked.oldResignDate, -1);
                                        const later = addDays(earlier, 1);
                                        handleApplyTransferSync(
                                          linked.oldTeam!.id,
                                          linked.oldMember!.id,
                                          linked.newTeam!.id,
                                          linked.newMember!.id,
                                          earlier,
                                          later
                                        );
                                      }}
                                      className="w-full text-left px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] transition-colors shadow-2xs flex items-center justify-between"
                                    >
                                      <span className="flex items-center gap-1.5">
                                        <RefreshCw size={11} className="shrink-0" />
                                        <span>⚡ ซิงค์อัตโนมัติ: สิ้นสุดทีมเก่า {linked.newJoinDate < linked.oldResignDate ? linked.newJoinDate : addDays(linked.oldResignDate, -1)} ➔ เริ่มทีมใหม่ {addDays(linked.newJoinDate < linked.oldResignDate ? linked.newJoinDate : addDays(linked.oldResignDate, -1), 1)}</span>
                                      </span>
                                      <span className="text-[9px] bg-emerald-700/80 px-1.5 py-0.5 rounded text-white font-medium">แนะนำ</span>
                                    </button>
                                  )}

                                  {/* Option 2: Keep old team resignDate, set new team joinDate to addDays(oldResignDate, 1) */}
                                  {linked.oldResignDate && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleApplyTransferSync(
                                          linked.oldTeam!.id,
                                          linked.oldMember!.id,
                                          linked.newTeam!.id,
                                          linked.newMember!.id,
                                          linked.oldResignDate,
                                          addDays(linked.oldResignDate, 1)
                                        );
                                      }}
                                      className="w-full text-left px-2.5 py-1.5 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 rounded-lg font-semibold text-[9.5px] transition-colors shadow-2xs flex items-center gap-1"
                                    >
                                      <span>⚡ ยึดวันสิ้นสุดทีมเก่า ({linked.oldResignDate}) ➔ ปรับทีมใหม่เริ่มงาน {addDays(linked.oldResignDate, 1)}</span>
                                    </button>
                                  )}

                                  {/* Option 3: Keep new team joinDate, set old team resignDate to addDays(newJoinDate, -1) */}
                                  {linked.newJoinDate && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleApplyTransferSync(
                                          linked.oldTeam!.id,
                                          linked.oldMember!.id,
                                          linked.newTeam!.id,
                                          linked.newMember!.id,
                                          addDays(linked.newJoinDate, -1),
                                          linked.newJoinDate
                                        );
                                      }}
                                      className="w-full text-left px-2.5 py-1.5 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 rounded-lg font-semibold text-[9.5px] transition-colors shadow-2xs flex items-center gap-1"
                                    >
                                      <span>⚡ ยึดวันเริ่มทีมใหม่ ({linked.newJoinDate}) ➔ ปรับทีมเก่าทำงานวันสุดท้าย {addDays(linked.newJoinDate, -1)}</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Reassuring green sync badge */}
                            {linked?.isPerfectSync && (
                              <div className="mt-1.5 flex items-center gap-1 text-[9.5px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-medium">
                                <Check size={11} className="text-emerald-600 shrink-0" />
                                <span>
                                  {linked.type === 'transferred_out'
                                    ? `ซิงค์เชื่อมโยงแล้ว (วันสุดท้ายทีมเดิม: ${linked.oldResignDate} ➔ เริ่มงานทีมใหม่: ${linked.newJoinDate})`
                                    : `ซิงค์เชื่อมโยงแล้ว (ย้ายมาจาก ${linked.teamName}: วันสุดท้าย ${linked.oldResignDate} ➔ เริ่มงานทีมนี้ ${linked.newJoinDate})`}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => {
                                const today = new Date().toISOString().split('T')[0];
                                const tomorrow = addDays(today, 1);
                                setTransferringMember({
                                  teamId: team.id,
                                  member,
                                  targetTeamId: '',
                                  departureDate: today,
                                  newTeamJoinDate: tomorrow
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
