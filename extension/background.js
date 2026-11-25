// 콘텐츠 스크립트가 보낸 검사 결과를 데스크톱 펫 앱(127.0.0.1 로컬 서버)으로 전달한다.
// 확장은 이 주소 외에는 어디에도 연결하지 않는다(manifest 의 host_permissions 참고).
const APP = 'http://127.0.0.1:47831';

function isLocalPage(url) {
  try {
    const u = new URL(url);
    return u.hostname === 'localhost' || u.hostname === '127.0.0.1' || u.hostname === '[::1]' || u.hostname.endsWith('.localhost');
  } catch {
    return false;
  }
}

chrome.runtime.onMessage.addListener((message, sender) => {
  // 이 확장의 콘텐츠 스크립트가 localhost 탭에서 보낸 것만 전달한다.
  if (sender.id !== chrome.runtime.id || message?.type !== 'snapshot') return;
  if (!sender.tab?.url || !isLocalPage(sender.tab.url)) return;
  fetch(`${APP}/snapshot`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(message.snapshot),
  }).catch(() => {
    // 앱이 꺼져 있으면 조용히 넘어간다. 다음 주기에 다시 보낸다.
  });
});
