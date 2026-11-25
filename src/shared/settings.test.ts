import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, MAX_PET_SCALE, SETTING_CHOICES, sanitizeSettings, tipIntervalMs } from './settings.js';

describe('sanitizeSettings', () => {
  it('아무것도 없거나 이상한 값이면 기본 설정이다', () => {
    expect(sanitizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings('x')).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings([])).toEqual(DEFAULT_SETTINGS);
  });

  it('유효한 값은 그대로 받는다', () => {
    const s = { petScale: 2, inspectEnabled: false, scanSeconds: 30, tipMinutes: 0, autoUpdate: false };
    expect(sanitizeSettings(s)).toEqual(s);
  });

  it('허용하지 않는 값은 항목별로 기본값으로 바꾼다(나머지는 유지)', () => {
    const s = sanitizeSettings({ petScale: 1.5, scanSeconds: 1, tipMinutes: -5, inspectEnabled: 'yes', autoUpdate: false });
    expect(s.petScale).toBe(DEFAULT_SETTINGS.petScale); // 1.5 배는 도트가 뭉개져서 허용하지 않는다
    expect(s.scanSeconds).toBe(DEFAULT_SETTINGS.scanSeconds);
    expect(s.tipMinutes).toBe(DEFAULT_SETTINGS.tipMinutes);
    expect(s.inspectEnabled).toBe(DEFAULT_SETTINGS.inspectEnabled);
    expect(s.autoUpdate).toBe(false);
  });

  it('숫자 모양 문자열이나 NaN·Infinity 는 받지 않는다', () => {
    expect(sanitizeSettings({ petScale: '2' }).petScale).toBe(DEFAULT_SETTINGS.petScale);
    expect(sanitizeSettings({ petScale: Number.NaN }).petScale).toBe(DEFAULT_SETTINGS.petScale);
    expect(sanitizeSettings({ scanSeconds: Infinity }).scanSeconds).toBe(DEFAULT_SETTINGS.scanSeconds);
  });

  it('모르는 항목은 버린다', () => {
    expect(Object.keys(sanitizeSettings({ hack: 1, __proto__: { x: 1 } }))).toEqual(Object.keys(DEFAULT_SETTINGS));
  });
});

describe('설정값 목록', () => {
  it('선택지에 기본값이 들어 있고, 펫 배율은 정수이며 최대값이 선택지의 최대와 같다', () => {
    expect(SETTING_CHOICES.petScale).toContain(DEFAULT_SETTINGS.petScale);
    expect(SETTING_CHOICES.scanSeconds).toContain(DEFAULT_SETTINGS.scanSeconds);
    expect(SETTING_CHOICES.tipMinutes).toContain(DEFAULT_SETTINGS.tipMinutes);
    expect(SETTING_CHOICES.petScale.every((n) => Number.isInteger(n))).toBe(true);
    expect(Math.max(...SETTING_CHOICES.petScale)).toBe(MAX_PET_SCALE);
  });
});

describe('tipIntervalMs', () => {
  it('분을 ms 로 바꾸고, 0 이면 알리지 않는다(Infinity)', () => {
    expect(tipIntervalMs({ tipMinutes: 20 })).toBe(1_200_000);
    expect(tipIntervalMs({ tipMinutes: 10 })).toBe(600_000);
    expect(tipIntervalMs({ tipMinutes: 0 })).toBe(Infinity);
  });
});
