import { describe, expect, it, vi } from 'vitest';
import { findItem, flattenItems, toNativeTemplate, type MenuModel } from './menu.js';

const model = (): MenuModel => ({
  header: { name: '콩이', sub: '병아리 · 성체', level: 6, tierName: '새내기', tierColor: '#8d7b68', bars: [{ label: '배부름', value: 80, level: 'high' }] },
  update: { id: 'update', label: '새 버전 설치', icon: 'update' },
  care: [
    { id: 'care:touch', label: '쓰다듬기', icon: 'touch' },
    { id: 'care:feed', label: '밥 주기', icon: 'feed', enabled: false },
  ],
  tabs: [
    { id: 'pet', label: '펫', icon: 'paw', items: [{ id: 'wardrobe', label: '꾸미기…', icon: 'star' }, { id: 'collection', label: '뽑기·컬렉션…', badge: '3장' }] },
    { id: 'dev', label: '개발', icon: 'tool', items: [{ id: 'tools', label: '검사 도구', children: [{ id: 'tools:demo', label: '체험' }] }] },
  ],
  tab: 'pet',
  footer: [
    { id: 'settings', label: '설정…' },
    { id: 'autostart', label: '로그인할 때 자동 실행', checked: true },
    { id: 'quit', label: '종료' },
  ],
  text: { back: '뒤로', close: '닫기', empty: '없어요' },
});

describe('우클릭 메뉴 모델', () => {
  it('모든 항목을 하위 항목까지 평평하게 모으고 id 로 찾는다', () => {
    const ids = flattenItems(model()).map((i) => i.id);
    expect(ids).toEqual(['update', 'care:touch', 'care:feed', 'wardrobe', 'collection', 'tools', 'tools:demo', 'settings', 'autostart', 'quit']);
    expect(findItem(model(), 'tools:demo')?.label).toBe('체험');
    expect(findItem(model(), 'nope')).toBeUndefined();
  });

  it('id 가 겹치지 않는다(동작을 id 로 찾기 때문)', () => {
    const ids = flattenItems(model()).map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('트레이용 기본 메뉴로 바꾸기', () => {
  it('머리말·새 버전·돌보기·탭(하위 메뉴)·아래 줄 순서로 만든다', () => {
    const t = toNativeTemplate(model(), () => undefined);
    expect(t.map((i) => i.label ?? '---')).toEqual(['콩이 · Lv.6', '---', '새 버전 설치', '---', '쓰다듬기', '밥 주기', '---', '펫', '개발', '---', '설정…', '로그인할 때 자동 실행', '종료']);
    expect(t[0]?.enabled).toBe(false);
  });

  it('탭은 하위 메뉴, 하위 페이지도 하위 메뉴이며, 뱃지는 글자 뒤에 붙는다', () => {
    const t = toNativeTemplate(model(), () => undefined);
    const pet = t.find((i) => i.label === '펫');
    expect(pet?.submenu?.map((i) => i.label)).toEqual(['꾸미기…', '뽑기·컬렉션… (3장)']);
    const dev = t.find((i) => i.label === '개발');
    expect(dev?.submenu?.[0]?.submenu?.[0]?.label).toBe('체험');
  });

  it('누르면 id 로 동작을 부르고, 꺼진 항목·체크 항목 상태를 그대로 옮긴다', () => {
    const run = vi.fn();
    const t = toNativeTemplate(model(), run);
    t.find((i) => i.label === '쓰다듬기')?.click?.();
    t.find((i) => i.label === '설정…')?.click?.();
    expect(run.mock.calls).toEqual([['care:touch'], ['settings']]);
    expect(t.find((i) => i.label === '밥 주기')?.enabled).toBe(false);
    expect(t.find((i) => i.label === '로그인할 때 자동 실행')).toMatchObject({ type: 'checkbox', checked: true });
  });
});
