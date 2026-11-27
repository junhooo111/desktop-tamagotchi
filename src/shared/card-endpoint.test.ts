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

describe('renderCardFromRow: 서버의 extras(꾸미기·연속일·도감)', () => {
  const now = Date.parse('2026-11-27T12:00:00Z');
  const base = { found: true, github_login: 'alice', species_id: 'cat', xp: 2000, species_count: 3 };
  const extras = { variant: 'pastel', accessory: 'crown', name: '콩이', stage: 'adult', streak: 5, fixes: 12, quiz: 7, rules: 9, tips: 30, badges: 11, day: '2026-11-27' };

  it('연속일·도감·업적·고친 문제 칸이 채워진다', () => {
    const { svg } = renderCardFromRow({ ...base, extras }, now);
    expect(svg).toContain('5D');
    expect(svg).toContain('9/50');
    expect(svg).toContain('11/28');
    expect(svg).toContain('>12<');
    expect(svg).toContain('>7<');
    expect(svg).toContain('30/');
  });

  it('색·장식에 따라 그림이 달라지고, extras 가 없으면 기본 카드', () => {
    const plain = renderCardFromRow(base, now).svg;
    expect(renderCardFromRow({ ...base, extras }, now).svg).not.toBe(plain);
    expect(renderCardFromRow({ ...base, extras: { ...extras, accessory: 'none', variant: 'default', name: '', streak: 0, badges: 0, rules: 0, fixes: 0, quiz: 0, tips: 0 } }, now).svg).not.toBe(renderCardFromRow({ ...base, extras: { ...extras, accessory: 'crown', variant: 'default' } }, now).svg);
    expect(renderCardFromRow({ ...base, extras: null }, now).svg).toBe(plain);
  });

  it('보낸 지 이틀이 넘은 연속일은 이어지지 않은 것으로 0', () => {
    expect(renderCardFromRow({ ...base, extras: { ...extras, day: '2026-11-20' } }, now).svg).toContain('0D');
    expect(renderCardFromRow({ ...base, extras: { ...extras, day: '2026-11-26' } }, now).svg).toContain('5D');
  });

  it('이상한 extras 는 무시하고 깨지지 않으며, 이름·값을 SVG 에 그대로 넣지 않는다', () => {
    for (const bad of ['x', 3, [], { variant: 'neon', accessory: 'laser', streak: 'x', fixes: -1, badges: 1e12, stage: 'egg', name: '<script>alert(1)</script>' }]) {
      const { svg, status } = renderCardFromRow({ ...base, extras: bad }, now);
      expect(status).toBe('ok');
      expect(svg.startsWith('<svg')).toBe(true);
      expect(svg).not.toContain('<script');
    }
  });

  it('전설 모습은 히든 동물에게만 허용한다', () => {
    const normal = renderCardFromRow({ ...base, extras: { ...extras, stage: 'legend' } }, now).svg;
    expect(normal).toBe(renderCardFromRow({ ...base, extras: { ...extras, stage: undefined } }, now).svg);
  });
});

