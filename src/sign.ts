import { EncryptedKeyNotSupported, UnsupportedKeyType } from "./exceptions";
import { PrivateKeyType, pkcs1To8, validatePKCS1Or8 } from "./internals/crypto/rsa";
import { parsePEM } from "./internals/encoding/pem";
import { toBase64, toUint8Array } from "./internals/lang";

// MARK: key
export function toPKCS8(key: string | Uint8Array | ArrayBuffer): Uint8Array {
  if (typeof key === "string") {
    // PEM
    const { type, header, body } = parsePEM(key);
    if (type === "RSA PRIVATE KEY") {
      // PKCS#1
      if (header["Proc-Type"]?.[1] === "ENCRYPTED") {
        throw new EncryptedKeyNotSupported();
      }
      return pkcs1To8(body);
    } else if (type === "ENCRYPTED PRIVATE KEY") {
      throw new EncryptedKeyNotSupported();
    } else if (type === "PRIVATE KEY") {
      // PKCS#1
      return body;
    } else {
      throw new UnsupportedKeyType(type);
    }
  } else {
    const view = new Uint8Array(key);
    const pkcsType = validatePKCS1Or8(view);
    if (pkcsType === PrivateKeyType.LegacyRSA) {
      return pkcs1To8(view);
    } else if (pkcsType === PrivateKeyType.PKCS8RSA) {
      return view;
    } else if (pkcsType === PrivateKeyType.EncryptedPKCS8RSA) {
      throw new EncryptedKeyNotSupported();
    } else {
      throw new UnsupportedKeyType();
    }
  }
}

export async function importKey(key: string | Uint8Array | ArrayBuffer) {
  const keyData = toPKCS8(key);
  return crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    true,
    ["sign"]
  );
}
// MARK: - key -

// MARK: sign
export interface DataToSign {
  method: string;
  path: string;
  body?: string | ArrayBuffer | Uint8Array | null;
  userId: string | number;
  time?: Date;
  apiVer?: string | number;
}
export function canonicalizeMethod(method: string | undefined) {
  return (method || "GET").toUpperCase();
}

export function canonicalizePath(path: string | undefined) {
  path = (path || "/").replace(/^\/+/g, "/");
  let { pathname } = new URL(path, "https://example.com");
  pathname = pathname.replace(/^\/+/g, "/");
  pathname = pathname.replace(/\/+$/g, "");
  return pathname;
}
export async function hashBody(
  body: DataToSign["body"] | undefined,
  digest: "SHA-1" | "SHA-256" = "SHA-256"
) {
  const view = toUint8Array(body ?? []);
  // convert Uint8Array to base64 string
  return crypto.subtle.digest(digest, view).then((v) => toBase64(v));
}
export function canonicalizeTime(time: Date | undefined) {
  time = time ?? new Date();
  return time.toISOString().replace(/\.\d{3}Z$/, "Z");
}
export function canonicalizeUserId(userId: string | number) {
  return `${userId ?? ""}`;
}
export function canonicalizeData(data: DataToSign): [string, string | PromiseLike<string>][] {
  return [
    ["Method", canonicalizeMethod(data.method)],
    ["Path", canonicalizePath(data.path)],
    ["X-Ops-Content-Hash", hashBody(data.body)],
    ["X-Ops-Sign", "version=1.3"], // Only version 1.3 is supported as Web CRYPTO API does not support sign without digest
    ["X-Ops-Timestamp", canonicalizeTime(data.time)],
    ["X-Ops-UserId", canonicalizeUserId(data.userId)],
    ["X-Ops-Server-API-Version", `${data.apiVer ?? 0}`],
  ];
}

export async function sign(key: CryptoKey | PromiseLike<CryptoKey>, data: DataToSign) {
  const canonicalized = canonicalizeData(data);
  const headers: Record<string, string> = {};
  const dataToSign = [];
  for (const [key, value] of canonicalized) {
    const v = typeof value === "string" ? value : await value;
    headers[key] = v;
    dataToSign.push(`${key}:${v}`);
  }
  const signature = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    await key,
    toUint8Array(dataToSign.join("\n"))
  );
  const base64Signature = toBase64(signature, 60).split("\n");
  for (let i = 0; i < base64Signature.length; i++) {
    headers[`X-Ops-Authorization-${i + 1}`] = base64Signature[i];
  }
  return headers;
}
// MARK: - sign -
