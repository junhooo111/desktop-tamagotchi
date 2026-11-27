import { describe, expect, it } from 'vitest';
import { renderCardFromRow } from './card-endpoint.js';

describe('renderCardFromRow: 서버의 공개 데이터 → 카드', () => {
  it('찾은 사용자의 펫을 움직이는 SVG 로 그린다', () => {
    const { svg, status } = renderCardFromRow({ found: true, github_login: 'alice', species_id: 'cat', xp: 250, species_count: 3 });
    expect(status).toBe('ok');
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('@keyframes');
    expect(svg).not.toContain('<script');
  });

  it('레벨(경험치)에 따라 다른 카드가 나온다', () => {
    const baby = renderCardFromRow({ found: true, species_id: 'cat', xp: 5 }).svg;
    const adult = renderCardFromRow({ found: true, species_id: 'cat', xp: 2000 }).svg;
    expect(baby).not.toBe(adult);
  });

  it('펫이 없으면 알 카드(empty)', () => {
    expect(renderCardFromRow({ found: true, species_id: null, xp: null }).status).toBe('empty');
  });

  it('모르는 종이나 이상한 경험치여도 깨지지 않는다', () => {
    expect(renderCardFromRow({ found: true, species_id: 'alien', xp: 5 }).status).toBe('empty');
    expect(renderCardFromRow({ found: true, species_id: 'cat', xp: Number.NaN }).svg.startsWith('<svg')).toBe(true);
    expect(renderCardFromRow({ found: true, species_id: 'cat', xp: -5 }).svg.startsWith('<svg')).toBe(true);
    expect(renderCardFromRow({ found: true, species_id: 'cat', xp: 1e15 }).svg.startsWith('<svg')).toBe(true);
  });

  it('없는 사용자·숨긴 사용자·빈 응답은 조용한 안내 카드(notfound)이며 이름을 담지 않는다', () => {
    for (const row of [{ found: false }, null, undefined, {}]) {
      const r = renderCardFromRow(row);
      expect(r.status).toBe('notfound');
      expect(r.svg).toContain('NO PET CARD');
    }
  });

  it('사용자 이름 같은 문자열을 SVG 에 넣지 않는다(주입 방지)', () => {
    const { svg } = renderCardFromRow({ found: true, github_login: '<script>alert(1)</script>', species_id: 'cat', xp: 50 });
    expect(svg).not.toContain('alert(1)');
  });
});
