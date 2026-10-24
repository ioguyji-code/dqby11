/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Eye, ShieldCheck, Flame } from 'lucide-react';
import { formatDuration } from '../utils/dashcamLogic';

interface StealthOverlayProps {
  isRecording: boolean;
  recordingElapsedSeconds: number;
  isLocked: boolean;
  currentSpeedKmh: number;
  onExitStealth: () => void;
}

export const StealthOverlay: React.FC<StealthOverlayProps> = ({
  isRecording,
  recordingElapsedSeconds,
  isLocked,
  currentSpeedKmh,
  onExitStealth,
}) => {
  return (
    <div
      onClick={onExitStealth}
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between p-6 cursor-pointer select-none"
      title="انقر في أي مكان للخروج من وضع التعتيم"
    >
      {/* Top faint status */}
      <div className="flex items-center justify-between w-full opacity-40 text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          {isRecording && (
            <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
          )}
          <span>{isRecording ? `REC ${formatDuration(recordingElapsedSeconds)}` : 'READY'}</span>
        </div>
        <div className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>الداش كام يسجل بنجاح</span>
        </div>
      </div>

      {/* Center faint speed indicator */}
      <div className="flex flex-col items-center justify-center opacity-30 text-center">
        <span className="text-6xl font-black font-mono text-slate-200">
          {Math.round(currentSpeedKmh)}
        </span>
        <span className="text-xs text-slate-400 font-bold -mt-1">كم/س</span>
        {isLocked && (
          <span className="mt-2 text-xs font-bold text-amber-400 flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-500" />
            تم حفظ المقطع بقفل طوارئ
          </span>
        )}
      </div>

      {/* Bottom hint to wake */}
      <div className="flex items-center gap-2 opacity-50 text-xs text-slate-400 pb-4">
        <Eye className="w-4 h-4 text-cyan-400" />
        <span>وضع توفير الشاشة وتبريد الهاتف نشط • المس الشاشة للإلغاء</span>
      </div>
    </div>
  );
};
