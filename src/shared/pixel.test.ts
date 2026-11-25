import { describe, expect, it } from 'vitest';
import {
  SIZE,
  blank,
  boundsOf,
  ellipse,
  flipRows,
  line,
  mark,
  markEllipse,
  orientRows,
  outline,
  part,
  px,
  rect,
  rotateCW,
  shadeGrid,
  shift,
  stamp,
  toRows,
  triangle,
} from './pixel.js';

const rowsOf = (g: string[][]): string[] => g.map((r) => r.join(''));
const filled = (g: string[][]): number => g.flat().filter((c) => c !== '.').length;

describe('기본 그리기', () => {
  it('blank 는 SIZE x SIZE 투명 격자다(32x32)', () => {
    const g = blank();
    expect(SIZE).toBe(32);
    expect(g).toHaveLength(SIZE);
    expect(g.every((row) => row.length === SIZE && row.every((c) => c === '.'))).toBe(true);
  });

  it('px / rect 는 격자 밖을 무시한다', () => {
    const g = blank();
    px(g, -1, 0, 'a');
    px(g, 0, SIZE, 'a');
    px(g, SIZE, 0, 'a');
    rect(g, SIZE - 1, SIZE - 1, 3, 3, 'b');
    expect(g.flat().filter((c) => c !== '.')).toEqual(['b']);
  });

  it('px / rect 는 소수 좌표를 가장 가까운 칸으로 반올림한다(배열의 가짜 칸에 쓰지 않는다)', () => {
    const g = blank();
    px(g, 2.4, 3.6, 'a');
    expect(g[4]?.[2]).toBe('a');
    rect(g, 10.4, 10.6, 2.2, 1.8, 'b'); // 가장자리 10.4→10, 12.6→13, 10.6→11, 12.4→12
    expect(g[11]?.slice(9, 14).join('')).toBe('.bbb.');
    expect(g[10]?.[10]).toBe('.');
    expect(g[12]?.[10]).toBe('.');
    expect(Object.keys(g[4] ?? [])).toHaveLength(SIZE); // 가짜 속성이 생기지 않는다
  });

  it('ellipse 는 중심 기준 대칭인 속이 찬 타원을 그린다', () => {
    const g = blank();
    ellipse(g, 8, 8, 2.5, 2.5, 'o');
    expect(g[8]?.slice(5, 12).join('')).toBe('.ooooo.');
    expect(g[8]?.[8]).toBe('o');
    expect(g[3]?.[8]).toBe('.');
  });

  it('triangle 은 세 꼭짓점 안쪽을 채우고, 어느 방향으로 적어도 같다', () => {
    const a = blank();
    const b = blank();
    triangle(a, 2, 2, 12, 2, 2, 12, 't');
    triangle(b, 2, 12, 2, 2, 12, 2, 't');
    expect(rowsOf(a)).toEqual(rowsOf(b));
    expect(a[3]?.[3]).toBe('t');
    expect(a[11]?.[11]).toBe('.'); // 빗변 바깥
    expect(filled(a)).toBeGreaterThan(40);
  });

  it('line 은 두 점을 잇고, 굵게 하면 더 많은 칸을 칠한다', () => {
    const thin = blank();
    line(thin, 2, 2, 12, 2, 'l');
    expect(thin[2]?.slice(2, 13).join('')).toBe('lllllllllll');
    const thick = blank();
    line(thick, 2, 6, 12, 6, 'l', 3);
    expect(filled(thick)).toBeGreaterThan(filled(thin) * 2);
    expect(thick[5]?.[7]).toBe('l');
    expect(thick[7]?.[7]).toBe('l');
  });

  it('mark / markEllipse 는 이미 칠해진 칸만 바꾼다', () => {
    const g = blank();
    rect(g, 2, 2, 2, 1, 'o');
    mark(g, 1, 2, 4, 1, 'x');
    expect(g[2]?.slice(0, 6).join('')).toBe('..xx..');

    const e = blank();
    ellipse(e, 10, 10, 4, 4, 'o');
    markEllipse(e, 10, 12, 6, 2, 'b');
    expect(e[12]?.[10]).toBe('b');
    expect(e[2]?.[10]).toBe('.'); // 몸 밖은 칠하지 않는다
    expect(e[9]?.[10]).toBe('o'); // 무늬 타원 밖의 몸은 그대로
    expect(e[14]?.[6]).toBe('.'); // 무늬 타원 안이어도 몸 밖이면 칠하지 않는다
  });

  it('shift 는 그림을 옮기고 밖으로 나간 칸은 버린다', () => {
    const g = blank();
    px(g, 3, 3, 'a');
    px(g, 0, 0, 'b');
    const moved = shift(g, 1, -1);
    expect(moved[2]?.[4]).toBe('a');
    expect(moved.flat().filter((c) => c !== '.')).toEqual(['a']);
  });
});

describe('음영과 부품', () => {
  const shade = { o: { dark: 'D', light: 'L' } };

  it('shadeGrid 는 아래가 빈 칸을 어둡게, 위가 빈 칸을 밝게 바꾼다(아래쪽 우선)', () => {
    const g = blank();
    rect(g, 4, 4, 3, 3, 'o');
    shadeGrid(g, shade);
    expect(g[4]?.slice(4, 7).join('')).toBe('LLL'); // 위쪽 가장자리
    expect(g[5]?.slice(4, 7).join('')).toBe('ooo'); // 가운데는 그대로
    expect(g[6]?.slice(4, 7).join('')).toBe('DDD'); // 아래쪽 가장자리
  });

  it('높이가 1칸인 부품은 아래쪽 규칙(어둡게)이 이긴다', () => {
    const g = blank();
    rect(g, 4, 4, 3, 1, 'o');
    shadeGrid(g, shade);
    expect(g[4]?.slice(4, 7).join('')).toBe('DDD');
  });

  it('shadeGrid 는 shade 표에 없는 문자를 건드리지 않는다', () => {
    const g = blank();
    rect(g, 4, 4, 3, 3, 'z');
    shadeGrid(g, shade);
    expect(g.flat().filter((c) => c === 'z')).toHaveLength(9);
  });

  it('stamp 는 부품을 얹고 바깥에 윤곽선을 두르되, 아래 그림 위에 겹쳐 덮는다', () => {
    const base = blank();
    rect(base, 0, 0, 10, 10, 'u');
    const t = blank();
    rect(t, 4, 4, 2, 2, 'p');
    stamp(base, t, 'k');
    expect(base[4]?.slice(3, 7).join('')).toBe('kppk');
    expect(base[3]?.[4]).toBe('k');
    expect(base[3]?.[3]).toBe('u'); // 대각선은 두르지 않는다
    expect(base[0]?.[0]).toBe('u'); // 멀리 있는 아래 그림은 그대로
  });

  it('stamp 의 outline 이 null 이면 윤곽선 없이 얹는다', () => {
    const base = blank();
    const t = blank();
    px(t, 5, 5, 'p');
    stamp(base, t, null);
    expect(filled(base)).toBe(1);
  });

  it('part 는 그리기 → 음영 → 윤곽선 순서로 처리하고, 나중 부품이 앞에 놓인다', () => {
    const g = blank();
    part(g, (t) => ellipse(t, 10, 10, 4, 4, 'o'), { outline: 'k', shade });
    part(g, (t) => ellipse(t, 13, 10, 3, 3, 'o'), { outline: 'k', shade });
    // 두 번째 부품의 윤곽선이 첫 번째 부품 위에 보인다
    expect(g.flat()).toContain('k');
    expect(g.flat()).toContain('D');
    expect(g.flat()).toContain('L');
    // 첫 부품의 안쪽은 두 번째 부품의 윤곽선(k)에 일부 가려진다
    const row = rowsOf(g)[10] ?? '';
    expect(row.indexOf('k')).toBeLessThan(row.lastIndexOf('k'));
  });

  it('toRows 는 격자를 문자열 행으로 바꾼다', () => {
    const g = blank();
    px(g, 1, 0, 'a');
    expect(toRows(g)[0]?.slice(0, 3)).toBe('.a.');
  });
});

describe('프레임(문자열 행) 다루기', () => {
  it('flipRows 는 좌우를 뒤집는다', () => {
    const g = blank();
    px(g, 2, 5, 'a');
    expect(flipRows(rowsOf(g))[5]?.[SIZE - 1 - 2]).toBe('a');
  });

  it('rotateCW 는 시계 방향으로 90도 돌리고, 네 번 돌리면 제자리다', () => {
    const g = blank();
    px(g, 0, 0, 'a'); // 왼쪽 위 → 오른쪽 위
    const rows = rowsOf(g);
    expect(rotateCW(rows)[0]?.[SIZE - 1]).toBe('a');
    const four = rotateCW(rotateCW(rotateCW(rotateCW(rows))));
    expect(four).toEqual(rows);
  });

  it('orientRows 는 flip 을 먼저 하고 quarter 만큼 돌린다', () => {
    const g = blank();
    px(g, 0, 0, 'a');
    const rows = rowsOf(g);
    expect(orientRows(rows, false, 0)).toEqual(rows);
    expect(orientRows(rows, true, 0)[0]?.[SIZE - 1]).toBe('a'); // 뒤집기만: 오른쪽 위
    expect(orientRows(rows, true, 1)[SIZE - 1]?.[SIZE - 1]).toBe('a'); // 뒤집고 돌리기: 오른쪽 아래
    expect(orientRows(rows, false, 5)).toEqual(orientRows(rows, false, 1)); // 4의 배수는 무시
  });

  it('outline 은 바깥 4방향 이웃에만 윤곽선을 두르고 안쪽 색은 그대로 둔다', () => {
    const g = blank();
    px(g, 5, 5, 'o');
    const rows = outline(g);
    expect(rows[5]?.slice(4, 7)).toBe('kok');
    expect(rows[4]?.[5]).toBe('k');
    expect(rows[6]?.[5]).toBe('k');
    expect(rows[4]?.[4]).toBe('.'); // 대각선은 두르지 않는다
    expect(rows.every((r) => r.length === SIZE)).toBe(true);
  });

  it('outline 은 격자 가장자리에 닿은 그림도 다룬다', () => {
    const g = blank();
    px(g, 0, 0, 'o');
    const rows = outline(g);
    expect(rows[0]?.slice(0, 2)).toBe('ok');
    expect(rows[1]?.[0]).toBe('k');
  });

  it('boundsOf 는 그려진 칸을 모두 감싸는 사각형을 돌려주고, 비어 있으면 null', () => {
    const g = blank();
    px(g, 5, 7, 'a');
    px(g, 12, 3, 'b');
    expect(boundsOf(rowsOf(g))).toEqual({ x0: 5, y0: 3, x1: 12, y1: 7 });
    expect(boundsOf(rowsOf(blank()))).toBeNull();
  });
});
