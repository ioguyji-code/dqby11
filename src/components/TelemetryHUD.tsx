/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Compass,
  AlertTriangle,
  Lock,
  Mic,
  MicOff,
  Navigation,
  Clock,
  MapPin,
  Gauge,
  Activity,
  Flame,
  Camera,
} from 'lucide-react';
import {
  TelemetryData,
  DashcamSettings,
  formatDuration,
  formatDashcamTimestamp,
  formatCoordinates,
  getCardinalDirectionArabic,
} from '../utils/dashcamLogic';

interface TelemetryHUDProps {
  telemetry: TelemetryData;
  settings: DashcamSettings;
  isRecording: boolean;
  recordingElapsedSeconds: number;
  isLocked: boolean;
  incidentAlertMessage?: string | null;
  onToggleFacing?: () => void;
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({
  telemetry,
  settings,
  isRecording,
  recordingElapsedSeconds,
  isLocked,
  incidentAlertMessage,
  onToggleFacing,
}) => {
  const { dateStr, timeStr } = formatDashcamTimestamp(telemetry.timestamp || Date.now());
  const cardinal = getCardinalDirectionArabic(telemetry.heading);
  const coordsFormatted = formatCoordinates(telemetry.latitude, telemetry.longitude);

  // Speedometer fill percentage (0 to 180 km/h)
  const maxDialSpeed = 160;
  const speedRatio = Math.min(1, Math.max(0, telemetry.speedKmh / maxDialSpeed));
  const strokeDashoffset = 251.2 * (1 - speedRatio * 0.75); // 270 degree arc

  // Color dynamic based on speed vs speed limit
  const isSpeedViolation = telemetry.speedKmh > settings.speedLimitKmh;
  const speedColorClass = isSpeedViolation
    ? 'text-rose-500'
    : telemetry.speedKmh > settings.speedLimitKmh * 0.85
    ? 'text-amber-400'
    : 'text-cyan-400';

  return (
    <div
      className={`absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-3 sm:p-5 transition-transform ${
        settings.hudMirrorMode ? 'scale-x-[-1]' : ''
      }`}
    >
      {/* ================= TOP DASHBOARD BAR ================= */}
      <div className="flex items-start justify-between w-full gap-2">
        {/* Left: Recording & Incident Lock Status Badges */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          {isRecording ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-950/90 border border-rose-500/70 text-rose-300 backdrop-blur-md shadow-lg shadow-rose-950/60">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-black tracking-widest uppercase">REC</span>
              <span className="text-sm font-mono font-bold text-white pr-1">
                {formatDuration(recordingElapsedSeconds)}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-slate-400 backdrop-blur-md">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
              <span className="text-xs font-medium">جاهز للتسجيل</span>
            </div>
          )}

          {/* Incident Emergency Lock Badge */}
          {isLocked && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/90 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/30 animate-pulse border border-amber-300">
              <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>مقطع محمي من الحذف</span>
            </div>
          )}

          {/* Real Camera Facing Badge & Switcher */}
          <button
            onClick={onToggleFacing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/30 text-xs font-semibold backdrop-blur-md transition shadow"
            title="انقر لتبديل عدسة الكاميرا"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {settings.cameraFacing === 'environment'
                ? 'كاميرا الشارع (الخلفية)'
                : 'كاميرا المقصورة (الأمامية)'}
            </span>
          </button>

          {/* Audio recording tag */}
          <div className="flex items-center p-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-slate-300 backdrop-blur-sm">
            {settings.audioEnabled ? (
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <MicOff className="w-3.5 h-3.5 text-rose-400" />
            )}
          </div>
        </div>

        {/* Right: Date, Time & HUD Mode Info */}
        <div className="flex flex-col items-end text-left font-mono pointer-events-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-md">
            <span className="text-cyan-400 font-bold text-sm tracking-wider">{timeStr}</span>
            <span className="text-slate-500 text-xs">|</span>
            <span className="text-slate-300 text-xs">{dateStr}</span>
          </div>

          {settings.hudMirrorMode && (
            <span className="mt-1 px-2 py-0.5 rounded text-[10px] bg-cyan-950/90 border border-cyan-500/60 text-cyan-300 font-sans">
              وضع العاكس للزجاج (HUD)
            </span>
          )}
        </div>
      </div>

      {/* ================= CENTER ALERTS (Overspeed / Crash Shock) ================= */}
      <div className="w-full flex flex-col items-center justify-center gap-2 my-auto">
        {/* Collision Shock Emergency Alert */}
        {incidentAlertMessage && (
          <div className="px-5 py-3 rounded-2xl bg-rose-600/95 border-2 border-white/60 text-white shadow-2xl shadow-rose-900/80 flex items-center gap-3 backdrop-blur-xl animate-bounce">
            <Flame className="w-7 h-7 text-amber-300 animate-pulse shrink-0" />
            <div className="flex flex-col">
              <span className="font-extrabold text-sm sm:text-base tracking-wide">
                تم رصد صدمة / توقف مفاجئ ({telemetry.gForce}G)
              </span>
              <span className="text-xs text-rose-100 font-medium">
                تم قفل المقطع الحالي فوراً لحمايته كدليل رسمي
              </span>
            </div>
          </div>
        )}

        {/* Overspeed Warning Alert */}
        {isSpeedViolation && (
          <div className="px-4 py-2 rounded-xl bg-amber-500/90 border border-amber-300 text-slate-950 shadow-xl flex items-center gap-2.5 backdrop-blur-md animate-pulse">
            <AlertTriangle className="w-5 h-5 fill-slate-950 stroke-amber-400 shrink-0" />
            <span className="font-bold text-xs sm:text-sm">
              تنبيه السرعة! تجاوزت الحد المسموح ({telemetry.speedKmh} / {settings.speedLimitKmh} كم/س)
            </span>
          </div>
        )}
      </div>

      {/* ================= LOWER HUD GAUGES ================= */}
      <div className="grid grid-cols-3 items-end gap-2 sm:gap-4 w-full">
        {/* Left Gauge: G-Force Shock Telemetry */}
        <div className="flex flex-col items-start gap-1">
          <div className="p-2 sm:p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md shadow-lg min-w-[95px] sm:min-w-[130px]">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] sm:text-xs text-slate-400 font-medium flex items-center gap-1">
                <Activity className="w-3 h-3 text-cyan-400" />
                مستشعر G
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                أقصى {telemetry.maxGForce.toFixed(1)}G
              </span>
            </div>

            <div className="flex items-baseline gap-1">
              <span className={`text-xl sm:text-2xl font-black font-mono transition-colors ${telemetry.gForce > 2.0 ? 'text-rose-400' : 'text-slate-100'}`}>
                {telemetry.gForce.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400 font-bold">G</span>
            </div>

            {/* G-Force Dynamic Bar */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-200 rounded-full ${
                  telemetry.gForce >= 2.2 ? 'bg-rose-500' : telemetry.gForce >= 1.6 ? 'bg-amber-400' : 'bg-cyan-400'
                }`}
                style={{ width: `${Math.min(100, (telemetry.gForce / 3.0) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Center: Digital Speedometer with Speed Limit Sign */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative flex flex-col items-center justify-center p-3 sm:p-5 rounded-2xl bg-slate-950/80 border border-cyan-500/30 backdrop-blur-lg shadow-2xl shadow-cyan-950/40">
            {/* Speedometer Radial Arc SVG */}
            <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background Track */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="6"
                  strokeDasharray="251.2"
                  strokeDashoffset="62.8"
                />
                {/* Value Arc */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={isSpeedViolation ? '#f43f5e' : '#06b6d4'}
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray="251.2"
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-300"
                />
              </svg>

              {/* Speed Digits */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className={`text-4xl sm:text-5xl font-black font-mono tracking-tighter ${speedColorClass}`}>
                  {Math.round(telemetry.speedKmh)}
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-slate-400 -mt-1 tracking-wider">
                  كم / س
                </span>
              </div>
            </div>

            {/* Saudi / Arab Road Sign Speed Limit Circle */}
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border-2 border-rose-600 shadow-md">
                <span className="text-slate-950 font-black text-xs sm:text-sm font-mono">
                  {settings.speedLimitKmh}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">حد السرعة</span>
            </div>
          </div>
        </div>

        {/* Right Gauge: Compass & Heading */}
        <div className="flex flex-col items-end gap-1">
          <div className="p-2 sm:p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md shadow-lg min-w-[95px] sm:min-w-[130px] text-right">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="text-[10px] sm:text-xs text-slate-400 font-medium flex items-center gap-1">
                <Compass className="w-3 h-3 text-cyan-400" />
                الاتجاه
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {telemetry.heading ? `${Math.round(telemetry.heading)}°` : '0°'}
              </span>
            </div>

            <div className="text-sm sm:text-base font-bold text-cyan-300 truncate">
              {cardinal}
            </div>

            <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
              <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
              <span className="truncate">
                {telemetry.altitudeMeters ? `${Math.round(telemetry.altitudeMeters)}م ارتفاع` : 'GPS نشط'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ================= BOTTOM METADATA STAMP ================= */}
      {settings.showTelemetryOverlay && (
        <div className="w-full mt-2 pt-1 pb-1 px-3 rounded-lg bg-black/60 border border-slate-800/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-xs text-slate-300 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-bold">[DASHCAM PRO ARABIC]</span>
            <span className="hidden sm:inline text-slate-400">|</span>
            <span>{coordsFormatted}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>{Math.round(telemetry.speedKmh)} KM/H</span>
            <span className="text-slate-500">•</span>
            <span>{telemetry.gForce.toFixed(1)}G</span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-400 font-sans">
              {settings.videoResolution.toUpperCase()} 30FPS
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
