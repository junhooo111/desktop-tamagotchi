/**
 * 창 화면(설정·경매장·랭킹)의 한/영 전환.
 * HTML 과 화면 코드는 한국어로 쓰고, 영어일 때는 그린 뒤에 글자(텍스트 노드·aria-label·placeholder·창 제목)를
 * 사전(ui-en.ts)으로 바꿔 끼운다. 원래 한국어는 따로 기억해 두어서 언어를 다시 바꾸면 되돌린다.
 */
import { toEnglish } from '../shared/en-text.js';
import type { Lang } from '../shared/i18n.js';
import { UI_EN, UI_RULES } from './ui-en.js';

let lang: Lang = 'ko';
const originalText = new WeakMap<Node, string>();
const originalAttr = new WeakMap<Element, Record<string, string>>();
const ATTRS = ['aria-label', 'placeholder', 'title'] as const;

export function currentUiLang(): Lang {
  return lang;
}

export function setUiLang(next: Lang): void {
  lang = next;
}

/** 한국어 한 조각을 영어로. 사전 → 규칙 → " · " 로 쪼갠 조각 → 펫 말 번역기 순으로 시도한다. */
export function translateUi(ko: string): string {
  const exact = UI_EN[ko];
  if (exact !== undefined) return exact;
  for (const [re, fn] of UI_RULES) {
    const m = ko.match(re);
    if (m) return fn(m);
  }
  if (ko.startsWith('· ')) return '· ' + translateUi(ko.slice(2));
  if (ko.includes(' · ')) return ko.split(' · ').map((part) => translateUi(part)).join(' · ');
  return toEnglish(ko);
}

function translateKeepingSpace(ko: string): string {
  const lead = /^\s*/.exec(ko)?.[0] ?? '';
  const trail = /\s*$/.exec(ko)?.[0] ?? '';
  const core = ko.slice(lead.length, ko.length - trail.length);
  return core === '' ? ko : lead + translateUi(core) + trail;
}

/** 지금 언어에 맞게 root 안의 글자를 바꿔 끼운다(한국어면 원래대로 되돌린다). */
export function localize(root: ParentNode = document.body): void {
  const walker = document.createTreeWalker(root as Node, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let node: Node | null = walker.nextNode();
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const parent = node.parentElement?.tagName;
      if (parent !== 'SCRIPT' && parent !== 'STYLE') {
        const text = node as Text;
        const known = originalText.get(text);
        // 우리가 바꿔 놓은 글자가 아닌 새 글자면 그것을 원본으로 본다.
        const base = known !== undefined && (text.data === known || text.data === translateKeepingSpace(known)) ? known : text.data;
        originalText.set(text, base);
        // 이 글자만 영어를 따로 정해 둔 요소(data-en)는 그것을 쓴다(같은 한국어가 곳곳에서 뜻이 다를 때).
        const forced = node.parentElement?.dataset['en'];
        const next = lang === 'en' ? (forced !== undefined && node.parentElement?.childNodes.length === 1 ? forced : translateKeepingSpace(base)) : base;
        if (text.data !== next) text.data = next;
      }
    } else {
      const el = node as Element;
      const saved = originalAttr.get(el) ?? {};
      for (const attr of ATTRS) {
        const value = el.getAttribute(attr);
        if (value === null) continue;
        const base = saved[attr] !== undefined && (value === saved[attr] || value === translateKeepingSpace(saved[attr] as string)) ? (saved[attr] as string) : value;
        saved[attr] = base;
        const next = lang === 'en' ? translateKeepingSpace(base) : base;
        if (value !== next) el.setAttribute(attr, next);
      }
      originalAttr.set(el, saved);
    }
    node = walker.nextNode();
  }
  const titleBase = document.documentElement.dataset['koTitle'] ?? document.title;
  document.documentElement.dataset['koTitle'] = titleBase;
  document.title = lang === 'en' ? translateUi(titleBase) : titleBase;
  document.documentElement.lang = lang;
}

/** 창이 열릴 때: 메인이 정한 언어를 받아 적용한다. 언어를 알려 주는 통로가 없으면(시험 등) 한국어로 둔다. */
export async function initUiLang(getLang: (() => Promise<Lang>) | undefined): Promise<void> {
  if (!getLang) return;
  try {
    lang = await getLang();
  } catch {
    lang = 'ko';
  }
}

let observer: MutationObserver | null = null;
let scheduled = false;

/**
 * 창이 열릴 때 한 번: 언어를 받아 적용하고, 이후 화면이 다시 그려질 때마다 자동으로 번역한다
 * (창마다 그린 뒤에 localize 를 부르지 않아도 된다). 번역하다가 생기는 변화는 무시해서 되풀이하지 않는다.
 */
export async function startUiLocalization(getLang: (() => Promise<Lang>) | undefined): Promise<void> {
  await initUiLang(getLang);
  localize();
  if (typeof MutationObserver === 'undefined' || !document.body) return;
  observer?.disconnect();
  observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      observer?.disconnect();
      localize();
      observer?.observe(document.body, { childList: true, subtree: true, characterData: true });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}
