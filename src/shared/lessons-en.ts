/**
 * 검사 규칙 학습 카드(제목·말풍선·문제·이유·해결)와 확인 퀴즈의 영어 번역. 코드 예시는 그대로 쓴다.
 * 규칙을 새로 추가할 때는 여기에도 같은 id 로 영어를 추가한다(시험이 빠진 것을 잡아 준다).
 */
import type { RuleId } from './lessons.js';

export interface LessonEn {
  title: string;
  bubble: string;
  problem: string;
  why: string;
  fix: string;
}

export interface QuizEn {
  question: string;
  options: [string, string, string];
  explain: string;
}

export const LESSONS_EN: Record<RuleId, LessonEn> = {
  "img-alt": {
    title: "The image has no alt text",
    bubble: "This image has no alt!",
    problem: "The <img> tag has no alt attribute at all.",
    why: "Without alt, screen readers read out the file name. If the image breaks, no description is left, and search engines cannot understand the image either.",
    fix: "If the image carries meaning, describe it in one sentence; if it is decorative, leave alt=\"\" empty (the attribute itself must exist).",
  },
  "button-name": {
    title: "A button or link has no name",
    bubble: "I cannot tell what this button does!",
    problem: "An icon-only button or link has neither text nor aria-label.",
    why: "Screen reader users only hear \"button\" and cannot tell what it does. Voice control users cannot say its name to press it either.",
    fix: "Add visible text, or for icon buttons write the function in aria-label.",
  },
  "form-label": {
    title: "An input has no label",
    bubble: "I do not know what this field is!",
    problem: "An <input>, <select>, or <textarea> has no connected <label> or aria-label. A field with only a placeholder counts too.",
    why: "A placeholder disappears once you start typing and is often not accepted as a label by screen readers. You also lose the convenience of clicking the label to focus the field.",
    fix: "Connect it with <label for>, or use aria-label if you want to hide the label.",
  },
  "html-lang": {
    title: "<html> has no lang",
    bubble: "I do not know this page's language!",
    problem: "The <html> element has no lang attribute.",
    why: "Screen readers use it to choose pronunciation rules, and browser translation, spell check, and hyphenation also look at lang.",
    fix: "Put the page's main language on <html>.",
  },
  "page-title": {
    title: "The page title (<title>) is empty",
    bubble: "The tab title is empty!",
    problem: "document.title is empty or missing.",
    why: "Browser tabs, bookmarks, search results, and screen reader page announcements all start from the title. You cannot tell tabs apart when there are many.",
    fix: "Give every page a unique title that tells what it is. In an SPA, change the title when the route changes.",
  },
  "viewport-meta": {
    title: "The viewport meta tag is missing",
    bubble: "It may break on mobile!",
    problem: "There is no <meta name=\"viewport\">.",
    why: "Without this tag, mobile browsers render at desktop width (about 980px) and then shrink it. Your responsive CSS does not work as intended.",
    fix: "Add the viewport tag to <head>.",
  },
  "heading-order": {
    title: "A heading level was skipped",
    bubble: "A heading level is skipped!",
    problem: "Somewhere a heading level is skipped, like an h3 right after an h1.",
    why: "Screen reader users learn the page structure from the list of headings. When levels are skipped, they assume content is missing.",
    fix: "Follow h1 → h2 → h3 by structure, not size, and adjust size with CSS.",
  },
  "touch-target": {
    title: "The tap target is too small",
    bubble: "Too small to tap with a finger!",
    problem: "A control such as a button or input is smaller than 24px in width or height.",
    why: "It is easy to mis-tap on mobile, and people with tremors find it hard to hit. The accessibility standard (WCAG 2.2) asks for at least 24px, and 44px is recommended.",
    fix: "Even if it looks small, grow the tappable area with padding or min-width/min-height.",
  },
  "h-overflow": {
    title: "It overflows the screen and scrolls sideways",
    bubble: "It sticks out of the screen!",
    problem: "The page is wider than the browser, so a horizontal scrollbar appears. The element below crosses the right edge.",
    why: "On mobile the screen wobbles left and right and content gets cut off. Fixed px widths and long words, tables, or images are common causes.",
    fix: "Use % or max-width: 100% for widths, overflow-wrap for long text, and give tables their own horizontal scroll area.",
  },
  contrast: {
    title: "Text and background contrast is too low",
    bubble: "The text is hard to see!",
    problem: "The contrast between text color and background is below the standard (4.5:1 for normal text, 3:1 for large text).",
    why: "It is hard to read not only for people with low vision but also outdoors in bright light or with low screen brightness. Light gray text is the most common cause.",
    fix: "Darken the text or change the background to raise the contrast. The color picker in browser dev tools shows the contrast ratio.",
  },
  "dup-id": {
    title: "The same id is used more than once on a page",
    bubble: "The same id is used twice!",
    problem: "More than one element on the page has the same id value.",
    why: "An id must be unique on a page. When duplicated, label for, aria-labelledby, anchor links, and getElementById only point at the first element, so the wrong thing responds. It often happens when a repeated component hard-codes an id string.",
    fix: "For repeated elements, drop the id and use a class, or generate a different id per item (useId in React).",
  },
  "zoom-disabled": {
    title: "Zooming is disabled",
    bubble: "Zooming is blocked!",
    problem: "The viewport meta tag has user-scalable=no or maximum-scale of 1 or less.",
    why: "People with low vision pinch-zoom to read text. Blocking zoom removes their way to read and violates the accessibility standard (WCAG 1.4.4). Recent browsers partly ignore it, but code that tries to block zoom is itself the problem.",
    fix: "Remove user-scalable and maximum-scale. If input zoom bothers you, make input text at least 16px.",
  },
  "tabindex-positive": {
    title: "A positive tabindex is used",
    bubble: "tabindex is positive!",
    problem: "An element has tabindex of 1 or more.",
    why: "A positive tabindex focuses that element first regardless of screen order. Keyboard and screen reader navigation gets scrambled, and it becomes unmanageable as elements grow.",
    fix: "Use only tabindex 0 (focusable in order) or -1 (focusable by code), and set the order by the order in your HTML.",
  },
  "alt-quality": {
    title: "alt is a file name or a meaningless word",
    bubble: "alt looks like a file name!",
    problem: "alt is a file name like \"hero.png\" or a word like \"image\" or \"photo\" that does not tell what the image is.",
    why: "Screen readers read alt exactly. Hearing \"image image\" or \"hero dot png\" tells you nothing about the image. It often comes from filling in alt mechanically.",
    fix: "Describe what the image conveys in one sentence. You can drop words like \"image\". If it is decorative, leave alt=\"\" empty.",
  },
  "clickable-div": {
    title: "A div or span is used like a button",
    bubble: "A div is acting like a button!",
    problem: "It looks clickable (pointer cursor) but is a div or span rather than a button or link, and has no role or tabindex.",
    why: "You cannot Tab to it, cannot press it with Enter or Space, and screen readers do not announce it as a button. People who cannot use a mouse cannot use this feature. It is the most common accessibility mistake in AI-generated screens.",
    fix: "Switch to a real <button> (or <a href> for navigation) and restyle it with CSS. If it truly must be a div, you must add role=\"button\", tabindex=\"0\", and all keyboard events yourself.",
  },
  "table-header": {
    title: "The table has no header cells (th)",
    bubble: "The table has no header cells!",
    problem: "There is not a single <th> inside the <table>.",
    why: "Screen readers use th to tell which column a cell belongs to. With only td, they cannot say what the numbers are. Making text bold does not convey structure.",
    fix: "Use <th scope=\"col\"> for header cells (scope=\"row\" for row headers). If the table is only for layout, use CSS grid or flex instead of table.",
  },
  "meta-description": {
    title: "The search description (meta description) is missing",
    bubble: "No description for search results!",
    problem: "<meta name=\"description\"> is missing or empty.",
    why: "The two-line description in search results and link previews is exactly this value. Without it, the search engine pulls an arbitrary sentence from the body, which rarely makes people want to click.",
    fix: "Summarize each page in one or two sentences (around 120 to 160 characters). It should differ per page, and do not just repeat the title.",
  },
  "img-oversized": {
    title: "The image is much bigger than it appears on screen",
    bubble: "The image is too big!",
    problem: "The image's original width is far more than 2x the width it is drawn at (including high-DPI scale).",
    why: "You download pixels nobody sees, which slows loading and wastes data, especially on mobile. It often comes from uploading the original photo and only shrinking it with CSS.",
    fix: "Resize to about 2x the displayed size (for high-DPI screens) and use light formats like WebP or AVIF. Use srcset and sizes to pick the right file per screen size.",
  },
  "vague-link": {
    title: "The link text is meaningless, like \"here\"",
    bubble: "The link says \"here\"!",
    problem: "The link text is something like \"here\", \"click here\", or \"link\" that does not say where it goes.",
    why: "Screen reader users skim the list of links on its own. Hearing only \"here, here, here\" they cannot tell which is which. Search engines also understand the target page from link text.",
    fix: "Make the link text alone tell the destination. Even in a sentence, link a specific phrase like \"read the user guide\".",
  },
  "frame-title": {
    title: "The iframe has no title",
    bubble: "The iframe has no title!",
    problem: "An <iframe> has neither a title nor aria-label.",
    why: "When a screen reader meets an iframe it announces \"frame\" and reads its name. Without a name, you cannot tell whether it is a map, a payment form, or a video until you enter it, so you cannot decide whether to skip it.",
    fix: "Give the iframe a title that describes its content. If it is decorative, use aria-hidden and tabindex=\"-1\" so assistive tech skips it.",
  },
  "aria-hidden-focus": {
    title: "A hidden element (aria-hidden) contains something keyboard-focusable",
    bubble: "Focus can reach a hidden spot!",
    problem: "An element with aria-hidden=\"true\" contains a link, button, or input that can be reached with Tab.",
    why: "If it is hidden from screen readers but keyboard focus can still reach it, users hit focus that lands in \"nothing\". They cannot tell where they are or what they are pressing. It often happens with closed menus or the background behind a modal.",
    fix: "If you hide it, block focus too: use inert (or hidden/display:none), or add tabindex=\"-1\" to the elements inside. If it should be visible, remove aria-hidden.",
  },
  "empty-heading": {
    title: "A heading (h1 to h6) has no content",
    bubble: "The heading tag is empty!",
    problem: "An <h1> to <h6> or role=\"heading\" element has no readable text.",
    why: "Screen reader users skim a page through its list of headings. An empty heading slips in as a blank entry that only says \"heading\" and confuses the structure. It often happens when heading tags are used just to enlarge text.",
    fix: "Put text in headings, and use CSS if you only need the look. For an icon heading, give it a name with aria-label or image alt.",
  },
  "landmark-main": {
    title: "The page has no main content area (main)",
    bubble: "There is no <main> area!",
    problem: "The document has no <main> or role=\"main\".",
    why: "Screen reader and keyboard users use \"skip to main content\" to jump past menus. Without main, they must pass the header and menu from the start on every page. It is the same convenience sighted users get by skipping the logo.",
    fix: "Wrap the page's core content in a single <main> (one per page). Use <header>, <nav>, and <footer> as well for the best result.",
  },
  "autoplay-media": {
    title: "A video or audio with sound plays by itself",
    bubble: "Sound plays by itself!",
    problem: "An autoplay <video> or <audio> has no muted, so sound plays as soon as the page opens.",
    why: "It talks over screen reader speech so announcements cannot be heard, and users cannot use the page until they find how to stop the sound. It bothers everyone in quiet places or in public. Sound longer than 3 seconds must be stoppable or mutable.",
    fix: "Autoplay muted, and if sound is needed let the user press play. Add controls so it can be stopped.",
  },
  "aria-broken-ref": {
    title: "The id being pointed to does not exist",
    bubble: "The id it points to is missing!",
    problem: "aria-labelledby, aria-describedby, or a label's for points to an id that is not in the document.",
    why: "The name and description are not connected, so the input is read without a name. It happens silently when you rename an id or delete an element and miss the link, so you cannot see it by eye.",
    fix: "Check that the id really exists, and when you rename one, change the connection too. If no connection is needed, remove the attribute.",
  },
  "nested-interactive": {
    title: "A button or link contains another button or link",
    bubble: "There is a button inside a button!",
    problem: "An <a href> or <button> has another link, button, or input nested inside it.",
    why: "Assistive technology may miss the inner element or act as if two were pressed at once. HTML does not allow this structure, and browsers interpret it differently, so keyboard and touch misbehave.",
    fix: "Place them side by side and overlap them with CSS. To make a whole card clickable, keep only one outer link and move the inner action elsewhere.",
  },
  "autocomplete-missing": {
    title: "Name, email, and phone inputs have no autocomplete",
    bubble: "No autocomplete attribute!",
    problem: "Inputs that collect personal information such as email, phone, name, or address have no autocomplete.",
    why: "This accessibility standard (WCAG 1.3.5) lets people with limited hand use, trouble typing, or memory difficulty fill in saved values in one step. It also makes sign-up and checkout much faster for everyone.",
    fix: "Use an autocomplete value that matches the purpose: email, tel, name, given-name, family-name, street-address, postal-code …",
  },
  "meta-refresh": {
    title: "The page refreshes or redirects by itself (meta refresh)",
    bubble: "It refreshes by itself!",
    problem: "<meta http-equiv=\"refresh\"> reloads the page or sends it elsewhere after a few seconds.",
    why: "Slow readers, screen reader users, and keyboard users cannot finish before time runs out and get pushed out of where they were reading. Time limits must be stoppable or extendable.",
    fix: "Instead of an automatic redirect, give a link or button so the user moves on their own. If an immediate (0 second) redirect is needed, use a server redirect (301/302).",
  },
  "focus-outline": {
    title: "The focus indicator is removed with no replacement",
    bubble: "The focus indicator is gone!",
    problem: "CSS removes outline with none or 0 on :focus, but there is no replacement indicator such as a border, shadow, or background.",
    why: "People navigating by keyboard rely on the focus ring as their only guide to where they are. Remove it and they get lost even when pressing Tab (WCAG 2.4.7). It is often removed because it looks clunky.",
    fix: "Do not delete outline; restyle it to fit your design. To show it only for keyboard use, use :focus-visible. Aim for at least 3:1 contrast with its surroundings.",
  },
  "role-no-focus": {
    title: "It has a button role but keyboard cannot reach it",
    bubble: "It has a role but Tab skips it!",
    problem: "A div or span has role=\"button\" (or link, checkbox, switch, and so on) but no tabindex, so Tab cannot focus it.",
    why: "A role only makes it read as a button; it does not create keyboard behavior. A screen reader says \"button\" while the keyboard cannot press it. You also have to handle Enter and Space yourself, which is risky.",
    fix: "Use a real <button> or <a> whenever possible. If it must be a div, add tabindex=\"0\" and handle Enter and Space too.",
  },
  "scroll-no-focus": {
    title: "A scrollable area cannot be moved by keyboard",
    bubble: "Tab cannot reach this scroll area!",
    problem: "The area overflows and scrolls, but it has no focusable element inside and no tabindex.",
    why: "People who cannot use a mouse wheel focus the area and scroll with arrow keys or PageDown. If the area cannot take focus, they can never see the overflowing content. It often happens with code blocks, tables, and chat lists.",
    fix: "Give the scroll area tabindex=\"0\" plus a role and a name (aria-label). If it has links or buttons inside, those are enough.",
  },
  "fake-link": {
    title: "A fake link that goes nowhere (href=\"#\")",
    bubble: "There is a fake link!",
    problem: "A link like <a href=\"#\"> or href=\"javascript:…\" does not navigate anywhere when pressed.",
    why: "A screen reader says \"link\", but it is really a button that runs an action, so it breaks expectations. Space does not work on it from the keyboard, and pressing it may jump to the top of the page. Middle-click and open in new tab also behave oddly.",
    fix: "If it is an action rather than navigation, use <button type=\"button\">. If it navigates, put a real address in href.",
  },
  "link-color-only": {
    title: "Links in text are distinguished by color alone",
    bubble: "Links differ only by color!",
    problem: "A link inside a sentence has no underline, weight, or other cue and is told apart only by a color less than 3:1 different from the surrounding text.",
    why: "For people with color blindness, grayscale screens, or screens in sunlight, the link looks the same as normal text. The standard says information must not be conveyed by color alone (WCAG 1.4.1).",
    fix: "Keep the underline on links (it is the default). If you removed it, add a second cue such as weight or a border, or make the color contrast with the surrounding text at least 3:1.",
  },
  "text-small": {
    title: "The text is too small (under 12px)",
    bubble: "The text is too small!",
    problem: "Visible text is smaller than 12px.",
    why: "People with low vision and older users find small text hard to read, and it is worse on mobile. Small text in a pale color is practically unreadable. It is a bigger problem if browser zoom is blocked.",
    fix: "Use about 16px (1rem) for body text and at least 12px for secondary text. Using rem instead of px follows the user's default font size.",
  },
  "reduced-motion": {
    title: "An endless animation ignores the \"reduce motion\" setting",
    bubble: "No reduced-motion handling!",
    problem: "There is an infinite animation but no prefers-reduced-motion handling anywhere in the CSS.",
    why: "People sensitive to motion (dizziness, motion sickness, attention difficulty) turn on \"reduce motion\" in their OS. Ignoring it keeps the screen constantly moving, making the page hard or even painful to view (WCAG 2.3.3).",
    fix: "Inside @media (prefers-reduced-motion: reduce), turn off or greatly tone down the animation.",
  },
  "role-img-alt": {
    title: "An element with role=\"img\" has no description",
    bubble: "role=\"img\" has no name!",
    problem: "An element with role=\"img\" (an icon svg, a CSS image) has no aria-label, aria-labelledby, or title.",
    why: "Screen readers only say \"image\" and cannot say what it is. It is not an img tag, so it escapes the alt check and is easy to miss.",
    fix: "If it has meaning, describe it with aria-label; if decorative, remove role=\"img\" and use aria-hidden=\"true\".",
  },
  "html-lang-valid": {
    title: "The html lang value is not valid",
    bubble: "The lang value looks wrong!",
    problem: "The <html lang> value is not a valid language code like ko or en-US (for example \"korean\" or \"kr\").",
    why: "Screen readers pick pronunciation rules from lang. With a wrong value they may read a Korean document with English pronunciation. Translation tools and search engines also use this value.",
    fix: "Use an ISO language code: ko for Korean, en for English, en-US for US English.",
  },
  "video-captions": {
    title: "The video has no captions",
    bubble: "The video has no captions!",
    problem: "A <video> has no <track kind=\"captions\"> (or subtitles). (Muted autoplay decorative videos are excluded.)",
    why: "People who cannot hear, and people watching where sound cannot be turned on (subway, library), cannot follow the content. Captions also help language learners and noisy places (WCAG 1.2.2).",
    fix: "Create a WebVTT caption file and attach it with <track>. Writing important sounds too (applause, alarms), not only speech, makes it better.",
  },
  "img-dimensions": {
    title: "The image has no width and height",
    bubble: "The image size is not given!",
    problem: "An <img> has no width/height attributes and no aspect-ratio.",
    why: "When the image arrives late it only then gets its space, and the content below jumps (CLS). Text may shift while you read and make you tap the wrong button.",
    fix: "Set width and height attributes at the image real ratio, or reserve the space with CSS aspect-ratio.",
  },
  "img-lazy-below-fold": {
    title: "Images far below the fold are all downloaded up front",
    bubble: "Lower images have no lazy!",
    problem: "An image well below the first screen has no loading=\"lazy\".",
    why: "Images nobody can see yet are downloaded all at once, slowing the first load and wasting data.",
    fix: "Add loading=\"lazy\" to images below the first screen. Do not use it on the large image on the first screen.",
  },
  "render-blocking-script": {
    title: "A script is blocking rendering",
    bubble: "A script blocks the page!",
    problem: "A <script src> in <head> has no async, defer, or type=\"module\".",
    why: "While the browser downloads and runs the script it cannot parse the HTML, so the page appears later.",
    fix: "Usually adding defer is enough. For order-independent analytics scripts, async is fine too.",
  },
  "font-display-missing": {
    title: "@font-face has no font-display",
    bubble: "font-display is missing!",
    problem: "An @font-face rule has no font-display.",
    why: "Text stays invisible until the font arrives (FOIT), or swaps much later and shakes the layout.",
    fix: "Use font-display: swap to show a fallback first and swap when the font arrives.",
  },
  "large-dom": {
    title: "There are too many elements (DOM)",
    bubble: "Too many elements!",
    problem: "The page has more than 1,500 DOM elements.",
    why: "The more elements there are, the slower first paint, style calculation, and scroll and input response get, and the more memory is used.",
    fix: "Use virtual scrolling for long lists, render hidden parts later, and cut needless nested wrapper divs.",
  },
  "multiple-h1": {
    title: "There is more than one h1",
    bubble: "There are two or more h1!",
    problem: "Two or more h1 elements are visible on a page.",
    why: "The h1 is the page main topic. With several, search engines and screen readers cannot tell what the core is.",
    fix: "Use just one h1 per page and structure the rest with h2 and below.",
  },
  "og-missing": {
    title: "Link preview (og tags) is missing",
    bubble: "No link preview!",
    problem: "The og:title or og:image meta tag is missing.",
    why: "When the address is pasted into a chat app or social media, the title and image come out wrong or the card is empty.",
    fix: "Add og:title, og:description, and og:image on every page (use an absolute image URL).",
  },
  "mixed-content": {
    title: "An https page loads http resources",
    bubble: "http resources are mixed in!",
    problem: "An https page loads images, scripts, styles, or frames from http:// addresses.",
    why: "Unencrypted resources can be altered in transit, so browsers block or warn. If a script is altered, the whole site is at risk.",
    fix: "Change resource URLs to https://. For servers that do not support it, use another source.",
  },
  "viewport-fixed-width": {
    title: "The viewport width is fixed to a number",
    bubble: "The viewport width is fixed!",
    problem: "The viewport meta tag fixes a number width like width=1024.",
    why: "It renders at that width regardless of the device and scales down, so text becomes tiny on small screens.",
    fix: "Change it to width=device-width, initial-scale=1.",
  },
  "input-font-small": {
    title: "Input text is smaller than 16px",
    bubble: "Input text is small!",
    problem: "The font size of an input or select is under 16px.",
    why: "iOS Safari automatically zooms in when you tap an input under 16px, shifting the layout and confusing users.",
    fix: "Make input text at least 16px (1rem). Blocking zoom with user-scalable=no is bad for accessibility.",
  },
  "button-type-missing": {
    title: "A button inside a form has no type",
    bubble: "The button has no type!",
    problem: "A <button> inside a <form> has no type attribute.",
    why: "Without a type, the default is submit, so pressing a \"Cancel\" or \"Show more\" button submits the form and reloads the page.",
    fix: "Use type=\"button\" for non-submit buttons and type=\"submit\" for submit buttons.",
  },
  "deprecated-tags": {
    title: "An obsolete tag is used",
    bubble: "An old tag is used!",
    problem: "Tags that are no longer used such as <center>, <font>, <marquee>, or <blink> are present.",
    why: "They were removed from the standards, so browsers may behave differently or drop support any time. Moving text (marquee, blink) in particular harms accessibility.",
    fix: "Handle the look with CSS (text-align, font-family, animation, and so on).",
  },
};

export const QUIZZES_EN: Record<RuleId, QuizEn> = {
  "img-alt": {
    question: "What is best for the alt of a decorative divider image?",
    options: ["Write alt=\"divider image\"", "Leave out the alt attribute entirely", "Leave it empty with alt=\"\""],
    explain: "Keeping the attribute but leaving it empty makes screen readers skip it. Leaving it out may make them read the file name.",
  },
  "button-name": {
    question: "What suits a close button that has only an X icon and no text?",
    options: ["aria-label=\"Close\"", "alt=\"X\"", "Do nothing"],
    explain: "Write the function in aria-label for icon buttons. If there is visible text, that text becomes the name.",
  },
  "form-label": {
    question: "What is the biggest problem with an input that has only a placeholder and no label?",
    options: ["The style breaks", "It disappears when typing starts, so you cannot tell what the field is", "It cannot be submitted"],
    explain: "A placeholder cannot replace a label. When a label is connected, clicking the label also focuses the input.",
  },
  "html-lang": {
    question: "What does <html lang=\"ko\"> directly help?",
    options: ["Page loading speed", "Screen reader pronunciation and browser translation", "Server response time"],
    explain: "lang tells the document's language. Reading, translation, and spell check all use this value.",
  },
  "page-title": {
    question: "What happens in an SPA if the title stays the same after moving to another screen?",
    options: ["Nothing is wrong", "Routing fails", "Tabs and screen readers cannot tell which screen it is"],
    explain: "When the route changes, document.title must change too. Telling tabs apart and screen reader announcements start from the title.",
  },
  "viewport-meta": {
    question: "How do mobile browsers render a page without the viewport meta tag?",
    options: ["At desktop width (about 980px) and then shrink it", "Exactly fitted to the screen width", "They refuse to render"],
    explain: "That is why responsive CSS does not work as intended. Always include width=device-width.",
  },
  "heading-order": {
    question: "Instead of using h3 to make a heading look smaller, what should you do?",
    options: ["Change it to a div", "Use h2 after h1 and shrink it with CSS", "Use h6"],
    explain: "Heading tags express structure, not size. Adjust the size with CSS.",
  },
  "touch-target": {
    question: "What is the best way to enlarge the tap area even if the icon is 16px?",
    options: ["Increase font-size", "Replace the icon image", "Add padding or min-width/min-height"],
    explain: "The visible size and the tappable area can be set separately. The recommended size is 44px.",
  },
  "h-overflow": {
    question: "Which CSS should you try first when an image is wider than its container and causes horizontal scroll?",
    options: ["overflow: scroll", "max-width: 100%; height: auto", "position: fixed"],
    explain: "max-width: 100% keeps it inside the container, and height: auto preserves the aspect ratio.",
  },
  contrast: {
    question: "What is the minimum contrast for normal-size text (WCAG AA)?",
    options: ["2:1", "3:1", "4.5:1"],
    explain: "Large text (24px and up, etc.) needs 3:1 but normal text needs 4.5:1. Light gray text is the most common mistake.",
  },
  "dup-id": {
    question: "What is the right way to give an id to an input inside a component rendered many times in a list?",
    options: ["Create a different id for each item (for example useId)", "Use the same id for all", "Use only name instead of id"],
    explain: "An id must be unique on the page. If duplicated, label connections only reach the first element.",
  },
  "zoom-disabled": {
    question: "Who is most inconvenienced by user-scalable=no in the viewport?",
    options: ["Desktop users", "Search engines", "Low-vision users who pinch-zoom to read"],
    explain: "Zoom is the basic tool of low-vision users. If you dislike input zoom, make input text at least 16px.",
  },
  "tabindex-positive": {
    question: "What is the best way to keep keyboard order safe?",
    options: ["Make the HTML order match the screen order", "Number tabindex 1, 2, 3 …", "Set tabindex to 99"],
    explain: "The default order is the HTML order. A positive tabindex scrambles the order and becomes hard to maintain.",
  },
  "alt-quality": {
    question: "What is the best alt for a photo of a team smiling in a meeting room?",
    options: ["alt=\"team.jpg\"", "alt=\"image\"", "alt=\"Team members smiling in a meeting room\""],
    explain: "alt is words that convey what the image conveys. A file name or \"image\" carries no information.",
  },
  "clickable-div": {
    question: "Which is the best way to make an element that saves on click?",
    options: ["<div onClick> with cursor: pointer", "<span role=\"link\">", "<button type=\"button\">"],
    explain: "A button gives you keyboard focus, Enter and Space, and screen reader announcements for free. With a div you must build them all yourself.",
  },
  "table-header": {
    question: "Which tag suits the \"Product, Price\" cells in the first row of a table?",
    options: ["<th scope=\"col\">", "<td> with bold text", "<div class=\"head\">"],
    explain: "th conveys that the cell is a column header. Bold alone is only a look, so screen readers cannot tell.",
  },
  "meta-description": {
    question: "How do you set the two-line description shown in search results yourself?",
    options: ["Write a long <title>", "Use <meta name=\"description\">", "Use two <h1> tags"],
    explain: "meta description is the first candidate for the description text. Summarize each page in one or two different sentences.",
  },
  "img-oversized": {
    question: "For an image shown at 400px on screen, what original width is best (considering high-DPI screens)?",
    options: ["4000px (the original as is)", "About 800px", "40px"],
    explain: "High-DPI screens use 2 pixels per unit, so 2x the displayed size is enough. Anything bigger is wasted.",
  },
  "vague-link": {
    question: "In \"Click here for details\", which part is best made the link?",
    options: ["\"here\"", "\"details\"", "\"Click\""],
    explain: "Link text alone should tell where it goes. \"here\" carries no information in a screen reader's link list.",
  },
  "frame-title": {
    question: "How do you make a map <iframe> understandable to screen reader users?",
    options: ["Write width and height exactly", "Remove the border", "Add title=\"Store location map\""],
    explain: "Screen readers read the iframe's title as its name. Without it they only say \"frame\" and you cannot tell what is inside.",
  },
  "aria-hidden-focus": {
    question: "How do you fully hide an off-screen menu from both assistive tech and the keyboard?",
    options: ["Add only aria-hidden=\"true\"", "Hide it with inert or hidden", "Make it transparent with opacity: 0"],
    explain: "aria-hidden only hides reading; Tab focus still goes in. inert and hidden (display:none) block focus too.",
  },
  "empty-heading": {
    question: "What happens if you use an empty <h2></h2> just to enlarge text?",
    options: ["An empty heading slips into the heading list and confuses the structure", "Nothing is wrong", "Search ranking goes up"],
    explain: "Screen reader users skim a page by its headings. An empty heading becomes a nameless entry that only gets in the way. Make the look with CSS.",
  },
  "landmark-main": {
    question: "Which tag lets keyboard and screen reader users skip the menu and jump to the content?",
    options: ["<div class=\"content\">", "<section>", "<main>"],
    explain: "<main> marks the page's core content, so the \"jump to main content\" feature finds it directly. Use only one per page.",
  },
  "autoplay-media": {
    question: "What must a background video that plays as soon as the page opens obey?",
    options: ["Play muted and let users stop it", "Turn the volume way down", "Make it longer than 10 seconds"],
    explain: "Autoplay sound overrides screen reader announcements. Play it muted and let people stop it with controls.",
  },
  "aria-broken-ref": {
    question: "What if you have <label for=\"mail\"> but the input id is \"email\"?",
    options: ["The browser connects them automatically", "The link breaks and the input is read without a name", "The input is focused automatically"],
    explain: "for and aria-labelledby need the id to match exactly. They may look the same to the eye, but with no connection the screen reader does not know the name.",
  },
  "nested-interactive": {
    question: "What is the right way when a whole card is a link but you also want an \"Add\" button inside?",
    options: ["Put <button> inside <a>", "Give the button role=\"link\"", "Place the link and button side by side and overlap them with CSS"],
    explain: "A link or button inside another link or button is missed by assistive tech and behaves differently per browser. Side by side is safer.",
  },
  "autocomplete-missing": {
    question: "How do you let the browser fill in a saved address for an email input?",
    options: ["Use autocomplete=\"email\"", "Use placeholder=\"Email\"", "Increase maxlength"],
    explain: "autocomplete values tell the input's purpose. It is an accessibility standard (WCAG 1.3.5) that lets people who find typing hard fill it in one step.",
  },
  "meta-refresh": {
    question: "Why is a meta refresh that sends users to another page after 5 seconds a problem?",
    options: ["The server gets slower", "Slow readers get kicked out before they finish", "The text gets blurry"],
    explain: "Time limits are a big barrier for slow readers and assistive technology users. Let them move on by themselves with a link.",
  },
  "focus-outline": {
    question: "Why should you not use outline: none just because the blue focus ring on a button looks ugly?",
    options: ["Keyboard users cannot tell where they are", "The button stops working", "The page gets slower"],
    explain: "The focus ring is the only guide for people moving by keyboard. Changing its look is fine but removing it is not; to show it only for keyboard use :focus-visible.",
  },
  "role-no-focus": {
    question: "What is missing if you only write <div role=\"button\">?",
    options: ["The \"this is a button\" info", "Tab focus and Enter/Space behavior", "The click event"],
    explain: "A role only changes what is read. Keyboard focus and behavior you must build yourself, so using a real <button> is easiest.",
  },
  "scroll-no-focus": {
    question: "How do you let people scroll an overflowing code block by keyboard?",
    options: ["Switch to overflow: hidden", "Make the text smaller", "Give it tabindex=\"0\" so it can receive focus"],
    explain: "It must receive focus so arrow keys can scroll it. If there is no link or button inside, the area itself needs tabindex=\"0\".",
  },
  "fake-link": {
    question: "Why should you not use <a href=\"#\"> for an action that opens a menu?",
    options: ["It is read as a link but is an action, not navigation, which breaks expectations", "The color turns blue", "The text looks underlined"],
    explain: "The convention is links for navigation and buttons for actions. A fake link is off in screen readers, the keyboard, and open in new tab alike.",
  },
  "link-color-only": {
    question: "What is the surest way to distinguish a link inside a sentence?",
    options: ["A darker blue", "An underline", "Slightly larger text"],
    explain: "Distinguishing by color alone disappears for color blindness and grayscale screens. An underline is a second cue that shows regardless of color.",
  },
  "text-small": {
    question: "What is the best body text size that is comfortable even on mobile?",
    options: ["About 16px (1rem)", "10px", "8px"],
    explain: "Under 12px is hard for low-vision users to read. Using rem also follows the user's default size.",
  },
  "reduced-motion": {
    question: "What do you use in CSS to respect the OS \"reduce motion\" setting?",
    options: ["prefers-reduced-motion", "prefers-color-scheme", "prefers-contrast"],
    explain: "Inside @media (prefers-reduced-motion: reduce), turn animations off or down so motion-sensitive people do not get dizzy.",
  },
  "role-img-alt": {
    question: "How do you make a meaningful icon <svg role=\"img\"> get read aloud?",
    options: ["Write a description with aria-label", "Increase the width", "Change the fill color"],
    explain: "role=\"img\" only reads \"image\". Tell what it is with aria-label. If it is decorative, hide it with aria-hidden.",
  },
  "html-lang-valid": {
    question: "What is the correct lang value for a Korean page?",
    options: ["korean", "kr", "ko"],
    explain: "lang uses ISO language codes (ko, en, en-US). A wrong value can make screen readers pronounce things oddly.",
  },
  "video-captions": {
    question: "What must you attach to an explainer video that has sound?",
    options: ["A thumbnail image", "Captions (<track kind=\"captions\">)", "A playback speed button"],
    explain: "People who cannot hear, or cannot turn sound on, cannot follow the content without captions.",
  },
  "img-dimensions": {
    question: "How do you reserve space before an image loads so the page does not jump?",
    options: ["Use loading=\"lazy\"","Write a long alt","Give width and height attributes (or aspect-ratio)"],
    explain: "If the ratio is known, the browser leaves room before the image arrives. It is the easiest way to prevent CLS.",
  },
  "img-lazy-below-fold": {
    question: "Which attribute suits images far down a long page?",
    options: ["fetchpriority=\"high\"","loading=\"lazy\"","decoding=\"sync\""],
    explain: "lazy fetches when the image gets near the screen, lightening the first load. Images on the first screen should load early instead.",
  },
  "render-blocking-script": {
    question: "What is the simplest attribute so a head script does not block display?",
    options: ["defer","blocking","sync"],
    explain: "defer does not block parsing and runs in order after the document is built.",
  },
  "font-display-missing": {
    question: "How do you show a fallback font before the web font arrives?",
    options: ["font-weight: bold","font-display: block","font-display: swap"],
    explain: "swap shows text immediately and swaps when the font arrives.",
  },
  "large-dom": {
    question: "How do you lighten a list with thousands of items?",
    options: ["Wrap each item in one more div","Use virtual scrolling that draws only what is visible","Hide them with CSS"],
    explain: "Creating DOM only for what is visible stays light no matter the count. Merely hiding leaves the elements in place.",
  },
  "multiple-h1": {
    question: "How many h1 elements, the page main heading, are best?",
    options: ["Several, one per design block","None","One per page"],
    explain: "One h1 states the core topic; build the hierarchy with h2 to h6.",
  },
  "og-missing": {
    question: "Which tag sets the preview image shown when a link is pasted into chat?",
    options: ["og:image","meta viewport","link rel=\"icon\""],
    explain: "og:image becomes the preview card image. Use an absolute URL.",
  },
  "mixed-content": {
    question: "What happens if you put an http:// script on an https page?",
    options: ["It gets faster","The browser blocks or warns, and it could be altered in transit","No effect"],
    explain: "Mixed content undermines security, so browsers block it. Use https everywhere.",
  },
  "viewport-fixed-width": {
    question: "What is the right viewport width for a responsive page?",
    options: ["1024","320","device-width"],
    explain: "device-width follows the real screen width so responsive CSS works properly.",
  },
  "input-font-small": {
    question: "What is the right way to stop iOS from zooming when an input is tapped?",
    options: ["Make input text at least 16px","Add user-scalable=no","Make the input small"],
    explain: "At 16px or more no auto-zoom happens. Blocking zoom itself harms low-vision users.",
  },
  "button-type-missing": {
    question: "What is the right type for a \"Show more\" button inside a form that should not submit?",
    options: ["submit","reset","button"],
    explain: "Without a type it is submit, so pressing it submits the form. For non-submit use type=\"button\".",
  },
  "deprecated-tags": {
    question: "What do you use instead of <center> to center text?",
    options: ["<font align=\"center\">","<mid>","text-align: center"],
    explain: "Presentation belongs to CSS in the standard. Tags like center and font are no longer used.",
  },
};

import { pick, type Lang } from './i18n.js';
import { LESSONS, type Lesson } from './lessons.js';
import { QUIZZES, type Quiz } from './quizzes.js';

/** 언어에 맞는 학습 카드(영어는 코드 예시만 한국어 원본을 그대로 쓴다). */
export function lessonFor(id: RuleId, lang: Lang): Lesson {
  const ko = LESSONS[id];
  return pick(lang, { ko, en: { ...ko, ...LESSONS_EN[id] } });
}

/** 언어에 맞는 확인 퀴즈(정답 위치는 같다). */
export function quizFor(id: RuleId, lang: Lang): Quiz {
  const ko = QUIZZES[id];
  return pick(lang, { ko, en: { ...ko, ...QUIZZES_EN[id] } });
}
