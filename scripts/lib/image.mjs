// PNG·ICO 인코더(외부 라이브러리 없이 Node 내장 zlib 만 사용). 앱 아이콘 생성에 쓴다.
import zlib from 'node:zlib';

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(zlib.crc32(body) >>> 0);
  return Buffer.concat([length, body, crc]);
}

/** RGBA(픽셀당 4바이트, 위에서 아래로) 비트맵을 PNG 로 인코딩한다. */
export function encodePng(width, height, rgba) {
  if (rgba.length !== width * height * 4) throw new Error('비트맵 크기가 맞지 않습니다');
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height); // 줄마다 필터 바이트(0) 하나가 앞에 붙는다
  for (let y = 0; y < height; y++) {
    Buffer.from(rgba.buffer, rgba.byteOffset + y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // 비트 깊이
  header[9] = 6; // RGBA
  return Buffer.concat([
    PNG_SIGNATURE,
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/**
 * PNG 이미지들을 담은 ICO 를 만든다(Windows Vista 이상은 PNG 를 그대로 담을 수 있다).
 * images: [{ size, png }]  size 는 한 변의 픽셀(최대 256)
 */
export function encodeIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // 예약
  header.writeUInt16LE(1, 2); // 1 = 아이콘
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + 16 * images.length;
  const entries = [];
  for (const { size, png } of images) {
    if (size < 1 || size > 256) throw new Error('ICO 항목은 1~256px 이어야 합니다');
    const e = Buffer.alloc(16);
    e[0] = size === 256 ? 0 : size; // 0 은 256 을 뜻한다
    e[1] = size === 256 ? 0 : size;
    e[2] = 0; // 팔레트 없음
    e[3] = 0;
    e.writeUInt16LE(1, 4); // 색 평면
    e.writeUInt16LE(32, 6); // 비트 수
    e.writeUInt32LE(png.length, 8);
    e.writeUInt32LE(offset, 12);
    entries.push(e);
    offset += png.length;
  }
  return Buffer.concat([header, ...entries, ...images.map((i) => i.png)]);
}
