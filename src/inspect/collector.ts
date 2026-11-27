/**
 * 브라우저 페이지 안에서 실행되는 검사 수집기.
 *
 * collectPage 는 함수 하나로 모든 것이 들어 있어야 한다(밖의 변수·함수를 쓰지 않는다).
 * 소스 문자열(Function.toString)을 크롬 개발자 도구로 페이지에 그대로 주입해 실행하기 때문이다.
 * 타입 import 는 컴파일하면 사라지므로 괜찮다.
 */
import type { RuleId } from '../shared/lessons.js';

export interface RawFinding {
  ruleId: RuleId;
  /** 사람이 읽을 수 있는 짧은 CSS 경로 */
  selector: string;
  /** 브라우저 뷰포트 기준 위치. 페이지 전체에 해당하는 문제는 null */
  rect: { x: number; y: number; w: number; h: number } | null;
  detail: string;
}

export interface PageSnapshot {
  url: string;
  title: string;
  /** 지금 보이는 탭인지. 안 보이는 탭의 좌표는 쓸 수 없다. */
  visible: boolean;
  screenX: number;
  screenY: number;
  outerWidth: number;
  outerHeight: number;
  innerWidth: number;
  innerHeight: number;
  findings: RawFinding[];
}

export function collectPage(opts: { requireLayout: boolean }): PageSnapshot {
  const MAX_PER_RULE = 3;
  const MAX_TEXT_NODES = 1500;
  const findings: RawFinding[] = [];
  const counts: Record<string, number> = {};
  const doc = document;

  const selectorOf = (el: Element): string => {
    const parts: string[] = [];
    let node: Element | null = el;
    while (node && parts.length < 4) {
      const tag = node.tagName.toLowerCase();
      if (node.id) {
        parts.unshift(`${tag}#${node.id}`);
        break;
      }
      const current: Element = node;
      const parent: Element | null = current.parentElement;
      let part = tag;
      if (parent) {
        const same = Array.from(parent.children).filter((c) => c.tagName === current.tagName);
        if (same.length > 1) part += `:nth-of-type(${same.indexOf(current) + 1})`;
      }
      parts.unshift(part);
      if (tag === 'body') break;
      node = parent;
    }
    return parts.join(' > ');
  };

  const isShown = (el: Element): boolean => {
    if (!opts.requireLayout) return true;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return false;
    const s = getComputedStyle(el);
    return s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0';
  };

  const full = (ruleId: RuleId): boolean => (counts[ruleId] ?? 0) >= MAX_PER_RULE;

  const add = (ruleId: RuleId, el: Element | null, detail: string): void => {
    if (full(ruleId)) return;
    counts[ruleId] = (counts[ruleId] ?? 0) + 1;
    let rect: RawFinding['rect'] = null;
    if (el && opts.requireLayout) {
      const r = el.getBoundingClientRect();
      rect = { x: r.left, y: r.top, w: r.width, h: r.height };
    }
    findings.push({ ruleId, selector: el ? selectorOf(el) : 'document', rect, detail });
  };

  /** 보조 기술이 읽는 이름: aria-label > aria-labelledby > 내용 글자 > title > 안의 이미지 alt */
  const nameOf = (el: Element): string => {
    const aria = (el.getAttribute('aria-label') ?? '').trim();
    if (aria) return aria;
    const by = el.getAttribute('aria-labelledby');
    if (by) {
      const text = by
        .split(/\s+/)
        .map((id) => doc.getElementById(id)?.textContent ?? '')
        .join(' ')
        .trim();
      if (text) return text;
    }
    if (el instanceof HTMLInputElement && el.value.trim()) return el.value.trim();
    const own = (el.textContent ?? '').trim();
    if (own) return own;
    const title = (el.getAttribute('title') ?? '').trim();
    if (title) return title;
    const img = el.querySelector('img[alt]');
    const alt = (img?.getAttribute('alt') ?? '').trim();
    if (alt) return alt;
    return (el.querySelector('svg title')?.textContent ?? '').trim();
  };

  // 1. 이미지 alt
  doc.querySelectorAll('img:not([alt]), input[type="image"]:not([alt]):not([aria-label])').forEach((img) => {
    if (isShown(img)) add('img-alt', img, (img.getAttribute('src') ?? '').slice(0, 60));
  });

  // 2. 버튼·링크 이름
  doc
    .querySelectorAll('button, a[href], [role="button"], input[type="button"], input[type="submit"]')
    .forEach((el) => {
      // value 없는 submit 은 브라우저가 "제출" 같은 기본 이름을 붙여 주므로 문제가 아니다.
      const defaultNamed = el instanceof HTMLInputElement && el.type === 'submit';
      if (isShown(el) && !defaultNamed && !nameOf(el)) add('button-name', el, el.tagName.toLowerCase());
    });

  // 3. 입력칸 라벨
  const labelFors = Array.from(doc.querySelectorAll('label[for]')).map((l) => l.getAttribute('for'));
  doc
    .querySelectorAll(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]), select, textarea',
    )
    .forEach((el) => {
      if (!isShown(el)) return;
      const hasLabel =
        (el.getAttribute('aria-label') ?? '').trim() !== '' ||
        (el.getAttribute('aria-labelledby') ?? '').trim() !== '' ||
        (el.getAttribute('title') ?? '').trim() !== '' ||
        (el.id !== '' && labelFors.includes(el.id)) ||
        el.closest('label') !== null;
      if (!hasLabel) add('form-label', el, (el.getAttribute('placeholder') ?? el.tagName.toLowerCase()).slice(0, 40));
    });

  // 4~6. 문서 전체 설정
  if ((doc.documentElement.getAttribute('lang') ?? '').trim() === '') add('html-lang', null, '<html lang> 없음');
  if (doc.title.trim() === '') add('page-title', null, '<title> 비어 있음');
  if (!doc.querySelector('meta[name="viewport"]')) add('viewport-meta', null, 'meta viewport 없음');

  // 7. 제목 단계
  let prevLevel = 0;
  doc.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
    if (!isShown(h)) return;
    const level = Number(h.tagName.slice(1));
    if (prevLevel > 0 && level > prevLevel + 1) add('heading-order', h, `h${prevLevel} 다음에 h${level}`);
    prevLevel = level;
  });

  // 8. 누르는 영역 크기 (글 사이의 인라인 링크는 기준에서 제외)
  if (opts.requireLayout) {
    doc
      .querySelectorAll('button, input:not([type="hidden"]), select, textarea, [role="button"], a[href]')
      .forEach((el) => {
        if (full('touch-target') || !isShown(el)) return;
        if (el.tagName === 'A' && getComputedStyle(el).display === 'inline') return;
        const r = el.getBoundingClientRect();
        if (Math.min(r.width, r.height) < 24) {
          add('touch-target', el, `${Math.round(r.width)}x${Math.round(r.height)}px`);
        }
      });

    // 9. 가로 넘침: 오른쪽 끝을 넘는 가장 바깥 요소를 찾는다.
    const root = doc.documentElement;
    if (root.scrollWidth > root.clientWidth + 1) {
      let culprits = 0;
      for (const el of Array.from(doc.body.querySelectorAll('*')).slice(0, 3000)) {
        if (culprits >= MAX_PER_RULE) break;
        if (!isShown(el)) continue;
        const r = el.getBoundingClientRect();
        const parentRight = el.parentElement ? el.parentElement.getBoundingClientRect().right : 0;
        if (r.right > root.clientWidth + 1 && parentRight <= root.clientWidth + 1) {
          culprits++;
          add('h-overflow', el, `폭 ${Math.round(r.right)}px, 화면 ${root.clientWidth}px`);
        }
      }
      if (culprits === 0) add('h-overflow', root, `폭 ${root.scrollWidth}px, 화면 ${root.clientWidth}px`);
    }
  }

  // 10. 글자 명암 대비
  type Rgba = { r: number; g: number; b: number; a: number };
  const parseColor = (value: string): Rgba | null => {
    const m = /rgba?\(([^)]+)\)/.exec(value);
    if (!m || !m[1]) return null;
    const nums = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    const [r, g, b, a] = nums;
    if (r === undefined || g === undefined || b === undefined || [r, g, b].some(Number.isNaN)) return null;
    return { r, g, b, a: a === undefined || Number.isNaN(a) ? 1 : a };
  };
  const over = (top: Rgba, under: Rgba): Rgba => ({
    r: top.r * top.a + under.r * (1 - top.a),
    g: top.g * top.a + under.g * (1 - top.a),
    b: top.b * top.a + under.b * (1 - top.a),
    a: 1,
  });
  const luminance = (c: Rgba): number => {
    const ch = [c.r, c.g, c.b].map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * (ch[0] ?? 0) + 0.7152 * (ch[1] ?? 0) + 0.0722 * (ch[2] ?? 0);
  };
  /** 가장 가까운 배경색. 배경 이미지·그라데이션이 있으면 알 수 없어 null */
  const backgroundOf = (el: Element): Rgba | null => {
    for (let node: Element | null = el; node; node = node.parentElement) {
      const s = getComputedStyle(node);
      if (s.backgroundImage && s.backgroundImage !== 'none') return null;
      const bg = parseColor(s.backgroundColor);
      if (bg && bg.a >= 0.99) return bg;
      if (bg && bg.a > 0) return over(bg, { r: 255, g: 255, b: 255, a: 1 });
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  };

  const candidates = Array.from(doc.body ? doc.body.querySelectorAll('*') : []).slice(0, MAX_TEXT_NODES);
  for (const el of candidates) {
    if (full('contrast')) break;
    if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG'].includes(el.tagName.toUpperCase())) continue;
    const hasText = Array.from(el.childNodes).some((n) => n.nodeType === 3 && (n.textContent ?? '').trim() !== '');
    if (!hasText || !isShown(el) || el.closest('[disabled]')) continue;
    const style = getComputedStyle(el);
    const fg = parseColor(style.color);
    const bg = backgroundOf(el);
    if (!fg || !bg) continue;
    const text = fg.a < 1 ? over(fg, bg) : fg;
    const l1 = luminance(text);
    const l2 = luminance(bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const size = parseFloat(style.fontSize);
    const bold = Number(style.fontWeight) >= 700 || style.fontWeight === 'bold';
    const large = size >= 24 || (size >= 18.66 && bold);
    const need = large ? 3 : 4.5;
    if (ratio < need) add('contrast', el, `대비 ${ratio.toFixed(1)}:1 (기준 ${need}:1)`);
  }

  // 11. 같은 id 중복
  const byId = new Map<string, Element[]>();
  doc.querySelectorAll('[id]').forEach((el) => {
    const id = el.getAttribute('id') ?? '';
    if (id === '') return;
    byId.set(id, [...(byId.get(id) ?? []), el]);
  });
  byId.forEach((els, id) => {
    // 첫 번째는 정상으로 보고, 뒤따르는 중복 요소를 문제로 알린다.
    els.slice(1).forEach((el) => {
      if (isShown(el)) add('dup-id', el, `id="${id}" 가 ${els.length}번 쓰임`);
    });
  });

  // 12. 확대 막음 (viewport 메타)
  const viewport = doc.querySelector('meta[name="viewport"]');
  const viewportContent = (viewport?.getAttribute('content') ?? '').toLowerCase().replace(/\s+/g, '');
  if (viewportContent !== '') {
    const noScale = /user-scalable=(no|0)/.test(viewportContent);
    const maxScale = /maximum-scale=([0-9.]+)/.exec(viewportContent);
    if (noScale || (maxScale && Number(maxScale[1]) <= 1)) add('zoom-disabled', null, viewportContent.slice(0, 60));
  }

  // 13. 양수 tabindex
  doc.querySelectorAll('[tabindex]').forEach((el) => {
    const n = Number(el.getAttribute('tabindex'));
    if (Number.isFinite(n) && n > 0 && isShown(el)) add('tabindex-positive', el, `tabindex="${n}"`);
  });

  // 14. alt 가 파일 이름이거나 뜻 없는 말
  const fileLike = /\.(png|jpe?g|gif|svg|webp|avif|bmp)$/i;
  const generic = /^(image|img|photo|picture|pic|이미지|사진|그림)[\s_-]*\d*$/i;
  const cameraName = /^(img|dsc|screenshot|image)[_-]?\d{2,}/i;
  doc.querySelectorAll('img[alt]').forEach((img) => {
    const alt = (img.getAttribute('alt') ?? '').trim();
    if (alt === '' || !isShown(img)) return;
    if (fileLike.test(alt) || generic.test(alt) || cameraName.test(alt)) add('alt-quality', img, `alt="${alt.slice(0, 40)}"`);
  });

  // 15. div·span 을 버튼처럼 쓴 곳 (클릭 모양인데 키보드·보조 기술로 접근할 수 없다)
  const interactiveSelector = 'a[href], button, input, select, textarea, summary, label, [role], [tabindex]';
  const clickableTags = ['div', 'span', 'li', 'img', 'svg', 'section', 'article'];
  for (const el of Array.from(doc.body ? doc.body.querySelectorAll('div, span, li, img, svg, section, article') : []).slice(0, 2500)) {
    if (full('clickable-div')) break;
    if (!clickableTags.includes(el.tagName.toLowerCase()) || !isShown(el)) continue;
    if (el.closest(interactiveSelector) !== null) continue;
    const pointer = getComputedStyle(el).cursor === 'pointer';
    const parent = el.parentElement;
    // cursor 는 자식에게 상속되므로, 부모도 손가락 모양이면 가장 바깥 요소만 문제로 본다.
    if (!pointer && !el.hasAttribute('onclick')) continue;
    if (pointer && parent && getComputedStyle(parent).cursor === 'pointer') continue;
    // 안에 진짜 링크·버튼이 있으면 그쪽으로 접근할 수 있으므로 넘어간다(카드 전체를 누르는 흔한 패턴).
    if (el.querySelector('a[href], button, [role="button"], [role="link"]') !== null) continue;
    const label = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 20);
    add('clickable-div', el, `<${el.tagName.toLowerCase()}>${label !== '' ? ' "' + label + '"' : ''}`);
  }

  // 16. 표에 제목 칸(th)이 없음
  doc.querySelectorAll('table').forEach((table) => {
    const role = (table.getAttribute('role') ?? '').toLowerCase();
    if (role === 'presentation' || role === 'none' || !isShown(table)) return;
    if (table.querySelector('th') === null && table.querySelector('td') !== null) add('table-header', table, 'th 없음');
  });

  // 17. meta description 없음
  const description = doc.querySelector('meta[name="description"]');
  if (!description || (description.getAttribute('content') ?? '').trim() === '') add('meta-description', null, 'meta description 없음');

  // 18. 화면에 보이는 크기보다 훨씬 큰 이미지 (레이아웃이 있을 때만, SVG 는 벡터라 제외)
  if (opts.requireLayout) {
    const dpr = Math.max(window.devicePixelRatio || 1, 1);
    doc.querySelectorAll('img').forEach((img) => {
      if (full('img-oversized') || !isShown(img) || !img.complete) return;
      const src = img.currentSrc || img.getAttribute('src') || '';
      if (/\.svg(\?|#|$)/i.test(src) || src.startsWith('data:image/svg')) return;
      const shown = img.getBoundingClientRect().width;
      if (img.naturalWidth >= 800 && shown > 0 && img.naturalWidth > shown * dpr * 2) {
        add('img-oversized', img, `원본 ${img.naturalWidth}px → 표시 ${Math.round(shown)}px`);
      }
    });
  }

  // 19. 뜻 없는 링크 글자("여기", "click here" 등)
  const vagueLinks = ['여기', '여기를클릭', '여기를클릭하세요', '여기클릭', '클릭', '링크', 'clickhere', 'here', 'link', 'thislink', 'click'];
  doc.querySelectorAll('a[href]').forEach((a) => {
    if (full('vague-link') || !isShown(a)) return;
    const name = nameOf(a);
    const plain = name.replace(/[\s.!…·>»]+/g, '').toLowerCase();
    if (plain !== '' && vagueLinks.includes(plain)) add('vague-link', a, `"${name.slice(0, 30)}"`);
  });

  // 20. iframe 에 제목(title)이 없음
  doc.querySelectorAll('iframe').forEach((frame) => {
    if (!isShown(frame) || frame.getAttribute('aria-hidden') === 'true' || frame.getAttribute('tabindex') === '-1') return;
    if (nameOf(frame) === '') add('frame-title', frame, (frame.getAttribute('src') ?? 'iframe').slice(0, 60));
  });

  // 21. aria-hidden 요소 안에 키보드로 갈 수 있는 것이 있음
  const focusableSelector = 'a[href], button:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]';
  doc.querySelectorAll('[aria-hidden="true"]').forEach((hidden) => {
    if (full('aria-hidden-focus') || !isShown(hidden) || hidden.closest('[inert]') !== null) return;
    const candidates = [hidden, ...Array.from(hidden.querySelectorAll(focusableSelector))].filter((c) => c.matches(focusableSelector));
    const reachable = candidates.find((c) => c.getAttribute('tabindex') !== '-1');
    if (reachable) add('aria-hidden-focus', hidden, `<${reachable.tagName.toLowerCase()}> 에 포커스가 갈 수 있어요`);
  });

  // 22. 내용이 없는 제목
  doc.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]').forEach((h) => {
    if (full('empty-heading') || !isShown(h)) return;
    if (nameOf(h) === '') add('empty-heading', h, h.tagName.toLowerCase());
  });

  // 23. 본문 영역(main) 없음 (내용이 있는 페이지만)
  if (doc.body && (doc.body.textContent ?? '').trim() !== '' && doc.querySelector('main, [role="main"]') === null) {
    add('landmark-main', null, '<main> 없음');
  }

  // 24. 소리 나는 자동 재생
  doc.querySelectorAll('video[autoplay], audio[autoplay]').forEach((media) => {
    const m = media as HTMLMediaElement;
    if (full('autoplay-media') || m.muted || media.hasAttribute('muted')) return;
    if (media.tagName === 'VIDEO' && !isShown(media)) return;
    add('autoplay-media', media, `<${media.tagName.toLowerCase()} autoplay> 에 muted 없음`);
  });

  // 25. 이름·설명이 없는 id 를 가리킴 (aria-labelledby·aria-describedby·label for)
  const hasId = (id: string): boolean => doc.getElementById(id) !== null;
  doc.querySelectorAll('[aria-labelledby], [aria-describedby]').forEach((el) => {
    if (full('aria-broken-ref') || !isShown(el)) return;
    for (const attr of ['aria-labelledby', 'aria-describedby']) {
      const ids = (el.getAttribute(attr) ?? '').split(/\s+/).filter((t) => t !== '');
      const missing = ids.find((t) => !hasId(t));
      if (missing) {
        add('aria-broken-ref', el, `${attr}="${missing.slice(0, 30)}" 인 요소 없음`);
        return;
      }
    }
  });
  doc.querySelectorAll('label[for]').forEach((label) => {
    const id = (label.getAttribute('for') ?? '').trim();
    if (id !== '' && !full('aria-broken-ref') && isShown(label) && !hasId(id)) add('aria-broken-ref', label, `for="${id.slice(0, 30)}" 인 요소 없음`);
  });

  // 26. 링크·버튼 안에 또 링크·버튼·입력칸
  const innerInteractive = 'a[href], button, input:not([type="hidden"]), select, textarea, [role="button"], [role="link"]';
  doc.querySelectorAll('a[href], button').forEach((outer) => {
    if (full('nested-interactive') || !isShown(outer)) return;
    const inner = outer.querySelector(innerInteractive);
    if (inner) add('nested-interactive', outer, `<${outer.tagName.toLowerCase()}> 안에 <${inner.tagName.toLowerCase()}>`);
  });

  // 27. 개인 정보 입력칸에 autocomplete 없음 (이메일·전화·이름·주소·우편번호)
  const personalName = /^(e-?mail|tel|phone|mobile|name|full-?name|first-?name|last-?name|given-?name|family-?name|address|street|zip|postal|post-?code)$/i;
  doc.querySelectorAll('input').forEach((input) => {
    if (full('autocomplete-missing') || !isShown(input)) return;
    const type = (input.getAttribute('type') ?? 'text').toLowerCase();
    if (!['text', 'email', 'tel', 'search'].includes(type) || type === 'search') return;
    if ((input.getAttribute('autocomplete') ?? '').trim() !== '') return;
    const key = (input.getAttribute('name') ?? input.id ?? '').trim();
    if (type === 'email' || type === 'tel' || personalName.test(key)) {
      add('autocomplete-missing', input, `<input type="${type}"${key ? ' name="' + key.slice(0, 24) + '"' : ''}>`);
    }
  });

  // 28. 시간이 지나면 저절로 새로고침·이동 (0초는 즉시 이동이라 제외)
  const refresh = doc.querySelector('meta[http-equiv="refresh" i]');
  const refreshSeconds = Number(/^\s*(\d+)/.exec(refresh?.getAttribute('content') ?? '')?.[1] ?? 0);
  if (refresh && refreshSeconds > 0) add('meta-refresh', null, `${refreshSeconds}초 뒤 이동`);

  // 29. 포커스 표시 제거: :focus 규칙이 outline 을 지우는데 대체 표시(테두리·그림자 등)가 없음
  const focusRules: { selector: string; removes: boolean; replaces: boolean }[] = [];
  let infiniteAnimation = false;
  let reducedMotionHandled = false;
  const walkRules = (rules: CSSRuleList, depth: number): void => {
    for (const rule of Array.from(rules)) {
      const anyRule = rule as CSSRule & { selectorText?: string; style?: CSSStyleDeclaration; cssRules?: CSSRuleList; media?: MediaList };
      if (anyRule.media && /prefers-reduced-motion/i.test(anyRule.media.mediaText)) reducedMotionHandled = true;
      if (anyRule.cssRules && depth < 4) walkRules(anyRule.cssRules, depth + 1);
      const style = anyRule.style;
      if (!style || typeof anyRule.selectorText !== 'string') continue;
      if (/infinite/i.test(style.getPropertyValue('animation') + ' ' + style.getPropertyValue('animation-iteration-count'))) infiniteAnimation = true;
      if (!/:focus(-visible)?(?![\w-])/.test(anyRule.selectorText)) continue;
      const outline = (style.getPropertyValue('outline') + ' ' + style.getPropertyValue('outline-style') + ' ' + style.getPropertyValue('outline-width')).toLowerCase();
      const removes = /\bnone\b|(^|\s)0(px)?(\s|$)/.test(outline) && outline.trim() !== '';
      const shadow = style.getPropertyValue('box-shadow').trim();
      const visibleOutline = outline.trim() !== '' && !removes;
      const replaces =
        visibleOutline ||
        (shadow !== '' && shadow !== 'none') ||
        ['border', 'border-color', 'border-width', 'background', 'background-color', 'text-decoration', 'filter'].some((p) => style.getPropertyValue(p).trim() !== '');
      focusRules.push({ selector: anyRule.selectorText, removes, replaces });
    }
  };
  for (const sheet of Array.from(doc.styleSheets)) {
    try {
      walkRules(sheet.cssRules, 0);
    } catch {
      // 다른 출처의 스타일시트는 읽을 수 없다
    }
  }
  const strippedFocus = focusRules.find((r) => r.removes && !r.replaces);
  if (strippedFocus && !focusRules.some((r) => r.replaces)) add('focus-outline', null, `${strippedFocus.selector.slice(0, 50)} { outline: none }`);

  // 30. role 은 버튼 같은데 키보드로 갈 수 없음
  const roleNeedsFocus = '[role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="switch"], [role="menuitem"], [role="slider"], [role="textbox"], [role="combobox"]';
  const natively = 'a[href], button, input, select, textarea, summary, [contenteditable="true"]';
  doc.querySelectorAll(roleNeedsFocus).forEach((el) => {
    if (full('role-no-focus') || !isShown(el) || el.matches(natively) || el.hasAttribute('tabindex') || el.getAttribute('aria-disabled') === 'true') return;
    add('role-no-focus', el, `role="${el.getAttribute('role')}" 인데 tabindex 없음`);
  });

  // 31. 스크롤되는 영역에 키보드로 갈 수 없음 (레이아웃이 있을 때만)
  if (opts.requireLayout) {
    for (const el of Array.from(doc.body ? doc.body.querySelectorAll('div, section, article, pre, ul, ol, table, aside, main') : []).slice(0, 1500)) {
      if (full('scroll-no-focus')) break;
      const style = getComputedStyle(el);
      if (!/(auto|scroll)/.test(style.overflowY + ' ' + style.overflowX) || !isShown(el)) continue;
      const overflowing = el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1;
      if (!overflowing || el.hasAttribute('tabindex') || el.querySelector(focusableSelector) !== null) continue;
      add('scroll-no-focus', el, `<${el.tagName.toLowerCase()}> 스크롤 영역에 tabindex 없음`);
    }
  }

  // 32. 이동하지 않는 가짜 링크 (href="#", javascript:)
  doc.querySelectorAll('a[href]').forEach((a) => {
    if (full('fake-link') || !isShown(a) || a.getAttribute('role') === 'button') return;
    const href = (a.getAttribute('href') ?? '').trim().toLowerCase();
    if (href === '#' || href.startsWith('javascript:')) add('fake-link', a, `href="${href.slice(0, 30)}"`);
  });

  // 33. 글 속 링크가 색으로만 구분됨
  doc.querySelectorAll('p a[href], li a[href], td a[href], span a[href]').forEach((a) => {
    if (full('link-color-only') || !isShown(a)) return;
    const parent = a.parentElement;
    if (!parent) return;
    const around = (parent.textContent ?? '').replace(/\s+/g, '').length - (a.textContent ?? '').replace(/\s+/g, '').length;
    if (around < 4) return; // 링크만 있는 줄(메뉴·버튼식 링크)은 제외
    const ls = getComputedStyle(a);
    const ps = getComputedStyle(parent);
    if (/underline/.test(ls.textDecorationLine || ls.textDecoration) || ls.fontWeight !== ps.fontWeight || ls.fontStyle !== ps.fontStyle) return;
    if (parseFloat(ls.borderBottomWidth) > 0 || (ls.backgroundColor !== ps.backgroundColor && ls.backgroundColor !== 'rgba(0, 0, 0, 0)')) return;
    const fg = parseColor(ls.color);
    const base = parseColor(ps.color);
    if (!fg || !base) return;
    const l1 = luminance(fg);
    const l2 = luminance(base);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    if (ratio < 3) add('link-color-only', a, `주변 글자와 색 대비 ${ratio.toFixed(1)}:1, 밑줄 없음`);
  });

  // 34. 너무 작은 글자 (12px 미만)
  for (const el of candidates) {
    if (full('text-small')) break;
    if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'SUB', 'SUP'].includes(el.tagName.toUpperCase())) continue;
    const text = Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => (n.textContent ?? '').trim()).join('');
    if (text.length < 2 || !isShown(el)) continue;
    const size = parseFloat(getComputedStyle(el).fontSize);
    if (size > 0 && size < 12) add('text-small', el, `글자 ${size}px`);
  }

  // 35. 계속 움직이는 애니메이션인데 움직임 줄이기 설정 처리가 없음
  if (infiniteAnimation && !reducedMotionHandled) add('reduced-motion', null, 'infinite 애니메이션, prefers-reduced-motion 없음');

  // 36. role="img" 인데 이름이 없음
  doc.querySelectorAll('[role="img"]').forEach((el) => {
    if (full('role-img-alt') || !isShown(el) || el.getAttribute('aria-hidden') === 'true') return;
    if (nameOf(el) === '') add('role-img-alt', el, `<${el.tagName.toLowerCase()} role="img">`);
  });

  // 37. html lang 값이 올바르지 않음 (비어 있으면 html-lang 이 이미 알린다)
  const langValue = (doc.documentElement.getAttribute('lang') ?? '').trim();
  if (langValue !== '' && !/^[a-z]{2,3}(-[a-z0-9]{2,8})*$/i.test(langValue)) add('html-lang-valid', null, `lang="${langValue.slice(0, 20)}"`);

  // 38. 영상에 자막이 없음 (소리 없이 자동 재생되는 장식용 영상은 제외)
  doc.querySelectorAll('video').forEach((video) => {
    if (full('video-captions') || !isShown(video)) return;
    const decorative = video.hasAttribute('autoplay') && (video.hasAttribute('muted') || (video as HTMLVideoElement).muted);
    if (decorative || video.querySelector('track[kind="captions"], track[kind="subtitles"]') !== null) return;
    add('video-captions', video, '<video> 에 자막 track 없음');
  });

  return {
    url: location.href,
    title: doc.title,
    visible: doc.visibilityState === 'visible',
    screenX: window.screenX,
    screenY: window.screenY,
    outerWidth: window.outerWidth,
    outerHeight: window.outerHeight,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    findings,
  };
}

/** 개발자 도구로 페이지에 넣어 실행할 식 */
export function collectorExpression(): string {
  return `(${collectPage.toString()})({ requireLayout: true })`;
}
