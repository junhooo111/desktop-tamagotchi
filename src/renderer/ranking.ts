/**
 * 랭킹 창 화면: 서버가 계산한 점수를 항목별로 보여 준다.
 * 값은 메인이 서버에서 읽어서 넘겨 주고, 여기서는 textContent 로만 그린다(남이 쓴 이름이 그대로 들어오므로 HTML 로 해석하지 않는다).
 */
export const METRICS = [
  { id: 'species', label: '도감(종 수)', unit: '종' },
  { id: 'hidden', label: '히든', unit: '종' },
  { id: 'pets', label: '펫 수', unit: '마리' },
  { id: 'level', label: '최고 레벨', unit: '레벨' },
  { id: 'pulls', label: '뽑기', unit: '회' },
  { id: 'cosmetics', label: '꾸미기', unit: '개' },
] as const;
export type MetricId = (typeof METRICS)[number]['id'];

export interface BoardRow {
  rank: number;
  github_login: string;
  avatar_url: string | null;
  value: number;
  is_me: boolean;
}
export interface RankingView {
  ok: boolean;
  message?: string;
  metric: MetricId;
  rows: BoardRow[];
  me?: { github_login: string; show_in_ranking: boolean; scores: Record<string, number>; ranks: Record<string, number> };
}

interface RankingApi {
  get(metric: MetricId): Promise<RankingView>;
  setVisible(visible: boolean): Promise<void>;
  close(): void;
}
declare global {
  interface Window {
    rankingApi: RankingApi;
  }
}

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
let current: MetricId = 'species';

/** GitHub 아바타 주소만 그림으로 쓴다(그 밖의 주소는 쓰지 않는다). */
export function safeAvatar(url: string | null): string | null {
  return url && /^https:\/\/avatars\.githubusercontent\.com\//.test(url) ? url : null;
}

export function render(v: RankingView): void {
  const unit = METRICS.find((m) => m.id === v.metric)?.unit ?? '';
  const board = $('board');
  board.textContent = '';
  const note = $('note');
  const me = $('me');
  const visible = $<HTMLInputElement>('visible');
  if (!v.ok) {
    note.textContent = v.message ?? '랭킹을 불러오지 못했어요';
    me.textContent = '';
    return;
  }
  if (v.me) {
    const score = v.me.scores[v.metric] ?? 0;
    const rank = v.me.ranks[v.metric];
    me.textContent = v.me.show_in_ranking ? `내 기록: ${score}${unit}${rank ? ` · ${rank}위` : ''}` : `내 기록: ${score}${unit} (랭킹에서 숨김)`;
    visible.checked = v.me.show_in_ranking;
  }
  for (const r of v.rows) {
    const li = document.createElement('li');
    if (r.is_me) li.className = 'me';
    const rank = document.createElement('span');
    rank.textContent = `${r.rank}위`;
    const avatar = safeAvatar(r.avatar_url);
    let pic: HTMLElement;
    if (avatar) {
      const img = document.createElement('img');
      img.src = avatar;
      img.alt = '';
      pic = img;
    } else {
      pic = document.createElement('span');
      pic.className = 'avatar';
    }
    const name = document.createElement('span');
    name.textContent = r.github_login;
    const value = document.createElement('span');
    value.className = 'value';
    value.textContent = `${r.value}${unit}`;
    li.append(rank, pic, name, value);
    board.append(li);
  }
  note.textContent = v.rows.length === 0 ? '아직 이 항목에 기록이 있는 사람이 없어요' : '점수는 서버가 가진 데이터로 계산해요. 이름과 점수만 보여요(이메일·재화는 보이지 않아요).';
}

async function load(metric: MetricId): Promise<void> {
  current = metric;
  for (const b of $('tabs').querySelectorAll('button')) b.setAttribute('aria-selected', String(b.dataset['metric'] === metric));
  render(await window.rankingApi.get(metric));
}

function init(): void {
  const tabs = $('tabs');
  for (const m of METRICS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset['metric'] = m.id;
    b.setAttribute('role', 'tab');
    b.textContent = m.label;
    b.addEventListener('click', () => void load(m.id));
    tabs.append(b);
  }
  $('visible').addEventListener('change', (e) => void window.rankingApi.setVisible((e.target as HTMLInputElement).checked).then(() => load(current)));
  $('close').addEventListener('click', () => window.rankingApi.close());
  void load(current);
}

if (typeof window !== 'undefined' && 'rankingApi' in window) init();
