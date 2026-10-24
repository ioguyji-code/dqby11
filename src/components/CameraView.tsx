/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  RefreshCw,
  AlertCircle,
  SwitchCamera,
  Sliders,
  CheckCircle2,
  Video,
  Layers,
} from 'lucide-react';
import { DashcamSettings, TelemetryData, VideoClip } from '../utils/dashcamLogic';
import { dashcamAudio } from '../utils/audioAlerts';
import { CameraDeviceInfo } from './CameraSelectorModal';

interface CameraViewProps {
  settings: DashcamSettings;
  telemetry: TelemetryData;
  isRecording: boolean;
  isLocked: boolean;
  activeDeviceId: string;
  availableCameras: CameraDeviceInfo[];
  onNewClip: (clip: VideoClip) => void;
  onCameraReady?: (label: string) => void;
  onToggleFacing: () => void;
  onSelectDeviceId: (id: string) => void;
  onOpenSelectorModal: () => void;
  onRefreshDevices: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({
  settings,
  telemetry,
  isRecording,
  isLocked,
  activeDeviceId,
  availableCameras,
  onNewClip,
  onCameraReady,
  onToggleFacing,
  onSelectDeviceId,
  onOpenSelectorModal,
  onRefreshDevices,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);
  const peakSpeedRef = useRef<number>(0);
  const peakGForceRef = useRef<number>(1.0);
  const isLockedRef = useRef<boolean>(isLocked);

  const [streamActive, setStreamActive] = useState(false);
  const [cameraLabel, setCameraLabel] = useState<string>('');
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Keep refs in sync for recording
  useEffect(() => {
    isLockedRef.current = isLocked;
    if (telemetry.speedKmh > peakSpeedRef.current) {
      peakSpeedRef.current = telemetry.speedKmh;
    }
    if (telemetry.gForce > peakGForceRef.current) {
      peakGForceRef.current = telemetry.gForce;
    }
  }, [isLocked, telemetry.speedKmh, telemetry.gForce]);

  // Primary Real Camera Start Function
  const startRealCamera = useCallback(async (forcedDeviceId?: string) => {
    setIsLoadingCamera(true);
    setPermissionError(null);

    // Stop current stream if any
    if (videoRef.current && videoRef.current.srcObject) {
      const activeStream = videoRef.current.srcObject as MediaStream;
      activeStream.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }

    const deviceToUse = forcedDeviceId !== undefined ? forcedDeviceId : activeDeviceId;
    let stream: MediaStream | null = null;

    // Strategy 1: Explicit deviceId if chosen
    if (deviceToUse) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: deviceToUse },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });
      } catch {
        // Fallback to basic deviceId constraint
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: deviceToUse } },
            audio: false,
          });
        } catch {}
      }
    }

    // Strategy 2: Ideal facingMode (Rear / Front)
    if (!stream) {
      try {
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: { ideal: settings.cameraFacing },
            width: { ideal: settings.videoResolution === '1080p' ? 1920 : 1280 },
            height: { ideal: settings.videoResolution === '1080p' ? 1080 : 720 },
            frameRate: { ideal: 30 },
          },
          audio: false,
        };
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        // Strategy 3: Loose facingMode
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: settings.cameraFacing },
            audio: false,
          });
        } catch {
          // Strategy 4: Bare video stream (any camera available)
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            });
          } catch (err: any) {
            setIsLoadingCamera(false);
            setStreamActive(false);
            setPermissionError(
              err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
                ? 'يرجى السماح بالوصول لكاميرا الهاتف من إعدادات المتصفح أو أيقونة القفل بجانب الرابط.'
                : 'تعذر الاتصال بالكاميرا المحددة. جرب اختيار عدسة أخرى من القائمة أدناه.'
            );
            return;
          }
        }
      }
    }

    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;

      try {
        await videoRef.current.play();
      } catch {}

      setStreamActive(true);
      setIsLoadingCamera(false);

      const track = stream.getVideoTracks()[0];
      if (track) {
        const settingsApplied = track.getSettings();
        if (settingsApplied.deviceId && settingsApplied.deviceId !== activeDeviceId) {
          onSelectDeviceId(settingsApplied.deviceId);
        }

        const label =
          track.label ||
          (settings.cameraFacing === 'environment'
            ? 'الكاميرا الخلفية (الشارع)'
            : 'الكاميرا الأمامية (المقصورة)');
        setCameraLabel(label);
        if (onCameraReady) onCameraReady(label);
      }

      // Re-populate devices now that permission is granted and labels are accessible
      onRefreshDevices();
    }
  }, [
    activeDeviceId,
    settings.cameraFacing,
    settings.videoResolution,
    onCameraReady,
    onRefreshDevices,
    onSelectDeviceId,
  ]);

  // Auto-launch real camera on mount or when activeDeviceId changes
  useEffect(() => {
    startRealCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [activeDeviceId, settings.cameraFacing, startRealCamera]);

  // Keep screen awake
  useEffect(() => {
    let wakeLock: any = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch {}
    };
    requestWakeLock();
    return () => {
      if (wakeLock) wakeLock.release().catch(() => {});
    };
  }, []);

  // Snapshot photo from live real camera
  const captureSnapshot = useCallback(() => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const width = video.videoWidth || 1920;
    const height = video.videoHeight || 1080;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (settings.hudMirrorMode) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, width, height);

    dashcamAudio.playShutter();
    canvas.toBlob(
      blob => {
        if (!blob) return;
        const blobUrl = URL.createObjectURL(blob);
        const snapshot: VideoClip = {
          id: `snap-${Date.now()}`,
          blobUrl,
          thumbnailUrl: blobUrl,
          createdAt: Date.now(),
          durationSeconds: 0,
          isLocked: true,
          incidentReason: 'صورة فورية حقيقية',
          peakSpeedKmh: telemetry.speedKmh,
          peakGForce: telemetry.gForce,
          latitude: telemetry.latitude ?? undefined,
          longitude: telemetry.longitude ?? undefined,
          fileSizeBytes: blob.size,
        };
        onNewClip(snapshot);
      },
      'image/jpeg',
      0.95
    );
  }, [settings.hudMirrorMode, telemetry, onNewClip]);

  useEffect(() => {
    const handleSnapshot = () => captureSnapshot();
    window.addEventListener('dashcam-take-snapshot', handleSnapshot);
    return () => {
      window.removeEventListener('dashcam-take-snapshot', handleSnapshot);
    };
  }, [captureSnapshot]);

  // Real MediaRecorder on the Live Camera Stream
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!videoRef.current || !videoRef.current.srcObject) return;
    const stream = videoRef.current.srcObject as MediaStream;

    recordedChunksRef.current = [];
    recordingStartTimeRef.current = Date.now();
    peakSpeedRef.current = telemetry.speedKmh;
    peakGForceRef.current = telemetry.gForce;

    try {
      const mimeTypes = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4',
      ];
      let chosenMime = '';
      for (const m of mimeTypes) {
        if (MediaRecorder.isTypeSupported(m)) {
          chosenMime = m;
          break;
        }
      }

      const recorder = new MediaRecorder(
        stream,
        chosenMime ? { mimeType: chosenMime } : undefined
      );

      recorder.ondataavailable = e => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        if (recordedChunksRef.current.length === 0) return;
        const blob = new Blob(recordedChunksRef.current, {
          type: chosenMime || 'video/webm',
        });
        const blobUrl = URL.createObjectURL(blob);
        const durationSec = Math.max(
          1,
          Math.round((Date.now() - recordingStartTimeRef.current) / 1000)
        );

        const clip: VideoClip = {
          id: `clip-${Date.now()}`,
          blobUrl,
          createdAt: Date.now(),
          durationSeconds: durationSec,
          isLocked: isLockedRef.current,
          incidentReason: isLockedRef.current ? 'قفل طوارئ / صدمة تسارع' : undefined,
          peakSpeedKmh: peakSpeedRef.current,
          peakGForce: peakGForceRef.current,
          latitude: telemetry.latitude ?? undefined,
          longitude: telemetry.longitude ?? undefined,
          fileSizeBytes: blob.size,
        };

        onNewClip(clip);
        recordedChunksRef.current = [];
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
    } catch {}
  }, [telemetry, onNewClip]);

  useEffect(() => {
    if (isRecording) {
      startRecording();
      dashcamAudio.playRecordStart();
    } else {
      stopRecording();
      dashcamAudio.playRecordStop();
    }
  }, [isRecording, startRecording, stopRecording]);

  useEffect(() => {
    if (!isRecording) return;
    const intervalMs = settings.loopDurationMinutes * 60 * 1000;
    const loopTimer = setInterval(() => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        stopRecording();
        setTimeout(() => {
          if (isRecording) startRecording();
        }, 150);
      }
    }, intervalMs);

    return () => clearInterval(loopTimer);
  }, [isRecording, settings.loopDurationMinutes, startRecording, stopRecording]);

  return (
    <div
      className={`relative w-full h-full bg-black overflow-hidden flex items-center justify-center ${
        settings.hudMirrorMode ? 'scale-x-[-1]' : ''
      }`}
    >
      {/* Real Live Hardware Phone Camera Video Stream */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        // @ts-ignore
        webkit-playsinline="true"
        className="absolute inset-0 w-full h-full object-cover z-0"
        style={{
          filter: settings.nightModeFilter
            ? 'brightness(1.4) contrast(1.25) saturate(1.15)'
            : 'none',
        }}
      />

      {/* Camera Activation & Device Selector Overlay (Shown when stream is idle or waiting for user selection) */}
      {!streamActive && (
        <div className="absolute inset-0 z-30 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none overflow-y-auto">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-cyan-500/15 border-2 border-cyan-400/40 flex items-center justify-center mb-4 text-cyan-400 shadow-2xl shadow-cyan-950 animate-pulse">
            <Camera className="w-10 h-10 sm:w-12 sm:h-12 stroke-[2]" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white mb-1.5">
            تحديد وربط كاميرا الهاتف
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md leading-relaxed mb-4">
            حدد العدسة المناسبة للتصوير من القائمة أدناه، ثم اضغط على زر الربط لتشغيل البث فوراً.
          </p>

          {/* Device Selector Card inside the prompt */}
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-3.5 mb-4 text-right flex flex-col gap-2.5 shadow-xl">
            <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>اختر الكاميرا أو العدسة:</span>
              </span>
              <button
                onClick={onRefreshDevices}
                className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                title="تحديث العدسات"
              >
                <RefreshCw className="w-3 h-3" />
                <span>فحص الكاميرات</span>
              </button>
            </label>

            {/* Select Dropdown */}
            {availableCameras.length > 0 ? (
              <select
                value={activeDeviceId}
                onChange={e => {
                  onSelectDeviceId(e.target.value);
                  startRealCamera(e.target.value);
                }}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-cyan-400"
              >
                <option value="">الكاميرا الخلفية التلقائية (الافتراضية)</option>
                {availableCameras.map((cam, idx) => (
                  <option key={cam.id || idx} value={cam.id}>
                    {cam.label || `عدسة كاميرا ${idx + 1}`}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                سيتم فحص العدسات تلقائياً بمجرد الضغط على زر التشغيل.
              </div>
            )}

            {/* Quick Facing Mode Switcher */}
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                onClick={() => {
                  onSelectDeviceId('');
                  onToggleFacing();
                }}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                  settings.cameraFacing === 'environment'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>الخلفية (الشارع)</span>
              </button>

              <button
                onClick={() => {
                  onSelectDeviceId('');
                  onToggleFacing();
                }}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                  settings.cameraFacing === 'user'
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <SwitchCamera className="w-3.5 h-3.5" />
                <span>الأمامية (المقصورة)</span>
              </button>
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={() => startRealCamera()}
            disabled={isLoadingCamera}
            className="w-full max-w-sm flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black font-black text-sm shadow-2xl shadow-cyan-500/40 active:scale-95 transition"
          >
            <Camera className="w-5 h-5" />
            <span>
              {isLoadingCamera ? 'جاري ربط الكاميرا...' : 'ربط وتشغيل الكاميرا الآن'}
            </span>
          </button>

          {/* Open detailed modal button */}
          <button
            onClick={onOpenSelectorModal}
            className="mt-3 text-xs text-cyan-400 hover:underline flex items-center gap-1"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>عرض قائمة جميع العدسات والكاميرات الخارجية</span>
          </button>

          {permissionError && (
            <div className="mt-4 p-3 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2 max-w-sm text-right">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{permissionError}</span>
            </div>
          )}
        </div>
      )}

      {/* Floating Camera Facing & Lens Quick Switcher Button on top of video when active */}
      {streamActive && (
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onOpenSelectorModal}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/85 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-lg backdrop-blur-md text-xs font-bold active:scale-95 transition"
            title="تغيير أو اختيار عدسة أخرى"
          >
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>{cameraLabel || 'اختر العدسة'}</span>
          </button>

          <button
            onClick={onToggleFacing}
            className="p-2 rounded-full bg-slate-900/85 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-lg backdrop-blur-md text-xs font-bold active:scale-95 transition"
            title="تبديل الكاميرا (خلفية / أمامية)"
          >
            <SwitchCamera className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      )}
    </div>
  );
};
