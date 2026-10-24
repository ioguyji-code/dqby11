/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateGForce,
  detectImpact,
  convertMpsToKmh,
  checkSpeedLimit,
  getCardinalDirectionArabic,
  formatCoordinates,
  formatDuration,
  manageLoopClips,
  formatFileSize,
  VideoClip,
} from './dashcamLogic';

test('calculateGForce calculates correct normalized G-force', () => {
  // At rest on earth: 0, 0, 9.80665 m/s^2 should yield approx 1.0G
  const restG = calculateGForce({ x: 0, y: 0, z: 9.80665 });
  assert.equal(restG, 1.0);

  // During sudden 20 m/s^2 shock
  const shockG = calculateGForce({ x: 12, y: 16, z: 9.8 });
  assert.ok(shockG > 2.0);

  // Fallback for null / 0 values
  const zeroG = calculateGForce({ x: 0, y: 0, z: 0 });
  assert.equal(zeroG, 1.0);
});

test('detectImpact flags collision when shock exceeds sensitivity threshold', () => {
  // Normal driving small bump: 1.1G -> 1.3G
  const normalBump = detectImpact(1.3, 1.1, 'medium');
  assert.equal(normalBump.isImpact, false);

  // Crash / emergency brake with medium sensitivity (threshold 2.2G)
  const crash = detectImpact(2.6, 1.0, 'medium');
  assert.equal(crash.isImpact, true);
  assert.equal(crash.deltaG, 1.6);

  // High sensitivity should trigger on 1.8G
  const highSensBrake = detectImpact(1.8, 1.0, 'high');
  assert.equal(highSensBrake.isImpact, true);

  // Low sensitivity should ignore 2.3G (needs >= 3.0G)
  const lowSensBrake = detectImpact(2.3, 1.0, 'low');
  assert.equal(lowSensBrake.isImpact, false);
});

test('convertMpsToKmh converts speed accurately', () => {
  // 0 m/s -> 0 km/h
  assert.equal(convertMpsToKmh(0), 0);
  assert.equal(convertMpsToKmh(null), 0);
  // 10 m/s = 36 km/h
  assert.equal(convertMpsToKmh(10), 36);
  // 33.33 m/s = 120 km/h
  assert.equal(convertMpsToKmh(33.333), 120);
});

test('checkSpeedLimit detects overspeed violations correctly', () => {
  const safe = checkSpeedLimit(110, 120);
  assert.equal(safe.isOverspeed, false);
  assert.equal(safe.excessKmh, 0);

  const violation = checkSpeedLimit(135, 120);
  assert.equal(violation.isOverspeed, true);
  assert.equal(violation.excessKmh, 15);
});

test('getCardinalDirectionArabic returns expected compass readings', () => {
  assert.equal(getCardinalDirectionArabic(0), 'شمال (N)');
  assert.equal(getCardinalDirectionArabic(90), 'شرق (E)');
  assert.equal(getCardinalDirectionArabic(180), 'جنوب (S)');
  assert.equal(getCardinalDirectionArabic(270), 'غرب (W)');
  assert.equal(getCardinalDirectionArabic(45), 'شمال شرق (NE)');
});

test('formatCoordinates returns formatted coordinates with direction markers', () => {
  const formatted = formatCoordinates(24.7136, 46.6753);
  assert.ok(formatted.includes('24.7136°N'));
  assert.ok(formatted.includes('46.6753°E'));
});

test('formatDuration formats seconds to MM:SS and HH:MM:SS', () => {
  assert.equal(formatDuration(45), '00:45');
  assert.equal(formatDuration(125), '02:05');
  assert.equal(formatDuration(3665), '01:01:05');
});

test('manageLoopClips recycles oldest unlocked clip while never deleting locked emergency clips', () => {
  const clip1: VideoClip = {
    id: 'c1',
    blobUrl: '',
    createdAt: 1000,
    durationSeconds: 60,
    isLocked: false,
    peakSpeedKmh: 80,
    peakGForce: 1.0,
  };
  const clip2Locked: VideoClip = {
    id: 'c2',
    blobUrl: '',
    createdAt: 2000,
    durationSeconds: 60,
    isLocked: true, // Emergency locked
    peakSpeedKmh: 95,
    peakGForce: 2.8,
  };
  const clip3: VideoClip = {
    id: 'c3',
    blobUrl: '',
    createdAt: 3000,
    durationSeconds: 60,
    isLocked: false,
    peakSpeedKmh: 75,
    peakGForce: 1.1,
  };
  const newClip4: VideoClip = {
    id: 'c4',
    blobUrl: '',
    createdAt: 4000,
    durationSeconds: 60,
    isLocked: false,
    peakSpeedKmh: 85,
    peakGForce: 1.0,
  };

  // Limit = 3 clips. Currently we have [clip3, clip2Locked, clip1]
  // Adding clip4 -> should purge oldest unlocked clip (clip1), NOT clip2Locked!
  const current = [clip3, clip2Locked, clip1];
  const updated = manageLoopClips(current, newClip4, 3);

  assert.equal(updated.length, 3);
  assert.equal(updated[0].id, 'c4'); // newest
  assert.ok(updated.some(c => c.id === 'c2')); // locked clip preserved
  assert.ok(!updated.some(c => c.id === 'c1')); // oldest unlocked clip was purged
});

test('formatFileSize formats byte quantities to MB and GB', () => {
  assert.equal(formatFileSize(15 * 1024 * 1024), '15.0 ميغابايت');
  assert.equal(formatFileSize(1.5 * 1024 * 1024 * 1024), '1.5 غيغابايت');
});
