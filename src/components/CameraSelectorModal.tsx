/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Camera,
  X,
  CheckCircle2,
  RefreshCw,
  Video,
  SwitchCamera,
  Sliders,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export interface CameraDeviceInfo {
  id: string;
  label: string;
  facing?: 'environment' | 'user' | 'unknown';
}

interface CameraSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableCameras: CameraDeviceInfo[];
  activeDeviceId: string;
  onSelectCamera: (deviceId: string) => void;
  onRefreshDevices: () => void;
  onSelectFacingMode: (facing: 'environment' | 'user') => void;
  currentFacing: 'environment' | 'user';
  isLoading: boolean;
}

export const CameraSelectorModal: React.FC<CameraSelectorModalProps> = ({
  isOpen,
  onClose,
  availableCameras,
  activeDeviceId,
  onSelectCamera,
  onRefreshDevices,
  onSelectFacingMode,
  currentFacing,
  isLoading,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                تحديد واختيار كاميرا الداش كام
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                اختر العدسة المناسبة للتصوير أو الكاميرا الخارجية
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* Quick presets (Rear vs Front) */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-slate-300">الوضع السريع:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onSelectFacingMode('environment');
                }}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl border text-xs font-bold transition active:scale-95 ${
                  currentFacing === 'environment'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>الكاميرا الخلفية (الشارع)</span>
              </button>

              <button
                onClick={() => {
                  onSelectFacingMode('user');
                }}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl border text-xs font-bold transition active:scale-95 ${
                  currentFacing === 'user'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <SwitchCamera className="w-4 h-4 text-purple-400" />
                <span>الكاميرا الأمامية (المقصورة)</span>
              </button>
            </div>
          </div>

          {/* List of Detected Hardware Cameras */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                العدسات والكاميرات المتوفرة في جهازك ({availableCameras.length}):
              </span>
              <button
                onClick={onRefreshDevices}
                className="flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
                title="تحديث قائمة الكاميرات"
              >
                <RefreshCw className="w-3 h-3" />
                <span>تحديث القائمة</span>
              </button>
            </div>

            {availableCameras.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center text-slate-400 text-xs">
                <AlertCircle className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                <p className="font-semibold text-slate-300">لم تظهر أسماء الكاميرات بعد</p>
                <p className="mt-1 text-[11px] text-slate-400">
                  يرجى النقر على زر "تشغيل الكاميرا" في الشاشة الرئيسية أولاً ليمنح المتصفح إذن قراءة العدسات المتاحة.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {availableCameras.map((cam, idx) => {
                  const isSelected = activeDeviceId === cam.id;
                  const isBack =
                    cam.label.toLowerCase().includes('back') ||
                    cam.label.toLowerCase().includes('rear') ||
                    cam.label.includes('خلفية');
                  const isWide =
                    cam.label.toLowerCase().includes('wide') ||
                    cam.label.toLowerCase().includes('0.5') ||
                    cam.label.includes('عريضة');

                  return (
                    <button
                      key={cam.id || idx}
                      onClick={() => onSelectCamera(cam.id)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-right transition active:scale-[0.98] ${
                        isSelected
                          ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500'
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`p-2 rounded-xl shrink-0 ${
                            isSelected
                              ? 'bg-cyan-500 text-black'
                              : 'bg-slate-900 border border-slate-800 text-slate-400'
                          }`}
                        >
                          <Video className="w-4 h-4" />
                        </div>
                        <div className="flex flex-col min-w-0 text-right">
                          <span className="text-xs font-bold text-slate-100 truncate">
                            {cam.label || `كاميرا رقم ${idx + 1}`}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate">
                            {isWide
                              ? 'عدسة واسعة (موصى بها للداش كام)'
                              : isBack
                              ? 'كاميرا خلفية رئيسية'
                              : 'عدسة تصوير'}
                          </span>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="flex items-center gap-1 text-cyan-400 text-xs font-bold shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>متصلة</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 shrink-0 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800">
                          اختر للربط
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Help tip */}
          <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 text-[11px] text-slate-300 flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              إذا كانت سيارتك مزودة بشاشة أندرويد موصولة بكاميرا USB أو كاميرا أمامية، ستظهر هنا كخيار مستقل يمكنك اختياره مباشرة.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onRefreshDevices}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>إعادة الفحص</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 text-black font-bold text-xs hover:bg-cyan-400 transition"
          >
            تم
          </button>
        </div>
      </div>
    </div>
  );
};
