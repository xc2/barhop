import { parsePEM } from "./internals/pem";
import { pkcs1To8 } from "./internals/rsa";

export class EncryptedKeyNotSupported extends Error {
  constructor() {
    super("Encrypted keys are not supported currently");
  }
}
export class UnsupportedKeyType extends Error {
  constructor(type: string) {
    super(`Only PKCS#1 and PKCS#8 private keys are supported. Received: ${type}`);
  }
}

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
  }
  key = new Uint8Array(key);
}

export function importKey(key: string | Uint8Array | ArrayBuffer) {
  if (typeof key === "string") {
    // PEM
    const { type, header, body } = parsePEM(key);
  }
}
