/**
 * 우클릭 메뉴의 "내용"(모델). 화면 그리기와 동작 연결은 따로 한다:
 *  - 펫을 우클릭하면 도트 스타일 메뉴 창(static/menu.html)이 이 모델을 그린다(탭·하위 페이지·키보드 조작).
 *  - 트레이 아이콘의 메뉴는 같은 모델을 기본(네이티브) 메뉴로 바꿔서 쓴다(toNativeTemplate).
 * 글자는 메인이 언어에 맞게 채워서 넘긴다. 항목의 동작은 id 로 메인이 찾아 실행한다(모델에는 함수가 없다).
 */

export type MenuIcon =
  | 'touch' | 'feed' | 'play' | 'wash' | 'walk'
  | 'paw' | 'ticket' | 'shop' | 'trophy' | 'gear' | 'bell' | 'dots' | 'power' | 'cloud'
  | 'tool' | 'scan' | 'bulb' | 'star' | 'book' | 'card' | 'home' | 'refresh' | 'back' | 'update' | 'list' | 'info' | 'globe' | 'bug';

export interface MenuItem {
  id: string;
  label: string;
  icon?: MenuIcon;
  /** 이름 아래에 작게 보이는 설명(예: 검사 연결 상태) */
  hint?: string;
  /** 오른쪽 작은 알림(예: 뽑기권 3) */
  badge?: string;
  enabled?: boolean;
  /** 켜짐/꺼짐 항목(로그인 시 자동 실행 등) */
  checked?: boolean;
  /** 있으면 누르면 하위 페이지가 열린다 */
  children?: MenuItem[];
}

export interface MenuBar {
  label: string;
  value: number;
  level: 'low' | 'mid' | 'high';
}

export interface MenuHeader {
  name: string;
  sub: string;
  level: number;
  tierName: string;
  tierColor: string;
  bars: MenuBar[];
}

export interface MenuTab {
  id: string;
  label: string;
  icon: MenuIcon;
  items: MenuItem[];
}

export interface MenuModel {
  header: MenuHeader | null;
  /** 새 버전이 준비되었을 때만 있는 맨 위 안내 */
  update: MenuItem | null;
  /** 큰 도트 버튼으로 보이는 돌보기 */
  care: MenuItem[];
  tabs: MenuTab[];
  /** 처음 열 탭 id(마지막에 본 탭을 기억한다) */
  tab: string;
  /** 아래 줄: 설정·공지·더보기·종료 */
  footer: MenuItem[];
  /** 화면에 쓰는 글자(언어에 맞게) */
  text: { back: string; close: string; empty: string };
}

/** 모델에 든 모든 항목을 하위 항목까지 평평하게 */
export function flattenItems(model: MenuModel): MenuItem[] {
  const out: MenuItem[] = [];
  const walk = (items: readonly MenuItem[]): void => {
    for (const it of items) {
      out.push(it);
      if (it.children) walk(it.children);
    }
  };
  if (model.update) out.push(model.update);
  walk(model.care);
  for (const t of model.tabs) walk(t.items);
  walk(model.footer);
  return out;
}

/** 모델의 id 를 찾는다(없으면 undefined) */
export function findItem(model: MenuModel, id: string): MenuItem | undefined {
  return flattenItems(model).find((i) => i.id === id);
}

// ---- 트레이용 기본 메뉴 ----

export interface NativeItem {
  label?: string;
  type?: 'separator' | 'checkbox' | 'normal';
  enabled?: boolean;
  checked?: boolean;
  submenu?: NativeItem[];
  click?: () => void;
}

/**
 * 모델을 기본(네이티브) 메뉴 목록으로 바꾼다. 탭은 하위 메뉴가 되고, 하위 페이지도 하위 메뉴가 된다.
 * run(id) 는 항목을 눌렀을 때 호출한다.
 */
export function toNativeTemplate(model: MenuModel, run: (id: string) => void): NativeItem[] {
  const conv = (it: MenuItem): NativeItem => {
    const label = it.badge ? `${it.label} (${it.badge})` : it.label;
    if (it.children) return { label, enabled: it.enabled !== false, submenu: it.children.map(conv) };
    if (it.checked !== undefined) return { label, type: 'checkbox', enabled: it.enabled !== false, checked: it.checked, click: () => run(it.id) };
    return { label, enabled: it.enabled !== false, click: () => run(it.id) };
  };
  const sep: NativeItem = { type: 'separator' };
  const out: NativeItem[] = [];
  if (model.header) out.push({ label: `${model.header.name} · Lv.${model.header.level}`, enabled: false }, sep);
  if (model.update) out.push(conv(model.update), sep);
  out.push(...model.care.map(conv), sep);
  for (const t of model.tabs) out.push({ label: t.label, submenu: t.items.map(conv) });
  out.push(sep, ...model.footer.map(conv));
  return out;
}
