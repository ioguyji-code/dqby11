/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CameraView } from './components/CameraView';
import { TelemetryHUD } from './components/TelemetryHUD';
import { ControlBar } from './components/ControlBar';
import { RecordingsModal } from './components/RecordingsModal';
import { SettingsModal } from './components/SettingsModal';
import { StealthOverlay } from './components/StealthOverlay';
import { CameraSelectorModal, CameraDeviceInfo } from './components/CameraSelectorModal';
import {
  DashcamSettings,
  DEFAULT_SETTINGS,
  TelemetryData,
  VideoClip,
  calculateGForce,
  detectImpact,
  convertMpsToKmh,
  checkSpeedLimit,
  manageLoopClips,
} from './utils/dashcamLogic';
import { dashcamAudio } from './utils/audioAlerts';

// Seed sample clips so the library is immediately usable and showcase incident protection
const SEED_CLIPS: VideoClip[] = [
  {
    id: 'seed-incident-1',
    blobUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    createdAt: Date.now() - 3600000 * 2,
    durationSeconds: 90,
    isLocked: true,
    incidentReason: 'صدمة مستشعر G-Sensor مفاجئة (2.6G)',
    peakSpeedKmh: 114,
    peakGForce: 2.65,
    latitude: 24.7136,
    longitude: 46.6753,
    fileSizeBytes: 24 * 1024 * 1024,
  },
  {
    id: 'seed-loop-2',
    blobUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    createdAt: Date.now() - 3600000 * 5,
    durationSeconds: 180,
    isLocked: false,
    peakSpeedKmh: 98,
    peakGForce: 1.2,
    latitude: 24.7742,
    longitude: 46.7385,
    fileSizeBytes: 38 * 1024 * 1024,
  },
];

export default function App() {
  // Load stored settings or default
  const [settings, setSettings] = useState<DashcamSettings>(() => {
    try {
      const stored = localStorage.getItem('dashcam_settings');
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Clips list
  const [clips, setClips] = useState<VideoClip[]>(() => {
    try {
      const stored = localStorage.getItem('dashcam_clips');
      return stored ? JSON.parse(stored) : SEED_CLIPS;
    } catch {
      return SEED_CLIPS;
    }
  });

  // Hardware Camera Device Selection States
  const [availableCameras, setAvailableCameras] = useState<CameraDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string>(() => {
    try {
      return localStorage.getItem('dashcam_selected_camera_id') || '';
    } catch {
      return '';
    }
  });
  const [isCameraSelectorOpen, setIsCameraSelectorOpen] = useState(false);
  const [isRefreshingCameras, setIsRefreshingCameras] = useState(false);

  // Core Dashcam states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingElapsedSeconds, setRecordingElapsedSeconds] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [incidentAlert, setIncidentAlert] = useState<string | null>(null);

  // Modals & Overlays
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStealthActive, setIsStealthActive] = useState(false);

  // Real-time Telemetry (defaulting to safe initial values, updated by device GPS & motion sensors)
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    speedKmh: 0,
    latitude: 24.7136,
    longitude: 46.6753,
    altitudeMeters: 612,
    heading: 0,
    gForce: 1.0,
    maxGForce: 1.0,
    isOverspeed: false,
    timestamp: Date.now(),
  });

  const previousGRef = useRef<number>(1.0);
  const recordingTimerRef = useRef<any>(null);

  // Sync settings changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('dashcam_settings', JSON.stringify(settings));
    } catch {}
    dashcamAudio.setMuted(!settings.audioEnabled);
  }, [settings]);

  // Sync clips to localStorage
  useEffect(() => {
    try {
      const lightweight = clips.slice(0, 20).map(c => ({
        ...c,
        blobUrl: c.blobUrl.startsWith('blob:') ? '' : c.blobUrl,
      }));
      localStorage.setItem('dashcam_clips', JSON.stringify(lightweight));
    } catch {}
  }, [clips]);

  // Query and enumerate cameras
  const refreshDevices = useCallback(async () => {
    setIsRefreshingCameras(true);
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices: CameraDeviceInfo[] = devices
        .filter(d => d.kind === 'videoinput')
        .map((d, i) => {
          const lbl = d.label || '';
          let facing: 'environment' | 'user' | 'unknown' = 'unknown';
          if (lbl.toLowerCase().includes('front') || lbl.includes('أمامية') || lbl.toLowerCase().includes('user')) {
            facing = 'user';
          } else if (lbl.toLowerCase().includes('back') || lbl.toLowerCase().includes('rear') || lbl.includes('خلفية') || lbl.toLowerCase().includes('environment')) {
            facing = 'environment';
          }

          let friendlyLabel = lbl;
          if (!friendlyLabel) {
            friendlyLabel = `عدسة كاميرا ${i + 1}`;
          }

          return {
            id: d.deviceId,
            label: friendlyLabel,
            facing,
          };
        });

      setAvailableCameras(videoDevices);
    } catch {
      // Ignored
    } finally {
      setIsRefreshingCameras(false);
    }
  }, []);

  useEffect(() => {
    refreshDevices();
    if (navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', refreshDevices);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', refreshDevices);
      };
    }
  }, [refreshDevices]);

  // Handle autostart query parameter (for testability)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      setIsRecording(true);
    }
  }, []);

  // Real Device Geolocation Watcher (Speed, Coordinates, Heading, Altitude)
  useEffect(() => {
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      pos => {
        const currentKmh = convertMpsToKmh(pos.coords.speed);
        const { isOverspeed } = checkSpeedLimit(currentKmh, settings.speedLimitKmh);

        if (isOverspeed && !telemetry.isOverspeed) {
          dashcamAudio.playSpeedWarning();
        }

        setTelemetry(prev => ({
          ...prev,
          speedKmh: currentKmh,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          altitudeMeters: pos.coords.altitude ?? prev.altitudeMeters,
          heading: pos.coords.heading ?? prev.heading,
          isOverspeed,
          timestamp: pos.timestamp || Date.now(),
        }));
      },
      () => {},
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
        timeout: 5000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [settings.speedLimitKmh, telemetry.isOverspeed]);

  // Real Device Accelerometer & G-Force Watcher (Collision detection)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      if (!event.accelerationIncludingGravity) return;

      const g = calculateGForce(event.accelerationIncludingGravity);
      const { isImpact } = detectImpact(g, previousGRef.current, settings.gSensorSensitivity);

      previousGRef.current = g;

      if (isImpact) {
        setIsLocked(true);
        setIncidentAlert(`صدمة G-Force بقوة ${g}G`);
        dashcamAudio.playEmergencyAlert();

        setTimeout(() => {
          setIncidentAlert(null);
        }, 5000);
      }

      setTelemetry(prev => ({
        ...prev,
        gForce: g,
        maxGForce: Math.max(prev.maxGForce, g),
        timestamp: Date.now(),
      }));
    };

    window.addEventListener('devicemotion', handleDeviceMotion);
    return () => {
      window.removeEventListener('devicemotion', handleDeviceMotion);
    };
  }, [settings.gSensorSensitivity]);

  // Recording Timer
  useEffect(() => {
    if (isRecording) {
      setRecordingElapsedSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingElapsedSeconds(sec => sec + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      setRecordingElapsedSeconds(0);
      setIsLocked(false);
    }

    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [isRecording]);

  // Camera selection handlers
  const handleSelectDeviceId = useCallback((deviceId: string) => {
    setActiveDeviceId(deviceId);
    try {
      if (deviceId) {
        localStorage.setItem('dashcam_selected_camera_id', deviceId);
      } else {
        localStorage.removeItem('dashcam_selected_camera_id');
      }
    } catch {}
  }, []);

  const handleSelectFacingMode = useCallback((facing: 'environment' | 'user') => {
    setActiveDeviceId('');
    try {
      localStorage.removeItem('dashcam_selected_camera_id');
    } catch {}
    setSettings(prev => ({ ...prev, cameraFacing: facing }));
  }, []);

  const handleToggleFacing = useCallback(() => {
    setActiveDeviceId('');
    try {
      localStorage.removeItem('dashcam_selected_camera_id');
    } catch {}
    setSettings(prev => ({
      ...prev,
      cameraFacing: prev.cameraFacing === 'environment' ? 'user' : 'environment',
    }));
  }, []);

  // Handlers
  const handleToggleRecord = useCallback(() => {
    setIsRecording(prev => !prev);
  }, []);

  const handleEmergencyLock = useCallback(() => {
    setIsLocked(true);
    setIncidentAlert('تم تفعيل قفل الطوارئ لحماية المقطع');
    dashcamAudio.playEmergencyAlert();

    setTimeout(() => {
      setIncidentAlert(null);
    }, 4500);
  }, []);

  const handleTakeSnapshot = useCallback(() => {
    window.dispatchEvent(new CustomEvent('dashcam-take-snapshot'));
  }, []);

  const handleNewClip = useCallback((clip: VideoClip) => {
    setClips(prev => manageLoopClips(prev, clip, settings.maxStorageClips));
  }, [settings.maxStorageClips]);

  const handleToggleLockClip = useCallback((id: string) => {
    setClips(prev =>
      prev.map(c => (c.id === id ? { ...c, isLocked: !c.isLocked } : c))
    );
  }, []);

  const handleDeleteClip = useCallback((id: string) => {
    setClips(prev => prev.filter(c => c.id !== id));
  }, []);

  const handleUpdateSettings = useCallback((newPartial: Partial<DashcamSettings>) => {
    setSettings(prev => ({ ...prev, ...newPartial }));
  }, []);

  return (
    <main
      className="relative w-screen h-screen overflow-hidden bg-black flex flex-col justify-between font-sans select-none"
      dir="rtl"
    >
      {/* Real Hardware Phone Camera Stream Viewport */}
      <div className="relative flex-1 w-full min-h-0 overflow-hidden">
        <CameraView
          settings={settings}
          telemetry={telemetry}
          isRecording={isRecording}
          isLocked={isLocked}
          activeDeviceId={activeDeviceId}
          availableCameras={availableCameras}
          onNewClip={handleNewClip}
          onToggleFacing={handleToggleFacing}
          onSelectDeviceId={handleSelectDeviceId}
          onOpenSelectorModal={() => setIsCameraSelectorOpen(true)}
          onRefreshDevices={refreshDevices}
        />

        {/* Live Telemetry Heads-Up Display (HUD) */}
        <TelemetryHUD
          telemetry={telemetry}
          settings={settings}
          isRecording={isRecording}
          recordingElapsedSeconds={recordingElapsedSeconds}
          isLocked={isLocked}
          incidentAlertMessage={incidentAlert}
          onToggleFacing={() => setIsCameraSelectorOpen(true)}
        />
      </div>

      {/* Driver Automotive Control Bar */}
      <ControlBar
        isRecording={isRecording}
        isLocked={isLocked}
        settings={settings}
        clipsCount={clips.length}
        onToggleRecord={handleToggleRecord}
        onEmergencyLock={handleEmergencyLock}
        onTakeSnapshot={handleTakeSnapshot}
        onToggleAudio={() => handleUpdateSettings({ audioEnabled: !settings.audioEnabled })}
        onToggleNightFilter={() => handleUpdateSettings({ nightModeFilter: !settings.nightModeFilter })}
        onToggleHudMirror={() => handleUpdateSettings({ hudMirrorMode: !settings.hudMirrorMode })}
        onToggleStealthMode={() => setIsStealthActive(true)}
        onFlipCamera={() => setIsCameraSelectorOpen(true)}
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Screen Saver / Battery-Saver Stealth Overlay */}
      {isStealthActive && (
        <StealthOverlay
          isRecording={isRecording}
          recordingElapsedSeconds={recordingElapsedSeconds}
          isLocked={isLocked}
          currentSpeedKmh={telemetry.speedKmh}
          onExitStealth={() => setIsStealthActive(false)}
        />
      )}

      {/* Camera Selection & Lens Switcher Modal */}
      <CameraSelectorModal
        isOpen={isCameraSelectorOpen}
        onClose={() => setIsCameraSelectorOpen(false)}
        availableCameras={availableCameras}
        activeDeviceId={activeDeviceId}
        onSelectCamera={id => {
          handleSelectDeviceId(id);
          setIsCameraSelectorOpen(false);
        }}
        onRefreshDevices={refreshDevices}
        onSelectFacingMode={facing => {
          handleSelectFacingMode(facing);
          setIsCameraSelectorOpen(false);
        }}
        currentFacing={settings.cameraFacing}
        isLoading={isRefreshingCameras}
      />

      {/* Video Library & Incidents Modal */}
      <RecordingsModal
        clips={clips}
        maxStorageClips={settings.maxStorageClips}
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onToggleLock={handleToggleLockClip}
        onDeleteClip={handleDeleteClip}
      />

      {/* Settings & Vehicle Mounting Guide Modal */}
      <SettingsModal
        settings={settings}
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onUpdateSettings={handleUpdateSettings}
      />
    </main>
  );
}
