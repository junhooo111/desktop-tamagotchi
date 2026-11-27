/**
 * 경매장 창 화면: 서버가 가진 판매 목록과 내 펫을 보여 준다.
 * 값은 메인이 서버에서 읽어서 넘겨 주고, 여기서는 textContent 로만 그린다(남이 쓴 이름이 들어오므로 HTML 로 해석하지 않는다).
 */
export interface Listing {
  listing_id: string;
  price: number;
  species_id: string;
  species_name: string;
  rarity: string;
  level: number;
  seller_login: string;
  is_mine: boolean;
}
export interface MyPet {
  pet_id: string;
  species_id: string;
  species_name: string;
  rarity: string;
  level: number;
  equipped: boolean;
  listing_id: string | null;
  price: number | null;
}
export interface MarketView {
  ok: boolean;
  message?: string;
  coins: number;
  listings: Listing[];
  pets: MyPet[];
}
export interface ActionResult {
  ok: boolean;
  message: string;
  view: MarketView;
}

interface MarketApi {
  get(): Promise<MarketView>;
  buy(listingId: string): Promise<ActionResult>;
  sell(petId: string, price: number): Promise<ActionResult>;
  cancel(listingId: string): Promise<ActionResult>;
  close(): void;
}
declare global {
  interface Window {
    marketApi: MarketApi;
  }
}

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
let tab: 'buy' | 'mine' = 'buy';
let view: MarketView | null = null;

const RARITY: Record<string, string> = { common: '일반', hidden: '히든' };
const money = (n: number): string => `${n.toLocaleString('ko-KR')} 게임머니`;

function row(main: string, sub: string, right: HTMLElement[]): HTMLLIElement {
  const li = document.createElement('li');
  const info = document.createElement('div');
  info.className = 'info';
  const a = document.createElement('div');
  a.textContent = main;
  const b = document.createElement('div');
  b.className = 'sub';
  b.textContent = sub;
  info.append(a, b);
  li.append(info, ...right);
  return li;
}

function button(label: string, onClick: () => void, disabled = false): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = label;
  b.disabled = disabled;
  b.addEventListener('click', onClick);
  return b;
}

function priceTag(n: number): HTMLSpanElement {
  const s = document.createElement('span');
  s.className = 'price';
  s.textContent = money(n);
  return s;
}

async function act(p: Promise<ActionResult>): Promise<void> {
  const r = await p;
  render(r.view);
  $('note').textContent = r.message;
}

export function render(v: MarketView): void {
  view = v;
  const list = $('list');
  list.textContent = '';
  const note = $('note');
  if (!v.ok) {
    $('wallet').textContent = '';
    note.textContent = v.message ?? '경매장을 불러오지 못했어요';
    return;
  }
  $('wallet').textContent = `내 게임머니: ${money(v.coins)}`;
  for (const t of $('tabs').querySelectorAll('button')) t.setAttribute('aria-selected', String(t.dataset['tab'] === tab));

  if (tab === 'buy') {
    for (const l of v.listings) {
      const action = l.is_mine
        ? button('내가 올림', () => undefined, true)
        : button('사기', () => void act(window.marketApi.buy(l.listing_id)), v.coins < l.price);
      list.append(row(`${l.species_name} Lv.${l.level}`, `${RARITY[l.rarity] ?? l.rarity} · 판매자 ${l.seller_login}`, [priceTag(l.price), action]));
    }
    note.textContent = v.listings.length === 0 ? '지금 팔고 있는 펫이 없어요' : '사면 바로 내 펫이 돼요. 파는 사람은 수수료 없이 가격만큼 받아요.';
    return;
  }

  const unlisted = v.pets.filter((p) => !p.listing_id).length;
  for (const p of v.pets) {
    const tag = `${p.species_name} Lv.${p.level}`;
    const sub = `${RARITY[p.rarity] ?? p.rarity}${p.equipped ? ' · 지금 키우는 펫' : ''}`;
    if (p.listing_id) {
      const lid = p.listing_id;
      list.append(row(tag, sub + ' · 판매 중', [priceTag(p.price ?? 0), button('내리기', () => void act(window.marketApi.cancel(lid)))]));
      continue;
    }
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '1';
    input.max = '1000000';
    input.placeholder = '가격';
    const last = unlisted <= 1;
    input.disabled = last;
    const sell = button(last ? '마지막 한 마리' : '팔기', () => void act(window.marketApi.sell(p.pet_id, Math.floor(Number(input.value)))), last);
    list.append(row(tag, sub, [input, sell]));
  }
  note.textContent = v.pets.length === 0 ? '펫이 없어요' : '마지막 한 마리는 팔 수 없어요. 팔 때 가격은 1~1,000,000 게임머니예요.';
}

async function load(): Promise<void> {
  render(await window.marketApi.get());
}

function init(): void {
  for (const b of $('tabs').querySelectorAll('button')) {
    b.addEventListener('click', () => {
      tab = b.dataset['tab'] === 'mine' ? 'mine' : 'buy';
      $('note').textContent = '';
      if (view) render(view);
    });
  }
  $('close').addEventListener('click', () => window.marketApi.close());
  void load();
}

if (typeof window !== 'undefined' && 'marketApi' in window) init();
