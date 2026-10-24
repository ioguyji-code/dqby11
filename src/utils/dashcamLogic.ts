/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TelemetryData {
  speedKmh: number;
  latitude: number | null;
  longitude: number | null;
  altitudeMeters: number | null;
  heading: number | null;
  gForce: number;
  maxGForce: number;
  isOverspeed: boolean;
  timestamp: number;
}

export interface VideoClip {
  id: string;
  blobUrl: string;
  thumbnailUrl?: string;
  createdAt: number;
  durationSeconds: number;
  isLocked: boolean;
  incidentReason?: string;
  peakSpeedKmh: number;
  peakGForce: number;
  locationName?: string;
  latitude?: number;
  longitude?: number;
  fileSizeBytes?: number;
}

export interface DashcamSettings {
  loopDurationMinutes: number; // 1, 3, 5 mins
  maxStorageClips: number; // e.g. 10, 20
  speedLimitKmh: number; // e.g. 120
  gSensorSensitivity: 'low' | 'medium' | 'high'; // low=3.0G, med=2.2G, high=1.6G
  audioEnabled: boolean;
  showTelemetryOverlay: boolean;
  hudMirrorMode: boolean; // For windshield reflection
  nightModeFilter: boolean;
  batterySaverStealth: boolean;
  cameraFacing: 'environment' | 'user';
  videoResolution: '720p' | '1080p';
}

export const DEFAULT_SETTINGS: DashcamSettings = {
  loopDurationMinutes: 3,
  maxStorageClips: 15,
  speedLimitKmh: 120,
  gSensorSensitivity: 'medium',
  audioEnabled: true,
  showTelemetryOverlay: true,
  hudMirrorMode: false,
  nightModeFilter: false,
  batterySaverStealth: false,
  cameraFacing: 'environment',
  videoResolution: '1080p',
};

/**
 * Standard gravitational acceleration in m/s^2
 */
const GRAVITY_M_S2 = 9.80665;

/**
 * Calculate net G-force from 3-axis accelerometer
 */
export function calculateGForce(accel: { x?: number | null; y?: number | null; z?: number | null }): number {
  const x = accel.x ?? 0;
  const y = accel.y ?? 0;
  const z = accel.z ?? 0;
  
  const magnitude = Math.sqrt(x * x + y * y + z * z);
  if (magnitude === 0) return 1.0; // Resting 1G fallback
  const g = magnitude / GRAVITY_M_S2;
  return Number(Math.max(0.1, g).toFixed(2));
}

/**
 * Map sensitivity setting to G-force trigger threshold
 */
export function getGSensorThreshold(sensitivity: 'low' | 'medium' | 'high'): number {
  switch (sensitivity) {
    case 'high':
      return 1.6; // Sensitive, triggers on sudden harsh braking
    case 'medium':
      return 2.2; // Standard pothole/bump or collision
    case 'low':
      return 3.0; // Heavy collision impact only
  }
}

/**
 * Determine if an impact or crash shock occurred
 */
export function detectImpact(
  currentG: number,
  previousG: number,
  sensitivity: 'low' | 'medium' | 'high'
): { isImpact: boolean; deltaG: number } {
  const threshold = getGSensorThreshold(sensitivity);
  const deltaG = Math.abs(currentG - previousG);
  
  // Either absolute G-force surpasses limit, or a sudden spike in G
  const isImpact = currentG >= threshold || deltaG >= threshold * 0.75;
  return {
    isImpact,
    deltaG: Number(deltaG.toFixed(2)),
  };
}

/**
 * Convert meters per second (Geolocation API) to km/h
 */
export function convertMpsToKmh(mps: number | null | undefined): number {
  if (mps == null || isNaN(mps) || mps < 0.2) return 0;
  return Math.round(mps * 3.6);
}

/**
 * Check if driver exceeded configured speed limit
 */
export function checkSpeedLimit(currentKmh: number, limitKmh: number): { isOverspeed: boolean; excessKmh: number } {
  const isOverspeed = currentKmh > limitKmh;
  return {
    isOverspeed,
    excessKmh: isOverspeed ? currentKmh - limitKmh : 0,
  };
}

/**
 * Get Arabic cardinal direction name for a compass heading in degrees (0 - 360)
 */
export function getCardinalDirectionArabic(degrees: number | null): string {
  if (degrees == null || isNaN(degrees)) return 'شمال';
  const normalized = ((degrees % 360) + 360) % 360;

  if (normalized >= 337.5 || normalized < 22.5) return 'شمال (N)';
  if (normalized >= 22.5 && normalized < 67.5) return 'شمال شرق (NE)';
  if (normalized >= 67.5 && normalized < 112.5) return 'شرق (E)';
  if (normalized >= 112.5 && normalized < 157.5) return 'جنوب شرق (SE)';
  if (normalized >= 157.5 && normalized < 202.5) return 'جنوب (S)';
  if (normalized >= 202.5 && normalized < 247.5) return 'جنوب غرب (SW)';
  if (normalized >= 247.5 && normalized < 292.5) return 'غرب (W)';
  return 'شمال غرب (NW)';
}

/**
 * Format decimal coordinates to readable dashcam stamp
 */
export function formatCoordinates(lat: number | null, lng: number | null): string {
  if (lat == null || lng == null) {
    return '24°42\'48"N  46°40\'31"E'; // Riyadh default fallback
  }
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}°${latDir}  ${Math.abs(lng).toFixed(4)}°${lngDir}`;
}

/**
 * Format seconds into HH:MM:SS or MM:SS
 */
export function formatDuration(totalSeconds: number): string {
  const sec = Math.floor(totalSeconds % 60);
  const min = Math.floor((totalSeconds / 60) % 60);
  const hrs = Math.floor(totalSeconds / 3600);

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hrs > 0) {
    return `${pad(hrs)}:${pad(min)}:${pad(sec)}`;
  }
  return `${pad(min)}:${pad(sec)}`;
}

/**
 * Manage loop recording clips. When clips exceed maxClips, removes the oldest UNLOCKED clip.
 * Locked / emergency incident clips are permanently preserved unless user manually deletes them.
 */
export function manageLoopClips(
  existingClips: VideoClip[],
  newClip: VideoClip,
  maxClips: number
): VideoClip[] {
  const combined = [newClip, ...existingClips];
  
  if (combined.length <= maxClips) {
    return combined;
  }

  // Count how many unlocked clips exist
  const unlockedCount = combined.filter(c => !c.isLocked).length;
  if (unlockedCount === 0) {
    // All clips are locked, keep all to never lose emergency footage
    return combined;
  }

  // Find index of the oldest unlocked clip (from the tail) and remove it
  const result = [...combined];
  for (let i = result.length - 1; i >= 0; i--) {
    if (!result[i].isLocked) {
      result.splice(i, 1);
      break;
    }
  }

  return result;
}

/**
 * Format byte count to readable MB
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 ميغابايت';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1000) {
    return `${(mb / 1024).toFixed(1)} غيغابايت`;
  }
  return `${mb.toFixed(1)} ميغابايت`;
}

/**
 * Format timestamp in Arabic local time for dashboard
 */
export function formatDashcamTimestamp(timestamp: number): { dateStr: string; timeStr: string } {
  const d = new Date(timestamp);
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());

  return {
    dateStr: `${year}/${month}/${day}`,
    timeStr: `${hours}:${minutes}:${seconds}`,
  };
}
