/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Square,
  Lock,
  Camera,
  FlipHorizontal,
  Volume2,
  VolumeX,
  Film,
  Settings as SettingsIcon,
  RotateCw,
  EyeOff,
} from 'lucide-react';
import { DashcamSettings } from '../utils/dashcamLogic';

interface ControlBarProps {
  isRecording: boolean;
  isLocked: boolean;
  settings: DashcamSettings;
  clipsCount: number;
  onToggleRecord: () => void;
  onEmergencyLock: () => void;
  onTakeSnapshot: () => void;
  onToggleAudio: () => void;
  onToggleNightFilter: () => void;
  onToggleHudMirror: () => void;
  onToggleStealthMode: () => void;
  onFlipCamera: () => void;
  onOpenLibrary: () => void;
  onOpenSettings: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  isRecording,
  isLocked,
  settings,
  clipsCount,
  onToggleRecord,
  onEmergencyLock,
  onTakeSnapshot,
  onToggleAudio,
  onToggleHudMirror,
  onToggleStealthMode,
  onFlipCamera,
  onOpenLibrary,
  onOpenSettings,
}) => {
  return (
    <div className="w-full bg-slate-950/95 border-t border-slate-800/80 backdrop-blur-xl px-3 sm:px-6 py-3 flex flex-col gap-2 z-30 select-none shadow-2xl">
      {/* Primary Automotive Dashcam Buttons */}
      <div className="flex items-center justify-between gap-2 max-w-4xl mx-auto w-full">
        {/* Left Secondary Controls: Library & Settings */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Library Button */}
          <button
            onClick={onOpenLibrary}
            className="relative p-2.5 sm:p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-200 hover:text-white hover:border-cyan-500/50 hover:bg-slate-800/80 active:scale-95 transition flex flex-col items-center justify-center group"
            title="مكتبة تسجيلات الداش كام"
            aria-label="مكتبة التسجيلات"
          >
            <Film className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-medium mt-0.5 hidden sm:inline">التسجيلات</span>
            {clipsCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-cyan-500 text-black font-extrabold text-[10px] shadow">
                {clipsCount}
              </span>
            )}
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2.5 sm:p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 hover:bg-slate-800/80 active:scale-95 transition flex flex-col items-center justify-center"
            title="إعدادات الداش كام"
            aria-label="إعدادات الداش كام"
          >
            <SettingsIcon className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-0.5 hidden sm:inline">الإعدادات</span>
          </button>
        </div>

        {/* Center Primary Automotive Action Group */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Emergency SOS Lock Button */}
          <button
            onClick={onEmergencyLock}
            className={`p-3 sm:p-3.5 rounded-2xl border transition-all active:scale-95 flex flex-col items-center justify-center shadow-lg ${
              isLocked
                ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-amber-500/40 ring-2 ring-amber-400'
                : 'bg-slate-900/90 text-amber-400 border-amber-500/40 hover:bg-amber-500/20 shadow-black'
            }`}
            title="حماية وقفل المقطع الحالي من الحذف التلقائي"
            aria-label="قفل الطوارئ للحمايه"
          >
            <Lock className={`w-5 h-5 sm:w-6 sm:h-6 ${isLocked ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] font-bold mt-0.5">طوارئ / قفل</span>
          </button>

          {/* MAIN RECORD / STOP BUTTON */}
          <button
            onClick={onToggleRecord}
            className={`relative p-4 sm:p-5 rounded-full border-4 transition-all duration-300 active:scale-90 shadow-2xl flex items-center justify-center ${
              isRecording
                ? 'bg-rose-600 border-rose-400 text-white shadow-rose-600/60 ring-4 ring-rose-500/30 animate-pulse'
                : 'bg-rose-600/20 border-rose-500 text-rose-500 hover:bg-rose-600 hover:text-white shadow-rose-950'
            }`}
            title={isRecording ? 'إيقاف التسجيل وحفظ المقطع' : 'بدء تسجيل الداش كام'}
            aria-label={isRecording ? 'إيقاف التسجيل' : 'بدء التسجيل'}
          >
            {isRecording ? (
              <Square className="w-6 h-6 sm:w-7 sm:h-7 fill-white stroke-none" />
            ) : (
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-rose-500 flex items-center justify-center shadow-inner" />
            )}
          </button>

          {/* Instant Snapshot Photo Button */}
          <button
            onClick={onTakeSnapshot}
            className="p-3 sm:p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-200 hover:text-cyan-400 hover:border-cyan-500/50 hover:bg-slate-800/80 active:scale-95 transition flex flex-col items-center justify-center shadow-lg"
            title="التقاط صورة فورية أثناء القيادة"
            aria-label="التقاط صورة فورية"
          >
            <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
            <span className="text-[10px] font-medium mt-0.5">صورة فورية</span>
          </button>
        </div>

        {/* Right Driving Tool Toggles: Audio, Mirror HUD, Stealth, Flip Camera */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Flip Camera Facing (Back / Front) */}
          <button
            onClick={onFlipCamera}
            className="p-2.5 sm:p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white hover:border-cyan-500/50 active:scale-95 transition flex flex-col items-center justify-center"
            title="تبديل الكاميرا (خلفية للشارع / أمامية للسائق)"
            aria-label="تبديل الكاميرا"
          >
            <RotateCw className="w-5 h-5 text-cyan-400" />
            <span className="text-[10px] font-medium mt-0.5 hidden sm:inline">
              {settings.cameraFacing === 'environment' ? 'الخلفية' : 'الأمامية'}
            </span>
          </button>

          {/* Windshield Reflection HUD Mirror Mode Toggle */}
          <button
            onClick={onToggleHudMirror}
            className={`p-2.5 sm:p-3 rounded-2xl border transition active:scale-95 flex flex-col items-center justify-center ${
              settings.hudMirrorMode
                ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300 ring-1 ring-cyan-400'
                : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="وضع الانعكاس على الزجاج الأمامي (HUD Mirror Mode)"
            aria-label="وضع عاكس الزجاج"
          >
            <FlipHorizontal className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-0.5 hidden sm:inline">مرآة HUD</span>
          </button>

          {/* Stealth / Battery Saver Screen Toggle */}
          <button
            onClick={onToggleStealthMode}
            className="p-2.5 sm:p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 active:scale-95 transition flex flex-col items-center justify-center"
            title="وضع توفير البطارية وتبريد الهاتف أثناء القيادة"
            aria-label="شاشة التعتيم وتوفير الحرارة"
          >
            <EyeOff className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-0.5 hidden sm:inline">تعتيم</span>
          </button>

          {/* Audio Recording Toggle */}
          <button
            onClick={onToggleAudio}
            className={`p-2.5 sm:p-3 rounded-2xl border transition active:scale-95 flex flex-col items-center justify-center ${
              settings.audioEnabled
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                : 'bg-slate-900/90 border-slate-800 text-rose-400'
            }`}
            title={settings.audioEnabled ? 'كتم الميكروفون' : 'تشغيل تسجيل الصوت'}
            aria-label={settings.audioEnabled ? 'كتم الصوت' : 'تشغيل الصوت'}
          >
            {settings.audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            <span className="text-[10px] font-medium mt-0.5 hidden sm:inline">
              {settings.audioEnabled ? 'الصوت' : 'مكتوم'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
