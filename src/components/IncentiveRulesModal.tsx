import React, { useState } from 'react';
import { Sliders, X, Check, RotateCcw } from 'lucide-react';
import { IncentiveRules } from '../types';
import { DEFAULT_INCENTIVE_RULES } from '../data/initialData';

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
  const [formData, setFormData] = useState<IncentiveRules>(rules);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveRules(formData);
    onClose();
  };

  const handleResetDefault = () => {
    setFormData(DEFAULT_INCENTIVE_RULES);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-[100] p-4 no-print">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Sliders size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-gray-900">ตั้งค่าสูตร Incentive ติดตั้งผ้าม่าน</h3>
              <p className="text-[11px] text-gray-500">ปรับเปลี่ยนพารามิเตอร์การคำนวณส่วนแบ่งค่าช่าง</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-gray-700 mb-1">
              1. ค่าฐานช่างต่อคนต่อวัน (Base Tech Pay):
            </label>
            <div className="relative">
              <input
                type="number"
                required
                min={0}
                className="w-full border rounded-xl p-2 pr-12 font-bold text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300"
                value={formData.baseTechPay}
                onChange={e => setFormData({ ...formData, baseTechPay: Number(e.target.value) || 0 })}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">บาท/คน</span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">
              2. งานวัดพื้นที่ต่อคน (Measure Tech Pay):
            </label>
            <div className="relative">
              <input
                type="number"
                required
                min={0}
                className="w-full border rounded-xl p-2 pr-12 font-bold text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300"
                value={formData.measureTechPay}
                onChange={e => setFormData({ ...formData, measureTechPay: Number(e.target.value) || 0 })}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">บาท/คน</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                3. รางฟรีขั้นต่ำ (Threshold):
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min={0}
                  className="w-full border rounded-xl p-2 pr-10 font-bold text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  value={formData.freeRailsThreshold}
                  onChange={e => setFormData({ ...formData, freeRailsThreshold: Number(e.target.value) || 0 })}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">ราง</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">
                4. ค่ารางส่วนเกิน:
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min={0}
                  className="w-full border rounded-xl p-2 pr-12 font-bold text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  value={formData.extraRailRate}
                  onChange={e => setFormData({ ...formData, extraRailRate: Number(e.target.value) || 0 })}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">บาท/ราง</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                5. โบนัสติดตั้ง/บันไดสูง:
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min={0}
                  className="w-full border rounded-xl p-2 pr-10 font-bold text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  value={formData.highLadderBonus}
                  onChange={e => setFormData({ ...formData, highLadderBonus: Number(e.target.value) || 0 })}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">บาท</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">
                6. โบนัสติดตั้ง/นั่งร้าน:
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min={0}
                  className="w-full border rounded-xl p-2 pr-10 font-bold text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  value={formData.scaffoldBonus}
                  onChange={e => setFormData({ ...formData, scaffoldBonus: Number(e.target.value) || 0 })}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">บาท</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">
                7. ติดตั้ง WallLinen:
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min={0}
                  className="w-full border rounded-xl p-2 pr-14 font-bold text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  value={formData.wallLinenSqmRate ?? 50}
                  onChange={e => setFormData({ ...formData, wallLinenSqmRate: Number(e.target.value) || 0 })}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-[11px]">บาท/ตร.ม.</span>
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">
                8. ติดตั้ง WallMural:
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min={0}
                  className="w-full border rounded-xl p-2 pr-14 font-bold text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-300"
                  value={formData.wallMuralSqmRate ?? 75}
                  onChange={e => setFormData({ ...formData, wallMuralSqmRate: Number(e.target.value) || 0 })}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-[11px]">บาท/ตร.ม.</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <button
              type="button"
              onClick={handleResetDefault}
              className="text-gray-500 hover:text-gray-800 font-semibold flex items-center gap-1"
            >
              <RotateCcw size={13} />
              <span>คืนค่ามาตรฐาน</span>
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
                type="submit"
                style={{ backgroundColor: themeColor, color: themeTextColor }}
                className="px-4 py-1.5 rounded-xl font-bold shadow-md hover:opacity-90 transition-opacity flex items-center gap-1"
              >
                <Check size={14} />
                <span>บันทึกเกณฑ์</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
