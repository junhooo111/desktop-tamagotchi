/**
 * 친구 창 화면: 친구 목록·받은 요청·보낸 요청을 보여 주고, 요청/수락/인사/선물/끊기를 메인에 부탁한다.
 * 값은 서버에서 온 것이라(남이 정한 GitHub 아이디가 들어온다) textContent 로만 그린다.
 */
import type { Lang } from '../shared/i18n.js';
import { initUiLang, localize } from './dom-i18n.js';

export interface FriendRow {
  friendship_id: string;
  friend_id: string;
  login: string;
  avatar_url: string | null;
  status: 'friend' | 'incoming' | 'outgoing';
  xp: number;
  level: number;
  next_xp: number | null;
  since: string;
  waved_today: boolean;
  they_waved_today: boolean;
  species_id: string | null;
  pet_xp: number | null;
}
export interface FriendsView {
  ok: boolean;
  message?: string;
  tickets: number;
  rows: FriendRow[];
}
export interface ActionResult {
  ok: boolean;
  message: string;
  view: FriendsView;
}

interface FriendsApi {
  get(): Promise<FriendsView>;
  request(login: string): Promise<ActionResult>;
  respond(id: string, accept: boolean): Promise<ActionResult>;
  remove(id: string): Promise<ActionResult>;
  wave(id: string): Promise<ActionResult>;
  gift(id: string): Promise<ActionResult>;
  close(): void;
  lang?(): Promise<Lang>;
}
declare global {
  interface Window {
    friendsApi: FriendsApi;
  }
}

/** 서버(friend_level)와 같은 레벨별 필요 친밀도. 막대 그래프를 그릴 때만 쓴다. */
export const LEVEL_XP = [0, 20, 60, 120, 200, 320, 480, 700, 1000, 1400] as const;
export const MAX_LEVEL = LEVEL_XP.length;

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

/** 지금 레벨 안에서 얼마나 찼는지(0~1). 마지막 레벨은 꽉 찬다. */
export function levelProgress(xp: number, level: number): number {
  if (level >= MAX_LEVEL) return 1;
  const lo = LEVEL_XP[level - 1] ?? 0;
  const hi = LEVEL_XP[level] ?? lo + 1;
  return Math.max(0, Math.min(1, (xp - lo) / (hi - lo)));
}

/** 레벨 묶음에 따라 배지 색 계열(1~4)을 정한다. */
export function tierOf(level: number): 1 | 2 | 3 | 4 {
  return level >= 8 ? 4 : level >= 5 ? 3 : level >= 3 ? 2 : 1;
}

function button(label: string, onClick: () => void, disabled = false): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = label;
  b.disabled = disabled;
  b.addEventListener('click', onClick);
  return b;
}

function text(tag: string, cls: string, value: string): HTMLElement {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  e.textContent = value;
  return e;
}

async function act(p: Promise<ActionResult>): Promise<void> {
  const r = await p;
  render(r.view);
  $('note').textContent = r.message;
  localize($('note'));
}

function days(since: string): number {
  const t = Date.parse(since);
  return Number.isNaN(t) ? 0 : Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
}

function friendItem(f: FriendRow, tickets: number): HTMLLIElement {
  const li = document.createElement('li');
  const top = document.createElement('div');
  top.className = 'top';
  const lv = text('span', `lv t${tierOf(f.level)}`, `Lv.${f.level}`);
  const info = document.createElement('div');
  info.className = 'info';
  info.append(text('div', 'name', f.login), text('div', 'sub', `함께한 지 ${days(f.since)}일${f.they_waved_today ? ' · 오늘 인사를 받았어요' : ''}`));
  top.append(info, lv);

  const bar = document.createElement('div');
  bar.className = 'bar';
  bar.setAttribute('role', 'progressbar');
  bar.setAttribute('aria-valuemin', '0');
  bar.setAttribute('aria-valuemax', '100');
  const pct = Math.round(levelProgress(f.xp, f.level) * 100);
  bar.setAttribute('aria-valuenow', String(pct));
  bar.setAttribute('aria-label', `${f.login} 님과의 친밀도`);
  const fill = document.createElement('span');
  fill.style.width = `${pct}%`;
  bar.append(fill);
  const progress = f.level >= MAX_LEVEL ? `친밀도 ${f.xp} · 최고 레벨이에요!` : `친밀도 ${f.xp} / ${f.next_xp ?? f.xp} (다음 레벨까지)`;

  const actions = document.createElement('div');
  actions.className = 'actions';
  actions.append(
    button(f.waved_today ? '인사 완료' : '👋 인사하기', () => void act(window.friendsApi.wave(f.friendship_id)), f.waved_today),
    button('🎟️ 뽑기권 선물', () => void act(window.friendsApi.gift(f.friendship_id)), tickets < 1),
    button('친구 끊기', () => {
      if (window.confirm(`${f.login} 님과 친구를 끊을까요? 친밀도도 사라져요.`)) void act(window.friendsApi.remove(f.friendship_id));
    }),
  );
  li.append(top, bar, text('div', 'sub', progress), actions);
  return li;
}

function simpleItem(f: FriendRow, buttons: HTMLButtonElement[]): HTMLLIElement {
  const li = document.createElement('li');
  const top = document.createElement('div');
  top.className = 'top';
  const info = document.createElement('div');
  info.className = 'info';
  info.append(text('div', 'name', f.login));
  top.append(info, ...buttons);
  li.append(top);
  return li;
}

export function render(v: FriendsView): void {
  const note = $('note');
  const friends = $('friends');
  friends.textContent = '';
  $('incoming').textContent = '';
  $('outgoing').textContent = '';
  if (!v.ok) {
    $('wallet').textContent = '';
    $('incoming-box').hidden = true;
    $('outgoing-box').hidden = true;
    note.textContent = v.message ?? '친구 목록을 불러오지 못했어요';
    localize();
    return;
  }
  $('wallet').textContent = `내 뽑기권: ${v.tickets}장`;
  const mates = v.rows.filter((r) => r.status === 'friend');
  const incoming = v.rows.filter((r) => r.status === 'incoming');
  const outgoing = v.rows.filter((r) => r.status === 'outgoing');

  $('incoming-box').hidden = incoming.length === 0;
  for (const f of incoming) {
    $('incoming').append(
      simpleItem(f, [button('수락', () => void act(window.friendsApi.respond(f.friendship_id, true))), button('거절', () => void act(window.friendsApi.respond(f.friendship_id, false)))]),
    );
  }
  for (const f of mates) friends.append(friendItem(f, v.tickets));
  if (mates.length === 0) {
    const li = document.createElement('li');
    li.className = 'sub';
    li.textContent = '아직 친구가 없어요. 위에 친구의 GitHub 아이디를 적어 요청해 보세요 (그 친구도 이 앱에 로그인한 적이 있어야 해요).';
    friends.append(li);
  }
  $('outgoing-box').hidden = outgoing.length === 0;
  for (const f of outgoing) $('outgoing').append(simpleItem(f, [button('요청 취소', () => void act(window.friendsApi.remove(f.friendship_id)))]));
  localize();
}

async function load(): Promise<void> {
  render(await window.friendsApi.get());
}

function init(): void {
  $('add').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $<HTMLInputElement>('login');
    const login = input.value.trim().replace(/^@/, '');
    if (!login) return;
    input.value = '';
    void act(window.friendsApi.request(login));
  });
  $('close').addEventListener('click', () => window.friendsApi.close());
  void initUiLang(window.friendsApi.lang?.bind(window.friendsApi)).then(load);
}

if (typeof window !== 'undefined' && 'friendsApi' in window) init();
