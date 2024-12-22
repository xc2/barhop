/**
 * Convert data source to Uint8Array
 * @param data
 * @param byteOffset
 * @param byteLength
 */
export function toUint8Array(
  data: ArrayBuffer | Uint8Array | number | string | Array<number>,
  byteOffset?: number,
  byteLength?: number
) {
  if (typeof data === "number") {
    data = new Uint8Array([data]);
  } else if (typeof data === "string") {
    try {
      data = new TextEncoder().encode(data);
    } catch {
      data = Uint8Array.from(data as string, (c) => c.charCodeAt(0));
    }
  }
  if (data instanceof ArrayBuffer) {
    return new Uint8Array(data, byteOffset, byteLength);
  }
  if (Array.isArray(data)) {
    data = new Uint8Array(data);
  }
  const view = data as Uint8Array;
  return new Uint8Array(view.buffer, byteOffset ?? view.byteOffset, byteLength ?? view.byteLength);
}

/**
 * Concatenate multiple Uint8Array or ArrayBuffer into a single Uint8Array
 * @param arrays
 */
export function concatUint8(...arrays: (Uint8Array | ArrayBuffer)[]) {
  const views = arrays.map((a) => toUint8Array(a));

  const totalLength = views.reduce((sum, view) => sum + view.byteLength, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const view of views) {
    result.set(view, offset);
    offset += view.byteLength;
  }
  return result;
}

/**
 * base64 encoding chunk by chunk
 * @param data
 */
export function toBase64(data: Uint8Array | ArrayBuffer) {
  const view = toUint8Array(data);
  let base64 = "";
  for (let i = 0; i < view.byteLength; i += 3) {
    const chunk = view.subarray(i, i + 3);
    base64 += btoa(String.fromCharCode(...chunk));
  }
  return base64;
}
