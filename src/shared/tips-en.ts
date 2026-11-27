/** 기존 FE 지식 20개의 영어 번역(id 기준). 새 지식은 tips-extra.ts 에 한국어·영어를 함께 둔다. */
export const TIPS_EN: Record<string, { title: string; body: string }> = {
  "semantic-html": {
    title: "Use the right tag instead of a div",
    body: "Use button for buttons, a for links, ul/li for lists, and you get keyboard support, screen reader support, and SEO for free. If you put onClick on a div, you have to build all of that yourself.",
  },
  "focus-visible": {
    title: "Replace outline: none, don't just remove it",
    body: "If you remove the focus ring, keyboard users cannot tell where they are. If you must remove it, add another indicator with :focus-visible.",
  },
  "box-sizing": {
    title: "Make box-sizing: border-box the default",
    body: "With the default (content-box), padding and border are added to width, so a 100% wide element overflows its parent. border-box includes padding and border inside the width.",
  },
  "flex-min-width": {
    title: "If a flex child will not shrink, use min-width: 0",
    body: "A flex item has min-width: auto by default, so long text keeps it from shrinking and it overflows the parent. min-width: 0 lets it shrink, and text-overflow ellipsis finally works.",
  },
  "rem-vs-px": {
    title: "Prefer rem over px for font sizes",
    body: "Fixing sizes in px ignores the browser font size the user chose. rem follows the user setting, which helps people with low vision.",
  },
  "list-key": {
    title: "Use a stable id as the React list key",
    body: "If you use the array index as key, state can attach to the wrong item when items are added, removed, or sorted. Use the unique id your data has.",
  },
  "effect-cleanup": {
    title: "useEffect and its cleanup go together",
    body: "Subscriptions, timers, and event listeners must be released in the cleanup function. Otherwise they pile up every time the screen mounts, causing memory leaks and duplicate runs.",
  },
  "fetch-race": {
    title: "Requests can come back in the wrong order",
    body: "If the search text changes quickly, an earlier request can arrive later and overwrite the screen. Cancel the previous request with AbortController.",
  },
  "loading-error-empty": {
    title: "A screen has four states",
    body: "If you only build the screen with data, it breaks or goes blank while loading, on errors, and for empty lists. This is what AI-generated screens miss most often.",
  },
  "json-parse-try": {
    title: "Wrap JSON.parse and localStorage in try/catch",
    body: "If a stored value is broken or empty, JSON.parse throws and the whole app stops. Assume anything from outside can fail.",
  },
  debounce: {
    title: "Debounce instead of requesting on every keystroke",
    body: "Calling the API for every letter in a search box causes server load and flicker. Send one request after the typing pauses.",
  },
  "promise-all": {
    title: "Use Promise.all for unrelated requests",
    body: "Awaiting independent requests one after another adds their times together. With Promise.all they run together and take only as long as the slowest one.",
  },
  "layout-shift": {
    title: "Tell the browser the image size up front",
    body: "When an image loads late and gets its size, the content below is pushed down (CLS). Reserve the space with width/height attributes or aspect-ratio.",
  },
  "lazy-image": {
    title: "Use loading=\"lazy\" for images below the fold",
    body: "Downloading images that are not visible at first slows the initial load. But do not use lazy on the large image visible on the first screen.",
  },
  "reduced-motion": {
    title: "Respect the reduce-motion setting",
    body: "People who feel dizzy turn on \"reduce motion\" in their OS. Turn off or tone down large movements with prefers-reduced-motion.",
  },
  "aria-live": {
    title: "Announce changing messages with aria-live",
    body: "Toast messages like \"Saved\" or errors only reach people who can see them. Put them in an aria-live region and screen readers will read them too.",
  },
  "z-index-context": {
    title: "z-index is only compared inside a stacking context",
    body: "Even with z-index: 9999, if a parent creates a new stacking context (position + z-index, transform, opacity, etc.) it cannot beat elements outside it. Put modals directly under body.",
  },
  "controlled-input": {
    title: "An input with value but no onChange cannot be typed into",
    body: "In React, the value you pass always decides what is shown. If onChange does not update the state, typing changes nothing. If you only need an initial value, use defaultValue.",
  },
  "cors-basics": {
    title: "A CORS error is the browser blocking it",
    body: "There is no CORS between servers. It is a security rule where the browser will not hand a cross-origin response to JS, so the fix is the server sending allow headers, or a proxy during development.",
  },
  "defer-script": {
    title: "Load scripts with defer",
    body: "A normal script in <head> stops HTML parsing while it downloads and runs. defer does not block parsing and runs in order after the document is built.",
  },
};
