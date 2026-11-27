/**
 * 우클릭 도트 메뉴 화면. 메인이 준 모델(shared/menu.ts)을 그리고, 눌린 항목의 id 만 메인에 돌려준다.
 * 글자는 모두 textContent 로 넣는다(뉴스 제목 같은 바깥 글자가 섞여 있다).
 * 조작: 마우스, 방향키(위·아래·왼쪽·오른쪽), Enter·Space, Tab, Esc(하위 페이지면 뒤로, 아니면 닫기).
 */
import type { MenuItem, MenuModel } from '../shared/menu.js';
import { iconSvg } from './menu-icons.js';

interface MenuApi {
  get(): Promise<MenuModel | null>;
  ready(height: number): void;
  resize(height: number): void;
  tab(id: string): void;
  click(id: string): void;
  close(): void;
}
declare global {
  interface Window {
    menuApi: MenuApi;
  }
}

const app = (): HTMLElement => document.getElementById('app') as HTMLElement;

let model: MenuModel | null = null;
let tab = 'pet';
/** 하위 페이지 스택: 제목과 항목 */
let pages: Array<{ title: string; items: MenuItem[] }> = [];
let shown = false;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function press(item: MenuItem): void {
  if (item.enabled === false) return;
  if (item.children) {
    pages.push({ title: item.label, items: item.children });
    render();
    return;
  }
  window.menuApi.click(item.id);
}

/** 항목 한 줄(아이콘·이름·설명·뱃지·화살표·체크) */
function row(item: MenuItem): HTMLButtonElement {
  const b = el('button', 'row');
  b.type = 'button';
  b.setAttribute('role', item.checked !== undefined ? 'menuitemcheckbox' : 'menuitem');
  b.dataset['id'] = item.id;
  if (item.checked !== undefined) b.setAttribute('aria-checked', String(item.checked));
  if (item.enabled === false) b.setAttribute('aria-disabled', 'true');
  if (item.children) b.setAttribute('aria-haspopup', 'true');
  b.append(item.icon ? iconSvg(item.icon, 24) : el('span', 'icon-gap'));
  const text = el('span', 'text');
  text.append(el('span', 'label', item.label));
  if (item.hint) text.append(el('span', 'hint', item.hint));
  b.append(text);
  if (item.badge) b.append(el('span', 'badge', item.badge));
  if (item.checked !== undefined) b.append(el('span', item.checked ? 'check on' : 'check', item.checked ? '✓' : ''));
  if (item.children) b.append(el('span', 'chev'));
  b.addEventListener('click', () => press(item));
  return b;
}

function bigButton(item: MenuItem, cls: string): HTMLButtonElement {
  const b = el('button', cls);
  b.type = 'button';
  b.setAttribute('role', 'menuitem');
  b.dataset['id'] = item.id;
  if (item.enabled === false) b.setAttribute('aria-disabled', 'true');
  if (item.children) b.setAttribute('aria-haspopup', 'true');
  if (item.icon) b.append(iconSvg(item.icon, cls === 'care' ? 32 : 24));
  b.append(el('span', 'label', item.label));
  b.addEventListener('click', () => press(item));
  return b;
}

function header(m: NonNullable<MenuModel['header']>): HTMLElement {
  const h = el('div', 'head');
  const top = el('div', 'head-top');
  top.append(el('span', 'name', m.name));
  const lv = el('span', 'lv', `Lv.${m.level}`);
  lv.style.setProperty('background', m.tierColor);
  top.append(lv, el('span', 'tier', m.tierName));
  h.append(top);
  if (m.sub) h.append(el('div', 'sub', m.sub));
  const bars = el('div', 'bars');
  for (const b of m.bars) {
    const line = el('div', 'bar-line');
    line.append(el('span', 'bar-label', b.label));
    const track = el('span', 'bar');
    track.setAttribute('role', 'img');
    track.setAttribute('aria-label', `${b.label} ${b.value}%`);
    const filled = Math.round(b.value / 10);
    for (let i = 0; i < 10; i++) track.append(el('i', i < filled ? `seg on ${b.level}` : 'seg'));
    line.append(track);
    bars.append(line);
  }
  h.append(bars);
  return h;
}

function render(): void {
  if (!model) return;
  const root = app();
  root.replaceChildren();
  const m = model;
  const page = pages[pages.length - 1];

  if (page) {
    const top = el('div', 'subhead');
    const back = el('button', 'back');
    back.type = 'button';
    back.setAttribute('aria-label', m.text.back);
    back.append(iconSvg('back', 24), el('span', 'label', m.text.back));
    back.addEventListener('click', goBack);
    top.append(back, el('span', 'subtitle', page.title));
    root.append(top);
    const list = el('div', 'list');
    list.setAttribute('role', 'menu');
    if (page.items.length === 0) list.append(el('div', 'empty', m.text.empty));
    for (const it of page.items) list.append(row(it));
    root.append(list);
  } else {
    if (m.header) root.append(header(m.header));
    if (m.update) {
      const u = row(m.update);
      u.classList.add('update');
      root.append(u);
    }
    const care = el('div', 'care-grid');
    care.setAttribute('role', 'group');
    for (const c of m.care) care.append(bigButton(c, 'care'));
    root.append(care);

    const tabs = el('div', 'tabs');
    tabs.setAttribute('role', 'tablist');
    for (const t of m.tabs) {
      const b = el('button', t.id === tab ? 'tab sel' : 'tab');
      b.type = 'button';
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', String(t.id === tab));
      b.dataset['tab'] = t.id;
      b.append(iconSvg(t.icon, 16), el('span', 'label', t.label));
      b.addEventListener('click', () => {
        tab = t.id;
        window.menuApi.tab(t.id);
        render();
        focusFirst('.tab.sel');
      });
      tabs.append(b);
    }
    root.append(tabs);

    const current = m.tabs.find((t) => t.id === tab) ?? m.tabs[0];
    const list = el('div', 'list');
    list.setAttribute('role', 'menu');
    for (const it of current?.items ?? []) list.append(row(it));
    root.append(list);

    const foot = el('div', 'footer');
    for (const f of m.footer) foot.append(bigButton(f, 'foot'));
    root.append(foot);
  }
  report();
}

/** 그려진 높이를 메인에 알린다(처음에는 보여 달라고, 그다음에는 크기만 바꾸라고). */
function report(): void {
  const h = Math.ceil(app().getBoundingClientRect().height) + 16;
  if (!shown) {
    shown = true;
    window.menuApi.ready(h);
    focusFirst();
  } else {
    window.menuApi.resize(h);
  }
}

function goBack(): void {
  pages.pop();
  render();
  focusFirst();
}

function focusables(): HTMLElement[] {
  return [...app().querySelectorAll<HTMLElement>('button')].filter((b) => b.getAttribute('aria-disabled') !== 'true');
}

function focusFirst(selector?: string): void {
  const target = (selector ? app().querySelector<HTMLElement>(selector) : null) ?? focusables().find((b) => b.classList.contains('care') || b.classList.contains('row') || b.classList.contains('back')) ?? focusables()[0];
  target?.focus();
}

/** 화면에서 방향키로 가장 가까운 단추를 찾는다. 위치를 알 수 없으면(테스트 등) 그려진 순서로 움직인다. */
function move(dir: 'up' | 'down' | 'left' | 'right'): void {
  const items = focusables();
  if (items.length === 0) return;
  const cur = document.activeElement as HTMLElement | null;
  const i = cur ? items.indexOf(cur) : -1;
  if (i < 0) return items[0]?.focus();
  const rects = items.map((b) => b.getBoundingClientRect());
  const here = rects[i] as DOMRect;
  const flat = rects.every((r) => r.width === 0 && r.height === 0);
  if (flat) {
    const step = dir === 'down' || dir === 'right' ? 1 : -1;
    items[(i + step + items.length) % items.length]?.focus();
    return;
  }
  const cx = here.left + here.width / 2;
  const cy = here.top + here.height / 2;
  let best = -1;
  let bestScore = Infinity;
  items.forEach((b, j) => {
    if (j === i) return;
    const r = rects[j] as DOMRect;
    const dx = r.left + r.width / 2 - cx;
    const dy = r.top + r.height / 2 - cy;
    const along = dir === 'down' ? dy : dir === 'up' ? -dy : dir === 'right' ? dx : -dx;
    if (along <= 1) return;
    const across = dir === 'up' || dir === 'down' ? Math.abs(dx) : Math.abs(dy);
    const score = along + across * 2;
    if (score < bestScore) {
      bestScore = score;
      best = j;
    }
  });
  if (best >= 0) items[best]?.focus();
  else {
    // 그 방향에 없으면 반대쪽 끝으로 돌아간다
    const step = dir === 'down' || dir === 'right' ? 1 : -1;
    items[(i + step + items.length) % items.length]?.focus();
  }
}

document.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'Escape':
      e.preventDefault();
      if (pages.length > 0) goBack();
      else window.menuApi.close();
      break;
    case 'ArrowDown':
    case 'ArrowUp':
    case 'ArrowLeft':
    case 'ArrowRight':
      e.preventDefault();
      move(e.key === 'ArrowDown' ? 'down' : e.key === 'ArrowUp' ? 'up' : e.key === 'ArrowLeft' ? 'left' : 'right');
      break;
    default:
  }
});

if (typeof window !== 'undefined' && 'menuApi' in window) {
  void window.menuApi.get().then((m) => {
    if (!m) return window.menuApi.close();
    model = m;
    tab = m.tab;
    render();
  });
}
