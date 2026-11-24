import { describe, expect, it } from 'vitest';
import { SIZE, blank, ellipse, flipRows, mark, orientRows, outline, px, rect, rotateCW, shift } from './pixel.js';

const rowsOf = (g: string[][]): string[] => g.map((r) => r.join(''));

describe('pixel 도구', () => {
  it('blank 는 16x16 투명 격자다', () => {
    const g = blank();
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

  it('ellipse 는 중심 기준 대칭인 속이 찬 타원을 그린다', () => {
    const g = blank();
    ellipse(g, 8, 8, 2.5, 2.5, 'o');
    expect(g[8]?.slice(5, 12).join('')).toBe('.ooooo.');
    expect(g[8]?.[8]).toBe('o');
    expect(g[3]?.[8]).toBe('.');
  });

  it('mark 는 칠해진 칸만 바꾼다', () => {
    const g = blank();
    rect(g, 2, 2, 2, 1, 'o');
    mark(g, 1, 2, 4, 1, 'x');
    expect(g[2]?.slice(0, 6).join('')).toBe('..xx..');
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

  it('shift 는 그림을 옮기고 밖으로 나간 칸은 버린다', () => {
    const g = blank();
    px(g, 3, 3, 'a');
    px(g, 0, 0, 'b');
    const moved = shift(g, 1, -1);
    expect(moved[2]?.[4]).toBe('a');
    expect(moved.flat().filter((c) => c !== '.')).toEqual(['a']);
  });

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

  it('outline 은 격자 가장자리에 닿은 그림도 다룬다', () => {
    const g = blank();
    px(g, 0, 0, 'o');
    const rows = outline(g);
    expect(rows[0]?.slice(0, 2)).toBe('ok');
    expect(rows[1]?.[0]).toBe('k');
  });
});
