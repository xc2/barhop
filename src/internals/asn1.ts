export function parseAsn1(data: Uint8Array | ArrayBuffer, byteOffset?: number) {
  if (data instanceof Uint8Array) {
    byteOffset = data.byteOffset;
    data = data.buffer;
  }
  let offset = 0;
  const view = new DataView(data, byteOffset);
  console.log(view);
  return {
    *[Symbol.iterator]() {
      while (offset < data.byteLength) {
        const tag = view.getUint8(offset);
        offset++;
        let length = view.getUint8(offset);
        offset++;
        if (length & 0x80) {
          const lengthBytes = length & 0x7f;
          length = 0;
          for (let i = 0; i < lengthBytes; i++) {
            length = length * 0x100 + view.getUint8(offset);
            offset++;
          }
        }
        const value = new Uint8Array(data, offset, length);
        offset += length;
        yield { tag, value };
      }
    },
  };
}
