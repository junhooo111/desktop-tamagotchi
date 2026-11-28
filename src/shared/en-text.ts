/**
 * 펫이 하는 말(한국어)을 영어로 바꾸는 번역기.
 * 돌보기·학습·업적처럼 여러 모듈이 한국어 문장을 만들어 돌려주기 때문에, 말풍선으로 나가기 직전(main 의 say)에
 * 이 함수를 한 번 거친다. 이름(동물·장식·업적)은 표로, 문장은 앞에서부터 차례로 맞는 규칙으로 바꾼다.
 * 모르는 문장은 그대로 한국어로 남는다(번역이 없다고 말을 못 하게 하지는 않는다).
 */

export const NAMES_EN: Record<string, string> = {
  // 동물
  토끼: 'Rabbit', 고양이: 'Cat', 강아지: 'Puppy', 거북이: 'Turtle', 병아리: 'Chick', 오리: 'Duck', 여우: 'Fox', 햄스터: 'Hamster',
  펭귄: 'Penguin', 판다: 'Panda', 곰: 'Bear', 돼지: 'Pig', 양: 'Sheep', 부엉이: 'Owl',
  용: 'Dragon', 청룡: 'Azure Dragon', 백호: 'White Tiger', 현무: 'Black Tortoise', 주작: 'Vermilion Bird', 기린: 'Qilin', 수달: 'Otter', 유니콘: 'Unicorn', 구미호: 'Nine-tailed fox', 그리핀: 'Griffin', 레서판다: 'Red panda', 북극여우: 'Arctic fox', 공작: 'Peacock', 사자: 'Lion', 알파카: 'Alpaca', 앵무새: 'Parrot', 너구리: 'Raccoon',
  // 장식
  리본: 'Ribbon', 선글라스: 'Sunglasses', 왕관: 'Crown', 날개: 'Wings', 새싹: 'Sprout', 꽃: 'Flower', '파티 모자': 'Party hat',
  '천사 고리': 'Halo', 야구모자: 'Cap', '마법사 모자': 'Witch hat', '요리사 모자': 'Chef hat', '산타 모자': 'Santa hat',
  '별 머리띠': 'Star headband', '하트 더듬이': 'Heart antennae', '토끼 귀': 'Bunny ears', 안대: 'Eyepatch', '외알 안경': 'Monocle', '반짝 별': 'Twinkle star', '방울 목줄': 'Bell collar', 스카프: 'Scarf', 나비넥타이: 'Bow tie', '진주 목걸이': 'Pearl necklace', '별 목걸이': 'Star necklace', '황금 목걸이': 'Gold chain', 반짝이: 'Sparkles', 하트: 'Hearts', 음표: 'Music notes', 눈송이: 'Snowflakes', '불꽃 오라': 'Flame aura', '베레모': 'Beret', '비니': 'Beanie', '두건': 'Bandana', '카우보이 모자': 'Cowboy hat', '헤드폰': 'Headphones', '해적 모자': 'Pirate hat', '기사 투구': 'Knight helmet', '악마 뿔': 'Devil horns', '유니콘 뿔': 'Unicorn horn', '불꽃 왕관': 'Flame crown',
  // 색
  기본: 'Default', 파스텔: 'Pastel', 진하게: 'Deep', 흑백: 'Mono',
  // 업적
  '첫 배움': 'First lesson', '열심히 배우는 중': 'Studying hard', 'FE 꿈나무': 'FE sprout', '퀴즈 척척': 'Quiz whiz', '퀴즈 박사': 'Quiz master',
  '첫 수정': 'First fix', '문제 해결사': 'Problem solver', 'FE 장인': 'FE artisan', '다섯 가지 기본기': 'Five basics', '열 가지 기본기': 'Ten basics',
  '도감 완성': 'Codex complete', '지식 수집가': 'Knowledge collector', '지식 박사': 'Knowledge master', '사흘 연속': 'Three-day streak',
  '일주일 연속': 'One-week streak', '한 달 연속': 'One-month streak', '다정한 친구': 'Kind friend', '금손 집사': 'Golden-hand keeper',
  깔끔쟁이: 'Neat freak', '산책 친구': 'Walking buddy', '동물 수집가': 'Animal collector', '뽑기 단골': 'Gacha regular', '전설의 만남': 'Legendary encounter',
  '첫 친구': 'First friend', '친구 부자': 'Friend collector', 단짝: 'Best buddies', 절친: 'Close friends', '영혼의 단짝': 'Soul mates',
  // 등급·단계
  경험치: 'XP', 배부름: 'Fullness', 기분: 'Mood', 청결: 'Clean',
  새내기: 'Newbie', 숙련: 'Skilled', 베테랑: 'Veteran', 달인: 'Master', 명인: 'Grandmaster', 신화: 'Mythic',
  알: 'Egg', 새끼: 'Baby', 성체: 'Adult', 전설: 'Legend',
};

/** 동물·장식·업적·등급 이름의 영어(없으면 그대로). */
export const nameEn = (ko: string): string => NAMES_EN[ko] ?? ko;
/** 업적 설명(growth.ts 의 description)의 영어. 도감 창이 쓴다. */
export const ACH_DESC_EN: Record<string, string> = {
  '배움 카드를 처음 확인했어요': 'You confirmed a learning card for the first time',
  '배움 카드를 10번 확인했어요': 'You confirmed learning cards 10 times',
  '배움 카드를 50번 확인했어요': 'You confirmed learning cards 50 times',
  '확인 퀴즈를 5번 맞혔어요': 'You answered 5 check quizzes correctly',
  '확인 퀴즈를 25번 맞혔어요': 'You answered 25 check quizzes correctly',
  '펫이 찾은 문제를 처음 고쳤어요': 'You fixed a problem the pet found for the first time',
  '찾은 문제를 10개 고쳤어요': 'You fixed 10 problems',
  '찾은 문제를 30개 고쳤어요': 'You fixed 30 problems',
  '서로 다른 문제 5종을 배웠어요': 'You learned 5 different problem types',
  '서로 다른 문제 10종을 배웠어요': 'You learned 10 different problem types',
  '모든 종류의 문제를 한 번씩 배웠어요': 'You learned every problem type once',
  'FE 지식을 10개 읽었어요': 'You read 10 FE tips',
  '모든 FE 지식을 읽었어요': 'You read every FE tip',
  '3일 연속으로 펫과 함께했어요': 'You spent 3 days in a row with your pet',
  '7일 연속으로 펫과 함께했어요': 'You spent 7 days in a row with your pet',
  '30일 연속으로 펫과 함께했어요': 'You spent 30 days in a row with your pet',
  '쓰다듬고, 밥 주고, 놀아 준 횟수가 50번이에요': 'You petted, fed, and played 50 times',
  '돌봐 준 횟수가 200번이에요': 'You took care of your pet 200 times',
  '펫을 20번 씻겼어요': 'You washed your pet 20 times',
  '산책을 10번 다녀왔어요': 'You went on 10 walks',
  '서로 다른 동물을 5종 모았어요': 'You collected 5 different animals',
  '동물 뽑기를 10번 했어요': 'You pulled for animals 10 times',
  '히든 동물을 처음 만났어요': 'You met a hidden animal for the first time',
  '친구를 처음 사귀었어요': 'You made your first friend',
  '친구가 3명이 되었어요': 'You have 3 friends',
  '친구와 친밀도 레벨 3이 되었어요': 'You reached friendship level 3 with a friend',
  '친구와 친밀도 레벨 5가 되었어요': 'You reached friendship level 5 with a friend',
  '친구와 친밀도 레벨 10이 되었어요': 'You reached friendship level 10 with a friend',
};

NAMES_EN['없음'] = 'None';
NAMES_EN['자동(지금 단계)'] = 'Auto (current stage)';
NAMES_EN['지금 키우는 펫'] = 'Current pet';

const N = nameEn;

/** 앞에서부터 맞는 규칙 하나로 한 문장 조각을 바꾼다. */
const RULES: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
  // 검사가 알려 주는 상세 문구(collector.ts)
  [/<html lang> 없음/, () => '<html lang> missing'],
  [/<title> 비어 있음/, () => '<title> is empty'],
  [/meta viewport 없음/, () => 'meta viewport missing'],
  [/h(\d) 다음에 h(\d)/, (m) => `h${m[2]} after h${m[1]}`],
  [/폭 (\d+)px, 화면 (\d+)px/, (m) => `width ${m[1]}px, screen ${m[2]}px`],
  [/대비 ([\d.]+):1 \(기준 ([\d.]+):1\)/, (m) => `contrast ${m[1]}:1 (needs ${m[2]}:1)`],
  [/id="([^"]*)" 가 (\d+)번 쓰임/, (m) => `id="${m[1]}" used ${m[2]} times`],
  [/th 없음/, () => 'no th'],
  [/meta description 없음/, () => 'meta description missing'],
  [/원본 (\d+)px → 표시 (\d+)px/, (m) => `original ${m[1]}px → shown ${m[2]}px`],
  [/<(\w+)> 에 포커스가 갈 수 있어요/, (m) => `<${m[1]}> can receive focus`],
  [/<main> 없음/, () => '<main> missing'],
  [/<(\w+) autoplay> 에 muted 없음/, (m) => `<${m[1]} autoplay> has no muted`],
  [/(aria-[a-z]+)="([^"]*)" 인 요소 없음/, (m) => `${m[1]}="${m[2]}" has no matching element`],
  [/for="([^"]*)" 인 요소 없음/, (m) => `for="${m[1]}" has no matching element`],
  [/<(\w+)> 안에 <(\w+)>/, (m) => `<${m[2]}> inside <${m[1]}>`],
  [/(\d+)초 뒤 이동/, (m) => `redirects after ${m[1]} s`],
  [/role="([^"]*)" 인데 tabindex 없음/, (m) => `role="${m[1]}" without tabindex`],
  [/<(\w+)> 스크롤 영역에 tabindex 없음/, (m) => `<${m[1]}> scroll area without tabindex`],
  [/주변 글자와 색 대비 ([\d.]+):1, 밑줄 없음/, (m) => `color contrast with surrounding text ${m[1]}:1, no underline`],
  [/글자 ([\d.]+)px/, (m) => `text ${m[1]}px`],
  [/infinite 애니메이션, prefers-reduced-motion 없음/, () => 'infinite animation, no prefers-reduced-motion'],
  [/<video> 에 자막 track 없음/, () => '<video> has no caption track'],
  [/화면 위에서 (\d+)px 아래/, (m) => `${m[1]}px below the top`],
  [/@font-face 에 font-display 없음/, () => '@font-face has no font-display'],
  [/요소 (\d+)개/, (m) => `${m[1]} elements`],
  [/h1 이 (\d+)개/, (m) => `${m[1]} h1 elements`],
  [/(og:[a-z]+(?:, og:[a-z]+)*) 없음/, (m) => `${m[1]} missing`],
  [/페이지 전체/, () => 'Whole page'],
  // 계정 맞추기(account-sync.ts)
  [/^계정과 맞추지 못했어요: /, () => 'Could not sync with your account: '],
  [/^이 PC의 진행을 계정에 올렸어요\. 다른 PC에서 같은 GitHub 계정으로 로그인하면 이어서 할 수 있어요/, () => 'Uploaded this PC progress to your account. Log in with the same GitHub account on another PC to continue'],
  [/^계정에 저장된 진행을 읽을 수 없어서 건드리지 않았어요/, () => 'Could not read the progress saved in your account, so I left it untouched'],
  [/^이 PC의 진행을 계정에 올렸어요\(이전 계정 진행은 서버에 백업돼 있어요\)/, () => 'Uploaded this PC progress to your account (the previous account progress is backed up on the server)'],
  [/^나중에 맞출게요\. 그때까지는 이 PC의 진행이 계정에 올라가지 않아요/, () => 'I will sync later. Until then this PC progress is not uploaded to your account'],
  [/^다른 PC에서 먼저 저장했어요\. 메뉴의 "지금 계정과 맞추기"로 어느 쪽을 쓸지 골라 주세요/, () => 'Another PC saved first. Use "Sync with account now" in the menu to choose which side to keep'],
  [/^저장 데이터가 너무 커서 계정에 올리지 못했어요/, () => 'The save data is too large to upload to your account'],
  [/^계정에 저장하지 못했어요: /, () => 'Could not save to your account: '],
  // 서버·로그인(server-game.ts, auth.ts)
  [/^로그인이 끝나지 않았어요/, () => 'Login is not finished yet'],
  [/^서버에 연결하지 못했어요\. 인터넷을 확인하고 다시 해 주세요/, () => 'Could not connect to the server. Check your internet and try again'],
  [/^서버에서 처리하지 못했어요: /, () => 'The server could not handle it: '],
  [/^프로필을 찾지 못했어요/, () => 'Could not find your profile'],
  [/^로그인 서버가 아직 설정되지 않았어요/, () => 'The login server is not set up yet'],
  [/^로그인 주소를 만들지 못했어요/, () => 'Could not build the login address'],
  [/^로그인 응답을 받을 자리\((\d+)\)를 열지 못했어요\. 다른 프로그램이 쓰고 있을 수 있어요/, (m) => `Could not open the place to receive the login response (${m[1]}). Another program may be using it`],
  [/^GitHub 사용자/, () => 'GitHub user'],
  [/^업데이트 정보를 읽지 못했습니다/, () => 'Could not read the update information'],
  [/^받은 파일이 올바르지 않습니다\(해시가 다릅니다\)/, () => 'The downloaded file is not valid (hash mismatch)'],
  [/^받은 파일에서 앱을 찾지 못했습니다/, () => 'Could not find the app in the downloaded file'],
  // 돌보기
  [/^따뜻해요…/, () => 'So warm…'],
  [/^좋아요!/, () => 'Feels good!'],
  [/^알은 아직 밥을 못 먹어요\./, () => 'An egg cannot eat yet.'],
  [/^배불러요!/, () => 'I am full!'],
  [/^냠냠, 맛있어요!/, () => 'Yum, delicious!'],
  [/^알은 아직 못 놀아요\./, () => 'An egg cannot play yet.'],
  [/^배고파서 못 놀겠어요…/, () => 'Too hungry to play…'],
  [/^신나요!/, () => 'So fun!'],
  [/^알은 아직 못 씻어요\./, () => 'An egg cannot wash yet.'],
  [/^이미 깨끗해요!/, () => 'Already clean!'],
  [/^보글보글! 깨끗해졌어요!/, () => 'Bubble bubble! All clean!'],
  [/^알은 아직 산책을 못 가요\./, () => 'An egg cannot go for a walk yet.'],
  [/^배고파서 산책 못 가요…/, () => 'Too hungry for a walk…'],
  [/^산책 가요! 마우스를 따라갈게요/, () => 'Walk time! I will follow your mouse'],
  [/^산책 끝! 지쳤어요…/, () => 'Walk done! So tired…'],
  // 학습
  [/^정답! 배웠어요!/, () => 'Correct! I learned something!'],
  [/^배웠어요!/, () => 'I learned something!'],
  [/^고쳤네요, 대단해요!/, () => 'You fixed it, amazing!'],
  [/^새로 알았어요!/, () => 'Learned something new!'],
  // 성장 덧붙임
  [/^ 알이 부화했어요! (.+)\(이\)가 태어났어요\./, (m) => ` The egg hatched! ${N(m[1] ?? '')} was born.`],
  [/^ (.+)\(이\)가 전설의 모습으로 진화했어요!/, (m) => ` ${N(m[1] ?? '')} evolved into its legendary form!`],
  [/^ ✨ '(.+)' 등급이 되었어요!/, (m) => ` ✨ Reached '${N(m[1] ?? '')}' rank!`],
  [/^ 레벨 (\d+)이 되었어요!/, (m) => ` Level ${m[1]} reached!`],
  [/^( ?)경험치 \+(\d+)/, (m) => `${m[1]}XP +${m[2]}`],
  // 선물
  [/^🎁 뽑기권 (\d+)장이 들어 있었어요!/, (m) => `🎁 There were ${m[1]} ticket(s) inside!`],
  [/^🎁 경험치 \+(\d+)!/, (m) => `🎁 XP +${m[1]}!`],
  [/^🎁 …앗, 응가였어요! 꽝이에요 😢/, () => '🎁 …oops, it was poop! No prize 😢'],
  // 서버·업데이트
  [/^새 버전 (\S+) 을 받는 중이에요/, (m) => `Downloading version ${m[1]}`],
  [/^새 버전 (\S+) 이 있어요/, (m) => `Version ${m[1]} is available`],
  [/^새 버전 (\S+) 이 준비됐어요! 우클릭 → '설치하고 다시 시작'을 눌러 주세요/, (m) => `Version ${m[1]} is ready! Right-click → 'Install and restart'`],
  [/^새 버전 (\S+) 이 준비됐어요\. 펫을 종료하면 설치돼요/, (m) => `Version ${m[1]} is ready. It installs when you quit the pet`],
  [/^최신 버전이에요/, () => 'You are up to date'],
  [/^업데이트를 확인하지 못했어요\. 인터넷 연결을 확인해 주세요/, () => 'Could not check for updates. Please check your internet connection'],
  [/^확인하는 중…/, () => 'Checking…'],
  [/^GitHub 에서 잠시 요청을 막았어요\. 몇 분 뒤에 다시 눌러 주세요/, () => 'GitHub is limiting requests for a moment. Please try again in a few minutes'],
  [/^업데이트 정보를 찾지 못했어요\. 새 버전을 올리는 중일 수 있으니 잠시 뒤에 다시 해 주세요/, () => 'Could not find the update information. A new version may be being uploaded; please try again shortly'],
  [/^받은 파일을 확인하지 못했어요\. 잠시 뒤에 다시 해 주세요/, () => 'Could not verify the downloaded file. Please try again shortly'],
  [/^업데이트를 확인하지 못했어요\. 잠시 뒤에 다시 해 주세요 \(원인: /, () => 'Could not check for updates. Please try again shortly (cause: '],
  [/^🎟 새 기능! 뽑기권 (\d+)장을 드렸어요\.\n메뉴의 '뽑기…'에서 새 동물을 뽑아 보세요/, (m) => `🎟 New feature! You got ${m[1]} ticket(s).\nPull new animals in the menu's 'Gacha…'`],
  // 서버 오류(friendlyError)
  [/^뽑기권이 모자라요/, () => 'Not enough tickets'],
  [/^게임머니가 모자라요/, () => 'Not enough game money'],
  [/^마지막 한 마리는 팔 수 없어요/, () => 'You cannot sell your last animal'],
  [/^이미 경매장에 올라가 있어요/, () => 'Already listed in the auction house'],
  [/^이미 팔렸거나 내려간 펫이에요/, () => 'This pet is already sold or removed'],
  [/^내가 올린 펫은 살 수 없어요/, () => 'You cannot buy your own listing'],
  [/^내 펫이 아니에요/, () => 'That is not your pet'],
  [/^꾸미기를 모두 모았어요!/, () => 'You have collected every cosmetic!'],
  [/^가격은 1~1,000,000 사이의 정수로 써 주세요/, () => 'Enter a whole-number price from 1 to 1,000,000'],
  [/^아직 GitHub 연동이 준비되지 않았어요/, () => 'GitHub integration is not ready yet'],
];

/** 한국어 문장 하나(여러 줄이면 줄마다)를 영어로. 규칙에 없는 조각은 그대로 둔다. */
export function toEnglish(text: string): string {
  return text
    .split('\n')
    .map((line) => translateLine(line))
    .join('\n');
}

function translateLine(line: string): string {
  // 앞쪽 문장 + 이어 붙는 덧붙임("… 경험치 +5 레벨 3이 되었어요! ...")을 조각내어 차례로 바꾼다.
  let rest = line;
  let out = '';
  let guard = 0;
  while (rest !== '' && guard++ < 12) {
    const hit = firstRule(rest);
    if (!hit) {
      out += rest;
      break;
    }
    out += hit.text;
    rest = rest.slice(hit.length);
  }
  return out;
}

function firstRule(s: string): { text: string; length: number } | null {
  for (const [re, fn] of RULES) {
    const m = s.match(re);
    if (m && m.index === 0 && m[0].length > 0) return { text: fn(m), length: m[0].length };
  }
  // 한국어 조각이 규칙 밖에 있으면 다음 규칙이 맞는 곳까지 그대로 넘긴다.
  let best = -1;
  for (const [re] of RULES) {
    const m = s.slice(1).match(re);
    if (m && m.index !== undefined && m[0].length > 0 && (best === -1 || m.index + 1 < best)) best = m.index + 1;
  }
  return best > 0 ? { text: s.slice(0, best), length: best } : null;
}
