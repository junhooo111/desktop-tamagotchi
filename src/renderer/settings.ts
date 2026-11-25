/**
 * 설정 창 화면. 선택지는 shared/settings.ts 의 SETTING_CHOICES 로 그리고,
 * 바꿀 때마다 메인에 보내서 바로 적용·저장한다(메인이 값을 다시 검증하고 저장된 전체 설정을 돌려준다).
 */
import { CATEGORY_LABELS, LESSONS, RULE_IDS, type RuleCategory } from '../shared/lessons.js';
import { SETTING_CHOICES, type Settings } from '../shared/settings.js';

interface SettingsApi {
  get(): Promise<Settings>;
  set(patch: Partial<Settings>): Promise<Settings>;
  version(): Promise<string>;
  checkUpdate(): Promise<string>;
  onUpdateStatus(callback: (text: string) => void): void;
  close(): void;
}

declare global {
  interface Window {
    settingsApi: SettingsApi;
  }
}

const $ = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;

type ChoiceKey = keyof typeof SETTING_CHOICES;

const LABELS: Record<ChoiceKey, (n: number) => string> = {
  petScale: (n) => (n === 1 ? '1배 (커서 크기)' : `${n}배`),
  scanSeconds: (n) => `${n}초`,
  tipMinutes: (n) => (n === 0 ? '끄기' : `${n}분`),
};

let current: Settings;

function renderChoices(key: ChoiceKey): void {
  const box = $(key);
  box.textContent = '';
  for (const value of SETTING_CHOICES[key]) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = LABELS[key](value);
    button.dataset['value'] = String(value);
    button.setAttribute('aria-pressed', String(current[key] === value));
    button.addEventListener('click', () => void change({ [key]: value } as Partial<Settings>));
    box.appendChild(button);
  }
}

/** 규칙을 분류별로 묶어 체크박스로 보여 준다. 체크 해제 = 그 규칙은 알리지 않는다. */
function renderRules(): void {
  const box = $('rules');
  box.textContent = '';
  for (const category of Object.keys(CATEGORY_LABELS) as RuleCategory[]) {
    const ids = RULE_IDS.filter((id) => LESSONS[id].category === category);
    if (ids.length === 0) continue;
    const head = document.createElement('h3');
    head.textContent = CATEGORY_LABELS[category];
    box.append(head);
    for (const id of ids) {
      const label = document.createElement('label');
      label.className = 'check';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.dataset['rule'] = id;
      input.checked = !current.disabledRules.includes(id);
      input.addEventListener('change', () => void change({ disabledRules: RULE_IDS.filter((r) => (r === id ? !input.checked : current.disabledRules.includes(r))) }));
      label.append(input, ' ' + LESSONS[id].title);
      box.append(label);
    }
  }
}

function render(): void {
  renderRules();
  for (const key of Object.keys(SETTING_CHOICES) as ChoiceKey[]) renderChoices(key);
  $<HTMLInputElement>('inspectEnabled').checked = current.inspectEnabled;
  $<HTMLInputElement>('autoUpdate').checked = current.autoUpdate;
  // 검사를 껐으면 주기 선택은 의미가 없다.
  for (const b of $('scanSeconds').querySelectorAll('button')) (b as HTMLButtonElement).disabled = !current.inspectEnabled;
}

async function change(patch: Partial<Settings>): Promise<void> {
  current = await window.settingsApi.set(patch);
  render();
}

function setStatus(text: string): void {
  $('update-status').textContent = text;
}

async function start(): Promise<void> {
  current = await window.settingsApi.get();
  render();
  $('version').textContent = `버전 ${await window.settingsApi.version()}`;

  $<HTMLInputElement>('inspectEnabled').addEventListener('change', (e) => void change({ inspectEnabled: (e.target as HTMLInputElement).checked }));
  $<HTMLInputElement>('autoUpdate').addEventListener('change', (e) => void change({ autoUpdate: (e.target as HTMLInputElement).checked }));
  $('rules-all-on').addEventListener('click', () => void change({ disabledRules: [] }));
  $('check-update').addEventListener('click', () => {
    setStatus('확인하는 중…');
    void window.settingsApi.checkUpdate().then(setStatus);
  });
  $('close').addEventListener('click', () => window.settingsApi.close());
  window.settingsApi.onUpdateStatus(setStatus);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') window.settingsApi.close();
  });
}

void start();
