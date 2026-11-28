// dist/shared/lessons.js
var RULE_IDS = [
  "img-alt",
  "button-name",
  "form-label",
  "html-lang",
  "page-title",
  "viewport-meta",
  "heading-order",
  "touch-target",
  "h-overflow",
  "contrast",
  "dup-id",
  "zoom-disabled",
  "tabindex-positive",
  "alt-quality",
  "clickable-div",
  "table-header",
  "meta-description",
  "img-oversized",
  "vague-link",
  "frame-title",
  "aria-hidden-focus",
  "empty-heading",
  "landmark-main",
  "autoplay-media",
  "aria-broken-ref",
  "nested-interactive",
  "autocomplete-missing",
  "meta-refresh",
  "focus-outline",
  "role-no-focus",
  "scroll-no-focus",
  "fake-link",
  "link-color-only",
  "text-small",
  "reduced-motion",
  "role-img-alt",
  "html-lang-valid",
  "video-captions",
  "img-dimensions",
  "img-lazy-below-fold",
  "render-blocking-script",
  "font-display-missing",
  "large-dom",
  "multiple-h1",
  "og-missing",
  "mixed-content",
  "viewport-fixed-width",
  "input-font-small",
  "button-type-missing",
  "deprecated-tags"
];
var LESSONS = {
  "img-alt": {
    category: "screenreader",
    title: "\uC774\uBBF8\uC9C0\uC5D0 \uB300\uCCB4 \uD14D\uC2A4\uD2B8(alt)\uAC00 \uC5C6\uC5B4\uC694",
    bubble: "\uC5EC\uAE30 \uC774\uBBF8\uC9C0\uC5D0 alt\uAC00 \uC5C6\uC5B4\uC694!",
    problem: "<img> \uD0DC\uADF8\uC5D0 alt \uC18D\uC131\uC774 \uC544\uC608 \uC5C6\uC2B5\uB2C8\uB2E4.",
    why: "\uC2A4\uD06C\uB9B0 \uB9AC\uB354\uB294 alt\uAC00 \uC5C6\uC73C\uBA74 \uD30C\uC77C \uC774\uB984\uC744 \uC77D\uC5B4 \uC90D\uB2C8\uB2E4. \uC774\uBBF8\uC9C0\uAC00 \uAE68\uC84C\uC744 \uB54C\uB3C4 \uC544\uBB34 \uC124\uBA85\uC774 \uB0A8\uC9C0 \uC54A\uACE0, \uAC80\uC0C9\uC5D4\uC9C4\uB3C4 \uC774\uBBF8\uC9C0\uB97C \uC774\uD574\uD558\uC9C0 \uBABB\uD569\uB2C8\uB2E4.",
    fix: '\uC774\uBBF8\uC9C0\uAC00 \uC758\uBBF8\uB97C \uC804\uB2EC\uD558\uBA74 \uB0B4\uC6A9\uC744 \uD55C \uBB38\uC7A5\uC73C\uB85C \uC4F0\uACE0, \uC7A5\uC2DD\uC6A9\uC774\uBA74 alt="" \uB85C \uBE44\uC6CC \uB450\uC138\uC694(\uC18D\uC131 \uC790\uCCB4\uB294 \uC788\uC5B4\uC57C \uD569\uB2C8\uB2E4).',
    code: '<img src="/team.jpg" alt="\uD68C\uC758\uC2E4\uC5D0\uC11C \uC6C3\uACE0 \uC788\uB294 \uD300\uC6D0 \uB2E4\uC12F \uBA85" />\n<img src="/divider.svg" alt="" />'
  },
  "button-name": {
    category: "screenreader",
    title: "\uBC84\uD2BC\xB7\uB9C1\uD06C\uC5D0 \uC774\uB984\uC774 \uC5C6\uC5B4\uC694",
    bubble: "\uC774 \uBC84\uD2BC\uC774 \uBB58 \uD558\uB294\uC9C0 \uC54C \uC218\uAC00 \uC5C6\uC5B4\uC694!",
    problem: "\uC544\uC774\uCF58\uB9CC \uC788\uB294 \uBC84\uD2BC\uC774\uB098 \uB9C1\uD06C\uC5D0 \uAE00\uC790\uB3C4 aria-label \uB3C4 \uC5C6\uC2B5\uB2C8\uB2E4.",
    why: '\uC2A4\uD06C\uB9B0 \uB9AC\uB354 \uC0AC\uC6A9\uC790\uB294 "\uBC84\uD2BC"\uC774\uB77C\uACE0\uB9CC \uB4E3\uACE0 \uBB34\uC2A8 \uAE30\uB2A5\uC778\uC9C0 \uC54C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC74C\uC131 \uC81C\uC5B4\uB85C\uB3C4 \uC774\uB984\uC744 \uBD88\uB7EC\uC11C \uB204\uB97C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.',
    fix: "\uBCF4\uC774\uB294 \uAE00\uC790\uB97C \uB123\uAC70\uB098, \uC544\uC774\uCF58 \uBC84\uD2BC\uC5D0\uB294 aria-label \uB85C \uAE30\uB2A5\uC744 \uC801\uC5B4 \uC8FC\uC138\uC694.",
    code: '<button aria-label="\uBA54\uB274 \uC5F4\uAE30">\n  <svg aria-hidden="true">\u2026</svg>\n</button>'
  },
  "form-label": {
    category: "screenreader",
    title: "\uC785\uB825\uCE78\uC5D0 \uB77C\uBCA8\uC774 \uC5C6\uC5B4\uC694",
    bubble: "\uC774 \uC785\uB825\uCE78\uC774 \uBB34\uC5C7\uC778\uC9C0 \uBAB0\uB77C\uC694!",
    problem: "<input>\xB7<select>\xB7<textarea> \uC5D0 \uC5F0\uACB0\uB41C <label> \uC774\uB098 aria-label \uC774 \uC5C6\uC2B5\uB2C8\uB2E4. placeholder \uB9CC \uC788\uB294 \uACBD\uC6B0\uB3C4 \uD574\uB2F9\uD569\uB2C8\uB2E4.",
    why: "placeholder \uB294 \uC785\uB825\uC744 \uC2DC\uC791\uD558\uBA74 \uC0AC\uB77C\uC9C0\uACE0 \uC2A4\uD06C\uB9B0 \uB9AC\uB354\uAC00 \uB77C\uBCA8\uB85C \uC778\uC815\uD558\uC9C0 \uC54A\uB294 \uACBD\uC6B0\uAC00 \uB9CE\uC2B5\uB2C8\uB2E4. \uB77C\uBCA8\uC744 \uB204\uB974\uBA74 \uC785\uB825\uCE78\uC5D0 \uD3EC\uCEE4\uC2A4\uAC00 \uAC00\uB294 \uD3B8\uC758\uB3C4 \uC0AC\uB77C\uC9D1\uB2C8\uB2E4.",
    fix: "<label for> \uB85C \uC785\uB825\uCE78\uACFC \uC5F0\uACB0\uD558\uAC70\uB098, \uB77C\uBCA8\uC744 \uC228\uAE30\uACE0 \uC2F6\uB2E4\uBA74 aria-label \uC744 \uC4F0\uC138\uC694.",
    code: '<label for="email">\uC774\uBA54\uC77C</label>\n<input id="email" type="email" />'
  },
  "html-lang": {
    category: "screenreader",
    title: "<html> \uC5D0 lang \uC774 \uC5C6\uC5B4\uC694",
    bubble: "\uC774 \uD398\uC774\uC9C0\uAC00 \uBB34\uC2A8 \uC5B8\uC5B4\uC778\uC9C0 \uBAB0\uB77C\uC694!",
    problem: "<html> \uC694\uC18C\uC5D0 lang \uC18D\uC131\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.",
    why: "\uC2A4\uD06C\uB9B0 \uB9AC\uB354\uAC00 \uBC1C\uC74C \uADDC\uCE59\uC744 \uACE0\uB974\uB294 \uAE30\uC900\uC774\uACE0, \uBE0C\uB77C\uC6B0\uC800\uC758 \uBC88\uC5ED\xB7\uB9DE\uCDA4\uBC95 \uAC80\uC0AC\xB7\uD558\uC774\uD508 \uCC98\uB9AC\uB3C4 lang \uC744 \uBD05\uB2C8\uB2E4.",
    fix: "<html> \uC5D0 \uD398\uC774\uC9C0 \uC8FC \uC5B8\uC5B4\uB97C \uC801\uC5B4 \uC8FC\uC138\uC694.",
    code: '<html lang="ko">'
  },
  "page-title": {
    category: "seo",
    title: "\uD398\uC774\uC9C0 \uC81C\uBAA9(<title>)\uC774 \uBE44\uC5B4 \uC788\uC5B4\uC694",
    bubble: "\uD0ED \uC81C\uBAA9\uC774 \uBE44\uC5B4 \uC788\uC5B4\uC694!",
    problem: "document.title \uC774 \uBE44\uC5B4 \uC788\uAC70\uB098 \uC5C6\uC2B5\uB2C8\uB2E4.",
    why: "\uBE0C\uB77C\uC6B0\uC800 \uD0ED, \uC990\uACA8\uCC3E\uAE30, \uAC80\uC0C9 \uACB0\uACFC, \uC2A4\uD06C\uB9B0 \uB9AC\uB354\uC758 \uD398\uC774\uC9C0 \uC548\uB0B4\uAC00 \uBAA8\uB450 \uC81C\uBAA9\uC5D0\uC11C \uC2DC\uC791\uD569\uB2C8\uB2E4. \uD0ED\uC774 \uC5EC\uB7EC \uAC1C\uC77C \uB54C \uAD6C\uBD84\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.",
    fix: "\uD398\uC774\uC9C0\uB9C8\uB2E4 \uB0B4\uC6A9\uC744 \uC54C\uB824 \uC8FC\uB294 \uACE0\uC720\uD55C \uC81C\uBAA9\uC744 \uB123\uC73C\uC138\uC694. SPA \uB77C\uBA74 \uB77C\uC6B0\uD2B8\uAC00 \uBC14\uB014 \uB54C \uC81C\uBAA9\uB3C4 \uBC14\uAFD4\uC57C \uD569\uB2C8\uB2E4.",
    code: "<title>\uC8FC\uBB38 \uB0B4\uC5ED - \uB9C8\uC774 \uC11C\uBE44\uC2A4</title>"
  },
  "viewport-meta": {
    category: "responsive",
    title: "viewport \uBA54\uD0C0 \uD0DC\uADF8\uAC00 \uC5C6\uC5B4\uC694",
    bubble: "\uBAA8\uBC14\uC77C\uC5D0\uC11C \uAE68\uC9C8 \uC218 \uC788\uC5B4\uC694!",
    problem: '<meta name="viewport"> \uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.',
    why: "\uBAA8\uBC14\uC77C \uBE0C\uB77C\uC6B0\uC800\uB294 \uC774 \uD0DC\uADF8\uAC00 \uC5C6\uC73C\uBA74 \uB370\uC2A4\uD06C\uD1B1 \uD3ED(\uC57D 980px)\uC73C\uB85C \uADF8\uB9B0 \uB4A4 \uCD95\uC18C\uD574\uC11C \uBCF4\uC5EC \uC90D\uB2C8\uB2E4. \uBC18\uC751\uD615 CSS \uAC00 \uC758\uB3C4\uB300\uB85C \uB3D9\uC791\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
    fix: "<head> \uC5D0 viewport \uB97C \uCD94\uAC00\uD558\uC138\uC694.",
    code: '<meta name="viewport" content="width=device-width, initial-scale=1" />'
  },
  "heading-order": {
    category: "screenreader",
    title: "\uC81C\uBAA9 \uB2E8\uACC4\uB97C \uAC74\uB108\uB6F0\uC5C8\uC5B4\uC694",
    bubble: "\uC81C\uBAA9 \uB2E8\uACC4\uAC00 \uAC74\uB108\uB6F0\uC5B4\uC84C\uC5B4\uC694!",
    problem: "h1 \uB2E4\uC74C\uC5D0 \uBC14\uB85C h3 \uCC98\uB7FC \uC81C\uBAA9 \uB2E8\uACC4\uB97C \uAC74\uB108\uB6F4 \uACF3\uC774 \uC788\uC2B5\uB2C8\uB2E4.",
    why: "\uC2A4\uD06C\uB9B0 \uB9AC\uB354 \uC0AC\uC6A9\uC790\uB294 \uC81C\uBAA9 \uBAA9\uB85D\uC73C\uB85C \uD398\uC774\uC9C0 \uAD6C\uC870\uB97C \uD30C\uC545\uD569\uB2C8\uB2E4. \uB2E8\uACC4\uAC00 \uAC74\uB108\uB6F0\uC5B4\uC9C0\uBA74 \uB0B4\uC6A9\uC774 \uBE60\uC84C\uB2E4\uACE0 \uC624\uD574\uD558\uAC8C \uB429\uB2C8\uB2E4.",
    fix: "\uD06C\uAE30\uAC00 \uC544\uB2C8\uB77C \uAD6C\uC870\uC5D0 \uB9DE\uCDB0 h1\u2192h2\u2192h3 \uC21C\uC11C\uB97C \uC9C0\uD0A4\uACE0, \uD06C\uAE30\uB294 CSS \uB85C \uC870\uC808\uD558\uC138\uC694.",
    code: "<h1>\uB300\uC2DC\uBCF4\uB4DC</h1>\n<h2>\uCD5C\uADFC \uC8FC\uBB38</h2>\n<h3>\uBC30\uC1A1 \uC911</h3>"
  },
  "touch-target": {
    category: "responsive",
    title: "\uB204\uB97C \uC601\uC5ED\uC774 \uB108\uBB34 \uC791\uC544\uC694",
    bubble: "\uC190\uAC00\uB77D\uC73C\uB85C \uB204\uB974\uAE30\uC5D4 \uB108\uBB34 \uC791\uC544\uC694!",
    problem: "\uBC84\uD2BC\xB7\uC785\uB825\uCE78 \uAC19\uC740 \uC870\uC791 \uC694\uC18C\uC758 \uAC00\uB85C\uB098 \uC138\uB85C\uAC00 24px \uBCF4\uB2E4 \uC791\uC2B5\uB2C8\uB2E4.",
    why: "\uBAA8\uBC14\uC77C\uC5D0\uC11C \uC798\uBABB \uB204\uB974\uAE30 \uC27D\uACE0, \uC190\uC774 \uB5A8\uB9AC\uB294 \uC0AC\uC6A9\uC790\uB294 \uB204\uB974\uAE30 \uC5B4\uB835\uC2B5\uB2C8\uB2E4. \uC811\uADFC\uC131 \uAE30\uC900(WCAG 2.2)\uC740 \uCD5C\uC18C 24px, \uAD8C\uC7A5\uC740 44px \uC785\uB2C8\uB2E4.",
    fix: "\uBCF4\uC774\uB294 \uD06C\uAE30\uAC00 \uC791\uB354\uB77C\uB3C4 padding \uC774\uB098 min-width/min-height \uB85C \uB204\uB974\uB294 \uC601\uC5ED\uC744 \uD0A4\uC6B0\uC138\uC694.",
    code: ".icon-button {\n  min-width: 44px;\n  min-height: 44px;\n}"
  },
  "h-overflow": {
    category: "responsive",
    title: "\uD654\uBA74 \uD3ED\uC744 \uB118\uC5B4\uC11C \uAC00\uB85C\uB85C \uC2A4\uD06C\uB864\uB3FC\uC694",
    bubble: "\uD654\uBA74 \uBC16\uC73C\uB85C \uC090\uC838\uB098\uAC14\uC5B4\uC694!",
    problem: "\uD398\uC774\uC9C0\uAC00 \uBE0C\uB77C\uC6B0\uC800 \uD3ED\uBCF4\uB2E4 \uB113\uC5B4\uC11C \uAC00\uB85C \uC2A4\uD06C\uB864\uC774 \uC0DD\uAE41\uB2C8\uB2E4. \uC544\uB798 \uC694\uC18C\uAC00 \uC624\uB978\uCABD \uB05D\uC744 \uB118\uC2B5\uB2C8\uB2E4.",
    why: "\uBAA8\uBC14\uC77C\uC5D0\uC11C \uD654\uBA74\uC774 \uC88C\uC6B0\uB85C \uD754\uB4E4\uB9AC\uACE0 \uB0B4\uC6A9\uC774 \uC798\uB9BD\uB2C8\uB2E4. \uACE0\uC815 px \uD3ED\uC774\uB098 \uAE34 \uB2E8\uC5B4\xB7\uD45C\xB7\uC774\uBBF8\uC9C0\uAC00 \uD754\uD55C \uC6D0\uC778\uC785\uB2C8\uB2E4.",
    fix: "\uD3ED\uC744 %\xB7max-width: 100% \uB85C \uBC14\uAFB8\uACE0, \uAE34 \uD14D\uC2A4\uD2B8\uC5D0\uB294 overflow-wrap, \uD45C\uC5D0\uB294 \uAC00\uB85C \uC2A4\uD06C\uB864 \uC601\uC5ED\uC744 \uB530\uB85C \uB450\uC138\uC694.",
    code: "img { max-width: 100%; height: auto; }\n.card { width: min(100%, 480px); }"
  },
  contrast: {
    category: "vision",
    title: "\uAE00\uC790\uC640 \uBC30\uACBD\uC758 \uBA85\uC554 \uB300\uBE44\uAC00 \uBD80\uC871\uD574\uC694",
    bubble: "\uAE00\uC790\uAC00 \uC798 \uC548 \uBCF4\uC5EC\uC694!",
    problem: "\uAE00\uC790\uC0C9\uACFC \uBC30\uACBD\uC0C9\uC758 \uBA85\uC554 \uB300\uBE44\uAC00 \uAE30\uC900(\uC77C\uBC18 \uAE00\uC790 4.5:1, \uD070 \uAE00\uC790 3:1)\uBCF4\uB2E4 \uB0AE\uC2B5\uB2C8\uB2E4.",
    why: "\uC800\uC2DC\uB825 \uC0AC\uC6A9\uC790\uBFD0 \uC544\uB2C8\uB77C \uBC1D\uC740 \uC57C\uC678\uB098 \uB0AE\uC740 \uD654\uBA74 \uBC1D\uAE30\uC5D0\uC11C\uB3C4 \uC77D\uAE30 \uC5B4\uB835\uC2B5\uB2C8\uB2E4. \uC5F0\uD55C \uD68C\uC0C9 \uAE00\uC528\uAC00 \uAC00\uC7A5 \uD754\uD55C \uC6D0\uC778\uC785\uB2C8\uB2E4.",
    fix: "\uAE00\uC790\uC0C9\uC744 \uB354 \uC9C4\uD558\uAC8C \uD558\uAC70\uB098 \uBC30\uACBD\uC744 \uBC14\uAFD4 \uB300\uBE44\uB97C \uB192\uC774\uC138\uC694. \uBE0C\uB77C\uC6B0\uC800 \uAC1C\uBC1C\uC790 \uB3C4\uAD6C\uC758 \uC0C9\uC0C1 \uC120\uD0DD\uAE30\uC5D0\uC11C \uB300\uBE44 \uBE44\uC728\uC744 \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4.",
    code: "/* \uB300\uBE44 2.3:1 \u2192 4.6:1 */\ncolor: #aaa;  \u2192  color: #595959;"
  },
  "dup-id": {
    category: "screenreader",
    title: "\uAC19\uC740 id \uAC00 \uD55C \uD398\uC774\uC9C0\uC5D0 \uC5EC\uB7EC \uBC88 \uC4F0\uC600\uC5B4\uC694",
    bubble: "\uAC19\uC740 id \uAC00 \uB450 \uBC88 \uC4F0\uC600\uC5B4\uC694!",
    problem: "\uAC19\uC740 id \uAC12\uC744 \uAC00\uC9C4 \uC694\uC18C\uAC00 \uD55C \uD398\uC774\uC9C0\uC5D0 \uB458 \uC774\uC0C1 \uC788\uC2B5\uB2C8\uB2E4.",
    why: "id \uB294 \uD398\uC774\uC9C0\uC5D0\uC11C \uD558\uB098\uBFD0\uC774\uC5B4\uC57C \uD569\uB2C8\uB2E4. \uC911\uBCF5\uB418\uBA74 label for, aria-labelledby, \uC575\uCEE4 \uB9C1\uD06C, getElementById \uAC00 \uCCAB \uBC88\uC9F8 \uC694\uC18C\uB9CC \uAC00\uB9AC\uCF1C\uC11C \uC5C9\uB6B1\uD55C \uACF3\uC774 \uB3D9\uC791\uD569\uB2C8\uB2E4. \uCEF4\uD3EC\uB10C\uD2B8\uB97C \uBC18\uBCF5\uD574\uC11C \uADF8\uB9B4 \uB54C id \uB97C \uACE0\uC815 \uBB38\uC790\uC5F4\uB85C \uB123\uC5B4 \uB450\uBA74 \uD754\uD788 \uC0DD\uAE41\uB2C8\uB2E4.",
    fix: "\uBC18\uBCF5\uB418\uB294 \uC694\uC18C\uC5D0\uB294 id \uB97C \uBE7C\uACE0 class \uB97C \uC4F0\uAC70\uB098, \uD56D\uBAA9\uB9C8\uB2E4 \uB2E4\uB978 id \uB97C \uB9CC\uB4DC\uC138\uC694(React \uB77C\uBA74 useId).",
    code: "// \uAC19\uC740 \uCEF4\uD3EC\uB10C\uD2B8\uB97C \uC5EC\uB7EC \uBC88 \uADF8\uB9B4 \uB54C\nconst id = useId();\n<label htmlFor={id}>\uC774\uB984</label>\n<input id={id} />"
  },
  "zoom-disabled": {
    category: "vision",
    title: "\uD654\uBA74 \uD655\uB300\uB97C \uB9C9\uC544 \uB193\uC558\uC5B4\uC694",
    bubble: "\uD655\uB300\uB97C \uB9C9\uC544 \uB193\uC558\uC5B4\uC694!",
    problem: "viewport \uBA54\uD0C0 \uD0DC\uADF8\uC5D0 user-scalable=no \uC774\uAC70\uB098 maximum-scale \uC774 1 \uC774\uD558\uC785\uB2C8\uB2E4.",
    why: "\uC800\uC2DC\uB825 \uC0AC\uC6A9\uC790\uB294 \uC190\uAC00\uB77D\uC73C\uB85C \uD655\uB300\uD574\uC11C \uAE00\uC790\uB97C \uC77D\uC2B5\uB2C8\uB2E4. \uD655\uB300\uB97C \uB9C9\uC73C\uBA74 \uC77D\uC744 \uBC29\uBC95\uC774 \uC0AC\uB77C\uC9C0\uACE0, \uC811\uADFC\uC131 \uAE30\uC900(WCAG 1.4.4)\uB3C4 \uC5B4\uAE41\uB2C8\uB2E4. \uCD5C\uADFC \uBE0C\uB77C\uC6B0\uC800\uB294 \uC77C\uBD80 \uBB34\uC2DC\uD558\uC9C0\uB9CC \uB9C9\uC73C\uB824\uB294 \uCF54\uB4DC \uC790\uCCB4\uAC00 \uBB38\uC81C\uC785\uB2C8\uB2E4.",
    fix: "user-scalable \uACFC maximum-scale \uC744 \uC9C0\uC6B0\uC138\uC694. \uC785\uB825\uCE78 \uD655\uB300\uAC00 \uAC70\uC2AC\uB9B0\uB2E4\uBA74 \uC785\uB825\uCE78 \uAE00\uC790\uB97C 16px \uC774\uC0C1\uC73C\uB85C \uD558\uBA74 \uB429\uB2C8\uB2E4.",
    code: '<meta name="viewport" content="width=device-width, initial-scale=1" />\ninput { font-size: 16px; }'
  },
  "tabindex-positive": {
    category: "keyboard",
    title: "tabindex \uC5D0 \uC591\uC218\uB97C \uC37C\uC5B4\uC694",
    bubble: "tabindex \uAC00 \uC591\uC218\uC608\uC694!",
    problem: "tabindex \uAC00 1 \uC774\uC0C1\uC778 \uC694\uC18C\uAC00 \uC788\uC2B5\uB2C8\uB2E4.",
    why: "\uC591\uC218 tabindex \uB294 \uD654\uBA74 \uC21C\uC11C\uC640 \uC0C1\uAD00\uC5C6\uC774 \uADF8 \uC694\uC18C\uB97C \uBA3C\uC800 \uD3EC\uCEE4\uC2A4\uD569\uB2C8\uB2E4. \uD0A4\uBCF4\uB4DC\xB7\uC2A4\uD06C\uB9B0 \uB9AC\uB354 \uC0AC\uC6A9\uC790\uC758 \uC774\uB3D9 \uC21C\uC11C\uAC00 \uB4A4\uC8FD\uBC15\uC8FD\uC774 \uB418\uACE0, \uC694\uC18C\uAC00 \uB298\uC5B4\uB0A0\uC218\uB85D \uAD00\uB9AC\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.",
    fix: "tabindex \uB294 0(\uC21C\uC11C\uB300\uB85C \uD3EC\uCEE4\uC2A4 \uAC00\uB2A5) \uC774\uB098 -1(\uCF54\uB4DC\uB85C\uB9CC \uD3EC\uCEE4\uC2A4) \uB9CC \uC4F0\uACE0, \uC21C\uC11C\uB294 HTML \uC5D0 \uC801\uB294 \uC21C\uC11C\uB85C \uB9DE\uCD94\uC138\uC694.",
    code: '<!-- \u2717 --> <div tabindex="5">\u2026</div>\n<!-- \u2713 --> <div tabindex="0">\u2026</div>'
  },
  "alt-quality": {
    category: "screenreader",
    title: "alt \uAC00 \uD30C\uC77C \uC774\uB984\uC774\uB098 \uB73B \uC5C6\uB294 \uB9D0\uC774\uC5D0\uC694",
    bubble: "alt \uAC00 \uD30C\uC77C \uC774\uB984 \uAC19\uC544\uC694!",
    problem: 'alt \uAC00 "hero.png", "image", "\uC0AC\uC9C4" \uCC98\uB7FC \uD30C\uC77C \uC774\uB984\uC774\uAC70\uB098 \uC774\uBBF8\uC9C0\uAC00 \uBB34\uC5C7\uC778\uC9C0 \uC54C\uB824 \uC8FC\uC9C0 \uBABB\uD558\uB294 \uB9D0\uC785\uB2C8\uB2E4.',
    why: '\uC2A4\uD06C\uB9B0 \uB9AC\uB354\uB294 alt \uB97C \uADF8\uB300\uB85C \uC77D\uC2B5\uB2C8\uB2E4. "\uC774\uBBF8\uC9C0 \uC774\uBBF8\uC9C0"\uB098 "hero \uC810 png"\uB97C \uB4E4\uC73C\uBA74 \uC774\uBBF8\uC9C0\uAC00 \uBB34\uC2A8 \uB0B4\uC6A9\uC778\uC9C0 \uC54C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. alt \uB97C \uAE30\uACC4\uC801\uC73C\uB85C \uCC44\uC6CC \uB123\uB294 \uC2B5\uAD00\uC5D0\uC11C \uD754\uD788 \uC0DD\uAE41\uB2C8\uB2E4.',
    fix: '\uC774\uBBF8\uC9C0\uAC00 \uC804\uB2EC\uD558\uB294 \uB0B4\uC6A9\uC744 \uD55C \uBB38\uC7A5\uC73C\uB85C \uC4F0\uC138\uC694. "\uC774\uBBF8\uC9C0" \uAC19\uC740 \uB9D0\uC740 \uBE7C\uB3C4 \uB429\uB2C8\uB2E4. \uC7A5\uC2DD\uC6A9\uC774\uBA74 alt="" \uB85C \uBE44\uC6B0\uC138\uC694.',
    code: '<!-- \u2717 --> <img src="hero.png" alt="hero.png">\n<!-- \u2713 --> <img src="hero.png" alt="\uB178\uD2B8\uBD81\uC73C\uB85C \uC791\uC5C5\uD558\uB294 \uAC1C\uBC1C\uC790">'
  },
  "clickable-div": {
    category: "keyboard",
    title: "div \uB098 span \uC744 \uBC84\uD2BC\uCC98\uB7FC \uC37C\uC5B4\uC694",
    bubble: "div \uB97C \uBC84\uD2BC\uCC98\uB7FC \uC37C\uC5B4\uC694!",
    problem: "\uD074\uB9AD\uD560 \uC218 \uC788\uB294 \uBAA8\uC591(\uB9C8\uC6B0\uC2A4 \uD3EC\uC778\uD130\uAC00 \uC190\uAC00\uB77D \uBAA8\uC591)\uC778\uB370 \uBC84\uD2BC\uC774\uB098 \uB9C1\uD06C\uAC00 \uC544\uB2CC div\xB7span \uB4F1\uC774\uACE0, role \uC774\uB098 tabindex \uB3C4 \uC5C6\uC2B5\uB2C8\uB2E4.",
    why: '\uC774\uB7F0 \uC694\uC18C\uB294 Tab \uD0A4\uB85C \uC774\uB3D9\uD560 \uC218 \uC5C6\uACE0, Enter\xB7Space \uB85C \uB204\uB97C \uC218 \uC5C6\uACE0, \uC2A4\uD06C\uB9B0 \uB9AC\uB354\uAC00 "\uBC84\uD2BC"\uC774\uB77C\uACE0 \uC54C\uB824 \uC8FC\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uB9C8\uC6B0\uC2A4\uB97C \uBABB \uC4F0\uB294 \uC0AC\uC6A9\uC790\uB294 \uC774 \uAE30\uB2A5\uC744 \uC4F8 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. AI\uAC00 \uB9CC\uB4E0 \uD654\uBA74\uC5D0\uC11C \uAC00\uC7A5 \uD754\uD55C \uC811\uADFC\uC131 \uC2E4\uC218\uC785\uB2C8\uB2E4.',
    fix: '\uC9C4\uC9DC <button>(\uC774\uB3D9\uC740 <a href>)\uC73C\uB85C \uBC14\uAFB8\uC138\uC694. \uC2A4\uD0C0\uC77C\uC740 CSS \uB85C \uB2E4\uC2DC \uC785\uD788\uBA74 \uB429\uB2C8\uB2E4. \uC815\uB9D0 div \uC5EC\uC57C \uD55C\uB2E4\uBA74 role="button", tabindex="0", \uD0A4\uBCF4\uB4DC \uC774\uBCA4\uD2B8\uB97C \uBAA8\uB450 \uC9C1\uC811 \uB2EC\uC544\uC57C \uD569\uB2C8\uB2E4.',
    code: '<!-- \u2717 --> <div class="btn" onClick={save}>\uC800\uC7A5</div>\n<!-- \u2713 --> <button type="button" class="btn" onClick={save}>\uC800\uC7A5</button>'
  },
  "table-header": {
    category: "screenreader",
    title: "\uD45C\uC5D0 \uC81C\uBAA9 \uCE78(th)\uC774 \uC5C6\uC5B4\uC694",
    bubble: "\uD45C\uC5D0 \uC81C\uBAA9 \uCE78\uC774 \uC5C6\uC5B4\uC694!",
    problem: "<table> \uC548\uC5D0 <th> \uAC00 \uD558\uB098\uB3C4 \uC5C6\uC2B5\uB2C8\uB2E4.",
    why: '\uC2A4\uD06C\uB9B0 \uB9AC\uB354\uB294 th \uB85C "\uC774 \uCE78\uC740 \uC5B4\uB5A4 \uC5F4\uC758 \uAC12\uC778\uC9C0"\uB97C \uC548\uB0B4\uD569\uB2C8\uB2E4. td \uB9CC \uC4F0\uBA74 \uC22B\uC790\uB4E4\uC774 \uBB34\uC5C7\uC778\uC9C0 \uC54C\uB824 \uC904 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uBCF4\uC774\uB294 \uBAA8\uC591\uB9CC \uAD75\uAC8C \uD574\uC11C\uB294 \uAD6C\uC870\uAC00 \uC804\uB2EC\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.',
    fix: '\uC81C\uBAA9 \uCE78\uC740 <th scope="col"> (\uD589 \uC81C\uBAA9\uC774\uBA74 scope="row") \uC73C\uB85C \uC4F0\uC138\uC694. \uD45C\uAC00 \uB808\uC774\uC544\uC6C3\uC6A9\uC77C \uBFD0\uC774\uB77C\uBA74 table \uB300\uC2E0 CSS grid\xB7flex \uB97C \uC4F0\uB294 \uAC83\uC774 \uC88B\uC2B5\uB2C8\uB2E4.',
    code: '<table>\n  <tr><th scope="col">\uC0C1\uD488</th><th scope="col">\uAC00\uACA9</th></tr>\n  <tr><td>\uC0AC\uACFC</td><td>1,000\uC6D0</td></tr>\n</table>'
  },
  "meta-description": {
    category: "seo",
    title: "\uAC80\uC0C9 \uACB0\uACFC\uC5D0 \uBCF4\uC77C \uC124\uBA85(meta description)\uC774 \uC5C6\uC5B4\uC694",
    bubble: "\uAC80\uC0C9 \uACB0\uACFC\uC5D0 \uBCF4\uC77C \uC124\uBA85\uC774 \uC5C6\uC5B4\uC694!",
    problem: '<meta name="description"> \uC774 \uC5C6\uAC70\uB098 \uB0B4\uC6A9\uC774 \uBE44\uC5B4 \uC788\uC2B5\uB2C8\uB2E4.',
    why: "\uAC80\uC0C9 \uACB0\uACFC\uC640 \uB9C1\uD06C \uBBF8\uB9AC\uBCF4\uAE30\uC5D0 \uB098\uC624\uB294 \uB450 \uC904 \uC124\uBA85\uC774 \uBC14\uB85C \uC774 \uAC12\uC785\uB2C8\uB2E4. \uC5C6\uC73C\uBA74 \uAC80\uC0C9\uC5D4\uC9C4\uC774 \uBCF8\uBB38\uC5D0\uC11C \uC544\uBB34 \uBB38\uC7A5\uC774\uB098 \uAC00\uC838\uC640 \uBCF4\uC5EC \uC918\uC11C \uD074\uB9AD\uD558\uACE0 \uC2F6\uC740 \uC124\uBA85\uC774 \uB418\uAE30 \uC5B4\uB835\uC2B5\uB2C8\uB2E4.",
    fix: "\uD398\uC774\uC9C0\uB9C8\uB2E4 \uB0B4\uC6A9\uC744 \uD55C\uB450 \uBB38\uC7A5(120~160\uC790 \uC548\uD30E)\uC73C\uB85C \uC694\uC57D\uD574\uC11C \uB123\uC73C\uC138\uC694. \uD398\uC774\uC9C0\uB9C8\uB2E4 \uB2EC\uB77C\uC57C \uD558\uACE0, \uC81C\uBAA9\uC744 \uADF8\uB300\uB85C \uBC18\uBCF5\uD558\uC9C0 \uB9C8\uC138\uC694.",
    code: '<meta name="description" content="\uC774\uBC88 \uB2EC \uC8FC\uBB38 \uD604\uD669\uACFC \uBC30\uC1A1 \uC0C1\uD0DC\uB97C \uD55C\uB208\uC5D0 \uD655\uC778\uD558\uB294 \uB300\uC2DC\uBCF4\uB4DC\uC785\uB2C8\uB2E4." />'
  },
  "img-oversized": {
    category: "perf",
    title: "\uC774\uBBF8\uC9C0\uAC00 \uD654\uBA74\uC5D0 \uBCF4\uC774\uB294 \uD06C\uAE30\uBCF4\uB2E4 \uD6E8\uC52C \uCEE4\uC694",
    bubble: "\uC774\uBBF8\uC9C0\uAC00 \uB108\uBB34 \uCEE4\uC694!",
    problem: "\uC774\uBBF8\uC9C0 \uC6D0\uBCF8 \uAC00\uB85C \uD3ED\uC774 \uD654\uBA74\uC5D0 \uADF8\uB824\uC9C0\uB294 \uD3ED\uC758 2\uBC30(\uACE0\uD574\uC0C1\uB3C4 \uD654\uBA74 \uBC30\uC728 \uD3EC\uD568)\uBCF4\uB2E4 \uD6E8\uC52C \uD07D\uB2C8\uB2E4.",
    why: "\uBCF4\uC774\uC9C0\uB3C4 \uC54A\uB294 \uD53D\uC140\uAE4C\uC9C0 \uB0B4\uB824\uBC1B\uC544\uC11C \uB85C\uB529\uC774 \uB290\uB824\uC9C0\uACE0 \uB370\uC774\uD130\uB97C \uB0AD\uBE44\uD569\uB2C8\uB2E4. \uBAA8\uBC14\uC77C\uC5D0\uC11C\uB294 \uD2B9\uD788 \uB208\uC5D0 \uB755\uB2C8\uB2E4. \uC6D0\uBCF8 \uC0AC\uC9C4\uC744 \uADF8\uB300\uB85C \uC62C\uB9AC\uACE0 CSS \uB85C\uB9CC \uC904\uC774\uB294 \uC2B5\uAD00\uC5D0\uC11C \uD754\uD788 \uC0DD\uAE41\uB2C8\uB2E4.",
    fix: "\uBCF4\uC774\uB294 \uD06C\uAE30\uC758 2\uBC30 \uC815\uB3C4(\uACE0\uD574\uC0C1\uB3C4 \uD654\uBA74\uC6A9)\uB85C \uB9AC\uC0AC\uC774\uC988\uD558\uACE0, WebP\xB7AVIF \uAC19\uC740 \uAC00\uBCBC\uC6B4 \uD615\uC2DD\uC744 \uC4F0\uC138\uC694. \uD654\uBA74 \uD06C\uAE30\uBCC4\uB85C\uB294 srcset \uACFC sizes \uB85C \uC54C\uB9DE\uC740 \uD30C\uC77C\uC744 \uACE0\uB974\uAC8C \uD569\uB2C8\uB2E4.",
    code: '<img\n  src="/hero-800.webp"\n  srcset="/hero-800.webp 800w, /hero-1600.webp 1600w"\n  sizes="(max-width: 800px) 100vw, 800px"\n  alt="\u2026" />'
  },
  "vague-link": {
    category: "screenreader",
    title: '\uB9C1\uD06C \uAE00\uC790\uAC00 "\uC5EC\uAE30"\uCC98\uB7FC \uB73B\uC774 \uC5C6\uC5B4\uC694',
    bubble: '\uB9C1\uD06C \uC774\uB984\uC774 "\uC5EC\uAE30"\uC608\uC694!',
    problem: '\uB9C1\uD06C \uAE00\uC790\uAC00 "\uC5EC\uAE30", "click here", "link" \uCC98\uB7FC \uC5B4\uB514\uB85C \uAC00\uB294\uC9C0 \uC54C \uC218 \uC5C6\uB294 \uB9D0\uC785\uB2C8\uB2E4.',
    why: '\uC2A4\uD06C\uB9B0 \uB9AC\uB354 \uC0AC\uC6A9\uC790\uB294 \uB9C1\uD06C \uBAA9\uB85D\uB9CC \uB530\uB85C \uD6D1\uC5B4 \uB4E3\uC2B5\uB2C8\uB2E4. "\uC5EC\uAE30, \uC5EC\uAE30, \uC5EC\uAE30"\uB9CC \uB4E4\uB9AC\uBA74 \uC5B4\uB290 \uB9C1\uD06C\uAC00 \uBB34\uC5C7\uC778\uC9C0 \uC54C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uAC80\uC0C9\uC5D4\uC9C4\uB3C4 \uB9C1\uD06C \uAE00\uC790\uB85C \uB300\uC0C1 \uD398\uC774\uC9C0\uB97C \uC774\uD574\uD569\uB2C8\uB2E4.',
    fix: '\uB9C1\uD06C \uAE00\uC790\uB9CC \uC77D\uC5B4\uB3C4 \uBAA9\uC801\uC9C0\uB97C \uC54C \uC218 \uC788\uAC8C \uC4F0\uC138\uC694. \uBB38\uC7A5 \uC18D\uC5D0\uC11C\uB3C4 "\uC0AC\uC6A9 \uC124\uBA85\uC11C \uBCF4\uAE30"\uCC98\uB7FC \uAD6C\uCCB4\uC801\uC778 \uB9D0\uC744 \uB9C1\uD06C\uB85C \uB9CC\uB4ED\uB2C8\uB2E4.',
    code: '<!-- \u2717 --> \uC124\uBA85\uC11C\uB294 <a href="/docs">\uC5EC\uAE30</a>\uB97C \uB20C\uB7EC \uBCF4\uC138\uC694.\n<!-- \u2713 --> <a href="/docs">\uC0AC\uC6A9 \uC124\uBA85\uC11C</a>\uB97C \uD655\uC778\uD574 \uBCF4\uC138\uC694.'
  },
  "frame-title": {
    category: "screenreader",
    title: "iframe \uC5D0 \uC81C\uBAA9(title)\uC774 \uC5C6\uC5B4\uC694",
    bubble: "iframe \uC5D0 title \uC774 \uC5C6\uC5B4\uC694!",
    problem: "<iframe> \uC5D0 title \uB3C4 aria-label \uB3C4 \uC5C6\uC2B5\uB2C8\uB2E4.",
    why: '\uC2A4\uD06C\uB9B0 \uB9AC\uB354\uB294 iframe \uC744 \uB9CC\uB098\uBA74 "\uD504\uB808\uC784"\uC774\uB77C\uACE0\uB9CC \uC54C\uB9AC\uACE0 \uC774\uB984\uC744 \uC77D\uC5B4 \uC90D\uB2C8\uB2E4. \uC774\uB984\uC774 \uC5C6\uC73C\uBA74 \uC9C0\uB3C4\uC778\uC9C0 \uACB0\uC81C\uCC3D\uC778\uC9C0 \uC601\uC0C1\uC778\uC9C0 \uB4E4\uC5B4\uAC00 \uBCF4\uAE30 \uC804\uC5D0\uB294 \uC54C \uC218 \uC5C6\uC5B4\uC11C, \uD504\uB808\uC784\uC744 \uAC74\uB108\uB6F8\uC9C0 \uD310\uB2E8\uD558\uC9C0 \uBABB\uD569\uB2C8\uB2E4.',
    fix: 'iframe \uC5D0 \uC548\uC758 \uB0B4\uC6A9\uC744 \uC124\uBA85\uD558\uB294 title \uC744 \uBD99\uC774\uC138\uC694. \uC7A5\uC2DD\uC6A9\uC774\uB77C\uBA74 \uBCF4\uC870 \uAE30\uC220\uC774 \uAC74\uB108\uB6F0\uB3C4\uB85D aria-hidden \uACFC tabindex="-1" \uC744 \uD568\uAED8 \uC4F0\uC138\uC694.',
    code: '<iframe src="https://maps.example/\u2026" title="\uB9E4\uC7A5 \uC704\uCE58 \uC9C0\uB3C4"></iframe>'
  },
  "aria-hidden-focus": {
    category: "keyboard",
    title: "\uC228\uAE34 \uC694\uC18C(aria-hidden) \uC548\uC5D0 \uD0A4\uBCF4\uB4DC\uB85C \uAC08 \uC218 \uC788\uB294 \uAC83\uC774 \uC788\uC5B4\uC694",
    bubble: "\uC228\uAE34 \uACF3\uC5D0 \uD3EC\uCEE4\uC2A4\uAC00 \uAC00\uC694!",
    problem: 'aria-hidden="true" \uC778 \uC694\uC18C\uAC00 \uB9C1\uD06C\xB7\uBC84\uD2BC\xB7\uC785\uB825\uCE78\uC744 \uD488\uACE0 \uC788\uC5B4\uC11C Tab \uD0A4\uB85C \uB4E4\uC5B4\uAC08 \uC218 \uC788\uC2B5\uB2C8\uB2E4.',
    why: '\uD654\uBA74 \uC77D\uAE30 \uD504\uB85C\uADF8\uB7A8\uC5D0\uAC8C\uB294 \uC228\uACBC\uB294\uB370 \uD0A4\uBCF4\uB4DC \uD3EC\uCEE4\uC2A4\uB294 \uAC08 \uC218 \uC788\uC73C\uBA74, \uC0AC\uC6A9\uC790\uB294 "\uC544\uBB34\uAC83\uB3C4 \uC5C6\uB294 \uACF3"\uC5D0\uC11C \uD3EC\uCEE4\uC2A4\uAC00 \uBA48\uCD94\uB294 \uACBD\uD5D8\uC744 \uD569\uB2C8\uB2E4. \uC5B4\uB514\uC5D0 \uC788\uB294\uC9C0\uB3C4, \uBB34\uC5C7\uC744 \uB204\uB974\uB294\uC9C0\uB3C4 \uC54C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uB2EB\uD78C \uBA54\uB274\xB7\uBAA8\uB2EC \uB4A4 \uBC30\uACBD\uC5D0\uC11C \uD754\uD788 \uC0DD\uAE41\uB2C8\uB2E4.',
    fix: '\uC228\uAE38 \uAC70\uBA74 \uD3EC\uCEE4\uC2A4\uB3C4 \uB9C9\uC73C\uC138\uC694: inert \uC18D\uC131(\uB610\uB294 hidden/display:none)\uC744 \uC4F0\uAC70\uB098, \uC548\uC758 \uC694\uC18C\uC5D0 tabindex="-1" \uC744 \uC8FC\uC138\uC694. \uBCF4\uC5EC\uC57C \uD558\uB294 \uAC83\uC774\uBA74 aria-hidden \uC744 \uBE7C\uC138\uC694.',
    code: '<!-- \u2717 --> <div aria-hidden="true"><button>\uB2EB\uAE30</button></div>\n<!-- \u2713 --> <div inert hidden><button>\uB2EB\uAE30</button></div>'
  },
  "empty-heading": {
    category: "screenreader",
    title: "\uB0B4\uC6A9\uC774 \uC5C6\uB294 \uC81C\uBAA9(h1~h6)\uC774 \uC788\uC5B4\uC694",
    bubble: "\uC81C\uBAA9 \uD0DC\uADF8\uAC00 \uBE44\uC5B4 \uC788\uC5B4\uC694!",
    problem: '<h1>~<h6> \uB610\uB294 role="heading" \uC694\uC18C\uC5D0 \uC77D\uC744 \uC218 \uC788\uB294 \uAE00\uC790\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.',
    why: '\uC2A4\uD06C\uB9B0 \uB9AC\uB354 \uC0AC\uC6A9\uC790\uB294 \uC81C\uBAA9 \uBAA9\uB85D\uC73C\uB85C \uD398\uC774\uC9C0\uB97C \uD6D1\uC5B4 \uC774\uB3D9\uD569\uB2C8\uB2E4. \uBE48 \uC81C\uBAA9\uC740 \uBAA9\uB85D\uC5D0 "\uC81C\uBAA9" \uC18C\uB9AC\uB9CC \uB098\uB294 \uBE48\uCE78\uC73C\uB85C \uB07C\uC5B4\uB4E4\uC5B4 \uAD6C\uC870\uB97C \uD5F7\uAC08\uB9AC\uAC8C \uD569\uB2C8\uB2E4. \uAE00\uC790 \uD06C\uAE30\uB9CC \uD0A4\uC6B0\uB824\uACE0 \uC81C\uBAA9 \uD0DC\uADF8\uB97C \uC4F8 \uB54C \uC790\uC8FC \uC0DD\uAE41\uB2C8\uB2E4.',
    fix: "\uC81C\uBAA9\uC5D0\uB294 \uAE00\uC790\uB97C \uB123\uACE0, \uBAA8\uC591\uB9CC \uD544\uC694\uD558\uBA74 CSS \uB97C \uC4F0\uC138\uC694. \uC544\uC774\uCF58 \uC81C\uBAA9\uC774\uB77C\uBA74 aria-label \uC774\uB098 \uC774\uBBF8\uC9C0 alt \uB85C \uC774\uB984\uC744 \uC8FC\uC138\uC694.",
    code: "<!-- \u2717 --> <h2></h2>\n<!-- \u2713 --> <h2>\uBC30\uC1A1 \uC815\uBCF4</h2>"
  },
  "landmark-main": {
    category: "keyboard",
    title: "\uD398\uC774\uC9C0\uC5D0 \uBCF8\uBB38 \uC601\uC5ED(main)\uC774 \uC5C6\uC5B4\uC694",
    bubble: "<main> \uC601\uC5ED\uC774 \uC5C6\uC5B4\uC694!",
    problem: '\uBB38\uC11C\uC5D0 <main> \uC774\uB098 role="main" \uC774 \uC5C6\uC2B5\uB2C8\uB2E4.',
    why: '\uC2A4\uD06C\uB9B0 \uB9AC\uB354\uC640 \uD0A4\uBCF4\uB4DC \uC0AC\uC6A9\uC790\uB294 "\uBCF8\uBB38\uC73C\uB85C \uBC14\uB85C \uAC00\uAE30"\uB85C \uBA54\uB274\uB97C \uAC74\uB108\uB701\uB2C8\uB2E4. main \uC774 \uC5C6\uC73C\uBA74 \uB9E4 \uD398\uC774\uC9C0\uB9C8\uB2E4 \uBA38\uB9AC\uB9D0\xB7\uBA54\uB274\uB97C \uCC98\uC74C\uBD80\uD130 \uB2E4 \uC9C0\uB098\uC57C \uBCF8\uBB38\uC5D0 \uB2FF\uC2B5\uB2C8\uB2E4. \uB208\uC73C\uB85C \uBCF4\uB294 \uC0AC\uB78C\uC774 \uB85C\uACE0\uB97C \uAC74\uB108\uB6F0\uB294 \uAC83\uACFC \uAC19\uC740 \uD3B8\uC758\uC785\uB2C8\uB2E4.',
    fix: "\uD398\uC774\uC9C0\uC758 \uD575\uC2EC \uB0B4\uC6A9\uC744 <main> \uD558\uB098\uB85C \uAC10\uC2F8\uC138\uC694(\uD398\uC774\uC9C0\uB2F9 \uD558\uB098). \uBA38\uB9AC\uB9D0\uC740 <header>, \uBA54\uB274\uB294 <nav>, \uBC14\uB2E5\uAE00\uC740 <footer> \uB97C \uC4F0\uBA74 \uB354 \uC88B\uC2B5\uB2C8\uB2E4.",
    code: "<header>\u2026</header>\n<nav>\u2026</nav>\n<main>\n  <h1>\uD398\uC774\uC9C0 \uC81C\uBAA9</h1>\n  \u2026\n</main>"
  },
  "autoplay-media": {
    category: "cognitive",
    title: "\uC18C\uB9AC\uAC00 \uB098\uB294 \uC601\uC0C1\xB7\uC624\uB514\uC624\uAC00 \uC800\uC808\uB85C \uC7AC\uC0DD\uB3FC\uC694",
    bubble: "\uC18C\uB9AC\uAC00 \uC800\uC808\uB85C \uC7AC\uC0DD\uB3FC\uC694!",
    problem: "autoplay \uC778 <video>\xB7<audio> \uC5D0 muted \uAC00 \uC5C6\uC5B4\uC11C \uD398\uC774\uC9C0\uAC00 \uC5F4\uB9AC\uBA74 \uC18C\uB9AC\uAC00 \uB0A9\uB2C8\uB2E4.",
    why: "\uC2A4\uD06C\uB9B0 \uB9AC\uB354 \uC18C\uB9AC\uC640 \uACB9\uCCD0\uC11C \uC548\uB0B4\uAC00 \uB4E4\uB9AC\uC9C0 \uC54A\uAC8C \uB418\uACE0, \uC18C\uB9AC\uB97C \uBA48\uCD94\uB294 \uBC29\uBC95\uC744 \uCC3E\uAE30 \uC804\uAE4C\uC9C0 \uD398\uC774\uC9C0\uB97C \uC4F8 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC870\uC6A9\uD55C \uACF3\uC774\uB098 \uACF5\uACF5\uC7A5\uC18C\uC5D0\uC11C\uB294 \uBAA8\uB450\uC5D0\uAC8C \uBD88\uD3B8\uD569\uB2C8\uB2E4. 3\uCD08 \uB118\uAC8C \uB098\uB294 \uC18C\uB9AC\uB294 \uBA48\uCD94\uAC70\uB098 \uB04C \uC218 \uC788\uC5B4\uC57C \uD569\uB2C8\uB2E4.",
    fix: "\uC790\uB3D9 \uC7AC\uC0DD\uC740 \uC18C\uB9AC \uC5C6\uC774(muted) \uD558\uACE0, \uC18C\uB9AC\uAC00 \uD544\uC694\uD558\uBA74 \uC0AC\uC6A9\uC790\uAC00 \uC7AC\uC0DD \uBC84\uD2BC\uC744 \uB20C\uB7EC \uC2DC\uC791\uD558\uAC8C \uD558\uC138\uC694. controls \uB97C \uB2EC\uC544 \uBA48\uCD9C \uC218 \uC788\uAC8C \uD558\uC138\uC694.",
    code: '<video autoplay muted loop playsinline controls src="/intro.mp4"></video>'
  },
  "aria-broken-ref": {
    category: "screenreader",
    title: "\uC774\uB984\uC774 \uAC00\uB9AC\uD0A4\uB294 \uACF3(id)\uC774 \uC5C6\uC5B4\uC694",
    bubble: "\uAC00\uB9AC\uD0A4\uB294 id \uAC00 \uC5C6\uC5B4\uC694!",
    problem: "aria-labelledby\xB7aria-describedby \uB610\uB294 label \uC758 for \uAC00 \uBB38\uC11C\uC5D0 \uC5C6\uB294 id \uB97C \uAC00\uB9AC\uD0B5\uB2C8\uB2E4.",
    why: "\uC774\uB984\uACFC \uC124\uBA85\uC774 \uC5F0\uACB0\uB418\uC9C0 \uC54A\uC544\uC11C \uC785\uB825\uCE78\uC774 \uC774\uB984 \uC5C6\uC774 \uC77D\uD799\uB2C8\uB2E4. id \uB97C \uBC14\uAFB8\uAC70\uB098 \uC694\uC18C\uB97C \uC9C0\uC6B0\uBA74\uC11C \uC5F0\uACB0\uC744 \uB193\uCCE4\uC744 \uB54C \uC870\uC6A9\uD788 \uC0DD\uAE30\uB294 \uBB38\uC81C\uB77C \uB208\uC73C\uB85C\uB294 \uBCF4\uC774\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
    fix: "\uAC00\uB9AC\uD0A4\uB294 id \uAC00 \uC2E4\uC81C\uB85C \uC788\uB294\uC9C0 \uD655\uC778\uD558\uACE0, \uC774\uB984\uC744 \uBC14\uAFE8\uB2E4\uBA74 \uC5F0\uACB0\uB3C4 \uAC19\uC774 \uBC14\uAFB8\uC138\uC694. \uC5F0\uACB0\uC774 \uD544\uC694 \uC5C6\uB2E4\uBA74 \uC18D\uC131\uC744 \uC9C0\uC6B0\uC138\uC694.",
    code: '<label for="email">\uC774\uBA54\uC77C</label>\n<input id="email" type="email" />   <!-- id \uAC00 \uAC19\uC544\uC57C \uC5F0\uACB0\uB429\uB2C8\uB2E4 -->'
  },
  "nested-interactive": {
    category: "keyboard",
    title: "\uBC84\uD2BC\xB7\uB9C1\uD06C \uC548\uC5D0 \uB610 \uBC84\uD2BC\xB7\uB9C1\uD06C\uAC00 \uB4E4\uC5B4 \uC788\uC5B4\uC694",
    bubble: "\uBC84\uD2BC \uC548\uC5D0 \uBC84\uD2BC\uC774 \uC788\uC5B4\uC694!",
    problem: "<a href>\xB7<button> \uC548\uC5D0 \uB2E4\uB978 \uB9C1\uD06C\xB7\uBC84\uD2BC\xB7\uC785\uB825\uCE78\uC774 \uC911\uCCA9\uB3FC \uC788\uC2B5\uB2C8\uB2E4.",
    why: "\uBCF4\uC870 \uAE30\uC220\uC774 \uC548\uCABD \uC694\uC18C\uB97C \uC77D\uC9C0 \uBABB\uD558\uAC70\uB098 \uD55C \uBC88\uC5D0 \uB450 \uAC1C\uB97C \uB204\uB978 \uAC83\uCC98\uB7FC \uB3D9\uC791\uD569\uB2C8\uB2E4. HTML \uADDC\uACA9\uC5D0\uC11C\uB3C4 \uD5C8\uC6A9\uB418\uC9C0 \uC54A\uB294 \uAD6C\uC870\uC774\uACE0, \uBE0C\uB77C\uC6B0\uC800\uB9C8\uB2E4 \uB2E4\uB974\uAC8C \uD574\uC11D\uD574\uC11C \uD0A4\uBCF4\uB4DC\xB7\uD130\uCE58\uC5D0\uC11C \uC624\uC791\uB3D9\uD569\uB2C8\uB2E4.",
    fix: "\uB450 \uAC1C\uB97C \uB098\uB780\uD788 \uB450\uACE0 CSS \uB85C \uACB9\uCCD0 \uBCF4\uC774\uAC8C \uD558\uC138\uC694. \uCE74\uB4DC \uC804\uCCB4\uB97C \uB204\uB974\uAC8C \uD558\uB824\uBA74 \uBC14\uAE65 \uB9C1\uD06C \uD558\uB098\uB9CC \uB450\uACE0 \uC548\uCABD \uB3D9\uC791\uC740 \uB530\uB85C \uBE7C\uC138\uC694.",
    code: '<!-- \u2717 --> <a href="/p"><button>\uB2F4\uAE30</button></a>\n<!-- \u2713 --> <a href="/p">\uC0C1\uD488 \uBCF4\uAE30</a> <button>\uB2F4\uAE30</button>'
  },
  "autocomplete-missing": {
    category: "cognitive",
    title: "\uC774\uB984\xB7\uC774\uBA54\uC77C\xB7\uC804\uD654 \uC785\uB825\uCE78\uC5D0 \uC790\uB3D9 \uC644\uC131(autocomplete)\uC774 \uC5C6\uC5B4\uC694",
    bubble: "\uC790\uB3D9 \uC644\uC131 \uC18D\uC131\uC774 \uC5C6\uC5B4\uC694!",
    problem: "\uC774\uBA54\uC77C\xB7\uC804\uD654\xB7\uC774\uB984\xB7\uC8FC\uC18C \uAC19\uC740 \uAC1C\uC778 \uC815\uBCF4\uB97C \uBC1B\uB294 \uC785\uB825\uCE78\uC5D0 autocomplete \uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.",
    why: "\uC190\uC774 \uBD88\uD3B8\uD558\uAC70\uB098 \uD0C0\uC774\uD551\uC774 \uC5B4\uB835\uAC70\uB098 \uAE30\uC5B5\uD558\uAE30 \uD798\uB4E0 \uC0AC\uB78C\uC774 \uC800\uC7A5\uB41C \uAC12\uC744 \uD55C \uBC88\uC5D0 \uCC44\uC6B8 \uC218 \uC788\uAC8C \uD558\uB294 \uC811\uADFC\uC131 \uAE30\uC900\uC785\uB2C8\uB2E4(WCAG 1.3.5). \uBAA8\uB450\uC5D0\uAC8C\uB3C4 \uAC00\uC785\xB7\uACB0\uC81C \uC785\uB825\uC774 \uD6E8\uC52C \uBE68\uB77C\uC9D1\uB2C8\uB2E4.",
    fix: "\uC785\uB825 \uBAA9\uC801\uC5D0 \uB9DE\uB294 autocomplete \uAC12\uC744 \uC4F0\uC138\uC694: email, tel, name, given-name, family-name, street-address, postal-code \u2026",
    code: '<input type="email" name="email" autocomplete="email" />\n<input name="phone" type="tel" autocomplete="tel" />'
  },
  "meta-refresh": {
    category: "cognitive",
    title: "\uD398\uC774\uC9C0\uAC00 \uC800\uC808\uB85C \uC0C8\uB85C\uACE0\uCE68\xB7\uC774\uB3D9\uB3FC\uC694(meta refresh)",
    bubble: "\uC800\uC808\uB85C \uC0C8\uB85C\uACE0\uCE68\uB3FC\uC694!",
    problem: '<meta http-equiv="refresh"> \uAC00 \uBA87 \uCD08 \uB4A4 \uD398\uC774\uC9C0\uB97C \uB2E4\uC2DC \uBD88\uB7EC\uC624\uAC70\uB098 \uB2E4\uB978 \uACF3\uC73C\uB85C \uBCF4\uB0C5\uB2C8\uB2E4.',
    why: "\uB0B4\uC6A9\uC744 \uCC9C\uCC9C\uD788 \uC77D\uB294 \uC0AC\uB78C, \uC2A4\uD06C\uB9B0 \uB9AC\uB354 \uC0AC\uC6A9\uC790, \uD0A4\uBCF4\uB4DC\uB85C \uC774\uB3D9\uD558\uB294 \uC0AC\uB78C\uC740 \uC2DC\uAC04\uC774 \uB2E4 \uB418\uAE30 \uC804\uC5D0 \uB05D\uB0B4\uC9C0 \uBABB\uD558\uACE0 \uC77D\uB358 \uC790\uB9AC\uC5D0\uC11C \uCAD3\uACA8\uB0A9\uB2C8\uB2E4. \uC2DC\uAC04 \uC81C\uD55C\uC740 \uBA48\uCD94\uAC70\uB098 \uB298\uB9B4 \uC218 \uC788\uC5B4\uC57C \uD569\uB2C8\uB2E4.",
    fix: "\uC790\uB3D9 \uC774\uB3D9 \uB300\uC2E0 \uB9C1\uD06C\uB098 \uBC84\uD2BC\uC744 \uB450\uACE0 \uC0AC\uC6A9\uC790\uAC00 \uC9C1\uC811 \uC774\uB3D9\uD558\uAC8C \uD558\uC138\uC694. \uC989\uC2DC \uC774\uB3D9(0\uCD08)\uC774 \uD544\uC694\uD558\uBA74 \uC11C\uBC84 \uB9AC\uB2E4\uC774\uB809\uD2B8(301/302)\uB97C \uC4F0\uC138\uC694.",
    code: '<!-- \u2717 --> <meta http-equiv="refresh" content="5; url=/home">\n<!-- \u2713 --> <a href="/home">\uD648\uC73C\uB85C \uC774\uB3D9</a>'
  },
  "focus-outline": {
    category: "keyboard",
    title: "\uD3EC\uCEE4\uC2A4 \uD45C\uC2DC\uB97C \uC5C6\uC560 \uB193\uACE0 \uB300\uC2E0\uD558\uB294 \uD45C\uC2DC\uAC00 \uC5C6\uC5B4\uC694",
    bubble: "\uD3EC\uCEE4\uC2A4 \uD45C\uC2DC\uAC00 \uC0AC\uB77C\uC84C\uC5B4\uC694!",
    problem: "CSS \uC5D0\uC11C :focus \uC77C \uB54C outline \uC744 none/0 \uC73C\uB85C \uC9C0\uC6E0\uB294\uB370, \uD14C\uB450\uB9AC\xB7\uADF8\uB9BC\uC790\xB7\uBC30\uACBD \uAC19\uC740 \uB300\uCCB4 \uD45C\uC2DC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.",
    why: "\uD0A4\uBCF4\uB4DC\uB85C \uC774\uB3D9\uD558\uB294 \uC0AC\uB78C\uC740 \uC9C0\uAE08 \uD3EC\uCEE4\uC2A4\uAC00 \uC5B4\uB514\uC5D0 \uC788\uB294\uC9C0 \uBCF4\uC5EC \uC8FC\uB294 \uD14C\uB450\uB9AC\uAC00 \uC720\uC77C\uD55C \uAE38\uC7A1\uC774\uC785\uB2C8\uB2E4. \uC774\uAC83\uC744 \uC9C0\uC6B0\uBA74 Tab \uC744 \uB20C\uB7EC\uB3C4 \uD654\uBA74\uC758 \uC5B4\uB514\uAC00 \uC120\uD0DD\uB410\uB294\uC9C0 \uC54C \uC218 \uC5C6\uC5B4 \uAE38\uC744 \uC783\uC2B5\uB2C8\uB2E4(WCAG 2.4.7). \uB514\uC790\uC778\uC774 \uD22C\uBC15\uD574 \uBCF4\uC778\uB2E4\uACE0 \uC9C0\uC6B0\uB294 \uACBD\uC6B0\uAC00 \uB9CE\uC2B5\uB2C8\uB2E4.",
    fix: "outline \uC744 \uC9C0\uC6B0\uC9C0 \uB9D0\uACE0 \uB514\uC790\uC778\uC5D0 \uB9DE\uAC8C \uBC14\uAFB8\uC138\uC694. \uB9C8\uC6B0\uC2A4 \uD074\uB9AD\uC5D0\uB294 \uC548 \uBCF4\uC774\uACE0 \uD0A4\uBCF4\uB4DC\uC5D0\uB9CC \uBCF4\uC774\uAC8C \uD558\uB824\uBA74 :focus-visible \uC744 \uC4F0\uC138\uC694. \uB300\uBE44\uB294 \uC8FC\uBCC0\uACFC 3:1 \uC774\uC0C1\uC774 \uC88B\uC2B5\uB2C8\uB2E4.",
    code: ":focus-visible {\n  outline: 3px solid #2563eb;\n  outline-offset: 2px;\n}\n/* \u2717 */ button:focus { outline: none; }"
  },
  "role-no-focus": {
    category: "keyboard",
    title: "role \uC740 \uBC84\uD2BC\uC778\uB370 \uD0A4\uBCF4\uB4DC\uB85C \uAC08 \uC218 \uC5C6\uC5B4\uC694",
    bubble: "role \uC740 \uC788\uB294\uB370 Tab \uC774 \uC548 \uB3FC\uC694!",
    problem: 'div\xB7span \uC5D0 role="button"(link\xB7checkbox\xB7switch \uB4F1)\uC744 \uC92C\uC9C0\uB9CC tabindex \uAC00 \uC5C6\uC5B4\uC11C Tab \uD0A4\uB85C \uD3EC\uCEE4\uC2A4\uAC00 \uAC00\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.',
    why: 'role \uC740 "\uC774\uAC83\uC740 \uBC84\uD2BC\uC774\uC5D0\uC694"\uB77C\uACE0 \uC77D\uC5B4 \uC8FC\uAE30\uB9CC \uD560 \uBFD0 \uD0A4\uBCF4\uB4DC \uB3D9\uC791\uC740 \uB9CC\uB4E4\uC5B4 \uC8FC\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uC2A4\uD06C\uB9B0 \uB9AC\uB354\uB294 \uBC84\uD2BC\uC774\uB77C\uACE0 \uC77D\uB294\uB370 \uD0A4\uBCF4\uB4DC\uB85C\uB294 \uB204\uB97C \uC218\uB3C4 \uC5C6\uB294 \uBAA8\uC21C\uC774 \uC0DD\uAE41\uB2C8\uB2E4. \uC9C1\uC811 Enter\xB7Space \uCC98\uB9AC\uAE4C\uC9C0 \uD574 \uC918\uC57C \uD558\uB294 \uC77C\uC774 \uB9CE\uC544\uC838\uC11C \uC704\uD5D8\uD569\uB2C8\uB2E4.',
    fix: '\uAC00\uB2A5\uD558\uBA74 \uC9C4\uC9DC <button>\xB7<a> \uB97C \uC4F0\uC138\uC694. \uAF2D div \uC5EC\uC57C \uD558\uBA74 tabindex="0" \uACFC Enter\xB7Space \uD0A4 \uCC98\uB9AC\uB97C \uD568\uAED8 \uB123\uC73C\uC138\uC694.',
    code: '<!-- \u2717 --> <div role="button" onclick="save()">\uC800\uC7A5</div>\n<!-- \u2713 --> <button type="button" onclick="save()">\uC800\uC7A5</button>'
  },
  "scroll-no-focus": {
    category: "keyboard",
    title: "\uC2A4\uD06C\uB864\uB418\uB294 \uC601\uC5ED\uC744 \uD0A4\uBCF4\uB4DC\uB85C \uC6C0\uC9C1\uC77C \uC218 \uC5C6\uC5B4\uC694",
    bubble: "\uC2A4\uD06C\uB864 \uC601\uC5ED\uC5D0 Tab \uC774 \uC548 \uAC00\uC694!",
    problem: "\uB0B4\uC6A9\uC774 \uB118\uCCD0\uC11C \uC2A4\uD06C\uB864\uB418\uB294 \uC601\uC5ED\uC778\uB370 \uC548\uC5D0 \uD3EC\uCEE4\uC2A4\uAC00 \uAC08 \uC218 \uC788\uB294 \uC694\uC18C\uB3C4 tabindex \uB3C4 \uC5C6\uC2B5\uB2C8\uB2E4.",
    why: "\uB9C8\uC6B0\uC2A4 \uD720\uC744 \uC4F8 \uC218 \uC5C6\uB294 \uC0AC\uB78C\uC740 \uD3EC\uCEE4\uC2A4\uB97C \uC601\uC5ED\uC5D0 \uB450\uACE0 \uD654\uC0B4\uD45C\xB7PageDown \uC73C\uB85C \uC2A4\uD06C\uB864\uD569\uB2C8\uB2E4. \uC601\uC5ED\uC774 \uD3EC\uCEE4\uC2A4\uB97C \uBABB \uBC1B\uC73C\uBA74 \uB118\uCE5C \uB0B4\uC6A9\uC744 \uC601\uC601 \uBCFC \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uCF54\uB4DC \uBE14\uB85D\xB7\uD45C\xB7\uCC44\uD305 \uBAA9\uB85D\uC5D0\uC11C \uC790\uC8FC \uC0DD\uAE41\uB2C8\uB2E4.",
    fix: '\uC2A4\uD06C\uB864 \uC601\uC5ED\uC5D0 tabindex="0" \uC744 \uC8FC\uACE0 role \uACFC \uC774\uB984(aria-label)\uC744 \uBD99\uC774\uC138\uC694. \uC548\uC5D0 \uB9C1\uD06C\xB7\uBC84\uD2BC\uC774 \uC788\uC73C\uBA74 \uADF8\uCABD\uC73C\uB85C \uCDA9\uBD84\uD569\uB2C8\uB2E4.',
    code: '<div tabindex="0" role="region" aria-label="\uC8FC\uBB38 \uB0B4\uC5ED" style="overflow:auto; height:200px">\u2026</div>'
  },
  "fake-link": {
    category: "keyboard",
    title: '\uC774\uB3D9\uD558\uC9C0 \uC54A\uB294 \uAC00\uC9DC \uB9C1\uD06C\uC608\uC694 (href="#")',
    bubble: "\uAC00\uC9DC \uB9C1\uD06C\uAC00 \uC788\uC5B4\uC694!",
    problem: '<a href="#"> \uB610\uB294 href="javascript:\u2026" \uB9C1\uD06C\uB77C\uC11C \uB20C\uB7EC\uB3C4 \uB2E4\uB978 \uD398\uC774\uC9C0\uB85C \uC774\uB3D9\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.',
    why: '\uC2A4\uD06C\uB9B0 \uB9AC\uB354\uB294 "\uB9C1\uD06C"\uB77C\uACE0 \uC77D\uB294\uB370 \uC2E4\uC81C\uB85C\uB294 \uB3D9\uC791\uC744 \uC2E4\uD589\uD558\uB294 \uBC84\uD2BC\uC774\uB77C \uAE30\uB300\uC640 \uB2E4\uB985\uB2C8\uB2E4. \uD0A4\uBCF4\uB4DC\uC5D0\uC11C\uB3C4 Space \uAC00 \uC548 \uBA39\uACE0, \uB204\uB974\uBA74 \uD398\uC774\uC9C0 \uB9E8 \uC704\uB85C \uD280\uAE30\uB3C4 \uD569\uB2C8\uB2E4. \uC911\uAC04 \uD074\uB9AD\xB7\uC0C8 \uD0ED \uC5F4\uAE30\uB3C4 \uC774\uC0C1\uD558\uAC8C \uB3D9\uC791\uD569\uB2C8\uB2E4.',
    fix: '\uC774\uB3D9\uC774 \uC544\uB2C8\uB77C \uB3D9\uC791\uC774\uBA74 <button type="button"> \uC744 \uC4F0\uC138\uC694. \uC774\uB3D9\uC774\uBA74 \uC9C4\uC9DC \uC8FC\uC18C\uB97C href \uC5D0 \uC4F0\uC138\uC694.',
    code: '<!-- \u2717 --> <a href="#" onclick="openMenu()">\uBA54\uB274</a>\n<!-- \u2713 --> <button type="button" onclick="openMenu()">\uBA54\uB274</button>'
  },
  "link-color-only": {
    category: "vision",
    title: "\uAE00 \uC18D \uB9C1\uD06C\uAC00 \uC0C9\uAE54\uB85C\uB9CC \uAD6C\uBD84\uB3FC\uC694",
    bubble: "\uB9C1\uD06C\uAC00 \uC0C9\uC73C\uB85C\uB9CC \uAD6C\uBD84\uB3FC\uC694!",
    problem: "\uBB38\uC7A5 \uC548\uC758 \uB9C1\uD06C\uAC00 \uBC11\uC904\xB7\uAD75\uAE30 \uAC19\uC740 \uB2E4\uB978 \uD45C\uC2DC \uC5C6\uC774, \uC8FC\uBCC0 \uAE00\uC790\uC640 3:1 \uBCF4\uB2E4 \uBE44\uC2B7\uD55C \uC0C9\uC73C\uB85C\uB9CC \uAD6C\uBD84\uB429\uB2C8\uB2E4.",
    why: "\uC0C9\uC57D\xB7\uC0C9\uB9F9\uC774 \uC788\uB294 \uC0AC\uB78C\uC774\uB098 \uD751\uBC31 \uD654\uBA74, \uD587\uBE5B \uC544\uB798 \uD654\uBA74\uC5D0\uC11C\uB294 \uB9C1\uD06C\uAC00 \uC77C\uBC18 \uAE00\uC790\uC640 \uB611\uAC19\uC544 \uBCF4\uC785\uB2C8\uB2E4. \uC0C9\uB9CC\uC73C\uB85C \uC815\uBCF4\uB97C \uC804\uB2EC\uD558\uBA74 \uC548 \uB41C\uB2E4\uB294 \uAE30\uC900\uC785\uB2C8\uB2E4(WCAG 1.4.1).",
    fix: "\uB9C1\uD06C\uC5D0 \uBC11\uC904\uC744 \uC720\uC9C0\uD558\uC138\uC694(\uAE30\uBCF8\uAC12\uC785\uB2C8\uB2E4). \uBC11\uC904\uC744 \uC5C6\uC574\uB2E4\uBA74 \uAD75\uAE30\xB7\uD14C\uB450\uB9AC \uAC19\uC740 \uB450 \uBC88\uC9F8 \uB2E8\uC11C\uB97C \uC8FC\uAC70\uB098, \uC0C9 \uB300\uBE44\uB97C \uC8FC\uBCC0 \uAE00\uC790\uC640 3:1 \uC774\uC0C1\uC73C\uB85C \uB9CC\uB4DC\uC138\uC694.",
    code: "a { text-decoration: underline; }\n/* \uBB38\uC7A5 \uC18D \uB9C1\uD06C\uC5D0\uB294 \uBC11\uC904\uC774 \uAC00\uC7A5 \uD655\uC2E4\uD569\uB2C8\uB2E4 */"
  },
  "text-small": {
    category: "vision",
    title: "\uAE00\uC790\uAC00 \uB108\uBB34 \uC791\uC544\uC694 (12px \uBBF8\uB9CC)",
    bubble: "\uAE00\uC790\uAC00 \uB108\uBB34 \uC791\uC544\uC694!",
    problem: "\uD654\uBA74\uC5D0 \uBCF4\uC774\uB294 \uAE00\uC790\uC758 \uD06C\uAE30\uAC00 12px \uBCF4\uB2E4 \uC791\uC2B5\uB2C8\uB2E4.",
    why: "\uC800\uC2DC\uB825 \uC0AC\uC6A9\uC790\uC640 \uB098\uC774\uAC00 \uB4E0 \uC0AC\uC6A9\uC790\uB294 \uC791\uC740 \uAE00\uC790\uB97C \uC77D\uAE30 \uC5B4\uB835\uACE0, \uBAA8\uBC14\uC77C\uC5D0\uC11C\uB294 \uB354 \uC2EC\uD569\uB2C8\uB2E4. \uC791\uC740 \uAE00\uC790\uC5D0 \uC5F0\uD55C \uC0C9\uAE4C\uC9C0 \uACB9\uCE58\uBA74 \uC0AC\uC2E4\uC0C1 \uC77D\uC744 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uBE0C\uB77C\uC6B0\uC800 \uD655\uB300\uB97C \uB9C9\uC544 \uB450\uC5C8\uB2E4\uBA74 \uB354 \uD070 \uBB38\uC81C\uC785\uB2C8\uB2E4.",
    fix: "\uBCF8\uBB38\uC740 16px(1rem) \uC548\uD30E, \uBCF4\uC870 \uAE00\uC790\uB3C4 12px \uC774\uC0C1\uC73C\uB85C \uD558\uC138\uC694. px \uB300\uC2E0 rem \uC744 \uC4F0\uBA74 \uC0AC\uC6A9\uC790\uAC00 \uC815\uD55C \uAE30\uBCF8 \uAE00\uC790 \uD06C\uAE30\uB97C \uB530\uB77C\uAC11\uB2C8\uB2E4.",
    code: "body { font-size: 1rem; }\n.caption { font-size: 0.8125rem; } /* 13px */"
  },
  "reduced-motion": {
    category: "cognitive",
    title: '\uACC4\uC18D \uC6C0\uC9C1\uC774\uB294 \uD6A8\uACFC\uC778\uB370 "\uC6C0\uC9C1\uC784 \uC904\uC774\uAE30" \uC124\uC815\uC744 \uC9C0\uCF1C \uC8FC\uC9C0 \uC54A\uC544\uC694',
    bubble: "\uC6C0\uC9C1\uC784 \uC904\uC774\uAE30\uAC00 \uC5C6\uC5B4\uC694!",
    problem: "\uBB34\uD55C \uBC18\uBCF5(infinite) \uC560\uB2C8\uBA54\uC774\uC158\uC774 \uC788\uB294\uB370 prefers-reduced-motion \uCC98\uB9AC\uAC00 CSS \uC5B4\uB514\uC5D0\uB3C4 \uC5C6\uC2B5\uB2C8\uB2E4.",
    why: '\uC6C0\uC9C1\uC784\uC5D0 \uBBFC\uAC10\uD55C \uC0AC\uB78C(\uC5B4\uC9C0\uB7FC\uC99D\xB7\uBA40\uBBF8\xB7\uC9D1\uC911\uC7A5\uC560)\uC740 \uC6B4\uC601\uCCB4\uC81C\uC5D0\uC11C "\uC6C0\uC9C1\uC784 \uC904\uC774\uAE30"\uB97C \uCF2D\uB2C8\uB2E4. \uC774 \uC124\uC815\uC744 \uBB34\uC2DC\uD558\uBA74 \uACC4\uC18D \uD754\uB4E4\uB9AC\uB294 \uD654\uBA74 \uB54C\uBB38\uC5D0 \uD398\uC774\uC9C0\uB97C \uBCF4\uAE30 \uC5B4\uB835\uAC70\uB098 \uBAB8\uC774 \uC544\uD508 \uC0AC\uB78C\uC774 \uC788\uC2B5\uB2C8\uB2E4(WCAG 2.3.3).',
    fix: "@media (prefers-reduced-motion: reduce) \uC548\uC5D0\uC11C \uC560\uB2C8\uBA54\uC774\uC158\uC744 \uB044\uAC70\uB098 \uC544\uC8FC \uC57D\uD558\uAC8C \uD558\uC138\uC694.",
    code: "@media (prefers-reduced-motion: reduce) {\n  * { animation: none !important; transition: none !important; }\n}"
  },
  "role-img-alt": {
    category: "screenreader",
    title: 'role="img" \uC778 \uC694\uC18C\uC5D0 \uC124\uBA85\uC774 \uC5C6\uC5B4\uC694',
    bubble: 'role="img" \uC5D0 \uC774\uB984\uC774 \uC5C6\uC5B4\uC694!',
    problem: 'role="img"(\uC544\uC774\uCF58 svg\xB7CSS \uADF8\uB9BC \uB4F1)\uC778\uB370 aria-label\xB7aria-labelledby\xB7title \uC774 \uC5C6\uC2B5\uB2C8\uB2E4.',
    why: '\uC2A4\uD06C\uB9B0 \uB9AC\uB354\uB294 "\uC774\uBBF8\uC9C0"\uB77C\uACE0\uB9CC \uC77D\uACE0 \uBB34\uC5C7\uC778\uC9C0 \uC54C\uB824 \uC8FC\uC9C0 \uBABB\uD569\uB2C8\uB2E4. img \uD0DC\uADF8\uAC00 \uC544\uB2C8\uB77C\uC11C alt \uAC80\uC0AC\uC5D0\uB3C4 \uAC78\uB9AC\uC9C0 \uC54A\uC544 \uB193\uCE58\uAE30 \uC27D\uC2B5\uB2C8\uB2E4.',
    fix: '\uC758\uBBF8\uAC00 \uC788\uC73C\uBA74 aria-label \uB85C \uC124\uBA85\uD558\uACE0, \uC7A5\uC2DD\uC774\uBA74 role="img" \uB97C \uBE7C\uACE0 aria-hidden="true" \uB97C \uC4F0\uC138\uC694.',
    code: '<svg role="img" aria-label="\uAC80\uC0C9"><use href="#icon-search" /></svg>\n<svg aria-hidden="true">\u2026</svg> <!-- \uC7A5\uC2DD -->'
  },
  "html-lang-valid": {
    category: "screenreader",
    title: "html lang \uAC12\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC544\uC694",
    bubble: "lang \uAC12\uC774 \uC774\uC0C1\uD574\uC694!",
    problem: '<html lang> \uAC12\uC774 ko, en-US \uAC19\uC740 \uC62C\uBC14\uB978 \uC5B8\uC5B4 \uCF54\uB4DC\uAC00 \uC544\uB2D9\uB2C8\uB2E4(\uC608: "korean", "kr").',
    why: "\uC2A4\uD06C\uB9B0 \uB9AC\uB354\uB294 lang \uC73C\uB85C \uC77D\uB294 \uBC1C\uC74C \uADDC\uCE59\uC744 \uACE0\uB985\uB2C8\uB2E4. \uD2C0\uB9B0 \uAC12\uC774\uBA74 \uD55C\uAD6D\uC5B4 \uBB38\uC11C\uB97C \uC601\uC5B4 \uBC1C\uC74C\uC73C\uB85C \uC77D\uB294 \uB4F1 \uC5C9\uB6B1\uD558\uAC8C \uB4E4\uB9BD\uB2C8\uB2E4. \uBC88\uC5ED \uB3C4\uAD6C\uC640 \uAC80\uC0C9\uC5D4\uC9C4\uB3C4 \uC774 \uAC12\uC744 \uCC38\uACE0\uD569\uB2C8\uB2E4.",
    fix: "ISO \uC5B8\uC5B4 \uCF54\uB4DC\uB97C \uC4F0\uC138\uC694: \uD55C\uAD6D\uC5B4 ko, \uC601\uC5B4 en, \uBBF8\uAD6D \uC601\uC5B4 en-US.",
    code: '<html lang="ko">   <!-- \u2717 lang="korean" / lang="kr" -->'
  },
  "video-captions": {
    category: "hearing",
    title: "\uC601\uC0C1\uC5D0 \uC790\uB9C9\uC774 \uC5C6\uC5B4\uC694",
    bubble: "\uC601\uC0C1\uC5D0 \uC790\uB9C9\uC774 \uC5C6\uC5B4\uC694!",
    problem: '<video> \uC5D0 <track kind="captions">(\uB610\uB294 subtitles)\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. (\uC18C\uB9AC \uC5C6\uC774 \uC790\uB3D9 \uC7AC\uC0DD\uB418\uB294 \uC7A5\uC2DD\uC6A9 \uC601\uC0C1\uC740 \uC81C\uC678)',
    why: "\uC18C\uB9AC\uB97C \uBABB \uB4E3\uB294 \uC0AC\uB78C, \uC18C\uB9AC\uB97C \uCF24 \uC218 \uC5C6\uB294 \uC7A5\uC18C(\uC9C0\uD558\uCCA0\xB7\uB3C4\uC11C\uAD00)\uC5D0\uC11C \uC601\uC0C1\uC744 \uBCF4\uB294 \uC0AC\uB78C\uC740 \uB0B4\uC6A9\uC744 \uC54C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC790\uB9C9\uC740 \uC678\uAD6D\uC5B4 \uD559\uC2B5\uC790\uC640 \uC2DC\uB044\uB7EC\uC6B4 \uACF3\uC5D0\uC11C\uB3C4 \uB3C4\uC6C0\uC774 \uB429\uB2C8\uB2E4(WCAG 1.2.2).",
    fix: "WebVTT \uC790\uB9C9 \uD30C\uC77C\uC744 \uB9CC\uB4E4\uC5B4 <track> \uC73C\uB85C \uBD99\uC774\uC138\uC694. \uB9D0\uC18C\uB9AC\uBFD0 \uC544\uB2C8\uB77C \uC911\uC694\uD55C \uC18C\uB9AC(\uBC15\uC218\xB7\uACBD\uACE0\uC74C)\uB3C4 \uC801\uC73C\uBA74 \uC88B\uC2B5\uB2C8\uB2E4.",
    code: '<video controls src="/intro.mp4">\n  <track kind="captions" src="/intro.ko.vtt" srclang="ko" label="\uD55C\uAD6D\uC5B4" default />\n</video>'
  },
  "img-dimensions": {
    category: "perf",
    title: "\uC774\uBBF8\uC9C0\uC5D0 \uAC00\uB85C\xB7\uC138\uB85C \uD06C\uAE30\uAC00 \uC5C6\uC5B4\uC694",
    bubble: "\uC774\uBBF8\uC9C0 \uD06C\uAE30\uB97C \uC548 \uC54C\uB824 \uC92C\uC5B4\uC694!",
    problem: "<img> \uC5D0 width\xB7height \uC18D\uC131\uB3C4 aspect-ratio \uB3C4 \uC5C6\uC2B5\uB2C8\uB2E4.",
    why: "\uC774\uBBF8\uC9C0\uAC00 \uB2A6\uAC8C \uB3C4\uCC29\uD558\uBA74 \uADF8\uC81C\uC57C \uC790\uB9AC\uAC00 \uC0DD\uACA8\uC11C \uC544\uB798 \uB0B4\uC6A9\uC774 \uD655 \uBC00\uB824\uB0A9\uB2C8\uB2E4(CLS). \uC77D\uB2E4\uAC00 \uAE00\uC790\uAC00 \uBC00\uB824 \uC5C9\uB6B1\uD55C \uBC84\uD2BC\uC744 \uB204\uB974\uAE30\uB3C4 \uD569\uB2C8\uB2E4.",
    fix: "width\xB7height \uC18D\uC131\uC744 \uC774\uBBF8\uC9C0\uC758 \uC2E4\uC81C \uBE44\uC728\uB85C \uC801\uC5B4 \uB450\uAC70\uB098 CSS aspect-ratio \uB85C \uC790\uB9AC\uB97C \uBBF8\uB9AC \uC7A1\uC73C\uC138\uC694.",
    code: '<img src="/a.webp" width="800" height="450" alt="..." />\n/* \uB610\uB294 */ img { aspect-ratio: 16 / 9; }'
  },
  "img-lazy-below-fold": {
    category: "perf",
    title: "\uD654\uBA74 \uC544\uB798 \uC774\uBBF8\uC9C0\uB97C \uBBF8\uB9AC \uB2E4 \uBC1B\uC544\uC694",
    bubble: "\uC544\uB798 \uC774\uBBF8\uC9C0\uC5D0 lazy \uAC00 \uC5C6\uC5B4\uC694!",
    problem: '\uCCAB \uD654\uBA74\uBCF4\uB2E4 \uD55C\uCC38 \uC544\uB798\uC5D0 \uC788\uB294 \uC774\uBBF8\uC9C0\uC5D0 loading="lazy" \uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.',
    why: "\uC544\uC9C1 \uBCF4\uC774\uC9C0\uB3C4 \uC54A\uB294 \uC774\uBBF8\uC9C0\uAE4C\uC9C0 \uD55C\uAEBC\uBC88\uC5D0 \uB0B4\uB824\uBC1B\uC544\uC11C \uCCAB \uB85C\uB529\uC774 \uB290\uB824\uC9C0\uACE0 \uB370\uC774\uD130\uAC00 \uB0AD\uBE44\uB429\uB2C8\uB2E4.",
    fix: '\uCCAB \uD654\uBA74 \uC544\uB798 \uC774\uBBF8\uC9C0\uC5D0\uB294 loading="lazy" \uB97C \uBD99\uC774\uC138\uC694. \uB2E8, \uCCAB \uD654\uBA74\uC758 \uD070 \uC774\uBBF8\uC9C0\uC5D0\uB294 \uC4F0\uC9C0 \uB9C8\uC138\uC694.',
    code: '<img src="/card.webp" loading="lazy" width="400" height="300" alt="..." />'
  },
  "render-blocking-script": {
    category: "perf",
    title: "\uC2A4\uD06C\uB9BD\uD2B8\uAC00 \uD654\uBA74 \uADF8\uB9AC\uAE30\uB97C \uB9C9\uACE0 \uC788\uC5B4\uC694",
    bubble: "\uC2A4\uD06C\uB9BD\uD2B8\uAC00 \uD654\uBA74\uC744 \uB9C9\uC544\uC694!",
    problem: '<head> \uC758 <script src> \uC5D0 async\xB7defer\xB7type="module" \uC774 \uC5C6\uC2B5\uB2C8\uB2E4.',
    why: "\uBE0C\uB77C\uC6B0\uC800\uAC00 \uC2A4\uD06C\uB9BD\uD2B8\uB97C \uB0B4\uB824\uBC1B\uACE0 \uC2E4\uD589\uD558\uB294 \uB3D9\uC548 HTML \uC744 \uC77D\uC9C0 \uBABB\uD574\uC11C \uD654\uBA74\uC774 \uB2A6\uAC8C \uB098\uD0C0\uB0A9\uB2C8\uB2E4.",
    fix: "\uB300\uBD80\uBD84 defer \uB97C \uBD99\uC774\uBA74 \uB429\uB2C8\uB2E4. \uC21C\uC11C\uC640 \uC0C1\uAD00\uC5C6\uB294 \uBD84\uC11D \uC2A4\uD06C\uB9BD\uD2B8\uB294 async \uB3C4 \uC88B\uC544\uC694.",
    code: '<script src="/app.js" defer></script>'
  },
  "font-display-missing": {
    category: "perf",
    title: "\uC6F9\uD3F0\uD2B8\uC5D0 font-display \uAC00 \uC5C6\uC5B4\uC694",
    bubble: "font-display \uAC00 \uC5C6\uC5B4\uC694!",
    problem: "@font-face \uADDC\uCE59\uC5D0 font-display \uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.",
    why: "\uD3F0\uD2B8\uAC00 \uC624\uAE30 \uC804\uAE4C\uC9C0 \uAE00\uC790\uAC00 \uC548 \uBCF4\uC774\uAC70\uB098(FOIT) \uD55C\uCC38 \uB4A4\uC5D0 \uBC14\uB00C\uC5B4 \uD654\uBA74\uC774 \uD754\uB4E4\uB9BD\uB2C8\uB2E4.",
    fix: "font-display: swap \uC73C\uB85C \uBA3C\uC800 \uAE30\uBCF8 \uAE00\uAF34\uC744 \uBCF4\uC5EC \uC8FC\uACE0, \uD3F0\uD2B8\uAC00 \uC624\uBA74 \uBC14\uAFB8\uC138\uC694.",
    code: '@font-face {\n  font-family: "Pretendard";\n  src: url(/p.woff2) format("woff2");\n  font-display: swap;\n}'
  },
  "large-dom": {
    category: "perf",
    title: "\uD654\uBA74 \uC694\uC18C(DOM)\uAC00 \uB108\uBB34 \uB9CE\uC544\uC694",
    bubble: "\uC694\uC18C\uAC00 \uB108\uBB34 \uB9CE\uC544\uC694!",
    problem: "\uD398\uC774\uC9C0\uC5D0 DOM \uC694\uC18C\uAC00 1,500\uAC1C\uB97C \uB118\uC2B5\uB2C8\uB2E4.",
    why: "\uC694\uC18C\uAC00 \uB9CE\uC744\uC218\uB85D \uCC98\uC74C \uADF8\uB9AC\uAE30, \uC2A4\uD0C0\uC77C \uACC4\uC0B0, \uC2A4\uD06C\uB864\xB7\uC785\uB825 \uBC18\uC751\uC774 \uB290\uB824\uC9C0\uACE0 \uBA54\uBAA8\uB9AC\uB97C \uB9CE\uC774 \uC501\uB2C8\uB2E4.",
    fix: "\uAE34 \uBAA9\uB85D\uC740 \uAC00\uC0C1 \uC2A4\uD06C\uB864\uB85C, \uC548 \uBCF4\uC774\uB294 \uBD80\uBD84\uC740 \uB098\uC911\uC5D0 \uADF8\uB9AC\uACE0, \uC4F8\uB370\uC5C6\uC774 \uACB9\uCE5C \uB798\uD37C div \uB97C \uC904\uC774\uC138\uC694.",
    code: "<FixedSizeList height={400} itemCount={10000} itemSize={36}>{Row}</FixedSizeList>"
  },
  "multiple-h1": {
    category: "seo",
    title: "h1 \uC774 \uC5EC\uB7EC \uAC1C\uC608\uC694",
    bubble: "h1 \uC774 \uB458 \uC774\uC0C1\uC774\uC5D0\uC694!",
    problem: "\uD55C \uD398\uC774\uC9C0\uC5D0 h1 \uC774 \uB458 \uC774\uC0C1 \uBCF4\uC785\uB2C8\uB2E4.",
    why: "h1 \uC740 \uD398\uC774\uC9C0\uC758 \uAC00\uC7A5 \uD070 \uC8FC\uC81C\uC785\uB2C8\uB2E4. \uC5EC\uB7EC \uAC1C\uBA74 \uAC80\uC0C9\uC5D4\uC9C4\uACFC \uC2A4\uD06C\uB9B0 \uB9AC\uB354\uAC00 \uBB34\uC5C7\uC774 \uD575\uC2EC\uC778\uC9C0 \uC54C\uAE30 \uC5B4\uB835\uC2B5\uB2C8\uB2E4.",
    fix: "\uD398\uC774\uC9C0\uB2F9 h1 \uC740 \uD558\uB098\uB9CC \uC4F0\uACE0, \uB098\uBA38\uC9C0\uB294 h2 \uC774\uD558\uB85C \uAD6C\uC870\uB97C \uC7A1\uC73C\uC138\uC694.",
    code: "<h1>\uC8FC\uBB38 \uB0B4\uC5ED</h1>\n  <h2>\uBC30\uC1A1 \uC911</h2>\n  <h2>\uBC30\uC1A1 \uC644\uB8CC</h2>"
  },
  "og-missing": {
    category: "seo",
    title: "\uB9C1\uD06C \uBBF8\uB9AC\uBCF4\uAE30(og \uD0DC\uADF8)\uAC00 \uC5C6\uC5B4\uC694",
    bubble: "\uB9C1\uD06C \uBBF8\uB9AC\uBCF4\uAE30\uAC00 \uC5C6\uC5B4\uC694!",
    problem: "og:title \uB610\uB294 og:image \uBA54\uD0C0 \uD0DC\uADF8\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.",
    why: "\uCE74\uCE74\uC624\uD1A1\xB7\uC2AC\uB799\xB7SNS \uC5D0 \uC8FC\uC18C\uB97C \uBD99\uC600\uC744 \uB54C \uC81C\uBAA9\xB7\uC774\uBBF8\uC9C0\uAC00 \uC5C9\uB6B1\uD558\uAC70\uB098 \uBE48 \uCE74\uB4DC\uAC00 \uB098\uC635\uB2C8\uB2E4.",
    fix: "og:title, og:description, og:image \uB97C \uD398\uC774\uC9C0\uB9C8\uB2E4 \uB123\uC73C\uC138\uC694(\uC774\uBBF8\uC9C0\uB294 \uC808\uB300 \uC8FC\uC18C).",
    code: '<meta property="og:title" content="\uC81C\uBAA9" />\n<meta property="og:image" content="https://example.com/thumb.png" />'
  },
  "mixed-content": {
    category: "security",
    title: "https \uD398\uC774\uC9C0\uC5D0\uC11C http \uC790\uC6D0\uC744 \uBD88\uB7EC\uC640\uC694",
    bubble: "http \uC790\uC6D0\uC774 \uC11E\uC5EC \uC788\uC5B4\uC694!",
    problem: "https \uD398\uC774\uC9C0\uAC00 http:// \uC8FC\uC18C\uC758 \uC774\uBBF8\uC9C0\xB7\uC2A4\uD06C\uB9BD\uD2B8\xB7\uC2A4\uD0C0\uC77C\xB7\uD504\uB808\uC784\uC744 \uBD88\uB7EC\uC635\uB2C8\uB2E4.",
    why: "\uC554\uD638\uD654\uB418\uC9C0 \uC54A\uC740 \uC790\uC6D0\uC740 \uC911\uAC04\uC5D0\uC11C \uBC14\uB014 \uC218 \uC788\uC5B4\uC11C \uBE0C\uB77C\uC6B0\uC800\uAC00 \uB9C9\uAC70\uB098 \uACBD\uACE0\uD569\uB2C8\uB2E4. \uC2A4\uD06C\uB9BD\uD2B8\uAC00 \uBC14\uB00C\uBA74 \uC0AC\uC774\uD2B8 \uC804\uCCB4\uAC00 \uC704\uD5D8\uD574\uC9D1\uB2C8\uB2E4.",
    fix: "\uC790\uC6D0 \uC8FC\uC18C\uB97C https:// \uB85C \uBC14\uAFB8\uC138\uC694. \uC9C0\uC6D0\uD558\uC9C0 \uC54A\uB294 \uC11C\uBC84\uC758 \uC790\uC6D0\uC740 \uB2E4\uB978 \uACF3\uC744 \uC4F0\uC138\uC694.",
    code: '<script src="https://cdn.example.com/lib.js"></script>   <!-- \u2717 http:// -->'
  },
  "viewport-fixed-width": {
    category: "responsive",
    title: "viewport \uD3ED\uC774 \uC22B\uC790\uB85C \uACE0\uC815\uB3FC \uC788\uC5B4\uC694",
    bubble: "viewport \uD3ED\uC774 \uACE0\uC815\uC774\uC5D0\uC694!",
    problem: "viewport \uBA54\uD0C0 \uD0DC\uADF8\uAC00 width=1024 \uCC98\uB7FC \uC22B\uC790 \uD3ED\uC73C\uB85C \uACE0\uC815\uB3FC \uC788\uC2B5\uB2C8\uB2E4.",
    why: "\uAE30\uAE30 \uD3ED\uACFC \uC0C1\uAD00\uC5C6\uC774 \uADF8 \uD3ED\uC73C\uB85C \uADF8\uB9B0 \uB4A4 \uC904\uC5EC\uC11C \uBCF4\uC5EC \uC8FC\uBBC0\uB85C \uC791\uC740 \uD654\uBA74\uC5D0\uC11C \uAE00\uC790\uAC00 \uAE68\uC54C\uCC98\uB7FC \uC791\uC544\uC9D1\uB2C8\uB2E4.",
    fix: "width=device-width, initial-scale=1 \uB85C \uBC14\uAFB8\uC138\uC694.",
    code: '<meta name="viewport" content="width=device-width, initial-scale=1" />'
  },
  "input-font-small": {
    category: "responsive",
    title: "\uC785\uB825\uCE78 \uAE00\uC790\uAC00 16px \uBCF4\uB2E4 \uC791\uC544\uC694",
    bubble: "\uC785\uB825\uCE78 \uAE00\uC790\uAC00 \uC791\uC544\uC694!",
    problem: "\uC785\uB825\uCE78\xB7\uC120\uD0DD\uCE78\uC758 \uAE00\uC790 \uD06C\uAE30\uAC00 16px \uBBF8\uB9CC\uC785\uB2C8\uB2E4.",
    why: "iOS Safari \uB294 16px \uBBF8\uB9CC \uC785\uB825\uCE78\uC744 \uB204\uB974\uBA74 \uD654\uBA74\uC744 \uC800\uC808\uB85C \uD655\uB300\uD574\uC11C \uB808\uC774\uC544\uC6C3\uC774 \uC5B4\uAE0B\uB098\uACE0 \uC0AC\uC6A9\uC790\uAC00 \uB2F9\uD669\uD569\uB2C8\uB2E4.",
    fix: "\uC785\uB825\uCE78 \uAE00\uC790\uB97C 16px(1rem) \uC774\uC0C1\uC73C\uB85C \uD558\uC138\uC694. \uD655\uB300\uB97C \uB9C9\uB294 \uBC29\uBC95(user-scalable=no)\uC740 \uC811\uADFC\uC131\uC5D0 \uC88B\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
    code: "input, select, textarea { font-size: 1rem; } /* 16px \uC774\uC0C1 */"
  },
  "button-type-missing": {
    category: "quality",
    title: "form \uC548\uC758 button \uC5D0 type \uC774 \uC5C6\uC5B4\uC694",
    bubble: "button \uC5D0 type \uC774 \uC5C6\uC5B4\uC694!",
    problem: "<form> \uC548\uC758 <button> \uC5D0 type \uC18D\uC131\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.",
    why: 'type \uC774 \uC5C6\uC73C\uBA74 \uAE30\uBCF8\uC774 submit \uC774\uB77C\uC11C "\uCDE8\uC18C"\uB098 "\uB354 \uBCF4\uAE30" \uBC84\uD2BC\uC744 \uB20C\uB7EC\uB3C4 \uD3FC\uC774 \uC81C\uCD9C\uB418\uC5B4 \uD398\uC774\uC9C0\uAC00 \uC0C8\uB85C\uACE0\uCE68\uB429\uB2C8\uB2E4.',
    fix: '\uC81C\uCD9C\uC774 \uC544\uB2CC \uBC84\uD2BC\uC740 type="button" \uC73C\uB85C, \uC81C\uCD9C \uBC84\uD2BC\uC740 type="submit" \uC73C\uB85C \uBD84\uBA85\uD788 \uC4F0\uC138\uC694.',
    code: '<form>\n  <button type="button">\uB354 \uBCF4\uAE30</button>\n  <button type="submit">\uC800\uC7A5</button>\n</form>'
  },
  "deprecated-tags": {
    category: "quality",
    title: "\uC624\uB798\uB418\uC5B4 \uC4F0\uC9C0 \uC54A\uB294 \uD0DC\uADF8\uB97C \uC37C\uC5B4\uC694",
    bubble: "\uC61B\uB0A0 \uD0DC\uADF8\uB97C \uC37C\uC5B4\uC694!",
    problem: "<center>, <font>, <marquee>, <blink> \uAC19\uC740 \uB354 \uC774\uC0C1 \uC4F0\uC9C0 \uC54A\uB294 \uD0DC\uADF8\uAC00 \uC788\uC2B5\uB2C8\uB2E4.",
    why: "\uD45C\uC900\uC5D0\uC11C \uC0AC\uB77C\uC9C4 \uD0DC\uADF8\uB77C \uBE0C\uB77C\uC6B0\uC800\uB9C8\uB2E4 \uB2E4\uB974\uAC8C \uB3D9\uC791\uD558\uAC70\uB098 \uC5B8\uC81C\uB4E0 \uC9C0\uC6D0\uC774 \uB04A\uAE38 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uD2B9\uD788 \uC6C0\uC9C1\uC774\uB294 \uAE00\uC790(marquee\xB7blink)\uB294 \uC811\uADFC\uC131\uC5D0\uB3C4 \uD574\uB86D\uC2B5\uB2C8\uB2E4.",
    fix: "\uBAA8\uC591\uC740 CSS(text-align, font-family, animation \uB4F1)\uB85C \uCC98\uB9AC\uD558\uC138\uC694.",
    code: '<!-- \u2717 --> <center>\uC81C\uBAA9</center>\n<!-- \u2713 --> <h1 style="text-align:center">\uC81C\uBAA9</h1>'
  }
};

// dist/shared/tips-en.js
var TIPS_EN = {
  "semantic-html": {
    title: "Use the right tag instead of a div",
    body: "Use button for buttons, a for links, ul/li for lists, and you get keyboard support, screen reader support, and SEO for free. If you put onClick on a div, you have to build all of that yourself."
  },
  "focus-visible": {
    title: "Replace outline: none, don't just remove it",
    body: "If you remove the focus ring, keyboard users cannot tell where they are. If you must remove it, add another indicator with :focus-visible."
  },
  "box-sizing": {
    title: "Make box-sizing: border-box the default",
    body: "With the default (content-box), padding and border are added to width, so a 100% wide element overflows its parent. border-box includes padding and border inside the width."
  },
  "flex-min-width": {
    title: "If a flex child will not shrink, use min-width: 0",
    body: "A flex item has min-width: auto by default, so long text keeps it from shrinking and it overflows the parent. min-width: 0 lets it shrink, and text-overflow ellipsis finally works."
  },
  "rem-vs-px": {
    title: "Prefer rem over px for font sizes",
    body: "Fixing sizes in px ignores the browser font size the user chose. rem follows the user setting, which helps people with low vision."
  },
  "list-key": {
    title: "Use a stable id as the React list key",
    body: "If you use the array index as key, state can attach to the wrong item when items are added, removed, or sorted. Use the unique id your data has."
  },
  "effect-cleanup": {
    title: "useEffect and its cleanup go together",
    body: "Subscriptions, timers, and event listeners must be released in the cleanup function. Otherwise they pile up every time the screen mounts, causing memory leaks and duplicate runs."
  },
  "fetch-race": {
    title: "Requests can come back in the wrong order",
    body: "If the search text changes quickly, an earlier request can arrive later and overwrite the screen. Cancel the previous request with AbortController."
  },
  "loading-error-empty": {
    title: "A screen has four states",
    body: "If you only build the screen with data, it breaks or goes blank while loading, on errors, and for empty lists. This is what AI-generated screens miss most often."
  },
  "json-parse-try": {
    title: "Wrap JSON.parse and localStorage in try/catch",
    body: "If a stored value is broken or empty, JSON.parse throws and the whole app stops. Assume anything from outside can fail."
  },
  debounce: {
    title: "Debounce instead of requesting on every keystroke",
    body: "Calling the API for every letter in a search box causes server load and flicker. Send one request after the typing pauses."
  },
  "promise-all": {
    title: "Use Promise.all for unrelated requests",
    body: "Awaiting independent requests one after another adds their times together. With Promise.all they run together and take only as long as the slowest one."
  },
  "layout-shift": {
    title: "Tell the browser the image size up front",
    body: "When an image loads late and gets its size, the content below is pushed down (CLS). Reserve the space with width/height attributes or aspect-ratio."
  },
  "lazy-image": {
    title: 'Use loading="lazy" for images below the fold',
    body: "Downloading images that are not visible at first slows the initial load. But do not use lazy on the large image visible on the first screen."
  },
  "reduced-motion": {
    title: "Respect the reduce-motion setting",
    body: 'People who feel dizzy turn on "reduce motion" in their OS. Turn off or tone down large movements with prefers-reduced-motion.'
  },
  "aria-live": {
    title: "Announce changing messages with aria-live",
    body: 'Toast messages like "Saved" or errors only reach people who can see them. Put them in an aria-live region and screen readers will read them too.'
  },
  "z-index-context": {
    title: "z-index is only compared inside a stacking context",
    body: "Even with z-index: 9999, if a parent creates a new stacking context (position + z-index, transform, opacity, etc.) it cannot beat elements outside it. Put modals directly under body."
  },
  "controlled-input": {
    title: "An input with value but no onChange cannot be typed into",
    body: "In React, the value you pass always decides what is shown. If onChange does not update the state, typing changes nothing. If you only need an initial value, use defaultValue."
  },
  "cors-basics": {
    title: "A CORS error is the browser blocking it",
    body: "There is no CORS between servers. It is a security rule where the browser will not hand a cross-origin response to JS, so the fix is the server sending allow headers, or a proxy during development."
  },
  "defer-script": {
    title: "Load scripts with defer",
    body: "A normal script in <head> stops HTML parsing while it downloads and runs. defer does not block parsing and runs in order after the document is built."
  }
};

// dist/shared/tips-extra.js
var WEBDEV_CWV = { label: "web.dev \xB7 The most effective ways to improve Core Web Vitals", url: "https://web.dev/articles/top-cwv" };
var WOOWA_IMG = { label: "\uC6B0\uC544\uD55C\uD615\uC81C\uB4E4 \uAE30\uC220\uBE14\uB85C\uADF8 \xB7 \uBC30\uBBFC\uC6B0\uB9AC\uB3D9\uB124 \uC774\uBBF8\uC9C0 \uCD5C\uC801\uD654 \uC0AC\uB840", url: "https://techblog.woowahan.com/20228/" };
var KAKAO_WASM = { label: "\uCE74\uCE74\uC624 \uAE30\uC220\uBE14\uB85C\uADF8 \xB7 FE\uAC1C\uBC1C\uC790\uC758 \uC131\uC7A5 \uC2A4\uD1A0\uB9AC 08 (WebAssembly)", url: "https://tech.kakao.com/2021/05/17/frontend-growth-08/" };
var KAKAO_FLOW = { label: "if(kakao)dev2022 \xB7 Lighthouse Userflow \uC6F9 \uBC18\uC751\uC131 \uAC1C\uC120", url: "https://if.kakao.com/2022/session/126" };
var MDN_CSP = { label: "MDN \xB7 Content Security Policy", url: "https://developer.mozilla.org/docs/Web/Security/Practical_implementation_guides/CSP" };
var EXTRA_TIPS = [
  // ---- 성능 ----
  {
    id: "lcp-discoverable",
    ko: { title: "\uAC00\uC7A5 \uD070 \uC774\uBBF8\uC9C0\uB294 HTML \uC5D0\uC11C \uBC14\uB85C \uCC3E\uAC8C", body: 'LCP(\uAC00\uC7A5 \uD070 \uCF58\uD150\uCE20) \uC774\uBBF8\uC9C0\uAC00 CSS \uBC30\uACBD\uC774\uB098 JS \uB85C \uB2A6\uAC8C \uB9CC\uB4E4\uC5B4\uC9C0\uBA74 \uBE0C\uB77C\uC6B0\uC800\uAC00 \uBC1C\uACAC\uD558\uB294 \uC2DC\uC810\uC774 \uB2A6\uC5B4\uC9D1\uB2C8\uB2E4. HTML \uC758 img \uB85C \uB450\uACE0 fetchpriority="high" \uB85C \uC6B0\uC120\uC21C\uC704\uB97C \uB192\uC774\uC138\uC694.' },
    en: { title: "Make the biggest image discoverable in HTML", body: 'If the LCP (largest content) image is a CSS background or created late by JS, the browser finds it late. Keep it as an img in the HTML and raise its priority with fetchpriority="high".' },
    code: '<img src="/hero.webp" width="1200" height="600"\n     fetchpriority="high" alt="..." />',
    source: WEBDEV_CWV
  },
  {
    id: "no-lazy-lcp",
    ko: { title: "\uCCAB \uD654\uBA74\uC758 \uD070 \uC774\uBBF8\uC9C0\uC5D0 lazy \uB97C \uC4F0\uC9C0 \uB9C8\uC138\uC694", body: 'loading="lazy" \uB294 \uC77C\uBD80\uB7EC \uB2A6\uAC8C \uBC1B\uB294 \uAE30\uB2A5\uC785\uB2C8\uB2E4. \uCCAB \uD654\uBA74 \uB9E8 \uC704\uC758 \uD070 \uC774\uBBF8\uC9C0\uC5D0 \uC4F0\uBA74 LCP \uAC00 \uC624\uD788\uB824 \uB290\uB824\uC838\uC694. \uD654\uBA74 \uC544\uB798 \uC774\uBBF8\uC9C0\uC5D0\uB9CC \uC4F0\uC138\uC694.' },
    en: { title: "Do not lazy-load the big image on the first screen", body: 'loading="lazy" deliberately delays the download. On the large image at the top of the first screen it makes LCP worse. Use it only for images below the fold.' },
    code: '<img src="/hero.webp" fetchpriority="high" alt="..." />  <!-- lazy \uC5C6\uC74C -->\n<img src="/card.webp" loading="lazy" alt="..." />',
    source: WEBDEV_CWV
  },
  {
    id: "inp-long-tasks",
    ko: { title: "50ms \uB118\uB294 \uAE34 \uC791\uC5C5\uC740 \uCABC\uAC1C\uC138\uC694", body: "\uBA54\uC778 \uC2A4\uB808\uB4DC\uAC00 \uD55C \uC791\uC5C5\uC5D0 \uC624\uB798 \uBD99\uC7A1\uD600 \uC788\uC73C\uBA74 \uADF8\uB3D9\uC548 \uB204\uB978 \uBC84\uD2BC\uC774 \uBC18\uC751\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4(INP). \uD070 \uBC18\uBCF5\uBB38\uC740 \uB098\uB220\uC11C \uC0AC\uC774\uC0AC\uC774 \uBE0C\uB77C\uC6B0\uC800\uC5D0\uAC8C \uC228 \uC274 \uD2C8\uC744 \uC8FC\uC138\uC694." },
    en: { title: "Break up tasks longer than 50ms", body: "If the main thread is stuck on one task, buttons pressed meanwhile do not respond (INP). Split big loops and give the browser room to breathe between chunks." },
    code: "for (const chunk of chunks) {\n  process(chunk);\n  await new Promise((r) => setTimeout(r)); // \uD55C \uD2F1 \uC591\uBCF4\n}",
    source: WEBDEV_CWV
  },
  {
    id: "font-display",
    ko: { title: "\uC6F9\uD3F0\uD2B8\uB294 font-display \uB97C \uC815\uD558\uC138\uC694", body: "\uD3F0\uD2B8\uAC00 \uC624\uAE30 \uC804\uAE4C\uC9C0 \uAE00\uC790\uAC00 \uC548 \uBCF4\uC774\uBA74(FOIT) \uCCAB\uC778\uC0C1\uC774 \uB098\uC069\uB2C8\uB2E4. font-display: swap \uC740 \uAE30\uBCF8 \uAE00\uAF34\uB85C \uBA3C\uC800 \uBCF4\uC5EC \uC8FC\uACE0 \uD3F0\uD2B8\uAC00 \uC624\uBA74 \uBC14\uAFC9\uB2C8\uB2E4. \uAE00\uC790 \uD06C\uAE30 \uCC28\uC774\uB85C \uBC00\uB9AC\uC9C0 \uC54A\uAC8C size-adjust \uB3C4 \uB3C4\uC6C0\uC774 \uB3FC\uC694." },
    en: { title: "Set font-display for web fonts", body: "If text is invisible until the font arrives (FOIT), the first impression suffers. font-display: swap shows a fallback first and swaps when the font loads. size-adjust helps avoid layout jumps from size differences." },
    code: '@font-face {\n  font-family: "Pretendard";\n  src: url(/pretendard.woff2) format("woff2");\n  font-display: swap;\n}'
  },
  {
    id: "image-modern-format",
    ko: { title: "\uC774\uBBF8\uC9C0\uB294 WebP\xB7AVIF \uC640 \uC54C\uB9DE\uC740 \uD06C\uAE30\uB85C", body: "\uAC19\uC740 \uD654\uC9C8\uC774\uBA74 JPEG\xB7PNG \uBCF4\uB2E4 WebP\xB7AVIF \uAC00 \uD6E8\uC52C \uAC00\uBCCD\uC2B5\uB2C8\uB2E4. \uD654\uBA74\uC5D0 \uBCF4\uC774\uB294 \uD06C\uAE30\uBCF4\uB2E4 \uD6E8\uC52C \uD070 \uC6D0\uBCF8\uC744 \uADF8\uB300\uB85C \uC4F0\uC9C0 \uB9D0\uACE0 \uC378\uB124\uC77C\uC744 \uB530\uB85C \uB9CC\uB4E4\uC5B4 \uC4F0\uC138\uC694." },
    en: { title: "Use WebP/AVIF and the right size for images", body: "At the same quality, WebP and AVIF are much lighter than JPEG or PNG. Do not ship an original far larger than what is shown; make proper thumbnails." },
    code: '<picture>\n  <source srcset="/a.avif" type="image/avif" />\n  <source srcset="/a.webp" type="image/webp" />\n  <img src="/a.jpg" alt="..." />\n</picture>',
    source: WOOWA_IMG
  },
  {
    id: "image-on-demand",
    ko: { title: "\uD070 \uC774\uBBF8\uC9C0\uB294 \uD544\uC694\uD560 \uB54C\uB9CC \uBD88\uB7EC\uC624\uC138\uC694", body: "\uD53C\uB4DC\uC5D0\uC11C\uB294 \uC791\uC740 \uC378\uB124\uC77C\uB9CC, \uD070 \uC6D0\uBCF8\uC740 \uC0C1\uC138 \uD654\uBA74\uC744 \uC5F4 \uB54C \uBC1B\uC73C\uBA74 \uC804\uC1A1\uB7C9\uC774 \uD06C\uAC8C \uC904\uC5B4\uB4ED\uB2C8\uB2E4. \uBCF4\uC774\uC9C0 \uC54A\uB294 \uC774\uBBF8\uC9C0\uB97C \uBBF8\uB9AC \uBC1B\uC9C0 \uC54A\uB294 \uAC83\uC774 \uAC00\uC7A5 \uC26C\uC6B4 \uCD5C\uC801\uD654\uC608\uC694." },
    en: { title: "Load big images only when needed", body: "Show small thumbnails in the feed and fetch the large original only when the detail view opens, and the transfer shrinks a lot. Not downloading what nobody sees is the easiest optimization." },
    code: "const [open, setOpen] = useState(false);\n<img src={open ? item.full : item.thumb} onClick={() => setOpen(true)} />",
    source: WOOWA_IMG
  },
  {
    id: "code-splitting",
    ko: { title: "\uD654\uBA74\uBCC4\uB85C \uCF54\uB4DC\uB97C \uB098\uB220\uC11C \uBC1B\uC73C\uC138\uC694", body: "\uCC98\uC74C \uD654\uBA74\uC5D0 \uD544\uC694 \uC5C6\uB294 \uD398\uC774\uC9C0\xB7\uBB34\uAC70\uC6B4 \uCC28\uD2B8\xB7\uC5D0\uB514\uD130\uAE4C\uC9C0 \uD55C \uBC88\uB4E4\uC5D0 \uB123\uC73C\uBA74 \uCCAB \uB85C\uB529\uC774 \uB290\uB9BD\uB2C8\uB2E4. \uB77C\uC6B0\uD2B8 \uB2E8\uC704\uB85C dynamic import \uD558\uBA74 \uD544\uC694\uD55C \uC21C\uAC04\uC5D0\uB9CC \uB0B4\uB824\uBC1B\uC544\uC694." },
    en: { title: "Split code per screen", body: "If pages, charts, and editors the first screen does not need all live in one bundle, the first load is slow. Dynamic-import per route so they download only when needed." },
    code: 'const Settings = lazy(() => import("./Settings"));\n<Suspense fallback={<Spinner />}><Settings /></Suspense>'
  },
  {
    id: "bundle-weight",
    ko: { title: "\uB77C\uC774\uBE0C\uB7EC\uB9AC\uB97C \uB123\uAE30 \uC804\uC5D0 \uBB34\uAC8C\uB97C \uBCF4\uC138\uC694", body: "\uB0A0\uC9DC \uD558\uB098 \uACE0\uCE58\uB824\uACE0 \uD070 \uB77C\uC774\uBE0C\uB7EC\uB9AC\uB97C \uD1B5\uC9F8\uB85C \uB123\uC73C\uBA74 \uBC88\uB4E4\uC774 \uBA87 \uBC30\uB85C \uCEE4\uC9C8 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uBC88\uB4E4 \uBD84\uC11D \uB3C4\uAD6C\uB85C \uD070 \uB369\uC5B4\uB9AC\uB97C \uCC3E\uACE0, \uAC00\uBCBC\uC6B4 \uB300\uC548\uC774\uB098 \uD544\uC694\uD55C \uD568\uC218\uB9CC \uAC00\uC838\uC624\uB294 \uBC29\uBC95\uC744 \uACE0\uB824\uD558\uC138\uC694." },
    en: { title: "Check a library's weight before adding it", body: "Pulling in a big library just to format a date can multiply your bundle. Use a bundle analyzer to find the big chunks, and consider lighter alternatives or importing only the functions you need." },
    code: '// vite: rollup-plugin-visualizer \uB85C \uBC88\uB4E4 \uAD6C\uC131\uC744 \uB208\uC73C\uB85C \uD655\uC778\nimport { format } from "date-fns"; // \uD544\uC694\uD55C \uD568\uC218\uB9CC'
  },
  {
    id: "cache-hashed-assets",
    ko: { title: "\uD574\uC2DC\uAC00 \uBD99\uC740 \uD30C\uC77C\uC740 \uC624\uB798 \uCE90\uC2DC\uD558\uC138\uC694", body: "app.3f9a1c.js \uCC98\uB7FC \uB0B4\uC6A9\uC774 \uBC14\uB00C\uBA74 \uC774\uB984\uC774 \uBC14\uB00C\uB294 \uD30C\uC77C\uC740 1\uB144 \uCE90\uC2DC\uD574\uB3C4 \uC548\uC804\uD569\uB2C8\uB2E4. \uBC18\uB300\uB85C index.html \uC740 \uCE90\uC2DC\uD558\uC9C0 \uC54A\uAC70\uB098 \uC9E7\uAC8C \uB450\uC5B4\uC57C \uC0C8 \uBC30\uD3EC\uAC00 \uBC14\uB85C \uBCF4\uC5EC\uC694." },
    en: { title: "Cache hashed files for a long time", body: "Files whose names change when the content changes, like app.3f9a1c.js, are safe to cache for a year. index.html, on the other hand, should not be cached (or only briefly) so a new deploy shows up right away." },
    code: "Cache-Control: public, max-age=31536000, immutable   # /assets/*.js\nCache-Control: no-cache                              # index.html"
  },
  {
    id: "preconnect",
    ko: { title: "\uACE7 \uC4F8 \uC678\uBD80 \uC11C\uBC84\uC5D0\uB294 preconnect", body: "\uD3F0\uD2B8\xB7API\xB7CDN \uCC98\uB7FC \uACE7 \uC694\uCCAD\uD560 \uB2E4\uB978 \uCD9C\uCC98\uAC00 \uC788\uB2E4\uBA74 \uC5F0\uACB0(DNS\xB7TLS)\uC744 \uBBF8\uB9AC \uC5F4\uC5B4 \uB450\uBA74 \uCCAB \uC694\uCCAD\uC774 \uBE68\uB77C\uC9D1\uB2C8\uB2E4. \uB108\uBB34 \uB9CE\uC774 \uAC78\uBA74 \uC624\uD788\uB824 \uBC29\uD574\uB418\uB2C8 \uC815\uB9D0 \uC911\uC694\uD55C \uD55C\uB450 \uACF3\uB9CC\uC694." },
    en: { title: "Preconnect to servers you will use soon", body: "If you will soon call another origin (font, API, CDN), opening the connection early speeds up the first request. Do not overdo it; just the one or two that really matter." },
    code: '<link rel="preconnect" href="https://api.example.com" crossorigin />'
  },
  {
    id: "virtual-list",
    ko: { title: "\uC544\uC8FC \uAE34 \uBAA9\uB85D\uC740 \uAC00\uC0C1\uD654\uD558\uC138\uC694", body: "\uC218\uCC9C \uAC1C \uD56D\uBAA9\uC744 \uBAA8\uB450 DOM \uC5D0 \uB9CC\uB4E4\uBA74 \uC2A4\uD06C\uB864\uACFC \uC785\uB825\uC774 \uBC84\uBC85\uC785\uB2C8\uB2E4. \uD654\uBA74\uC5D0 \uBCF4\uC774\uB294 \uAC83\uB9CC \uADF8\uB9AC\uB294 \uAC00\uC0C1 \uC2A4\uD06C\uB864(react-window \uB4F1)\uC744 \uC4F0\uBA74 \uAC1C\uC218\uC640 \uC0C1\uAD00\uC5C6\uC774 \uAC00\uBCBC\uC6CC\uC694." },
    en: { title: "Virtualize very long lists", body: "Rendering thousands of items into the DOM makes scrolling and typing janky. Virtual scrolling (react-window and the like) draws only what is visible and stays light no matter the count." },
    code: '<FixedSizeList height={400} itemCount={10000} itemSize={36} width="100%">\n  {Row}\n</FixedSizeList>'
  },
  {
    id: "offload-wasm",
    ko: { title: "\uBB34\uAC70\uC6B4 \uACC4\uC0B0\uC740 \uBA54\uC778 \uC2A4\uB808\uB4DC \uBC16\uC73C\uB85C", body: "\uC774\uBBF8\uC9C0 \uD544\uD130\xB7\uD070 \uB370\uC774\uD130 \uAC00\uACF5\uCC98\uB7FC \uC624\uB798 \uAC78\uB9AC\uB294 \uACC4\uC0B0\uC740 Web Worker \uB85C \uC62E\uAE30\uBA74 \uD654\uBA74\uC774 \uBA48\uCD94\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. \uACC4\uC0B0\uC774 \uC815\uB9D0 \uBCD1\uBAA9\uC774\uBA74 WebAssembly \uB85C \uB354 \uBE60\uB974\uAC8C \uB9CC\uB4E4 \uC218\uB3C4 \uC788\uC5B4\uC694." },
    en: { title: "Move heavy computation off the main thread", body: "Long computations like image filters or processing big data keep the UI from freezing when moved to a Web Worker. If the computation is a real bottleneck, WebAssembly can make it faster still." },
    code: 'const worker = new Worker(new URL("./filter.worker.ts", import.meta.url));\nworker.postMessage(pixels);\nworker.onmessage = (e) => draw(e.data);',
    source: KAKAO_WASM
  },
  {
    id: "measure-interactions",
    ko: { title: "\uB85C\uB529\uB9CC \uB9D0\uACE0 '\uC870\uC791'\uB3C4 \uCE21\uC815\uD558\uC138\uC694", body: "\uD398\uC774\uC9C0\uAC00 \uC5F4\uB9AC\uB294 \uC18D\uB3C4\uB9CC \uC7AC\uBA74 \uBC84\uD2BC\uC744 \uB20C\uB800\uC744 \uB54C\uC758 \uBC18\uC751\uC740 \uB193\uCE69\uB2C8\uB2E4. Lighthouse \uC0AC\uC6A9\uC790 \uD750\uB984(User Flow)\uCC98\uB7FC \uD074\uB9AD\xB7\uC785\uB825 \uAC19\uC740 \uC0C1\uD638\uC791\uC6A9 \uAD6C\uAC04\uB3C4 \uCE21\uC815\uD574 \uBCF4\uC138\uC694." },
    en: { title: "Measure interactions, not just loading", body: "Measuring only how fast a page opens misses how it responds when a button is pressed. Measure interaction phases (clicks, input) too, for example with Lighthouse User Flows." },
    code: "// Lighthouse User Flow: startFlow \u2192 navigate \u2192 startTimespan \u2192 \uD074\uB9AD \u2192 endTimespan",
    source: KAKAO_FLOW
  },
  {
    id: "field-data",
    ko: { title: "\uB0B4 \uCEF4\uD4E8\uD130\uAC00 \uBE60\uB974\uB2E4\uACE0 \uBE60\uB978 \uAC8C \uC544\uB2C8\uC5D0\uC694", body: "\uAC1C\uBC1C PC \uC640 \uC640\uC774\uD30C\uC774\uC5D0\uC11C \uBE60\uB978 \uD398\uC774\uC9C0\uAC00 \uC2E4\uC81C \uC0AC\uC6A9\uC790\uC758 \uC800\uC0AC\uC591 \uD3F0\uC5D0\uC11C\uB294 \uB290\uB9B4 \uC218 \uC788\uC2B5\uB2C8\uB2E4. web-vitals \uB77C\uC774\uBE0C\uB7EC\uB9AC\uB85C \uC2E4\uC81C \uC0AC\uC6A9\uC790 \uB370\uC774\uD130\uB97C \uBAA8\uC544\uC11C 75% \uC0AC\uC6A9\uC790\uAC00 \uAE30\uC900\uC744 \uB118\uB294\uC9C0 \uBCF4\uC138\uC694." },
    en: { title: "Fast on your machine does not mean fast", body: "A page that is quick on your dev PC and Wi-Fi can be slow on a real user's low-end phone. Collect real-user data with the web-vitals library and check that 75% of users meet the thresholds." },
    code: 'import { onLCP, onINP, onCLS } from "web-vitals";\nonLCP(send); onINP(send); onCLS(send);',
    source: WEBDEV_CWV
  },
  // ---- CSS ----
  {
    id: "container-queries",
    ko: { title: "\uCE74\uB4DC\uB294 \uD654\uBA74\uC774 \uC544\uB2C8\uB77C '\uC790\uB9AC' \uD06C\uAE30\uB97C \uB530\uB974\uAC8C", body: "\uBBF8\uB514\uC5B4 \uCFFC\uB9AC\uB294 \uD654\uBA74 \uC804\uCCB4 \uD3ED\uB9CC \uBD05\uB2C8\uB2E4. \uCEE8\uD14C\uC774\uB108 \uCFFC\uB9AC\uB97C \uC4F0\uBA74 \uCE74\uB4DC\uAC00 \uB193\uC778 \uC790\uB9AC \uD3ED\uC5D0 \uB9DE\uCDB0 \uBAA8\uC591\uC774 \uBC14\uB00C\uC5B4\uC11C \uC0AC\uC774\uB4DC\uBC14\uC5D0 \uC788\uB4E0 \uBCF8\uBB38\uC5D0 \uC788\uB4E0 \uC54C\uB9DE\uAC8C \uBCF4\uC5EC\uC694." },
    en: { title: "Let a card follow its slot, not the screen", body: "Media queries only see the whole viewport width. Container queries let a card adapt to the width of where it sits, so it looks right in a sidebar or in the main column." },
    code: ".card-wrap { container-type: inline-size; }\n@container (min-width: 400px) { .card { display: flex; } }"
  },
  {
    id: "flex-gap",
    ko: { title: "\uAC04\uACA9\uC740 margin \uB300\uC2E0 gap", body: "\uD56D\uBAA9 \uC0AC\uC774 \uAC04\uACA9\uC744 margin \uC73C\uB85C \uC8FC\uBA74 \uCCAB\xB7\uB9C8\uC9C0\uB9C9 \uD56D\uBAA9 \uCC98\uB9AC\uAC00 \uBC88\uAC70\uB86D\uC2B5\uB2C8\uB2E4. flex\xB7grid \uC758 gap \uC740 \uD56D\uBAA9 \uC0AC\uC774\uC5D0\uB9CC \uAC04\uACA9\uC744 \uB123\uC5B4 \uC918\uC11C \uD6E8\uC52C \uB2E8\uC21C\uD574\uC694." },
    en: { title: "Use gap instead of margin for spacing", body: "Spacing items with margin makes the first and last item awkward. gap in flex and grid adds space only between items, which is much simpler." },
    code: ".row { display: flex; gap: 12px; }"
  },
  {
    id: "dvh-units",
    ko: { title: "\uBAA8\uBC14\uC77C\uC5D0\uC11C 100vh \uB294 \uC8FC\uC18C\uCC3D\uC5D0 \uAC00\uB824\uC838\uC694", body: "\uBAA8\uBC14\uC77C \uBE0C\uB77C\uC6B0\uC800\uB294 \uC8FC\uC18C\uCC3D\uC774 \uB098\uD0C0\uB0AC\uB2E4 \uC0AC\uB77C\uC838\uC11C 100vh \uAC00 \uC2E4\uC81C \uBCF4\uC774\uB294 \uB192\uC774\uBCF4\uB2E4 \uD07D\uB2C8\uB2E4. 100dvh(\uB3D9\uC801 \uBDF0\uD3EC\uD2B8 \uB192\uC774)\uB97C \uC4F0\uBA74 \uC9C0\uAE08 \uBCF4\uC774\uB294 \uB192\uC774\uC5D0 \uB9DE\uC544\uC694." },
    en: { title: "100vh on mobile gets hidden by the address bar", body: "Mobile browsers show and hide the address bar, so 100vh is taller than what is actually visible. 100dvh (dynamic viewport height) matches the height visible right now." },
    code: ".full { min-height: 100vh; min-height: 100dvh; }"
  },
  {
    id: "color-scheme",
    ko: { title: "\uB2E4\uD06C \uBAA8\uB4DC\uB294 color-scheme \uBD80\uD130", body: "color-scheme: light dark \uB97C \uC120\uC5B8\uD558\uBA74 \uC785\uB825\uCE78\xB7\uC2A4\uD06C\uB864\uBC14 \uAC19\uC740 \uAE30\uBCF8 \uC694\uC18C\uB3C4 \uB2E4\uD06C \uBAA8\uB4DC\uC5D0 \uB9DE\uAC8C \uBC14\uB01D\uB2C8\uB2E4. \uADF8\uB2E4\uC74C prefers-color-scheme \uC73C\uB85C \uB0B4 \uC0C9\uB9CC \uC870\uC815\uD558\uBA74 \uB3FC\uC694." },
    en: { title: "Start dark mode with color-scheme", body: "Declaring color-scheme: light dark makes default elements such as inputs and scrollbars follow dark mode too. Then adjust only your own colors with prefers-color-scheme." },
    code: ":root { color-scheme: light dark; }\n@media (prefers-color-scheme: dark) { :root { --bg: #111; } }"
  },
  {
    id: "text-clamp",
    ko: { title: "\uAE34 \uAE00\uC740 \uC904 \uC218\uB85C \uB9D0\uC904\uC784", body: "\uD55C \uC904 \uB9D0\uC904\uC784\uC740 text-overflow: ellipsis, \uC5EC\uB7EC \uC904\uC740 line-clamp \uB97C \uC501\uB2C8\uB2E4. \uC798\uB9B0 \uAE00\uC758 \uC804\uCCB4 \uB0B4\uC6A9\uC744 \uBCFC \uC218 \uC788\uB294 \uBC29\uBC95(\uD3BC\uCE58\uAE30\xB7\uD234\uD301)\uB3C4 \uD568\uAED8 \uC81C\uACF5\uD558\uC138\uC694." },
    en: { title: "Truncate long text by line count", body: "Use text-overflow: ellipsis for one line and line-clamp for several. Also give a way to see the full text (expand, tooltip)." },
    code: ".title {\n  display: -webkit-box;\n  -webkit-line-clamp: 2;\n  -webkit-box-orient: vertical;\n  overflow: hidden;\n}"
  },
  {
    id: "sticky-overflow",
    ko: { title: "sticky \uAC00 \uC548 \uBA39\uC73C\uBA74 \uBD80\uBAA8\uC758 overflow \uB97C \uBCF4\uC138\uC694", body: "position: sticky \uB294 \uC870\uC0C1 \uC911\uC5D0 overflow: hidden/auto \uAC00 \uC788\uC73C\uBA74 \uADF8 \uC548\uC5D0\uC11C\uB9CC \uBD99\uC2B5\uB2C8\uB2E4. \uC548 \uBD99\uB294\uB2E4\uBA74 \uBD80\uBAA8 \uCCB4\uC778\uC5D0 overflow \uAC00 \uC788\uB294\uC9C0, top \uAC12\uC774 \uC788\uB294\uC9C0 \uD655\uC778\uD558\uC138\uC694." },
    en: { title: "If sticky does nothing, check the parent's overflow", body: "position: sticky only sticks within an ancestor that has overflow hidden/auto. If it does not stick, check the parent chain for overflow and make sure a top value is set." },
    code: ".header { position: sticky; top: 0; }\n/* \uC870\uC0C1\uC5D0 overflow: hidden \uC774 \uC788\uC73C\uBA74 \uC548 \uBD99\uC5B4\uC694 */"
  },
  // ---- JS / TS ----
  {
    id: "nullish-vs-or",
    ko: { title: "\uAE30\uBCF8\uAC12\uC740 || \uBCF4\uB2E4 ??", body: "count || 10 \uC740 0 \uC774\uB098 \uBE48 \uBB38\uC790\uC5F4\uB3C4 '\uC5C6\uC74C'\uC73C\uB85C \uBCF4\uACE0 10 \uC774 \uB429\uB2C8\uB2E4. ?? \uB294 null\xB7undefined \uC77C \uB54C\uB9CC \uAE30\uBCF8\uAC12\uC744 \uC368\uC11C 0 \uC774 \uC0B4\uC544\uB0A8\uC544\uC694." },
    en: { title: "Prefer ?? over || for defaults", body: "count || 10 treats 0 and the empty string as missing and gives 10. ?? uses the default only for null and undefined, so 0 survives." },
    code: 'const page = query.page ?? 1;  // 0 \uC740 0\nconst name = input || "\uC775\uBA85";   // \uBE48 \uBB38\uC790\uC5F4\uC774\uBA74 "\uC775\uBA85"'
  },
  {
    id: "immutable-update",
    ko: { title: "\uC0C1\uD0DC\uB294 \uC9C1\uC811 \uBC14\uAFB8\uC9C0 \uB9D0\uACE0 \uC0C8\uB85C \uB9CC\uB4E4\uAE30", body: "\uBC30\uC5F4\uC5D0 push \uD558\uAC70\uB098 \uAC1D\uCCB4 \uC18D\uC131\uC744 \uBC14\uB85C \uBC14\uAFB8\uBA74 React \uAC00 \uBCC0\uD654\uB97C \uBABB \uC54C\uC544\uCC44 \uD654\uBA74\uC774 \uC548 \uBC14\uB01D\uB2C8\uB2E4. \uC804\uAC1C \uC5F0\uC0B0\uC790\uB098 map\xB7filter \uB85C \uC0C8 \uAC12\uC744 \uB9CC\uB4E4\uC5B4 \uB118\uAE30\uC138\uC694." },
    en: { title: "Create new state instead of mutating it", body: "Pushing onto an array or assigning an object property directly means React does not notice the change and the screen does not update. Build a new value with spread, map, or filter." },
    code: 'setItems((prev) => [...prev, newItem]);\nsetUser((u) => ({ ...u, name: "\uC0C8 \uC774\uB984" }));'
  },
  {
    id: "structured-clone",
    ko: { title: "\uAE4A\uC740 \uBCF5\uC0AC\uB294 structuredClone", body: "JSON.parse(JSON.stringify(x)) \uB294 Date\xB7Map\xB7undefined \uB97C \uB9DD\uAC00\uB728\uB9BD\uB2C8\uB2E4. structuredClone \uC740 \uC774\uB7F0 \uAC12\uB4E4\uC744 \uC62C\uBC14\uB974\uAC8C \uBCF5\uC0AC\uD558\uB294 \uD45C\uC900 \uD568\uC218\uC608\uC694(\uD568\uC218\uB294 \uBCF5\uC0AC\uD560 \uC218 \uC5C6\uC5B4\uC694)." },
    en: { title: "Use structuredClone for deep copies", body: "JSON.parse(JSON.stringify(x)) mangles Date, Map, and undefined. structuredClone is the standard function that copies them correctly (functions cannot be cloned)." },
    code: "const copy = structuredClone(state);"
  },
  {
    id: "ts-unknown",
    ko: { title: "any \uB300\uC2E0 unknown \uC73C\uB85C \uBC1B\uACE0 \uC881\uD788\uC138\uC694", body: "any \uB294 \uD0C0\uC785 \uAC80\uC0AC\uB97C \uAEBC \uBC84\uB9BD\uB2C8\uB2E4. \uC678\uBD80\uC5D0\uC11C \uC628 \uAC12\uC740 unknown \uC73C\uB85C \uBC1B\uACE0 typeof\xB7\uAC80\uC0AC \uD568\uC218\uB85C \uC881\uD600\uC11C \uC4F0\uBA74 \uC548\uC804\uD558\uAC8C \uC4F0\uBA74\uC11C\uB3C4 \uC2E4\uC218\uB97C \uCEF4\uD30C\uC77C \uB54C \uC7A1\uC544\uC694." },
    en: { title: "Take unknown instead of any, then narrow", body: "any turns type checking off. Take outside values as unknown and narrow them with typeof or a guard function, and you stay safe and catch mistakes at compile time." },
    code: 'function parse(v: unknown) {\n  if (typeof v === "string") return v.trim();\n  throw new Error("\uBB38\uC790\uC5F4\uC774 \uC544\uB2C8\uC5D0\uC694");\n}'
  },
  {
    id: "functional-setstate",
    ko: { title: "\uC774\uC804 \uAC12\uC5D0 \uAE30\uB300\uB294 \uC5C5\uB370\uC774\uD2B8\uB294 \uD568\uC218\uD615\uC73C\uB85C", body: "setCount(count + 1) \uC744 \uC5F0\uB2EC\uC544 \uBD80\uB974\uBA74 \uAC19\uC740 count \uB97C \uC77D\uC5B4\uC11C \uD55C \uBC88\uB9CC \uB298\uC5B4\uB0A9\uB2C8\uB2E4. \uC774\uC804 \uAC12\uC774 \uD544\uC694\uD558\uBA74 setCount(c => c + 1) \uCC98\uB7FC \uD568\uC218\uB97C \uB118\uAE30\uC138\uC694." },
    en: { title: "Use the functional form when updating from the previous value", body: "Calling setCount(count + 1) several times reads the same count and only increases once. When you need the previous value, pass a function like setCount(c => c + 1)." },
    code: "setCount((c) => c + 1);\nsetCount((c) => c + 1); // +2"
  },
  {
    id: "passive-listeners",
    ko: { title: "\uC2A4\uD06C\uB864\xB7\uD130\uCE58 \uB9AC\uC2A4\uB108\uB294 passive \uB85C", body: "\uC2A4\uD06C\uB864\uC744 \uB9C9\uC744 \uC77C\uC774 \uC5C6\uB294 touchstart\xB7wheel \uB9AC\uC2A4\uB108\uC5D0 { passive: true } \uB97C \uC8FC\uBA74 \uBE0C\uB77C\uC6B0\uC800\uAC00 \uAE30\uB2E4\uB9AC\uC9C0 \uC54A\uACE0 \uBC14\uB85C \uC2A4\uD06C\uB864\uD574\uC11C \uBD80\uB4DC\uB7EC\uC6CC\uC838\uC694." },
    en: { title: "Make scroll and touch listeners passive", body: "For touchstart and wheel listeners that never block scrolling, { passive: true } lets the browser scroll right away without waiting, so it feels smoother." },
    code: 'window.addEventListener("touchstart", onTouch, { passive: true });'
  },
  {
    id: "intl-format",
    ko: { title: "\uC22B\uC790\xB7\uB0A0\uC9DC\uB294 Intl \uB85C \uD604\uC9C0\uD654", body: "\uC9C1\uC811 \uBB38\uC790\uC5F4\uC744 \uC774\uC5B4 \uBD99\uC774\uC9C0 \uB9D0\uACE0 Intl.NumberFormat\xB7DateTimeFormat \uC744 \uC4F0\uBA74 \uCC9C \uB2E8\uC704 \uAD6C\uBD84, \uD1B5\uD654, \uB0A0\uC9DC \uD615\uC2DD\uC774 \uC0AC\uC6A9\uC790 \uC5B8\uC5B4\uC5D0 \uB9DE\uAC8C \uC790\uB3D9\uC73C\uB85C \uB098\uC635\uB2C8\uB2E4." },
    en: { title: "Localize numbers and dates with Intl", body: "Instead of stitching strings by hand, Intl.NumberFormat and DateTimeFormat produce digit grouping, currency, and date formats that fit the user's language automatically." },
    code: 'new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW" }).format(12000);\nnew Intl.DateTimeFormat(navigator.language).format(new Date());'
  },
  {
    id: "utc-dates",
    ko: { title: "\uC2DC\uAC04\uC740 UTC \uB85C \uC800\uC7A5\uD558\uACE0 \uD654\uBA74\uC5D0\uC11C\uB9CC \uD604\uC9C0 \uC2DC\uAC04\uC73C\uB85C", body: "\uC11C\uBC84\uC640 \uBE0C\uB77C\uC6B0\uC800\uC758 \uC2DC\uAC04\uB300\uAC00 \uB2E4\uB974\uBA74 \uB0A0\uC9DC\uAC00 \uD558\uB8E8\uC529 \uC5B4\uAE0B\uB0A9\uB2C8\uB2E4. ISO 8601(UTC)\uB85C \uC8FC\uACE0\uBC1B\uACE0, \uC0AC\uC6A9\uC790\uC5D0\uAC8C \uBCF4\uC5EC \uC904 \uB54C\uB9CC \uD604\uC9C0 \uC2DC\uAC04\uB300\uB85C \uBC14\uAFB8\uC138\uC694." },
    en: { title: "Store time in UTC, show local time only on screen", body: "If the server and browser time zones differ, dates drift by a day. Exchange ISO 8601 (UTC) and convert to the local time zone only when showing it to the user." },
    code: 'const iso = new Date().toISOString();           // \uC800\uC7A5\xB7\uC804\uC1A1\nnew Date(iso).toLocaleString("ko-KR");            // \uD45C\uC2DC'
  },
  {
    id: "money-integers",
    ko: { title: "\uB3C8\uC740 \uC18C\uC218\uC810 \uB9D0\uACE0 \uC815\uC218\uB85C", body: "0.1 + 0.2 \uB294 0.30000000000000004 \uC785\uB2C8\uB2E4. \uAE08\uC561\uC740 \uC6D0\xB7\uC13C\uD2B8 \uAC19\uC740 \uCD5C\uC18C \uB2E8\uC704 \uC815\uC218\uB85C \uACC4\uC0B0\uD558\uACE0, \uD654\uBA74\uC5D0 \uBCF4\uC77C \uB54C\uB9CC \uD615\uC2DD\uC744 \uB9DE\uCD94\uC138\uC694." },
    en: { title: "Handle money as integers, not decimals", body: "0.1 + 0.2 is 0.30000000000000004. Calculate amounts in the smallest unit as integers (won, cents) and format only when showing them." },
    code: "const cents = 1999;               // $19.99\nconst total = cents * qty;"
  },
  {
    id: "url-builder",
    ko: { title: "URL \uC740 \uBB38\uC790\uC5F4 \uC774\uC5B4 \uBD99\uC774\uC9C0 \uB9D0\uACE0 URL \uB85C", body: "\uAC80\uC0C9\uC5B4\uC5D0 &, \uACF5\uBC31, \uD55C\uAE00\uC774 \uC788\uC73C\uBA74 \uC9C1\uC811 \uC774\uC5B4 \uBD99\uC778 \uC8FC\uC18C\uAC00 \uAE68\uC9D1\uB2C8\uB2E4. URL\xB7URLSearchParams \uAC00 \uC54C\uC544\uC11C \uC778\uCF54\uB529\uD574 \uC918\uC694." },
    en: { title: "Build URLs with URL, not string concatenation", body: "If a search term has &, spaces, or non-ASCII characters, a hand-built address breaks. URL and URLSearchParams encode them for you." },
    code: 'const url = new URL("/search", location.origin);\nurl.searchParams.set("q", "\uCE74\uD398 & \uBCA0\uC774\uCEE4\uB9AC");'
  },
  // ---- React ----
  {
    id: "derived-state",
    ko: { title: "props \uB97C state \uC5D0 \uBCF5\uC0AC\uD558\uC9C0 \uB9C8\uC138\uC694", body: "props \uB85C \uACC4\uC0B0\uD560 \uC218 \uC788\uB294 \uAC12\uC744 state \uC5D0 \uB610 \uC800\uC7A5\uD558\uBA74 \uB458\uC774 \uC5B4\uAE0B\uB0A9\uB2C8\uB2E4. \uB80C\uB354\uB9C1 \uC911\uC5D0 \uACC4\uC0B0\uD558\uAC70\uB098 key \uB85C \uCEF4\uD3EC\uB10C\uD2B8\uB97C \uC0C8\uB85C \uB9CC\uB4E4\uC5B4 \uCD08\uAE30\uD654\uD558\uC138\uC694." },
    en: { title: "Do not copy props into state", body: "If you store in state a value you can compute from props, the two drift apart. Compute it while rendering, or reset the component with a key." },
    code: "const fullName = `${first} ${last}`; // state \uAC00 \uC544\uB2C8\uB77C \uACC4\uC0B0"
  },
  {
    id: "context-value",
    ko: { title: "Context \uAC12\uC744 \uB9E4\uBC88 \uC0C8\uB85C \uB9CC\uB4E4\uC9C0 \uB9C8\uC138\uC694", body: "Provider \uC758 value \uC5D0 { a, b } \uB97C \uC9C1\uC811 \uC4F0\uBA74 \uB80C\uB354\uB9C1\uB9C8\uB2E4 \uC0C8 \uAC1D\uCCB4\uB77C\uC11C \uAD6C\uB3C5\uD55C \uBAA8\uB4E0 \uCEF4\uD3EC\uB10C\uD2B8\uAC00 \uB2E4\uC2DC \uADF8\uB824\uC9D1\uB2C8\uB2E4. useMemo \uB85C \uACE0\uC815\uD558\uAC70\uB098 Context \uB97C \uC798\uAC8C \uB098\uB204\uC138\uC694." },
    en: { title: "Do not recreate the Context value every render", body: "Writing value={{ a, b }} on a Provider makes a new object on each render, re-rendering every subscriber. Stabilize it with useMemo or split the Context." },
    code: "const value = useMemo(() => ({ user, logout }), [user]);\n<AuthContext.Provider value={value}>"
  },
  {
    id: "error-boundary",
    ko: { title: "\uC5D0\uB7EC \uACBD\uACC4\uB85C \uD654\uBA74 \uC804\uCCB4\uAC00 \uD558\uC598\uC9C0\uB294 \uAC78 \uB9C9\uC73C\uC138\uC694", body: "\uB80C\uB354\uB9C1 \uC911 \uC608\uC678\uAC00 \uB098\uBA74 \uC571 \uC804\uCCB4\uAC00 \uD558\uC597\uAC8C \uBE44\uC5B4\uC694. Error Boundary \uB85C \uC601\uC5ED\uBCC4\uB85C \uAC10\uC2F8 \uB450\uBA74 \uADF8 \uBD80\uBD84\uB9CC \uC548\uB0B4\uB97C \uBCF4\uC5EC \uC8FC\uACE0 \uB098\uBA38\uC9C0\uB294 \uC0B4\uC544 \uC788\uC2B5\uB2C8\uB2E4." },
    en: { title: "Use error boundaries to avoid a whole-screen blank", body: "An exception during rendering blanks the whole app. Wrapping areas in an Error Boundary shows a message just for that part and keeps the rest alive." },
    code: "<ErrorBoundary fallback={<p>\uBB38\uC81C\uAC00 \uC0DD\uACBC\uC5B4\uC694</p>}>\n  <Chart />\n</ErrorBoundary>"
  },
  {
    id: "strict-effects",
    ko: { title: "\uAC1C\uBC1C \uBAA8\uB4DC\uC5D0\uC11C effect \uAC00 \uB450 \uBC88 \uB3C4\uB294 \uAC74 \uC815\uC0C1", body: "StrictMode \uB294 \uC815\uB9AC(cleanup)\uB97C \uC798 \uD588\uB294\uC9C0 \uD655\uC778\uD558\uB824\uACE0 \uAC1C\uBC1C \uC911\uC5D0\uB9CC effect \uB97C \uB450 \uBC88 \uC2E4\uD589\uD569\uB2C8\uB2E4. \uB450 \uBC88 \uB3CC\uC558\uC744 \uB54C \uBB38\uC81C\uAC00 \uC0DD\uAE34\uB2E4\uBA74 \uC815\uB9AC \uD568\uC218\uAC00 \uBE60\uC84C\uB2E4\uB294 \uC2E0\uD638\uC608\uC694." },
    en: { title: "Effects running twice in dev is normal", body: "StrictMode runs effects twice in development only, to check that your cleanup works. If a double run causes problems, the cleanup function is missing." },
    code: "useEffect(() => {\n  const id = setInterval(tick, 1000);\n  return () => clearInterval(id);\n}, []);"
  },
  // ---- 보안 ----
  {
    id: "xss-innerhtml",
    ko: { title: "\uC0AC\uC6A9\uC790 \uC785\uB825\uC744 innerHTML \uC5D0 \uB123\uC9C0 \uB9C8\uC138\uC694", body: "innerHTML\xB7dangerouslySetInnerHTML \uC5D0 \uC0AC\uC6A9\uC790\uAC00 \uC4F4 \uAE00\uC744 \uADF8\uB300\uB85C \uB123\uC73C\uBA74 \uC2A4\uD06C\uB9BD\uD2B8\uAC00 \uC2E4\uD589\uB418\uB294 XSS \uAC00 \uB429\uB2C8\uB2E4. \uAE00\uC790\uB9CC \uBCF4\uC77C \uB54C\uB294 textContent \uB97C \uC4F0\uACE0, HTML \uC774 \uAF2D \uD544\uC694\uD558\uBA74 \uAC80\uC99D\uB41C sanitizer \uB97C \uAC70\uCE58\uC138\uC694." },
    en: { title: "Never put user input into innerHTML", body: "Putting user-written text into innerHTML or dangerouslySetInnerHTML lets scripts run (XSS). Use textContent when you only show text, and run it through a vetted sanitizer if you truly need HTML." },
    code: "el.textContent = userText;           // \uC548\uC804\n// el.innerHTML = userText;         // \uC704\uD5D8"
  },
  {
    id: "csp-basics",
    ko: { title: "CSP \uB294 XSS \uC758 \uB450 \uBC88\uC9F8 \uBC29\uC5B4\uC120", body: "Content-Security-Policy \uB85C \uC2E4\uD589\uC744 \uD5C8\uC6A9\uD560 \uC2A4\uD06C\uB9BD\uD2B8 \uCD9C\uCC98\uB97C \uC81C\uD55C\uD558\uBA74 XSS \uAC00 \uB6AB\uB824\uB3C4 \uD53C\uD574\uB97C \uC904\uC77C \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uC778\uB77C\uC778 \uC2A4\uD06C\uB9BD\uD2B8\uB294 \uB9C9\uACE0 nonce\xB7hash \uB97C \uC4F0\uB294 \uC5C4\uACA9\uD55C \uC815\uCC45\uC774 \uAC00\uC7A5 \uAC15\uB825\uD574\uC694. \uC785\uB825 \uAC80\uC99D\xB7\uCD9C\uB825 \uC778\uCF54\uB529\uACFC \uD568\uAED8 \uC4F0\uB294 \uBCF4\uC870 \uC218\uB2E8\uC785\uB2C8\uB2E4." },
    en: { title: "CSP is a second line of defense against XSS", body: "Limiting which script origins may run with Content-Security-Policy reduces damage even if XSS slips through. A strict policy that blocks inline scripts and uses nonces or hashes is strongest. It complements, not replaces, input validation and output encoding." },
    code: "Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-abc123'",
    source: MDN_CSP
  },
  {
    id: "noopener",
    ko: { title: "\uC0C8 \uD0ED\uC73C\uB85C \uC5EC\uB294 \uC678\uBD80 \uB9C1\uD06C\uC5D0\uB294 rel", body: 'target="_blank" \uB9C1\uD06C\uB294 \uC5F4\uB9B0 \uD398\uC774\uC9C0\uAC00 window.opener \uB85C \uC6D0\uB798 \uD398\uC774\uC9C0\uC5D0 \uC811\uADFC\uD560 \uC218 \uC788\uC5C8\uC2B5\uB2C8\uB2E4. \uC694\uC998 \uBE0C\uB77C\uC6B0\uC800\uB294 \uAE30\uBCF8\uC73C\uB85C \uB9C9\uC9C0\uB9CC rel="noopener noreferrer" \uB97C \uBD99\uC774\uBA74 \uC624\uB798\uB41C \uD658\uACBD\uACFC \uB9AC\uD37C\uB7EC \uB178\uCD9C\uAE4C\uC9C0 \uB300\uBE44\uB3FC\uC694.' },
    en: { title: "Add rel to external links that open in a new tab", body: 'A target="_blank" page could reach the original page through window.opener. Modern browsers block this by default, but rel="noopener noreferrer" also covers older environments and referrer leakage.' },
    code: '<a href="https://example.com" target="_blank" rel="noopener noreferrer">...</a>'
  },
  {
    id: "samesite-cookies",
    ko: { title: "\uCFE0\uD0A4\uC5D0\uB294 HttpOnly\xB7Secure\xB7SameSite", body: "HttpOnly \uB294 JS \uAC00 \uCFE0\uD0A4\uB97C \uC77D\uC9C0 \uBABB\uD558\uAC8C, Secure \uB294 HTTPS \uC5D0\uC11C\uB9CC \uBCF4\uB0B4\uAC8C, SameSite \uB294 \uB2E4\uB978 \uC0AC\uC774\uD2B8\uC5D0\uC11C \uC628 \uC694\uCCAD\uC5D0 \uCFE0\uD0A4\uB97C \uBD99\uC774\uC9C0 \uC54A\uAC8C \uD569\uB2C8\uB2E4(CSRF \uC644\uD654). \uB85C\uADF8\uC778 \uCFE0\uD0A4\uB294 \uC138 \uAC00\uC9C0\uB97C \uBAA8\uB450 \uC758\uC2DD\uD558\uC138\uC694." },
    en: { title: "Cookies: HttpOnly, Secure, SameSite", body: "HttpOnly keeps JS from reading the cookie, Secure sends it only over HTTPS, and SameSite keeps it off cross-site requests (CSRF mitigation). Think about all three for login cookies." },
    code: "Set-Cookie: sid=abc; HttpOnly; Secure; SameSite=Lax; Path=/"
  },
  {
    id: "no-secrets-in-bundle",
    ko: { title: "\uD504\uB860\uD2B8\uC5D4\uB4DC \uCF54\uB4DC\uC5D0 \uBE44\uBC00\uD0A4\uB97C \uB123\uC9C0 \uB9C8\uC138\uC694", body: "\uBC88\uB4E4\uC5D0 \uB4E4\uC5B4\uAC04 \uAC12\uC740 \uB204\uAD6C\uB098 \uAC1C\uBC1C\uC790 \uB3C4\uAD6C\uB85C \uBCFC \uC218 \uC788\uC2B5\uB2C8\uB2E4. VITE_\xB7NEXT_PUBLIC_ \uC811\uB450\uC0AC\uAC00 \uBD99\uC740 \uD658\uACBD\uBCC0\uC218\uB294 \uACF5\uAC1C\uB418\uB294 \uAC12\uC774\uC5D0\uC694. \uBE44\uBC00\uD0A4\uB294 \uC11C\uBC84\uC5D0\uC11C\uB9CC \uC4F0\uACE0, \uD504\uB860\uD2B8\uC5D4\uB4DC\uB294 \uACF5\uAC1C \uAC00\uB2A5\uD55C \uD0A4\uB9CC \uAC00\uC9C0\uC138\uC694." },
    en: { title: "Never put secret keys in frontend code", body: "Anything in the bundle can be read by anyone with dev tools. Env vars prefixed VITE_ or NEXT_PUBLIC_ are public. Keep secret keys on the server only; the frontend should hold only keys that are safe to expose." },
    code: "// \u2717 const key = import.meta.env.VITE_SECRET_KEY\n// \u2713 \uC11C\uBC84(API)\uC5D0\uC11C \uD0A4\uB97C \uC4F0\uACE0, \uD504\uB860\uD2B8\uB294 \uACB0\uACFC\uB9CC \uBC1B\uB294\uB2E4"
  },
  {
    id: "sri",
    ko: { title: "\uC678\uBD80 \uC2A4\uD06C\uB9BD\uD2B8\uC5D0\uB294 SRI \uB85C \uBB34\uACB0\uC131 \uD655\uC778", body: "CDN \uC5D0\uC11C \uBD88\uB7EC\uC624\uB294 \uC2A4\uD06C\uB9BD\uD2B8\uAC00 \uBC14\uB00C\uC5B4\uB3C4 \uC54C\uC544\uCC44\uC9C0 \uBABB\uD558\uBA74 \uC704\uD5D8\uD569\uB2C8\uB2E4. integrity \uC18D\uC131\uC5D0 \uD574\uC2DC\uB97C \uC801\uC73C\uBA74 \uB0B4\uC6A9\uC774 \uB2E4\uB97C \uB54C \uBE0C\uB77C\uC6B0\uC800\uAC00 \uC2E4\uD589\uD558\uC9C0 \uC54A\uC544\uC694." },
    en: { title: "Verify external scripts with SRI", body: "A script loaded from a CDN that changes unnoticed is dangerous. With a hash in the integrity attribute, the browser refuses to run it if the content differs." },
    code: '<script src="https://cdn.example.com/lib.js"\n  integrity="sha384-..." crossorigin="anonymous"></script>'
  },
  // ---- 접근성 ----
  {
    id: "skip-link",
    ko: { title: "'\uBCF8\uBB38\uC73C\uB85C \uAC74\uB108\uB6F0\uAE30' \uB9C1\uD06C\uB97C \uB123\uC73C\uC138\uC694", body: "\uD0A4\uBCF4\uB4DC \uC0AC\uC6A9\uC790\uB294 \uB9E4 \uD398\uC774\uC9C0\uB9C8\uB2E4 \uBA54\uB274\uB97C \uC218\uC2ED \uBC88 Tab \uC73C\uB85C \uC9C0\uB098\uC57C \uBCF8\uBB38\uC5D0 \uB2FF\uC2B5\uB2C8\uB2E4. \uB9E8 \uC55E\uC5D0 \uBCF8\uBB38\uC73C\uB85C \uAC00\uB294 \uB9C1\uD06C\uB97C \uB450\uACE0, \uD3EC\uCEE4\uC2A4\uB97C \uBC1B\uC73C\uBA74 \uBCF4\uC774\uAC8C \uD558\uC138\uC694." },
    en: { title: 'Add a "skip to content" link', body: "Keyboard users must Tab through the menu dozens of times on every page to reach the content. Put a link to the main content first and make it visible when focused." },
    code: '<a class="skip" href="#main">\uBCF8\uBB38\uC73C\uB85C \uAC74\uB108\uB6F0\uAE30</a>\n<main id="main">...</main>'
  },
  {
    id: "dialog-focus",
    ko: { title: "\uBAA8\uB2EC\uC740 <dialog> \uC640 \uD3EC\uCEE4\uC2A4 \uAD00\uB9AC", body: "\uBAA8\uB2EC\uC774 \uC5F4\uB9AC\uBA74 \uD3EC\uCEE4\uC2A4\uB97C \uC548\uC73C\uB85C \uC62E\uAE30\uACE0, \uB2EB\uD788\uBA74 \uC5F4\uC5C8\uB358 \uBC84\uD2BC\uC73C\uB85C \uB3CC\uB824\uC8FC\uC138\uC694. Esc \uB85C \uB2EB\uD600\uC57C \uD558\uACE0\uC694. \uB124\uC774\uD2F0\uBE0C <dialog> \uC758 showModal() \uC740 \uC774\uAC78 \uB300\uBD80\uBD84 \uD574 \uC90D\uB2C8\uB2E4." },
    en: { title: "Modals: use <dialog> and manage focus", body: "When a modal opens, move focus inside; when it closes, return focus to the button that opened it. Esc should close it. The native <dialog> showModal() does most of this for you." },
    code: '<dialog id="d"><form method="dialog"><button>\uB2EB\uAE30</button></form></dialog>\n<script>d.showModal()</script>'
  },
  {
    id: "form-errors",
    ko: { title: "\uC624\uB958\uB294 \uC0C9\uAE54\uB9CC\uC774 \uC544\uB2C8\uB77C \uAE00\uB85C", body: "\uC785\uB825\uCE78\uC774 \uBE68\uAC1C\uC9C0\uAE30\uB9CC \uD558\uBA74 \uC0C9\uC744 \uBABB \uBCF4\uAC70\uB098 \uC2A4\uD06C\uB9B0 \uB9AC\uB354\uB97C \uC4F0\uB294 \uC0AC\uB78C\uC740 \uC624\uB958\uB97C \uBAA8\uB985\uB2C8\uB2E4. \uC624\uB958 \uBA54\uC2DC\uC9C0\uB97C \uAE00\uB85C \uC4F0\uACE0 aria-invalid\xB7aria-describedby \uB85C \uC785\uB825\uCE78\uC5D0 \uC5F0\uACB0\uD558\uC138\uC694." },
    en: { title: "Show errors in words, not just color", body: "If the field only turns red, people who cannot see color or use a screen reader miss the error. Write the message and connect it to the field with aria-invalid and aria-describedby." },
    code: '<input aria-invalid="true" aria-describedby="e1" />\n<p id="e1">\uC774\uBA54\uC77C \uD615\uC2DD\uC774 \uC62C\uBC14\uB974\uC9C0 \uC54A\uC544\uC694</p>'
  },
  {
    id: "touch-target",
    ko: { title: "\uB204\uB974\uB294 \uC601\uC5ED\uC740 \uB109\uB109\uD558\uAC8C", body: "WCAG 2.2 \uB294 \uCD5C\uC18C 24\xD724 CSS px \uB97C \uC694\uAD6C\uD558\uACE0, \uC190\uAC00\uB77D\uC73C\uB85C \uB204\uB974\uAE30 \uD3B8\uD55C \uD06C\uAE30\uB294 44px \uC548\uD30E\uC785\uB2C8\uB2E4. \uC544\uC774\uCF58\uC774 \uC791\uC544\uB3C4 padding \uC73C\uB85C \uB204\uB974\uB294 \uC601\uC5ED\uC744 \uD0A4\uC6B0\uC138\uC694." },
    en: { title: "Make tap targets generous", body: "WCAG 2.2 requires at least 24\xD724 CSS px, and a comfortable size for a finger is around 44px. Even with a small icon, grow the tappable area with padding." },
    code: ".icon-btn { min-width: 44px; min-height: 44px; padding: 10px; }"
  },
  {
    id: "lang-switch",
    ko: { title: "\uB2E4\uB978 \uC5B8\uC5B4\uAC00 \uC11E\uC774\uBA74 lang \uC73C\uB85C \uC54C\uB824 \uC8FC\uC138\uC694", body: '\uD55C\uAD6D\uC5B4 \uBB38\uC11C\uC5D0 \uC601\uC5B4 \uBB38\uC7A5\uC774 \uC788\uC73C\uBA74 \uADF8 \uBD80\uBD84\uC5D0 lang="en" \uC744 \uC8FC\uC138\uC694. \uC2A4\uD06C\uB9B0 \uB9AC\uB354\uAC00 \uADF8 \uAD6C\uAC04\uB9CC \uC601\uC5B4 \uBC1C\uC74C\uC73C\uB85C \uC77D\uC5B4 \uC90D\uB2C8\uB2E4.' },
    en: { title: "Mark other-language passages with lang", body: 'If a Korean page has an English sentence, give that part lang="en" so the screen reader reads just that stretch with English pronunciation.' },
    code: '<p>\uC774 \uAE30\uB2A5\uC740 <span lang="en">progressive enhancement</span> \uBC29\uC2DD\uC774\uC5D0\uC694.</p>'
  },
  {
    id: "heading-outline",
    ko: { title: "\uC81C\uBAA9\uC740 \uAE00\uC790 \uD06C\uAE30\uAC00 \uC544\uB2C8\uB77C \uAD6C\uC870\uB85C", body: "h1 \u2192 h2 \u2192 h3 \uCC98\uB7FC \uB0B4\uC6A9\uC758 \uACC4\uCE35\uB300\uB85C \uC81C\uBAA9 \uD0DC\uADF8\uB97C \uC4F0\uC138\uC694. \uC2A4\uD06C\uB9B0 \uB9AC\uB354 \uC0AC\uC6A9\uC790\uB294 \uC81C\uBAA9 \uBAA9\uB85D\uC73C\uB85C \uD398\uC774\uC9C0\uB97C \uD6D1\uC2B5\uB2C8\uB2E4. \uD06C\uAE30\uB294 CSS \uB85C \uB530\uB85C \uC815\uD558\uC138\uC694." },
    en: { title: "Headings are structure, not font size", body: "Use heading tags in the content's hierarchy: h1 \u2192 h2 \u2192 h3. Screen reader users skim a page through its list of headings. Set the size separately with CSS." },
    code: "<h1>\uC8FC\uBB38</h1>\n  <h2>\uBC30\uC1A1\uC9C0</h2>\n  <h2>\uACB0\uC81C \uC218\uB2E8</h2>"
  },
  // ---- 네트워크 ----
  {
    id: "fetch-ok",
    ko: { title: "fetch \uB294 404\xB7500 \uC5D0\uB3C4 \uC131\uACF5\uC73C\uB85C \uB05D\uB098\uC694", body: "fetch \uB294 \uB124\uD2B8\uC6CC\uD06C\uAC00 \uB04A\uACBC\uC744 \uB54C\uB9CC \uC2E4\uD328\uD558\uACE0, \uC11C\uBC84\uAC00 404\xB7500 \uC744 \uB3CC\uB824\uC918\uB3C4 Promise \uB294 \uC774\uD589\uB429\uB2C8\uB2E4. response.ok \uB97C \uAF2D \uD655\uC778\uD558\uC138\uC694." },
    en: { title: "fetch succeeds even on 404 and 500", body: "fetch rejects only when the network fails; if the server returns 404 or 500 the Promise still resolves. Always check response.ok." },
    code: "const res = await fetch(url);\nif (!res.ok) throw new Error(`HTTP ${res.status}`);"
  },
  {
    id: "optimistic-update",
    ko: { title: "\uC88B\uC544\uC694 \uAC19\uC740 \uAC00\uBCBC\uC6B4 \uB3D9\uC791\uC740 \uB099\uAD00\uC801 \uC5C5\uB370\uC774\uD2B8", body: "\uC11C\uBC84 \uC751\uB2F5\uC744 \uAE30\uB2E4\uB838\uB2E4\uAC00 \uD654\uBA74\uC744 \uBC14\uAFB8\uBA74 \uB290\uB9AC\uAC8C \uB290\uAEF4\uC9D1\uB2C8\uB2E4. \uBA3C\uC800 \uD654\uBA74\uC744 \uBC14\uAFB8\uACE0 \uC2E4\uD328\uD558\uBA74 \uB418\uB3CC\uB9AC\uB294 \uB099\uAD00\uC801 \uC5C5\uB370\uC774\uD2B8\uB85C \uC989\uAC01\uC801\uC778 \uBC18\uC751\uC744 \uC8FC\uC138\uC694." },
    en: { title: 'Optimistic updates for light actions like "like"', body: "Waiting for the server response before updating the screen feels slow. Update the screen first and roll back on failure for an instant response." },
    code: "setLiked(true);\ntry { await api.like(id); } catch { setLiked(false); }"
  },
  // ---- SEO ----
  {
    id: "og-meta",
    ko: { title: "\uB9C1\uD06C \uBBF8\uB9AC\uBCF4\uAE30\uB294 og \uBA54\uD0C0 \uD0DC\uADF8\uB85C", body: "\uCE74\uCE74\uC624\uD1A1\xB7\uC2AC\uB799\uC5D0 \uC8FC\uC18C\uB97C \uBD99\uC600\uC744 \uB54C \uB098\uC624\uB294 \uC81C\uBAA9\xB7\uC124\uBA85\xB7\uC774\uBBF8\uC9C0\uB294 og:title, og:description, og:image \uAC00 \uC815\uD569\uB2C8\uB2E4. \uC5C6\uC73C\uBA74 \uC5C9\uB6B1\uD55C \uAE00\uC774\uB098 \uBE48 \uCE74\uB4DC\uAC00 \uB098\uC640\uC694." },
    en: { title: "Control link previews with og meta tags", body: "The title, description, and image shown when you paste a URL into a chat app come from og:title, og:description, and og:image. Without them you get random text or an empty card." },
    code: '<meta property="og:title" content="\uC81C\uBAA9" />\n<meta property="og:image" content="https://.../thumb.png" />'
  }
];

// dist/shared/tips.js
var BASE_TIPS = [
  {
    id: "semantic-html",
    title: "div \uB300\uC2E0 \uC54C\uB9DE\uC740 \uD0DC\uADF8\uB97C \uC4F0\uC138\uC694",
    body: "\uBC84\uD2BC\uC740 button, \uB9C1\uD06C\uB294 a, \uBAA9\uB85D\uC740 ul/li \uB85C \uC4F0\uBA74 \uD0A4\uBCF4\uB4DC \uC870\uC791\xB7\uC2A4\uD06C\uB9B0 \uB9AC\uB354\xB7\uAC80\uC0C9\uC5D4\uC9C4 \uC9C0\uC6D0\uC774 \uACF5\uC9DC\uB85C \uB530\uB77C\uC635\uB2C8\uB2E4. div \uC5D0 onClick \uC744 \uB2EC\uBA74 \uC774\uAC78 \uC804\uBD80 \uC9C1\uC811 \uB9CC\uB4E4\uC5B4\uC57C \uD574\uC694.",
    code: '<!-- \uB098\uC068 -->\n<div onclick="save()">\uC800\uC7A5</div>\n<!-- \uC88B\uC74C -->\n<button type="button" onclick="save()">\uC800\uC7A5</button>'
  },
  {
    id: "focus-visible",
    title: "outline: none \uC740 \uB300\uCCB4 \uC2A4\uD0C0\uC77C\uACFC \uD568\uAED8",
    body: "\uD3EC\uCEE4\uC2A4 \uD14C\uB450\uB9AC\uB97C \uC9C0\uC6B0\uBA74 \uD0A4\uBCF4\uB4DC \uC0AC\uC6A9\uC790\uB294 \uC9C0\uAE08 \uC5B4\uB514\uC5D0 \uC788\uB294\uC9C0 \uC54C \uC218 \uC5C6\uC2B5\uB2C8\uB2E4. \uC9C0\uC6B0\uB824\uBA74 :focus-visible \uB85C \uB2E4\uB978 \uD45C\uC2DC\uB97C \uAF2D \uB123\uC5B4 \uC8FC\uC138\uC694.",
    code: "button:focus-visible {\n  outline: 2px solid #2563eb;\n  outline-offset: 2px;\n}"
  },
  {
    id: "box-sizing",
    title: "box-sizing: border-box \uB97C \uAE30\uBCF8\uC73C\uB85C",
    body: "\uAE30\uBCF8\uAC12(content-box)\uC5D0\uC11C\uB294 padding \uACFC border \uAC00 width \uC5D0 \uB354\uD574\uC838\uC11C 100% \uD3ED \uC694\uC18C\uAC00 \uBD80\uBAA8\uB97C \uB118\uCE69\uB2C8\uB2E4. border-box \uB294 width \uC548\uC5D0 padding \uACFC border \uB97C \uD3EC\uD568\uD574\uC694.",
    code: "*, *::before, *::after {\n  box-sizing: border-box;\n}"
  },
  {
    id: "flex-min-width",
    title: "flex \uC790\uC2DD\uC774 \uC548 \uC904\uC5B4\uB4E4\uBA74 min-width: 0",
    body: "flex \uD56D\uBAA9\uC758 min-width \uAE30\uBCF8\uAC12\uC740 auto \uB77C\uC11C \uAE34 \uD14D\uC2A4\uD2B8\uAC00 \uC788\uC73C\uBA74 \uC904\uC5B4\uB4E4\uC9C0 \uC54A\uACE0 \uBD80\uBAA8\uB97C \uB118\uCE69\uB2C8\uB2E4. min-width: 0 \uC744 \uC8FC\uBA74 \uC904\uC5B4\uB4E4 \uC218 \uC788\uACE0, \uB9D0\uC904\uC784\uB3C4 \uADF8\uC81C\uC57C \uB3D9\uC791\uD574\uC694.",
    code: ".item {\n  min-width: 0;\n  overflow: hidden;\n  text-overflow: ellipsis;\n}"
  },
  {
    id: "rem-vs-px",
    title: "\uAE00\uC790 \uD06C\uAE30\uB294 px \uBCF4\uB2E4 rem",
    body: "px \uB85C \uACE0\uC815\uD558\uBA74 \uC0AC\uC6A9\uC790\uAC00 \uBE0C\uB77C\uC6B0\uC800 \uAE00\uC790 \uD06C\uAE30\uB97C \uD0A4\uC6CC\uB3C4 \uBC18\uC601\uB418\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4. rem \uC740 \uC0AC\uC6A9\uC790 \uC124\uC815\uC744 \uB530\uB77C\uAC00\uC11C \uC2DC\uB825\uC774 \uC57D\uD55C \uC0AC\uC6A9\uC790\uC5D0\uAC8C \uB3C4\uC6C0\uC774 \uB3FC\uC694.",
    code: "body { font-size: 1rem; }\nh1 { font-size: 2rem; }"
  },
  {
    id: "list-key",
    title: "React \uBAA9\uB85D\uC758 key \uB294 \uC548\uC815\uC801\uC778 id \uB85C",
    body: "\uBC30\uC5F4 \uC778\uB371\uC2A4\uB97C key \uB85C \uC4F0\uBA74 \uD56D\uBAA9\uC774 \uCD94\uAC00\xB7\uC0AD\uC81C\xB7\uC815\uB82C\uB420 \uB54C \uC0C1\uD0DC\uAC00 \uC5C9\uB6B1\uD55C \uD56D\uBAA9\uC5D0 \uBD99\uC744 \uC218 \uC788\uC2B5\uB2C8\uB2E4. \uB370\uC774\uD130\uAC00 \uAC00\uC9C4 \uACE0\uC720 id \uB97C \uC4F0\uC138\uC694.",
    code: "{todos.map((t) => (\n  <TodoItem key={t.id} todo={t} />\n))}"
  },
  {
    id: "effect-cleanup",
    title: "useEffect \uB294 \uC815\uB9AC(cleanup)\uAE4C\uC9C0 \uD55C \uC138\uD2B8",
    body: "\uAD6C\uB3C5\xB7\uD0C0\uC774\uBA38\xB7\uC774\uBCA4\uD2B8 \uB9AC\uC2A4\uB108\uB294 \uC815\uB9AC \uD568\uC218\uC5D0\uC11C \uD574\uC81C\uD574\uC57C \uD569\uB2C8\uB2E4. \uC548 \uADF8\uB7EC\uBA74 \uD654\uBA74\uC744 \uC624\uAC08 \uB54C\uB9C8\uB2E4 \uC313\uC5EC\uC11C \uBA54\uBAA8\uB9AC \uB204\uC218\uC640 \uC911\uBCF5 \uC2E4\uD589\uC774 \uC0DD\uACA8\uC694.",
    code: "useEffect(() => {\n  const id = setInterval(tick, 1000);\n  return () => clearInterval(id);\n}, []);"
  },
  {
    id: "fetch-race",
    title: "\uC694\uCCAD \uC21C\uC11C\uAC00 \uB4A4\uC9D1\uD788\uB294 \uACBD\uC7C1 \uC0C1\uD0DC",
    body: "\uAC80\uC0C9\uC5B4\uB97C \uBE60\uB974\uAC8C \uBC14\uAFB8\uBA74 \uBA3C\uC800 \uBCF4\uB0B8 \uC694\uCCAD\uC774 \uB098\uC911\uC5D0 \uB3C4\uCC29\uD574 \uD654\uBA74\uC744 \uB36E\uC5B4\uC4F8 \uC218 \uC788\uC2B5\uB2C8\uB2E4. AbortController \uB85C \uC774\uC804 \uC694\uCCAD\uC744 \uCDE8\uC18C\uD558\uC138\uC694.",
    code: "const ctrl = new AbortController();\nfetch(url, { signal: ctrl.signal });\n// \uC815\uB9AC \uD568\uC218\uC5D0\uC11C ctrl.abort()"
  },
  {
    id: "loading-error-empty",
    title: "\uD654\uBA74\uC5D0\uB294 4\uAC00\uC9C0 \uC0C1\uD0DC\uAC00 \uC788\uC5B4\uC694",
    body: "\uB370\uC774\uD130\uAC00 \uC788\uB294 \uD654\uBA74\uB9CC \uB9CC\uB4E4\uBA74 \uB85C\uB529 \uC911, \uC624\uB958, \uBE48 \uBAA9\uB85D\uC5D0\uC11C \uD654\uBA74\uC774 \uAE68\uC9C0\uAC70\uB098 \uD558\uC597\uAC8C \uBE44\uC5B4\uC694. AI \uAC00 \uB9CC\uB4E0 \uD654\uBA74\uC5D0\uC11C \uAC00\uC7A5 \uC790\uC8FC \uBE60\uC9C0\uB294 \uBD80\uBD84\uC785\uB2C8\uB2E4.",
    code: "if (isLoading) return <Spinner />;\nif (error) return <ErrorMessage error={error} />;\nif (items.length === 0) return <Empty />;\nreturn <List items={items} />;"
  },
  {
    id: "json-parse-try",
    title: "JSON.parse \uC640 localStorage \uB294 try/catch",
    body: "\uC800\uC7A5\uB41C \uAC12\uC774 \uAE68\uC84C\uAC70\uB098 \uBE44\uC5B4 \uC788\uC73C\uBA74 JSON.parse \uAC00 \uC608\uC678\uB97C \uB358\uC838 \uC571 \uC804\uCCB4\uAC00 \uBA48\uCDA5\uB2C8\uB2E4. \uC678\uBD80\uC5D0\uC11C \uC628 \uAC12\uC740 \uD56D\uC0C1 \uC2E4\uD328\uD560 \uC218 \uC788\uB2E4\uACE0 \uC0DD\uAC01\uD558\uC138\uC694.",
    code: 'function load() {\n  try {\n    return JSON.parse(localStorage.getItem("cart") ?? "[]");\n  } catch {\n    return [];\n  }\n}'
  },
  {
    id: "debounce",
    title: "\uC785\uB825\uB9C8\uB2E4 \uC694\uCCAD\uD558\uC9C0 \uB9D0\uACE0 debounce",
    body: "\uAC80\uC0C9\uCC3D\uC5D0\uC11C \uAE00\uC790\uB9C8\uB2E4 API \uB97C \uBD80\uB974\uBA74 \uC11C\uBC84 \uBD80\uD558\uC640 \uAE5C\uBE61\uC784\uC774 \uC0DD\uAE41\uB2C8\uB2E4. \uC785\uB825\uC774 \uC7A0\uC2DC \uBA48\uCDC4\uC744 \uB54C \uD55C \uBC88\uB9CC \uC694\uCCAD\uD558\uC138\uC694.",
    code: "useEffect(() => {\n  const t = setTimeout(() => search(q), 300);\n  return () => clearTimeout(t);\n}, [q]);"
  },
  {
    id: "promise-all",
    title: "\uC11C\uB85C \uBB34\uAD00\uD55C \uC694\uCCAD\uC740 Promise.all",
    body: "\uB3C5\uB9BD\uC801\uC778 \uC694\uCCAD\uC744 await \uB85C \uCC28\uB840\uB85C \uAE30\uB2E4\uB9AC\uBA74 \uC2DC\uAC04\uC774 \uB354\uD574\uC9D1\uB2C8\uB2E4. Promise.all \uB85C \uB3D9\uC2DC\uC5D0 \uBCF4\uB0B4\uBA74 \uAC00\uC7A5 \uB290\uB9B0 \uAC83\uB9CC\uD07C\uB9CC \uAC78\uB824\uC694.",
    code: "const [user, orders] = await Promise.all([\n  getUser(id),\n  getOrders(id),\n]);"
  },
  {
    id: "layout-shift",
    title: "\uC774\uBBF8\uC9C0 \uD06C\uAE30\uB97C \uBBF8\uB9AC \uC54C\uB824 \uC8FC\uC138\uC694",
    body: "\uC774\uBBF8\uC9C0\uAC00 \uB2A6\uAC8C \uB85C\uB4DC\uB418\uBA70 \uD06C\uAE30\uAC00 \uC0DD\uAE30\uBA74 \uC544\uB798 \uB0B4\uC6A9\uC774 \uBC00\uB824\uB0A9\uB2C8\uB2E4(CLS). width/height \uC18D\uC131\uC774\uB098 aspect-ratio \uB85C \uC790\uB9AC\uB97C \uBBF8\uB9AC \uC7A1\uC544 \uB450\uC138\uC694.",
    code: '<img src="/a.jpg" width="640" height="360" alt="..." />\n\nimg { aspect-ratio: 16 / 9; }'
  },
  {
    id: "lazy-image",
    title: '\uD654\uBA74 \uC544\uB798 \uC774\uBBF8\uC9C0\uB294 loading="lazy"',
    body: "\uCC98\uC74C \uBCF4\uC774\uC9C0 \uC54A\uB294 \uC774\uBBF8\uC9C0\uAE4C\uC9C0 \uD55C\uAEBC\uBC88\uC5D0 \uBC1B\uC73C\uBA74 \uCD08\uAE30 \uB85C\uB529\uC774 \uB290\uB824\uC9D1\uB2C8\uB2E4. \uB2E8, \uCCAB \uD654\uBA74\uC5D0 \uBCF4\uC774\uB294 \uD070 \uC774\uBBF8\uC9C0\uB294 lazy \uB97C \uC4F0\uC9C0 \uB9C8\uC138\uC694.",
    code: '<img src="/gallery-1.jpg" loading="lazy" alt="..." />'
  },
  {
    id: "reduced-motion",
    title: "\uC560\uB2C8\uBA54\uC774\uC158 \uC904\uC774\uAE30 \uC124\uC815\uC744 \uC874\uC911\uD558\uC138\uC694",
    body: '\uC5B4\uC9C0\uB7EC\uC6C0\uC744 \uB290\uB07C\uB294 \uC0AC\uC6A9\uC790\uB294 OS \uC5D0\uC11C "\uB3D9\uC791 \uC904\uC774\uAE30"\uB97C \uCF2D\uB2C8\uB2E4. prefers-reduced-motion \uC73C\uB85C \uD070 \uC6C0\uC9C1\uC784\uC744 \uB044\uAC70\uB098 \uC904\uC774\uC138\uC694.',
    code: "@media (prefers-reduced-motion: reduce) {\n  * { animation: none !important; transition: none !important; }\n}"
  },
  {
    id: "aria-live",
    title: "\uBC14\uB00C\uB294 \uC54C\uB9BC\uC740 aria-live \uB85C",
    body: "\uC800\uC7A5\uB428\xB7\uC624\uB958 \uAC19\uC740 \uD1A0\uC2A4\uD2B8 \uBA54\uC2DC\uC9C0\uB294 \uB208\uC73C\uB85C \uBCF4\uB294 \uC0AC\uC6A9\uC790\uC5D0\uAC8C\uB9CC \uC804\uB2EC\uB429\uB2C8\uB2E4. aria-live \uC601\uC5ED\uC5D0 \uB123\uC73C\uBA74 \uC2A4\uD06C\uB9B0 \uB9AC\uB354\uB3C4 \uC77D\uC5B4 \uC90D\uB2C8\uB2E4.",
    code: '<div role="status" aria-live="polite">\uC800\uC7A5\uD588\uC5B4\uC694</div>'
  },
  {
    id: "z-index-context",
    title: "z-index \uB294 \uC313\uC784 \uB9E5\uB77D \uC548\uC5D0\uC11C\uB9CC \uBE44\uAD50\uB3FC\uC694",
    body: "z-index: 9999 \uB97C \uC918\uB3C4 \uBD80\uBAA8\uAC00 \uC0C8 \uC313\uC784 \uB9E5\uB77D(position+z-index, transform, opacity \uB4F1)\uC744 \uB9CC\uB4E4\uBA74 \uADF8 \uBC14\uAE65 \uC694\uC18C\uB97C \uC774\uAE30\uC9C0 \uBABB\uD569\uB2C8\uB2E4. \uBAA8\uB2EC\uC740 body \uBC14\uB85C \uC544\uB798\uC5D0 \uB450\uC138\uC694.",
    code: "/* \uBAA8\uB2EC\uC740 \uD3EC\uD138\uB85C body \uBC14\uB85C \uC544\uB798\uC5D0 \uB80C\uB354\uB9C1 */\ncreatePortal(<Modal />, document.body);"
  },
  {
    id: "controlled-input",
    title: "value \uB9CC \uC8FC\uACE0 onChange \uAC00 \uC5C6\uC73C\uBA74 \uC785\uB825\uC774 \uC548 \uB3FC\uC694",
    body: "React \uC5D0\uC11C value \uB97C \uB118\uAE30\uBA74 \uADF8 \uAC12\uC774 \uD56D\uC0C1 \uD654\uBA74\uC744 \uACB0\uC815\uD569\uB2C8\uB2E4. onChange \uB85C \uC0C1\uD0DC\uB97C \uBC14\uAFD4 \uC8FC\uC9C0 \uC54A\uC73C\uBA74 \uC785\uB825\uD574\uB3C4 \uC544\uBB34 \uBCC0\uD654\uAC00 \uC5C6\uC5B4\uC694. \uCD08\uAE30\uAC12\uB9CC \uD544\uC694\uD558\uBA74 defaultValue \uB97C \uC4F0\uC138\uC694.",
    code: '<input value={name} onChange={(e) => setName(e.target.value)} />\n<input defaultValue="\uD64D\uAE38\uB3D9" />'
  },
  {
    id: "cors-basics",
    title: "CORS \uC624\uB958\uB294 \uBE0C\uB77C\uC6B0\uC800\uAC00 \uB9C9\uB294 \uAC70\uC608\uC694",
    body: "\uC11C\uBC84\uB07C\uB9AC\uB294 CORS \uAC00 \uC5C6\uC2B5\uB2C8\uB2E4. \uBE0C\uB77C\uC6B0\uC800\uAC00 \uB2E4\uB978 \uCD9C\uCC98\uC758 \uC751\uB2F5\uC744 JS \uC5D0 \uB118\uACA8\uC8FC\uC9C0 \uC54A\uB294 \uBCF4\uC548 \uADDC\uCE59\uC774\uB77C\uC11C, \uD574\uACB0\uC740 \uC11C\uBC84\uAC00 \uD5C8\uC6A9 \uD5E4\uB354\uB97C \uBCF4\uB0B4\uAC70\uB098 \uAC1C\uBC1C \uC911\uC5D0\uB294 \uD504\uB85D\uC2DC\uB97C \uC4F0\uB294 \uAC83\uC785\uB2C8\uB2E4.",
    code: '// vite.config.ts\nserver: { proxy: { "/api": "http://localhost:8080" } }'
  },
  {
    id: "defer-script",
    title: "\uC2A4\uD06C\uB9BD\uD2B8\uB294 defer \uB85C \uBD88\uB7EC\uC624\uC138\uC694",
    body: "<head> \uC758 \uC77C\uBC18 script \uB294 \uB0B4\uB824\uBC1B\uACE0 \uC2E4\uD589\uD558\uB294 \uB3D9\uC548 HTML \uD30C\uC2F1\uC744 \uBA48\uCDA5\uB2C8\uB2E4. defer \uB294 \uD30C\uC2F1\uC744 \uB9C9\uC9C0 \uC54A\uACE0, \uBB38\uC11C\uAC00 \uB2E4 \uB9CC\uB4E4\uC5B4\uC9C4 \uB4A4 \uC21C\uC11C\uB300\uB85C \uC2E4\uD589\uD574\uC694.",
    code: '<script src="/app.js" defer></script>'
  }
];
var TIPS = [
  ...BASE_TIPS.map((t) => ({ ...t, en: TIPS_EN[t.id] })),
  ...EXTRA_TIPS.map((t) => ({ id: t.id, title: t.ko.title, body: t.ko.body, code: t.code, en: t.en, ...t.source ? { source: t.source } : {} }))
];
var TIP_EVERY_MS = 20 * 6e4;
var TIP_PENDING_MS = 10 * 6e4;

// dist/shared/rarity.js
var hasLegendFormRarity = (r) => r === "legend" || r === "hidden";
var PITY_RESETS_ON = ["legend", "hidden"];

// dist/shared/cosmetics.js
var A = (id, rarity, gacha = true) => ({ kind: "accessory", id, rarity, gacha });
var V = (id, rarity) => ({ kind: "variant", id, rarity, gacha: true });
var N = (id, rarity) => ({ kind: "neck", id, rarity, gacha: true });
var E = (id, rarity) => ({ kind: "effect", id, rarity, gacha: true });
var P = (id, rarity) => ({ kind: "prop", id, rarity, gacha: true });
var COSMETIC_ITEMS = [
  // 일반
  A("ribbon", "common"),
  A("sprout", "common"),
  A("flower", "common"),
  A("cap", "common"),
  // 고급
  A("partyhat", "uncommon"),
  A("glasses", "uncommon"),
  A("chef", "uncommon"),
  A("santa", "uncommon"),
  V("pastel", "uncommon"),
  // 희귀
  A("witch", "rare"),
  A("halo", "rare"),
  V("deep", "rare"),
  // 특별
  A("crown", "special"),
  V("mono", "special"),
  // 전설
  A("wings", "legend"),
  // 새 머리 장식(2단계)
  A("beret", "common"),
  A("beanie", "common"),
  A("bandana", "common"),
  A("cowboy", "uncommon"),
  A("headphones", "uncommon"),
  A("pirate", "rare"),
  A("knight", "rare"),
  A("devil", "special"),
  A("unicornhorn", "special"),
  A("flamecrown", "legend"),
  // 새 종류(3단계): 목 장식과 효과(모두 꾸미기 뽑기 전용)
  N("bell", "common"),
  N("scarf", "common"),
  N("bowtie", "uncommon"),
  E("sparkles", "uncommon"),
  E("hearts", "uncommon"),
  N("pearl", "rare"),
  E("notes", "rare"),
  E("snow", "rare"),
  N("starpendant", "special"),
  N("goldchain", "legend"),
  E("flameaura", "legend"),
  // 소품(4단계): 펫 곁을 따라다니는 물건(모두 꾸미기 뽑기 전용)
  // 움직이는 물건이라 장식보다 한 단계 높은 등급이다(일반 소품은 없다)
  P("ball", "uncommon"),
  P("bone", "uncommon"),
  P("fish", "rare"),
  P("balloon", "rare"),
  P("pot", "special"),
  P("butterfly", "special"),
  P("lantern", "legend"),
  P("dragonegg", "legend"),
  P("yarn", "uncommon"),
  P("kite", "rare"),
  P("snowman", "special"),
  P("cloud", "legend"),
  // 업적 전용(뽑기에는 나오지 않는다)
  A("headband", "rare", false),
  A("antenna", "rare", false),
  A("bunnyears", "rare", false),
  A("eyepatch", "rare", false),
  A("monocle", "rare", false),
  A("star", "special", false)
];
var cosmeticItem = (kind, id) => COSMETIC_ITEMS.find((i) => i.kind === kind && i.id === id);
var cosmeticRarity = (kind, id) => cosmeticItem(kind, id)?.rarity ?? "common";

// dist/shared/growth.js
var emptyGrowth = () => ({
  days: [],
  counters: { confirms: 0, fixes: 0, quizCorrect: 0, tips: 0, care: 0, washes: 0, strolls: 0 },
  rules: {},
  achievements: {}
});
var pad = (n) => String(n).padStart(2, "0");
function localDay(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function dayNumber(day) {
  const [y, m, d] = day.split("-").map(Number);
  return Math.floor(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1) / 864e5);
}
function streakOf(days, today) {
  const nums = [...new Set(days.map(dayNumber))].sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  let prev = -Infinity;
  for (const n of nums) {
    run = n === prev + 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = n;
  }
  const set = new Set(nums);
  const t = dayNumber(today);
  let cursor = set.has(t) ? t : set.has(t - 1) ? t - 1 : null;
  let current = 0;
  while (cursor !== null && set.has(cursor)) {
    current++;
    cursor--;
  }
  return { current, best };
}
var ACHIEVEMENTS = [
  { id: "first-confirm", name: "\uCCAB \uBC30\uC6C0", description: "\uBC30\uC6C0 \uCE74\uB4DC\uB97C \uCC98\uC74C \uD655\uC778\uD588\uC5B4\uC694", metric: "confirms", goal: 1, xp: 5 },
  { id: "confirm-10", name: "\uC5F4\uC2EC\uD788 \uBC30\uC6B0\uB294 \uC911", description: "\uBC30\uC6C0 \uCE74\uB4DC\uB97C 10\uBC88 \uD655\uC778\uD588\uC5B4\uC694", metric: "confirms", goal: 10, xp: 15 },
  { id: "confirm-50", name: "FE \uAFC8\uB098\uBB34", description: "\uBC30\uC6C0 \uCE74\uB4DC\uB97C 50\uBC88 \uD655\uC778\uD588\uC5B4\uC694", metric: "confirms", goal: 50, xp: 40 },
  { id: "quiz-5", name: "\uD034\uC988 \uCC99\uCC99", description: "\uD655\uC778 \uD034\uC988\uB97C 5\uBC88 \uB9DE\uD614\uC5B4\uC694", metric: "quizCorrect", goal: 5, xp: 10 },
  { id: "quiz-25", name: "\uD034\uC988 \uBC15\uC0AC", description: "\uD655\uC778 \uD034\uC988\uB97C 25\uBC88 \uB9DE\uD614\uC5B4\uC694", metric: "quizCorrect", goal: 25, xp: 30 },
  { id: "first-fix", name: "\uCCAB \uC218\uC815", description: "\uD3AB\uC774 \uCC3E\uC740 \uBB38\uC81C\uB97C \uCC98\uC74C \uACE0\uCCE4\uC5B4\uC694", metric: "fixes", goal: 1, xp: 10 },
  { id: "fix-10", name: "\uBB38\uC81C \uD574\uACB0\uC0AC", description: "\uCC3E\uC740 \uBB38\uC81C\uB97C 10\uAC1C \uACE0\uCCE4\uC5B4\uC694", metric: "fixes", goal: 10, xp: 30 },
  { id: "fix-30", name: "FE \uC7A5\uC778", description: "\uCC3E\uC740 \uBB38\uC81C\uB97C 30\uAC1C \uACE0\uCCE4\uC5B4\uC694", metric: "fixes", goal: 30, xp: 80 },
  { id: "rules-5", name: "\uB2E4\uC12F \uAC00\uC9C0 \uAE30\uBCF8\uAE30", description: "\uC11C\uB85C \uB2E4\uB978 \uBB38\uC81C 5\uC885\uC744 \uBC30\uC6E0\uC5B4\uC694", metric: "rulesLearned", goal: 5, xp: 20 },
  { id: "rules-10", name: "\uC5F4 \uAC00\uC9C0 \uAE30\uBCF8\uAE30", description: "\uC11C\uB85C \uB2E4\uB978 \uBB38\uC81C 10\uC885\uC744 \uBC30\uC6E0\uC5B4\uC694", metric: "rulesLearned", goal: 10, xp: 40 },
  { id: "rules-all", name: "\uB3C4\uAC10 \uC644\uC131", description: "\uBAA8\uB4E0 \uC885\uB958\uC758 \uBB38\uC81C\uB97C \uD55C \uBC88\uC529 \uBC30\uC6E0\uC5B4\uC694", metric: "rulesLearned", goal: RULE_IDS.length, xp: 100 },
  { id: "tips-10", name: "\uC9C0\uC2DD \uC218\uC9D1\uAC00", description: "FE \uC9C0\uC2DD\uC744 10\uAC1C \uC77D\uC5C8\uC5B4\uC694", metric: "tipsSeen", goal: 10, xp: 10 },
  { id: "tips-all", name: "\uC9C0\uC2DD \uBC15\uC0AC", description: "\uBAA8\uB4E0 FE \uC9C0\uC2DD\uC744 \uC77D\uC5C8\uC5B4\uC694", metric: "tipsSeen", goal: TIPS.length, xp: 50 },
  { id: "streak-3", name: "\uC0AC\uD758 \uC5F0\uC18D", description: "3\uC77C \uC5F0\uC18D\uC73C\uB85C \uD3AB\uACFC \uD568\uAED8\uD588\uC5B4\uC694", metric: "streak", goal: 3, xp: 10 },
  { id: "streak-7", name: "\uC77C\uC8FC\uC77C \uC5F0\uC18D", description: "7\uC77C \uC5F0\uC18D\uC73C\uB85C \uD3AB\uACFC \uD568\uAED8\uD588\uC5B4\uC694", metric: "streak", goal: 7, xp: 30 },
  { id: "streak-30", name: "\uD55C \uB2EC \uC5F0\uC18D", description: "30\uC77C \uC5F0\uC18D\uC73C\uB85C \uD3AB\uACFC \uD568\uAED8\uD588\uC5B4\uC694", metric: "streak", goal: 30, xp: 100 },
  { id: "care-50", name: "\uB2E4\uC815\uD55C \uCE5C\uAD6C", description: "\uC4F0\uB2E4\uB4EC\uACE0, \uBC25 \uC8FC\uACE0, \uB180\uC544 \uC900 \uD69F\uC218\uAC00 50\uBC88\uC774\uC5D0\uC694", metric: "care", goal: 50, xp: 10 },
  { id: "care-200", name: "\uAE08\uC190 \uC9D1\uC0AC", description: "\uB3CC\uBD10 \uC900 \uD69F\uC218\uAC00 200\uBC88\uC774\uC5D0\uC694", metric: "care", goal: 200, xp: 60 },
  { id: "wash-20", name: "\uAE54\uB054\uC7C1\uC774", description: "\uD3AB\uC744 20\uBC88 \uC53B\uACBC\uC5B4\uC694", metric: "washes", goal: 20, xp: 30 },
  { id: "stroll-10", name: "\uC0B0\uCC45 \uCE5C\uAD6C", description: "\uC0B0\uCC45\uC744 10\uBC88 \uB2E4\uB140\uC654\uC5B4\uC694", metric: "strolls", goal: 10, xp: 30 },
  { id: "collect-5", name: "\uB3D9\uBB3C \uC218\uC9D1\uAC00", description: "\uC11C\uB85C \uB2E4\uB978 \uB3D9\uBB3C\uC744 5\uC885 \uBAA8\uC558\uC5B4\uC694", metric: "collected", goal: 5, xp: 40 },
  { id: "pull-10", name: "\uBF51\uAE30 \uB2E8\uACE8", description: "\uB3D9\uBB3C \uBF51\uAE30\uB97C 10\uBC88 \uD588\uC5B4\uC694", metric: "pulls", goal: 10, xp: 40 },
  { id: "hidden-1", name: "\uC804\uC124\uC758 \uB9CC\uB0A8", description: "\uD788\uB4E0 \uB3D9\uBB3C\uC744 \uCC98\uC74C \uB9CC\uB0AC\uC5B4\uC694", metric: "hiddenOwned", goal: 1, xp: 80 },
  { id: "friend-1", name: "\uCCAB \uCE5C\uAD6C", description: "\uCE5C\uAD6C\uB97C \uCC98\uC74C \uC0AC\uADC0\uC5C8\uC5B4\uC694", metric: "friends", goal: 1, xp: 10 },
  { id: "friend-3", name: "\uCE5C\uAD6C \uBD80\uC790", description: "\uCE5C\uAD6C\uAC00 3\uBA85\uC774 \uB418\uC5C8\uC5B4\uC694", metric: "friends", goal: 3, xp: 25 },
  { id: "friendship-3", name: "\uB2E8\uC9DD", description: "\uCE5C\uAD6C\uC640 \uCE5C\uBC00\uB3C4 \uB808\uBCA8 3\uC774 \uB418\uC5C8\uC5B4\uC694", metric: "friendLevel", goal: 3, xp: 25 },
  { id: "friendship-5", name: "\uC808\uCE5C", description: "\uCE5C\uAD6C\uC640 \uCE5C\uBC00\uB3C4 \uB808\uBCA8 5\uAC00 \uB418\uC5C8\uC5B4\uC694", metric: "friendLevel", goal: 5, xp: 50 },
  { id: "friendship-10", name: "\uC601\uD63C\uC758 \uB2E8\uC9DD", description: "\uCE5C\uAD6C\uC640 \uCE5C\uBC00\uB3C4 \uB808\uBCA8 10\uC774 \uB418\uC5C8\uC5B4\uC694", metric: "friendLevel", goal: 10, xp: 150 },
  { id: "cos-5", name: "\uC637\uC7A5 \uCC44\uC6B0\uAE30", description: "\uAFB8\uBBF8\uAE30\uB97C 5\uAC1C \uBAA8\uC558\uC5B4\uC694", metric: "cosmetics", goal: 5, xp: 20 },
  { id: "cos-15", name: "\uD328\uC154\uB2C8\uC2A4\uD0C0", description: "\uAFB8\uBBF8\uAE30\uB97C 15\uAC1C \uBAA8\uC558\uC5B4\uC694", metric: "cosmetics", goal: 15, xp: 50 },
  { id: "cos-legend", name: "\uC804\uC124\uC758 \uC637\uC7A5", description: "\uC804\uC124 \uAFB8\uBBF8\uAE30\uB97C \uC5BB\uC5C8\uC5B4\uC694", metric: "legendCosmetics", goal: 1, xp: 80 },
  { id: "prop-1", name: "\uCCAB \uC18C\uD488", description: "\uC18C\uD488\uC744 \uCC98\uC74C \uC5BB\uC5C8\uC5B4\uC694", metric: "props", goal: 1, xp: 20 },
  { id: "prop-all", name: "\uC18C\uD488 \uC218\uC9D1\uAC00", description: "\uC18C\uD488\uC744 \uBAA8\uB450 \uBAA8\uC558\uC5B4\uC694", metric: "props", goal: COSMETIC_ITEMS.filter((i) => i.kind === "prop").length, xp: 100 },
  { id: "cos-all", name: "\uC637\uC7A5 \uC644\uC131", description: "\uBF51\uAE30\uC5D0 \uB098\uC624\uB294 \uAFB8\uBBF8\uAE30\uB97C \uBAA8\uB450 \uBAA8\uC558\uC5B4\uC694", metric: "cosmetics", goal: COSMETIC_ITEMS.filter((i) => i.gacha).length, xp: 200 }
];
function rulesLearned(g) {
  return RULE_IDS.filter((id) => (g.rules[id]?.confirms ?? 0) > 0).length;
}
function metricValue(g, ctx, metric, today) {
  switch (metric) {
    case "confirms":
      return g.counters.confirms;
    case "fixes":
      return g.counters.fixes;
    case "quizCorrect":
      return g.counters.quizCorrect;
    case "rulesLearned":
      return rulesLearned(g);
    case "tipsSeen":
      return ctx.tipsSeen;
    case "streak":
      return streakOf(g.days, today).best;
    case "care":
      return g.counters.care;
    case "washes":
      return g.counters.washes;
    case "strolls":
      return g.counters.strolls;
    case "collected":
      return ctx.collected ?? 0;
    case "pulls":
      return ctx.pulls ?? 0;
    case "hiddenOwned":
      return ctx.hiddenOwned ?? 0;
    case "friends":
      return ctx.friends ?? 0;
    case "friendLevel":
      return ctx.friendLevel ?? 0;
    case "cosmetics":
      return ctx.cosmetics ?? 0;
    case "legendCosmetics":
      return ctx.legendCosmetics ?? 0;
    case "props":
      return ctx.props ?? 0;
  }
}
function buildCodex(g, ctx, now) {
  const today = localDay(now);
  const streak = streakOf(g.days, today);
  return {
    streak: { ...streak, totalDays: g.days.length },
    counters: { ...g.counters },
    rulesLearned: rulesLearned(g),
    rulesTotal: RULE_IDS.length,
    tipsSeen: ctx.tipsSeen,
    tipsTotal: TIPS.length,
    ...ctx.cosmeticProgress ? { cosmetics: ctx.cosmeticProgress } : {},
    rules: RULE_IDS.map((id) => {
      const stat = g.rules[id] ?? { confirms: 0, fixes: 0 };
      const status = stat.fixes > 0 ? "fixed" : stat.confirms > 0 ? "learned" : "unseen";
      return { id, title: status === "unseen" ? "???" : LESSONS[id].title, status, confirms: stat.confirms, fixes: stat.fixes };
    }),
    achievements: ACHIEVEMENTS.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      xp: a.xp,
      unlocked: g.achievements[a.id] !== void 0,
      // 달성했으면 목표까지 채운 것으로 보여 준다(스트릭이 끊겨 현재 값이 줄어도 달성은 그대로).
      progress: g.achievements[a.id] !== void 0 ? a.goal : Math.min(a.goal, metricValue(g, ctx, a.metric, today)),
      goal: a.goal
    }))
  };
}

// dist/shared/art/color.js
function parse(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [n >> 16 & 255, n >> 8 & 255, n & 255];
}
function toHex(rgb) {
  return `#${rgb.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`;
}
function mix(a, b, t) {
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  return toHex([ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t]);
}
function tone(base, opts = {}) {
  const { shadow = "#5a3d7a", dark = 0.3, light = 0.4 } = opts;
  return { base, dark: mix(base, shadow, dark), light: mix(base, "#ffffff", light) };
}

// dist/shared/pixel.js
var SIZE = 32;
function blank() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill("."));
}
function px(g, x, y, c) {
  const ix = Math.round(x);
  const iy = Math.round(y);
  const row = g[iy];
  if (row && ix >= 0 && ix < SIZE)
    row[ix] = c;
}
function rect(g, x, y, w, h, c) {
  const x0 = Math.round(x);
  const y0 = Math.round(y);
  const x1 = Math.round(x + w);
  const y1 = Math.round(y + h);
  for (let yy = y0; yy < y1; yy++)
    for (let xx = x0; xx < x1; xx++)
      px(g, xx, yy, c);
}
function ellipse(g, cx, cy, rx, ry, c) {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1)
        px(g, x, y, c);
    }
  }
}
function triangle(g, x1, y1, x2, y2, x3, y3, c) {
  const sign = (ax, ay, bx, by, cx, cy) => (ax - cx) * (by - cy) - (bx - cx) * (ay - cy);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const p = { x: x + 0.5, y: y + 0.5 };
      const d1 = sign(p.x, p.y, x1, y1, x2, y2);
      const d2 = sign(p.x, p.y, x2, y2, x3, y3);
      const d3 = sign(p.x, p.y, x3, y3, x1, y1);
      const neg = d1 < 0 || d2 < 0 || d3 < 0;
      const pos = d1 > 0 || d2 > 0 || d3 > 0;
      if (!(neg && pos))
        px(g, x, y, c);
    }
  }
}
function line(g, x1, y1, x2, y2, c, thickness = 1) {
  const steps = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) * 2));
  const r = thickness / 2;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    if (thickness <= 1)
      px(g, Math.round(x), Math.round(y), c);
    else
      ellipse(g, x, y, r, r, c);
  }
}
function markEllipse(g, cx, cy, rx, ry, c) {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1 && g[y]?.[x] !== void 0 && g[y]?.[x] !== ".")
        px(g, x, y, c);
    }
  }
}
function shift(g, dx, dy) {
  const out = blank();
  g.forEach((row, y) => row.forEach((c, x) => {
    if (c !== ".")
      px(out, x + dx, y + dy, c);
  }));
  return out;
}
function toRows(g) {
  return g.map((row) => row.join(""));
}
function shadeGrid(t, shade) {
  const src = t.map((row) => [...row]);
  const empty = (x, y) => (src[y]?.[x] ?? ".") === ".";
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const m = shade[src[y]?.[x] ?? "."];
      if (!m)
        continue;
      if (empty(x, y + 1))
        px(t, x, y, m.dark);
      else if (empty(x, y - 1))
        px(t, x, y, m.light);
    }
  }
}
function stamp(g, t, outline2) {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if ((t[y]?.[x] ?? ".") !== ".")
        continue;
      if (outline2 === null)
        continue;
      const near = (t[y]?.[x - 1] ?? ".") !== "." || (t[y]?.[x + 1] ?? ".") !== "." || (t[y - 1]?.[x] ?? ".") !== "." || (t[y + 1]?.[x] ?? ".") !== ".";
      if (near)
        px(g, x, y, outline2);
    }
  }
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const c = t[y]?.[x] ?? ".";
      if (c !== ".")
        px(g, x, y, c);
    }
  }
}
function part(g, draw, opts) {
  const t = blank();
  draw(t);
  if (opts.shade)
    shadeGrid(t, opts.shade);
  stamp(g, t, opts.outline);
}
function outline(g, c = "k") {
  const filled = (x, y) => {
    const v = g[y]?.[x];
    return v !== void 0 && v !== ".";
  };
  return g.map((row, y) => row.map((cell, x) => {
    if (cell !== ".")
      return cell;
    const near = filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1);
    return near ? c : ".";
  }).join(""));
}

// dist/shared/art/detail.js
var FINE_CHARS = "HSQR";
function fineDetail(g, x, y, rows, chars, main, gem) {
  const filled = (rx, ry) => {
    const ch = rows[ry]?.[rx];
    return ch !== void 0 && ch !== "." && ch !== " ";
  };
  rows.forEach((row, ry) => {
    [...row].forEach((ch, rx) => {
      const bx = x + rx * 2;
      const by = y + ry * 2;
      if (ch === main) {
        if (!filled(rx, ry - 1))
          rect(g, bx, by, 2, 1, chars.hi);
        if (!filled(rx, ry + 1))
          rect(g, bx, by + 1, 2, 1, chars.sh);
      } else if (ch === gem) {
        px(g, bx, by, chars.hi);
      }
    });
  });
}

// dist/shared/art/chunky.js
var PRIORITY = ["e", "n", "m", "t", "k"];
function pickOf(cells3) {
  const counts = /* @__PURE__ */ new Map();
  for (const c of cells3)
    if (c !== ".")
      counts.set(c, (counts.get(c) ?? 0) + 1);
  const filled = [...counts.values()].reduce((x, y) => x + y, 0);
  const k = counts.get("k") ?? 0;
  if (filled < 2 && k === 0)
    return ".";
  for (const key of ["e", "n"])
    if ((counts.get(key) ?? 0) >= 2)
      return key;
  const edge = filled < 4;
  if (edge && k >= 1)
    return "k";
  let best = "";
  let bestCount = 0;
  const rank = (c) => {
    const i = PRIORITY.indexOf(c);
    return i < 0 ? 99 : i;
  };
  for (const [ch, n] of counts) {
    if (ch === "k")
      continue;
    if (n > bestCount || n === bestCount && rank(ch) < rank(best)) {
      best = ch;
      bestCount = n;
    }
  }
  return best === "" ? "k" : best;
}
function chunky(rows) {
  const out = [];
  const fine = (c) => c !== void 0 && FINE_CHARS.includes(c);
  for (let by = 0; by < SIZE; by += 2) {
    let a = "";
    let b = "";
    for (let bx = 0; bx < SIZE; bx += 2) {
      const raw = [rows[by]?.[bx], rows[by]?.[bx + 1], rows[by + 1]?.[bx], rows[by + 1]?.[bx + 1]];
      const cells3 = raw.map((c) => fine(c) || c === void 0 ? "." : c);
      const ch = pickOf(cells3);
      a += (fine(raw[0]) ? raw[0] : ch) + (fine(raw[1]) ? raw[1] : ch);
      b += (fine(raw[2]) ? raw[2] : ch) + (fine(raw[3]) ? raw[3] : ch);
    }
    out.push(a, b);
  }
  return out;
}

// dist/shared/art/accessory.js
var ACCESSORIES = [
  "none",
  "ribbon",
  "glasses",
  "crown",
  "wings",
  "sprout",
  "flower",
  "partyhat",
  "halo",
  "cap",
  "witch",
  "chef",
  "santa",
  "headband",
  "antenna",
  "bunnyears",
  "eyepatch",
  "monocle",
  "star",
  "beret",
  "beanie",
  "bandana",
  "cowboy",
  "headphones",
  "pirate",
  "knight",
  "devil",
  "unicornhorn",
  "flamecrown"
];
var ACCESSORY_COLORS = {
  none: { X: "#ffffff", Y: "#ffffff" },
  ribbon: { X: "#ff6b8b", Y: "#c2385a" },
  glasses: { X: "#ffffff", Y: "#2b3a55" },
  crown: { X: "#ffd84a", Y: "#e5484d" },
  wings: { X: "#a8dcff", Y: "#4a9fe0" },
  sprout: { X: "#6fcf6f", Y: "#2f9a45" },
  flower: { X: "#ff9ecb", Y: "#ffd04a" },
  partyhat: { X: "#5ab8ff", Y: "#ff6b8b" },
  halo: { X: "#fff3a0", Y: "#ffd04a" },
  cap: { X: "#e5484d", Y: "#8f1f27" },
  witch: { X: "#6a3fc8", Y: "#ffd84a" },
  chef: { X: "#ffffff", Y: "#cfd6e6" },
  santa: { X: "#e5484d", Y: "#ffffff" },
  headband: { X: "#ff6fae", Y: "#ffd84a" },
  antenna: { X: "#ff4f8b", Y: "#9a2a55" },
  bunnyears: { X: "#ffffff", Y: "#ffb3c8" },
  eyepatch: { X: "#2b2b3a", Y: "#2b2b3a" },
  monocle: { X: "#ffd04a", Y: "#8a6b1c" },
  star: { X: "#ffe14a", Y: "#ffa62e" },
  beret: { X: "#c43a4a", Y: "#7a1f2a" },
  beanie: { X: "#4a9bff", Y: "#ffffff" },
  bandana: { X: "#e5484d", Y: "#ffffff" },
  cowboy: { X: "#c8975a", Y: "#7a5230" },
  headphones: { X: "#3a3f5a", Y: "#ff6b8b" },
  pirate: { X: "#2b2b3a", Y: "#f2f2f2" },
  knight: { X: "#aeb8c4", Y: "#e5484d" },
  devil: { X: "#e5484d", Y: "#7a1f2a" },
  unicornhorn: { X: "#ffffff", Y: "#ffd34a" },
  flamecrown: { X: "#ff9b2e", Y: "#ffd34a" }
};
var even = (n) => Math.round(n / 2) * 2;
function cells(t, x, y, rows) {
  rows.forEach((row, ry) => {
    [...row].forEach((ch, rx) => {
      if (ch !== "." && ch !== " ")
        rect(t, x + rx * 2, y + ry * 2, 2, 2, ch);
    });
  });
}
var isHighGrade = (r) => r === "special" || PITY_RESETS_ON.includes(r);
var fineNow = false;
function placeOnHead(g, head, rows, opts = {}) {
  const overlap = opts.overlap ?? 2;
  const bottom = even(head.cy - head.ry) + overlap;
  const room = Math.max(2, Math.floor(bottom / 2));
  const fitted = [...rows];
  while (fitted.length > room && fitted.length > 2)
    fitted.splice(Math.floor((fitted.length - 1) / 2), 1);
  const width = (fitted[0]?.length ?? 0) * 2;
  const x = even(head.cx + head.rx * (opts.dx ?? 0)) - Math.round(width / 2);
  const y = Math.max(0, bottom - fitted.length * 2);
  part(g, (t) => cells(t, x, y, fitted), { outline: "k" });
  if (fineNow)
    fineDetail(g, x, y, fitted, { hi: "H", sh: "S" }, "X", "Y");
}
function ringBlocks(t, cx, cy, rIn, rOut, ch, keep) {
  const r = Math.ceil(rOut / 2) * 2 + 2;
  for (let y = even(cy) - r; y <= even(cy) + r; y += 2) {
    for (let x = even(cx) - r; x <= even(cx) + r; x += 2) {
      const d = Math.hypot(x + 1 - cx, y + 1 - cy);
      if (d >= rIn && d <= rOut && (!keep || keep(x, y)))
        rect(t, x, y, 2, 2, ch);
    }
  }
}
function drawHeadAccessory(g, acc, head, eyes) {
  fineNow = acc !== void 0 && acc !== "none" && isHighGrade(cosmeticRarity("accessory", acc));
  switch (acc) {
    case "crown":
      placeOnHead(g, head, ["X..X..X", "XXXXXXX", "XYXYXYX"]);
      break;
    case "ribbon":
      placeOnHead(g, head, ["XX..XX", "XXYYXX", "XX..XX"], { dx: -0.35 });
      break;
    case "sprout":
      placeOnHead(g, head, ["XX...XX", "XXX.XXX", ".XXYXX.", "...Y...", "...Y..."]);
      break;
    case "flower":
      placeOnHead(g, head, [".X.X.", "XXXXX", "XXYXX", "XXXXX", ".X.X."], { dx: -0.35 });
      break;
    case "partyhat":
      placeOnHead(g, head, ["..Y..", "..X..", ".XYX.", ".XXX.", "XYXYX"]);
      break;
    case "halo":
      placeOnHead(g, head, [".YXXY.", "X....X", ".YXXY."], { overlap: -2 });
      break;
    case "cap":
      placeOnHead(g, head, [".XXXX..", "XXXXXX.", "YYYYYYY"]);
      break;
    case "witch":
      placeOnHead(g, head, ["...X...", "...X...", "..XXX..", "..XYX..", ".XXXXX.", "XXXXXXX"]);
      break;
    case "chef":
      placeOnHead(g, head, [".X.X.", "XXXXX", "XXXXX", "XXXXX", "YYYYY"]);
      break;
    case "santa":
      placeOnHead(g, head, ["..XXY.", ".XXXX.", "XXXXXX", "YYYYYY"]);
      break;
    case "headband": {
      part(g, (t) => ringBlocks(t, head.cx, head.cy, Math.min(head.rx, head.ry) - 1.2, Math.max(head.rx, head.ry) + 0.8, "X", (_x, y) => y + 1 < head.cy - head.ry * 0.25 && y + 1 > head.cy - head.ry - 3), { outline: "k" });
      placeOnHead(g, head, ["..Y..", ".YYY.", "..Y.."], { dx: 0.15, overlap: 0 });
      break;
    }
    case "antenna":
      placeOnHead(g, head, ["X.X", "XXX", ".X.", ".Y.", ".Y."], { dx: -0.2 });
      break;
    case "bunnyears":
      placeOnHead(g, head, ["XX...XX", "XY...YX", "XY...YX", "XXXXXXX"]);
      break;
    case "eyepatch": {
      const e = eyes[0];
      if (!e)
        break;
      const ex = e.x - (e.x & 1);
      const ey = e.y - (e.y & 1);
      line(g, ex - 2, ey - 1, ex - 9, ey - 6, "X", 1);
      rect(g, ex - 2, ey - 2, 6, 6, "X");
      break;
    }
    case "monocle": {
      const e = eyes[0];
      if (!e)
        break;
      const ex = e.x - (e.x & 1);
      const ey = e.y - (e.y & 1);
      part(g, (t) => ringBlocks(t, ex + 1, ey + 1, 3, 5.4, "X"), { outline: "k" });
      for (const [dx, dy] of [[-2, 6], [-4, 8], [-4, 10], [-2, 12]])
        rect(g, ex + dx, ey + dy, 2, 2, "Y");
      break;
    }
    case "star": {
      placeOnHead(g, head, ["..X..", ".XXX.", "XXYXX", ".XXX.", "..X.."], { overlap: 0 });
      const top = even(head.cy - head.ry);
      const sx = even(head.cx);
      rect(g, sx - 10, Math.max(0, top - 8), 2, 2, "Y");
      rect(g, sx + 8, Math.max(0, top - 6), 2, 2, "Y");
      break;
    }
    case "beret":
      placeOnHead(g, head, ["..Y...", ".XXXX.", "XXXXXX"]);
      break;
    case "beanie":
      placeOnHead(g, head, ["..YY..", ".XXXX.", "XXXXXX", "YYYYYY"]);
      break;
    case "bandana":
      placeOnHead(g, head, ["XXXXXXX", "XYXYXYX", "..XXX.."]);
      break;
    case "cowboy":
      placeOnHead(g, head, ["...XXX...", "..XXXXX..", "YYYYYYYYY"]);
      break;
    case "headphones":
      placeOnHead(g, head, [".XXXXXX.", "X......X", "YY....YY"]);
      break;
    case "pirate":
      placeOnHead(g, head, ["..XXXX..", "XXXYYXXX", "XXXXXXXX"]);
      break;
    case "knight":
      placeOnHead(g, head, ["..Y..", ".YYY.", "XXXXX", "XXXXX", "XXXXX"]);
      break;
    case "devil":
      placeOnHead(g, head, ["X.....X", "XX...XX", ".X...X."]);
      break;
    case "unicornhorn":
      placeOnHead(g, head, [".Y.", ".X.", "XYX", "XXX"]);
      break;
    case "flamecrown":
      placeOnHead(g, head, ["..Y...Y..", ".YXY.YXY.", "XXXXXXXXX", "XYXYXYXYX"]);
      break;
    case "glasses": {
      const e = eyes[0];
      if (!e)
        break;
      const ex = e.x - (e.x & 1);
      const ey = e.y - (e.y & 1);
      rect(g, ex - 2, ey - 2, 10, 2, "X");
      rect(g, ex - 2, ey, 10, 4, "Y");
      rect(g, ex, ey + 1, 2, 1, "X");
      rect(g, ex - 8, ey - 2, 6, 2, "Y");
      break;
    }
    default:
      break;
  }
}
function wingKind(spec) {
  if (spec.accessory === "wings")
    return "wings";
  return spec.bodyWings ? "natural" : spec.accessory;
}
function drawHorns(g, kind, head) {
  if (!kind)
    return;
  const x = even(head.cx - head.rx * 0.35);
  const rowsOf = {
    pair: ["p", "p", "p"],
    ossicones: ["a", "p", "p"],
    antler: ["p.p", "ppp", ".p."],
    single: ["p", "p", "p", "p"]
  };
  const rows = rowsOf[kind];
  const y = Math.max(2, even(head.cy - head.ry) - (rows.length * 2 - 2));
  const at = kind === "antler" ? [x - 2, x + 8] : kind === "single" ? [x + 4] : [x, x + 6];
  part(g, (t) => {
    for (const hx of at)
      cells(t, hx, y, rows);
  }, { outline: "k" });
}
function drawBackWings(g, acc, x, y, size) {
  if (acc !== "wings" && acc !== "natural")
    return;
  const X = acc === "wings" ? "X" : "p";
  const Y = acc === "wings" ? "Y" : "P";
  const s = Math.max(0.7, size) * 1.05;
  const bx = even(x);
  const by = even(y);
  if (acc === "wings") {
    const rows = ["XXY....", "XXXY...", "XYXXY..", ".XXYXXY", "..XXYXX", "...XXXX"];
    part(g, (t) => cells(t, bx - 12, Math.max(0, by - 11), rows), { outline: "k" });
    fineDetail(g, bx - 12, Math.max(0, by - 11), rows, { hi: "H", sh: "S" }, "X", "Y");
    void s;
    return;
  }
  part(g, (t) => {
    line(t, bx, by, bx - 9 * s, by - 3 * s, X, 3 * s);
    line(t, bx, by, bx - 7 * s, by - 8 * s, X, 3 * s);
    line(t, bx, by, bx - 2 * s, by - 11 * s, X, 3 * s);
    px(t, Math.round(bx - 9 * s), Math.round(by - 3 * s), Y);
    px(t, Math.round(bx - 7 * s), Math.round(by - 8 * s), Y);
    px(t, Math.round(bx - 2 * s), Math.round(by - 11 * s), Y);
    triangle(t, bx + 1, by + 1, bx - 4 * s, by + 1, bx - 1, by - 3 * s, X);
  }, { outline: "k" });
}

// dist/shared/art/extras.js
var NECKS = ["none", "bell", "scarf", "bowtie", "pearl", "starpendant", "goldchain"];
var NECK_COLORS = {
  none: { N: "#ffffff", M: "#ffffff" },
  bell: { N: "#e5484d", M: "#ffd34a" },
  scarf: { N: "#4a9bff", M: "#ffffff" },
  bowtie: { N: "#e5484d", M: "#7a1f2a" },
  pearl: { N: "#ffffff", M: "#cfd6e6" },
  starpendant: { N: "#ffe14a", M: "#8a6b1c" },
  goldchain: { N: "#ffd34a", M: "#c98a1a" }
};
var EFFECTS = ["none", "sparkles", "hearts", "notes", "snow", "flameaura"];
var EFFECT_COLORS = {
  none: { U: "#ffffff", V: "#ffffff" },
  sparkles: { U: "#ffe14a", V: "#ffffff" },
  hearts: { U: "#ff6b8b", V: "#ffb3c8" },
  notes: { U: "#7a5cff", V: "#b8a8ff" },
  snow: { U: "#bfe3f7", V: "#ffffff" },
  flameaura: { U: "#ff9b2e", V: "#ffd34a" }
};
var isNeck = (v) => typeof v === "string" && NECKS.includes(v);
var isEffect = (v) => typeof v === "string" && EFFECTS.includes(v);
var even2 = (n) => Math.round(n / 2) * 2;
function cells2(t, x, y, rows) {
  rows.forEach((row, ry) => {
    [...row].forEach((ch, rx) => {
      if (ch !== "." && ch !== " ")
        rect(t, x + rx * 2, y + ry * 2, 2, 2, ch);
    });
  });
}
var NECK_ROWS = {
  // 빨간 목줄에 금빛 방울
  bell: ["NNNNNN", "..MM.."],
  // 줄무늬 스카프와 늘어진 끝
  scarf: ["NNNNNN", "MNMNMN", "..NM.."],
  // 나비넥타이
  bowtie: ["NN.NN", "NNMNN", "NN.NN"],
  // 진주 목걸이
  pearl: ["MMMMMM", ".NNNN.", "..NN.."],
  // 별 펜던트
  starpendant: ["MMMMMM", "..NN..", ".NNNN.", "..NN.."],
  // 굵은 황금 목걸이
  goldchain: ["NNNNNNN", "MNMNMNM", ".MNNNM.", "..MNM.."]
};
function drawNeckAccessory(g, neck, head) {
  if (!neck || neck === "none")
    return;
  const rows = NECK_ROWS[neck];
  const width = (rows[0]?.length ?? 0) * 2;
  const x = even2(head.cx - head.rx * 0.2) - Math.round(width / 2);
  const y = even2(head.cy + head.ry * 0.72);
  part(g, (t) => cells2(t, x, y, rows), { outline: "k" });
  if (neck === "starpendant" || neck === "goldchain")
    fineDetail(g, x, y, rows, { hi: "Q", sh: "R" }, "N", "M");
}
function applyEffect(rows, effect) {
  if (!effect || effect === "none")
    return [...rows];
  const grid = rows.map((r) => [...r]);
  const free = (x, y) => grid[y]?.[x] === ".";
  const put = (x, y, art) => {
    art.forEach((line2, ry) => {
      [...line2].forEach((ch, rx) => {
        if (ch === ".")
          return;
        for (let dy = 0; dy < 2; dy++) {
          for (let dx = 0; dx < 2; dx++) {
            const px2 = x + rx * 2 + dx;
            const py = y + ry * 2 + dy;
            if (free(px2, py))
              grid[py][px2] = ch;
          }
        }
      });
    });
  };
  if (effect === "sparkles") {
    const plus = [".U.", "UVU", ".U."];
    put(2, 2, plus);
    put(24, 0, plus);
    put(26, 14, [".U.", "UUU", ".U."]);
    put(0, 12, [".V."]);
  } else if (effect === "hearts") {
    const heart = ["U.U", "UUU", ".U."];
    put(2, 2, heart);
    put(24, 4, ["V.V", "VVV", ".V."]);
    put(26, 18, heart);
  } else if (effect === "notes") {
    put(2, 2, [".UU", ".U.", "UV."]);
    put(24, 2, [".VV", ".V.", "UU."]);
    put(26, 16, [".UU", ".U.", "UV."]);
  } else if (effect === "snow") {
    const flake = ["U.U", ".V.", "U.U"];
    put(2, 2, flake);
    put(24, 0, flake);
    put(0, 14, [".U.", "UVU", ".U."]);
    put(26, 14, flake);
  } else if (effect === "flameaura") {
    const filled = (bx, by) => {
      const ch = rows[by * 2]?.[bx * 2];
      return ch !== void 0 && ch !== ".";
    };
    for (let by = 0; by < 16; by++) {
      for (let bx = 0; bx < 16; bx++) {
        if (filled(bx, by))
          continue;
        let near = false;
        for (let dy = -1; dy <= 1 && !near; dy++)
          for (let dx = -1; dx <= 1; dx++)
            if ((dx || dy) && filled(bx + dx, by + dy))
              near = true;
        if (!near)
          continue;
        const ch = (bx + by) % 2 === 0 ? "U" : "V";
        for (let dy = 0; dy < 2; dy++)
          for (let dx = 0; dx < 2; dx++)
            grid[by * 2 + dy][bx * 2 + dx] = ch;
      }
    }
    for (let by = 0; by < 16; by++) {
      for (let bx = 0; bx < 16; bx++) {
        if (grid[by * 2]?.[bx * 2] !== "." || (bx * 7 + by * 13) % 6 !== 0)
          continue;
        let ring = false;
        for (let dy = -1; dy <= 1 && !ring; dy++)
          for (let dx = -1; dx <= 1; dx++)
            if ((dx || dy) && "UV".includes(grid[(by + dy) * 2]?.[(bx + dx) * 2] ?? "."))
              ring = true;
        if (ring)
          grid[by * 2][bx * 2] = "V";
      }
    }
  }
  return grid.map((r) => r.join(""));
}

// dist/shared/art/style.js
var VARIANTS = ["default", "pastel", "deep", "mono"];
var DEFAULT_STYLE = { variant: "default", accessory: "none" };
var isVariant = (v) => typeof v === "string" && VARIANTS.includes(v);
var isAccessory = (v) => typeof v === "string" && ACCESSORIES.includes(v);
function gray(hex) {
  const n = parseInt(hex.slice(1), 16);
  const v = Math.round(0.3 * (n >> 16 & 255) + 0.59 * (n >> 8 & 255) + 0.11 * (n & 255));
  const h = v.toString(16).padStart(2, "0");
  return `#${h}${h}${h}`;
}
function tintHex(hex, variant) {
  switch (variant) {
    case "pastel":
      return mix(hex, "#ffffff", 0.4);
    case "deep":
      return mix(hex, "#2a1f33", 0.3);
    case "mono":
      return mix(gray(hex), hex, 0.12);
    // 거의 회색, 원래 색기만 살짝 남긴다
    default:
      return hex;
  }
}
var tintTone = (t, v) => ({ base: tintHex(t.base, v), dark: tintHex(t.dark, v), light: tintHex(t.light, v) });
function tintLook(look, variant) {
  if (variant === "default")
    return look;
  return {
    ...look,
    fur: tintTone(look.fur, variant),
    belly: tintTone(look.belly, variant),
    inner: tintTone(look.inner, variant),
    accent: tintTone(look.accent, variant),
    beak: tintTone(look.beak, variant),
    head: tintTone(look.head, variant)
  };
}
function neckPalette(neck) {
  const c = NECK_COLORS[neck ?? "none"];
  return { ...c, Q: mix(c.N, "#ffffff", 0.65), R: mix(c.N, "#2a1f33", 0.4) };
}
function effectPalette(effect) {
  return EFFECT_COLORS[effect ?? "none"];
}
function accessoryPalette(acc) {
  const c = ACCESSORY_COLORS[acc];
  return { ...c, H: mix(c.X, "#ffffff", 0.65), S: mix(c.X, "#2a1f33", 0.4) };
}

// dist/shared/art/types.js
var asTone = (v, fallback) => v === void 0 ? tone(fallback) : typeof v === "string" ? tone(v) : v;
function makeLook(partial) {
  const fur = asTone(partial.fur, "#f0a04b");
  return {
    outline: partial.outline ?? "#5a3a2e",
    fur,
    belly: asTone(partial.belly, "#fff0d8"),
    inner: asTone(partial.inner, "#f6a9b8"),
    accent: asTone(partial.accent, "#d9822b"),
    beak: asTone(partial.beak, "#ff9a3c"),
    head: partial.head === void 0 ? fur : asTone(partial.head, "#ffffff"),
    eye: partial.eye ?? "#33222a",
    nose: partial.nose ?? "#e8758c",
    blush: partial.blush ?? "#ff9db0",
    tongue: partial.tongue ?? "#ff7f95"
  };
}
function paletteOf(look) {
  return {
    k: look.outline,
    e: look.eye,
    m: look.eye,
    w: "#ffffff",
    f: look.fur.base,
    F: look.fur.dark,
    h: look.fur.light,
    b: look.belly.base,
    B: look.belly.dark,
    i: look.inner.base,
    I: look.inner.dark,
    a: look.accent.base,
    A: look.accent.dark,
    p: look.beak.base,
    P: look.beak.dark,
    g: look.head.base,
    G: look.head.dark,
    n: look.nose,
    r: look.blush,
    t: look.tongue
  };
}
var SHADE = {};
var leg = (dx = 0, lift = 0) => ({ dx, lift });
function basePose(over = {}) {
  return {
    dy: 0,
    crouch: 0,
    wing: 0,
    sway: 0,
    stretch: 0,
    headDx: 0,
    headDy: 0,
    legs: { ff: leg(), fn: leg(), bf: leg(), bn: leg() },
    tailAngle: 40,
    tailCurl: 20,
    ears: "up",
    eyes: "open",
    mouth: "none",
    ...over
  };
}

// dist/shared/art/hang-arms.js
function drawHangArms(g, s) {
  const k = Math.max(s.scale, 0.85);
  const handY = 2.2 * k;
  for (const sx of [-1, 1]) {
    const shoulderX = s.cx + sx * (s.reach - 3);
    const elbowX = s.cx + sx * s.reach + sx * s.sway * 0.3;
    const handX = s.cx + sx * (s.reach - 0.4);
    const elbowY = s.shoulderY - (s.shoulderY - handY) * 0.5;
    part(g, (t) => {
      line(t, shoulderX, s.shoulderY, elbowX, elbowY, s.arm, 2.8 * k);
      line(t, elbowX, elbowY, handX, handY, s.arm, 2.8 * k);
      ellipse(t, handX, handY, 2 * k, 1.9 * k, s.hand);
    }, { outline: "k", shade: SHADE });
  }
}

// dist/shared/art/bird.js
var hasTuft = (spec) => spec.tuft ?? spec.kind === "chick";
var GROUND = 30;
var CX = 16;
function makeRig(spec, stage) {
  const baby = stage === "baby";
  const size = baby ? 0.66 : 1;
  return {
    spec,
    baby,
    size,
    headMod: baby ? 1.18 : 1,
    X: (x) => CX + (x - CX) * size,
    Y: (y) => GROUND - (GROUND - y) * size
  };
}
var lowered = (r, oy, ox = 0) => ({ ...r, X: (x) => r.X(x) + ox, Y: (y) => r.Y(y) + oy });
var headChar = (r) => r.spec.kind === "duck" || r.spec.coloredHead ? "g" : "f";
function drawEye(g, ex0, ey0, kind) {
  const ex = ex0 - (ex0 & 1);
  const ey = ey0 - (ey0 & 1);
  switch (kind) {
    // 반짝임 없는 까만 콩 눈(세세하게 그리면 오히려 덜 귀여웠다)
    case "open":
      rect(g, ex, ey + 1, 2, 2, "e");
      break;
    case "wide":
      rect(g, ex - 1, ey, 3, 4, "e");
      break;
    case "closed":
      rect(g, ex, ey + 2, 3, 1, "e");
      px(g, ex, ey + 1, "e");
      px(g, ex + 2, ey + 1, "e");
      break;
    case "happy":
      px(g, ex, ey + 3, "e");
      px(g, ex + 1, ey + 2, "e");
      px(g, ex + 2, ey + 3, "e");
      break;
    case "sleepy":
      rect(g, ex, ey + 1, 3, 1, "e");
      rect(g, ex, ey + 2, 3, 2, "e");
      break;
    case "dizzy":
      px(g, ex, ey + 1, "e");
      px(g, ex + 1, ey + 2, "e");
      px(g, ex + 2, ey + 3, "e");
      px(g, ex + 2, ey + 1, "e");
      px(g, ex, ey + 3, "e");
      break;
  }
}
function drawBeak(g, r, bx, by, open) {
  const wide = r.spec.kind === "duck";
  const len = (wide ? 5 : 4) * Math.max(r.size, 0.85);
  const hgt = (wide ? 4 : 3.6) * Math.max(r.size, 0.85);
  if (!open) {
    part(g, (t) => triangle(t, bx, by - hgt / 2, bx, by + hgt / 2, bx + len, by + hgt * 0.15, "p"), { outline: "k", shade: SHADE });
    return;
  }
  part(g, (t) => triangle(t, bx, by - hgt / 2 - 0.4, bx, by + 0.4, bx + len, by - hgt * 0.1, "p"), { outline: "k", shade: SHADE });
  part(g, (t) => triangle(t, bx, by + 1.6, bx, by + hgt / 2 + 1.8, bx + len * 0.8, by + 2.4, "P"), { outline: "k" });
  px(g, bx + 1, by + 1, "t");
}
function drawLegs(g, r, pose, hidden) {
  if (hidden)
    return;
  const pairs = [
    [pose.legs.bn, 12.2],
    [pose.legs.fn, 17.4]
  ];
  for (const [l, x] of pairs) {
    const lx = Math.round(r.X(x) + l.dx * r.size);
    const top = Math.round(r.Y(26.5) + pose.crouch * r.size);
    const bottom = GROUND - Math.round(l.lift * r.size);
    part(g, (t) => {
      rect(t, lx, top, 2, Math.max(1, bottom - top + 1), "p");
      rect(t, lx - 1, bottom, 5, 1, "p");
    }, { outline: "k" });
  }
}
function drawWing(g, r, pose, cx, cy) {
  const w = pose.wing;
  part(g, (t) => {
    if (w <= 0) {
      ellipse(t, cx, cy, (r.spec.kind === "duck" ? 5.4 : 4.6) * r.size, 3.5 * r.size, "a");
    } else {
      const reach = w >= 2 ? 11 : 6;
      line(t, cx + 2 * r.size, cy - 1 * r.size, cx - 4 * r.size, cy - reach * r.size, "a", 4.6 * r.size);
      ellipse(t, cx - 4 * r.size, cy - reach * r.size, 2.4 * r.size, 2.8 * r.size, "a");
    }
  }, { outline: "k", shade: SHADE });
}
function drawFace(g, r, pose, head) {
  const ex = Math.round(head.cx + head.rx * 0.22);
  const ey = Math.round(head.cy - head.ry * 0.25);
  drawEye(g, ex, ey, pose.eyes);
  drawBeak(g, r, Math.round(head.cx + head.rx * 0.96), Math.round(head.cy + head.ry * 0.12), pose.mouth === "open" || pose.mouth === "chew");
  drawNeckAccessory(g, r.spec.neck, head);
  drawHeadAccessory(g, r.spec.accessory, head, [{ x: ex, y: ey }]);
}
function drawHead(g, r, pose) {
  const k = r.size * r.headMod;
  const head = { cx: r.X(20.6) + pose.headDx * r.size, cy: r.Y(14.2) + pose.headDy * r.size, rx: 6.9 * k, ry: 6.3 * k };
  if (r.spec.kind === "duck") {
    part(g, (t) => ellipse(t, head.cx - 1.5 * k, head.cy + 4.4 * k, 4.4 * k, 4.6 * k, "g"), { outline: "k", shade: SHADE });
  }
  const hc = headChar(r);
  part(g, (t) => {
    ellipse(t, head.cx, head.cy, head.rx, head.ry, hc);
    if (r.spec.kind === "chick") {
      markEllipse(t, head.cx + head.rx * 0.2, head.cy + head.ry * 0.55, head.rx * 0.7, head.ry * 0.4, "b");
    }
  }, { outline: "k", shade: SHADE });
  if (hasTuft(r.spec)) {
    for (const [dx, h] of [[0.4, 4]]) {
      part(g, (t) => triangle(t, head.cx + dx * k - 1.4, head.cy - head.ry + 1.4, head.cx + dx * k + 1.4, head.cy - head.ry + 1.4, head.cx + dx * k, head.cy - head.ry - h * k + 1, headChar(r)), { outline: "k", shade: SHADE });
    }
    part(g, (t) => ellipse(t, head.cx, head.cy, head.rx, head.ry, headChar(r)), { outline: null, shade: SHADE });
  }
  drawFace(g, r, pose, head);
  return head;
}
function drawBody(g, r, cx, cy, rx, ry) {
  part(g, (t) => {
    ellipse(t, cx, cy, rx, ry, "f");
    markEllipse(t, cx + rx * 0.25, cy + ry * 0.6, rx * 0.75, ry * 0.5, "b");
  }, { outline: "k", shade: SHADE });
  void r;
}
function drawFan(g, r, cx, cy, scale) {
  const k = r.size * scale;
  const fx = cx + 4 * k;
  const fy = cy - 5.8 * k;
  const frx = 8.4 * k;
  const fry = 9.6 * k;
  part(g, (t) => ellipse(t, fx, fy, frx, fry, "b"), { outline: "k" });
  const ring = (rr, from, to, n) => {
    for (let i = 0; i < n; i++) {
      const a = (from + (to - from) * i / Math.max(1, n - 1)) * Math.PI / 180;
      const x = fx + Math.cos(a) * frx * rr;
      const y = fy - Math.sin(a) * fry * rr;
      rect(g, x - 1, y - 1, 3, 3, "p");
      px(g, x, y, "A");
    }
  };
  if (scale >= 0.8) {
    ring(0.78, 60, 200, 5);
    ring(0.42, 100, 190, 3);
  } else {
    ring(0.6, 100, 190, 3);
  }
}
function drawTail(g, r, cx, cy, up, fan = 1) {
  const k = r.size;
  const duck = r.spec.kind === "duck";
  if (r.spec.fan) {
    drawFan(g, r, cx, cy, fan);
    return;
  }
  part(g, (t) => {
    if (duck)
      triangle(t, cx + 2 * k, cy - 1.8 * k, cx + 2 * k, cy + 4.6 * k, cx - 3.6 * k, cy - (2.6 + up) * k, "f");
    else
      triangle(t, cx + 2 * k, cy - 1.2 * k, cx + 2 * k, cy + 4.4 * k, cx - 3.4 * k, cy - (1.2 + up) * k, "f");
  }, { outline: "k", shade: SHADE });
}
function standing(r, pose) {
  const g = blank();
  const rb = lowered(r, pose.crouch * r.size, pose.sway * r.size);
  const duck = r.spec.kind === "duck";
  drawLegs(g, r, pose, false);
  drawTail(g, rb, rb.X(5.4), rb.Y(duck ? 19.8 : 18.6), pose.tailAngle > 60 ? 2 : 0);
  drawBody(g, rb, rb.X(14.2), rb.Y(21.4), (duck ? 9.8 : 9.2) * r.size * (r.baby ? 0.95 : 1), (duck ? 6.9 : 7.4) * r.size * (r.baby ? 0.95 : 1));
  drawWing(g, rb, pose, rb.X(12.2), rb.Y(21.4));
  drawBackWings(g, wingKind(r.spec), rb.X(11), rb.Y(21.4) - 7 * r.size, r.size);
  drawHead(g, rb, pose);
  return pose.dy === 0 ? g : shift(g, 0, pose.dy);
}
function sitting(r, pose) {
  const g = blank();
  const rb = lowered(r, 0, 0);
  const duck = r.spec.kind === "duck";
  drawTail(g, rb, rb.X(5.2), rb.Y(24), pose.tailAngle > 60 ? 2 : 0);
  drawBody(g, rb, rb.X(14.4), rb.Y(24.6), (duck ? 10.2 : 9.8) * r.size, (duck ? 5.6 : 6) * r.size);
  drawWing(g, rb, { ...pose, wing: 0 }, rb.X(12.4), rb.Y(24.6));
  drawBackWings(g, wingKind(r.spec), rb.X(11), rb.Y(24.6) - 6 * r.size, r.size);
  const lowerPose = { ...pose, headDy: pose.headDy + 3 };
  drawHead(g, rb, lowerPose);
  return g;
}
function lying(r, pose) {
  const g = blank();
  const duck = r.spec.kind === "duck";
  const breath = pose.stretch;
  drawTail(g, r, r.X(5), r.Y(26), 0, 0.5);
  drawBody(g, r, r.X(14.8), r.Y(25.4 - breath * 0.4), (10.2 + breath * 0.4) * r.size, (5.8 + breath * 0.5) * r.size);
  drawWing(g, r, { ...pose, wing: 0 }, r.X(12.6), r.Y(25.2));
  drawBackWings(g, wingKind(r.spec), r.X(11), r.Y(25.4) - 5.5 * r.size, r.size);
  const head = { cx: r.X(22), cy: r.Y(24), rx: 5.4 * r.size * r.headMod, ry: 4.8 * r.size * r.headMod };
  part(g, (t) => ellipse(t, head.cx, head.cy, head.rx, head.ry, headChar(r)), { outline: "k", shade: SHADE });
  const ex = Math.round(head.cx + head.rx * 0.2);
  drawEye(g, ex, Math.round(head.cy - 1.4), pose.eyes);
  drawBeak(g, r, Math.round(head.cx + head.rx * 0.95), Math.round(head.cy + 0.6), false);
  drawNeckAccessory(g, r.spec.neck, head);
  drawHeadAccessory(g, r.spec.accessory, head, [{ x: ex, y: Math.round(head.cy - 1.4) }]);
  return g;
}
function curled(r, pose) {
  const g = blank();
  const duck = r.spec.kind === "duck";
  drawTail(g, r, r.X(6), r.Y(24), 1, 0.5);
  part(g, (t) => {
    ellipse(t, r.X(15.4), r.Y(21.6), 9.6 * r.size, 8.6 * r.size, "f");
    markEllipse(t, r.X(15), r.Y(26), 6 * r.size, 3.4 * r.size, "b");
  }, { outline: "k", shade: SHADE });
  drawWing(g, r, { ...pose, wing: 0 }, r.X(11.8), r.Y(22));
  drawBackWings(g, wingKind(r.spec), r.X(12.5), r.Y(21.6) - 8 * r.size + 2, r.size);
  const head = { cx: r.X(19.8), cy: r.Y(16.4), rx: 6.3 * r.size * r.headMod, ry: 5.7 * r.size * r.headMod };
  part(g, (t) => ellipse(t, head.cx, head.cy, head.rx, head.ry, headChar(r)), { outline: "k", shade: SHADE });
  drawFace(g, r, { ...pose, mouth: "none" }, head);
  return g;
}
function hanging(r, pose) {
  const g = blank();
  const sz = r.size;
  const k = sz * r.headMod;
  const drop = r.baby ? 3 : 0;
  const Yh = (y) => y * sz + drop;
  const hx = CX;
  const hy = Yh(13);
  const hrx = 7.4 * k;
  const hry = 6.6 * k;
  const swing = pose.legs.bf.dx;
  const duck = r.spec.kind === "duck";
  for (const sx of [-1, 1]) {
    const dx = sx * 2.6 * sz + (sx < 0 ? swing : -swing) * 0.6;
    part(g, (t) => rect(t, Math.round(hx + dx - 1), Math.round(Yh(27)), 3, 2, "p"), { outline: "k" });
  }
  part(g, (t) => {
    ellipse(t, hx, Yh(21.6), 6.4 * sz, 6.4 * sz, "f");
    markEllipse(t, hx, Yh(23), 3.6 * sz, 4.2 * sz, "b");
  }, { outline: "k", shade: SHADE });
  drawHangArms(g, { cx: hx, reach: Math.max(hrx, 6.4 * sz) + 1.8, shoulderY: Yh(18.5), arm: "a", hand: "b", scale: sz, sway: swing });
  part(g, (t) => ellipse(t, hx, hy, hrx, hry, headChar(r)), { outline: "k", shade: SHADE });
  if (hasTuft(r.spec)) {
    for (const dx of [0]) {
      part(g, (t) => triangle(t, hx + dx - 1.2, hy - hry + 1.2, hx + dx + 1.2, hy - hry + 1.2, hx + dx, hy - hry - 2.6, headChar(r)), { outline: null });
    }
  }
  const ey = Math.round(hy - hry * 0.25);
  drawEye(g, Math.round(hx - 4.6 * k * 0.9), ey, pose.eyes);
  drawEye(g, Math.round(hx + 1.8 * k * 0.9), ey, pose.eyes);
  part(g, (t) => ellipse(t, hx, Math.round(hy + hry * 0.3), 2.4 * Math.max(sz, 0.85), 1.6 * Math.max(sz, 0.85), "p"), { outline: "k", shade: SHADE });
  drawNeckAccessory(g, r.spec.neck, { cx: hx, cy: hy, rx: hrx, ry: hry });
  drawHeadAccessory(g, r.spec.accessory, { cx: hx, cy: hy, rx: hrx, ry: hry }, [
    { x: Math.round(hx - 4.6 * k * 0.9), y: ey },
    { x: Math.round(hx + 1.8 * k * 0.9), y: ey }
  ]);
  return g;
}
function renderBirdShape(spec, stage, shape, pose) {
  const rig = makeRig(spec, stage);
  const grid = shape === "stand" ? standing(rig, pose) : shape === "sit" ? sitting(rig, pose) : shape === "lie" ? lying(rig, pose) : shape === "curl" ? curled(rig, pose) : hanging(rig, pose);
  return toRows(grid);
}

// dist/shared/art/frames.js
var FRAME_NAMES = [
  "idleA",
  "idleB",
  "sitA",
  "sitB",
  "walk1",
  "walk2",
  "walk3",
  "walk4",
  "run1",
  "run2",
  "run3",
  "run4",
  "dozeA",
  "dozeB",
  "sleepA",
  "sleepB",
  "jumpCrouch",
  "jumpUp",
  "jumpPeak",
  "jumpDown",
  "curl",
  "climbA",
  "climbB",
  "slipA",
  "slipB",
  "hangA",
  "hangB",
  "fall",
  "alertA",
  "alertB",
  "happyA",
  "happyB",
  "eatA",
  "eatB"
];

// dist/shared/art/bird-plan.js
var P2 = basePose;
var stand = (over = {}) => ({ shape: "stand", pose: P2(over) });
function waddle(i, fast) {
  const reach = fast ? 3 : 2;
  const lift = fast ? 4 : 3;
  const legsByBeat = [
    { bn: leg(reach, 0), fn: leg(-1, lift - 1) },
    { bn: leg(0, 0), fn: leg(1, lift) },
    { fn: leg(reach, 0), bn: leg(-1, lift - 1) },
    { fn: leg(0, 0), bn: leg(1, lift) }
  ];
  const beat = legsByBeat[i % 4];
  return stand({
    sway: [-1, 0, 1, 0][i % 4] ?? 0,
    crouch: i % 2 === 0 ? 0 : -1,
    headDx: fast ? 1 : 0,
    legs: { ff: leg(), bf: leg(), ...beat },
    wing: fast ? [1, 2, 1, 2][i % 4] ?? 0 : 0,
    mouth: fast ? "open" : "none",
    tailAngle: [40, 55, 70, 55][i % 4] ?? 40
  });
}
function birdPlan() {
  return {
    idleA: stand({ tailAngle: 40 }),
    idleB: stand({ tailAngle: 70, headDy: -0.5, crouch: -0.5 }),
    sitA: { shape: "sit", pose: P2({ tailAngle: 40 }) },
    sitB: { shape: "sit", pose: P2({ tailAngle: 70, mouth: "none", eyes: "happy" }) },
    walk1: waddle(0, false),
    walk2: waddle(1, false),
    walk3: waddle(2, false),
    walk4: waddle(3, false),
    run1: waddle(0, true),
    run2: waddle(1, true),
    run3: waddle(2, true),
    run4: waddle(3, true),
    dozeA: { shape: "sit", pose: P2({ headDy: 1, eyes: "sleepy" }) },
    dozeB: { shape: "sit", pose: P2({ headDy: 3, eyes: "closed" }) },
    sleepA: { shape: "lie", pose: P2({ eyes: "closed", stretch: 0 }) },
    sleepB: { shape: "lie", pose: P2({ eyes: "closed", stretch: 1 }) },
    jumpCrouch: stand({ crouch: 3, wing: 0, legs: { ff: leg(), fn: leg(1, 0), bf: leg(), bn: leg(-1, 0) } }),
    jumpUp: stand({ dy: -1, wing: 2, legs: { ff: leg(), fn: leg(1, 3), bf: leg(), bn: leg(-1, 3) }, mouth: "open" }),
    jumpPeak: stand({ dy: -2, wing: 2, legs: { ff: leg(), fn: leg(1, 4), bf: leg(), bn: leg(-1, 4) }, eyes: "happy", mouth: "open" }),
    jumpDown: stand({ dy: -1, wing: 1, legs: { ff: leg(), fn: leg(1, 2), bf: leg(), bn: leg(-1, 2) }, mouth: "open" }),
    curl: { shape: "curl", pose: P2({ eyes: "happy" }) },
    climbA: stand({ wing: 2, headDx: 1, legs: { ff: leg(), fn: leg(3, 2), bf: leg(), bn: leg(-2, 0) }, tailAngle: 30 }),
    climbB: stand({ wing: 1, headDx: 1, legs: { ff: leg(), fn: leg(2, 0), bf: leg(), bn: leg(-3, 2) }, tailAngle: 40 }),
    slipA: stand({ wing: 2, eyes: "wide", mouth: "open", legs: { ff: leg(), fn: leg(2, 2), bf: leg(), bn: leg(-2, 1) }, tailAngle: 80 }),
    slipB: stand({ wing: 1, dy: -1, eyes: "wide", mouth: "open", legs: { ff: leg(), fn: leg(3, 1), bf: leg(), bn: leg(-3, 2) }, tailAngle: 70 }),
    hangA: { shape: "hang", pose: P2({ legs: { ff: leg(), fn: leg(), bf: leg(2), bn: leg() } }) },
    hangB: { shape: "hang", pose: P2({ legs: { ff: leg(), fn: leg(), bf: leg(-2), bn: leg() }, eyes: "open" }) },
    fall: stand({ wing: 2, eyes: "wide", mouth: "open", legs: { ff: leg(), fn: leg(2, 4), bf: leg(), bn: leg(-2, 4) }, tailAngle: 85 }),
    alertA: stand({ wing: 1, eyes: "wide", mouth: "open", tailAngle: 75 }),
    alertB: stand({ wing: 0, eyes: "wide", mouth: "open", crouch: -1, tailAngle: 88, legs: { ff: leg(), fn: leg(1, 2), bf: leg(), bn: leg() } }),
    happyA: stand({ wing: 2, eyes: "happy", mouth: "open", tailAngle: 80 }),
    happyB: stand({ wing: 1, eyes: "happy", mouth: "none", crouch: -1, tailAngle: 50 }),
    eatA: stand({ headDx: 3, headDy: 6, crouch: 1, eyes: "happy", mouth: "open", tailAngle: 60 }),
    eatB: stand({ headDx: 3, headDy: 5, crouch: 1, eyes: "happy", mouth: "none", tailAngle: 40 })
  };
}
function birdFrames(spec, stage) {
  const plan = birdPlan();
  return Object.fromEntries(FRAME_NAMES.map((name) => [name, renderBirdShape(spec, stage, plan[name].shape, plan[name].pose)]));
}

// dist/shared/art/bird-species.js
var CHICK = {
  kind: "chick",
  look: makeLook({
    fur: "#ffd84a",
    outline: "#3b2f2f",
    belly: tone("#ffe27a"),
    accent: tone("#f0b400"),
    beak: tone("#ff9a2e"),
    eye: "#3b2f2f"
  })
};
var DUCK = {
  kind: "duck",
  look: makeLook({
    fur: "#fafafa",
    outline: "#3b2f2f",
    belly: tone("#ffffff"),
    accent: tone("#cfd8dc"),
    beak: tone("#ff9a2e"),
    head: tone("#3e8e5a"),
    eye: "#3b2f2f"
  })
};
var PENGUIN = {
  kind: "chick",
  tuft: false,
  look: makeLook({
    fur: "#34405e",
    outline: "#141a2b",
    belly: tone("#ffffff"),
    accent: tone("#232c42"),
    beak: tone("#ff9a2e"),
    eye: "#ffffff"
  })
};
var PHOENIX = {
  kind: "chick",
  tuft: true,
  look: makeLook({
    fur: "#ff5a36",
    outline: "#4a1f1a",
    belly: tone("#ffb04a"),
    accent: tone("#c8281e"),
    beak: tone("#ffd34a"),
    eye: "#3b2f2f"
  })
};
var OWL = {
  kind: "chick",
  tuft: true,
  look: makeLook({
    fur: "#9a7048",
    outline: "#3a2a1e",
    belly: tone("#ecd8b0"),
    accent: tone("#6a4a2c"),
    beak: tone("#ffb02e"),
    eye: "#2a1a10"
  })
};
var PARROT = {
  kind: "chick",
  tuft: true,
  coloredHead: true,
  look: makeLook({
    fur: "#3fbf5a",
    outline: "#1f3a28",
    belly: tone("#d8ef6a"),
    accent: tone("#2f7fe0"),
    beak: tone("#ffc14a"),
    head: tone("#e8473a"),
    eye: "#1f2a1f"
  })
};
var PEACOCK = {
  kind: "chick",
  tuft: true,
  coloredHead: true,
  fan: true,
  look: makeLook({
    fur: "#1f86c7",
    outline: "#10283a",
    belly: tone("#58c96e"),
    accent: tone("#1d58a8"),
    beak: tone("#f0c24a"),
    head: tone("#1a62b3"),
    eye: "#10202b"
  })
};
var GRIFFIN = {
  kind: "chick",
  tuft: true,
  coloredHead: true,
  look: makeLook({
    fur: "#c98a38",
    outline: "#3f2a14",
    belly: tone("#f0c27a"),
    accent: tone("#8f5a22"),
    beak: tone("#f2b632"),
    head: tone("#f4f0e6"),
    eye: "#2a1a0a"
  })
};

// dist/shared/art/egg.js
var EGG_LOOK = makeLook({
  fur: "#fff3d4",
  outline: "#a37c4a",
  belly: tone("#ffe7b0"),
  accent: tone("#f1bd60")
});
function egg(shape) {
  const g = blank();
  const [cy, rx, ry] = shape === "squash" ? [23.2, 7.9, 7.4] : shape === "tall" ? [21.4, 6.5, 9.3] : [22, 7, 8.6];
  part(g, (t) => {
    ellipse(t, 16, cy, rx, ry, "f");
    markEllipse(t, 16 - rx * 0.25, cy - ry * 0.5, rx * 0.35, ry * 0.22, "h");
    for (const [x, y] of [[13, 19], [19, 24], [12, 26], [20, 19], [16, 28]]) {
      const dy = shape === "squash" ? 1 : shape === "tall" ? -0.6 : 0;
      px(t, x, y + dy, "a");
      px(t, x + 1, y + dy, "a");
    }
  }, { outline: "k", shade: SHADE });
  return toRows(g);
}
function tilt(rows, dir) {
  return rows.map((row, y) => {
    const off = Math.round(dir * Math.max(0, 29 - y) * 1.6 / 9);
    if (off === 0)
      return row;
    return off > 0 ? ".".repeat(off) + row.slice(0, row.length - off) : row.slice(-off) + ".".repeat(-off);
  });
}
function eggFrames() {
  const rest = egg("rest");
  const left = tilt(rest, -1);
  const right = tilt(rest, 1);
  const squash = egg("squash");
  const tall = egg("tall");
  const map = {
    walk1: left,
    walk3: right,
    run1: left,
    run3: right,
    jumpCrouch: squash,
    jumpUp: tall,
    jumpPeak: tall,
    alertA: tall,
    happyA: tall,
    climbA: left,
    climbB: right,
    slipA: left,
    slipB: right,
    hangA: left,
    hangB: right,
    fall: tall
  };
  return Object.fromEntries(FRAME_NAMES.map((n) => [n, map[n] ?? rest]));
}

// dist/shared/art/hidden.js
function paintFur(g, x, y, w, h, c) {
  for (let yy = Math.round(y); yy < Math.round(y + h); yy++) {
    for (let xx = Math.round(x); xx < Math.round(x + w); xx++) {
      if (xx < 0 || xx >= SIZE)
        continue;
      const row = g[yy];
      if (row && "fFhbB".includes(row[xx] ?? "."))
        row[xx] = c;
    }
  }
}
function drawBackCrest(g, crest, x, y, size) {
  if (!crest)
    return;
  const count = size < 0.8 ? 3 : 4;
  const step = Math.max(2.4, 3.2 * size);
  part(g, (t) => {
    for (let i = 0; i < count; i++) {
      const bx = x + 3 * size - i * step;
      const by = y + 1 + i * 0.6 * size;
      const h = (crest === "spikes" ? 4.4 : 3.6) * size;
      const w = (crest === "spikes" ? 1.9 : 2.4) * size;
      if (crest === "spikes")
        triangle(t, bx - w, by, bx + w, by, bx - 0.4, by - h, "a");
      else
        triangle(t, bx - w, by, bx + w, by, bx + 1.4 * size, by - h, "i");
    }
  }, { outline: "k" });
}
function drawMane(g, mane, head) {
  if (!mane)
    return;
  if (mane === "lion") {
    part(g, (t) => {
      ellipse(t, head.cx - head.rx * 0.18, head.cy + head.ry * 0.08, head.rx * 1.42, head.ry * 1.36, "i");
      triangle(t, head.cx - head.rx * 1.1, head.cy + head.ry * 0.5, head.cx - head.rx * 0.2, head.cy + head.ry * 1.2, head.cx - head.rx * 0.7, head.cy + head.ry * 1.75, "i");
    }, { outline: "k" });
    return;
  }
  const color = mane === "ruff" ? "h" : "i";
  const tips = mane === "ruff" ? [
    [-1.15, 0.35, 3.2],
    // 뒤쪽 볼 털
    [-0.8, 0.95, 3.4],
    [-0.2, 1.25, 3.2],
    [0.45, 1.2, 2.6]
  ] : [
    [-0.55, -1.25, 5.4],
    // 불꽃 갈기: 뒤통수에서 위·뒤로 솟는 큰 불꽃 넷
    [-1, -0.95, 5.6],
    [-1.3, -0.35, 5],
    [-1.25, 0.35, 4.2]
  ];
  part(g, (t) => {
    for (const [ux, uy, len] of tips) {
      const bx = head.cx + ux * head.rx * 0.55;
      const by = head.cy + uy * head.ry * 0.55;
      const tx = head.cx + ux * (head.rx + len);
      const ty = head.cy + uy * (head.ry + len * 0.7) - (mane === "flame" ? 1 : 0);
      triangle(t, bx - 2.8, by - 2.4, bx + 2.8, by + 2.4, tx, ty, color);
    }
  }, { outline: "k" });
}
function drawMarkings(g, markings, head, eyeX, eyeY) {
  if (markings === "panda") {
    paintFur(g, eyeX - 2, eyeY - 1, 6, 5, "a");
    return;
  }
  if (markings === "cheeks") {
    paintFur(g, eyeX - 1, eyeY - 3, 3, 1, "i");
    paintFur(g, head.cx - head.rx * 0.1, head.cy + head.ry * 0.2, head.rx * 1.1, head.ry * 0.8, "i");
    paintFur(g, eyeX - 1, eyeY + 2, 1, 3, "a");
    return;
  }
  if (markings === "mask") {
    paintFur(g, eyeX - 4, eyeY - 1, 8, 3, "a");
    paintFur(g, eyeX - 3, eyeY + 2, 5, 1, "a");
    return;
  }
  if (markings !== "tiger")
    return;
  const top = head.cy - head.ry + 1;
  paintFur(g, eyeX - 4, top, 2, 3, "a");
  paintFur(g, eyeX - 1, top, 2, 4, "a");
  paintFur(g, eyeX + 2, top, 2, 3, "a");
  paintFur(g, head.cx - head.rx * 0.9, head.cy + head.ry * 0.05, 4, 1, "a");
  paintFur(g, head.cx - head.rx * 0.75, head.cy + head.ry * 0.45, 4, 1, "a");
}
function drawStreamers(g, noseX, noseY) {
  line(g, noseX - 2, noseY + 2, noseX - 7, noseY + 5, "p", 2);
  line(g, noseX - 7, noseY + 5, noseX - 11, noseY + 3, "p", 2);
  line(g, noseX - 2, noseY, noseX - 8, noseY - 1, "p", 2);
}

// dist/shared/art/quadruped.js
var GROUND2 = 30;
var CX2 = 16;
var DEFAULT_HEAD = { cx: 21.2, cy: 13.6, rx: 6.6, ry: 6.1 };
var BODY = { cx: 12.5, cy: 20.5, rx: 8.4, ry: 5.2 };
function makeRig2(spec, stage) {
  const baby = stage === "baby";
  const size = baby ? 0.64 : 1;
  return {
    spec,
    baby,
    size,
    headMod: baby ? 1.22 : 1,
    legMod: baby ? 0.8 : 1,
    X: (x) => CX2 + (x - CX2) * size,
    Y: (y) => GROUND2 - (GROUND2 - y) * size
  };
}
var lowered2 = (r, oy) => ({ ...r, Y: (y) => r.Y(y) + oy });
var rad = (deg) => deg * Math.PI / 180;
var headOf = (spec) => spec.head ?? DEFAULT_HEAD;
function drawLeg(g, r, x, topY, w, l, far, crouch) {
  const stub = r.spec.legScale ?? (r.spec.shell ? 0.62 : 1);
  const left = Math.round(r.X(x) + l.dx * r.size);
  const top = Math.round(GROUND2 - (GROUND2 - r.Y(topY) - crouch * r.size) * r.legMod * stub);
  const bottom = GROUND2 - Math.round(l.lift * r.size);
  const width = Math.max(2, Math.round(w * r.size * (r.spec.shell ? 1.25 : 1)));
  const h = Math.max(1, bottom - top + 1);
  part(g, (t) => {
    const shade = far && r.spec.legScale === void 0;
    const c = r.spec.darkLegs ? shade ? "A" : "a" : shade ? "F" : "f";
    rect(t, left, top, width, h, c);
    rect(t, left + width, bottom, 1, 1, c);
    if (r.spec.socks && h > 3)
      rect(t, left, bottom - 1, width + 1, 2, far ? "B" : "b");
    if (r.spec.hooves && h > 3)
      rect(t, left, bottom - 1, width + 1, 2, far ? "A" : "a");
  }, { outline: "k", shade: far ? void 0 : SHADE });
}
function drawTail2(g, r, pose, root) {
  const n = r.spec.tails ?? 1;
  if (n <= 1) {
    drawTailOne(g, r, pose, root);
    return;
  }
  const step = 24;
  const order = Array.from({ length: n }, (_, i) => i - (n - 1) / 2).sort((a, b) => Math.abs(b) - Math.abs(a));
  for (const k of order)
    drawTailOne(g, r, { ...pose, tailAngle: pose.tailAngle + 22 + k * step, tailCurl: pose.tailCurl + 10 + k * 6 }, root);
}
function drawTailOne(g, r, pose, root) {
  const { tail } = r.spec;
  if (tail === "none")
    return;
  const rx = r.X(root.x);
  const ry = r.Y(root.y);
  if (tail === "rabbit") {
    part(g, (t) => ellipse(t, rx - 1, ry + 1, 3 * r.size + 0.5, 3 * r.size, "h"), { outline: "k" });
    return;
  }
  if (tail === "turtle") {
    part(g, (t) => triangle(t, rx, ry - 1, rx, ry + 2.5, rx - 4.5 * r.size - 1, ry + 2.5, "f"), { outline: "k", shade: SHADE });
    return;
  }
  const ts = r.spec.tailScale ?? 1;
  const len = (tail === "cat" ? 4 : 3.2) * r.size * (1 + (ts - 1) * 0.6);
  const thick = (tail === "cat" ? 4.3 : 3.4) * Math.max(r.size, 0.85) * ts;
  const pts = [[rx, ry]];
  let ang = 180 - pose.tailAngle;
  for (let i = 0; i < 3; i++) {
    const [x0, y0] = pts[pts.length - 1];
    pts.push([x0 + Math.cos(rad(ang)) * len, y0 - Math.sin(rad(ang)) * len]);
    ang -= pose.tailCurl * (tail === "cat" ? 0.9 : 0.4);
  }
  part(g, (t) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      line(t, a[0], a[1], b[0], b[1], "f", thick);
    }
  }, { outline: "k", shade: SHADE });
  if (r.spec.markings === "tiger")
    for (let i = 1; i < pts.length; i++)
      paintFur(g, pts[i][0] - 1, pts[i][1] - 2, 2, 4, "a");
  if (r.spec.ringTail === "tip") {
    const end = pts[pts.length - 1];
    const prev = pts[pts.length - 2];
    paintFur(g, (end[0] + prev[0]) / 2 - 1.5, (end[1] + prev[1]) / 2 - 2, 4, 4, "a");
  } else if (r.spec.ringTail) {
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      paintFur(g, (a[0] + b[0]) / 2 - 1, (a[1] + b[1]) / 2 - 2, 2, 4, "a");
      if (i < pts.length - 1)
        continue;
      paintFur(g, b[0] - 1, b[1] - 2, 2, 4, "a");
    }
  }
}
function drawEars(g, r, pose, head) {
  const { ears } = r.spec;
  if (ears === "none" || ears === "dog")
    return;
  const top = head.cy - head.ry;
  const k = r.size * r.headMod;
  if (ears === "round") {
    const e = head.rx / 6.6;
    const lift = pose.ears === "back" ? 1.4 : 0;
    for (const dx of [-4.4 * e, 3.4 * e]) {
      part(g, (t) => ellipse(t, head.cx + dx, top + 1.6 * e + lift, 3.2 * e, 3.2 * e, "a"), { outline: "k", shade: SHADE });
    }
    return;
  }
  if (ears === "cat") {
    const e = head.rx / 6.6;
    const tipUp = pose.ears === "up" ? 5 : pose.ears === "back" ? 2.6 : 2;
    const lean = pose.ears === "back" ? -2.8 : pose.ears === "down" ? -1.4 : 0;
    const ear2 = (bx) => {
      part(g, (t) => {
        triangle(t, bx - 3.8 * e, top + 2.8 * e, bx + 3.8 * e, top + 2.8 * e, bx + lean * e + 0.2, top - tipUp * e, "f");
      }, { outline: "k", shade: SHADE });
    };
    ear2(head.cx - 3.9 * e);
    ear2(head.cx + 3.6 * e);
    return;
  }
  const spread = pose.ears === "up" ? 0 : pose.ears === "back" ? -8 : -4;
  const high = pose.ears === "down" ? 0.55 : 1;
  const ear = (bx, far) => {
    const tx = bx + (spread - (far ? 1.6 : 0)) * k * 0.7;
    const ty = top - 8.4 * k * high + (pose.ears === "back" ? 6 * k : 0);
    part(g, (t) => {
      line(t, bx, top + 3 * k, tx, ty, far ? "F" : "f", 3.8 * k);
    }, { outline: "k", shade: far ? void 0 : SHADE });
  };
  ear(head.cx - 2.8 * k, true);
  ear(head.cx + 1.2 * k, false);
}
function drawDogEars(g, r, pose, head) {
  const k = r.size * r.headMod;
  const top = head.cy - head.ry;
  const lift = pose.ears === "up" ? -1.8 : pose.ears === "back" ? 0.8 : 0;
  const back = pose.ears === "back" ? -1.8 : 0;
  part(g, (t) => triangle(t, head.cx - 1.2 * k, top + 2 * k, head.cx + 3.4 * k, top + 2.6 * k, head.cx + 2.4 * k, top - 2.2 * k, "A"), { outline: "k" });
  part(g, (t) => ellipse(t, head.cx - 2.9 * k + back, head.cy + 0.3 * k + lift, 2.5 * k, 4.4 * k, "a"), { outline: "k", shade: SHADE });
}
function drawEye2(g, ex0, ey0, kind, _small) {
  const ex = ex0 - (ex0 & 1);
  const ey = ey0 - (ey0 & 1);
  const w = 2;
  const h = 2;
  switch (kind) {
    case "open":
      rect(g, ex, ey, w, h, "e");
      break;
    case "wide":
      rect(g, ex - 1, ey - 1, w + 1, h + 1, "e");
      break;
    case "closed":
      rect(g, ex, ey + h - 2, w, 1, "e");
      px(g, ex - 0, ey + h - 3, "e");
      px(g, ex + w - 1, ey + h - 3, "e");
      break;
    case "happy":
      px(g, ex, ey + h - 1, "e");
      px(g, ex + 1, ey + h - 2, "e");
      px(g, ex + 2, ey + h - 1, "e");
      break;
    case "sleepy":
      rect(g, ex, ey + 1, w, 1, "e");
      rect(g, ex, ey + 2, w, h - 2, "e");
      break;
    case "dizzy":
      px(g, ex, ey + 1, "e");
      px(g, ex + 1, ey + 2, "e");
      px(g, ex + 2, ey + 3, "e");
      px(g, ex + 2, ey + 1, "e");
      px(g, ex, ey + 3, "e");
      break;
  }
}
function drawMouth(g, nx, ny, kind) {
  switch (kind) {
    case "none":
      break;
    case "smile":
      px(g, nx - 1, ny + 2, "m");
      px(g, nx - 2, ny + 3, "m");
      px(g, nx - 3, ny + 2, "m");
      break;
    case "open":
      rect(g, nx - 3, ny + 2, 3, 3, "m");
      rect(g, nx - 3, ny + 4, 3, 1, "t");
      break;
    case "chew":
      rect(g, nx - 3, ny + 2, 3, 2, "m");
      px(g, nx - 2, ny + 3, "t");
      break;
  }
}
function drawHead2(g, r, pose, hc) {
  const spec = r.spec;
  const k = r.size * r.headMod;
  const head = {
    cx: r.X(hc.cx) + pose.headDx * r.size,
    cy: r.Y(hc.cy) + pose.headDy * r.size,
    rx: hc.rx * k,
    ry: hc.ry * k
  };
  const small = head.ry < 4.6;
  drawEars(g, r, pose, head);
  drawMane(g, spec.mane, head);
  part(g, (t) => {
    ellipse(t, head.cx, head.cy, head.rx, head.ry, spec.darkFace ? "a" : "f");
    if (spec.cheeks)
      ellipse(t, head.cx + head.rx * 0.1, head.cy + head.ry * 0.5, head.rx * 1.02, head.ry * 0.62, "f");
    if (spec.snout)
      ellipse(t, head.cx + head.rx * 0.78, head.cy + head.ry * 0.3, head.rx * 0.52, head.ry * 0.42, "f");
    markEllipse(t, head.cx + head.rx * 0.5, head.cy + head.ry * 0.55, head.rx * 0.5, head.ry * 0.4, "b");
  }, { outline: "k", shade: SHADE });
  if (spec.ears === "dog")
    drawDogEars(g, r, pose, head);
  const eyeX = Math.round(head.cx + head.rx * (spec.eyeAt ?? 0.28));
  const eyeY = Math.round(head.cy - head.ry * 0.2);
  const noseX = Math.round(head.cx + head.rx * (spec.snout ? 1.3 : 0.88));
  const noseY = Math.round(head.cy + head.ry * (spec.snout ? 0.08 : 0.18));
  if (spec.streamers)
    drawStreamers(g, noseX, noseY);
  drawEye2(g, eyeX, eyeY, pose.eyes, small);
  rect(g, noseX - 1, noseY, 2, 2, "n");
  drawMouth(g, noseX, noseY, pose.mouth);
  drawHorns(g, spec.horns, head);
  drawMarkings(g, spec.markings, head, eyeX, eyeY);
  drawNeckAccessory(g, spec.neck, head);
  drawHeadAccessory(g, spec.accessory, head, [{ x: eyeX, y: eyeY }]);
  if (spec.whiskers) {
    line(g, noseX - 3, noseY + 3, noseX, noseY + 4, "k");
    line(g, noseX - 3, noseY + 1, noseX - 1, noseY - 1, "k");
  }
}
function drawBody2(g, r, pose) {
  const { spec } = r;
  const m = spec.bodyScale ?? { rx: 1, ry: 1 };
  const cx = r.X(BODY.cx - pose.stretch * 1.2);
  const cy = r.Y(BODY.cy);
  const rx = (BODY.rx + pose.stretch * 1.8) * r.size * m.rx * (r.baby ? 0.92 : 1);
  const ry = BODY.ry * r.size * m.ry * (r.baby ? 0.95 : 1);
  part(g, (t) => {
    ellipse(t, cx, cy, rx, ry, spec.shell ? "a" : "f");
    if (spec.shell) {
      markEllipse(t, cx, cy - ry * 0.15, rx * 0.5, ry * 0.5, "A");
      markEllipse(t, cx, cy + ry * 0.66, rx * 0.9, ry * 0.3, "b");
    } else {
      markEllipse(t, cx + rx * 0.12, cy + ry * 0.62, rx * 0.86, ry * 0.5, "b");
      if (spec.stripes) {
        for (let i = -1; i <= 2; i++)
          rect(t, Math.round(cx - rx * 0.25 + i * 3 * r.size), Math.round(cy - ry), 2, Math.max(3, Math.round(ry * 0.85)), "a");
      }
      if (spec.patch)
        markEllipse(t, cx - rx * 0.25, cy - ry * 0.45, rx * 0.5, ry * 0.5, "a");
    }
  }, { outline: "k", shade: SHADE });
}
function standing2(r, pose) {
  const g = blank();
  const { spec } = r;
  const m = spec.bodyScale ?? { rx: 1, ry: 1 };
  const rb = lowered2(r, pose.crouch * r.size);
  const legTop = BODY.cy + BODY.ry * m.ry - 2;
  const s = pose.stretch;
  const c = pose.crouch;
  drawLeg(g, r, 14.6 + s * 1.2, legTop, 3, pose.legs.ff, true, c);
  drawLeg(g, r, 10.2 - s * 1.2, legTop, 3, pose.legs.bf, true, c);
  drawTail2(g, rb, pose, { x: BODY.cx - BODY.rx * m.rx + 1 - s * 1.2, y: BODY.cy - 1.5 });
  drawBody2(g, rb, pose);
  drawBackWings(g, wingKind(spec), r.X(BODY.cx - s * 1.2) - 1, rb.Y(BODY.cy) - BODY.ry * m.ry * r.size + 1, r.size);
  drawBackCrest(g, spec.crest, r.X(BODY.cx - s * 1.2) - 1, rb.Y(BODY.cy) - BODY.ry * m.ry * r.size + 1, r.size);
  if (spec.haunch) {
    part(g, (t) => ellipse(t, r.X(8.4 - s * 1.2) + pose.legs.bn.dx * r.size, rb.Y(23.6) - pose.legs.bn.lift * r.size, 4.6 * r.size, 4.4 * r.size, "f"), { outline: "k", shade: SHADE });
  }
  drawLeg(g, r, 18.8 + s * 1.2, legTop, 3, pose.legs.fn, false, c);
  if (!spec.haunch) {
    drawLeg(g, r, 6.4 - s * 1.2, legTop, 3, pose.legs.bn, false, c);
  } else {
    part(g, (t) => ellipse(t, r.X(9.4 - s * 1.2) + pose.legs.bn.dx * r.size, GROUND2 - pose.legs.bn.lift * r.size - 1, 3.8 * r.size, 1.6 * r.size, "f"), { outline: "k", shade: SHADE });
  }
  const h = headOf(spec);
  drawHead2(g, rb, pose, { ...h, cx: h.cx + s * 1.2 });
  return pose.dy === 0 ? g : shift(g, 0, pose.dy);
}
function sitting2(r, pose) {
  if (r.spec.shell)
    return standing2(r, { ...pose, crouch: 2, legs: { ff: { dx: 0, lift: 0 }, fn: { dx: 0, lift: 0 }, bf: { dx: 0, lift: 0 }, bn: { dx: 0, lift: 0 } } });
  const g = blank();
  const { spec } = r;
  drawTail2(g, r, { ...pose, tailAngle: pose.tailAngle - 25 }, { x: 7, y: 27.2 });
  part(g, (t) => rect(t, r.X(15.2), r.Y(22), Math.max(2, 3 * r.size), GROUND2 - r.Y(22), "F"), { outline: "k" });
  part(g, (t) => {
    ellipse(t, r.X(13), r.Y(21.5), 6.2 * r.size, 8 * r.size, "f");
    markEllipse(t, r.X(15), r.Y(24), 3.2 * r.size, 5 * r.size, "b");
    if (spec.stripes)
      for (let i = 0; i < 3; i++)
        rect(t, r.X(8.5 + i * 2.2), r.Y(14.5 + i * 0.2), 2, 3.6 * r.size, "a");
    if (spec.patch)
      markEllipse(t, r.X(10), r.Y(17), 3 * r.size, 3.4 * r.size, "a");
  }, { outline: "k", shade: SHADE });
  drawBackWings(g, wingKind(spec), r.X(11), r.Y(21.5) - 8 * r.size + 3, r.size);
  drawBackCrest(g, spec.crest, r.X(11), r.Y(21.5) - 8 * r.size + 3, r.size);
  part(g, (t) => ellipse(t, r.X(10.6), r.Y(26.4), 5 * r.size, 3.6 * r.size, "f"), { outline: "k", shade: SHADE });
  part(g, (t) => ellipse(t, r.X(16.4), r.Y(29.2), 3.2 * r.size, 1.5 * r.size, "f"), { outline: "k", shade: SHADE });
  part(g, (t) => rect(t, r.X(18.2), r.Y(21.5), Math.max(2, 3 * r.size), GROUND2 - r.Y(21.5), "f"), { outline: "k", shade: SHADE });
  const h = headOf(spec);
  drawHead2(g, r, pose, { ...h, cx: h.cx - 2, cy: h.cy - 1.4 });
  return pose.dy === 0 ? g : shift(g, 0, pose.dy);
}
function lying2(r, pose) {
  const g = blank();
  const { spec } = r;
  const breath = pose.stretch;
  if (spec.shell) {
    drawTail2(g, r, pose, { x: 4.8, y: 27 });
    part(g, (t) => {
      ellipse(t, r.X(13.5), r.Y(26.6 - breath * 0.4), (10.4 + breath * 0.4) * r.size, (4.6 + breath * 0.5) * r.size, "a");
      markEllipse(t, r.X(13.5), r.Y(25), 5 * r.size, 2.2 * r.size, "A");
    }, { outline: "k", shade: SHADE });
    drawHead2(g, r, { ...pose, headDx: 0, headDy: 0 }, { cx: 23.4, cy: 27.4, rx: 3.6, ry: 3.2 });
    return g;
  }
  drawTail2(g, r, { ...pose, tailAngle: 8, tailCurl: -10 }, { x: 4.5, y: 26.6 });
  part(g, (t) => {
    ellipse(t, r.X(13.2), r.Y(25.2 - breath * 0.4), (10 + breath * 0.5) * r.size, (4.8 + breath * 0.5) * r.size, "f");
    markEllipse(t, r.X(14), r.Y(28), 8 * r.size, 2.2 * r.size, "b");
    if (spec.stripes)
      for (let i = 0; i < 3; i++)
        rect(t, r.X(8 + i * 3), r.Y(21), 2, 2, "a");
    if (spec.patch)
      markEllipse(t, r.X(9), r.Y(23), 3.4 * r.size, 2 * r.size, "a");
  }, { outline: "k", shade: SHADE });
  drawBackWings(g, wingKind(spec), r.X(11), r.Y(25.2) - 4.8 * r.size + 1, r.size);
  drawBackCrest(g, spec.crest, r.X(11), r.Y(25.2) - 4.8 * r.size + 1, r.size);
  part(g, (t) => ellipse(t, r.X(22.5), r.Y(28.2), 5 * r.size, 2.2 * r.size, "f"), { outline: "k", shade: SHADE });
  const h = headOf(spec);
  drawHead2(g, r, { ...pose, headDx: 0, headDy: 0 }, { cx: 21.2, cy: 22.4, rx: h.rx - 0.2, ry: h.ry - 0.6 });
  return g;
}
function curled2(r, pose) {
  const g = blank();
  const { spec } = r;
  drawTail2(g, r, { ...pose, tailAngle: -20, tailCurl: 28 }, { x: 5, y: 26 });
  part(g, (t) => {
    ellipse(t, r.X(15.4), r.Y(21.6), 9.4 * r.size, 8.6 * r.size, spec.shell ? "a" : "f");
    if (spec.shell) {
      markEllipse(t, r.X(14), r.Y(19.5), 5 * r.size, 4 * r.size, "A");
    } else {
      markEllipse(t, r.X(15), r.Y(26), 6 * r.size, 3.4 * r.size, "b");
      if (spec.stripes)
        for (let i = 0; i < 3; i++)
          rect(t, r.X(8 + i * 2.6), r.Y(14), 2, 3, "a");
      if (spec.patch)
        markEllipse(t, r.X(10), r.Y(17), 3.4 * r.size, 3.2 * r.size, "a");
    }
  }, { outline: "k", shade: SHADE });
  drawBackWings(g, wingKind(spec), r.X(12), r.Y(21.6) - 8.6 * r.size + 2, r.size);
  drawBackCrest(g, spec.crest, r.X(12), r.Y(21.6) - 8.6 * r.size + 2, r.size);
  const h = spec.shell ? { cx: 23, cy: 24, rx: 4, ry: 3.6 } : { ...headOf(spec), cx: 19.6, cy: 16.6, rx: 6.2, ry: 5.7 };
  drawHead2(g, r, { ...pose, eyes: pose.eyes, headDx: 0, headDy: 0 }, h);
  return g;
}
function hanging2(r, pose) {
  const g = blank();
  const { spec } = r;
  const k = r.size * r.headMod;
  const sz = r.size;
  const X = (x) => CX2 + (x - CX2) * sz;
  const drop = r.baby ? 3 : 0;
  const Yh = (y) => y * sz + drop;
  const hx = CX2;
  const hy = Yh(12.4);
  const hrx = (spec.shell ? 5.6 : 7) * k;
  const hry = (spec.shell ? 5 : 6.4) * k;
  const swing = pose.legs.bf.dx;
  if (spec.shell) {
    part(g, (t) => ellipse(t, hx, Yh(21), 8.6 * sz, 7 * sz, "a"), { outline: "k", shade: SHADE });
    part(g, (t) => ellipse(t, hx, Yh(21), 4 * sz, 3 * sz, "A"), { outline: null });
  }
  for (const [dx, d] of [[-2.6, swing], [2.6, -swing]]) {
    part(g, (t) => ellipse(t, X(CX2 + dx * 1.2 + d * 0.6), Yh(28), 2.2 * sz, 2.4 * sz, spec.shell ? "f" : "f"), { outline: "k", shade: SHADE });
  }
  if (!spec.shell) {
    part(g, (t) => {
      ellipse(t, hx, Yh(21.6), 5.8 * sz, 6.2 * sz, "f");
      markEllipse(t, hx, Yh(23), 3.4 * sz, 4.2 * sz, "b");
    }, { outline: "k", shade: SHADE });
  }
  const top = hy - hry;
  drawHangArms(g, { cx: hx, reach: Math.max(hrx, 5.8 * sz) + 1.8, shoulderY: Yh(18.5), arm: "f", hand: "b", scale: sz, sway: swing });
  if (spec.ears === "cat") {
    for (const sx of [-1, 1]) {
      part(g, (t) => {
        triangle(t, hx + sx * 6.4 * k, top + 3 * k, hx + sx * 1.6 * k, top + 1.6 * k, hx + sx * 5.2 * k, top - 4.6 * k, "f");
      }, { outline: "k", shade: SHADE });
    }
  } else if (spec.ears === "round") {
    for (const sx of [-1, 1]) {
      part(g, (t) => ellipse(t, hx + sx * 4.8 * k, top + 1.6 * k, 2.6 * k, 2.6 * k, "a"), { outline: "k", shade: SHADE });
    }
  } else if (spec.ears === "rabbit") {
    for (const sx of [-1, 1]) {
      part(g, (t) => {
        line(t, hx + sx * 3.6 * k, top + 2, hx + sx * 4.4 * k, top - 4.2 * k, "f", 3.4 * k);
      }, { outline: "k", shade: SHADE });
    }
  }
  part(g, (t) => {
    ellipse(t, hx, hy, hrx, hry, "f");
    if (spec.cheeks)
      ellipse(t, hx, hy + hry * 0.5, hrx * 1.08, hry * 0.62, "f");
    markEllipse(t, hx, hy + hry * 0.55, hrx * 0.5, hry * 0.4, "b");
    if (spec.stripes)
      for (let i = -1; i <= 1; i++)
        rect(t, hx + i * 2.4 - 0, Math.round(top + 0.5), 1, 2, "a");
  }, { outline: "k", shade: SHADE });
  if (spec.ears === "dog") {
    for (const sx of [-1, 1]) {
      part(g, (t) => ellipse(t, hx + sx * (hrx - 0.6), hy + hry * 0.1, 2.6 * k, 5 * k, "a"), { outline: "k", shade: SHADE });
    }
  }
  const small = hry < 4.6;
  const ey = Math.round(hy - hry * 0.25);
  drawEye2(g, Math.round(hx - 4.2 * k * (small ? 0.7 : 1) - 1), ey, pose.eyes, small);
  drawEye2(g, Math.round(hx + 1.6 * k * (small ? 0.7 : 1)), ey, pose.eyes, small);
  rect(g, hx - 1, Math.round(hy + hry * 0.18), 2, 2, "n");
  drawMouth(g, hx + 1, Math.round(hy + hry * 0.18), pose.mouth);
  const eyeScale = small ? 0.7 : 1;
  drawHorns(g, spec.horns, { cx: hx, cy: hy, rx: hrx, ry: hry });
  drawNeckAccessory(g, spec.neck, { cx: hx, cy: hy, rx: hrx, ry: hry });
  drawHeadAccessory(g, spec.accessory, { cx: hx, cy: hy, rx: hrx, ry: hry }, [
    { x: Math.round(hx - 4.2 * k * eyeScale - 1), y: ey },
    { x: Math.round(hx + 1.6 * k * eyeScale), y: ey }
  ]);
  return g;
}
function renderQuadShape(spec, stage, shape, pose) {
  const rig = makeRig2(spec, stage);
  const grid = shape === "stand" ? standing2(rig, pose) : shape === "sit" ? sitting2(rig, pose) : shape === "lie" ? lying2(rig, pose) : shape === "curl" ? curled2(rig, pose) : hanging2(rig, pose);
  return toRows(grid);
}

// dist/shared/art/quad-plan.js
function trotLegs(phase, amp, liftH) {
  const one = (p) => {
    const th = 2 * Math.PI * p;
    return leg(Math.round(amp * Math.cos(th)), Math.max(0, Math.round(-Math.sin(th) * liftH)));
  };
  return { fn: one(phase), bf: one(phase), ff: one(phase + 0.5), bn: one(phase + 0.5) };
}
var P3 = basePose;
function stand2(over = {}) {
  return { shape: "stand", pose: P3(over) };
}
function walkAndRun(gait) {
  if (gait === "hop") {
    return {
      // 걷기: 작은 깡충 — 웅크림 → 도약 → 정점 → 착지
      walk1: stand2({ crouch: 2, stretch: -0.5, legs: { ff: leg(1, 0), fn: leg(1, 0), bf: leg(-1, 0), bn: leg(-1, 0) }, ears: "up", tailAngle: 30 }),
      walk2: stand2({ dy: -2, stretch: 0.9, legs: { ff: leg(4, 3), fn: leg(4, 3), bf: leg(-4, 2), bn: leg(-4, 2) }, ears: "back", tailAngle: 20 }),
      walk3: stand2({ dy: -3, stretch: 0.2, legs: { ff: leg(2, 4), fn: leg(2, 4), bf: leg(-2, 4), bn: leg(-2, 4) }, ears: "back", tailAngle: 30 }),
      walk4: stand2({ dy: -1, stretch: 0.4, legs: { ff: leg(3, 0), fn: leg(3, 0), bf: leg(-2, 3), bn: leg(-2, 3) }, ears: "up", tailAngle: 40 }),
      // 뛰기: 크게 뛴다
      run1: stand2({ crouch: 3, stretch: -0.7, legs: { ff: leg(1, 0), fn: leg(1, 0), bf: leg(-1, 0), bn: leg(-1, 0) }, ears: "back", tailAngle: 20 }),
      run2: stand2({ dy: -3, stretch: 1, legs: { ff: leg(5, 4), fn: leg(5, 4), bf: leg(-5, 3), bn: leg(-5, 3) }, ears: "back", mouth: "open", tailAngle: 10 }),
      run3: stand2({ dy: -4, stretch: 0.3, legs: { ff: leg(2, 5), fn: leg(2, 5), bf: leg(-2, 5), bn: leg(-2, 5) }, ears: "back", mouth: "open", tailAngle: 25 }),
      run4: stand2({ dy: -2, stretch: 0.6, legs: { ff: leg(4, 0), fn: leg(4, 0), bf: leg(-3, 4), bn: leg(-3, 4) }, ears: "back", tailAngle: 30 })
    };
  }
  const walk = (i) => stand2({
    legs: trotLegs(i / 4, 3, 3),
    crouch: i % 2 === 0 ? 0 : -1,
    tailAngle: [48, 58, 48, 38][i] ?? 45,
    headDy: i % 2 === 0 ? 0 : -0.5
  });
  const run = (i) => stand2({
    legs: trotLegs(i / 4, 5, 5),
    crouch: i % 2 === 0 ? 0 : -1,
    dy: i % 2 === 0 ? 0 : -1,
    stretch: i % 2 === 0 ? 0.8 : 0.3,
    ears: "back",
    mouth: "smile",
    tailAngle: 15,
    tailCurl: 10
  });
  return { walk1: walk(0), walk2: walk(1), walk3: walk(2), walk4: walk(3), run1: run(0), run2: run(1), run3: run(2), run4: run(3) };
}
function quadPlan(gait) {
  const moving = walkAndRun(gait);
  const plan = {
    idleA: stand2({ tailAngle: 40 }),
    idleB: stand2({ tailAngle: 58, stretch: 0.15, headDy: -0.5 }),
    sitA: { shape: "sit", pose: P3({ tailAngle: 28 }) },
    sitB: { shape: "sit", pose: P3({ tailAngle: 52, mouth: "smile" }) },
    walk1: moving.walk1,
    walk2: moving.walk2,
    walk3: moving.walk3,
    walk4: moving.walk4,
    run1: moving.run1,
    run2: moving.run2,
    run3: moving.run3,
    run4: moving.run4,
    dozeA: { shape: "sit", pose: P3({ headDy: 2, eyes: "sleepy", ears: "down", tailAngle: 20 }) },
    dozeB: { shape: "sit", pose: P3({ headDy: 4, eyes: "closed", ears: "down", tailAngle: 20 }) },
    sleepA: { shape: "lie", pose: P3({ eyes: "closed", ears: "down", stretch: 0 }) },
    sleepB: { shape: "lie", pose: P3({ eyes: "closed", ears: "down", stretch: 1 }) },
    jumpCrouch: stand2({ crouch: 3, stretch: -0.6, legs: { ff: leg(1, 0), fn: leg(1, 0), bf: leg(-1, 0), bn: leg(-1, 0) }, ears: "back", tailAngle: 25 }),
    jumpUp: stand2({ dy: -1, stretch: 0.9, legs: { ff: leg(4, 3), fn: leg(4, 2), bf: leg(-4, 2), bn: leg(-4, 1) }, ears: "back", mouth: "open", tailAngle: 20 }),
    jumpPeak: stand2({ dy: -2, stretch: 0.2, legs: { ff: leg(2, 4), fn: leg(2, 4), bf: leg(-2, 4), bn: leg(-2, 4) }, eyes: "happy", mouth: "open", tailAngle: 80 }),
    jumpDown: stand2({ dy: -1, stretch: 0.4, legs: { ff: leg(3, 2), fn: leg(3, 1), bf: leg(-1, 3), bn: leg(-1, 3) }, ears: "back", mouth: "open", tailAngle: 60 }),
    curl: { shape: "curl", pose: P3({ eyes: "happy", ears: "up" }) },
    climbA: stand2({ stretch: 1, legs: { ff: leg(5, 2), fn: leg(3, 0), bf: leg(-4, 1), bn: leg(-2, 0) }, ears: "back", tailAngle: 20 }),
    climbB: stand2({ stretch: 1, legs: { ff: leg(3, 0), fn: leg(5, 2), bf: leg(-2, 0), bn: leg(-4, 1) }, ears: "back", tailAngle: 28 }),
    slipA: stand2({ stretch: 0.6, legs: { ff: leg(4, 2), fn: leg(2, 1), bf: leg(-4, 2), bn: leg(-3, 1) }, eyes: "wide", mouth: "open", ears: "back", tailAngle: 85 }),
    slipB: stand2({ stretch: 0.6, dy: -1, legs: { ff: leg(5, 1), fn: leg(3, 2), bf: leg(-3, 1), bn: leg(-4, 2) }, eyes: "wide", mouth: "open", ears: "back", tailAngle: 70 }),
    hangA: { shape: "hang", pose: P3({ legs: { ff: leg(), fn: leg(), bf: leg(2), bn: leg() }, mouth: "none" }) },
    hangB: { shape: "hang", pose: P3({ legs: { ff: leg(), fn: leg(), bf: leg(-2), bn: leg() }, mouth: "smile" }) },
    fall: stand2({ stretch: 0.3, legs: { ff: leg(3, 4), fn: leg(4, 5), bf: leg(-3, 5), bn: leg(-4, 4) }, eyes: "wide", mouth: "open", tailAngle: 85 }),
    alertA: stand2({ eyes: "wide", mouth: "open", ears: "up", tailAngle: 75 }),
    alertB: stand2({ eyes: "wide", mouth: "open", ears: "up", tailAngle: 88, crouch: -1, legs: { ff: leg(), fn: leg(1, 2), bf: leg(), bn: leg() } }),
    happyA: stand2({ eyes: "happy", mouth: "open", tailAngle: 80 }),
    happyB: stand2({ eyes: "happy", mouth: "smile", tailAngle: 50, crouch: -1 }),
    eatA: stand2({ crouch: 1, headDx: 3, headDy: 5, eyes: "happy", mouth: "chew", ears: "back", tailAngle: 35 }),
    eatB: stand2({ crouch: 1, headDx: 3, headDy: 3, eyes: "happy", mouth: "none", ears: "back", tailAngle: 50 })
  };
  return plan;
}
function quadFrames(spec, stage, gait) {
  const plan = quadPlan(gait);
  return Object.fromEntries(FRAME_NAMES.map((name) => [name, renderQuadShape(spec, stage, plan[name].shape, plan[name].pose)]));
}

// dist/shared/art/quad-species.js
var CAT = {
  look: makeLook({
    fur: "#f0a04b",
    outline: "#3b2f2f",
    belly: tone("#fbe3c0"),
    accent: tone("#c97a2b"),
    inner: tone("#f4a6b8"),
    nose: "#f4a6b8",
    eye: "#3b2f2f"
  }),
  ears: "cat",
  tail: "cat",
  snout: false,
  whiskers: false,
  // 수염은 작은 얼굴을 어수선하게 만들어서 뺐다
  stripes: false,
  // 줄무늬·양말 같은 잔무늬는 "대충 생겨야 귀엽다"는 의견에 따라 뺐다(코드는 남겨 둠)
  patch: false,
  shell: false,
  haunch: false,
  socks: false,
  // 더 귀엽게: 머리는 크고 둥글게, 몸은 짧고 작게(2등신에 가깝게), 눈은 뒤로 옮겨 입가에 여유를 준다
  head: { cx: 20.6, cy: 13.4, rx: 7.6, ry: 6.8 },
  eyeAt: 0.1,
  bodyScale: { rx: 0.9, ry: 0.94 }
};
var DOG = {
  look: makeLook({
    fur: "#d2a679",
    outline: "#3b2f2f",
    belly: tone("#f5e1c0"),
    accent: tone("#8a5a2b"),
    inner: tone("#f4a6b8"),
    nose: "#3b2f2f",
    eye: "#3b2f2f"
  }),
  ears: "dog",
  tail: "dog",
  snout: true,
  whiskers: false,
  stripes: false,
  patch: true,
  shell: false,
  haunch: false,
  socks: false
};
var RABBIT = {
  look: makeLook({
    fur: "#f4f4f4",
    outline: "#3b2f2f",
    belly: tone("#ffffff"),
    accent: tone("#dcdcdc"),
    inner: tone("#f4a6b8"),
    nose: "#f4a6b8",
    eye: "#3b2f2f"
  }),
  ears: "rabbit",
  tail: "rabbit",
  snout: false,
  whiskers: false,
  stripes: false,
  patch: false,
  shell: false,
  haunch: true,
  socks: false,
  head: { cx: 21.2, cy: 15, rx: 6.4, ry: 5.8 }
};
var TURTLE = {
  look: makeLook({
    fur: "#9bd37a",
    outline: "#3b2f2f",
    belly: tone("#f4e6aa"),
    accent: tone("#4e9f50"),
    inner: tone("#f4a6b8"),
    nose: "#3b2f2f",
    eye: "#3b2f2f"
  }),
  ears: "none",
  tail: "turtle",
  snout: false,
  whiskers: false,
  stripes: false,
  patch: false,
  shell: true,
  haunch: false,
  socks: false,
  head: { cx: 25.2, cy: 22, rx: 4.8, ry: 4.4 },
  bodyScale: { rx: 1.06, ry: 1.12 }
};
var FOX = {
  look: makeLook({
    fur: "#e8743b",
    outline: "#3b2f2f",
    belly: tone("#fff4e6"),
    accent: tone("#5a3426"),
    inner: tone("#f4a6b8"),
    nose: "#3b2f2f",
    eye: "#3b2f2f"
  }),
  ears: "cat",
  tail: "cat",
  snout: true,
  whiskers: false,
  stripes: false,
  patch: false,
  shell: false,
  haunch: false,
  socks: false,
  head: { cx: 20.6, cy: 13.6, rx: 7, ry: 6.2 },
  bodyScale: { rx: 0.95, ry: 0.92 }
};
var HAMSTER = {
  look: makeLook({
    fur: "#eac690",
    outline: "#3b2f2f",
    belly: tone("#fff5e0"),
    accent: tone("#c98a4b"),
    inner: tone("#f4a6b8"),
    nose: "#f08aa0",
    eye: "#3b2f2f"
  }),
  ears: "round",
  tail: "none",
  snout: false,
  whiskers: false,
  stripes: false,
  patch: true,
  shell: false,
  haunch: false,
  socks: false,
  cheeks: true,
  legScale: 0.42,
  head: { cx: 18.8, cy: 16.2, rx: 7.8, ry: 6.6 },
  eyeAt: 0.1,
  bodyScale: { rx: 0.98, ry: 1.3 }
};
var PANDA = {
  look: makeLook({
    fur: "#f6f6f2",
    outline: "#5a5a6a",
    belly: tone("#ffffff"),
    accent: tone("#1c1c24"),
    inner: tone("#9a9aa8"),
    nose: "#2b2b33",
    eye: "#ffffff"
  }),
  ears: "round",
  tail: "rabbit",
  snout: false,
  whiskers: false,
  stripes: false,
  patch: false,
  shell: false,
  haunch: false,
  socks: false,
  markings: "panda",
  darkLegs: true,
  head: { cx: 20.4, cy: 14.4, rx: 7.4, ry: 6.4 },
  eyeAt: 0.12,
  bodyScale: { rx: 1.02, ry: 1.08 }
};
var BEAR = {
  look: makeLook({
    fur: "#a9703b",
    outline: "#3b2f2f",
    belly: tone("#e2bd8c"),
    accent: tone("#7a4a24"),
    inner: tone("#e2bd8c"),
    nose: "#3b2f2f",
    eye: "#3b2f2f"
  }),
  ears: "round",
  tail: "rabbit",
  snout: true,
  whiskers: false,
  stripes: false,
  patch: false,
  shell: false,
  haunch: false,
  socks: false,
  head: { cx: 20.4, cy: 14.4, rx: 7.2, ry: 6.4 },
  bodyScale: { rx: 1.08, ry: 1.1 }
};
var PIG = {
  look: makeLook({
    fur: "#ffb3c4",
    outline: "#5a3040",
    belly: tone("#ffd6df"),
    accent: tone("#ff8fa8"),
    inner: tone("#ff8fa8"),
    nose: "#d9627f",
    eye: "#3b2f2f"
  }),
  ears: "cat",
  tail: "rabbit",
  snout: true,
  whiskers: false,
  stripes: false,
  patch: false,
  shell: false,
  haunch: false,
  socks: false,
  head: { cx: 20.6, cy: 14.6, rx: 7.4, ry: 6.4 },
  eyeAt: 0.12,
  bodyScale: { rx: 1.06, ry: 1.06 }
};
var SHEEP = {
  look: makeLook({
    fur: "#f7f4ea",
    outline: "#5a5a6e",
    belly: tone("#ffffff"),
    accent: tone("#24242c"),
    inner: tone("#9a9aa8"),
    nose: "#ff9db0",
    eye: "#ffffff"
  }),
  ears: "dog",
  tail: "rabbit",
  snout: false,
  whiskers: false,
  stripes: false,
  patch: false,
  shell: false,
  haunch: false,
  socks: false,
  mane: "ruff",
  darkFace: true,
  darkLegs: true,
  head: { cx: 20.8, cy: 14.4, rx: 6.6, ry: 6 },
  bodyScale: { rx: 1.14, ry: 1.16 }
};
var DRAGON = {
  look: makeLook({
    fur: "#d9423e",
    outline: "#3b2f2f",
    belly: tone("#ffd58a"),
    accent: tone("#7a1626"),
    inner: tone("#ff8a3c"),
    beak: tone("#f5b83a"),
    nose: "#3b2f2f",
    eye: "#3b2f2f"
  }),
  ears: "none",
  tail: "cat",
  snout: true,
  whiskers: false,
  stripes: false,
  patch: false,
  shell: false,
  haunch: false,
  socks: false,
  horns: "pair",
  crest: "spikes",
  bodyWings: true,
  head: { cx: 20.8, cy: 14, rx: 7, ry: 6.2 },
  bodyScale: { rx: 1, ry: 1 }
};
var AZURE = {
  look: makeLook({
    fur: "#3a9fd6",
    outline: "#22324e",
    belly: tone("#d8f4ff"),
    accent: tone("#1c5f94"),
    inner: tone("#9fe6ff"),
    beak: tone("#ffe9a0"),
    nose: "#22324e",
    eye: "#22324e"
  }),
  ears: "none",
  tail: "cat",
  snout: true,
  whiskers: false,
  stripes: false,
  patch: false,
  shell: false,
  haunch: false,
  socks: false,
  horns: "antler",
  crest: "fin",
  streamers: true,
  head: { cx: 20.8, cy: 14, rx: 7, ry: 6.2 },
  bodyScale: { rx: 1.04, ry: 0.9 }
};
var WHITETIGER = {
  look: makeLook({
    fur: "#f8f3e8",
    outline: "#2b2b3a",
    belly: tone("#ffffff"),
    accent: tone("#1d2030"),
    inner: tone("#ffa3b5"),
    nose: "#ff8fa3",
    eye: "#2f6fe0"
  }),
  ears: "cat",
  tail: "cat",
  snout: false,
  whiskers: false,
  stripes: true,
  patch: false,
  shell: false,
  haunch: false,
  socks: false,
  markings: "tiger",
  mane: "ruff",
  head: { cx: 20.6, cy: 13.4, rx: 7.8, ry: 6.8 },
  eyeAt: 0.1,
  bodyScale: { rx: 1, ry: 1.04 }
};
var TORTOISE = {
  look: makeLook({
    fur: "#5f8c96",
    outline: "#1f2a3a",
    belly: tone("#d6e4e4"),
    accent: tone("#233a5e"),
    inner: tone("#9fc3cc"),
    nose: "#1f2a3a",
    eye: "#d83a3a"
  }),
  ears: "none",
  tail: "turtle",
  snout: false,
  whiskers: false,
  stripes: false,
  patch: false,
  shell: true,
  haunch: false,
  socks: false,
  head: { cx: 25.2, cy: 22, rx: 4.8, ry: 4.4 },
  bodyScale: { rx: 1.06, ry: 1.12 }
};
var QILIN = {
  look: makeLook({
    fur: "#f2c14e",
    outline: "#3b2f2f",
    belly: tone("#fff3c8"),
    accent: tone("#b4701f"),
    inner: tone("#ff6a2c"),
    beak: tone("#fff0a8"),
    nose: "#3b2f2f",
    eye: "#3b2f2f"
  }),
  ears: "round",
  tail: "dog",
  snout: true,
  whiskers: false,
  stripes: false,
  patch: true,
  shell: false,
  haunch: false,
  socks: false,
  horns: "single",
  mane: "flame",
  hooves: true,
  legScale: 1.1
};
var OTTER = {
  look: makeLook({
    fur: "#8a5a3b",
    outline: "#3a271c",
    belly: tone("#ead2a8"),
    accent: tone("#5e3b25"),
    inner: tone("#d9a98a"),
    nose: "#2b1d17",
    eye: "#2b1d17"
  }),
  ears: "none",
  tail: "turtle",
  snout: false,
  whiskers: true,
  stripes: false,
  patch: false,
  shell: false,
  haunch: false,
  socks: false,
  head: { cx: 21, cy: 14.6, rx: 6.6, ry: 5.6 },
  bodyScale: { rx: 1.14, ry: 0.84 },
  legScale: 0.78
};
var ALPACA = {
  look: makeLook({
    fur: "#e4cba3",
    outline: "#4a3a2a",
    belly: tone("#fff4df"),
    accent: tone("#9a7a55"),
    inner: tone("#f2b9a8"),
    nose: "#6b4a38",
    eye: "#2b1d17"
  }),
  ears: "cat",
  tail: "rabbit",
  snout: false,
  whiskers: false,
  stripes: false,
  patch: false,
  shell: false,
  haunch: false,
  socks: false,
  head: { cx: 21, cy: 11.9, rx: 5.9, ry: 6.5 },
  bodyScale: { rx: 0.96, ry: 0.98 },
  legScale: 1.18,
  mane: "ruff"
};
var RACCOON = {
  look: makeLook({
    fur: "#9aa1ab",
    outline: "#2f3238",
    belly: tone("#e9ecef"),
    accent: tone("#3d4048"),
    inner: tone("#d9a9b3"),
    nose: "#25272b",
    eye: "#f4f4f4"
  }),
  ears: "round",
  tail: "cat",
  snout: true,
  whiskers: false,
  stripes: false,
  patch: false,
  shell: false,
  haunch: false,
  socks: false,
  head: { cx: 20.8, cy: 14, rx: 6.9, ry: 6 },
  bodyScale: { rx: 1, ry: 0.96 },
  markings: "mask",
  ringTail: true
};
var LION = {
  look: makeLook({
    fur: "#e2a847",
    outline: "#3a2616",
    belly: tone("#f7deaa"),
    accent: tone("#7a4a1f"),
    inner: tone("#93501f"),
    nose: "#6b3a2a",
    eye: "#2b1a10"
  }),
  ears: "round",
  tail: "dog",
  snout: true,
  whiskers: false,
  stripes: false,
  patch: false,
  shell: false,
  haunch: false,
  socks: false,
  head: { cx: 21, cy: 13.8, rx: 6.2, ry: 5.8 },
  bodyScale: { rx: 1, ry: 0.98 },
  mane: "lion",
  ringTail: "tip"
};
var REDPANDA = {
  look: makeLook({
    fur: "#c9532b",
    outline: "#3b1c14",
    belly: tone("#4d2a22"),
    accent: tone("#3a1f19"),
    inner: tone("#f6efe4"),
    nose: "#1f1411",
    eye: "#1f1411"
  }),
  ears: "round",
  tail: "cat",
  snout: false,
  whiskers: false,
  stripes: false,
  patch: false,
  shell: false,
  haunch: false,
  socks: false,
  head: { cx: 20.8, cy: 14, rx: 7.1, ry: 6.2 },
  bodyScale: { rx: 1, ry: 0.94 },
  markings: "cheeks",
  ringTail: true,
  tailScale: 1.4,
  darkLegs: true
};
var ARCTICFOX = {
  look: makeLook({
    fur: "#f1f6fb",
    outline: "#33445a",
    belly: tone("#ffffff"),
    accent: tone("#9db8d6"),
    inner: tone("#efc3cd"),
    nose: "#26303d",
    eye: "#26303d"
  }),
  ears: "round",
  tail: "cat",
  snout: true,
  whiskers: false,
  stripes: false,
  patch: false,
  shell: false,
  haunch: false,
  socks: false,
  head: { cx: 20.6, cy: 13.8, rx: 6.8, ry: 6 },
  bodyScale: { rx: 0.96, ry: 0.94 },
  ringTail: "tip",
  tailScale: 1.1
};
var UNICORN = {
  look: makeLook({
    fur: "#f8f4ff",
    outline: "#4a3a66",
    belly: tone("#ffffff"),
    accent: tone("#c9a8f0"),
    inner: tone("#b07cf0"),
    beak: tone("#ffd34a"),
    nose: "#c07aa8",
    eye: "#3a2a55"
  }),
  ears: "cat",
  tail: "cat",
  snout: true,
  whiskers: false,
  stripes: false,
  patch: false,
  shell: false,
  haunch: false,
  socks: false,
  head: { cx: 21, cy: 12.6, rx: 6.2, ry: 6 },
  bodyScale: { rx: 1, ry: 0.96 },
  legScale: 1.12,
  horns: "single",
  mane: "flame",
  hooves: true,
  tailScale: 1.15
};
var KUMIHO = {
  look: makeLook({
    fur: "#f6e3c6",
    outline: "#5a3420",
    belly: tone("#fffaf0"),
    accent: tone("#ee7a35"),
    inner: tone("#f2a5a0"),
    nose: "#3a2418",
    eye: "#3a2418"
  }),
  ears: "cat",
  tail: "cat",
  snout: true,
  whiskers: false,
  stripes: false,
  patch: false,
  shell: false,
  haunch: false,
  socks: false,
  head: { cx: 20.6, cy: 13.6, rx: 6.8, ry: 6 },
  bodyScale: { rx: 0.92, ry: 0.92 },
  ringTail: "tip",
  tails: 3,
  tailScale: 1.3
};

// dist/shared/art/props.js
var PROPS = ["none", "ball", "bone", "fish", "balloon", "pot", "butterfly", "lantern", "dragonegg", "yarn", "kite", "snowman", "cloud"];
var isProp = (v) => typeof v === "string" && PROPS.includes(v);
var PROP_MOTION = {
  ball: "ground",
  bone: "ground",
  fish: "ground",
  pot: "ground",
  balloon: "float",
  butterfly: "float",
  lantern: "float",
  dragonegg: "ground",
  yarn: "ground",
  kite: "float",
  snowman: "ground",
  cloud: "float"
};
var PROP_COLORS = {
  ball: { a: "#e5484d", b: "#4a9bff", w: "#ffffff", k: "#3b2f2f" },
  bone: { a: "#fffaf0", b: "#d9cfb8", w: "#ffffff", k: "#3b2f2f" },
  fish: { a: "#ff9b2e", b: "#ffd34a", w: "#ffffff", k: "#3b2f2f" },
  balloon: { a: "#ff6b8b", b: "#ffb3c8", w: "#ffffff", k: "#3b2f2f" },
  pot: { a: "#c8693a", b: "#4fae5a", w: "#ff6b8b", k: "#3b2f2f" },
  butterfly: { a: "#7a5cff", b: "#b8a8ff", w: "#ffffff", k: "#3b2f2f" },
  lantern: { a: "#ff9b2e", b: "#ffe14a", w: "#fff6c8", k: "#3b2f2f" },
  dragonegg: { a: "#7a5cff", b: "#ffd34a", w: "#c9b8ff", k: "#3b2f2f" },
  yarn: { a: "#ff8bd0", b: "#ffc2e6", w: "#c2418f", k: "#3b2f2f" },
  kite: { a: "#4a9bff", b: "#ffd34a", w: "#ffffff", k: "#3b2f2f" },
  snowman: { a: "#ffffff", b: "#ff9b2e", w: "#e5484d", k: "#3b2f2f" },
  cloud: { a: "#e8f4ff", b: "#4a9bff", w: "#ffe14a", k: "#3b2f2f" }
};
var DRAW = {
  // 공: 둥근 모양과 살짝 찌그러진 모양이 번갈아(튀는 느낌), 줄무늬가 돈다
  ball: (g, ph) => {
    if (ph === 0) {
      ellipse(g, 7, 7, 6, 6, "a");
      rect(g, 1, 6, 13, 2, "w");
      rect(g, 4, 2, 3, 2, "w");
      px(g, 4, 4, "w");
      rect(g, 9, 10, 3, 2, "b");
    } else {
      ellipse(g, 7, 8, 7, 5, "a");
      rect(g, 0, 7, 15, 2, "w");
      rect(g, 3, 4, 3, 2, "w");
      rect(g, 9, 10, 3, 1, "b");
    }
  },
  // 뼈다귀: 한쪽 끝이 까딱까딱
  bone: (g, ph) => {
    const l = ph === 0 ? 0 : 1;
    const r = ph === 0 ? 1 : 0;
    rect(g, 3, 5 + (l + r) / 2, 10, 4, "a");
    ellipse(g, 3, 4 + l, 2.2, 2.2, "a");
    ellipse(g, 3, 9 + l, 2.2, 2.2, "a");
    ellipse(g, 12, 4 + r, 2.2, 2.2, "a");
    ellipse(g, 12, 9 + r, 2.2, 2.2, "a");
    rect(g, 4, 8 + (l + r) / 2, 8, 1, "b");
    px(g, 2, 3 + l, "w");
  },
  // 생선: 몸 왼쪽이 머리, 꼬리가 좌우로 살랑살랑
  fish: (g, ph) => {
    ellipse(g, 6, 8, 6, 4, "a");
    rect(g, 2, 9, 9, 2, "b");
    rect(g, 5, 3, 4, 1, "a");
    rect(g, 6, 2, 2, 1, "a");
    const t = ph === 0 ? 0 : 1;
    rect(g, 11, 6 + t, 2, 5, "a");
    rect(g, 13, 4 + t, 2, 9, "a");
    px(g, 14, 3 + t, "a");
    px(g, 14, 13 + t, "a");
    rect(g, 7, 6, 1, 5, "b");
    rect(g, 9, 6, 1, 5, "b");
    rect(g, 4, 6, 1, 4, "k");
    px(g, 2, 7, "w");
    px(g, 2, 8, "k");
  },
  // 풍선: 줄이 이리저리 흔들린다
  balloon: (g, ph) => {
    const sway = ph === 0 ? 0 : 1;
    ellipse(g, 7, 5, 5, 5.5, "a");
    rect(g, 3, 3, 2, 3, "w");
    px(g, 4, 6, "w");
    rect(g, 9, 7, 3, 2, "b");
    rect(g, 6, 10, 3, 2, "a");
    line(g, 7, 12, 7 + sway, 15, "b");
  },
  // 꽃 화분: 꽃이 바람에 살랑
  pot: (g, ph) => {
    const sw = ph === 0 ? 0 : 1;
    rect(g, 3, 9, 9, 6, "a");
    rect(g, 2, 8, 11, 2, "a");
    rect(g, 3, 12, 9, 1, "b");
    line(g, 7, 8, 7 + sw, 4, "b");
    ellipse(g, 4, 6, 2, 1, "b");
    ellipse(g, 11, 6, 2, 1, "b");
    const fx = 7 + sw;
    rect(g, fx - 2, 1, 5, 3, "w");
    rect(g, fx - 1, 0, 3, 5, "w");
    px(g, fx, 2, "b");
  },
  // 나비: 날개를 폈다 접었다
  butterfly: (g, ph) => {
    if (ph === 0) {
      ellipse(g, 3.5, 5, 3.5, 3.5, "a");
      ellipse(g, 11.5, 5, 3.5, 3.5, "a");
      ellipse(g, 4.5, 10, 2.5, 2.5, "b");
      ellipse(g, 10.5, 10, 2.5, 2.5, "b");
      px(g, 3, 4, "w");
      px(g, 12, 4, "w");
    } else {
      ellipse(g, 5.5, 6, 2, 4, "a");
      ellipse(g, 9.5, 6, 2, 4, "a");
      ellipse(g, 6, 10, 1.5, 2, "b");
      ellipse(g, 9, 10, 1.5, 2, "b");
      px(g, 5, 4, "w");
    }
    rect(g, 7, 3, 2, 9, "k");
    px(g, 6, 2, "k");
    px(g, 9, 2, "k");
  },
  // 등불: 불빛이 일렁인다
  lantern: (g, ph) => {
    rect(g, 6, 0, 4, 2, "a");
    rect(g, 3, 2, 10, 2, "a");
    rect(g, 3, 4, 10, 9, "a");
    rect(g, 4, 5, 8, 7, "b");
    if (ph === 0)
      rect(g, 5, 6, 6, 5, "w");
    else
      rect(g, 6, 7, 4, 4, "w");
    rect(g, 3, 13, 10, 2, "a");
    px(g, 7, 15, "a");
    px(g, 8, 15, "a");
    if (ph === 1) {
      px(g, 2, 1, "b");
      px(g, 13, 2, "b");
    }
  },
  // 용의 알: 좌우로 흔들린다(속에서 무언가 움직이는 듯)
  dragonegg: (g, ph) => {
    const o = ph === 0 ? 0 : 1;
    ellipse(g, 7 + o, 8, 5.5, 7, "a");
    for (let x = 2; x <= 12; x++)
      px(g, x + o, 8 + x % 2, "b");
    for (let x = 2; x <= 12; x++)
      px(g, x + o, 12 - x % 2, "b");
    rect(g, 4 + o, 2, 3, 2, "w");
    px(g, 4 + o, 4, "w");
    px(g, 9 + o, 5, "b");
    px(g, 6 + o, 14, "b");
    if (ph === 1) {
      px(g, 8 + o, 6, "b");
      px(g, 9 + o, 6, "b");
    }
  },
  // 털실뭉치: 실 끝이 꼬물꼬물
  yarn: (g, ph) => {
    ellipse(g, 6, 7, 5.5, 5.5, "a");
    line(g, 2, 5, 10, 3, "b");
    line(g, 1, 8, 11, 6, "b");
    line(g, 2, 11, 10, 10, "b");
    line(g, 4, 2, 7, 12, "w");
    const t = ph === 0 ? 0 : 1;
    line(g, 10, 11, 12, 12 + t, "a");
    line(g, 12, 12 + t, 14, 11 - t, "a");
  },
  // 연: 꼬리가 바람에 펄럭
  kite: (g, ph) => {
    triangle(g, 7, 0, 1, 5, 13, 5, "a");
    triangle(g, 1, 5, 13, 5, 7, 11, "b");
    line(g, 7, 0, 7, 11, "w");
    line(g, 1, 5, 13, 5, "w");
    const s = ph === 0 ? 0 : 1;
    line(g, 7, 11, 6 + s, 13, "w");
    rect(g, 5 + s, 13, 2, 1, "a");
    line(g, 6 + s, 14, 8 - s, 15, "w");
  },
  // 눈사람: 팔이 까딱
  snowman: (g, ph) => {
    ellipse(g, 7, 11, 5, 4.5, "a");
    ellipse(g, 7, 5, 3.6, 3.6, "a");
    rect(g, 4, 8, 7, 1, "w");
    rect(g, 9, 9, 2, 3, "w");
    px(g, 6, 4, "k");
    px(g, 9, 4, "k");
    px(g, 7, 6, "b");
    px(g, 8, 6, "b");
    rect(g, 5, 11, 1, 1, "k");
    rect(g, 5, 13, 1, 1, "k");
    const a = ph === 0 ? 0 : 1;
    line(g, 2, 10 - a, 0, 8 - a, "k");
    line(g, 12, 10 + a, 14, 8 + a, "k");
  },
  // 구름: 빗방울이 떨어지고 번개가 깜빡
  cloud: (g, ph) => {
    ellipse(g, 4, 5, 3, 3, "a");
    ellipse(g, 8, 4, 4, 4, "a");
    ellipse(g, 12, 5.5, 3, 3, "a");
    rect(g, 3, 5, 11, 3, "a");
    const d = ph === 0 ? 0 : 2;
    rect(g, 4, 10 + d, 1, 2, "b");
    rect(g, 8, 11 - d + 2, 1, 2, "b");
    rect(g, 12, 10 + d, 1, 2, "b");
    if (ph === 1)
      px(g, 8, 9, "w");
  }
};
var cache = /* @__PURE__ */ new Map();
function propFrames(prop) {
  if (prop === "none")
    return [];
  const hit = cache.get(prop);
  if (hit)
    return hit;
  const frames = [0, 1].map((ph) => {
    const g = blank();
    DRAW[prop](g, ph);
    return outline(g, "k");
  });
  let x0 = 99;
  let x1 = -1;
  let y0 = 99;
  let y1 = -1;
  for (const rows of frames) {
    rows.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        if (ch === ".")
          return;
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      });
    });
  }
  const cropped = frames.map((rows) => rows.slice(y0, y1 + 1).map((r) => r.slice(x0, x1 + 1)));
  cache.set(prop, cropped);
  return cropped;
}

// dist/shared/species.js
var DESIGNS = {
  rabbit: { kind: "quad", spec: RABBIT, gait: "hop", skin: "f" },
  cat: { kind: "quad", spec: CAT, gait: "trot", skin: "f" },
  dog: { kind: "quad", spec: DOG, gait: "trot", skin: "f" },
  turtle: { kind: "quad", spec: TURTLE, gait: "trot", skin: "f" },
  chick: { kind: "bird", spec: CHICK, skin: "f" },
  duck: { kind: "bird", spec: DUCK, skin: "g" },
  fox: { kind: "quad", spec: FOX, gait: "trot", skin: "f" },
  hamster: { kind: "quad", spec: HAMSTER, gait: "trot", skin: "f" },
  penguin: { kind: "bird", spec: PENGUIN, skin: "f" },
  panda: { kind: "quad", spec: PANDA, gait: "trot", skin: "f" },
  bear: { kind: "quad", spec: BEAR, gait: "trot", skin: "f" },
  pig: { kind: "quad", spec: PIG, gait: "trot", skin: "f" },
  sheep: { kind: "quad", spec: SHEEP, gait: "trot", skin: "f" },
  owl: { kind: "bird", spec: OWL, skin: "f" },
  dragon: { kind: "quad", spec: DRAGON, gait: "trot", skin: "f" },
  azure: { kind: "quad", spec: AZURE, gait: "trot", skin: "f" },
  whitetiger: { kind: "quad", spec: WHITETIGER, gait: "trot", skin: "f" },
  tortoise: { kind: "quad", spec: TORTOISE, gait: "trot", skin: "f" },
  phoenix: { kind: "bird", spec: PHOENIX, skin: "f" },
  qilin: { kind: "quad", spec: QILIN, gait: "trot", skin: "f" },
  otter: { kind: "quad", spec: OTTER, gait: "trot", skin: "f" },
  alpaca: { kind: "quad", spec: ALPACA, gait: "trot", skin: "f" },
  parrot: { kind: "bird", spec: PARROT, skin: "f" },
  raccoon: { kind: "quad", spec: RACCOON, gait: "trot", skin: "f" },
  redpanda: { kind: "quad", spec: REDPANDA, gait: "trot", skin: "f" },
  arcticfox: { kind: "quad", spec: ARCTICFOX, gait: "trot", skin: "f" },
  peacock: { kind: "bird", spec: PEACOCK, skin: "f" },
  lion: { kind: "quad", spec: LION, gait: "trot", skin: "f" },
  unicorn: { kind: "quad", spec: UNICORN, gait: "trot", skin: "f" },
  kumiho: { kind: "quad", spec: KUMIHO, gait: "trot", skin: "f" },
  griffin: { kind: "bird", spec: GRIFFIN, skin: "f" }
};
var R = (id, name, rarity) => ({ id, name, rarity });
var SPECIES = [
  R("rabbit", "\uD1A0\uB07C", "common"),
  R("cat", "\uACE0\uC591\uC774", "common"),
  R("dog", "\uAC15\uC544\uC9C0", "common"),
  R("turtle", "\uAC70\uBD81\uC774", "common"),
  R("chick", "\uBCD1\uC544\uB9AC", "common"),
  R("duck", "\uC624\uB9AC", "common"),
  R("fox", "\uC5EC\uC6B0", "common"),
  R("hamster", "\uD584\uC2A4\uD130", "uncommon"),
  R("bear", "\uACF0", "uncommon"),
  R("pig", "\uB3FC\uC9C0", "uncommon"),
  R("owl", "\uBD80\uC5C9\uC774", "rare"),
  R("sheep", "\uC591", "rare"),
  R("otter", "\uC218\uB2EC", "rare"),
  R("alpaca", "\uC54C\uD30C\uCE74", "rare"),
  R("parrot", "\uC575\uBB34\uC0C8", "rare"),
  R("raccoon", "\uB108\uAD6C\uB9AC", "rare"),
  R("panda", "\uD310\uB2E4", "special"),
  R("penguin", "\uD3AD\uADC4", "special"),
  R("redpanda", "\uB808\uC11C\uD310\uB2E4", "special"),
  R("arcticfox", "\uBD81\uADF9\uC5EC\uC6B0", "special"),
  R("peacock", "\uACF5\uC791", "special"),
  R("lion", "\uC0AC\uC790", "special"),
  R("dragon", "\uC6A9", "legend"),
  R("unicorn", "\uC720\uB2C8\uCF58", "legend"),
  R("kumiho", "\uAD6C\uBBF8\uD638", "legend"),
  R("griffin", "\uADF8\uB9AC\uD540", "legend"),
  R("azure", "\uCCAD\uB8E1", "hidden"),
  R("whitetiger", "\uBC31\uD638", "hidden"),
  R("tortoise", "\uD604\uBB34", "hidden"),
  R("phoenix", "\uC8FC\uC791", "hidden"),
  R("qilin", "\uAE30\uB9B0", "hidden")
];
var speciesOf = (rarity) => SPECIES.filter((s) => s.rarity === rarity);
var COMMON_SPECIES = speciesOf("common");
var LEGEND_SPECIES = speciesOf("legend");
var HIDDEN_SPECIES = speciesOf("hidden");
var rarityOf = (id) => SPECIES.find((s) => s.id === id)?.rarity ?? "common";
var hasLegendForm = (id) => hasLegendFormRarity(rarityOf(id));
function legendDesign(d) {
  if (d.kind === "bird")
    return { ...d, spec: { ...d.spec, bodyWings: true } };
  return { ...d, spec: { ...d.spec, look: { ...d.spec.look, beak: d.spec.bodyWings || d.spec.horns ? d.spec.look.beak : tone("#ffd34a") }, bodyWings: true, mane: d.spec.mane ?? "flame" } };
}
function chunkAll(frames) {
  return Object.fromEntries(Object.entries(frames).map(([k, v]) => [k, chunky(v)]));
}
var cache2 = /* @__PURE__ */ new Map();
function spriteSet(id, stage, style = DEFAULT_STYLE) {
  const key = stage === "egg" ? "egg" : [id, stage === "legend" && !hasLegendForm(id) ? "adult" : stage, style.variant, style.accessory, style.neck ?? "none", style.effect ?? "none"].join("/");
  const cached = cache2.get(key);
  if (cached)
    return cached;
  let made;
  if (stage === "egg") {
    made = { palette: paletteOf(EGG_LOOK), frames: chunkAll(eggFrames()), skin: "" };
  } else {
    const legend = stage === "legend" && hasLegendForm(id);
    const d = legend ? legendDesign(DESIGNS[id]) : DESIGNS[id];
    const artStage = stage === "baby" ? "baby" : "adult";
    const look = tintLook(d.spec.look, style.variant);
    const frames = d.kind === "quad" ? quadFrames({ ...d.spec, look, accessory: style.accessory, neck: style.neck ?? "none" }, artStage, d.gait) : birdFrames({ ...d.spec, look, accessory: style.accessory, neck: style.neck ?? "none" }, artStage);
    const chunked = chunkAll(frames);
    const withEffect = style.effect && style.effect !== "none" ? Object.fromEntries(Object.entries(chunked).map(([k, v]) => [k, applyEffect(v, style.effect)])) : chunked;
    made = { palette: { ...paletteOf(look), ...accessoryPalette(style.accessory), ...neckPalette(style.neck), ...effectPalette(style.effect) }, frames: withEffect, skin: d.skin };
  }
  cache2.set(key, made);
  return made;
}
function isSpeciesId(value) {
  return typeof value === "string" && SPECIES.some((s) => s.id === value);
}

// dist/shared/pet.js
var HATCH_XP = 20;
var ADULT_LEVEL = 5;
var LEGEND_LEVEL = 10;
function levelOf(xp) {
  return 1 + Math.floor(Math.sqrt(Math.max(0, xp) / 10));
}
function stageOf(pet) {
  if (pet.xp < HATCH_XP)
    return "egg";
  const level = levelOf(pet.xp);
  if (level >= LEGEND_LEVEL && hasLegendForm(pet.speciesId))
    return "legend";
  return level >= ADULT_LEVEL ? "adult" : "baby";
}
var LEVEL_TIERS = [
  { tier: 0, name: "\uC0C8\uB0B4\uAE30", color: "#8d7b68", onColor: "#ffffff" },
  { tier: 1, name: "\uC219\uB828", color: "#3aa55d", onColor: "#ffffff" },
  { tier: 2, name: "\uBCA0\uD14C\uB791", color: "#3a7bd5", onColor: "#ffffff" },
  { tier: 3, name: "\uB2EC\uC778", color: "#8a4bd8", onColor: "#ffffff" },
  { tier: 4, name: "\uBA85\uC778", color: "#f08a24", onColor: "#ffffff" },
  { tier: 5, name: "\uC2E0\uD654", color: "#e8b400", onColor: "#3b2f2f" }
];
var tierIndexOf = (level) => Math.min(LEVEL_TIERS.length - 1, Math.floor(Math.max(1, level) / 10));
var levelTier = (level) => LEVEL_TIERS[tierIndexOf(level)];
function createPet(speciesId, now) {
  return { speciesId, xp: 0, hunger: 80, happiness: 80, lastTickAt: now, lastTouchAt: 0, clean: 100 };
}

// dist/shared/card.js
function xpProgress(xp) {
  const level = levelOf(xp);
  const base = 10 * (level - 1) ** 2;
  const next = 10 * level ** 2;
  return { level, into: Math.max(0, xp - base), need: next - base };
}
var W = 420;
var H = 190;
var CELL = 32;
var GROUND3 = 100;
var TOP = GROUND3 - 31;
var MARGIN = 14;
var STRIP_Y = 120;
var SPEED = 45;
var COLORS = {
  bg: "#232640",
  line: "#6d28d9",
  accent: "#ffd166",
  violet: "#a78bfa",
  ground: "#2a2e52",
  grass: "#3b4a7a",
  mute: "#9aa0c8",
  stone: "#3a3f6e",
  stoneTop: "#5a66b0",
  wall: "#4a4f86",
  roof: "#8b3a4a",
  roofTop: "#b0505f",
  door: "#2a1f3d",
  windowOff: "#2e3256",
  windowOn: "#ffd166",
  chip: "#2b2f55",
  white: "#e8eaff"
};
var esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
function spriteRects(rows, palette) {
  const out = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === ch)
        end++;
      const color = ch === "." ? void 0 : palette[ch];
      if (color)
        out.push(`<rect x="${x}" y="${y}" width="${end - x}" height="1" fill="${color}"/>`);
      x = end;
    }
  });
  return out.join("");
}
var textWidth = (s, size) => Array.from(s).reduce((sum, ch) => sum + ((ch.codePointAt(0) ?? 0) > 11904 ? size : size * 0.62), 0);
var pct = (n) => `${Math.round(n * 100) / 100}%`;
var rect2 = (x, y, w, h, fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`;
function visibleBetween(name, from, to) {
  const frames = [`0%{opacity:${from === 0 ? 1 : 0}}`];
  if (from > 0)
    frames.push(`${pct(from - 0.01)}{opacity:0}`, `${pct(from)}{opacity:1}`);
  if (to < 100)
    frames.push(`${pct(to)}{opacity:1}`, `${pct(to + 0.01)}{opacity:0}`, "100%{opacity:0}");
  else
    frames.push("100%{opacity:1}");
  return `@keyframes ${name}{${frames.join("")}}`;
}
var START_X = MARGIN;
var WALK_UP = [
  [START_X, 0],
  [106, 0],
  [170, 32],
  [194, 32]
];
var SIT_AT = [194, 32];
var WALK_DOWN = [
  [194, 32],
  [218, 32],
  [282, 0],
  [339, 0]
];
var HOUSE_DOOR_X = 339;
var WALK_BACK = [
  [339, 0],
  [282, 0],
  [218, 32],
  [194, 32],
  [170, 32],
  [106, 0],
  [START_X, 0]
];
var SIT_SEC = 3;
var HOUSE_SEC = 4;
var SLEEP_SEC = 3;
var length = (pts) => pts.slice(1).reduce((sum, p, i) => sum + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
function moveKeyframes(name, pts, startSec, loopSec) {
  let t = startSec;
  const frames = pts.map((p, i) => {
    if (i > 0)
      t += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) / SPEED;
    return { at: t / loopSec * 100, x: p[0] - START_X, y: -p[1] };
  });
  const first = frames[0];
  const last = frames[frames.length - 1];
  const out = [];
  if (first.at > 0)
    out.push("0%{opacity:0}", `${pct(first.at - 0.01)}{opacity:0}`);
  for (const f of frames)
    out.push(`${pct(f.at)}{opacity:1;transform:translate(${f.x}px,${f.y}px)}`);
  if (last.at < 100)
    out.push(`${pct(last.at + 0.01)}{opacity:0}`, "100%{opacity:0}");
  return `@keyframes ${name}{${out.join("")}}`;
}
function sceneArt() {
  const stars = [
    [40, 18],
    [88, 34],
    [150, 14],
    [212, 26],
    [268, 12],
    [310, 30],
    [366, 16],
    [400, 40]
  ].map(([x, y]) => rect2(x, y, 2, 2, COLORS.violet)).join("");
  const moon = `<circle cx="${W - 44}" cy="26" r="9" fill="${COLORS.accent}"/><circle cx="${W - 40}" cy="23" r="8" fill="${COLORS.bg}"/>`;
  const ground = rect2(0, GROUND3 + 1, W, STRIP_Y - GROUND3 - 1, COLORS.ground);
  const grass = Array.from({ length: 22 }, (_, i) => rect2(MARGIN + i * 19, GROUND3 + 6, 9, 3, COLORS.grass)).join("");
  const blocks = [
    [130, 8],
    [146, 16],
    [162, 24],
    [178, 32],
    [242, 24],
    [258, 16],
    [274, 8]
  ];
  const stairs = blocks.map(([x, h]) => rect2(x, GROUND3 - h + 1, x === 178 ? 64 : 16, h, COLORS.stone) + rect2(x, GROUND3 - h + 1, x === 178 ? 64 : 16, 2, COLORS.stoneTop)).join("");
  const hx = 326;
  const hw = 72;
  const roofRows = Array.from({ length: 8 }, (_, i) => rect2(hx - 6 + i * 5, GROUND3 - 40 - (i + 1) * 4 + 1, hw + 12 - i * 10, 4, i === 7 ? COLORS.roofTop : COLORS.roof)).join("");
  const house = [
    rect2(hx + 46, GROUND3 - 66, 8, 20, COLORS.wall),
    // 굴뚝
    rect2(hx, GROUND3 - 40 + 1, hw, 40, COLORS.wall),
    roofRows,
    rect2(HOUSE_DOOR_X + 8, GROUND3 - 26 + 1, 16, 26, COLORS.door),
    rect2(HOUSE_DOOR_X + 20, GROUND3 - 14, 2, 2, COLORS.accent),
    // 손잡이
    rect2(hx + 48, GROUND3 - 32, 14, 14, COLORS.windowOff),
    `<rect class="lit" x="${hx + 48}" y="${GROUND3 - 32}" width="14" height="14" fill="${COLORS.windowOn}"/>`,
    rect2(hx + 54, GROUND3 - 32, 2, 14, COLORS.wall),
    rect2(hx + 48, GROUND3 - 26, 14, 2, COLORS.wall)
  ].join("");
  return [stars, moon, ground, grass, stairs, house].join("");
}
function renderProfileCard(input) {
  const { pet, style } = input;
  const codex = input.codex ?? buildCodex(emptyGrowth(), { tipsSeen: 0 }, 0);
  const stage = input.stage ?? stageOf(pet);
  const set = spriteSet(pet.speciesId, stage, style);
  const level = levelOf(pet.xp);
  const prog = xpProgress(pet.xp);
  const tier = levelTier(level);
  const name = input.name?.trim() ?? "";
  const label = `${name ? `${name}, ` : ""}${pet.speciesId} ${stage}, level ${level}, walking around its house`;
  const walk = ["walk1", "walk2", "walk3", "walk4"].map((n) => set.frames[n]);
  const sit = ["sitA", "sitB"].map((n) => set.frames[n]);
  const sleep = ["sleepA", "sleepB"].map((n) => set.frames[n]);
  const prop = input.prop && input.prop !== "none" ? input.prop : null;
  const propSet = prop ? propFrames(prop) : [];
  const propH = propSet[0]?.length ?? 0;
  const propW = propSet[0]?.[0]?.length ?? 0;
  const propAt = (x) => prop ? `<g transform="translate(${x},${prop && PROP_MOTION[prop] === "float" ? 4 : CELL - propH})"><use class="pr0" href="#p1" opacity="0"/><use class="pr1" href="#p2" opacity="0"/></g>` : "";
  const defs = [
    ...propSet.map((rows, i) => `<g id="p${i + 1}">${spriteRects(rows, prop ? PROP_COLORS[prop] : {})}</g>`),
    ...walk.map((rows, i) => `<g id="w${i + 1}">${spriteRects(rows, set.palette)}</g>`),
    ...sit.map((rows, i) => `<g id="s${i + 1}">${spriteRects(rows, set.palette)}</g>`),
    ...sleep.map((rows, i) => `<g id="z${i + 1}">${spriteRects(rows, set.palette)}</g>`)
  ].join("");
  const frames = (prefix, n, cls) => Array.from({ length: n }, (_, i) => `<use class="${cls}${i}" href="#${prefix}${i + 1}" opacity="0"/>`).join("");
  const flipAttr = (flipped) => flipped ? ` transform="translate(${CELL},0) scale(-1,1)"` : "";
  const walkFrames = (flipped) => `<g${flipAttr(flipped)}>${frames("w", 4, "wk")}</g>`;
  const sitFrames = (flipped) => `<g${flipAttr(flipped)}>${frames("s", 2, "st")}</g>`;
  const sleepFrames = (flipped) => `<g${flipAttr(flipped)}>${frames("z", 2, "sl")}</g>`;
  const tUp = length(WALK_UP) / SPEED;
  const tDown = length(WALK_DOWN) / SPEED;
  const tBack = length(WALK_BACK) / SPEED;
  const sitStart = tUp;
  const downStart = sitStart + SIT_SEC;
  const houseStart = downStart + tDown;
  const backStart = houseStart + HOUSE_SEC;
  const sleepStart = backStart + tBack;
  const loop = Math.round((sleepStart + SLEEP_SEC) * 10) / 10;
  const p = (sec) => sec / loop * 100;
  const css = [
    // 걷기 프레임: 0.6초에 4장
    ...[0, 1, 2, 3].map((i) => `.wk${i}{animation:on4 0.6s step-end infinite;animation-delay:${(i * 0.15).toFixed(2)}s}`),
    "@keyframes on4{0%{opacity:1}25%{opacity:0}100%{opacity:0}}",
    // 앉기·졸기 프레임: 숨 쉬듯 두 장을 번갈아
    ...[0, 1].map((i) => `.st${i}{animation:on2 1.2s step-end infinite;animation-delay:${(i * 0.6).toFixed(1)}s}`),
    ...[0, 1].map((i) => `.sl${i}{animation:on2 2.4s step-end infinite;animation-delay:${(i * 1.2).toFixed(1)}s}`),
    ".pr0{animation:on2 0.8s step-end infinite}.pr1{animation:on2 0.8s step-end infinite;animation-delay:0.4s}",
    "@keyframes on2{0%{opacity:1}50%{opacity:0}100%{opacity:0}}",
    // 걷는 구간 셋(올라가기·내려가기·돌아오기)과 쉬는 구간 둘(앉기·졸기)
    `.mUp,.mDown,.mBack{opacity:0}.mUp{animation:mvUp ${loop}s linear infinite}.mDown{animation:mvDown ${loop}s linear infinite}.mBack{animation:mvBack ${loop}s linear infinite}`,
    moveKeyframes("mvUp", WALK_UP, 0, loop),
    moveKeyframes("mvDown", WALK_DOWN, downStart, loop),
    moveKeyframes("mvBack", WALK_BACK, backStart, loop),
    `.sitG{opacity:0;animation:showSit ${loop}s linear infinite}.sleepG{opacity:0;animation:showSleep ${loop}s linear infinite}`,
    visibleBetween("showSit", p(sitStart), p(downStart)),
    visibleBetween("showSleep", p(sleepStart), 100),
    // 집에 들어가 있는 동안 창문에 불이 켜지고 z 가 떠오른다
    `.lit{opacity:0;animation:showLit ${loop}s linear infinite}`,
    visibleBetween("showLit", p(houseStart), p(backStart)),
    `.houseZ{opacity:0;animation:showLit ${loop}s linear infinite}`,
    ".zz{animation:zfloat 2.4s ease-in-out infinite}",
    ".zz2{animation-delay:1.2s}",
    "@keyframes zfloat{0%{opacity:0;transform:translate(0,0)}30%{opacity:1}100%{opacity:0;transform:translate(7px,-14px)}}",
    // 움직임을 줄이는 설정이면 멈춘 채 출발 자리에 서 있는다
    "@media (prefers-reduced-motion:reduce){*{animation:none!important}.wk0,.pr0{opacity:1!important}.mUp{opacity:1!important}}"
  ].join("");
  const standAt = (pt) => `translate(${pt[0]},${GROUND3 - 31 - pt[1] + 0})`;
  const chips = [
    ["STREAK", `${codex.streak.current}D`],
    ["CODEX", `${codex.rulesLearned}/${codex.rulesTotal}`],
    ["BADGES", `${codex.achievements.filter((a) => a.unlocked).length}/${codex.achievements.length}`],
    ["FIXED", String(codex.counters.fixes)],
    ["QUIZ", String(codex.counters.quizCorrect)],
    ["TIPS", `${codex.tipsSeen}/${codex.tipsTotal}`]
  ];
  const chipW = 58;
  const chipGap = (W - 2 * MARGIN - chips.length * chipW) / (chips.length - 1);
  const chipY = STRIP_Y + 34;
  const chipsSvg = chips.map(([k, v], i) => {
    const x = MARGIN + i * (chipW + chipGap);
    return [
      rect2(Math.round(x), chipY, chipW, 30, COLORS.chip),
      `<text x="${Math.round(x + chipW / 2)}" y="${chipY + 11}" text-anchor="middle" font-size="8" fill="${COLORS.mute}">${k}</text>`,
      `<text x="${Math.round(x + chipW / 2)}" y="${chipY + 25}" text-anchor="middle" font-size="13" font-weight="700" fill="${COLORS.white}">${esc(v)}</text>`
    ].join("");
  }).join("");
  const barX = 236;
  const barW = W - MARGIN - barX - 52;
  const fill = Math.round(barW * Math.min(1, prog.into / prog.need) / 2) * 2;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges" role="img" aria-label="${esc(label)}" font-family="'Courier New', Consolas, 'Malgun Gothic', 'Apple SD Gothic Neo', 'Noto Sans KR', monospace">`,
    `<title>${esc(label)}</title>`,
    `<style>${css}</style>`,
    `<defs>${defs}</defs>`,
    rect2(0, 0, W, H, COLORS.bg),
    sceneArt(),
    // 집 안에서 자는 z (창문 옆)
    `<g class="houseZ"><text class="zz" x="${326 + 52}" y="${GROUND3 - 36}" font-size="11" font-weight="700" fill="${COLORS.violet}">Z</text><text class="zz zz2" x="${326 + 60}" y="${GROUND3 - 44}" font-size="9" font-weight="700" fill="${COLORS.violet}">z</text></g>`,
    // 펫: 올라가기 / 위에서 앉기 / 내려가서 집으로 / 돌아오기 / 왼쪽 끝에서 졸기
    `<g transform="translate(${START_X},${TOP})">`,
    `<g class="mUp">${walkFrames(false)}${propAt(CELL - 4)}</g>`,
    `<g class="mDown">${walkFrames(false)}${propAt(CELL - 4)}</g>`,
    `<g class="mBack">${walkFrames(true)}${propAt(4 - propW)}</g>`,
    `</g>`,
    `<g transform="${standAt(SIT_AT)}"><g class="sitG">${sitFrames(false)}${propAt(CELL - 4)}</g></g>`,
    `<g transform="${standAt([START_X, 0])}"><g class="sleepG">${sleepFrames(true)}<text class="zz" x="${CELL - 6}" y="12" font-size="9" font-weight="700" fill="${COLORS.violet}">Z</text><text class="zz zz2" x="${CELL}" y="4" font-size="7" font-weight="700" fill="${COLORS.violet}">z</text></g></g>`,
    // 정보줄
    rect2(0, STRIP_Y, W, 2, COLORS.line),
    rect2(MARGIN, STRIP_Y + 12, 8, 8, COLORS.accent),
    `<text x="${MARGIN + 14}" y="${STRIP_Y + 20}" font-size="13" font-weight="700" fill="${COLORS.accent}">${esc(name || pet.speciesId.toUpperCase())}</text>`,
    `<text x="${MARGIN + 14 + textWidth(name || pet.speciesId.toUpperCase(), 13) + 8}" y="${STRIP_Y + 20}" font-size="11" fill="${COLORS.mute}">${esc((name ? `${pet.speciesId} ${stage}` : stage).toUpperCase())}</text>`,
    `<text x="${barX - 8}" y="${STRIP_Y + 20}" text-anchor="end" font-size="13" font-weight="700" fill="${tier.color}">LV ${level}</text>`,
    rect2(barX, STRIP_Y + 12, barW, 8, COLORS.chip),
    rect2(barX, STRIP_Y + 12, Math.max(2, fill), 8, tier.color),
    `<text x="${barX + barW + 6}" y="${STRIP_Y + 20}" font-size="9" fill="${COLORS.mute}">${prog.into}/${prog.need}</text>`,
    chipsSvg,
    `<rect x="2" y="2" width="${W - 4}" height="${H - 4}" fill="none" stroke="${COLORS.line}" stroke-width="4"/>`,
    `</svg>`
  ].join("\n");
}

// dist/shared/settings.js
var MAX_PET_NAME = 12;
function sanitizePetName(v) {
  if (typeof v !== "string")
    return "";
  const cleaned = v.replace(/[\u0000-\u001f\u007f<>&"]/g, "").replace(/\s+/g, " ").trim();
  return Array.from(cleaned).slice(0, MAX_PET_NAME).join("").trim();
}

// dist/shared/card-endpoint.js
var W2 = 420;
var H2 = 190;
var DAY_MS = 864e5;
function notFoundSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W2}" height="${H2}" viewBox="0 0 ${W2} ${H2}"><rect width="${W2}" height="${H2}" rx="6" fill="#232640"/><rect x="1.5" y="1.5" width="${W2 - 3}" height="${H2 - 3}" rx="5" fill="none" stroke="#6d28d9" stroke-width="3"/><text x="${W2 / 2}" y="${H2 / 2 - 4}" text-anchor="middle" font-family="monospace" font-size="16" fill="#ffd166">NO PET CARD</text><text x="${W2 / 2}" y="${H2 / 2 + 18}" text-anchor="middle" font-family="monospace" font-size="11" fill="#9aa0c8">LOG IN WITH GITHUB IN THE APP</text></svg>`;
}
var num = (v, max) => typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.min(max, Math.floor(v))) : 0;
function readExtras(raw, speciesId, now) {
  if (typeof raw !== "object" || raw === null)
    return null;
  const e = raw;
  const style = {
    variant: isVariant(e["variant"]) ? e["variant"] : DEFAULT_STYLE.variant,
    accessory: isAccessory(e["accessory"]) ? e["accessory"] : DEFAULT_STYLE.accessory,
    neck: isNeck(e["neck"]) ? e["neck"] : "none",
    effect: isEffect(e["effect"]) ? e["effect"] : "none"
  };
  const name = sanitizePetName(e["name"]);
  const stage = e["stage"] === "baby" || e["stage"] === "adult" || e["stage"] === "legend" && speciesId !== null && isSpeciesId(speciesId) && hasLegendForm(speciesId) ? e["stage"] : void 0;
  const day = typeof e["day"] === "string" && /^\d{4}-\d{2}-\d{2}$/.test(e["day"]) ? Date.parse(e["day"] + "T00:00:00Z") : NaN;
  const fresh = Number.isFinite(day) && now - day <= 2 * DAY_MS;
  const streak = fresh ? num(e["streak"], 3650) : 0;
  const g = emptyGrowth();
  g.counters.fixes = num(e["fixes"], 1e5);
  g.counters.quizCorrect = num(e["quiz"], 1e5);
  g.days = Array.from({ length: Math.min(streak, 400) }, (_, i) => localDay(now - (Math.min(streak, 400) - 1 - i) * DAY_MS));
  RULE_IDS.slice(0, Math.min(num(e["rules"], 100), RULE_IDS.length)).forEach((id) => {
    g.rules[id] = { confirms: 1, fixes: 0 };
  });
  ACHIEVEMENTS.slice(0, Math.min(num(e["badges"], 100), ACHIEVEMENTS.length)).forEach((a) => {
    g.achievements[a.id] = now;
  });
  const codex = buildCodex(g, { tipsSeen: num(e["tips"], 1e3) }, now);
  const prop = isProp(e["prop"]) && e["prop"] !== "none" ? e["prop"] : void 0;
  return { style, name, ...prop ? { prop } : {}, ...stage ? { stage } : {}, codex };
}
function renderCardFromRow(row, now = Date.now()) {
  if (!row || row.found !== true)
    return { svg: notFoundSvg(), status: "notfound" };
  const species = typeof row.species_id === "string" && isSpeciesId(row.species_id) ? row.species_id : null;
  const xp = typeof row.xp === "number" && Number.isFinite(row.xp) ? Math.max(0, Math.min(2e6, Math.floor(row.xp))) : 0;
  const pet = { ...createPet(species ?? "rabbit", now), xp: species ? xp : 0 };
  const extras = species ? readExtras(row.extras, species, now) : null;
  const svg = renderProfileCard({
    pet,
    style: extras?.style ?? DEFAULT_STYLE,
    ...extras?.prop ? { prop: extras.prop } : {},
    ...extras ? { codex: extras.codex, ...extras.name ? { name: extras.name } : {}, ...extras.stage ? { stage: extras.stage } : {} } : {}
  });
  return { svg, status: species ? "ok" : "empty" };
}
export {
  readExtras,
  renderCardFromRow
};
