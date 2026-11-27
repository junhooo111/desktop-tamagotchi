import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, MAX_PET_SCALE, SETTING_CHOICES, sanitizePetName, sanitizeSettings, tipIntervalMs } from './settings.js';

describe('sanitizeSettings', () => {
  it('아무것도 없거나 이상한 값이면 기본 설정이다', () => {
    expect(sanitizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings('x')).toEqual(DEFAULT_SETTINGS);
    expect(sanitizeSettings([])).toEqual(DEFAULT_SETTINGS);
  });

  it('유효한 값은 그대로 받는다', () => {
    const s = { petScale: 2, inspectEnabled: false, scanSeconds: 30, tipMinutes: 0, autoUpdate: false, showNews: false, disabledRules: ['contrast'], ignored: ['http://localhost:3000/|img-alt|img'], variant: 'pastel', accessory: 'crown', petName: '콩이', displayStage: 'baby', cardSpecies: 'fox', language: 'en' };
    expect(sanitizeSettings(s)).toEqual(s);
  });

  it('언어는 auto·ko·en 만 받고 나머지는 auto(PC 를 따름)로 돌린다', () => {
    for (const ok of ['auto', 'ko', 'en']) expect(sanitizeSettings({ language: ok }).language).toBe(ok);
    for (const bad of ['fr', 3, null, undefined]) expect(sanitizeSettings({ language: bad }).language).toBe('auto');
  });

  it('펫 이름은 다듬어서 받는다(제어문자·꺾쇠 제거, 공백 정리, 12자까지)', () => {
    expect(sanitizePetName('  콩  이 ')).toBe('콩 이');
    expect(sanitizePetName('<b>콩이</b>')).toBe('b콩이/b');
    expect(sanitizePetName('a\u0000b\nc')).toBe('abc');
    expect(sanitizePetName('가나다라마바사아자차카타파하')).toBe('가나다라마바사아자차카타');
    expect(sanitizePetName(42)).toBe('');
    expect(sanitizeSettings({ petName: { a: 1 } }).petName).toBe('');
  });

  it('보여 줄 모습은 auto·baby·adult·legend 만 받고, 나머지(알 포함)는 auto 로 돌린다', () => {
    for (const ok of ['auto', 'baby', 'adult', 'legend']) expect(sanitizeSettings({ displayStage: ok }).displayStage).toBe(ok);
    for (const bad of ['egg', 'giant', 3, null, undefined]) expect(sanitizeSettings({ displayStage: bad }).displayStage).toBe('auto');
  });

  it('프로필 카드 동물은 아는 동물이나 current 만 받는다', () => {
    expect(sanitizeSettings({ cardSpecies: 'penguin' }).cardSpecies).toBe('penguin');
    expect(sanitizeSettings({ cardSpecies: 'chimera' }).cardSpecies).toBe('current');
    expect(sanitizeSettings({}).cardSpecies).toBe('current');
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

describe('규칙 끄기·무시 목록', () => {
  it('아는 규칙만 받고(순서는 규칙 목록 순서), 중복·모르는 값은 버린다', () => {
    const s = sanitizeSettings({ disabledRules: ['contrast', 'nope', 'img-alt', 'contrast', 5] });
    expect(s.disabledRules).toEqual(['img-alt', 'contrast']);
    expect(sanitizeSettings({ disabledRules: 'img-alt' }).disabledRules).toEqual([]);
  });

  it('무시 키는 문자열만 받고, 중복·빈 값·너무 긴 값은 버리고, 최근 500개까지만 둔다', () => {
    const s = sanitizeSettings({ ignored: ['a', 'a', '', 7, 'x'.repeat(601), 'b'] });
    expect(s.ignored).toEqual(['a', 'b']);
    const many = Array.from({ length: 520 }, (_, i) => 'k' + i);
    const kept = sanitizeSettings({ ignored: many }).ignored;
    expect(kept).toHaveLength(500);
    expect(kept[0]).toBe('k20');
    expect(kept.at(-1)).toBe('k519');
  });

  it('기본값은 모든 규칙을 켜고 무시 목록은 비어 있다', () => {
    expect(DEFAULT_SETTINGS.disabledRules).toEqual([]);
    expect(DEFAULT_SETTINGS.ignored).toEqual([]);
  });
});

describe('꾸미기 설정', () => {
  it('색 변형과 장식은 아는 값만 받고, 모르면 기본값이다', () => {
    expect(sanitizeSettings({ variant: 'deep', accessory: 'wings' })).toMatchObject({ variant: 'deep', accessory: 'wings' });
    expect(sanitizeSettings({ variant: 'neon', accessory: 'laser' })).toMatchObject({ variant: 'default', accessory: 'none' });
    expect(sanitizeSettings({ variant: 3, accessory: null })).toMatchObject({ variant: 'default', accessory: 'none' });
  });
});
