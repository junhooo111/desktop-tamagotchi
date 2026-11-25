import zlib from 'node:zlib';
import { describe, expect, it } from 'vitest';
// @ts-expect-error 순수 JS 모듈(타입 선언 없음)
import { encodeIco, encodePng } from './image.mjs';

const solid = (w: number, h: number, rgba: [number, number, number, number]): Uint8Array => {
  const data = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) data.set(rgba, i * 4);
  return data;
};

describe('encodePng', () => {
  it('PNG 서명과 크기 정보를 담고, 압축을 풀면 원래 픽셀이 나온다', () => {
    const png: Buffer = encodePng(3, 2, solid(3, 2, [10, 20, 30, 255]));
    expect([...png.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    expect(png.subarray(12, 16).toString('ascii')).toBe('IHDR');
    expect(png.readUInt32BE(16)).toBe(3);
    expect(png.readUInt32BE(20)).toBe(2);
    expect([png[24], png[25]]).toEqual([8, 6]); // 8비트 RGBA

    const idatAt = png.indexOf('IDAT');
    const length = png.readUInt32BE(idatAt - 4);
    const raw = zlib.inflateSync(png.subarray(idatAt + 4, idatAt + 4 + length));
    expect(raw.length).toBe((3 * 4 + 1) * 2); // 줄마다 필터 바이트 1개
    expect([...raw.subarray(0, 5)]).toEqual([0, 10, 20, 30, 255]);
  });

  it('IEND 로 끝나고 각 덩어리의 CRC 가 맞는다', () => {
    const png: Buffer = encodePng(1, 1, solid(1, 1, [0, 0, 0, 0]));
    expect(png.subarray(png.length - 8, png.length - 4).toString('ascii')).toBe('IEND');
    let pos = 8;
    while (pos < png.length) {
      const len = png.readUInt32BE(pos);
      const body = png.subarray(pos + 4, pos + 8 + len);
      expect(png.readUInt32BE(pos + 8 + len)).toBe(zlib.crc32(body) >>> 0);
      pos += 12 + len;
    }
  });

  it('비트맵 크기가 맞지 않으면 거부한다', () => {
    expect(() => encodePng(2, 2, new Uint8Array(5))).toThrow();
  });
});

describe('encodeIco', () => {
  const png16: Buffer = encodePng(16, 16, solid(16, 16, [1, 2, 3, 255]));
  const png256: Buffer = encodePng(256, 256, solid(256, 256, [1, 2, 3, 255]));

  it('헤더에 개수를 적고, 각 항목이 가리키는 위치에 해당 PNG 가 있다', () => {
    const ico: Buffer = encodeIco([
      { size: 16, png: png16 },
      { size: 256, png: png256 },
    ]);
    expect([ico.readUInt16LE(0), ico.readUInt16LE(2), ico.readUInt16LE(4)]).toEqual([0, 1, 2]);

    const entry = (i: number) => ({
      width: ico[6 + i * 16],
      height: ico[7 + i * 16],
      bytes: ico.readUInt32LE(14 + i * 16),
      offset: ico.readUInt32LE(18 + i * 16),
    });
    expect(entry(0)).toMatchObject({ width: 16, height: 16, bytes: png16.length });
    expect(entry(1)).toMatchObject({ width: 0, height: 0, bytes: png256.length }); // 0 = 256
    expect(ico.subarray(entry(0).offset, entry(0).offset + png16.length).equals(png16)).toBe(true);
    expect(ico.subarray(entry(1).offset, entry(1).offset + png256.length).equals(png256)).toBe(true);
    expect(ico.length).toBe(6 + 32 + png16.length + png256.length);
  });

  it('256 을 넘는 크기는 거부한다', () => {
    expect(() => encodeIco([{ size: 512, png: png16 }])).toThrow();
  });
});
