import { describe, expect, it } from 'vitest';
import { cardMarkdown, cardUrl } from './backend.js';

describe('프로필 카드 주소', () => {
  it('GitHub 이름으로 카드 주소와 README 마크다운을 만든다', () => {
    expect(cardUrl('junhooo111', 'https://x.supabase.co')).toBe('https://x.supabase.co/functions/v1/card?user=junhooo111');
    expect(cardMarkdown('junhooo111', 'https://x.supabase.co')).toBe('![Desktop Tamagotchi](https://x.supabase.co/functions/v1/card?user=junhooo111)');
  });
  it('이름 형식이 아니거나 서버 주소가 비어 있으면 만들지 않는다', () => {
    for (const bad of ['', 'a b', 'a/b', 'a?x=1', 'x'.repeat(40), '한글']) expect(cardUrl(bad, 'https://x.supabase.co'), bad).toBeNull();
    expect(cardUrl('abc', '')).toBeNull();
  });
});
