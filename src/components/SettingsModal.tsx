/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Settings,
  Shield,
  Gauge,
  Clock,
  HardDrive,
  Video,
  Mic,
  Moon,
  Info,
  Smartphone,
  Sun,
  BatteryCharging,
  Check,
} from 'lucide-react';
import { DashcamSettings } from '../utils/dashcamLogic';

interface SettingsModalProps {
  settings: DashcamSettings;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSettings: (newSettings: Partial<DashcamSettings>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  isOpen,
  onClose,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'guide'>('settings');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-100">
                إعدادات الداش كام ودليل التثبيت
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                تخصيص حساس الحوادث، التسجيل الحلقي، وحدود السرعة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition active:scale-95"
            aria-label="إغلاق الإعدادات"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="px-4 sm:px-6 pt-3 flex items-center gap-2 border-b border-slate-800/60 pb-3">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'settings'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>إعدادات النظام</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeTab === 'guide'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>دليل تثبيت الهاتف في السيارة</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 max-h-[60vh] space-y-5">
          {activeTab === 'settings' ? (
            <>
              {/* Loop duration */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span>مدة كل مقطع حلقي (Loop Recording)</span>
                  </div>
                  <span className="text-xs font-semibold text-cyan-400">
                    {settings.loopDurationMinutes} دقيقة
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  يقوم الداش كام بتقسيم الرحلة إلى مقاطع متتالية، لتسهيل مراجعة الحوادث وتوفير مساحة التخزين.
                </p>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {[1, 3, 5].map(mins => (
                    <button
                      key={mins}
                      onClick={() => onUpdateSettings({ loopDurationMinutes: mins })}
                      className={`py-2 rounded-xl text-xs font-bold border transition ${
                        settings.loopDurationMinutes === mins
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {mins} دقيقة
                    </button>
                  ))}
                </div>
              </div>

              {/* G-Sensor Collision Sensitivity */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span>حساسية مستشعر الحوادث (G-Sensor)</span>
                  </div>
                  <span className="text-xs font-semibold text-amber-400">
                    {settings.gSensorSensitivity === 'high'
                      ? 'عالية (1.6G)'
                      : settings.gSensorSensitivity === 'medium'
                      ? 'متوسطة (2.2G - موصى بها)'
                      : 'منخفضة (3.0G)'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  عند حدوث اصطدام أو فرملة طارئة مفاجئة، يتم قفل المقطع تلقائياً ومنع التسجيل الحلقي من مسحه.
                </p>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {[
                    { key: 'low', label: 'منخفضة (3.0G)' },
                    { key: 'medium', label: 'متوسطة (2.2G)' },
                    { key: 'high', label: 'عالية (1.6G)' },
                  ].map(item => (
                    <button
                      key={item.key}
                      onClick={() => onUpdateSettings({ gSensorSensitivity: item.key as any })}
                      className={`py-2 rounded-xl text-xs font-bold border transition ${
                        settings.gSensorSensitivity === item.key
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Speed Warning Limit */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
                    <Gauge className="w-4 h-4 text-rose-400" />
                    <span>تنبيه السرعة القصوى على الطريق</span>
                  </div>
                  <span className="text-xs font-semibold text-rose-400">
                    {settings.speedLimitKmh} كم/س
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  يطلق وميضاً وصوت تحذير فوري عند تجاوزك سرعة الطريق المحددة.
                </p>
                <div className="grid grid-cols-4 gap-2 mt-1">
                  {[80, 100, 120, 140].map(speed => (
                    <button
                      key={speed}
                      onClick={() => onUpdateSettings({ speedLimitKmh: speed })}
                      className={`py-2 rounded-xl text-xs font-bold border transition ${
                        settings.speedLimitKmh === speed
                          ? 'bg-rose-500/20 border-rose-400 text-rose-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {speed} كم/س
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Storage Clips in Loop */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
                    <HardDrive className="w-4 h-4 text-cyan-400" />
                    <span>الحد الأقصى لعدد المقاطع المخزنة</span>
                  </div>
                  <span className="text-xs font-semibold text-cyan-400">
                    {settings.maxStorageClips} مقطع
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  عند الوصول للحد، يقوم الداش كام تلقائياً بتدوير المقاطع وحذف الأقدم لحماية ذاكرة الهاتف.
                </p>
                <div className="grid grid-cols-4 gap-2 mt-1">
                  {[5, 10, 15, 30].map(cnt => (
                    <button
                      key={cnt}
                      onClick={() => onUpdateSettings({ maxStorageClips: cnt })}
                      className={`py-2 rounded-xl text-xs font-bold border transition ${
                        settings.maxStorageClips === cnt
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {cnt} مقاطع
                    </button>
                  ))}
                </div>
              </div>

              {/* Feature Toggles (Switches) */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                <div className="text-sm font-bold text-slate-200 mb-2">خيارات إضافية</div>

                {/* Telemetry Stamp */}
                <label className="flex items-center justify-between cursor-pointer py-1">
                  <div>
                    <div className="text-xs font-semibold text-slate-200">
                      ختم السرعة والإحداثيات والوقت على الشاشة
                    </div>
                    <div className="text-[11px] text-slate-400">
                      إظهار شريط البيانات الحية المائي كدليل رسمي على الفيديو
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.showTelemetryOverlay}
                    onChange={e => onUpdateSettings({ showTelemetryOverlay: e.target.checked })}
                    className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
                  />
                </label>

                {/* Night Mode Filter */}
                <label className="flex items-center justify-between cursor-pointer py-1 border-t border-slate-800/60 pt-2">
                  <div>
                    <div className="text-xs font-semibold text-slate-200">
                      فلتر الرؤية الليلية المتقدم (Night Vision)
                    </div>
                    <div className="text-[11px] text-slate-400">
                      تعزيز السطوع والتباين لإظهار لوحات السيارات في الطرق المظلمة
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.nightModeFilter}
                    onChange={e => onUpdateSettings({ nightModeFilter: e.target.checked })}
                    className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
                  />
                </label>

                {/* Audio Recording */}
                <label className="flex items-center justify-between cursor-pointer py-1 border-t border-slate-800/60 pt-2">
                  <div>
                    <div className="text-xs font-semibold text-slate-200">
                      تسجيل الصوت داخل مقصورة السيارة
                    </div>
                    <div className="text-[11px] text-slate-400">
                      تسجيل المحادثات والأصوات المحيطة أثناء القيادة
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.audioEnabled}
                    onChange={e => onUpdateSettings({ audioEnabled: e.target.checked })}
                    className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
                  />
                </label>
              </div>
            </>
          ) : (
            /* Mounting & Car Setup Guide */
            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-start gap-3">
                <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  لتحويل هاتفك إلى داش كام احترافي يعتمد عليه كلياً في حمايتك على الطريق، اتبع هذه الإرشادات البسيطة للحصول على أفضل أداء وتجنب حرارة الصيف.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center gap-2 font-bold text-slate-100 text-sm">
                    <Smartphone className="w-4 h-4 text-cyan-400" />
                    <span>1. أفضل موضع للتثبيت</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    ثبت حامل الهاتف (Car Mount) أعلى منتصف الزجاج الأمامي، خلف مرآة الرؤية الخلفية مباشرة. هذا الموضع يوفر زاوية تصوير بانورامية واسعة للطريق دون حجب مجال رؤيتك أثناء القيادة.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center gap-2 font-bold text-slate-100 text-sm">
                    <BatteryCharging className="w-4 h-4 text-emerald-400" />
                    <span>2. توصيل الشاحن المستمر</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    استخدم كابل شحن متصل بمنفذ ولاعة السيارة أو USB. تسجيل الفيديو ونظام الـ GPS يستهلكان طاقة، والشاحن يضمن بقاء الداش كام يعمل طوال رحلاتك الطويلة.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center gap-2 font-bold text-slate-100 text-sm">
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span>3. تجنب حرارة الشمس المباشرة</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    استخدم زر <strong>"تعتيم الشاشة"</strong> أثناء القيادة؛ فهو يطفئ إضاءة الشاشة تماماً مع استمرار التسجيل في الخلفية، مما يمنع سخونة الهاتف ويحمي البطارية من التلف في الصيف.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center gap-2 font-bold text-slate-100 text-sm">
                    <Gauge className="w-4 h-4 text-purple-400" />
                    <span>4. وضع مرآة الزجاج (HUD)</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    يمكنك وضع الهاتف مستوياً على طبلون السيارة وتفعيل <strong>"مرآة HUD"</strong>، لتنعكس السرعة والاتجاه على الزجاج الأمامي أمام عينيك ليلاً وكأنها شاشة عرض فضائية!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-5 py-2 bg-cyan-500 text-black font-bold text-xs rounded-xl hover:bg-cyan-400 active:scale-95 transition"
          >
            <Check className="w-4 h-4" />
            <span>حفظ وإغلاق</span>
          </button>
        </div>
      </div>
    </div>
  );
};
