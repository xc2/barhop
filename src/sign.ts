import { parsePEM } from "./internals/pem";
import { pkcs1To8, validatePKCS1Or8 } from "./internals/rsa";

export class EncryptedKeyNotSupported extends Error {
  constructor() {
    super("Encrypted keys are not supported currently");
  }
}
export class UnsupportedKeyType extends Error {
  constructor(type?: string) {
    super(
      `Only PKCS#1 and PKCS#8 private keys are supported.` + (type ? ` Received: ${type}` : "")
    );
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
  } else {
    const view = new Uint8Array(key);
    const pkcsType = validatePKCS1Or8(view);
    if (pkcsType === "RSAPrivateKey") {
      return pkcs1To8(view);
    } else if (pkcsType === "PrivateKeyInfo") {
      return view;
    } else if (pkcsType === "EncryptedPrivateKeyInfo") {
      throw new EncryptedKeyNotSupported();
    } else {
      throw new UnsupportedKeyType();
    }
  }
}

export function importKey(key: string | Uint8Array | ArrayBuffer) {
  const keyData = toPKCS8(key);
  return crypto.subtle.importKey(
    "pkcs8",
    keyData,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    true,
    ["sign"]
  );
}
