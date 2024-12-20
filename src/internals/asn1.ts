import { concatUint8, toUint8Array } from "./lang";

export function parseASN1(
  data: Uint8Array | ArrayBuffer,
  byteOffset?: number,
  byteLength?: number
) {
  return {
    [Symbol.iterator]: iterBlock(data, byteOffset, byteLength),
  };
}
export interface BlockIter {
  tag: number;
  value: Uint8Array;
  sub: () => Generator<BlockIter, void, unknown>;
}
export function* iterBlock(
  data: Uint8Array | ArrayBuffer,
  byteOffset?: number,
  byteLength?: number
): Generator<BlockIter, void, unknown> {
  const view = toUint8Array(data, byteOffset, byteLength);
  let offset = 0;
  while (offset < view.byteLength) {
    const tag = view[offset];
    offset++;
    let length = view[offset];
    offset++;
    if (length & 0x80) {
      const lengthBytes = length & 0x7f;
      length = 0;
      for (let i = 0; i < lengthBytes; i++) {
        length = length * 0x100 + view[offset];
        offset++;
      }
    }

    const value = view.subarray(offset, offset + length);
    offset += length;
    yield { tag, value, sub: iterBlock.bind(null, value, undefined, undefined) };
  }
}
export function buildBlock(
  tag: number,
  value: Uint8Array | ArrayBuffer | number | string | Array<number> | null
) {
  const body = toUint8Array(value ?? []);
  const length = body.byteLength;
  const lengthBytes = length < 0x80 ? 0 : Math.ceil(Math.log2(length) / 8);
  const header = new Uint8Array(2 + lengthBytes);
  header[0] = tag;
  if (lengthBytes === 0) {
    header[1] = length;
  } else {
    header[1] = 0x80 + lengthBytes;
    for (let i = 0; i < lengthBytes; i++) {
      header[2 + i] = (length >> ((lengthBytes - i - 1) * 8)) & 0xff;
    }
  }
  return concatUint8(header, body);
}

export function decodeOID(bytes: ArrayLike<number>) {
  // First byte = 40*x + y where x is first subidentifier and y is second
  const firstByte = bytes[0];
  const x = Math.floor(firstByte / 40);
  const y = firstByte % 40;

  const values = [x, y];

  let value = 0;
  // Process remaining bytes
  for (let i = 1; i < bytes.length; i++) {
    // Check if high bit is set (continuation byte)
    if (bytes[i] & 0x80) {
      // Remove highest bit and add remaining 7 bits to value
      value = (value << 7) | (bytes[i] & 0x7f);
    } else {
      // Last byte of this subidentifier
      value = (value << 7) | bytes[i];
      values.push(value);
      value = 0;
    }
  }

  return values.join(".");
}

export function getOID(algoIdentifier: Uint8Array) {
  const algoIter = iterBlock(algoIdentifier);
  const oid = algoIter.next().value;
  if (oid?.tag !== 0x06) {
    return null;
  }
  return decodeOID(oid.value);
}
