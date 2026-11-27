import { describe, expect, it } from 'vitest';
import { detectLang, isLangSetting, pick, resolveLang } from './i18n.js';

describe('언어 정하기', () => {
  it('한국어 설정이거나 지역이 한국이면 한국어, 그 밖에는 영어', () => {
    expect(detectLang('ko')).toBe('ko');
    expect(detectLang('ko-KR')).toBe('ko');
    expect(detectLang('en-US', 'KR')).toBe('ko'); // 영어 Windows 라도 한국 지역이면 한국어
    expect(detectLang('en-US', 'US')).toBe('en');
    expect(detectLang('ja', 'JP')).toBe('en');
    expect(detectLang(undefined)).toBe('en');
    expect(detectLang('', 'kr')).toBe('ko');
  });

  it('설정이 auto 면 PC 를 따르고, 직접 고르면 그대로 쓴다', () => {
    expect(resolveLang('auto', 'en-US', 'US')).toBe('en');
    expect(resolveLang('auto', 'ko', 'KR')).toBe('ko');
    expect(resolveLang('en', 'ko', 'KR')).toBe('en');
    expect(resolveLang('ko', 'en-US', 'US')).toBe('ko');
  });

  it('pick: 번역이 없으면 한국어로 돌아간다', () => {
    expect(pick('en', { ko: '안녕', en: 'hi' })).toBe('hi');
    expect(pick('en', { ko: '안녕' })).toBe('안녕');
    expect(pick('ko', { ko: '안녕', en: 'hi' })).toBe('안녕');
  });

  it('설정 값 검사', () => {
    expect(['auto', 'ko', 'en'].every(isLangSetting)).toBe(true);
    expect([null, 'fr', 3, undefined].some(isLangSetting)).toBe(false);
  });
});
