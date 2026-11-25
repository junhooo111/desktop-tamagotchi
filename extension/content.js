// 자동 생성 파일 — 직접 고치지 마세요. 원본: src/inspect/collector.ts, 생성: scripts/build-extension.mjs
(() => {
  const collectPage = function collectPage(opts) {
    const MAX_PER_RULE = 3;
    const MAX_TEXT_NODES = 1500;
    const findings = [];
    const counts = {};
    const doc = document;
    const selectorOf = (el) => {
        const parts = [];
        let node = el;
        while (node && parts.length < 4) {
            const tag = node.tagName.toLowerCase();
            if (node.id) {
                parts.unshift(`${tag}#${node.id}`);
                break;
            }
            const current = node;
            const parent = current.parentElement;
            let part = tag;
            if (parent) {
                const same = Array.from(parent.children).filter((c) => c.tagName === current.tagName);
                if (same.length > 1)
                    part += `:nth-of-type(${same.indexOf(current) + 1})`;
            }
            parts.unshift(part);
            if (tag === 'body')
                break;
            node = parent;
        }
        return parts.join(' > ');
    };
    const isShown = (el) => {
        if (!opts.requireLayout)
            return true;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0)
            return false;
        const s = getComputedStyle(el);
        return s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0';
    };
    const full = (ruleId) => (counts[ruleId] ?? 0) >= MAX_PER_RULE;
    const add = (ruleId, el, detail) => {
        if (full(ruleId))
            return;
        counts[ruleId] = (counts[ruleId] ?? 0) + 1;
        let rect = null;
        if (el && opts.requireLayout) {
            const r = el.getBoundingClientRect();
            rect = { x: r.left, y: r.top, w: r.width, h: r.height };
        }
        findings.push({ ruleId, selector: el ? selectorOf(el) : 'document', rect, detail });
    };
    /** 보조 기술이 읽는 이름: aria-label > aria-labelledby > 내용 글자 > title > 안의 이미지 alt */
    const nameOf = (el) => {
        const aria = (el.getAttribute('aria-label') ?? '').trim();
        if (aria)
            return aria;
        const by = el.getAttribute('aria-labelledby');
        if (by) {
            const text = by
                .split(/\s+/)
                .map((id) => doc.getElementById(id)?.textContent ?? '')
                .join(' ')
                .trim();
            if (text)
                return text;
        }
        if (el instanceof HTMLInputElement && el.value.trim())
            return el.value.trim();
        const own = (el.textContent ?? '').trim();
        if (own)
            return own;
        const title = (el.getAttribute('title') ?? '').trim();
        if (title)
            return title;
        const img = el.querySelector('img[alt]');
        const alt = (img?.getAttribute('alt') ?? '').trim();
        if (alt)
            return alt;
        return (el.querySelector('svg title')?.textContent ?? '').trim();
    };
    // 1. 이미지 alt
    doc.querySelectorAll('img:not([alt])').forEach((img) => {
        if (isShown(img))
            add('img-alt', img, (img.getAttribute('src') ?? '').slice(0, 60));
    });
    // 2. 버튼·링크 이름
    doc
        .querySelectorAll('button, a[href], [role="button"], input[type="button"], input[type="submit"]')
        .forEach((el) => {
        // value 없는 submit 은 브라우저가 "제출" 같은 기본 이름을 붙여 주므로 문제가 아니다.
        const defaultNamed = el instanceof HTMLInputElement && el.type === 'submit';
        if (isShown(el) && !defaultNamed && !nameOf(el))
            add('button-name', el, el.tagName.toLowerCase());
    });
    // 3. 입력칸 라벨
    const labelFors = Array.from(doc.querySelectorAll('label[for]')).map((l) => l.getAttribute('for'));
    doc
        .querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]), select, textarea')
        .forEach((el) => {
        if (!isShown(el))
            return;
        const hasLabel = (el.getAttribute('aria-label') ?? '').trim() !== '' ||
            (el.getAttribute('aria-labelledby') ?? '').trim() !== '' ||
            (el.getAttribute('title') ?? '').trim() !== '' ||
            (el.id !== '' && labelFors.includes(el.id)) ||
            el.closest('label') !== null;
        if (!hasLabel)
            add('form-label', el, (el.getAttribute('placeholder') ?? el.tagName.toLowerCase()).slice(0, 40));
    });
    // 4~6. 문서 전체 설정
    if ((doc.documentElement.getAttribute('lang') ?? '').trim() === '')
        add('html-lang', null, '<html lang> 없음');
    if (doc.title.trim() === '')
        add('page-title', null, '<title> 비어 있음');
    if (!doc.querySelector('meta[name="viewport"]'))
        add('viewport-meta', null, 'meta viewport 없음');
    // 7. 제목 단계
    let prevLevel = 0;
    doc.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
        if (!isShown(h))
            return;
        const level = Number(h.tagName.slice(1));
        if (prevLevel > 0 && level > prevLevel + 1)
            add('heading-order', h, `h${prevLevel} 다음에 h${level}`);
        prevLevel = level;
    });
    // 8. 누르는 영역 크기 (글 사이의 인라인 링크는 기준에서 제외)
    if (opts.requireLayout) {
        doc
            .querySelectorAll('button, input:not([type="hidden"]), select, textarea, [role="button"], a[href]')
            .forEach((el) => {
            if (full('touch-target') || !isShown(el))
                return;
            if (el.tagName === 'A' && getComputedStyle(el).display === 'inline')
                return;
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
                if (culprits >= MAX_PER_RULE)
                    break;
                if (!isShown(el))
                    continue;
                const r = el.getBoundingClientRect();
                const parentRight = el.parentElement ? el.parentElement.getBoundingClientRect().right : 0;
                if (r.right > root.clientWidth + 1 && parentRight <= root.clientWidth + 1) {
                    culprits++;
                    add('h-overflow', el, `폭 ${Math.round(r.right)}px, 화면 ${root.clientWidth}px`);
                }
            }
            if (culprits === 0)
                add('h-overflow', root, `폭 ${root.scrollWidth}px, 화면 ${root.clientWidth}px`);
        }
    }
    const parseColor = (value) => {
        const m = /rgba?\(([^)]+)\)/.exec(value);
        if (!m || !m[1])
            return null;
        const nums = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
        const [r, g, b, a] = nums;
        if (r === undefined || g === undefined || b === undefined || [r, g, b].some(Number.isNaN))
            return null;
        return { r, g, b, a: a === undefined || Number.isNaN(a) ? 1 : a };
    };
    const over = (top, under) => ({
        r: top.r * top.a + under.r * (1 - top.a),
        g: top.g * top.a + under.g * (1 - top.a),
        b: top.b * top.a + under.b * (1 - top.a),
        a: 1,
    });
    const luminance = (c) => {
        const ch = [c.r, c.g, c.b].map((v) => {
            const s = v / 255;
            return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * (ch[0] ?? 0) + 0.7152 * (ch[1] ?? 0) + 0.0722 * (ch[2] ?? 0);
    };
    /** 가장 가까운 배경색. 배경 이미지·그라데이션이 있으면 알 수 없어 null */
    const backgroundOf = (el) => {
        for (let node = el; node; node = node.parentElement) {
            const s = getComputedStyle(node);
            if (s.backgroundImage && s.backgroundImage !== 'none')
                return null;
            const bg = parseColor(s.backgroundColor);
            if (bg && bg.a >= 0.99)
                return bg;
            if (bg && bg.a > 0)
                return over(bg, { r: 255, g: 255, b: 255, a: 1 });
        }
        return { r: 255, g: 255, b: 255, a: 1 };
    };
    const candidates = Array.from(doc.body ? doc.body.querySelectorAll('*') : []).slice(0, MAX_TEXT_NODES);
    for (const el of candidates) {
        if (full('contrast'))
            break;
        if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG'].includes(el.tagName.toUpperCase()))
            continue;
        const hasText = Array.from(el.childNodes).some((n) => n.nodeType === 3 && (n.textContent ?? '').trim() !== '');
        if (!hasText || !isShown(el) || el.closest('[disabled]'))
            continue;
        const style = getComputedStyle(el);
        const fg = parseColor(style.color);
        const bg = backgroundOf(el);
        if (!fg || !bg)
            continue;
        const text = fg.a < 1 ? over(fg, bg) : fg;
        const l1 = luminance(text);
        const l2 = luminance(bg);
        const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        const size = parseFloat(style.fontSize);
        const bold = Number(style.fontWeight) >= 700 || style.fontWeight === 'bold';
        const large = size >= 24 || (size >= 18.66 && bold);
        const need = large ? 3 : 4.5;
        if (ratio < need)
            add('contrast', el, `대비 ${ratio.toFixed(1)}:1 (기준 ${need}:1)`);
    }
    // 11. 같은 id 중복
    const byId = new Map();
    doc.querySelectorAll('[id]').forEach((el) => {
        const id = el.getAttribute('id') ?? '';
        if (id === '')
            return;
        byId.set(id, [...(byId.get(id) ?? []), el]);
    });
    byId.forEach((els, id) => {
        // 첫 번째는 정상으로 보고, 뒤따르는 중복 요소를 문제로 알린다.
        els.slice(1).forEach((el) => {
            if (isShown(el))
                add('dup-id', el, `id="${id}" 가 ${els.length}번 쓰임`);
        });
    });
    // 12. 확대 막음 (viewport 메타)
    const viewport = doc.querySelector('meta[name="viewport"]');
    const viewportContent = (viewport?.getAttribute('content') ?? '').toLowerCase().replace(/\s+/g, '');
    if (viewportContent !== '') {
        const noScale = /user-scalable=(no|0)/.test(viewportContent);
        const maxScale = /maximum-scale=([0-9.]+)/.exec(viewportContent);
        if (noScale || (maxScale && Number(maxScale[1]) <= 1))
            add('zoom-disabled', null, viewportContent.slice(0, 60));
    }
    // 13. 양수 tabindex
    doc.querySelectorAll('[tabindex]').forEach((el) => {
        const n = Number(el.getAttribute('tabindex'));
        if (Number.isFinite(n) && n > 0 && isShown(el))
            add('tabindex-positive', el, `tabindex="${n}"`);
    });
    // 14. alt 가 파일 이름이거나 뜻 없는 말
    const fileLike = /\.(png|jpe?g|gif|svg|webp|avif|bmp)$/i;
    const generic = /^(image|img|photo|picture|pic|이미지|사진|그림)[\s_-]*\d*$/i;
    const cameraName = /^(img|dsc|screenshot|image)[_-]?\d{2,}/i;
    doc.querySelectorAll('img[alt]').forEach((img) => {
        const alt = (img.getAttribute('alt') ?? '').trim();
        if (alt === '' || !isShown(img))
            return;
        if (fileLike.test(alt) || generic.test(alt) || cameraName.test(alt))
            add('alt-quality', img, `alt="${alt.slice(0, 40)}"`);
    });
    // 15. div·span 을 버튼처럼 쓴 곳 (클릭 모양인데 키보드·보조 기술로 접근할 수 없다)
    const interactiveSelector = 'a[href], button, input, select, textarea, summary, label, [role], [tabindex]';
    const clickableTags = ['div', 'span', 'li', 'img', 'svg', 'section', 'article'];
    for (const el of Array.from(doc.body ? doc.body.querySelectorAll('div, span, li, img, svg, section, article') : []).slice(0, 2500)) {
        if (full('clickable-div'))
            break;
        if (!clickableTags.includes(el.tagName.toLowerCase()) || !isShown(el))
            continue;
        if (el.closest(interactiveSelector) !== null)
            continue;
        const pointer = getComputedStyle(el).cursor === 'pointer';
        const parent = el.parentElement;
        // cursor 는 자식에게 상속되므로, 부모도 손가락 모양이면 가장 바깥 요소만 문제로 본다.
        if (!pointer && !el.hasAttribute('onclick'))
            continue;
        if (pointer && parent && getComputedStyle(parent).cursor === 'pointer')
            continue;
        // 안에 진짜 링크·버튼이 있으면 그쪽으로 접근할 수 있으므로 넘어간다(카드 전체를 누르는 흔한 패턴).
        if (el.querySelector('a[href], button, [role="button"], [role="link"]') !== null)
            continue;
        const label = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 20);
        add('clickable-div', el, `<${el.tagName.toLowerCase()}>${label !== '' ? ' "' + label + '"' : ''}`);
    }
    // 16. 표에 제목 칸(th)이 없음
    doc.querySelectorAll('table').forEach((table) => {
        const role = (table.getAttribute('role') ?? '').toLowerCase();
        if (role === 'presentation' || role === 'none' || !isShown(table))
            return;
        if (table.querySelector('th') === null && table.querySelector('td') !== null)
            add('table-header', table, 'th 없음');
    });
    // 17. meta description 없음
    const description = doc.querySelector('meta[name="description"]');
    if (!description || (description.getAttribute('content') ?? '').trim() === '')
        add('meta-description', null, 'meta description 없음');
    // 18. 화면에 보이는 크기보다 훨씬 큰 이미지 (레이아웃이 있을 때만, SVG 는 벡터라 제외)
    if (opts.requireLayout) {
        const dpr = Math.max(window.devicePixelRatio || 1, 1);
        doc.querySelectorAll('img').forEach((img) => {
            if (full('img-oversized') || !isShown(img) || !img.complete)
                return;
            const src = img.currentSrc || img.getAttribute('src') || '';
            if (/\.svg(\?|#|$)/i.test(src) || src.startsWith('data:image/svg'))
                return;
            const shown = img.getBoundingClientRect().width;
            if (img.naturalWidth >= 800 && shown > 0 && img.naturalWidth > shown * dpr * 2) {
                add('img-oversized', img, `원본 ${img.naturalWidth}px → 표시 ${Math.round(shown)}px`);
            }
        });
    }
    // 19. 뜻 없는 링크 글자("여기", "click here" 등)
    const vagueLinks = ['여기', '여기를클릭', '여기를클릭하세요', '여기클릭', '클릭', '링크', 'clickhere', 'here', 'link', 'thislink', 'click'];
    doc.querySelectorAll('a[href]').forEach((a) => {
        if (full('vague-link') || !isShown(a))
            return;
        const name = nameOf(a);
        const plain = name.replace(/[\s.!…·>»]+/g, '').toLowerCase();
        if (plain !== '' && vagueLinks.includes(plain))
            add('vague-link', a, `"${name.slice(0, 30)}"`);
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
};

  const EVERY_MS = 4000;

  function send() {
    // 보이는 탭만 검사한다(안 보이는 탭은 화면 좌표를 쓸 수 없다).
    if (document.visibilityState !== 'visible') return;
    try {
      const snapshot = collectPage({ requireLayout: true });
      const sent = chrome.runtime.sendMessage({ type: 'snapshot', snapshot });
      if (sent && sent.catch) sent.catch(() => {});
    } catch {
      // 확장을 다시 불러온 직후처럼 연결이 끊겼으면 이 페이지는 새로고침 전까지 조용히 멈춘다.
    }
  }

  send();
  const timer = setInterval(send, EVERY_MS);
  document.addEventListener('visibilitychange', send);
  window.addEventListener('pagehide', () => clearInterval(timer));
})();
