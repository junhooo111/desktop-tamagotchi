const dot = document.getElementById('dot');
const state = document.getElementById('state');
fetch('http://127.0.0.1:47831/ping')
  .then((r) => r.json())
  .then((body) => {
    const ok = body && body.ok === true;
    dot.className = `dot ${ok ? 'on' : 'off'}`;
    state.textContent = ok ? '펫 앱에 연결됨' : '펫 앱이 아닌 것이 응답해요';
  })
  .catch(() => {
    dot.className = 'dot off';
    state.textContent = '펫 앱이 꺼져 있어요 (앱을 먼저 실행하세요)';
  });
