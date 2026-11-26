/** 'x.y.z' 형식의 버전 비교(순수 함수). */
export const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;

/** a 가 b 보다 새 버전인지(x.y.z 숫자 비교: 0.10.0 > 0.9.0) */
export function isNewerVersion(a: string, b: string): boolean {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d > 0;
  }
  return false;
}
