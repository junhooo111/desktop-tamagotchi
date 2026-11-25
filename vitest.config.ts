import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 테스트 파일이 많아져 전체를 병렬로 돌리면 jsdom 파일의 첫 테스트가 5초(기본값)를 넘길 때가 있다.
    // 단독으로 돌리면 3초 안에 끝나는 부하 문제라서 제한만 늘린다.
    testTimeout: 20_000,
  },
});
