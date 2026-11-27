import { describe, expect, it } from 'vitest';
import { nameEn, toEnglish } from './en-text.js';
import { SPECIES } from './species.js';
import { ACCESSORY_NAMES, VARIANT_NAMES } from './wardrobe.js';
import { ACHIEVEMENTS } from './growth.js';

describe('펫 말 영어 번역', () => {
  it('돌보기 말과 덧붙임(경험치·레벨·등급)을 이어서 번역한다', () => {
    expect(toEnglish('냠냠, 맛있어요! 경험치 +3')).toBe('Yum, delicious! XP +3');
    expect(toEnglish('신나요! 레벨 5이 되었어요! ✨ \'숙련\' 등급이 되었어요!')).toBe("So fun! Level 5 reached! ✨ Reached 'Skilled' rank!");
    expect(toEnglish('배웠어요! 경험치 +5 레벨 3이 되었어요!')).toBe('I learned something! XP +5 Level 3 reached!');
    expect(toEnglish('좋아요! 알이 부화했어요! 토끼(이)가 태어났어요.')).toContain('The egg hatched! Rabbit was born.');
  });

  it('선물·서버·업데이트 말, 여러 줄', () => {
    expect(toEnglish('🎁 뽑기권 1장이 들어 있었어요!')).toBe('🎁 There were 1 ticket(s) inside!');
    expect(toEnglish('최신 버전이에요')).toBe('You are up to date');
    expect(toEnglish('게임머니가 모자라요')).toBe('Not enough game money');
    expect(toEnglish('좋아요!\n최신 버전이에요')).toBe('Feels good!\nYou are up to date');
  });

  it('이미 영어이거나 모르는 말은 그대로 둔다', () => {
    expect(toEnglish('Hello')).toBe('Hello');
    expect(toEnglish('처음 보는 한국어 문장')).toBe('처음 보는 한국어 문장');
    expect(toEnglish('')).toBe('');
  });

  it('모든 동물·장식·색·업적 이름에 영어가 있다', () => {
    for (const s of SPECIES) expect(nameEn(s.name), s.id).not.toMatch(/[가-힣]/);
    for (const [id, ko] of Object.entries(ACCESSORY_NAMES)) if (id !== 'none') expect(nameEn(ko), id).not.toMatch(/[가-힣]/);
    for (const [id, ko] of Object.entries(VARIANT_NAMES)) expect(nameEn(ko), id).not.toMatch(/[가-힣]/);
    for (const a of ACHIEVEMENTS) expect(nameEn(a.name), a.id).not.toMatch(/[가-힣]/);
  });
});
