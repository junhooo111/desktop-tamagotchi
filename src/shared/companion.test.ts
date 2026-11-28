import { describe, expect, it } from 'vitest';
import { companionStage } from './companion.js';

describe('companionStage', () => {
  it('경험치가 적으면 새끼, 레벨 5부터 성체, 전설 모습이 있는 동물은 레벨 10부터 전설', () => {
    expect(companionStage('cat', 0)).toBe('baby');
    expect(companionStage('cat', 160)).toBe('adult'); // 1+floor(sqrt(16)) = 5
    expect(companionStage('cat', 5000)).toBe('adult'); // 전설 모습이 없는 동물
    expect(companionStage('dragon', 810)).toBe('legend'); // 레벨 10
  });
});
