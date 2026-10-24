/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Play,
  Download,
  Trash2,
  Lock,
  Unlock,
  Flame,
  Camera,
  Film,
  Clock,
  Gauge,
  Activity,
  HardDrive,
  Share2,
} from 'lucide-react';
import { VideoClip, formatDuration, formatDashcamTimestamp, formatFileSize } from '../utils/dashcamLogic';

interface RecordingsModalProps {
  clips: VideoClip[];
  maxStorageClips: number;
  isOpen: boolean;
  onClose: () => void;
  onToggleLock: (id: string) => void;
  onDeleteClip: (id: string) => void;
}

export const RecordingsModal: React.FC<RecordingsModalProps> = ({
  clips,
  maxStorageClips,
  isOpen,
  onClose,
  onToggleLock,
  onDeleteClip,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'locked' | 'snapshots'>('all');
  const [selectedPlayClip, setSelectedPlayClip] = useState<VideoClip | null>(null);

  if (!isOpen) return null;

  const filteredClips = clips.filter(clip => {
    if (activeFilter === 'locked') return clip.isLocked && clip.durationSeconds > 0;
    if (activeFilter === 'snapshots') return clip.durationSeconds === 0;
    return true;
  });

  const lockedCount = clips.filter(c => c.isLocked).length;
  const totalClips = clips.length;

  const handleDownload = (clip: VideoClip) => {
    const a = document.createElement('a');
    a.href = clip.blobUrl;
    const ext = clip.durationSeconds === 0 ? 'jpg' : 'webm';
    a.download = `dashcam_${clip.id}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Film className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-100">
                مكتبة تسجيلات الداش كام
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                تصفح المقاطع المسجلة، حوادث الطوارئ المحمية، والصور الملتقطة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition active:scale-95"
            aria-label="إغلاق المكتبة"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Storage status & Loop info banner */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-950/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            <span>
              سعة التخزين: <strong className="text-slate-200">{totalClips}</strong> من أصل {maxStorageClips} مقطع حلقي
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-400 font-medium">
              ({lockedCount} مقطع محمي ضد الحذف التلقائي)
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            * التسجيل الحلقي يقوم باستبدال المقاطع العادية الأقدم تلقائياً
          </span>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 sm:px-6 pt-3 flex items-center gap-2 border-b border-slate-800/60 pb-3">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 sm:px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeFilter === 'all'
                ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/30'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800'
            }`}
          >
            جميع التسجيلات ({clips.length})
          </button>

          <button
            onClick={() => setActiveFilter('locked')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeFilter === 'locked'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>حوادث وطوارئ ({lockedCount})</span>
          </button>

          <button
            onClick={() => setActiveFilter('snapshots')}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-semibold transition ${
              activeFilter === 'snapshots'
                ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>الصور الملتقطة ({clips.filter(c => c.durationSeconds === 0).length})</span>
          </button>
        </div>

        {/* Clips Grid / List */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 max-h-[60vh]">
          {filteredClips.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
              <Film className="w-16 h-16 text-slate-700 mb-3 stroke-[1.2]" />
              <p className="text-base font-semibold text-slate-300">لا توجد مقاطع مسجلة بعد</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                ابدأ تسجيل رحلتك بالضغط على الزر الأحمر الكبير، وستظهر كل الفيديوهات هنا مع إمكانية التصدير والحماية.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
              {filteredClips.map(clip => {
                const { dateStr, timeStr } = formatDashcamTimestamp(clip.createdAt);
                const isSnapshot = clip.durationSeconds === 0;

                return (
                  <div
                    key={clip.id}
                    className={`group relative flex flex-col rounded-2xl bg-slate-950/70 border transition-all overflow-hidden hover:border-slate-700 shadow-lg ${
                      clip.isLocked
                        ? 'border-amber-500/40 ring-1 ring-amber-500/20'
                        : 'border-slate-800'
                    }`}
                  >
                    {/* Media Thumbnail / Preview Area */}
                    <div
                      onClick={() => setSelectedPlayClip(clip)}
                      className="relative w-full h-36 bg-slate-900 cursor-pointer overflow-hidden flex items-center justify-center"
                    >
                      {isSnapshot ? (
                        <img
                          src={clip.blobUrl}
                          alt="Snapshot"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <>
                          <video
                            src={clip.blobUrl}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                          />
                          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition flex items-center justify-center">
                            <div className="w-11 h-11 rounded-full bg-cyan-500/90 text-black flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                              <Play className="w-5 h-5 fill-black translate-x-[-1px]" />
                            </div>
                          </div>
                        </>
                      )}

                      {/* Top Badges */}
                      <div className="absolute top-2 left-2 right-2 flex items-center justify-between gap-1 pointer-events-none">
                        {clip.isLocked ? (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-bold text-[10px] shadow">
                            <Lock className="w-3 h-3 stroke-[2.5]" />
                            <span>محمي</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-slate-900/80 border border-slate-700 text-slate-300 text-[10px]">
                            حلقي
                          </span>
                        )}

                        <span className="px-2 py-0.5 rounded-md bg-black/75 text-white font-mono text-[10px]">
                          {isSnapshot ? 'صورة' : formatDuration(clip.durationSeconds)}
                        </span>
                      </div>
                    </div>

                    {/* Card Content & Telemetry */}
                    <div className="p-3 flex flex-col gap-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200">{timeStr}</span>
                        <span className="text-slate-400 text-[11px]">{dateStr}</span>
                      </div>

                      {/* Speed & G-force Badges */}
                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-300">
                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                          <Gauge className="w-3 h-3 text-cyan-400" />
                          <span>{Math.round(clip.peakSpeedKmh)} كم/س</span>
                        </span>

                        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                          <Activity className="w-3 h-3 text-amber-400" />
                          <span>{clip.peakGForce.toFixed(1)}G</span>
                        </span>

                        {clip.fileSizeBytes && (
                          <span className="text-[10px] text-slate-400 mr-auto font-sans">
                            {formatFileSize(clip.fileSizeBytes)}
                          </span>
                        )}
                      </div>

                      {clip.incidentReason && (
                        <div className="text-[11px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 flex items-center gap-1 truncate">
                          <Flame className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">{clip.incidentReason}</span>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 mt-1">
                        <div className="flex items-center gap-1">
                          {/* Toggle Lock */}
                          <button
                            onClick={() => onToggleLock(clip.id)}
                            className={`p-1.5 rounded-lg text-xs transition ${
                              clip.isLocked
                                ? 'text-amber-400 bg-amber-500/20 hover:bg-amber-500/30'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                            title={clip.isLocked ? 'إلغاء قفل الحماية' : 'قفل لحماية المقطع من الحذف'}
                            aria-label="قفل أو فتح الحماية"
                          >
                            {clip.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          </button>

                          {/* Download */}
                          <button
                            onClick={() => handleDownload(clip)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition"
                            title="تحميل المقطع إلى الجهاز"
                            aria-label="تنزيل المقطع"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Delete */}
                        <button
                          onClick={() => onDeleteClip(clip.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                          title="حذف هذا المقطع"
                          aria-label="حذف المقطع"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Media Player Dialog */}
      {selectedPlayClip && (
        <div className="fixed inset-0 z-60 bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-3 bg-slate-950 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                مشاهدة تسجيل: {formatDashcamTimestamp(selectedPlayClip.createdAt).timeStr}
              </span>
              <button
                onClick={() => setSelectedPlayClip(null)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full bg-black aspect-video flex items-center justify-center">
              {selectedPlayClip.durationSeconds === 0 ? (
                <img
                  src={selectedPlayClip.blobUrl}
                  alt="Snapshot preview"
                  className="w-full h-full object-contain"
                />
              ) : (
                <video
                  src={selectedPlayClip.blobUrl}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            <div className="p-4 bg-slate-950/80 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-mono text-cyan-400">
                  السرعة: {Math.round(selectedPlayClip.peakSpeedKmh)} كم/س
                </span>
                <span className="text-slate-600">•</span>
                <span className="font-mono text-amber-400">
                  التسارع: {selectedPlayClip.peakGForce.toFixed(2)}G
                </span>
              </div>
              <button
                onClick={() => handleDownload(selectedPlayClip)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 text-black font-bold rounded-xl hover:bg-cyan-400 transition"
              >
                <Download className="w-4 h-4" />
                <span>تنزيل الملف</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
